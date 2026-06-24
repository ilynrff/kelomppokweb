import prisma from "@/lib/prisma";

/**
 * Manages the booking lifecycle by expiring pending bookings 
 * that have timed out and completing confirmed bookings 
 * whose end time has passed.
 */
export async function manageBookingLifecycle() {
  const now = new Date();

  // 1. Auto-expire PENDING bookings where expiresAt < now
  const expiredCount = await prisma.booking.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  // 2. Auto-complete CONFIRMED bookings whose end time has passed
  const allConfirmed = await prisma.booking.findMany({
    where: { status: { in: ["CONFIRMED", "RESCHEDULE_APPROVED", "CHECKED_IN"] } },
    select: { id: true, date: true, endTime: true },
  });

  const completedIds = allConfirmed
    .filter((b) => {
      const endDateTime = new Date(b.date);
      endDateTime.setUTCMinutes(endDateTime.getUTCMinutes() + b.endTime);
      return endDateTime < now;
    })
    .map((b) => b.id);

  if (completedIds.length > 0) {
    await prisma.booking.updateMany({
      where: { id: { in: completedIds } },
      data: { status: "COMPLETED" },
    });
  }

  return {
    expired: expiredCount.count,
    completed: completedIds.length,
  };
}
