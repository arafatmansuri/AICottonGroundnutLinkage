import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding KisanMitra AI database...');

  // ─── Admin ──────────────────────────────────────────────────────────────────
  const adminPwHash = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kisanmitra.ai' },
    update: {},
    create: {
      email: 'admin@kisanmitra.ai',
      passwordHash: adminPwHash,
      role: 'ADMIN',
      adminProfile: {
        create: { name: 'Platform Admin' },
      },
    },
  });
  console.log('✅ Admin created:', adminUser.email);

  // ─── Crops ──────────────────────────────────────────────────────────────────
  const cotton = await prisma.crop.upsert({
    where: { name: 'Cotton' },
    update: {},
    create: { name: 'Cotton', nameHi: 'कपास', nameGu: 'કપાસ', description: 'Long staple cotton' },
  });
  const groundnut = await prisma.crop.upsert({
    where: { name: 'Groundnut' },
    update: {},
    create: { name: 'Groundnut', nameHi: 'मूंगफली', nameGu: 'મગફળી', description: 'Bold groundnut' },
  });
  const wheat = await prisma.crop.upsert({
    where: { name: 'Wheat' },
    update: {},
    create: { name: 'Wheat', nameHi: 'गेहूं', nameGu: 'ઘઉં', description: 'High-yield wheat' },
  });
  const cumin = await prisma.crop.upsert({
    where: { name: 'Cumin' },
    update: {},
    create: { name: 'Cumin', nameHi: 'जीरा', nameGu: 'જીરુ', description: 'Premium cumin seeds' },
  });
  const castor = await prisma.crop.upsert({
    where: { name: 'Castor' },
    update: {},
    create: { name: 'Castor', nameHi: 'अरंडी', nameGu: 'એરંડા', description: 'Castor seeds' },
  });
  console.log('✅ Crops seeded');

  // ─── Mandis ─────────────────────────────────────────────────────────────────
  const mandis = await Promise.all([
    prisma.mandi.upsert({
      where: { id: 'mandi-ahmedabad-001' },
      update: {},
      create: { id: 'mandi-ahmedabad-001', name: 'Ahmedabad Mandi', nameGu: 'અમદાવાદ માર્કેટ', district: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714 },
    }),
    prisma.mandi.upsert({
      where: { id: 'mandi-rajkot-001' },
      update: {},
      create: { id: 'mandi-rajkot-001', name: 'Rajkot Mandi', nameGu: 'રાજકોટ માર્કેટ', district: 'Rajkot', latitude: 22.3039, longitude: 70.8022 },
    }),
    prisma.mandi.upsert({
      where: { id: 'mandi-surendranagar-001' },
      update: {},
      create: { id: 'mandi-surendranagar-001', name: 'Surendranagar Mandi', nameGu: 'સુરેન્દ્રનગર માર્કેટ', district: 'Surendranagar', latitude: 22.7277, longitude: 71.6382 },
    }),
    prisma.mandi.upsert({
      where: { id: 'mandi-bhavnagar-001' },
      update: {},
      create: { id: 'mandi-bhavnagar-001', name: 'Bhavnagar Mandi', nameGu: 'ભાવનગર માર્કેટ', district: 'Bhavnagar', latitude: 21.7645, longitude: 72.1519 },
    }),
    prisma.mandi.upsert({
      where: { id: 'mandi-junagadh-001' },
      update: {},
      create: { id: 'mandi-junagadh-001', name: 'Junagadh Mandi', nameGu: 'જૂનાગઢ માર્કેટ', district: 'Junagadh', latitude: 21.5222, longitude: 70.4579 },
    }),
  ]);
  console.log('✅ Mandis seeded:', mandis.length);

  // ─── Market Prices (last 30 days) ───────────────────────────────────────────
  const now = new Date();
  const priceData: Array<{
    mandiId: string; cropId: string; baseMin: number; baseMax: number; baseModal: number;
  }> = [
    { mandiId: 'mandi-ahmedabad-001', cropId: cotton.id, baseMin: 6700, baseMax: 7400, baseModal: 7050 },
    { mandiId: 'mandi-rajkot-001', cropId: cotton.id, baseMin: 6900, baseMax: 7600, baseModal: 7200 },
    { mandiId: 'mandi-surendranagar-001', cropId: cotton.id, baseMin: 6800, baseMax: 7500, baseModal: 7100 },
    { mandiId: 'mandi-bhavnagar-001', cropId: cotton.id, baseMin: 6750, baseMax: 7450, baseModal: 7050 },
    { mandiId: 'mandi-ahmedabad-001', cropId: groundnut.id, baseMin: 5400, baseMax: 6200, baseModal: 5800 },
    { mandiId: 'mandi-rajkot-001', cropId: groundnut.id, baseMin: 5500, baseMax: 6400, baseModal: 5950 },
    { mandiId: 'mandi-junagadh-001', cropId: groundnut.id, baseMin: 5600, baseMax: 6500, baseModal: 6050 },
    { mandiId: 'mandi-ahmedabad-001', cropId: wheat.id, baseMin: 2200, baseMax: 2700, baseModal: 2450 },
    { mandiId: 'mandi-rajkot-001', cropId: wheat.id, baseMin: 2250, baseMax: 2750, baseModal: 2500 },
    { mandiId: 'mandi-surendranagar-001', cropId: cumin.id, baseMin: 22000, baseMax: 28000, baseModal: 25000 },
    { mandiId: 'mandi-bhavnagar-001', cropId: castor.id, baseMin: 1200, baseMax: 1600, baseModal: 1400 },
  ];

  // Delete existing demo prices to avoid duplicates on re-seed
  await prisma.marketPrice.deleteMany({
    where: { source: { in: ['MOCK', 'SEED'] } },
  });

  for (const pd of priceData) {
    for (let day = 30; day >= 0; day--) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);

      const variation = (Math.random() - 0.4) * 150;
      const modal = Math.round(pd.baseModal + variation + (30 - day) * 3);
      const min = Math.round(modal * 0.95);
      const max = Math.round(modal * 1.05);

      await prisma.marketPrice.create({
        data: {
          mandiId: pd.mandiId,
          cropId: pd.cropId,
          minPrice: min,
          maxPrice: max,
          modalPrice: modal,
          arrivalQty: Math.round(Math.random() * 500 + 100),
          priceDate: date,
          trend: variation > 20 ? 'INCREASING' : variation < -20 ? 'DECREASING' : 'STABLE',
          priceChangePct: parseFloat(((variation / pd.baseModal) * 100).toFixed(2)),
          source: 'SEED',
        },
      });
    }
  }
  console.log('✅ Market prices seeded (30 days of history)');

  // ─── Farmers ────────────────────────────────────────────────────────────────
  const farmerPw = await bcrypt.hash('farmer123', 12);
  const farmers = [
    { email: 'ramesh@farmer.com', phone: '+91 98765 43210', name: 'Ramesh Patel', district: 'Ahmedabad', village: 'Sanand', taluka: 'Sanand' },
    { email: 'suresh@farmer.com', phone: '+91 99887 76655', name: 'Suresh Desai', district: 'Rajkot', village: 'Gondal', taluka: 'Gondal' },
    { email: 'mukesh@farmer.com', phone: '+91 94521 10983', name: 'Mukesh Ahir', district: 'Surendranagar', village: 'Wadhwan', taluka: 'Wadhwan' },
    { email: 'bhavesh@farmer.com', phone: '+91 93741 22334', name: 'Bhavesh Sharma', district: 'Bhavnagar', village: 'Sihor', taluka: 'Sihor' },
    { email: 'kamlesh@farmer.com', phone: '+91 90990 11223', name: 'Kamlesh Thakor', district: 'Junagadh', village: 'Keshod', taluka: 'Keshod' },
  ];

  const farmerProfiles = [];
  for (const f of farmers) {
    const user = await prisma.user.upsert({
      where: { email: f.email },
      update: { phone: f.phone },
      create: {
        email: f.email,
        phone: f.phone,
        passwordHash: farmerPw,
        role: 'FARMER',
        farmerProfile: {
          create: {
            name: f.name,
            district: f.district,
            village: f.village,
            taluka: f.taluka,
            riskProfile: 'MODERATE',
          },
        },
      },
      include: { farmerProfile: true },
    });
    farmerProfiles.push(user.farmerProfile!);
  }
  console.log('✅ Farmers seeded:', farmers.length);

  // ─── Buyers ─────────────────────────────────────────────────────────────────
  const buyerPw = await bcrypt.hash('buyer123', 12);
  const buyerData = [
    {
      email: 'shreeji@buyer.com', phone: '+91 97141 55566',
      company: 'Shreeji Cotton Pvt Ltd', contact: 'Pranjal Mehta',
      district: 'Ahmedabad', state: 'Gujarat', verified: true, rating: 4.8,
    },
    {
      email: 'gujarat@buyer.com', phone: '+91 98250 77889',
      company: 'Gujarat Agro Industries', contact: 'Viral Shah',
      district: 'Rajkot', state: 'Gujarat', verified: true, rating: 4.5,
    },
    {
      email: 'bharat@buyer.com', phone: '+91 93151 33445',
      company: 'Bharat Groundnut Corp', contact: 'Kiran Patel',
      district: 'Junagadh', state: 'Gujarat', verified: true, rating: 4.2,
    },
    {
      email: 'saurashtra@buyer.com', phone: '+91 90161 22334',
      company: 'Saurashtra Traders', contact: 'Devang Modi',
      district: 'Surendranagar', state: 'Gujarat', verified: false, rating: 0,
    },
    {
      email: 'national@buyer.com', phone: '+91 98988 00112',
      company: 'National Agri Exports', contact: 'Nilesh Joshi',
      district: 'Bhavnagar', state: 'Gujarat', verified: true, rating: 4.6,
    },
    {
      email: 'anand@buyer.com', phone: '+91 91736 44556',
      company: 'Anand Wheat Traders', contact: 'Alpesh Chaudhary',
      district: 'Ahmedabad', state: 'Gujarat', verified: true, rating: 4.3,
    },
    {
      email: 'spice@buyer.com', phone: '+91 99099 88776',
      company: 'Spice Route Exports', contact: 'Manish Trivedi',
      district: 'Surendranagar', state: 'Gujarat', verified: true, rating: 4.7,
    },
  ];

  const buyerProfiles = [];
  for (const b of buyerData) {
    const user = await prisma.user.upsert({
      where: { email: b.email },
      update: { phone: b.phone },
      create: {
        email: b.email,
        phone: b.phone,
        passwordHash: buyerPw,
        role: 'BUYER',
        buyerProfile: {
          create: {
            companyName: b.company,
            contactName: b.contact,
            district: b.district,
            state: b.state,
            verificationStatus: b.verified ? 'VERIFIED' : 'PENDING',
            verifiedAt: b.verified ? new Date() : null,
            rating: b.rating,
          },
        },
      },
      include: { buyerProfile: true },
    });
    buyerProfiles.push(user.buyerProfile!);
  }
  console.log('✅ Buyers seeded:', buyerData.length);

  // ─── Buyer Offers ────────────────────────────────────────────────────────────
  await prisma.buyerOffer.deleteMany({ where: { notes: { contains: '[SEED]' } } });

  const offerData = [
    { buyerIdx: 0, cropId: cotton.id,    price: 7450, min: 50,  max: 200, quality: 'GRADE_A', district: 'Ahmedabad' },
    { buyerIdx: 1, cropId: cotton.id,    price: 7250, min: 100, max: 500, quality: 'GRADE_B', district: 'Rajkot' },
    { buyerIdx: 2, cropId: groundnut.id, price: 6100, min: 50,  max: 300, quality: 'GRADE_A', district: 'Junagadh' },
    { buyerIdx: 3, cropId: cotton.id,    price: 7100, min: 30,  max: 150, quality: 'GRADE_B', district: 'Surendranagar' },
    { buyerIdx: 4, cropId: groundnut.id, price: 5950, min: 100, max: 400, quality: 'GRADE_B', district: 'Bhavnagar' },
    { buyerIdx: 1, cropId: groundnut.id, price: 5900, min: 50,  max: 250, quality: 'GRADE_B', district: 'Rajkot' },
    { buyerIdx: 4, cropId: cotton.id,    price: 7350, min: 80,  max: 300, quality: 'GRADE_A', district: 'Bhavnagar' },
    { buyerIdx: 5, cropId: wheat.id,     price: 2600, min: 100, max: 600, quality: 'GRADE_A', district: 'Ahmedabad' },
    { buyerIdx: 5, cropId: wheat.id,     price: 2450, min: 50,  max: 300, quality: 'GRADE_B', district: 'Ahmedabad' },
    { buyerIdx: 6, cropId: cumin.id,     price: 26000, min: 10, max: 80,  quality: 'GRADE_A', district: 'Surendranagar' },
    { buyerIdx: 4, cropId: castor.id,    price: 1450, min: 50,  max: 200, quality: 'GRADE_B', district: 'Bhavnagar' },
  ];

  for (const o of offerData) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    await prisma.buyerOffer.create({
      data: {
        buyerProfileId: buyerProfiles[o.buyerIdx].id,
        cropId: o.cropId,
        offeredPrice: o.price,
        minQuantity: o.min,
        maxQuantity: o.max,
        quality: o.quality as any,
        district: o.district,
        state: 'Gujarat',
        notes: '[SEED] Demo offer',
        expiresAt: expiryDate,
      },
    });
  }
  console.log('✅ Buyer offers seeded:', offerData.length);

  // ─── Farmer Crops ────────────────────────────────────────────────────────────
  await prisma.farmerCrop.deleteMany({ where: { notes: { contains: '[SEED]' } } });

  const farmerCropData = [
    { farmerIdx: 0, cropId: cotton.id,    qty: 150, quality: 'GRADE_A', price: 7500,  location: 'Sanand',   district: 'Ahmedabad',    daysAgo: 45 },
    { farmerIdx: 1, cropId: groundnut.id, qty: 80,  quality: 'GRADE_B', price: 6000,  location: 'Gondal',   district: 'Rajkot',       daysAgo: 20 },
    { farmerIdx: 2, cropId: cotton.id,    qty: 200, quality: 'GRADE_B', price: 7200,  location: 'Wadhwan',  district: 'Surendranagar', daysAgo: 10 },
    { farmerIdx: 3, cropId: wheat.id,     qty: 120, quality: 'GRADE_A', price: 2650,  location: 'Sihor',    district: 'Bhavnagar',    daysAgo: 15 },
    { farmerIdx: 4, cropId: groundnut.id, qty: 95,  quality: 'GRADE_A', price: 6200,  location: 'Keshod',   district: 'Junagadh',     daysAgo: 5  },
    { farmerIdx: 0, cropId: wheat.id,     qty: 60,  quality: 'GRADE_B', price: 2400,  location: 'Sanand',   district: 'Ahmedabad',    daysAgo: 30 },
    { farmerIdx: 2, cropId: cumin.id,     qty: 25,  quality: 'GRADE_A', price: 27000, location: 'Wadhwan',  district: 'Surendranagar', daysAgo: 8  },
    { farmerIdx: 3, cropId: castor.id,    qty: 110, quality: 'GRADE_B', price: 1380,  location: 'Sihor',    district: 'Bhavnagar',    daysAgo: 12 },
    { farmerIdx: 1, cropId: cotton.id,    qty: 70,  quality: 'GRADE_C', price: 6800,  location: 'Gondal',   district: 'Rajkot',       daysAgo: 22 },
    { farmerIdx: 4, cropId: wheat.id,     qty: 90,  quality: 'GRADE_A', price: 2700,  location: 'Keshod',   district: 'Junagadh',     daysAgo: 3  },
  ];

  for (const fc of farmerCropData) {
    await prisma.farmerCrop.create({
      data: {
        farmerProfileId: farmerProfiles[fc.farmerIdx].id,
        cropId: fc.cropId,
        quantity: fc.qty,
        unit: 'quintal',
        quality: fc.quality as any,
        harvestDate: new Date(Date.now() - fc.daysAgo * 86400000),
        storageStatus: 'NOT_STORED',
        expectedPrice: fc.price,
        location: fc.location,
        district: fc.district,
        notes: '[SEED] Demo crop',
      },
    });
  }
  console.log('✅ Farmer crops seeded:', farmerCropData.length);

  // ─── Storage Options ─────────────────────────────────────────────────────────
  await prisma.storageOption.deleteMany({ where: { name: { contains: 'Demo' } } });
  await Promise.all([
    prisma.storageOption.create({ data: { name: 'Demo Ahmedabad Warehouse',   location: 'Ahmedabad',    district: 'Ahmedabad',    costPerUnit: 60, capacity: 5000 } }),
    prisma.storageOption.create({ data: { name: 'Demo Rajkot Cold Storage',   location: 'Rajkot',       district: 'Rajkot',       costPerUnit: 75, capacity: 3000 } }),
    prisma.storageOption.create({ data: { name: 'Demo Surendranagar Store',   location: 'Surendranagar',district: 'Surendranagar', costPerUnit: 50, capacity: 2000 } }),
    prisma.storageOption.create({ data: { name: 'Demo Bhavnagar Agri Store',  location: 'Bhavnagar',    district: 'Bhavnagar',    costPerUnit: 55, capacity: 2500 } }),
    prisma.storageOption.create({ data: { name: 'Demo Junagadh Cold Chain',   location: 'Junagadh',     district: 'Junagadh',     costPerUnit: 65, capacity: 1800 } }),
  ]);
  console.log('✅ Storage options seeded');

  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Admin:   admin@kisanmitra.ai   / admin123');
  console.log('  Farmer:  ramesh@farmer.com     / farmer123');
  console.log('  Farmer:  suresh@farmer.com     / farmer123');
  console.log('  Farmer:  bhavesh@farmer.com    / farmer123');
  console.log('  Buyer:   shreeji@buyer.com     / buyer123');
  console.log('  Buyer:   gujarat@buyer.com     / buyer123');
  console.log('  Buyer:   anand@buyer.com       / buyer123');
  console.log('  Buyer:   spice@buyer.com       / buyer123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
