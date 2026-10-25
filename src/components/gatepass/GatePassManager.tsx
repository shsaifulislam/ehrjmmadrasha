"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  DoorOpen,
  PlusCircle,
  Search,
  Filter,
  Printer,
  ShieldCheck,
  Clock,
  User,
  Phone,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Calendar,
  Sparkles,
} from "lucide-react";
import { GatePassRecord } from "@/lib/gatepass/gatepassEngine";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function GatePassManager() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<GatePassRecord[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [purposeOptions, setPurposeOptions] = useState<Record<string, string>>({});
  const [residentialStudents, setResidentialStudents] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedPassForPrint, setSelectedPassForPrint] = useState<GatePassRecord | null>(null);
  const [printQrDataUrl, setPrintQrDataUrl] = useState<string>("");

  // Issue Form State
  const [formStudentId, setFormStudentId] = useState("");
  const [formPurpose, setFormPurpose] = useState<GatePassRecord["purpose"]>("WEEKEND_LEAVE");
  const [formPurposeDesc, setFormPurposeDesc] = useState("অভিভাবকের সাথে সাপ্তাহিক অনুমোদিত ছুটি গ্রহণ।");
  const [formEscortName, setFormEscortName] = useState("");
  const [formEscortPhone, setFormEscortPhone] = useState("");
  const [formEscortRelation, setFormEscortRelation] = useState("পিতা");
  const [formDeparture, setFormDeparture] = useState(new Date().toISOString().slice(0, 16));
  const [formReturn, setFormReturn] = useState(
    new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16)
  );
  const [formRoom, setFormRoom] = useState("দারুল ইক্বামা কক্ষ-১");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadData = async (status = statusFilter, search = searchQuery) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (search) params.set("search", search);

      const res = await fetch(`/api/gatepass?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setRecords(json.data.records || []);
        setStats(json.data.stats || null);
        setPurposeOptions(json.data.purposeOptions || {});
        if (json.data.residentialStudents) {
          setResidentialStudents(json.data.residentialStudents);
          if (!formStudentId && json.data.residentialStudents.length > 0) {
            const first = json.data.residentialStudents[0];
            setFormStudentId(first.id);
            setFormEscortName(first.fatherNameBn || "");
            setFormEscortPhone(first.fatherPhone || "");
          }
        }
      }
    } catch (err) {
      console.error("GatePass load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStudentSelect = (sId: string) => {
    setFormStudentId(sId);
    const found = residentialStudents.find((s) => s.id === sId);
    if (found) {
      setFormEscortName(found.fatherNameBn || "");
      setFormEscortPhone(found.fatherPhone || "");
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId) {
      alert("শিক্ষার্থী নির্বাচন করুন।");
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/gatepass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: formStudentId,
          purpose: formPurpose,
          purposeDescription: formPurposeDesc,
          escortName: formEscortName,
          escortPhone: formEscortPhone,
          escortRelation: formEscortRelation,
          departureExpected: new Date(formDeparture).toISOString(),
          returnExpected: new Date(formReturn).toISOString(),
          roomOrSeat: formRoom,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "গেটপাস তৈরি ব্যর্থ হয়েছে।");

      setMessage({ text: json.message, type: "success" });
      setShowIssueModal(false);
      loadData();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckpointAction = async (passId: string, action: "EXIT" | "RETURN") => {
    const confirmPrompt =
      action === "EXIT"
        ? "শিক্ষার্থী প্রধান ফটক দিয়ে ক্যাম্পাসের বাহিরে প্রস্থান করেছে বলে নিশ্চিত করছেন?"
        : "শিক্ষার্থী নিরাপদে ক্যাম্পাসে প্রত্যাবর্তন করেছে বলে নিশ্চিত করছেন?";

    if (!confirm(confirmPrompt)) return;

    try {
      const res = await fetch(`/api/gatepass/${passId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, securityNotes: "প্রধান ফটক সিকিউরিটি গেট ভেরিফাইড।" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।");

      setMessage({ text: json.message, type: "success" });
      loadData();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handlePrintSlip = async (pass: GatePassRecord) => {
    setSelectedPassForPrint(pass);
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

    const verifyUrl = `${appUrl}/verify/gatepass/${pass.qrToken}`;
    const qrData = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 180,
      color: { dark: "#0D5C3A", light: "#FFFFFF" },
    });
    setPrintQrDataUrl(qrData);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#063320] via-[#0D5C3A] to-[#0A452B] p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-400 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold mb-2">
              <DoorOpen className="w-4 h-4 text-amber-300" />
              <span>দারুল ইক্বামা ও ক্যাম্পাস নিরাপত্তা</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-serif-bn">
              আবাসিক শিক্ষার্থী সিকিউরিটি গেটপাস ট্র্যাকার
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
              আবাসিক শিক্ষার্থীদের মাদরাসা ক্যাম্পাস ত্যাগ ও প্রত্যাবর্তনের ডিজিটাল অনুমতিপত্র, অভিভাবক যাচাই ও ফটক পর্যবেক্ষণ ব্যবস্থা।
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowIssueModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-black shadow-lg shadow-amber-900/20 active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4 text-stone-900" />
              <span>নতুন গেটপাস ইস্যু করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Notifications / Messages */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-red-50 border border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button type="button" onClick={() => setMessage(null)} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. KPI Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 no-print">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-500 font-bold block uppercase">মোট ইস্যুকৃত</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              {stats.totalIssued}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">চলতি শিক্ষাবর্ষ</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-300 shadow-sm bg-gradient-to-br from-white to-amber-50/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-900 font-bold block uppercase">ক্যাম্পাসের বাইরে</span>
              <DoorOpen className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-2xl font-black text-amber-700 font-mono mt-1 block">
              {stats.activeOutside} জন
            </span>
            <span className="text-[10px] text-amber-800 mt-1 block">বর্তমানে বহিরাগত</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-blue-900 font-bold block uppercase">প্রস্থানের অপেক্ষায়</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-2xl font-black text-blue-700 font-mono mt-1 block">
              {stats.pendingDeparture} জন
            </span>
            <span className="text-[10px] text-blue-700 mt-1 block">অনুমোদিত কিন্তু অপ্রস্থানকৃত</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-900 font-bold block uppercase">প্রত্যাবর্তিত</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
              {stats.returnedCount} জন
            </span>
            <span className="text-[10px] text-emerald-700 mt-1 block">নিরাপদ ফেরত নিশ্চিত</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-red-900 font-bold block uppercase">দেরি / ওভারডিউ</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-2xl font-black text-red-600 font-mono mt-1 block">
              {stats.overdueCount} জন
            </span>
            <span className="text-[10px] text-red-700 mt-1 block">নির্ধারিত সময় অতিক্রান্ত</span>
          </div>
        </div>
      )}

      {/* 4. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 mr-1">ফিল্টার:</span>
          {[
            { id: "ALL", label: "সকল গেটপাস" },
            { id: "APPROVED", label: "অনুমোদিত" },
            { id: "EXITED", label: "বাহিরে অবস্থানরত" },
            { id: "RETURNED", label: "প্রত্যাবর্তিত" },
            { id: "OVERDUE", label: "ওভারডিউ" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                loadData(tab.id, searchQuery);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === tab.id
                  ? "bg-[#0D5C3A] text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadData(statusFilter, searchQuery)}
            placeholder="নাম, পাস নং বা মোবাইল দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/30 focus:border-[#0D5C3A]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* 5. GatePass Records Table */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">গেটপাস তালিকা লোড হচ্ছে...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <DoorOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">কোনো গেটপাস রেকর্ড পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-500">নির্বাচিত ফিল্টারে কোনো সক্রিয় গেটপাস অনুমোদিত নেই।</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">পাস নম্বর ও তারিখ</th>
                  <th className="py-3.5 px-4">শিক্ষার্থী বিবরণ</th>
                  <th className="py-3.5 px-4">গমনের কারণ ও অভিভাবক</th>
                  <th className="py-3.5 px-4">সময়সূচি (প্রস্থান ও ফেরত)</th>
                  <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right">ফটক অ্যাকশন ও স্লিপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {records.map((pass) => (
                  <tr key={pass.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-[#0D5C3A] block">
                        {pass.passNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ইস্যু: {new Date(pass.issuedAt).toLocaleDateString("bn-BD")}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <strong className="text-slate-900 font-serif-bn text-sm block">
                        {pass.studentNameBn}
                      </strong>
                      <span className="text-[11px] text-slate-500 font-mono">
                        আইডি: {pass.studentIdNumber} • জামাত: {pass.className} (রোল {pass.rollNumber})
                      </span>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <span className="font-bold text-slate-800 block truncate">
                        {pass.purposeLabelBn}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        অভিভাবক: {pass.escortName} ({pass.escortRelation}) • {pass.escortPhone}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-[11px]">
                      <div className="space-y-0.5">
                        <span className="text-slate-700 block">
                          প্রস্থান: {new Date(pass.departureExpected).toLocaleString("bn-BD")}
                        </span>
                        <span className="text-slate-700 block">
                          ফেরত: {new Date(pass.returnExpected).toLocaleString("bn-BD")}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {pass.status === "APPROVED" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          অনুমোদিত
                        </span>
                      )}
                      {pass.status === "EXITED" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          ক্যাম্পাসের বাইরে
                        </span>
                      )}
                      {pass.status === "RETURNED" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          প্রত্যাবর্তিত
                        </span>
                      )}
                      {pass.status === "OVERDUE" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                          ওভারডিউ
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap space-x-1.5">
                      {/* Checkpoint Exit Button */}
                      {pass.status === "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => handleCheckpointAction(pass.id, "EXIT")}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition shadow-sm active:scale-95"
                          title="ফটক দিয়ে প্রস্থান নিশ্চিত করুন"
                        >
                          প্রস্থান নিশ্চিত
                        </button>
                      )}

                      {/* Checkpoint Return Button */}
                      {(pass.status === "EXITED" || pass.status === "OVERDUE") && (
                        <button
                          type="button"
                          onClick={() => handleCheckpointAction(pass.id, "RETURN")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-sm active:scale-95"
                          title="ক্যাম্পাসে প্রত্যাবর্তন নিশ্চিত করুন"
                        >
                          ফেরত নিশ্চিত
                        </button>
                      )}

                      {/* Print Gatepass Slip */}
                      <button
                        type="button"
                        onClick={() => handlePrintSlip(pass)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0D5C3A] hover:text-white text-slate-700 font-bold text-[11px] transition active:scale-95 inline-flex items-center gap-1"
                        title="গেটপাস স্লিপ প্রিন্ট"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>স্লিপ</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Issue Gate-Pass Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-2 border-[#D4AF37] space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-serif-bn">
                  নতুন আবাসিক শিক্ষার্থী গেটপাস ইস্যু
                </h3>
                <p className="text-xs text-slate-500">মাদরাসা কর্তৃপক্ষ ও দারুল ইক্বামা অনুমোদন</p>
              </div>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
              {/* Select Student */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">শিক্ষার্থী নির্বাচন করুন *</label>
                <select
                  value={formStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-xs focus:ring-2 focus:ring-[#0D5C3A]/30 focus:border-[#0D5C3A]"
                  required
                >
                  <option value="">-- শিক্ষার্থী নির্বাচন করুন --</option>
                  {residentialStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullNameBn} ({st.studentIdNumber}) - {st.className} (রোল {st.rollNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">গমনের উদ্দেশ্য / প্রকার *</label>
                  <select
                    value={formPurpose}
                    onChange={(e) => {
                      setFormPurpose(e.target.value as any);
                      if (e.target.value === "WEEKEND_LEAVE") {
                        setFormPurposeDesc("অভিভাবকের সাথে সাপ্তাহিক নিয়মিত ছুটি গ্রহণ।");
                      } else if (e.target.value === "TREATMENT") {
                        setFormPurposeDesc("জরুরি চিকিৎসা ও ডাক্তারের পরামর্শের জন্য প্রস্থান।");
                      } else {
                        setFormPurposeDesc("মাদরাসা কর্তৃপক্ষের বিশেষ অনুমোদনক্রমে প্রস্থান।");
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-xs"
                    required
                  >
                    <option value="WEEKEND_LEAVE">সাপ্তাহিক নিয়মিত ছুটি</option>
                    <option value="TREATMENT">জরুরি চিকিৎসা / ডাক্তারের পরামর্শ</option>
                    <option value="EMERGENCY_FAMILY">পারিবারিক জরুরি প্রয়োজন</option>
                    <option value="OFFICIAL_LEAVE">অনুমোদিত প্রাতিষ্ঠানিক ছুটি</option>
                    <option value="OTHER">অন্যান্য বিশেষ প্রয়োজন</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ছাত্রাবাস অবস্থান (কক্ষ / সিট)</label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="যেমন: কক্ষ-৩, সিট-২"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  />
                </div>
              </div>

              {/* Purpose Detail */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">উদ্দেশ্যের বিস্তারিত বিবরণ</label>
                <input
                  type="text"
                  value={formPurposeDesc}
                  onChange={(e) => setFormPurposeDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  required
                />
              </div>

              {/* Escort / Guardian Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">সাথে গমনকারী / অভিভাবক *</label>
                  <input
                    type="text"
                    value={formEscortName}
                    onChange={(e) => setFormEscortName(e.target.value)}
                    placeholder="নাম"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">সম্পর্ক *</label>
                  <input
                    type="text"
                    value={formEscortRelation}
                    onChange={(e) => setFormEscortRelation(e.target.value)}
                    placeholder="যেমন: পিতা / বড় ভাই"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">অভিভাবকের মোবাইল *</label>
                  <input
                    type="text"
                    value={formEscortPhone}
                    onChange={(e) => setFormEscortPhone(e.target.value)}
                    placeholder="০১৭১১-০০০০০০"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Schedule (Departure and Return) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">প্রত্যাশিত প্রস্থান সময় *</label>
                  <input
                    type="datetime-local"
                    value={formDeparture}
                    onChange={(e) => setFormDeparture(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">প্রত্যাশিত প্রত্যাবর্তন সময় *</label>
                  <input
                    type="datetime-local"
                    value={formReturn}
                    onChange={(e) => setFormReturn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0D5C3A] hover:bg-[#158052] text-white font-bold shadow-md active:scale-95 transition disabled:opacity-50"
                >
                  {submitting ? "ইস্যু হচ্ছে..." : "গেটপাস অনুমোদন ও ইস্যু করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Printable Gate-Pass Slip Modal */}
      {selectedPassForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-[#D4AF37] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 no-print">
              <div>
                <h3 className="text-base font-black text-slate-900 font-serif-bn">
                  গেটপাস অনুমোদিত স্লিপ
                </h3>
                <span className="font-mono text-xs text-[#0D5C3A] font-bold">
                  {selectedPassForPrint.passNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPassForPrint(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Slip Container */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 space-y-3.5 print:border-black print:p-2">
              {/* Slip Header */}
              <div className="text-center border-b pb-2 space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0D5C3A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  নিরাপত্তা গেটপাস (Gate-Pass Slip)
                </span>
                <h4 className="text-sm font-black font-serif-bn text-slate-900 mt-1">
                  ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
                </h4>
                <p className="text-[9px] text-slate-500 font-mono">
                  স্থাপিত: ২০২১ ইং • ডাকঘর: ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা
                </p>
              </div>

              {/* Slip Body */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">পাস নম্বর</span>
                  <strong className="font-mono text-[#0D5C3A]">{selectedPassForPrint.passNumber}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">ইস্যুর তারিখ</span>
                  <strong className="text-slate-800">
                    {new Date(selectedPassForPrint.issuedAt).toLocaleDateString("bn-BD")}
                  </strong>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">শিক্ষার্থী:</span>
                  <strong className="text-slate-900 font-serif-bn">
                    {selectedPassForPrint.studentNameBn}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">আইডি ও রোল:</span>
                  <span className="font-mono text-slate-800">
                    {selectedPassForPrint.studentIdNumber} (রোল {selectedPassForPrint.rollNumber})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">জামাত ও হোস্টেল:</span>
                  <span className="text-slate-800">
                    {selectedPassForPrint.className} ({selectedPassForPrint.roomOrSeat})
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">গমনের কারণ:</span>
                  <strong className="text-slate-800">{selectedPassForPrint.purposeLabelBn}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">অভিভাবক / সাথে গমনকারী:</span>
                  <span className="text-slate-800 font-medium">
                    {selectedPassForPrint.escortName} ({selectedPassForPrint.escortRelation})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">জরুরি ফোন:</span>
                  <span className="font-mono text-slate-800">{selectedPassForPrint.escortPhone}</span>
                </div>
              </div>

              <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-amber-800">প্রস্থান সময়:</span>
                  <strong className="text-slate-900">
                    {new Date(selectedPassForPrint.departureExpected).toLocaleString("bn-BD")}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800">ফেরত সময়:</span>
                  <strong className="text-slate-900">
                    {new Date(selectedPassForPrint.returnExpected).toLocaleString("bn-BD")}
                  </strong>
                </div>
              </div>

              {/* QR Code for Guard Scanner */}
              <div className="flex items-center gap-3 pt-1 border-t border-slate-200">
                <div className="w-16 h-16 shrink-0 bg-white border border-slate-200 rounded-lg p-0.5">
                  {printQrDataUrl ? (
                    <img src={printQrDataUrl} alt="GatePass QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-slate-100" />
                  )}
                </div>
                <div className="text-[9px] text-slate-500 leading-tight">
                  <strong className="text-slate-800 block text-[10px]">নিরাপত্তা চেকপয়েন্ট ভেরিফিকেশন</strong>
                  প্রধান ফটকে নিরাপত্তা রক্ষী কিউআর কোড স্ক্যান করে বহির্গমন ও প্রত্যাবর্তন লিপিবদ্ধ করবেন।
                </div>
              </div>

              {/* Signatures */}
              <div className="flex items-end justify-between pt-4 border-t border-slate-200 text-[9px]">
                <div className="text-center">
                  <div className="w-20 border-b border-slate-600 border-dashed pb-0.5">
                    <span className="font-bold text-slate-800">অভিভাবক</span>
                  </div>
                  <span className="text-slate-400 block mt-0.5">স্বাক্ষর</span>
                </div>

                <div className="text-center">
                  <div className="w-24 border-b border-slate-600 border-dashed pb-0.5">
                    <span className="font-serif italic text-emerald-950 font-bold">হোস্টেল সুপার</span>
                  </div>
                  <span className="text-slate-400 block mt-0.5">অনুমোদনকারী স্বাক্ষর</span>
                </div>

                <div className="text-center">
                  <div className="w-20 border-b border-slate-600 border-dashed pb-0.5">
                    <span className="text-slate-800 font-bold">ফটক গার্ড</span>
                  </div>
                  <span className="text-slate-400 block mt-0.5">নিরাপত্তা সিল</span>
                </div>
              </div>
            </div>

            <div className="pt-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-3 rounded-2xl bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>স্লিপ প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
