import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Check and auto-expire PENDING bookings where expiresAt < now
 * Called periodically from frontend to keep status in sync
 */
export async function POST() {
  try {
    const now = new Date();
    
    const updated = await prisma.booking.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      data: { status: "EXPIRED" },
    });

    return NextResponse.json(
      {
        success: true,
        expiredCount: updated.count,
        timestamp: now,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("API Error [POST /api/bookings/check-expiry]:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
