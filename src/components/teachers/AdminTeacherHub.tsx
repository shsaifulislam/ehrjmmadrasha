"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { INSTITUTION_INFO } from "@/lib/constants";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Edit2,
  Key,
  LogOut,
  Shield,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  Trash2,
  Lock,
  Check,
  X,
  Plus,
  Briefcase,
  GraduationCap,
  Layers,
  ChevronRight,
  Archive,
  History,
  ShieldAlert,
  Smartphone,
  MapPin,
  Clock,
  Sparkles,
  CreditCard,
  Printer,
} from "lucide-react";
import { TeacherIDCanvas } from "@/components/documents/templates/DocumentCanvases";

interface TeacherAssignment {
  id: string;
  sessionId: string;
  classId: string;
  sectionId?: string | null;
  subjectId?: string | null;
  session?: { id: string; name: string; isCurrent: boolean };
  subject?: {
    id: string;
    nameBn: string;
    nameEn: string;
    code: string;
    jamatClass?: { id: string; nameBn: string; nameEn: string };
  } | null;
  section?: {
    id: string;
    nameBn: string;
    nameEn: string;
    jamatClass?: { id: string; nameBn: string; nameEn: string };
  } | null;
}

interface TeacherItem {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
  photoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeId: string;
    nameBn: string;
    nameEn: string;
    gender: string;
    mobile: string;
    status: string;
    joiningDate: string;
    baseSalary: number;
    department?: { id: string; nameBn: string; nameEn: string } | null;
    designation?: { id: string; nameBn: string; nameEn: string } | null;
  } | null;
  teacherAssignments: TeacherAssignment[];
  _count?: {
    teacherAssignments: number;
    markedAttendances: number;
    sessions: number;
  };
}

interface AdminTeacherHubProps {
  initialAddOpen?: boolean;
}

