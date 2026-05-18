"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const isAdmin = session?.user?.role === "ADMIN";

  // Menu berbeda untuk USER dan ADMIN
  const links = isAdmin
    ? [
        { name: "Home", path: "/" },
        { name: "Admin", path: "/admin" },
      ]
    : [
        { name: "Home", path: "/" },
        ...(isLoggedIn ? [{ name: "Booking", path: "/booking" }] : []),
        ...(isLoggedIn ? [{ name: "Dashboard", path: "/dashboard" }] : []),
      ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              Padel
              <span className="text-blue-600 group-hover:text-slate-900 transition-colors">
                Go
              </span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-sm font-bold transition-all px-3.5 py-2 rounded-xl ${isActive ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm font-bold text-slate-500 hover:text-red-500 transition-colors px-4 py-2"
            >
              Log out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors px-4 py-2"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(59,130,246,0.25)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.35)]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-5 space-y-2 shadow-xl absolute w-full left-0 animate-in">
          {links.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`block text-base font-bold py-2.5 px-4 rounded-xl transition-colors ${isActive ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"}`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-3">
            {isLoggedIn ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full text-left font-bold text-red-500 py-2 px-4"
              >
                Log out
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block text-base font-bold text-slate-600 py-2 px-4"
                  onClick={() => setIsOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="block text-base font-bold text-blue-600 py-2 px-4"
                  onClick={() => setIsOpen(false)}
                >
                  Sign up free →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
