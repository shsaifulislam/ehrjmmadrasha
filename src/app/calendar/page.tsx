"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeaderBanner from "@/components/PageHeaderBanner";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Download,
  Filter,
  CheckCircle2,
  Building,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { CalendarEvent, InstitutionalHoliday } from "@/lib/calendar/types";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function PublicCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<InstitutionalHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "HOLIDAY" | "EVENT">("ALL");

  useEffect(() => {
    Promise.all([
      fetch("/api/calendar/events?role=PUBLIC"),
      fetch("/api/calendar/holidays?publicOnly=true"),
    ])
      .then(async ([evtRes, holRes]) => {
        const evtData = await evtRes.json();
        const holData = await holRes.json();
        if (evtData.success) setEvents(evtData.data || []);
        if (holData.success) setHolidays(holData.data || []);
      })
      .catch((err) => console.error("Failed to load public calendar:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = events.filter((e) => {
    if (filterType === "HOLIDAY") return e.eventType === "INSTITUTIONAL" && e.allDay;
    if (filterType === "EVENT") return e.eventType === "EVENT" || e.eventType === "INSTITUTIONAL";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      {/* 1. OFFICIAL PAGE HEADER BANNER WITH BREADCRUMB */}
      <PageHeaderBanner
        title="প্রাতিষ্ঠানিক ও একাডেমিক ক্যালেন্ডার ২০২৬"
        subtitle={`${INSTITUTION_INFO.nameBn}-এর বার্ষিক শিক্ষা কার্যক্রম, সরকারি ও ধর্মীয় ছুটির দিনপঞ্জি এবং পাবলিক ইভেন্ট সূচি`}
        badge="বার্ষিক দিনপঞ্জি • শিক্ষাবর্ষ ২০২৬"
        breadcrumbs={[{ label: "একাডেমিক ক্যালেন্ডার" }]}
      />

      {/* 2. EXPORT & DOWNLOAD STRIP */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-base font-bold font-display text-slate-900">
              ডিজিটাল ক্যালেন্ডার সাবস্ক্রিপশন ও ডাউনলোড
            </h2>
            <p className="text-xs text-slate-500">
              আপনার গুগল ক্যালেন্ডার বা অ্যাপল ক্যালেন্ডারে প্রাতিষ্ঠানিক ছুটির দিনপঞ্জি যুক্ত করুন
            </p>
          </div>

          <a
            href="/api/calendar/export?role=PUBLIC&title=EHRJ_Public_Calendar"
            className="btn-gold px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow"
          >
            <Download className="w-4 h-4" />
            <span>iCal / ICS ডাউনলোড</span>
          </a>
        </div>
      </section>

      {/* 3. MAIN CALENDAR SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1 w-full">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-[#0D5C3A]" />
            <span className="font-bold text-slate-700">ক্যাটাগরি ফিল্টার:</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: "ALL", label: "সকল সূচি" },
                { id: "HOLIDAY", label: "ছুটির দিনপঞ্জি" },
                { id: "EVENT", label: "অনুষ্ঠান ও মাহফিল" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilterType(btn.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                    filterType === btn.id
                      ? "bg-[#0D5C3A] text-white shadow-md shadow-emerald-950/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            মোট তালিকাভুক্ত আইটেম: <strong className="text-slate-900 font-mono">{filteredEvents.length}</strong> টি
          </div>
        </div>

        {/* Calendar Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
              <div className="w-8 h-8 border-2 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              ক্যালেন্ডার তথ্য লোড হচ্ছে...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
              এই ক্যাটাগরিতে বর্তমানে কোনো নির্ধারিত ইভেন্ট নেই।
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const parsedDate = new Date(evt.startAt);
              const eDate = isNaN(parsedDate.getTime()) && evt.startAt
                ? new Date(evt.startAt.split("T")[0])
                : parsedDate;
              const formattedDate = isNaN(eDate.getTime())
                ? "তারিখ নির্ধারিত"
                : eDate.toLocaleDateString("bn-BD", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
              return (
                <div
                  key={evt.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col justify-between space-y-4 border-t-4 border-t-[#0D5C3A] group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="bg-emerald-50 text-[#0D5C3A] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {evt.allDay ? "ছুটি / বিশেষ দিবস" : evt.eventType}
                      </span>
                      <span className="text-slate-400 font-mono text-xs">
                        {formattedDate}
                      </span>
                    </div>

                    <h3 className="text-base font-bold font-display text-slate-900 leading-snug group-hover:text-[#0D5C3A] transition">
                      {evt.title}
                    </h3>

                    {evt.description && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {evt.allDay
                        ? "সারাদিন"
                        : eDate.toLocaleTimeString("bn-BD", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </span>
                    {evt.location && (
                      <span className="flex items-center gap-1 truncate max-w-[150px] text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {evt.location}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
