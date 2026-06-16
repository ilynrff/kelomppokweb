"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#080808] border-t border-white/5 pt-20 pb-10 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#D7FF3F]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 items-start mb-20">
          
          {/* LEFT SECTION: Brand identity */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="font-black text-3xl tracking-tighter text-white uppercase">
                PADEL<span className="text-[#D7FF3F]">GO</span>
              </span>
              <span className="text-[#D7FF3F] text-[10px] font-bold uppercase tracking-[0.4em]">
                Play Smarter. Book Faster.
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-[280px] font-medium">
              The premier padel experience designed for modern athletes. Elevating the game through technology and community.
            </p>
          </div>

          {/* CENTER SECTION: Symbol & Navigation */}
          <div className="flex flex-col items-center gap-10">
            {/* Premium Brand Symbol */}
            <div className="relative group cursor-default">
              <div className="absolute inset-0 bg-[#D7FF3F]/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="w-20 h-20 rounded-2xl border border-white/10 flex items-center justify-center bg-white/[0.02] backdrop-blur-xl relative overflow-hidden group-hover:border-[#D7FF3F]/30 transition-all duration-700">
                <div className="absolute inset-0 bg-gradient-to-br from-[#D7FF3F]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {/* Abstract PG Monogram Symbol */}
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                  <path d="M12 10H28V14H16V26H24V22H20V18H28V30H12V10Z" fill="white" className="group-hover:fill-[#D7FF3F] transition-colors duration-700" />
                </svg>
              </div>
            </div>

            {/* Minimal Navigation */}
            <nav className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="#premium-facilities" className="hover:text-white transition-colors">Courts</Link>
              <Link href="#club-amenities" className="hover:text-white transition-colors">Facilities</Link>
              <Link href="/booking" className="hover:text-white transition-colors">Book Now</Link>
            </nav>
          </div>

          {/* RIGHT SECTION: Social Presence */}
          <div className="flex flex-col items-start md:items-end gap-8">
            <h4 className="text-white text-[10px] font-bold uppercase tracking-[0.4em] opacity-30">Social Presence</h4>
            <div className="flex items-center gap-6">
              {/* Instagram Icon SVG */}
              <a href="#" className="group relative">
                <div className="absolute inset-0 bg-[#D7FF3F]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 group-hover:text-[#D7FF3F] transition-all duration-500">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              {/* TikTok Monogram */}
              <a href="#" className="group relative">
                <div className="absolute inset-0 bg-[#D7FF3F]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-5 h-5 text-white/40 group-hover:text-[#D7FF3F] transition-all duration-500 font-bold text-[10px] flex items-center justify-center italic">𝓣</div>
              </a>
              {/* WhatsApp Icon SVG */}
              <a href="#" className="group relative">
                <div className="absolute inset-0 bg-[#D7FF3F]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 group-hover:text-[#D7FF3F] transition-all duration-500">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 3z"></path>
                </svg>
              </a>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Connect with us</p>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Sub-footer */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium">
            © 2026 PADELGO. ALL RIGHTS RESERVED.
          </p>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent mx-8 hidden md:block"></div>
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium italic">
            Jadikan setiap rally panjang, adalah sebuah pengalaman
          </p>
        </div>
      </div>
    </footer>
  );
}