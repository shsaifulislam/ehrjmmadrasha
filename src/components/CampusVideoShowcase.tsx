"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Award,
  Video,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Building,
  GraduationCap
} from "lucide-react";

interface VideoChapter {
  id: number;
  title: string;
  duration: string;
  description: string;
  thumbnail: string;
}

const CHAPTERS: VideoChapter[] = [
  {
    id: 1,
    title: "ক্যাম্পাস পরিক্রমা ও হিফজুল কুরআন বিভাগ",
    duration: "০২:১৫",
    description: "আন্তর্জাতিক মানের তাজবীদ ও সুমধুর সুরে হিফজ ক্লাসের বিশেষ দৃশ্যপট",
    thumbnail: "/images/students-class.jpg",
  },
  {
    id: 2,
    title: "সুপরিসর ৩টি বহুতল ভবন ও ডিজিটাল ক্যাম্পাস",
    duration: "০১:৪৫",
    description: "অত্যাধুনিক শ্রেণিকক্ষ, প্রধান তোরণ ও ক্যাম্পাস প্রাঙ্গণের ড্রোন ভিউ",
    thumbnail: "/images/campus-entrance.jpg",
  },
  {
    id: 3,
    title: "বার্ষিক সমাবর্তন ও দস্তারবন্দী পাগড়ি প্রদান",
    duration: "০৩:১০",
    description: "হাফেজ শিক্ষার্থীদের সংবর্ধনা ও গুণী ওলামায়ে কেরামের দোয়া মাহফিল",
    thumbnail: "/images/students-celebration.jpg",
  },
  {
    id: 4,
    title: "আইসিটি ও কম্পিউটার ল্যাব প্রশিক্ষণ",
    duration: "০১:২০",
    description: "দ্বীনি শিক্ষার পাশাপাশি আধুনিক তথ্যপ্রযুক্তির নৈতিক ব্যবহার",
    thumbnail: "/images/student-banner.jpg",
  },
];

