export function validateBookingMonth(bookingDate: Date): { valid: boolean; error?: string } {
  const now = new Date();
  
  // Normalize dates to start of day for comparison
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const bDate = new Date(Date.UTC(bookingDate.getUTCFullYear(), bookingDate.getUTCMonth(), bookingDate.getUTCDate()));

  if (bDate < today) {
    return { valid: false, error: "Tanggal booking tidak boleh di masa lalu." };
  }

  const currentMonth = now.getUTCMonth();
  const currentYear = now.getUTCFullYear();
  
  const nextMonthDate = new Date(Date.UTC(currentYear, currentMonth + 1, 1));
  const nextMonth = nextMonthDate.getUTCMonth();
  const nextMonthYear = nextMonthDate.getUTCFullYear();

  const bMonth = bDate.getUTCMonth();
  const bYear = bDate.getUTCFullYear();

  const isCurrentMonth = bMonth === currentMonth && bYear === currentYear;
  const isNextMonth = bMonth === nextMonth && bYear === nextMonthYear;

  if (!isCurrentMonth && !isNextMonth) {
    return { valid: false, error: "Booking hanya tersedia untuk bulan ini dan bulan berikutnya." };
  }

  return { valid: true };
}
