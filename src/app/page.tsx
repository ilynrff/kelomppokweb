"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { fetchJson } from "@/lib/fetchJson";

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    ),
    title: "Tanpa Double Booking",
    desc: "Sistem otomatis mengunci slot yang sudah dipesan. Tidak ada lagi tabrakan jadwal atau konfirmasi manual.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    ),
    title: "Booking Super Cepat",
    desc: "Pilih lapangan, tanggal, dan jam dalam hitungan detik. Tidak perlu telepon, tidak perlu chat.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
    ),
    title: "Mobile Friendly",
    desc: "Dirancang mobile-first. Nyaman dipakai dari HP saat di lapangan, di jalan, atau di mana saja.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    ),
    title: "Jadwal Real-Time",
    desc: "Ketersediaan slot selalu update secara langsung. Kamu tahu persis jam mana yang masih kosong.",
    color: "bg-amber-100 text-amber-600",
  },
];

export default function Home() {
  const [courts, setCourts] = useState<
    { id: string; name: string; location: string; pricePerHour: number; image?: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson<{ id: string; name: string; location: string; pricePerHour: number; image?: string | null }[]>("/api/courts")
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Invalid response");
        setCourts(data);
      })
      .catch((err) => {
        console.error("Error fetching courts Home:", err);
        setCourts([]);
        setError("Gagal memuat data lapangan. Pastikan backend & database sudah siap.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">

      {/* ===================== */}
      {/* HERO — Video Background */}
      {/* ===================== */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          poster="/images/hero-padel.jpg"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-slate-900/75 via-slate-900/55 to-slate-900/85"></div>

        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center flex flex-col items-center py-24">
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-400/30 bg-blue-500/20 backdrop-blur-md text-sm text-blue-200 font-bold mb-8">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-400"></span>
            </span>
            PadelGo is Live in Semarang
          </div>

          <div className="hero-line1 text-5xl md:text-8xl font-black tracking-tighter leading-[1.1] text-white drop-shadow-lg">
            Book your court.
          </div>
          <div className="hero-line2 text-5xl md:text-8xl font-black tracking-tighter leading-[1.1] mb-8 gradient-text drop-shadow-lg pb-2">
            Play your game.
          </div>

          <p className="hero-subtitle text-lg md:text-xl text-slate-300 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            Platform booking lapangan padel paling simpel. Cek jadwal, pilih jam, langsung main. Tanpa ribet, tanpa telepon.
          </p>

          <div className="hero-cta flex items-center justify-center w-full sm:w-auto">
            <Link href="/booking" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto text-lg font-bold text-white bg-blue-600 px-10 py-4 rounded-2xl transition-all duration-300 hover:bg-blue-500 hover:scale-105 hover:shadow-[0_12px_40px_-4px_rgba(59,130,246,0.7)] active:scale-95 shadow-[0_8px_30px_-4px_rgba(59,130,246,0.5)]">
                Book Now →
              </button>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 hero-cta">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2.5 bg-white/50 rounded-full animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* COURTS LIST */}
      {/* ===================== */}
      <section className="py-20 bg-white" id="facilities">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Fasilitas Premium</h2>
            <p className="text-slate-500 font-medium">Nikmati pengalaman bermain di lapangan padel berstandar internasional di Semarang.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {error && (
              <div className="col-span-full p-4 bg-red-50 border border-red-200 rounded-2xl text-sm font-bold text-red-700">
                {error}
              </div>
            )}
            {loading ? (
              Array.from({length: 3}).map((_, i) => (
                <div key={i} className="h-96 rounded-[2rem] bg-slate-100 animate-pulse border border-slate-100"></div>
              ))
            ) : (
              courts.map((court) => (
                <div key={court.id} className="group flex flex-col bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <div className="h-52 w-full relative overflow-hidden">
                    <img 
                      src={court.image || "/images/court-1.jpg"} 
                      alt={court.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white text-xs font-bold bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg">
                      {court.location}
                    </div>
                  </div>
                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {court.name}
                    </h3>
                    <p className="text-slate-500 font-medium text-sm mb-6 flex-1 leading-relaxed">
                      Booking lapangan ini langsung dari aplikasi.
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <span className="text-lg font-extrabold text-slate-900">
                        Rp {Number(court.pricePerHour || 0).toLocaleString('id-ID')}{" "}
                        <span className="text-sm text-slate-400 font-medium">/ jam</span>
                      </span>
                      <Link href={`/booking?courtId=${court.id}`}>
                        <Button size="sm" variant="secondary">Cek Jadwal</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
            {!loading && courts.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-400 font-bold">Belum ada data lapangan tersedia.</div>
            )}
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* CARA BOOKING */}
      {/* ===================== */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Cara Booking</h2>
          <p className="text-slate-500 font-medium mb-16">3 langkah mudah, langsung main.</p>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: "1", title: "Pilih Lapangan", desc: "Lihat fasilitas dan harga masing-masing court." },
              { step: "2", title: "Pilih Jadwal", desc: "Tentukan tanggal dan jam sesuai ketersediaan." },
              { step: "3", title: "Konfirmasi & Bayar", desc: "Selesaikan pembayaran, jadwalmu otomatis terkunci." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl mb-5 shadow-inner">{item.step}</div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* KEUNGGULAN / FEATURES */}
      {/* ===================== */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-full mb-4">Kenapa PadelGo?</span>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Lebih Cepat, Lebih Mudah</h2>
            <p className="text-slate-500 font-medium max-w-xl mx-auto">Kami hadir untuk menggantikan cara lama booking lewat WA yang ribet dan rawan double booking.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="group bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-[2rem] p-8 flex flex-col gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${f.color} transition-transform duration-300 group-hover:scale-110`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-black text-slate-900">{f.title}</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* CTA SECTION PENUTUP  */}
      {/* ===================== */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
        {/* Dekorasi background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-700/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight tracking-tight">
            Siap main padel hari ini?
          </h2>
          <p className="text-blue-100 font-medium text-lg mb-10 leading-relaxed">
            Jangan sampai kehabisan lapangan favorit kamu. Booking sekarang dan amankan jadwalmu dalam 30 detik.
          </p>
          <Link href="/booking">
            <button className="bg-white text-blue-700 font-black text-lg px-12 py-5 rounded-2xl transition-all duration-300 hover:bg-blue-50 hover:scale-105 hover:shadow-[0_16px_50px_-8px_rgba(0,0,0,0.25)] active:scale-95 shadow-xl">
              Booking Sekarang →
            </button>
          </Link>
        </div>
      </section>

      {/* ===================== */}
      {/* FOOTER LENGKAP        */}
      {/* ===================== */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand */}
          <div className="md:col-span-1">
            <span className="font-extrabold text-2xl tracking-tight text-white block mb-3">
              Padel<span className="text-blue-500">Go</span>
            </span>
            <p className="text-sm leading-relaxed text-slate-400">
              Platform booking lapangan padel #1 di Semarang. Cepat, mudah, dan terpercaya.
            </p>
          </div>

          {/* Menu */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-5">Menu</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Beranda</Link></li>
              <li><Link href="/booking" className="hover:text-white transition-colors">Booking Lapangan</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Login / Daftar</Link></li>
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-5">Kontak</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span>Jl. Padel Raya No. 12,<br />Banyumanik, Semarang 50268</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                <span>+62 812-3456-7890</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <span>hello@padelgo.id</span>
              </li>
            </ul>
          </div>

          {/* Sosmed */}
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-widest mb-5">Ikuti Kami</h4>
            <div className="flex flex-col gap-3">
              {[
                { name: "Instagram", handle: "@padelgo.semarang", href: "#" },
                { name: "TikTok", handle: "@padelgo.id", href: "#" },
                { name: "WhatsApp", handle: "Chat Admin", href: "#" },
              ].map((s) => (
                <a key={s.name} href={s.href} className="flex items-center gap-3 group">
                  <span className="text-xs font-bold text-slate-500 group-hover:text-white transition-colors w-20">{s.name}</span>
                  <span className="text-xs text-blue-400 group-hover:text-blue-300 transition-colors font-bold">{s.handle}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-500">© 2026 PadelGo Semarang. All rights reserved.</p>
            <p className="text-xs text-slate-600">Jadikan setiap rally tak terlupakan. 🎾</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
