"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Users,
  UserCheck,
  UserPlus,
  GraduationCap,
  DollarSign,
  FileText,
  CreditCard,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Phone,
  BookOpen,
  Calendar,
  Sparkles,
  KeyRound,
  Eye,
  Edit,
  Trash2,
  X,
  Check,
  RefreshCw,
  Award,
  ChevronRight,
  Lock,
  Unlock,
  Building,
  Clock,
  Layers,
  ArrowRight,
  Sliders,
  Archive,
  AlertTriangle,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
import {
  StudentIDCanvas,
  TeacherIDCanvas,
  TransferCertificateCanvas,
  CharacterCertificateCanvas,
  PratyayanCanvas,
  PaymentReceiptCanvas,
  ResultMarksheetCanvas,
  HifzCertificateCanvas,
  DawraCertificateCanvas,
  MishkatCertificateCanvas,
  NooraniCertificateCanvas,
  MeritCertificateCanvas,
  AdmitCardCanvas,
} from "../documents/templates/DocumentCanvases";

interface JamatClassItem {
  id: string;
  nameBn: string;
  nameEn: string;
  code?: string;
}

interface StudentItem {
  id: string;
  studentIdNumber: string;
  fullNameBn: string;
  fullNameEn?: string;
  gender: string; // MALE, FEMALE
  residentialStatus: string;
  isOrphan: boolean;
  fatherNameBn?: string;
  fatherPhone?: string;
  motherNameBn?: string;
  className?: string;
  classId?: string;
  sectionName?: string;
  rollNumber?: number;
  totalDue?: number;
  status: string;
  photoUrl?: string | null;
  dob?: string;
}

interface TeacherStaffItem {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  role: "PRINCIPAL" | "TEACHER" | "STAFF" | string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ARCHIVED" | string;
  createdAt: string;
  employee?: {
    id: string;
    employeeId: string;
    nameBn: string;
    mobile: string;
    baseSalary: number;
    employeeType: string;
    designation?: { nameBn: string } | null;
    department?: { nameBn: string } | null;
  } | null;
  teacherAssignments?: Array<{
    id: string;
    section?: { nameBn: string; jamatClass?: { nameBn: string } } | null;
    subject?: { nameBn: string; jamatClass?: { nameBn: string } } | null;
  }>;
}

