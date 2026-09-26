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

interface Child {
  id: string;
  studentIdNumber: string;
  fullNameBn: string;
  className: string | null;
  rollNumber: number | null;
  residentialStatus: string;
}

export default function GuardianFinanceViewer() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [financeData, setFinanceData] = useState<any>(null);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Payment checkout modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoicesForPay, setSelectedInvoicesForPay] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("BKASH");
  const [txIdInput, setTxIdInput] = useState("");
  const [paying, setPaying] = useState(false);

  // Financial Assistance modal
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [assistanceReason, setAssistanceReason] = useState("");
  const [isOrphanInput, setIsOrphanInput] = useState(false);
  const [familyCondition, setFamilyCondition] = useState("");

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
        setSelectedChildId(data.children[0].id);
        fetchChildFinance(data.children[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildFinance = async (studentId: string) => {
    try {
      const res = await fetch(`/api/portal/finance?studentId=${studentId}`);
      const data = await res.json();
      if (data.success) {
        setFinanceData(data);
      } else {
        setFinanceData(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
    fetchChildFinance(childId);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoicesForPay.length === 0) return;
    setPaying(true);

    try {
      // Find invoices to pay and allocate amounts
      const allocations = financeData.invoices
        .filter((inv: any) => selectedInvoicesForPay.includes(inv.id))
        .map((inv: any) => ({
          invoiceId: inv.id,
          amount: inv.dueAmount,
        }));

      const res = await fetch("/api/portal/finance/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocations,
          paymentMethod,
          transactionId: txIdInput || `ONLINE-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message || "পেমেন্ট সফলভাবে গৃহীত হয়েছে!", type: "success" });
        setShowPayModal(false);
        setSelectedInvoicesForPay([]);
        setTxIdInput("");
        fetchChildFinance(selectedChildId);
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

  return (
    <div className="space-y-6">
      {/* Child Switcher */}
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

      {/* Summary Cards */}
      {financeData?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500 block">মোট ধার্যকৃত ফি</span>
            <span className="text-xl font-bold font-mono text-gray-900 mt-1 block">
              ৳ {financeData.summary.totalBilled?.toLocaleString("bn-BD")}
            </span>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500 block">মোট পরিশোধিত</span>
            <span className="text-xl font-bold font-mono text-[#0D5C3A] mt-1 block">
              ৳ {financeData.summary.totalPaid?.toLocaleString("bn-BD")}
            </span>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <span className="text-xs text-gray-500 block">বর্তমান বকেয়া ফি</span>
            <span className="text-xl font-bold font-mono text-red-600 mt-1 block">
              ৳ {financeData.summary.totalDue?.toLocaleString("bn-BD")}
            </span>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">ফি বিবরণী ও ইনভয়েস</h3>
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
                className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                অনলাইনে ফি পরিশোধ (Pay Now)
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b">
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
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono font-bold text-gray-900">{inv.invoiceNumber}</td>
                  <td className="p-3 font-semibold">{inv.title}</td>
                  <td className="p-3 font-mono">৳ {inv.totalAmount}</td>
                  <td className="p-3 font-mono text-purple-700">৳ {inv.discountAmount + inv.waiverAmount}</td>
                  <td className="p-3 font-mono text-[#0D5C3A]">৳ {inv.paidAmount}</td>
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
                          : "bg-red-100 text-red-800"
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

      {/* Payment Receipts */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900">পরিশোধিত মানি রসিদ (Money Receipts)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {financeData?.invoices
            ?.flatMap((inv: any) => inv.receipts || [])
            .map((rcp: any) => (
              <div key={rcp.id} className="p-4 border rounded-xl bg-gray-50 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-mono font-bold text-gray-900">{rcp.receiptNumber}</span>
                  <span className="text-[10px] text-gray-500">
                    {new Date(rcp.receiptDate).toLocaleDateString("bn-BD")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">পরিশোধের মাধ্যম:</span>
                  <span className="font-semibold">{rcp.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">আদায়কৃত পরিমাণ:</span>
                  <span className="font-mono font-bold text-[#0D5C3A]">৳ {rcp.amount}</span>
                </div>
                <div className="pt-2 border-t flex items-center justify-between">
                  <Link
                    href={`/api/verify/receipt/${rcp.qrCodeToken}`}
                    target="_blank"
                    className="text-[#0D5C3A] font-semibold text-[11px] hover:underline flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> অনলাইন যাচাই
                  </Link>
                  <button
                    onClick={() => window.print()}
                    className="text-gray-500 hover:text-gray-700 text-[11px] flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> প্রিন্ট
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ONLINE PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">অনলাইন ফি পরিশোধ (bKash / Nagad / Bank)</h3>
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-900 space-y-1">
              <div>শিক্ষার্থী: <span className="font-semibold">{selectedChild?.fullNameBn}</span></div>
              <div>নির্বাচিত বকেয়া ইনভয়েস: <span className="font-bold">{selectedInvoicesForPay.length}টি</span></div>
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
                  className="bg-[#0D5C3A] text-white px-4 py-1.5 rounded font-semibold disabled:opacity-50"
                >
                  {paying ? "প্রক্রিয়াধীন..." : "পেমেন্ট নিশ্চিত করুন"}
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
    </div>
  );
}
