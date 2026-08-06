"use client";

import { Barcode } from "lucide-react";

interface AppBarcodeProps {
  code: string;
  label?: string;
  className?: string;
}

export function AppBarcode({ code, label, className = "" }: AppBarcodeProps) {
  return (
    <div className={`inline-flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs ${className}`}>
      <div className="flex items-center justify-center bg-slate-50 px-4 py-2 rounded-lg text-slate-900 font-mono tracking-widest font-bold text-sm">
        <Barcode className="h-6 w-6 mr-2 text-slate-800" />
        {code}
      </div>
      {label && <span className="text-[10px] text-slate-500 mt-1">{label}</span>}
    </div>
  );
}
