"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Printer,
  QrCode,
  ShieldCheck,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

interface GuardianDocumentsViewerProps {
  selectedStudentId?: string;
  onSelectStudent?: (id: string) => void;
}

export default function GuardianDocumentsViewer({
  selectedStudentId,
  onSelectStudent,
}: GuardianDocumentsViewerProps = {}) {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>(selectedStudentId || "");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync with parent selectedStudentId
  useEffect(() => {
    if (selectedStudentId && selectedStudentId !== selectedChildId) {
      setSelectedChildId(selectedStudentId);
    }
  }, [selectedStudentId]);

  // Request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestDocType, setRequestDocType] = useState("STUDY_CERTIFICATE");
  const [purpose, setPurpose] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // View Certificate Modal State
  const [viewingCert, setViewingCert] = useState<any | null>(null);

  // Load children list
  useEffect(() => {
    fetch("/api/portal/children")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.children?.length > 0) {
          setChildren(json.children);
          if (!selectedStudentId && !selectedChildId) {
            setSelectedChildId(json.children[0].id);
          }
        } else {
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  // Fetch documents for selected child with AbortController
  useEffect(() => {
    if (!selectedChildId) return;

    const controller = new AbortController();
    let isCurrent = true;

    setLoading(true);
    setErrorMsg("");
    // Clear previous documents data immediately during child switch
    setData(null);

    fetch(`/api/portal/documents?studentId=${selectedChildId}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((json) => {
        if (!isCurrent) return;
        if (json.success) {
          setData(json);
        } else {
          setErrorMsg(json.error || "প্রত্যয়নপত্র তথ্য লোড করা যায়নি।");
        }
      })
      .catch((err) => {
        if (err.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        if (isCurrent) {
          setErrorMsg("সার্ভার সংযোগে সমস্যা হয়েছে।");
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [selectedChildId]);

  // Submit Request
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      setErrorMsg("আবেদনের উদ্দেশ্য উল্লেখ করা আবশ্যক।");
      return;
    }
    setSubmittingRequest(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/portal/documents/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedChildId,
          documentType: requestDocType,
          purpose: purpose.trim(),
          requiredDate: requiredDate || null,
          notes: notes.trim() || null,
        }),
      });
      const resJson = await res.json();
      if (res.ok) {
        setSuccessMsg(resJson.message || "আবেদন সফলভাবে দাখিল করা হয়েছে!");
        setShowRequestModal(false);
        setPurpose("");
        setRequiredDate("");
        setNotes("");
        // Reload data
        const refresh = await fetch(`/api/portal/documents?studentId=${selectedChildId}`);
        const refJson = await refresh.json();
        if (refJson.success) setData(refJson);
      } else {
        setErrorMsg(resJson.error || "আবেদন জমা দেওয়া যায়নি।");
      }
    } catch {
      setErrorMsg("সার্ভার ত্রুটি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Child Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0B1914] flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#0D5C3A]" />
            সনদপত্র ও প্রত্যয়নপত্র (Certificates & Documents)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            সন্তানের ডিজিটাল আইডি কার্ড, অধ্যয়ন প্রত্যয়ন, প্রশংসাপত্র ও ছাড়পত্রের আবেদন এবং অনলাইন ডাউনলোড
          </p>
        </div>

        <div className="flex items-center gap-3">
          {children.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700">সন্তান নির্বাচন:</span>
              <select
                value={selectedChildId}
                onChange={(e) => {
                  setSelectedChildId(e.target.value);
                  onSelectStudent?.(e.target.value);
                }}
                className="p-1.5 border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-[#0D5C3A]"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.studentId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            নতুন প্রত্যয়নপত্রের আবেদন
          </button>
        </div>
      </div>

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

      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200 text-xs">
          তথ্য লোড করা হচ্ছে...
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* 1. Issued Official Documents Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              ইস্যুকৃত অফিশিয়াল প্রত্যয়নপত্রসমূহ ({data.certificates?.length || 0})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200">
                <thead className="bg-[#F9F8F3] text-gray-700 font-semibold border-b">
                  <tr>
                    <th className="p-3">সনদ নম্বর</th>
                    <th className="p-3">প্রত্যয়নের নাম</th>
                    <th className="p-3">ইস্যুর তারিখ</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3 text-right">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.certificates?.map((cert: any) => (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-[#0D5C3A]">{cert.certificateNumber}</td>
                      <td className="p-3 font-semibold text-gray-800">{cert.titleBn || cert.documentType}</td>
                      <td className="p-3 text-gray-600">{new Date(cert.issueDate).toLocaleDateString("bn-BD")}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cert.isRevoked ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {cert.isRevoked ? "বাতিলকৃত (REVOKED)" : "বৈধ ও কার্যকর (VALID)"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <a
                          href={`/verify/document/${encodeURIComponent(cert.verificationCode)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-2.5 py-1 rounded text-[11px] font-semibold shadow-sm inline-flex items-center gap-1 mr-2"
                        >
                          <ShieldCheck className="w-3 h-3 text-[#0D5C3A]" />
                          যাচাই করুন
                        </a>
                      </td>
                    </tr>
                  ))}
                  {(!data.certificates || data.certificates.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-400">
                        এই শিক্ষার্থীর জন্য এখনো কোনো প্রত্যয়নপত্র ইস্যু করা হয়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. My Document Requests Status Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              আবেদনের সর্বশেষ অগ্রগতি ও ইতিহাস ({data.requests?.length || 0})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200">
                <thead className="bg-[#F9F8F3] text-gray-700 font-semibold border-b">
                  <tr>
                    <th className="p-3">ট্র্যাকিং নম্বর</th>
                    <th className="p-3">প্রত্যয়নের ধরন</th>
                    <th className="p-3">উদ্দেশ্য</th>
                    <th className="p-3">আবেদনের তারিখ</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3 text-right">মন্তব্য / বিবরণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.requests?.map((req: any) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-[#0D5C3A]">{req.requestNumber}</td>
                      <td className="p-3 font-semibold text-gray-800">{req.documentType}</td>
                      <td className="p-3 text-gray-600 max-w-xs truncate">{req.purpose}</td>
                      <td className="p-3 text-gray-500">{new Date(req.createdAt).toLocaleDateString("bn-BD")}</td>
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
                      <td className="p-3 text-right text-gray-500 text-[11px]">
                        {req.status === "REJECTED" ? (
                          <span className="text-red-600">{req.rejectionReason}</span>
                        ) : req.status === "ISSUED" ? (
                          <span className="text-emerald-700 font-semibold">প্রস্তুত সম্পন্ন</span>
                        ) : (
                          <span>পর্যালোচনাধীন</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!data.requests || data.requests.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400">
                        আপনার কোনো সক্রিয় প্রত্যয়নপত্র আবেদন নেই।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* REQUEST MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-gray-900">নতুন প্রত্যয়নপত্রের আবেদন</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-gray-400 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">প্রত্যয়নপত্রের ধরন *</label>
                <select
                  required
                  value={requestDocType}
                  onChange={(e) => setRequestDocType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                >
                  <option value="STUDY_CERTIFICATE">অধ্যয়ন প্রত্যয়নপত্র (Study Certificate)</option>
                  <option value="CHARACTER_CERTIFICATE">চারিত্রিক প্রশংসাপত্র (Character Certificate)</option>
                  <option value="TRANSFER_CERTIFICATE">ছাড়পত্র / টিসি (Transfer Certificate)</option>
                  <option value="TESTIMONIAL">প্রশংসাপত্র (Testimonial)</option>
                  <option value="STUDENT_ID">ডিজিটাল স্টুডেন্ট আইডি কার্ড (Digital ID)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">আবেদনের সুনির্দিষ্ট উদ্দেশ্য *</label>
                <textarea
                  required
                  rows={2}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="যেমন: পাসপোর্ট করার জন্য বা অন্য প্রতিষ্ঠানে ভর্তির জন্য..."
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">প্রয়োজনের আনুমানিক তারিখ</label>
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">অতিরিক্ত নোট / মন্তব্য (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="অন্য কোনো তথ্য..."
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-3 py-1.5 border rounded text-gray-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-1.5 rounded font-semibold disabled:opacity-50"
                >
                  {submittingRequest ? "জমা দেওয়া হচ্ছে..." : "আবেদন দাখিল করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
