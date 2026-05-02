import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  buildDailySlotLabels,
  coerceDateOnlyUTC,
  rangesOverlap,
} from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courtId = searchParams.get("courtId");
  const dateStr = searchParams.get("date");

  if (!courtId || !dateStr) {
    return NextResponse.json({ error: "Missing courtId or date" }, { status: 400 });
  }

  try {
    const queryDate = coerceDateOnlyUTC(dateStr);
    if (!queryDate) {
      return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400 });
    }

    // Auto-expire old pending bookings to free up slots
    const expirationCutoff = new Date(Date.now() - 15 * 60 * 1000);
    await prisma.booking.updateMany({
      where: { status: "PENDING", createdAt: { lt: expirationCutoff } },
      data: { status: "EXPIRED" },
    });

    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId,
        date: queryDate,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { startTime: true, endTime: true },
    });

    const slots = buildDailySlotLabels();
    const availability = slots.map((s) => ({
      time: s.label,
      available: !existingBookings.some((b) =>
        rangesOverlap({ start: b.startTime, end: b.endTime }, { start: s.start, end: s.end }),
      ),
    }));

    return NextResponse.json(availability, { status: 200 });
  } catch (err: unknown) {
    console.error("API Error [GET /api/courts/availability]:", err);
    return NextResponse.json({ error: "Database query failed", details: getErrorMessage(err) }, { status: 500 });
  }
}
