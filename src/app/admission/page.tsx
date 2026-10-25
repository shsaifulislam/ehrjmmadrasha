"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeaderBanner from "@/components/PageHeaderBanner";
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
  Heart,
  Download,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

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

const DEFAULT_GENERAL_REQUIREMENTS = [
  "শিক্ষার্থীর মৌলিক দ্বীনি শিক্ষার প্রতি আন্তরিক আগ্রহ ও শৃঙ্খলা বজায় রাখার মানসিকতা থাকতে হবে।",
  "অনলাইন অথবা মাদরাসা অফিসে নির্ধারিত আবেদন ফরম যথাযথভাবে পূরণ করতে হবে।",
  "নাজেরা ও কিতাব বিভাগে ভর্তির ক্ষেত্রে পূর্ববর্তী জামাতের পাঠ্যসূচি ও কুরআন তিলাওয়াত মূল্যায়ন করা হবে।",
  "হিফজ বিভাগে ভর্তির ক্ষেত্রে নূরানী ও নাজেরার সহীহ মাখরাজ ও সুর পরীক্ষা নেওয়া হবে।",
  "আবাসিক শিক্ষার্থীদের ক্ষেত্রে অভিভাবকের সুস্পষ্ট সম্মতি ও হোস্টেল নিয়মনীতি মেনে চলার অঙ্গীকার আবশ্যক।"
];

const DEFAULT_DOCUMENTS = [
  { type: "PHOTO", titleBn: "শিক্ষার্থীর পাসপোর্ট সাইজ ছবি (২ কপি)", description: "সম্প্রতি তোলা স্পষ্ট রঙ্গিন ছবি", mandatory: true },
  { type: "BIRTH_CERTIFICATE", titleBn: "ডিজিটাল জন্ম নিবন্ধন সনদ", description: "১৭ ডিজিটের অনলাইন বার্থ সার্টিফিকেট কপি", mandatory: true },
  { type: "GUARDIAN_NID", titleBn: "অভিভাবকের জাতীয় পরিচয়পত্র (NID)", description: "পিতা/মাতা বা অভিভাবকের এনআইডি ফটোকপি", mandatory: true },
  { type: "PREVIOUS_MARKSHEET", titleBn: "পূর্ববর্তী প্রতিষ্ঠানের ছাড়পত্র / প্রত্যয়ন", description: "হিফজ বা কিতাব বিভাগে স্থানান্তর হলে প্রযোজ্য", mandatory: false },
];

const DEFAULT_FAQS = [
  { questionBn: "ভর্তির জন্য কি কোনো লিখিত পরীক্ষা দিতে হবে?", answerBn: "হিফজ ও কিতাব বিভাগের ক্ষেত্রে মৌখিক ও কুরআন তিলাওয়াত ভিত্তিক সাধারণ মূল্যায়ন নেওয়া হয়। নূরানী ও শিশু শ্রেণিতে অভিভাবকসহ প্রাথমিক সাক্ষাৎকার অনুষ্ঠিত হয়।", category: "EXAM" },
  { questionBn: "আবাসিক ও লিল্লাহ বোর্ডিং ব্যবস্থা কেমন?", answerBn: "আমাদের রয়েছে কঠোর নিরাপত্তা ও ২৪ ঘণ্টা ওস্তাদদের তদারকিসহ সুসজ্জিত হোস্টেল এবং ৩ বেলা পুষ্টিকর খাবার ব্যবস্থা। এতিম ও দরিদ্র শিক্ষার্থীদের জন্য রয়েছে সম্পূর্ণ ফ্রি লিল্লাহ বোর্ডিং।", category: "FACILITIES" },
  { questionBn: "অনলাইনে আবেদনের পর কী করণীয়?", answerBn: "অনলাইনে আবেদন সাবমিটের পর ট্র্যাকিং নম্বর ও প্রাপ্ত আবেদন কপিটি সংরক্ষণ করুন। নির্ধারিত তারিখে শিক্ষার্থীকে সাথে নিয়ে মাদরাসা ক্যাম্পাসে উপস্থিত হতে হবে।", category: "PROCESS" },
  { questionBn: "এতিম বা অসচ্ছল শিক্ষার্থীদের জন্য কোনো বিশেষ ছাড় আছে কি?", answerBn: "হ্যাঁ, ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় লিল্লাহ বোর্ডিং ও যাকাত তহবিলের মাধ্যমে যোগ্য ও অসচ্ছল শিক্ষার্থীদের সম্পূর্ণ বিনামূল্যে (১০০% ফ্রি) থাকা-খাওয়া ও শিক্ষার সুযোগ রয়েছে।", category: "FINANCIAL" },
];

