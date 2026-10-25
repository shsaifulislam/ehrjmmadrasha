"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  User,
  Phone,
  DoorOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function GatePassVerifyPage() {
  const params = useParams();
  const token = params?.token as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/verify/gatepass/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("গেটপাস ভেরিফিকেশন তথ্য পাওয়া যায়নি।");
        return res.json();
      })
      .then((json) => {
        if (json.verified) {
          setData(json);
        } else {
          setError(json.message || "ভেরিফিকেশন ব্যর্থ হয়েছে।");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return {
          label: "অনুমোদিত (বহির্গমনের অপেক্ষায়)",
          color: "bg-blue-100 text-blue-800 border-blue-300",
          icon: ShieldCheck,
        };
      case "EXITED":
        return {
          label: "ক্যাম্পাসের বাহিরে (প্রস্থানকৃত)",
          color: "bg-amber-100 text-amber-800 border-amber-300",
          icon: DoorOpen,
        };
      case "RETURNED":
        return {
          label: "নিরাপদে প্রত্যাবর্তিত",
          color: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: CheckCircle2,
        };
      case "OVERDUE":
        return {
          label: "মেয়াদোত্তীর্ণ / বিলম্বিত (অবিলম্বে যোগাযোগ করুন)",
          color: "bg-red-100 text-red-800 border-red-300 animate-pulse",
          icon: AlertCircle,
        };
      default:
        return {
          label: "বাতিলকৃত",
          color: "bg-gray-100 text-gray-800 border-gray-300",
          icon: AlertTriangle,
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-12 flex flex-col justify-center">
        {loading ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-lg border border-slate-200 space-y-4">
            <div className="w-12 h-12 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-700">সিকিউরিটি গেটপাস ভেরিফাই হচ্ছে...</p>
          </div>
        ) : error || !data ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl border-2 border-red-200 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 font-serif-bn">অবৈধ বা অপ্রমাণিত গেটপাস</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              প্রদত্ত কিউআর কোডের বিপরীতে মাদরাসা কেন্দ্রীয় ডাটাবেজে কোনো সক্রিয় গেটপাস পাওয়া যায়নি। প্রধান ফটকে দায়িত্বপ্রাপ্ত নিরাপত্তা প্রহরীকে অবহিত করুন।
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition"
              >
                মূল পাতায় ফিরুন
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#D4AF37]/50 overflow-hidden relative">
            <div className="h-2 bg-gradient-to-r from-[#0D5C3A] via-[#D4AF37] to-[#0D5C3A]" />

            {/* Header */}
            <div className="bg-gradient-to-br from-[#063320] to-[#0D5C3A] text-white p-6 text-center space-y-2 relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>মাদরাসা নিরাপত্তা গেটপাস ভেরিফিকেশন</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black font-serif-bn">
                {data.institution?.nameBn}
              </h1>
              <p className="text-[11px] text-emerald-100/80">
                স্থাপিত: ২০২১ ইং • সিকিউরিটি চেকপয়েন্ট
              </p>
            </div>

            {/* Status Banner */}
            {(() => {
              const badge = getStatusBadge(data.gatePass?.status);
              const BadgeIcon = badge.icon;
              return (
                <div className={`p-4 border-b flex items-center justify-center gap-2 text-xs font-bold ${badge.color}`}>
                  <BadgeIcon className="w-4 h-4" />
                  <span>{badge.label}</span>
                </div>
              );
            })()}

            {/* Pass Content */}
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">পাস নম্বর</span>
                  <span className="text-base font-black font-mono text-[#0D5C3A]">
                    {data.gatePass?.passNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">ইস্যুর তারিখ</span>
                  <span className="text-xs font-bold text-slate-700">
                    {new Date(data.gatePass?.issuedAt).toLocaleDateString("bn-BD")}
                  </span>
                </div>
              </div>

              {/* Student Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">শিক্ষার্থীর নাম:</span>
                  <strong className="text-slate-900 font-serif-bn text-sm">
                    {data.gatePass?.studentNameBn}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">শিক্ষার্থী আইডি:</span>
                  <strong className="font-mono text-slate-800">{data.gatePass?.studentIdNumber}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">জামাত ও রোল:</span>
                  <span className="text-slate-800 font-medium">
                    {data.gatePass?.className} (রোল: {data.gatePass?.rollNumber})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ছাত্রাবাস অবস্থান:</span>
                  <span className="text-slate-800 font-medium">{data.gatePass?.roomOrSeat}</span>
                </div>
              </div>

              {/* Purpose & Schedule */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 block text-[10px] font-bold">গমনের কারণ</span>
                  <span className="font-bold text-slate-900">{data.gatePass?.purposeLabelBn}</span>
                  <p className="text-[10px] text-slate-600 mt-1">{data.gatePass?.purposeDescription}</p>
                </div>
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 block text-[10px] font-bold">অভিভাবক / সাথে গমনকারী</span>
                  <span className="font-bold text-slate-900">{data.gatePass?.escortName}</span>
                  <p className="text-[10px] text-slate-600 mt-1">
                    সম্পর্ক: {data.gatePass?.escortRelation} • ফোন: {data.gatePass?.escortPhone}
                  </p>
                </div>
              </div>

              {/* Timing */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">প্রত্যাশিত বহির্গমন</span>
                  <span className="font-bold text-slate-800">
                    {new Date(data.gatePass?.departureExpected).toLocaleString("bn-BD")}
                  </span>
                  {data.gatePass?.actualExitTime && (
                    <span className="text-[10px] text-emerald-700 block mt-0.5">
                      প্রকৃত প্রস্থান: {new Date(data.gatePass.actualExitTime).toLocaleTimeString("bn-BD")}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">প্রত্যাশিত প্রত্যাবর্তন</span>
                  <span className="font-bold text-slate-800">
                    {new Date(data.gatePass?.returnExpected).toLocaleString("bn-BD")}
                  </span>
                  {data.gatePass?.actualReturnTime && (
                    <span className="text-[10px] text-emerald-700 block mt-0.5">
                      প্রকৃত প্রত্যাবর্তন: {new Date(data.gatePass.actualReturnTime).toLocaleTimeString("bn-BD")}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                অনুমোদনকারী: {data.gatePass?.approvedBy} • মাদরাসা কেন্দ্রীয় গেটপাস ট্র্যাকার
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
