"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Building,
  GraduationCap,
  HeartHandshake,
  Sparkles,
  Phone,
  Eye,
  FileText,
  Calendar,
  Layers,
  Home,
  Check,
  ChevronRight,
  Shield,
  Download,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
import { suggestArabicName } from "@/lib/arabicNames";
import UpdateGuardianModal from "@/components/students/UpdateGuardianModal";

interface StudentListItem {
  id: string;
  studentIdNumber: string;
  fullNameBn: string;
  fullNameEn: string;
  fullNameAr?: string;
  gender: string;
  dateOfBirth: string;
  fatherNameBn: string;
  fatherPhone?: string;
  residentialStatus: string;
  isOrphan: boolean;
  isFinanciallyWeak: boolean;
  status: string;
  sessionName: string;
  className: string;
  classId?: string;
  sectionName: string;
  rollNumber: number;
  primaryGuardianName?: string;
  guardianPhone?: string;
  documentsCount: number;
  createdAt: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedResidential, setSelectedResidential] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [filterOrphan, setFilterOrphan] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    residential: 0,
    dayCare: 0,
    orphan: 0,
    activeSession: "২০২৫-২০২৬",
  });

  // Reference data for dropdowns
  const [sessions, setSessions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  // Bulk Selection & Operations
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignSession, setBulkAssignSession] = useState("");
  const [bulkAssignClass, setBulkAssignClass] = useState("");
  const [bulkAssignSection, setBulkAssignSection] = useState("");
  const [showBulkResModal, setShowBulkResModal] = useState(false);
  const [bulkResidentialStatus, setBulkResidentialStatus] = useState("RESIDENTIAL");

  // Guardian Edit Modal Target
  const [guardianEditTarget, setGuardianEditTarget] = useState<{
    id: string;
    name: string;
    idNumber: string;
    guardianName?: string;
    phone?: string;
  } | null>(null);

  // Admission Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formFullNameBn, setFormFullNameBn] = useState("");
  const [formFullNameEn, setFormFullNameEn] = useState("");
  const [formFullNameAr, setFormFullNameAr] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formGender, setFormGender] = useState("MALE");
  const [formBloodGroup, setFormBloodGroup] = useState("");
  const [formBirthRegNo, setFormBirthRegNo] = useState("");
  const [formNidNo, setFormNidNo] = useState("");
  const [formFatherNameBn, setFormFatherNameBn] = useState("");
  const [formFatherPhone, setFormFatherPhone] = useState("");
  const [formFatherOccupation, setFormFatherOccupation] = useState("");
  const [formMotherNameBn, setFormMotherNameBn] = useState("");
  const [formMotherPhone, setFormMotherPhone] = useState("");
  const [formGuardianName, setFormGuardianName] = useState("");
  const [formGuardianPhone, setFormGuardianPhone] = useState("");
  const [formGuardianRelation, setFormGuardianRelation] = useState("FATHER");
  const [formPresentAddress, setFormPresentAddress] = useState("");
  const [formPermanentAddress, setFormPermanentAddress] = useState("");
  const [formSessionId, setFormSessionId] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formSectionId, setFormSectionId] = useState("");
  const [formCustomRoll, setFormCustomRoll] = useState("");
  const [formResidentialStatus, setFormResidentialStatus] = useState("NON_RESIDENTIAL");
  const [formIsOrphan, setFormIsOrphan] = useState(false);
  const [formIsFinanciallyWeak, setFormIsFinanciallyWeak] = useState(false);

  // Fetch student list
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (searchQuery) params.set("q", searchQuery);
      if (selectedSession) params.set("sessionId", selectedSession);
      if (selectedClass) params.set("classId", selectedClass);
      if (selectedSection) params.set("sectionId", selectedSection);
      if (selectedGender) params.set("gender", selectedGender);
      if (selectedResidential) params.set("residentialStatus", selectedResidential);
      if (selectedStatus) params.set("status", selectedStatus);
      if (filterOrphan) params.set("isOrphan", filterOrphan);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Load dropdown lists
  const fetchReferences = async () => {
    try {
      const [resSess, resCls, resSec] = await Promise.all([
        fetch("/api/admin/academic/sessions").then((r) => r.json()),
        fetch("/api/admin/academic/classes").then((r) => r.json()),
        fetch("/api/admin/academic/sections").then((r) => r.json()),
      ]);
      if (resSess.sessions) {
        setSessions(resSess.sessions);
        const curr = resSess.sessions.find((s: any) => s.isCurrent);
        if (curr) setFormSessionId(curr.id);
      }
      if (resCls.classes) {
        setClasses(resCls.classes);
        if (resCls.classes.length > 0) setFormClassId(resCls.classes[0].id);
      }
      if (resSec.sections) setSections(resSec.sections);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [
    page,
    searchQuery,
    selectedSession,
    selectedClass,
    selectedSection,
    selectedGender,
    selectedResidential,
    selectedStatus,
    filterOrphan,
  ]);

  // Bulk selection toggles
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Change Residential Status
  const handleExecuteBulkResidential = async () => {
    if (selectedStudentIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHANGE_RESIDENTIAL_STATUS",
          studentIds: selectedStudentIds,
          payload: { residentialStatus: bulkResidentialStatus },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBanner({ text: data.message, type: "success" });
        setShowBulkResModal(false);
        setSelectedStudentIds([]);
        fetchStudents();
      } else {
        setBanner({ text: data.error || "পরিবর্তন সম্পন্ন করা যায়নি।", type: "error" });
      }
    } catch {
      setBanner({ text: "নেটওয়ার্ক ত্রুটি।", type: "error" });
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk Assign Class & Section
  const handleExecuteBulkAssign = async () => {
    if (selectedStudentIds.length === 0 || !bulkAssignSession || !bulkAssignClass) {
      setBanner({ text: "সেশন এবং জামাত নির্বাচন আবশ্যক।", type: "error" });
      return;
    }
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_CLASS_SECTION",
          studentIds: selectedStudentIds,
          payload: {
            sessionId: bulkAssignSession,
            classId: bulkAssignClass,
            sectionId: bulkAssignSection || null,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBanner({ text: data.message, type: "success" });
        setShowBulkAssignModal(false);
        setSelectedStudentIds([]);
        fetchStudents();
      } else {
        setBanner({ text: data.error || "বরাদ্দ সম্পন্ন করা যায়নি।", type: "error" });
      }
    } catch {
      setBanner({ text: "নেটওয়ার্ক ত্রুটি।", type: "error" });
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk Export to CSV
  const handleBulkExportCsv = async () => {
    if (selectedStudentIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EXPORT_DATA",
          studentIds: selectedStudentIds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.students) {
        const rows = data.students;
        const headers = ["আইডি", "নাম (বাংলা)", "নাম (ইংরেজি)", "জামাত", "শাখা", "রোল", "আবাসিক অবস্থা", "অভিভাবক", "মোবাইল", "ঠিকানা"];
        const csvContent = [
          headers.join(","),
          ...rows.map((r: any) =>
            [
              `"${r.studentIdNumber}"`,
              `"${r.fullNameBn}"`,
              `"${r.fullNameEn}"`,
              `"${r.className}"`,
              `"${r.sectionName}"`,
              `"${r.rollNumber}"`,
              `"${r.residentialStatus}"`,
              `"${r.guardianName}"`,
              `"${r.guardianPhone}"`,
              `"${r.address}"`,
            ].join(",")
          ),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `EHRJ_Students_Export_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setBanner({ text: `${rows.length} জন শিক্ষার্থীর তথ্য CSV ফাইলে ডাউনলোড হয়েছে।`, type: "success" });
      }
    } catch {
      setBanner({ text: "এক্সপোর্ট করতে সমস্যা হয়েছে।", type: "error" });
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk Generate Batch ID Cards
  const handleBulkGenerateIdCards = async () => {
    if (selectedStudentIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/documents/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          documentType: "EHRJ-ID",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBanner({ text: `${data.message} সনদ ও প্রত্যয়নপত্র কনসোলে গিয়ে প্রিন্ট করতে পারেন।`, type: "success" });
        setSelectedStudentIds([]);
      } else {
        setBanner({ text: data.error || "আইডি কার্ড ব্যাচ জেনারেট করা যায়নি।", type: "error" });
      }
    } catch {
      setBanner({ text: "নেটওয়ার্ক ত্রুটি।", type: "error" });
    } finally {
      setBulkLoading(false);
    }
  };

  // Arabic Name Assistance Handler
  const handleArabicSuggestion = () => {
    if (!formFullNameBn) {
      setBanner({ text: "অনুগ্রহ করে প্রথমে বাংলা নামটি লিখুন।", type: "error" });
      return;
    }
    const suggested = suggestArabicName(formFullNameBn);
    setFormFullNameAr(suggested);
    setBanner({
      text: `বাংলা নামের ভিত্তিতে আরবি প্রস্তাব করা হয়েছে: "${suggested}". প্রয়োজন অনুসারে পরিবর্তন করতে পারেন।`,
      type: "success",
    });
  };

  // Create Student Handler
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullNameBn: formFullNameBn,
          fullNameEn: formFullNameEn,
          fullNameAr: formFullNameAr,
          dateOfBirth: formDob,
          gender: formGender,
          bloodGroup: formBloodGroup,
          birthCertificateNo: formBirthRegNo,
          nidNo: formNidNo,
          fatherNameBn: formFatherNameBn,
          fatherPhone: formFatherPhone,
          fatherOccupation: formFatherOccupation,
          motherNameBn: formMotherNameBn,
          motherPhone: formMotherPhone,
          guardianNameBn: formGuardianName || formFatherNameBn,
          guardianPhone: formGuardianPhone || formFatherPhone,
          guardianRelation: formGuardianRelation,
          presentAddress: formPresentAddress,
          permanentAddress: formPermanentAddress || formPresentAddress,
          sessionId: formSessionId,
          classId: formClassId,
          sectionId: formSectionId || undefined,
          customRoll: formCustomRoll ? Number(formCustomRoll) : undefined,
          residentialStatus: formResidentialStatus,
          isOrphan: formIsOrphan,
          isFinanciallyWeak: formIsFinanciallyWeak,
          status: "ACTIVE",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ছাত্র নিবন্ধনে ত্রুটি");

      setBanner({ text: data.message, type: "success" });
      setShowAddModal(false);
      setFormStep(1);
      // Reset form
      setFormFullNameBn("");
      setFormFullNameEn("");
      setFormFullNameAr("");
      setFormDob("");
      setFormFatherNameBn("");
      setFormFatherPhone("");
      setFormMotherNameBn("");
      setFormPresentAddress("");
      setFormCustomRoll("");
      fetchStudents();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setSubmitting(false);
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
                <Users className="w-5 h-5 text-emerald-300" />
                <span>শিক্ষার্থী ব্যবস্থাপনা ও মাস্টার ডিরেক্টরি</span>
              </h1>
              <p className="text-xs text-emerald-200">
                {INSTITUTION_INFO.nameBn} • শিক্ষাবর্ষ: {stats.activeSession}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStudents}
              className="p-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-lg transition-colors flex items-center gap-1 text-xs"
              title="রিফ্রেশ"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
            <Link
              href="/admin/academic"
              className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>একাডেমিক কোর</span>
            </Link>
            <button
              onClick={() => {
                setFormStep(1);
                setShowAddModal(true);
              }}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন ছাত্র ভর্তি / নিবন্ধন</span>
            </button>
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

        {/* Institutional Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">মোট শিক্ষার্থী</span>
              <span className="text-lg font-bold text-slate-900">{stats.totalStudents} জন</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">আবাসিক ছাত্র</span>
              <span className="text-lg font-bold text-slate-900">{stats.residential} জন</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">অনাবাসিক ছাত্র</span>
              <span className="text-lg font-bold text-slate-900">{stats.totalStudents - stats.residential - stats.dayCare} জন</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">ডে-কেয়ার ছাত্র</span>
              <span className="text-lg font-bold text-slate-900">{stats.dayCare} জন</span>
              <span className="text-[9px] text-emerald-600 block">খাদ্য বিল প্রযোজ্য নয়</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">এতিম শিক্ষার্থী</span>
              <span className="text-lg font-bold text-slate-900">{stats.orphan} জন</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[260px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="স্টুডেন্ট আইডি (EHRJ-...), বাংলা/ইংরেজি নাম, অভিভাবকের ফোন নম্বর বা রোল..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              মোট প্রাপ্ত ফলাফল: <span className="font-bold text-emerald-800">{totalCount} জন</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
            {/* Session Filter */}
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">সকল শিক্ষাবর্ষ</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">সকল জামাত / শ্রেণি</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn}
                </option>
              ))}
            </select>

            {/* Residential Status Filter */}
            <select
              value={selectedResidential}
              onChange={(e) => setSelectedResidential(e.target.value)}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">আবাসিক অবস্থা (সকল)</option>
              <option value="RESIDENTIAL">আবাসিক</option>
              <option value="NON_RESIDENTIAL">অনাবাসিক</option>
              <option value="DAY_CARE">ডে-কেয়ার</option>
            </select>

            {/* Gender Filter */}
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">জেন্ডার (সকল)</option>
              <option value="MALE">ছাত্র (ছেলে)</option>
              <option value="FEMALE">ছাত্রী (মেয়ে)</option>
            </select>

            {/* Orphan Filter */}
            <select
              value={filterOrphan}
              onChange={(e) => setFilterOrphan(e.target.value)}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">এতিম অবস্থা (সকল)</option>
              <option value="true">শুধুমাত্র এতিম ছাত্র</option>
              <option value="false">সাধারণ ছাত্র</option>
            </select>

            {/* Student Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">সকল অবস্থা</option>
              <option value="ACTIVE">সক্রিয় (Active)</option>
              <option value="INACTIVE">নিষ্ক্রিয়</option>
              <option value="SUSPENDED">সাময়িক বহিষ্কৃত</option>
              <option value="TRANSFERRED">ছাড়পত্রপ্রাপ্ত (TC)</option>
              <option value="COMPLETED">শিক্ষা সম্পন্ন</option>
              <option value="WITHDRAWN">প্রত্যাহারকৃত</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Floating Toolbar */}
        {selectedStudentIds.length > 0 && (
          <div className="bg-[#052216] text-white p-4 rounded-xl shadow-xl border border-emerald-600/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <span className="bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-full text-xs">
                {selectedStudentIds.length} জন নির্বাচিত
              </span>
              <span className="text-xs text-emerald-200 font-medium">যৌথ অ্যাকশন সম্পাদন করুন:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowBulkAssignModal(true)}
                disabled={bulkLoading}
                className="bg-emerald-800 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-emerald-600/40"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>জামাত/শাখা বরাদ্দ</span>
              </button>

              <button
                onClick={() => setShowBulkResModal(true)}
                disabled={bulkLoading}
                className="bg-emerald-800 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-emerald-600/40"
              >
                <Home className="w-3.5 h-3.5 text-blue-300" />
                <span>আবাসিক স্থিতি</span>
              </button>

              <button
                onClick={handleBulkGenerateIdCards}
                disabled={bulkLoading}
                className="bg-emerald-800 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-emerald-600/40"
              >
                <Printer className="w-3.5 h-3.5 text-purple-300" />
                <span>আইডি কার্ড ব্যাচ</span>
              </button>

              <button
                onClick={handleBulkExportCsv}
                disabled={bulkLoading}
                className="bg-emerald-800 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-emerald-600/40"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-300" />
                <span>এক্সপোর্ট CSV</span>
              </button>

              <button
                onClick={() => setSelectedStudentIds([])}
                className="bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
              >
                বাতিল
              </button>
            </div>
          </div>
        )}

        {/* Student Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedStudentIds.length === students.length}
                      onChange={handleToggleSelectAll}
                      className="rounded text-[#0D5C3A] focus:ring-[#0D5C3A] w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">আইডি নম্বর</th>
                  <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                  <th className="py-3 px-4">জামাত ও শাখা</th>
                  <th className="py-3 px-4">রোল</th>
                  <th className="py-3 px-4">পিতা / অভিভাবক ও যোগাযোগ</th>
                  <th className="py-3 px-4">আবাসিক অবস্থা</th>
                  <th className="py-3 px-4">অবস্থা</th>
                  <th className="py-3 px-4 text-center sticky right-0 bg-slate-50 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                    অ্যাকশন
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      <span>তথ্য লোড হচ্ছে...</span>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <span>কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি।</span>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => handleToggleStudent(student.id)}
                          className="rounded text-[#0D5C3A] focus:ring-[#0D5C3A] w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded inline-block">
                          {student.studentIdNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{student.fullNameBn}</div>
                        {student.fullNameAr ? (
                          <div className="text-xs font-arabic text-emerald-800 font-medium">{student.fullNameAr}</div>
                        ) : (
                          <div className="text-xs text-slate-400">{student.fullNameEn}</div>
                        )}
                        {student.isOrphan && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-semibold">
                            এতিম
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{student.className}</div>
                        <div className="text-xs text-slate-500">{student.sectionName} • {student.sessionName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          #{student.rollNumber || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {(!student.primaryGuardianName || student.primaryGuardianName === "অজানা") &&
                        (!student.fatherNameBn || student.fatherNameBn === "অজানা") ? (
                          <div className="space-y-1">
                            <span className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              অভিভাবকের তথ্য অনুপস্থিত
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setGuardianEditTarget({
                                  id: student.id,
                                  name: student.fullNameBn,
                                  idNumber: student.studentIdNumber,
                                  guardianName: student.primaryGuardianName || student.fatherNameBn,
                                  phone: student.guardianPhone || student.fatherPhone,
                                })
                              }
                              className="text-[11px] font-bold text-[#0D5C3A] hover:underline flex items-center gap-1"
                            >
                              [ তথ্য আপডেট করুন ]
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="font-medium text-slate-800">{student.primaryGuardianName || student.fatherNameBn}</div>
                            <div className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{student.guardianPhone || student.fatherPhone || "যোগাযোগ নেই"}</span>
                            </div>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {student.residentialStatus === "RESIDENTIAL" ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-medium">
                            আবাসিক
                          </span>
                        ) : student.residentialStatus === "DAY_CARE" ? (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[11px] font-medium">
                            ডে-কেয়ার
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium">
                            অনাবাসিক
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {student.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            সক্রিয়
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            {student.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center sticky right-0 bg-white group-hover:bg-slate-50/80 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors border border-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>প্রোফাইল</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                পৃষ্ঠা {page} / {totalPages} (মোট {totalCount} জন)
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-40"
                >
                  পূর্ববর্তী
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-40"
                >
                  পরবর্তী
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* NEW STUDENT ADMISSION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  <span>নতুন ছাত্র ভর্তি ও স্থায়ী মাস্টার প্রোফাইল নিবন্ধন</span>
                </h3>
                <p className="text-xs text-slate-500">
                  স্থায়ী প্রাতিষ্ঠানিক আইডি: <span className="font-mono text-emerald-700">EHRJ-YYYY-XXXX</span>
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-3 gap-2 border-b pb-3 text-xs font-semibold text-center">
              <button
                type="button"
                onClick={() => setFormStep(1)}
                className={`py-1.5 rounded-lg ${
                  formStep === 1 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                }`}
              >
                ১. ব্যক্তিগত ও পরিচিতি
              </button>
              <button
                type="button"
                onClick={() => setFormStep(2)}
                className={`py-1.5 rounded-lg ${
                  formStep === 2 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                }`}
              >
                ২. পরিবার ও অভিভাবক
              </button>
              <button
                type="button"
                onClick={() => setFormStep(3)}
                className={`py-1.5 rounded-lg ${
                  formStep === 3 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                }`}
              >
                ৩. জামাত ও আবাসিক কাঠামো
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              {/* STEP 1: PERSONAL DETAILS */}
              {formStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ছাত্রের পূর্ণ নাম (বাংলায়) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="যেমনঃ মুহাম্মদ আব্দুল্লাহ"
                        value={formFullNameBn}
                        onChange={(e) => setFormFullNameBn(e.target.value)}
                        className="flex-1 p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleArabicSuggestion}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold flex items-center gap-1.5 transition-colors text-xs whitespace-nowrap"
                        title="বাংলা নাম থেকে স্বয়ংক্রিয় আরবি রূপান্তর"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>আরবি নাম সহায়তা</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        নাম (আরবি লিপিতে) — ঐচ্ছিক
                      </label>
                      <input
                        type="text"
                        placeholder="مُحَمَّد عَبْدُ اللهِ"
                        value={formFullNameAr}
                        onChange={(e) => setFormFullNameAr(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-arabic text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        ইংরেজি নাম (English)
                      </label>
                      <input
                        type="text"
                        placeholder="Muhammad Abdullah"
                        value={formFullNameEn}
                        onChange={(e) => setFormFullNameEn(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">জন্ম তারিখ *</label>
                      <input
                        type="date"
                        required
                        value={formDob}
                        onChange={(e) => setFormDob(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">জেন্ডার *</label>
                      <select
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="MALE">ছাত্র (ছেলে)</option>
                        <option value="FEMALE">ছাত্রী (মেয়ে)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">রক্তের গ্রুপ</label>
                      <select
                        value={formBloodGroup}
                        onChange={(e) => setFormBloodGroup(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">নির্বাচন করুন</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        জন্ম নিবন্ধন নম্বর (১৭ ডিজিট)
                      </label>
                      <input
                        type="text"
                        placeholder="২০০৮১৯..."
                        value={formBirthRegNo}
                        onChange={(e) => setFormBirthRegNo(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">জাতীয়তা</label>
                      <input
                        type="text"
                        defaultValue="Bangladeshi"
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setFormStep(2)}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1"
                    >
                      <span>পরবর্তী ধাপ</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: FAMILY & GUARDIAN */}
              {formStep === 2 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">পিতার নাম (বাংলা) *</label>
                      <input
                        type="text"
                        required
                        placeholder="পিতার নাম"
                        value={formFatherNameBn}
                        onChange={(e) => setFormFatherNameBn(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">পিতার মোবাইল নম্বর</label>
                      <input
                        type="tel"
                        placeholder="01845..."
                        value={formFatherPhone}
                        onChange={(e) => setFormFatherPhone(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">মাতার নাম (বাংলা) *</label>
                      <input
                        type="text"
                        required
                        placeholder="মাতার নাম"
                        value={formMotherNameBn}
                        onChange={(e) => setFormMotherNameBn(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">পিতার পেশা</label>
                      <input
                        type="text"
                        placeholder="ব্যবসা / কৃষক / শিক্ষক"
                        value={formFatherOccupation}
                        onChange={(e) => setFormFatherOccupation(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                    <span className="font-bold text-slate-700 block">প্রাথমিক অভিভাবক সম্পর্ক (Guardian Link)</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">অভিভাবকের নাম</label>
                        <input
                          type="text"
                          placeholder="পিতার নাম থেকে স্বয়ংক্রিয়"
                          value={formGuardianName}
                          onChange={(e) => setFormGuardianName(e.target.value)}
                          className="w-full p-2 rounded border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">সম্পর্ক</label>
                        <select
                          value={formGuardianRelation}
                          onChange={(e) => setFormGuardianRelation(e.target.value)}
                          className="w-full p-2 rounded border border-slate-300 bg-white"
                        >
                          <option value="FATHER">পিতা (Father)</option>
                          <option value="MOTHER">মাতা (Mother)</option>
                          <option value="BROTHER">ভাই (Brother)</option>
                          <option value="UNCLE">চাচা (Uncle)</option>
                          <option value="OTHER">অন্যান্য (Other)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">অভিভাবকের ফোন নম্বর</label>
                        <input
                          type="tel"
                          placeholder="01..."
                          value={formGuardianPhone}
                          onChange={(e) => setFormGuardianPhone(e.target.value)}
                          className="w-full p-2 rounded border border-slate-300 bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">বর্তমান ঠিকানা *</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="গ্রাম, ডাকঘর, থানা, জেলা"
                        value={formPresentAddress}
                        onChange={(e) => setFormPresentAddress(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">স্থায়ী ঠিকানা</label>
                      <textarea
                        rows={2}
                        placeholder="বর্তমান ঠিকানার অনুরূপ হলে ফাঁকা রাখতে পারেন"
                        value={formPermanentAddress}
                        onChange={(e) => setFormPermanentAddress(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setFormStep(1)}
                      className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                    >
                      পূর্ববর্তী
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStep(3)}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1"
                    >
                      <span>পরবর্তী ধাপ</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: ACADEMIC & RESIDENTIAL */}
              {formStep === 3 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">শিক্ষাবর্ষ / সেশন *</label>
                      <select
                        required
                        value={formSessionId}
                        onChange={(e) => setFormSessionId(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {sessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.isCurrent ? "(চলতি সেশন)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">জামাত / শ্রেণি *</label>
                      <select
                        required
                        value={formClassId}
                        onChange={(e) => setFormClassId(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameBn}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">শাখা (ঐচ্ছিক)</label>
                      <select
                        value={formSectionId}
                        onChange={(e) => setFormSectionId(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">সাধারণ / শাখা নির্বাচন</option>
                        {sections
                          .filter((s) => !formClassId || s.classId === formClassId)
                          .map((sec) => (
                            <option key={sec.id} value={sec.id}>
                              {sec.nameBn} ({sec.jamatClass?.nameBn})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">রোল নম্বর (ঐচ্ছিক)</label>
                      <input
                        type="number"
                        placeholder="খালি রাখলে স্বয়ংক্রিয় ক্রমিক ধার্য হবে"
                        value={formCustomRoll}
                        onChange={(e) => setFormCustomRoll(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">আবাসিক অবস্থা *</label>
                      <select
                        value={formResidentialStatus}
                        onChange={(e) => setFormResidentialStatus(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      >
                        <option value="NON_RESIDENTIAL">অনাবাসিক (Non-Residential)</option>
                        <option value="RESIDENTIAL">আবাসিক (Residential)</option>
                        <option value="DAY_CARE">ডে-কেয়ার (Day Care - খাদ্য বিলমুক্ত)</option>
                      </select>
                    </div>
                  </div>

                  {formResidentialStatus === "DAY_CARE" && (
                    <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span>
                        প্রাতিষ্ঠানিক নীতি: ডে-কেয়ার (DAY_CARE) শিক্ষার্থীদের জন্য কোনো খাদ্য বা বোডিং বিল প্রযোজ্য হবে না।
                      </span>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-700 block">কল্যাণ ও সামাজিক অবস্থা (Welfare Indicators)</span>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsOrphan}
                          onChange={(e) => setFormIsOrphan(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-slate-800 font-medium">শিক্ষার্থী এতিম (Orphan)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsFinanciallyWeak}
                          onChange={(e) => setFormIsFinanciallyWeak(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-slate-800 font-medium">আর্থিক অসচ্ছল / যাকাত ফান্ড সহায়তা যোগ্য</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setFormStep(2)}
                      className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                    >
                      পূর্ববর্তী
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{submitting ? "নিবন্ধন সম্পন্ন হচ্ছে..." : "ছাত্র ভর্তি ও সংরক্ষণ করুন"}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                একযোগে জামাত ও শাখা বরাদ্দ
              </h3>
              <button
                onClick={() => setShowBulkAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
              নির্বাচিত <span className="font-bold text-indigo-700">{selectedStudentIds.length}</span> জন শিক্ষার্থীকে নতুন সেশন, জামাত ও শাখায় বরাদ্দ দেওয়া হবে।
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">শিক্ষাবর্ষ / সেশন *</label>
                <select
                  value={bulkAssignSession}
                  onChange={(e) => setBulkAssignSession(e.target.value)}
                  className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">সেশন নির্বাচন করুন</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isCurrent ? "(চলতি সেশন)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">জামাত / শ্রেণি *</label>
                <select
                  value={bulkAssignClass}
                  onChange={(e) => setBulkAssignClass(e.target.value)}
                  className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">জামাত নির্বাচন করুন</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">শাখা (ঐচ্ছিক)</label>
                <select
                  value={bulkAssignSection}
                  onChange={(e) => setBulkAssignSection(e.target.value)}
                  className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">সাধারণ / শাখা নির্বাচন</option>
                  {sections
                    .filter((s) => !bulkAssignClass || s.classId === bulkAssignClass)
                    .map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.nameBn}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowBulkAssignModal(false)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={bulkLoading || !bulkAssignSession || !bulkAssignClass}
                  onClick={handleExecuteBulkAssign}
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 shadow"
                >
                  {bulkLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  বরাদ্দ নিশ্চিত করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Residential Status Modal */}
      {showBulkResModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-600" />
                আবাসিক অবস্থা পরিবর্তন
              </h3>
              <button
                onClick={() => setShowBulkResModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
              নির্বাচিত <span className="font-bold text-emerald-700">{selectedStudentIds.length}</span> জন শিক্ষার্থীর আবাসিক অবস্থা পরিবর্তন করা হবে।
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">নতুন আবাসিক ধরন *</label>
                <select
                  value={bulkResidentialStatus}
                  onChange={(e) => setBulkResidentialStatus(e.target.value)}
                  className="w-full text-sm p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="NON_RESIDENTIAL">অনাবাসিক (Non-Residential)</option>
                  <option value="RESIDENTIAL">আবাসিক (Residential)</option>
                  <option value="DAY_CARE">ডে-কেয়ার (Day Care - খাদ্য বিলমুক্ত)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowBulkResModal(false)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={handleExecuteBulkResidential}
                  className="px-5 py-2 text-sm bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 shadow"
                >
                  {bulkLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guardian Edit Modal */}
      {guardianEditTarget && (
        <UpdateGuardianModal
          isOpen={!!guardianEditTarget}
          studentId={guardianEditTarget.id}
          studentName={guardianEditTarget.name}
          studentIdNumber={guardianEditTarget.idNumber}
          initialGuardianName={guardianEditTarget.guardianName}
          initialPhone={guardianEditTarget.phone}
          onClose={() => setGuardianEditTarget(null)}
          onSuccess={() => {
            setBanner({ text: "অভিভাবকের তথ্য সফলভাবে আপডেট ও অডিট লগ সংরক্ষিত হয়েছে।", type: "success" });
            fetchStudents();
          }}
        />
      )}
    </div>
  );
}
