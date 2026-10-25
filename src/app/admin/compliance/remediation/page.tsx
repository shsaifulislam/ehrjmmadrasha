"use client";

import React, { useEffect, useState } from "react";
import ComplianceNav from "../ComplianceNav";
import { ComplianceRemediation, ComplianceObligation } from "@/lib/compliance";

export default function ComplianceRemediationPage() {
  const [remediations, setRemediations] = useState<ComplianceRemediation[]>([]);
  const [obligations, setObligations] = useState<ComplianceObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Remediation Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [remForm, setRemForm] = useState({
    obligationId: "",
    problem: "",
    rootCause: "প্রক্রিয়াগত বিলম্ব ও সমন্বয়হীনতা",
    correctiveAction: "",
    ownerId: "EMP-0005",
    ownerName: "মুহাম্মদ আব্দুল্লাহ",
    dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);

  // Verify modal
  const [verifyModal, setVerifyModal] = useState<ComplianceRemediation | null>(null);
  const [isVerified, setIsVerified] = useState(true);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchRemediationsAndObligations();
  }, []);

  const fetchRemediationsAndObligations = async () => {
    setLoading(true);
    try {
      const [remRes, oblRes] = await Promise.all([
        fetch("/api/admin/compliance/remediation"),
        fetch("/api/admin/compliance/obligations"),
      ]);
      const remJson = await remRes.json();
      const oblJson = await oblRes.json();

      if (remJson.success) setRemediations(remJson.data);
      if (oblJson.success && oblJson.data.length > 0) {
        setObligations(oblJson.data);
        if (!remForm.obligationId) {
          setRemForm((prev) => ({ ...prev, obligationId: oblJson.data[0].id }));
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remForm.problem.trim() || !remForm.correctiveAction.trim()) {
      alert("সমস্যা ও সংশোধনমূলক ব্যবস্থা উল্লেখ করা আবশ্যক।");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/compliance/remediation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(remForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "প্রতিকার কর্মপরিকল্পনা সংরক্ষণে ব্যর্থ।");
      }
      setShowAddModal(false);
      setRemForm({ ...remForm, problem: "", correctiveAction: "" });
      fetchRemediationsAndObligations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyModal) return;
    if (!verifyNotes.trim()) {
      alert("যাচাইকরণ নোট প্রদান আবশ্যক।");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/admin/compliance/remediation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remediationId: verifyModal.id,
          isVerified,
          verificationNotes: verifyNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "যাচাই সংরক্ষণে ব্যর্থ।");
      }
      setVerifyModal(null);
      setVerifyNotes("");
      fetchRemediationsAndObligations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <ComplianceNav currentTab="remediation" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">কমপ্লায়েন্স ঘাটতি প্রতিকার (CAPA Board)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Section 19: অপূর্ণ বা আংশিক প্রতিপালিত দায় সংশোধনের কর্মপরিকল্পনা ও যাচাইপূর্বক সমাপ্তি
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>+</span> নতুন প্রতিকার কর্মপরিকল্পনা
        </button>
      </div>

      {/* Remediations Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">প্রতিকার তালিকা লোড হচ্ছে...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 text-xs">{error}</div>
        ) : remediations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">কোনো প্রতিকার কর্মপরিকল্পনা সক্রিয় নেই।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">প্রতিকার আইডি</th>
                  <th className="py-3 px-4">দায় আইডি ও সমস্যা</th>
                  <th className="py-3 px-4">মূল কারণ ও সংশোধনমূলক ব্যবস্থা</th>
                  <th className="py-3 px-4">দায়িত্বশীল ও সময়সীমা</th>
                  <th className="py-3 px-4">স্থিতি</th>
                  <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {remediations.map((rem) => (
                  <tr key={rem.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-amber-400">{rem.id}</td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-mono text-emerald-400 text-[11px]">{rem.obligationId}</div>
                      <div className="text-white font-medium line-clamp-1 mt-0.5">{rem.problem}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-slate-300">
                      <div className="text-[11px] text-slate-400">{rem.rootCause}</div>
                      <div className="text-emerald-400 mt-0.5 line-clamp-2">{rem.correctiveAction}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-200">{rem.ownerName}</span>
                      <span className="block font-mono text-[11px] text-slate-400 mt-0.5">{rem.dueDate}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        rem.status === "CLOSED"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : rem.status === "PENDING_VERIFICATION"
                          ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}>
                        {rem.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {rem.status !== "CLOSED" && (
                        <button
                          onClick={() => {
                            setVerifyModal(rem);
                            setIsVerified(true);
                            setVerifyNotes("");
                          }}
                          className="px-3 py-1 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition"
                        >
                          যাচাই ও সমাপ্তি
                        </button>
                      )}
                      {rem.status === "CLOSED" && (
                        <span className="text-[11px] text-slate-500">যাচাইকৃত</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">নতুন প্রতিকার কর্মপরিকল্পনা</h3>
            <p className="text-xs text-slate-400">
              অপূর্ণ বা ঘাটতিযুক্ত দায়িত্বের মূল কারণ শনাক্তকরণ ও সংশোধনমূলক পদক্ষেপ নির্ধারণ
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">দায় নির্বাচন <span className="text-rose-500">*</span></label>
                <select
                  value={remForm.obligationId}
                  onChange={(e) => setRemForm({ ...remForm, obligationId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {obligations.map((o) => (
                    <option key={o.id} value={o.id}>
                      [{o.id}] {o.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">সমস্যার বিবরণ <span className="text-rose-500">*</span></label>
                <textarea
                  rows={2}
                  required
                  placeholder="চিহ্নিত কমপ্লায়েন্স ঘাটতির বিবরণ..."
                  value={remForm.problem}
                  onChange={(e) => setRemForm({ ...remForm, problem: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">মূল কারণ (Root Cause)</label>
                <select
                  value={remForm.rootCause}
                  onChange={(e) => setRemForm({ ...remForm, rootCause: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="প্রক্রিয়াগত বিলম্ব ও সমন্বয়হীনতা">প্রক্রিয়াগত (Process)</option>
                  <option value="দায়িত্বপ্রাপ্ত ব্যক্তির অদক্ষতা বা অনুপস্থিতি">মানবসম্পদ ও লোকবল (People)</option>
                  <option value="প্রযুক্তিগত বা সার্ভার সমস্যা">প্রযুক্তিগত (Technology)</option>
                  <option value="নথিপত্র ও তথ্যের অসম্পূর্ণতা">ডাটা ও তথ্য (Data)</option>
                  <option value="সরবরাহকারী বা বাইরের সংস্থার বিলম্ব">বাইরের পক্ষ (Vendor/External)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">সংশোধনমূলক ব্যবস্থা (Corrective Action) <span className="text-rose-500">*</span></label>
                <textarea
                  rows={2}
                  required
                  placeholder="ঘাটতি দূরীকরণে কী ব্যবস্থা গ্রহণ করা হচ্ছে..."
                  value={remForm.correctiveAction}
                  onChange={(e) => setRemForm({ ...remForm, correctiveAction: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">দায়িত্বশীল ব্যক্তি</label>
                  <input
                    type="text"
                    value={remForm.ownerName}
                    onChange={(e) => setRemForm({ ...remForm, ownerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">চূড়ান্ত তারিখ</label>
                  <input
                    type="date"
                    value={remForm.dueDate}
                    onChange={(e) => setRemForm({ ...remForm, dueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "কর্মপরিকল্পনা সংরক্ষণ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {verifyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">প্রতিকার বাস্তবায়ন যাচাই ও সমাপ্তি</h3>
            <p className="text-xs text-slate-400">
              Section 19: প্রতিকার সম্পন্ন হলেই সরাসরি বন্ধ হবে না। স্বাধীন ভেরিফিকেশন ও মন্তব্য বাধ্যতামূলক।
            </p>

            <form onSubmit={handleVerifySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">যাচাইকরণ ফলাফল</label>
                <select
                  value={isVerified ? "YES" : "NO"}
                  onChange={(e) => setIsVerified(e.target.value === "YES")}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="YES">সফলভাবে সমাধান ও কার্যকর হয়েছে (Verified & Close)</option>
                  <option value="NO">এখনও সমাধান সন্তোষজনক নয় (Keep In Progress)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">যাচাইকরণ পর্যবেক্ষণ নোট <span className="text-rose-500">*</span></label>
                <textarea
                  rows={3}
                  required
                  placeholder="বাস্তবায়ন ফলাফলের বিবরণ লিখুন..."
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyModal(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                >
                  {verifying ? "সংরক্ষণ হচ্ছে..." : "যাচাই সম্পন্ন করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
