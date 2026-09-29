"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Eye,
  FileText,
  Building,
  ShieldAlert,
  Search,
  Filter,
  DollarSign,
  Layers,
  ArrowRight,
  GitCommit,
  CheckCircle,
  X,
  Lock,
  ChevronRight,
  Sparkles,
  Calendar,
} from "lucide-react";
import {
  Budget,
  BudgetLine,
  BudgetPeriod,
  BudgetRevision,
  BudgetProject,
  BudgetControlAlert,
  BudgetDashboardStats,
  BudgetFundCode,
  BudgetLifecycleStatus,
} from "@/lib/budget/types";

interface Props {
  initialTab?: "OVERVIEW" | "LINES" | "VERSIONS" | "REVISIONS" | "PROJECTS" | "VARIANCE" | "PERIODS";
  initialBudgetId?: string;
}

export default function InstitutionalBudgetConsole({
  initialTab = "OVERVIEW",
  initialBudgetId,
}: Props) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Core Data
  const [stats, setStats] = useState<BudgetDashboardStats | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [periods, setPeriods] = useState<BudgetPeriod[]>([]);
  const [revisions, setRevisions] = useState<BudgetRevision[]>([]);
  const [projects, setProjects] = useState<BudgetProject[]>([]);
  const [alerts, setAlerts] = useState<BudgetControlAlert[]>([]);
  const [varianceReport, setVarianceReport] = useState<any[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [fundFilter, setFundFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLineModal, setShowLineModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  // Forms
  const [newBudgetForm, setNewBudgetForm] = useState({
    titleBn: "",
    titleEn: "",
    periodId: "",
    fiscalYear: "2026-2027",
    startDate: "2026-07-01",
    endDate: "2027-06-30",
    notes: "",
  });

  const [newPeriodForm, setNewPeriodForm] = useState({
    titleBn: "",
    titleEn: "",
    periodType: "FINANCIAL_YEAR" as "ANNUAL" | "ACADEMIC_SESSION" | "FINANCIAL_YEAR" | "CUSTOM",
    startDate: "2026-07-01",
    endDate: "2027-06-30",
    notes: "",
  });

  const [newLineForm, setNewLineForm] = useState({
    fundCode: "GENERAL" as BudgetFundCode,
    categoryType: "EXPENSE" as "INCOME" | "EXPENSE",
    categoryCode: "UTILITIES",
    categoryNameBn: "",
    departmentNameBn: "প্রশাসনিক দপ্তর",
    plannedAmount: 100000,
    notes: "",
  });

  const [newRevisionForm, setNewRevisionForm] = useState({
    titleBn: "",
    reasonBn: "",
    budgetLineId: "",
    newAmount: 0,
    justificationBn: "",
  });

  const [newProjectForm, setNewProjectForm] = useState({
    nameBn: "",
    fundCode: "CONSTRUCTION" as BudgetFundCode,
    approvedBudget: 500000,
    startDate: "2026-10-01",
    endDate: "2027-02-28",
    projectManagerName: "",
    contractorVendorName: "",
    descriptionBn: "",
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/budgets/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPeriodForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast("নতুন আর্থিক মেয়াদ সফলভাবে সংরক্ষিত হয়েছে।");
        setShowPeriodModal(false);
        setNewPeriodForm({
          titleBn: "",
          titleEn: "",
          periodType: "FINANCIAL_YEAR",
          startDate: "2026-07-01",
          endDate: "2027-06-30",
          notes: "",
        });
        await loadData();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, budsRes, perRes, revsRes, prjRes, altRes] = await Promise.all([
        fetch("/api/admin/budgets/stats"),
        fetch("/api/admin/budgets"),
        fetch("/api/admin/budgets/periods"),
        fetch("/api/admin/budgets/revisions"),
        fetch("/api/admin/budgets/projects"),
        fetch("/api/admin/budgets/alerts"),
      ]);

      const [statsData, budsData, perData, revsData, prjData, altData] = await Promise.all([
        statsRes.json(),
        budsRes.json(),
        perRes.json(),
        revsRes.json(),
        prjRes.json(),
        altRes.json(),
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (budsData.success) {
        setBudgets(budsData.budgets || []);
        if (budsData.budgets && budsData.budgets.length > 0) {
          const current = initialBudgetId
            ? budsData.budgets.find((b: Budget) => b.id === initialBudgetId) || budsData.budgets[0]
            : budsData.budgets[0];
          setSelectedBudget(current);
          loadVariance(current.id);
        }
      }
      if (perData.success) {
        setPeriods(perData.periods || []);
        if (perData.periods.length > 0 && !newBudgetForm.periodId) {
          setNewBudgetForm((prev) => ({ ...prev, periodId: perData.periods[0].id }));
        }
      }
      if (revsData.success) setRevisions(revsData.revisions || []);
      if (prjData.success) setProjects(prjData.projects || []);
      if (altData.success) setAlerts(altData.alerts || []);
    } catch (err) {
      console.error("Failed to load budget data", err);
    } finally {
      setLoading(false);
    }
  };

  const loadVariance = async (budgetId: string) => {
    try {
      const res = await fetch(`/api/admin/budgets/variance?budgetId=${budgetId}`);
      const data = await res.json();
      if (data.success) {
        setVarianceReport(data.varianceReport || []);
      }
    } catch (err) {
      console.error("Failed to load variance report", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedPeriod = periods.find((p) => p.id === newBudgetForm.periodId);
      const res = await fetch("/api/admin/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newBudgetForm,
          periodNameBn: selectedPeriod?.titleBn || newBudgetForm.periodId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("নতুন বাজেট খসড়া সফলভাবে সংরক্ষিত হয়েছে।");
        setShowCreateModal(false);
        await loadData();
      } else {
        alert(data.error || "বাজেট তৈরি ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    }
  };

  const handleStatusTransition = async (budgetId: string, targetStatus: BudgetLifecycleStatus) => {
    try {
      const res = await fetch(`/api/admin/budgets/${budgetId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus, reason: "অ্যাডমিন কমান্ড থেকে স্ট্যাটাস পরিবর্তন" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        await loadData();
      } else {
        alert(data.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudget) return;

    try {
      const res = await fetch("/api/admin/budgets/lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetId: selectedBudget.id,
          lineData: {
            ...newLineForm,
            fundNameBn:
              newLineForm.fundCode === "GENERAL"
                ? "সাধারণ ফান্ড"
                : newLineForm.fundCode === "LILLAH"
                ? "লিল্লাহ বোর্ডিং ফান্ড"
                : newLineForm.fundCode === "ZAKAT"
                ? "যাকাত ফান্ড"
                : newLineForm.fundCode === "CONSTRUCTION"
                ? "নির্মাণ ও উন্নয়ন ফান্ড"
                : "এতিম স্পনসরশিপ ফান্ড",
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("বাজেট লাইন সফলভাবে যুক্ত হয়েছে।");
        setShowLineModal(false);
        await loadData();
      } else {
        alert(data.error || "বাজেট লাইন সংরক্ষণ ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudget) return;

    const line = selectedBudget.lines.find((l) => l.id === newRevisionForm.budgetLineId);
    if (!line) return;

    const diff = newRevisionForm.newAmount - line.revisedAmount;

    try {
      const res = await fetch("/api/admin/budgets/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetId: selectedBudget.id,
          requestData: {
            titleBn: newRevisionForm.titleBn,
            reasonBn: newRevisionForm.reasonBn,
            lineDiffs: [
              {
                budgetLineId: line.id,
                categoryNameBn: line.categoryNameBn,
                fundCode: line.fundCode,
                previousAmount: line.revisedAmount,
                newRequestedAmount: newRevisionForm.newAmount,
                amountDifference: diff,
                justificationBn: newRevisionForm.justificationBn || newRevisionForm.reasonBn,
              },
            ],
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("বাজেট রিভিশন প্রস্তাব সফলভাবে সাবমিট হয়েছে।");
        setShowRevisionModal(false);
        await loadData();
      } else {
        alert(data.error || "রিভিশন সাবমিট ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApproveRevision = async (revisionId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই বাজেট রিভিশন অনুমোদন করতে চান? এটি একটি নতুন সংস্করণ তৈরি করবে।")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/budgets/revisions/${revisionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        await loadData();
      } else {
        alert(data.error || "রিভিশন অনুমোদন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const res = await fetch("/api/admin/budgets/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("সতর্কবার্তা গৃহীত হিসেবে চিহ্নিত হয়েছে।");
        await loadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTriggerAlertScan = async () => {
    if (!selectedBudget) return;
    try {
      const res = await fetch("/api/admin/budgets/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgetId: selectedBudget.id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        await loadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-800 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-600 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
          <span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium">
              <Wallet className="w-3.5 h-3.5" />
              <span>Phase 41 — প্রাতিষ্ঠানিক বাজেট পরিকল্পনা ও আর্থিক নিয়ন্ত্রণ ইঞ্জিন</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ইনস্টিটিউশনাল বাজেট প্ল্যানিং ও কন্ট্রোল হাব
            </h1>
            <p className="text-emerald-100/80 text-sm max-w-2xl leading-relaxed">
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার তহবিলভিত্তিক বার্ষিক আয়-ব্যয় পরিকল্পনা,
              কমিটমেন্ট ট্র্যাকিং, থ্রেশহোল্ড মনিটরিং এবং অনুমোদিত বাজেট সংশোধন ব্যবস্থাপনা।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন বাজেট তৈরি</span>
            </button>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl border border-white/10 backdrop-blur-sm transition"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">পরিকল্পিত আয়</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            ৳{stats ? (stats.totalPlannedIncome / 100000).toFixed(1) + "L" : "০"}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            আদায়: {stats?.incomeCollectionRate ?? 0}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">প্রকৃত আয় (আদায়)</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
            ৳{stats ? (stats.totalActualIncome / 100000).toFixed(1) + "L" : "০"}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">Phase 6 খতিয়ান</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">পরিকল্পিত ব্যয়</div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            ৳{stats ? (stats.totalPlannedExpense / 100000).toFixed(1) + "L" : "০"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">অনুমোদিত সীমা</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">প্রকৃত ব্যয় (পরিশোধিত)</div>
          <div className="text-xl sm:text-2xl font-bold text-teal-700 mt-1">
            ৳{stats ? (stats.totalActualExpense / 100000).toFixed(1) + "L" : "০"}
          </div>
          <div className="text-[11px] text-teal-600 mt-0.5 font-medium">ক্যাশ ট্রানজ্যাকশন</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">কমিটেড ব্যয় (PO/চুক্তি)</div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-700 mt-1">
            ৳{stats ? (stats.totalCommittedExpense / 100000).toFixed(1) + "L" : "০"}
          </div>
          <div className="text-[11px] text-indigo-600 mt-0.5 font-medium">Phase 12 ক্রয়াদেশ</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">অবশিষ্ট বরাদ্দ</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
            ৳{stats ? (stats.totalAvailableBudget / 100000).toFixed(1) + "L" : "০"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
            ব্যয় হার: {stats?.overallExpenseUtilizationRate ?? 0}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
          <div className="text-slate-500 text-xs font-medium">সতর্কবার্তা ও ওভাররান</div>
          <div className="text-xl sm:text-2xl font-bold text-rose-700 mt-1">
            {(stats?.overrunAlertsCount ?? 0) + (stats?.warningAlertsCount ?? 0)}
          </div>
          <div className="text-[11px] text-rose-600 mt-0.5 font-medium">
            অতিরিক্ত ব্যয়: {stats?.overrunAlertsCount ?? 0}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-sm font-medium">
        <button
          onClick={() => setActiveTab("OVERVIEW")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "OVERVIEW"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>বাজেট তালিকা ({budgets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("LINES")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "LINES"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>বাজেট লাইন ও খাতসমূহ ({selectedBudget?.lines.length ?? 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("VERSIONS")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "VERSIONS"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>অনুমোদিত সংস্করণ ইতিহাস ({selectedBudget?.versions.length ?? 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("REVISIONS")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "REVISIONS"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>রিভিশন প্রস্তাব ({revisions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("PROJECTS")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "PROJECTS"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>উন্নয়ন প্রকল্প বাজেট ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("VARIANCE")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "VARIANCE"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>বিচ্যুতি বিশ্লেষণ (Variance)</span>
        </button>

        <button
          onClick={() => setActiveTab("PERIODS")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === "PERIODS"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>আর্থিক মেয়াদ ও সেশন ({periods.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & BUDGET LIST */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b) => {
              const isSelected = selectedBudget?.id === b.id;
              const statusColors: Record<string, string> = {
                DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
                PREPARATION: "bg-blue-50 text-blue-700 border-blue-200",
                UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
                APPROVED: "bg-teal-50 text-teal-700 border-teal-200",
                ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
                REVISED: "bg-indigo-50 text-indigo-700 border-indigo-200",
                CLOSED: "bg-slate-200 text-slate-800 border-slate-300",
              };

              return (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBudget(b);
                    loadVariance(b.id);
                  }}
                  className={`bg-white rounded-2xl border p-5 cursor-pointer transition flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? "border-emerald-600 ring-2 ring-emerald-500/20 shadow-md"
                      : "border-slate-200 hover:shadow-md"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-400">{b.budgetCode}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          সংস্করণ v{b.currentVersion}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusColors[b.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug">{b.titleBn}</h3>
                    <p className="text-xs text-slate-500">
                      মেয়াদ: {b.startDate} হতে {b.endDate} ({b.fiscalYear})
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <div className="text-slate-400 text-[10px]">পরিকল্পিত ব্যয়</div>
                        <div className="font-bold text-slate-800">৳{b.totalExpensePlanned.toLocaleString("bn-BD")}</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <div className="text-slate-400 text-[10px]">প্রকৃত + কমিটেড</div>
                        <div className="font-bold text-teal-700">
                          ৳{(b.totalExpenseActual + b.totalExpenseCommitted).toLocaleString("bn-BD")}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">বাজেট ব্যবহার হার:</span>
                        <span className="font-bold text-slate-800">{b.overallUtilizationRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            b.overallUtilizationRate >= 90
                              ? "bg-rose-500"
                              : b.overallUtilizationRate >= 80
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, b.overallUtilizationRate)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isSelected ? "বর্তমানে নির্বাচিত" : "নির্বাচন করুন"}</span>
                    </span>

                    {/* Lifecycle action buttons */}
                    <div className="flex items-center gap-1">
                      {b.status === "DRAFT" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusTransition(b.id, "PREPARATION");
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded"
                        >
                          প্রস্তুতি শুরু
                        </button>
                      )}
                      {b.status === "PREPARATION" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusTransition(b.id, "UNDER_REVIEW");
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded"
                        >
                          রিভিউ পাঠান
                        </button>
                      )}
                      {b.status === "UNDER_REVIEW" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusTransition(b.id, "APPROVED");
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-teal-600 text-white rounded shadow-sm"
                        >
                          অনুমোদন (v1)
                        </button>
                      )}
                      {b.status === "APPROVED" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusTransition(b.id, "ACTIVE");
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded shadow-sm"
                        >
                          সক্রিয় করুন
                        </button>
                      )}
                      {b.status === "ACTIVE" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusTransition(b.id, "CLOSED");
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-700 text-white rounded shadow-sm"
                        >
                          অর্থবছর সমাপ্ত
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BUDGET LINES */}
      {activeTab === "LINES" && selectedBudget && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                {selectedBudget.titleBn} — বাজেট খাতভিত্তিক বরাদ্দ
              </h2>
              <p className="text-xs text-slate-500">
                Phase 6 প্রকৃত খরচ ও Phase 12 অনুমোদিত পারচেজ অর্ডারের সাথে স্বয়ংক্রিয়ভাবে সমন্বিত
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLineModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন খাত যুক্ত করুন</span>
              </button>
              <button
                onClick={handleTriggerAlertScan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>থ্রেশহোল্ড স্ক্যান</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">খাতের নাম ও কোড</th>
                  <th className="py-3 px-4">তহবিল / ফান্ড</th>
                  <th className="py-3 px-4">ধরন</th>
                  <th className="py-3 px-4 text-right">পরিকল্পিত / সংশোধিত</th>
                  <th className="py-3 px-4 text-right">প্রকৃত ব্যয়</th>
                  <th className="py-3 px-4 text-right">কমিটেড (PO)</th>
                  <th className="py-3 px-4 text-right">অবশিষ্ট</th>
                  <th className="py-3 px-4 text-center">ব্যবহার %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {selectedBudget.lines.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{line.categoryNameBn}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {line.id} • {line.departmentNameBn}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-200">
                        {line.fundNameBn}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          line.categoryType === "INCOME"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {line.categoryType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      ৳{line.revisedAmount.toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3 px-4 text-right text-teal-700 font-semibold">
                      ৳{line.actualAmount.toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-700 font-semibold">
                      ৳{line.committedAmount.toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      ৳{line.remainingAmount.toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          line.utilizationRate >= 90
                            ? "bg-rose-100 text-rose-800"
                            : line.utilizationRate >= 80
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {line.utilizationRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VERSIONS */}
      {activeTab === "VERSIONS" && selectedBudget && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h2 className="font-bold text-slate-900 text-base">অনুমোদিত সংস্করণ হিস্ট্রি ও স্ন্যাপশট</h2>
            <p className="text-xs text-slate-500">
              প্রতিটি অনুমোদিত বাজেট সংস্করণ অপরিবর্তনীয় স্ন্যাপশট হিসেবে সংরক্ষিত থাকে
            </p>
          </div>

          <div className="space-y-4">
            {selectedBudget.versions.map((v) => (
              <div key={v.versionNumber} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                      v{v.versionNumber}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{v.revisionReason || "বাজেট সংস্করণ"}</h3>
                      <div className="text-[11px] text-slate-400">
                        কার্যকর তারিখ: {v.effectiveDate} | অনুমোদন রেফারেন্স: {v.approvalReference}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-semibold text-slate-700">অনুমোদনকারী: {v.approvedBy}</div>
                    <div className="text-slate-400 text-[10px]">{new Date(v.createdAt).toLocaleDateString("bn-BD")}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px]">পরিকল্পিত আয়</span>
                    <div className="font-bold text-slate-800">৳{v.totalPlannedIncome.toLocaleString("bn-BD")}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">পরিকল্পিত ব্যয়</span>
                    <div className="font-bold text-slate-800">৳{v.totalPlannedExpense.toLocaleString("bn-BD")}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">প্রাক্কলিত উদ্বৃত্ত</span>
                    <div className="font-bold text-emerald-700">৳{v.totalPlannedSurplusDeficit.toLocaleString("bn-BD")}</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  মোট সংরক্ষিত খাতের সংখ্যা: {v.linesSnapshot?.length ?? 0} টি
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REVISIONS */}
      {activeTab === "REVISIONS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="font-bold text-slate-900 text-base">বাজেট রিভিশন ও সংশোধন প্রস্তাবনা</h2>
              <p className="text-xs text-slate-500">
                অনুমোদিত বাজেট সরাসরি পরিবর্তনের সুযোগ নেই; কেবল নিয়ন্ত্রিত রিভিশন অনুমোদনের মাধ্যমে সংস্করণ উন্নীত হয়
              </p>
            </div>
            <button
              onClick={() => {
                if (selectedBudget?.lines && selectedBudget.lines.length > 0) {
                  setNewRevisionForm((prev) => ({
                    ...prev,
                    budgetLineId: selectedBudget.lines[0].id,
                    newAmount: selectedBudget.lines[0].revisedAmount,
                  }));
                  setShowRevisionModal(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>রিভিশন প্রস্তাব তৈরি</span>
            </button>
          </div>

          <div className="space-y-3">
            {revisions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                কোনো রিভিশন প্রস্তাব জমা নেই।
              </div>
            ) : (
              revisions.map((rev) => (
                <div key={rev.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400">{rev.revisionCode}</span>
                      <h3 className="font-bold text-slate-900 text-base mt-0.5">{rev.titleBn}</h3>
                      <p className="text-xs text-slate-600 mt-1">{rev.reasonBn}</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        rev.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : rev.status === "SUBMITTED"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>

                  {rev.lineDiffs && rev.lineDiffs.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                      <div className="font-semibold text-slate-700">প্রস্তাবিত পরিবর্তনসমূহ:</div>
                      {rev.lineDiffs.map((d, i) => (
                        <div key={i} className="flex justify-between items-center text-slate-600">
                          <span>
                            {d.categoryNameBn} ({d.fundCode}):
                          </span>
                          <span className="font-mono">
                            ৳{d.previousAmount.toLocaleString("bn-BD")} ➔ ৳{d.newRequestedAmount.toLocaleString("bn-BD")} (
                            {d.amountDifference >= 0 ? "+" : ""}
                            ৳{d.amountDifference.toLocaleString("bn-BD")})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div>আবেদনকারী: {rev.requestedBy}</div>
                    {rev.status === "SUBMITTED" && (
                      <button
                        onClick={() => handleApproveRevision(rev.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm"
                      >
                        অনুমোদন দিন (সংস্করণ উন্নীত)
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PROJECTS */}
      {activeTab === "PROJECTS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="font-bold text-slate-900 text-base">প্রাতিষ্ঠানিক উন্নয়ন ও নির্মাণ প্রকল্প</h2>
              <p className="text-xs text-slate-500">
                মাদরাসার ভৌত অবকাঠামো, ছাদ ওয়াটারপ্রুফিং ও আইটি ল্যাব স্থাপন প্রকল্পের বাজেট
              </p>
            </div>
            <button
              onClick={() => setShowProjectModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন প্রকল্প বাজেট</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((prj) => (
              <div key={prj.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400">{prj.projectCode}</span>
                    <h3 className="font-bold text-slate-900 text-base mt-0.5">{prj.nameBn}</h3>
                    <p className="text-xs text-slate-500">{prj.fundNameBn}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {prj.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <div className="text-slate-400 text-[10px]">বরাদ্দ</div>
                    <div className="font-bold text-slate-800">৳{prj.approvedBudget.toLocaleString("bn-BD")}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">ব্যয় + কমিটেড</div>
                    <div className="font-bold text-teal-700">
                      ৳{(prj.actualExpense + prj.committedAmount).toLocaleString("bn-BD")}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">অবশিষ্ট</div>
                    <div className="font-bold text-emerald-700">৳{prj.remainingBudget.toLocaleString("bn-BD")}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div>প্রকল্প ইনচার্জ: {prj.projectManagerName}</div>
                  {prj.contractorVendorName && <div>ঠিকাদার: {prj.contractorVendorName}</div>}
                  <div>
                    মেয়াদ: {prj.startDate} হতে {prj.endDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: VARIANCE & ALERTS */}
      {activeTab === "VARIANCE" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">বাজেট বিচ্যুতি (Variance) ও সক্রিয় সতর্কবার্তা</h2>
              <p className="text-xs text-slate-500">অনুমোদিত পরিকল্পনা বনাম প্রকৃত ব্যয়ের তুলনামূলক বিশ্লেষণ</p>
            </div>
          </div>

          {/* Active Alerts List */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                    alt.alertLevel === "OVERRUN"
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : alt.alertLevel === "CRITICAL"
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-blue-50 border-blue-200 text-blue-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm">{alt.categoryNameBn}</div>
                      <p className="mt-0.5">{alt.messageBn}</p>
                    </div>
                  </div>
                  {!alt.isAcknowledged && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alt.id)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 shadow-sm"
                    >
                      গ্রহণ করুন
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Variance Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">খাত</th>
                  <th className="py-3 px-4">তহবিল</th>
                  <th className="py-3 px-4 text-right">বরাদ্দকৃত</th>
                  <th className="py-3 px-4 text-right">প্রকৃত</th>
                  <th className="py-3 px-4 text-right">কমিটেড</th>
                  <th className="py-3 px-4 text-right">বিচ্যুতি (Variance)</th>
                  <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {varianceReport.map((v) => (
                  <tr key={v.lineId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">{v.categoryNameBn}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{v.fundCode}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      ৳{v.planned.toLocaleString("bn-BD")}
                    </td>
                    <td className="py-3 px-4 text-right text-teal-700">৳{v.actual.toLocaleString("bn-BD")}</td>
                    <td className="py-3 px-4 text-right text-indigo-700">৳{v.committed.toLocaleString("bn-BD")}</td>
                    <td className="py-3 px-4 text-right font-bold">
                      <span className={v.variance >= 0 ? "text-emerald-700" : "text-rose-700"}>
                        {v.variance >= 0 ? "+" : ""}৳{v.variance.toLocaleString("bn-BD")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.status === "FAVORABLE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : v.status === "UNFAVORABLE"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: BUDGET PERIODS & SESSIONS */}
      {activeTab === "PERIODS" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>প্রাতিষ্ঠানিক বাজেট মেয়াদ ও শিক্ষাবর্ষ সেশন</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                মাদরাসার বার্ষিক অর্থবছর এবং শিক্ষাবর্ষ অনুযায়ী বাজেট সময়সীমা নির্ধারণ ও স্ট্যাটাস ব্যবস্থাপনা।
              </p>
            </div>
            <button
              onClick={() => setShowPeriodModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন মেয়াদ যুক্ত করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {periods.map((p) => {
              const statusColors: Record<string, string> = {
                PLANNED: "bg-blue-50 text-blue-700 border-blue-200",
                ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
                CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
                ARCHIVED: "bg-slate-200 text-slate-800 border-slate-300",
              };

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-medium text-slate-400">{p.periodCode}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusColors[p.status] || "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.isLocked && (
                          <span className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200" title="লকড">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug">{p.titleBn}</h3>
                    <p className="text-xs text-slate-500">{p.titleEn}</p>
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>মেয়াদ ধরন:</span>
                      <span className="font-medium text-slate-900">{p.periodType}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>সময়সীমা:</span>
                      <span className="font-medium text-slate-900">
                        {p.startDate} থেকে {p.endDate}
                      </span>
                    </div>
                    {p.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                        {p.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: CREATE BUDGET */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span>নতুন বাজেট খসড়া তৈরি (DRAFT)</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">বাজেট শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={newBudgetForm.titleBn}
                  onChange={(e) => setNewBudgetForm({ ...newBudgetForm, titleBn: e.target.value })}
                  placeholder="যেমন: বার্ষিক প্রাতিষ্ঠানিক বাজেট ২০২৬-২০২৭"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">বাজেট মেয়াদ</label>
                  <select
                    value={newBudgetForm.periodId}
                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, periodId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.titleBn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">অর্থবছর</label>
                  <input
                    type="text"
                    value={newBudgetForm.fiscalYear}
                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, fiscalYear: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শুরুর তারিখ</label>
                  <input
                    type="date"
                    required
                    value={newBudgetForm.startDate}
                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শেষ তারিখ</label>
                  <input
                    type="date"
                    required
                    value={newBudgetForm.endDate}
                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  খসড়া সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BUDGET LINE */}
      {showLineModal && selectedBudget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>নতুন বাজেট খাত যুক্ত করুন</span>
              </h3>
              <button onClick={() => setShowLineModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLine} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">তহবিল / ফান্ড *</label>
                  <select
                    value={newLineForm.fundCode}
                    onChange={(e) => setNewLineForm({ ...newLineForm, fundCode: e.target.value as BudgetFundCode })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="GENERAL">সাধারণ ফান্ড</option>
                    <option value="LILLAH">লিল্লাহ বোর্ডিং ফান্ড</option>
                    <option value="ZAKAT">যাকাত ফান্ড</option>
                    <option value="CONSTRUCTION">নির্মাণ ও উন্নয়ন ফান্ড</option>
                    <option value="ORPHAN_SUPPORT">এতিম স্পনসরশিপ ফান্ড</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ধরন</label>
                  <select
                    value={newLineForm.categoryType}
                    onChange={(e) =>
                      setNewLineForm({ ...newLineForm, categoryType: e.target.value as "INCOME" | "EXPENSE" })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="EXPENSE">ব্যয় (EXPENSE)</option>
                    <option value="INCOME">আয় (INCOME)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">খাতের নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={newLineForm.categoryNameBn}
                  onChange={(e) => setNewLineForm({ ...newLineForm, categoryNameBn: e.target.value })}
                  placeholder="যেমন: ছাত্রাবাস খাদ্যদ্রব্য ক্রয়"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">বরাদ্দ পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={newLineForm.plannedAmount}
                    onChange={(e) => setNewLineForm({ ...newLineForm, plannedAmount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">বিভাগ</label>
                  <input
                    type="text"
                    value={newLineForm.departmentNameBn}
                    onChange={(e) => setNewLineForm({ ...newLineForm, departmentNameBn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLineModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  খাত সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REQUEST REVISION */}
      {showRevisionModal && selectedBudget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>বাজেট রিভিশন ও সংশোধন প্রস্তাব</span>
              </h3>
              <button onClick={() => setShowRevisionModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestRevision} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">সংশোধন শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={newRevisionForm.titleBn}
                  onChange={(e) => setNewRevisionForm({ ...newRevisionForm, titleBn: e.target.value })}
                  placeholder="যেমন: ছাত্রাবাস খাদ্যদ্রব্য ব্যয় বৃদ্ধি প্রস্তাব"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">সংশোধনের কারণ *</label>
                <textarea
                  rows={2}
                  required
                  value={newRevisionForm.reasonBn}
                  onChange={(e) => setNewRevisionForm({ ...newRevisionForm, reasonBn: e.target.value })}
                  placeholder="বাজারমূল্য বৃদ্ধি ও ছাত্র সংখ্যা বৃদ্ধির কারণে খাদ্য খাতে বরাদ্দ বৃদ্ধি প্রয়োজন..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">খাত নির্বাচন করুন *</label>
                <select
                  value={newRevisionForm.budgetLineId}
                  onChange={(e) => {
                    const l = selectedBudget.lines.find((line) => line.id === e.target.value);
                    setNewRevisionForm({
                      ...newRevisionForm,
                      budgetLineId: e.target.value,
                      newAmount: l ? l.revisedAmount : 0,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {selectedBudget.lines.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.categoryNameBn} (বর্তমান: ৳{l.revisedAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">নতুন প্রস্তাবিত বরাদ্দ (৳) *</label>
                <input
                  type="number"
                  min={100}
                  required
                  value={newRevisionForm.newAmount}
                  onChange={(e) =>
                    setNewRevisionForm({ ...newRevisionForm, newAmount: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  প্রস্তাব সাবমিট
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PROJECT */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                <span>নতুন উন্নয়ন প্রকল্প বাজেট</span>
              </h3>
              <button onClick={() => setShowProjectModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch("/api/admin/budgets/projects", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newProjectForm),
                  });
                  const data = await res.json();
                  if (data.success) {
                    showToast("প্রকল্প বাজেট সংরক্ষিত হয়েছে।");
                    setShowProjectModal(false);
                    await loadData();
                  } else {
                    alert(data.error);
                  }
                } catch (err: any) {
                  alert(err.message);
                }
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">প্রকল্পের নাম *</label>
                <input
                  type="text"
                  required
                  value={newProjectForm.nameBn}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, nameBn: e.target.value })}
                  placeholder="যেমন: ৩য় তলা হিফজখানা সম্প্রসারণ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ফান্ড *</label>
                  <select
                    value={newProjectForm.fundCode}
                    onChange={(e) =>
                      setNewProjectForm({ ...newProjectForm, fundCode: e.target.value as BudgetFundCode })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="CONSTRUCTION">নির্মাণ ও উন্নয়ন ফান্ড</option>
                    <option value="GENERAL">সাধারণ ফান্ড</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">অনুমোদিত বরাদ্দ (৳) *</label>
                  <input
                    type="number"
                    min={1000}
                    required
                    value={newProjectForm.approvedBudget}
                    onChange={(e) =>
                      setNewProjectForm({ ...newProjectForm, approvedBudget: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">প্রকল্প ইনচার্জ</label>
                  <input
                    type="text"
                    value={newProjectForm.projectManagerName}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, projectManagerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ঠিকাদার / ভেন্ডর</label>
                  <input
                    type="text"
                    value={newProjectForm.contractorVendorName}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, contractorVendorName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  প্রকল্প সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PERIOD */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>নতুন বাজেট মেয়াদ / সেশন</span>
              </h3>
              <button onClick={() => setShowPeriodModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মেয়াদের শিরোনাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={newPeriodForm.titleBn}
                  onChange={(e) => setNewPeriodForm({ ...newPeriodForm, titleBn: e.target.value })}
                  placeholder="যেমন: অর্থবছর ২০২৬-২০২৭"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মেয়াদের শিরোনাম (ইংরেজি)</label>
                <input
                  type="text"
                  value={newPeriodForm.titleEn}
                  onChange={(e) => setNewPeriodForm({ ...newPeriodForm, titleEn: e.target.value })}
                  placeholder="যেমন: Financial Year 2026-2027"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মেয়াদ ধরন *</label>
                <select
                  value={newPeriodForm.periodType}
                  onChange={(e) =>
                    setNewPeriodForm({
                      ...newPeriodForm,
                      periodType: e.target.value as "ANNUAL" | "ACADEMIC_SESSION" | "FINANCIAL_YEAR" | "CUSTOM",
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="FINANCIAL_YEAR">অর্থবছর (Financial Year: জুলাই-জুন)</option>
                  <option value="ANNUAL">বার্ষিক ক্যালেন্ডার (জানুয়ারি-ডিসেম্বর)</option>
                  <option value="ACADEMIC_SESSION">শিক্ষাবর্ষ সেশন (শাওয়াল-রমজান / বার্ষিক)</option>
                  <option value="CUSTOM">বিশেষ / কাস্টম মেয়াদ</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শুরুর তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={newPeriodForm.startDate}
                    onChange={(e) => setNewPeriodForm({ ...newPeriodForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শেষ তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={newPeriodForm.endDate}
                    onChange={(e) => setNewPeriodForm({ ...newPeriodForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মন্তব্য / নোটস</label>
                <textarea
                  rows={2}
                  value={newPeriodForm.notes}
                  onChange={(e) => setNewPeriodForm({ ...newPeriodForm, notes: e.target.value })}
                  placeholder="মেয়াদ সংক্রান্ত প্রশাসনিক দিকনির্দেশনা..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPeriodModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
                >
                  মেয়াদ সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
