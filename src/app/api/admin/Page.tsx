import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookingManager } from "@/components/admin/BookingManager";
import { CourtManager } from "@/components/admin/CourtManager";
import { StatCard } from "@/components/admin/StatCard";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { manageBookingLifecycle } from "@/lib/manageLifecycle";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Manage lifecycle before fetching
  await manageBookingLifecycle();

  // Fetch initial data on server
  const bookings = await prisma.booking.findMany({
    include: {
      user: { select: { name: true, email: true } },
      court: { select: { name: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate stats
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter((b) => b.status === "PENDING").length;
  const confirmedBookings = bookings.filter(
    (b) => b.status === "CONFIRMED",
  ).length;
  const totalRevenue = bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);

  // Convert dates to strings for client components
  const serializedBookings = bookings.map((b) => ({
    ...b,
    date: b.date.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    payment: b.payment
      ? {
          ...b.payment,
          createdAt: b.payment.createdAt.toISOString(),
          updatedAt: b.payment.updatedAt.toISOString(),
        }
      : null,
    paymentProofUrl: b.paymentProofUrl || undefined,
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Kelola reservasi dan lapangan padel
              </p>
            </div>
            <Link href="/">
              <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors duration-200">
                ← Beranda
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto w-full space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Total Booking"
              value={totalBookings}
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
              color="blue"
            />
            <StatCard
              label="Pending"
              value={pendingBookings}
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              color="yellow"
            />
            <StatCard
              label="Confirmed"
              value={confirmedBookings}
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              }
              color="green"
            />
            <StatCard
              label="Total Revenue"
              value={`Rp ${totalRevenue.toLocaleString("id-ID")}`}
              icon={
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
              color="blue"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Bookings (70%) */}
            <div className="lg:col-span-2">
              <BookingManager initialBookings={serializedBookings} />
            </div>

            {/* Right Column - Courts (30%) */}
            <div>
              <CourtManager />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
