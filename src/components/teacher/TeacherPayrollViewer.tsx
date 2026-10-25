"use client";

import React, { useState, useEffect } from "react";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Building,
  CreditCard,
  User,
  ArrowDownCircle,
  ArrowUpCircle,
  X,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

interface PayrollVoucher {
  id: string;
  month: string;
  voucherNo: string;
  baseSalary: number;
  housingAllowance: number;
  medicalAllowance: number;
  responsibilityAllowance: number;
  transportAllowance: number;
  bonus: number;
  otherAllowance: number;
  grossSalary: number;
  providentFund: number;
  taxDeduction: number;
  advanceDeduction: number;
  unpaidLeaveDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  paymentMethod: string;
  paymentDate: string | null;
  paymentReference: string;
  createdAt: string;
}

interface TeacherInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  designationBn: string;
  departmentBn: string;
  employeeId: string;
}

export default function TeacherPayrollViewer() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [records, setRecords] = useState<PayrollVoucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<PayrollVoucher | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/teacher/payroll");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "বেতন ও পে-রোল তথ্য লোড করতে ব্যর্থ হয়েছে।");
      }
      setTeacherInfo(data.teacherInfo);
      setMetrics(data.metrics);
      setRecords(data.records || []);
    } catch (err: any) {
      setError(err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const filteredRecords = records.filter((r) => {
    if (filterStatus === "ALL") return true;
    return r.status === filterStatus;
  });

  const formatMonthBn = (mStr: string) => {
    const [year, m] = mStr.split("-");
    const monthsBn = [
      "জানুয়ারি",
      "ফেব্রুয়ারি",
      "মার্চ",
      "এপ্রিল",
      "মে",
      "জুন",
      "জুলাই",
      "আগস্ট",
      "সেপ্টেম্বর",
      "অক্টোবর",
      "নভেম্বর",
      "ডিসেম্বর",
    ];
    const mIdx = parseInt(m, 10) - 1;
    return `${monthsBn[mIdx] || m} ${year}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Bar */}
      <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                অফিশিয়াল পে-রোল ও ভাতা
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                আইডি: {teacherInfo?.employeeId || "TCH-EHRJ"}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 font-display mt-1.5 flex items-center gap-2">
              <Banknote className="w-6 h-6 text-[#0D5C3A]" />
              আমার বেতন-ভাতা বিবরণী ও পে-স্লিপ (My Salary & Payslips)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              মাদরাসা হিসাব বিভাগ কর্তৃক প্রস্তুতকৃত ও অনুমোদিত আপনার মাসিক বেতন এবং প্রদেয় ভাউচার তালিকা।
            </p>
          </div>
          <button
            onClick={fetchPayrollData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 text-xs font-bold transition self-start sm:self-center"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="card-3d bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#0D5C3A]" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              চলতি মাসের প্রদেয় বেতন
            </span>
            <span className="text-2xl font-black text-[#0D5C3A] block mt-1.5 font-mono">
              ৳ {metrics?.currentMonthNetSalary ? Number(metrics.currentMonthNetSalary).toLocaleString("bn-BD") : "০"}
            </span>
            <span className="text-[11px] text-emerald-800 font-semibold block mt-1">
              মাস: {metrics?.currentMonth ? formatMonthBn(metrics.currentMonth) : "চলতি মাস"}
            </span>
          </div>

          <div className="card-3d bg-white p-5 rounded-2xl border-2 border-amber-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              বেতন পরিশোধ স্ট্যাটাস
            </span>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black border ${
                  metrics?.currentMonthStatus === "PAID"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : metrics?.currentMonthStatus === "APPROVED"
                    ? "bg-blue-50 text-blue-800 border-blue-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
              >
                {metrics?.currentMonthStatus === "PAID"
                  ? "✓ পরিশোধিত (PAID)"
                  : metrics?.currentMonthStatus === "APPROVED"
                  ? "অনুমোদিত (APPROVED)"
                  : "প্রক্রিয়াধীন"}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1.5">
              হিসাবরক্ষণ শাখা যাচাইকৃত
            </span>
          </div>

          <div className="card-3d bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              চলতি বছরে গৃহীত মোট বেতন (YTD)
            </span>
            <span className="text-2xl font-black text-blue-900 block mt-1.5 font-mono">
              ৳ {metrics?.ytdTotalEarnings ? Number(metrics.ytdTotalEarnings).toLocaleString("bn-BD") : "০"}
            </span>
            <span className="text-[11px] text-blue-700 font-semibold block mt-1">
              বছরে সফলভাবে পরিশোধিত
            </span>
          </div>

          <div className="card-3d bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              মোট প্রভিডেন্ট ফান্ড ও কর্তন
            </span>
            <span className="text-2xl font-black text-rose-700 block mt-1.5 font-mono">
              ৳ {metrics?.ytdTotalDeductions ? Number(metrics.ytdTotalDeductions).toLocaleString("bn-BD") : "০"}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              সঞ্চয় ও আনুতোষিক তহবিল
            </span>
          </div>
        </div>
      </div>

      {/* 2. Monthly Records Table Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0D5C3A]" />
              মাসিক বেতন ভাউচার ও পে-স্লিপ তালিকা
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              যেকোনো মাসের নামের পাশে থাকা প্রিন্ট আইকনে ক্লিক করে অফিশিয়াল পে-স্লিপ সংগ্রহ করুন।
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            {["ALL", "PAID", "APPROVED", "DRAFT"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterStatus === st
                    ? "bg-[#0D5C3A] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st === "ALL" ? "সকল ভাউচার" : st}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            বেতন বিবরণী লোড হচ্ছে...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-2">
            <Banknote className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">কোনো বেতন ভাউচার পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              নির্বাচিত ফিল্টারের আওতাধীন কোনো পে-রোল রেকর্ড এখনও অ্যাকাউন্টে এন্ট্রি করা হয়নি।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">মাস ও ভাউচার</th>
                  <th className="p-3.5 text-right">মূল বেতন</th>
                  <th className="p-3.5 text-right">মোট ভাতা</th>
                  <th className="p-3.5 text-right">মোট কর্তন</th>
                  <th className="p-3.5 text-right">প্রদেয় নেট বেতন</th>
                  <th className="p-3.5 text-center">পরিশোধের মাধ্যম</th>
                  <th className="p-3.5 text-center">স্ট্যাটাস</th>
                  <th className="p-3.5 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => {
                  const allowances = (r.housingAllowance || 0) + (r.medicalAllowance || 0) + (r.responsibilityAllowance || 0) + (r.transportAllowance || 0) + (r.bonus || 0) + (r.otherAllowance || 0);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">
                          {formatMonthBn(r.month)}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 block">
                          {r.voucherNo}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-slate-700">
                        ৳ {Number(r.baseSalary).toLocaleString("bn-BD")}
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-700 font-semibold">
                        +৳ {Number(allowances).toLocaleString("bn-BD")}
                      </td>
                      <td className="p-3.5 text-right font-mono text-rose-600 font-semibold">
                        -৳ {Number(r.totalDeductions).toLocaleString("bn-BD")}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-sm text-[#0D5C3A]">
                        ৳ {Number(r.netSalary).toLocaleString("bn-BD")}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {r.paymentMethod === "BANK_TRANSFER"
                            ? "ব্যাংক ট্রান্সফার"
                            : r.paymentMethod === "BKASH"
                            ? "বিকাশ"
                            : "নগদ (Cash)"}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            r.status === "PAID"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : r.status === "APPROVED"
                              ? "bg-blue-50 text-blue-800 border-blue-300"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                        >
                          {r.status === "PAID"
                            ? "পরিশোধিত"
                            : r.status === "APPROVED"
                            ? "অনুমোদিত"
                            : "ড্রাফট"}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedVoucher(r)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] hover:text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 mx-auto transition shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>পে-স্লিপ প্রিন্ট</span>
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

      {/* 3. Official Teacher Payslip Print Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-300 space-y-6 animate-scaleUp my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <FileText className="w-4 h-4 text-[#0D5C3A]" />
                মাসিক শিক্ষক ও স্টাফ পে-স্লিপ (Official Staff Payslip)
              </span>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Payslip Card Body */}
            <div className="border-2 border-emerald-900/40 rounded-2xl p-6 sm:p-7 space-y-5 bg-gradient-to-b from-emerald-50/20 to-white text-slate-800">
              {/* Institutional Header */}
              <div className="text-center pb-4 border-b-2 border-emerald-900/30 space-y-1">
                <div className="text-xs font-arabic text-emerald-900 font-bold">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
                <h1 className="text-lg sm:text-xl font-black text-emerald-950 font-display">
                  {INSTITUTION_INFO.nameBn}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  {INSTITUTION_INFO.addressBn} • ফোন: {INSTITUTION_INFO.primaryPhone}
                </p>
                <div className="pt-1 flex items-center justify-center gap-3 text-[10px] font-bold">
                  <span className="bg-emerald-950 text-amber-300 px-3 py-0.5 rounded-full border border-amber-400/40">
                    স্থাপিত: ২০২১ ইং (ESTD 2021)
                  </span>
                  <span className="bg-emerald-100 text-emerald-950 px-3 py-0.5 rounded-full border border-emerald-300">
                    অফিশিয়াল শিক্ষক বেতন বিল ও পে-স্লিপ
                  </span>
                </div>
              </div>

              {/* Payslip Meta & Teacher Info */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">শিক্ষকের নাম:</span>
                  <strong className="text-slate-900 text-sm">
                    {teacherInfo?.name || "মাওলানা আহমাদ উল্লাহ"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">পদবি ও অনুষদ:</span>
                  <strong className="text-slate-900">
                    {teacherInfo?.designationBn || "সিনিয়র উস্তাদ ও বিভাগীয় শিক্ষক"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">বেতনের মাস:</span>
                  <strong className="text-emerald-900 font-bold">
                    {formatMonthBn(selectedVoucher.month)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">ভাউচার নম্বর:</span>
                  <strong className="font-mono text-slate-800">
                    {selectedVoucher.voucherNo}
                  </strong>
                </div>
              </div>

              {/* Itemized Earnings & Deductions Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Earnings */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50 px-3 py-2 border-b border-slate-200 font-bold text-emerald-950">
                    উপার্জন ও ভাতাসমূহ (Earnings)
                  </div>
                  <div className="p-3 space-y-1.5 divide-y divide-slate-100">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">মূল বেতন (Basic)</span>
                      <strong className="font-mono">৳ {Number(selectedVoucher.baseSalary).toLocaleString("bn-BD")}</strong>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">বাড়িভাড়া ভাতা</span>
                      <strong className="font-mono">৳ {Number(selectedVoucher.housingAllowance).toLocaleString("bn-BD")}</strong>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">চিকিৎসা ভাতা</span>
                      <strong className="font-mono">৳ {Number(selectedVoucher.medicalAllowance).toLocaleString("bn-BD")}</strong>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">দায়িত্ব ও পরিবহন ভাতা</span>
                      <strong className="font-mono">
                        ৳ {Number((selectedVoucher.responsibilityAllowance || 0) + (selectedVoucher.transportAllowance || 0)).toLocaleString("bn-BD")}
                      </strong>
                    </div>
                    <div className="flex justify-between pt-1 font-bold text-emerald-950 border-t border-slate-200">
                      <span>মোট উপার্জন (Gross)</span>
                      <span className="font-mono">৳ {Number(selectedVoucher.grossSalary).toLocaleString("bn-BD")}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-rose-50 px-3 py-2 border-b border-slate-200 font-bold text-rose-950">
                    কর্তনসমূহ (Deductions)
                  </div>
                  <div className="p-3 space-y-1.5 divide-y divide-slate-100">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">প্রভিডেন্ট ফান্ড (PF)</span>
                      <strong className="font-mono text-rose-700">৳ {Number(selectedVoucher.providentFund).toLocaleString("bn-BD")}</strong>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">অগ্রিম কর্তন (Advance)</span>
                      <strong className="font-mono text-rose-700">৳ {Number(selectedVoucher.advanceDeduction).toLocaleString("bn-BD")}</strong>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">অনুপস্থিতি / অন্যান্য কর্তন</span>
                      <strong className="font-mono text-rose-700">
                        ৳ {Number((selectedVoucher.unpaidLeaveDeduction || 0) + (selectedVoucher.otherDeductions || 0)).toLocaleString("bn-BD")}
                      </strong>
                    </div>
                    <div className="flex justify-between pt-1 font-bold text-rose-950 border-t border-slate-200">
                      <span>মোট কর্তন</span>
                      <span className="font-mono">৳ {Number(selectedVoucher.totalDeductions).toLocaleString("bn-BD")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight Banner */}
              <div className="bg-emerald-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-200 block uppercase font-bold tracking-wider">
                    পরিশোধযোগ্য সর্বমোট প্রদেয় বেতন (Net Payable)
                  </span>
                  <span className="text-xs text-amber-300 font-semibold block mt-0.5">
                    পরিশোধের মাধ্যম: {selectedVoucher.paymentMethod} {selectedVoucher.paymentReference ? `(${selectedVoucher.paymentReference})` : ""}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-amber-300">
                    ৳ {Number(selectedVoucher.netSalary).toLocaleString("bn-BD")}
                  </span>
                </div>
              </div>

              {/* 3 Signature Blocks */}
              <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs text-slate-700">
                <div>
                  <div className="w-24 border-b border-slate-400 mx-auto mb-1" />
                  <span className="font-bold">হিসাবরক্ষক</span>
                </div>
                <div>
                  <div className="w-24 border-b border-slate-400 mx-auto mb-1" />
                  <span className="font-bold">মুহতামিম / অধ্যক্ষ</span>
                </div>
                <div>
                  <div className="w-24 border-b border-slate-400 mx-auto mb-1" />
                  <span className="font-bold">বেতন গ্রহণকারীর স্বাক্ষর</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 no-print">
              <button
                type="button"
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-[#0D5C3A] hover:bg-[#158052] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                <span>পে-স্লিপ প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
