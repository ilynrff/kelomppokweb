import React from 'react';

interface TimeSlotProps {
  time: string;
  isAvailable: boolean;
  isSelected: boolean;
  price: number;
  onSelect: () => void;
}

export function TimeSlot({ time, isAvailable, isSelected, price, onSelect }: TimeSlotProps) {
  if (!isAvailable) {
    return (
      <button disabled className="w-full relative px-2 py-4 bg-[#111] text-white/30 opacity-60 cursor-not-allowed border border-white/5 rounded-2xl font-bold flex flex-col items-center">
         <span className="text-sm md:text-base">{time}</span>
         <span className="text-xs font-semibold mt-1">Full</span>
      </button>
    );
  }

  return (
    <button 
      onClick={onSelect}
      className={`group w-full relative px-2 py-4 border font-black flex flex-col items-center rounded-2xl transition-all duration-300 outline-none active:scale-95 ${
        isSelected 
          ? 'bg-neon text-black border-neon shadow-[0_0_20px_rgba(215,255,63,0.3)] transform -translate-y-1' 
          : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:-translate-y-1 backdrop-blur-sm'
      }`}
    >
       <span className="text-sm md:text-base">{time}</span>
       <span className={`text-xs mt-1 transition-colors ${isSelected ? 'text-black/70 font-medium' : 'text-neon font-bold'}`}>
          Available
       </span>

       {/* Hover Info tooltip */}
       <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white text-black font-bold text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-[0_0_15px_rgba(255,255,255,0.3)] z-10">
         Rp {(price).toLocaleString('id-ID')} / jam
         <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
       </div>
    </button>
  );
}
