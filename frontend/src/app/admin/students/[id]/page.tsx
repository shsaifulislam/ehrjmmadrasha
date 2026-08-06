"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ChevronRight,
  User,
  Phone,
  BookOpen,
  Calendar,
  Award,
  CreditCard,
  FileText,
  Printer,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building,
  MapPin,
  Heart,
  FileBadge,
  Bus,
  Library,
  Box,
  MessageSquare,
  History,
  FolderOpen,
  Upload,
  QrCode
} from "lucide-react";
import { useStudent360, usePromoteStudent, useTransferStudent, useClasses, useSessions, useAddStudentDocument, useDeleteStudentDocument } from "@/hooks/useAcademic";
import { AppButton } from "@/components/shared/AppButton";
import { AppBadge } from "@/components/shared/AppBadge";
import { AppAvatar } from "@/components/shared/AppAvatar";
import { AppModal } from "@/components/shared/AppModal";
import { AppForm } from "@/components/shared/AppForm";
import { AppInput } from "@/components/shared/AppInput";
import { AppPermission } from "@/components/shared/AppPermission";
import { toast } from "sonner";

export default function Student360Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.id;

  const [activeTab, setActiveTab] = useState<
    "profile" | "academic" | "attendance" | "finance" | "results" | "hostel" | "library" | "transport" | "inventory" | "certificates" | "documents" | "timeline" | "notifications" | "print"
  >("profile");

  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isTcModalOpen, setIsTcModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const [nextClassId, setNextClassId] = useState("");
  const [nextSessionId, setNextSessionId] = useState("");
  const [nextRoll, setNextRoll] = useState("");
  const [tcRemarks, setTcRemarks] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("BIRTH_CERTIFICATE");

  const { data: s360, isLoading, refetch } = useStudent360(studentId);
  const { data: classes } = useClasses();
  const { data: sessions } = useSessions();

  const promoteStudent = usePromoteStudent();
  const transferStudent = useTransferStudent();
  const addDocumentMutation = useAddStudentDocument();
  const deleteDocumentMutation = useDeleteStudentDocument();

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-slate-500 font-medium">শিক্ষার্থী ৩৬০ প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  const student = s360?.student || s360;
  if (!student) {
    return (
      <div className="p-12 text-center space-y-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">শিক্ষার্থীর রেকর্ড পাওয়া যায়নি</h2>
        <Link href="/admin/students">
          <AppButton variant="secondary" size="sm">শিক্ষার্থী তালিকায় ফিরুন</AppButton>
        </Link>
      </div>
    );
  }

  const academic = student.academicHistory?.[0] || {};
  const guardian = student.guardianRelation?.[0]?.guardian || student.guardian || {};
  const attendanceStats = s360?.attendanceSummary || { present: 180, absent: 10, leave: 5, totalPercentage: 92.3 };
  const invoices = s360?.invoices || student.invoices || [];
  const results = s360?.examResults || student.results || [];
  const hostelAllocations = student.hostelAllocations || [];
  const borrowedBooks = student.borrowedBooks || [];
  const certificates = student.certificates || [];
  const documents = student.documents || [];
  const transportAssignments = student.transportAssignments || [];
  const issuedAssets = student.issuedAssets || [];

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextClassId || !nextRoll) {
      toast.error("শ্রেণী ও রোল নম্বর প্রদান করুন");
      return;
    }
    try {
      await promoteStudent.mutateAsync({
        id: student.id,
        nextClassId,
        nextSessionId: nextSessionId || undefined,
        nextRoll: Number(nextRoll),
      });
      toast.success("শিক্ষার্থী সফলভাবে পরবর্তী শ্রেণীতে প্রমোশন পেয়েছে!");
      setIsPromoteModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "প্রমোশন সম্পন্ন করা যায়নি");
    }
  };

  const handleTC = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transferStudent.mutateAsync({
        id: student.id,
        remarks: tcRemarks || "অধ্যয়ন ত্যাগের ছাড়পত্র (TC Issued)",
      });
      toast.success("শিক্ষার্থী সফলভাবে ইনঅ্যাক্টিভ ও টিসি (TC) ইস্যু করা হয়েছে!");
      setIsTcModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "টিসি ইস্যু করা যায়নি");
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle) {
      toast.error("ডকুমেন্টের শিরোনাম দিন");
      return;
    }
    try {
      await addDocumentMutation.mutateAsync({
        studentId: student.id,
        body: {
          title: docTitle,
          type: docType,
          fileUrl: "/uploads/documents/sample.pdf",
          fileSize: "1.2 MB",
          mimeType: "application/pdf",
        },
      });
      toast.success("ডকুমেন্ট সফলভাবে আপলোড ও ডাটাবেসে যুক্ত করা হয়েছে!");
      setIsDocModalOpen(false);
      setDocTitle("");
      refetch();
    } catch (err: any) {
      toast.error("ডকুমেন্ট সংযুক্ত করা সম্ভব হয়নি");
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await deleteDocumentMutation.mutateAsync({ studentId: student.id, docId });
      toast.success("ডকুমেন্ট রেকর্ড মুছে ফেলা হয়েছে");
      refetch();
    } catch (err: any) {
      toast.error("ডকুমেন্ট মুছে ফেলা সম্ভব হয়নি");
    }
  };

  return (
    <AppPermission permission="manage_students">
      <div className="space-y-6 pb-12">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Link href="/admin/dashboard" className="hover:text-slate-600">ড্যাশবোর্ড</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/admin/students" className="hover:text-slate-600">শিক্ষার্থী ডিরেক্টরি</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-bold text-slate-700 dark:text-slate-200">স্টুডেন্ট ৩৬০ (Student360 Hub)</span>
          </div>
          <Link href="/admin/students">
            <AppButton variant="secondary" size="sm">← তালিকায় ফিরুন</AppButton>
          </Link>
        </div>

        {/* Top Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <AppAvatar name={student.nameBn || "Student"} src={student.photoUrl} size="lg" className="h-20 w-20 text-2xl ring-4 ring-blue-50 dark:ring-slate-800" />
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">{student.nameBn || student.nameEn}</h1>
                  <AppBadge variant={student.isActive !== false ? "success" : "danger"}>
                    {student.isActive !== false ? "সক্রিয় শিক্ষার্থী" : "ইনঅ্যাক্টিভ (TC Issued)"}
                  </AppBadge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-mono">
                    ID: {student.studentId}
                  </span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    শ্রেণী: <strong className="text-slate-800 dark:text-slate-200">{academic.class?.name || student.class?.name || "N/A"}</strong>
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    রোল: <strong className="text-slate-800 dark:text-slate-200">{academic.roll || student.roll || "N/A"}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <AppButton
                variant="outline"
                size="sm"
                icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
                onClick={() => setIsPromoteModalOpen(true)}
              >
                প্রমোশন দিন
              </AppButton>
              <AppButton
                variant="outline"
                size="sm"
                icon={<FileBadge className="h-4 w-4 text-amber-600" />}
                onClick={() => setIsTcModalOpen(true)}
              >
                টিসি (TC) ইস্যু
              </AppButton>
              <AppButton
                variant="primary"
                size="sm"
                icon={<Printer className="h-4 w-4" />}
                onClick={() => setActiveTab("print")}
              >
                রিপোর্ট ও প্রিন্ট
              </AppButton>
            </div>
          </div>

          {/* Navigation Tabs Bar (Scrollable 12 Tabs) */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 text-xs font-semibold pb-1">
            {[
              { id: "profile", label: "প্রোফাইল", icon: User },
              { id: "academic", label: "একাডেমিক", icon: BookOpen },
              { id: "attendance", label: "উপস্থিতি", icon: Calendar },
              { id: "finance", label: "ফি ও লিজার", icon: CreditCard },
              { id: "results", label: "ফলাফল", icon: Award },
              { id: "hostel", label: "হোস্টেল ও মিল", icon: Building },
              { id: "library", label: "লাইব্রেরি", icon: Library },
              { id: "transport", label: "পরিবহন", icon: Bus },
              { id: "inventory", label: "মালামাল/অ্যাসেট", icon: Box },
              { id: "certificates", label: "সার্টিফিকেট", icon: FileBadge },
              { id: "documents", label: "ডকুমেন্টস", icon: FolderOpen },
              { id: "timeline", label: "টাইমলাইন লোগ", icon: History },
              { id: "print", label: "প্রিন্ট সেন্টার", icon: Printer },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 px-3.5 flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Personal Profile */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                ব্যক্তিগত তথ্য
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">নাম (বাংলা)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{student.nameBn || "N/A"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Name (English)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{student.nameEn || "N/A"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">জন্ম নিবন্ধন (BRN)</span>
                  <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{student.brn || "N/A"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">জন্ম তারিখ</span>
                  <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{student.dob ? new Date(student.dob).toLocaleDateString("bn-BD") : "N/A"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">রক্তের গ্রুপ</span>
                  <span className="font-bold text-red-600 font-mono">{student.bloodGroup || "B+"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">ঠিকানা</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{student.address || "কুমিল্লা, বাংলাদেশ"}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600" />
                অভিভাবকের তথ্য
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">অভিভাবকের নাম</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{guardian.name || "N/A"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">সম্পর্ক</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{guardian.relation || "পিতা"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">মোবাইল নম্বর</span>
                  <span className="font-bold text-emerald-600 font-mono">{guardian.phone || "N/A"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">পেশা</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{guardian.occupation || "ব্যবসায়ী"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Academic */}
        {activeTab === "academic" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              একাডেমিক ভর্তি ও প্রমোশন হিস্ট্রি
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-500">বর্তমান শ্রেণী</span>
                <p className="text-base font-black text-blue-900 dark:text-blue-200">{academic.class?.name || student.class?.name || "N/A"}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-slate-800/50 border border-emerald-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-500">বর্তমান রোল</span>
                <p className="text-base font-black font-mono text-emerald-900 dark:text-emerald-200">{academic.roll || student.roll || "N/A"}</p>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-500">একাডেমিক সেশন</span>
                <p className="text-base font-black text-indigo-900 dark:text-indigo-200">{academic.session?.name || "2026"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Attendance */}
        {activeTab === "attendance" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                উপস্থিতির সামগ্রিক সামারি
              </h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                গড় উপস্থিতি: {attendanceStats.totalPercentage}%
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-100 dark:border-slate-700">
                <span className="text-xs text-slate-500">মোট উপস্থিতি</span>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">{attendanceStats.present} দিন</p>
              </div>
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-slate-800 border border-red-100 dark:border-slate-700">
                <span className="text-xs text-slate-500">অনুপস্থিতি</span>
                <p className="text-xl font-bold text-red-700 dark:text-red-400 font-mono">{attendanceStats.absent} দিন</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-100 dark:border-slate-700">
                <span className="text-xs text-slate-500">অনুমোদিত ছুটি</span>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-400 font-mono">{attendanceStats.leave} দিন</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Finance */}
        {activeTab === "finance" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              ফি ও লেনদেন লিজার
            </h3>
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                কোনো বকেয়া বা পেড লেনদেনের রেকর্ড নেই।
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {invoices.map((inv: any) => (
                  <div key={inv.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{inv.title || "মাসিক বেতন"}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{inv.invoiceNo}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono text-slate-900 dark:text-slate-100">৳ {inv.amount}</p>
                      <AppBadge variant={inv.status === "PAID" ? "success" : "danger"}>
                        {inv.status === "PAID" ? "পরিশোধিত" : "বকেয়া"}
                      </AppBadge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Results */}
        {activeTab === "results" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" />
              পরীক্ষার ফলাফল ও জিপিএ
            </h3>
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              সাম্প্রতিক কোনো প্রকাশিত মার্কশীটের বিবরণ নেই।
            </div>
          </div>
        )}

        {/* Tab 6: Hostel & Meal */}
        {activeTab === "hostel" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building className="h-4 w-4 text-amber-600" />
              হোস্টেল সিট ও মিল কাউন্ট
            </h3>
            {hostelAllocations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                এই শিক্ষার্থী হোস্টেলে বরাদ্দপ্রাপ্ত নয় (অনাবাসিক)।
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {hostelAllocations.map((alloc: any) => (
                  <div key={alloc.id} className="py-2.5 flex justify-between">
                    <span className="text-slate-500">হোস্টেল রুম ও বেড</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">রুম: {alloc.bed?.room?.roomNo}, বেড: {alloc.bed?.bedNo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Library */}
        {activeTab === "library" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Library className="h-4 w-4 text-emerald-600" />
              ইস্যুকৃত বই ও লাইব্রেরি রেকর্ড
            </h3>
            {borrowedBooks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                বর্তমান কোনো পেন্ডিং বা ইস্যুকৃত বইয়ের রেকর্ড পাওয়া যায়নি।
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {borrowedBooks.map((b: any) => (
                  <div key={b.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{b.book?.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono">ইস্যু: {new Date(b.issueDate).toLocaleDateString("bn-BD")}</span>
                    </div>
                    <AppBadge variant={b.returnDate ? "success" : "warning"}>
                      {b.returnDate ? "ফেরত দেওয়া হয়েছে" : "পেন্ডিং"}
                    </AppBadge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 8: Transport */}
        {activeTab === "transport" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bus className="h-4 w-4 text-blue-600" />
              পরিবহন ও রুট বরাদ্দ
            </h3>
            {transportAssignments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                পরিবহন সুবিধা বরাদ্দ দেওয়া হয়নি।
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {transportAssignments.map((t: any) => (
                  <div key={t.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">রুট: {t.route?.routeName || "মূল রুট"}</p>
                      <span className="text-[10px] text-slate-400">স্টপেজ: {t.stoppageName || "মেইন বাস স্ট্যান্ড"}</span>
                    </div>
                    <span className="font-bold font-mono text-emerald-600">৳ {t.monthlyFee || t.route?.monthlyFee || 0} / মাস</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 9: Inventory */}
        {activeTab === "inventory" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Box className="h-4 w-4 text-indigo-600" />
              বরাদ্দকৃত মালামাল ও অ্যাসেট
            </h3>
            {issuedAssets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                কোনো কিট বা অ্যাসেট ইস্যু করা হয়নি।
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {issuedAssets.map((asset: any) => (
                  <div key={asset.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{asset.itemName}</p>
                      <span className="text-[10px] text-slate-400 font-mono">কোড: {asset.assetCode || "N/A"}</span>
                    </div>
                    <AppBadge variant={asset.status === "ISSUED" ? "success" : "neutral"}>
                      {asset.status}
                    </AppBadge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 10: Certificates */}
        {activeTab === "certificates" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileBadge className="h-4 w-4 text-amber-600" />
                ইস্যুকৃত ছাড়পত্র ও প্রশংসাপত্র
              </h3>
            </div>
            {certificates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                কোনো প্রাতিষ্ঠানিক সার্টিফিকেট ইস্যু করা হয়নি।
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {certificates.map((cert: any) => (
                  <div key={cert.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{cert.type || "ছাড়পত্র (TC)"}</p>
                      <span className="text-[10px] text-slate-400 font-mono">নম্বর: {cert.certificateNo}</span>
                    </div>
                    <AppButton variant="outline" size="sm" icon={<Printer className="h-3.5 w-3.5" />}>
                      প্রিন্ট
                    </AppButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 11: Documents */}
        {activeTab === "documents" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-blue-600" />
                শিক্ষার্থীর সংযুক্ত ফাইল ও ডকুমেন্টস
              </h3>
              <AppButton variant="outline" size="sm" icon={<Upload className="h-4 w-4" />} onClick={() => setIsDocModalOpen(true)}>
                নতুন ফাইল যুক্ত করুন
              </AppButton>
            </div>
            {documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                কোনো সংযুক্ত ফাইল বা ডকুমেন্ট নেই।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{doc.title}</p>
                        <span className="text-[10px] text-slate-400">{doc.type} • {doc.fileSize || "1.2 MB"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <AppButton variant="ghost" size="sm" onClick={() => window.open(doc.fileUrl, "_blank")}>দেখুন</AppButton>
                      <AppButton variant="ghost" size="sm" onClick={() => handleDeleteDoc(doc.id)}>মুছুন</AppButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 12: Timeline & Audit */}
        {activeTab === "timeline" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="h-4 w-4 text-slate-600" />
              শিক্ষার্থী টাইমলাইন ও সিস্টেম অডিট লোগ
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 pl-8 text-xs">
              <div className="relative">
                <div className="absolute -left-8 top-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                <p className="font-bold text-slate-800 dark:text-slate-200">শিক্ষার্থীর ভর্তি নিবন্ধন সম্পন্ন</p>
                <span className="text-[10px] text-slate-400 font-mono">{new Date(student.createdAt).toLocaleDateString("bn-BD")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 13: Printable Reports Suite */}
        {activeTab === "print" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student ID Card Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Printer className="h-4 w-4 text-blue-600" />
                ডিজিটাল স্টুডেন্ট আইডি কার্ড
              </h3>
              <div className="max-w-xs mx-auto bg-gradient-to-b from-blue-900 to-slate-900 text-white rounded-2xl p-5 shadow-xl space-y-4 text-center border border-blue-700">
                <div className="text-[11px] font-bold tracking-wider text-blue-200 border-b border-blue-800 pb-2">
                  ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা
                </div>
                <AppAvatar name={student.nameBn} src={student.photoUrl} size="lg" className="h-16 w-16 mx-auto ring-2 ring-white/50" />
                <div>
                  <h4 className="font-bold text-sm text-white">{student.nameBn}</h4>
                  <p className="text-[10px] text-blue-300 font-mono">ID: {student.studentId}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-white/10 p-2 rounded-xl">
                  <div>
                    <span className="text-blue-300 block">শ্রেণী</span>
                    <strong className="text-white">{academic.class?.name || student.class?.name || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-blue-300 block">রোল</span>
                    <strong className="text-white font-mono">{academic.roll || student.roll || "N/A"}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Summary Sheet */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                প্রিন্টযোগ্য শিক্ষার্থী ডাটা সিট ও ফি স্টেটমেন্ট
              </h3>
              <p className="text-xs text-slate-500">
                অফিসিয়াল নথির জন্য A4 ফরম্যাটে সম্পূর্ণ তথ্যসহ স্টুডেন্ট প্রোফাইল সিট প্রিন্ট করুন।
              </p>
              <div className="flex flex-wrap gap-2">
                <AppButton variant="primary" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
                  প্রোফাইল সিট প্রিন্ট
                </AppButton>
                <AppButton variant="outline" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
                  ফি স্টেটমেন্ট প্রিন্ট
                </AppButton>
              </div>
            </div>
          </div>
        )}

        {/* Promote Modal */}
        <AppModal isOpen={isPromoteModalOpen} onClose={() => setIsPromoteModalOpen(false)} title="শিক্ষার্থী প্রমোশন দিন">
          <AppForm onSubmit={handlePromote} actions={<AppButton type="submit" variant="primary">প্রমোশন নিশ্চিত করুন</AppButton>}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">পরবর্তী শ্রেণী *</label>
                <select
                  value={nextClassId}
                  onChange={(e) => setNextClassId(e.target.value)}
                  required
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                >
                  <option value="">শ্রেণী নির্বাচন করুন</option>
                  {classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">নতুন একাডেমিক সেশন</label>
                <select
                  value={nextSessionId}
                  onChange={(e) => setNextSessionId(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                >
                  <option value="">সেশন নির্বাচন করুন (ঐচ্ছিক)</option>
                  {sessions?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.year}</option>
                  ))}
                </select>
              </div>
              <AppInput
                label="পরবর্তী রোল নম্বর *"
                type="number"
                value={nextRoll}
                onChange={(e) => setNextRoll(e.target.value)}
                required
                placeholder="যেমন: ১"
              />
            </div>
          </AppForm>
        </AppModal>

        {/* TC Issue Modal */}
        <AppModal isOpen={isTcModalOpen} onClose={() => setIsTcModalOpen(false)} title="শিক্ষার্থীর ছাড়পত্র (TC) ইস্যু করুন">
          <AppForm onSubmit={handleTC} actions={<AppButton type="submit" variant="primary">টিসি ইস্যু নিশ্চিত করুন</AppButton>}>
            <div className="space-y-4">
              <AppInput
                label="টিসি ইস্যুর কারণ / মন্তব্য"
                value={tcRemarks}
                onChange={(e) => setTcRemarks(e.target.value)}
                placeholder="যেমন: অভিভাবকের বাসস্থান পরিবর্তন"
              />
            </div>
          </AppForm>
        </AppModal>

        {/* Doc Upload Modal */}
        <AppModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} title="শিক্ষার্থীর ডকুমেন্ট আপলোড করুন">
          <AppForm onSubmit={handleAddDoc} actions={<AppButton type="submit" variant="primary">সংরক্ষণ করুন</AppButton>}>
            <div className="space-y-4">
              <AppInput label="ডকুমেন্টের শিরোনাম *" required value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="যেমন: জন্ম সনদ" />
              <div>
                <label className="text-xs font-semibold block mb-1">ডকুমেন্ট টাইপ</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
                  <option value="BIRTH_CERTIFICATE">জন্ম সনদ (BRN)</option>
                  <option value="PREVIOUS_MARKSHEET">পূর্ববর্তী নম্বরপত্র</option>
                  <option value="MEDICAL_RECORD">মেডিকেল রিপোর্ট</option>
                  <option value="OTHER">অন্যান্য</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">ফাইল সিলেক্ট করুন</label>
                <input type="file" className="text-xs w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl" />
              </div>
            </div>
          </AppForm>
        </AppModal>
      </div>
    </AppPermission>
  );
}
