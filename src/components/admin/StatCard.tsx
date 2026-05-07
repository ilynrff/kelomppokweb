import React from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "yellow" | "green" | "red";
};

export function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorStyles[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
