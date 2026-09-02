import prisma from '../database/client';
import { NotFoundError, BusinessLogicError } from '../middleware/errorHandler';

export async function getFarmerProfile(userId: string) {
  const profile = await prisma.farmerProfile.findUnique({
    where: { userId },
    include: { user: { select: { email: true, phone: true, language: true, status: true } } },
  });
  if (!profile) throw new NotFoundError('Farmer profile');
  return profile;
}

export async function updateFarmerProfile(userId: string, data: Partial<{
  name: string; village: string; taluka: string; district: string;
  pincode: string; latitude: number; longitude: number; riskProfile: string;
}>) {
  const profile = await prisma.farmerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Farmer profile');
  return prisma.farmerProfile.update({ where: { userId }, data });
}

export async function addFarmerCrop(userId: string, input: {
  cropId: string; totalQuantity: number; unit: string; quality: string;
  harvestDate?: string; storageStatus: string; expectedPrice?: number;
  location: string; district: string; notes?: string;
}) {
  const profile = await prisma.farmerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Farmer profile');

  const crop = await prisma.crop.findUnique({ where: { id: input.cropId } });
  if (!crop) throw new NotFoundError('Crop');

  return prisma.farmerCrop.create({
    data: {
      farmerProfileId: profile.id,
      cropId: input.cropId,
      totalQuantity: input.totalQuantity,
      availableQuantity: input.totalQuantity,
      unit: input.unit,
      quality: input.quality as any,
      harvestDate: input.harvestDate ? new Date(input.harvestDate) : undefined,
      storageStatus: input.storageStatus as any,
      expectedPrice: input.expectedPrice,
      location: input.location,
      district: input.district,
      notes: input.notes,
    },
    include: { crop: true },
  });
}

export async function getFarmerCrops(userId: string) {
  const profile = await prisma.farmerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Farmer profile');

  return prisma.farmerCrop.findMany({
    where: { farmerProfileId: profile.id, isActive: true },
    include: {
      crop: true,
      qualityAssessments: { orderBy: { createdAt: 'desc' }, take: 1 },
      aiRecommendations: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFarmerCropById(userId: string, cropId: string) {
  const profile = await prisma.farmerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Farmer profile');

  const fc = await prisma.farmerCrop.findFirst({
    where: { id: cropId, farmerProfileId: profile.id, isActive: true },
    include: {
      crop: true,
      qualityAssessments: { orderBy: { createdAt: 'desc' }, take: 3 },
      aiRecommendations: { orderBy: { createdAt: 'desc' }, take: 3 },
      transactions: {
        include: { buyerProfile: { include: { user: { select: { email: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
  if (!fc) throw new NotFoundError('Farmer crop');
  return fc;
}

export async function updateFarmerCrop(userId: string, cropId: string, data: Partial<{
  totalQuantity: number; expectedPrice: number; storageStatus: string;
  quality: string; notes: string; location: string; district: string;
}>) {
  const profile = await prisma.farmerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Farmer profile');

  const fc = await prisma.farmerCrop.findFirst({
    where: { id: cropId, farmerProfileId: profile.id, isActive: true },
  });
  if (!fc) throw new NotFoundError('Farmer crop');

  return prisma.farmerCrop.update({
    where: { id: cropId },
    data: {
      ...data,
      quality: data.quality as any,
      storageStatus: data.storageStatus as any,
    },
    include: { crop: true },
  });
}

export async function deleteFarmerCrop(userId: string, cropId: string) {
  const profile = await prisma.farmerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Farmer profile');

  const fc = await prisma.farmerCrop.findFirst({
    where: { id: cropId, farmerProfileId: profile.id },
  });
  if (!fc) throw new NotFoundError('Farmer crop');

  return prisma.farmerCrop.update({ where: { id: cropId }, data: { isActive: false } });
}

export async function getIncomeSummary(userId: string) {
  const profile = await prisma.farmerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Farmer profile');

  const crops = await prisma.farmerCrop.findMany({
    where: { farmerProfileId: profile.id, isActive: true },
    include: { crop: true },
  });

  const transactions = await prisma.transaction.findMany({
    where: { farmerProfileId: profile.id, status: 'COMPLETED' },
    include: { buyerProfile: true, farmerCrop: { include: { crop: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const totalNetIncome = transactions.reduce((sum, t) => sum + t.netRealization * t.quantity, 0);
  const totalSoldQuantity = transactions.reduce((sum, t) => sum + t.quantity, 0);

  // Get latest market prices for current value estimation
  const latestPrices = await prisma.marketPrice.findMany({
    where: { cropId: { in: crops.map((c) => c.cropId) } },
    orderBy: { priceDate: 'desc' },
    distinct: ['cropId' as any],
  });

  const priceMap = new Map(latestPrices.map((p) => [p.cropId, p.modalPrice]));

  const cropSummaries = crops.map((fc) => {
    const marketPrice = priceMap.get(fc.cropId) || 0;
    return {
      id: fc.id,
      cropName: fc.crop.name,
      totalQuantity: fc.totalQuantity,
      availableQuantity: fc.availableQuantity,
      soldQuantity: fc.soldQuantity,
      unit: fc.unit,
      quality: fc.quality,
      currentMarketValue: fc.availableQuantity * marketPrice,
      marketPrice,
      storageStatus: fc.storageStatus,
    };
  });

  return {
    totalNetIncome,
    totalSoldQuantity,
    cropSummaries,
    recentTransactions: transactions.slice(0, 10),
    transactionCount: transactions.length,
  };
}
