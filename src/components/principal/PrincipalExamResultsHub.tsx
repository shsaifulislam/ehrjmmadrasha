"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  RefreshCw,
  Send,
  Lock,
  Globe,
  RotateCcw,
  Sparkles,
  Users,
  Search,
  Check,
  FileText,
  ChevronDown,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function PrincipalExamResultsHub() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filter state
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");

  // Data state
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectTracking, setSubjectTracking] = useState<any[]>([]);
  const [tabulation, setTabulation] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);

  // Search filter inside table
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async (eId?: string, cId?: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const targetExamId = eId !== undefined ? eId : selectedExamId;
    const targetClassId = cId !== undefined ? cId : selectedClassId;

    try {
      const params = new URLSearchParams();
      if (targetExamId) params.set("examId", targetExamId);
      if (targetClassId) params.set("classId", targetClassId);

      const res = await fetch(`/api/principal/academics/exams?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "পরীক্ষার তথ্য লোড করতে সমস্যা হয়েছে।");
      }

      setExams(data.data.exams || []);
      setClasses(data.data.classes || []);
      setSelectedExam(data.data.selectedExam);
      setSelectedClass(data.data.selectedClass);
      setSubjects(data.data.subjects || []);
      setSubjectTracking(data.data.subjectTracking || []);
      setTabulation(data.data.tabulation || []);
      setStats(data.data.stats || null);

      if (data.data.selectedExam?.id && data.data.selectedExam.id !== selectedExamId) {
        setSelectedExamId(data.data.selectedExam.id);
      }
      if (data.data.selectedClass?.id && data.data.selectedClass.id !== selectedClassId) {
        setSelectedClassId(data.data.selectedClass.id);
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগ ত্রুটি");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExamChange = (eId: string) => {
    setSelectedExamId(eId);
    loadData(eId, selectedClassId);
  };

  const handleClassChange = (cId: string) => {
    setSelectedClassId(cId);
    loadData(selectedExamId, cId);
  };

  // Publish / Approve Results
  const handlePublish = async () => {
    if (!selectedExamId || !selectedClassId) return;

    const confirmMsg =
      `আপনি কি নিশ্চিত যে "${selectedClass?.nameBn}"-এর "${selectedExam?.nameBn}" পরীক্ষার ফলাফল আনুষ্ঠানিকভাবে অনুমোদন ও সর্বজনীন প্রকাশ করতে চান?\n\nফলাফল প্রকাশের সাথে সাথে সকল অভিভাবকের পোর্টালে নম্বরপত্র দৃশ্যমান হবে এবং নোটিফিকেশন প্রেরিত হবে।`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/principal/academics/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_AND_PUBLISH_RESULTS",
          examId: selectedExamId,
          classId: selectedClassId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ফলাফল প্রকাশে ব্যর্থ হয়েছে।");
      }

      setMessage({ text: data.message, type: "success" });
      await loadData(selectedExamId, selectedClassId);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Unpublish / Retract Results
  const handleUnpublish = async () => {
    if (!selectedExamId || !selectedClassId) return;

    if (!window.confirm(`আপনি কি "${selectedClass?.nameBn}"-এর প্রকাশিত ফলাফল সাময়িকভাবে প্রত্যাহার করে খসড়া মোডে নিতে চান?`)) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/principal/academics/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UNPUBLISH_RESULTS",
          examId: selectedExamId,
          classId: selectedClassId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ফলাফল প্রত্যাহার ব্যর্থ হয়েছে।");
      }

      setMessage({ text: data.message, type: "success" });
      await loadData(selectedExamId, selectedClassId);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter students by name or roll
  const filteredTabulation = tabulation.filter((st) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      st.fullNameBn?.toLowerCase().includes(q) ||
      st.studentIdNumber?.toLowerCase().includes(q) ||
      String(st.rollNumber).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#083B25] via-[#0D5C3A] to-[#042115] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-pattern opacity-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-[#C59B27] text-[#083B25] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                মুহতামিম তা'লীমী অনুষদ
              </span>
              <span className="text-[10px] font-bold text-emerald-200 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-600/30">
                স্থাপিত: ২০২১ ইং
              </span>
              {stats?.isClassPublished ? (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/90 px-2.5 py-0.5 rounded-full border border-emerald-500/50 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  ফলাফল সর্বজনীন প্রকাশিত
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/90 px-2.5 py-0.5 rounded-full border border-amber-500/50 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  খসড়া ও মুহতামিমের পর্যালোচনাধীন
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white flex items-center gap-2.5">
              <Award className="w-6 h-6 text-[#C59B27]" />
              পরীক্ষা নিয়ন্ত্রণ, মেধা তালিকা ও ফলাফল প্রকাশ
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl mt-1 leading-relaxed">
              উস্তাদদের দাখিলকৃত বিষয়ভিত্তিক নম্বর নিরীক্ষা, স্বয়ংক্রিয় গড় গ্রেডিং, মেধাক্রম (Rank) নির্ধারণ এবং এক ক্লিকে অভিভাবক ও পাবলিক পোর্টালে ফলাফল অনুমোদন।
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-400/40 bg-emerald-900/60 text-emerald-100 hover:bg-emerald-800 text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-4 h-4 text-[#C59B27]" />
              ফলাফল সারণী প্রিন্ট
            </button>
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C59B27] hover:bg-[#b0881f] text-[#083B25] text-xs font-black transition shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              রিফ্রেশ
            </button>
          </div>
        </div>

        {/* Filters Bar Inside Banner */}
        <div className="mt-6 pt-5 border-t border-emerald-800/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10 text-xs">
          <div>
            <label className="text-[11px] font-bold text-emerald-200 block mb-1">
              পরীক্ষা নির্বাচন করুন:
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full bg-[#042115] border border-emerald-700/60 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-[#C59B27] focus:outline-none"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.nameBn} ({ex.session?.name || "সেশন"}) {ex.isPublished ? "• [প্রকাশিত]" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-emerald-200 block mb-1">
              জামাত / শ্রেণি নির্বাচন করুন:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full bg-[#042115] border border-emerald-700/60 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-[#C59B27] focus:outline-none"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nameBn} ({cls.code})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-1 flex items-end">
            <div className="w-full bg-emerald-950/80 p-2 rounded-xl border border-emerald-800/80 flex items-center justify-between text-[11px]">
              <span className="text-emerald-300">বর্তমান শিক্ষাবর্ষ:</span>
              <span className="font-bold text-[#C59B27] font-mono">
                {selectedExam?.session?.name || "২০২৬"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-gray-400 hover:text-gray-600 text-xs px-2 py-0.5"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-900 border border-red-200 flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Key Performance Metrics (KPI Cards) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-sm">
            <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">মোট পরীক্ষার্থী</div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1 font-mono">
              {stats.totalStudents} <span className="text-xs font-normal text-gray-400">জন</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-sm">
            <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">উত্তীর্ণ ছাত্র</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1 font-mono">
              {stats.passedStudents} <span className="text-xs font-normal text-emerald-600">জন</span>
            </div>
          </div>

          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-sm">
            <div className="text-[11px] text-blue-800 font-bold uppercase tracking-wider">পাসের হার</div>
            <div className="text-xl sm:text-2xl font-black text-blue-900 mt-1 font-mono">
              {stats.passRate}%
            </div>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-sm">
            <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">মুমতাজ (A+)</div>
            <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1 font-mono">
              {stats.mumtazCount} <span className="text-xs font-normal text-amber-600">জন</span>
            </div>
          </div>

          <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 shadow-sm">
            <div className="text-[11px] text-purple-800 font-bold uppercase tracking-wider">জায়্যিদ জিদ্দান (A)</div>
            <div className="text-xl sm:text-2xl font-black text-purple-900 mt-1 font-mono">
              {stats.jayyidJiddanCount} <span className="text-xs font-normal text-purple-600">জন</span>
            </div>
          </div>

          <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 shadow-sm">
            <div className="text-[11px] text-red-800 font-bold uppercase tracking-wider">রাসিব (F/ফেল)</div>
            <div className="text-xl sm:text-2xl font-black text-red-900 mt-1 font-mono">
              {stats.failedStudents} <span className="text-xs font-normal text-red-600">জন</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Teacher Marks Submission Tracker */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#0D5C3A]" />
              উস্তাদদের বিষয়ভিত্তিক নম্বর দাখিল ট্র্যাকার (Marks Submission Status)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              মুহতামিম মহোদয় দেখতে পাচ্ছেন কোন কোন বিষয়ের নম্বর উস্তাদগণ ফাইনাল সাবমিট করেছেন।
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
            সর্বমোট বিষয়: {subjectTracking.length} টি
          </span>
        </div>

        {subjectTracking.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            এই জামাতের জন্য কোনো বিষয় নির্ধারিত পাওয়া যায়নি।
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {subjectTracking.map((sub) => (
              <div
                key={sub.id}
                className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2 ${
                  sub.isComplete
                    ? "bg-emerald-50/40 border-emerald-200"
                    : sub.submittedCount > 0
                    ? "bg-blue-50/40 border-blue-200"
                    : "bg-amber-50/40 border-amber-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 truncate">{sub.nameBn}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sub.isComplete
                        ? "bg-emerald-100 text-emerald-800"
                        : sub.submittedCount > 0
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {sub.isComplete
                      ? "দাখিল সম্পন্ন"
                      : sub.submittedCount > 0
                      ? "আংশিক দাখিল"
                      : "অপেক্ষমাণ"}
                  </span>
                </div>

                <div className="text-[11px] text-gray-600 flex items-center justify-between font-mono">
                  <span>পূর্ণমান: {sub.fullMarks}</span>
                  <span>পাস মার্ক: {sub.passMarks}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100">
                  <span className="text-gray-500">দাখিলকৃত ছাত্র:</span>
                  <span className="font-bold font-mono text-gray-900">
                    {sub.submittedCount} / {sub.totalEnrolled}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Tabulation Sheet & Merit List Action Bar */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#C59B27]" />
              {selectedClass?.nameBn || "জামাত"} — ফলাফল সারণী ও মেধা তালিকা (Tabulation Sheet)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              সকল বিষয়ের সমন্বিত নম্বর, কওমি মান (মুমতাজ/জায়্যিদ জিদ্দান), শতকরা হার ও ক্লাসে মেধাক্রম (Rank)।
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {stats?.isClassPublished ? (
              <button
                onClick={handleUnpublish}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                ফলাফল প্রত্যাহার (খসড়া মোড)
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={actionLoading || tabulation.length === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0D5C3A] to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white text-xs font-black transition shadow-md disabled:opacity-50"
              >
                <Globe className="w-4 h-4 text-[#C59B27]" />
                মুহতামিমের অনুমোদন ও সর্বজনীন প্রকাশ করুন
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              প্রিন্ট ট্যাবুলেশন শিট
            </button>
          </div>
        </div>

        {/* Search input inside table */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="শিক্ষার্থীর নাম, আইডি বা রোল দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
          </div>
          <span className="text-xs text-gray-500">
            প্রদর্শিত: <strong>{filteredTabulation.length}</strong> / {tabulation.length} জন
          </span>
        </div>

        {/* Tabulation Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#F8FAFC] border-b-2 border-gray-200 text-gray-700 font-bold">
              <tr>
                <th className="p-3 text-center w-12">মেধাক্রম</th>
                <th className="p-3 text-center w-12">রোল</th>
                <th className="p-3 min-w-[160px]">শিক্ষার্থী ও ছাত্র আইডি</th>
                {subjects.map((sub) => (
                  <th key={sub.id} className="p-3 text-center min-w-[90px] border-l border-gray-200">
                    <div className="truncate">{sub.nameBn}</div>
                    <div className="text-[10px] text-gray-400 font-mono font-normal">
                      ({examSubjectsMap(sub.id)?.fullMarks || sub.fullMarks})
                    </div>
                  </th>
                ))}
                <th className="p-3 text-center min-w-[90px] border-l border-gray-200">মোট প্রাপ্ত</th>
                <th className="p-3 text-center min-w-[70px]">শতকরা</th>
                <th className="p-3 text-center min-w-[120px]">কওমি গ্রেড</th>
                <th className="p-3 text-center min-w-[80px]">ফলাফল</th>
                <th className="p-3 text-center min-w-[110px]">ভেরিফিকেশন কোড</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredTabulation.length === 0 ? (
                <tr>
                  <td colSpan={subjects.length + 8} className="p-8 text-center text-gray-400 text-xs">
                    কোনো শিক্ষার্থীর ফলাফল বা তালিকা পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredTabulation.map((st) => (
                  <tr key={st.studentId} className="hover:bg-amber-50/20 transition-colors">
                    <td className="p-3 text-center font-bold">
                      {st.meritRank ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                          st.meritRank === 1
                            ? "bg-amber-400 text-amber-950 shadow-sm"
                            : st.meritRank === 2
                            ? "bg-slate-300 text-slate-900"
                            : st.meritRank === 3
                            ? "bg-amber-200 text-amber-900"
                            : "bg-gray-100 text-gray-700 font-mono"
                        }`}>
                          {st.meritRank}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>

                    <td className="p-3 text-center font-bold font-mono text-gray-900">
                      {st.rollNumber}
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span>{st.fullNameBn}</span>
                        {st.isOrphan && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                            এতিম
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {st.studentIdNumber}
                      </div>
                    </td>

                    {/* Subject Marks */}
                    {st.subjects?.map((sub: any, sIdx: number) => (
                      <td key={sIdx} className="p-3 text-center border-l border-gray-100 font-mono">
                        {sub.isAbsent ? (
                          <span className="text-red-500 font-bold text-[11px]">অনুপস্থিত</span>
                        ) : sub.isExempt ? (
                          <span className="text-gray-400 text-[11px]">অব্যাহতি</span>
                        ) : sub.marksObtained !== null ? (
                          <div>
                            <span className={`font-bold ${sub.isPassed ? "text-gray-900" : "text-red-600 font-black"}`}>
                              {sub.marksObtained}
                            </span>
                            <span className="block text-[10px] text-gray-400">
                              {sub.letterGrade}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    ))}

                    {/* Total Obtained */}
                    <td className="p-3 text-center font-black font-mono border-l border-gray-100 text-emerald-800 text-sm">
                      {st.totalObtained}
                      <span className="block text-[10px] text-gray-400 font-normal">
                        / {st.totalFullMarks}
                      </span>
                    </td>

                    {/* Percentage */}
                    <td className="p-3 text-center font-bold font-mono text-gray-900">
                      {st.percentage}%
                    </td>

                    {/* Final Qawmi Grade */}
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        st.letterGrade === "A+"
                          ? "bg-amber-100 text-amber-900"
                          : st.letterGrade === "A"
                          ? "bg-emerald-100 text-emerald-900"
                          : st.letterGrade === "B"
                          ? "bg-blue-100 text-blue-900"
                          : st.letterGrade === "C"
                          ? "bg-purple-100 text-purple-900"
                          : "bg-red-100 text-red-900"
                      }`}>
                        {st.finalGradeBn}
                      </span>
                    </td>

                    {/* Pass / Fail */}
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        st.isPassed ? "text-emerald-700" : "text-red-600"
                      }`}>
                        {st.isPassed ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            উত্তীর্ণ
                          </>
                        ) : (
                          "অকৃতকার্য"
                        )}
                      </span>
                    </td>

                    {/* Verification Code */}
                    <td className="p-3 text-center font-mono text-[10px]">
                      {st.savedResult?.verificationCode ? (
                        <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded border font-semibold">
                          {st.savedResult.verificationCode}
                        </span>
                      ) : (
                        <span className="text-gray-400">অপ্রকাশিত</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Print Official Certificate Styles */}
      <div className="hidden print:block p-8 bg-white text-black space-y-6">
        <div className="text-center pb-4 border-b-2 border-black space-y-1">
          <div className="text-sm font-arabic font-bold">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <h1 className="text-2xl font-black">{INSTITUTION_INFO.nameBn}</h1>
          <p className="text-xs">{INSTITUTION_INFO.addressBn} • স্থাপিত: ২০২১ ইং</p>
          <div className="text-sm font-bold mt-2">
            অফিসিয়াল পরীক্ষা সারণী ও মেধা তালিকা (Tabulation Register)
          </div>
          <div className="text-xs text-gray-700">
            পরীক্ষা: {selectedExam?.nameBn} • জামাত: {selectedClass?.nameBn} • শিক্ষাবর্ষ: {selectedExam?.session?.name || "২০২৬"}
          </div>
        </div>

        <div className="pt-12 grid grid-cols-3 text-center text-xs font-bold">
          <div>
            <div className="border-t border-black pt-1 w-32 mx-auto">পরীক্ষা নিয়ন্ত্রক</div>
          </div>
          <div>
            <div className="border-t border-black pt-1 w-32 mx-auto">নাযেমে দারুল ইক্বামাহ</div>
          </div>
          <div>
            <div className="border-t border-black pt-1 w-40 mx-auto">
              মুহতামিম / প্রধান অভিভাবক
              <div className="text-[10px] text-gray-600 font-normal">ডিজিটাল অনুমোদন ও সিলমোহরযুক্ত</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function examSubjectsMap(subId: string) {
    return subjectTracking.find((s) => s.id === subId);
  }
}
