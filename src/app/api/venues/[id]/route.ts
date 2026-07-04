import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const name = payload.name;
    const location = payload.location;
    const description = payload.description;
    const thumbnail = payload.thumbnail;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = String(name);
    if (location !== undefined) dataToUpdate.location = String(location);
    if (description !== undefined) dataToUpdate.description = description ? String(description) : null;
    if (thumbnail !== undefined) dataToUpdate.thumbnail = thumbnail ? String(thumbnail) : null;

    const venue = await prisma.venue.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: { courts: true }
    });

    return NextResponse.json(venue, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Failed to update venue.", details: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prisma will delete the venue, but wait, if it has bookings?
    // Venues don't have bookings directly, but courts do.
    // Let's just delete the venue and cascade? We haven't set Cascade delete on Venue -> Court in prisma schema!
    // We better just delete courts first.
    await prisma.court.deleteMany({
      where: { venueId: params.id }
    });

    await prisma.venue.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Failed to delete venue.", details: getErrorMessage(error) }, { status: 500 });
  }
}
