"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  Receipt,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Printer,
  ChevronDown,
  User,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import OfficialReceiptModal, { ReceiptData } from "@/components/finance/OfficialReceiptModal";

interface Child {
  id: string;
  studentIdNumber: string;
  fullNameBn: string;
  className: string | null;
  rollNumber: number | null;
  residentialStatus: string;
}

interface GuardianFinanceViewerProps {
  selectedStudentId?: string;
  onSelectStudent?: (id: string) => void;
}

export default function GuardianFinanceViewer({
  selectedStudentId,
  onSelectStudent,
}: GuardianFinanceViewerProps = {}) {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>(selectedStudentId || "");
  const [loading, setLoading] = useState(true);
  const [financeData, setFinanceData] = useState<any>(null);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Multi-child Family Finance mode
  const [familyFinanceMode, setFamilyFinanceMode] = useState<boolean>(false);
  const [familyInvoicesData, setFamilyInvoicesData] = useState<{ child: Child; invoices: any[]; summary: any }[]>([]);
  const [loadingFamily, setLoadingFamily] = useState<boolean>(false);

  // Sync selectedChildId when parent selectedStudentId changes
  useEffect(() => {
    if (selectedStudentId && selectedStudentId !== selectedChildId) {
      setSelectedChildId(selectedStudentId);
      fetchChildFinance(selectedStudentId);
    }
  }, [selectedStudentId]);

  // Payment checkout modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoicesForPay, setSelectedInvoicesForPay] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("BKASH");
  const [payMode, setPayMode] = useState<"GATEWAY" | "MANUAL">("GATEWAY");
  const [txIdInput, setTxIdInput] = useState("");
  const [paying, setPaying] = useState(false);

  // Financial Assistance modal
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [assistanceReason, setAssistanceReason] = useState("");
  const [isOrphanInput, setIsOrphanInput] = useState(false);
  const [familyCondition, setFamilyCondition] = useState("");

  // Official Receipt Modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptModalData, setReceiptModalData] = useState<ReceiptData | null>(null);

  const openReceiptModal = (rcp: any) => {
    const matchingInvoice = financeData?.invoices?.find((inv: any) =>
      inv.receipts?.some((r: any) => r.id === rcp.id)
    );
    setReceiptModalData({
      receiptNumber: rcp.receiptNumber,
      receiptDate: rcp.receiptDate,
      studentIdNumber: selectedChild?.studentIdNumber || "",
      studentNameBn: selectedChild?.fullNameBn || "",
      className: selectedChild?.className || "নির্ধারিত নয়",
      rollNumber: selectedChild?.rollNumber || 1,
      title: matchingInvoice?.title || "শিক্ষার্থী বেতন ও প্রাতিষ্ঠানিক চার্জ",
      amount: rcp.amount,
      paymentMethod: rcp.paymentMethod,
      transactionId: rcp.transactionId,
      qrCodeToken: rcp.qrCodeToken,
      receivedBy: "হিসাব বিভাগ",
    });
    setShowReceiptModal(true);
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portal/children");
      const data = await res.json();
      if (data.children && data.children.length > 0) {
        setChildren(data.children);
        const targetId = selectedStudentId || data.children[0].id;
        setSelectedChildId(targetId);
        fetchChildFinance(targetId);
        fetchFamilyFinance(data.children);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyFinance = async (kids: Child[]) => {
    setLoadingFamily(true);
    try {
      const promises = kids.map(async (c) => {
        try {
          const res = await fetch(`/api/portal/finance?studentId=${c.id}`);
          const json = await res.json();
          return {
            child: c,
            invoices: json.success && json.invoices ? json.invoices : [],
            summary: json.success && json.summary ? json.summary : { totalBilled: 0, totalPaid: 0, totalDue: 0 }
          };
        } catch {
          return { child: c, invoices: [], summary: { totalBilled: 0, totalPaid: 0, totalDue: 0 } };
        }
      });
      const results = await Promise.all(promises);
      setFamilyInvoicesData(results);
    } catch (err) {
      console.error("Family finance fetch error:", err);
    } finally {
      setLoadingFamily(false);
    }
  };

  const activeFinanceAbortRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (activeFinanceAbortRef.current) {
        activeFinanceAbortRef.current.abort();
      }
    };
  }, []);

  const fetchChildFinance = async (studentId: string) => {
    if (activeFinanceAbortRef.current) {
      activeFinanceAbortRef.current.abort();
    }
    const controller = new AbortController();
    activeFinanceAbortRef.current = controller;

    setLoading(true);
    // Clear previous finance data immediately to prevent displaying wrong child dues
    setFinanceData(null);

    try {
      const res = await fetch(`/api/portal/finance?studentId=${studentId}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      if (controller.signal.aborted) return;
      if (data.success) {
        setFinanceData(data);
      } else {
        setFinanceData(null);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || controller.signal.aborted) return;
      console.error(err);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
    fetchChildFinance(childId);
    onSelectStudent?.(childId);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoicesForPay.length === 0) return;
    setPaying(true);

    try {
      // Find invoices to pay and allocate amounts from single child or family list
      const allInvoices = familyFinanceMode
        ? familyInvoicesData.flatMap((f) => f.invoices)
        : (financeData?.invoices || []);

      const allocations = allInvoices
        .filter((inv: any) => selectedInvoicesForPay.includes(inv.id))
        .map((inv: any) => ({
          invoiceId: inv.id,
          amount: inv.dueAmount,
        }));

      if (payMode === "GATEWAY") {
        const primaryInvoiceId = selectedInvoicesForPay[0];
        const res = await fetch("/api/portal/finance/gateway/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId: primaryInvoiceId,
            provider: paymentMethod === "NAGAD" ? "NAGAD" : "BKASH",
          }),
        });

        const data = await res.json();
        if (res.ok && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        } else {
          setMsg({ text: data.error || "পেমেন্ট গেটওয়েতে সংযোগ করতে সমস্যা হয়েছে।", type: "error" });
          setPaying(false);
          return;
        }
      }

      // Manual TrxID Submission Mode (Option A: PENDING_VERIFICATION)
      if (!txIdInput || txIdInput.trim().length < 4) {
        setMsg({ text: "অনুগ্রহ করে সঠিক মোবাইল ব্যাংকিং ট্রানজেকশন আইডি (TrxID) প্রদান করুন।", type: "error" });
        setPaying(false);
        return;
      }

      const res = await fetch("/api/portal/finance/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocations,
          paymentMethod,
          transactionId: txIdInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg({
          text: data.message || "পেমেন্ট তথ্য যাচাইয়ের জন্য দাখিল হয়েছে। প্রতিষ্ঠান কর্তৃপক্ষ অনুমোদন করলে বকেয়া হালনাগাদ হবে।",
          type: "success",
        });
        setShowPayModal(false);
        setSelectedInvoicesForPay([]);
        setTxIdInput("");
        fetchChildFinance(selectedChildId);
        fetchFamilyFinance(children);
      } else {
        setMsg({ text: data.error || "পেমেন্ট সম্পন্ন হয়নি", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    } finally {
      setPaying(false);
    }
  };

  const handleAssistanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;

    try {
      const res = await fetch("/api/portal/finance/assistance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedChildId,
          sessionId: financeData?.invoices?.[0]?.sessionId || "",
          reason: assistanceReason,
          isOrphan: isOrphanInput,
          familyCondition,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message, type: "success" });
        setShowAssistanceModal(false);
        setAssistanceReason("");
        fetchChildFinance(selectedChildId);
      } else {
        setMsg({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message, type: "error" });
    }
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);

  const totalFamilyDue = familyInvoicesData.reduce((acc, curr) => acc + (curr.summary?.totalDue || 0), 0);
  const totalFamilyPaid = familyInvoicesData.reduce((acc, curr) => acc + (curr.summary?.totalPaid || 0), 0);
  const totalFamilyBilled = familyInvoicesData.reduce((acc, curr) => acc + (curr.summary?.totalBilled || 0), 0);

  const allUnpaidInvoices = familyInvoicesData.flatMap(f => (f.invoices || []).filter((i: any) => i.dueAmount > 0));
  const selectedFamilyTotal = allUnpaidInvoices
    .filter(i => selectedInvoicesForPay.includes(i.id))
    .reduce((sum, i) => sum + i.dueAmount, 0);

  return (
    <div className="space-y-6">
      {/* Sandbox Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-800">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span><strong>স্যান্ডবক্স মোড:</strong> অনলাইন পেমেন্ট গেটওয়ে বর্তমানে টেস্ট/স্যান্ডবক্স পরিবেশে পরিচালিত।</span>
        </div>
        <span className="font-mono text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
          TEST / SANDBOX
        </span>
      </div>

      {/* View Switcher: Individual vs Family */}
      {children.length > 1 && (
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => {
              setFamilyFinanceMode(false);
              setSelectedInvoicesForPay([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              !familyFinanceMode
                ? "bg-[#0D5C3A] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            একক শিক্ষার্থীর ফি ({selectedChild?.fullNameBn || "সন্তান"})
          </button>
          <button
            onClick={() => {
              setFamilyFinanceMode(true);
              setSelectedInvoicesForPay([]);
              fetchFamilyFinance(children);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              familyFinanceMode
                ? "bg-[#0D5C3A] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>পরিবারের মোট বকেয়া ও সমন্বিত পেমেন্ট</span>
            {totalFamilyDue > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                ৳{totalFamilyDue.toLocaleString("bn-BD")}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Child Switcher (Shown in Individual Mode) */}
      {!familyFinanceMode && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#0D5C3A]" />
            <div>
              <span className="text-xs text-gray-500 font-semibold block">সন্তান নির্বাচন করুন</span>
              <span className="text-sm font-bold text-gray-900">{selectedChild?.fullNameBn}</span>
            </div>
          </div>

          {children.length > 1 && (
            <div className="flex items-center gap-2">
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleChildSelect(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedChildId === c.id
                      ? "bg-[#0D5C3A] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {c.fullNameBn}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {msg && (
        <div
          className={`p-4 rounded-lg text-xs font-semibold flex items-center justify-between ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-gray-400 font-bold">
            ✕
          </button>
        </div>
      )}

      {familyFinanceMode ? (
        <div className="space-y-6">
          {/* Family Summary Cards (3D Gold Elevation) */}
          <div className="perspective-1000 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-3d p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-[#D4AF37] shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">পরিবারের মোট ধার্যকৃত ফি</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1.5 block">
                ৳ {totalFamilyBilled.toLocaleString("bn-BD")}
              </span>
            </div>
            <div className="card-3d p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">পরিবারের মোট পরিশোধিত</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-[#0D5C3A] mt-1.5 block">
                ৳ {totalFamilyPaid.toLocaleString("bn-BD")}
              </span>
            </div>
            <div className="card-3d p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-red-400 shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">পরিবারের বর্তমান বকেয়া ফি</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-red-600 mt-1.5 block">
                ৳ {totalFamilyDue.toLocaleString("bn-BD")}
              </span>
            </div>
          </div>

          {/* Family Unpaid Invoices Breakdown by Child */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">সন্তানভিত্তিক বকেয়া তালিকা ও পেমেন্ট কার্ট</h3>
                <p className="text-xs text-gray-500">যেসব ইনভয়েস একত্রে পরিশোধ করতে চান সেগুলো টিক দিন</p>
              </div>

              {allUnpaidInvoices.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedInvoicesForPay.length === allUnpaidInvoices.length) {
                        setSelectedInvoicesForPay([]);
                      } else {
                        setSelectedInvoicesForPay(allUnpaidInvoices.map((i: any) => i.id));
                      }
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    {selectedInvoicesForPay.length === allUnpaidInvoices.length
                      ? "সব নির্বাচন বাতিল"
                      : "সব বকেয়া নির্বাচন করুন"}
                  </button>

                  <button
                    type="button"
                    disabled={selectedInvoicesForPay.length === 0}
                    onClick={() => setShowPayModal(true)}
                    className="bg-[#0D5C3A] hover:bg-[#158052] disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>একত্রে ফি পরিশোধ ({selectedInvoicesForPay.length} টি)</span>
                    {selectedFamilyTotal > 0 && (
                      <span className="font-mono ml-1 font-bold">৳{selectedFamilyTotal.toLocaleString("bn-BD")}</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {loadingFamily ? (
              <div className="py-10 text-center text-gray-500 text-xs">
                সকল সন্তানের ফি তথ্য লোড হচ্ছে...
              </div>
            ) : allUnpaidInvoices.length === 0 ? (
              <div className="py-8 text-center text-emerald-800 bg-emerald-50 rounded-xl p-4">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <p className="font-bold text-sm">আলহামদুলিল্লাহ! পরিবারের কোনো সন্তানের ফি বকেয়া নেই।</p>
              </div>
            ) : (
              <div className="space-y-6">
                {familyInvoicesData.map((fItem) => {
                  const childUnpaid = (fItem.invoices || []).filter((i: any) => i.dueAmount > 0);
                  if (childUnpaid.length === 0) return null;

                  return (
                    <div key={fItem.child.id} className="border rounded-xl p-4 bg-gray-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#0D5C3A]" />
                          <span className="font-bold text-sm text-gray-900">{fItem.child.fullNameBn}</span>
                          <span className="text-xs text-gray-500 font-mono">({fItem.child.studentIdNumber})</span>
                          {fItem.child.className && (
                            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                              {fItem.child.className}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-red-600">
                          মোট বকেয়া: ৳{(fItem.summary?.totalDue || 0).toLocaleString("bn-BD")}
                        </span>
                      </div>

                      <div className="overflow-x-auto bg-white rounded-lg border">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-100/70 border-b">
                            <tr>
                              <th className="p-2.5 w-10 text-center">নির্বাচন</th>
                              <th className="p-2.5">ইনভয়েস নং</th>
                              <th className="p-2.5">খাত / বিবরণ</th>
                              <th className="p-2.5">ধার্য</th>
                              <th className="p-2.5">পরিশোধ</th>
                              <th className="p-2.5">বকেয়া</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {childUnpaid.map((inv: any) => {
                              const isSelected = selectedInvoicesForPay.includes(inv.id);
                              return (
                                <tr
                                  key={inv.id}
                                  className={`hover:bg-emerald-50/40 cursor-pointer ${
                                    isSelected ? "bg-emerald-50/60" : ""
                                  }`}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedInvoicesForPay(selectedInvoicesForPay.filter((id) => id !== inv.id));
                                    } else {
                                      setSelectedInvoicesForPay([...selectedInvoicesForPay, inv.id]);
                                    }
                                  }}
                                >
                                  <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedInvoicesForPay([...selectedInvoicesForPay, inv.id]);
                                        } else {
                                          setSelectedInvoicesForPay(selectedInvoicesForPay.filter((id) => id !== inv.id));
                                        }
                                      }}
                                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2.5 font-mono font-bold">{inv.invoiceNumber}</td>
                                  <td className="p-2.5 font-semibold">{inv.title}</td>
                                  <td className="p-2.5 font-mono">৳{inv.totalAmount}</td>
                                  <td className="p-2.5 font-mono text-[#0D5C3A]">৳{inv.paidAmount}</td>
                                  <td className="p-2.5 font-mono font-bold text-red-600">৳{inv.dueAmount}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards (3D Gold Elevation) */}
          {financeData?.summary && (
            <div className="perspective-1000 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card-3d p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-[#D4AF37] shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">মোট ধার্যকৃত ফি</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1.5 block">
                  ৳ {financeData.summary.totalBilled?.toLocaleString("bn-BD")}
                </span>
              </div>
              <div className="card-3d p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">মোট পরিশোধিত</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-[#0D5C3A] mt-1.5 block">
                  ৳ {financeData.summary.totalPaid?.toLocaleString("bn-BD")}
                </span>
              </div>
              <div className="card-3d p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-red-400 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">বর্তমান বকেয়া ফি</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-red-600 mt-1.5 block">
                  ৳ {financeData.summary.totalDue?.toLocaleString("bn-BD")}
                </span>
              </div>
            </div>
          )}

      {/* Invoices List */}
      <div className="bg-white p-6 rounded-2xl border-2 border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-serif-bn">ফি বিবরণী ও ইনভয়েস</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssistanceModal(true)}
              className="text-xs font-semibold text-[#0D5C3A] hover:underline"
            >
              আর্থিক সহায়তার আবেদন করুন
            </button>
            {financeData?.summary?.totalDue > 0 && (
              <button
                onClick={() => {
                  const unpaidIds = financeData.invoices
                    .filter((i: any) => i.dueAmount > 0)
                    .map((i: any) => i.id);
                  setSelectedInvoicesForPay(unpaidIds);
                  setShowPayModal(true);
                }}
                className="btn-gold px-4 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4 text-stone-900" />
                <span>অনলাইনে ফি পরিশোধ</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] border-b font-bold text-slate-700">
              <tr>
                <th className="p-3">ইনভয়েস নং</th>
                <th className="p-3">খাত / বিবরণ</th>
                <th className="p-3">ধার্য (৳)</th>
                <th className="p-3">মওকুফ/ছাড়</th>
                <th className="p-3">পরিশোধ (৳)</th>
                <th className="p-3">বকেয়া (৳)</th>
                <th className="p-3">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {financeData?.invoices?.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-amber-50/20 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="p-3 font-semibold">{inv.title}</td>
                  <td className="p-3 font-mono">৳ {inv.totalAmount}</td>
                  <td className="p-3 font-mono text-purple-700">৳ {inv.discountAmount + inv.waiverAmount}</td>
                  <td className="p-3 font-mono text-[#0D5C3A] font-bold">৳ {inv.paidAmount}</td>
                  <td className="p-3 font-mono font-bold text-red-600">৳ {inv.dueAmount}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        inv.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : inv.status === "PARTIALLY_PAID"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : inv.status === "WAIVED"
                          ? "bg-purple-100 text-purple-800 border-purple-300"
                          : "bg-red-100 text-red-800 border-red-300"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Receipts (3D Gold Cards) */}
      <div className="bg-white p-6 rounded-2xl border-2 border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 font-serif-bn">পরিশোধিত মানি রসিদ (Money Receipts)</h3>
        <div className="perspective-1000 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {financeData?.invoices
            ?.flatMap((inv: any) => inv.receipts || [])
            .map((rcp: any) => (
              <div key={rcp.id} className="card-3d p-4.5 rounded-2xl border-2 border-slate-200/90 hover:border-[#D4AF37] bg-white shadow-sm hover:shadow-lg space-y-3 text-xs transition-all relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0D5C3A] via-[#D4AF37] to-[#0D5C3A]" />
                
                <div className="flex items-center justify-between border-b pb-2 pt-1">
                  <span className="font-mono font-bold text-slate-900">{rcp.receiptNumber}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    rcp.paymentStatus === "SUCCESSFUL"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : rcp.paymentStatus === "PENDING_VERIFICATION"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-red-100 text-red-800 border-red-300"
                  }`}>
                    {rcp.paymentStatus === "SUCCESSFUL"
                      ? "অনুমোদিত"
                      : rcp.paymentStatus === "PENDING_VERIFICATION"
                      ? "যাচাই অপেক্ষমাণ"
                      : rcp.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[11px]">পরিশোধের মাধ্যম:</span>
                  <span className="font-bold text-slate-800">{rcp.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">পরিমাণ:</span>
                  <span className="font-mono font-black text-sm text-[#0D5C3A]">৳ {rcp.amount}</span>
                </div>
                <div className="pt-2 border-t flex items-center justify-between gap-2">
                  <Link
                    href={`/verify/receipt/${rcp.qrCodeToken || rcp.receiptNumber}`}
                    target="_blank"
                    className="text-[#0D5C3A] font-bold text-[11px] hover:underline flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>যাচাই</span>
                  </Link>
                  {rcp.paymentStatus === "SUCCESSFUL" ? (
                    <button
                      type="button"
                      onClick={() => openReceiptModal(rcp)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-200 font-bold text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>অফিশিয়াল রশিদ</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      অপেক্ষমাণ
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
        </>
      )}

      {/* ONLINE PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">অনলাইন ফি পরিশোধ (bKash / Nagad / Bank)</h3>
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-900 space-y-1">
              <div>
                শিক্ষার্থী:{" "}
                <span className="font-semibold">
                  {familyFinanceMode ? "পরিবারের নির্বাচিত শিক্ষার্থীগণ" : selectedChild?.fullNameBn}
                </span>
              </div>
              <div>নির্বাচিত বকেয়া ইনভয়েস: <span className="font-bold">{selectedInvoicesForPay.length}টি</span></div>
              <div>
                মোট প্রদেয় টাকা:{" "}
                <span className="font-mono font-bold text-[#0D5C3A]">
                  ৳ {(familyFinanceMode
                    ? selectedFamilyTotal
                    : (financeData?.invoices?.filter((i: any) => selectedInvoicesForPay.includes(i.id)).reduce((s: number, i: any) => s + i.dueAmount, 0) || 0)
                  ).toLocaleString("bn-BD")}
                </span>
              </div>
            </div>
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setPayMode("GATEWAY")}
                className={`py-1.5 px-2 rounded-md font-bold text-xs transition ${
                  payMode === "GATEWAY"
                    ? "bg-[#0D5C3A] text-white shadow-sm"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                অনলাইন গেটওয়ে (তাৎক্ষণিক)
              </button>
              <button
                type="button"
                onClick={() => setPayMode("MANUAL")}
                className={`py-1.5 px-2 rounded-md font-bold text-xs transition ${
                  payMode === "MANUAL"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                ম্যানুয়াল TrxID দাবি (যাচাই সাপেক্ষ)
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">পেমেন্ট মাধ্যম নির্বাচন করুন *</label>
                <div className="grid grid-cols-3 gap-2">
                  {["BKASH", "NAGAD", "BANK"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2 rounded-lg border text-center font-bold ${
                        paymentMethod === m
                          ? "border-[#0D5C3A] bg-[#0D5C3A]/10 text-[#0D5C3A]"
                          : "border-gray-200"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {payMode === "GATEWAY" ? (
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" /> অফিসিয়াল সিকিউর চেকআউট
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    নিচের বাটনে ক্লিক করলে অফিসিয়াল {paymentMethod} পেমেন্ট স্ক্রিন খুলবে। সফল পেমেন্টের সাথে সাথে মাদরাসার ডিজিটাল রসিদ ইস্যু হবে।
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-[11px] text-amber-800">
                    <p className="font-semibold mb-0.5">ম্যানুয়াল অফলাইন নির্দেশনা:</p>
                    <p>মার্চেন্ট নম্বরে টাকা পাঠিয়ে নিচে TrxID লিখুন। প্রতিষ্ঠান হিসাব শাখা যাচাই করে অনুমোদন করলে বকেয়া কাটা হবে।</p>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">মোবাইল ব্যাংকিং ট্রানজেকশন আইডি (TrxID) *</label>
                    <input
                      type="text"
                      required
                      value={txIdInput}
                      onChange={(e) => setTxIdInput(e.target.value)}
                      placeholder="যেমন: BKS987654321"
                      className="w-full p-2 border rounded font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-3 py-1.5 border rounded hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className={`px-4 py-1.5 rounded font-semibold text-white disabled:opacity-50 transition ${
                    payMode === "GATEWAY"
                      ? "bg-[#0D5C3A] hover:bg-[#094229]"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {paying
                    ? "প্রক্রিয়াধীন..."
                    : payMode === "GATEWAY"
                    ? `সরাসরি ${paymentMethod} চেকআউটে যান →`
                    : "পেমেন্ট দাবি দাখিল করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FINANCIAL ASSISTANCE MODAL */}
      {showAssistanceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">দরিদ্র বা এতিম কল্যাণ আর্থিক সহায়তা আবেদন</h3>
            <form onSubmit={handleAssistanceSubmit} className="space-y-3">
              <div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={isOrphanInput}
                    onChange={(e) => setIsOrphanInput(e.target.checked)}
                    className="rounded text-[#0D5C3A]"
                  />
                  শিক্ষার্থী এতিম (পিতা মৃত)
                </label>
              </div>
              <div>
                <label className="block font-semibold mb-1">পারিবারিক আর্থিক অবস্থা</label>
                <input
                  type="text"
                  value={familyCondition}
                  onChange={(e) => setFamilyCondition(e.target.value)}
                  placeholder="যেমন: দিনমজুর, অসচ্ছল পরিবার"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">আবেদনের বিস্তারিত কারণ ও প্রয়োজনীয়তা *</label>
                <textarea
                  required
                  rows={4}
                  value={assistanceReason}
                  onChange={(e) => setAssistanceReason(e.target.value)}
                  placeholder="কেন ফি মওকুফ বা ছাড় প্রয়োজন তা বিস্তারিত লিখুন (কমপক্ষে ১০ অক্ষর)..."
                  className="w-full p-2 border rounded"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssistanceModal(false)}
                  className="px-3 py-1.5 border rounded hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button type="submit" className="bg-[#0D5C3A] text-white px-4 py-1.5 rounded font-semibold">
                  আবেদন দাখিল করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL RECEIPT MODAL (A4 & 80MM THERMAL) */}
      <OfficialReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receipt={receiptModalData}
      />
    </div>
  );
}
