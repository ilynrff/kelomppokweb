"use client";

import { motion } from "framer-motion";
import { Crown, Star, Clock, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type Props = {
  expiresAt?: string | Date | null;
  userName?: string;
  isCompact?: boolean;
};

export function MembershipStatusCard({ status, type, expiresAt, userName, isCompact }: Props) {
  const isMember = type === "MEMBER";
  const isActive = status === "ACTIVE";
  const isPending = status === "PENDING";
  const isExpired = status === "EXPIRED";
  
  // Calculate days remaining if active
  let daysRemaining = 0;
  let isExpiringSoon = false;
  
  if (isActive && expiresAt) {
    const expDate = new Date(expiresAt);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  }

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
      {/* Dynamic Glow Effect */}
      <div className={`absolute -inset-[1px] rounded-[2rem] blur-[2px] transition-all duration-700 opacity-40 group-hover:opacity-80 ${
        isExpiringSoon ? "bg-gradient-to-br from-amber-500/30 to-transparent" :
        isActive ? "bg-gradient-to-br from-neon/30 to-transparent" :
        isPending ? "bg-gradient-to-br from-blue-500/20 to-transparent" :
        isExpired ? "bg-gradient-to-br from-red-500/10 to-transparent" :
        "bg-gradient-to-br from-white/5 to-transparent"
      }`}></div>

      <div className={`relative bg-[#0F0F0F]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden ${
        isCompact ? "p-6" : "p-6 md:p-8"
      } ${
        isExpired ? "grayscale-[0.5] opacity-70" : ""
      }`}>
        {/* Decorative Background Icon */}
        <div className={`absolute top-0 right-0 p-4 opacity-[0.02] rotate-12 transition-transform group-hover:scale-105 duration-700 pointer-events-none ${isCompact ? 'scale-75 origin-top-right' : ''}`}>
          {isMember ? <Crown size={140} /> : <Star size={140} />}
        </div>

        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic flex items-center gap-2 ${
                  isExpiringSoon ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                  isActive ? "bg-neon/10 text-neon border border-neon/20" :
                  isPending ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                  isExpired ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  "bg-white/5 text-white/40 border border-white/10"
                }`}>
                  {isActive && !isExpiringSoon && <Crown size={10} />}
                  {isExpiringSoon && <AlertCircle size={10} className="animate-pulse" />}
                  {isPending && <Clock size={10} className="animate-spin-slow" />}
                  {isExpired && <AlertCircle size={10} />}
                  
                  {isExpiringSoon ? "Expiring Soon" : 
                   isActive ? "Member Active" : 
                   isPending ? "Verification Pending" : 
                   isExpired ? "Membership Expired" : 
                   "Standard Access"}
                </div>
              </div>
              <div className="space-y-1">
                {isCompact ? (
                  <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter leading-tight">
                    {isMember ? "PADELGO" : "GUEST"} <span className={isActive ? "text-neon" : "text-white/40"}>{isMember ? "ELITE" : "PLAYER"}</span>
                  </h2>
                ) : (
                  <>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Member Profile</p>
                    <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">
                      {isMember ? "PADELGO" : "GUEST"} <span className={isActive ? "text-neon drop-shadow-[0_0_10px_rgba(215,255,63,0.2)]" : "text-white/40"}>{isMember ? "ELITE" : "PLAYER"}</span>
                    </h2>
                  </>
                )}
              </div>
            </div>

            {isActive && expiresAt && (
              <div className={isCompact ? "flex flex-col items-start md:items-end" : "md:text-right"}>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Status Valid Until</p>
                <p className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-black italic uppercase tracking-widest ${isExpiringSoon ? "text-amber-500" : "text-white"}`}>
                  {new Date(expiresAt).toLocaleDateString("en-US", { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {isExpiringSoon && (
                  <motion.p 
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-[8px] font-black text-amber-500 uppercase tracking-widest italic mt-1"
                  >
                    Expires in {daysRemaining} days
                  </motion.p>
                )}
              </div>
            )}
          </div>

          {/* Status Message & Benefits */}
          <div className={`${isCompact ? 'flex flex-col' : 'grid md:grid-cols-[1fr_auto] items-end'} gap-6`}>
            <div className={`space-y-4 ${isCompact ? 'max-w-none text-center md:text-left' : 'max-w-lg'}`}>
              <p className="text-white/40 text-[11px] md:text-xs font-medium italic leading-relaxed">
                {isCompact ? (
                  isActive ? "Priority booking and member pricing enabled." :
                  isExpiringSoon ? "Elite access active. Renew soon to avoid interruption." :
                  isPending ? "Verification in progress for elite access." :
                  isExpired ? "Premium membership ended. Reactivate access." :
                  "Unlock elite member benefits."
                ) : (
                  isExpiringSoon ? "Your premium access is about to end. Renew now to keep your elite booking priority and special pricing." :
                  isActive ? "Premium booking privileges enabled. You have full access to elite member rates and priority H-14 reservation window." :
                  isPending ? "Our team is currently verifying your payment proof. You will receive elite access once the verification is complete." :
                  isExpired ? "Your premium membership has ended. Reactivate your access to continue enjoying exclusive member rates." :
                  "Unlock the full PadelGO experience with elite booking priority, member-only rates, and exclusive athletic perks."
                )}
              </p>
              {isActive && (
                <div className={`flex flex-wrap gap-2 ${isCompact ? 'justify-center md:justify-start' : 'pt-2'}`}>
                   <StatusBenefit icon={<ShieldCheck size={isCompact ? 10 : 12} />} label="H-14 Priority" isCompact={isCompact} />
                   <StatusBenefit icon={<Clock size={isCompact ? 10 : 12} />} label="Instant Booking" isCompact={isCompact} />
                   <StatusBenefit icon={<CheckCircle2 size={isCompact ? 10 : 12} />} label="10% Discount" isCompact={isCompact} />
                </div>
              )}
            </div>

            {/* Action Buttons - Precise Luxury Scale */}
            <div className={`flex flex-wrap items-center gap-3 ${isCompact ? 'justify-center md:justify-start' : ''}`}>
              {isActive ? (
                <>
                  <Link href="/membership/payment" className="w-full sm:w-auto">
                    <Button className={`${isCompact ? 'h-10 px-6 text-[9px]' : 'h-11 px-8 text-[10px]'} font-black italic uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg ${
                      isExpiringSoon 
                        ? "bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/10" 
                        : "bg-white text-black hover:bg-neon hover:scale-[1.02] shadow-white/5"
                    }`}>
                      {isExpiringSoon ? "Renew Now" : "Renew Status"} <ArrowRight size={isCompact ? 12 : 14} className="ml-2" />
                    </Button>
                  </Link>
                  <Link href="/membership" className="w-full sm:w-auto">
                    <button className={`${isCompact ? 'h-10 px-5 text-[8px]' : 'h-11 px-6 text-[9px]'} font-black text-white/40 hover:text-white uppercase tracking-[0.3em] italic border border-white/5 hover:border-white/20 hover:bg-white/5 rounded-xl transition-all`}>
                      Benefits
                    </button>
                  </Link>
                </>
              ) : isPending ? (
                <div className={`${isCompact ? 'h-10 px-6' : 'h-11 px-8'} flex items-center bg-white/[0.03] text-white/30 border border-white/5 text-[9px] font-black italic uppercase tracking-[0.2em] rounded-xl`}>
                  Verification in Progress
                </div>
              ) : isExpired ? (
                <Link href="/membership/payment" className="w-full sm:w-auto">
                  <Button className={`${isCompact ? 'h-10 px-6 text-[9px]' : 'h-11 px-8 text-[10px]'} bg-neon text-black font-black italic uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] shadow-lg shadow-neon/10`}>
                    Renew Membership <ArrowRight size={isCompact ? 12 : 14} className="ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href="/membership" className="w-full sm:w-auto">
                  <Button className={`${isCompact ? 'h-10 px-6 text-[9px]' : 'h-11 px-8 text-[10px]'} bg-neon text-black font-black italic uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] shadow-lg shadow-neon/10`}>
                    Upgrade to Member <ArrowRight size={isCompact ? 12 : 14} className="ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </motion.div>
  );
}

function StatusBenefit({ icon, label, isCompact }: { icon: React.ReactNode, label: string, isCompact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 group/item ${isCompact ? 'px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5' : ''}`}>
      <div className={`${isCompact ? 'text-neon' : 'w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/20'} group-hover/item:text-neon group-hover/item:border-neon/30 transition-all duration-500`}>
        {icon}
      </div>
      <p className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} font-black text-white/40 uppercase tracking-tight italic group-hover/item:text-white transition-colors`}>{label}</p>
    </div>
  );
}
