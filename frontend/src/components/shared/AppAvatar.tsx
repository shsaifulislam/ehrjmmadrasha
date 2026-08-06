import React from "react";
import { cn } from "@/lib/utils";

export interface AppAvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const AppAvatar: React.FC<AppAvatarProps> = ({
  src,
  name,
  size = "md",
  className,
}) => {
  const getInitials = (text: string) => {
    if (!text) return "?";
    const parts = text.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover border border-slate-200 dark:border-slate-800", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold flex items-center justify-center border border-blue-200 dark:border-blue-800",
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};

export default AppAvatar;
