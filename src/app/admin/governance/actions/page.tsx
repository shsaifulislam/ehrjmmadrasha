"use client";

import React, { useState, useEffect } from "react";
import GovernanceNav from "../GovernanceNav";

interface ActionItem {
  id: string;
  findingId?: string;
  relatedRiskId?: string;
  relatedControlId?: string;
  actionType: "CORRECTIVE" | "PREVENTIVE";
  titleBn: string;
  descriptionBn: string;
  ownerName: string;
  ownerRole: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  dueDate: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "VERIFIED" | "CANCELLED";
  evidenceRef?: string;
  completionDate?: string;
  verificationNotesBn?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export default function ActionsCAPAPage() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);

  // New Action Form State
  const [newTitleBn, setNewTitleBn] = useState("");
  const [newDescBn, setNewDescBn] = useState("");
  const [newType, setNewType] = useState<"CORRECTIVE" | "PREVENTIVE">("CORRECTIVE");
  const [newPriority, setNewPriority] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [newOwner, setNewOwner] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newFindingId, setNewFindingId] = useState("");

  // Update Action State
  const [updateStatus, setUpdateStatus] = useState<string>("COMPLETED");
  const [updateEvidence, setUpdateEvidence] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchActions();
  }, [typeFilter, statusFilter, priorityFilter]);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.append("type", typeFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/governance/actions?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setActions(json.actions || []);
      } else {
        setError(json.error || "কার্যতালিকা পাওয়া যায়নি।");
      }
    } catch (e: any) {
      setError(e.message || "নেটওয়ার্ক ত্রুটি।");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActions();
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleBn.trim() || !newDescBn.trim() || !newOwner.trim() || !newDueDate) {
      alert("শিরোনাম, বর্ণনা, বাস্তবায়নকারী ও শেষ তারিখ আবশ্যক।");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/governance/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleBn: newTitleBn,
          descriptionBn: newDescBn,
          actionType: newType,
          priority: newPriority,
          ownerName: newOwner,
          ownerRole: "OFFICER",
          dueDate: newDueDate,
          findingId: newFindingId || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMsg("নতুন CAPA অ্যাকশন সফলভাবে তৈরি হয়েছে!");
        setShowNewModal(false);
        setNewTitleBn("");
        setNewDescBn("");
        fetchActions();
      } else {
        alert(json.error || "অ্যাকশন তৈরি ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/governance/actions/${selectedAction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updateStatus,
          evidenceRef: updateEvidence || undefined,
          verificationNotesBn: updateNotes || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMsg(`অ্যাকশন ${selectedAction.id} সফলভাবে আপডেট হয়েছে!`);
        setShowUpdateModal(false);
        fetchActions();
      } else {
        alert(json.error || "আপডেট ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const openUpdateModal = (act: ActionItem) => {
    setSelectedAction(act);
    setUpdateStatus(act.status === "PLANNED" ? "IN_PROGRESS" : "COMPLETED");
    setUpdateEvidence(act.evidenceRef || "");
    setUpdateNotes("");
    setShowUpdateModal(true);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "HIGH":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "PLANNED":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      case "IN_PROGRESS":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "COMPLETED":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      case "VERIFIED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  const isOverdue = (dateStr: string, status: string) => {
    if (status === "VERIFIED" || status === "COMPLETED") return false;
    return new Date(dateStr).getTime() < new Date().getTime();
  };

  // Stats
  const total = actions.length;
  const correctiveCount = actions.filter((a) => a.actionType === "CORRECTIVE").length;
  const preventiveCount = actions.filter((a) => a.actionType === "PREVENTIVE").length;
  const inProgress = actions.filter((a) => a.status === "IN_PROGRESS").length;
  const verifiedCount = actions.filter((a) => a.status === "VERIFIED").length;
  const overdueCount = actions.filter((a) => isOverdue(a.dueDate, a.status)).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <GovernanceNav currentTab="actions" />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 font-medium">মোট প্রতিকারমূলক পদক্ষেপ</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
        </div>
        <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-4">
          <p className="text-xs text-sky-300 font-medium">সংশোধনমূলক (Corrective)</p>
          <p className="text-2xl font-bold text-sky-400 mt-1">{correctiveCount}</p>
        </div>
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4">
          <p className="text-xs text-purple-300 font-medium">প্রতিরোধমূলক (Preventive)</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{preventiveCount}</p>
        </div>
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-xs text-amber-300 font-medium">চলমান (In Progress)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{inProgress}</p>
        </div>
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4">
          <p className="text-xs text-rose-300 font-medium">মেয়াদোত্তীর্ণ (Overdue)</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{overdueCount}</p>
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

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
            <input
              type="text"
              placeholder="অ্যাকশন কোড (EHRJ-ACT-...), শিরোনাম বা বাস্তবায়নকারী দিয়ে অনুসন্ধান..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
            >
              সার্চ
            </button>
          </form>

          <button
            onClick={() => setShowNewModal(true)}
            className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-1.5"
          >
            <span>+</span> নতুন CAPA অ্যাকশন তৈরি করুন
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400">ফিল্টার:</span>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">সকল ধরণের অ্যাকশন</option>
            <option value="CORRECTIVE">সংশোধনমূলক (Corrective)</option>
            <option value="PREVENTIVE">প্রতিরোধমূলক (Preventive)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">সকল স্ট্যাটাস</option>
            <option value="PLANNED">পরিকল্পিত (PLANNED)</option>
            <option value="IN_PROGRESS">চলমান (IN_PROGRESS)</option>
            <option value="COMPLETED">সম্পন্ন (COMPLETED)</option>
            <option value="VERIFIED">যাচাইকৃত (VERIFIED)</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">সকল অগ্রাধিকার (Priority)</option>
            <option value="CRITICAL">জরুরি (CRITICAL)</option>
            <option value="HIGH">উচ্চ (HIGH)</option>
            <option value="MEDIUM">মাঝারি (MEDIUM)</option>
            <option value="LOW">নিম্ন (LOW)</option>
          </select>

          {(typeFilter || statusFilter || priorityFilter || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter("");
                setStatusFilter("");
                setPriorityFilter("");
                setSearchQuery("");
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline ml-2"
            >
              ফিল্টার রিসেট
            </button>
          )}
        </div>
      </div>

      {/* Actions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">CAPA অ্যাকশন লোড হচ্ছে...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
        ) : actions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-slate-400 text-xs">কোনো প্রতিকারমূলক পদক্ষেপ রেকর্ড পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">অ্যাকশন আইডি</th>
                  <th className="py-3.5 px-4">শিরোনাম ও বিবরণ</th>
                  <th className="py-3.5 px-4">ধরণ ও উৎস লিঙ্ক</th>
                  <th className="py-3.5 px-4 text-center">অগ্রাধিকার</th>
                  <th className="py-3.5 px-4">বাস্তবায়নকারী</th>
                  <th className="py-3.5 px-4">শেষ তারিখ</th>
                  <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {actions.map((act) => {
                  const overdue = isOverdue(act.dueDate, act.status);
                  return (
                    <tr key={act.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-emerald-400 whitespace-nowrap">
                        {act.id}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="font-semibold text-white">{act.titleBn}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{act.descriptionBn}</p>
                        {act.evidenceRef && (
                          <p className="text-[10px] text-emerald-400 mt-0.5 font-mono">
                            প্রমাণ: {act.evidenceRef}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            act.actionType === "CORRECTIVE"
                              ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                              : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          }`}
                        >
                          {act.actionType === "CORRECTIVE" ? "সংশোধনমূলক" : "প্রতিরোধমূলক"}
                        </span>
                        {act.findingId && (
                          <p className="text-[10px] text-slate-500 font-mono mt-1">উৎস: {act.findingId}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getPriorityBadge(
                            act.priority
                          )}`}
                        >
                          {act.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-medium text-slate-200">{act.ownerName}</p>
                        <p className="text-[10px] text-slate-500">{act.ownerRole}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                        <span className={overdue ? "text-rose-400 font-bold" : "text-slate-300"}>
                          {act.dueDate}
                        </span>
                        {overdue && (
                          <span className="block text-[9px] text-rose-400 font-sans font-semibold">
                            ⚠️ ওভারডিউ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                            act.status
                          )}`}
                        >
                          {act.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openUpdateModal(act)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1 ml-auto"
                        >
                          <span>⚙️</span> আপডেট
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

      {/* Update Action Modal */}
      {showUpdateModal && selectedAction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">CAPA অ্যাকশন স্ট্যাটাস আপডেট</h3>
                <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                  {selectedAction.id} — {selectedAction.titleBn}
                </p>
              </div>
              <button onClick={() => setShowUpdateModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateAction} className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">নতুন স্ট্যাটাস নির্ধারণ করুন</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                >
                  <option value="PLANNED">পরিকল্পিত (PLANNED)</option>
                  <option value="IN_PROGRESS">বাস্তবায়ন চলমান (IN_PROGRESS)</option>
                  <option value="COMPLETED">বাস্তবায়িত সম্পন্ন (COMPLETED)</option>
                  <option value="VERIFIED">যাচাইকৃত নিশ্চিত (VERIFIED)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  বাস্তবায়ন প্রমাণের রেফারেন্স (Evidence Ref / Token)
                </label>
                <input
                  type="text"
                  value={updateEvidence}
                  onChange={(e) => setUpdateEvidence(e.target.value)}
                  placeholder="যেমন: DOC-TOKEN-2026-901 বা সাইনড অর্ডার কপি"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  যাচাইকরণ বা অগ্রগতি নোট (Notes)
                </label>
                <textarea
                  rows={2}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="কী পরিবর্তন বা প্রতিকার নিশ্চিত করা হয়েছে..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "হালনাগাদ নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Action Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">নতুন প্রতিকারমূলক পদক্ষেপ (CAPA Action) তৈরি</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAction} className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">পদক্ষেপের শিরোনাম *</label>
                <input
                  type="text"
                  value={newTitleBn}
                  onChange={(e) => setNewTitleBn(e.target.value)}
                  placeholder="যেমন: ব্যাংক বিবরণী ও জেনারেল লেজারের সাপ্তাহিক স্বয়ংক্রিয় মিলকরণ চালু"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">বিস্তারিত কর্মপরিকল্পনা ও পদ্ধতি *</label>
                <textarea
                  rows={2}
                  value={newDescBn}
                  onChange={(e) => setNewDescBn(e.target.value)}
                  placeholder="কীভাবে এই পদক্ষেপ বাস্তবায়ন করা হবে..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">পদক্ষেপের ধরণ</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="CORRECTIVE">সংশোধনমূলক (Corrective Action)</option>
                    <option value="PREVENTIVE">প্রতিরোধমূলক (Preventive Action)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">অগ্রাধিকার (Priority)</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  >
                    <option value="CRITICAL">জরুরি (CRITICAL)</option>
                    <option value="HIGH">উচ্চ (HIGH)</option>
                    <option value="MEDIUM">মাঝারি (MEDIUM)</option>
                    <option value="LOW">নিম্ন (LOW)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">বাস্তবায়নকারী কর্মকর্তা *</label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="যেমন: প্রধান হিসাবরক্ষক"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">বাস্তবায়নের শেষ তারিখ *</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">সম্পর্কিত পর্যবেক্ষণ আইডি (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={newFindingId}
                  onChange={(e) => setNewFindingId(e.target.value)}
                  placeholder="যেমন: EHRJ-FND-2026-0001"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 font-mono"
                />
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
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "অ্যাকশন সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
