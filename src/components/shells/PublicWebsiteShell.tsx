"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import EhrjBreadcrumb, { BreadcrumbItem } from "@/components/ui/EhrjBreadcrumb";

export interface PublicWebsiteShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

export function PublicWebsiteShell({
  children,
  breadcrumbs,
  title,
  subtitle,
  maxWidth = "xl",
  className = "",
}: PublicWebsiteShellProps) {
  const widthClasses: Record<string, string> = {
    sm: "max-w-3xl",
    md: "max-w-4xl",
    lg: "max-w-5xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#0D5C3A] selection:text-white pb-16 md:pb-0">
      <Navbar />

      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 ${widthClasses[maxWidth]} ${className}`}>
        {(breadcrumbs || title) && (
          <div className="space-y-2 pb-4 border-b border-slate-200">
            {breadcrumbs && <EhrjBreadcrumb items={breadcrumbs} homeHref="/" />}
            {title && (
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && <p className="text-xs sm:text-sm text-slate-600 font-sans max-w-2xl">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

export default PublicWebsiteShell;
