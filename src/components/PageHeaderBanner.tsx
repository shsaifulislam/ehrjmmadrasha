import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderBannerProps {
  title: string;
  subtitle?: string;
  badge?: string;
  arabicBismillah?: boolean;
  breadcrumbs: BreadcrumbItem[];
}

export default function PageHeaderBanner({
  title,
  subtitle,
  badge,
  arabicBismillah = true,
  breadcrumbs,
}: PageHeaderBannerProps) {
  return (
    <div className="relative">
      {/* 1. GRAND EMERALD HERO BANNER WITH 3D DEPTH */}
      <section className="bg-gradient-to-b from-[#041F14] via-[#063321] to-[#0D5C3A] text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden border-b-4 border-[#D4AF37] perspective-1000">
        {/* Subtle geometric grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute -top-24 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none" />

        {/* 3D Floating Islamic Ornamental Spheres & Stars */}
        <div className="absolute top-6 left-12 w-16 h-16 rounded-full border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/20 to-transparent blur-[1px] animate-float-slow pointer-events-none hidden md:block" />
        <div className="absolute bottom-8 right-16 w-20 h-20 rounded-full border border-emerald-400/30 bg-gradient-to-tl from-emerald-400/15 to-transparent blur-[1px] animate-float-reverse pointer-events-none hidden md:block" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-4 preserve-3d">
          {badge && (
            <div className="inline-flex items-center gap-2 bg-black/50 border border-[#D4AF37]/70 px-4 py-1.5 rounded-full backdrop-blur-md shadow-xl badge-3d">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[#FDF6E2] text-xs font-bold tracking-wide">
                {badge}
              </span>
            </div>
          )}

          {arabicBismillah && (
            <div className="font-arabic text-[#D4AF37] text-2xl sm:text-3xl tracking-widest drop-shadow-md select-none transform hover:scale-105 transition duration-300">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
          )}

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-display text-white tracking-tight leading-snug drop-shadow-lg">
            {title}
          </h1>

          {subtitle && (
            <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 max-w-2xl mx-auto font-light leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </section>

      {/* 2. OFFICIAL ACADEMIC BREADCRUMB BAR */}
      <div className="bg-[#F1F5F9] border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-2.5 shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center flex-wrap gap-2 text-xs text-slate-600">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-[#0D5C3A] font-bold transition"
          >
            <Home className="w-3.5 h-3.5 text-[#0D5C3A]" />
            <span>মূল পাতা</span>
          </Link>

          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {isLast || !crumb.href ? (
                  <span className="text-[#0D5C3A] font-extrabold truncate max-w-xs">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-slate-600 hover:text-[#0D5C3A] font-semibold transition truncate max-w-xs"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
