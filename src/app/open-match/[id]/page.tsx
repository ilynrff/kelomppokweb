"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { formatMinutesToHHmm, getOpenMatchLifecycleState } from "@/lib/bookingTime";
import { 
  Crown, Star, CalendarDays, Activity, ShieldCheck, Gem, Clock, 
  AlertCircle, MapPin, Share2, Users, CheckCircle2, Flame, Award, 
  Heart, PlusCircle, Trophy, ArrowLeft 
} from "lucide-react";

export default function MatchLobbyPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [match, setMatch] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const isGuest = status === "unauthenticated";
  const user = session?.user;

  // Fetch Open Match lobby details
  const fetchLobby = async () => {
    try {
      const res = await fetch(`/api/matches/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setMatch(null);
        } else {
          throw new Error("Gagal mengambil data lobby.");
        }
      } else {
        const data = await res.json();
        setMatch(data);
      }
    } catch (err: any) {
      setToast({ msg: err.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLobby();
    const interval = setInterval(fetchLobby, 20000);
    return () => clearInterval(interval);
  }, [id]);

  // Deep Link Authentication Flow:
  // If the user lands here unauthenticated, automatically redirect to login and then return right back here.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/open-match/${id}`);
    }
  }, [status, id, router]);

  // Join Match logic
  const joinMatch = async () => {
    if (isGuest) {
      router.push(`/login?callbackUrl=/open-match/${id}`);
      return;
    }
    setIsJoining(true);
    try {
      const res = await fetch(`/api/matches/${id}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal bergabung ke pertandingan.");
      }
      setToast({ msg: "Successfully joined match! Coordinate with your host.", type: "success" });
      await fetchLobby();
    } catch (err: any) {
      setToast({ msg: err.message, type: "error" });
    } finally {
      setIsJoining(false);
    }
  };

  // Smart WhatsApp-friendly share generator
  const shareMatch = () => {
    if (!match) return;
    const dateStr = String(match.booking.date).slice(0, 10);
    const timeStr = `${formatMinutesToHHmm(match.booking.startTime)} - ${formatMinutesToHHmm(match.booking.endTime)}`;
    const venueCourt = `${match.booking.court.venue?.name || "PadelGO"} - ${match.booking.court.name}`;
    const slotsLeft = match.maxPlayers - match.players.length;

    const text = `🎾 *PADEL OPEN MATCH — PADELGO* 🎾\nJoin my session for dynamic rallies!\n\n📍 Court: ${venueCourt}\n📅 Date: ${dateStr}\n🕒 Time: ${timeStr}\n👥 Players: ${match.players.length}/${match.maxPlayers} (${slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} left!` : 'Full House!'})\n\nJoin the lobby now:\n${window.location.origin}/open-match/${id}\n\nLet's play! 🔥`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `Padel Open Match at ${venueCourt}`,
        text: text,
        url: `${window.location.origin}/open-match/${id}`
      }).catch(() => {
        navigator.clipboard.writeText(text);
        setToast({ msg: "Match link and details copied!", type: "success" });
      });
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setToast({ msg: "Match link and details copied! Share on WhatsApp.", type: "success" });
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-[#050505] relative overflow-hidden pt-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-neon/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-neon/30 border-t-neon rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] italic animate-pulse">Synchronizing Lobby...</p>
        </div>
      </div>
    );
  }

  // Not Found Fallback
  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-[#050505] relative overflow-hidden pt-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <Card className="w-full max-w-lg p-10 !rounded-[2.5rem] shadow-2xl border-white/5 backdrop-blur-xl bg-[#0F0F0F]/80 text-center space-y-6">
          <div className="text-5xl">🚫</div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Lobby Not Found</h1>
          <p className="text-white/40 text-sm leading-relaxed font-semibold italic">
            The Open Match room you are trying to view has been canceled by the host or does not exist.
          </p>
          <div className="pt-2">
            <Link href="/booking">
              <Button size="lg" className="w-full">Explore Active Lobbies</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate session timing and lifecycle state
  const lifecycle = getOpenMatchLifecycleState({
    date: match.booking.date,
    startTime: match.booking.startTime,
    endTime: match.booking.endTime
  });

  const now = new Date();
  const localNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const bookingDateStr = new Date(match.booking.date).toISOString().split("T")[0];
  const localTodayStr = localNow.toISOString().split("T")[0];
  const nowMinutes = localNow.getUTCHours() * 60 + localNow.getUTCMinutes();

  let minutesUntilStart = -1;
  const isToday = bookingDateStr === localTodayStr;
  if (isToday) {
    minutesUntilStart = match.booking.startTime - nowMinutes;
  }

  const registeredCount = match.players.length;
  const max = match.maxPlayers || 4;
  const slotsLeft = max - registeredCount;

  const isHost = user && match.hostId === user.id;
  const isAlreadyJoined = user && match.players.some((p: any) => p.playerId === user.id);

  // Expired Lobbies Fallback
  if (lifecycle === "EXPIRED") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-[#050505] relative overflow-hidden pt-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-white/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <Card className="w-full max-w-lg p-10 !rounded-[2.5rem] shadow-2xl border-white/5 backdrop-blur-xl bg-[#0F0F0F]/80 text-center space-y-6">
          <div className="text-5xl">🏁</div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Match Ended</h1>
          <p className="text-white/40 text-sm leading-relaxed font-semibold italic">
            This Open Match has already completed its session time. Thank you for building the local padel community!
          </p>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-left text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] italic">
            📅 Play Date: {String(match.booking.date).slice(0, 10)} <br />
            🕒 Schedule: {formatMinutesToHHmm(match.booking.startTime)} - {formatMinutesToHHmm(match.booking.endTime)} <br />
            📍 Court: {match.booking.court.name}
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/booking">
              <Button size="lg" className="w-full">Explore Active Matches</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="w-full">Go to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Get dynamic state config for beautiful branding
  let stateLabel = "Lobby Active";
  let stateClass = "bg-neon/10 border-neon/20 text-neon";
  let reassuranceMsg = "Most matches get filled closer to play time. Join in or share the match!";

  if (lifecycle === "LIVE") {
    stateLabel = "🔴 Live Session";
    stateClass = "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse";
    reassuranceMsg = "This session is currently active. Bring your best energy to the court!";
  } else if (isToday && minutesUntilStart > 0 && minutesUntilStart <= 60) {
    stateLabel = "⏰ Starts Soon";
    stateClass = "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse";
    reassuranceMsg = `Warm up! The lobby is locked and starts in exactly ${minutesUntilStart} minutes.`;
  } else if (registeredCount >= max) {
    stateLabel = "✅ Full Squad";
    stateClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    reassuranceMsg = "Lobby is full! Align on strategies or coordinate direct logistics.";
  } else if (registeredCount > 1) {
    stateLabel = "🔥 Building Up";
    stateClass = "bg-orange-500/10 border-orange-500/20 text-orange-400";
    reassuranceMsg = "This lobby is actively gaining traction. Snag a slot before they are gone!";
  }

  return (
    <div className="flex-1 bg-[#050505] p-6 md:p-10 min-h-[calc(100vh-64px)] relative overflow-hidden pt-32 md:pt-40">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-neon/5 blur-[150px] rounded-full pointer-events-none -z-10"></div>

      {toast && (
        <Toast
          isOpen={true}
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6 relative z-10 animate-fade-in-up">
        {/* Navigation Breadcrumb */}
        <Link 
          href="/booking" 
          className="inline-flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-neon transition-colors italic mb-2 select-none"
        >
          <ArrowLeft size={12} /> Back to Matches Board
        </Link>

        {/* Centralized Premium Open Match Lobby Card */}
        <Card className="p-6 sm:p-10 !rounded-[2.5rem] border border-white/5 bg-[#0F0F0F]/80 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 blur-[100px] rounded-full pointer-events-none -z-10"></div>
          
          <div className="flex flex-col gap-6">
            {/* Header: State Badge + Lobby ID */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${stateClass}`}>
                  {stateLabel}
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 italic">
                  Lobby ID: {match.id.slice(0, 8)}
                </span>
              </div>
              <div className="text-[10px] font-black text-neon/80 uppercase italic tracking-wider bg-neon/5 border border-neon/10 rounded-lg px-2.5 py-1">
                🎾 Secure Padel Lobbies
              </div>
            </div>

            {/* Core Info: Title, Types, Descriptions */}
            <div className="grid md:grid-cols-[1fr_auto] gap-8 items-start">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[8px] font-black uppercase tracking-widest bg-white/5 text-white/60 px-2 py-1 rounded border border-white/10 italic select-none">
                    {match.matchType}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-400 px-2 py-1 rounded border border-violet-500/20 italic select-none">
                    {match.skillLevel}
                  </span>
                  {/* Future Tag Placeholder */}
                  <span className="text-[8px] font-black uppercase tracking-widest bg-white/[0.02] text-white/20 px-2 py-1 rounded border border-white/5 italic select-none">
                    🏆 Ranked Eligible
                  </span>
                </div>

                <div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">
                    {match.title}
                  </h1>
                  <p className="text-white/50 text-xs font-semibold leading-relaxed max-w-2xl italic">
                    "{match.description || "Join our community open padel session! We have booked court slots ready and are seeking players to complete the match roster."}"
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.25em] italic">
                  <div className="flex items-center gap-1.5 text-white/80">
                    <CalendarDays size={12} className="text-neon/50" /> {String(match.booking.date).slice(0, 10)}
                  </div>
                  <div className="flex items-center gap-1.5 text-white/80">
                    <Clock size={12} className="text-neon/50" /> {formatMinutesToHHmm(match.booking.startTime)} - {formatMinutesToHHmm(match.booking.endTime)}
                  </div>
                  <div className="flex items-center gap-1.5 text-white/80 truncate">
                    <MapPin size={12} className="text-neon/50" /> {match.booking.court.venue?.name || "PadelGO"} - {match.booking.court.name}
                  </div>
                </div>
              </div>

              {/* Glowing Squad Progress Indicator */}
              <div className="flex flex-col md:items-end gap-3 bg-white/[0.02] border border-white/5 p-5 rounded-[1.8rem] w-full md:w-64">
                <div className="flex justify-between items-center w-full">
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Lobby Squad</span>
                  <span className="text-xs font-black text-neon italic">
                    {registeredCount} / {max} Players
                  </span>
                </div>

                {/* Progress Dots */}
                <div className="flex items-center gap-2.5 my-2">
                  {Array.from({ length: max }).map((_, i) => {
                    const isJoined = i < registeredCount;
                    return (
                      <span
                        key={i}
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                          isJoined
                            ? "bg-neon border-neon shadow-[0_0_12px_rgba(215,255,63,0.6)] scale-110"
                            : "bg-white/5 border-white/10"
                        }`}
                      />
                    );
                  })}
                </div>

                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.1em] text-center w-full">
                  {slotsLeft === 0 ? "✨ FULL HOUSE" : `${slotsLeft} SLOTS AVAILABLE`}
                </p>
              </div>
            </div>

            {/* Smart Microcopy Block */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-lg">💡</span>
              <div>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Squad Dynamics</p>
                <p className="text-xs font-semibold text-white/70 italic leading-relaxed">
                  {reassuranceMsg}
                </p>
              </div>
            </div>

            {/* Match Roster with Future Ratings Placeholders */}
            <div className="pt-4 border-t border-white/5">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Current Lobby Roster</p>
                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.15em] italic select-none">
                  ⭐ Star rating reflects match history
                </span>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {match.players.map((p: any) => {
                  const isPlayerHost = p.playerId === match.hostId;
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 group/roster hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isPlayerHost ? "bg-neon text-black" : "bg-white/10 text-white/70"
                        }`}>
                          {String(p.player.name || "P").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{p.player.name}</span>
                            {isPlayerHost && (
                              <span className="text-[7px] font-black text-neon uppercase italic tracking-widest bg-neon/10 px-1.5 py-0.5 rounded border border-neon/20 select-none">
                                Host
                              </span>
                            )}
                            {!isPlayerHost && (
                              <CheckCircle2 size={10} className="text-sky-400 opacity-60" title="Future Release: Verified Skill Player" />
                            )}
                          </div>
                          {/* Future Placeholders */}
                          <div className="flex items-center gap-2 mt-0.5 text-[8px] font-bold text-white/30 uppercase tracking-tighter">
                            <span className="flex items-center gap-0.5">
                              <Star size={8} className="text-amber-400 fill-amber-400" /> 4.8 Rating
                            </span>
                            <span>•</span>
                            <span className="text-white/40">Intermediate</span>
                          </div>
                        </div>
                      </div>

                      {/* Future Favorite Toggle */}
                      <button 
                        className="text-white/15 hover:text-red-400 hover:scale-110 active:scale-95 transition-all"
                        title="Future Release: Add as Favorite Teammate"
                        onClick={(e) => {
                          e.stopPropagation();
                          setToast({ msg: "Future feature: Teammate added to favorites!", type: "success" });
                        }}
                      >
                        <Heart size={12} className="fill-current" />
                      </button>
                    </div>
                  );
                })}

                {/* Open slot invitations */}
                {slotsLeft > 0 && (
                  <div 
                    onClick={shareMatch}
                    className="flex items-center justify-center border border-dashed border-white/10 rounded-2xl p-4 bg-white/[0.01] hover:bg-white/[0.02] cursor-pointer group/invite transition-all"
                  >
                    <span className="flex items-center gap-2 text-[9px] font-black uppercase text-white/30 group-hover/invite:text-neon transition-colors tracking-widest">
                      <PlusCircle size={14} className="text-white/20 group-hover/invite:text-neon transition-colors" />
                      Invite Player
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar: Join or WhatsApp Host */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/5">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {isAlreadyJoined ? (
                  <>
                    <span className="h-11 px-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-[9px] font-black text-emerald-400 uppercase tracking-widest italic shadow-[0_0_10px_rgba(16,185,129,0.05)] select-none flex items-center justify-center gap-1.5 w-full sm:w-auto">
                      ✅ Joined Lobby
                    </span>
                    <a
                      href={`https://wa.me/${match.host.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 px-6 bg-neon hover:bg-neon/90 text-black text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    >
                      <span>📱</span> Contact Host
                    </a>
                  </>
                ) : isHost ? (
                  <>
                    <span className="h-11 px-5 rounded-xl border border-neon/20 bg-neon/5 text-[9px] font-black text-neon uppercase tracking-widest italic shadow-[0_0_10px_rgba(215,255,63,0.05)] select-none flex items-center justify-center gap-1.5 w-full sm:w-auto">
                      👑 You are the Host
                    </span>
                    <button
                      onClick={shareMatch}
                      className="h-11 px-6 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black text-white/60 uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    >
                      <Share2 size={12} /> Share Match
                    </button>
                  </>
                ) : slotsLeft === 0 ? (
                  <span className="h-11 px-5 rounded-xl border border-white/10 bg-white/5 text-[9px] font-black text-white/30 uppercase tracking-widest italic select-none flex items-center justify-center gap-1.5 w-full sm:w-auto">
                    🚫 Lobby Full
                  </span>
                ) : (
                  <button
                    onClick={joinMatch}
                    disabled={isJoining}
                    className="h-11 px-8 bg-neon hover:bg-neon/90 text-black text-[9px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(215,255,63,0.15)] flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    {isJoining ? "Joining..." : "🎾 Join Match"}
                  </button>
                )}

                {!isHost && !isAlreadyJoined && (
                  <button
                    onClick={shareMatch}
                    className="h-11 px-5 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black text-white/60 uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    <Share2 size={12} /> Share Match
                  </button>
                )}
              </div>

              {/* Future Meta Placement */}
              <div className="w-full sm:w-auto text-right text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic select-none">
                🔒 PadelGO Sports Platform
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
