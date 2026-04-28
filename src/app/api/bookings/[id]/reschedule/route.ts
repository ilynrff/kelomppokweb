import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "COMPLETED",
  "REFUNDED",
  "PERLU_VERIFIKASI",
];

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const booking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        ...(session.user.role === "ADMIN" ? {} : { userId: session.user.id }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        court: {
          select: {
            id: true,
            name: true,
            location: true,
            pricePerHour: true,
            image: true,
          },
        },
        payment: {
          select: { id: true, status: true, proofImage: true, createdAt: true },
        },
      },
    });

    if (!booking)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(booking);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const status = body.status;
    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    const normalized = String(status).toUpperCase();
    if (!VALID_STATUSES.includes(normalized)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: params.id },
        include: { payment: true },
      });
      if (!booking) return null;

      let refundAmount: number | undefined = undefined;

      if (normalized === "CONFIRMED") {
        if (booking.payment) {
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: "CONFIRMED" },
          });
        }
      }

      if (normalized === "CANCELLED" || normalized === "EXPIRED") {
        if (booking.payment) {
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: "REJECTED" },
          });
        }
      }

      if (normalized === "REFUNDED") {
        // Calculate refund: booking date is in UTC, endTime is minutes from midnight
        const bookingStart = new Date(booking.date);
        bookingStart.setUTCMinutes(
          bookingStart.getUTCMinutes() + booking.startTime,
        );
        const now = new Date();
        const hoursUntilGame =
          (bookingStart.getTime() - now.getTime()) / 3600000;

        // >= 2 hours before: 100% refund, < 2 hours: 50% refund
        const refundPercent = hoursUntilGame >= 2 ? 100 : 50;
        refundAmount = Math.round((booking.totalPrice * refundPercent) / 100);

        if (booking.payment) {
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: "REJECTED" },
          });
        }
      }

      return tx.booking.update({
        where: { id: params.id },
        data: {
          status: normalized as any,
          ...(refundAmount !== undefined ? { refundAmount } : {}),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          court: {
            select: {
              id: true,
              name: true,
              location: true,
              pricePerHour: true,
              image: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              proofImage: true,
              createdAt: true,
            },
          },
        },
      });
    });

    if (!updatedBooking)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updatedBooking);
  } catch (error: unknown) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
