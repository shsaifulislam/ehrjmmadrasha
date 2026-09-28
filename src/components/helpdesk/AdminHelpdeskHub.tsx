"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LifeBuoy,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Paperclip,
  Lock,
  Send,
  Plus,
  ArrowRight,
  Eye,
  RefreshCw,
  Printer,
  ChevronDown,
  User,
  Shield,
  HelpCircle,
  Tag,
  Calendar,
  Phone,
  Layers,
  BarChart2,
  Check,
  X,
} from "lucide-react";

export default function AdminHelpdeskHub() {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "QUEUE" | "CATEGORIES" | "REPORTS">("OVERVIEW");
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Queue state
  const [requests, setRequests] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Categories
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatCode, setNewCatCode] = useState("");
  const [newCatNameBn, setNewCatNameBn] = useState("");
  const [newCatNameEn, setNewCatNameEn] = useState("");
  const [newCatSlaHours, setNewCatSlaHours] = useState("48");
  const [newCatDesc, setNewCatDesc] = useState("");

  // Selected Ticket Detail Modal
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Message & Status inputs inside detail
  const [replyContent, setReplyContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Status Change Modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Report state
  const [reportsData, setReportsData] = useState<any>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/helpdesk/stats");
      const json = await res.json();
      if (json.success) {
        setStats(json.stats);
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/admin/helpdesk/categories?includeInactive=true");
      const json = await res.json();
      if (json.success) {
        setCategories(json.categories);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch Requests Queue
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("categoryCode", categoryFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (typeFilter) params.set("requestType", typeFilter);

      const res = await fetch(`/api/admin/helpdesk/requests?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRequests(json.items || []);
        setTotalCount(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error loading requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  }, [page, searchTerm, statusFilter, categoryFilter, priorityFilter, typeFilter]);

  // Fetch Reports
  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const res = await fetch("/api/admin/helpdesk/reports");
      const json = await res.json();
      if (json.success) {
        setReportsData(json.report);
      }
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCategories();
  }, [fetchStats, fetchCategories]);

  useEffect(() => {
    if (activeTab === "QUEUE") {
      fetchRequests();
    } else if (activeTab === "REPORTS") {
      fetchReports();
    }
  }, [activeTab, fetchRequests, fetchReports]);

  // Open Ticket Detail
  const handleOpenDetail = async (id: string) => {
    setSelectedTicketId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/helpdesk/requests/${id}`);
      const json = await res.json();
      if (json.success) {
        setTicketDetail(json.ticket);
      }
    } catch (err) {
      console.error("Error loading ticket detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Submit Message / Internal Note
  const handleSendReply = async () => {
    if (!selectedTicketId || !replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/admin/helpdesk/requests/${selectedTicketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent,
          isInternal: isInternalNote,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setReplyContent("");
        setIsInternalNote(false);
        // Refresh detail
        handleOpenDetail(selectedTicketId);
      } else {
        alert(json.error || "বার্তা প্রেরণ ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Update Status
  const handleUpdateStatus = async (toStatus: string, notes?: string, resolution?: string) => {
    if (!selectedTicketId) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/helpdesk/requests/${selectedTicketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toStatus,
          notes: notes || undefined,
          resolutionSummary: resolution || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowResolveModal(false);
        setResolutionSummary("");
        setStatusNotes("");
        handleOpenDetail(selectedTicketId);
        fetchStats();
        if (activeTab === "QUEUE") fetchRequests();
      } else {
        alert(json.error || "স্ট্যাটাস পরিবর্তন সম্ভব হয়নি।");
      }
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatCode || !newCatNameBn) return;
    try {
      const res = await fetch("/api/admin/helpdesk/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCatCode,
          nameBn: newCatNameBn,
          nameEn: newCatNameEn,
          slaHours: parseInt(newCatSlaHours) || 48,
          description: newCatDesc,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddCategoryModal(false);
        setNewCatCode("");
        setNewCatNameBn("");
        setNewCatNameEn("");
        setNewCatDesc("");
        fetchCategories();
      } else {
        alert(json.error || "ক্যাটাগরি তৈরি ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    }
  };

  // Helper Labels & Badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">দাখিলকৃত</span>;
      case "UNDER_REVIEW":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">পর্যালোচনাধীন</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">প্রক্রিয়াধীন</span>;
      case "WAITING_FOR_INFORMATION":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">তথ্য প্রয়োজন</span>;
      case "RESOLVED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">মীমাংসিত</span>;
      case "CLOSED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">বন্ধ</span>;
      case "REJECTED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">প্রত্যাখ্যাত</span>;
      case "REOPEN_REQUESTED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">পুনর্বিবেচনা আবেদন</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white animate-pulse">জরুরি</span>;
      case "IMPORTANT":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500 text-white">গুরুত্বপূর্ণ</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-700 text-white">সাধারণ</span>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "COMPLAINT": return "অভিযোগ";
      case "SERVICE_REQUEST": return "সার্ভিস রিকুয়েস্ট";
      case "CORRECTION_REQUEST": return "তথ্য সংশোধন";
      case "SUPPORT_REQUEST": return "সহায়তা";
      case "FEEDBACK": return "মতামত";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-[#083B25] via-[#0B4A2F] to-[#083B25] text-white p-5 rounded-xl border-2 border-[#C59B27] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-[#C59B27] flex items-center justify-center shadow-inner">
            <LifeBuoy className="w-7 h-7 text-[#fef08a]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <span>হেল্পডেস্ক ও অভিযোগ ইঞ্জিন (Phase 14)</span>
              <span className="bg-[#C59B27] text-white text-[10px] px-2 py-0.5 rounded-full font-sans uppercase tracking-wider">
                Case Management
              </span>
            </h2>
            <p className="text-xs text-emerald-200 mt-0.5">
              অভিভাবক, শিক্ষক ও শিক্ষার্থীদের প্রাতিষ্ঠানিক অভিযোগ ও অনুরোধ কেন্দ্রীয় পর্যবেক্ষণ প্ল্যাটফর্ম
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#052618]/70 p-1.5 rounded-lg border border-emerald-800">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === "OVERVIEW"
                ? "bg-[#C59B27] text-white shadow font-semibold"
                : "text-emerald-100 hover:bg-white/10"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>ওভারভিউ</span>
          </button>
          <button
            onClick={() => setActiveTab("QUEUE")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 relative ${
              activeTab === "QUEUE"
                ? "bg-[#C59B27] text-white shadow font-semibold"
                : "text-emerald-100 hover:bg-white/10"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>অনুরোধ কিউ</span>
            {stats?.openRequests > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold">
                {stats.openRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("CATEGORIES")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === "CATEGORIES"
                ? "bg-[#C59B27] text-white shadow font-semibold"
                : "text-emerald-100 hover:bg-white/10"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>ক্যাটাগরি ও SLA</span>
          </button>
          <button
            onClick={() => setActiveTab("REPORTS")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === "REPORTS"
                ? "bg-[#C59B27] text-white shadow font-semibold"
                : "text-emerald-100 hover:bg-white/10"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>রিপোর্ট ও অ্যানালিটিক্স</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: OVERVIEW & DASHBOARD METRICS */}
      {/* ================================================================= */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-[#C59B27] transition">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">মোট অনুরোধ</span>
                <LifeBuoy className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-[#083B25]">
                {loadingStats ? "..." : stats?.totalRequests || 0}
              </p>
              <span className="text-[10px] text-gray-400">সর্বমোট টিকিট সংখ্যা</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-[#C59B27] transition">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">অমীমাংসিত (Open)</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600">
                {loadingStats ? "..." : stats?.openRequests || 0}
              </p>
              <span className="text-[10px] text-amber-600/70 font-medium">প্রক্রিয়াধীন ও অমীমাংসিত</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-[#C59B27] transition">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">আজকের নতুন</span>
                <Plus className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {loadingStats ? "..." : stats?.newToday || 0}
              </p>
              <span className="text-[10px] text-gray-400">আজ দাখিল হয়েছে</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-[#C59B27] transition">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium text-red-600 font-semibold">জরুরি অগ্রাধিকার</span>
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">
                {loadingStats ? "..." : stats?.urgentRequests || 0}
              </p>
              <span className="text-[10px] text-red-500 font-medium">তাৎক্ষণিক পর্যালোচনা প্রয়োজন</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-[#C59B27] transition">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">আজ নিষ্পত্তি</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-700">
                {loadingStats ? "..." : stats?.resolvedToday || 0}
              </p>
              <span className="text-[10px] text-emerald-600/80">সফলভাবে মীমাংসা</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-[#C59B27] transition">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-medium">গড় সমাধান সময়</span>
                <RefreshCw className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-700">
                {loadingStats ? "..." : `${stats?.avgResolutionHours || 0}h`}
              </p>
              <span className="text-[10px] text-gray-400">দাখিল থেকে নিষ্পত্তি</span>
            </div>
          </div>

          {/* SLA Alert banner if breaches exist */}
          {stats?.slaBreachedCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between text-red-800">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">
                    সতর্কতা: {stats.slaBreachedCount} টি টিকিটের SLA লক্ষ্যমাত্রা অতিক্রান্ত হয়েছে!
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    অভিভাবকদের দ্রুত সন্তোষজনক সেবা প্রদানে বিলম্বিত টিকিটগুলো অনতিবিলম্বে নিষ্পত্তি করুন।
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStatusFilter("IN_PROGRESS");
                  setActiveTab("QUEUE");
                }}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition"
              >
                টিকিট কিউ দেখুন
              </button>
            </div>
          )}

          {/* Distribution & Recent Tickets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category breakdown */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-sm text-[#083B25] mb-3 flex items-center justify-between border-b pb-2">
                <span>বিষয়ভিত্তিক বিতরণ (Category Distribution)</span>
                <Tag className="w-4 h-4 text-gray-400" />
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {stats?.categoryDistribution?.map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-700">{cat.nameBn}</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full font-bold">
                      {cat.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Requests list */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b pb-2">
                <h3 className="font-bold text-sm text-[#083B25] flex items-center gap-2">
                  <span>সাম্প্রতিক দাখিলকৃত অনুরোধসমূহ</span>
                </h3>
                <button
                  onClick={() => setActiveTab("QUEUE")}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                >
                  <span>সব দেখুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {stats?.recentRequests && stats.recentRequests.length > 0 ? (
                  stats.recentRequests.map((req: any) => (
                    <div
                      key={req.id}
                      onClick={() => handleOpenDetail(req.id)}
                      className="py-3 flex items-center justify-between hover:bg-emerald-50/50 px-2 rounded-lg cursor-pointer transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                            {req.ticketNumber}
                          </span>
                          <span className="font-medium text-sm text-gray-800">{req.subject}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{req.category?.nameBn}</span>
                          <span>•</span>
                          <span>আবেদনকারী: {req.submittedByUser?.name || "অভিভাবক"}</span>
                          {req.student && (
                            <>
                              <span>•</span>
                              <span>শিক্ষার্থী: {req.student.fullNameBn} ({req.student.studentIdNumber})</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(req.status)}
                        {getPriorityBadge(req.priority)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    কোনো সাম্প্রতিক অনুরোধ নেই
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: REQUEST QUEUE & FILTERING */}
      {/* ================================================================= */}
      {activeTab === "QUEUE" && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="টিকিট নম্বর, শিক্ষার্থী নাম, আইডি বা বিষয় দিয়ে খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="">সব স্ট্যাটাস</option>
                  <option value="SUBMITTED">দাখিলকৃত</option>
                  <option value="UNDER_REVIEW">পর্যালোচনাধীন</option>
                  <option value="IN_PROGRESS">প্রক্রিয়াধীন</option>
                  <option value="WAITING_FOR_INFORMATION">তথ্য প্রয়োজন</option>
                  <option value="RESOLVED">মীমাংসিত</option>
                  <option value="CLOSED">বন্ধ</option>
                  <option value="REJECTED">প্রত্যাখ্যাত</option>
                  <option value="REOPEN_REQUESTED">পুনর্বিবেচনা আবেদন</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="">সব অগ্রাধিকার</option>
                  <option value="URGENT">জরুরি</option>
                  <option value="IMPORTANT">গুরুত্বপূর্ণ</option>
                  <option value="NORMAL">সাধারণ</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="">সব ক্যাটাগরি</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.code}>{c.nameBn}</option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setCategoryFilter("");
                    setPriorityFilter("");
                    setTypeFilter("");
                  }}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"
                  title="রিসেট ফিল্টার"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-[#083B25] text-white text-[11px] font-semibold border-b border-gray-200 uppercase">
                  <tr>
                    <th className="px-4 py-3">টিকিট নম্বর</th>
                    <th className="px-4 py-3">বিষয় ও আবেদনকারী</th>
                    <th className="px-4 py-3">ক্যাটাগরি ও ধরন</th>
                    <th className="px-4 py-3">অগ্রাধিকার</th>
                    <th className="px-4 py-3">স্ট্যাটাস</th>
                    <th className="px-4 py-3">দাখিলের তারিখ</th>
                    <th className="px-4 py-3 text-right">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingRequests ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">
                        লোড হচ্ছে...
                      </td>
                    </tr>
                  ) : requests.length > 0 ? (
                    requests.map((r) => (
                      <tr key={r.id} className="hover:bg-emerald-50/40 transition">
                        <td className="px-4 py-3 font-mono font-bold text-emerald-800">
                          {r.ticketNumber}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{r.subject}</p>
                          <p className="text-[11px] text-gray-500">
                            {r.submittedByUser?.name} {r.guardian && `(${r.guardian.fullNameBn})`}
                            {r.student && ` • শিক্ষার্থী: ${r.student.fullNameBn} (${r.student.studentIdNumber})`}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{r.category?.nameBn}</p>
                          <span className="text-[10px] text-gray-500">{getTypeLabel(r.requestType)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {getPriorityBadge(r.priority)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(r.status)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleDateString("bn-BD")}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenDetail(r.id)}
                            className="px-3 py-1 bg-[#083B25] text-white hover:bg-emerald-800 rounded text-xs font-medium transition inline-flex items-center gap-1 shadow-sm"
                          >
                            <Eye className="w-3 h-3" />
                            <span>বিস্তারিত</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        কোনো অনুরোধ বা অভিযোগ পাওয়া যায়নি
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalCount > 15 && (
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>মোট {totalCount} টি অনুরোধ</span>
                <div className="flex gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-2.5 py-1 bg-white border border-gray-200 rounded disabled:opacity-50"
                  >
                    পূর্ববর্তী
                  </button>
                  <span className="px-3 py-1 font-semibold text-gray-800">পৃষ্ঠা {page}</span>
                  <button
                    disabled={page * 15 >= totalCount}
                    onClick={() => setPage(p => p + 1)}
                    className="px-2.5 py-1 bg-white border border-gray-200 rounded disabled:opacity-50"
                  >
                    পরবর্তী
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: CATEGORIES & SLA CONFIG */}
      {/* ================================================================= */}
      {activeTab === "CATEGORIES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
            <div>
              <h3 className="font-bold text-sm text-[#083B25]">রিকুয়েস্ট ও অভিযোগ ক্যাটাগরি কনফিগারেশন</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                প্রতিটি ক্যাটাগরির জন্য ডিফল্ট সমাধান সময়সীমা (SLA Hours) এবং স্থিতি নির্ধারণ করুন
              </p>
            </div>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="px-3 py-2 bg-[#083B25] text-white hover:bg-emerald-800 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন ক্যাটাগরি যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-[#C59B27] transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {cat.code}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      cat.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"
                    }`}>
                      {cat.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">{cat.nameBn}</h4>
                  <p className="text-xs text-gray-400 italic mb-2">{cat.nameEn}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{cat.description || "কোনো বিবরণ নেই"}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1 font-semibold text-purple-700">
                    <Clock className="w-3.5 h-3.5" />
                    SLA: {cat.slaHours} ঘণ্টা
                  </span>
                  <span>ক্রম: #{cat.sortOrder}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: REPORTS & ANALYTICS */}
      {/* ================================================================= */}
      {activeTab === "REPORTS" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#083B25]">হেল্পডেস্ক পারফরম্যান্স ও SLA প্রতিবেদন</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                প্রাতিষ্ঠানিক অনুরোধ নিষ্পত্তির হার, গড় সময় ও ক্যাটাগরিভিত্তিক পারফরম্যান্স মেট্রিক
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট রিপোর্ট</span>
            </button>
          </div>

          {loadingReports ? (
            <div className="text-center py-12 text-gray-400 text-xs">রিপোর্ট লোড হচ্ছে...</div>
          ) : reportsData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Summary KPIs */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">সামগ্রিক মেট্রিক</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm py-1 border-b">
                    <span className="text-gray-600">মোট অনুরোধ:</span>
                    <span className="font-bold text-gray-900">{reportsData.totalCount}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b">
                    <span className="text-gray-600">মোট মীমাংসিত:</span>
                    <span className="font-bold text-emerald-700">{reportsData.resolvedCount}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b">
                    <span className="text-gray-600">গড় সমাধান সময়:</span>
                    <span className="font-bold text-purple-700">{reportsData.avgResolutionHours} ঘণ্টা</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b">
                    <span className="text-gray-600">SLA পূরণ হয়েছে:</span>
                    <span className="font-bold text-emerald-600">{reportsData.slaMetCount}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b">
                    <span className="text-gray-600 text-red-600">SLA বিলম্ব/লঙ্ঘন:</span>
                    <span className="font-bold text-red-600">{reportsData.slaBreachedCount}</span>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">স্ট্যাটাসভিত্তিক বিভাজন</h4>
                <div className="space-y-2">
                  {reportsData.statusBreakdown?.map((s: any) => (
                    <div key={s.status} className="flex justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                      <span className="font-medium text-gray-700">{s.label}</span>
                      <span className="font-bold px-2 py-0.5 bg-gray-100 rounded text-gray-800">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">অগ্রাধিকারভিত্তিক বিভাজন</h4>
                <div className="space-y-2">
                  {reportsData.priorityBreakdown?.map((p: any) => (
                    <div key={p.priority} className="flex justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                      <span className="font-medium text-gray-700">{p.label}</span>
                      <span className="font-bold px-2 py-0.5 bg-gray-100 rounded text-gray-800">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ================================================================= */}
      {/* TICKET DETAIL DRAWER / MODAL */}
      {/* ================================================================= */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border-2 border-[#C59B27] flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#083B25] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#C59B27]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#fef08a] bg-black/30 px-2 py-0.5 rounded border border-[#C59B27]/50">
                    {ticketDetail?.ticketNumber || "লোড হচ্ছে..."}
                  </span>
                  {ticketDetail && getPriorityBadge(ticketDetail.priority)}
                  {ticketDetail && getStatusBadge(ticketDetail.status)}
                </div>
                <h3 className="font-bold text-base sm:text-lg font-display text-white">
                  {ticketDetail?.subject || "টিকেটের বিবরণ"}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                  title="প্রিন্ট করুন"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedTicketId(null);
                    setTicketDetail(null);
                  }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                  title="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {loadingDetail ? (
              <div className="p-12 text-center text-gray-400">টিকেটের বিস্তারিত লোড হচ্ছে...</div>
            ) : ticketDetail ? (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Meta details bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-xs">
                  <div>
                    <span className="text-gray-500 block">ক্যাটাগরি ও ধরন:</span>
                    <span className="font-semibold text-gray-800">{ticketDetail.category?.nameBn}</span>
                    <span className="text-gray-500 block">({getTypeLabel(ticketDetail.requestType)})</span>
                  </div>

                  <div>
                    <span className="text-gray-500 block">আবেদনকারী / অভিভাবক:</span>
                    <span className="font-semibold text-gray-800">
                      {ticketDetail.submittedByUser?.name || "নামহীন"}
                    </span>
                    {ticketDetail.submittedByUser?.phone && (
                      <span className="text-gray-500 block">মোবাইল: {ticketDetail.submittedByUser.phone}</span>
                    )}
                  </div>

                  <div>
                    <span className="text-gray-500 block">সম্পর্কিত শিক্ষার্থী:</span>
                    {ticketDetail.student ? (
                      <span className="font-semibold text-gray-800">
                        {ticketDetail.student.fullNameBn} (আইডি: {ticketDetail.student.studentIdNumber})
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">কোনো শিক্ষার্থী সংযুক্ত নেই</span>
                    )}
                  </div>
                </div>

                {/* Related Entity Link if present */}
                {ticketDetail.relatedEntityType && ticketDetail.relatedEntityId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs flex items-center justify-between text-blue-900">
                    <span className="font-medium">
                      সংযুক্ত মডিউল রেফারেন্স: <strong className="font-mono">{ticketDetail.relatedEntityType}</strong> (ID: {ticketDetail.relatedEntityId})
                    </span>
                    <span className="text-[11px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-mono">
                      অথরাইজড লিঙ্ক
                    </span>
                  </div>
                )}

                {/* Resolution Summary if Resolved */}
                {ticketDetail.status === "RESOLVED" && ticketDetail.resolutionSummary && (
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>মীমাংসা ও সমাধান সারসংক্ষেপ:</span>
                    </div>
                    <p className="text-gray-800 pl-5">{ticketDetail.resolutionSummary}</p>
                    {ticketDetail.resolvedByUser && (
                      <p className="text-gray-500 pl-5 text-[11px]">
                        মীমাংসাকারী: {ticketDetail.resolvedByUser.name} • তারিখ: {new Date(ticketDetail.resolutionDate).toLocaleString("bn-BD")}
                      </p>
                    )}
                  </div>
                )}

                {/* Status Action Controls */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-700">স্ট্যাটাস পরিবর্তন ও প্রশাসনিক সিদ্ধান্ত:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {ticketDetail.status === "SUBMITTED" && (
                        <button
                          onClick={() => handleUpdateStatus("UNDER_REVIEW", "প্রশাসনিক পর্যালোচনা শুরু হয়েছে।")}
                          disabled={updatingStatus}
                          className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700"
                        >
                          পর্যালোচনাধীন করুন
                        </button>
                      )}

                      {(ticketDetail.status === "SUBMITTED" || ticketDetail.status === "UNDER_REVIEW") && (
                        <button
                          onClick={() => handleUpdateStatus("IN_PROGRESS", "কার্যক্রম শুরু হয়েছে।")}
                          disabled={updatingStatus}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700"
                        >
                          প্রক্রিয়াধীন করুন
                        </button>
                      )}

                      {ticketDetail.status !== "RESOLVED" && ticketDetail.status !== "CLOSED" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus("WAITING_FOR_INFORMATION", "অতিরিক্ত তথ্য চাওয়া হয়েছে।")}
                            disabled={updatingStatus}
                            className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700"
                          >
                            তথ্য চেয়ে নোটিশ
                          </button>

                          <button
                            onClick={() => setShowResolveModal(true)}
                            className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800"
                          >
                            ✓ মীমাংসা সম্পন্ন
                          </button>

                          <button
                            onClick={() => {
                              const r = prompt("প্রত্যাখ্যানের কারণ লিখুন:");
                              if (r) handleUpdateStatus("REJECTED", r);
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
                          >
                            প্রত্যাখ্যান
                          </button>
                        </>
                      )}

                      {ticketDetail.status === "RESOLVED" && (
                        <button
                          onClick={() => handleUpdateStatus("CLOSED", "টিকিট চূড়ান্তভাবে বন্ধ করা হয়েছে।")}
                          disabled={updatingStatus}
                          className="px-3 py-1 bg-gray-700 text-white rounded text-xs font-semibold hover:bg-gray-800"
                        >
                          টিকিট বন্ধ করুন
                        </button>
                      )}

                      {(ticketDetail.status === "CLOSED" || ticketDetail.status === "REOPEN_REQUESTED") && (
                        <button
                          onClick={() => handleUpdateStatus("UNDER_REVIEW", "টিকিট পুনরায় পর্যালোচনাধীন।")}
                          disabled={updatingStatus}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                        >
                          টিকিট পুনরায় খুলুন
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline & Messages */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#083B25] border-b pb-2 flex items-center justify-between">
                    <span>কথোপকথন ও টাইমলাইন ইতিহাস</span>
                    <span className="text-xs font-normal text-gray-500">
                      {ticketDetail.messages?.length || 0} টি এন্ট্রি
                    </span>
                  </h4>

                  <div className="space-y-3">
                    {ticketDetail.messages?.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-xl text-xs space-y-1.5 ${
                          msg.isInternal
                            ? "bg-amber-50/80 border-2 border-amber-300 text-amber-950"
                            : msg.messageType === "ADMIN_RESPONSE"
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-950"
                            : "bg-gray-50 border border-gray-200 text-gray-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {msg.isInternal ? (
                              <span className="px-2 py-0.5 bg-amber-600 text-white font-bold rounded text-[10px] flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                অভ্যন্তরীণ নোট (অভিভাবক দেখতে পাবেন না)
                              </span>
                            ) : msg.messageType === "ADMIN_RESPONSE" ? (
                              <span className="px-2 py-0.5 bg-[#083B25] text-white font-semibold rounded text-[10px]">
                                প্রাতিষ্ঠানিক উত্তর
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-800 font-semibold rounded text-[10px]">
                                আবেদনকারীর বক্তব্য
                              </span>
                            )}
                            <span className="font-bold text-gray-700">{msg.authorUser?.name || "ব্যবহারকারী"}</span>
                          </div>
                          <span className="text-[10px] text-gray-500">
                            {new Date(msg.createdAt).toLocaleString("bn-BD")}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reply Composer */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">মন্তব্য বা অফিশিয়াল উত্তর প্রদান:</span>
                      <label className="flex items-center gap-2 text-xs font-semibold text-amber-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>অভ্যন্তরীণ নোট হিসেবে রাখুন (অভিভাবক দেখবেন না)</span>
                      </label>
                    </div>

                    <textarea
                      rows={3}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={
                        isInternalNote
                          ? "এখানে শুধুমাত্র সহকর্মী/অধ্যক্ষের জন্য অভ্যন্তরীণ তদন্ত নোট লিখুন..."
                          : "অভিভাবক বা আবেদনকারীকে প্রাতিষ্ঠানিক উত্তর লিখুন..."
                      }
                      className={`w-full p-3 text-xs border rounded-lg focus:outline-none ${
                        isInternalNote
                          ? "border-amber-300 bg-amber-50/30 focus:ring-1 focus:ring-amber-500"
                          : "border-gray-200 focus:ring-1 focus:ring-emerald-600"
                      }`}
                    />

                    <div className="flex justify-end">
                      <button
                        onClick={handleSendReply}
                        disabled={submittingReply || !replyContent.trim()}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg text-white transition flex items-center gap-1.5 shadow ${
                          isInternalNote
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-[#083B25] hover:bg-emerald-800"
                        } disabled:opacity-50`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isInternalNote ? "অভ্যন্তরীণ নোট সংরক্ষণ" : "অফিশিয়াল উত্তর পাঠান"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* RESOLVE DIALOG MODAL */}
      {/* ================================================================= */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border-2 border-emerald-600 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#083B25] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>অনুরোধ/অভিযোগের মীমাংসা সারসংক্ষেপ</span>
            </h3>
            <p className="text-xs text-gray-500">
              অভিযোগ বা অনুরোধটি কিভাবে সমাধান করা হলো তার সংক্ষিপ্ত ইতিবাচক বিবরণ লিখুন। এটি অভিভাবক দেখতে পাবেন।
            </p>

            <textarea
              rows={4}
              value={resolutionSummary}
              onChange={(e) => setResolutionSummary(e.target.value)}
              placeholder="যেমন: ফি সংশোধন করে নতুন রশিদ প্রদান করা হয়েছে এবং তথ্য ডাটাবেজে হালনাগাদ করা হয়েছে..."
              className="w-full p-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg"
              >
                বাতিল
              </button>
              <button
                onClick={() => handleUpdateStatus("RESOLVED", "মীমাংসা সম্পন্ন", resolutionSummary)}
                disabled={updatingStatus || !resolutionSummary.trim()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                মীমাংসা নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* ADD CATEGORY MODAL */}
      {/* ================================================================= */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateCategory} className="bg-white w-full max-w-md rounded-2xl p-6 border-2 border-[#C59B27] shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#083B25] flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#C59B27]" />
              <span>নতুন সাপোর্ট ক্যাটাগরি তৈরি</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 mb-1">ক্যাটাগরি কোড (ইংরেজিতে, ইউনিক):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SCHOLARSHIP_QUERY"
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 border rounded-lg font-mono focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">বাংলা নাম:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. উপবৃত্তি ও আর্থিক সহায়তা"
                  value={newCatNameBn}
                  onChange={(e) => setNewCatNameBn(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">ইংরেজি নাম (ঐচ্ছিক):</label>
                <input
                  type="text"
                  placeholder="e.g. Scholarship & Aid"
                  value={newCatNameEn}
                  onChange={(e) => setNewCatNameEn(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">লক্ষ্যমাত্রা SLA সময় (ঘণ্টা):</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="720"
                  value={newCatSlaHours}
                  onChange={(e) => setNewCatSlaHours(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">সংক্ষিপ্ত বিবরণ:</label>
                <textarea
                  rows={2}
                  placeholder="ক্যাটাগরির উদ্দেশ্য..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#083B25] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow"
              >
                ক্যাটাগরি সংরক্ষণ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
