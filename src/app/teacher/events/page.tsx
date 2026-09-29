"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { InstitutionalEvent } from "@/lib/events/types";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function TeacherEventsPage() {
  const [teacherId, setTeacherId] = useState("TEACHER-001");
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

  useEffect(() => {
    fetch("/api/events?role=TEACHER")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Filter to teacher's assigned events or show all active events
          const teacherEvents = (data.data || []).filter(
            (e: InstitutionalEvent) =>
              e.leadTeacherId === teacherId ||
              (e.assignedTeacherIds && e.assignedTeacherIds.includes(teacherId)) ||
              ["REGISTRATION_OPEN", "IN_PROGRESS", "PUBLISHED"].includes(e.status)
          );
          setEvents(teacherEvents);
          if (teacherEvents.length > 0) {
            setSelectedEvent(teacherEvents[0]);
            loadParticipants(teacherEvents[0].id);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [teacherId]);

  const loadParticipants = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/register?role=TEACHER`);
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
          studentIdOrCode: studentCode.trim(),
          status: checkInStatus,
          recordedMethod: "QR_SCAN",
          teacherId,
          teacherName: "দায়িত্বপ্রাপ্ত উস্তাদ",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: "success",
          text: `উপস্থিতি গৃহীত: ${data.data.studentNameBn} (${data.data.status})`,
        });
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
          actorId: teacherId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "শিক্ষার্থীর স্কোর ও মূল্যায়ন সংরক্ষিত হয়েছে।" });
      } else {
        setMessage({ type: "error", text: data.error || "মূল্যায়ন সংরক্ষণ ব্যর্থ হয়েছে।" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-[#083B25] text-white py-6 px-4 md:px-8 border-b border-emerald-800 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-800 text-[#C59B27] px-2.5 py-0.5 rounded border border-emerald-600/50">
              শিক্ষক প্যানেল
            </span>
            <h1 className="text-xl md:text-2xl font-black">
              ইভেন্ট পরিচালনা ও উপস্থিতি ট্র্যাকিং
            </h1>
            <p className="text-xs text-emerald-100">
              দায়িত্বপ্রাপ্ত ইভেন্টে শিক্ষার্থী চেক-ইন এবং প্রতিযোগিতার নম্বর প্রদান করুন।
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-200 block">দায়িত্বপ্রাপ্ত শিক্ষক:</span>
            <span className="text-sm font-bold text-white font-mono">{teacherId}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {message && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
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
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Assigned Events list */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              আমার দায়িত্বপ্রাপ্ত ইভেন্টসমূহ
            </h3>

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
                      ? "bg-emerald-50/80 border-emerald-600 shadow-sm"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {evt.typeCode.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{evt.id}</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 mt-2 line-clamp-1">{evt.titleBn}</h4>
                  <div className="text-[11px] text-gray-500 mt-1 space-y-0.5">
                    <div>তারিখ: {new Date(evt.startAt).toLocaleDateString("bn-BD")}</div>
                    <div>ভেন্যু: {evt.venueText}</div>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="p-6 bg-white rounded-xl border text-center text-xs text-gray-500">
                  বর্তমানে কোনো ইভেন্টে দায়িত্ব বণ্টন করা নেই।
                </div>
              )}
            </div>
          </div>

          {/* Right: Participant Check-in and Scoring */}
          {selectedEvent && (
            <div className="md:col-span-2 space-y-6">
              {/* Event Header Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-gray-900">{selectedEvent.titleBn}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {selectedEvent.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{selectedEvent.venueText} | {new Date(selectedEvent.startAt).toLocaleString("bn-BD")}</p>
              </div>

              {/* Fast QR / Student ID Check-In Box */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-700" />
                  উপস্থিতি ও কিউআর স্ক্যানার চেক-ইন
                </h4>

                <form onSubmit={handleCheckIn} className="flex flex-wrap gap-2 items-center">
                  <input
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="মাদরাসা আইডি বা কিউআর কোড স্ক্যান করুন..."
                    className="flex-1 min-w-[200px] text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                  <select
                    value={checkInStatus}
                    onChange={(e: any) => setCheckInStatus(e.target.value)}
                    className="text-xs p-2.5 rounded-lg border border-gray-300 bg-white"
                  >
                    <option value="PRESENT">উপস্থিত (PRESENT)</option>
                    <option value="LATE">বিলম্বে উপস্থিত (LATE)</option>
                    <option value="ABSENT">অনুপস্থিত (ABSENT)</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-[#083B25] hover:bg-emerald-900 text-white font-bold px-4 py-2.5 rounded-lg text-xs"
                  >
                    চেক-ইন সম্পন্ন
                  </button>
                </form>
              </div>

              {/* Participant List & Evaluation */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-700" />
                    নিবন্ধিত অংশগ্রহণকারী তালিকা ({participants.length} জন)
                  </h4>
                </div>

                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-gray-100">
                      <tr className="border-b border-gray-200 text-gray-600 font-bold">
                        <th className="p-2.5">আইডি ও নাম</th>
                        <th className="p-2.5">জামাত ও রোল</th>
                        <th className="p-2.5">স্ট্যাটাস</th>
                        <th className="p-2.5 text-right">মূল্যায়ন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {participants.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="p-2.5">
                            <span className="font-bold text-gray-900 block">{p.studentNameBn}</span>
                            <span className="text-[11px] font-mono text-gray-500">{p.studentIdNumber}</span>
                          </td>
                          <td className="p-2.5 text-gray-600">
                            {p.classNameBn || "সাধারণ"} (রোল: {p.rollNumber || "-"})
                          </td>
                          <td className="p-2.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                              {p.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => setSelectedStudentId(p.studentId)}
                              className="text-[11px] font-bold text-emerald-800 hover:underline"
                            >
                              নম্বর দিন
                            </button>
                          </td>
                        </tr>
                      ))}
                      {participants.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-gray-400">
                            কোনো শিক্ষার্থী নিবন্ধিত নেই।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Sub-form: Scoring selected student */}
                {selectedStudentId && (
                  <form onSubmit={handleScoreParticipant} className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-700" />
                        নির্বাচিত শিক্ষার্থীর মূল্যায়ন (আইডি: {selectedStudentId})
                      </h5>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId("")}
                        className="text-[11px] text-gray-500 hover:text-gray-700"
                      >
                        বন্ধ করুন
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder="প্রাপ্ত নম্বর (১০০-তে)"
                        className="text-xs p-2 rounded-lg border border-gray-300 bg-white"
                        required
                      />
                      <input
                        type="number"
                        value={rank}
                        onChange={(e) => setRank(e.target.value)}
                        placeholder="স্থান / Rank"
                        className="text-xs p-2 rounded-lg border border-gray-300 bg-white"
                        required
                      />
                      <input
                        type="text"
                        value={judgeComments}
                        onChange={(e) => setJudgeComments(e.target.value)}
                        placeholder="বিচারকের মন্তব্য"
                        className="text-xs p-2 rounded-lg border border-gray-300 bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-[#083B25] hover:bg-emerald-900 text-white font-bold px-4 py-1.5 rounded-lg text-xs"
                    >
                      মূল্যায়ন সংরক্ষণ করুন
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
