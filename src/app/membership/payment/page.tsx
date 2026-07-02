"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { 
  ArrowRight, ShieldCheck, CheckCircle2, 
  Info, Sparkles, Check, Clock
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

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

export default function MembershipPaymentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const isOpeningPaymentRef = useRef(false);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-8 h-8 border-4 border-neon/10 border-t-neon rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentStatus = (session?.user as any)?.membershipStatus || "FREE";
  const currentExpiry = (session?.user as any)?.membershipExpiresAt;
  
  let currentExpiryDate: Date | null = null;
  if (currentExpiry) {
    currentExpiryDate = new Date(currentExpiry);
  }

  // Calculate new expiry date
  let newExpiryDate = new Date();
  if (currentStatus === "ACTIVE" && currentExpiryDate && currentExpiryDate.getTime() > Date.now()) {
    newExpiryDate = new Date(currentExpiryDate.getTime());
  }
  newExpiryDate.setDate(newExpiryDate.getDate() + 30);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const handleCheckout = async () => {
    if (isCheckoutLoading) return;
    if (isOpeningPaymentRef.current) return;
    isOpeningPaymentRef.current = true;
    setIsCheckoutLoading(true);

    try {
      const res = await fetch("/api/membership/checkout", {
        method: "POST",
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result?.error || "Gagal memproses checkout membership");
      }

      if (result.token && result.clientKey) {
        const loaded = await loadSnapScript(result.clientKey, result.isProduction);
        const snap = (window as any).snap;

        if (loaded && snap) {
          snap.pay(result.token, {
            onSuccess: () => {
              isOpeningPaymentRef.current = false;
              router.push("/dashboard?membership=success");
            },
            onPending: () => {
              isOpeningPaymentRef.current = false;
              router.push("/dashboard?membership=pending");
            },
            onError: () => {
              isOpeningPaymentRef.current = false;
              alert("Pembayaran membership gagal atau dibatalkan.");
            },
            onClose: () => {
              isOpeningPaymentRef.current = false;
              router.push("/dashboard");
            }
          });
          return;
        }
      }
      throw new Error("Sistem pembayaran Midtrans tidak tersedia.");
    } catch (err: any) {
      isOpeningPaymentRef.current = false;
      alert(err.message || "Terjadi kesalahan pembayaran");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const benefits = [
    {
      title: "Priority Court Booking",
      description: "Book courts up to 14 days in advance (H-14 priority access) to secure peak slots before free users."
    },
    {
      title: "Member Pricing",
      description: "Enjoy special discounts and exclusive pricing on all court reservations and equipment packages."
    },
    {
      title: "Open Match Access",
      description: "Create or join public/private matches with membership status badges highlighted to the community."
    },
    {
      title: "Future Exclusive Features",
      description: "Get immediate access to upcoming features, early tournament registrations, and operator perks."
    }
  ];

  const paymentMethods = [
    "QRIS", "GoPay", "ShopeePay", "Virtual Account", "Credit Card", "Debit Card"
  ];

  return (
    <div className="flex-1 min-h-screen pt-28 pb-32 md:pb-16 px-4 md:px-6 relative overflow-hidden bg-[#050505] selection:bg-neon selection:text-black">
      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-neon/5 blur-[150px] opacity-40"></div>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-6xl mx-auto space-y-8 relative z-10"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-[0.2em] italic">
            <ShieldCheck size={10} className="text-neon" /> SECURE MEMBERSHIP CHECKOUT
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
            {currentStatus === "ACTIVE" ? "Renew Your" : "Activate"} <span className="text-neon drop-shadow-[0_0_15px_rgba(215,255,63,0.3)]">Membership.</span>
          </h1>
          <p className="text-white/40 text-xs font-medium max-w-lg mx-auto leading-relaxed">
            Gain priority access to bookings, exclusive pricing, and elite community matching benefits.
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          
          {/* LEFT SIDE (Membership info, Status, Benefits, Secure Payment Gateway) */}
          <div className="space-y-6">
            
            {/* SECTION 1 — MEMBERSHIP STATUS */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] italic flex items-center gap-2">
                <Sparkles size={12} className="text-neon" /> Current Membership
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest block">Status</span>
                  <span className={`text-base font-black uppercase italic tracking-wide ${currentStatus === "ACTIVE" ? "text-emerald-400" : "text-amber-500"}`}>
                    {currentStatus}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest block">Current Expiry</span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    {currentExpiryDate ? formatDate(currentExpiryDate) : "None (Free)"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest block">Renewal</span>
                  <span className="text-xs font-black text-neon uppercase italic tracking-wider block">
                    +30 Days
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest block">New Expiry</span>
                  <span className="text-xs font-black text-white uppercase tracking-wider border-b border-neon/60 pb-0.5 inline-block">
                    {formatDate(newExpiryDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2 — MEMBERSHIP BENEFITS */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] italic flex items-center gap-2">
                <CheckCircle2 size={12} className="text-neon" /> Membership Benefits
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((b, idx) => (
                  <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:border-white/10 hover:bg-white/[0.03] transition-all duration-300 group">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center text-neon shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-[10px] font-black text-white uppercase italic tracking-wider">{b.title}</h3>
                        <p className="text-[9px] text-white/40 leading-relaxed font-semibold">{b.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3 — PAYMENT INFORMATION */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] italic">
                  Secure Payment Gateway
                </h2>
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-wider">
                  Powered by Midtrans
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((pm, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold text-white/60 uppercase tracking-wider hover:border-white/10 hover:text-white transition-all">
                    {pm}
                  </span>
                ))}
              </div>
              
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest flex items-center gap-1.5 pt-1">
                <Info size={10} className="text-neon" /> Fully encrypted instant verification checkout gateway.
              </p>
            </div>

          </div>

          {/* RIGHT SIDE (Order Summary & pay button) */}
          <aside className="space-y-6">
            
            {/* SECTION 4 — ORDER SUMMARY */}
            <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl sticky top-28">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Billing Summary</p>
                <h2 className="text-lg font-black text-white italic uppercase tracking-tighter">Order <span className="text-neon">Total</span></h2>
              </div>

              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white/40 uppercase tracking-wider text-[9px]">Membership Extension</span>
                  <span className="text-white">30 Days</span>
                </div>
                
                <div className="flex justify-between items-center text-xs font-bold border-t border-white/5 pt-3">
                  <span className="text-white/40 uppercase tracking-wider text-[9px]">Price</span>
                  <span className="text-white">Rp 150.000</span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold border-t border-white/5 pt-3">
                  <span className="text-white/40 uppercase tracking-wider text-[9px]">Service Fee</span>
                  <span className="text-white">Rp 0</span>
                </div>

                <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-2">
                  <span className="font-black text-neon uppercase tracking-widest text-[9px]">Grand Total</span>
                  <span className="text-xl font-black text-neon drop-shadow-[0_0_10px_rgba(215,255,63,0.3)]">
                    Rp 150.000
                  </span>
                </div>
              </div>

              {/* Pay Button inline for Tablet + Desktop (hidden on mobile) */}
              <div className="hidden md:block pt-2">
                <Button 
                  onClick={handleCheckout}
                  disabled={isCheckoutLoading}
                  isLoading={isCheckoutLoading}
                  className="w-full h-14 bg-neon hover:bg-neon/90 text-black font-black uppercase tracking-widest text-xs rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(215,255,63,0.25)] flex items-center justify-center gap-2"
                >
                  <span>Bayar Sekarang &rarr;</span>
                </Button>
              </div>

              <div className="hidden md:flex justify-center border-t border-white/5 pt-4">
                <Link href="/membership">
                  <button className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] hover:text-white transition-colors">
                    &larr; Back to Selection
                  </button>
                </Link>
              </div>
            </div>

          </aside>

        </div>
      </motion.div>

      {/* Mobile Sticky CTA Bottom bar (visible only on mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/10 z-50 md:hidden flex flex-col gap-2">
        <Button 
          onClick={handleCheckout}
          disabled={isCheckoutLoading}
          isLoading={isCheckoutLoading}
          className="w-full h-14 bg-neon hover:bg-neon/90 text-black font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_-5px_20px_rgba(215,255,63,0.15)] flex items-center justify-center gap-2"
        >
          <span>Bayar Sekarang &rarr;</span>
        </Button>
        <Link href="/membership" className="text-center">
          <button className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em] py-1">
            Back to Selection
          </button>
        </Link>
      </div>

    </div>
  );
}