export default function AdminUnifiedCommandCenter() {
  // Master Operating Wing
  const [activeWing, setActiveWing] = useState<"STUDENTS" | "STAFF_GMAIL">("STUDENTS");

  // Classes & Students State
  const [classes, setClasses] = useState<JamatClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [selectedGender, setSelectedGender] = useState<"ALL" | "MALE" | "FEMALE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResidential, setSelectedResidential] = useState<string>("ALL");

  // Staff / Teacher / Principal & Gmail Gatekeeper State
  const [staffList, setStaffList] = useState<TeacherStaffItem[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>("ALL");

  // Action Modals State
  const [feeModalTarget, setFeeModalTarget] = useState<StudentItem | null>(null);
  const [idCardModalTarget, setIdCardModalTarget] = useState<StudentItem | null>(null);
  const [certModalTarget, setCertModalTarget] = useState<{
    student: StudentItem;
    certType:
      | "TC"
      | "CHARACTER"
      | "PRATYAYAN"
      | "HIFZ"
      | "DAWRA"
      | "MISHKAT"
      | "NOORANI"
      | "MERIT"
      | "ADMIT"
      | "MARKSHEET"
      | "RECEIPT";
  } | null>(null);
  const [profileModalTarget, setProfileModalTarget] = useState<StudentItem | null>(null);

  // Fee Collection Form
  const [feeType, setFeeType] = useState("MONTHLY_TUITION");
  const [feeAmount, setFeeAmount] = useState("1500");
  const [feeTitle, setFeeTitle] = useState("অক্টোবর ২০২৬ মাসিক বেতন");
  const [feePaymentMethod, setFeePaymentMethod] = useState<"CASH" | "BKASH" | "NAGAD" | "BANK">("CASH");
  const [feeNotes, setFeeNotes] = useState("");
  const [collectingFee, setCollectingFee] = useState(false);
  const [recentReceipt, setRecentReceipt] = useState<any | null>(null);

  // Add Principal / Teacher / Staff Modal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffRole, setNewStaffRole] = useState<"TEACHER" | "PRINCIPAL" | "STAFF">("TEACHER");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffSalary, setNewStaffSalary] = useState("25000");
  const [newStaffClassId, setNewStaffClassId] = useState("");
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [staffActionMsg, setStaffActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit / Password Reset Staff Modal
  const [editingStaffTarget, setEditingStaffTarget] = useState<TeacherStaffItem | null>(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffEmail, setEditStaffEmail] = useState("");
  const [editStaffPhone, setEditStaffPhone] = useState("");
  const [editStaffSalary, setEditStaffSalary] = useState("");
  const [savingStaffEdit, setSavingStaffEdit] = useState(false);

  const [resetPasswordTarget, setResetPasswordTarget] = useState<TeacherStaffItem | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Teacher Smart ID Card Target
  const [teacherIdModalTarget, setTeacherIdModalTarget] = useState<TeacherStaffItem | null>(null);

  // Staff Deletion & Archiving Target
  const [deleteStaffTarget, setDeleteStaffTarget] = useState<TeacherStaffItem | null>(null);
  const [deletingStaff, setDeletingStaff] = useState(false);

  // Staff Roster Printable Modal
  const [showStaffRosterModal, setShowStaffRosterModal] = useState(false);

  // Initial Load: Classes & Students
  const loadClassesAndStudents = async () => {
    setLoadingStudents(true);
    try {
      // 1. Fetch Classes
      const resClasses = await fetch("/api/academic/classes");
      if (resClasses.ok) {
        const clsData = await resClasses.json();
        setClasses(clsData.classes || clsData.jamatClasses || []);
      }

      // 2. Fetch Students
      const resStudents = await fetch("/api/admin/students?take=250");
      if (resStudents.ok) {
        const stdData = await resStudents.json();
        const rawList = stdData.students || [];
        const mappedList: StudentItem[] = rawList.map((s: any) => {
          const currentEnr = s.enrollments?.[0] || {};
          return {
            id: s.id,
            studentIdNumber: s.studentIdNumber,
            fullNameBn: s.fullNameBn,
            fullNameEn: s.fullNameEn || "",
            gender: s.gender || "MALE",
            residentialStatus: s.residentialStatus || "NON_RESIDENTIAL",
            isOrphan: Boolean(s.isOrphan),
            fatherNameBn: s.fatherNameBn || "প্রযোজ্য নয়",
            fatherPhone: s.fatherPhone || s.guardianPhone || "তথ্য নেই",
            motherNameBn: s.motherNameBn || "",
            className: s.className || currentEnr.jamatClass?.nameBn || "সাধারণ",
            classId: s.classId || currentEnr.jamatClass?.id || "",
            sectionName: s.sectionName || currentEnr.section?.nameBn || "",
            rollNumber: s.rollNumber !== undefined ? s.rollNumber : (currentEnr.rollNumber || 1),
            totalDue: s.totalDue || 0,
            status: s.status || "ACTIVE",
            photoUrl: s.photoUrl || null,
            dob: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split("T")[0] : "",
          };
        });
        setStudents(mappedList);
      }
    } catch (e) {
      console.error("Error loading classes and students:", e);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Initial Load: Staff & Teachers
  const loadStaffList = async () => {
    setLoadingStaff(true);
    try {
      const res = await fetch("/api/admin/teachers");
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.teachers || []);
      }
    } catch (e) {
      console.error("Error loading teachers & staff:", e);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    loadClassesAndStudents();
    loadStaffList();
  }, []);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Class Filter
      if (selectedClassId !== "ALL") {
        if (s.classId !== selectedClassId) return false;
      }
      // Gender Filter
      if (selectedGender !== "ALL") {
        if (s.gender !== selectedGender) return false;
      }
      // Residential Status Filter
      if (selectedResidential !== "ALL") {
        if (s.residentialStatus !== selectedResidential) return false;
      }
      // Search Query Filter (Roll Number, Name, Student ID, Phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const rollMatch = String(s.rollNumber || "").includes(q);
        const nameBnMatch = (s.fullNameBn || "").toLowerCase().includes(q);
        const nameEnMatch = (s.fullNameEn || "").toLowerCase().includes(q);
        const idMatch = (s.studentIdNumber || "").toLowerCase().includes(q);
        const phoneMatch = (s.fatherPhone || "").includes(q);
        if (!rollMatch && !nameBnMatch && !nameEnMatch && !idMatch && !phoneMatch) {
          return false;
        }
      }
      return true;
    });
  }, [students, selectedClassId, selectedGender, selectedResidential, searchQuery]);

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return staffList.filter((st) => {
      if (staffRoleFilter !== "ALL") {
        if (st.role !== staffRoleFilter) return false;
      }
      if (staffSearch.trim()) {
        const q = staffSearch.toLowerCase().trim();
        const nameMatch = (st.name || "").toLowerCase().includes(q);
        const emailMatch = (st.email || "").toLowerCase().includes(q);
        const phoneMatch = (st.phone || "").includes(q);
        const empIdMatch = (st.employee?.employeeId || "").toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !phoneMatch && !empIdMatch) return false;
      }
      return true;
    });
  }, [staffList, staffRoleFilter, staffSearch]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = students.length;
    const boys = students.filter((s) => s.gender === "MALE").length;
    const girls = students.filter((s) => s.gender === "FEMALE").length;
    const totalTeachers = staffList.filter((s) => s.role === "TEACHER").length;
    const totalPrincipals = staffList.filter((s) => s.role === "PRINCIPAL").length;
    const totalStaff = staffList.filter((s) => s.role === "STAFF").length;
    const activeGmails = staffList.filter((s) => s.status === "ACTIVE").length;
    const totalPayroll = staffList.reduce((sum, s) => sum + (s.employee?.baseSalary || 0), 0);
    return { total, boys, girls, totalTeachers, totalPrincipals, totalStaff, activeGmails, totalPayroll };
  }, [students, staffList]);

  // Handler: Collect Fee
  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeModalTarget) return;
    setCollectingFee(true);
    try {
      const res = await fetch("/api/admin/finance/collect-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: feeModalTarget.id,
          amount: parseFloat(feeAmount),
          feeType,
          title: feeTitle,
          paymentMethod: feePaymentMethod,
          notes: feeNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "ফি আদায় সম্পন্ন করতে ব্যর্থ হয়েছে।");
      } else {
        setRecentReceipt(data.receipt);
        // Refresh students list
        loadClassesAndStudents();
      }
    } catch (err: any) {
      alert("নেটওয়ার্ক ত্রুটি: ফি আদায় করা সম্ভব হয়নি।");
    } finally {
      setCollectingFee(false);
    }
  };

  // Handler: Add New Staff / Teacher / Principal
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStaff(true);
    setStaffActionMsg(null);
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          phone: newStaffPhone,
          password: newStaffPassword,
          role: newStaffRole,
          baseSalary: parseFloat(newStaffSalary) || 0,
          initialClassId: newStaffClassId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStaffActionMsg({ type: "error", text: data.error || "যোগ করতে ব্যর্থ হয়েছে।" });
      } else {
        setStaffActionMsg({
          type: "success",
          text: `সফল! ${newStaffName} (${newStaffEmail})-কে সিস্টেমে অনুমোদিত কর্মকর্তা হিসেবে যুক্ত করা হয়েছে।`,
        });
        setNewStaffName("");
        setNewStaffEmail("");
        setNewStaffPhone("");
        setNewStaffPassword("");
        loadStaffList();
        setTimeout(() => setShowAddStaffModal(false), 1500);
      }
    } catch (err: any) {
      setStaffActionMsg({ type: "error", text: "সার্ভার এরর: তথ্য সংরক্ষণ করা যায়নি।" });
    } finally {
      setSubmittingStaff(false);
    }
  };

  // Handler: Toggle Access Lock (Activate / Suspend Gmail)
  const handleToggleAccessLock = async (staff: TeacherStaffItem) => {
    const nextStatus = staff.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmPrompt =
      nextStatus === "SUSPENDED"
        ? `আপনি কি নিশ্চিত যে ${staff.name}-এর জিমেইল (${staff.email})-এর প্রবেশাধিকার লক (স্থগিত) করবেন? লক করলে তিনি শিক্ষক প্যানেলে প্রবেশ করতে পারবেন না।`
        : `আপনি কি ${staff.name}-এর জিমেইল (${staff.email})-এর প্রবেশাধিকার পুনরায় সক্রিয় করতে চান?`;

    if (!window.confirm(confirmPrompt)) return;

    try {
      const res = await fetch(`/api/admin/teachers/${staff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।");
      } else {
        loadStaffList();
      }
    } catch (err) {
      alert("সার্ভার ত্রুটি: অ্যাক্সেস আপডেট করা যায়নি।");
    }
  };

  // Handler: Reset Staff Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordTarget || newPasswordValue.length < 6) {
      alert("পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।");
      return;
    }
    setUpdatingPassword(true);
    try {
      const res = await fetch(`/api/admin/teachers/${resetPasswordTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPasswordValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।");
      } else {
        alert(`সফল! ${resetPasswordTarget.name}-এর নতুন পাসওয়ার্ড কার্যকর করা হয়েছে।`);
        setResetPasswordTarget(null);
        setNewPasswordValue("");
      }
    } catch (err) {
      alert("সার্ভার ত্রুটি: পাসওয়ার্ড পরিবর্তন করা যায়নি।");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Open Edit Staff Modal
  const handleOpenStaffEdit = (staff: TeacherStaffItem) => {
    setEditingStaffTarget(staff);
    setEditStaffName(staff.name);
    setEditStaffEmail(staff.email);
    setEditStaffPhone(staff.phone || "");
    setEditStaffSalary(staff.employee?.baseSalary ? String(staff.employee.baseSalary) : "");
  };

  // Submit Edit Staff
  const handleEditStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffTarget) return;
    setSavingStaffEdit(true);
    try {
      const res = await fetch(`/api/admin/teachers/${editingStaffTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editStaffName,
          email: editStaffEmail,
          phone: editStaffPhone,
          baseSalary: editStaffSalary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "হালনাগাদ করা যায়নি।");
      } else {
        alert(data.message || "কর্মকর্তার তথ্য সফলভাবে সংরক্ষিত হয়েছে।");
        setEditingStaffTarget(null);
        loadStaffList();
      }
    } catch {
      alert("সার্ভারে ত্রুটি হয়েছে।");
    } finally {
      setSavingStaffEdit(false);
    }
  };

  // Handler: Permanent Delete or Archive Staff
  const handleDeleteStaff = async (permanent: boolean) => {
    if (!deleteStaffTarget) return;
    setDeletingStaff(true);
    try {
      const res = await fetch(`/api/admin/teachers/${deleteStaffTarget.id}?permanent=${permanent ? "true" : "false"}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "মুছে ফেলতে ব্যর্থ হয়েছে।");
      } else {
        alert(data.message || (permanent ? "স্থায়ীভাবে সম্পূর্ণ মুছে ফেলা হয়েছে।" : "সফলভাবে আর্কাইভ করা হয়েছে।"));
        setDeleteStaffTarget(null);
        loadStaffList();
      }
    } catch {
      alert("সার্ভারে ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setDeletingStaff(false);
    }
  };

  // Helper to build document object for canvas rendering
  const makeDocData = (student: StudentItem, type: string) => {
    return {
      certificateNumber: `EHRJ-${type}-${student.studentIdNumber.slice(-4)}-2026`,
      verificationCode: `V-${student.studentIdNumber.slice(-6)}`,
      issueDate: new Date().toISOString(),
      qrCodeUrl: `https://ehrjmadrasha.com/verify/${student.studentIdNumber}`,
      parsedSnapshot: {
        student: {
          nameBn: student.fullNameBn,
          nameEn: student.fullNameEn || student.fullNameBn,
          studentId: student.studentIdNumber,
          roll: student.rollNumber || 1,
          dob: student.dob || "2015-01-01",
          fatherNameBn: student.fatherNameBn,
          motherNameBn: student.motherNameBn,
          phone: student.fatherPhone,
          village: "পূর্ব লক্ষ্মীপুর",
          thana: "দাউদকান্দি",
          district: "কুমিল্লা",
        },
        class: {
          name: student.className,
          section: student.sectionName || "ক শাখা",
        },
        session: {
          name: "২০২৫-২০২৬",
        },
        document: {
          transferReason: "অভিভাবকের পারিবারিক বাসস্থান পরিবর্তন ও আবেদনক্রমে",
          conduct: "উত্তম ও প্রশংসনীয়",
        },
      },
    };
  };

  const makeReceiptDoc = (receipt: any) => {
    return {
      certificateNumber: receipt?.receiptNumber || "EHRJ-REC-2026",
      verificationCode: `V-${(receipt?.receiptNumber || "REC").slice(-6)}`,
      issueDate: receipt?.receiptDate || new Date().toISOString(),
      qrCodeUrl: `https://ehrjmadrasha.com/verify/receipt/${receipt?.receiptNumber}`,
      parsedSnapshot: {
        student: {
          nameBn: feeModalTarget?.fullNameBn,
          nameEn: feeModalTarget?.fullNameEn || feeModalTarget?.fullNameBn,
          studentId: feeModalTarget?.studentIdNumber,
          roll: feeModalTarget?.rollNumber || 1,
          fatherNameBn: feeModalTarget?.fatherNameBn,
        },
        class: {
          name: feeModalTarget?.className,
          section: feeModalTarget?.sectionName || "ক শাখা",
        },
        session: {
          name: "২০২৫-২০২৬",
        },
        receipt: {
          number: receipt?.receiptNumber,
          amount: receipt?.amount,
          paymentMethod: receipt?.paymentMethod === "CASH" ? "নগদ (Cash)" : receipt?.paymentMethod,
          date: receipt?.receiptDate,
        },
        financial: {
          totalPaid: receipt?.amount,
          dueAmount: 0,
        },
      },
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & METRICS BAR */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0D5C3A] to-emerald-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-emerald-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-400 text-emerald-950 text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-emerald-950" />
                অ্যাডমিন সুপার ড্যাশবোর্ড ৩.০
              </span>
              <span className="bg-white/15 text-emerald-200 text-xs px-3 py-0.5 rounded-full font-bold">
                স্থাপিত: ২০২১ ইং • কোনো EIIN নেই
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{INSTITUTION_INFO.nameBn}</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
              সেন্ট্রালাইজড কমান্ড হাব: শ্রেণীভিত্তিক শিক্ষার্থী ব্যবস্থাপনা, ওয়ান-ক্লিক ফি আদায়, আইডি কার্ড, প্রশংসাপত্র,
              ছাড়পত্র (TC), এবং অনুমোদিত জিমেইল গেটকিপার সহ শিক্ষক-প্রধান শিক্ষক পূর্ণাঙ্গ নিয়ন্ত্রণ ব্যবস্থা।
            </p>
          </div>

          {/* Master Wing Selector Toggle */}
          <div className="flex items-center gap-2 bg-emerald-950/60 p-1.5 rounded-2xl border border-emerald-600/50 flex-shrink-0 self-start lg:self-auto">
            <button
              onClick={() => setActiveWing("STUDENTS")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                activeWing === "STUDENTS"
                  ? "bg-amber-400 text-emerald-950 shadow-md scale-102"
                  : "text-emerald-100 hover:bg-white/10"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>শ্রেণী ও শিক্ষার্থী ৩৬০° হাব</span>
              <span className="ml-1 bg-emerald-900/40 text-current text-[11px] px-2 py-0.5 rounded-full font-mono">
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setActiveWing("STAFF_GMAIL")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                activeWing === "STAFF_GMAIL"
                  ? "bg-amber-400 text-emerald-950 shadow-md scale-102"
                  : "text-emerald-100 hover:bg-white/10"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>প্রধান শিক্ষক, উস্তাদ ও Gmail নিয়ন্ত্রণ</span>
              <span className="ml-1 bg-emerald-900/40 text-current text-[11px] px-2 py-0.5 rounded-full font-mono">
                {stats.activeGmails}
              </span>
            </button>
          </div>
        </div>

        {/* Live Counter Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-emerald-800/80">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium">মোট শিক্ষার্থী</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{stats.total} জন</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-medium">👦 ছাত্র (Boys)</div>
            <div className="text-xl font-black text-blue-300 font-mono mt-0.5">{stats.boys} জন</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-pink-200 font-medium">👧 ছাত্রী (Girls)</div>
            <div className="text-xl font-black text-pink-300 font-mono mt-0.5">{stats.girls} জন</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-amber-200 font-medium">প্রধান শিক্ষক ও মুহতামিম</div>
            <div className="text-xl font-black text-amber-300 font-mono mt-0.5">{stats.totalPrincipals} জন</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium">উস্তাদ ও শিক্ষকবৃন্দ</div>
            <div className="text-xl font-black text-emerald-300 font-mono mt-0.5">{stats.totalTeachers} জন</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium">অনুমোদিত অ্যাক্টিভ Gmail</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>{stats.activeGmails} টি</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WING 1: CLASS & STUDENT 360° MASTER HUB */}
      {/* ========================================================================= */}
      {activeWing === "STUDENTS" && (
        <div className="space-y-5">
          {/* A. CLASS SELECTOR (JAMAT TABS) */}
          <div className="bg-white p-4.5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#0D5C3A] flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-800">
                    জামাত ও শ্রেণী নির্বাচন (Select Jamat / Class)
                  </h3>
                  <p className="text-xs text-slate-500">
                    যেকোনো জামাত ক্লিক করলেই সেই জামাতের সকল শিক্ষার্থী স্বয়ংক্রিয়ভাবে তালিকাভুক্ত হবে।
                  </p>
                </div>
              </div>

              {/* Gender Split Filter Toolbar */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedGender("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedGender === "ALL"
                      ? "bg-[#0D5C3A] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  👥 সকল শিক্ষার্থী
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGender("MALE")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedGender === "MALE"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-blue-700"
                  }`}
                >
                  👦 শুধু ছাত্র
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGender("FEMALE")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedGender === "FEMALE"
                      ? "bg-pink-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-pink-700"
                  }`}
                >
                  👧 শুধু ছাত্রী
                </button>
              </div>
            </div>

            {/* Scrollable Pills of All Classes */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedClassId("ALL")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 flex-shrink-0 ${
                  selectedClassId === "ALL"
                    ? "bg-[#0D5C3A] text-white shadow-md ring-2 ring-[#0D5C3A]/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>সকল জামাত ও শ্রেণি</span>
                <span className="bg-black/10 text-current text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {students.length}
                </span>
              </button>

              {classes.map((cls) => {
                const count = students.filter((s) => s.classId === cls.id).length;
                const isSelected = selectedClassId === cls.id;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 flex-shrink-0 ${
                      isSelected
                        ? "bg-[#0D5C3A] text-white shadow-md ring-2 ring-[#0D5C3A]/20"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>{cls.nameBn}</span>
                    <span className="bg-black/10 text-current text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Instant Real-Time Search Bar & Status Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="রোল নম্বর, নাম, ছাত্র আইডি বা মোবাইল নম্বর দিয়ে খুঁজুন (ঐচ্ছিক)..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="sm:col-span-4 flex items-center gap-2">
                <select
                  value={selectedResidential}
                  onChange={(e) => setSelectedResidential(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                >
                  <option value="ALL">সকল আবাসন স্ট্যাটাস</option>
                  <option value="RESIDENTIAL">আবাসিক</option>
                  <option value="NON_RESIDENTIAL">অনাবাসিক</option>
                  <option value="DAY_CARE">ডে-কেয়ার</option>
                </select>

                <button
                  type="button"
                  onClick={loadClassesAndStudents}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex-shrink-0"
                  title="রিফ্রেশ করুন"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* B. STUDENTS LIST GRID & ONE-CLICK ACTIONS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>
                প্রদর্শিত শিক্ষার্থী:{" "}
                <strong className="text-slate-800 font-bold font-mono">{filteredStudents.length}</strong> জন
                {selectedClassId !== "ALL" && (
                  <span>
                    {" "}
                    (জামাত:{" "}
                    <span className="text-[#0D5C3A] font-bold">
                      {classes.find((c) => c.id === selectedClassId)?.nameBn}
                    </span>
                    )
                  </span>
                )}
              </span>
              <span>প্রতিটি শিক্ষার্থীর কার্ডের একশন বাটন থেকে ফি, আইডি কার্ড ও সনদ দেওয়া যাবে।</span>
            </div>

            {loadingStudents ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
                <div className="w-9 h-9 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs font-bold text-slate-600">শিক্ষার্থী ডেটা লোড হচ্ছে...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">কোনো শিক্ষার্থী পাওয়া যায়নি</h4>
                <p className="text-xs text-slate-500">
                  নির্বাচিত জামাত বা ফিল্টারে কোনো তথ্য মেলেনি। অন্য জামাত সিলেক্ট করুন অথবা ফিল্টার রিসেট করুন।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClassId("ALL");
                    setSelectedGender("ALL");
                    setSearchQuery("");
                  }}
                  className="mt-2 text-xs font-bold text-[#0D5C3A] underline"
                >
                  সকল ফিল্টার রিসেট করুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredStudents.map((std) => {
                  return (
                    <div
                      key={std.id}
                      className="bg-white rounded-2xl p-4.5 border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Student Card Top: Roll & ID */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-100 text-[#0D5C3A] font-mono font-black text-xs px-2.5 py-1 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-1">
                              <span>রোল:</span>
                              <span className="text-sm">{std.rollNumber || 1}</span>
                            </span>
                            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              {std.studentIdNumber}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              std.gender === "MALE"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-pink-50 text-pink-700 border border-pink-200"
                            }`}
                          >
                            {std.gender === "MALE" ? "ছাত্র 👦" : "ছাত্রী 👧"}
                          </span>
                        </div>

                        {/* Student Name & Class */}
                        <div>
                          <h4 className="font-black text-slate-900 text-sm sm:text-base group-hover:text-[#0D5C3A] transition">
                            {std.fullNameBn}
                          </h4>
                          {std.fullNameEn && (
                            <p className="text-xs text-slate-500 font-medium font-serif">{std.fullNameEn}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                            <span className="bg-slate-100 font-bold text-slate-700 px-2 py-0.5 rounded-md">
                              {std.className} {std.sectionName && `(${std.sectionName})`}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-[11px] text-slate-500">
                              {std.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                            </span>
                          </div>
                        </div>

                        {/* Guardian & Financial Info */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-[11px]">পিতা / অভিভাবক:</span>
                            <span className="font-semibold text-slate-800">{std.fatherNameBn}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-[11px]">মোবাইল:</span>
                            <a
                              href={`tel:${std.fatherPhone}`}
                              className="font-mono font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{std.fatherPhone}</span>
                            </a>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-slate-600">
                            <span className="text-[11px]">আর্থিক বকেয়া:</span>
                            {std.totalDue && std.totalDue > 0 ? (
                              <span className="font-bold text-red-600 font-mono">৳ {std.totalDue.toLocaleString()} বকেয়া</span>
                            ) : (
                              <span className="font-bold text-emerald-600 text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> পরিশোধিত
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Direct Student Actions Bar */}
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFeeModalTarget(std);
                            setFeeTitle(`${std.fullNameBn} - অক্টোবর ২০২৬ মাসিক বেতন`);
                            setRecentReceipt(null);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-sm"
                          title="বেতন ও ফি আদায় করুন"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>ফি আদায়</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIdCardModalTarget(std)}
                          className="bg-slate-800 hover:bg-slate-900 text-white py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-sm"
                          title="আইডি কার্ড প্রিন্ট"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>আইডি কার্ড</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCertModalTarget({ student: std, certType: "TC" })}
                          className="bg-amber-500 hover:bg-amber-600 text-white py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-sm"
                          title="সনদ, প্রত্যয়ন ও ছাড়পত্র (পিসি/TC)"
                        >
                          <FileText className="w-3 h-3" />
                          <span>সনদ ও টিসি</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WING 2: PRINCIPAL, TEACHERS & AUTHORIZED GMAIL GATEKEEPER */}
      {/* ========================================================================= */}
      {activeWing === "STAFF_GMAIL" && (
        <div className="space-y-5">
          {/* A. Security & Control Announcement Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center font-bold flex-shrink-0 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <span>অনুমোদিত জিমেইল ও প্রবেশাধিকার নিয়ন্ত্রণ (Authorized Gmail Gatekeeper)</span>
                  <span className="bg-emerald-100 text-[#0D5C3A] text-[10px] px-2 py-0.5 rounded-full font-bold">
                    কঠোর নিরাপত্তা লক
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  এডমিন প্যানেল থেকে যেসকল প্রধান শিক্ষক, শিক্ষক ও স্টাফের জিমেইল অন্তর্ভুক্ত ও <strong>ACTIVE</strong> রাখা হবে,
                  <strong> শুধুমাত্র তারাই সিস্টেমে লগইন করতে পারবে</strong>। অননুমোদিত কোনো জিমেইল সিস্টেমে কাজ করবে না।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddStaffModal(true);
                setStaffActionMsg(null);
              }}
              className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-md self-start md:self-auto flex-shrink-0"
            >
              <UserPlus className="w-4 h-4 text-amber-300" />
              <span>+ নতুন প্রধান শিক্ষক / শিক্ষক যোগ করুন</span>
            </button>
          </div>

          {/* B. Overview Quick Metrics Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500">মোট জনবল</span>
                <div className="text-xl font-black text-slate-900 mt-0.5">{staffList.length} জন</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800">অনুমোদিত সক্রিয়</span>
                <div className="text-xl font-black text-[#0D5C3A] mt-0.5">{stats.activeGmails} জন</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800">লকড / স্থগিত</span>
                <div className="text-xl font-black text-amber-900 mt-0.5">{staffList.length - stats.activeGmails} জন</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-purple-800">মাসিক মোট বেতন বিল</span>
                <div className="text-xl font-black text-purple-900 mt-0.5">৳ {Number(stats.totalPayroll || 0).toLocaleString("bn-BD")}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* C. Filter and Search Bar for Staff */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="নাম, জিমেইল, মোবাইল বা আইডি দিয়ে খুঁজুন..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={staffRoleFilter}
                onChange={(e) => setStaffRoleFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
              >
                <option value="ALL">সকল পদবি ও দায়িত্ব</option>
                <option value="PRINCIPAL">প্রধান শিক্ষক / মুহতামিম / অধ্যক্ষ</option>
                <option value="TEACHER">উস্তাদ ও শিক্ষকবৃন্দ</option>
                <option value="STAFF">হিসাবরক্ষক ও অফিস সহকারী</option>
              </select>
            </div>

            <div className="sm:col-span-4 flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowStaffRosterModal(true)}
                className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                title="সকল শিক্ষক ও স্টাফদের অফিসিয়াল প্রিন্ট রোস্টার"
              >
                <Printer className="w-3.5 h-3.5 text-amber-700" />
                <span>রোস্টার প্রিন্ট</span>
              </button>

              <button
                type="button"
                onClick={loadStaffList}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>রিফ্রেশ</span>
              </button>
            </div>
          </div>

          {/* C. Authorized Staff & Gmail Access Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {loadingStaff ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-600">শিক্ষক ও স্টাফ তালিকা লোড হচ্ছে...</span>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">কোনো শিক্ষক বা স্টাফ পাওয়া যায়নি।</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">কর্মকর্তা / উস্তাদের নাম</th>
                      <th className="py-3 px-4">পদবি ও রোল</th>
                      <th className="py-3 px-4">অনুমোদিত অফিসিয়াল জিমেইল</th>
                      <th className="py-3 px-4">মোবাইল নম্বর</th>
                      <th className="py-3 px-4">প্রবেশাধিকার স্ট্যাটাস</th>
                      <th className="py-3 px-4 text-right">এডমিন অ্যাকশন ও নিরাপত্তা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.map((staff) => {
                      const isLocked = staff.status !== "ACTIVE";
                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0D5C3A] to-emerald-700 text-amber-300 font-black flex items-center justify-center text-xs shadow-sm">
                                {staff.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs sm:text-sm">{staff.name}</div>
                                <div className="font-mono text-[10px] text-slate-500">
                                  {staff.employee?.employeeId || staff.username}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {staff.role === "PRINCIPAL" ? (
                              <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-full text-[11px] border border-amber-300 inline-flex items-center gap-1">
                                🌟 প্রধান শিক্ষক / মুহতামিম
                              </span>
                            ) : staff.role === "STAFF" ? (
                              <span className="bg-purple-100 text-purple-900 font-bold px-2.5 py-1 rounded-full text-[11px] border border-purple-300 inline-flex items-center gap-1">
                                💼 হিসাবরক্ষক / স্টাফ
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-900 font-bold px-2.5 py-1 rounded-full text-[11px] border border-emerald-300 inline-flex items-center gap-1">
                                🎓 উস্তাদ / শিক্ষক
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">✉️</span>
                              <span>{staff.email}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-600">{staff.phone || "তথ্য নেই"}</td>

                          <td className="py-3.5 px-4">
                            {!isLocked ? (
                              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>সক্রিয় (অনুমোদিত)</span>
                              </span>
                            ) : (
                              <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 border border-red-200">
                                <Lock className="w-3 h-3 text-red-600" />
                                <span>লক করা (ব্লকড)</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Profile */}
                              <button
                                type="button"
                                onClick={() => handleOpenStaffEdit(staff)}
                                className="bg-slate-100 hover:bg-[#0D5C3A] hover:text-white text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-slate-200"
                                title="প্রোফাইল ও বেতন সম্পাদনা"
                              >
                                <Edit className="w-3 h-3" />
                                <span className="hidden sm:inline">সম্পাদনা</span>
                              </button>

                              {/* Smart ID Card */}
                              <button
                                type="button"
                                onClick={() => setTeacherIdModalTarget(staff)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                                title="স্মার্ট শিক্ষক আইডি কার্ড (CR80)"
                              >
                                <CreditCard className="w-3 h-3 text-amber-700" />
                                <span className="hidden sm:inline">আইডি কার্ড</span>
                              </button>

                              {/* Toggle Access Lock */}
                              <button
                                type="button"
                                onClick={() => handleToggleAccessLock(staff)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                                  !isLocked
                                    ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                }`}
                                title={!isLocked ? "প্রবেশাধিকার লক করুন" : "প্রবেশাধিকার সক্রিয় করুন"}
                              >
                                {!isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                <span>{!isLocked ? "লক করুন" : "আনলক"}</span>
                              </button>

                              {/* Reset Password */}
                              <button
                                type="button"
                                onClick={() => {
                                  setResetPasswordTarget(staff);
                                  setNewPasswordValue("");
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-slate-200"
                                title="পাসওয়ার্ড পরিবর্তন করুন"
                              >
                                <KeyRound className="w-3 h-3 text-slate-600" />
                                <span>পাসওয়ার্ড</span>
                              </button>

                              {/* Delete Staff / Permanent or Archive */}
                              <button
                                type="button"
                                onClick={() => setDeleteStaffTarget(staff)}
                                className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-rose-200"
                                title="মুছে ফেলুন বা আর্কাইভ করুন"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>মুছুন</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ONE-CLICK FEE COLLECTION & INSTANT MONEY RECEIPT */}
      {/* ========================================================================= */}
      {feeModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-950 to-[#0D5C3A] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-300" />
                  <span>শিক্ষার্থী ফি আদায় ও মানি রিসিট</span>
                </h3>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  {feeModalTarget.fullNameBn} • আইডি: {feeModalTarget.studentIdNumber} • জামাত: {feeModalTarget.className}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFeeModalTarget(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If recent receipt exists, show receipt preview & print action */}
            {recentReceipt ? (
              <div className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#0D5C3A] flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">ফি আদায় সফল হয়েছে!</h4>
                <p className="text-xs text-slate-600">
                  ভাউচার ও রিসিট নম্বর:{" "}
                  <strong className="text-[#0D5C3A] font-mono">{recentReceipt.receiptNumber}</strong>
                </p>

                {/* Print Modal Canvas view */}
                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50 text-left">
                  <PaymentReceiptCanvas doc={makeReceiptDoc(recentReceipt)} />
                </div>

                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>অফিসিয়াল রসিদ প্রিন্ট করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFeeModalTarget(null);
                      setRecentReceipt(null);
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    সম্পন্ন / বন্ধ করুন
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCollectFee} className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ফি-এর ধরন</label>
                    <select
                      value={feeType}
                      onChange={(e) => {
                        setFeeType(e.target.value);
                        if (e.target.value === "MONTHLY_TUITION") setFeeAmount("1500");
                        if (e.target.value === "EXAM_FEE") setFeeAmount("500");
                        if (e.target.value === "ADMISSION_FEE") setFeeAmount("3000");
                        if (e.target.value === "RESIDENTIAL_FEE") setFeeAmount("2500");
                        if (e.target.value === "BOOK_FEE") setFeeAmount("800");
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                    >
                      <option value="MONTHLY_TUITION">মাসিক বেতন (Tuition Fee)</option>
                      <option value="EXAM_FEE">পরীক্ষার ফি (Exam Fee)</option>
                      <option value="ADMISSION_FEE">ভর্তি ও সেশন ফি (Admission Fee)</option>
                      <option value="RESIDENTIAL_FEE">আবাসিক ও খাবার ফি (Residential Fee)</option>
                      <option value="BOOK_FEE">কিতাব ও খাতা ফি (Book Fee)</option>
                      <option value="OTHER">অন্যান্য প্রাতিষ্ঠানিক ফি</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">পরিশোধের পরিমাণ (টাকা ৳)</label>
                    <input
                      type="number"
                      required
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">রসিদের বিবরণ / শিরোনাম</label>
                  <input
                    type="text"
                    required
                    value={feeTitle}
                    onChange={(e) => setFeeTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">পরিশোধের মাধ্যম</label>
                    <select
                      value={feePaymentMethod}
                      onChange={(e) => setFeePaymentMethod(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                    >
                      <option value="CASH">নগদ গ্রহণ (Cash in Hand)</option>
                      <option value="BKASH">বিকাশ (bKash Mobile Money)</option>
                      <option value="NAGAD">নগদ (Nagad)</option>
                      <option value="BANK">ব্যাংক ডিপোজিট (Bank Account)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">অতিরিক্ত নোট (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      value={feeNotes}
                      onChange={(e) => setFeeNotes(e.target.value)}
                      placeholder="মন্তব্য বা ভাউচার রেফারেন্স..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFeeModalTarget(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={collectingFee}
                    className="bg-[#0D5C3A] hover:bg-emerald-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    {collectingFee ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>{collectingFee ? "সংরক্ষণ হচ্ছে..." : "ফি গ্রহণ ও রসিদ তৈরি করুন"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STUDENT ID CARD PRINT PREVIEW */}
      {/* ========================================================================= */}
      {idCardModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-emerald-950 to-[#0D5C3A] text-white p-4.5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-300" />
                  <span>অফিসিয়াল স্টুডেন্ট আইডি কার্ড (CR80 PVC Standard)</span>
                </h3>
                <p className="text-xs text-emerald-200/90">
                  {idCardModalTarget.fullNameBn} • রোল: {idCardModalTarget.rollNumber} • জামাত: {idCardModalTarget.className}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIdCardModalTarget(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <StudentIDCanvas doc={makeDocData(idCardModalTarget, "ID")} />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                স্থাপিত: ২০২১ ইং • কঠোরভাবে কোনো EIIN নেই • ডাইনামিক কিউআর কোড অন্তর্ভুক্ত
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>আইডি কার্ড প্রিন্ট করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIdCardModalTarget(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CERTIFICATES & TC (পিসি সার্টিফিকেট / প্রশংসাপত্র / প্রত্যয়ন) */}
      {/* ========================================================================= */}
      {certModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[95vh]">
            {/* Modal Header & Document Type Switcher */}
            <div className="bg-gradient-to-r from-emerald-950 via-[#0A452B] to-[#0D5C3A] text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-300" />
                  <span>প্রাতিষ্ঠানিক সনদ, ছাড়পত্র ও নম্বরপত্র হাব (EHRJM Official Document Hub)</span>
                </h3>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  শিক্ষার্থী: <strong>{certModalTarget.student.fullNameBn}</strong> • আইডি: <strong className="font-mono text-amber-300">{certModalTarget.student.studentIdNumber}</strong> • জামাত: <strong>{certModalTarget.student.className}</strong>
                </p>
              </div>

              {/* Selector Tabs (Scrollable Bar for All 10 Sonods) */}
              <div className="flex items-center gap-1.5 bg-black/30 p-1.5 rounded-xl overflow-x-auto max-w-full scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setCertModalTarget({ ...certModalTarget, certType: "TC" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    certModalTarget.certType === "TC" ? "bg-amber-400 text-emerald-950 shadow-sm" : "text-white hover:bg-white/10"
                  }`}
                >
                  ছাড়পত্র (TC / পিসি)
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalTarget({ ...certModalTarget, certType: "CHARACTER" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    certModalTarget.certType === "CHARACTER" ? "bg-amber-400 text-emerald-950 shadow-sm" : "text-white hover:bg-white/10"
                  }`}
                >
                  চারিত্রিক প্রশংসাপত্র
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalTarget({ ...certModalTarget, certType: "PRATYAYAN" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    certModalTarget.certType === "PRATYAYAN" ? "bg-amber-400 text-emerald-950 shadow-sm" : "text-white hover:bg-white/10"
                  }`}
                >
                  প্রত্যয়ন পত্র
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalTarget({ ...certModalTarget, certType: "HIFZ" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    certModalTarget.certType === "HIFZ" ? "bg-amber-400 text-emerald-950 shadow-sm" : "text-white hover:bg-white/10"
                  }`}
                >
                  হিফজ সমাপনী সনদ
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalTarget({ ...certModalTarget, certType: "DAWRA" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    certModalTarget.certType === "DAWRA" ? "bg-amber-400 text-emerald-950 shadow-sm" : "text-white hover:bg-white/10"
                  }`}
                >
                  দাওরায়ে হাদীস সনদ
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalTarget({ ...certModalTarget, certType: "MISHKAT" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    certModalTarget.certType === "MISHKAT" ? "bg-amber-400 text-emerald-950 shadow-sm" : "text-white hover:bg-white/10"
                  }`}
                >
                  মেশকাত সমাপনী সনদ
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalTarget({ ...certModalTarget, certType: "NOORANI" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    certModalTarget.certType === "NOORANI" ? "bg-amber-400 text-emerald-950 shadow-sm" : "text-white hover:bg-white/10"
                  }`}
                >
                  নূরানী ও নাযেরা সনদ
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalTarget({ ...certModalTarget, certType: "MERIT" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    certModalTarget.certType === "MERIT" ? "bg-amber-400 text-emerald-950 shadow-sm" : "text-white hover:bg-white/10"
                  }`}
                >
                  মেধাবৃত্তি ও কৃতিত্ব সনদ
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalTarget({ ...certModalTarget, certType: "ADMIT" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    certModalTarget.certType === "ADMIT" ? "bg-amber-400 text-emerald-950 shadow-sm" : "text-white hover:bg-white/10"
                  }`}
                >
                  প্রবেশপত্র (Admit Card)
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalTarget({ ...certModalTarget, certType: "MARKSHEET" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    certModalTarget.certType === "MARKSHEET" ? "bg-amber-400 text-emerald-950 shadow-sm" : "text-white hover:bg-white/10"
                  }`}
                >
                  মার্কশীট / নম্বরপত্র
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalTarget({ ...certModalTarget, certType: "RECEIPT" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    certModalTarget.certType === "RECEIPT" ? "bg-amber-400 text-emerald-950 shadow-sm" : "text-white hover:bg-white/10"
                  }`}
                >
                  মানি রিসিট (ভাউচার)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCertModalTarget(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white self-end md:self-auto shrink-0 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Canvas Display with Scrollable Stage */}
            <div className="p-4 sm:p-8 bg-slate-100/90 overflow-y-auto overflow-x-auto flex-1 flex justify-center items-start">
              <div className="printable-document-stage w-full flex justify-center">
              {certModalTarget.certType === "TC" && (
                <TransferCertificateCanvas doc={makeDocData(certModalTarget.student, "TC")} />
              )}
              {certModalTarget.certType === "CHARACTER" && (
                <CharacterCertificateCanvas doc={makeDocData(certModalTarget.student, "CHAR")} />
              )}
              {certModalTarget.certType === "PRATYAYAN" && (
                <PratyayanCanvas doc={makeDocData(certModalTarget.student, "PRAT")} />
              )}
              {certModalTarget.certType === "HIFZ" && (
                <HifzCertificateCanvas doc={makeDocData(certModalTarget.student, "HIFZ")} />
              )}
              {certModalTarget.certType === "DAWRA" && (
                <DawraCertificateCanvas doc={makeDocData(certModalTarget.student, "DAWRA")} />
              )}
              {certModalTarget.certType === "MISHKAT" && (
                <MishkatCertificateCanvas doc={makeDocData(certModalTarget.student, "MISH")} />
              )}
              {certModalTarget.certType === "NOORANI" && (
                <NooraniCertificateCanvas doc={makeDocData(certModalTarget.student, "NOOR")} />
              )}
              {certModalTarget.certType === "MERIT" && (
                <MeritCertificateCanvas doc={makeDocData(certModalTarget.student, "MERIT")} />
              )}
              {certModalTarget.certType === "ADMIT" && (
                <AdmitCardCanvas doc={makeDocData(certModalTarget.student, "ADMIT")} />
              )}
              {certModalTarget.certType === "MARKSHEET" && (
                <ResultMarksheetCanvas doc={makeDocData(certModalTarget.student, "RES")} />
              )}
              {certModalTarget.certType === "RECEIPT" && (
                <PaymentReceiptCanvas doc={makeDocData(certModalTarget.student, "REC")} />
              )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                অফিসিয়াল সিলমোহর ও মুহতামিম/অধ্যক্ষের স্বাক্ষর রেডি সনদপত্র
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>সনদপত্র প্রিন্ট করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCertModalTarget(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD PRINCIPAL / TEACHER / STAFF WITH AUTHORIZED GMAIL */}
      {/* ========================================================================= */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-emerald-950 to-[#0D5C3A] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-300" />
                  <span>নতুন প্রধান শিক্ষক / শিক্ষক / স্টাফ যোগ করুন</span>
                </h3>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  এডমিনের অনুমোদিত জিমেইল প্রদান করুন। শুধুমাত্র এই জিমেইল দিয়েই সিস্টেমে কাজ করা যাবে।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="p-6 space-y-4">
              {staffActionMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    staffActionMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {staffActionMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{staffActionMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">পদবি ও রোল নির্বাচন করুন *</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  >
                    <option value="TEACHER">উস্তাদ ও শিক্ষক (Teacher)</option>
                    <option value="PRINCIPAL">প্রধান শিক্ষক / মুহতামিম / অধ্যক্ষ (Principal)</option>
                    <option value="STAFF">হিসাবরক্ষক ও অফিস সহকারী (Staff)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">পুরো নাম (বাংলায়) *</label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="যেমন: মাওলানা আহমাদ উল্লাহ"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    অনুমোদিত অফিসিয়াল জিমেইল (Gmail) *
                  </label>
                  <input
                    type="email"
                    required
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">শুধুমাত্র এই নির্দিষ্ট Gmail দিয়েই তিনি সিস্টেমে লগইন করতে পারবেন।</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    placeholder="018XXXXXXXX"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">লগইন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">মাসিক মূল বেতন (৳)</label>
                  <input
                    type="number"
                    value={newStaffSalary}
                    onChange={(e) => setNewStaffSalary(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">দায়িত্বপ্রাপ্ত জামাত / শ্রেণী (ঐচ্ছিক)</label>
                <select
                  value={newStaffClassId}
                  onChange={(e) => setNewStaffClassId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                >
                  <option value="">কোনো নির্দিষ্ট জামাত নির্ধারিত নয়</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingStaff}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  {submittingStaff ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{submittingStaff ? "যুক্ত করা হচ্ছে..." : "অনুমোদিত কর্মকর্তা হিসেবে যুক্ত করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RESET PASSWORD FOR TEACHER / PRINCIPAL / STAFF */}
      {/* ========================================================================= */}
      {resetPasswordTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-emerald-950 to-[#0D5C3A] text-white p-4.5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  <span>পাসওয়ার্ড রিসেট করুন</span>
                </h3>
                <p className="text-[11px] text-emerald-200/90 mt-0.5">
                  {resetPasswordTarget.name} ({resetPasswordTarget.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordTarget(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="নতুন পাসওয়ার্ড লিখুন..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPasswordTarget(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md"
                >
                  {updatingPassword ? "হালনাগাদ হচ্ছে..." : "পাসওয়ার্ড কার্যকর করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: EDIT TEACHER / PRINCIPAL / STAFF BASIC INFO                     */}
      {/* ========================================================================= */}
      {editingStaffTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-emerald-950 to-[#0D5C3A] text-white p-4.5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm flex items-center gap-2">
                  <Edit className="w-4 h-4 text-amber-300" />
                  <span>কর্মকর্তা প্রোফাইল সম্পাদনা</span>
                </h3>
                <p className="text-[11px] text-emerald-200/90 mt-0.5">
                  {editingStaffTarget.name} ({editingStaffTarget.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaffTarget(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleEditStaffSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">অফিসিয়াল ইমেইল *</label>
                <input
                  type="email"
                  required
                  value={editStaffEmail}
                  onChange={(e) => setEditStaffEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={editStaffPhone}
                    onChange={(e) => setEditStaffPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">মূল মাসিক বেতন (৳)</label>
                  <input
                    type="number"
                    value={editStaffSalary}
                    onChange={(e) => setEditStaffSalary(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaffTarget(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingStaffEdit}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md"
                >
                  {savingStaffEdit ? "সংরক্ষণ হচ্ছে..." : "তথ্য হালনাগাদ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: TEACHER SMART ID CARD (CR80 DUAL-SIDED) PREVIEW & PRINT         */}
      {/* ========================================================================= */}
      {teacherIdModalTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 print:border-none print:shadow-none p-5 sm:p-6 print:p-0 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0D5C3A]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {teacherIdModalTarget.employee?.nameBn || teacherIdModalTarget.name} — স্মার্ট শিক্ষক ও স্টাফ আইডি কার্ড
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">CR80 দ্বিমুখী পিভিসি ফরম্যাট (85.6mm × 54mm)</span>
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
                  onClick={() => setTeacherIdModalTarget(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-center print:bg-white print:border-none print:p-0">
              <TeacherIDCanvas
                doc={{
                  certificateNumber: `EHRJ-TID-2026-${teacherIdModalTarget.employee?.employeeId || teacherIdModalTarget.id.slice(0, 4)}`,
                  verificationCode: `VER-TID-${teacherIdModalTarget.id.slice(0, 6)}`,
                  parsedSnapshot: {
                    teacher: {
                      nameBn: teacherIdModalTarget.employee?.nameBn || teacherIdModalTarget.name,
                      nameEn: teacherIdModalTarget.name,
                      designation: teacherIdModalTarget.employee?.designation?.nameBn || (teacherIdModalTarget.role === "PRINCIPAL" ? "অধ্যক্ষ ও মুহতামিম" : "উস্তাদ ও শিক্ষক"),
                      department: teacherIdModalTarget.employee?.department?.nameBn || "কিতাব ও হিফজ বিভাগ",
                      employeeId: teacherIdModalTarget.employee?.employeeId || teacherIdModalTarget.username,
                      bloodGroup: "B+",
                      phone: teacherIdModalTarget.phone || "০১৮৪৫-১৬২৬৬৪",
                      joinDate: "২০২৩-০১-০১",
                    },
                  },
                }}
              />
            </div>

            <div className="pt-2 text-center text-slate-400 text-[11px] print:hidden">
              সুরক্ষিত ডিজিটাল পরিচয়পত্র • অফিশিয়াল সিলমোহর ও কিউআর যাচাইকরণ অন্তর্ভুক্ত
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: STAFF / TEACHER PERMANENT DELETE & ARCHIVE CONFIRMATION          */}
      {/* ========================================================================= */}
      {deleteStaffTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-gradient-to-r from-rose-700 to-red-800 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">কর্মকর্তা / শিক্ষক অপসারণ নিশ্চিতকরণ</h3>
                  <p className="text-[11px] text-rose-200 font-medium">নিরাপদ ডিলিট ও আর্কাইভ বিকল্প</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteStaffTarget(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-950 space-y-1">
                  <p className="font-bold">সতর্কবার্তা: স্থায়ীভাবে মুছলে সমস্ত তথ্য মুছে যাবে</p>
                  <p className="text-rose-800 leading-relaxed">
                    আপনি <span className="font-bold text-rose-950 underline">{deleteStaffTarget.name}</span> ({deleteStaffTarget.email})-এর অ্যাকাউন্ট ডাটাবেজ থেকে মুছে ফেলতে চাচ্ছেন।
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">নাম:</span>
                  <span className="font-bold text-slate-800">{deleteStaffTarget.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">অনুমোদিত জিমেইল:</span>
                  <span className="font-mono text-slate-700">{deleteStaffTarget.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">বর্তমান পদবি / ভূমিকা:</span>
                  <span className="font-medium text-slate-800">
                    {deleteStaffTarget.employee?.designation?.nameBn || (deleteStaffTarget.role === "PRINCIPAL" ? "প্রধান শিক্ষক / মুহতামিম" : "উস্তাদ / শিক্ষক")}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">নির্ধারিত মাসিক মূল বেতন:</span>
                  <span className="font-bold text-emerald-700">
                    ৳ {Number(deleteStaffTarget.employee?.baseSalary || 0).toLocaleString("bn-BD")}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>আর্কাইভ করার পরামর্শ (ঐতিহাসিক ডাটা সুরক্ষা):</span>
                </p>
                <p className="text-amber-800 leading-relaxed">
                  যদি এই শিক্ষক অতীতে কোনো ক্লাসের উপস্থিতি বা পরীক্ষার ফলাফল প্রদান করে থাকেন, তবে মাদ্রাসার ডাটা সুরক্ষার জন্য তাঁকে <strong>"আর্কাইভ / সাবেক"</strong> করা শ্রেয়। এতে তিনি আর লগইন করতে পারবেন না কিন্তু পূর্ববর্তী রেকর্ড অক্ষত থাকবে।
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteStaffTarget(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStaff(false)}
                  disabled={deletingStaff}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span>আর্কাইভ করুন (ডাটা অক্ষত)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStaff(true)}
                  disabled={deletingStaff}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deletingStaff ? "মুছে ফেলা হচ্ছে..." : "স্থায়ীভাবে সম্পূর্ণ মুছুন"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: OFFICIAL STAFF ROSTER & SALARY REGISTER (PRINTABLE DOCUMENT)     */}
      {/* ========================================================================= */}
      {showStaffRosterModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 print:border-none print:shadow-none p-5 sm:p-8 print:p-0 my-auto">
            {/* Top Toolbar (Hidden when printing) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0D5C3A] text-white flex items-center justify-center shadow-sm">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    অফিসিয়াল শিক্ষক ও স্টাফ রোস্টার রেজিস্টার (২০২৬)
                  </h3>
                  <span className="text-xs text-slate-500">
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
                  <span>প্রিন্ট / PDF ডাউনলোড</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowStaffRosterModal(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Official Document Sheet */}
            <div className="p-4 sm:p-8 bg-white border border-slate-200 rounded-2xl print:border-none print:p-0 text-slate-900">
              {/* Official Header */}
              <div className="text-center pb-6 border-b-2 border-emerald-900 mb-6 relative">
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
                <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
                  {INSTITUTION_INFO.addressBn} • স্থাপিত: ২০২১ ইং
                </p>
                <div className="mt-3 inline-block bg-emerald-900 text-white text-xs sm:text-sm font-bold px-6 py-1 rounded-full uppercase tracking-wider">
                  কর্মকর্তা, শিক্ষক ও স্টাফদের পূর্ণাঙ্গ তালিকা ও রোস্টার (শিক্ষাবর্ষ ২০২৬)
                </div>
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center w-12">ক্রম</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">নাম ও আইডি</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">পদবি ও বিভাগ</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">অনুমোদিত ইমেইল ও মোবাইল</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center">ভূমিকা</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-right">মাসিক মূল বেতন</th>
                      <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {staffList.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 border-r border-slate-300 text-center font-bold text-slate-700">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300">
                          <div className="font-bold text-slate-900">{st.employee?.nameBn || st.name}</div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {st.employee?.employeeId || st.username}
                          </div>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300">
                          <div className="font-semibold text-slate-800">
                            {st.employee?.designation?.nameBn || (st.role === "PRINCIPAL" ? "মুহতামিম / অধ্যক্ষ" : "উস্তাদ / শিক্ষক")}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {st.employee?.department?.nameBn || "ইসলামিক শিক্ষা বিভাগ"}
                          </div>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300">
                          <div className="font-mono text-[11px] text-slate-800">{st.email}</div>
                          <div className="font-mono text-[11px] text-slate-600">{st.phone || "তথ্য নেই"}</div>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 text-center">
                          <span className="font-semibold text-[10px]">
                            {st.role === "PRINCIPAL" ? "অধ্যক্ষ" : st.role === "STAFF" ? "স্টাফ" : "শিক্ষক"}
                          </span>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 text-right font-bold text-slate-900 font-mono">
                          ৳ {Number(st.employee?.baseSalary || 0).toLocaleString("bn-BD")}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            st.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}>
                            {st.status === "ACTIVE" ? "সক্রিয়" : "স্থগিত"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-400">
                    <tr>
                      <td colSpan={5} className="py-2.5 px-3 border-r border-slate-300 text-right">
                        মোট কর্মকর্তা ও শিক্ষক: {staffList.length} জন (সক্রিয়: {stats.activeGmails} জন) | সর্বমোট মাসিক বেতন বিল:
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300 text-right font-black font-mono text-emerald-900 text-sm">
                        ৳ {Number(stats.totalPayroll || 0).toLocaleString("bn-BD")}
                      </td>
                      <td className="py-2.5 px-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures Section */}
              <div className="mt-16 pt-8 grid grid-cols-2 gap-12 text-center text-xs">
                <div>
                  <div className="border-t border-slate-900 w-48 mx-auto pt-1 font-bold text-slate-900">
                    মাওলানা মো: আবুল কালাম সরকার
                  </div>
                  <div className="text-[11px] text-slate-600">মুহতামিম / অধ্যক্ষ</div>
                  <div className="text-[10px] text-slate-500">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</div>
                </div>

                <div>
                  <div className="border-t border-slate-900 w-48 mx-auto pt-1 font-bold text-slate-900">
                    আলহাজ্ব ইঞ্জিনিয়ার মো: রফিকুল ইসলাম
                  </div>
                  <div className="text-[11px] text-slate-600">সভাপতি, পরিচালনা পর্ষদ</div>
                  <div className="text-[10px] text-slate-500">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</div>
                </div>
              </div>

              <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
                মুদ্রণ তারিখ: {new Date().toLocaleDateString("bn-BD")} • সিস্টেম জেনারেটেড ডিজিটাল রোস্টার রেজিস্টার
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
