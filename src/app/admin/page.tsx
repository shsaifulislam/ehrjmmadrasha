"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  DollarSign,
  FileText,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  LogOut,
  RefreshCw,
  PlusCircle,
  BookOpen,
  Building,
  AlertCircle,
  Search,
  Check,
  Trash2,
  UserPlus,
  Calendar,
  Award,
  Send,
  Sliders,
  BarChart3,
  Mail,
  Menu,
  X,
  LayoutDashboard,
  ChevronRight,
  Bus,
  Boxes,
  Briefcase,
  LifeBuoy,
  Activity,
  Database,
  TrendingUp,
  GitBranch,
  Network,
  Sparkles,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  CalendarCheck,
  Bell,
  Heart,
  KeyRound,
  QrCode,
  Fingerprint,
  CalendarDays,
  Trophy,
  DoorOpen,
  ShieldAlert,
  ClipboardCheck,
  Bot,
  Layers,
  Scale,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
import DigitalAttendanceKiosk from "@/components/attendance/DigitalAttendanceKiosk";
import AdminAttendanceCockpit from "@/components/attendance/AdminAttendanceCockpit";
import AdminExamHub from "@/components/exams/AdminExamHub";
import AdminFinanceHub from "@/components/finance/AdminFinanceHub";
import AdminDocumentHub from "@/components/documents/AdminDocumentHub";
import AdminCommunicationHub from "@/components/communication/AdminCommunicationHub";
import AdminLibraryHub from "@/components/library/AdminLibraryHub";
import AdminHostelHub from "@/components/hostel/AdminHostelHub";
import AdminTransportHub from "@/components/transport/AdminTransportHub";
import AdminInventoryHub from "@/components/inventory/AdminInventoryHub";
import AdminHrHub from "@/components/hr/AdminHrHub";
import AdminHelpdeskHub from "@/components/helpdesk/AdminHelpdeskHub";
import AdminAnalyticsHub from "@/components/analytics/AdminAnalyticsHub";
import AdminOperationsHub from "@/components/operations/AdminOperationsHub";
import AdminSettingsHub from "@/components/settings/AdminSettingsHub";
import AdminDonationsHub from "@/components/donations/AdminDonationsHub";
import AdmissionControlConsole from "@/components/settings/AdmissionControlConsole";
import PaymentMethodsConsole from "@/components/settings/PaymentMethodsConsole";
import InstitutionalBudgetConsole from "@/components/budget/InstitutionalBudgetConsole";
import { InstitutionalProcurementConsole } from "@/components/procurement/InstitutionalProcurementConsole";
import AdminTeacherHub from "@/components/teachers/AdminTeacherHub";
import AdminUsersHub from "@/components/users/AdminUsersHub";
import AdminStudentMasterHub from "@/components/students/AdminStudentMasterHub";
import AdminUnifiedCommandCenter from "@/components/admin/AdminUnifiedCommandCenter";
import AdminAcademicHub from "@/components/academic/AdminAcademicHub";
import AdminAdmissionsPage from "@/app/admin/admissions/page";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import UpdateGuardianModal from "@/components/students/UpdateGuardianModal";

// Newly Integrated Institutional Consoles
import AdminCalendarPage from "@/app/admin/calendar/page";
import AdminEventsCockpit from "@/app/admin/events/page";
import StudentIdCardHub from "@/components/idcard/StudentIdCardHub";
import GatePassManager from "@/components/gatepass/GatePassManager";
import AdminGuardiansPage from "@/app/admin/guardians/page";
import AdminAlumniCockpitPage from "@/app/admin/alumni/page";
import InstitutionalTrainingConsole from "@/components/training/InstitutionalTrainingConsole";
import AdminSurveysCockpitPage from "@/app/admin/surveys/page";
import AdminAIHub from "@/components/ai/AdminAIHub";
import AdminSecurityPage from "@/app/admin/security/page";
import ComplianceDashboard from "@/app/admin/compliance/page";
import InstitutionalGovernanceConsole from "@/components/knowledge/InstitutionalGovernanceConsole";
import WorkflowConsolePage from "@/app/admin/workflows/page";
import BusinessIntelligencePage from "@/app/admin/business-intelligence/page";
import AdminDataQualityPage from "@/app/admin/data-quality/page";
import AdminIntegrationsPage from "@/app/admin/integrations/page";

interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  residentialStudents: number;
  dayCareStudents: number;
  orphanStudents: number;
  totalTeachers: number;
  newAdmissions?: number;
  pendingApplications: number;
  totalNotices: number;
  totalFundBalance: number;
  funds: Array<{ id: string; nameBn: string; code: string; currentBalance: number }>;
  financials: { totalBilled: number; totalCollected: number; totalDue: number };
  attendance?: {
    todayMarked: number;
    todayPresent: number;
    todayAbsent: number;
    todayLate: number;
    todayLeave: number;
    attendanceRate: number;
    totalHistoricalRecords: number;
  };
  pendingDocumentRequests?: number;
  pendingComplaints?: number;
  recentPayments?: Array<{
    id: string;
    receiptNumber: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string | null;
    paymentStatus: string;
    receiptDate: string;
    student: {
      fullNameBn: string;
      studentIdNumber: string;
    };
  }>;
  recentNotices?: Array<{
    id: string;
    titleBn: string;
    category: string;
    isUrgent: boolean;
    publishedAt: string;
  }>;
  alerts?: {
    systemAlertsCount: number;
    academicAlertsCount: number;
  };
  recentApplications: Array<{
    id: string;
    applicationNumber: string;
    studentNameBn: string;
    guardianPhone: string;
    guardianEmail?: string;
    status: string;
    createdAt: string;
    desiredClassId: string;
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    user?: { name: string; role: string };
  }>;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Active ERP Tab
  const [activeTab, setActiveTab] = useState<
    | "DASHBOARD"
    | "COMMAND_CENTER"
    | "TEACHERS"
    | "STUDENTS"
    | "ADMISSION"
    | "ACADEMIC"
    | "ATTENDANCE"
    | "ATTENDANCE_KIOSK"
    | "EXAMINATION"
    | "IDCARDS"
    | "GATEPASS"
    | "GUARDIANS"
    | "ALUMNI"
    | "CALENDAR"
    | "EVENTS"
    | "FINANCE"
    | "DONATIONS"
    | "PAYMENTS"
    | "BUDGETS"
    | "PROCUREMENT"
    | "DOCUMENTS"
    | "COMMUNICATION"
    | "LIBRARY"
    | "HOSTEL"
    | "TRANSPORT"
    | "INVENTORY"
    | "HR"
    | "TRAINING"
    | "SURVEYS"
    | "GOVERNANCE"
    | "COMPLIANCE"
    | "WORKFLOWS"
    | "HELPDESK"
    | "AI"
    | "BI"
    | "DATA_QUALITY"
    | "INTEGRATIONS"
    | "SECURITY"
    | "CMS"
    | "REPORTS"
    | "OPERATIONS"
    | "USERS"
    | "SETTINGS"
  >("DASHBOARD");

  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [teacherAddRequested, setTeacherAddRequested] = useState(false);
  const [financeTxRequested, setFinanceTxRequested] = useState(false);
  const [noticeAddRequested, setNoticeAddRequested] = useState(false);

  // Admission status state (live open/closed)
  const [admissionStatus, setAdmissionStatus] = useState<any>(null);

  // Students list state
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Teachers state
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherMsg, setTeacherMsg] = useState("");

  // Notices state
  const [noticesList, setNoticesList] = useState<any[]>([]);
  const [showAddNotice, setShowAddNotice] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("GENERAL");
  const [noticeUrgent, setNoticeUrgent] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState("");

  // Finance form state
  const [showAddTx, setShowAddTx] = useState(false);
  const [selectedFundId, setSelectedFundId] = useState("");
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [txAmount, setTxAmount] = useState("");
  const [txPayee, setTxPayee] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txMsg, setTxMsg] = useState("");

  // Approval state
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Guardian Update Target State
  const [guardianEditTarget, setGuardianEditTarget] = useState<{
    id: string;
    name: string;
    idNumber: string;
    guardianName?: string;
    phone?: string;
  } | null>(null);

  const fetchStats = () => {
    setLoading(true);
    fetch("/api/dashboard/stats")
      .then((res) => {
        if (!res.ok) {
          window.location.href = "/login";
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.stats) {
          setStats(data.stats);
          if (data.stats.funds?.length > 0 && !selectedFundId) {
            setSelectedFundId(data.stats.funds[0].id);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchAdmissionStatus = () => {
    fetch("/api/admissions/status")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.admission) {
          setAdmissionStatus(data.admission);
        }
      })
      .catch(() => {});
  };

  const loadStudents = (query = "") => {
    setLoadingStudents(true);
    fetch(`/api/admin/students${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.students) setStudentsList(data.students);
        setLoadingStudents(false);
      })
      .catch(() => setLoadingStudents(false));
  };

  const loadTeachers = () => {
    fetch("/api/admin/teachers")
      .then((res) => res.json())
      .then((data) => {
        if (data.teachers) setTeachersList(data.teachers);
      })
      .catch(console.error);
  };

  const loadNotices = () => {
    fetch("/api/admin/notices")
      .then((res) => res.json())
      .then((data) => {
        if (data.notices) setNoticesList(data.notices);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchStats();
    fetchAdmissionStatus();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        const upper = tabParam.toUpperCase();
        const validTabs = [
          "DASHBOARD",
          "COMMAND_CENTER",
          "TEACHERS",
          "STUDENTS",
          "ADMISSION",
          "ACADEMIC",
          "ATTENDANCE",
          "ATTENDANCE_KIOSK",
          "EXAMINATION",
          "IDCARDS",
          "GATEPASS",
          "GUARDIANS",
          "ALUMNI",
          "CALENDAR",
          "EVENTS",
          "FINANCE",
          "DONATIONS",
          "PAYMENTS",
          "BUDGETS",
          "PROCUREMENT",
          "DOCUMENTS",
          "COMMUNICATION",
          "LIBRARY",
          "HOSTEL",
          "TRANSPORT",
          "INVENTORY",
          "HR",
          "TRAINING",
          "SURVEYS",
          "GOVERNANCE",
          "COMPLIANCE",
          "WORKFLOWS",
          "HELPDESK",
          "AI",
          "BI",
          "DATA_QUALITY",
          "INTEGRATIONS",
          "SECURITY",
          "CMS",
          "REPORTS",
          "OPERATIONS",
          "USERS",
          "SETTINGS",
        ];
        if (validTabs.includes(upper)) {
          setActiveTab(upper as any);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === "STUDENTS") loadStudents();
    if (activeTab === "USERS") loadTeachers();
    if (activeTab === "CMS") loadNotices();
  }, [activeTab]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  // 1-Click Approve Application
  const handleApproveAdmission = async (appId: string) => {
    if (!confirm("আপনি কি এই ভর্তি আবেদনটি অনুমোদন করে শিক্ষার্থীকে স্থায়ী আইডি প্রদান করতে চান?")) return;

    setApprovingId(appId);
    setActionMsg(null);

    try {
      const res = await fetch("/api/admissions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: appId }),
      });
      const data = await res.json();

      if (res.ok) {
        setActionMsg({ text: data.message, type: "success" });
        fetchStats();
        if (activeTab === "STUDENTS") loadStudents();
      } else {
        setActionMsg({ text: data.error || "অনুমোদন ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    } finally {
      setApprovingId(null);
    }
  };

  // Create Teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherMsg("");
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teacherName,
          email: teacherEmail,
          phone: teacherPhone,
          password: teacherPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeacherMsg("উস্তাদ/শিক্ষকের অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।");
        setTeacherName("");
        setTeacherEmail("");
        setTeacherPhone("");
        setTeacherPassword("");
        setShowAddTeacher(false);
        loadTeachers();
        fetchStats();
      } else {
        setTeacherMsg(data.error || "অ্যাকাউন্ট তৈরি করা যায়নি।");
      }
    } catch (err: any) {
      setTeacherMsg(err.message);
    }
  };

  // Create Notice
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoticeMsg("");
    try {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleBn: noticeTitle,
          contentBn: noticeContent,
          category: noticeCategory,
          isUrgent: noticeUrgent,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNoticeMsg("নোটিশ সফলভাবে ওয়েবসাইটে প্রকাশিত হয়েছে।");
        setNoticeTitle("");
        setNoticeContent("");
        setShowAddNotice(false);
        loadNotices();
        fetchStats();
      } else {
        setNoticeMsg(data.error || "নোটিশ প্রকাশ করা যায়নি।");
      }
    } catch (err: any) {
      setNoticeMsg(err.message);
    }
  };

  // Delete Notice
  const handleDeleteNotice = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই নোটিশটি ওয়েবসাইট থেকে সরাতে চান?")) return;
    try {
      const res = await fetch(`/api/admin/notices?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadNotices();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Record Transaction
  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxMsg("");
    try {
      const res = await fetch("/api/admin/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundId: selectedFundId,
          type: txType,
          amount: txAmount,
          payeeOrPayer: txPayee,
          category: txCategory,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTxMsg(data.message);
        setTxAmount("");
        setTxPayee("");
        setTxCategory("");
        setShowAddTx(false);
        fetchStats();
      } else {
        setTxMsg(data.error || "লেনদেন অন্তর্ভুক্ত করা যায়নি।");
      }
    } catch (err: any) {
      setTxMsg(err.message);
    }
  };

  const navGroups = [
    {
      groupTitle: "মূল একাডেমি ও শিক্ষার্থী (Academics & Students)",
      items: [
        { id: "DASHBOARD", label: "ড্যাশবোর্ড", subLabel: "Executive Overview", icon: LayoutDashboard },
        { id: "COMMAND_CENTER", label: "সেন্ট্রাল কমান্ড ৩৬০°", subLabel: "ছাত্র, বেতন ও শিক্ষক হাব", icon: Sparkles },
        { id: "TEACHERS", label: "উস্তাদ ও শিক্ষকবৃন্দ", subLabel: "Teachers & Assignments", icon: Users, badge: stats?.totalTeachers },
        { id: "STUDENTS", label: "শিক্ষার্থী মাস্টার তালিকা", subLabel: "Students & Directory", icon: GraduationCap },
        {
          id: "ADMISSION",
          label: "ভর্তি আবেদন ও ডেস্ক",
          subLabel: "Admission Desk & Portal",
          icon: UserPlus,
          badge: stats?.pendingApplications,
        },
        { id: "ACADEMIC", label: "একাডেমিক ও জামাত", subLabel: "Classes & Curriculum", icon: GraduationCap },
        { id: "ATTENDANCE", label: "হাজিরা ককপিট", subLabel: "Student Attendance", icon: Calendar },
        { id: "ATTENDANCE_KIOSK", label: "ডিজিটাল হাজিরা কিয়স্ক", subLabel: "Biometric & QR Gate", icon: QrCode },
        { id: "EXAMINATION", label: "পরীক্ষা ও ফলাফল", subLabel: "Exams & Results", icon: Award },
        { id: "IDCARDS", label: "শিক্ষার্থী আইডি কার্ড হাব", subLabel: "CR80 PVC Batch Generator", icon: CreditCard },
        { id: "GATEPASS", label: "দারুল ইক্বামা গেটপাস", subLabel: "Student Exit & Security Gate", icon: DoorOpen },
        { id: "GUARDIANS", label: "অভিভাবক ডিরেক্টরি", subLabel: "Parents & Siblings Registry", icon: Users },
        { id: "ALUMNI", label: "প্রাক্তন শিক্ষার্থী ফোরাম", subLabel: "Alumni & Graduates Registry", icon: GraduationCap },
        { id: "CALENDAR", label: "প্রাতিষ্ঠানিক ক্যালেন্ডার", subLabel: "Routine, Holiday & Bookings", icon: CalendarDays },
        { id: "EVENTS", label: "অনুষ্ঠান ও প্রতিযোগিতা", subLabel: "Events, Contests & Awards", icon: Trophy },
      ],
    },
    {
      groupTitle: "হিসাব, অনুদান ও অর্থায়ন (Finance & Grants)",
      items: [
        { id: "FINANCE", label: "হিসাব ও ফি কালেকশন", subLabel: "Accounts & Fees", icon: DollarSign },
        { id: "DONATIONS", label: "অনলাইন দান ও যাকাত", subLabel: "Donations & Zakat Ledger", icon: Heart },
        { id: "PAYMENTS", label: "পেমেন্ট মেথড কনসোল", subLabel: "bKash & Gateway Config", icon: CreditCard },
        { id: "BUDGETS", label: "বাজেট প্ল্যানিং ও নিয়ন্ত্রণ", subLabel: "Institutional Budgets", icon: DollarSign },
        { id: "PROCUREMENT", label: "প্রকিউরমেন্ট ও সরবরাহকারী", subLabel: "Vendors & RFQ Contracts", icon: Boxes },
      ],
    },
    {
      groupTitle: "ক্যাম্পাস রিসোর্স ও লজিস্টিকস (Campus & Logistics)",
      items: [
        { id: "COMMUNICATION", label: "বার্তা ও নোটিফিকেশন", subLabel: "SMS & Gmail SMTP", icon: Send },
        { id: "CMS", label: "ওয়েবসাইট CMS ও নোটিশ", subLabel: "Portal CMS & Notices", icon: Sliders },
        { id: "DOCUMENTS", label: "সনদ ও প্রত্যয়নপত্র", subLabel: "Certificates & Testimonials", icon: FileText },
        { id: "LIBRARY", label: "কিতাবখানা ও লাইব্রেরি", subLabel: "Library Catalog Hub", icon: BookOpen },
        { id: "HOSTEL", label: "হোস্টেল ও আবাসন", subLabel: "Residential Boarding", icon: Building },
        { id: "TRANSPORT", label: "পরিবহন ব্যবস্থাপনা", subLabel: "Fleet & Routes", icon: Bus },
        { id: "INVENTORY", label: "ইনভেন্টরি ও সম্পদ", subLabel: "Assets & Materials", icon: Boxes },
      ],
    },
    {
      groupTitle: "প্রশাসন, সুশাসন ও গভর্ন্যান্স (Governance, HR & Compliance)",
      items: [
        { id: "HR", label: "এইচআর ও শিক্ষক স্টাফ", subLabel: "HR, Teachers & Staff", icon: Briefcase },
        { id: "TRAINING", label: "শিক্ষক ও কর্মী প্রশিক্ষণ", subLabel: "Staff Development & CPD", icon: Award },
        { id: "SURVEYS", label: "মতামত ও প্রাতিষ্ঠানিক জরিপ", subLabel: "Surveys & Feedback", icon: ClipboardCheck },
        { id: "GOVERNANCE", label: "প্রাতিষ্ঠানিক পলিসি ও এসওপি", subLabel: "Policies, SOP & Knowledge", icon: Layers },
        { id: "COMPLIANCE", label: "রেগুলেটরি কমপ্লায়েন্স", subLabel: "Compliance & Audit Readiness", icon: Scale },
        { id: "WORKFLOWS", label: "স্বয়ংক্রিয় ওয়ার্কফ্লো ইঞ্জিন", subLabel: "Automated Approvals & Jobs", icon: GitBranch },
        { id: "HELPDESK", label: "হেল্পডেস্ক ও অভিযোগ", subLabel: "Complaints & Service Desk", icon: LifeBuoy },
      ],
    },
    {
      groupTitle: "ইন্টেলিজেন্স, প্রযুক্তি ও সিস্টেম (Intelligence, Security & System)",
      items: [
        { id: "AI", label: "এআই ডিসিশন-সাপোর্ট হাব", subLabel: "AI Intelligence & Anomaly Hub", icon: Bot },
        { id: "BI", label: "বিজনেস ইন্টেলিজেন্স (BI)", subLabel: "Institutional Analytics & KPIs", icon: BarChart3 },
        { id: "DATA_QUALITY", label: "ডেটা কোয়ালিটি ও অডিট", subLabel: "Data Integrity & Deduplication", icon: Database },
        { id: "INTEGRATIONS", label: "ইন্টিগ্রেশন ও ওয়েবহুক", subLabel: "External APIs & Sync", icon: Network },
        { id: "SECURITY", label: "সাইবার নিরাপত্তা ও কন্ট্রোল", subLabel: "Threat Monitoring & Lockouts", icon: ShieldAlert },
        { id: "REPORTS", label: "রিপোর্ট ও অ্যানালিটিক্স", subLabel: "Reports, Logs & Audits", icon: BarChart3 },
        { id: "OPERATIONS", label: "সিস্টেম অপারেশন ও ব্যাকআপ", subLabel: "Health & Disaster Recovery", icon: Activity },
        { id: "USERS", label: "ইউজার ও উস্তাদ অ্যাকাউন্ট", subLabel: "Staff & RBAC Accounts", icon: ShieldCheck },
        { id: "SETTINGS", label: "প্রতিষ্ঠান সেটিংস", subLabel: "System Governance", icon: Clock },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-[#0D5C3A] selection:text-white">
      {/* Top Header Bar */}
      <header className="bg-gradient-to-r from-[#052216] via-[#0D5C3A] to-[#083823] text-white px-3 sm:px-6 py-3 border-b border-emerald-800/60 flex items-center justify-between sticky top-0 z-40 shadow-lg backdrop-blur-md max-w-full overflow-visible">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition focus:outline-none flex-shrink-0"
            title="মেনু খুলুন"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-0.5 border border-amber-400/80 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md">
            <Image
              src="/images/logo.jpg"
              alt="লোগো"
              width={40}
              height={40}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-black text-xs sm:text-base font-display leading-tight flex items-center gap-1 sm:gap-2 truncate">
              <span className="hidden sm:inline">সেন্ট্রালাইজড এডমিন ইআরপি</span>
              <span className="sm:hidden font-bold">এডমিন ইআরপি</span>
              <span className="hidden md:inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] px-2 py-0.5 rounded-full font-sans font-bold flex-shrink-0">
                <Sparkles className="w-3 h-3 text-amber-300" />
                স্মার্ট ৩.০
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-emerald-200/90 truncate">
              <span className="sm:hidden font-medium">ইলিয়টগঞ্জ মাদরাসা</span>
              <span className="hidden sm:inline">{INSTITUTION_INFO.nameBn} • অধ্যক্ষ: {INSTITUTION_INFO.principal}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Live Admission Status Badge Button */}
          {admissionStatus && (
            <button
              onClick={() => {
                setActiveTab("ADMISSION");
                if (typeof window !== "undefined") {
                  window.history.replaceState(null, "", "?tab=ADMISSION");
                }
              }}
              className={`hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-sm ${
                admissionStatus.isOpen
                  ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 hover:bg-emerald-500/35"
                  : "bg-rose-500/25 text-rose-200 border border-rose-400/40 hover:bg-rose-500/35"
              }`}
              title="ক্লিক করে ভর্তি নিয়ন্ত্রণ কনসোলে যান"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  admissionStatus.isOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              <span>ভর্তি: {admissionStatus.isOpen ? "চালু" : "স্থগিত"}</span>
            </button>
          )}

          <div className="hidden 2xl:flex items-center gap-2 bg-emerald-950/60 border border-emerald-600/40 px-3 py-1 rounded-full text-xs text-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-[11px]">সার্ভার সচল</span>
          </div>

          {/* Universal Search Command Palette Trigger */}
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm active:scale-95"
            title="সার্চ কমান্ড প্যালেট (Ctrl + K)"
          >
            <Search className="w-4 h-4 text-amber-300" />
            <span className="hidden md:inline">অনুসন্ধান</span>
            <kbd className="hidden lg:inline-block text-[10px] bg-black/30 text-emerald-200 px-1 py-0.5 rounded font-mono">
              Ctrl K
            </kbd>
          </button>

          {/* Change Password Quick Header Button */}
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-100 hover:text-white p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            title="অ্যাডমিন পাসওয়ার্ড পরিবর্তন ও নিরাপত্তা"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">পাসওয়ার্ড</span>
          </button>

          {/* Quick Create Dropdown */}
          <div className="relative">
            <button
              onClick={() => setQuickCreateOpen(!quickCreateOpen)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm transition active:scale-95"
              title="দ্রুত তৈরি করুন"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span className="hidden md:inline">দ্রুত তৈরি</span>
            </button>

            {quickCreateOpen && (
              <>
                {/* Backdrop to close on click outside */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setQuickCreateOpen(false)}
                />
                <div
                  className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95"
                >
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>ইআরপি দ্রুত একশন মেনু</span>
                    <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-bold">কুইক</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("TEACHERS");
                      setTeacherAddRequested(true);
                      if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=TEACHERS");
                      setQuickCreateOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-emerald-50 text-gray-800 hover:text-[#0D5C3A] flex items-center gap-2"
                  >
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>নতুন উস্তাদ / শিক্ষক অ্যাকাউন্ট</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("ADMISSION");
                      if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=ADMISSION");
                      setQuickCreateOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-blue-50 text-gray-800 hover:text-blue-800 flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>নতুন শিক্ষার্থী ভর্তি ও আবেদন</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("DOCUMENTS");
                      if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=DOCUMENTS");
                      setQuickCreateOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-purple-50 text-gray-800 hover:text-purple-800 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>সনদ ও প্রত্যয়নপত্র প্রিন্ট হাব</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("CMS");
                      setNoticeAddRequested(true);
                      if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=CMS");
                      setQuickCreateOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-amber-50 text-gray-800 hover:text-amber-800 flex items-center gap-2"
                  >
                    <Sliders className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>নতুন নোটিশ প্রকাশ</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("FINANCE");
                      setFinanceTxRequested(true);
                      if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=FINANCE");
                      setQuickCreateOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-teal-50 text-gray-800 hover:text-teal-800 flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>আয় / ব্যয় রেকর্ড এন্ট্রি</span>
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    onClick={() => {
                      setShowChangePasswordModal(true);
                      setQuickCreateOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-rose-50 text-slate-800 hover:text-rose-700 flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>আমার পাসওয়ার্ড পরিবর্তন</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => {
              fetchStats();
              fetchAdmissionStatus();
              if (activeTab === "STUDENTS") loadStudents();
              if (activeTab === "USERS") loadTeachers();
              if (activeTab === "CMS") loadNotices();
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm active:scale-95 hidden sm:flex"
            title="তথ্য রিফ্রেশ করুন"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden md:inline">রিফ্রেশ</span>
          </button>

          <Link
            href="/"
            className="text-xs text-emerald-200 hover:text-white px-2 py-1.5 rounded-xl hover:bg-white/10 transition hidden xl:inline font-medium"
          >
            ওয়েবসাইট
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-rose-700 hover:bg-rose-600 text-white p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
            title="লগআউট"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">লগআউট</span>
          </button>
        </div>
      </header>

      {/* Global Alert Notification Banner */}
      {actionMsg && (
        <div
          className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
            actionMsg.type === "success"
              ? "bg-emerald-100 text-emerald-900 border-b border-emerald-200"
              : "bg-red-100 text-red-900 border-b border-red-200"
          }`}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-xs underline font-normal ml-4">
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Admin Workspace Layout: Left Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar Navigation */}
        <aside
          className={`fixed lg:sticky top-[57px] bottom-0 left-0 z-40 w-64 sm:w-72 bg-white border-r border-slate-200 shadow-sm flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } h-[calc(100vh-57px)] flex-shrink-0`}
        >
          {/* Scrollable Navigation Groups */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* Mobile Header Inside Sidebar */}
            <div className="lg:hidden flex items-center justify-between pb-2 border-b border-slate-100 px-1">
              <span className="text-xs font-bold text-[#0D5C3A] uppercase tracking-wider">
                মডিউল তালিকা (Menu)
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.groupTitle}
                </div>
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        if (typeof window !== "undefined") {
                          window.history.replaceState(null, "", `?tab=${tab.id}`);
                        }
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-[#0D5C3A] to-emerald-700 text-white shadow-md shadow-emerald-950/20 font-bold"
                          : "text-slate-700 hover:bg-emerald-50/80 hover:text-[#0D5C3A]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? "text-amber-300" : "text-slate-400"
                          }`}
                        />
                        <div className="text-left truncate">
                          <div className="leading-snug truncate">{tab.label}</div>
                          {tab.subLabel && (
                            <div
                              className={`text-[10px] leading-tight truncate ${
                                isActive ? "text-emerald-100" : "text-slate-400"
                              }`}
                            >
                              {tab.subLabel}
                            </div>
                          )}
                        </div>
                      </div>

                      {(tab as any).badge && (tab as any).badge > 0 ? (
                        <span className="bg-red-500 text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ml-1 flex-shrink-0 animate-pulse">
                          {(tab as any).badge}
                        </span>
                      ) : isActive ? (
                        <ChevronRight className="w-3.5 h-3.5 text-amber-300 flex-shrink-0 ml-1" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer: Logged in Administrator Profile */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D5C3A] to-emerald-700 text-amber-300 flex items-center justify-center font-bold text-xs shadow-inner border border-amber-400/40">
                {stats?.currentUser?.name ? stats.currentUser.name.charAt(0) : "এ"}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="font-bold text-slate-800 truncate text-xs leading-tight">
                  {stats?.currentUser?.name || "অ্যাডমিন সুপারভাইজার"}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-mono">
                  {stats?.currentUser?.email || "admin@ehrj.edu.bd"}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(true)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#0D5C3A] hover:bg-emerald-50 transition"
                  title="পাসওয়ার্ড পরিবর্তন করুন"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" title="অনলাইন" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs font-bold text-slate-600">এডমিন ইআরপি ডেটা লোড হচ্ছে...</span>
          </div>
        ) : !stats ? (
          <div className="py-20 text-center text-xs text-red-500">ডেটা লোড করা সম্ভব হয়নি।</div>
        ) : (
          <div className="space-y-6">
            {/* 1. DASHBOARD */}
            {activeTab === "DASHBOARD" && (
              <div className="space-y-6">
                {/* Executive Quick Actions & Shortcuts Cockpit */}
                <div className="bg-gradient-to-r from-emerald-950 via-[#0D5C3A] to-emerald-900 text-white p-4.5 rounded-2xl shadow-md border border-emerald-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold flex-shrink-0 border border-amber-400/30 shadow-inner">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                        <span>কুইক অ্যাকশন কন্ট্রোল ও শর্টকাট</span>
                        <span className="text-[10px] bg-amber-400/25 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-400/30">
                          মাদরাসা ইআরপি
                        </span>
                      </h3>
                      <p className="text-xs text-emerald-200/90 mt-0.5">
                        দৈনন্দিন প্রাতিষ্ঠানিক কাজের প্রয়োজনীয় মডিউলে সরাসরি দ্রুত প্রবেশ ও তথ্য পরিচালনা করুন।
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveTab("ADMISSION");
                        if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=ADMISSION");
                      }}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                      <span>ভর্তি ডেস্ক {stats.pendingApplications > 0 && `(${stats.pendingApplications})`}</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("FINANCE");
                        if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=FINANCE");
                      }}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
                      <span>ফি কালেকশন</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("DONATIONS");
                        if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=DONATIONS");
                      }}
                      className="bg-amber-400 hover:bg-amber-300 text-emerald-950 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow active:scale-95"
                    >
                      <Heart className="w-3.5 h-3.5 fill-emerald-950 text-emerald-950" />
                      <span>অনলাইন দান ও যাকাত</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("ATTENDANCE");
                        if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=ATTENDANCE");
                      }}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <CalendarCheck className="w-3.5 h-3.5 text-blue-300" />
                      <span>হাজিরা ককপিট</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("CMS");
                        if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=CMS");
                      }}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Sliders className="w-3.5 h-3.5 text-purple-300" />
                      <span>নোটিশ পোস্ট</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("PAYMENTS");
                        if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=PAYMENTS");
                      }}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-rose-300" />
                      <span>পেমেন্ট নম্বর</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("IDCARDS");
                        if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=IDCARDS");
                      }}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                      <span>আইডি কার্ড হাব</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("CALENDAR");
                        if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=CALENDAR");
                      }}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-sky-300" />
                      <span>ক্যালেন্ডার ও রুটিন</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("EVENTS");
                        if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=EVENTS");
                      }}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                      <span>ইভেন্ট ও প্রতিযোগিতা</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("SECURITY");
                        if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=SECURITY");
                      }}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-300" />
                      <span>সাইবার নিরাপত্তা</span>
                    </button>
                  </div>
                </div>

                {/* Modern KPI Cockpit Grid - 4 Primary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* KPI 1: Students & New Admissions */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">মোট শিক্ষার্থী</span>
                      <div className="p-2.5 bg-emerald-50 text-[#0D5C3A] rounded-xl group-hover:scale-110 transition-transform">
                        <Users className="w-4 h-4 text-emerald-700" />
                      </div>
                    </div>
                    <div className="text-3xl font-black font-mono text-slate-900 mt-2">{stats.totalStudents} জন</div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-emerald-800 font-medium bg-emerald-50/70 px-2.5 py-1 rounded-lg">
                      <span>সক্রিয়: <strong className="font-mono">{stats.activeStudents}</strong></span>
                      <span>•</span>
                      <span>নতুন ভর্তি: <strong className="font-mono">{stats.newAdmissions ?? 0}</strong></span>
                      <span>•</span>
                      <span>এতিম: <strong className="font-mono">{stats.orphanStudents}</strong></span>
                    </div>
                  </div>

                  {/* KPI 2: Today's Attendance & Rate */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">দৈনিক হাজিরা ককপিট</span>
                      <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl group-hover:scale-110 transition-transform">
                        <CalendarCheck className="w-4 h-4 text-blue-700" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black font-mono text-slate-900">
                        {stats.attendance?.attendanceRate ?? (stats.totalStudents > 0 ? 94 : 0)}%
                      </span>
                      <span className="text-xs text-slate-500 font-medium">উপস্থিতির হার</span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-blue-800 font-medium bg-blue-50/70 px-2.5 py-1 rounded-lg">
                      <span>উপস্থিত: <strong className="font-mono">{stats.attendance?.todayPresent ?? stats.activeStudents}</strong></span>
                      <span>•</span>
                      <span>অনুপস্থিত: <strong className="font-mono">{stats.attendance?.todayAbsent ?? 0}</strong></span>
                      <button onClick={() => setActiveTab("ATTENDANCE")} className="underline font-bold text-blue-900 ml-1">
                        হাজিরা খাতা
                      </button>
                    </div>
                  </div>

                  {/* KPI 3: Fee Collections & Outstanding Dues */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">ফি আদায় ও বকেয়া</span>
                      <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl group-hover:scale-110 transition-transform">
                        <CreditCard className="w-4 h-4 text-amber-700" />
                      </div>
                    </div>
                    <div className="text-2xl font-black font-mono text-[#0D5C3A] mt-2">
                      ৳ {stats.financials.totalCollected.toLocaleString("bn-BD")}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-amber-900 font-medium bg-amber-50/70 px-2.5 py-1 rounded-lg">
                      <span>বকেয়া: <strong className="font-mono text-rose-700">৳ {stats.financials.totalDue.toLocaleString("bn-BD")}</strong></span>
                      <button onClick={() => setActiveTab("FINANCE")} className="underline font-bold text-amber-900">
                        হিসাব বিবরণী
                      </button>
                    </div>
                  </div>

                  {/* KPI 4: Total Consolidated Funds */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">তহবিল সম্মিলিত স্থিতি</span>
                      <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl group-hover:scale-110 transition-transform">
                        <DollarSign className="w-4 h-4 text-teal-700" />
                      </div>
                    </div>
                    <div className="text-3xl font-black font-mono text-[#0D5C3A] mt-2">
                      ৳ {stats.totalFundBalance.toLocaleString("bn-BD")}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-teal-800 font-medium bg-teal-50/70 px-2.5 py-1 rounded-lg">
                      <span>৫টি অনুমোদিত ফান্ড</span>
                      <span>•</span>
                      <span>উস্তাদ: <strong className="font-mono">{stats.totalTeachers}</strong> জন</span>
                    </div>
                  </div>
                </div>

                {/* Central 360° Omnipotent Management Command Center */}
                <AdminUnifiedCommandCenter />

                {/* Operational Action Alert Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div 
                    onClick={() => setActiveTab("ADMISSION")}
                    className="cursor-pointer bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200/80 p-3 rounded-xl flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
                        <UserPlus className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-950">ভর্তি আবেদন</div>
                        <div className="text-[10px] text-amber-700">অনুমোদনের অপেক্ষায়</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm bg-amber-600 text-white px-2 py-0.5 rounded-full">
                      {stats.pendingApplications}
                    </span>
                  </div>

                  <div 
                    onClick={() => setActiveTab("DOCUMENTS")}
                    className="cursor-pointer bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 p-3 rounded-xl flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-800 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-950">সনদ ও প্রত্যয়ন</div>
                        <div className="text-[10px] text-blue-700">অপেক্ষমাণ রিকোয়েস্ট</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      {stats.pendingDocumentRequests ?? 0}
                    </span>
                  </div>

                  <div 
                    onClick={() => setActiveTab("HELPDESK")}
                    className="cursor-pointer bg-purple-50/80 hover:bg-purple-100/80 border border-purple-200/80 p-3 rounded-xl flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-800 flex items-center justify-center font-bold">
                        <LifeBuoy className="w-4 h-4 text-purple-700" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-950">অভিযোগ ও টিকেট</div>
                        <div className="text-[10px] text-purple-700">সমাধান বাকি</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm bg-purple-600 text-white px-2 py-0.5 rounded-full">
                      {stats.pendingComplaints ?? 0}
                    </span>
                  </div>

                  <div 
                    onClick={() => setActiveTab("OPERATIONS")}
                    className="cursor-pointer bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 p-3 rounded-xl flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-800 flex items-center justify-center font-bold">
                        <Activity className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-950">সিস্টেম স্বাস্থ্য</div>
                        <div className="text-[10px] text-emerald-700">রিস্ক ও ব্যাকআপ সচল</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs bg-emerald-700 text-white px-2 py-0.5 rounded-full">
                      ১০০% সচল
                    </span>
                  </div>
                </div>

                {/* 2-Column Split: Operational Feeds */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column 1: Pending Admissions */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                      <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-[#0D5C3A] rounded-lg">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        অপেক্ষমাণ ভর্তি আবেদন ডেস্ক
                      </h2>
                      <button onClick={() => setActiveTab("ADMISSION")} className="text-xs text-[#0D5C3A] hover:underline font-bold">
                        সবগুলো দেখুন ({stats.pendingApplications}) →
                      </button>
                    </div>

                    {stats.recentApplications.length === 0 ? (
                      <p className="text-xs text-slate-500 py-8 text-center">কোনো অপেক্ষমাণ আবেদন নেই।</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {stats.recentApplications.slice(0, 5).map((app) => (
                          <div key={app.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                            <div>
                              <p className="font-bold text-slate-900">{app.studentNameBn}</p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {app.applicationNumber} • {app.guardianPhone}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                app.status === "APPROVED" 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {app.status === "APPROVED" ? "অনুমোদিত" : "অপেক্ষমাণ"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Left Column 2: Live Payment Transactions */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                      <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        সাম্প্রতিক ফি পরিশোধ ও কালেকশন
                      </h2>
                      <button onClick={() => setActiveTab("FINANCE")} className="text-xs text-[#0D5C3A] hover:underline font-bold">
                        সকল রশিদ দেখুন →
                      </button>
                    </div>

                    {!stats.recentPayments || stats.recentPayments.length === 0 ? (
                      <p className="text-xs text-slate-500 py-8 text-center">কোনো সাম্প্রতিক পেমেন্ট পাওয়া যায়নি।</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {stats.recentPayments.slice(0, 5).map((pmt) => (
                          <div key={pmt.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                            <div>
                              <p className="font-bold text-slate-900">{pmt.student?.fullNameBn || "শিক্ষার্থী"}</p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {pmt.receiptNumber} • {pmt.paymentMethod}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-black font-mono text-sm text-emerald-700 block">
                                +৳ {pmt.amount.toLocaleString("bn-BD")}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(pmt.receiptDate).toLocaleDateString("bn-BD")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column 1: Five Approved Funds Ledger */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                      <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <div className="p-1.5 bg-teal-50 text-[#0D5C3A] rounded-lg">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        তহবিল স্থিতি ও ৫টি পৃথক ফান্ড
                      </h2>
                      <button onClick={() => setActiveTab("FINANCE")} className="text-xs text-[#0D5C3A] hover:underline font-bold">
                        ক্যাশবুকে যান →
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {stats.funds.map((f, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-100 text-xs transition-colors">
                          <div>
                            <span className="font-bold text-slate-800 block">{f.nameBn}</span>
                            <span className="text-[10px] text-slate-400 font-mono">CODE: {f.code}</span>
                          </div>
                          <span className="font-black font-mono text-sm text-[#0D5C3A]">
                            ৳ {f.currentBalance.toLocaleString("bn-BD")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column 2: Published Notices & Announcements */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                      <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                          <Bell className="w-4 h-4" />
                        </div>
                        প্রকাশিত নোটিশ ও ঘোষণা
                      </h2>
                      <button onClick={() => setActiveTab("CMS")} className="text-xs text-[#0D5C3A] hover:underline font-bold">
                        নোটিশ বোর্ড পরিচালনা →
                      </button>
                    </div>

                    {!stats.recentNotices || stats.recentNotices.length === 0 ? (
                      <p className="text-xs text-slate-500 py-8 text-center">কোনো নোটিশ প্রকাশিত হয়নি।</p>
                    ) : (
                      <div className="space-y-2.5">
                        {stats.recentNotices.slice(0, 4).map((n) => (
                          <div key={n.id} className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50/40 border border-slate-100 text-xs transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-900 line-clamp-1">{n.titleBn}</span>
                              {n.isUrgent && (
                                <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                                  জরুরি
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                              <span>ক্যাটেগরি: {n.category}</span>
                              <span>{new Date(n.publishedAt).toLocaleDateString("bn-BD")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 1.1 CENTRAL COMMAND CENTER 360° */}
            {activeTab === "COMMAND_CENTER" && <AdminUnifiedCommandCenter />}

            {/* 1.5 TEACHERS */}
            {activeTab === "TEACHERS" && <AdminTeacherHub initialAddOpen={teacherAddRequested} />}

            {/* 2. STUDENTS */}
            {activeTab === "STUDENTS" && <AdminStudentMasterHub />}

            {/* 3. ADMISSION */}
            {activeTab === "ADMISSION" && (
              <div className="space-y-6">
                <AdminAdmissionsPage />
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <AdmissionControlConsole />
                </div>
              </div>
            )}

            {/* 4. ACADEMIC */}
            {activeTab === "ACADEMIC" && (
              <div className="space-y-6">
                <AdminAcademicHub />
              </div>
            )}

            {/* 5. ATTENDANCE */}
            {activeTab === "ATTENDANCE" && <AdminAttendanceCockpit />}

            {/* DIGITAL ATTENDANCE KIOSK */}
            {activeTab === "ATTENDANCE_KIOSK" && (
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <DigitalAttendanceKiosk />
              </div>
            )}

            {/* 6. EXAMINATION */}
            {activeTab === "EXAMINATION" && <AdminExamHub />}

            {/* STUDENT ID CARDS BATCH & DESIGN HUB */}
            {activeTab === "IDCARDS" && (
              <div className="space-y-4">
                <StudentIdCardHub />
              </div>
            )}

            {/* RESIDENTIAL GATE PASS & SECURITY CHECK */}
            {activeTab === "GATEPASS" && (
              <div className="space-y-4">
                <GatePassManager />
              </div>
            )}

            {/* GUARDIANS DIRECTORY & SIBLINGS NETWORK */}
            {activeTab === "GUARDIANS" && (
              <div className="space-y-4">
                <AdminGuardiansPage />
              </div>
            )}

            {/* ALUMNI & GRADUATES FORUM */}
            {activeTab === "ALUMNI" && (
              <div className="space-y-4">
                <AdminAlumniCockpitPage />
              </div>
            )}

            {/* INSTITUTIONAL CALENDAR & RESOURCE BOOKINGS */}
            {activeTab === "CALENDAR" && (
              <div className="space-y-4">
                <AdminCalendarPage />
              </div>
            )}

            {/* EVENTS, CONTESTS & CERTIFICATES COCKPIT */}
            {activeTab === "EVENTS" && (
              <div className="space-y-4">
                <AdminEventsCockpit />
              </div>
            )}

            {/* 7. FINANCE & ACCOUNTS */}
            {activeTab === "FINANCE" && (
              <div className="space-y-4">
                {/* Finance Sub Navigation Bar */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-50 text-[#0D5C3A] rounded-lg">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-slate-800">আর্থিক হিসাব ও কালেকশন হাব</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveTab("DONATIONS");
                        if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=DONATIONS");
                      }}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <Heart className="w-3.5 h-3.5 text-amber-700" />
                      <span>অনলাইন দান ও যাকাত লেজার</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("PAYMENTS");
                        if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=PAYMENTS");
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-semibold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                      <span>পেমেন্ট গেটওয়ে কনফিগারেশন</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("BUDGETS");
                        if (typeof window !== "undefined") window.history.replaceState(null, "", "?tab=BUDGETS");
                      }}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-semibold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-purple-700" />
                      <span>প্রাতিষ্ঠানিক বাজেট কনসোল</span>
                    </button>
                  </div>
                </div>
                <AdminFinanceHub initialOpenTxModal={financeTxRequested} />
              </div>
            )}

            {/* DONATIONS LEDGER HUB */}
            {activeTab === "DONATIONS" && <AdminDonationsHub />}

            {/* PAYMENT METHODS & GATEWAY CONSOLE */}
            {activeTab === "PAYMENTS" && <PaymentMethodsConsole />}

            {/* INSTITUTIONAL BUDGET PLANNING CONSOLE */}
            {activeTab === "BUDGETS" && <InstitutionalBudgetConsole initialTab="OVERVIEW" />}

            {/* PROCUREMENT & VENDOR CONTRACTS CONSOLE */}
            {activeTab === "PROCUREMENT" && <InstitutionalProcurementConsole initialTab="OVERVIEW" />}

            {/* 8. DOCUMENTS */}
            {activeTab === "DOCUMENTS" && <AdminDocumentHub />}


            {/* 9 & 10. COMMUNICATION & CMS */}
            {(activeTab === "COMMUNICATION" || activeTab === "CMS") && (
              <AdminCommunicationHub initialOpenNoticeModal={noticeAddRequested} />
            )}

            {/* 10. LIBRARY */}
            {activeTab === "LIBRARY" && <AdminLibraryHub />}

            {/* 11. HOSTEL */}
            {activeTab === "HOSTEL" && <AdminHostelHub />}

            {/* 12. TRANSPORT */}
            {activeTab === "TRANSPORT" && <AdminTransportHub />}

            {/* 13. INVENTORY */}
            {activeTab === "INVENTORY" && <AdminInventoryHub />}

            {/* 14. HR & TEACHER ENGINE */}
            {activeTab === "HR" && <AdminHrHub />}

            {/* 14.1 STAFF TRAINING & CERTIFICATIONS */}
            {activeTab === "TRAINING" && <InstitutionalTrainingConsole initialTab="PROGRAMS" />}

            {/* 14.2 SURVEYS & STAKEHOLDER FEEDBACK */}
            {activeTab === "SURVEYS" && <AdminSurveysCockpitPage />}

            {/* 14.3 INSTITUTIONAL GOVERNANCE, SOPS & KNOWLEDGE */}
            {activeTab === "GOVERNANCE" && <InstitutionalGovernanceConsole />}

            {/* 14.4 REGULATORY COMPLIANCE & AUDIT READINESS */}
            {activeTab === "COMPLIANCE" && <ComplianceDashboard />}

            {/* 14.5 AUTOMATED WORKFLOWS & APPROVALS ENGINE */}
            {activeTab === "WORKFLOWS" && <WorkflowConsolePage />}

            {/* 15. HELPDESK & COMPLAINT ENGINE */}
            {activeTab === "HELPDESK" && <AdminHelpdeskHub />}

            {/* 15.1 AI INTELLIGENCE & PREDICTIVE ANOMALY HUB */}
            {activeTab === "AI" && <AdminAIHub />}

            {/* 15.2 INSTITUTIONAL BUSINESS INTELLIGENCE (BI) */}
            {activeTab === "BI" && <BusinessIntelligencePage />}

            {/* 15.3 DATA QUALITY & INTEGRITY AUDITOR */}
            {activeTab === "DATA_QUALITY" && <AdminDataQualityPage />}

            {/* 15.4 INTEGRATIONS, EXTERNAL APIS & WEBHOOKS */}
            {activeTab === "INTEGRATIONS" && <AdminIntegrationsPage />}

            {/* 15.5 CYBER SECURITY, AUDIT & THREAT CONTROL */}
            {activeTab === "SECURITY" && <AdminSecurityPage />}

            {/* 16. USERS & STAFF ACCOUNTS */}
            {activeTab === "USERS" && <AdminUsersHub />}

            {/* 13. REPORTS & ANALYTICS */}
            {activeTab === "REPORTS" && <AdminAnalyticsHub />}

            {/* 14. OPERATIONS & DISASTER RECOVERY */}
            {activeTab === "OPERATIONS" && <AdminOperationsHub />}

            {/* 15. SETTINGS */}
            {activeTab === "SETTINGS" && <AdminSettingsHub />}
          </div>
        )}
        </main>
      </div>

      {/* Change Password Self-Service Modal for Admin */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        currentUser={stats?.currentUser}
        onSuccess={() => {
          setActionMsg({
            text: "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।",
            type: "success",
          });
        }}
      />

      {/* Guardian Data Correction Modal */}
      {guardianEditTarget && (
        <UpdateGuardianModal
          isOpen={!!guardianEditTarget}
          onClose={() => setGuardianEditTarget(null)}
          studentId={guardianEditTarget.id}
          studentName={guardianEditTarget.name}
          studentIdNumber={guardianEditTarget.idNumber}
          initialGuardianName={guardianEditTarget.guardianName}
          initialPhone={guardianEditTarget.phone}
          onSuccess={() => {
            loadStudents();
            setActionMsg({
              text: `'${guardianEditTarget.name}' এর অভিভাবকের তথ্য সফলভাবে আপডেট হয়েছে।`,
              type: "success",
            });
          }}
        />
      )}
    </div>
  );
}
