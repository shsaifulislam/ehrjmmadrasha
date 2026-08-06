import React from "react";
import { cn } from "@/lib/utils";

export interface AppBadgeProps {
  variant?: "success" | "warning" | "danger" | "neutral" | "info";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  variant = "neutral",
  size = "md",
  children,
  className,
}) => {
  const base = "inline-flex items-center font-semibold rounded-full border transition-colors";
  
  const variants = {
    success: "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/50 dark:text-green-400",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-400",
    danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400",
    info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/50 dark:text-sky-400",
    neutral: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs"
  };

  return (
    <span className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};

export default AppBadge;
