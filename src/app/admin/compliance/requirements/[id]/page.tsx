"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import ComplianceNav from "../../ComplianceNav";
import { ComplianceRequirement, ComplianceObligation } from "@/lib/compliance";

export default function RequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [requirement, setRequirement] = useState<ComplianceRequirement | null>(null);
  const [obligations, setObligations] = useState<ComplianceObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Applicability modal state
  const [showApplicabilityModal, setShowApplicabilityModal] = useState(false);
  const [applicabilityReason, setApplicabilityReason] = useState("");
  const [applicabilityReviewer, setApplicabilityReviewer] = useState("মুহতামিম / অধ্যক্ষ সাহেব");
  const [updatingApplicability, setUpdatingApplicability] = useState(false);

  useEffect(() => {
    fetchRequirementAndObligations();
  }, [id]);

  const fetchRequirementAndObligations = async () => {
    setLoading(true);
    try {
      const [reqRes, oblRes] = await Promise.all([
        fetch(`/api/admin/compliance/requirements/${id}`),
        fetch(`/api/admin/compliance/obligations?requirementId=${id}`),
      ]);
      const reqJson = await reqRes.json();
      const oblJson = await oblRes.json();

      if (!reqRes.ok || !reqJson.success) {
        throw new Error(reqJson.error || "প্রয়োজনীয়তা লোড করা যায়নি।");
      }
      setRequirement(reqJson.data);
      if (oblJson.success) {
        setObligations(oblJson.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApplicability = async (newApplicable: boolean) => {
    if (!applicabilityReason.trim()) {
      alert("প্রযোজ্যতা পরিবর্তনের কারণ উল্লেখ করা বাধ্যতামূলক।");
      return;
    }
    setUpdatingApplicability(true);
    try {
      const res = await fetch(`/api/admin/compliance/requirements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_APPLICABILITY",
          isApplicable: newApplicable,
          reason: applicabilityReason,
          reviewer: applicabilityReviewer,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "প্রযোজ্যতা পরিবর্তনে ব্যর্থ।");
      }
      setRequirement(json.data);
      setShowApplicabilityModal(false);
      setApplicabilityReason("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingApplicability(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <ComplianceNav currentTab="requirements" />

      {loading && (
        <div className="p-16 text-center text-slate-400 text-xs">তথ্য লোড হচ্ছে...</div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs">
          {error}
        </div>
      )}

      {requirement && (
        <>
          {/* Header Card */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-semibold text-emerald-400">{requirement.id}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                    v{requirement.version}.0
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    requirement.isApplicable
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                    {requirement.isApplicable ? "প্রযোজ্য (Applicable)" : "অপ্রযোজ্য"}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">{requirement.title}</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">{requirement.description}</p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={() => setShowApplicabilityModal(true)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition"
                >
                  প্রযোজ্যতা পরিবর্তন
                </button>
                <Link
                  href="/admin/compliance/obligations"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  + দায় বরাদ্দ করুন
                </Link>
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block">উৎস ও ধরন</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{requirement.source}</span>
                <span className="text-[10px] text-slate-400 font-mono">{requirement.sourceReference}</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block">এখতিয়ার (Jurisdiction)</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{requirement.jurisdiction}</span>
                <span className="text-[10px] text-slate-400 truncate block">{requirement.authoritativeSourceRef}</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block">ক্যাটাগরি ও স্কোপ</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{requirement.category}</span>
                <span className="text-[10px] text-slate-400 font-mono">{requirement.applicabilityScope}</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block">কার্যকর ও পর্যালোচনা তারিখ</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{requirement.effectiveDate}</span>
                <span className="text-[10px] text-slate-400">পর্যালোচনা: {requirement.reviewDate}</span>
              </div>
            </div>

            {/* Applicability Log Banner if exists */}
            {requirement.applicabilityReason && (
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">প্রযোজ্যতা সিদ্ধান্তের নোট:</span> {requirement.applicabilityReason} (পর্যালোচক: {requirement.applicabilityReviewer}, তারিখ: {requirement.applicabilityDate})
              </div>
            )}
          </div>

          {/* Linked Obligations Section */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-base">সংযুক্ত কমপ্লায়েন্স দায় ও অঙ্গীকার ({obligations.length})</h3>
                <p className="text-xs text-slate-400 mt-0.5">এই প্রয়োজনীয়তার অধীনে বরাদ্দকৃত নিয়মিত কর্মপরিকল্পনা ও দাখিল</p>
              </div>
              <Link
                href="/admin/compliance/obligations"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                সকল দায়িত্ব দেখুন →
              </Link>
            </div>

            {obligations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                এই শর্তের অধীনে কোনো সক্রিয় কমপ্লায়েন্স দায় তৈরি করা হয়নি।
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {obligations.map((o) => (
                  <div key={o.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 text-xs font-semibold">{o.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {o.frequency}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-200 mt-1">{o.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        দায়িত্বশীল: {o.ownerName} ({o.ownerRole}) | সময়সীমা: {o.dueDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        o.status === "COMPLIANT"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : o.status === "IN_PROGRESS"
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}>
                        {o.status}
                      </span>
                      <Link
                        href={`/admin/compliance/obligations/${o.id}`}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                      >
                        বিস্তারিত →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applicability Modal */}
          {showApplicabilityModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
                <h3 className="font-bold text-white text-base">প্রযোজ্যতা পরিবর্তন ফরম</h3>
                <p className="text-xs text-slate-400">
                  Section 9/40 নীতি: কোনো শর্ত নিঃশব্দে বাদ দেওয়া যাবে না। পরিবর্তনের কারণ ও অনুমোদকের নাম বাধ্যতামূলক।
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">পরিবর্তনের কারণ <span className="text-rose-500">*</span></label>
                    <textarea
                      rows={3}
                      placeholder="উদাঃ মাদরাসার নিজস্ব শরিয়াহ্ বোর্ডের অনুমোদন সাপেক্ষে প্রযোজ্য..."
                      value={applicabilityReason}
                      onChange={(e) => setApplicabilityReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">অনুমোদনকারী পর্যালোচক <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={applicabilityReviewer}
                      onChange={(e) => setApplicabilityReviewer(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setShowApplicabilityModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                  >
                    বাতিল
                  </button>
                  <button
                    onClick={() => handleToggleApplicability(!requirement.isApplicable)}
                    disabled={updatingApplicability}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                  >
                    {updatingApplicability ? "সংরক্ষণ হচ্ছে..." : requirement.isApplicable ? "অপ্রযোজ্য ঘোষণা করুন" : "প্রযোজ্য হিসেবে চিহ্নিত করুন"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
