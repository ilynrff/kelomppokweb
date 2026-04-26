import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  console.log("API: Admin verifying payment...");
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session) {
      console.warn("API: Unauthorized payment verification attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== "ADMIN") {
      console.warn(
        `API: Non-admin user ${session.user.id} attempted payment verification.`,
      );
      return NextResponse.json(
        { error: "Only admin can verify payments" },
        { status: 403 },
      );
    }

    const body: unknown = await req.json();
    const payload = (body ?? {}) as Record<string, unknown>;
    const bookingId = payload.bookingId as string;
    const action = payload.action as string;

    // Validate input
    if (!bookingId || !action) {
      return NextResponse.json(
        { error: "Missing bookingId or action" },
        { status: 400 },
      );
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use APPROVE or REJECT" },
        { status: 400 },
      );
    }

    // Find booking with payment
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.payment) {
      return NextResponse.json(
        { error: "Payment not found for this booking" },
        { status: 404 },
      );
    }

    // Verify booking is in correct status
    if (booking.status !== "PERLU_VERIFIKASI") {
      return NextResponse.json(
        {
          error: `Booking cannot be verified. Current status: ${booking.status}`,
        },
        { status: 400 },
      );
    }

    // Update payment and booking status based on action
    let newBookingStatus: "CONFIRMED" | "CANCELLED";
    let newPaymentStatus: "CONFIRMED" | "REJECTED";

    if (action === "APPROVE") {
      newBookingStatus = "CONFIRMED";
      newPaymentStatus = "CONFIRMED";
      console.log(`API: Approving payment for booking ${bookingId}`);
    } else {
      newBookingStatus = "CANCELLED";
      newPaymentStatus = "REJECTED";
      console.log(`API: Rejecting payment for booking ${bookingId}`);
    }

    // Update both payment and booking in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: booking.payment!.id },
        data: { status: newPaymentStatus },
      });

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: newBookingStatus },
        include: {
          user: { select: { id: true, name: true, email: true } },
          court: { select: { id: true, name: true } },
          payment: true,
        },
      });

      return { payment: updatedPayment, booking: updatedBooking };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("API Error [POST /api/admin/verify-payment]:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
