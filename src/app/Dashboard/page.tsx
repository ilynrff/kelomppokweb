"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
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
import { formatMinutesToHHmm } from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchJson } from "@/lib/fetchJson";
import { MembershipStatusCard } from "@/components/profile/MembershipStatusCard";
import { UpgradeInvitationCard } from "@/components/dashboard/UpgradeInvitationCard";
import { Crown, Star, CalendarDays, Activity, ShieldCheck, Gem, Clock, AlertCircle } from "lucide-react";
import { CreateOpenMatchModal } from "@/components/dashboard/CreateOpenMatchModal";
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
  court?: { id?: string; name?: string };
  user?: { membership?: string; membershipStatus?: string };
  payment?: { status?: string } | null;
};

import React from "react";

const BookingRow = React.memo(({ 
  b, 
  file, 
  onFileChange, 
  onUpload, 
  isUploading, 
  onReschedule,
  onShowDetail,
  onOpenMatch
}: { 
  b: Booking, 
  file: File | null, 
  onFileChange: (f: File | null) => void, 
  onUpload: () => void, 
  isUploading: boolean,
  onReschedule: (b: Booking) => void,
  onShowDetail: (b: Booking) => void,
  onOpenMatch: (b: Booking) => void
}) => {
  const bookingStart = new Date(b.date);
  bookingStart.setUTCMinutes(bookingStart.getUTCMinutes() + b.startTime);
  const hoursUntil = (bookingStart.getTime() - Date.now()) / 3600000;
  const canReschedule = hoursUntil > 12;
  const isExpiredByTime = b.expiresAt ? new Date(b.expiresAt) < new Date() : false;

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
            <h3 className="text-lg font-black text-white italic uppercase tracking-tight leading-tight">{b.court?.name}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] italic">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={10} className="text-neon/30" /> {String(b.date).slice(0, 10)}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={10} className="text-neon/30" /> {formatMinutesToHHmm(b.startTime)} – {formatMinutesToHHmm(b.endTime)}
              </div>
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
              <div className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border italic shrink-0 ${
                b.status === "CONFIRMED" || b.status === "RESCHEDULE_APPROVED"
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
              <div className="col-span-2 md:col-span-1 flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-neon/20 bg-neon/5 text-[9px] font-black text-neon uppercase tracking-widest italic shadow-[0_0_10px_rgba(215,255,63,0.05)] select-none w-full">
                🎾 Match Active
              </div>
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
                  className={`h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black text-white/60 uppercase tracking-widest rounded-xl transition-all flex items-center justify-center w-full md:w-auto ${
                    b.openMatch && b.openMatch.status !== "CANCELED" ? "col-span-2 md:col-span-1" : ""
                  }`}
               >
                  Details
               </button>
            )}
            {b.status === "PENDING" && !b.payment && (
               <button className="col-span-2 md:col-span-1 h-10 px-4 bg-neon text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center w-full">
                  Pay Now
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

      {/* PENDING: payment deadline + file upload */}
      {b.status === "PENDING" && !b.payment && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
          {b.expiresAt && (
            <PaymentDeadlineCountdown
              expiresAt={b.expiresAt}
              bookingStatus={b.status}
              onExpired={() => {}} 
            />
          )}
          {!isExpiredByTime && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                onUpload();
              }}
              className="grid md:grid-cols-[1fr_auto] gap-3 items-end"
            >
              <div className="relative group">
                {file ? (
                  <div className="flex items-center justify-between bg-neon/5 border border-neon/20 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xl shrink-0">📄</span>
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-neon uppercase tracking-widest leading-none mb-1">Selected Proof</p>
                        <p className="text-xs font-bold text-white truncate">{file.name}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => onFileChange(null)}
                      className="ml-3 text-white/20 hover:text-red-400 text-[10px] font-black uppercase transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <Input
                    label="Upload Bukti Pembayaran (JPG/PNG, max 2MB)"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      onFileChange(f);
                    }}
                  />
                )}
              </div>
              <Button
                type="submit"
                isLoading={isUploading}
                disabled={!file}
                className="h-12"
              >
                Submit Payment
              </Button>
            </form>
          )}
        </div>
      )}

      {/* VERIFICATION STATE */}
      {(b.status === "PERLU_VERIFIKASI" || b.payment?.status === "PENDING") && (
        <div className="mt-4 text-[10px] font-black text-amber-400 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex items-center gap-3 italic uppercase tracking-wider">
          <Clock size={12} className="animate-pulse" />
          <span>Payment under review by admin.</span>
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
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fileByBookingId, setFileByBookingId] = useState<Record<string, File | null>>({});
  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [hostedMatches, setHostedMatches] = useState<any[]>([]);
  const [joinedMatches, setJoinedMatches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"bookings" | "hosted" | "joined">("bookings");
  const [openMatchBooking, setOpenMatchBooking] = useState<Booking | null>(null);
  const [isCancelMatchLoading, setIsCancelMatchLoading] = useState<string | null>(null);

  const canFetch = status === "authenticated";
  const isInteracting = !!rescheduleBooking || !!detailBooking || !!uploadingBookingId || Object.values(fileByBookingId).some(f => !!f);

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

  const refresh = async (manageLifecycle = false, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      if (manageLifecycle) {
        await fetch("/api/bookings/expire", { method: "POST" });
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

  useEffect(() => {
    if (!canFetch) return;
    refresh(true); // Manage lifecycle on initial load
    const interval = setInterval(() => {
      if (!isInteracting && !isLoading) {
        refresh(false, true); // Silent refresh in background
      }
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

  const submitProof = async (bookingId: string) => {
    const file = fileByBookingId[bookingId];
    if (!file) {
      setToast({ msg: "Mohon pilih file gambar bukti pembayaran.", type: "error" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setToast({ msg: "File harus berupa gambar (JPG, PNG, WebP).", type: "error" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setToast({ msg: "Ukuran file maksimal 2MB.", type: "error" });
      return;
    }

    setUploadingBookingId(bookingId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookingId", bookingId);

      const uploadResponse = await fetch("/api/upload-proof", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        if (uploadResponse.status === 410) {
          setToast({
            msg: errorData.error || "Waktu pembayaran telah habis. Silakan lakukan booking baru.",
            type: "error",
          });
          await refresh();
        } else {
          throw new Error(errorData.error || "Gagal mengunggah file.");
        }
        return;
      }

      setToast({ msg: "Bukti pembayaran terkirim. Menunggu verifikasi admin.", type: "success" });
      setFileByBookingId((prev) => ({ ...prev, [bookingId]: null }));
      await refresh(false, true); // Silent refresh to update status
    } catch (e: unknown) {
      setToast({ msg: getErrorMessage(e) || "Terjadi kesalahan", type: "error" });
    } finally {
      setUploadingBookingId(null);
    }
  };

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
            <Button variant="outline" onClick={refresh} isLoading={isLoading} className="flex-1 md:flex-none h-11 border-white/10 hover:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] px-6">
              Refresh
            </Button>
          </div>
        </div>

        {/* SECTION 2 — MEMBERSHIP HERO CARD */}
        <div className="animate-fade-in-up delay-100">
          {(session?.user as any)?.membershipStatus === "FREE" ? (
            <UpgradeInvitationCard />
          ) : (
            <MembershipStatusCard 
              status={(session?.user as any)?.membershipStatus}
              type={(session?.user as any)?.membership}
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
            value={(session?.user as any)?.membership || "BASIC"}
            isRole
          />
        </div>

        {/* Tabs Switcher Section (Part 6) */}
        <div className="p-1 bg-[#0F0F0F] border border-white/5 rounded-[1.5rem] w-full md:w-auto overflow-hidden select-none">
          <div className="grid grid-cols-3 md:flex md:flex-row gap-1">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`py-3 md:px-5 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 ${
                activeTab === "bookings"
                  ? "bg-white/5 text-neon border border-neon/20 shadow-[0_0_15px_rgba(215,255,63,0.05)]"
                  : "text-white/40 hover:text-white border border-transparent"
              }`}
            >
              <span className="text-[12px] md:text-sm">📅</span>
              <span className="text-center truncate w-full md:w-auto">Bookings ({bookings.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("hosted")}
              className={`py-3 md:px-5 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 ${
                activeTab === "hosted"
                  ? "bg-white/5 text-neon border border-neon/20 shadow-[0_0_15px_rgba(215,255,63,0.05)]"
                  : "text-white/40 hover:text-white border border-transparent"
              }`}
            >
              <span className="text-[12px] md:text-sm">🎾</span>
              <span className="text-center truncate w-full md:w-auto">Hosted ({hostedMatches.filter(m => m.status !== "CANCELED").length})</span>
            </button>
            <button
              onClick={() => setActiveTab("joined")}
              className={`py-3 md:px-5 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 ${
                activeTab === "joined"
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
                    file={fileByBookingId[b.id] || null}
                    onFileChange={(f) => setFileByBookingId(prev => ({ ...prev, [b.id]: f }))}
                    onUpload={() => submitProof(b.id)}
                    isUploading={uploadingBookingId === b.id}
                    onReschedule={setRescheduleBooking}
                    onShowDetail={setDetailBooking}
                    onOpenMatch={setOpenMatchBooking}
                  />
                ))}
              </div>
            )
          ) : activeTab === "hosted" ? (
            hostedMatches.filter(m => m.status !== "CANCELED").length === 0 ? (
              <div className="bg-[#0F0F0F]/50 rounded-[2rem] border border-white/5 p-16 text-center">
                <p className="text-white/40 font-bold text-lg">No hosted matches active.</p>
                <p className="text-white/20 text-xs mt-1 italic font-semibold">Confirm a booking slot and open it to find players!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {hostedMatches.filter(m => m.status !== "CANCELED").map((m) => (
                  <Card key={m.id} className="p-6 sm:p-8 !rounded-[2rem] border-white/5 shadow-xl bg-[#0F0F0F]/80">
                    <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-neon/10 text-neon px-2.5 py-1 rounded-md border border-neon/20 italic select-none">
                            {m.matchType}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-400 px-2.5 py-1 rounded-md border border-violet-500/20 italic select-none">
                            {m.skillLevel}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tight leading-tight">
                          🎾 {m.title}
                        </h3>
                        <p className="text-white/40 text-xs font-semibold leading-relaxed max-w-xl">
                          {m.description || "No match description provided."}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 pt-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] italic">
                          <div>📅 {String(m.booking.date).slice(0, 10)}</div>
                          <div>🕒 {formatMinutesToHHmm(m.booking.startTime)} - {formatMinutesToHHmm(m.booking.endTime)}</div>
                          <div className="col-span-2 md:col-span-1 truncate">📍 {m.booking.court.name}</div>
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end gap-4 shrink-0">
                        <div className="space-y-1 md:text-right">
                          <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">Players Registered</p>
                          <p className="text-xl font-black text-neon italic">
                            {m.players.length} / {m.maxPlayers}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => cancelMatch(m.id)}
                            disabled={isCancelMatchLoading === m.id}
                            className="h-8 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[9px] font-black text-red-400 uppercase tracking-widest rounded-lg transition-all"
                          >
                            {isCancelMatchLoading === m.id ? "Canceling..." : "Cancel Match"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Players list display */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Match Roster</p>
                      <div className="flex flex-wrap gap-2">
                        {m.players.map((p: any) => (
                          <div key={p.id} className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-full px-3 py-1 text-[10px] font-bold text-white/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon"></span>
                            <span>{p.player.name}</span>
                            {p.playerId === m.hostId && (
                              <span className="text-[8px] font-black text-neon uppercase italic tracking-tighter ml-1 select-none">Host</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : activeTab === "joined" ? (
            joinedMatches.filter(m => m.status !== "CANCELED").length === 0 ? (
              <div className="bg-[#0F0F0F]/50 rounded-[2rem] border border-white/5 p-16 text-center">
                <p className="text-white/40 font-bold text-lg">No joined matches yet.</p>
                <Link href="/booking">
                  <Button className="mt-4">Find Matches</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-6">
                {joinedMatches.filter(m => m.status !== "CANCELED").map((m) => (
                  <Card key={m.id} className="p-6 sm:p-8 !rounded-[2rem] border-white/5 shadow-xl bg-[#0F0F0F]/80">
                    <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-neon/10 text-neon px-2.5 py-1 rounded-md border border-neon/20 italic select-none">
                            {m.matchType}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-400 px-2.5 py-1 rounded-md border border-violet-500/20 italic select-none">
                            {m.skillLevel}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tight leading-tight">
                          🎾 {m.title}
                        </h3>
                        <p className="text-white/40 text-xs font-semibold leading-relaxed max-w-xl">
                          Host: <span className="text-white">{m.host.name}</span>
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 pt-1 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] italic">
                          <div>📅 {String(m.booking.date).slice(0, 10)}</div>
                          <div>🕒 {formatMinutesToHHmm(m.booking.startTime)} - {formatMinutesToHHmm(m.booking.endTime)}</div>
                          <div className="col-span-2 md:col-span-1 truncate">📍 {m.booking.court.name}</div>
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end gap-4 shrink-0">
                        <div className="space-y-1 md:text-right">
                          <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">Players Registered</p>
                          <p className="text-xl font-black text-neon italic">
                            {m.players.length} / {m.maxPlayers}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <a
                            href={`https://wa.me/${m.host.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-4 bg-neon hover:bg-neon/90 text-black text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center shadow-[0_0_10px_rgba(215,255,63,0.15)] gap-1"
                          >
                            <span>📱</span> Contact Host
                          </a>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
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
                {detailBooking.bookingCode || detailBooking.id.slice(0,8)}
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
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Court</span>
                  <span className="text-sm font-black text-white">{detailBooking.court?.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Date</span>
                  <span className="text-sm font-black text-white">{String(detailBooking.date).slice(0,10)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Time</span>
                  <span className="text-sm font-black text-white">
                    {formatMinutesToHHmm(detailBooking.startTime)} - {formatMinutesToHHmm(detailBooking.endTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Status</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                    detailBooking.status === "CHECKED_IN" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
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
            onSuccess={async () => {
              setToast({
                msg: "Match room successfully created and published!",
                type: "success",
              });
              setOpenMatchBooking(null);
              await refresh();
            }}
            onError={(msg) => setToast({ msg, type: "error" })}
          />
        )}
      </AnimatePresence>
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
