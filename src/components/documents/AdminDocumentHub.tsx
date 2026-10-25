"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText,
  Search,
  Plus,
  CheckCircle2,
  AlertOctagon,
  Printer,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Eye,
  XCircle,
  FileCheck,
  Users,
  Award,
  ChevronRight,
  Filter,
  Check,
  Copy,
  AlertTriangle,
  ExternalLink,
  Layers,
  Sparkles,
  CreditCard,
  UserCheck,
  Building,
  Calendar,
  DollarSign,
  Download,
  Zap,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Clock,
  ChevronLeft,
  X,
  FileSpreadsheet,
  CheckCheck
} from "lucide-react";
import { DOCUMENT_TYPES, DOCUMENT_CATEGORIES } from "@/lib/documentFactory";
import { INSTITUTION_INFO } from "@/lib/constants";
import DocumentIntelligenceTab from "./intelligence/DocumentIntelligenceTab";
import StudentDocumentControlCenter from "./StudentDocumentControlCenter";
import DocumentAutomationSettingsTab from "./DocumentAutomationSettingsTab";
import { UniversalDocumentRenderer } from "./templates/DocumentCanvases";

export default function AdminDocumentHub() {
  const [activeSubTab, setActiveSubTab] = useState<
    "STUDENT_CENTER" | "OVERVIEW" | "GENERATE" | "BATCH_PRINT" | "DOCUMENTS" | "REQUESTS" | "TEMPLATES" | "AUTOMATION" | "INTELLIGENCE"
  >("STUDENT_CENTER");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Documents list & stats
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalIssued: 0,
    totalRevoked: 0,
    pendingRequests: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Requests state
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<any[]>([]);

  // --- SINGLE GENERATION WIZARD STATE ---
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const [selectedDocType, setSelectedDocType] = useState<string>("STUDY_CERTIFICATE");
  const [customNotes, setCustomNotes] = useState("");

  // Context-specific fields
  const [transferReason, setTransferReason] = useState("পারিবারিক স্থানান্তর ও সুবিধার নিমিত্তে");
  const [adminConductConfirmed, setAdminConductConfirmed] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedReceiptId, setSelectedReceiptId] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

  // Live preview & issuance
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  // Viewing / Printing Modal
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [printLayoutMode, setPrintLayoutMode] = useState<"A4" | "ID_CARD" | "THERMAL_80MM">("A4");
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [showReissueModal, setShowReissueModal] = useState(false);
  const [reissueReason, setReissueReason] = useState("");

  // --- BATCH GENERATION & BULK PRINT STATE ---
  const [classesList, setClassesList] = useState<any[]>([]);
  const [batchClassId, setBatchClassId] = useState("");
  const [batchSessionId, setBatchSessionId] = useState("");
  const [batchDocType, setBatchDocType] = useState("STUDENT_ID");
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [selectedBatchStudentIds, setSelectedBatchStudentIds] = useState<string[]>([]);
  const [loadingBatchStudents, setLoadingBatchStudents] = useState(false);
  const [batchIssuing, setBatchIssuing] = useState(false);
  const [batchIssuedResults, setBatchIssuedResults] = useState<any[] | null>(null);
  const [showCombinedPrint, setShowCombinedPrint] = useState(false);
  const [batchEligibilitySummary, setBatchEligibilitySummary] = useState<{
    total: number;
    eligible: number;
    alreadyIssued: number;
    ineligible: number;
  } | null>(null);
  const [batchEligibilityDetails, setBatchEligibilityDetails] = useState<Record<string, { status: "ELIGIBLE" | "ALREADY_ISSUED" | "INELIGIBLE"; reason: string }>>({});
  const [eligibleBatchIds, setEligibleBatchIds] = useState<string[]>([]);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  // Request review modal
  const [reviewingRequest, setReviewingRequest] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reviewReason, setReviewReason] = useState("");

  // Initial Load
  useEffect(() => {
    fetchDocuments();
    fetchRequests();
    fetchTemplates();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/admin/academic");
      const data = await res.json();
      if (res.ok && data.jamatClasses) {
        setClassesList(data.jamatClasses || []);
        if (data.jamatClasses.length > 0 && !batchClassId) {
          setBatchClassId(data.jamatClasses[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/documents", window.location.origin);
      if (searchTerm) url.searchParams.set("search", searchTerm);
      if (filterType) url.searchParams.set("type", filterType);
      if (filterStatus) url.searchParams.set("status", filterStatus);
      url.searchParams.set("page", String(page));

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents || []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/admin/documents/requests");
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/documents/templates");
      const data = await res.json();
      if (res.ok) setTemplates(data.templates || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Student Search Autocomplete for Wizard
  useEffect(() => {
    if (!studentSearchQuery || studentSearchQuery.trim().length < 1) {
      setStudentSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingStudents(true);
      try {
        const res = await fetch(`/api/admin/documents/search-student?q=${encodeURIComponent(studentSearchQuery.trim())}`);
        const data = await res.json();
        if (res.ok) {
          setStudentSearchResults(data.students || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingStudents(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [studentSearchQuery]);

  // Select Student from Autocomplete
  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setStudentSearchResults([]);
    setStudentSearchQuery(`${student.fullNameBn} (${student.studentIdNumber})`);

    // Reset context fields
    if (student.examsAvailable?.length > 0) {
      setSelectedExamId(student.examsAvailable[0].examId);
    }
    if (student.financialClearance?.invoices?.length > 0) {
      setSelectedInvoiceId(student.financialClearance.invoices[0].id);
    }
  };

  // Generate Live Preview
  const handleGeneratePreview = async () => {
    if (!selectedStudent || !selectedDocType) {
      setErrorMsg("শিক্ষার্থী এবং প্রত্যয়নপত্রের ধরন নির্বাচন করুন।");
      return;
    }

    setIsPreviewLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/documents/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          documentType: selectedDocType,
          customNotes,
          transferReason,
          adminConductConfirmed,
          selectedExamId,
          selectedInvoiceId,
          selectedReceiptId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPreviewData(data.preview);
        // Default print mode based on type
        if (selectedDocType === "STUDENT_ID") {
          setPrintLayoutMode("ID_CARD");
        } else if (selectedDocType === "PAYMENT_RECEIPT") {
          setPrintLayoutMode("THERMAL_80MM");
        } else {
          setPrintLayoutMode("A4");
        }
      } else {
        setErrorMsg(data.error || "প্রিভিউ তৈরি করতে সমস্যা হয়েছে।");
      }
    } catch {
      setErrorMsg("সার্ভার সংযোগ ত্রুটি।");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Issue Official Document
  const handleIssueDocument = async () => {
    if (!selectedStudent || !selectedDocType) {
      setErrorMsg("শিক্ষার্থী এবং প্রত্যয়নপত্রের ধরন নির্বাচন করুন।");
      return;
    }

    if (selectedDocType === "CHARACTER_CERTIFICATE" && !adminConductConfirmed) {
      setErrorMsg("চারিত্রিক সনদপত্র ইস্যুর পূর্বে শিক্ষার্থীর আচরণ সম্পর্কিত নিশ্চয়তা অনুমোদন করুন।");
      return;
    }

    setIsIssuing(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          documentType: selectedDocType,
          customNotes,
          transferReason,
          adminConductConfirmed,
          selectedExamId,
          selectedInvoiceId,
          selectedReceiptId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("অফিশিয়াল প্রত্যয়নপত্র সফলভাবে তৈরি ও সিস্টেমে নিবন্ধিত হয়েছে!");
        fetchDocuments();
        handleViewDoc(data.certificate.id);
        setPreviewData(null);
      } else {
        setErrorMsg(data.error || "প্রত্যয়নপত্র ইস্যু করা সম্ভব হয়নি।");
      }
    } catch {
      setErrorMsg("সার্ভার ত্রুটি।");
    } finally {
      setIsIssuing(false);
    }
  };

  // View Doc Detail
  const handleViewDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/documents/${id}`);
      const data = await res.json();
      if (res.ok && data.document) {
        setViewingDoc(data.document);
        if (data.document.certificateType === "STUDENT_ID") {
          setPrintLayoutMode("ID_CARD");
        } else if (data.document.certificateType === "PAYMENT_RECEIPT") {
          setPrintLayoutMode("THERMAL_80MM");
        } else {
          setPrintLayoutMode("A4");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Revoke Doc
  const handleRevokeSubmit = async () => {
    if (!viewingDoc || !revokeReason.trim()) return;
    try {
      const res = await fetch(`/api/admin/documents/${viewingDoc.id}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: revokeReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("প্রত্যয়নপত্র সফলভাবে বাতিল (REVOKED) করা হয়েছে।");
        setShowRevokeModal(false);
        setRevokeReason("");
        handleViewDoc(viewingDoc.id);
        fetchDocuments();
      } else {
        setErrorMsg(data.error || "বাতিল করা সম্ভব হয়নি।");
      }
    } catch {
      setErrorMsg("সার্ভার ত্রুটি।");
    }
  };

  // Reissue Doc
  const handleReissueSubmit = async () => {
    if (!viewingDoc || !reissueReason.trim()) return;
    try {
      const res = await fetch(`/api/admin/documents/${viewingDoc.id}/reissue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reissueReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`প্রত্যয়নপত্র সফলভাবে পুনরায় ইস্যু করা হয়েছে (ভার্সন ${data.certificate.version})।`);
        setShowReissueModal(false);
        setReissueReason("");
        handleViewDoc(data.certificate.id);
        fetchDocuments();
      } else {
        setErrorMsg(data.error || "পুনরায় ইস্যু করা সম্ভব হয়নি।");
      }
    } catch {
      setErrorMsg("সার্ভার ত্রুটি।");
    }
  };

  // Run batch eligibility check
  const runBatchEligibilityCheck = async (studentIds: string[], docType: string) => {
    if (studentIds.length === 0 || !docType) return;
    setIsCheckingEligibility(true);
    try {
      const res = await fetch("/api/admin/documents/batch/eligibility-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds, documentType: docType, sessionId: batchSessionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setBatchEligibilitySummary(data.summary);
        setEligibleBatchIds(data.eligibleStudentIds || []);
        const map: Record<string, { status: "ELIGIBLE" | "ALREADY_ISSUED" | "INELIGIBLE"; reason: string }> = {};
        (data.details || []).forEach((d: any) => {
          map[d.studentId] = { status: d.status, reason: d.reason };
        });
        setBatchEligibilityDetails(map);
        setSelectedBatchStudentIds(data.eligibleStudentIds || []);
      }
    } catch (err) {
      console.error("Batch eligibility check failed", err);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const handleBatchDocTypeChange = (newType: string) => {
    setBatchDocType(newType);
    if (batchStudents.length > 0) {
      runBatchEligibilityCheck(batchStudents.map((s) => s.id), newType);
    }
  };

  // Batch Students Fetch
  const handleFetchBatchStudents = async () => {
    setLoadingBatchStudents(true);
    setSelectedBatchStudentIds([]);
    setBatchEligibilitySummary(null);
    setBatchEligibilityDetails({});
    setEligibleBatchIds([]);
    try {
      const res = await fetch(`/api/admin/documents/search-student?classId=${batchClassId}&sessionId=${batchSessionId}&limit=100`);
      const data = await res.json();
      if (res.ok) {
        const students = data.students || [];
        setBatchStudents(students);
        if (students.length > 0) {
          runBatchEligibilityCheck(students.map((s: any) => s.id), batchDocType);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBatchStudents(false);
    }
  };

  const handleSelectAllBatch = () => {
    if (selectedBatchStudentIds.length === batchStudents.length) {
      setSelectedBatchStudentIds([]);
    } else {
      setSelectedBatchStudentIds(batchStudents.map((s) => s.id));
    }
  };

  const handleToggleBatchStudent = (id: string) => {
    if (selectedBatchStudentIds.includes(id)) {
      setSelectedBatchStudentIds(selectedBatchStudentIds.filter((item) => item !== id));
    } else {
      setSelectedBatchStudentIds([...selectedBatchStudentIds, id]);
    }
  };

  // Execute Batch Issuance
  const handleExecuteBatchIssue = async () => {
    if (selectedBatchStudentIds.length === 0) {
      setErrorMsg("অন্তত একজন শিক্ষার্থী নির্বাচন করুন।");
      return;
    }
    setBatchIssuing(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/documents/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedBatchStudentIds,
          documentType: batchDocType,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        setBatchIssuedResults(data.issuedCertificates || []);
        setShowCombinedPrint(true);
        fetchDocuments();
      } else {
        setErrorMsg(data.error || "ব্যাচ ইস্যু সম্পন্ন করা সম্ভব হয়নি।");
      }
    } catch {
      setErrorMsg("সার্ভার ত্রুটি।");
    } finally {
      setBatchIssuing(false);
    }
  };

  // Review Guardian Request
  const handleReviewRequestSubmit = async () => {
    if (!reviewingRequest) return;
    try {
      const res = await fetch(`/api/admin/documents/requests/${reviewingRequest.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: reviewAction,
          rejectionReason: reviewReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || "আবেদন সফলভাবে পর্যালোচনা করা হয়েছে।");
        setReviewingRequest(null);
        setReviewReason("");
        fetchRequests();
      } else {
        setErrorMsg(data.error || "পর্যালোচনা সম্পন্ন করা যায়নি।");
      }
    } catch {
      setErrorMsg("সার্ভার ত্রুটি।");
    }
  };

  // One-click issue for approved request
  const handleIssueRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/admin/documents/requests/${requestId}/issue`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("আবেদনের প্রেক্ষিতে প্রত্যয়নপত্র ইস্যু করা হয়েছে!");
        fetchRequests();
        fetchDocuments();
        handleViewDoc(data.certificate.id);
      } else {
        setErrorMsg(data.error || "ইস্যু করা সম্ভব হয়নি।");
      }
    } catch {
      setErrorMsg("সার্ভার ত্রুটি।");
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs sm:text-sm flex justify-between items-center shadow-md animate-in fade-in">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg("")} className="font-bold text-gray-500 hover:text-gray-900 text-lg leading-none p-1">
            &times;
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-900 rounded-2xl text-xs sm:text-sm flex justify-between items-center shadow-md animate-in fade-in">
          <span className="flex items-center gap-2 font-semibold">
            <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg("")} className="font-bold text-gray-500 hover:text-gray-900 text-lg leading-none p-1">
            &times;
          </button>
        </div>
      )}

      {/* TOP HEADER & MAJESTIC ISLAMIC INSTITUTIONAL COMMAND BAR */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#031E13] via-[#083E28] to-[#0A4D32] text-white p-6 sm:p-7 shadow-xl border border-emerald-700/60">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-400 text-emerald-950 font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full font-mono shadow-sm">
                OFFICIAL REPOSITORY & FACTORY
              </span>
              <span className="text-emerald-200 text-xs font-medium">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white flex items-center gap-2.5 tracking-wide">
              <FileCheck className="w-6 h-6 text-amber-300 shrink-0" />
              সনদপত্র ও প্রত্যয়ন ফ্যাক্টরি (Document & Certificate Factory)
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-3xl leading-relaxed">
              ১৩ ধরনের প্রাতিষ্ঠানিক সনদ, স্মার্ট স্টুডেন্ট আইডি কার্ড (CR80), সুরক্ষিত কিউআর কোড যাচাইকরণ, শ্রেণিভিত্তিক ব্যাচ প্রিন্ট ও পূর্ণাঙ্গ ডিজিটাল লাইফসাইকেল।
            </p>
          </div>

          {/* Real-time KPI Stats Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-center min-w-[85px] shadow-sm">
              <span className="text-[10px] text-emerald-200 block font-medium">মোট ইস্যুকৃত</span>
              <span className="text-base sm:text-lg font-bold font-mono text-white">{stats.totalDocuments}</span>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-emerald-400/30 text-center min-w-[85px] shadow-sm">
              <span className="text-[10px] text-emerald-200 block font-medium">বৈধ ও সক্রিয়</span>
              <span className="text-base sm:text-lg font-bold font-mono text-amber-300">{stats.totalIssued}</span>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-400/30 text-center min-w-[85px] shadow-sm">
              <span className="text-[10px] text-amber-200 block font-medium">অপেক্ষমান আবেদন</span>
              <span className="text-base sm:text-lg font-bold font-mono text-amber-200">{stats.pendingRequests}</span>
            </div>
            <div className="bg-red-500/20 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-red-400/30 text-center min-w-[85px] shadow-sm">
              <span className="text-[10px] text-red-200 block font-medium">বাতিলকৃত</span>
              <span className="text-base sm:text-lg font-bold font-mono text-red-200">{stats.totalRevoked}</span>
            </div>
          </div>
        </div>

        {/* SUB-NAVIGATION TABS */}
        <div className="mt-6 pt-5 border-t border-emerald-700/50 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab("STUDENT_CENTER")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === "STUDENT_CENTER"
                ? "bg-amber-400 text-emerald-950 font-bold shadow-md ring-2 ring-amber-300/50"
                : "bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            স্টুডেন্ট ডকুমেন্ট কন্ট্রোল
          </button>
          <button
            onClick={() => setActiveSubTab("OVERVIEW")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === "OVERVIEW"
                ? "bg-amber-400 text-emerald-950 font-bold shadow-md ring-2 ring-amber-300/50"
                : "bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            ওভারভিউ ও ককপিট
          </button>
          <button
            onClick={() => setActiveSubTab("GENERATE")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === "GENERATE"
                ? "bg-amber-400 text-emerald-950 font-bold shadow-md ring-2 ring-amber-300/50"
                : "bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            একক ইস্যু উইজার্ড
          </button>
          <button
            onClick={() => setActiveSubTab("BATCH_PRINT")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === "BATCH_PRINT"
                ? "bg-amber-400 text-emerald-950 font-bold shadow-md ring-2 ring-amber-300/50"
                : "bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Printer className="w-4 h-4" />
            ব্যাচ প্রিন্ট সেন্টার
          </button>
          <button
            onClick={() => setActiveSubTab("DOCUMENTS")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === "DOCUMENTS"
                ? "bg-amber-400 text-emerald-950 font-bold shadow-md ring-2 ring-amber-300/50"
                : "bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            ইস্যুকৃত লেজার ({stats.totalDocuments})
          </button>
          <button
            onClick={() => setActiveSubTab("REQUESTS")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 relative ${
              activeSubTab === "REQUESTS"
                ? "bg-amber-400 text-emerald-950 font-bold shadow-md ring-2 ring-amber-300/50"
                : "bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            আবেদন কিউ
            {stats.pendingRequests > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {stats.pendingRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("TEMPLATES")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === "TEMPLATES"
                ? "bg-amber-400 text-emerald-950 font-bold shadow-md ring-2 ring-amber-300/50"
                : "bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            টেমপ্লেটসমূহ
          </button>
          <button
            onClick={() => setActiveSubTab("AUTOMATION")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === "AUTOMATION"
                ? "bg-amber-400 text-emerald-950 font-bold shadow-md ring-2 ring-amber-300/50"
                : "bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            অটোমেশন সেটিংস
          </button>
          <button
            onClick={() => setActiveSubTab("INTELLIGENCE")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === "INTELLIGENCE"
                ? "bg-amber-400 text-emerald-950 font-bold shadow-md ring-2 ring-amber-300/50"
                : "bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            ডিজিটাল আর্কাইভ
          </button>
        </div>
      </div>

      {/* 0. STUDENT DOCUMENT CONTROL CENTER */}
      {activeSubTab === "STUDENT_CENTER" && (
        <StudentDocumentControlCenter
          onViewDoc={(doc) => handleViewDoc(doc.id)}
          onOpenReissue={(doc) => {
            setViewingDoc(doc);
            setShowReissueModal(true);
          }}
          onOpenRevoke={(doc) => {
            setViewingDoc(doc);
            setShowRevokeModal(true);
          }}
        />
      )}

      {/* 1. OVERVIEW SUB-TAB */}
      {activeSubTab === "OVERVIEW" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-1">
              <span className="text-xs text-gray-500 font-medium block">মোট প্রস্তুতকৃত সনদ</span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[#0B1914]">{stats.totalDocuments}</span>
              <span className="text-[11px] text-gray-400 block pt-1">সেন্ট্রাল ডাটাবেজ রেকর্ড</span>
            </div>
            <div className="bg-emerald-50/70 rounded-3xl border border-emerald-200 p-5 shadow-sm space-y-1">
              <span className="text-xs text-emerald-800 font-medium block">সক্রিয় ও বৈধ (Valid)</span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-900">{stats.totalIssued}</span>
              <span className="text-[11px] text-emerald-700/80 block pt-1">পাবলিক ভেরিফাই সক্ষম</span>
            </div>
            <div className="bg-amber-50/70 rounded-3xl border border-amber-200 p-5 shadow-sm space-y-1">
              <span className="text-xs text-amber-800 font-medium block">অপেক্ষমান আবেদন (Pending)</span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-900">{stats.pendingRequests}</span>
              <span className="text-[11px] text-amber-700/80 block pt-1">অভিভাবক পোর্টাল থেকে প্রাপ্ত</span>
            </div>
            <div className="bg-red-50/70 rounded-3xl border border-red-200 p-5 shadow-sm space-y-1">
              <span className="text-xs text-red-800 font-medium block">বাতিলকৃত (Revoked)</span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-red-900">{stats.totalRevoked}</span>
              <span className="text-[11px] text-red-700/80 block pt-1">অডিট ও নিরাপত্তা রক্ষিত</span>
            </div>
          </div>

          {/* Quick Actions & Recent Documents */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4 lg:col-span-1">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">দ্রুত সনদপত্র তৈরি লঞ্চপ্যাড</h3>
                <span className="text-[11px] text-[#0D5C3A] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ১৩টি ফরম্যাট সক্রিয়
                </span>
              </div>
              <div className="space-y-1.5 text-xs max-h-[460px] overflow-y-auto pr-1">
                {DOCUMENT_TYPES.map((t) => (
                  <button
                    key={t.code}
                    onClick={() => {
                      setSelectedDocType(t.code);
                      setActiveSubTab("GENERATE");
                    }}
                    className="w-full text-left p-3 rounded-2xl border border-gray-100 hover:border-[#0D5C3A] hover:bg-emerald-50/30 transition flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-gray-800 group-hover:text-[#0D5C3A] block text-xs">{t.nameBn}</span>
                      <span className="font-mono text-[10px] text-gray-400">{t.prefix}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#0D5C3A] transition group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">সাম্প্রতিক ইস্যুকৃত সনদপত্র লেজার</h3>
                  <p className="text-xs text-gray-500">সর্বশেষ প্রস্তুতকৃত সনদ ও ডিজিটাল কিউআর রেকর্ড</p>
                </div>
                <button
                  onClick={() => setActiveSubTab("DOCUMENTS")}
                  className="text-xs text-[#0D5C3A] hover:underline font-bold flex items-center gap-1"
                >
                  লেজার দেখুন ({stats.totalDocuments})
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-gray-500 border-b">
                    <tr>
                      <th className="pb-3 font-semibold">সনদ নম্বর</th>
                      <th className="pb-3 font-semibold">শিক্ষার্থী</th>
                      <th className="pb-3 font-semibold">ধরন</th>
                      <th className="pb-3 font-semibold">তারিখ</th>
                      <th className="pb-3 font-semibold text-right">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documents.slice(0, 8).map((doc) => (
                      <tr key={doc.id} className="hover:bg-emerald-50/30 cursor-pointer transition" onClick={() => handleViewDoc(doc.id)}>
                        <td className="py-3 font-mono font-bold text-[#0D5C3A]">{doc.certificateNumber}</td>
                        <td className="py-3 font-bold text-gray-900">
                          {doc.student?.fullNameBn}
                          <span className="block font-mono text-[10px] text-gray-400">{doc.student?.studentIdNumber}</span>
                        </td>
                        <td className="py-3 text-gray-700">{doc.titleBn}</td>
                        <td className="py-3 text-gray-500 font-mono">{new Date(doc.issueDate).toLocaleDateString("bn-BD")}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            doc.isRevoked ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {doc.isRevoked ? "REVOKED" : "VALID"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {documents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">কোনো সনদপত্র রেকর্ড পাওয়া যায়নি।</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. GENERATE SUB-TAB (SINGLE ISSUANCE WIZARD) */}
      {activeSubTab === "GENERATE" && (
        <div className="space-y-6">
          {/* Wizard Step Progress */}
          <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                selectedStudent ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
              }`}>
                ১. শিক্ষার্থী নির্বাচন {selectedStudent && "✓"}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-900">
                ২. সনদ কনফিগারেশন ({DOCUMENT_TYPES.find(d => d.code === selectedDocType)?.nameBn})
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <span className={`px-3 py-1 rounded-full font-bold ${
                previewData ? "bg-purple-100 text-purple-900" : "bg-gray-100 text-gray-500"
              }`}>
                ৩. লাইভ প্রিভিউ ও ইস্যু
              </span>
            </div>

            {selectedStudent && (
              <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                নির্বাচিত: {selectedStudent.fullNameBn} ({selectedStudent.studentIdNumber})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Form: Student Search & Parameters */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0D5C3A]" />
                  সনদপত্র ইস্যু উইজার্ড
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  শিক্ষার্থী নির্বাচন করলে যাবতীয় শিক্ষাগত ও আর্থিক তথ্য স্বয়ংক্রিয়ভাবে লোড হবে।
                </p>
              </div>

              {/* Step 1: Universal Student Search Autocomplete */}
              <div className="space-y-1.5 relative">
                <label className="block text-gray-700 font-semibold text-xs">
                  ১. শিক্ষার্থী অনুসন্ধান (Search Student) *
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="নাম, রোল, স্টুডেন্ট আইডি বা মোবাইল নম্বর লিখুন..."
                    className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:border-[#0D5C3A] transition"
                  />
                  {isSearchingStudents && (
                    <div className="w-3.5 h-3.5 border-2 border-[#0D5C3A] border-t-transparent rounded-full animate-spin absolute right-3 top-3" />
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {studentSearchResults.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                    {studentSearchResults.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectStudent(s)}
                        className="p-3 hover:bg-emerald-50/50 cursor-pointer flex items-center justify-between transition"
                      >
                        <div>
                          <span className="font-bold text-gray-900 block text-xs">{s.fullNameBn}</span>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                            <span>{s.studentIdNumber}</span>
                            <span>•</span>
                            <span>{s.activeEnrollment?.className || "শ্রেণি"}</span>
                            <span>•</span>
                            <span>রোল: {s.activeEnrollment?.rollNumber || "১"}</span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
                          {s.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Student Information Card */}
              {selectedStudent && (
                <div className="bg-[#FDFCF8] border border-amber-300/60 rounded-2xl p-4 space-y-2 text-xs shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-gray-900 text-sm block">{selectedStudent.fullNameBn}</span>
                      <span className="font-mono text-[11px] text-[#0D5C3A] font-semibold">{selectedStudent.studentIdNumber}</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {selectedStudent.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-2 border-t border-gray-200/60">
                    <div>
                      <span className="text-gray-400 block text-[10px]">শ্রেণি ও শাখা:</span>
                      <span className="font-semibold text-gray-800">
                        {selectedStudent.activeEnrollment?.className} ({selectedStudent.activeEnrollment?.sectionName})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">রোল ও শিক্ষাবর্ষ:</span>
                      <span className="font-semibold text-gray-800">
                        রোল {selectedStudent.activeEnrollment?.rollNumber} • {selectedStudent.activeEnrollment?.sessionName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">অভিভাবক:</span>
                      <span className="font-semibold text-gray-800">
                        {selectedStudent.guardian?.fullNameBn} ({selectedStudent.guardian?.relation})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">আর্থিক বকেয়া স্ট্যাটাস:</span>
                      <span className={`font-bold ${selectedStudent.financialClearance?.hasOutstandingDues ? "text-amber-700" : "text-emerald-700"}`}>
                        {selectedStudent.financialClearance?.hasOutstandingDues
                          ? `বকেয়া: ৳${selectedStudent.financialClearance.totalDue}`
                          : "বকেয়ামুক্ত (পরিশোধিত)"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Document Type Selector */}
              <div className="space-y-1.5">
                <label className="block text-gray-700 font-semibold text-xs">
                  ২. প্রত্যয়নপত্রের ধরন নির্বাচন করুন *
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => {
                    setSelectedDocType(e.target.value);
                    setPreviewData(null);
                  }}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:border-[#0D5C3A] font-semibold text-gray-800 bg-white"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.nameBn} ({t.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Context-Aware Parameters */}
              {selectedDocType === "CHARACTER_CERTIFICATE" && (
                <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-3.5 text-xs space-y-2">
                  <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    চারিত্রিক সনদ অনুমোদন গেট
                  </span>
                  <p className="text-gray-600 text-[11px] leading-relaxed">
                    প্রাতিষ্ঠানিক নীতি অনুসারে চরিত্র ও আচরণ সংক্রান্ত নিশ্চিতকরণ ছাড়া স্বয়ংক্রিয়ভাবে চারিত্রিক সনদ ইস্যু নিষিদ্ধ।
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800 pt-1">
                    <input
                      type="checkbox"
                      checked={adminConductConfirmed}
                      onChange={(e) => setAdminConductConfirmed(e.target.checked)}
                      className="w-4 h-4 accent-[#0D5C3A]"
                    />
                    আমি নিশ্চিত করছি যে শিক্ষার্থীর চরিত্র প্রশংসনীয় ও কোনো অভিযোগ নেই
                  </label>
                </div>
              )}

              {selectedDocType === "TRANSFER_CERTIFICATE" && (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs space-y-1">
                    <span className="font-bold text-emerald-950 block">ছাড়পত্র আর্থিক ছাড়পত্র নিরীক্ষা:</span>
                    <p className="text-gray-700 text-[11px]">
                      বর্তমান হিসাব স্ট্যাটাস:{" "}
                      <span className="font-bold">
                        {selectedStudent?.financialClearance?.hasOutstandingDues
                          ? `বকেয়া রয়েছে ৳${selectedStudent?.financialClearance?.totalDue} (নিষ্পত্তি করা আবশ্যক)`
                          : "যাবতীয় ফি ও পাওনাদি নিষ্পত্তি করা হয়েছে"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold text-xs mb-1">ছাড়পত্রের সুনির্দিষ্ট কারণ *</label>
                    <input
                      type="text"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      placeholder="যেমন: অভিভাবকের কর্মস্থল পরিবর্তন / পারিবারিক সুবিধা..."
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                    />
                  </div>
                </div>
              )}

              {/* Custom Notes */}
              <div>
                <label className="block text-gray-700 font-semibold text-xs mb-1">বিশেষ কোনো নোট বা রেফারেন্স (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="যেমন: পাসপোর্ট, ভিসা বা উচ্চতর জামাতে ভর্তির নিমিত্তে..."
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={!selectedStudent || isPreviewLoading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isPreviewLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  লাইভ প্রিভিউ দেখুন
                </button>
                <button
                  type="button"
                  onClick={handleIssueDocument}
                  disabled={!selectedStudent || isIssuing}
                  className="flex-1 bg-[#0D5C3A] hover:bg-[#158052] text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isIssuing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  ইস্যু ও প্রিন্ট সম্পন্ন করুন
                </button>
              </div>
            </div>

            {/* Right Panel: Live Dynamic Preview Canvas */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap justify-between items-center border-b pb-3 mb-4 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Printer className="w-4 h-4 text-[#0D5C3A]" />
                      লাইভ ডকুমেন্ট প্রিভিউ ক্যানভাস
                    </h3>
                    <span className="text-[11px] text-gray-500">
                      {previewData ? "প্রস্তুতকৃত রিয়েল-টাইম স্ন্যাপশট" : "শিক্ষার্থী নির্বাচন করে 'লাইভ প্রিভিউ দেখুন' চাপুন"}
                    </span>
                  </div>
                  {previewData && (
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-[10px] font-bold">
                      <button
                        onClick={() => setPrintLayoutMode("A4")}
                        className={`px-2.5 py-1 rounded-lg transition ${printLayoutMode === "A4" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600"}`}
                      >
                        A4 সনদ
                      </button>
                      <button
                        onClick={() => setPrintLayoutMode("ID_CARD")}
                        className={`px-2.5 py-1 rounded-lg transition ${printLayoutMode === "ID_CARD" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600"}`}
                      >
                        CR80 আইডি
                      </button>
                      {selectedDocType === "PAYMENT_RECEIPT" && (
                        <button
                          onClick={() => setPrintLayoutMode("THERMAL_80MM")}
                          className={`px-2.5 py-1 rounded-lg transition ${printLayoutMode === "THERMAL_80MM" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600"}`}
                        >
                          ৮০ মিমি রশিদ
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {previewData ? (
                  <div className="p-2 sm:p-4 bg-[#FDFCF8] rounded-2xl border border-gray-200/80">
                    <UniversalDocumentRenderer doc={previewData} layoutMode={printLayoutMode} />
                  </div>
                ) : (
                  <div className="py-28 text-center border-2 border-dashed border-gray-200 rounded-3xl space-y-3 bg-[#FDFCF8]/50">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center mx-auto shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-gray-700">কোনো প্রিভিউ ডেটা লোড করা হয়নি</p>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      বাম পাশের ফর্ম থেকে শিক্ষার্থী নির্বাচন করে &apos;লাইভ প্রিভিউ দেখুন&apos; ক্লিক করুন
                    </p>
                  </div>
                )}
              </div>

              {previewData && (
                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleIssueDocument}
                    disabled={isIssuing}
                    className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition"
                  >
                    <Check className="w-4 h-4" />
                    সরাসরি অফিসিয়ালভাবে ইস্যু করুন
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. BATCH GENERATION & BULK PRINT CENTER */}
      {activeSubTab === "BATCH_PRINT" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0D5C3A]" />
                ব্যাচ ডকুমেন্ট জেনারেশন ও বাল্ক প্রিন্ট সেন্টার
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                সম্পূর্ণ শ্রেণি বা শাখার শিক্ষার্থীদের জন্য এক ক্লিকে আইডি কার্ড, প্রত্যয়নপত্র বা প্রবেশপত্র তৈরি ও সমন্বিত প্রিন্ট করুন।
              </p>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">জামাত / শ্রেণি *</label>
                <select
                  value={batchClassId}
                  onChange={(e) => setBatchClassId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl outline-none font-semibold text-gray-800 bg-white"
                >
                  <option value="">-- শ্রেণি বাছাই করুন --</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameBn} ({c.nameEn})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">প্রত্যয়নপত্রের ধরন *</label>
                <select
                  value={batchDocType}
                  onChange={(e) => handleBatchDocTypeChange(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl outline-none font-semibold text-gray-800 bg-white"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>{t.nameBn}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleFetchBatchStudents}
                  disabled={loadingBatchStudents}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  শিক্ষার্থী লোড করুন
                </button>
                {batchStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExecuteBatchIssue}
                    disabled={batchIssuing || selectedBatchStudentIds.length === 0}
                    className="bg-[#0D5C3A] hover:bg-[#158052] text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md flex items-center gap-1.5 disabled:opacity-50 transition"
                  >
                    {batchIssuing ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    নির্বাচিত {selectedBatchStudentIds.length} জনের ব্যাচ ইস্যু
                  </button>
                )}
              </div>
            </div>

            {/* Batch Eligibility Breakdown Banner */}
            {isCheckingEligibility && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>শিক্ষার্থীদের প্রাতিষ্ঠানিক সনদপত্রের যোগ্যতা সার্ভার হতে যাচাই করা হচ্ছে...</span>
              </div>
            )}

            {batchEligibilitySummary && !isCheckingEligibility && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-bold text-gray-700">যোগ্যতা পর্যালোচনা:</span>
                  <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-xl font-bold flex items-center gap-1 border border-emerald-300">
                    ✓ যোগ্য: {batchEligibilitySummary.eligible} জন
                  </span>
                  <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-xl font-bold flex items-center gap-1 border border-amber-300">
                    ℹ ইতোমধ্যে ইস্যুকৃত: {batchEligibilitySummary.alreadyIssued} জন
                  </span>
                  <span className="bg-red-100 text-red-900 px-3 py-1 rounded-xl font-bold flex items-center gap-1 border border-red-300">
                    ✕ অযোগ্য: {batchEligibilitySummary.ineligible} জন
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBatchStudentIds(eligibleBatchIds)}
                    disabled={eligibleBatchIds.length === 0}
                    className="bg-[#0D5C3A] hover:bg-[#158052] text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    শুধুমাত্র যোগ্যদের নির্বাচন করুন ({eligibleBatchIds.length})
                  </button>
                </div>
              </div>
            )}

            {/* Students Table for Batch Selection */}
            {batchStudents.length > 0 && (
              <div className="border border-gray-200 rounded-2xl overflow-hidden mt-4 shadow-sm">
                <div className="bg-gray-50 p-3 flex justify-between items-center text-xs border-b border-gray-200">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedBatchStudentIds.length === batchStudents.length && batchStudents.length > 0}
                      onChange={handleSelectAllBatch}
                      className="w-4 h-4 accent-[#0D5C3A]"
                    />
                    <span className="font-bold text-gray-700">
                      সকলকে নির্বাচন করুন ({batchStudents.length} জন)
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-semibold">
                    নির্বাচিত: <strong className="text-[#0D5C3A]">{selectedBatchStudentIds.length}</strong> জন
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 text-xs">
                  {batchStudents.map((s) => {
                    const elig = batchEligibilityDetails[s.id];
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleToggleBatchStudent(s.id)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition ${
                          selectedBatchStudentIds.includes(s.id) ? "bg-emerald-50/50" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedBatchStudentIds.includes(s.id)}
                            onChange={() => {}}
                            className="w-4 h-4 accent-[#0D5C3A]"
                          />
                          <div>
                            <span className="font-bold text-gray-900 block">{s.fullNameBn}</span>
                            <span className="text-[10px] font-mono text-gray-500">
                              ID: {s.studentIdNumber} • রোল: {s.activeEnrollment?.rollNumber || "১"} • শাখা: {s.activeEnrollment?.sectionName || "ক"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {elig && elig.status === "ELIGIBLE" && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ যোগ্য
                            </span>
                          )}
                          {elig && elig.status === "ALREADY_ISSUED" && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200" title={elig.reason}>
                              ℹ ইস্যুকৃত
                            </span>
                          )}
                          {elig && elig.status === "INELIGIBLE" && (
                            <span className="text-[10px] bg-red-100 text-red-900 font-bold px-2 py-0.5 rounded-full border border-red-200" title={elig.reason}>
                              ✕ অযোগ্য
                            </span>
                          )}
                          <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {s.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COMBINED MULTI-DOCUMENT PRINT CANVAS */}
          {showCombinedPrint && batchIssuedResults && (
            <div className="bg-white rounded-3xl border-2 border-[#0D5C3A] p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3 print:hidden">
                <div>
                  <h3 className="text-base font-bold text-[#0D5C3A] flex items-center gap-2">
                    <Printer className="w-5 h-5" />
                    সমন্বিত মাল্টি-ডকুমেন্ট প্রিন্ট ভিউ ({batchIssuedResults.length}টি সনদ)
                  </h3>
                  <span className="text-xs text-gray-500">
                    ব্রাউজার প্রিন্ট ডায়ালগ থেকে সরাসরি প্রিন্ট বা সেভ করুন
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    সরাসরি প্রিন্ট করুন (Ctrl+P)
                  </button>
                  <button
                    onClick={() => setShowCombinedPrint(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold"
                  >
                    প্রিভিউ বন্ধ করুন
                  </button>
                </div>
              </div>

              {/* Multi-Document Container */}
              <div className="space-y-8 print:space-y-0">
                {batchDocType === "STUDENT_ID" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4">
                    {batchIssuedResults.map((cert) => (
                      <div key={cert.id} className="border border-dashed border-gray-300 p-2 rounded-2xl bg-white page-break-inside-avoid">
                        <UniversalDocumentRenderer doc={cert} layoutMode="ID_CARD" />
                      </div>
                    ))}
                  </div>
                ) : (
                  batchIssuedResults.map((cert) => (
                    <div key={cert.id} className="break-after-page print:break-after-page mb-6">
                      <UniversalDocumentRenderer doc={cert} layoutMode="A4" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. DOCUMENTS ARCHIVE & LEDGER SUB-TAB */}
      {activeSubTab === "DOCUMENTS" && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchDocuments()}
                placeholder="নম্বর, নাম বা রোল দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  fetchDocuments();
                }}
                className="p-2 border border-gray-300 rounded-xl text-xs outline-none font-semibold text-gray-700 bg-white"
              >
                <option value="">সকল ধরন</option>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.code} value={t.code}>{t.nameBn}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  fetchDocuments();
                }}
                className="p-2 border border-gray-300 rounded-xl text-xs outline-none font-semibold text-gray-700 bg-white"
              >
                <option value="">সকল স্ট্যাটাস</option>
                <option value="ISSUED">বৈধ (VALID)</option>
                <option value="REVOKED">বাতিলকৃত (REVOKED)</option>
              </select>
              <button
                onClick={fetchDocuments}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-xl text-gray-600 transition"
                title="রিফ্রেশ"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200 rounded-2xl overflow-hidden">
              <thead className="bg-[#FDFCF8] text-gray-700 font-bold border-b">
                <tr>
                  <th className="p-3.5">সনদ নম্বর</th>
                  <th className="p-3.5">শিক্ষার্থী</th>
                  <th className="p-3.5">প্রত্যয়নের নাম</th>
                  <th className="p-3.5">ভার্সন</th>
                  <th className="p-3.5">ইস্যুর তারিখ</th>
                  <th className="p-3.5">স্ট্যাটাস</th>
                  <th className="p-3.5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-emerald-50/30 transition">
                    <td className="p-3.5 font-mono font-bold text-[#0D5C3A]">{doc.certificateNumber}</td>
                    <td className="p-3.5 font-bold text-gray-900">
                      {doc.student?.fullNameBn}
                      <span className="block font-mono text-[10px] text-gray-500">{doc.student?.studentIdNumber}</span>
                    </td>
                    <td className="p-3.5 text-gray-800">{doc.titleBn}</td>
                    <td className="p-3.5 font-mono">
                      <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-bold">
                        v{doc.version}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-600 font-mono">{new Date(doc.issueDate).toLocaleDateString("bn-BD")}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.isRevoked ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {doc.isRevoked ? "REVOKED" : "VALID"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleViewDoc(doc.id)}
                        className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-sm inline-flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#0D5C3A]" />
                        প্রিভিউ / প্রিন্ট
                      </button>
                      <a
                        href={`/verify/document/${encodeURIComponent(doc.verificationCode)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-1.5 rounded-xl inline-flex items-center transition"
                        title="পাবলিক ভেরিফিকেশন লিংক"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400">কোনো প্রত্যয়নপত্র পাওয়া যায়নি।</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. REQUESTS SUB-TAB */}
      {activeSubTab === "REQUESTS" && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">অভিভাবকদের প্রত্যয়নপত্র আবেদনের কিউ</h3>
              <p className="text-xs text-gray-500">অভিভাবক পোর্টাল থেকে জমাকৃত আবেদনসমূহ যাচাই ও ইস্যু করুন।</p>
            </div>
            <button onClick={fetchRequests} className="text-xs text-[#0D5C3A] font-bold flex items-center gap-1.5 hover:underline">
              <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200 rounded-2xl overflow-hidden">
              <thead className="bg-[#FDFCF8] text-gray-700 font-bold border-b">
                <tr>
                  <th className="p-3.5">আবেদন নম্বর</th>
                  <th className="p-3.5">শিক্ষার্থী</th>
                  <th className="p-3.5">অভিভাবক</th>
                  <th className="p-3.5">প্রত্যয়নের ধরন</th>
                  <th className="p-3.5">উদ্দেশ্য</th>
                  <th className="p-3.5">স্ট্যাটাস</th>
                  <th className="p-3.5 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="p-3.5 font-mono font-bold text-[#0D5C3A]">{req.requestNumber}</td>
                    <td className="p-3.5 font-bold text-gray-900">
                      {req.student?.fullNameBn}
                      <span className="block font-mono text-[10px] text-gray-500">{req.student?.studentIdNumber}</span>
                    </td>
                    <td className="p-3.5 text-gray-700">
                      {req.guardian?.fullNameBn || "অভিভাবক"}
                      <span className="block font-mono text-[10px] text-gray-500">{req.guardian?.phone}</span>
                    </td>
                    <td className="p-3.5 text-gray-800 font-semibold">{req.documentType}</td>
                    <td className="p-3.5 text-gray-600 max-w-xs truncate">{req.purpose}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === "APPROVED"
                            ? "bg-blue-100 text-blue-800"
                            : req.status === "ISSUED"
                            ? "bg-emerald-100 text-emerald-800"
                            : req.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {req.status === "SUBMITTED" && (
                        <button
                          onClick={() => {
                            setReviewingRequest(req);
                            setReviewAction("APPROVE");
                          }}
                          className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3 py-1 rounded-xl text-[11px] font-bold shadow-sm"
                        >
                          পর্যালোচনা
                        </button>
                      )}
                      {req.status === "APPROVED" && (
                        <button
                          onClick={() => handleIssueRequest(req.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-xl text-[11px] font-bold shadow-sm"
                        >
                          সনদপত্র প্রস্তুত
                        </button>
                      )}
                      {req.status === "ISSUED" && req.certificates?.[0] && (
                        <button
                          onClick={() => handleViewDoc(req.certificates[0].id)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-xl text-[11px] font-bold"
                        >
                          দেখুন
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400">কোনো অপেক্ষমান আবেদন নেই।</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TEMPLATES SUB-TAB */}
      {activeSubTab === "TEMPLATES" && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">কনফিগারযোগ্য ১৩টি অফিশিয়াল টেমপ্লেট ডিরেক্টরি</h3>
              <p className="text-xs text-gray-500">
                টেমপ্লেট আপডেট করলে পরবর্তী সনদপত্রে নতুন সংস্করণ প্রযোজ্য হবে, পূর্ববর্তী সনদের স্ন্যাপশট সম্পূর্ণ অপরিবর্তিত থাকবে।
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="border border-gray-200 rounded-3xl p-5 space-y-2 bg-[#FDFCF8] hover:border-emerald-300 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-gray-900 text-sm block">{tpl.nameBn}</span>
                    <span className="font-mono text-[10px] text-[#0D5C3A] font-semibold">{tpl.code} (v{tpl.version})</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {tpl.documentType}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-200 text-xs text-gray-700 leading-relaxed font-mono whitespace-pre-wrap max-h-32 overflow-y-auto shadow-inner">
                  {tpl.bodyBn}
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                  <span>স্বাক্ষরকারী: <strong className="text-gray-800">{tpl.signatoryTitleBn}</strong></span>
                  <span>ফি: <strong className="text-emerald-800">{tpl.requiresFee ? `৳${tpl.feeAmount}` : "বিনামূল্যে"}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUTOMATION SETTINGS SUB-TAB */}
      {activeSubTab === "AUTOMATION" && (
        <DocumentAutomationSettingsTab />
      )}

      {/* 7. INTELLIGENCE & DIGITAL ARCHIVE */}
      {activeSubTab === "INTELLIGENCE" && (
        <DocumentIntelligenceTab />
      )}

      {/* VIEW & PRINT OFFICIAL CERTIFICATE MODAL */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto border border-gray-100">
            {/* Top Toolbar */}
            <div className="flex flex-wrap justify-between items-center border-b pb-4 gap-3 print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs sm:text-sm font-bold text-[#0D5C3A] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {viewingDoc.certificateNumber}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${viewingDoc.isRevoked ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                  {viewingDoc.isRevoked ? "REVOKED" : "VALID"}
                </span>
                {viewingDoc.version > 1 && (
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    v{viewingDoc.version}
                  </span>
                )}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-[10px] font-bold ml-1 sm:ml-3">
                  <button
                    onClick={() => setPrintLayoutMode("A4")}
                    className={`px-2.5 py-1 rounded-lg transition ${printLayoutMode === "A4" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600"}`}
                  >
                    A4
                  </button>
                  <button
                    onClick={() => setPrintLayoutMode("ID_CARD")}
                    className={`px-2.5 py-1 rounded-lg transition ${printLayoutMode === "ID_CARD" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600"}`}
                  >
                    ID কার্ড
                  </button>
                  <button
                    onClick={() => setPrintLayoutMode("THERMAL_80MM")}
                    className={`px-2.5 py-1 rounded-lg transition ${printLayoutMode === "THERMAL_80MM" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600"}`}
                  >
                    ৮০ মিমি
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  প্রিন্ট / PDF
                </button>
                {!viewingDoc.isRevoked && (
                  <button
                    onClick={() => setShowRevokeModal(true)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    বাতিল (Revoke)
                  </button>
                )}
                <button
                  onClick={() => setShowReissueModal(true)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  রি-ইস্যু (Reissue)
                </button>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 leading-none transition"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Official Print Layout Canvas */}
            <div className="p-2 sm:p-4 bg-gray-50/50 rounded-2xl border border-gray-200/60 flex items-center justify-center">
              <UniversalDocumentRenderer doc={viewingDoc} layoutMode={printLayoutMode} />
            </div>

            {/* Reissue History Audit if present */}
            {viewingDoc.reissuedFrom && (
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-xs text-gray-600 print:hidden">
                <span className="font-semibold text-gray-800">রি-ইস্যু ইতিহাস:</span> এটি পূর্বে ইস্যুকৃত{" "}
                <span className="font-mono font-bold text-[#0D5C3A]">{viewingDoc.reissuedFrom.certificateNumber}</span> (v{viewingDoc.reissuedFrom.version})-এর সংশোধিত সংস্করণ।
              </div>
            )}
          </div>
        </div>
      )}

      {/* REVOCATION REASON MODAL */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-red-900 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-red-600" />
              প্রত্যয়নপত্র বাতিলের কারণ উল্লেখ করুন
            </h3>
            <p className="text-xs text-gray-500">
              বাতিল করা হলে পাবলিক ভেরিফিকেশন পেজে বড় লাল সতর্কবার্তাসহ &apos;REVOKED&apos; প্রদর্শিত হবে।
            </p>
            <textarea
              required
              rows={3}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="যেমন: তথ্যে ভুল থাকায় অথবা শিক্ষার্থীর অনুরোধে বাতিল করা হলো..."
              className="w-full p-3 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-600"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-gray-600 font-semibold"
              >
                ফিরে যান
              </button>
              <button
                onClick={handleRevokeSubmit}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold shadow transition"
              >
                বাতিল নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REISSUE MODAL */}
      {showReissueModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              প্রত্যয়নপত্র পুনরায় ইস্যু (Reissue)
            </h3>
            <p className="text-xs text-gray-500">
              পূর্ববর্তী সনদটি স্বয়ংক্রিয়ভাবে বাতিল হবে এবং নতুন সংস্করণ v{(viewingDoc?.version || 1) + 1} সহ নতুন ভেরিফিকেশন কিউআর তৈরি হবে।
            </p>
            <textarea
              required
              rows={3}
              value={reissueReason}
              onChange={(e) => setReissueReason(e.target.value)}
              placeholder="পুনরায় ইস্যু করার কারণ (যেমন: নাম সংশোধন, শ্রেণি পরিবর্তন)..."
              className="w-full p-3 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-600"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowReissueModal(false)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-gray-600 font-semibold"
              >
                ফিরে যান
              </button>
              <button
                onClick={handleReissueSubmit}
                className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-xl font-bold shadow transition"
              >
                পুনরায় ইস্যু সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW REQUEST MODAL */}
      {reviewingRequest && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-gray-900">অভিভাবক আবেদন পর্যালোচনা</h3>
            <div className="bg-gray-50 p-3.5 rounded-2xl text-xs space-y-1">
              <p><span className="font-semibold">শিক্ষার্থী:</span> {reviewingRequest.student?.fullNameBn}</p>
              <p><span className="font-semibold">প্রত্যয়নের ধরন:</span> {reviewingRequest.documentType}</p>
              <p><span className="font-semibold">উদ্দেশ্য:</span> {reviewingRequest.purpose}</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="reviewAction"
                  checked={reviewAction === "APPROVE"}
                  onChange={() => setReviewAction("APPROVE")}
                  className="accent-[#0D5C3A]"
                />
                অনুমোদন (Approve)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-red-600">
                <input
                  type="radio"
                  name="reviewAction"
                  checked={reviewAction === "REJECT"}
                  onChange={() => setReviewAction("REJECT")}
                  className="accent-red-600"
                />
                প্রত্যাখ্যান (Reject)
              </label>
            </div>
            {reviewAction === "REJECT" && (
              <textarea
                rows={2}
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="প্রত্যাখ্যানের কারণ উল্লেখ করুন..."
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none"
              />
            )}
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setReviewingRequest(null)}
                className="px-3 py-2 border rounded-xl text-gray-600 font-semibold"
              >
                বাতিল
              </button>
              <button
                onClick={handleReviewRequestSubmit}
                className="bg-[#0D5C3A] text-white px-4 py-2 rounded-xl font-bold shadow"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
