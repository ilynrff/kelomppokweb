import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function normalizeWhatsApp(whatsapp: string) {
  let cleaned = whatsapp.replace(/\D/g, ""); 
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return "+" + cleaned;
}

async function testLogin(waInput: string, passInput: string) {
  console.log(`\nTesting login for: ${waInput}`);
  const normalizedWA = normalizeWhatsApp(waInput);
  console.log(`Normalized: ${normalizedWA}`);
  
  const user = await prisma.user.findUnique({
    where: { whatsapp: normalizedWA }
  });

  if (!user) {
    console.log("❌ User not found in DB");
    return;
  }
  console.log("✅ User found in DB");

  const isValid = await bcrypt.compare(passInput, user.password);
  if (!isValid) {
    console.log("❌ Password mismatch");
  } else {
    console.log("✅ Password valid!");
  }
}

async function main() {
  await testLogin("08123456789", "admin123");
  await testLogin("+628111111111", "user123");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
