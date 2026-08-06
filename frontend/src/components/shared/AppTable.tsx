import React from "react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "./TableSkeleton";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  title: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface AppTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  selectedIds?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: (selected: boolean) => void;
  getRowId?: (row: T) => string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
}

export function AppTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle = "কোনো তথ্য পাওয়া যায়নি",
  emptyDescription = "বর্তমানে এই তালিকায় কোনো ডাটা নেই।",
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  getRowId = (row: any) => row.id,
  pagination,
  className,
}: AppTableProps<T>) {
  if (loading) {
    return <TableSkeleton rows={5} columns={columns.length + (onSelectRow ? 1 : 0)} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const allSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className={cn("w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              {onSelectAll && (
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={allSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className={cn("p-3.5 text-xs font-bold uppercase tracking-wider", col.className)}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {data.map((row, idx) => {
              const rowId = getRowId(row);
              const isSelected = selectedIds.includes(rowId);

              return (
                <tr
                  key={rowId || idx}
                  className={cn(
                    "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors",
                    isSelected && "bg-blue-50/50 dark:bg-blue-950/30"
                  )}
                >
                  {onSelectRow && (
                    <td className="p-3 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={isSelected}
                        onChange={() => onSelectRow(rowId)}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={cn("p-3.5 align-middle", col.className)}>
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div>
            মোট <span className="font-semibold text-slate-900 dark:text-slate-100">{pagination.total}</span> টির মধ্যে{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            টি দেখানো হচ্ছে
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              পূর্ববর্তী
            </button>
            <span className="px-2 font-medium">
              পৃষ্ঠা {pagination.page} / {Math.ceil(pagination.total / pagination.limit) || 1}
            </span>
            <button
              className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              পরবর্তী
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppTable;
