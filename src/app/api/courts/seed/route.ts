import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_COURTS = [
  {
    name: "Padel Court A (Premium)",
    location: "Banyumanik, Semarang",
    pricePerHour: 150000,
    image: "/images/court-premium.jpg",
    description: "Lapangan premium standar internasional dengan fasilitas lengkap, pencahayaan LED anti-silau, dan lantai turf berkualitas tinggi.",
  },
  {
    name: "Indoor Panoramic Court",
    location: "Tembalang, Semarang",
    pricePerHour: 200000,
    image: "/images/court-1.jpg",
    description: "Lapangan indoor dengan pencahayaan panoramic modern, full enclosed glass wall, cocok untuk latihan intensif malam hari.",
  },
  {
    name: "Outdoor Classic Court",
    location: "Simpang Lima, Semarang",
    pricePerHour: 120000,
    image: "/images/court-2.jpg",
    description: "Lapangan outdoor dengan suasana alami dan udara terbuka, rumput sintetis premium dengan sirkulasi udara terbaik.",
  },
];

export async function GET() {
  console.log("API: Running court seed check...");
  try {
    const count = await prisma.court.count();

    if (count > 0) {
      return NextResponse.json({
        message: `Court table already has ${count} courts. No seeding needed.`,
        seeded: false,
        count,
      });
    }

    // Table is empty — insert default courts
    const result = await prisma.court.createMany({
      data: DEFAULT_COURTS,
      skipDuplicates: true,
    });

    console.log(`API: Seeded ${result.count} courts successfully.`);
    return NextResponse.json({
      message: `Berhasil menambahkan ${result.count} lapangan default.`,
      seeded: true,
      count: result.count,
    }, { status: 201 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("API Error [GET /api/courts/seed]:", msg);
    return NextResponse.json({ error: "Gagal seed court data.", details: msg }, { status: 500 });
  }
}
