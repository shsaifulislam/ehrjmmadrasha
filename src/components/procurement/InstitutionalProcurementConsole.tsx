"use client";

import React, { useState, useEffect } from "react";
import {
  Vendor,
  RFQ,
  Quotation,
  Contract,
  ProcurementDashboardStats,
  QuotationComparisonMatrix,
  ProcurementEvaluation,
  VendorCategoryCode,
  VendorType,
  VendorStatus,
  ContractType,
  ContractStatus,
} from "@/lib/procurement/types";
import { Printer, Download, X } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

interface InstitutionalProcurementConsoleProps {
  initialTab?: "OVERVIEW" | "VENDORS" | "RFQS" | "COMPARISON" | "CONTRACTS" | "RISK";
  initialVendorId?: string;
  initialRfqId?: string;
  initialContractId?: string;
}

export function InstitutionalProcurementConsole({
  initialTab = "OVERVIEW",
  initialVendorId,
  initialRfqId,
  initialContractId,
}: InstitutionalProcurementConsoleProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Data states
  const [stats, setStats] = useState<ProcurementDashboardStats | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<Contract[]>([]);

  // Selection states
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [comparisonMatrix, setComparisonMatrix] = useState<QuotationComparisonMatrix | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<ProcurementEvaluation | null>(null);

  // Filter states
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState<string>("ALL");
  const [vendorStatusFilter, setVendorStatusFilter] = useState<string>("ALL");

  // Modals
  const [showNewVendorModal, setShowNewVendorModal] = useState(false);
  const [showNewRfqModal, setShowNewRfqModal] = useState(false);
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [showReviseContractModal, setShowReviseContractModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showContractPrintModal, setShowContractPrintModal] = useState(false);
  const [contractToPrint, setContractToPrint] = useState<Contract | null>(null);

  // New Vendor Form
  const [vendorForm, setVendorForm] = useState({
    legalNameBn: "",
    legalNameEn: "",
    displayName: "",
    vendorType: "SUPPLIER" as VendorType,
    categoryCode: "BOOKS" as VendorCategoryCode,
    phone: "",
    altPhone: "",
    email: "",
    addressBn: "ইলিয়টগঞ্জ বাজার, দাউদকান্দি, কুমিল্লা",
    district: "Comilla",
    tradeLicenseNo: "",
    tinNumber: "",
    binVatNumber: "",
    bankName: "Islami Bank Bangladesh PLC",
    bankBranch: "Kandirpar Branch",
    bankAccountNumber: "",
    contactName: "",
    contactDesignation: "ম্যানেজার",
    contactPhone: "",
  });

  // New RFQ Form
  const [rfqForm, setRfqForm] = useState({
    titleBn: "",
    descriptionBn: "",
    categoryCode: "BOOKS" as VendorCategoryCode,
    submissionDeadline: "2026-04-15",
    itemName: "",
    itemSpec: "",
    itemQty: 100,
    itemUnit: "PCS",
    itemTargetBudget: 50,
  });

  // New Quote Form
  const [quoteForm, setQuoteForm] = useState({
    vendorId: "",
    validUntilDate: "2026-05-30",
    unitPrice: 50,
    deliveryDays: 14,
    warrantyMonths: 12,
    paymentTermsBn: "পণ্য গ্রহণের পর ৩০ দিনের মধ্যে ব্যাংক ট্রান্সফার।",
  });

  // New Contract Form
  const [contractForm, setContractForm] = useState({
    vendorId: "",
    titleBn: "",
    contractType: "SUPPLY" as ContractType,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    totalContractValue: 500000,
    paymentTermsBn: "মাসিক বিল সমন্বয়ের মাধ্যমে পরিশোধ।",
  });

  // Revise Contract Form
  const [revisionForm, setRevisionForm] = useState({
    changeReason: "",
    newContractValue: 0,
    newEndDate: "",
    newPaymentTermsBn: "",
  });

  // Evaluation Form
  const [evalForm, setEvalForm] = useState({
    recommendedVendorId: "",
    recommendedQuotationId: "",
    justificationBn: "",
  });

  // Load all initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, vendorsRes, rfqsRes, contractsRes] = await Promise.all([
        fetch("/api/admin/procurement/stats"),
        fetch("/api/admin/procurement/vendors"),
        fetch("/api/admin/procurement/rfqs"),
        fetch("/api/admin/procurement/contracts"),
      ]);

      const [statsData, vendorsData, rfqsData, contractsData] = await Promise.all([
        statsRes.json(),
        vendorsRes.json(),
        rfqsRes.json(),
        contractsRes.json(),
      ]);

      if (statsData.success) {
        setStats(statsData.stats);
        setAudits(statsData.recentAudits || []);
        setExpiringContracts(statsData.expiringContracts || []);
      }
      if (vendorsData.success) {
        setVendors(vendorsData.vendors || []);
        if (initialVendorId) {
          const found = vendorsData.vendors.find((v: Vendor) => v.id === initialVendorId);
          if (found) setSelectedVendor(found);
        }
      }
      if (rfqsData.success) {
        setRfqs(rfqsData.rfqs || []);
        if (initialRfqId) {
          const found = rfqsData.rfqs.find((r: RFQ) => r.id === initialRfqId);
          if (found) {
            setSelectedRfq(found);
            fetchComparison(found.id);
          }
        }
      }
      if (contractsData.success) {
        setContracts(contractsData.contracts || []);
        if (initialContractId) {
          const found = contractsData.contracts.find((c: Contract) => c.id === initialContractId);
          if (found) setSelectedContract(found);
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "ডাটা লোড করতে সমস্যা হয়েছে: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const exportVendorsToCSV = () => {
    if (!vendors || vendors.length === 0) {
      alert("কোনো ভেন্ডর তথ্য পাওয়া যায়নি।");
      return;
    }

    const headers = [
      "ভেন্ডর কোড",
      "প্রতিষ্ঠানের নাম (বাংলা)",
      "প্রতিষ্ঠানের নাম (ইংরেজি)",
      "ধরন",
      "ক্যাটাগরি",
      "মোবাইল নম্বর",
      "ঠিকানা",
      "ট্রেড লাইসেন্স নং",
      "ব্যাংক ও শাখা",
      "অ্যাকাউন্ট নং",
      "স্ট্যাটাস",
    ];

    const rows = vendors.map((v) => [
      v.id,
      `"${(v.legalNameBn || "").replace(/"/g, '""')}"`,
      `"${(v.legalNameEn || "").replace(/"/g, '""')}"`,
      v.vendorType,
      v.categoryCode,
      v.phone,
      `"${(v.addressBn || "").replace(/"/g, '""')}"`,
      v.tradeLicenseNo || "",
      `"${(v.bankName || "")} ${(v.bankBranch || "")}".trim()`,
      v.bankAccountNumberMasked || "",
      v.status,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `EHRJ_Vendors_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportContractsToCSV = () => {
    if (!contracts || contracts.length === 0) {
      alert("কোনো চুক্তি তথ্য পাওয়া যায়নি।");
      return;
    }

    const headers = [
      "চুক্তি আইডি",
      "চুক্তির শিরোনাম",
      "ভেন্ডরের নাম",
      "চুক্তির ধরন",
      "সংস্করণ",
      "শুরুর তারিখ",
      "শেষ তারিখ",
      "মোট চুক্তি মূল্য (টাকা)",
      "স্ট্যাটাস",
      "3-Way Match",
    ];

    const rows = contracts.map((c) => [
      c.id,
      `"${(c.titleBn || "").replace(/"/g, '""')}"`,
      `"${(c.vendorNameBn || "").replace(/"/g, '""')}"`,
      c.contractType,
      `v${c.currentVersion}`,
      c.startDate,
      c.endDate,
      c.totalContractValue,
      c.status,
      c.threeWayMatchStatus,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `EHRJ_Contracts_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchComparison = async (rfqId: string) => {
    try {
      const res = await fetch(`/api/admin/procurement/quotations/comparison?rfqId=${rfqId}`);
      const data = await res.json();
      if (data.success) {
        setComparisonMatrix(data.matrix);
      }
      const evalRes = await fetch(`/api/admin/procurement/evaluations?rfqId=${rfqId}`);
      const evalData = await evalRes.json();
      if (evalData.success && evalData.evaluations.length > 0) {
        setSelectedEvaluation(evalData.evaluations[0]);
      } else {
        setSelectedEvaluation(null);
      }
    } catch (e) {
      console.warn("Could not fetch comparison:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered vendors
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      vendorSearch === "" ||
      v.legalNameBn.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.displayName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.phone.includes(vendorSearch) ||
      v.vendorCode.toLowerCase().includes(vendorSearch.toLowerCase());
    const matchesCategory = vendorCategoryFilter === "ALL" || v.categoryCode === vendorCategoryFilter;
    const matchesStatus = vendorStatusFilter === "ALL" || v.status === vendorStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handle Create Vendor
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/procurement/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalNameBn: vendorForm.legalNameBn,
          legalNameEn: vendorForm.legalNameEn,
          displayName: vendorForm.displayName || vendorForm.legalNameBn,
          vendorType: vendorForm.vendorType,
          categoryCode: vendorForm.categoryCode,
          phone: vendorForm.phone,
          altPhone: vendorForm.altPhone,
          email: vendorForm.email,
          addressBn: vendorForm.addressBn,
          district: vendorForm.district,
          tradeLicenseNo: vendorForm.tradeLicenseNo,
          tinNumber: vendorForm.tinNumber,
          binVatNumber: vendorForm.binVatNumber,
          bankName: vendorForm.bankName,
          bankBranch: vendorForm.bankBranch,
          bankAccountNumber: vendorForm.bankAccountNumber,
          primaryContact: vendorForm.contactName
            ? {
                name: vendorForm.contactName,
                designation: vendorForm.contactDesignation,
                phone: vendorForm.contactPhone || vendorForm.phone,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessage({ type: "success", text: data.message });
      setShowNewVendorModal(false);
      loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Handle Create RFQ
  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/procurement/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleBn: rfqForm.titleBn,
          descriptionBn: rfqForm.descriptionBn,
          categoryCode: rfqForm.categoryCode,
          submissionDeadline: rfqForm.submissionDeadline,
          items: [
            {
              nameBn: rfqForm.itemName,
              specification: rfqForm.itemSpec,
              quantity: Number(rfqForm.itemQty),
              unit: rfqForm.itemUnit,
              targetUnitBudget: Number(rfqForm.itemTargetBudget),
            },
          ],
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessage({ type: "success", text: data.message });
      setShowNewRfqModal(false);
      loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Handle Submit Quote
  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;
    try {
      const targetItem = selectedRfq.items[0];
      const res = await fetch("/api/admin/procurement/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqId: selectedRfq.id,
          vendorId: quoteForm.vendorId,
          validUntilDate: quoteForm.validUntilDate,
          deliveryTimeDays: Number(quoteForm.deliveryDays),
          warrantyPeriodMonths: Number(quoteForm.warrantyMonths),
          paymentTermsBn: quoteForm.paymentTermsBn,
          items: [
            {
              rfqItemId: targetItem?.id,
              itemDescriptionBn: targetItem?.nameBn || "পণ্য বিবরণ",
              quantity: targetItem?.quantity || 1,
              unit: targetItem?.unit || "PCS",
              unitPrice: Number(quoteForm.unitPrice),
              taxAmount: 0,
              discountAmount: 0,
              lineTotal: Number(quoteForm.unitPrice) * (targetItem?.quantity || 1),
            },
          ],
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessage({ type: "success", text: data.message });
      setShowNewQuoteModal(false);
      fetchComparison(selectedRfq.id);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Handle Human Award Approval
  const handleApproveAward = async (evalId: string) => {
    try {
      const res = await fetch(`/api/admin/procurement/evaluations/${evalId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionNotes: "মাদরাসা পরিচালনা কমিটির সুপারিশক্রমে কার্যাদেশ চূড়ান্তভাবে অনুমোদিত।",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessage({ type: "success", text: data.message });
      if (selectedRfq) fetchComparison(selectedRfq.id);
      loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Handle Verify Vendor
  const handleVerifyVendor = async (vendorId: string, vfcId: string, status: "VERIFIED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/admin/procurement/vendors/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECORD_VERIFICATION",
          verificationId: vfcId,
          status,
          notes: status === "VERIFIED" ? "কাগজপত্র সত্যতা নিশ্চিতকৃত।" : "কাগজপত্র অসম্পূর্ণ বা বাতিল।",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessage({ type: "success", text: "ভেন্ডর যাচাইকরণ স্ট্যাটাস হালনাগাদ হয়েছে।" });
      setSelectedVendor(data.vendor);
      loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Handle Contract Version Revision
  const handleReviseContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    try {
      const res = await fetch(`/api/admin/procurement/contracts/${selectedContract.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVISE_VERSION",
          changeReason: revisionForm.changeReason,
          newContractValue: revisionForm.newContractValue || undefined,
          newEndDate: revisionForm.newEndDate || undefined,
          newPaymentTermsBn: revisionForm.newPaymentTermsBn || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessage({ type: "success", text: data.message });
      setShowReviseContractModal(false);
      setSelectedContract(data.contract);
      loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold tracking-wider uppercase">
              Phase 40 • Procurement & Contracts
            </span>
            <span className="text-xs text-slate-400">
              EHRJ Madrasha ERP
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            প্রাতিষ্ঠানিক প্রকিউরমেন্ট, সরবরাহকারী ও চুক্তি নিয়ন্ত্রণ ব্যবস্থা
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Vendor Master, Quotation Versioning, Factual RFQ Matrix, and Human Authority Contract Lifecycle
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNewVendorModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2"
          >
            <span>+ নতুন ভেন্ডর নিবন্ধন</span>
          </button>
          <button
            onClick={() => setShowNewRfqModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-indigo-900/30 flex items-center gap-2"
          >
            <span>+ RFQ কোটেশন আহ্বান</span>
          </button>
        </div>
      </div>

      {/* Global Alerts / Messages */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border text-sm flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
              : "bg-rose-950/40 border-rose-500/50 text-rose-200"
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-xs opacity-75 hover:opacity-100 underline ml-4"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Expiring Contracts Reminder Banner */}
      {expiringContracts.length > 0 && (
        <div className="mb-6 p-4 bg-amber-950/30 border border-amber-500/40 rounded-lg flex items-center gap-3 text-amber-200 text-sm">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <span className="font-semibold">চুক্তি নবায়ন সতর্কতা:</span>{" "}
            {expiringContracts.length}টি চুক্তির মেয়াদ আগামী ৬০ দিনের মধ্যে শেষ হচ্ছে (উদা: {expiringContracts[0].titleBn})।
          </div>
          <button
            onClick={() => setActiveTab("CONTRACTS")}
            className="px-3 py-1 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 rounded text-xs text-amber-100"
          >
            চুক্তিসমূহ দেখুন
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-3 mb-6">
        {[
          { id: "OVERVIEW", label: "সারসংক্ষেপ ও ড্যাশবোর্ড", icon: "📊" },
          { id: "VENDORS", label: `ভেন্ডর মাস্টার (${vendors.length})`, icon: "🏢" },
          { id: "RFQS", label: `RFQ ও দরপত্র (${rfqs.length})`, icon: "📑" },
          { id: "CONTRACTS", label: `চুক্তি ও সংস্করণ (${contracts.length})`, icon: "📜" },
          { id: "RISK", label: "সরবরাহ ঝুঁকি ও কমপ্লায়েন্স", icon: "🛡️" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <span className="text-xs text-slate-400 font-medium">সক্রিয় ভেন্ডর</span>
              <div className="text-2xl font-bold text-white mt-1">
                {stats?.activeVendorsCount ?? 0}
              </div>
              <span className="text-xs text-emerald-400 mt-2 block">
                যাচাই অপেক্ষমান: {stats?.pendingVerificationsCount ?? 0}টি
              </span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <span className="text-xs text-slate-400 font-medium">চলতি RFQ বিজ্ঞপ্তি</span>
              <div className="text-2xl font-bold text-indigo-400 mt-1">
                {stats?.activeRfqsCount ?? 0}
              </div>
              <span className="text-xs text-slate-400 mt-2 block">
                দাখিলকৃত কোটেশন: {stats?.pendingQuotationsCount ?? 0}টি
              </span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <span className="text-xs text-slate-400 font-medium">সক্রিয় প্রাতিষ্ঠানিক চুক্তি</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {stats?.activeContractsCount ?? 0}
              </div>
              <span className="text-xs text-amber-400 mt-2 block">
                মেয়াদ উত্তীর্ণের পথে: {stats?.expiringContractsCount ?? 0}টি
              </span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <span className="text-xs text-slate-400 font-medium">মোট চুক্তি মূল্য (বাজেট প্রতিশ্রুতি)</span>
              <div className="text-xl md:text-2xl font-bold text-white mt-1">
                ৳{(stats?.totalContractValueBdt ?? 0).toLocaleString("bn-BD")}
              </div>
              <span className="text-xs text-slate-400 mt-2 block">
                গড় অন-টাইম ডেলিভারি: {stats?.averageOnTimeDeliveryRate ?? 95}%
              </span>
            </div>
          </div>

          {/* Core Principles & Source of Truth Invariant Banner */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>⚖️</span> উৎস সত্যতা ও অখণ্ডতা নীতি (Non-Duplication Invariant)
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                ভেন্ডর মাস্টার, কোটেশন ভার্সনিং ও চুক্তি নিয়ন্ত্রণ ফেজ ৪০ দ্বারা শাসিত। নগদ লেনদেন ফেজ ৬ (অর্থবিভাগ) এবং ইনভেন্টরি মুভমেন্ট ফেজ ১২ দ্বারা পরিচালিত। কোনো আর্থিক হিসাব বা পণ্যের স্টক দ্বৈতভাবে তৈরি হয় না।
              </p>
            </div>
            <div className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-emerald-400 font-mono">
              EHRJ-AI-2026-PHASE40
            </div>
          </div>

          {/* Recent Audit Log */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center justify-between">
              <span>অডিট ও প্রাতিষ্ঠানিক প্রকিউরমেন্ট কার্যকলাপ (Audit Trail)</span>
              <span className="text-xs text-slate-400 font-normal">সর্বশেষ ১৫টি রেকর্ড</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase border-b border-slate-700/80">
                  <tr>
                    <th className="py-2.5 px-3">সময়</th>
                    <th className="py-2.5 px-3">ধরণ</th>
                    <th className="py-2.5 px-3">অ্যাকশন</th>
                    <th className="py-2.5 px-3">বিবরণ ও বিষয়বস্তু</th>
                    <th className="py-2.5 px-3">কর্তা / ইউজার</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {audits.map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                        {new Date(a.timestamp).toLocaleString("bn-BD")}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-400">
                        {a.entityType}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {a.action}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        {a.notes}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                        {a.actorName} ({a.actorRole})
                      </td>
                    </tr>
                  ))}
                  {audits.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        কোনো অডিট লগ রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VENDORS */}
      {activeTab === "VENDORS" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
            <div className="flex-1 w-full md:w-auto">
              <input
                type="text"
                placeholder="ভেন্ডরের নাম, ফোন নম্বর বা কোড দিয়ে খুঁজুন..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={vendorCategoryFilter}
                onChange={(e) => setVendorCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">সকল ক্যাটাগরি</option>
                <option value="FOOD">খাদ্য ও নিত্যপণ্য</option>
                <option value="BOOKS">বই ও প্রকাশনা</option>
                <option value="STATIONERY">স্টেশনারি</option>
                <option value="CONSTRUCTION">নির্মাণ ও মেরামত</option>
                <option value="IT">কম্পিউটার ও আইটি</option>
                <option value="PLUMBING">প্লাম্বিং ও স্যানিটারি</option>
              </select>
              <select
                value={vendorStatusFilter}
                onChange={(e) => setVendorStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">সকল স্ট্যাটাস</option>
                <option value="ACTIVE">সক্রিয় (Active)</option>
                <option value="PENDING_VERIFICATION">যাচাই অপেক্ষমান</option>
                <option value="SUSPENDED">স্থগিত (Suspended)</option>
              </select>
              <button
                onClick={exportVendorsToCSV}
                className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap"
                title="ভেন্ডর তালিকা এক্সেলে ডাউনলোড করুন"
              >
                <Download className="w-3.5 h-3.5" />
                <span>এক্সেল / CSV</span>
              </button>
            </div>
          </div>

          {/* Vendors Grid / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-slate-900 text-slate-400 border border-slate-700 rounded text-xs font-mono">
                      {vendor.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-medium ${
                        vendor.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : vendor.status === "PENDING_VERIFICATION"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {vendor.status === "ACTIVE"
                        ? "সক্রিয়"
                        : vendor.status === "PENDING_VERIFICATION"
                        ? "যাচাই অপেক্ষমান"
                        : vendor.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {vendor.legalNameBn}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">{vendor.legalNameEn}</div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">ক্যাটাগরি:</span>
                      <span className="font-medium text-emerald-300">{vendor.categoryNameBn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">যোগাযোগ:</span>
                      <span>{vendor.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ঠিকানা:</span>
                      <span className="truncate max-w-[180px]">{vendor.addressBn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">অন-টাইম সরবরাহ হার:</span>
                      <span className="font-semibold text-emerald-400">
                        {vendor.ratingSummary.onTimeDeliveryRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ব্যাংক অ্যাকাউন্ট:</span>
                      <span className="font-mono text-slate-400">
                        {vendor.bankAccountNumberMasked || "সংযুক্ত নেই"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    অর্ডার: {vendor.ratingSummary.totalOrdersFulfilled}টি
                  </span>
                  <button
                    onClick={() => setSelectedVendor(vendor)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition-all"
                  >
                    বিস্তারিত ও যাচাইকরণ &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Vendor Details Modal */}
          {selectedVendor && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start border-b border-slate-700 pb-4 mb-4">
                  <div>
                    <span className="text-xs font-mono text-emerald-400">{selectedVendor.id}</span>
                    <h2 className="text-xl font-bold text-white mt-1">{selectedVendor.legalNameBn}</h2>
                    <p className="text-xs text-slate-400">{selectedVendor.addressBn}</p>
                  </div>
                  <button
                    onClick={() => setSelectedVendor(null)}
                    className="text-slate-400 hover:text-white text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-sm">
                  {/* Verification Status Box */}
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/80">
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <span>🛡️</span> প্রাতিষ্ঠানিক সত্যতা যাচাই (Verifications)
                    </h4>
                    <div className="space-y-2">
                      {selectedVendor.verifications.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-lg text-xs"
                        >
                          <div>
                            <div className="font-medium text-slate-200">{v.titleBn}</div>
                            <div className="text-slate-500">{v.notes || "কাগজপত্র জমা রয়েছে"}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                v.status === "VERIFIED"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : v.status === "PENDING"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-rose-500/20 text-rose-300"
                              }`}
                            >
                              {v.status}
                            </span>
                            {v.status === "PENDING" && (
                              <button
                                onClick={() => handleVerifyVendor(selectedVendor.id, v.id, "VERIFIED")}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px]"
                              >
                                অনুমোদন করুন
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact Persons */}
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/80">
                    <h4 className="font-semibold text-white mb-2">যোগাযোগকারী কর্মকর্তা</h4>
                    {selectedVendor.contacts.map((c) => (
                      <div key={c.id} className="text-xs text-slate-300 flex justify-between py-1">
                        <span>{c.name} ({c.designation})</span>
                        <span className="font-mono">{c.phone}</span>
                      </div>
                    ))}
                  </div>

                  {/* Registrations */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/40 p-4 rounded-xl border border-slate-700/60">
                    <div>
                      <span className="text-slate-400 block">ট্রেড লাইসেন্স নম্বর:</span>
                      <span className="font-mono text-slate-200">{selectedVendor.tradeLicenseNo || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">TIN নম্বর:</span>
                      <span className="font-mono text-slate-200">{selectedVendor.tinNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">ব্যাংক ও শাখা:</span>
                      <span className="text-slate-200">{selectedVendor.bankName} ({selectedVendor.bankBranch})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">হিসাব নম্বর (মাস্কড):</span>
                      <span className="font-mono text-slate-200">{selectedVendor.bankAccountNumberMasked || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedVendor(null)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RFQS & QUOTATIONS */}
      {activeTab === "RFQS" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">দরপত্র ও কোটেশন বিজ্ঞপ্তি তালিকা</h2>
            <button
              onClick={() => setShowNewRfqModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium"
            >
              + নতুন RFQ বিজ্ঞপ্তি প্রকাশ
            </button>
          </div>

          <div className="space-y-4">
            {rfqs.map((rfq) => (
              <div
                key={rfq.id}
                className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 hover:border-indigo-500/50 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 text-indigo-400 border border-slate-700 rounded text-xs font-mono">
                        {rfq.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          rfq.status === "AWARDED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : rfq.status === "OPEN"
                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {rfq.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{rfq.titleBn}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{rfq.descriptionBn}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedRfq(rfq);
                        fetchComparison(rfq.id);
                        setShowNewQuoteModal(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded text-xs font-medium"
                    >
                      + কোটেশন দাখিল
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRfq(rfq);
                        fetchComparison(rfq.id);
                      }}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium"
                    >
                      কোটেশন ও তুলনা দেখুন &rarr;
                    </button>
                  </div>
                </div>

                {/* Items preview */}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400">শেষ সময়:</span>{" "}
                    <span className="font-semibold text-rose-300">
                      {new Date(rfq.submissionDeadline).toLocaleDateString("bn-BD")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">আইটেম সংখ্যা:</span> {rfq.items.length}টি
                  </div>
                  <div>
                    <span className="text-slate-400">তহবিল:</span> {rfq.fundCode || "GENERAL"}
                  </div>
                </div>

                {/* Inline Comparison Drawer if selected */}
                {selectedRfq?.id === rfq.id && comparisonMatrix && (
                  <div className="mt-5 pt-4 border-t border-slate-700 bg-slate-900/60 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>📊</span> নিরপেক্ষ কোটেশন তুলনা ম্যাট্রিক্স (Factual Comparison)
                      </h4>
                      <span className="text-xs text-slate-400">
                        মোট কোটেশন: {comparisonMatrix.entries.length}টি
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-800 text-slate-400 uppercase">
                          <tr>
                            <th className="py-2 px-3">ভেন্ডর</th>
                            <th className="py-2 px-3">ভার্সন</th>
                            <th className="py-2 px-3">মোট উদ্ধৃত মূল্য (৳)</th>
                            <th className="py-2 px-3">ডেলিভারি সময়</th>
                            <th className="py-2 px-3">ওয়ারেন্টি</th>
                            <th className="py-2 px-3">অতীত নির্ভরযোগ্যতা</th>
                            <th className="py-2 px-3">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {comparisonMatrix.entries.map((entry) => (
                            <tr key={entry.quotationId} className="hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 font-semibold text-white">
                                {entry.vendorName}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-emerald-400">
                                v{entry.version}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-white">
                                ৳{entry.netTotalAmount.toLocaleString("bn-BD")}
                                {entry.netTotalAmount === comparisonMatrix.lowestPrice && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px]">
                                    সর্বনিম্ন
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                {entry.deliveryDays} দিন
                              </td>
                              <td className="py-2.5 px-3">
                                {entry.warrantyMonths} মাস
                              </td>
                              <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                                {entry.pastOnTimeRate}%
                              </td>
                              <td className="py-2.5 px-3">
                                {rfq.status !== "AWARDED" && (
                                  <button
                                    onClick={() => {
                                      setEvalForm({
                                        recommendedVendorId: entry.vendorId,
                                        recommendedQuotationId: entry.quotationId,
                                        justificationBn: `${entry.vendorName}-এর উদ্ধৃত মূল্য সাশ্রয়ী এবং পূর্ববর্তী সরবরাহের মান সন্তোষজনক।`,
                                      });
                                      setShowEvaluationModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px]"
                                  >
                                    সুপারিশ ও মূল্যায়ন
                                  </button>
                                )}
                                {rfq.status === "AWARDED" && rfq.awardedVendorId === entry.vendorId && (
                                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[11px] font-bold">
                                    কার্যাদেশপ্রাপ্ত
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pending Human Approval Evaluation */}
                    {selectedEvaluation && selectedEvaluation.decisionStatus === "PENDING_APPROVAL" && (
                      <div className="mt-4 p-3 bg-amber-950/40 border border-amber-500/50 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-bold text-amber-200">অধ্যক্ষ / কমিটির চূড়ান্ত অনুমোদন অপেক্ষমান:</span>{" "}
                          প্রস্তাবিত ভেন্ডর: <span className="text-white font-semibold">{selectedEvaluation.recommendedVendorName}</span> (যৌক্তিকতা: {selectedEvaluation.recommendationJustificationBn})
                        </div>
                        <button
                          onClick={() => handleApproveAward(selectedEvaluation.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs whitespace-nowrap"
                        >
                          চূড়ান্ত কার্যাদেশ অনুমোদন করুন
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONTRACTS */}
      {activeTab === "CONTRACTS" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">প্রাতিষ্ঠানিক চুক্তিপত্র ও সংস্করণ রেজিস্ট্রি</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={exportContractsToCSV}
                className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                title="সকল চুক্তিপত্র এক্সেলে ডাউনলোড করুন"
              >
                <Download className="w-3.5 h-3.5" />
                <span>এক্সেল / CSV</span>
              </button>
              <button
                onClick={() => setShowNewContractModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
              >
                + নতুন চুক্তি সম্পাদন
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 hover:border-emerald-500/50 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 text-emerald-400 border border-slate-700 rounded text-xs font-mono">
                        {contract.id}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-mono">
                        সংস্করণ: v{contract.currentVersion}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          contract.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : contract.status === "EXPIRING"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {contract.status}
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[11px] font-mono">
                        3-Way Match: {contract.threeWayMatchStatus}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{contract.titleBn}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">ভেন্ডর: {contract.vendorNameBn}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setContractToPrint(contract);
                        setShowContractPrintModal(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded text-xs font-medium flex items-center gap-1"
                      title="অফিসিয়াল চুক্তিপত্র প্রিন্ট করুন"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>চুক্তি প্রিন্ট</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContract(contract);
                        setRevisionForm({
                          changeReason: "",
                          newContractValue: contract.totalContractValue,
                          newEndDate: contract.endDate,
                          newPaymentTermsBn: contract.paymentTermsBn,
                        });
                        setShowReviseContractModal(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded text-xs font-medium"
                    >
                      + নতুন সংস্করণ সংশোধন (v{contract.currentVersion + 1})
                    </button>
                    <button
                      onClick={() => setSelectedContract(selectedContract?.id === contract.id ? null : contract)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium"
                    >
                      {selectedContract?.id === contract.id ? "সংক্ষেপ করুন" : "বিস্তারিত &rarr;"}
                    </button>
                  </div>
                </div>

                {/* Summary Info */}
                <div className="mt-3 flex flex-wrap gap-5 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400">মোট চুক্তি মূল্য:</span>{" "}
                    <span className="font-bold text-emerald-400">
                      ৳{contract.totalContractValue.toLocaleString("bn-BD")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">মেয়াদ:</span>{" "}
                    <span>
                      {contract.startDate} থেকে {contract.endDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">শর্তাবলী:</span> {contract.paymentTermsBn}
                  </div>
                </div>

                {/* Inline Contract Snapshots Drawer if open */}
                {selectedContract?.id === contract.id && (
                  <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
                    {/* Version Snapshots History */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                        অপরিবর্তনীয় সংস্করণ ইতিহাস (Immutable Version Snapshots)
                      </h4>
                      <div className="space-y-2">
                        {contract.versions.map((ver) => (
                          <div
                            key={ver.versionNumber}
                            className="p-2.5 bg-slate-800/80 rounded-lg text-xs flex justify-between items-center"
                          >
                            <div>
                              <span className="font-mono text-emerald-400 font-bold mr-2">
                                v{ver.versionNumber}
                              </span>
                              <span className="text-slate-200">{ver.changeReason}</span>
                              <span className="text-slate-500 text-[11px] block mt-0.5">
                                অনুমোদনে: {ver.approvedBy} ({new Date(ver.createdAt).toLocaleDateString("bn-BD")})
                              </span>
                            </div>
                            <span className="font-bold text-white">
                              ৳{ver.totalContractValue.toLocaleString("bn-BD")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deliverables */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                        ডেলিভারেবল ও মাইলস্টোন অগ্রগতি
                      </h4>
                      <div className="space-y-2">
                        {contract.deliverables.map((dlv) => (
                          <div
                            key={dlv.id}
                            className="p-2.5 bg-slate-800/80 rounded-lg text-xs flex justify-between items-center"
                          >
                            <div>
                              <span className="font-semibold text-white">{dlv.titleBn}</span>
                              <span className="text-slate-400 block">{dlv.milestoneDescription}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                dlv.isCompleted ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-400"
                              }`}
                            >
                              {dlv.isCompleted ? "সম্পন্ন" : "চলমান"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: RISK & CONFLICT */}
      {activeTab === "RISK" && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5">
            <h3 className="text-base font-bold text-white mb-2">
              সরবরাহ চেইন ঝুঁকি ও প্রাতিষ্ঠানিক স্বার্থের দ্বন্দ্ব নিয়ন্ত্রণ
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Supplier Risk Register, Sole-Source Mitigation, and Conflict-of-Interest Recusal Records
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700">
                <h4 className="text-sm font-semibold text-emerald-400 mb-2">
                  সাপ্লায়ার নির্ভরশীলতা ঝুঁকি নিরীক্ষা
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  লিল্লাহ বোর্ডিং খাদ্যশস্য এবং শিক্ষা কিতাব মুদ্রণের ক্ষেত্রে একক ভেন্ডর নির্ভরশীলতা দূর করতে একাধিক আঞ্চলিক সরবরাহকারী তালিকাভুক্ত রাখা হয়েছে।
                </p>
                <div className="mt-3 text-xs text-slate-400">
                  সর্বমোট তালিকাভুক্ত বিকল্প ভেন্ডর: ৫টি প্রতিষ্ঠান।
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700">
                <h4 className="text-sm font-semibold text-indigo-400 mb-2">
                  স্বার্থের দ্বন্দ্ব (Conflict of Interest) নীতিমালা
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  প্রকিউরমেন্ট মূল্যায়ন কমিটির কোনো সদস্যের নিকটাত্মীয় কোনো দরপত্রে অংশগ্রহণ করলে উক্ত সদস্য স্বয়ংক্রিয়ভাবে মূল্যায়ন প্রক্রিয়া থেকে বিরত (Recused) থাকেন।
                </p>
                <div className="mt-3 text-xs text-emerald-400 font-medium">
                  সকল ক্রয় কমিটি সদস্যদের হলফনামা নথিভুক্ত।
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW VENDOR */}
      {showNewVendorModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateVendor}
            className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4">
              <h3 className="text-lg font-bold text-white">নতুন ভেন্ডর নিবন্ধন (Onboarding)</h3>
              <button
                type="button"
                onClick={() => setShowNewVendorModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">ভেন্ডরের নাম (বাংলায়) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: কুমিল্লা মডার্ন প্রেস"
                  value={vendorForm.legalNameBn}
                  onChange={(e) => setVendorForm({ ...vendorForm, legalNameBn: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">ভেন্ডর ধরণ *</label>
                  <select
                    value={vendorForm.vendorType}
                    onChange={(e) => setVendorForm({ ...vendorForm, vendorType: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="SUPPLIER">সরবরাহকারী (Supplier)</option>
                    <option value="LOCAL_VENDOR">স্থানীয় বিক্রেতা (Local Vendor)</option>
                    <option value="CONTRACTOR">ঠিকাদার (Contractor)</option>
                    <option value="DISTRIBUTOR">ডিস্ট্রিবিউটর (Distributor)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">ক্যাটাগরি *</label>
                  <select
                    value={vendorForm.categoryCode}
                    onChange={(e) => setVendorForm({ ...vendorForm, categoryCode: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="BOOKS">বই ও প্রকাশনা</option>
                    <option value="FOOD">খাদ্য ও লিল্লাহ বোর্ডিং</option>
                    <option value="STATIONERY">স্টেশনারি</option>
                    <option value="CONSTRUCTION">নির্মাণ ও মেরামত</option>
                    <option value="IT">কম্পিউটার ও আইটি</option>
                    <option value="PLUMBING">প্লাম্বিং ও স্যানিটারি</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">ফোন নম্বর *</label>
                  <input
                    type="text"
                    required
                    placeholder="017xxxxxxxx"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">ইমেইল</label>
                  <input
                    type="email"
                    placeholder="vendor@example.com"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">ঠিকানা *</label>
                <input
                  type="text"
                  required
                  value={vendorForm.addressBn}
                  onChange={(e) => setVendorForm({ ...vendorForm, addressBn: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">ট্রেড লাইসেন্স নম্বর</label>
                  <input
                    type="text"
                    placeholder="TRAD/COM/2026/..."
                    value={vendorForm.tradeLicenseNo}
                    onChange={(e) => setVendorForm({ ...vendorForm, tradeLicenseNo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">ব্যাংক হিসাব নম্বর</label>
                  <input
                    type="text"
                    placeholder="হিসাব নম্বর প্রদান করুন"
                    value={vendorForm.bankAccountNumber}
                    onChange={(e) => setVendorForm({ ...vendorForm, bankAccountNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewVendorModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
              >
                নিবন্ধন সম্পন্ন করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: NEW RFQ */}
      {showNewRfqModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRfq}
            className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4">
              <h3 className="text-lg font-bold text-white">নতুন RFQ কোটেশন বিজ্ঞপ্তি প্রকাশ</h3>
              <button
                type="button"
                onClick={() => setShowNewRfqModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">কোটেশন বিজ্ঞপ্তির শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: হিফজ বিভাগের শিক্ষার্থীদের বার্ষিক খাতা মুদ্রণ"
                  value={rfqForm.titleBn}
                  onChange={(e) => setRfqForm({ ...rfqForm, titleBn: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">বিজ্ঞপ্তির বিবরণ ও শর্তাবলী *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="বিস্তারিত বিবরণ..."
                  value={rfqForm.descriptionBn}
                  onChange={(e) => setRfqForm({ ...rfqForm, descriptionBn: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">ক্যাটাগরি</label>
                  <select
                    value={rfqForm.categoryCode}
                    onChange={(e) => setRfqForm({ ...rfqForm, categoryCode: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="BOOKS">বই ও প্রকাশনা</option>
                    <option value="FOOD">খাদ্য ও নিত্যপণ্য</option>
                    <option value="STATIONERY">স্টেশনারি</option>
                    <option value="CONSTRUCTION">নির্মাণ ও মেরামত</option>
                    <option value="IT">কম্পিউটার ও আইটি</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">কোটেশন জমার শেষ তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={rfqForm.submissionDeadline}
                    onChange={(e) => setRfqForm({ ...rfqForm, submissionDeadline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              {/* Item Details */}
              <div className="p-3 bg-slate-900/60 rounded border border-slate-700 space-y-2">
                <span className="font-semibold text-indigo-400 block">পণ্যের বিবরণ</span>
                <input
                  type="text"
                  required
                  placeholder="পণ্যের নাম (উদা: ৮০ জিএসএম বাঁধাই খাতা)"
                  value={rfqForm.itemName}
                  onChange={(e) => setRfqForm({ ...rfqForm, itemName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="পরিমাণ"
                    value={rfqForm.itemQty}
                    onChange={(e) => setRfqForm({ ...rfqForm, itemQty: Number(e.target.value) })}
                    className="bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                  <input
                    type="text"
                    placeholder="একক (PCS)"
                    value={rfqForm.itemUnit}
                    onChange={(e) => setRfqForm({ ...rfqForm, itemUnit: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                  <input
                    type="number"
                    placeholder="টার্গেট বাজেট (৳)"
                    value={rfqForm.itemTargetBudget}
                    onChange={(e) => setRfqForm({ ...rfqForm, itemTargetBudget: Number(e.target.value) })}
                    className="bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewRfqModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
              >
                বিজ্ঞপ্তি প্রকাশ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: SUBMIT QUOTE */}
      {showNewQuoteModal && selectedRfq && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitQuote}
            className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6"
          >
            <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4">
              <h3 className="text-lg font-bold text-white">ভেন্ডর কোটেশন দাখিল</h3>
              <button
                type="button"
                onClick={() => setShowNewQuoteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">ভেন্ডর নির্বাচন করুন *</label>
                <select
                  required
                  value={quoteForm.vendorId}
                  onChange={(e) => setQuoteForm({ ...quoteForm, vendorId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                >
                  <option value="">-- ভেন্ডর নির্বাচন করুন --</option>
                  {vendors
                    .filter((v) => v.status === "ACTIVE")
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.legalNameBn} ({v.id})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">একক দর (৳) *</label>
                  <input
                    type="number"
                    required
                    value={quoteForm.unitPrice}
                    onChange={(e) => setQuoteForm({ ...quoteForm, unitPrice: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">সরবরাহের সময় (দিন) *</label>
                  <input
                    type="number"
                    required
                    value={quoteForm.deliveryDays}
                    onChange={(e) => setQuoteForm({ ...quoteForm, deliveryDays: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">ওয়ারেন্টি (মাস)</label>
                  <input
                    type="number"
                    value={quoteForm.warrantyMonths}
                    onChange={(e) => setQuoteForm({ ...quoteForm, warrantyMonths: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">কোটেশনের মেয়াদ</label>
                  <input
                    type="date"
                    value={quoteForm.validUntilDate}
                    onChange={(e) => setQuoteForm({ ...quoteForm, validUntilDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewQuoteModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
              >
                কোটেশন সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: RECORD EVALUATION */}
      {showEvaluationModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-white mb-2">কমিটি মূল্যায়ন ও ভেন্ডর সুপারিশ</h3>
            <p className="text-xs text-slate-400 mb-4">
              Authorized Committee Evaluation & Recommendation
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">সুপারিশের যৌক্তিকতা (বাংলায়) *</label>
                <textarea
                  rows={3}
                  value={evalForm.justificationBn}
                  onChange={(e) => setEvalForm({ ...evalForm, justificationBn: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
              >
                বাতিল
              </button>
              <button
                onClick={async () => {
                  if (!selectedRfq) return;
                  try {
                    const res = await fetch("/api/admin/procurement/evaluations", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        rfqId: selectedRfq.id,
                        recommendedVendorId: evalForm.recommendedVendorId,
                        recommendedQuotationId: evalForm.recommendedQuotationId,
                        recommendationJustificationBn: evalForm.justificationBn,
                        vendorScores: [],
                      }),
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.error);

                    setMessage({ type: "success", text: data.message });
                    setShowEvaluationModal(false);
                    fetchComparison(selectedRfq.id);
                  } catch (e: any) {
                    setMessage({ type: "error", text: e.message });
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
              >
                সুপারিশ সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REVISE CONTRACT VERSION */}
      {showReviseContractModal && selectedContract && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleReviseContract}
            className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4">
              <h3 className="text-lg font-bold text-white">
                চুক্তিপত্র সংশোধন (v{selectedContract.currentVersion + 1})
              </h3>
              <button
                type="button"
                onClick={() => setShowReviseContractModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">সংশোধনের প্রাতিষ্ঠানিক কারণ *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="যেমন: পরিধি বৃদ্ধি বা মূল্য সমন্বয়"
                  value={revisionForm.changeReason}
                  onChange={(e) => setRevisionForm({ ...revisionForm, changeReason: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">নতুন চুক্তি মূল্য (৳)</label>
                <input
                  type="number"
                  value={revisionForm.newContractValue}
                  onChange={(e) => setRevisionForm({ ...revisionForm, newContractValue: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">নতুন মেয়াদ শেষ তারিখ</label>
                <input
                  type="date"
                  value={revisionForm.newEndDate}
                  onChange={(e) => setRevisionForm({ ...revisionForm, newEndDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReviseContractModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
              >
                নতুন সংস্করণ সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: OFFICIAL INSTITUTIONAL CONTRACT PRINT PREVIEW */}
      {showContractPrintModal && contractToPrint && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 my-8 print:shadow-none print:border-none print:m-0 print:p-0 text-slate-900">
            {/* Modal Controls Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-[#0D5C3A] rounded-lg">
                  <Printer className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-800">
                  অফিসিয়াল প্রাতিষ্ঠানিক সরবরাহ ও চুক্তিপত্র (EHRJ Contract Form)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>চুক্তিপত্র প্রিন্ট করুন</span>
                </button>
                <button
                  onClick={() => setShowContractPrintModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Document */}
            <div className="p-6 sm:p-8 border-2 border-[#0D5C3A] rounded-2xl bg-[#FCFAF6] relative overflow-hidden mt-3 print:border-2 print:border-black print:m-0 print:p-6 print:rounded-none">
              {/* Header */}
              <div className="text-center pb-4 border-b-2 border-[#0D5C3A]/30">
                <p className="text-xs text-[#063320] font-serif mb-1 font-bold tracking-wider">
                  بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-[#041F14] font-display">
                  {INSTITUTION_INFO.nameBn}
                </h1>
                <p className="text-[11px] text-slate-700 font-medium">
                  {INSTITUTION_INFO.addressBn} • ফোন: {INSTITUTION_INFO.primaryPhone}
                </p>
                <p className="text-[10px] text-emerald-800 font-bold mt-0.5">
                  স্থাপিত: ২০২১ ইং (ESTD 2021) • প্রাতিষ্ঠানিক প্রকিউরমেন্ট, সরবরাহকারী ও চুক্তি নিয়ন্ত্রণ ব্যবস্থা
                </p>
                <div className="inline-flex items-center gap-2 bg-[#0D5C3A] text-white text-[11px] font-bold px-4 py-1 rounded-full mt-2 shadow-sm">
                  <span>দ্বিপাক্ষিক প্রাতিষ্ঠানিক চুক্তিপত্র (DEED OF AGREEMENT)</span>
                </div>
              </div>

              {/* Contract Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs py-4 border-b border-dashed border-slate-300">
                <div>
                  <p><span className="text-slate-500">চুক্তিপত্র নম্বর:</span> <strong className="font-mono text-emerald-800">{contractToPrint.id}</strong></p>
                  <p className="mt-1"><span className="text-slate-500">চুক্তির শিরোনাম:</span> <strong>{contractToPrint.titleBn}</strong></p>
                  <p className="mt-1"><span className="text-slate-500">চুক্তির ধরন:</span> <span className="font-semibold">{contractToPrint.contractType}</span> (সংস্করণ: v{contractToPrint.currentVersion})</p>
                </div>
                <div className="text-right">
                  <p><span className="text-slate-500">চুক্তি সম্পাদন মেয়াদ:</span> <strong>{contractToPrint.startDate} হতে {contractToPrint.endDate}</strong></p>
                  <p className="mt-1"><span className="text-slate-500">মোট চুক্তি মূল্য:</span> <strong className="font-mono text-base text-[#0D5C3A]">৳{contractToPrint.totalContractValue.toLocaleString("bn-BD")}</strong></p>
                  <p className="mt-1"><span className="text-slate-500">3-Way Match কমপ্লায়েন্স:</span> <span className="font-bold text-indigo-800">{contractToPrint.threeWayMatchStatus}</span></p>
                </div>
              </div>

              {/* Vendor & Entity Information */}
              <div className="my-4 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs space-y-1">
                <h4 className="font-bold text-emerald-950 text-sm mb-2">পক্ষদ্বয়ের পরিচয়:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-slate-900 block">১ম পক্ষ (প্রতিষ্ঠান):</span>
                    <span className="text-slate-700">{INSTITUTION_INFO.nameBn}</span>
                    <span className="text-slate-500 block text-[11px]">{INSTITUTION_INFO.addressBn}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">২য় পক্ষ (সরবরাহকারী / ভেন্ডর):</span>
                    <span className="text-slate-700 font-semibold">{contractToPrint.vendorNameBn}</span>
                    <span className="text-slate-500 block text-[11px]">আইডি: {contractToPrint.vendorId}</span>
                  </div>
                </div>
              </div>

              {/* Deliverables / Scope */}
              <div className="my-4">
                <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wide">
                  সরবরাহ / কাজের পরিধি ও মাইলস্টোন (Deliverables):
                </h4>
                <div className="border rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b text-[10px] text-slate-600 font-bold uppercase">
                      <tr>
                        <th className="p-2.5">মাইলস্টোন / ডেলিভারেবল</th>
                        <th className="p-2.5">বিবরণ</th>
                        <th className="p-2.5 text-center">অবস্থা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-[11px]">
                      {contractToPrint.deliverables.map((d) => (
                        <tr key={d.id}>
                          <td className="p-2.5 font-bold text-slate-900">{d.titleBn}</td>
                          <td className="p-2.5 text-slate-600">{d.milestoneDescription}</td>
                          <td className="p-2.5 text-center font-semibold">
                            {d.isCompleted ? (
                              <span className="text-emerald-700">সম্পন্ন</span>
                            ) : (
                              <span className="text-amber-700">চলমান</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 block mb-1">বিল ও পরিশোধের শর্তাবলী:</span>
                <p className="text-slate-600 leading-relaxed">{contractToPrint.paymentTermsBn}</p>
              </div>

              {/* Dual Signatures */}
              <div className="pt-10 flex items-end justify-between text-xs text-slate-700">
                <div className="text-center">
                  <div className="w-40 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] font-bold text-slate-800 block">ভেন্ডর / সরবরাহকারী প্রতিনিধি</span>
                  <span className="text-[9px] text-slate-500 block">{contractToPrint.vendorNameBn}</span>
                  <span className="text-[8px] text-slate-400">স্বাক্ষর ও প্রাতিষ্ঠানিক সীল</span>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] font-bold text-slate-800 block">{INSTITUTION_INFO.principal}</span>
                  <span className="text-[9px] text-slate-500 block">মুহতামিম / অধ্যক্ষ</span>
                  <span className="text-[8px] text-slate-400">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা</span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[10px] text-slate-400 pt-6 mt-4 border-t border-slate-200">
                এই চুক্তিপত্রটি ডিজিটাল প্রকিউরমেন্ট নীতিমালার অধীনে প্রস্তুতকৃত এবং মাদরাসা গভর্নিং বডি দ্বারা সংরক্ষিত।
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
