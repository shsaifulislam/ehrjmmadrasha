"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ComplianceNav from "../ComplianceNav";
import { ComplianceObligation, ComplianceRequirement } from "@/lib/compliance";

export default function ObligationsListPage() {
  const [obligations, setObligations] = useState<ComplianceObligation[]>([]);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [frequency, setFrequency] = useState("");
  const [isOverdueOnly, setIsOverdueOnly] = useState(false);

  // New Obligation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOblForm, setNewOblForm] = useState({
    requirementId: "",
    title: "",
    description: "",
    ownerId: "EMP-0012",
    ownerName: "মাওলানা মোহাম্মদ রফিক",
    ownerRole: "সহকারী প্রধান শিক্ষক",
    reviewerId: "EMP-0001",
    reviewerName: "মুহতামিম / অধ্যক্ষ সাহেব",
    responsibilityType: "RESPONSIBLE",
    frequency: "ANNUAL",
    dueDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    deadlineSource: "শিক্ষা বোর্ড নোটিশ ২০২৬",
  });

  useEffect(() => {
    fetchObligations();
    fetchRequirements();
  }, [status, frequency, isOverdueOnly]);

  const fetchRequirements = async () => {
    try {
      const res = await fetch("/api/admin/compliance/requirements");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setRequirements(json.data);
        if (!newOblForm.requirementId) {
          setNewOblForm((prev) => ({ ...prev, requirementId: json.data[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchObligations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (frequency) params.append("frequency", frequency);
      if (isOverdueOnly) params.append("isOverdue", "true");
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/compliance/obligations?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "দায়িত্ব তালিকা লোড করতে ব্যর্থ হয়েছে।");
      }
      setObligations(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOblForm.title.trim()) {
      alert("দায়িত্বের শিরোনাম প্রদান আবশ্যক।");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/compliance/obligations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOblForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "দায়িত্ব তৈরিতে ব্যর্থ।");
      }
      setShowCreateModal(false);
      setNewOblForm({ ...newOblForm, title: "", description: "" });
      fetchObligations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <ComplianceNav currentTab="obligations" />

      {/* Header & New Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">কমপ্লায়েন্স দায় ও অঙ্গীকার কিউ (Obligations)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            কর্মকর্তা ও শাখাওয়াড়ি নির্দিষ্ট সময়সীমা, প্রমাণ সংগ্রহ ও দাখিলের তালিকা
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>+</span> নতুন দায় বরাদ্দ করুন
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="আইডি, শিরোনাম বা কর্মকর্তার নাম খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">সকল অবস্থা (All Status)</option>
            <option value="NOT_STARTED">শুরু হয়নি (NOT_STARTED)</option>
            <option value="IN_PROGRESS">চলমান (IN_PROGRESS)</option>
            <option value="SUBMITTED">দাখিলকৃত (SUBMITTED)</option>
            <option value="COMPLIANT">প্রতিপালিত (COMPLIANT)</option>
            <option value="PARTIALLY_COMPLIANT">আংশিক প্রতিপালিত</option>
            <option value="NON_COMPLIANT">অ-প্রতিপালিত</option>
            <option value="EXCEPTION_GRANTED">রেয়াতপ্রাপ্ত</option>
          </select>
        </div>

        <div>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">সকল পৌনঃপুনিকতা</option>
            <option value="ANNUAL">বার্ষিক (Annual)</option>
            <option value="HALF_YEARLY">অর্ধ-বার্ষিক</option>
            <option value="QUARTERLY">ত্রৈমাসিক (Quarterly)</option>
            <option value="MONTHLY">মাসিক (Monthly)</option>
            <option value="ONE_TIME">এককালীন (One-Time)</option>
          </select>
        </div>

        <button
          onClick={() => setIsOverdueOnly(!isOverdueOnly)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold transition border ${
            isOverdueOnly
              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
          }`}
        >
          {isOverdueOnly ? "⚠️ শুধু সময়োত্তীর্ণ দেখানো হচ্ছে" : "সময়োত্তীর্ণ ফিল্টার"}
        </button>
      </div>

      {/* Obligations Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">দায় তালিকা লোড হচ্ছে...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 text-xs">{error}</div>
        ) : obligations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">কোনো দায় বা অঙ্গীকার পাওয়া যায়নি।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">দায় আইডি</th>
                  <th className="py-3 px-4">শিরোনাম ও বাধ্যবাধকতা</th>
                  <th className="py-3 px-4">দায়িত্বশীল কর্মকর্তা</th>
                  <th className="py-3 px-4">পৌনঃপুনিকতা ও সময়সীমা</th>
                  <th className="py-3 px-4">প্রমাণ সংখ্যা</th>
                  <th className="py-3 px-4">স্থিতি</th>
                  <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {obligations.map((o) => {
                  const isOverdue =
                    o.dueDate < new Date().toISOString().slice(0, 10) &&
                    o.status !== "COMPLIANT" &&
                    o.status !== "CLOSED";

                  return (
                    <tr key={o.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-emerald-400 font-semibold">{o.id}</span>
                        <span className="block text-[10px] text-slate-500">{o.requirementId}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-white truncate">{o.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{o.description}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-200 font-medium">{o.ownerName}</span>
                        <span className="block text-[10px] text-slate-400 truncate">{o.ownerRole}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300">{o.frequency}</span>
                        <span className={`block font-mono text-[11px] mt-0.5 ${isOverdue ? "text-rose-400 font-bold" : "text-slate-400"}`}>
                          {o.dueDate} {isOverdue && "(সময়োত্তীর্ণ)"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[11px] text-slate-300">
                          {o.evidenceIds.length} টি প্রমাণ
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          o.status === "COMPLIANT"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : isOverdue
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/compliance/obligations/${o.id}`}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition inline-block"
                        >
                          কার্যক্রম →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Obligation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">নতুন কমপ্লায়েন্স দায় ও সময়সীমা নির্ধারণ</h3>
            <p className="text-xs text-slate-400">
              প্রয়োজনীয়তার আলোকে নির্দিষ্ট কর্মকর্তার উপর প্রমাণ সংগ্রহের দায় বণ্টন ও ক্যালেন্ডারে যুক্তকরণ
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">প্রয়োজনীয়তা নির্বাচন <span className="text-rose-500">*</span></label>
                <select
                  value={newOblForm.requirementId}
                  onChange={(e) => setNewOblForm({ ...newOblForm, requirementId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {requirements.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.id}] {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">দায়িত্বের শিরোনাম <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="উদাঃ বোর্ড রেজিস্ট্রেশন চালান কপি ও শিক্ষার্থী তালিকা আপলোড"
                  value={newOblForm.title}
                  onChange={(e) => setNewOblForm({ ...newOblForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">বিবরণ</label>
                <textarea
                  rows={2}
                  placeholder="করণীয় কার্যাবলী..."
                  value={newOblForm.description}
                  onChange={(e) => setNewOblForm({ ...newOblForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">কর্মকর্তার নাম <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newOblForm.ownerName}
                    onChange={(e) => setNewOblForm({ ...newOblForm, ownerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">পদবী <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newOblForm.ownerRole}
                    onChange={(e) => setNewOblForm({ ...newOblForm, ownerRole: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">পৌনঃপুনিকতা (Frequency)</label>
                  <select
                    value={newOblForm.frequency}
                    onChange={(e) => setNewOblForm({ ...newOblForm, frequency: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ANNUAL">বার্ষিক</option>
                    <option value="HALF_YEARLY">অর্ধ-বার্ষিক</option>
                    <option value="QUARTERLY">ত্রৈমাসিক</option>
                    <option value="MONTHLY">মাসিক</option>
                    <option value="ONE_TIME">এককালীন</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">চূড়ান্ত সময়সীমা <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={newOblForm.dueDate}
                    onChange={(e) => setNewOblForm({ ...newOblForm, dueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">সময়সীমার ভিত্তি বা রেফারেন্স</label>
                <input
                  type="text"
                  placeholder="উদাঃ বোর্ড নোটিশ / গঠনতন্ত্র ধারা"
                  value={newOblForm.deadlineSource}
                  onChange={(e) => setNewOblForm({ ...newOblForm, deadlineSource: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
                >
                  {creating ? "সংরক্ষণ হচ্ছে..." : "দায় সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
