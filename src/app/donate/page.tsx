"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeaderBanner from "@/components/PageHeaderBanner";
import {
  Heart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Printer,
  ArrowRight,
  RotateCcw,
  Building2,
  Lock,
  Phone,
  HelpCircle,
  QrCode,
  DollarSign,
  Send,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
import { FUND_CATEGORIES } from "@/lib/donationConstants";

interface PublicPaymentMethod {
  id: string;
  type: string;
  nameBn: string;
  accountNumber?: string;
  accountType?: string;
  bankName?: string;
  branchName?: string;
  accountHolderName?: string;
  routingNumber?: string;
  instructions: string;
  isEnabled: boolean;
}

export default function DonatePage() {
  const [fundCategory, setFundCategory] = useState<string>("ORPHAN_LILLAH");
  const [amount, setAmount] = useState<string>("");
  const [donorName, setDonorName] = useState<string>("");
  const [donorPhone, setDonorPhone] = useState<string>("");
  const [donorEmail, setDonorEmail] = useState<string>("");
  const [donorAddress, setDonorAddress] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  // Payment Methods loaded dynamically from API
  const [paymentMethods, setPaymentMethods] = useState<PublicPaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");

  const [loadingMethods, setLoadingMethods] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Success Receipt State
  const [completedDonation, setCompletedDonation] = useState<any | null>(null);

  // Pre-set quick suggestions for donor convenience
  const quickAmounts = ["১০০", "৫০০", "১,০০০", "২,৫০০", "৫,০০০", "১০,০০০"];
  const quickAmountValues = [100, 500, 1000, 2500, 5000, 10000];

  useEffect(() => {
    fetch("/api/payments/methods")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data.paymentMethods) ? data.paymentMethods : Array.isArray(data.methods) ? data.methods : [];
        if (data.success && list.length > 0) {
          setPaymentMethods(list);
          setSelectedMethodId(list[0].id);
        }
      })
      .catch((err) => console.error("Error loading payment methods:", err))
      .finally(() => setLoadingMethods(false));
  }, []);

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("অনুগ্রহ করে দানের একটি সঠিক অংক (যেকোনো পরিমাণ) প্রদান করুন।");
      return;
    }

    if (!isAnonymous && !donorName.trim()) {
      setError("দাতার পূর্ণ নাম প্রদান করুন অথবা 'গোপন দাতা হিসেবে দান করতে চাই' বক্সে টিক দিন।");
      return;
    }

    if (!selectedMethod) {
      setError("অনুগ্রহ করে একটি পেমেন্ট চ্যানেল নির্বাচন করুন।");
      return;
    }

    if (!transactionId.trim()) {
      setError("অনুগ্রহ করে আপনার পেমেন্টের ট্রানজেকশন আইডি (TrxID) বা ব্যাংক রেফারেন্স নম্বরটি প্রদান করুন।");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundCategory,
          amount: numericAmount,
          donorName: isAnonymous ? "গোপন দাতা" : donorName,
          donorPhone,
          donorEmail,
          donorAddress,
          isAnonymous,
          notes,
          paymentMethod: selectedMethod.type,
          paymentMethodBn: selectedMethod.nameBn,
          transactionId: transactionId.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCompletedDonation(data.donation);
      } else {
        setError(data.error || "অনুদান সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    } catch (err) {
      console.error(err);
      setError("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      <Navbar />

      {/* 1. OFFICIAL PAGE HEADER BANNER WITH BREADCRUMB */}
      <PageHeaderBanner
        title="লিল্লাহ বোর্ডিং ও এতিমখানা উন্মুক্ত অনুদান"
        subtitle="এতিম ও অসহায় তালিবুল ইলমদের অন্ন, বস্ত্র ও দ্বীনি শিক্ষার খেদমতে আপনার যাকাত ও সদকা প্রদান করুন"
        badge="সদকায়ে জারিয়া • ১০০% আমানতদারিতা ও শরিয়াহসম্মত বণ্টন"
        breadcrumbs={[{ label: "অনুদানের হাত বাড়ান" }]}
      />

      {/* 2. HADITH / AYAH BANNER */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 print:hidden">
        <div className="bg-gradient-to-r from-[#063321] via-[#0D5C3A] to-[#063321] text-white p-5 rounded-2xl border-2 border-[#D4AF37] shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-arabic text-[#D4AF37] text-lg sm:text-xl tracking-wider">
              مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ
            </p>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium">
              "যারা আল্লাহর রাস্তায় ধন-সম্পদ ব্যয় করে, তাদের উপমা একটি বীজের মতো, যা থেকে সাতটি শীষ জন্মায়..." — (সূরা আল-বাক্বারাহ: ২৬১)
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/20 text-xs font-semibold text-amber-200">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>তাৎক্ষণিক ডিজিটাল মানি রিসিট</span>
          </div>
        </div>
      </section>

      {/* 3. MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {/* Printable Official Receipt Screen */}
        {completedDonation ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-950 flex items-center justify-between print:hidden shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-sm">আলহামদুলিল্লাহ! আপনার অনুদান সফলভাবে সংরক্ষিত হয়েছে</h3>
                  <p className="text-xs text-slate-600">নিচে আপনার প্রাতিষ্ঠানিক ডিজিটাল মানি রিসিট প্রস্তুত করা হয়েছে। আপনি এটি প্রিন্ট বা সংরক্ষণ করতে পারেন।</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="flex items-center gap-1.5 bg-[#0D5C3A] hover:bg-[#063321] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>রশিদ প্রিন্ট / PDF</span>
                </button>
                <button
                  onClick={() => {
                    setCompletedDonation(null);
                    setAmount("");
                    setTransactionId("");
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition"
                  title="পুনরায় দান করুন"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Money Receipt Card (Clean Print layout) */}
            <div className="bg-white rounded-3xl border-2 border-[#D4AF37] p-8 shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:p-0">
              {/* Receipt Header */}
              <div className="text-center border-b-2 border-emerald-900/40 pb-6 mb-6">
                <div className="font-arabic text-[#0D5C3A] text-lg font-bold mb-1">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0D5C3A] font-display">
                  {INSTITUTION_INFO.nameBn}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  {INSTITUTION_INFO.addressBn} | হেল্পলাইন: {INSTITUTION_INFO.primaryPhone}
                </p>
                <div className="inline-block mt-3 px-4 py-1 rounded-full bg-[#0D5C3A] text-white font-bold text-xs tracking-wider uppercase">
                  অফিসিয়াল ডিজিটাল অনুদান রশিদ (Donation Receipt)
                </div>
              </div>

              {/* Receipt Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">রশিদ নম্বর:</span>
                  <strong className="font-mono text-slate-900 text-sm">{completedDonation.receiptNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">তারিখ ও সময়:</span>
                  <strong className="text-slate-900">{new Date(completedDonation.createdAt).toLocaleDateString("bn-BD")}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">পেমেন্ট মাধ্যম:</span>
                  <strong className="text-slate-900">{completedDonation.paymentMethodBn}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">ট্রানজেকশন আইডি:</span>
                  <strong className="font-mono text-slate-900">{completedDonation.transactionId}</strong>
                </div>
              </div>

              {/* Donor Details Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6 text-xs">
                <table className="w-full text-left">
                  <tbody>
                    <tr className="border-b border-slate-100 bg-white">
                      <td className="p-3 font-semibold text-slate-500 w-1/3">দাতার নাম:</td>
                      <td className="p-3 font-bold text-slate-900 text-sm">{completedDonation.donorName}</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-500">তহবিল / খাতের নাম:</td>
                      <td className="p-3 font-bold text-[#0D5C3A]">{completedDonation.fundCategoryBn}</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-white">
                      <td className="p-3 font-semibold text-slate-500">দানের পরিমাণ:</td>
                      <td className="p-3 font-black text-2xl text-emerald-800">
                        ৳ {completedDonation.amount.toLocaleString("bn-BD")} <span className="text-xs font-normal text-slate-500">টাকা</span>
                      </td>
                    </tr>
                    {completedDonation.notes && (
                      <tr className="bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-500">দোয়ার আবেদন / বিশেষ বার্তা:</td>
                        <td className="p-3 text-slate-700 italic">{completedDonation.notes}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signature & Verification Seal */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600">
                    <QrCode className="w-8 h-8 text-[#0D5C3A]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">ভেরিফিকেশন টোকেন</span>
                    <span className="font-mono text-xs font-bold text-slate-800">{completedDonation.verificationToken}</span>
                    <span className="text-[10px] text-emerald-700 block font-semibold mt-0.5">১০০% ডিজিটাল অডিটেড ও ভেরিফাইড</span>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <div className="font-arabic text-[#0D5C3A] font-bold text-sm mb-1">جَزَاكُمُ اللَّهُ خَيْرًا</div>
                  <p className="text-[11px] text-slate-600">হিসাব ও অর্থ মন্ত্রণালয় শাখা</p>
                  <strong className="text-xs text-slate-900">{INSTITUTION_INFO.nameBn}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Donation Form Flow */
          <div className="space-y-8">
            {/* Top Official Lillah Boarding & Sadaqah Banner */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#D4AF37] shadow-xl bg-emerald-950 group">
              <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full">
                <Image
                  src="/images/banners/donation-lillah-boarding-banner.jpg"
                  alt="দান, সদকা ও লিল্লাহ বোর্ডিং | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
                  fill
                  className="object-cover group-hover:scale-[1.01] transition duration-500"
                  priority
                />
              </div>
              <div className="p-4 bg-gradient-to-r from-[#041F14] via-[#063321] to-[#0A482D] text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-[#D4AF37]/40">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="font-bold text-amber-300 text-sm">
                    দান, সদকা ও লিল্লাহ বোর্ডিং • একটি দান, অসংখ্য সওয়াবের পথ
                  </span>
                  <p className="text-emerald-100/90 text-xs">
                    খাদ্য, আবাসন, শিক্ষা উপকরণ, পোশাক ও চিকিৎসা সহায়তায় আপনার অনুদান পৌঁছে দিন সরাসরি ছাত্রদের কাছে
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black px-4 py-1.5 rounded-xl text-xs shadow">
                  <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                  <span>সদকায়ে জারিয়া</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left: Donation Form (8 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <span className="text-[11px] font-extrabold text-[#0D5C3A] bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full uppercase tracking-wider inline-block">
                  অনলাইন অনুদান পোর্টাল
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 mt-2">
                  আপনার কাঙ্ক্ষিত তহবিল ও অনুদানের পরিমাণ লিখুন
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  * এতিমখানা ও লিল্লাহ বোর্ডিংয়ে কোনো নির্দিষ্ট ফি নেই; আপনি আপনার সামর্থ্য অনুযায়ী যেকোনো অংক দান করতে পারেন।
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Fund Selection */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-800">
                    ১. কোন তহবিলে দান করতে চান?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(FUND_CATEGORIES).map(([code, meta]) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setFundCategory(code)}
                        className={`p-3.5 rounded-2xl border text-left transition relative ${
                          fundCategory === code
                            ? "bg-emerald-50/90 border-[#0D5C3A] ring-2 ring-[#0D5C3A]/20 shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${fundCategory === code ? "text-[#0D5C3A]" : "text-slate-800"}`}>
                            {meta.bn}
                          </span>
                          {fundCategory === code && <CheckCircle2 className="w-4 h-4 text-[#0D5C3A]" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{meta.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Open Flexible Amount Input */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800">
                    ২. দানের পরিমাণ (টাকায় ৳) — <span className="text-[#0D5C3A] font-normal">যেকোনো পরিমাণ ইচ্ছামত লিখুন:</span>
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">৳</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="যেমন: ৫০০ বা ১,০০০ বা যেকোনো পরিমাণ"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-[#0D5C3A] focus:ring-4 focus:ring-emerald-500/10 text-xl font-bold text-slate-900 transition outline-none"
                    />
                  </div>

                  {/* Quick Shortcut Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">দ্রুত নির্বাচনের সুযোগ:</span>
                    <div className="flex flex-wrap gap-2">
                      {quickAmounts.map((label, idx) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setAmount(String(quickAmountValues[idx]))}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                            amount === String(quickAmountValues[idx])
                              ? "bg-[#0D5C3A] text-white border-[#0D5C3A] shadow-sm"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          ৳ {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Donor Identity */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      ৩. দাতার তথ্যাদি:
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0D5C3A] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded text-[#0D5C3A] focus:ring-[#0D5C3A]"
                      />
                      <span>গোপন দাতা হিসেবে দান করতে চাই</span>
                    </label>
                  </div>

                  {!isAnonymous && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">দাতার পূর্ণ নাম *</label>
                        <input
                          type="text"
                          placeholder="আপনার নাম লিখুন"
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#0D5C3A] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">মোবাইল নম্বর (রশিদ প্রাপ্তির জন্য)</label>
                        <input
                          type="text"
                          placeholder="01XXXXXXXXX"
                          value={donorPhone}
                          onChange={(e) => setDonorPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#0D5C3A] outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">দোয়ার আবেদন / বিশেষ বার্তা (ঐচ্ছিক)</label>
                    <textarea
                      rows={2}
                      placeholder="মরহুম পিতামাতার মাগফিরাত বা বিশেষ দোয়ার জন্য বার্তা লিখুন..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#0D5C3A] outline-none"
                    />
                  </div>
                </div>

                {/* 4. Secure Payment Channel */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#0D5C3A]" />
                    <label className="block text-xs font-bold text-slate-800">
                      ৪. অফিসিয়াল পেমেন্ট চ্যানেল নির্বাচন ও পরিশোধ:
                    </label>
                  </div>

                  {loadingMethods ? (
                    <div className="p-4 text-center text-xs text-slate-500">পেমেন্ট চ্যানেল লোড হচ্ছে...</div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="p-4 bg-amber-50 text-amber-900 rounded-xl text-xs">
                      বর্তমানে কোনো গেটওয়ে সক্রিয় নেই। মাদরাসা হেল্পলাইনে সরাসরি যোগাযোগ করুন।
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {paymentMethods.map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedMethodId(method.id)}
                            className={`p-3.5 rounded-2xl border text-left transition ${
                              selectedMethodId === method.id
                                ? "bg-[#063321] text-white border-[#063321] shadow-md ring-2 ring-emerald-500/20"
                                : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <span className="text-xs font-bold block">{method.nameBn}</span>
                            <span className={`text-[10px] block mt-0.5 ${selectedMethodId === method.id ? "text-emerald-300" : "text-slate-500"}`}>
                              {method.accountType === "MERCHANT" ? "অফিসিয়াল মার্চেন্ট" : "অফিসিয়াল একাউন্ট"}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Selected method instructions */}
                      {selectedMethod && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                              <span className="text-[11px] font-bold text-slate-500 block uppercase">নির্বাচিত মাধ্যম:</span>
                              <strong className="text-sm font-bold text-[#0D5C3A]">{selectedMethod.nameBn}</strong>
                            </div>
                            {selectedMethod.accountNumber && (
                              <div className="text-right">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">অফিসিয়াল নম্বর:</span>
                                <span className="font-mono text-base font-bold text-slate-900 bg-white px-3 py-1 rounded-xl border border-slate-200 select-all inline-block">
                                  {selectedMethod.accountNumber}
                                </span>
                              </div>
                            )}
                          </div>

                          {selectedMethod.bankName && (
                            <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                              <p className="font-bold text-slate-900">{selectedMethod.bankName}</p>
                              {selectedMethod.branchName && <p className="text-[11px] text-slate-600">শাখা: {selectedMethod.branchName}</p>}
                              {selectedMethod.accountHolderName && <p className="text-[11px] text-slate-600">হিসাবের নাম: {selectedMethod.accountHolderName}</p>}
                            </div>
                          )}

                          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-slate-700 leading-relaxed text-[11px]">
                            <strong>পেমেন্ট নিয়ম:</strong> {selectedMethod.instructions}
                          </div>

                          {/* Transaction ID */}
                          <div className="pt-2">
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              পেমেন্ট সম্পন্ন করার পর প্রাপ্ত ট্রানজেকশন আইডি (TrxID) লিখুন *
                            </label>
                            <input
                              type="text"
                              placeholder="যেমন: BKL897HJ2 বা ব্যাংক রেফারেন্স"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              required
                              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-[#0D5C3A] font-mono text-sm uppercase text-slate-900 outline-none"
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              * TrxID সাবমিট করার সাথে সাথেই আপনার অফিসিয়াল মানি রিসিট প্রস্তুত হয়ে যাবে।
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 px-6 rounded-2xl btn-gold text-slate-950 font-black text-sm transition shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>অনুদান যাচাই ও রশিদ তৈরি হচ্ছে...</span>
                      </span>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
                        <span>অনুদান সম্পন্ন করুন ও তাৎক্ষণিক রশিদ পান</span>
                        <ArrowRight className="w-4 h-4 text-slate-950" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Security & Institution Assurance (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Official Orphan Support Poster Card */}
              <div className="bg-gradient-to-b from-white to-amber-50/50 rounded-3xl border-2 border-[#D4AF37] p-4 shadow-lg overflow-hidden group">
                <div className="flex items-center justify-between mb-2 border-b border-amber-100 pb-2">
                  <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm font-serif-bn">
                    জরুরি মানবিক আবেদন
                  </span>
                  <span className="text-xs font-bold text-[#0D5C3A] font-serif-bn">
                    এতিম ফান্ড ২০২৬
                  </span>
                </div>

                <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow border border-amber-200 mb-3 bg-slate-900">
                  <Image
                    src="/images/banners/orphan-support-poster.jpg"
                    alt="এতিম ও অসহায় শিক্ষার্থীদের সহায়তা করুন - ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা"
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                    priority
                  />
                </div>

                <p className="text-xs text-slate-700 leading-snug font-serif-bn text-center font-medium">
                  একটি দান, একটি এতিম শিক্ষার্থীর উজ্জ্বল ভবিষ্যৎ ও আখিরাতের অফুরন্ত প্রতিদান
                </p>
              </div>

              <div className="bg-[#063321] text-white rounded-3xl p-6 border-2 border-[#D4AF37] space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>প্রাতিষ্ঠানিক নিশ্চয়তা</span>
                </div>
                <h3 className="text-base font-bold font-display text-white leading-snug">
                  ১০০% শরিয়াহসম্মত বণ্টন ও স্বচ্ছ হিসাব ব্যবস্থা
                </h3>
                <p className="text-xs text-emerald-100/90 leading-relaxed font-light">
                  লিল্লাহ বোর্ডিং ও এতিমখানা তহবিলে প্রাপ্ত প্রতিটি অনুদান মাদরাসার পরিচালনা পর্ষদের প্রত্যক্ষ তদারকিতে এতিম শিক্ষার্থীদের খাদ্য ও দ্বীনি শিক্ষার পেছনে ব্যয় হয়।
                </p>

                <div className="pt-3 border-t border-emerald-800/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>স্বয়ংক্রিয় ডিজিটাল মানি রিসিট</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>অনলাইনে যেকোনো সময় রিসিট যাচাই</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>কোনো ব্যক্তিগত নম্বরে লেনদেন নয়</span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp/IMO Support */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#0D5C3A]" />
                  <span>অনুদান সংক্রান্ত সহায়তা:</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  পেমেন্ট সংক্রান্ত কোনো জিজ্ঞাসা থাকলে আমাদের সরাসরি কল বা হোয়াটসঅ্যাপে বার্তা পাঠাতে পারেন।
                </p>
                <div className="space-y-2 pt-1">
                  <a
                    href="https://wa.me/8801845162664"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-50 text-[#0D5C3A] border border-emerald-300 hover:bg-emerald-100 transition"
                  >
                    <span>হোয়াটসঅ্যাপ / কল (01845-162664)</span>
                  </a>
                  <p className="text-[11px] text-slate-500 text-center">
                    অফিস সময়: সকাল ৮:০০টা - রাত ৮:০০টা
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>

      <Footer />
    </div>
  );
}
