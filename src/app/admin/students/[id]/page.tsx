"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  ArrowLeft,
  Calendar,
  Layers,
  Phone,
  Home,
  Shield,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Edit,
  Save,
  RefreshCw,
  Sparkles,
  Users,
  Building,
  HeartHandshake,
  Check,
  XCircle,
  Hash,
  Paperclip,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

type ProfileTab = "OVERVIEW" | "PERSONAL" | "FAMILY" | "ACADEMIC" | "DOCUMENTS" | "AUDIT";

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>("OVERVIEW");
  const [banner, setBanner] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Edit Personal Information state
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [editFullNameBn, setEditFullNameBn] = useState("");
  const [editFullNameEn, setEditFullNameEn] = useState("");
  const [editFullNameAr, setEditFullNameAr] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editBloodGroup, setEditBloodGroup] = useState("");
  const [editBirthReg, setEditBirthReg] = useState("");
  const [editPresentAddress, setEditPresentAddress] = useState("");
  const [editPermanentAddress, setEditPermanentAddress] = useState("");
  const [editResidentialStatus, setEditResidentialStatus] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Roll Adjustment State
  const [showRollModal, setShowRollModal] = useState(false);
  const [targetEnrollmentId, setTargetEnrollmentId] = useState("");
  const [newRollNumber, setNewRollNumber] = useState("");
  const [submittingRoll, setSubmittingRoll] = useState(false);

  // Add Document State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docType, setDocType] = useState("BIRTH_CERTIFICATE");
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [submittingDoc, setSubmittingDoc] = useState(false);

  // Add Guardian Link State
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("FATHER");
  const [guardianIsPrimary, setGuardianIsPrimary] = useState(false);
  const [submittingGuardian, setSubmittingGuardian] = useState(false);

  const fetchStudent = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ছাত্রের তথ্য পাওয়া যায়নি।");

      setStudent(data.student);
      setAuditLogs(data.auditLogs || []);

      // Populate edit fields
      const s = data.student;
      setEditFullNameBn(s.fullNameBn || "");
      setEditFullNameEn(s.fullNameEn || "");
      setEditFullNameAr(s.fullNameAr || "");
      setEditDob(s.dateOfBirth ? s.dateOfBirth.split("T")[0] : "");
      setEditBloodGroup(s.bloodGroup || "");
      setEditBirthReg(s.birthCertificateNo || "");
      setEditPresentAddress(s.presentAddress || "");
      setEditPermanentAddress(s.permanentAddress || "");
      setEditResidentialStatus(s.residentialStatus || "NON_RESIDENTIAL");
      setEditStatus(s.status || "ACTIVE");
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  // Save personal details
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullNameBn: editFullNameBn,
          fullNameEn: editFullNameEn,
          fullNameAr: editFullNameAr,
          dateOfBirth: editDob,
          bloodGroup: editBloodGroup,
          birthCertificateNo: editBirthReg,
          presentAddress: editPresentAddress,
          permanentAddress: editPermanentAddress,
          residentialStatus: editResidentialStatus,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "সংরক্ষণ করতে ত্রুটি");

      setBanner({ text: "ব্যক্তিগত তথ্য সফলভাবে হালনাগাদ করা হয়েছে।", type: "success" });
      setIsEditingPersonal(false);
      fetchStudent();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setSavingPersonal(false);
    }
  };

  // Adjust roll number
  const handleAdjustRoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRoll(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: targetEnrollmentId,
          adjustRollNumber: newRollNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBanner({ text: "রোল নম্বর সফলভাবে পরিবর্তন ও অডিট লগে লিপিবদ্ধ হয়েছে।", type: "success" });
      setShowRollModal(false);
      setNewRollNumber("");
      fetchStudent();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setSubmittingRoll(false);
    }
  };

  // Add document
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDoc(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: docType,
          fileName: docName,
          fileUrl: docUrl,
          verificationStatus: "VERIFIED",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBanner({ text: "ডকুমেন্ট সফলভাবে সংরক্ষিত হয়েছে।", type: "success" });
      setShowDocModal(false);
      setDocName("");
      setDocUrl("");
      fetchStudent();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setSubmittingDoc(false);
    }
  };

  // Add Guardian Link
  const handleAddGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingGuardian(true);
    try {
      // 1. Create or get guardian
      const resGuard = await fetch("/api/admin/guardians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullNameBn: guardianName,
          phone: guardianPhone,
          relation: guardianRelation,
          studentId,
        }),
      });
      const dataGuard = await resGuard.json();
      if (!resGuard.ok) throw new Error(dataGuard.error);

      // 2. Link with primary status if set
      if (dataGuard.guardian && guardianIsPrimary) {
        await fetch(`/api/admin/students/${studentId}/guardians`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guardianId: dataGuard.guardian.id,
            isPrimary: true,
          }),
        });
      }

      setBanner({ text: "অভিভাবকের তথ্য সফলভাবে সংযুক্ত করা হয়েছে।", type: "success" });
      setShowGuardianModal(false);
      setGuardianName("");
      setGuardianPhone("");
      fetchStudent();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setSubmittingGuardian(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-medium text-slate-600">শিক্ষার্থীর বিস্তারিত তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-800">শিক্ষার্থী পাওয়া যায়নি</h2>
          <p className="text-xs text-slate-500 my-2">অনুরোধকৃত শিক্ষার্থী আইডিটি ডাটাবেজে বিদ্যমান নেই।</p>
          <Link
            href="/admin/students"
            className="inline-block mt-3 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold"
          >
            শিক্ষার্থী তালিকায় ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  const currentEnrollment = student.enrollments?.[0];
  const primaryGuardian = student.guardianLinks?.find((gl: any) => gl.isPrimary)?.guardian || student.guardianLinks?.[0]?.guardian;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/students"
              className="p-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ছাত্র তালিকা</span>
            </Link>
            <div className="h-5 w-px bg-emerald-700 hidden sm:block" />
            <div>
              <h1 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>{student.fullNameBn}</span>
                <span className="font-mono text-xs bg-emerald-800 px-2 py-0.5 rounded text-emerald-200">
                  {student.studentIdNumber}
                </span>
              </h1>
              <p className="text-xs text-emerald-200">
                {currentEnrollment?.jamatClass?.nameBn || "বরাদ্দহীন"} • রোল: #{currentEnrollment?.rollNumber || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStudent}
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
              <span>একাডেমিক হাব</span>
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

        {/* Profile Master Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-500 rounded-2xl flex items-center justify-center text-emerald-800 font-bold text-2xl flex-shrink-0 shadow-inner">
              {student.fullNameBn.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{student.fullNameBn}</h2>
                {student.fullNameAr && (
                  <span className="font-arabic text-emerald-800 text-lg px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200/50">
                    {student.fullNameAr}
                  </span>
                )}
                {student.status === "ACTIVE" ? (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                    সক্রিয়
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                    {student.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">আইডি: {student.studentIdNumber}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                  {currentEnrollment?.jamatClass?.nameBn || "বরাদ্দহীন জামাত"}
                </span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                  শাখা: {currentEnrollment?.section?.nameBn || "সাধারণ"}
                </span>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded font-mono">
                  রোল: #{currentEnrollment?.rollNumber || "—"}
                </span>
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">
                  {student.residentialStatus === "RESIDENTIAL"
                    ? "আবাসিক"
                    : student.residentialStatus === "DAY_CARE"
                    ? "ডে-কেয়ার (খাদ্য বিলমুক্ত)"
                    : "অনাবাসিক"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (currentEnrollment) {
                  setTargetEnrollmentId(currentEnrollment.id);
                  setNewRollNumber(String(currentEnrollment.rollNumber));
                  setShowRollModal(true);
                }
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Hash className="w-4 h-4 text-emerald-700" />
              <span>রোল পরিবর্তন ও সমন্বয়</span>
            </button>
            <button
              onClick={() => setShowDocModal(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Paperclip className="w-4 h-4 text-emerald-700" />
              <span>ডকুমেন্ট যুক্ত করুন</span>
            </button>
            <button
              onClick={() => setShowGuardianModal(true)}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>অভিভাবক সংযুক্ত</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "OVERVIEW" ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <User className="w-4 h-4" />
            <span>১. সংক্ষিপ্ত রূপরেখা</span>
          </button>
          <button
            onClick={() => setActiveTab("PERSONAL")}
            className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "PERSONAL" ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>২. ব্যক্তিগত তথ্য</span>
          </button>
          <button
            onClick={() => setActiveTab("FAMILY")}
            className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "FAMILY" ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>৩. পরিবার ও অভিভাবক ({student.guardianLinks?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("ACADEMIC")}
            className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "ACADEMIC" ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>৪. শিক্ষাবর্ষ ও জামাত ইতিহাস ({student.enrollments?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("DOCUMENTS")}
            className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "DOCUMENTS" ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>৫. ডকুমেন্টস ({student.documents?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("AUDIT")}
            className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "AUDIT" ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>৬. অডিট ও নিরাপত্তা লগ ({auditLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "OVERVIEW" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>মৌলিক ও প্রাতিষ্ঠানিক তথ্য</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">স্থায়ী স্টুডেন্ট আইডি:</span>
                  <span className="font-mono font-bold text-emerald-800">{student.studentIdNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">বাংলা নাম:</span>
                  <span className="font-bold text-slate-900">{student.fullNameBn}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">আরবি নাম:</span>
                  <span className="font-arabic text-emerald-800 font-medium">{student.fullNameAr || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">জন্ম তারিখ:</span>
                  <span className="font-medium text-slate-800">
                    {new Date(student.dateOfBirth).toLocaleDateString("bn-BD")}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">জেন্ডার:</span>
                  <span className="font-medium text-slate-800">{student.gender === "MALE" ? "ছাত্র (ছেলে)" : "ছাত্রী"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">রক্তের গ্রুপ:</span>
                  <span className="font-bold text-rose-600">{student.bloodGroup || "জানা নেই"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">জন্ম নিবন্ধন নম্বর:</span>
                  <span className="font-mono text-slate-800">{student.birthCertificateNo || "জমা হয়নি"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">এতিম অবস্থা:</span>
                  <span className="font-bold text-slate-800">
                    {student.isOrphan ? "হ্যাঁ (এতিম শিক্ষার্থী)" : "না"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                <Home className="w-4 h-4 text-emerald-600" />
                <span>পরিবার, অভিভাবক ও যোগাযোগের ঠিকানা</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">পিতার নাম:</span>
                  <span className="font-bold text-slate-900">{student.fatherNameBn}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">পিতার ফোন:</span>
                  <span className="font-mono text-slate-800">{student.fatherPhone || "যোগাযোগ নেই"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">মাতার নাম:</span>
                  <span className="font-medium text-slate-900">{student.motherNameBn}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">প্রাথমিক অভিভাবক:</span>
                  <span className="font-bold text-emerald-800">
                    {primaryGuardian?.fullNameBn || student.fatherNameBn} ({primaryGuardian?.relation || "পিতা"})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">অভিভাবকের মোবাইল:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {primaryGuardian?.phone || student.fatherPhone || "যোগাযোগ নেই"}
                  </span>
                </div>
                <div className="py-1 border-b border-slate-50">
                  <span className="text-slate-500 block mb-0.5">বর্তমান ঠিকানা:</span>
                  <span className="font-medium text-slate-800">{student.presentAddress}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-500 block mb-0.5">স্থায়ী ঠিকানা:</span>
                  <span className="font-medium text-slate-800">{student.permanentAddress}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PERSONAL EDIT */}
        {activeTab === "PERSONAL" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-emerald-600" />
                  <span>ব্যক্তিগত তথ্য হালনাগাদ</span>
                </h3>
                <p className="text-xs text-slate-500">সকল পরিবর্তন স্বয়ংক্রিয়ভাবে অডিট ট্রেইলে সংরক্ষিত হবে।</p>
              </div>
            </div>

            <form onSubmit={handleSavePersonal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বাংলা নাম *</label>
                  <input
                    type="text"
                    required
                    value={editFullNameBn}
                    onChange={(e) => setEditFullNameBn(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ইংরেজি নাম</label>
                  <input
                    type="text"
                    value={editFullNameEn}
                    onChange={(e) => setEditFullNameEn(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">আরবি নাম</label>
                  <input
                    type="text"
                    value={editFullNameAr}
                    onChange={(e) => setEditFullNameAr(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-arabic text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">জন্ম তারিখ</label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">রক্তের গ্রুপ</label>
                  <select
                    value={editBloodGroup}
                    onChange={(e) => setEditBloodGroup(e.target.value)}
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
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">আবাসিক অবস্থা</label>
                  <select
                    value={editResidentialStatus}
                    onChange={(e) => setEditResidentialStatus(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="NON_RESIDENTIAL">অনাবাসিক</option>
                    <option value="RESIDENTIAL">আবাসিক</option>
                    <option value="DAY_CARE">ডে-কেয়ার (খাদ্য বিলমুক্ত)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">প্রোফাইল অবস্থা</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ACTIVE">ACTIVE (সক্রিয়)</option>
                    <option value="INACTIVE">INACTIVE (নিষ্ক্রিয়)</option>
                    <option value="SUSPENDED">SUSPENDED (বহিষ্কৃত)</option>
                    <option value="TRANSFERRED">TRANSFERRED (ছাড়পত্রপ্রাপ্ত)</option>
                    <option value="COMPLETED">COMPLETED (শিক্ষা সম্পন্ন)</option>
                    <option value="WITHDRAWN">WITHDRAWN (প্রত্যাহারকৃত)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বর্তমান ঠিকানা</label>
                  <textarea
                    rows={2}
                    value={editPresentAddress}
                    onChange={(e) => setEditPresentAddress(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">স্থায়ী ঠিকানা</label>
                  <textarea
                    rows={2}
                    value={editPermanentAddress}
                    onChange={(e) => setEditPermanentAddress(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingPersonal}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingPersonal ? "সংরক্ষণ হচ্ছে..." : "হালনাগাদ সংরক্ষণ করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: FAMILY & GUARDIANS */}
        {activeTab === "FAMILY" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-800">সংযুক্ত অভিভাবকবৃন্দ (Guardians)</h3>
                <p className="text-xs text-slate-500">
                  একজন শিক্ষার্থীর একাধিক অভিভাবক থাকতে পারে; যেকোনো একজন প্রাথমিক অভিভাবক হিসেবে নির্ধারিত হন।
                </p>
              </div>
              <button
                onClick={() => setShowGuardianModal(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>নতুন অভিভাবক যুক্ত করুন</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.guardianLinks?.map((gl: any) => (
                <div
                  key={gl.id}
                  className={`bg-white rounded-xl border p-4 space-y-3 ${
                    gl.isPrimary ? "border-emerald-500 ring-1 ring-emerald-500/30" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{gl.guardian.fullNameBn}</h4>
                        {gl.isPrimary && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                            প্রাথমিক অভিভাবক
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">সম্পর্ক: {gl.guardian.relation || "অভিভাবক"}</p>
                    </div>
                    <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {gl.guardian.phone}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    {gl.guardian.occupation && <p>পেশা: {gl.guardian.occupation}</p>}
                    {gl.guardian.address && <p>ঠিকানা: {gl.guardian.address}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ACADEMIC HISTORY & ROLLS */}
        {activeTab === "ACADEMIC" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-800">শিক্ষাবর্ষ ও জামাত অন্তর্ভুক্তি ইতিহাস</h3>
                <p className="text-xs text-slate-500">
                  পূর্ববর্তী সকল সেশন, জামাত, শাখা ও রোল নম্বর সংরক্ষিত থাকে (কোনো ঐতিহাসিক তথ্য মুছে ফেলা হয় না)।
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">শিক্ষাবর্ষ (সেশন)</th>
                    <th className="py-3 px-4">জামাত / শ্রেণি</th>
                    <th className="py-3 px-4">শাখা</th>
                    <th className="py-3 px-4">রোল নম্বর</th>
                    <th className="py-3 px-4">ভর্তির তারিখ</th>
                    <th className="py-3 px-4">অবস্থা</th>
                    <th className="py-3 px-4 text-center">রোল সমন্বয়</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.enrollments?.map((enr: any) => (
                    <tr key={enr.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{enr.session?.name}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-800">{enr.jamatClass?.nameBn}</td>
                      <td className="py-3 px-4 text-slate-600">{enr.section?.nameBn || "সাধারণ"}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded">
                          #{enr.rollNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {new Date(enr.enrolledAt).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="py-3 px-4">
                        {enr.status === "ACTIVE" ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">
                            চলতি
                          </span>
                        ) : enr.status === "PROMOTED" ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            প্রমোটেড
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                            {enr.status}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setTargetEnrollmentId(enr.id);
                            setNewRollNumber(String(enr.rollNumber));
                            setShowRollModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded text-xs font-medium border"
                        >
                          রোল পরিবর্তন
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DOCUMENTS */}
        {activeTab === "DOCUMENTS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-800">শিক্ষার্থী ডকুমেন্টস ও নথিপত্র</h3>
                <p className="text-xs text-slate-500">
                  জন্ম নিবন্ধন সনদ, ছবি, পূর্ববর্তী মাদরাসা/স্কুলের প্রশংসাপত্র ও জাতীয় পরিচয়পত্র।
                </p>
              </div>
              <button
                onClick={() => setShowDocModal(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>নতুন ডকুমেন্ট যুক্ত করুন</span>
              </button>
            </div>

            {student.documents?.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">এখনো কোনো ডকুমেন্ট যুক্ত করা হয়নি।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {student.documents?.map((doc: any) => (
                  <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1">
                          {doc.documentType}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{doc.fileName}</h4>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                        {doc.verificationStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      সংযুক্তির তারিখ: {new Date(doc.createdAt).toLocaleDateString("bn-BD")}
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
                    >
                      ডকুমেন্ট দেখুন
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: AUDIT TRAIL */}
        {activeTab === "AUDIT" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>নিরাপত্তা ও পরিবর্তন অডিট ট্রেইল (Audit Trail)</span>
              </h3>
              <p className="text-xs text-slate-500">
                শিক্ষার্থী প্রোফাইল সংক্রান্ত প্রতিটি সংযোজন, রোল পরিবর্তন, স্ট্যাটাস পরিবর্তন অপরিবর্তনযোগ্যভাবে রেকর্ড করা থাকে।
              </p>
            </div>

            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">এখনো কোনো অডিট রেকর্ড পাওয়া যায়নি।</p>
              ) : (
                auditLogs.map((log: any) => {
                  let details: any = {};
                  try {
                    details = JSON.parse(log.detailsJson || "{}");
                  } catch {}
                  return (
                    <div
                      key={log.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 uppercase">{log.action}</span>
                          <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                            {log.entityType}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">
                          ব্যবহারকারী: <span className="font-semibold text-slate-800">{log.user?.name || "সিস্টেম অ্যাডমিন"}</span>
                        </p>
                        {log.action === "ROLL_CHANGE" && (
                          <p className="text-emerald-800 font-medium mt-0.5">
                            রোল সমন্বয়: #{details.oldRoll} ➔ #{details.newRoll}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("bn-BD")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* ROLL ADJUSTMENT MODAL */}
      {showRollModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-emerald-600" />
                <span>রোল নম্বর পরিবর্তন ও সমন্বয়</span>
              </h3>
              <button onClick={() => setShowRollModal(false)} className="text-slate-400">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdjustRoll} className="space-y-3 text-xs">
              <p className="text-slate-500">
                সতর্কতা: রোল পরিবর্তন করার পর স্বয়ংক্রিয়ভাবে প্রাতিষ্ঠানিক অডিট লগে রেকর্ড যুক্ত হবে।
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">নতুন রোল নম্বর *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newRollNumber}
                  onChange={(e) => setNewRollNumber(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-base"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRollModal(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingRoll}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold"
                >
                  {submittingRoll ? "হালনাগাদ হচ্ছে..." : "রোল নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DOCUMENT MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-emerald-600" />
                <span>নতুন ডকুমেন্ট সংযুক্তি</span>
              </h3>
              <button onClick={() => setShowDocModal(false)} className="text-slate-400">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddDocument} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ডকুমেন্টের ধরণ *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="BIRTH_CERTIFICATE">জন্ম নিবন্ধন সনদ (Birth Certificate)</option>
                  <option value="NID">জাতীয় পরিচয়পত্র (NID)</option>
                  <option value="PHOTO">শিক্ষার্থীর ছবি (Photo)</option>
                  <option value="PREVIOUS_CERTIFICATE">পূর্ববর্তী মাদরাসা সনদ (Certificate)</option>
                  <option value="PREVIOUS_MARKSHEET">নম্বরপত্র (Marksheet)</option>
                  <option value="GUARDIAN_DOCUMENT">অভিভাবকের পরিচয়পত্র</option>
                  <option value="OTHER">অন্যান্য নথি</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ফাইলের নাম / শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমনঃ জন্ম_নিবন্ধন_সনদ.pdf"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ফাইলের লিংক / পাথ *</label>
                <input
                  type="text"
                  required
                  placeholder="/uploads/docs/student-001.pdf"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingDoc}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold"
                >
                  {submittingDoc ? "সংরক্ষণ হচ্ছে..." : "ডকুমেন্ট যুক্ত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD GUARDIAN MODAL */}
      {showGuardianModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>নতুন অভিভাবক সংযুক্ত করুন</span>
              </h3>
              <button onClick={() => setShowGuardianModal(false)} className="text-slate-400">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddGuardian} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">অভিভাবকের নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  placeholder="অভিভাবকের নাম"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    placeholder="018..."
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">সম্পর্ক</label>
                  <select
                    value={guardianRelation}
                    onChange={(e) => setGuardianRelation(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="FATHER">পিতা</option>
                    <option value="MOTHER">মাতা</option>
                    <option value="BROTHER">ভাই</option>
                    <option value="UNCLE">চাচা / মামা</option>
                    <option value="OTHER">অন্যান্য</option>
                  </select>
                </div>
              </div>
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guardianIsPrimary}
                    onChange={(e) => setGuardianIsPrimary(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-700">
                    এই অভিভাবককে প্রাথমিক অভিভাবক (Primary Guardian) হিসেবে নির্ধারণ করুন
                  </span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGuardianModal(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingGuardian}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold"
                >
                  {submittingGuardian ? "সংযুক্ত হচ্ছে..." : "সংযুক্ত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
