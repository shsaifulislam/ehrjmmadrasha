"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  Award,
  Users,
  AlertCircle,
  RotateCcw,
  GraduationCap,
  Sparkles,
  Phone,
  X,
  Search,
  CheckCircle2,
} from "lucide-react";

interface AssignmentItem {
  id: string;
  classId: string;
  classNameBn: string;
  sectionId: string | null;
  sectionNameBn: string;
  sessionId: string;
}

interface StudentRosterItem {
  id: string;
  studentIdNumber: string;
  fullNameBn: string;
  fullNameEn?: string | null;
  rollNumber: number;
  bloodGroup: string;
  residentialStatus: string;
  sectionName: string;
  photoUrl?: string | null;
  guardianName: string;
  guardianPhone: string;
}

interface TeacherClassesViewerProps {
  onSelectAttendance?: (assignmentId?: string) => void;
  onSelectResults?: (classId?: string) => void;
}

export default function TeacherClassesViewer({
  onSelectAttendance,
  onSelectResults,
}: TeacherClassesViewerProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [sessionName, setSessionName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Student Roster Modal State
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [rosterClassTitle, setRosterClassTitle] = useState("");
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterStudents, setRosterStudents] = useState<StudentRosterItem[]>([]);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterError, setRosterError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/teacher/attendance/assignments");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ক্লাস অ্যাসাইনমেন্ট লোড করতে ব্যর্থ হয়েছে।");
      }
      setAssignments(data.assignments || []);
      if (data.currentSession) {
        setSessionName(data.currentSession.name);
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const openStudentRoster = async (classId: string, classNameBn: string, sectionNameBn: string) => {
    setRosterClassTitle(`${classNameBn} (${sectionNameBn || "সকল শাখা"})`);
    setRosterModalOpen(true);
    setRosterLoading(true);
    setRosterError(null);
    setRosterSearch("");
    try {
      const res = await fetch(`/api/teacher/classes?classId=${classId}`);
      const data = await res.json();
      if (res.ok && data.students) {
        setRosterStudents(data.students);
      } else {
        setRosterError(data.error || "শিক্ষার্থীদের তালিকা পাওয়া যায়নি।");
      }
    } catch (err: any) {
      setRosterError(err.message || "সার্ভার সংযোগে ত্রুটি।");
    } finally {
      setRosterLoading(false);
    }
  };

  const filteredRoster = rosterStudents.filter((st) => {
    if (!rosterSearch.trim()) return true;
    const q = rosterSearch.toLowerCase();
    return (
      st.fullNameBn.toLowerCase().includes(q) ||
      st.studentIdNumber.toLowerCase().includes(q) ||
      st.rollNumber.toString().includes(q) ||
      st.guardianPhone.includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0D5C3A]" />
            আমার অধীনস্থ ক্লাস ও শাখা (My Classes)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            যে সকল জামাত ও শাখায় পাঠদানের জন্য আপনি আনুষ্ঠানিকভাবে নিয়োজিত রয়েছেন।
            {sessionName && (
              <span className="ml-2 font-semibold text-[#0D5C3A]">
                • শিক্ষাবর্ষ: {sessionName}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchAssignments}
          disabled={loading}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition self-start sm:self-center"
          title="রিফ্রেশ করুন"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          শ্রেণি ও শাখার তালিকা লোড হচ্ছে...
        </div>
      ) : assignments.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-2">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-sm text-slate-700">
            বর্তমানে কোনো ক্লাস বা শাখা নির্ধারিত নেই
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            আপনার অ্যাকাউন্টে এখনও কোনো জামাত বা শাখা বরাদ্দ করা হয়নি। ক্লাস রুটিন বা দায়িত্ব বরাদ্দের জন্য অনুগ্রহ করে মুহতামিম বা শিক্ষা বিভাগের সাথে যোগাযোগ করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 perspective-1000">
          {assignments.map((item) => (
            <div
              key={item.id}
              className="card-3d p-5 border-2 border-slate-200/90 rounded-2xl bg-white hover:border-[#D4AF37] hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-[#D4AF37] to-emerald-600" />
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-[#0D5C3A] flex items-center justify-center font-bold text-sm shadow-sm border border-emerald-300/60">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                    দায়িত্বপ্রাপ্ত জামাত
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 leading-snug">
                    {item.classNameBn}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
                    <span>শাখা:</span>
                    <span className="text-[#0D5C3A] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.sectionNameBn || "সকল শাখা"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                {onSelectAttendance && (
                  <button
                    onClick={() => onSelectAttendance(item.id)}
                    className="flex-1 min-w-[100px] bg-gradient-to-r from-[#0D5C3A] to-[#083823] hover:from-[#158052] hover:to-[#0D5C3A] text-white py-2 px-3 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 active:scale-95 border border-[#D4AF37]/30"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-300" />
                    <span>হাজিরা</span>
                  </button>
                )}
                {onSelectResults && (
                  <button
                    onClick={() => onSelectResults(item.classId)}
                    className="flex-1 min-w-[100px] bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-stone-900 border border-amber-300 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-700" />
                    <span>নম্বর</span>
                  </button>
                )}
                <button
                  onClick={() => openStudentRoster(item.classId, item.classNameBn, item.sectionNameBn)}
                  className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  title="এই ক্লাসের সকল শিক্ষার্থীর তালিকা ও অভিভাবক ফোন নম্বর"
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>শিক্ষার্থী তালিকা</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Roster Modal */}
      {rosterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0D5C3A]" />
                  {rosterClassTitle} - শিক্ষার্থী তালিকা
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  মোট শিক্ষার্থী: {rosterStudents.length} জন
                </p>
              </div>
              <button
                onClick={() => setRosterModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="নাম, রোল, আইডি অথবা অভিভাবক ফোন নম্বর দিয়ে খুঁজুন..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                />
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {rosterLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  শিক্ষার্থীদের তালিকা লোড হচ্ছে...
                </div>
              ) : rosterError ? (
                <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{rosterError}</span>
                </div>
              ) : filteredRoster.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  কোনো শিক্ষার্থী পাওয়া যায়নি।
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {filteredRoster.map((st) => (
                    <div
                      key={st.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0D5C3A] font-bold font-mono text-xs flex items-center justify-center border border-emerald-200 flex-shrink-0">
                          {st.rollNumber}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{st.fullNameBn}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            আইডি: {st.studentIdNumber} • রক্ত: {st.bloodGroup}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            st.residentialStatus === "RESIDENTIAL"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {st.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                        </span>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">
                            অভিভাবক: {st.guardianName}
                          </span>
                          {st.guardianPhone && st.guardianPhone !== "তথ্য নেই" ? (
                            <a
                              href={`tel:${st.guardianPhone}`}
                              className="text-xs font-bold text-[#0D5C3A] hover:underline inline-flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{st.guardianPhone}</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400">ফোন নেই</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={() => setRosterModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
