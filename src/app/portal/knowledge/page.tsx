"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookOpen,
  ArrowRight,
  Shield,
  UserCheck,
  X,
  Lock,
} from "lucide-react";
import { KnowledgeDocument } from "@/lib/policies/types";

export default function PortalKnowledgeAcknowledgementPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState<KnowledgeDocument | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadAcknowledgements = async () => {
    try {
      const res = await fetch("/api/governance/acknowledgements?mode=my-pending");
      const data = await res.json();
      if (data.success) {
        setPending(data.pending || []);
        setCompleted(data.completed || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcknowledgements();
  }, []);

  const handleAcknowledge = async () => {
    if (!activeDoc || !agreed) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/governance/documents/${activeDoc.id}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: activeDoc.currentVersion }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg(data.message || "নীতিমালা স্বীকৃতি সফল হয়েছে।");
        setActiveDoc(null);
        setAgreed(false);
        await loadAcknowledgements();
      } else {
        alert(data.error || "স্বীকৃতি প্রদান ব্যর্থ হয়েছে।");
      }
    } catch (e: any) {
      alert("ত্রুটি: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> প্রাতিষ্ঠানিক কমপ্লায়েন্স ও সম্মতি
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display">
            নীতিমালা ও আচরণবিধি স্বীকৃতি সেন্টার
          </h1>
          <p className="text-sm text-emerald-100/90 leading-relaxed font-light">
            মাদরাসার শিক্ষক ও কর্মচারীদের ক্ষেত্রে প্রাতিষ্ঠানিক আচরণবিধি, আইটি ও ডেটা সিকিউরিটি এবং পাঠদান সংক্রান্ত
            অনুমোদিত নীতিমালার শর্তাবলী পাঠপূর্বক ডিজিটাল সম্মতি নিশ্চিতকরণ বাধ্যতামূলক।
          </p>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            {toastMsg}
          </div>
          <button onClick={() => setToastMsg(null)} className="text-stone-500 hover:text-stone-800 text-xs font-bold">
            মুছে ফেলুন
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-stone-500 space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>আপনার স্বীকৃতি সংক্রান্ত তালিকা প্রস্তুত হচ্ছে...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Pending Acknowledgements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                অপেক্ষমাণ সম্মতি ও স্বীকৃতি ({pending.length})
              </h2>
              {pending.length > 0 && (
                <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 font-semibold rounded-full border border-amber-200">
                  জরুরি পদক্ষেপ আবশ্যক
                </span>
              )}
            </div>

            {pending.length === 0 ? (
              <div className="p-8 bg-white border border-stone-200 rounded-2xl text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-stone-800 text-base">কোনো অপেক্ষমাণ স্বীকৃতি নেই</h3>
                <p className="text-xs text-stone-500">আপনার দায়িত্বের সকল আবশ্যকীয় নীতিমালা ইতোমধ্যে গৃহীত হয়েছে।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pending.map((item) => {
                  const d = item.document as KnowledgeDocument;
                  return (
                    <div
                      key={d.id}
                      className="bg-white border-2 border-amber-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-amber-800 font-bold px-2 py-0.5 bg-amber-50 rounded">
                            {d.documentCode}
                          </span>
                          <span className="text-stone-500 font-semibold">ভার্সন: {d.currentVersion}</span>
                        </div>
                        <h3 className="font-bold text-stone-900 text-base">{d.titleBn}</h3>
                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{d.description}</p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-[11px] text-stone-400">কার্যকর: {d.effectiveFrom}</span>
                        <button
                          onClick={() => {
                            setActiveDoc(d);
                            setAgreed(false);
                          }}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                        >
                          পাঠপূর্বক সম্মতি দিন <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Completed Acknowledgements */}
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              পূর্বে সম্পন্নকৃত স্বীকৃতি ({completed.length})
            </h2>

            {completed.length === 0 ? (
              <div className="p-6 bg-stone-50 border border-stone-200 rounded-2xl text-center text-xs text-stone-500">
                পূর্বে কোনো স্বীকৃতি রেকর্ড করা হয়নি।
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
                      <th className="p-4">ডকুমেন্ট কোড</th>
                      <th className="p-4">শিরোনাম</th>
                      <th className="p-4">স্বীকৃত সংস্করণ</th>
                      <th className="p-4">স্বীকৃতির সময়</th>
                      <th className="p-4 text-right">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {completed.map((c, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="p-4 font-mono font-bold text-stone-700">{c.document.documentCode}</td>
                        <td className="p-4 font-semibold text-stone-900">{c.document.titleBn}</td>
                        <td className="p-4 font-mono font-medium text-emerald-700">{c.version}</td>
                        <td className="p-4 text-stone-500">{new Date(c.acknowledgedAt).toLocaleString("bn-BD")}</td>
                        <td className="p-4 text-right">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> স্বীকৃত
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explicit Consent Modal */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200">
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 to-teal-950 text-white flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-amber-300">{activeDoc.documentCode} • {activeDoc.currentVersion}</div>
                <h3 className="font-bold text-base sm:text-lg">{activeDoc.titleBn}</h3>
              </div>
              <button
                onClick={() => setActiveDoc(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-emerald-200 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-grow text-stone-800 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  অনুগ্রহ করে নীতিমালার শর্তসমূহ পূর্ণাঙ্গ পাঠ করুন। পাঠ সম্পন্ন হওয়ার পর নিচে সম্মতি নিশ্চিত করুন।
                </span>
              </div>

              <div className="prose prose-sm max-w-none p-5 bg-stone-50 rounded-2xl border border-stone-200 leading-relaxed whitespace-pre-line font-serif">
                {activeDoc.contentMarkdown || activeDoc.contentText}
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-5 h-5 rounded border-emerald-400 text-emerald-800 focus:ring-emerald-700 mt-0.5"
                  />
                  <span className="font-semibold text-stone-900 text-xs sm:text-sm leading-relaxed">
                    আমি অত্র প্রাতিষ্ঠানিক নীতিমালা ও আচরণবিধি মনোযোগ সহকারে পাঠ করেছি এবং উহার বিধান মানিয়া চলতে
                    ডিজিটাল সম্মতি প্রদান করছি।
                  </span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
              <button
                onClick={() => setActiveDoc(null)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl font-medium transition"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleAcknowledge}
                disabled={!agreed || submitting}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center gap-2 shadow"
              >
                <UserCheck className="w-4 h-4" />
                {submitting ? "সংরক্ষণ হচ্ছে..." : "ডিজিটাল সম্মতি নিশ্চিত করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
