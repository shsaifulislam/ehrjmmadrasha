"use client";

import React from "react";
import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-800 ${className}`}>
      <div className="p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full mb-3 shadow-xs">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
