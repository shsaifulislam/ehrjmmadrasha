"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Layers,
  Grid,
  TrendingUp,
  PlusCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  Users,
  Check,
  Building,
  History,
  Edit3,
  Trash2,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

type AcademicTab = "SESSIONS" | "CLASSES" | "SECTIONS" | "PROMOTIONS";

export default function AdminAcademicPage() {
  const [activeTab, setActiveTab] = useState<AcademicTab>("SESSIONS");
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Sessions State
  const [sessions, setSessions] = useState<any[]>([]);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [sessionStartDate, setSessionStartDate] = useState("");
  const [sessionEndDate, setSessionEndDate] = useState("");
  const [sessionStatus, setSessionStatus] = useState("ACTIVE");
  const [submittingSession, setSubmittingSession] = useState(false);

  // Classes State
  const [classes, setClasses] = useState<any[]>([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [classNameBn, setClassNameBn] = useState("");
  const [classNameEn, setClassNameEn] = useState("");
  const [classNameAr, setClassNameAr] = useState("");
  const [classCode, setClassCode] = useState("");
  const [classGenderType, setClassGenderType] = useState("COMBINED");
  const [classSortOrder, setClassSortOrder] = useState(0);
  const [submittingClass, setSubmittingClass] = useState(false);

  // Edit Class State
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [submittingEditClass, setSubmittingEditClass] = useState(false);

  // Sections State
  const [sections, setSections] = useState<any[]>([]);
  const [selectedClassForSection, setSelectedClassForSection] = useState("");
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionClassId, setSectionClassId] = useState("");
  const [sectionNameBn, setSectionNameBn] = useState("");
  const [sectionNameEn, setSectionNameEn] = useState("");
  const [sectionRoomNo, setSectionRoomNo] = useState("");
  const [sectionCapacity, setSectionCapacity] = useState(60);
  const [submittingSection, setSubmittingSection] = useState(false);

  // Edit Section State
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  const [submittingEditSection, setSubmittingEditSection] = useState(false);

  // Promotion State
  const [promoFromSession, setPromoFromSession] = useState("");
  const [promoFromClass, setPromoFromClass] = useState("");
  const [promoToSession, setPromoToSession] = useState("");
  const [promoToClass, setPromoToClass] = useState("");
  const [promoCandidates, setPromoCandidates] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [executingPromo, setExecutingPromo] = useState(false);
  const [promotionHistory, setPromotionHistory] = useState<any[]>([]);

  // Load Sessions
  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/admin/academic/sessions");
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Classes
  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/admin/academic/classes");
      const data = await res.json();
      if (data.classes) setClasses(data.classes);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Sections
  const fetchSections = async (classId?: string) => {
    try {
      const url = classId ? `/api/admin/academic/sections?classId=${classId}` : "/api/admin/academic/sections";
      const res = await fetch(url);
      const data = await res.json();
      if (data.sections) setSections(data.sections);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Promotion Audit Logs
  const fetchPromotionHistory = async () => {
    try {
      const res = await fetch("/api/admin/promotions");
      const data = await res.json();
      if (data.history) setPromotionHistory(data.history);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSessions(), fetchClasses(), fetchSections(), fetchPromotionHistory()]);
    } catch (err) {
      console.error("loadAll error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSession(true);
    try {
      const res = await fetch("/api/admin/academic/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sessionName,
          startDate: sessionStartDate,
          endDate: sessionEndDate,
          status: sessionStatus,
          isCurrent: sessionStatus === "ACTIVE",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "সেশন তৈরিতে ত্রুটি");

      setBanner({ text: `সেশন '${sessionName}' সফলভাবে তৈরি হয়েছে।`, type: "success" });
      setShowSessionModal(false);
      setSessionName("");
      setSessionStartDate("");
      setSessionEndDate("");
      fetchSessions();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setSubmittingSession(false);
    }
  };

  const handleActivateSession = async (id: string, name: string) => {
    if (!confirm(`আপনি কি '${name}' সেশনটি সক্রিয় (Active) করতে চান?`)) return;
    try {
      const res = await fetch(`/api/admin/academic/sessions/${id}/activate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBanner({ text: data.message, type: "success" });
      fetchSessions();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    }
  };

  const handleCloseSession = async (id: string, name: string) => {
    if (!confirm(`সতর্কতা: '${name}' সেশনটি সম্পন্ন/বন্ধ (CLOSED) করবেন? এতে কোনো ঐতিহাসিক ডেটা মুছে যাবে না।`)) return;
    try {
      const res = await fetch(`/api/admin/academic/sessions/${id}/close`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBanner({ text: data.message, type: "success" });
      fetchSessions();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingClass(true);
    try {
      const res = await fetch("/api/admin/academic/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn: classNameBn,
          nameEn: classNameEn,
          nameAr: classNameAr,
          code: classCode,
          genderType: classGenderType,
          sortOrder: Number(classSortOrder),
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "শ্রেণি যোগ করতে ত্রুটি");

      setBanner({ text: `জামাত '${classNameBn}' সফলভাবে তৈরি হয়েছে।`, type: "success" });
      setShowClassModal(false);
      setClassNameBn("");
      setClassNameEn("");
      setClassNameAr("");
      setClassCode("");
      fetchClasses();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setSubmittingClass(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSection(true);
    try {
      const res = await fetch("/api/admin/academic/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: sectionClassId,
          nameBn: sectionNameBn,
          nameEn: sectionNameEn,
          roomNo: sectionRoomNo,
          maxCapacity: Number(sectionCapacity),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "শাখা তৈরি করতে ত্রুটি");

      setBanner({ text: `শাখা '${sectionNameBn}' সফলভাবে যুক্ত হয়েছে।`, type: "success" });
      setShowSectionModal(false);
      setSectionNameBn("");
      setSectionNameEn("");
      setSectionRoomNo("");
      fetchSections(selectedClassForSection);
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setSubmittingSection(false);
    }
  };

  // Open Edit Class
  const handleOpenEditClass = (cls: any) => {
    setEditingClass({
      id: cls.id,
      nameBn: cls.nameBn,
      nameEn: cls.nameEn || "",
      nameAr: cls.nameAr || "",
      code: cls.code,
      genderType: cls.genderType,
      sortOrder: cls.sortOrder ?? 0,
      isActive: cls.isActive,
    });
    setShowEditClassModal(true);
  };

  // Submit Update Class
  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    setSubmittingEditClass(true);
    try {
      const res = await fetch(`/api/admin/academic/classes/${editingClass.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn: editingClass.nameBn,
          nameEn: editingClass.nameEn,
          nameAr: editingClass.nameAr,
          code: editingClass.code,
          genderType: editingClass.genderType,
          sortOrder: Number(editingClass.sortOrder),
          isActive: editingClass.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "শ্রেণি আপডেট করতে ব্যর্থ হয়েছে");

      setBanner({ text: `জামাত '${editingClass.nameBn}' সফলভাবে আপডেট হয়েছে।`, type: "success" });
      setShowEditClassModal(false);
      setEditingClass(null);
      fetchClasses();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setSubmittingEditClass(false);
    }
  };

  // Delete Class (if 0 enrollments)
  const handleDeleteClass = async (cls: any) => {
    if (cls._count?.enrollments > 0) {
      alert(
        `এই জামাতে ${cls._count.enrollments} জন শিক্ষার্থীর সক্রিয় ভর্তি রেকর্ড রয়েছে। ঐতিহাসিক ডেটা সুরক্ষার জন্য এটি মুছে ফেলা যাবে না; প্রয়োজনে নিষ্ক্রিয় করুন।`
      );
      return;
    }
    if (!confirm(`আপনি কি নিশ্চিত যে '${cls.nameBn}' জামাতটি স্থায়ীভাবে মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch(`/api/admin/academic/classes/${cls.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "মুছে ফেলতে ব্যর্থ হয়েছে");
      setBanner({ text: data.message || "শ্রেণি মুছে ফেলা হয়েছে।", type: "success" });
      fetchClasses();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    }
  };

  // Toggle Class Active Status
  const handleToggleClassActive = async (cls: any) => {
    try {
      const res = await fetch(`/api/admin/academic/classes/${cls.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !cls.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে");
      setBanner({ text: `'${cls.nameBn}' এর স্ট্যাটাস সফলভাবে পরিবর্তন হয়েছে।`, type: "success" });
      fetchClasses();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    }
  };

  // Open Edit Section
  const handleOpenEditSection = (sec: any) => {
    setEditingSection({
      id: sec.id,
      nameBn: sec.nameBn,
      nameEn: sec.nameEn || "",
      roomNo: sec.roomNo || "",
      maxCapacity: sec.maxCapacity ?? 60,
    });
    setShowEditSectionModal(true);
  };

  // Submit Update Section
  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    setSubmittingEditSection(true);
    try {
      const res = await fetch(`/api/admin/academic/sections/${editingSection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn: editingSection.nameBn,
          nameEn: editingSection.nameEn,
          roomNo: editingSection.roomNo,
          maxCapacity: Number(editingSection.maxCapacity),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "শাখা আপডেট ব্যর্থ হয়েছে");

      setBanner({ text: `শাখা '${editingSection.nameBn}' সফলভাবে আপডেট হয়েছে।`, type: "success" });
      setShowEditSectionModal(false);
      setEditingSection(null);
      fetchSections(selectedClassForSection);
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setSubmittingEditSection(false);
    }
  };

  // Delete Section
  const handleDeleteSection = async (sec: any) => {
    if (sec._count?.enrollments > 0) {
      alert(`এই শাখায় ${sec._count.enrollments} জন শিক্ষার্থীর রেকর্ড সংরক্ষিত রয়েছে। এটি মুছে ফেলা সম্ভব নয়।`);
      return;
    }
    if (!confirm(`আপনি কি নিশ্চিত যে '${sec.nameBn}' শাখাটি মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch(`/api/admin/academic/sections/${sec.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "মুছে ফেলতে ব্যর্থ হয়েছে");
      setBanner({ text: data.message || "শাখা মুছে ফেলা হয়েছে।", type: "success" });
      fetchSections(selectedClassForSection);
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    }
  };

  const handlePreviewPromotion = async () => {
    if (!promoFromSession || !promoFromClass || !promoToSession || !promoToClass) {
      setBanner({ text: "উৎস ও লক্ষ্য উভয় সেশন ও জামাত নির্বাচন করুন।", type: "error" });
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/admin/promotions/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromSessionId: promoFromSession,
          fromClassId: promoFromClass,
          toSessionId: promoToSession,
          toClassId: promoToClass,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPromoCandidates(data.candidates || []);
      // Select all by default
      setSelectedStudentIds((data.candidates || []).map((c: any) => c.studentId));
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecutePromotion = async () => {
    if (selectedStudentIds.length === 0) {
      setBanner({ text: "কমপক্ষে একজন শিক্ষার্থী নির্বাচন করুন।", type: "error" });
      return;
    }

    if (
      !confirm(
        `আপনি কি নিশ্চিত যে নির্বাচিত ${selectedStudentIds.length} জন শিক্ষার্থীকে প্রমোশন প্রদান করবেন? এতে নতুন শিক্ষাবর্ষে তাদের জন্য পরবর্তী রোল বরাদ্দ হবে এবং পূর্ববর্তী ইতিহাস সম্পূর্ণ সংরক্ষিত থাকবে।`
      )
    )
      return;

    setExecutingPromo(true);
    try {
      // Build roll assignments based on candidates list
      const rollAssignments = promoCandidates
        .filter((c) => selectedStudentIds.includes(c.studentId))
        .map((c) => ({ studentId: c.studentId, rollNumber: c.proposedRoll }));

      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          toSessionId: promoToSession,
          toClassId: promoToClass,
          rollAssignments,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBanner({ text: data.message, type: "success" });
      setPromoCandidates([]);
      setSelectedStudentIds([]);
      fetchPromotionHistory();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setExecutingPromo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ড্যাশবোর্ড</span>
            </Link>
            <div className="h-5 w-px bg-emerald-700 hidden sm:block" />
            <div>
              <h1 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-300" />
                <span>একাডেমিক কোর ও শিক্ষা ব্যবস্থাপনা</span>
              </h1>
              <p className="text-xs text-emerald-200">
                {INSTITUTION_INFO.nameBn} • শিক্ষাবর্ষ, জামাত, শাখা ও প্রমোশন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAll}
              className="p-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-lg transition-colors flex items-center gap-1 text-xs"
              title="রিফ্রেশ"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
            <Link
              href="/admin/students"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>শিক্ষার্থী তালিকা</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Alert */}
        {banner && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium ${
              banner.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {banner.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
              <span>{banner.text}</span>
            </div>
            <button onClick={() => setBanner(null)} className="text-xs underline hover:no-underline">
              বন্ধ করুন
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("SESSIONS")}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "SESSIONS"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>১. সেশন সমূহ ({sessions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("CLASSES")}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "CLASSES"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>২. জামাত ও শ্রেণি ({classes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("SECTIONS")}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "SECTIONS"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>৩. শাখা ব্যবস্থাপনা ({sections.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("PROMOTIONS")}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "PROMOTIONS"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>৪. প্রমোশন ইঞ্জিন</span>
          </button>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-4">
              <div className="space-y-2">
                <div className="h-5 bg-slate-200 rounded w-48" />
                <div className="h-3 bg-slate-100 rounded w-72" />
              </div>
              <div className="h-9 bg-slate-200 rounded-lg w-36" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-slate-200 rounded w-32" />
                    <div className="h-5 bg-slate-200 rounded-full w-20" />
                  </div>
                  <div className="h-14 bg-slate-100 rounded-lg" />
                  <div className="h-8 bg-slate-200 rounded w-28" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* TAB 1: SESSIONS MANAGEMENT */}
            {activeTab === "SESSIONS" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <span>শিক্ষাবর্ষ ও সেশন তালিকা</span>
                </h2>
                <p className="text-xs text-slate-500">
                  ঐতিহাসিক ডেটা সংরক্ষিত থাকে; সেশন বন্ধ করা হলেও পুরাতন শিক্ষার্থীদের রেকর্ড অক্ষুণ্ণ থাকে।
                </p>
              </div>
              <button
                onClick={() => setShowSessionModal(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>নতুন সেশন তৈরি করুন</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className={`bg-white rounded-xl border p-5 space-y-4 transition-all hover:shadow-md ${
                    sess.isCurrent
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{sess.name}</h3>
                      <p className="text-xs text-slate-500">
                        {new Date(sess.startDate).toLocaleDateString("bn-BD")} —{" "}
                        {new Date(sess.endDate).toLocaleDateString("bn-BD")}
                      </p>
                    </div>
                    {sess.isCurrent ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        চলতি সেশন
                      </span>
                    ) : sess.status === "CLOSED" ? (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        সম্পন্ন/বন্ধ
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-medium rounded-full">
                        খসড়া / ড্রাফট
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-center text-xs">
                    <div>
                      <span className="block text-slate-400 text-[10px]">ভর্তিকৃত ছাত্র</span>
                      <span className="font-bold text-slate-800">{sess._count?.enrollments || 0}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">হাজিরা রেকর্ড</span>
                      <span className="font-bold text-slate-800">{sess._count?.attendances || 0}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">ফি চালান</span>
                      <span className="font-bold text-slate-800">{sess._count?.feeInvoices || 0}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {!sess.isCurrent && sess.status !== "CLOSED" && (
                      <button
                        onClick={() => handleActivateSession(sess.id, sess.name)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>সক্রিয় করুন</span>
                      </button>
                    )}
                    {sess.status !== "CLOSED" && (
                      <button
                        onClick={() => handleCloseSession(sess.id, sess.name)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1 transition-colors ml-auto"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>সেশন বন্ধ করুন</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DYNAMIC CLASS / JAMAT MANAGEMENT */}
        {activeTab === "CLASSES" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <span>কওমি ও প্রাতিষ্ঠানিক জামাত/শ্রেণি তালিকা</span>
                </h2>
                <p className="text-xs text-slate-500">
                  শিশু শ্রেণি থেকে দাওরায়ে হাদীস ও ইফতা — ডায়নামিক জামাত ও জেন্ডার কাঠামো কনফিগারেশন।
                </p>
              </div>
              <button
                onClick={() => setShowClassModal(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>নতুন জামাত যোগ করুন</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">ক্রম</th>
                    <th className="py-3 px-4">জামাতের নাম (বাংলা)</th>
                    <th className="py-3 px-4">ইংরেজি নাম</th>
                    <th className="py-3 px-4">আরবি নাম</th>
                    <th className="py-3 px-4">কোড</th>
                    <th className="py-3 px-4">জেন্ডার কাঠামো</th>
                    <th className="py-3 px-4">শাখা সমূহ</th>
                    <th className="py-3 px-4">ছাত্র সংখ্যা</th>
                    <th className="py-3 px-4 text-center">অবস্থা</th>
                    <th className="py-3 px-4 text-right">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classes.map((cls, idx) => (
                    <tr key={cls.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{cls.sortOrder || idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{cls.nameBn}</td>
                      <td className="py-3 px-4 text-slate-600">{cls.nameEn}</td>
                      <td className="py-3 px-4 font-arabic text-slate-700 text-base">{cls.nameAr || "—"}</td>
                      <td className="py-3 px-4 font-mono text-emerald-800 bg-emerald-50/50 rounded px-1.5 py-0.5 inline-block text-xs font-semibold">
                        {cls.code}
                      </td>
                      <td className="py-3 px-4">
                        {cls.genderType === "COMBINED" ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium border border-blue-200">
                            যৌথ (ছেলে ও মেয়ে)
                          </span>
                        ) : cls.genderType === "BOYS" ? (
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-[11px] font-medium border border-teal-200">
                            শুধুমাত্র ছাত্র
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[11px] font-medium border border-rose-200">
                            শুধুমাত্র ছাত্রী
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {cls.sections?.map((sec: any) => (
                            <span
                              key={sec.id}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]"
                            >
                              {sec.nameBn}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{cls._count?.enrollments || 0} জন</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleClassActive(cls)}
                          title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                          className="inline-flex items-center gap-1 text-xs cursor-pointer hover:underline"
                        >
                          {cls.isActive ? (
                            <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              সক্রিয়
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium inline-flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              নিষ্ক্রিয়
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditClass(cls)}
                            className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded transition"
                            title="সম্পাদনা করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {(!cls._count?.enrollments || cls._count.enrollments === 0) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteClass(cls)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 rounded transition"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SECTION MANAGEMENT */}
        {activeTab === "SECTIONS" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Grid className="w-5 h-5 text-emerald-600" />
                  <span>শাখা ব্যবস্থাপনা (Sections)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  প্রতিটি জামাতের অধীনস্থ শাখা, ধারণক্ষমতা এবং রুম নম্বর ব্যবস্থাপনা।
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedClassForSection}
                  onChange={(e) => {
                    setSelectedClassForSection(e.target.value);
                    fetchSections(e.target.value);
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
                >
                  <option value="">-- সকল জামাত --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (classes.length > 0) setSectionClassId(classes[0].id);
                    setShowSectionModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>নতুন শাখা যুক্ত করুন</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 hover:shadow-sm transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 inline-block mb-1">
                          {sec.jamatClass?.nameBn || "জামাতহীন"}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{sec.nameBn}</h3>
                        <p className="text-xs text-slate-500">{sec.nameEn}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                        {sec._count?.enrollments || 0} ছাত্র
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg">
                      <div>
                        <span className="text-slate-400 block text-[10px]">ধারণক্ষমতা:</span>
                        <span className="font-semibold text-slate-700">{sec.maxCapacity} জন</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">রুম / কক্ষ:</span>
                        <span className="font-semibold text-slate-700">{sec.roomNo || "নির্ধারিত নেই"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSection(sec)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded font-semibold transition flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>সম্পাদনা</span>
                    </button>
                    {(!sec._count?.enrollments || sec._count.enrollments === 0) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sec)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800 rounded font-semibold transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>মুছুন</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PROMOTION ENGINE */}
        {activeTab === "PROMOTIONS" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>শিক্ষার্থী প্রমোশন ইঞ্জিন (একক ও যৌথ প্রমোশন)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  নির্ধারিত সেশন ও জামাত থেকে নতুন সেশন ও জামাতে প্রমোশন কার্যকর করুন। পুরাতন ইতিহাস সম্পূর্ণ অপরিবর্তিত থাকবে এবং নতুন সেশনে স্বয়ংক্রিয়ভাবে পরবর্তী রোল ধার্য হবে।
                </p>
              </div>

              {/* Source & Destination Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                {/* Source */}
                <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    বর্তমান অবস্থান (উৎস)
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">উৎস সেশন</label>
                    <select
                      value={promoFromSession}
                      onChange={(e) => setPromoFromSession(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">সেশন নির্বাচন করুন</option>
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.isCurrent ? "(চলতি)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">উৎস জামাত / শ্রেণি</label>
                    <select
                      value={promoFromClass}
                      onChange={(e) => setPromoFromClass(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">জামাত নির্বাচন করুন</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target */}
                <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    প্রমোশন লক্ষ্য (টার্গেট)
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">টার্গেট সেশন</label>
                    <select
                      value={promoToSession}
                      onChange={(e) => setPromoToSession(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">টার্গেট সেশন নির্বাচন করুন</option>
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">টার্গেট জামাত / শ্রেণি</label>
                    <select
                      value={promoToClass}
                      onChange={(e) => setPromoToClass(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">টার্গেট জামাত নির্বাচন করুন</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handlePreviewPromotion}
                  disabled={previewLoading || !promoFromSession || !promoFromClass || !promoToSession || !promoToClass}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>{previewLoading ? "প্রিভিউ তৈরি হচ্ছে..." : "প্রমোশন প্রার্থীরা খুঁজুন (প্রিভিউ)"}</span>
                </button>
              </div>
            </div>

            {/* Candidates Table */}
            {promoCandidates.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      প্রমোশন তালিকা ({selectedStudentIds.length}/{promoCandidates.length} জন নির্বাচিত)
                    </h3>
                    <p className="text-xs text-slate-500">
                      প্রমোশন কার্যকর করার আগে প্রয়োজনে রোল নম্বর বা শিক্ষার্থী নির্বাচন সমন্বয় করতে পারেন।
                    </p>
                  </div>
                  <button
                    onClick={handleExecutePromotion}
                    disabled={executingPromo || selectedStudentIds.length === 0}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{executingPromo ? "কার্যকর হচ্ছে..." : "প্রমোশন চূড়ান্ত অনুমোদন করুন"}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                      <tr>
                        <th className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.length === promoCandidates.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds(promoCandidates.map((c) => c.studentId));
                              } else {
                                setSelectedStudentIds([]);
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                        </th>
                        <th className="py-2.5 px-3">স্টুডেন্ট আইডি</th>
                        <th className="py-2.5 px-3">ছাত্রের নাম</th>
                        <th className="py-2.5 px-3">বর্তমান জামাত</th>
                        <th className="py-2.5 px-3">বর্তমান রোল</th>
                        <th className="py-2.5 px-3">আবাসিক অবস্থা</th>
                        <th className="py-2.5 px-3 text-emerald-700 font-bold">প্রস্তাবিত নতুন রোল</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {promoCandidates.map((c) => {
                        const isSelected = selectedStudentIds.includes(c.studentId);
                        return (
                          <tr key={c.studentId} className={isSelected ? "bg-emerald-50/30" : "opacity-60"}>
                            <td className="py-2.5 px-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentIds([...selectedStudentIds, c.studentId]);
                                  } else {
                                    setSelectedStudentIds(selectedStudentIds.filter((id) => id !== c.studentId));
                                  }
                                }}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{c.studentIdNumber}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{c.fullNameBn}</td>
                            <td className="py-2.5 px-3">{c.currentClass}</td>
                            <td className="py-2.5 px-3 font-semibold">{c.currentRoll}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                                {c.residentialStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                {c.proposedRoll}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Promotion Audit History */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-600" />
                <span>সাম্প্রতিক প্রমোশন ইতিহাস ও অডিট ট্রেইল</span>
              </h3>
              {promotionHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">এখনো কোনো প্রমোশন রেকর্ড নেই।</p>
              ) : (
                <div className="space-y-2">
                  {promotionHistory.slice(0, 5).map((log) => {
                    let details: any = {};
                    try {
                      details = JSON.parse(log.detailsJson || "{}");
                    } catch {}
                    return (
                      <div
                        key={log.id}
                        className="p-3 bg-slate-50 rounded-lg text-xs flex items-center justify-between gap-3 border border-slate-100"
                      >
                        <div>
                          <span className="font-bold text-emerald-800">
                            {details.targetClass || "জামাত"} ({details.targetSession || "সেশন"})
                          </span>
                          <p className="text-[11px] text-slate-500">
                            {details.studentsCount || 0} জন শিক্ষার্থীকে সফলভাবে প্রমোশন প্রদান করা হয়েছে • ব্যবহারকারী:{" "}
                            {log.user?.name || "অ্যাডমিন"}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.createdAt).toLocaleString("bn-BD")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </>
    )}
  </main>

      {/* CREATE SESSION MODAL */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>নতুন শিক্ষাবর্ষ / সেশন তৈরি করুন</span>
              </h3>
              <button onClick={() => setShowSessionModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  সেশনের নাম (উদাঃ ২০২৬-২০২৭ বা ১৪৪৬-১৪৪৭ হিজরী) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="২০২৬-২০২৭"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">শুরুর তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={sessionStartDate}
                    onChange={(e) => setSessionStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">শেষের তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={sessionEndDate}
                    onChange={(e) => setSessionEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">প্রাথমিক অবস্থা</label>
                <select
                  value={sessionStatus}
                  onChange={(e) => setSessionStatus(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                >
                  <option value="ACTIVE">ACTIVE (সক্রিয় ও বর্তমান সেশন)</option>
                  <option value="DRAFT">DRAFT (পরিকল্পিত/ভবিষ্যত সেশন)</option>
                  <option value="CLOSED">CLOSED (বন্ধ)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingSession}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold"
                >
                  {submittingSession ? "সংরক্ষণ হচ্ছে..." : "সেশন সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>নতুন জামাত / শ্রেণি যোগ করুন</span>
              </h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">জামাত / শ্রেণির নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  placeholder="মিযান জামাত / নূরানী ১ম"
                  value={classNameBn}
                  onChange={(e) => setClassNameBn(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ইংরেজি নাম</label>
                  <input
                    type="text"
                    placeholder="Mizan / Noorani 1"
                    value={classNameEn}
                    onChange={(e) => setClassNameEn(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">আরবি নাম (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="صف الميزان"
                    value={classNameAr}
                    onChange={(e) => setClassNameAr(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-arabic"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ইউনিক কোড (ইংরেজি) *</label>
                  <input
                    type="text"
                    required
                    placeholder="MIZAN"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্রম নম্বর (সর্টিং)</label>
                  <input
                    type="number"
                    value={classSortOrder}
                    onChange={(e) => setClassSortOrder(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">জেন্ডার কাঠামো (ছাত্র / ছাত্রী)</label>
                <select
                  value={classGenderType}
                  onChange={(e) => setClassGenderType(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                >
                  <option value="COMBINED">COMBINED (যৌথ — শিশু ও প্রাথমিক শ্রেণির জন্য)</option>
                  <option value="BOYS">BOYS (শুধুমাত্র ছাত্র — হিফজ ও কিতাব বিভাগ)</option>
                  <option value="GIRLS">GIRLS (শুধুমাত্র ছাত্রী)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingClass}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold"
                >
                  {submittingClass ? "সংরক্ষণ হচ্ছে..." : "জামাত সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SECTION MODAL */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Grid className="w-5 h-5 text-emerald-600" />
                <span>নতুন শাখা যুক্ত করুন</span>
              </h3>
              <button onClick={() => setShowSectionModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSection} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">জামাত / শ্রেণি নির্বাচন *</label>
                <select
                  required
                  value={sectionClassId}
                  onChange={(e) => setSectionClassId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                >
                  <option value="">জামাত নির্বাচন করুন</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">শাখার নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    placeholder="ক শাখা / শাখা-১"
                    value={sectionNameBn}
                    onChange={(e) => setSectionNameBn(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ইংরেজি নাম</label>
                  <input
                    type="text"
                    placeholder="Section A"
                    value={sectionNameEn}
                    onChange={(e) => setSectionNameEn(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ধারণক্ষমতা (সর্বোচ্চ)</label>
                  <input
                    type="number"
                    value={sectionCapacity}
                    onChange={(e) => setSectionCapacity(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">রুম / কক্ষ নম্বর</label>
                  <input
                    type="text"
                    placeholder="১০১ / ২য় তলা"
                    value={sectionRoomNo}
                    onChange={(e) => setSectionRoomNo(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingSection}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold"
                >
                  {submittingSection ? "সংরক্ষণ হচ্ছে..." : "শাখা সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLASS MODAL */}
      {showEditClassModal && editingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <span>জামাত / শ্রেণি সম্পাদনা (Edit Class)</span>
              </h3>
              <button
                onClick={() => {
                  setShowEditClassModal(false);
                  setEditingClass(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  জামাত / শ্রেণির নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={editingClass.nameBn}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, nameBn: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ইংরেজি নাম</label>
                  <input
                    type="text"
                    value={editingClass.nameEn}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, nameEn: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">আরবি নাম</label>
                  <input
                    type="text"
                    value={editingClass.nameAr}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, nameAr: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-arabic"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ইউনিক কোড *</label>
                  <input
                    type="text"
                    required
                    value={editingClass.code}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, code: e.target.value.toUpperCase() })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্রম নম্বর (সর্টিং)</label>
                  <input
                    type="number"
                    value={editingClass.sortOrder}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, sortOrder: parseInt(e.target.value, 10) })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">জেন্ডার কাঠামো</label>
                  <select
                    value={editingClass.genderType}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, genderType: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  >
                    <option value="COMBINED">COMBINED (যৌথ)</option>
                    <option value="BOYS">BOYS (শুধুমাত্র ছাত্র)</option>
                    <option value="GIRLS">GIRLS (শুধুমাত্র ছাত্রী)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">সক্রিয় অবস্থা</label>
                  <select
                    value={editingClass.isActive ? "true" : "false"}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, isActive: e.target.value === "true" })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  >
                    <option value="true">সক্রিয় (Active)</option>
                    <option value="false">নিষ্ক্রিয় (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditClassModal(false);
                    setEditingClass(null);
                  }}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingEditClass}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold shadow"
                >
                  {submittingEditClass ? "আপডেট হচ্ছে..." : "আপডেট নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SECTION MODAL */}
      {showEditSectionModal && editingSection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <span>শাখা সম্পাদনা (Edit Section)</span>
              </h3>
              <button
                onClick={() => {
                  setShowEditSectionModal(false);
                  setEditingSection(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSection} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    শাখার নাম (বাংলা) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSection.nameBn}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, nameBn: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ইংরেজি নাম</label>
                  <input
                    type="text"
                    value={editingSection.nameEn}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, nameEn: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ধারণক্ষমতা (সর্বোচ্চ)
                  </label>
                  <input
                    type="number"
                    value={editingSection.maxCapacity}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        maxCapacity: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">রুম / কক্ষ নম্বর</label>
                  <input
                    type="text"
                    value={editingSection.roomNo}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, roomNo: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditSectionModal(false);
                    setEditingSection(null);
                  }}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingEditSection}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold shadow"
                >
                  {submittingEditSection ? "আপডেট হচ্ছে..." : "আপডেট নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
