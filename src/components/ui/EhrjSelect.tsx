"use client";

import React, { forwardRef } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";

export interface EhrjSelectOption {
  value: string | number;
  label: string;
}

export interface EhrjSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: EhrjSelectOption[];
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const EhrjSelect = forwardRef<HTMLSelectElement, EhrjSelectProps>(
  (
    {
      label,
      options,
      error,
      hint,
      icon,
      fullWidth = true,
      children,
      className = "",
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? `select-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

    const baseSelectClasses =
      "w-full rounded-xl border text-xs sm:text-sm font-sans transition-all duration-200 outline-none appearance-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed";

    const stateClasses = error
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/20 text-red-900"
      : "border-slate-300 focus:border-[#0D5C3A] focus:ring-2 focus:ring-emerald-500/20 bg-white text-slate-800";

    const paddingClasses = icon ? "pl-10 pr-10 py-2.5" : "pl-3.5 pr-10 py-2.5";

    return (
      <div className={`space-y-1.5 ${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label htmlFor={selectId} className="block text-xs font-bold text-slate-700 font-sans">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute top-1/2 -translate-y-1/2 left-3 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}

          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            className={`${baseSelectClasses} ${stateClasses} ${paddingClasses} ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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

EhrjSelect.displayName = "EhrjSelect";
export default EhrjSelect;
