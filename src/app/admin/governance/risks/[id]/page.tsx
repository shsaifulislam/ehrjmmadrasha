"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import GovernanceNav from "../../GovernanceNav";

interface RiskDetail {
  id: string;
  titleBn: string;
  titleEn?: string;
  descriptionBn: string;
  riskCategory: string;
  sourceModule: string;
  relatedEntityId?: string;
  ownerName: string;
  ownerRole: string;
  reviewerName?: string;
  inherentLikelihood: number;
  inherentImpact: number;
  inherentScore: number;
  inherentLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  existingControlIds: string[];
  residualLikelihood: number;
  residualImpact: number;
  residualScore: number;
  residualLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  treatmentType: string;
  treatmentPlanBn?: string;
  treatmentOwner?: string;
  treatmentTargetDate?: string;
  status: string;
  acceptanceReasonBn?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  closureReasonBn?: string;
  closedBy?: string;
  closedAt?: string;
  notes?: string;
  nextReviewDate: string;
  createdAt: string;
  updatedAt: string;
}

interface LinkedControl {
  id: string;
  nameBn: string;
  category: string;
  type: string;
  status: string;
  lastTestResult?: string;
}

interface LinkedFinding {
  id: string;
  titleBn: string;
  severity: string;
  status: string;
  createdAt: string;
}

interface AuditRecord {
  id: string;
  timestamp: string;
  action: string;
  actorName: string;
  actorRole: string;
  notes: string;
}

