"use client";

import React from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "gold" | "neutral";
export type BadgeSize = "sm" | "md";

export interface EhrjBadgeProps {
  label: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function EhrjBadge({
  label,
  variant = "neutral",
  size = "md",
  dot = false,
  pulse = false,
  icon,
  className = "",
}: EhrjBadgeProps) {
  const baseClasses = "inline-flex items-center font-bold rounded-full select-none";

  const sizeClasses: Record<BadgeSize, string> = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  const variantClasses: Record<BadgeVariant, string> = {
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200/90",
    warning: "bg-amber-50 text-amber-800 border border-amber-200/90",
    danger: "bg-red-50 text-red-800 border border-red-200/90",
    info: "bg-blue-50 text-blue-800 border border-blue-200/90",
    gold: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 border border-amber-300/80 shadow-xs",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200/90",
  };

  const dotColorClasses: Record<BadgeVariant, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
    gold: "bg-[#D4AF37]",
    neutral: "bg-slate-400",
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColorClasses[variant]}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColorClasses[variant]}`} />
        </span>
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  );
}

export default EhrjBadge;
