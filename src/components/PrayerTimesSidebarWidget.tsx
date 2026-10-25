"use client";

import React, { useState, useEffect } from "react";
import { Clock, Sunrise, Sun, Sunset, Moon } from "lucide-react";

export default function PrayerTimesSidebarWidget() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("bn-BD", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const prayers = [
    { name: "ফজর", time: "০৪:২৫ AM", icon: Sunrise, active: false },
    { name: "যোহর", time: "১২:০৫ PM", icon: Sun, active: false },
    { name: "আসর", time: "০৪:৩০ PM", icon: Sun, active: false },
    { name: "মাগরিব", time: "০৬:১৮ PM", icon: Sunset, active: false },
    { name: "এশা", time: "০৭:৪০ PM", icon: Moon, active: true },
    { name: "জুমু'আ", time: "০১:১৫ PM", icon: Clock, active: false },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <div className="bg-[#0D5C3A] text-white p-3 flex items-center justify-between border-b-2 border-[#D4AF37]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="font-bold text-sm font-serif-bn">
            নামাজের স্থায়ী সময়সূচী
          </h3>
        </div>
        <span className="text-[11px] font-mono text-amber-200 font-bold bg-[#073622] px-2 py-0.5 rounded">
          {time || "১০:৪৫ PM"}
        </span>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {prayers.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-2 rounded border transition ${
                  item.active
                    ? "bg-emerald-50 border-emerald-300 text-[#0D5C3A] font-bold shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icon className="w-3 h-3 text-[#0D5C3A]" />
                  <span className="font-serif-bn">{item.name}</span>
                </div>
                <div className="font-mono text-[11px] font-semibold text-slate-900">
                  {item.time}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2.5 text-[10px] text-center text-slate-500 font-serif-bn">
          কুমিল্লা জোন • ইসলামিক ফাউন্ডেশন বাংলাদেশ অনুকরণে
        </div>
      </div>
    </div>
  );
}
