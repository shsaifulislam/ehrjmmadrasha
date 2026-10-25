"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  User,
  Users,
  BookOpen,
  Calendar,
  Award,
  DollarSign,
  FileText,
  ShieldCheck,
  Send,
  Bell,
  LifeBuoy,
  ChevronRight,
  LogOut,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  ExternalLink,
  KeyRound,
  GraduationCap,
  RefreshCw,
  Edit3,
  CalendarDays,
  FileCheck,
  Smartphone,
  BookOpenCheck,
  DoorOpen,
  Building,
  Bus,
  PhoneCall,
  Headphones,
} from "lucide-react";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import { GuardianActiveSessionsModal } from "@/components/auth/GuardianActiveSessionsModal";
import GuardianAttendanceViewer from "@/components/attendance/GuardianAttendanceViewer";
import GuardianResultsViewer from "@/components/exams/GuardianResultsViewer";
import GuardianFinanceViewer from "@/components/finance/GuardianFinanceViewer";
import GuardianDocumentsViewer from "@/components/documents/GuardianDocumentsViewer";
import { GuardianRoutineViewer } from "@/components/routine/GuardianRoutineViewer";
import PortalNotificationsViewer from "@/components/communication/PortalNotificationsViewer";
import GuardianHelpdeskHub from "@/components/helpdesk/GuardianHelpdeskHub";
import GuardianHifzDiaryViewer from "@/components/hifz/GuardianHifzDiaryViewer";
import GuardianGatePassViewer from "@/components/gatepass/GuardianGatePassViewer";
import GuardianHostelViewer from "@/components/hostel/GuardianHostelViewer";
import GuardianTransportViewer from "@/components/transport/GuardianTransportViewer";
import GuardianLibraryViewer from "@/components/library/GuardianLibraryViewer";
import GuardianCalendarViewer from "@/components/calendar/GuardianCalendarViewer";
import PortalTabErrorBoundary from "@/components/common/PortalTabErrorBoundary";
import UserGuideModal from "@/components/common/UserGuideModal";
import { INSTITUTION_INFO } from "@/lib/constants";

interface PortalApplication {
  id: string;
  applicationNumber: string;
  studentNameBn: string;
  studentNameEn?: string;
  className: string;
  sessionName: string;
  desiredResidentialStatus: string;
  status: string;
  verificationStatus: string | null;
  submittedAt: string;
  examInterviewScheduledAt?: string | null;
  examInterviewResult?: string | null;
  reviewNotes?: string | null;
  remarks?: string | null;
}

interface Child {
  id: string;
  studentIdNumber: string;
  fullNameBn: string;
  fullNameEn: string | null;
  residentialStatus: string;
  photoUrl: string | null;
  className: string | null;
  sectionName: string | null;
  rollNumber: number | null;
}

interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface LeaveRequestItem {
  id: string;
  studentId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  adminNote?: string | null;
  createdAt: string;
  student?: {
    fullNameBn: string;
    studentIdNumber: string;
  };
}

interface CorrectionRequestItem {
  id: string;
  studentId: string;
  studentIdNumber: string;
  requestedFields: Record<string, { oldValue: any; requestedValue: any }>;
  reasonBn: string;
  status: string;
  submittedAt: string;
  reviewNotes?: string;
}

