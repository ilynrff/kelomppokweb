"use client";

import { useSession } from "next-auth/react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { 
  Crown, Zap, Star, ArrowRight, ShieldCheck, 
  Trophy, Rocket, Sparkles, Clock, Percent, 
  CalendarDays, Activity, Users, MapPin, 
  Gem, CheckCircle2, RefreshCw 
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";

export default function UpgradeMemberPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isToastOpen, setIsToastOpen] = useState(false);

  // Card Parallax Effect
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), { stiffness: 100, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), { stiffness: 100, damping: 20 });

  function handleMouseMove(event: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const handleConfirmUpgrade = async () => {
    setIsUpgrading(true);
    setError("");
    setSuccess("");
    
    try {
      const res = await fetch("/api/user/upgrade", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal melakukan upgrade.");

      setSuccess("Selamat! Anda kini resmi menjadi MEMBER PadelGO.");
      setIsToastOpen(true);
      
      if (update) await update({ membership: "MEMBER" });
      
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setIsToastOpen(true);
    } finally {
      setIsUpgrading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-8 h-8 border-4 border-neon/10 border-t-neon rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAlreadyMember = (session.user as any).membership === "MEMBER";

  const revealVariants = {
    hidden: { opacity: 0, filter: "blur(20px)", y: 30 },
    visible: { 
      opacity: 1, 
      filter: "blur(0px)", 
      y: 0, 
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  return (
    <div className="flex-1 min-h-screen pt-32 pb-32 px-6 relative overflow-hidden bg-[#050505] selection:bg-neon selection:text-black">
      {/* Background Cinematic Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-gradient-to-b from-neon/10 via-transparent to-transparent blur-[150px] opacity-40"></div>
        <div className="absolute -bottom-40 -left-20 w-[600px] h-[600px] bg-neon/5 blur-[120px] rounded-full"></div>
        {/* Subtle grid lines - Court Inspired */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>
      </div>

      <Toast 
        isOpen={isToastOpen} 
        message={error || success} 
        type={error ? "error" : "success"} 
        onClose={() => setIsToastOpen(false)} 
      />

      {/* 1. HERO SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center space-y-12 mb-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={revealVariants}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <Gem size={14} className="text-neon" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60">PadelGO Elite Access</span>
          </div>
          
          <h1 className="text-7xl md:text-[11rem] font-black text-white italic uppercase tracking-tighter leading-[0.8] drop-shadow-2xl">
            PLAY WITH <br />
            <span className="text-neon drop-shadow-[0_0_50px_rgba(215,255,63,0.3)]">PRIORITY.</span>
          </h1>
          
          <p className="text-white/40 font-medium text-lg md:text-xl italic max-w-2xl mx-auto leading-relaxed">
            Exclusive booking privileges, member pricing, and premium court access designed for serious players.
          </p>

          {!isAlreadyMember && (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="pt-6"
            >
              <Button 
                onClick={handleConfirmUpgrade}
                className="h-16 px-12 bg-white text-black font-black italic uppercase tracking-[0.3em] rounded-2xl hover:bg-neon transition-colors duration-500"
              >
                Become a Member
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* 2. PREMIUM MEMBERSHIP VISUAL CENTERPIECE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
          whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="perspective-1000 pt-10"
        >
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY }}
            className="relative w-[340px] h-[480px] md:w-[420px] md:h-[260px] rounded-[2rem] overflow-hidden group cursor-pointer"
          >
            {/* Card Background - Glassmorphism */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl"></div>
            
            {/* Glossy Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            {/* Card Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Identity</p>
                  <p className="text-xl font-black text-white italic uppercase tracking-wider">PadelGO Member</p>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-neon/50 flex items-center justify-center text-neon">
                  <Crown size={24} />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-2xl font-black text-white uppercase italic tracking-tight">{session.user.name}</p>
                </div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-neon animate-pulse"></div>
                      <p className="text-xs font-black text-neon uppercase tracking-widest italic">Active Member</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Member Since</p>
                    <p className="text-xs font-bold text-white/40 italic">2026</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Moving Glow Line */}
            <div className="absolute -bottom-full -right-full w-full h-full bg-neon/10 blur-[80px] group-hover:bottom-0 group-hover:right-0 transition-all duration-1000 ease-out"></div>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. MODULAR PREMIUM FEATURE BLOCKS */}
      <section className="relative z-10 max-w-7xl mx-auto mb-40">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          <FeatureBlock 
            icon={<Zap size={24} />} 
            title="Priority Booking" 
            desc="Book courts up to 14 days before public access" 
          />
          <FeatureBlock 
            icon={<Percent size={24} />} 
            title="Exclusive Pricing" 
            desc="Special member-only rates for every court booking" 
          />
          <FeatureBlock 
            icon={<RefreshCw size={24} />} 
            title="Flexible Reschedule" 
            desc="More freedom for managing your training sessions" 
          />
          <FeatureBlock 
            icon={<Users size={24} />} 
            title="Member Priority" 
            desc="Instant confirmation and priority queue placement" 
          />
        </motion.div>
      </section>

      {/* 4. MAIN COMPARISON - MEMBER DOMINANCE */}
      <section className="relative z-10 max-w-6xl mx-auto mb-40 space-y-16">
        <div className="text-center">
          <p className="text-[10px] font-black text-neon uppercase tracking-[0.6em] italic mb-2">Choose Your Access</p>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Membership Tiers</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-stretch">
          {/* BASIC CARD - Refined Minimalist */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col h-full bg-white/[0.02] border border-white/10 rounded-[3rem] p-12 space-y-10 relative group"
          >
            <div className="space-y-4">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Essential Player</p>
              <h3 className="text-4xl font-black text-white/40 italic uppercase tracking-tight">Basic</h3>
            </div>

            <div className="flex-grow space-y-6">
              <TierBenefit text="H-7 Booking Window" />
              <TierBenefit text="Standard Pricing" />
              <TierBenefit text="Manual Verification" />
              <TierBenefit text="24h Reschedule Limit" />
            </div>

            <div className="pt-10">
              <div className="text-sm font-black text-white/20 italic uppercase tracking-widest text-center border border-white/5 py-4 rounded-2xl">
                Current Access
              </div>
            </div>
          </motion.div>

          {/* MEMBER CARD - Visual Excellence */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col h-full bg-neon/[0.02] border border-neon/30 rounded-[3rem] p-12 space-y-10 relative overflow-hidden group shadow-[0_0_80px_rgba(215,255,63,0.05)]"
          >
            {/* Subtle Gradient Glow */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-neon/10 to-transparent opacity-30"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-neon uppercase tracking-[0.4em]">Premium Access</p>
                <h3 className="text-4xl font-black text-white italic uppercase tracking-tight">Member</h3>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-neon text-black text-[10px] font-black uppercase tracking-widest italic animate-pulse">
                Best Value
              </div>
            </div>

            <div className="relative z-10 flex-grow space-y-6">
              <TierBenefit text="H-14 Priority Booking Window" active />
              <TierBenefit text="10% Discount on All Sessiions" active />
              <TierBenefit text="Instant Confirmation" active />
              <TierBenefit text="Flexible 48h Reschedule" active />
              <TierBenefit text="Priority Match Queue" active />
              <TierBenefit text="Exclusive Event Access" active />
            </div>

            <div className="relative z-10 pt-10">
              {isAlreadyMember ? (
                <div className="text-sm font-black text-neon italic uppercase tracking-widest text-center border border-neon/20 py-5 rounded-2xl bg-neon/5">
                  Membership Active
                </div>
              ) : (
                <Button 
                  onClick={handleConfirmUpgrade}
                  isLoading={isUpgrading}
                  className="w-full h-20 bg-neon text-black font-black italic uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(215,255,63,0.4)]"
                >
                  Activate Now
                </Button>
              )}
            </div>
            
            {/* Luxurious Inner Glow Pulse */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-neon/5 blur-[100px] rounded-full"></div>
          </motion.div>
        </div>
      </section>

      {/* 6. MEMBER EXPERIENCE SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto mb-40">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="space-y-16"
        >
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">The Member Experience</h2>
            <p className="text-white/30 text-sm font-medium italic">Join a complete ecosystem designed to elevate your game every single day.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <ExperienceCard icon={<CheckCircle2 size={20} />} title="Fast Check-In" />
            <ExperienceCard icon={<CalendarDays size={20} />} title="Weekend Priority" />
            <ExperienceCard icon={<Activity size={20} />} title="Match Tracking" />
            <ExperienceCard icon={<MapPin size={20} />} title="Premium Courts" />
            <ExperienceCard icon={<Users size={20} />} title="Member Events" />
            <ExperienceCard icon={<Sparkles size={20} />} title="Exclusive Sessions" />
          </div>
        </motion.div>
      </section>

      {/* 7. SOCIAL PROOF */}
      <section className="relative z-10 max-w-7xl mx-auto mb-40">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex -space-x-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-[#050505] bg-white/5 flex items-center justify-center">
                <User size={20} className="text-white/20" />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-[#050505] bg-neon flex items-center justify-center text-[10px] font-black text-black">
              +500
            </div>
          </div>
          <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em] italic">
            500+ Active Members <span className="mx-2 text-white/10">|</span> Most active players upgrade within their first month
          </p>
        </div>
      </section>

      {/* 8. FINAL CTA SECTION */}
      <section className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative p-20 md:p-32 rounded-[4rem] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 text-center space-y-12 overflow-hidden group"
        >
          {/* Background Atmospheric Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-neon/[0.02] blur-[150px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <h2 className="text-4xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-tight drop-shadow-2xl">
              READY TO PLAY AT A <br />
              <span className="text-neon">HIGHER LEVEL?</span>
            </h2>
            <p className="text-white/30 text-lg md:text-xl font-medium italic">
              Unlock priority access, premium pricing, and a better booking experience.
            </p>
          </div>

          <div className="flex flex-col items-center gap-8 relative z-10">
            {isAlreadyMember ? (
              <div className="px-16 py-8 rounded-3xl bg-white/5 border border-white/10 text-white/40 font-black italic uppercase tracking-widest text-sm">
                Elite Status Active
              </div>
            ) : (
              <Button 
                onClick={handleConfirmUpgrade}
                isLoading={isUpgrading}
                className="h-20 px-20 bg-white text-black text-base font-black italic uppercase tracking-[0.5em] rounded-2xl hover:bg-neon hover:scale-105 active:scale-95 shadow-[0_30px_60px_-15px_rgba(255,255,255,0.1)] transition-all duration-500"
              >
                Activate Membership
              </Button>
            )}
            
            <Link href="/profile" className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em] hover:text-white transition-colors">
              Return to Account Settings
            </Link>
          </div>
        </motion.div>
      </section>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-soft {
          animation: pulse-soft 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function FeatureBlock({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
      }}
      className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6 hover:bg-white/[0.04] transition-all duration-700 group"
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-neon/10 group-hover:text-neon transition-all duration-500">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-black text-white italic uppercase tracking-widest">{title}</h3>
        <p className="text-[10px] font-bold text-white/30 italic uppercase tracking-tighter leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function TierBenefit({ text, active }: { text: string, active?: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-neon shadow-[0_0_8px_#D7FF3F]' : 'bg-white/10'}`}></div>
      <p className={`text-xs font-bold italic tracking-tight ${active ? 'text-white' : 'text-white/30'}`}>{text}</p>
    </div>
  );
}

function ExperienceCard({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.05)" }}
      className="flex items-center gap-4 p-6 rounded-2xl bg-white/[0.01] border border-white/5 transition-all group"
    >
      <div className="text-white/20 group-hover:text-neon transition-colors">{icon}</div>
      <p className="text-[10px] font-black text-white/40 group-hover:text-white uppercase tracking-widest italic transition-colors">{title}</p>
    </motion.div>
  );
}

function User({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
