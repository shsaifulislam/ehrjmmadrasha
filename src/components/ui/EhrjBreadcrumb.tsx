"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface EhrjBreadcrumbProps {
  items: BreadcrumbItem[];
  homeHref?: string;
  className?: string;
}

export function EhrjBreadcrumb({ items, homeHref = "/", className = "" }: EhrjBreadcrumbProps) {
  return (
    <nav aria-label="ব্রেডক্রাম্ব" className={`flex items-center text-xs font-medium font-sans ${className}`}>
      <ol className="flex items-center flex-wrap gap-1.5 text-slate-500">
        <li>
          <Link
            href={homeHref}
            className="hover:text-emerald-700 flex items-center gap-1 transition text-slate-400 hover:text-slate-700"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">হোম</span>
          </Link>
        </li>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              {isLast || !item.href ? (
                <span className="font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:text-[#0D5C3A] hover:underline transition truncate">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default EhrjBreadcrumb;
