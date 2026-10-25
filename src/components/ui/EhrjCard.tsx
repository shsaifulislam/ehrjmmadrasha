"use client";

import React from "react";

export type CardVariant = "default" | "elevated" | "glass" | "gold" | "stats";

export interface EhrjCardProps {
  children?: React.ReactNode;
  variant?: CardVariant;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export function EhrjCard({
  children,
  variant = "default",
  title,
  subtitle,
  icon,
  action,
  hoverable = false,
  className = "",
  headerClassName = "",
  bodyClassName = "",
}: EhrjCardProps) {
  const baseClasses = "rounded-2xl transition-all duration-200 overflow-hidden";

  const variantClasses: Record<CardVariant, string> = {
    default: "bg-white border border-slate-200/90 shadow-sm",
    elevated: "bg-white border border-slate-200/90 shadow-lg shadow-slate-900/5",
    glass: "glass-panel",
    gold: "bg-gradient-to-br from-amber-50/90 via-white to-slate-50 border border-amber-300/80 shadow-md shadow-amber-950/5",
    stats: "bg-white border border-slate-200/90 p-5 shadow-sm relative overflow-hidden",
  };

  const hoverClass = hoverable
    ? "hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 hover:shadow-slate-900/8 cursor-pointer"
    : "";

  const hasHeader = Boolean(title || subtitle || icon || action);

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${hoverClass} ${className}`}>
      {hasHeader && (
        <div
          className={`flex items-start justify-between gap-4 p-5 pb-3 border-b border-slate-100 ${headerClassName}`}
        >
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center flex-shrink-0 border border-emerald-200/70 shadow-xs">
                {icon}
              </div>
            )}
            <div>
              {title && <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={bodyClassName || (hasHeader ? "p-5 pt-4" : "p-5")}>{children}</div>
    </div>
  );
}

export default EhrjCard;
