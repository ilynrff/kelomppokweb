"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { formatMinutesToHHmm } from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchJson } from "@/lib/fetchJson";

type Booking = {
  id: string;
  bookingCode?: string | null;
  date: string;
  startTime: number;
  endTime: number;
  status: string;
  totalPrice: number;
  createdAt: string;
  expiresAt?: string;
  paymentProofUrl?: string;
  rescheduleDate?: string | null;
  rescheduleStartTime?: number | null;
  rescheduleEndTime?: number | null;
  rescheduleNote?: string | null;
  user?: { name?: string; whatsapp?: string };
  court?: { name?: string; location?: string };
  payment?: { status?: string; proofImage?: string } | null;
};

type Props = { initialBookings?: Booking[]; isLoading?: boolean; defaultFilter?: string };

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:               { label: "Menunggu Bayar",     bg: "bg-orange-500/10 border border-orange-500/20", text: "text-orange-400" },
  PERLU_VERIFIKASI:      { label: "Perlu Verifikasi",   bg: "bg-amber-500/10 border border-amber-500/20",  text: "text-amber-400" },
  CONFIRMED:             { label: "Confirmed",           bg: "bg-emerald-500/10 border border-emerald-500/20",text: "text-emerald-400" },
  CHECKED_IN:            { label: "Checked In",          bg: "bg-sky-500/10 border border-sky-500/20",    text: "text-sky-400" },
  CANCELLED:             { label: "Cancelled",           bg: "bg-red-500/10 border border-red-500/20",    text: "text-red-400" },
  EXPIRED:               { label: "Expired",             bg: "bg-white/5 border border-white/10",  text: "text-white/40" },
  COMPLETED:             { label: "Completed",           bg: "bg-white/5 border border-white/10",  text: "text-white/60" },
  ONGOING:               { label: "🔴 Sedang Main",      bg: "bg-indigo-500/10 border border-indigo-500/20", text: "text-indigo-400" },
  RESCHEDULE_REQUESTED:  { label: "Reschedule ⏳",       bg: "bg-violet-500/10 border border-violet-500/20", text: "text-violet-400" },
  RESCHEDULE_APPROVED:   { label: "Reschedule ✓",       bg: "bg-teal-500/10 border border-teal-500/20",   text: "text-teal-400" },
  RESCHEDULE_REJECTED:   { label: "Reschedule ✕",       bg: "bg-rose-500/10 border border-rose-500/20",   text: "text-rose-400" },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status.toUpperCase()] ?? { label: status, bg: "bg-white/5 border border-white/10", text: "text-white/60" };
  return (
    <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function CourtAvailTag({ booking }: { booking: Booking }) {
  const s = String(booking.status).toUpperCase();
  // If it's already ONGOING or COMPLETED, the status badge covers it
  if (["ONGOING", "COMPLETED"].includes(s)) return null;
  if (!["CONFIRMED", "RESCHEDULE_APPROVED"].includes(s)) return null;

  const now = new Date();
  const start = new Date(booking.date);
  start.setUTCMinutes(start.getUTCMinutes() + booking.startTime);
  
  if (now < start) return <span className="text-[11px] font-bold text-amber-600">🟡 Akan Dipakai</span>;
  return null;
}

export function BookingManager({ initialBookings = [], isLoading = false, defaultFilter }: Props) {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState(defaultFilter ?? "all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [selected, setSelected] = useState<Booking | null>(null);
  
  // New Filter & Search states
  const [dateFilter, setDateFilter] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastQueue, setToastQueue] = useState<{ msg: string; type: "success" | "error" }[]>([]);

  useEffect(() => { setBookings(initialBookings); }, [initialBookings]);

  // Effect to re-fetch when dateFilter changes
  useEffect(() => {
    refresh();
  }, [dateFilter]);

  // Silent auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refresh(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [dateFilter]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToastQueue((q) => [...q, { msg, type }]);
    setTimeout(() => setToastQueue((q) => q.slice(1)), 3500);
  };

  const refresh = async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const url = dateFilter ? `/api/bookings?date=${dateFilter}` : "/api/bookings";
      const data = await fetchJson<Booking[]>(url);
      const newData = Array.isArray(data) ? data : [];
      
      setBookings(newData);

      // Auto-update any open modals so they reflect latest status
      if (isSilent) {
        setSelected(prev => prev ? (newData.find(b => b.id === prev.id) || prev) : null);
      }
    } catch (e) { 
      if (!isSilent) showToast(getErrorMessage(e) || "Error", "error"); 
    }
    finally { 
      if (!isSilent) setIsRefreshing(false); 
    }
  };

  const patchStatus = async (id: string, status: string) => {
    setIsProcessing(true);
    try {
      const data = await fetchJson<Booking>(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setBookings((prev) => prev.map((b) => (b.id === id ? data : b)));
      showToast(`Status berhasil diubah ke ${STATUS_CONFIG[status]?.label ?? status}`, "success");
      router.refresh();
      setSelected(null);
    } catch (e) { showToast(getErrorMessage(e) || "Gagal update", "error"); }
    finally { setIsProcessing(false); }
  };

  const checkIn = async (bookingCode: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/bookings/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal check-in");
      showToast("Check-in berhasil", "success");
      router.refresh();
      await refresh();
      setSelected(null);
    } catch (e: any) {
      showToast(e.message || "Gagal check-in", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const patchReschedule = async (id: string, action: "approve" | "reject") => {
    setIsProcessing(true);
    try {
      const data = await fetchJson<Booking>(`/api/bookings/${id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setBookings((prev) => prev.map((b) => (b.id === id ? data : b)));
      showToast(`Reschedule berhasil di-${action}`, "success");
      router.refresh();
      setSelected(null);
    } catch (e) { showToast(getErrorMessage(e) || "Gagal", "error"); }
    finally { setIsProcessing(false); }
  };

  const getTodayStr = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  };

  const getTomorrowStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  };

  const filtered = useMemo(() => {
    let list = bookings.slice();
    if (filter !== "all") list = list.filter((b) => b.status.toUpperCase() === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        (b.bookingCode || "").toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (b.user?.name ?? "").toLowerCase().includes(q) ||
        (b.court?.name ?? "").toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => sort === "desc"
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return list;
  }, [bookings, filter, search, sort]);

  return (
    <div className="space-y-4">
      {/* Toast */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toastQueue.map((t, i) => <Toast key={i} isOpen message={t.msg} type={t.type} onClose={() => {}} />)}
      </div>


      {/* Filters Container */}
      <div className="flex flex-col gap-6 bg-[#0F0F0F]/40 backdrop-blur-md p-6 rounded-[1.5rem] shadow-xl border border-white/5">
        {/* Row 1: Date Quick Filters & Date Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mr-2">Date Filter:</span>
            <button 
              onClick={() => setDateFilter("")}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 ${
                dateFilter === "" 
                  ? "bg-neon text-black shadow-md" 
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5"
              }`}
            >
              Semua
            </button>
            <button 
              onClick={() => setDateFilter(getTodayStr())}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 ${
                dateFilter === getTodayStr() 
                  ? "bg-neon text-black shadow-md" 
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5"
              }`}
            >
              Hari Ini
            </button>
            <button 
              onClick={() => setDateFilter(getTomorrowStr())}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 ${
                dateFilter === getTomorrowStr() 
                  ? "bg-neon text-black shadow-md" 
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5"
              }`}
            >
              Besok
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] hidden md:inline">Custom Date:</span>
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-[#141414] border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-neon/30 cursor-pointer w-full sm:w-auto transition-all"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Row 2: Search Input, Status, Sort & Refresh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center w-full">
          <div className="lg:col-span-6 w-full relative">
            <input
              type="text" 
              placeholder="Cari user / court / kode booking..."
              className="w-full px-4 py-2.5 bg-[#141414] border border-white/10 rounded-xl text-xs font-bold text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-neon/30 transition-all"
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="lg:col-span-3 w-full relative">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#141414] border border-white/10 rounded-xl text-xs font-bold text-white hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-neon/30 transition-all appearance-none cursor-pointer pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,255,255,0.4)\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
            >
              <option value="all">Semua Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 w-full relative">
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value as "desc" | "asc")}
              className="w-full px-4 py-2.5 bg-[#141414] border border-white/10 rounded-xl text-xs font-bold text-white hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-neon/30 transition-all appearance-none cursor-pointer pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,255,255,0.4)\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
            >
              <option value="desc">Terbaru</option>
              <option value="asc">Terlama</option>
            </select>
          </div>

          <div className="lg:col-span-1 w-full">
            <button 
              onClick={() => refresh()} 
              disabled={isRefreshing}
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              ↻
            </button>
          </div>
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && [1, 2, 3].map((i) => (
          <div key={i} className="bg-[#0F0F0F]/40 rounded-[1.5rem] border border-white/5 p-6 animate-pulse h-56" />
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 bg-[#0F0F0F]/40 rounded-[1.5rem] p-16 text-center text-white/40 font-bold border border-white/5">
            Belum ada booking.
          </div>
        )}
        {!isLoading && filtered.map((b) => {
          const isActionNeeded = ["PENDING", "PERLU_VERIFIKASI", "RESCHEDULE_REQUESTED"].includes(b.status.toUpperCase());
          
          return (
            <div 
              key={b.id}
              className={`relative bg-[#0F0F0F]/60 backdrop-blur-md rounded-[1.5rem] border border-white/5 shadow-lg hover:shadow-2xl hover:border-white/10 transition-all duration-300 overflow-hidden flex flex-col group min-h-[250px] justify-between
                ${isActionNeeded ? "bg-amber-500/[0.02] border-amber-500/20 shadow-[0_4px_25px_-5px_rgba(251,191,36,0.08)]" : ""}
              `}
            >
              {/* Action Needed Tag */}
              {isActionNeeded && (
                <div className="absolute top-0 right-0 bg-amber-400 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-md z-10 select-none italic">
                  <span className="animate-pulse">⚡</span> Action
                </div>
              )}

              {/* Top border accent line */}
              <div className={`h-[3px] w-full bg-gradient-to-r ${isActionNeeded ? "from-amber-400 to-amber-300" : "from-neon to-neon/40"}`} />
              
              <div className="p-6 flex-1 space-y-4">
                <div>
                  {/* Court name */}
                  <h3 className="font-black text-white text-base tracking-tight uppercase italic pr-12 truncate" title={b.court?.name ?? "—"}>
                    {b.court?.name ?? "—"}
                  </h3>
                  {/* Date & Time */}
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                    📅 {String(b.date).slice(0, 10)} · {formatMinutesToHHmm(b.startTime)}–{formatMinutesToHHmm(b.endTime)}
                  </p>
                </div>

                <div className="space-y-2 border-t border-white/[0.03] pt-4">
                  {/* User Profile */}
                  <p className="text-xs font-bold text-white/70 flex items-center gap-2 truncate" title={b.user?.name ?? "—"}>
                    <span className="text-white/40">👤</span> {b.user?.name ?? "—"}
                  </p>
                  
                  {/* Booking Code */}
                  <div className="text-[9px] font-black text-neon bg-neon/10 border border-neon/20 px-2.5 py-1 rounded uppercase tracking-wider inline-block">
                    {b.bookingCode || "OLD RESERVATION"}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/[0.03]">
                  <span className="text-sm font-black text-white">
                    Rp {Number(b.totalPrice ?? 0).toLocaleString("id-ID")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusPill status={b.status} />
                    <CourtAvailTag booking={b} />
                  </div>
                </div>
              </div>

              {/* Action Button Footer */}
              <div className="border-t border-white/5 px-5 py-4 bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                <button 
                  onClick={() => setSelected(b)}
                  className={`w-full text-[10px] font-black uppercase tracking-widest rounded-xl py-3 text-center transition-all duration-300 cursor-pointer active:scale-95
                    ${isActionNeeded 
                      ? "bg-amber-400 text-black shadow-md hover:bg-amber-300 hover:scale-[1.02]" 
                      : "text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white"}
                  `}
                >
                  Detail & Proses
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300"
          onClick={() => setSelected(null)}>
          <div className="bg-[#0F0F0F] border border-white/10 w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-[#1A1A1A]/90 backdrop-blur-xl border-b border-white/5 px-8 pt-7 pb-6 flex justify-between items-start z-10">
              <div>
                <p className="text-[10px] font-black text-neon uppercase tracking-widest mb-1">Detail Booking</p>
                <h3 className="text-3xl font-black text-white tracking-tight">{selected.bookingCode || selected.id}</h3>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors text-sm font-bold flex items-center justify-center">
                ✕
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Info rows */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                {[
                  ["Kode", selected.bookingCode || "—"],
                  ["Court", selected.court?.name ?? "—"],
                  ["Lokasi", selected.court?.location ?? "—"],
                  ["User", selected.user?.name ?? "—"],
                  ["WhatsApp", selected.user?.whatsapp ?? "—"],
                  ["Tanggal", String(selected.date).slice(0, 10)],
                  ["Jam", `${formatMinutesToHHmm(selected.startTime)} – ${formatMinutesToHHmm(selected.endTime)}`],
                  ["Total", `Rp ${Number(selected.totalPrice ?? 0).toLocaleString("id-ID")}`],
                  ["Payment", selected.payment?.status ?? "NOT_SUBMITTED"],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-4 items-center">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest w-24 shrink-0">{l}</span>
                    <span className="text-sm font-bold text-white break-words">{v}</span>
                  </div>
                ))}
                <div className="flex gap-4 items-center pt-2 border-t border-white/5 mt-4">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest w-24 shrink-0">Status</span>
                  <StatusPill status={selected.status} />
                  <CourtAvailTag booking={selected} />
                </div>
              </div>

              {/* Reschedule Request Info */}
              {selected.status === "RESCHEDULE_REQUESTED" && selected.rescheduleDate && (
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-3xl p-6 space-y-3">
                  <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Permintaan Reschedule</p>
                  <p className="text-lg font-black text-white">
                    {String(selected.rescheduleDate).slice(0, 10)} ·{" "}
                    {formatMinutesToHHmm(selected.rescheduleStartTime ?? 0)} – {formatMinutesToHHmm(selected.rescheduleEndTime ?? 0)}
                  </p>
                  {selected.rescheduleNote && (
                    <p className="text-sm text-white/60 font-medium">Catatan: {selected.rescheduleNote}</p>
                  )}
                  <div className="flex gap-3 pt-3">
                    <button
                      disabled={isProcessing}
                      onClick={() => patchReschedule(selected.id, "approve")}
                      className="flex-1 py-3 rounded-xl bg-teal-500 text-black text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60 hover:bg-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                      Approve
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => patchReschedule(selected.id, "reject")}
                      className="flex-1 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60">
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Proof */}
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Bukti Pembayaran</p>
                {selected.paymentProofUrl || selected.payment?.proofImage ? (
                  <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#1A1A1A]">
                    <img src={selected.paymentProofUrl ?? selected.payment?.proofImage}
                      alt="Bukti" className="w-full object-contain max-h-80" />
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 h-32 flex items-center justify-center text-white/40 text-sm font-bold">
                    Belum ada bukti
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                {["PENDING", "PERLU_VERIFIKASI"].includes(selected.status) && (
                  <div className="grid grid-cols-2 gap-3">
                    <button disabled={isProcessing} onClick={() => patchStatus(selected.id, "CONFIRMED")}
                      className="py-4 rounded-2xl bg-neon text-black text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 hover:bg-[#c4eb28] shadow-[0_0_20px_rgba(215,255,63,0.3)]">
                      Approve
                    </button>
                    <button disabled={isProcessing} onClick={() => patchStatus(selected.id, "CANCELLED")}
                      className="py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60">
                      Reject
                    </button>
                  </div>
                )}
                {["CONFIRMED", "RESCHEDULE_APPROVED"].includes(selected.status) && (
                  <div className="flex flex-col gap-3">
                    <button disabled={isProcessing} onClick={() => checkIn(selected.bookingCode || "")}
                      className="w-full py-4 rounded-2xl bg-neon text-black text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 hover:bg-[#c4eb28] shadow-[0_0_20px_rgba(215,255,63,0.3)]">
                      Confirm Check-in
                    </button>
                    <button disabled={isProcessing} onClick={() => patchStatus(selected.id, "CANCELLED")}
                      className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60">
                      Cancel Booking
                    </button>
                  </div>
                )}
                {selected.status === "RESCHEDULE_REJECTED" && (
                  <button disabled={isProcessing} onClick={() => patchStatus(selected.id, "CANCELLED")}
                    className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60">
                    Cancel Booking
                  </button>
                )}
                {selected.status === "PENDING" && (
                  <button disabled={isProcessing} onClick={() => patchStatus(selected.id, "EXPIRED")}
                    className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-60">
                    Mark as Expired
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}