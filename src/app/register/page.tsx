"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { logirent } from "@/lib/fonts";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const passwordStatus = useMemo(() => {
    if (!password) return null;
    const hasMinLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
<<<<<<< HEAD
    
=======

>>>>>>> 6d5150969f81fadde2548b25f1c4bc2a179ab9b3
    return {
      hasMinLength,
      hasLetter,
      hasNumber,
<<<<<<< HEAD
      isValid: hasMinLength && hasLetter && hasNumber
    };
  }, [password]);

  const isFormValid = name && whatsapp && passwordStatus?.isValid && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      if (password !== confirmPassword) setError("Password konfirmasi tidak cocok.");
=======
      isValid: hasMinLength && hasLetter && hasNumber,
    };
  }, [password]);

  const isFormValid =
    name && whatsapp && passwordStatus?.isValid && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      if (password !== confirmPassword)
        setError("Password konfirmasi tidak cocok.");
>>>>>>> 6d5150969f81fadde2548b25f1c4bc2a179ab9b3
      else setError("Lengkapi form dengan data yang valid.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat akun.");
      }

      router.push("/login?registered=true");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-screen bg-[#080808] relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neon/5 blur-[150px] rounded-full pointer-events-none"></div>
<<<<<<< HEAD
      
      <div className="w-full max-w-lg z-10 animate-fade-in py-12">
        {/* Minimal Header */}
        <div className="text-center mb-10">
          <Link href="/" className={`${logirent.className} inline-flex items-center gap-1 mb-8 hover:opacity-80 transition-opacity`}>
          </Link>
=======

      <div className="w-full max-w-lg z-10 animate-fade-in py-12">
        {/* Minimal Header */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className={`${logirent.className} inline-flex items-center gap-1 mb-8 hover:opacity-80 transition-opacity`}
          ></Link>
>>>>>>> 6d5150969f81fadde2548b25f1c4bc2a179ab9b3
          <h1 className="text-2xl font-black text-white tracking-tight mb-2 uppercase italic">
            Join the <span className="text-neon">League</span>
          </h1>
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
            Create your account to start booking courts.
          </p>
        </div>

        <Card className="p-8 md:p-12 border-white/[0.03] bg-white/[0.01] backdrop-blur-3xl rounded-[3rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <Input
                label="Full Name"
                placeholder="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="WhatsApp"
                type="tel"
                placeholder="ex: 0812xxxx"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-white transition-colors outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <Input
                label="Verify Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Subtle Password Rules */}
            {password && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.03]">
<<<<<<< HEAD
                <Rule label="8+ Characters" active={passwordStatus?.hasMinLength} />
                <Rule label="Includes Letters" active={passwordStatus?.hasLetter} />
                <Rule label="Includes Numbers" active={passwordStatus?.hasNumber} />
                <Rule label="Passwords Match" active={password === confirmPassword && !!password} />
=======
                <Rule
                  label="8+ Characters"
                  active={passwordStatus?.hasMinLength}
                />
                <Rule
                  label="Includes Letters"
                  active={passwordStatus?.hasLetter}
                />
                <Rule
                  label="Includes Numbers"
                  active={passwordStatus?.hasNumber}
                />
                <Rule
                  label="Passwords Match"
                  active={password === confirmPassword && !!password}
                />
>>>>>>> 6d5150969f81fadde2548b25f1c4bc2a179ab9b3
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl animate-shake">
<<<<<<< HEAD
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{error}</p>
=======
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
                  {error}
                </p>
>>>>>>> 6d5150969f81fadde2548b25f1c4bc2a179ab9b3
              </div>
            )}

            <Button
              type="submit"
              size="full"
              className="h-14 text-xs tracking-[0.3em] font-black uppercase italic rounded-2xl shadow-[0_10px_20px_-5px_rgba(215,255,63,0.2)]"
              isLoading={isLoading}
              disabled={!isFormValid || isLoading}
            >
              Register Account
            </Button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">
              Already have an account?
            </p>
            <Link
              href="/login"
              className="inline-block text-[11px] font-black text-neon uppercase tracking-widest hover:text-white transition-colors border border-neon/20 px-8 py-2.5 rounded-full hover:border-white/20"
            >
              Member Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

<<<<<<< HEAD
function Rule({ label, active }: { label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-2 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-20'}`}>
      <div className={`w-1 h-1 rounded-full ${active ? 'bg-neon shadow-[0_0_8px_#D7FF3F]' : 'bg-white'}`}></div>
=======
function Rule({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 transition-all duration-500 ${active ? "opacity-100" : "opacity-20"}`}
    >
      <div
        className={`w-1 h-1 rounded-full ${active ? "bg-neon shadow-[0_0_8px_#D7FF3F]" : "bg-white"}`}
      ></div>
>>>>>>> 6d5150969f81fadde2548b25f1c4bc2a179ab9b3
      <span className="text-[9px] font-bold uppercase tracking-wider text-white">
        {label}
      </span>
    </div>
  );
}
