"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Paperclip,
  Send,
  Eye,
  RefreshCw,
  User,
  Tag,
  Calendar,
  X,
  ChevronRight,
  ArrowLeft,
  Shield,
  HelpCircle,
} from "lucide-react";

interface GuardianHelpdeskHubProps {
  studentId?: string;
  initialTicketId?: string;
}

export default function GuardianHelpdeskHub({ studentId, initialTicketId }: GuardianHelpdeskHubProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [guardianInfo, setGuardianInfo] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(studentId || "");
  const [loading, setLoading] = useState(true);

  // Ticket creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [catCode, setCatCode] = useState("GENERAL");
  const [reqType, setReqType] = useState<"COMPLAINT" | "SERVICE_REQUEST" | "CORRECTION_REQUEST" | "SUPPORT_REQUEST" | "FEEDBACK">("SERVICE_REQUEST");
  const [priority, setPriority] = useState<"NORMAL" | "IMPORTANT" | "URGENT">("NORMAL");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [relatedEntityType, setRelatedEntityType] = useState("");
  const [relatedEntityId, setRelatedEntityId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Ticket detail view
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialTicketId || null);
  const [ticketDetail, setTicketDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // User reply in detail
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Reopen prompt
  const [showReopenPrompt, setShowReopenPrompt] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [submittingReopen, setSubmittingReopen] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch Requests
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStudentId) params.set("studentId", selectedStudentId);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/portal/helpdesk?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRequests(json.items || []);
        if (json.guardian) setGuardianInfo(json.guardian);
        if (json.categories) setCategories(json.categories);
      }
    } catch (err) {
      console.error("Error fetching guardian helpdesk:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId, statusFilter]);

  // Fetch Ticket Detail
  const fetchTicketDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/portal/helpdesk/${id}`);
      const json = await res.json();
      if (json.success) {
        setTicketDetail(json.ticket);
      } else {
        alert(json.error || "অনুরোধ লোড করা সম্ভব হয়নি।");
      }
    } catch (err) {
      console.error("Error loading ticket detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetail(selectedTicketId);
    } else {
      setTicketDetail(null);
    }
  }, [selectedTicketId, fetchTicketDetail]);

  // Submit New Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setErrorMsg("বিষয় ও বিস্তারিত বিবরণ আবশ্যক।");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/portal/helpdesk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId || undefined,
          categoryCode: catCode,
          requestType: reqType,
          priority,
          subject: subject.trim(),
          description: description.trim(),
          relatedEntityType: relatedEntityType || undefined,
          relatedEntityId: relatedEntityId ? relatedEntityId.trim() : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setSubject("");
        setDescription("");
        setRelatedEntityType("");
        setRelatedEntityId("");
        fetchRequests();
        if (json.ticket?.id) {
          setSelectedTicketId(json.ticket.id);
        }
      } else {
        setErrorMsg(json.error || "অনুরোধ দাখিল ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setErrorMsg("সার্ভার ত্রুটি: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Reply
  const handleSendReply = async () => {
    if (!selectedTicketId || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/portal/helpdesk/${selectedTicketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText }),
      });
      const json = await res.json();
      if (json.success) {
        setReplyText("");
        fetchTicketDetail(selectedTicketId);
      } else {
        alert(json.error || "বার্তা পাঠানো সম্ভব হয়নি।");
      }
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Request Reopen
  const handleRequestReopen = async () => {
    if (!selectedTicketId || !reopenReason.trim()) return;
    setSubmittingReopen(true);
    try {
      const res = await fetch(`/api/portal/helpdesk/${selectedTicketId}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reopenReason.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setShowReopenPrompt(false);
        setReopenReason("");
        fetchTicketDetail(selectedTicketId);
        fetchRequests();
      } else {
        alert(json.error || "পুনর্বিবেচনার আবেদন সম্ভব হয়নি।");
      }
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setSubmittingReopen(false);
    }
  };

  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">দাখিলকৃত</span>;
      case "UNDER_REVIEW":
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">পর্যালোচনাধীন</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">প্রক্রিয়াধীন</span>;
      case "WAITING_FOR_INFORMATION":
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">অতিরিক্ত তথ্য প্রয়োজন</span>;
      case "RESOLVED":
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">সমাধান সম্পন্ন</span>;
      case "CLOSED":
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">বন্ধ</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">প্রত্যাখ্যাত</span>;
      case "REOPEN_REQUESTED":
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">পুনর্বিবেচনাধীন</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white">জরুরি</span>;
      case "IMPORTANT":
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500 text-white">গুরুত্বপূর্ণ</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-700 text-white">সাধারণ</span>;
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
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#083B25] to-[#0D5C3A] text-white p-5 rounded-2xl border-2 border-[#C59B27] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-[#C59B27] flex items-center justify-center shadow-inner">
            <LifeBuoy className="w-7 h-7 text-[#fef08a]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-white flex items-center gap-2">
              <span>অভিযোগ ও প্রাতিষ্ঠানিক সেবা ডেস্ক</span>
            </h2>
            <p className="text-xs text-emerald-200 mt-0.5">
              মাদরাসা কর্তৃপক্ষের কাছে যেকোনো সমস্যা, ফি বা ফলাফল আপত্তি, নথিপত্র বা তথ্য সংশোধনের আবেদন করুন
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-[#C59B27] hover:bg-[#b0881f] text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন আবেদন / অভিযোগ দাখিল</span>
        </button>
      </div>

      {/* Child Switcher & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">শিক্ষার্থী নির্বাচন:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
          >
            <option value="">সব সন্তান / সাধারণ আবেদন</option>
            {guardianInfo?.children?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.fullNameBn} ({c.studentIdNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="">সব স্ট্যাটাস</option>
            <option value="SUBMITTED">দাখিলকৃত</option>
            <option value="UNDER_REVIEW">পর্যালোচনাধীন</option>
            <option value="IN_PROGRESS">প্রক্রিয়াধীন</option>
            <option value="WAITING_FOR_INFORMATION">তথ্য চাওয়া হয়েছে</option>
            <option value="RESOLVED">সমাধান সম্পন্ন</option>
            <option value="CLOSED">বন্ধ</option>
          </select>

          <button
            onClick={() => fetchRequests()}
            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"
            title="রিফ্রেশ"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main View: Request List or Ticket Detail */}
      {selectedTicketId && ticketDetail ? (
        /* ================= TICKET DETAIL VIEW ================= */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-6 p-5 sm:p-6">
          {/* Back button & Ticket Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <button
              onClick={() => setSelectedTicketId(null)}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>অনুরোধ তালিকায় ফিরে যান</span>
            </button>
            <div className="flex items-center gap-2">
              {getStatusBadge(ticketDetail.status)}
              {getPriorityBadge(ticketDetail.priority)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {ticketDetail.ticketNumber}
              </span>
              <span>•</span>
              <span>{ticketDetail.category?.nameBn}</span>
              <span>•</span>
              <span>{getTypeLabel(ticketDetail.requestType)}</span>
              <span>•</span>
              <span>{new Date(ticketDetail.createdAt).toLocaleDateString("bn-BD")}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{ticketDetail.subject}</h3>
          </div>

          {/* Linked Student Info */}
          {ticketDetail.student && (
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 text-xs flex items-center gap-2 text-emerald-900">
              <User className="w-4 h-4 text-emerald-700" />
              <span>
                শিক্ষার্থী: <strong>{ticketDetail.student.fullNameBn}</strong> (আইডি: {ticketDetail.student.studentIdNumber})
              </span>
            </div>
          )}

          {/* Original Complaint / Description */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
            <span className="font-bold text-gray-700 block">আপনার দাখিলকৃত বিবরণ:</span>
            <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">{ticketDetail.description}</p>
          </div>

          {/* Resolution Card if Resolved */}
          {ticketDetail.status === "RESOLVED" && ticketDetail.resolutionSummary && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-4 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>মাদরাসা প্রশাসনের আনুষ্ঠানিক সমাধান:</span>
              </div>
              <p className="text-gray-800 pl-6 leading-relaxed">{ticketDetail.resolutionSummary}</p>
              <div className="pl-6 pt-2 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  মীমাংসার তারিখ: {new Date(ticketDetail.resolutionDate).toLocaleString("bn-BD")}
                </span>
                <button
                  onClick={() => setShowReopenPrompt(true)}
                  className="text-xs text-amber-800 hover:text-amber-950 font-semibold underline"
                >
                  সমস্যা সমাধান হয়নি? পুনর্বিবেচনার আবেদন করুন
                </button>
              </div>
            </div>
          )}

          {/* Reopen Request Prompt */}
          {showReopenPrompt && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <h4 className="font-bold text-xs text-amber-900">টিকেটের পুনর্বিবেচনার যৌক্তিক কারণ লিখুন:</h4>
              <textarea
                rows={2}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="কেন আপনি সন্তুষ্ট নন বা কী সমস্যা রয়ে গেছে তা লিখুন..."
                className="w-full p-2.5 text-xs border rounded-lg focus:ring-1 focus:ring-amber-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowReopenPrompt(false)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleRequestReopen}
                  disabled={submittingReopen || !reopenReason.trim()}
                  className="px-3 py-1.5 bg-amber-700 text-white text-xs font-semibold rounded hover:bg-amber-800 disabled:opacity-50"
                >
                  আবেদন নিশ্চিত করুন
                </button>
              </div>
            </div>
          )}

          {/* Conversation History (Official Public Responses only) */}
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">
              অগ্রগতি ও প্রাতিষ্ঠানিক বার্তা
            </h4>

            <div className="space-y-3">
              {ticketDetail.messages?.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl text-xs space-y-1 ${
                    msg.messageType === "ADMIN_RESPONSE"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-950"
                      : "bg-gray-50 border border-gray-200 text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-800">
                      {msg.messageType === "ADMIN_RESPONSE" ? "মাদরাসা প্রশাসন" : "আপনি (অভিভাবক)"}
                    </span>
                    <span className="text-gray-400">
                      {new Date(msg.createdAt).toLocaleString("bn-BD")}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              ))}
            </div>

            {/* User Reply Box (Only if not closed) */}
            {ticketDetail.status !== "CLOSED" && (
              <div className="pt-2 space-y-2">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="কর্তৃপক্ষের উদ্দেশ্যে কোনো মন্তব্য বা অতিরিক্ত তথ্য থাকলে লিখুন..."
                  className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSendReply}
                    disabled={submittingReply || !replyText.trim()}
                    className="px-4 py-2 bg-[#083B25] hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>উত্তর পাঠান</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= TICKET LIST VIEW ================= */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-600">
              আপনার দাখিলকৃত অনুরোধসমূহ ({requests.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="text-center py-12 text-gray-400 text-xs">লোড হচ্ছে...</div>
            ) : requests.length > 0 ? (
              requests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedTicketId(req.id)}
                  className="p-4 hover:bg-emerald-50/40 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {req.ticketNumber}
                      </span>
                      <h4 className="font-bold text-sm text-gray-900">{req.subject}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>{req.category?.nameBn}</span>
                      <span>•</span>
                      <span>{getTypeLabel(req.requestType)}</span>
                      {req.student && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">
                            {req.student.fullNameBn} ({req.student.studentIdNumber})
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(req.createdAt).toLocaleDateString("bn-BD")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {getStatusBadge(req.status)}
                    {getPriorityBadge(req.priority)}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 px-4 space-y-3">
                <LifeBuoy className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-500 font-medium">আপনার কোনো সক্রিয় বা পূর্ববর্তী অনুরোধ দাখিল করা নেই।</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-[#083B25] text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 transition"
                >
                  নতুন অনুরোধ দাখিল করুন
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* NEW TICKET CREATION MODAL */}
      {/* ================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateTicket}
            className="bg-white w-full max-w-lg rounded-2xl p-6 border-2 border-[#C59B27] shadow-2xl space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#083B25] flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-[#C59B27]" />
                <span>নতুন অনুরোধ / অভিযোগ দাখিল</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              {/* Child Selection */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  কোন সন্তানের ব্যাপারে আবেদন? (ঐচ্ছিক):
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="">সাধারণ / যেকোনো বিষয়ের আবেদন</option>
                  {guardianInfo?.children?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.fullNameBn} ({c.studentIdNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category & Request Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">ক্যাটাগরি বা বিষয় *</label>
                  <select
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-emerald-600"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.code}>{c.nameBn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">আবেদনের ধরন *</label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value as any)}
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="SERVICE_REQUEST">সার্ভিস রিকুয়েস্ট (সেবা পেতে)</option>
                    <option value="COMPLAINT">অভিযোগ (সমস্যা রিপোর্ট)</option>
                    <option value="CORRECTION_REQUEST">তথ্য সংশোধন আবেদন</option>
                    <option value="SUPPORT_REQUEST">সহায়তা / টেকনিক্যাল সাপোর্ট</option>
                    <option value="FEEDBACK">মতামত ও পরামর্শ</option>
                  </select>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">জরুরিত্ব / অগ্রাধিকার *</label>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`p-2 border rounded-lg text-center cursor-pointer font-medium ${priority === "NORMAL" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "text-gray-600"}`}>
                    <input type="radio" name="priority" value="NORMAL" checked={priority === "NORMAL"} onChange={() => setPriority("NORMAL")} className="sr-only" />
                    সাধারণ
                  </label>
                  <label className={`p-2 border rounded-lg text-center cursor-pointer font-medium ${priority === "IMPORTANT" ? "border-amber-600 bg-amber-50 text-amber-800" : "text-gray-600"}`}>
                    <input type="radio" name="priority" value="IMPORTANT" checked={priority === "IMPORTANT"} onChange={() => setPriority("IMPORTANT")} className="sr-only" />
                    গুরুত্বপূর্ণ
                  </label>
                  <label className={`p-2 border rounded-lg text-center cursor-pointer font-medium ${priority === "URGENT" ? "border-red-600 bg-red-50 text-red-800 font-bold" : "text-gray-600"}`}>
                    <input type="radio" name="priority" value="URGENT" checked={priority === "URGENT"} onChange={() => setPriority("URGENT")} className="sr-only" />
                    জরুরি
                  </label>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">আবেদনের বিষয় *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মার্চ মাসের বেতন সংক্রান্ত রশিদ সংশোধন..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">বিস্তারিত বিবরণ *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="আপনার বক্তব্য বা সমস্যা বিস্তারিতভাবে লিখুন যাতে প্রশাসন দ্রুত বুঝতে পারে..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Optional Entity Link */}
              <div className="pt-1">
                <details className="text-gray-500">
                  <summary className="cursor-pointer font-semibold hover:text-gray-800">
                    + কোনো ইনভয়েস বা ডকুমেন্টের রেফারেন্স নম্বর যুক্ত করতে চান?
                  </summary>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                    <select
                      value={relatedEntityType}
                      onChange={(e) => setRelatedEntityType(e.target.value)}
                      className="p-2 border rounded text-xs"
                    >
                      <option value="">মডিউল ধরন বেছে নিন</option>
                      <option value="INVOICE">ইনভয়েস (Fee Invoice)</option>
                      <option value="DOCUMENT_REQUEST">ডকুমেন্ট রিকুয়েস্ট</option>
                      <option value="RESULT">পরীক্ষার ফলাফল</option>
                    </select>
                    <input
                      type="text"
                      placeholder="রেফারেন্স আইডি..."
                      value={relatedEntityId}
                      onChange={(e) => setRelatedEntityId(e.target.value)}
                      className="p-2 border rounded text-xs font-mono"
                    />
                  </div>
                </details>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-[#083B25] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow disabled:opacity-50"
              >
                {submitting ? "দাখিল হচ্ছে..." : "দাখিল নিশ্চিত করুন"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
