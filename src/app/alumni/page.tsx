"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  Search,
  BookOpen,
  HeartHandshake,
  Award,
  ShieldCheck,
  ChevronRight,
  HandHeart,
  Globe,
  Sparkles,
  UserCheck,
  Building2,
  Calendar,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AlumniLandingPage() {
  const [stats, setStats] = useState<any>({
    totalProfiles: 0,
    verifiedCount: 0,
    activeMentors: 0,
    activeGroups: 0,
    openVolunteerOpportunities: 0,
    totalVolunteerHours: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alumni?stats=true&limit=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      })
      .catch((err) => console.error("Error loading alumni stats:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#0D5C3A] selection:text-white">
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
              প্রাক্তন ছাত্র ও সুধী সমাজ ফোরাম
            </span>
          </div>

          <div className="font-arabic text-[#D4AF37] text-2xl sm:text-3xl tracking-widest drop-shadow-sm">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display text-white tracking-tight leading-tight">
            ইলিয়টগঞ্জ মাদরাসা{" "}
            <span className="gold-gradient-text inline-block">
              অ্যালামনাই নেটওয়ার্ক
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-emerald-100/90 max-w-2xl mx-auto font-light leading-relaxed">
            প্রতিষ্ঠানের অতীত গৌরব, বর্তমান সম্প্রীতি এবং ভবিষ্যৎ প্রজন্মের অগ্রযাত্রাকে একসূত্রে গাঁথা। হাফেজ, আলেম ও শিক্ষার্থীদের আজীবন ভ্রাতৃত্বের মঞ্চ।
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/alumni/directory"
              className="btn-gold px-6 py-3 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg"
            >
              <Search className="w-4 h-4" />
              <span>অ্যালামনাই ডিরেক্টরি খুঁজুন</span>
            </Link>
            <Link
              href="/portal/alumni"
              className="btn-emerald px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 backdrop-blur-md"
            >
              <UserCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>অ্যালামনাই পোর্টাল লগইন</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Institutional Invariant & Privacy Callout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">
                গোপনীয়তা ও সত্যনিষ্ঠ ডেটা সংরক্ষণ নীতি
              </h4>
              <p className="text-xs text-slate-500">
                অ্যালামনাই তালিকা প্রাতিষ্ঠানিক ডাটাবেজ দ্বারা যাচাইকৃত। শিক্ষার্থীদের ফোন নম্বর বা ব্যক্তিগত তথ্য স্বয়ংক্রিয়ভাবে গোপন থাকে।
              </p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 whitespace-nowrap">
            যাচাইকৃত শিক্ষার্থী প্রোফাইল
          </span>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-black text-emerald-700">{loading ? "..." : stats.totalProfiles}</div>
            <div className="text-xs font-medium text-slate-600 mt-1">নিবন্ধিত অ্যালামনাই</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-black text-teal-700">{loading ? "..." : stats.verifiedCount}</div>
            <div className="text-xs font-medium text-slate-600 mt-1">প্রাতিষ্ঠানিক যাচাইকৃত</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-black text-indigo-700">{loading ? "..." : stats.activeMentors}</div>
            <div className="text-xs font-medium text-slate-600 mt-1">সক্রিয় মেন্টর</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-black text-amber-700">{loading ? "..." : stats.activeGroups}</div>
            <div className="text-xs font-medium text-slate-600 mt-1">ব্যাচ ও চ্যাপ্টার গ্রুপ</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-black text-rose-700">{loading ? "..." : stats.openVolunteerOpportunities}</div>
            <div className="text-xs font-medium text-slate-600 mt-1">স্বেচ্ছাসেবী সুযোগ</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-black text-blue-700">{loading ? "..." : stats.totalVolunteerHours} ঘণ্টা</div>
            <div className="text-xs font-medium text-slate-600 mt-1">অর্জিত সমাজসেবা</div>
          </div>
        </div>
      </div>

      {/* Core Feature Hubs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 font-serif">
            অ্যালামনাই নেটওয়ার্কের প্রধান ক্ষেত্রসমূহ
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            পারস্পরিক সহযোগিতা, জ্ঞান বিনিময় এবং মাদরাসার প্রাতিষ্ঠানিক উন্নয়নে সাবেক শিক্ষার্থীদের বহুমুখী ভূমিকা
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Hub 1: Directory */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">পাবলিক ডিরেক্টরি</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                পাসিং ব্যাচ, বিভাগ, পেশা ও শহরের ভিত্তিতে প্রাক্তন সহপাঠী ও প্রিয় ভাইদের সন্ধান করুন সম্পূর্ণ নিরাপদ ফিল্টারের মাধ্যমে।
              </p>
            </div>
            <Link
              href="/alumni/directory"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 group"
            >
              ডিরেক্টরি ব্রাউজ করুন <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Hub 2: Mentorship */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">মেন্টরশিপ ও ক্যারিয়ার গাইডেন্স</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                উচ্চতর ইসলামিক শিক্ষা, হিফজুল কুরআন, আরবি ভাষা ও আধুনিক উচ্চশিক্ষায় অধ্যয়নরত অনুজদের দিকনির্দেশনা প্রদান।
              </p>
            </div>
            <Link
              href="/portal/alumni"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 group"
            >
              মেন্টর হিসেবে যুক্ত হোন <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Hub 3: Volunteering */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                <HandHeart className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">স্বেচ্ছাসেবা ও সামাজিক কাজ</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                বার্ষিক মাহফিল, দস্তারবন্দী সম্মেলন, ফ্রি মেডিকেল ক্যাম্প এবং ক্বেরাত প্রতিযোগিতায় সক্রিয় খেদমত ও ভূমিকা।
              </p>
            </div>
            <Link
              href="/portal/alumni"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 group"
            >
              স্বেচ্ছাসেবী সুযোগ দেখুন <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Hub 4: Institutional Funds */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">মাদরাসা উন্নয়ন তহবিল</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                লিল্লাহ ফান্ড, এতিম ছাত্র বৃত্তি, হিফজ বিভাগ সম্প্রসারণ এবং নির্মাণ কাজে সাবেক ছাত্রদের আর্থিক ও পরামর্শমূলক সহযোগিতা।
              </p>
            </div>
            <Link
              href="/portal/alumni"
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 group"
            >
              তহবিল সংক্রান্ত তথ্য <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Institutional Integrity & Invariant Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-xl">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              EHRJ Madrasha ERP Invariant
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif mt-2">
              ঐতিহাসিক শিক্ষা সনদ ও যাচাইকৃত সংযোগ
            </h3>
            <p className="text-sm text-slate-300 mt-4 leading-relaxed">
              ইলিয়টগঞ্জ মাদরাসা থেকে কৃতিত্বের সাথে উত্তীর্ণ অথবা অধ্যয়ন সমাপ্তকারী সকল শিক্ষার্থীর মূল রেকর্ড ছাত্র নথিতে সংরক্ষিত।
              অ্যালামনাই পোর্টাল সাবেক শিক্ষার্থীদের সাথে মাদরাসার আত্মিক সম্পর্ক ও যৌথ কর্মকাণ্ডের একমাত্র প্রাতিষ্ঠানিক মাধ্যম।
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/alumni/directory"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition"
              >
                ডিরেক্টরি অন্বেষণ
              </Link>
              <Link
                href="/portal/alumni"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-emerald-200 border border-emerald-500/30 rounded-xl text-xs font-bold transition"
              >
                নিজ প্রোফাইল পরিচালনা
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
