"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  Award,
  Bell,
  Phone,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ChevronDown,
  Download,
  AlertCircle,
  FileText,
  MessageSquare
} from "lucide-react";
import { useGuardian360 } from "@/hooks/useGuardian";
import { useInitiateOnlinePayment } from "@/hooks/useOnlinePayment";
import { AppButton } from "@/components/shared/AppButton";
import { AppBadge } from "@/components/shared/AppBadge";
import { AppAvatar } from "@/components/shared/AppAvatar";
import { AppModal } from "@/components/shared/AppModal";
import { toast } from "sonner";

export default function GuardianDashboardPage() {
  // Demo logged in Guardian ID (In production derived from auth session / JWT token)
  const [guardianId, setGuardianId] = useState("g1");
  const [selectedWardId, setSelectedWardId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"attendance" | "fees" | "results" | "notices">("fees");

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [gateway, setGateway] = useState<"BKASH" | "NAGAD">("BKASH");

  const { data: g360, isLoading } = useGuardian360(guardianId);
  const initiatePayment = useInitiateOnlinePayment();

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 text-center space-y-4 flex flex-col justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-500 font-medium">অভিভাবক পোর্টাল ও সন্তানদের তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  const guardian = g360?.guardian || { name: "অভিভাবক প্রোফাইল", phone: "017xxxxxxxx" };
  const wards = g360?.wards || [
    { id: "w1", studentId: "STD-2026-001", nameBn: "আব্দুল্লাহ আল মামুন", roll: 1, className: "প্রথম শ্রেণী", sessionYear: "2026", isActive: true },
    { id: "w2", studentId: "STD-2026-045", nameBn: "মাহমুদুল হাসান", roll: 5, className: "তৃতীয় শ্রেণী", sessionYear: "2026", isActive: true },
  ];

  // Selected active ward
  const activeWard = wards.find((w: any) => w.id === (selectedWardId || wards[0]?.id)) || wards[0];
  const financialSummary = g360?.financialSummary || { totalInvoiceAmount: 5000, totalPaidAmount: 3500, totalDueAmount: 1500 };
  const attendances = g360?.recentAttendances || [];
  const notifications = g360?.notificationLogs || [];

  const handlePayNow = async (invoice: any) => {
    try {
      const res = await initiatePayment.mutateAsync({
        invoiceId: invoice?.id || "inv_sample",
        gateway,
        amount: Number(invoice?.amount || financialSummary.totalDueAmount || 1000),
      });
      toast.success(`${gateway} গেটওয়ে রিডাইরেক্ট করা হচ্ছে...`);
      if (res?.redirectUrl) {
        window.location.href = res.redirectUrl;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "পেমেন্ট গেটওয়ে ট্র্রিগার করা সম্ভব হয়নি");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Card & Child Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
                অভিভাবক পোর্টাল (Guardian Self-Service Portal)
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              স্বাগতম, <strong className="text-slate-800 dark:text-slate-200">{guardian.name}</strong> ({guardian.phone})
            </p>
          </div>

          {/* Multi-Child Switcher Dropdown */}
          <div className="w-full md:w-auto bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600 ml-2" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">সন্তান সিলেক্ট করুন:</span>
            <select
              value={activeWard?.id || ""}
              onChange={(e) => setSelectedWardId(e.target.value)}
              className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              {wards.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.nameBn} ({w.className} - রোল {w.roll})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Child Info Bar */}
        {activeWard && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
            <div className="flex items-center gap-4">
              <AppAvatar name={activeWard.nameBn} size="md" className="ring-2 ring-emerald-400" />
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  {activeWard.nameBn}
                  <AppBadge variant={activeWard.isActive ? "success" : "danger"}>
                    {activeWard.isActive ? "নিয়মিত শিক্ষার্থী" : "অনিয়মিত"}
                  </AppBadge>
                </h3>
                <p className="text-xs text-emerald-200 font-mono">
                  ID: {activeWard.studentId} • শ্রেণী: {activeWard.className} • রোল: {activeWard.roll}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-300 block">মোট বকেয়া ফি</span>
              <p className="text-lg font-black font-mono text-amber-300">৳ {financialSummary.totalDueAmount}</p>
            </div>
          </div>
        )}

        {/* Quick Navigation to Dedicated Pages */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/guardian/fees" className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all group text-center">
            <CreditCard className="h-5 w-5 text-emerald-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">ফি ও পেমেন্ট</span>
          </Link>
          <Link href="/guardian/attendance" className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all group text-center">
            <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">উপস্থিতি ক্যালেন্ডার</span>
          </Link>
          <Link href="/guardian/results" className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all group text-center">
            <Award className="h-5 w-5 text-purple-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">পরীক্ষার ফলাফল</span>
          </Link>
          <Link href="/guardian/dashboard" className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all group text-center">
            <Bell className="h-5 w-5 text-amber-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">নোটিশ ও এসএমএস</span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("fees")}
            className={`pb-3 px-4 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "fees"
                ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            ফি ও বিকাশ/নগদ পেমেন্ট ({financialSummary.totalDueAmount > 0 ? "বকেয়া আছে" : "পরিশোধিত"})
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`pb-3 px-4 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "attendance"
                ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Calendar className="h-4 w-4" />
            উপস্থিতি ক্যালেন্ডার
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`pb-3 px-4 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "results"
                ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Award className="h-4 w-4" />
            পরীক্ষার ফলাফল ও মার্কশীট
          </button>
          <button
            onClick={() => setActiveTab("notices")}
            className={`pb-3 px-4 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === "notices"
                ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Bell className="h-4 w-4" />
            নোটিশ ও এসএমএস লোগ ({notifications.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Fees & Online Payment Gateway Trigger */}
      {activeTab === "fees" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500">মোট চার্জ করা ইনভয়েস</span>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">৳ {financialSummary.totalInvoiceAmount}</p>
            </div>
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500">পরিশোধিত ফি</span>
              <p className="text-xl font-bold font-mono text-emerald-600">৳ {financialSummary.totalPaidAmount}</p>
            </div>
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500">মোট বকেয়া</span>
              <p className="text-xl font-bold font-mono text-amber-600">৳ {financialSummary.totalDueAmount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                {activeWard?.nameBn}-এর বকেয়া বেতন ও ইনভয়েস লিজার
              </span>
            </h3>

            {financialSummary.totalDueAmount > 0 ? (
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">চলতি মাসের মাসিক বেতন বকেয়া আছে</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300">বিকাশ বা নগদ অ্যাপ দিয়ে ঘরে বসেই অনলাইনে ইনস্ট্যান্ট পেমেন্ট করুন।</p>
                </div>
                <AppButton
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  onClick={() => {
                    setSelectedInvoice({ id: "inv_due_01", amount: financialSummary.totalDueAmount, title: "বকেয়া বেতন ও ভর্তি ফি" });
                    setIsPaymentModalOpen(true);
                  }}
                >
                  অনলাইনে ফি দিন (Pay Online)
                </AppButton>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl font-bold">
                🎉 কোনো বকেয়া বেতন নেই! সন্তানের সকল ফি পরিশোধিত আছে।
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Overview */}
      {activeTab === "attendance" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            {activeWard?.nameBn}-এর সাম্প্রতিক দৈনিক উপস্থিতি লোগ
          </h3>
          {attendances.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              সাম্প্রতিক কোনো উপস্থিতি ডাটা পাওয়া যায়নি।
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {attendances.map((att: any) => (
                <div key={att.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {new Date(att.date).toLocaleDateString("bn-BD")}
                    </span>
                  </div>
                  <AppBadge variant={att.status === "PRESENT" ? "success" : att.status === "LEAVE" ? "warning" : "danger"}>
                    {att.status === "PRESENT" ? "উপস্থিত" : att.status === "LEAVE" ? "ছুটি" : "অনুপস্থিত"}
                  </AppBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Exam Results */}
      {activeTab === "results" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-600" />
            {activeWard?.nameBn}-এর পরীক্ষার ফলাফলের বিবরণ
          </h3>
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            সাম্প্রতিক কোনো পরীক্ষার মার্কশীট বা গ্রেড রেকর্ড সংসংযুক্ত করা হয়নি।
          </div>
        </div>
      )}

      {/* Tab 4: Notices & SMS History */}
      {activeTab === "notices" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            অভিভাবকের নম্বরে পাঠানো এসএমএস ও নোটিশ লোগ
          </h3>
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              সাম্প্রতিক কোনো এসএমএস নোটিশ পাঠানো হয়নি।
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {notifications.map((n: any) => (
                <div key={n.id} className="py-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{n.eventType}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(n.createdAt).toLocaleDateString("bn-BD")}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">{n.messageText || "মাদ্রাসা সংক্রান্ত জরুরি বিজ্ঞপ্তি।"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Online Payment Gateway Trigger Modal */}
      <AppModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="অনলাইন পেমেন্ট গেটওয়ে">
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 text-xs space-y-1">
            <span className="text-slate-500">শিক্ষার্থীর নাম:</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">{activeWard?.nameBn}</p>
            <span className="text-slate-500 block pt-1">প্রদেয় টাকার পরিমাণ:</span>
            <p className="text-xl font-black font-mono text-emerald-600">৳ {selectedInvoice?.amount || financialSummary.totalDueAmount}</p>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-2">পেমেন্ট মেথড নির্বাচন করুন *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGateway("BKASH")}
                className={`p-4 rounded-2xl border text-center font-bold text-xs transition-all ${
                  gateway === "BKASH"
                    ? "border-pink-600 bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 ring-2 ring-pink-500"
                    : "border-slate-200 dark:border-slate-800 text-slate-600"
                }`}
              >
                বিকাশ (bKash)
              </button>
              <button
                onClick={() => setGateway("NAGAD")}
                className={`p-4 rounded-2xl border text-center font-bold text-xs transition-all ${
                  gateway === "NAGAD"
                    ? "border-orange-600 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500"
                    : "border-slate-200 dark:border-slate-800 text-slate-600"
                }`}
              >
                নগদ (Nagad)
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <AppButton variant="secondary" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
              বাতিল
            </AppButton>
            <AppButton variant="primary" size="sm" onClick={() => handlePayNow(selectedInvoice)}>
              গেটওয়েতে এগিয়ে যান →
            </AppButton>
          </div>
        </div>
      </AppModal>
    </div>
  );
}
