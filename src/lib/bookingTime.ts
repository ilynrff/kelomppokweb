export const DEFAULT_OPEN_MINUTES = 8 * 60; // 08:00
export const DEFAULT_CLOSE_MINUTES = 20 * 60; // 20:00
export const DEFAULT_SLOT_MINUTES = 60;

export function formatMinutesToHHmm(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function parseHHmmToMinutes(value: string) {
  const m = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function parseSlotToRange(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const parts = normalized.split("-");
  if (parts.length !== 2) return null;
  const start = parseHHmmToMinutes(parts[0].trim());
  const end = parseHHmmToMinutes(parts[1].trim());
  if (start === null || end === null) return null;
  if (end <= start) return null;
  return { start, end };
}

export function coerceDateOnlyUTC(value: string) {
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  const date = new Date(`${match[1]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function buildDailySlotLabels(
  openMinutes = DEFAULT_OPEN_MINUTES,
  closeMinutes = DEFAULT_CLOSE_MINUTES,
  slotMinutes = DEFAULT_SLOT_MINUTES,
) {
  const slots: { start: number; end: number; label: string }[] = [];
  for (let start = openMinutes; start + slotMinutes <= closeMinutes; start += slotMinutes) {
    const end = start + slotMinutes;
    slots.push({
      start,
      end,
      label: `${formatMinutesToHHmm(start)} - ${formatMinutesToHHmm(end)}`,
    });
  }
  return slots;
}

export function rangesOverlap(a: { start: number; end: number }, b: { start: number; end: number }) {
  return a.start < b.end && a.end > b.start;
}

export function getVirtualStatus(booking: { status: string; date: Date | string; startTime: number; endTime: number }) {
  const s = String(booking.status).toUpperCase();
  // Only apply virtual override for active/confirmed bookings
  if (!["CONFIRMED", "CHECKED_IN", "RESCHEDULE_APPROVED"].includes(s)) {
    return s;
  }

  const now = new Date();
  // Local Semarang Time (UTC+7)
  const localNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const localTodayStr = localNow.toISOString().split("T")[0];
  const bookingDateStr = new Date(booking.date).toISOString().split("T")[0];
  const nowMinutes = localNow.getUTCHours() * 60 + localNow.getUTCMinutes();

  if (bookingDateStr < localTodayStr) return "COMPLETED";
  if (bookingDateStr > localTodayStr) return s;

  // Same day
  if (nowMinutes > booking.endTime) return "COMPLETED";
  if (nowMinutes >= booking.startTime) return "ONGOING";

  return s;
}

