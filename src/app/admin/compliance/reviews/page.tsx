"use client";

import React, { useEffect, useState } from "react";
import ComplianceNav from "../ComplianceNav";
import { ComplianceReview, ComplianceObligation, ComplianceRequirement } from "@/lib/compliance";

export default function ComplianceReviewsPage() {
  const [reviews, setReviews] = useState<ComplianceReview[]>([]);
  const [obligations, setObligations] = useState<ComplianceObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Conduct Review Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    obligationId: "",
    requirementId: "",
    decision: "COMPLIANT",
    findingsNotes: "",
    nextReviewDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    checklist: {
      requirementExists: true,
      evidenceAvailable: true,
      responsibleAssigned: true,
      deadlineMet: true,
      requiredDocumentValid: true,
      requiredApprovalObtained: true,
      requiredReportSubmitted: true,
    },
  });

  useEffect(() => {
    fetchReviewsAndObligations();
  }, []);

  const fetchReviewsAndObligations = async () => {
    setLoading(true);
    try {
      const [revRes, oblRes] = await Promise.all([
        fetch("/api/admin/compliance/reviews"),
        fetch("/api/admin/compliance/obligations"),
      ]);
      const revJson = await revRes.json();
      const oblJson = await oblRes.json();

      if (revJson.success) setReviews(revJson.data);
      if (oblJson.success && oblJson.data.length > 0) {
        setObligations(oblJson.data);
        if (!form.obligationId) {
          setForm((prev) => ({
            ...prev,
            obligationId: oblJson.data[0].id,
            requirementId: oblJson.data[0].requirementId,
          }));
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleObligationChange = (oblId: string) => {
    const selected = obligations.find((o) => o.id === oblId);
    setForm((prev) => ({
      ...prev,
      obligationId: oblId,
      requirementId: selected?.requirementId || "",
    }));
  };

  const handleChecklistToggle = (key: string) => {
    setForm((prev) => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [key]: !prev.checklist[key as keyof typeof prev.checklist],
      },
    }));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.findingsNotes.trim()) {
      alert("পর্যালোচনার ফলাফল ও পর্যবেক্ষণ নোট প্রদান আবশ্যক।");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/compliance/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          obligationId: form.obligationId,
          requirementId: form.requirementId,
          checklistAnswers: form.checklist,
          decision: form.decision,
          findingsNotes: form.findingsNotes,
          nextReviewDate: form.nextReviewDate,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "পর্যালোচনা সংরক্ষণে ব্যর্থ।");
      }
      setShowModal(false);
      setForm({ ...form, findingsNotes: "" });
      fetchReviewsAndObligations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <ComplianceNav currentTab="reviews" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">কমপ্লায়েন্স পর্যালোচনা ও নিশ্চিতকরণ (Reviews)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            অধ্যক্ষ মহোদয় ও দায়িত্বপ্রাপ্ত নিরীক্ষকদের নিয়মিত যাচাই, চেকলিস্ট ও আনুষ্ঠানিক সিদ্ধান্ত
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>✓</span> নতুন পর্যালোচনা পরিচালনা করুন
        </button>
      </div>

      {/* Reviews Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">রিভিউ তালিকা লোড হচ্ছে...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 text-xs">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">কোনো পর্যালোচনা রেকর্ড পাওয়া যায়নি।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">রিভিউ আইডি</th>
                  <th className="py-3 px-4">দায় ও শর্ত আইডি</th>
                  <th className="py-3 px-4">পর্যালোচক ও তারিখ</th>
                  <th className="py-3 px-4">সিদ্ধান্ত (Decision)</th>
                  <th className="py-3 px-4">পর্যবেক্ষণ ও নোট</th>
                  <th className="py-3 px-4">পরবর্তী রিভিউ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">{rev.id}</td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-white block">{rev.obligationId}</span>
                      <span className="text-[10px] text-slate-500">{rev.requirementId}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-200 font-medium">{rev.reviewerName}</span>
                      <span className="block text-[10px] text-slate-400">{rev.reviewDate}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        rev.decision === "COMPLIANT"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : rev.decision === "PARTIALLY_COMPLIANT"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}>
                        {rev.decision}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-slate-300">
                      <p className="line-clamp-2">{rev.findingsNotes}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{rev.nextReviewDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conduct Review Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-white text-base">আনুষ্ঠানিক কমপ্লায়েন্স পর্যালোচনা পরিচালনা</h3>
            <p className="text-xs text-slate-400">
              Section 16/17: চেকলিস্ট যাচাই ও মানব কর্তৃত্ব সাপেক্ষে কমপ্লায়েন্স সিদ্ধান্ত গ্রহণ
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">দায়িত্ব নির্বাচন করুন <span className="text-rose-500">*</span></label>
                <select
                  value={form.obligationId}
                  onChange={(e) => handleObligationChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {obligations.map((o) => (
                    <option key={o.id} value={o.id}>
                      [{o.id}] {o.title} — ({o.ownerName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assessment Checklist (Section 17) */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 block mb-1">কমপ্লায়েন্স মূল্যায়ন চেকলিস্ট:</span>
                
                {[
                  { key: "requirementExists", label: "১. শর্তটি প্রাতিষ্ঠানিক নীতি/আইনে বিদ্যমান রয়েছে?" },
                  { key: "evidenceAvailable", label: "২. প্রয়োজনীয় স্বপক্ষে প্রমাণপত্র সংগ্রহ করা হয়েছে?" },
                  { key: "responsibleAssigned", label: "৩. দায়িত্বশীল কর্মকর্তা নিযুক্ত ও সচেতন?" },
                  { key: "deadlineMet", label: "৪. নির্ধারিত সময়সীমার মধ্যে দাখিল সম্পন্ন হয়েছে?" },
                  { key: "requiredDocumentValid", label: "৫. প্রমাণপত্রের বৈধতা ও মেয়াদ সঠিক আছে?" },
                  { key: "requiredApprovalObtained", label: "৬. যথাযথ কর্তৃপক্ষের পূর্বানুমোদন বিদ্যমান?" },
                  { key: "requiredReportSubmitted", label: "৭. নিরীক্ষা বা বোর্ড বিবরণী প্রেরিত হয়েছে?" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.checklist[item.key as keyof typeof form.checklist]}
                      onChange={() => handleChecklistToggle(item.key)}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">চূড়ান্ত সিদ্ধান্ত (Decision) <span className="text-rose-500">*</span></label>
                  <select
                    value={form.decision}
                    onChange={(e) => setForm({ ...form, decision: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="COMPLIANT">প্রতিপালিত (COMPLIANT)</option>
                    <option value="PARTIALLY_COMPLIANT">আংশিক প্রতিপালিত (PARTIALLY_COMPLIANT)</option>
                    <option value="NON_COMPLIANT">অ-প্রতিপালিত (NON_COMPLIANT)</option>
                    <option value="INSUFFICIENT_EVIDENCE">প্রমাণ অপর্যাপ্ত (INSUFFICIENT_EVIDENCE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">পরবর্তী পর্যালোচনার তারিখ</label>
                  <input
                    type="date"
                    value={form.nextReviewDate}
                    onChange={(e) => setForm({ ...form, nextReviewDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">পর্যবেক্ষণ ও ফলাফল নোট <span className="text-rose-500">*</span></label>
                <textarea
                  rows={3}
                  required
                  placeholder="পর্যালোচনার সুনির্দিষ্ট ফলাফল ও মন্তব্য লিখুন..."
                  value={form.findingsNotes}
                  onChange={(e) => setForm({ ...form, findingsNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "পর্যালোচনা সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
