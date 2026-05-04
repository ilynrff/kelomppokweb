import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";

import { manageBookingLifecycle } from "@/lib/manageLifecycle";

export const dynamic = "force-dynamic";

/** POST /api/bookings/expire — Manage booking lifecycle (expire and complete) */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await manageBookingLifecycle();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    console.error("API Error [POST /api/bookings/expire]:", err);
    return NextResponse.json({ error: "Internal Server Error", details: getErrorMessage(err) }, { status: 500 });
  }
}
