import React from "react";

interface CourtCardProps {
  court: {
    id: string;
    name: string;
    location: string;
    pricePerHour: number;
    image?: string | null;
    description?: string | null;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export function CourtCard({ court, isSelected, onSelect }: CourtCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-[2rem] border-2 transition-all duration-300 cursor-pointer overflow-hidden transform-gpu ${
        isSelected
          ? "border-blue-600 shadow-[0_8px_30px_-4px_rgba(37,99,235,0.25)] -translate-y-1.5"
          : "border-slate-100 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1"
      }`}
    >
      {/* Court Image */}
      <div className="h-40 w-full relative overflow-hidden bg-slate-200">
        <div className="absolute inset-0 transition-transform duration-500 hover:scale-110">
          {court.image ? (
            <img
              src={court.image}
              alt={court.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
              Court Image
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none"></div>

        {/* Location badge */}
        <span className="absolute bottom-3 left-3 text-white font-bold text-xs bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg tracking-wide z-10">
          {court.location}
        </span>

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg z-10">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
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
          className={`font-black text-lg mb-1 transition-colors ${isSelected ? "text-blue-600" : "text-slate-900"}`}
        >
          {court.name}
        </h3>
        {court.description && (
          <p className="text-xs text-slate-500 font-medium mb-3 line-clamp-2">
            {court.description}
          </p>
        )}
        <p className="text-sm font-bold text-slate-500">
          Rp {court.pricePerHour.toLocaleString("id-ID")}{" "}
          <span className="text-slate-400 font-medium">/ jam</span>
        </p>
      </div>
    </div>
  );
}
