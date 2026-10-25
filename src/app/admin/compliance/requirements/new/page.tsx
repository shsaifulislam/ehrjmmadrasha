"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ComplianceNav from "../../ComplianceNav";

export default function NewRequirementPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    source: "AUTHORITY",
    sourceReference: "",
    authoritativeSourceRef: "",
    jurisdiction: "বাংলাদেশ মাদরাসা শিক্ষা বোর্ড (ঢাকা)",
    category: "ACADEMIC_CURRICULUM",
    applicabilityScope: "INSTITUTION_WIDE",
    effectiveDate: new Date().toISOString().slice(0, 10),
    reviewDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    relatedControlId: "",
    relatedRiskId: "",
    relatedContractId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("প্রয়োজনীয়তার শিরোনাম প্রদান আবশ্যক।");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/compliance/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "সংরক্ষণে ব্যর্থ হয়েছে।");
      }
      router.push(`/admin/compliance/requirements/${json.data.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <ComplianceNav currentTab="requirements" />

      <div className="max-w-3xl mx-auto bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="border-b border-slate-800 pb-4">
          <Link href="/admin/compliance/requirements" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
            ← প্রয়োজনীয়তা তালিকায় ফিরে যান
          </Link>
          <h2 className="text-xl font-bold text-white mt-2">নতুন কমপ্লায়েন্স প্রয়োজনীয়তা নথিভুক্ত করুন</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            প্রাতিষ্ঠানিক নীতি, বোর্ড প্রবিধান বা চুক্তির আলোকে নতুন শর্ত ও বাধ্যবাধকতা নির্ধারণ
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              প্রয়োজনীয়তার শিরোনাম (Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="উদাঃ দাখিল ২০২৬ রেজিস্ট্রেশন ও ফলাফল অনুমোদন"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">বিস্তারিত বিবরণ ও শর্তাবলী</label>
            <textarea
              rows={3}
              placeholder="প্রয়োজনীয়তার বিস্তারিত পরিধি ও নিয়মাবলী লিখুন..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">উৎস (Source)</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="AUTHORITY">শিক্ষা বোর্ড / সরকারি কর্তৃপক্ষ</option>
                <option value="INTERNAL_POLICY">অভ্যন্তরীণ নীতিমালা (Phase 38)</option>
                <option value="INSTITUTIONAL_SOP">প্রাতিষ্ঠানিক এসওপি</option>
                <option value="REGULATORY">আইনগত প্রবিধান</option>
                <option value="CONTRACT">চুক্তিনামা (Phase 40)</option>
                <option value="OPERATIONAL">অপারেশনাল মানদণ্ড</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">ক্যাটাগরি (Category)</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ACADEMIC_CURRICULUM">একাডেমিক ও পাঠ্যক্রম</option>
                <option value="FINANCIAL_SHARIAH">আর্থিক ও শরিয়াহ্</option>
                <option value="STUDENT_WELFARE">শিক্ষার্থী কল্যাণ</option>
                <option value="SAFETY_INFRASTRUCTURE">নিরাপত্তা ও অবকাঠামো</option>
                <option value="DATA_PRIVACY">ডাটা সুরক্ষা ও গোপনীয়তা</option>
                <option value="EMPLOYEE_HR">মানবসম্পদ ও শিক্ষক</option>
                <option value="PROCUREMENT_VENDOR">ক্রয় ও সরবরাহকারী</option>
                <option value="GOVERNANCE_STATUTORY">সুশাসন ও সংবিধিবদ্ধ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">এখতিয়ার বা আইনি ক্ষেত্র (Jurisdiction)</label>
              <input
                type="text"
                value={form.jurisdiction}
                onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">প্রযোজ্যতার ক্ষেত্র (Applicability Scope)</label>
              <select
                value={form.applicabilityScope}
                onChange={(e) => setForm({ ...form, applicabilityScope: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="INSTITUTION_WIDE">সমগ্র মাদরাসা (Institution-Wide)</option>
                <option value="DEPARTMENT">নির্দিষ্ট বিভাগ</option>
                <option value="FINANCE">হিসাব ও অর্থ শাখা</option>
                <option value="HR">মানবসম্পদ শাখা</option>
                <option value="PROCUREMENT">ক্রয় ও স্টোর</option>
                <option value="TECHNOLOGY">আইটি ও সার্ভার শাখা</option>
                <option value="RESIDENTIAL">আবাসিক হোস্টেল</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">উৎস রেফারেন্স (Gazette / Notice Ref)</label>
              <input
                type="text"
                placeholder="উদাঃ BMEB/Reg-2026/01"
                value={form.sourceReference}
                onChange={(e) => setForm({ ...form, sourceReference: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">কর্তৃপক্ষীয় প্রমাণ রেফারেন্স</label>
              <input
                type="text"
                placeholder="যাচাইকৃত নথি শিরোনাম"
                value={form.authoritativeSourceRef}
                onChange={(e) => setForm({ ...form, authoritativeSourceRef: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">কার্যকর তারিখ</label>
              <input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">পরবর্তী পর্যালোচনা তারিখ</label>
              <input
                type="date"
                value={form.reviewDate}
                onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Link
              href="/admin/compliance/requirements"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
            >
              বাতিল
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md transition disabled:opacity-50"
            >
              {submitting ? "সংরক্ষণ করা হচ্ছে..." : "বাধ্যবাধকতা সংরক্ষণ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
