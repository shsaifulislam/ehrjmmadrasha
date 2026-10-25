"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ComplianceNav from "../ComplianceNav";
import { ComplianceRequirement } from "@/lib/compliance";

export default function RequirementsListPage() {
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [scope, setScope] = useState("");

  useEffect(() => {
    fetchRequirements();
  }, [category, source, scope]);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (source) params.append("source", source);
      if (scope) params.append("scope", scope);
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/compliance/requirements?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "প্রয়োজনীয়তা লোড করতে ব্যর্থ হয়েছে।");
      }
      setRequirements(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequirements();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <ComplianceNav currentTab="requirements" />

      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">কমপ্লায়েন্স প্রয়োজনীয়তা রেজিস্টার</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            শিক্ষা বোর্ড, শরিয়াহ্ নীতিমালা, সরকারি প্রবিধান ও দাতা সংস্থার শর্তাবলী তালিকা
          </p>
        </div>
        <Link
          href="/admin/compliance/requirements/new"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>+</span> নতুন শর্ত যুক্ত করুন
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="আইডি, শিরোনাম বা উৎস দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">সকল ক্যাটাগরি</option>
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

        <div>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">সকল উৎস</option>
            <option value="INTERNAL_POLICY">অভ্যন্তরীণ নীতিমালা</option>
            <option value="INSTITUTIONAL_SOP">প্রাতিষ্ঠানিক এসওপি</option>
            <option value="AUTHORITY">শিক্ষা বোর্ড / কর্তৃপক্ষ</option>
            <option value="REGULATORY">আইনগত ও নিয়ন্ত্রক</option>
            <option value="CONTRACT">চুক্তিনামা (Phase 40)</option>
            <option value="OPERATIONAL">অপারেশনাল মানদণ্ড</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
        >
          অনুসন্ধান
        </button>
      </form>

      {/* Requirements Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">প্রয়োজনীয়তা তালিকা লোড হচ্ছে...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-400 text-xs">{error}</div>
        ) : requirements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">কোনো শর্তাবলী পাওয়া যায়নি।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">আইডি ও সংস্করণ</th>
                  <th className="py-3 px-4">শিরোনাম ও বিবরণ</th>
                  <th className="py-3 px-4">উৎস ও এখতিয়ার</th>
                  <th className="py-3 px-4">ক্যাটাগরি ও ক্ষেত্র</th>
                  <th className="py-3 px-4">প্রযোজ্যতা</th>
                  <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requirements.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-emerald-400 font-semibold">{r.id}</span>
                      <span className="block text-[10px] text-slate-500">v{r.version}.0</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate">{r.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{r.description}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                        {r.source}
                      </span>
                      <span className="block text-[11px] text-slate-400 mt-1 truncate max-w-[150px]">
                        {r.jurisdiction}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300">{r.category}</span>
                      <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                        {r.applicabilityScope}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.isApplicable
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {r.isApplicable ? "প্রযোজ্য (Applicable)" : "অপ্রযোজ্য"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/compliance/requirements/${r.id}`}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition inline-block"
                      >
                        বিবরণ →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
