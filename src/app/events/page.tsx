"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  Sparkles,
  ArrowRight,
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> রেজিস্ট্রেশন চলমান
          </span>
        );
      case "REGISTRATION_CLOSED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> রেজিস্ট্রেশন সমাপ্ত
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
            চলমান আয়োজন
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            সম্পন্ন
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            আসন্ন আয়োজন
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="page-hero py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 page-hero-grid opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 bg-black/40 border border-[#D4AF37]/50 px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-amber-200 text-xs font-semibold">
              শিক্ষার্থী জীবন ও সহশিক্ষা কার্যক্রম
            </span>
          </div>

          <div className="font-arabic text-[#D4AF37] text-2xl sm:text-3xl tracking-widest drop-shadow-sm">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display text-white tracking-tight leading-tight">
            প্রাতিষ্ঠানিক ইভেন্ট ও{" "}
            <span className="gold-gradient-text inline-block">
              প্রতিযোগিতাসমূহ
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-emerald-100/90 max-w-2xl mx-auto font-light leading-relaxed">
            {INSTITUTION_INFO.nameBn}-এর বার্ষিক কুরআন তিলাওয়াত, বিতর্ক, সেমিনার, পুরস্কার বিতরণী ও ছাত্র কার্যক্রম সূচি।
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/portal/events"
              className="btn-gold px-6 py-3 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg"
            >
              <Users className="w-4 h-4" />
              <span>ইভেন্ট রেজিস্ট্রেশন করুন</span>
            </Link>
            <Link
              href="/calendar"
              className="btn-emerald px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 backdrop-blur-md"
            >
              <CalendarIcon className="w-4 h-4 text-[#D4AF37]" />
              <span>পূর্ণ একাডেমিক ক্যালেন্ডার</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. MAIN EVENTS SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 flex-1 w-full">
        {/* 2.0 FEATURED ISLAMIC MAHFIL & SPIRITUAL CONVOCATION BANNER */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-xl bg-emerald-950 group">
          <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full">
            <Image
              src="/images/banners/islamic-mahfil-banner.png"
              alt="ইসলামী মাহফিল ও দ্বীনি সম্মেলন | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
              fill
              className="object-cover group-hover:scale-[1.01] transition duration-500"
              priority
            />
          </div>
          <div className="p-4 bg-gradient-to-r from-[#041F14] via-[#063321] to-[#0A482D] text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-[#D4AF37]/40">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="font-bold text-amber-300 text-sm">
                বার্ষিক ইসলামী মাহফিল • দ্বীনি শিক্ষা, আত্মশুদ্ধি ও ইসলামী জীবন গঠন
              </span>
              <p className="text-emerald-100/90 text-xs">
                কুরআন তিলাওয়াত, তাফসীর, ইসলামি আলোচনা, উপদেশ ও আখিরাতের অনন্ত পাথেয় অর্জনের পবিত্র আয়োজন
              </p>
            </div>
            <Link
              href="/contact"
              className="btn-gold px-5 py-2 rounded-xl text-slate-950 font-bold text-xs flex-shrink-0 shadow hover:scale-105 transition"
            >
              মাহফিল সংক্রান্ত তথ্য
            </Link>
          </div>
        </div>

        {/* Search & Categories Bar */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ইভেন্ট বা ভেন্যু খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-slate-50/50"
              />
            </div>

            <div className="text-xs text-slate-500 font-medium">
              মোট প্রদর্শিত ইভেন্ট: <strong className="text-slate-900">{filteredEvents.length}</strong> টি
            </div>
          </div>

          {/* Type Pill Selector */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setSelectedType("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedType === "ALL"
                  ? "bg-[#0D5C3A] text-white shadow-md shadow-emerald-950/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              সকল আয়োজন
            </button>
            {types.map((t) => (
              <button
                key={t.code}
                onClick={() => setSelectedType(t.code)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedType === t.code
                    ? "bg-[#0D5C3A] text-white shadow-md shadow-emerald-950/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.nameBn}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs text-slate-500">ইভেন্ট তালিকা লোড হচ্ছে...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredEvents.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-8 space-y-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-[#0D5C3A]">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800">কোনো ইভেন্ট বর্তমানে প্রকাশিত নেই</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              নতুন কোনো প্রাতিষ্ঠানিক প্রতিযোগিতা বা মাহফিল নির্ধারিত হলে তা এই পাতায় প্রদর্শিত হবে।
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
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between group"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(evt.status)}
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md font-mono">
                        {evt.typeCode}
                      </span>
                    </div>

                    <h2 className="font-black text-base sm:text-lg text-slate-900 group-hover:text-[#0D5C3A] transition">
                      {evt.titleBn}
                    </h2>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {evt.descriptionBn || "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার প্রাতিষ্ঠানিক আয়োজন।"}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-[#D4AF37]" />
                        <span>
                          {startDate.toLocaleDateString("bn-BD", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>{evt.venueText}</span>
                      </div>

                      {evt.maxCapacity > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>
                            আসন সংখ্যা: {evt.maxCapacity} টি{" "}
                            {remainingCapacity !== null && (
                              <strong className="text-emerald-700">
                                ({remainingCapacity} টি অবশিষ্ট)
                              </strong>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {evt.id}
                    </span>
                    <Link
                      href={`/events/${evt.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D5C3A] group-hover:translate-x-1 transition"
                    >
                      <span>বিস্তারিত দেখুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
