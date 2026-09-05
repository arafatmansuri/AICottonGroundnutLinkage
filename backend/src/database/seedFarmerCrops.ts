/**
 * Farmer Crop Seed — KisanMitra AI
 *
 * Directly inserts FarmerCrop rows using IDs from the live database.
 * Safe to re-run — deletes rows tagged [CROP-SEED] before inserting.
 *
 * Run: npm run db:seed:farmer-crops
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Farmer profile IDs (from live DB) ───────────────────────────────────────

const FARMERS = {
  ramesh: 'b88a195e-b79b-4893-894d-963a388b0412', // Ramesh Patel  — Ahmedabad
  suresh: 'd80fe3ba-df82-4103-a2fd-752cd68c7643', // Suresh Desai  — Rajkot
  mukesh: '39005eba-83ce-41d2-8cc1-f7c04c0c0e1f', // Mukesh Ahir   — Surendranagar
};

// ─── Crop IDs (from live DB) ──────────────────────────────────────────────────

const CROPS = {
  cotton:    'eadd2f70-32f2-43a5-a7b6-2ad54159410c',
  groundnut: '3e419231-b0f9-4173-81f4-1202bc34dbae',
};

// ─── Rows to insert ───────────────────────────────────────────────────────────

const ROWS: Array<{
  farmerProfileId: string;
  cropId: string;
  quantity: number;
  soldQuantity: number;
  unit: string;
  quality: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'UNGRADED';
  harvestDate: Date;
  storageStatus: 'NOT_STORED' | 'IN_STORAGE' | 'PARTIALLY_STORED';
  expectedPrice: number;
  location: string;
  district: string;
  notes: string;
}> = [
  // ── Ramesh Patel — Ahmedabad ────────────────────────────────────────────────
  {
    farmerProfileId: FARMERS.ramesh,
    cropId:          CROPS.cotton,
    quantity:        200,
    soldQuantity:    50,
    unit:            'quintal',
    quality:         'GRADE_A',
    harvestDate:     new Date('2025-10-15'),
    storageStatus:   'PARTIALLY_STORED',
    expectedPrice:   7500,
    location:        'Sanand',
    district:        'Ahmedabad',
    notes:           '[CROP-SEED] Bt cotton — good lint quality',
  },
  {
    farmerProfileId: FARMERS.ramesh,
    cropId:          CROPS.groundnut,
    quantity:        80,
    soldQuantity:    20,
    unit:            'quintal',
    quality:         'GRADE_A',
    harvestDate:     new Date('2025-11-05'),
    storageStatus:   'NOT_STORED',
    expectedPrice:   6200,
    location:        'Sanand',
    district:        'Ahmedabad',
    notes:           '[CROP-SEED] Bold groundnut — Kadi variety',
  },

  // ── Suresh Desai — Rajkot ──────────────────────────────────────────────────
  {
    farmerProfileId: FARMERS.suresh,
    cropId:          CROPS.groundnut,
    quantity:        150,
    soldQuantity:    80,
    unit:            'quintal',
    quality:         'GRADE_A',
    harvestDate:     new Date('2025-11-05'),
    storageStatus:   'NOT_STORED',
    expectedPrice:   6200,
    location:        'Gondal',
    district:        'Rajkot',
    notes:           '[CROP-SEED] Bold groundnut — Kadi variety',
  },
  {
    farmerProfileId: FARMERS.suresh,
    cropId:          CROPS.cotton,
    quantity:        70,
    soldQuantity:    0,
    unit:            'quintal',
    quality:         'GRADE_B',
    harvestDate:     new Date('2025-10-08'),
    storageStatus:   'NOT_STORED',
    expectedPrice:   7000,
    location:        'Gondal',
    district:        'Rajkot',
    notes:           '[CROP-SEED] Medium staple cotton',
  },

  // ── Mukesh Ahir — Surendranagar ────────────────────────────────────────────
  {
    farmerProfileId: FARMERS.mukesh,
    cropId:          CROPS.cotton,
    quantity:        250,
    soldQuantity:    100,
    unit:            'quintal',
    quality:         'GRADE_B',
    harvestDate:     new Date('2025-10-30'),
    storageStatus:   'PARTIALLY_STORED',
    expectedPrice:   7200,
    location:        'Wadhwan',
    district:        'Surendranagar',
    notes:           '[CROP-SEED] Medium staple cotton',
  },
  {
    farmerProfileId: FARMERS.mukesh,
    cropId:          CROPS.groundnut,
    quantity:        65,
    soldQuantity:    25,
    unit:            'quintal',
    quality:         'GRADE_B',
    harvestDate:     new Date('2025-11-20'),
    storageStatus:   'NOT_STORED',
    expectedPrice:   5900,
    location:        'Wadhwan',
    district:        'Surendranagar',
    notes:           '[CROP-SEED] Groundnut kharif',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding farmer crops...\n');

  const deleted = await prisma.farmerCrop.deleteMany({
    where: { notes: { contains: '[CROP-SEED]' } },
  });
  if (deleted.count > 0) {
    console.log(`🗑️  Removed ${deleted.count} previously seeded records\n`);
  }

  for (const row of ROWS) {
    await prisma.farmerCrop.create({ data: row });
    console.log(`  ✔ farmerProfileId=${row.farmerProfileId.slice(0, 8)}…  cropId=${row.cropId.slice(0, 8)}…  qty=${row.quantity}  sold=${row.soldQuantity}`);
  }

  console.log(`\n✅ ${ROWS.length} farmer crop records created`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
