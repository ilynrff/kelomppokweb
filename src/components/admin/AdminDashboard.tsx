"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Check, X, Eye, Clock, ExternalLink, User, 
  Search, Filter, Calendar, ChevronRight, ArrowUpRight, 
  AlertCircle, DollarSign, TrendingUp, Users, ShieldAlert,
  Flame, BookOpen, Trash2, Phone
} from "lucide-react";
import { BookingManager } from "./BookingManager";
import { CourtManager } from "./CourtManager";
import { MembershipManager } from "./MembershipManager";
import { getSessionLifecycleState, getOpenMatchLifecycleState } from "@/lib/bookingTime";
import { Toast } from "@/components/ui/Toast";

type Booking = {
  id: string;
  bookingCode?: string | null;
  date: string;
  startTime: number;
  endTime: number;
  status: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  paymentApprovedAt?: string | null;
  paymentProofUrl?: string;
  rescheduleDate?: string | null;
  rescheduleStartTime?: number | null;
  rescheduleEndTime?: number | null;
  rescheduleNote?: string | null;
  user?: { id: string; name?: string; whatsapp?: string; membership?: string };
  court?: { id: string; name?: string; location?: string; pricePerHour?: number; venue?: { name?: string; id?: string } };
  payment?: { status?: string; proofImage?: string } | null;
  equipmentPackage?: string;
  equipmentPrice?: number;
};

type MembershipRequest = {
  id: string;
  userId: string;
  proofImage: string;
  status: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
  user?: { name?: string; whatsapp?: string };
};

type UserItem = {
  id: string;
  name: string;
  whatsapp: string;
  membership: string;
  membershipStatus: string;
  membershipExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  bookings: {
    id: string;
    bookingCode?: string | null;
    date: string;
    startTime: number;
    endTime: number;
    status: string;
    totalPrice: number;
    createdAt: string;
    updatedAt: string;
    paymentApprovedAt?: string | null;
    court?: { name?: string; location?: string } | null;
    payment?: { status?: string; proofImage?: string } | null;
  }[];
  membershipRequests: {
    id: string;
    status: string;
    amount: number;
    createdAt: string;
  }[];
};

type OpenMatch = {
  id: string;
  bookingId: string;
  hostId: string;
  title: string;
  matchType: string;
  skillLevel: string;
  maxPlayers: number;
  pricePerPlayer?: number | null;
  description?: string | null;
  visibility: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    date: string;
    startTime: number;
    endTime: number;
    status: string;
    paymentApprovedAt?: string | null;
    court?: { name?: string; location?: string; venue?: { name?: string } } | null;
  };
  host?: { name?: string; whatsapp?: string };
  players: {
    id: string;
    createdAt: string;
    player?: { name?: string; whatsapp?: string };
  }[];
};

type CourtItem = {
  id: string;
  venueId: string;
  name: string;
  type?: string | null;
  location: string;
  pricePerHour: number;
  isActive: boolean;
  venue?: { name?: string; id?: string };
};

type StatItem = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
};

type Props = {
  initialBookings: Booking[];
  membershipRequests: MembershipRequest[];
  initialUsers: UserItem[];
  initialOpenMatches: OpenMatch[];
  initialCourts: CourtItem[];
  session?: any;
};

const TABS = [
  { id: "bookings", label: "Booking Management", icon: "📋" },
  { id: "finance", label: "Financial Management", icon: "💰" },
  { id: "users", label: "User Management", icon: "👥" },
  { id: "schedule", label: "Court Schedule", icon: "📅" },
  { id: "matches", label: "Open Match Management", icon: "🔥" },
  { id: "courts", label: "Venue & Courts", icon: "🏟️" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// Timezone Helpers
const getJakartaDateParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find(p => p.type === "year")!.value, 10);
  const month = parseInt(parts.find(p => p.type === "month")!.value, 10) - 1;
  const day = parseInt(parts.find(p => p.type === "day")!.value, 10);
  return { year, month, day };
};

const getJakartaMidnightTimestamp = (date: Date) => {
  const { year, month, day } = getJakartaDateParts(date);
  return new Date(year, month, day).getTime();
};

const getJakartaTodayStr = () => {
  const now = new Date();
  const localNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return localNow.toISOString().split("T")[0];
};

// Filtering by Play Date (date)
const isWithinPlayDate = (dateStr: string, timeframe: string, customStart?: string, customEnd?: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const tB = getJakartaMidnightTimestamp(date);
  const tNow = getJakartaMidnightTimestamp(now);

  switch (timeframe) {
    case "TODAY":
      return tB === tNow;
    case "TOMORROW": {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tB === getJakartaMidnightTimestamp(tomorrow);
    }
    case "WEEK":
      // Play date within past 7 days up to today
      return tB >= tNow - 6 * 24 * 60 * 60 * 1000 && tB <= tNow;
    case "CUSTOM": {
      if (!customStart) return true;
      const [sY, sM, sD] = customStart.split("-").map(Number);
      const tStart = new Date(sY, sM - 1, sD).getTime();
      const tEnd = customEnd ? (() => {
        const [eY, eM, eD] = customEnd.split("-").map(Number);
        return new Date(eY, eM - 1, eD).getTime();
      })() : tNow;
      return tB >= tStart && tB <= tEnd;
    }
    case "ALL":
    default:
      return true;
  }
};