export default function AdminTeacherHub({ initialAddOpen = false }: AdminTeacherHubProps = {}) {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, archived: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [banner, setBanner] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Selected Teacher for Profile Drawer
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"OVERVIEW" | "ASSIGNMENTS" | "SECURITY" | "AUDIT">("OVERVIEW");
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [teacherDetail, setTeacherDetail] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Modals State
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(initialAddOpen);

  useEffect(() => {
    if (initialAddOpen) {
      setShowAddTeacherModal(true);
    }
  }, [initialAddOpen]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetTeacher, setDeleteTargetTeacher] = useState<TeacherItem | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);

  // Academic Reference Data for Assignment
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [sessionsList, setSessionsList] = useState<any[]>([]);

  // Add Teacher Form
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherPhone, setNewTeacherPhone] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [newTeacherDesignation, setNewTeacherDesignation] = useState("উস্তাদ / শিক্ষক");
  const [savingNewTeacher, setSavingNewTeacher] = useState(false);

  // Assignment Form State
  const [assignTeacherId, setAssignTeacherId] = useState<string>("");
  const [assignSessionId, setAssignSessionId] = useState<string>("");
  const [assignClassId, setAssignClassId] = useState<string>("");
  const [assignSectionId, setAssignSectionId] = useState<string>("");
  const [assignSubjectId, setAssignSubjectId] = useState<string>("");
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Password Reset Form State
  const [resetTeacherId, setResetTeacherId] = useState<string>("");
  const [resetTeacherName, setResetTeacherName] = useState<string>("");
  const [newResetPassword, setNewResetPassword] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [savingPasswordReset, setSavingPasswordReset] = useState(false);

  // Status Modal State
  const [statusTeacherId, setStatusTeacherId] = useState<string>("");
  const [statusTeacherName, setStatusTeacherName] = useState<string>("");
  const [targetStatus, setTargetStatus] = useState<string>("ACTIVE");
  const [statusReason, setStatusReason] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Edit Teacher Basic Info Form
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [savingProfileEdit, setSavingProfileEdit] = useState(false);
  const [selectedTeacherForId, setSelectedTeacherForId] = useState<any | null>(null);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/teachers", window.location.origin);
      if (searchQuery.trim()) url.searchParams.set("q", searchQuery.trim());
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setTeachers(data.teachers || []);
        if (data.stats) setStats(data.stats);
      } else {
        setBanner({ text: data.error || "শিক্ষক তালিকা লোড করতে ত্রুটি।", type: "error" });
      }
    } catch {
      setBanner({ text: "নেটওয়ার্ক সমস্যার কারণে শিক্ষক তথ্য লোড হয়নি।", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicData = async () => {
    try {
      const [classRes, sessRes] = await Promise.all([
        fetch("/api/admin/academic/classes"),
        fetch("/api/admin/academic/sessions"),
      ]);
      const classData = await classRes.json();
      const sessData = await sessRes.json();
      if (classData.classes) setClassesList(classData.classes);
      if (sessData.sessions) {
        setSessionsList(sessData.sessions);
        const current = sessData.sessions.find((s: any) => s.isCurrent);
        if (current) setAssignSessionId(current.id);
      }
    } catch (e) {
      console.error("Failed to load academic meta", e);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchAcademicData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTeachers();
  };

  // Open Teacher Drawer
  const openTeacherDrawer = async (teacher: TeacherItem) => {
    setSelectedTeacher(teacher);
    setDrawerOpen(true);
    setDrawerTab("OVERVIEW");
    setLoadingDetails(true);
    setEditName(teacher.name);
    setEditEmail(teacher.email);
    setEditPhone(teacher.phone || "");
    setEditSalary(teacher.employee?.baseSalary ? String(teacher.employee.baseSalary) : "");

    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}`);
      const data = await res.json();
      if (data.success) {
        setTeacherDetail(data.teacher);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error("Error fetching teacher detail", e);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Load Subjects when class changes for Assignment
  const handleClassChange = async (classId: string) => {
    setAssignClassId(classId);
    setAssignSubjectId("");
    setAssignSectionId("");
    if (!classId) {
      setSubjectsList([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/subjects?classId=${classId}`);
      const data = await res.json();
      if (data.subjects) setSubjectsList(data.subjects);
    } catch (e) {
      console.error("Failed to load subjects", e);
    }
  };

  // Add Teacher Handler
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName || !newTeacherEmail || !newTeacherPassword) {
      setBanner({ text: "নাম, ইমেইল ও পাসওয়ার্ড প্রদান আবশ্যক।", type: "error" });
      return;
    }
    setSavingNewTeacher(true);
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeacherName,
          email: newTeacherEmail,
          phone: newTeacherPhone,
          password: newTeacherPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner({ text: data.message, type: "success" });
        setShowAddTeacherModal(false);
        setNewTeacherName("");
        setNewTeacherEmail("");
        setNewTeacherPhone("");
        setNewTeacherPassword("");
        fetchTeachers();
      } else {
        setBanner({ text: data.error || "উস্তাদ তৈরিতে ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch {
      setBanner({ text: "সার্ভারে অনুরোধ পাঠানো যায়নি।", type: "error" });
    } finally {
      setSavingNewTeacher(false);
    }
  };

  // Save Teaching Assignment
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignClassId) {
      setBanner({ text: "জামাত বা শ্রেণি নির্বাচন করুন।", type: "error" });
      return;
    }
    setSavingAssignment(true);
    try {
      const res = await fetch(`/api/admin/teachers/${assignTeacherId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: assignSessionId,
          classId: assignClassId,
          sectionId: assignSectionId || null,
          subjectId: assignSubjectId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner({ text: data.message, type: "success" });
        setShowAssignModal(false);
        fetchTeachers();
        if (selectedTeacher && selectedTeacher.id === assignTeacherId) {
          openTeacherDrawer(selectedTeacher);
        }
      } else {
        setBanner({ text: data.error || "অ্যাসাইনমেন্ট তৈরিতে ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch {
      setBanner({ text: "সার্ভার এরর।", type: "error" });
    } finally {
      setSavingAssignment(false);
    }
  };

  // Remove Assignment
  const handleRemoveAssignment = async (assignmentId: string, teacherId: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই শ্রেণি/বিষয়ের দায়িত্বটি বাতিল করতে চান?")) return;
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/assignments?assignmentId=${assignmentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setBanner({ text: data.message, type: "success" });
        fetchTeachers();
        if (selectedTeacher) openTeacherDrawer(selectedTeacher);
      } else {
        setBanner({ text: data.error || "অ্যাসাইনমেন্ট মুছতে সমস্যা হয়েছে।", type: "error" });
      }
    } catch {
      setBanner({ text: "ব্যর্থ হয়েছে।", type: "error" });
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResetPassword || newResetPassword.length < 6 || !resetReason.trim()) {
      setBanner({ text: "কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড এবং কারণ উল্লেখ করুন।", type: "error" });
      return;
    }
    setSavingPasswordReset(true);
    try {
      const res = await fetch(`/api/admin/teachers/${resetTeacherId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: newResetPassword,
          reason: resetReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner({ text: data.message, type: "success" });
        setShowResetPasswordModal(false);
        setNewResetPassword("");
        setResetReason("");
      } else {
        setBanner({ text: data.error || "পাসওয়ার্ড রিসেটে সমস্যা হয়েছে।", type: "error" });
      }
    } catch {
      setBanner({ text: "অনুরোধ সম্পন্ন করা যায়নি।", type: "error" });
    } finally {
      setSavingPasswordReset(false);
    }
  };

  // Force Logout Handler
  const handleForceLogout = async (teacherId: string, teacherName: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে '${teacherName}' এর সকল সক্রিয় লগইন ডিভাইস থেকে ফোর্স লগআউট করাতে চান?`)) return;
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/force-logout`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setBanner({ text: data.message, type: "success" });
        if (selectedTeacher) openTeacherDrawer(selectedTeacher);
      } else {
        setBanner({ text: data.error || "ফোর্স লগআউটে সমস্যা হয়েছে।", type: "error" });
      }
    } catch {
      setBanner({ text: "লগআউট করা যায়নি।", type: "error" });
    }
  };

  // Status Change Handler
  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusReason.trim()) {
      setBanner({ text: "স্ট্যাটাস পরিবর্তনের প্রশাসনিক কারণ উল্লেখ করা আবশ্যক।", type: "error" });
      return;
    }
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/teachers/${statusTeacherId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          reason: statusReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner({ text: data.message, type: "success" });
        setShowStatusModal(false);
        setStatusReason("");
        fetchTeachers();
        if (selectedTeacher) {
          setSelectedTeacher({ ...selectedTeacher, status: targetStatus });
        }
      } else {
        setBanner({ text: data.error || "স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে।", type: "error" });
      }
    } catch {
      setBanner({ text: "সার্ভারে সমস্যা হয়েছে।", type: "error" });
    } finally {
      setSavingStatus(false);
    }
  };

  // Archive Teacher Handler
  const handleArchiveTeacher = async () => {
    if (!statusTeacherId) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/teachers/${statusTeacherId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setBanner({ text: data.message, type: "success" });
        setShowArchiveModal(false);
        setDrawerOpen(false);
        fetchTeachers();
      } else {
        setBanner({ text: data.error || "আর্কাইভে সমস্যা হয়েছে।", type: "error" });
      }
    } catch {
      setBanner({ text: "সার্ভারে সমস্যা হয়েছে।", type: "error" });
    } finally {
      setSavingStatus(false);
    }
  };

  // Permanent Delete Teacher Handler
  const handleDeletePermanentTeacher = async () => {
    if (!deleteTargetTeacher) return;
    setDeletingTeacher(true);
    try {
      const res = await fetch(`/api/admin/teachers/${deleteTargetTeacher.id}?permanent=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setBanner({ text: data.message, type: "success" });
        setShowDeleteModal(false);
        setDeleteTargetTeacher(null);
        setDrawerOpen(false);
        fetchTeachers();
      } else {
        setBanner({ text: data.error || "শিক্ষক মুছে ফেলা যায়নি।", type: "error" });
      }
    } catch {
      setBanner({ text: "সার্ভারে ত্রুটি হয়েছে।", type: "error" });
    } finally {
      setDeletingTeacher(false);
    }
  };

  // Update Profile Info
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setSavingProfileEdit(true);
    try {
      const res = await fetch(`/api/admin/teachers/${selectedTeacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          baseSalary: editSalary,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner({ text: data.message, type: "success" });
        fetchTeachers();
        openTeacherDrawer({ ...selectedTeacher, name: editName, email: editEmail, phone: editPhone });
      } else {
        setBanner({ text: data.error || "হালনাগাদ করা যায়নি।", type: "error" });
      }
    } catch {
      setBanner({ text: "সার্ভারে সমস্যা হয়েছে।", type: "error" });
    } finally {
      setSavingProfileEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {banner && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm shadow-sm transition-all ${
            banner.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-red-50 border border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{banner.text}</span>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Header & Stats */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">উস্তাদ ও শিক্ষক নিয়ন্ত্রণ কেন্দ্র</h1>
                <p className="text-xs text-gray-500">
                  মাদরাসার সকল শিক্ষকের পূর্ণাঙ্গ জীবনবৃত্তান্ত, ক্লাস-বিষয় বরাদ্দ, পাসওয়ার্ড ও নিরাপত্তা ব্যবস্থাপনা।
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setShowAddTeacherModal(true);
              }}
              className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <UserPlus className="w-4 h-4 text-amber-300" />
              <span>+ নতুন উস্তাদ যুক্ত করুন</span>
            </button>

            <button
              onClick={fetchTeachers}
              disabled={loading}
              className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-xs font-medium text-emerald-800">মোট উস্তাদ / শিক্ষক</p>
            <p className="text-2xl font-bold text-emerald-950 mt-1">{stats.total} জন</p>
            <span className="text-[11px] text-emerald-700">অনবোর্ডকৃত মোট শিক্ষক</span>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-800">সক্রিয় শিক্ষক (Active)</p>
            <p className="text-2xl font-bold text-blue-950 mt-1">{stats.active} জন</p>
            <span className="text-[11px] text-blue-700">ক্লাস পরিচালনায় যুক্ত</span>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-medium text-amber-800">সাময়িক স্থগিত (Inactive)</p>
            <p className="text-2xl font-bold text-amber-950 mt-1">{stats.inactive} জন</p>
            <span className="text-[11px] text-amber-700">লগইন ও ক্লাস স্থগিত</span>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-700">আর্কাইভ / সাবেক</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.archived} জন</p>
            <span className="text-[11px] text-slate-600">রেকর্ড সংরক্ষিত</span>
          </div>
        </div>
      </div>

      {/* Filter and Directory Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl overflow-x-auto text-xs">
            <button
              onClick={() => {
                setStatusFilter("ALL");
                fetchTeachers();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === "ALL" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              সকল ({stats.total})
            </button>
            <button
              onClick={() => {
                setStatusFilter("ACTIVE");
                fetchTeachers();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === "ACTIVE" ? "bg-white text-emerald-800 shadow-sm font-bold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              সক্রিয় ({stats.active})
            </button>
            <button
              onClick={() => {
                setStatusFilter("INACTIVE");
                fetchTeachers();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === "INACTIVE" ? "bg-white text-amber-800 shadow-sm font-bold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              সাময়িক স্থগিত ({stats.inactive})
            </button>
            <button
              onClick={() => {
                setStatusFilter("ARCHIVED");
                fetchTeachers();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === "ARCHIVED" ? "bg-white text-slate-800 shadow-sm font-bold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              আর্কাইভ ({stats.archived})
            </button>
          </div>

          {/* Search Box & Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 md:w-72">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0D5C3A] outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-gray-900 hover:bg-black text-white px-3 py-2 rounded-xl text-xs font-medium transition"
              >
                খুঁজুন
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShowRosterModal(true)}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              title="সকল শিক্ষক ও কর্মকর্তা তালিকা প্রিন্ট করুন"
            >
              <Printer className="w-3.5 h-3.5 text-amber-700" />
              <span>রোস্টার প্রিন্ট</span>
            </button>
          </div>
        </div>

        {/* Teachers Table */}
        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            উস্তাদ তালিকা লোড হচ্ছে...
          </div>
        ) : teachers.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-xl">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-700 font-semibold text-sm">কোনো শিক্ষক পাওয়া যায়নি</p>
            <p className="text-xs text-gray-400 mt-1">অনুসন্ধান বা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table with Sticky Action Column */}
            <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl relative">
              <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
                  <tr>
                    <th className="p-3.5">উস্তাদ / শিক্ষক</th>
                    <th className="p-3.5">যোগাযোগ</th>
                    <th className="p-3.5">পদবি ও বিভাগ</th>
                    <th className="p-3.5">বরাদ্দকৃত ক্লাস ও বিষয়</th>
                    <th className="p-3.5 text-center">স্ট্যাটাস</th>
                    <th className="p-3.5 text-right sticky right-0 bg-gray-50 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                      অ্যাকশন
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50/80 transition group">
                      {/* Teacher info */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#0D5C3A] font-bold flex items-center justify-center shrink-0">
                            {teacher.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{teacher.name}</p>
                            <p className="text-[11px] text-gray-500 font-mono">@{teacher.username}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{teacher.email}</span>
                          </div>
                          {teacher.phone && (
                            <div className="flex items-center gap-1.5 text-gray-600 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{teacher.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Designation / Dept */}
                      <td className="p-3.5">
                        <p className="font-semibold text-gray-800">
                          {teacher.employee?.designation?.nameBn || "উস্তাদ / শিক্ষক"}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {teacher.employee?.department?.nameBn || "ইসলামিক শিক্ষা বিভাগ"}
                        </p>
                      </td>

                      {/* Assignments */}
                      <td className="p-3.5 max-w-xs">
                        {teacher.teacherAssignments.length === 0 ? (
                          <span className="text-gray-400 text-[11px] italic">কোনো ক্লাস বরাদ্দ নেই</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {teacher.teacherAssignments.slice(0, 3).map((a) => (
                              <span
                                key={a.id}
                                className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md font-medium"
                              >
                                {a.subject?.nameBn || a.section?.jamatClass?.nameBn || "ক্লাস"}
                                {a.section ? ` (${a.section.nameBn})` : ""}
                              </span>
                            ))}
                            {teacher.teacherAssignments.length > 3 && (
                              <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded">
                                +{teacher.teacherAssignments.length - 3} আরো
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            teacher.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : teacher.status === "INACTIVE"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              teacher.status === "ACTIVE"
                                ? "bg-emerald-600"
                                : teacher.status === "INACTIVE"
                                ? "bg-amber-600"
                                : "bg-slate-500"
                            }`}
                          />
                          {teacher.status === "ACTIVE"
                            ? "সক্রিয়"
                            : teacher.status === "INACTIVE"
                            ? "স্থগিত"
                            : "আর্কাইভ"}
                        </span>
                      </td>

                      {/* Action Buttons - Sticky on right */}
                      <td className="p-3.5 text-right sticky right-0 bg-white group-hover:bg-gray-50/80 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Open Drawer */}
                          <button
                            onClick={() => openTeacherDrawer(teacher)}
                            className="bg-gray-100 hover:bg-[#0D5C3A] hover:text-white text-gray-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1"
                            title="প্রোফাইল ও বিস্তারিত নিয়ন্ত্রণ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>নিয়ন্ত্রণ</span>
                          </button>

                          {/* Quick Assign */}
                          <button
                            onClick={() => {
                              setAssignTeacherId(teacher.id);
                              setShowAssignModal(true);
                            }}
                            className="border border-emerald-200 hover:bg-emerald-50 text-[#0D5C3A] px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1"
                            title="শ্রেণি ও বিষয় বরাদ্দ করুন"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">বরাদ্দ</span>
                          </button>

                          {/* Smart ID Card */}
                          <button
                            onClick={() => setSelectedTeacherForId(teacher)}
                            className="border border-amber-200 hover:bg-amber-50 text-amber-800 px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1"
                            title="শিক্ষক স্মার্ট আইডি কার্ড (CR80)"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                            <span className="hidden sm:inline">আইডি কার্ড</span>
                          </button>

                          {/* Quick Password */}
                          <button
                            onClick={() => {
                              setResetTeacherId(teacher.id);
                              setResetTeacherName(teacher.name);
                              setShowResetPasswordModal(true);
                            }}
                            className="border border-gray-200 hover:bg-gray-50 text-gray-600 p-1.5 rounded-lg transition"
                            title="পাসওয়ার্ড রিসেট"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete / Archive */}
                          <button
                            onClick={() => {
                              setDeleteTargetTeacher(teacher);
                              setShowDeleteModal(true);
                            }}
                            className="border border-rose-200 hover:bg-rose-50 text-rose-600 p-1.5 rounded-lg transition"
                            title="মুছে ফেলুন বা আর্কাইভ করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Dedicated Card List (No horizontal overflow) */}
            <div className="md:hidden space-y-3">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#0D5C3A] font-bold flex items-center justify-center shrink-0">
                        {teacher.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{teacher.name}</h4>
                        <p className="text-[11px] text-gray-500 font-mono">@{teacher.username}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        teacher.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : teacher.status === "INACTIVE"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {teacher.status === "ACTIVE" ? "সক্রিয়" : teacher.status === "INACTIVE" ? "স্থগিত" : "আর্কাইভ"}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-gray-600 bg-gray-50 p-2.5 rounded-lg">
                    <p className="font-semibold text-gray-800">
                      {teacher.employee?.designation?.nameBn || "উস্তাদ / শিক্ষক"} •{" "}
                      {teacher.employee?.department?.nameBn || "ইসলামিক শিক্ষা বিভাগ"}
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px] truncate">
                      <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{teacher.email}</span>
                    </p>
                    {teacher.phone && (
                      <p className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                        <span>{teacher.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Allocation Badges */}
                  <div className="text-xs">
                    <span className="text-[11px] text-gray-500 font-medium">বরাদ্দকৃত ক্লাস: </span>
                    {teacher.teacherAssignments.length === 0 ? (
                      <span className="text-gray-400 text-[11px] italic">কোনো ক্লাস নেই</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {teacher.teacherAssignments.slice(0, 3).map((a) => (
                          <span
                            key={a.id}
                            className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md font-medium"
                          >
                            {a.subject?.nameBn || a.section?.jamatClass?.nameBn || "ক্লাস"}
                          </span>
                        ))}
                        {teacher.teacherAssignments.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded">
                            +{teacher.teacherAssignments.length - 3} আরো
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => openTeacherDrawer(teacher)}
                      className="bg-gray-100 hover:bg-[#0D5C3A] hover:text-white text-gray-700 py-1.5 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>নিয়ন্ত্রণ</span>
                    </button>
                    <button
                      onClick={() => {
                        setAssignTeacherId(teacher.id);
                        setShowAssignModal(true);
                      }}
                      className="border border-emerald-200 hover:bg-emerald-50 text-[#0D5C3A] py-1.5 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>বরাদ্দ</span>
                    </button>
                    <button
                      onClick={() => {
                        setResetTeacherId(teacher.id);
                        setResetTeacherName(teacher.name);
                        setShowResetPasswordModal(true);
                      }}
                      className="border border-gray-200 hover:bg-gray-100 text-gray-700 py-1.5 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>পাসওয়ার্ড</span>
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTargetTeacher(teacher);
                        setShowDeleteModal(true);
                      }}
                      className="border border-rose-200 hover:bg-rose-50 text-rose-600 py-1.5 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. TEACHER DETAIL SLIDE-OVER DRAWER                       */}
      {/* ========================================================= */}
      {drawerOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-teal-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/10 text-amber-300 font-bold flex items-center justify-center text-lg">
                  {selectedTeacher.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <span>{selectedTeacher.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        selectedTeacher.status === "ACTIVE"
                          ? "bg-emerald-500 text-white"
                          : selectedTeacher.status === "INACTIVE"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-500 text-white"
                      }`}
                    >
                      {selectedTeacher.status}
                    </span>
                  </h2>
                  <p className="text-xs text-emerald-100 font-mono">@{selectedTeacher.username} • {selectedTeacher.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTeacherForId(selectedTeacher)}
                  className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  title="স্মার্ট আইডি কার্ড (CR80) প্রিন্ট"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>আইডি কার্ড</span>
                </button>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50 px-5 text-xs font-medium">
              <button
                onClick={() => setDrawerTab("OVERVIEW")}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 ${
                  drawerTab === "OVERVIEW"
                    ? "border-[#0D5C3A] text-[#0D5C3A] font-bold bg-white"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>সাধারণ তথ্য ও বায়ো</span>
              </button>

              <button
                onClick={() => setDrawerTab("ASSIGNMENTS")}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 ${
                  drawerTab === "ASSIGNMENTS"
                    ? "border-[#0D5C3A] text-[#0D5C3A] font-bold bg-white"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>ক্লাস ও বিষয় দায়িত্ব</span>
              </button>

              <button
                onClick={() => setDrawerTab("SECURITY")}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 ${
                  drawerTab === "SECURITY"
                    ? "border-[#0D5C3A] text-[#0D5C3A] font-bold bg-white"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>অ্যাকাউন্ট ও নিরাপত্তা</span>
              </button>

              <button
                onClick={() => setDrawerTab("AUDIT")}
                className={`py-3 px-3 border-b-2 flex items-center gap-1.5 ${
                  drawerTab === "AUDIT"
                    ? "border-[#0D5C3A] text-[#0D5C3A] font-bold bg-white"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>অডিট হিস্ট্রি</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {loadingDetails ? (
                <div className="py-20 text-center text-gray-500 text-sm">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                  উস্তাদের তথ্য লোড হচ্ছে...
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW */}
                  {drawerTab === "OVERVIEW" && (
                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                      <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-emerald-900">প্রাতিষ্ঠানিক শিক্ষক আইডি</p>
                          <p className="text-base font-bold font-mono text-emerald-950">
                            {selectedTeacher.employee?.employeeId || "EHRJ-TCH-" + selectedTeacher.id.slice(0, 6)}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          যুক্ত হয়েছেন: {new Date(selectedTeacher.createdAt).toLocaleDateString("bn-BD")}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">উস্তাদের নাম (বাংলা)</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">অফিসিয়াল ইমেইল</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">মোবাইল নম্বর</label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">মূল মাসিক বেতন (৳)</label>
                          <input
                            type="number"
                            value={editSalary}
                            onChange={(e) => setEditSalary(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                          type="submit"
                          disabled={savingProfileEdit}
                          className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Check className="w-4 h-4" />
                          <span>{savingProfileEdit ? "সংরক্ষণ হচ্ছে..." : "তথ্য হালনাগাদ করুন"}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TAB 2: ASSIGNMENTS */}
                  {drawerTab === "ASSIGNMENTS" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">বরাদ্দকৃত জামাত ও বিষয়ের তালিকা</h3>
                          <p className="text-xs text-gray-500">উস্তাদ যে সকল ক্লাস পরিচালনা করবেন ও হাজিরা নিতে পারবেন।</p>
                        </div>
                        <button
                          onClick={() => {
                            setAssignTeacherId(selectedTeacher.id);
                            setShowAssignModal(true);
                          }}
                          className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>নতুন বরাদ্দ</span>
                        </button>
                      </div>

                      {selectedTeacher.teacherAssignments.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                          <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-600 font-medium text-xs">কোনো ক্লাস বা বিষয় বরাদ্দ করা হয়নি</p>
                          <button
                            onClick={() => {
                              setAssignTeacherId(selectedTeacher.id);
                              setShowAssignModal(true);
                            }}
                            className="mt-3 text-xs text-[#0D5C3A] font-bold hover:underline"
                          >
                            + প্রথম শ্রেণি ও বিষয় বরাদ্দ করুন
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {selectedTeacher.teacherAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="p-3.5 border border-gray-200 rounded-xl bg-gray-50/50 flex items-center justify-between hover:bg-gray-50 transition"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 text-xs">
                                    {assignment.subject?.nameBn || "সকল বিষয়"}
                                  </span>
                                  {assignment.subject?.code && (
                                    <span className="bg-emerald-100 text-[#0D5C3A] text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
                                      {assignment.subject.code}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-600 flex items-center gap-2">
                                  <span>জামাত: {assignment.section?.jamatClass?.nameBn || assignment.subject?.jamatClass?.nameBn || "শ্রেণি"}</span>
                                  {assignment.section && <span>• শাখা: {assignment.section.nameBn}</span>}
                                  {assignment.session && <span>• সেশন: {assignment.session.name}</span>}
                                </div>
                              </div>

                              <button
                                onClick={() => handleRemoveAssignment(assignment.id, selectedTeacher.id)}
                                className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                                title="দায়িত্ব বাতিল করুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: SECURITY */}
                  {drawerTab === "SECURITY" && (
                    <div className="space-y-6">
                      {/* Active Sessions Box */}
                      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-emerald-700" />
                            <h4 className="text-xs font-bold text-gray-900">সক্রিয় লগইন সেশন</h4>
                          </div>
                          <button
                            onClick={() => handleForceLogout(selectedTeacher.id, selectedTeacher.name)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>সকল সেশন ফোর্স লগআউট</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          উস্তাদ বর্তমানে কোনো ডিভাইসে লগইন করে থাকলে এক ক্লিকে সকল সেশন বাতিল করা সম্ভব।
                        </p>
                      </div>

                      {/* Password Reset Box */}
                      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-amber-600" />
                          <h4 className="text-xs font-bold text-gray-900">প্রশাসনিক পাসওয়ার্ড রিসেট</h4>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          উস্তাদের পাসওয়ার্ড ভুলে গেলে অ্যাডমিন কর্তৃক সুরক্ষিত পাসওয়ার্ড প্রদান করুন। রিসেট করার পর পূর্ববর্তী সেশন স্বয়ংক্রিয়ভাবে বাতিল হবে।
                        </p>
                        <button
                          onClick={() => {
                            setResetTeacherId(selectedTeacher.id);
                            setResetTeacherName(selectedTeacher.name);
                            setShowResetPasswordModal(true);
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>পাসওয়ার্ড রিসেট উইজার্ড খুলুন</span>
                        </button>
                      </div>

                      {/* Deactivate / Archive Controls */}
                      <div className="border border-red-200 bg-red-50/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-red-600" />
                          <h4 className="text-xs font-bold text-red-950">অ্যাকাউন্ট স্ট্যাটাস ও আর্কাইভ নিয়ন্ত্রণ</h4>
                        </div>
                        <p className="text-[11px] text-gray-600">
                          উস্তাদের চাকরি সাময়িক স্থগিত বা মাদ্রাসা পরিবর্তনের ক্ষেত্রে ডাটা সংরক্ষণপূর্বক অ্যাকাউন্ট বন্ধ করা যাবে।
                        </p>

                        <div className="flex flex-wrap gap-2.5 pt-2">
                          {selectedTeacher.status === "ACTIVE" ? (
                            <button
                              onClick={() => {
                                setStatusTeacherId(selectedTeacher.id);
                                setStatusTeacherName(selectedTeacher.name);
                                setTargetStatus("INACTIVE");
                                setShowStatusModal(true);
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                            >
                              সাময়িক স্থগিত করুন (Deactivate)
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setStatusTeacherId(selectedTeacher.id);
                                setStatusTeacherName(selectedTeacher.name);
                                setTargetStatus("ACTIVE");
                                setShowStatusModal(true);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                            >
                              পুনরায় সক্রিয় করুন (Reactivate)
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setStatusTeacherId(selectedTeacher.id);
                              setStatusTeacherName(selectedTeacher.name);
                              setShowArchiveModal(true);
                            }}
                            className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>আর্কাইভ / সাবেক করুন</span>
                          </button>

                          <button
                            onClick={() => {
                              setDeleteTargetTeacher(selectedTeacher);
                              setShowDeleteModal(true);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>স্থায়ীভাবে মুছুন</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: AUDIT */}
                  {drawerTab === "AUDIT" && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-900">অডিট ও নিরাপত্তা লগ</h4>
                      {auditLogs.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-6 text-center">কোনো অডিট রেকর্ড নেই।</p>
                      ) : (
                        <div className="space-y-2">
                          {auditLogs.map((log) => (
                            <div key={log.id} className="p-3 border border-gray-200 rounded-xl bg-gray-50 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#0D5C3A] font-mono">{log.action}</span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(log.createdAt).toLocaleString("bn-BD")}
                                </span>
                              </div>
                              <p className="text-gray-600 text-[11px] mt-1">
                                পারফরমার: {log.user?.name || "সিস্টেম"}
                              </p>
                              {log.detailsJson && (
                                <p className="text-gray-500 font-mono text-[10px] mt-1 bg-white p-1 rounded border border-gray-100 overflow-x-auto">
                                  {log.detailsJson}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MODAL: ADD TEACHER                                     */}
      {/* ========================================================= */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#0D5C3A] text-white">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">নতুন উস্তাদ / শিক্ষক অ্যাকাউন্ট নিবন্ধন</h3>
              </div>
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  উস্তাদের পুরো নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মুফতি আব্দুল্লাহ আল মামুন"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  অফিসিয়াল ইমেইল ঠিকানা (লগইন আইডি) *
                </label>
                <input
                  type="email"
                  placeholder="যেমন: mamun@ehrj.edu.bd"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  placeholder="যেমন: 01700000000"
                  value={newTeacherPhone}
                  onChange={(e) => setNewTeacherPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    লগইন পাসওয়ার্ড *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomPass = "Ehrj@" + Math.floor(100000 + Math.random() * 900000);
                      setNewTeacherPassword(randomPass);
                    }}
                    className="text-[11px] text-[#0D5C3A] hover:underline font-semibold"
                  >
                    র‍্যান্ডম জেনারেট
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="ন্যূনতম ৬ অক্ষর"
                  value={newTeacherPassword}
                  onChange={(e) => setNewTeacherPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none font-mono"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingNewTeacher}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-5 py-2 rounded-xl text-xs font-semibold transition"
                >
                  {savingNewTeacher ? "নিবন্ধন হচ্ছে..." : "নিবন্ধন নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODAL: ASSIGN CLASS & SUBJECT                          */}
      {/* ========================================================= */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-800 text-white">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">শ্রেণি ও বিষয় বরাদ্দ করুন</h3>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">শিক্ষাবর্ষ / সেশন *</label>
                <select
                  value={assignSessionId}
                  onChange={(e) => setAssignSessionId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none"
                >
                  {sessionsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isCurrent ? "(চলতি)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">জামাত / শ্রেণি *</label>
                <select
                  value={assignClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none"
                >
                  <option value="">-- জামাত নির্বাচন করুন --</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn} ({c.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">শাখা (ঐচ্ছিক)</label>
                <select
                  value={assignSectionId}
                  onChange={(e) => setAssignSectionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none"
                >
                  <option value="">-- সকল শাখা / সাধারণ --</option>
                  {classesList
                    .find((c) => c.id === assignClassId)
                    ?.sections?.map((sec: any) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.nameBn} ({sec.nameEn})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">বিষয় (ঐচ্ছিক)</label>
                <select
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-[#0D5C3A] outline-none"
                >
                  <option value="">-- সকল বিষয় / সার্বিক তত্ত্বাবধায়ক --</option>
                  {subjectsList.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.nameBn} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingAssignment}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-5 py-2 rounded-xl text-xs font-semibold transition"
                >
                  {savingAssignment ? "বরাদ্দ হচ্ছে..." : "বরাদ্দ নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MODAL: RESET PASSWORD                                  */}
      {/* ========================================================= */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-amber-600 text-white">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-sm">প্রশাসনিক পাসওয়ার্ড রিসেট</h3>
              </div>
              <button onClick={() => setShowResetPasswordModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                <p className="font-bold">উস্তাদ: {resetTeacherName}</p>
                <p className="mt-1 text-[11px] text-amber-800">
                  সতর্কতা: পাসওয়ার্ড রিসেটের সাথে সাথে শিক্ষকটির পূর্বের সকল ডিভাইস থেকে সেশন বাতিল করা হবে।
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">নতুন পাসওয়ার্ড *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = "Ehrj@" + Math.floor(100000 + Math.random() * 900000);
                      setNewResetPassword(rand);
                    }}
                    className="text-[11px] text-amber-700 hover:underline font-semibold"
                  >
                    র‍্যান্ডম জেনারেট
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="ন্যূনতম ৬ অক্ষর"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  রিসেটের কারণ (অডিট ট্রেইল) *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: শিক্ষক পাসওয়ার্ড ভুলে গেছেন বা অনুরোধ করেছেন"
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingPasswordReset}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition"
                >
                  {savingPasswordReset ? "রিসেট হচ্ছে..." : "পাসওয়ার্ড রিসেট করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: DEACTIVATE / REACTIVATE STATUS                  */}
      {/* ========================================================= */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-900 text-white">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">স্ট্যাটাস পরিবর্তন নিশ্চিতকরণ</h3>
              </div>
              <button onClick={() => setShowStatusModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusChange} className="p-6 space-y-4">
              <p className="text-xs text-gray-700">
                আপনি কি নিশ্চিত যে <strong>{statusTeacherName}</strong> এর অ্যাকাউন্টের অবস্থা{" "}
                <span className="font-bold text-amber-600">{targetStatus}</span> এ পরিবর্তন করতে চান?
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">পরিবর্তনের কারণ *</label>
                <textarea
                  placeholder="প্রশাসনিক কারণ উল্লেখ করুন..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-gray-900 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-semibold transition"
                >
                  {savingStatus ? "পরিবর্তন হচ্ছে..." : "পরিবর্তন কার্যকর করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: ARCHIVE TEACHER CONFIRMATION                    */}
      {/* ========================================================= */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">উস্তাদ প্রোফাইল আর্কাইভ / সাবেক রূপান্তর</h3>
              </div>
              <button onClick={() => setShowArchiveModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 space-y-1.5">
                <p className="font-bold">সতর্কতা ও স্থায়ী নীতিমালা:</p>
                <p>
                  উস্তাদ <strong>{statusTeacherName}</strong> এর ক্লাস হাজিরা বা ফলাফল প্রস্তুতের ইতিহাস ডাটাবেজে অক্ষত থাকবে। কিন্তু তার লগইন অ্যাক্সেস স্থায়ীভাবে ব্লক হবে এবং তিনি সাবেক শিক্ষক তালিকায় সংরক্ষিত থাকবেন।
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleArchiveTeacher}
                  disabled={savingStatus}
                  className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-semibold transition"
                >
                  {savingStatus ? "আর্কাইভ হচ্ছে..." : "আর্কাইভ নিশ্চিত করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: PERMANENT DELETE TEACHER */}
      {showDeleteModal && deleteTargetTeacher && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-gradient-to-r from-rose-700 to-red-800 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">শিক্ষক / স্টাফ স্থায়ী অপসারণ নিশ্চিতকরণ</h3>
                  <p className="text-[11px] text-rose-200">নিরাপত্তা যাচাই ও স্থায়ী মোছা</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTargetTeacher(null);
                }}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 space-y-1">
                  <p className="font-bold">সতর্কবার্তা: এই কাজটি অপরিবর্তনীয় (Permanent)</p>
                  <p className="text-rose-700 leading-relaxed">
                    আপনি <span className="font-bold text-rose-950 underline">{deleteTargetTeacher.name}</span> (@{deleteTargetTeacher.username})-এর প্রোফাইল ও লগইন ডাটাবেজ থেকে সম্পূর্ণ অপসারণ করতে চলেছেন।
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">নাম:</span>
                  <span className="font-bold text-slate-800">{deleteTargetTeacher.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">ইউজারনেম ও ইমেইল:</span>
                  <span className="font-mono text-slate-700">{deleteTargetTeacher.username} ({deleteTargetTeacher.email})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">পদবি / ডিপার্টমেন্ট:</span>
                  <span className="font-medium text-slate-800">
                    {deleteTargetTeacher.employee?.designation?.nameBn || "উস্তাদ / শিক্ষক"} • {deleteTargetTeacher.employee?.department?.nameBn || "সাধারণ"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">বরাদ্দকৃত ক্লাস/বিষয়:</span>
                  <span className="font-bold text-emerald-700">{deleteTargetTeacher.teacherAssignments?.length || 0} টি</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>আর্কাইভ বিকল্প (ঐতিহাসিক ডাটা সুরক্ষা):</span>
                </p>
                <p className="text-amber-800 leading-relaxed">
                  যদি এই শিক্ষক মাদ্রাসায় কোনো ক্লাসে অতীতে পাঠদান বা পরীক্ষার রেকর্ড সম্পন্ন করে থাকেন, তবে ডাটার ধারাবাহিকতা বজায় রাখতে তাঁকে <strong>"আর্কাইভ / সাবেক"</strong> করা নিরাপদ। আর ভুল এন্ট্রি হলে স্থায়ীভাবে সম্পূর্ণ মুছুন।
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTargetTeacher(null);
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setStatusTeacherId(deleteTargetTeacher.id);
                    setStatusTeacherName(deleteTargetTeacher.name);
                    setShowArchiveModal(true);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span>আর্কাইভ করুন (ডাটা নিরাপদ)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeletePermanentTeacher}
                  disabled={deletingTeacher}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deletingTeacher ? "মুছে ফেলা হচ্ছে..." : "স্থায়ীভাবে সম্পূর্ণ মুছুন"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER SMART ID CARD (CR80) PREVIEW & PRINT MODAL */}
      {selectedTeacherForId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden space-y-4 print:border-none print:shadow-none p-6 print:p-0">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0D5C3A]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {selectedTeacherForId.nameBn || selectedTeacherForId.name} — স্মার্ট শিক্ষক ও স্টাফ আইডি কার্ড
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">CR80 দ্বিমুখী পিভিসি ফরম্যাট (85.6mm × 54mm)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট / PDF সংরক্ষণ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTeacherForId(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 flex justify-center print:bg-white print:border-none print:p-0">
              <TeacherIDCanvas
                doc={{
                  certificateNumber: `EHRJ-TID-2026-${selectedTeacherForId.employeeId || selectedTeacherForId.id?.slice(0, 4) || "01"}`,
                  verificationCode: `VER-TID-${selectedTeacherForId.id?.slice(0, 6)}`,
                  parsedSnapshot: {
                    teacher: {
                      nameBn: selectedTeacherForId.nameBn || selectedTeacherForId.name,
                      nameEn: selectedTeacherForId.nameEn || selectedTeacherForId.name,
                      designation: selectedTeacherForId.designation || "উস্তাদ ও শিক্ষক",
                      department: selectedTeacherForId.department || "কিতাব ও হিফজ বিভাগ",
                      employeeId: selectedTeacherForId.employeeId || selectedTeacherForId.phone || "EMP-2026-001",
                      bloodGroup: selectedTeacherForId.bloodGroup || "B+",
                      phone: selectedTeacherForId.phone || "০১৮৪৫-১৬২৬৬৪",
                      joinDate: selectedTeacherForId.joinDate || "২০২৩-০১-০১",
                      photoUrl: selectedTeacherForId.photoUrl,
                    },
                  },
                }}
              />
            </div>

            <div className="pt-2 text-center text-gray-400 text-[11px] print:hidden">
              সুরক্ষিত ডিজিটাল পরিচয়পত্র • অফিশিয়াল সিলমোহর ও কিউআর যাচাইকরণ অন্তর্ভুক্ত
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: TEACHER ROSTER & FACULTY REGISTER (PRINTABLE DOCUMENT) */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden space-y-4 print:border-none print:shadow-none p-5 sm:p-8 print:p-0 my-auto">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0D5C3A] text-white flex items-center justify-center shadow-sm">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    উস্তাদ ও শিক্ষক রোস্টার রেজিস্টার (২০২৬)
                  </h3>
                  <span className="text-xs text-gray-500">
                    ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট / PDF সংরক্ষণ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRosterModal(false)}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="p-4 sm:p-8 bg-white border border-gray-200 rounded-2xl print:border-none print:p-0 text-gray-900">
              {/* Header */}
              <div className="text-center pb-6 border-b-2 border-emerald-900 mb-6">
                <div className="w-16 h-16 mx-auto mb-2 relative">
                  <Image
                    src="/logo.png"
                    alt="মাদ্রাসা লোগো"
                    width={64}
                    height={64}
                    className="object-contain mx-auto"
                  />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-emerald-950 font-serif">
                  {INSTITUTION_INFO.nameBn}
                </h1>
                <p className="text-xs sm:text-sm text-gray-700 font-medium mt-1">
                  {INSTITUTION_INFO.addressBn} • স্থাপিত: ২০২১ ইং
                </p>
                <div className="mt-3 inline-block bg-emerald-900 text-white text-xs sm:text-sm font-bold px-6 py-1 rounded-full uppercase tracking-wider">
                  উস্তাদ ও শিক্ষক নিয়ন্ত্রণ কেন্দ্র — অফিশিয়াল শিক্ষক রোস্টার (২০২৬)
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-300">
                  <thead className="bg-gray-100 font-bold text-gray-900 border-b border-gray-300">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-gray-300 text-center w-12">ক্রম</th>
                      <th className="py-2.5 px-3 border-r border-gray-300">উস্তাদের নাম ও ইউজারনেম</th>
                      <th className="py-2.5 px-3 border-r border-gray-300">পদবি ও বিভাগ</th>
                      <th className="py-2.5 px-3 border-r border-gray-300">ইমেইল ও যোগাযোগ নম্বর</th>
                      <th className="py-2.5 px-3 border-r border-gray-300 text-center">বরাদ্দকৃত ক্লাস/বিষয়</th>
                      <th className="py-2.5 px-3 border-r border-gray-300 text-right">মূল বেতন</th>
                      <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {teachers.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 border-r border-gray-300 text-center font-bold text-gray-700">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-gray-300">
                          <div className="font-bold text-gray-900">{t.name}</div>
                          <div className="font-mono text-[10px] text-gray-500">@{t.username}</div>
                        </td>
                        <td className="py-2 px-3 border-r border-gray-300">
                          <div className="font-semibold text-gray-800">
                            {t.employee?.designation?.nameBn || "উস্তাদ / শিক্ষক"}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {t.employee?.department?.nameBn || "ইসলামিক শিক্ষা বিভাগ"}
                          </div>
                        </td>
                        <td className="py-2 px-3 border-r border-gray-300">
                          <div className="font-mono text-[11px] text-gray-800">{t.email}</div>
                          <div className="font-mono text-[11px] text-gray-600">{t.phone || "তথ্য নেই"}</div>
                        </td>
                        <td className="py-2 px-3 border-r border-gray-300 text-center">
                          <span className="font-bold text-emerald-800">
                            {t.teacherAssignments?.length || 0} টি
                          </span>
                        </td>
                        <td className="py-2 px-3 border-r border-gray-300 text-right font-bold text-gray-900 font-mono">
                          ৳ {Number(t.employee?.baseSalary || 0).toLocaleString("bn-BD")}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {t.status === "ACTIVE" ? "সক্রিয়" : t.status === "INACTIVE" ? "স্থগিত" : "আর্কাইভ"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-400">
                    <tr>
                      <td colSpan={5} className="py-2.5 px-3 border-r border-gray-300 text-right">
                        মোট শিক্ষক: {teachers.length} জন (সক্রিয়: {stats.active} জন) | মোট মাসিক বেতন বিল:
                      </td>
                      <td className="py-2.5 px-3 border-r border-gray-300 text-right font-black font-mono text-emerald-900 text-sm">
                        ৳ {teachers.reduce((sum, t) => sum + (t.employee?.baseSalary || 0), 0).toLocaleString("bn-BD")}
                      </td>
                      <td className="py-2.5 px-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="mt-16 pt-8 grid grid-cols-2 gap-12 text-center text-xs">
                <div>
                  <div className="border-t border-gray-900 w-48 mx-auto pt-1 font-bold text-gray-900">
                    মাওলানা মো: আবুল কালাম সরকার
                  </div>
                  <div className="text-[11px] text-gray-600">মুহতামিম / অধ্যক্ষ</div>
                  <div className="text-[10px] text-gray-500">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</div>
                </div>

                <div>
                  <div className="border-t border-gray-900 w-48 mx-auto pt-1 font-bold text-gray-900">
                    আলহাজ্ব ইঞ্জিনিয়ার মো: রফিকুল ইসলাম
                  </div>
                  <div className="text-[11px] text-gray-600">সভাপতি, পরিচালনা পর্ষদ</div>
                  <div className="text-[10px] text-gray-500">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</div>
                </div>
              </div>

              <div className="mt-8 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-3">
                মুদ্রণ তারিখ: {new Date().toLocaleDateString("bn-BD")} • সিস্টেম জেনারেটেড ডিজিটাল রোস্টার রেজিস্টার
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
