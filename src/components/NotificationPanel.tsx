"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Fetch immediately on mount & setup lightweight 60s background polling
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000);

    // Refresh when browser tab is refocused
    const handleFocus = () => {
      fetchNotifications();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Fetch immediately when the notification dropdown is opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="relative" ref={panelRef}>
      {/* Premium Circular Glass Button Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:border-neon/40 text-white hover:text-neon flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(215,255,63,0.15)] hover:scale-105 active:scale-95 group focus:outline-none"
        aria-label="Notifications"
      >
        <Bell size={16} className="transition-transform duration-300 group-hover:rotate-12" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neon text-black text-[8px] font-black px-1 shadow-[0_0_10px_rgba(215,255,63,0.6)] border border-[#0B0B0B] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Premium Glassmorphic Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-[-12px] sm:right-0 mt-3 w-[300px] sm:w-[360px] bg-[#0B0B0B]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(215,255,63,0.03)] overflow-hidden z-[110] origin-top-right"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Bell size={12} className="text-neon" /> Notifications
                </h3>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-tight mt-0.5">
                  Stay updated with your activities
                </p>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-2.5 py-1 bg-neon/10 hover:bg-neon text-neon hover:text-black border border-neon/20 hover:border-transparent rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all duration-300"
                >
                  <Check size={9} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[320px] overflow-y-auto divide-y divide-white/5 scrollbar-thin">
              {notifications.length === 0 ? (
                /* Elegant Minimal Empty State */
                <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/20 relative">
                    <Bell size={18} className="text-white/20" />
                    <div className="absolute inset-0 bg-neon/5 rounded-full blur-md pointer-events-none"></div>
                  </div>
                  <div>
                    <p className="text-xs font-black text-white/60 uppercase tracking-widest italic">No notifications yet</p>
                    <p className="text-[9px] text-white/30 font-medium leading-relaxed max-w-[200px] mx-auto mt-1">
                      Your booking confirmations and club activities will gather here.
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) markAsRead(n.id);
                    }}
                    className={`p-4 flex gap-4 transition-all relative cursor-pointer group hover:bg-white/[0.02]
                      ${!n.isRead ? "bg-white/[0.02]" : "opacity-60"}
                    `}
                  >
                    {/* Left neon accent border indicator for unread */}
                    {!n.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon shadow-[0_0_10px_rgba(215,255,63,0.5)]" />
                    )}

                    {/* Icon container */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors
                      ${!n.isRead 
                        ? "bg-white/5 border-white/10 text-white" 
                        : "bg-white/[0.01] border-white/5 text-white/30"
                      }
                    `}>
                      {NOTIFICATION_ICONS[n.type] || <span className="text-xs">🎾</span>}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-xs font-black tracking-tight truncate transition-colors
                          ${!n.isRead ? "text-white" : "text-white/60"}
                        `}>
                          {n.title}
                        </p>
                        <span className="text-[8px] font-bold text-white/30 shrink-0 uppercase tracking-wider flex items-center gap-1">
                          <Clock size={8} /> {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 leading-relaxed font-semibold group-hover:text-white/60 transition-colors">
                        {n.message}
                      </p>
                    </div>

                    {/* Unread Dot indicator */}
                    {!n.isRead && (
                      <div className="w-1.5 h-1.5 rounded-full bg-neon self-center shadow-[0_0_8px_rgba(215,255,63,0.8)] shrink-0 ml-1" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 px-6 py-3.5 bg-white/[0.01] text-center">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-black text-white/40 hover:text-neon uppercase tracking-widest transition-colors inline-block"
              >
                Lihat Semua Notifikasi →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
