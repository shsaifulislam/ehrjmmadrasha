"use client";

import { Clock, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface TimelineItem {
  id: string;
  title: string;
  timestamp: string;
  description?: string;
  status?: "SUCCESS" | "WARNING" | "INFO" | string;
  variant?: "SUCCESS" | "WARNING" | "INFO" | "danger" | "warning" | "success" | "info" | "primary" | "secondary" | string;
}

interface AppTimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function AppTimeline({ items, className = "" }: AppTimelineProps) {
  if (!items || items.length === 0) {
    return <div className="text-xs text-slate-400 p-4 text-center">কোনো টাইমলাইন তথ্য নেই।</div>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, idx) => {
        const itemStatus = (item.status || item.variant || "INFO").toUpperCase();
        return (
          <div key={item.id || idx} className="flex gap-3 relative pl-6 border-l-2 border-slate-200 dark:border-slate-800">
            <div className="absolute -left-[9px] top-0.5 bg-white dark:bg-slate-900 rounded-full">
              {itemStatus === "SUCCESS" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : itemStatus === "WARNING" ? (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              ) : (
                <Clock className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">{item.timestamp}</span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</h4>
              {item.description && <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
