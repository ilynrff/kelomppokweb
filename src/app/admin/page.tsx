import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { manageBookingLifecycle } from "@/lib/manageLifecycle";
import { Suspense } from "react";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  // Manage lifecycle before fetching
  await manageBookingLifecycle();

  // Fetch initial data on server
  const [bookings, courts, membershipRequests, users, openMatches] = await Promise.all([
    prisma.booking.findMany({
      include: {
        user: { select: { id: true, name: true, whatsapp: true, membership: true, membershipStatus: true } },
        court: { select: { id: true, name: true, location: true, pricePerHour: true, venue: { select: { name: true } } } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.court.findMany({ 
      include: { venue: true },
      orderBy: { name: "asc" } 
    }),
    prisma.membershipRequest.findMany({
      include: { user: { select: { name: true, whatsapp: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      include: {
        bookings: {
          include: {
            court: { select: { name: true, location: true } },
            payment: true,
          }
        },
        membershipRequests: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.openMatch.findMany({
      include: {
        booking: {
          include: {
            court: { select: { name: true, location: true, venue: { select: { name: true } } } },
          }
        },
        host: { select: { name: true, whatsapp: true } },
        players: {
          include: {
            player: { select: { name: true, whatsapp: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Serialize bookings
  const serializedBookings = bookings.map((b) => ({
    ...b,
    date: b.date.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    expiresAt: b.expiresAt.toISOString(),
    rescheduleDate: b.rescheduleDate?.toISOString() ?? null,
    paymentApprovedAt: b.paymentApprovedAt 
      ? b.paymentApprovedAt.toISOString() 
      : (["CONFIRMED", "COMPLETED", "CHECKED_IN", "RESCHEDULE_APPROVED"].includes(b.status) 
          ? b.updatedAt.toISOString() 
          : null),
    payment: b.payment
      ? {
          ...b.payment,
          createdAt: b.payment.createdAt.toISOString(),
          updatedAt: b.payment.updatedAt.toISOString(),
        }
      : null,
    paymentProofUrl: b.paymentProofUrl || undefined,
  }));

  const serializedMembershipRequests = membershipRequests.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    membershipExpiresAt: u.membershipExpiresAt?.toISOString() ?? null,
    bookings: u.bookings.map((b) => ({
      ...b,
      date: b.date.toISOString(),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      expiresAt: b.expiresAt.toISOString(),
      rescheduleDate: b.rescheduleDate?.toISOString() ?? null,
      paymentApprovedAt: b.paymentApprovedAt 
        ? b.paymentApprovedAt.toISOString() 
        : (["CONFIRMED", "COMPLETED", "CHECKED_IN", "RESCHEDULE_APPROVED"].includes(b.status) 
            ? b.updatedAt.toISOString() 
            : null),
    })),
    membershipRequests: u.membershipRequests.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  }));

  const serializedOpenMatches = openMatches.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    booking: {
      ...m.booking,
      date: m.booking.date.toISOString(),
      createdAt: m.booking.createdAt.toISOString(),
      updatedAt: m.booking.updatedAt.toISOString(),
      expiresAt: m.booking.expiresAt.toISOString(),
      rescheduleDate: m.booking.rescheduleDate?.toISOString() ?? null,
      paymentApprovedAt: m.booking.paymentApprovedAt 
        ? m.booking.paymentApprovedAt.toISOString() 
        : (["CONFIRMED", "COMPLETED", "CHECKED_IN", "RESCHEDULE_APPROVED"].includes(m.booking.status) 
            ? m.booking.updatedAt.toISOString() 
            : null),
      court: m.booking.court ? {
        ...m.booking.court,
      } : null,
    },
    players: m.players.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      player: {
        ...p.player
      }
    })),
  }));

  const serializedCourts = courts.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B0B]" />}>
      <AdminDashboard 
        initialBookings={serializedBookings} 
        membershipRequests={serializedMembershipRequests}
        initialUsers={serializedUsers}
        initialOpenMatches={serializedOpenMatches}
        initialCourts={serializedCourts}
        session={session}
      />
    </Suspense>
  );
}