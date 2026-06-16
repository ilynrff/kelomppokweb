"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Calendar, CreditCard, Award, Info, Check, ArrowLeft, Clock, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  BOOKING: <span className="text-neon text-sm leading-none shrink-0 select-none">✅</span>,
  PAYMENT: <span className="text-amber-400 text-sm leading-none shrink-0 select-none">⏳</span>,
  MEMBERSHIP: <span className="text-violet-400 text-sm leading-none shrink-0 select-none">💎</span>,
  SYSTEM: <span className="text-neon text-sm leading-none shrink-0 select-none">🎾</span>,
};

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="animate-spin text-neon">
          <RefreshCw size={24} />
        </div>
      </div>
    );
  }

  if (!session) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col relative overflow-hidden pb-16 pt-20 sm:pt-24">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-neon/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

      {/* Header Container */}
      <div className="max-w-4xl mx-auto w-full px-6 pt-6 pb-4 flex items-end justify-between border-b border-white/5 relative z-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="text-neon select-none">🔔</span> Notifikasi
          </h1>
          <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">
            Pusat Aktivitas Anda
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-3 py-1.5 bg-neon/10 hover:bg-neon border border-neon/20 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all text-neon hover:text-black active:scale-95 shadow-[0_0_15px_rgba(215,255,63,0.05)]"
          >
            <Check size={10} /> Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin text-neon">
              <RefreshCw size={24} />
            </div>
            <p className="text-sm font-bold text-white/30 uppercase tracking-widest">Memuat notifikasi...</p>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="bg-[#0F0F0F]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-16 text-center flex flex-col items-center justify-center space-y-6 max-w-lg mx-auto shadow-2xl mt-4 sm:mt-8">


            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/20 relative">
              <Bell size={28} className="text-white/20" />
              <div className="absolute -inset-1 bg-neon/5 rounded-2xl sm:rounded-[2rem] blur-xl pointer-events-none"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider italic">Sunyi Senyap...</h3>
              <p className="text-xs sm:text-sm text-white/40 leading-relaxed font-medium">
                Belum ada aktivitas baru. Notifikasi booking, pembayaran, dan membership Anda akan terkumpul rapi di sini.
              </p>
            </div>
            <Link
              href="/"
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-white transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        ) : (

          /* List Card */
          <div className="bg-[#0F0F0F]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden divide-y divide-white/5">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.isRead) markAsRead(n.id);
                }}
                className={`p-6 sm:p-8 flex gap-5 sm:gap-6 transition-all relative cursor-pointer group hover:bg-white/[0.02]
                  ${!n.isRead ? "bg-neon/[0.015]" : "opacity-60"}
                `}
              >
                {/* Left side accent indicator */}
                {!n.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-neon shadow-[0_0_15px_rgba(215,255,63,0.6)]" />
                )}

                {/* Rounded Icon Box */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300
                  ${!n.isRead
                    ? "bg-white/5 border-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.03)]"
                    : "bg-white/[0.02] border-white/5 text-white/30"
                  }
                `}>
                  {NOTIFICATION_ICONS[n.type] || <span className="text-sm">🎾</span>}
                </div>

                {/* Details Container */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                    <p className={`text-base font-black tracking-tight transition-colors
                      ${!n.isRead ? "text-white" : "text-white/70"}
                    `}>
                      {n.title}
                    </p>
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={10} /> {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed font-semibold group-hover:text-white/60 transition-colors">
                    {n.message}
                  </p>
                </div>

                {/* Status indicator button */}
                {!n.isRead ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n.id);
                    }}
                    className="self-center w-8 h-8 rounded-full bg-neon/10 hover:bg-neon hover:text-black text-neon flex items-center justify-center transition-all border border-neon/20 shadow-sm shrink-0 active:scale-90"
                    title="Tandai dibaca"
                  >
                    <Check size={14} />
                  </button>
                ) : (
                  <div className="self-center w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10 shrink-0 ml-3" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
