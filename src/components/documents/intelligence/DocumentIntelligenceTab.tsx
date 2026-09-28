"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Hash,
  Eye,
  Lock,
  Unlock,
  PenTool,
  Clock,
  Layers,
  FileCheck,
  AlertOctagon,
  RefreshCw,
  Sliders,
  Filter,
} from "lucide-react";
import { ArchiveDocument, ExtractedField, IntegrityCheckResult } from "@/lib/document/types";

export default function DocumentIntelligenceTab() {
  const [activeSection, setActiveSection] = useState<"ARCHIVE" | "OCR_QUEUE" | "SIGNATURES" | "HOLDS" | "AUDIT">("ARCHIVE");
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [stats, setStats] = useState({
    totalArchived: 0,
    verifiedCount: 0,
    pendingReviewCount: 0,
    legalHoldCount: 0,
    signedCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Selected document detail view modal
  const [selectedDoc, setSelectedDoc] = useState<ArchiveDocument | null>(null);
  const [integrityState, setIntegrityState] = useState<IntegrityCheckResult | null>(null);
  const [checkingIntegrity, setCheckingIntegrity] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("STUDENT_ID");
  const [uploadEntityId, setUploadEntityId] = useState("");
  const [uploadEntityName, setUploadEntityName] = useState("");
  const [uploadFileContent, setUploadFileContent] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  // Sign modal state
  const [signingDocId, setSigningDocId] = useState<string | null>(null);
  const [watermark, setWatermark] = useState<"OFFICIAL" | "DRAFT" | "COPY">("OFFICIAL");
  const [signingMethod, setSigningMethod] = useState("OFFICIAL_DIGITAL_STAMP");
  const [signingLoading, setSigningLoading] = useState(false);

  // Legal Hold modal state
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdDocId, setHoldDocId] = useState<string | null>(null);
  const [holdReason, setHoldReason] = useState("");
  const [holdRef, setHoldRef] = useState("");

  // Extracted field edit modal
  const [editingField, setEditingField] = useState<ExtractedField | null>(null);
  const [editFieldValue, setEditFieldValue] = useState("");

  useEffect(() => {
    fetchArchive();
  }, [searchTerm, filterType, filterStatus]);

  const fetchArchive = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/documents/intelligence", window.location.origin);
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !uploadEntityId || !uploadFileContent) {
      setMsg({ text: "দয়া করে সকল আবশ্যকীয় তথ্য পূরণ করুন।", type: "error" });
      return;
    }
    setUploading(true);
    try {
      const res = await fetch("/api/admin/documents/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INGEST",
          title: uploadTitle,
          documentType: uploadType,
          entityType: "STUDENT",
          entityId: uploadEntityId,
          entityName: uploadEntityName,
          fileName: uploadFileName || "uploaded_document.pdf",
          mimeType: "application/pdf",
          fileContentBase64: uploadFileContent,
          retentionYears: 5,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: "দলিল সফলভাবে আর্কাইভে সংরক্ষিত হয়েছে!", type: "success" });
        setShowUploadModal(false);
        resetUploadForm();
        fetchArchive();
      } else {
        setMsg({ text: data.error || "সংরক্ষণ ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch {
      setMsg({ text: "সার্ভার এরর।", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadTitle("");
    setUploadEntityId("");
    setUploadEntityName("");
    setUploadFileContent("");
    setUploadFileName("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setUploadFileContent(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTriggerOcr = async (docId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/documents/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PROCESS_OCR", documentId: docId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: "OCR প্রসেসিং সম্পন্ন হয়েছে! তথ্য এক্সট্র্যাক্ট করা হয়েছে।", type: "success" });
        fetchArchive();
        if (selectedDoc?.id === docId) {
          setSelectedDoc(data.document);
        }
      } else {
        setMsg({ text: data.error || "OCR প্রসেসিং ব্যর্থ।", type: "error" });
      }
    } catch {
      setMsg({ text: "সার্ভার এরর।", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyField = async (
    fieldId: string,
    fieldAction: "CONFIRM" | "EDIT_AND_CONFIRM" | "REJECT",
    confirmedValue?: string
  ) => {
    if (!selectedDoc) return;
    try {
      const res = await fetch("/api/admin/documents/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_FIELD",
          documentId: selectedDoc.id,
          fieldId,
          fieldAction,
          confirmedValue,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: "ফিল্ড সফলভাবে যাচাই করা হয়েছে!", type: "success" });
        // Refresh local selected document fields
        const updatedFields = selectedDoc.extractedFields.map((f) =>
          f.id === fieldId ? data.field : f
        );
        setSelectedDoc({ ...selectedDoc, extractedFields: updatedFields });
        setEditingField(null);
        fetchArchive();
      } else {
        setMsg({ text: data.error || "যাচাইকরণ ব্যর্থ।", type: "error" });
      }
    } catch {
      setMsg({ text: "সার্ভার এরর।", type: "error" });
    }
  };

  const handleExecuteSign = async () => {
    if (!signingDocId) return;
    setSigningLoading(true);
    try {
      const res = await fetch("/api/admin/documents/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SIGN_DIGITALLY",
          documentId: signingDocId,
          watermark,
          signingMethod,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: "দলিলটিতে ডিজিটাল প্রাতিষ্ঠানিক স্বাক্ষর সংযুক্ত হয়েছে!", type: "success" });
        setSigningDocId(null);
        fetchArchive();
        if (selectedDoc?.id === signingDocId) {
          setSelectedDoc({
            ...selectedDoc,
            signatures: [...(selectedDoc.signatures || []), data.signature],
          });
        }
      } else {
        setMsg({ text: data.error || "স্বাক্ষর ব্যর্থ।", type: "error" });
      }
    } catch {
      setMsg({ text: "সার্ভার এরর।", type: "error" });
    } finally {
      setSigningLoading(false);
    }
  };

  const handleToggleHold = async (docId: string, action: "APPLY" | "RELEASE") => {
    try {
      const res = await fetch("/api/admin/documents/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LEGAL_HOLD",
          documentId: docId,
          holdAction: action,
          reason: holdReason || "বিধিবদ্ধ অডিট ও প্রাতিষ্ঠানিক নীতি অনুসারে সংরক্ষিত",
          caseReference: holdRef,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({
          text: action === "APPLY" ? "লিগ্যাল হোল্ড জারি করা হয়েছে!" : "লিগ্যাল হোল্ড প্রত্যাহার করা হয়েছে।",
          type: "success",
        });
        setShowHoldModal(false);
        setHoldDocId(null);
        setHoldReason("");
        setHoldRef("");
        fetchArchive();
      } else {
        setMsg({ text: data.error || "অ্যাকশন ব্যর্থ।", type: "error" });
      }
    } catch {
      setMsg({ text: "সার্ভার এরর।", type: "error" });
    }
  };

  const handleCheckIntegrity = async (docId: string) => {
    setCheckingIntegrity(true);
    try {
      const res = await fetch(`/api/admin/documents/intelligence?action=integrity&docId=${docId}`);
      const data = await res.json();
      if (res.ok) {
        setIntegrityState(data.integrity);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingIntegrity(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {msg && (
        <div
          className={`p-3 rounded-xl border text-xs flex justify-between items-center shadow-sm ${
            msg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-bold text-lg leading-none">&times;</button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          <span className="text-[11px] text-gray-500 font-medium block">ডিজিটাল আর্কাইভ দলিল</span>
          <span className="text-xl font-bold font-mono text-[#0B1914]">{stats.totalArchived}</span>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3 shadow-sm">
          <span className="text-[11px] text-emerald-800 font-medium block">যাচাইকৃত (Verified)</span>
          <span className="text-xl font-bold font-mono text-emerald-900">{stats.verifiedCount}</span>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 shadow-sm">
          <span className="text-[11px] text-amber-800 font-medium block">OCR রিভিউ বাকি</span>
          <span className="text-xl font-bold font-mono text-amber-900">{stats.pendingReviewCount}</span>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-3 shadow-sm">
          <span className="text-[11px] text-purple-800 font-medium block">ডিজিটাল স্বাক্ষরিত</span>
          <span className="text-xl font-bold font-mono text-purple-900">{stats.signedCount}</span>
        </div>
        <div className="bg-rose-50 rounded-xl border border-rose-200 p-3 shadow-sm">
          <span className="text-[11px] text-rose-800 font-medium block">লিগ্যাল হোল্ড (Protected)</span>
          <span className="text-xl font-bold font-mono text-rose-900">{stats.legalHoldCount}</span>
        </div>
      </div>

      {/* Actions and Sub-tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveSection("ARCHIVE")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeSection === "ARCHIVE" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            আর্কাইভ ও ফাইল তালিকা
          </button>
          <button
            onClick={() => setActiveSection("OCR_QUEUE")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeSection === "OCR_QUEUE" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            OCR ও ফিল্ড এক্সট্র্যাকশন
          </button>
          <button
            onClick={() => setActiveSection("SIGNATURES")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeSection === "SIGNATURES" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            ডিজিটাল স্বাক্ষর রেকর্ড
          </button>
          <button
            onClick={() => setActiveSection("HOLDS")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeSection === "HOLDS" ? "bg-white text-[#0D5C3A] shadow font-bold" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            লিগ্যাল হোল্ড ও রিটেনশন
          </button>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-[#0D5C3A] hover:bg-[#083B25] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
        >
          <Upload className="w-3.5 h-3.5" />
          আর্কাইভে নতুন দলিল জমা দিন
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm flex flex-col sm:flex-row items-center gap-2 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="দলিলের নাম, আইডি, শিক্ষার্থী বা ফাইলের নাম দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0D5C3A]"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 w-full sm:w-auto"
        >
          <option value="">সকল দলিলের প্রকার</option>
          <option value="STUDENT_ID">স্টুডেন্ট আইডি</option>
          <option value="BIRTH_REGISTRATION">জন্ম নিবন্ধন</option>
          <option value="NID_STUDENT">জাতীয় পরিচয়পত্র (শিক্ষার্থী)</option>
          <option value="STUDY_CERTIFICATE">অধ্যয়ন প্রত্যয়নপত্র</option>
          <option value="CHARACTER_CERTIFICATE">চারিত্রিক সনদপত্র</option>
          <option value="TRANSFER_CERTIFICATE">ছাড়পত্র (TC)</option>
          <option value="PAYMENT_RECEIPT">পেমেন্ট রসিদ</option>
          <option value="APPOINTMENT_LETTER">নিয়োগপত্র (HR)</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 w-full sm:w-auto"
        >
          <option value="">সকল অবস্থা</option>
          <option value="UPLOADED">আপলোডকৃত</option>
          <option value="OCR_COMPLETED">OCR সম্পন্ন</option>
          <option value="VERIFIED">যাচাইকৃত</option>
          <option value="ARCHIVED">আর্কাইভকৃত</option>
        </select>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500">ডাটা লোড হচ্ছে...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">কোনো দলিল পাওয়া যায়নি।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <th className="p-3">স্মারক / দলিল আইডি</th>
                  <th className="p-3">শিরোনাম ও প্রকার</th>
                  <th className="p-3">মালিকানা / রেফারেন্স</th>
                  <th className="p-3">সংস্করণ ও হ্যাশ</th>
                  <th className="p-3">OCR ও যাচাই</th>
                  <th className="p-3">স্বাক্ষর / হোল্ড</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/60 transition">
                    <td className="p-3 font-mono font-medium text-gray-900">
                      {doc.id}
                      <span className="block text-[10px] text-gray-400 font-sans">
                        {new Date(doc.createdAt).toLocaleDateString("bn-BD")}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-gray-900">{doc.title}</div>
                      <span className="inline-block bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[10px] mt-0.5">
                        {doc.documentType}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-gray-800 font-medium">{doc.entityName || doc.entityId}</div>
                      <span className="text-[10px] text-gray-500">{doc.entityType} ({doc.entityId})</span>
                    </td>
                    <td className="p-3 font-mono">
                      <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                        v{doc.currentVersion}
                      </span>
                      <span className="block text-[10px] text-gray-400 truncate max-w-[120px]" title={doc.fileHash}>
                        {doc.fileHash.slice(0, 12)}...
                      </span>
                    </td>
                    <td className="p-3">
                      {doc.hasOcrText ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded font-semibold">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            OCR সম্পন্ন ({doc.ocrLanguage})
                          </span>
                          <span className="block text-[10px] text-gray-500">
                            {doc.isVerified ? "মানবিক যাচাইকৃত" : "রিভিউ বাকি"}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleTriggerOcr(doc.id)}
                          className="text-[11px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded font-medium transition"
                        >
                          OCR চালান
                        </button>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        {doc.signatures && doc.signatures.length > 0 ? (
                          <span className="bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                            <PenTool className="w-2.5 h-2.5" />
                            স্বাক্ষরিত ({doc.signatures.length})
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">স্বাক্ষরবিহীন</span>
                        )}
                        {doc.retentionPolicy?.isLegalHoldActive && (
                          <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            LEGAL HOLD
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedDoc(doc);
                            setIntegrityState(null);
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition"
                        >
                          <Eye className="w-3 h-3" />
                          বিস্তারিত
                        </button>
                        <button
                          onClick={() => setSigningDocId(doc.id)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition"
                        >
                          <PenTool className="w-3 h-3" />
                          স্বাক্ষর
                        </button>
                        {doc.retentionPolicy?.isLegalHoldActive ? (
                          <button
                            onClick={() => handleToggleHold(doc.id, "RELEASE")}
                            className="bg-gray-50 hover:bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium"
                          >
                            <Unlock className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setHoldDocId(doc.id);
                              setShowHoldModal(true);
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded text-xs font-medium"
                          >
                            <Lock className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: DOCUMENT DETAIL & OCR REVIEW */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-start border-b border-gray-200 pb-4">
              <div>
                <span className="text-[11px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                  {selectedDoc.id}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{selectedDoc.title}</h3>
                <p className="text-xs text-gray-500">
                  প্রকার: {selectedDoc.documentType} | মালিকানা: {selectedDoc.entityName} ({selectedDoc.entityId})
                </p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {/* Cryptographic Integrity Section */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-emerald-800" />
                  ক্রিপ্টোগ্রাফিক ডিজিটাল হ্যাশ (SHA-256)
                </span>
                <button
                  onClick={() => handleCheckIntegrity(selectedDoc.id)}
                  disabled={checkingIntegrity}
                  className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${checkingIntegrity ? "animate-spin" : ""}`} />
                  টেম্পারিং ও ইন্টিগ্রিটি যাচাই
                </button>
              </div>
              <div className="text-[11px] font-mono break-all bg-white p-2 rounded border border-gray-200 text-gray-600">
                {selectedDoc.fileHash}
              </div>
              {integrityState && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    integrityState.isValid
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : "bg-red-100 text-red-900 border border-red-300"
                  }`}
                >
                  {integrityState.isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-red-700" />
                  )}
                  <span>{integrityState.details}</span>
                </div>
              )}
            </div>

            {/* OCR & Structured Fields Human Review */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-sky-700" />
                  OCR এক্সট্র্যাক্টকৃত ফিল্ড ও মানবিক যাচাইকরণ (Human Verification)
                </h4>
                {!selectedDoc.hasOcrText && (
                  <button
                    onClick={() => handleTriggerOcr(selectedDoc.id)}
                    className="bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-medium"
                  >
                    OCR চালান
                  </button>
                )}
              </div>

              {selectedDoc.extractedFields && selectedDoc.extractedFields.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-gray-700">
                        <th className="p-2.5">ফিল্ডের নাম</th>
                        <th className="p-2.5">এক্সট্র্যাক্টকৃত মান</th>
                        <th className="p-2.5">কনফিডেন্স ও উৎস</th>
                        <th className="p-2.5">রিভিউ অবস্থা</th>
                        <th className="p-2.5 text-right">যাচাইকরণ অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedDoc.extractedFields.map((f) => (
                        <tr key={f.id} className="hover:bg-gray-50">
                          <td className="p-2.5 font-medium text-gray-900">{f.fieldLabelBn || f.fieldName}</td>
                          <td className="p-2.5 font-semibold text-gray-900">{f.value}</td>
                          <td className="p-2.5">
                            <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[10px]">
                              {(f.confidence * 100).toFixed(0)}% ({f.source})
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                f.reviewStatus === "CONFIRMED" || f.reviewStatus === "EDITED_AND_CONFIRMED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {f.reviewStatus}
                            </span>
                          </td>
                          <td className="p-2.5 text-right space-x-1">
                            {f.reviewStatus === "NEEDS_REVIEW" || f.reviewStatus === "PENDING" ? (
                              <>
                                <button
                                  onClick={() => handleVerifyField(f.id, "CONFIRM")}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded text-[10px] font-semibold"
                                >
                                  অনুমোদন
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingField(f);
                                    setEditFieldValue(f.value);
                                  }}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-0.5 rounded text-[10px] font-semibold"
                                >
                                  সংশোধন
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-gray-400">অনুমোদিত</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-xl text-center text-xs text-gray-500">
                  এখনো কোনো তথ্য এক্সট্র্যাক্ট করা হয়নি। OCR চালু করতে ওপরের বোতাম চাপুন।
                </div>
              )}
            </div>

            {/* Signatures List */}
            {selectedDoc.signatures && selectedDoc.signatures.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-purple-700" />
                  প্রাতিষ্ঠানিক ডিজিটাল স্বাক্ষর সনদ
                </h4>
                <div className="space-y-1.5">
                  {selectedDoc.signatures.map((sig) => (
                    <div
                      key={sig.id}
                      className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-semibold text-purple-950">{sig.signer.name}</span>
                        <span className="text-[11px] text-purple-700 ml-2">({sig.signer.designation})</span>
                        <span className="block text-[10px] text-purple-600 font-mono mt-0.5">
                          রেফারেন্স: {sig.signatureReference} | টোকেন: {sig.signatureToken.slice(0, 16)}...
                        </span>
                      </div>
                      <span className="bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded text-[10px]">
                        {sig.watermark}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD NEW DOCUMENT */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-200 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-gray-900">ডিজিটাল আর্কাইভে নতুন দলিল জমা</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-700 text-lg">
                &times;
              </button>
            </div>
            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">দলিলের শিরোনাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মুহাম্মদ আব্দুল্লাহ - জন্ম নিবন্ধন সনদ"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">দলিলের প্রকার</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="STUDENT_ID">স্টুডেন্ট আইডি</option>
                    <option value="BIRTH_REGISTRATION">জন্ম নিবন্ধন</option>
                    <option value="NID_STUDENT">জাতীয় পরিচয়পত্র</option>
                    <option value="STUDY_CERTIFICATE">অধ্যয়ন সনদ</option>
                    <option value="PAYMENT_RECEIPT">পেমেন্ট রসিদ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">শিক্ষার্থী / সত্তা আইডি</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: EHRJ-2026-001"
                    value={uploadEntityId}
                    onChange={(e) => setUploadEntityId(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">নাম (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="মুহাম্মদ আব্দুল্লাহ"
                  value={uploadEntityName}
                  onChange={(e) => setUploadEntityName(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">ফাইল সংযুক্ত করুন</label>
                <input
                  type="file"
                  required
                  onChange={handleFileSelect}
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-1.5 bg-[#0D5C3A] text-white font-semibold rounded-lg hover:bg-[#083B25] transition"
                >
                  {uploading ? "সংরক্ষণ হচ্ছে..." : "আর্কাইভ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SIGN DOCUMENT */}
      {signingDocId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-gray-200 text-xs">
            <h3 className="text-sm font-bold text-gray-900">ডিজিটাল প্রাতিষ্ঠানিক স্বাক্ষর</h3>
            <p className="text-gray-500">
              এই নথিতে ক্রিপ্টোগ্রাফিক হ্যাশ-বাইন্ডিং সহ অফিশিয়াল স্বাক্ষর যুক্ত করা হবে।
            </p>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">জলছাপ (Watermark)</label>
              <select
                value={watermark}
                onChange={(e) => setWatermark(e.target.value as any)}
                className="w-full p-2 border border-gray-200 rounded-lg bg-white"
              >
                <option value="OFFICIAL">OFFICIAL (অফিশিয়াল)</option>
                <option value="DRAFT">DRAFT (খসড়া)</option>
                <option value="COPY">COPY (অনুলিপি)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">স্বাক্ষর পদ্ধতি</label>
              <select
                value={signingMethod}
                onChange={(e) => setSigningMethod(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg bg-white"
              >
                <option value="OFFICIAL_DIGITAL_STAMP">প্রাতিষ্ঠানিক ডিজিটাল সিলমোহর ও সিগনেচার</option>
                <option value="CRYPTOGRAPHIC_LOCAL_KEY">ক্রিপ্টোগ্রাফিক লোকাল কি (HMAC)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setSigningDocId(null)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg"
              >
                বাতিল
              </button>
              <button
                onClick={handleExecuteSign}
                disabled={signingLoading}
                className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg transition"
              >
                {signingLoading ? "স্বাক্ষর হচ্ছে..." : "স্বাক্ষর সম্পন্ন করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EXTRACTED FIELD */}
      {editingField && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-3 shadow-xl border border-gray-200 text-xs">
            <h4 className="font-bold text-gray-900">মানবিক সংশোধন ও নিশ্চিতকরণ</h4>
            <p className="text-gray-500">
              ফিল্ড: <span className="font-semibold text-gray-800">{editingField.fieldLabelBn}</span>
            </p>
            <input
              type="text"
              value={editFieldValue}
              onChange={(e) => setEditFieldValue(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D5C3A]"
            />
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setEditingField(null)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg"
              >
                বাতিল
              </button>
              <button
                onClick={() => handleVerifyField(editingField.id, "EDIT_AND_CONFIRM", editFieldValue)}
                className="px-3 py-1.5 bg-[#0D5C3A] text-white font-semibold rounded-lg"
              >
                সংরক্ষণ ও নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LEGAL HOLD */}
      {showHoldModal && holdDocId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-3 shadow-xl border border-gray-200 text-xs">
            <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-rose-700" />
              লিগ্যাল হোল্ড (আইনি সংরক্ষণ নির্দেশ)
            </h4>
            <p className="text-gray-500">
              হোল্ড জারি থাকাকালীন এই নথিটি রিটেনশন পলিসি বা স্বাভাবিক মেয়াদের কারণেও ডিলিট করা যাবে না।
            </p>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">কারণ</label>
              <input
                type="text"
                placeholder="যেমন: অডিট আপত্তি বা আইনি বাধ্যবাধকতা"
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">রেফারেন্স নম্বর (ঐচ্ছিক)</label>
              <input
                type="text"
                placeholder="যেমন: AUDIT-2026-CASE-12"
                value={holdRef}
                onChange={(e) => setHoldRef(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowHoldModal(false)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg"
              >
                বাতিল
              </button>
              <button
                onClick={() => handleToggleHold(holdDocId, "APPLY")}
                className="px-3 py-1.5 bg-rose-700 text-white font-semibold rounded-lg hover:bg-rose-800"
              >
                হোল্ড জারি করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
