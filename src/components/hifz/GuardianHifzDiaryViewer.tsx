"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  Bookmark,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import HifzQuranProgressGrid from "./HifzQuranProgressGrid";
import { HIFZ_QUALITY_OPTIONS } from "@/lib/hifz/hifzConstants";

interface GuardianHifzDiaryViewerProps {
  studentId?: string;
  studentName?: string;
}

export default function GuardianHifzDiaryViewer({
  studentId,
  studentName,
}: GuardianHifzDiaryViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  const loadHifzData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = studentId
        ? `/api/hifz/tracker?studentId=${studentId}`
        : `/api/hifz/tracker`;

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "হিফজ তথ্য লোড করতে ব্যর্থ হয়েছে।");
      }

      setData(json.data);
    } catch (err: any) {
      setError(err.message || "ত্রুটি হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHifzData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-3 shadow-sm">
        <div className="animate-spin w-8 h-8 border-4 border-[#0D5C3A] border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-gray-500 font-medium">
          পবিত্র কুরআন হিফজ ডায়েরি ও প্রগ্রেস লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-3xl text-xs flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
        <div>
          <span className="font-bold block">হিফজ ডায়েরি লোড করা যায়নি</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!data?.isHifzStudent && !data?.detail?.summary) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-amber-50 text-amber-800 rounded-full flex items-center justify-center mx-auto border border-amber-200">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">
            {studentName ? `${studentName} সাধারণ/কিতাব বিভাগে অধ্যয়নরত` : "হিফজ বিভাগে নথিভুক্ত নয়"}
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            এই শিক্ষার্থী বর্তমানে তাহফীজুল কুরআন (হিফজ) বিভাগে সরাসরি নথিভুক্ত নেই। হিফজ বিভাগে ভর্তির জন্য মাদরাসা অফিসে যোগাযোগ করুন।
          </p>
        </div>
      </div>
    );
  }

  const detail = data.detail;
  const summary = detail?.summary;
  const history = detail?.recentLogs || detail?.history || [];
  const stats = detail?.stats;
  const latestLog = history.length > 0 ? history[0] : null;

  const latestQualityMeta = latestLog?.sabaq?.quality
    ? HIFZ_QUALITY_OPTIONS[latestLog.sabaq.quality]
    : null;

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0D5C3A] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-400 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-emerald-100 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
                তাহফীজুল কুরআন হিফজ ডায়েরি
              </span>
              {summary?.isHafez && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-900" />
                  হাফেযে কুরআন
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2">
              {summary?.studentNameBn}
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1">
              রোল: {summary?.rollNumber} | আইডি: {summary?.studentIdNumber} | মাদরাসা কোড: EHRJ-2021
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center self-start sm:self-auto min-w-[140px]">
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
              {summary?.totalParasCompleted || 0}{" "}
              <span className="text-xs font-normal text-emerald-100">/ ৩০ পারা</span>
            </div>
            <div className="text-[11px] text-emerald-200 mt-0.5">
              মোট সম্পন্ন: <span className="font-bold text-white">{stats?.completionPercentage || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Today's Sabaq & Performance Highlight */}
      {latestLog ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0D5C3A]" />
                সর্বশেষ পঠিত সবক ও মূল্যায়ন (তারিখ: {latestLog.date})
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                উস্তাদ: {latestLog.recordedBy}
              </p>
            </div>
            {latestQualityMeta && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${latestQualityMeta.badgeClass}`}
              >
                {latestQualityMeta.labelBn}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sabaq */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                ১. নতুন সবক (Sabaq)
              </span>
              <div className="font-bold text-gray-900 text-sm">
                {latestLog.sabaq?.surahName || "নির্ধারিত নেই"}
              </div>
              <div className="text-xs text-gray-600">
                {latestLog.sabaq?.ayahRange} ({latestLog.sabaq?.pages})
              </div>
              <div className="text-[10px] text-gray-400">
                চলতি পারা: {latestLog.sabaq?.para || summary?.currentSabaqPara}
              </div>
            </div>

            {/* Sabqi */}
            <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 space-y-1.5">
              <span className="text-[10px] font-bold text-blue-800 uppercase block">
                ২. সবকী (Sabqi - পেছনের পড়া)
              </span>
              <div className="font-bold text-gray-900 text-sm">
                {latestLog.sabqi?.pages || "পারা " + (latestLog.sabqi?.para || summary?.currentSabaqPara)}
              </div>
              <div className="text-xs text-gray-600">
                মান:{" "}
                <span className="font-semibold text-blue-900">
                  {latestLog.sabqi?.quality
                    ? HIFZ_QUALITY_OPTIONS[latestLog.sabqi.quality]?.labelBn
                    : "উত্তম"}
                </span>
              </div>
            </div>

            {/* Manzil */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">
                ৩. আমোক্তা (Manzil - মুখস্থ রিভিশন)
              </span>
              <div className="font-bold text-gray-900 text-sm">
                {latestLog.manzil?.paraRange || "পারা ১"}
              </div>
              <div className="text-xs text-gray-600">
                পরিধি: {latestLog.manzil?.portion || "১ম কোয়ার্টার"}
              </div>
            </div>
          </div>

          {latestLog.remarks && (
            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl text-xs text-stone-800">
              <span className="font-bold text-emerald-900">উস্তাদের বিশেষ মন্তব্য: </span>
              {latestLog.remarks}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl text-xs text-amber-900">
          আজকের সবক এখনো এন্ট্রি হয়নি। ফজরের নামাজের পর উস্তাদ মহোদয় সবক গ্রহণ করবেন।
        </div>
      )}

      {/* 3. Visual 30-Para Quran Progress Map */}
      <HifzQuranProgressGrid
        completedParas={summary?.completedParasList || []}
        currentPara={summary?.currentSabaqPara}
        studentName={summary?.studentNameBn}
        readOnly={true}
      />

      {/* 4. Recitation History Ledger */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0D5C3A]" />
            দৈনিক তিলাওয়াত ও মূল্যায়নের অতীত ইতিহাস (Log History)
          </h3>
          <span className="text-xs text-gray-500 font-semibold">
            সর্বমোট এন্ট্রি: {history.length} টি
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-gray-200 text-gray-700 font-bold">
                <th className="p-3 min-w-[100px]">তারিখ</th>
                <th className="p-3 min-w-[160px]">সবক (Sabaq)</th>
                <th className="p-3 min-w-[120px]">সবকী (Sabqi)</th>
                <th className="p-3 min-w-[120px]">আমোক্তা (Manzil)</th>
                <th className="p-3 text-center min-w-[100px]">মূল্যায়ন</th>
                <th className="p-3 min-w-[160px]">উস্তাদের মন্তব্য</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    পূর্ববর্তী কোনো হিস্ট্রি পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                history.map((log: any) => {
                  const qMeta = log.sabaq?.quality
                    ? HIFZ_QUALITY_OPTIONS[log.sabaq.quality]
                    : null;

                  return (
                    <tr key={log.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-gray-900">
                        {log.date}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-gray-900 block">
                          {log.sabaq?.surahName}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {log.sabaq?.ayahRange} ({log.sabaq?.pages})
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-gray-800">
                          {log.sabqi?.pages || "পারা " + (log.sabqi?.para || "-")}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-gray-800">
                          {log.manzil?.paraRange}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {log.manzil?.portion}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {qMeta ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${qMeta.badgeClass}`}
                          >
                            {qMeta.labelBn}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-600">
                        {log.remarks || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
