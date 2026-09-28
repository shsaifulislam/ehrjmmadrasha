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
  Printer,
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
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
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

interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  residentialStudents: number;
  dayCareStudents: number;
  orphanStudents: number;
  totalTeachers: number;
  pendingApplications: number;
  totalNotices: number;
  totalFundBalance: number;
  funds: Array<{ id: string; nameBn: string; code: string; currentBalance: number }>;
  financials: { totalBilled: number; totalCollected: number; totalDue: number };
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
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 15 Modules
  const [activeTab, setActiveTab] = useState<
    | "DASHBOARD"
    | "STUDENTS"
    | "ADMISSION"
    | "ACADEMIC"
    | "ATTENDANCE"
    | "EXAMINATION"
    | "FINANCE"
    | "DOCUMENTS"
    | "COMMUNICATION"
    | "LIBRARY"
    | "HOSTEL"
    | "TRANSPORT"
    | "INVENTORY"
    | "HR"
    | "HELPDESK"
    | "CMS"
    | "REPORTS"
    | "OPERATIONS"
    | "USERS"
    | "SETTINGS"
  >("DASHBOARD");

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

  // Communication state
  const [commRecipient, setCommRecipient] = useState("");
  const [commSubject, setCommSubject] = useState("");
  const [commBody, setCommBody] = useState("");
  const [commSent, setCommSent] = useState(false);

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
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        const upper = tabParam.toUpperCase();
        const validTabs = [
          "DASHBOARD",
          "STUDENTS",
          "ADMISSION",
          "ACADEMIC",
          "ATTENDANCE",
          "EXAMINATION",
          "FINANCE",
          "DOCUMENTS",
          "COMMUNICATION",
          "LIBRARY",
          "CMS",
          "REPORTS",
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

  // Communication submit
  const handleSendComm = (e: React.FormEvent) => {
    e.preventDefault();
    setCommSent(true);
    setTimeout(() => {
      setCommSent(false);
      setCommRecipient("");
      setCommSubject("");
      setCommBody("");
    }, 4000);
  };

  const navGroups = [
    {
      groupTitle: "মূল ব্যবস্থাপনা (Core Operations)",
      items: [
        { id: "DASHBOARD", label: "ড্যাশবোর্ড", subLabel: "Dashboard Overview", icon: LayoutDashboard },
        { id: "STUDENTS", label: "শিক্ষার্থী তালিকা", subLabel: "Student Directory", icon: Users },
        {
          id: "ADMISSION",
          label: "ভর্তি আবেদন",
          subLabel: "Admission Desk",
          icon: UserPlus,
          badge: stats?.pendingApplications,
        },
        { id: "ACADEMIC", label: "একাডেমিক ও জামাত", subLabel: "Classes & Curriculum", icon: GraduationCap },
      ],
    },
    {
      groupTitle: "দৈনন্দিন কার্যাবলি (Daily Campus)",
      items: [
        { id: "ATTENDANCE", label: "হাজিরা ককপিট", subLabel: "Student Attendance", icon: Calendar },
        { id: "EXAMINATION", label: "পরীক্ষা ও ফলাফল", subLabel: "Exams & Results", icon: Award },
        { id: "FINANCE", label: "হিসাব ও ফান্ড", subLabel: "Accounts & Collections", icon: DollarSign },
        { id: "DOCUMENTS", label: "সনদ ও নথিপত্র", subLabel: "Certificates & Letters", icon: FileText },
      ],
    },
    {
      groupTitle: "যোগাযোগ ও ক্যাম্পাস রিসোর্স",
      items: [
        { id: "COMMUNICATION", label: "বার্তা ও নোটিফিকেশন", subLabel: "SMS & Gmail SMTP", icon: Send },
        { id: "LIBRARY", label: "কিতাবখানা ও লাইব্রেরি", subLabel: "Library Hub", icon: BookOpen },
        { id: "HOSTEL", label: "হোস্টেল ও আবাসন", subLabel: "Residential Boarding", icon: Building },
        { id: "TRANSPORT", label: "পরিবহন ব্যবস্থাপনা", subLabel: "Fleet & Routes", icon: Bus },
        { id: "INVENTORY", label: "ইনভেন্টরি ও সম্পদ", subLabel: "Assets & Procurement", icon: Boxes },
        { id: "HELPDESK", label: "হেল্পডেস্ক ও অভিযোগ", subLabel: "Complaints & Service Desk", icon: LifeBuoy },
        { id: "CMS", label: "ওয়েবসাইট CMS ও নোটিশ", subLabel: "Portal CMS", icon: Sliders },
      ],
    },
    {
      groupTitle: "প্রশাসন ও অডিট (Admin System)",
      items: [
        { id: "HR", label: "এইচআর ও শিক্ষক স্টাফ", subLabel: "HR, Teachers & Staff", icon: Briefcase },
        { id: "SECURITY", label: "নিরাপত্তা ও সেশন গভর্ন্যান্স", subLabel: "Zero-Trust & Sessions", icon: ShieldCheck, href: "/admin/security" },
        { id: "DATA_QUALITY", label: "ডেটা কোয়ালিটি ও গভর্ন্যান্স", subLabel: "Data Governance & MDM", icon: Database, href: "/admin/data-quality" },
        { id: "BI", label: "বিজনেস ইন্টেলিজেন্স ও ফোরকাস্টিং", subLabel: "BI, Forecasting & Early Warning", icon: TrendingUp, href: "/admin/business-intelligence" },
        { id: "WORKFLOWS", label: "ওয়ার্কফ্লো ও রুলস অটোমেশন", subLabel: "Process Orchestration & Approvals", icon: GitBranch, href: "/admin/workflows" },
        { id: "INTEGRATIONS", label: "ইন্টিগ্রেশন হাব ও এপিআই", subLabel: "API Gateway & Webhooks", icon: Network, href: "/admin/integrations" },
        { id: "REPORTS", label: "রিপোর্ট ও অ্যানালিটিক্স", subLabel: "Reports & Logs", icon: BarChart3 },
        { id: "OPERATIONS", label: "সিস্টেম অপারেশন ও ব্যাকআপ", subLabel: "Health & Disaster Recovery", icon: Activity },
        { id: "USERS", label: "ইউজার ও শিক্ষক", subLabel: "Staff & RBAC Accounts", icon: ShieldCheck },
        { id: "SETTINGS", label: "প্রতিষ্ঠান সেটিংস", subLabel: "System Config", icon: Clock },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col text-[#0B1914]">
      {/* Top Admin Header - Clean, No tabs here */}
      <header className="bg-[#083B25] text-white px-4 sm:px-6 py-3 border-b-2 border-[#C59B27] flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition focus:outline-none"
            title="মেনু খুলুন"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-[#C59B27] overflow-hidden flex items-center justify-center flex-shrink-0 shadow">
            <Image
              src="/images/logo.jpg"
              alt="লোগো"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base font-display leading-tight flex items-center gap-2">
              <span>একক সেন্ট্রালাইজড এডমিন ইআরপি</span>
              <span className="hidden md:inline-block bg-[#0D5C3A] text-[#fef08a] border border-[#C59B27] text-[10px] px-2 py-0.5 rounded-full font-sans font-semibold">
                ERP v2.5
              </span>
            </h1>
            <p className="text-xs text-emerald-200 truncate max-w-xs sm:max-w-md">
              {INSTITUTION_INFO.nameBn} (অধ্যক্ষ: {INSTITUTION_INFO.principal})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              fetchStats();
              if (activeTab === "STUDENTS") loadStudents();
              if (activeTab === "USERS") loadTeachers();
              if (activeTab === "CMS") loadNotices();
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs flex items-center gap-1.5 transition shadow"
            title="তথ্য রিফ্রেশ করুন"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">রিফ্রেশ</span>
          </button>

          <Link
            href="/"
            className="text-xs text-emerald-200 hover:text-white px-2 py-1 rounded transition hidden sm:inline"
          >
            মূল সাইট
          </Link>

          <div className="hidden md:flex items-center gap-1.5 bg-black/20 border border-white/10 px-2.5 py-1 rounded-full text-xs text-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">অ্যাডমিন অনলাইন</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition shadow"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">লগআউট</span>
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
          className={`fixed lg:sticky top-[57px] bottom-0 left-0 z-40 w-64 sm:w-72 bg-white border-r border-[#E2E8F0] shadow-sm flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } h-[calc(100vh-57px)] flex-shrink-0`}
        >
          {/* Scrollable Navigation Groups */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Mobile Header Inside Sidebar */}
            <div className="lg:hidden flex items-center justify-between pb-2 border-b border-gray-100 px-1">
              <span className="text-xs font-bold text-[#0D5C3A] uppercase tracking-wider">
                মডিউল তালিকা (Menu)
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
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
                        if ((tab as any).href) {
                          window.location.href = (tab as any).href;
                          return;
                        }
                        setActiveTab(tab.id as any);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-[#0D5C3A] text-white shadow-sm font-semibold"
                          : "text-gray-700 hover:bg-emerald-50/70 hover:text-[#0D5C3A]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? "text-[#fef08a]" : "text-gray-400"
                          }`}
                        />
                        <div className="text-left truncate">
                          <div className="leading-snug truncate">{tab.label}</div>
                          {tab.subLabel && (
                            <div
                              className={`text-[10px] leading-tight truncate ${
                                isActive ? "text-emerald-100" : "text-gray-400"
                              }`}
                            >
                              {tab.subLabel}
                            </div>
                          )}
                        </div>
                      </div>

                      {(tab as any).badge && (tab as any).badge > 0 ? (
                        <span className="bg-red-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold shadow-sm ml-1 flex-shrink-0">
                          {(tab as any).badge}
                        </span>
                      ) : isActive ? (
                        <ChevronRight className="w-3.5 h-3.5 text-[#fef08a] flex-shrink-0 ml-1" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer: Logged in Administrator Profile */}
          <div className="p-3 bg-[#F8FAF9] border-t border-[#E2E8F0] text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0D5C3A] text-[#fef08a] flex items-center justify-center font-bold text-xs shadow-inner border border-[#C59B27]">
                এ
              </div>
              <div className="overflow-hidden flex-1">
                <p className="font-bold text-gray-800 truncate text-xs leading-tight">
                  অ্যাডমিন সুপারভাইজার
                </p>
                <p className="text-[10px] text-gray-500 truncate font-mono">
                  adminehrjmadrasha@gmail.com
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="অনলাইন" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-500">ডেটা লোড হচ্ছে...</div>
        ) : !stats ? (
          <div className="py-20 text-center text-xs text-red-500">ডেটা লোড করা সম্ভব হয়নি।</div>
        ) : (
          <div className="space-y-6">
            {/* 1. DASHBOARD */}
            {activeTab === "DASHBOARD" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm border-l-4 border-l-[#0D5C3A]">
                    <span className="text-xs text-gray-500 font-semibold uppercase">মোট ছাত্র সংখ্যা</span>
                    <div className="text-2xl font-bold font-mono text-[#0B1914] mt-1">{stats.totalStudents} জন</div>
                    <span className="text-[11px] text-emerald-700 font-medium">সক্রিয়: {stats.activeStudents} | এতিম: {stats.orphanStudents}</span>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm border-l-4 border-l-[#C59B27]">
                    <span className="text-xs text-gray-500 font-semibold uppercase">নতুন ভর্তি আবেদন</span>
                    <div className="text-2xl font-bold font-mono text-[#0B1914] mt-1">{stats.pendingApplications} টি</div>
                    <span className="text-[11px] text-amber-700 font-medium">অনলাইন ও অফিস মিলিয়ে</span>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm border-l-4 border-l-emerald-600">
                    <span className="text-xs text-gray-500 font-semibold uppercase">সর্বমোট ফান্ড ব্যালেন্স</span>
                    <div className="text-2xl font-bold font-mono text-[#0D5C3A] mt-1">
                      ৳ {stats.totalFundBalance.toLocaleString("bn-BD")}
                    </div>
                    <span className="text-[11px] text-gray-500">৫টি পৃথক ফান্ডের সম্মিলিত হিসাব</span>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm border-l-4 border-l-blue-600">
                    <span className="text-xs text-gray-500 font-semibold uppercase">শিক্ষক ও উস্তাদ</span>
                    <div className="text-2xl font-bold font-mono text-[#0B1914] mt-1">{stats.totalTeachers} জন</div>
                    <span className="text-[11px] text-blue-700 font-medium">নূরানী, হিফজ ও কিতাব অনুষদ</span>
                  </div>
                </div>

                {/* 2-Column Split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                      <h2 className="font-bold text-sm text-[#0B1914] flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-[#0D5C3A]" />
                        অপেক্ষমাণ ভর্তি আবেদন
                      </h2>
                      <button onClick={() => setActiveTab("ADMISSION")} className="text-xs text-[#0D5C3A] hover:underline font-semibold">
                        সবগুলো দেখুন ({stats.pendingApplications})
                      </button>
                    </div>

                    {stats.recentApplications.length === 0 ? (
                      <p className="text-xs text-gray-500 py-6 text-center">কোনো অপেক্ষমাণ আবেদন নেই।</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {stats.recentApplications.slice(0, 5).map((app) => (
                          <div key={app.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-semibold text-gray-900">{app.studentNameBn}</p>
                              <p className="text-[11px] text-gray-500 font-mono">
                                {app.applicationNumber} | {app.guardianPhone}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                app.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {app.status === "APPROVED" ? "অনুমোদিত" : "অপেক্ষমাণ"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                      <h2 className="font-bold text-sm text-[#0B1914] flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-[#0D5C3A]" />
                        তহবিল ব্যালেন্স (Fund Management)
                      </h2>
                      <button onClick={() => setActiveTab("FINANCE")} className="text-xs text-[#0D5C3A] hover:underline font-semibold">
                        ক্যাশবুকে যান
                      </button>
                    </div>

                    <div className="space-y-3">
                      {stats.funds.map((f, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-100 text-xs">
                          <div>
                            <span className="font-semibold text-gray-800 block">{f.nameBn}</span>
                            <span className="text-[10px] text-gray-400 font-mono">CODE: {f.code}</span>
                          </div>
                          <span className="font-bold font-mono text-sm text-[#0D5C3A]">
                            ৳ {f.currentBalance.toLocaleString("bn-BD")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. STUDENTS */}
            {activeTab === "STUDENTS" && (
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
                  <div>
                    <h2 className="text-base font-bold text-[#0B1914]">স্থায়ী শিক্ষার্থী ও রোল রেকর্ড তালিকা</h2>
                    <p className="text-xs text-gray-500">মাদরাসার সকল ছাত্রের রোল, জামাত, আবাসিক অবস্থা ও ফি বকেয়া তালিকা।</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="নাম, রোল বা আইডি দিয়ে খুঁজুন..."
                        value={studentSearch}
                        onChange={(e) => {
                          setStudentSearch(e.target.value);
                          loadStudents(e.target.value);
                        }}
                        className="pl-8 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {loadingStudents ? (
                  <p className="text-xs text-gray-500 py-6 text-center">শিক্ষার্থী লোড হচ্ছে...</p>
                ) : studentsList.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center">কোনো শিক্ষার্থী পাওয়া যায়নি।</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-gray-200">
                      <thead className="bg-[#F9F8F3] border-b border-gray-200 text-gray-700 font-semibold">
                        <tr>
                          <th className="p-3">ছাত্র আইডি</th>
                          <th className="p-3">রোল</th>
                          <th className="p-3">নাম</th>
                          <th className="p-3">জামাত / শ্রেণি</th>
                          <th className="p-3">অভিভাবক ও ফোন</th>
                          <th className="p-3">আবাসিক অবস্থা</th>
                          <th className="p-3 text-right">বকেয়া ফি</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {studentsList.map((st) => (
                          <tr key={st.id} className="hover:bg-gray-50">
                            <td className="p-3 font-mono font-bold text-[#0D5C3A]">{st.studentIdNumber}</td>
                            <td className="p-3 font-mono font-bold text-gray-800">{st.rollNumber}</td>
                            <td className="p-3 font-semibold text-gray-900">{st.fullNameBn}</td>
                            <td className="p-3">{st.className}</td>
                            <td className="p-3">
                              <p className="font-semibold text-gray-800">{st.fatherNameBn}</p>
                              <p className="text-[11px] text-gray-400 font-mono">{st.fatherPhone}</p>
                            </td>
                            <td className="p-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  st.isOrphan
                                    ? "bg-purple-100 text-purple-800"
                                    : st.residentialStatus === "RESIDENTIAL"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {st.isOrphan ? "এতিম (বোর্ডিং)" : st.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold">
                              {st.totalDue > 0 ? (
                                <span className="text-red-700">৳ {st.totalDue.toLocaleString("bn-BD")}</span>
                              ) : (
                                <span className="text-emerald-700">পরিশোধিত</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 3. ADMISSION */}
            {activeTab === "ADMISSION" && (
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
                  <div>
                    <h2 className="text-base font-bold text-[#0B1914]">ভর্তি আবেদন ও শিক্ষার্থী তালিকাভুক্তি</h2>
                    <p className="text-xs text-gray-500">অনলাইন বা সরাসরি আসা আবেদন যাচাই করে এক ক্লিকে স্থায়ী শিক্ষার্থী হিসাবে অনুমোদন করুন।</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/admin/admissions"
                      className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shadow"
                    >
                      সম্পূর্ণ ভর্তি ড্যাশবোর্ড খুলুন →
                    </Link>
                    <Link
                      href="/admission"
                      target="_blank"
                      className="border border-[#0D5C3A] text-[#0D5C3A] hover:bg-emerald-50 px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      অনলাইন ফরম
                    </Link>
                  </div>
                </div>

                {stats.recentApplications.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-10">কোনো ভর্তি আবেদন সংরক্ষিত নেই।</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-gray-200">
                      <thead className="bg-[#F9F8F3] border-b border-gray-200 text-gray-700 font-semibold">
                        <tr>
                          <th className="p-3">ট্র্যাকিং নম্বর</th>
                          <th className="p-3">শিক্ষার্থীর নাম</th>
                          <th className="p-3">অভিভাবকের মোবাইল</th>
                          <th className="p-3">ইমেইল</th>
                          <th className="p-3">আবেদনের তারিখ</th>
                          <th className="p-3">বর্তমান অবস্থা</th>
                          <th className="p-3 text-right">কার্যক্রম</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stats.recentApplications.map((app) => (
                          <tr key={app.id} className="hover:bg-gray-50">
                            <td className="p-3 font-mono font-bold text-[#0D5C3A]">{app.applicationNumber}</td>
                            <td className="p-3 font-semibold text-gray-900">{app.studentNameBn}</td>
                            <td className="p-3 font-mono">{app.guardianPhone}</td>
                            <td className="p-3 text-gray-500">{app.guardianEmail || "প্রদান করা হয়নি"}</td>
                            <td className="p-3 text-gray-500">{new Date(app.createdAt).toLocaleDateString("bn-BD")}</td>
                            <td className="p-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  app.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {app.status === "APPROVED" ? "অনুমোদিত" : "অপেক্ষমাণ"}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <Link
                                href={`/admin/admissions/${app.id}`}
                                className="text-[11px] text-[#0D5C3A] hover:underline font-semibold"
                              >
                                রিভিউ / বিস্তারিত →
                              </Link>
                              {app.status === "PENDING" || app.status === "SUBMITTED" ? (
                                <button
                                  onClick={() => handleApproveAdmission(app.id)}
                                  disabled={approvingId === app.id}
                                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded text-[11px] font-bold transition shadow-sm inline-flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  {approvingId === app.id ? "অনুমোদন হচ্ছে..." : "অনুমোদন করুন"}
                                </button>
                              ) : app.status === "APPROVED" ? (
                                <span className="text-[11px] text-green-700 font-semibold">স্থায়ী ছাত্র তালিকাভুক্ত</span>
                              ) : (
                                <span className="text-[11px] text-stone-500 font-semibold">{app.status}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 4. ACADEMIC */}
            {activeTab === "ACADEMIC" && (
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-[#0B1914] border-b pb-2">একাডেমিক কাঠামো ও শিক্ষাবর্ষ</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <span className="font-bold text-sm text-[#083B25] block">চলতি শিক্ষাবর্ষ</span>
                    <span className="font-mono text-gray-700 mt-1 block">২০২৫-২০২৬</span>
                    <span className="text-[11px] text-emerald-700">সক্রিয় সেশন</span>
                  </div>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <span className="font-bold text-sm text-[#083B25] block">অনুমোদিত জামাত সংখ্যা</span>
                    <span className="font-mono text-gray-700 mt-1 block">১৫ টি</span>
                    <span className="text-[11px] text-gray-500">শিশু থেকে কাফিয়া ও হিফজ</span>
                  </div>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <span className="font-bold text-sm text-[#083B25] block">শিক্ষাদান পদ্ধতি</span>
                    <span className="text-gray-700 mt-1 block">কওমি ও হাফিজিয়া কারিকুলাম</span>
                    <span className="text-[11px] text-blue-700">বেফাকুল মাদারিসিল আরাবিয়া স্ট্যান্ডার্ড</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. ATTENDANCE */}
            {activeTab === "ATTENDANCE" && <AdminAttendanceCockpit />}

            {/* 6. EXAMINATION */}
            {activeTab === "EXAMINATION" && <AdminExamHub />}

            {/* 7. FINANCE */}
            {activeTab === "FINANCE" && <AdminFinanceHub />}

            {/* 8. DOCUMENTS */}
            {activeTab === "DOCUMENTS" && <AdminDocumentHub />}


            {/* 9 & 10. COMMUNICATION & CMS */}
            {(activeTab === "COMMUNICATION" || activeTab === "CMS") && (
              <AdminCommunicationHub />
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

            {/* 15. HELPDESK & COMPLAINT ENGINE */}
            {activeTab === "HELPDESK" && <AdminHelpdeskHub />}

            {/* 11. REPORTS */}
            {activeTab === "REPORTS" && (
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-[#0B1914] border-b pb-2">প্রতিষ্ঠানিক অডিট ও সমন্বিত রিপোর্ট</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <span className="font-bold text-sm block">লিল্লাহ ও যাকাত ফান্ড ব্যালেন্স রিপোর্ট</span>
                    <span className="text-gray-500 mt-1 block">
                      বর্তমান সংরক্ষিত তহবিল: ৳ {stats.totalFundBalance.toLocaleString("bn-BD")}
                    </span>
                    <button onClick={() => window.print()} className="mt-2 text-[#0D5C3A] font-bold flex items-center gap-1">
                      <Printer className="w-3.5 h-3.5" /> রিপোর্ট প্রিন্ট করুন
                    </button>
                  </div>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <span className="font-bold text-sm block">ভর্তি ও ছাত্র উপস্থিতি সারসংক্ষেপ</span>
                    <span className="text-gray-500 mt-1 block">মোট ছাত্র: {stats.totalStudents} জন (সক্রিয়)</span>
                    <button onClick={() => window.print()} className="mt-2 text-[#0D5C3A] font-bold flex items-center gap-1">
                      <Printer className="w-3.5 h-3.5" /> রিপোর্ট প্রিন্ট করুন
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 12. USERS */}
            {activeTab === "USERS" && (
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
                  <div>
                    <h2 className="text-base font-bold text-[#0B1914]">উস্তাদ ও শিক্ষক পরিচালনা</h2>
                    <p className="text-xs text-gray-500">সকল শিক্ষক ও কর্মচারীর তালিকা এবং নতুন উস্তাদের জন্য লগইন পাসওয়ার্ড ও অ্যাকাউন্ট তৈরি করুন।</p>
                  </div>
                  <button
                    onClick={() => setShowAddTeacher(!showAddTeacher)}
                    className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shadow w-fit"
                  >
                    <UserPlus className="w-4 h-4" />
                    নতুন উস্তাদ যোগ করুন
                  </button>
                </div>

                {teacherMsg && (
                  <div className="p-3 rounded bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                    {teacherMsg}
                  </div>
                )}

                {showAddTeacher && (
                  <form onSubmit={handleCreateTeacher} className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-3">
                    <h3 className="font-bold text-xs text-[#0B1914]">নতুন শিক্ষকের তথ্য ও লগইন ক্রেডেনশিয়াল</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">উস্তাদের নাম *</label>
                        <input
                          type="text"
                          required
                          value={teacherName}
                          onChange={(e) => setTeacherName(e.target.value)}
                          placeholder="মাওলানা মুহাম্মদ..."
                          className="w-full p-2 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">ইমেইল এড্রেস *</label>
                        <input
                          type="email"
                          required
                          value={teacherEmail}
                          onChange={(e) => setTeacherEmail(e.target.value)}
                          placeholder="ustad@gmail.com বা teacher@ehrjmadrasha.com"
                          className="w-full p-2 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">মোবাইল নম্বর</label>
                        <input
                          type="text"
                          value={teacherPhone}
                          onChange={(e) => setTeacherPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full p-2 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">প্রাথমিক পাসওয়ার্ড *</label>
                        <input
                          type="password"
                          required
                          value={teacherPassword}
                          onChange={(e) => setTeacherPassword(e.target.value)}
                          placeholder="কমপক্ষে ৬ অক্ষর..."
                          className="w-full p-2 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddTeacher(false)}
                        className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-100"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-1.5 rounded text-xs font-semibold shadow"
                      >
                        সংরক্ষণ করুন
                      </button>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-gray-200">
                    <thead className="bg-[#F9F8F3] border-b border-gray-200 text-gray-700 font-semibold">
                      <tr>
                        <th className="p-3">উস্তাদের নাম</th>
                        <th className="p-3">ইমেইল ও ফোন</th>
                        <th className="p-3">ভূমিকা (Role)</th>
                        <th className="p-3">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {teachersList.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="p-3 font-semibold text-gray-900">{t.name}</td>
                          <td className="p-3">
                            <span className="font-mono text-gray-800">{t.email}</span>
                            {t.phone && <span className="text-[11px] text-gray-500 block font-mono">{t.phone}</span>}
                          </td>
                          <td className="p-3">
                            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
                              TEACHER
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-[10px] font-bold">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 13. REPORTS & ANALYTICS */}
            {activeTab === "REPORTS" && <AdminAnalyticsHub />}

            {/* 14. OPERATIONS & DISASTER RECOVERY */}
            {activeTab === "OPERATIONS" && <AdminOperationsHub />}

            {/* 15. SETTINGS */}
            {activeTab === "SETTINGS" && (
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-[#0B1914] border-b pb-2">সেন্ট্রাল প্রাতিষ্ঠানিক সেটিংস</h2>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="font-bold">প্রতিষ্ঠানের নাম (বাংলা):</span> {INSTITUTION_INFO.nameBn}
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="font-bold">প্রতিষ্ঠানের নাম (ইংরেজি):</span> {INSTITUTION_INFO.nameEn}
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="font-bold">অধ্যক্ষ / মুহতামিম:</span> {INSTITUTION_INFO.principal}
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="font-bold">যোগাযোগ ফোন:</span> {INSTITUTION_INFO.primaryPhone}, 01826-416696, 01949-091911
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="font-bold">ক্যাম্পাস অবস্থান:</span> পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="font-bold">সাপোর্ট ইমেইল:</span> ehrjmadrasha@gmail.com
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
