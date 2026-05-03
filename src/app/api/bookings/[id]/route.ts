import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  console.log("API: Fetching booking...", params.id);
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userId = session.user.id;

    const booking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        ...(userRole === "ADMIN" ? {} : { userId }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        court: { select: { id: true, name: true, location: true, pricePerHour: true, image: true } },
        payment: { select: { id: true, status: true, proofImage: true, createdAt: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(booking, { status: 200 });
  } catch (error: unknown) {
    console.error("API Error [GET /api/bookings/[id]]:", error);
    return NextResponse.json({ error: "Internal Server Error", details: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await req.json();
    const payload = (body ?? {}) as Record<string, unknown>;
    const status = payload.status;
    if (!status || typeof status !== "string") {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const normalized = String(status).toUpperCase();
    if (!["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"].includes(normalized)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: params.id },
        include: { payment: true },
      });
      if (!booking) {
        return null;
      }

      if (normalized === "CONFIRMED") {
        // If a payment exists, confirm it too. If not, we still allow manual confirmation.
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

      return tx.booking.update({
        where: { id: params.id },
        data: { status: normalized },
        include: {
          user: { select: { id: true, name: true, email: true } },
          court: { select: { id: true, name: true, location: true, pricePerHour: true, image: true } },
          payment: { select: { id: true, status: true, proofImage: true, createdAt: true } },
        },
      });
    });

    if (!updatedBooking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updatedBooking, { status: 200 });
  } catch (error: unknown) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Internal Server Error", details: getErrorMessage(error) }, { status: 500 });
  }
}
