"use client";

import { useSession } from "next-auth/react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { 
  Upload, Image as ImageIcon, CheckCircle2, 
  ArrowRight, ShieldCheck, X, FileText, 
  AlertCircle, CloudUpload, Loader2
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function MembershipUploadPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-8 h-8 border-4 border-neon/10 border-t-neon rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran file terlalu besar (maksimal 5MB)");
        return;
      }
      setSelectedFile(file);
      setError("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError("");

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("amount", "150000"); // Standard membership fee

      const res = await fetch("/api/membership/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal mengunggah bukti pembayaran.");

      // Success! Update session to reflect PENDING status
      if (updateSession) {
        await updateSession({
          membershipStatus: "PENDING"
        });
      }

      router.push("/membership/pending");
    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen pt-32 pb-32 px-6 relative overflow-hidden bg-[#050505]">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-neon/5 blur-[150px] opacity-20"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-12 relative z-10"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest italic">
            <CloudUpload size={12} className="text-neon" /> Proof Verification
          </div>
          <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">
            Submit <span className="text-neon">Proof</span>
          </h1>
          <p className="text-white/30 text-sm font-medium italic">
            Unggah bukti transfer atau screenshot pembayaran Anda untuk memulai proses verifikasi akun MEMBER.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-10 space-y-10 backdrop-blur-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ImageIcon size={100} />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white italic uppercase tracking-widest">Unggah Bukti</h2>
              <p className="text-[10px] font-bold text-white/30 uppercase italic">Mendukung format JPG, PNG, atau Screenshot (Max 5MB)</p>
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
            />

            {!selectedFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="h-64 rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/[0.01] hover:bg-white/[0.03] hover:border-neon/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-neon group-hover:scale-110 transition-all duration-500">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-white italic uppercase tracking-widest">Klik atau Tarik File</p>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Pilih gambar dari galeri Anda</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 group shadow-2xl">
                  {previewUrl && (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-3">
                    <FileText size={18} className="text-neon" />
                    <div className="flex-grow">
                      <p className="text-[10px] font-black text-white uppercase italic truncate">{selectedFile.name}</p>
                      <p className="text-[9px] font-bold text-white/40 uppercase">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <CheckCircle2 size={18} className="text-neon" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500"
              >
                <AlertCircle size={18} />
                <p className="text-xs font-bold italic">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4">
            <Link href="/membership/payment" className="flex-grow">
              <button className="w-full h-16 rounded-2xl border border-white/10 text-white/40 font-black italic uppercase tracking-[0.2em] hover:bg-white/5 transition-all">
                Kembali
              </button>
            </Link>
            <Button 
              className="flex-[2] h-16 font-black italic uppercase tracking-[0.2em] group shadow-[0_15px_35px_-10px_rgba(215,255,63,0.3)]"
              disabled={!selectedFile || isUploading}
              isLoading={isUploading}
              onClick={handleUpload}
            >
              Kirim Verifikasi <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-white/20">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <p className="text-[10px] font-black uppercase tracking-widest italic text-center">Data Enkripsi Aman</p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <p className="text-[10px] font-black uppercase tracking-widest italic text-center">Verifikasi 1x24 Jam</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
