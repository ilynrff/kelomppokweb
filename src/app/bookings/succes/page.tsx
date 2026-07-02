"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { formatMinutesToHHmm } from "@/lib/bookingTime";
import { fetchJson } from "@/lib/fetchJson";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Clock, 
  Sparkles
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
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div 
      variants={containerVariants as any}
      initial="hidden"
      animate="visible"
      className="w-full max-w-[550px] flex flex-col items-center z-10 py-10"
    >
      {/* TOP SECTION */}
      <motion.div variants={itemVariants as any} className="flex flex-col items-center text-center space-y-4 mb-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-amber-500/20 blur-[30px] rounded-full"></div>
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 relative z-10 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <Clock size={36} strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-[0.2em] italic">
            <Sparkles size={10} className="text-neon" /> Reservation Secured
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">Booking Berhasil</h1>
          <p className="text-white/60 text-sm font-medium max-w-sm">
            Konfirmasi pembayaran dalam waktu <span className="text-white font-bold">15 menit</span> agar slot tidak kedaluwarsa otomatis.
          </p>
        </div>
      </motion.div>

      {/* MIDDLE SECTION - Single booking details card */}
      <motion.div variants={itemVariants as any} className="w-full bg-[#0F0F0F] border border-white/10 rounded-[2rem] p-6 space-y-4 shadow-2xl mb-8">
        {/* Booking Code */}
        <div className="flex justify-between items-center text-sm pb-4 border-b border-white/5">
          <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">Booking Code</span>
          <span className="text-white font-black tracking-wider uppercase font-mono">{data?.bookingCode || "..."}</span>
        </div>

        {/* Court Name */}
        <div className="flex justify-between items-center text-sm pb-4 border-b border-white/5">
          <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">Court Name</span>
          <span className="text-white font-bold">{data?.court?.name || "..."}</span>
        </div>

        {/* Date */}
        <div className="flex justify-between items-center text-sm pb-4 border-b border-white/5">
          <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">Date</span>
          <span className="text-white font-bold">{data ? String(data.date).slice(0, 10) : "..."}</span>
        </div>

        {/* Time */}
        <div className="flex justify-between items-center text-sm pb-4 border-b border-white/5">
          <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">Time</span>
          <span className="text-white font-bold">
            {data ? `${formatMinutesToHHmm(data.startTime)} - ${formatMinutesToHHmm(data.endTime)}` : "..."}
          </span>
        </div>

        {/* Total Paid / To Pay */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">Total Paid</span>
          <span className="text-neon font-black text-lg drop-shadow-[0_0_10px_rgba(215,255,63,0.3)]">
            Rp {Number(data?.totalPrice || 0).toLocaleString("id-ID")}
          </span>
        </div>
      </motion.div>

      {/* BOTTOM SECTION */}
      <motion.div variants={itemVariants as any} className="w-full flex flex-col items-center space-y-4">
        <Link href="/dashboard" className="w-full">
          <Button className="w-full h-12 bg-neon hover:bg-neon/90 text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(215,255,63,0.25)]">
            Dashboard <ArrowRight size={14} className="ml-2" />
          </Button>
        </Link>

        <Link href="/booking" className="w-full">
          <button className="w-full h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white font-black text-[10px] uppercase tracking-widest italic transition-all">
            Book Another Court
          </button>
        </Link>
      </motion.div>
    </motion.div>
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
        <div className="animate-pulse w-full max-w-[550px] h-[400px] bg-white/[0.02] rounded-[2rem] border border-white/5 shadow-2xl"></div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
