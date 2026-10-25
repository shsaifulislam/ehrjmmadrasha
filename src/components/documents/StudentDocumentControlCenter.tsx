"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  UserCheck,
  Award,
  CreditCard,
  FileCheck,
  Building,
  ExternalLink,
  DollarSign,
  Printer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Sparkles,
  Layers,
  FileText,
  AlertOctagon,
  Clock,
  ShieldCheck,
  Phone,
  Home,
  BookOpen,
  QrCode,
  GraduationCap,
  Calendar,
  Check,
  X,
  FileSpreadsheet,
  Download,
  Info
} from "lucide-react";
import { UniversalDocumentRenderer } from "./templates/DocumentCanvases";
import { DOCUMENT_CATEGORIES } from "@/lib/documentFactory";

interface Props {
  onViewDoc?: (doc: any) => void;
  onOpenReissue?: (doc: any) => void;
  onOpenRevoke?: (doc: any) => void;
}

export default function StudentDocumentControlCenter({
  onViewDoc,
  onOpenReissue,
  onOpenRevoke,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recommendedStudents, setRecommendedStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overview, setOverview] = useState<any | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Quick generation loading
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingDocCode, setGeneratingDocCode] = useState<string | null>(null);

  // Modal preview
  const [activePreviewDoc, setActivePreviewDoc] = useState<any | null>(null);
  const [previewLayoutMode, setPreviewLayoutMode] = useState<"A4" | "ID_CARD" | "THERMAL_80MM">("A4");

  // Load recommended/recent students on mount
  useEffect(() => {
    async function loadRecommended() {
      try {
        const res = await fetch("/api/admin/documents/search-student?limit=6");
        const data = await res.json();
        if (res.ok && data.students) {
          setRecommendedStudents(data.students);
        }
      } catch (err) {
        console.error("Failed to load recommended students", err);
      }
    }
    loadRecommended();
  }, []);

  // Search autocomplete
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/documents/search-student?q=${encodeURIComponent(q)}&limit=10`);
        const data = await res.json();
        if (res.ok && data.students) {
          setSearchResults(data.students);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Overview when student selected
  useEffect(() => {
    if (!selectedStudentId) {
      setOverview(null);
      return;
    }
    loadStudentOverview(selectedStudentId);
  }, [selectedStudentId]);

  const loadStudentOverview = async (studentId: string) => {
    setLoadingOverview(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/documents/student-center?studentId=${studentId}`);
      const data = await res.json();
      if (res.ok && data.overview) {
        setOverview(data.overview);
      } else {
        setActionMessage({ type: "error", text: data.error || "শিক্ষার্থীর তথ্য লোড করতে ব্যর্থ হয়েছে।" });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "সার্ভার সংযোগে সমস্যা।" });
    } finally {
      setLoadingOverview(false);
    }
  };

  const handleSelectStudent = (student: any) => {
    setSelectedStudentId(student.id);
    setSearchQuery(`${student.studentIdNumber} - ${student.fullNameBn}`);
    setSearchResults([]);
  };

  const handleClearSelectedStudent = () => {
    setSelectedStudentId(null);
    setSearchQuery("");
    setOverview(null);
    setActionMessage(null);
  };

  // Generate a single document directly
  const handleGenerateDirect = async (docType: string) => {
    if (!selectedStudentId) return;
    setGeneratingDocCode(docType);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          documentType: docType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.certificate) {
        setActionMessage({ type: "success", text: `${data.certificate.titleBn || "সনদপত্র"} সফলভাবে প্রস্তুত ও ডাটাবেজে সংরক্ষিত হয়েছে!` });
        await loadStudentOverview(selectedStudentId);
        setActivePreviewDoc(data.certificate);
        setPreviewLayoutMode(docType === "STUDENT_ID" ? "ID_CARD" : "A4");
      } else {
        setActionMessage({ type: "error", text: data.error || "সনদপত্র প্রস্তুত ব্যর্থ হয়েছে।" });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "অনুরোধ সম্পন্ন করা যায়নি।" });
    } finally {
      setGeneratingDocCode(null);
    }
  };

  // Generate All Available Documents
  const handleGenerateAllAvailable = async () => {
    if (!selectedStudentId) return;
    setIsGeneratingAll(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/documents/generate-available", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({
          type: "success",
          text: `সফলভাবে ${data.generated?.length || 0}টি অফিশিয়াল সনদ প্রস্তুত করা হয়েছে। (এড়িয়ে যাওয়া হয়েছে: ${data.skipped?.length || 0}টি)`,
        });
        await loadStudentOverview(selectedStudentId);
      } else {
        setActionMessage({ type: "error", text: data.error || "সনদসমূহ প্রস্তুত করা যায়নি।" });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "প্রক্রিয়াকরণে ত্রুটি।" });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const student = overview?.student;
  const activeEnrollment = student?.enrollments?.[0];
  const primaryGuardian = student?.guardianLinks?.[0]?.guardian;

  return (
    <div className="space-y-6">
      {/* 1. HERO SEARCH & STUDENT SELECTION CONSOLE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#031E13] via-[#083E28] to-[#0A4D32] text-white p-6 sm:p-8 shadow-xl border border-emerald-700/50">
        {/* Subtle Watermark Islamic Arch Pattern */}
        <div className="absolute -right-8 -top-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-emerald-950 font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full font-mono shadow-sm">
                  CONTROL COCKPIT
                </span>
                <span className="text-emerald-200 text-xs font-medium">১৩টি অফিশিয়াল সনদ ও আইডি কন্ট্রোল</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-white mt-1 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-amber-300" />
                শিক্ষার্থী সেন্ট্রাল ডকুমেন্ট কন্ট্রোল সেন্টার (Student Document Hub)
              </h3>
              <p className="text-xs text-emerald-100/90 max-w-3xl leading-relaxed mt-0.5">
                শিক্ষার্থী আইডি (যেমন: EHRJ-2026-XXXX), বাংলা নাম, রোল বা অভিভাবকের ফোন নম্বর দিয়ে অনুসন্ধান করে শিক্ষার্থীর সকল পরিচয়পত্র, সমাপনী সনদ, প্রশংসাপত্র ও ছাড়পত্রের সার্বিক নিয়ন্ত্রণ করুন।
              </p>
            </div>

            {selectedStudentId && (
              <button
                onClick={handleClearSelectedStudent}
                className="self-start sm:self-center bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/20 transition flex items-center gap-1.5 shadow"
              >
                <X className="w-3.5 h-3.5" />
                অন্য শিক্ষার্থী নির্বাচন
              </button>
            )}
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-emerald-300 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="শিক্ষার্থী আইডি (EHRJ-2026-...), নাম, শ্রেণি রোল অথবা অভিভাবকের মোবাইল নম্বর লিখুন..."
                className="w-full pl-12 pr-12 py-3.5 text-xs sm:text-sm bg-black/25 text-white placeholder-emerald-200/60 border border-emerald-500/40 rounded-2xl outline-none focus:ring-2 focus:ring-amber-400 focus:bg-black/40 transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 text-emerald-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isSearching && (
                <div className="absolute right-4 w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-40 left-0 right-0 mt-2 bg-white text-gray-900 border border-emerald-800/30 rounded-2xl shadow-2xl max-h-80 overflow-y-auto divide-y divide-gray-100">
                <div className="p-2 bg-gray-50 text-[11px] font-semibold text-gray-500 flex justify-between">
                  <span>অনুসন্ধান ফলাফল ({searchResults.length} জন শিক্ষার্থী পাওয়া গেছে)</span>
                  <span className="text-[10px] text-gray-400">ক্লিক করে নির্বাচন করুন</span>
                </div>
                {searchResults.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStudent(s)}
                    className="w-full text-left p-3 hover:bg-emerald-50/60 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#083E28] to-[#0D5C3A] text-amber-300 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                        {s.fullNameBn?.[0] || "শ"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-xs sm:text-sm block group-hover:text-[#0D5C3A]">
                            {s.fullNameBn}
                          </span>
                          {s.fullNameEn && (
                            <span className="text-[11px] text-gray-400 font-mono">
                              ({s.fullNameEn})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                          <span className="bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.2 rounded text-[10px]">
                            {s.studentIdNumber}
                          </span>
                          <span>•</span>
                          <span>শ্রেণি: {s.activeEnrollment?.className || "সাধারণ"}</span>
                          <span>•</span>
                          <span>রোল: {s.activeEnrollment?.rollNumber || "১"}</span>
                          {s.guardian?.phone && (
                            <>
                              <span>•</span>
                              <span>ফোন: {s.guardian.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] bg-[#0D5C3A] group-hover:bg-[#158052] text-white font-bold px-3 py-1 rounded-xl shadow-sm transition">
                      নির্বাচন করুন
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick-Select Recommended Active Students Chips */}
          {!selectedStudentId && recommendedStudents.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-emerald-200/90 font-medium text-[11px] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                দ্রুত অ্যাক্সেসযোগ্য শিক্ষার্থী:
              </span>
              {recommendedStudents.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => handleSelectStudent(rec)}
                  className="bg-white/10 hover:bg-white/20 border border-emerald-400/30 text-white rounded-xl px-2.5 py-1 text-[11px] font-medium transition flex items-center gap-1.5 shadow-sm group"
                >
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-emerald-950 font-bold text-[9px] flex items-center justify-center">
                    {rec.fullNameBn?.[0] || "শ"}
                  </span>
                  <span>{rec.fullNameBn}</span>
                  <span className="text-[9.5px] font-mono text-emerald-300 opacity-80 group-hover:opacity-100">
                    ({rec.studentIdNumber})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Status Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex justify-between items-center shadow-md animate-in fade-in slide-in-from-top-2 duration-300 ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-300 text-emerald-900"
              : "bg-red-50 border border-red-300 text-red-900"
          }`}
        >
          <span className="flex items-center gap-2.5 font-semibold">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
            )}
            {actionMessage.text}
          </span>
          <button
            onClick={() => setActionMessage(null)}
            className="font-bold text-gray-500 hover:text-gray-900 text-lg leading-none p-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Loading Overview Skeleton */}
      {loadingOverview && (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm space-y-3">
          <div className="w-10 h-10 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-gray-800">শিক্ষার্থীর সেন্ট্রাল ডকুমেন্ট ও যোগ্যতা রেকর্ড বিশ্লেষণ করা হচ্ছে...</p>
          <p className="text-xs text-gray-500">ডাটাবেজ থেকে শিক্ষাবর্ষ, ফলাফল ও আর্থিক ছাড়পত্র লোড হচ্ছে</p>
        </div>
      )}

      {/* 2. INITIAL STATE (WHEN NO STUDENT IS SELECTED) - SYSTEM OVERVIEW SHOWCASE */}
      {!selectedStudentId && !loadingOverview && (
        <div className="space-y-6">
          {/* Key Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">স্মার্ট স্টুডেন্ট আইডি কার্ড</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                আন্তর্জাতিক CR80 স্ট্যান্ডার্ড দ্বিপাক্ষিক পিভিসি কার্ড ফরম্যাট, ছবি, বারকোড ও অভিভাবক জরুরি তথ্যসহ।
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">সমাপনী মহাসনদসমূহ</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                হিফজুল কুরআন, মেশকাত ও দাওরায়ে হাদীস (মাস্টার্স সমমান) সনদপত্র আরবি ক্যালিগ্রাফি ও গোল্ডেন সীলমোহরসহ।
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">পাবলিক কিউআর ভেরিফিকেশন</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                প্রতিটি সনদে ক্রিপ্টোগ্রাফিক ইউনিক ভেরিফিকেশন কোড। মোবাইল স্ক্যান করে যেকোনো প্রান্ত থেকে সত্যতা যাচাইযোগ্য।
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">১-ক্লিকে যৌথ প্যাকেজ</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                শিক্ষার্থীর অর্জিত ও প্রযোজ্য সকল সনদপত্র স্বয়ংক্রিয়ভাবে যোগ্যতা যাচাই করে এক ক্লিকে প্রস্তুত ও প্রিন্ট করুন।
              </p>
            </div>
          </div>

          {/* Canonical Categories Directory Preview */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0D5C3A]" />
                  ১৩টি প্রাতিষ্ঠানিক সনদ ও অফিশিয়াল ফরম্যাট ডিরেক্টরি
                </h4>
                <p className="text-xs text-gray-500">
                  যেকোনো শিক্ষার্থীর নাম বা আইডি উপরে লিখে সার্চ করলে উক্ত শিক্ষার্থীর জন্য প্রযোজ্য ফরম্যাটগুলো উন্মুক্ত হবে।
                </p>
              </div>
              <span className="text-xs font-semibold text-[#0D5C3A] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                ৬টি কেন্দ্রীয় বিভাগ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DOCUMENT_CATEGORIES.map((cat) => (
                <div key={cat.id} className="p-4 rounded-2xl border border-gray-100 bg-[#FDFCF8] hover:border-emerald-300 transition space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0D5C3A] flex items-center justify-center font-bold">
                      {cat.id === "IDENTITY" && <CreditCard className="w-4 h-4" />}
                      {cat.id === "ADMISSION" && <FileCheck className="w-4 h-4" />}
                      {cat.id === "ACADEMIC" && <Award className="w-4 h-4" />}
                      {cat.id === "INSTITUTIONAL" && <Building className="w-4 h-4" />}
                      {cat.id === "TRANSFER" && <ExternalLink className="w-4 h-4" />}
                      {cat.id === "FINANCIAL" && <DollarSign className="w-4 h-4" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900 text-xs">{cat.nameBn}</h5>
                      <span className="text-[10px] text-gray-400 font-mono">{cat.id} CATEGORY</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    {cat.id === "IDENTITY" && "ডিজিটাল পিভিসি আইডি কার্ড ও শিক্ষার্থী পরিচয় প্রত্যয়নপত্র।"}
                    {cat.id === "ADMISSION" && "ভর্তি নিশ্চয়তা ও অফিসিয়াল শিক্ষাবর্ষ এনরোলমেন্ট প্রত্যয়ন।"}
                    {cat.id === "ACADEMIC" && "হিফজুল কুরআন, মেশকাত ও দাওরায়ে হাদীস সনদপত্র এবং নম্বরপত্র।"}
                    {cat.id === "INSTITUTIONAL" && "চারিত্রিক সনদ, প্রশংসাপত্র, অধ্যয়ন প্রত্যয়ন ও সার্বিক টেস্টিমোনিয়াল।"}
                    {cat.id === "TRANSFER" && "ছাড়পত্র / বদলি সনদ (TC) এবং আর্থিক হিসাব নিষ্পত্তিপত্র।"}
                    {cat.id === "FINANCIAL" && "ফি পরিশোধের মানি রিসিট ও অফিশিয়াল ইনভয়েস স্লিপ।"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. STUDENT MASTER PROFILE & CONTROL BANNER (ACTIVE SELECTION) */}
      {overview && student && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-[#042416] via-[#083E28] to-[#042416] text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-amber-400/40 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              {/* Student Photo */}
              <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-white/10 border-2 border-amber-300/60 overflow-hidden flex items-center justify-center shrink-0 shadow-inner relative group">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-amber-200">
                    <UserCheck className="w-10 h-10 text-amber-200" />
                    <span className="text-[8px] font-mono mt-1 opacity-80">ছবি সংরক্ষিত</span>
                  </div>
                )}
                <div className="absolute top-1 right-1 bg-amber-400 text-emerald-950 p-0.5 rounded-full shadow">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              </div>

              {/* Student Info */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-wide">
                    {student.fullNameBn}
                  </h2>
                  <span className="bg-amber-400 text-emerald-950 font-black text-xs font-mono px-2.5 py-0.5 rounded-full shadow-sm">
                    {student.studentIdNumber}
                  </span>
                  <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${
                    student.status === "ACTIVE" ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/50" : "bg-gray-500/30 text-gray-200"
                  }`}>
                    {student.status === "ACTIVE" ? "নিয়মিত শিক্ষার্থী" : student.status}
                  </span>
                </div>

                <p className="text-xs text-amber-200/90 font-mono tracking-wide">
                  {student.fullNameEn || "STUDENT MASTER RECORD"}
                </p>

                {/* Badges Grid */}
                <div className="flex flex-wrap gap-2 text-[11px] text-emerald-100 font-mono pt-1">
                  <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                    জামাত: <strong className="text-white">{activeEnrollment?.jamatClass?.nameBn || "সাধারণ"}</strong> (রোল: {activeEnrollment?.rollNumber || "১"})
                  </span>
                  <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                    সেশন: <strong className="text-white">{activeEnrollment?.session?.name || "২০২৬"}</strong>
                  </span>
                  <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                    শাখা: <strong className="text-white">{activeEnrollment?.section?.name || "ক"}</strong>
                  </span>
                  <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                    ধরন: <strong className="text-white">{student.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}</strong>
                  </span>
                  {primaryGuardian && (
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-300" />
                      অভিভাবক: {primaryGuardian.fullNameBn} ({primaryGuardian.phone})
                    </span>
                  )}
                </div>

                {/* Financial Clearance Indicator */}
                <div className="pt-1.5 flex items-center gap-2">
                  <span className="text-[11px] text-emerald-200 font-semibold">আর্থিক হিসাব স্ট্যাটাস:</span>
                  {overview.financialClearance?.hasOutstandingDues ? (
                    <span className="text-[11px] bg-red-500/20 text-red-200 border border-red-400/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      বকেয়া রয়েছে ৳{overview.financialClearance.totalDue}
                    </span>
                  ) : (
                    <span className="text-[11px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                      কোনো বকেয়া নেই (সম্পূর্ণ পরিশোধিত)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2.5 shrink-0">
              <button
                onClick={handleGenerateAllAvailable}
                disabled={isGeneratingAll}
                className="bg-amber-400 hover:bg-amber-300 text-emerald-950 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isGeneratingAll ? (
                  <div className="w-4 h-4 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-950" />
                )}
                প্রযোজ্য সকল সনদ প্রস্তুত করুন
              </button>
              <button
                onClick={() => window.print()}
                className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                যৌথ প্রিন্ট প্যাকেজ
              </button>
            </div>
          </div>

          {/* 4. MASTER DOCUMENT CATEGORIES GRID */}
          <div className="space-y-6">
            {overview.categories.map((category: any) => {
              const issuedCount = category.documents.filter((d: any) => Boolean(d.currentDocument)).length;

              return (
                <div key={category.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#0D5C3A] flex items-center justify-center font-bold">
                        {category.id === "IDENTITY" && <CreditCard className="w-4 h-4" />}
                        {category.id === "ADMISSION" && <FileCheck className="w-4 h-4" />}
                        {category.id === "ACADEMIC" && <Award className="w-4 h-4" />}
                        {category.id === "INSTITUTIONAL" && <Building className="w-4 h-4" />}
                        {category.id === "TRANSFER" && <ExternalLink className="w-4 h-4" />}
                        {category.id === "FINANCIAL" && <DollarSign className="w-4 h-4" />}
                      </div>
                      <span>{category.nameBn}</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 font-mono">
                        ইস্যুকৃত: <strong className="text-[#0D5C3A]">{issuedCount}</strong> / {category.documents.length}টি
                      </span>
                      <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#0D5C3A] h-full rounded-full transition-all duration-500"
                          style={{ width: `${(issuedCount / (category.documents.length || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.documents.map((docItem: any) => {
                      const isIssued = Boolean(docItem.currentDocument);
                      const isEligible = docItem.eligible;
                      const cert = docItem.currentDocument;

                      return (
                        <div
                          key={docItem.code}
                          className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3.5 transition border ${
                            isIssued
                              ? "bg-emerald-50/40 border-emerald-300 shadow-sm"
                              : isEligible
                              ? "bg-white border-blue-200 hover:border-[#0D5C3A] hover:shadow-md"
                              : "bg-gray-50/80 border-gray-200 opacity-90"
                          }`}
                        >
                          {/* Title & Status Badge */}
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-gray-900 text-xs sm:text-sm block leading-tight">
                                {docItem.nameBn}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 shadow-sm ${
                                  docItem.activeStatus === "ACTIVE" || docItem.activeStatus === "ISSUED"
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                    : docItem.activeStatus === "REISSUED"
                                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                                    : docItem.activeStatus === "REVOKED"
                                    ? "bg-red-100 text-red-900 border border-red-300"
                                    : isEligible
                                    ? "bg-blue-50 text-blue-900 border border-blue-300"
                                    : "bg-gray-200 text-gray-600 border border-gray-300"
                                }`}
                              >
                                {docItem.activeStatus === "ACTIVE"
                                  ? "✓ সক্রিয় (Active)"
                                  : docItem.activeStatus === "ISSUED"
                                  ? "✓ ইস্যুকৃত"
                                  : docItem.activeStatus === "REISSUED"
                                  ? "রি-ইস্যুকৃত"
                                  : docItem.activeStatus === "REVOKED"
                                  ? "বাতিলকৃত"
                                  : isEligible
                                  ? "★ প্রস্তুতযোগ্য"
                                  : "অযোগ্য"}
                              </span>
                            </div>
                            <span className="font-mono text-[10.5px] text-gray-400 block">{docItem.prefix}</span>
                          </div>

                          {/* Eligibility or Issued Details */}
                          <div className="text-[11px] space-y-1.5">
                            {isIssued ? (
                              <div className="bg-white p-3 rounded-xl border border-emerald-200/80 font-mono space-y-1 shadow-inner">
                                <div className="text-[#083B25] font-extrabold text-xs truncate flex items-center justify-between">
                                  <span>{cert.certificateNumber}</span>
                                  {cert.version > 1 && (
                                    <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.2 rounded font-bold">
                                      v{cert.version}
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-500 text-[10.5px] flex items-center justify-between">
                                  <span>ইস্যু: {new Date(cert.issueDate).toLocaleDateString("bn-BD")}</span>
                                  <span className="text-[9.5px] text-gray-400">কোড: {cert.verificationCode?.substring(0, 10)}...</span>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`p-2.5 rounded-xl text-[11px] leading-relaxed ${
                                  isEligible
                                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                                    : "bg-gray-100 text-gray-600 border border-gray-200"
                                }`}
                              >
                                {isEligible ? (
                                  <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    ইস্যুর যাবতীয় প্রাতিষ্ঠানিক শর্ত পূরণ হয়েছে
                                  </span>
                                ) : (
                                  <span className="flex items-start gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <span>{docItem.eligibilityReason || "শিক্ষাগত যোগ্যতা অপূর্ণ"}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-xs">
                            {isIssued ? (
                              <>
                                <button
                                  onClick={() => {
                                    setActivePreviewDoc(cert);
                                    setPreviewLayoutMode(docItem.code === "STUDENT_ID" ? "ID_CARD" : "A4");
                                  }}
                                  className="flex-1 bg-[#0D5C3A] hover:bg-[#158052] text-white font-bold py-2 px-3 rounded-xl text-[11px] transition flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  দেখুন / প্রিন্ট
                                </button>
                                <button
                                  onClick={() => onOpenReissue?.(cert)}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 py-2 px-2.5 rounded-xl text-[11px] font-semibold transition flex items-center gap-1 shadow-sm"
                                  title="সংশোধন বা পুনরায় ইস্যু"
                                >
                                  <RefreshCw className="w-3 h-3 text-amber-700" />
                                  রি-ইস্যু
                                </button>
                                {!cert.isRevoked && (
                                  <button
                                    onClick={() => onOpenRevoke?.(cert)}
                                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2 px-2 rounded-xl text-[11px] font-semibold transition flex items-center"
                                    title="সনদ বাতিল করুন"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <button
                                onClick={() => handleGenerateDirect(docItem.code)}
                                disabled={!isEligible || generatingDocCode === docItem.code}
                                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
                                  isEligible
                                    ? "bg-[#0D5C3A] hover:bg-[#158052] text-white"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
                                }`}
                              >
                                {generatingDocCode === docItem.code ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5" />
                                )}
                                সনদ প্রস্তুত করুন
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. PREVIEW & PRINT OFFICIAL MODAL */}
      {activePreviewDoc && (
        <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto border border-gray-100">
            {/* Top Toolbar */}
            <div className="flex flex-wrap justify-between items-center border-b pb-4 gap-3 print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs sm:text-sm font-bold text-[#0D5C3A] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {activePreviewDoc.certificateNumber}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activePreviewDoc.isRevoked ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {activePreviewDoc.isRevoked ? "REVOKED" : "VALID"}
                </span>
                {activePreviewDoc.version > 1 && (
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    v{activePreviewDoc.version}
                  </span>
                )}

                {/* Layout Mode Toggler */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-[10.5px] font-bold ml-1 sm:ml-3">
                  <button
                    onClick={() => setPreviewLayoutMode("A4")}
                    className={`px-2.5 py-1 rounded-lg transition ${previewLayoutMode === "A4" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    A4 সনদ
                  </button>
                  <button
                    onClick={() => setPreviewLayoutMode("ID_CARD")}
                    className={`px-2.5 py-1 rounded-lg transition ${previewLayoutMode === "ID_CARD" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    CR80 আইডি
                  </button>
                  <button
                    onClick={() => setPreviewLayoutMode("THERMAL_80MM")}
                    className={`px-2.5 py-1 rounded-lg transition ${previewLayoutMode === "THERMAL_80MM" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    ৮০ মিমি
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  প্রিন্ট / PDF
                </button>
                <a
                  href={`/verify/document/${encodeURIComponent(activePreviewDoc.verificationCode)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-xl"
                  title="অনলাইন যাচাই পেজ"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setActivePreviewDoc(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 leading-none transition"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Document Canvas Display */}
            <div className="p-2 sm:p-4 bg-gray-50/50 rounded-2xl border border-gray-200/60 flex items-center justify-center">
              <UniversalDocumentRenderer doc={activePreviewDoc} layoutMode={previewLayoutMode} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
