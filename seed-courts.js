const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        console.log('🌱 Seeding courts with images and descriptions...');

        // Clear existing data
        await prisma.payment.deleteMany();
        await prisma.booking.deleteMany();
        await prisma.court.deleteMany();
        console.log('✅ Cleared existing data');

        const result = await prisma.court.createMany({
            data: [
                {
                    name: 'Padel Court A (Premium)',
                    location: 'Banyumanik, Semarang',
                    pricePerHour: 150000,
                    image: '/images/court-premium.jpg',
                    description: 'Lapangan premium standar internasional dengan fasilitas terbaik, pencahayaan profesional LED, dan kualitas permukaan yang sempurna. Ideal untuk pemain profesional dan turnamen.',
                },
                {
                    name: 'Indoor Panoramic Court',
                    location: 'Tembalang, Semarang',
                    pricePerHour: 200000,
                    image: '/images/court-1.jpg',
                    description: 'Lapangan indoor dengan pencahayaan panoramic profesional dan sistem ventilasi modern. Nyaman dimainkan kapan saja tanpa terganggu cuaca. Cocok untuk latihan intensif dan pertandingan resmi.',
                },
                {
                    name: 'Outdoor Classic Court',
                    location: 'Simpang Lima, Semarang',
                    pricePerHour: 120000,
                    image: '/images/court-2.jpg',
                    description: 'Lapangan outdoor dengan udara terbuka dan suasana alami yang santai. Memberikan pengalaman bermain yang lebih menyenangkan. Pilihan terbaik untuk bermain casual dan bersantai dengan teman.',
                },
            ],
        });

        console.log(`✅ Courts seeded successfully: ${result.count} courts created`);
    } catch (error) {
        console.error('❌ Error seeding courts:', error);
        process.exit(1);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