export default function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [risk, setRisk] = useState<RiskDetail | null>(null);
  const [controls, setControls] = useState<LinkedControl[]>([]);
  const [findings, setFindings] = useState<LinkedFinding[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Modals state
  const [showAssessModal, setShowAssessModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Assessment form
  const [inherentL, setInherentL] = useState(3);
  const [inherentI, setInherentI] = useState(3);
  const [residualL, setResidualL] = useState(2);
  const [residualI, setResidualI] = useState(2);
  const [assessNotes, setAssessNotes] = useState("");

  // Acceptance form
  const [acceptReason, setAcceptReason] = useState("");
  const [acceptReviewDate, setAcceptReviewDate] = useState("");
  const [acceptConditions, setAcceptConditions] = useState("");

  // Closure form
  const [closeReason, setCloseReason] = useState("");
  const [closeEvidence, setCloseEvidence] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRiskDetails();
  }, [id]);

  const fetchRiskDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/governance/risks/${id}`);
      const json = await res.json();
      if (json.success) {
        setRisk(json.risk);
        setControls(json.linkedControls || []);
        setFindings(json.linkedFindings || []);
        setAudits(json.audits || []);

        setInherentL(json.risk.inherentLikelihood);
        setInherentI(json.risk.inherentImpact);
        setResidualL(json.risk.residualLikelihood);
        setResidualI(json.risk.residualImpact);
      } else {
        setError(json.error || "ঝুঁকি তথ্য পাওয়া যায়নি।");
      }
    } catch (e: any) {
      setError(e.message || "নেটওয়ার্ক সমস্যা।");
    } finally {
      setLoading(false);
    }
  };

  const handleAssessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/governance/risks/${id}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inherentLikelihood: inherentL,
          inherentImpact: inherentI,
          residualLikelihood: residualL,
          residualImpact: residualI,
          existingControlIds: risk?.existingControlIds || [],
          assessmentNotesBn: assessNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg("ঝুঁকি সফলভাবে পুনর্মূল্যায়ন করা হয়েছে।");
        setShowAssessModal(false);
        fetchRiskDetails();
      } else {
        alert(json.error || "মূল্যায়ন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptReason.trim() || !acceptReviewDate) {
      alert("ঝুঁকি গ্রহণের কারণ এবং পরবর্তী পর্যালোচনার তারিখ আবশ্যক।");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/governance/risks/${id}/treatment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ACCEPT_RISK",
          acceptanceReasonBn: acceptReason,
          nextReviewDate: acceptReviewDate,
          conditionsBn: acceptConditions || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg("ঝুঁকি আনুষ্ঠানিকভাবে গৃহীত (Accepted) হয়েছে।");
        setShowAcceptModal(false);
        fetchRiskDetails();
      } else {
        alert(json.error || "ঝুঁকি গ্রহণ ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeReason.trim()) {
      alert("ঝুঁকি সমাপ্তির কারণ আবশ্যক।");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/governance/risks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOSE_RISK",
          closureReasonBn: closeReason,
          evidenceRef: closeEvidence || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg("ঝুঁকি সফলভাবে সমাপ্ত ও ক্লোজ করা হয়েছে।");
        setShowCloseModal(false);
        fetchRiskDetails();
      } else {
        alert(json.error || "ঝুঁকি সমাপ্তি ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setSubmitting(false);
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <p className="text-slate-400 text-sm">ঝুঁকি তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error || !risk) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
        <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 text-center space-y-4 max-w-md">
          <p className="text-rose-400 text-sm">{error || "ঝুঁকি পাওয়া যায়নি।"}</p>
          <Link
            href="/admin/governance/risks"
            className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
          >
            ঝুঁকি রেজিস্টারে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <GovernanceNav currentTab="risks" />

      {/* Breadcrumb & ID Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/admin/governance/risks" className="hover:text-emerald-400">
            &larr; ঝুঁকি রেজিস্টার
          </Link>
          <span>/</span>
          <span className="font-mono text-emerald-400 font-semibold">{risk.id}</span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowAssessModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-medium transition flex items-center gap-1.5"
          >
            <span>⚖️</span> পুনর্মূল্যায়ন (Assess)
          </button>

          {risk.status !== "ACCEPTED" && risk.status !== "CLOSED" && (
            <button
              onClick={() => setShowAcceptModal(true)}
              className="px-3.5 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 rounded-xl font-medium transition flex items-center gap-1.5"
            >
              <span>🛡️</span> ঝুঁকি গ্রহণ (Accept)
            </button>
          )}

          {risk.status !== "CLOSED" && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="px-3.5 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60 rounded-xl font-medium transition flex items-center gap-1.5"
            >
              <span>🔒</span> ঝুঁকি সমাপ্তি (Close)
            </button>
          )}
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

      {/* Main Risk Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 font-semibold">
                {risk.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 border border-slate-700">
                {risk.riskCategory}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700">
                {risk.sourceModule}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {risk.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">{risk.titleBn}</h1>
            {risk.titleEn && <p className="text-sm text-slate-400 mt-1">{risk.titleEn}</p>}
          </div>

          <div className="text-right text-xs text-slate-400 space-y-1">
            <p>দায়িত্বপ্রাপ্ত: <span className="text-white font-medium">{risk.ownerName}</span> ({risk.ownerRole})</p>
            <p>পরবর্তী পর্যালোচনা: <span className="text-emerald-400 font-mono font-medium">{risk.nextReviewDate}</span></p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
          {risk.descriptionBn}
        </p>

        {/* Acceptance / Closure Notes if any */}
        {risk.status === "ACCEPTED" && (
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>🛡️</span> প্রাতিষ্ঠানিক ঝুঁকি গ্রহণ অনুমোদন বিবরণ (Formal Risk Acceptance)
            </p>
            <p>কারণ: {risk.acceptanceReasonBn}</p>
            <p className="text-purple-400 text-[11px]">অনুমোদনকারী: {risk.acceptedBy} • তারিখ: {risk.acceptedAt}</p>
          </div>
        )}

        {risk.status === "CLOSED" && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>🔒</span> ঝুঁকি আনুষ্ঠানিক সমাপ্তি বিবরণ (Closure Record)
            </p>
            <p>সমাপ্তির কারণ: {risk.closureReasonBn}</p>
            <p className="text-rose-400 text-[11px]">সমাপ্তকারী: {risk.closedBy} • তারিখ: {risk.closedAt}</p>
          </div>
        )}
      </div>

      {/* 5x5 Inherent vs Residual Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inherent Score Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">সহজাত ঝুঁকি (Inherent Risk)</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getLevelBadge(risk.inherentLevel)}`}>
              {risk.inherentScore} — {risk.inherentLevel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">সম্ভাব্যতা (Likelihood)</span>
              <span className="text-xl font-bold text-white">{risk.inherentLikelihood} / 5</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">প্রভাব (Impact)</span>
              <span className="text-xl font-bold text-white">{risk.inherentImpact} / 5</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            নিয়ন্ত্রণ ব্যবস্থা প্রয়োগের পূর্বে এই ঝুঁকির প্রাকৃতিক বিপদ মাত্রা।
          </p>
        </div>

        {/* Residual Score Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-emerald-400">অবশিষ্ট ঝুঁকি (Residual Risk)</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getLevelBadge(risk.residualLevel)}`}>
              {risk.residualScore} — {risk.residualLevel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">নিয়ন্ত্রণোত্তর সম্ভাব্যতা</span>
              <span className="text-xl font-bold text-emerald-400">{risk.residualLikelihood} / 5</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">নিয়ন্ত্রণোত্তর প্রভাব</span>
              <span className="text-xl font-bold text-emerald-400">{risk.residualImpact} / 5</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            বিদ্যমান অভ্যন্তরীণ নিয়ন্ত্রণ প্রয়োগ ও পরীক্ষার পর অবশিষ্ট প্রকৃত ঝুঁকি মাত্রা।
          </p>
        </div>
      </div>

      {/* Linked Controls & Linked Findings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Linked Controls */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">সংযুক্ত অভ্যন্তরীণ নিয়ন্ত্রণ ব্যবস্থা</h3>
            <span className="text-xs text-slate-400 font-mono">{controls.length} টি</span>
          </div>

          {controls.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              এই ঝুঁকির বিপরীতে কোনো নিয়ন্ত্রণ যুক্ত নেই।
            </div>
          ) : (
            <div className="space-y-2">
              {controls.map((ctrl) => (
                <div
                  key={ctrl.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <Link
                      href={`/admin/governance/controls`}
                      className="font-semibold text-slate-200 hover:text-emerald-400 transition"
                    >
                      {ctrl.nameBn}
                    </Link>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {ctrl.id} • {ctrl.category} • {ctrl.type}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                      ctrl.lastTestResult === "EFFECTIVE"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : ctrl.lastTestResult === "INEFFECTIVE"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {ctrl.lastTestResult || "পরীক্ষাহীন"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked Findings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">সম্পর্কিত পর্যবেক্ষণ ও বিচ্যুতি (Findings)</h3>
            <span className="text-xs text-slate-400 font-mono">{findings.length} টি</span>
          </div>

          {findings.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              কোনো সক্রিয় পর্যবেক্ষণ বা বিচ্যুতি রেকর্ড নেই।
            </div>
          ) : (
            <div className="space-y-2">
              {findings.map((fnd) => (
                <div
                  key={fnd.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <Link
                      href={`/admin/governance/findings`}
                      className="font-semibold text-slate-200 hover:text-rose-400 transition"
                    >
                      {fnd.titleBn}
                    </Link>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {fnd.id} • {fnd.createdAt.slice(0, 10)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getLevelBadge(
                      fnd.severity
                    )}`}
                  >
                    {fnd.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Immutable Audit Trail */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">অপরিবর্তনীয় অডিট ট্রেইল (Immutable Audit Trail)</h3>

        {audits.length === 0 ? (
          <p className="text-xs text-slate-500 italic">কোনো অডিট লগ রেকর্ড পাওয়া যায়নি।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">সময়</th>
                  <th className="py-2.5 px-3">অ্যাকশন</th>
                  <th className="py-2.5 px-3">কর্তা</th>
                  <th className="py-2.5 px-3">নোট ও বিবরণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {audits.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleString("bn-BD")}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-emerald-400 whitespace-nowrap">
                      {a.action}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {a.actorName} ({a.actorRole})
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{a.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Re-Assessment Modal */}
      {showAssessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">ঝুঁকি স্কোর পুনর্মূল্যায়ন</h3>
              <button onClick={() => setShowAssessModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleAssessSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">সহজাত সম্ভাব্যতা ({inherentL})</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={inherentL}
                    onChange={(e) => setInherentL(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">সহজাত প্রভাব ({inherentI})</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={inherentI}
                    onChange={(e) => setInherentI(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">অবশিষ্ট সম্ভাব্যতা ({residualL})</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={residualL}
                    onChange={(e) => setResidualL(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">অবশিষ্ট প্রভাব ({residualI})</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={residualI}
                    onChange={(e) => setResidualI(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">মূল্যায়ন নোট</label>
                <textarea
                  rows={2}
                  value={assessNotes}
                  onChange={(e) => setAssessNotes(e.target.value)}
                  placeholder="স্কোর পরিবর্তনের কারণ ও ন্যায্যতা..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssessModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "মূল্যায়ন সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formal Acceptance Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-purple-300">আনুষ্ঠানিক প্রাতিষ্ঠানিক ঝুঁকি গ্রহণ</h3>
              <button onClick={() => setShowAcceptModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-slate-400">
              সুশাসন বিধিমালা অনুযায়ী অবশিষ্ট ঝুঁকি গ্রহণ একটি নিয়ন্ত্রিত সিদ্ধান্ত। মুহতামিম/প্রিন্সিপাল ছাড়া কেউ ঝুঁকি গ্রহণ করতে পারেন না।
            </p>
            <form onSubmit={handleAcceptSubmit} className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">ঝুঁকি গ্রহণের কারণ ও ন্যায্যতা *</label>
                <textarea
                  rows={3}
                  value={acceptReason}
                  onChange={(e) => setAcceptReason(e.target.value)}
                  placeholder="কেন এই ঝুঁকিটি প্রশমন না করে গ্রহণ করা হচ্ছে..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">পরবর্তী পর্যালোচনার তারিখ *</label>
                <input
                  type="date"
                  value={acceptReviewDate}
                  onChange={(e) => setAcceptReviewDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">বিশেষ শর্তাবলী (Conditions)</label>
                <input
                  type="text"
                  value={acceptConditions}
                  onChange={(e) => setAcceptConditions(e.target.value)}
                  placeholder="যেমন: ৩ মাস পর বাজেট বরাদ্দ সাপেক্ষে পুনরায় পরীক্ষা করা হবে"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold"
                >
                  {submitting ? "প্রক্রিয়াধীন..." : "ঝুঁকি গ্রহণ নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formal Closure Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-rose-300">ঝুঁকি রেজিস্টার সমাপ্তি (Close Risk)</h3>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-slate-400">
              কোনো ঝুঁকি গোপনে বন্ধ করা যাবে না। সমাপ্তির কারণ ও প্রমাণ রেফারেন্স সংরক্ষণ আবশ্যক।
            </p>
            <form onSubmit={handleCloseSubmit} className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">সমাপ্তির কারণ ও যুক্তি *</label>
                <textarea
                  rows={3}
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder="যেমন: নতুন অটোমেটেড সফটওয়্যার মডিউল ও দুই স্তরের নিয়ন্ত্রণ চালু হওয়ায় ঝুঁকিটি সম্পূর্ণভাবে দূর হয়েছে..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">প্রমাণ রেফারেন্স / ডকুমেন্ট টোকেন</label>
                <input
                  type="text"
                  value={closeEvidence}
                  onChange={(e) => setCloseEvidence(e.target.value)}
                  placeholder="যেমন: AUDIT-DOC-2026-081 বা Phase 29 টোকেন"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold"
                >
                  {submitting ? "সমাপ্ত হচ্ছে..." : "ঝুঁকি সমাপ্ত ঘোষণা করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
