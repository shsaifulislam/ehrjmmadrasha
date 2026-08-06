"use client";

import { QrCode } from "lucide-react";

interface AppQRProps {
  value: string;
  size?: number;
  label?: string;
  className?: string;
}

export function AppQR({ value, size = 80, label, className = "" }: AppQRProps) {
  return (
    <div className={`inline-flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs ${className}`}>
      <div className="flex items-center justify-center bg-slate-50 p-2 rounded-lg">
        <QrCode className="text-slate-900" style={{ width: size, height: size }} />
      </div>
      {label && <span className="text-[10px] font-mono text-slate-500 mt-1">{label}</span>}
    </div>
  );
}
