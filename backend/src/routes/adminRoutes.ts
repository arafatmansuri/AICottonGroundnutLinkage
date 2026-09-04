import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../database/client';
import { aiOrchestrator } from '../orchestrator/aiOrchestrator';
import { paginationSchema, validate } from '../validators/schemas';

// The Prisma generated client may be stale (prisma generate not yet re-run after
// schema changes). Cast audit log data to avoid compile-time failures.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuditInput = any;

const router = Router();
router.use(authenticate, authorize('ADMIN'));

// ─── Platform statistics ──────────────────────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      farmers, buyers, verifiedBuyers, activeCrops, activeOffers,
      completedTx, marketRecords, aiRequests, pendingNotifications,
    ] = await Promise.all([
      prisma.farmerProfile.count(),
      prisma.buyerProfile.count(),
      prisma.buyerProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.farmerCrop.count({ where: { isActive: true } }),
      prisma.buyerOffer.count({ where: { isActive: true } }),
      prisma.transaction.count({ where: { status: 'COMPLETED' } }),
      prisma.marketPrice.count(),
      prisma.aIRequest.count(),
      prisma.notification.count({ where: { isRead: false } }),
    ]);
    res.json({
      success: true,
      data: {
        farmers, buyers, verifiedBuyers, activeCrops, activeOffers,
        completedTransactions: completedTx, marketRecords, aiRequests,
        pendingNotifications,
      },
    });
  } catch (e) { next(e); }
});

// ─── Farmers ─────────────────────────────────────────────────────────────────
router.get('/farmers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const [farmers, total] = await Promise.all([
      prisma.farmerProfile.findMany({
        skip, take: limit,
        include: { user: { select: { email: true, status: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.farmerProfile.count(),
    ]);
    res.json({ success: true, data: { farmers, total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
});

// Suspend / reactivate a farmer
router.patch('/farmers/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });
    if (!farmer) { res.status(404).json({ success: false, error: { message: 'Farmer not found' } }); return; }

    await prisma.user.update({
      where: { id: farmer.userId },
      data: { status },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: status === 'SUSPENDED' ? 'SUSPEND' : 'UPDATE',
        entity: 'USER',
        entityId: farmer.userId,
        details: { newStatus: status },
      } as AuditInput,
    });

    res.json({ success: true, message: `Farmer ${status.toLowerCase()}` });
  } catch (e) { next(e); }
});

// ─── Buyers ──────────────────────────────────────────────────────────────────
router.get('/buyers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (req.query.verificationStatus) where.verificationStatus = req.query.verificationStatus;

    const [buyers, total, verifiedCount, pendingCount] = await Promise.all([
      prisma.buyerProfile.findMany({
        skip, take: limit, where,
        include: {
          user: { select: { email: true, status: true, createdAt: true } },
          offers: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.buyerProfile.count({ where }),
      prisma.buyerProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.buyerProfile.count({ where: { verificationStatus: 'PENDING' } }),
    ]);
    res.json({
      success: true,
      data: { buyers, total, page, limit, totalPages: Math.ceil(total / limit), verifiedCount, pendingCount },
    });
  } catch (e) { next(e); }
});

// Verify or reject buyer
router.patch('/buyers/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body;
    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      res.status(400).json({ success: false, error: { message: 'Status must be VERIFIED or REJECTED' } });
      return;
    }
    const buyer = await prisma.buyerProfile.findUnique({ where: { id: req.params.id } });
    if (!buyer) { res.status(404).json({ success: false, error: { message: 'Buyer not found' } }); return; }

    await prisma.$transaction([
      prisma.buyerProfile.update({
        where: { id: req.params.id },
        data: { verificationStatus: status, verifiedAt: status === 'VERIFIED' ? new Date() : null, verifiedBy: req.user!.id },
      }),
      prisma.buyerVerification.upsert({
        where: { buyerProfileId: req.params.id },
        create: { buyerProfileId: req.params.id, status, notes, reviewedBy: req.user!.id, reviewedAt: new Date() },
        update: { status, notes, reviewedBy: req.user!.id, reviewedAt: new Date() },
      }),
    ]);

    // Notify buyer
    await prisma.notification.create({
      data: {
        userId: buyer.userId,
        type: 'SYSTEM',
        title: status === 'VERIFIED' ? 'Account Verified!' : 'Verification Update',
        message: status === 'VERIFIED'
          ? 'Congratulations! Your buyer account has been verified. You can now post offers visible to all farmers.'
          : `Your verification was not approved. ${notes || 'Please contact support for details.'}`,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'VERIFY',
        entity: 'BUYER_PROFILE',
        entityId: req.params.id,
        details: { status, notes },
      } as AuditInput,
    });

    res.json({ success: true, message: `Buyer ${status.toLowerCase()}` });
  } catch (e) { next(e); }
});

