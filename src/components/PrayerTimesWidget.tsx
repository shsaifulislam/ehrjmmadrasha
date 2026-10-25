"use client";

import React, { useState, useEffect } from "react";
import { Clock, Moon, Sun, Sunrise, Compass } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface PrayerTime {
  id: string;
  nameBn: string;
  nameEn: string;
  nameAr: string;
  time: string;
  timeEn: string;
  icon: React.ReactNode;
}

export default function PrayerTimesWidget() {
  const { language, t } = useLanguage();
  const [currentTime, setCurrentTime] = useState("");
  const [currentDateBn, setCurrentDateBn] = useState("");
  const [currentDateEn, setCurrentDateEn] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(language === "en" ? "en-US" : "bn-BD", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDateBn(
        now.toLocaleDateString("bn-BD", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
      setCurrentDateEn(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  const prayers: PrayerTime[] = [
    { id: "fajr", nameBn: "ফজর", nameEn: "Fajr", nameAr: "الفجر", time: "০৪:২৫", timeEn: "04:25 AM", icon: <Sunrise className="w-3 h-3 text-amber-400" /> },
    { id: "dhuhr", nameBn: "যোহর", nameEn: "Dhuhr", nameAr: "الظهر", time: "১২:০৫", timeEn: "12:05 PM", icon: <Sun className="w-3 h-3 text-amber-300" /> },
    { id: "asr", nameBn: "আসর", nameEn: "Asr", nameAr: "العصر", time: "০৪:৩০", timeEn: "04:30 PM", icon: <Sun className="w-3 h-3 text-orange-400" /> },
    { id: "maghrib", nameBn: "মাগরিব", nameEn: "Maghrib", nameAr: "المغرب", time: "০৬:১৮", timeEn: "06:18 PM", icon: <Moon className="w-3 h-3 text-amber-200" /> },
    { id: "isha", nameBn: "এশা", nameEn: "Isha", nameAr: "العشاء", time: "০৭:৪০", timeEn: "07:40 PM", icon: <Moon className="w-3 h-3 text-indigo-300" /> },
    { id: "jumua", nameBn: "জুমু'আ", nameEn: "Jumu'ah", nameAr: "الجمعة", time: "০১:১৫", timeEn: "01:15 PM", icon: <Clock className="w-3 h-3 text-emerald-300" /> },
  ];

  return (
    <div className="bg-[#02180E] text-emerald-100 text-[11px] py-1.5 px-3 sm:px-6 border-b border-emerald-900/50 shadow-inner overflow-hidden select-none w-full">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 w-full overflow-hidden">
        {/* Left: District Time & Date */}
        <div className="flex items-center gap-2.5 text-emerald-200/90 font-medium shrink-0">
          <span className="flex items-center gap-1.5 text-[#D4AF37] font-semibold bg-emerald-950/70 border border-[#D4AF37]/30 px-2 py-0.5 rounded-md text-[10px]">
            <Compass className="w-3 h-3 text-[#D4AF37]" />
            <span>{t("কুমিল্লা জোন", "Cumilla Zone")}</span>
            <span className="font-mono text-emerald-100 font-bold ml-1">{currentTime || "--:--"}</span>
          </span>
          <span className="hidden sm:inline text-emerald-300/70 text-[10px]">
            {language === "en" ? currentDateEn : currentDateBn}
          </span>
          <span className="hidden md:inline font-arabic text-amber-300/80 text-xs tracking-wider">
            (١٥ رمضان ١٤٤٧ هـ)
          </span>
        </div>

        {/* Right: Sleek Waqt Ribbon */}
        <div className="w-full sm:w-auto overflow-x-auto scrollbar-none py-0.5 min-w-0 max-w-full">
          <div className="flex items-center gap-1.5 min-w-max">
            <span className="text-amber-400 font-bold text-[10px] uppercase tracking-wider hidden lg:inline mr-1 shrink-0">
              {t("সালাতের সময়:", "Prayer Times:")}
            </span>
            {prayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1 bg-emerald-950/80 hover:bg-emerald-900/90 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px] whitespace-nowrap transition duration-200 shrink-0"
              >
                {p.icon}
                <span className="text-emerald-200/90 font-medium">{language === "en" ? p.nameEn : p.nameBn}:</span>
                <span className="font-mono text-amber-200 font-semibold">{language === "en" ? p.timeEn : p.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
