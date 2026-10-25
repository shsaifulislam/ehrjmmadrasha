"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Contract } from "@/lib/procurement/types";

export default function ContractRenewalsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState<number>(90);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalForm, setRenewalForm] = useState({
    newEndDate: "",
    revisedValue: 0,
    renewalReasonBn: "বার্ষিক চুক্তি সফলভাবে সম্পন্ন হওয়ায় নতুন মেয়াদে নবায়ন",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchExpiring = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contracts?expiringOnly=true`);
      const data = await res.json();
      if (data.success) {
        setContracts(data.contracts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiring();
  }, []);

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    try {
      const res = await fetch(`/api/admin/contracts/${selectedContract.id}/renewals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(renewalForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "নবায়ন ব্যর্থ হয়েছে।");

      setMessage({ type: "success", text: data.message });
      setShowRenewalModal(false);
      fetchExpiring();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const now = new Date();
  const filtered = contracts.filter((c) => {
    const end = new Date(c.endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= filterDays;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono mb-1">
              <span>EHRJ-AI-2026-PHASE40</span>
              <span>•</span>
              <span>CONTRACT RENEWALS & EXPIRY ENGINE</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              চুক্তি নবায়ন ও মেয়াদোত্তীর্ণ পর্যবেক্ষণ ড্যাশবোর্ড
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              আসন্ন মেয়াদোত্তীর্ণ চুক্তিসমূহের স্বয়ংক্রিয় নোটিফিকেশন, আলোচনা ও প্রাতিষ্ঠানিক নবায়ন ওয়ার্কফ্লো
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/contracts"
              className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              ← চুক্তিপত্র রেজিস্টার
            </Link>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
            }`}
          >
            {message.type === "success" ? "✅" : "❌"} {message.text}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">মেয়াদ উত্তীর্ণের সময়সীমা:</span>
            {[
              { days: 90, label: "৯০ দিনের মধ্যে" },
              { days: 60, label: "৬০ দিনের মধ্যে" },
              { days: 30, label: "৩০ দিনের মধ্যে" },
              { days: 7, label: "৭ দিনের মধ্যে (জরুরি)" },
            ].map((f) => (
              <button
                key={f.days}
                onClick={() => setFilterDays(f.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterDays === f.days
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "bg-slate-700/60 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400">
            আসন্ন নবায়নযোগ্য চুক্তি: <span className="font-bold text-amber-400">{filtered.length} টি</span>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400">চুক্তিপত্রের তথ্য লোড হচ্ছে...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              নির্বাচিত সময়সীমার মধ্যে কোনো মেয়াদোত্তীর্ণ হওয়ার মতো চুক্তিপত্র নেই।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                  <tr>
                    <th className="px-4 py-3">চুক্তি কোড ও শিরোনাম</th>
                    <th className="px-4 py-3">সরবরাহকারী</th>
                    <th className="px-4 py-3">চুক্তির মেয়াদ</th>
                    <th className="px-4 py-3">বাকি দিন</th>
                    <th className="px-4 py-3">মূল্য</th>
                    <th className="px-4 py-3">ভার্সন</th>
                    <th className="px-4 py-3 text-right">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {filtered.map((c) => {
                    const end = new Date(c.endDate);
                    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={c.id} className="hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{c.titleBn}</div>
                          <div className="text-xs text-emerald-400 font-mono">{c.id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-200">{c.vendorNameBn}</div>
                          <div className="text-xs text-slate-400">{c.contractType}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300">
                          {c.startDate} হতে {c.endDate}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                              diffDays <= 7
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                                : diffDays <= 30
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            }`}
                          >
                            {diffDays > 0 ? `${diffDays} দিন বাকি` : "মেয়াদোত্তীর্ণ"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-emerald-400">
                          ৳{c.totalContractValue.toLocaleString("bn-BD")}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-700 text-xs font-mono text-slate-300">
                            v{c.currentVersion}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Link
                            href={`/admin/contracts/${c.id}`}
                            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 transition"
                          >
                            বিবরণ
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedContract(c);
                              setRenewalForm({
                                newEndDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
                                revisedValue: c.totalContractValue,
                                renewalReasonBn: "বার্ষিক চুক্তি সফলভাবে সম্পন্ন হওয়ায় নতুন মেয়াদে নবায়ন",
                              });
                              setShowRenewalModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs text-slate-950 font-bold transition shadow"
                          >
                            নবায়ন করুন
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Renewal Modal */}
        {showRenewalModal && selectedContract && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  চুক্তি নবায়ন আবেদন ও অনুমোদন
                </h3>
                <button
                  onClick={() => setShowRenewalModal(false)}
                  className="text-slate-400 hover:text-white text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl text-xs space-y-1">
                <div className="text-slate-400">চুক্তি: <span className="text-white font-semibold">{selectedContract.titleBn}</span></div>
                <div className="text-slate-400">সরবরাহকারী: <span className="text-emerald-400 font-semibold">{selectedContract.vendorNameBn}</span></div>
                <div className="text-slate-400">বর্তমান মেয়াদ: <span className="text-amber-400 font-mono">{selectedContract.endDate}</span></div>
              </div>

              <form onSubmit={handleRenew} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    নতুন মেয়াদোত্তীর্ণের তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={renewalForm.newEndDate}
                    onChange={(e) => setRenewalForm({ ...renewalForm, newEndDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    সংশোধিত / নবায়নকৃত চুক্তি মূল্য (টাকা) *
                  </label>
                  <input
                    type="number"
                    required
                    value={renewalForm.revisedValue}
                    onChange={(e) => setRenewalForm({ ...renewalForm, revisedValue: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    নবায়নের যৌক্তিকতা ও কারণ *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={renewalForm.renewalReasonBn}
                    onChange={(e) => setRenewalForm({ ...renewalForm, renewalReasonBn: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="text-xs text-slate-400 bg-slate-800/40 p-2.5 rounded-lg">
                  📌 নবায়নের ফলে স্বয়ংক্রিয়ভাবে একটি নতুন অপরিবর্তনীয় সংস্করণ (v{selectedContract.currentVersion + 1}) তৈরি হবে এবং পূর্ববর্তী সংস্করণের স্ন্যাপশট সংরক্ষিত থাকবে।
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowRenewalModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow"
                  >
                    নবায়ন চূড়ান্ত করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
