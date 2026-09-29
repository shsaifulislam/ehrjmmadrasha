"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Download,
  Filter,
  CheckCircle,
  Building,
  GraduationCap,
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-gray-50 text-gray-800">
      {/* Header Banner */}
      <section className="bg-[#083B25] text-white py-12 px-4 md:px-8 border-b border-emerald-800 shadow-sm relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 bg-emerald-800/80 border border-emerald-600/50 text-[#C59B27] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            <CalendarIcon className="w-3.5 h-3.5" />
            ২০২৬ শিক্ষাবর্ষ
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            প্রাতিষ্ঠানিক ও একাডেমিক ক্যালেন্ডার
          </h1>
          <p className="text-sm md:text-base text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            {INSTITUTION_INFO.nameBn}-এর বার্ষিক শিক্ষা কার্যক্রম, সরকারি ও ধর্মীয় ছুটির দিনপঞ্জি এবং পাবলিক ইভেন্ট সূচি
          </p>

          <div className="pt-2 flex justify-center">
            <a
              href="/api/calendar/export?role=PUBLIC&title=EHRJ_Public_Calendar"
              className="inline-flex items-center gap-2 bg-[#C59B27] hover:bg-[#b08920] text-gray-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow-md transition"
            >
              <Download className="w-4 h-4" />
              <span>ক্যালেন্ডার সাবস্ক্রিপশন (iCal / ICS)</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-gray-700">ক্যাটাগরি:</span>
            <div className="flex items-center gap-1">
              {[
                { id: "ALL", label: "সকল সূচি" },
                { id: "HOLIDAY", label: "ছুটির দিনপঞ্জি" },
                { id: "EVENT", label: "অনুষ্ঠান ও মাহফিল" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilterType(btn.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    filterType === btn.id
                      ? "bg-[#0D5C3A] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            মোট তালিকাভুক্ত আইটেম: <strong>{filteredEvents.length} টি</strong>
          </div>
        </div>

        {/* Calendar Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-xs text-gray-500">
              ক্যালেন্ডার তথ্য লোড হচ্ছে...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-xl border text-center text-xs text-gray-500">
              এই ক্যাটাগরিতে কোনো নির্ধারিত ইভেন্ট নেই।
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition p-5 flex flex-col justify-between space-y-3 border-t-4 border-t-[#0D5C3A]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                      {evt.allDay ? "ছুটি / বিশেষ দিবস" : evt.eventType}
                    </span>
                    <span className="text-gray-500 font-mono">
                      {new Date(evt.startAt).toLocaleDateString("bn-BD", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 leading-snug">
                    {evt.title}
                  </h3>

                  {evt.description && (
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {evt.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="flex items-center gap-1 text-emerald-800 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {evt.allDay
                      ? "সারাদিন"
                      : new Date(evt.startAt).toLocaleTimeString("bn-BD", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                  </span>
                  {evt.location && (
                    <span className="flex items-center gap-1 truncate max-w-[150px] text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      {evt.location}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
