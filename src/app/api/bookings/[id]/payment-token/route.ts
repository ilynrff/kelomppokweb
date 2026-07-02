import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createSnapTransaction } from "@/lib/midtrans";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Step 1 — Verify API Route Is Actually Being Hit
  console.log("[PaymentTokenAPI] Route hit");
  console.log("[PaymentTokenAPI] Booking ID:", params.id);

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookingId = params.id;
    const userId = session.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, name: true, whatsapp: true } },
      },
    });

    // Step 2 — Verify Booking Retrieval
    console.log("[PaymentTokenAPI] Booking:", booking);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== userId && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: `Booking ini sudah tidak pending (Status: ${booking.status})` },
        { status: 400 }
      );
    }

    // Check if the payment deadline has passed
    if (booking.expiresAt && new Date(booking.expiresAt) < new Date()) {
      // Auto-expire
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Waktu pembayaran telah habis. Silakan lakukan booking baru." },
        { status: 410 }
      );
    }

    // Generate a fresh midtransOrderId with a timestamp suffix to prevent order_id collision in Midtrans
    const midtransOrderId = `BOOKING-${booking.bookingCode}-${Date.now()}`;
    await prisma.booking.update({
      where: { id: bookingId },
      data: { midtransOrderId },
    });

    console.log(`[PaymentTokenAPI] Generating dynamic snap token for booking ${bookingId}, Order ID: ${midtransOrderId}`);

    // Generate/retrieve token from Midtrans Snap
    const midtransResult = await createSnapTransaction(
      midtransOrderId,
      booking.totalPrice,
      {
        name: booking.user.name,
        phone: booking.user.whatsapp,
      }
    );

    return NextResponse.json({
      token: midtransResult.token,
      redirectUrl: midtransResult.redirectUrl,
      clientKey: midtransResult.clientKey,
      isProduction: midtransResult.isProduction,
    });
  } catch (error: any) {
    console.error("[PaymentTokenAPI] Error retrieving token:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mendapatkan token pembayaran", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
