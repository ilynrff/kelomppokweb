import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";
import { getVirtualStatus, formatMinutesToHHmm } from "@/lib/bookingTime";
import { createNotification } from "@/lib/notifications";
import { sendWhatsAppMessage, formatBookingMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED", "COMPLETED", "REFUNDED", "PERLU_VERIFIKASI"];

import { normalizeImages } from "@/lib/courtUtils";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const booking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        ...(session.user.role === "ADMIN" ? {} : { userId: session.user.id }),
      },
      include: {
        user: { select: { id: true, name: true, whatsapp: true } },
        court: { select: { id: true, name: true, location: true, pricePerHour: true, images: true } },
        payment: { select: { id: true, status: true, proofImage: true, createdAt: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Normalize court images
    if (booking.court) {
      booking.court.images = normalizeImages(booking.court.images) as any;
    }

    return NextResponse.json({
      ...booking,
      status: getVirtualStatus(booking as any),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Internal Server Error", details: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as Record<string, unknown>;
    const status = body.status;
    if (!status || typeof status !== "string") {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const normalized = String(status).toUpperCase();
    if (!VALID_STATUSES.includes(normalized)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    // Check permissions
    const bookingCheck = await prisma.booking.findUnique({
      where: { id: params.id },
    });
    if (!bookingCheck) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const isAdmin = session.user.role === "ADMIN";
    const isOwner = bookingCheck.userId === session.user.id;

    if (!isAdmin) {
      if (!isOwner) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (normalized !== "CANCELLED") {
        return NextResponse.json({ error: "Tidak diizinkan mengubah status selain CANCELLED" }, { status: 403 });
      }
      if (bookingCheck.status !== "PENDING") {
        return NextResponse.json({ error: "Hanya booking PENDING yang dapat dibatalkan" }, { status: 400 });
      }
    }


    const updatedBooking = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: params.id },
        include: { payment: true },
      });
      if (!booking) return null;

      let refundAmount: number | undefined = undefined;

      if (normalized === "CONFIRMED") {
        if (booking.payment) {
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: "CONFIRMED" },
          });
        }
      }

      if (normalized === "CANCELLED" || normalized === "EXPIRED") {
        if (booking.payment) {
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: "REJECTED" },
          });
        }
      }

      if (normalized === "REFUNDED") {
        // Calculate refund: booking date is in UTC, endTime is minutes from midnight
        const bookingStart = new Date(booking.date);
        bookingStart.setUTCMinutes(bookingStart.getUTCMinutes() + booking.startTime);
        const now = new Date();
        const hoursUntilGame = (bookingStart.getTime() - now.getTime()) / 3600000;

        // >= 2 hours before: 100% refund, < 2 hours: 50% refund
        const refundPercent = hoursUntilGame >= 2 ? 100 : 50;
        refundAmount = Math.round((booking.totalPrice * refundPercent) / 100);

        if (booking.payment) {
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: "REJECTED" },
          });
        }
      }

      const isApprovedNow = normalized === "CONFIRMED" && !booking.paymentApprovedAt;

      const result = await tx.booking.update({
        where: { id: params.id },
        data: {
          status: normalized as any,
          ...(refundAmount !== undefined ? { refundAmount } : {}),
          ...(isApprovedNow ? { paymentApprovedAt: new Date() } : {}),
        },
        include: {
          user: { select: { id: true, name: true, whatsapp: true } },
          court: { select: { id: true, name: true, location: true, pricePerHour: true, images: true } },
          payment: { select: { id: true, status: true, proofImage: true, createdAt: true } },
        },
      });

      if (result && result.court) {
        result.court.images = normalizeImages(result.court.images) as any;
      }
      return result;
    });

    if (!updatedBooking) {
      console.log("❌ [BookingsAPI] Booking not found after transaction update");
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    console.log("=========================================");
    console.log("🚀 BOOKING STATUS PATCH COMPLETED");
    console.log("=========================================");
    console.log(`[BookingsAPI] New Status: ${normalized}`);

    // --- NOTIFICATION & WHATSAPP TRIGGERS ---
    const b = updatedBooking;
    
    // In-app notifications
    if (normalized === "CONFIRMED") {
      console.log(`[BookingsAPI] Booking approved. Creating in-app notification...`);
      await createNotification({
        userId: b.userId,
        title: "Payment Confirmed!",
        message: `Your booking ${b.bookingCode || "PDL-XXXX"} for ${b.court?.name || "Court"} is officially reserved.`,
        type: "PAYMENT",
      });

      console.log(`[BookingsAPI] User details - Name: ${b.user.name}, WhatsApp: ${b.user.whatsapp}`);
      console.log(`[BookingsAPI] Triggering WhatsApp notification...`);

      const message = formatBookingMessage({
        name: b.user.name,
        bookingCode: b.bookingCode || "PDL-XXXX",
        courtName: b.court?.name || "Court",
        date: new Date(b.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: `${formatMinutesToHHmm(b.startTime)} - ${formatMinutesToHHmm(b.endTime)}`,
      });

      if (b.user.whatsapp) {
        console.log(`[BookingsAPI] Triggering sendWhatsAppMessage asynchronously to: ${b.user.whatsapp}`);
        sendWhatsAppMessage(b.user.whatsapp, message)
          .then((waResult) => {
            console.log(`[BookingsAPI] WhatsApp sending completed. Result:`, waResult);
          })
          .catch((err) => {
            console.error(`[BookingsAPI] WhatsApp sending failed:`, err);
          });
      } else {
        console.log("⚠️ [BookingsAPI] User has no WhatsApp number in profile. Skipping WA notification.");
      }
    } else if (normalized === "CANCELLED") {
      console.log(`[BookingsAPI] Booking cancelled. Creating in-app notification...`);
      await createNotification({
        userId: b.userId,
        title: "Payment Rejected",
        message: `Your payment proof for ${b.bookingCode || "PDL-XXXX"} was rejected. Booking has been cancelled.`,
        type: "PAYMENT",
      });
    }

    console.log("=========================================");
    console.log("🎉 BOOKING STATUS PATCH FINISHED SUCCESS");
    console.log("=========================================\n");

    return NextResponse.json({
      ...updatedBooking,
      status: getVirtualStatus(updatedBooking as any),
    });
  } catch (error: unknown) {
    console.error("❌ [BookingsAPI] Error updating booking:", error);
    return NextResponse.json({ error: "Internal Server Error", details: getErrorMessage(error) }, { status: 500 });
  }
}
