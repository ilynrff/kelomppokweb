import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await getUserNotifications(session.user.id);
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, all } = body;

    if (all) {
      await markAllNotificationsAsRead(session.user.id);
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing notification id" }, { status: 400 });
    }

    await markNotificationAsRead(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

