"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { PaymentDeadlineCountdown } from "@/components/dashboard/PaymentDeadlineCountdown";
import { PaymentDeadlineBadge } from "@/components/dashboard/PaymentDeadlineBadge";
import { RescheduleModal } from "@/components/dashboard/RescheduleModal";
import { BookingTimeAwareness } from "@/components/dashboard/BookingTimeAwareness";
import { formatMinutesToHHmm, getOpenMatchLifecycleState } from "@/lib/bookingTime";
import { getJakartaTime } from "@/lib/timezone";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchJson } from "@/lib/fetchJson";
import { MembershipStatusCard } from "@/components/profile/MembershipStatusCard";
import { UpgradeInvitationCard } from "@/components/dashboard/UpgradeInvitationCard";
import { Crown, Star, CalendarDays, Activity, ShieldCheck, Gem, Clock, AlertCircle, MapPin, Share2, Users, CheckCircle2, Flame, Award, Heart, PlusCircle, Trophy } from "lucide-react";
import { CreateOpenMatchModal } from "@/components/dashboard/CreateOpenMatchModal";
import { PlayersJoinedModal } from "@/components/dashboard/PlayersJoinedModal";
import { AnimatePresence } from "framer-motion";

type Booking = {
  id: string;
  bookingCode?: string | null;
  date: string;
  startTime: number;
  endTime: number;
  status:
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "COMPLETED"
  | "PERLU_VERIFIKASI"
  | "RESCHEDULE_REQUESTED"
  | "RESCHEDULE_APPROVED"
  | "RESCHEDULE_REJECTED"
  | string;
  totalPrice: number;
  createdAt: string;
  expiresAt?: string;
  court?: { id?: string; name?: string; venue?: { id?: string; name?: string } };
  user?: { membership?: string; membershipStatus?: string };
  payment?: { status?: string } | null;
  equipmentPackage?: string;
  equipmentPrice?: number;
};

import React from "react";

