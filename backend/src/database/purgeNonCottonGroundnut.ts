/**
 * Purge Non-Cotton/Groundnut Data — KisanMitra AI
 *
 * Removes all FarmerCrop listings, BuyerOffer rows, BuyerRequirements,
 * market prices, and crop records for every crop that is NOT Cotton or
 * Groundnut.  Dependent rows (transactions, quality assessments, AI
 * recommendations, crop-interest notifications) are deleted first to
 * satisfy foreign-key constraints.
 *
 * Safe to re-run — if nothing needs removing the script exits cleanly.
 *
 * Run: npm run db:purge-non-cotton-groundnut
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP = ['Cotton', 'Groundnut'];

async function main() {
  console.log('🗑️  Purging all non-Cotton / non-Groundnut data...\n');

  // ── 1. Find crops to remove ─────────────────────────────────────────────────
  const cropsToDelete = await prisma.crop.findMany({
    where: { name: { notIn: KEEP } },
    select: { id: true, name: true },
  });

  if (cropsToDelete.length === 0) {
    console.log('✅ Nothing to purge — only Cotton and Groundnut exist.');
    return;
  }

  const cropIds = cropsToDelete.map(c => c.id);
  console.log(
    `Found ${cropIds.length} crop(s) to remove: ${cropsToDelete.map(c => c.name).join(', ')}\n`,
  );

  // ── 2. Farmer-side cleanup ──────────────────────────────────────────────────

  const farmerCropIds = (
    await prisma.farmerCrop.findMany({
      where: { cropId: { in: cropIds } },
      select: { id: true },
    })
  ).map(fc => fc.id);

  if (farmerCropIds.length > 0) {
    // 2a. Transactions that reference these farmer crops
    const tx1 = await prisma.transaction.deleteMany({
      where: { farmerCropId: { in: farmerCropIds } },
    });
    console.log(`  Deleted ${tx1.count} transaction(s) linked to farmer crops`);

    // 2b. Quality assessments
    const qa = await prisma.qualityAssessment.deleteMany({
      where: { farmerCropId: { in: farmerCropIds } },
    });
    console.log(`  Deleted ${qa.count} quality assessment(s)`);

    // 2c. AI recommendations
    const ai = await prisma.aIRecommendation.deleteMany({
      where: { farmerCropId: { in: farmerCropIds } },
    });
    console.log(`  Deleted ${ai.count} AI recommendation(s)`);

    // 2d. Crop-interest notifications
    const cin = await prisma.cropInterestNotification.deleteMany({
      where: { farmerCropId: { in: farmerCropIds } },
    });
    console.log(`  Deleted ${cin.count} crop-interest notification(s)`);

    // 2e. Farmer crop listings
    const fc = await prisma.farmerCrop.deleteMany({
      where: { cropId: { in: cropIds } },
    });
    console.log(`  Deleted ${fc.count} farmer crop listing(s)`);
  } else {
    console.log('  No farmer crop listings found for these crops');
  }

  // ── 3. Buyer-side cleanup ───────────────────────────────────────────────────

  const buyerOfferIds = (
    await prisma.buyerOffer.findMany({
      where: { cropId: { in: cropIds } },
      select: { id: true },
    })
  ).map(o => o.id);

  if (buyerOfferIds.length > 0) {
    // 3a. Transactions that reference these buyer offers
    const tx2 = await prisma.transaction.deleteMany({
      where: { buyerOfferId: { in: buyerOfferIds } },
    });
    console.log(`  Deleted ${tx2.count} transaction(s) linked to buyer offers`);

    // 3b. Buyer offers
    const bo = await prisma.buyerOffer.deleteMany({
      where: { cropId: { in: cropIds } },
    });
    console.log(`  Deleted ${bo.count} buyer offer(s)`);
  } else {
    console.log('  No buyer offers found for these crops');
  }

  // 3c. Buyer requirements
  const br = await prisma.buyerRequirement.deleteMany({
    where: { cropId: { in: cropIds } },
  });
  console.log(`  Deleted ${br.count} buyer requirement(s)`);

  // ── 4. Market prices ────────────────────────────────────────────────────────
  const mp = await prisma.marketPrice.deleteMany({
    where: { cropId: { in: cropIds } },
  });
  console.log(`  Deleted ${mp.count} market price record(s)`);

  // ── 5. Crop records ─────────────────────────────────────────────────────────
  const crops = await prisma.crop.deleteMany({
    where: { id: { in: cropIds } },
  });
  console.log(`  Deleted ${crops.count} crop record(s)`);

  // ── 6. Summary ──────────────────────────────────────────────────────────────
  console.log('\n✅ Purge complete — only Cotton and Groundnut remain.\n');

  const remaining = await prisma.crop.findMany({
    select: { name: true, _count: { select: { farmerCrops: true, buyerOffers: true } } },
  });

  console.log('📊 Remaining crops:');
  for (const c of remaining) {
    console.log(
      `   ${c.name.padEnd(12)} — ${c._count.farmerCrops} farmer listing(s),  ${c._count.buyerOffers} buyer offer(s)`,
    );
  }
}

main()
  .catch(e => {
    console.error('❌ Purge error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
