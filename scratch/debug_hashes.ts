import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const users = await prisma.user.findMany();
  console.log("USERS IN DB:");
  users.forEach(u => {
    console.log(`- ${u.name} (${u.whatsapp}): Hash starts with ${u.password.substring(0, 10)}... Length: ${u.password.length}`);
  });
  await prisma.$disconnect();
}

check();
