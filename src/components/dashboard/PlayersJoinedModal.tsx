"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Shield, Star, Check } from "lucide-react";
import { formatMinutesToHHmm } from "@/lib/bookingTime";

type Player = {
  id: string;
  playerId: string;
  player: {
    id: string;
    name: string;
    whatsapp: string;
  };
};

type OpenMatch = {
  id: string;
  hostId: string;
  host: {
    id: string;
    name: string;
    whatsapp: string;
  };
  players: Player[];
  skillLevel: string;
  booking: {
    id: string;
    date: string;
    startTime: number;
    endTime: number;
    court: {
      name: string;
      venue?: {
        name: string;
      } | null;
    };
  };
};

type PlayersJoinedModalProps = {
  isOpen: boolean;
  match: OpenMatch;
  currentUserId: string;
  onClose: () => void;
};

export function PlayersJoinedModal({
  isOpen,
  match,
  currentUserId,
  onClose,
}: PlayersJoinedModalProps) {
  // Sort players: Host first
  const sortedPlayers = [...match.players].sort((a, b) => {
    if (a.playerId === match.hostId) return -1;
    if (b.playerId === match.hostId) return 1;
    return 0;
  });

  const isHostUser = currentUserId === match.hostId;

  // Generate WhatsApp messaging templates
  const getHostToPlayerWAUrl = (player: any) => {
    const rawPhone = player.player.whatsapp || "";
    const cleanedPhone = rawPhone.replace(/\D/g, "");

    const dateStr = String(match.booking.date).slice(0, 10);
    const timeStr = `${formatMinutesToHHmm(match.booking.startTime)} - ${formatMinutesToHHmm(match.booking.endTime)}`;
    const venueCourt = `${match.booking.court.venue?.name || "PadelGO"} - ${match.booking.court.name}`;

    const message = `Hi ${player.player.name} 👋\n\nThank you for joining our Open Match on PADELGO.\n\n📍 Court:\n${venueCourt}\n\n📅 Date:\n${dateStr}\n\n🕒 Time:\n${timeStr}\n\nLooking forward to seeing you on court!\n\nIf you have any questions, feel free to reply here.`;
    return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
  };

  const getPlayerToHostWAUrl = () => {
    const host = match.host;
    const rawPhone = host?.whatsapp || "";
    const cleanedPhone = rawPhone.replace(/\D/g, "");

    const message = `Hi ${host?.name || "Host"} 👋\n\nI just joined your Open Match on PADELGO.\n\nLooking forward to playing together.\n\nSee you at the court!`;
    return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const modalVariants = {
    hidden: { scale: 0.95, y: 15, opacity: 0 },
    visible: {
      scale: 1,
      y: 0,
      opacity: 1,
      transition: { type: "spring", duration: 0.4, bounce: 0.15 },
    },
    exit: { scale: 0.95, y: 10, opacity: 0, transition: { duration: 0.2 } },
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 cursor-pointer"
        >
          <motion.div
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md bg-[#0F0F0F] border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[75vh] overflow-hidden cursor-default pb-safe"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors focus:outline-none"
            >
              <X size={14} />
            </button>

            {/* Header */}
            <div className="mb-6 shrink-0 pr-8">
              <span className="text-[8px] font-black text-neon uppercase tracking-[0.25em] block mb-1">
                Squad List
              </span>
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">
                Players Joined
              </h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-0.5">
                {match.players.length} / {match.maxPlayers || 4} Slots Occupied
              </p>
            </div>

            {/* Participant Cards List */}
            <div className="overflow-y-auto pr-1 flex-1 space-y-3 custom-scrollbar min-h-0 py-1">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {sortedPlayers.map((p) => {
                  const isPlayerHost = p.playerId === match.hostId;
                  const isSelf = p.playerId === currentUserId;

                  // Visibility logic for Chat via WhatsApp button:
                  // 1. Host can chat with any other player.
                  // 2. Joined Player can ONLY chat with the Host.
                  // 3. Current user cannot chat with themselves.
                  const showChatButton =
                    (isHostUser && !isSelf) || (!isHostUser && isPlayerHost);

                  const chatUrl = isHostUser
                    ? getHostToPlayerWAUrl(p)
                    : getPlayerToHostWAUrl();

                  return (
                    <motion.div
                      key={p.id}
                      variants={itemVariants}
                      whileHover={{ y: -2 }}
                      className="flex items-center justify-between bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all shadow-lg group/card"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 relative ${
                            isPlayerHost
                              ? "bg-neon text-black"
                              : "bg-white/10 text-white/70"
                          }`}
                        >
                          {String(p.player.name || "P")
                            .slice(0, 2)
                            .toUpperCase()}
                          {isPlayerHost && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-neon border-2 border-[#0F0F0F] rounded-full flex items-center justify-center text-[7px] text-black">
                              👑
                            </span>
                          )}
                        </div>

                        {/* Player details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[160px]">
                              {p.player.name}
                            </span>
                            {isPlayerHost && (
                              <span className="text-[6.5px] font-black text-neon bg-neon/10 border border-neon/20 px-1.5 py-0.5 rounded uppercase tracking-wider italic select-none">
                                Host
                              </span>
                            )}
                            {isSelf && (
                              <span className="text-[6.5px] font-black text-white/60 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded uppercase tracking-wider italic select-none">
                                You
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[8px] font-bold text-white/30 uppercase tracking-tighter">
                            <span className="flex items-center gap-0.5 text-white/40">
                              <Star size={8} className="text-amber-400 fill-amber-400 shrink-0" />
                              {isPlayerHost ? "4.9 Rating" : "4.7 Rating"}
                            </span>
                            <span>•</span>
                            <span>{match.skillLevel}</span>
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp Chat Trigger */}
                      {showChatButton ? (
                        <a
                          href={chatUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 px-3 bg-neon hover:bg-neon/90 text-black text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_12px_rgba(215,255,63,0.15)] flex items-center justify-center gap-1.5 shrink-0 focus:outline-none hover:scale-[1.02] active:scale-95"
                        >
                          <MessageSquare size={10} />
                          <span>Chat</span>
                        </a>
                      ) : isSelf ? (
                        <div className="h-9 px-3 border border-white/10 bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 shrink-0 select-none">
                          <Check size={10} className="text-neon" />
                          <span>Joined</span>
                        </div>
                      ) : null}
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
