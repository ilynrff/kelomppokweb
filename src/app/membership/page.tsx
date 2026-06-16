"use client";

import { useSession } from "next-auth/react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { 
  Crown, Zap, Star, ArrowRight, 
  Trophy, Rocket, Sparkles, Clock, Percent, 
  CalendarDays, Activity, Users, MapPin, 
  Gem, CheckCircle2, RefreshCw 
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

export default function MembershipLandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

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

  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleActivateClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  const isAlreadyMember = (session?.user as any)?.membershipStatus === "ACTIVE";
  const isPending = (session?.user as any)?.membershipStatus === "PENDING";

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
      {/* Login Required Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-[3rem] p-10 text-center space-y-8 shadow-2xl"
            >
              <div className="w-20 h-20 bg-neon/10 rounded-full flex items-center justify-center mx-auto text-neon shadow-[0_0_40px_rgba(215,255,63,0.1)]">
                <Users size={32} />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Login Required</h3>
                <p className="text-white/40 font-medium text-sm italic leading-relaxed">
                  Please sign in first to activate your PadelGO Elite membership and unlock exclusive benefits.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/login?callbackUrl=/membership/payment" className="w-full">
                  <Button size="full" className="h-14 bg-white text-black font-black italic uppercase tracking-[0.2em] rounded-2xl hover:bg-neon transition-all">
                    Continue to Login
                  </Button>
                </Link>
                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic hover:text-white transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background Cinematic Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-gradient-to-b from-neon/10 via-transparent to-transparent blur-[150px] opacity-40"></div>
        <div className="absolute -bottom-40 -left-20 w-[600px] h-[600px] bg-neon/5 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-32 relative z-10"
      >
        {/* 1. HERO SECTION */}
        <section className="flex flex-col items-center text-center space-y-12">
          <motion.div variants={revealVariants} className="space-y-6">
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

            <div className="pt-6">
              {isAlreadyMember ? (
                <Link href="/dashboard">
                  <Button className="h-16 px-12 bg-neon/10 text-neon border border-neon/20 font-black italic uppercase tracking-[0.3em] rounded-2xl">
                    Member Dashboard
                  </Button>
                </Link>
              ) : isPending ? (
                <Link href="/membership/pending">
                  <Button className="h-16 px-12 bg-white/5 text-white/40 border border-white/10 font-black italic uppercase tracking-[0.3em] rounded-2xl">
                    Verification Pending
                  </Button>
                </Link>
              ) : (
                <Link href="/membership/payment" onClick={handleActivateClick}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="h-16 px-12 bg-white text-black font-black italic uppercase tracking-[0.3em] rounded-2xl hover:bg-neon transition-colors duration-500">
                      Activate Membership
                    </Button>
                  </motion.div>
                </Link>
              )}
            </div>
          </motion.div>

          {/* 2. PREMIUM MEMBERSHIP VISUAL CENTERPIECE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
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
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              
              <div className="absolute inset-0 p-8 flex flex-col justify-between text-left">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Identity</p>
                    <p className="text-xl font-black text-white italic uppercase tracking-wider">PadelGO Elite</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-neon/50 flex items-center justify-center text-neon">
                    <Crown size={24} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-2xl font-black text-white uppercase italic tracking-tight">
                      {session?.user?.name || "Premium Player"}
                    </p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Status</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isAlreadyMember ? 'bg-neon animate-pulse' : 'bg-white/20'}`}></div>
                        <p className={`text-xs font-black uppercase tracking-widest italic ${isAlreadyMember ? 'text-neon' : 'text-white/20'}`}>
                          {isAlreadyMember ? 'Active Member' : 'Standard Access'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-full -right-full w-full h-full bg-neon/10 blur-[80px] group-hover:bottom-0 group-hover:right-0 transition-all duration-1000 ease-out"></div>
            </motion.div>
          </motion.div>
        </section>

        {/* 3. MODULAR PREMIUM FEATURE BLOCKS */}
        <motion.section 
          variants={staggerContainer}
          whileInView="visible"
          initial="hidden"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          <FeatureBlock icon={<Zap size={24} />} title="Priority Booking" desc="Book courts up to 14 days before public access" />
          <FeatureBlock icon={<Percent size={24} />} title="Exclusive Pricing" desc="Special member-only rates for every court booking" />
          <FeatureBlock icon={<RefreshCw size={24} />} title="Flexible Reschedule" desc="More freedom for managing your training sessions" />
          <FeatureBlock icon={<Users size={24} />} title="Member Priority" desc="Instant confirmation and priority queue placement" />
        </motion.section>

        {/* 4. MAIN COMPARISON */}
        <section className="space-y-16">
          <div className="text-center">
            <p className="text-[10px] font-black text-neon uppercase tracking-[0.6em] italic mb-2">Experience The Difference</p>
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Membership Comparison</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-stretch max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col h-full bg-neon/[0.02] border border-neon/30 rounded-[3rem] p-12 space-y-10 relative overflow-hidden group shadow-[0_0_80px_rgba(215,255,63,0.05)]"
            >
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-neon/10 to-transparent opacity-30"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-neon uppercase tracking-[0.4em]">Premium Access</p>
                  <h3 className="text-4xl font-black text-white italic uppercase tracking-tight">Member</h3>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-neon text-black text-[10px] font-black uppercase tracking-widest italic animate-pulse">Best Value</div>
              </div>
              <div className="relative z-10 flex-grow space-y-6">
                <TierBenefit text="H-14 Priority Booking Window" active />
                <TierBenefit text="10% Discount on All Sessions" active />
                <TierBenefit text="Instant Confirmation" active />
                <TierBenefit text="Flexible 48h Reschedule" active />
                <TierBenefit text="Priority Match Queue" active />
              </div>
            </motion.div>
          </div>
        </section>

        {/* 5. MEMBER EXPERIENCE GRID */}
        <section className="space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">The Elite Ecosystem</h2>
            <p className="text-white/30 text-sm font-medium italic">Designed to elevate your game every single day.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <ExperienceCard icon={<CheckCircle2 size={20} />} title="Fast Check-In" />
            <ExperienceCard icon={<CalendarDays size={20} />} title="Weekend Priority" />
            <ExperienceCard icon={<Activity size={20} />} title="Match Tracking" />
            <ExperienceCard icon={<MapPin size={20} />} title="Premium Courts" />
            <ExperienceCard icon={<Users size={20} />} title="Member Events" />
            <ExperienceCard icon={<Sparkles size={20} />} title="Exclusive Sessions" />
          </div>
        </section>

        {/* 6. FINAL CTA */}
        <section className="relative py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-20 md:p-32 rounded-[4rem] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 text-center space-y-12 overflow-hidden group"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-neon/[0.02] blur-[150px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="max-w-3xl mx-auto space-y-6 relative z-10">
              <h2 className="text-4xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-tight">
                READY TO PLAY AT A <br /> <span className="text-neon">HIGHER LEVEL?</span>
              </h2>
              <p className="text-white/30 text-lg md:text-xl font-medium italic">Unlock priority access, premium pricing, and a better booking experience.</p>
            </div>
            <div className="flex flex-col items-center gap-8 relative z-10">
              {!isAlreadyMember && !isPending && (
                <Link href="/membership/payment" onClick={handleActivateClick}>
                  <Button className="h-20 px-20 bg-white text-black text-base font-black italic uppercase tracking-[0.5em] rounded-2xl hover:bg-neon hover:scale-105 active:scale-95 shadow-[0_30px_60px_-15px_rgba(255,255,255,0.1)] transition-all duration-500">
                    Activate Membership
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </section>
      </motion.div>

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

function FeatureBlock({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6 hover:bg-white/[0.04] transition-all duration-700 group text-left"
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-neon/10 group-hover:text-neon transition-all duration-500">{icon}</div>
      <div className="space-y-2">
        <h3 className="text-sm font-black text-white italic uppercase tracking-widest">{title}</h3>
        <p className="text-[10px] font-bold text-white/30 italic uppercase tracking-tighter leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function TierBenefit({ text, active }: { text: string, active?: boolean }) {
  return (
    <div className="flex items-center gap-4 text-left">
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-neon shadow-[0_0_8px_#D7FF3F]' : 'bg-white/10'}`}></div>
      <p className={`text-xs font-bold italic tracking-tight ${active ? 'text-white' : 'text-white/30'}`}>{text}</p>
    </div>
  );
}

function ExperienceCard({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.05)" }}
      className="flex items-center gap-4 p-6 rounded-2xl bg-white/[0.01] border border-white/5 transition-all group text-left"
    >
      <div className="text-white/20 group-hover:text-neon transition-colors">{icon}</div>
      <p className="text-[10px] font-black text-white/40 group-hover:text-white uppercase tracking-widest italic transition-colors">{title}</p>
    </motion.div>
  );
}
