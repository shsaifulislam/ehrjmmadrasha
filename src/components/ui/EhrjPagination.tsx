"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface EhrjPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function EhrjPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
}: EhrjPaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = totalItems !== undefined && pageSize !== undefined ? (currentPage - 1) * pageSize + 1 : null;
  const endItem =
    totalItems !== undefined && pageSize !== undefined
      ? Math.min(currentPage * pageSize, totalItems)
      : null;

  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-xs font-sans ${className}`}
    >
      <div className="text-slate-500 font-medium">
        {totalItems !== undefined && startItem !== null && endItem !== null ? (
          <span>
            সর্বমোট <strong className="text-slate-800 font-bold">{totalItems}</strong> টি রেকর্ডের মধ্যে{" "}
            <strong className="text-slate-800 font-bold">
              {startItem}-{endItem}
            </strong>{" "}
            প্রদর্শিত
          </span>
        ) : (
          <span>
            পৃষ্ঠা <strong className="text-slate-800 font-bold">{currentPage}</strong> / {totalPages}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="পূর্ববর্তী পৃষ্ঠা"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {startPage > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition"
            >
              ১
            </button>
            {startPage > 2 && <span className="px-1 text-slate-400">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              p === currentPage
                ? "bg-[#0D5C3A] text-white shadow-xs"
                : "border border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 text-slate-400">...</span>}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="পরবর্তী পৃষ্ঠা"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default EhrjPagination;
