import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";
import { createNotification } from "@/lib/notifications";
import { sendWhatsAppMessage, formatBookingMessage } from "@/lib/whatsapp";
import { formatMinutesToHHmm } from "@/lib/bookingTime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  console.log("\n=========================================");
  console.log("🚀 BOOKING APPROVAL STARTED");
  console.log("=========================================");
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session) {
      console.warn("API: Unauthorized payment verification attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== "ADMIN") {
      console.warn(`API: Non-admin user ${session.user.id} attempted payment verification.`);
      return NextResponse.json({ error: "Only admin can verify payments" }, { status: 403 });
    }

    const body: unknown = await req.json();
    const payload = (body ?? {}) as Record<string, unknown>;
    const bookingId = payload.bookingId as string;
    const action = payload.action as string;

    console.log(`[AdminAPI] Input Data - BookingID: ${bookingId}, Action: ${action}`);

    // Validate input
    if (!bookingId || !action) {
      console.log("❌ Validation failed: Missing bookingId or action");
      return NextResponse.json({ error: "Missing bookingId or action" }, { status: 400 });
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      console.log(`❌ Validation failed: Invalid action ${action}`);
      return NextResponse.json({ error: "Invalid action. Use APPROVE or REJECT" }, { status: 400 });
    }

    // Find booking with payment
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      console.log("❌ Booking not found in database");
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.payment) {
      console.log("❌ Payment proof not found for this booking");
      return NextResponse.json({ error: "Payment not found for this booking" }, { status: 404 });
    }

    console.log(`[AdminAPI] Found booking code: ${booking.bookingCode}, current status: ${booking.status}`);

    // Verify booking is in correct status
    if (booking.status !== "PERLU_VERIFIKASI") {
      console.log(`⚠️ Status mismatch: Booking cannot be verified. Current status: ${booking.status}`);
      return NextResponse.json(
        { error: `Booking cannot be verified. Current status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Update payment and booking status based on action
    let newBookingStatus: "CONFIRMED" | "CANCELLED";
    let newPaymentStatus: "CONFIRMED" | "REJECTED";

    if (action === "APPROVE") {
      newBookingStatus = "CONFIRMED";
      newPaymentStatus = "CONFIRMED";
      console.log(`[AdminAPI] Setting statuses to CONFIRMED for booking ${bookingId}`);
    } else {
      newBookingStatus = "CANCELLED";
      newPaymentStatus = "REJECTED";
      console.log(`[AdminAPI] Setting statuses to REJECTED/CANCELLED for booking ${bookingId}`);
    }

    // Update both payment and booking in transaction
    const shouldSetApprovedTime = action === "APPROVE" && !booking.paymentApprovedAt;

    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: booking.payment!.id },
        data: { status: newPaymentStatus },
      });

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { 
          status: newBookingStatus,
          ...(shouldSetApprovedTime ? { paymentApprovedAt: new Date() } : {}),
        },
        include: {
          user: { select: { id: true, name: true, whatsapp: true } },
          court: { select: { id: true, name: true } },
          payment: true,
        },
      });

      return { payment: updatedPayment, booking: updatedBooking };
    });

    console.log("✅ Booking and Payment updated in Database successfully");

    // Create Notification for User
    await createNotification({
      userId: result.booking.userId,
      title: action === "APPROVE" ? "Payment Confirmed!" : "Payment Rejected",
      message: action === "APPROVE" 
        ? `Your booking ${result.booking.bookingCode} for ${result.booking.court?.name} is officially reserved.`
        : `Your payment proof for ${result.booking.bookingCode} was rejected. Booking has been cancelled.`,
      type: "PAYMENT",
    });

    // --- WHATSAPP NOTIFICATION ---
    if (action === "APPROVE") {
      console.log(`[AdminAPI] Booking status is APPROVED. Preparing WhatsApp message...`);
      const b = result.booking;
      
      console.log(`[AdminAPI] User details - Name: ${b.user.name}, WhatsApp: ${b.user.whatsapp}`);

      const message = formatBookingMessage({
        name: b.user.name,
        bookingCode: b.bookingCode || "PDL-XXXX",
        courtName: b.court?.name || "Court",
        date: new Date(b.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: `${formatMinutesToHHmm(b.startTime)} - ${formatMinutesToHHmm(b.endTime)}`,
      });

      if (b.user.whatsapp) {
        console.log(`[AdminAPI] Triggering sendWhatsAppMessage asynchronously to: ${b.user.whatsapp}`);
        sendWhatsAppMessage(b.user.whatsapp, message)
          .then((waResult) => {
            console.log(`[AdminAPI] WhatsApp transmission completed. Result:`, waResult);
          })
          .catch((err) => {
            console.error(`[AdminAPI] WhatsApp transmission failed:`, err);
          });
      } else {
        console.log("⚠️ [AdminAPI] User has no WhatsApp number in profile. Skipping WA notification.");
      }
    }

    console.log("=========================================");
    console.log("🎉 BOOKING APPROVAL COMPLETED SUCCESSFULLY");
    console.log("=========================================\n");

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ [AdminAPI] Error during booking verification process:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

