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
  Printer,
  Smartphone,
  MessageSquare,
  ExternalLink,
  Copy,
  ChevronRight,
  X,
  Users,
  ShieldCheck,
  Edit3,
  Download,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
import {
  calculateSmsMetrics,
  DEFAULT_SMS_TEMPLATES,
  generateWhatsAppLink,
  SmsCalculation,
} from "@/lib/smsGateway";

interface AdminCommunicationHubProps {
  initialOpenNoticeModal?: boolean;
}

export default function AdminCommunicationHub({
  initialOpenNoticeModal = false,
}: AdminCommunicationHubProps = {}) {
  const [activeSubTab, setActiveSubTab] = useState<
    "NOTICES" | "SMS_BROADCAST" | "WHATSAPP_GATEWAY" | "DELIVERY" | "TEMPLATES"
  >("NOTICES");

  // Notices State
  const [notices, setNotices] = useState<any[]>([]);
  const [noticeCounts, setNoticeCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [noticeSearch, setNoticeSearch] = useState("");
  const [loadingNotices, setLoadingNotices] = useState(false);

  // Notice Print Modal State
  const [selectedNoticePrint, setSelectedNoticePrint] = useState<any | null>(null);

  // Notice Modal State
  const [showNoticeModal, setShowNoticeModal] = useState(initialOpenNoticeModal);

  useEffect(() => {
    if (initialOpenNoticeModal) {
      setShowNoticeModal(true);
      setActiveSubTab("NOTICES");
    }
  }, [initialOpenNoticeModal]);

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

  // Edit Notice State
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [editNoticeTitle, setEditNoticeTitle] = useState("");
  const [editNoticeContent, setEditNoticeContent] = useState("");
  const [editNoticeCategory, setEditNoticeCategory] = useState("GENERAL");
  const [editNoticeAudience, setEditNoticeAudience] = useState("PUBLIC");
  const [editNoticePriority, setEditNoticePriority] = useState<"NORMAL" | "IMPORTANT" | "URGENT">("NORMAL");
  const [editNoticeStatus, setEditNoticeStatus] = useState<"DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED">("PUBLISHED");
  const [editNoticeIsPinned, setEditNoticeIsPinned] = useState(false);
  const [editNoticeScheduledAt, setEditNoticeScheduledAt] = useState("");
  const [editNoticeExpiresAt, setEditNoticeExpiresAt] = useState("");
  const [editNoticeAttachmentUrl, setEditNoticeAttachmentUrl] = useState("");
  const [editNoticeClassId, setEditNoticeClassId] = useState("");
  const [editNoticeMsg, setEditNoticeMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [updatingNotice, setUpdatingNotice] = useState(false);

  // Broadcast Modal State (Portal & Email)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [bcastTitle, setBcastTitle] = useState("");
  const [bcastMessage, setBcastMessage] = useState("");
  const [bcastAudience, setBcastAudience] = useState("ALL_GUARDIANS");
  const [bcastPriority, setBcastPriority] = useState<"NORMAL" | "IMPORTANT" | "URGENT">("NORMAL");
  const [bcastActionUrl, setBcastActionUrl] = useState("");
  const [bcastSending, setBcastSending] = useState(false);

  // SMS Broadcast Studio State
  const [smsMessage, setSmsMessage] = useState("");
  const [smsAudience, setSmsAudience] = useState<
    "ALL_GUARDIANS" | "ALL_TEACHERS" | "ALL_STAFF" | "CLASS" | "CUSTOM"
  >("ALL_GUARDIANS");
  const [smsClassId, setSmsClassId] = useState("");
  const [smsCustomNumbers, setSmsCustomNumbers] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsGatewayInfo, setSmsGatewayInfo] = useState<any>(null);
  const [smsMsgFeedback, setSmsMsgFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Real-time SMS Metrics
  const smsMetrics: SmsCalculation = calculateSmsMetrics(smsMessage);

  // WhatsApp Gateway State
  const [whatsappMessage, setWhatsappMessage] = useState(
    "আসসালামু আলাইকুম। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার পক্ষ হতে জরুরি নোটিশ ও জ্ঞাতব্য বিষয়।"
  );
  const [whatsappAudience, setWhatsappAudience] = useState("ALL_GUARDIANS");
  const [whatsappClassId, setWhatsappClassId] = useState("");
  const [whatsappRecipients, setWhatsappRecipients] = useState<any[]>([]);
  const [loadingWhatsappRecipients, setLoadingWhatsappRecipients] = useState(false);
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null);

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

    // Fetch SMS Gateway Info
    fetchSmsGatewayInfo();
  }, []);

  const fetchSmsGatewayInfo = () => {
    fetch("/api/admin/broadcast/sms")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSmsGatewayInfo(data);
        }
      })
      .catch(() => {});
  };

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

  // Fetch WhatsApp Recipient List
  const fetchWhatsappRecipients = () => {
    setLoadingWhatsappRecipients(true);
    fetch("/api/admin/broadcast/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: whatsappMessage,
        audience: whatsappAudience,
        classId: whatsappClassId || undefined,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.recipients) {
          setWhatsappRecipients(data.recipients);
        }
        setLoadingWhatsappRecipients(false);
      })
      .catch(() => setLoadingWhatsappRecipients(false));
  };

  useEffect(() => {
    if (activeSubTab === "NOTICES") fetchNotices();
    if (activeSubTab === "SMS_BROADCAST") fetchSmsGatewayInfo();
    if (activeSubTab === "WHATSAPP_GATEWAY") fetchWhatsappRecipients();
    if (activeSubTab === "DELIVERY") fetchDeliveries();
    if (activeSubTab === "TEMPLATES") fetchTemplates();
  }, [activeSubTab, statusFilter, categoryFilter, deliveryStatusFilter, whatsappAudience, whatsappClassId]);

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

  // Publish Notice Immediately
  const handlePublishNotice = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notices/${id}/publish`, { method: "POST" });
      if (res.ok) {
        fetchNotices();
      }
    } catch (err) {}
  };

  // Archive Notice
  const handleArchiveNotice = async (id: string) => {
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

  // Open Edit Notice Modal
  const handleOpenEditNotice = (n: any) => {
    setEditingNotice(n);
    setEditNoticeTitle(n.titleBn || "");
    setEditNoticeContent(n.contentBn || "");
    setEditNoticeCategory(n.category || "GENERAL");
    setEditNoticeAudience(n.audience || "PUBLIC");
    setEditNoticePriority(n.priority || "NORMAL");
    setEditNoticeStatus(n.status || "PUBLISHED");
    setEditNoticeIsPinned(Boolean(n.isPinned));
    setEditNoticeScheduledAt(n.scheduledAt ? new Date(n.scheduledAt).toISOString().slice(0, 16) : "");
    setEditNoticeExpiresAt(n.expiresAt ? new Date(n.expiresAt).toISOString().slice(0, 16) : "");
    setEditNoticeAttachmentUrl(n.attachmentUrl || "");
    setEditNoticeClassId(n.classId || "");
    setEditNoticeMsg(null);
  };

  // Update Notice Submit
  const handleUpdateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;
    setUpdatingNotice(true);
    setEditNoticeMsg(null);

    try {
      const res = await fetch(`/api/admin/notices/${editingNotice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleBn: editNoticeTitle,
          contentBn: editNoticeContent,
          category: editNoticeCategory,
          audience: editNoticeAudience,
          priority: editNoticePriority,
          status: editNoticeStatus,
          isPinned: editNoticeIsPinned,
          scheduledAt: editNoticeScheduledAt || null,
          expiresAt: editNoticeExpiresAt || null,
          attachmentUrl: editNoticeAttachmentUrl || null,
          classId: editNoticeClassId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditNoticeMsg({ text: data.error || "নোটিশ হালনাগাদ করতে ব্যর্থ হয়েছে।", type: "error" });
        setUpdatingNotice(false);
        return;
      }

      setEditingNotice(null);
      fetchNotices();
    } catch (err: any) {
      setEditNoticeMsg({ text: err.message, type: "error" });
    } finally {
      setUpdatingNotice(false);
    }
  };

  // Export Notices to Excel / CSV with UTF-8 BOM
  const exportNoticesToCSV = () => {
    if (!notices || notices.length === 0) {
      alert("এক্সপোর্ট করার জন্য কোনো নোটিশ তালিকা পাওয়া যায়নি।");
      return;
    }

    const headers = [
      "ক্রমিক",
      "নোটিশ আইডি",
      "শিরোনাম",
      "ক্যাটাগরি",
      "টার্গেট অডিয়েন্স",
      "অগ্রাধিকার",
      "স্ট্যাটাস",
      "পিন করা",
      "প্রকাশের তারিখ",
    ];
    const rows = notices.map((n, idx) => [
      idx + 1,
      n.id,
      `"${(n.titleBn || "").replace(/"/g, '""')}"`,
      n.category || "GENERAL",
      n.audience || "PUBLIC",
      n.priority || "NORMAL",
      n.status || "PUBLISHED",
      n.isPinned ? "হ্যাঁ" : "না",
      n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("bn-BD") : "-",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `EHRJ_Notices_List_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk SMS Broadcast Submit
  const handleSendBulkSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsMessage.trim()) {
      setSmsMsgFeedback({ text: "অনুগ্রহ করে এসএমএস বার্তা লিখুন।", type: "error" });
      return;
    }

    if (
      !confirm(
        `আপনি কি নিশ্চিত যে নির্বাচিত প্রাপকদের কাছে এই এসএমএস ব্রডকাস্ট পাঠাতে চান?\nআনুমানিক পার্টস: ${smsMetrics.smsCount} টি প্রতি নম্বরে।`
      )
    ) {
      return;
    }

    setSmsSending(true);
    setSmsMsgFeedback(null);

    try {
      const res = await fetch("/api/admin/broadcast/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: smsMessage,
          audience: smsAudience,
          classId: smsClassId || undefined,
          customNumbers:
            smsAudience === "CUSTOM"
              ? smsCustomNumbers
                  .split(/[\n,]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : undefined,
        }),
      });

      const data = await res.json();
      setSmsSending(false);

      if (res.ok && data.success) {
        setSmsMsgFeedback({
          text: data.message,
          type: "success",
        });
        setSmsMessage("");
        fetchSmsGatewayInfo();
      } else {
        setSmsMsgFeedback({
          text: data.error || "এসএমএস প্রেরণে সমস্যা হয়েছে।",
          type: "error",
        });
      }
    } catch (err: any) {
      setSmsSending(false);
      setSmsMsgFeedback({ text: "নেটওয়ার্ক ত্রুটি: " + err.message, type: "error" });
    }
  };

  // Broadcast Submit (Portal & Email)
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
      } else {
        alert(data.error || "বার্তা প্রেরণে সমস্যা হয়েছে।");
      }
    } catch (err) {
      setBcastSending(false);
      alert("নেটওয়ার্ক ত্রুটি");
    }
  };

  // Retry Email/SMS Delivery
  const handleRetryDelivery = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await fetch(`/api/admin/notifications/delivery/${id}/retry`, { method: "POST" });
      const data = await res.json();
      setRetryingId(null);
      if (res.ok) {
        alert("বার্তা সফলভাবে পুনরায় প্রেরণ করা হয়েছে।");
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
      alert(data.message || "শিডিউল প্রসেসর সম্পন্ন হয়েছে।");
      fetchNotices();
    } catch (err) {
      setRunningScheduler(false);
      alert("শিডিউল চালাতে সমস্যা হয়েছে");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 font-display">
              ডিজিটাল নোটিশবোর্ড ও ব্রডকাস্ট কন্ট্রোল সেন্টার
            </h2>
            <span className="bg-[#0D5C3A]/10 text-[#0D5C3A] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#0D5C3A]/20">
              Live Gateway
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            মাদরাসার প্রজ্ঞাপন, বাল্ক এসএমএস, হোয়াটসঅ্যাপ বার্তা এবং স্বয়ংক্রিয় নোটিফিকেশন সমন্বিত কেন্দ্র
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNoticeModal(true)}
            className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন নোটিশ তৈরি</span>
          </button>

          <button
            onClick={() => setActiveSubTab("SMS_BROADCAST")}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>বাল্ক এসএমএস পাঠান</span>
          </button>

          <button
            onClick={() => setActiveSubTab("WHATSAPP_GATEWAY")}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপ সেন্টার</span>
          </button>

          <button
            onClick={handleRunScheduler}
            disabled={runningScheduler}
            title="শিডিউল নোটিশ ও মেয়াদোত্তীর্ণ প্রসেসর চালান"
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Clock className={`w-3.5 h-3.5 ${runningScheduler ? "animate-spin text-amber-600" : ""}`} />
            <span>শিডিউল প্রসেসর</span>
          </button>
        </div>
      </div>

      {/* Main Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("NOTICES")}
          className={`pb-3 px-4 transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === "NOTICES"
              ? "border-[#0D5C3A] text-[#0D5C3A] font-black"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>নোটিশ বোর্ড (CMS) {noticeCounts.ALL ? `(${noticeCounts.ALL})` : ""}</span>
        </button>

        <button
          onClick={() => setActiveSubTab("SMS_BROADCAST")}
          className={`pb-3 px-4 transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === "SMS_BROADCAST"
              ? "border-[#0D5C3A] text-[#0D5C3A] font-black"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Smartphone className="w-4 h-4 text-amber-600" />
          <span>বাল্ক এসএমএস ব্রডকাস্ট</span>
        </button>

        <button
          onClick={() => setActiveSubTab("WHATSAPP_GATEWAY")}
          className={`pb-3 px-4 transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === "WHATSAPP_GATEWAY"
              ? "border-[#0D5C3A] text-[#0D5C3A] font-black"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>হোয়াটসঅ্যাপ ডিরেক্ট সেন্টার</span>
        </button>

        <button
          onClick={() => setActiveSubTab("DELIVERY")}
          className={`pb-3 px-4 transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === "DELIVERY"
              ? "border-[#0D5C3A] text-[#0D5C3A] font-black"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Mail className="w-4 h-4 text-blue-600" />
          <span>ডেলিভারি ও অডিট ট্র্যাকিং</span>
        </button>

        <button
          onClick={() => setActiveSubTab("TEMPLATES")}
          className={`pb-3 px-4 transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === "TEMPLATES"
              ? "border-[#0D5C3A] text-[#0D5C3A] font-black"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Settings className="w-4 h-4 text-purple-600" />
          <span>বার্তা ও নোটিশ টেমপ্লেট</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* 1. NOTICES CMS SUBTAB */}
      {/* ================================================================= */}
      {activeSubTab === "NOTICES" && (
        <div className="space-y-4">
          {/* Status Counts Filter Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            {["ALL", "PUBLISHED", "SCHEDULED", "DRAFT", "EXPIRED", "ARCHIVED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full border transition font-bold ${
                  statusFilter === st
                    ? "bg-[#0D5C3A] text-white border-[#0D5C3A] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
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

          {/* Search & Category Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="নোটিশের শিরোনাম বা বিবরণ দিয়ে খুঁজুন..."
                value={noticeSearch}
                onChange={(e) => setNoticeSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchNotices()}
                className="w-full outline-none text-xs text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-2 border border-slate-300 rounded-xl text-xs outline-none bg-white font-medium text-slate-700"
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
                onClick={exportNoticesToCSV}
                className="p-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                title="নোটিশ তালিকা এক্সেল / CSV ডাউনলোড"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV এক্সপোর্ট</span>
              </button>

              <button
                onClick={fetchNotices}
                className="p-2 border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600 transition"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingNotices ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Notices Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#052216] text-white font-bold tracking-wider text-[11px]">
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
                <tbody className="divide-y divide-slate-100">
                  {loadingNotices ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        নোটিশ লোড হচ্ছে...
                      </td>
                    </tr>
                  ) : notices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        কোনো নোটিশ পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    notices.map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 text-center">
                          {n.isPinned && (
                            <Pin className="w-4 h-4 text-amber-600 inline-block fill-amber-500" />
                          )}
                        </td>
                        <td className="p-3 max-w-sm">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {n.titleBn}
                            {n.priority === "URGENT" && (
                              <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                জরুরি
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                            {n.contentBn}
                          </p>
                          {n.attachmentUrl && (
                            <span className="text-[10px] text-[#0D5C3A] font-bold flex items-center gap-1 mt-1">
                              📎 সংযুক্ত ফাইল রয়েছে
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            {n.category}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-700 font-medium">
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
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              n.status === "PUBLISHED"
                                ? "bg-emerald-100 text-emerald-800"
                                : n.status === "SCHEDULED"
                                ? "bg-blue-100 text-blue-800"
                                : n.status === "DRAFT"
                                ? "bg-slate-100 text-slate-800"
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
                        <td className="p-3 text-[11px] text-slate-500 font-mono">
                          {new Date(n.publishedAt).toLocaleDateString("bn-BD")}
                          {n.status === "SCHEDULED" && n.scheduledAt && (
                            <span className="block text-[10px] text-blue-600">
                              শিডিউল: {new Date(n.scheduledAt).toLocaleDateString("bn-BD")}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          {/* Print Bulletin Button */}
                          <button
                            onClick={() => setSelectedNoticePrint(n)}
                            className="text-[#0D5C3A] hover:bg-emerald-50 p-1.5 rounded-lg border border-emerald-200 transition"
                            title="অফিসিয়াল নোটিশ বুলেটিন প্রিন্ট ও প্রিভিউ"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Notice Button */}
                          <button
                            onClick={() => handleOpenEditNotice(n)}
                            className="text-amber-700 hover:bg-amber-50 p-1.5 rounded-lg border border-amber-200 transition"
                            title="নোটিশ সম্পাদনা করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {n.status !== "PUBLISHED" && (
                            <button
                              onClick={() => handlePublishNotice(n.id)}
                              className="bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold hover:bg-emerald-800 shadow-sm"
                              title="এখনই প্রকাশ করুন"
                            >
                              প্রকাশ করুন
                            </button>
                          )}

                          {n.status === "PUBLISHED" && (
                            <button
                              onClick={() => handleArchiveNotice(n.id)}
                              className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100"
                              title="আর্কাইভ করুন"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteNotice(n.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
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
      {/* 2. SMS BROADCAST STUDIO SUBTAB */}
      {/* ================================================================= */}
      {activeSubTab === "SMS_BROADCAST" && (
        <div className="space-y-6">
          {/* Live SMS Gateway Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                <span>গেটওয়ে স্ট্যাটাস</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  সক্রিয় (ONLINE)
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {smsGatewayInfo?.gateway?.provider || "MOCK_GATEWAY"}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                প্রেরক আইডি: <strong className="text-[#0D5C3A]">EHRJMADRASHA</strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-bold block mb-1">অবশিষ্ট এসএমএস ক্রেডিট</span>
              <div className="text-2xl font-black text-[#0D5C3A] font-mono">
                {smsGatewayInfo?.gateway?.remainingCredits?.toLocaleString("bn-BD") || "৫,০০০"} টি
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">প্রতি এসএমএস: ৳০.৩৫</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-bold block mb-1">আজ প্রেরিত এসএমএস</span>
              <div className="text-2xl font-black text-blue-700 font-mono">
                {smsGatewayInfo?.gateway?.totalSentToday || 0} টি
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                সর্বমোট প্রেরণ: {smsGatewayInfo?.gateway?.allTimeSent || 0} টি
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-bold block mb-1">নিবন্ধিত অভিভাবক ফোন</span>
              <div className="text-2xl font-black text-amber-700 font-mono">
                {smsGatewayInfo?.audienceCounts?.guardiansWithPhone || 0} জন
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                শিক্ষক ফোন: {smsGatewayInfo?.audienceCounts?.teachersWithPhone || 0} জন
              </span>
            </div>
          </div>

          {/* SMS Broadcast Studio Composer */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display">
                  বাল্ক এসএমএস বার্তা কম্পোজার
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  অভিভাবক ও শিক্ষকদের কাছে এক ক্লিকে অফিশিয়াল বাংলা এসএমএস ব্রডকাস্ট করুন
                </p>
              </div>

              {/* Quick Template Picker */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 font-bold mr-1">রেডি টেমপ্লেট:</span>
                {DEFAULT_SMS_TEMPLATES.slice(0, 3).map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSmsMessage(tpl.templateBn)}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-lg transition"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            {smsMsgFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  smsMsgFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {smsMsgFeedback.type === "success" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span>{smsMsgFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSendBulkSms} className="space-y-4">
              {/* Audience Targeting Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    প্রাপক নির্বাচন (Target Audience) *
                  </label>
                  <select
                    value={smsAudience}
                    onChange={(e: any) => setSmsAudience(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none bg-white text-slate-800 focus:ring-2 focus:ring-[#0D5C3A]/20"
                  >
                    <option value="ALL_GUARDIANS">
                      সকল অভিভাবক ({smsGatewayInfo?.audienceCounts?.guardiansWithPhone || 0} জন)
                    </option>
                    <option value="ALL_TEACHERS">
                      সকল শিক্ষক ও উস্তাদ ({smsGatewayInfo?.audienceCounts?.teachersWithPhone || 0} জন)
                    </option>
                    <option value="ALL_STAFF">সকল স্টাফ (শিক্ষক + প্রশাসন)</option>
                    <option value="CLASS">নির্দিষ্ট জামাত / শ্রেণিভিত্তিক অভিভাবক</option>
                    <option value="CUSTOM">কাস্টম মোবাইল নম্বরসমূহ</option>
                  </select>
                </div>

                {smsAudience === "CLASS" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      নির্দিষ্ট জামাত / শ্রেণি নির্বাচন *
                    </label>
                    <select
                      value={smsClassId}
                      onChange={(e) => setSmsClassId(e.target.value)}
                      required
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none bg-white text-slate-800"
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

                {smsAudience === "CUSTOM" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      মোবাইল নম্বরসমূহ (কমা বা নতুন লাইন দিয়ে আলাদা করুন)
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: 01845162664, 01712345678"
                      value={smsCustomNumbers}
                      onChange={(e) => setSmsCustomNumbers(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Message Content Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  এসএমএস বার্তা (Bangla / English) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="বাংলা বা ইংরেজিতে এসএমএস বার্তা লিখুন..."
                  className="w-full p-3.5 border border-slate-300 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#0D5C3A]/20 focus:border-[#0D5C3A]"
                />

                {/* Real-time SMS Character & Cost Counter */}
                <div className="flex flex-wrap items-center justify-between text-xs mt-2 px-1 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-4">
                    <span>
                      অক্ষর সংখ্যা: <strong className="font-mono text-slate-900">{smsMetrics.charCount}</strong>
                    </span>
                    <span>
                      টাইপ:{" "}
                      <strong className="text-[#0D5C3A]">
                        {smsMetrics.isUnicode ? "বাংলা / ইউনিকোড (৭০ অক্ষর/এসএমএস)" : "ইংরেজি (১৬০ অক্ষর/এসএমএস)"}
                      </strong>
                    </span>
                    <span>
                      অবশিষ্ট অক্ষর: <strong className="font-mono">{smsMetrics.remainingInCurrentSms}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span>
                      মোট এসএমএস পার্টস:{" "}
                      <strong className="font-mono text-amber-700">{smsMetrics.smsCount} টি</strong>
                    </span>
                    <span>
                      আনুমানিক খরচ প্রতি নম্বর:{" "}
                      <strong className="font-mono text-emerald-800">৳{smsMetrics.estimatedCostBdt}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSmsMessage("")}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  ক্লিয়ার করুন
                </button>

                <button
                  type="submit"
                  disabled={smsSending || !smsMessage.trim()}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <Send className={`w-4 h-4 ${smsSending ? "animate-spin" : ""}`} />
                  <span>{smsSending ? "এসএমএস পাঠানো হচ্ছে..." : "এসএমএস ব্রডকাস্ট প্রেরণ করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. WHATSAPP GATEWAY & DIRECT CHAT SUBTAB */}
      {/* ================================================================= */}
      {activeSubTab === "WHATSAPP_GATEWAY" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 font-display">
                  হোয়াটসঅ্যাপ ডিরেক্ট ক্লিক-টু-চ্যাট গেটওয়ে
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                কোনো পেইড এপিআই ছাড়াই ব্রাউজার থেকে সরাসরি অভিভাবক ও শিক্ষকদের হোয়াটসঅ্যাপে পারসোনালাইজড মেসেজ পাঠান
              </p>
            </div>

            {/* Filters & Message Customizer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">প্রাপক ফিল্টার</label>
                <select
                  value={whatsappAudience}
                  onChange={(e) => setWhatsappAudience(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none bg-white"
                >
                  <option value="ALL_GUARDIANS">সকল অভিভাবক</option>
                  <option value="ALL_TEACHERS">সকল শিক্ষক ও উস্তাদ</option>
                  <option value="CLASS">নির্দিষ্ট জামাত / শ্রেণি</option>
                </select>
              </div>

              {whatsappAudience === "CLASS" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">জামাত নির্বাচন</label>
                  <select
                    value={whatsappClassId}
                    onChange={(e) => setWhatsappClassId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none bg-white"
                  >
                    <option value="">সকল শ্রেণি...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={whatsappAudience === "CLASS" ? "sm:col-span-1" : "sm:col-span-2"}>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বার্তা প্রিভিউ (Dynamic Tokens: {"{GUARDIAN}"}, {"{STUDENT}"})
                </label>
                <input
                  type="text"
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
              <span>মোট প্রস্তুতকৃত প্রাপক: <strong className="text-slate-800">{whatsappRecipients.length} জন</strong></span>
              <button
                onClick={fetchWhatsappRecipients}
                className="text-[#0D5C3A] font-bold flex items-center gap-1 hover:underline"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingWhatsappRecipients ? "animate-spin" : ""}`} />
                <span>তালিকা রিফ্রেশ করুন</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Recipients Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#052216] text-white font-bold text-[11px]">
                  <tr>
                    <th className="p-3 w-12 text-center">ক্রম</th>
                    <th className="p-3">প্রাপকের নাম</th>
                    <th className="p-3">শিক্ষার্থী / জামাত</th>
                    <th className="p-3 font-mono">মোবাইল নম্বর</th>
                    <th className="p-3 text-right">হোয়াটসঅ্যাপ অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingWhatsappRecipients ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        প্রাপক তালিকা লোড হচ্ছে...
                      </td>
                    </tr>
                  ) : whatsappRecipients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        কোনো ফোন নম্বর সংবলিত প্রাপক পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    whatsappRecipients.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{r.name}</td>
                        <td className="p-3 text-slate-600">
                          {r.studentName ? (
                            <span>
                              {r.studentName} {r.className && `(${r.className})`}
                            </span>
                          ) : (
                            <span className="text-slate-400">{r.role}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-[#0D5C3A]">{r.phone}</td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(r.whatsAppLink);
                              setCopiedLinkIndex(idx);
                              setTimeout(() => setCopiedLinkIndex(null), 2000);
                            }}
                            className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg border border-slate-200 transition"
                            title="লিংক কপি করুন"
                          >
                            {copiedLinkIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <a
                            href={r.whatsAppLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp খুলুন</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                          </a>
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
      {/* 4. DELIVERY AUDIT TRACKING SUBTAB */}
      {/* ================================================================= */}
      {activeSubTab === "DELIVERY" && (
        <div className="space-y-4">
          {deliverySummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 block">মোট কিউতে আছে</span>
                <span className="text-lg font-black text-blue-600 font-mono">{deliverySummary.QUEUED || 0} টি</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 block">সফলভাবে প্রেরিত</span>
                <span className="text-lg font-black text-emerald-600 font-mono">{deliverySummary.SENT || 0} টি</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 block">ব্যর্থ ডেলিভারি</span>
                <span className="text-lg font-black text-red-600 font-mono">{deliverySummary.FAILED || 0} টি</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 block">বাতিলকৃত</span>
                <span className="text-lg font-black text-slate-600 font-mono">{deliverySummary.CANCELLED || 0} টি</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800">
                এসএমএস ও ইমেইল ডেলিভারি ট্র্যাকিং ও অডিট লগ
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={deliveryStatusFilter}
                  onChange={(e) => setDeliveryStatusFilter(e.target.value)}
                  className="p-1.5 border border-slate-300 rounded-xl text-xs outline-none bg-white font-medium"
                >
                  <option value="ALL">সকল স্ট্যাটাস</option>
                  <option value="DELIVERED">ডেলিভার্ড (DELIVERED)</option>
                  <option value="SENT">সফল (SENT)</option>
                  <option value="FAILED">ব্যর্থ (FAILED)</option>
                  <option value="QUEUED">কিউতে আছে (QUEUED)</option>
                </select>
                <button
                  onClick={fetchDeliveries}
                  className="p-1.5 border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#052216] text-white font-bold text-[11px]">
                  <tr>
                    <th className="p-3">চ্যানেল</th>
                    <th className="p-3">প্রাপক গন্তব্য (Destination)</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3">চেষ্টা সংখ্যা</th>
                    <th className="p-3">প্রোভাইডার আইডি / তারিখ</th>
                    <th className="p-3 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingDeliveries ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        ডেলিভারি রেকর্ড লোড হচ্ছে...
                      </td>
                    </tr>
                  ) : deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        কোনো ডেলিভারি রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    deliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.channel === "SMS"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-blue-100 text-blue-900"
                            }`}
                          >
                            {d.channel}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">{d.destination}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                        <td className="p-3 font-mono">{d.attemptCount} / {d.maxAttempts}</td>
                        <td className="p-3 text-[11px] text-slate-500 font-mono truncate max-w-xs">
                          {d.deliveredAt ? new Date(d.deliveredAt).toLocaleString("bn-BD") : d.providerMessageId || "-"}
                        </td>
                        <td className="p-3 text-right">
                          {d.status === "FAILED" && (
                            <button
                              onClick={() => handleRetryDelivery(d.id)}
                              disabled={retryingId === d.id}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 ml-auto shadow-sm"
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
      {/* 5. TEMPLATES SUBTAB */}
      {/* ================================================================= */}
      {activeSubTab === "TEMPLATES" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                প্রাতিষ্ঠানিক নোটিফিকেশন ও এসএমএস টেমপ্লেট লাইব্রেরি
              </h3>
              <p className="text-xs text-slate-500">
                ছুটি, ফি তাগাদা, পরীক্ষা এবং রেজাল্ট সংক্রান্ত রেডিমেড মেসেজ ও নোটিশ টেমপ্লেট
              </p>
            </div>
            <button
              onClick={fetchTemplates}
              className="text-xs text-[#0D5C3A] font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_SMS_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition bg-slate-50/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{tpl.title}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {tpl.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 font-mono">
                  {tpl.templateBn}
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSmsMessage(tpl.templateBn);
                      setActiveSubTab("SMS_BROADCAST");
                    }}
                    className="bg-[#0D5C3A] hover:bg-emerald-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>এসএমএসে ব্যবহার করুন</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* NOTICE BULLETIN PRINT MODAL (ESTD 2021, NO EIIN) */}
      {/* ================================================================= */}
      {selectedNoticePrint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 print:shadow-none print:p-0">
            {/* Action Bar (Hidden during print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <span className="font-bold text-xs text-slate-600 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0D5C3A]" />
                অফিসিয়াল নোটিশ বুলেটিন প্রিন্ট ও প্রিভিউ
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট করুন</span>
                </button>
                <button
                  onClick={() => setSelectedNoticePrint(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="p-8 border-2 border-[#0D5C3A] rounded-2xl bg-white print:border-none print:p-0">
              {/* Institution Header */}
              <div className="text-center pb-4 border-b-2 border-[#0D5C3A]">
                <p className="text-xs text-[#063320] font-serif mb-1 font-bold">
                  بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                </p>
                <h1 className="text-2xl font-black text-[#041F14] font-display">
                  {INSTITUTION_INFO.nameBn}
                </h1>
                <p className="text-xs text-slate-700 font-medium mt-0.5">
                  {INSTITUTION_INFO.addressBn} • স্থাপিত: ২০২১ ইং (ESTD 2021)
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  ফোন: {INSTITUTION_INFO.primaryPhone} • ইমেইল: {INSTITUTION_INFO.email}
                </p>
                <div className="inline-block bg-[#0D5C3A] text-white text-[11px] font-bold px-4 py-1 rounded-full mt-3">
                  অফিসিয়াল প্রশাসনিক প্রজ্ঞাপন (Official Institutional Circular)
                </div>
              </div>

              {/* Memo & Date Meta Row */}
              <div className="flex justify-between items-center text-xs py-3 border-b border-slate-200 font-mono text-slate-700">
                <div>
                  <strong>স্মারক নং:</strong> EHRJ/প্রজ্ঞাপন/২০২৬/{selectedNoticePrint.id.substring(0, 8).toUpperCase()}
                </div>
                <div>
                  <strong>তারিখ:</strong>{" "}
                  {new Date(selectedNoticePrint.publishedAt || selectedNoticePrint.createdAt).toLocaleDateString("bn-BD")}
                </div>
              </div>

              {/* Notice Title Banner */}
              <div className="my-5 p-3 bg-slate-50 border-y border-slate-200 text-center">
                <span className="text-[11px] text-[#0D5C3A] font-bold uppercase tracking-wider block">
                  বিজ্ঞপ্তির বিষয়:
                </span>
                <h2 className="text-base font-black text-slate-900 mt-1">
                  {selectedNoticePrint.titleBn}
                </h2>
              </div>

              {/* Notice Content */}
              <div className="py-4 text-xs leading-relaxed text-slate-800 whitespace-pre-line font-medium min-h-[160px]">
                {selectedNoticePrint.contentBn}
              </div>

              {/* Dual Official Signature Block */}
              <div className="pt-16 flex items-end justify-between text-xs text-slate-700">
                <div className="text-center">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-600 block">নাযেম-ই-তা'লীমাত / সচিব</span>
                  <span className="text-[9px] text-slate-400">প্রচার ও শিক্ষা বিভাগ</span>
                </div>

                <div className="text-center">
                  <div className="w-44 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] font-bold text-slate-900 block">{INSTITUTION_INFO.principal}</span>
                  <span className="text-[9px] text-slate-700 font-semibold block">মুহতামিম / অধ্যক্ষ</span>
                  <span className="text-[9px] text-slate-500">{INSTITUTION_INFO.nameBn}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NOTICE MODAL */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">নতুন নোটিশ তৈরি করুন</h3>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {noticeMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold ${
                  noticeMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {noticeMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">নোটিশের শিরোনাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ঈদুল ফিতর উপলক্ষে মাদরাসা বন্ধের নোটিশ"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">নোটিশের বিস্তারিত বিবরণ *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="বিস্তারিত বিবরণ লিখুন..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value)}
                    className="w-full p-2.5 border rounded-xl outline-none bg-white"
                  >
                    <option value="GENERAL">সাধারণ বিজ্ঞপ্তি</option>
                    <option value="ACADEMIC">একাডেমিক</option>
                    <option value="EXAM">পরীক্ষা সংক্রান্ত</option>
                    <option value="ADMISSION">ভর্তি সংক্রান্ত</option>
                    <option value="HOLIDAY">ছুটির নোটিশ</option>
                    <option value="EMERGENCY">জরুরি ঘোষণা</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">প্রাপক / টার্গেট অডিয়েন্স</label>
                  <select
                    value={noticeAudience}
                    onChange={(e) => setNoticeAudience(e.target.value)}
                    className="w-full p-2.5 border rounded-xl outline-none bg-white"
                  >
                    <option value="PUBLIC">উন্মুক্ত (পাবলিক নোটিশবোর্ড)</option>
                    <option value="ALL_GUARDIANS">সকল অভিভাবক</option>
                    <option value="ALL_TEACHERS">সকল শিক্ষক ও উস্তাদ</option>
                    <option value="CLASS">নির্দিষ্ট জামাত / শ্রেণি</option>
                  </select>
                </div>
              </div>

              {noticeAudience === "CLASS" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">নির্দিষ্ট জামাত নির্বাচন *</label>
                  <select
                    value={noticeClassId}
                    onChange={(e) => setNoticeClassId(e.target.value)}
                    required
                    className="w-full p-2.5 border rounded-xl outline-none bg-white"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">অগ্রাধিকার</label>
                  <select
                    value={noticePriority}
                    onChange={(e) => setNoticePriority(e.target.value as any)}
                    className="w-full p-2 border rounded-xl outline-none bg-white"
                  >
                    <option value="NORMAL">স্বাভাবিক (Normal)</option>
                    <option value="IMPORTANT">গুরুত্বপূর্ণ</option>
                    <option value="URGENT">জরুরি (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">স্ট্যাটাস</label>
                  <select
                    value={noticeStatus}
                    onChange={(e) => setNoticeStatus(e.target.value as any)}
                    className="w-full p-2 border rounded-xl outline-none bg-white"
                  >
                    <option value="PUBLISHED">সরাসরি প্রকাশ করুন</option>
                    <option value="SCHEDULED">শিডিউল করুন</option>
                    <option value="DRAFT">ড্রাফট রাখুন</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={noticeIsPinned}
                      onChange={(e) => setNoticeIsPinned(e.target.checked)}
                      className="w-4 h-4 text-[#0D5C3A] rounded"
                    />
                    <span>উপরে পিন করুন</span>
                  </label>
                </div>
              </div>

              {noticeStatus === "SCHEDULED" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">প্রকাশের শিডিউল তারিখ ও সময় *</label>
                  <input
                    type="datetime-local"
                    required
                    value={noticeScheduledAt}
                    onChange={(e) => setNoticeScheduledAt(e.target.value)}
                    className="w-full p-2.5 border rounded-xl outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-5 py-2 rounded-xl font-bold shadow transition"
                >
                  নোটিশ সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT NOTICE MODAL */}
      {editingNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">নোটিশ সম্পাদনা করুন</h3>
              </div>
              <button
                onClick={() => setEditingNotice(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editNoticeMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold ${
                  editNoticeMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {editNoticeMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateNotice} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">নোটিশের শিরোনাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={editNoticeTitle}
                  onChange={(e) => setEditNoticeTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">নোটিশের বিস্তারিত বিবরণ *</label>
                <textarea
                  required
                  rows={5}
                  value={editNoticeContent}
                  onChange={(e) => setEditNoticeContent(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={editNoticeCategory}
                    onChange={(e) => setEditNoticeCategory(e.target.value)}
                    className="w-full p-2.5 border rounded-xl outline-none bg-white"
                  >
                    <option value="GENERAL">সাধারণ বিজ্ঞপ্তি</option>
                    <option value="ACADEMIC">একাডেমিক</option>
                    <option value="EXAM">পরীক্ষা সংক্রান্ত</option>
                    <option value="ADMISSION">ভর্তি সংক্রান্ত</option>
                    <option value="HOLIDAY">ছুটির নোটিশ</option>
                    <option value="EMERGENCY">জরুরি ঘোষণা</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">প্রাপক / টার্গেট অডিয়েন্স</label>
                  <select
                    value={editNoticeAudience}
                    onChange={(e) => setEditNoticeAudience(e.target.value)}
                    className="w-full p-2.5 border rounded-xl outline-none bg-white"
                  >
                    <option value="PUBLIC">উন্মুক্ত (পাবলিক নোটিশবোর্ড)</option>
                    <option value="ALL_GUARDIANS">সকল অভিভাবক</option>
                    <option value="ALL_TEACHERS">সকল শিক্ষক ও উস্তাদ</option>
                    <option value="CLASS">নির্দিষ্ট জামাত / শ্রেণি</option>
                  </select>
                </div>
              </div>

              {editNoticeAudience === "CLASS" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">নির্দিষ্ট জামাত নির্বাচন</label>
                  <select
                    value={editNoticeClassId}
                    onChange={(e) => setEditNoticeClassId(e.target.value)}
                    className="w-full p-2.5 border rounded-xl outline-none bg-white"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">অগ্রাধিকার</label>
                  <select
                    value={editNoticePriority}
                    onChange={(e) => setEditNoticePriority(e.target.value as any)}
                    className="w-full p-2 border rounded-xl outline-none bg-white"
                  >
                    <option value="NORMAL">স্বাভাবিক (Normal)</option>
                    <option value="IMPORTANT">গুরুত্বপূর্ণ</option>
                    <option value="URGENT">জরুরি (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">স্ট্যাটাস</label>
                  <select
                    value={editNoticeStatus}
                    onChange={(e) => setEditNoticeStatus(e.target.value as any)}
                    className="w-full p-2 border rounded-xl outline-none bg-white"
                  >
                    <option value="PUBLISHED">প্রকাশিত</option>
                    <option value="SCHEDULED">শিডিউলকৃত</option>
                    <option value="DRAFT">ড্রাফট</option>
                    <option value="ARCHIVED">আর্কাইভ</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editNoticeIsPinned}
                      onChange={(e) => setEditNoticeIsPinned(e.target.checked)}
                      className="w-4 h-4 text-[#0D5C3A] rounded"
                    />
                    <span>উপরে পিন করুন</span>
                  </label>
                </div>
              </div>

              {editNoticeStatus === "SCHEDULED" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">প্রকাশের শিডিউল তারিখ ও সময় *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editNoticeScheduledAt}
                    onChange={(e) => setEditNoticeScheduledAt(e.target.value)}
                    className="w-full p-2.5 border rounded-xl outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">সংযুক্ত ফাইল লিংক (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="https://... অথবা /uploads/..."
                  value={editNoticeAttachmentUrl}
                  onChange={(e) => setEditNoticeAttachmentUrl(e.target.value)}
                  className="w-full p-2 border rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingNotice(null)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={updatingNotice}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl font-bold shadow transition flex items-center gap-1.5"
                >
                  {updatingNotice && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>হালনাগাদ সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
