"use client";

import React, { useState, useEffect } from "react";
import { Clock, Moon, Sun, Sunrise } from "lucide-react";

interface PrayerTime {
  nameBn: string;
  nameEn: string;
  nameAr: string;
  time: string;
  icon: React.ReactNode;
}

export default function PrayerTimesWidget() {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDateBn, setCurrentDateBn] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("bn-BD", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDateBn(
        now.toLocaleDateString("bn-BD", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const prayers: PrayerTime[] = [
    { nameBn: "ফজর", nameEn: "Fajr", nameAr: "الفجر", time: "০৪:২৫ মি.", icon: <Sunrise className="w-3.5 h-3.5 text-amber-500" /> },
    { nameBn: "যোহর", nameEn: "Dhuhr", nameAr: "الظهر", time: "১২:০৫ মি.", icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
    { nameBn: "আসর", nameEn: "Asr", nameAr: "العصر", time: "০৪:৩০ মি.", icon: <Sun className="w-3.5 h-3.5 text-orange-400" /> },
    { nameBn: "মাগরিব", nameEn: "Maghrib", nameAr: "المغرب", time: "০৬:১৮ মি.", icon: <Moon className="w-3.5 h-3.5 text-amber-300" /> },
    { nameBn: "এশা", nameEn: "Isha", nameAr: "العشاء", time: "০৭:৪০ মি.", icon: <Moon className="w-3.5 h-3.5 text-indigo-300" /> },
    { nameBn: "জুমু'আ", nameEn: "Jumua", nameAr: "الجمعة", time: "০১:১৫ মি.", icon: <Clock className="w-3.5 h-3.5 text-emerald-400" /> },
  ];

  return (
    <div className="bg-[#083B25] border-b border-[#0D5C3A] text-white text-xs py-2 px-4 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Left: Date and Current Time */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#C59B27] font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>কুমিল্লা জোন সময়: {currentTime || "..."}</span>
          </div>
          <span className="hidden sm:inline text-emerald-600">|</span>
          <span className="text-gray-300 hidden sm:inline">{currentDateBn}</span>
          <span className="text-emerald-400 font-arabic text-sm hidden lg:inline">
            (١٥ رمضان ١٤٤٧ هـ)
          </span>
        </div>

        {/* Right: Daily Waqt Prayer Timings */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto py-1 md:py-0 scrollbar-none">
          <span className="text-[#C59B27] font-semibold text-[11px] whitespace-nowrap mr-1">
            সালাতের সময়সূচি:
          </span>
          {prayers.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 bg-[#0D5C3A]/60 hover:bg-[#0D5C3A] px-2.5 py-1 rounded border border-[#158052]/40 whitespace-nowrap transition"
            >
              {p.icon}
              <span className="font-medium text-gray-200">{p.nameBn}:</span>
              <span className="font-mono text-emerald-200 font-semibold">{p.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
