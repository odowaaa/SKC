import {
  FurnishingStatus,
  ListingType,
  PrismaClient,
  PropertyStatus,
  PropertyType,
  Role,
} from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AMODA database...");

  const password = await argon2.hash("Passw0rd!");

  const admin = await prisma.user.upsert({
    where: { email: "admin@amoda.app" },
    update: {},
    create: {
      email: "admin@amoda.app",
      firstName: "Amina",
      lastName: "Admin",
      passwordHash: password,
      role: Role.SUPER_ADMIN,
      isEmailVerified: true,
    },
  });

  const agentUser = await prisma.user.upsert({
    where: { email: "agent@amoda.app" },
    update: {},
    create: {
      email: "agent@amoda.app",
      firstName: "Xasan",
      lastName: "Agent",
      passwordHash: password,
      role: Role.AGENT,
      isEmailVerified: true,
    },
  });

  const agent = await prisma.agent.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: {
      userId: agentUser.id,
      agencyName: "AMODA Realty",
      licenseNumber: "SO-AG-00123",
      bio: "Senior property consultant covering Mogadishu and Hargeisa.",
      yearsExperience: 8,
      specialties: ["Residential", "Commercial"],
      serviceAreas: ["Mogadishu", "Hargeisa"],
      isVerified: true,
    },
  });

  const ownerUser = await prisma.user.upsert({
    where: { email: "owner@amoda.app" },
    update: {},
    create: {
      email: "owner@amoda.app",
      firstName: "Faadumo",
      lastName: "Owner",
      passwordHash: password,
      role: Role.OWNER,
      isEmailVerified: true,
    },
  });

  const owner = await prisma.owner.upsert({
    where: { userId: ownerUser.id },
    update: {},
    create: { userId: ownerUser.id, companyName: "Faadumo Properties" },
  });

  await prisma.user.upsert({
    where: { email: "customer@amoda.app" },
    update: {},
    create: {
      email: "customer@amoda.app",
      firstName: "Cabdi",
      lastName: "Customer",
      passwordHash: password,
      role: Role.CUSTOMER,
      isEmailVerified: true,
    },
  });

  const amenityNames = [
    "Swimming Pool",
    "Gym",
    "24/7 Security",
    "Parking",
    "Garden",
    "Air Conditioning",
    "Backup Generator",
    "Borehole Water",
    "Furnished",
    "Elevator",
  ];
  const amenities = await Promise.all(
    amenityNames.map((name) =>
      prisma.amenity.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  const categoryNames = ["Residential", "Commercial", "Luxury", "New Development"];
  await Promise.all(
    categoryNames.map((name) =>
      prisma.category.upsert({
        where: { slug: name.toLowerCase().replace(/\s+/g, "-") },
        update: {},
        create: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
      }),
    ),
  );

  const sampleProperties = [
    {
      title: "Modern 4-Bedroom Villa in Hodan",
      description:
        "A stunning modern villa featuring spacious living areas, a private garden, and premium finishes throughout. Located in the heart of Hodan district with easy access to schools and shopping.",
      type: PropertyType.VILLA,
      listingType: ListingType.SALE,
      price: 185000,
      bedrooms: 4,
      bathrooms: 3,
      areaSqm: 320,
      city: "Mogadishu",
      district: "Hodan",
      isFeatured: true,
      isLuxury: true,
    },
    {
      title: "Cozy 2-Bedroom Apartment in Hargeisa",
      description:
        "Comfortable and well-maintained apartment close to the city center, ideal for small families or young professionals seeking a quiet neighborhood.",
      type: PropertyType.APARTMENT,
      listingType: ListingType.RENT,
      price: 450,
      bedrooms: 2,
      bathrooms: 1,
      areaSqm: 95,
      city: "Hargeisa",
      district: "Downtown",
      isFeatured: true,
    },
    {
      title: "Prime Commercial Office Space in Bakaara",
      description:
        "Ground-floor commercial unit suitable for retail or office use, situated in the busy Bakaara market area with high foot traffic.",
      type: PropertyType.OFFICE,
      listingType: ListingType.COMMERCIAL,
      price: 900,
      areaSqm: 150,
      city: "Mogadishu",
      district: "Bakaara",
    },
    {
      title: "Beachfront Land Plot in Lido",
      description:
        "Rare beachfront land plot with direct ocean access, perfect for a resort or private residence development.",
      type: PropertyType.LAND,
      listingType: ListingType.SALE,
      price: 260000,
      areaSqm: 1200,
      city: "Mogadishu",
      district: "Lido",
      isLuxury: true,
    },
    {
      title: "Family Townhouse in Daljirka",
      description:
        "Three-story townhouse with a rooftop terrace, dedicated parking, and a secure compound wall — great for growing families.",
      type: PropertyType.TOWNHOUSE,
      listingType: ListingType.SALE,
      price: 145000,
      bedrooms: 5,
      bathrooms: 4,
      areaSqm: 280,
      city: "Mogadishu",
      district: "Daljirka",
    },
    {
      title: "Furnished Studio near University",
      description:
        "Fully furnished studio apartment within walking distance of Mogadishu University, ideal for students or short-term stays.",
      type: PropertyType.STUDIO,
      listingType: ListingType.RENT,
      price: 220,
      bedrooms: 1,
      bathrooms: 1,
      areaSqm: 40,
      city: "Mogadishu",
      district: "Wadajir",
      furnishing: FurnishingStatus.FURNISHED,
    },
  ];

  for (const [index, data] of sampleProperties.entries()) {
    const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`;
    await prisma.property.upsert({
      where: { slug },
      update: {},
      create: {
        ...data,
        slug,
        referenceCode: `AMD-SEED-${1000 + index}`,
        currency: "USD",
        country: "Somalia",
        status: PropertyStatus.PUBLISHED,
        publishedAt: new Date(),
        createdById: index % 2 === 0 ? agentUser.id : ownerUser.id,
        agentId: index % 2 === 0 ? agent.id : undefined,
        ownerId: index % 2 !== 0 ? owner.id : undefined,
        media: {
          create: [
            {
              kind: "IMAGE",
              url: `https://picsum.photos/seed/amoda-${index}/1200/800`,
              sortOrder: 0,
            },
          ],
        },
        amenities: {
          create: amenities.slice(0, 3).map((amenity) => ({ amenityId: amenity.id })),
        },
      },
    });
  }

  console.log("Seed complete. Demo accounts (password: Passw0rd!):");
  console.log(`  - ${admin.email} (SUPER_ADMIN)`);
  console.log(`  - ${agentUser.email} (AGENT)`);
  console.log(`  - ${ownerUser.email} (OWNER)`);
  console.log("  - customer@amoda.app (CUSTOMER)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
