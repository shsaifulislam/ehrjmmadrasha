"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Search,
  Trophy,
  BookOpen,
  Award,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { InstitutionalEvent, EventTypeConfig } from "@/lib/events/types";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function PublicEventsPage() {
  const [events, setEvents] = useState<InstitutionalEvent[]>([]);
  const [types, setTypes] = useState<EventTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetch("/api/events?role=PUBLIC")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvents(data.data || []);
          setTypes(data.types || []);
        }
      })
      .catch((err) => console.error("Error loading public events:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesType = selectedType === "ALL" || e.typeCode === selectedType;
    const matchesSearch =
      !searchQuery ||
      e.titleBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.titleEn && e.titleEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.venueText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getStatusBadge = (status: InstitutionalEvent["status"]) => {
    switch (status) {
      case "REGISTRATION_OPEN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> রেজিস্ট্রেশন চলমান
          </span>
        );
      case "REGISTRATION_CLOSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3" /> রেজিস্ট্রেশন সমাপ্ত
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
            চলমান আয়োজন
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-750 border border-gray-300">
            সম্পন্ন
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            আসন্ন আয়োজন
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/30 via-white to-gray-50 text-gray-800">
      {/* Banner */}
      <section className="bg-[#083B25] text-white py-12 px-4 md:px-8 border-b border-emerald-800 shadow-sm relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 bg-emerald-800/80 border border-emerald-600/50 text-[#C59B27] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            শিক্ষার্থী জীবন ও সহশিক্ষা
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            প্রাতিষ্ঠানিক ইভেন্ট, প্রতিযোগিতা ও কার্যক্রম
          </h1>
          <p className="text-sm md:text-base text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            {INSTITUTION_INFO.nameBn}-এর বার্ষিক কুরআন তিলাওয়াত, বিতর্ক, সেমিনার, পুরস্কার বিতরণী ও ছাত্র কার্যক্রম সূচি
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/portal/events"
              className="inline-flex items-center gap-2 bg-[#C59B27] hover:bg-[#b0891f] text-gray-900 font-bold px-4 py-2 rounded-lg text-sm transition-all shadow-md"
            >
              <Users className="w-4 h-4" />
              অভিভাবক পোর্টাল ও রেজিস্ট্রেশন
            </Link>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 bg-emerald-800/80 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm border border-emerald-600/60 transition-all"
            >
              <CalendarIcon className="w-4 h-4" />
              সম্পূর্ণ ক্যালেন্ডার ভিউ
            </Link>
          </div>
        </div>
      </section>

      {/* Filter and Content Area */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Search & Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ইভেন্ট বা ভেন্যু খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>

            {/* Total Count */}
            <div className="text-xs text-gray-500 font-medium">
              মোট প্রদর্শিত ইভেন্ট: <span className="font-bold text-gray-800">{filteredEvents.length}</span> টি
            </div>
          </div>

          {/* Type Pill Selector */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setSelectedType("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedType === "ALL"
                  ? "bg-[#083B25] text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              সকল আয়োজন
            </button>
            {types.map((t) => (
              <button
                key={t.code}
                onClick={() => setSelectedType(t.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedType === t.code
                    ? "bg-[#083B25] text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t.nameBn}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-gray-500">ইভেন্ট তালিকা লোড হচ্ছে...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredEvents.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center my-8">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-700">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">কোনো ইভেন্ট বর্তমানে প্রকাশিত নেই।</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              নতুন কোনো প্রাতিষ্ঠানিক প্রতিযোগিতা বা সেমিনার প্রকাশিত হলে তা এই পৃষ্ঠায় প্রদর্শিত হবে।
            </p>
          </div>
        )}

        {/* Event Cards Grid */}
        {!loading && filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => {
              const startDate = new Date(evt.startAt);
              const remainingCapacity =
                evt.maxCapacity > 0 ? Math.max(0, evt.maxCapacity - evt.registeredCount) : null;

              return (
                <div
                  key={evt.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {evt.typeCode.replace("_", " ")}
                      </span>
                      {getStatusBadge(evt.status)}
                    </div>

                    <h2 className="text-base font-bold text-gray-900 group-hover:text-emerald-800 transition-colors line-clamp-2">
                      {evt.titleBn}
                    </h2>
                    {evt.titleEn && (
                      <p className="text-xs text-gray-500 font-medium line-clamp-1 italic">
                        {evt.titleEn}
                      </p>
                    )}

                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {evt.descriptionBn}
                    </p>

                    <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>
                          {startDate.toLocaleDateString("bn-BD", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>
                          {startDate.toLocaleTimeString("bn-BD", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate">{evt.venueText}</span>
                      </div>
                      {evt.maxCapacity > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>
                            আসন: {evt.registeredCount}/{evt.maxCapacity}{" "}
                            {remainingCapacity !== null && (
                              <span className="text-emerald-700 font-semibold">
                                ({remainingCapacity} টি অবশিষ্ট)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 font-mono">
                      {evt.id}
                    </span>
                    <Link
                      href={`/events/${evt.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 group-hover:translate-x-0.5 transition-all"
                    >
                      বিস্তারিত দেখুন <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
