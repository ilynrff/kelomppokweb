import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.membership !== "BASIC") {
      return NextResponse.json({ error: "User is already a Member" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { membership: "MEMBER" }
    });

    return NextResponse.json({ 
      message: "Success! You are now a MEMBER",
      membership: updatedUser.membership
    }, { status: 200 });
  } catch (error: any) {
    console.error("UPGRADE ERROR:", error);
    return NextResponse.json({ error: "Failed to upgrade membership" }, { status: 500 });
  }
}
