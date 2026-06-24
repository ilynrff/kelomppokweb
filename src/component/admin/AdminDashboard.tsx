"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookingManager } from "./BookingManager";
import { CourtManager } from "./CourtManager";
import { CourtSchedule } from "./CourtSchedule";
import { MembershipManager } from "./MembershipManager";

type Booking = {
  id: string;
  bookingCode?: string | null;
  date: string;
  startTime: number;
  endTime: number;
  status: string;
  totalPrice: number;
  createdAt: string;
  expiresAt?: string;
  paymentProofUrl?: string;
  rescheduleDate?: string | null;
  rescheduleStartTime?: number | null;
  rescheduleEndTime?: number | null;
  rescheduleNote?: string | null;
  user?: { name?: string; whatsapp?: string };
  court?: { name?: string; location?: string };
  payment?: { status?: string; proofImage?: string } | null;
};

type MembershipRequest = {
  id: string;
  userId: string;
  proofImage: string;
  status: string;
  amount: number;
  createdAt: string;
  user?: { name?: string; whatsapp?: string };
};

type StatItem = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
};

type Props = {
  initialBookings: Booking[];
  stats: StatItem[];
  membershipRequests: MembershipRequest[];
  session?: any;
};

const TABS = [
  { id: "bookings", label: "Booking Management", icon: "📋" },
  { id: "membership", label: "Membership", icon: "💎" },
  { id: "schedule", label: "Jadwal Lapangan", icon: "📅" },
  { id: "courts", label: "Kelola Lapangan", icon: "🏟️" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function StatCard({ item }: { item: StatItem }) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/10",
    },
    green: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/10",
    },
    yellow: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/10",
    },
    purple: {
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      border: "border-violet-500/10",
    },
  };
  const c = colorMap[item.color] ?? colorMap.blue;
  const isRevenue = item.label.toUpperCase().includes("REVENUE");

  return (
    <div
      className="bg-[#0F0F0F]/60 backdrop-blur-md rounded-[1.25rem] border border-white/5 p-6 flex flex-col justify-between min-h-[160px] relative transition-all duration-300 hover:border-white/10 hover:bg-[#0F0F0F]/80 group shadow-lg"
    >
      {/* TOP ROW: Muted Label & Standardized Icon */}
      <div className="flex justify-between items-start w-full">
        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] leading-none">
          {item.label}
        </span>
        <div
          className={`w-8 h-8 rounded-lg ${c.bg} ${c.text} flex items-center justify-center shrink-0 border border-white/5 transition-transform duration-300 group-hover:scale-105`}
        >
          <span className="text-sm">{item.icon}</span>
        </div>
      </div>

      {/* BOTTOM ROW: Large Primary Value & Supporting Text */}
      <div className="mt-6 space-y-2">
        <div 
          className={`font-black text-white tracking-tight leading-none truncate ${
            isRevenue 
              ? "text-xl sm:text-2xl xl:text-3xl" 
              : "text-2xl sm:text-3xl"
          }`}
          title={String(item.value)}
        >
          {item.value}
        </div>
        {item.trend && (
          <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider flex items-center gap-1.5 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-neon/80"></span>
            {item.trend}
          </p>
        )}
      </div>
    </div>
  );
}

export function AdminDashboard({ initialBookings, stats, membershipRequests, session }: Props) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("bookings");

  useEffect(() => {
    const tab = searchParams.get("tab") as TabId;
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const pendingActionCount = initialBookings.filter((b) =>
    ["PENDING", "PERLU_VERIFIKASI", "RESCHEDULE_REQUESTED"].includes(b.status),
  ).length;

  const pendingMembershipCount = membershipRequests.filter(
    (r) => r.status === "PENDING",
  ).length;

  const activeTabInfo = TABS.find((t) => t.id === activeTab) || TABS[0];

  const TAB_DESCRIPTIONS: Record<TabId, string> = {
    bookings: "Manage reservations, approvals, reschedules, and booking activity.",
    membership: "Verifikasi bukti pembayaran pendaftaran dan atur aktivasi status Member premium.",
    schedule: "Cek ketersediaan semua lapangan padel dan pantau slot waktu yang dipesan.",
    courts: "Kelola daftar lapangan padel terdaftar, status operasional, dan parameter harga.",
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col relative overflow-hidden pt-28 pb-16">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-neon/[0.02] blur-[150px] rounded-full pointer-events-none z-0"></div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 space-y-10 relative z-10 animate-fade-in-up">
        
        {/* ONE Clean Admin Control Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight italic uppercase">
              {activeTabInfo.label}
            </h1>
            <p className="text-white/50 text-sm font-medium mt-2 max-w-2xl leading-relaxed">
              {TAB_DESCRIPTIONS[activeTab]}
            </p>
          </div>
          
          {/* RIGHT SIDE: Muted Profile Capsule */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl shrink-0 self-start md:self-auto select-none">
            <div className="w-5 h-5 rounded-md bg-neon text-black font-black text-[10px] flex items-center justify-center font-bold">
              A
            </div>
            <span className="text-xs font-black text-white/80 uppercase tracking-widest">
              Hello, {session?.user?.name ? session.user.name.split(" ")[0] : "Admin"}
            </span>
          </div>
        </div>

        {/* Clean Segmented Tab Navigation */}
        <div 
          className="flex border-b border-white/5 w-full overflow-x-auto no-scrollbar gap-8 pb-px select-none z-10 relative"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count =
              tab.id === "bookings"
                ? pendingActionCount
                : tab.id === "membership"
                ? pendingMembershipCount
                : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 pb-4 text-sm font-bold transition-all duration-300 relative whitespace-nowrap cursor-pointer hover:text-white ${
                  isActive ? "text-white" : "text-white/40"
                }`}
              >
                <span className="text-xs shrink-0">{tab.icon}</span>
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[9px] font-black px-1 leading-none">
                    {count}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neon shadow-[0_-2px_10px_rgba(215,255,63,0.5)] z-20" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body Grid */}
        <div className="pt-2">
          {activeTab === "bookings" && (
            <div className="space-y-10">
              {/* Stats Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((s) => (
                  <StatCard key={s.label} item={s} />
                ))}
              </div>

              <div className="pt-2">
                <BookingManager initialBookings={initialBookings} />
              </div>
            </div>
          )}

          {activeTab === "membership" && (
            <div className="pt-2">
              <MembershipManager initialRequests={membershipRequests} />
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="pt-2">
              <CourtSchedule />
            </div>
          )}

          {activeTab === "courts" && (
            <div className="pt-2">
              <CourtManager />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
