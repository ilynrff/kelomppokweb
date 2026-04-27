"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { formatMinutesToHHmm } from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchJson } from "@/lib/fetchJson";

type Booking = {
  id: string;
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
  user?: { name?: string; email?: string };
  court?: { name?: string; location?: string };
  payment?: { status?: string; proofImage?: string } | null;
};

type Props = { initialBookings?: Booking[]; isLoading?: boolean };

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:               { label: "Menunggu Bayar",     bg: "bg-orange-100", text: "text-orange-700" },
  PERLU_VERIFIKASI:      { label: "Perlu Verifikasi",   bg: "bg-amber-100",  text: "text-amber-700" },
  CONFIRMED:             { label: "Confirmed",           bg: "bg-emerald-100",text: "text-emerald-700" },
  CANCELLED:             { label: "Cancelled",           bg: "bg-red-100",    text: "text-red-700" },
  EXPIRED:               { label: "Expired",             bg: "bg-slate-200",  text: "text-slate-600" },
  COMPLETED:             { label: "Completed",           bg: "bg-blue-100",   text: "text-blue-700" },
  RESCHEDULE_REQUESTED:  { label: "Reschedule ⏳",       bg: "bg-violet-100", text: "text-violet-700" },
  RESCHEDULE_APPROVED:   { label: "Reschedule ✓",       bg: "bg-teal-100",   text: "text-teal-700" },
  RESCHEDULE_REJECTED:   { label: "Reschedule ✕",       bg: "bg-rose-100",   text: "text-rose-700" },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status.toUpperCase()] ?? { label: status, bg: "bg-slate-100", text: "text-slate-700" };
  return (
    <span className={`inline-block text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function CourtAvailTag({ booking }: { booking: Booking }) {
  const s = String(booking.status).toUpperCase();
  if (!["CONFIRMED", "RESCHEDULE_APPROVED"].includes(s)) return null;
  const now = new Date();
  const start = new Date(booking.date);
  start.setUTCMinutes(start.getUTCMinutes() + booking.startTime);
  const end = new Date(booking.date);
  end.setUTCMinutes(end.getUTCMinutes() + booking.endTime);
  if (now >= start && now < end) return <span className="text-[11px] font-bold text-red-600">🔴 Sedang Dipakai</span>;
  if (now < start) return <span className="text-[11px] font-bold text-amber-600">🟡 Akan Dipakai</span>;
  return <span className="text-[11px] font-medium text-slate-400">Selesai</span>;
}

export function BookingManager({ initialBookings = [], isLoading = false }: Props) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastQueue, setToastQueue] = useState<{ msg: string; type: "success" | "error" }[]>([]);

  useEffect(() => { setBookings(initialBookings); }, [initialBookings]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToastQueue((q) => [...q, { msg, type }]);
    setTimeout(() => setToastQueue((q) => q.slice(1)), 3500);
  };

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchJson<Booking[]>("/api/bookings");
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) { showToast(getErrorMessage(e) || "Error", "error"); }
    finally { setIsRefreshing(false); }
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
      if (selected?.id === id) setSelected(data);
      showToast(`Status berhasil diubah ke ${STATUS_CONFIG[status]?.label ?? status}`, "success");
    } catch (e) { showToast(getErrorMessage(e) || "Gagal update", "error"); }
    finally { setIsProcessing(false); }
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
      if (selected?.id === id) setSelected(data);
      showToast(`Reschedule berhasil di-${action}`, "success");
    } catch (e) { showToast(getErrorMessage(e) || "Gagal", "error"); }
    finally { setIsProcessing(false); }
  };

  const filtered = useMemo(() => {
    let list = bookings.slice();
    if (filter !== "all") list = list.filter((b) => b.status.toUpperCase() === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <input
          type="text" placeholder="Cari user / court…"
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 min-w-[160px]"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold">
          <option value="all">Semua</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as "desc" | "asc")}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold">
          <option value="desc">Terbaru</option>
          <option value="asc">Terlama</option>
        </select>
        <Button variant="outline" onClick={refresh} isLoading={isRefreshing} className="shrink-0 text-sm">
          ↻ Refresh
        </Button>
      </div>

      {/* Card Grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading && [1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse h-40"/>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="sm:col-span-2 xl:col-span-3 bg-white rounded-2xl p-8 text-center text-slate-400 font-bold border border-slate-100">
            Tidak ada data.
          </div>
        )}
        {(!isLoading ? filtered : []).map((b) => (
          <div key={b.id}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
            {/* Court image strip */}
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-400" />
            <div className="p-4 flex-1 space-y-2">
              {/* Court name */}
              <div className="font-black text-slate-900 text-sm truncate" title={b.court?.name ?? "—"}>
                {b.court?.name ?? "—"}
              </div>
              {/* User */}
              <div className="text-xs text-slate-500 font-semibold truncate" title={b.user?.name ?? "—"}>
                {b.user?.name ?? "—"}
              </div>
              {/* Date & time */}
              <div className="text-xs font-bold text-slate-700">
                {String(b.date).slice(0, 10)} · {formatMinutesToHHmm(b.startTime)}–{formatMinutesToHHmm(b.endTime)}
              </div>
              {/* Price */}
              <div className="text-sm font-black text-blue-700">
                Rp {Number(b.totalPrice ?? 0).toLocaleString("id-ID")}
              </div>
              {/* Status row */}
              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill status={b.status} />
                <CourtAvailTag booking={b} />
              </div>
            </div>
            {/* Footer */}
            <div className="border-t border-slate-100 px-4 py-3">
              <button onClick={() => setSelected(b)}
                className="w-full text-xs font-black text-blue-600 border border-blue-200 rounded-xl py-2 hover:bg-blue-50 active:scale-95 transition-all">
                Lihat Detail
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Drawer / Modal */}
      {selected && (
        <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-white w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 pt-5 pb-4 flex justify-between items-start rounded-t-3xl">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking Detail</p>
                <h3 className="text-lg font-black text-slate-900">{String(selected.id).slice(0, 12)}…</h3>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Info rows */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                {[
                  ["Court", selected.court?.name ?? "—"],
                  ["Lokasi", selected.court?.location ?? "—"],
                  ["User", selected.user?.name ?? "—"],
                  ["Email", selected.user?.email ?? "—"],
                  ["Tanggal", String(selected.date).slice(0, 10)],
                  ["Jam", `${formatMinutesToHHmm(selected.startTime)} – ${formatMinutesToHHmm(selected.endTime)}`],
                  ["Total", `Rp ${Number(selected.totalPrice ?? 0).toLocaleString("id-ID")}`],
                  ["Payment", selected.payment?.status ?? "NOT_SUBMITTED"],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest w-20 shrink-0 pt-0.5">{l}</span>
                    <span className="text-sm font-bold text-slate-800 break-words">{v}</span>
                  </div>
                ))}
                <div className="flex gap-3 items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest w-20 shrink-0">Status</span>
                  <StatusPill status={selected.status} />
                  <CourtAvailTag booking={selected} />
                </div>
              </div>

              {/* Reschedule Request Info */}
              {selected.status === "RESCHEDULE_REQUESTED" && selected.rescheduleDate && (
                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-black text-violet-700 uppercase tracking-widest">Permintaan Reschedule</p>
                  <p className="text-sm font-bold text-violet-900">
                    {String(selected.rescheduleDate).slice(0, 10)} ·{" "}
                    {formatMinutesToHHmm(selected.rescheduleStartTime ?? 0)} – {formatMinutesToHHmm(selected.rescheduleEndTime ?? 0)}
                  </p>
                  {selected.rescheduleNote && (
                    <p className="text-xs text-violet-600">Catatan: {selected.rescheduleNote}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      disabled={isProcessing}
                      onClick={() => patchReschedule(selected.id, "approve")}
                      className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-colors disabled:opacity-60">
                      ✓ Approve Reschedule
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => patchReschedule(selected.id, "reject")}
                      className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition-colors disabled:opacity-60">
                      ✕ Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Proof */}
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Bukti Pembayaran</p>
                {selected.paymentProofUrl || selected.payment?.proofImage ? (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={selected.paymentProofUrl ?? selected.payment?.proofImage}
                      alt="Bukti" className="w-full object-contain max-h-60" />
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 h-28 flex items-center justify-center text-slate-400 text-sm font-bold">
                    Belum ada bukti
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {["PENDING", "PERLU_VERIFIKASI"].includes(selected.status) && (
                  <div className="grid grid-cols-2 gap-2">
                    <button disabled={isProcessing} onClick={() => patchStatus(selected.id, "CONFIRMED")}
                      className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors disabled:opacity-60">
                      ✓ Approve
                    </button>
                    <button disabled={isProcessing} onClick={() => patchStatus(selected.id, "CANCELLED")}
                      className="py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-black transition-colors disabled:opacity-60">
                      ✕ Reject
                    </button>
                  </div>
                )}
                {["CONFIRMED", "RESCHEDULE_REJECTED"].includes(selected.status) && (
                  <button disabled={isProcessing} onClick={() => patchStatus(selected.id, "CANCELLED")}
                    className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-colors disabled:opacity-60">
                    Cancel Booking
                  </button>
                )}
                {selected.status === "PENDING" && (
                  <button disabled={isProcessing} onClick={() => patchStatus(selected.id, "EXPIRED")}
                    className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 text-xs font-semibold transition-colors disabled:opacity-60">
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