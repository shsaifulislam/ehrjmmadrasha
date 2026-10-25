"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "gold" | "danger" | "ghost" | "outline";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface EhrjButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export const EhrjButton = forwardRef<HTMLButtonElement, EhrjButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]";

    const sizeClasses: Record<ButtonSize, string> = {
      xs: "text-[11px] px-2.5 py-1 gap-1.5",
      sm: "text-xs px-3.5 py-1.5 gap-2",
      md: "text-xs sm:text-sm px-4 py-2.5 gap-2",
      lg: "text-sm sm:text-base px-6 py-3 gap-2.5",
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        "bg-[#0D5C3A] hover:bg-[#158052] text-white shadow-md shadow-emerald-950/20 focus:ring-emerald-600 border border-emerald-600/30",
      secondary:
        "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm focus:ring-slate-400",
      gold:
        "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C59B27] text-white font-black shadow-md shadow-amber-950/20 focus:ring-amber-500 border border-amber-400/40",
      danger:
        "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-950/20 focus:ring-red-500 border border-red-500",
      ghost:
        "bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-300 border border-transparent",
      outline:
        "bg-transparent hover:bg-emerald-50 text-[#0D5C3A] border-2 border-[#0D5C3A] focus:ring-emerald-600",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
        {!loading && icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        {!loading && icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
      </button>
    );
  }
);

EhrjButton.displayName = "EhrjButton";
export default EhrjButton;
