import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { createNotification } from "@/lib/notifications";
import { sendWhatsAppMessage, formatBookingMessage, formatMembershipMessage } from "@/lib/whatsapp";
import { formatMinutesToHHmm } from "@/lib/bookingTime";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";

  try {
    const body = await req.json();
    const payload = body;

    const orderId = body.order_id;
    const transactionStatus = body.transaction_status;

    console.log("MIDTRANS WEBHOOK RECEIVED");
    console.log("ORDER ID:", orderId);
    console.log("TRANSACTION STATUS:", transactionStatus);

    // STEP 1 — ADD AGGRESSIVE WEBHOOK LOGGING
    console.log("=================================");
    console.log("[WEBHOOK] REQUEST RECEIVED");
    console.log("=================================");
    console.log("[WEBHOOK] ORDER ID:", payload.order_id);
    console.log("[WEBHOOK] STATUS:", payload.transaction_status);
    console.log("[WEBHOOK] FRAUD STATUS:", payload.fraud_status);
    console.log("[WEBHOOK] PAYMENT TYPE:", payload.payment_type);
    console.log("[WEBHOOK] BODY:", payload);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      transaction_id,
      payment_type,
      fraud_status,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      console.warn("⚠️ [Midtrans Webhook] Missing required parameters");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // STEP 2 — Signature Verification & Signature validation log
    const localSignatureSource = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const computedSignature = crypto
      .createHash("sha512")
      .update(localSignatureSource)
      .digest("hex");

    const isValid = computedSignature === signature_key;
    const incomingSignature = signature_key;
    const generatedSignature = computedSignature;
    console.log("[WEBHOOK] Incoming Signature:", incomingSignature);
    console.log("[WEBHOOK] Generated Signature:", generatedSignature);
    console.log("[WEBHOOK] Signature Valid:", isValid);

    if (!isValid) {
      console.error("❌ [Midtrans Webhook] Signature verification failed!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    console.log("✅ [Midtrans Webhook] Signature verified successfully");

    // STEP 5 — Determine target status mapping & Verify Target Status logs
    let targetStatus: "CONFIRMED" | "CANCELLED" | "EXPIRED" | "PENDING" = "PENDING";
    let isSuccess = false;

    if (transaction_status === "capture") {
      if (fraud_status === "challenge") {
        targetStatus = "PENDING";
      } else if (fraud_status === "accept") {
        targetStatus = "CONFIRMED";
        isSuccess = true;
      }
    } else if (transaction_status === "settlement") {
      targetStatus = "CONFIRMED";
      isSuccess = true;
    } else if (transaction_status === "cancel" || transaction_status === "deny") {
      targetStatus = "CANCELLED";
    } else if (transaction_status === "expire") {
      targetStatus = "EXPIRED";
    }

    console.log("[WEBHOOK] transaction_status =", transactionStatus);
    console.log("[WEBHOOK] fraud_status =", fraud_status);
    console.log("[WEBHOOK] targetStatus =", targetStatus);
    console.log("[WEBHOOK] isSuccess =", isSuccess);

    console.log(`[Midtrans Webhook] Order: ${order_id}, Midtrans Status: ${transaction_status}, Internal Target Status: ${targetStatus}`);

    // Parse booking or membership context
    if (order_id.startsWith("BOOKING-")) {
      const bookingCode = order_id.replace("BOOKING-", "");
      console.log(`[Midtrans Webhook] Processing BOOKING change: ${bookingCode}`);

      // STEP 2 — WRAP PAYMENT LOG CREATION
      try {
        await prisma.paymentLog.create({
          data: {
            bookingId: bookingCode,
            orderId: order_id,
            transactionId: transaction_id,
            paymentMethod: payment_type,
            transactionStatus: transaction_status,
            payload: JSON.stringify(body),
          },
        });
      } catch (error: any) {
        console.error("[WEBHOOK] PAYMENT LOG FAILED", error);
        if (error.stack) console.error(error.stack);
      }

      // STEP 3 & STEP 4 — Booking Lookup & Verify Order ID Matching
      console.log("[WEBHOOK] SEARCHING BOOKING");
      console.log("[WEBHOOK] ORDER ID:", order_id);

      let booking = await prisma.booking.findUnique({
        where: { midtransOrderId: order_id },
        include: {
          user: true,
          court: true,
        },
      });

      let parsedBookingCode = "";
      if (!booking) {
        console.log("[WEBHOOK] BOOKING FOUND: false");
        console.log("[WEBHOOK] Attempted midtransOrderId:", order_id);
        
        const rawCode = order_id.replace("BOOKING-", "");
        const parts = rawCode.split("-");
        parsedBookingCode = parts.slice(0, 4).join("-");
        console.log("[WEBHOOK] Attempting bookingCode fallback:", parsedBookingCode);
        
        booking = await prisma.booking.findUnique({
          where: { bookingCode: parsedBookingCode },
          include: {
            user: true,
            court: true,
          },
        });
      }

      if (booking) {
        console.log("[WEBHOOK] BOOKING FOUND: true");
        console.log("[WEBHOOK] booking.midtransOrderId:", booking.midtransOrderId);
        console.log("[WEBHOOK] incoming order_id:", order_id);
        console.log("[WEBHOOK] IDs match exactly:", booking.midtransOrderId === order_id);
      } else {
        console.log("[WEBHOOK] BOOKING FOUND: false");
      }

      if (!booking) {
        console.warn(`⚠️ [Midtrans Webhook] Booking not found for orderId: ${order_id}`);
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      if (booking.status === "CONFIRMED" && targetStatus !== "CANCELLED") {
        console.log(`[Midtrans Webhook] Booking ${booking.bookingCode} is already CONFIRMED. Skipping.`);
        return NextResponse.json({ message: "No action needed (Already Confirmed)" }, { status: 200 });
      }

      // STEP 6 — VERIFY DATABASE UPDATE
      console.log("[WEBHOOK] Current Status:", booking.status);
      console.log("[WEBHOOK] UPDATING BOOKING");
      console.log("[WEBHOOK] Updating To CONFIRMED...");

      // Update booking status and details
      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: targetStatus,
          midtransTransactionId: transaction_id,
          paymentMethod: payment_type,
          paymentApprovedAt: isSuccess ? new Date() : null,
        },
      });

      console.log("[WEBHOOK] UPDATE SUCCESS");
      console.log("[WEBHOOK] Updated Booking:", updatedBooking);

      // Verify Database Actually Changes
      const verification = await prisma.booking.findUnique({
        where: { id: booking.id },
      });
      console.log("[WEBHOOK] DB STATUS AFTER UPDATE =", verification?.status);

      // Handle Notifications & WhatsApp triggers asynchronously on SUCCESS
      if (isSuccess) {
        // Create Notification
        await createNotification({
          userId: booking.userId,
          title: "Payment Confirmed!",
          message: `Your booking ${booking.bookingCode} for ${booking.court?.name} is officially reserved.`,
          type: "PAYMENT",
        });

        // Send WhatsApp
        const waMessage = formatBookingMessage({
          name: booking.user.name,
          bookingCode: booking.bookingCode || "PDL-XXXX",
          courtName: booking.court?.name || "Court",
          date: new Date(booking.date).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          time: `${formatMinutesToHHmm(booking.startTime)} - ${formatMinutesToHHmm(booking.endTime)}`,
        });

        if (booking.user.whatsapp) {
          sendWhatsAppMessage(booking.user.whatsapp, waMessage)
            .then((res) => console.log(`[Webhook WA] Sent to ${booking.user.whatsapp}:`, res))
            .catch((err) => console.error("[Webhook WA] Failed:", err));
        }
      } else if (targetStatus === "CANCELLED" || targetStatus === "EXPIRED") {
        await createNotification({
          userId: booking.userId,
          title: `Booking ${targetStatus === "CANCELLED" ? "Cancelled" : "Expired"}`,
          message: `Your booking transaction for ${booking.bookingCode} was ${targetStatus.toLowerCase()}.`,
          type: "PAYMENT",
        });
      }

    } else if (order_id.startsWith("MEMBER-") || order_id.startsWith("MEMBERSHIP-")) {
      console.log("Membership webhook received");
      console.log("Order ID:", order_id);
      console.log("Transaction Status:", transactionStatus);

      // STEP 2 — WRAP PAYMENT LOG CREATION
      try {
        await prisma.paymentLog.create({
          data: {
            bookingId: null,
            orderId: order_id,
            transactionId: transaction_id,
            paymentMethod: payment_type,
            transactionStatus: transaction_status,
            payload: JSON.stringify(body),
          },
        });
      } catch (error: any) {
        console.error("[WEBHOOK] PAYMENT LOG FAILED", error);
        if (error.stack) console.error(error.stack);
      }

      // Find the request by midtransOrderId first
      let request = await prisma.membershipRequest.findUnique({
        where: { midtransOrderId: order_id },
        include: { user: true },
      });

      if (!request) {
        console.log("[WEBHOOK] MembershipRequest not found by midtransOrderId. Attempting ID fallback...");
        const cleanOrderId = order_id.startsWith("MEMBERSHIP-")
          ? order_id.replace("MEMBERSHIP-", "")
          : order_id.replace("MEMBER-", "");

        const parts = cleanOrderId.split("-");
        const potentialUuid = parts.slice(0, 5).join("-");

        request = await prisma.membershipRequest.findUnique({
          where: { id: potentialUuid },
          include: { user: true },
        });
      }

      if (!request) {
        console.warn(`⚠️ [Midtrans Webhook] Membership request not found for orderId: ${order_id}`);
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
      }

      // If request is already confirmed, ignore further status updates to prevent overrides
      if (request.status === "CONFIRMED" && targetStatus !== "CANCELLED") {
        console.log(`[Midtrans Webhook] Request ${request.id} is already CONFIRMED. Skipping.`);
        return NextResponse.json({ message: "No action needed (Already Confirmed)" }, { status: 200 });
      }

      if (isSuccess) {
        // Calculate the membership expiration extension
        let expiresAt = new Date();
        if (request.user.membershipStatus === "ACTIVE" && request.user.membershipExpiresAt) {
          const currentExpiry = new Date(request.user.membershipExpiresAt);
          if (currentExpiry.getTime() > Date.now()) {
            expiresAt = new Date(currentExpiry.getTime());
          }
        }
        expiresAt.setDate(expiresAt.getDate() + 30);

        await prisma.$transaction([
          prisma.membershipRequest.update({
            where: { id: request.id },
            data: {
              status: "CONFIRMED",
              midtransTransactionId: transaction_id,
              paymentMethod: payment_type,
              paymentApprovedAt: new Date(),
            },
          }),
          prisma.user.update({
            where: { id: request.userId },
            data: {
              membership: "MEMBER",
              membershipStatus: "ACTIVE",
              membershipExpiresAt: expiresAt,
            },
          }),
        ]);

        console.log(`✅ [Midtrans Webhook] Membership request ${request.id} confirmed and User upgraded to MEMBER`);

        const userId = request.userId;
        const oldExpiry = request.user.membershipExpiresAt ? request.user.membershipExpiresAt.toISOString() : "None";
        const newExpiry = expiresAt.toISOString();

        console.log("Membership renewal detected");
        console.log("User:", userId);
        console.log("Old Expiry:", oldExpiry);
        console.log("New Expiry:", newExpiry);

        // Verify database update actually succeeds
        const userVerification = await prisma.user.findUnique({
          where: { id: request.userId },
        });
        console.log("[WEBHOOK] DB USER MEMBERSHIP STATUS AFTER UPDATE =", userVerification?.membershipStatus);
        console.log("[WEBHOOK] DB USER MEMBERSHIP EXPIRES AT AFTER UPDATE =", userVerification?.membershipExpiresAt);

        // Create user notification
        await createNotification({
          userId: request.userId,
          title: "Elite Membership Activated!",
          message: "You now have access to H-14 priority booking, member pricing, and exclusive privileges.",
          type: "MEMBERSHIP",
        });

        // Send WhatsApp welcome
        const waMessage = formatMembershipMessage({
          name: request.user.name,
          expiresAt: expiresAt.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        });

        if (request.user.whatsapp) {
          sendWhatsAppMessage(request.user.whatsapp, waMessage)
            .then((res) => console.log(`[Webhook Membership WA] Sent to ${request.user.whatsapp}:`, res))
            .catch((err) => console.error("[Webhook Membership WA] Failed:", err));
        }
      } else if (targetStatus === "CANCELLED" || targetStatus === "EXPIRED") {
        await prisma.$transaction([
          prisma.membershipRequest.update({
            where: { id: request.id },
            data: {
              status: "REJECTED",
              midtransTransactionId: transaction_id,
              paymentMethod: payment_type,
            },
          }),
          prisma.user.update({
            where: { id: request.userId },
            data: {
              membershipStatus: "FREE",
            },
          }),
        ]);

        console.log(`[Midtrans Webhook] Membership request ${request.id} set to REJECTED`);

        // Verify database update actually succeeds
        const userVerification = await prisma.user.findUnique({
          where: { id: request.userId },
        });
        console.log("[WEBHOOK] DB USER MEMBERSHIP STATUS AFTER REJECTION =", userVerification?.membershipStatus);

        await createNotification({
          userId: request.userId,
          title: "Membership Request Failed",
          message: "Your membership checkout transaction failed or expired.",
          type: "MEMBERSHIP",
        });
      }
    }

    console.log("=========================================");
    console.log("🎉 MIDTRANS WEBHOOK COMPLETED SUCCESS");
    console.log("=========================================\n");

    return NextResponse.json({ success: true, status: targetStatus });

  } catch (error: any) {
    // STEP 7 — ADD FULL ERROR LOGGING
    console.error(error);
    if (error.stack) {
      console.error(error.stack);
    }
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
