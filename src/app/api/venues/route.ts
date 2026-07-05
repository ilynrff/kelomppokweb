import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const venues = await prisma.venue.findMany({
      orderBy: { name: "asc" },
      include: {
        courts: {
          orderBy: { name: "asc" },
        },
      },
    });
    return NextResponse.json(venues, { status: 200 });
  } catch (error: any) {
    console.error("===== API /api/venues ERROR =====");
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch venues.",
        details: error?.message,
        stack: error?.stack,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const name = String(payload.name || "");
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const location = String(payload.location || "");
    const description = payload.description
      ? String(payload.description)
      : null;
    const thumbnail = payload.thumbnail ? String(payload.thumbnail) : null;

    if (!name || !location) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Check slug uniqueness
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const exists = await prisma.venue.findUnique({
        where: { slug: finalSlug },
      });
      if (!exists) break;
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const venue = await prisma.venue.create({
      data: {
        name,
        slug: finalSlug,
        location,
        description,
        thumbnail,
      },
      include: { courts: true },
    });

    return NextResponse.json(venue, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Failed to create venue.", details: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
