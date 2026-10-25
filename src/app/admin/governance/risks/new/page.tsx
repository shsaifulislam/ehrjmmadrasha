"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GovernanceNav from "../../GovernanceNav";

interface ControlOption {
  id: string;
  nameBn: string;
  category: string;
  type: string;
}

export default function NewRiskPage() {
  const router = useRouter();

  const [controlsList, setControlsList] = useState<ControlOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [titleBn, setTitleBn] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descriptionBn, setDescriptionBn] = useState("");
  const [riskCategory, setRiskCategory] = useState("FINANCIAL");
  const [sourceModule, setSourceModule] = useState("FINANCE_PHASE_6");
  const [relatedEntityId, setRelatedEntityId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerRole, setOwnerRole] = useState("OFFICER");

  // Scoring
  const [inherentLikelihood, setInherentLikelihood] = useState(3);
  const [inherentImpact, setInherentImpact] = useState(3);
  const [selectedControlIds, setSelectedControlIds] = useState<string[]>([]);
  const [residualLikelihood, setResidualLikelihood] = useState(2);
  const [residualImpact, setResidualImpact] = useState(2);

  // Treatment
  const [treatmentType, setTreatmentType] = useState("MITIGATE");
  const [treatmentPlanBn, setTreatmentPlanBn] = useState("");
  const [treatmentOwner, setTreatmentOwner] = useState("");
  const [treatmentTargetDate, setTreatmentTargetDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchControls();
  }, []);

  const fetchControls = async () => {
    try {
      const res = await fetch("/api/admin/governance/controls");
      const json = await res.json();
      if (json.success) {
        setControlsList(json.controls || []);
      }
    } catch (e) {
      console.error("Failed to fetch controls list", e);
    }
  };

  const getScoreInfo = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    let level = "LOW";
    let badgeClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    if (score >= 15) {
      level = "CRITICAL";
      badgeClass = "bg-rose-500/20 text-rose-300 border-rose-500/40";
    } else if (score >= 10) {
      level = "HIGH";
      badgeClass = "bg-amber-500/20 text-amber-300 border-amber-500/40";
    } else if (score >= 5) {
      level = "MEDIUM";
      badgeClass = "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
    }
    return { score, level, badgeClass };
  };

  const inherent = getScoreInfo(inherentLikelihood, inherentImpact);
  const residual = getScoreInfo(residualLikelihood, residualImpact);

  const toggleControl = (id: string) => {
    if (selectedControlIds.includes(id)) {
      setSelectedControlIds(selectedControlIds.filter((cid) => cid !== id));
    } else {
      setSelectedControlIds([...selectedControlIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleBn.trim() || !descriptionBn.trim() || !ownerName.trim()) {
      setError("ঝুঁকির শিরোনাম, বিস্তারিত বিবরণ এবং দায়িত্বপ্রাপ্ত ব্যক্তির নাম পূরণ করুন।");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/admin/governance/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleBn,
          titleEn: titleEn || undefined,
          descriptionBn,
          riskCategory,
          sourceModule,
          relatedEntityId: relatedEntityId || undefined,
          ownerName,
          ownerRole,
          inherentLikelihood,
          inherentImpact,
          existingControlIds: selectedControlIds,
          residualLikelihood,
          residualImpact,
          treatmentType,
          treatmentPlanBn: treatmentPlanBn || undefined,
          treatmentOwner: treatmentOwner || undefined,
          treatmentTargetDate: treatmentTargetDate || undefined,
          notes: notes || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg("ঝুঁকি সফলভাবে রেজিস্টারে অন্তর্ভুক্ত হয়েছে! আইডি: " + json.risk.id);
        setTimeout(() => {
          router.push(`/admin/governance/risks/${json.risk.id}`);
        }, 1200);
      } else {
        setError(json.error || "ঝুঁকি সংরক্ষণ করা সম্ভব হয়নি।");
      }
    } catch (err: any) {
      setError(err.message || "নেটওয়ার্ক সমস্যা।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <GovernanceNav currentTab="risks" />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/admin/governance/risks" className="hover:text-emerald-400">
          &larr; ঝুঁকি রেজিস্টার
        </Link>
        <span>/</span>
        <span className="text-slate-200">নতুন ঝুঁকি অন্তর্ভুক্তিকরণ</span>
      </div>

      <div className="max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="border-b border-slate-800 pb-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">নতুন প্রাতিষ্ঠানিক ঝুঁকি নথিভুক্ত করুন</h2>
          <p className="text-xs text-slate-400 mt-1">
            ঝুঁকি শনাক্তকরণ, সহজাত মাত্রা নিরূপণ, অভ্যন্তরীণ নিয়ন্ত্রণ সংযোগ এবং প্রতিকার পরিকল্পনা লিপিবদ্ধ করুন।
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Section 1: Basic Identifiers */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-emerald-400 border-b border-slate-800/80 pb-2">
              ১. ঝুঁকির পরিচিতি ও বিবরণ
            </h3>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                ঝুঁকির শিরোনাম (বাংলায়) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder="যেমন: শরীয়াহ্ খাতের অনুদান তহবিলের মিশ্রণ ঝুঁকি"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">ঝুঁকির শিরোনাম (English - ঐচ্ছিক)</label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g., Risk of Shariah donation fund commingling"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                বিস্তারিত বর্ণনা ও সম্ভাব্য ক্ষতির ধরণ <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={descriptionBn}
                onChange={(e) => setDescriptionBn(e.target.value)}
                placeholder="ঝুঁকির কারণ, প্রেক্ষাপট এবং এটি ঘটলে প্রতিষ্ঠানে কী ধরণের আর্থিক, আইনি বা শিক্ষাগত ক্ষতি হতে পারে তা লিখুন..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  ঝুঁকির ক্যাটাগরি <span className="text-rose-400">*</span>
                </label>
                <select
                  value={riskCategory}
                  onChange={(e) => setRiskCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="FINANCIAL">আর্থিক (Financial)</option>
                  <option value="ACADEMIC">একাডেমিক (Academic)</option>
                  <option value="STUDENT">শিক্ষার্থী তথ্য ও নিরাপত্তা (Student)</option>
                  <option value="OPERATIONAL">পরিচালন ও সেবা (Operational)</option>
                  <option value="SECURITY">সাইবার ও সিস্টেম নিরাপত্তা (Security)</option>
                  <option value="TECHNOLOGY">আইটি ও প্রযুক্তিগত (Technology)</option>
                  <option value="COMPLIANCE_GOVERNANCE">আইন ও সুশাসন পরিপালন (Compliance)</option>
                  <option value="VENDOR_PROCUREMENT">ক্রয় ও ভেন্ডর নির্ভরতা (Procurement)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  উৎস মডিউল (Authoritative Source Module) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={sourceModule}
                  onChange={(e) => setSourceModule(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="FINANCE_PHASE_6">Phase 6 - অর্থ ও হিসাব (Finance)</option>
                  <option value="ACADEMIC_PHASE_4">Phase 4 - পরীক্ষা ও ফলাফল (Academic)</option>
                  <option value="HR_PHASE_13">Phase 13 - মানবসম্পদ ও বেতন (HR/Payroll)</option>
                  <option value="SECURITY_PHASE_17_24">Phase 17/24 - নিরাপত্তা ও এক্সেস কন্ট্রোল</option>
                  <option value="OPERATIONS_PHASE_16">Phase 16 - সিস্টেম পরিচালনা ও ব্যাকআপ</option>
                  <option value="INVENTORY_PHASE_12">Phase 12 - ইনভেন্টরি ও সম্পত্তি</option>
                  <option value="VENDOR_PHASE_40">Phase 40 - প্রকিউরমেন্ট ও চুক্তি</option>
                  <option value="BUDGET_PHASE_41">Phase 41 - বাজেট ও ব্যয় বরাদ্দ</option>
                  <option value="GOVERNANCE_PHASE_20">Phase 20 - মুহতামিম ও গভর্নিং বডি</option>
                  <option value="GENERAL">সাধারণ প্রাতিষ্ঠানিক ঝুঁকি (General)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  দায়িত্বপ্রাপ্ত কর্মকর্তা (Owner) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="যেমন: প্রধান হিসাবরক্ষক"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">পদবী (Role)</label>
                <input
                  type="text"
                  value={ownerRole}
                  onChange={(e) => setOwnerRole(e.target.value)}
                  placeholder="যেমন: ACCOUNTANT / OFFICER"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">সম্পর্কিত রেফারেন্স আইডি (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={relatedEntityId}
                  onChange={(e) => setRelatedEntityId(e.target.value)}
                  placeholder="যেমন: FUND-001 বা CTR-2026-0001"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Inherent Risk Scoring */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-emerald-400">
                ২. সহজাত ঝুঁকি নিরূপণ (Inherent Risk — নিয়ন্ত্রণ ছাড়া প্রাথমিক মাত্রা)
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${inherent.badgeClass}`}>
                সহজাত স্কোর: {inherent.score} ({inherent.level})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">সম্ভাব্যতা (Likelihood):</span>
                  <span className="text-emerald-400 font-bold">{inherentLikelihood} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={inherentLikelihood}
                  onChange={(e) => setInherentLikelihood(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>১: অত্যন্ত বিরল</span>
                  <span>৩: সম্ভাব্য</span>
                  <span>৫: প্রায় নিশ্চিত</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">প্রভাব / ক্ষতির গভীরতা (Impact):</span>
                  <span className="text-emerald-400 font-bold">{inherentImpact} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={inherentImpact}
                  onChange={(e) => setInherentImpact(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>১: নগণ্য</span>
                  <span>৩: মাঝারি</span>
                  <span>৫: বিপর্যয়কর</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Existing Controls Mapping */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-emerald-400">
              ৩. বিদ্যমান অভ্যন্তরীণ নিয়ন্ত্রণ ব্যবস্থা সংযোগ (Existing Internal Controls)
            </h3>
            <p className="text-slate-400 text-xs">
              এই ঝুঁকি প্রশমনে বর্তমানে মাদরাসায় যেসকল নিয়ন্ত্রণ ও নজরদারি চালু রয়েছে তা সিলেক্ট করুন:
            </p>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
              {controlsList.length === 0 ? (
                <p className="text-slate-500 italic">কোনো নিয়ন্ত্রণ রেকর্ড পাওয়া যায়নি।</p>
              ) : (
                controlsList.map((ctrl) => {
                  const isChecked = selectedControlIds.includes(ctrl.id);
                  return (
                    <div
                      key={ctrl.id}
                      onClick={() => toggleControl(ctrl.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isChecked
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                          : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="accent-emerald-500 rounded"
                        />
                        <div>
                          <p className="font-medium text-xs text-white">{ctrl.nameBn}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {ctrl.id} • {ctrl.category} • {ctrl.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 4: Residual Risk Scoring */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-emerald-400">
                ৪. অবশিষ্ট ঝুঁকি নিরূপণ (Residual Risk — নিয়ন্ত্রণ প্রয়োগের পর বর্তমান মাত্রা)
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${residual.badgeClass}`}>
                অবশিষ্ট স্কোর: {residual.score} ({residual.level})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">নিয়ন্ত্রণ পরবর্তী সম্ভাব্যতা:</span>
                  <span className="text-emerald-400 font-bold">{residualLikelihood} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={residualLikelihood}
                  onChange={(e) => setResidualLikelihood(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">নিয়ন্ত্রণ পরবর্তী প্রভাব:</span>
                  <span className="text-emerald-400 font-bold">{residualImpact} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={residualImpact}
                  onChange={(e) => setResidualImpact(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Treatment & Review Plan */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-emerald-400">৫. ঝুঁকি ব্যবস্থাপনা ও প্রতিকার পরিকল্পনা</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">ব্যবস্থাপনার কৌশল (Treatment Type)</label>
                <select
                  value={treatmentType}
                  onChange={(e) => setTreatmentType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="MITIGATE">প্রশমন (Mitigate — নিয়ন্ত্রণ জোরদার করা)</option>
                  <option value="ACCEPT">গ্রহণ (Accept — অবশিষ্ট ঝুঁকি অনুমোদনপূর্বক গ্রহণ)</option>
                  <option value="TRANSFER">হস্তান্তর (Transfer — বীমা বা তৃতীয় পক্ষের ওপর ন্যস্ত)</option>
                  <option value="AVOID">পরিহার (Avoid — ঝুঁকিপূর্ণ কার্যক্রম বন্ধ করা)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">বাস্তবায়নকারী কর্মকর্তা (Action Owner)</label>
                <input
                  type="text"
                  value={treatmentOwner}
                  onChange={(e) => setTreatmentOwner(e.target.value)}
                  placeholder="যেমন: সহকারী হিসাবরক্ষক"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">বাস্তবায়নের লক্ষ্যমাত্রা তারিখ</label>
                <input
                  type="date"
                  value={treatmentTargetDate}
                  onChange={(e) => setTreatmentTargetDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">প্রশমন বা প্রতিকার কর্মপরিকল্পনা</label>
              <textarea
                rows={2}
                value={treatmentPlanBn}
                onChange={(e) => setTreatmentPlanBn(e.target.value)}
                placeholder="ঝুঁকি হ্রাসে কী কী সুনির্দিষ্ট পদক্ষেপ গ্রহণ করা হবে..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">অতিরিক্ত নোট বা মন্তব্য</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="গভর্নিং বডি বা মুহতামিমের বিশেষ কোনো পর্যবেক্ষণ..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-end gap-3">
            <Link
              href="/admin/governance/risks"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
            >
              বাতিল
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/30 transition flex items-center gap-2"
            >
              {submitting ? "সংরক্ষণ হচ্ছে..." : "ঝুঁকি রেজিস্টারে সংরক্ষণ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