const DEFAULT_CLASSES = [
  { classId: "CLS-NOORANI", classNameBn: "নূরানী ও নাযেরা বিভাগ", totalSeats: 120, appliedCount: 25, availableSeats: 95, isOpen: true },
  { classId: "CLS-HIFZ", classNameBn: "হিফজুল কুরআন বিভাগ", totalSeats: 150, appliedCount: 40, availableSeats: 110, isOpen: true },
  { classId: "CLS-KITAB-MIZAN", classNameBn: "কিতাব বিভাগ (মিযান জামাত)", totalSeats: 80, appliedCount: 15, availableSeats: 65, isOpen: true },
  { classId: "CLS-DAWRA", classNameBn: "দাওরায়ে হাদিস (তাকমীল)", totalSeats: 60, appliedCount: 10, availableSeats: 50, isOpen: true }
];

export default function AdmissionLandingPage() {
  const [config, setConfig] = useState<AdmissionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admissions/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.config) {
          const raw = data.config;
          setConfig({
            sessionName: raw.sessionName || "চলতি শিক্ষাবর্ষ ২০২৬",
            isAdmissionOpen: raw.isAdmissionOpen ?? raw.isOpen ?? true,
            startDate: raw.startDate || "০১ জানুয়ারি ২০২৬",
            endDate: raw.endDate || "৩০ এপ্রিল ২০২৬",
            helplinePhone: raw.helplinePhone || INSTITUTION_INFO.primaryPhone,
            availableClasses: Array.isArray(raw.availableClasses) && raw.availableClasses.length > 0
              ? raw.availableClasses.map((cls: any) => ({
                  classId: cls.classId || "CLS-" + Math.random(),
                  classNameBn: cls.classNameBn || "শ্রেণি",
                  totalSeats: cls.totalSeats || cls.maxCapacity || 50,
                  appliedCount: cls.appliedCount || cls.currentApplicants || 0,
                  availableSeats: cls.availableSeats !== undefined ? cls.availableSeats : Math.max(0, (cls.maxCapacity || 50) - (cls.currentApplicants || 0)),
                  isOpen: cls.isOpen !== undefined ? cls.isOpen : (cls.isActive !== false)
                }))
              : DEFAULT_CLASSES,
            generalRequirements: Array.isArray(raw.generalRequirements) && raw.generalRequirements.length > 0
              ? raw.generalRequirements
              : DEFAULT_GENERAL_REQUIREMENTS,
            requiredDocuments: Array.isArray(raw.requiredDocuments) && raw.requiredDocuments.length > 0
              ? raw.requiredDocuments.map((doc: any) => ({
                  type: doc.type || "DOC",
                  titleBn: doc.titleBn || doc.nameBn || "প্রয়োজনীয় কাগজপত্র",
                  description: doc.description || "মূল কপি ও সত্যায়িত ফটোকপি",
                  mandatory: doc.mandatory !== undefined ? doc.mandatory : Boolean(doc.isRequired)
                }))
              : DEFAULT_DOCUMENTS,
            specialInstructions: Array.isArray(raw.specialInstructions)
              ? raw.specialInstructions
              : [raw.specialInstructionsBn || "অনলাইনে আবেদন সাবমিট করার পর ট্র্যাকিং নম্বরটি সংরক্ষণ করুন।"],
            faqList: Array.isArray(raw.faqList) && raw.faqList.length > 0 ? raw.faqList : DEFAULT_FAQS
          });
        }
      })
      .catch((err) => console.error("Failed to load admission config:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      {/* 1. OFFICIAL PAGE HEADER BANNER WITH BREADCRUMB */}
      <PageHeaderBanner
        title="ভর্তি বিজ্ঞপ্তি ও অনলাইন আবেদন ২০২৬"
        subtitle="কুরআন-সুন্নাহ ও যুগোপযোগী শিক্ষার সমন্বয়ে আলোকিত প্রজন্ম গড়ার ঐতিহ্যবাহী দ্বীনি মারকাজ"
        badge="নতুন শিক্ষাবর্ষে ভর্তি চলছে • পৃথক বালক ও বালিকা শাখা"
        breadcrumbs={[{ label: "ভর্তি তথ্য" }]}
      />

      {/* 2. ADMISSION STATUS & ACTION STRIP */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>সেশন: {config?.sessionName || "২০২৬ শিক্ষাবর্ষ"}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">আবেদনের সময়সীমা: <strong>{config?.startDate || "০১ জানুয়ারি"} হতে {config?.endDate || "৩০ এপ্রিল"}</strong></span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
              ঘরে বসেই সরাসরি ভর্তি আবেদন সম্পন্ন করুন
            </h2>
            <p className="text-xs text-slate-500">
              ৩ মিনিটে অনলাইন আবেদন ফরম পূরণ ও তাৎক্ষণিক ডিজিটাল ট্র্যাকিং নম্বর সংগ্রহ করুন
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admission/apply"
              className="btn-gold px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow"
            >
              <Sparkles className="w-4 h-4" />
              <span>অনলাইনে নতুন আবেদন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login?tab=guardian&redirect=/admission/apply"
              className="px-5 py-3 rounded-xl border border-slate-300 hover:border-[#0D5C3A] text-slate-700 hover:text-[#0D5C3A] bg-white text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-sm"
            >
              <Users className="w-4 h-4 text-[#0D5C3A]" />
              <span>অভিভাবক একাউন্ট / লগইন</span>
            </Link>

            <Link
              href="/admission/track"
              className="px-5 py-3 rounded-xl border border-slate-300 hover:border-[#0D5C3A] text-slate-700 hover:text-[#0D5C3A] bg-slate-50 text-xs sm:text-sm font-semibold flex items-center gap-2 transition"
            >
              <Search className="w-4 h-4 text-[#0D5C3A]" />
              <span>আবেদন ট্র্যাক করুন</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. MAIN ADMISSION CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14 flex-1 w-full">
        
        {/* OFFICIAL ADMISSION BANNERS & POSTER SHOWCASE */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-extrabold text-[#0D5C3A] bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full uppercase tracking-wider inline-block">
              অফিসিয়াল ভর্তি বিজ্ঞপ্তি ও সার্কুলার
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif-bn">
              ইলিয়টগঞ্জ জমিরীয়া মাদরাসায় ভর্তি নির্দেশিকা
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              নূরানী, নাজেরা, হিফজ ও কিতাব বিভাগে নতুন শিক্ষাবর্ষের অফিসিয়াল ভর্তি তথ্য ও প্রচারপত্র
            </p>
          </div>

          {/* Official Full-Width Admission Guideline Panoramic Banner */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-emerald-600/30 shadow-xl bg-emerald-950 group">
            <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full">
              <Image
                src="/images/banners/admission-guideline-banner.png"
                alt="ভর্তি নির্দেশিকা - নূরানী, নাজেরা, হিফজ, কিতাব ও মেয়েদের বিভাগ | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
                fill
                className="object-cover group-hover:scale-[1.01] transition duration-500"
                priority
              />
            </div>
            <div className="p-4 bg-gradient-to-r from-[#041F14] via-[#063321] to-[#0A482D] text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-[#D4AF37]/40">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="font-bold text-amber-300 text-sm">
                  ভর্তি নির্দেশিকা • জেনে নিন আমাদের সকল শিক্ষাবিভাগ ও ভর্তি সম্পর্কিত প্রয়োজনীয় তথ্য
                </span>
                <p className="text-emerald-100/90 text-xs">
                  নূরানী, নাজেরা, হিফজ, কিতাব (দ্বীনি শিক্ষা) ও মেয়েদের বিভাগ (উর্দু থেকে মিশকাত)
                </p>
              </div>
              <Link
                href="/admission/apply"
                className="btn-gold px-5 py-2 rounded-xl text-slate-950 font-bold text-xs flex-shrink-0 shadow hover:scale-105 transition"
              >
                অনলাইনে আবেদন করুন
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Landscape Hero Admission Banner (col-span-7) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-emerald-700/30 overflow-hidden shadow-lg flex flex-col justify-between group">
              <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                <Image
                  src="/images/banners/hero-admission-banner.jpg"
                  alt="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা ভর্তি তথ্য ব্যানার"
                  fill
                  className="object-cover group-hover:scale-[1.02] transition duration-500"
                  priority
                />
              </div>
              <div className="p-5 bg-gradient-to-r from-[#063321] via-[#0D5C3A] to-[#063321] text-white flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5 text-center sm:text-left">
                  <h4 className="font-bold text-sm text-amber-300 font-serif-bn">
                    ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
                  </h4>
                  <p className="text-xs text-emerald-100 font-sans">
                    ইলম, আমল ও আদর্শের সমন্বয়ে দ্বীনি শিক্ষা • স্থাপিত: ২০২১ ইং
                  </p>
                </div>
                <Link
                  href="/admission/apply"
                  className="btn-gold px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>আবেদন শুরু করুন</span>
                </Link>
              </div>
            </div>

            {/* Square Admission Announcement Poster (col-span-5) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-[#D4AF37] overflow-hidden shadow-lg flex flex-col justify-between group">
              <div className="relative aspect-square w-full bg-slate-950 overflow-hidden">
                <Image
                  src="/images/banners/admission-notice-poster.jpg"
                  alt="ভর্তি চলছে - নুরানী থেকে হিফজ ও কিতাব বিভাগে"
                  fill
                  className="object-cover group-hover:scale-[1.02] transition duration-500"
                  priority
                />
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0D5C3A] font-serif-bn">
                  ভর্তি চলছে • নুরানী, হিফজ ও কিতাব বিভাগ
                </span>
                <Link
                  href="/images/banners/admission-notice-poster.jpg"
                  target="_blank"
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>পোস্টার দেখুন</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* LILLAH BOARDING WELFARE HIGHLIGHT CARD */}
        <section className="bg-gradient-to-r from-emerald-900 via-[#0D5C3A] to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-[#D4AF37] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-black/40 border border-[#D4AF37]/50 px-3 py-1 rounded-full text-xs font-bold text-amber-200">
              <Heart className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>এতিম ও অসচ্ছল শিক্ষার্থীদের ১০০% ফ্রি শিক্ষা</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
              লিল্লাহ বোর্ডিং ও এতিমখানা বিশেষ সুবিধা
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 font-light max-w-2xl leading-relaxed">
              পিতৃহীন এতিম, অসহায় ও অসচ্ছল পরিবারের সন্তানদের জন্য আমাদের মাদরাসায় সম্পূর্ণ বিনামূল্যে থাকা, খাওয়া, চিকিৎসা ও পোশাকের পূর্ণ নিশ্চয়তা রয়েছে।
            </p>
          </div>
          <Link
            href="/donate"
            className="btn-gold px-6 py-3 rounded-xl text-xs font-bold flex-shrink-0 flex items-center gap-2 shadow"
          >
            <span>লিল্লাহ বোর্ডিং তহবিল তথ্য</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* AVAILABLE CLASSES & SEATS GRID */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0D5C3A]">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>একাডেমিক আসন ও বিভাগ</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mt-1">
                ভর্তিযোগ্য শ্রেণি ও জামাতসমূহ
              </h3>
            </div>
            <span className="text-xs bg-emerald-50 text-[#0D5C3A] font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
              সেশন: {config?.sessionName || "চলতি শিক্ষাবর্ষ ২০২৬"}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 bg-white rounded-3xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {(config?.availableClasses || DEFAULT_CLASSES).map((cls) => {
                const fillPercentage = Math.min(100, Math.round(((cls.totalSeats - cls.availableSeats) / cls.totalSeats) * 100));
                return (
                  <div
                    key={cls.classId}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between group card-3d"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          cls.isOpen 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {cls.isOpen ? "● আসন উন্মুক্ত" : "আসন পূর্ণ"}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          অবশিষ্ট: <strong className="text-emerald-700 font-bold">{cls.availableSeats}</strong> টি
                        </span>
                      </div>

                      <h4 className="text-base font-bold font-display text-slate-900 group-hover:text-[#0D5C3A] transition">
                        {cls.classNameBn}
                      </h4>

                      <p className="text-[11px] text-slate-500">
                        মোট আসন: {cls.totalSeats} টি | আবেদন: {cls.appliedCount} টি
                      </p>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-[#D4AF37] h-1.5 rounded-full"
                            style={{ width: `${fillPercentage}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 text-right">
                          {fillPercentage}% পূরণ
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-4">
                      <Link
                        href={`/admission/apply?classId=${cls.classId}`}
                        className="text-xs font-bold text-[#0D5C3A] group-hover:text-emerald-700 flex items-center justify-between transition"
                      >
                        <span>আবেদন ফরম</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* REQUIREMENTS & DOCUMENTS CHECKLIST */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* General Requirements */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-slate-900">ভর্তির সাধারণ শর্তাবলী</h3>
                <p className="text-xs text-slate-500">আবেদনকারীর প্রয়োজনীয় যোগ্যতা ও মাদরাসার নিয়মনীতি</p>
              </div>
            </div>

            <ul className="space-y-3 pt-1">
              {(config?.generalRequirements || DEFAULT_GENERAL_REQUIREMENTS).map((req, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0D5C3A] font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Required Documents */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#9A781D] flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-slate-900">প্রয়োজনীয় কাগজপত্র তালিকা</h3>
                <p className="text-xs text-slate-500">ডিজিটাল আপলোড ও মৌখিক পরীক্ষার দিন সাথে আনার জন্য</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {(config?.requiredDocuments || DEFAULT_DOCUMENTS).map((doc, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    doc.mandatory ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-slate-200 text-slate-700"
                  }`}>
                    {doc.mandatory ? "আবশ্যক" : "ঐচ্ছিক"}
                  </span>
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">{doc.titleBn}</span>
                    <span className="text-xs text-slate-500 block leading-tight">{doc.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10-STEP ADMISSION ROADMAP */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D5C3A] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              ডিজিটাল ভর্তি রোডম্যাপ
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
              আবেদন প্রক্রিয়া থেকে চূড়ান্ত ভর্তি
            </h3>
            <p className="text-xs text-slate-600">
              একটি স্বচ্ছ, ডিজিটাল ও সুশৃঙ্খল প্রক্রিয়ায় সম্পন্ন হয় আমাদের ভর্তি কার্যক্রম
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-center">
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
              { step: 10, title: "ডিজিটাল আইডি কার্ড প্রদান" },
            ].map((s) => (
              <div key={s.step} className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 space-y-2 transition group">
                <span className="w-7 h-7 mx-auto rounded-full bg-[#0D5C3A] group-hover:bg-[#D4AF37] text-white group-hover:text-stone-900 text-xs font-bold flex items-center justify-center transition shadow-sm">
                  {s.step}
                </span>
                <span className="text-xs font-semibold text-slate-800 block group-hover:text-[#0D5C3A]">{s.title}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQS */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D5C3A]">
              জিজ্ঞাসা ও উত্তর
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
              ভর্তি সংক্রান্ত সচরাচর জিজ্ঞাসা (FAQ)
            </h3>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {(config?.faqList || DEFAULT_FAQS).map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition hover:border-emerald-400"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-[#0D5C3A] flex-shrink-0" />
                    <span>{faq.questionBn}</span>
                  </span>
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {activeFaq === idx ? "−" : "+"}
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/60">
                    {faq.answerBn}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* HELPLINE BANNER */}
        <section className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 font-display">
              ভর্তি সংক্রান্ত যে কোনো জিজ্ঞাসা বা সহায়তায়
            </h4>
            <p className="text-xs sm:text-sm text-slate-600">
              মাদরাসা অফিসের নির্ধারিত সময়সূচিতে (সকাল ৮:০০ - বিকাল ৪:০০) সরাসরি কল করতে পারেন
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${config?.helplinePhone || INSTITUTION_INFO.primaryPhone}`}
              className="px-6 py-3 rounded-xl bg-[#0D5C3A] hover:bg-[#063321] text-white text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-md transition"
            >
              <PhoneCall className="w-4 h-4 text-[#D4AF37]" />
              <span>হেল্পলাইন: {config?.helplinePhone || INSTITUTION_INFO.primaryPhone}</span>
            </a>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
