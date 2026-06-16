import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingCode } = await req.json();
    if (!bookingCode) {
      return NextResponse.json({ error: "Booking code is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Allow check-in if CONFIRMED or RESCHEDULE_APPROVED
    if (!["CONFIRMED", "RESCHEDULE_APPROVED"].includes(booking.status)) {
      return NextResponse.json({ 
        error: `Cannot check-in. Booking status is ${booking.status}` 
      }, { status: 400 });
    }

    // Check-in validation window (Semarang time UTC+7)
    const now = new Date();
    const localNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const localTodayStr = localNow.toISOString().split('T')[0];
    const bookingDateStr = new Date(booking.date).toISOString().split('T')[0];
    
    // Current minutes from midnight in local time
    const nowMinutes = localNow.getUTCHours() * 60 + localNow.getUTCMinutes();

    if (bookingDateStr > localTodayStr) {
      return NextResponse.json({ 
        error: "Belum waktunya bermain (jadwal untuk hari mendatang)." 
      }, { status: 400 });
    }
    
    if (bookingDateStr < localTodayStr) {
      return NextResponse.json({ 
        error: "Waktu bermain sudah selesai (jadwal hari sudah lewat)." 
      }, { status: 400 });
    }

    // Same day validation
    if (nowMinutes < (booking.startTime - 10)) {
      return NextResponse.json({ 
        error: "Check-in hanya bisa dilakukan maksimal 10 menit sebelum jadwal" 
      }, { status: 400 });
    }

    if (nowMinutes > booking.endTime) {
      return NextResponse.json({ 
        error: "Waktu bermain sudah selesai" 
      }, { status: 400 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CHECKED_IN" as any },
      include: {
        user: { select: { name: true, whatsapp: true } },
        court: { select: { name: true, location: true } }
      }
    });

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error: unknown) {
    console.error("Check-in Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: getErrorMessage(error) }, { status: 500 });
  }
}
