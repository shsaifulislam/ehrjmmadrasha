"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  Eye,
  Award,
  BookOpen,
  QrCode,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  FileText,
  AlertTriangle,
  X,
  History,
  FileCheck,
  CheckCircle,
} from "lucide-react";
import {
  TrainingProgram,
  TrainingSession,
  TrainingEnrollment,
  TrainingAttendanceRecord,
  TrainingCertificate,
  TrainingDashboardStats,
  TrainingAuditEntry,
  TrainingStatus,
  MandatoryStatus,
  TrainingType,
  DeliveryMethod,
} from "@/lib/training/types";

interface InstitutionalTrainingConsoleProps {
  initialTab?: "PROGRAMS" | "SESSIONS" | "PARTICIPANTS" | "ASSESSMENTS" | "CERTIFICATES" | "RENEWALS" | "AUDIT";
}

export default function InstitutionalTrainingConsole({
  initialTab = "PROGRAMS",
}: InstitutionalTrainingConsoleProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Core Data States
  const [stats, setStats] = useState<TrainingDashboardStats | null>(null);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [attendance, setAttendance] = useState<TrainingAttendanceRecord[]>([]);
  const [certificates, setCertificates] = useState<TrainingCertificate[]>([]);
  const [renewals, setRenewals] = useState<{ expiringSoon: TrainingCertificate[]; expired: TrainingCertificate[] }>({
    expiringSoon: [],
    expired: [],
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Selected Items & Modals
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showCertIssueModal, setShowCertIssueModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Form states
  const [newProgramForm, setNewProgramForm] = useState({
    titleBn: "",
    titleEn: "",
    trainingType: "TEACHING_METHODOLOGY" as TrainingType,
    deliveryMethod: "WORKSHOP" as DeliveryMethod,
    description: "",
    instructorName: "",
    instructorRole: "প্রশিক্ষক",
    totalHours: 8,
    mandatoryStatus: "RECOMMENDED" as MandatoryStatus,
    capacity: 25,
    attendanceThresholdPercentage: 80,
    requiresAssessment: true,
    passPercentage: 70,
    certificateValidityMonths: 24,
    objectivesBn: "",
  });

  const [sessionForm, setSessionForm] = useState({
    sessionNumber: 1,
    titleBn: "",
    titleEn: "",
    sessionDate: new Date().toISOString().split("T")[0],
    startTime: "09:30",
    endTime: "12:30",
    venue: "সেমিনার হল",
    facilitatorName: "",
    facilitatorRole: "উস্তাদ",
    capacity: 30,
  });

  const [assignForm, setAssignForm] = useState({
    employeeId: "EHRJ-EMP-2026-004",
    employeeName: "মাওলানা মোহাম্মদ আব্দুল্লাহ",
    designation: "সহকারী শিক্ষক",
    department: "হিফজ বিভাগ",
    isAssignment: true,
    notes: "প্রাতিষ্ঠানিক বাধ্যতামূলক অংশগ্রহণ",
  });

  const [attendanceForm, setAttendanceForm] = useState({
    sessionId: "",
    employeeId: "",
    employeeName: "",
    status: "PRESENT",
    notes: "",
  });

  const [qrVerifyInput, setQrVerifyInput] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, progsRes, sessRes, attRes, certsRes, renewRes] = await Promise.all([
        fetch("/api/training/stats"),
        fetch("/api/training/programs"),
        fetch("/api/training/sessions"),
        fetch("/api/training/attendance"),
        fetch("/api/training/certificates"),
        fetch("/api/training/renewals"),
      ]);

      const [statsData, progsData, sessData, attData, certsData, renewData] = await Promise.all([
        statsRes.json(),
        progsRes.json(),
        sessRes.json(),
        attRes.json(),
        certsRes.json(),
        renewRes.json(),
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (progsData.success) setPrograms(progsData.programs || []);
      if (sessData.success) setSessions(sessData.sessions || []);
      if (attData.success) setAttendance(attData.records || []);
      if (certsData.success) setCertificates(certsData.certificates || []);
      if (renewData.success) {
        setRenewals({
          expiringSoon: renewData.expiringSoon || [],
          expired: renewData.expired || [],
        });
      }
    } catch (err) {
      console.error("Failed to load training console data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const objectives = newProgramForm.objectivesBn
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/training/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProgramForm,
          objectivesBn: objectives.length > 0 ? objectives : ["দক্ষতা বৃদ্ধি ও প্রাতিষ্ঠানিক মান উন্নয়ন।"],
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || "প্রশিক্ষণ কার্যক্রম তৈরি হয়েছে।");
        setShowCreateModal(false);
        await loadData();
      } else {
        alert(data.error || "কার্যক্রম তৈরি করতে ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    }
  };

  const handleStatusTransition = async (programId: string, targetStatus: TrainingStatus) => {
    try {
      const res = await fetch(`/api/training/programs/${programId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus, reason: "অ্যাডমিন কমান্ড থেকে স্ট্যাটাস পরিবর্তন" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        await loadData();
        if (selectedProgram && selectedProgram.id === programId) {
          setSelectedProgram(data.program);
        }
      } else {
        alert(data.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;

    try {
      const res = await fetch("/api/training/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: selectedProgram.id,
          sessionData: {
            ...sessionForm,
            status: "SCHEDULED",
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("সেশন সফলভাবে শিডিউল করা হয়েছে এবং ক্যালেন্ডারে সিঙ্ক হয়েছে।");
        setShowSessionModal(false);
        await loadData();
      } else {
        alert(data.error || "সেশন তৈরি ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAssignParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;

    try {
      const res = await fetch(`/api/training/programs/${selectedProgram.id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...assignForm,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setShowAssignModal(false);
        await loadData();
      } else {
        alert(data.error || "তালিকাভুক্ত করতে ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;

    try {
      const res = await fetch("/api/training/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingProgramId: selectedProgram.id,
          sessionId: attendanceForm.sessionId,
          employeeId: attendanceForm.employeeId,
          employeeName: attendanceForm.employeeName,
          status: attendanceForm.status,
          notes: attendanceForm.notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`উপস্থিতি নথিভুক্ত হয়েছে। হালনাগাদকৃত হার: ${data.updatedRate}%`);
        setShowAttendanceModal(false);
        await loadData();
      } else {
        alert(data.error || "উপস্থিতি সংরক্ষণ ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleIssueCertificate = async (programId: string, employeeId: string) => {
    try {
      const res = await fetch("/api/training/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, employeeId }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        await loadData();
      } else {
        alert(data.error || "সনদপত্র প্রদান করা সম্ভব হয়নি।");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRenewCertificate = async (certificateId: string) => {
    try {
      const res = await fetch("/api/training/renewals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateId }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        await loadData();
      } else {
        alert(data.error || "সনদ নবায়ন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered Programs
  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      p.titleBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.trainingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.instructorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesType = typeFilter === "ALL" || p.trainingType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-800 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-600 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
          <span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Phase 39 — প্রাতিষ্ঠানিক প্রফেশনাল ডেভেলপমেন্ট ও সনদ ইঞ্জিন</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              শিক্ষক ও কর্মী প্রশিক্ষণ ও সার্টিফিকেশন হাব
            </h1>
            <p className="text-emerald-100/80 text-sm max-w-2xl leading-relaxed">
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সম্মানিত শিক্ষক ও কর্মচারীদের আধুনিক শিক্ষাদান পদ্ধতি,
              তাহফীজ পেডাগোজি, সাইবার সচেতনতা এবং প্রাতিষ্ঠানিক এসওপি অনুসরণের নির্ভরযোগ্য প্ল্যাটফর্ম।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-md transition duration-150"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন প্রশিক্ষণ তৈরি</span>
            </button>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl border border-white/10 backdrop-blur-sm transition duration-150"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">মোট প্রোগ্রাম</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{stats?.totalPrograms ?? 0}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">সার্বক্ষণিক ডাটাবেস</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">সক্রিয় প্রশিক্ষণ</div>
          <div className="text-2xl font-bold text-teal-700 mt-1">{stats?.activePrograms ?? 0}</div>
          <div className="text-[11px] text-teal-600 mt-0.5 font-medium">চলমান ও তালিকাভুক্তি</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">নির্ধারিত সেশন</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{stats?.scheduledSessionsCount ?? 0}</div>
          <div className="text-[11px] text-indigo-600 mt-0.5 font-medium">ক্যালেন্ডার সিঙ্কড</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">মোট অংশগ্রহণকারী</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">{stats?.totalEnrollments ?? 0}</div>
          <div className="text-[11px] text-purple-600 mt-0.5 font-medium">কর্মী ও শিক্ষকবৃন্দ</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">বাধ্যতামূলক সমাপ্তির হার</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats?.mandatoryCompletionRate ?? 0}%</div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">প্রাতিষ্ঠানিক অগ্রগতি</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">ইস্যুকৃত সনদ</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{stats?.certificatesIssuedCount ?? 0}</div>
          <div className="text-[11px] text-amber-600 mt-0.5 font-medium">যাচাইযোগ্য কিউআর</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">নবায়নযোগ্য/মেয়াদোত্তীর্ণ</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{stats?.expiringCertificatesCount ?? 0}</div>
          <div className="text-[11px] text-rose-600 mt-0.5 font-medium">আসন্ন ৩০ দিনে মেয়াদ শেষ</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-sm font-medium">
        <button
          onClick={() => setActiveTab("PROGRAMS")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "PROGRAMS"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>প্রশিক্ষণ কার্যক্রম ({programs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("SESSIONS")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "SESSIONS"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>সেশন ও সময়সূচী ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("PARTICIPANTS")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "PARTICIPANTS"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>অংশগ্রহণকারী ও হাজিরা</span>
        </button>

        <button
          onClick={() => setActiveTab("ASSESSMENTS")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "ASSESSMENTS"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>মূল্যায়ন ও পরীক্ষা</span>
        </button>

        <button
          onClick={() => setActiveTab("CERTIFICATES")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "CERTIFICATES"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>সনদপত্র ও ভেরিফিকেশন ({certificates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("RENEWALS")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "RENEWALS"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>সনদ নবায়ন ({renewals.expiringSoon.length + renewals.expired.length})</span>
        </button>
      </div>

      {/* TAB 1: PROGRAMS */}
      {activeTab === "PROGRAMS" && (
        <div className="space-y-4">
          {/* Controls: Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="প্রশিক্ষণ শিরোনাম, কোড বা প্রশিক্ষকের নাম দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ALL">সকল স্ট্যাটাস</option>
                <option value="DRAFT">DRAFT (খসড়া)</option>
                <option value="REVIEW">REVIEW (পর্যালোচনা)</option>
                <option value="APPROVED">APPROVED (অনুমোদিত)</option>
                <option value="PUBLISHED">PUBLISHED (প্রকাশিত)</option>
                <option value="REGISTRATION_OPEN">REGISTRATION_OPEN (উন্মুক্ত)</option>
                <option value="SCHEDULED">SCHEDULED (নির্ধারিত)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (চলমান)</option>
                <option value="COMPLETED">COMPLETED (সম্পন্ন)</option>
                <option value="CANCELLED">CANCELLED (বাতিল)</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ALL">সকল ধরন</option>
                <option value="QURAN_TAHFEEZ_PEDAGOGY">তাহফীজ পেডাগোজি</option>
                <option value="CHILD_SAFEGUARDING">শিশু সুরক্ষা</option>
                <option value="ERP_TRAINING">ইআরপি ও আইটি</option>
                <option value="HOSTEL_PROCESS_TRAINING">হোস্টেল ও স্বাস্থ্যবিধি</option>
                <option value="NEW_TEACHER_ORIENTATION">নতুন শিক্ষক ওরিয়েন্টেশন</option>
                <option value="TEACHING_METHODOLOGY">শিক্ষাদান পদ্ধতি</option>
              </select>
            </div>
          </div>

          {/* Program Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrograms.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-medium">বর্তমানে কোনো training program পাওয়া যায়নি।</p>
                <p className="text-xs text-slate-400 mt-1">ফিল্টার পরিবর্তন করুন বা নতুন প্রশিক্ষণ তৈরি করুন।</p>
              </div>
            ) : (
              filteredPrograms.map((prog) => {
                const statusBadgeColors: Record<string, string> = {
                  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
                  REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
                  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
                  PUBLISHED: "bg-teal-50 text-teal-700 border-teal-200",
                  REGISTRATION_OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  SCHEDULED: "bg-indigo-50 text-indigo-700 border-indigo-200",
                  IN_PROGRESS: "bg-purple-50 text-purple-700 border-purple-200",
                  COMPLETED: "bg-green-50 text-green-700 border-green-200",
                  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
                };

                return (
                  <div
                    key={prog.id}
                    className="bg-white rounded-xl border border-slate-200/90 hover:shadow-md transition p-5 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-mono text-slate-400 tracking-wide">
                          {prog.trainingCode}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {prog.mandatoryStatus === "MANDATORY" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                              বাধ্যতামূলক
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              statusBadgeColors[prog.status] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {prog.status}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                        {prog.titleBn}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{prog.description}</p>

                      <div className="space-y-1 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-400">প্রশিক্ষক:</span>
                          <span className="font-medium text-slate-700">{prog.instructorName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">মোট মেয়াদ:</span>
                          <span className="font-medium text-slate-700">{prog.totalHours} ঘন্টা</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">আসন সংখ্যা:</span>
                          <span className="font-medium text-slate-700">{prog.capacity} জন</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">সনদপত্রের মেয়াদ:</span>
                          <span className="font-medium text-slate-700">
                            {prog.certificateValidityMonths ? `${prog.certificateValidityMonths} মাস` : "আজীবন"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedProgram(prog)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>বিস্তারিত দেখুন</span>
                      </button>

                      {/* State Transition Actions */}
                      <div className="flex items-center gap-1">
                        {prog.status === "DRAFT" && (
                          <button
                            onClick={() => handleStatusTransition(prog.id, "REVIEW")}
                            className="px-2.5 py-1 text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg"
                          >
                            রিভিউ পাঠান
                          </button>
                        )}
                        {prog.status === "REVIEW" && (
                          <button
                            onClick={() => handleStatusTransition(prog.id, "APPROVED")}
                            className="px-2.5 py-1 text-[11px] font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg"
                          >
                            অনুমোদন দিন
                          </button>
                        )}
                        {prog.status === "APPROVED" && (
                          <button
                            onClick={() => handleStatusTransition(prog.id, "PUBLISHED")}
                            className="px-2.5 py-1 text-[11px] font-medium bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg"
                          >
                            প্রকাশ করুন
                          </button>
                        )}
                        {prog.status === "PUBLISHED" && (
                          <button
                            onClick={() => handleStatusTransition(prog.id, "REGISTRATION_OPEN")}
                            className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
                          >
                            রেজিস্ট্রেশন শুরু
                          </button>
                        )}
                        {prog.status === "REGISTRATION_OPEN" && (
                          <button
                            onClick={() => handleStatusTransition(prog.id, "SCHEDULED")}
                            className="px-2.5 py-1 text-[11px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm"
                          >
                            শিডিউল নির্ধারণ
                          </button>
                        )}
                        {prog.status === "SCHEDULED" && (
                          <button
                            onClick={() => handleStatusTransition(prog.id, "IN_PROGRESS")}
                            className="px-2.5 py-1 text-[11px] font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-sm"
                          >
                            শুরু করুন
                          </button>
                        )}
                        {prog.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => handleStatusTransition(prog.id, "COMPLETED")}
                            className="px-2.5 py-1 text-[11px] font-medium bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-sm"
                          >
                            সমাপ্ত ঘোষণা
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SESSIONS & CALENDAR */}
      {activeTab === "SESSIONS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="font-bold text-slate-900 text-base">প্রশিক্ষণ সেশন ও ক্যালেন্ডার সমন্বয়</h2>
              <p className="text-xs text-slate-500">
                Phase 33 প্রাতিষ্ঠানিক ক্যালেন্ডারের সাথে স্বয়ংক্রিয়ভাবে সিঙ্ককৃত সেশন রুটিন
              </p>
            </div>
            <button
              onClick={() => {
                if (programs.length > 0) {
                  setSelectedProgram(programs[0]);
                  setShowSessionModal(true);
                } else {
                  alert("প্রথমে একটি প্রশিক্ষণ কার্যক্রম তৈরি করুন।");
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>সেশন যোগ করুন</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">সেশন আইডি ও নম্বর</th>
                  <th className="py-3 px-4">প্রশিক্ষণ প্রোগ্রাম</th>
                  <th className="py-3 px-4">তারিখ ও সময়</th>
                  <th className="py-3 px-4">স্থান / ভেন্যু</th>
                  <th className="py-3 px-4">ফ্যাসিলিটেটর</th>
                  <th className="py-3 px-4">ক্যালেন্ডার সিঙ্ক</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      কোনো প্রশিক্ষণ সেশন নির্ধারিত নেই।
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {s.id} (সেশন #{s.sessionNumber})
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-[200px] truncate">
                        {s.programTitleBn || s.trainingCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{s.sessionDate}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {s.startTime} - {s.endTime}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{s.venue}</td>
                      <td className="py-3 px-4 text-slate-600">{s.facilitatorName}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Phase 33 সিঙ্কড
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PARTICIPANTS & ATTENDANCE */}
      {activeTab === "PARTICIPANTS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="font-bold text-slate-900 text-base">কর্মী তালিকাভুক্তি ও হাজিরা ব্যবস্থাপনা</h2>
              <p className="text-xs text-slate-500">
                Phase 13 এর কর্তৃত্বমূলক কর্মী রেফারেন্সের ভিত্তিতে প্রশিক্ষণ ট্র্যাকিং (পে-রোল বা সার্ভিস রেকর্ড অপরিবর্তিত)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (programs.length > 0) {
                    setSelectedProgram(programs[0]);
                    setShowAssignModal(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>কর্মী অ্যাসাইন করুন</span>
              </button>
              <button
                onClick={() => {
                  if (programs.length > 0) {
                    setSelectedProgram(programs[0]);
                    setShowAttendanceModal(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>হাজিরা এন্ট্রি</span>
              </button>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700">
              সর্বশেষ সংরক্ষিত প্রশিক্ষণ হাজিরা রেকর্ড
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-4">কর্মী আইডি ও নাম</th>
                  <th className="py-2.5 px-4">সেশন</th>
                  <th className="py-2.5 px-4">উপস্থিতি স্ট্যাটাস</th>
                  <th className="py-2.5 px-4">কিউআর ভেরিফাইড?</th>
                  <th className="py-2.5 px-4">চেক-ইন সময়</th>
                  <th className="py-2.5 px-4">নথিভুক্তকারী</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      কোনো সেশন হাজিরা রেকর্ড নেই।
                    </td>
                  </tr>
                ) : (
                  attendance.slice(0, 10).map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{att.employeeName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{att.employeeId}</div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{att.sessionId}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            att.status === "PRESENT"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : att.status === "LATE"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {att.qrVerified ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <QrCode className="w-3.5 h-3.5" /> হ্যাঁ (কিউআর)
                          </span>
                        ) : (
                          <span className="text-slate-400">ম্যানুয়াল</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">
                        {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString("bn-BD") : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{att.recordedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ASSESSMENTS */}
      {activeTab === "ASSESSMENTS" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h2 className="font-bold text-slate-900 text-base">পেশাগত প্রশিক্ষণ মূল্যায়ন ও কুইজ ওভারভিউ</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              গুরুত্বপূর্ণ মূলনীতি: পেশাগত মূল্যায়ন কখনোই সাধারণ ছাত্রদের নম্বর বা কর্মীদের বেতন হ্রাসে ব্যবহার হবে না।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs
              .filter((p) => p.assessment)
              .map((p) => (
                <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400">{p.trainingCode}</span>
                      <h3 className="font-bold text-slate-900 text-base mt-0.5">{p.titleBn}</h3>
                    </div>
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      পাস মার্ক: {p.assessment?.passPercentage}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{p.assessment?.titleBn}</p>

                  <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1.5 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">মোট প্রশ্নসংখ্যা:</span>
                      <span className="font-bold text-slate-800">{p.assessment?.questions.length} টি</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">মোট পূর্ণমান:</span>
                      <span className="font-bold text-slate-800">{p.assessment?.totalPoints} নম্বর</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">প্রশ্ন ধরন:</span>
                      <span className="font-bold text-slate-800">এমসিকিউ ও সত্য/মিথ্যা কুইজ</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>উত্তরপত্রের গোপনীয়তা নিশ্চিতকৃত (রিসপন্সে সঠিক উত্তর লুকানো থাকে)</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 5: CERTIFICATES */}
      {activeTab === "CERTIFICATES" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="font-bold text-slate-900 text-base">যাচাইযোগ্য প্রাতিষ্ঠানিক সনদপত্র রেজিস্টার</h2>
              <p className="text-xs text-slate-500">
                Phase 7/29 সনদ ও ভেরিফিকেশন প্রটোকল অনুসারে কিউআর কোডসহ সংরক্ষিত সার্টিফিকেট
              </p>
            </div>
            <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              স্বয়ংক্রিয় শর্ত: উপস্থিতি + মূল্যায়ন পাস = সনদপত্র প্রযোজ্য
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">সনদ নম্বর ও কোড</th>
                  <th className="py-3 px-4">প্রাপকের নাম ও পদবী</th>
                  <th className="py-3 px-4">প্রশিক্ষণ কার্যক্রম</th>
                  <th className="py-3 px-4">ইস্যু ও মেয়াদ</th>
                  <th className="py-3 px-4">ভেরিফিকেশন টোকেন</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      বর্তমানে কোনো সনদপত্র ইস্যু করা হয়নি।
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{cert.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{cert.employeeName}</div>
                        <div className="text-[11px] text-slate-500">
                          {cert.designation}, {cert.department}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-[180px] truncate">
                        {cert.trainingProgramTitleBn}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700">ইস্যু: {cert.issueDate}</div>
                        <div className="text-[11px] text-slate-400">
                          মেয়াদ: {cert.validUntil ? cert.validUntil : "আজীবন"}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700">
                        <a
                          href={`/verify/document/${cert.verificationToken}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{cert.verificationToken}</span>
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            cert.status === "VALID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : cert.status === "EXPIRING_SOON"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : cert.status === "EXPIRED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-teal-50 text-teal-700 border border-teal-200"
                          }`}
                        >
                          {cert.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {(cert.status === "EXPIRING_SOON" || cert.status === "EXPIRED") && (
                          <button
                            onClick={() => handleRenewCertificate(cert.id)}
                            className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow-sm"
                          >
                            নবায়ন করুন
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: RENEWALS */}
      {activeTab === "RENEWALS" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h2 className="font-bold text-slate-900 text-base">সনদপত্র মেয়াদ ও নবায়ন তদারকি</h2>
            <p className="text-xs text-slate-500">
              যেসব প্রশিক্ষণ সনদের মেয়াদ শেষ হয়েছে বা আসন্ন ৩০ দিনের মধ্যে উত্তীর্ণ হবে তাদের তালিকা
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expiring Soon */}
            <div className="bg-white rounded-xl border border-amber-200/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-800 text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>আসন্ন ৩০ দিনে মেয়াদোত্তীর্ণ ({renewals.expiringSoon.length})</span>
                </h3>
              </div>

              {renewals.expiringSoon.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">কোনো সনদ আসন্ন সময়ে মেয়াদোত্তীর্ণ হবে না।</p>
              ) : (
                <div className="space-y-2">
                  {renewals.expiringSoon.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{c.employeeName}</div>
                        <div className="text-slate-500">{c.trainingProgramTitleBn}</div>
                        <div className="text-[10px] text-amber-700 font-mono mt-0.5">মেয়াদ শেষ: {c.validUntil}</div>
                      </div>
                      <button
                        onClick={() => handleRenewCertificate(c.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow-sm"
                      >
                        নবায়ন
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Already Expired */}
            <div className="bg-white rounded-xl border border-rose-200/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-rose-800 text-sm flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>ইতিমধ্যে মেয়াদোত্তীর্ণ ({renewals.expired.length})</span>
                </h3>
              </div>

              {renewals.expired.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">কোনো মেয়াদোত্তীর্ণ সনদ নেই।</p>
              ) : (
                <div className="space-y-2">
                  {renewals.expired.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-rose-50/50 rounded-lg border border-rose-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{c.employeeName}</div>
                        <div className="text-slate-500">{c.trainingProgramTitleBn}</div>
                        <div className="text-[10px] text-rose-700 font-mono mt-0.5">উত্তীর্ণ: {c.validUntil}</div>
                      </div>
                      <button
                        onClick={() => handleRenewCertificate(c.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded shadow-sm"
                      >
                        নবায়ন
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TRAINING PROGRAM */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <span>নতুন প্রশিক্ষণ কার্যক্রম তৈরি (DRAFT)</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    প্রশিক্ষণের শিরোনাম (বাংলা) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProgramForm.titleBn}
                    onChange={(e) => setNewProgramForm({ ...newProgramForm, titleBn: e.target.value })}
                    placeholder="যেমন: আরবী ব্যাকরণ ও বালাগাত শিক্ষণ কর্মশালা"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    শিরোনাম (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProgramForm.titleEn}
                    onChange={(e) => setNewProgramForm({ ...newProgramForm, titleEn: e.target.value })}
                    placeholder="Arabic Grammar Pedagogy Workshop"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">প্রশিক্ষণের ধরন</label>
                  <select
                    value={newProgramForm.trainingType}
                    onChange={(e) =>
                      setNewProgramForm({ ...newProgramForm, trainingType: e.target.value as TrainingType })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="TEACHING_METHODOLOGY">শিক্ষাদান পদ্ধতি</option>
                    <option value="QURAN_TAHFEEZ_PEDAGOGY">তাহফীজ পেডাগোজি</option>
                    <option value="CHILD_SAFEGUARDING">শিশু সুরক্ষা</option>
                    <option value="ERP_TRAINING">ইআরপি প্রশিক্ষণ</option>
                    <option value="HOSTEL_PROCESS_TRAINING">হোস্টেল ও স্বাস্থ্যবিধি</option>
                    <option value="NEW_TEACHER_ORIENTATION">নতুন শিক্ষক ওরিয়েন্টেশন</option>
                    <option value="ADMINISTRATIVE_TRAINING">প্রশাসনিক প্রশিক্ষণ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ডেলিভারি মেথড</label>
                  <select
                    value={newProgramForm.deliveryMethod}
                    onChange={(e) =>
                      setNewProgramForm({ ...newProgramForm, deliveryMethod: e.target.value as DeliveryMethod })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="WORKSHOP">কর্মশালা (Workshop)</option>
                    <option value="IN_PERSON">সরাসরি শ্রেণীকক্ষে</option>
                    <option value="SEMINAR">সেমিনার</option>
                    <option value="HYBRID">হাইব্রিড</option>
                    <option value="ONLINE">অনলাইন</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">বাধ্যতামূলক স্ট্যাটাস</label>
                  <select
                    value={newProgramForm.mandatoryStatus}
                    onChange={(e) =>
                      setNewProgramForm({ ...newProgramForm, mandatoryStatus: e.target.value as MandatoryStatus })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="RECOMMENDED">পরামর্শকৃত (RECOMMENDED)</option>
                    <option value="MANDATORY">বাধ্যতামূলক (MANDATORY)</option>
                    <option value="OPTIONAL">ঐচ্ছিক (OPTIONAL)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">সংক্ষিপ্ত বিবরণ</label>
                <textarea
                  rows={2}
                  value={newProgramForm.description}
                  onChange={(e) => setNewProgramForm({ ...newProgramForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="প্রশিক্ষণ কার্যক্রমের উদ্দেশ্য ও বিষয়বস্তু..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">প্রধান প্রশিক্ষক *</label>
                  <input
                    type="text"
                    required
                    value={newProgramForm.instructorName}
                    onChange={(e) => setNewProgramForm({ ...newProgramForm, instructorName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোট সময় (ঘন্টা) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newProgramForm.totalHours}
                    onChange={(e) =>
                      setNewProgramForm({ ...newProgramForm, totalHours: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">আসন সংখ্যা</label>
                  <input
                    type="number"
                    min={5}
                    value={newProgramForm.capacity}
                    onChange={(e) =>
                      setNewProgramForm({ ...newProgramForm, capacity: parseInt(e.target.value) || 20 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ন্যূনতম উপস্থিতি (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={newProgramForm.attendanceThresholdPercentage}
                    onChange={(e) =>
                      setNewProgramForm({
                        ...newProgramForm,
                        attendanceThresholdPercentage: parseInt(e.target.value) || 80,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">সনদের মেয়াদ (মাস)</label>
                  <input
                    type="number"
                    value={newProgramForm.certificateValidityMonths}
                    onChange={(e) =>
                      setNewProgramForm({
                        ...newProgramForm,
                        certificateValidityMonths: parseInt(e.target.value) || 24,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  শিখন উদ্দেশ্য (প্রতি লাইনে একটি)
                </label>
                <textarea
                  rows={2}
                  value={newProgramForm.objectivesBn}
                  onChange={(e) => setNewProgramForm({ ...newProgramForm, objectivesBn: e.target.value })}
                  placeholder="১. আধুনিক দরস প্রস্তুতি কৌশল&#10;২. শিক্ষার্থীদের নৈতিক উন্নয়ন তদারকি"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  খসড়া সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SESSION */}
      {showSessionModal && selectedProgram && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>সেশন শিডিউল করুন — {selectedProgram.titleBn}</span>
              </h3>
              <button onClick={() => setShowSessionModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSession} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">সেশন নম্বর</label>
                  <input
                    type="number"
                    min={1}
                    value={sessionForm.sessionNumber}
                    onChange={(e) => setSessionForm({ ...sessionForm, sessionNumber: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.sessionDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শুরুর সময়</label>
                  <input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শেষের সময়</label>
                  <input
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">স্থান / ভেন্যু</label>
                <input
                  type="text"
                  value={sessionForm.venue}
                  onChange={(e) => setSessionForm({ ...sessionForm, venue: e.target.value })}
                  placeholder="যেমন: সেমিনার হল / রুম ১০২"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ফ্যাসিলিটেটর নাম</label>
                <input
                  type="text"
                  value={sessionForm.facilitatorName}
                  onChange={(e) => setSessionForm({ ...sessionForm, facilitatorName: e.target.value })}
                  placeholder={selectedProgram.instructorName}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  সংরক্ষণ ও ক্যালেন্ডার সিঙ্ক
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN PARTICIPANT */}
      {showAssignModal && selectedProgram && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>কর্মী তালিকাভুক্তি — {selectedProgram.titleBn}</span>
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignParticipant} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">কর্মী আইডি (Phase 13) *</label>
                <input
                  type="text"
                  required
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">কর্মীর নাম *</label>
                <input
                  type="text"
                  required
                  value={assignForm.employeeName}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পদবী</label>
                  <input
                    type="text"
                    value={assignForm.designation}
                    onChange={(e) => setAssignForm({ ...assignForm, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">বিভাগ</label>
                  <input
                    type="text"
                    value={assignForm.department}
                    onChange={(e) => setAssignForm({ ...assignForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  অ্যাসাইন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD ATTENDANCE */}
      {showAttendanceModal && selectedProgram && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>সেশন উপস্থিতি এন্ট্রি</span>
              </h3>
              <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordAttendance} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">সেশন নির্বাচন করুন *</label>
                <select
                  required
                  value={attendanceForm.sessionId}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, sessionId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="">নির্বাচন করুন</option>
                  {selectedProgram.sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} (সেশন #{s.sessionNumber} - {s.sessionDate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">কর্মী আইডি *</label>
                <input
                  type="text"
                  required
                  value={attendanceForm.employeeId}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, employeeId: e.target.value })}
                  placeholder="যেমন: EHRJ-EMP-2026-001"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">কর্মীর নাম</label>
                <input
                  type="text"
                  value={attendanceForm.employeeName}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, employeeName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">উপস্থিতি স্ট্যাটাস</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="PRESENT">PRESENT (উপস্থিত)</option>
                  <option value="LATE">LATE (দেরিতে উপস্থিত)</option>
                  <option value="PARTIAL">PARTIAL (আংশিক)</option>
                  <option value="EXCUSED">EXCUSED (অনুমোদিত ছুটি)</option>
                  <option value="ABSENT">ABSENT (অনুপস্থিত)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROGRAM DETAILS */}
      {selectedProgram && !showSessionModal && !showAssignModal && !showAttendanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-mono text-slate-400">{selectedProgram.trainingCode}</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedProgram.titleBn}</h3>
                <p className="text-xs text-slate-500">{selectedProgram.titleEn}</p>
              </div>
              <button onClick={() => setSelectedProgram(null)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="text-slate-600">{selectedProgram.description}</p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <div className="text-slate-400 text-[10px]">প্রশিক্ষক</div>
                  <div className="font-semibold text-slate-800">{selectedProgram.instructorName}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">মোট ঘন্টা</div>
                  <div className="font-semibold text-slate-800">{selectedProgram.totalHours} ঘন্টা</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">উপস্থিতি শর্ত</div>
                  <div className="font-semibold text-slate-800">{selectedProgram.attendanceThresholdPercentage}%</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">পাস মার্ক</div>
                  <div className="font-semibold text-slate-800">{selectedProgram.passPercentage}%</div>
                </div>
              </div>

              {/* Modules list */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">মডিউলসমূহ:</h4>
                <div className="space-y-1.5">
                  {selectedProgram.modules.map((m) => (
                    <div key={m.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="font-semibold text-slate-800">
                        মডিউল {m.moduleNumber}: {m.titleBn}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{m.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sessions */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-slate-900">সেশন তালিকা ({selectedProgram.sessions.length}):</h4>
                  <button
                    onClick={() => setShowSessionModal(true)}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    + নতুন সেশন
                  </button>
                </div>
                <div className="space-y-1.5">
                  {selectedProgram.sessions.map((s) => (
                    <div key={s.id} className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                      <span>
                        সেশন #{s.sessionNumber}: {s.sessionDate} ({s.startTime} - {s.endTime})
                      </span>
                      <span className="font-medium text-slate-600">{s.venue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedProgram(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
