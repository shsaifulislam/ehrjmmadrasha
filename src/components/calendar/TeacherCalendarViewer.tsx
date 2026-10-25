"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  Printer,
  RotateCw,
  Award,
  Users,
  Info,
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

export default function TeacherCalendarViewer() {
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
      const res = await fetch(`/api/teacher/calendar?type=${type}`);
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
  const nextExam = events.find((e) => (e.eventType === "EXAMINATION" || e.id.includes("EXAM")) && new Date(e.startAt) >= new Date());

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold mb-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-[#0D5C3A]" />
            <span>প্রাতিষ্ঠানিক বার্ষিক দিনপঞ্জিকা ও সময়সূচি</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
            উস্তাদ অ্যাকাডেমিক ক্যালেন্ডার ও ছুটির তালিকা
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মাদরাসার সাময়িক ও চূড়ান্ত পরীক্ষা, সাপ্তাহিক ছুটি, ধর্মীয় ও জাতীয় অবকাশ এবং শিক্ষক সভার আনুষ্ঠানিক ক্যালেন্ডার।
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs"
            title="ক্যালেন্ডার প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>প্রিন্ট / সংরক্ষণ</span>
          </button>
          <button
            onClick={() => fetchCalendar(filterType)}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="রিফ্রেশ"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>আসন্ন ছুটি</span>
            <span className="p-1.5 rounded-lg bg-emerald-100/70 text-[#0D5C3A]">
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

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>আসন্ন পরীক্ষা</span>
            <span className="p-1.5 rounded-lg bg-amber-100/70 text-amber-700">
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

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>মোট বার্ষিক ছুটি</span>
            <span className="p-1.5 rounded-lg bg-blue-100/70 text-blue-700">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-800">
            {holidays.length} টি নির্ধারিত ছুটি
          </div>
          <div className="text-xs text-slate-500 mt-1">প্রাতিষ্ঠানিক অবকাশ</div>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>বর্তমান শিক্ষাবর্ষ</span>
            <span className="p-1.5 rounded-lg bg-purple-100/70 text-purple-700">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-800">২০২৬ - ২০২৭</div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">সক্রিয় একাডেমিক সেশন</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: "ALL", label: "সকল সময়সূচি", count: events.length },
          { id: "HOLIDAY", label: "ছুটি ও বন্ধের দিন", count: holidays.length },
          { id: "EXAM", label: "পরীক্ষা সূচি" },
          { id: "MEETING", label: "শিক্ষক ও অভিভাবক সভা" },
        ].map((tab) => {
          const isActive = filterType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#0D5C3A] text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          একাডেমিক ক্যালেন্ডার লোড হচ্ছে...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : events.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 space-y-2">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-sm text-slate-700">এই বিভাগে কোনো ইভেন্ট পাওয়া যায়নি</p>
          <p className="text-xs text-slate-500">অন্যান্য ফিল্টার নির্বাচন করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((evt) => {
            const isHoliday = evt.eventType === "INSTITUTIONAL" || evt.id.includes("HOL");
            const isExam = evt.eventType === "EXAMINATION" || evt.id.includes("EXAM");
            const isMeeting = evt.eventType === "MEETING";
            const daysCount = getDaysDiff(evt.startAt, evt.endAt);

            return (
              <div
                key={evt.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-emerald-400 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between"
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
                        ? "শিক্ষক/অভিভাবক সভা"
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
    </div>
  );
}
