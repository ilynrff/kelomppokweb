import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  console.log("API: Fetching courts...");
  try {
    const courts = await prisma.court.findMany({
      orderBy: { name: "asc" },
    });
    console.log(`API: Found ${courts.length} courts.`);
    return NextResponse.json(courts, { status: 200 });
  } catch (error: unknown) {
    console.error("API Error [GET /api/courts]:", error);
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
    const image = payload.image;

    if (!name || !location || typeof pricePerHour !== "number" || pricePerHour < 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const court = await prisma.court.create({
      data: {
        name: String(name),
        location: String(location),
        pricePerHour: Math.round(pricePerHour),
        image: image ? String(image) : null,
      },
    });

    return NextResponse.json(court, { status: 201 });
  } catch (error: unknown) {
    console.error("API Error [POST /api/courts]:", error);
    return NextResponse.json({ error: "Failed to create court.", details: getErrorMessage(error) }, { status: 500 });
  }
}
