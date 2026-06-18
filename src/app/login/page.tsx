"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Suspense, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Phone } from "lucide-react";
import { logirent } from "@/lib/fonts";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<{ main: string; hint?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsapp || !password) {
      setError({ main: "WhatsApp dan password wajib diisi." });
      return;
    }

    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      whatsapp,
      password,
      redirect: false,
    });

    console.log("DEBUG: Login result:", result);

    setIsLoading(false);
    
    if (!result || result.error) {
      setError({
        main: "Akses Ditolak",
        hint: "Nomor WhatsApp atau password tidak terdaftar.",
      });
      return;
    }

    const session = await getSession();
    if (session?.user?.role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-screen bg-[#080808] relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-neon/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-neon/5 blur-[150px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-md z-10 animate-fade-in">
        {/* Minimal Header */}
        <div className="text-center mb-10">
          <Link href="/" className={`${logirent.className} inline-flex items-center gap-1 mb-8 hover:opacity-80 transition-opacity`}>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2 uppercase italic">
            Member <span className="text-neon">Login</span>
          </h1>
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
            Enter your credentials to access the court.
          </p>
        </div>

        <Card className="p-8 md:p-10 border-white/[0.03] bg-white/[0.01] backdrop-blur-3xl rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="WhatsApp Number"
              type="text"
              placeholder="0812xxxx"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
            />
            
            <Input
              label="Secure Password"
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

            {error && (
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl animate-shake">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">{error.main}</p>
                <p className="text-[9px] text-red-400/60 font-bold uppercase tracking-tighter leading-tight">{error.hint}</p>
              </div>
            )}

            <Button
              type="submit"
              size="full"
              className="h-14 text-xs tracking-[0.3em] font-black uppercase italic rounded-2xl shadow-[0_10px_20px_-5px_rgba(215,255,63,0.2)]"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/[0.03] text-center">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">
              Don't have an account?
            </p>
            <Link
              href="/register"
              className="inline-block text-[11px] font-black text-neon uppercase tracking-widest hover:text-white transition-colors border border-neon/20 px-6 py-2 rounded-full hover:border-white/20"
            >
              Create Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white/50 bg-[#080808]">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
