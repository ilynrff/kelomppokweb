import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  console.log("API: Creating/updating payment proof...");
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userId = session.user.id;

    // Admin tidak boleh upload payment proof
    if (userRole === "ADMIN") {
      console.warn(`API: Admin ${userId} attempted to upload payment proof.`);
      return NextResponse.json({ error: "Admin tidak dapat mengupload bukti pembayaran" }, { status: 403 });
    }

    const body: unknown = await req.json();
    const payload = (body ?? {}) as Record<string, unknown>;
    const bookingId = payload.bookingId;
    const proofImage = payload.proofImage;

    if (!bookingId || !proofImage) {
      return NextResponse.json({ error: "Missing bookingId or proofImage" }, { status: 400 });
    }

    const expirationCutoff = new Date(Date.now() - 15 * 60 * 1000);
    await prisma.booking.updateMany({
      where: { status: "PENDING", createdAt: { lt: expirationCutoff } },
      data: { status: "EXPIRED" },
    });

    const booking = await prisma.booking.findUnique({
      where: { id: String(bookingId) },
      include: { payment: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (userRole !== "ADMIN" && booking.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status === "CANCELLED" || booking.status === "EXPIRED") {
      return NextResponse.json({ error: `Booking is ${booking.status}` }, { status: 400 });
    }

    const payment = await prisma.payment.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        proofImage: String(proofImage),
        status: "PENDING",
      },
      update: {
        proofImage: String(proofImage),
        status: "PENDING",
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: unknown) {
    console.error("API Error [POST /api/payments]:", error);
    return NextResponse.json({ error: "Internal Server Error", details: getErrorMessage(error) }, { status: 500 });
  }
}
