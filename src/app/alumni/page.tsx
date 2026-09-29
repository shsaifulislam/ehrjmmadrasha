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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-emerald-800/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center sm:text-left sm:flex sm:items-center sm:justify-between">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" /> {INSTITUTION_INFO.code} প্রাক্তন ছাত্র ও সুধী সমাজ ফোরাম
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-serif">
                ইলিয়টগঞ্জ মাদরাসা অ্যালামনাই নেটওয়ার্ক
              </h1>
              <p className="text-lg text-emerald-100/90 leading-relaxed font-sans">
                প্রতিষ্ঠানের অতীত গৌরব, বর্তমান সম্প্রীতি এবং ভবিষ্যৎ প্রজন্মের অগ্রযাত্রাকে একসূত্রে গাঁথা।
                হাফেজ, আলেম ও শিক্ষার্থীদের আজীবন ভ্রাতৃত্ব ও সেবামূলক প্ল্যাটফর্ম।
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/alumni/directory"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-950/20 transition-all text-sm"
                >
                  <Search className="w-4 h-4" /> অ্যালামনাই ডিরেক্টরি খুঁজুন
                </Link>
                <Link
                  href="/portal/alumni"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur transition-all text-sm"
                >
                  <UserCheck className="w-4 h-4" /> অ্যালামনাই পোর্টাল লগইন / প্রোফাইল
                </Link>
              </div>
            </div>
            <div className="mt-8 sm:mt-0 flex justify-center">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-emerald-800/50 border border-emerald-600/40 p-4 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur">
                <GraduationCap className="w-12 h-12 text-emerald-300 mb-2" />
                <span className="text-xs font-bold text-emerald-200">প্রতিষ্ঠা সাল</span>
                <span className="text-xl font-extrabold text-white">{INSTITUTION_INFO.establishedEn}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
