"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { ShieldCheck, User, Phone, Crown, CheckCircle2, Star, Edit3, Lock, Save, ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import Link from "next/link";
import { MembershipStatusCard } from "@/components/profile/MembershipStatusCard";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();

  const expiresAt = (session?.user as any)?.membershipExpiresAt;
  const isExpired = expiresAt ? new Date() >= new Date(expiresAt) : false;
  const membershipStatus = isExpired ? "EXPIRED" : ((session?.user as any)?.membershipStatus || "FREE");
  const membershipType = isExpired ? "BASIC" : ((session?.user as any)?.membership || "BASIC");

  const [membership, setMembership] = useState<string | null>(null);
  
  // Profile Editing State
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState({ type: "success" as "success" | "error", text: "" });

  useEffect(() => {
    if (session?.user) {
      setMembership((session.user as any).membership);
      setName(session.user.name || "");
    }
  }, [session]);

  const validatePassword = (pass: string) => {
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    return pass.length >= 8 && hasLetter && hasNumber;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If changing password, validate
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setToastMsg({ type: "error", text: "Konfirmasi password baru tidak cocok." });
        setIsToastOpen(true);
        return;
      }
      if (!validatePassword(newPassword)) {
        setToastMsg({ type: "error", text: "Password baru harus min 8 karakter dengan huruf & angka." });
        setIsToastOpen(true);
        return;
      }
      if (!currentPassword) {
        setToastMsg({ type: "error", text: "Password saat ini wajib diisi untuk keamanan." });
        setIsToastOpen(true);
        return;
      }
    }

    setIsUpdating(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currentPassword, newPassword })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal update profil");

      setToastMsg({ type: "success", text: data.message });
      setIsToastOpen(true);
      
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Update session to reflect name change
      if (updateSession) await updateSession({ name });
    } catch (err: any) {
      setToastMsg({ type: "error", text: err.message });
      setIsToastOpen(true);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808] p-6">
        <div className="w-8 h-8 border-4 border-neon/30 border-t-neon rounded-full animate-spin"></div>
      </div>
    );
  }

  const isBasic = membership === "BASIC";

  return (
    <div className="flex-1 min-h-screen pt-32 pb-20 px-6 relative overflow-hidden bg-[#080808]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-neon/5 blur-[150px] rounded-full pointer-events-none"></div>
      
      <Toast 
        isOpen={isToastOpen} 
        message={toastMsg.text} 
        type={toastMsg.type} 
        onClose={() => setIsToastOpen(false)} 
      />

      <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
        
        {/* SECTION 1 — USER INFORMATION */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-white/[0.03] border border-white/5 p-8 rounded-[3rem] backdrop-blur-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-24 h-24 rounded-3xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon shadow-[0_0_20px_rgba(215,255,63,0.1)] relative z-10">
            <User size={48} />
          </div>
          <div className="text-center md:text-left space-y-3 relative z-10">
            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic leading-none">
              {session.user.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-white/40 font-bold text-xs uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <Phone size={14} className="text-neon" /> {(session.user as any).whatsapp}
              </div>
              <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-full ${isBasic ? 'bg-white/10 text-white/60' : 'bg-neon text-black shadow-[0_0_15px_rgba(215,255,63,0.3)]'}`}>
                {isBasic ? <Star size={12} /> : <Crown size={12} />}
                {membership}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_380px] gap-8 items-start">
          
          <div className="space-y-8">
            {/* SECTION 3 — ACCOUNT SETTINGS */}
            <Card className="p-8 space-y-10 bg-white/[0.02] border-white/5 rounded-[2.5rem]">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Security Center</p>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">
                  Account <span className="text-neon">Settings</span>
                </h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-10">
                {/* Edit Profile Sub-section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Edit3 size={18} className="text-neon" />
                    <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Edit Profile</h3>
                  </div>
                  <Input 
                    label="Nama Lengkap" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Masukkan nama lengkap Anda"
                  />
                </div>
                
                {/* Change Password Sub-section */}
                <div className="space-y-6 pt-10 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <KeyRound size={18} className="text-neon" />
                      <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Change Password</h3>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-neon transition-colors"
                    >
                      {showPasswords ? <EyeOff size={14} className="inline mr-1" /> : <Eye size={14} className="inline mr-1" />}
                      {showPasswords ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div className="grid gap-6">
                    <Input 
                      label="Current Password" 
                      type={showPasswords ? "text" : "password"}
                      placeholder="Current password for security"
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                    />
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Input 
                        label="New Password" 
                        type={showPasswords ? "text" : "password"}
                        placeholder="Min 8 chars"
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                      />
                      <Input 
                        label="Confirm New Password" 
                        type={showPasswords ? "text" : "password"}
                        placeholder="Must match"
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">
                      💡 Password must be at least 8 characters long, containing both letters and numbers.
                    </p>
                  </div>
                </div>

                <Button 
                  size="full" 
                  className="h-14 font-black italic uppercase tracking-[0.2em] gap-3 shadow-[0_10px_30px_-10px_rgba(215,255,63,0.3)]"
                  isLoading={isUpdating}
                >
                  <Save size={18} /> Update Account
                </Button>
              </form>
            </Card>
          </div>

          <div className="space-y-8">
            <MembershipStatusCard 
              status={membershipStatus}
              type={membershipType}
              expiresAt={(session?.user as any)?.membershipExpiresAt}
              userName={session?.user?.name || ""}
              isCompact
            />

            <div className="p-8 bg-white/[0.03] rounded-[2.5rem] border border-dashed border-white/10 flex items-center justify-center gap-4 group cursor-help transition-colors hover:border-neon/30">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-neon transition-colors">
                <Phone size={18} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Support</p>
                <p className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">WhatsApp Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BenefitItem({ icon, title, active }: { icon: React.ReactNode, title: string, active: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all ${active ? 'bg-neon/10 border border-neon/20' : 'bg-white/5 border border-white/5 opacity-40'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-neon/10 text-neon' : 'bg-white/5 text-white/20'}`}>
        {icon}
      </div>
      <h4 className={`font-black text-[11px] uppercase tracking-wider italic ${active ? 'text-white' : 'text-white/40'}`}>{title}</h4>
      {active && <CheckCircle2 size={14} className="ml-auto text-neon" />}
    </div>
  );
}
