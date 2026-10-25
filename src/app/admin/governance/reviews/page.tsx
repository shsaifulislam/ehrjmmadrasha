"use client";

import React, { useState, useEffect } from "react";
import GovernanceNav from "../GovernanceNav";

interface GovernanceReviewItem {
  id: string;
  titleBn: string;
  period: string;
  reviewDate: string;
  reviewerName: string;
  reviewerRole: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  reviewedRiskIds: string[];
  reviewedControlIds: string[];
  reviewedFindingIds: string[];
  exceptionsReviewedCount: number;
  decisionsBn: string[];
  actionItemsBn: string[];
  evidenceRef?: string;
  calendarEventId?: string;
  createdAt: string;
}

export default function GovernanceReviewsPage() {
  const [reviews, setReviews] = useState<GovernanceReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<GovernanceReviewItem | null>(null);

  // New Review Form State
  const [newTitleBn, setNewTitleBn] = useState("");
  const [newPeriod, setNewPeriod] = useState("2026-Q1");
  const [newReviewDate, setNewReviewDate] = useState("");
  const [newReviewerName, setNewReviewerName] = useState("মুহতামিম / প্রিন্সিপাল");
  const [newReviewerRole, setNewReviewerRole] = useState("PRINCIPAL");
  const [newDecisions, setNewDecisions] = useState("");
  const [newActions, setNewActions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/governance/reviews");
      const json = await res.json();
      if (json.success) {
        setReviews(json.reviews || []);
      } else {
        setError(json.error || "রিভিউ তালিকা লোড করা যায়নি।");
      }
    } catch (e: any) {
      setError(e.message || "নেটওয়ার্ক সমস্যা।");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleBn.trim() || !newPeriod.trim() || !newReviewDate || !newReviewerName.trim()) {
      alert("শিরোনাম, সময়কাল, তারিখ এবং পর্যালোচকের নাম আবশ্যক।");
      return;
    }

    try {
      setSubmitting(true);
      const decisionsList = newDecisions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const actionsList = newActions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/governance/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleBn: newTitleBn,
          period: newPeriod,
          reviewDate: newReviewDate,
          reviewerName: newReviewerName,
          reviewerRole: newReviewerRole,
          decisionsBn: decisionsList,
          actionItemsBn: actionsList,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMsg("নতুন সুশাসন পর্যালোচনা অধিবেশন সফলভাবে শিডিউল ও সংরক্ষিত হয়েছে!");
        setShowNewModal(false);
        setNewTitleBn("");
        fetchReviews();
      } else {
        alert(json.error || "অধিবেশন তৈরি ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "SCHEDULED":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      case "IN_PROGRESS":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "COMPLETED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "CANCELLED":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  // Stats
  const total = reviews.length;
  const completed = reviews.filter((r) => r.status === "COMPLETED").length;
  const scheduled = reviews.filter((r) => r.status === "SCHEDULED").length;
  const inProgress = reviews.filter((r) => r.status === "IN_PROGRESS").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <GovernanceNav currentTab="reviews" />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">মোট পর্যালোচনা অধিবেশন</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
        </div>
        <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-4">
          <p className="text-xs text-sky-300 font-medium">নির্ধারিত (Scheduled)</p>
          <p className="text-2xl font-bold text-sky-400 mt-1">{scheduled}</p>
        </div>
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-xs text-amber-300 font-medium">অধিবেশন চলমান</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{inProgress}</p>
        </div>
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4">
          <p className="text-xs text-emerald-300 font-medium">সম্পন্ন (Completed)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{completed}</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <span>✓ {msg}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Header and Actions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">গভর্ন্যান্স ও প্রাতিষ্ঠানিক অভ্যন্তরীণ অডিট পর্যালোচনা</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            মুহতামিম, শিক্ষা পরিচালনা কমিটি ও গভর্নিং বডির আনুষ্ঠানিক ত্রৈমাসিক ও ষাণ্মাসিক সুশাসন পর্যালোচনা সূচি।
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
        >
          <span>+</span> নতুন রিভিউ অধিবেশন শিডিউল করুন
        </button>
      </div>

      {/* Reviews Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">রিভিউ তালিকা লোড হচ্ছে...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-slate-400 text-xs">কোনো গভর্ন্যান্স রিভিউ অধিবেশন পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">আইডি</th>
                  <th className="py-3.5 px-4">অধিবেশনের শিরোনাম</th>
                  <th className="py-3.5 px-4">সময়কাল / তারিখ</th>
                  <th className="py-3.5 px-4">পর্যালোচক (Reviewer)</th>
                  <th className="py-3.5 px-4 text-center">পর্যালোচিত বিষয়সমূহ</th>
                  <th className="py-3.5 px-4 text-center">সিদ্ধান্ত</th>
                  <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-emerald-400 whitespace-nowrap">
                      {rev.id}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-semibold text-white">{rev.titleBn}</p>
                      {rev.calendarEventId && (
                        <span className="inline-block mt-1 text-[10px] text-sky-400 font-mono bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
                          🗓️ Phase 33 ক্যালেন্ডারে সিঙ্ককৃত
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono font-medium">
                        {rev.period}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">{rev.reviewDate}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-200">{rev.reviewerName}</p>
                      <p className="text-[10px] text-slate-500">{rev.reviewerRole}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap text-[11px] text-slate-400">
                      <span>{rev.reviewedRiskIds?.length || 0} ঝুঁকি</span> •{" "}
                      <span>{rev.reviewedControlIds?.length || 0} নিয়ন্ত্রণ</span> •{" "}
                      <span>{rev.reviewedFindingIds?.length || 0} ফাইন্ডিংস</span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 font-mono font-bold">
                        {rev.decisionsBn?.length || 0} টি
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                          rev.status
                        )}`}
                      >
                        {rev.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedReview(rev);
                          setShowDetailModal(true);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
                      >
                        বিবরণ &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Details Modal */}
      {showDetailModal && selectedReview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">গভর্ন্যান্স পর্যালোচনা অধিবেশন বিবরণ</h3>
                <p className="text-[11px] text-emerald-400 font-mono mt-0.5">{selectedReview.id}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white">{selectedReview.titleBn}</h4>
              <p className="text-slate-400">সময়কাল: {selectedReview.period} • তারিখ: {selectedReview.reviewDate}</p>
              <p className="text-slate-400">পর্যালোচক: {selectedReview.reviewerName} ({selectedReview.reviewerRole})</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                গৃহীত আনুষ্ঠানিক সিদ্ধান্তসমূহ ({selectedReview.decisionsBn?.length || 0})
              </h4>
              {selectedReview.decisionsBn?.length === 0 ? (
                <p className="text-slate-500 italic">কোনো সিদ্ধান্ত লিপিবদ্ধ করা হয়নি।</p>
              ) : (
                <ul className="space-y-1.5 list-disc pl-5 text-slate-200">
                  {selectedReview.decisionsBn.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                বাস্তবায়নের জন্য অ্যাকশন আইটেম ({selectedReview.actionItemsBn?.length || 0})
              </h4>
              {selectedReview.actionItemsBn?.length === 0 ? (
                <p className="text-slate-500 italic">কোনো অ্যাকশন আইটেম ধার্য করা হয়নি।</p>
              ) : (
                <ul className="space-y-1.5 list-disc pl-5 text-slate-200">
                  {selectedReview.actionItemsBn.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Review Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">নতুন সুশাসন পর্যালোচনা অধিবেশন নির্ধারণ</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">অধিবেশনের শিরোনাম *</label>
                <input
                  type="text"
                  value={newTitleBn}
                  onChange={(e) => setNewTitleBn(e.target.value)}
                  placeholder="যেমন: ২০২৬ শিক্ষাবর্ষের ১ম প্রান্তিক অভ্যন্তরীণ নিয়ন্ত্রণ ও সুশাসন পর্যালোচনা"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">সময়কাল / কোয়ার্টার *</label>
                  <input
                    type="text"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    placeholder="যেমন: 2026-Q1 বা 2026-ANNUAL"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">পর্যালোচনার তারিখ *</label>
                  <input
                    type="date"
                    value={newReviewDate}
                    onChange={(e) => setNewReviewDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">প্রধান পর্যালোচকের নাম *</label>
                  <input
                    type="text"
                    value={newReviewerName}
                    onChange={(e) => setNewReviewerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">পদবী</label>
                  <input
                    type="text"
                    value={newReviewerRole}
                    onChange={(e) => setNewReviewerRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  গৃহীত সিদ্ধান্তসমূহ (প্রতি লাইনে একটি সিদ্ধান্ত)
                </label>
                <textarea
                  rows={3}
                  value={newDecisions}
                  onChange={(e) => setNewDecisions(e.target.value)}
                  placeholder="যেমন: হিসাব নিরীক্ষা সফটওয়্যারের ব্যাকআপ অটোমেশন আরও জোরদার করা হবে..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  অ্যাকশন আইটেম (প্রতি লাইনে একটি কর্মপরিকল্পনা)
                </label>
                <textarea
                  rows={2}
                  value={newActions}
                  onChange={(e) => setNewActions(e.target.value)}
                  placeholder="যেমন: প্রধান হিসাবরক্ষককে ১৫ দিনের মধ্যে সমন্বয় রিপোর্ট দিতে হবে..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                💡 <span className="text-emerald-400">Phase 33 Calendar Integration:</span> অধিবেশনটি সেভ করার সাথে সাথে প্রতিষ্ঠানের প্রাতিষ্ঠানিক ক্যালেন্ডারে শিডিউল ইভেন্ট হিসেবে যুক্ত হবে।
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "অধিবেশন শিডিউল করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
