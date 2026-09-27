"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Send,
  FileText,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  Eye,
  Trash2,
  Archive,
  Pin,
  Check,
  RotateCw,
  Settings,
  Sparkles,
} from "lucide-react";

export default function AdminCommunicationHub() {
  const [activeSubTab, setActiveSubTab] = useState<
    "NOTICES" | "NOTIFICATIONS" | "DELIVERY" | "TEMPLATES"
  >("NOTICES");

  // Notices State
  const [notices, setNotices] = useState<any[]>([]);
  const [noticeCounts, setNoticeCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [noticeSearch, setNoticeSearch] = useState("");
  const [loadingNotices, setLoadingNotices] = useState(false);

  // Notice Modal State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("GENERAL");
  const [noticeAudience, setNoticeAudience] = useState("PUBLIC");
  const [noticePriority, setNoticePriority] = useState<"NORMAL" | "IMPORTANT" | "URGENT">("NORMAL");
  const [noticeStatus, setNoticeStatus] = useState<"DRAFT" | "SCHEDULED" | "PUBLISHED">("PUBLISHED");
  const [noticeIsPinned, setNoticeIsPinned] = useState(false);
  const [noticeScheduledAt, setNoticeScheduledAt] = useState("");
  const [noticeExpiresAt, setNoticeExpiresAt] = useState("");
  const [noticeAttachmentUrl, setNoticeAttachmentUrl] = useState("");
  const [noticeClassId, setNoticeClassId] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [noticeMsg, setNoticeMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [bcastTitle, setBcastTitle] = useState("");
  const [bcastMessage, setBcastMessage] = useState("");
  const [bcastAudience, setBcastAudience] = useState("ALL_GUARDIANS");
  const [bcastPriority, setBcastPriority] = useState<"NORMAL" | "IMPORTANT" | "URGENT">("NORMAL");
  const [bcastActionUrl, setBcastActionUrl] = useState("");
  const [bcastSending, setBcastSending] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifStats, setNotifStats] = useState<any>(null);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Deliveries State
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [deliverySummary, setDeliverySummary] = useState<any>(null);
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("ALL");
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Templates State
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Scheduler Runner State
  const [runningScheduler, setRunningScheduler] = useState(false);

  // Fetch Classes & Sessions for targeting
  useEffect(() => {
    fetch("/api/admin/exams")
      .then((res) => res.json())
      .then((data) => {
        if (data.classes) setClasses(data.classes);
        if (data.sessions) setSessions(data.sessions);
      })
      .catch(() => {});
  }, []);

  // Fetch Notices
  const fetchNotices = () => {
    setLoadingNotices(true);
    let url = `/api/admin/notices?status=${statusFilter}&category=${categoryFilter}`;
    if (noticeSearch.trim()) url += `&search=${encodeURIComponent(noticeSearch.trim())}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.notices) {
          setNotices(data.notices);
          setNoticeCounts(data.counts || {});
        }
        setLoadingNotices(false);
      })
      .catch(() => setLoadingNotices(false));
  };

  // Fetch Notifications
  const fetchNotifications = () => {
    setLoadingNotifs(true);
    fetch("/api/admin/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications);
          setNotifStats(data.stats);
        }
        setLoadingNotifs(false);
      })
      .catch(() => setLoadingNotifs(false));
  };

  // Fetch Deliveries
  const fetchDeliveries = () => {
    setLoadingDeliveries(true);
    fetch(`/api/admin/notifications/delivery?status=${deliveryStatusFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.deliveries) {
          setDeliveries(data.deliveries);
          setDeliverySummary(data.summary);
        }
        setLoadingDeliveries(false);
      })
      .catch(() => setLoadingDeliveries(false));
  };

  // Fetch Templates
  const fetchTemplates = () => {
    setLoadingTemplates(true);
    fetch("/api/admin/notifications/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.templates) setTemplates(data.templates);
        setLoadingTemplates(false);
      })
      .catch(() => setLoadingTemplates(false));
  };

  useEffect(() => {
    if (activeSubTab === "NOTICES") fetchNotices();
    if (activeSubTab === "NOTIFICATIONS") fetchNotifications();
    if (activeSubTab === "DELIVERY") fetchDeliveries();
    if (activeSubTab === "TEMPLATES") fetchTemplates();
  }, [activeSubTab, statusFilter, categoryFilter, deliveryStatusFilter]);

  // Create Notice Submit
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoticeMsg(null);

    try {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleBn: noticeTitle,
          contentBn: noticeContent,
          category: noticeCategory,
          audience: noticeAudience,
          priority: noticePriority,
          status: noticeStatus,
          isPinned: noticeIsPinned,
          scheduledAt: noticeScheduledAt || null,
          expiresAt: noticeExpiresAt || null,
          attachmentUrl: noticeAttachmentUrl || null,
          classId: noticeClassId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setNoticeMsg({ text: data.error || "নোটিশ তৈরিতে ব্যর্থ হয়েছে।", type: "error" });
        return;
      }

      setNoticeMsg({ text: data.message || "নোটিশ সফলভাবে সংরক্ষিত হয়েছে।", type: "success" });
      setShowNoticeModal(false);
      resetNoticeForm();
      fetchNotices();
    } catch (err: any) {
      setNoticeMsg({ text: err.message, type: "error" });
    }
  };

  const resetNoticeForm = () => {
    setNoticeTitle("");
    setNoticeContent("");
    setNoticeCategory("GENERAL");
    setNoticeAudience("PUBLIC");
    setNoticePriority("NORMAL");
    setNoticeStatus("PUBLISHED");
    setNoticeIsPinned(false);
    setNoticeScheduledAt("");
    setNoticeExpiresAt("");
    setNoticeAttachmentUrl("");
    setNoticeClassId("");
  };

  // Publish Notice
  const handlePublishNotice = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই নোটিশটি এখনই প্রকাশ ও গ্রাহকদের বার্তা পাঠাতে চান?")) return;
    try {
      const res = await fetch(`/api/admin/notices/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert("নোটিশ সফলভাবে প্রকাশিত হয়েছে।");
        fetchNotices();
      } else {
        alert(data.error || "প্রকাশ করতে সমস্যা হয়েছে।");
      }
    } catch (err) {
      alert("নেটওয়ার্ক ত্রুটি");
    }
  };

  // Archive Notice
  const handleArchiveNotice = async (id: string) => {
    if (!confirm("আপনি কি নোটিশটি আর্কাইভে পাঠাতে চান?")) return;
    try {
      const res = await fetch(`/api/admin/notices/${id}/archive`, { method: "POST" });
      if (res.ok) {
        fetchNotices();
      }
    } catch (err) {}
  };

  // Delete Notice
  const handleDeleteNotice = async (id: string) => {
    if (!confirm("সতর্কতা: নোটিশটি স্থায়ীভাবে মুছে ফেলা হবে। অগ্রসর হবেন?")) return;
    try {
      const res = await fetch(`/api/admin/notices?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchNotices();
    } catch (err) {}
  };

  // Broadcast Submit
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBcastSending(true);

    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bcastTitle,
          message: bcastMessage,
          audience: bcastAudience,
          priority: bcastPriority,
          actionUrl: bcastActionUrl || undefined,
        }),
      });

      const data = await res.json();
      setBcastSending(false);

      if (res.ok) {
        alert(data.message || "বার্তা সফলভাবে প্রেরিত হয়েছে।");
        setShowBroadcastModal(false);
        setBcastTitle("");
        setBcastMessage("");
        setBcastActionUrl("");
        if (activeSubTab === "NOTIFICATIONS") fetchNotifications();
      } else {
        alert(data.error || "বার্তা প্রেরণে সমস্যা হয়েছে।");
      }
    } catch (err) {
      setBcastSending(false);
      alert("নেটওয়ার্ক ত্রুটি");
    }
  };

  // Retry Email Delivery
  const handleRetryDelivery = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await fetch(`/api/admin/notifications/delivery/${id}/retry`, { method: "POST" });
      const data = await res.json();
      setRetryingId(null);
      if (res.ok) {
        alert("ইমেইল সফলভাবে পুনরায় প্রেরণ করা হয়েছে।");
        fetchDeliveries();
      } else {
        alert(data.error || "পুনরায় প্রেরণে ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      setRetryingId(null);
      alert("নেটওয়ার্ক সমস্যা");
    }
  };

  // Run Scheduler
  const handleRunScheduler = async () => {
    setRunningScheduler(true);
    try {
      const res = await fetch("/api/admin/notices/scheduler", { method: "POST" });
      const data = await res.json();
      setRunningScheduler(false);
      alert(data.message || "শিডিউলার সফলভাবে চলেছে।");
      fetchNotices();
    } catch (err) {
      setRunningScheduler(false);
      alert("শিডিউলার চালাতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#083B25] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0D5C3A]" />
            যোগাযোগ, প্রাতিষ্ঠানিক নোটিশ ও নোটিফিকেশন সেন্টার
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            মাদরাসার অফিশিয়াল নোটিশ CMS, টার্গেটেড ব্রডকাস্ট, অভিভাবক/শিক্ষক নোটিফিকেশন ও ইমেইল ডেলিভারি ব্যবস্থাপনা।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNoticeModal(true)}
            className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
          >
            <PlusCircle className="w-4 h-4" />
            নতুন নোটিশ তৈরি
          </button>

          <button
            onClick={() => setShowBroadcastModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
          >
            <Send className="w-4 h-4" />
            ব্রডকাস্ট নোটিফিকেশন
          </button>

          <button
            onClick={handleRunScheduler}
            disabled={runningScheduler}
            title="শিডিউল নোটিশ ও এক্সপায়ার প্রসেসর চালু করুন"
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Clock className={`w-3.5 h-3.5 ${runningScheduler ? "animate-spin text-amber-600" : ""}`} />
            শিডিউল প্রসেসর
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab("NOTICES")}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 ${
            activeSubTab === "NOTICES"
              ? "border-[#0D5C3A] text-[#0D5C3A] font-bold"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          নোটিশ বোর্ড (CMS) {noticeCounts.ALL ? `(${noticeCounts.ALL})` : ""}
        </button>

        <button
          onClick={() => setActiveSubTab("NOTIFICATIONS")}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 ${
            activeSubTab === "NOTIFICATIONS"
              ? "border-[#0D5C3A] text-[#0D5C3A] font-bold"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Bell className="w-4 h-4" />
          নোটিফিকেশন লগ
        </button>

        <button
          onClick={() => setActiveSubTab("DELIVERY")}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 ${
            activeSubTab === "DELIVERY"
              ? "border-[#0D5C3A] text-[#0D5C3A] font-bold"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Mail className="w-4 h-4" />
          ইমেইল ডেলিভারি ট্র্যাকিং
        </button>

        <button
          onClick={() => setActiveSubTab("TEMPLATES")}
          className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 ${
            activeSubTab === "TEMPLATES"
              ? "border-[#0D5C3A] text-[#0D5C3A] font-bold"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Settings className="w-4 h-4" />
          অটোমেশন টেমপ্লেট
        </button>
      </div>

      {/* ================================================================= */}
      {/* 1. NOTICES CMS SUBTAB */}
      {/* ================================================================= */}
      {activeSubTab === "NOTICES" && (
        <div className="space-y-4">
          {/* Status Counts Pill Filters */}
          <div className="flex flex-wrap gap-2 text-xs">
            {["ALL", "PUBLISHED", "SCHEDULED", "DRAFT", "EXPIRED", "ARCHIVED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full border transition font-medium ${
                  statusFilter === st
                    ? "bg-[#0D5C3A] text-white border-[#0D5C3A] shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {st === "ALL" && "সকল নোটিশ"}
                {st === "PUBLISHED" && "প্রকাশিত"}
                {st === "SCHEDULED" && "শিডিউলকৃত"}
                {st === "DRAFT" && "ড্রাফট"}
                {st === "EXPIRED" && "মেয়াদোত্তীর্ণ"}
                {st === "ARCHIVED" && "আর্কাইভকৃত"}
                {noticeCounts[st] !== undefined ? ` (${noticeCounts[st]})` : ""}
              </button>
            ))}
          </div>

          {/* Search & Category Filter */}
          <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="নোটিশের শিরোনাম বা বিবরণ দিয়ে খুঁজুন..."
                value={noticeSearch}
                onChange={(e) => setNoticeSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchNotices()}
                className="w-full outline-none text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-1.5 border border-gray-300 rounded text-xs outline-none bg-white"
              >
                <option value="ALL">সকল ক্যাটাগরি</option>
                <option value="GENERAL">সাধারণ বিজ্ঞপ্তি</option>
                <option value="ACADEMIC">একাডেমিক</option>
                <option value="EXAM">পরীক্ষা সংক্রান্ত</option>
                <option value="ADMISSION">ভর্তি সংক্রান্ত</option>
                <option value="HOLIDAY">ছুটির তালিকা</option>
                <option value="EMERGENCY">জরুরি ঘোষণা</option>
              </select>

              <button
                onClick={fetchNotices}
                className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingNotices ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Notices Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8fafc] text-gray-700 font-semibold border-b">
                  <tr>
                    <th className="p-3 w-10 text-center">পিন</th>
                    <th className="p-3">শিরোনাম ও বিবরণ</th>
                    <th className="p-3">ক্যাটাগরি</th>
                    <th className="p-3">প্রাপক / অডিয়েন্স</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3">প্রকাশের তারিখ</th>
                    <th className="p-3 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingNotices ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        নোটিশ লোড হচ্ছে...
                      </td>
                    </tr>
                  ) : notices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        কোনো নোটিশ পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    notices.map((n) => (
                      <tr key={n.id} className="hover:bg-gray-50/70 transition">
                        <td className="p-3 text-center">
                          {n.isPinned && (
                            <Pin className="w-3.5 h-3.5 text-amber-600 inline-block fill-amber-500" />
                          )}
                        </td>
                        <td className="p-3 max-w-sm">
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            {n.titleBn}
                            {n.priority === "URGENT" && (
                              <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                জরুরি
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-[11px] line-clamp-1 mt-0.5">
                            {n.contentBn}
                          </p>
                          {n.attachmentUrl && (
                            <span className="text-[10px] text-[#0D5C3A] font-semibold flex items-center gap-1 mt-1">
                              📎 সংযুক্ত ফাইল রয়েছে
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {n.category}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-gray-700 font-medium">
                            {n.audience === "PUBLIC" && "উন্মুক্ত (পাবলিক)"}
                            {n.audience === "ALL_GUARDIANS" && "সকল অভিভাবক"}
                            {n.audience === "ALL_TEACHERS" && "সকল শিক্ষক"}
                            {n.audience === "CLASS" &&
                              `জামাত: ${n.jamatClass?.nameBn || "নির্দিষ্ট শ্রেণি"}`}
                            {n.audience === "SECTION" && "নির্দিষ্ট শাখা"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              n.status === "PUBLISHED"
                                ? "bg-emerald-100 text-emerald-800"
                                : n.status === "SCHEDULED"
                                ? "bg-blue-100 text-blue-800"
                                : n.status === "DRAFT"
                                ? "bg-gray-100 text-gray-800"
                                : n.status === "EXPIRED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {n.status === "PUBLISHED" && "প্রকাশিত"}
                            {n.status === "SCHEDULED" && "শিডিউলকৃত"}
                            {n.status === "DRAFT" && "ড্রাফট"}
                            {n.status === "EXPIRED" && "মেয়াদোত্তীর্ণ"}
                            {n.status === "ARCHIVED" && "আর্কাইভ"}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-gray-500">
                          {new Date(n.publishedAt).toLocaleDateString("bn-BD")}
                          {n.status === "SCHEDULED" && n.scheduledAt && (
                            <span className="block text-[10px] text-blue-600">
                              শিডিউল: {new Date(n.scheduledAt).toLocaleDateString("bn-BD")}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          {n.status !== "PUBLISHED" && (
                            <button
                              onClick={() => handlePublishNotice(n.id)}
                              className="bg-emerald-600 text-white px-2 py-1 rounded text-[11px] font-semibold hover:bg-emerald-700"
                              title="এখনই প্রকাশ করুন"
                            >
                              প্রকাশ করুন
                            </button>
                          )}

                          {n.status === "PUBLISHED" && (
                            <button
                              onClick={() => handleArchiveNotice(n.id)}
                              className="text-gray-500 hover:text-gray-800 p-1 rounded hover:bg-gray-100"
                              title="আর্কাইভ করুন"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteNotice(n.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. NOTIFICATIONS LOG SUBTAB */}
      {/* ================================================================= */}
      {activeSubTab === "NOTIFICATIONS" && (
        <div className="space-y-4">
          {notifStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-500 block">মোট প্রেরিত নোটিফিকেশন</span>
                <span className="text-lg font-bold text-[#0D5C3A]">{notifStats.total} টি</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-500 block">অপঠিত নোটিফিকেশন</span>
                <span className="text-lg font-bold text-amber-600">{notifStats.unreadTotal} টি</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-500 block">ইমেইল প্রেরিত</span>
                <span className="text-lg font-bold text-emerald-600">
                  {notifStats.deliveries?.SENT || 0} টি
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-500 block">ইমেইল ব্যর্থ</span>
                <span className="text-lg font-bold text-red-600">
                  {notifStats.deliveries?.FAILED || 0} টি
                </span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-xs text-gray-800">সর্বশেষ প্রেরিত নোটিফিকেশনের রেকর্ড</h3>
              <button
                onClick={fetchNotifications}
                className="text-xs text-[#0D5C3A] font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
              </button>
            </div>

            <div className="divide-y divide-gray-100 text-xs">
              {loadingNotifs ? (
                <div className="p-8 text-center text-gray-400">নোটিফিকেশন লোড হচ্ছে...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">কোনো নোটিফিকেশন পাওয়া যায়নি।</div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-gray-50 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{notif.title}</span>
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                          {notif.type}
                        </span>
                        {notif.priority === "URGENT" && (
                          <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            জরুরি
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{notif.body}</p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2">
                        <span>গ্রাহক: {notif.recipientUser?.name} ({notif.recipientUser?.role})</span>
                        <span>•</span>
                        <span>তারিখ: {new Date(notif.createdAt).toLocaleString("bn-BD")}</span>
                        <span>•</span>
                        <span className={notif.isRead ? "text-emerald-600" : "text-amber-600 font-bold"}>
                          {notif.isRead ? "পঠিত" : "অপঠিত"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. EMAIL DELIVERY TRACKING SUBTAB */}
      {/* ================================================================= */}
      {activeSubTab === "DELIVERY" && (
        <div className="space-y-4">
          {deliverySummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-500 block">মোট ইমেইল কিউ</span>
                <span className="text-lg font-bold text-blue-600">{deliverySummary.QUEUED} টি</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-500 block">সফলভাবে প্রেরিত</span>
                <span className="text-lg font-bold text-emerald-600">{deliverySummary.SENT} টি</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-500 block">ব্যর্থ ডেলিভারি</span>
                <span className="text-lg font-bold text-red-600">{deliverySummary.FAILED} টি</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-500 block">বাতিলকৃত</span>
                <span className="text-lg font-bold text-gray-600">{deliverySummary.CANCELLED} টি</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-xs text-gray-800">ইমেইল নোটিফিকেশন ডেলিভারি ট্র্যাকিং লগ</h3>
              <div className="flex items-center gap-2">
                <select
                  value={deliveryStatusFilter}
                  onChange={(e) => setDeliveryStatusFilter(e.target.value)}
                  className="p-1 border rounded text-xs outline-none bg-white"
                >
                  <option value="ALL">সকল স্ট্যাটাস</option>
                  <option value="SENT">সফল (SENT)</option>
                  <option value="FAILED">ব্যর্থ (FAILED)</option>
                  <option value="QUEUED">কিউতে আছে (QUEUED)</option>
                </select>
                <button
                  onClick={fetchDeliveries}
                  className="p-1 border rounded hover:bg-gray-50 text-gray-600 text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8fafc] text-gray-700 font-semibold border-b">
                  <tr>
                    <th className="p-3">গ্রাহক ইমেইল</th>
                    <th className="p-3">নোটিফিকেশনের শিরোনাম</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3">চেষ্টা সংখ্যা</th>
                    <th className="p-3">সর্বশেষ চেষ্টা / ত্রুটি</th>
                    <th className="p-3 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingDeliveries ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        ডেলিভারি রেকর্ড লোড হচ্ছে...
                      </td>
                    </tr>
                  ) : deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        কোনো ডেলিভারি রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    deliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50/70 transition">
                        <td className="p-3 font-semibold text-gray-900">{d.destination}</td>
                        <td className="p-3 max-w-xs truncate text-gray-600">
                          {d.notification?.title || "স্বয়ংক্রিয় বার্তা"}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.status === "SENT" || d.status === "DELIVERED"
                                ? "bg-emerald-100 text-emerald-800"
                                : d.status === "FAILED"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="p-3">{d.attemptCount} / {d.maxAttempts}</td>
                        <td className="p-3 max-w-xs text-[11px] text-gray-500 truncate">
                          {d.errorMessage ? (
                            <span className="text-red-600 font-semibold">{d.errorMessage}</span>
                          ) : d.deliveredAt ? (
                            new Date(d.deliveredAt).toLocaleString("bn-BD")
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {d.status === "FAILED" && (
                            <button
                              onClick={() => handleRetryDelivery(d.id)}
                              disabled={retryingId === d.id}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ml-auto shadow-sm"
                            >
                              <RotateCw className={`w-3 h-3 ${retryingId === d.id ? "animate-spin" : ""}`} />
                              পুনরায় চেষ্টা
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
        </div>
      )}

      {/* ================================================================= */}
      {/* 4. TEMPLATES SUBTAB */}
      {/* ================================================================= */}
      {activeSubTab === "TEMPLATES" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-gray-900">প্রাতিষ্ঠানিক নোটিফিকেশন টেমপ্লেট ও অটোমেশন</h3>
              <p className="text-xs text-gray-500">ভর্তি, ফি, পরীক্ষা, ও রেজাল্ট ইভেন্টের স্বয়ংক্রিয় বার্তা টেমপ্লেট।</p>
            </div>
            <button
              onClick={fetchTemplates}
              className="text-xs text-[#0D5C3A] font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingTemplates ? (
              <div className="col-span-2 p-8 text-center text-gray-400">টেমপ্লেট লোড হচ্ছে...</div>
            ) : (
              templates.map((tpl) => (
                <div key={tpl.id} className="p-4 border rounded-xl bg-gray-50/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{tpl.nameBn}</span>
                    <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.5 rounded font-mono">
                      {tpl.code}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">ইমেইল বিষয় (Subject):</span>
                    <p className="font-semibold text-gray-700">{tpl.subjectTemplateBn}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">বার্তার বিবরণ (Body):</span>
                    <p className="text-gray-600 line-clamp-2">{tpl.bodyTemplateBn}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t text-[10px] text-gray-500">
                    <span>চ্যানেল: {tpl.channels}</span>
                    <span>{tpl.isMandatory ? "বাধ্যতামূলক বার্তা" : "ঐচ্ছিক বার্তা"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* CREATE NOTICE MODAL */}
      {/* ================================================================= */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#083B25] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0D5C3A]" />
                নতুন অফিশিয়াল নোটিশ তৈরি ও প্রকাশনা
              </h3>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">নোটিশের শিরোনাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বার্ষিক পরীক্ষার সময়সূচি ও প্রবেশপত্র সংগ্রহ সংক্রান্ত বিজ্ঞপ্তি"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">বিস্তারিত বিবরণ (বাংলা) *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="বিজ্ঞপ্তির পূর্ণাঙ্গ প্রাতিষ্ঠানিক বিবরণ লিখুন..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value)}
                    className="w-full p-2 border rounded outline-none bg-white"
                  >
                    <option value="GENERAL">সাধারণ বিজ্ঞপ্তি</option>
                    <option value="ACADEMIC">একাডেমিক</option>
                    <option value="EXAM">পরীক্ষা সংক্রান্ত</option>
                    <option value="ADMISSION">ভর্তি সংক্রান্ত</option>
                    <option value="HOLIDAY">ছুটি ও বন্ধ</option>
                    <option value="EMERGENCY">জরুরি ঘোষণা</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">অডিয়েন্স / প্রাপক</label>
                  <select
                    value={noticeAudience}
                    onChange={(e) => setNoticeAudience(e.target.value)}
                    className="w-full p-2 border rounded outline-none bg-white"
                  >
                    <option value="PUBLIC">উন্মুক্ত (পাবলিক নোটিশ)</option>
                    <option value="ALL_GUARDIANS">সকল অভিভাবক</option>
                    <option value="ALL_TEACHERS">সকল শিক্ষক ও উস্তাদ</option>
                    <option value="CLASS">নির্দিষ্ট জামাত / শ্রেণি</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">অগ্রাধিকার (Priority)</label>
                  <select
                    value={noticePriority}
                    onChange={(e) => setNoticePriority(e.target.value as any)}
                    className="w-full p-2 border rounded outline-none bg-white"
                  >
                    <option value="NORMAL">স্বাভাবিক (Normal)</option>
                    <option value="IMPORTANT">গুরুত্বপূর্ণ (Important)</option>
                    <option value="URGENT">জরুরি (Urgent)</option>
                  </select>
                </div>
              </div>

              {noticeAudience === "CLASS" && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">নির্দিষ্ট জামাত নির্বাচন করুন *</label>
                  <select
                    required
                    value={noticeClassId}
                    onChange={(e) => setNoticeClassId(e.target.value)}
                    className="w-full p-2 border rounded outline-none bg-white"
                  >
                    <option value="">জামাত নির্বাচন করুন...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">স্ট্যাটাস</label>
                  <select
                    value={noticeStatus}
                    onChange={(e) => setNoticeStatus(e.target.value as any)}
                    className="w-full p-2 border rounded outline-none bg-white"
                  >
                    <option value="PUBLISHED">এখনই প্রকাশ করুন (PUBLISHED)</option>
                    <option value="SCHEDULED">নির্দিষ্ট সময়ে প্রকাশ (SCHEDULED)</option>
                    <option value="DRAFT">খসড়া রাখুন (DRAFT)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">সংযুক্ত ফাইল লিংক (ঐচ্ছিক)</label>
                  <input
                    type="url"
                    placeholder="https://.../notice.pdf"
                    value={noticeAttachmentUrl}
                    onChange={(e) => setNoticeAttachmentUrl(e.target.value)}
                    className="w-full p-2 border rounded outline-none"
                  />
                </div>
              </div>

              {noticeStatus === "SCHEDULED" && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">প্রকাশের শিডিউল তারিখ ও সময় *</label>
                  <input
                    type="datetime-local"
                    required
                    value={noticeScheduledAt}
                    onChange={(e) => setNoticeScheduledAt(e.target.value)}
                    className="w-full p-2 border rounded outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">মেয়াদোত্তীর্ণের তারিখ (ঐচ্ছিক)</label>
                <input
                  type="date"
                  value={noticeExpiresAt}
                  onChange={(e) => setNoticeExpiresAt(e.target.value)}
                  className="w-full p-2 border rounded outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={noticeIsPinned}
                  onChange={(e) => setNoticeIsPinned(e.target.checked)}
                  className="rounded text-[#0D5C3A]"
                />
                <label htmlFor="pinCheck" className="text-gray-700 font-semibold cursor-pointer">
                  নোটিশটি তালিকার শীর্ষে পিন করে রাখুন
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-5 py-2 rounded font-semibold shadow transition"
                >
                  সংরক্ষণ ও নিশ্চিতকরণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* BROADCAST MODAL */}
      {/* ================================================================= */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#083B25] flex items-center gap-1.5">
                <Send className="w-4 h-4 text-amber-600" />
                ব্রডকাস্ট নোটিফিকেশন প্রেরণ (পোর্টাল ও ইমেইল)
              </h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">নোটিফিকেশনের বিষয় / শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: জরুরি অভিভাবক সমাবেশ সংক্রান্ত বিজ্ঞপ্তি"
                  value={bcastTitle}
                  onChange={(e) => setBcastTitle(e.target.value)}
                  className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">বার্তার বিস্তারিত বিবরণ *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="বিস্তারিত বার্তা লিখুন যা পোর্টাল এবং ইমেইলে প্রেরিত হবে..."
                  value={bcastMessage}
                  onChange={(e) => setBcastMessage(e.target.value)}
                  className="w-full p-2 border rounded outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">প্রাপক শ্রেণি</label>
                  <select
                    value={bcastAudience}
                    onChange={(e) => setBcastAudience(e.target.value)}
                    className="w-full p-2 border rounded outline-none bg-white"
                  >
                    <option value="ALL_GUARDIANS">সকল অভিভাবক</option>
                    <option value="ALL_TEACHERS">সকল শিক্ষক ও উস্তাদ</option>
                    <option value="ALL_STAFF">সকল স্টাফ (শিক্ষক + অ্যাডমিন)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">অগ্রাধিকার</label>
                  <select
                    value={bcastPriority}
                    onChange={(e) => setBcastPriority(e.target.value as any)}
                    className="w-full p-2 border rounded outline-none bg-white"
                  >
                    <option value="NORMAL">স্বাভাবিক (Normal)</option>
                    <option value="IMPORTANT">গুরুত্বপূর্ণ (Important)</option>
                    <option value="URGENT">জরুরি (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">পোর্টালে যাওয়ার লিংক (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: /portal/academic বা /notices"
                  value={bcastActionUrl}
                  onChange={(e) => setBcastActionUrl(e.target.value)}
                  className="w-full p-2 border rounded outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={bcastSending}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded font-semibold shadow transition flex items-center gap-1.5"
                >
                  <Send className={`w-3.5 h-3.5 ${bcastSending ? "animate-spin" : ""}`} />
                  {bcastSending ? "বার্তা পাঠানো হচ্ছে..." : "বার্তা প্রেরণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
