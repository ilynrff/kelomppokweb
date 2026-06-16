import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_COURTS = [
  {
    name: "Padel Court A (Premium)",
    location: "Banyumanik, Semarang",
    pricePerHour: 150000,
    images: [{ url: "/images/court-premium.jpg", isDefault: true, isActive: true }],
    description: "Lapangan premium standar internasional dengan fasilitas lengkap, pencahayaan LED anti-silau, dan lantai turf berkualitas tinggi.",
  },
  {
    name: "Indoor Panoramic Court",
    location: "Tembalang, Semarang",
    pricePerHour: 200000,
    images: [{ url: "/images/court-1.jpg", isDefault: true, isActive: true }],
    description: "Lapangan indoor dengan pencahayaan panoramic modern, full enclosed glass wall, cocok untuk latihan intensif malam hari.",
  },
  {
    name: "Outdoor Classic Court",
    location: "Simpang Lima, Semarang",
    pricePerHour: 120000,
    images: [{ url: "/images/court-2.jpg", isDefault: true, isActive: true }],
    description: "Lapangan outdoor dengan suasana alami dan udara terbuka, rumput sintetis premium dengan sirkulasi udara terbaik.",
  },
];

import { normalizeImages } from "@/lib/courtUtils";

export async function GET() {
  console.log("API: Fetching courts...");
  try {
    const rawCourts = await prisma.court.findMany({
      orderBy: { name: "asc" },
    });

    // Normalize images and auto-seed if table is empty
    const courts = rawCourts.map(c => ({
      ...c,
      images: normalizeImages(c.images)
    }));

    if (courts.length === 0) {
      console.log("API: Court table empty — seeding default courts...");
      await prisma.court.createMany({
        data: DEFAULT_COURTS as any,
        skipDuplicates: true,
      });
      const freshCourts = await prisma.court.findMany({ orderBy: { name: "asc" } });
      return NextResponse.json(freshCourts.map(c => ({
        ...c,
        images: normalizeImages(c.images)
      })), { status: 200 });
    }

    console.log(`API: Found ${courts.length} courts.`);
    return NextResponse.json(courts, { status: 200 });
  } catch (error: any) {
    console.error("API Error [GET /api/courts]:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      code: error.code
    });
    return NextResponse.json({
      error: "Failed to fetch courts.",
      details: getErrorMessage(error),
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  console.log("API: Creating court...");
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await req.json();
    const payload = (body ?? {}) as Record<string, unknown>;
    const name = payload.name;
    const location = payload.location;
    const pricePerHour = payload.pricePerHour;
    const images = payload.images;
    const description = payload.description;

    if (!name || !location || typeof pricePerHour !== "number" || pricePerHour < 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const finalImages = images !== undefined ? normalizeImages(images) : [];

    const court = await prisma.court.create({
      data: {
        name: String(name),
        location: String(location),
        pricePerHour: Math.round(pricePerHour),
        images: finalImages,
        description: description ? String(description) : null,
      },
    });

    return NextResponse.json(court, { status: 201 });
  } catch (error: unknown) {
    console.error("API Error [POST /api/courts]:", error);
    return NextResponse.json({ error: "Failed to create court.", details: getErrorMessage(error) }, { status: 500 });
  }
}