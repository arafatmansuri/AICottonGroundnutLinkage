import prisma from '../database/client';
import { BusinessLogicError, NotFoundError } from '../middleware/errorHandler';
import logger from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuditInput = any;

type TransactionStatus = 'OFFER_CREATED' | 'OFFER_SENT' | 'ACCEPTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | 'DISPUTED';

// Valid state transitions
const VALID_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  OFFER_CREATED: ['OFFER_SENT', 'CANCELLED'],
  OFFER_SENT: ['ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  ACCEPTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
  DISPUTED: ['COMPLETED', 'CANCELLED'],
};

function canTransition(from: TransactionStatus, to: TransactionStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Audit log helper ─────────────────────────────────────────────────────────
async function createAuditLog(params: {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: object;
  ipAddress?: string;
}) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.auditLog.create({ data: params as any });
  } catch (err) {
    logger.error('Failed to write audit log:', err);
  }
}

// ─── Notification helper ──────────────────────────────────────────────────────
async function sendTransactionNotification(params: {
  targetUserId: string;
  title: string;
  message: string;
  type?: string;
  transactionId?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.targetUserId,
        title: params.title,
        message: params.message,
        type: (params.type || 'TRANSACTION_UPDATE') as any,
        data: params.transactionId ? { transactionId: params.transactionId } : {},
      },
    });
  } catch (err) {
    logger.error('Failed to send notification:', err);
  }
}

export async function createTransaction(input: {
  farmerUserId: string;
  buyerOfferId: string;
  farmerCropId: string;
  quantity: number;
  idempotencyKey?: string;
}) {
  // Idempotency: return existing transaction for same key
  if (input.idempotencyKey) {
    const existing = await prisma.transaction.findFirst({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { idempotencyKey: input.idempotencyKey } as any,
    });
    if (existing) return existing;
  }

  return prisma.$transaction(async (tx: any) => {
    // Get farmer profile
    const farmerProfile = await tx.farmerProfile.findUnique({
      where: { userId: input.farmerUserId },
    });
    if (!farmerProfile) throw new NotFoundError('Farmer profile');

    // Ownership check: crop must belong to this farmer
    const farmerCrop = await tx.farmerCrop.findFirst({
      where: { id: input.farmerCropId, farmerProfileId: farmerProfile.id, isActive: true },
    });
    if (!farmerCrop) throw new NotFoundError('Farmer crop');

    if (input.quantity <= 0) throw new BusinessLogicError('Quantity must be positive');
    if (farmerCrop.availableQuantity < input.quantity) {
      throw new BusinessLogicError(
        `Insufficient quantity. Available: ${farmerCrop.availableQuantity}, Requested: ${input.quantity}`,
        'INSUFFICIENT_QUANTITY'
      );
    }

    // Get buyer offer
    const buyerOffer = await tx.buyerOffer.findFirst({
      where: { id: input.buyerOfferId, isActive: true },
      include: { buyerProfile: { include: { user: true } } },
    });
    if (!buyerOffer) throw new NotFoundError('Buyer offer');
    if (input.quantity < buyerOffer.minQuantity || input.quantity > buyerOffer.maxQuantity) {
      throw new BusinessLogicError(
        `Quantity must be between ${buyerOffer.minQuantity} and ${buyerOffer.maxQuantity}`,
        'QUANTITY_OUT_OF_RANGE'
      );
    }

    // Calculate transport and net realization
    const transportCost = calculateTransportCost(
      (farmerProfile as any).district || 'Ahmedabad',
      buyerOffer.district,
      input.quantity
    );
    const netRealization = buyerOffer.offeredPrice - transportCost / input.quantity;

    // Create transaction — status starts as OFFER_SENT (farmer has sent to buyer)
    const transaction = await tx.transaction.create({
      data: {
        farmerProfileId: farmerProfile.id,
        buyerProfileId: buyerOffer.buyerProfileId,
        farmerCropId: input.farmerCropId,
        buyerOfferId: input.buyerOfferId,
        quantity: input.quantity,
        agreedPrice: buyerOffer.offeredPrice,
        transportCost,
        netRealization,
        status: 'OFFER_SENT',
        statusHistory: [
          { status: 'OFFER_CREATED', timestamp: new Date().toISOString() },
          { status: 'OFFER_SENT', timestamp: new Date().toISOString(), by: input.farmerUserId },
        ],
        idempotencyKey: input.idempotencyKey,
      },
    });

    // Reserve inventory atomically
    await tx.farmerCrop.update({
      where: { id: input.farmerCropId },
      data: { availableQuantity: farmerCrop.availableQuantity - input.quantity },
    });

    // Audit log
    await createAuditLog({
      userId: input.farmerUserId,
      action: 'CREATE',
      entity: 'TRANSACTION',
      entityId: transaction.id,
      details: { quantity: input.quantity, buyerOfferId: input.buyerOfferId, status: 'OFFER_SENT' },
    });

    return transaction;
  }).then(async (transaction) => {
    // Post-transaction notifications (outside the atomic transaction to avoid holding the lock)
    const buyerOffer = await prisma.buyerOffer.findUnique({
      where: { id: input.buyerOfferId },
      include: { buyerProfile: { include: { user: true } } },
    });
    const farmerCrop = await prisma.farmerCrop.findUnique({
      where: { id: input.farmerCropId },
      include: { crop: true },
    });
    const cropName = (farmerCrop as any)?.crop?.name || 'Crop';
    const qty = input.quantity;

    if (buyerOffer?.buyerProfile?.userId) {
      await sendTransactionNotification({
        targetUserId: buyerOffer.buyerProfile.userId,
        title: 'New Purchase Offer Received',
        message: `A farmer has sent you a purchase offer for ${qty} qtl of ${cropName}.`,
        type: 'TRANSACTION_UPDATE',
        transactionId: transaction.id,
      });
    }

    await sendTransactionNotification({
      targetUserId: input.farmerUserId,
      title: 'Offer Sent to Buyer',
      message: `Your offer for ${qty} qtl of ${cropName} has been sent to the buyer.`,
      type: 'TRANSACTION_UPDATE',
      transactionId: transaction.id,
    });

    return transaction;
  });
}

