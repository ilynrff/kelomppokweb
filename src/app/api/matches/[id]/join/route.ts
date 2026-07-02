import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/errorMessage";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const matchId = params.id;

    // Find the match
    const match = await prisma.openMatch.findUnique({
      where: { id: matchId },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            whatsapp: true,
          },
        },
        players: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status !== "OPEN") {
      return NextResponse.json({ error: "This match is no longer open for joining" }, { status: 400 });
    }

    // Enforce Members Only join gating check
    if (match.visibility === "MEMBERS_ONLY") {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { membershipStatus: true }
      });
      if (!dbUser || dbUser.membershipStatus !== "ACTIVE") {
        return NextResponse.json(
          { error: "This match is restricted to active Members only" },
          { status: 403 }
        );
      }
    }

    // Check if user is already in the match (either as host or joined player)
    const isAlreadyPlayer = match.players.some((p) => p.playerId === session.user.id);
    if (isAlreadyPlayer) {
      return NextResponse.json({ error: "You have already joined this match" }, { status: 400 });
    }

    // Check capacity limit
    const currentCount = match.players.length;
    if (currentCount >= match.maxPlayers) {
      // Safety update status to FULL
      await prisma.openMatch.update({
        where: { id: matchId },
        data: { status: "FULL" },
      });
      return NextResponse.json({ error: "Match is already full" }, { status: 400 });
    }

    // Join match in a safe transaction
    const { newCount } = await prisma.$transaction(async (tx) => {
      await tx.matchPlayer.create({
        data: {
          matchId,
          playerId: session.user.id,
        },
      });

      const updatedPlayers = await tx.matchPlayer.findMany({
        where: { matchId },
      });

      const count = updatedPlayers.length;

      // If full, automatically update status to FULL
      if (count >= match.maxPlayers) {
        await tx.openMatch.update({
          where: { id: matchId },
          data: { status: "FULL" },
        });
      }

      return { newCount: count };
    });

    // Create notifications for host (Part 7)
    await createNotification({
      userId: match.hostId,
      title: "🎾 Someone joined your match",
      message: `${session.user.name} joined your match '${match.title}'. Current players: ${newCount}/${match.maxPlayers}.`,
      type: "SYSTEM",
    });

    if (newCount === match.maxPlayers) {
      await createNotification({
        userId: match.hostId,
        title: "🎾 Your match is now full",
        message: `Your match '${match.title}' is officially full with ${newCount}/${match.maxPlayers} players registered!`,
        type: "SYSTEM",
      });
    }

    // Future-Ready WhatsApp Trigger Structure (Part 8)
    console.log("==========================================");
    console.log("== MATCH JOIN WA TRIGGER (FUTURE-READY) ==");
    console.log(`Match Host: ${match.host.name} (${match.host.whatsapp})`);
    console.log(`Joined Player: ${session.user.name}`);
    console.log(`Match Room: ${match.title}`);
    console.log(`Trigger Payload: "${session.user.name} joined your match '${match.title}'. Contact them to sync."`);
    console.log("==========================================");

    return NextResponse.json({
      message: "Successfully joined match. Please contact the host for payment coordination.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
