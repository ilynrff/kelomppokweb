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
      <button disabled className="w-full relative px-2 py-4 bg-red-50 text-red-400 opacity-60 cursor-not-allowed border-2 border-red-200 rounded-2xl font-bold flex flex-col items-center">
         <span className="text-sm md:text-base">{time}</span>
         <span className="text-xs font-semibold mt-1">Full</span>
      </button>
    );
  }

  return (
    <button 
      onClick={onSelect}
      className={`group w-full relative px-2 py-4 border-2 font-black flex flex-col items-center rounded-2xl transition-all duration-200 outline-none active:scale-95 ${
        isSelected 
          ? 'bg-blue-600 text-white border-blue-600 shadow-[0_8px_20px_-4px_rgba(59,130,246,0.5)] transform -translate-y-1' 
          : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-md hover:-translate-y-1'
      }`}
    >
       <span className="text-sm md:text-base">{time}</span>
       <span className={`text-xs mt-1 transition-colors ${isSelected ? 'text-blue-100 font-medium' : 'text-emerald-600 font-bold'}`}>
          Available
       </span>

       {/* Hover Info tooltip */}
       <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-10">
         Rp {(price).toLocaleString('id-ID')} / jam
         <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
       </div>
    </button>
  );
}