export async function updateTransactionStatus(
  transactionId: string,
  newStatus: TransactionStatus,
  userId: string,
  userRole: string
) {
  return prisma.$transaction(async (tx: any) => {
    const transaction = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: {
        farmerProfile: { include: { user: true } },
        buyerProfile: { include: { user: true } },
        farmerCrop: { include: { crop: true } },
      },
    });
    if (!transaction) throw new NotFoundError('Transaction');

    // Ownership checks
    if (userRole === 'FARMER' && transaction.farmerProfile.userId !== userId) {
      throw new BusinessLogicError('Not authorized to update this transaction');
    }
    if (userRole === 'BUYER' && transaction.buyerProfile.userId !== userId) {
      throw new BusinessLogicError('Not authorized to update this transaction');
    }

    if (!canTransition(transaction.status, newStatus)) {
      throw new BusinessLogicError(
        `Cannot transition from ${transaction.status} to ${newStatus}`,
        'INVALID_STATE_TRANSITION'
      );
    }

    const history = (transaction.statusHistory as any[]) || [];
    history.push({ status: newStatus, timestamp: new Date().toISOString(), by: userId });

    const updatedTx = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: newStatus,
        statusHistory: history,
        completedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
      },
    });

    // Finalize inventory on completion
    if (newStatus === 'COMPLETED') {
      await tx.farmerCrop.update({
        where: { id: transaction.farmerCropId },
        data: { soldQuantity: { increment: transaction.quantity } },
      });
      await tx.buyerProfile.update({
        where: { id: transaction.buyerProfileId },
        data: { totalTransactions: { increment: 1 } },
      });
    }

    // Release inventory on cancel/reject
    if (newStatus === 'CANCELLED' || newStatus === 'REJECTED') {
      if (transaction.status !== 'COMPLETED') {
        await tx.farmerCrop.update({
          where: { id: transaction.farmerCropId },
          data: { availableQuantity: { increment: transaction.quantity } },
        });
      }
    }

    return { updatedTx, transaction };
  }).then(async ({ updatedTx, transaction }) => {
    const cropName = transaction.farmerCrop?.crop?.name || 'crop';
    const qty = transaction.quantity;

    // Audit log
    await createAuditLog({
      userId,
      action: 'STATUS_CHANGE',
      entity: 'TRANSACTION',
      entityId: transactionId,
      details: { from: transaction.status, to: newStatus },
    });

    // Notify both parties on state change
    const farmerUserId = transaction.farmerProfile?.userId;
    const buyerUserId = transaction.buyerProfile?.userId;

    const messages: Record<string, { title: string; message: string }> = {
      ACCEPTED: {
        title: 'Offer Accepted!',
        message: `Buyer accepted your offer for ${qty} qtl of ${cropName}.`,
      },
      REJECTED: {
        title: 'Offer Rejected',
        message: `Your offer for ${qty} qtl of ${cropName} was rejected by the buyer.`,
      },
      CONFIRMED: {
        title: 'Purchase Confirmed',
        message: `Transaction for ${qty} qtl of ${cropName} is now confirmed.`,
      },
      IN_PROGRESS: {
        title: 'Transaction In Progress',
        message: `Dispatch/pickup for ${qty} qtl of ${cropName} is in progress.`,
      },
      COMPLETED: {
        title: '🎉 Transaction Completed',
        message: `Transaction for ${qty} qtl of ${cropName} completed successfully.`,
      },
      CANCELLED: {
        title: 'Transaction Cancelled',
        message: `Transaction for ${qty} qtl of ${cropName} has been cancelled.`,
      },
      DISPUTED: {
        title: 'Dispute Raised',
        message: `A dispute has been raised for the ${cropName} transaction.`,
      },
    };

    const notif = messages[newStatus];
    if (notif) {
      if (farmerUserId) {
        await sendTransactionNotification({
          targetUserId: farmerUserId,
          title: notif.title,
          message: notif.message,
          type: newStatus === 'COMPLETED' ? 'PAYMENT_RECEIVED' : 'TRANSACTION_UPDATE',
          transactionId,
        });
      }
      if (buyerUserId) {
        await sendTransactionNotification({
          targetUserId: buyerUserId,
          title: notif.title,
          message: notif.message,
          type: newStatus === 'COMPLETED' ? 'PAYMENT_RECEIVED' : 'TRANSACTION_UPDATE',
          transactionId,
        });
      }
    }

    return updatedTx;
  });
}

