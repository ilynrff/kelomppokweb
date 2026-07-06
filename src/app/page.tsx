"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { fetchJson } from "@/lib/fetchJson";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import ClubAmenities from "@/components/ClubAmenities";
import Footer from "@/components/Footer";

const FEATURES = [
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: "Tanpa Double Booking",
    desc: "Sistem otomatis mengunci slot yang sudah dipesan. Tidak ada lagi tabrakan jadwal atau konfirmasi manual.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: "Booking Super Cepat",
    desc: "Pilih lapangan, tanggal, dan jam dalam hitungan detik. Tidak perlu telepon, tidak perlu chat.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    title: "Mobile Friendly",
    desc: "Dirancang mobile-first. Nyaman dipakai dari HP saat di lapangan, di jalan, atau di mana saja.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Jadwal Real-Time",
    desc: "Ketersediaan slot selalu update secara langsung. Kamu tahu persis jam mana yang masih kosong.",
    color: "bg-amber-100 text-amber-600",
  },
];

function FacilityCarousel({ venues, loading }: { venues: any[]; loading: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalPrev = () => handlePrev();
    const handleGlobalNext = () => handleNext();
    
    const prevBtn = document.getElementById('facility-prev');
    const nextBtn = document.getElementById('facility-next');
    
    if (prevBtn) prevBtn.addEventListener('click', handleGlobalPrev);
    if (nextBtn) nextBtn.addEventListener('click', handleGlobalNext);
    
    return () => {
      if (prevBtn) prevBtn.removeEventListener('click', handleGlobalPrev);
      if (nextBtn) nextBtn.removeEventListener('click', handleGlobalNext);
    };
  }, [activeIndex]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const items = useMemo(() => {
    const fallbacks = [
      "https://images.unsplash.com/photo-1622228589094-1a3eb6ce28fb?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1554068865-c3ce14d12753?q=80&w=1400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1400&auto=format&fit=crop",
    ];
    const categories = ["PREMIUM COURT", "INDOOR ARENA", "SIGNATURE COURT"];

    if (!loading && venues && venues.length > 0) {
      return venues.map((v, i) => {
        const imageUrl = v.thumbnail || fallbacks[i % fallbacks.length];
        const raw = v.description || "";
        const desc = raw.length > 55 ? raw.substring(0, 55).trim() + "…" : raw || (v.location === "Indoor" ? "Designed for competitive modern play" : "Professional-grade open-air experience");
        return { id: v.id, category: categories[i % categories.length], title: v.name, desc, img: imageUrl };
      });
    }
    return [
      { id: "f1", category: "PREMIUM COURT", title: "Panoramic Court", desc: "Designed for competitive modern players", img: fallbacks[0] },
      { id: "f2", category: "INDOOR ARENA", title: "Match Arena", desc: "Professional-grade indoor atmosphere", img: fallbacks[1] },
      { id: "f3", category: "SIGNATURE COURT", title: "Open-Air Experience", desc: "Breathtaking outdoor social environment", img: fallbacks[2] },
    ];
  }, [venues, loading]);
  const handleNext = () => setActiveIndex((p) => p + 1);
  const handlePrev = () => setActiveIndex((p) => p - 1);
  const offsets = [-1, 0, 1, 2];

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startX;
    setDragOffset(deltaX);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    if (dragOffset < -100) handleNext();
    else if (dragOffset > 100) handlePrev();
    
    setIsDragging(false);
    setDragOffset(0);
  };

  if (loading) return <div className="w-full h-[480px] bg-white/5 rounded-[2rem] animate-pulse" />;

  return (
    <>
      {/* ── Image Lightbox Modal ── */}
      {modalImg && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-2xl"
          style={{ animation: "facilityFadeIn 0.4s ease-out" }}
          onClick={() => setModalImg(null)}
        >
          <div
            className="relative max-w-5xl w-full mx-6"
            style={{ animation: "facilityScaleIn 0.5s cubic-bezier(0.2, 1, 0.3, 1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={modalImg} className="w-full rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.9)] object-cover max-h-[85vh] border border-white/10" />
            <button
              onClick={() => setModalImg(null)}
              className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-neon hover:text-black transition-all hover:scale-110 shadow-2xl"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes facilityFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes facilityScaleIn { from { opacity:0; transform:scale(0.95); filter: blur(10px) } to { opacity:1; transform:scale(1); filter: blur(0) } }
      `}</style>

      {/* ── Carousel Outer Wrapper ── */}
      <div className="relative w-full overflow-visible group/carousel">
        {/* ── Carousel track ── */}
        <div
          ref={containerRef}
          className="relative w-full cursor-grab active:cursor-grabbing"
          style={{ height: 480 }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="absolute inset-0">
            {offsets.map((offset) => {
              const absIdx = activeIndex + offset;
              const itemIdx = ((absIdx % items.length) + items.length) % items.length;
              const item = items[itemIdx];
              const isActive = offset === 0;

              const styleMap = {
                [-1]: { tx: "-18%", scale: 0.82, opacity: 0.18, zIndex: 8 },
                [0]: { tx: "0%", scale: 1, opacity: 1, zIndex: 20 },
                [1]: { tx: "62%", scale: 0.88, opacity: 0.72, zIndex: 15 },
                [2]: { tx: "105%", scale: 0.8, opacity: 0.12, zIndex: 8 },
              };
              const { tx, scale, opacity, zIndex } = styleMap[offset] ?? { tx: "120%", scale: 0.7, opacity: 0, zIndex: 5 };

              return (
                <div
                  key={absIdx}
                  className="absolute top-0 w-[360px] md:w-[440px] h-[480px] rounded-[2.5rem] overflow-hidden shadow-[0_32px_80px_-20px_rgba(0,0,0,0.9)] pointer-events-none select-none"
                  style={{
                    transform: `translateX(${tx}) scale(${scale})`,
                    opacity: (isActive || offset === 1 || offset === -1) ? (isActive ? 1 : opacity) : 0,
                    zIndex,
                    transformOrigin: "left center",
                    transition: "transform 1s cubic-bezier(0.2, 1, 0.2, 1), opacity 0.8s ease",
                  }}
                >
                  {/* ── STABLE IMAGE WRAPPER ── */}
                  <div 
                    className="relative w-full h-full bg-[#111] overflow-hidden pointer-events-auto"
                    onClick={() => {
                      if (!isDragging && Math.abs(dragOffset) < 10) {
                        if (offset === 1) handleNext();
                        else if (isActive) setModalImg(item.img);
                      }
                    }}
                  >
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover block pointer-events-none"
                      draggable={false}
                    />
                    
                    {/* Subtle Readable Gradient (Bottom Only) */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                    {/* ── CONTENT OVERLAY ── */}
                    <div className="absolute inset-0 p-10 flex flex-col justify-between pointer-events-none">
                      {/* Top Badge */}
                      <div className={`transition-all duration-700 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
                        <span className="inline-block px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white uppercase tracking-[0.3em]">
                          {item.category}
                        </span>
                      </div>

                      {/* Bottom Info */}
                      <div className={`transition-all duration-700 delay-100 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                        <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-[0.9]">{item.title}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function FacilitiesSection({ venues, loading }: { venues: any[]; loading: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-32 relative overflow-hidden bg-[#0B0B0B] border-y border-white/5"
      id="facilities"
    >
      {/* Soft Background Glow */}
      <div
        className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[800px] bg-neon/5 blur-[150px] rounded-full pointer-events-none -z-10 transition-opacity duration-[2000ms]"
        style={{ opacity: isVisible ? 0.3 : 0 }}
      ></div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10 flex flex-col xl:flex-row gap-16 xl:gap-20 items-center xl:items-start">

        {/* LEFT SIDE: Content Anchor */}
        <div className="w-full xl:w-[450px] shrink-0 flex flex-col items-start text-left xl:-mt-8">
          {/* Upgraded Premium Badge */}
          <div
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 mb-10 backdrop-blur-xl shadow-[0_0_20px_rgba(215,255,63,0.1)] group transition-all duration-1000"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
              filter: isVisible ? "blur(0)" : "blur(8px)",
              transitionDelay: "0.1s"
            }}
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/90">
              Premium <span className="text-neon group-hover:drop-shadow-[0_0_8px_rgba(215,255,63,0.5)] transition-all">Facilities</span>
            </span>
          </div>

          <h2
            className="text-6xl md:text-7xl font-black text-white leading-[1.02] tracking-tighter mb-10 transition-all duration-1000"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
              filter: isVisible ? "blur(0)" : "blur(10px)",
              transitionDelay: "0.25s"
            }}
          >
            Elevate Your<br />
            <span className="text-neon drop-shadow-[0_0_20px_rgba(215,255,63,0.35)]">Game.</span>
          </h2>

          <p
            className="text-white/60 text-xl leading-relaxed mb-12 font-medium max-w-md xl:max-w-sm transition-all duration-1000"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
              filter: isVisible ? "blur(0)" : "blur(8px)",
              transitionDelay: "0.4s"
            }}
          >
            Experience padel at its finest. Our international standard courts and exclusive amenities are designed for the modern athlete who demands perfection.
          </p>

          <Link href="/booking">
            <div
              className="transition-all duration-1000"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                filter: isVisible ? "blur(0)" : "blur(6px)",
                transitionDelay: "0.55s"
              }}
            >
              <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-10 py-5 rounded-full font-bold text-[13px] tracking-[0.25em] uppercase transition-all duration-500 backdrop-blur-xl flex items-center gap-5 group shadow-xl hover:shadow-neon/10">
                Reserve Now
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-neon group-hover:text-black transition-all duration-500 group-hover:scale-110">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                    <line x1="5" y1="19" x2="19" y2="5"></line>
                    <polyline points="9 5 19 5 19 15"></polyline>
                  </svg>
                </div>
              </button>
            </div>
          </Link>
        </div>

        {/* RIGHT SIDE: Horizontal Showcase */}
        <div className="w-full xl:flex-1 relative flex flex-col md:block">
          <FacilityCarousel venues={venues} loading={loading} />
          
          {/* ── NAVIGATION CONTROLS (RESPONSIVE POSITIONING) ── */}
          <div
            className="md:absolute relative mt-12 md:mt-0 md:-bottom-2 md:right-6 flex justify-center md:justify-start gap-4 z-[200] transition-all duration-1000"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
              transitionDelay: "1s"
            }}
          >
            <button 
              id="facility-prev"
              className="w-14 h-14 rounded-full bg-black/60 border border-white/10 backdrop-blur-2xl flex items-center justify-center text-white transition-all duration-500 hover:bg-neon hover:text-black hover:border-neon hover:scale-110 shadow-2xl active:scale-95 group"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            </button>
            <button 
              id="facility-next"
              className="w-14 h-14 rounded-full bg-black/60 border border-white/10 backdrop-blur-2xl flex items-center justify-center text-white transition-all duration-500 hover:bg-neon hover:text-black hover:border-neon hover:scale-110 shadow-2xl active:scale-95 group"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const [venues, setVenues] = useState<
    {
      id: string;
      name: string;
      location: string;
      description?: string | null;
      thumbnail?: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson<
      {
        id: string;
        name: string;
        location: string;
        description?: string | null;
        thumbnail?: string | null;
      }[]
    >("/api/venues")
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Invalid response");
        setVenues(data);
      })
      .catch((err) => {
        console.error("Error fetching venues Home:", err);
        setVenues([]);
        setError(
          "Gagal memuat data venue. Pastikan backend & database sudah siap.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">

      {/* ===================== */}
      {/* HERO — Cinematic Video */}
      {/* ===================== */}
      <section className="relative min-h-[100svh] flex items-center justify-start overflow-hidden pt-20 pb-8">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-70"
          >
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>
          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B] via-[#0B0B0B]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-transparent to-transparent"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col justify-center h-full">

          <div className="max-w-2xl w-full relative">

            {/* Soft Cinematic Ambient Glow Behind Text */}
            <div className="absolute top-[40%] left-[20%] -translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-black/50 blur-[140px] rounded-full pointer-events-none -z-10"></div>
            <div className="absolute top-[40%] left-[20%] -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-neon/15 blur-[160px] rounded-full pointer-events-none -z-10"></div>

            {/* Live Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-transparent border border-white/10 mb-6 backdrop-blur-md animate-fade-in-up">
              <div className="relative flex items-center justify-center w-2 h-2">
                <span className="animate-[pulse_3s_ease-in-out_infinite] absolute inline-flex h-full w-full rounded-full bg-neon opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon shadow-[0_0_8px_#D7FF3F]"></span>
              </div>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.25em] text-white/75">
                PadelGo is Live in Semarang
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-sans font-medium leading-[1.08] tracking-tight text-white mb-4 text-6xl md:text-7xl lg:text-[80px] animate-cinematic-reveal">
              Play <span className="text-neon drop-shadow-[0_0_20px_rgba(215,255,63,0.3)]">Smarter.</span><br />
              Book <span className="text-neon drop-shadow-[0_0_20px_rgba(215,255,63,0.3)]">Faster.</span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base md:text-lg font-normal leading-relaxed mb-8 text-white/70 max-w-lg animate-cinematic-reveal-soft [animation-delay:200ms]">
              Experience the first premium padel booking platform in Semarang. Real-time availability. Instant confirmation. Zero friction.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up [animation-delay:400ms]">
              <Link href="/booking" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-neon hover:bg-neon-hover text-black pl-8 pr-3 h-[56px] rounded-full font-bold text-[14px] transition-all duration-300 flex items-center justify-between gap-8 group shadow-[0_0_30px_rgba(215,255,63,0.2)] hover:shadow-[0_0_40px_rgba(215,255,63,0.4)]">
                  Book A Court
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neon">
                      <line x1="5" y1="19" x2="19" y2="5"></line>
                      <polyline points="9 5 19 5 19 15"></polyline>
                    </svg>
                  </div>
                </button>
              </Link>

              <Link href="#facilities" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-transparent hover:bg-white/5 text-white border border-white/20 pl-8 pr-6 h-[56px] rounded-full font-bold text-[14px] transition-all duration-300 backdrop-blur-md flex items-center justify-between gap-4 group">
                  Explore Facility
                  <div className="flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                      <line x1="5" y1="19" x2="19" y2="5"></line>
                      <polyline points="9 5 19 5 19 15"></polyline>
                    </svg>
                  </div>
                </button>
              </Link>
            </div>
          </div>

          {/* 3 Horizontal Supporting Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-10 animate-fade-in-up [animation-delay:600ms]">
            {/* Card 1: White */}
            <div className="group bg-white rounded-3xl p-6 flex items-center justify-between shadow-lg transition-all duration-500 ease-out hover:-translate-y-1 cursor-default relative overflow-hidden">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div>
                  <div className="font-sans font-bold text-black text-xl tracking-tight leading-none mb-1">10,000+</div>
                  <div className="font-sans text-gray-500 text-sm font-medium">Active Players</div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors relative z-10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                  <line x1="5" y1="19" x2="19" y2="5"></line>
                  <polyline points="9 5 19 5 19 15"></polyline>
                </svg>
              </div>
            </div>

            {/* Card 2: Glassmorphism */}
            <div className="group bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 flex items-center justify-between transition-all duration-500 ease-out hover:-translate-y-1 hover:bg-white/10 cursor-default">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neon"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                </div>
                <div>
                  <div className="font-sans font-bold text-white text-xl tracking-tight leading-none mb-1">Real-Time</div>
                  <div className="font-sans text-white/60 text-sm font-medium">Live Slot Sync</div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <line x1="5" y1="19" x2="19" y2="5"></line>
                  <polyline points="9 5 19 5 19 15"></polyline>
                </svg>
              </div>
            </div>

            {/* Card 3: Neon */}
            <div className="group bg-neon rounded-3xl p-6 flex items-center justify-between shadow-[0_0_30px_rgba(215,255,63,0.15)] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(215,255,63,0.4)] cursor-default">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </div>
                <div>
                  <div className="font-sans font-bold text-black text-xl tracking-tight leading-none mb-1">{venues.length || 3} Venues</div>
                  <div id="premium-facilities" className="font-sans text-black/70 text-sm font-medium">Premium Quality</div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                  <line x1="5" y1="19" x2="19" y2="5"></line>
                  <polyline points="9 5 19 5 19 15"></polyline>
                </svg>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ===================== */}
      {/* FACILITIES SHOWCASE (Refactored) */}
      {/* ===================== */}
      <FacilitiesSection venues={venues} loading={loading} />

      {/* ===================== */}
      {/* SECTION 5 — CLUB AMENITIES (Redesigned) */}
      {/* ===================== */}
      <ClubAmenities />

      {/* ===================== */}
      {/* SECTION 6 — PROMO CTA */}
      {/* ===================== */}
      <section className="py-12 px-4 md:px-8 max-w-[1400px] mx-auto w-full mb-24">
        <div className="bg-neon rounded-[3rem] p-12 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_0_100px_rgba(215,255,63,0.15)]">
          <div className="absolute -left-20 -top-20 w-96 h-96 bg-white/20 blur-3xl rounded-full"></div>

          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-display font-black text-black leading-[1.1] mb-6 tracking-tight">
              Get Premium Match Experience.
            </h2>
            <p className="text-black/70 font-bold text-lg md:text-xl">
              Join the most exclusive padel community in Semarang. Book your first session today and elevate your game.
            </p>
          </div>

          <div className="relative z-10 w-full md:w-auto shrink-0">
            <Link href="/register">
              <button className="w-full md:w-auto bg-black text-white font-display font-bold text-sm tracking-widest uppercase px-10 py-5 rounded-full hover:scale-105 transition-transform duration-300">
                Create Account
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* FOOTER                */}
      {/* ===================== */}
      <Footer />
    </div>
  );
}
