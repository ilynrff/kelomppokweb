"use client";

import { useEffect, useState, useCallback } from "react";

interface PaymentDeadlineCountdownProps {
  expiresAt: string | Date;
  bookingStatus:
    | "PENDING"
    | "EXPIRED"
    | "CONFIRMED"
    | "CANCELLED"
    | "PERLU_VERIFIKASI"
    | string;
  onExpired?: () => void; // Callback when timer reaches zero
}

export function PaymentDeadlineCountdown({
  expiresAt,
  bookingStatus,
  onExpired,
}: PaymentDeadlineCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hasCalledExpired, setHasCalledExpired] = useState(false);

  const updateCountdown = useCallback(() => {
    const expiryTime = new Date(expiresAt).getTime();
    const diff = expiryTime - Date.now();
    const remaining = Math.max(0, Math.floor(diff / 1000));
    setTimeLeft(remaining);

    if (remaining === 0 && !hasCalledExpired) {
      setHasCalledExpired(true);
      onExpired?.();
    }
  }, [expiresAt, hasCalledExpired, onExpired]);

  useEffect(() => {
    if (bookingStatus !== "PENDING") return;
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [bookingStatus, updateCountdown]);

  if (timeLeft === null || bookingStatus !== "PENDING") return null;

  const isExpired = timeLeft <= 0;
  const isUrgent = timeLeft < 300; // < 5 minutes
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Styling based on state
  const containerClass = isExpired
    ? "bg-red-50 border-red-300 border-l-red-500 text-red-800"
    : isUrgent
      ? "bg-amber-50 border-amber-300 border-l-amber-500 text-amber-800"
      : "bg-blue-50 border-blue-200 border-l-blue-500 text-blue-800";

  return (
    <div className={`flex items-center justify-between gap-4 border border-l-4 rounded-xl p-3 ${containerClass} transition-all duration-500`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {isExpired ? "⏰" : isUrgent ? "🔴" : "⏳"}
        </span>
        <div>
          <div className="font-black text-sm leading-tight">
            {isExpired
              ? "Waktu Pembayaran Habis"
              : isUrgent
                ? "Waktu Hampir Habis!"
                : "Menunggu Pembayaran"}
          </div>
          <div className="text-xs font-medium opacity-70 leading-tight">
            {isExpired
              ? "Booking akan segera diexpire oleh sistem."
              : "Transfer dan upload bukti sebelum waktu habis."}
          </div>
        </div>
      </div>

      {!isExpired && (
        <div className={`font-mono font-black text-2xl tabular-nums shrink-0 ${isUrgent ? "animate-pulse" : ""}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      )}
    </div>
  );
}
