import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../database/client';
import { aiOrchestrator } from '../orchestrator/aiOrchestrator';
import { paginationSchema, validate } from '../validators/schemas';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

// Platform statistics
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      farmers, buyers, verifiedBuyers, activeCrops, activeOffers,
      completedTx, marketRecords, aiRequests, notifications,
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
        pendingNotifications: notifications,
      },
    });
  } catch (e) { next(e); }
});

// Manage farmers
router.get('/farmers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = validate(paginationSchema, req.query);
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;
    const [farmers, total] = await Promise.all([
      prisma.farmerProfile.findMany({
        skip, take: limit,
        include: { user: { select: { email: true, status: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.farmerProfile.count(),
    ]);
    res.json({ success: true, data: { farmers, total, page, limit } });
  } catch (e) { next(e); }
});

// Manage buyers
router.get('/buyers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = validate(paginationSchema, req.query);
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;
    const [buyers, total] = await Promise.all([
      prisma.buyerProfile.findMany({
        skip, take: limit,
        include: {
          user: { select: { email: true, status: true, createdAt: true } },
          verification: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.buyerProfile.count(),
    ]);
    res.json({ success: true, data: { buyers, total, page, limit } });
  } catch (e) { next(e); }
});

// Verify or reject buyer
router.patch('/buyers/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body;
    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Status must be VERIFIED or REJECTED' } });
      return;
    }

    const buyer = await prisma.buyerProfile.findUnique({ where: { id: req.params.id } });
    if (!buyer) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Buyer not found' } });
      return;
    }

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

    res.json({ success: true, message: `Buyer ${status.toLowerCase()}` });
  } catch (e) { next(e); }
});

// Transactions overview
router.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = validate(paginationSchema, req.query);
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (req.query.status) where.status = req.query.status;
    const [txs, total] = await Promise.all([
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
    ]);
    res.json({ success: true, data: { transactions: txs, total, page, limit } });
  } catch (e) { next(e); }
});

// Market prices management
router.post('/market-prices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mandiId, cropId, minPrice, maxPrice, modalPrice, arrivalQty, priceDate, source } = req.body;
    const price = await prisma.marketPrice.create({
      data: { mandiId, cropId, minPrice, maxPrice, modalPrice, arrivalQty, priceDate: new Date(priceDate), source: source || 'ADMIN' },
    });
    res.status(201).json({ success: true, data: price });
  } catch (e) { next(e); }
});

// AI monitoring
router.get('/ai-monitoring', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await aiOrchestrator.getAgentStatus();
    const recentRequests = await prisma.aIRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { email: true } } },
    });
    res.json({ success: true, data: { agents: data, recentRequests } });
  } catch (e) { next(e); }
});

// Audit logs
router.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = validate(paginationSchema, req.query);
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const logs = await prisma.auditLog.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: logs });
  } catch (e) { next(e); }
});

// User management
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
