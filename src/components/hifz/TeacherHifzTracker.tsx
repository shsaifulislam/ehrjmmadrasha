"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  AlertCircle,
  Bookmark,
  Edit,
  Save,
  X,
  User,
  ChevronRight,
  TrendingUp,
  Flame,
  Check,
} from "lucide-react";
import HifzQuranProgressGrid from "./HifzQuranProgressGrid";
import { QURAN_PARAS, HIFZ_QUALITY_OPTIONS, HifzQualityOption } from "@/lib/hifz/hifzConstants";

export default function TeacherHifzTracker() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMilestone, setFilterMilestone] = useState<string>("ALL");

  // Active student modal for daily entry
  const [activeEntryStudent, setActiveEntryStudent] = useState<any | null>(null);
  const [activeViewGridStudent, setActiveViewGridStudent] = useState<any | null>(null);

  // Entry Form State
  const [formData, setFormData] = useState<{
    attendance: "PRESENT" | "ABSENT" | "EXCUSED";
    sabaqPara: number;
    sabaqSurah: string;
    sabaqAyah: string;
    sabaqPages: string;
    sabaqQuality: "MUMTAZ" | "JAYYID_JIDDAN" | "JAYYID" | "MAQBOOL" | "DOHRANO";
    sabqiPara: number;
    sabqiPages: string;
    sabqiQuality: "MUMTAZ" | "JAYYID_JIDDAN" | "JAYYID" | "MAQBOOL" | "DOHRANO";
    manzilRange: string;
    manzilPortion: string;
    manzilQuality: "MUMTAZ" | "JAYYID_JIDDAN" | "JAYYID" | "MAQBOOL" | "DOHRANO";
    totalParasCompleted: number;
    currentSabaqPara: number;
    remarks: string;
  }>({
    attendance: "PRESENT",
    sabaqPara: 1,
    sabaqSurah: "সূরা আল-বাক্বারাহ",
    sabaqAyah: "আয়াত ১-২৫",
    sabaqPages: "পৃষ্ঠা ২",
    sabaqQuality: "MUMTAZ",
    sabqiPara: 1,
    sabqiPages: "পৃষ্ঠা ১-৫",
    sabqiQuality: "MUMTAZ",
    manzilRange: "পারা ১",
    manzilPortion: "১ম রুবু'",
    manzilQuality: "MUMTAZ",
    totalParasCompleted: 0,
    currentSabaqPara: 1,
    remarks: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data for date
  const loadData = async (dateStr?: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const targetDate = dateStr || selectedDate;
      const res = await fetch(`/api/hifz/tracker?date=${targetDate}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "হিফজ তথ্য লোড করতে ব্যর্থ হয়েছে।");
      }

      setStudents(json.data.students || []);
      setLogs(json.data.logs || []);
      setStats(json.data.stats || null);
    } catch (err: any) {
      setError(err.message || "সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  // Open entry modal
  const handleOpenEntryModal = (student: any) => {
    const existingLog = logs.find((l) => l.studentId === student.studentId);

    setFormData({
      attendance: existingLog?.attendance || "PRESENT",
      sabaqPara: existingLog?.sabaq?.para || student.currentSabaqPara || 1,
      sabaqSurah: existingLog?.sabaq?.surahName || student.currentSurahName || "সূরা আল-বাক্বারাহ",
      sabaqAyah: existingLog?.sabaq?.ayahRange || "আয়াত ১-২৫",
      sabaqPages: existingLog?.sabaq?.pages || "পৃষ্ঠা ২",
      sabaqQuality: existingLog?.sabaq?.quality || "MUMTAZ",
      sabqiPara: existingLog?.sabqi?.para || student.currentSabaqPara || 1,
      sabqiPages: existingLog?.sabqi?.pages || "পৃষ্ঠা ১-৫",
      sabqiQuality: existingLog?.sabqi?.quality || "MUMTAZ",
      manzilRange: existingLog?.manzil?.paraRange || (student.completedParasList?.length > 0 ? `পারা ${student.completedParasList[0]}` : "পারা ১"),
      manzilPortion: existingLog?.manzil?.portion || "১ম রুবু' / কোয়ার্টার",
      manzilQuality: existingLog?.manzil?.quality || "MUMTAZ",
      totalParasCompleted: existingLog?.totalParasCompleted !== undefined ? existingLog.totalParasCompleted : student.totalParasCompleted,
      currentSabaqPara: existingLog?.currentSabaqPara || student.currentSabaqPara || 1,
      remarks: existingLog?.remarks || "",
    });

    setActiveEntryStudent(student);
  };

  // Submit daily entry
  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntryStudent) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        studentId: activeEntryStudent.studentId,
        date: selectedDate,
        attendance: formData.attendance,
        sabaq: {
          para: Number(formData.sabaqPara),
          surahName: formData.sabaqSurah,
          ayahRange: formData.sabaqAyah,
          pages: formData.sabaqPages,
          quality: formData.sabaqQuality,
        },
        sabqi: {
          para: Number(formData.sabqiPara),
          pages: formData.sabqiPages,
          quality: formData.sabqiQuality,
        },
        manzil: {
          paraRange: formData.manzilRange,
          portion: formData.manzilPortion,
          quality: formData.manzilQuality,
        },
        totalParasCompleted: Number(formData.totalParasCompleted),
        currentSabaqPara: Number(formData.currentSabaqPara),
        remarks: formData.remarks || null,
      };

      const res = await fetch("/api/hifz/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "সংরক্ষণ করতে সমস্যা হয়েছে।");
      }

      setSuccessMsg(json.message);
      setActiveEntryStudent(null);
      await loadData(selectedDate);
    } catch (err: any) {
      setError(err.message || "ত্রুটি হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      st.studentNameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(st.rollNumber).includes(searchQuery) ||
      st.studentIdNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMilestone === "HAFEZ") return st.totalParasCompleted >= 30;
    if (filterMilestone === "ADVANCED") return st.totalParasCompleted >= 16 && st.totalParasCompleted < 30;
    if (filterMilestone === "INTERMEDIATE") return st.totalParasCompleted >= 6 && st.totalParasCompleted < 16;
    if (filterMilestone === "BEGINNER") return st.totalParasCompleted < 6;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Date Selector */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">
              তাহফীজুল কুরআন বিভাগ (EHRJ Tahfeez Core)
            </span>
            <span className="text-[10px] font-semibold text-gray-400">ESTD ২০২১ ইং</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 mt-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0D5C3A]" />
            দৈনিক হিফজ ডায়েরি ও সবক-আমোক্তা ট্র্যাকার
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            হিফজ ছাত্রদের দৈনিক সবক, সবকী ও আমোক্তা মূল্যায়ন করুন এবং অভিভাবককে স্বয়ংক্রিয় অগ্রগতি রিপোর্ট পাঠান।
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-emerald-50/60 p-2 rounded-2xl border border-emerald-200 self-start md:self-auto">
          <Calendar className="w-4 h-4 text-emerald-800" />
          <span className="text-xs font-bold text-emerald-950">তারিখ:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-bold text-gray-800 bg-white border border-emerald-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
          />
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* 2. KPI Summary Metrics */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-gray-500">মোট হিফজ শিক্ষার্থী</div>
            <div className="text-2xl font-black text-gray-900 font-mono mt-1">
              {stats.totalStudents} <span className="text-xs font-normal text-gray-400">জন</span>
            </div>
            <div className="text-[10px] text-emerald-700 font-medium mt-1">
              আজকে মূল্যায়িত: {stats.activeTodayCount} জন
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-gray-500">খতমে কুরআন (হাফেয)</div>
            <div className="text-2xl font-black text-amber-600 font-mono mt-1 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-amber-500" />
              {stats.totalHuffaz} <span className="text-xs font-normal text-gray-400">জন</span>
            </div>
            <div className="text-[10px] text-amber-800 font-medium mt-1">
              দস্তারবন্দী যোগ্য / সমাপনী
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-gray-500">গড় কুরআন মুখস্থ হার</div>
            <div className="text-2xl font-black text-[#0D5C3A] font-mono mt-1">
              {stats.averageProgressPercentage}%
            </div>
            <div className="text-[10px] text-gray-500 font-medium mt-1">
              সমগ্র হিফজ বিভাগের সার্বিক গড়
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-gray-500">অগ্রগতি স্তরবিন্যাস</div>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                উন্নত: {stats.distribution.advanced}
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                মধ্যম: {stats.distribution.intermediate}
              </span>
              <span className="px-2 py-0.5 bg-stone-100 text-stone-800 rounded">
                প্রাথমিক: {stats.distribution.beginner}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="রোল, নাম বা আইডি দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto text-xs">
          <button
            onClick={() => setFilterMilestone("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterMilestone === "ALL"
                ? "bg-[#0D5C3A] text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            সকল ছাত্র ({students.length})
          </button>
          <button
            onClick={() => setFilterMilestone("HAFEZ")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterMilestone === "HAFEZ"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            হাফেয (৩০ পারা)
          </button>
          <button
            onClick={() => setFilterMilestone("ADVANCED")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterMilestone === "ADVANCED"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ১৬-২৯ পারা
          </button>
          <button
            onClick={() => setFilterMilestone("INTERMEDIATE")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterMilestone === "INTERMEDIATE"
                ? "bg-blue-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ৬-১৫ পারা
          </button>
          <button
            onClick={() => setFilterMilestone("BEGINNER")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterMilestone === "BEGINNER"
                ? "bg-stone-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ১-৫ পারা
          </button>
        </div>
      </div>

      {/* 4. Student Roster Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#0D5C3A]" />
            হিফজুল কুরআন রেজিস্টার ও দৈনিক লেজার (তারিখ: {selectedDate})
          </h3>
          <span className="text-xs font-bold text-gray-500">
            শিক্ষার্থী সংখ্যা: {filteredStudents.length} জন
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-gray-200 text-gray-700 font-bold">
                <th className="p-3 text-center w-12">রোল</th>
                <th className="p-3 min-w-[160px]">শিক্ষার্থীর নাম ও আইডি</th>
                <th className="p-3 text-center min-w-[120px]">হিফজ অগ্রগতি</th>
                <th className="p-3 min-w-[160px]">আজকের সবক (Sabaq)</th>
                <th className="p-3 min-w-[120px]">সবকী (Sabqi)</th>
                <th className="p-3 min-w-[120px]">আমোক্তা (Manzil)</th>
                <th className="p-3 text-center min-w-[90px]">আজকের মান</th>
                <th className="p-3 text-center min-w-[140px]">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 text-xs">
                    কোনো হিফজ শিক্ষার্থী পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const log = logs.find((l) => l.studentId === st.studentId);
                  const isDoneToday = Boolean(log);
                  const qualityMeta = log?.sabaq?.quality
                    ? HIFZ_QUALITY_OPTIONS[log.sabaq.quality]
                    : null;

                  return (
                    <tr
                      key={st.studentId}
                      className="hover:bg-emerald-50/20 transition-colors"
                    >
                      {/* Roll */}
                      <td className="p-3 text-center font-bold font-mono text-gray-900">
                        {st.rollNumber}
                      </td>

                      {/* Name & ID */}
                      <td className="p-3">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{st.studentNameBn}</span>
                          {st.isHafez && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-black border border-amber-300">
                              হাফেয
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {st.studentIdNumber}
                        </div>
                      </td>

                      {/* Memorization Progress */}
                      <td className="p-3 text-center">
                        <div className="font-black text-[#0D5C3A] font-mono text-xs">
                          {st.totalParasCompleted} / ৩০ পারা
                        </div>
                        <div className="w-24 bg-gray-100 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                          <div
                            className="bg-[#0D5C3A] h-full rounded-full"
                            style={{
                              width: `${(st.totalParasCompleted / 30) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="text-[9px] text-gray-400 mt-0.5">
                          চলতি: পারা {st.currentSabaqPara}
                        </div>
                      </td>

                      {/* Sabaq */}
                      <td className="p-3">
                        {log?.sabaq ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-gray-800 block">
                              {log.sabaq.surahName}
                            </span>
                            <span className="text-[10px] text-gray-500 block">
                              {log.sabaq.ayahRange} ({log.sabaq.pages})
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic text-[11px]">এন্ট্রি হয়নি</span>
                        )}
                      </td>

                      {/* Sabqi */}
                      <td className="p-3">
                        {log?.sabqi ? (
                          <div className="text-[11px]">
                            <span className="font-semibold text-gray-800">
                              পারা {log.sabqi.para}
                            </span>
                            <span className="text-[10px] text-gray-500 block">
                              {log.sabqi.pages}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Manzil */}
                      <td className="p-3">
                        {log?.manzil ? (
                          <div className="text-[11px]">
                            <span className="font-semibold text-gray-800">
                              {log.manzil.paraRange}
                            </span>
                            <span className="text-[10px] text-gray-500 block">
                              {log.manzil.portion}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Quality Grade */}
                      <td className="p-3 text-center">
                        {qualityMeta ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${qualityMeta.badgeClass}`}
                          >
                            {qualityMeta.labelBn}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[10px]">অমূল্যায়িত</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEntryModal(st)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-800 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-900 transition shadow-sm"
                          >
                            <Edit className="w-3 h-3" />
                            {isDoneToday ? "সম্পাদনা" : "সবক এন্ট্রি"}
                          </button>

                          <button
                            onClick={() => setActiveViewGridStudent(st)}
                            className="px-2 py-1 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-[10px] font-bold transition border border-stone-300"
                            title="৩০ পারা চার্ট দেখুন"
                          >
                            চার্ট
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Visual Grid Modal for Individual Student */}
      {activeViewGridStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {activeViewGridStudent.studentNameBn}-এর হিফজুল কুরআন পূর্ণাঙ্গ চার্ট
                </h3>
                <p className="text-xs text-gray-500">
                  রোল: {activeViewGridStudent.rollNumber} | আইডি: {activeViewGridStudent.studentIdNumber}
                </p>
              </div>
              <button
                onClick={() => setActiveViewGridStudent(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <HifzQuranProgressGrid
              completedParas={activeViewGridStudent.completedParasList || []}
              currentPara={activeViewGridStudent.currentSabaqPara}
              studentName={activeViewGridStudent.studentNameBn}
              readOnly={true}
            />

            <div className="text-right pt-2">
              <button
                onClick={() => setActiveViewGridStudent(null)}
                className="px-5 py-2 bg-gray-200 text-gray-800 font-bold rounded-xl text-xs hover:bg-gray-300 transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Daily Sabaq Entry Modal */}
      {activeEntryStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                  দৈনিক মূল্যায়ন লেজার
                </span>
                <h3 className="text-base font-black text-gray-900 mt-1">
                  {activeEntryStudent.studentNameBn} (রোল: {activeEntryStudent.rollNumber})
                </h3>
                <p className="text-xs text-gray-500">
                  তারিখ: {selectedDate} | আইডি: {activeEntryStudent.studentIdNumber}
                </p>
              </div>
              <button
                onClick={() => setActiveEntryStudent(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEntry} className="space-y-4">
              {/* Attendance */}
              <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border">
                <span className="text-xs font-bold text-gray-700">উপস্থিতি:</span>
                {(["PRESENT", "ABSENT", "EXCUSED"] as const).map((att) => (
                  <label key={att} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="attendance"
                      value={att}
                      checked={formData.attendance === att}
                      onChange={() => setFormData({ ...formData, attendance: att })}
                      className="text-[#0D5C3A] focus:ring-[#0D5C3A]"
                    />
                    {att === "PRESENT" ? "উপস্থিত" : att === "ABSENT" ? "অনুপস্থিত" : "ছুটি"}
                  </label>
                ))}
              </div>

              {/* 1. Sabaq (সবক - নতুন পড়া) */}
              <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-emerald-800" />
                  ১. নতুন সবক (Sabaq - New Lesson)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">পারা নম্বর</label>
                    <select
                      value={formData.sabaqPara}
                      onChange={(e) => setFormData({ ...formData, sabaqPara: Number(e.target.value) })}
                      className="w-full text-xs border rounded-xl p-2 bg-white focus:ring-[#0D5C3A]"
                    >
                      {QURAN_PARAS.map((p) => (
                        <option key={p.number} value={p.number}>
                          পারা {p.number} ({p.nameBn})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">সূরা ও আয়াত</label>
                    <input
                      type="text"
                      placeholder="যেমন: সূরা আল-বাক্বারাহ, আয়াত ১-২৫"
                      value={formData.sabaqSurah}
                      onChange={(e) => setFormData({ ...formData, sabaqSurah: e.target.value })}
                      className="w-full text-xs border rounded-xl p-2 bg-white focus:ring-[#0D5C3A]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">পৃষ্ঠা / পরিধি</label>
                    <input
                      type="text"
                      placeholder="যেমন: পৃষ্ঠা ২ / ১ পৃষ্ঠা"
                      value={formData.sabaqPages}
                      onChange={(e) => setFormData({ ...formData, sabaqPages: e.target.value })}
                      className="w-full text-xs border rounded-xl p-2 bg-white focus:ring-[#0D5C3A]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">সবকের মান (Quality)</label>
                    <select
                      value={formData.sabaqQuality}
                      onChange={(e: any) => setFormData({ ...formData, sabaqQuality: e.target.value })}
                      className="w-full text-xs border rounded-xl p-2 bg-white font-bold text-gray-800 focus:ring-[#0D5C3A]"
                    >
                      {Object.values(HIFZ_QUALITY_OPTIONS).map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.labelBn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Sabqi (সাত সবক / সবকী) */}
              <div className="bg-blue-50/40 border border-blue-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-800" />
                  ২. সবকী (Sabqi - Recent Revision)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">চলতি পারা ও পৃষ্ঠা</label>
                    <input
                      type="text"
                      placeholder="যেমন: পারা ৩, পৃষ্ঠা ১-৫"
                      value={formData.sabqiPages}
                      onChange={(e) => setFormData({ ...formData, sabqiPages: e.target.value })}
                      className="w-full text-xs border rounded-xl p-2 bg-white focus:ring-[#0D5C3A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">সবকীর মান</label>
                    <select
                      value={formData.sabqiQuality}
                      onChange={(e: any) => setFormData({ ...formData, sabqiQuality: e.target.value })}
                      className="w-full text-xs border rounded-xl p-2 bg-white font-bold text-gray-800 focus:ring-[#0D5C3A]"
                    >
                      {Object.values(HIFZ_QUALITY_OPTIONS).map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.labelBn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Manzil (আমোক্তা / মনজিল) */}
              <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-800" />
                  ৩. আমোক্তা / মনজিল (Amokhta - Cumulative Revision)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">পারা রেঞ্জ ও পরিধি</label>
                    <input
                      type="text"
                      placeholder="যেমন: পারা ১-২ / সম্পূর্ণ পারা"
                      value={formData.manzilRange}
                      onChange={(e) => setFormData({ ...formData, manzilRange: e.target.value })}
                      className="w-full text-xs border rounded-xl p-2 bg-white focus:ring-[#0D5C3A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">আমোক্তার মান</label>
                    <select
                      value={formData.manzilQuality}
                      onChange={(e: any) => setFormData({ ...formData, manzilQuality: e.target.value })}
                      className="w-full text-xs border rounded-xl p-2 bg-white font-bold text-gray-800 focus:ring-[#0D5C3A]"
                    >
                      {Object.values(HIFZ_QUALITY_OPTIONS).map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.labelBn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Total Paras Completed Milestone */}
              <div className="bg-stone-50 border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    মোট মুখস্থ পারা সংখ্যা (Milestone Update)
                  </span>
                  <span className="text-[10px] text-gray-500">
                    ৩০ পারার মধ্যে এ পর্যন্ত কত পারা ইয়াদ হয়েছে।
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={formData.totalParasCompleted}
                    onChange={(e) => setFormData({ ...formData, totalParasCompleted: Number(e.target.value) })}
                    className="w-20 text-center font-bold font-mono text-sm border-2 border-emerald-600 rounded-xl p-1.5 bg-white"
                  />
                  <span className="text-xs font-bold text-gray-600">/ ৩০ পারা</span>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  উস্তাদের বিশেষ মন্তব্য বা দোয়া (Remarks)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মাশাআল্লাহ, তিলাওয়াত সুন্দর হয়েছে / হরফের মাখরাজ ঠিক করতে হবে"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full text-xs border rounded-xl p-2.5 bg-white focus:ring-[#0D5C3A]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveEntryStudent(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-6 py-2 bg-[#0D5C3A] text-white font-bold rounded-xl text-xs hover:bg-emerald-900 transition shadow-md disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ ও অভিভাবককে নোটিফিকেশন পাঠান"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
