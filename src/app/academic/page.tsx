import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeaderBanner from "@/components/PageHeaderBanner";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  BookOpen,
  GraduationCap,
  Award,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileCheck,
  Clock,
  Laptop,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import ClassDirectory from "./ClassDirectory";
import { INSTITUTION_INFO } from "@/lib/constants";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "শিক্ষা কার্যক্রম ও অনুষদসমূহ | " + INSTITUTION_INFO.nameBn,
  description:
    "নূরানী, নাযেরা, আন্তর্জাতিক হিফজুল কুরআন এবং কিতাব বিভাগের অনুমোদিত পাঠ্যক্রম, রুটিন ও জামাত নির্দেশিকা।",
};

export default async function AcademicPage() {
  const classes = await prisma.jamatClass.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      nameBn: true,
      nameEn: true,
      code: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      {/* 1. OFFICIAL PAGE HEADER BANNER WITH BREADCRUMB */}
      <PageHeaderBanner
        title="অনুমোদিত শিক্ষাক্রম ও অনুষদসমূহ"
        subtitle="সহীহ কুরআন তিলাওয়াত, তাজবীদভিত্তিক হিফজ ও দরসে নিজামী কিতাব পাঠদানের যুগোপযোগী সুশৃঙ্খল পাঠ্যক্রম"
        badge="দ্বীনি ও আধুনিক শিক্ষার সমন্বিত ধারা"
        breadcrumbs={[{ label: "শিক্ষা কার্যক্রম" }]}
      />

      {/* 2. HADITH BANNER */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-gradient-to-r from-[#063321] via-[#0D5C3A] to-[#063321] text-white p-5 rounded-2xl border-2 border-[#D4AF37] shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-arabic text-[#D4AF37] text-lg sm:text-xl tracking-wider">
              طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَىٰ كُلِّ مُسْلِمٍ
            </p>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium">
              "দ্বীনি ইলম অন্বেষণ করা প্রত্যেক মুসলমানের উপর ফরজ।" — (সূনান ইবনে মাজাহ: ২২৪)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admission"
              className="btn-gold px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow"
            >
              <GraduationCap className="w-4 h-4" />
              <span>অনলাইনে ভর্তি আবেদন</span>
            </Link>
            <Link
              href="/downloads"
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-white/20"
            >
              <FileCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>সিলেবাস</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. FOUR CORE ACADEMIC FACULTIES */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14 flex-1 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-extrabold text-[#0D5C3A] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            একাডেমিক অনুষদসমূহ
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
            চারটি প্রধান শিক্ষা বিভাগ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            শৈশব থেকে উচ্চতর দাওরায়ে হাদিস পর্যন্ত ক্রমান্বয়ে পরিচালিত সুশৃঙ্খল পাঠদান
          </p>
        </div>

        {/* OFFICIAL DEPARTMENT VISUAL BANNERS (PANORAMIC) */}
        <div className="space-y-6">
          {/* Noorani, Najera & Hifz Division Banner */}
          <div className="bg-white rounded-3xl border-2 border-emerald-600/30 overflow-hidden shadow-lg group">
            <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full bg-emerald-950">
              <Image
                src="/images/banners/nurani-najera-hifz-banner.png"
                alt="নূরানী, নাজেরা ও হিফজ বিভাগ - ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
                fill
                className="object-cover group-hover:scale-[1.01] transition duration-500"
                priority
              />
            </div>
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#063321] via-[#0D5C3A] to-[#063321] text-white flex flex-col sm:flex-row items-center justify-between gap-3 font-serif-bn">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-amber-300">
                  নূরানী, নাজেরা ও হিফজ বিভাগ • কুরআন শিক্ষার প্রথম ধাপ থেকে পূর্ণাঙ্গ হিফজ
                </h4>
                <p className="text-xs text-emerald-100 font-sans">
                  কায়দা-নূরানী শিক্ষা, সহীহ তাজবীদ তিলাওয়াত, মজবুত মুরাআজা ও আদর্শ চরিত্র গঠন
                </p>
              </div>
              <Link
                href="/admission"
                className="btn-gold px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow flex-shrink-0"
              >
                <span>এই বিভাগে ভর্তি আবেদন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Kitab Department Banner */}
          <div className="bg-white rounded-3xl border-2 border-amber-600/30 overflow-hidden shadow-lg group">
            <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full bg-slate-950">
              <Image
                src="/images/banners/kitab-department-banner.png"
                alt="কিতাব বিভাগ - ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
                fill
                className="object-cover group-hover:scale-[1.01] transition duration-500"
              />
            </div>
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1c3520] via-[#084228] to-[#1c3520] text-white flex flex-col sm:flex-row items-center justify-between gap-3 font-serif-bn">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-amber-300">
                  কিতাব বিভাগ • আদর্শ চরিত্র গঠন ও দ্বীনি শিক্ষার সুসংগঠিত পাঠক্রম
                </h4>
                <p className="text-xs text-emerald-100 font-sans">
                  আকীদা, ফিকহ, আরবি ব্যাকরণ, সহীহ বুখারী, সহীহ মুসলিম ও তাফসীরে ইবনে কাসীর
                </p>
              </div>
              <Link
                href="/admission"
                className="btn-gold px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow flex-shrink-0"
              >
                <span>কিতাব বিভাগে ভর্তি</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Wing 1: Noorani & Najera */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between group card-3d">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                  অনুষদ ০১
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  বয়স: ৩-৬ বছর
                </span>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center font-bold group-hover:bg-[#0D5C3A] group-hover:text-white transition duration-300">
                <BookOpen className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold font-display text-slate-900 group-hover:text-[#0D5C3A] transition">
                নূরানী ও নাযেরা বিভাগ
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed text-justify">
                সহীহ মাখরাজ ও তাজবীদ সহকারে বিশুদ্ধ কুরআন তিলাওয়াত, দৈনন্দিন প্রয়োজনীয় দুআ-মাসায়েল এবং পাশাপাশি আদর্শ বাংলা, ইংরেজি ও প্রাথমিক গণিত শিক্ষা।
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>নূরানী কায়েদা ও ৩০তম পারা হিফজ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>বিশুদ্ধ মাখরাজ ও তাজবীদ মশক</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>সুন্দর হস্তলিপি ও শিষ্টাচার চর্চা</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 flex items-center justify-between text-xs">
              <span className="text-slate-500">মেয়াদ: <strong>১-২ বছর</strong></span>
              <Link
                href="/admission"
                className="text-[#0D5C3A] font-bold hover:underline flex items-center gap-1"
              >
                ভর্তি তথ্য <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Wing 2: Tahfizul Quran */}
          <div className="bg-white rounded-3xl border-2 border-[#D4AF37] shadow-md p-6 flex flex-col justify-between group relative overflow-hidden card-3d-gold">
            <div className="absolute top-0 right-0 bg-[#D4AF37] text-stone-950 text-[9px] font-black px-3 py-0.5 rounded-bl-xl uppercase tracking-wider">
              সর্বাধিক জনপ্রিয়
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase">
                  অনুষদ ০২
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded">
                  পূর্ণ আবাসিক
                </span>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#9A781D] flex items-center justify-center font-bold group-hover:bg-[#D4AF37] group-hover:text-stone-950 transition duration-300">
                <Award className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold font-display text-slate-900 group-hover:text-amber-800 transition">
                তাহফীজুল কুরআন (হিফজ)
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed text-justify">
                আন্তর্জাতিক মানের হিফজ পাঠক্রম। পূর্ণ ৩০ পারা হিফজ সমাপন, হুসনুত তিলাওয়াত, তাজবীদ মশক ও ক্বিরাআত প্রতিযোগিতা প্রস্তুতি।
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>দৈনন্দিন সবক, সবকী ও আমপারা</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>হুসনে সওত ও ক্বিরাআত তরবিয়ত</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>২৪ ঘণ্টা অভিজ্ঞ হাফেজ তত্ত্বাবধান</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 flex items-center justify-between text-xs">
              <span className="text-slate-500">মেয়াদ: <strong>২-৩ বছর</strong></span>
              <Link
                href="/admission"
                className="text-amber-800 font-bold hover:underline flex items-center gap-1"
              >
                আসন নিশ্চিত <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Wing 3: Kitab & Dawraye Hadith */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between group card-3d">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase">
                  অনুষদ ০৩
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  দরসে নিজামী
                </span>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition duration-300">
                <GraduationCap className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold font-display text-slate-900 group-hover:text-blue-700 transition">
                কিতাব ও দাওরায়ে হাদিস
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed text-justify">
                আরবি ব্যাকরণ (নাহব-সরফ), ফিক্বহ, উসুল, তাফসির, হাদিস শাস্ত্র ও আরবি সাহিত্যের প্রামাণ্য কিতাবাদির বিস্তারিত পাঠদান ও আলেম তৈরি।
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>মিযান থেকে দাওরায়ে হাদিস পর্যন্ত</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>ফিক্বহ ও সমকালীন মাসায়েল চর্চা</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>বেফাক বোর্ড পরীক্ষার প্রস্তুতি</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 flex items-center justify-between text-xs">
              <span className="text-slate-500">মেয়াদ: <strong>শ্রেণিভিত্তিক</strong></span>
              <Link
                href="/admission"
                className="text-blue-700 font-bold hover:underline flex items-center gap-1"
              >
                ভর্তি তথ্য <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Wing 4: Computer & Modern ICT */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between group card-3d">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full uppercase">
                  অনুষদ ০৪
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  আধুনিক দক্ষতা
                </span>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition duration-300">
                <Laptop className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold font-display text-slate-900 group-hover:text-purple-700 transition">
                কম্পিউটার ও আইসিটি
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed text-justify">
                শিক্ষার্থীদের জন্য মৌলিক তথ্যপ্রযুক্তি, বাংলা-ইংরেজি ও আরবি কম্পোজ, ইন্টারনেট ব্যবহার ও ডিজিটাল অফিস অ্যাপ্লিকেশনের বিশেষ প্রশিক্ষণ।
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <span>বাংলা, ইংরেজি ও আরবি টাইপিং</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <span>এমএস ওয়ার্ড ও এক্সেল ব্যবহার</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <span>অনলাইন দ্বীনি রিসোর্স অনুসন্ধান</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 flex items-center justify-between text-xs">
              <span className="text-slate-500">মেয়াদ: <strong>মাসিক কোর্স</strong></span>
              <Link
                href="/contact"
                className="text-purple-700 font-bold hover:underline flex items-center gap-1"
              >
                ল্যাব তথ্য <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </div>

        {/* 4. DAILY ROUTINE & DISCIPLINE STRIP */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900">
                  আবাসিক শিক্ষার্থীদের প্রাত্যহিক সময়সূচি ও রুটিন
                </h3>
                <p className="text-xs text-slate-500">ফজর থেকে রাত ১০:০০টা পর্যন্ত সুশৃঙ্খল আমলি জীবন</p>
              </div>
            </div>
            <Link
              href="/downloads"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D5C3A] hover:underline"
            >
              <span>পূর্ণাঙ্গ রুটিন PDF ডাউনলোড</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-bold text-[#0D5C3A] bg-emerald-100/60 px-2.5 py-0.5 rounded-full inline-block">
                ভোর - সকাল ৮:০০
              </span>
              <h4 className="font-bold text-xs text-slate-800">তাহাজ্জুদ, ফজর ও সকালের সবক</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                জামাতে ফজর নামাজ আদায়, সকালের কুরআন তেলাওয়াত, নাশতা ও দৈনন্দিন নতুন সবক প্রদান।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100/60 px-2.5 py-0.5 rounded-full inline-block">
                সকাল ৮:০০ - দুপুর ১:০০
              </span>
              <h4 className="font-bold text-xs text-slate-800">নিয়মিত ক্লাসিক্যাল পাঠদান</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                হিফজ রিভিশন, কিতাব বিভাগের দরস, এবং বাংলা, ইংরেজি ও গণিত শ্রেণির ক্লাস কার্যক্রম।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-bold text-blue-800 bg-blue-100/60 px-2.5 py-0.5 rounded-full inline-block">
                দুপুর ১:০০ - বিকাল ৪:৩০
              </span>
              <h4 className="font-bold text-xs text-slate-800">যোহর, দুপুরের খাবার ও বিশ্রাম</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                জামাতে নামাজ, স্বাস্থ্যকর পুষ্টিকর দুপুরের আহার, কায়লুলা (বিশ্রাম) ও আসর নামাজ।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-bold text-purple-800 bg-purple-100/60 px-2.5 py-0.5 rounded-full inline-block">
                মাগরিব - রাত ১০:০০
              </span>
              <h4 className="font-bold text-xs text-slate-800">সান্ধ্যকালীন মুতালাআ ও এশা</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                মাগরিব পর আমপারা সবকী, এশা নামাজ, নৈশভোজ, আগামী দিনের পড়া প্রস্তুতি ও নিদ্রা।
              </p>
            </div>
          </div>
        </section>

        {/* 5. APPROVED CLASSES DIRECTORY */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900">
                অনুমোদিত জামাত ও শ্রেণিসমূহ
              </h3>
              <p className="text-xs text-slate-500">চলতি শিক্ষাবর্ষের অনুমোদিত জামাত তালিকা</p>
            </div>
            <span className="text-xs font-bold text-[#0D5C3A] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              মোট জামাত: {classes.length}টি
            </span>
          </div>

          <ClassDirectory initialClasses={classes} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
