import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  console.log("API: Updating court...", params.id);
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await req.json();
    const payload = (body ?? {}) as Record<string, unknown>;
<<<<<<< HEAD
    const { name, location, pricePerHour, image } = payload;
=======
    const { name, location, pricePerHour, image, description } = payload;
>>>>>>> backend-logicServer

    const updated = await prisma.court.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: String(name) } : {}),
        ...(location !== undefined ? { location: String(location) } : {}),
        ...(pricePerHour !== undefined
          ? { pricePerHour: Math.round(Number(pricePerHour)) }
          : {}),
        ...(image !== undefined ? { image: image ? String(image) : null } : {}),
<<<<<<< HEAD
=======
        ...(description !== undefined ? { description: description ? String(description) : null } : {}),
>>>>>>> backend-logicServer
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    console.error("API Error [PATCH /api/courts/[id]]:", error);
    return NextResponse.json({ error: "Failed to update court.", details: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  console.log("API: Deleting court...", params.id);
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.court.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("API Error [DELETE /api/courts/[id]]:", error);
    return NextResponse.json({ error: "Failed to delete court.", details: getErrorMessage(error) }, { status: 500 });
  }
}
