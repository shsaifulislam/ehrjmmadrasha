"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  Trophy,
  Award,
  QrCode,
  FileText,
  BarChart3,
  ChevronRight,
  RefreshCw,
  Eye,
  Sliders,
  ShieldCheck,
  Check,
} from "lucide-react";
import { InstitutionalEvent, EventTypeConfig } from "@/lib/events/types";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function AdminEventsCockpit() {
  const [events, setEvents] = useState<InstitutionalEvent[]>([]);
  const [types, setTypes] = useState<EventTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Selection & Details Drawer
  const [selectedEvent, setSelectedEvent] = useState<InstitutionalEvent | null>(null);
  const [drawerTab, setDrawerTab] = useState<"OVERVIEW" | "PARTICIPANTS" | "RESULTS" | "CERTIFICATES" | "REPORT">("OVERVIEW");
  const [participants, setParticipants] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [report, setReport] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modals & Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitleBn, setNewTitleBn] = useState("");
  const [newTitleEn, setNewTitleEn] = useState("");
  const [newTypeCode, setNewTypeCode] = useState("QURAN_COMPETITION");
  const [newStartAt, setNewStartAt] = useState("2026-11-10T09:00");
  const [newEndAt, setNewEndAt] = useState("2026-11-10T16:00");
  const [newVenue, setNewVenue] = useState("দারুল হাদিস অডিটোরিয়াম");
  const [newCapacity, setNewCapacity] = useState("100");
  const [newDescription, setNewDescription] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [newRequiresReg, setNewRequiresReg] = useState(true);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Result entry form
  const [resStudentId, setResStudentId] = useState("");
  const [resCategory, setResCategory] = useState("সাধারণ বিভাগ");
  const [resScore, setResScore] = useState("95");
  const [resRank, setResRank] = useState("1");
  const [resAward, setResAward] = useState("FIRST_PLACE");
  const [resJudge, setResJudge] = useState("মুহতামিম সাহেব");
  const [resComment, setResComment] = useState("চমৎকার সহিহ মাখরাজ ও সুর");

  // Certificate issuance form
  const [certStudentId, setCertStudentId] = useState("");
  const [certCategory, setCertCategory] = useState<"PARTICIPATION" | "WINNER" | "APPRECIATION">("WINNER");
  const [certAwardText, setCertAwardText] = useState("১ম স্থান অধিকার করায় সম্মাননা সনদ");

  // Manual Check-in form
  const [checkInCode, setCheckInCode] = useState("");
  const [checkInStatus, setCheckInStatus] = useState<"PRESENT" | "ABSENT" | "LATE">("PRESENT");

  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchEvents = () => {
    setLoading(true);
    fetch("/api/events?role=ADMIN")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvents(data.data || []);
          setTypes(data.types || []);
        }
      })
      .catch((err) => console.error("Error fetching events:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const loadEventDetails = async (eventId: string) => {
    setLoadingDetails(true);
    try {
      const [regRes, resRes, certRes, repRes] = await Promise.all([
        fetch(`/api/events/${eventId}/register?role=ADMIN`),
        fetch(`/api/events/${eventId}/results?role=ADMIN`),
        fetch(`/api/events/${eventId}/certificates`),
        fetch(`/api/events/${eventId}/report`),
      ]);
      const regData = await regRes.json();
      const resData = await resRes.json();
      const certData = await certRes.json();
      const repData = await repRes.json();

      if (regData.success) setParticipants(regData.data || []);
      if (resData.success) setResults(resData.data || []);
      if (certData.success) setCertificates(certData.data || []);
      if (repData.success) setReport(repData.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectEvent = (evt: InstitutionalEvent) => {
    setSelectedEvent(evt);
    setDrawerTab("OVERVIEW");
    loadEventDetails(evt.id);
  };

  const handleStatusTransition = async (targetStatus: string) => {
    if (!selectedEvent) return;
    setActionMessage(null);
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStatus,
          actorRole: "ADMIN",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: "success", text: `স্ট্যাটাস সফলভাবে পরিবর্তিত: ${targetStatus}` });
        setSelectedEvent(data.data);
        fetchEvents();
      } else {
        setActionMessage({ type: "error", text: data.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।" });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ type: "error", text: "সার্ভারে যোগাযোগ করা যায়নি।" });
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreate(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeCode: newTypeCode,
          titleBn: newTitleBn,
          titleEn: newTitleEn,
          descriptionBn: newDescription,
          startAt: new Date(newStartAt).toISOString(),
          endAt: new Date(newEndAt).toISOString(),
          venueText: newVenue,
          maxCapacity: Number(newCapacity) || 0,
          isRegistrationRequired: newRequiresReg,
          isPublic: newIsPublic,
          status: "DRAFT",
          actorRole: "ADMIN",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setActionMessage({ type: "success", text: "নতুন ইভেন্ট ড্রাফট সফলভাবে তৈরি হয়েছে!" });
        setNewTitleBn("");
        setNewTitleEn("");
        setNewDescription("");
        fetchEvents();
      } else {
        setActionMessage({ type: "error", text: data.error || "ইভেন্ট তৈরি ব্যর্থ হয়েছে।" });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ type: "error", text: "সার্ভারে যোগাযোগ করা যায়নি।" });
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleRecordResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !resStudentId) return;

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: resStudentId,
          competitionCategory: resCategory,
          score: Number(resScore),
          rank: Number(resRank),
          awardType: resAward,
          judgeName: resJudge,
          judgeCommentsBn: resComment,
          isPublished: true,
          actorRole: "ADMIN",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: "success", text: "প্রতিযোগিতার ফলাফল সফলভাবে সংরক্ষিত ও প্রকাশিত হয়েছে।" });
        loadEventDetails(selectedEvent.id);
      } else {
        setActionMessage({ type: "error", text: data.error || "ফলাফল সংরক্ষণ ব্যর্থ হয়েছে।" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !certStudentId) return;

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: certStudentId,
          category: certCategory,
          awardTextBn: certAwardText,
          actorRole: "ADMIN",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: "success", text: `সনদপত্র সফলভাবে ইস্যু করা হয়েছে! সনদ নং: ${data.data.certificateNumber}` });
        loadEventDetails(selectedEvent.id);
      } else {
        setActionMessage({ type: "error", text: data.error || "সনদপত্র ইস্যু ব্যর্থ হয়েছে।" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !checkInCode) return;

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIdOrCode: checkInCode,
          status: checkInStatus,
          recordedMethod: "MANUAL_PANEL",
          teacherName: "প্রশাসনিক কর্মকর্তা",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: "success", text: `উপস্থিতি সফলভাবে রেকর্ড করা হয়েছে: ${data.data.studentNameBn}` });
        setCheckInCode("");
        loadEventDetails(selectedEvent.id);
      } else {
        setActionMessage({ type: "error", text: data.error || "উপস্থিতি গ্রহণ ব্যর্থ হয়েছে।" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.titleBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.titleEn && e.titleEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.venueText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "ALL" || e.typeCode === selectedType;
    const matchesStatus = selectedStatus === "ALL" || e.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // KPIs
  const totalEventsCount = events.length;
  const activeRegistrationsCount = events.reduce((sum, e) => sum + e.registeredCount, 0);
  const completedEventsCount = events.filter((e) => e.status === "COMPLETED").length;
  const upcomingEventsCount = events.filter((e) => ["APPROVED", "PUBLISHED", "REGISTRATION_OPEN"].includes(e.status)).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Top Header */}
      <header className="bg-[#083B25] text-white border-b border-emerald-800 px-6 py-4 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-800 text-[#C59B27] px-2.5 py-0.5 rounded border border-emerald-600/50">
                Phase 35 Engine
              </span>
              <span className="text-xs text-emerald-300 font-mono">EHRJ-EVT-OPS</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              প্রাতিষ্ঠানিক ইভেন্ট, প্রতিযোগিতা ও সহশিক্ষা ব্যবস্থাপনা
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-[#C59B27] hover:bg-[#b0891f] text-gray-900 font-bold px-4 py-2 rounded-lg text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> নতুন ইভেন্ট তৈরি করুন
            </button>
            <button
              onClick={fetchEvents}
              className="p-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600/50"
              title="রিফ্রেশ"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold block">মোট ইভেন্ট</span>
              <span className="text-xl font-extrabold text-gray-900">{totalEventsCount} টি</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold block">আসন্ন আয়োজন</span>
              <span className="text-xl font-extrabold text-gray-900">{upcomingEventsCount} টি</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold block">সক্রিয় রেজিস্ট্রেশন</span>
              <span className="text-xl font-extrabold text-gray-900">{activeRegistrationsCount} জন</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold block">সম্পন্ন আয়োজন</span>
              <span className="text-xl font-extrabold text-gray-900">{completedEventsCount} টি</span>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              actionMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {actionMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {actionMessage.text}
          </div>
        )}

        {/* Filters & Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center flex-1">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ইভেন্ট বা ভেন্যু খুঁজুন..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none"
              >
                <option value="ALL">সকল ধরন</option>
                {types.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.nameBn}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none"
              >
                <option value="ALL">সকল স্ট্যাটাস</option>
                <option value="DRAFT">DRAFT</option>
                <option value="REVIEW">REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="REGISTRATION_OPEN">REGISTRATION_OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              মোট: <span className="font-bold text-gray-800">{filteredEvents.length}</span> টি ইভেন্ট
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-700 font-bold">
                  <th className="p-3">আইডি ও শিরোনাম</th>
                  <th className="p-3">ধরন</th>
                  <th className="p-3">তারিখ ও সময়সূচি</th>
                  <th className="p-3">ভেন্যু</th>
                  <th className="p-3">আসন / রেজিস্ট্রেশন</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    onClick={() => handleSelectEvent(evt)}
                    className={`cursor-pointer transition-colors ${
                      selectedEvent?.id === evt.id ? "bg-emerald-50/60" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-bold text-gray-900">{evt.titleBn}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{evt.id}</div>
                    </td>
                    <td className="p-3 text-gray-600 font-semibold">{evt.typeCode.replace("_", " ")}</td>
                    <td className="p-3 text-gray-600">
                      {new Date(evt.startAt).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="p-3 text-gray-600 truncate max-w-[150px]">{evt.venueText}</td>
                    <td className="p-3">
                      <span className="font-bold text-gray-800">
                        {evt.registeredCount}/{evt.maxCapacity > 0 ? evt.maxCapacity : "সীমাহীন"}
                      </span>
                      {evt.waitlistedCount > 0 && (
                        <span className="text-[10px] text-amber-700 block">
                          (ওয়েটলিস্ট: {evt.waitlistedCount})
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {evt.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectEvent(evt);
                        }}
                        className="p-1 rounded hover:bg-gray-200 text-gray-600"
                        title="পরিচালনা করুন"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Event Management Drawer */}
        {selectedEvent && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-4 border-b border-gray-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {selectedEvent.id}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    স্ট্যাটাস: {selectedEvent.status}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">{selectedEvent.titleBn}</h2>
                <p className="text-xs text-gray-500 font-light">
                  স্থান: {selectedEvent.venueText} | সময়: {new Date(selectedEvent.startAt).toLocaleString("bn-BD")}
                </p>
              </div>

              {/* Status Transition Control */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">স্ট্যাটাস রূপান্তর:</span>
                <select
                  value={selectedEvent.status}
                  onChange={(e) => handleStatusTransition(e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-lg border border-emerald-600 bg-emerald-50 text-emerald-900 font-bold focus:outline-none"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="REVIEW">REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="REGISTRATION_OPEN">REGISTRATION_OPEN</option>
                  <option value="REGISTRATION_CLOSED">REGISTRATION_CLOSED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
              {(["OVERVIEW", "PARTICIPANTS", "RESULTS", "CERTIFICATES", "REPORT"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    drawerTab === tab
                      ? "bg-[#083B25] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tab === "OVERVIEW" && "সংক্ষিপ্ত বিবরণ"}
                  {tab === "PARTICIPANTS" && `অংশগ্রহণকারী (${participants.length})`}
                  {tab === "RESULTS" && `ফলাফল (${results.length})`}
                  {tab === "CERTIFICATES" && `সনদপত্র (${certificates.length})`}
                  {tab === "REPORT" && "সারসংক্ষেপ প্রতিবেদন"}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            {drawerTab === "OVERVIEW" && (
              <div className="space-y-4 text-xs text-gray-700">
                <p className="leading-relaxed whitespace-pre-line">{selectedEvent.descriptionBn}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50">
                  <div>
                    <span className="font-semibold text-gray-500 block">ক্যালেন্ডার আইডি</span>
                    <span className="font-mono font-bold">{selectedEvent.calendarEventId || "সিঙ্ক হয়নি"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">রিসোর্স বুকিং</span>
                    <span className="font-mono font-bold">{selectedEvent.bookingId || "প্রযোজ্য নয়"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">পাবলিক ভিজিবিলিটি</span>
                    <span className="font-bold">{selectedEvent.isPublic ? "পাবলিক" : "অভ্যন্তরীণ"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block">রেজিস্ট্রেশন বাধ্যতামূলক?</span>
                    <span className="font-bold">{selectedEvent.isRegistrationRequired ? "হ্যাঁ" : "না"}</span>
                  </div>
                </div>
              </div>
            )}

            {drawerTab === "PARTICIPANTS" && (
              <div className="space-y-4">
                {/* Manual Check-in Sub-Form */}
                <form onSubmit={handleManualCheckIn} className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 flex flex-wrap gap-3 items-center">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                    <QrCode className="w-4 h-4" /> দ্রুত চেক-ইন:
                  </span>
                  <input
                    type="text"
                    value={checkInCode}
                    onChange={(e) => setCheckInCode(e.target.value)}
                    placeholder="মাদরাসা আইডি বা কিউআর কোড"
                    className="text-xs p-2 rounded-lg border border-gray-300 w-48 bg-white"
                  />
                  <select
                    value={checkInStatus}
                    onChange={(e: any) => setCheckInStatus(e.target.value)}
                    className="text-xs p-2 rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="PRESENT">উপস্থিত (PRESENT)</option>
                    <option value="LATE">বিলম্বে উপস্থিত (LATE)</option>
                    <option value="ABSENT">অনুপস্থিত (ABSENT)</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-[#083B25] hover:bg-emerald-900 text-white font-bold px-3 py-2 rounded-lg text-xs"
                  >
                    হালনাগাদ করুন
                  </button>
                </form>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200">
                        <th className="p-2.5">রেজিস্ট্রেশন আইডি</th>
                        <th className="p-2.5">শিক্ষার্থীর নাম</th>
                        <th className="p-2.5">জামাত ও রোল</th>
                        <th className="p-2.5">অভিভাবক ও ফোন</th>
                        <th className="p-2.5">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {participants.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="p-2.5 font-mono text-gray-500">{p.id}</td>
                          <td className="p-2.5 font-bold text-gray-900">
                            {p.studentNameBn}
                            <span className="block text-[11px] font-mono text-gray-500 font-normal">
                              {p.studentIdNumber}
                            </span>
                          </td>
                          <td className="p-2.5 text-gray-600">
                            {p.classNameBn || "সাধারণ"} (রোল: {p.rollNumber || "-"})
                          </td>
                          <td className="p-2.5 text-gray-600">
                            {p.guardianNameBn}
                            <span className="block text-[10px] text-gray-400">{p.guardianPhone}</span>
                          </td>
                          <td className="p-2.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {participants.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-400">
                            কোনো রেজিস্ট্রেশন পাওয়া যায়নি।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {drawerTab === "RESULTS" && (
              <div className="space-y-6">
                {/* Result submission form */}
                <form onSubmit={handleRecordResult} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-[#C59B27]" /> প্রতিযোগিতার মূল্যায়ন ও ফলাফল লিপিবদ্ধকরণ
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-gray-600 mb-1">শিক্ষার্থী নির্বাচন (আইডি):</label>
                      <input
                        type="text"
                        value={resStudentId}
                        onChange={(e) => setResStudentId(e.target.value)}
                        placeholder="শিক্ষার্থী আইডি (studentId)"
                        className="w-full p-2 border rounded-lg bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">প্রতিযোগিতার ক্যাটাগরি:</label>
                      <input
                        type="text"
                        value={resCategory}
                        onChange={(e) => setResCategory(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">প্রাপ্ত নম্বর (১০০-তে):</label>
                      <input
                        type="number"
                        value={resScore}
                        onChange={(e) => setResScore(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">স্থান / অবস্থান (Rank):</label>
                      <input
                        type="number"
                        value={resRank}
                        onChange={(e) => setResRank(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">স্বীকৃতির ধরন:</label>
                      <select
                        value={resAward}
                        onChange={(e) => setResAward(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white"
                      >
                        <option value="FIRST_PLACE">১ম স্থান (First Place)</option>
                        <option value="SECOND_PLACE">২য় স্থান (Second Place)</option>
                        <option value="THIRD_PLACE">৩য় স্থান (Third Place)</option>
                        <option value="WINNER">বিজয়ী (Winner)</option>
                        <option value="SPECIAL_RECOGNITION">বিশেষ স্বীকৃতি</option>
                        <option value="PARTICIPATION">অংশগ্রহণকারী</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">বিচারকের মন্তব্য:</label>
                      <input
                        type="text"
                        value={resComment}
                        onChange={(e) => setResComment(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#083B25] hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-lg text-xs"
                  >
                    ফলাফল সংরক্ষণ ও প্রকাশ করুন
                  </button>
                </form>

                {/* Published Results list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700">সংরক্ষিত ফলাফল তালিকা:</h4>
                  {results.map((r) => (
                    <div key={r.id} className="p-3 bg-white border border-gray-200 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-gray-900">{r.studentNameBn}</span>
                        <span className="text-gray-500 font-mono ml-2">({r.studentIdNumber})</span>
                        <span className="block text-gray-600">{r.competitionCategory} | নম্বর: {r.score}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-800 text-sm">{r.rank}ম স্থান</span>
                        <span className="block text-[10px] text-gray-400 font-mono">{r.awardType}</span>
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && <p className="text-xs text-gray-400">কোনো ফলাফল লিপিবদ্ধ নেই।</p>}
                </div>
              </div>
            )}

            {drawerTab === "CERTIFICATES" && (
              <div className="space-y-6">
                {/* Certificate issuance form */}
                <form onSubmit={handleIssueCertificate} className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-700" /> অফিশিয়াল ডিজিটাল সনদপত্র তৈরি (Phase 7/29 Integration)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-gray-600 mb-1">শিক্ষার্থী আইডি (studentId):</label>
                      <input
                        type="text"
                        value={certStudentId}
                        onChange={(e) => setCertStudentId(e.target.value)}
                        placeholder="শিক্ষার্থী আইডি"
                        className="w-full p-2 border rounded-lg bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">সনদপত্রের ক্যাটাগরি:</label>
                      <select
                        value={certCategory}
                        onChange={(e: any) => setCertCategory(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white"
                      >
                        <option value="WINNER">বিজয়ী সম্মাননা সনদ (WINNER)</option>
                        <option value="PARTICIPATION">অংশগ্রহণমূলক সনদ (PARTICIPATION)</option>
                        <option value="APPRECIATION">কৃতজ্ঞতা সনদ (APPRECIATION)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">প্রশংসাসূচক বাক্য / অ্যাওয়ার্ড টেক্সট:</label>
                      <input
                        type="text"
                        value={certAwardText}
                        onChange={(e) => setCertAwardText(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#083B25] hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-lg text-xs"
                  >
                    সনদপত্র ইস্যু করুন
                  </button>
                </form>

                {/* Issued Certificates */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700">ইস্যুকৃত সনদপত্রসমূহ:</h4>
                  {certificates.map((c) => (
                    <div key={c.id} className="p-3 bg-white border border-emerald-200 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-gray-900">{c.studentNameBn}</span>
                        <span className="text-emerald-700 font-mono ml-2">[{c.certificateNumber}]</span>
                        <span className="block text-gray-500 font-mono text-[11px]">ভেরিফিকেশন কোড: {c.verificationCode}</span>
                      </div>
                      <div className="text-right">
                        <Link
                          href={`/verify/document/${encodeURIComponent(c.verificationCode)}`}
                          target="_blank"
                          className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" /> পাবলিক ভেরিফিকেশন
                        </Link>
                      </div>
                    </div>
                  ))}
                  {certificates.length === 0 && <p className="text-xs text-gray-400">কোনো সনদপত্র এখনও ইস্যু করা হয়নি।</p>}
                </div>
              </div>
            )}

            {drawerTab === "REPORT" && report && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-700" />
                    ইভেন্ট সম্পন্নকরণ ও এনগেজমেন্ট সারসংক্ষেপ
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-gray-500 block">মোট আবেদনকৃত:</span>
                      <span className="text-base font-bold text-gray-900">{report.totalRegistered} জন</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-gray-500 block">উপস্থিতি হার:</span>
                      <span className="text-base font-bold text-emerald-700">{report.attendanceRatePercent}%</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-gray-500 block">ইস্যুকৃত সনদপত্র:</span>
                      <span className="text-base font-bold text-blue-700">{report.certificatesIssuedCount} টি</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-gray-500 block">গড় রেটিং:</span>
                      <span className="text-base font-bold text-[#C59B27]">{report.feedbackSummary.averageRating} / ৫.০</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-700" /> নতুন প্রাতিষ্ঠানিক ইভেন্ট তৈরি করুন
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">ইভেন্টের বাংলা শিরোনাম *</label>
                <input
                  type="text"
                  value={newTitleBn}
                  onChange={(e) => setNewTitleBn(e.target.value)}
                  placeholder="উদাঃ বার্ষিক ক্বেরাত প্রতিযোগিতা ২০২৬"
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">ইংরেজি শিরোনাম (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  placeholder="e.g. Annual Qira'at Competition 2026"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">ইভেন্টের ধরন</label>
                  <select
                    value={newTypeCode}
                    onChange={(e) => setNewTypeCode(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    {types.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">নির্ধারিত আসন (০ = সীমাহীন)</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">শুরুর সময়</label>
                  <input
                    type="datetime-local"
                    value={newStartAt}
                    onChange={(e) => setNewStartAt(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">সমাপ্তির সময়</label>
                  <input
                    type="datetime-local"
                    value={newEndAt}
                    onChange={(e) => setNewEndAt(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">ভেন্যু / নির্ধারিত স্থান</label>
                <input
                  type="text"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">বিস্তারিত বিবরণ</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded-lg"
                  placeholder="ইভেন্টের লক্ষ্য ও উদ্দেশ্য লিখুন..."
                />
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsPublic}
                    onChange={(e) => setNewIsPublic(e.target.checked)}
                    className="rounded text-emerald-700"
                  />
                  <span>পাবলিক ওয়েবসাইটে প্রদর্শন করুন</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRequiresReg}
                    onChange={(e) => setNewRequiresReg(e.target.checked)}
                    className="rounded text-emerald-700"
                  />
                  <span>রেজিস্ট্রেশন আবশ্যক</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-5 py-2 rounded-lg bg-[#083B25] hover:bg-emerald-900 text-white font-bold shadow-md"
                >
                  {submittingCreate ? "তৈরি হচ্ছে..." : "ইভেন্ট সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
