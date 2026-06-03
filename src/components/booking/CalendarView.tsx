"use client";

import { useState, useEffect, useMemo } from "react";

interface CalendarViewProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  courtId: string | null;
  membershipStatus: string;
  onLockedDateClick: () => void;
}

interface DayAvailability {
  date: string;
  availableSlots: number;
  totalSlots: number;
}

export function CalendarView({ 
  selectedDate, 
  onSelectDate, 
  courtId, 
  membershipStatus,
  onLockedDateClick 
}: CalendarViewProps) {
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);

  const monthStart = useMemo(() => {
    return new Date(Date.UTC(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1));
  }, [currentViewDate]);

  const monthEnd = useMemo(() => {
    return new Date(Date.UTC(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 0));
  }, [currentViewDate]);

  const isNextMonthAvailable = useMemo(() => {
    const now = new Date();
    const nextMonthLimit = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
    return currentViewDate < nextMonthLimit;
  }, [currentViewDate]);

  const isPrevMonthAvailable = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    return currentViewDate > currentMonthStart;
  }, [currentViewDate]);

  useEffect(() => {
    if (!courtId) return;

    const fetchAvailability = async () => {
      setIsLoading(true);
      try {
        const month = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, "0")}`;
        const res = await fetch(`/api/courts/availability/monthly?courtId=${courtId}&month=${month}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setAvailability(data);
        }
      } catch (error) {
        console.error("Failed to fetch monthly availability:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [courtId, currentViewDate]);

  const daysInMonth = monthEnd.getUTCDate();
  const firstDayOfWeek = monthStart.getUTCDay(); // 0 (Sun) to 6 (Sat)

  const calendarDays = [];
  // Padding for start of month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const handlePrevMonth = () => {
    if (isPrevMonthAvailable) {
      setCurrentViewDate(new Date(Date.UTC(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1)));
    }
  };

  const handleNextMonth = () => {
    if (isNextMonthAvailable) {
      setCurrentViewDate(new Date(Date.UTC(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1)));
    }
  };

  const getDayStatus = (day: number) => {
    const dateStr = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const avail = availability.find(a => a.date === dateStr);
    if (!avail) return "unknown";
    
    const ratio = avail.availableSlots / avail.totalSlots;
    if (ratio === 0) return "full";
    if (ratio < 0.3) return "low";
    return "high";
  };

  const getAvailableCount = (day: number) => {
    const dateStr = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const avail = availability.find(a => a.date === dateStr);
    return avail ? `${avail.availableSlots} / ${avail.totalSlots}` : "";
  };

  return (
    <div className="bg-[#0F0F0F] rounded-[2rem] border border-white/5 p-6 shadow-2xl overflow-hidden backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-white">
          {currentViewDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            disabled={!isPrevMonthAvailable}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ←
          </button>
          <button
            onClick={handleNextMonth}
            disabled={!isNextMonthAvailable}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-white/40 uppercase tracking-widest py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 relative min-h-[280px]">
        {isLoading && (
          <div className="absolute inset-0 bg-[#0B0B0B]/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-neon/30 border-t-neon rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-white/50">Memuat Jadwal...</span>
            </div>
          </div>
        )}
        
        {calendarDays.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;
          
          const date = new Date(Date.UTC(currentViewDate.getFullYear(), currentViewDate.getMonth(), day));
          const isPast = date < today;
          const isSelected = selectedDate?.getUTCDate() === day && 
                             selectedDate?.getUTCMonth() === currentViewDate.getMonth() &&
                             selectedDate?.getUTCFullYear() === currentViewDate.getFullYear();
          const isToday = today.getUTCDate() === day && 
                          today.getUTCMonth() === currentViewDate.getMonth() &&
                          today.getUTCFullYear() === currentViewDate.getFullYear();
          
          const isMember = membershipStatus === "ACTIVE";
          const maxDays = isMember ? 14 : 7;
          
          // Use UTC for comparison to avoid timezone issues with currentViewDate
          const compareToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
          const diffDays = Math.ceil((date.getTime() - compareToday.getTime()) / (1000 * 60 * 60 * 24));
          const isLocked = !isPast && diffDays > maxDays;
          
          const status = getDayStatus(day);
          
          return (
            <button
              key={day}
              disabled={isPast || !courtId}
              onClick={() => isLocked ? onLockedDateClick() : onSelectDate(date)}
              className={`
                group relative flex flex-col items-center justify-center h-12 rounded-xl transition-all overflow-hidden
                ${isPast ? "opacity-20 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
                ${isLocked ? "bg-black/40 grayscale border-white/5 cursor-pointer" : isSelected ? "bg-neon text-black shadow-[0_0_15px_rgba(215,255,63,0.3)] z-10" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}
                ${isToday && !isSelected ? "ring-2 ring-neon/50 ring-offset-2 ring-offset-[#0F0F0F]" : ""}
              `}
              title={isPast ? "Masa lalu" : isLocked ? "Elite Member Access Required" : `Tersedia ${getAvailableCount(day)} slot`}
            >
              {isLocked && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-0.5">
                   <span className="text-[10px] font-black text-white/20 italic leading-none mb-0.5">{day}</span>
                   <div className="text-[6px] font-black text-neon uppercase tracking-tighter text-center leading-none opacity-60">Elite<br/>Access</div>
                </div>
              )}

              {!isLocked && (
                <>
                  <span className={`text-sm font-black ${isSelected ? "text-black" : "text-white"}`}>{day}</span>
                  
                  {!isPast && courtId && (
                    <div className="flex gap-0.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        status === "high" ? "bg-neon" : 
                        status === "low" ? "bg-amber-500" : 
                        status === "full" ? "bg-red-500" : "bg-white/20"
                      }`} />
                    </div>
                  )}
                  
                  {!isPast && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-black text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-xl">
                      {getAvailableCount(day)} Slot
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neon" />
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Tersedia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Hampir Penuh</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Penuh</span>
        </div>
      </div>
    </div>
  );
}
