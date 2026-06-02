"use client";

export const dynamic = "force-dynamic";

import { useBooking } from "@/hooks/useBooking";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { CourtCard } from "@/components/booking/CourtCard";
import { TimeSlot } from "@/components/booking/TimeSlot";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { CalendarView } from "@/components/booking/CalendarView";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { formatMinutesToHHmm } from "@/lib/bookingTime";

export default function BookingPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const membershipStatus = (session?.user as any)?.membershipStatus || "FREE";
  const isMember = membershipStatus === "ACTIVE";

  const [openMatches, setOpenMatches] = useState<any[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [joiningMatchId, setJoiningMatchId] = useState<string | null>(null);
  const [joinedSuccessMessage, setJoinedSuccessMessage] = useState<string | null>(null);
  const [joinedHostWhatsapp, setJoinedHostWhatsapp] = useState<string | null>(null);

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
  }, []);

  const handleJoinMatch = async (matchId: string, hostWhatsapp: string) => {
    if (!session) {
      alert("Please login first to join active matches.");
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

  const isStep1Done = !!selectedCourt;
  const isStep2Done = !!selectedDate;
  
  // Membership Priority Check
  const today = new Date();
  today.setHours(0,0,0,0);
  const targetDate = new Date(selectedDate);
  targetDate.setHours(0,0,0,0);
  const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // BASIC: H-7, MEMBER: H-14
  const maxDays = isMember ? 14 : 7;
  const isDateAllowed = diffDays <= maxDays;

  const isStep3Done = selectedSlots.length > 0;
  const canCheckout = isStep1Done && isStep2Done && isStep3Done && isDateAllowed;

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
    checkout();
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

              <div className="pt-4 border-t border-white/10 mt-4 flex justify-between items-center">
                <span className="font-bold text-white">Total</span>
                <span className="text-2xl font-black text-neon">
                  Rp {totalPrice.toLocaleString("id-ID")}
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

      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-12 animate-fade-in-up">
        <div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
            Reserve <span className="text-neon drop-shadow-[0_0_15px_rgba(215,255,63,0.3)]">Court.</span>
          </h1>
          <p className="text-white/60 font-medium text-lg max-w-xl leading-relaxed">
            Select your preferred court, date, and time slot below. Your premium padel experience awaits.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-10 items-start">
          <div className="space-y-16 w-full">
            {/* 1. Select Court */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${selectedCourt ? "bg-neon text-black shadow-[0_0_15px_rgba(215,255,63,0.3)]" : "bg-white/10 text-white/50"}`}
                >
                  {selectedCourt ? "✓" : "1"}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Select Court
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                {courts.length === 0 && (
                  <p className="text-white/40 font-medium col-span-2">
                    Loading courts...
                  </p>
                )}
                {courts.map((court) => (
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
            </div>

            {/* 2. Select Date */}
            <div
              className={`space-y-6 transition-opacity duration-500 ${!isStep1Done ? "opacity-30 pointer-events-none grayscale" : "opacity-100"}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${selectedDate ? "bg-neon text-black shadow-[0_0_15px_rgba(215,255,63,0.3)]" : "bg-white/10 text-white/50"}`}
                >
                  {selectedDate && isStep1Done ? "✓" : "2"}
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

            {/* 3. Time Slots */}
            <div
              className={`space-y-6 transition-opacity duration-500 ${!isStep2Done ? "opacity-30 pointer-events-none grayscale" : "opacity-100"}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${isStep3Done ? "bg-neon text-black shadow-[0_0_15px_rgba(215,255,63,0.3)]" : "bg-white/10 text-white/50"}`}
                  >
                    {isStep3Done ? "✓" : "3"}
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
                      Court
                    </p>
                    <p
                      className={`font-bold text-sm ${isStep1Done ? "text-white" : "text-white/30"}`}
                    >
                      {selectedCourtData?.name || "Not selected"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div
                    className={`w-6 h-6 rounded-full flex-shrink-0 mt-0.5 border-4 border-[#0F0F0F] shadow-sm ${isStep2Done ? "bg-neon" : "bg-white/20"}`}
                  ></div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5">
                      Date
                    </p>
                    <p
                      className={`font-bold text-sm ${isStep2Done ? "text-white" : "text-white/30"}`}
                    >
                      {selectedDate
                        ? `${selectedDate.getDate()} ${selectedDate.toLocaleDateString("en-US", { month: "short" })}`
                        : "Not selected"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div
                    className={`w-6 h-6 rounded-full flex-shrink-0 mt-0.5 border-4 border-[#0F0F0F] shadow-sm ${isStep3Done ? "bg-neon" : "bg-white/20"}`}
                  ></div>
                  <div className="w-full">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5">
                      Time
                    </p>
                    <div
                      className={`font-bold text-sm flex flex-wrap gap-1.5 ${isStep3Done ? "text-white" : "text-white/30"}`}
                    >
                      {isStep3Done
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

              <div className="pt-6 border-t border-white/10 mb-8 bg-white/5 -mx-8 px-8 pb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-white/50">
                    Standard Price
                  </span>
                  <span className="text-sm font-bold text-white/30 line-through">
                    Rp {courtPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                {isMember && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-neon uppercase tracking-widest">
                      Member Price Applied
                    </span>
                    <span className="text-sm font-black text-neon">
                      Rp {displayPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-white/50">
                    Duration
                  </span>
                  <span className="text-sm font-bold text-white">
                    {selectedSlots.length} Hours
                  </span>
                </div>
                {isMember && (
                  <div className="flex justify-between items-center mb-4 bg-neon/10 px-3 py-2 rounded-xl border border-neon/20">
                    <span className="text-[10px] font-black text-neon uppercase tracking-widest">Saved</span>
                    <span className="text-xs font-black text-neon">Rp {( (courtPrice - displayPrice) * selectedSlots.length ).toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between items-end border-t border-white/10 pt-4">
                  <div className="flex flex-col items-end w-full">
                    <div className="flex justify-between items-center w-full">
                       <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Total</span>
                       <p className="text-3xl font-black text-neon drop-shadow-[0_0_10px_rgba(215,255,63,0.2)]">
                         Rp {totalPrice.toLocaleString("id-ID")}
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

      <div
        className={`lg:hidden fixed bottom-0 left-0 w-full bg-[#0B0B0B]/90 backdrop-blur-xl border-t border-white/10 rounded-t-[2rem] p-6 px-5 shadow-[0_-20px_40px_rgba(0,0,0,0.4)] z-40 transform transition-transform duration-500 ease-out ${selectedSlots.length > 0 ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="w-full flex justify-between items-end">
            <div>
              <p className="text-white/60 font-medium text-xs mb-1">
                {selectedCourtData?.name || "Court"} • {selectedSlots.length}{" "}
                Hours
              </p>
              <p className="text-2xl font-black text-neon leading-none">
                Rp {totalPrice.toLocaleString("id-ID")}
              </p>
            </div>
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
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-20 mt-10 border-t border-white/5 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.4em] text-white/30 italic mb-3">
            <span>🎾</span> Community Matchmaking
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tight leading-none select-none">
            Live Open <span className="text-neon drop-shadow-[0_0_15px_rgba(215,255,63,0.3)]">Matches.</span>
          </h2>
          <p className="text-white/60 font-medium text-sm max-w-xl leading-relaxed mt-2">
            Explore public matches hosted by other players. Join a lobby, coordinate manual split-payments, and build your sporty local community roster!
          </p>
        </div>

        {isLoadingMatches ? (
          <div className="bg-[#0F0F0F]/50 rounded-[2rem] border border-white/5 p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-neon/30 border-t-neon rounded-full animate-spin"></div>
          </div>
        ) : openMatches.filter(m => m.status !== "CANCELED").length === 0 ? (
          <div className="bg-[#0F0F0F]/30 rounded-[2rem] border border-dashed border-white/5 p-16 text-center select-none">
            <p className="text-white/30 font-bold text-base uppercase tracking-wider italic">No matches active at the moment 🎾</p>
            <p className="text-white/20 text-xs mt-1 font-semibold leading-relaxed">Book a court above, upload payment, and list your confirmed slot as an Open Match to kickstart the activity feed!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {openMatches.filter(m => m.status !== "CANCELED").map((m) => {
              const isJoined = m.players.some((p: any) => p.playerId === session?.user?.id);
              const isFull = m.players.length >= m.maxPlayers;
              const hostName = m.host.name;

              return (
                <div 
                  key={m.id}
                  className="bg-gradient-to-b from-[#0F0F0F] to-black border border-white/5 rounded-[2rem] p-6 hover:border-neon/20 transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(215,255,63,0.02)] space-y-5"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        <span className="text-[8px] font-black uppercase tracking-widest bg-neon/10 text-neon px-2.5 py-0.5 rounded border border-neon/20 italic select-none">
                          {m.matchType}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-400 px-2.5 py-0.5 rounded border border-violet-500/20 italic select-none">
                          {m.skillLevel}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white italic uppercase tracking-tight truncate max-w-[280px]">
                        🎾 {m.title}
                      </h3>
                      <p className="text-white/40 text-[10px] font-semibold">
                        Host: <span className="text-white">{hostName}</span>
                      </p>
                    </div>

                    <div className="text-right select-none">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-0.5">Players</p>
                      <p className={`text-lg font-black italic ${isFull ? "text-red-400" : "text-neon"}`}>
                        {m.players.length} / {m.maxPlayers}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] italic select-none">
                    <div className="flex justify-between">
                      <span>📍 Court</span>
                      <span className="text-white font-black truncate max-w-[150px]">{m.booking.court.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📅 Date</span>
                      <span className="text-white font-black">{String(m.booking.date).slice(0, 10)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🕒 Time</span>
                      <span className="text-white font-black font-sans tracking-normal">
                        {formatMinutesToHHmm(m.booking.startTime)} - {formatMinutesToHHmm(m.booking.endTime)}
                      </span>
                    </div>
                  </div>

                  {m.description && (
                    <p className="text-white/60 font-semibold text-[11px] leading-relaxed italic bg-white/[0.02] border border-white/[0.02] p-3 rounded-xl">
                      "{m.description}"
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="text-left shrink-0 select-none">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block">Coordination</span>
                      <span className="text-[10px] font-black text-neon uppercase italic tracking-tighter">Host Pays Fully</span>
                    </div>

                    {isJoined ? (
                      <div className="h-10 px-6 rounded-xl bg-neon/10 border border-neon/20 text-neon font-black uppercase text-[10px] tracking-wider italic flex items-center gap-1 select-none">
                        <span>✓</span> Joined
                      </div>
                    ) : isFull ? (
                      <button
                        disabled
                        className="h-10 px-6 rounded-xl bg-white/5 border border-white/5 text-white/30 font-black uppercase text-[10px] tracking-wider italic select-none"
                      >
                        Match Full
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinMatch(m.id, m.host.whatsapp)}
                        disabled={joiningMatchId === m.id}
                        className="h-10 px-6 rounded-xl bg-neon hover:bg-neon/90 text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(215,255,63,0.15)] shrink-0 font-sans"
                      >
                        {joiningMatchId === m.id ? "Joining..." : "Join Match"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
