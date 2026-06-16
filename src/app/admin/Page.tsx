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
  const [bookings, courts, membershipRequests] = await Promise.all([
    prisma.booking.findMany({
      include: {
        user: { select: { name: true, whatsapp: true } },
        court: { select: { id: true, name: true, location: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.court.findMany({ orderBy: { name: "asc" } }),
    prisma.membershipRequest.findMany({
      include: { user: { select: { name: true, whatsapp: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Calculate stats
  const totalBookings = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const needVerif = bookings.filter((b) => b.status === "PERLU_VERIFIKASI").length;
  const confirmedCount = bookings.filter(
    (b) => ["CONFIRMED", "RESCHEDULE_APPROVED"].includes(b.status),
  ).length;
  const totalRevenue = bookings
    .filter((b) => ["CONFIRMED", "RESCHEDULE_APPROVED", "COMPLETED"].includes(b.status))
    .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
  const rescheduleRequests = bookings.filter((b) => b.status === "RESCHEDULE_REQUESTED").length;

  const stats = [
    {
      label: "Total Booking",
      value: totalBookings,
      icon: <span className="text-2xl">📋</span>,
      color: "blue",
    },
    {
      label: "Perlu Tindakan",
      value: needVerif + rescheduleRequests + pendingCount,
      trend: `${needVerif} verifikasi · ${rescheduleRequests} reschedule`,
      icon: <span className="text-2xl">⚡</span>,
      color: "yellow",
    },
    {
      label: "Confirmed Aktif",
      value: confirmedCount,
      trend: `${courts.length} lapangan terdaftar`,
      icon: <span className="text-2xl">✅</span>,
      color: "green",
    },
    {
      label: "Total Revenue",
      value: `Rp ${totalRevenue.toLocaleString("id-ID")}`,
      trend: "Dari booking confirmed",
      icon: <span className="text-2xl">💰</span>,
      color: "purple",
    },
  ];

  // Serialize dates for client components
  const serializedBookings = bookings.map((b) => ({
    ...b,
    date: b.date.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    expiresAt: b.expiresAt?.toISOString() ?? undefined,
    rescheduleDate: b.rescheduleDate?.toISOString() ?? null,
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

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B0B]" />}>
      <AdminDashboard 
        initialBookings={serializedBookings} 
        stats={stats} 
        membershipRequests={serializedMembershipRequests}
        session={session}
      />
    </Suspense>
  );
}