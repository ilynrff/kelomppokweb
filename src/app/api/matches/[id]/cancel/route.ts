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
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Only host can cancel
    if (match.hostId !== session.user.id) {
      return NextResponse.json({ error: "Only the host can cancel this match" }, { status: 403 });
    }

    // Update status to CANCELED
    await prisma.openMatch.update({
      where: { id: matchId },
      data: { status: "CANCELED" },
    });

    // Notify all joined players (excluding the host)
    const joinedPlayers = match.players.filter((p) => p.playerId !== session.user.id);

    for (const p of joinedPlayers) {
      await createNotification({
        userId: p.playerId,
        title: "🎾 Match canceled",
        message: `The open match '${match.title}' hosted by ${session.user.name} has been canceled.`,
        type: "SYSTEM",
      });

      // Future-Ready WhatsApp Trigger Structure for Joined Players (Part 8)
      console.log("==========================================");
      console.log("== MATCH CANCEL WA TRIGGER (FUTURE-READY) ==");
      console.log(`Recipient Player: ${p.player.name} (${p.player.whatsapp})`);
      console.log(`Match Room: ${match.title}`);
      console.log(`Trigger Payload: "Match '${match.title}' hosted by ${session.user.name} has been canceled."`);
      console.log("==========================================");
    }

    return NextResponse.json({ message: "Match successfully canceled." });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
