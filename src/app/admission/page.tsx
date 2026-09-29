"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  GraduationCap,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Search,
  ShieldCheck,
  BookOpen,
  DollarSign,
  Users,
  Award,
  ChevronRight,
  PhoneCall,
  Sparkles,
} from "lucide-react";

interface AdmissionConfig {
  sessionName: string;
  isAdmissionOpen: boolean;
  startDate: string;
  endDate: string;
  availableClasses: {
    classId: string;
    classNameBn: string;
    totalSeats: number;
    appliedCount: number;
    availableSeats: number;
    isOpen: boolean;
  }[];
  generalRequirements: string[];
  requiredDocuments: {
    type: string;
    titleBn: string;
    description: string;
    mandatory: boolean;
  }[];
  specialInstructions: string[];
  helplinePhone: string;
  faqList: {
    questionBn: string;
    answerBn: string;
    category: string;
  }[];
}

export default function AdmissionLandingPage() {
  const [config, setConfig] = useState<AdmissionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admissions/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setConfig(data.config);
        }
      })
      .catch((err) => console.error("Failed to load admission config:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A482D] to-[#0D5C3A] text-white py-16 sm:py-24 border-b border-emerald-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold backdrop-blur-sm animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>শিক্ষাবর্ষ ২০২৬ — ডিজিটাল ভর্তি কার্যক্রম ২.০</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display max-w-4xl mx-auto leading-tight sm:leading-snug">
            ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় ভর্তি বিজ্ঞপ্তি
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            কুরআন-সুন্নাহ ও যুগোপযোগী সাধারণ শিক্ষার সমন্বয়ে আদর্শ আলেম ও সৎ নাগরিক গড়ার ঐতিহ্যবাহী দীনী শিক্ষা নিকেতন। ঘরে বসেই সম্পন্ন করুন সম্পূর্ণ ভর্তি আবেদন ও ট্র্যাকিং।
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/admission/apply"
              className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>অনলাইনে নতুন আবেদন করুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admission/track"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-semibold flex items-center gap-2 backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Search className="w-4 h-4 text-emerald-300" />
              <span>আবেদন ট্র্যাক করুন</span>
            </Link>
          </div>

          {/* Status Quick Bar */}
          {config && (
            <div className="pt-6 inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-emerald-200 border-t border-emerald-800/50 max-w-3xl mx-auto">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-300" />
                আবেদনের সময়সীমা: {config.startDate} থেকে {config.endDate}
              </span>
              <span className="hidden sm:inline text-emerald-600">•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                বর্তমান অবস্থা:{" "}
                <strong className={config.isAdmissionOpen ? "text-emerald-300" : "text-amber-300"}>
                  {config.isAdmissionOpen ? "আবেদন গ্রহণ চলছে" : "সাময়িকভাবে স্থগিত"}
                </strong>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 flex-1">
        {/* Available Classes & Seats Grid */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D5C3A]">
                একাডেমিক আসন ও বিভাগ
              </span>
              <h2 className="text-2xl font-bold text-stone-900 font-display">
                ভর্তিযোগ্য শ্রেণি ও জামাতসমূহ
              </h2>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              সেশন: {config?.sessionName || "চলতি শিক্ষাবর্ষ"}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-stone-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {config?.availableClasses.map((cls) => (
                <div
                  key={cls.classId}
                  className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0D5C3A] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                        {cls.isOpen ? "আসন উন্মুক্ত" : "আসন পূর্ণ"}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        অবশিষ্ট আসন: {cls.availableSeats}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-stone-900">{cls.classNameBn}</h3>
                    <p className="text-xs text-stone-500">
                      মোট নির্ধারিত আসন: {cls.totalSeats} টি | নিবন্ধিত আবেদন: {cls.appliedCount} টি
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 mt-4 flex items-center justify-between">
                    <Link
                      href={`/admission/apply?classId=${cls.classId}`}
                      className="text-xs font-bold text-[#0D5C3A] hover:underline flex items-center gap-1"
                    >
                      আবেদন শুরু করুন <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Requirements & Documents Checklist */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* General Requirements */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-[#0D5C3A] rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 font-display">ভর্তির সাধারণ শর্তাবলী</h3>
                <p className="text-xs text-stone-500">আবেদনকারীর প্রয়োজনীয় যোগ্যতা ও আবশ্যকতা</p>
              </div>
            </div>

            <ul className="space-y-3 pt-2">
              {config?.generalRequirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-stone-700 leading-relaxed">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-[#0D5C3A] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Required Documents */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 font-display">প্রয়োজনীয় কাগজপত্র</h3>
                <p className="text-xs text-stone-500">অনলাইনে আপলোড ও মৌখিক পরীক্ষার সময় প্রযোজ্য</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {config?.requiredDocuments.map((doc, idx) => (
                <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-start gap-3">
                  <span className="text-xs font-bold text-amber-600 bg-amber-100/60 px-2 py-0.5 rounded text-[10px] uppercase">
                    {doc.mandatory ? "আবশ্যক" : "ঐচ্ছিক"}
                  </span>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-stone-900 block">{doc.titleBn}</span>
                    <span className="text-[11px] text-stone-500 block leading-tight">{doc.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10-Step Journey Overview */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D5C3A]">
              আবেদন প্রক্রিয়া
            </span>
            <h2 className="text-2xl font-bold text-stone-900 font-display">
              ভর্তি আবেদন থেকে চূড়ান্ত তালিকাভুক্তি
            </h2>
            <p className="text-xs text-stone-600">
              একটি স্বচ্ছ, ডিজিটাল ও সহজ প্রক্রিয়ায় সম্পন্ন হয় আমাদের ভর্তি কার্যক্রম।
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 text-center">
            {[
              { step: 1, title: "সেশন ও জামাত নির্বাচন" },
              { step: 2, title: "শিক্ষার্থীর তথ্য" },
              { step: 3, title: "অভিভাবকের তথ্য" },
              { step: 4, title: "বর্তমান ও স্থায়ী ঠিকানা" },
              { step: 5, title: "পূর্বতন প্রতিষ্ঠান" },
              { step: 6, title: "আবাসিক নির্বাচন" },
              { step: 7, title: "কাগজপত্র আপলোড" },
              { step: 8, title: "ফি বিবরণী ও ড্রাফট" },
              { step: 9, title: "ঘোষণাপত্র ও জমাদান" },
              { step: 10, title: "অনবোর্ডিং ও ট্র্যাকিং" },
            ].map((s) => (
              <div key={s.step} className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="w-6 h-6 mx-auto rounded-full bg-[#0D5C3A] text-white text-xs font-bold flex items-center justify-center">
                  {s.step}
                </span>
                <span className="text-xs font-medium text-stone-800 block">{s.title}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D5C3A]">
              জিজ্ঞাসা ও উত্তর
            </span>
            <h2 className="text-2xl font-bold text-stone-900 font-display">
              ভর্তি সংক্রান্ত সচরাচর জিজ্ঞাসা (FAQ)
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {config?.faqList.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm transition"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-stone-900 hover:bg-stone-50"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#0D5C3A] flex-shrink-0" />
                    {faq.questionBn}
                  </span>
                  <span className="text-stone-400 font-mono text-base">{activeFaq === idx ? "−" : "+"}</span>
                </button>
                {activeFaq === idx && (
                  <div className="p-4 sm:p-5 pt-0 text-xs text-stone-600 leading-relaxed border-t border-stone-100 bg-[#FAF8F5]">
                    {faq.answerBn}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Need Assistance Hotline Banner */}
        <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-stone-900 font-display">
              ভর্তি সংক্রান্ত যে কোনো জিজ্ঞাসা বা কারিগরি সহায়তায়
            </h3>
            <p className="text-xs text-stone-600">
              মাদরাসা অফিসের নির্ধারিত সময়সূচিতে (সকাল ৮:০০ - বিকাল ৪:০০) সরাসরি যোগাযোগ করতে পারেন।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${config?.helplinePhone || "+8801711000000"}`}
              className="px-5 py-2.5 rounded-xl bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>হেল্পলাইন: {config?.helplinePhone || "+8801711000000"}</span>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
