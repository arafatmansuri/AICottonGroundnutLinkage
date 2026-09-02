import prisma from '../database/client';
import { NotFoundError } from '../middleware/errorHandler';

export async function getAllCrops() {
  return prisma.crop.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
}

export async function getCropById(id: string) {
  const crop = await prisma.crop.findUnique({ where: { id } });
  if (!crop) throw new NotFoundError('Crop');
  return crop;
}

export async function getAllMandis(district?: string) {
  return prisma.mandi.findMany({
    where: {
      isActive: true,
      ...(district ? { district: { contains: district, mode: 'insensitive' as any } } : {}),
    },
    orderBy: { name: 'asc' },
  });
}

export async function getMarketPrices(params: {
  cropId?: string; mandiId?: string; date?: string;
  page: number; limit: number;
}) {
  const { cropId, mandiId, date, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (cropId) where.cropId = cropId;
  if (mandiId) where.mandiId = mandiId;
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.priceDate = { gte: d, lt: next };
  }

  const [prices, total] = await Promise.all([
    prisma.marketPrice.findMany({
      where,
      include: { crop: true, mandi: true },
      orderBy: { priceDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.marketPrice.count({ where }),
  ]);

  return { prices, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getLatestMarketPrices(cropId?: string) {
  const where: any = {};
  if (cropId) where.cropId = cropId;

  // Get latest price per mandi+crop combo
  const allPrices = await prisma.marketPrice.findMany({
    where,
    include: { crop: true, mandi: true },
    orderBy: { priceDate: 'desc' },
  });

  // Deduplicate by mandiId+cropId, keep latest
  const seen = new Set<string>();
  const latest: typeof allPrices = [];
  for (const p of allPrices) {
    const key = `${p.mandiId}_${p.cropId}`;
    if (!seen.has(key)) {
      seen.add(key);
      latest.push(p);
    }
  }

  return latest;
}

export async function getPriceHistory(cropId: string, mandiId?: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: any = { cropId, priceDate: { gte: since } };
  if (mandiId) where.mandiId = mandiId;

  return prisma.marketPrice.findMany({
    where,
    include: { mandi: true },
    orderBy: { priceDate: 'asc' },
  });
}

export async function getBestCurrentPrice(cropId: string) {
  const latest = await getLatestMarketPrices(cropId);
  if (!latest.length) return null;

  return latest.reduce((best: (typeof latest)[0], p: (typeof latest)[0]) => (p.modalPrice > best.modalPrice ? p : best));
}