export default function GuardianPortalPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [childrenLoading, setChildrenLoading] = useState(true);

  // Admission applications state
  const [applications, setApplications] = useState<PortalApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  // Active navigation tab (Canonical tabs + special routes)
  const [activeTab, setActiveTab] = useState<
    | "DASHBOARD"
    | "HIFZ"
    | "GATEPASS"
    | "ATTENDANCE"
    | "RESULTS"
    | "ROUTINE"
    | "FINANCE"
    | "DOCUMENTS"
    | "REQUESTS"
    | "NOTIFICATIONS"
    | "CHILDREN"
    | "ACADEMIC"
    | "APPLICATIONS"
    | "HOSTEL"
    | "TRANSPORT"
    | "LIBRARY"
    | "CALENDAR"
  >("DASHBOARD");

  // Requests Section Sub-tab
  const [requestsSubTab, setRequestsSubTab] = useState<"LEAVE" | "CORRECTION" | "HELPDESK">("LEAVE");

  // Real Leave Request State
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveTargetStudentId, setLeaveTargetStudentId] = useState("");
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveMsg, setLeaveMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequestItem[]>([]);
  const [loadingLeaveHistory, setLoadingLeaveHistory] = useState(false);

  // Real Profile Correction State
  const [correctionField, setCorrectionField] = useState("fullNameBn");
  const [correctionNewValue, setCorrectionNewValue] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionTargetStudentId, setCorrectionTargetStudentId] = useState("");
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionMsg, setCorrectionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [correctionHistory, setCorrectionHistory] = useState<CorrectionRequestItem[]>([]);
  const [loadingCorrectionHistory, setLoadingCorrectionHistory] = useState(false);

  // Dynamic Dashboard State
  const [dynamicAttendanceRate, setDynamicAttendanceRate] = useState<string | null>(null);
  const [dynamicLatestResult, setDynamicLatestResult] = useState<{ title: string; grade: string } | null>(null);
  const [dynamicDueAmount, setDynamicDueAmount] = useState<number | null>(null);
  const [loadingDashboardMetrics, setLoadingDashboardMetrics] = useState(false);

  // Security modals
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // 1. Check Authenticated Session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  // 2. Fetch Linked Children
  useEffect(() => {
    if (user) {
      setChildrenLoading(true);
      fetch("/api/portal/children")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.children && data.children.length > 0) {
            setChildren(data.children);
            const firstId = data.children[0].id;
            setSelectedChildId((prev) => prev || firstId);
            setLeaveTargetStudentId((prev) => prev || firstId);
            setCorrectionTargetStudentId((prev) => prev || firstId);
          }
        })
        .catch(() => {})
        .finally(() => setChildrenLoading(false));
    }
  }, [user]);

  // Sync target child when selected child changes or when children load
  useEffect(() => {
    if (selectedChildId) {
      setLeaveTargetStudentId(selectedChildId);
      setCorrectionTargetStudentId(selectedChildId);
    } else if (children.length > 0) {
      const defaultId = children[0].id;
      setSelectedChildId(defaultId);
      setLeaveTargetStudentId(defaultId);
      setCorrectionTargetStudentId(defaultId);
    }
  }, [selectedChildId, children]);

  // 3. Fetch Admission Applications
  useEffect(() => {
    if (user) {
      setApplicationsLoading(true);
      fetch("/api/portal/applications")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.applications) {
            setApplications(data.applications);
          }
        })
        .catch(() => {})
        .finally(() => setApplicationsLoading(false));
    }
  }, [user]);

  // Check URL query param for active tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        const upper = tabParam.toUpperCase();
        const validTabs = [
          "DASHBOARD",
          "HIFZ",
          "GATEPASS",
          "ATTENDANCE",
          "RESULTS",
          "ROUTINE",
          "FINANCE",
          "DOCUMENTS",
          "REQUESTS",
          "NOTIFICATIONS",
          "CHILDREN",
          "ACADEMIC",
          "APPLICATIONS",
          "HOSTEL",
          "TRANSPORT",
          "LIBRARY",
          "CALENDAR",
        ];
        if (validTabs.includes(upper)) {
          setActiveTab(upper as any);
        }
      }
    }
  }, []);

  const activeChild = children.find((c) => c.id === selectedChildId) || children[0] || null;

  const renderApplicationsList = () => {
    if (applicationsLoading) {
      return (
        <div className="text-center py-12 space-y-3 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="w-8 h-8 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">ভর্তি আবেদন তালিকা লোড হচ্ছে...</p>
        </div>
      );
    }

    if (applications.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3 shadow-sm">
          <GraduationCap className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">কোনো ভর্তি আবেদন পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            আপনি এখনও কোনো শিক্ষার্থীর ভর্তির আবেদন সম্পন্ন করেননি।
          </p>
          <div className="pt-2">
            <Link
              href="/admission/apply"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs font-bold shadow transition"
            >
              ভর্তি আবেদন করুন
            </Link>
          </div>
        </div>
      );
    }

    const getStatusBadge = (status: string) => {
      switch (status) {
        case "APPROVED":
          return { label: "অনুমোদিত (ভর্তি সম্পন্ন)", bg: "bg-emerald-100 text-emerald-800 border-emerald-300" };
        case "EXAM_INTERVIEW":
          return { label: "মৌখিক পরীক্ষা / ভাইভা নির্ধারিত", bg: "bg-purple-100 text-purple-800 border-purple-300" };
        case "UNDER_REVIEW":
          return { label: "পর্যালোচনাধীন", bg: "bg-blue-100 text-blue-800 border-blue-300" };
        case "REJECTED":
          return { label: "অননুমোদিত", bg: "bg-rose-100 text-rose-800 border-rose-300" };
        default:
          return { label: "দাখিলকৃত (যাচাই প্রক্রিয়াধীন)", bg: "bg-amber-100 text-amber-800 border-amber-300" };
      }
    };

    return (
      <div className="perspective-1000 grid grid-cols-1 md:grid-cols-2 gap-4">
        {applications.map((app) => {
          const badge = getStatusBadge(app.status);
          return (
            <div
              key={app.id}
              className="card-3d bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#D4AF37] p-5 shadow-sm hover:shadow-xl space-y-4 transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0D5C3A] via-[#D4AF37] to-[#0D5C3A]" />
              
              <div className="flex items-start justify-between gap-3 pt-1">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {app.applicationNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                  <h3 className="font-black text-base text-slate-900 mt-2 font-serif-bn">
                    {app.studentNameBn}
                  </h3>
                  {app.studentNameEn && (
                    <p className="text-xs text-slate-500 font-medium">{app.studentNameEn}</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold">আবেদনকৃত শ্রেণি:</span>
                  <span className="font-black text-slate-800">{app.className}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold">সেশন:</span>
                  <span className="font-black text-slate-800">{app.sessionName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold">আবাসিক অবস্থা:</span>
                  <span className="font-bold text-slate-800">
                    {app.desiredResidentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold">জমাদানের তারিখ:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {new Date(app.submittedAt).toLocaleDateString("bn-BD")}
                  </span>
                </div>
              </div>

              {app.examInterviewScheduledAt && (
                <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2 text-xs text-purple-900 font-semibold">
                  <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span>
                    ভাইভা শিডিউল: {new Date(app.examInterviewScheduledAt).toLocaleString("bn-BD")}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                <Link
                  href={`/admission/track?trackingId=${app.applicationNumber}`}
                  className="text-xs font-bold text-[#0D5C3A] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  লাইভ স্ট্যাটাস ট্র্যাক
                </Link>
                <Link
                  href={`/admission/track?trackingId=${app.applicationNumber}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] text-xs font-bold transition flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  স্লিপ দেখুন
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 4. Fetch Dynamic Dashboard Metrics
  useEffect(() => {
    if (!activeChild?.id) return;
    setLoadingDashboardMetrics(true);
    // Clear previous child's metrics immediately during transition
    setDynamicAttendanceRate(null);
    setDynamicLatestResult(null);
    setDynamicDueAmount(null);

    const controller = new AbortController();
    let isCurrent = true;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Fetch Attendance summary
    const pAttendance = fetch(
      `/api/portal/attendance?studentId=${activeChild.id}&month=${currentMonth}&year=${currentYear}`,
      { signal: controller.signal }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isCurrent) return;
        if (data?.success && data?.summary) {
          const totalDays = data.summary.totalDays || 0;
          const present = data.summary.present || 0;
          const late = data.summary.late || 0;
          if (totalDays > 0) {
            const pct = (((present + late) / totalDays) * 100).toFixed(1);
            setDynamicAttendanceRate(`${pct}%`);
          } else {
            setDynamicAttendanceRate("তথ্য নেই");
          }
        } else {
          setDynamicAttendanceRate("তথ্য নেই");
        }
      })
      .catch((err) => {
        if (err.name === "AbortError" || controller.signal.aborted) return;
        if (isCurrent) setDynamicAttendanceRate("তথ্য নেই");
      });

    // Fetch Latest Result
    const pResults = fetch(`/api/portal/results?studentId=${activeChild.id}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isCurrent) return;
        if (data?.success && data?.results && data.results.length > 0) {
          const latest = data.results[0];
          setDynamicLatestResult({
            title: latest.examNameBn || latest.examTitle || "সাময়িক পরীক্ষা",
            grade: latest.gradeBn || latest.gpa || "মুমতাজ",
          });
        } else {
          setDynamicLatestResult(null);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError" || controller.signal.aborted) return;
        if (isCurrent) setDynamicLatestResult(null);
      });

    // Fetch Finance Due
    const pFinance = fetch(`/api/portal/finance?studentId=${activeChild.id}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isCurrent) return;
        if (data?.success && data?.summary) {
          setDynamicDueAmount(data.summary.totalDue || 0);
        } else {
          setDynamicDueAmount(null);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError" || controller.signal.aborted) return;
        if (isCurrent) setDynamicDueAmount(null);
      });

    Promise.allSettled([pAttendance, pResults, pFinance]).finally(() => {
      if (isCurrent) {
        setLoadingDashboardMetrics(false);
      }
    });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [activeChild?.id]);

  // 5. Fetch Leave History
  const fetchLeaveHistory = async () => {
    setLoadingLeaveHistory(true);
    try {
      const res = await fetch("/api/portal/leave-requests");
      const json = await res.json();
      if (json.success && json.data) {
        setLeaveHistory(json.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingLeaveHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "REQUESTS" && requestsSubTab === "LEAVE") {
      fetchLeaveHistory();
    }
  }, [activeTab, requestsSubTab]);

  // 6. Fetch Profile Correction History
  const fetchCorrectionHistory = async () => {
    setLoadingCorrectionHistory(true);
    try {
      const res = await fetch("/api/portal/data-correction");
      const json = await res.json();
      if (json.success && json.data) {
        setCorrectionHistory(json.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingCorrectionHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "REQUESTS" && requestsSubTab === "CORRECTION") {
      fetchCorrectionHistory();
    }
  }, [activeTab, requestsSubTab]);

  // Submit Leave Request (Real DB persistence)
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveStudentId =
      leaveTargetStudentId ||
      selectedChildId ||
      activeChild?.id ||
      children[0]?.id ||
      "";

    if (!effectiveStudentId || !leaveStartDate || !leaveEndDate || !leaveReason.trim()) {
      setLeaveMsg({ text: "সকল তথ্য সঠিকভাবে পূরণ করুন।", type: "error" });
      return;
    }
    setSubmittingLeave(true);
    setLeaveMsg(null);
    try {
      const res = await fetch("/api/portal/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: effectiveStudentId,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          reason: leaveReason.trim()
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setLeaveMsg({ text: json.messageBn || "আবেদন সফলভাবে জমা হয়েছে।", type: "success" });
        setLeaveReason("");
        setLeaveStartDate("");
        setLeaveEndDate("");
        await fetchLeaveHistory();
      } else {
        setLeaveMsg({ text: json.error || "ছুটির আবেদন জমা দিতে ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setLeaveMsg({ text: err.message || "সার্ভার সংযোগে ত্রুটি।", type: "error" });
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Submit Profile Correction Request
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveStudentId =
      correctionTargetStudentId ||
      selectedChildId ||
      activeChild?.id ||
      children[0]?.id ||
      "";

    if (!effectiveStudentId || !correctionNewValue.trim() || !correctionReason.trim()) {
      setCorrectionMsg({ text: "সংশোধিত তথ্য ও কারণ উল্লেখ করুন।", type: "error" });
      return;
    }
    setSubmittingCorrection(true);
    setCorrectionMsg(null);
    try {
      const res = await fetch("/api/portal/data-correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: effectiveStudentId,
          requestedFields: {
            [correctionField]: {
              oldValue: "বিদ্যমান তথ্য",
              requestedValue: correctionNewValue.trim()
            }
          },
          reasonBn: correctionReason.trim()
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCorrectionMsg({ text: json.messageBn || "তথ্য সংশোধনের আবেদন সফলভাবে জমা হয়েছে।", type: "success" });
        setCorrectionNewValue("");
        setCorrectionReason("");
        await fetchCorrectionHistory();
      } else {
        setCorrectionMsg({ text: json.error || "আবেদন জমা দিতে ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setCorrectionMsg({ text: err.message || "সার্ভার সংযোগে ত্রুটি।", type: "error" });
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // If user is not authenticated, show professional portal sign-in prompt
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
        <Navbar />

        <main className="flex-1 flex items-center justify-center py-16 px-4 relative overflow-hidden bg-islamic-pattern">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="perspective-1000 max-w-xl w-full relative z-10">
            <div className="card-3d-gold glass-morphic-gold rounded-3xl border-2 border-[#D4AF37]/70 shadow-2xl overflow-hidden text-center p-8 sm:p-10 space-y-6 relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0D5C3A] via-[#D4AF37] to-[#0D5C3A]" />

              <div className="space-y-2">
                <span className="font-arabic text-amber-800 text-sm tracking-wide block">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 border-2 border-[#D4AF37] mx-auto flex items-center justify-center text-[#0D5C3A] shadow-lg shadow-amber-900/10 animate-float-slow">
                  <Users className="w-10 h-10 text-[#0D5C3A]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-[11px] font-bold text-[#0D5C3A] bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full uppercase tracking-wider inline-block">
                    সুরক্ষিত ডিজিটাল ক্যাম্পাস
                  </span>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-3 py-0.5 rounded-full">
                    স্থাপিত: ২০২১ ইং
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif-bn">
                  অভিভাবক ও শিক্ষার্থী পোর্টাল
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                  সন্তানের প্রাতিষ্ঠানিক অগ্রগতি, দৈনিক বায়োমেট্রিক উপস্থিতি, পরীক্ষার ফলাফল ও ফি সংক্রান্ত তথ্যের সার্বিক তদারকির জন্য অভিভাবক অ্যাকাউন্টে লগইন করুন।
                </p>
              </div>

              <div className="p-5 bg-gradient-to-br from-emerald-50/60 to-amber-50/40 rounded-2xl border border-emerald-200/60 text-left text-xs text-slate-700 space-y-2.5 shadow-inner">
                <div className="flex items-center gap-2 font-bold text-[#0D5C3A]">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>পোর্টালে সংরক্ষিত সেবাসমূহ:</span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 text-[11px] font-medium pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>দৈনিক বায়োমেট্রিক উপস্থিতি</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                    <span>অফিসিয়াল মার্কশিট ও ফলাফল</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>ডিজিটাল মানি রসিদ ও বিকাশ ফি</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                    <span>অনলাইন ছুটি ও প্রত্যয়ন আবেদন</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/login?tab=guardian"
                  className="btn-gold w-full sm:w-auto px-7 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 active:scale-95 transition-all"
                >
                  <Users className="w-4 h-4 text-stone-900" />
                  <span>অভিভাবক সাইন ইন</span>
                  <ChevronRight className="w-4 h-4 text-stone-900" />
                </Link>
                <Link
                  href="/login?tab=student"
                  className="bg-emerald-900 hover:bg-emerald-800 text-white w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <GraduationCap className="w-4 h-4 text-amber-300" />
                  <span>শিক্ষার্থী লগইন</span>
                </Link>
                <Link
                  href="/login?tab=register"
                  className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <span>নিবন্ধন</span>
                </Link>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-center gap-4 text-xs text-slate-500">
                <Link href="/admission/apply" className="hover:text-[#0D5C3A] font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>অনলাইন ভর্তি আবেদন</span>
                </Link>
                <span>•</span>
                <Link href="/admission/track" className="hover:text-[#0D5C3A] font-medium flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  <span>আবেদন ট্র্যাকিং</span>
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white w-full max-w-full overflow-x-clip">
      <Navbar />

      {/* 1. PORTAL HERO & ACTIVE CHILD SWITCHER (3D GOLDEN ISLAMIC ELEVATION) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#03180F] via-[#073823] to-[#052618] text-white py-8 px-4 sm:px-6 border-b border-[#D4AF37]/30 shadow-xl">
        <div className="absolute inset-0 bg-islamic-pattern opacity-10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto space-y-6">
          {/* Top Bar: Welcome + User Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-amber-400/20 text-amber-300 border border-[#D4AF37]/50 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  অভিভাবক কেন্দ্রীয় ড্যাশবোর্ড (Guardian Portal)
                </span>
                <span className="text-xs text-amber-200/90 font-mono bg-black/25 px-2.5 py-0.5 rounded-full border border-white/10">
                  শিক্ষাবর্ষ ২০২৬
                </span>
                <span className="text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  স্থাপিত: ২০২১ ইং
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black font-display text-white tracking-tight flex items-center gap-2">
                আস-সালামু আলাইকুম, {user?.name || "সম্মানিত অভিভাবক"}
              </h1>
            </div>

            {/* Quick Status Pill & Security Actions */}
            <div className="flex items-center flex-wrap gap-2.5">
              <div className="bg-emerald-950/70 backdrop-blur-md border border-[#D4AF37]/40 rounded-2xl px-4 py-2 flex items-center gap-3 text-xs shadow-md">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white font-semibold">
                  সংযুক্ত সন্তান: <strong className="text-amber-300 font-bold">{children.length}</strong> জন
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 hover:border-amber-400/50 text-white rounded-2xl px-3.5 py-2 flex items-center gap-2 text-xs font-bold transition shadow-md"
                title="অভিভাবক ব্যবহার সহায়িকা ও নির্দেশিকা"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-300" />
                <span>ব্যবহার সহায়িকা</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSessionsModal(true)}
                className="bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 hover:border-amber-400/50 text-white rounded-2xl px-3.5 py-2 flex items-center gap-2 text-xs font-bold transition shadow-md"
                title="সক্রিয় সেশন ও ডিভাইস নিরাপত্তা"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
                <span>সক্রিয় সেশন</span>
              </button>

              <button
                type="button"
                onClick={() => setShowChangePasswordModal(true)}
                className="bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 hover:border-amber-400/50 text-white rounded-2xl px-3.5 py-2 flex items-center gap-2 text-xs font-bold transition shadow-md"
                title="পাসওয়ার্ড পরিবর্তন করুন"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                <span>পাসওয়ার্ড</span>
              </button>
            </div>
          </div>

          {/* Child Switcher Component (3D Multi-Child Navigation Cards) */}
          {children.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  সন্তান নির্বাচন করুন (Student Profile Switcher):
                </span>
                {children.length > 1 && (
                  <span className="text-[11px] text-emerald-200/90 font-medium bg-black/20 px-2 py-0.5 rounded-lg border border-white/10">
                    সন্তান পরিবর্তনে যেকোনো কার্ডে ক্লিক করুন
                  </span>
                )}
              </div>

              <div className="perspective-1000 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {children.map((child) => {
                  const isSelected = child.id === activeChild?.id;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setSelectedChildId(child.id)}
                      className={`card-3d text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 relative overflow-hidden ${
                        isSelected
                          ? "bg-white text-slate-900 border-2 border-[#D4AF37] shadow-xl ring-2 ring-[#D4AF37]/50 scale-[1.01]"
                          : "bg-emerald-950/70 text-white border-emerald-800/80 hover:bg-emerald-900/80 hover:border-[#D4AF37]/50 backdrop-blur-md shadow-md"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#D4AF37] to-emerald-600" />
                      )}

                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-base border shadow-md ${
                            isSelected
                              ? "bg-gradient-to-br from-[#0D5C3A] to-[#063321] text-amber-300 border-[#D4AF37]"
                              : "bg-emerald-900/90 text-emerald-100 border-emerald-700"
                          }`}
                        >
                          {child.fullNameBn.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-xs sm:text-sm leading-tight truncate">
                            {child.fullNameBn}
                          </h4>
                          <p
                            className={`text-[11px] mt-0.5 font-mono truncate ${
                              isSelected ? "text-slate-600 font-semibold" : "text-emerald-300"
                            }`}
                          >
                            আইডি: {child.studentIdNumber}
                          </p>
                          <p
                            className={`text-[11px] mt-0.5 font-medium truncate ${
                              isSelected ? "text-emerald-800 font-bold" : "text-emerald-200"
                            }`}
                          >
                            {child.className || "শ্রেণি অনির্ধারিত"} • রোল: {child.rollNumber || "১"}
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span className="badge-3d bg-gradient-to-r from-[#0D5C3A] to-[#158052] text-amber-300 border border-[#D4AF37] text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm">
                            সক্রিয়
                          </span>
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-emerald-400/60 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. SUB-NAVIGATION BAR (Canonical Tabs, Bengali-first, Glassmorphic) */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 overflow-x-auto sticky top-[65px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-1.5 text-xs font-semibold whitespace-nowrap">
          {[
            { id: "DASHBOARD", label: "ড্যাশবোর্ড", icon: User },
            { id: "HIFZ", label: "হিফজ ডায়েরি", icon: BookOpenCheck },
            { id: "GATEPASS", label: "গেটপাস ও আইডি কার্ড", icon: DoorOpen },
            { id: "ATTENDANCE", label: "হাজিরা", icon: Calendar },
            { id: "RESULTS", label: "ফলাফল", icon: Award },
            { id: "ROUTINE", label: "ক্লাস রুটিন", icon: Clock },
            { id: "FINANCE", label: "ফি ও পেমেন্ট", icon: DollarSign },
            { id: "HOSTEL", label: "হোস্টেল ও খাবার", icon: Building },
            { id: "TRANSPORT", label: "পরিবহন ও বাস", icon: Bus },
            { id: "LIBRARY", label: "লাইব্রেরি ও কিতাব", icon: BookOpen },
            { id: "CALENDAR", label: "ক্যালেন্ডার ও ছুটি", icon: CalendarDays },
            { id: "DOCUMENTS", label: "ডকুমেন্টস ও সনদ", icon: FileText },
            { id: "REQUESTS", label: "আবেদন ও হেল্পডেস্ক", icon: Send },
            { id: "NOTIFICATIONS", label: "নোটিফিকেশন", icon: Bell },
            ...(applications.length > 0
              ? [{ id: "APPLICATIONS", label: `ভর্তি আবেদন (${applications.length})`, icon: GraduationCap }]
              : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-3.5 border-b-2 flex items-center gap-1.5 transition text-xs font-bold ${
                  isActive
                    ? "border-[#0D5C3A] text-[#0D5C3A] bg-emerald-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#0D5C3A]" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN PORTAL CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {childrenLoading ? (
          <div className="text-center py-24 space-y-3">
            <div className="w-10 h-10 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">সন্তানের ডিজিটাল প্রোফাইল লোড হচ্ছে...</p>
          </div>
        ) : !activeChild ? (
          <div className="perspective-1000 max-w-xl mx-auto">
            <div className="card-3d bg-white rounded-3xl border-2 border-amber-300/80 p-8 space-y-4 shadow-xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-[#D4AF37] flex items-center justify-center mx-auto text-amber-700 shadow-md">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-lg text-slate-900 font-serif-bn">
                  কোনো শিক্ষার্থী বা ভর্তি আবেদন পাওয়া যায়নি
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  আপনার অভিভাবক অ্যাকাউন্টের সাথে কোনো শিক্ষার্থী এখনও নিবন্ধিত নেই। অনলাইনে সরাসরি নতুন ভর্তি আবেদন দাখিল করতে পারেন।
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/admission/apply"
                  className="btn-gold px-6 py-3 rounded-xl text-xs font-black shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-stone-900" />
                  <span>অনলাইন ভর্তি আবেদন ফরম</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* TAB 1: OVERVIEW DASHBOARD */}
            {activeTab === "DASHBOARD" && (
              <PortalTabErrorBoundary tabName="ড্যাশবোর্ড" tabKey="DASHBOARD" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <div className="space-y-6">
                
                {/* Active Child Hero Banner (3D Gold Institutional Frame) */}
                <div className="perspective-1000">
                  <div className="card-3d bg-white rounded-3xl border-2 border-[#D4AF37]/50 p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0D5C3A] via-[#D4AF37] to-[#0D5C3A]" />
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D5C3A] to-[#063321] border-2 border-[#D4AF37] flex items-center justify-center font-black text-2xl text-amber-300 flex-shrink-0 shadow-lg shadow-emerald-950/20">
                        {activeChild.fullNameBn.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            বর্তমান নির্বাচিত শিক্ষার্থী
                          </span>
                          <span className="text-[10px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {activeChild.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-serif-bn">
                          {activeChild.fullNameBn}
                        </h2>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          আইডি: <strong className="text-slate-800">{activeChild.studentIdNumber}</strong> • জামাত: {activeChild.className || "নির্ধারিত নয়"} • শাখা: {activeChild.sectionName || "ক"} • রোল: {activeChild.rollNumber || "১"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => setActiveTab("RESULTS")}
                        className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/20 flex items-center gap-2 active:scale-95"
                      >
                        <Award className="w-4 h-4 text-amber-300" />
                        <span>মার্কশিট দেখুন</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("FINANCE")}
                        className="btn-gold px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 active:scale-95"
                      >
                        <DollarSign className="w-4 h-4 text-stone-900" />
                        <span>ফি পরিশোধ</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* REAL DATA KPI Summary Cards (4 Distinct 3D Cards) */}
                <div className="perspective-1000 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Class & Section */}
                  <div className="card-3d bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-[#D4AF37] shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors pointer-events-none" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">শ্রেণি ও শাখা</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0D5C3A]">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="text-base sm:text-xl font-black text-slate-900 block truncate font-serif-bn">
                      {activeChild.className || "অনির্ধারিত"}
                    </span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        শাখা: {activeChild.sectionName || "ক"}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        রোল: {activeChild.rollNumber || "১"}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Biometric Attendance */}
                  <div className="card-3d bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-blue-400 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors pointer-events-none" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">চলতি মাসের উপস্থিতি</span>
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                        <Calendar className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base sm:text-xl font-black text-blue-700 block font-mono">
                        {loadingDashboardMetrics ? "লোড হচ্ছে..." : dynamicAttendanceRate || "তথ্য নেই"}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="রিয়েল-টাইম তথ্য" />
                    </div>
                    <span className="text-[11px] text-blue-700 font-medium block mt-2">
                      বায়োমেট্রিক উপস্থিতি রেকর্ড
                    </span>
                  </div>

                  {/* Card 3: Latest Exam Result */}
                  <div className="card-3d bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-amber-400 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100 transition-colors pointer-events-none" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">সর্বশেষ ফলাফল</span>
                      <div className="w-8 h-8 rounded-lg bg-amber-50 border border-[#D4AF37]/50 flex items-center justify-center text-amber-700">
                        <Award className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                    </div>
                    <span className="text-base sm:text-xl font-black text-amber-800 block truncate font-serif-bn">
                      {loadingDashboardMetrics
                        ? "লোড হচ্ছে..."
                        : dynamicLatestResult
                        ? dynamicLatestResult.grade
                        : "এখনো প্রকাশিত নেই"}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block mt-2 truncate">
                      {dynamicLatestResult ? dynamicLatestResult.title : "টার্ম বা সাময়িক পরীক্ষা"}
                    </span>
                  </div>

                  {/* Card 4: Due Fees Balance */}
                  <div className="card-3d bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-red-400 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-full blur-2xl group-hover:bg-red-100 transition-colors pointer-events-none" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">বকেয়া ফি</span>
                      <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="text-base sm:text-xl font-black font-mono text-red-600 block">
                      {loadingDashboardMetrics
                        ? "লোড হচ্ছে..."
                        : dynamicDueAmount !== null
                        ? `৳ ${dynamicDueAmount.toLocaleString("bn-BD")}`
                        : "৳ ০"}
                    </span>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">হালনাগাদ হিসাব</span>
                      {dynamicDueAmount && dynamicDueAmount > 0 ? (
                        <button
                          onClick={() => setActiveTab("FINANCE")}
                          className="text-[11px] font-bold text-[#0D5C3A] hover:underline"
                        >
                          পরিশোধ করুন →
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Quick Action Tiles (3D Elevated Grid) */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    পোর্টালে দ্রুত সেবাসমূহ (Quick Actions)
                  </h3>
                  <div className="perspective-1000 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {[
                      { tab: "HIFZ", title: "হিফজ ডায়েরি", desc: "সবক ও আমোক্তা ট্র্যাকার", icon: BookOpenCheck, color: "text-emerald-700 bg-emerald-50 border-emerald-300" },
                      { tab: "ATTENDANCE", title: "উপস্থিতি", desc: "ডিজিটাল ও এসএমএস হাজিরা", icon: Calendar, color: "text-blue-600 bg-blue-50 border-blue-200" },
                      { tab: "RESULTS", title: "ফলাফল", desc: "মার্কশিট ও গ্রেড", icon: Award, color: "text-amber-600 bg-amber-50 border-amber-200" },
                      { tab: "ROUTINE", title: "ক্লাস রুটিন", desc: "দৈনিক সময়সূচি", icon: Clock, color: "text-teal-600 bg-teal-50 border-teal-200" },
                      { tab: "FINANCE", title: "ফি ও পেমেন্ট", desc: "ইনভয়েস ও রসিদ", icon: DollarSign, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                      { tab: "HOSTEL", title: "হোস্টেল ও খাবার", desc: "আবাসন ও মিল ট্র্যাকার", icon: Building, color: "text-amber-700 bg-amber-50 border-amber-300" },
                      { tab: "TRANSPORT", title: "পরিবহন সার্ভিস", desc: "বাস ও রুট ট্র্যাকার", icon: Bus, color: "text-blue-700 bg-blue-50 border-blue-300" },
                      { tab: "LIBRARY", title: "গ্রন্থাগার", desc: "ধারকৃত কিতাব ও নিয়ম", icon: BookOpen, color: "text-emerald-700 bg-emerald-50 border-emerald-300" },
                      { tab: "CALENDAR", title: "বর্ষপঞ্জিকা ও ছুটি", desc: "একাডেমিক ক্যালেন্ডার", icon: CalendarDays, color: "text-purple-700 bg-purple-50 border-purple-300" },
                      { tab: "GATEPASS", title: "গেটপাস ও আইডি", desc: "ডিজিটাল আইডি ও পাস", icon: DoorOpen, color: "text-teal-700 bg-teal-50 border-teal-300" },
                      { tab: "DOCUMENTS", title: "সনদ ও নথি", desc: "প্রত্যয়ন আবেদন", icon: FileText, color: "text-purple-600 bg-purple-50 border-purple-200" },
                      { tab: "REQUESTS", title: "আবেদন ও সাহায্য", desc: "ছুটি ও সংশোধন", icon: Send, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
                    ].map((tile) => {
                      const Icon = tile.icon;
                      return (
                        <button
                          key={tile.tab}
                          onClick={() => setActiveTab(tile.tab as any)}
                          className="card-3d bg-white hover:bg-emerald-50/40 p-4 rounded-2xl border border-slate-200/90 shadow-sm text-left transition-all hover:border-[#D4AF37] hover:shadow-lg group flex flex-col justify-between"
                        >
                          <div className={`w-10 h-10 rounded-xl ${tile.color} border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 group-hover:text-[#0D5C3A]">
                              {tile.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {tile.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Notice / Information Widget */}
                <div className="card-3d bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 border-2 border-[#D4AF37]/50 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-amber-950 shadow-md">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-[#9A781D] flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold block text-amber-950 text-sm mb-0.5">
                      সম্মানিত অভিভাবকদের প্রতি প্রাতিষ্ঠানিক বার্তা:
                    </span>
                    সন্তানের যেকোনো শিক্ষাগত বা প্রশাসনিক প্রয়োজনে মাদরাসা অফিসের নির্ধারিত সময়ে যোগাযোগ করুন। অনলাইনে ফি প্রদানের পর ডিজিটাল মানি রশিদ সরাসরি ডাউনলোড ও প্রিন্ট করে সংরক্ষণ করতে পারবেন।
                  </div>
                </div>

                {/* Quick Emergency & Department Contacts Directory */}
                <div className="card-3d bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0D5C3A] flex items-center justify-center border border-emerald-200">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">মাদরাসা জরুরি অভিভাবক হেল্পলাইন ও বিভাগীয় যোগাযোগ</h4>
                        <p className="text-[10px] text-slate-500">জরুরি প্রয়োজনে যেকোনো বিভাগের দায়িত্বশীলদের সাথে সরাসরি কল বা হোয়াটসঅ্যাপে কথা বলুন</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200 self-start sm:self-auto">
                      অফিস সময়: সকাল ৮:০০ - বিকাল ৪:৩০
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                    {/* Contact 1: Principal / Muhtamim */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">মুহতামিম ও অধ্যক্ষ</span>
                        <h5 className="text-xs font-bold text-slate-900 mt-0.5">{INSTITUTION_INFO.principal}</h5>
                        <p className="text-[10px] text-slate-500">সাধারণ দিকনির্দেশনা ও সর্বোচ্চ অভিভাবক সভা</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={`tel:${INSTITUTION_INFO.primaryPhone}`}
                          className="flex-1 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>কল করুন</span>
                        </a>
                        <a
                          href={INSTITUTION_INFO.whatsappDirect}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-[11px] font-bold transition"
                          title="WhatsApp"
                        >
                          হোয়াটসঅ্যাপ
                        </a>
                      </div>
                    </div>

                    {/* Contact 2: Class Teacher / Academic */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">শ্রেণি শিক্ষক ও পাঠদান</span>
                        <h5 className="text-xs font-bold text-slate-900 mt-0.5">
                          {activeChild?.className ? `${activeChild.className} শ্রেণি তত্ত্বাবধায়ক` : "শ্রেণি শিক্ষক"}
                        </h5>
                        <p className="text-[10px] text-slate-500">পড়াশোনা, সবক ও শিক্ষার্থীর নিয়মিত অগ্রগতি</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={`tel:${INSTITUTION_INFO.phones[1] || INSTITUTION_INFO.primaryPhone}`}
                          className="flex-1 py-1.5 px-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>কল করুন</span>
                        </a>
                      </div>
                    </div>

                    {/* Contact 3: Hostel / Residential Super */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">হোস্টেল সুপার ও আবাসন</span>
                        <h5 className="text-xs font-bold text-slate-900 mt-0.5">আবাসিক তত্ত্বাবধায়ক দপ্তর</h5>
                        <p className="text-[10px] text-slate-500">থাকা-খাওয়া, শারীরিক সুস্থতা ও জরুরি ছুটি</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={`tel:${INSTITUTION_INFO.phones[0]}`}
                          className="flex-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>কল করুন</span>
                        </a>
                      </div>
                    </div>

                    {/* Contact 4: Accounts & Fees */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">হিসাব শাখা ও ফি আদায়</span>
                        <h5 className="text-xs font-bold text-slate-900 mt-0.5">অফিস একাউন্টস ডেস্ক</h5>
                        <p className="text-[10px] text-slate-500">ফি পেমেন্ট, অনলাইন রসিদ ও প্রত্যয়ন যাচাই</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={`tel:${INSTITUTION_INFO.phones[2] || INSTITUTION_INFO.primaryPhone}`}
                          className="flex-1 py-1.5 px-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>কল করুন</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </PortalTabErrorBoundary>
            )}

            {/* TAB: HIFZ DIARY & 30-PARA TRACKER */}
            {activeTab === "HIFZ" && (
              <PortalTabErrorBoundary tabName="হিফজ ডায়েরি" tabKey="HIFZ" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <GuardianHifzDiaryViewer
                  studentId={activeChild?.id}
                  studentName={activeChild?.fullNameBn}
                />
              </PortalTabErrorBoundary>
            )}

            {/* TAB: GATEPASS & ID CARD */}
            {activeTab === "GATEPASS" && (
              <PortalTabErrorBoundary tabName="গেটপাস ও আইডি কার্ড" tabKey="GATEPASS" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <GuardianGatePassViewer
                  studentId={activeChild?.id}
                  studentName={activeChild?.fullNameBn}
                />
              </PortalTabErrorBoundary>
            )}

            {/* TAB 2: ATTENDANCE */}
            {activeTab === "ATTENDANCE" && (
              <PortalTabErrorBoundary tabName="উপস্থিতি" tabKey="ATTENDANCE" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <GuardianAttendanceViewer initialStudentId={activeChild.id} />
              </PortalTabErrorBoundary>
            )}

            {/* TAB 3: RESULTS */}
            {activeTab === "RESULTS" && (
              <PortalTabErrorBoundary tabName="ফলাফল" tabKey="RESULTS" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <GuardianResultsViewer initialStudentId={activeChild.id} />
              </PortalTabErrorBoundary>
            )}

            {/* TAB 4: ROUTINE */}
            {activeTab === "ROUTINE" && (
              <PortalTabErrorBoundary tabName="ক্লাস রুটিন" tabKey="ROUTINE" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <GuardianRoutineViewer selectedStudentId={activeChild.id} />
              </PortalTabErrorBoundary>
            )}

            {/* TAB 5: FINANCE */}
            {activeTab === "FINANCE" && (
              <PortalTabErrorBoundary tabName="ফি ও পেমেন্ট" tabKey="FINANCE" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <GuardianFinanceViewer
                  selectedStudentId={activeChild.id}
                  onSelectStudent={(id) => setSelectedChildId(id)}
                />
              </PortalTabErrorBoundary>
            )}

            {/* TAB 6: DOCUMENTS & CERTIFICATES */}
            {activeTab === "DOCUMENTS" && (
              <PortalTabErrorBoundary tabName="ডকুমেন্টস ও সনদ" tabKey="DOCUMENTS" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <GuardianDocumentsViewer
                  selectedStudentId={activeChild.id}
                  onSelectStudent={(id) => setSelectedChildId(id)}
                />
              </PortalTabErrorBoundary>
            )}

            {/* TAB: HOSTEL & RESIDENTIAL */}
            {activeTab === "HOSTEL" && (
              <PortalTabErrorBoundary tabName="হোস্টেল ও খাবার" tabKey="HOSTEL" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <GuardianHostelViewer defaultStudentId={activeChild?.id} />
              </PortalTabErrorBoundary>
            )}

            {/* TAB: TRANSPORT SERVICE */}
            {activeTab === "TRANSPORT" && (
              <PortalTabErrorBoundary tabName="পরিবহন ও বাস" tabKey="TRANSPORT" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <GuardianTransportViewer />
              </PortalTabErrorBoundary>
            )}

            {/* TAB: LIBRARY & CIRCULATION */}
            {activeTab === "LIBRARY" && (
              <PortalTabErrorBoundary tabName="লাইব্রেরি ও কিতাব" tabKey="LIBRARY" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <GuardianLibraryViewer defaultStudentId={activeChild?.id} />
              </PortalTabErrorBoundary>
            )}

            {/* TAB: ACADEMIC CALENDAR & HOLIDAYS */}
            {activeTab === "CALENDAR" && (
              <PortalTabErrorBoundary tabName="একাডেমিক ক্যালেন্ডার ও ছুটি" tabKey="CALENDAR" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <GuardianCalendarViewer />
              </PortalTabErrorBoundary>
            )}

            {/* TAB 7: REQUESTS & HELPDESK (Integrated Hub) */}
            {activeTab === "REQUESTS" && (
              <PortalTabErrorBoundary tabName="আবেদন ও হেল্পডেস্ক" tabKey="REQUESTS" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <div className="space-y-6">
                {/* Sub-navigation inside Requests */}
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                  <button
                    onClick={() => setRequestsSubTab("LEAVE")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      requestsSubTab === "LEAVE"
                        ? "bg-[#0D5C3A] text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ছুটির আবেদন</span>
                  </button>
                  <button
                    onClick={() => setRequestsSubTab("CORRECTION")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      requestsSubTab === "CORRECTION"
                        ? "bg-[#0D5C3A] text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>তথ্য সংশোধনের আবেদন</span>
                  </button>
                  <button
                    onClick={() => setRequestsSubTab("HELPDESK")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      requestsSubTab === "HELPDESK"
                        ? "bg-[#0D5C3A] text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <LifeBuoy className="w-3.5 h-3.5" />
                    <span>হেল্পডেস্ক ও অভিযোগ</span>
                  </button>
                </div>

                {/* Sub-tab 1: Real Leave Request Workflow */}
                {requestsSubTab === "LEAVE" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Submit Form */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-bold text-base text-[#083B25] flex items-center gap-2">
                          <Send className="w-4 h-4 text-[#0D5C3A]" />
                          নতুন ছুটির আবেদন দাখিল
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          মাদরাসার নিয়ম অনুযায়ী ছুটির কারণ ও সুনির্দিষ্ট তারিখ উল্লেখ করুন।
                        </p>
                      </div>

                      {leaveMsg && (
                        <div
                          className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                            leaveMsg.type === "success"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-red-50 text-red-800 border border-red-200"
                          }`}
                        >
                          {leaveMsg.type === "success" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          )}
                          <span>{leaveMsg.text}</span>
                        </div>
                      )}

                      <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs">
                        {children.length > 1 ? (
                          <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                              শিক্ষার্থী নির্বাচন *
                            </label>
                            <select
                              value={leaveTargetStudentId || activeChild?.id || ""}
                              onChange={(e) => setLeaveTargetStudentId(e.target.value)}
                              className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                            >
                              {children.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.fullNameBn} ({c.studentIdNumber})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <input
                            type="hidden"
                            name="leaveStudentId"
                            value={activeChild?.id || children[0]?.id || ""}
                          />
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                              ছুটি শুরুর তারিখ *
                            </label>
                            <input
                              type="date"
                              required
                              value={leaveStartDate}
                              onChange={(e) => setLeaveStartDate(e.target.value)}
                              className="w-full p-2.5 border border-gray-300 rounded-lg outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                              ছুটি সমাপ্তির তারিখ *
                            </label>
                            <input
                              type="date"
                              required
                              value={leaveEndDate}
                              onChange={(e) => setLeaveEndDate(e.target.value)}
                              className="w-full p-2.5 border border-gray-300 rounded-lg outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">
                            ছুটির সুনির্দিষ্ট কারণ ও বিবরণ *
                          </label>
                          <textarea
                            required
                            rows={4}
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            placeholder="অসুস্থতা বা পারিবারিক জরুরি প্রয়োজনে ছুটির বিশদ বিবরণ লিখুন (কমপক্ষে ৫ অক্ষর)..."
                            className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#0D5C3A]"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submittingLeave}
                          className="w-full bg-[#0D5C3A] hover:bg-[#083B25] disabled:opacity-50 text-white p-3 rounded-lg font-bold transition shadow flex items-center justify-center gap-2"
                        >
                          {submittingLeave ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 text-amber-300" />
                          )}
                          <span>ছুটির আবেদন দাখিল করুন</span>
                        </button>
                      </form>
                    </div>

                    {/* History Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-bold text-base text-gray-900">পূর্বে দাখিলকৃত ছুটির আবেদনসমূহ</h3>
                        <button
                          onClick={fetchLeaveHistory}
                          className="text-stone-400 hover:text-emerald-700 p-1"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>

                      {loadingLeaveHistory ? (
                        <div className="py-12 text-center text-gray-500 text-xs">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                          লোড হচ্ছে...
                        </div>
                      ) : leaveHistory.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-xs">
                          কোনো পূর্ববর্তী ছুটির আবেদন পাওয়া যায়নি।
                        </div>
                      ) : (
                        <div className="space-y-3 overflow-y-auto max-h-[460px]">
                          {leaveHistory.map((item) => (
                            <div key={item.id} className="border rounded-xl p-3.5 space-y-2 bg-stone-50/50 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900">
                                  {item.student?.fullNameBn || "শিক্ষার্থী"}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.status === "APPROVED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : item.status === "REJECTED"
                                      ? "bg-red-100 text-red-800"
                                      : item.status === "UNDER_REVIEW"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {item.status === "APPROVED"
                                    ? "অনুমোদিত"
                                    : item.status === "REJECTED"
                                    ? "প্রত্যাখ্যাত"
                                    : item.status === "UNDER_REVIEW"
                                    ? "পর্যালোচনাধীন"
                                    : "জমা হয়েছে"}
                                </span>
                              </div>
                              <div className="text-gray-600 font-mono text-[11px]">
                                {new Date(item.startDate).toLocaleDateString("bn-BD")} হতে{" "}
                                {new Date(item.endDate).toLocaleDateString("bn-BD")}
                              </div>
                              <p className="text-gray-700 bg-white p-2 rounded border border-gray-100 text-[11px]">
                                {item.reason}
                              </p>
                              {item.adminNote && (
                                <p className="text-emerald-800 bg-emerald-50/60 p-2 rounded text-[11px]">
                                  <strong>কর্তৃপক্ষের মন্তব্য:</strong> {item.adminNote}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: Real Profile Correction Form */}
                {requestsSubTab === "CORRECTION" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-bold text-base text-[#083B25] flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-[#0D5C3A]" />
                          শিক্ষার্থীর তথ্য সংশোধনের আবেদন
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          ভুল বা অসম্পূর্ণ তথ্য পরিবর্তনের জন্য আবেদন করুন। অ্যাডমিন অনুমোদনের পর মাস্টার তথ্য হালনাগাদ হবে।
                        </p>
                      </div>

                      {correctionMsg && (
                        <div
                          className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                            correctionMsg.type === "success"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-red-50 text-red-800 border border-red-200"
                          }`}
                        >
                          {correctionMsg.type === "success" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          )}
                          <span>{correctionMsg.text}</span>
                        </div>
                      )}

                      <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs">
                        {children.length > 1 ? (
                          <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                              শিক্ষার্থী নির্বাচন *
                            </label>
                            <select
                              value={correctionTargetStudentId || activeChild?.id || ""}
                              onChange={(e) => setCorrectionTargetStudentId(e.target.value)}
                              className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                            >
                              {children.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.fullNameBn} ({c.studentIdNumber})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <input
                            type="hidden"
                            name="correctionStudentId"
                            value={activeChild?.id || children[0]?.id || ""}
                          />
                        )}

                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">
                            সংশোধনের বিষয় / ফিল্ড *
                          </label>
                          <select
                            value={correctionField}
                            onChange={(e) => setCorrectionField(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium"
                          >
                            <option value="fullNameBn">শিক্ষার্থীর নাম (বাংলা)</option>
                            <option value="fullNameEn">শিক্ষার্থীর নাম (ইংরেজি)</option>
                            <option value="fatherNameBn">পিতার নাম (বাংলা)</option>
                            <option value="motherNameBn">মাতার নাম (বাংলা)</option>
                            <option value="presentAddress">বর্তমান ঠিকানা</option>
                            <option value="permanentAddress">স্থায়ী ঠিকানা</option>
                            <option value="bloodGroup">রক্তের গ্রুপ</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">
                            সঠিক / প্রত্যাশিত তথ্য *
                          </label>
                          <input
                            type="text"
                            required
                            value={correctionNewValue}
                            onChange={(e) => setCorrectionNewValue(e.target.value)}
                            placeholder="সঠিক তথ্যটি এখানে লিখুন..."
                            className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#0D5C3A]"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">
                            সংশোধনের সুনির্দিষ্ট কারণ *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={correctionReason}
                            onChange={(e) => setCorrectionReason(e.target.value)}
                            placeholder="কেন এই তথ্য সংশোধন প্রয়োজন লিখুন..."
                            className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#0D5C3A]"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submittingCorrection}
                          className="w-full bg-[#0D5C3A] hover:bg-[#083B25] disabled:opacity-50 text-white p-3 rounded-lg font-bold transition shadow flex items-center justify-center gap-2"
                        >
                          {submittingCorrection ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-amber-300" />
                          )}
                          <span>সংশোধনের আবেদন জমা দিন</span>
                        </button>
                      </form>
                    </div>

                    {/* Correction History */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-bold text-base text-gray-900">তথ্য সংশোধনের পূর্ববর্তী আবেদনসমূহ</h3>
                        <button
                          onClick={fetchCorrectionHistory}
                          className="text-stone-400 hover:text-emerald-700 p-1"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>

                      {loadingCorrectionHistory ? (
                        <div className="py-12 text-center text-gray-500 text-xs">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                          লোড হচ্ছে...
                        </div>
                      ) : correctionHistory.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-xs">
                          তথ্য সংশোধনের কোনো পূর্ববর্তী আবেদন পাওয়া যায়নি।
                        </div>
                      ) : (
                        <div className="space-y-3 overflow-y-auto max-h-[460px]">
                          {correctionHistory.map((item) => (
                            <div key={item.id} className="border rounded-xl p-3.5 space-y-2 bg-stone-50/50 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-gray-700 font-bold">{item.id}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.status === "APPROVED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : item.status === "REJECTED"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {item.status === "APPROVED"
                                    ? "অনুমোদিত"
                                    : item.status === "REJECTED"
                                    ? "প্রত্যাখ্যাত"
                                    : "বিচারাধীন"}
                                </span>
                              </div>
                              <p className="text-gray-700 font-medium">
                                আইডি: {item.studentIdNumber} | আবেদনকৃত বিষয়:{" "}
                                <span className="font-mono font-bold text-emerald-800">
                                  {Object.keys(item.requestedFields || {}).join(", ")}
                                </span>
                              </p>
                              <p className="text-gray-600 bg-white p-2 rounded border border-gray-100 text-[11px]">
                                কারণ: {item.reasonBn}
                              </p>
                              {item.reviewNotes && (
                                <p className="text-emerald-800 bg-emerald-50/60 p-2 rounded text-[11px]">
                                  <strong>পর্যালোচনা নোট:</strong> {item.reviewNotes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-tab 3: Helpdesk Hub */}
                {requestsSubTab === "HELPDESK" && (
                  <GuardianHelpdeskHub studentId={activeChild.id} />
                )}
                </div>
              </PortalTabErrorBoundary>
            )}

            {/* TAB 8: NOTIFICATIONS */}
            {activeTab === "NOTIFICATIONS" && (
              <PortalTabErrorBoundary tabName="নোটিফিকেশন" tabKey="NOTIFICATIONS" onNavigateHome={() => setActiveTab("DASHBOARD")}>
                <PortalNotificationsViewer />
              </PortalTabErrorBoundary>
            )}

            {/* SPECIAL TAB: CHILDREN OVERVIEW (Resolves /portal/children route) */}
            {activeTab === "CHILDREN" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 font-display">
                      পরিবারের সকল শিক্ষার্থী (Family Children Overview)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      আপনার অভিভাবক প্রোফাইলের সাথে সংযুক্ত সকল শিক্ষার্থীর তালিকা ও বর্তমান প্রাতিষ্ঠানিক স্ট্যাটাস
                    </p>
                  </div>
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-3 py-1 rounded-xl text-xs">
                    মোট সন্তান: {children.length} জন
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {children.map((child) => (
                    <div
                      key={child.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-black text-xl shadow-inner flex-shrink-0">
                            {child.fullNameBn.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-base text-slate-900 leading-tight">
                              {child.fullNameBn}
                            </h3>
                            {child.fullNameEn && (
                              <p className="text-xs text-slate-400 font-medium truncate">{child.fullNameEn}</p>
                            )}
                            <p className="text-xs font-mono font-semibold text-emerald-700 mt-1">
                              আইডি: {child.studentIdNumber}
                            </p>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs border border-slate-100">
                          <div>
                            <span className="text-slate-400 text-[10px] block">শ্রেণি:</span>
                            <span className="font-bold text-slate-800">{child.className || "অনির্ধারিত"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">রোল:</span>
                            <span className="font-bold text-slate-800">{child.rollNumber || "১"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">শাখা:</span>
                            <span className="font-bold text-slate-800">{child.sectionName || "ক শাখা"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">আবাসিক অবস্থা:</span>
                            <span className="font-bold text-slate-800">
                              {child.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setSelectedChildId(child.id);
                            setActiveTab("DASHBOARD");
                          }}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            child.id === activeChild.id
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                              : "bg-[#0D5C3A] hover:bg-[#158052] text-white shadow-sm"
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>{child.id === activeChild.id ? "বর্তমানে নির্বাচিত" : "প্রোফাইল নির্বাচন করুন"}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SPECIAL TAB: ACADEMIC OVERVIEW (Resolves /portal/academic route) */}
            {activeTab === "ACADEMIC" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 font-display">
                      শিক্ষাগত বিবরণী (Student Academic Overview)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      শিক্ষার্থী: <strong>{activeChild?.fullNameBn || "শিক্ষার্থী"}</strong> (আইডি: {activeChild?.studentIdNumber || "N/A"})
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("ROUTINE")}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>ক্লাস রুটিন দেখুন</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">ভর্তি ও জামাত</span>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-slate-500">বর্তমান জামাত:</span>
                        <span className="font-bold text-slate-900">{activeChild?.className || "অনির্ধারিত"}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-slate-500">শাখা:</span>
                        <span className="font-bold text-slate-900">{activeChild?.sectionName || "ক শাখা"}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-slate-500">শ্রেণি রোল:</span>
                        <span className="font-bold font-mono text-slate-900">{activeChild?.rollNumber || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">আবাসিক অবস্থা:</span>
                        <span className="font-bold text-slate-900">
                          {activeChild?.residentialStatus === "RESIDENTIAL" ? "আবাসিক (বোর্ডিং)" : "অনাবাসিক"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">উপস্থিতি সংক্ষেপ</span>
                    <div className="text-center py-3">
                      <div className="text-3xl font-black font-mono text-emerald-700 mb-1">
                        {dynamicAttendanceRate || "তথ্য নেই"}
                      </div>
                      <p className="text-xs text-slate-500">চলতি শিক্ষাবর্ষের উপস্থিতি হার</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("ATTENDANCE")}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                    >
                      মাসিক হাজিরার বিস্তারিত →
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">সর্বশেষ মূল্যায়ন</span>
                    <div className="text-center py-3">
                      <div className="text-2xl font-black text-amber-700 mb-1">
                        {dynamicLatestResult ? dynamicLatestResult.grade : "এখনো প্রকাশিত ফলাফল নেই"}
                      </div>
                      <p className="text-xs text-slate-500">
                        {dynamicLatestResult ? dynamicLatestResult.title : "পরীক্ষার ফলাফল পর্যালোচনায়"}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("RESULTS")}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                    >
                      পূর্ণাঙ্গ মার্কশিট দেখুন →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: APPLICATIONS */}
            {activeTab === "APPLICATIONS" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 font-display">
                      দাখিলকৃত ভর্তি আবেদনসমূহ
                    </h2>
                    <p className="text-xs text-slate-500">আপনার অভিভাবক প্রোফাইল থেকে জমা দেওয়া সকল আবেদন</p>
                  </div>
                  <Link
                    href="/admission/apply"
                    className="px-4 py-2 rounded-xl bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs font-bold shadow transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    নতুন আবেদন
                  </Link>
                </div>
                {renderApplicationsList()}
              </div>
            )}
          </div>
        )}
      </main>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        currentUser={user}
      />

      <GuardianActiveSessionsModal
        isOpen={showSessionsModal}
        onClose={() => setShowSessionsModal(false)}
      />

      <UserGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        role="GUARDIAN"
      />

      <Footer />
    </div>
  );
}
