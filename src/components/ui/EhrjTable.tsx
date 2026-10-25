"use client";

import React, { useState, useMemo } from "react";
import { Search, Download, Printer, ArrowUpDown, ChevronDown } from "lucide-react";
import EhrjEmptyState from "./EhrjEmptyState";
import EhrjLoadingSkeleton from "./EhrjLoadingSkeleton";
import EhrjPagination from "./EhrjPagination";

export interface EhrjColumn<T> {
  key: string;
  title: string;
  render?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface EhrjTableProps<T> {
  columns: EhrjColumn<T>[];
  data: T[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  exportable?: boolean;
  onExportCsv?: () => void;
  className?: string;
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
}

export function EhrjTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  searchable = true,
  searchPlaceholder = "অনুসন্ধান করুন...",
  searchKeys,
  title,
  subtitle,
  action,
  emptyTitle,
  emptyDescription,
  pageSize = 10,
  exportable = false,
  onExportCsv,
  className = "",
  renderMobileCard,
}: EhrjTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Filtering
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().trim();

    return data.filter((row) => {
      const keysToSearch = searchKeys || (Object.keys(row) as (keyof T)[]);
      return keysToSearch.some((key) => {
        const val = row[key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [data, searchQuery, searchKeys]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const res = aVal > bVal ? 1 : -1;
      return sortDir === "asc" ? res : -res;
    });
  }, [filteredData, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleExportDefault = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    // Simple client CSV export
    if (!data.length) return;
    const exportCols = columns.map((c) => ({ key: c.key, title: c.title }));
    const header = exportCols.map((c) => `"${c.title}"`).join(",");
    const rows = sortedData.map((row) =>
      exportCols.map((c) => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [header, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ehrj-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden ${className}`}>
      {/* Top Bar */}
      {(title || searchable || exportable || action) && (
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
          <div>
            {title && <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-sans">{subtitle}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {searchable && (
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0D5C3A] font-sans"
                />
              </div>
            )}

            {exportable && (
              <button
                type="button"
                onClick={handleExportDefault}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                title="CSV ডাউনলোড করুন"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">এক্সপোর্ট</span>
              </button>
            )}

            {action}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="p-4">
          <EhrjLoadingSkeleton rows={5} columns={columns.length} />
        </div>
      ) : paginatedData.length === 0 ? (
        /* Empty State */
        <div className="p-6">
          <EhrjEmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`p-3.5 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${
                        col.sortable ? "cursor-pointer hover:bg-slate-100 select-none transition" : ""
                      } ${col.headerClassName || ""}`}
                    >
                      <div
                        className={`flex items-center gap-1.5 ${
                          col.align === "right"
                            ? "justify-end"
                            : col.align === "center"
                            ? "justify-center"
                            : "justify-start"
                        }`}
                      >
                        <span>{col.title}</span>
                        {col.sortable && (
                          <ArrowUpDown
                            className={`w-3 h-3 ${
                              sortKey === col.key ? "text-[#0D5C3A] font-black" : "text-slate-400"
                            }`}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedData.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-emerald-50/30 transition-colors">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`p-3.5 ${
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left"
                        } ${col.className || ""}`}
                      >
                        {col.render ? col.render(row, rIdx) : String(row[col.key] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Fallback View */}
          <div className="md:hidden divide-y divide-slate-100">
            {paginatedData.map((row, rIdx) =>
              renderMobileCard ? (
                <div key={rIdx} className="p-4">
                  {renderMobileCard(row, rIdx)}
                </div>
              ) : (
                <div key={rIdx} className="p-4 space-y-2 hover:bg-slate-50 transition">
                  {columns.map((col) => (
                    <div key={col.key} className="flex items-center justify-between text-xs gap-2">
                      <span className="font-bold text-slate-500">{col.title}:</span>
                      <span className="text-slate-800 font-medium text-right">
                        {col.render ? col.render(row, rIdx) : String(row[col.key] ?? "-")}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Pagination */}
          <div className="p-4 pt-0">
            <EhrjPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedData.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default EhrjTable;
