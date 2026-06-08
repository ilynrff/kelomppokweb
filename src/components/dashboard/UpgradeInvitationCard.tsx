"use client";

import { motion } from "framer-motion";
import { Gem, ArrowRight, Star, Crown, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function UpgradeInvitationCard() {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative group"
    >
      <div className="absolute -inset-[1px] bg-gradient-to-r from-white/10 to-transparent rounded-[2rem] blur-[2px] opacity-40 group-hover:opacity-80 transition-opacity"></div>
      
      <div className="relative bg-[#0F0F0F]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-8 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.01] rotate-12 transition-transform group-hover:scale-105 duration-700 pointer-events-none">
          <Gem size={140} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-3">
               <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                  <Zap size={10} className="text-neon" />
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60">Elite Opportunity</span>
               </div>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">
                Unlock Elite <span className="text-neon drop-shadow-[0_0_10px_rgba(215,255,63,0.2)]">Member Benefits</span>
              </h2>
              <p className="text-white/40 text-[11px] md:text-xs font-medium italic leading-relaxed">
                Access member-only pricing, priority H-14 reservations, and premium booking privileges designed for serious players.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
               <BenefitBadge icon={<Star size={10} />} label="10% Discount" />
               <BenefitBadge icon={<ShieldCheck size={10} />} label="Priority Access" />
               <BenefitBadge icon={<Crown size={10} />} label="Elite Status" />
            </div>
          </div>

          <div className="relative z-10 w-full md:w-auto">
            <Link href="/membership">
              <Button className="h-12 px-8 bg-white text-black text-[10px] font-black italic uppercase tracking-[0.2em] rounded-xl hover:bg-neon hover:scale-[1.02] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.4)] w-full md:w-auto">
                Become a Member <ArrowRight size={14} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BenefitBadge({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="text-neon">{icon}</div>
      <span className="text-[9px] font-black text-white/60 uppercase tracking-widest italic">{label}</span>
    </div>
  );
}
