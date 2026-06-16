"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  date: string;
  startTime: number;
  endTime: number;
  status: string;
};

export function BookingTimeAwareness({ booking }: { booking: Booking }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update 'now' every 30 seconds
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!["CONFIRMED", "RESCHEDULE_APPROVED"].includes(booking.status)) return null;

  const dateStr = String(booking.date).split("T")[0];
  const [year, month, day] = dateStr.split("-").map(Number);
  
  const startDateTime = new Date(year, month - 1, day, 0, booking.startTime);
  const endDateTime = new Date(year, month - 1, day, 0, booking.endTime);

  const diffMs = startDateTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  const isToday = startDateTime.toDateString() === now.toDateString();
  const isExpired = now > endDateTime;
  const isPlaying = now >= startDateTime && now <= endDateTime;

  if (isExpired) {
    return (
      <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex gap-3 items-center">
        <span className="text-xl shrink-0">✅</span>
        <div>
          <p className="font-black text-sm">Booking sudah selesai</p>
        </div>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex gap-3 items-start animate-pulse">
        <span className="text-xl shrink-0">🎾</span>
        <div>
          <p className="font-black text-sm">Waktu bermain sedang berlangsung!</p>
          <p className="text-xs font-medium mt-0.5 opacity-80">Selamat menikmati permainan Anda.</p>
        </div>
      </div>
    );
  }

  if (!isToday || diffMins < 0) return null; // Only show countdown for upcoming today

  if (diffMins <= 60) {
    return (
      <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-xl animate-bounce">⏳</span>
        </div>
        <div>
          <p className="font-black text-sm">Segera bermain dalam {diffMins} menit</p>
          <p className="text-xs font-bold mt-0.5 opacity-80">Jangan terlambat ya, datang 10-15 menit lebih awal.</p>
        </div>
      </div>
    );
  }

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  const timeStr = hours > 0 ? `${hours} jam${mins > 0 ? ` ${mins} menit` : ''}` : `${mins} menit`;

  return (
    <div className="mt-4 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
        <span className="text-lg">⏰</span>
      </div>
      <div>
        <p className="font-black text-sm">Main dalam {timeStr}</p>
        <p className="text-xs font-bold mt-0.5 opacity-80">Jangan lupa siapkan perlengkapanmu!</p>
      </div>
    </div>
  );
}
