"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Building2,
  GraduationCap,
  Heart,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Award,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#083B25] to-[#0D5C3A] text-white py-14 px-4 border-b-4 border-[#C59B27] relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <span className="bg-[#C59B27]/20 text-amber-200 border border-[#C59B27]/40 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block mb-3">
            পরিচিতি ও ইতিহাস
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-white mb-3">
            {INSTITUTION_INFO.nameBn}
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লায় কুরআন-সুন্নাহর আলোকে আলোকিত সৎ, যোগ্য ও মুত্তাকী প্রজন্ম গড়ার এক অনন্য দ্বীনি প্রতিষ্ঠান।
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-12 flex-1">
        {/* Section 1: History & Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#0D5C3A] uppercase tracking-wide">আমাদের শুভ সূচনা</span>
            <h2 className="text-2xl font-bold font-display text-[#083B25]">
              ২০২১ইং সালে প্রতিষ্ঠিত দ্বীনি শিক্ষার মারকাজ
            </h2>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed text-justify">
              <strong>{INSTITUTION_INFO.nameBn}</strong> ২০২১ খ্রিস্টাব্দে কুমিল্লার দাউদকান্দি উপজেলার ঐতিহ্যবাহী ইলিয়টগঞ্জ পূর্ব লক্ষ্মীপুর গ্রামে প্রতিষ্ঠিত হয়। প্রতিষ্ঠালগ্ন থেকেই প্রতিষ্ঠানটি বিশুদ্ধ কুরআন তিলাওয়াত, হিফজুল কুরআন, তাজবীদ এবং বুনিয়াদী ইসলামী শিক্ষার পাশাপাশি যুগোপযোগী বাংলা, ইংরেজি ও গণিত শিক্ষা প্রদানের মাধ্যমে একটি আদর্শ চরিত্রবান ও মুত্তাকী সমাজ গঠনের লক্ষ্যে নিরলস কাজ করে যাচ্ছে।
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-lg shadow-sm">
                <span className="font-bold text-sm text-[#0D5C3A] block">স্থাপিত</span>
                <span className="text-xs text-gray-600 font-mono">২০২১ খ্রিস্টাব্দ</span>
              </div>
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-lg shadow-sm">
                <span className="font-bold text-sm text-[#0D5C3A] block">ক্যাম্পাস</span>
                <span className="text-xs text-gray-600">পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ</span>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-[#C59B27]/40 aspect-[4/3]">
            <Image
              src="/images/student-banner.jpg"
              alt="মাদরাসা প্রাঙ্গণ"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Section 2: Principal Message */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="text-center md:border-r border-gray-100 md:pr-6">
              <div className="w-36 h-36 mx-auto rounded-full overflow-hidden border-4 border-[#C59B27] shadow mb-3 relative">
                <Image
                  src="/images/principal.jpg"
                  alt={INSTITUTION_INFO.principal}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="font-bold text-base text-[#083B25]">{INSTITUTION_INFO.principal}</h3>
              <p className="text-xs text-gray-500 font-medium">প্রতিষ্ঠাতা মুহতামিম ও পরিচালক</p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <span className="text-xs font-bold text-[#C59B27] uppercase tracking-wide">মুহতামিমের বাণী</span>
              <h4 className="text-xl font-bold text-[#083B25]">
                "কুরআন প্রচার ও চরিত্রবান নাগরিক তৈরির লক্ষ্যে আমাদের পথচলা"
              </h4>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed italic text-justify">
                "বিসমিল্লাহির রাহমানির রাহিম। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কেবল একটি শিক্ষাপ্রতিষ্ঠান নয়, এটি ভবিষ্যৎ প্রজন্মের দ্বীনি ও আত্মিক আলোকবর্তিকা। আমাদের উদ্দেশ্য প্রতিটি শিক্ষার্থীকে হাফেজে কুরআন, দ্বীনের সঠিক ধারক ও সমাজের জন্য কল্যাণকামী দক্ষ সুনাগরিক হিসেবে গড়ে তোলা। এতিম ও দরিদ্র শিক্ষার্থীদের সম্পূর্ণ বিনামূল্যে থাকা-খাওয়া ও পড়াশোনার সুযোগ দিয়ে আমরা এক অনন্য দৃষ্টান্ত স্থাপন করতে সচেষ্ট। আল্লাহ আমাদের এই খেদমতকে কবুল করুন।"
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Core Values & Pillars */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold font-display text-[#083B25]">আমাদের মূল বৈশিষ্ট্যসমূহ</h2>
            <p className="text-xs text-gray-600 mt-1">যে গুণাবলি আমাদের মাদরাসাকে অনন্য করে তুলেছে</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#0D5C3A] flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#083B25]">বিশুদ্ধ হিফজুল কুরআন</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                আন্তর্জাতিক মানের মাখরাজ ও তাজবীদভিত্তিক বিশুদ্ধ হিফজ ও দৈনন্দিন সবক তদারকি।
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#C59B27] flex items-center justify-center font-bold">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#083B25]">লিল্লাহ বোর্ডিং ও এতিমখানা</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                অসহায়, দরিদ্র ও এতিম ছাত্রদের জন্য ১০০% ফ্রি থাকা, খাওয়া ও পোশাকের লিল্লাহ সুবিধা।
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-[#083B25]">সমন্বিত জেনারেল শিক্ষা</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                কুরআনী শিক্ষার পাশাপাশি প্রাথমিক থেকে বাংলা, ইংরেজি, গণিত ও তথ্যপ্রযুক্তির মৌলিক জ্ঞান।
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
