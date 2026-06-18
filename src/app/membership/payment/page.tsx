"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { 
  CreditCard, Wallet, Landmark, 
  ArrowRight, ShieldCheck, CheckCircle2, 
  Info, Sparkles, Receipt, QrCode
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function MembershipPaymentPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-8 h-8 border-4 border-neon/10 border-t-neon rounded-full animate-spin"></div>
      </div>
    );
  }

  const isRenewal = (session?.user as any)?.membershipStatus === "ACTIVE";
  const membershipFee = 150000; // Contoh harga membership

  return (
    <div className="flex-1 min-h-screen pt-32 pb-32 px-6 relative overflow-hidden bg-[#050505]">
      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-neon/5 blur-[150px]"></div>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl mx-auto space-y-12 relative z-10"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest italic">
            <ShieldCheck size={12} className="text-neon" /> {isRenewal ? "Membership Continuity" : "Secure Checkout"}
          </div>
          <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">
            {isRenewal ? "Renew Your" : "Activate"} <span className="text-neon">{isRenewal ? "Access" : "Membership"}</span>
          </h1>
          <p className="text-white/30 text-sm font-medium italic max-w-xl mx-auto leading-relaxed">
            {isRenewal 
              ? "Lanjutkan akses prioritas dan harga eksklusif Anda di PadelGO dengan melakukan perpanjangan membership." 
              : "Anda selangkah lagi untuk mendapatkan akses prioritas dan harga eksklusif di PadelGO."}
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr_350px] gap-8 items-start">
          <div className="space-y-8">
            {/* Payment Options Card */}
            <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl">
              <div className="p-10 space-y-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-white italic uppercase tracking-widest">Metode Pembayaran</h2>
                  <div className="flex gap-2">
                    <div className="w-8 h-5 rounded bg-white/10 border border-white/10"></div>
                    <div className="w-8 h-5 rounded bg-white/10 border border-white/10"></div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* QRIS Option */}
                  <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-neon/10 flex items-center justify-center text-neon">
                        <QrCode size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-white text-sm uppercase italic">QRIS / E-Wallet</h3>
                        <p className="text-[10px] font-bold text-white/30 uppercase">GoPay, OVO, ShopeePay, Dana</p>
                      </div>
                      <div className="ml-auto">
                        <div className="px-3 py-1 rounded-full bg-neon/20 border border-neon/20 text-[9px] font-black text-neon uppercase italic">Recommended</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-6 p-6 bg-white rounded-3xl">
                      <div className="w-48 h-48 bg-white flex items-center justify-center border-2 border-black/5 rounded-2xl">
                         {/* Placeholder for QR Code */}
                         <div className="text-black/20 text-center space-y-2">
                           <QrCode size={80} strokeWidth={1} className="mx-auto" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Scan QR Code</p>
                         </div>
                      </div>
                      <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">PadelGO - Membership System</p>
                    </div>
                  </div>

                  {/* Bank Transfer Option */}
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
                      <Landmark size={24} />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-black text-white text-sm uppercase italic">Bank Transfer</h3>
                      <p className="text-[10px] font-bold text-white/30 uppercase italic">BCA: 8830123XXX a.n PadelGO Elite</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-neon/5 border border-neon/10 flex items-start gap-4">
                  <Info size={18} className="text-neon mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white italic uppercase">Instruksi Pembayaran</p>
                    <p className="text-[10px] font-medium text-white/40 leading-relaxed italic">
                      Lakukan pembayaran sebesar nominal yang tertera. Simpan bukti transfer atau screenshot pembayaran untuk diunggah pada tahap berikutnya.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-8">
            {/* Order Summary Card */}
            <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-3xl sticky top-32">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Summary</p>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Order <span className="text-neon">Total</span></h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-white/40 uppercase italic">{isRenewal ? "Membership Extension" : "Membership"} (30 Days)</span>
                  <span className="font-black text-white italic">Rp {membershipFee.toLocaleString()}</span>
                </div>
                <div className="h-[1px] bg-white/5"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-white uppercase italic tracking-widest">Total</span>
                  <span className="text-2xl font-black text-neon italic">Rp {membershipFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic text-center leading-relaxed">
                  By clicking below, you agree to PadelGO Membership terms & conditions.
                </p>
                <Link href="/membership/upload">
                  <Button size="full" className="h-16 font-black italic uppercase tracking-[0.2em] group shadow-[0_15px_35_rgba(215,255,63,0.3)]">
                    {isRenewal ? "Confirm Renewal" : "Lanjut Ke Verifikasi"} <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/membership">
                  <button className="w-full text-[10px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-white transition-colors">
                    Back to Selection
                  </button>
                </Link>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-neon/10 flex items-center justify-center text-neon">
                    <Sparkles size={16} />
                  </div>
                  <p className="text-[10px] font-black text-white/60 uppercase italic">Member Pricing Applied Soon</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-neon/10 flex items-center justify-center text-neon">
                    <CheckCircle2 size={16} />
                  </div>
                  <p className="text-[10px] font-black text-white/60 uppercase italic">Priority Access Unlocked</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}
