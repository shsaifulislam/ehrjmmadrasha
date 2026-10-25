"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Printer,
  RotateCw,
  Tag,
  ChevronRight,
  Info,
  Award,
  Users,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

interface CalendarEvent {
  id: string;
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  eventType: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
}

export default function GuardianCalendarViewer() {
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "HOLIDAY" | "EXAM" | "MEETING">("ALL");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = async (type = filterType) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/calendar?type=${type}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setEvents(json.events || []);
        setUpcomingEvents(json.upcomingEvents || []);
        setHolidays(json.holidays || []);
      } else {
        setError(json.error || "একাডেমিক ক্যালেন্ডার তথ্য সংগ্রহ করা যায়নি।");
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar(filterType);
  }, [filterType]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getDaysDiff = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    } catch {
      return 1;
    }
  };

  const nextHoliday = holidays.find((h) => new Date(h.startAt) >= new Date()) || holidays[0];
  const nextExam = events.find((e) => (e.eventType === "EXAM" || e.id.includes("EXAM")) && new Date(e.startAt) >= new Date());

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D5C3A] via-[#094228] to-[#062c1b] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <CalendarDays className="w-64 h-64 text-emerald-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ইলিয়টগঞ্জ জমিরীয়া মাদরাসা প্রাতিষ্ঠানিক বর্ষপঞ্জিকা</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-wide text-white">
              একাডেমিক ক্যালেন্ডার ও ছুটির তালিকা
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
              মাদরাসার পরীক্ষা সূচি, ধর্মীয় ও জাতীয় ছুটি এবং অভিভাবক সমাবেশের আনুষ্ঠানিক দিনপঞ্জি।
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 shadow-sm backdrop-blur-sm"
              title="ক্যালেন্ডার প্রিন্ট করুন"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>প্রিন্ট / সংরক্ষণ</span>
            </button>
            <button
              onClick={() => fetchCalendar(filterType)}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/20"
              title="রিফ্রেশ"
            >
              <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Next Holiday */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>আসন্ন ছুটি</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#0D5C3A]">
              <CalendarDays className="w-4 h-4" />
            </span>
          </div>
          <div className="text-base font-bold text-slate-800 line-clamp-1">
            {nextHoliday ? nextHoliday.titleBn || nextHoliday.title : "নির্ধারিত নেই"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {nextHoliday ? formatDate(nextHoliday.startAt) : "ক্যাম্পাস খোলা"}
          </div>
        </div>

        {/* Next Exam */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>আসন্ন সাময়িক পরীক্ষা</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-base font-bold text-slate-800 line-clamp-1">
            {nextExam ? nextExam.titleBn || nextExam.title : "সাময়িক পরীক্ষা সম্পন্ন"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {nextExam ? formatDate(nextExam.startAt) : "রুটিন দেখুন"}
          </div>
        </div>

        {/* Total Holidays */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>মোট বার্ষিক ছুটি</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-800">
            {holidays.length} টি নির্ধারিত ছুটি
          </div>
          <div className="text-xs text-slate-500 mt-1">সরকারি ও প্রাতিষ্ঠানিক</div>
        </div>

        {/* Academic Session */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>শিক্ষা বর্ষ</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-800">২০২৬ - ২০২৭</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">সক্রিয় একাডেমিক সেশন</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: "ALL", label: "সকল সময়সূচি", count: events.length },
          { id: "HOLIDAY", label: "ছুটি ও বন্ধের দিন", count: holidays.length },
          { id: "EXAM", label: "পরীক্ষা সূচি" },
          { id: "MEETING", label: "অভিভাবক সমাবেশ" },
        ].map((tab) => {
          const isActive = filterType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#0D5C3A] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <RotateCw className="w-8 h-8 animate-spin mx-auto text-[#0D5C3A] mb-3" />
          <p className="text-sm text-slate-600 font-medium">একাডেমিক ক্যালেন্ডার লোড হচ্ছে...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
          <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">এই বিভাগে কোনো ইভেন্ট পাওয়া যায়নি।</p>
          <p className="text-xs text-slate-400 mt-1">অন্যান্য ফিল্টার নির্বাচন করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((evt) => {
            const isHoliday = evt.eventType === "INSTITUTIONAL" || evt.id.includes("HOL");
            const isExam = evt.eventType === "EXAM" || evt.id.includes("EXAM");
            const isMeeting = evt.eventType === "MEETING";
            const daysCount = getDaysDiff(evt.startAt, evt.endAt);

            return (
              <div
                key={evt.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isHoliday
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : isExam
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : isMeeting
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {isHoliday
                        ? "ছুটি ও অবকাশ"
                        : isExam
                        ? "পরীক্ষা"
                        : isMeeting
                        ? "অভিভাবক সমাবেশ"
                        : "প্রাতিষ্ঠানিক"}
                    </span>

                    {daysCount > 1 && (
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {daysCount} দিনব্যাপী
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 line-clamp-2">
                    {evt.titleBn || evt.title}
                  </h3>

                  {evt.descriptionBn || evt.description ? (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {evt.descriptionBn || evt.description}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-[#0D5C3A] font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(evt.startAt)}</span>
                  </div>
                  {evt.endAt && evt.endAt !== evt.startAt && (
                    <span className="text-[11px] text-slate-400">
                      পর্যন্ত: {formatDate(evt.endAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Madrasa Calendar Rules & Notice */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-950 text-sm">বিশেষ নির্দেশনা ও অবগতি</h4>
            <p className="text-amber-800/90 mt-0.5 leading-relaxed">
              চাঁদ দেখার ওপর ভিত্তি করে হিজরি তারিখের ছুটির সময়সূচি সামান্য পরিবর্তিত হতে পারে। যেকোনো আকস্মিক পরিবর্তনের ক্ষেত্রে মাদরাসার এসএমএস নোটিফিকেশন ও পোর্টাল নোটিশবোর্ড অনুসরণ করুন।
            </p>
          </div>
        </div>

        <a
          href={`tel:${INSTITUTION_INFO.primaryPhone}`}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs whitespace-nowrap shadow-sm transition inline-flex items-center gap-1.5 self-start sm:self-center"
        >
          <span>অফিস হেল্পলাইন: {INSTITUTION_INFO.primaryPhone}</span>
        </a>
      </div>
    </div>
  );
}
