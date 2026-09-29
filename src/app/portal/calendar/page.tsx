"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Download,
  AlertCircle,
  GraduationCap,
  ChevronLeft,
} from "lucide-react";
import { CalendarEvent } from "@/lib/calendar/types";

export default function GuardianCalendarPortalPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/calendar/events?role=GUARDIAN")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) setEvents(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-[#083B25] text-white py-6 px-4 md:px-8 border-b border-emerald-800 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/portal"
              className="inline-flex items-center gap-1 text-emerald-300 text-xs hover:underline mb-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>অভিভাবক পোর্টালে ফেরত যান</span>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold">
              সন্তানের একাডেমিক সূচি, পরীক্ষা ও ছুটির দিনপঞ্জি
            </h1>
            <p className="text-xs text-emerald-100/80 mt-1">
              আপনার সন্তানের ক্লাস রুটিন, পরীক্ষার তারিখ এবং প্রাতিষ্ঠানিক ছুটির সমন্বিত ক্যালেন্ডার
            </p>
          </div>

          <a
            href="/api/calendar/export?role=GUARDIAN&title=Child_Academic_Calendar"
            className="bg-[#C59B27] hover:bg-[#b08920] text-gray-950 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition self-start md:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>iCal / মোবাইল ক্যালেন্ডারে যুক্ত করুন</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-gray-500">
              ক্যালেন্ডার সূচি লোড হচ্ছে...
            </div>
          ) : events.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-xl border text-center text-xs text-gray-500">
              কোনো আসন্ন সূচি পাওয়া যায়নি।
            </div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 border-l-4 border-l-[#0D5C3A]"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">
                    {evt.allDay ? "ছুটি" : evt.eventType}
                  </span>
                  <span className="text-gray-500 font-mono">
                    {new Date(evt.startAt).toLocaleDateString("bn-BD")}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-gray-900">{evt.title}</h3>

                {evt.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">{evt.description}</p>
                )}

                <div className="pt-2 border-t text-[11px] text-gray-500 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-700" />
                    {evt.allDay
                      ? "সারাদিন"
                      : new Date(evt.startAt).toLocaleTimeString("bn-BD", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                  </span>
                  {evt.location && (
                    <span className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-3 h-3 text-amber-600" />
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
