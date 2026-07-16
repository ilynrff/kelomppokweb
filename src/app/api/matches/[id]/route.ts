import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateMembershipStatus } from "@/lib/membershipService";
import { getErrorMessage } from "@/lib/errorMessage";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const match = await prisma.openMatch.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            whatsapp: true,
          },
        },
        players: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                whatsapp: true,
              },
            },
          },
        },
        booking: {
          include: {
            court: {
              select: {
                id: true,
                name: true,
                location: true,
                venue: { select: { name: true } }
              },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Open Match not found" }, { status: 404 });
    }

    // Access control: Members Only gating check
    if (match.visibility === "MEMBERS_ONLY") {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized. Members-only match." }, { status: 401 });
      }
      const dbUser = await validateMembershipStatus(session.user.id);
      if (!dbUser || dbUser.membershipStatus !== "ACTIVE") {
        return NextResponse.json({ error: "Access denied. Members-only match." }, { status: 403 });
      }
    }

    return NextResponse.json(match);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