// ─── Transactions ─────────────────────────────────────────────────────────────
router.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (req.query.status) where.status = req.query.status;

    const [transactions, total, completedCount, activeCount, disputedCount] = await Promise.all([
      prisma.transaction.findMany({
        where, skip, take: limit,
        include: {
          farmerProfile: true,
          buyerProfile: true,
          farmerCrop: { include: { crop: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.transaction.count({ where: { ...where, status: { in: ['OFFER_SENT', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS'] } } }),
      prisma.transaction.count({ where: { ...where, status: 'DISPUTED' } }),
    ]);

    res.json({
      success: true,
      data: { transactions, total, page, limit, totalPages: Math.ceil(total / limit), completedCount, activeCount, disputedCount },
    });
  } catch (e) { next(e); }
});

// Resolve dispute (admin can force-complete or cancel)
router.patch('/transactions/:id/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action } = req.body; // 'COMPLETED' | 'CANCELLED'
    if (!['COMPLETED', 'CANCELLED'].includes(action)) {
      res.status(400).json({ success: false, error: { message: 'Action must be COMPLETED or CANCELLED' } });
      return;
    }
    const tx = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!tx) { res.status(404).json({ success: false, error: { message: 'Transaction not found' } }); return; }

    const history = (tx.statusHistory as any[]) || [];
    history.push({ status: action, timestamp: new Date().toISOString(), by: req.user!.id, role: 'ADMIN' });

    await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status: action as any, statusHistory: history, completedAt: action === 'COMPLETED' ? new Date() : undefined },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'STATUS_CHANGE',
        entity: 'TRANSACTION',
        entityId: req.params.id,
        details: { from: tx.status, to: action, resolvedByAdmin: true },
      } as AuditInput,
    });

    res.json({ success: true, message: `Transaction ${action.toLowerCase()}` });
  } catch (e) { next(e); }
});

// ─── Market Prices ────────────────────────────────────────────────────────────
router.post('/market-prices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mandiId, cropId, minPrice, maxPrice, modalPrice, arrivalQuantity, priceDate } = req.body;
    const price = await prisma.marketPrice.create({
      data: {
        mandiId, cropId,
        minPrice: Number(minPrice) || modalPrice,
        maxPrice: Number(maxPrice) || modalPrice,
        modalPrice: Number(modalPrice),
        arrivalQty: arrivalQuantity ? Number(arrivalQuantity) : undefined,
        priceDate: new Date(priceDate),
        source: 'ADMIN',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        entity: 'MARKET_PRICE',
        entityId: price.id,
        details: { cropId, mandiId, modalPrice, priceDate },
      } as AuditInput,
    });

    res.status(201).json({ success: true, data: price });
  } catch (e) { next(e); }
});

// ─── AI Monitoring ────────────────────────────────────────────────────────────
router.get('/ai-monitoring', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [agents, recentRequests, totalRequests, intentBreakdown] = await Promise.all([
      aiOrchestrator.getAgentStatus(),
      prisma.aIRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { user: { select: { email: true } } },
      }),
      prisma.aIRequest.count(),
      prisma.aIRequest.groupBy({ by: ['intent'], _count: { intent: true } }),
    ]);

    const successCount = recentRequests.filter(r => r.success).length;
    const overallSuccessRate = recentRequests.length ? successCount / recentRequests.length : 1;
    const avgExecutionMs = recentRequests.length
      ? recentRequests.reduce((s, r) => s + (r.executionMs || 0), 0) / recentRequests.length
      : 0;

    res.json({
      success: true,
      data: { agents, recentRequests, totalRequests, intentBreakdown, overallSuccessRate, avgExecutionMs },
    });
  } catch (e) { next(e); }
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (req.query.action) where.action = req.query.action;
    if (req.query.entityType) where.entityType = req.query.entityType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, skip, take: limit,
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, data: { logs, total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
});

// ─── Settings (stub) ──────────────────────────────────────────────────────────
router.get('/settings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        aiProvider: process.env.AI_PROVIDER || 'MOCK',
        storageCostPerUnit: 50,
        storageDurationDays: 30,
        buyerMatchingWeights: { price: 50, distance: 30, rating: 20 },
      },
    });
  } catch (e) { next(e); }
});

router.put('/settings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // In production: persist to a settings table or env
    res.json({ success: true, message: 'Settings updated (runtime only in demo mode)' });
  } catch (e) { next(e); }
});

// ─── System Health ────────────────────────────────────────────────────────────
router.get('/system-health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let dbStatus = 'ok';
    try { await prisma.$queryRaw`SELECT 1`; } catch { dbStatus = 'error'; }
    res.json({
      success: true,
      data: {
        database: dbStatus,
        aiProvider: process.env.AI_PROVIDER || 'MOCK',
        uptime: process.uptime(),
      },
    });
  } catch (e) { next(e); }
});

// ─── User status ──────────────────────────────────────────────────────────────
router.patch('/users/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status },
      select: { id: true, email: true, status: true },
    });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

export default router;
