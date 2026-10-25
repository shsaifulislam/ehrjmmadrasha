"use client";

import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export interface EhrjInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export const EhrjInput = forwardRef<HTMLInputElement, EhrjInputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      iconPosition = "left",
      fullWidth = true,
      className = "",
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

    const baseInputClasses =
      "w-full rounded-xl border text-xs sm:text-sm font-sans transition-all duration-200 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed";

    const stateClasses = error
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/20 text-red-900"
      : "border-slate-300 focus:border-[#0D5C3A] focus:ring-2 focus:ring-emerald-500/20 bg-white text-slate-800 placeholder-slate-400";

    const paddingClasses = icon
      ? iconPosition === "left"
        ? "pl-10 pr-3.5 py-2.5"
        : "pl-3.5 pr-10 py-2.5"
      : "px-3.5 py-2.5";

    return (
      <div className={`space-y-1.5 ${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 font-sans">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400 ${
                iconPosition === "left" ? "left-3" : "right-3"
              }`}
            >
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={`${baseInputClasses} ${stateClasses} ${paddingClasses} ${className}`}
            {...props}
          />
        </div>

        {error && (
          <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {!error && hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
      </div>
    );
  }
);

EhrjInput.displayName = "EhrjInput";
export default EhrjInput;
