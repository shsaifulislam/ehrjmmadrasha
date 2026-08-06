"use client";

import { useState } from "react";
import {
  FileText,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Scale,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Building,
  RefreshCw
} from "lucide-react";
import { useTrialBalance, useIncomeStatement, useBalanceSheet } from "@/hooks/useAccountingReports";
import { AppButton } from "@/components/shared/AppButton";
import { AppBadge } from "@/components/shared/AppBadge";

export default function AccountingReportsPage() {
  const [activeTab, setActiveTab] = useState<"trial-balance" | "income-statement" | "balance-sheet">("trial-balance");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const params = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const { data: trialData, isLoading: loadingTrial, refetch: refetchTrial } = useTrialBalance(params);
  const { data: incomeData, isLoading: loadingIncome, refetch: refetchIncome } = useIncomeStatement(params);
  const { data: balanceData, isLoading: loadingBalance, refetch: refetchBalance } = useBalanceSheet({ asOfDate: endDate || undefined });

  const trialRows = trialData?.rows || [];
  const incomeStmt = incomeData || { incomeAccounts: [], expenseAccounts: [], totalIncome: 0, totalExpense: 0, netProfit: 0 };
  const balanceSheet = balanceData || { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0, isBalanced: true };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              আর্থিক হিসাব বিবরণী ও রিপোর্টস হাব (Financial Reporting Engine)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            রেওয়ামিল (Trial Balance), আয়-ব্যয় বিবরণী (Income Statement) এবং উদ্বৃত্তপত্র (Balance Sheet) - SRS Vol 07
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AppButton variant="outline" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
            রিপোর্ট প্রিন্ট করুন
          </AppButton>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">সময়সীমা সিলেক্ট করুন:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <span className="text-xs text-slate-400">থেকে</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
        </div>
        <AppButton
          variant="ghost"
          size="sm"
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          onClick={() => {
            refetchTrial();
            refetchIncome();
            refetchBalance();
          }}
        >
          রিফ্রেশ
        </AppButton>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab("trial-balance")}
          className={`pb-3 px-4 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "trial-balance"
              ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Scale className="h-4 w-4" />
          রেওয়ামিল (Trial Balance)
        </button>
        <button
          onClick={() => setActiveTab("income-statement")}
          className={`pb-3 px-4 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "income-statement"
              ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          আয়-ব্যয় বিবরণী (Income Statement)
        </button>
        <button
          onClick={() => setActiveTab("balance-sheet")}
          className={`pb-3 px-4 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "balance-sheet"
              ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <PieChart className="h-4 w-4" />
          উদ্বৃত্তপত্র (Balance Sheet)
        </button>
      </div>

      {/* Tab 1: Trial Balance */}
      {activeTab === "trial-balance" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-600" />
              রেওয়ামিল বিবরণী (Trial Balance as of Live Ledger)
            </h3>
            <AppBadge variant={trialData?.isBalanced ? "success" : "danger"}>
              {trialData?.isBalanced ? "ডেবিট = ক্রেডিট সঠিক (Balanced ✅)" : "অসামঞ্জস্য (Unbalanced)"}
            </AppBadge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3">কোড</th>
                  <th className="p-3">অ্যাকাউন্টের নাম</th>
                  <th className="p-3">ধরন</th>
                  <th className="p-3 text-right">ডেবিট (৳)</th>
                  <th className="p-3 text-right">ক্রেডিট (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trialRows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-emerald-600">{r.code}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{r.name}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500">{r.type}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {r.debit > 0 ? `৳ ${r.debit}` : "-"}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {r.credit > 0 ? `৳ ${r.credit}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2">
                <tr>
                  <td colSpan={3} className="p-3 text-right">সর্বমোট:</td>
                  <td className="p-3 text-right font-mono text-emerald-600 text-sm">৳ {trialData?.totalDebit || 0}</td>
                  <td className="p-3 text-right font-mono text-emerald-600 text-sm">৳ {trialData?.totalCredit || 0}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Income Statement */}
      {activeTab === "income-statement" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              আয়-ব্যয় বিবরণী (Profit & Loss / Income Statement)
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">
              নিট মুনাফা/খাটতি: <strong className="text-emerald-600 text-sm">৳ {incomeStmt.netProfit}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue / Income */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-xs text-emerald-600 uppercase tracking-wider border-b pb-2">আয়ের খাতসমূহ (Revenues)</h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {incomeStmt.incomeAccounts.map((inc: any) => (
                  <div key={inc.id} className="py-2 flex justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{inc.name} ({inc.code})</span>
                    <strong className="font-mono text-emerald-600">৳ {inc.amount}</strong>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t flex justify-between font-bold text-xs">
                <span>মোট আয়:</span>
                <span className="font-mono text-emerald-600 text-sm">৳ {incomeStmt.totalIncome}</span>
              </div>
            </div>

            {/* Expenses */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-xs text-rose-600 uppercase tracking-wider border-b pb-2">ব্যয়ের খাতসমূহ (Expenses)</h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {incomeStmt.expenseAccounts.map((exp: any) => (
                  <div key={exp.id} className="py-2 flex justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{exp.name} ({exp.code})</span>
                    <strong className="font-mono text-rose-600">৳ {exp.amount}</strong>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t flex justify-between font-bold text-xs">
                <span>মোট ব্যয়:</span>
                <span className="font-mono text-rose-600 text-sm">৳ {incomeStmt.totalExpense}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Balance Sheet */}
      {activeTab === "balance-sheet" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-emerald-600" />
              উদ্বৃত্তপত্র (Balance Sheet: Assets = Liabilities + Equity)
            </h3>
            <AppBadge variant={balanceSheet.isBalanced ? "success" : "danger"}>
              {balanceSheet.isBalanced ? "Assets = Liabilities + Equity (Balanced ✅)" : "অসামঞ্জস্য (Unbalanced)"}
            </AppBadge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Assets */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-xs text-blue-600 uppercase tracking-wider border-b pb-2">সম্পদসমূহ (Assets)</h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {balanceSheet.assets.map((ast: any) => (
                  <div key={ast.id} className="py-2 flex justify-between">
                    <span>{ast.name} ({ast.code})</span>
                    <strong className="font-mono text-blue-600">৳ {ast.balance}</strong>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t flex justify-between font-bold text-sm">
                <span>মোট সম্পদ (Total Assets):</span>
                <span className="font-mono text-blue-600">৳ {balanceSheet.totalAssets}</span>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-xs text-purple-600 uppercase tracking-wider border-b pb-2">দায় ও ইক্যুইটি (Liabilities & Equity)</h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {balanceSheet.liabilities.map((lia: any) => (
                  <div key={lia.id} className="py-2 flex justify-between">
                    <span>{lia.name} ({lia.code})</span>
                    <strong className="font-mono text-purple-600">৳ {lia.balance}</strong>
                  </div>
                ))}
                <div className="py-2 flex justify-between font-bold text-emerald-600">
                  <span>সংরক্ষিত আয় (Retained Earnings):</span>
                  <span className="font-mono">৳ {balanceSheet.retainedEarnings}</span>
                </div>
              </div>
              <div className="pt-3 border-t flex justify-between font-bold text-sm">
                <span>মোট দায় ও ইক্যুইটি:</span>
                <span className="font-mono text-purple-600">৳ {balanceSheet.totalEquity}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
