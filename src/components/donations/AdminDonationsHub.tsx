"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  Heart,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  CreditCard,
  Building,
  User,
  Phone,
  FileText,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Award,
  Download,
  Trash2,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
import { FUND_CATEGORIES } from "@/lib/donationConstants";

interface Donation {
  id: string;
  receiptNumber: string;
  donorName: string;
  donorPhone: string;
  donorEmail?: string;
  donorAddress?: string;
  fundCategory: string;
  fundCategoryBn: string;
  amount: number;
  paymentMethod: string;
  paymentMethodBn: string;
  transactionId: string;
  isAnonymous: boolean;
  notes?: string;
  status: "COMPLETED" | "PENDING_VERIFICATION";
  verificationToken: string;
  createdAt: string;
}

export default function AdminDonationsHub() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Donation | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // New Donation Form
  const [formData, setFormData] = useState({
    donorName: "",
    donorPhone: "",
    donorEmail: "",
    donorAddress: "",
    fundCategory: "ANNUAL_MAHFIL",
    amount: "",
    paymentMethod: "CASH",
    paymentMethodBn: "অফিস ক্যাশ রসিদ",
    transactionId: "",
    notes: "",
    isAnonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.set("search", searchTerm);
      if (categoryFilter !== "ALL") queryParams.set("category", categoryFilter);
      if (methodFilter !== "ALL") queryParams.set("method", methodFilter);

      const res = await fetch(`/api/admin/donations?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDonations(data.donations || []);
        setStats(data.stats || null);
      } else {
        setActionMsg({ text: data.error || "অনুদান লোড ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [categoryFilter, methodFilter]);

  // Generate QR Code whenever selectedReceipt changes
  useEffect(() => {
    if (!selectedReceipt) {
      setQrCodeDataUrl(null);
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const verifyUrl = `${origin}/verify/receipt/${encodeURIComponent(selectedReceipt.verificationToken)}`;
    QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 160,
      color: { dark: "#063320", light: "#FFFFFF" },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("QR Generation Error:", err));
  }, [selectedReceipt]);

  const handleCopyTrx = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/admin/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg({ text: "অনুদান সফলভাবে সংরক্ষিত হয়েছে।", type: "success" });
        setShowAddModal(false);
        setFormData({
          donorName: "",
          donorPhone: "",
          donorEmail: "",
          donorAddress: "",
          fundCategory: "ANNUAL_MAHFIL",
          amount: "",
          paymentMethod: "CASH",
          paymentMethodBn: "অফিস ক্যাশ রসিদ",
          transactionId: "",
          notes: "",
          isAnonymous: false,
        });
        fetchDonations();
        if (data.donation) {
          setSelectedReceipt(data.donation);
        }
      } else {
        setActionMsg({ text: data.error || "সংরক্ষণ ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (donation: Donation) => {
    const newStatus = donation.status === "COMPLETED" ? "PENDING_VERIFICATION" : "COMPLETED";
    try {
      const res = await fetch("/api/admin/donations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: donation.id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg({ text: "স্ট্যাটাস আপডেট সম্পন্ন হয়েছে।", type: "success" });
        fetchDonations();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteDonation = async (id: string, receiptNumber: string) => {
    if (!confirm(`আপনি কি নিশ্চিতভাবে অনুদান রসিদ '${receiptNumber}' মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch(`/api/admin/donations?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg({ text: data.message || "অনুদান সফলভাবে মুছে ফেলা হয়েছে।", type: "success" });
        fetchDonations();
      } else {
        setActionMsg({ text: data.error || "মুছে ফেলতে ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    }
  };

  const exportDonationsToCSV = () => {
    if (!donations || donations.length === 0) {
      alert("কোনো অনুদান রেকর্ড পাওয়া যায়নি।");
      return;
    }

    const headers = [
      "রশিদ নম্বর",
      "তারিখ",
      "দাতার নাম",
      "মোবাইল নম্বর",
      "ঠিকানা",
      "অনুদানের খাত",
      "পেমেন্ট মাধ্যম",
      "ট্রানজেকশন ID",
      "পরিমাণ (টাকা)",
      "স্ট্যাটাস",
      "ভেরিফিকেশন টোকেন",
    ];

    const rows = donations.map((d) => [
      d.receiptNumber,
      new Date(d.createdAt).toLocaleDateString("bn-BD"),
      `"${(d.isAnonymous ? "গোপন সদাকাহ" : d.donorName).replace(/"/g, '""')}"`,
      d.donorPhone || "",
      `"${(d.donorAddress || "").replace(/"/g, '""')}"`,
      `"${(d.fundCategoryBn || d.fundCategory).replace(/"/g, '""')}"`,
      `"${(d.paymentMethodBn || d.paymentMethod).replace(/"/g, '""')}"`,
      d.transactionId,
      d.amount,
      d.status === "COMPLETED" ? "যাচাইকৃত" : "অপেক্ষমাণ",
      d.verificationToken,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `EHRJ_Donations_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Message Alert */}
      {actionMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            actionMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionMsg.text}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Quick Action */}
      <div className="bg-gradient-to-r from-[#052216] via-[#0D5C3A] to-[#083823] text-white p-6 rounded-3xl shadow-lg border border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg">
              <Heart className="w-4 h-4 fill-amber-300 text-amber-300" />
            </span>
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
              অনলাইন ও অফলাইন ডোনেশন লেজার • কিউআর ভেরিফায়েড
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display text-white">
            বার্ষিক মাহফিল, যাকাত ও সদাকাহ অনুদান রসিদ হাব
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
            মাদরাসার লিল্লাহ বোর্ডিং, এতিম তহবিল, বার্ষিক মাহফিল ও দস্তারবন্দী, আসাতাজায়ে কেরাম কল্যাণ এবং মসজিদ-মাদরাসা উন্নয়ন তহবিলের স্বচ্ছ আর্থিক হিসাব ও ডিজিটাল রসিদ।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-emerald-950" />
            <span>নতুন অনুদান ও রসিদ তৈরি</span>
          </button>
          <button
            onClick={fetchDonations}
            disabled={loading}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-3.5 py-2.5 rounded-xl text-xs transition border border-white/10 flex items-center gap-1.5"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards (5 Detailed Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>সর্বমোট সংগ্রহ</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-900 mt-2">
            ৳ {stats?.totalAmount ? stats.totalAmount.toLocaleString("bn-BD") : "০"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            মোট দাতা: <strong className="font-mono text-slate-700">{stats?.totalCount || 0}</strong> জন
          </div>
        </div>

        {/* 2. Orphan & Lillah */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>এতিম ও লিল্লাহ বোর্ডিং</span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-xl">
              <Heart className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black font-mono text-amber-900 mt-2">
            ৳ {stats?.categoryBreakdown?.ORPHAN_LILLAH?.amount ? stats.categoryBreakdown.ORPHAN_LILLAH.amount.toLocaleString("bn-BD") : "০"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            এন্ট্রি: <strong className="font-mono text-slate-700">{stats?.categoryBreakdown?.ORPHAN_LILLAH?.count || 0}</strong> টি
          </div>
        </div>

        {/* 3. Zakat & Sadaqah */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>যাকাত ও সাদাকাহ</span>
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black font-mono text-blue-900 mt-2">
            ৳ {((stats?.categoryBreakdown?.ZAKAT?.amount || 0) + (stats?.categoryBreakdown?.SADAQAH?.amount || 0)).toLocaleString("bn-BD")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            যাকাত: <strong className="font-mono text-slate-700">৳ {(stats?.categoryBreakdown?.ZAKAT?.amount || 0).toLocaleString("bn-BD")}</strong>
          </div>
        </div>

        {/* 4. Annual Mahfil & Staff Welfare */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-sm hover:shadow transition ring-1 ring-emerald-200">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
            <span>বার্ষিক মাহফিল ও কল্যাণ</span>
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black font-mono text-[#0D5C3A] mt-2">
            ৳ {((stats?.categoryBreakdown?.ANNUAL_MAHFIL?.amount || 0) + (stats?.categoryBreakdown?.TEACHER_WELFARE?.amount || 0)).toLocaleString("bn-BD")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            মাহফিল: <strong className="font-mono text-slate-700">৳ {(stats?.categoryBreakdown?.ANNUAL_MAHFIL?.amount || 0).toLocaleString("bn-BD")}</strong>
          </div>
        </div>

        {/* 5. Construction & General */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>উন্নয়ন ও নির্মাণ</span>
            <span className="p-1.5 bg-purple-50 text-purple-700 rounded-xl">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black font-mono text-purple-900 mt-2">
            ৳ {((stats?.categoryBreakdown?.CONSTRUCTION?.amount || 0) + (stats?.categoryBreakdown?.GENERAL?.amount || 0)).toLocaleString("bn-BD")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            নির্মাণ: <strong className="font-mono text-slate-700">৳ {(stats?.categoryBreakdown?.CONSTRUCTION?.amount || 0).toLocaleString("bn-BD")}</strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="রশিদ, দাতা, মোবাইল বা TrxID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchDonations()}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C3A] outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C3A] outline-none bg-slate-50 font-medium"
          >
            <option value="ALL">সকল খাতের অনুদান</option>
            <option value="ANNUAL_MAHFIL">বার্ষিক ওয়াজ মাহফিল ও দস্তারবন্দী</option>
            <option value="TEACHER_WELFARE">আসাতাজায়ে কেরাম ও স্টাফ কল্যাণ</option>
            <option value="ORPHAN_LILLAH">এতিম ও লিল্লাহ বোর্ডিং</option>
            <option value="HIFZ_SPONSOR">হিফজ শিক্ষার্থী স্পন্সর</option>
            <option value="ZAKAT">যাকাত ফান্ড (শরিয়াহ সম্মত)</option>
            <option value="SADAQAH">সাধারণ সাদাকাহ</option>
            <option value="CONSTRUCTION">মাদরাসা নির্মাণ ও উন্নয়ন</option>
            <option value="GENERAL">সাধারণ দান</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C3A] outline-none bg-slate-50 font-medium"
          >
            <option value="ALL">সকল পেমেন্ট মেথড</option>
            <option value="CASH">ক্যাশ / সরাসরি অফিস</option>
            <option value="BKASH">বিকাশ (bKash)</option>
            <option value="NAGAD">নগদ (Nagad)</option>
            <option value="ROCKET">রকেট (Rocket)</option>
            <option value="BANK_TRANSFER">ব্যাংক ডিপোজিট / ট্রান্সফার</option>
          </select>

          <button
            onClick={fetchDonations}
            className="bg-[#0D5C3A] hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-xl text-xs transition"
          >
            ফিল্টার প্রয়োগ
          </button>
        </div>
      </div>

      {/* Main Donations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>অনুদান তালিকা ও ট্রানজেকশন রেজিস্টার</span>
            <span className="bg-emerald-100 text-[#0D5C3A] text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              {donations.length} টি রেকর্ড
            </span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={exportDonationsToCSV}
              className="bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="সকল অনুদান তালিকা এক্সেলে ডাউনলোড করুন"
            >
              <Download className="w-3.5 h-3.5" />
              <span>এক্সেল / CSV এক্সপোর্ট</span>
            </button>
            <button
              onClick={fetchDonations}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">অনুদান তালিকা লোড হচ্ছে...</p>
          </div>
        ) : donations.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Heart className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">কোনো অনুদান রেকর্ড পাওয়া যায়নি।</p>
            <p className="text-[11px] text-slate-400 mt-1">অনুসন্ধান ফিল্টার পরিবর্তন করুন অথবা নতুন অনুদান যুক্ত করুন।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">রশিদ নম্বর ও তারিখ</th>
                  <th className="p-3.5">দাতার তথ্য</th>
                  <th className="p-3.5">অনুদানের খাত</th>
                  <th className="p-3.5">মাধ্যম ও TrxID</th>
                  <th className="p-3.5 text-right">পরিমাণ (টাকা)</th>
                  <th className="p-3.5 text-center">স্ট্যাটাস</th>
                  <th className="p-3.5 text-right">রশিদ ও ভেরিফিকেশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-medium">
                      <div className="font-mono font-bold text-[#0D5C3A]">{d.receiptNumber}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(d.createdAt).toLocaleDateString("bn-BD", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{d.donorName}</span>
                        {d.isAnonymous && (
                          <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.2 rounded font-normal">
                            গোপন
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{d.donorPhone || "N/A"}</span>
                      </div>
                      {d.donorAddress && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{d.donorAddress}</div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-block">
                        {d.fundCategoryBn || d.fundCategory}
                      </span>
                      {d.notes && (
                        <p className="text-[10px] text-slate-500 italic mt-1 line-clamp-1">"{d.notes}"</p>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{d.paymentMethodBn || d.paymentMethod}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {d.transactionId}
                        </span>
                        <button
                          onClick={() => handleCopyTrx(d.transactionId, d.id)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title="TrxID কপি করুন"
                        >
                          {copiedId === d.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5 text-right font-mono font-black text-sm text-slate-900">
                      ৳ {d.amount.toLocaleString("bn-BD")}
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(d)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition inline-flex items-center gap-1 ${
                          d.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        }`}
                        title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                      >
                        {d.status === "COMPLETED" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>যাচাইকৃত</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>অপেক্ষমাণ</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedReceipt(d)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] font-bold px-3 py-1.5 rounded-lg text-xs transition border border-emerald-200 inline-flex items-center gap-1.5 shadow-sm"
                          title="অফিসিয়াল রশিদ ও কিউআর দেখুন"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>রশিদ প্রিন্ট</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDonation(d.id, d.receiptNumber)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="অনুদান রেকর্ড মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD MANUAL DONATION */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Heart className="w-4 h-4 fill-emerald-700" />
                </span>
                <h3 className="font-bold text-base text-slate-900">নতুন অফলাইন / মাহফিল অনুদান এন্ট্রি</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDonation} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">দাতার পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="উদা: হাজী আব্দুল বারী"
                  value={formData.donorName}
                  onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C3A] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    required
                    placeholder="01XXXXXXXXX"
                    value={formData.donorPhone}
                    onChange={(e) => setFormData({ ...formData, donorPhone: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C3A] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">অনুদানের পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="উদা: ৫০০০"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C3A] outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">অনুদানের খাত *</label>
                  <select
                    value={formData.fundCategory}
                    onChange={(e) => setFormData({ ...formData, fundCategory: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C3A] outline-none bg-white font-medium"
                  >
                    <option value="ANNUAL_MAHFIL">বার্ষিক ঐতিহাসিক ওয়াজ মাহফিল ও দস্তারবন্দী তহবিল</option>
                    <option value="TEACHER_WELFARE">আসাতাজায়ে কেরাম ও স্টাফ কল্যাণ তহবিল</option>
                    <option value="ORPHAN_LILLAH">লিল্লাহ বোর্ডিং ও এতিমখানা ফান্ড</option>
                    <option value="HIFZ_SPONSOR">হিফজুল কুরআন স্পন্সরশিপ</option>
                    <option value="ZAKAT">প্রাতিষ্ঠানিক যাকাত ফান্ড (শরিয়াহ সম্মত)</option>
                    <option value="SADAQAH">সাধারণ সাদাকাহ ও দান</option>
                    <option value="CONSTRUCTION">মাদরাসা ও মসজিদ উন্নয়ন তহবিল</option>
                    <option value="GENERAL">সাধারণ প্রাতিষ্ঠানিক ফান্ড</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">পেমেন্ট মেথড *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => {
                      const m = e.target.value;
                      let bn = "ক্যাশ / সরাসরি অফিস";
                      if (m === "BKASH") bn = "বিকাশ (bKash)";
                      if (m === "NAGAD") bn = "নগদ (Nagad)";
                      if (m === "ROCKET") bn = "রকেট (Rocket)";
                      if (m === "BANK_TRANSFER") bn = "ব্যাংক ডিপোজিট / চেক";
                      setFormData({ ...formData, paymentMethod: m, paymentMethodBn: bn });
                    }}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C3A] outline-none bg-white font-medium"
                  >
                    <option value="CASH">ক্যাশ / সরাসরি অফিস</option>
                    <option value="BKASH">বিকাশ (bKash)</option>
                    <option value="NAGAD">নগদ (Nagad)</option>
                    <option value="ROCKET">রকেট (Rocket)</option>
                    <option value="BANK_TRANSFER">ব্যাংক ডিপোজিট / চেক</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ট্রানজেকশন আইডি / রেফারেন্স</label>
                <input
                  type="text"
                  placeholder="উদা: CASH-01 / ডিপোজিট স্লিপ নং..."
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C3A] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">দাতার ঠিকানা / বিবরণ (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="উদা: ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা"
                  value={formData.donorAddress}
                  onChange={(e) => setFormData({ ...formData, donorAddress: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0D5C3A] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="anonCheck"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                  className="rounded text-[#0D5C3A] focus:ring-[#0D5C3A]"
                />
                <label htmlFor="anonCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  নাম গোপন রাখুন (পাবলিক তালিকায় নাম প্রকাশ পাবে না)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow flex items-center gap-1.5"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ ও রসিদ তৈরি"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE OFFICIAL INSTITUTIONAL DONATION VOUCHER / RECEIPT */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 print:shadow-none print:border-none print:m-0 print:p-0">
            {/* Modal Control Bar (Hidden on Print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-[#0D5C3A] rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  অফিসিয়াল দান ও অনুদান রসিদ ভাউচার
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/verify/receipt/${encodeURIComponent(selectedReceipt.verificationToken)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                  title="পাবলিক ডিজিটাল ভেরিফিকেশন পৃষ্ঠা খুলুন"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>যাচাই পৃষ্ঠা</span>
                </a>
                <button
                  onClick={handlePrint}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>রসিদ প্রিন্ট করুন</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Area: Institutional Voucher */}
            <div className="p-6 sm:p-8 border-2 border-[#0D5C3A] rounded-2xl bg-[#FCFAF6] relative overflow-hidden mt-3 print:border-2 print:border-black print:m-0 print:p-6 print:rounded-none">
              {/* Watermark Logo / Motif */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <div className="w-80 h-80 rounded-full border-[20px] border-[#0D5C3A]" />
              </div>

              {/* Islamic Header */}
              <div className="text-center pb-3 border-b-2 border-[#0D5C3A]/30">
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
                  স্থাপিত: ২০২১ ইং (ESTD 2021) • ইসলামী শিক্ষা ও মানবকল্যাণ সংস্থা
                </p>
                <div className="inline-flex items-center gap-2 bg-[#0D5C3A] text-white text-[11px] font-bold px-4 py-0.5 rounded-full mt-2 shadow-sm">
                  <span>দান, সদাকাহ ও মাহফিল তহবিল আদায় রসিদ (অফিসিয়াল কপি)</span>
                </div>
              </div>

              {/* Meta Top Bar */}
              <div className="grid grid-cols-2 gap-3 text-xs py-3.5 border-b border-dashed border-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">রসিদ নম্বর:</span>
                  <span className="font-mono font-black text-[#0D5C3A] text-sm">{selectedReceipt.receiptNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">তারিখ ও সময়:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedReceipt.createdAt).toLocaleDateString("bn-BD", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Donor & Fund Grid with QR Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-b border-dashed border-slate-300 items-center">
                {/* 2 Cols Left for Details */}
                <div className="sm:col-span-2 space-y-3">
                  <div>
                    <span className="text-slate-500 block text-[10px]">সম্মানিত দানকারী / দাতার নাম:</span>
                    <span className="font-black text-slate-900 text-base">{selectedReceipt.donorName}</span>
                    {selectedReceipt.isAnonymous && (
                      <span className="ml-2 bg-slate-200 text-slate-700 text-[9px] px-1.5 py-0.5 rounded font-semibold">
                        গোপন সদাকাহ
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">যোগাযোগ নম্বর:</span>
                      <span className="font-mono text-slate-800 font-semibold">{selectedReceipt.donorPhone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">ঠিকানা / অবস্থান:</span>
                      <span className="text-slate-800 font-medium truncate block">
                        {selectedReceipt.donorAddress || "—"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">অনুদানের নির্দিষ্ট উদ্দেশ্য / খাত:</span>
                    <strong className="text-xs text-[#063320] font-black block bg-emerald-100/60 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                      {selectedReceipt.fundCategoryBn}
                    </strong>
                  </div>

                  <div className="text-xs">
                    <span className="text-slate-500 block text-[10px]">পরিশোধ মাধ্যম ও ট্রানজেকশন ID:</span>
                    <span className="text-slate-800 font-medium">
                      {selectedReceipt.paymentMethodBn} | <strong className="font-mono text-slate-900">{selectedReceipt.transactionId}</strong>
                    </span>
                  </div>
                </div>

                {/* 1 Col Right for Verifiable QR */}
                <div className="sm:col-span-1 flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Donation Verification QR"
                      className="w-28 h-28 object-contain"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                      QR লোড হচ্ছে...
                    </div>
                  )}
                  <span className="text-[9px] text-slate-500 font-bold mt-1.5 block">
                    ডিজিটাল সত্যতা যাচাই QR
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono">
                    {selectedReceipt.verificationToken}
                  </span>
                </div>
              </div>

              {/* Amount Highlight */}
              <div className="my-4 bg-emerald-900 text-white p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[11px] text-emerald-200 font-medium block">আদায়কৃত অর্থের পরিমাণ:</span>
                  <span className="text-xs text-white/90 font-serif">
                    মাদরাসার তহবিল হিসাবে নগদ/ডিজিটাল মাধ্যমে প্রাপ্ত
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-mono font-black text-amber-300">
                    ৳ {selectedReceipt.amount.toLocaleString("bn-BD")}
                  </span>
                  <span className="text-[10px] text-emerald-200 block font-mono">টাকা মাত্র</span>
                </div>
              </div>

              {/* Islamic Dua */}
              <div className="text-center text-[11px] text-slate-700 bg-white p-3 rounded-xl border border-slate-200 my-3">
                <p className="font-serif text-[#0D5C3A] font-black text-xs mb-0.5">
                  جَزَاكُمُ اللّٰهُ خَيْرًا فِي الدُّنْيَا وَالْآخِرَةِ
                </p>
                <p>
                  আল্লাহ তা'আলা আপনার এই নেক দানকে কবুল করে দ্বীন ও ইলমের প্রসারে বরকত দান করুন এবং আখেরাতে নাজাতের উসিলা বানান। আমিন।
                </p>
              </div>

              {/* Dual Signatures */}
              <div className="pt-10 flex items-end justify-between text-xs text-slate-700">
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-600 block">আদায়কারী / হিসাবরক্ষক</span>
                  <span className="text-[9px] text-slate-400">হিসাব ও অর্থ দফতর</span>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] font-bold text-slate-800 block">{INSTITUTION_INFO.principal}</span>
                  <span className="text-[9px] text-slate-500 block">মুহতামিম / অধ্যক্ষ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
