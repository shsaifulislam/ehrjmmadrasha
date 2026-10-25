"use client";

import React, { useEffect, useState } from "react";
import ComplianceNav from "../ComplianceNav";
import { ComplianceReportType } from "@/lib/compliance";

export default function ComplianceReportsPage() {
  const [reportType, setReportType] = useState<ComplianceReportType>("MANAGEMENT_ASSURANCE_REPORT");
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/compliance/reports?type=${reportType}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "প্রতিবেদন লোড করতে ব্যর্থ হয়েছে।");
      }
      setReportData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      <div className="print:hidden">
        <ComplianceNav currentTab="reports" />
      </div>

      {/* Control & Selector Bar */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">১২টি প্রাতিষ্ঠানিক কমপ্লায়েন্স প্রতিবেদন (Reports)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            পরিচালনা পর্ষদ, শিক্ষা বোর্ড ও অডিট কমিটির জন্য প্রিন্ট ও পিডিএফ উপযোগী প্রতিবেদন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ComplianceReportType)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="MANAGEMENT_ASSURANCE_REPORT">১. পরিচালনা পর্ষদ ও অধ্যক্ষ নিশ্চয়তা প্রতিবেদন</option>
            <option value="COMPLIANCE_STATUS_REPORT">২. সার্বিক প্রাতিষ্ঠানিক কমপ্লায়েন্স স্থিতি প্রতিবেদন</option>
            <option value="REQUIREMENT_REGISTER">৩. কমপ্লায়েন্স প্রয়োজনীয়তা রেজিস্টার</option>
            <option value="OBLIGATION_REGISTER">৪. কমপ্লায়েন্স দায় ও অঙ্গীকার রেজিস্টার</option>
            <option value="OVERDUE_OBLIGATIONS_REPORT">৫. সময়োত্তীর্ণ দায় ও জরুরী সতর্কতা</option>
            <option value="EVIDENCE_STATUS_REPORT">৬. প্রমাণপত্র ও যাচাইকরণ স্থিতি</option>
            <option value="EXPIRY_REPORT">৭. আসন্ন মেয়াদোত্তীর্ণ সনদ ও প্রমাণপত্র</option>
            <option value="EXCEPTION_REPORT">৮. অনুমোদিত ব্যতিক্রম ও বিকল্প নিয়ন্ত্রণ</option>
            <option value="REMEDIATION_REPORT">৯. ঘাটতি প্রতিকার ও কর্মপরিকল্পনা (CAPA)</option>
            <option value="POLICY_TO_REQUIREMENT_MAPPING">১০. নীতিমালা (Phase 38) ও শর্তাবলী ম্যাপিং</option>
            <option value="REQUIREMENT_TO_CONTROL_MAPPING">১১. শর্তাবলী ও অভ্যন্তরীণ নিয়ন্ত্রণ (Phase 42) ম্যাপিং</option>
            <option value="CONTRACT_COMPLIANCE_REPORT">১২. সরবরাহকারী চুক্তি (Phase 40) শর্তাবলী</option>
          </select>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5"
          >
            <span>🖨️</span> প্রিন্ট / পিডিএফ ডাউনলোড
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-16 text-center text-slate-400 text-xs">প্রতিবেদন প্রস্তুত হচ্ছে...</div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Printable Report Document Card */}
      {reportData && (
        <div className="bg-slate-900/60 print:bg-white print:text-black border border-slate-800 print:border-none rounded-2xl p-6 md:p-8 space-y-6 shadow-lg">
          {/* Institutional Official Letterhead */}
          <div className="text-center border-b border-slate-800 print:border-black pb-5">
            <div className="text-xs font-mono text-emerald-400 print:text-emerald-800 uppercase tracking-widest">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <h1 className="text-2xl font-bold text-white print:text-black mt-1">
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600">
              ডাকঘর: ইলিয়টগঞ্জ, উপজেলা: দাউদকান্দি, জেলা: কুমিল্লা | স্থাপিত: ১৯৭২ ইং
            </p>
            <h2 className="text-base font-semibold text-emerald-400 print:text-black mt-3">
              {reportData.reportTitleBn}
            </h2>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 print:text-slate-600 mt-1">
              <span>তৈরির তারিখ: {new Date(reportData.generatedAt).toLocaleDateString("bn-BD")}</span>
              <span>•</span>
              <span className="font-mono">রিপোর্ট কোড: {reportData.reportType}</span>
            </div>
          </div>

          {/* Report Executive Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-950 print:bg-slate-100 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-slate-400 print:text-slate-600 block">মোট শর্তাবলী</span>
              <span className="text-lg font-bold text-white print:text-black mt-0.5 block">
                {reportData.summary.totalRequirements} টি
              </span>
            </div>

            <div className="p-3 bg-slate-950 print:bg-slate-100 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-slate-400 print:text-slate-600 block">মোট কমপ্লায়েন্স দায়</span>
              <span className="text-lg font-bold text-emerald-400 print:text-black mt-0.5 block">
                {reportData.summary.totalObligations} টি
              </span>
            </div>

            <div className="p-3 bg-slate-950 print:bg-slate-100 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-slate-400 print:text-slate-600 block">সফলভাবে প্রতিপালিত</span>
              <span className="text-lg font-bold text-teal-400 print:text-black mt-0.5 block">
                {reportData.summary.compliantObligations} টি
              </span>
            </div>

            <div className="p-3 bg-slate-950 print:bg-slate-100 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-slate-400 print:text-slate-600 block">সময়োত্তীর্ণ সতর্কতা</span>
              <span className="text-lg font-bold text-rose-400 print:text-black mt-0.5 block">
                {reportData.summary.overdueObligations} টি
              </span>
            </div>
          </div>

          {/* Structured Data Content */}
          <div className="overflow-x-auto">
            <div className="p-4 bg-slate-950 print:bg-white rounded-xl border border-slate-800 print:border-slate-300">
              <h3 className="font-bold text-white print:text-black text-sm mb-3">প্রতিবেদনের তথ্য বিবরণী:</h3>

              {Array.isArray(reportData.data) && reportData.data.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {reportData.data.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-900/60 print:bg-slate-50 border border-slate-800/80 print:border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 print:text-black">
                          {item.title || item.requirementTitle || item.section || item.problem || `রেকর্ড #${idx + 1}`}
                        </div>
                        <div className="text-[11px] text-slate-400 print:text-slate-600 font-mono mt-0.5">
                          {item.id || item.requirementId || item.obligationId || ""} {item.category ? `[${item.category}]` : ""} {item.jurisdiction ? `(${item.jurisdiction})` : ""}
                        </div>
                      </div>

                      <div className="text-right">
                        {item.status && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 print:bg-slate-200 text-slate-200 print:text-black font-semibold text-[10px]">
                            {item.status}
                          </span>
                        )}
                        {item.percentage !== undefined && (
                          <span className="text-emerald-400 print:text-black font-bold text-base">
                            {item.percentage}%
                          </span>
                        )}
                        {item.dueDate && (
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                            মেয়াদ: {item.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 text-slate-500 text-xs">
                  নির্বাচিত প্রতিবেদনে কোনো অতিরিক্ত রেকর্ড নেই।
                </div>
              )}
            </div>
          </div>

          {/* Institutional Signature Authority Footer */}
          <div className="pt-12 border-t border-slate-800 print:border-black grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="border-b border-dashed border-slate-700 print:border-black pb-2 font-semibold">
                মুহাম্মদ আব্দুল্লাহ
              </div>
              <span className="text-[10px] text-slate-400 print:text-slate-600 mt-1 block">
                কমপ্লায়েন্স ও হিসাব কর্মকর্তা
              </span>
            </div>

            <div>
              <div className="border-b border-dashed border-slate-700 print:border-black pb-2 font-semibold">
                মাওলানা মোহাম্মদ রফিক
              </div>
              <span className="text-[10px] text-slate-400 print:text-slate-600 mt-1 block">
                আহ্বায়ক, অভ্যন্তরীণ নিরীক্ষা কমিটি
              </span>
            </div>

            <div>
              <div className="border-b border-dashed border-slate-700 print:border-black pb-2 font-semibold text-emerald-400 print:text-black">
                মুহতামিম / অধ্যক্ষ সাহেব
              </div>
              <span className="text-[10px] text-slate-400 print:text-slate-600 mt-1 block">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