const loadSnapScript = (clientKey: string, isProduction: boolean): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
      }
    if ((window as any).snap) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Midtrans Snap script");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const BookingRow = React.memo(({
  b,
  onPay,
  isPaying,
  onReschedule,
  onShowDetail,
  onOpenMatch
}: {
  b: Booking,
  onPay: (b: Booking) => void,
  isPaying: boolean,
  onReschedule: (b: Booking) => void,
  onShowDetail: (b: Booking) => void,
  onOpenMatch: (b: Booking) => void
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getBookingMatchStatus = (b: Booking) => {
    const jakarta = getJakartaTime(now);
    const bookingDateStr = String(b.date).slice(0, 10);
    
    if (bookingDateStr > jakarta.dateStr) {
      return "UPCOMING";
    } else if (bookingDateStr < jakarta.dateStr) {
      return "COMPLETED";
    } else {
      if (jakarta.nowMinutes < b.startTime) {
        return "UPCOMING";
      } else if (jakarta.nowMinutes >= b.endTime) {
        return "COMPLETED";
      } else {
        return "ACTIVE";
      }
    }
  };

  const bookingStart = new Date(b.date);
  bookingStart.setUTCMinutes(bookingStart.getUTCMinutes() + b.startTime);
  const hoursUntil = (bookingStart.getTime() - now.getTime()) / 3600000;
  const canReschedule = hoursUntil > 12;
  const isExpiredByTime = b.expiresAt ? new Date(b.expiresAt) < now : false;

  const isClickable = b.status === "CONFIRMED" || b.status === "RESCHEDULE_APPROVED" || b.status === "CHECKED_IN";

  return (
    <Card
      className={`p-5 !rounded-[2rem] border-white/5 shadow-xl transition-all ${isClickable ? 'cursor-pointer hover:shadow-2xl hover:border-neon/30 hover:-translate-y-1 hover:bg-white/[0.04]' : ''}`}
      onClick={() => isClickable && onShowDetail(b)}
    >
      <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
        {/* Left Side: Core Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
                {b.bookingCode || b.id.slice(0, 8)}
              </div>
              {b.user?.membership === "MEMBER" && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon/10 border border-neon/20 text-[7px] font-black text-neon uppercase tracking-tighter italic shadow-[0_0_10px_rgba(215,255,63,0.1)]">
                  <Crown size={8} /> Elite Booking
                </div>
              )}
            </div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tight leading-tight">
              {b.court?.venue?.name || "Padel Venue"} <span className="text-white/40 font-normal">·</span> {b.court?.name || "Court"}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] italic">
              <div className="flex items-center gap-1.5 text-white/70">
                <MapPin size={10} className="text-neon/30" /> {b.court?.location || "Semarang"}
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays size={10} className="text-neon/30" /> {String(b.date).slice(0, 10)}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={10} className="text-neon/30" /> {formatMinutesToHHmm(b.startTime)} – {formatMinutesToHHmm(b.endTime)}
              </div>
              {b.equipmentPackage && b.equipmentPackage !== "NONE" && (
                <div className="flex items-center gap-1 bg-neon/10 border border-neon/20 px-2 py-0.5 rounded text-[8px] font-black text-neon uppercase tracking-wider italic">
                  <span>⚙️</span> {b.equipmentPackage === "STARTER" ? "Starter Gear" : "Group Gear"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Precise Alignment Block */}
        <div className="flex flex-col md:items-end gap-4 w-full md:w-auto mt-2 md:mt-0">
          <div className="flex flex-col md:items-end gap-3.5 w-full">
            {/* Payment & Status Row */}
            <div className="flex items-center justify-between md:justify-end gap-4 w-full border-b border-white/[0.03] md:border-b-0 pb-3 md:pb-0">
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">Status</p>
                <p className="text-[10px] font-bold text-white/40 uppercase italic">
                  {b.payment?.status === "CONFIRMED" ? "Payment Confirmed" :
                    b.payment?.status === "PENDING" ? "Under Review" :
                      b.payment?.status === "FAILED" ? "Payment Failed" :
                        "Awaiting Payment"}
                </p>
              </div>
              <div className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border italic shrink-0 ${b.status === "CONFIRMED" || b.status === "RESCHEDULE_APPROVED"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : b.status === "EXPIRED" || b.status === "CANCELLED"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : b.status === "PERLU_VERIFIKASI"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : b.status === "RESCHEDULE_REQUESTED"
                      ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                      : "bg-white/5 text-white/20 border-white/10"
                }`}>
                {b.status === "PERLU_VERIFIKASI" ? "Verifying" : b.status}
              </div>
            </div>

            {/* Price Block */}
            <div className="flex items-center justify-between md:flex-col md:items-end w-full">
              <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">Total</p>
              <p className="text-xl font-black text-neon italic tracking-tighter">
                Rp {Number(b.totalPrice || 0).toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:flex md:flex-row gap-2 w-full md:w-auto mt-2 md:mt-0">
            {b.openMatch && b.openMatch.status !== "CANCELED" ? (
              (() => {
                const status = getBookingMatchStatus(b);
                if (status === "UPCOMING") {
                  return (
                    <div className="col-span-2 md:col-span-1 flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-blue-500/20 bg-blue-500/10 text-[9px] font-black text-blue-400 uppercase tracking-widest italic shadow-[0_0_10px_rgba(59,130,246,0.05)] select-none w-full md:w-auto">
                      🎾 Upcoming
                    </div>
                  );
                } else if (status === "ACTIVE") {
                  return (
                    <div className="col-span-2 md:col-span-1 flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-[9px] font-black text-emerald-400 uppercase tracking-widest italic shadow-[0_0_10px_rgba(16,185,129,0.05)] select-none w-full md:w-auto">
                      🎾 Match Active
                    </div>
                  );
                } else {
                  return (
                    <div className="col-span-2 md:col-span-1 flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-white/10 bg-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest italic select-none w-full md:w-auto">
                      🎾 Match Completed
                    </div>
                  );
                }
              })()
            ) : (
              (b.status === "CONFIRMED" || b.status === "RESCHEDULE_APPROVED" || b.status === "CHECKED_IN") && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenMatch(b); }}
                  className="h-10 px-4 bg-neon hover:bg-neon/90 text-black text-[9px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(215,255,63,0.15)] flex items-center justify-center gap-1.5 w-full md:w-auto"
                >
                  <span>🎾</span> Open Match
                </button>
              )
            )}
            {isClickable && (
              <button
                onClick={(e) => { e.stopPropagation(); onShowDetail(b); }}
                className={`h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black text-white/60 uppercase tracking-widest rounded-xl transition-all flex items-center justify-center w-full md:w-auto ${b.openMatch && b.openMatch.status !== "CANCELED" ? "col-span-2 md:col-span-1" : ""
                  }`}
              >
                Details
              </button>
            )}
            {b.status === "PENDING" && (
              <button
                onClick={(e) => { e.stopPropagation(); onPay(b); }}
                disabled={isPaying}
                className="col-span-2 md:col-span-1 h-10 px-4 bg-neon text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center w-full disabled:opacity-55"
              >
                {isPaying ? "Processing..." : "Pay Now"}
              </button>
            )}
            {(b.status === "CONFIRMED" || b.status === "RESCHEDULE_APPROVED") && canReschedule && (
              <button
                onClick={(e) => { e.stopPropagation(); onReschedule(b); }}
                className="col-span-2 md:col-span-1 h-10 px-4 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-[9px] font-black text-violet-400 uppercase tracking-widest rounded-xl transition-all flex items-center justify-center w-full md:w-auto"
              >
                Reschedule
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PENDING: payment deadline */}
      {b.status === "PENDING" && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
          {b.expiresAt && (
            <PaymentDeadlineCountdown
              expiresAt={b.expiresAt}
              bookingStatus={b.status}
              onExpired={() => { }}
            />
          )}
        </div>
      )}

      {/* VERIFICATION STATE */}
      {(b.status === "PERLU_VERIFIKASI" || b.payment?.status === "PENDING") && (
        <div className="mt-4 text-[10px] font-black text-amber-400 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-center gap-3 italic uppercase tracking-wider">
          <Clock size={12} className="animate-pulse" />
          <span>Payment verification pending.</span>
        </div>
      )}

      {/* Time Awareness */}
      <div className="mt-4">
        <BookingTimeAwareness booking={b as any} />
      </div>

      {/* CONFIRMED: reschedule button */}
      {(b.status === "CONFIRMED" || b.status === "RESCHEDULE_APPROVED") && (
        <div className="hidden">
          {/* Reschedule handled by separate button in right side now */}
        </div>
      )}

      {/* Reschedule status messages */}
      {b.status === "RESCHEDULE_REQUESTED" && (
        <div className="mt-4 text-[10px] font-black text-violet-400 bg-violet-500/5 border border-violet-500/10 rounded-xl p-3">
          ⏳ Reschedule request is pending admin approval.
        </div>
      )}
      {b.status === "RESCHEDULE_APPROVED" && (
        <div className="mt-4 text-[10px] font-black text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
          ✅ Reschedule approved! New schedule is active.
        </div>
      )}
      {b.status === "RESCHEDULE_REJECTED" && (
        <div className="mt-4 text-[10px] font-black text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-xl p-3">
          ❌ Reschedule denied by admin. Original schedule remains.
        </div>
      )}

      {/* EXPIRED / CANCELLED */}
      {(b.status === "EXPIRED" || b.status === "CANCELLED") && (
        <div className="mt-5 text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          Booking {b.status.toLowerCase()}. Please make a new reservation.
        </div>
      )}
    </Card>
  );
});

BookingRow.displayName = "BookingRow";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<"booking" | "membership" | "pending" | "error" | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const isOpeningPaymentRef = useRef(false);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [hostedMatches, setHostedMatches] = useState<any[]>([]);
  const [joinedMatches, setJoinedMatches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"bookings" | "hosted" | "joined">("bookings");
  const [openMatchBooking, setOpenMatchBooking] = useState<Booking | null>(null);
  const [isCancelMatchLoading, setIsCancelMatchLoading] = useState<string | null>(null);
  const [viewPlayersMatch, setViewPlayersMatch] = useState<any | null>(null);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const userExpiresAt = (session?.user as any)?.membershipExpiresAt;
  const isUserMembershipExpired = userExpiresAt ? now >= new Date(userExpiresAt) : false;
  const userMembershipStatus = isUserMembershipExpired ? "EXPIRED" : ((session?.user as any)?.membershipStatus || "FREE");
  const userMembershipType = isUserMembershipExpired ? "BASIC" : ((session?.user as any)?.membership || "BASIC");

  const isMatchCompleted = (m: any) => {
    const jakarta = getJakartaTime(now);
    const bookingDateStr = String(m.booking.date).slice(0, 10);
    if (bookingDateStr < jakarta.dateStr) {
      return true;
    } else if (bookingDateStr > jakarta.dateStr) {
      return false;
    } else {
      return jakarta.nowMinutes >= m.booking.endTime;
    }
  };

  const canFetch = status === "authenticated";
  const isInteracting = !!rescheduleBooking || !!detailBooking || !!payingBookingId;

  // Premium emotionally-aware Open Match status config generator
  const getMatchStatusConfig = (m: any) => {
    const lifecycle = getOpenMatchLifecycleState({
      date: m.booking.date,
      startTime: m.booking.startTime,
      endTime: m.booking.endTime
    });

    // Calculate Semarang/Jakarta time (UTC+7)
    const now = new Date();
    const localNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const bookingDateStr = new Date(m.booking.date).toISOString().split("T")[0];
    const localTodayStr = localNow.toISOString().split("T")[0];
    const nowMinutes = localNow.getUTCHours() * 60 + localNow.getUTCMinutes();

    let minutesUntilStart = -1;
    const isToday = bookingDateStr === localTodayStr;
    if (isToday) {
      minutesUntilStart = m.booking.startTime - nowMinutes;
    }

    const registeredCount = m.players.length;
    const max = m.maxPlayers || 4;

    if (lifecycle === "EXPIRED") {
      return {
        state: "FINISHED",
        badgeText: "🏁 Match Finished",
        badgeClass: "bg-white/5 border-white/10 text-white/45 font-black uppercase italic tracking-widest",
        bgClass: "bg-white/[0.02] border-white/5",
        title: "Match Completed",
        description: "Thank you for building the local padel community.",
        reassurance: "Your history is saved. Create a new Open Match anytime!",
        iconColor: "text-white/20"
      };
    }

    if (lifecycle === "LIVE") {
      return {
        state: "LIVE",
        badgeText: "🔴 Match In Progress",
        badgeClass: "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse font-black uppercase italic tracking-widest",
        bgClass: "bg-red-500/[0.02] border-red-500/10",
        title: "Live Session Ongoing",
        description: "Players are currently playing on the court. Have a great session!",
        reassurance: "Your match is active and live. Bring your best energy!",
        iconColor: "text-red-500"
      };
    }

    // Lifecycle is UPCOMING
    if (isToday && minutesUntilStart > 0 && minutesUntilStart <= 60) {
      return {
        state: "STARTING_SOON",
        badgeText: "⏰ Match Starts Soon",
        badgeClass: "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse font-black uppercase italic tracking-widest",
        bgClass: "bg-amber-500/[0.02] border-amber-500/10",
        title: `Starting in ${minutesUntilStart} mins`,
        description: "Prepare your gear. Make sure all players are ready.",
        reassurance: "Your session starts soon. Let's make it a legendary play!",
        iconColor: "text-amber-400"
      };
    }

    if (registeredCount >= max) {
      return {
        state: "FULL",
        badgeText: "✅ Full Lobby Ready",
        badgeClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-black uppercase italic tracking-widest",
        bgClass: "bg-emerald-500/[0.02] border-emerald-500/10",
        title: "Full Squad Locked In",
        description: `${registeredCount}/${max} players confirmed. Your match is 100% ready.`,
        reassurance: "Coordinate manual splits or contact your lobby players below.",
        iconColor: "text-emerald-400"
      };
    }

    if (registeredCount > 1) {
      const isEvening = m.booking.startTime >= 17 * 60; // 5 PM or later
      const supportMsg = isEvening
        ? "Evening matches attract active players looking for post-work sessions!"
        : "Prime booking hours tend to fill up rapidly as game time approaches.";

      return {
        state: "BUILDING",
        badgeText: "🔥 Match Building Up",
        badgeClass: "bg-orange-500/10 border-orange-500/20 text-orange-400 font-black uppercase italic tracking-widest",
        bgClass: "bg-orange-500/[0.02] border-orange-500/10",
        title: "Gaining Squad Traction",
        description: `${registeredCount}/${max} players joined your session.`,
        reassurance: supportMsg,
        iconColor: "text-orange-400"
      };
    }

    // RegisteredCount is 1 (only host)
    const isPrimeTime = m.booking.startTime >= 16 * 60 && m.booking.startTime <= 21 * 60;
    const confidenceMsg = isPrimeTime
      ? "Prime evening matches usually attract players rapidly as booking hours approach!"
      : "Most matches get filled closer to play time. Keep sharing with the community!";

    return {
      state: "LOOKING",
      badgeText: "⚠ Looking for Players",
      badgeClass: "bg-neon/10 border-neon/20 text-neon font-black uppercase italic tracking-widest",
      bgClass: "bg-neon/[0.01] border-neon/5",
      title: "Discoverable to Players",
      description: "Your open match is now active and visible to nearby players.",
      reassurance: confidenceMsg,
      iconColor: "text-neon"
    };
  };

  const getInvitationText = (m: any) => {
    const dateStr = String(m.booking.date).slice(0, 10);
    const timeStr = `${formatMinutesToHHmm(m.booking.startTime)} - ${formatMinutesToHHmm(m.booking.endTime)}`;
    const venueCourt = `${m.booking.court.venue?.name || "PadelGO"} - ${m.booking.court.name}`;
    const slotsLeft = m.maxPlayers - m.players.length;

    return `*PADELGO — OPEN MATCH INVITATION*

You're invited to join an exciting padel session.

────────────────────────

Venue
${venueCourt}

Date
${dateStr}

Time
${timeStr}

Players
${m.players.length}/${m.maxPlayers}

${slotsLeft > 0
        ? `Only ${slotsLeft} spot${slotsLeft > 1 ? "s" : ""} remaining`
        : `This match is already FULL`
      }

────────────────────────

Reserve your spot:
${window.location.origin}/open-match/${m.id}

See you on the court.

*PADELGO*
_Play Smarter. Book Faster._`;
  };

  // Smart share match utility
  const shareMatch = (m: any) => {
    const text = getInvitationText(m);
    const venueCourt = `${m.booking.court.venue?.name || "PadelGO"} - ${m.booking.court.name}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `Padel Open Match at ${venueCourt}`,
        text: text,
        url: `${window.location.origin}/open-match/${m.id}`
      }).catch(() => {
        navigator.clipboard.writeText(text);
        setToast({ msg: "Match link and details copied! Share on WhatsApp.", type: "success" });
      });
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setToast({ msg: "Match link and details copied! Share on WhatsApp.", type: "success" });
    } else {
      setToast({ msg: "Sharing is not supported on this browser.", type: "error" });
    }
  };

  // Redirect ADMIN to /admin
  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [session?.user?.role, router]);

  const cancelMatch = async (matchId: string) => {
    setIsCancelMatchLoading(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membatalkan pertandingan.");
      }
      setToast({ msg: "Match room successfully canceled.", type: "success" });
      await refresh(false, true);
    } catch (err: any) {
      setToast({ msg: err.message, type: "error" });
    } finally {
      setIsCancelMatchLoading(null);
    }
  };

  const refresh = async (manageLifecycle = false, silent = false, forceSessionUpdate = false) => {
    if (!silent) setIsLoading(true);
    try {
      if (manageLifecycle) {
        await fetch("/api/bookings/expire", { method: "POST" });
      }
      if (forceSessionUpdate && update) {
        await update();
      }
      const data = await fetchJson<Booking[]>("/api/bookings");
      setBookings(Array.isArray(data) ? data : []);

      // Fetch Hosted Matches
      const hostedRes = await fetch(`/api/matches?userId=${session?.user?.id}`);
      if (hostedRes.ok) {
        const hostedData = await hostedRes.json();
        setHostedMatches(hostedData);
      }

      // Fetch Joined Matches
      const joinedRes = await fetch(`/api/matches?joinedBy=${session?.user?.id}`);
      if (joinedRes.ok) {
        const joinedData = await joinedRes.json();
        setJoinedMatches(joinedData);
      }
    } catch (e: unknown) {
      setToast({ msg: getErrorMessage(e) || "Terjadi kesalahan", type: "error" });
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const userId = session?.user?.id;
  useEffect(() => {
    if (userId) {
      refresh(true, false, false);
    }
  }, [userId]);

  // Silent auto-polling every 30 seconds
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      refresh(false, true);
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, isInteracting]);

  const pending = useMemo(
    () => bookings.filter((b) => b.status === "PENDING").length,
    [bookings],
  );
  const confirmed = useMemo(
    () => bookings.filter((b) => b.status === "CONFIRMED").length,
    [bookings],
  );

  const handlePay = async (booking: Booking) => {
    if (payingBookingId) return;
    if (isOpeningPaymentRef.current) return;
    isOpeningPaymentRef.current = true;
    setPayingBookingId(booking.id);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/payment-token`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Gagal mendapatkan token pembayaran.");
      }

      const loaded = await loadSnapScript(result.clientKey, result.isProduction);
      const snap = (window as any).snap;

      if (loaded && snap) {
        snap.pay(result.token, {
          onSuccess: () => {
            isOpeningPaymentRef.current = false;
            setToast({ msg: "Pembayaran berhasil!", type: "success" });
            refresh(false, true);
            setSuccessModal("booking");
          },
          onPending: () => {
            isOpeningPaymentRef.current = false;
            setToast({ msg: "Pembayaran sedang diproses.", type: "success" });
            refresh(false, true);
            setSuccessModal("pending");
          },
          onError: () => {
            isOpeningPaymentRef.current = false;
            setToast({ msg: "Pembayaran gagal.", type: "error" });
            refresh(false, true);
            setSuccessModal("error");
          },
          onClose: () => {
            isOpeningPaymentRef.current = false;
            refresh(false, true);
          }
        });
      } else {
        throw new Error("Gagal memuat Snap script.");
      }
    } catch (err: any) {
      isOpeningPaymentRef.current = false;
      setToast({ msg: err.message, type: "error" });
    } finally {
      setPayingBookingId(null);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const payment = params.get("payment");
      const membership = params.get("membership");
      if (payment === "success") {
        setSuccessModal("booking");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (membership === "success") {
        setSuccessModal("membership");
        if (update) {
          update();
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (payment === "pending") {
        setSuccessModal("pending");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (payment === "error") {
        setSuccessModal("error");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [update]);

  if (status === "unauthenticated") {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0B0B0B] min-h-[calc(100vh-64px)] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-neon/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
        <Card className="w-full max-w-lg p-10 rounded-[2rem] shadow-2xl border-white/5 backdrop-blur-xl bg-[#0F0F0F]/80">
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Dashboard</h1>
          <p className="text-white/60 font-medium mb-8">
            Please log in to view your bookings.
          </p>
          <Link href="/login">
            <Button size="full">Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#050505] p-6 md:p-10 min-h-[calc(100vh-64px)] relative overflow-hidden pt-32 md:pt-40">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-neon/5 blur-[150px] rounded-full pointer-events-none -z-10"></div>

      {toast && (
        <Toast
          isOpen={true}
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-10 relative z-10 animate-fade-in-up">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.4em] text-white/30 italic">
              <Activity size={12} className="text-neon" /> Player Dashboard
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">Your <span className="text-neon">Feed</span></h1>
            <p className="text-white/40 font-medium text-lg italic leading-relaxed">
              Welcome back, <span className="text-white">{session?.user.name || "Player"}</span>. <br className="hidden md:block" />
              Here are your latest bookings and member privileges.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="outline" onClick={() => refresh(false, false, true)} isLoading={isLoading} className="flex-1 md:flex-none h-11 border-white/10 hover:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] px-6">
              Refresh
            </Button>
          </div>
        </div>

        {/* SECTION 2 — MEMBERSHIP HERO CARD */}
        <div className="animate-fade-in-up delay-100">
          {userMembershipStatus === "FREE" ? (
            <UpgradeInvitationCard />
          ) : (
            <MembershipStatusCard
              status={userMembershipStatus}
              type={userMembershipType}
              expiresAt={(session?.user as any)?.membershipExpiresAt}
              userName={session?.user?.name || ""}
            />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up delay-200">
          <StatCard
            icon={<CalendarDays size={16} className="text-white/20" />}
            label="Total Bookings"
            value={bookings.length}
          />
          <StatCard
            icon={<Activity size={16} className="text-orange-400/20" />}
            label="Pending"
            value={pending}
            color="orange"
          />
          <StatCard
            icon={<ShieldCheck size={16} className="text-emerald-400/20" />}
            label="Confirmed"
            value={confirmed}
            color="emerald"
          />
          <StatCard
            icon={<Gem size={16} className="text-white/20" />}
            label="Identity"
            value={userMembershipType}
            isRole
          />
        </div>

        {/* Tabs Switcher Section (Part 6) */}
        <div className="p-1 bg-[#0F0F0F] border border-white/5 rounded-[1.5rem] w-full md:w-auto overflow-hidden select-none">
          <div className="grid grid-cols-3 md:flex md:flex-row gap-1">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`py-3 md:px-5 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 ${activeTab === "bookings"
                ? "bg-white/5 text-neon border border-neon/20 shadow-[0_0_15px_rgba(215,255,63,0.05)]"
                : "text-white/40 hover:text-white border border-transparent"
                }`}
            >
              <span className="text-[12px] md:text-sm">📅</span>
              <span className="text-center truncate w-full md:w-auto">Bookings ({bookings.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("hosted")}
              className={`py-3 md:px-5 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 ${activeTab === "hosted"
                ? "bg-white/5 text-neon border border-neon/20 shadow-[0_0_15px_rgba(215,255,63,0.05)]"
                : "text-white/40 hover:text-white border border-transparent"
                }`}
            >
              <span className="text-[12px] md:text-sm">🎾</span>
              <span className="text-center truncate w-full md:w-auto">Hosted ({hostedMatches.filter(m => m.status !== "CANCELED").length})</span>
            </button>
            <button
              onClick={() => setActiveTab("joined")}
              className={`py-3 md:px-5 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 ${activeTab === "joined"
                ? "bg-white/5 text-neon border border-neon/20 shadow-[0_0_15px_rgba(215,255,63,0.05)]"
                : "text-white/40 hover:text-white border border-transparent"
                }`}
            >
              <span className="text-[12px] md:text-sm">🤝</span>
              <span className="text-center truncate w-full md:w-auto">Joined ({joinedMatches.filter(m => m.status !== "CANCELED").length})</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="bg-[#0F0F0F]/50 rounded-[2rem] border border-white/5 p-12 animate-pulse flex justify-center">
              <div className="w-8 h-8 border-4 border-neon/30 border-t-neon rounded-full animate-spin"></div>
            </div>
          ) : activeTab === "bookings" ? (
            bookings.length === 0 ? (
              <div className="bg-[#0F0F0F]/50 rounded-[2rem] border border-white/5 p-16 text-center">
                <p className="text-white/40 font-bold text-lg">No bookings found.</p>
                <Link href="/booking">
                  <Button className="mt-6">Book a Court</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-6">
                {bookings.map((b) => (
                  <BookingRow
                    key={b.id}
                    b={b}
                    onPay={handlePay}
                    isPaying={payingBookingId === b.id}
                    onReschedule={setRescheduleBooking}
                    onShowDetail={setDetailBooking}
                    onOpenMatch={setOpenMatchBooking}
                  />
                ))}
              </div>
            )
          ) : activeTab === "hosted" ? (
            hostedMatches.filter(m => m.status !== "CANCELED").length === 0 ? (
              <div className="bg-[#0F0F0F]/50 rounded-[2rem] border border-white/5 p-16 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-5 backdrop-blur-sm relative overflow-hidden">
                {/* Glowing neon green accent backdrop */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon/5 blur-[60px] rounded-full pointer-events-none -z-10"></div>
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-3xl shadow-inner select-none">
                  👑
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tight">
                    No hosted matches active
                  </h3>
                  <p className="text-white/40 text-xs font-semibold leading-relaxed italic max-w-sm">
                    Confirm a booking slot from your active bookings and publish it to find community players!
                  </p>
                </div>
                <div className="pt-2 w-full">
                  <button
                    onClick={() => setActiveTab("bookings")}
                    className="h-11 px-8 bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mx-auto"
                  >
                    <span>📅</span> View Active Bookings
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {hostedMatches.filter(m => m.status !== "CANCELED").map((m) => {
                  const isCompleted = isMatchCompleted(m);
                  return (
                    <Card
                      key={m.id}
                      id={`match-card-${m.id}`}
                      className="p-6 sm:p-8 !rounded-[2.5rem] border border-white/10 bg-[#0F0F0F] transition-all duration-300 shadow-2xl relative overflow-hidden group hover:border-white/20"
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 blur-[80px] rounded-full pointer-events-none -z-10 group-hover:scale-110 transition-transform duration-500"></div>

                      <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                          {isCompleted ? (
                            <div className="flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-[0.25em] italic">
                              <span>✅</span> MATCH COMPLETED
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-neon text-[9px] font-black uppercase tracking-[0.25em] italic">
                              <span>🎾</span> Open Match Active
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                            {m.booking.court.venue?.name || "PadelGO"} - {m.booking.court.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">
                            <span className="flex items-center gap-1"><CalendarDays size={12} className="text-neon/50 shrink-0" /> {String(m.booking.date).slice(0, 10)}</span>
                            <span className="flex items-center gap-1"><Clock size={12} className="text-neon/50 shrink-0" /> {formatMinutesToHHmm(m.booking.startTime)} - {formatMinutesToHHmm(m.booking.endTime)}</span>
                          </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 p-4 sm:p-5 rounded-[1.8rem] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Players Joined</span>
                            <span className="text-xs font-black text-neon italic">{m.players.length} / {m.maxPlayers} Players</span>
                          </div>

                          <div className="flex items-center gap-2 my-1">
                            {Array.from({ length: m.maxPlayers }).map((_, i) => {
                              const isJoined = i < m.players.length;
                              return (
                                <span
                                  key={i}
                                  className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${isJoined
                                    ? "bg-neon border-neon shadow-[0_0_12px_rgba(215,255,63,0.6)] scale-110"
                                    : "bg-white/5 border-2 border-white/10"
                                    }`}
                                />
                              );
                            })}
                          </div>

                          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.1em]">
                            {isCompleted ? "Match Finished" : (m.maxPlayers - m.players.length === 0 ? "✨ FULL HOUSE" : `${m.maxPlayers - m.players.length} Slots Available`)}
                          </p>
                        </div>

                        {/* Invite Players block (Only active matches) */}
                        {!isCompleted && (
                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] block">Invite Players</span>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => {
                                  const text = getInvitationText(m);
                                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                                }}
                                className="w-full sm:flex-1 h-11 px-4 bg-neon hover:bg-neon/90 text-black text-[9px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.01] active:scale-95 shadow-[0_0_15px_rgba(215,255,63,0.15)] flex items-center justify-center gap-1.5 focus:outline-none"
                              >
                                <span>📱</span> Share via WhatsApp
                              </button>
                              <button
                                onClick={() => {
                                  const text = getInvitationText(m);
                                  navigator.clipboard.writeText(text);
                                  setToast({ msg: "Invitation text copied successfully", type: "success" });
                                }}
                                className="w-full sm:w-auto h-11 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black text-white/60 uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                              >
                                Copy Invitation
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/open-match/${m.id}`);
                                  setToast({ msg: "Link copied successfully", type: "success" });
                                }}
                                className="w-full sm:w-auto h-11 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black text-white/60 uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                              >
                                Copy Link
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em]">View Roster</span>
                          <button
                            onClick={() => setViewPlayersMatch(m)}
                            className="text-[9px] font-black text-neon hover:text-neon/80 uppercase tracking-widest italic flex items-center gap-1 transition-colors focus:outline-none"
                          >
                            View Players →
                          </button>
                        </div>

                        {/* Cancel Open Match / Completed Message Banner */}
                        {isCompleted ? (
                          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center space-y-1">
                            <p className="text-xs font-black text-white/80 uppercase tracking-wider">
                              Match Finished
                            </p>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                              This match has ended.<br />Thank you for playing with PADELGO.
                            </p>
                          </div>
                        ) : (
                          <div className="pt-2">
                            <button
                              onClick={() => cancelMatch(m.id)}
                              disabled={isCancelMatchLoading === m.id}
                              className="w-full h-11 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[9px] font-black text-red-400 uppercase tracking-widest rounded-xl transition-all focus:outline-none"
                            >
                              {isCancelMatchLoading === m.id ? "Canceling..." : "Cancel Open Match"}
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          ) : activeTab === "joined" ? (
            joinedMatches.filter(m => m.status !== "CANCELED").length === 0 ? (
              <div className="bg-[#0F0F0F]/50 rounded-[2rem] border border-white/5 p-16 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-5 backdrop-blur-sm relative overflow-hidden">
                {/* Glowing neon green accent backdrop */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-neon/5 blur-[60px] rounded-full pointer-events-none -z-10"></div>
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-3xl shadow-inner select-none animate-bounce duration-[2000ms]">
                  🎾
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tight">
                    No joined matches yet
                  </h3>
                  <p className="text-white/40 text-xs font-semibold leading-relaxed italic max-w-sm">
                    Explore active community matches and join other players near you.
                  </p>
                </div>
                <div className="pt-2 w-full">
                  <Link href="/booking?tab=open-match">
                    <button className="h-11 px-8 bg-neon hover:bg-neon/90 text-black text-[9px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(215,255,63,0.15)] flex items-center justify-center gap-2 mx-auto">
                      <span>🎾</span> Explore Open Matches
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {joinedMatches.filter(m => m.status !== "CANCELED").map((m) => {
                  const isCompleted = isMatchCompleted(m);
                  return (
                    <Card
                      key={m.id}
                      id={`match-card-${m.id}`}
                      className="p-6 sm:p-8 !rounded-[2.5rem] border border-white/10 bg-[#0F0F0F] transition-all duration-300 shadow-2xl relative overflow-hidden group hover:border-white/20"
                    >
                      {/* Subtle status glowing backdrop accent */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 blur-[80px] rounded-full pointer-events-none -z-10 group-hover:scale-110 transition-transform duration-500"></div>

                      <div className="flex flex-col gap-6">
                        {/* Header: Open Match Active / Completed */}
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                          {isCompleted ? (
                            <div className="flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-[0.25em] italic">
                              <span>✅</span> MATCH COMPLETED
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-neon text-[9px] font-black uppercase tracking-[0.25em] italic">
                              <span>🎾</span> Open Match Active
                            </div>
                          )}
                        </div>

                        {/* Court, Date, Time */}
                        <div className="space-y-1">
                          <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                            {m.booking.court.venue?.name || "PadelGO"} - {m.booking.court.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">
                            <span className="flex items-center gap-1"><CalendarDays size={12} className="text-neon/50 shrink-0" /> {String(m.booking.date).slice(0, 10)}</span>
                            <span className="flex items-center gap-1"><Clock size={12} className="text-neon/50 shrink-0" /> {formatMinutesToHHmm(m.booking.startTime)} - {formatMinutesToHHmm(m.booking.endTime)}</span>
                          </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 p-4 sm:p-5 rounded-[1.8rem] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Players Joined</span>
                            <span className="text-xs font-black text-neon italic">{m.players.length} / {m.maxPlayers} Players</span>
                          </div>

                          {/* visual dot progress indicator */}
                          <div className="flex items-center gap-2 my-1">
                            {Array.from({ length: m.maxPlayers }).map((_, i) => {
                              const isJoined = i < m.players.length;
                              return (
                                <span
                                  key={i}
                                  className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${isJoined
                                    ? "bg-neon border-neon shadow-[0_0_12px_rgba(215,255,63,0.6)] scale-110"
                                    : "bg-white/5 border-2 border-white/10"
                                    }`}
                                />
                              );
                            })}
                          </div>

                          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.1em]">
                            {isCompleted ? "Match Finished" : (m.maxPlayers - m.players.length === 0 ? "✨ FULL HOUSE" : `${m.maxPlayers - m.players.length} Slots Available`)}
                          </p>
                        </div>

                        {/* Invite Players block (Only active matches) */}
                        {!isCompleted && (
                          <div className="space-y-2">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] block">Invite Players</span>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => {
                                  const text = getInvitationText(m);
                                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                                }}
                                className="w-full sm:flex-1 h-11 px-4 bg-neon hover:bg-neon/90 text-black text-[9px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.01] active:scale-95 shadow-[0_0_15px_rgba(215,255,63,0.15)] flex items-center justify-center gap-1.5 focus:outline-none"
                              >
                                <span>📱</span> Share via WhatsApp
                              </button>
                              <button
                                onClick={() => {
                                  const text = getInvitationText(m);
                                  navigator.clipboard.writeText(text);
                                  setToast({ msg: "Invitation text copied successfully", type: "success" });
                                }}
                                className="w-full sm:w-auto h-11 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black text-white/60 uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                              >
                                Copy Invitation
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/open-match/${m.id}`);
                                  setToast({ msg: "Link copied successfully", type: "success" });
                                }}
                                className="w-full sm:w-auto h-11 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black text-white/60 uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                              >
                                Copy Link
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Players Joined: View Players trigger */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em]">View Roster</span>
                          <button
                            onClick={() => setViewPlayersMatch(m)}
                            className="text-[9px] font-black text-neon hover:text-neon/80 uppercase tracking-widest italic flex items-center gap-1 transition-colors focus:outline-none"
                          >
                            View Players →
                          </button>
                        </div>

                        {/* Completed Message Banner */}
                        {isCompleted && (
                          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-center space-y-1">
                            <p className="text-xs font-black text-white/80 uppercase tracking-wider">
                              Match Finished
                            </p>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                              This match has ended.<br />Thank you for playing with PADELGO.
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          ) : null}
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <RescheduleModal
          booking={rescheduleBooking as any}
          onClose={() => setRescheduleBooking(null)}
          onSuccess={() => {
            setToast({
              msg: "Permintaan reschedule berhasil dikirim. Menunggu persetujuan admin.",
              type: "success",
            });
            refresh();
          }}
          onError={(msg) => setToast({ msg, type: "error" })}
        />
      )}

      {/* Detail Modal for Check-in */}
      {detailBooking && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300"
          onClick={() => setDetailBooking(null)}
        >
          <div
            className="bg-[#0F0F0F] w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#1A1A1A] px-8 py-10 text-center relative border-b border-white/5">
              <button
                onClick={() => setDetailBooking(null)}
                className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
              >
                ✕
              </button>
              <p className="text-neon font-bold uppercase tracking-widest text-[10px] mb-3">Booking Code</p>
              <h2 className="text-5xl font-black text-white tracking-tight">
                {detailBooking.bookingCode || detailBooking.id.slice(0, 8)}
              </h2>
            </div>

            <div className="p-8 space-y-6">
              <div className="text-center mb-2">
                <p className="text-sm font-bold text-white/60 bg-white/5 border border-white/10 rounded-2xl py-4 px-5 inline-block">
                  Show this code to the admin at the venue.
                </p>
              </div>

              <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Venue / Court</span>
                  <div className="text-right">
                    <span className="text-sm font-black text-white block">{detailBooking.court?.venue?.name || "Padel Venue"}</span>
                    <span className="text-xs font-bold text-white/60">{detailBooking.court?.name}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Date</span>
                  <span className="text-sm font-black text-white">{String(detailBooking.date).slice(0, 10)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Time</span>
                  <span className="text-sm font-black text-white">
                    {formatMinutesToHHmm(detailBooking.startTime)} - {formatMinutesToHHmm(detailBooking.endTime)}
                  </span>
                </div>
                {detailBooking.equipmentPackage && detailBooking.equipmentPackage !== "NONE" && (
                  <div className="flex justify-between items-center border-b border-white/5 pb-3 animate-fade-in">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Equipment</span>
                    <div className="text-right">
                      <span className="text-sm font-black text-neon block uppercase italic tracking-wider">
                        {detailBooking.equipmentPackage === "STARTER" ? "Starter Package" : "Group Package"}
                      </span>
                      <span className="text-[9px] font-bold text-white/60">
                        {detailBooking.equipmentPackage === "STARTER" ? "2 Rackets + 1 Ball Set" : "4 Rackets + 1 Ball Set"}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Status</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${detailBooking.status === "CHECKED_IN" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                    {detailBooking.status === "CHECKED_IN" ? "Checked In" : "Confirmed"}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <Button size="full" onClick={() => setDetailBooking(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create Open Match Modal */}
      <AnimatePresence>
        {openMatchBooking && (
          <CreateOpenMatchModal
            booking={openMatchBooking as any}
            onClose={() => setOpenMatchBooking(null)}
            onSuccess={async (createdMatch) => {
              setToast({
                msg: "Match room successfully created and published!",
                type: "success",
              });
              setOpenMatchBooking(null);
              setActiveTab("hosted");
              await refresh();

              // Wait for DOM to render and scroll to the new card
              setTimeout(() => {
                const targetCard = document.getElementById(`match-card-${createdMatch?.id}`);
                if (targetCard) {
                  targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }, 600);
            }}
            onError={(msg) => setToast({ msg, type: "error" })}
          />
        )}
      </AnimatePresence>

      {/* Players Joined Roster Modal */}
      {viewPlayersMatch && (
        <PlayersJoinedModal
          isOpen={!!viewPlayersMatch}
          match={viewPlayersMatch}
          currentUserId={session?.user?.id || ""}
          onClose={() => setViewPlayersMatch(null)}
        />
      )}

      {/* Sporty Minimalist Success Modal */}
      {successModal && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setSuccessModal(null)}
        >
          <div
            className="bg-[#0F0F0F] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-neon/20 p-8 space-y-6 text-center animate-in zoom-in-95 duration-300 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-neon/10 blur-[50px] rounded-full pointer-events-none -z-10"></div>

            <div className="flex flex-col items-center space-y-4">
              {successModal === "booking" || successModal === "membership" ? (
                <div className="w-16 h-16 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center text-neon shadow-[0_0_20px_rgba(215,255,63,0.2)]">
                  <CheckCircle2 size={32} className="stroke-[2.5]" />
                </div>
              ) : successModal === "pending" ? (
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <Clock size={32} className="stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <AlertCircle size={32} className="stroke-[2.5]" />
                </div>
              )}

              <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">
                {successModal === "booking" && "Booking Confirmed!"}
                {successModal === "membership" && "Welcome to Elite!"}
                {successModal === "pending" && "Payment Pending"}
                {successModal === "error" && "Payment Failed"}
              </h2>

              <p className="text-white/60 text-sm italic font-medium leading-relaxed">
                {successModal === "booking" && "Your court reservation has been fully secured. Get ready to hit the court!"}
                {successModal === "membership" && "Your Elite Membership request has been processed. Your member privileges are now active!"}
                {successModal === "pending" && "Your transaction is being processed. We will automatically update your status once completed."}
                {successModal === "error" && "We could not complete your transaction. Please try again or contact support."}
              </p>
            </div>

            <div className="pt-4">
              <Button size="full" onClick={() => setSuccessModal(null)} className="h-12 text-[10px] font-black uppercase tracking-widest rounded-xl">
                Awesome
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, isRole }: { icon: React.ReactNode, label: string, value: string | number, color?: string, isRole?: boolean }) {
  const colorMap: any = {
    orange: "from-orange-500/10 to-transparent border-orange-500/10 text-orange-400 shadow-orange-500/5",
    emerald: "from-emerald-500/10 to-transparent border-emerald-500/10 text-emerald-400 shadow-emerald-500/5",
    default: "from-white/[0.03] to-transparent border-white/5 text-white"
  };

  const selectedStyle = color ? colorMap[color] : colorMap.default;

  return (
    <div className={`p-5 rounded-[1.5rem] border bg-gradient-to-br backdrop-blur-2xl transition-all hover:scale-[1.02] group ${selectedStyle}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 group-hover:opacity-50 transition-opacity">{label}</p>
        <div className="opacity-20 group-hover:opacity-100 transition-opacity">
          {icon}
        </div>
      </div>
      <p className={`${isRole ? 'text-lg' : 'text-3xl'} font-black italic uppercase tracking-tighter drop-shadow-sm`}>{value}</p>
    </div>
  );
}