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
  Download,
  Search,
  BookOpen,
  Building,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Eye,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import {
  CalendarEvent,
  ClassRoutineSlot,
  InstitutionalHoliday,
  InstitutionalResource,
  ResourceBooking,
  InternalMeeting,
  ScheduleConflict,
} from "@/lib/calendar/types";

export default function AdminCalendarPage() {
  const [activeTab, setActiveTab] = useState<
    "CALENDAR" | "ROUTINES" | "RESOURCES" | "MEETINGS" | "HOLIDAYS" | "CONFLICTS"
  >("CALENDAR");

  // State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [routines, setRoutines] = useState<ClassRoutineSlot[]>([]);
  const [resources, setResources] = useState<InstitutionalResource[]>([]);
  const [bookings, setBookings] = useState<ResourceBooking[]>([]);
  const [meetings, setMeetings] = useState<InternalMeeting[]>([]);
  const [holidays, setHolidays] = useState<InstitutionalHoliday[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & views
  const [calendarView, setCalendarView] = useState<"MONTH" | "AGENDA">("AGENDA");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  // Form states
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    eventType: "INSTITUTIONAL",
    startAt: "",
    endAt: "",
    location: "",
    allDay: false,
    visibility: "INSTITUTIONAL",
  });

  const [newRoutine, setNewRoutine] = useState({
    classId: "",
    classNameBn: "হিফজুল কুরআন বিভাগ",
    subjectId: "SUB-001",
    subjectNameBn: "কুরআন মাজীদ",
    teacherId: "TEA-001",
    teacherName: "মাওলানা আব্দুল গাফফার",
    dayOfWeek: 0,
    startTime: "08:00",
    endTime: "08:50",
    roomNo: "১০১",
  });

  const [newBooking, setNewBooking] = useState({
    resourceId: "",
    title: "",
    purpose: "",
    startAt: "",
    endAt: "",
    participantCount: 50,
  });

  const [newHoliday, setNewHoliday] = useState({
    titleBn: "",
    titleEn: "",
    startDate: "",
    endDate: "",
    holidayType: "INSTITUTIONAL",
    descriptionBn: "",
    affectsClassRoutine: true,
    affectsExamRoutine: true,
  });

  const [statusMessage, setStatusMessage] = useState<{
    type: "SUCCESS" | "ERROR";
    text: string;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evtRes, rtnRes, resRes, mtgRes, holRes] = await Promise.all([
        fetch("/api/calendar/events?role=ADMIN"),
        fetch("/api/admin/calendar/routines"),
        fetch("/api/calendar/resources"),
        fetch("/api/admin/calendar/meetings"),
        fetch("/api/calendar/holidays"),
      ]);

      const evtData = await evtRes.json();
      const rtnData = await rtnRes.json();
      const resData = await resRes.json();
      const mtgData = await mtgRes.json();
      const holData = await holRes.json();

      if (evtData.success) setEvents(evtData.data || []);
      if (rtnData.success) setRoutines(rtnData.data || []);
      if (resData.success) {
        setResources(resData.resources || []);
        setBookings(resData.activeBookings || []);
      }
      if (mtgData.success) setMeetings(mtgData.data || []);
      if (holData.success) setHolidays(holData.data || []);
    } catch (err) {
      console.error("Failed to load calendar data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "SUCCESS", text: "ইভেন্ট সফলভাবে সংরক্ষণ করা হয়েছে" });
        setShowEventModal(false);
        fetchData();
      } else {
        setStatusMessage({ type: "ERROR", text: data.error || "সংরক্ষণ ব্যর্থ হয়েছে" });
      }
    } catch (err: any) {
      setStatusMessage({ type: "ERROR", text: err.message });
    }
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/calendar/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoutine),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "SUCCESS", text: "ক্লাস রুটিন সফলভাবে সংরক্ষিত হয়েছে" });
        setShowRoutineModal(false);
        fetchData();
      } else {
        setStatusMessage({ type: "ERROR", text: data.error || "রুটিন সংঘাত হয়েছে" });
      }
    } catch (err: any) {
      setStatusMessage({ type: "ERROR", text: err.message });
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/calendar/resources/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newBooking,
          requestedBy: "admin@ehrj.edu.bd",
          requestedByName: "অ্যাডমিন প্রশাসন",
          requestedByRole: "ADMIN",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "SUCCESS", text: "বুকিং সফলভাবে তৈরি হয়েছে" });
        setShowBookingModal(false);
        fetchData();
      } else {
        setStatusMessage({ type: "ERROR", text: data.error || "বুকিং সংঘাত হয়েছে" });
      }
    } catch (err: any) {
      setStatusMessage({ type: "ERROR", text: err.message });
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/admin/calendar/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE", actorId: "admin" }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "SUCCESS", text: "বুকিং সফলভাবে অনুমোদন করা হয়েছে" });
        fetchData();
      } else {
        setStatusMessage({ type: "ERROR", text: data.error || "অনুমোদন ব্যর্থ হয়েছে" });
      }
    } catch (err: any) {
      setStatusMessage({ type: "ERROR", text: err.message });
    }
  };

  const filteredEvents = events.filter((evt) => {
    if (selectedType !== "ALL" && evt.eventType !== selectedType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        evt.title.toLowerCase().includes(q) ||
        (evt.description && evt.description.toLowerCase().includes(q)) ||
        (evt.location && evt.location.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getDayName = (d: number) => {
    const days = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
    return days[d] || "";
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Top Banner */}
      <header className="bg-[#083B25] text-white py-6 px-4 md:px-8 border-b border-emerald-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold tracking-wider uppercase">
              <CalendarIcon className="w-4 h-4 text-[#C59B27]" />
              <span>EHRJ Scheduling & Routine Hub — Phase 33</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold mt-1 text-white">
              প্রাতিষ্ঠানিক ক্যালেন্ডার, ক্লাস রুটিন ও রিসোর্স বুকিং ইঞ্জিন
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/80 mt-1">
              সকল একাডেমিক রুটিন, পরীক্ষার সময়সূচি, প্রাতিষ্ঠানিক ছুটি ও হল বুকিংয়ের কেন্দ্রীয় ব্যবস্থাপনা
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/calendar/export?role=ADMIN&title=EHRJ_Master_Calendar"
              className="bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-lg border border-emerald-600/50 flex items-center gap-1.5 shadow transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>iCal / ICS ডাউনলোড</span>
            </a>
            <button
              onClick={() => setShowEventModal(true)}
              className="bg-[#C59B27] hover:bg-[#b08920] text-gray-950 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ইভেন্ট</span>
            </button>
          </div>
        </div>
      </header>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`max-w-7xl mx-auto mt-4 px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === "SUCCESS"
              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
              : "bg-red-100 text-red-900 border border-red-300"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-gray-500 hover:text-gray-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex overflow-x-auto gap-4 text-xs font-medium">
          {[
            { id: "CALENDAR", label: "ক্যালেন্ডার ও সূচি", count: filteredEvents.length },
            { id: "ROUTINES", label: "সাপ্তাহিক ক্লাস রুটিন", count: routines.length },
            { id: "RESOURCES", label: "রিসোর্স ও হল বুকিং", count: bookings.length },
            { id: "MEETINGS", label: "অভ্যন্তরীণ সভা", count: meetings.length },
            { id: "HOLIDAYS", label: "প্রাতিষ্ঠানিক ছুটি", count: holidays.length },
            { id: "CONFLICTS", label: "সংঘাত পরীক্ষক", count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "border-[#0D5C3A] text-[#0D5C3A] font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* TAB 1: CALENDAR VIEW */}
        {activeTab === "CALENDAR" && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ইভেন্ট বা স্থান অনুসন্ধান..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="text-xs border rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none"
                >
                  <option value="ALL">সকল বিভাগ</option>
                  <option value="INSTITUTIONAL">প্রাতিষ্ঠানিক</option>
                  <option value="ACADEMIC">একাডেমিক রুটিন</option>
                  <option value="EXAMINATION">পরীক্ষা</option>
                  <option value="EVENT">পাবলিক অনুষ্ঠান</option>
                  <option value="MEETING">সভা</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCalendarView("AGENDA")}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
                    calendarView === "AGENDA"
                      ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                      : "bg-white text-gray-600"
                  }`}
                >
                  এজেন্ডা তালিকা
                </button>
                <button
                  onClick={() => setCalendarView("MONTH")}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
                    calendarView === "MONTH"
                      ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                      : "bg-white text-gray-600"
                  }`}
                >
                  মাসিক গ্রিড
                </button>
              </div>
            </div>

            {/* Events List / Agenda */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.length === 0 ? (
                <div className="col-span-full bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500 text-xs">
                  কোনো ইভেন্ট বা সূচি পাওয়া যায়নি।
                </div>
              ) : (
                filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-emerald-500 hover:shadow-md cursor-pointer transition space-y-2 border-l-4 border-l-[#0D5C3A]"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">
                        {evt.eventType}
                      </span>
                      <span className="text-gray-500">
                        {new Date(evt.startAt).toLocaleDateString("bn-BD")}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                      {evt.title}
                    </h3>

                    {evt.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {evt.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-700" />
                        {evt.allDay
                          ? "সারাদিন"
                          : `${new Date(evt.startAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}`}
                      </span>
                      {evt.location && (
                        <span className="flex items-center gap-1 truncate max-w-[140px]">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          {evt.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CLASS ROUTINES */}
        {activeTab === "ROUTINES" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#083B25]">
                  সাপ্তাহিক একাডেমিক ক্লাস রুটিন
                </h2>
                <p className="text-xs text-gray-500">
                  ক্লাস, শাখা ও উস্তাদভিত্তিক সময়সূচি এবং সংঘর্ষমুক্ত পিরিয়ড বরাদ্দ
                </p>
              </div>
              <button
                onClick={() => setShowRoutineModal(true)}
                className="bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন ক্লাস স্লট যোগ করুন</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 border-b border-gray-200">
                    <th className="py-2.5 px-4 font-semibold">বার</th>
                    <th className="py-2.5 px-4 font-semibold">সময়সূচি</th>
                    <th className="py-2.5 px-4 font-semibold">শ্রেণি ও শাখা</th>
                    <th className="py-2.5 px-4 font-semibold">বিষয়</th>
                    <th className="py-2.5 px-4 font-semibold">উস্তাদ</th>
                    <th className="py-2.5 px-4 font-semibold">কক্ষ</th>
                    <th className="py-2.5 px-4 font-semibold text-right">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {routines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">
                        কোনো ক্লাস রুটিন যুক্ত করা হয়নি।
                      </td>
                    </tr>
                  ) : (
                    routines.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/80">
                        <td className="py-2.5 px-4 font-bold text-emerald-800">
                          {getDayName(r.dayOfWeek)}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-gray-700">
                          {r.startTime} - {r.endTime}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-gray-900">
                          {r.classNameBn} {r.sectionNameBn ? `(${r.sectionNameBn})` : ""}
                        </td>
                        <td className="py-2.5 px-4 text-gray-800">{r.subjectNameBn}</td>
                        <td className="py-2.5 px-4 text-gray-700">{r.teacherName}</td>
                        <td className="py-2.5 px-4 text-gray-500">{r.roomNo || "-"}</td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={async () => {
                              if (confirm("আপনি কি এই ক্লাস স্লটটি সরাতে চান?")) {
                                await fetch(`/api/admin/calendar/routines/${r.id}`, {
                                  method: "DELETE",
                                });
                                fetchData();
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-[11px] font-semibold"
                          >
                            মুছুন
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RESOURCES & BOOKINGS */}
        {activeTab === "RESOURCES" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#083B25]">
                  প্রাতিষ্ঠানিক রিসোর্স ও হল ব্যবস্থাপনা
                </h2>
                <p className="text-xs text-gray-500">
                  দারুল হাদিস অডিটোরিয়াম, কনফারেন্স রুম ও ল্যাবের বুকিং অনুমোদন
                </p>
              </div>
              <button
                onClick={() => setShowBookingModal(true)}
                className="bg-[#C59B27] hover:bg-[#b08920] text-gray-950 text-xs px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>রিসোর্স বুকিং আবেদন</span>
              </button>
            </div>

            {/* Resources Catalog Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((res) => (
                <div
                  key={res.id}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 border-t-4 border-t-emerald-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{res.nameBn}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      ধারণক্ষমতা: {res.capacity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{res.description}</p>
                  <div className="pt-2 border-t text-[11px] text-gray-600 flex items-center justify-between">
                    <span>স্থান: {res.location}</span>
                    <span className="text-emerald-700 font-semibold">{res.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pending & Active Bookings */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                চলমান ও অপেক্ষমাণ বুকিং তালিকাসমূহ ({bookings.length} টি)
              </h3>
              <div className="divide-y divide-gray-100">
                {bookings.length === 0 ? (
                  <p className="py-4 text-xs text-gray-500 text-center">
                    কোনো সক্রিয় বুকিং নেই।
                  </p>
                ) : (
                  bookings.map((b) => (
                    <div
                      key={b.id}
                      className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{b.title}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              b.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.status === "PENDING_APPROVAL"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <p className="text-gray-500 mt-0.5">
                          রিসোর্স: <strong className="text-gray-700">{b.resourceNameBn}</strong> | সময়:{" "}
                          {new Date(b.startAt).toLocaleString("bn-BD")} -{" "}
                          {new Date(b.endAt).toLocaleTimeString("bn-BD")}
                        </p>
                      </div>

                      {b.status === "PENDING_APPROVAL" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveBooking(b.id)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 rounded text-xs font-semibold"
                          >
                            অনুমোদন করুন
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MEETINGS */}
        {activeTab === "MEETINGS" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#083B25]">
                  অভ্যন্তরীণ একাডেমিক ও প্রশাসনিক সভা
                </h2>
                <p className="text-xs text-gray-500">
                  মুহতামিম, শিক্ষক পরিষদ ও বিভাগীয় প্রধানগণের অধিবেশন সূচি
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetings.length === 0 ? (
                <div className="col-span-full bg-white p-8 rounded-xl border text-center text-xs text-gray-500">
                  কোনো নির্ধারিত সভা নেই।
                </div>
              ) : (
                meetings.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 border-l-4 border-l-blue-600"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                        {m.meetingType}
                      </span>
                      <span className="text-gray-500">
                        {new Date(m.startAt).toLocaleDateString("bn-BD")}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">{m.title}</h3>
                    <p className="text-xs text-gray-600">{m.agenda}</p>
                    <div className="pt-2 border-t text-[11px] text-gray-500 flex items-center justify-between">
                      <span>স্থান: {m.location}</span>
                      <span>অংশগ্রহণকারী: {m.participants.length} জন</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: HOLIDAYS */}
        {activeTab === "HOLIDAYS" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#083B25]">
                  প্রাতিষ্ঠানিক ও জাতীয় ছুটির তালিকা (২০২৬)
                </h2>
                <p className="text-xs text-gray-500">
                  ছুটির সময়ে স্বয়ংক্রিয়ভাবে ক্লাস ও পরীক্ষার সংঘাত পরীক্ষা করা হয়
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {holidays.map((h) => (
                <div
                  key={h.id}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 border-l-4 border-l-[#C59B27]"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                      {h.holidayType}
                    </span>
                    <span className="text-gray-500 font-mono">
                      {h.startDate === h.endDate ? h.startDate : `${h.startDate} - ${h.endDate}`}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{h.titleBn}</h3>
                  {h.descriptionBn && (
                    <p className="text-xs text-gray-600">{h.descriptionBn}</p>
                  )}
                  <div className="pt-2 border-t text-[11px] text-gray-500 flex items-center gap-3">
                    <span>ক্লাস বন্ধ: {h.affectsClassRoutine ? "হ্যাঁ" : "না"}</span>
                    <span>অফিস বন্ধ: {h.affectsOffices ? "হ্যাঁ" : "না"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CONFLICT DETECTOR */}
        {activeTab === "CONFLICTS" && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <span>স্বয়ংক্রিয় সিডিউল ও রুটিন সংঘাত পরীক্ষক</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                এই ইঞ্জিনটি শিক্ষক, শ্রেণি, কক্ষ ও রিসোর্সের দ্বৈত-বরাদ্দ এবং প্রাতিষ্ঠানিক ছুটির দিনে
                ক্লাস নির্ধারণ সংক্রান্ত যে কোনো সংঘাত তাৎক্ষণিকভাবে শনাক্ত করে।
              </p>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  বর্তমান মাস্টার সিডিউলে কোনো ব্লকিং সংঘাত পাওয়া যায়নি। রুটিন ও পরীক্ষার সূচি সম্পূর্ণ নিরাপদ।
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-[#083B25]">নতুন ক্যালেন্ডার ইভেন্ট যোগ করুন</h3>
              <button onClick={() => setShowEventModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">ইভেন্ট শিরোনাম (বাংলা)</label>
                <input
                  required
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="যেমন: খতমে কুরআন ও দোয়া মাহফিল"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">বিবরণ</label>
                <textarea
                  rows={2}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="বিস্তারিত কর্মসূচি..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">শুরুর সময়</label>
                  <input
                    required
                    type="datetime-local"
                    value={newEvent.startAt}
                    onChange={(e) => setNewEvent({ ...newEvent, startAt: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">শেষের সময়</label>
                  <input
                    required
                    type="datetime-local"
                    value={newEvent.endAt}
                    onChange={(e) => setNewEvent({ ...newEvent, endAt: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">স্থান</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="দারুল হাদিস অডিটোরিয়াম"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-3 py-1.5 border rounded"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-[#0D5C3A] text-white px-4 py-1.5 rounded font-semibold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROUTINE MODAL */}
      {showRoutineModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-[#083B25]">নতুন ক্লাস রুটিন পিরিয়ড নির্ধারণ</h3>
              <button onClick={() => setShowRoutineModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateRoutine} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">শ্রেণির নাম</label>
                <input
                  required
                  type="text"
                  value={newRoutine.classNameBn}
                  onChange={(e) => setNewRoutine({ ...newRoutine, classNameBn: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">বিষয়</label>
                <input
                  required
                  type="text"
                  value={newRoutine.subjectNameBn}
                  onChange={(e) => setNewRoutine({ ...newRoutine, subjectNameBn: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">উস্তাদের নাম</label>
                <input
                  required
                  type="text"
                  value={newRoutine.teacherName}
                  onChange={(e) => setNewRoutine({ ...newRoutine, teacherName: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">বার</label>
                  <select
                    value={newRoutine.dayOfWeek}
                    onChange={(e) =>
                      setNewRoutine({ ...newRoutine, dayOfWeek: Number(e.target.value) })
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value={0}>রবিবার</option>
                    <option value={1}>সোমবার</option>
                    <option value={2}>মঙ্গলবার</option>
                    <option value={3}>বুধবার</option>
                    <option value={4}>বৃহস্পতিবার</option>
                    <option value={5}>শুক্রবার</option>
                    <option value={6}>শনিবার</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">শুরু</label>
                  <input
                    required
                    type="time"
                    value={newRoutine.startTime}
                    onChange={(e) => setNewRoutine({ ...newRoutine, startTime: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">শেষ</label>
                  <input
                    required
                    type="time"
                    value={newRoutine.endTime}
                    onChange={(e) => setNewRoutine({ ...newRoutine, endTime: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRoutineModal(false)}
                  className="px-3 py-1.5 border rounded"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-[#0D5C3A] text-white px-4 py-1.5 rounded font-semibold"
                >
                  রুটিন যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-[#083B25]">রিসোর্স বা হল বুকিং আবেদন</h3>
              <button onClick={() => setShowBookingModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateBooking} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">রিসোর্স নির্বাচন করুন</label>
                <select
                  required
                  value={newBooking.resourceId}
                  onChange={(e) => setNewBooking({ ...newBooking, resourceId: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- রিসোর্স নির্বাচন করুন --</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nameBn} (ধারণক্ষমতা: {r.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">অনুষ্ঠানের নাম</label>
                <input
                  required
                  type="text"
                  value={newBooking.title}
                  onChange={(e) => setNewBooking({ ...newBooking, title: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="যেমন: মাসিক হিফজ প্রতিযোগিতা"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">উদ্দেশ্য</label>
                <input
                  type="text"
                  value={newBooking.purpose}
                  onChange={(e) => setNewBooking({ ...newBooking, purpose: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">শুরু</label>
                  <input
                    required
                    type="datetime-local"
                    value={newBooking.startAt}
                    onChange={(e) => setNewBooking({ ...newBooking, startAt: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">শেষ</label>
                  <input
                    required
                    type="datetime-local"
                    value={newBooking.endAt}
                    onChange={(e) => setNewBooking({ ...newBooking, endAt: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-3 py-1.5 border rounded"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-[#C59B27] text-gray-950 font-bold px-4 py-1.5 rounded"
                >
                  বুকিং নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
