import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";
import { coerceDateOnlyUTC, parseSlotToRange } from "@/lib/bookingTime";

export const dynamic = "force-dynamic";

/** POST /api/bookings/[id]/reschedule — User requests a reschedule */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });
    if (!booking)
      return NextResponse.json(
        { error: "Booking tidak ditemukan" },
        { status: 404 },
      );
    if (booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (booking.status !== "CONFIRMED") {
      const msg =
        booking.status === "RESCHEDULE_APPROVED"
          ? "Booking ini sudah pernah di-reschedule (hanya boleh 1x)."
          : "Reschedule hanya bisa untuk booking yang sudah CONFIRMED.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Check 12-hour rule
    const bookingStart = new Date(booking.date);
    bookingStart.setUTCMinutes(
      bookingStart.getUTCMinutes() + booking.startTime,
    );
    const hoursUntil = (bookingStart.getTime() - Date.now()) / 3600000;
    if (hoursUntil < 12) {
      return NextResponse.json(
        {
          error:
            "Reschedule hanya bisa jika > 12 jam sebelum jadwal. Booking tidak bisa direschedule.",
        },
        { status: 400 },
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const newDate = coerceDateOnlyUTC(String(body.date ?? ""));
    if (!newDate)
      return NextResponse.json(
        { error: "Tanggal baru tidak valid (format YYYY-MM-DD)" },
        { status: 400 },
      );

    let rescheduleStartTime: number;
    let rescheduleEndTime: number;

    if (body.timeSlot && typeof body.timeSlot === "string") {
      const range = parseSlotToRange(body.timeSlot);
      if (!range)
        return NextResponse.json(
          { error: "Format jam tidak valid (contoh: '09:00 - 10:00')" },
          { status: 400 },
        );
      rescheduleStartTime = range.start;
      rescheduleEndTime = range.end;
    } else if (
      typeof body.startTime === "number" &&
      typeof body.endTime === "number"
    ) {
      rescheduleStartTime = body.startTime;
      rescheduleEndTime = body.endTime;
    } else {
      return NextResponse.json(
        { error: "Sertakan timeSlot atau startTime dan endTime" },
        { status: 400 },
      );
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: "RESCHEDULE_REQUESTED",
        rescheduleDate: newDate,
        rescheduleStartTime,
        rescheduleEndTime,
        rescheduleNote: body.note ? String(body.note) : null,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    console.error("API Error [POST reschedule]:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

/** PATCH /api/bookings/[id]/reschedule — Admin approves or rejects */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });
    if (!booking)
      return NextResponse.json(
        { error: "Booking tidak ditemukan" },
        { status: 404 },
      );
    if (booking.status !== "RESCHEDULE_REQUESTED") {
      return NextResponse.json(
        { error: "Booking tidak dalam status RESCHEDULE_REQUESTED" },
        { status: 400 },
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const action = String(body.action ?? "").toUpperCase();

    if (action === "APPROVE") {
      if (
        !booking.rescheduleDate ||
        booking.rescheduleStartTime == null ||
        booking.rescheduleEndTime == null
      ) {
        return NextResponse.json(
          { error: "Data reschedule tidak lengkap" },
          { status: 400 },
        );
      }

      // 1. RE-VERIFY conflict on the new slot right before approval
      const conflict = await prisma.booking.findFirst({
        where: {
          id: { not: booking.id },
          courtId: booking.courtId,
          date: booking.rescheduleDate,
          // Block if any of these statuses already occupy the slot
          status: {
            in: [
              "PENDING",
              "CONFIRMED",
              "PERLU_VERIFIKASI",
              "RESCHEDULE_REQUESTED",
              "RESCHEDULE_APPROVED",
            ],
          },
          AND: [
            { startTime: { lt: booking.rescheduleEndTime } },
            { endTime: { gt: booking.rescheduleStartTime } },
          ],
        },
      });

      if (conflict) {
        return NextResponse.json(
          {
            error:
              "Slot baru sudah terisi oleh booking lain. Reschedule gagal.",
          },
          { status: 409 },
        );
      }

      console.log(`[Reschedule] Approving booking ${params.id}:`, {
        old: {
          date: booking.date,
          start: booking.startTime,
          end: booking.endTime,
        },
        new: {
          date: booking.rescheduleDate,
          start: booking.rescheduleStartTime,
          end: booking.rescheduleEndTime,
        },
      });

      const updated = await prisma.booking.update({
        where: { id: params.id },
        data: {
          status: "RESCHEDULE_APPROVED", // Keep as APPROVED to prevent further reschedules
          date: booking.rescheduleDate,
          startTime: booking.rescheduleStartTime,
          endTime: booking.rescheduleEndTime,
          rescheduleDate: null,
          rescheduleStartTime: null,
          rescheduleEndTime: null,
          rescheduleNote: null,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "REJECT") {
      const updated = await prisma.booking.update({
        where: { id: params.id },
        data: {
          status: "RESCHEDULE_REJECTED",
          rescheduleDate: null,
          rescheduleStartTime: null,
          rescheduleEndTime: null,
          rescheduleNote: null,
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: "Action tidak valid. Gunakan 'approve' atau 'reject'" },
      { status: 400 },
    );
  } catch (error: unknown) {
    console.error("API Error [PATCH reschedule]:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
