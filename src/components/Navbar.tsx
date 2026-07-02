"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { logirent } from "@/lib/fonts";
import { User, LogOut, Settings, LayoutDashboard, CircleUserRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationPanel } from "./NotificationPanel";


export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const isAdmin = session?.user?.role === "ADMIN";
  const membershipStatus = (session?.user as any)?.membershipStatus || "FREE";
  const isMember = membershipStatus === "ACTIVE";
  const isPending = membershipStatus === "PENDING";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    const isLogin = pathname === "/login";
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 py-8 px-8 md:px-16 flex items-center justify-between animate-fade-in">
        <Link href="/" className={`${logirent.className} group flex items-center shrink-0 outline-none select-none`}>
          <span className="text-xl tracking-widest text-white transition-colors duration-500 ease-out group-hover:text-neon">
            PADEL
          </span>
          <span className="text-xl tracking-widest text-neon transition-colors duration-500 ease-out group-hover:text-white">
            GO
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-white font-black text-xs uppercase tracking-[0.3em]">
              {isLogin ? "Login" : "Register"}
            </span>
            <div className="w-full h-[2px] bg-neon mt-1 shadow-[0_0_10px_rgba(215,255,63,0.5)]"></div>
          </div>
        </div>
      </nav>
    );
  }

  const links = isAdmin
    ? [
        { name: "Home", path: "/" },
        { name: "Admin", path: "/admin" },
      ]
    : [
        { name: "Home", path: "/" },
        ...(isLoggedIn ? [{ name: "Booking", path: "/booking" }] : []),
        { name: "Membership", path: "/membership" },
      ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 animate-fade-in-up ${
          scrolled ? "py-2" : "py-4"
        }`}
      >
        <div
          className={`max-w-[1280px] mx-auto px-4 transition-all duration-500 ${
            scrolled
              ? "bg-[#111]/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl"
              : "bg-transparent"
          }`}
        >
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <Link href="/" className={`${logirent.className} group flex items-center shrink-0 outline-none select-none`}>
              <span className="text-xl tracking-widest text-white transition-colors duration-500 ease-out group-hover:text-neon">
                PADEL
              </span>
              <span className="text-xl tracking-widest text-neon transition-colors duration-500 ease-out group-hover:text-white">
                GO
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`text-sm font-semibold transition-all px-4 py-2 rounded-full ${
                      isActive
                        ? "text-white bg-white/10"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn && <NotificationPanel />}
              {isLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group active:scale-95"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isMember ? 'bg-neon text-black' : 'bg-white/5 text-white/40 group-hover:bg-neon/10 group-hover:text-neon'}`}>
                      <CircleUserRound size={16} />
                    </div>
                    <span className="text-sm font-black text-white/80 group-hover:text-white uppercase italic tracking-wider flex items-center gap-2">
                      Hello, <span className="text-neon group-hover:text-neon">{session.user.name?.split(' ')[0]}</span>
                      {isMember && (
                        <span className="flex h-4 px-1.5 items-center justify-center rounded bg-neon/20 border border-neon/30 text-[8px] font-black text-neon shadow-sm animate-pulse-soft">
                          MEMBER
                        </span>
                      )}
                    </span>
                  </button>

                  {/* Dropdown Menu with Framer Motion */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-64 bg-[#0F0F0F]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(215,255,63,0.05)] overflow-hidden z-[100] origin-top-right"
                      >
                        {/* User Info Section */}
                        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                          <p className="text-sm font-black text-white truncate uppercase italic">{session.user.name}</p>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                            <span className={`w-1 h-1 rounded-full ${isMember ? 'bg-neon' : 'bg-white/20'}`}></span>
                            {(session.user as any).whatsapp}
                            {isMember && <span className="text-neon text-[8px] font-black tracking-widest ml-auto italic">ELITE ACTIVE</span>}
                          </p>
                        </div>

                        {/* Navigation Links */}
                        <div className="p-2.5">
                          <Link
                            href="/profile"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-white/60 hover:text-neon hover:bg-neon/5 transition-all group"
                          >
                            <User size={16} className="group-hover:scale-110 transition-transform text-white/20 group-hover:text-neon" />
                            My Profile
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-white/60 hover:text-neon hover:bg-neon/5 transition-all group"
                            >
                              <LayoutDashboard size={16} className="group-hover:scale-110 transition-transform text-white/20 group-hover:text-neon" />
                              Admin Panel
                            </Link>
                          )}
                          <Link
                            href="/dashboard"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-white/60 hover:text-neon hover:bg-neon/5 transition-all group"
                          >
                            <Settings size={16} className="group-hover:scale-110 transition-transform text-white/20 group-hover:text-neon" />
                            Dashboard
                          </Link>
                          
                          <div className="h-px bg-white/5 my-2 mx-4"></div>

                          <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all group"
                          >
                            <LogOut size={16} className="group-hover:translate-x-1 transition-transform text-red-500/20 group-hover:text-red-500" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-semibold text-white/80 hover:text-white transition-colors px-4 py-2"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="btn-neon px-5 py-2.5 text-sm uppercase tracking-wider"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>

            <div className="flex md:hidden items-center gap-2">
              {isLoggedIn && <NotificationPanel />}
              <button
                className="relative z-50 p-2 text-white hover:text-neon transition-colors outline-none"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Menu"
              >
                <div className="w-6 h-5 flex flex-col justify-between">
                  <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isOpen ? "rotate-45 translate-y-2.5 bg-neon" : ""}`} />
                  <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isOpen ? "opacity-0" : ""}`} />
                  <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-2 bg-neon" : ""}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-[#0B0B0B] transition-transform duration-500 ease-[0.16,1,0.3,1] ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex flex-col h-full px-8 pt-28 pb-12">
          <div className="flex flex-col gap-6 text-2xl font-display font-bold">
            {links.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`transition-colors ${pathname === link.path ? "text-neon" : "text-white"}`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {isLoggedIn && (
              <>
                <Link href="/profile" className="text-white" onClick={() => setIsOpen(false)}>My Profile</Link>
                <Link href="/dashboard" className="text-white" onClick={() => setIsOpen(false)}>Dashboard</Link>
              </>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-4">
            {isLoggedIn ? (
              <div className="border-t border-white/10 pt-8 space-y-4">
                <div className="flex flex-col">
                  <span className="text-white font-black text-lg italic uppercase">{session.user.name}</span>
                  <span className="text-white/40 text-sm">{(session.user as any).whatsapp}</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full text-left font-display font-bold text-red-500 text-xl"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 border-t border-white/10 pt-8">
                <Link href="/login" className="font-display font-bold text-white text-xl" onClick={() => setIsOpen(false)}>Log in</Link>
                <Link href="/register" className="btn-neon w-full py-4 text-center text-sm tracking-widest mt-2" onClick={() => setIsOpen(false)}>Create Account</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
