import React from "react";
import { cn } from "@/lib/utils";

export interface AppStatsProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  subtitle?: string;
  className?: string;
}

export const AppStats: React.FC<AppStatsProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  className,
}) => {
  return (
    <div className={cn("p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between transition-all hover:shadow-md", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5",
              trend.isPositive
                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
    </div>
  );
};

export default AppStats;
