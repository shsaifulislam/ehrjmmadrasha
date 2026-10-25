"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  QrCode,
  Trophy,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Check,
  RotateCcw,
} from "lucide-react";
import { InstitutionalEvent } from "@/lib/events/types";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function TeacherEventsViewer() {
  const [events, setEvents] = useState<InstitutionalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<InstitutionalEvent | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check-in state
  const [studentCode, setStudentCode] = useState("");
  const [checkInStatus, setCheckInStatus] = useState<"PRESENT" | "ABSENT" | "LATE">("PRESENT");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Scoring state
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [score, setScore] = useState("90");
  const [rank, setRank] = useState("1");
  const [judgeComments, setJudgeComments] = useState("উত্তম পারফরম্যান্স");

  const loadEvents = () => {
    setLoading(true);
    fetch("/api/events?role=TEACHER")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const teacherEvents = (data.data || []).filter(
            (e: InstitutionalEvent) =>
              ["REGISTRATION_OPEN", "IN_PROGRESS", "PUBLISHED", "SCHEDULED"].includes(e.status)
          );
          setEvents(teacherEvents);
          if (teacherEvents.length > 0 && !selectedEvent) {
            setSelectedEvent(teacherEvents[0]);
            loadParticipants(teacherEvents[0].id);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadParticipants = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/participants`);
      const data = await res.json();
      if (data.success) {
        setParticipants(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !studentCode.trim()) return;

    setMessage(null);
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentCode: studentCode.trim(),
          status: checkInStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: `${studentCode} সফলভাবে চেক-ইন সম্পন্ন হয়েছে।` });
        setStudentCode("");
        loadParticipants(selectedEvent.id);
      } else {
        setMessage({ type: "error", text: data.error || "চেক-ইন ব্যর্থ হয়েছে।" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "সার্ভারে যোগাযোগ করা যায়নি।" });
    }
  };

  const handleScoreParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !selectedStudentId) return;

    setMessage(null);
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          competitionCategory: selectedEvent.titleBn,
          score: Number(score),
          rank: Number(rank),
          awardType: rank === "1" ? "FIRST_PLACE" : rank === "2" ? "SECOND_PLACE" : "PARTICIPATION",
          judgeName: "দায়িত্বপ্রাপ্ত উস্তাদ",
          judgeCommentsBn: judgeComments,
          isPublished: true,
          actorRole: "TEACHER",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "শিক্ষার্থীর স্কোর ও মূল্যায়ন সংরক্ষিত হয়েছে।" });
      } else {
        setMessage({ type: "error", text: data.error || "मूल্যায়ন সংরক্ষণ ব্যর্থ হয়েছে।" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mb-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>মাদরাসা প্রতিযোগিতা, কেরাত মাহফিল ও অনুষ্ঠান</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
            ইভেন্ট পরিচালনা, চেক-ইন ও বিচারক মূল্যায়ন
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            হিফজ ও কেরাত প্রতিযোগিতা, রচনা ও সাংস্কৃতিক ইভেন্টে অংশগ্রহণকারী শিক্ষার্থীদের কিউআর/আইডি চেক-ইন এবং বিচারক নম্বর প্রদান।
          </p>
        </div>

        <button
          onClick={loadEvents}
          disabled={loading}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition self-start sm:self-center"
          title="রিফ্রেশ করুন"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Events list */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#0D5C3A]" />
            মাদরাসা ইভেন্ট তালিকা
          </h3>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">ইভেন্ট তালিকা লোড হচ্ছে...</div>
          ) : events.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
              বর্তমানে কোনো সক্রিয় ইভেন্ট পাওয়া যায়নি।
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => {
                    setSelectedEvent(evt);
                    loadParticipants(evt.id);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedEvent?.id === evt.id
                      ? "bg-emerald-50/80 border-[#0D5C3A] shadow-xs font-bold"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {evt.typeCode?.replace("_", " ") || "ইভেন্ট"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{evt.id}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">{evt.titleBn}</h4>
                  <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                    <div>তারিখ: {new Date(evt.startAt).toLocaleDateString("bn-BD")}</div>
                    <div>ভেন্যু: {evt.venueText}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Participant Check-in and Scoring */}
        {selectedEvent ? (
          <div className="md:col-span-2 space-y-5">
            {/* Event Header Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">{selectedEvent.titleBn}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {selectedEvent.status}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {selectedEvent.venueText} | {new Date(selectedEvent.startAt).toLocaleString("bn-BD")}
              </p>
            </div>

            {/* Fast QR / Student ID Check-In Box */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#0D5C3A]" />
                উপস্থিতি ও কিউআর স্ক্যানার চেক-ইন
              </h4>

              <form onSubmit={handleCheckIn} className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  placeholder="শিক্ষার্থী আইডি বা কিউআর কোড..."
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="flex-1 min-w-[180px] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                />
                <select
                  value={checkInStatus}
                  onChange={(e: any) => setCheckInStatus(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-white"
                >
                  <option value="PRESENT">উপস্থিত (Present)</option>
                  <option value="LATE">দেরি (Late)</option>
                  <option value="ABSENT">অনুপস্থিত (Absent)</option>
                </select>
                <button
                  type="submit"
                  className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  চেক-ইন
                </button>
              </form>
            </div>

            {/* Judges Scoring Panel */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-600" />
                বিচারক স্কোর ও র‍্যাঙ্কিং এন্ট্রি
              </h4>

              <form onSubmit={handleScoreParticipant} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">অংশগ্রহণকারী নির্বাচন:</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-white"
                      required
                    >
                      <option value="">শিক্ষার্থী বাছাই করুন</option>
                      {participants.map((p) => (
                        <option key={p.id} value={p.studentId}>
                          {p.studentNameBn || p.studentId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">প্রাপ্ত নম্বর (১০০ এর মধ্যে):</label>
                    <input
                      type="number"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                      min="0"
                      max="100"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">অবস্থান / স্থান:</label>
                    <select
                      value={rank}
                      onChange={(e) => setRank(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-white"
                    >
                      <option value="1">১ম স্থান (Champion)</option>
                      <option value="2">২য় স্থান (Runner Up)</option>
                      <option value="3">৩য় স্থান (3rd)</option>
                      <option value="4">সাধারণ অংশগ্রহণকারী</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">বিচারকের মন্তব্য:</label>
                  <input
                    type="text"
                    value={judgeComments}
                    onChange={(e) => setJudgeComments(e.target.value)}
                    placeholder="পড়া বা উপস্থাপনার মান সম্পর্কে মন্তব্য..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#0D5C3A] hover:bg-[#158052] text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs"
                >
                  মূল্যায়ন সংরক্ষণ করুন
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            বাম পাশ থেকে যেকোনো একটি ইভেন্ট নির্বাচন করুন।
          </div>
        )}
      </div>
    </div>
  );
}
