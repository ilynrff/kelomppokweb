"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Calendar, Clock, MapPin, Users, Award, Shield, MessageSquare, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatMinutesToHHmm } from "@/lib/bookingTime";

type Booking = {
  id: string;
  bookingCode?: string | null;
  date: string;
  startTime: number;
  endTime: number;
  court?: { id?: string; name?: string; location?: string };
};

type CreateOpenMatchModalProps = {
  booking: Booking;
  onClose: () => void;
  onSuccess: (match: any) => void;
  onError: (msg: string) => void;
};

export function CreateOpenMatchModal({
  booking,
  onClose,
  onSuccess,
  onError,
}: CreateOpenMatchModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [title, setTitle] = useState("");
  const [matchType, setMatchType] = useState("Fun Match");
  const [skillLevel, setSkillLevel] = useState("Intermediate");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const overlayVariants = {
    hidden: { opacity: 0, backdropFilter: "blur(0px)" },
    visible: { opacity: 1, backdropFilter: "blur(8px)", transition: { duration: 0.3 } },
    exit: { opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 0.25 } }
  };

  const modalVariants = {
    hidden: isMobile 
      ? { y: "100%", opacity: 0.9, scale: 1 } 
      : { y: 20, opacity: 0, scale: 0.95 },
    visible: { 
      y: 0, 
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.35, 
        ease: [0.16, 1, 0.3, 1] 
      }
    },
    exit: isMobile 
      ? { y: "100%", opacity: 0.9, scale: 1, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } }
      : { y: 20, opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onError("Please enter a match title.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          title,
          matchType,
          skillLevel,
          maxPlayers,
          description,
          visibility,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create open match.");
      }

      onSuccess(data);
    } catch (err: any) {
      onError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 cursor-pointer"
    >
      <motion.div 
        variants={modalVariants}
        className="bg-[#0F0F0F] w-full sm:max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1A1A1A] px-6 sm:px-8 py-6 text-center relative border-b border-white/5 shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
          >
            <X size={14} />
          </button>
          <p className="text-neon font-bold uppercase tracking-widest text-[9px] mb-1.5">Create Room</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight">
            🎾 Open Match
          </h2>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-tight">
            Find players and assemble your ultimate game room
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Section 1: Auto-populated Booking Context (Read-Only) */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
            <p className="text-[8px] font-black text-neon uppercase tracking-[0.2em]">Booking Context</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-white/60">
                <MapPin size={12} className="text-neon/60" />
                <span className="truncate">{booking.court?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Calendar size={12} className="text-neon/60" />
                <span>{String(booking.date).slice(0, 10)}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 col-span-2">
                <Clock size={12} className="text-neon/60" />
                <span>
                  {formatMinutesToHHmm(booking.startTime)} - {formatMinutesToHHmm(booking.endTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Title input */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Match Title</label>
            <Input
              type="text"
              placeholder="e.g. Friday Night Fun Match"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white rounded-xl focus:border-neon focus:ring-0 placeholder:text-white/20"
              maxLength={40}
              required
            />
          </div>

                  {/* Dropdown details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Match Type */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Match Type</label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value)}
                className="w-full h-12 px-4 pr-10 rounded-xl bg-[#161616] border border-white/10 text-xs font-black uppercase text-white tracking-wider focus:border-neon focus:outline-none appearance-none bg-no-repeat bg-[right_1rem_center] bg-[size:16px_16px] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23d7ff3f%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]"
              >
                <option value="Fun Match">Fun Match</option>
                <option value="Competitive">Competitive</option>
                <option value="Training Session">Training Session</option>
                <option value="Friendly Game">Friendly Game</option>
              </select>
            </div>

            {/* Skill Level */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Skill Level</label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full h-12 px-4 pr-10 rounded-xl bg-[#161616] border border-white/10 text-xs font-black uppercase text-white tracking-wider focus:border-neon focus:outline-none appearance-none bg-no-repeat bg-[right_1rem_center] bg-[size:16px_16px] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23d7ff3f%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Players limit & Visibility */}
          <div className="grid grid-cols-2 gap-4">
            {/* Max Players */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Total Room Capacity</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full h-12 px-4 pr-10 rounded-xl bg-[#161616] border border-white/10 text-xs font-black uppercase text-white tracking-wider focus:border-neon focus:outline-none appearance-none bg-no-repeat bg-[right_1rem_center] bg-[size:16px_16px] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23d7ff3f%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]"
              >
                <option value={2}>2 Players (1v1)</option>
                <option value={3}>3 Players</option>
                <option value={4}>4 Players (2v2)</option>
              </select>
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full h-12 px-4 pr-10 rounded-xl bg-[#161616] border border-white/10 text-xs font-black uppercase text-white tracking-wider focus:border-neon focus:outline-none appearance-none bg-no-repeat bg-[right_1rem_center] bg-[size:16px_16px] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23d7ff3f%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]"
              >
                <option value="PUBLIC">Public</option>
                <option value="MEMBERS_ONLY">Members Only</option>
              </select>
            </div>
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Match Details (Optional)</label>
            <textarea
              placeholder="e.g. Splitting court fee manually. Intermediate standard players prefered! Lets play!"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-neon focus:outline-none placeholder:text-white/20 resize-none font-medium leading-relaxed"
              maxLength={150}
            />
          </div>

          {/* Disclaimer (Part 3) */}
          <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex gap-3 text-[10px] text-amber-400 font-semibold leading-relaxed">
            <Shield size={16} className="shrink-0 text-amber-400 mt-0.5 animate-pulse" />
            <p>
              <span className="font-black uppercase block tracking-wider mb-0.5">Host-Based Payment Policy</span>
              You remain fully responsible for the court fee. Other players who register will coordinate payments manually with you.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button type="submit" size="full" isLoading={isSubmitting} className="h-12 bg-neon hover:bg-neon/90 text-black font-black uppercase tracking-widest rounded-xl transition-all">
              🎾 Publish Match Room
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
