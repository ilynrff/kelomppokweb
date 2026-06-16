"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { formatMinutesToHHmm } from "@/lib/bookingTime";
import { fetchJson } from "@/lib/fetchJson";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  ArrowRight, 
  LayoutDashboard, 
  CalendarDays, 
  Clock, 
  MapPin, 
  Receipt,
  Sparkles,
  Zap
} from "lucide-react";

type Booking = {
  id: string;
  bookingCode: string;
  date: string;
  startTime: number;
  endTime: number;
  totalPrice: number;
  status: string;
  court?: { name?: string; location?: string };
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [data, setData] = useState<Booking | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) return;
    fetchJson<Booking>(`/api/bookings/${bookingId}`)
      .then((json) => {
        setData(json);
      })
      .catch((e) => setError(e?.message || "Terjadi kesalahan"));
  }, [bookingId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-2xl space-y-12 relative z-10 py-20"
    >
      {/* 1. HERO TOP - Centered Success State */}
      <div className="flex flex-col items-center text-center space-y-8">
        <motion.div 
          variants={itemVariants}
          className="relative group"
        >
          {/* Animated Glow Backdrop */}
          <div className="absolute inset-0 bg-neon/30 blur-[60px] rounded-full animate-pulse-slow"></div>
          
          {/* Neon Success Badge */}
          <div className="w-32 h-32 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-3xl flex items-center justify-center relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
              className="w-24 h-24 rounded-full bg-neon/10 border border-neon/40 flex items-center justify-center text-neon shadow-[0_0_40px_rgba(215,255,63,0.3)]"
            >
              <Check size={48} strokeWidth={3} className="drop-shadow-[0_0_10px_rgba(215,255,63,0.5)]" />
            </motion.div>
            
            {/* Subtle Rotating Border */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border border-dashed border-neon/20 rounded-full"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.4em] italic">
            <Sparkles size={12} className="text-neon" /> Reservation Secured
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-tight">
            BOOKING <span className="text-neon drop-shadow-[0_0_15px_rgba(215,255,63,0.3)]">BERHASIL.</span>
          </h1>
          <p className="text-white/40 font-medium text-lg italic max-w-md mx-auto leading-relaxed">
            Konfirmasi pembayaran dalam waktu <span className="text-white">15 menit</span> agar slot tidak kedaluwarsa otomatis.
          </p>
        </motion.div>
      </div>

      {/* 2. MAIN BOOKING CARD - Dark Glass Card */}
      <motion.div variants={itemVariants} className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-br from-neon/30 via-transparent to-transparent rounded-[3rem] blur-[1px] group-hover:blur-md transition-all duration-700"></div>
        <div className="relative bg-[#0F0F0F]/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12">
            <Receipt size={180} />
          </div>

          <div className="relative z-10 space-y-12">
            {/* Booking Code Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Booking Code</p>
                <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-widest leading-none">
                  {data?.bookingCode || "PDL-X-XXXX-XXX"}
                </h2>
              </div>
              <div className="px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <Clock size={12} /> Pending Payment
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <DetailItem icon={<MapPin size={16} />} label="Court Location" value={data?.court?.name || "Premium Court"} />
                <DetailItem icon={<CalendarDays size={16} />} label="Match Date" value={data ? String(data.date).slice(0, 10) : "--"} />
              </div>
              <div className="space-y-8">
                <DetailItem 
                  icon={<Zap size={16} />} 
                  label="Time Slot" 
                  value={data ? `${formatMinutesToHHmm(data.startTime)} - ${formatMinutesToHHmm(data.endTime)}` : "--"} 
                />
                <DetailItem icon={<LayoutDashboard size={16} />} label="Reservation ID" value={data?.id.slice(0, 8).toUpperCase() || "--"} />
              </div>
            </div>

            {/* Total Payment Focus */}
            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Total Payment</p>
                <p className="text-4xl md:text-5xl font-black text-neon italic leading-none drop-shadow-[0_0_20px_rgba(215,255,63,0.3)]">
                  Rp {Number(data?.totalPrice || 0).toLocaleString("id-ID")}
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <Link href="/dashboard" className="w-full md:w-auto">
                  <Button className="h-16 px-10 bg-white text-black font-black italic uppercase tracking-[0.2em] rounded-2xl hover:bg-neon hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_30px_-10px_rgba(255,255,255,0.2)]">
                    Dashboard <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. SECONDARY CTA */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <Link href="/booking">
          <button className="px-8 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white font-black text-[10px] uppercase tracking-[0.4em] italic transition-all group">
            <span className="flex items-center gap-3">
              Book Another Court <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </Link>
      </motion.div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 5s ease-in-out infinite;
        }
      `}</style>
    </motion.div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex gap-4 group/item">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover/item:text-neon group-hover/item:border-neon/30 transition-all duration-500">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-black text-white uppercase italic tracking-tight">{value}</p>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#050505] min-h-screen relative overflow-hidden selection:bg-neon selection:text-black">
      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-neon/10 blur-[150px] opacity-40"></div>
        <div className="absolute -bottom-40 -left-20 w-[600px] h-[600px] bg-neon/5 blur-[120px] rounded-full"></div>
        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '80px 80px' }}></div>
      </div>

      <Suspense fallback={
        <div className="animate-pulse w-full max-w-2xl h-[600px] bg-white/[0.02] rounded-[3rem] border border-white/5 shadow-2xl"></div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
