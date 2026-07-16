import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { validateMembershipStatus } from "@/lib/membershipService";
import { createSnapTransaction } from "@/lib/midtrans";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get current user details from database and check membership expiration
    const user = await validateMembershipStatus(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const membershipAmount = 150000; // Standard 30 days membership fee

    // Create a new MembershipRequest in PENDING status
    const request = await prisma.membershipRequest.create({
      data: {
        userId,
        amount: membershipAmount,
        status: "PENDING",
      },
    });

    const midtransOrderId = `MEMBER-${request.id}`;

    // Update with the generated midtransOrderId
    await prisma.membershipRequest.update({
      where: { id: request.id },
      data: { midtransOrderId },
    });

    console.log(`[MembershipCheckoutAPI] Created request ${request.id}, Order ID: ${midtransOrderId}`);

    // Generate Snap token
    const midtransResult = await createSnapTransaction(
      midtransOrderId,
      membershipAmount,
      {
        name: user.name,
        phone: user.whatsapp,
      }
    );

    return NextResponse.json({
      requestId: request.id,
      token: midtransResult.token,
      redirectUrl: midtransResult.redirectUrl,
      clientKey: midtransResult.clientKey,
      isProduction: midtransResult.isProduction,
    });

  } catch (error: any) {
    console.error("[MembershipCheckoutAPI] Error in checkout:", error);
    return NextResponse.json(
      { error: "Gagal memproses checkout membership", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
