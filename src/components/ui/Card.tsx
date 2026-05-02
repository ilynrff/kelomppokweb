import React from 'react';

export function Card({ children, className = '', hoverEffect = false }: { children: React.ReactNode, className?: string, hoverEffect?: boolean }) {
  const hoverStyles = hoverEffect ? 'hover:-translate-y-1 hover:shadow-[0_12px_40px_-6px_rgba(0,0,0,0.08)] transition-all duration-300' : '';
  return (
    <div className={`bg-white rounded-3xl p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] border border-slate-100 ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
}
