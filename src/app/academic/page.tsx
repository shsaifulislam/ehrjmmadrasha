"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { BookOpen, GraduationCap, Clock, Award, CheckCircle, ArrowRight } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function AcademicPage() {
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/academic/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.classes) setClasses(data.classes);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#083B25] to-[#0D5C3A] text-white py-14 px-4 border-b-4 border-[#C59B27] text-center">
        <div className="max-w-6xl mx-auto">
          <span className="bg-[#C59B27]/20 text-amber-200 border border-[#C59B27]/40 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block mb-3">
            শিক্ষা কার্যক্রম ও সিলেবাস
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-white mb-3">
            একাডেমিক অনুষদ ও জামাতসমূহ
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            বিশুদ্ধ কুরআন তিলাওয়াত, তাজবীদ, হিফজ এবং কিতাব বিভাগের আন্তর্জাতিক মানসম্মত দ্বীনি শিক্ষাক্রম।
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-12 flex-1">
        {/* Core Departments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">বিভাগ ১</span>
              <h3 className="text-lg font-bold text-[#083B25]">নূরানী ও নাযেরা বিভাগ</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                সহীহ মাখরাজ ও তাজবীদ সহকারে কুরআন শিক্ষা, দু'আ-মাসায়েল, এবং পাশাপাশি বাংলা, ইংরেজি ও প্রাথমিক গণিত শিক্ষা।
              </p>
              <ul className="text-xs text-gray-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> নূরানী কায়েদা ও আমপারা</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> বিশুদ্ধ উচ্চারণ ও তাজবীদ</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> সুন্দর হাতের লেখা প্রশিক্ষণ</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-gray-100 mt-4">
              <span className="text-xs text-gray-500">মেয়াদ: ১ - ২ বছর</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-[#C59B27] shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#C59B27] text-white text-[10px] font-bold px-3 py-0.5 rounded-bl">
              প্রধান অনুষদ
            </div>
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full">বিভাগ ২</span>
              <h3 className="text-lg font-bold text-[#083B25]">তাহফীজুল কুরআন (হিফজ বিভাগ)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                পূর্ণ ৩০ পারা আল-কুরআনুল কারীম হিফজ সমাপন। দৈনন্দিন সবক, সবকী ও আমপারা তদারকির উন্নত ও আধুনিক পদ্ধতি।
              </p>
              <ul className="text-xs text-gray-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#C59B27]" /> পূর্ণ ৩০ পারা হিফজ</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#C59B27]" /> হুসনুত তিলাওয়াত ও ক্বিরাআত</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#C59B27]" /> আবাসিক নিবিড় তত্ত্বাবধান</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-gray-100 mt-4">
              <span className="text-xs text-gray-500">মেয়াদ: ২ - ৩ বছর</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full">বিভাগ ৩</span>
              <h3 className="text-lg font-bold text-[#083B25]">কিতাব বিভাগ (ইসলামিক স্টাডিজ)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                আরবি ব্যাকরণ (নাহব-সরফ), ফিক্বহ, আকাঈদ, তাফসির ও আরবি সাহিত্যের প্রামাণ্য কিতাবাদির পাঠদান।
              </p>
              <ul className="text-xs text-gray-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-blue-600" /> মিযান ও নাহবেমীর</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-blue-600" /> ফিক্বহ ও মাসায়েল</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-blue-600" /> আরবি কথন ও লিখন চর্চা</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-gray-100 mt-4">
              <span className="text-xs text-gray-500">মেয়াদ: শ্রেণি অনুযায়ী</span>
            </div>
          </div>
        </div>

        {/* Dynamic Class Table */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-[#083B25]">মাদরাসার অনুমোদিত জামাতসমূহ</h2>
              <p className="text-xs text-gray-500">চলতি শিক্ষাবর্ষের সক্রিয় ক্লাস ও শিক্ষার্থী ভর্তি কোড</p>
            </div>
            <Link
              href="/admission"
              className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
            >
              ভর্তি আবেদন করুন
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.map((cls) => (
              <div key={cls.id} className="p-3.5 rounded-xl border border-gray-100 bg-[#F9F8F3] hover:border-[#0D5C3A] transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900">{cls.nameBn}</span>
                  <span className="text-[10px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                    {cls.code}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 block mt-1">{cls.nameEn}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
