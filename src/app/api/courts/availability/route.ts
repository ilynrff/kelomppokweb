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

      const existingBookings = await prisma.booking.findMany({
        where: {
          courtId,
          date: queryDate,
          status: { in: ["PENDING", "CONFIRMED", "PERLU_VERIFIKASI", "RESCHEDULE_REQUESTED", "RESCHEDULE_APPROVED"] },
        },
        select: { startTime: true, endTime: true },
      });

      const slots = buildDailySlotLabels();
      
      const now = new Date();
      // Assuming the server timezone or the standard local timezone.
      // To safely compare date strings:
      const localDateStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const availability = slots.map((s) => {
        let isPastTime = false;
        if (dateStr < localDateStr) {
          isPastTime = true; // Selected date is in the past
        } else if (dateStr === localDateStr) {
          if (s.start <= nowMinutes) {
          isPastTime = true; // Selected time is in the past today
        }
      }

      return {
        time: s.label,
        available: !isPastTime && !existingBookings.some((b) =>
          rangesOverlap({ start: b.startTime, end: b.endTime }, { start: s.start, end: s.end }),
        ),
      };
    });

    return NextResponse.json(availability, { status: 200 });
  } catch (err: unknown) {
    console.error("API Error [GET /api/courts/availability]:", err);
    return NextResponse.json({ error: "Database query failed", details: getErrorMessage(err) }, { status: 500 });
  }
}
