import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { validateMembershipStatus } from "@/lib/membershipService";
import { getErrorMessage } from "@/lib/errorMessage";
import { getOpenMatchLifecycleState } from "@/lib/bookingTime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      bookingId,
      title,
      matchType,
      skillLevel,
      maxPlayers,
      pricePerPlayer,
      description,
      visibility,
    } = body;

    if (!bookingId || !title || !matchType || !skillLevel || !maxPlayers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (visibility === "MEMBERS_ONLY") {
      const dbUser = await validateMembershipStatus(session.user.id);
      if (!dbUser || dbUser.membershipStatus !== "ACTIVE") {
        return NextResponse.json(
          { error: "Hanya member aktif yang dapat membuat pertandingan khusus member." },
          { status: 403 }
        );
      }
    }

    // Verify booking is owned by host and is CONFIRMED / RESCHEDULE_APPROVED
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: session.user.id,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (
      booking.status !== "CONFIRMED" &&
      booking.status !== "RESCHEDULE_APPROVED" &&
      booking.status !== "CHECKED_IN"
    ) {
      return NextResponse.json(
        { error: "Only confirmed/approved bookings can create open matches" },
        { status: 400 }
      );
    }

    // Check if match already exists for this booking
    const existingMatch = await prisma.openMatch.findUnique({
      where: { bookingId },
    });

    if (existingMatch) {
      return NextResponse.json(
        { error: "An open match has already been created for this booking" },
        { status: 400 }
      );
    }

    // Create the open match and register the host as player 1
    const match = await prisma.$transaction(async (tx) => {
      const newMatch = await tx.openMatch.create({
        data: {
          bookingId,
          hostId: session.user.id,
          title,
          matchType,
          skillLevel,
          maxPlayers: Number(maxPlayers),
          pricePerPlayer: pricePerPlayer ? Number(pricePerPlayer) : null,
          description: description || null,
          visibility: visibility || "PUBLIC",
          status: "OPEN",
        },
      });

      await tx.matchPlayer.create({
        data: {
          matchId: newMatch.id,
          playerId: session.user.id,
        },
      });

      return newMatch;
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const joinedBy = searchParams.get("joinedBy");

    // Dynamic filters
    const whereClause: any = {};

    if (userId) {
      // Created by specific host
      whereClause.hostId = userId;
    } else if (joinedBy) {
      // Joined by specific player (exclude matches where they are the host)
      whereClause.players = {
        some: {
          playerId: joinedBy,
        },
      };
      whereClause.NOT = {
        hostId: joinedBy,
      };
    } else {
      // Standard public feed - show MEMBERS_ONLY to active members, otherwise only PUBLIC
      const session = await getServerSession(authOptions);
      let isMember = false;
      if (session?.user?.id) {
        try {
          const dbUser = await validateMembershipStatus(session.user.id);
          isMember = dbUser?.membershipStatus === "ACTIVE";
        } catch (dbError) {
          console.error("DEBUG: Failed to query user membership status in matches feed:", dbError);
        }
      }

      if (isMember) {
        whereClause.visibility = {
          in: ["PUBLIC", "MEMBERS_ONLY"],
        };
      } else {
        whereClause.visibility = "PUBLIC";
      }

      whereClause.status = {
        in: ["OPEN", "FULL"],
      };
    }

    const matches = await prisma.openMatch.findMany({
      where: whereClause,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Auto-expiration logic: hide EXPIRED matches from the public feed
    const activeMatches = matches.filter(m => {
      if (m.status === "CANCELED") return false;
      
      const state = getOpenMatchLifecycleState({
        date: m.booking.date,
        startTime: m.booking.startTime,
        endTime: m.booking.endTime,
      });

      if (userId || joinedBy) {
        // Personal dashboard views can render history
        return true;
      }

      // Public Open Match feed must strictly exclude EXPIRED sessions
      return state !== "EXPIRED";
    });

    return NextResponse.json(activeMatches);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
