"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  Building,
  GraduationCap,
  Phone,
  MessageSquare,
  ShieldAlert,
  ArrowLeft,
  Copy,
  Check,
  CreditCard,
  Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function DonationClient() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} ক্লিপবোর্ডে কপি করা হয়েছে!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const categories = [
    {
      title: "লিল্লাহ বোর্ডিং ও এতিম তহবিল",
      description: "অসহায়, এতিম ও দুস্থ শিক্ষার্থীদের বিনামূল্যে খানা, বাসস্থান ও শিক্ষার খরচ বহন।",
      icon: Heart,
      color: "border-l-rose-600 text-rose-600 bg-rose-50 dark:bg-rose-950/40",
    },
    {
      title: "মাদ্রাসা ভবন ও অবকাঠামো উন্নয়ন",
      description: "নতুন শ্রেণী কক্ষ নির্মাণ, বহুতল ভবন সম্প্রসারণ ও আবাসিক হলের সার্বিক সংস্কার।",
      icon: Building,
      color: "border-l-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40",
    },
    {
      title: "হাফেজে কুরআন স্পন্সরশিপ",
      description: "১ জন হিফজ শিক্ষার্থীর বার্ষিক খাবারের দায়িত্ব গ্রহণ করে সাওয়াবে জারিয়া অর্জন করুন।",
      icon: GraduationCap,
      color: "border-l-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-full overflow-hidden shrink-0 shadow-sm border-2 border-emerald-600 bg-white p-0.5 transition-transform group-hover:scale-105">
              <Image
                src="/images/logo.png"
                alt="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার লোগো"
                width={44}
                height={44}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="leading-tight">
              <span className="text-base font-bold text-emerald-800 dark:text-emerald-400 block leading-tight">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold">
                জমিরীয়া মাদ্রাসা (অনদান ফান্ড)
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-sm text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> মূল পাতায় ফিরে যান
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 flex-1 w-full">
        {/* Banner Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-4 py-1.5 rounded-full text-xs font-bold border border-rose-200 dark:border-rose-800">
            <Heart className="h-4 w-4 text-rose-600 fill-rose-600" />
            <span>দ্বীনিয়া মাদ্রাসায় অনুদান ও সদকাহ জারিয়া</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            অনুদানের খাতসমূহ
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed italic">
            “যে ব্যক্তি আল্লাহর সন্তুষ্টির জন্য সদকাহ করে, আল্লাহ তাআলা তার সম্পদ বৃদ্ধি করে দেন।”
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Card
                key={idx}
                className={`shadow-sm border-l-4 ${cat.color.split(" ")[0]} hover:shadow-md transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`}
              >
                <CardHeader className="pb-3">
                  <div className={`p-3 rounded-xl w-fit ${cat.color.split(" ")[2]} ${cat.color.split(" ")[1]} mb-2`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                    {cat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {cat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment & Verification Account Card */}
        <Card className="shadow-lg border-2 border-emerald-600 dark:border-emerald-700 bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-emerald-950 text-white p-6">
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
              <Phone className="h-5 w-5 text-emerald-400" /> সরাসরি অনুদান পাঠানোর নির্ভরযোগ্য মাধ্যম
            </CardTitle>
            <CardDescription className="text-emerald-200 text-xs mt-1">
              মাদ্রাসার অফিশিয়াল একাউন্টে অনুদান পাঠিয়ে অফিশিয়াল হোয়াটসঅ্যাপে রশিদ নিশ্চিত করুন
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mobile Banking Card */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 relative">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" /> অফিশিয়াল বিকাশ / নগদ নম্বর
                  </h3>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                    পার্সোনাল / মার্চেন্ট
                  </Badge>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-lg border">
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                    01845-162664
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard("01845162664", "বিকাশ/নগদ নম্বর")}
                    className="text-xs gap-1.5 border-emerald-600 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50"
                  >
                    {copiedField === "বিকাশ/নগদ নম্বর" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" /> কপি হয়েছে
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> কপি করুন
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  টাকা পাঠানোর সময় রেফারেন্স হিসেবে <strong>Donation</strong> লিখুন।
                </p>
              </div>

              {/* Bank Details Card */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 relative">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-600" /> ব্যাংক একাউন্ট বিবরণী
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        "একাউন্ট নাম: ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা, ইসলামী ব্যাংক বাংলাদেশ লিমিটেড (ইলিয়টগঞ্জ শাখা)",
                        "ব্যাংক বিবরণী"
                      )
                    }
                    className="text-xs gap-1.5 border-emerald-600 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50"
                  >
                    {copiedField === "ব্যাংক বিবরণী" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" /> কপি হয়েছে
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> কপি করুন
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border space-y-1 text-xs">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    ইসলামী ব্যাংক বাংলাদেশ লিমিটেড (ইলিয়টগঞ্জ শাখা)
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  যেকোনো ব্যাংক অ্যাপ বা অনলাইন ব্যাংকিং-এর মাধ্যমে ফান্ড ট্রান্সফার করা যাবে।
                </p>
              </div>
            </div>

            {/* Verification Instruction Box */}
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">সতর্কতামূলক ও রসিদ সংগ্রহের নির্দেশনা:</p>
                <p className="leading-relaxed">
                  অনুদান পাঠানোর পর অফিশিয়াল রসিদ বা কনফার্মেশনের জন্য অবশ্যই অফিশিয়াল হোয়াটসঅ্যাপ নম্বর{" "}
                  <strong className="font-mono font-bold text-amber-950 dark:text-amber-100">01845-162664</strong>-এ
                  ট্রানজেকশন আইডি লিখে মেসেজ দিন।
                </p>
              </div>
            </div>

            {/* Direct Action Trigger Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <a
                href="tel:01845162664"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-emerald-600 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold text-sm rounded-xl transition-all shadow-2xs"
              >
                <Phone className="h-4 w-4" /> সরাসরি হেল্পলাইনে কল করুন
              </a>
              <a
                href="https://wa.me/8801845162664?text=আমি%20মাদ্রাসায়%20অনুদান%20সম্পর্কে%20জানতে%20চাই"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <MessageSquare className="h-4 w-4" /> হোয়াটসঅ্যাপে রশিদ নিশ্চিত করুন
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
