/**
 * Crop Seed Script — KisanMitra AI
 *
 * Adds a comprehensive list of crops with Hindi / Gujarati names,
 * seeds 30 days of realistic market price history across all mandis,
 * and creates buyer offers for each crop.
 *
 * Run: npx ts-node src/database/seedCrops.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Crop master list ──────────────────────────────────────────────────────────

const CROPS = [
  { name: 'Cotton',    nameHi: 'कपास',    nameGu: 'કપાસ',  description: 'Long staple cotton (Bt)',       baseModal: 7100, volatility: 180 },
  { name: 'Groundnut', nameHi: 'मूंगफली', nameGu: 'મગફળી', description: 'Bold groundnut (Kadi variety)', baseModal: 5950, volatility: 220 },
];

// ─── Mandi IDs (must already exist) ─────────────────────────────────────────

const MANDI_IDS = [
  'mandi-ahmedabad-001',
  'mandi-rajkot-001',
  'mandi-surendranagar-001',
  'mandi-bhavnagar-001',
  'mandi-junagadh-001',
];

// Which mandis trade which crops (by index into CROPS array)
const MANDI_CROP_MAP: Record<string, number[]> = {
  'mandi-ahmedabad-001':      [0, 1],
  'mandi-rajkot-001':         [0, 1],
  'mandi-surendranagar-001':  [0, 1],
  'mandi-bhavnagar-001':      [0, 1],
  'mandi-junagadh-001':       [0, 1],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trend(variation: number): 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE' {
  const abs = Math.abs(variation);
  if (abs > 200) return 'VOLATILE';
  if (variation > 40) return 'INCREASING';
  if (variation < -40) return 'DECREASING';
  return 'STABLE';
}

function rand(min: number, max: number) {
  return Math.round(Math.random() * (max - min) + min);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding crops...\n');

  // 1. Upsert all crops
  const cropRecords: Record<string, string> = {}; // name → id
  for (const c of CROPS) {
    const rec = await prisma.crop.upsert({
      where: { name: c.name },
      update: { nameHi: c.nameHi, nameGu: c.nameGu, description: c.description },
      create: { name: c.name, nameHi: c.nameHi, nameGu: c.nameGu, description: c.description },
    });
    cropRecords[c.name] = rec.id;
  }
  console.log(`✅ ${CROPS.length} crops upserted`);

  // 2. Verify mandis exist
  const mandiCount = await prisma.mandi.count({ where: { id: { in: MANDI_IDS } } });
  if (mandiCount < MANDI_IDS.length) {
    console.warn(`⚠️  Only ${mandiCount}/${MANDI_IDS.length} mandis found. Run the main seed first to create mandis.`);
  }

  // 3. Delete existing seed prices and rebuild
  await prisma.marketPrice.deleteMany({ where: { source: 'SEED' } });
  console.log('🗑️  Cleared old SEED market prices');

  const now = new Date();
  let priceCount = 0;

  for (const [mandiId, cropIndices] of Object.entries(MANDI_CROP_MAP)) {
    for (const idx of cropIndices) {
      const crop = CROPS[idx];
      const cropId = cropRecords[crop.name];
      if (!cropId) continue;

      for (let day = 30; day >= 0; day--) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);

        // Realistic variation: slight upward trend + random noise
        const noise = (Math.random() - 0.45) * crop.volatility;
        const drift = (30 - day) * (crop.volatility * 0.015); // ~0.45 vol drift over 30 days
        const modal = Math.max(100, Math.round(crop.baseModal + noise + drift));
        const min   = Math.round(modal * 0.94);
        const max   = Math.round(modal * 1.06);
        const pctChange = parseFloat(((noise / crop.baseModal) * 100).toFixed(2));

        await prisma.marketPrice.create({
          data: {
            mandiId,
            cropId,
            minPrice: min,
            maxPrice: max,
            modalPrice: modal,
            arrivalQty: rand(80, 600),
            priceDate: date,
            trend: trend(noise),
            priceChangePct: pctChange,
            source: 'SEED',
          },
        });
        priceCount++;
      }
    }
  }
  console.log(`✅ ${priceCount} market price records seeded (30 days × ${CROPS.length} crops)`);

  // 4. Seed buyer offers for new crops (requires at least one verified buyer)
  await prisma.buyerOffer.deleteMany({ where: { notes: { contains: '[CROP-SEED]' } } });

  const verifiedBuyers = await prisma.buyerProfile.findMany({
    where: { verificationStatus: 'VERIFIED' },
    take: 5,
  });

  if (verifiedBuyers.length === 0) {
    console.warn('⚠️  No verified buyers found — skipping buyer offers. Run the main seed first.');
  } else {
    // Representative offers: one per crop covering different quality grades
    const offerTemplates: Array<{
      cropName: string; buyerIdx: number; price: number;
      min: number; max: number; quality: string; district: string;
    }> = [
      { cropName: 'Cotton',    buyerIdx: 0, price: 7200, min: 50,  max: 300, quality: 'GRADE_A', district: 'Ahmedabad' },
      { cropName: 'Cotton',    buyerIdx: 1, price: 7000, min: 100, max: 500, quality: 'GRADE_B', district: 'Rajkot' },
      { cropName: 'Groundnut', buyerIdx: 2, price: 6100, min: 50,  max: 300, quality: 'GRADE_A', district: 'Junagadh' },
      { cropName: 'Groundnut', buyerIdx: 3, price: 5900, min: 100, max: 400, quality: 'GRADE_B', district: 'Bhavnagar' },
    ];

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 45);

    let offerCount = 0;
    for (const o of offerTemplates) {
      const cropId = cropRecords[o.cropName];
      if (!cropId) continue;
      const buyer = verifiedBuyers[o.buyerIdx % verifiedBuyers.length];
      await prisma.buyerOffer.create({
        data: {
          buyerProfileId: buyer.id,
          cropId,
          offeredPrice: o.price,
          minQuantity: o.min,
          maxQuantity: o.max,
          quality: o.quality as any,
          district: o.district,
          state: 'Gujarat',
          notes: '[CROP-SEED] Demo offer',
          expiresAt,
        },
      });
      offerCount++;
    }
    console.log(`✅ ${offerCount} buyer offers seeded`);
  }

  // 5. Summary
  const totalCrops = await prisma.crop.count();
  const totalPrices = await prisma.marketPrice.count();
  const totalOffers = await prisma.buyerOffer.count({ where: { isActive: true } });

  console.log('\n📊 Database totals after seed:');
  console.log(`   Crops:         ${totalCrops}`);
  console.log(`   Market prices: ${totalPrices}`);
  console.log(`   Active offers: ${totalOffers}`);
  console.log('\n🎉 Crop seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Crop seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
