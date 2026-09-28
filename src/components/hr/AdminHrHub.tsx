"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Printer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
  DollarSign,
  QrCode,
  Shield,
  Eye,
  Edit2,
  ChevronRight,
  Phone,
  Mail,
  UserCheck,
  Building,
  GraduationCap,
  ArrowRight,
  Plus,
} from "lucide-react";

export default function AdminHrHub() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "employees" | "add_employee" | "leave" | "attendance" | "departments_designations" | "reports"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Core Data
  const [employees, setEmployees] = useState<any[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // New Employee Form State
  const [empForm, setEmpForm] = useState({
    nameBn: "",
    nameEn: "",
    employeeType: "TEACHER",
    departmentId: "",
    designationId: "",
    gender: "MALE",
    mobile: "",
    email: "",
    nidNumber: "",
    baseSalary: "0",
    joiningDate: new Date().toISOString().split("T")[0],
    presentAddress: "",
    permanentAddress: "",
    emergencyContact: "",
    notes: "",
  });

  // Selected Employee Details Modal
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empDetailLoading, setEmpDetailLoading] = useState(false);

  // Status Change Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState({
    newStatus: "ON_LEAVE",
    reason: "",
    remarks: "",
  });

  // ID Card Modal
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  const [loadingCard, setLoadingCard] = useState(false);

  // Leave Review State
  const [reviewModalData, setReviewModalData] = useState<{
    id: string;
    decision: "APPROVED" | "REJECTED";
    reason: string;
  } | null>(null);

  // Attendance Form
  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);
  const [attStatusMap, setAttStatusMap] = useState<Record<string, string>>({});

  // Reports State
  const [reportType, setReportType] = useState<"EMPLOYEE_REGISTER" | "TEACHER_REGISTER" | "LEAVE_REPORT" | "DOCUMENT_EXPIRY">("EMPLOYEE_REGISTER");
  const [reportData, setReportData] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Department / Designation creation state
  const [newDeptNameBn, setNewDeptNameBn] = useState("");
  const [newDeptNameEn, setNewDeptNameEn] = useState("");
  const [newDesigNameBn, setNewDesigNameBn] = useState("");
  const [newDesigNameEn, setNewDesigNameEn] = useState("");

  // Auto-dismiss alert
  useEffect(() => {
    if (actionMsg) {
      const timer = setTimeout(() => setActionMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionMsg]);

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchEmployees(),
        fetchDepartments(),
        fetchDesignations(),
        fetchLeaveTypes(),
        fetchLeaveRequests(),
      ]);
    } catch (err: any) {
      console.error("Error loading HR hub data:", err);
      setActionMsg({ text: "তথ্য লোড করার সময় সমস্যা হয়েছে।", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/hr/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (typeFilter) params.set("employeeType", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (departmentFilter) params.set("departmentId", departmentFilter);

      const res = await fetch(`/api/admin/hr/employees?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
        setTotalEmployees(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/admin/hr/departments");
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDesignations = async () => {
    try {
      const res = await fetch("/api/admin/hr/designations");
      const data = await res.json();
      if (data.success) {
        setDesignations(data.designations || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await fetch("/api/admin/hr/leave/types");
      const data = await res.json();
      if (data.success) {
        setLeaveTypes(data.leaveTypes || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await fetch("/api/admin/hr/leave/requests");
      const data = await res.json();
      if (data.success) {
        setLeaveRequests(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendance = async (dateStr: string) => {
    try {
      const res = await fetch(`/api/admin/hr/attendance?date=${dateStr}`);
      const data = await res.json();
      if (data.success) {
        setAttendanceRecords(data.attendances || []);
        const map: Record<string, string> = {};
        for (const att of data.attendances) {
          map[att.employeeId] = att.status;
        }
        setAttStatusMap(map);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/admin/hr/reports?type=${reportType}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...empForm,
          baseSalary: parseFloat(empForm.baseSalary) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({ text: `কর্মী সফলভাবে নিবন্ধিত হয়েছে (আইডি: ${data.employee.employeeId})।`, type: "success" });
        setEmpForm({
          nameBn: "",
          nameEn: "",
          employeeType: "TEACHER",
          departmentId: "",
          designationId: "",
          gender: "MALE",
          mobile: "",
          email: "",
          nidNumber: "",
          baseSalary: "0",
          joiningDate: new Date().toISOString().split("T")[0],
          presentAddress: "",
          permanentAddress: "",
          emergencyContact: "",
          notes: "",
        });
        fetchEmployees();
        fetchStats();
        setActiveTab("employees");
      } else {
        setActionMsg({ text: data.error || "নিবন্ধন ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "নেটওয়ার্ক সমস্যা।", type: "error" });
    }
  };

  const handleViewEmployee = async (id: string) => {
    setShowEmpModal(true);
    setEmpDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/hr/employees/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedEmp(data.employee);
      } else {
        setActionMsg({ text: data.error, type: "error" });
        setShowEmpModal(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEmpDetailLoading(false);
    }
  };

  const handleChangeStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      const res = await fetch(`/api/admin/hr/employees/${selectedEmp.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusChangeData),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({ text: `কর্মসংস্থান স্ট্যাটাস পরিবর্তিত হয়ে '${statusChangeData.newStatus}' হয়েছে।`, type: "success" });
        setShowStatusModal(false);
        handleViewEmployee(selectedEmp.id);
        fetchEmployees();
        fetchStats();
      } else {
        setActionMsg({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleOpenIdCard = async (empId: string) => {
    setShowCardModal(true);
    setLoadingCard(true);
    try {
      const res = await fetch(`/api/admin/hr/employees/${empId}?card=true`);
      const data = await res.json();
      if (data.success) {
        setCardData(data.cardData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCard(false);
    }
  };

  const handleReviewLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalData) return;
    try {
      const res = await fetch(`/api/admin/hr/leave/requests/${reviewModalData.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: reviewModalData.decision,
          decisionReason: reviewModalData.reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({
          text: `ছুটির আবেদন '${reviewModalData.decision === "APPROVED" ? "অনুমোদিত" : "নামঞ্জুর"}' করা হয়েছে।`,
          type: "success",
        });
        setReviewModalData(null);
        fetchLeaveRequests();
        fetchStats();
      } else {
        setActionMsg({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, type: "error" });
    }
  };

  const handleRecordAttendance = async (empId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/hr/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: empId,
          date: attDate,
          status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAttStatusMap((prev) => ({ ...prev, [empId]: status }));
      } else {
        setActionMsg({ text: data.error, type: "error" });
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/hr/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameBn: newDeptNameBn, nameEn: newDeptNameEn }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({ text: "নতুন দপ্তর তৈরি হয়েছে।", type: "success" });
        setNewDeptNameBn("");
        setNewDeptNameEn("");
        fetchDepartments();
      } else {
        setActionMsg({ text: data.error, type: "error" });
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleCreateDesig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/hr/designations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameBn: newDesigNameBn, nameEn: newDesigNameEn }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({ text: "নতুন পদবি তৈরি হয়েছে।", type: "success" });
        setNewDesigNameBn("");
        setNewDesigNameEn("");
        fetchDesignations();
      } else {
        setActionMsg({ text: data.error, type: "error" });
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Notification Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#083B25] text-white p-2 rounded-lg">
              <Users className="w-5 h-5 text-[#C59B27]" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-[#083B25]">
                মানবসম্পদ, শিক্ষক ও স্টাফ সেন্ট্রাল ম্যানেজমেন্ট ইঞ্জিন
              </h1>
              <p className="text-xs text-gray-500">
                Phase 13: EHRJ Madrasha Central HR, Teacher & Institutional Staff Engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition"
            title="তথ্য রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </button>
          <button
            onClick={() => setActiveTab("add_employee")}
            className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
          >
            <UserPlus className="w-4 h-4 text-[#C59B27]" />
            নতুন কর্মী যুক্ত করুন
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            actionMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMsg.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionMsg.text}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-gray-400 hover:text-gray-700">
            ✕
          </button>
        </div>
      )}

      {/* Primary HR Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto bg-white px-3 pt-2 rounded-t-xl border-t border-x">
        {[
          { id: "overview", label: "সারসংক্ষেপ ও মেট্রিক্স", icon: Briefcase },
          { id: "employees", label: `কর্মী তালিকা (${totalEmployees})`, icon: Users },
          { id: "add_employee", label: "নতুন কর্মী ফর্ম", icon: UserPlus },
          { id: "leave", label: `ছুটি ব্যবস্থাপনা (${leaveRequests.filter((r) => r.status === "SUBMITTED").length})`, icon: Calendar },
          { id: "attendance", label: "দৈনিক স্টাফ হাজিরা", icon: Clock },
          { id: "departments_designations", label: "দপ্তর ও পদবি কাঠামো", icon: Building2 },
          { id: "reports", label: "এইচআর রিপোর্ট ও অডিট", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === "attendance") fetchAttendance(attDate);
                if (tab.id === "reports") fetchReport();
              }}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-[#0D5C3A] text-[#0D5C3A] bg-[#0D5C3A]/5 rounded-t-md"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-semibold text-gray-500 block">মোট কর্মী</span>
              <span className="text-2xl font-black text-[#083B25] mt-1 block">
                {stats?.totalEmployees || 0}
              </span>
              <span className="text-[10px] text-gray-400 mt-1 block">শিক্ষক ও স্টাফসহ</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-semibold text-emerald-600 block">সক্রিয় কর্মী</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {stats?.activeEmployees || 0}
              </span>
              <span className="text-[10px] text-emerald-500 mt-1 block">Active on duty</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-semibold text-blue-600 block">শিক্ষক পরিষদ</span>
              <span className="text-2xl font-black text-blue-700 mt-1 block">
                {stats?.teachersCount || 0}
              </span>
              <span className="text-[10px] text-blue-500 mt-1 block">উস্তাদ ও মুহাদ্দিস</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-semibold text-purple-600 block">সহায়ক স্টাফ</span>
              <span className="text-2xl font-black text-purple-700 mt-1 block">
                {stats?.staffCount || 0}
              </span>
              <span className="text-[10px] text-purple-500 mt-1 block">অফিস, পাকঘর ও ড্রাইভ</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-semibold text-amber-600 block">ছুটিতে আছেন</span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">
                {stats?.onLeaveCount || 0}
              </span>
              <span className="text-[10px] text-amber-500 mt-1 block">অনুমোদিত ছুটি</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-semibold text-rose-600 block">অপেক্ষমাণ ছুটি</span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">
                {stats?.pendingLeavesCount || 0}
              </span>
              <span className="text-[10px] text-rose-500 mt-1 block">অনুমোদন প্রয়োজন</span>
            </div>
          </div>

          {/* Quick Info Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expiring Documents Alert Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-xs text-gray-800">
                    মেয়াদ উত্তীর্ণের সন্নিকটে থাকা ডকুমেন্টস ({stats?.expiringDocumentsCount || 0})
                  </h3>
                </div>
                <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold">
                  আগামী ৩০ দিনের ভেতর
                </span>
              </div>

              {stats?.expiringDocuments && stats.expiringDocuments.length > 0 ? (
                <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto text-xs">
                  {stats.expiringDocuments.map((doc: any) => (
                    <div key={doc.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-gray-800 block">{doc.title}</span>
                        <span className="text-[11px] text-gray-500">
                          {doc.employee?.nameBn} ({doc.employee?.employeeId})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-rose-600 font-bold block text-[11px]">
                          মেয়াদ: {new Date(doc.expiryDate).toLocaleDateString("bn-BD")}
                        </span>
                        <span className="text-[10px] text-gray-400">{doc.documentType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">
                  আগামী ৩০ দিনে মেয়াদ উত্তীর্ণ হবে এমন কোনো চুক্তি বা লাইসেন্স নেই।
                </p>
              )}
            </div>

            {/* Recent Status Changes Audit Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0D5C3A]" />
                  <h3 className="font-bold text-xs text-gray-800">সাম্প্রতিক কর্মসংস্থান স্থিতি ও ইতিহাস</h3>
                </div>
                <span className="text-[10px] text-gray-400">সর্বশেষ লগ</span>
              </div>

              {stats?.recentStatusChanges && stats.recentStatusChanges.length > 0 ? (
                <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto text-xs">
                  {stats.recentStatusChanges.map((hist: any) => (
                    <div key={hist.id} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{hist.employee?.nameBn}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {hist.changeType}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 block">{hist.reason || hist.newValue}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 text-[10px] block">
                          {new Date(hist.createdAt).toLocaleDateString("bn-BD")}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">{hist.recordedByUser?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">কোনো সাম্প্রতিক পরিবর্তন পাওয়া যায়নি।</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: EMPLOYEES DIRECTORY */}
      {activeTab === "employees" && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchEmployees()}
                placeholder="কর্মী আইডি, নাম বা মোবাইল দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setTimeout(fetchEmployees, 50);
                }}
                className="p-2 border border-gray-300 rounded-lg text-xs outline-none bg-white text-gray-700"
              >
                <option value="">সকল ধরন (All Types)</option>
                <option value="TEACHER">শিক্ষক (Teacher)</option>
                <option value="ACCOUNTANT">হিসাবরক্ষক (Accountant)</option>
                <option value="OFFICE">অফিস স্টাফ (Office)</option>
                <option value="DRIVER">ড্রাইভার (Driver)</option>
                <option value="COOK">বাবুর্চি (Cook)</option>
                <option value="SECURITY">নিরাপত্তা (Security)</option>
                <option value="CLEANER">পরিচ্ছন্নতাকর্মী (Cleaner)</option>
                <option value="SUPPORT">সহায়ক (Support)</option>
                <option value="OTHER">অন্যান্য (Other)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setTimeout(fetchEmployees, 50);
                }}
                className="p-2 border border-gray-300 rounded-lg text-xs outline-none bg-white text-gray-700"
              >
                <option value="">সকল স্ট্যাটাস (All Status)</option>
                <option value="ACTIVE">সক্রিয় (Active)</option>
                <option value="ON_LEAVE">ছুটিতে (On Leave)</option>
                <option value="SUSPENDED">স্থগিত (Suspended)</option>
                <option value="RESIGNED">অব্যাহতিপ্রাপ্ত (Resigned)</option>
                <option value="TERMINATED">বরখাস্ত (Terminated)</option>
                <option value="RETIRED">অবসরপ্রাপ্ত (Retired)</option>
                <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
              </select>

              <button
                onClick={fetchEmployees}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" /> ফিল্টার
              </button>
            </div>
          </div>

          {/* Employees Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8F3] border-b border-gray-200 text-gray-700 font-semibold">
                <tr>
                  <th className="p-3">কর্মী আইডি</th>
                  <th className="p-3">নাম ও পরিচিতি</th>
                  <th className="p-3">দপ্তর ও পদবি</th>
                  <th className="p-3">ধরন</th>
                  <th className="p-3">যোগাযোগ</th>
                  <th className="p-3">মূল বেতন</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition">
                      <td className="p-3 font-mono font-bold text-[#083B25]">{emp.employeeId}</td>
                      <td className="p-3">
                        <span className="font-bold text-gray-900 block">{emp.nameBn}</span>
                        <span className="text-[11px] text-gray-500 font-sans">{emp.nameEn}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-gray-800 block">
                          {emp.designation?.nameBn || "নির্ধারিত নেই"}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {emp.department?.nameBn || "সাধারণ"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          {emp.employeeType}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        <span className="block text-gray-800">{emp.mobile}</span>
                        {emp.email && <span className="text-[10px] text-gray-400 block">{emp.email}</span>}
                      </td>
                      <td className="p-3 font-bold text-gray-900">
                        ৳{emp.baseSalary ? emp.baseSalary.toLocaleString("bn-BD") : "০"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            emp.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : emp.status === "ON_LEAVE"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleViewEmployee(emp.id)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-semibold transition"
                          title="সম্পূর্ণ প্রোফাইল দেখুন"
                        >
                          প্রোফাইল
                        </button>
                        <button
                          onClick={() => handleOpenIdCard(emp.id)}
                          className="px-2.5 py-1 bg-[#083B25]/10 hover:bg-[#083B25]/20 text-[#083B25] rounded text-[11px] font-semibold transition"
                          title="ডিজিটাল আইডি কার্ড"
                        >
                          আইডি কার্ড
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      কোনো কর্মী রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: ADD NEW EMPLOYEE FORM */}
      {activeTab === "add_employee" && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-base font-bold text-[#083B25]">নতুন শিক্ষক বা স্টাফ নিবন্ধন ফর্ম</h2>
            <p className="text-xs text-gray-500">
              সিস্টেমে নতুন কর্মকর্তা বা কর্মচারীর প্রাথমিক ব্যক্তিগত ও প্রাতিষ্ঠানিক তথ্য সংরক্ষণ করুন।
            </p>
          </div>

          <form onSubmit={handleCreateEmployee} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">পূর্ণ নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={empForm.nameBn}
                  onChange={(e) => setEmpForm({ ...empForm, nameBn: e.target.value })}
                  placeholder="মাওলানা মুহাম্মাদ..."
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Full Name (English) *</label>
                <input
                  type="text"
                  required
                  value={empForm.nameEn}
                  onChange={(e) => setEmpForm({ ...empForm, nameEn: e.target.value })}
                  placeholder="Mawlana Muhammad..."
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">কর্মীর ধরন (Type) *</label>
                <select
                  value={empForm.employeeType}
                  onChange={(e) => setEmpForm({ ...empForm, employeeType: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none bg-white"
                >
                  <option value="TEACHER">শিক্ষক / উস্তাদ (Teacher)</option>
                  <option value="ACCOUNTANT">হিসাবরক্ষক (Accountant)</option>
                  <option value="OFFICE">অফিস সহকারী (Office)</option>
                  <option value="DRIVER">চালক / ড্রাইভার (Driver)</option>
                  <option value="COOK">বাবুর্চি (Cook)</option>
                  <option value="SECURITY">নিরাপত্তা প্রহরী (Security)</option>
                  <option value="CLEANER">পরিচ্ছন্নতাকর্মী (Cleaner)</option>
                  <option value="SUPPORT">সহায়ক স্টাফ (Support)</option>
                  <option value="OTHER">অন্যান্য (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">দপ্তর / বিভাগ (Department)</label>
                <select
                  value={empForm.departmentId}
                  onChange={(e) => setEmpForm({ ...empForm, departmentId: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none bg-white"
                >
                  <option value="">দপ্তর নির্বাচন করুন</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.nameBn} ({dept.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">পদবি (Designation)</label>
                <select
                  value={empForm.designationId}
                  onChange={(e) => setEmpForm({ ...empForm, designationId: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none bg-white"
                >
                  <option value="">পদবি নির্বাচন করুন</option>
                  {designations.map((des) => (
                    <option key={des.id} value={des.id}>
                      {des.nameBn} ({des.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">মোবাইল নম্বর *</label>
                <input
                  type="text"
                  required
                  value={empForm.mobile}
                  onChange={(e) => setEmpForm({ ...empForm, mobile: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">ইমেইল এড্রেস</label>
                <input
                  type="email"
                  value={empForm.email}
                  onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                  placeholder="emp@ehrjmadrasha.com"
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">জাতীয় পরিচয়পত্র (NID)</label>
                <input
                  type="text"
                  value={empForm.nidNumber}
                  onChange={(e) => setEmpForm({ ...empForm, nidNumber: e.target.value })}
                  placeholder="NID নম্বর..."
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">যোগদানের তারিখ</label>
                <input
                  type="date"
                  value={empForm.joiningDate}
                  onChange={(e) => setEmpForm({ ...empForm, joiningDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">প্রাথমিক মূল বেতন (টাকা)</label>
                <input
                  type="number"
                  value={empForm.baseSalary}
                  onChange={(e) => setEmpForm({ ...empForm, baseSalary: e.target.value })}
                  placeholder="৳..."
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">জরুরি যোগাযোগ নম্বর</label>
                <input
                  type="text"
                  value={empForm.emergencyContact}
                  onChange={(e) => setEmpForm({ ...empForm, emergencyContact: e.target.value })}
                  placeholder="আত্মীয়ের ফোন নম্বর..."
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">বর্তমান ঠিকানা</label>
                <input
                  type="text"
                  value={empForm.presentAddress}
                  onChange={(e) => setEmpForm({ ...empForm, presentAddress: e.target.value })}
                  placeholder="গ্রাম, ডাকঘর, থানা..."
                  className="w-full p-2 border border-gray-300 rounded text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setActiveTab("employees")}
                className="px-4 py-2 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-100"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-6 py-2 rounded text-xs font-bold shadow"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT 4: LEAVE MANAGEMENT */}
      {activeTab === "leave" && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-base font-bold text-[#083B25]">কর্মচারী ছুটির আবেদন ও অনুমোদন ডেস্ক</h2>
              <p className="text-xs text-gray-500">অনুমোদিত ছুটি স্বয়ংক্রিয়ভাবে ব্যালেন্স অ্যাডজাস্ট করে।</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8F3] border-b border-gray-200 text-gray-700 font-semibold">
                <tr>
                  <th className="p-3">আবেদন কোড</th>
                  <th className="p-3">কর্মী</th>
                  <th className="p-3">ছুটির ধরন</th>
                  <th className="p-3">সময়সীমা</th>
                  <th className="p-3">মোট দিন</th>
                  <th className="p-3">ছুটির কারণ</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3 text-right">সিদ্ধান্ত</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaveRequests.length > 0 ? (
                  leaveRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-gray-800">{req.requestCode}</td>
                      <td className="p-3">
                        <span className="font-bold text-gray-900 block">{req.employee?.nameBn}</span>
                        <span className="text-[10px] text-gray-500">{req.employee?.employeeId}</span>
                      </td>
                      <td className="p-3 font-semibold text-gray-800">{req.leaveType?.nameBn}</td>
                      <td className="p-3">
                        {new Date(req.startDate).toLocaleDateString("bn-BD")} হতে{" "}
                        {new Date(req.endDate).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="p-3 font-bold text-[#083B25]">{req.totalDays} দিন</td>
                      <td className="p-3 text-gray-600 max-w-xs truncate">{req.reason}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : req.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {req.status === "SUBMITTED" ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() =>
                                setReviewModalData({
                                  id: req.id,
                                  decision: "APPROVED",
                                  reason: "কর্তৃপক্ষ কর্তৃক ছুটির আবেদন অনুমোদিত",
                                })
                              }
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                            >
                              অনুমোদন
                            </button>
                            <button
                              onClick={() =>
                                setReviewModalData({
                                  id: req.id,
                                  decision: "REJECTED",
                                  reason: "প্রাতিষ্ঠানিক বা একাডেমিক কারণে ছুটি নামঞ্জুর",
                                })
                              }
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                            >
                              নামঞ্জুর
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">নিষ্পন্ন</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      কোনো ছুটির আবেদন রেকর্ড নেই।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: STAFF ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b pb-3">
            <div>
              <h2 className="text-base font-bold text-[#083B25]">দৈনিক স্টাফ ও উস্তাদ হাজিরা ককপিট</h2>
              <p className="text-xs text-gray-500">তারিখ অনুযায়ী কর্মীদের উপস্থিতি স্ট্যাটাস সংরক্ষণ করুন।</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600">হাজিরার তারিখ:</label>
              <input
                type="date"
                value={attDate}
                onChange={(e) => {
                  setAttDate(e.target.value);
                  fetchAttendance(e.target.value);
                }}
                className="p-1.5 border border-gray-300 rounded text-xs outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8F3] border-b border-gray-200 text-gray-700 font-semibold">
                <tr>
                  <th className="p-3">আইডি</th>
                  <th className="p-3">নাম</th>
                  <th className="p-3">পদবি</th>
                  <th className="p-3">বর্তমান স্ট্যাটাস</th>
                  <th className="p-3 text-right">হাজিরা নির্ধারণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => {
                  const currentAtt = attStatusMap[emp.id] || "NOT_MARKED";
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-gray-700">{emp.employeeId}</td>
                      <td className="p-3 font-bold text-gray-900">{emp.nameBn}</td>
                      <td className="p-3 text-gray-600">{emp.designation?.nameBn || "স্টাফ"}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            currentAtt === "PRESENT"
                              ? "bg-green-100 text-green-800"
                              : currentAtt === "ABSENT"
                              ? "bg-rose-100 text-rose-800"
                              : currentAtt === "LATE"
                              ? "bg-amber-100 text-amber-800"
                              : currentAtt === "LEAVE"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {currentAtt}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleRecordAttendance(emp.id, "PRESENT")}
                            className="px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded text-[10px] font-bold"
                          >
                            উপস্থিত
                          </button>
                          <button
                            onClick={() => handleRecordAttendance(emp.id, "LATE")}
                            className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded text-[10px] font-bold"
                          >
                            বিলম্ব
                          </button>
                          <button
                            onClick={() => handleRecordAttendance(emp.id, "ABSENT")}
                            className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded text-[10px] font-bold"
                          >
                            অনুপস্থিত
                          </button>
                          <button
                            onClick={() => handleRecordAttendance(emp.id, "LEAVE")}
                            className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded text-[10px] font-bold"
                          >
                            ছুটি
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: DEPARTMENTS & DESIGNATIONS */}
      {activeTab === "departments_designations" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Departments */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#083B25] border-b pb-2">দপ্তর ও বিভাগসমূহ ({departments.length})</h3>

            <form onSubmit={handleCreateDept} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="বাংলা নাম (যেমন: শিক্ষা শাখা)"
                value={newDeptNameBn}
                onChange={(e) => setNewDeptNameBn(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded text-xs outline-none"
              />
              <input
                type="text"
                required
                placeholder="English (e.g. Academic)"
                value={newDeptNameEn}
                onChange={(e) => setNewDeptNameEn(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded text-xs outline-none"
              />
              <button type="submit" className="bg-[#0D5C3A] text-white px-3 py-1.5 rounded text-xs font-bold">
                যুক্ত করুন
              </button>
            </form>

            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {departments.map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-800">{d.nameBn}</span>
                    <span className="text-[11px] text-gray-400 block">{d.nameEn}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">
                    কর্মী: {d._count?.employees || 0} জন
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Designations */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#083B25] border-b pb-2">পদবি কাঠামো ({designations.length})</h3>

            <form onSubmit={handleCreateDesig} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="বাংলা নাম (যেমন: উস্তাদ)"
                value={newDesigNameBn}
                onChange={(e) => setNewDesigNameBn(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded text-xs outline-none"
              />
              <input
                type="text"
                required
                placeholder="English (e.g. Teacher)"
                value={newDesigNameEn}
                onChange={(e) => setNewDesigNameEn(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded text-xs outline-none"
              />
              <button type="submit" className="bg-[#0D5C3A] text-white px-3 py-1.5 rounded text-xs font-bold">
                যুক্ত করুন
              </button>
            </form>

            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {designations.map((des) => (
                <div key={des.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-800">{des.nameBn}</span>
                    <span className="text-[11px] text-gray-400 block">{des.nameEn}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">
                    কর্মী: {des._count?.employees || 0} জন
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: REPORTS */}
      {activeTab === "reports" && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b pb-3">
            <div>
              <h2 className="text-base font-bold text-[#083B25]">প্রাতিষ্ঠানিক এইচআর ও স্টাফ রিপোর্টস</h2>
              <p className="text-xs text-gray-500">অফিশিয়াল রেজিস্টার এবং এক্সপায়ারি লগ ডাউনলোড ও প্রিন্ট করুন।</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value as any);
                  setTimeout(fetchReport, 50);
                }}
                className="p-2 border border-gray-300 rounded text-xs outline-none bg-white font-semibold"
              >
                <option value="EMPLOYEE_REGISTER">কর্মী সাধারণ রেজিস্টার (Employee Register)</option>
                <option value="TEACHER_REGISTER">শিক্ষক পরিষদ রেজিস্টার (Teacher Register)</option>
                <option value="LEAVE_REPORT">ছুটি সংক্রান্ত রিপোর্ট (Leave Report)</option>
                <option value="DOCUMENT_EXPIRY">ডকুমেন্ট মেয়াদ উত্তীর্ণের রিপোর্ট (Expiry Report)</option>
              </select>
              <button
                onClick={() => window.print()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> প্রিন্ট
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8F3] border-b border-gray-200 text-gray-700 font-semibold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">কর্মী আইডি</th>
                  <th className="p-3">নাম</th>
                  <th className="p-3">পদবি ও দপ্তর</th>
                  <th className="p-3">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-400">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-gray-800">
                      {item.employeeId || item.employee?.employeeId || "N/A"}
                    </td>
                    <td className="p-3 font-bold text-gray-900">
                      {item.nameBn || item.employee?.nameBn || item.title || "N/A"}
                    </td>
                    <td className="p-3 text-gray-600">
                      {item.designation?.nameBn || item.employee?.designation?.nameBn || "N/A"}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold">
                        {item.status || item.verificationStatus || "OK"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: EMPLOYEE DETAILS PROFILE */}
      {showEmpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#083B25]">
                  কর্মী প্রোফাইল ও বিস্তারিত রেকর্ড: {selectedEmp?.nameBn}
                </h3>
                <span className="font-mono text-xs text-gray-500">আইডি: {selectedEmp?.employeeId}</span>
              </div>
              <button onClick={() => setShowEmpModal(false)} className="text-gray-400 hover:text-gray-700 text-lg">
                ✕
              </button>
            </div>

            {empDetailLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">লোড হচ্ছে...</div>
            ) : selectedEmp ? (
              <div className="space-y-6 text-xs">
                {/* Identity Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl">
                  <div>
                    <span className="text-[10px] text-gray-400 block">পদবি</span>
                    <span className="font-bold text-gray-800">{selectedEmp.designation?.nameBn || "নির্ধারিত নেই"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">দপ্তর</span>
                    <span className="font-bold text-gray-800">{selectedEmp.department?.nameBn || "সাধারণ"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">যোগদান</span>
                    <span className="font-bold text-gray-800">
                      {new Date(selectedEmp.joiningDate).toLocaleDateString("bn-BD")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">কর্মসংস্থান স্থিতি</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                      {selectedEmp.status}
                    </span>
                  </div>
                </div>

                {/* Status Update Button */}
                <div className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <div>
                    <span className="font-bold text-amber-900 block">কর্মসংস্থান স্থিতি পরিচালনা</span>
                    <span className="text-[11px] text-amber-700">
                      অব্যাহতি (Resign), বরখাস্ত (Terminate) বা ছুটি স্ট্যাটাস পরিবর্তন করুন
                    </span>
                  </div>
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-xs font-bold shadow"
                  >
                    স্ট্যাটাস পরিবর্তন
                  </button>
                </div>

                {/* Qualifications Section */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-gray-800 border-b pb-1">শিক্ষাগত যোগ্যতা</h4>
                  {selectedEmp.qualifications?.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {selectedEmp.qualifications.map((q: any) => (
                        <div key={q.id} className="py-1.5 flex justify-between">
                          <div>
                            <span className="font-bold text-gray-800">{q.degreeTitle}</span>
                            <span className="text-gray-500 block text-[11px]">{q.institution}</span>
                          </div>
                          <span className="text-gray-600 font-mono">{q.passingYear || "N/A"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 py-2">কোনো শিক্ষাগত যোগ্যতা রেকর্ড নেই।</p>
                  )}
                </div>

                {/* Assigned Assets Section */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-gray-800 border-b pb-1">বরাদ্দকৃত প্রাতিষ্ঠানিক সম্পদ (Assets)</h4>
                  {selectedEmp.assignedAssets?.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {selectedEmp.assignedAssets.map((ast: any) => (
                        <div key={ast.id} className="py-1.5 flex justify-between">
                          <div>
                            <span className="font-bold text-gray-800">{ast.item?.nameBn}</span>
                            <span className="font-mono text-gray-500 block text-[11px]">{ast.assetCode}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-bold">{ast.condition}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 py-2">কোনো সম্পদ বরাদ্দ নেই।</p>
                  )}
                </div>

                {/* Employment History Timeline */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-gray-800 border-b pb-1">কর্মসংস্থান পরিবর্তন ইতিহাস (Timeline)</h4>
                  {selectedEmp.employmentHistories?.length > 0 ? (
                    <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {selectedEmp.employmentHistories.map((h: any) => (
                        <div key={h.id} className="py-2 flex justify-between">
                          <div>
                            <span className="font-bold text-gray-800 block">
                              {h.changeType}: {h.newValue}
                            </span>
                            <span className="text-gray-500 text-[11px]">{h.reason}</span>
                          </div>
                          <span className="text-gray-400 font-mono text-[10px]">
                            {new Date(h.effectiveDate).toLocaleDateString("bn-BD")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 py-2">কোনো ইতিহাস রেকর্ড নেই।</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL 2: STATUS CHANGE */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-[#083B25]">কর্মসংস্থান স্ট্যাটাস পরিবর্তন</h3>
            <form onSubmit={handleChangeStatus} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">নতুন স্ট্যাটাস *</label>
                <select
                  value={statusChangeData.newStatus}
                  onChange={(e) => setStatusChangeData({ ...statusChangeData, newStatus: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded bg-white"
                >
                  <option value="ACTIVE">সক্রিয় (ACTIVE)</option>
                  <option value="ON_LEAVE">ছুটিতে (ON_LEAVE)</option>
                  <option value="SUSPENDED">সাময়িক স্থগিত (SUSPENDED)</option>
                  <option value="RESIGNED">অব্যাহতি গ্রহণ (RESIGNED)</option>
                  <option value="TERMINATED">বরখাস্ত (TERMINATED)</option>
                  <option value="RETIRED">অবসরপ্রাপ্ত (RETIRED)</option>
                  <option value="INACTIVE">নিষ্ক্রিয় (INACTIVE)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">পরিবর্তনের কারণ *</label>
                <textarea
                  required
                  rows={3}
                  value={statusChangeData.reason}
                  onChange={(e) => setStatusChangeData({ ...statusChangeData, reason: e.target.value })}
                  placeholder="অফিসিয়াল কারণ লিপিবদ্ধ করুন..."
                  className="w-full p-2 border border-gray-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-gray-600"
                >
                  বাতিল
                </button>
                <button type="submit" className="bg-[#0D5C3A] text-white px-4 py-1.5 rounded font-bold shadow">
                  নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ID CARD PREVIEW */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            {loadingCard ? (
              <div className="py-12 text-xs text-gray-400">কার্ড তৈরি হচ্ছে...</div>
            ) : cardData ? (
              <div className="space-y-4">
                {/* Institutional Badge */}
                <div className="bg-[#083B25] text-white p-4 rounded-xl border-2 border-[#C59B27] shadow">
                  <span className="text-[10px] tracking-wider text-[#C59B27] block font-semibold">
                    ডিজিটাল ক্যাম্পাস আইডি কার্ড
                  </span>
                  <h4 className="font-bold text-sm mt-1">{cardData.institution?.nameBn}</h4>
                  <span className="text-[9px] text-gray-300 block">{cardData.institution?.nameEn}</span>

                  <div className="my-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto border-2 border-[#C59B27] flex items-center justify-center overflow-hidden">
                      {cardData.employee?.photoUrl ? (
                        <img
                          src={cardData.employee.photoUrl}
                          alt={cardData.employee.nameBn}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-black text-white">{cardData.employee?.nameBn}</h3>
                  <span className="text-xs text-[#C59B27] font-bold block">{cardData.employee?.designation}</span>
                  <span className="font-mono text-xs text-emerald-200 mt-1 block">
                    আইডি: {cardData.employee?.employeeId}
                  </span>

                  {cardData.qrCodeUrl && (
                    <div className="mt-4 bg-white p-2 rounded-lg inline-block shadow">
                      <img src={cardData.qrCodeUrl} alt="QR Verification" className="w-24 h-24 mx-auto" />
                    </div>
                  )}

                  <span className="text-[9px] text-gray-300 mt-2 block">
                    স্ক্যান করে অফিশিয়াল ভেরিফিকেশন নিশ্চিত করুন
                  </span>
                </div>

                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-[#083B25] text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                  >
                    <Printer className="w-3.5 h-3.5" /> প্রিন্ট কার্ড
                  </button>
                  <button
                    onClick={() => setShowCardModal(false)}
                    className="border border-gray-300 px-4 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL 4: LEAVE REVIEW */}
      {reviewModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl text-xs">
            <h3 className="font-bold text-sm text-[#083B25]">
              ছুটির সিদ্ধান্ত: {reviewModalData.decision === "APPROVED" ? "অনুমোদন" : "নামঞ্জুর"}
            </h3>
            <form onSubmit={handleReviewLeave} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">সিদ্ধান্তের মন্তব্য</label>
                <textarea
                  rows={3}
                  value={reviewModalData.reason}
                  onChange={(e) => setReviewModalData({ ...reviewModalData, reason: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalData(null)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-gray-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-white font-bold rounded shadow ${
                    reviewModalData.decision === "APPROVED" ? "bg-emerald-600" : "bg-rose-600"
                  }`}
                >
                  নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
