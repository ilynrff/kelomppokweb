import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";
import { normalizeImages } from "@/lib/courtUtils";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const name = payload.name;
    const type = payload.type;
    const location = payload.location;
    const pricePerHour = payload.pricePerHour;
    const images = payload.images;
    const description = payload.description;
    const isActive = payload.isActive;
    const venueId = payload.venueId;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = String(name);
    if (type !== undefined) dataToUpdate.type = type ? String(type) : null;
    if (location !== undefined) dataToUpdate.location = String(location);
    if (pricePerHour !== undefined) dataToUpdate.pricePerHour = Math.round(Number(pricePerHour));
    if (images !== undefined) dataToUpdate.images = normalizeImages(images);
    if (description !== undefined) dataToUpdate.description = description ? String(description) : null;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);
    if (venueId !== undefined) dataToUpdate.venueId = String(venueId);

    const court = await prisma.court.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json(court, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Failed to update court.", details: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if there are bookings for this court
    const bookingCount = await prisma.booking.count({
      where: { courtId: params.id }
    });

    if (bookingCount > 0) {
      // Instead of throwing an error, we should probably set isActive to false to prevent future bookings
      // but if the user explicitly clicked "delete", they want it gone.
      // Wait, deleting a court with bookings will crash Prisma because of relation unless onCascade delete.
      // Let's soft delete or block. Let's just block deletion.
      return NextResponse.json({ error: "Cannot delete court with existing bookings." }, { status: 400 });
    }

    await prisma.court.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Failed to delete court.", details: getErrorMessage(error) }, { status: 500 });
  }
}
