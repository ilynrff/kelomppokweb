import React from "react";
import { ImageCarousel } from "@/components/ui/ImageCarousel";

interface CourtCardProps {
  court: {
    id: string;
    name: string;
    location: string;
    pricePerHour: number;
    images?: string[] | null;
    image?: string | null; // Backward compatibility
    description?: string | null;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export function CourtCard({ court, isSelected, onSelect }: CourtCardProps) {
  const courtImages = court.images || (court.image ? [court.image] : []);

  return (
    <div
      onClick={onSelect}
      className={`bg-white/5 backdrop-blur-xl rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden transform-gpu ${
        isSelected
          ? "border-neon shadow-[0_0_30px_rgba(215,255,63,0.2)] bg-white/10 -translate-y-1.5"
          : "border-white/10 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl hover:-translate-y-1"
      }`}
    >
      {/* Court Image Carousel */}
      <div className="h-40 w-full relative overflow-hidden bg-[#1A1A1A]">
        <ImageCarousel images={courtImages} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B]/80 to-transparent pointer-events-none"></div>

        {/* Location badge */}
        <span className="absolute bottom-3 left-3 text-white font-bold text-xs bg-black/40 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg tracking-wide z-10">
          {court.location}
        </span>

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-neon rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(215,255,63,0.4)] z-10">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="3.5"
              strokeLinecap="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Court Info */}
      <div className="p-5">
        <h3
          className={`font-black text-lg mb-1 transition-colors ${isSelected ? "text-neon" : "text-white"}`}
        >
          {court.name}
        </h3>
        {court.description && (
          <p className="text-sm text-white/60 leading-relaxed mb-4 line-clamp-3 text-left">
            {court.description}
          </p>
        )}
        <p className="text-sm font-bold text-white/70">
          Rp {court.pricePerHour.toLocaleString("id-ID")}{" "}
          <span className="text-white/40 font-medium">/ jam</span>
        </p>
      </div>
    </div>
  );
}
