"use client";

import React from "react";
import { Check, Bookmark, Sparkles, Award } from "lucide-react";
import { QURAN_PARAS, QuranParaMeta } from "@/lib/hifz/hifzConstants";

interface HifzQuranProgressGridProps {
  completedParas: number[]; // e.g. [1, 2, 3, 4]
  currentPara?: number; // e.g. 5
  studentName?: string;
  readOnly?: boolean;
  onParaClick?: (para: QuranParaMeta) => void;
}

export default function HifzQuranProgressGrid({
  completedParas = [],
  currentPara,
  studentName,
  readOnly = true,
  onParaClick,
}: HifzQuranProgressGridProps) {
  const totalCompleted = completedParas.length;
  const percentage = Number(((totalCompleted / 30) * 100).toFixed(1));
  const isHafez = totalCompleted >= 30;

  return (
    <div className="bg-white rounded-3xl border border-emerald-950/10 p-5 sm:p-7 shadow-sm space-y-5">
      {/* Header and Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">
              হিফজুল কুরআন ৩০ পারা ট্র্যাকার
            </span>
            {isHafez && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-sm animate-pulse">
                <Award className="w-3 h-3 text-amber-700" />
                হাফেযে কুরআন (সমাপ্ত)
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-gray-900 mt-1 flex items-center gap-2">
            {studentName ? `${studentName}-এর হিফজ অগ্রগতি` : "পবিত্র কুরআন হিফজ অগ্রগতি"}
          </h3>
          <p className="text-xs text-gray-500">
            ৩০ পারার মধ্যে সম্পন্নকৃত, চলতি ও অবশিষ্ট পারার ভিজ্যুয়াল মানচিত্র।
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-xl font-black font-mono text-[#0D5C3A]">
            {totalCompleted} <span className="text-xs font-normal text-gray-400">/ ৩০ পারা</span>
          </div>
          <div className="text-xs font-bold text-gray-600">
            অগ্রগতি: <span className="text-emerald-700">{percentage}%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="space-y-1.5">
        <div className="w-full bg-stone-100 rounded-full h-3 p-0.5 overflow-hidden border border-stone-200">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isHafez
                ? "bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-600"
                : "bg-gradient-to-r from-[#0D5C3A] to-emerald-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(3, percentage))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-gray-400">
          <span>১ম পারা</span>
          <span>১৫তম পারা (অর্ধেক)</span>
          <span>৩০তম পারা (খতম)</span>
        </div>
      </div>

      {/* 30-Para Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2 pt-2">
        {QURAN_PARAS.map((para) => {
          const isDone = completedParas.includes(para.number);
          const isCurrent = currentPara === para.number && !isDone;

          return (
            <div
              key={para.number}
              onClick={() => onParaClick && onParaClick(para)}
              className={`relative rounded-2xl p-2.5 text-center transition-all flex flex-col justify-between items-center select-none ${
                !readOnly ? "cursor-pointer hover:scale-105" : ""
              } ${
                isDone
                  ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-sm"
                  : isCurrent
                  ? "bg-amber-50 border-2 border-amber-500 text-amber-950 shadow-md ring-2 ring-amber-200 animate-pulse"
                  : "bg-gray-50/70 border border-gray-200 text-gray-400 opacity-80 hover:opacity-100"
              }`}
            >
              {/* Top indicator icon */}
              <div className="w-full flex justify-between items-center text-[9px] font-bold">
                <span className="font-mono">#{para.number}</span>
                {isDone ? (
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                ) : isCurrent ? (
                  <Bookmark className="w-3 h-3 text-amber-600 fill-amber-600" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                )}
              </div>

              {/* Para Arabic Name */}
              <div className="my-1.5">
                <span className="text-sm font-arabic font-bold block truncate max-w-full">
                  {para.nameAr}
                </span>
                <span className="text-[10px] font-medium text-gray-700 block truncate max-w-full">
                  {para.nameBn}
                </span>
              </div>

              {/* Status pill */}
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${
                  isDone
                    ? "bg-emerald-200/60 text-emerald-900"
                    : isCurrent
                    ? "bg-amber-200 text-amber-950"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isDone ? "সম্পন্ন" : isCurrent ? "চলতি" : "অবশিষ্ট"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-600 pt-3 border-t border-gray-100 gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="font-medium">মুখস্থ সম্পন্ন ({totalCompleted})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="font-medium">চলতি সবক ({currentPara ? `পারা ${currentPara}` : "নেই"})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />
            <span className="font-medium">অবশিষ্ট ({Math.max(0, 30 - totalCompleted)})</span>
          </div>
        </div>

        <div className="text-gray-400 italic text-[10px]">
          * দৈনিক ফজরের পর সবক, সকাল ১০টায় সবকী ও আছর-মাগরিবে আমোক্তা দোহরানো হয়।
        </div>
      </div>
    </div>
  );
}
