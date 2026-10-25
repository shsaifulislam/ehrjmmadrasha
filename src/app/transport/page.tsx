"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  Bus,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  CheckCircle,
  ArrowRight,
  Users,
  Award,
  Calendar,
  AlertCircle
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function PublicTransportPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/transport")
      .then((res) => {
        if (!res.ok) throw new Error("Public transport data route");
        return res.json();
      })
      .then((data) => {
        if (data.routes) setRoutes(data.routes);
      })
      .catch(() => {
        // Fallback or empty if not yet loaded
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
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
              নিরাপদ ছাত্র পরিবহন সুবিধা ও সুশৃঙ্খল রুট
            </span>
          </div>

          <div className="font-arabic text-[#D4AF37] text-2xl sm:text-3xl tracking-widest drop-shadow-sm">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display text-white tracking-tight leading-tight">
            মাদরাসা শিক্ষার্থী{" "}
            <span className="gold-gradient-text inline-block">
              পরিবহন সার্ভিস ও রুট
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-emerald-100/90 max-w-2xl mx-auto font-light leading-relaxed">
            {INSTITUTION_INFO.nameBn}-এর শিক্ষার্থীদের প্রত্যহ নিরাপদে ও সময়মতো ক্যাম্পাসে যাতায়াতের জন্য সুশৃঙ্খল আধুনিক পরিবহন সেবা।
          </p>
        </div>
      </section>

      {/* Safety & Service Highlights */}
      <section className="py-12 px-4 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">সর্বোচ্চ নিরাপত্তা ও শৃঙ্খলা</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              দক্ষ ও অভিজ্ঞ ড্রাইভার দ্বারা চালিত এবং প্রতিটি গাড়িতে শিক্ষার্থীদের ওঠানামা ও সুশৃঙ্খল অবস্থান নিশ্চিত করার জন্য সার্বক্ষণিক পর্যবেক্ষণ ব্যবস্থা।
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">সুনির্দিষ্ট সময়সূচি ও স্টপেজ</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              প্রতিটি রুটের নির্ধারিত স্টপেজে সঠিক সময়ে পিকআপ ও ড্রপ-অফ। ক্লাসের রুটিনের সাথে সামঞ্জস্য রেখে সময়ানুবর্তিতা বজায় রাখা হয়।
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">অভিভাবক ট্র্যাকিং পোর্টাল</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              অভিভাবক পোর্টালে লগইন করে সরাসরি সন্তানের রুট, গাড়ির নম্বর, চালকের মোবাইল নম্বর এবং পিকআপ সময়সূচি পর্যবেক্ষণ করার সুবিধা।
            </p>
          </div>
        </div>
      </section>

      {/* Routes Directory */}
      <section className="py-8 px-4 max-w-6xl mx-auto w-full space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold font-display text-slate-800">আওতাভুক্ত পরিবহন রুটসমূহ</h2>
          <p className="text-xs text-slate-600">
            ইলিয়টগঞ্জ বাজার, দাউদকান্দি ও সংলগ্ন এলাকার শিক্ষার্থীদের জন্য নিয়মিত সচল রুটসমূহ:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              code: "ROUTE-01",
              title: "ইলিয়টগঞ্জ বাজার — মাদ্রাসা রুট",
              start: "ইলিয়টগঞ্জ বাস স্ট্যান্ড মোড়",
              end: "মাদ্রাসা ক্যাম্পাস",
              stops: ["ইলিয়টগঞ্জ বাজার", "স্টেশন রোড", "হাইওয়ে সংযোগ", "পূর্ব লক্ষ্মীপুর", "মাদ্রাসা"],
              time: "সকাল ০৭:১৫ - ০৭:৪৫",
            },
            {
              code: "ROUTE-02",
              title: "দাউদকান্দি লিংক রোড — মাদ্রাসা রুট",
              start: "দাউদকান্দি বিশ্বরোড মোড়",
              end: "মাদ্রাসা ক্যাম্পাস",
              stops: ["শহীদনগর", "গৌরীপুর বাস স্ট্যান্ড", "ইলিয়টগঞ্জ পুল", "মাদ্রাসা"],
              time: "সকাল ০৭:০০ - ০৭:৪৫",
            },
            {
              code: "ROUTE-03",
              title: "স্থানীয় বাজার ও আবাসিক সংযোগ রুট",
              start: "পৌর বাজার সংলগ্ন",
              end: "মাদ্রাসা ক্যাম্পাস",
              stops: ["উত্তরপাড়া জামে মসজিদ", "স্কুল গেট", "দক্ষিণ বাজার", "মাদ্রাসা"],
              time: "সকাল ০৭:২০ - ০৭:৫০",
            },
          ].map((r, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-xs">
                  {r.code}
                </span>
                <span className="text-xs font-semibold text-slate-500">{r.time}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-base">{r.title}</h3>
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>{r.start}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span>{r.end}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block">প্রধান স্টপসমূহ:</span>
                <div className="flex flex-wrap gap-1.5">
                  {r.stops.map((st, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Application Instructions / CTA */}
      <section className="py-12 px-4 max-w-6xl mx-auto w-full">
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              অভিভাবকদের জন্য নির্দেশনা
            </span>
            <h3 className="text-2xl md:text-3xl font-bold font-display">
              আপনার সন্তানের জন্য পরিবহন আসন নিশ্চিত করুন
            </h3>
            <p className="text-xs md:text-sm text-emerald-100 leading-relaxed">
              অভিভাবক পোর্টালে লগইন করে খুব সহজেই সন্তানের সুবিধাজনক রুট ও পিকআপ স্টপ নির্বাচন করে নতুন পরিবহন সেবার আবেদন করা যায়। আসন খালি সাপেক্ষে প্রশাসন কর্তৃক অনুমোদন প্রদান করা হয়।
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/portal?tab=TRANSPORT"
              className="px-6 py-3.5 bg-[#C59B27] hover:bg-amber-500 text-[#0B1914] rounded-xl text-sm font-bold transition shadow-lg flex items-center gap-2"
            >
              <span>পোর্টালে আবেদন করুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition border border-white/20"
            >
              যোগাযোগ ও হেল্পলাইন
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