// Filtering by Payment Approved Date
const isWithinPaymentDate = (dateStr: string | null | undefined, timeframe: string, customStart?: string, customEnd?: string) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const tB = getJakartaMidnightTimestamp(date);
  const tNow = getJakartaMidnightTimestamp(now);

  switch (timeframe) {
    case "TODAY":
      return tB === tNow;
    case "YESTERDAY": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return tB === getJakartaMidnightTimestamp(yesterday);
    }
    case "WEEK":
      return tB >= tNow - 6 * 24 * 60 * 60 * 1000 && tB <= tNow;
    case "MONTH":
      return tB >= tNow - 29 * 24 * 60 * 60 * 1000 && tB <= tNow;
    case "YEAR":
      return tB >= tNow - 364 * 24 * 60 * 60 * 1000 && tB <= tNow;
    case "CUSTOM": {
      if (!customStart) return true;
      const [sY, sM, sD] = customStart.split("-").map(Number);
      const tStart = new Date(sY, sM - 1, sD).getTime();
      const tEnd = customEnd ? (() => {
        const [eY, eM, eD] = customEnd.split("-").map(Number);
        return new Date(eY, eM - 1, eD).getTime();
      })() : tNow;
      return tB >= tStart && tB <= tEnd;
    }
    case "ALL":
    default:
      return true;
  }
};

export function AdminDashboard({ 
  initialBookings, 
  membershipRequests: initialMemberships, 
  initialUsers, 
  initialOpenMatches, 
  initialCourts,
  session 
}: Props) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("bookings");
  
  // Real-time local state arrays
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>(initialMemberships);
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [openMatches, setOpenMatches] = useState<OpenMatch[]>(initialOpenMatches);
  const [courts, setCourts] = useState<CourtItem[]>(initialCourts);

  // Timeframe states (Booking Management playDate filter)
  const [operationalTimeframe, setOperationalTimeframe] = useState<"ALL" | "TODAY" | "TOMORROW" | "WEEK" | "CUSTOM">("TODAY");
  const [opCustomStart, setOpCustomStart] = useState("");
  const [opCustomEnd, setOpCustomEnd] = useState("");

  // Timeframe states (Financial Management paymentApprovedAt filter)
  const [financialTimeframe, setFinancialTimeframe] = useState<"ALL" | "TODAY" | "YESTERDAY" | "WEEK" | "MONTH" | "YEAR" | "CUSTOM">("MONTH");
  const [finCustomStart, setFinCustomStart] = useState("");
  const [finCustomEnd, setFinCustomEnd] = useState("");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" as "success" | "error" });
  
  // User Management tab states
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Open Match tab filter
  const [matchFilter, setMatchFilter] = useState<"ACTIVE" | "EXPIRED" | "ALL">("ACTIVE");

  // Court Schedule interactive filters
  const [scheduleDate, setScheduleDate] = useState(getJakartaTodayStr());
  const [scheduleVenue, setScheduleVenue] = useState<string>("all");

  // Centralized top-level silent auto-polling interval
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped = data.map((b: any) => ({
              ...b,
              date: new Date(b.date).toISOString(),
              createdAt: new Date(b.createdAt).toISOString(),
              updatedAt: new Date(b.updatedAt).toISOString(),
              expiresAt: new Date(b.expiresAt).toISOString(),
              rescheduleDate: b.rescheduleDate ? new Date(b.rescheduleDate).toISOString() : null,
              paymentApprovedAt: b.paymentApprovedAt 
                ? new Date(b.paymentApprovedAt).toISOString() 
                : (["CONFIRMED", "COMPLETED", "CHECKED_IN", "RESCHEDULE_APPROVED"].includes(b.status) 
                    ? new Date(b.updatedAt).toISOString() 
                    : null),
              payment: b.payment
                ? {
                    ...b.payment,
                    createdAt: new Date(b.payment.createdAt).toISOString(),
                    updatedAt: new Date(b.payment.updatedAt).toISOString(),
                  }
                : null,
              paymentProofUrl: b.paymentProofUrl || undefined,
            }));
            setBookings(mapped);
          }
        }
      } catch (err) {
        console.error("Centralized auto-refresh failed:", err);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ open: true, message, type });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      window.location.reload();
    } catch (e) {
      showToast("Gagal memuat ulang data terbaru", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateBooking = (updated: Booking) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const handleRefreshBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped = data.map((b: any) => ({
            ...b,
            date: new Date(b.date).toISOString(),
            createdAt: new Date(b.createdAt).toISOString(),
            updatedAt: new Date(b.updatedAt).toISOString(),
            expiresAt: new Date(b.expiresAt).toISOString(),
            rescheduleDate: b.rescheduleDate ? new Date(b.rescheduleDate).toISOString() : null,
            paymentApprovedAt: b.paymentApprovedAt 
              ? new Date(b.paymentApprovedAt).toISOString() 
              : (["CONFIRMED", "COMPLETED", "CHECKED_IN", "RESCHEDULE_APPROVED"].includes(b.status) 
                  ? new Date(b.updatedAt).toISOString() 
                  : null),
            payment: b.payment
              ? {
                  ...b.payment,
                  createdAt: new Date(b.payment.createdAt).toISOString(),
                  updatedAt: new Date(b.payment.updatedAt).toISOString(),
                }
              : null,
            paymentProofUrl: b.paymentProofUrl || undefined,
          }));
          setBookings(mapped);
        }
      }
    } catch (err) {
      console.error("Refresh bookings failed:", err);
    }
  };

  // --- 1. OPERATIONAL FILTERING (Play Date) ---
  const operationalBookings = useMemo(() => {
    return bookings.filter((b) => 
      isWithinPlayDate(b.date, operationalTimeframe, opCustomStart, opCustomEnd)
    );
  }, [bookings, operationalTimeframe, opCustomStart, opCustomEnd]);

  // Operational Inbox: Needs Action Queue (Pending Payments, Reschedules, Membership Requests)
  const needsActionBookings = useMemo(() => {
    return bookings.filter(b => 
      ["PENDING", "PERLU_VERIFIKASI", "RESCHEDULE_REQUESTED"].includes(b.status.toUpperCase())
    );
  }, [bookings]);

  const totalNeedsActionCount = needsActionBookings.length;

  // Operational Metrics
  const opStats = useMemo(() => {
    const total = operationalBookings.length;
    
    // Derived Realtime states using centralized helper
    const upcoming = operationalBookings.filter(b => 
      ["CONFIRMED", "RESCHEDULE_APPROVED", "CHECKED_IN"].includes(b.status.toUpperCase()) &&
      getSessionLifecycleState(b) === "UPCOMING"
    ).length;
    
    const live = operationalBookings.filter(b => 
      ["CONFIRMED", "RESCHEDULE_APPROVED", "CHECKED_IN"].includes(b.status.toUpperCase()) &&
      getSessionLifecycleState(b) === "LIVE"
    ).length;

    // Mathematical Court Utilization Calculation:
    // booked hours / (courts count * 14 open hours per day * timeframe days)
    const timeframeDays = operationalTimeframe === "TODAY" || operationalTimeframe === "TOMORROW" 
      ? 1 
      : operationalTimeframe === "WEEK" 
      ? 7 
      : operationalTimeframe === "CUSTOM" && opCustomStart 
      ? (() => {
          const s = new Date(opCustomStart).getTime();
          const e = opCustomEnd ? new Date(opCustomEnd).getTime() : new Date().getTime();
          return Math.max(1, Math.round((e - s) / (24 * 60 * 60 * 1000)));
        })()
      : 30; // default standard

    const totalOpenHours = courts.length * 14 * timeframeDays;
    const bookedHours = operationalBookings
      .filter(b => ["CONFIRMED", "RESCHEDULE_APPROVED", "CHECKED_IN", "COMPLETED"].includes(b.status.toUpperCase()))
      .reduce((sum, b) => sum + (b.endTime - b.startTime) / 60, 0);
    const utilizationRate = Math.min(100, Math.round((bookedHours / Math.max(1, totalOpenHours)) * 100));

    return [
      {
        label: "Total Booking",
        value: total,
        icon: "📋",
        trend: "Dalam filter timeframe",
        color: "blue",
      },
      {
        label: "Live Sessions",
        value: live,
        icon: "🔴",
        trend: "Sedang bermain saat ini",
        color: "purple",
      },
      {
        label: "Upcoming Sessions",
        value: upcoming,
        icon: "⏰",
        trend: "Akan bermain",
        color: "yellow",
      },
      {
        label: "Court Utilization",
        value: `${utilizationRate}%`,
        icon: "📊",
        trend: `${bookedHours.toFixed(1)} jam / ${totalOpenHours} slot jam`,
        color: "green",
      }
    ];
  }, [operationalBookings, operationalTimeframe, opCustomStart, opCustomEnd, courts]);


  // --- 2. FINANCIAL FILTERING (Payment Approved Date) ---
  const financialBookings = useMemo(() => {
    return bookings.filter(b => {
      const approvalDate = b.paymentApprovedAt;
      return approvalDate ? isWithinPaymentDate(approvalDate, financialTimeframe, finCustomStart, finCustomEnd) : false;
    });
  }, [bookings, financialTimeframe, finCustomStart, finCustomEnd]);

  const financialMemberships = useMemo(() => {
    return membershipRequests.filter(m => 
      m.status.toUpperCase() === "CONFIRMED" && 
      isWithinPaymentDate(m.updatedAt, financialTimeframe, finCustomStart, finCustomEnd)
    );
  }, [membershipRequests, financialTimeframe, finCustomStart, finCustomEnd]);

  const transactionHistory = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      user: { name?: string; whatsapp?: string } | undefined;
      code: string;
      orderId: string;
      method: string;
      amount: number;
      status: string;
      type: "BOOKING" | "MEMBERSHIP";
    }> = [];

    bookings.forEach(b => {
      const txDate = b.paymentApprovedAt || b.createdAt;
      if (isWithinPaymentDate(txDate, financialTimeframe, finCustomStart, finCustomEnd)) {
        list.push({
          id: b.id,
          date: txDate,
          user: b.user ? { name: b.user.name, whatsapp: b.user.whatsapp } : undefined,
          code: b.bookingCode || "OLD",
          orderId: (b as any).midtransOrderId || "—",
          method: (b as any).paymentMethod || (b.paymentProofUrl ? "MANUAL TRANSFER" : "—"),
          amount: b.totalPrice,
          status: b.status,
          type: "BOOKING"
        });
      }
    });

    membershipRequests.forEach(m => {
      const txDate = m.paymentApprovedAt || m.updatedAt || m.createdAt;
      if (isWithinPaymentDate(txDate, financialTimeframe, finCustomStart, finCustomEnd)) {
        list.push({
          id: m.id,
          date: txDate,
          user: m.user ? { name: m.user.name, whatsapp: m.user.whatsapp } : undefined,
          code: "MEMBERSHIP",
          orderId: (m as any).midtransOrderId || "—",
          method: (m as any).paymentMethod || (m.proofImage ? "MANUAL TRANSFER" : "—"),
          amount: m.amount,
          status: m.status,
          type: "MEMBERSHIP"
        });
      }
    });

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [bookings, membershipRequests, financialTimeframe, finCustomStart, finCustomEnd]);

  // Financial Metrics
  const finStats = useMemo(() => {
    const revenueCollected = financialBookings
      .filter(b => ["CONFIRMED", "RESCHEDULE_APPROVED", "COMPLETED", "CHECKED_IN"].includes(b.status.toUpperCase()))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const membershipRevenue = financialMemberships.reduce((sum, m) => sum + (m.amount || 0), 0);
    const totalCashflow = revenueCollected + membershipRevenue;

    const pendingPaymentsSum = bookings
      .filter(b => ["PENDING", "PERLU_VERIFIKASI"].includes(b.status.toUpperCase()))
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    return [
      {
        label: "Revenue Collected",
        value: `Rp ${revenueCollected.toLocaleString("id-ID")}`,
        icon: "💸",
        trend: `Dari ${financialBookings.length} booking disetujui`,
        color: "green",
      },
      {
        label: "Membership Revenue",
        value: `Rp ${membershipRevenue.toLocaleString("id-ID")}`,
        icon: "💎",
        trend: `Dari ${financialMemberships.length} member disetujui`,
        color: "blue",
      },
      {
        label: "Awaiting Payments",
        value: `Rp ${pendingPaymentsSum.toLocaleString("id-ID")}`,
        icon: "⚡",
        trend: "Dalam verifikasi & pending",
        color: "yellow",
      },
      {
        label: "Total Income",
        value: `Rp ${totalCashflow.toLocaleString("id-ID")}`,
        icon: "💰",
        trend: "Total booking + member",
        color: "purple",
      }
    ];
  }, [financialBookings, financialMemberships, bookings]);


  // --- 3. USER MANAGEMENT GLOBAL INDEX SEARCH ---
  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const q = userSearch.toLowerCase();
    return users.filter(u => {
      const matchName = u.name.toLowerCase().includes(q);
      const matchPhone = u.whatsapp.includes(q);
      const matchBooking = u.bookings.some(b => 
        (b.bookingCode || "").toLowerCase().includes(q) ||
        (b.court?.name || "").toLowerCase().includes(q)
      );
      return matchName || matchPhone || matchBooking;
    });
  }, [users, userSearch]);


  // --- 4. OPEN MATCH REAL-TIME EXPIRED LIFE-CYCLE RULE ---
  const processedOpenMatches = useMemo(() => {
    return openMatches.map(match => {
      const state = getOpenMatchLifecycleState({
        date: match.booking.date,
        startTime: match.booking.startTime,
        endTime: match.booking.endTime,
      });

      return {
        ...match,
        isExpired: state === "EXPIRED",
      };
    });
  }, [openMatches]);

  const displayedOpenMatches = useMemo(() => {
    if (matchFilter === "ACTIVE") {
      return processedOpenMatches.filter(m => !m.isExpired);
    } else if (matchFilter === "EXPIRED") {
      return processedOpenMatches.filter(m => m.isExpired);
    }
    return processedOpenMatches;
  }, [processedOpenMatches, matchFilter]);


  // --- 5. COURT SCHEDULE LIVE TIMELINE GRID GENERATION ---
  const courtsTimelineData = useMemo(() => {
    const activeBookings = bookings.filter(b => 
      new Date(b.date).toISOString().split("T")[0] === scheduleDate &&
      ["CONFIRMED", "RESCHEDULE_APPROVED", "CHECKED_IN", "COMPLETED"].includes(b.status.toUpperCase())
    );

    const visibleCourts = scheduleVenue === "all"
      ? courts
      : courts.filter(c => c.venue?.name === scheduleVenue || c.venueId === scheduleVenue || c.venue?.id === scheduleVenue);

    const hoursRange = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

    return visibleCourts.map(court => {
      const timelineSlots = hoursRange.map(hour => {
        const slotStart = hour * 60;
        const slotEnd = (hour + 1) * 60;
        
        // Find if a booking covers this hour
        const activeBooking = activeBookings.find(b => 
          b.court?.id === court.id &&
          b.startTime <= slotStart && 
          b.endTime >= slotEnd
        );

        let state: "EMPTY" | "UPCOMING" | "LIVE" | "FINISHED" = "EMPTY";
        if (activeBooking) {
          state = getSessionLifecycleState({
            date: scheduleDate,
            startTime: activeBooking.startTime,
            endTime: activeBooking.endTime
          });
        }

        return {
          hour: `${String(hour).padStart(2, "0")}:00`,
          state,
          booking: activeBooking || null
        };
      });

      return {
        court,
        slots: timelineSlots
      };
    });
  }, [courts, bookings, scheduleDate, scheduleVenue]);


  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col relative overflow-hidden pt-28 pb-16">
      <Toast 
        isOpen={toast.open} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, open: false }))} 
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-neon/[0.02] blur-[150px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 space-y-10 relative z-10 animate-fade-in-up">
        {/* ONE Clean Admin Control Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight italic uppercase">
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-white/50 text-sm font-medium mt-2 max-w-2xl leading-relaxed">
              {activeTab === "bookings" && "Pure operational court bookings, schedule tracking, and active check-ins."}
              {activeTab === "finance" && "Financial revenue monitoring, approvals queue, and payments history."}
              {activeTab === "users" && "Search user registry, inspect registration histories, reschedule records, and penalties."}
              {activeTab === "schedule" && "Visual live control timeline, slots availability occupancy, and dates heatmaps."}
              {activeTab === "matches" && "Real-time community matches tracking, expiring sessions, and participant logs."}
              {activeTab === "courts" && "Manage courts parameters, locations, venues, and prices."}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
            >
              {isRefreshing ? "Refreshing..." : "↻ Reload"}
            </button>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl select-none">
              <div className="w-5 h-5 rounded-md bg-neon text-black font-black text-[10px] flex items-center justify-center font-bold">
                A
              </div>
              <span className="text-xs font-black text-white/80 uppercase tracking-widest">
                Hello, {session?.user?.name ? session.user.name.split(" ")[0] : "Admin"}
              </span>
            </div>
          </div>
        </div>

        {/* Clean Segmented Tab Navigation */}
        <div className="flex border-b border-white/5 w-full overflow-x-auto no-scrollbar gap-8 pb-px select-none z-10 relative">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count =
              tab.id === "bookings"
                ? totalNeedsActionCount
                : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 pb-4 text-sm font-bold transition-all duration-300 relative whitespace-nowrap cursor-pointer hover:text-white ${
                  isActive ? "text-white" : "text-white/40"
                }`}
              >
                <span className="text-xs shrink-0">{tab.icon}</span>
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 text-black text-[9px] font-black px-1 leading-none shadow-[0_0_10px_rgba(251,191,36,0.3)] animate-pulse">
                    {count}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neon shadow-[0_-2px_10px_rgba(215,255,63,0.5)] z-20" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body Grid */}
        <div className="pt-2">
          
          {/* ========================================================
              1. BOOKING MANAGEMENT (Operational View)
             ======================================================== */}
          {activeTab === "bookings" && (
            <div className="space-y-10">
              {/* OPERATIONAL TIMEFRAME FILTERS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F0F]/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-md">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mr-2">Operational Filters:</span>
                  {(["ALL", "TODAY", "TOMORROW", "WEEK", "CUSTOM"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setOperationalTimeframe(t);
                        if (t !== "CUSTOM") {
                          setOpCustomStart("");
                          setOpCustomEnd("");
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 border ${
                        operationalTimeframe === t
                          ? "bg-neon text-black border-neon shadow-sm"
                          : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border-white/5"
                      }`}
                    >
                      {t === "ALL" ? "All Play Time" : t === "WEEK" ? "This Week" : t}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  {operationalTimeframe === "CUSTOM" && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-3 duration-300">
                      <input
                        type="date"
                        value={opCustomStart}
                        onChange={(e) => setOpCustomStart(e.target.value)}
                        className="px-3 py-2 bg-[#141414] border border-white/10 rounded-xl text-[10px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-neon/30"
                        style={{ colorScheme: "dark" }}
                      />
                      <span className="text-white/30 text-[10px] uppercase font-black">to</span>
                      <input
                        type="date"
                        value={opCustomEnd}
                        onChange={(e) => setOpCustomEnd(e.target.value)}
                        className="px-3 py-2 bg-[#141414] border border-white/10 rounded-xl text-[10px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-neon/30"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse"></span>
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-wider">Play Date Mode</span>
                  </div>
                </div>
              </div>

              {/* Operational Stats Grid (Stripped of Revenue) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {opStats.map((item) => (
                  <div key={item.label} className="bg-[#0F0F0F]/60 backdrop-blur-md rounded-[1.25rem] border border-white/5 p-6 flex flex-col justify-between min-h-[140px] relative transition-all duration-300 hover:border-white/10 shadow-lg">
                    <div className="flex justify-between items-start w-full">
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{item.label}</span>
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                        <span className="text-sm">{item.icon}</span>
                      </div>
                    </div>
                    <div className="mt-6 space-y-1">
                      <div className="text-3xl font-black text-white tracking-tight leading-none truncate">{item.value}</div>
                      {item.trend && (
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-neon/80"></span>
                          {item.trend}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* UNIFIED NEEDS ACTION OPERATIONAL INBOX */}
              <div className="bg-amber-500/[0.01] border border-amber-500/10 rounded-3xl p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black text-amber-400 tracking-tight uppercase italic flex items-center gap-2">
                      <span>⚡</span> Unified Needs Action Inbox
                    </h3>
                    <p className="text-white/40 text-xs mt-1">Unified administrative operations workspace for reschedules and pending booking verification.</p>
                  </div>
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 text-black text-[10px] font-black px-2 leading-none shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-pulse">
                    {totalNeedsActionCount} Requests
                  </span>
                </div>

                <div className="w-full">
                  {/* Bookings requiring action */}
                  <div className="space-y-3 bg-black/40 border border-white/5 rounded-2xl p-6">
                    <h4 className="text-xs font-black text-white/50 uppercase tracking-widest italic border-b border-white/5 pb-2">📋 Booking Approvals & Reschedules</h4>
                    {needsActionBookings.length === 0 ? (
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider py-8 text-center italic">No pending bookings approvals</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {needsActionBookings.map((b) => (
                          <div key={b.id} className="bg-[#141414]/80 rounded-xl p-4 border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-white/10 transition-colors">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[9px] font-black text-neon bg-neon/10 border border-neon/20 px-1.5 py-0.5 rounded uppercase tracking-wider">{b.bookingCode || "OLD"}</span>
                                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">{b.status === "RESCHEDULE_REQUESTED" ? "Reschedule ⏳" : "Awaiting Verification"}</span>
                              </div>
                              <p className="text-xs font-black text-white italic uppercase mt-1.5">{b.court?.venue?.name} · {b.court?.name}</p>
                              <div className="text-[10px] text-white/40 font-bold mt-1.5 space-y-0.5">
                                <p>👤 {b.user?.name} ({b.user?.whatsapp})</p>
                                <p>📅 {String(b.date).slice(0,10)} @ {Math.floor(b.startTime/60)}:00</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CORE BOOKING MANAGER PRESENTATION COMPONENT */}
              <div className="pt-2 border-t border-white/5">
                <BookingManager 
                  initialBookings={operationalBookings} 
                  onUpdateBooking={handleUpdateBooking}
                  onRefreshBookings={handleRefreshBookings}
                />
              </div>
            </div>
          )}

          {/* ========================================================
              2. FINANCIAL MANAGEMENT (Dedicated Finance Tab)
             ======================================================== */}
          {activeTab === "finance" && (
            <div className="space-y-8">
              {/* FINANCIAL TIME FILTERS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F0F]/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-md">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mr-2">Financial Filters:</span>
                  {(["ALL", "TODAY", "YESTERDAY", "WEEK", "MONTH", "YEAR", "CUSTOM"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setFinancialTimeframe(t);
                        if (t !== "CUSTOM") {
                          setFinCustomStart("");
                          setFinCustomEnd("");
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 border ${
                        financialTimeframe === t
                          ? "bg-neon text-black border-neon shadow-sm"
                          : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border-white/5"
                      }`}
                    >
                      {t === "ALL" ? "All Payments" : t === "WEEK" ? "This Week" : t === "MONTH" ? "This Month" : t === "YEAR" ? "This Year" : t}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  {financialTimeframe === "CUSTOM" && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-3 duration-300">
                      <input
                        type="date"
                        value={finCustomStart}
                        onChange={(e) => setFinCustomStart(e.target.value)}
                        className="px-3 py-2 bg-[#141414] border border-white/10 rounded-xl text-[10px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-neon/30"
                        style={{ colorScheme: "dark" }}
                      />
                      <span className="text-white/30 text-[10px] uppercase font-black">to</span>
                      <input
                        type="date"
                        value={finCustomEnd}
                        onChange={(e) => setFinCustomEnd(e.target.value)}
                        className="px-3 py-2 bg-[#141414] border border-white/10 rounded-xl text-[10px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-neon/30"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-wider">Payment Date Mode</span>
                  </div>
                </div>
              </div>

              {/* Financial Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {finStats.map((item) => (
                  <div key={item.label} className="bg-[#0F0F0F]/60 backdrop-blur-md rounded-[1.25rem] border border-white/5 p-6 flex flex-col justify-between min-h-[140px] relative transition-all duration-300 hover:border-white/10 shadow-lg">
                    <div className="flex justify-between items-start w-full">
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{item.label}</span>
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 text-emerald-400">
                        <span className="text-sm">{item.icon}</span>
                      </div>
                    </div>
                    <div className="mt-6 space-y-1">
                      <div className="text-2xl font-black text-white tracking-tight leading-none truncate">{item.value}</div>
                      {item.trend && (
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {item.trend}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* CHRONOLOGICAL TRANSACTION HISTORY LEDGER */}
              <div className="bg-[#0F0F0F]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 space-y-6 shadow-xl">
                <div>
                  <h3 className="text-base font-black text-white tracking-tight uppercase italic flex items-center gap-2">
                    💵 Transaction History Ledger
                  </h3>
                  <p className="text-white/40 text-xs mt-1">Chronological record of automated checkout logs and manual approvals within the selected timeframe.</p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/5">
                  <table className="w-full text-left text-xs text-white/80">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40">
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Code</th>
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Method</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {transactionHistory.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4 text-white/40 font-bold uppercase">
                            {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-6 py-4 font-semibold text-white/80">
                            {tx.user?.name || "—"}
                            {tx.user?.whatsapp && (
                              <span className="block text-[10px] text-white/30 mt-0.5">{tx.user.whatsapp}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {tx.type === "BOOKING" ? (
                              <span className="text-[10px] font-black text-neon bg-neon/10 border border-neon/20 px-2 py-0.5 rounded uppercase tracking-wider">{tx.code}</span>
                            ) : (
                              <span className="text-[10px] font-black text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 rounded uppercase tracking-wider">MEMBERSHIP</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-white/70">
                            {tx.orderId}
                          </td>
                          <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/60">
                            {tx.method}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                              tx.status === "CONFIRMED" || tx.status === "CHECKED_IN" || tx.status === "COMPLETED" || tx.status === "RESCHEDULE_APPROVED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : tx.status === "PENDING"
                                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-white">
                            Rp {tx.amount.toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}

                      {transactionHistory.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-white/30 font-bold uppercase tracking-wider italic">
                            No financial transactions in this timeframe.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              3. USER MANAGEMENT (User-Centric Hub)
             ======================================================== */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Dynamic Index Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F0F]/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-xl">
                <div className="relative w-full max-w-lg">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search Username / Phone / Booking Code / Court..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#141414] border border-white/10 rounded-xl text-xs font-bold text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-neon/30 transition-all"
                  />
                </div>
                <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                  Total Users: {filteredUsers.length}
                </div>
              </div>

              {/* Users Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((user) => {
                  const activeBookings = user.bookings.filter(b => ["CONFIRMED", "RESCHEDULE_APPROVED"].includes(b.status.toUpperCase())).length;
                  return (
                    <div 
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="bg-[#0F0F0F]/60 backdrop-blur-md rounded-[1.5rem] border border-white/5 p-6 hover:border-white/10 hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px] group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5">
                            <User size={18} />
                          </div>
                          <div>
                            <h4 className="font-black text-white text-sm uppercase italic tracking-tight group-hover:text-neon transition-colors">{user.name}</h4>
                            <p className="text-[10px] font-bold text-white/30 mt-0.5">{user.whatsapp}</p>
                          </div>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                          user.membership === "MEMBER" 
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" 
                            : "bg-white/5 text-white/40 border border-white/5"
                        }`}>
                          {user.membership}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-white/[0.03] text-[9px] font-black text-white/50 uppercase tracking-widest">
                        <div>
                          <span className="text-white/20 block text-[8px]">ACTIVE BOOKINGS</span>
                          <span className="text-xs font-bold text-white mt-1 block">{activeBookings} Sessions</span>
                        </div>
                        <div>
                          <span className="text-white/20 block text-[8px]">TOTAL BOOKINGS</span>
                          <span className="text-xs font-bold text-white mt-1 block">{user.bookings.length} Bookings</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* USER DETAIL DRAW PANEL MODAL */}
              {selectedUser && (
                <div 
                  className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300"
                  onClick={() => setSelectedUser(null)}
                >
                  <div 
                    className="bg-[#0F0F0F] border border-white/10 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="sticky top-0 bg-[#1A1A1A]/95 backdrop-blur-xl border-b border-white/5 px-8 pt-7 pb-6 flex justify-between items-start z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center text-neon">
                          <User size={22} />
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-neon bg-neon/10 border border-neon/20 px-2 py-0.5 rounded uppercase tracking-widest">{selectedUser.membership}</span>
                          <h3 className="text-2xl font-black text-white tracking-tight uppercase italic mt-1">{selectedUser.name}</h3>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedUser(null)}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors text-sm font-bold flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-8 space-y-6">
                      {/* PROFILE DETAIL GRID */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 grid grid-cols-2 gap-4 text-[10px] font-black text-white/40 uppercase tracking-wider">
                        <div>
                          <span className="text-white/20 block text-[8px]">WhatsApp Number</span>
                          <span className="text-xs font-bold text-white block mt-1">{selectedUser.whatsapp}</span>
                        </div>
                        <div>
                          <span className="text-white/20 block text-[8px]">Registered Date</span>
                          <span className="text-xs font-bold text-white block mt-1">{new Date(selectedUser.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        <div>
                          <span className="text-white/20 block text-[8px]">Membership Type</span>
                          <span className="text-xs font-bold text-white block mt-1">{selectedUser.membership} ({selectedUser.membershipStatus})</span>
                        </div>
                        <div>
                          <span className="text-white/20 block text-[8px]">Reschedules Request</span>
                          <span className="text-xs font-bold text-white block mt-1">
                            {selectedUser.bookings.filter(b => b.status === "RESCHEDULE_REQUESTED").length} Requested
                          </span>
                        </div>
                      </div>

                      {/* BOOKING HISTORY TABLE */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-white uppercase italic tracking-widest border-b border-white/5 pb-2">📋 Booking History Registry</h4>
                        <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/40">
                          <table className="w-full text-left text-[10px] font-bold text-white/80">
                            <thead>
                              <tr className="bg-white/5 text-[8px] text-white/30 uppercase tracking-widest border-b border-white/5">
                                <th className="px-4 py-3">Code / Court</th>
                                <th className="px-4 py-3">Play Date</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                              {selectedUser.bookings.map((b) => (
                                <tr key={b.id}>
                                  <td className="px-4 py-3">
                                    <span className="text-[9px] font-black text-neon">{b.bookingCode || "OLD"}</span>
                                    <span className="block text-white/60 font-semibold">{b.court?.name}</span>
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-white/40">
                                    {b.date.slice(0, 10)} @ {Math.floor(b.startTime/60)}:00
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="uppercase text-[8px] font-black tracking-widest">{b.status}</span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-black text-white">
                                    Rp {b.totalPrice.toLocaleString("id-ID")}
                                  </td>
                                </tr>
                              ))}
                              {selectedUser.bookings.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="px-4 py-8 text-center text-white/30 font-bold uppercase tracking-wider italic">No bookings history.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* CANCEL & EXPIRED PENALTY RECORDS */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-white uppercase italic tracking-widest border-b border-white/5 pb-2">🚨 Cancel & Expired Penalty Records</h4>
                        <div className="bg-red-500/[0.02] border border-red-500/10 rounded-2xl p-4 space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-widest">
                            <span>Expired Bookings Count (Unpaid)</span>
                            <span className="text-white font-bold">{selectedUser.bookings.filter(b => b.status.toUpperCase() === "EXPIRED").length} times</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-widest">
                            <span>Cancelled Bookings Count (Admin Rejected)</span>
                            <span className="text-white font-bold">{selectedUser.bookings.filter(b => b.status.toUpperCase() === "CANCELLED").length} times</span>
                          </div>
                          <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mt-2 border-t border-white/5 pt-2">
                            ⚠️ Booking expirations and cancellations are tracked as penalty signals for booking integrity audits.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              4. COURT SCHEDULE (Dedicated Realtime Controls tab)
             ======================================================== */}
          {activeTab === "schedule" && (
            <div className="space-y-8">
              {/* TIMELINE INTERACTIVE FILTERS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F0F]/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-xl">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Pilih Tanggal</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="px-4 py-2.5 bg-[#141414] border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-neon"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Pilih Venue</label>
                    <div className="relative">
                      <select
                        value={scheduleVenue}
                        onChange={(e) => setScheduleVenue(e.target.value)}
                        className="px-4 py-2.5 pr-10 bg-[#141414] border border-white/10 rounded-xl text-xs font-bold text-white hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-neon transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,255,255,0.4)\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
                      >
                        <option value="all">Semua Venue</option>
                        {Array.from(new Set(courts.map(c => c.venue?.name || "Padel Venue"))).map((vName, idx) => (
                          <option key={idx} value={vName}>{vName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-neon/10 border border-neon/20 px-3 py-2 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse"></span>
                  <span className="text-[9px] font-black text-neon uppercase tracking-wider">Realtime Control Panel</span>
                </div>
              </div>

              {/* TIMELINE GRID DISPLAY */}
              <div className="bg-[#0F0F0F]/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 space-y-6">
                <div>
                  <h3 className="text-base font-black text-white tracking-tight uppercase italic flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-neon animate-pulse"></span> Realtime Venue Control Timeline
                  </h3>
                  <p className="text-white/40 text-xs mt-1">Realtime visual control timeline for courts availability and slots status.</p>
                </div>

                <div className="space-y-4">
                  {courtsTimelineData.map(({ court, slots }) => (
                    <div key={court.id} className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div>
                          <span className="text-xs font-black text-white uppercase italic tracking-tight">{court.venue?.name} · {court.name}</span>
                          <span className="text-[10px] text-white/40 block">{court.location}</span>
                        </div>
                        <span className="text-[9px] font-black text-neon bg-neon/10 border border-neon/20 px-2 py-0.5 rounded uppercase tracking-wider">
                          Rp {court.pricePerHour.toLocaleString("id-ID")}/hr
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-7 lg:grid-cols-14 gap-2">
                        {slots.map((slot, sIdx) => {
                          let bg = "bg-white/[0.02] border-white/5 text-white/30";
                          let text = slot.hour;
                          let pulse = false;

                          if (slot.state === "LIVE") {
                            bg = "bg-neon text-black border-neon shadow-[0_0_15px_rgba(215,255,63,0.3)]";
                            text = `LIVE NOW (${slot.hour})`;
                            pulse = true;
                          } else if (slot.state === "FINISHED") {
                            bg = "bg-white/5 border-white/10 text-white/20 line-through";
                          } else if (slot.state === "UPCOMING") {
                            bg = "bg-blue-500/10 border-blue-500/20 text-blue-400";
                            text = `⏰ {slot.hour}`;
                            text = `⏰ ${slot.hour}`;
                          }

                          return (
                            <div 
                              key={sIdx} 
                              className={`border rounded-lg p-2.5 text-center text-[9px] font-black uppercase tracking-wider select-none transition-all flex flex-col justify-center items-center h-14 ${bg}`}
                              title={slot.booking ? `Booked by ${slot.booking.user?.name}` : "Available Slot"}
                            >
                              <span>{text}</span>
                              {pulse && <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping mt-1"></span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {courtsTimelineData.length === 0 && (
                    <p className="text-white/30 text-xs font-bold uppercase tracking-wider py-8 text-center italic">Tidak ada lapangan di venue yang dipilih.</p>
                  )}
                </div>
              </div>


            </div>
          )}

          {/* ========================================================
              5. OPEN MATCH MANAGEMENT
             ======================================================== */}
          {activeTab === "matches" && (
            <div className="space-y-6">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0F0F]/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-xl">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "ACTIVE", label: "Active Open Matches" },
                    { id: "EXPIRED", label: "Expired Matches (Historical)" },
                    { id: "ALL", label: "All Match Sessions" }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setMatchFilter(f.id as any)}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 border ${
                        matchFilter === f.id
                          ? "bg-neon text-black border-neon shadow-sm"
                          : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border-white/5"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                  Total Displayed: {displayedOpenMatches.length} Matches
                </div>
              </div>

              {/* Grid of Open Matches */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayedOpenMatches.map((match) => {
                  const slotStartStr = match.booking ? `${Math.floor(match.booking.startTime/60)}:00` : "—";
                  const slotEndStr = match.booking ? `${Math.floor(match.booking.endTime/60)}:00` : "—";
                  
                  return (
                    <div 
                      key={match.id}
                      className={`bg-[#0F0F0F]/60 backdrop-blur-md rounded-[1.5rem] border border-white/5 shadow-lg overflow-hidden flex flex-col justify-between group min-h-[220px] transition-all duration-300 hover:border-white/10
                        ${match.isExpired ? "opacity-60 grayscale-[40%]" : ""}
                      `}
                    >
                      <div className="p-6 space-y-4">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[9px] font-black text-neon bg-neon/10 border border-neon/20 px-2 py-0.5 rounded uppercase tracking-wider">{match.matchType}</span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                              match.isExpired 
                                ? "bg-white/5 text-white/30" 
                                : "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse"
                            }`}>
                              {match.isExpired ? "EXPIRED" : "ACTIVE SESSION"}
                            </span>
                          </div>
                          <h4 className="font-black text-white text-base tracking-tight uppercase italic mt-3 group-hover:text-neon transition-colors">{match.title}</h4>
                          <span className="text-[10px] text-white/40 mt-1 block uppercase font-bold">{match.booking?.court?.venue?.name} · {match.booking?.court?.name}</span>
                        </div>

                        <div className="border-t border-white/[0.03] pt-3 text-[10px] font-bold text-white/50 uppercase tracking-widest space-y-1.5">
                          <p>📅 Play Date: {match.booking?.date.slice(0, 10)} @ {slotStartStr} – {slotEndStr}</p>
                          <p>👤 Host: {match.host?.name} ({match.host?.whatsapp})</p>
                          <p>⚔️ Players: {match.players.length} / {match.maxPlayers} joined</p>
                        </div>
                      </div>

                      {/* Players drawer footer */}
                      <div className="bg-white/5 px-6 py-3 text-[9px] font-black uppercase tracking-widest text-white/40 flex justify-between items-center group-hover:bg-white/10 transition-all">
                        <span>Participants Registry</span>
                        <div className="flex -space-x-2 overflow-hidden">
                          {match.players.slice(0, 3).map((p, idx) => (
                            <div key={idx} className="inline-block h-5 w-5 rounded-full ring-2 ring-[#0F0F0F] bg-white/10 text-[8px] font-black text-white flex items-center justify-center">
                              {p.player?.name ? p.player.name.slice(0, 1).toUpperCase() : "P"}
                            </div>
                          ))}
                          {match.players.length > 3 && (
                            <div className="inline-block h-5 w-5 rounded-full ring-2 ring-[#0F0F0F] bg-white/20 text-[7px] font-black text-white flex items-center justify-center">
                              +{match.players.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {displayedOpenMatches.length === 0 && (
                  <div className="sm:col-span-2 lg:col-span-3 bg-[#0F0F0F]/40 border border-white/5 rounded-3xl p-16 text-center text-white/30 font-bold uppercase tracking-wider italic">
                    No matches found for the selected filter.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              6. COURTS / VENUES MANAGER
             ======================================================== */}
          {activeTab === "courts" && (
            <div className="pt-2">
              <CourtManager />
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
