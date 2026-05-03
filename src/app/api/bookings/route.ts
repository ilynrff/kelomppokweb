import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  DEFAULT_CLOSE_MINUTES,
  DEFAULT_OPEN_MINUTES,
  parseHHmmToMinutes,
  parseSlotToRange,
  coerceDateOnlyUTC,
} from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseBookingTimeRange(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  // Preferred legacy payload: { timeSlots: ["08:00 - 09:00", ...] }
  if (Array.isArray(b.timeSlots) && b.timeSlots.length > 0) {
    const rawSlots = b.timeSlots as unknown[];
    const ranges = rawSlots
      .map((s: unknown) => (typeof s === "string" ? parseSlotToRange(s) : null))
      .filter(Boolean) as { start: number; end: number }[];

    if (ranges.length !== rawSlots.length) {
      return { error: "Invalid timeSlots format" as const };
    }

    ranges.sort((a, b) => a.start - b.start);

    for (let i = 1; i < ranges.length; i++) {
      if (ranges[i].start !== ranges[i - 1].end) {
        return { error: "Time slots must be contiguous" as const };
      }
    }

    const startTime = ranges[0].start;
    const endTime = ranges[ranges.length - 1].end;
    return { startTime, endTime };
  }

  // New payload: { startTime, endTime } in minutes OR "HH:mm"
  const startRaw = b.startTime;
  const endRaw = b.endTime;

  const startTime =
    typeof startRaw === "number"
      ? Math.round(startRaw)
      : typeof startRaw === "string"
        ? parseHHmmToMinutes(startRaw)
        : null;
  const endTime =
    typeof endRaw === "number"
      ? Math.round(endRaw)
      : typeof endRaw === "string"
        ? parseHHmmToMinutes(endRaw)
        : null;

  if (startTime === null || endTime === null) {
    return { error: "Missing startTime/endTime" as const };
  }

  return { startTime, endTime };
}

export async function GET() {
  console.log("API: Fetching bookings...");
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.warn("API: Unauthorized booking fetch attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userId = session.user.id;
    console.log(`API: Fetching for user ${userId} with role ${userRole}`);

    const expirationCutoff = new Date(Date.now() - 15 * 60 * 1000);
    await prisma.booking.updateMany({
      where: { status: "PENDING", createdAt: { lt: expirationCutoff } },
      data: { status: "EXPIRED" },
    });

    const bookings = await prisma.booking.findMany({
      where: userRole === "ADMIN" ? {} : { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        court: { select: { id: true, name: true, location: true, pricePerHour: true, image: true } },
        payment: { select: { id: true, status: true, proofImage: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`API: Found ${bookings.length} bookings.`);
    return NextResponse.json(bookings, { status: 200 });
  } catch (err: unknown) {
    console.error("API Error [GET /api/bookings]:", err);
    return NextResponse.json({ error: "Internal Server Error", details: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  console.log("API: Creating new booking...");
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.warn("API: Unauthorized booking creation attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body: unknown = await req.json();
    const payload = (body ?? {}) as Record<string, unknown>;
    const courtId = payload.courtId;
    const date = payload.date;

    if (!courtId || !date) {
      return NextResponse.json({ error: "Missing required booking details." }, { status: 400 });
    }

    const bookingDate = coerceDateOnlyUTC(String(date));
    if (!bookingDate) {
      return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400 });
    }

    const parsed = parseBookingTimeRange(payload);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const startTime = parsed.startTime;
    const endTime = parsed.endTime;

    if (endTime <= startTime) {
      return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 });
    }
    if (startTime < DEFAULT_OPEN_MINUTES || endTime > DEFAULT_CLOSE_MINUTES) {
      return NextResponse.json({ error: "Time range is outside operating hours" }, { status: 400 });
    }
    if ((endTime - startTime) % 60 !== 0) {
      return NextResponse.json({ error: "Booking duration must be in full hours" }, { status: 400 });
    }

    const lockKey = `${courtId}:${bookingDate.toISOString().slice(0, 10)}`;

    const created = await prisma.$transaction(async (tx) => {
      // Serialize booking creation per (court, date) to prevent races.
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`,
      );

      const expirationCutoff = new Date(Date.now() - 15 * 60 * 1000);
      await tx.booking.updateMany({
        where: { status: "PENDING", courtId: String(courtId), date: bookingDate, createdAt: { lt: expirationCutoff } },
        data: { status: "EXPIRED" },
      });

      const court = await tx.court.findUnique({ where: { id: String(courtId) } });
      if (!court) {
        throw new Error("COURT_NOT_FOUND");
      }

      const conflict = await tx.booking.findFirst({
        where: {
          courtId: String(courtId),
          date: bookingDate,
          status: { in: ["PENDING", "CONFIRMED"] },
          AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
        },
        select: { id: true },
      });

      if (conflict) {
        throw new Error("SLOT_TAKEN");
      }

      const durationHours = (endTime - startTime) / 60;
      const totalPrice = court.pricePerHour * durationHours;

      const booking = await tx.booking.create({
        data: {
          userId,
          courtId: String(courtId),
          date: bookingDate,
          startTime,
          endTime,
          status: "PENDING",
          totalPrice,
        },
        include: {
          court: { select: { id: true, name: true, location: true, pricePerHour: true, image: true } },
        },
      });

      return booking;
    });

    console.log(`API: Booking created: ${created.id}`);
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    console.error("API Error [POST /api/bookings]:", err);
    const message = getErrorMessage(err);
    if (message === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "Slot bentrok: jadwal sudah dibooking pengguna lain. Silakan pilih jam lain." },
        { status: 409 },
      );
    }
    if (message === "COURT_NOT_FOUND") {
      return NextResponse.json({ error: "Lapangan tidak valid." }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}
