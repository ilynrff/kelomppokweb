import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";
import { normalizeImages } from "@/lib/courtUtils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Booking code is required" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingCode: code },
      include: {
        user: { select: { id: true, name: true, whatsapp: true } },
        court: {
          select: {
            id: true,
            name: true,
            location: true,
            pricePerHour: true,
            images: true,
          },
        },
        payment: {
          select: { id: true, status: true, proofImage: true, createdAt: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking tidak ditemukan" },
        { status: 404 },
      );
    }

    if (booking.court) {
      booking.court.images = normalizeImages(booking.court.images) as any;
    }

    return NextResponse.json(booking, { status: 200 });
  } catch (err: unknown) {
    console.error("API Error [GET /api/admin/bookings/search]:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(err) },
      { status: 500 },
    );
  }
}
