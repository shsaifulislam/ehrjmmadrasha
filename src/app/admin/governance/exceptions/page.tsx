"use client";

import React, { useState, useEffect } from "react";
import GovernanceNav from "../GovernanceNav";

interface ExceptionItem {
  id: string;
  controlId: string;
  exceptionReasonBn: string;
  scopeBn: string;
  startDate: string;
  endDate: string;
  compensatingControlBn: string;
  approvedBy: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  evidenceRef?: string;
  reviewDate: string;
  createdAt: string;
}

interface ControlSimple {
  id: string;
  nameBn: string;
}

export default function ControlExceptionsPage() {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [controls, setControls] = useState<ControlSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Modal
  const [showNewModal, setShowNewModal] = useState(false);

  // Form State
  const [controlId, setControlId] = useState("");
  const [reasonBn, setReasonBn] = useState("");
  const [scopeBn, setScopeBn] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [compensatingControlBn, setCompensatingControlBn] = useState("");
  const [approvedBy, setApprovedBy] = useState("মুহতামিম / গভর্নিং বডি");
  const [evidenceRef, setEvidenceRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExceptions();
    fetchControls();
  }, []);

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/governance/exceptions");
      const json = await res.json();
      if (json.success) {
        setExceptions(json.exceptions || []);
      } else {
        setError(json.error || "ব্যত্যয় রেকর্ড লোড করা যায়নি।");
      }
    } catch (e: any) {
      setError(e.message || "নেটওয়ার্ক ত্রুটি।");
    } finally {
      setLoading(false);
    }
  };

  const fetchControls = async () => {
    try {
      const res = await fetch("/api/admin/governance/controls");
      const json = await res.json();
      if (json.success) {
        setControls(json.controls || []);
        if (json.controls?.length > 0 && !controlId) {
          setControlId(json.controls[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch controls list", e);
    }
  };

  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!controlId || !reasonBn.trim() || !scopeBn.trim() || !endDate || !compensatingControlBn.trim()) {
      alert("নিয়ন্ত্রণ, কারণ, পরিধি, মেয়াদ শেষ ও বিকল্প নিয়ন্ত্রণ আবশ্যক।");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/governance/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          controlId,
          exceptionReasonBn: reasonBn,
          scopeBn,
          startDate,
          endDate,
          compensatingControlBn,
          approvedBy,
          evidenceRef: evidenceRef || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMsg("নিয়ন্ত্রণ ব্যত্যয় ও বিকল্প ব্যবস্থা সফলভাবে রেকর্ড করা হয়েছে!");
        setShowNewModal(false);
        setReasonBn("");
        setScopeBn("");
        setCompensatingControlBn("");
        fetchExceptions();
      } else {
        alert(json.error || "ব্যত্যয় সংরক্ষণ ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const isExpired = (end: string, status: string) => {
    if (status === "EXPIRED") return true;
    return new Date(end).getTime() < new Date().getTime();
  };

  // Stats
  const total = exceptions.length;
  const activeCount = exceptions.filter((e) => e.status === "ACTIVE" && !isExpired(e.endDate, e.status)).length;
  const expiredCount = exceptions.filter((e) => isExpired(e.endDate, e.status)).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <GovernanceNav currentTab="exceptions" />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">মোট অনুমোদিত ব্যত্যয় (Exceptions)</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
        </div>
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4">
          <p className="text-xs text-emerald-300 font-medium">সক্রিয় ব্যত্যয় (Active)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4">
          <p className="text-xs text-rose-300 font-medium">মেয়াদোত্তীর্ণ ব্যত্যয় (Expired Alert)</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{expiredCount}</p>
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

      {/* Section 39 Warning banner if expired exceptions exist */}
      {expiredCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-xs text-rose-300 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <span>⚠️</span> সুশাসন সতর্কতা: মেয়াদোত্তীর্ণ ব্যত্যয় শনাক্ত হয়েছে!
          </p>
          <p>
            সুশাসন নীতিমালার ধারা ৩৯ অনুযায়ী কোনো নিয়ন্ত্রণ ব্যত্যয় মেয়াদ শেষের পর নীরবে জারি রাখা সম্পূর্ণ নিষিদ্ধ। অবিলম্বে প্রাথমিক নিয়ন্ত্রণ কার্যকর করুন অথবা নতুন অনুমোদন গ্রহণ করুন।
          </p>
        </div>
      )}

      {/* Header and Actions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">নিয়ন্ত্রণ ব্যত্যয় ও বিকল্প ব্যবস্থা (Compensating Controls)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            অনিবার্য পরিস্থিতিতে কোনো নিয়ন্ত্রণ স্থগিত রাখা হলে বিকল্প ব্যবস্থা ও সুনির্দিষ্ট মেয়াদ নিশ্চিতকরণ।
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
        >
          <span>+</span> নতুন ব্যত্যয় অনুমোদন নথিভুক্ত করুন
        </button>
      </div>

      {/* Exceptions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">ব্যত্যয় তালিকা লোড হচ্ছে...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
        ) : exceptions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-slate-400 text-xs">কোনো নিয়ন্ত্রণ ব্যত্যয় বা ছাড়পত্র রেকর্ড পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">ব্যত্যয় আইডি</th>
                  <th className="py-3.5 px-4">মূল নিয়ন্ত্রণ আইডি</th>
                  <th className="py-3.5 px-4">ব্যত্যয়ের কারণ ও পরিধি</th>
                  <th className="py-3.5 px-4">বিকল্প ব্যবস্থা (Compensating Control)</th>
                  <th className="py-3.5 px-4">মেয়াদকাল</th>
                  <th className="py-3.5 px-4">অনুমোদনকারী</th>
                  <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {exceptions.map((exc) => {
                  const expired = isExpired(exc.endDate, exc.status);
                  return (
                    <tr key={exc.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-emerald-400 whitespace-nowrap">
                        {exc.id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {exc.controlId}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="font-semibold text-white">{exc.exceptionReasonBn}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">পরিধি: {exc.scopeBn}</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="font-medium text-emerald-300 bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/60">
                          {exc.compensatingControlBn}
                        </p>
                        {exc.evidenceRef && (
                          <p className="text-[10px] text-slate-400 font-mono mt-1">প্রমাণ: {exc.evidenceRef}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                        <p>{exc.startDate} হতে</p>
                        <p className={expired ? "text-rose-400 font-bold" : "text-slate-200"}>{exc.endDate} পর্যন্ত</p>
                        {expired && (
                          <span className="block text-[9px] text-rose-400 font-sans font-semibold">
                            ⚠️ মেয়াদোত্তীর্ণ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-medium text-slate-200">{exc.approvedBy}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            expired || exc.status === "EXPIRED"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : exc.status === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {expired ? "EXPIRED" : exc.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Exception Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">নিয়ন্ত্রণ ব্যত্যয় ও বিকল্প ব্যবস্থা অনুমোদন</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateException} className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">স্থগিত বা ব্যত্যয়কৃত নিয়ন্ত্রণ *</label>
                <select
                  value={controlId}
                  onChange={(e) => setControlId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                  required
                >
                  {controls.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">ব্যত্যয়ের কারণ ও যৌক্তিকতা *</label>
                <textarea
                  rows={2}
                  value={reasonBn}
                  onChange={(e) => setReasonBn(e.target.value)}
                  placeholder="কেন এই নিয়ন্ত্রণ সাময়িকভাবে কার্যকর রাখা সম্ভব হচ্ছে না..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">ব্যত্যয়ের আওতা / পরিধি (Scope) *</label>
                <input
                  type="text"
                  value={scopeBn}
                  onChange={(e) => setScopeBn(e.target.value)}
                  placeholder="যেমন: কেবলমাত্র বিদ্যুৎ বিভ্রাটকালীন সময়ে"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  বিকল্প নিয়ন্ত্রণ ব্যবস্থা (Compensating Control) *
                </label>
                <textarea
                  rows={2}
                  value={compensatingControlBn}
                  onChange={(e) => setCompensatingControlBn(e.target.value)}
                  placeholder="মূল নিয়ন্ত্রণ অনুপলব্ধ থাকায় বিকল্প হিসেবে কী ব্যবস্থা নেওয়া হয়েছে (যেমন: ম্যানুয়াল রেজিস্ট্রার ও প্রত্যক্ষ স্বাক্ষর)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">শুরুর তারিখ *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">শেষের তারিখ (সর্বোচ্চ মেয়াদ) *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">অনুমোদনকারী কর্মকর্তা / পর্ষদ *</label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">প্রমাণ রেফারেন্স / ডকুমেন্ট টোকেন</label>
                  <input
                    type="text"
                    value={evidenceRef}
                    onChange={(e) => setEvidenceRef(e.target.value)}
                    placeholder="যেমন: RES-EXC-2026-001"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>
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
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "ব্যত্যয় নথিভুক্ত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
