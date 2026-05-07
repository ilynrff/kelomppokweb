import React from 'react';

export function Badge({ status, textOverride }: { status: 'AVAILABLE' | 'BOOKED' | 'PENDING' | 'MAINTENANCE', textOverride?: string }) {
  const variants = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    BOOKED: 'bg-slate-100 text-slate-500 border-slate-200',
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    MAINTENANCE: 'bg-red-100 text-red-700 border-red-200',
  };
  
  const defaultLabels = {
    AVAILABLE: 'Available',
    BOOKED: 'Booked',
    PENDING: 'Menunggu Verifikasi',
    MAINTENANCE: 'Closed'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${variants[status]}`}>
      {textOverride || defaultLabels[status]}
    </span>
  );
}
