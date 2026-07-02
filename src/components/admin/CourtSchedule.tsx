"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMinutesToHHmm, buildDailySlotLabels, rangesOverlap } from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";

type Court = { id: string; name: string; location: string; venueId?: string; venue?: { id: string; name: string } };

type Booking = {
  id: string;
  date: string;
  startTime: number;
  endTime: number;
  status: string;
  totalPrice: number;
  user?: { name?: string; email?: string } | null;
  court?: { id?: string; name?: string } | null;
  courtId?: string;
};

const SLOT_STATUSES = {
  AVAILABLE:        { label: "Tersedia",          bg: "bg-emerald-500/10",  border: "border-emerald-500/20",  text: "text-emerald-400", dot: "🟢" },
  CONFIRMED:        { label: "Confirmed",          bg: "bg-blue-500/10",    border: "border-blue-500/20",     text: "text-blue-400",    dot: "🔵" },
  RESCHEDULE_APPROVED: { label: "Reschedule ✓",  bg: "bg-teal-500/10",    border: "border-teal-500/20",     text: "text-teal-400",    dot: "🟦" },
  PENDING:          { label: "Menunggu Bayar",    bg: "bg-amber-500/10",    border: "border-amber-500/20",    text: "text-amber-400",   dot: "🟡" },
  PERLU_VERIFIKASI: { label: "Verifikasi",        bg: "bg-orange-500/10",  border: "border-orange-500/20",   text: "text-orange-400",  dot: "🟠" },
  RESCHEDULE_REQUESTED: { label: "Reschedule ⏳", bg: "bg-violet-500/10", border: "border-violet-500/20",   text: "text-violet-400",  dot: "🟣" },
};

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PERLU_VERIFIKASI", "RESCHEDULE_REQUESTED", "RESCHEDULE_APPROVED"];

function todayISOLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CourtSchedule() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [date, setDate] = useState(todayISOLocal());
  const [selectedVenueId, setSelectedVenueId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tooltip, setTooltip] = useState<{ booking: Booking; x: number; y: number } | null>(null);

  const slots = useMemo(() => buildDailySlotLabels(8 * 60, 22 * 60, 60), []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [courtsData, bookingsData] = await Promise.all([
        fetch("/api/courts").then((r) => r.json()),
        fetch(`/api/bookings`).then((r) => r.json()),
      ]);
      setCourts(Array.isArray(courtsData) ? courtsData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const venues = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    courts.forEach((c) => {
      if (c.venue) map.set(c.venue.id, { id: c.venue.id, name: c.venue.name });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [courts]);

  const visibleCourts = useMemo(() => {
    if (selectedVenueId === "all") return courts;
    return courts.filter((c) => c.venue?.id === selectedVenueId || c.venueId === selectedVenueId);
  }, [courts, selectedVenueId]);

  // Group by venue for table display
  const groupedCourts = useMemo(() => {
    const map = new Map<string, { venueName: string; courts: Court[] }>();
    visibleCourts.forEach((c) => {
      const vId = c.venue?.id || c.venueId || "unknown";
      const vName = c.venue?.name || "Padel Venue";
      if (!map.has(vId)) map.set(vId, { venueName: vName, courts: [] });
      map.get(vId)!.courts.push(c);
    });
    return Array.from(map.values());
  }, [visibleCourts]);

  // Filter bookings to the selected date
  const dayBookings = useMemo(() =>
    bookings.filter((b) => {
      const bDate = String(b.date).slice(0, 10);
      return bDate === date && ACTIVE_STATUSES.includes(b.status);
    }),
    [bookings, date],
  );

  function getCell(court: Court, slot: { start: number; end: number }) {
    const booking = dayBookings.find(
      (b) =>
        (b.court?.id === court.id || b.courtId === court.id) &&
        rangesOverlap({ start: b.startTime, end: b.endTime }, slot),
    );
    return booking ?? null;
  }

  const statusConfig = (status: string) =>
    SLOT_STATUSES[status as keyof typeof SLOT_STATUSES] ?? SLOT_STATUSES.AVAILABLE;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#0F0F0F]/50 border border-white/5 rounded-[2rem] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-400 font-bold text-sm text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end bg-[#0F0F0F]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-neon"
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Venue</label>
          <div className="relative">
            <select
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              className="px-4 py-2.5 pr-10 bg-[#1A1A1A] border border-white/10 rounded-xl text-sm font-bold text-white hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-neon transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,255,255,0.4)\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
            >
              <option value="all">Semua Venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="px-5 py-2.5 bg-neon hover:bg-[#c4eb28] text-black text-xs uppercase tracking-widest font-black rounded-xl transition-all ml-auto shadow-[0_0_15px_rgba(215,255,63,0.3)]"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 items-center px-2">
        {Object.entries(SLOT_STATUSES).map(([, cfg]) => (
          <span key={cfg.label} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
            <span className={`w-3.5 h-3.5 rounded ${cfg.bg} border ${cfg.border} inline-block`} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      {visibleCourts.length === 0 ? (
        <div className="p-10 bg-[#0F0F0F]/50 rounded-[2rem] border border-white/5 text-center text-white/40 font-bold">
          Tidak ada lapangan.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[2rem] border border-white/5 shadow-xl bg-[#0F0F0F]/80 backdrop-blur-xl">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#1A1A1A] border-b border-white/5">
                {/* Time header */}
                <th rowSpan={2} className="sticky left-0 z-20 bg-[#1A1A1A] px-5 py-4 text-left text-[10px] font-black text-white/40 uppercase tracking-widest w-32 border-r border-white/5 shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                  Jam
                </th>
                {groupedCourts.map((group) => (
                  <th key={group.venueName} colSpan={group.courts.length} className="px-4 py-3 text-center border-b border-white/5 border-l border-white/5 bg-white/[0.02]">
                    <div className="text-xs font-black text-neon uppercase tracking-widest italic">{group.venueName}</div>
                  </th>
                ))}
              </tr>
              <tr className="bg-[#1A1A1A] border-b border-white/5">
                {groupedCourts.map((group) =>
                  group.courts.map((court) => (
                    <th key={court.id} className="px-4 py-3 text-center min-w-[150px] border-l border-white/5">
                      <div className="text-sm font-black text-white tracking-tight">{court.name}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-0.5">{court.location}</div>
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                const now = new Date();
                const slotDateStr = `${date}T00:00:00.000Z`;
                const slotStart = new Date(slotDateStr);
                slotStart.setUTCMinutes(slot.start);
                const isPast = slotStart < now;

                return (
                  <tr key={slot.label} className={`border-b border-white/5 last:border-b-0 ${isPast ? "opacity-30" : ""}`}>
                    {/* Time label */}
                    <td className="sticky left-0 z-10 bg-[#1A1A1A] px-5 py-3 border-r border-white/5 shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                      <span className="text-xs font-black text-white">
                        {formatMinutesToHHmm(slot.start)}
                      </span>
                      <span className="text-[10px] text-white/30 ml-1.5 font-bold">
                        – {formatMinutesToHHmm(slot.end)}
                      </span>
                    </td>
                    {/* Cells per court grouped */}
                    {groupedCourts.map((group) =>
                      group.courts.map((court) => {
                        const booking = getCell(court, slot);
                        const cellClass = "px-3 py-2 text-center border-l border-white/5";
                        if (!booking) {
                          return (
                            <td key={court.id} className={cellClass}>
                              <div className="rounded-xl border border-dashed border-emerald-500/20 bg-emerald-500/5 h-10 flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/50">Tersedia</span>
                              </div>
                            </td>
                          );
                        }
                        const cfg = statusConfig(booking.status);
                        return (
                          <td key={court.id} className={cellClass}>
                            <div
                              className={`relative rounded-xl border ${cfg.bg} ${cfg.border} h-10 flex items-center justify-center px-3 cursor-pointer group transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-[1.03] z-0 hover:z-20`}
                              onMouseEnter={(e) =>
                                setTooltip({
                                  booking,
                                  x: e.clientX,
                                  y: e.clientY,
                                })
                              }
                              onMouseLeave={() => setTooltip(null)}
                            >
                              <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.text} truncate`}>
                                {booking.user?.name ?? "—"}
                              </span>
                            </div>
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[9999] bg-[#1A1A1A] border border-white/10 text-white rounded-2xl shadow-2xl px-5 py-4 pointer-events-none"
          style={{ left: tooltip.x + 16, top: tooltip.y - 16 }}
        >
          <p className="font-black text-sm mb-1 text-white truncate max-w-[200px]">{tooltip.booking.user?.name ?? "—"}</p>
          <p className="text-[10px] font-bold text-white/40 mb-3 truncate max-w-[200px]">{tooltip.booking.user?.email ?? ""}</p>
          <div className="space-y-2">
            <p className="text-xs font-bold text-white/60 flex items-center gap-2">
              <span className="w-4">⏰</span> {formatMinutesToHHmm(tooltip.booking.startTime)} – {formatMinutesToHHmm(tooltip.booking.endTime)}
            </p>
            <p className="text-xs font-bold text-white/60 flex items-center gap-2">
              <span className="w-4">📋</span> 
              <span className={`px-2 py-0.5 rounded-lg ${SLOT_STATUSES[tooltip.booking.status as keyof typeof SLOT_STATUSES]?.bg} ${SLOT_STATUSES[tooltip.booking.status as keyof typeof SLOT_STATUSES]?.text} border ${SLOT_STATUSES[tooltip.booking.status as keyof typeof SLOT_STATUSES]?.border} text-[9px] uppercase tracking-widest inline-block`}>
                {SLOT_STATUSES[tooltip.booking.status as keyof typeof SLOT_STATUSES]?.label ?? tooltip.booking.status}
              </span>
            </p>
            <p className="text-xs font-bold text-white/60 flex items-center gap-2">
              <span className="w-4">💰</span> Rp {Number(tooltip.booking.totalPrice || 0).toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
