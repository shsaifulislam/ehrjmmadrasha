"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { DOCUMENT_TYPES } from "@/lib/documentFactory";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function AdminDocumentHub() {
  const [activeSubTab, setActiveSubTab] = useState<"OVERVIEW" | "GENERATE" | "REQUESTS" | "DOCUMENTS" | "TEMPLATES">("OVERVIEW");
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

  // Requests state
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<any[]>([]);

  // Generation Wizard State
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedDocType, setSelectedDocType] = useState<string>("STUDY_CERTIFICATE");
  const [customNotes, setCustomNotes] = useState("");
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);

  // Selected Document View/Print Modal
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [showReissueModal, setShowReissueModal] = useState(false);
  const [reissueReason, setReissueReason] = useState("");

  // Request review modal
  const [reviewingRequest, setReviewingRequest] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reviewReason, setReviewReason] = useState("");

  // Load Initial Data
  useEffect(() => {
    fetchDocuments();
    fetchRequests();
    fetchTemplates();
    fetchStudents();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/documents", window.location.origin);
      if (searchTerm) url.searchParams.set("search", searchTerm);
      if (filterType) url.searchParams.set("type", filterType);
      if (filterStatus) url.searchParams.set("status", filterStatus);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents || []);
        if (data.stats) setStats(data.stats);
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
      if (res.ok) {
        setRequests(data.requests || []);
      }
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

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/admin/students?limit=100");
      const data = await res.json();
      if (res.ok) setStudents(data.students || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Generate Document
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedDocType) {
      setErrorMsg("শিক্ষার্থী ও প্রত্যয়নপত্রের ধরন নির্বাচন করুন।");
      return;
    }
    setGenerating(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          documentType: selectedDocType,
          customNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("প্রত্যয়নপত্র সফলভাবে ইস্যু করা হয়েছে!");
        setSelectedStudentId("");
        setCustomNotes("");
        fetchDocuments();
        // Open preview modal
        handleViewDoc(data.certificate.id);
      } else {
        setErrorMsg(data.error || "প্রত্যয়নপত্র তৈরি করা যায়নি।");
      }
    } catch {
      setErrorMsg("সার্ভার ত্রুটি। পুনরায় চেষ্টা করুন।");
    } finally {
      setGenerating(false);
    }
  };

  // View Doc Detail
  const handleViewDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/documents/${id}`);
      const data = await res.json();
      if (res.ok && data.document) {
        setViewingDoc(data.document);
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

  // Handle Review Request Submit
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
      {/* Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex justify-between items-center shadow-sm">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="font-bold text-emerald-950">&times;</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex justify-between items-center shadow-sm">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="font-bold text-red-950">&times;</button>
        </div>
      )}

      {/* Top Header & Sub-Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0B1914] flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#0D5C3A]" />
            সনদপত্র ও প্রত্যয়ন ফ্যাক্টরি (Document Factory)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            অফিশিয়াল প্রত্যয়নপত্র ইস্যু, কিউআর ভেরিফিকেশন, স্টুডেন্ট আইডি ও অভিভাবক আবেদন ব্যবস্থাপনা
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab("OVERVIEW")}
            className={`px-3 py-1.5 rounded-md transition ${activeSubTab === "OVERVIEW" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600 hover:text-gray-900"}`}
          >
            ওভারভিউ
          </button>
          <button
            onClick={() => setActiveSubTab("GENERATE")}
            className={`px-3 py-1.5 rounded-md transition ${activeSubTab === "GENERATE" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600 hover:text-gray-900"}`}
          >
            নতুন ইস্যু করুন
          </button>
          <button
            onClick={() => setActiveSubTab("REQUESTS")}
            className={`px-3 py-1.5 rounded-md transition relative ${activeSubTab === "REQUESTS" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600 hover:text-gray-900"}`}
          >
            আবেদন কিউ
            {stats.pendingRequests > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {stats.pendingRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("DOCUMENTS")}
            className={`px-3 py-1.5 rounded-md transition ${activeSubTab === "DOCUMENTS" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600 hover:text-gray-900"}`}
          >
            ইস্যুকৃত সনদপত্র ({stats.totalDocuments})
          </button>
          <button
            onClick={() => setActiveSubTab("TEMPLATES")}
            className={`px-3 py-1.5 rounded-md transition ${activeSubTab === "TEMPLATES" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600 hover:text-gray-900"}`}
          >
            টেমপ্লেটসমূহ
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW SUB-TAB */}
      {activeSubTab === "OVERVIEW" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <span className="text-xs text-gray-500 font-medium block mb-1">মোট প্রত্যয়নপত্র</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-[#0B1914]">{stats.totalDocuments}</span>
            </div>
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 shadow-sm">
              <span className="text-xs text-emerald-800 font-medium block mb-1">সক্রিয় ও কার্যকর (Valid)</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-900">{stats.totalIssued}</span>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 shadow-sm">
              <span className="text-xs text-amber-800 font-medium block mb-1">অপেক্ষমান আবেদন (Pending)</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-amber-900">{stats.pendingRequests}</span>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4 shadow-sm">
              <span className="text-xs text-red-800 font-medium block mb-1">বাতিলকৃত (Revoked)</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-red-900">{stats.totalRevoked}</span>
            </div>
          </div>

          {/* Quick Actions & Recent Documents */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4 md:col-span-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">দ্রুত প্রত্যয়নপত্র তৈরি</h3>
              <div className="space-y-2 text-xs">
                {DOCUMENT_TYPES.slice(0, 5).map((t) => (
                  <button
                    key={t.code}
                    onClick={() => {
                      setSelectedDocType(t.code);
                      setActiveSubTab("GENERATE");
                    }}
                    className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:border-[#0D5C3A] hover:bg-[#F9F8F3] transition flex items-center justify-between group"
                  >
                    <span className="font-semibold text-gray-800 group-hover:text-[#0D5C3A]">{t.nameBn}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0D5C3A]" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4 md:col-span-2">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">সাম্প্রতিক ইস্যুকৃত প্রত্যয়নপত্র</h3>
                <button onClick={() => setActiveSubTab("DOCUMENTS")} className="text-xs text-[#0D5C3A] hover:underline font-semibold">
                  সকল দেখুন
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-gray-500 border-b">
                    <tr>
                      <th className="pb-2">নম্বর</th>
                      <th className="pb-2">শিক্ষার্থী</th>
                      <th className="pb-2">ধরন</th>
                      <th className="pb-2">তারিখ</th>
                      <th className="pb-2 text-right">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documents.slice(0, 5).map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDoc(doc.id)}>
                        <td className="py-2.5 font-mono font-bold text-[#0D5C3A]">{doc.certificateNumber}</td>
                        <td className="py-2.5 font-semibold text-gray-900">{doc.student.fullNameBn}</td>
                        <td className="py-2.5 text-gray-600">{doc.titleBn}</td>
                        <td className="py-2.5 text-gray-500">{new Date(doc.issueDate).toLocaleDateString("bn-BD")}</td>
                        <td className="py-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${doc.status === "REVOKED" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {doc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {documents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-400">কোনো প্রত্যয়নপত্র পাওয়া যায়নি।</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. GENERATE SUB-TAB */}
      {activeSubTab === "GENERATE" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="border-b pb-3">
            <h3 className="text-sm font-bold text-gray-900">নতুন অফিশিয়াল প্রত্যয়নপত্র বা আইডি কার্ড ইস্যু</h3>
            <p className="text-xs text-gray-500">অনুমোদিত প্রাতিষ্ঠানিক ডাটাবেজ থেকে স্বয়ংক্রিয়ভাবে তথ্য নিয়ে প্রত্যয়নপত্র তৈরি হবে।</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">শিক্ষার্থী নির্বাচন করুন *</label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0D5C3A]"
              >
                <option value="">-- শিক্ষার্থী বাছাই করুন --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullNameBn} ({s.studentIdNumber}) - {s.enrollments?.[0]?.jamatClass?.nameBn || "শ্রেণি"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">প্রত্যয়নপত্রের ধরন *</label>
              <select
                required
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0D5C3A]"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.nameBn} ({t.nameEn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">বিশেষ কোনো মন্তব্য বা নোট (ঐচ্ছিক)</label>
              <textarea
                rows={3}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="যেমন: অভিভাবকের অনুরোধে পাসপোর্ট বা ভর্তির সুবিধার্থে প্রদত্ত..."
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0D5C3A]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveSubTab("OVERVIEW")}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={generating}
                className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-5 py-2 rounded-lg font-semibold shadow disabled:opacity-50 flex items-center gap-1.5"
              >
                {generating ? "প্রস্তুত হচ্ছে..." : "ইস্যু করুন ও প্রিভিউ দেখুন"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. REQUESTS QUEUE SUB-TAB */}
      {activeSubTab === "REQUESTS" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-sm font-bold text-gray-900">অভিভাবকদের প্রত্যয়নপত্র আবেদনের তালিকা</h3>
            <button onClick={fetchRequests} className="text-xs text-[#0D5C3A] flex items-center gap-1 hover:underline">
              <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                <tr>
                  <th className="p-3">আবেদন নম্বর</th>
                  <th className="p-3">শিক্ষার্থী</th>
                  <th className="p-3">অভিভাবক</th>
                  <th className="p-3">প্রত্যয়নের ধরন</th>
                  <th className="p-3">উদ্দেশ্য</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-[#0D5C3A]">{req.requestNumber}</td>
                    <td className="p-3 font-semibold text-gray-900">
                      {req.student.fullNameBn}
                      <span className="block font-mono text-[10px] text-gray-500">{req.student.studentIdNumber}</span>
                    </td>
                    <td className="p-3 text-gray-700">
                      {req.guardian?.fullNameBn || "অভিভাবক"}
                      <span className="block font-mono text-[10px] text-gray-500">{req.guardian?.phone}</span>
                    </td>
                    <td className="p-3 text-gray-800 font-medium">{req.documentType}</td>
                    <td className="p-3 text-gray-600 max-w-xs truncate">{req.purpose}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                    <td className="p-3 text-right space-x-2">
                      {req.status === "SUBMITTED" && (
                        <button
                          onClick={() => {
                            setReviewingRequest(req);
                            setReviewAction("APPROVE");
                          }}
                          className="bg-[#0D5C3A] text-white px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-[#158052]"
                        >
                          পর্যালোচনা
                        </button>
                      )}
                      {req.status === "APPROVED" && (
                        <button
                          onClick={() => handleIssueRequest(req.id)}
                          className="bg-emerald-600 text-white px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-emerald-700"
                        >
                          সনদপত্র প্রস্তুত
                        </button>
                      )}
                      {req.status === "ISSUED" && req.certificates?.[0] && (
                        <button
                          onClick={() => handleViewDoc(req.certificates[0].id)}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[11px] font-semibold hover:bg-gray-200"
                        >
                          দেখুন
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-400">কোনো অপেক্ষমান আবেদন নেই।</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DOCUMENTS LIST SUB-TAB */}
      {activeSubTab === "DOCUMENTS" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchDocuments()}
                placeholder="নম্বর, নাম বা রোল দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  fetchDocuments();
                }}
                className="p-1.5 border border-gray-300 rounded-lg text-xs outline-none"
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
                className="p-1.5 border border-gray-300 rounded-lg text-xs outline-none"
              >
                <option value="">সকল স্ট্যাটাস</option>
                <option value="ISSUED">বৈধ (ISSUED)</option>
                <option value="REVOKED">বাতিলকৃত (REVOKED)</option>
              </select>
              <button
                onClick={fetchDocuments}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg text-gray-600"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200">
              <thead className="bg-[#F9F8F3] text-gray-700 font-semibold border-b">
                <tr>
                  <th className="p-3">সনদ নম্বর</th>
                  <th className="p-3">শিক্ষার্থী</th>
                  <th className="p-3">প্রত্যয়নের নাম</th>
                  <th className="p-3">ভার্সন</th>
                  <th className="p-3">ইস্যুর তারিখ</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-[#0D5C3A]">{doc.certificateNumber}</td>
                    <td className="p-3 font-semibold text-gray-900">
                      {doc.student.fullNameBn}
                      <span className="block font-mono text-[10px] text-gray-500">{doc.student.studentIdNumber}</span>
                    </td>
                    <td className="p-3 text-gray-800">{doc.titleBn}</td>
                    <td className="p-3 font-mono">v{doc.version}</td>
                    <td className="p-3 text-gray-600">{new Date(doc.issueDate).toLocaleDateString("bn-BD")}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.isRevoked ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {doc.isRevoked ? "REVOKED" : "VALID"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleViewDoc(doc.id)}
                        className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-2.5 py-1 rounded text-[11px] font-semibold shadow-sm inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-gray-500" />
                        প্রিভিউ / প্রিন্ট
                      </button>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">কোনো প্রত্যয়নপত্র পাওয়া যায়নি।</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TEMPLATES SUB-TAB */}
      {activeSubTab === "TEMPLATES" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">কনফিগারযোগ্য প্রত্যয়নপত্র টেমপ্লেটসমূহ</h3>
              <p className="text-xs text-gray-500">টেমপ্লেট আপডেট করলে পরবর্তী সনদপত্রে নতুন ভার্সন প্রযোজ্য হবে, পূর্ববর্তী সনদের ডাটা স্ন্যাপশট অক্ষুণ্ণ থাকবে।</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="border border-gray-200 rounded-xl p-4 space-y-2 bg-[#F9F8F3]/50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-gray-900 text-sm">{tpl.nameBn}</span>
                    <span className="font-mono text-[10px] text-gray-500 block">{tpl.code} (v{tpl.version})</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {tpl.documentType}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs text-gray-700 leading-relaxed font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {tpl.bodyBn}
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 pt-1">
                  <span>স্বাক্ষরকারী: {tpl.signatoryTitleBn}</span>
                  <span>ফি: {tpl.requiresFee ? `৳${tpl.feeAmount}` : "বিনামূল্যে"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW & PRINT OFFICIAL CERTIFICATE MODAL */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            {/* Top Toolbar */}
            <div className="flex justify-between items-center border-b pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#0D5C3A]">{viewingDoc.certificateNumber}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${viewingDoc.isRevoked ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                  {viewingDoc.isRevoked ? "REVOKED" : "VALID"}
                </span>
                {viewingDoc.version > 1 && (
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    v{viewingDoc.version}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  প্রিন্ট / PDF
                </button>
                {!viewingDoc.isRevoked && (
                  <button
                    onClick={() => setShowRevokeModal(true)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    বাতিল (Revoke)
                  </button>
                )}
                <button
                  onClick={() => setShowReissueModal(true)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  পুনরায় ইস্যু (Reissue)
                </button>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Official Print Layout (A4 Certificate Canvas) */}
            <div className="border-4 border-[#083B25] p-8 sm:p-10 rounded-xl bg-[#FFFDF7] relative overflow-hidden text-center space-y-6 print:border-2 print:p-6 print:m-0">
              {/* Institutional Watermark Pattern */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none text-9xl font-bold font-serif">
                EHRJ
              </div>

              {/* Certificate Header */}
              <div className="space-y-1.5 border-b-2 border-[#C59B27] pb-4">
                <span className="text-[11px] font-semibold text-emerald-900 tracking-wider">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>
                <h1 className="text-xl sm:text-2xl font-bold font-display text-[#083B25]">
                  {INSTITUTION_INFO.nameBn}
                </h1>
                <p className="text-xs text-gray-600 font-serif">{INSTITUTION_INFO.nameEn}</p>
                <p className="text-[11px] text-gray-500">পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা | স্থাপিত: ২০২১ খ্রি.</p>
              </div>

              {/* Title Badge */}
              <div className="inline-block bg-[#083B25] text-amber-300 border border-[#C59B27] px-6 py-1.5 rounded-full text-sm font-bold shadow-sm">
                {viewingDoc.titleBn || "অফিশিয়াল প্রত্যয়নপত্র"}
              </div>

              {/* Revoked watermark if revoked */}
              {viewingDoc.isRevoked && (
                <div className="bg-red-50 border-2 border-red-400 p-2 rounded text-red-800 text-xs font-bold uppercase tracking-wider">
                  ⚠ এই সনদপত্রটি মাদরাসা কর্তৃপক্ষ কর্তৃক আনুষ্ঠানিকভাবে বাতিল (REVOKED) করা হয়েছে। কারণ: {viewingDoc.revokeReason}
                </div>
              )}

              {/* Certificate Body Text */}
              <div className="text-justify text-xs sm:text-sm text-gray-800 leading-relaxed space-y-4 px-2 sm:px-6">
                <p className="whitespace-pre-line">
                  {viewingDoc.parsedSnapshot?.renderedContent?.bodyBn || viewingDoc.metadataJson || "প্রত্যয়নপত্রের বিস্তারিত..."}
                </p>
              </div>

              {/* Bottom Signatures & QR Code */}
              <div className="pt-8 border-t border-gray-200 flex justify-between items-end px-2 sm:px-4 text-xs">
                {/* QR Code Verification */}
                <div className="text-center space-y-1">
                  {viewingDoc.qrCodeUrl && (
                    <img src={viewingDoc.qrCodeUrl} alt="QR Code" className="w-20 h-20 mx-auto border p-1 bg-white rounded shadow-sm" />
                  )}
                  <span className="text-[10px] text-gray-500 font-mono block">ভেরিফিকেশন স্ক্যান</span>
                  <span className="text-[9px] font-mono font-bold text-gray-700 block">{viewingDoc.verificationCode}</span>
                </div>

                {/* Institutional Seal */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#0D5C3A] mx-auto flex items-center justify-center text-[10px] font-bold text-[#0D5C3A] uppercase p-1">
                    প্রাতিষ্ঠানিক সিলমোহর
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    তারিখ: {new Date(viewingDoc.issueDate).toLocaleDateString("bn-BD")}
                  </span>
                </div>

                {/* Signatory Officer */}
                <div className="text-center space-y-1">
                  <div className="w-32 border-b border-gray-800 pb-1 mb-1 mx-auto font-cursive text-sm text-gray-800">
                    মুহাম্মদুল্লাহ
                  </div>
                  <span className="font-bold text-gray-900 block text-xs">
                    {viewingDoc.parsedSnapshot?.renderedContent?.signatoryTitleBn || "মুহতামিম ও অধ্যক্ষ"}
                  </span>
                  <span className="text-[10px] text-gray-500 block">{INSTITUTION_INFO.principal}</span>
                </div>
              </div>
            </div>

            {/* Reissue History Audit if present */}
            {viewingDoc.reissuedFrom && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-600 print:hidden">
                <span className="font-semibold text-gray-800">রি-ইস্যু ইতিহাস:</span> এটি পূর্বে ইস্যুকৃত{" "}
                <span className="font-mono font-bold text-[#0D5C3A]">{viewingDoc.reissuedFrom.certificateNumber}</span> (v{viewingDoc.reissuedFrom.version})-এর সংশোধিত সংস্করণ।
              </div>
            )}
          </div>
        </div>
      )}

      {/* REVOCATION REASON MODAL */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-red-900 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-red-600" />
              প্রত্যয়নপত্র বাতিলের কারণ উল্লেখ করুন
            </h3>
            <textarea
              required
              rows={3}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="যেমন: তথ্যে ভুল থাকায় অথবা শিক্ষার্থীর অনুরোধে বাতিল করা হলো..."
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-red-600"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-gray-600"
              >
                বাতিল
              </button>
              <button
                onClick={handleRevokeSubmit}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded font-semibold"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REISSUE MODAL */}
      {showReissueModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              প্রত্যয়নপত্র পুনরায় ইস্যু (Reissue)
            </h3>
            <p className="text-xs text-gray-500">
              পূর্ববর্তী সনদটি স্বয়ংক্রিয়ভাবে বাতিল হবে এবং ভার্সন {viewingDoc.version + 1} সহ নতুন ভেরিফিকেশন কিউআর তৈরি হবে।
            </p>
            <textarea
              required
              rows={3}
              value={reissueReason}
              onChange={(e) => setReissueReason(e.target.value)}
              placeholder="পুনরায় ইস্যু করার কারণ (যেমন: নাম সংশোধন, শ্রেণি পরিবর্তন)..."
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-600"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowReissueModal(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-gray-600"
              >
                ফিরে যান
              </button>
              <button
                onClick={handleReissueSubmit}
                className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-1.5 rounded font-semibold"
              >
                পুনরায় ইস্যু সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW REQUEST MODAL */}
      {reviewingRequest && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-gray-900">অভিভাবক আবেদন পর্যালোচনা</h3>
            <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
              <p><span className="font-semibold">শিক্ষার্থী:</span> {reviewingRequest.student?.fullNameBn}</p>
              <p><span className="font-semibold">প্রত্যয়নের ধরন:</span> {reviewingRequest.documentType}</p>
              <p><span className="font-semibold">উদ্দেশ্য:</span> {reviewingRequest.purpose}</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="reviewAction"
                  checked={reviewAction === "APPROVE"}
                  onChange={() => setReviewAction("APPROVE")}
                />
                অনুমোদন (Approve)
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-red-600">
                <input
                  type="radio"
                  name="reviewAction"
                  checked={reviewAction === "REJECT"}
                  onChange={() => setReviewAction("REJECT")}
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
                className="w-full p-2 border border-gray-300 rounded text-xs"
              />
            )}
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setReviewingRequest(null)}
                className="px-3 py-1.5 border rounded text-gray-600"
              >
                বাতিল
              </button>
              <button
                onClick={handleReviewRequestSubmit}
                className="bg-[#0D5C3A] text-white px-4 py-1.5 rounded font-semibold"
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
