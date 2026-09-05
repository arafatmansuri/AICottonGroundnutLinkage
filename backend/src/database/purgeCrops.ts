/**
 * Purge Crops — KisanMitra AI
 *
 * Removes every crop that is NOT Cotton or Groundnut, along with all
 * dependent rows (market prices, farmer-crop listings, buyer offers).
 *
 * Safe to re-run — skips crops that are already gone.
 *
 * Run: npm run db:purge-crops
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP = ['Cotton', 'Groundnut'];

async function main() {
  console.log('🗑️  Purging non-Cotton/Groundnut data...\n');

  // Find IDs to delete
  const toDelete = await prisma.crop.findMany({
    where: { name: { notIn: KEEP } },
    select: { id: true, name: true },
  });

  if (toDelete.length === 0) {
    console.log('✅ Nothing to purge — only Cotton and Groundnut exist.');
    return;
  }

  const ids = toDelete.map(c => c.id);
  console.log(`Found ${ids.length} crop(s) to remove: ${toDelete.map(c => c.name).join(', ')}\n`);

  // 1. Market prices
  const mp = await prisma.marketPrice.deleteMany({ where: { cropId: { in: ids } } });
  console.log(`  Deleted ${mp.count} market price records`);

  // 2. AI recommendations linked to farmer crops of these crop types
  const affectedFarmerCropIds = (
    await prisma.farmerCrop.findMany({ where: { cropId: { in: ids } }, select: { id: true } })
  ).map(fc => fc.id);

  if (affectedFarmerCropIds.length > 0) {
    const recs = await prisma.aIRecommendation.deleteMany({
      where: { farmerCropId: { in: affectedFarmerCropIds } },
    });
    console.log(`  Deleted ${recs.count} AI recommendation records`);

    const qa = await prisma.qualityAssessment.deleteMany({
      where: { farmerCropId: { in: affectedFarmerCropIds } },
    });
    console.log(`  Deleted ${qa.count} quality assessment records`);

    const bi = await prisma.cropInterestNotification.deleteMany({
      where: { farmerCropId: { in: affectedFarmerCropIds } },
    });
    console.log(`  Deleted ${bi.count} crop interest notifications`);

    const fc = await prisma.farmerCrop.deleteMany({ where: { cropId: { in: ids } } });
    console.log(`  Deleted ${fc.count} farmer crop listings`);
  }

  // 3. Buyer offers
  const bo = await prisma.buyerOffer.deleteMany({ where: { cropId: { in: ids } } });
  console.log(`  Deleted ${bo.count} buyer offers`);

  // 4. Crop records themselves
  const crops = await prisma.crop.deleteMany({ where: { id: { in: ids } } });
  console.log(`  Deleted ${crops.count} crop records`);

  console.log('\n✅ Purge complete — only Cotton and Groundnut remain.');

  const remaining = await prisma.crop.findMany({ select: { name: true } });
  console.log(`   Remaining crops: ${remaining.map(c => c.name).join(', ')}`);
}

main()
  .catch(e => {
    console.error('❌ Purge error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
