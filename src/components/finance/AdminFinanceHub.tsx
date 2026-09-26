"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  Receipt,
  FileText,
  DollarSign,
  PlusCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Users,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  Heart,
  Landmark,
  ShieldAlert,
} from "lucide-react";

export default function AdminFinanceHub() {
  const [activeSubTab, setActiveSubTab] = useState<
    | "OVERVIEW"
    | "STRUCTURES"
    | "INVOICES"
    | "MONTHLY_BILLING"
    | "PAYMENTS"
    | "CASHBOOK"
    | "TRANSACTIONS"
    | "ASSISTANCE"
    | "SCHOLARSHIPS"
    | "PAYROLL"
  >("OVERVIEW");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Data states
  const [funds, setFunds] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesSummary, setInvoicesSummary] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [cashbook, setCashbook] = useState<any>(null);
  const [assistances, setAssistances] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Selected filters
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");

  // Modals & forms
  const [showAddStructure, setShowAddStructure] = useState(false);
  const [structureForm, setStructureForm] = useState({
    nameBn: "",
    feeType: "MONTHLY",
    amount: "",
    residentialStatus: "ALL",
    dueDay: 10,
    lateFeeAmount: 0,
    fundCode: "GENERAL",
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "CASH",
    transactionId: "",
    notes: "",
  });

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [refundForm, setRefundForm] = useState({
    amount: "",
    reason: "",
    refundMethod: "CASH",
  });

  const [showTxModal, setShowTxModal] = useState(false);
  const [txForm, setTxForm] = useState({
    fundCode: "GENERAL",
    type: "INCOME",
    category: "",
    amount: "",
    payeeOrPayer: "",
    paymentMethod: "CASH",
    notes: "",
  });

  const [monthlyMonth, setMonthlyMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
  const [monthlyFeeType, setMonthlyFeeType] = useState("MONTHLY");

  const [payrollForm, setPayrollForm] = useState({
    userId: "",
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    baseSalary: "",
    allowances: 0,
    deductions: 0,
  });

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [fRes, sessRes, clsRes] = await Promise.all([
        fetch("/api/admin/finance"),
        fetch("/api/admin/academic/sessions"),
        fetch("/api/admin/academic/classes"),
      ]);

      const fData = await fRes.json();
      const sessData = await sessRes.json();
      const clsData = await clsRes.json();

      if (fData.funds) setFunds(fData.funds);
      if (sessData.sessions) {
        setSessions(sessData.sessions);
        const curr = sessData.sessions.find((s: any) => s.isCurrent) || sessData.sessions[0];
        if (curr) setSelectedSessionId(curr.id);
      }
      if (clsData.classes) setClasses(clsData.classes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Subtab data fetching
  useEffect(() => {
    if (activeSubTab === "STRUCTURES") fetchStructures();
    if (activeSubTab === "INVOICES") fetchInvoices();
    if (activeSubTab === "PAYMENTS") fetchPayments();
    if (activeSubTab === "CASHBOOK") fetchCashbook();
    if (activeSubTab === "ASSISTANCE") fetchAssistances();
    if (activeSubTab === "SCHOLARSHIPS") fetchScholarships();
    if (activeSubTab === "PAYROLL") fetchPayrolls();
  }, [activeSubTab, selectedSessionId, selectedClassId]);

  const fetchStructures = async () => {
    try {
      const res = await fetch(`/api/admin/finance/structures?sessionId=${selectedSessionId}&classId=${selectedClassId}`);
      const data = await res.json();
      if (data.structures) setStructures(data.structures);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvoices = async () => {
    try {
      let url = `/api/admin/finance/invoices?sessionId=${selectedSessionId}`;
      if (selectedClassId) url += `&classId=${selectedClassId}`;
      if (invoiceSearch) url += `&search=${encodeURIComponent(invoiceSearch)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.invoices) setInvoices(data.invoices);
      if (data.summary) setInvoicesSummary(data.summary);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/admin/finance/payments");
      const data = await res.json();
      if (data.payments) setPayments(data.payments);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCashbook = async () => {
    try {
      const res = await fetch("/api/admin/finance/cashbook");
      const data = await res.json();
      if (data.success) setCashbook(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssistances = async () => {
    try {
      const res = await fetch("/api/admin/finance/assistance");
      const data = await res.json();
      if (data.assistances) setAssistances(data.assistances);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchScholarships = async () => {
    try {
      const res = await fetch("/api/admin/finance/scholarships");
      const data = await res.json();
      if (data.scholarships) setScholarships(data.scholarships);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayrolls = async () => {
    try {
      const res = await fetch("/api/admin/finance/payroll");
      const data = await res.json();
      if (data.payrolls) setPayrolls(data.payrolls);
      if (data.teachers) setTeachers(data.teachers);
    } catch (err) {
      console.error(err);
    }
  };

  // Actions
  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/finance/structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...structureForm,
          sessionId: selectedSessionId,
          classId: selectedClassId || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message || "ফি কাঠামো সংরক্ষিত হয়েছে!", type: "success" });
        setShowAddStructure(false);
        fetchStructures();
      } else {
        setMsg({ text: data.error || "সংরক্ষণে ব্যর্থতা", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      const res = await fetch("/api/admin/finance/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          ...paymentForm,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message || "পেমেন্ট সফলভাবে সংরক্ষিত হয়েছে!", type: "success" });
        setShowPaymentModal(false);
        fetchInvoices();
        fetchInitialData();
      } else {
        setMsg({ text: data.error || "পেমেন্ট ব্যর্থ", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    try {
      const res = await fetch("/api/admin/finance/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          ...refundForm,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message || "রিফান্ড সম্পন্ন হয়েছে!", type: "success" });
        setShowRefundModal(false);
        fetchPayments();
        fetchInitialData();
      } else {
        setMsg({ text: data.error || "রিফান্ড ব্যর্থ", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    }
  };

  const handleBulkMonthlyGenerate = async () => {
    if (!confirm(`${monthlyMonth} মাসের জন্য সক্রিয় সকল শিক্ষার্থীর ফি জেনারেট করতে চান?`)) return;
    try {
      const res = await fetch("/api/admin/finance/invoices/monthly-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          classId: selectedClassId || undefined,
          billingMonth: monthlyMonth,
          feeType: monthlyFeeType,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message, type: "success" });
        fetchInvoices();
      } else {
        setMsg({ text: data.error || "মাসিক বিল তৈরিতে সমস্যা", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    }
  };

  const handleRecordTx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/finance/funds/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txForm),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message, type: "success" });
        setShowTxModal(false);
        fetchInitialData();
        if (activeSubTab === "CASHBOOK") fetchCashbook();
      } else {
        setMsg({ text: data.error || "লেনদেন ব্যর্থ", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    }
  };

  const handleAssistanceDecision = async (id: string, action: "APPROVE" | "REJECT", waiverPercentage = 50) => {
    try {
      const res = await fetch("/api/admin/finance/assistance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, waiverPercentage }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message, type: "success" });
        fetchAssistances();
      } else {
        setMsg({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    }
  };

  const handleSavePayroll = async (action: "DRAFT" | "PAY") => {
    try {
      const res = await fetch("/api/admin/finance/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payrollForm, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message, type: "success" });
        fetchPayrolls();
        fetchInitialData();
      } else {
        setMsg({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    }
  };

  const fundIcons: Record<string, any> = {
    GENERAL: Landmark,
    LILLAH: Heart,
    ZAKAT: ShieldAlert,
    CONSTRUCTION: Building,
    ORPHAN_SUPPORT: Users,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#0D5C3A]" />
            <h1 className="text-xl font-bold text-gray-900">অর্থ ও হিসাব ব্যবস্থাপনা ইঞ্জিন (Finance Hub)</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার কেন্দ্রীয় ৫টি তহবিল, শিক্ষার্থী ফি, লেজার ও অডিট ট্রেইল।
          </p>
        </div>

        {/* Global Session & Class Selectors */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.isCurrent ? "★ (বর্তমান সেশন)" : ""}
              </option>
            ))}
          </select>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg text-xs font-semibold bg-white"
          >
            <option value="">সকল জামাত / শ্রেণি</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameBn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-lg text-xs font-semibold flex items-center justify-between ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-gray-400 hover:text-gray-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 5 Approved Institutional Funds Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {funds.map((f) => {
          const IconComponent = fundIcons[f.code] || Landmark;
          return (
            <div key={f.id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-[11px] font-bold tracking-wider">{f.code}</span>
                  <IconComponent className="w-4 h-4 text-[#0D5C3A]" />
                </div>
                <h3 className="text-xs font-semibold text-gray-700 line-clamp-1">{f.nameBn}</h3>
              </div>
              <div className="mt-3">
                <span className="text-lg font-bold font-mono text-[#0D5C3A]">
                  ৳ {f.currentBalance?.toLocaleString("bn-BD") || 0}
                </span>
                <span className="block text-[10px] text-gray-400 mt-0.5">বর্তমান স্থিতি (লাইভ)</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-2 text-xs font-semibold">
        {[
          { key: "OVERVIEW", label: "সারসংক্ষেপ" },
          { key: "STRUCTURES", label: "ফি কাঠামো" },
          { key: "INVOICES", label: "ইনভয়েস তালিকা" },
          { key: "MONTHLY_BILLING", label: "মাসিক বিল জেনারেশন" },
          { key: "PAYMENTS", label: "পেমেন্ট ও রসিদ" },
          { key: "CASHBOOK", label: "দৈনিক ক্যাশবুক" },
          { key: "TRANSACTIONS", label: "আয়/ব্যয় ভাউচার" },
          { key: "ASSISTANCE", label: "আর্থিক সহায়তা ও মওকুফ" },
          { key: "SCHOLARSHIPS", label: "মেধাবৃত্তি" },
          { key: "PAYROLL", label: "শিক্ষক/কর্মী বেতন" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            className={`px-3.5 py-2 rounded-lg whitespace-nowrap transition ${
              activeSubTab === tab.key
                ? "bg-[#0D5C3A] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: OVERVIEW */}
      {activeSubTab === "OVERVIEW" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-semibold block">সর্বমোট ফি ধার্য (Receivable)</span>
              <span className="text-2xl font-bold font-mono text-gray-900 mt-2 block">
                ৳ {invoicesSummary?.totalBilled?.toLocaleString("bn-BD") || 0}
              </span>
            </div>
            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-semibold block">মোট আদায়কৃত ফি (Collected)</span>
              <span className="text-2xl font-bold font-mono text-[#0D5C3A] mt-2 block">
                ৳ {invoicesSummary?.totalCollected?.toLocaleString("bn-BD") || 0}
              </span>
            </div>
            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-semibold block">অবশিষ্ট বকেয়া ফি (Outstanding Due)</span>
              <span className="text-2xl font-bold font-mono text-red-600 mt-2 block">
                ৳ {invoicesSummary?.totalDue?.toLocaleString("bn-BD") || 0}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900">প্রাতিষ্ঠানিক শরিয়াহ তহবিল ব্যবহারের শর্তাবলী</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="font-bold text-[#0D5C3A] block mb-1">লিল্লাহ ফান্ড (LILLAH):</span>
                কেবলমাত্র অনাবাসিক/আবাসিক শিক্ষার্থীদের খাবার, রান্নার গ্যাস ও কিচেন সামগ্রী ব্যয়ে প্রযোজ্য। ডে-কেয়ার শিক্ষার্থীরা কোনো খাবার ফি প্রদান করবে না।
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="font-bold text-[#0D5C3A] block mb-1">যাকাত ফান্ড (ZAKAT):</span>
                কেবলমাত্র হকদার গরীব, ইয়াতীম ও দুস্থ শিক্ষার্থীদের শিক্ষাব্যবস্থাপনায় ব্যবহারযোগ্য। সাধারণ প্রাতিষ্ঠানিক বেতন বা নির্মাণে ব্যবহার সম্পূর্ণ নিষিদ্ধ।
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: STRUCTURES */}
      {activeSubTab === "STRUCTURES" && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">নির্ধারিত ফি কাঠামো তালিকা</h3>
            <button
              onClick={() => setShowAddStructure(!showAddStructure)}
              className="bg-[#0D5C3A] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" /> নতুন ফি কাঠামো নির্ধারণ
            </button>
          </div>

          {showAddStructure && (
            <form onSubmit={handleSaveStructure} className="p-4 bg-gray-50 border rounded-xl space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">ফি নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={structureForm.nameBn}
                    onChange={(e) => setStructureForm({ ...structureForm, nameBn: e.target.value })}
                    placeholder="যেমন: মাসিক টিউশন ও বোর্ডিং ফি"
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">ফি ধরন *</label>
                  <select
                    value={structureForm.feeType}
                    onChange={(e) => setStructureForm({ ...structureForm, feeType: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="ADMISSION">ভর্তি ফি (ADMISSION)</option>
                    <option value="MONTHLY">মাসিক বেতন (MONTHLY)</option>
                    <option value="TUITION">শিক্ষা ফি (TUITION)</option>
                    <option value="FOOD">খাবার বিল (FOOD)</option>
                    <option value="HOSTEL">আবাসিক ফি (HOSTEL)</option>
                    <option value="EXAM">পরীক্ষার ফি (EXAM)</option>
                    <option value="CERTIFICATE">সনদ ফি (CERTIFICATE)</option>
                    <option value="OTHER">অন্যান্য (OTHER)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">টাকার পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={structureForm.amount}
                    onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
                    placeholder="যেমন: 1200"
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">আবাসিক অবস্থা প্রযোজ্যতা</label>
                  <select
                    value={structureForm.residentialStatus}
                    onChange={(e) => setStructureForm({ ...structureForm, residentialStatus: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="ALL">সকল শিক্ষার্থী</option>
                    <option value="RESIDENTIAL">আবাসিক (RESIDENTIAL)</option>
                    <option value="NON_RESIDENTIAL">অনাবাসিক (NON_RESIDENTIAL)</option>
                    <option value="DAY_CARE">ডে-কেয়ার (DAY_CARE)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">জমার তহবিল</label>
                  <select
                    value={structureForm.fundCode}
                    onChange={(e) => setStructureForm({ ...structureForm, fundCode: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="GENERAL">সাধারণ তহবিল (GENERAL)</option>
                    <option value="LILLAH">লিল্লাহ বোর্ডিং ফান্ড (LILLAH)</option>
                    <option value="ZAKAT">যাকাত তহবিল (ZAKAT)</option>
                    <option value="CONSTRUCTION">নির্মাণ তহবিল (CONSTRUCTION)</option>
                    <option value="ORPHAN_SUPPORT">এতিম ফান্ড (ORPHAN_SUPPORT)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">বিলম্ব ফি (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={structureForm.lateFeeAmount}
                    onChange={(e) => setStructureForm({ ...structureForm, lateFeeAmount: Number(e.target.value) })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStructure(false)}
                  className="px-3 py-1.5 border rounded hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button type="submit" className="bg-[#0D5C3A] text-white px-4 py-1.5 rounded font-semibold">
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3">ফি নাম</th>
                  <th className="p-3">ধরন</th>
                  <th className="p-3">প্রযোজ্য জামাত</th>
                  <th className="p-3">আবাসিক অবস্থা</th>
                  <th className="p-3">পরিমাণ (৳)</th>
                  <th className="p-3">তহবিল</th>
                  <th className="p-3">বিলম্ব ফি</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {structures.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold">{s.nameBn}</td>
                    <td className="p-3 font-mono">{s.feeType}</td>
                    <td className="p-3">{s.jamatClass?.nameBn || "সকল জামাত"}</td>
                    <td className="p-3">{s.residentialStatus}</td>
                    <td className="p-3 font-mono font-bold text-[#0D5C3A]">৳ {s.amount}</td>
                    <td className="p-3">{s.fundCode}</td>
                    <td className="p-3 font-mono">৳ {s.lateFeeAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: INVOICES */}
      {activeSubTab === "INVOICES" && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchInvoices()}
                placeholder="ইনভয়েস নং বা শিক্ষার্থীর নাম..."
                className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs outline-none"
              />
            </div>
            <button
              onClick={fetchInvoices}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              রিফ্রেশ
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3">ইনভয়েস নং</th>
                  <th className="p-3">শিক্ষার্থী</th>
                  <th className="p-3">বিবরণ / শিরোনাম</th>
                  <th className="p-3">ধার্য (৳)</th>
                  <th className="p-3">পরিশোধ (৳)</th>
                  <th className="p-3">বকেয়া (৳)</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-gray-900">{inv.invoiceNumber}</td>
                    <td className="p-3">
                      <span className="font-semibold block">{inv.student.fullNameBn}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {inv.student.studentIdNumber} (রোল: {inv.student.enrollments?.[0]?.rollNumber || "N/A"})
                      </span>
                    </td>
                    <td className="p-3">{inv.title}</td>
                    <td className="p-3 font-mono">৳ {inv.netAmount}</td>
                    <td className="p-3 font-mono text-emerald-700">৳ {inv.paidAmount}</td>
                    <td className="p-3 font-mono font-bold text-red-600">৳ {inv.dueAmount}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : inv.status === "PARTIALLY_PAID"
                            ? "bg-blue-100 text-blue-800"
                            : inv.status === "WAIVED"
                            ? "bg-purple-100 text-purple-800"
                            : inv.status === "CANCELLED"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {inv.dueAmount > 0 && inv.status !== "CANCELLED" && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentForm({ ...paymentForm, amount: String(inv.dueAmount) });
                            setShowPaymentModal(true);
                          }}
                          className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-2.5 py-1 rounded text-[11px] font-semibold"
                        >
                          ফি আদায়
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: MONTHLY BILLING */}
      {activeSubTab === "MONTHLY_BILLING" && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">স্বয়ংক্রিয় বাল্ক মাসিক ফি জেনারেশন</h3>
            <p className="text-xs text-gray-500 mt-1">
              সেশন ও জামাতভিত্তিক সকল নিয়মিত শিক্ষার্থীদের জন্য মাসিক বিল এক ক্লিকে প্রস্তুত করুন। পুনরাবৃত্তিমূলক ইনভয়েস তৈরি হবে না (আইডেমপোটেন্সি সুরক্ষিত)।
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border space-y-4 max-w-xl text-xs">
            <div>
              <label className="block font-semibold mb-1">বিলিং মাস (যেমন: 2026-03) *</label>
              <input
                type="text"
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(e.target.value)}
                className="w-full p-2 border rounded bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">ফি ধরন</label>
              <select
                value={monthlyFeeType}
                onChange={(e) => setMonthlyFeeType(e.target.value)}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="MONTHLY">মাসিক বেতন (MONTHLY)</option>
                <option value="TUITION">শিক্ষা ফি (TUITION)</option>
                <option value="FOOD">খাবার বিল (FOOD) - ডে-কেয়ার শিক্ষার্থীরা বাদ পড়বে</option>
                <option value="HOSTEL">আবাসিক ফি (HOSTEL)</option>
              </select>
            </div>
            <button
              onClick={handleBulkMonthlyGenerate}
              className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 shadow"
            >
              <CheckCircle className="w-4 h-4" />
              বাল্ক মাসিক বিল প্রস্তুত করুন
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 5: PAYMENTS & RECEIPTS */}
      {activeSubTab === "PAYMENTS" && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">গৃহীত পেমেন্ট ও রসিদ তালিকা</h3>
            <button onClick={fetchPayments} className="text-xs text-[#0D5C3A] font-semibold hover:underline">
              রিফ্রেশ
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3">রসিদ নং</th>
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">শিক্ষার্থী</th>
                  <th className="p-3">ইনভয়েস</th>
                  <th className="p-3">মাধ্যম</th>
                  <th className="p-3">পরিমাণ (৳)</th>
                  <th className="p-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-gray-900">{p.receiptNumber}</td>
                    <td className="p-3 text-gray-500">{new Date(p.receiptDate).toLocaleDateString("bn-BD")}</td>
                    <td className="p-3 font-semibold">{p.student.fullNameBn}</td>
                    <td className="p-3 font-mono">{p.invoice.invoiceNumber}</td>
                    <td className="p-3">{p.paymentMethod}</td>
                    <td className="p-3 font-mono font-bold text-[#0D5C3A]">৳ {p.amount}</td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedPayment(p);
                          setRefundForm({ amount: String(p.amount), reason: "", refundMethod: "CASH" });
                          setShowRefundModal(true);
                        }}
                        className="text-red-600 hover:text-red-800 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> রিফান্ড
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 6: CASHBOOK */}
      {activeSubTab === "CASHBOOK" && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">দৈনিক ক্যাশবুক ও খতিয়ান</h3>
            <span className="text-xs text-gray-500 font-mono">তারিখ: {cashbook?.date || "আজ"}</span>
          </div>

          {cashbook?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 block">আজকের মোট জমা (Income)</span>
                <span className="text-xl font-bold font-mono text-emerald-900 mt-1 block">
                  ৳ {cashbook.summary.todayIncome}
                </span>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <span className="text-red-800 block">আজকের মোট খরচ (Expense)</span>
                <span className="text-xl font-bold font-mono text-red-900 mt-1 block">
                  ৳ {cashbook.summary.todayExpense}
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-800 block">আজকের মোট নিট ব্যালেন্স মুভমেন্ট</span>
                <span className="text-xl font-bold font-mono text-gray-900 mt-1 block">
                  ৳ {cashbook.summary.netMovement}
                </span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3">ভাউচার নং</th>
                  <th className="p-3">তহবিল</th>
                  <th className="p-3">ধরন</th>
                  <th className="p-3">খাত / বিবরণ</th>
                  <th className="p-3">দাতা / গ্রহীতা</th>
                  <th className="p-3">পরিমাণ (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cashbook?.transactions?.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold">{t.receiptOrVoucherNo}</td>
                    <td className="p-3">{t.fund.nameBn}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.type === "INCOME" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {t.type === "INCOME" ? "জমা / আয়" : "খরচ / ব্যয়"}
                      </span>
                    </td>
                    <td className="p-3">{t.category}</td>
                    <td className="p-3 font-semibold">{t.payeeOrPayer}</td>
                    <td className="p-3 font-mono font-bold">৳ {t.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 7: TRANSACTIONS / DONATIONS */}
      {activeSubTab === "TRANSACTIONS" && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">প্রাতিষ্ঠানিক আয়, ব্যয় ও দান ভাউচার এন্ট্রি</h3>
            <button
              onClick={() => setShowTxModal(true)}
              className="bg-[#0D5C3A] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" /> নতুন ভাউচার তৈরি
            </button>
          </div>

          {showTxModal && (
            <form onSubmit={handleRecordTx} className="p-4 bg-gray-50 border rounded-xl space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">তহবিল নির্বাচন *</label>
                  <select
                    value={txForm.fundCode}
                    onChange={(e) => setTxForm({ ...txForm, fundCode: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="GENERAL">সাধারণ তহবিল (GENERAL)</option>
                    <option value="LILLAH">লিল্লাহ বোর্ডিং ফান্ড (LILLAH)</option>
                    <option value="ZAKAT">যাকাত তহবিল (ZAKAT)</option>
                    <option value="CONSTRUCTION">নির্মাণ তহবিল (CONSTRUCTION)</option>
                    <option value="ORPHAN_SUPPORT">এতিম ফান্ড (ORPHAN_SUPPORT)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">লেনদেনের ধরন *</label>
                  <select
                    value={txForm.type}
                    onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="INCOME">জমা / অনুদান (Income)</option>
                    <option value="EXPENSE">খরচ / ব্যয় (Expense)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">টাকার পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">খাত / শিরোনাম *</label>
                  <input
                    type="text"
                    required
                    value={txForm.category}
                    onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                    placeholder="যেমন: মাসিক চাল ক্রয় / লিল্লাহ দান"
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">দাতা / গ্রহীতার নাম *</label>
                  <input
                    type="text"
                    required
                    value={txForm.payeeOrPayer}
                    onChange={(e) => setTxForm({ ...txForm, payeeOrPayer: e.target.value })}
                    placeholder="নাম লিখুন..."
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">পেমেন্ট মাধ্যম</label>
                  <select
                    value={txForm.paymentMethod}
                    onChange={(e) => setTxForm({ ...txForm, paymentMethod: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="CASH">ক্যাশ (CASH)</option>
                    <option value="BANK">ব্যাংক (BANK)</option>
                    <option value="BKASH">বিকাশ (bKash)</option>
                    <option value="NAGAD">নগদ (Nagad)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-3 py-1.5 border rounded hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button type="submit" className="bg-[#0D5C3A] text-white px-4 py-1.5 rounded font-semibold">
                  ভাউচার প্রস্তুত করুন
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SUBTAB 8: ASSISTANCE */}
      {activeSubTab === "ASSISTANCE" && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">দরিদ্র ও এতিম ছাত্র আর্থিক সহায়তা পর্যালোচনা</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3">শিক্ষার্থী</th>
                  <th className="p-3">কারণ / পরিবার অবস্থা</th>
                  <th className="p-3">এতিম?</th>
                  <th className="p-3">মওকুফ হার</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assistances.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold">{a.student.fullNameBn}</td>
                    <td className="p-3">{a.reason}</td>
                    <td className="p-3">{a.isOrphan ? "হ্যাঁ (এতিম)" : "না"}</td>
                    <td className="p-3 font-bold font-mono">{a.waiverPercentage}%</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : a.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 flex items-center gap-1.5">
                      {a.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleAssistanceDecision(a.id, "APPROVE", 100)}
                            className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            ১০০% অনুমোদন
                          </button>
                          <button
                            onClick={() => handleAssistanceDecision(a.id, "APPROVE", 50)}
                            className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            ৫০% অনুমোদন
                          </button>
                          <button
                            onClick={() => handleAssistanceDecision(a.id, "REJECT")}
                            className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            বাতিল
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 9: SCHOLARSHIPS */}
      {activeSubTab === "SCHOLARSHIPS" && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">মেধাবৃত্তি কার্যক্রম</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3">বৃত্তি নাম</th>
                  <th className="p-3">কোড</th>
                  <th className="p-3">ধরন</th>
                  <th className="p-3">ছাড়ের হার</th>
                  <th className="p-3">বরাদ্দ সংখ্যা</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scholarships.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold">{s.nameBn}</td>
                    <td className="p-3 font-mono">{s.code}</td>
                    <td className="p-3">{s.discountType}</td>
                    <td className="p-3 font-bold font-mono">
                      {s.discountType === "PERCENTAGE" ? `${s.discountValue}%` : `৳ ${s.discountValue}`}
                    </td>
                    <td className="p-3">{s._count?.allocations || 0} জন</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 10: PAYROLL */}
      {activeSubTab === "PAYROLL" && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">শিক্ষক ও স্টাফ বেতন স্লিপ</h3>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border space-y-3 text-xs">
            <h4 className="font-bold text-gray-800">নতুন বেতন স্লিপ নির্ধারণ</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold mb-1">শিক্ষক / স্টাফ *</label>
                <select
                  value={payrollForm.userId}
                  onChange={(e) => setPayrollForm({ ...payrollForm, userId: e.target.value })}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="">নির্বাচন করুন</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.phone || t.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">মাস *</label>
                <input
                  type="text"
                  value={payrollForm.month}
                  onChange={(e) => setPayrollForm({ ...payrollForm, month: e.target.value })}
                  className="w-full p-2 border rounded bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">মূল বেতন (৳) *</label>
                <input
                  type="number"
                  min="0"
                  value={payrollForm.baseSalary}
                  onChange={(e) => setPayrollForm({ ...payrollForm, baseSalary: e.target.value })}
                  className="w-full p-2 border rounded bg-white"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => handleSavePayroll("DRAFT")}
                  className="bg-gray-700 text-white px-3 py-2 rounded font-semibold w-full"
                >
                  খসড়া সংরক্ষণ
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePayroll("PAY")}
                  className="bg-[#0D5C3A] text-white px-3 py-2 rounded font-semibold w-full"
                >
                  বেতন প্রদান
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3">ভাউচার নং</th>
                  <th className="p-3">শিক্ষক নাম</th>
                  <th className="p-3">মাস</th>
                  <th className="p-3">মূল বেতন</th>
                  <th className="p-3">নিট প্রদেয়</th>
                  <th className="p-3">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold">{p.voucherNumber}</td>
                    <td className="p-3 font-semibold">{p.user?.name}</td>
                    <td className="p-3 font-mono">{p.month}</td>
                    <td className="p-3 font-mono">৳ {p.baseSalary}</td>
                    <td className="p-3 font-mono font-bold text-[#0D5C3A]">৳ {p.netSalary}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === "PAID" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">
              ফি আদায় - ইনভয়েস: {selectedInvoice.invoiceNumber}
            </h3>
            <div className="p-3 bg-gray-50 rounded-lg space-y-1">
              <div>শিক্ষার্থী: <span className="font-semibold">{selectedInvoice.student.fullNameBn}</span></div>
              <div>বকেয়া পরিমাণ: <span className="font-bold text-red-600">৳ {selectedInvoice.dueAmount}</span></div>
            </div>
            <form onSubmit={handleCollectPayment} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">আদায়কৃত টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedInvoice.dueAmount}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full p-2 border rounded font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="CASH">ক্যাশ (CASH)</option>
                  <option value="BANK">ব্যাংক (BANK)</option>
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="NAGAD">নগদ (Nagad)</option>
                  <option value="ROCKET">রকেট (Rocket)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">ট্রানজেকশন আইডি (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  placeholder="যেমন: TRX987654"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 border rounded hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button type="submit" className="bg-[#0D5C3A] text-white px-4 py-1.5 rounded font-semibold">
                  পেমেন্ট নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-red-600 border-b pb-2">
              পেমেন্ট রিফান্ড - রসিদ: {selectedPayment.receiptNumber}
            </h3>
            <div className="p-3 bg-red-50 rounded-lg space-y-1 text-red-900">
              <div>শিক্ষার্থী: <span className="font-semibold">{selectedPayment.student.fullNameBn}</span></div>
              <div>মূল পেমেন্ট: <span className="font-bold">৳ {selectedPayment.amount}</span></div>
            </div>
            <form onSubmit={handleProcessRefund} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">রিফান্ডের পরিমাণ (৳) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedPayment.amount}
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  className="w-full p-2 border rounded font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">রিফান্ডের কারণ (কমপক্ষে ৫ অক্ষর) *</label>
                <textarea
                  required
                  rows={3}
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  placeholder="অতিরিক্ত আদায় বা ভুল এন্ট্রি সংক্রান্ত কারণ লিখুন..."
                  className="w-full p-2 border rounded"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-3 py-1.5 border rounded hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button type="submit" className="bg-red-600 text-white px-4 py-1.5 rounded font-semibold">
                  রিফান্ড কার্যকর করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
