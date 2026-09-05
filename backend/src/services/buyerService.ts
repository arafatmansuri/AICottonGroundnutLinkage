import prisma from '../database/client';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';

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

// ── Crop search (buyer browses farmer listings) ───────────────────────────────

export async function searchFarmerCrops(params: {
  cropName?: string; district?: string; quality?: string;
  minPrice?: number; maxPrice?: number; page: number; limit: number;
}) {
  const { cropName, district, quality, minPrice, maxPrice, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: any = { isActive: true };

  if (cropName) {
    where.crop = { name: { contains: cropName, mode: 'insensitive' } };
  }
  if (district) where.district = { contains: district, mode: 'insensitive' };
  if (quality) where.quality = quality;
  if (minPrice !== undefined) where.expectedPrice = { ...where.expectedPrice, gte: minPrice };
  if (maxPrice !== undefined) where.expectedPrice = { ...where.expectedPrice, lte: maxPrice };

  const [crops, total] = await Promise.all([
    prisma.farmerCrop.findMany({
      where,
      include: {
        crop: true,
        farmerProfile: {
          select: {
            id: true,
            name: true,
            district: true,
            state: true,
            village: true,
            taluka: true,
            user: { select: { phone: true, email: true } },
          },
        },
        qualityAssessments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.farmerCrop.count({ where }),
  ]);

  return { crops, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ── Send interest notification to farmer about their crop ────────────────────

export async function sendCropInterest(buyerUserId: string, farmerCropId: string, message?: string) {
  const buyerProfile = await prisma.buyerProfile.findUnique({ where: { userId: buyerUserId } });
  if (!buyerProfile) throw new NotFoundError('Buyer profile');

  const farmerCrop = await prisma.farmerCrop.findUnique({
    where: { id: farmerCropId },
    include: { farmerProfile: { include: { user: { select: { id: true } } } }, crop: true },
  });
  if (!farmerCrop) throw new NotFoundError('Farmer crop');
  if (!farmerCrop.isActive) throw new NotFoundError('Farmer crop');

  // Prevent duplicate interest notifications
  const existing = await prisma.cropInterestNotification.findFirst({
    where: { buyerProfileId: buyerProfile.id, farmerCropId },
  });
  if (existing) throw new ConflictError('You have already sent interest for this crop');

  // Create the interest record
  const interest = await prisma.cropInterestNotification.create({
    data: {
      buyerProfileId: buyerProfile.id,
      farmerCropId,
      message,
    },
    include: {
      farmerCrop: { include: { crop: true } },
    },
  });

  // Also create a Notification for the farmer user
  await prisma.notification.create({
    data: {
      userId: farmerCrop.farmerProfile.user.id,
      type: 'CROP_INTEREST',
      title: 'Buyer Interest in Your Crop',
      message: `${buyerProfile.companyName} (${buyerProfile.contactName}) is interested in your ${farmerCrop.crop.name} listing.${message ? ` Message: ${message}` : ''}`,
      data: {
        buyerProfileId: buyerProfile.id,
        farmerCropId,
        companyName: buyerProfile.companyName,
        contactName: buyerProfile.contactName,
      },
    },
  });

  return interest;
}

// ── Get crops the buyer has sent interest to ──────────────────────────────────

export async function getBuyerCropInterests(buyerUserId: string) {
  const buyerProfile = await prisma.buyerProfile.findUnique({ where: { userId: buyerUserId } });
  if (!buyerProfile) throw new NotFoundError('Buyer profile');

  return prisma.cropInterestNotification.findMany({
    where: { buyerProfileId: buyerProfile.id },
    include: {
      farmerCrop: {
        include: {
          crop: true,
          farmerProfile: {
            select: {
              id: true,
              name: true,
              district: true,
              state: true,
              village: true,
              taluka: true,
              user: { select: { phone: true, email: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ── Update buyer profile (with phone support) ─────────────────────────────────

export async function updateBuyerProfileFull(userId: string, data: Partial<{
  companyName: string; contactName: string; district: string;
  state: string; latitude: number; longitude: number; phone: string;
}>) {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Buyer profile');

  const { phone, ...profileData } = data;

  if (phone !== undefined) {
    await prisma.user.update({ where: { id: userId }, data: { phone } });
  }

  return prisma.buyerProfile.update({
    where: { userId },
    data: profileData,
    include: { user: { select: { email: true, phone: true } } },
  });
}

// ── Get full buyer profile (with user fields) ─────────────────────────────────

export async function getBuyerProfileFull(userId: string) {
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
