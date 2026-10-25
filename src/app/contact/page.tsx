"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeaderBanner from "@/components/PageHeaderBanner";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  Clock,
  Sparkles,
  Building2,
  Navigation,
  HelpCircle,
  AlertCircle,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Anti-bot honeypot
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResultMessage(null);

    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject,
          category,
          message,
          honeypot,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        setTicketNumber(data.ticketNumber || null);
        setResultMessage(
          data.messageBn || "আপনার বার্তাটি সফলভাবে মাদরাসা অফিসে পৌঁছেছে।"
        );
        setName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setMessage("");
      } else {
        setIsSuccess(false);
        setResultMessage(
          data.messageBn || "বার্তা প্রেরণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
        );
      }
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      setResultMessage(
        "সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। সরাসরি ফোনে যোগাযোগ করুন।"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      {/* 1. OFFICIAL PAGE HEADER BANNER WITH BREADCRUMB */}
      <PageHeaderBanner
        title="মাদরাসা অফিসের সাথে সরাসরি যোগাযোগ"
        subtitle="ক্যাম্পাস পরিদর্শন, নতুন ভর্তি সংক্রান্ত অনুসন্ধান, লিল্লাহ ফান্ডে অনুদান অথবা যে কোনো পরামর্শে আমাদের হেল্পলাইন সার্বক্ষণিক উন্মুক্ত"
        badge="অফিস সময়: সকাল ৮:০০ - রাত ৮:০০ • শুক্রবার বিশেষ মোলাকাত"
        breadcrumbs={[{ label: "যোগাযোগ" }]}
      />

      {/* 2. MAIN CONTENT GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 flex-1 w-full">
        {/* OFFICIAL PANORAMIC CONTACT & LOCATION BANNER */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-emerald-600/30 shadow-xl bg-emerald-950 group">
          <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full">
            <Image
              src="/images/banners/contact-location-banner.png"
              alt="যোগাযোগ ও অবস্থান | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
              fill
              className="object-cover group-hover:scale-[1.01] transition duration-500"
              priority
            />
          </div>
          <div className="p-4 bg-gradient-to-r from-[#041F14] via-[#063321] to-[#0A482D] text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-[#D4AF37]/40">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="font-bold text-amber-300 text-sm">
                যোগাযোগ ও অবস্থান • আপনার যেকোনো প্রশ্ন, পরামর্শ ও সহযোগিতায় আমরা পাশে আছি
              </span>
              <p className="text-emerald-100/90 text-xs">
                পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা | হেল্পলাইন: 01845-162664 | বালক শাখা: 01826-416696 | বালিকা শাখা: 01949-091911
              </p>
            </div>
            <a
              href="tel:01845162664"
              className="btn-gold px-5 py-2 rounded-xl text-slate-950 font-bold text-xs flex-shrink-0 shadow hover:scale-105 transition"
            >
              সরাসরি কল করুন
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Official Contact Channels (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <span className="text-[11px] font-extrabold text-[#0D5C3A] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  স্থায়ী ঠিকানা ও অফিস
                </span>
                <h2 className="text-xl font-bold font-display text-slate-900 mt-2">
                  ক্যাম্পাস অবস্থান ও জরুরি হেল্পলাইন
                </h2>
              </div>

              {/* Address Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">ক্যাম্পাস অবস্থান</h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {INSTITUTION_INFO.addressBn}
                    </p>
                    <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                      (ঢাকা-চট্টগ্রাম মহাসড়কের ইলিয়টগঞ্জ বাসস্ট্যান্ড সংলগ্ন পূর্ব লক্ষ্মীপুর)
                    </span>
                  </div>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  জরুরি ফোন নম্বরসমূহ (সরাসরি কল দিন):
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  <a
                    href="tel:01845162664"
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0D5C3A] flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block group-hover:text-[#0D5C3A] transition">
                          বালক শাখা ও মুহতামিম অফিস
                        </span>
                        <span className="font-mono text-xs text-slate-600">01845-162664</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      কল দিন
                    </span>
                  </a>

                  <a
                    href="tel:01949091911"
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 transition flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#9A781D] flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block group-hover:text-amber-800 transition">
                          বালিকা শাখা হেল্পলাইন
                        </span>
                        <span className="font-mono text-xs text-slate-600">01949-091911</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      কল দিন
                    </span>
                  </a>

                  <a
                    href="tel:01826416696"
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-700 transition">
                          শিক্ষা ও হিসাব শাখা
                        </span>
                        <span className="font-mono text-xs text-slate-600">01826-416696</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      কল দিন
                    </span>
                  </a>
                </div>
              </div>

              {/* Email & Working Hours */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#0D5C3A]" />
                  <span>ইমেইল: <strong className="font-mono text-slate-900">{INSTITUTION_INFO.email}</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                  <span>অফিস সময়সূচি: সকাল ৮:০০ টা হতে রাত ৮:০০ টা</span>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block mb-2">
                  অফিসিয়াল যোগাযোগ চ্যানেল:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <a
                    href={INSTITUTION_INFO.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    ফেসবুক
                  </a>
                  <a
                    href={INSTITUTION_INFO.whatsappDirect}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 transition flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                  <a
                    href={INSTITUTION_INFO.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 font-bold hover:bg-red-100 transition flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    ইউটিউব
                  </a>
                </div>
              </div>
            </div>

            {/* How to Reach Card */}
            <div className="bg-[#063321] text-white rounded-3xl p-6 border-2 border-[#D4AF37] space-y-3 shadow-lg">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <Navigation className="w-4 h-4 text-[#D4AF37]" />
                <span>কীভাবে ক্যাম্পাসে আসবেন</span>
              </div>
              <h3 className="font-bold text-sm text-white font-display">
                ঢাকা-চট্টগ্রাম মহাসড়ক থেকে সরাসরি যাতায়াত
              </h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-light text-justify">
                ঢাকা সায়েদাবাদ বা চট্টগ্রাম থেকে যে কোনো বাসে ইলিয়টগঞ্জ বাসস্ট্যান্ডে নামুন। সেখান থেকে পূর্ব দিকে পূর্ব লক্ষ্মীপুর হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার রাস্তায় মাত্র ৩ মিনিটে রিকশা বা অটোরিকশায় সরাসরি মাদরাসা ফটকে পৌঁছানো যায়।
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Inquiry Form & Map (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <span className="text-[11px] font-extrabold text-[#0D5C3A] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  অনলাইন বার্তা প্রেরণ
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mt-2">
                  মাদরাসা অফিসে সরাসরি বার্তা পাঠান
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  ভর্তি সংক্রান্ত তথ্য, পরামর্শ বা যে কোনো অনুসন্ধানে ফরমটি পূরণ করুন
                </p>
              </div>

              {resultMessage && (
                <div
                  className={`p-4 rounded-2xl text-xs flex items-start gap-3 ${
                    isSuccess
                      ? "bg-emerald-50 border border-emerald-300 text-emerald-900"
                      : "bg-red-50 border border-red-300 text-red-900"
                  }`}
                >
                  {isSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{resultMessage}</p>
                    {ticketNumber && (
                      <p className="mt-1 font-mono text-[11px] text-emerald-800">
                        ট্র্যাকিং টিকিট নম্বর: <strong>{ticketNumber}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot field (hidden) */}
                <input
                  type="text"
                  name="institution_sec_hp"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      আপনার নাম *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="পুরো নাম লিখুন"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      মোবাইল নম্বর *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="যেমন: 01845162664"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-slate-50/50 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      ইমেইল ঠিকানা (ঐচ্ছিক)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      বার্তার বিষয়বস্তুর ধরণ *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-white"
                    >
                      <option value="GENERAL">সাধারণ জিজ্ঞাসা</option>
                      <option value="ADMISSION">নতুন ভর্তি সংক্রান্ত</option>
                      <option value="DONATION">লিল্লাহ বোর্ডিং ও অনুদান</option>
                      <option value="ACADEMIC">একাডেমিক তথ্য</option>
                      <option value="FEEDBACK">মতামত ও পরামর্শ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    বার্তার শিরোনাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="সংক্ষেপে বিষয়টি লিখুন"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    আপনার বার্তা বিস্তারিত লিখুন *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="এখানে আপনার জিজ্ঞাসা বা বার্তা স্পষ্টভাবে লিখুন..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-slate-50/50 resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? "বার্তা পাঠানো হচ্ছে..." : "বার্তা প্রেরণ করুন"}</span>
                </button>
              </form>
            </div>

            {/* Google Maps Location Preview Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0D5C3A]" />
                  <span>গুগল ম্যাপে মাদরাসার ভৌগোলিক অবস্থান</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">23.4842° N, 90.7938° E</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-[16/7] relative bg-slate-100">
                <iframe
                  src="https://maps.google.com/maps?q=Eliotgonj,%20Daudkandi,%20Cumilla&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  title="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা অবস্থান"
                />
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
