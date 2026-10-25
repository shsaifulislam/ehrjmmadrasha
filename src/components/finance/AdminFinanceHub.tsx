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
  Printer,
  RefreshCw,
  Briefcase,
  Check,
  Trash2,
  X,
  CreditCard,
  Download,
  QrCode,
  Edit3,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Copy,
  Sparkles,
  ShieldCheck,
  Zap,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import OfficialReceiptModal, { ReceiptData } from "@/components/finance/OfficialReceiptModal";


interface AdminFinanceHubProps {
  initialOpenTxModal?: boolean;
}

export default function AdminFinanceHub({ initialOpenTxModal = false }: AdminFinanceHubProps = {}) {
  const [activeSubTab, setActiveSubTab] = useState<
    | "OVERVIEW"
    | "QUICK_COUNTER"
    | "STRUCTURES"
    | "INVOICES"
    | "MONTHLY_BILLING"
    | "PAYMENTS"
    | "CASHBOOK"
    | "TRANSACTIONS"
    | "PAYMENT_METHODS"
    | "ASSISTANCE"
    | "SCHOLARSHIPS"
    | "PAYROLL"
  >(initialOpenTxModal ? "TRANSACTIONS" : "OVERVIEW");

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
  const [staffList, setStaffList] = useState<any[]>([]);
  const [payrollMonth, setPayrollMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
  const [payrollStatusFilter, setPayrollStatusFilter] = useState<"ALL" | "PAID" | "APPROVED" | "DRAFT">("ALL");
  const [payrollSearch, setPayrollSearch] = useState("");
  const [payrollSummary, setPayrollSummary] = useState<any>({ totalNetSalary: 0, totalPaid: 0, totalPending: 0, totalCount: 0 });
  const [payrollFunds, setPayrollFunds] = useState<any[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  // Selected filters
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("ALL");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");

  // Payment Methods Console State
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any | null>(null);
  const [methodForm, setMethodForm] = useState({
    type: "BKASH",
    nameBn: "",
    accountNumber: "",
    accountType: "MERCHANT",
    bankName: "",
    branchName: "",
    accountHolderName: "",
    routingNumber: "",
    instructions: "",
    isEnabled: true,
    apiMode: "SANDBOX",
    apiKey: "",
    apiSecret: "",
    merchantId: "",
  });

  // Quick Spot Fee Counter State
  const [quickStudentSearch, setQuickStudentSearch] = useState("");
  const [quickStudentsList, setQuickStudentsList] = useState<any[]>([]);
  const [searchingQuickStudents, setSearchingQuickStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentPendingInvoices, setStudentPendingInvoices] = useState<any[]>([]);
  const [loadingStudentInvoices, setLoadingStudentInvoices] = useState(false);
  const [quickFeeMode, setQuickFeeMode] = useState<"INVOICES" | "SPOT">("INVOICES");
  const [spotFeeForm, setSpotFeeForm] = useState({
    feeType: "MONTHLY",
    title: "",
    amount: "",
    paymentMethod: "CASH",
    transactionId: "",
    notes: "",
  });
  const [submittingQuickFee, setSubmittingQuickFee] = useState(false);

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

  // Official Receipt Modal State
  const [selectedReceiptData, setSelectedReceiptData] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [showTxModal, setShowTxModal] = useState(initialOpenTxModal);

  useEffect(() => {
    if (initialOpenTxModal) {
      setShowTxModal(true);
      setActiveSubTab("TRANSACTIONS");
    }
  }, [initialOpenTxModal]);
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
    employeeId: "",
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    baseSalary: "",
    allowances: "0",
    deductions: "0",
    advanceDeduction: "0",
    paymentMethod: "CASH",
    fundCode: "GENERAL",
    notes: "",
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
        const curr = sessData.sessions.find((s: any) => s.isCurrent || s.status === "ACTIVE" || s.isActive) || sessData.sessions[0];
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
    if (activeSubTab === "PAYROLL") fetchPayrolls(payrollMonth);
    if (activeSubTab === "PAYMENT_METHODS") fetchPaymentMethods();
  }, [activeSubTab, selectedSessionId, selectedClassId, payrollMonth, invoiceStatusFilter, paymentMethodFilter]);

  const fetchPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const res = await fetch("/api/admin/finance/payment-methods");
      const data = await res.json();
      if (data.methods) setPaymentMethods(data.methods);
    } catch (err) {
      console.error("Failed to load payment methods", err);
    } finally {
      setLoadingMethods(false);
    }
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...methodForm,
        id: editingMethod?.id,
      };
      const res = await fetch("/api/admin/finance/payment-methods", {
        method: editingMethod ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: editingMethod ? "পেমেন্ট মাধ্যম সফলভাবে আপডেট হয়েছে!" : "নতুন পেমেন্ট মাধ্যম সফলভাবে যুক্ত হয়েছে!", type: "success" });
        setShowMethodModal(false);
        setEditingMethod(null);
        fetchPaymentMethods();
      } else {
        setMsg({ text: data.error || "পেমেন্ট মাধ্যম সংরক্ষণে ত্রুটি", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    }
  };

  const handleToggleMethod = async (method: any) => {
    try {
      const res = await fetch("/api/admin/finance/payment-methods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: method.id, isEnabled: !method.isEnabled }),
      });
      if (res.ok) {
        fetchPaymentMethods();
      }
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const handleDeleteMethod = async (id: string, name: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${name}" পেমেন্ট মেথডটি মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch(`/api/admin/finance/payment-methods?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: "পেমেন্ট মাধ্যম মুছে ফেলা হয়েছে!", type: "success" });
        fetchPaymentMethods();
      } else {
        setMsg({ text: data.error || "মুছে ফেলা সম্ভব হয়নি", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    }
  };

  // Quick Spot Fee Counter Handlers
  const handleSearchQuickStudents = async (query: string) => {
    setQuickStudentSearch(query);
    if (!query.trim() || query.length < 1) {
      setQuickStudentsList([]);
      return;
    }
    setSearchingQuickStudents(true);
    try {
      const res = await fetch(`/api/admin/students?q=${encodeURIComponent(query)}&take=10`);
      const data = await res.json();
      if (data.students) setQuickStudentsList(data.students);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingQuickStudents(false);
    }
  };

  const handleSelectQuickStudent = async (student: any) => {
    setSelectedStudent(student);
    setQuickStudentsList([]);
    setQuickStudentSearch(`${student.fullNameBn || student.fullNameEn} (${student.studentIdNumber || ""})`);
    setLoadingStudentInvoices(true);
    try {
      const res = await fetch(`/api/admin/finance/invoices?studentId=${student.id}&status=UNPAID,PARTIALLY_PAID`);
      const data = await res.json();
      if (data.invoices) {
        setStudentPendingInvoices(data.invoices);
        if (data.invoices.length > 0) {
          setQuickFeeMode("INVOICES");
        } else {
          setQuickFeeMode("SPOT");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudentInvoices(false);
    }
  };

  const handleQuickSpotFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setMsg({ text: "অনুগ্রহ করে শিক্ষার্থী নির্বাচন করুন", type: "error" });
      return;
    }
    if (!spotFeeForm.amount || Number(spotFeeForm.amount) <= 0) {
      setMsg({ text: "টাকার পরিমাণ সঠিকভাবে দিন", type: "error" });
      return;
    }

    setSubmittingQuickFee(true);
    try {
      const res = await fetch("/api/admin/finance/quick-collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          feeType: spotFeeForm.feeType,
          title: spotFeeForm.title || "তাৎক্ষণিক ফি কালেকশন",
          amount: Number(spotFeeForm.amount),
          paymentMethod: spotFeeForm.paymentMethod,
          transactionId: spotFeeForm.transactionId,
          notes: spotFeeForm.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: "তাৎক্ষণিক ফি সফলভাবে আদায় হয়েছে ও রসিদ তৈরি হয়েছে!", type: "success" });
        if (data.receipt) {
          setSelectedReceiptData(data.receipt);
          setShowReceiptModal(true);
        }
        // Reset form
        setSpotFeeForm({
          feeType: "MONTHLY",
          title: "",
          amount: "",
          paymentMethod: "CASH",
          transactionId: "",
          notes: "",
        });
        if (selectedStudent) {
          handleSelectQuickStudent(selectedStudent);
        }
      } else {
        setMsg({ text: data.error || "ফি আদায়ে ত্রুটি ঘটেছে", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    } finally {
      setSubmittingQuickFee(false);
    }
  };

  const handlePayExistingPendingInvoice = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentForm({
      amount: String(inv.amount - inv.paidAmount),
      paymentMethod: "CASH",
      transactionId: "",
      notes: "কাউন্টার থেকে আদায়",
    });
    setShowPaymentModal(true);
  };

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
      if (invoiceStatusFilter && invoiceStatusFilter !== "ALL") url += `&status=${invoiceStatusFilter}`;
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
      let url = "/api/admin/finance/payments";
      const params: string[] = [];
      if (paymentMethodFilter && paymentMethodFilter !== "ALL") params.push(`paymentMethod=${paymentMethodFilter}`);
      if (paymentSearch) params.push(`search=${encodeURIComponent(paymentSearch)}`);
      if (params.length > 0) url += `?${params.join("&")}`;
      const res = await fetch(url);
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

  const fetchPayrolls = async (targetMonth = payrollMonth) => {
    try {
      const res = await fetch(`/api/admin/finance/payroll?month=${targetMonth}`);
      const data = await res.json();
      if (data.payrolls) setPayrolls(data.payrolls);
      if (data.staffList) setStaffList(data.staffList);
      if (data.teachers) setTeachers(data.teachers);
      if (data.funds) setPayrollFunds(data.funds);
      if (data.summary) setPayrollSummary(data.summary);
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
        if (data.receipt) {
          const enrollment = selectedInvoice.student?.enrollments?.[0];
          setSelectedReceiptData({
            receiptNumber: data.receipt.receiptNumber,
            invoiceNumber: data.invoice?.invoiceNumber || selectedInvoice.invoiceNumber,
            receiptDate: data.receipt.receiptDate || new Date().toISOString(),
            studentIdNumber: selectedInvoice.student?.studentIdNumber || "",
            studentNameBn: selectedInvoice.student?.fullNameBn || "শিক্ষার্থী",
            className: enrollment?.jamatClass?.nameBn || "মাদরাসা শাখা",
            sectionName: enrollment?.section?.nameBn,
            rollNumber: enrollment?.rollNumber || "—",
            title: selectedInvoice.title || "একাডেমিক ফি",
            amount: Number(paymentForm.amount),
            paymentMethod: paymentForm.paymentMethod,
            transactionId: paymentForm.transactionId,
            receivedBy: "হিসাব বিভাগ",
            qrCodeToken: data.receipt.qrCodeToken,
          });
          setShowReceiptModal(true);
        }
        fetchInvoices();
        fetchInitialData();
      } else {
        setMsg({ text: data.error || "পেমেন্ট ব্যর্থ", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    }
  };

  const exportInvoicesToCSV = () => {
    if (!invoices || invoices.length === 0) {
      alert("কোনো ইনভয়েস তথ্য পাওয়া যায়নি।");
      return;
    }
    const headers = ["ইনভয়েস নং", "শিক্ষার্থীর নাম", "আইডি", "ফি টাইপ", "বিবরণ", "মোট ধার্য (টাকা)", "পরিশোধিত", "বকেয়া", "স্ট্যাটাস"];
    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      `"${(inv.student?.fullNameBn || "").replace(/"/g, '""')}"`,
      inv.student?.studentIdNumber || "",
      inv.feeType || "",
      `"${(inv.title || "").replace(/"/g, '""')}"`,
      inv.netAmount,
      inv.paidAmount,
      inv.dueAmount,
      inv.status,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `EHRJ_Invoices_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPaymentsToCSV = () => {
    if (!payments || payments.length === 0) {
      alert("কোনো পেমেন্ট তথ্য পাওয়া যায়নি।");
      return;
    }
    const headers = ["রসিদ নং", "তারিখ", "শিক্ষার্থীর নাম", "আইডি", "রোল", "জামাত", "ইনভয়েস নং", "ফি বিবরণ", "পেমেন্ট মাধ্যম", "পরিমাণ (টাকা)"];
    const rows = payments.map((p) => {
      const enrollment = p.student?.enrollments?.[0];
      return [
        p.receiptNumber,
        new Date(p.receiptDate).toLocaleDateString("bn-BD"),
        `"${(p.student?.fullNameBn || "").replace(/"/g, '""')}"`,
        p.student?.studentIdNumber || "",
        enrollment?.rollNumber || "",
        `"${(enrollment?.jamatClass?.nameBn || "").replace(/"/g, '""')}"`,
        p.invoice?.invoiceNumber || "",
        `"${(p.invoice?.title || "").replace(/"/g, '""')}"`,
        p.paymentMethod || "",
        p.amount,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `EHRJ_Payment_Receipts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const handleSelectStaffForPayroll = (identifier: string) => {
    const found = staffList.find((s) => s.id === identifier || s.userId === identifier || s.employeeId === identifier);
    if (found) {
      setPayrollForm((prev) => ({
        ...prev,
        userId: found.userId || found.id,
        employeeId: found.employeeId || "",
        baseSalary: found.baseSalary ? String(found.baseSalary) : prev.baseSalary,
      }));
    } else {
      setPayrollForm((prev) => ({ ...prev, userId: identifier }));
    }
  };

  const handleSavePayroll = async (action: "DRAFT" | "APPROVE" | "PAY") => {
    if (!payrollForm.userId) {
      setMsg({ text: "অনুগ্রহ করে শিক্ষক বা স্টাফ নির্বাচন করুন।", type: "error" });
      return;
    }
    if (!payrollForm.baseSalary || Number(payrollForm.baseSalary) <= 0) {
      setMsg({ text: "সঠিক মূল বেতনের পরিমাণ লিখুন।", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/admin/finance/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payrollForm,
          baseSalary: Number(payrollForm.baseSalary),
          allowances: Number(payrollForm.allowances) || 0,
          deductions: Number(payrollForm.deductions) || 0,
          advanceDeduction: Number(payrollForm.advanceDeduction) || 0,
          action,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message, type: "success" });
        fetchPayrolls(payrollMonth);
        fetchInitialData();
      } else {
        setMsg({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPayVoucher = async (voucher: any) => {
    const staffName = voucher.employee?.nameBn || voucher.user?.name || "কর্মীর";
    if (!confirm(`${staffName}-এর ${voucher.month} মাসের বেতন ৳ ${voucher.netSalary} পরিশোধ করতে চান?`)) return;
    try {
      setLoading(true);
      const res = await fetch("/api/admin/finance/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: voucher.userId,
          employeeId: voucher.employeeId,
          month: voucher.month,
          baseSalary: voucher.baseSalary,
          allowances: voucher.allowances,
          deductions: voucher.deductions,
          advanceDeduction: voucher.advanceDeduction,
          paymentMethod: voucher.paymentMethod || "CASH",
          fundCode: voucher.fundCode || "GENERAL",
          action: "PAY",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message, type: "success" });
        fetchPayrolls(payrollMonth);
        fetchInitialData();
      } else {
        setMsg({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayroll = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই খসড়া বেতন ভাউচারটি মুছে ফেলতে চান?")) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/finance/payroll?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message, type: "success" });
        fetchPayrolls(payrollMonth);
      } else {
        setMsg({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const formatBanglaCurrency = (num: number) => {
    return Number(num || 0).toLocaleString("bn-BD");
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
          { key: "QUICK_COUNTER", label: "⚡ দ্রুত ফি আদায় (Counter)" },
          { key: "STRUCTURES", label: "ফি কাঠামো" },
          { key: "INVOICES", label: "ইনভয়েস তালিকা" },
          { key: "MONTHLY_BILLING", label: "মাসিক বিল জেনারেশন" },
          { key: "PAYMENTS", label: "পেমেন্ট ও রসিদ" },
          { key: "CASHBOOK", label: "দৈনিক ক্যাশবুক" },
          { key: "TRANSACTIONS", label: "আয়/ব্যয় ভাউচার" },
          { key: "PAYMENT_METHODS", label: "💳 পেমেন্ট গেটওয়ে / মাধ্যম" },
          { key: "ASSISTANCE", label: "আর্থিক সহায়তা ও মওকুফ" },
          { key: "SCHOLARSHIPS", label: "মেধাবৃত্তি" },
          { key: "PAYROLL", label: "শিক্ষক/কর্মী বেতন" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            className={`px-3.5 py-2 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
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
            <div className="flex items-center gap-2">
              <button
                onClick={exportInvoicesToCSV}
                className="bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                title="সকল ইনভয়েস এক্সেলে ডাউনলোড করুন"
              >
                <Download className="w-3.5 h-3.5" />
                <span>এক্সেল / CSV</span>
              </button>
              <button
                onClick={fetchInvoices}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold"
              >
                রিফ্রেশ
              </button>
            </div>
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
            <div className="flex items-center gap-2">
              <button
                onClick={exportPaymentsToCSV}
                className="bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                title="সকল আদায়কৃত রসিদ এক্সেলে ডাউনলোড করুন"
              >
                <Download className="w-3.5 h-3.5" />
                <span>রসিদ তালিকা এক্সেল / CSV</span>
              </button>
              <button onClick={fetchPayments} className="text-xs text-[#0D5C3A] font-semibold hover:underline">
                রিফ্রেশ
              </button>
            </div>
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const enrollment = p.student?.enrollments?.[0];
                            setSelectedReceiptData({
                              receiptNumber: p.receiptNumber,
                              invoiceNumber: p.invoice?.invoiceNumber,
                              receiptDate: p.receiptDate,
                              studentIdNumber: p.student?.studentIdNumber || "",
                              studentNameBn: p.student?.fullNameBn || "",
                              className: enrollment?.jamatClass?.nameBn || "মাদরাসা বিভাগ",
                              sectionName: enrollment?.section?.nameBn,
                              rollNumber: enrollment?.rollNumber || "—",
                              title: p.invoice?.title || "একাডেমিক ফি",
                              amount: p.amount,
                              paymentMethod: p.paymentMethod,
                              transactionId: p.transactionId,
                              receivedBy: "হিসাব বিভাগ",
                              qrCodeToken: p.qrCodeToken,
                            });
                            setShowReceiptModal(true);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-200 text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition"
                          title="অফিসিয়াল রসিদ প্রিন্ট করুন"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>রসিদ</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPayment(p);
                            setRefundForm({ amount: String(p.amount), reason: "", refundMethod: "CASH" });
                            setShowRefundModal(true);
                          }}
                          className="text-red-600 hover:text-red-800 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>রিফান্ড</span>
                        </button>
                      </div>
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
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>দরিদ্র ও এতিম ছাত্র আর্থিক সহায়তা ও মুহতামিম কনসেশন</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  স্বয়ংক্রিয় সিঙ্কড
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                মুহতামিম কর্তৃক নির্ধারিত কাস্টম বেতন, লিল্লাহ ১০০% ফ্রি বৃত্তি ও সাধারণ ছাড়ের পূর্ণাঙ্গ রেজিস্টার।
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-gray-500" />
                প্রিন্ট রিপোর্ট
              </button>
              <button
                onClick={fetchAssistances}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                রিফ্রেশ
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <div className="text-[11px] text-gray-500">মোট কনসেশন রেকর্ড</div>
              <div className="text-lg font-bold text-gray-900">{assistances.length} টি</div>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
              <div className="text-[11px] text-emerald-700 font-medium">নিবন্ধিত এতিম শিক্ষার্থী</div>
              <div className="text-lg font-bold text-emerald-800">
                {assistances.filter((a) => a.isOrphan || a.student?.isOrphan).length} জন
              </div>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
              <div className="text-[11px] text-blue-700 font-medium">১০০% পূর্ণ ফ্রি বৃত্তি</div>
              <div className="text-lg font-bold text-blue-800">
                {assistances.filter((a) => a.waiverPercentage === 100 && a.status === "APPROVED").length} জন
              </div>
            </div>
            <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200">
              <div className="text-[11px] text-purple-700 font-medium">আংশিক / কাস্টম ফি ছাড়</div>
              <div className="text-lg font-bold text-purple-800">
                {assistances.filter((a) => a.waiverPercentage > 0 && a.waiverPercentage < 100 && a.status === "APPROVED").length} জন
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b text-gray-600">
                <tr>
                  <th className="p-3">শিক্ষার্থী ও জামাত</th>
                  <th className="p-3">কারণ / নথিসূত্র</th>
                  <th className="p-3">এতিম স্ট্যাটাস</th>
                  <th className="p-3">মওকুফ হার / কাস্টম ফি</th>
                  <th className="p-3">অনুমোদন উৎস ও স্ট্যাটাস</th>
                  <th className="p-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assistances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">
                      কোনো আর্থিক সহায়তা বা ছাড়ের রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  assistances.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/80">
                      <td className="p-3 font-semibold text-gray-900">
                        <div>{a.student?.fullNameBn || "শিক্ষার্থী"}</div>
                        <div className="text-[11px] text-gray-500 font-normal">
                          আইডি: {a.student?.studentIdNumber || "N/A"}
                          {a.student?.enrollments?.[0]?.jamatClass?.nameBn && (
                            <span className="ml-1 text-emerald-700 font-medium">
                              • {a.student.enrollments[0].jamatClass.nameBn}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 max-w-[200px]">
                        <div className="text-gray-800 line-clamp-2">{a.reason || "অসচ্ছলতা"}</div>
                        {a.familyCondition && (
                          <div className="text-[10px] text-gray-500 mt-0.5">{a.familyCondition}</div>
                        )}
                      </td>
                      <td className="p-3">
                        {a.isOrphan || a.student?.isOrphan ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            ★ এতিম (লিল্লাহ ফান্ড)
                          </span>
                        ) : (
                          <span className="text-gray-500">সাধারণ</span>
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        <div className="font-bold text-emerald-700 text-sm">
                          {a.waiverPercentage === 100 ? "১০০% ফুল-ফ্রি" : `${a.waiverPercentage}% ছাড়`}
                        </div>
                        {a.waiverAmount > 0 && (
                          <div className="text-[10px] text-gray-600">
                            মওকুফ অংক: ৳ {a.waiverAmount.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              a.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : a.status === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {a.status === "APPROVED"
                              ? "অনুমোদিত"
                              : a.status === "REJECTED"
                              ? "প্রত্যাখ্যাত"
                              : "বিবেচনাধীন"}
                          </span>
                          {a.status === "APPROVED" && (
                            <span className="text-[10px] text-emerald-700 font-medium">
                              মুহতামিম ডেস্ক সিঙ্কড
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {a.status === "PENDING" && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleAssistanceDecision(a.id, "APPROVE", 100)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold shadow-xs"
                            >
                              ১০০% অনুমোদন
                            </button>
                            <button
                              onClick={() => handleAssistanceDecision(a.id, "APPROVE", 50)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px] font-bold shadow-xs"
                            >
                              ৫০% অনুমোদন
                            </button>
                            <button
                              onClick={() => handleAssistanceDecision(a.id, "REJECT")}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[10px] font-bold shadow-xs"
                            >
                              বাতিল
                            </button>
                          </div>
                        )}
                        {a.status === "APPROVED" && (
                          <span className="text-[11px] text-gray-400 font-medium">কার্যকর রয়েছে</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
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
        <div className="space-y-6">
          {/* PAYROLL KPI STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">মোট নির্ধারিত বেতন ({payrollMonth})</p>
                <h4 className="text-xl font-bold text-gray-900 mt-1">৳ {formatBanglaCurrency(payrollSummary.totalNetSalary)}</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">মোট ভাউচার: {payrollSummary.totalCount} টি</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">পরিশোধিত বেতন</p>
                <h4 className="text-xl font-bold text-[#0D5C3A] mt-1">৳ {formatBanglaCurrency(payrollSummary.totalPaid)}</h4>
                <p className="text-[11px] text-emerald-600 mt-0.5">তহবিল থেকে ছাড়কৃত</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-[#0D5C3A] flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">বকেয়া / খসড়া বেতন</p>
                <h4 className="text-xl font-bold text-amber-600 mt-1">৳ {formatBanglaCurrency(payrollSummary.totalPending)}</h4>
                <p className="text-[11px] text-amber-600 mt-0.5">অনুমোদন বা বিতরণ বাকি</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">সাধারণ তহবিল ব্যালেন্স</p>
                <h4 className="text-xl font-bold text-indigo-700 mt-1">
                  ৳ {formatBanglaCurrency(funds.find((f) => f.code === "GENERAL")?.currentBalance || 0)}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">ক্যাশ বা ব্যাংক স্থিতি</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* SALARY CREATION & DISBURSEMENT PANEL */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#0D5C3A]" />
                  নতুন বেতন স্লিপ নির্ধারণ ও অনুমোদন
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  উস্তাদ ও কর্মকর্তা-কর্মচারীদের মাসিক মূল বেতন, বাড়িভাড়া/চিকিৎসা ভাতা, সাধারণ কর্তন ও অগ্রিম সমন্বয় হিসাব
                </p>
              </div>

              {/* Month Selector */}
              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border">
                <span className="text-xs font-semibold text-gray-600 pl-2">বেতন মাস:</span>
                <input
                  type="month"
                  value={payrollMonth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPayrollMonth(val);
                    setPayrollForm((prev) => ({ ...prev, month: val }));
                    fetchPayrolls(val);
                  }}
                  className="p-1 text-xs border rounded bg-white font-mono font-semibold"
                />
                <button
                  type="button"
                  onClick={() => {
                    const now = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
                    setPayrollMonth(now);
                    setPayrollForm((prev) => ({ ...prev, month: now }));
                    fetchPayrolls(now);
                  }}
                  className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded font-medium text-gray-700"
                >
                  বর্তমান মাস
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* Staff Select */}
              <div className="md:col-span-2">
                <label className="block font-semibold mb-1 text-gray-700">শিক্ষক / কর্মকর্তা-কর্মচারী *</label>
                <select
                  value={payrollForm.userId || payrollForm.employeeId}
                  onChange={(e) => handleSelectStaffForPayroll(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white font-medium focus:ring-1 focus:ring-[#0D5C3A]"
                >
                  <option value="">কর্মকর্তা বা শিক্ষক নির্বাচন করুন</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} — {st.designation} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Base Salary */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">মূল বেতন (৳) *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={payrollForm.baseSalary}
                  onChange={(e) => setPayrollForm({ ...payrollForm, baseSalary: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white font-mono font-bold"
                />
              </div>

              {/* Allowances */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">ভাতা (বাড়ি/চিকিৎসা) ৳</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={payrollForm.allowances}
                  onChange={(e) => setPayrollForm({ ...payrollForm, allowances: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white font-mono text-emerald-700 font-semibold"
                />
              </div>

              {/* Deductions */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">সাধারণ কর্তন (৳)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={payrollForm.deductions}
                  onChange={(e) => setPayrollForm({ ...payrollForm, deductions: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white font-mono text-red-600 font-semibold"
                />
              </div>

              {/* Advance Deductions */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">অগ্রিম বেতন সমন্বয় (৳)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={payrollForm.advanceDeduction}
                  onChange={(e) => setPayrollForm({ ...payrollForm, advanceDeduction: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white font-mono text-amber-700 font-semibold"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">পরিশোধের মাধ্যম</label>
                <select
                  value={payrollForm.paymentMethod}
                  onChange={(e) => setPayrollForm({ ...payrollForm, paymentMethod: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white font-medium"
                >
                  <option value="CASH">ক্যাশ (CASH)</option>
                  <option value="BANK">ব্যাংক স্থানান্তর (BANK)</option>
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="NAGAD">নগদ (Nagad)</option>
                </select>
              </div>

              {/* Cash Fund */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">পরিশোধের তহবিল</label>
                <select
                  value={payrollForm.fundCode}
                  onChange={(e) => setPayrollForm({ ...payrollForm, fundCode: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white font-medium"
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.code}>
                      {f.nameBn || f.name || f.code} (স্থিতি: ৳ {formatBanglaCurrency(f.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block font-semibold mb-1 text-gray-700">মন্তব্য / রেফারেন্স</label>
                <input
                  type="text"
                  placeholder="যেমন: মার্চ মাসের নিয়মিত বেতন ও বার্ষিক উৎসব সম্মানী..."
                  value={payrollForm.notes}
                  onChange={(e) => setPayrollForm({ ...payrollForm, notes: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white"
                />
              </div>

              {/* Real-time Calculation Summary & Actions */}
              <div className="md:col-span-2 flex items-center justify-between bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
                <div>
                  <span className="text-[11px] text-gray-600 block">প্রদেয় নিট বেতন:</span>
                  <span className="text-lg font-black text-[#0D5C3A] font-mono">
                    ৳ {formatBanglaCurrency(
                      Math.max(
                        0,
                        (Number(payrollForm.baseSalary) || 0) +
                          (Number(payrollForm.allowances) || 0) -
                          (Number(payrollForm.deductions) || 0) -
                          (Number(payrollForm.advanceDeduction) || 0)
                      )
                    )}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 text-right">
                  <span>ভাতা: +৳ {Number(payrollForm.allowances) || 0}</span>
                  <br />
                  <span>কর্তন: -৳ {(Number(payrollForm.deductions) || 0) + (Number(payrollForm.advanceDeduction) || 0)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSavePayroll("DRAFT")}
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                খসড়া সংরক্ষণ (DRAFT)
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSavePayroll("APPROVE")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                অনুমোদন করুন (APPROVE)
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSavePayroll("PAY")}
                className="bg-[#0D5C3A] hover:bg-[#0b4b2f] text-white px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5" />
                তাৎক্ষণিক বেতন প্রদান ও তহবিল আপডেট (PAY)
              </button>
            </div>
          </div>

          {/* VOUCHERS LIST TABLE */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {payrollMonth} মাসের বেতন ভাউচার ও পে-রোল রেজিস্টার
                </h3>
                <p className="text-xs text-gray-500">অনুমোদিত ও পরিশোধিত বেতন ভাউচারসমূহ এবং প্রিন্ট স্লিপ</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="নাম বা ভাউচার খুঁজুন..."
                    value={payrollSearch}
                    onChange={(e) => setPayrollSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex rounded-lg border bg-gray-50 p-0.5 text-xs">
                  {(["ALL", "PAID", "APPROVED", "DRAFT"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPayrollStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors ${
                        payrollStatusFilter === st
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {st === "ALL" ? "সব" : st === "PAID" ? "পরিশোধিত" : st === "APPROVED" ? "অনুমোদিত" : "খসড়া"}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => fetchPayrolls(payrollMonth)}
                  className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100"
                  title="রিফ্রেশ"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="p-3">ভাউচার নং</th>
                    <th className="p-3">শিক্ষক / কর্মকর্তা</th>
                    <th className="p-3">পদবী ও বিভাগ</th>
                    <th className="p-3 text-right">মূল বেতন</th>
                    <th className="p-3 text-right">ভাতা / কর্তন</th>
                    <th className="p-3 text-right">নিট প্রদেয়</th>
                    <th className="p-3 text-center">তহবিল ও মাধ্যম</th>
                    <th className="p-3 text-center">স্ট্যাটাস</th>
                    <th className="p-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payrolls
                    .filter((p) => {
                      if (payrollStatusFilter !== "ALL" && p.status !== payrollStatusFilter) return false;
                      if (payrollSearch.trim()) {
                        const q = payrollSearch.toLowerCase();
                        const name = (p.employee?.nameBn || p.user?.name || "").toLowerCase();
                        const vNum = (p.voucherNumber || "").toLowerCase();
                        return name.includes(q) || vNum.includes(q);
                      }
                      return true;
                    })
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-gray-900">{p.voucherNumber}</td>
                        <td className="p-3">
                          <div className="font-semibold text-gray-900">
                            {p.employee?.nameBn || p.user?.name}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {p.employee?.mobile || p.user?.phone || p.user?.email}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-gray-800">
                            {p.employee?.designation?.nameBn || p.user?.role || "শিক্ষক"}
                          </span>
                          <span className="text-[11px] text-gray-500 block">
                            {p.employee?.department?.nameBn || "একাডেমিক শাখা"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-right font-medium text-gray-700">
                          ৳ {formatBanglaCurrency(p.baseSalary)}
                        </td>
                        <td className="p-3 text-right text-[11px]">
                          <span className="text-emerald-700 block">+৳ {formatBanglaCurrency(p.allowances)}</span>
                          <span className="text-red-600 block">
                            -৳ {formatBanglaCurrency(p.deductions + (p.advanceDeduction || 0))}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-black text-right text-sm text-[#0D5C3A]">
                          ৳ {formatBanglaCurrency(p.netSalary)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 block">
                            {p.paymentMethod}
                          </span>
                          <span className="text-[10px] text-gray-500">তহবিল: {p.fundCode}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                              p.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : p.status === "APPROVED"
                                ? "bg-blue-100 text-blue-800 border border-blue-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}
                          >
                            {p.status === "PAID" ? "পরিশোধিত" : p.status === "APPROVED" ? "অনুমোদিত" : "খসড়া"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Print Payslip button */}
                            <button
                              type="button"
                              onClick={() => setSelectedPayslip(p)}
                              className="px-2 py-1 bg-gray-100 hover:bg-[#0D5C3A] hover:text-white rounded text-gray-700 font-medium transition-colors flex items-center gap-1"
                              title="বেতন রসিদ / পে-স্লিপ প্রিন্ট"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">স্লিপ</span>
                            </button>

                            {/* Quick Pay if not paid */}
                            {p.status !== "PAID" && (
                              <button
                                type="button"
                                onClick={() => handleQuickPayVoucher(p)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors flex items-center gap-1"
                                title="তাৎক্ষণিক পরিশোধ করুন"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">পরিশোধ</span>
                              </button>
                            )}

                            {/* Delete if DRAFT */}
                            {p.status !== "PAID" && (
                              <button
                                type="button"
                                onClick={() => handleDeletePayroll(p.id)}
                                className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded transition-colors"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                  {payrolls.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400">
                        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        এই মাসের জন্য কোনো বেতন ভাউচার পাওয়া যায়নি। উপরে ফরম থেকে নতুন ভাউচার তৈরি করুন।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

      {/* OFFICIAL STAFF PAYSLIP PRINT MODAL */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border my-auto">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between border-b pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#0D5C3A]" />
                <h3 className="text-sm font-bold text-gray-900">অফিসিয়াল বেতন স্লিপ ও ক্যাশ ভাউচার</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-[#0b4b2f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  প্রিন্ট করুন
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayslip(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PRINTABLE SLIP CONTENT */}
            <div id="printable-staff-payslip" className="space-y-6 text-gray-900 bg-white p-2">
              {/* Institutional Header */}
              <div className="text-center space-y-1 border-b-2 border-[#0D5C3A] pb-4">
                <p className="text-[11px] font-semibold tracking-wider text-emerald-800">বিসমিল্লাহির রাহমানির রাহিম</p>
                <h2 className="text-xl sm:text-2xl font-black text-[#0D5C3A] tracking-tight">
                  ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
                </h2>
                <p className="text-xs text-gray-600 font-medium">
                  স্থাপিত: ২০২১ ইং (ESTD 2021) | ডাকঘর: ইলিয়টগঞ্জ, উপজেলা: দাউদকান্দি, জেলা: কুমিল্লা
                </p>
                <div className="pt-2">
                  <span className="inline-block bg-[#0D5C3A] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                    মাসিক বেতন ও পারিশ্রমিক ভাউচার / STAFF PAYSLIP
                  </span>
                </div>
              </div>

              {/* Voucher Meta Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50/80 p-3.5 rounded-xl border border-gray-200">
                <div className="space-y-1.5">
                  <div>
                    <span className="text-gray-500 font-medium">ভাউচার নং: </span>
                    <span className="font-mono font-bold text-gray-900">{selectedPayslip.voucherNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">কর্মীর নাম: </span>
                    <span className="font-bold text-gray-900">
                      {selectedPayslip.employee?.nameBn || selectedPayslip.user?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">পদবী ও বিভাগ: </span>
                    <span className="font-medium text-gray-800">
                      {selectedPayslip.employee?.designation?.nameBn || selectedPayslip.user?.role || "শিক্ষক"} (
                      {selectedPayslip.employee?.department?.nameBn || "একাডেমিক শাখা"})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">মোবাইল নম্বর: </span>
                    <span className="font-mono text-gray-800">
                      {selectedPayslip.employee?.mobile || selectedPayslip.user?.phone || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-right">
                  <div>
                    <span className="text-gray-500 font-medium">বেতন মাস: </span>
                    <span className="font-bold font-mono text-[#0D5C3A]">{selectedPayslip.month}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">প্রদানের তারিখ: </span>
                    <span className="font-medium text-gray-800">
                      {selectedPayslip.paymentDate
                        ? new Date(selectedPayslip.paymentDate).toLocaleDateString("bn-BD")
                        : "খসড়া নির্ধারণ"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">পেমেন্ট মাধ্যম: </span>
                    <span className="font-semibold text-gray-800">
                      {selectedPayslip.paymentMethod} (তহবিল: {selectedPayslip.fundCode})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">স্ট্যাটাস: </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        selectedPayslip.status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {selectedPayslip.status === "PAID" ? "পরিশোধিত" : "অনুমোদিত / খসড়া"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown Table */}
              <div className="border rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-2 bg-gray-100 font-bold border-b text-gray-700">
                  <div className="p-2.5 border-r">উপার্জন বিবরণী (EARNINGS)</div>
                  <div className="p-2.5">কর্তন বিবরণী (DEDUCTIONS)</div>
                </div>

                <div className="grid grid-cols-2 divide-x">
                  {/* Earnings */}
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">মূল বেতন (Basic Salary):</span>
                      <span className="font-mono font-semibold">৳ {formatBanglaCurrency(selectedPayslip.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">বাড়িভাড়া ও বিশেষ ভাতা:</span>
                      <span className="font-mono font-semibold text-emerald-700">
                        +৳ {formatBanglaCurrency(selectedPayslip.allowances)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5 font-bold">
                      <span>মোট উপার্জন:</span>
                      <span className="font-mono">
                        ৳ {formatBanglaCurrency(selectedPayslip.baseSalary + selectedPayslip.allowances)}
                      </span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">সাধারণ কর্তন / তহবিল:</span>
                      <span className="font-mono font-semibold text-red-600">
                        -৳ {formatBanglaCurrency(selectedPayslip.deductions)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">অগ্রিম বেতন সমন্বয়:</span>
                      <span className="font-mono font-semibold text-amber-700">
                        -৳ {formatBanglaCurrency(selectedPayslip.advanceDeduction || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5 font-bold">
                      <span>মোট কর্তন:</span>
                      <span className="font-mono text-red-600">
                        -৳ {formatBanglaCurrency(selectedPayslip.deductions + (selectedPayslip.advanceDeduction || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Net Salary Highlight */}
                <div className="bg-[#0D5C3A]/10 border-t-2 border-[#0D5C3A] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-[#0D5C3A] text-sm">সর্বমোট নিট প্রদেয় বেতন (NET PAYABLE):</span>
                    {selectedPayslip.notes && (
                      <p className="text-[11px] text-gray-500 mt-0.5">নোট: {selectedPayslip.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black font-mono text-[#0D5C3A]">
                      ৳ {formatBanglaCurrency(selectedPayslip.netSalary)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures Section */}
              <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
                <div className="space-y-1">
                  <div className="border-t border-gray-400 pt-1.5 font-bold text-gray-800">
                    হিসাবরক্ষক / প্রস্তুতকারী
                  </div>
                  <p className="text-[10px] text-gray-400">স্বাক্ষর ও তারিখ</p>
                </div>
                <div className="space-y-1">
                  <div className="border-t border-gray-400 pt-1.5 font-bold text-gray-800">
                    নাযেম / পরীক্ষা সচিব
                  </div>
                  <p className="text-[10px] text-gray-400">স্বাক্ষর ও তারিখ</p>
                </div>
                <div className="space-y-1">
                  <div className="border-t border-gray-400 pt-1.5 font-bold text-gray-800">
                    মুহতামিম / অধ্যক্ষ
                  </div>
                  <p className="text-[10px] text-gray-400">সিল ও স্বাক্ষর</p>
                </div>
              </div>

              {/* Slip Footer */}
              <div className="text-center border-t pt-3 text-[10px] text-gray-400">
                ডিজিটাল ক্যাম্পাস ম্যানেজমেন্ট সিস্টেম | ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (স্থাপিত: ২০২১)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Fee Receipt Modal */}
      <OfficialReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receipt={selectedReceiptData}
      />
    </div>
  );
}
