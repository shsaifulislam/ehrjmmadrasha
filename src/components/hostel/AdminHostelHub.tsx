"use client";

import React, { useState, useEffect } from "react";
import {
  Home,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRightLeft,
  Calendar,
  DollarSign,
  FileText,
  Search,
  Filter,
  Plus,
  AlertCircle,
  RefreshCw,
  LogOut,
  LogIn,
  Check,
  X,
  Settings,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export default function AdminHostelHub() {
  const [activeTab, setActiveTab] = useState<"overview" | "residents" | "requests" | "history" | "reports" | "settings">("overview");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Residents State
  const [residents, setResidents] = useState<any[]>([]);
  const [residentsLoading, setResidentsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [residentialFilter, setResidentialFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Requests State
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestFilter, setRequestFilter] = useState("");

  // History State
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Settings / Rules State
  const [rules, setRules] = useState<any>(null);
  const [rulesSaving, setRulesSaving] = useState(false);

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [checkInModal, setCheckInModal] = useState(false);
  const [checkOutModal, setCheckOutModal] = useState(false);
  const [statusChangeModal, setStatusChangeModal] = useState(false);
  const [reviewRequestModal, setReviewRequestModal] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Action Form States
  const [roomLabel, setRoomLabel] = useState("");
  const [seatLabel, setSeatLabel] = useState("");
  const [checkInNotes, setCheckInNotes] = useState("");
  const [checkOutReason, setCheckOutReason] = useState("");
  const [checkOutNotes, setCheckOutNotes] = useState("");
  const [targetStatus, setTargetStatus] = useState<"RESIDENTIAL" | "DAY_CARE" | "NON_RESIDENTIAL">("RESIDENTIAL");
  const [statusReason, setStatusReason] = useState("");
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/hostel/stats");
      const data = await res.json();
      if (res.ok) setStats(data.stats);
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Residents
  const fetchResidents = async () => {
    setResidentsLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (residentialFilter) query.set("residentialStatus", residentialFilter);
      query.set("page", String(page));
      query.set("limit", "15");

      const res = await fetch(`/api/admin/hostel/residents?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setResidents(data.students || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Residents fetch error:", err);
    } finally {
      setResidentsLoading(false);
    }
  };

  // Fetch Requests
  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const query = new URLSearchParams();
      if (requestFilter) query.set("status", requestFilter);
      const res = await fetch(`/api/admin/hostel/requests?${query.toString()}`);
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } catch (err) {
      console.error("Requests fetch error:", err);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Fetch History
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/hostel/reports?type=history");
      const data = await res.json();
      if (res.ok) setHistory(data.histories || []);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch Rules
  const fetchRules = async () => {
    try {
      const res = await fetch("/api/admin/hostel/rules");
      const data = await res.json();
      if (res.ok && data.rule) setRules(data.rule);
    } catch (err) {
      console.error("Rules fetch error:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "residents") fetchResidents();
    if (activeTab === "requests") fetchRequests();
    if (activeTab === "history") fetchHistory();
    if (activeTab === "settings") fetchRules();
  }, [activeTab, page, residentialFilter, requestFilter]);

  // Execute Check-in
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/hostel/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          roomOrWardLabel: roomLabel,
          bedOrSeatLabel: seatLabel,
          notes: checkInNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: data.message });
        setCheckInModal(false);
        fetchStats();
        fetchResidents();
      } else {
        setFeedback({ type: "error", message: data.error });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "ত্রুটি ঘটেছে।" });
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Check-out
  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/hostel/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          reason: checkOutReason,
          notes: checkOutNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: data.message });
        setCheckOutModal(false);
        fetchStats();
        fetchResidents();
      } else {
        setFeedback({ type: "error", message: data.error });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "ত্রুটি ঘটেছে।" });
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Status Change
  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/hostel/status-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          targetStatus,
          reason: statusReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: data.message });
        setStatusChangeModal(false);
        fetchStats();
        fetchResidents();
      } else {
        setFeedback({ type: "error", message: data.error });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "ত্রুটি ঘটেছে।" });
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Request Review
  const handleReviewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRequestModal) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/hostel/requests/${reviewRequestModal.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: reviewAction,
          adminNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: data.message });
        setReviewRequestModal(null);
        fetchRequests();
        fetchStats();
      } else {
        setFeedback({ type: "error", message: data.error });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "ত্রুটি ঘটেছে।" });
    } finally {
      setActionLoading(false);
    }
  };

  // Save Rules
  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rules) return;
    setRulesSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/hostel/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: rules.sessionId,
          monthlyHostelFee: rules.monthlyHostelFee,
          monthlyFoodFee: rules.monthlyFoodFee,
          admissionHostelFee: rules.admissionHostelFee,
          rulesNotesBn: rules.rulesNotesBn,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: data.message });
      } else {
        setFeedback({ type: "error", message: data.error });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "সংরক্ষণে ত্রুটি ঘটেছে।" });
    } finally {
      setRulesSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-[#083B25] to-[#0D5C3A] text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-800/80 border border-emerald-600/30 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                ফেজ ১০ — আবাসিক ও দারুল ইকামা
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 font-display">
              হোস্টেল ও আবাসিক ব্যবস্থাপনা
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl">
              শিক্ষার্থীদের আবাসিক চেক-ইন, চেক-আউট, স্ট্যাটাস পরিবর্তন, ইতিহাস এবং অভিভাবক আবেদনের সার্বিক মনিটরিং ককপিট।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchStats();
                if (activeTab === "residents") fetchResidents();
                if (activeTab === "requests") fetchRequests();
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
            </button>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-2">
        {[
          { key: "overview", label: "সারসংক্ষেপ ও ড্যাশবোর্ড", icon: Home },
          { key: "residents", label: "শিক্ষার্থী তালিকা ও চেক-ইন", icon: Users },
          { key: "requests", label: "অভিভাবক আবেদন", icon: Clock },
          { key: "history", label: "আবাসিক ইতিহাস লগ", icon: FileText },
          { key: "settings", label: "নীতিমালা ও ফি সেটিং", icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key as any);
                setFeedback(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                isActive
                  ? "bg-[#0D5C3A] text-white shadow"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.key === "requests" && stats?.pendingRequests > 0 && (
                <span className="bg-amber-400 text-amber-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                  {stats.pendingRequests}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-xs text-gray-500 font-medium">আবাসিক শিক্ষার্থী</span>
              <div className="text-2xl font-bold text-emerald-800 font-display">
                {stats?.residentialStudents ?? "..."}
              </div>
              <p className="text-[11px] text-gray-400">সক্রিয় বাসিন্দা</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-xs text-gray-500 font-medium">ডে-কেয়ার শিক্ষার্থী</span>
              <div className="text-2xl font-bold text-blue-700 font-display">
                {stats?.dayCareStudents ?? "..."}
              </div>
              <p className="text-[11px] text-blue-500">খাবার ফি সম্পূর্ণ মওকুফ (৳০)</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-xs text-gray-500 font-medium">অনাবাসিক শিক্ষার্থী</span>
              <div className="text-2xl font-bold text-gray-700 font-display">
                {stats?.nonResidentialStudents ?? "..."}
              </div>
              <p className="text-[11px] text-gray-400">হোস্টেল ফি মুক্ত</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-xs text-gray-500 font-medium">আজকের চেক-ইন / আউট</span>
              <div className="text-2xl font-bold text-purple-700 font-display">
                {stats?.todayCheckIns ?? 0} / {stats?.todayCheckOuts ?? 0}
              </div>
              <p className="text-[11px] text-gray-400">দৈনিক ট্র্যাকিং</p>
            </div>
          </div>

          {/* Secondary Row: Finance & Pending Requests */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Financial Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-700" /> হোস্টেল ও খাবার ফি সামারি
                </h3>
                <span className="text-[11px] text-gray-400">ফেজ ৬ ইন্টিগ্রেশন</span>
              </div>
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">মোট ধার্যকৃত বিল:</span>
                  <span className="font-bold text-gray-900">৳{stats?.finance?.totalBilled ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">আদায়কৃত অর্থ:</span>
                  <span className="font-bold text-emerald-700">৳{stats?.finance?.totalPaid ?? 0}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">বকেয়া পাওনা:</span>
                  <span className="font-bold text-red-600">৳{stats?.finance?.totalDue ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Pending Requests Alert */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" /> অপেক্ষমাণ অভিভাবক আবেদন
                </h3>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {stats?.pendingRequests ?? 0} আবেদন
                </span>
              </div>
              <p className="text-xs text-gray-500">
                অভিভাবকগণ পোর্টাল থেকে আবাসিক ভর্তি, অনাবাসিক পরিবর্তন বা চেক-আউটের যে আবেদন দাখিল করেছেন তা পর্যালোচনার জন্য অপেক্ষমাণ।
              </p>
              <button
                onClick={() => setActiveTab("requests")}
                className="w-full mt-2 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center justify-center gap-1"
              >
                আবেদনসমূহ পর্যালোচনা করুন <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Invariant Policy Notice */}
            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-2">
              <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-700" /> প্রাতিষ্ঠানিক পলিসি ও নিরাপত্তা
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                • <strong>ডে-কেয়ার পলিসি:</strong> ডে-কেয়ার শিক্ষার্থীদের খাবার ফি সফটওয়্যার কর্তৃক স্বয়ংক্রিয়ভাবে ৳০ (সম্পূর্ণ মওকুফ) ধার্য হয়।
              </p>
              <p className="text-xs text-emerald-800 leading-relaxed">
                • <strong>ঐতিহাসিক অপরিবর্তনীয়তা:</strong> শিক্ষার্থীর স্ট্যাটাস পরিবর্তন অতীত ইনভয়েসকে পরিবর্তন করে না, শুধুমাত্র ভবিষ্যৎ বিলিং প্রভাবিত করে।
              </p>
            </div>
          </div>

          {/* Recent Residential Activity Feed */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0D5C3A]" /> সাম্প্রতিক আবাসিক পরিবর্তন ও চেক-ইন লগ
            </h3>
            {stats?.recentHistories?.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">কোনো সাম্প্রতিক রেকর্ড পাওয়া যায়নি।</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats?.recentHistories?.map((h: any) => (
                  <div key={h.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900">{h.student?.fullNameBn}</span>
                      <span className="text-gray-400 font-mono ml-2">({h.student?.studentIdNumber})</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {h.previousStatus} <span className="text-emerald-700 font-bold">→</span> {h.newStatus} • {h.reason}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-gray-400">{new Date(h.createdAt).toLocaleDateString("bn-BD")}</span>
                      <p className="text-[10px] text-gray-400 font-mono">দ্বারা: {h.recordedByUser?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RESIDENTS & STUDENTS */}
      {activeTab === "residents" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base font-display">শিক্ষার্থী ও আবাসিক তালিকা</h3>
              <p className="text-xs text-gray-500">ফিল্টার করে দ্রুত চেক-ইন, চেক-আউট বা আবাসিক মর্যাদা পরিবর্তন করুন।</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="নাম / আইডি / মোবাইল..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchResidents()}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <select
                value={residentialFilter}
                onChange={(e) => {
                  setResidentialFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">সকল স্ট্যাটাস</option>
                <option value="RESIDENTIAL">আবাসিক (Residential)</option>
                <option value="DAY_CARE">ডে-কেয়ার (Day Care)</option>
                <option value="NON_RESIDENTIAL">অনাবাসিক (Non-Residential)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">শিক্ষার্থী</th>
                  <th className="py-3 px-3">জামাত ও রোল</th>
                  <th className="py-3 px-3">আবাসিক অবস্থা</th>
                  <th className="py-3 px-3">হোস্টেল নোট / আসন</th>
                  <th className="py-3 px-3">অভিভাবক</th>
                  <th className="py-3 px-4 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {residentsLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : residents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      কোনো শিক্ষার্থী পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  residents.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{s.fullNameBn}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{s.studentIdNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-gray-800">{s.class}</div>
                        <div className="text-[11px] text-gray-400">রোল: {s.rollNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.residentialStatus === "RESIDENTIAL"
                              ? "bg-emerald-100 text-emerald-800"
                              : s.residentialStatus === "DAY_CARE"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {s.residentialStatus === "RESIDENTIAL"
                            ? "আবাসিক"
                            : s.residentialStatus === "DAY_CARE"
                            ? "ডে-কেয়ার"
                            : "অনাবাসিক"}
                        </span>
                        {s.currentEnrollment?.status && (
                          <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                            {s.currentEnrollment.status}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {s.currentEnrollment?.roomOrWardLabel ? (
                          <div>
                            <span className="font-medium text-gray-800">{s.currentEnrollment.roomOrWardLabel}</span>
                            {s.currentEnrollment.bedOrSeatLabel && (
                              <span className="text-gray-500 font-mono text-[10px] ml-1">
                                [{s.currentEnrollment.bedOrSeatLabel}]
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">নির্ধারিত নয়</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        <div>{s.guardianName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{s.guardianPhone}</div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {s.residentialStatus !== "RESIDENTIAL" ? (
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setCheckInModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold transition"
                          >
                            চেক-ইন
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setCheckOutModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-[11px] font-semibold transition"
                          >
                            চেক-আউট
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setTargetStatus(s.residentialStatus === "RESIDENTIAL" ? "NON_RESIDENTIAL" : "RESIDENTIAL");
                            setStatusChangeModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-semibold transition"
                        >
                          স্ট্যাটাস পরিবর্তন
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center text-xs text-gray-500 pt-2">
            <span>পৃষ্ঠা {page} / {totalPages}</span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40"
              >
                পূর্ববর্তী
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40"
              >
                পরবর্তী
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GUARDIAN REQUESTS */}
      {activeTab === "requests" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base font-display">অভিভাবক আবাসিক আবেদনসমূহ</h3>
              <p className="text-xs text-gray-500">অনলাইনে জমাকৃত হোস্টেল ভর্তি, স্ট্যাটাস পরিবর্তন ও চেক-আউট আবেদন।</p>
            </div>

            <select
              value={requestFilter}
              onChange={(e) => setRequestFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">সকল আবেদন</option>
              <option value="SUBMITTED">অপেক্ষমাণ (SUBMITTED)</option>
              <option value="APPROVED">অনুমোদিত (APPROVED)</option>
              <option value="REJECTED">প্রত্যাখ্যাত (REJECTED)</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">ট্র্যাকিং নম্বর</th>
                  <th className="py-3 px-3">শিক্ষার্থী</th>
                  <th className="py-3 px-3">আবেদনের ধরন</th>
                  <th className="py-3 px-3">প্রার্থিত স্ট্যাটাস</th>
                  <th className="py-3 px-3">কারণ / নোট</th>
                  <th className="py-3 px-3">অবস্থা</th>
                  <th className="py-3 px-4 text-right">সিদ্ধান্ত</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requestsLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      কোনো আবেদন পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{r.requestNumber}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900">{r.student?.fullNameBn}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{r.student?.studentIdNumber}</div>
                      </td>
                      <td className="py-3 px-3 text-gray-700 font-medium">
                        {r.requestType === "ADMISSION"
                          ? "হোস্টেল ভর্তি"
                          : r.requestType === "STATUS_CHANGE"
                          ? "স্ট্যাটাস পরিবর্তন"
                          : r.requestType === "CHECKOUT"
                          ? "চেক-আউট"
                          : r.requestType}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-emerald-800">{r.requestedStatus}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 max-w-xs truncate">{r.reason}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.status === "SUBMITTED" && (
                          <button
                            onClick={() => {
                              setReviewRequestModal(r);
                              setAdminNotes("");
                              setReviewAction("APPROVE");
                            }}
                            className="px-3 py-1 rounded-lg bg-[#0D5C3A] hover:bg-emerald-800 text-white font-semibold text-[11px] transition shadow-sm"
                          >
                            পর্যালোচনা
                          </button>
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

      {/* TAB 4: IMMUTABLE RESIDENTIAL HISTORY */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base font-display">অপরিবর্তনীয় আবাসিক ইতিহাস লগ</h3>
            <p className="text-xs text-gray-500">সকল চেক-ইন, চেক-আউট ও স্ট্যাটাস রূপান্তরের প্রাতিষ্ঠানিক অডিট ট্রেইল।</p>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">তারিখ ও সময়</th>
                  <th className="py-3 px-3">শিক্ষার্থী</th>
                  <th className="py-3 px-3">স্ট্যাটাস রূপান্তর</th>
                  <th className="py-3 px-3">কার্যকর তারিখ</th>
                  <th className="py-3 px-3">কারণ / বিবরণ</th>
                  <th className="py-3 px-4 text-right">নথিভুক্তকারী</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      কোনো ইতিহাস পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {new Date(h.createdAt).toLocaleString("bn-BD")}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900">{h.student?.fullNameBn}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{h.student?.studentIdNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-gray-500">{h.previousStatus}</span>
                        <span className="text-emerald-700 font-bold mx-1.5">→</span>
                        <span className="font-bold text-gray-900">{h.newStatus}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        {new Date(h.effectiveDate).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        <div className="font-medium text-gray-800">{h.reason}</div>
                        {h.notes && <div className="text-[11px] text-gray-400 mt-0.5">{h.notes}</div>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">
                        {h.recordedByUser?.name}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS & RULES */}
      {activeTab === "settings" && rules && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-2xl space-y-5">
          <div>
            <h3 className="font-bold text-gray-900 text-base font-display">হোস্টেল ও আবাসিক নীতিমালা কনফিগারেশন</h3>
            <p className="text-xs text-gray-500">শিক্ষাবর্ষভিত্তিক আবাসিক ফি ও নীতিমালা নির্ধারণ।</p>
          </div>

          <form onSubmit={handleSaveRules} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">মাসিক হোস্টেল/সিট ফি (টাকা)</label>
              <input
                type="number"
                value={rules.monthlyHostelFee || ""}
                onChange={(e) => setRules({ ...rules, monthlyHostelFee: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">মাসিক খাবার ফি (টাকা)</label>
              <input
                type="number"
                value={rules.monthlyFoodFee || ""}
                onChange={(e) => setRules({ ...rules, monthlyFoodFee: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <p className="text-[10px] text-emerald-700 mt-1">
                * মনে রাখবেন, ডে-কেয়ার শিক্ষার্থীদের জন্য খাবার ফি নিয়মানুযায়ী সর্বদাই ৳০ থাকবে।
              </p>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">হোস্টেল ভর্তি ফি (টাকা)</label>
              <input
                type="number"
                value={rules.admissionHostelFee || ""}
                onChange={(e) => setRules({ ...rules, admissionHostelFee: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">নীতিমালার প্রাতিষ্ঠানিক নির্দেশনাবলী</label>
              <textarea
                rows={3}
                value={rules.rulesNotesBn || ""}
                onChange={(e) => setRules({ ...rules, rulesNotesBn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={rulesSaving}
              className="px-5 py-2.5 rounded-xl bg-[#0D5C3A] hover:bg-emerald-800 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              {rulesSaving ? "সংরক্ষণ হচ্ছে..." : "নীতিমালা সংরক্ষণ করুন"}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: CHECK-IN */}
      {checkInModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 font-display text-sm">হোস্টেল চেক-ইন</h3>
              <button onClick={() => setCheckInModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl text-xs space-y-1">
              <div className="font-bold text-emerald-950">{selectedStudent.fullNameBn}</div>
              <div className="text-emerald-800 font-mono text-[11px]">{selectedStudent.studentIdNumber} • {selectedStudent.class}</div>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-gray-700 block mb-1">কক্ষ বা ভবনের বিবরণ (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: ভবন-১, নিচতলা"
                  value={roomLabel}
                  onChange={(e) => setRoomLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-medium text-gray-700 block mb-1">সিট বা বিছানা রেফারেন্স (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: সিট-০৩"
                  value={seatLabel}
                  onChange={(e) => setSeatLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-medium text-gray-700 block mb-1">মন্তব্য</label>
                <textarea
                  rows={2}
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckInModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-[#0D5C3A] hover:bg-emerald-800 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? "প্রক্রিয়াধীন..." : "চেক-ইন নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHECK-OUT */}
      {checkOutModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 font-display text-sm text-red-700">হোস্টেল চেক-আউট</h3>
              <button onClick={() => setCheckOutModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="bg-red-50 p-3 rounded-xl text-xs space-y-1">
              <div className="font-bold text-red-950">{selectedStudent.fullNameBn}</div>
              <div className="text-red-800 font-mono text-[11px]">{selectedStudent.studentIdNumber} • বর্তমান স্ট্যাটাস: আবাসিক</div>
            </div>

            <form onSubmit={handleCheckOut} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-gray-700 block mb-1">চেক-আউটের কারণ *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: অনাবাসিক জামাতে স্থানান্তর / অভিভাবকের অনুরোধ"
                  value={checkOutReason}
                  onChange={(e) => setCheckOutReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="font-medium text-gray-700 block mb-1">প্রশাসনিক মন্তব্য</label>
                <textarea
                  rows={2}
                  value={checkOutNotes}
                  onChange={(e) => setCheckOutNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-500">
                * চেক-আউটের পর শিক্ষার্থী স্বয়ংক্রিয়ভাবে 'অনাবাসিক' মর্যাদা লাভ করবে। পূর্বের পরিশোধিত/বকেয়া ইনভয়েসসমূহ অপরিবর্তিত থাকবে।
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckOutModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? "প্রক্রিয়াধীন..." : "চেক-আউট সম্পন্ন করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STATUS CHANGE */}
      {statusChangeModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 font-display text-sm">আবাসিক স্ট্যাটাস পরিবর্তন</h3>
              <button onClick={() => setStatusChangeModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1">
              <div className="font-bold text-gray-900">{selectedStudent.fullNameBn}</div>
              <div className="text-gray-500 font-mono text-[11px]">
                বর্তমান অবস্থা: <span className="font-bold text-emerald-800">{selectedStudent.residentialStatus}</span>
              </div>
            </div>

            <form onSubmit={handleStatusChange} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-gray-700 block mb-1">নতুন আবাসিক মর্যাদা *</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="RESIDENTIAL">আবাসিক (Residential)</option>
                  <option value="DAY_CARE">ডে-কেয়ার (Day Care)</option>
                  <option value="NON_RESIDENTIAL">অনাবাসিক (Non-Residential)</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-gray-700 block mb-1">পরিবর্তনের কারণ *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: অভিভাবকের লিখিত আবেদন / জামাত পরিবর্তনের প্রেক্ষিতে"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusChangeModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-[#0D5C3A] hover:bg-emerald-800 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW REQUEST */}
      {reviewRequestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 font-display text-sm">আবাসিক আবেদন পর্যালোচনা</h3>
              <button onClick={() => setReviewRequestModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl text-xs space-y-1">
              <div className="font-mono text-gray-500 text-[10px]">আবেদন নম্বর: {reviewRequestModal.requestNumber}</div>
              <div className="font-bold text-amber-950">{reviewRequestModal.student?.fullNameBn}</div>
              <div className="text-amber-800">
                প্রার্থিত স্ট্যাটাস: <span className="font-bold">{reviewRequestModal.requestedStatus}</span>
              </div>
              <div className="text-gray-600 pt-1 text-[11px]">কারণ: {reviewRequestModal.reason}</div>
            </div>

            <form onSubmit={handleReviewRequest} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-gray-700 block mb-1">প্রশাসনিক সিদ্ধান্ত *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      checked={reviewAction === "APPROVE"}
                      onChange={() => setReviewAction("APPROVE")}
                    />
                    <span className="font-bold text-emerald-800">অনুমোদন (Approve)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      checked={reviewAction === "REJECT"}
                      onChange={() => setReviewAction("REJECT")}
                    />
                    <span className="font-bold text-red-700">প্রত্যাখ্যান (Reject)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-medium text-gray-700 block mb-1">অ্যাডমিন নোট / কারণ</label>
                <textarea
                  rows={2}
                  placeholder="অভিভাবকের কাছে প্রেরিতব্য নোট..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewRequestModal(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-xl text-white font-bold disabled:opacity-50 ${
                    reviewAction === "APPROVE" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionLoading ? "সংরক্ষণ হচ্ছে..." : "সিদ্ধান্ত সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
