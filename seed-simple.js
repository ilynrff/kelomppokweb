const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    accelerateUrl: 'file:./dev.db' // dummy
});

async function main() {
    await prisma.court.createMany({
        data: [
            { name: 'Padel Court A (Premium)', location: 'Banyumanik, Semarang', pricePerHour: 150000 },
            { name: 'Indoor Panoramic Court', location: 'Tembalang, Semarang', pricePerHour: 200000 },
            { name: 'Outdoor Classic Court', location: 'Simpang Lima, Semarang', pricePerHour: 120000 },
        ],
    });
    console.log('Seeded courts');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });