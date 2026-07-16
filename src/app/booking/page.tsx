"use client";

export const dynamic = "force-dynamic";

import { useBooking } from "@/hooks/useBooking";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { CourtCard } from "@/components/booking/CourtCard";
import { TimeSlot } from "@/components/booking/TimeSlot";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CalendarView } from "@/components/booking/CalendarView";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { formatMinutesToHHmm } from "@/lib/bookingTime";
import { motion, AnimatePresence } from "framer-motion";

export default function BookingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const expiresAt = (session?.user as any)?.membershipExpiresAt;
  const isExpired = expiresAt ? new Date() >= new Date(expiresAt) : false;
  const membershipStatus = isExpired ? "EXPIRED" : ((session?.user as any)?.membershipStatus || "FREE");
  const isMember = membershipStatus === "ACTIVE";

  const [openMatches, setOpenMatches] = useState<any[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [joiningMatchId, setJoiningMatchId] = useState<string | null>(null);
  const [joinedSuccessMessage, setJoinedSuccessMessage] = useState<string | null>(null);
  const [joinedHostWhatsapp, setJoinedHostWhatsapp] = useState<string | null>(null);
  const [selectedMatchDetail, setSelectedMatchDetail] = useState<any | null>(null);

  // Real-time Jakarta Time Filter for Public Open Matches
  const activeMatchesList = useMemo(() => {
    return openMatches.filter((m) => {
      if (m.status === "CANCELED") return false;

      // Use Intl to get Jakarta components
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const parts = formatter.formatToParts(new Date());
      const map: Record<string, string> = {};
      for (const part of parts) {
        map[part.type] = part.value;
      }
      const localTodayStr = `${map.year}-${map.month}-${map.day}`;
      const nowMinutes = parseInt(map.hour, 10) * 60 + parseInt(map.minute, 10);
      
      const booking = m.booking;
      if (!booking) return false;
      const bookingDateStr = new Date(booking.date).toISOString().split("T")[0];

      if (bookingDateStr < localTodayStr) return false;
      if (bookingDateStr > localTodayStr) return true;

      // Same day
      if (nowMinutes > booking.endTime) return false;
      return true;
    });
  }, [openMatches]);

  const fetchOpenMatches = async () => {
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const data = await res.json();
        setOpenMatches(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  useEffect(() => {
    fetchOpenMatches();
    const interval = setInterval(fetchOpenMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle tab routing via URL search params (e.g., ?tab=open-match)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "openMatch" || tab === "open-match") {
        setActiveTab("openMatch");
      }
    }
  }, []);

  const handleJoinMatch = async (matchId: string, hostWhatsapp: string) => {
    if (!session) {
      router.push("/login?callbackUrl=/booking");
      return;
    }
    setJoiningMatchId(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal bergabung ke pertandingan.");
      }
      setJoinedSuccessMessage(data.message || "Successfully joined match! Please contact host.");
      setJoinedHostWhatsapp(hostWhatsapp);
      await fetchOpenMatches();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJoiningMatchId(null);
    }
  };

  const {
    venues,
    selectedVenue,
    setSelectedVenue,
    courts,
    timeSlots,
    isLoadingSlots,
    selectedCourt,
    setSelectedCourt,
    selectedDate,
    setSelectedDate,
    selectedSlots,
    setSelectedSlots,
    toggleSlot,
    checkout,
    isLoading,
    error,
    successMsg,
    isToastOpen,
    setIsToastOpen,
  } = useBooking();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [previewCourtInfo, setPreviewCourtInfo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"reserve" | "openMatch">("reserve");

  // Premium Equipment Package States
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [equipmentPackage, setEquipmentPackage] = useState<"NONE" | "STARTER" | "GROUP">("NONE");
  const [equipmentPrice, setEquipmentPrice] = useState<number>(0);
  const [tempPackage, setTempPackage] = useState<"NONE" | "STARTER" | "GROUP">("NONE");

  // Admin tidak boleh booking
  if (isAdmin) {
    return (
      <div className="flex-1 min-h-screen relative pb-40 pt-16 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#0F0F0F] rounded-[2rem] border border-red-500/20 p-12 text-center backdrop-blur-xl">
            <div className="text-6xl mb-6">🚫</div>
            <h1 className="text-3xl font-black text-white mb-3">
              Access Denied
            </h1>
            <p className="text-white/60 font-medium mb-8">
              Admin cannot book courts. Please use a player account.
            </p>
            <Link href="/admin">
              <Button size="lg">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedCourtData = courts.find((c) => c.id === selectedCourt);
  const courtPrice = selectedCourtData?.pricePerHour || 0;
  
  // Apply membership discount logic on UI
  const displayPrice = isMember ? Math.round(courtPrice * 0.9) : courtPrice;
  const totalPrice = displayPrice * selectedSlots.length;
  const grandTotal = totalPrice + equipmentPrice;

  const isStep1Done = !!selectedVenue;
  const isStep2Done = !!selectedCourt;
  const isStep3Done = !!selectedDate;
  
  // Membership Priority Check
  const today = new Date();
  today.setHours(0,0,0,0);
  const targetDate = new Date(selectedDate);
  targetDate.setHours(0,0,0,0);
  const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // BASIC: H-7, MEMBER: H-14
  const maxDays = isMember ? 14 : 7;
  const isDateAllowed = diffDays <= maxDays;

  const isStep4Done = selectedSlots.length > 0;
  const canCheckout = isStep1Done && isStep2Done && isStep3Done && isStep4Done && isDateAllowed;

  const handleCheckoutClick = () => {
    if (canCheckout) {
      if (isMember) {
        // Instant Elite Confirmation for Members
        executeCheckout();
      } else {
        setShowConfirmModal(true);
      }
    }
  };

  const executeCheckout = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return; // Prevent double trigger
    checkout(equipmentPackage, equipmentPrice);
  };

  let smartSuggestion = null;
  if (selectedCourt && selectedDate) {
    const firstUnavailableIndex = timeSlots.findIndex((s) => !s.available);
    if (firstUnavailableIndex !== -1) {
      const nextAvailable = timeSlots
        .slice(firstUnavailableIndex)
        .find((s) => s.available);
      if (nextAvailable) {
        smartSuggestion = `Tip: Jam buka terdekat yang masih kosong adalah ${nextAvailable.time}`;
      }
    }
  }

  return (
    <div className="flex-1 relative pb-40 pt-16 overflow-hidden min-h-screen">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-neon/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      
      <Toast
        isOpen={isToastOpen}
        message={error}
        type="error"
        onClose={() => setIsToastOpen(false)}
      />

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <form 
            onSubmit={executeCheckout} 
            className="bg-[#0F0F0F] border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-300"
          >
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
              Confirm Booking
            </h3>
            <p className="text-white/60 font-medium mb-8 text-sm">
              Review your court reservation details.
            </p>

            <div className="bg-white/5 rounded-2xl p-5 space-y-4 mb-8 border border-white/10">
              <div className="flex justify-between">
                <span className="text-white/50 font-medium text-sm">Court</span>
                <span className="font-bold text-white text-right">
                  {selectedCourtData?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 font-medium text-sm">Location</span>
                <span className="font-bold text-white text-right">
                  {selectedCourtData?.location}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 font-medium text-sm">Date</span>
                <span className="font-bold text-white text-right">
                  {selectedDate.getDate()}{" "}
                  {selectedDate.toLocaleDateString("en-US", { month: "short" })}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-white/50 font-medium text-sm">Time</span>
                <span className="font-bold text-white text-right max-w-[150px]">
                  {selectedSlots.join(", ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 font-medium text-sm">Duration</span>
                <span className="font-bold text-white text-right">
                  {selectedSlots.length} Hours
                </span>
              </div>

              {equipmentPackage !== "NONE" && (
                <div className="flex justify-between">
                  <span className="text-white/50 font-medium text-sm">Equipment</span>
                  <span className="font-bold text-neon text-right">
                    {equipmentPackage === "STARTER" ? "Starter Package (Rp 50.000)" : "Group Package (Rp 90.000)"}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-white/10 mt-4 flex justify-between items-center">
                <span className="font-bold text-white">Total</span>
                <span className="text-2xl font-black text-neon">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {previewCourtInfo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setPreviewCourtInfo(null)}
        >
          <div
            className="bg-[#0F0F0F] border border-white/10 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewCourtInfo(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
            >
              ✕
            </button>
            <div className="relative h-64 md:h-80 w-full bg-[#1A1A1A]">
              {(() => {
                const previewCourt = courts.find(
                  (c) => c.id === previewCourtInfo,
                );
                const courtImages = previewCourt?.images || (previewCourt?.image ? [previewCourt.image] : []);
                return <ImageCarousel images={courtImages} />;
              })()}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] to-transparent pointer-events-none"></div>
            </div>
            <div className="p-6 md:p-8 relative">
              {(() => {
                const previewCourt = courts.find(
                  (c) => c.id === previewCourtInfo,
                );
                return (
                  <>
                    <div className="inline-block bg-neon/10 text-neon font-bold text-xs px-3 py-1.5 rounded-lg mb-4 uppercase tracking-wider border border-neon/20">
                      Court Details
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                      {previewCourt?.name || "Court Detail"}
                    </h3>
                    <p className="text-white/60 font-medium flex items-center gap-2 mb-6 text-sm">
                      📍 {previewCourt?.location || "Location not set"}
                    </p>
                    <p className="text-base text-white/70 leading-relaxed mb-8 text-left">
                      {previewCourt?.description ||
                        "Experience padel on a premium international standard court. Equipped with top-tier facilities, anti-glare lighting, and a beautiful environment."}
                    </p>
                    <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/10">
                      <div>
                        <span className="font-bold text-white/50 text-sm block">Price Per Hour</span>
                        {isMember && <span className="text-[10px] font-black text-neon uppercase tracking-widest bg-neon/10 px-2 py-0.5 rounded mt-1 inline-block">10% Member Discount applied</span>}
                      </div>
                      <div className="text-right">
                        {isMember && <span className="text-xs text-white/30 line-through block font-bold mb-0.5">Rp {courtPrice.toLocaleString("id-ID")}</span>}
                        <span className="text-2xl font-black text-neon">
                          Rp {displayPrice.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showEquipmentModal && (
          <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-xl"
              onClick={() => setShowEquipmentModal(false)}
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative bg-[#0E0E0E] border-t md:border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden max-w-4xl w-full flex flex-col md:flex-row h-[72vh] md:h-auto md:min-h-[500px] shadow-[0_0_50px_rgba(0,0,0,0.8)] pb-[env(safe-area-inset-bottom)] md:pb-0 z-10"
            >
              {/* LEFT COLUMN: Visual Preview */}
              <div className="hidden md:flex md:w-5/12 bg-[#090909] border-r border-white/5 p-8 flex-col justify-between relative overflow-hidden select-none shrink-0 h-auto md:h-full">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-neon/10 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-[0.2em] text-white/40 italic">
                    <span>🎾</span> Gear Customizer
                  </div>
                  <h4 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tight leading-none mt-2 md:mt-6">
                    PADELGO <span className="text-neon block md:inline">EQUIPMENT.</span>
                  </h4>
                  <p className="hidden md:block text-[10px] font-bold text-white/40 leading-relaxed mt-2 uppercase tracking-wider">
                    Premium rackets & tournament-grade ball tubes.
                  </p>
                </div>

                {/* Package Illustration Area */}
                <div className="my-2 md:my-8 flex-1 flex items-center justify-center relative md:min-h-[160px]">
                  {tempPackage === "NONE" ? (
                    <div className="flex md:flex-col items-center gap-3 md:gap-4 md:text-center animate-fade-in w-full md:w-auto">
                      <div className="w-10 h-10 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-xl md:text-4xl shadow-inner relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent"></div>
                        ❌
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic md:text-white/30">No Extra Gear</p>
                        <p className="hidden md:block text-[9px] font-medium text-white/20 normal-case tracking-normal mt-1">You will be using your own rackets and balls.</p>
                      </div>
                    </div>
                  ) : tempPackage === "STARTER" ? (
                    <div className="flex md:flex-col items-center gap-3 md:gap-4 md:text-center animate-fade-in w-full md:w-auto">
                      <div className="relative inline-block shrink-0">
                        <div className="w-12 h-12 md:w-28 md:h-28 rounded-2xl md:rounded-3xl bg-gradient-to-br from-neon/20 via-[#141414] to-black border border-neon/30 flex items-center justify-center text-2xl md:text-5xl shadow-[0_0_30px_rgba(215,255,63,0.1)]">
                          🎾
                        </div>
                        <span className="hidden md:inline absolute -top-2 -right-2 bg-neon text-black text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-black/50 italic">
                          Starter
                        </span>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-black text-white italic uppercase tracking-wider">Starter Package</p>
                        <p className="text-[9px] md:text-[10px] font-black text-neon uppercase tracking-widest mt-0.5 md:mt-1">2 Rackets + 1 Ball Set</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex md:flex-col items-center gap-3 md:gap-4 md:text-center animate-fade-in w-full md:w-auto">
                      <div className="relative inline-block shrink-0">
                        <div className="w-12 h-12 md:w-28 md:h-28 rounded-2xl md:rounded-3xl bg-gradient-to-br from-purple-500/20 via-[#141414] to-black border border-purple-500/30 flex items-center justify-center text-2xl md:text-5xl shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                          🔥
                        </div>
                        <span className="hidden md:inline absolute -top-2 -right-2 bg-purple-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-black/50 italic">
                          Group
                        </span>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-black text-white italic uppercase tracking-wider">Group Package</p>
                        <p className="text-[9px] md:text-[10px] font-black text-purple-400 uppercase tracking-widest mt-0.5 md:mt-1">4 Rackets + 1 Ball Set</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Notice */}
                <div className="hidden md:flex pt-4 border-t border-white/5 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] italic items-center gap-2">
                  <span>⚠️</span> RENTAL ONLY • RETURN AFTER SESSION
                </div>
              </div>
              
              {/* RIGHT COLUMN: Selection & Totals */}
              <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col h-full overflow-hidden justify-between">
                
                {/* Scrollable Upper Section */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4 md:mb-5 shrink-0">
                    <div>
                      <h4 className="text-base md:text-lg font-black text-white italic uppercase tracking-wider">
                        SELECT EQUIPMENT
                      </h4>
                      <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest mt-0.5">
                        Choose your rental package
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowEquipmentModal(false)}
                      className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all flex items-center justify-center text-sm font-bold shadow-lg focus:outline-none shrink-0"
                      aria-label="Close modal"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Option Cards List */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 md:space-y-3.5 pb-4 scrollbar-thin scrollbar-thumb-white/10">
                    {/* None Option */}
                    <div 
                      onClick={() => setTempPackage("NONE")}
                      className={`p-3.5 md:p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                        tempPackage === "NONE" 
                          ? "border-neon bg-neon/[0.03] shadow-[0_0_20px_rgba(215,255,63,0.05)]" 
                          : "border-white/5 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          tempPackage === "NONE" ? "border-neon bg-neon" : "border-white/20 bg-transparent"
                        }`}>
                          {tempPackage === "NONE" && <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
                        </div>
                        <div>
                          <p className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">No Equipment</p>
                          <p className="text-[9px] md:text-[10px] font-medium text-white/40 mt-0.5">Bring your own play gear.</p>
                        </div>
                      </div>
                      <span className="text-xs md:text-sm font-black text-white/50 uppercase tracking-widest shrink-0 ml-4">+ Rp 0</span>
                    </div>

                    {/* Starter Option */}
                    <div 
                      onClick={() => setTempPackage("STARTER")}
                      className={`p-3.5 md:p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                        tempPackage === "STARTER" 
                          ? "border-neon bg-neon/[0.03] shadow-[0_0_20px_rgba(215,255,63,0.05)]" 
                          : "border-white/5 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          tempPackage === "STARTER" ? "border-neon bg-neon" : "border-white/20 bg-transparent"
                        }`}>
                          {tempPackage === "STARTER" && <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">Starter Package</p>
                            <span className="text-[7px] md:text-[8px] font-black bg-neon/10 text-neon border border-neon/20 px-1.5 py-0.5 rounded uppercase tracking-wider italic shrink-0">
                              Best for Beginners
                            </span>
                          </div>
                          <p className="text-[9px] md:text-[10px] font-semibold text-white/60 mt-0.5">2 Rackets + 1 Ball Set (Tube)</p>
                        </div>
                      </div>
                      <span className="text-xs md:text-sm font-black text-neon uppercase tracking-widest shrink-0 ml-4">Rp 50.000</span>
                    </div>

                    {/* Group Option */}
                    <div 
                      onClick={() => setTempPackage("GROUP")}
                      className={`p-3.5 md:p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                        tempPackage === "GROUP" 
                          ? "border-purple-500 bg-purple-500/[0.03] shadow-[0_0_20px_rgba(168,85,247,0.05)]" 
                          : "border-white/5 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          tempPackage === "GROUP" ? "border-purple-500 bg-purple-500" : "border-white/20 bg-transparent"
                        }`}>
                          {tempPackage === "GROUP" && <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">Group Package</p>
                            <span className="text-[7px] md:text-[8px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider italic font-sans shrink-0">
                              Best for Groups
                            </span>
                          </div>
                          <p className="text-[9px] md:text-[10px] font-semibold text-white/60 mt-0.5">4 Rackets + 1 Ball Set (Tube)</p>
                        </div>
                      </div>
                      <span className="text-xs md:text-sm font-black text-purple-400 uppercase tracking-widest shrink-0 ml-4">Rp 90.000</span>
                    </div>
                  </div>
                </div>

                {/* STICKY BOTTOM Pricing & Actions */}
                <div className="mt-4 pt-4 border-t border-white/5 space-y-4 shrink-0 bg-[#0E0E0E]">
                  
                  {/* Realtime Pricing Stack */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2.5 shadow-inner">
                    {/* Court Rental Row */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white/40 uppercase tracking-wider text-[10px]">Court Rental</span>
                      <span className="font-black text-white">Rp {totalPrice.toLocaleString("id-ID")}</span>
                    </div>
                    
                    {/* Add-on Gear Row */}
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                      <span className="font-bold text-white/40 uppercase tracking-wider text-[10px]">Add-on Gear</span>
                      <span className={`font-black ${tempPackage === "NONE" ? "text-white/40" : tempPackage === "STARTER" ? "text-neon" : "text-purple-400"}`}>
                        + Rp {(tempPackage === "NONE" ? 0 : tempPackage === "STARTER" ? 50000 : 90000).toLocaleString("id-ID")}
                      </span>
                    </div>
                    
                    {/* Total Row */}
                    <div className="flex justify-between items-center border-t border-white/10 pt-2.5 mt-1 bg-neon/5 -mx-4 px-4 pb-0.5 rounded-b-2xl">
                      <span className="font-black text-neon uppercase tracking-widest text-[10px]">Grand Total</span>
                      <span className="text-lg font-black text-neon drop-shadow-[0_0_8px_rgba(215,255,63,0.3)]">
                        Rp {(totalPrice + (tempPackage === "NONE" ? 0 : tempPackage === "STARTER" ? 50000 : 90000)).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowEquipmentModal(false)}
                      className="flex-1 h-12 rounded-xl border border-white/10 hover:border-white/20 bg-transparent text-[10px] font-black text-white/50 hover:text-white uppercase tracking-widest transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const tempPrice = tempPackage === "NONE" ? 0 : tempPackage === "STARTER" ? 50000 : 90000;
                        setEquipmentPackage(tempPackage);
                        setEquipmentPrice(tempPrice);
                        setShowEquipmentModal(false);
                      }}
                      className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(215,255,63,0.1)] ${
                        tempPackage === "NONE"
                          ? "bg-white/10 hover:bg-white/15 text-white"
                          : tempPackage === "STARTER"
                          ? "bg-neon hover:bg-neon/90 text-black shadow-[0_0_20px_rgba(215,255,63,0.15)]"
                          : "bg-purple-500 hover:bg-purple-500/90 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                      }`}
                    >
                      Apply Package
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 md:px-6 mb-16 mt-8 md:mt-12 animate-fade-in-up">
        <div className="flex bg-[#0F0F0F] border border-white/5 rounded-2xl p-1 w-full max-w-sm mx-auto shadow-2xl">
          <button
            onClick={() => setActiveTab("reserve")}
            className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === "reserve" ? "bg-white/10 text-neon shadow-[0_0_15px_rgba(215,255,63,0.1)]" : "text-white/40 hover:text-white"
            }`}
          >
            Reserve Court
          </button>
          <button
            onClick={() => setActiveTab("openMatch")}
            className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === "openMatch" ? "bg-white/10 text-neon shadow-[0_0_15px_rgba(215,255,63,0.1)]" : "text-white/40 hover:text-white"
            }`}
          >
            Open Match
          </button>
        </div>
      </div>

      {activeTab === "reserve" && (
      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-12 animate-fade-in-up">
        <div className="text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
            Reserve <span className="text-neon drop-shadow-[0_0_15px_rgba(215,255,63,0.3)]">Court.</span>
          </h1>
          <p className="text-white/60 font-medium text-lg max-w-xl leading-relaxed mx-auto md:mx-0">
            Select your preferred court, date, and time slot below. Your premium padel experience awaits.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-10 items-start">
          <div className="space-y-16 w-full">
            {/* 1. Select Venue */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${selectedVenue ? "bg-neon text-black shadow-[0_0_15px_rgba(215,255,63,0.3)]" : "bg-white/10 text-white/50"}`}
                >
                  {selectedVenue ? "✓" : "1"}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Select Venue
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {venues.length === 0 && (
                  <p className="text-white/40 font-medium col-span-full">
                    Loading venues...
                  </p>
                )}
                {venues.map((venue) => {
                   const isSelected = selectedVenue === venue.id;
                   return (
                     <button
                       key={venue.id}
                       onClick={() => {
                         setSelectedVenue(venue.id);
                         setSelectedCourt(null);
                         setSelectedSlots([]);
                       }}
                       className={`group relative text-left w-full rounded-3xl overflow-hidden border transition-all duration-300 outline-none ${
                         isSelected
                           ? "border-neon shadow-[0_0_30px_rgba(215,255,63,0.15)] ring-1 ring-neon"
                           : "border-white/10 hover:border-white/30 hover:bg-white/5"
                       }`}
                     >
                       <div className="relative h-32 w-full bg-[#1A1A1A]">
                         {venue.thumbnail ? (
                           <Image src={venue.thumbnail} alt={venue.name} fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                         ) : (
                           <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent"></div>
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/50 to-transparent"></div>
                       </div>
                       <div className="p-5 relative z-10 -mt-10">
                         <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border mb-2 text-[9px] font-black uppercase tracking-widest bg-[#0F0F0F]/80 backdrop-blur-sm border-white/10 text-white/70">
                           📍 {venue.location}
                         </div>
                         <h3 className={`text-lg font-black tracking-tight mb-1 ${isSelected ? "text-neon" : "text-white"}`}>
                           {venue.name}
                         </h3>
                         <p className="text-white/50 text-xs line-clamp-2 leading-relaxed">
                           {venue.description || "Premium padel facility."}
                         </p>
                       </div>
                     </button>
                   );
                })}
              </div>
            </div>

            {/* 2. Select Court */}
            <div
              className={`space-y-6 transition-all duration-500 ${!isStep1Done ? "opacity-30 pointer-events-none grayscale translate-y-4" : "opacity-100 translate-y-0"}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${selectedCourt ? "bg-neon text-black shadow-[0_0_15px_rgba(215,255,63,0.3)]" : "bg-white/10 text-white/50"}`}
                >
                  {selectedCourt ? "✓" : "2"}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Select Court
                </h2>
              </div>
              
              {!selectedVenue ? (
                <div className="p-10 border border-dashed border-white/10 rounded-[2rem] text-center bg-white/5 backdrop-blur-sm">
                  <p className="text-white/40 font-medium">
                    Select a venue first.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {courts.filter(c => c.venueId === selectedVenue).map((court) => (
                    <div key={court.id} className="relative group">
                      {/* Preview Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewCourtInfo(court.id);
                        }}
                        className="absolute top-4 left-4 z-20 bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                        title="View Details"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                      </button>
                      <CourtCard
                        court={court}
                        isSelected={selectedCourt === court.id}
                        onSelect={() => {
                          setSelectedCourt(court.id);
                          setSelectedSlots([]);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Select Date */}
            <div
              className={`space-y-6 transition-all duration-500 ${!isStep2Done ? "opacity-30 pointer-events-none grayscale translate-y-4" : "opacity-100 translate-y-0"}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${selectedDate ? "bg-neon text-black shadow-[0_0_15px_rgba(215,255,63,0.3)]" : "bg-white/10 text-white/50"}`}
                >
                  {selectedDate && isStep2Done ? "✓" : "3"}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Select Date
                </h2>
              </div>

              {!selectedCourt ? (
                <div className="p-10 border border-dashed border-white/10 rounded-[2rem] text-center bg-white/5 backdrop-blur-sm">
                  <p className="text-white/40 font-medium">
                    Select a court to view calendar availability.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <CalendarView
                    selectedDate={selectedDate}
                    onSelectDate={(date) => {
                      setSelectedDate(date);
                      setSelectedSlots([]);
                    }}
                    courtId={selectedCourt}
                    membershipStatus={membershipStatus}
                    onLockedDateClick={() => setShowUpsellModal(true)}
                  />
                  {!isDateAllowed && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                      <span className="text-xl">⚠️</span>
                      <p className="text-xs font-bold text-red-400">
                        {isMember 
                          ? "MEMBER hanya bisa booking hingga 14 hari ke depan." 
                          : "BASIC user hanya bisa booking hingga 7 hari ke depan. Upgrade ke MEMBER untuk akses H-14!"}
                      </p>
                      {!isMember && (
                        <Link href="/membership" className="ml-auto">
                          <Button size="sm" variant="outline" className="text-[10px] h-8 border-red-500/20 text-red-400 hover:bg-red-500/10">Upgrade</Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Time Slots */}
            <div
              className={`space-y-6 transition-all duration-500 ${!isStep3Done ? "opacity-30 pointer-events-none grayscale translate-y-4" : "opacity-100 translate-y-0"}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${isStep4Done ? "bg-neon text-black shadow-[0_0_15px_rgba(215,255,63,0.3)]" : "bg-white/10 text-white/50"}`}
                  >
                    {isStep4Done ? "✓" : "4"}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Select Time
                  </h2>
                </div>
                {smartSuggestion && (
                  <div className="text-xs font-bold text-neon bg-neon/10 px-4 py-2 rounded-xl border border-neon/20 animate-in fade-in slide-in-from-right-4">
                    ✨ {smartSuggestion}
                  </div>
                )}
              </div>

              {!selectedCourt ? (
                <div className="p-10 border border-dashed border-white/10 rounded-[2rem] text-center bg-white/5">
                  <p className="text-white/40 font-medium">
                    Select court and date first.
                  </p>
                </div>
              ) : isLoadingSlots ? (
                <div className="p-10 border border-dashed border-white/10 rounded-[2rem] text-center bg-white/5 flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-neon/30 border-t-neon rounded-full animate-spin"></div>
                  <p className="text-white/50 font-medium text-sm">
                    Checking live availability...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {timeSlots.map((slot, idx) => (
                    <TimeSlot
                      key={idx}
                      time={slot.time}
                      isAvailable={slot.available}
                      status={slot.status}
                      isSelected={selectedSlots.includes(slot.time)}
                      price={courtPrice}
                      onSelect={() => toggleSlot(slot.time)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block sticky top-32">
            <div className="bg-[#0F0F0F] border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="font-black text-2xl mb-8 tracking-tight text-white">Summary</h3>

              <div className="space-y-6 mb-8 relative">
                <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-white/10 -z-10 rounded-full"></div>

                <div className="flex gap-5">
                  <div
                    className={`w-6 h-6 rounded-full flex-shrink-0 mt-0.5 border-4 border-[#0F0F0F] shadow-sm ${isStep1Done ? "bg-neon" : "bg-white/20"}`}
                  ></div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5">
                      Venue
                    </p>
                    <p
                      className={`font-bold text-sm ${isStep1Done ? "text-white" : "text-white/30"}`}
                    >
                      {venues.find(v => v.id === selectedVenue)?.name || "Not selected"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div
                    className={`w-6 h-6 rounded-full flex-shrink-0 mt-0.5 border-4 border-[#0F0F0F] shadow-sm ${isStep2Done ? "bg-neon" : "bg-white/20"}`}
                  ></div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5">
                      Court
                    </p>
                    <p
                      className={`font-bold text-sm ${isStep2Done ? "text-white" : "text-white/30"}`}
                    >
                      {selectedCourtData?.name || "Not selected"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div
                    className={`w-6 h-6 rounded-full flex-shrink-0 mt-0.5 border-4 border-[#0F0F0F] shadow-sm ${isStep3Done ? "bg-neon" : "bg-white/20"}`}
                  ></div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5">
                      Date
                    </p>
                    <p
                      className={`font-bold text-sm ${isStep3Done ? "text-white" : "text-white/30"}`}
                    >
                      {selectedDate
                        ? `${selectedDate.getDate()} ${selectedDate.toLocaleDateString("en-US", { month: "short" })}`
                        : "Not selected"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div
                    className={`w-6 h-6 rounded-full flex-shrink-0 mt-0.5 border-4 border-[#0F0F0F] shadow-sm ${isStep4Done ? "bg-neon" : "bg-white/20"}`}
                  ></div>
                  <div className="w-full">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5">
                      Time
                    </p>
                    <div
                      className={`font-bold text-sm flex flex-wrap gap-1.5 ${isStep4Done ? "text-white" : "text-white/30"}`}
                    >
                      {isStep4Done
                        ? selectedSlots.map((s) => (
                            <span
                              key={s}
                              className="bg-white/10 px-2 py-1 rounded border border-white/5"
                            >
                              {s}
                            </span>
                          ))
                        : "Not selected"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Equipment Add-on Section */}
              <div className="pt-6 border-t border-white/10 mb-6 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    Equipment Rental
                  </p>
                  {equipmentPackage !== "NONE" && (
                    <span className="text-[8px] font-black text-neon uppercase tracking-widest bg-neon/10 px-2.5 py-1 rounded border border-neon/20 italic">
                      {equipmentPackage} active
                    </span>
                  )}
                </div>

                {equipmentPackage === "NONE" ? (
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden group">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-xs font-black text-white italic uppercase tracking-tight">Need Equipment?</p>
                        <p className="text-[10px] font-bold text-white/40 leading-relaxed mt-0.5">Rackets & balls available for rent.</p>
                      </div>
                      <span className="text-xl">🎾</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPackage(equipmentPackage);
                        setShowEquipmentModal(true);
                      }}
                      className="mt-2 w-full h-9 rounded-xl border border-white/10 hover:border-neon/30 bg-white/5 text-[9px] font-black text-white/70 hover:text-neon uppercase tracking-widest transition-all"
                    >
                      + Add Equipment
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/[0.03] border border-neon/20 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-xs font-black text-neon italic uppercase tracking-tight">
                          {equipmentPackage === "STARTER" ? "Starter Package" : "Group Package"}
                        </p>
                        <p className="text-[10px] font-semibold text-white/60 leading-relaxed mt-0.5 italic">
                          {equipmentPackage === "STARTER" ? "2 Rackets + 1 Ball Set" : "4 Rackets + 1 Ball Set"}
                        </p>
                        <p className="text-[9px] font-black text-white/30 uppercase mt-1">
                          Rental Fee: Rp {equipmentPrice.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <span className="text-xl">🔥</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPackage(equipmentPackage);
                        setShowEquipmentModal(true);
                      }}
                      className="mt-1 w-full h-8 rounded-xl border border-white/5 bg-white/5 text-[9px] font-black text-white/50 hover:text-neon uppercase tracking-widest transition-all"
                    >
                      Change Package
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/10 mb-8 bg-white/5 -mx-8 px-8 pb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-white/50">
                    Court Rental ({selectedSlots.length} Hrs)
                  </span>
                  <span className="text-xs font-bold text-white/80">
                    Rp {totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                {equipmentPackage !== "NONE" && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-white/50">
                      Equipment Add-on
                    </span>
                    <span className="text-xs font-bold text-white/80">
                      Rp {equipmentPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {isMember && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-neon uppercase tracking-widest">
                      Saved (10% Elite)
                    </span>
                    <span className="text-xs font-black text-neon">
                      -Rp {( (courtPrice - displayPrice) * selectedSlots.length ).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-end border-t border-white/10 pt-4 mt-4">
                  <div className="flex flex-col items-end w-full">
                    <div className="flex justify-between items-center w-full">
                       <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Total</span>
                       <p className="text-3xl font-black text-neon drop-shadow-[0_0_10px_rgba(215,255,63,0.2)]">
                         Rp {grandTotal.toLocaleString("id-ID")}
                       </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  size="full"
                  disabled={!canCheckout}
                  onClick={handleCheckoutClick}
                  isLoading={isLoading}
                >
                  {isDateAllowed ? "Checkout" : "Date Not Allowed"}
                </Button>
                {!canCheckout && (
                  <div className="space-y-2">
                    <p className="text-center text-xs font-medium text-white/40">
                      *Complete steps to unlock
                    </p>
                    {!isMember && !isDateAllowed && (
                      <Link href="/membership" className="block">
                        <p className="text-center text-[10px] font-black text-neon uppercase tracking-widest hover:underline cursor-pointer">
                          Upgrade to MEMBER to book early (H-14)
                        </p>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === "reserve" && (
      <div
        className={`lg:hidden fixed bottom-0 left-0 w-full bg-[#0B0B0B]/90 backdrop-blur-xl border-t border-white/10 rounded-t-[2rem] p-6 px-5 shadow-[0_-20px_40px_rgba(0,0,0,0.4)] z-40 transform transition-transform duration-500 ease-out ${selectedSlots.length > 0 ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="w-full flex justify-between items-center">
            <div>
              <p className="text-white/60 font-medium text-xs mb-1">
                {selectedCourtData?.name || "Court"} • {selectedSlots.length} Hrs
                {equipmentPackage !== "NONE" && ` • ${equipmentPackage}`}
              </p>
              <p className="text-2xl font-black text-neon leading-none">
                Rp {grandTotal.toLocaleString("id-ID")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTempPackage(equipmentPackage);
                setShowEquipmentModal(true);
              }}
              className="text-[10px] font-black text-neon uppercase tracking-wider bg-neon/10 px-3 py-1.5 rounded-lg border border-neon/20 italic"
            >
              {equipmentPackage === "NONE" ? "🎾 Add Gear" : "⚙️ Change"}
            </button>
          </div>
          <Button
            size="full"
            onClick={handleCheckoutClick}
            isLoading={isLoading}
            disabled={!canCheckout}
          >
            Checkout
          </Button>
        </div>
      </div>
      )}
      {/* Upsell Modal */}
      {showUpsellModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowUpsellModal(false)}></div>
          <div className="relative bg-[#0F0F0F] border border-white/10 rounded-[3rem] p-10 max-w-lg w-full text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-neon/10 rounded-full flex items-center justify-center mx-auto text-neon shadow-[0_0_40px_rgba(215,255,63,0.1)]">
              <span className="text-3xl">💎</span>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tight">Elite Access Required</h3>
              <p className="text-white/40 font-medium leading-relaxed">
                Unlock <span className="text-neon">H-14 Priority Reservation</span> window and enjoy exclusive member rates by upgrading to PadelGO Elite.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
               <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-neon uppercase tracking-widest mb-1">Standard</p>
                  <p className="text-xs font-bold text-white/60">H-7 Booking Window</p>
               </div>
               <div className="bg-neon/10 p-4 rounded-2xl border border-neon/20">
                  <p className="text-[10px] font-black text-neon uppercase tracking-widest mb-1">Elite Member</p>
                  <p className="text-xs font-bold text-white">H-14 Priority Window</p>
               </div>
            </div>
            <div className="flex flex-col gap-4">
               <Link href="/membership" className="w-full">
                 <Button size="full" className="h-14">Upgrade Now</Button>
               </Link>
               <button onClick={() => setShowUpsellModal(false)} className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic hover:text-white transition-colors">
                 Close
               </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Live Open Matches Feed (Part 4) */}
      {activeTab === "openMatch" && (
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 space-y-10 animate-fade-in-up">
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-end">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.4em] text-white/30 italic mb-4">
              <span>🎾</span> Community Matchmaking
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white italic uppercase tracking-tight leading-none select-none">
              Open <span className="text-neon drop-shadow-[0_0_15px_rgba(215,255,63,0.3)]">Matches.</span>
            </h2>
            <p className="text-white/60 font-medium text-lg max-w-xl leading-relaxed mt-4 mx-auto md:mx-0">
              Explore public matches hosted by other players. Join a lobby, coordinate manual split-payments, and build your sporty local community roster!
            </p>
          </div>
          
          {/* Stats Mini Panel */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-3xl w-full md:w-auto">
            <div className="text-center px-4">
              <p className="text-3xl font-black text-white leading-none">{activeMatchesList.length}</p>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Active</p>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="text-center px-4">
              <p className="text-3xl font-black text-neon leading-none">
                {activeMatchesList.reduce((acc, m) => acc + m.players.length, 0)}
              </p>
              <p className="text-[9px] font-bold text-neon/40 uppercase tracking-widest mt-1">Players</p>
            </div>
          </div>
        </div>



        {isLoadingMatches ? (
          <div className="bg-[#0F0F0F]/50 rounded-[2rem] border border-white/5 p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-neon/30 border-t-neon rounded-full animate-spin"></div>
          </div>
        ) : activeMatchesList.length === 0 ? (
          <div className="bg-[#0F0F0F]/30 rounded-[2rem] border border-dashed border-white/5 p-16 text-center select-none">
            <p className="text-white/30 font-bold text-base uppercase tracking-wider italic">No matches active at the moment 🎾</p>
            <p className="text-white/20 text-xs mt-1 font-semibold leading-relaxed">Book a court above, upload payment, and list your confirmed slot as an Open Match to kickstart the activity feed!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {activeMatchesList.map((m) => {
              const isJoined = m.players.some((p: any) => p.playerId === session?.user?.id);
              const isFull = m.players.length >= m.maxPlayers;
              const hostName = m.host.name;

              const matchDateStr = String(m.booking.date).slice(0, 10);
              const matchDate = new Date(matchDateStr);
              matchDate.setHours(Math.floor(m.booking.startTime / 60));
              matchDate.setMinutes(m.booking.startTime % 60);

              const now = new Date();
              const diffMs = matchDate.getTime() - now.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              
              let liveStatus = null;
              let statusColor = "bg-white/10 text-white border-white/20";
              
              if (diffMins <= 0 && diffMins > -120) {
                liveStatus = "🔴 LIVE NOW";
                statusColor = "bg-red-500/10 text-red-400 border-red-500/20";
              } else if (diffMins > 0 && diffMins <= 60) {
                liveStatus = `STARTS IN ${diffMins} MIN`;
                statusColor = "bg-orange-500/10 text-orange-400 border-orange-500/20";
              } else if (diffMins > 60 && diffMins <= 1440) {
                const hrs = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                liveStatus = `STARTS IN ${hrs}H ${mins}M`;
                statusColor = "bg-neon/10 text-neon border-neon/20";
              } else if (diffMins > 1440) {
                const days = Math.floor(diffMins / 1440);
                liveStatus = `IN ${days} DAYS`;
                statusColor = "bg-sky-500/10 text-sky-400 border-sky-500/20";
              }

              if (isFull && diffMins > 0) {
                 liveStatus = "FULL";
                 statusColor = "bg-white/5 text-white/30 border-white/10";
              }
              if (!isFull && m.maxPlayers - m.players.length === 1 && diffMins > 0) {
                 liveStatus = "1 SLOT LEFT";
                 statusColor = "bg-orange-500/10 text-orange-400 border-orange-500/20";
              }

              return (
                <div 
                  key={m.id}
                  onClick={() => setSelectedMatchDetail(m)}
                  className="bg-gradient-to-b from-[#0F0F0F] to-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 hover:border-neon/30 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(215,255,63,0.1)] cursor-pointer group flex flex-col justify-between min-h-[280px]"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-6">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {liveStatus && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border italic select-none ${statusColor}`}>
                              {liveStatus}
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight truncate max-w-[280px] group-hover:text-neon transition-colors">
                          {m.title}
                        </h3>
                      </div>
                      
                      <div className="text-right select-none shrink-0">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Players</p>
                        <p className={`text-2xl font-black italic leading-none ${isFull ? "text-white/20" : "text-white"}`}>
                          <span className={isFull ? "" : "text-neon"}>{m.players.length}</span><span className="text-white/20">/{m.maxPlayers}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 select-none mb-6">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white/50 text-lg">
                        📍
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-white truncate mb-0.5">{m.booking.court.venue?.name || "Padel Venue"}</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest truncate">{m.booking.court.name} • {matchDateStr}</p>
                        <p className="text-[10px] font-black text-neon uppercase tracking-widest truncate mt-0.5">{formatMinutesToHHmm(m.booking.startTime)} - {formatMinutesToHHmm(m.booking.endTime)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-5 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-3">
                        {m.players.slice(0, 4).map((p: any, idx: number) => {
                           const initials = p.player.name.substring(0, 2).toUpperCase();
                           return (
                             <div key={idx} className="w-10 h-10 rounded-full bg-[#1A1A1A] border-2 border-[#0A0A0A] flex items-center justify-center text-xs font-black text-white/80 shadow-md">
                               {initials}
                             </div>
                           );
                        })}
                        {m.players.length > 4 && (
                           <div className="w-10 h-10 rounded-full bg-neon/20 border-2 border-[#0A0A0A] flex items-center justify-center text-xs font-black text-neon shadow-md">
                             +{m.players.length - 4}
                           </div>
                        )}
                      </div>
                      {isJoined && (
                        <span className="text-[9px] font-black text-neon uppercase tracking-widest bg-neon/10 px-2 py-1 rounded-md border border-neon/20 hidden sm:inline-block">Joined</span>
                      )}
                    </div>

                    <button
                      className="h-10 px-5 sm:px-6 rounded-xl bg-white/5 group-hover:bg-neon group-hover:text-black text-white/50 group-hover:shadow-[0_0_15px_rgba(215,255,63,0.3)] font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Cinematic Match Detail Modal */}
      {selectedMatchDetail && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedMatchDetail(null)}></div>
          <div className="relative bg-[#0F0F0F] border border-white/10 rounded-[3rem] p-8 sm:p-10 max-w-lg w-full flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedMatchDetail(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
            
            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-3 pr-8">
                <div className="flex flex-wrap gap-2">

                  <span className="text-[10px] font-black uppercase tracking-widest bg-neon/10 text-neon px-3 py-1 rounded-md border border-neon/20 italic">
                    {selectedMatchDetail.matchType}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white italic uppercase tracking-tight leading-none">
                  {selectedMatchDetail.title}
                </h2>
              </div>

              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4 text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] italic">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xl text-white">📍</div>
                  <div>
                    <p className="text-base font-black text-white normal-case tracking-normal not-italic">{selectedMatchDetail.booking.court.venue?.name || "Padel Venue"}</p>
                    <p className="mt-1">{selectedMatchDetail.booking.court.name}</p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Date</span>
                  <span className="text-white font-black">{String(selectedMatchDetail.booking.date).slice(0, 10)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time</span>
                  <span className="text-white font-black font-sans tracking-normal">
                    {formatMinutesToHHmm(selectedMatchDetail.booking.startTime)} - {formatMinutesToHHmm(selectedMatchDetail.booking.endTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Host</span>
                  <span className="text-neon font-black">{selectedMatchDetail.host.name}</span>
                </div>
              </div>

              {selectedMatchDetail.description && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] pl-1">Host Notes</p>
                  <p className="text-white/70 font-medium text-sm leading-relaxed bg-white/[0.02] border border-white/[0.02] p-4 rounded-2xl italic">
                    "{selectedMatchDetail.description}"
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Players ({selectedMatchDetail.players.length}/{selectedMatchDetail.maxPlayers})</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {selectedMatchDetail.players.map((p: any, idx: number) => {
                    const initials = p.player.name.substring(0, 2).toUpperCase();
                    return (
                      <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[10px] font-black text-white/80">
                          {initials}
                        </div>
                        <span className="text-xs font-bold text-white truncate">{p.player.name} {idx === 0 && <span className="text-neon ml-1 text-[10px]">HOST</span>}</span>
                      </div>
                    );
                  })}
                  {Array.from({ length: selectedMatchDetail.maxPlayers - selectedMatchDetail.players.length }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="flex items-center gap-3 bg-white/5 border border-white/5 border-dashed p-3 rounded-xl opacity-50">
                      <div className="w-8 h-8 rounded-full bg-transparent border border-white/20 border-dashed flex items-center justify-center text-[10px] font-black text-white/30">
                        ?
                      </div>
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Open Slot</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5">
              {(() => {
                const isJoined = selectedMatchDetail.players.some((p: any) => p.playerId === session?.user?.id);
                const isFull = selectedMatchDetail.players.length >= selectedMatchDetail.maxPlayers;
                
                if (isJoined) {
                  return (
                    <button className="w-full h-14 rounded-xl bg-neon/10 border border-neon/20 text-neon font-black uppercase tracking-widest cursor-default">
                      You Have Joined
                    </button>
                  );
                }
                
                if (isFull) {
                  return (
                    <button className="w-full h-14 rounded-xl bg-white/5 text-white/30 font-black uppercase tracking-widest cursor-not-allowed">
                      Match Is Full
                    </button>
                  );
                }
                
                return (
                  <button
                    onClick={() => {
                      setSelectedMatchDetail(null);
                      handleJoinMatch(selectedMatchDetail.id, selectedMatchDetail.host.whatsapp);
                    }}
                    disabled={joiningMatchId === selectedMatchDetail.id}
                    className="w-full h-14 rounded-xl bg-neon hover:bg-neon/90 text-black font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(215,255,63,0.15)]"
                  >
                    {joiningMatchId === selectedMatchDetail.id ? "Joining..." : "Join Match"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Match Joined Success Modal (Part 3 & 5) */}
      {joinedSuccessMessage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => { setJoinedSuccessMessage(null); setJoinedHostWhatsapp(null); }}></div>
          <div className="relative bg-[#0F0F0F] border border-white/10 rounded-[3rem] p-10 max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-neon/10 rounded-full flex items-center justify-center mx-auto text-neon shadow-[0_0_40px_rgba(215,255,63,0.1)] select-none">
              <span className="text-3xl">🎾</span>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Joined Successfully!</h3>
              <p className="text-white/60 font-semibold text-xs leading-relaxed">
                {joinedSuccessMessage}
              </p>
            </div>
            {joinedHostWhatsapp && (
              <div className="pt-2">
                <a
                  href={`https://wa.me/${joinedHostWhatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 bg-[#25D366] hover:bg-[#20ba59] text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all flex items-center justify-center shadow-[0_0_15px_rgba(37,211,102,0.2)] gap-1.5"
                >
                  📱 Contact Host on WhatsApp
                </a>
              </div>
            )}
            <div>
              <button 
                onClick={() => { setJoinedSuccessMessage(null); setJoinedHostWhatsapp(null); }}
                className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
