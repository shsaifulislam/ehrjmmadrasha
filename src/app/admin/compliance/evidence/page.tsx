"use client";

import React, { useEffect, useState } from "react";
import ComplianceNav from "../ComplianceNav";
import { ComplianceEvidence } from "@/lib/compliance";

export default function ComplianceEvidencePage() {
  const [evidenceList, setEvidenceList] = useState<ComplianceEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verification modal state
  const [verifyModal, setVerifyModal] = useState<ComplianceEvidence | null>(null);
  const [decision, setDecision] = useState<"VERIFIED" | "REJECTED">("VERIFIED");
  const [notes, setNotes] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/compliance/evidence");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "প্রমাণপত্র তালিকা লোড করা যায়নি।");
      }
      setEvidenceList(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyModal) return;
    if (decision === "REJECTED" && !notes.trim()) {
      alert("প্রত্যাখ্যানের কারণ উল্লেখ করা আবশ্যক।");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/admin/compliance/evidence", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidenceId: verifyModal.id,
          verificationStatus: decision,
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "যাচাইকরণ সংরক্ষণে ব্যর্থ।");
      }
      setVerifyModal(null);
      setNotes("");
      fetchEvidence();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <ComplianceNav currentTab="evidence" />

      {/* Header */}
      <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white">কমপ্লায়েন্স প্রমাণপত্র ও আনুষ্ঠানিক যাচাই (Evidence)</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Phase 29 ডকুমেন্ট রেফারেন্স, ক্রিপ্টোগ্রাফিক হ্যাশ ও অধ্যক্ষ কর্তৃক আনুষ্ঠানিক সত্যতা প্রতিপাদন
        </p>
      </div>

      {/* Evidence Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">প্রমাণপত্র লোড হচ্ছে...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 text-xs">{error}</div>
        ) : evidenceList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">কোনো প্রমাণপত্র রেকর্ড পাওয়া যায়নি।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">প্রমাণ আইডি</th>
                  <th className="py-3 px-4">শিরোনাম ও উৎস</th>
                  <th className="py-3 px-4">ধরন ও সংগ্রহ তারিখ</th>
                  <th className="py-3 px-4">সংগ্রাহক ও টোকেন</th>
                  <th className="py-3 px-4">যাচাইকরণ স্থিতি</th>
                  <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {evidenceList.map((evd) => (
                  <tr key={evd.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                      {evd.id}
                      <span className="block text-[10px] text-slate-500">{evd.obligationId}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate">{evd.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{evd.source}</div>
                      {evd.hash && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          SHA: {evd.hash.slice(0, 16)}...
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300">{evd.evidenceType}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{evd.dateCollected}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-200">{evd.collectorName}</span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {evd.fileToken || "সংযুক্ত নেই"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
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
                          যাচাই: {evd.verifiedBy}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {evd.verificationStatus === "PENDING" && (
                        <button
                          onClick={() => {
                            setVerifyModal(evd);
                            setDecision("VERIFIED");
                            setNotes("");
                          }}
                          className="px-3 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition"
                        >
                          যাচাই করুন
                        </button>
                      )}
                      {evd.verificationStatus !== "PENDING" && (
                        <span className="text-[11px] text-slate-500">সম্পন্ন</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {verifyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">প্রমাণপত্র সত্যতা প্রতিপাদন</h3>
            <p className="text-xs text-slate-400">
              Section 15: ফাইল আপলোড হওয়া মাত্রই কমপ্লায়েন্স সম্পন্ন হবে না। অধ্যক্ষ কর্তৃক যাচাই আবশ্যক।
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block">নথি:</span>
              <span className="font-semibold text-white">{verifyModal.title}</span>
              <span className="text-[10px] text-slate-500 block mt-1 font-mono">আইডি: {verifyModal.id}</span>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">যাচাইকরণ সিদ্ধান্ত</label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="VERIFIED">সত্যায়িত ও গৃহীত (VERIFIED)</option>
                  <option value="REJECTED">প্রত্যাখ্যাত / অপর্যাপ্ত (REJECTED)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">যাচাইকরণ মন্তব্য ও নোট</label>
                <textarea
                  rows={3}
                  placeholder="নথি যাচাইয়ের ফলাফল ও প্রাসঙ্গিক তথ্য লিখুন..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  {verifying ? "সংরক্ষণ হচ্ছে..." : "যাচাই নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
