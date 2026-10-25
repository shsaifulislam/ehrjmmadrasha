"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type AlertVariant = "info" | "success" | "warning" | "danger";

export interface EhrjAlertProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  variant?: AlertVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function EhrjAlert({
  title,
  children,
  variant = "info",
  dismissible = false,
  onDismiss,
  className = "",
}: EhrjAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const icons: Record<AlertVariant, React.ReactNode> = {
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    danger: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
  };

  const variantStyles: Record<AlertVariant, string> = {
    info: "bg-blue-50/90 border-blue-200 text-blue-900",
    success: "bg-emerald-50/90 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50/90 border-amber-300 text-amber-900",
    danger: "bg-red-50/90 border-red-200 text-red-900",
  };

  return (
    <div
      role="alert"
      className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-xs font-sans text-xs transition-all ${variantStyles[variant]} ${className}`}
    >
      <div className="mt-0.5">{icons[variant]}</div>
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-bold text-sm font-display leading-tight">{title}</h5>}
        <div className="leading-relaxed text-xs">{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-black/5 transition text-current opacity-70 hover:opacity-100"
          aria-label="বার্তা বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default EhrjAlert;
