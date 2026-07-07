/**
 * Timezone helpers for Asia/Jakarta (WIB) timezone.
 * Using native Intl.DateTimeFormat to avoid timezone offset discrepancies between server and client.
 */

export interface JakartaTime {
  dateStr: string;      // YYYY-MM-DD
  hour: number;
  minute: number;
  nowMinutes: number;   // Minutes since midnight (hour * 60 + minute)
  year: number;
  month: number;
  day: number;
}

export function getJakartaTime(dateInput: Date = new Date()): JakartaTime {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(dateInput);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);
  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const nowMinutes = hour * 60 + minute;

  return {
    dateStr,
    hour,
    minute,
    nowMinutes,
    year,
    month,
    day,
  };
}

export function convertToJakartaTime(date: Date): JakartaTime {
  return getJakartaTime(date);
}
