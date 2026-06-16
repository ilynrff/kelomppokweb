import React from 'react';

export function Card({ children, className = '', hoverEffect = false }: { children: React.ReactNode, className?: string, hoverEffect?: boolean }) {
  const hoverStyles = hoverEffect ? 'hover:-translate-y-1 hover:bg-white/10 transition-all duration-500 cursor-default' : '';
  return (
    <div className={`bg-[#0F0F0F] border border-white/5 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
}
