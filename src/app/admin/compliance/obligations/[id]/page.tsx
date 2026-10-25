"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import ComplianceNav from "../../ComplianceNav";
import {
  ComplianceObligation,
  ComplianceRequirement,
  ComplianceEvidence,
  ComplianceReview,
  ComplianceException,
  ComplianceRemediation,
} from "@/lib/compliance";

export default function ObligationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<{
    obligation: ComplianceObligation;
    requirement?: ComplianceRequirement;
    evidence: ComplianceEvidence[];
    reviews: ComplianceReview[];
    exceptions: ComplianceException[];
    remediations: ComplianceRemediation[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update state
  const [newStatus, setNewStatus] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Add Evidence modal
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evdForm, setEvdForm] = useState({
    title: "",
    source: "",
    evidenceType: "OFFICIAL_DOCUMENT",
    fileToken: "DOC-EVD-2026-CMP-" + Math.floor(1000 + Math.random() * 9000),
    expiryDate: "",
  });
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  useEffect(() => {
    fetchObligationDetails();
  }, [id]);

  const fetchObligationDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/compliance/obligations/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "দায় বিবরণ লোড করা যায়নি।");
      }
      setData(json.data);
      setNewStatus(json.data.obligation.status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === data?.obligation.status) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/compliance/obligations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "স্থিতি পরিবর্তনে ব্যর্থ।");
      }
      fetchObligationDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evdForm.title.trim() || !evdForm.source.trim()) {
      alert("শিরোনাম ও উৎস প্রদান আবশ্যক।");
      return;
    }
    setSubmittingEvidence(true);
    try {
      const res = await fetch(`/api/admin/compliance/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...evdForm, obligationId: id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "প্রমাণ আপলোডে ব্যর্থ।");
      }
      setShowEvidenceModal(false);
      setEvdForm({
        title: "",
        source: "",
        evidenceType: "OFFICIAL_DOCUMENT",
        fileToken: "DOC-EVD-2026-CMP-" + Math.floor(1000 + Math.random() * 9000),
        expiryDate: "",
      });
      fetchObligationDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingEvidence(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <ComplianceNav currentTab="obligations" />

      {loading && (
        <div className="p-16 text-center text-slate-400 text-xs">দায় তথ্য লোড হচ্ছে...</div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Header Card */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-semibold text-emerald-400">{data.obligation.id}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                    {data.obligation.frequency}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    data.obligation.status === "COMPLIANT"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  }`}>
                    {data.obligation.status}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">{data.obligation.title}</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">{data.obligation.description}</p>
              </div>

              {/* Status Update Control */}
              <div className="flex items-center gap-2 self-start md:self-auto bg-slate-900 p-2 rounded-xl border border-slate-800">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="NOT_STARTED">শুরু হয়নি (NOT_STARTED)</option>
                  <option value="IN_PROGRESS">চলমান (IN_PROGRESS)</option>
                  <option value="READY_FOR_REVIEW">পর্যালোচনার জন্য প্রস্তুত</option>
                  <option value="SUBMITTED">দাখিলকৃত (SUBMITTED)</option>
                  <option value="COMPLIANT">প্রতিপালিত (COMPLIANT)</option>
                  <option value="PARTIALLY_COMPLIANT">আংশিক প্রতিপালিত</option>
                  <option value="NON_COMPLIANT">অ-প্রতিপালিত</option>
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus || newStatus === data.obligation.status}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition"
                >
                  {updatingStatus ? "হালনাগাদ..." : "পরিবর্তন"}
                </button>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block">দায়িত্বশীল কর্মকর্তা</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{data.obligation.ownerName}</span>
                <span className="text-[10px] text-slate-400">{data.obligation.ownerRole}</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block">চূড়ান্ত সময়সীমা (Due Date)</span>
                <span className="font-semibold text-emerald-400 font-mono mt-0.5 block">{data.obligation.dueDate}</span>
                <span className="text-[10px] text-slate-400">{data.obligation.deadlineSource}</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block">পর্যালোচক (Reviewer)</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{data.obligation.reviewerName}</span>
                <span className="text-[10px] text-slate-400">{data.obligation.responsibilityType}</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block">সম্পন্ন করার তারিখ</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">
                  {data.obligation.completionDate || "এখনও সম্পন্ন হয়নি"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">সিঙ্ক: Phase 33 Calendar</span>
              </div>
            </div>

            {/* Parent Requirement Link */}
            {data.requirement && (
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">মূল বাধ্যবাধকতা: </span>
                  <span className="font-semibold text-white">{data.requirement.title}</span>
                  <span className="text-[10px] text-emerald-400 font-mono ml-2">[{data.requirement.id}]</span>
                </div>
                <Link
                  href={`/admin/compliance/requirements/${data.requirement.id}`}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  শর্ত বিবরণ →
                </Link>
              </div>
            )}
          </div>

          {/* Evidence Section */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-base">সংগৃহীত প্রমাণপত্র ({data.evidence.length})</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phase 29 ডকুমেন্ট টোকেন ও ক্রিপ্টোগ্রাফিক হ্যাশ সমৃদ্ধ সংরক্ষিত প্রমাণ
                </p>
              </div>
              <button
                onClick={() => setShowEvidenceModal(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
              >
                + প্রমাণ যুক্ত করুন
              </button>
            </div>

            {data.evidence.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">কোনো প্রমাণপত্র রেকর্ড করা হয়নি।</div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {data.evidence.map((evd) => (
                  <div key={evd.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 text-xs font-semibold">{evd.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {evd.evidenceType}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-200 mt-1">{evd.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        উৎস: {evd.source} | সংগ্রাহক: {evd.collectorName} | তারিখ: {evd.dateCollected}
                      </p>
                      {evd.hash && (
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-md">
                          SHA-256: {evd.hash}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        evd.verificationStatus === "VERIFIED"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : evd.verificationStatus === "REJECTED"
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}>
                        {evd.verificationStatus}
                      </span>
                      {evd.verifiedBy && (
                        <span className="block text-[10px] text-slate-500 mt-1">
                          যাচাইকারী: {evd.verifiedBy}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews & Remediations Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reviews History */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-base">পর্যালোচনা ইতিহাস ({data.reviews.length})</h3>
                <Link
                  href="/admin/compliance/reviews"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  নতুন রিভিউ →
                </Link>
              </div>

              {data.reviews.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">কোনো আনুষ্ঠানিক পর্যালোচনা হয়নি।</div>
              ) : (
                <div className="space-y-3">
                  {data.reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-emerald-400 font-semibold">{rev.id}</span>
                        <span className="font-semibold text-slate-200">{rev.decision}</span>
                      </div>
                      <p className="text-slate-300">{rev.findingsNotes}</p>
                      <span className="text-[10px] text-slate-500 block">
                        পর্যালোচক: {rev.reviewerName} | তারিখ: {rev.reviewDate}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remediations & Exceptions */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-base">প্রতিকার (CAPA) ও রেয়াত</h3>
                <Link
                  href="/admin/compliance/remediation"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  প্রতিকার বোর্ড →
                </Link>
              </div>

              {data.remediations.length === 0 && data.exceptions.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">কোনো প্রতিকার বা ব্যত্যয়ের ছাড়পত্র নেই।</div>
              ) : (
                <div className="space-y-3">
                  {data.remediations.map((rem) => (
                    <div key={rem.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-amber-400 font-semibold">{rem.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{rem.status}</span>
                      </div>
                      <p className="text-slate-300">{rem.problem}</p>
                      <p className="text-emerald-400 text-[11px]">ব্যবস্থা: {rem.correctiveAction}</p>
                    </div>
                  ))}

                  {data.exceptions.map((exc) => (
                    <div key={exc.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-purple-400 font-semibold">{exc.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{exc.status}</span>
                      </div>
                      <p className="text-slate-300">{exc.reason}</p>
                      <p className="text-slate-400 text-[11px]">বিকল্প নিয়ন্ত্রণ: {exc.compensatingControl}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add Evidence Modal */}
          {showEvidenceModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
                <h3 className="font-bold text-white text-base">প্রমাণপত্র রেফারেন্স সংযুক্ত করুন</h3>
                <p className="text-xs text-slate-400">
                  Phase 29 ডকুমেন্ট সিস্টেমের রেফারেন্স টোকেন ও ক্রিপ্টোগ্রাফিক হ্যাশ যুক্তকরণ
                </p>

                <form onSubmit={handleAddEvidence} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">প্রমাণের শিরোনাম <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="উদাঃ সোনালী ব্যাংক চালান জমার কাউন্টারফয়েল"
                      value={evdForm.title}
                      onChange={(e) => setEvdForm({ ...evdForm, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">প্রমাণের উৎস / কর্তৃপক্ষ <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="উদাঃ ব্যাংক শাখা / হিসাব বিভাগ"
                      value={evdForm.source}
                      onChange={(e) => setEvdForm({ ...evdForm, source: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">প্রমাণের ধরন</label>
                      <select
                        value={evdForm.evidenceType}
                        onChange={(e) => setEvdForm({ ...evdForm, evidenceType: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="OFFICIAL_DOCUMENT">অফিসিয়াল নথি</option>
                        <option value="SUBMISSION_RECEIPT">দাখিল রসিদ / চালান</option>
                        <option value="CERTIFICATE">প্রত্যয়নপত্র / সনদ</option>
                        <option value="AUDIT_RECORD">অডিট রেকর্ড</option>
                        <option value="REPORT">প্রতিবেদন</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">মেয়াদ উত্তীর্ণের তারিখ</label>
                      <input
                        type="date"
                        value={evdForm.expiryDate}
                        onChange={(e) => setEvdForm({ ...evdForm, expiryDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEvidenceModal(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={submittingEvidence}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                    >
                      {submittingEvidence ? "সংরক্ষণ হচ্ছে..." : "প্রমাণ সংরক্ষণ করুন"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
