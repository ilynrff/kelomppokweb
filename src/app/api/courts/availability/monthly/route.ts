import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  buildDailySlotLabels,
  rangesOverlap,
} from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courtId = searchParams.get("courtId");
  const monthStr = searchParams.get("month"); // Expected format: YYYY-MM

  if (!courtId || !monthStr) {
    return NextResponse.json({ error: "Missing courtId or month" }, { status: 400 });
  }

  try {
    const [year, month] = monthStr.split("-").map(Number);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month format. Use YYYY-MM." }, { status: 400 });
    }

    // Start and end of the month in UTC
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const bookings = await prisma.booking.findMany({
      where: {
        courtId,
        date: {
          gte: startDate,
          lt: endDate,
        },
        status: { in: ["PENDING", "CONFIRMED", "PERLU_VERIFIKASI", "RESCHEDULE_REQUESTED", "RESCHEDULE_APPROVED"] },
      },
      select: { date: true, startTime: true, endTime: true },
    });

    const slots = buildDailySlotLabels();
    const totalSlotsPerDay = slots.length;

    const result = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(Date.UTC(year, month - 1, day));
      const dateKey = currentDate.toISOString().split("T")[0];

      const dayBookings = bookings.filter(b => b.date.toISOString().split("T")[0] === dateKey);
      
      const availableSlotsCount = slots.filter(s => 
        !dayBookings.some(b => rangesOverlap({ start: b.startTime, end: b.endTime }, { start: s.start, end: s.end }))
      ).length;

      result.push({
        date: dateKey,
        availableSlots: availableSlotsCount,
        totalSlots: totalSlotsPerDay,
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    console.error("API Error [GET /api/courts/availability/monthly]:", err);
    return NextResponse.json({ error: "Database query failed", details: getErrorMessage(err) }, { status: 500 });
  }
}
