"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  Printer,
  ArrowLeft,
  Boxes,
  QrCode,
  Building2,
  MapPin,
  Tag,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function PublicAssetVerificationPage() {
  const params = useParams();
  const rawToken = (params?.token as string) || "";
  const token = decodeURIComponent(rawToken);

  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/public/inventory/verify/asset/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.verified && data.asset) {
          setAsset(data.asset);
        } else {
          setError(data.error || "প্রদত্ত কিউআর কোড বা টোকেনে কোনো প্রাতিষ্ঠানিক সম্পদের তথ্য মেলেনি।");
        }
      })
      .catch(() => {
        setError("ভেরিফিকেশন সম্পন্ন করতে প্রযুক্তিগত সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case "NEW":
        return "নতুন / অক্ষত";
      case "GOOD":
        return "উত্তম কার্যক্ষম";
      case "FAIR":
        return "চলনসই";
      case "DAMAGED":
        return "ক্ষতিগ্রস্ত";
      case "REPAIR_REQUIRED":
        return "মেরামতধীন / আবশ্যক";
      default:
        return condition;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "AVAILABLE":
        return "সক্রিয় প্রাতিষ্ঠানিক সম্পদ";
      case "IN_USE":
        return "ব্যবহারাধীন";
      case "REPAIR":
        return "মেরামতে প্রেরিত";
      case "DISPOSED":
        return "নিষ্কাশিত / অবমুক্ত";
      case "LOST":
        return "হারিয়ে যাওয়া হিসেবে তালিকাভুক্ত";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-12 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/verify"
            className="text-xs text-[#0D5C3A] hover:underline flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            সাধারণ ভেরিফিকেশন পোর্টালে ফিরুন
          </Link>
          {asset && (
            <button
              onClick={() => window.print()}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm print:hidden"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              প্রিন্ট ভেরিফিকেশন স্লিপ
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-12 h-12 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-bold text-base text-gray-700">ডিজিটাল প্রাতিষ্ঠানিক সম্পদ যাচাই করা হচ্ছে...</h3>
            <p className="text-xs text-gray-500 mt-1 font-mono">টোকেন: {token}</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 sm:p-10 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-red-700">সম্পদ সনাক্তকরণ ব্যর্থ হয়েছে</h2>
              <p className="text-xs text-gray-600 max-w-md mx-auto">{error}</p>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">রেফারেন্স কিউআর টোকেন: {token}</p>
          </div>
        ) : (
          asset && (
            <div className="bg-white rounded-2xl border border-[#C59B27]/40 shadow-xl overflow-hidden print:border-none print:shadow-none">
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-[#083B25] to-[#0D5C3A] text-white p-6 sm:p-8 border-b-4 border-[#C59B27] relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold backdrop-blur border border-emerald-600/50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      অফিশিয়াল ভেরিফাইড প্রাতিষ্ঠানিক সম্পদ
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white pt-2">
                      {asset.item?.nameBn || "প্রাতিষ্ঠানিক সামগ্রী"}
                    </h1>
                    <p className="text-xs text-emerald-100 font-medium">
                      {asset.item?.nameEn}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[11px] text-emerald-200 block font-semibold">সম্পদ কোড (Asset Code)</span>
                    <span className="text-lg sm:text-xl font-mono font-bold text-[#C59B27] bg-[#083B25] px-3 py-1 rounded border border-[#C59B27]/50 inline-block mt-0.5">
                      {asset.assetCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Institution Credentials */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3 p-3.5 bg-[#F9F8F3] rounded-xl border border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-[#083B25] text-[#C59B27] flex items-center justify-center font-bold text-base flex-shrink-0 shadow">
                    🕌
                  </div>
                  <div className="text-xs">
                    <h3 className="font-bold text-[#083B25]">{INSTITUTION_INFO.nameBn}</h3>
                    <p className="text-gray-500">{INSTITUTION_INFO.nameEn} • স্থাপিত: {INSTITUTION_INFO.established}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{INSTITUTION_INFO.addressBn}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-gray-400" /> ক্যাটেগরি ও বিভাগ
                    </span>
                    <p className="font-bold text-gray-900 text-sm">{asset.item?.category?.nameBn || "সাধারণ"}</p>
                    <p className="text-[11px] text-gray-500">{asset.item?.category?.nameEn}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" /> বর্তমান নির্ধারিত অবস্থান
                    </span>
                    <p className="font-bold text-[#0D5C3A] text-sm">{asset.location?.name || "মূল কার্যালয় / কেন্দ্রীয় সংরক্ষণাগার"}</p>
                    <p className="text-[11px] text-gray-500">ক্যাম্পাস অবকাঠামো জোন</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-gray-400" /> সামগ্রীর বর্তমান অবস্থা
                    </span>
                    <p className="font-bold text-gray-900 text-sm">{getConditionLabel(asset.condition)}</p>
                    <p className="text-[11px] text-gray-500 font-mono">Condition: {asset.condition}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-gray-400" /> রেজিস্ট্রি স্ট্যাটাস
                    </span>
                    <p className="font-bold text-gray-900 text-sm">{getStatusLabel(asset.status)}</p>
                    <p className="text-[11px] text-gray-500 font-mono">Status: {asset.status}</p>
                  </div>
                </div>

                {/* Serial Number & Security Notice */}
                {asset.serialNumber && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">যন্ত্রাংশের সিরিয়াল নম্বর:</span>
                    <span className="font-mono font-bold text-slate-800">{asset.serialNumber}</span>
                  </div>
                )}

                {/* Privacy Safe Disclaimer */}
                <div className="text-[11px] text-gray-500 bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>নিরাপত্তা ও গোপনীয়তা বিজ্ঞপ্তি:</strong> এটি একটি ডিজিটাল কিউআর সনাক্তকরণ রেকর্ড। প্রাতিষ্ঠানিক গোপনীয়তা রক্ষার স্বার্থে ক্রয়মূল্য, অভ্যন্তরীণ দায়িত্বপ্রাপ্ত ব্যক্তি বা অর্থায়নকারী ভাউচার তথ্য উন্মুক্ত পাবলিক ভিউ থেকে সুরক্ষিত রাখা হয়েছে।
                  </p>
                </div>

                <div className="pt-2 text-center text-[10px] text-gray-400 font-mono">
                  ভেরিফিকেশন টোকেন হ্যাশ: {asset.verificationToken} • ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
                </div>
              </div>
            </div>
          )
        )}
      </main>

      <Footer />
    </div>
  );
}
