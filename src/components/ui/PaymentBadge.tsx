import React from "react";

type PaymentStatus =
  | "CONFIRMED"
  | "PENDING"
  | "NOT_SUBMITTED"
  | "REJECTED"
  | "SUBMITTED";

export function PaymentBadge({ status }: { status: string }) {
  const s = String(status).toUpperCase() as PaymentStatus;

  const variants: Record<
    PaymentStatus,
    {
      bg: string;
      text: string;
      label: string;
    }
  > = {
    CONFIRMED: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      label: "Confirmed",
    },
    PENDING: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      label: "Pending",
    },
    NOT_SUBMITTED: {
      bg: "bg-slate-50",
      text: "text-slate-600",
      label: "Not Submitted",
    },
    REJECTED: {
      bg: "bg-red-50",
      text: "text-red-700",
      label: "Rejected",
    },
    SUBMITTED: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      label: "Submitted",
    },
  };

  const variant = variants[s] || variants.NOT_SUBMITTED;

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${variant.bg} ${variant.text}`}
    >
      <span className={`w-2 h-2 rounded-full mr-2 ${variant.text}`}></span>
      {variant.label}
    </span>
  );
}