export default function CampusVideoShowcase() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <>
      {/* ========================================================
          3D INTERACTIVE CAMPUS VIDEO TOUR & DOCUMENTARY SHOWCASE
      ======================================================== */}
      <section className="relative my-8 sm:my-12 overflow-hidden">
        <div className="bg-gradient-to-br from-[#02180E] via-[#063321] to-[#0A482D] rounded-2xl sm:rounded-3xl p-6 sm:p-10 border-2 border-[#D4AF37] shadow-2xl relative text-white perspective-1000">
          {/* Subtle Ambient Islamic Glow */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-black/50 border border-[#D4AF37]/60 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-300 backdrop-blur-md badge-3d">
                <Video className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>ভার্চুয়াল ক্যাম্পাস ট্যুর ও ভিডিও ডকুমেন্টারি</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif-bn text-white leading-tight">
                ভিডিওতে দেখুন আমাদের ঐতিহ্যবাহী ক্যাম্পাস
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl font-light">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার দ্বীনি পাঠদান, সুশৃঙ্খল পরিবেশ, সুবিশাল খেলার মাঠ ও আবাসিক হোস্টেলের জীবন্ত চিত্র
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="btn-gold px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>সম্পূর্ণ ডকুমেন্টারি দেখুন</span>
              </button>
            </div>
          </div>

          {/* Video Showcase Card with 3D Tilt Frame */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            {/* Left 3D Video Poster Player Card (col-span-8) */}
            <div className="lg:col-span-8 relative">
              <div
                onClick={() => setIsOpen(true)}
                className="group video-frame-3d relative rounded-2xl overflow-hidden border-2 border-[#D4AF37]/70 shadow-2xl bg-black cursor-pointer aspect-video"
              >
                {/* Poster Image */}
                <Image
                  src="/images/campus-entrance.jpg"
                  alt="মাদরাসা ক্যাম্পাস প্রাঙ্গণ"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                  <span className="bg-[#0D5C3A]/90 text-white border border-emerald-400/50 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 badge-3d">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    ৪কে এইচডি ডকুমেন্টারি
                  </span>
                  <span className="bg-black/60 text-amber-300 border border-amber-400/40 text-[11px] font-mono px-2.5 py-1 rounded-full backdrop-blur-md">
                    ০৮:৩০ মিনিট
                  </span>
                </div>

                {/* 3D Floating Islamic Star Accent */}
                <div className="absolute top-4 right-4 text-[#D4AF37]/80 text-xl font-arabic font-bold select-none animate-float-slow hidden sm:block">
                  مَا شَاءَ اللَّهُ
                </div>

                {/* Center Glowing Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#D4AF37]/30 border-2 border-[#D4AF37] animate-ping pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F59E0B] text-slate-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 animate-pulse-glow">
                        <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-slate-950 ml-1 text-slate-950" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Soundwave & Caption Strip */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white z-10">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold font-serif-bn text-white flex items-center gap-2">
                      <span>ক্যাম্পাস জীবন ও দ্বীনি শিক্ষার আলোকবর্তিকা</span>
                    </h3>
                    <p className="text-[11px] text-emerald-200/90 hidden sm:block font-sans">
                      ক্লিক করে সরাসরি ভার্চুয়াল ভিডিও ট্যুরে প্রবেশ করুন
                    </p>
                  </div>

                  {/* Soundwave Visualizer Bars */}
                  <div className="flex items-center gap-1 h-6 px-3 py-1 rounded-full bg-black/60 border border-emerald-500/30 backdrop-blur-md">
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Chapters List (col-span-4) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="p-3 bg-black/40 border border-[#D4AF37]/40 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 font-serif-bn">
                  ভিডিও অধ্যায়সমূহ
                </span>
                <span className="text-[11px] text-emerald-200 font-mono">
                  ৪ টি অধ্যায়
                </span>
              </div>

              <div className="space-y-2.5">
                {CHAPTERS.map((ch, idx) => (
                  <div
                    key={ch.id}
                    onClick={() => {
                      setActiveChapter(idx);
                      setIsOpen(true);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                      activeChapter === idx
                        ? "bg-white/15 border-[#D4AF37] text-white shadow-md"
                        : "bg-black/30 border-white/10 text-emerald-100 hover:bg-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/20 bg-black">
                      <Image
                        src={ch.thumbnail}
                        alt={ch.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 fill-white text-white opacity-80" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] text-amber-300 mb-0.5">
                        <span className="font-bold">পর্ব ০{idx + 1}</span>
                        <span className="font-mono">{ch.duration}</span>
                      </div>
                      <h4 className="text-xs font-bold truncate text-white font-serif-bn">
                        {ch.title}
                      </h4>
                      <p className="text-[10px] text-emerald-200/80 truncate">
                        {ch.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 3D Institutional Accolade Pill */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-black/80 border border-emerald-500/40 text-[11px] text-emerald-200 flex items-center gap-2.5 badge-3d">
                <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>স্থাপিত ২০২১ ইং:</strong> কুমিল্লা অঞ্চলের শীর্ষস্থানীয় আদর্শ ও শৃঙ্খলাপরায়ণ দ্বীনি বিদ্যাপীঠ।
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          FULLSCREEN VIDEO CINEMA MODAL
      ======================================================== */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="w-full max-w-5xl bg-slate-950 rounded-3xl border-2 border-[#D4AF37] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#041F14] via-[#063321] to-[#0A482D] text-white flex items-center justify-between border-b border-[#D4AF37]/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center font-bold">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-serif-bn text-white">
                    {CHAPTERS[activeChapter].title}
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা • অফিসিয়াল ভার্চুয়াল ট্যুর
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                aria-label="ভিডিও বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Main Stage */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <Image
                src={CHAPTERS[activeChapter].thumbnail}
                alt={CHAPTERS[activeChapter].title}
                fill
                className="object-cover opacity-85"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40" />

              {/* Islamic Calligraphy Accent */}
              <div className="absolute top-6 left-6 text-[#D4AF37]/70 font-arabic text-xl select-none hidden sm:block">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>

              {/* Play/Pause Trigger */}
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="relative z-20 w-20 h-20 rounded-full bg-[#D4AF37] hover:bg-[#F59E0B] text-slate-950 flex items-center justify-center shadow-2xl transition hover:scale-110 animate-pulse-glow"
              >
                <Play className="w-8 h-8 fill-slate-950 ml-1" />
              </button>

              {/* Overlay Player Controls Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between text-white z-20">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Play className="w-4 h-4 fill-white" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-xs font-mono text-emerald-300">
                    ০২:১৫ / {CHAPTERS[activeChapter].duration}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-red-600 px-2 py-0.5 rounded text-white font-bold">
                    HD 1080p
                  </span>
                  <Link
                    href="/admission"
                    className="btn-gold px-3 py-1 rounded text-[11px] font-bold"
                  >
                    ভর্তি তথ্য
                  </Link>
                </div>
              </div>
            </div>

            {/* Modal Bottom Chapter Selector */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
              {CHAPTERS.map((ch, idx) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapter(idx)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeChapter === idx
                      ? "bg-[#0D5C3A] text-white border border-[#D4AF37]"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <span>পর্ব {idx + 1}:</span>
                  <span className="truncate max-w-[160px]">{ch.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
