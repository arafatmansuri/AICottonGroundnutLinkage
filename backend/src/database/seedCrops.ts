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
  { name: 'Cotton',       nameHi: 'कपास',       nameGu: 'કપાસ',       description: 'Long staple cotton (Bt)',         baseModal: 7100, volatility: 180 },
  { name: 'Groundnut',    nameHi: 'मूंगफली',    nameGu: 'મગફળી',      description: 'Bold groundnut (Kadi variety)',   baseModal: 5950, volatility: 220 },
  { name: 'Wheat',        nameHi: 'गेहूं',       nameGu: 'ઘઉં',        description: 'GW-322 wheat',                   baseModal: 2450, volatility: 80  },
  { name: 'Cumin',        nameHi: 'जीरा',        nameGu: 'જીરૂ',       description: 'Premium cumin (Unjha variety)',   baseModal: 25000, volatility: 1500 },
  { name: 'Castor',       nameHi: 'अरंडी',       nameGu: 'દિવેલ',      description: 'Castor seeds',                   baseModal: 6200, volatility: 200 },
  { name: 'Sesame',       nameHi: 'तिल',         nameGu: 'તલ',         description: 'White sesame seeds',             baseModal: 14500, volatility: 600 },
  { name: 'Bajra',        nameHi: 'बाजरा',       nameGu: 'બાજરો',      description: 'Pearl millet',                   baseModal: 2350, volatility: 100 },
  { name: 'Jowar',        nameHi: 'ज्वार',       nameGu: 'જુવાર',      description: 'Sorghum',                        baseModal: 2500, volatility: 100 },
  { name: 'Maize',        nameHi: 'मक्का',       nameGu: 'મકાઈ',       description: 'Yellow maize',                   baseModal: 2050, volatility: 90  },
  { name: 'Mustard',      nameHi: 'सरसों',       nameGu: 'સરસવ',       description: 'Yellow mustard seeds',           baseModal: 5200, volatility: 180 },
  { name: 'Coriander',    nameHi: 'धनिया',       nameGu: 'ધાણા',       description: 'Dried coriander seeds',          baseModal: 8500, volatility: 400 },
  { name: 'Fennel',       nameHi: 'सौंफ',        nameGu: 'વરિયાળી',    description: 'Fennel seeds (Saunf)',           baseModal: 11000, volatility: 600 },
  { name: 'Fenugreek',    nameHi: 'मेथी',        nameGu: 'મેથી',       description: 'Fenugreek seeds',                baseModal: 5800, volatility: 250 },
  { name: 'Soybean',      nameHi: 'सोयाबीन',    nameGu: 'સોયાબીન',    description: 'Soybean (Yellow)',               baseModal: 4500, volatility: 160 },
  { name: 'Chickpea',     nameHi: 'चना',         nameGu: 'ચણા',        description: 'Desi chickpea (Gram)',           baseModal: 5400, volatility: 180 },
  { name: 'Pigeon Pea',   nameHi: 'अरहर दाल',   nameGu: 'તુવેર',      description: 'Red gram / Tur dal',             baseModal: 6800, volatility: 300 },
  { name: 'Mung Bean',    nameHi: 'मूंग',        nameGu: 'મગ',         description: 'Green gram',                     baseModal: 7500, volatility: 350 },
  { name: 'Moth Bean',    nameHi: 'मोठ',         nameGu: 'મઠ',         description: 'Moth bean',                      baseModal: 5000, volatility: 200 },
  { name: 'Onion',        nameHi: 'प्याज',       nameGu: 'ડુંગળી',     description: 'Red onion',                      baseModal: 1800, volatility: 500 },
  { name: 'Garlic',       nameHi: 'लहसुन',       nameGu: 'લસણ',        description: 'Desi garlic',                    baseModal: 12000, volatility: 1000 },
  { name: 'Potato',       nameHi: 'आलू',         nameGu: 'બટાટા',      description: 'Chipsona potato',               baseModal: 1200, volatility: 300 },
  { name: 'Tomato',       nameHi: 'टमाटर',       nameGu: 'ટામેટા',     description: 'Hybrid tomato',                  baseModal: 2200, volatility: 800 },
  { name: 'Banana',       nameHi: 'केला',        nameGu: 'કેળા',       description: 'Cavendish banana (Anand)',        baseModal: 2000, volatility: 300 },
  { name: 'Sugarcane',    nameHi: 'गन्ना',       nameGu: 'શેરડી',      description: 'Sugarcane (per quintal)',         baseModal: 380, volatility: 20   },
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
// All mandis trade the first 10 crops; specialised mandis carry extras
const MANDI_CROP_MAP: Record<string, number[]> = {
  'mandi-ahmedabad-001':      [0,1,2,4,5,8,9,14,15,16,17,20,21,22,23],
  'mandi-rajkot-001':         [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
  'mandi-surendranagar-001':  [0,1,4,5,6,7,8,9,13,14,17,18,23],
  'mandi-bhavnagar-001':      [0,1,2,8,9,14,15,16,19,20,21,22],
  'mandi-junagadh-001':       [1,2,3,4,5,10,11,12,13,14,15,16,17,18,19],
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
      { cropName: 'Cumin',      buyerIdx: 0, price: 25500, min: 10,  max: 100,  quality: 'GRADE_A', district: 'Ahmedabad' },
      { cropName: 'Castor',     buyerIdx: 1, price: 6300,  min: 50,  max: 300,  quality: 'GRADE_A', district: 'Rajkot' },
      { cropName: 'Sesame',     buyerIdx: 2, price: 14800, min: 20,  max: 120,  quality: 'GRADE_A', district: 'Junagadh' },
      { cropName: 'Bajra',      buyerIdx: 0, price: 2400,  min: 100, max: 500,  quality: 'GRADE_B', district: 'Ahmedabad' },
      { cropName: 'Jowar',      buyerIdx: 1, price: 2550,  min: 100, max: 400,  quality: 'GRADE_B', district: 'Rajkot' },
      { cropName: 'Maize',      buyerIdx: 0, price: 2100,  min: 100, max: 600,  quality: 'GRADE_B', district: 'Ahmedabad' },
      { cropName: 'Mustard',    buyerIdx: 2, price: 5300,  min: 50,  max: 250,  quality: 'GRADE_A', district: 'Junagadh' },
      { cropName: 'Coriander',  buyerIdx: 1, price: 8700,  min: 20,  max: 150,  quality: 'GRADE_A', district: 'Rajkot' },
      { cropName: 'Fennel',     buyerIdx: 2, price: 11200, min: 15,  max: 100,  quality: 'GRADE_A', district: 'Junagadh' },
      { cropName: 'Fenugreek',  buyerIdx: 0, price: 5900,  min: 30,  max: 200,  quality: 'GRADE_B', district: 'Ahmedabad' },
      { cropName: 'Soybean',    buyerIdx: 1, price: 4600,  min: 100, max: 500,  quality: 'GRADE_B', district: 'Rajkot' },
      { cropName: 'Chickpea',   buyerIdx: 0, price: 5500,  min: 50,  max: 300,  quality: 'GRADE_A', district: 'Ahmedabad' },
      { cropName: 'Pigeon Pea', buyerIdx: 2, price: 6900,  min: 50,  max: 250,  quality: 'GRADE_A', district: 'Junagadh' },
      { cropName: 'Mung Bean',  buyerIdx: 3, price: 7600,  min: 30,  max: 150,  quality: 'GRADE_A', district: 'Bhavnagar' },
      { cropName: 'Onion',      buyerIdx: 4, price: 1900,  min: 100, max: 800,  quality: 'UNGRADED', district: 'Bhavnagar' },
      { cropName: 'Garlic',     buyerIdx: 2, price: 12200, min: 20,  max: 100,  quality: 'GRADE_A', district: 'Junagadh' },
      { cropName: 'Potato',     buyerIdx: 0, price: 1300,  min: 200, max: 1000, quality: 'UNGRADED', district: 'Ahmedabad' },
      { cropName: 'Tomato',     buyerIdx: 1, price: 2300,  min: 100, max: 500,  quality: 'UNGRADED', district: 'Rajkot' },
      { cropName: 'Banana',     buyerIdx: 4, price: 2100,  min: 200, max: 1000, quality: 'GRADE_B', district: 'Bhavnagar' },
      { cropName: 'Wheat',      buyerIdx: 0, price: 2500,  min: 100, max: 800,  quality: 'GRADE_B', district: 'Ahmedabad' },
      { cropName: 'Sugarcane',  buyerIdx: 1, price: 400,   min: 500, max: 5000, quality: 'UNGRADED', district: 'Rajkot' },
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
