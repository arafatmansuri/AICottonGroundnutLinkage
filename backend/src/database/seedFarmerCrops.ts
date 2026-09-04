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
  bajra:     '0d5e561e-76c2-4a1b-9f08-a4d3d4abc3e9',
  banana:    'ca72c2ee-64eb-4871-af5d-1c8ef402e38c',
  castor:    '676ad96b-152d-4288-8094-4ce41096138f',
  chickpea:  '9727052c-81f6-40c2-9bdc-6d2aa0542398',
  coriander: 'e6341a5e-4623-4262-b86f-875d3b6d62ab',
  cotton:    'eadd2f70-32f2-43a5-a7b6-2ad54159410c',
  cumin:     '51e69046-908a-481f-b8b7-9260f9d9b4ef',
  fennel:    '5cb98194-3431-4844-a8e6-cc8900158bba',
  fenugreek: 'fa5e5941-64b8-49a6-bc76-d6f2884b9743',
  garlic:    '167426f7-9fee-49c4-8a76-059ff957ff4e',
  groundnut: '3e419231-b0f9-4173-81f4-1202bc34dbae',
  jowar:     'a8c60e33-9e46-4315-93ca-4f912dee8061',
  maize:     '6068362a-c207-4d93-bc54-26799bae4512',
  mothBean:  '9fa65ea7-54e8-4bea-80a5-07d19d1891be',
  mungBean:  '7f2eeced-b912-43d2-a73a-2dba7680e5dd',
  mustard:   '2e88208f-5595-4d37-b055-4b4f130c9e29',
  onion:     '77b58e30-81f0-4919-a4f7-b93873e575de',
  pigeonPea: '3a09ac44-e1db-4aa7-b0da-a3e9049ed0ee',
  potato:    '5877f3cb-68c0-4294-9dd4-d9af6b34b6cb',
  sesame:    '12d830f1-67a1-465a-b91f-e64c37849435',
  soybean:   '9221e4a5-2ec5-4031-a1b1-e2bcaa89ec59',
  sugarcane: 'f4c62af1-08d3-4706-9797-be2fac0da212',
  tomato:    '82230797-689a-4896-8c7c-f20262cd4290',
  wheat:     'b6b063a8-7df3-40c7-b023-4475a07b31df',
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
    cropId:          CROPS.wheat,
    quantity:        120,
    soldQuantity:    0,
    unit:            'quintal',
    quality:         'GRADE_B',
    harvestDate:     new Date('2025-03-20'),
    storageStatus:   'IN_STORAGE',
    expectedPrice:   2500,
    location:        'Sanand',
    district:        'Ahmedabad',
    notes:           '[CROP-SEED] GW-322 wheat stored in local warehouse',
  },
  {
    farmerProfileId: FARMERS.ramesh,
    cropId:          CROPS.castor,
    quantity:        60,
    soldQuantity:    20,
    unit:            'quintal',
    quality:         'GRADE_A',
    harvestDate:     new Date('2025-11-10'),
    storageStatus:   'NOT_STORED',
    expectedPrice:   6400,
    location:        'Sanand',
    district:        'Ahmedabad',
    notes:           '[CROP-SEED] First-picking castor',
  },
  {
    farmerProfileId: FARMERS.ramesh,
    cropId:          CROPS.maize,
    quantity:        95,
    soldQuantity:    40,
    unit:            'quintal',
    quality:         'GRADE_B',
    harvestDate:     new Date('2025-09-05'),
    storageStatus:   'NOT_STORED',
    expectedPrice:   2100,
    location:        'Sanand',
    district:        'Ahmedabad',
    notes:           '[CROP-SEED] Kharif yellow maize',
  },
  {
    farmerProfileId: FARMERS.ramesh,
    cropId:          CROPS.chickpea,
    quantity:        55,
    soldQuantity:    0,
    unit:            'quintal',
    quality:         'GRADE_A',
    harvestDate:     new Date('2025-03-12'),
    storageStatus:   'IN_STORAGE',
    expectedPrice:   5600,
    location:        'Sanand',
    district:        'Ahmedabad',
    notes:           '[CROP-SEED] Desi chana rabi season',
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
    cropId:          CROPS.cumin,
    quantity:        25,
    soldQuantity:    0,
    unit:            'quintal',
    quality:         'GRADE_A',
    harvestDate:     new Date('2025-02-28'),
    storageStatus:   'IN_STORAGE',
    expectedPrice:   26000,
    location:        'Gondal',
    district:        'Rajkot',
    notes:           '[CROP-SEED] Premium cumin — cold storage',
  },
  {
    farmerProfileId: FARMERS.suresh,
    cropId:          CROPS.bajra,
    quantity:        80,
    soldQuantity:    30,
    unit:            'quintal',
    quality:         'GRADE_B',
    harvestDate:     new Date('2025-09-25'),
    storageStatus:   'NOT_STORED',
    expectedPrice:   2400,
    location:        'Gondal',
    district:        'Rajkot',
    notes:           '[CROP-SEED] Kharif bajra',
  },
  {
    farmerProfileId: FARMERS.suresh,
    cropId:          CROPS.sesame,
    quantity:        18,
    soldQuantity:    0,
    unit:            'quintal',
    quality:         'GRADE_A',
    harvestDate:     new Date('2025-10-20'),
    storageStatus:   'NOT_STORED',
    expectedPrice:   15000,
    location:        'Gondal',
    district:        'Rajkot',
    notes:           '[CROP-SEED] White sesame clean variety',
  },
  {
    farmerProfileId: FARMERS.suresh,
    cropId:          CROPS.soybean,
    quantity:        110,
    soldQuantity:    50,
    unit:            'quintal',
    quality:         'GRADE_B',
    harvestDate:     new Date('2025-10-08'),
    storageStatus:   'NOT_STORED',
    expectedPrice:   4600,
    location:        'Gondal',
    district:        'Rajkot',
    notes:           '[CROP-SEED] Yellow soybean kharif',
  },
  {
    farmerProfileId: FARMERS.suresh,
    cropId:          CROPS.coriander,
    quantity:        30,
    soldQuantity:    10,
    unit:            'quintal',
    quality:         'GRADE_A',
    harvestDate:     new Date('2025-02-14'),
    storageStatus:   'NOT_STORED',
    expectedPrice:   8800,
    location:        'Gondal',
    district:        'Rajkot',
    notes:           '[CROP-SEED] Dried coriander seeds',
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
    cropId:          CROPS.jowar,
    quantity:        90,
    soldQuantity:    45,
    unit:            'quintal',
    quality:         'GRADE_B',
    harvestDate:     new Date('2025-09-18'),
    storageStatus:   'NOT_STORED',
    expectedPrice:   2550,
    location:        'Wadhwan',
    district:        'Surendranagar',
    notes:           '[CROP-SEED] Kharif jowar',
  },
  {
    farmerProfileId: FARMERS.mukesh,
    cropId:          CROPS.mustard,
    quantity:        45,
    soldQuantity:    0,
    unit:            'quintal',
    quality:         'GRADE_A',
    harvestDate:     new Date('2025-01-25'),
    storageStatus:   'IN_STORAGE',
    expectedPrice:   5400,
    location:        'Wadhwan',
    district:        'Surendranagar',
    notes:           '[CROP-SEED] Rabi mustard — awaiting better price',
  },
  {
    farmerProfileId: FARMERS.mukesh,
    cropId:          CROPS.mungBean,
    quantity:        40,
    soldQuantity:    15,
    unit:            'quintal',
    quality:         'GRADE_A',
    harvestDate:     new Date('2025-06-10'),
    storageStatus:   'NOT_STORED',
    expectedPrice:   7600,
    location:        'Wadhwan',
    district:        'Surendranagar',
    notes:           '[CROP-SEED] Summer mung bean',
  },
  {
    farmerProfileId: FARMERS.mukesh,
    cropId:          CROPS.fennel,
    quantity:        22,
    soldQuantity:    0,
    unit:            'quintal',
    quality:         'GRADE_A',
    harvestDate:     new Date('2025-02-20'),
    storageStatus:   'IN_STORAGE',
    expectedPrice:   11500,
    location:        'Wadhwan',
    district:        'Surendranagar',
    notes:           '[CROP-SEED] Fennel seeds in cold storage',
  },
  {
    farmerProfileId: FARMERS.mukesh,
    cropId:          CROPS.pigeonPea,
    quantity:        65,
    soldQuantity:    25,
    unit:            'quintal',
    quality:         'GRADE_B',
    harvestDate:     new Date('2025-11-20'),
    storageStatus:   'NOT_STORED',
    expectedPrice:   6900,
    location:        'Wadhwan',
    district:        'Surendranagar',
    notes:           '[CROP-SEED] Tur dal kharif',
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
