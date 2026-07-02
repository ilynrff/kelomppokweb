import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";
import { normalizeImages } from "@/lib/courtUtils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const rawCourts = await prisma.court.findMany({
      orderBy: { name: "asc" },
      include: { venue: true }
    });

    const courts = rawCourts.map((c: any) => ({
      ...c,
      images: normalizeImages(c.images)
    }));

    return NextResponse.json(courts, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: "Failed to fetch courts.",
      details: getErrorMessage(error),
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const name = payload.name;
    const type = payload.type || null;
    const location = payload.location || "";
    const pricePerHour = payload.pricePerHour;
    const images = payload.images;
    const description = payload.description;
    const venueId = payload.venueId;
    const isActive = payload.isActive !== undefined ? Boolean(payload.isActive) : true;

    if (!name || !venueId || typeof pricePerHour !== "number" || pricePerHour < 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const finalImages = images !== undefined ? normalizeImages(images) : [];

    const court = await prisma.court.create({
      data: {
        name: String(name),
        type: type ? String(type) : null,
        location: String(location),
        pricePerHour: Math.round(pricePerHour),
        images: finalImages,
        description: description ? String(description) : null,
        venueId: String(venueId),
        isActive
      },
    });

    return NextResponse.json(court, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Failed to create court.", details: getErrorMessage(error) }, { status: 500 });
  }
}