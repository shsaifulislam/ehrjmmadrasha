"use client";

import React from "react";
import { FolderOpen } from "lucide-react";

export interface EhrjEmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EhrjEmptyState({
  icon,
  title = "কোনো তথ্য পাওয়া যায়নি",
  description = "বর্তমান ফিল্টারে কোনো রেকর্ড বিদ্যমান নেই। নতুন তথ্য যুক্ত করুন বা ফিল্টার পরিবর্তন করুন।",
  action,
  className = "",
}: EhrjEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-300 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center mb-3 shadow-inner border border-emerald-200/60">
        {icon || <FolderOpen className="w-7 h-7" />}
      </div>
      <h4 className="text-sm sm:text-base font-bold text-slate-800 font-display">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed font-sans">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export default EhrjEmptyState;
