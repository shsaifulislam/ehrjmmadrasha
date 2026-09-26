"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  PlusCircle,
  Calendar,
  Clock,
  Award,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
  Edit2,
  Trash2,
  BookOpen,
  Send,
  Printer,
  ShieldCheck,
  ChevronRight,
  Sliders,
} from "lucide-react";

export default function AdminExamHub() {
  const [activeSubTab, setActiveSubTab] = useState<
    "EXAMS" | "TYPES" | "SUBJECTS" | "ROUTINE" | "RESULTS"
  >("EXAMS");

  const [sessions, setSessions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filter selections
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");

  // Forms states
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [examForm, setExamForm] = useState({
    nameBn: "",
    nameEn: "",
    examTypeId: "",
    startDate: "",
    endDate: "",
    instructions: "",
    status: "DRAFT",
  });

  const [showCreateType, setShowCreateType] = useState(false);
  const [typeForm, setTypeForm] = useState({
    code: "",
    nameBn: "",
    nameEn: "",
    sortOrder: 0,
  });

  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    classId: "",
    nameBn: "",
    nameEn: "",
    nameAr: "",
    code: "",
    fullMarks: 100,
    passMarks: 33,
    isOptional: false,
    sortOrder: 0,
  });

  const [routines, setRoutines] = useState<any[]>([]);
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [routineForm, setRoutineForm] = useState({
    classId: "",
    sectionId: "",
    subjectId: "",
    examDate: "",
    startTime: "09:30 AM",
    endTime: "12:30 PM",
    roomNo: "",
    instructions: "",
  });

  // Results review
  const [resultsData, setResultsData] = useState<any | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [correctingCandidate, setCorrectingCandidate] = useState<any | null>(null);
  const [correctionForm, setCorrectionForm] = useState({
    subjectId: "",
    newMarks: "",
    isAbsent: false,
    isExempt: false,
    correctionReason: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [resSessions, resClasses, resTypes] = await Promise.all([
        fetch("/api/academic/sessions").then((r) => r.json()),
        fetch("/api/academic/classes").then((r) => r.json()),
        fetch("/api/admin/exams/types").then((r) => r.json()),
      ]);

      if (resSessions.sessions) {
        setSessions(resSessions.sessions);
        const active = resSessions.sessions.find((s: any) => s.isActive) || resSessions.sessions[0];
        if (active) setSelectedSessionId(active.id);
      }
      if (resClasses.classes) {
        setClasses(resClasses.classes);
        if (resClasses.classes.length > 0) setSelectedClassId(resClasses.classes[0].id);
      }
      if (resTypes.examTypes) {
        setExamTypes(resTypes.examTypes);
      }

      await loadExams();
      await loadSubjects();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadExams = async () => {
    try {
      const res = await fetch("/api/admin/exams");
      const data = await res.json();
      if (data.exams) {
        setExams(data.exams);
        if (data.exams.length > 0 && !selectedExamId) {
          setSelectedExamId(data.exams[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubjects = async (classId?: string) => {
    try {
      const url = classId ? `/api/admin/subjects?classId=${classId}` : "/api/admin/subjects";
      const res = await fetch(url);
      const data = await res.json();
      if (data.subjects) setSubjects(data.subjects);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRoutines = async (examId: string) => {
    if (!examId) return;
    try {
      const res = await fetch(`/api/admin/exams/${examId}/routine`);
      const data = await res.json();
      if (data.routines) setRoutines(data.routines);
    } catch (err) {
      console.error(err);
    }
  };

  const loadResultsReview = async (examId: string, classId?: string) => {
    if (!examId) return;
    setLoadingResults(true);
    try {
      const url = classId
        ? `/api/admin/results?examId=${examId}&classId=${classId}`
        : `/api/admin/results?examId=${examId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setResultsData(data);
      } else {
        setMessage({ text: data.error || "ফলাফল লোড করা যায়নি।", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "সার্ভার এরর", type: "error" });
    } finally {
      setLoadingResults(false);
    }
  };

  // Create Exam
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          ...examForm,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setShowCreateExam(false);
        setExamForm({
          nameBn: "",
          nameEn: "",
          examTypeId: "",
          startDate: "",
          endDate: "",
          instructions: "",
          status: "DRAFT",
        });
        await loadExams();
      } else {
        setMessage({ text: data.error || "পরীক্ষা তৈরি করা যায়নি।", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // Update Exam Status
  const handleUpdateExamStatus = async (examId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: `পরীক্ষার স্ট্যাটাস পরিবর্তিত হয়েছে: ${newStatus}`, type: "success" });
        await loadExams();
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // Create Exam Type
  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/exams/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(typeForm),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setShowCreateType(false);
        setTypeForm({ code: "", nameBn: "", nameEn: "", sortOrder: 0 });
        const resTypes = await fetch("/api/admin/exams/types").then((r) => r.json());
        if (resTypes.examTypes) setExamTypes(resTypes.examTypes);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // Create Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...subjectForm,
          classId: subjectForm.classId || selectedClassId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setShowCreateSubject(false);
        setSubjectForm({
          classId: "",
          nameBn: "",
          nameEn: "",
          nameAr: "",
          code: "",
          fullMarks: 100,
          passMarks: 33,
          isOptional: false,
          sortOrder: 0,
        });
        await loadSubjects(selectedClassId);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // Add Routine Item
  const handleAddRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      setMessage({ text: "পরীক্ষা নির্বাচন আবশ্যক।", type: "error" });
      return;
    }
    try {
      const res = await fetch(`/api/admin/exams/${selectedExamId}/routine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...routineForm,
          classId: routineForm.classId || selectedClassId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setShowAddRoutine(false);
        setRoutineForm({
          classId: "",
          sectionId: "",
          subjectId: "",
          examDate: "",
          startTime: "09:30 AM",
          endTime: "12:30 PM",
          roomNo: "",
          instructions: "",
        });
        await loadRoutines(selectedExamId);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // Publish Results
  const handlePublishResults = async () => {
    if (!selectedExamId) return;
    if (!confirm("আপনি কি নিশ্চিত যে এই পরীক্ষার ফলাফল চূড়ান্তভাবে প্রকাশ করতে চান?")) return;

    try {
      const res = await fetch("/api/admin/results/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          classId: selectedClassId || undefined,
          forcePublish: false,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        await loadResultsReview(selectedExamId, selectedClassId);
        await loadExams();
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // Submit Result Correction
  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingCandidate || !selectedExamId) return;

    try {
      const res = await fetch("/api/admin/results/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          studentId: correctingCandidate.studentId,
          subjectId: correctionForm.subjectId,
          newMarks: correctionForm.newMarks,
          isAbsent: correctionForm.isAbsent,
          isExempt: correctionForm.isExempt,
          correctionReason: correctionForm.correctionReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setCorrectingCandidate(null);
        setCorrectionForm({
          subjectId: "",
          newMarks: "",
          isAbsent: false,
          isExempt: false,
          correctionReason: "",
        });
        await loadResultsReview(selectedExamId, selectedClassId);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
      {/* Cockpit Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
        <div>
          <span className="text-[10px] font-bold text-[#C59B27] uppercase tracking-wider block">
            পরীক্ষা ও ফলাফল ইঞ্জিন (Phase 5)
          </span>
          <h2 className="text-lg font-bold text-[#0B1914] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#0D5C3A]" />
            কেন্দ্রীয় পরীক্ষা, রুটিন ও ফলাফল হাব
          </h2>
          <p className="text-xs text-gray-500">
            পরীক্ষার ধরন, রুটিন সিডিউলিং, শিক্ষক নম্বর নিরীক্ষা ও সিলমোহরকৃত ফলাফল প্রকাশ।
          </p>
        </div>

        <button
          onClick={() => {
            loadInitialData();
            if (activeSubTab === "ROUTINE" && selectedExamId) loadRoutines(selectedExamId);
            if (activeSubTab === "RESULTS" && selectedExamId) loadResultsReview(selectedExamId, selectedClassId);
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          রিফ্রেশ
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold text-sm">
            ×
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 text-xs overflow-x-auto">
        {[
          { id: "EXAMS", label: "পরীক্ষা ব্যবস্থাপনা", count: exams.length },
          { id: "TYPES", label: "পরীক্ষার ধরন (Types)", count: examTypes.length },
          { id: "SUBJECTS", label: "বিষয় ও পূর্ণমান", count: subjects.length },
          { id: "ROUTINE", label: "পরীক্ষার রুটিন", count: routines.length },
          { id: "RESULTS", label: "ফলাফল নিরীক্ষা ও প্রকাশ" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveSubTab(t.id as any);
              if (t.id === "ROUTINE" && selectedExamId) loadRoutines(selectedExamId);
              if (t.id === "RESULTS" && selectedExamId) loadResultsReview(selectedExamId, selectedClassId);
            }}
            className={`px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeSubTab === t.id
                ? "bg-[#0D5C3A] text-white shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeSubTab === t.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. EXAMS TAB */}
      {activeSubTab === "EXAMS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9F8F3] p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-700">শিক্ষাবর্ষ:</label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="p-1.5 text-xs border rounded bg-white"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isCurrent ? "• সক্রিয় শিক্ষাবর্ষ" : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowCreateExam(!showCreateExam)}
              className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              নতুন পরীক্ষা যোগ করুন
            </button>
          </div>

          {showCreateExam && (
            <form
              onSubmit={handleCreateExam}
              className="p-5 border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-4 text-xs"
            >
              <h3 className="font-bold text-sm text-[#083B25]">নতুন পরীক্ষা তৈরি করুন</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">পরীক্ষার নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={examForm.nameBn}
                    onChange={(e) => setExamForm({ ...examForm, nameBn: e.target.value })}
                    placeholder="যেমন: প্রথম সাময়িক পরীক্ষা ২০২৬"
                    className="w-full p-2 border rounded bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">পরীক্ষার নাম (ইংরেজি) *</label>
                  <input
                    type="text"
                    required
                    value={examForm.nameEn}
                    onChange={(e) => setExamForm({ ...examForm, nameEn: e.target.value })}
                    placeholder="e.g. 1st Term Examination 2026"
                    className="w-full p-2 border rounded bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">পরীক্ষার ধরন</label>
                  <select
                    value={examForm.examTypeId}
                    onChange={(e) => setExamForm({ ...examForm, examTypeId: e.target.value })}
                    className="w-full p-2 border rounded bg-white outline-none"
                  >
                    <option value="">সাধারণ পরীক্ষা</option>
                    {examTypes.map((et) => (
                      <option key={et.id} value={et.id}>
                        {et.nameBn} ({et.nameEn})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">শুরুর তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={examForm.startDate}
                    onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
                    className="w-full p-2 border rounded bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">শেষের তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={examForm.endDate}
                    onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
                    className="w-full p-2 border rounded bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">প্রাথমিক স্ট্যাটাস</label>
                  <select
                    value={examForm.status}
                    onChange={(e) => setExamForm({ ...examForm, status: e.target.value })}
                    className="w-full p-2 border rounded bg-white outline-none"
                  >
                    <option value="DRAFT">খসড়া (DRAFT)</option>
                    <option value="SCHEDULED">নির্ধারিত (SCHEDULED)</option>
                    <option value="MARKS_ENTRY">নম্বর এন্ট্রি চলমান (MARKS_ENTRY)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">নির্দেশনাবলি (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={examForm.instructions}
                  onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                  placeholder="পরীক্ষার্থীদের জন্য বিশেষ নিয়ম বা নির্দেশ..."
                  className="w-full p-2 border rounded bg-white outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateExam(false)}
                  className="px-3 py-1.5 border rounded bg-white text-gray-600 hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0D5C3A] text-white rounded font-semibold hover:bg-[#158052]"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          )}

          {exams.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl p-6 text-gray-500 text-xs">
              কোনো পরীক্ষা পাওয়া যায়নি। নতুন পরীক্ষা যোগ করুন।
            </div>
          ) : (
            <div className="divide-y divide-gray-200 border rounded-xl overflow-hidden text-xs">
              {exams.map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 hover:bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#083B25]">{ex.nameBn}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ex.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-800"
                            : ex.status === "MARKS_ENTRY"
                            ? "bg-blue-100 text-blue-800"
                            : ex.status === "REVIEW"
                            ? "bg-amber-100 text-amber-800"
                            : ex.status === "CLOSED"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ex.status}
                      </span>
                    </div>
                    <p className="text-gray-500 text-[11px]">
                      {ex.nameEn} | শিক্ষাবর্ষ: {ex.session?.name || "নির্ধারিত"}
                    </p>
                    <p className="text-gray-600">
                      তারিখ: {new Date(ex.startDate).toLocaleDateString("bn-BD")} হতে{" "}
                      {new Date(ex.endDate).toLocaleDateString("bn-BD")} | রুটিন:{" "}
                      {ex._count?.examRoutines || 0} টি | প্রাপ্ত নম্বর: {ex._count?.examMarks || 0} টি
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <select
                      value={ex.status}
                      onChange={(e) => handleUpdateExamStatus(ex.id, e.target.value)}
                      className="p-1 border rounded bg-white text-[11px]"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="MARKS_ENTRY">MARKS_ENTRY</option>
                      <option value="REVIEW">REVIEW</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>

                    <button
                      onClick={() => {
                        setSelectedExamId(ex.id);
                        setActiveSubTab("ROUTINE");
                        loadRoutines(ex.id);
                      }}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-semibold"
                    >
                      রুটিন
                    </button>
                    <button
                      onClick={() => {
                        setSelectedExamId(ex.id);
                        setActiveSubTab("RESULTS");
                        loadResultsReview(ex.id, selectedClassId);
                      }}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-semibold"
                    >
                      ফলাফল
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. EXAM TYPES TAB */}
      {activeSubTab === "TYPES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div>
              <h3 className="font-bold text-xs text-gray-800">কাস্টম ও কওমি পরীক্ষার ধরন কনফিগারেশন</h3>
              <p className="text-[11px] text-gray-500">
                মাসিক, সাময়িক, ফাইনাল কিংবা বিশেষ কওমি পরীক্ষার ধরন তৈরি ও নিয়ন্ত্রণ করুন।
              </p>
            </div>
            <button
              onClick={() => setShowCreateType(!showCreateType)}
              className="bg-[#0D5C3A] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              নতুন ধরন যোগ করুন
            </button>
          </div>

          {showCreateType && (
            <form
              onSubmit={handleCreateType}
              className="p-4 border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">কোড *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ANNUAL"
                    value={typeForm.code}
                    onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                    className="w-full p-2 border rounded bg-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">বাংলা নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: বার্ষিক পরীক্ষা"
                    value={typeForm.nameBn}
                    onChange={(e) => setTypeForm({ ...typeForm, nameBn: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">ইংরেজি নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Exam"
                    value={typeForm.nameEn}
                    onChange={(e) => setTypeForm({ ...typeForm, nameEn: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">ক্রম নম্বর</label>
                  <input
                    type="number"
                    value={typeForm.sortOrder}
                    onChange={(e) => setTypeForm({ ...typeForm, sortOrder: Number(e.target.value) })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateType(false)}
                  className="px-3 py-1 border rounded bg-white text-gray-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#0D5C3A] text-white rounded font-semibold"
                >
                  সংরক্ষণ
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {examTypes.map((et) => (
              <div key={et.id} className="p-3.5 rounded-xl border bg-gray-50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{et.nameBn}</span>
                  <span className="text-[10px] font-mono bg-gray-200 px-1.5 py-0.5 rounded">
                    {et.code}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px]">{et.nameEn}</p>
                <p className="text-[10px] text-emerald-800">
                  সংযুক্ত পরীক্ষা: {et._count?.exams || 0} টি
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SUBJECTS TAB */}
      {activeSubTab === "SUBJECTS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9F8F3] p-4 rounded-xl border">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-700">জামাত নির্বাচন:</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  loadSubjects(e.target.value);
                }}
                className="p-1.5 text-xs border rounded bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBn} ({c.nameEn})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowCreateSubject(!showCreateSubject)}
              className="bg-[#0D5C3A] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              নতুন বিষয় যুক্ত করুন
            </button>
          </div>

          {showCreateSubject && (
            <form
              onSubmit={handleCreateSubject}
              className="p-4 border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-3 text-xs"
            >
              <h4 className="font-bold text-[#083B25]">নতুন পাঠ্য বিষয় এন্ট্রি</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">বিষয়ের নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: কুরআন মাজীদ ও তাজবীদ"
                    value={subjectForm.nameBn}
                    onChange={(e) => setSubjectForm({ ...subjectForm, nameBn: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">বিষয়ের নাম (ইংরেজি) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quran Majeed"
                    value={subjectForm.nameEn}
                    onChange={(e) => setSubjectForm({ ...subjectForm, nameEn: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">বিষয় কোড *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QRN-101"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full p-2 border rounded bg-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">পূর্ণমান (Full Marks) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={subjectForm.fullMarks}
                    onChange={(e) => setSubjectForm({ ...subjectForm, fullMarks: Number(e.target.value) })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">পাস মার্ক (Pass Marks) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={subjectForm.passMarks}
                    onChange={(e) => setSubjectForm({ ...subjectForm, passMarks: Number(e.target.value) })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div className="flex items-center pt-5 gap-2">
                  <input
                    type="checkbox"
                    id="isOptional"
                    checked={subjectForm.isOptional}
                    onChange={(e) => setSubjectForm({ ...subjectForm, isOptional: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isOptional" className="font-semibold text-gray-700">
                    ঐচ্ছিক বিষয় (Optional Subject)
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSubject(false)}
                  className="px-3 py-1 border rounded bg-white text-gray-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#0D5C3A] text-white rounded font-semibold"
                >
                  সংরক্ষণ
                </button>
              </div>
            </form>
          )}

          <div className="border rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#F9F8F3] border-b font-semibold text-gray-700">
                <tr>
                  <th className="p-3">বিষয় কোড</th>
                  <th className="p-3">বিষয়ের নাম</th>
                  <th className="p-3">জামাত</th>
                  <th className="p-3">পূর্ণমান</th>
                  <th className="p-3">পাস মার্ক</th>
                  <th className="p-3">ধরন</th>
                  <th className="p-3">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-[#0D5C3A]">{sub.code}</td>
                    <td className="p-3 font-semibold text-gray-900">
                      {sub.nameBn} <span className="text-gray-400 font-normal">({sub.nameEn})</span>
                    </td>
                    <td className="p-3">{sub.jamatClass?.nameBn}</td>
                    <td className="p-3 font-mono font-bold">{sub.fullMarks}</td>
                    <td className="p-3 font-mono text-emerald-800">{sub.passMarks}</td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          sub.isOptional ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {sub.isOptional ? "ঐচ্ছিক" : "আবশ্যিক"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-emerald-700 font-bold">সক্রিয়</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ROUTINE TAB */}
      {activeSubTab === "ROUTINE" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9F8F3] p-4 rounded-xl border">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-700">পরীক্ষা নির্বাচন:</label>
              <select
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  loadRoutines(e.target.value);
                }}
                className="p-1.5 text-xs border rounded bg-white font-semibold"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.nameBn}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="bg-white border text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm print:hidden"
              >
                <Printer className="w-3.5 h-3.5 text-gray-500" />
                রুটিন প্রিন্ট
              </button>
              <button
                onClick={() => setShowAddRoutine(!showAddRoutine)}
                className="bg-[#0D5C3A] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                রুটিন এন্ট্রি
              </button>
            </div>
          </div>

          {showAddRoutine && (
            <form
              onSubmit={handleAddRoutine}
              className="p-4 border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-3 text-xs"
            >
              <h4 className="font-bold text-[#083B25]">পরীক্ষার সময়সূচি ও রুটিন সংযোজন</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">জামাত *</label>
                  <select
                    value={routineForm.classId || selectedClassId}
                    onChange={(e) => {
                      setRoutineForm({ ...routineForm, classId: e.target.value });
                      loadSubjects(e.target.value);
                    }}
                    className="w-full p-2 border rounded bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">বিষয় *</label>
                  <select
                    value={routineForm.subjectId}
                    onChange={(e) => setRoutineForm({ ...routineForm, subjectId: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                    required
                  >
                    <option value="">বিষয় নির্বাচন করুন</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameBn} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">পরীক্ষার তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={routineForm.examDate}
                    onChange={(e) => setRoutineForm({ ...routineForm, examDate: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">শুরুর সময় *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:30 AM"
                    value={routineForm.startTime}
                    onChange={(e) => setRoutineForm({ ...routineForm, startTime: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">শেষের সময় *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12:30 PM"
                    value={routineForm.endTime}
                    onChange={(e) => setRoutineForm({ ...routineForm, endTime: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">কক্ষ নম্বর (Room No)</label>
                  <input
                    type="text"
                    placeholder="যেমন: ১০২"
                    value={routineForm.roomNo}
                    onChange={(e) => setRoutineForm({ ...routineForm, roomNo: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoutine(false)}
                  className="px-3 py-1 border rounded bg-white text-gray-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#0D5C3A] text-white rounded font-semibold"
                >
                  রুটিনে অন্তর্ভুক্ত করুন
                </button>
              </div>
            </form>
          )}

          <div className="border rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#F9F8F3] border-b font-semibold text-gray-700">
                <tr>
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">সময়</th>
                  <th className="p-3">জামাত</th>
                  <th className="p-3">বিষয়</th>
                  <th className="p-3">পূর্ণমান</th>
                  <th className="p-3">কক্ষ</th>
                  <th className="p-3">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {routines.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-900">
                      {new Date(r.examDate).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="p-3 font-mono text-gray-700">
                      {r.startTime} - {r.endTime}
                    </td>
                    <td className="p-3">{r.jamatClass?.nameBn}</td>
                    <td className="p-3 font-bold text-[#0D5C3A]">{r.subject?.nameBn}</td>
                    <td className="p-3 font-mono">{r.subject?.fullMarks}</td>
                    <td className="p-3">{r.roomNo || "—"}</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. RESULTS REVIEW & PUBLICATION TAB */}
      {activeSubTab === "RESULTS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9F8F3] p-4 rounded-xl border">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-700">পরীক্ষা:</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    loadResultsReview(e.target.value, selectedClassId);
                  }}
                  className="p-1.5 text-xs border rounded bg-white font-semibold"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-700">জামাত:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    loadResultsReview(selectedExamId, e.target.value);
                  }}
                  className="p-1.5 text-xs border rounded bg-white"
                >
                  <option value="">সকল জামাত</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handlePublishResults}
              className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-lg text-xs font-bold shadow flex items-center gap-1.5 self-start sm:self-auto"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              ফলাফল সিলমোহর ও প্রকাশ করুন
            </button>
          </div>

          {loadingResults ? (
            <p className="text-center py-12 text-xs text-gray-500">ফলাফল ও মার্কশিট ডাটা লোড হচ্ছে...</p>
          ) : !resultsData ? (
            <p className="text-center py-12 text-xs text-gray-500">
              পরীক্ষা নির্বাচন করে ফলাফল নিরীক্ষা করুন।
            </p>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-l-4 border-l-gray-600">
                  <span className="text-gray-500 block">মোট পরীক্ষার্থী</span>
                  <span className="font-bold text-base text-gray-900">
                    {resultsData.summary.totalCandidates} জন
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-l-4 border-l-emerald-600">
                  <span className="text-gray-500 block">কৃতকার্য (Passed)</span>
                  <span className="font-bold text-base text-emerald-700">
                    {resultsData.summary.passedCount} জন
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-l-4 border-l-red-600">
                  <span className="text-gray-500 block">অকৃতকার্য (Failed)</span>
                  <span className="font-bold text-base text-red-700">
                    {resultsData.summary.failedCount} জন
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-l-4 border-l-amber-500">
                  <span className="text-gray-500 block">অসম্পূর্ণ / পেন্ডিং</span>
                  <span className="font-bold text-base text-amber-700">
                    {resultsData.summary.pendingCount} জন
                  </span>
                </div>
              </div>

              {/* Candidate Results Table */}
              <div className="border rounded-xl overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#F9F8F3] border-b font-semibold text-gray-700">
                    <tr>
                      <th className="p-3">রোল</th>
                      <th className="p-3">আইডি ও নাম</th>
                      <th className="p-3">জামাত</th>
                      <th className="p-3">মোট প্রাপ্ত</th>
                      <th className="p-3">শতকরা</th>
                      <th className="p-3">ইসলামিক গ্রেড</th>
                      <th className="p-3">ফলাফল</th>
                      <th className="p-3">ভেরিফিকেশন কোড</th>
                      <th className="p-3 text-right">কার্যক্রম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {resultsData.candidates.map((c: any) => (
                      <tr key={c.studentId} className="hover:bg-gray-50">
                        <td className="p-3 font-mono font-bold">{c.rollNumber}</td>
                        <td className="p-3">
                          <p className="font-bold text-gray-900">{c.fullNameBn}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{c.studentIdNumber}</p>
                        </td>
                        <td className="p-3">{c.classNameBn}</td>
                        <td className="p-3 font-mono font-bold text-[#0D5C3A]">
                          {c.calculated.totalObtained} / {c.calculated.totalFullMarks}
                        </td>
                        <td className="p-3 font-mono">{c.calculated.percentage}%</td>
                        <td className="p-3 font-semibold text-emerald-900">
                          {c.calculated.finalGradeBn}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              c.calculated.isPassed
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {c.calculated.isPassed ? "পাস (PASS)" : "ফেল (FAIL)"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-gray-600">
                          {c.savedResult?.verificationCode || "—"}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setCorrectingCandidate(c);
                              if (resultsData.subjects.length > 0) {
                                setCorrectionForm({
                                  ...correctionForm,
                                  subjectId: resultsData.subjects[0].id,
                                });
                              }
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded text-[11px] font-semibold"
                          >
                            নম্বর সংশোধন
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Correction Modal */}
          {correctingCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
                <div className="border-b pb-3">
                  <h3 className="text-base font-bold text-[#083B25]">অ্যাডমিন নম্বর সংশোধন</h3>
                  <p className="text-gray-500">
                    শিক্ষার্থী: {correctingCandidate.fullNameBn} (রোল: {correctingCandidate.rollNumber})
                  </p>
                </div>

                <form onSubmit={handleSaveCorrection} className="space-y-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">বিষয় নির্বাচন *</label>
                    <select
                      value={correctionForm.subjectId}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, subjectId: e.target.value })}
                      className="w-full p-2 border rounded bg-white"
                      required
                    >
                      {resultsData?.subjects?.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.nameBn} ({s.code}) - পূর্ণমান {s.fullMarks}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">সংশোধিত নম্বর *</label>
                    <input
                      type="number"
                      value={correctionForm.newMarks}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, newMarks: e.target.value })}
                      placeholder="সংশোধিত প্রাপ্ত নম্বর"
                      className="w-full p-2 border rounded font-mono font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={correctionForm.isAbsent}
                        onChange={(e) => setCorrectionForm({ ...correctionForm, isAbsent: e.target.checked })}
                      />
                      <span>অনুপস্থিত (Absent)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={correctionForm.isExempt}
                        onChange={(e) => setCorrectionForm({ ...correctionForm, isExempt: e.target.checked })}
                      />
                      <span>অব্যাহতি (Exempt)</span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      সংশোধনের অডিট কারণ (Mandatory Reason) *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={correctionForm.correctionReason}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, correctionReason: e.target.value })}
                      placeholder="খাতা পুনঃনিরীক্ষা বা উস্তাদের আবেদন অনুযায়ী..."
                      className="w-full p-2 border rounded"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCorrectingCandidate(null)}
                      className="px-3 py-1.5 border rounded text-gray-600 hover:bg-gray-100"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#0D5C3A] text-white rounded font-semibold hover:bg-[#158052]"
                    >
                      পুনর্গণনা ও অডিট সেভ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
