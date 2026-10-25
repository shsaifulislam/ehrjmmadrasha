"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Calendar,
  DollarSign,
  Award,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Home,
  CreditCard,
  Printer,
  Download,
  Eye,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Layers,
  Edit,
  Save,
  X,
  HelpCircle,
  Send,
  Sliders,
  Sparkles,
  QrCode,
  FileCheck,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import UpdateGuardianModal from "./UpdateGuardianModal";
import { UniversalDocumentRenderer } from "../documents/templates/DocumentCanvases";

interface StudentListItem {
  id: string;
  studentIdNumber: string;
  fullNameBn: string;
  fullNameEn?: string;
  className?: string;
  sectionName?: string;
  rollNumber?: number;
  residentialStatus: string;
  isOrphan: boolean;
  fatherNameBn?: string;
  fatherPhone?: string;
  motherNameBn?: string;
  status: string;
  totalDue?: number;
}

export default function AdminStudentMasterHub() {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedResidential, setSelectedResidential] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Selected Student for Central Master Profile Drawer
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<
    | "OVERVIEW"
    | "ACADEMIC"
    | "ATTENDANCE"
    | "RESULTS"
    | "FINANCE"
    | "GUARDIAN"
    | "DOCUMENTS"
    | "REQUESTS"
    | "AUDIT"
  >("OVERVIEW");

  // Guardian Edit Modal State
  const [guardianEditTarget, setGuardianEditTarget] = useState<{
    id: string;
    name: string;
    idNumber: string;
    guardianName?: string;
    phone?: string;
  } | null>(null);

  // Student Register Print Modal State
  const [showRegisterPrintModal, setShowRegisterPrintModal] = useState(false);
  const [printRegisterClass, setPrintRegisterClass] = useState("ALL");

  // Student Edit Details Modal State
  const [editStudentTarget, setEditStudentTarget] = useState<any | null>(null);
  const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);
  const [studentEditForm, setStudentEditForm] = useState({
    fullNameBn: "",
    fullNameEn: "",
    adjustRollNumber: "",
    residentialStatus: "NON_RESIDENTIAL",
    status: "ACTIVE",
    dateOfBirth: "",
    bloodGroup: "",
    fatherNameBn: "",
    fatherPhone: "",
    motherNameBn: "",
    presentAddress: "",
  });

  // Archive / Delete Student
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);

  // Document Issuing and Previewing State inside student profile
  const [issuingDocType, setIssuingDocType] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [docActionMsg, setDocActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load Students List
  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/students");
      const data = await res.json();
      if (res.ok && data.students) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (
      !confirm(
        `সতর্কতা: আপনি কি নিশ্চিতভাবে "${studentName}" এর প্রোফাইল প্রত্যাহার / মুছতে চান?\n\n(যদি পরীক্ষার রেজাল্ট বা আর্থিক হিসাব সংরক্ষিত থাকে তবে সিস্টেম নিরাপদে প্রোফাইলটি WITHDRAWN হিসেবে আর্কাইভ রাখবে)`
      )
    ) {
      return;
    }
    setIsDeletingStudent(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "শিক্ষার্থীর প্রোফাইল সফলভাবে মুছে ফেলা / প্রত্যাহার করা হয়েছে।");
        setActiveStudentId(null);
        setStudentDetail(null);
        loadStudents();
      } else {
        alert(data.error || "মুছতে ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "সার্ভার এরর");
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const handleOpenEditStudent = (student: any) => {
    setEditStudentTarget(student);
    const currEnrollment = student.enrollments?.[0];
    setStudentEditForm({
      fullNameBn: student.fullNameBn || "",
      fullNameEn: student.fullNameEn || "",
      adjustRollNumber:
        currEnrollment?.rollNumber !== undefined ? String(currEnrollment.rollNumber) : "",
      residentialStatus: student.residentialStatus || "NON_RESIDENTIAL",
      status: student.status || "ACTIVE",
      dateOfBirth: student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().split("T")[0]
        : "",
      bloodGroup: student.bloodGroup || "",
      fatherNameBn: student.fatherNameBn || "",
      fatherPhone: student.fatherPhone || "",
      motherNameBn: student.motherNameBn || "",
      presentAddress: student.presentAddress || "",
    });
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentTarget) return;
    setIsUpdatingStudent(true);
    try {
      const res = await fetch(`/api/admin/students/${editStudentTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentEditForm),
      });
      const data = await res.json();
      if (res.ok) {
        alert("শিক্ষার্থীর তথ্য সফলভাবে হালনাগাদ করা হয়েছে!");
        setEditStudentTarget(null);
        loadStudents();
        if (activeStudentId && activeStudentId === editStudentTarget.id) {
          loadStudentProfile(activeStudentId);
        }
      } else {
        alert(data.error || "হালনাগাদ ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "সার্ভার এরর");
    } finally {
      setIsUpdatingStudent(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Load Complete Student Master Profile
  const loadStudentProfile = async (id: string) => {
    setActiveStudentId(id);
    setLoadingDetail(true);
    setDocActionMsg(null);
    try {
      const res = await fetch(`/api/admin/students/${id}`);
      const data = await res.json();
      if (res.ok && data.student) {
        setStudentDetail(data);
      } else {
        console.error("Failed to load student detail:", data.error);
      }
    } catch (err) {
      console.error("Error loading student detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.studentIdNumber.toLowerCase().includes(q) ||
        s.fullNameBn.toLowerCase().includes(q) ||
        (s.fullNameEn && s.fullNameEn.toLowerCase().includes(q)) ||
        (s.fatherPhone && s.fatherPhone.includes(q)) ||
        String(s.rollNumber || "").includes(q);

      const matchClass = selectedClass === "ALL" || s.className === selectedClass;
      const matchRes = selectedResidential === "ALL" || s.residentialStatus === selectedResidential;
      const matchStatus = selectedStatus === "ALL" || s.status === selectedStatus;

      return matchSearch && matchClass && matchRes && matchStatus;
    });
  }, [students, search, selectedClass, selectedResidential, selectedStatus]);

  // Unique Classes for Filter
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.className) set.add(s.className);
    });
    return Array.from(set);
  }, [students]);

  // Handle Instant Document Issuance for Student
  const handleIssueDocument = async (docType: string) => {
    if (!activeStudentId) return;
    setIssuingDocType(docType);
    setDocActionMsg(null);
    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: activeStudentId,
          documentType: docType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.certificate) {
        setDocActionMsg({
          type: "success",
          text: `${data.certificate.titleBn || "সনদপত্র"} সফলভাবে তৈরি ও সংরক্ষণ করা হয়েছে!`,
        });
        await loadStudentProfile(activeStudentId);
        setViewingDoc(data.certificate);
      } else {
        setDocActionMsg({
          type: "error",
          text: data.error || "সনদ তৈরি ব্যর্থ হয়েছে।",
        });
      }
    } catch (err: any) {
      setDocActionMsg({
        type: "error",
        text: err.message || "সার্ভার সংযোগে ত্রুটি।",
      });
    } finally {
      setIssuingDocType(null);
    }
  };

  // Metrics summary
  const totalCount = students.length;
  const activeCount = students.filter((s) => s.status === "ACTIVE").length;
  const resCount = students.filter((s) => s.residentialStatus === "RESIDENTIAL").length;
  const nonResCount = students.filter((s) => s.residentialStatus === "NON_RESIDENTIAL").length;
  const orphanCount = students.filter((s) => s.isOrphan).length;
  const totalDueSum = students.reduce((acc, s) => acc + (s.totalDue || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. TOP HERO & SUMMARY COCKPIT */}
      <div className="bg-gradient-to-br from-[#052216] via-[#0D5C3A] to-[#083823] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                সেন্ট্রাল স্টুডেন্ট লাইফসাইকেল হাব (Student Master ERP)
              </span>
              <span className="text-xs text-emerald-200">শিক্ষাবর্ষ ২০২৬</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              শিক্ষার্থী পরিচালনা, প্রোফাইল ও সনদপত্র নিয়ন্ত্রণ কেন্দ্র
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl mt-1.5 leading-relaxed font-light">
              মাদরাসার সকল শিক্ষার্থী, তাদের ব্যক্তিগত পরিচয়, শিক্ষাবর্ষ, হাজিরা ককপিট, পরীক্ষার ফলাফল, ফি বিবরণী ও প্রাতিষ্ঠানিক ১১টি অফিশিয়াল সনদপত্রের কেন্দ্রীয় লাইভ প্রোফাইল।
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowRegisterPrintModal(true)}
              className="bg-emerald-600/80 hover:bg-emerald-600 text-white border border-emerald-400/40 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 active:scale-95 shadow-md"
              title="অফিশিয়াল শিক্ষার্থী রেজিস্টার ও হাজিরা তালিকা প্রিন্ট"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>শিক্ষার্থী রেজিস্টার প্রিন্ট</span>
            </button>
            <button
              onClick={loadStudents}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-300 ${loading ? "animate-spin" : ""}`} />
              <span>রিফ্রেশ</span>
            </button>
            <Link
              href="/admin?tab=ADMISSION"
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন শিক্ষার্থী ভর্তি</span>
            </Link>
          </div>
        </div>

        {/* Live Metrics Cockpit */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-emerald-800/80">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <span className="text-[10px] text-emerald-200/90 font-bold block uppercase tracking-wider">মোট শিক্ষার্থী</span>
            <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">{totalCount} জন</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <span className="text-[10px] text-emerald-200/90 font-bold block uppercase tracking-wider">সক্রিয় অধ্যয়নরত</span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300 mt-1">{activeCount} জন</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <span className="text-[10px] text-emerald-200/90 font-bold block uppercase tracking-wider">আবাসিক ছাত্র</span>
            <div className="text-xl sm:text-2xl font-black font-mono text-blue-300 mt-1">{resCount} জন</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <span className="text-[10px] text-emerald-200/90 font-bold block uppercase tracking-wider">অনাবাসিক</span>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-200 mt-1">{nonResCount} জন</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <span className="text-[10px] text-emerald-200/90 font-bold block uppercase tracking-wider">এতিম / বোর্ডিং</span>
            <div className="text-xl sm:text-2xl font-black font-mono text-purple-300 mt-1">{orphanCount} জন</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
            <span className="text-[10px] text-emerald-200/90 font-bold block uppercase tracking-wider">মোট বকেয়া ফি</span>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-300 mt-1">৳ {totalDueSum.toLocaleString("bn-BD")}</div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & ADVANCED FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Text Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="শিক্ষার্থী আইডি (EHRJ-...), নাম, রোল বা ফোন..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:bg-white transition"
            />
          </div>

          {/* Jamat / Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:bg-white transition font-medium"
            >
              <option value="ALL">সকল শ্রেণি / জামাত</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Residential Filter */}
          <div>
            <select
              value={selectedResidential}
              onChange={(e) => setSelectedResidential(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:bg-white transition font-medium"
            >
              <option value="ALL">সকল আবাসিক অবস্থা</option>
              <option value="RESIDENTIAL">আবাসিক (Residential)</option>
              <option value="NON_RESIDENTIAL">অনাবাসিক (Non-Residential)</option>
              <option value="DAY_CARE">ডে-কেয়ার (Day Care)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:bg-white transition font-medium"
            >
              <option value="ALL">সকল শিক্ষার্থী স্ট্যাটাস</option>
              <option value="ACTIVE">সক্রিয় (Active)</option>
              <option value="SUSPENDED">বহিষ্কৃত / স্থগিত (Suspended)</option>
              <option value="COMPLETED">সমাপ্ত / স্নাতক (Completed)</option>
              <option value="TRANSFERRED">ছাড়পত্রপ্রাপ্ত (Transferred)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            প্রদর্শিত হচ্ছে: <strong className="text-slate-800 font-mono">{filteredStudents.length}</strong> / {totalCount} জন
          </span>
          {(search || selectedClass !== "ALL" || selectedResidential !== "ALL" || selectedStatus !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedClass("ALL");
                setSelectedResidential("ALL");
                setSelectedStatus("ALL");
              }}
              className="text-xs font-bold text-[#0D5C3A] hover:underline"
            >
              ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      </div>

      {/* 3. STUDENTS DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">শিক্ষার্থী তথ্য লোড করা হচ্ছে...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">কোনো শিক্ষার্থী পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-400">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAF9] text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">শিক্ষার্থী আইডি ও রোল</th>
                  <th className="py-3.5 px-4">নাম ও জামাত</th>
                  <th className="py-3.5 px-4">অভিভাবক ও যোগাযোগ</th>
                  <th className="py-3.5 px-4">আবাসিক অবস্থা</th>
                  <th className="py-3.5 px-4 text-right">বকেয়া ফি</th>
                  <th className="py-3.5 px-4 text-center">কার্যক্রম (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr
                    key={st.id}
                    className="hover:bg-emerald-50/40 transition cursor-pointer group"
                    onClick={() => loadStudentProfile(st.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#0D5C3A] text-xs flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                        <span>{st.studentIdNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        রোল: #{st.rollNumber ?? "—"}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#0D5C3A] transition">
                        {st.fullNameBn}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-slate-700">{st.className || "বরাদ্দহীন"}</span>
                        {st.sectionName && <span>• শাখা: {st.sectionName}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {st.fatherPhone && st.fatherPhone !== "অজানা" ? (
                        <div>
                          <div className="font-medium text-slate-800">{st.fatherNameBn || "অভিভাবক"}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{st.fatherPhone}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            অভিভাবক তথ্য নেই
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setGuardianEditTarget({
                                id: st.id,
                                name: st.fullNameBn,
                                idNumber: st.studentIdNumber,
                                guardianName: st.fatherNameBn,
                                phone: st.fatherPhone,
                              })
                            }
                            className="text-[11px] font-bold text-[#0D5C3A] hover:underline block"
                          >
                            [তথ্য যুক্ত করুন]
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            st.residentialStatus === "RESIDENTIAL"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {st.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                        </span>
                        {st.isOrphan && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            এতিম
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {st.totalDue && st.totalDue > 0 ? (
                        <div className="font-mono font-bold text-rose-700">৳ {st.totalDue.toLocaleString("bn-BD")}</div>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          পরিশোধিত
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadStudentProfile(st.id);
                        }}
                        className="bg-emerald-50 hover:bg-[#0D5C3A] text-[#0D5C3A] hover:text-white border border-emerald-200 font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-sm inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>প্রোফাইল</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. CENTRAL STUDENT MASTER PROFILE DRAWER / MODAL */}
      {activeStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-4xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-[#052216] via-[#0D5C3A] to-[#083823] text-white p-5 flex items-center justify-between border-b border-emerald-800/80 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-white p-0.5 border border-amber-400 shadow flex items-center justify-center font-black text-xl text-[#0D5C3A] shrink-0">
                  {studentDetail?.student?.fullNameBn?.charAt(0) || "শ"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded border border-amber-400/30">
                      {studentDetail?.student?.studentIdNumber || "EHRJ-..."}
                    </span>
                    <span className="text-[10px] font-bold bg-white/10 text-emerald-200 px-2 py-0.5 rounded-full">
                      {studentDetail?.student?.status || "ACTIVE"}
                    </span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-white truncate mt-1">
                    {studentDetail?.student?.fullNameBn || "শিক্ষার্থী প্রোফাইল"}
                  </h3>
                  <p className="text-xs text-emerald-200/90 truncate">
                    {studentDetail?.student?.enrollments?.[0]?.jamatClass?.nameBn || "বরাদ্দহীন জামাত"} • রোল: #{studentDetail?.student?.enrollments?.[0]?.rollNumber || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {studentDetail?.student && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenEditStudent(studentDetail.student)}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow"
                      title="শিক্ষার্থীর ব্যক্তিগত ও একাডেমিক তথ্য এডিট করুন"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>তথ্য এডিট</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteStudent(
                          studentDetail.student.id,
                          studentDetail.student.fullNameBn
                        )
                      }
                      disabled={isDeletingStudent}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow disabled:opacity-50"
                      title="শিক্ষার্থীর প্রোফাইল প্রত্যাহার বা আর্কাইভ করুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeletingStudent ? "..." : "প্রত্যাহার"}</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setActiveStudentId(null)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                  title="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Tab Navigation (10 Central Tabs) */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveProfileTab("OVERVIEW")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeProfileTab === "OVERVIEW"
                    ? "bg-[#0D5C3A] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>সংক্ষিপ্ত বিবরণ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab("ACADEMIC")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeProfileTab === "ACADEMIC"
                    ? "bg-[#0D5C3A] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>একাডেমিক ও জামাত</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab("DOCUMENTS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeProfileTab === "DOCUMENTS"
                    ? "bg-[#0D5C3A] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>সনদপত্র ও ডকুমেন্টস</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab("ATTENDANCE")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeProfileTab === "ATTENDANCE"
                    ? "bg-[#0D5C3A] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>দৈনিক হাজিরা</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab("RESULTS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeProfileTab === "RESULTS"
                    ? "bg-[#0D5C3A] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>ফলাফল ও পরীক্ষা</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab("FINANCE")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeProfileTab === "FINANCE"
                    ? "bg-[#0D5C3A] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>হিসাব ও ফি</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab("GUARDIAN")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeProfileTab === "GUARDIAN"
                    ? "bg-[#0D5C3A] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>অভিভাবক</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab("AUDIT")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeProfileTab === "AUDIT"
                    ? "bg-[#0D5C3A] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>অডিট লগ</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail ? (
                <div className="py-24 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">শিক্ষার্থীর সার্বিক রেকর্ড লোড হচ্ছে...</p>
                </div>
              ) : !studentDetail?.student ? (
                <div className="py-24 text-center">
                  <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                  <p className="text-xs text-slate-600 mt-2">শিক্ষার্থীর তথ্য পাওয়া যায়নি।</p>
                </div>
              ) : (
                <>
                  {/* Feedback Message */}
                  {docActionMsg && (
                    <div
                      className={`p-4 rounded-2xl text-xs flex items-center gap-2 border animate-in fade-in ${
                        docActionMsg.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {docActionMsg.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{docActionMsg.text}</span>
                    </div>
                  )}

                  {/* TAB 1: OVERVIEW */}
                  {activeProfileTab === "OVERVIEW" && (
                    <div className="space-y-6 animate-in fade-in">
                      {/* Identity Summary Card */}
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">বাংলা নাম</span>
                          <span className="font-bold text-slate-900">{studentDetail.student.fullNameBn}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">ইংরেজি নাম</span>
                          <span className="font-bold text-slate-900">{studentDetail.student.fullNameEn || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">জন্ম তারিখ</span>
                          <span className="font-bold text-slate-900">
                            {studentDetail.student.dateOfBirth
                              ? new Date(studentDetail.student.dateOfBirth).toLocaleDateString("bn-BD")
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">রক্তের গ্রুপ</span>
                          <span className="font-bold text-rose-600">{studentDetail.student.bloodGroup || "অজানা"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">পিতার নাম</span>
                          <span className="font-bold text-slate-900">{studentDetail.student.fatherNameBn}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">মাতার নাম</span>
                          <span className="font-bold text-slate-900">{studentDetail.student.motherNameBn}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">বর্তমান ঠিকানা</span>
                          <span className="font-medium text-slate-700">{studentDetail.student.presentAddress}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">আবাসিক অবস্থা</span>
                          <span className="font-bold text-blue-700">
                            {studentDetail.student.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                          </span>
                        </div>
                      </div>

                      {/* Performance Mini Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                          <span className="text-xs font-bold text-emerald-800 block">উপস্থিতির গড় হার</span>
                          <div className="text-2xl font-black font-mono text-emerald-900 mt-1">
                            {studentDetail.attendanceStats?.attendanceRate ?? 100}%
                          </div>
                          <span className="text-[11px] text-emerald-700 mt-1 block">
                            মোট কার্যদিবস: {studentDetail.attendanceStats?.totalDays ?? 0} দিন
                          </span>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                          <span className="text-xs font-bold text-blue-800 block">ফি পরিশোধ ও বকেয়া</span>
                          <div className="text-2xl font-black font-mono text-blue-900 mt-1">
                            ৳ {(studentDetail.financeStats?.totalDue ?? 0).toLocaleString("bn-BD")}
                          </div>
                          <span className="text-[11px] text-blue-700 mt-1 block">
                            মোট পরিশোধিত: ৳ {(studentDetail.financeStats?.totalPaid ?? 0).toLocaleString("bn-BD")}
                          </span>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                          <span className="text-xs font-bold text-purple-800 block">ইস্যুকৃত সনদপত্র</span>
                          <div className="text-2xl font-black font-mono text-purple-900 mt-1">
                            {studentDetail.student.certificates?.length ?? 0} টি
                          </div>
                          <span className="text-[11px] text-purple-700 mt-1 block">অফিশিয়াল ভেরিফাইড ডকুমেন্ট</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ACADEMIC */}
                  {activeProfileTab === "ACADEMIC" && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#0D5C3A]" />
                          <span>বর্তমান অন্তর্ভুক্তি ও রোল সমন্বয়</span>
                        </h4>
                        {studentDetail.student.enrollments?.[0] ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div>
                              <span className="text-slate-400 block text-[10px]">শিক্ষাবর্ষ:</span>
                              <span className="font-bold text-slate-800">
                                {studentDetail.student.enrollments[0].session?.name}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">শ্রেণি / জামাত:</span>
                              <span className="font-bold text-slate-800">
                                {studentDetail.student.enrollments[0].jamatClass?.nameBn}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">শাখা:</span>
                              <span className="font-bold text-slate-800">
                                {studentDetail.student.enrollments[0].section?.nameBn || "ক শাখা"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">শ্রেণি রোল:</span>
                              <span className="font-mono font-black text-[#0D5C3A]">
                                #{studentDetail.student.enrollments[0].rollNumber}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">কোনো শ্রেণি অন্তর্ভুক্তি নেই।</p>
                        )}
                      </div>

                      {/* Enrollment History */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                        <h4 className="font-bold text-sm text-slate-900">অতীত শিক্ষাবর্ষ ও জামাত ইতিহাস</h4>
                        <div className="space-y-2">
                          {studentDetail.student.enrollments?.map((en: any, idx: number) => (
                            <div
                              key={en.id}
                              className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-800">{en.jamatClass?.nameBn}</span>
                                <span className="text-slate-500 ml-2">({en.session?.name})</span>
                              </div>
                              <div className="font-mono font-bold text-slate-600">
                                রোল: #{en.rollNumber} {idx === 0 && <span className="text-emerald-700 ml-1.5">(বর্তমান)</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 7: CENTRAL DOCUMENTS HUB (THE 11 OFFICIAL CANONICAL DOCUMENTS) */}
                  {activeProfileTab === "DOCUMENTS" && (
                    <div className="space-y-5 animate-in fade-in">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 leading-relaxed">
                        <span className="font-bold text-[#0D5C3A] block mb-0.5">
                          প্রাতিষ্ঠানিক সনদ ও ডকুমেন্ট সেন্টার:
                        </span>
                        শিক্ষার্থীর জন্য প্রযোজ্য ১১টি অফিশিয়াল সনদের লাইভ এলিজিবিলিটি ও প্রিন্ট হাব। হিফজ, মেশকাত ও দাওরায়ে হাদীস সনদ কেবল নির্ধারিত যোগ্যতার শর্ত পূরণ সাপেক্ষে স্বয়ংক্রিয়ভাবে অনুমোদিত হয়।
                      </div>

                      {/* Document Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { code: "STUDENT_ID", name: "ডিজিটাল স্টুডেন্ট আইডি কার্ড (CR80)" },
                          { code: "ADMISSION_CONFIRMATION", name: "ভর্তি নিশ্চয়তা ও প্রত্যয়নপত্র" },
                          { code: "STUDY_CERTIFICATE", name: "অধ্যয়ন ও ভর্তি প্রত্যয়নপত্র" },
                          { code: "PRATYAYAN_PATRA", name: "প্রাতিষ্ঠানিক প্রত্যয়নপত্র" },
                          { code: "CHARACTER_CERTIFICATE", name: "চারিত্রিক প্রশংসাপত্র ও সনদ" },
                          { code: "TESTIMONIAL", name: "প্রশংসাপত্র (টেস্টিমোনিয়াল)" },
                          { code: "TRANSFER_CERTIFICATE", name: "ছাড়পত্র / টিসি (Transfer Certificate)" },
                          { code: "STUDENT_STATUS", name: "শিক্ষার্থী স্ট্যাটাস সনদ" },
                          { code: "HIFZ_CERTIFICATE", name: "হিফজুল কুরআন সমাপনী সনদ" },
                          { code: "MISHKAT_CERTIFICATE", name: "মেশকাত জামাত সমাপনী সনদ" },
                          { code: "DAWRA_CERTIFICATE", name: "দাওরায়ে হাদীস সমাপনী সনদ" },
                          { code: "ADMIT_CARD", name: "পরীক্ষার প্রবেশপত্র (এডমিট কার্ড)" },
                        ].map((docItem) => {
                          const eligibility = studentDetail.documentEligibility?.[docItem.code];
                          const isEligible = eligibility?.eligible;
                          const reason = eligibility?.reason;
                          const activeDoc = eligibility?.issuedDoc;

                          return (
                            <div
                              key={docItem.code}
                              className={`p-4 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between gap-3 ${
                                activeDoc
                                  ? "bg-white border-emerald-300 shadow-sm"
                                  : isEligible
                                  ? "bg-white border-slate-200 hover:border-emerald-300"
                                  : "bg-slate-50 border-slate-200 opacity-80"
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-900">{docItem.name}</span>
                                  {activeDoc ? (
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      ইস্যুকৃত
                                    </span>
                                  ) : isEligible ? (
                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                      ইস্যুযোগ্য
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                                      অনুপযুক্ত
                                    </span>
                                  )}
                                </div>

                                {activeDoc ? (
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    সনদ নং: {activeDoc.certificateNumber} • ইস্যুর তারিখ:{" "}
                                    {new Date(activeDoc.issuedAt).toLocaleDateString("bn-BD")}
                                  </div>
                                ) : reason ? (
                                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-relaxed">
                                    {reason}
                                  </p>
                                ) : (
                                  <p className="text-[11px] text-slate-400">প্রয়োজনে যেকোনো সময় ইস্যু করা যাবে।</p>
                                )}
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                {activeDoc ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setViewingDoc(activeDoc)}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#0D5C3A] text-[#0D5C3A] hover:text-white border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>প্রিভিউ ও প্রিন্ট</span>
                                    </button>
                                  </>
                                ) : isEligible ? (
                                  <button
                                    type="button"
                                    disabled={issuingDocType === docItem.code}
                                    onClick={() => handleIssueDocument(docItem.code)}
                                    className="px-3.5 py-1.5 rounded-xl bg-[#0D5C3A] hover:bg-[#083823] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                    <span>
                                      {issuingDocType === docItem.code ? "ইস্যু হচ্ছে..." : "এখনই ইস্যু করুন"}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium italic">
                                    শর্ত পূরণ সাপেক্ষে উন্মুক্ত
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: ATTENDANCE */}
                  {activeProfileTab === "ATTENDANCE" && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                          <span className="text-slate-500 text-[11px] block">উপস্থিত (Present)</span>
                          <span className="font-bold text-lg font-mono text-emerald-800">
                            {studentDetail.attendanceStats?.presentDays ?? 0} দিন
                          </span>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
                          <span className="text-slate-500 text-[11px] block">অনুপস্থিত (Absent)</span>
                          <span className="font-bold text-lg font-mono text-rose-800">
                            {studentDetail.attendanceStats?.absentDays ?? 0} দিন
                          </span>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                          <span className="text-slate-500 text-[11px] block">বিলম্ব (Late)</span>
                          <span className="font-bold text-lg font-mono text-amber-800">
                            {studentDetail.attendanceStats?.lateDays ?? 0} দিন
                          </span>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                          <span className="text-slate-500 text-[11px] block">অনুমোদিত ছুটি (Leave)</span>
                          <span className="font-bold text-lg font-mono text-blue-800">
                            {studentDetail.attendanceStats?.leaveDays ?? 0} দিন
                          </span>
                        </div>
                      </div>

                      {/* Recent Attendance Logs */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                        <h4 className="font-bold text-xs text-slate-800">সর্বশেষ ৩৫ দিনের দৈনিক রেকর্ড:</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-600 border-b">
                              <tr>
                                <th className="p-2.5">তারিখ</th>
                                <th className="p-2.5">অবস্থা (Status)</th>
                                <th className="p-2.5">মন্তব্য</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {studentDetail.student.attendances?.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="p-4 text-center text-slate-400">
                                    কোনো হাজিরার রেকর্ড পাওয়া যায়নি।
                                  </td>
                                </tr>
                              ) : (
                                studentDetail.student.attendances?.map((att: any) => (
                                  <tr key={att.id} className="hover:bg-slate-50">
                                    <td className="p-2.5 font-mono text-slate-800">
                                      {new Date(att.date).toLocaleDateString("bn-BD")}
                                    </td>
                                    <td className="p-2.5">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          att.status === "PRESENT"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : att.status === "ABSENT"
                                            ? "bg-rose-100 text-rose-800"
                                            : att.status === "LATE"
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-blue-100 text-blue-800"
                                        }`}
                                      >
                                        {att.status === "PRESENT"
                                          ? "উপস্থিত"
                                          : att.status === "ABSENT"
                                          ? "অনুপস্থিত"
                                          : att.status === "LATE"
                                          ? "দেরি"
                                          : "ছুটি"}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-slate-500">{att.remarks || "—"}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: RESULTS */}
                  {activeProfileTab === "RESULTS" && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <Award className="w-4 h-4 text-[#0D5C3A]" />
                          <span>একাডেমিক ফলাফল ও নম্বরপত্র</span>
                        </h4>

                        {studentDetail.student.results?.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            কোনো প্রকাশিত পরীক্ষার ফলাফল নেই।
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {studentDetail.student.results?.map((res: any) => (
                              <div
                                key={res.id}
                                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                              >
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">
                                    {res.exam?.nameBn || res.exam?.name}
                                  </div>
                                  <div className="text-slate-500 text-[11px] mt-0.5">
                                    মোট নম্বর: <strong className="font-mono text-slate-800">{res.totalMarks}</strong> •
                                    শতকরা: <strong className="font-mono text-slate-800">{res.percentage}%</strong> •
                                    মেধাক্রম: #{res.meritPosition ?? "—"}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                      res.isPassed
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                        : "bg-rose-100 text-rose-800 border border-rose-300"
                                    }`}
                                  >
                                    {res.islamicGrade || (res.isPassed ? "উত্তীর্ণ" : "অনুত্তীর্ণ")}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: FINANCE */}
                  {activeProfileTab === "FINANCE" && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-slate-500 block">মোট ধার্যকৃত ফি</span>
                          <span className="text-lg font-mono font-bold text-slate-800">
                            ৳ {(studentDetail.financeStats?.totalInvoiced ?? 0).toLocaleString("bn-BD")}
                          </span>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                          <span className="text-emerald-700 block">পরিশোধিত অর্থ</span>
                          <span className="text-lg font-mono font-bold text-emerald-900">
                            ৳ {(studentDetail.financeStats?.totalPaid ?? 0).toLocaleString("bn-BD")}
                          </span>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                          <span className="text-rose-700 block">বর্তমান বকেয়া</span>
                          <span className="text-lg font-mono font-bold text-rose-900">
                            ৳ {(studentDetail.financeStats?.totalDue ?? 0).toLocaleString("bn-BD")}
                          </span>
                        </div>
                      </div>

                      {/* Invoices List */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                        <h4 className="font-bold text-xs text-slate-800">ফি ইনভয়েস ও আদায় বিবরণী:</h4>
                        <div className="space-y-2">
                          {studentDetail.student.feeInvoices?.map((inv: any) => (
                            <div
                              key={inv.id}
                              className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{inv.title || inv.feeType?.nameBn}</span>
                                <span className="text-[11px] text-slate-500 ml-2 font-mono">#{inv.invoiceNumber}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-slate-800">
                                  ৳ {inv.totalAmount.toLocaleString("bn-BD")}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    inv.status === "PAID"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : inv.status === "PARTIAL"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {inv.status === "PAID" ? "পরিশোধিত" : inv.status === "PARTIAL" ? "আংশিক" : "বকেয়া"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: GUARDIAN */}
                  {activeProfileTab === "GUARDIAN" && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-[#0D5C3A]" />
                            <span>অভিভাবক ও পরিবারের বিবরণ</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() =>
                              setGuardianEditTarget({
                                id: studentDetail.student.id,
                                name: studentDetail.student.fullNameBn,
                                idNumber: studentDetail.student.studentIdNumber,
                                guardianName: studentDetail.student.fatherNameBn,
                                phone: studentDetail.student.fatherPhone,
                              })
                            }
                            className="bg-emerald-50 hover:bg-[#0D5C3A] text-[#0D5C3A] hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>তথ্য সংশোধন</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                            <span className="text-slate-400 text-[10px] block uppercase font-bold">পিতা / মূল অভিভাবক</span>
                            <div className="font-bold text-slate-900 text-sm">{studentDetail.student.fatherNameBn}</div>
                            <div className="text-slate-600 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="font-mono">{studentDetail.student.fatherPhone || "ফোন নম্বর অনুপস্থিত"}</span>
                            </div>
                            <div className="text-slate-500">পেশা: {studentDetail.student.fatherOccupation || "—"}</div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                            <span className="text-slate-400 text-[10px] block uppercase font-bold">মাতা</span>
                            <div className="font-bold text-slate-900 text-sm">{studentDetail.student.motherNameBn}</div>
                            <div className="text-slate-600 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="font-mono">{studentDetail.student.motherPhone || "ফোন নম্বর অনুপস্থিত"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 8: AUDIT LOGS */}
                  {activeProfileTab === "AUDIT" && (
                    <div className="space-y-3 animate-in fade-in">
                      <h4 className="font-bold text-xs text-slate-800">অডিট ও নিরাপত্তা ট্রেইল (সর্বশেষ ২৫টি):</h4>
                      <div className="space-y-2">
                        {studentDetail.auditLogs?.map((log: any) => (
                          <div
                            key={log.id}
                            className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{log.action}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                দ্বারা: <strong className="text-slate-700">{log.user?.name || "সিস্টেম"}</strong> ({log.user?.role || "SYSTEM"})
                              </div>
                            </div>
                            <div className="text-right text-[11px] text-slate-400 font-mono">
                              {new Date(log.createdAt).toLocaleString("bn-BD")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. DOCUMENT VIEW & PRINT MODAL */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-[#0D5C3A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-300" />
                <h4 className="font-bold text-sm">{viewingDoc.titleBn || "অফিশিয়াল প্রাতিষ্ঠানিক সনদ"}</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  title="সনদ প্রিভিউ বন্ধ করুন"
                  className="p-1 rounded-lg hover:bg-white/10 text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70 flex items-center justify-center">
              <div className="max-w-4xl w-full flex justify-center">
                <UniversalDocumentRenderer
                  doc={viewingDoc}
                  layoutMode={
                    viewingDoc.certificateType === "STUDENT_ID" || viewingDoc.documentType === "STUDENT_ID"
                      ? "ID_CARD"
                      : "A4"
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. STUDENT REGISTER PRINT MODAL (OFFICIAL INSTITUTIONAL DIRECTORY) */}
      {showRegisterPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Header / Action Controls */}
            <div className="p-4 bg-[#0D5C3A] text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-300" />
                <div>
                  <h4 className="font-bold text-sm">শিক্ষার্থী সাধারণ রেজিস্টার ও রোল ডিরেক্টরি</h4>
                  <p className="text-[11px] text-emerald-200">অফিশিয়াল প্রাতিষ্ঠানিক প্রিন্ট ও সংরক্ষণ ভিউ</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Class selector */}
                <select
                  value={printRegisterClass}
                  onChange={(e) => setPrintRegisterClass(e.target.value)}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none"
                >
                  <option value="ALL" className="text-slate-900">সকল জামাত (All Classes)</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls} value={cls} className="text-slate-900">
                      জামাত: {cls}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট করুন</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRegisterPrintModal(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                  title="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Container */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100 flex justify-center">
              <div
                id="student-register-printable"
                className="bg-white shadow-xl rounded-xl p-8 max-w-4xl w-full border border-slate-300 print:shadow-none print:border-none print:p-0 text-slate-900 space-y-6"
              >
                {/* Official Madrasah Letterhead */}
                <div className="text-center border-b-2 border-[#0D5C3A] pb-4 space-y-1">
                  <div className="text-xs font-semibold text-emerald-800 tracking-wider">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#0D5C3A]">
                    ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা ও এতিমখানা
                  </h1>
                  <p className="text-xs text-slate-600">
                    ডাকঘর: ইলিয়টগঞ্জ, উপজেলা: দাউদকান্দি, জেলা: কুমিল্লা | স্থাপিত: ২০২১ ইং
                  </p>
                  <div className="pt-2">
                    <span className="inline-block bg-[#0D5C3A] text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide">
                      শিক্ষার্থী রেজিস্টার ও হাজিরা তালিকা — শিক্ষাবর্ষ ২০২৬
                    </span>
                  </div>
                </div>

                {/* Filter and Summary Bar */}
                <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 gap-2">
                  <div>
                    নির্বাচিত জামাত: <strong>{printRegisterClass === "ALL" ? "সকল জামাত" : printRegisterClass}</strong>
                  </div>
                  <div>
                    মোট শিক্ষার্থী: <strong>{students.filter(s => printRegisterClass === "ALL" || s.className === printRegisterClass).length} জন</strong>
                  </div>
                  <div>
                    তারিখ: <strong>{new Date().toLocaleDateString("bn-BD")}</strong>
                  </div>
                </div>

                {/* Register Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-300">
                    <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                      <tr>
                        <th className="p-2 border-r border-slate-300 text-center w-12">ক্র.</th>
                        <th className="p-2 border-r border-slate-300 text-center w-14">রোল</th>
                        <th className="p-2 border-r border-slate-300">শিক্ষার্থী আইডি</th>
                        <th className="p-2 border-r border-slate-300">শিক্ষার্থীর নাম</th>
                        <th className="p-2 border-r border-slate-300">জামাত ও শাখা</th>
                        <th className="p-2 border-r border-slate-300">অভিভাবক ও যোগাযোগ</th>
                        <th className="p-2 border-r border-slate-300 text-center">আবাসিক অবস্থা</th>
                        <th className="p-2 text-center w-24">স্বাক্ষর / মন্তব্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {students
                        .filter((s) => printRegisterClass === "ALL" || s.className === printRegisterClass)
                        .map((st, idx) => (
                          <tr key={st.id} className="hover:bg-slate-50">
                            <td className="p-2 border-r border-slate-300 text-center font-mono">
                              {(idx + 1).toLocaleString("bn-BD")}
                            </td>
                            <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">
                              {st.rollNumber ? st.rollNumber.toLocaleString("bn-BD") : "—"}
                            </td>
                            <td className="p-2 border-r border-slate-300 font-mono font-bold text-[#0D5C3A]">
                              {st.studentIdNumber}
                            </td>
                            <td className="p-2 border-r border-slate-300">
                              <div className="font-bold text-slate-900">{st.fullNameBn}</div>
                              {st.fullNameEn && (
                                <div className="text-[10px] text-slate-500">{st.fullNameEn}</div>
                              )}
                            </td>
                            <td className="p-2 border-r border-slate-300">
                              {st.className || "বরাদ্দহীন"}
                              {st.sectionName && <span className="text-slate-500"> ({st.sectionName})</span>}
                            </td>
                            <td className="p-2 border-r border-slate-300">
                              <div>{st.fatherNameBn || "—"}</div>
                              <div className="font-mono text-slate-500 text-[11px]">{st.fatherPhone || "—"}</div>
                            </td>
                            <td className="p-2 border-r border-slate-300 text-center">
                              <span className="text-[11px]">
                                {st.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                                {st.isOrphan && " (এতিম)"}
                              </span>
                            </td>
                            <td className="p-2 text-center"></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Official Dual Signature Footer */}
                <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                    শ্রেণি শিক্ষকের স্বাক্ষর
                  </div>
                  <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                    <div>মাওলানা মো: আবুল কালাম সরকার</div>
                    <div className="text-[11px] text-slate-600 font-normal">মুহতামিম / অধ্যক্ষ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. STUDENT EDIT DETAILS MODAL */}
      {editStudentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-[#0D5C3A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-300" />
                <div>
                  <h4 className="font-bold text-sm">শিক্ষার্থীর তথ্য ও স্ট্যাটাস হালনাগাদ</h4>
                  <p className="text-[11px] text-emerald-200 font-mono">আইডি: {editStudentTarget.studentIdNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditStudentTarget(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">শিক্ষার্থীর পূর্ণ নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={studentEditForm.fullNameBn}
                    onChange={(e) => setStudentEditForm({ ...studentEditForm, fullNameBn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-[#0D5C3A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ইংরেজি নাম (Full Name En)</label>
                  <input
                    type="text"
                    value={studentEditForm.fullNameEn}
                    onChange={(e) => setStudentEditForm({ ...studentEditForm, fullNameEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-[#0D5C3A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">রোল নম্বর (Roll Number)</label>
                  <input
                    type="number"
                    value={studentEditForm.adjustRollNumber}
                    onChange={(e) => setStudentEditForm({ ...studentEditForm, adjustRollNumber: e.target.value })}
                    placeholder="উদা: ১, ২, ৩..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-[#0D5C3A] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">আবাসিক অবস্থা</label>
                  <select
                    value={studentEditForm.residentialStatus}
                    onChange={(e) => setStudentEditForm({ ...studentEditForm, residentialStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-[#0D5C3A]"
                  >
                    <option value="RESIDENTIAL">আবাসিক (Residential)</option>
                    <option value="NON_RESIDENTIAL">অনাবাসিক (Non-Residential)</option>
                    <option value="DAY_CARE">ডে-কেয়ার (Day Care)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">শিক্ষার্থী স্ট্যাটাস</label>
                  <select
                    value={studentEditForm.status}
                    onChange={(e) => setStudentEditForm({ ...studentEditForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-[#0D5C3A]"
                  >
                    <option value="ACTIVE">সক্রিয় (Active)</option>
                    <option value="SUSPENDED">স্থগিত (Suspended)</option>
                    <option value="COMPLETED">সমাপ্ত (Completed)</option>
                    <option value="TRANSFERRED">ছাড়পত্রপ্রাপ্ত (Transferred)</option>
                    <option value="WITHDRAWN">প্রত্যাহার (Withdrawn)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">জন্ম তারিখ</label>
                  <input
                    type="date"
                    value={studentEditForm.dateOfBirth}
                    onChange={(e) => setStudentEditForm({ ...studentEditForm, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-[#0D5C3A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">রক্তের গ্রুপ</label>
                  <input
                    type="text"
                    placeholder="উদা: A+, B+, O+ ইত্যাদি"
                    value={studentEditForm.bloodGroup}
                    onChange={(e) => setStudentEditForm({ ...studentEditForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-[#0D5C3A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পিতার নাম</label>
                  <input
                    type="text"
                    value={studentEditForm.fatherNameBn}
                    onChange={(e) => setStudentEditForm({ ...studentEditForm, fatherNameBn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-[#0D5C3A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পিতার মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={studentEditForm.fatherPhone}
                    onChange={(e) => setStudentEditForm({ ...studentEditForm, fatherPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-[#0D5C3A] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">মাতার নাম</label>
                  <input
                    type="text"
                    value={studentEditForm.motherNameBn}
                    onChange={(e) => setStudentEditForm({ ...studentEditForm, motherNameBn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-[#0D5C3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">বর্তমান ঠিকানা</label>
                <textarea
                  rows={2}
                  value={studentEditForm.presentAddress}
                  onChange={(e) => setStudentEditForm({ ...studentEditForm, presentAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-[#0D5C3A]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditStudentTarget(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStudent}
                  className="px-5 py-2 bg-[#0D5C3A] hover:bg-[#158052] text-white rounded-xl font-bold shadow transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUpdatingStudent ? "সংরক্ষণ হচ্ছে..." : "তথ্য সংরক্ষণ করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            setGuardianEditTarget(null);
            loadStudents();
            if (activeStudentId) loadStudentProfile(activeStudentId);
          }}
        />
      )}
    </div>
  );
}
