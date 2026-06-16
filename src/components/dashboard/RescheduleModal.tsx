"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatMinutesToHHmm } from "@/lib/bookingTime";
import { CalendarView } from "@/components/booking/CalendarView";

type Slot = { time: string; available: boolean };

type Booking = {
  id: string;
  date: string;
  startTime: number;
  endTime: number;
  court?: { name?: string; id?: string } | null;
  courtId?: string;
};

interface RescheduleModalProps {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}


export function RescheduleModal({ booking, onClose, onSuccess, onError }: RescheduleModalProps) {
  const courtId = (booking as any).courtId ?? booking.court?.id ?? "";

  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  // isSubmitting is derived from submitState below

  // Min date = 12 hours from now
  const minDate = new Date(Date.now() + 12 * 3600 * 1000).toISOString().slice(0, 10);

  const fetchSlots = useCallback(async (d: string) => {
    if (!d || !courtId) return;
    setIsFetchingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/courts/availability?courtId=${courtId}&date=${d}`);
      if (!res.ok) throw new Error("Gagal memuat slot");
      const data: Slot[] = await res.json();

      // Disable past slots if selected date is today
      const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      const isToday = d === new Date().toISOString().slice(0, 10);

      setSlots(
        data.map((s) => {
          if (isToday) {
            const [h, m] = s.time.split(" - ")[0].split(":").map(Number);
            if (h * 60 + m <= nowMinutes) return { ...s, available: false };
          }
          return s;
        }),
      );
    } catch {
      onError("Gagal memuat slot waktu. Coba lagi.");
    } finally {
      setIsFetchingSlots(false);
    }
  }, [courtId, onError]);

  useEffect(() => {
    if (date) fetchSlots(date);
  }, [date, fetchSlots]);

  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async () => {
    if (!date || !selectedSlot) {
      setSubmitState("error");
      setSubmitError("Pilih tanggal dan jam terlebih dahulu.");
      return;
    }

    const payload = { date, timeSlot: selectedSlot, note: note || undefined };
    console.log("[Reschedule] Submitting:", payload);

    setSubmitState("loading");
    setSubmitError("");

    try {
      const res = await fetch(`/api/bookings/${booking.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();
      console.log("[Reschedule] Response:", res.status, responseData);

      if (!res.ok) {
        throw new Error(responseData.error || `Gagal (status ${res.status})`);
      }

      // Success — show green panel briefly, then close
      setSubmitState("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan tak terduga.";
      console.error("[Reschedule] Error:", msg);
      setSubmitState("error");
      setSubmitError(msg);
    }
  };

  const totalAvailable = slots.filter((s) => s.available).length;
  const isSubmitting = submitState === "loading";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={() => submitState !== "loading" && submitState !== "success" && onClose()}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-[11px] font-black text-violet-500 uppercase tracking-widest">
              Ajukan Reschedule
            </p>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              {booking.court?.name ?? "Lapangan"}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Jadwal saat ini:{" "}
              <span className="font-bold text-slate-700">
                {String(booking.date).slice(0, 10)} ·{" "}
                {formatMinutesToHHmm(booking.startTime)}–{formatMinutesToHHmm(booking.endTime)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-500 font-bold text-sm flex items-center justify-center transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Date picker */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Pilih Tanggal Baru
            </p>
            <CalendarView 
              selectedDate={date ? new Date(date + "T00:00:00Z") : null}
              onSelectDate={(newD) => {
                const isoStr = newD.toISOString().split("T")[0];
                setDate(isoStr);
                setSelectedSlot(null);
              }}
              courtId={booking.courtId}
            />
          </div>

          {/* Slot picker */}
          {date && (
            <div className="space-y-4">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Pilih Jam
                </p>
                {!isFetchingSlots && slots.length > 0 && (
                  <span className="text-[11px] font-bold text-slate-400">
                    {totalAvailable} slot tersedia
                  </span>
                )}
              </div>

              {/* Loading skeleton */}
              {isFetchingSlots && (
                <div className="space-y-3">
                  {[3, 4, 4].map((count, gi) => (
                    <div key={gi} className="space-y-2">
                      <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2`}>
                        {Array.from({ length: count }).map((_, i) => (
                          <div key={i} className="h-9 rounded-xl bg-slate-100 animate-pulse" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isFetchingSlots && slots.length > 0 && totalAvailable === 0 && (
                <div className="py-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-2xl mb-1">😔</p>
                  <p className="text-sm font-bold text-slate-500">
                    Tidak ada slot tersedia di tanggal ini
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Coba pilih tanggal lain</p>
                </div>
              )}

              {/* No data at all */}
              {!isFetchingSlots && slots.length === 0 && (
                <div className="py-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-sm font-bold text-slate-400">Tidak ada data slot</p>
                </div>
              )}

              {/* Grouped slots */}
              {!isFetchingSlots && slots.length > 0 && totalAvailable > 0 && (
                <div className="max-h-[240px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {slots.map((s) => {
                      const isSelected = selectedSlot === s.time;
                      const isUnavailable = !s.available;
                      return (
                        <button
                          key={s.time}
                          disabled={isUnavailable}
                          onClick={() => setSelectedSlot(isSelected ? null : s.time)}
                          className={`
                            relative px-2 py-2.5 rounded-xl text-xs font-black border
                            transition-all duration-150 active:scale-95
                            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1
                            ${
                              isUnavailable
                                ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through"
                                : isSelected
                                  ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200/60 scale-[1.03]"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                            }
                          `}
                        >
                          {isUnavailable && (
                            <span className="absolute top-1 right-1 text-[9px] text-slate-300">✕</span>
                          )}
                          {isSelected && (
                            <span className="absolute top-1 right-1 text-[10px] text-violet-200">✓</span>
                          )}
                          <span className="block truncate">{s.time}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected slot display */}
              {selectedSlot && (
                <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5">
                  <span className="text-violet-500 text-base">📅</span>
                  <div>
                    <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest leading-none">
                      Jam dipilih
                    </p>
                    <p className="text-sm font-black text-violet-900 mt-0.5">{selectedSlot}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="ml-auto text-violet-400 hover:text-violet-600 font-bold text-xs transition-colors"
                  >
                    Ganti
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Catatan <span className="normal-case font-medium text-slate-400">(opsional)</span>
            </label>
            <input
              type="text"
              placeholder="Alasan reschedule, misal: ada keperluan mendadak…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 text-sm font-medium border border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-300 transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Warning banner */}
          <div className="flex gap-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-base shrink-0">⚠️</span>
            <p>
              Reschedule hanya bisa jika <strong>lebih dari 12 jam</strong> sebelum jadwal
              saat ini. Admin akan mereview permintaan Anda sebelum perubahan berlaku.
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0 bg-white rounded-b-3xl space-y-3">
          {/* Success feedback */}
          {submitState === "success" && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-sm font-black text-emerald-700">Permintaan Terkirim!</p>
                <p className="text-xs text-emerald-600 font-medium">Menunggu persetujuan admin...</p>
              </div>
            </div>
          )}
          {/* Error feedback */}
          {submitState === "error" && submitError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <span className="text-base mt-0.5">❌</span>
              <div>
                <p className="text-sm font-black text-red-700">Gagal Mengirim</p>
                <p className="text-xs text-red-600 font-medium">{submitError}</p>
              </div>
              <button
                onClick={() => setSubmitState("idle")}
                className="ml-auto text-red-400 hover:text-red-600 font-bold text-xs transition-colors shrink-0"
              >
                Tutup
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              disabled={isSubmitting || submitState === "success"}
              onClick={onClose}
            >
              Batal
            </Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
              isLoading={isSubmitting}
              disabled={!date || !selectedSlot || isSubmitting || submitState === "success"}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Mengirim..." : "Kirim Permintaan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
