import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Keep this seed script idempotent and focused (courts only).
  console.log("🌱 Seeding courts...");

  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.court.deleteMany();

  const result = await prisma.court.createMany({
    data: [
      {
        name: "Padel Court A (Premium)",
        location: "Banyumanik, Semarang",
        pricePerHour: 150000,
        image:
          "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=800",
      },
      {
        name: "Indoor Panoramic Court",
        location: "Tembalang, Semarang",
        pricePerHour: 200000,
        image:
          "https://images.unsplash.com/photo-1622325055171-897b9ee9059e?auto=format&fit=crop&q=80&w=800",
      },
      {
        name: "Outdoor Classic Court",
        location: "Simpang Lima, Semarang",
        pricePerHour: 120000,
        image:
          "https://images.unsplash.com/photo-1592919016382-7718e268923a?auto=format&fit=crop&q=80&w=800",
      },
    ],
  });

  console.log(`✅ Courts created: ${result.count}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
