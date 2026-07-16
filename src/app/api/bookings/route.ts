import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { validateMembershipStatus } from "@/lib/membershipService";
import {
  DEFAULT_CLOSE_MINUTES,
  DEFAULT_OPEN_MINUTES,
  parseHHmmToMinutes,
  parseSlotToRange,
  coerceDateOnlyUTC,
  getVirtualStatus,
} from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";
import { validateBookingMonth } from "@/lib/dateValidation";
import { createNotification } from "@/lib/notifications";
import { getJakartaTime } from "@/lib/timezone";

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

import { normalizeImages } from "@/lib/courtUtils";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get("date");

    const userRole = session.user.role;
    const userId = session.user.id;

    await validateMembershipStatus(userId);

    const whereClause: any = userRole === "ADMIN" ? {} : { userId };

    if (dateQuery) {
      const parsedDate = coerceDateOnlyUTC(dateQuery);
      if (parsedDate) {
        whereClause.date = parsedDate;
      }
    }

    const rawBookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, whatsapp: true, membership: true, membershipStatus: true } },
        court: { select: { id: true, name: true, location: true, pricePerHour: true, images: true, venue: { select: { id: true, name: true } } } },
        payment: { select: { id: true, status: true, proofImage: true, createdAt: true } },
        openMatch: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const bookings = rawBookings.map(b => ({
      ...b,
      status: getVirtualStatus(b as any),
      court: b.court ? {
        ...b.court,
        images: normalizeImages(b.court.images)
      } : null
    }));

    return NextResponse.json(bookings as any, { status: 200 });
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

    // Admin tidak boleh booking
    if (session.user.role === "ADMIN") {
      console.warn("API: Admin attempt to create booking denied.");
      return NextResponse.json({ error: "Admin tidak boleh melakukan booking" }, { status: 403 });
    }

    const userId = session.user.id;

    // Verify user still exists in DB and check membership expiration
    const user = await validateMembershipStatus(userId);

    if (!user) {
      console.warn(`API: Session user ${userId} not found in database. Stale session?`);
      return NextResponse.json(
        { error: "Sesi tidak valid atau user tidak ditemukan. Silakan logout dan login kembali." },
        { status: 401 }
      );
    }

    const body: unknown = await req.json();
    const payload = (body ?? {}) as Record<string, unknown>;
    const courtId = payload.courtId;
    const date = payload.date;
    const equipmentPackage = (payload.equipmentPackage as string) || "NONE";
    const equipmentPrice = Number(payload.equipmentPrice) || 0;

    if (!courtId || !date) {
      return NextResponse.json({ error: "Missing required booking details." }, { status: 400 });
    }

    const bookingDate = coerceDateOnlyUTC(String(date));
    if (!bookingDate) {
      return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400 });
    }

    const monthValidation = validateBookingMonth(bookingDate);
    if (!monthValidation.valid) {
      return NextResponse.json({ error: monthValidation.error }, { status: 400 });
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

    // Past time validation using Jakarta timezone
    const { dateStr: localDateStr, nowMinutes, year: jYear, month: jMonth, day: jDay } = getJakartaTime();
    const bookingDateStr = bookingDate.toISOString().split('T')[0];
    
    if (bookingDateStr < localDateStr) {
      return NextResponse.json({ error: "Tidak bisa booking untuk tanggal yang sudah lewat." }, { status: 400 });
    }
    if (bookingDateStr === localDateStr && startTime <= nowMinutes) {
      return NextResponse.json({ error: "Waktu booking sudah terlewat hari ini." }, { status: 400 });
    }

    // Membership Priority Booking Rule
    const today = new Date(Date.UTC(jYear, jMonth - 1, jDay));
    const target = new Date(Date.UTC(bookingDate.getUTCFullYear(), bookingDate.getUTCMonth(), bookingDate.getUTCDate()));
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isMember = user.membership === "MEMBER" && user.membershipStatus === "ACTIVE";
    const maxDays = isMember ? 14 : 7;
    if (diffDays > maxDays) {
      return NextResponse.json({ 
        error: `Upgrade ke MEMBER untuk bisa booking lebih awal (H-${maxDays} vs H-14).` 
      }, { status: 403 });
    }

    const lockKey = `${courtId}:${bookingDate.toISOString().slice(0, 10)}`;

    const created = await prisma.$transaction(async (tx) => {
      // Serialize booking creation per (court, date) to prevent races.
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`,
      );

      // Auto-expire PENDING bookings where expiresAt < now
      const now = new Date();
      await tx.booking.updateMany({
        where: { status: "PENDING", courtId: String(courtId), date: bookingDate, expiresAt: { lt: now } },
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
      let totalPrice = court.pricePerHour * durationHours;

      // Apply Membership Discount (10% for MEMBER)
      if (isMember) {
        totalPrice = Math.round(totalPrice * 0.9);
      }

      // Add Equipment Package Premium Price
      totalPrice += equipmentPrice;

      // Generate bookingCode: PDL-YYYY-NNNN
      const year = new Date().getFullYear();
      const count = await tx.booking.count({
        where: {
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          },
        },
      });
      const sequence = String(count + 1).padStart(4, "0");
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      const bookingCode = `PDL-${year}-${sequence}-${randomSuffix}`;

      // Set expiresAt = now + 15 minutes
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const booking = await tx.booking.create({
        data: {
          bookingCode,
          userId,
          courtId: String(courtId),
          date: bookingDate,
          startTime,
          endTime,
          status: "PENDING",
          totalPrice,
          expiresAt,
          equipmentPackage,
          equipmentPrice,
          midtransOrderId: `BOOKING-${bookingCode}`,
        },
        include: {
          court: { select: { id: true, name: true, location: true, pricePerHour: true, images: true } },
        },
      });

      if (booking && booking.court) {
        booking.court.images = normalizeImages(booking.court.images) as any;
      }

      return booking;
    });

    console.log(`API: Booking created: ${created.id}`);

    // Generate Midtrans Snap token
    let snapToken = "";
    let snapRedirectUrl = "";
    let clientKey = "";
    let isProduction = false;

    try {
      const { createSnapTransaction } = await import("@/lib/midtrans");
      const midtransResult = await createSnapTransaction(
        `BOOKING-${created.bookingCode}`,
        created.totalPrice,
        {
          name: user?.name || "Player",
          phone: user?.whatsapp || "",
        }
      );
      snapToken = midtransResult.token;
      snapRedirectUrl = midtransResult.redirectUrl;
      clientKey = midtransResult.clientKey;
      isProduction = midtransResult.isProduction;


    } catch (midtransError) {
      console.error("[Midtrans] Failed to generate Snap Token on creation:", midtransError);
    }

    // Create Notification
    await createNotification({
      userId,
      title: "Booking Created!",
      message: `Your reservation ${created.bookingCode} for ${created.court?.name} is awaiting payment.`,
      type: "BOOKING",
    });

    return NextResponse.json(
      {
        ...created,
        midtransToken: snapToken || null,
        midtransRedirectUrl: snapRedirectUrl || null,
        midtransClientKey: clientKey || null,
        midtransIsProduction: isProduction,
      },
      { status: 201 }
    );
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
