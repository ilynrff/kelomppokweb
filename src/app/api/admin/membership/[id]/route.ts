import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendWhatsAppMessage, formatMembershipMessage } from "@/lib/whatsapp";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  console.log("\n=========================================");
  console.log("🚀 MEMBERSHIP APPROVAL PROCESS STARTED");
  console.log("=========================================");
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      console.warn("API: Unauthorized membership verification attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json(); // "CONFIRMED" or "REJECTED"
    const requestId = params.id;

    console.log(`[AdminMembershipAPI] Request ID: ${requestId}, Action: ${status}`);

    const request = await prisma.membershipRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!request) {
      console.log("❌ Membership request not found in database");
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    console.log(`[AdminMembershipAPI] Found request for user: ${request.user.name}, current membership status: ${request.user.membershipStatus}`);

    if (status === "CONFIRMED") {
      const now = new Date();
      let expiresAt = new Date();

      // Logic: If user is already ACTIVE and not expired, extend from existing date
      if (
        request.user.membershipStatus === "ACTIVE" && 
        request.user.membershipExpiresAt && 
        new Date(request.user.membershipExpiresAt) > now
      ) {
        expiresAt = new Date(request.user.membershipExpiresAt);
      }

      // Add 30 days
      expiresAt.setDate(expiresAt.getDate() + 30);

      await prisma.$transaction([
        // 1. Update request status
        prisma.membershipRequest.update({
          where: { id: requestId },
          data: { status: "CONFIRMED" }
        }),
        // 2. Update user to ACTIVE MEMBER
        prisma.user.update({
          where: { id: request.userId },
          data: {
            membership: "MEMBER",
            membershipStatus: "ACTIVE",
            membershipExpiresAt: expiresAt
          }
        })
      ]);

      console.log("✅ Membership request and User profile updated in Database successfully");

      // Create Notification for User
      await createNotification({
        userId: request.userId,
        title: "Elite Membership Activated!",
        message: "You now have access to H-14 priority booking, member pricing, and exclusive privileges.",
        type: "MEMBERSHIP",
      });

      // --- WHATSAPP NOTIFICATION ---
      console.log(`[AdminMembershipAPI] Triggering welcome WhatsApp message...`);
      const waMessage = formatMembershipMessage({
        name: request.user.name,
        expiresAt: expiresAt.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
      });

      if (request.user.whatsapp) {
        console.log(`[AdminMembershipAPI] Triggering sendWhatsAppMessage asynchronously to: ${request.user.whatsapp}`);
        sendWhatsAppMessage(request.user.whatsapp, waMessage)
          .then((waResult) => {
            console.log(`[AdminMembershipAPI] WhatsApp welcome message completed. Result:`, waResult);
          })
          .catch((err) => {
            console.error(`[AdminMembershipAPI] WhatsApp welcome message failed:`, err);
          });
      } else {
        console.log("⚠️ [AdminMembershipAPI] User has no WhatsApp number. Skipping WA message.");
      }

      console.log("=========================================");
      console.log("🎉 MEMBERSHIP APPROVAL COMPLETED SUCCESSFULLY");
      console.log("=========================================\n");

      return NextResponse.json({ message: "Membership approved and extended successfully" });
    } else if (status === "REJECTED") {
      await prisma.$transaction([
        prisma.membershipRequest.update({
          where: { id: requestId },
          data: { status: "REJECTED" }
        }),
        prisma.user.update({
          where: { id: request.userId },
          data: {
            membershipStatus: "FREE"
          }
        })
      ]);

      console.log("✅ Membership request updated to REJECTED in Database successfully");

      // Create Notification for User
      await createNotification({
        userId: request.userId,
        title: "Membership Request Rejected",
        message: "Your membership payment proof was rejected. Please contact support if you believe this is an error.",
        type: "MEMBERSHIP",
      });

      console.log("=========================================");
      console.log("🎉 MEMBERSHIP REJECTION COMPLETED");
      console.log("=========================================\n");

      return NextResponse.json({ message: "Membership rejected successfully" });
    }

    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  } catch (error: any) {
    console.error("❌ [AdminMembershipAPI] Error during membership verification process:", error);
    return NextResponse.json({ error: "Failed to update membership status" }, { status: 500 });
  }
}
