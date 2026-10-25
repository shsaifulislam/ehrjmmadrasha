"use client";

import React, { useEffect, useState } from "react";
import ComplianceNav from "../ComplianceNav";
import { ComplianceException, ComplianceObligation } from "@/lib/compliance";

export default function ComplianceExceptionsPage() {
  const [exceptions, setExceptions] = useState<ComplianceException[]>([]);
  const [obligations, setObligations] = useState<ComplianceObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqForm, setReqForm] = useState({
    obligationId: "",
    requirementId: "",
    reason: "",
    scope: "সাধারণ সাময়িক ছাড়",
    endDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    compensatingControl: "",
  });
  const [requesting, setRequesting] = useState(false);

  // Decision modal state
  const [decisionModal, setDecisionModal] = useState<ComplianceException | null>(null);
  const [decisionChoice, setDecisionChoice] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [decisionReason, setDecisionReason] = useState("");
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    fetchExceptionsAndObligations();
  }, []);

  const fetchExceptionsAndObligations = async () => {
    setLoading(true);
    try {
      const [excRes, oblRes] = await Promise.all([
        fetch("/api/admin/compliance/exceptions"),
        fetch("/api/admin/compliance/obligations"),
      ]);
      const excJson = await excRes.json();
      const oblJson = await oblRes.json();

      if (excJson.success) setExceptions(excJson.data);
      if (oblJson.success && oblJson.data.length > 0) {
        setObligations(oblJson.data);
        if (!reqForm.obligationId) {
          setReqForm((prev) => ({
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
    setReqForm((prev) => ({
      ...prev,
      obligationId: oblId,
      requirementId: selected?.requirementId || "",
    }));
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqForm.reason.trim() || !reqForm.compensatingControl.trim()) {
      alert("ব্যতিক্রমের কারণ ও ক্ষতিপূরণমূলক বিকল্প নিয়ন্ত্রণ উল্লেখ করা আবশ্যক।");
      return;
    }
    setRequesting(true);
    try {
      const res = await fetch("/api/admin/compliance/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "ব্যতিক্রম আবেদনে ব্যর্থ।");
      }
      setShowRequestModal(false);
      setReqForm({ ...reqForm, reason: "", compensatingControl: "" });
      fetchExceptionsAndObligations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRequesting(false);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModal) return;
    setDeciding(true);
    try {
      const res = await fetch("/api/admin/compliance/exceptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exceptionId: decisionModal.id,
          decision: decisionChoice,
          reason: decisionReason,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "সিদ্ধান্ত সংরক্ষণে ব্যর্থ।");
      }
      setDecisionModal(null);
      setDecisionReason("");
      fetchExceptionsAndObligations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeciding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <ComplianceNav currentTab="exceptions" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">কমপ্লায়েন্স ব্যতিক্রম ও বিকল্প নিয়ন্ত্রণ (Exceptions)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Section 18/40: নিয়ন্ত্রিত ব্যতিক্রম, ক্ষতিপূরণমূলক নিয়ন্ত্রণ (Compensating Control) ও অধ্যক্ষীয় অনুমোদন
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>+</span> ব্যতিক্রমের আবেদন করুন
        </button>
      </div>

      {/* Exceptions Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">ব্যতিক্রম তালিকা লোড হচ্ছে...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 text-xs">{error}</div>
        ) : exceptions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">কোনো ব্যতিক্রমের রেকর্ড নেই।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ব্যতিক্রম আইডি</th>
                  <th className="py-3 px-4">দায় আইডি ও কারণ</th>
                  <th className="py-3 px-4">বিকল্প নিয়ন্ত্রণ (Compensating Control)</th>
                  <th className="py-3 px-4">মেয়াদ সীমা</th>
                  <th className="py-3 px-4">স্থিতি</th>
                  <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {exceptions.map((exc) => (
                  <tr key={exc.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-purple-400">{exc.id}</td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-mono text-emerald-400 text-[11px]">{exc.obligationId}</div>
                      <div className="text-white font-medium line-clamp-1 mt-0.5">{exc.reason}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-slate-300">
                      <p className="line-clamp-2">{exc.compensatingControl}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {exc.startDate} হতে {exc.endDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        exc.status === "APPROVED"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : exc.status === "REQUESTED"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}>
                        {exc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {exc.status === "REQUESTED" && (
                        <button
                          onClick={() => {
                            setDecisionModal(exc);
                            setDecisionChoice("APPROVED");
                            setDecisionReason("");
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition"
                        >
                          সিদ্ধান্ত নিন
                        </button>
                      )}
                      {exc.status !== "REQUESTED" && (
                        <span className="text-[11px] text-slate-500">{exc.approvedBy || "নিষ্পন্ন"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">কমপ্লায়েন্স ব্যতিক্রমের আবেদন</h3>
            <p className="text-xs text-slate-400">
              নির্দিষ্ট বাধ্যবাধকতা যথাসময়ে পালন সম্ভব না হলে বিকল্প ব্যবস্থার উল্লেখপূর্বক আবেদন
            </p>

            <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">দায় নির্বাচন <span className="text-rose-500">*</span></label>
                <select
                  value={reqForm.obligationId}
                  onChange={(e) => handleObligationChange(e.target.value)}
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
                <label className="block text-slate-300 font-medium mb-1">ব্যতিক্রমের কারণ <span className="text-rose-500">*</span></label>
                <textarea
                  rows={2}
                  required
                  placeholder="কেন নির্ধারিত সময়ে পালন করা সম্ভব হচ্ছে না..."
                  value={reqForm.reason}
                  onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">বিকল্প নিয়ন্ত্রণ (Compensating Control) <span className="text-rose-500">*</span></label>
                <textarea
                  rows={2}
                  required
                  placeholder="ঝুঁকি নিরসনে অন্তর্বর্তীকালীন কী নিয়ন্ত্রণ ব্যবস্থা নেওয়া হয়েছে..."
                  value={reqForm.compensatingControl}
                  onChange={(e) => setReqForm({ ...reqForm, compensatingControl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">ছাড়ের মেয়াদ উত্তীর্ণের তারিখ</label>
                <input
                  type="date"
                  value={reqForm.endDate}
                  onChange={(e) => setReqForm({ ...reqForm, endDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={requesting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                >
                  {requesting ? "জমা হচ্ছে..." : "আবেদন জমা দিন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">ব্যতিক্রমের সিদ্ধান্ত গ্রহণ (অধ্যক্ষ মহোদয়)</h3>
            <p className="text-xs text-slate-400">
              নীতিমালা অনুচ্ছেদ ১৮: স্বয়ংক্রিয় ব্যতিক্রম অনুমোদন নিষিদ্ধ। কর্তৃত্বসম্পন্ন মানবসিদ্ধান্ত বাধ্যতামূলক।
            </p>

            <form onSubmit={handleDecisionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">সিদ্ধান্ত</label>
                <select
                  value={decisionChoice}
                  onChange={(e) => setDecisionChoice(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="APPROVED">অনুমোদন প্রদান (APPROVED)</option>
                  <option value="REJECTED">প্রত্যাখ্যান (REJECTED)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">মন্তব্য বা অনুমোদনের শর্ত</label>
                <textarea
                  rows={3}
                  placeholder="সিদ্ধান্তের যৌক্তিকতা বা শর্ত লিখুন..."
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDecisionModal(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={deciding}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl"
                >
                  {deciding ? "সংরক্ষণ হচ্ছে..." : "সিদ্ধান্ত সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