export async function getTransactions(userId: string, role: string, params: {
  status?: string; page: number; limit: number;
}) {
  const { status, page, limit } = params;
  const skip = (page - 1) * limit;

  let profileWhere: any = {};
  if (role === 'FARMER') {
    const fp = await prisma.farmerProfile.findUnique({ where: { userId } });
    if (!fp) throw new NotFoundError('Profile');
    profileWhere = { farmerProfileId: fp.id };
  } else if (role === 'BUYER') {
    const bp = await prisma.buyerProfile.findUnique({ where: { userId } });
    if (!bp) throw new NotFoundError('Profile');
    profileWhere = { buyerProfileId: bp.id };
  }

  const where: any = { ...profileWhere };
  if (status) where.status = status;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        farmerProfile: true,
        buyerProfile: true,
        farmerCrop: { include: { crop: true } },
        buyerOffer: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Distance-based transport cost calculation
function calculateTransportCost(fromDistrict: string, toDistrict: string, quantity: number): number {
  const distanceMap: Record<string, Record<string, number>> = {
    Ahmedabad: { Rajkot: 216, Surendranagar: 125, Bhavnagar: 170, Anand: 70, Ahmedabad: 0 },
    Rajkot: { Ahmedabad: 216, Surendranagar: 100, Bhavnagar: 160, Rajkot: 0 },
    Surendranagar: { Ahmedabad: 125, Rajkot: 100, Bhavnagar: 130, Surendranagar: 0 },
    Bhavnagar: { Ahmedabad: 170, Rajkot: 160, Bhavnagar: 0 },
    Anand: { Ahmedabad: 70, Anand: 0 },
  };

  const dist = distanceMap[fromDistrict]?.[toDistrict] ??
    distanceMap[toDistrict]?.[fromDistrict] ?? 150;

  const ratePerKmPerQuintal = 2;
  return dist * ratePerKmPerQuintal * quantity;
}

export { calculateTransportCost };
