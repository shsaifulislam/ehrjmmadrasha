"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ChevronDown,
  ArrowLeft,
  Printer,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { useGuardian360 } from "@/hooks/useGuardian";
import { useInitiateOnlinePayment } from "@/hooks/useOnlinePayment";
import { AppButton } from "@/components/shared/AppButton";
import { AppBadge } from "@/components/shared/AppBadge";
import { AppModal } from "@/components/shared/AppModal";
import { toast } from "sonner";

export default function GuardianFeesPage() {
  const [guardianId] = useState("g1");
  const [selectedWardId, setSelectedWardId] = useState<string>("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [gateway, setGateway] = useState<"BKASH" | "NAGAD">("BKASH");

  const { data: g360, isLoading, error } = useGuardian360(guardianId);
  const initiatePayment = useInitiateOnlinePayment();

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen p-8 text-center space-y-4 flex flex-col justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-500 font-medium">ফি তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen p-8 text-center space-y-4 flex flex-col justify-center items-center">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-sm text-red-600 font-medium">তথ্য লোড করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।</p>
        <Link href="/guardian/dashboard" className="text-emerald-600 underline text-xs">ড্যাশবোর্ডে ফিরে যান</Link>
      </div>
    );
  }

  const wards = g360?.wards || [];
  const activeWard = wards.find((w: any) => w.id === (selectedWardId || wards[0]?.id)) || wards[0];
  const financialSummary = g360?.financialSummary || { totalInvoiceAmount: 0, totalPaidAmount: 0, totalDueAmount: 0 };
  const invoices = g360?.invoices || [];

  const handlePayNow = async (invoice: any) => {
    try {
      const res = await initiatePayment.mutateAsync({
        invoiceId: invoice?.id || "inv_sample",
        gateway,
        amount: Number(invoice?.amount || financialSummary.totalDueAmount || 1000),
      });
      toast.success(`${gateway} গেটওয়ে রিডাইরেক্ট করা হচ্ছে...`);
      if (res?.redirectUrl) {
        window.location.href = res.redirectUrl;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "পেমেন্ট গেটওয়ে ট্র্রিগার করা সম্ভব হয়নি");
    }
  };

  // Empty State
  if (wards.length === 0) {
    return (
      <div className="min-h-screen p-8 text-center space-y-4 flex flex-col justify-center items-center">
        <CreditCard className="h-12 w-12 text-slate-300" />
        <p className="text-sm text-slate-500 font-medium">কোনো সন্তানের ফি তথ্য পাওয়া যায়নি।</p>
        <Link href="/guardian/dashboard" className="text-emerald-600 underline text-xs">ড্যাশবোর্ডে ফিরে যান</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Back Navigation & Child Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/guardian/dashboard" className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" /> ফি ও পেমেন্ট
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">সন্তানের ফি হিসাব, বকেয়া ও অনলাইন পেমেন্ট</p>
          </div>
        </div>
        <select
          value={activeWard?.id || ""}
          onChange={(e) => setSelectedWardId(e.target.value)}
          className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none"
        >
          {wards.map((w: any) => (
            <option key={w.id} value={w.id}>
              {w.nameBn} ({w.className} - রোল {w.roll})
            </option>
          ))}
        </select>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500">মোট চার্জ</span>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">৳ {financialSummary.totalInvoiceAmount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500">পরিশোধিত</span>
          <p className="text-xl font-bold font-mono text-emerald-600">৳ {financialSummary.totalPaidAmount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500">বকেয়া</span>
          <p className="text-xl font-bold font-mono text-red-500">৳ {financialSummary.totalDueAmount}</p>
        </div>
      </div>

      {/* Pay Now Button */}
      {financialSummary.totalDueAmount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200">বকেয়া ফি পরিশোধ করুন</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">বিকাশ বা নগদ দিয়ে অনলাইনে পেমেন্ট করতে পারবেন</p>
          </div>
          <div className="flex gap-2">
            <AppButton size="sm" variant="primary" onClick={() => { setGateway("BKASH"); setIsPaymentModalOpen(true); }}
              className="bg-pink-600 hover:bg-pink-700 text-white text-xs">
              বিকাশ দিয়ে পে করুন
            </AppButton>
            <AppButton size="sm" variant="primary" onClick={() => { setGateway("NAGAD"); setIsPaymentModalOpen(true); }}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs">
              নগদ দিয়ে পে করুন
            </AppButton>
          </div>
        </div>
      )}

      {/* Invoice History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600" /> ফি ইনভয়েস ইতিহাস
          </h2>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">কোনো ইনভয়েস পাওয়া যায়নি।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-600">তারিখ</th>
                  <th className="text-left p-3 font-semibold text-slate-600">বিবরণ</th>
                  <th className="text-right p-3 font-semibold text-slate-600">পরিমাণ (৳)</th>
                  <th className="text-center p-3 font-semibold text-slate-600">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any, idx: number) => (
                  <tr key={idx} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-3 text-slate-600">{inv.date || "-"}</td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{inv.description || inv.feeType || "-"}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">৳ {inv.amount || 0}</td>
                    <td className="p-3 text-center">
                      <AppBadge variant={inv.status === "PAID" ? "success" : inv.status === "PARTIAL" ? "warning" : "danger"}>
                        {inv.status === "PAID" ? "পরিশোধিত" : inv.status === "PARTIAL" ? "আংশিক" : "বকেয়া"}
                      </AppBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <AppModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`${gateway} দিয়ে পেমেন্ট`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">বকেয়া পরিমাণ: <strong className="text-lg font-mono text-slate-900">৳ {financialSummary.totalDueAmount}</strong></p>
          <p className="text-xs text-slate-500">পেমেন্ট গেটওয়ে: <strong>{gateway}</strong></p>
          <div className="flex gap-3">
            <AppButton onClick={() => handlePayNow(selectedInvoice)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
              পেমেন্ট করুন
            </AppButton>
            <AppButton variant="outline" onClick={() => setIsPaymentModalOpen(false)} className="flex-1">
              বাতিল
            </AppButton>
          </div>
        </div>
      </AppModal>
    </div>
  );
}
