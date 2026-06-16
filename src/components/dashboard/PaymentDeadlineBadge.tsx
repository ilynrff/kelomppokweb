"use client";

import { useEffect, useState } from "react";

interface PaymentDeadlineBadgeProps {
  expiresAt?: string | Date;
  bookingStatus:
    | "PENDING"
    | "EXPIRED"
    | "CONFIRMED"
    | "CANCELLED"
    | "PERLU_VERIFIKASI"
    | string;
  compact?: boolean;
}

export function PaymentDeadlineBadge({
  expiresAt,
  bookingStatus,
  compact = true,
}: PaymentDeadlineBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt || bookingStatus !== "PENDING") return;

    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, bookingStatus]);

  if (!expiresAt || bookingStatus !== "PENDING" || timeLeft === null) {
    return null;
  }

  const isExpired = timeLeft <= 0;
  const isUrgent = timeLeft < 300; // < 5 minutes
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (isExpired) {
    return (
      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs ${
        compact ? "bg-red-100 text-red-700" : "bg-red-50 text-red-700 border border-red-200"
      }`}>
        <span>⏰</span> Expired
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs transition-colors ${
      isUrgent
        ? compact
          ? "bg-red-100 text-red-700 animate-pulse"
          : "bg-red-50 text-red-700 border border-red-200 animate-pulse"
        : compact
          ? "bg-amber-100 text-amber-700"
          : "bg-amber-50 text-amber-700 border border-amber-200"
    }`}>
      <span>{isUrgent ? "🔴" : "⏳"}</span>
      {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
}
