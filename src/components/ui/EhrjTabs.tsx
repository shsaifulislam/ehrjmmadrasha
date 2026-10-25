"use client";

import React from "react";

export interface EhrjTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface EhrjTabsProps {
  tabs: EhrjTabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "pills" | "underline";
  className?: string;
}

export function EhrjTabs({
  tabs,
  activeTab,
  onChange,
  variant = "pills",
  className = "",
}: EhrjTabsProps) {
  if (variant === "underline") {
    return (
      <div className={`border-b border-slate-200 overflow-x-auto ${className}`}>
        <nav className="flex space-x-6 min-w-max" aria-label="ট্যাবসমূহ">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition duration-150 select-none whitespace-nowrap ${
                  isActive
                    ? "border-[#0D5C3A] text-[#0D5C3A]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-emerald-100 text-[#0D5C3A]" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition duration-200 select-none ${
              isActive
                ? "bg-[#0D5C3A] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
            }`}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default EhrjTabs;
