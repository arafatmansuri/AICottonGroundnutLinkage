import prisma from '../database/client';
import { NotFoundError } from '../middleware/errorHandler';

export async function getBuyerProfile(userId: string) {
  const profile = await prisma.buyerProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { email: true, phone: true, language: true } },
      verification: true,
    },
  });
  if (!profile) throw new NotFoundError('Buyer profile');
  return profile;
}

export async function updateBuyerProfile(userId: string, data: Partial<{
  companyName: string; contactName: string; district: string;
  latitude: number; longitude: number;
}>) {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Buyer profile');
  return prisma.buyerProfile.update({ where: { userId }, data });
}

export async function createBuyerOffer(userId: string, input: {
  cropId: string; offeredPrice: number; minQuantity: number; maxQuantity: number;
  quality: string; district: string; state: string; latitude?: number;
  longitude?: number; notes?: string; expiresAt?: string;
}) {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Buyer profile');

  const crop = await prisma.crop.findUnique({ where: { id: input.cropId } });
  if (!crop) throw new NotFoundError('Crop');

  return prisma.buyerOffer.create({
    data: {
      buyerProfileId: profile.id,
      cropId: input.cropId,
      offeredPrice: input.offeredPrice,
      minQuantity: input.minQuantity,
      maxQuantity: input.maxQuantity,
      quality: input.quality as any,
      district: input.district,
      state: input.state,
      latitude: input.latitude,
      longitude: input.longitude,
      notes: input.notes,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    },
    include: { crop: true, buyerProfile: true },
  });
}

export async function getBuyerOffers(userId: string) {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Buyer profile');

  return prisma.buyerOffer.findMany({
    where: { buyerProfileId: profile.id },
    include: { crop: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateBuyerOffer(userId: string, offerId: string, data: Partial<{
  offeredPrice: number; minQuantity: number; maxQuantity: number;
  isActive: boolean; expiresAt: string;
}>) {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Buyer profile');

  const offer = await prisma.buyerOffer.findFirst({
    where: { id: offerId, buyerProfileId: profile.id },
  });
  if (!offer) throw new NotFoundError('Offer');

  return prisma.buyerOffer.update({
    where: { id: offerId },
    data: {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
    include: { crop: true },
  });
}

export async function getMarketplaceOffers(params: {
  cropId?: string; district?: string; quality?: string; minPrice?: number;
  maxPrice?: number; verifiedOnly?: boolean; page: number; limit: number;
}) {
  const { cropId, district, quality, minPrice, maxPrice, verifiedOnly, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
    OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
  };

  if (cropId) where.cropId = cropId;
  if (district) where.district = { contains: district, mode: 'insensitive' };
  if (quality) where.quality = quality;
  if (minPrice) where.offeredPrice = { ...where.offeredPrice, gte: minPrice };
  if (maxPrice) where.offeredPrice = { ...where.offeredPrice, lte: maxPrice };
  if (verifiedOnly) {
    where.buyerProfile = { verificationStatus: 'VERIFIED' };
  }

  const [offers, total] = await Promise.all([
    prisma.buyerOffer.findMany({
      where,
      include: {
        crop: true,
        buyerProfile: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            district: true,
            verificationStatus: true,
            rating: true,
            totalTransactions: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: [{ buyerProfile: { verificationStatus: 'asc' } }, { offeredPrice: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.buyerOffer.count({ where }),
  ]);

  return { offers, total, page, limit, totalPages: Math.ceil(total / limit) };
}
