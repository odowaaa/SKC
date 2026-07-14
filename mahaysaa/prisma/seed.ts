import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES: { name: string; nameSo: string; slug: string; commissionPct: number }[] = [
  { name: "Construction", nameSo: "Dhismo", slug: "construction", commissionPct: 4 },
  { name: "Electrical", nameSo: "Korontada", slug: "electrical", commissionPct: 5 },
  { name: "Plumbing", nameSo: "Biyoxidhka", slug: "plumbing", commissionPct: 5 },
  { name: "Tools", nameSo: "Qalabka", slug: "tools", commissionPct: 5 },
  { name: "Furniture", nameSo: "Alaabta Guriga", slug: "furniture", commissionPct: 6 },
  { name: "Home Appliances", nameSo: "Qalabka Guriga", slug: "home-appliances", commissionPct: 6 },
  { name: "Electronics", nameSo: "Elektaroonigga", slug: "electronics", commissionPct: 6 },
  { name: "Phones", nameSo: "Telefanada", slug: "phones", commissionPct: 5 },
  { name: "Computers", nameSo: "Kombiyuutarrada", slug: "computers", commissionPct: 5 },
  { name: "Fashion", nameSo: "Dharka", slug: "fashion", commissionPct: 8 },
  { name: "Shoes", nameSo: "Kabaha", slug: "shoes", commissionPct: 8 },
  { name: "Kitchen", nameSo: "Jikada", slug: "kitchen", commissionPct: 6 },
  { name: "Food", nameSo: "Cuntada", slug: "food", commissionPct: 10 },
  { name: "Restaurant", nameSo: "Makhaayadaha", slug: "restaurant", commissionPct: 10 },
  { name: "Medical", nameSo: "Caafimaadka", slug: "medical", commissionPct: 3 },
  { name: "Agriculture", nameSo: "Beeraha", slug: "agriculture", commissionPct: 4 },
  { name: "Livestock", nameSo: "Xoolaha", slug: "livestock", commissionPct: 4 },
  { name: "Vehicle Parts", nameSo: "Qaybaha Gaadhiga", slug: "vehicle-parts", commissionPct: 5 },
  { name: "Motorcycles", nameSo: "Mootooyinka", slug: "motorcycles", commissionPct: 5 },
  { name: "Cars", nameSo: "Baabuurta", slug: "cars", commissionPct: 3 },
  { name: "Heavy Equipment", nameSo: "Qalabka Culus", slug: "heavy-equipment", commissionPct: 3 },
  { name: "Office Supplies", nameSo: "Alaabta Xafiiska", slug: "office-supplies", commissionPct: 6 },
  { name: "Stationery", nameSo: "Qalabka Waxbarashada", slug: "stationery", commissionPct: 6 },
  { name: "Cleaning Materials", nameSo: "Alaabta Nadaafadda", slug: "cleaning-materials", commissionPct: 7 },
  { name: "Solar Equipment", nameSo: "Qalabka Solar-ka", slug: "solar-equipment", commissionPct: 5 },
  { name: "Water Systems", nameSo: "Nidaamka Biyaha", slug: "water-systems", commissionPct: 5 },
  { name: "Security Equipment", nameSo: "Qalabka Amniga", slug: "security-equipment", commissionPct: 5 },
  { name: "Industrial Equipment", nameSo: "Qalabka Warshadaha", slug: "industrial-equipment", commissionPct: 4 },
  { name: "Others", nameSo: "Kale", slug: "others", commissionPct: 5 },
];

async function main() {
  console.log("Seeding categories...");
  const categoryRecords: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const rec = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameSo: c.nameSo, commissionPct: c.commissionPct },
      create: c,
    });
    categoryRecords[c.slug] = rec.id;
  }

  const passwordHash = await bcrypt.hash("Password123!", 10);

  console.log("Seeding admin user...");
  await prisma.user.upsert({
    where: { phone: "+252610000001" },
    update: {},
    create: {
      name: "MAHAYSAA Admin",
      phone: "+252610000001",
      email: "admin@mahaysaa.so",
      passwordHash,
      role: "ADMIN",
      language: "so",
    },
  });

  console.log("Seeding demo customer...");
  const customer = await prisma.user.upsert({
    where: { phone: "+252610000002" },
    update: {},
    create: {
      name: "Amina Hassan",
      phone: "+252610000002",
      email: "amina@example.com",
      passwordHash,
      role: "CUSTOMER",
      language: "so",
    },
  });

  console.log("Seeding demo supplier...");
  const supplierUser = await prisma.user.upsert({
    where: { phone: "+252610000003" },
    update: {},
    create: {
      name: "Cabdi Warsame",
      phone: "+252610000003",
      email: "cabdi@hardware.so",
      passwordHash,
      role: "SUPPLIER",
      language: "so",
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { userId: supplierUser.id },
    update: {},
    create: {
      userId: supplierUser.id,
      businessName: "Hodan Hardware Store",
      ownerName: "Cabdi Warsame",
      whatsapp: "+252610000003",
      gpsLat: 2.0469,
      gpsLng: 45.3182,
      city: "Mogadishu",
      description: "Alaabta dhismaha, qalabka biyoxidhka iyo korontada.",
      status: "APPROVED",
      paymentMethods: JSON.stringify(["CASH_ON_DELIVERY", "EVC_PLUS", "ZAAD"]),
    },
  });

  await prisma.supplierAgreement.upsert({
    where: { supplierId: supplier.id },
    update: {},
    create: {
      supplierId: supplier.id,
      signatureName: "Cabdi Warsame",
      accepted: true,
    },
  });

  console.log("Seeding demo products...");
  const products = [
    { name: "Cement Bag 50kg", nameSo: "Kiish Shubka 50kg", price: 8.5, slug: "construction", stock: 200 },
    { name: "Steel Rod 12mm", nameSo: "Bir 12mm", price: 6.2, slug: "construction", stock: 500 },
    { name: "LED Bulb 12W", nameSo: "Nal LED 12W", price: 2.0, slug: "electrical", stock: 300 },
    { name: "PVC Pipe 1inch", nameSo: "Tuubo PVC 1inch", price: 3.5, slug: "plumbing", stock: 150 },
  ];
  for (const p of products) {
    await prisma.product.create({
      data: {
        supplierId: supplier.id,
        categoryId: categoryRecords[p.slug],
        name: p.name,
        nameSo: p.nameSo,
        price: p.price,
        stock: p.stock,
        condition: "NEW",
      },
    });
  }

  console.log("Seeding demo driver...");
  const driverUser = await prisma.user.upsert({
    where: { phone: "+252610000004" },
    update: {},
    create: {
      name: "Xasan Cali",
      phone: "+252610000004",
      email: "xasan@driver.so",
      passwordHash,
      role: "DRIVER",
      language: "so",
    },
  });

  const driver = await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      fullName: "Xasan Cali",
      nationalId: "SO-1234567",
      licenseNumber: "DL-998877",
      isAvailable: true,
      currentLat: 2.0400,
      currentLng: 45.3200,
      status: "APPROVED",
    },
  });

  await prisma.vehicle.create({
    data: {
      driverId: driver.id,
      type: "TUK_TUK",
      plate: "SL-1122",
      capacityKg: 150,
    },
  });

  console.log("Seed complete.");
  console.log("Demo accounts (password: Password123!):");
  console.log(" Admin:    +252610000001");
  console.log(" Customer: +252610000002");
  console.log(" Supplier: +252610000003");
  console.log(" Driver:   +252610000004");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
