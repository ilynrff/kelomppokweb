"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { formatMinutesToHHmm } from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchJson } from "@/lib/fetchJson";
import { 
  Check, 
  Clock, 
  MapPin, 
  CalendarDays, 
  Zap, 
  Sparkles, 
  ShieldAlert, 
  Package, 
  DollarSign, 
  ChevronRight,
  ArrowRight,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Booking = {
  id: string;
  bookingCode: string;
  date: string;
  startTime: number;
  endTime: number;
  totalPrice: number;
  status: string;
  expiresAt: string;
  equipmentPackage: string;
  equipmentPrice: number;
  courtId: string;
  court?: {
    id: string;
    name: string;
    location: string;
    pricePerHour: number;
    images: { url: string; isDefault: boolean; isActive: boolean }[];
  };
};

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

export default function BookingSummaryPage({ params }: { params: { bookingId: string } }) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const isOpeningPaymentRef = useRef(false);

  // Success view states
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Countdown timer for expiry
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const fetchBooking = useCallback(async () => {
    console.log("[SUMMARY] Loading booking:", params.bookingId);
    console.log("[SUMMARY] Fetch started");
    let wasAborted = false;
    try {
      const data = await fetchJson<Booking>(`/api/bookings/${params.bookingId}`);
      console.log("[SUMMARY] Fetch completed");
      setBooking(data);
      
      // Calculate remaining payment time
      if (data.status === "PENDING" && data.expiresAt) {
        const diff = new Date(data.expiresAt).getTime() - Date.now();
        setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
      }
    } catch (error: any) {
      console.log("[SUMMARY] Fetch failed:", error);
      if (error.name === "AbortError" || error.message?.includes("aborted") || error.message?.includes("abort")) {
        console.log("[SUMMARY] Fetch abort detected. Ignoring error state update.");
        wasAborted = true;
        return;
      }
      setError(error?.message || "Failed to load booking details.");
    } finally {
      if (!wasAborted) {
        setIsLoading(false);
      }
    }
  }, [params.bookingId]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/booking/summary/" + params.bookingId);
      return;
    }
    if (authStatus === "authenticated") {
      fetchBooking();
    }
  }, [authStatus, params.bookingId, fetchBooking, router]);

  // Tick countdown timer
  useEffect(() => {
    if (!booking || booking.status !== "PENDING" || timeLeft === null) return;
    if (timeLeft <= 0) {
      setBooking(prev => prev ? { ...prev, status: "EXPIRED" } : null);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setBooking(p => p ? { ...p, status: "EXPIRED" } : null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [booking, timeLeft]);

  // Success countdown to redirect to Dashboard
  useEffect(() => {
    if (!paymentSuccess) return;
    if (countdown <= 0) {
      router.push("/dashboard");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(c => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [paymentSuccess, countdown, router]);

  const handlePay = async () => {
    if (!booking || isProcessing) return;
    if (isOpeningPaymentRef.current) return;
    isOpeningPaymentRef.current = true;
    setIsProcessing(true);
    setError("");

    try {
      const tokenRes = await fetch(`/api/bookings/${booking.id}/payment-token`);
      const tokenResult = await tokenRes.json();
      
      if (!tokenRes.ok) {
        throw new Error(tokenResult.error || "Gagal mendapatkan token pembayaran.");
      }
      
      const loaded = await loadSnapScript(tokenResult.clientKey, tokenResult.isProduction);
      const snap = (window as any).snap;
      
      if (loaded && snap) {
        snap.pay(tokenResult.token, {
          onSuccess: () => {
            isOpeningPaymentRef.current = false;
            setPaymentSuccess(true);
          },
          onPending: () => {
            isOpeningPaymentRef.current = false;
            setToast({ msg: "Pembayaran Anda sedang diproses.", type: "success" });
            setTimeout(() => router.push("/dashboard?payment=pending"), 1500);
          },
          onError: () => {
            isOpeningPaymentRef.current = false;
            setToast({ msg: "Pembayaran gagal. Silakan coba lagi.", type: "error" });
          },
          onClose: () => {
            isOpeningPaymentRef.current = false;
            setToast({ msg: "Metode pembayaran ditutup. Anda dapat membayar kapan saja sebelum kedaluwarsa.", type: "error" });
          }
        });
      } else {
        throw new Error("Gagal memuat Snap SDK pembayaran.");
      }
    } catch (err: any) {
      isOpeningPaymentRef.current = false;
      setError(err?.message || "Failed to initiate payment.");
      setToast({ msg: err?.message || "Failed to initiate payment.", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelBooking = async (editMode: boolean) => {
    if (!booking || isProcessing) return;
    setIsProcessing(true);
    
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || "Gagal membatalkan booking.");
      }
      
      setToast({ msg: editMode ? "Redirecting to edit booking..." : "Booking berhasil dibatalkan.", type: "success" });
      
      setTimeout(() => {
        if (editMode) {
          router.push(`/booking?courtId=${booking.courtId}`);
        } else {
          router.push("/booking");
        }
      }, 1000);
    } catch (err: any) {
      setToast({ msg: err?.message || "Gagal membatalkan booking.", type: "error" });
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#050505] min-h-screen relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-neon/10 blur-[150px] opacity-40"></div>
        <div className="animate-pulse w-full max-w-4xl h-[500px] bg-white/[0.02] rounded-[3rem] border border-white/5 shadow-2xl"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#050505] min-h-screen relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-neon/10 blur-[150px] opacity-40"></div>
        <div className="bg-[#0F0F0F] rounded-[2rem] border border-red-500/20 p-12 text-center backdrop-blur-xl relative z-10 max-w-md w-full">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-2xl font-black text-white mb-3 uppercase tracking-tight italic">Summary Error</h1>
          <p className="text-white/60 font-medium mb-8 text-sm">
            {error || "Booking not found or access denied."}
          </p>
          <Link href="/booking" className="w-full">
            <Button className="w-full">Back to Booking</Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- Success State Render ---
  if (paymentSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#050505] min-h-screen relative overflow-hidden selection:bg-neon selection:text-black">
        {/* Cinematic Glow Backdrops */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-neon/10 blur-[150px] opacity-40"></div>
          <div className="absolute -bottom-40 -left-20 w-[600px] h-[600px] bg-neon/5 blur-[120px] rounded-full"></div>
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '80px 80px' }}></div>
        </div>

        <div className="w-full max-w-[550px] flex flex-col items-center z-10 animate-in zoom-in-95 duration-300">
          
          {/* TOP SECTION */}
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Check size={36} strokeWidth={3} />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-[0.2em] italic">
                <Sparkles size={10} className="text-neon" /> Reservation Secured
              </div>
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">Booking Confirmed</h2>
              <p className="text-white/60 text-sm font-medium">
                Your court has been successfully reserved.
              </p>
            </div>
          </div>

          {/* MIDDLE SECTION - Single booking details card */}
          <div className="w-full bg-[#0F0F0F] border border-white/10 rounded-[2rem] p-6 space-y-4 shadow-2xl mb-8">
            {/* Booking Code */}
            <div className="flex justify-between items-center text-sm pb-4 border-b border-white/5">
              <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">Booking Code</span>
              <span className="text-white font-black tracking-wider uppercase font-mono">{booking.bookingCode}</span>
            </div>

            {/* Court Name */}
            <div className="flex justify-between items-center text-sm pb-4 border-b border-white/5">
              <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">Court Name</span>
              <span className="text-white font-bold">{booking.court?.name}</span>
            </div>

            {/* Date */}
            <div className="flex justify-between items-center text-sm pb-4 border-b border-white/5">
              <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">Date</span>
              <span className="text-white font-bold">{String(booking.date).slice(0, 10)}</span>
            </div>

            {/* Time */}
            <div className="flex justify-between items-center text-sm pb-4 border-b border-white/5">
              <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">Time</span>
              <span className="text-white font-bold">
                {formatMinutesToHHmm(booking.startTime)} - {formatMinutesToHHmm(booking.endTime)}
              </span>
            </div>

            {/* Total Paid */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">Total Paid</span>
              <span className="text-neon font-black text-lg drop-shadow-[0_0_10px_rgba(215,255,63,0.3)]">
                Rp {booking.totalPrice.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* BOTTOM SECTION */}
          <div className="w-full flex flex-col items-center space-y-4">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
              Redirecting you to dashboard in {countdown}s...
            </p>
            <Button 
              onClick={() => router.push("/dashboard")}
              className="w-full h-12 bg-neon hover:bg-neon/90 text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(215,255,63,0.25)]"
            >
              Go To Dashboard
            </Button>
          </div>

        </div>
      </div>
    );
  }

  // --- Normal Summary Page Render ---
  const durationHours = (booking.endTime - booking.startTime) / 60;
  const courtCost = booking.totalPrice - booking.equipmentPrice;
  const courtImage = booking.court?.images?.[0]?.url || "";
  const isExpired = booking.status === "EXPIRED";

  const minutesLeft = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const secondsLeft = timeLeft !== null ? timeLeft % 60 : 0;

  return (
    <div className="flex-1 bg-[#050505] min-h-screen relative pb-32 pt-28 overflow-hidden selection:bg-neon selection:text-black">
      {/* Toast notifications */}
      {toast && (
        <Toast 
          isOpen={true} 
          message={toast.msg} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Cinematic Glow Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-neon/5 blur-[150px] opacity-40"></div>
        <div className="absolute -bottom-40 -left-20 w-[600px] h-[600px] bg-neon/[0.02] blur-[120px] rounded-full"></div>
        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '80px 80px' }}></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10 space-y-10 animate-fade-in-up">
        {/* Header */}
        <div className="text-center md:text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-[0.25em] italic">
            <span>📅</span> Review Reservation Details
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
            BOOKING <span className="text-neon drop-shadow-[0_0_15px_rgba(215,255,63,0.35)]">SUMMARY.</span>
          </h1>
          <p className="text-white/60 font-medium text-sm max-w-xl leading-relaxed">
            Please verify all details and select a payment method.
          </p>
        </div>

        {/* Expiry Alert banner */}
        {booking.status === "PENDING" && timeLeft !== null && (
          <div className={`flex items-center justify-between gap-4 border border-white/5 rounded-2xl p-4 bg-white/[0.02] transition-all duration-500`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold bg-white/5 border border-white/10 ${timeLeft < 300 ? "text-red-400 border-red-500/20 bg-red-500/5" : "text-neon border-neon/20 bg-neon/5"}`}>
                {timeLeft < 300 ? "🚨" : "⏳"}
              </div>
              <div>
                <div className="font-black text-sm text-white uppercase italic tracking-wide">
                  {timeLeft < 300 ? "Urgent: Payment Window Closing" : "Secure Your Slot"}
                </div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
                  Complete checkout before this pending slot expires
                </p>
              </div>
            </div>
            <div className={`font-mono font-black text-xl text-white tracking-widest bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 tabular-nums shrink-0 ${timeLeft < 300 ? "text-red-400 border-red-500/30 bg-red-500/10 animate-pulse" : "text-neon border-neon/30 bg-neon/10"}`}>
              {String(minutesLeft).padStart(2, "0")}:{String(secondsLeft).padStart(2, "0")}
            </div>
          </div>
        )}

        {/* Expired Slot Alert */}
        {isExpired && (
          <div className="flex items-center gap-3 border border-red-500/20 rounded-2xl p-4 bg-red-500/[0.02]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400 border border-red-500/20 bg-red-500/5 text-sm font-bold shrink-0">
              🚫
            </div>
            <div>
              <div className="font-black text-sm text-red-400 uppercase italic tracking-wide">
                Booking Expiry Limit Reached
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
                The 15-minute checkout window has elapsed. Please select another court slot.
              </p>
            </div>
          </div>
        )}

        {/* Main Content Layout Grid */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Left Column: Core Info Cards */}
          <div className="space-y-6">
            <div className="bg-[#0F0F0F]/60 backdrop-blur-md rounded-[2rem] border border-white/5 p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                <Sparkles size={120} />
              </div>

              {/* Court Details */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="relative h-28 w-full md:w-40 rounded-2xl overflow-hidden bg-[#1A1A1A] shrink-0 border border-white/10">
                  {courtImage ? (
                    <Image src={courtImage} alt={booking.court?.name || "Court"} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent flex items-center justify-center text-white/20 text-3xl">🎾</div>
                  )}
                </div>
                
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black text-neon bg-neon/10 border border-neon/20 px-2 py-0.5 rounded uppercase tracking-wider">
                      {booking.bookingCode || "PDL-PENDING"}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border italic ${
                      isExpired 
                        ? "bg-red-500/10 text-red-400 border-red-500/20" 
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tight leading-none">
                    {booking.court?.name || "Court Arena"}
                  </h3>
                  
                  <p className="text-xs font-bold text-white/50 flex items-center gap-1.5 uppercase tracking-wide">
                    <MapPin size={12} className="text-neon/50" /> {booking.court?.location || "Main PadelGO Location"}
                  </p>
                </div>
              </div>

              {/* Core Reservation Info Fields */}
              <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-white/[0.03]">
                {/* Date */}
                <div className="flex gap-3 group/item">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 group-hover/item:text-neon transition-all duration-300">
                    <CalendarDays size={14} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Reservation Date</p>
                    <p className="text-xs font-bold text-white mt-0.5">{booking.date.slice(0, 10)}</p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex gap-3 group/item">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 group-hover/item:text-neon transition-all duration-300">
                    <Zap size={14} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Time Schedule</p>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {formatMinutesToHHmm(booking.startTime)} – {formatMinutesToHHmm(booking.endTime)} ({durationHours} hr{durationHours > 1 ? "s" : ""})
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gear Details (if present) */}
            {booking.equipmentPackage && booking.equipmentPackage !== "NONE" && (
              <div className="bg-[#0F0F0F]/60 backdrop-blur-md rounded-[2rem] border border-white/5 p-6 md:p-8 space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-sm shrink-0">
                    <Package size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase italic tracking-widest">Premium Rental Add-On</h4>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider mt-0.5">
                      {booking.equipmentPackage === "STARTER" ? "Starter Gear Package" : "Group Gear Package"} Included
                    </p>
                  </div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed font-medium pl-13">
                  {booking.equipmentPackage === "STARTER" 
                    ? "Set includes 2 high-quality rackets and 1 tube of tournament-grade padel balls." 
                    : "Set includes 4 high-quality rackets and 1 tube of tournament-grade padel balls."
                  }
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Pricing & Sticky Payment Action Container */}
          <div className="space-y-6 lg:sticky lg:top-28">
            <div className="bg-[#0F0F0F]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl space-y-6">
              <div>
                <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Order Summary</h3>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-0.5">Final breakdown of costs</p>
              </div>

              {/* Pricing breakdown ledger */}
              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white/40 uppercase tracking-wider text-[9px]">Court Rental ({durationHours} hr)</span>
                  <span className="text-white">Rp {courtCost.toLocaleString("id-ID")}</span>
                </div>
                
                {booking.equipmentPackage !== "NONE" && (
                  <div className="flex justify-between items-center text-xs font-bold border-t border-white/5 pt-3">
                    <span className="text-white/40 uppercase tracking-wider text-[9px] flex items-center gap-1">Add-on Gear <span className="text-[8px] italic text-purple-400">({booking.equipmentPackage})</span></span>
                    <span className="text-purple-400">+ Rp {booking.equipmentPrice.toLocaleString("id-ID")}</span>
                  </div>
                )}
                
                {/* Total */}
                <div className="flex justify-between items-center border-t border-white/10 pt-3.5 mt-1">
                  <span className="font-black text-neon uppercase tracking-widest text-[9px]">Grand Total</span>
                  <span className="text-xl font-black text-neon drop-shadow-[0_0_10px_rgba(215,255,63,0.3)]">
                    Rp {booking.totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Main Actions block */}
              <div className="space-y-3">
                {!isExpired ? (
                  <Button 
                    onClick={handlePay}
                    disabled={isProcessing}
                    isLoading={isProcessing}
                    className="w-full h-14 bg-neon hover:bg-neon/90 text-black text-xs font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(215,255,63,0.25)] flex items-center justify-center gap-2 focus:outline-none"
                  >
                    <span>Pay Now</span>
                    <ChevronRight size={14} strokeWidth={2.5} />
                  </Button>
                ) : (
                  <Button 
                    disabled
                    className="w-full h-14 bg-white/5 border border-white/10 text-white/30 text-xs font-black uppercase tracking-widest rounded-xl cursor-not-allowed"
                  >
                    Expired
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    onClick={() => handleCancelBooking(true)}
                    disabled={isProcessing}
                    className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl border border-white/10 hover:border-white/20 bg-transparent text-white/50 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Edit Booking
                  </button>
                  <button 
                    onClick={() => handleCancelBooking(false)}
                    disabled={isProcessing}
                    className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
