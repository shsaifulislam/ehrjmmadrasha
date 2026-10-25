"use client";

import React from "react";

export interface EhrjLoadingSkeletonProps {
  rows?: number;
  columns?: number;
  variant?: "table" | "card" | "text" | "stats";
  className?: string;
}

export function EhrjLoadingSkeleton({
  rows = 4,
  columns = 4,
  variant = "table",
  className = "",
}: EhrjLoadingSkeletonProps) {
  if (variant === "stats") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200 rounded-md" />
              <div className="w-9 h-9 bg-slate-200 rounded-xl" />
            </div>
            <div className="h-7 w-20 bg-slate-300 rounded-lg" />
            <div className="h-3 w-32 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 animate-pulse">
            <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-100 rounded-md" />
              <div className="h-3 w-5/6 bg-slate-100 rounded-md" />
            </div>
            <div className="pt-2 flex justify-between items-center">
              <div className="h-4 w-16 bg-slate-200 rounded-md" />
              <div className="h-8 w-20 bg-slate-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs ${className}`}>
      {/* Header Skeleton */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200/70 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded-md flex-1 animate-pulse" />
        ))}
      </div>
      {/* Rows Skeleton */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4 animate-pulse">
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className="h-4 bg-slate-100 rounded-md flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EhrjLoadingSkeleton;
