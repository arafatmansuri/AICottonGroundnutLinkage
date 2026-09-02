import prisma from '../database/client';
import { BusinessLogicError, NotFoundError } from '../middleware/errorHandler';

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

export async function createTransaction(input: {
  farmerUserId: string;
  buyerOfferId: string;
  farmerCropId: string;
  quantity: number;
}) {
  return prisma.$transaction(async (tx: any) => {
    // Get farmer profile
    const farmerProfile = await tx.farmerProfile.findUnique({
      where: { userId: input.farmerUserId },
    });
    if (!farmerProfile) throw new NotFoundError('Farmer profile');

    // Get farmer crop with lock
    const farmerCrop = await tx.farmerCrop.findFirst({
      where: { id: input.farmerCropId, farmerProfileId: farmerProfile.id, isActive: true },
    });
    if (!farmerCrop) throw new NotFoundError('Farmer crop');
    if (farmerCrop.availableQuantity < input.quantity) {
      throw new BusinessLogicError(
        `Insufficient quantity. Available: ${farmerCrop.availableQuantity}, Requested: ${input.quantity}`,
        'INSUFFICIENT_QUANTITY'
      );
    }
    if (input.quantity <= 0) throw new BusinessLogicError('Quantity must be positive');

    // Get buyer offer
    const buyerOffer = await tx.buyerOffer.findFirst({
      where: { id: input.buyerOfferId, isActive: true },
      include: { buyerProfile: true },
    });
    if (!buyerOffer) throw new NotFoundError('Buyer offer');
    if (input.quantity < buyerOffer.minQuantity || input.quantity > buyerOffer.maxQuantity) {
      throw new BusinessLogicError(
        `Quantity must be between ${buyerOffer.minQuantity} and ${buyerOffer.maxQuantity}`,
        'QUANTITY_OUT_OF_RANGE'
      );
    }

    // Calculate transport and net realization
    const transportCost = calculateTransportCost(farmerCrop.district, buyerOffer.district, input.quantity);
    const netRealization = buyerOffer.offeredPrice - transportCost / input.quantity;

    // Create transaction
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
        status: 'OFFER_CREATED',
        statusHistory: [{ status: 'OFFER_CREATED', timestamp: new Date().toISOString() }],
      },
    });

    // Reserve inventory
    await tx.farmerCrop.update({
      where: { id: input.farmerCropId },
      data: {
        availableQuantity: farmerCrop.availableQuantity - input.quantity,
      },
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
      include: { farmerProfile: true, buyerProfile: true },
    });
    if (!transaction) throw new NotFoundError('Transaction');

    // Role-based permission checks
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

    // If completed, finalize inventory
    if (newStatus === 'COMPLETED') {
      await tx.farmerCrop.update({
        where: { id: transaction.farmerCropId },
        data: {
          soldQuantity: { increment: transaction.quantity },
        },
      });
      await tx.buyerProfile.update({
        where: { id: transaction.buyerProfileId },
        data: { totalTransactions: { increment: 1 } },
      });
    }

    // If cancelled/rejected, release inventory
    if (newStatus === 'CANCELLED' || newStatus === 'REJECTED') {
      if (transaction.status !== 'COMPLETED') {
        await tx.farmerCrop.update({
          where: { id: transaction.farmerCropId },
          data: { availableQuantity: { increment: transaction.quantity } },
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

// Simple distance-based transport cost calculation
function calculateTransportCost(fromDistrict: string, toDistrict: string, quantity: number): number {
  // Mock distance table for Gujarat mandis
  const distanceMap: Record<string, Record<string, number>> = {
    Ahmedabad: { Rajkot: 216, Surendranagar: 125, Bhavnagar: 170, Anand: 70, Ahmedabad: 0 },
    Rajkot: { Ahmedabad: 216, Surendranagar: 100, Bhavnagar: 160, Rajkot: 0 },
    Surendranagar: { Ahmedabad: 125, Rajkot: 100, Bhavnagar: 130, Surendranagar: 0 },
    Bhavnagar: { Ahmedabad: 170, Rajkot: 160, Bhavnagar: 0 },
    Anand: { Ahmedabad: 70, Anand: 0 },
  };

  const dist = distanceMap[fromDistrict]?.[toDistrict] ??
    distanceMap[toDistrict]?.[fromDistrict] ?? 150; // default 150km

  const ratePerKmPerQuintal = 2; // ₹2/km/quintal
  return dist * ratePerKmPerQuintal * quantity;
}

export { calculateTransportCost };
