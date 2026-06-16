import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export function Input({ label, error, rightElement, className = '', ...props }: InputProps) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">
        {label}
      </label>
      <div className="relative group flex items-center">
        <input 
          className={`
            w-full px-5 py-4 rounded-2xl border text-sm
            transition-all duration-500 outline-none backdrop-blur-md
            font-medium text-white placeholder:text-white/10
            ${error 
              ? 'border-red-500/30 bg-red-500/5 focus:border-red-500' 
              : 'border-white/[0.03] bg-white/[0.02] focus:border-neon/40 focus:bg-white/[0.04] focus:shadow-[0_0_20px_rgba(215,255,63,0.05)]'
            }
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-4 flex items-center justify-center text-white/20 group-focus-within:text-neon/60 transition-colors">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1.5 px-1 mt-1">
          <div className="w-1 h-1 rounded-full bg-red-500"></div>
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">{error}</span>
        </div>
      )}
    </div>
  );
}
