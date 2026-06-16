"use client";

import { useSession } from "next-auth/react";
import { 
  Clock, ShieldCheck, CheckCircle2, 
  ArrowLeft, MessageSquare, Sparkles,
  Zap, Crown
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export default function MembershipPendingPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-8 h-8 border-4 border-neon/10 border-t-neon rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen pt-32 pb-32 px-6 relative overflow-hidden bg-[#050505]">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-neon/10 blur-[150px] opacity-20"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-12 relative z-10"
      >
        {/* Cinematic Visual State */}
        <div className="relative group">
          <div className="absolute inset-0 bg-neon/20 blur-[60px] rounded-full animate-pulse-slow"></div>
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-3xl flex items-center justify-center relative z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border-2 border-dashed border-neon/20 rounded-full"
            ></motion.div>
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center text-neon shadow-[0_0_40px_rgba(215,255,63,0.3)]">
              <Clock size={48} className="animate-float" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.4em] italic">
            <Sparkles size={14} className="text-neon" /> Request Submitted
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-tight">
            Verifikasi <br /> <span className="text-neon">Diproses</span>
          </h1>
          <p className="text-white/40 font-medium text-lg italic leading-relaxed">
            Permintaan keanggotaan Anda sedang ditinjau oleh tim kami. Kami akan melakukan verifikasi pembayaran dalam waktu maksimal <span className="text-white">1x24 jam</span>.
          </p>
        </div>

        {/* Perks Recap */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
          <PerkSummary icon={<Zap size={18} />} text="Priority Booking Access" />
          <PerkSummary icon={<Crown size={18} />} text="Exclusive Member Price" />
          <PerkSummary icon={<ShieldCheck size={18} />} text="Flexible Rescheduling" />
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row items-center gap-6 pt-10">
          <Link href="/">
            <Button className="h-16 px-12 bg-white text-black font-black italic uppercase tracking-[0.3em] rounded-2xl group shadow-2xl">
              Kembali ke Beranda <ArrowLeft size={18} className="ml-2 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <a href="https://wa.me/628123456789" target="_blank" rel="noopener noreferrer">
            <button className="h-16 px-12 rounded-2xl border border-white/10 bg-white/5 text-white font-black italic uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-white/10 transition-all">
              <MessageSquare size={18} className="text-neon" /> WhatsApp Admin
            </button>
          </a>
        </div>

        {/* Footer Note */}
        <div className="pt-20">
          <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] italic">
            PadelGO — The Elite Sports Ecosystem
          </p>
        </div>
      </motion.div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; scale: 1; }
          50% { opacity: 0.3; scale: 1.1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function PerkSummary({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20">
        {icon}
      </div>
      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic text-center leading-tight">
        {text}
      </p>
    </div>
  );
}
