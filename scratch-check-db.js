const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const courts = await prisma.court.findMany();
  console.log("Current courts:");
  console.log(JSON.stringify(courts, null, 2));

  // If there are bookings, let's see how many
  const bookings = await prisma.booking.count();
  console.log("Total bookings:", bookings);
}

run().catch(console.error).finally(() => prisma.$disconnect());
