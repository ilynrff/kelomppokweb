import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <input 
        className={`px-4 py-3 rounded-xl border-2 ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-100 focus:border-slate-300 focus:ring-slate-300'} bg-slate-50 focus:bg-white transition-colors w-full text-slate-900 placeholder-slate-400 font-medium`}
        {...props}
      />
      {error && <span className="text-sm font-semibold text-red-500 mt-1">{error}</span>}
    </div>
  );
}
