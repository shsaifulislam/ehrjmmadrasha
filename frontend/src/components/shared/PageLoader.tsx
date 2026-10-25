"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  label?: string;
  className?: string;
}

export function PageLoader({ label = "ডাটা লোড করা হচ্ছে...", className = "" }: PageLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 space-y-3 ${className}`}>
      <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-400" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse">
        {label}
      </p>
    </div>
  );
}
