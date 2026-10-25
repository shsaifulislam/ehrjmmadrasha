"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  CheckCircle,
  AlertCircle,
  Save,
  Send,
  RefreshCw,
  Search,
  Check,
  Lock,
} from "lucide-react";

export default function TeacherMarksEntry() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const [examData, setExamData] = useState<any | null>(null);
  const [subjectData, setSubjectData] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marksState, setMarksState] = useState<
    Record<string, { marks: string; isAbsent: boolean; isExempt: boolean; remarks: string }>
  >({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const [resExams, resClasses] = await Promise.all([
        fetch("/api/teacher/exams").then((r) => r.json()),
        fetch("/api/teacher/classes").then((r) => r.json()),
      ]);

      if (resExams.exams && resExams.exams.length > 0) {
        setExams(resExams.exams);
        setSelectedExamId(resExams.exams[0].id);
      }

      if (resClasses.classes && resClasses.classes.length > 0) {
        setClasses(resClasses.classes);
        setSelectedClassId(resClasses.classes[0].id);
        if (resClasses.classes[0].sections) {
          setSections(resClasses.classes[0].sections);
        }
        await loadSubjectsForClass(resClasses.classes[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubjectsForClass = async (classId: string) => {
    try {
      const res = await fetch(`/api/teacher/subjects?classId=${classId}`);
      const data = await res.json();
      if (data.subjects && data.subjects.length > 0) {
        setSubjects(data.subjects);
        setSelectedSubjectId(data.subjects[0].id);
      } else {
        setSubjects([]);
        setSelectedSubjectId("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const cls = classes.find((c) => c.id === classId);
    setSections(cls?.sections || []);
    setSelectedSectionId("");
    loadSubjectsForClass(classId);
  };

  const loadStudentMarks = async () => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId) return;

    setLoading(true);
    setMessage(null);

    try {
      const params = new URLSearchParams({
        examId: selectedExamId,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        ...(selectedSectionId ? { sectionId: selectedSectionId } : {}),
      });

      const res = await fetch(`/api/teacher/results?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setExamData(data.exam);
        setSubjectData(data.subject);
        setStudents(data.students);

        const initialMap: Record<string, any> = {};
        for (const st of data.students) {
          initialMap[st.studentId] = {
            marks: st.marksObtained !== null && st.marksObtained !== undefined ? String(st.marksObtained) : "",
            isAbsent: Boolean(st.isAbsent),
            isExempt: Boolean(st.isExempt),
            remarks: st.gradeRemarks || "",
          };
        }
        setMarksState(initialMap);
        setHasUnsavedChanges(false);
      } else {
        setMessage({ text: data.error || "শিক্ষার্থীদের তালিকা লোড করা যায়নি।", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "সার্ভার এরর", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId: string, val: string) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: val,
        isAbsent: false,
        isExempt: false,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleAbsentToggle = (studentId: string) => {
    setMarksState((prev) => {
      const current = prev[studentId];
      const isAbsent = !current?.isAbsent;
      return {
        ...prev,
        [studentId]: {
          ...current,
          isAbsent,
          isExempt: false,
          marks: isAbsent ? "" : current?.marks || "",
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleExemptToggle = (studentId: string) => {
    setMarksState((prev) => {
      const current = prev[studentId];
      const isExempt = !current?.isExempt;
      return {
        ...prev,
        [studentId]: {
          ...current,
          isExempt,
          isAbsent: false,
          marks: isExempt ? "" : current?.marks || "",
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleSave = async (action: "DRAFT" | "SUBMIT") => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId) return;

    if (action === "SUBMIT" && !confirm("আপনি কি নিশ্চিত যে সকল নম্বর নিরীক্ষা করে সাবমিট করতে চান? সাবমিটের পর পরিবর্তন সীমাবদ্ধ হবে।")) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const entries = students.map((st) => {
        const state = marksState[st.studentId];
        return {
          studentId: st.studentId,
          marksObtained: state?.isAbsent || state?.isExempt ? null : state?.marks ? Number(state.marks) : null,
          isAbsent: Boolean(state?.isAbsent),
          isExempt: Boolean(state?.isExempt),
          remarks: state?.remarks || null,
        };
      });

      const res = await fetch("/api/teacher/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          classId: selectedClassId,
          sectionId: selectedSectionId || undefined,
          subjectId: selectedSubjectId,
          entries,
          action,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setHasUnsavedChanges(false);
        setMessage({ text: data.message, type: "success" });
        await loadStudentMarks();
      } else {
        setMessage({ text: data.error || "সংরক্ষণ ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "সার্ভার এরর", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const fullMarks = subjectData?.fullMarks || 100;
  const isPublished = examData?.isPublished;

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            উস্তাদ পরীক্ষা ও মূল্যায়ন প্যানেল
          </span>
          <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0D5C3A]" />
            শ্রেণিভিত্তিক নম্বর এন্ট্রি ও দাখিল
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            রোল ক্রমানুসারে প্রাপ্ত নম্বর, অনুপস্থিত বা অব্যাহতি চিহ্নিত করে দাখিল করুন।
          </p>
        </div>

        {isPublished && (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-[#D4AF37] px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm">
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            ফলাফল ইতিমধ্যে প্রকাশিত / লকড
          </div>
        )}
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
          <button onClick={() => setMessage(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* Filter Selection Grid */}
      <div className="bg-[#F9F8F3] p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">পরীক্ষা *</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full p-2 border rounded bg-white font-semibold"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.nameBn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">জামাত *</label>
          <select
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
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
          <label className="block font-semibold text-gray-700 mb-1">শাখা (ঐচ্ছিক)</label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full p-2 border rounded bg-white"
          >
            <option value="">সকল শাখা</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameBn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">বিষয় *</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full p-2 border rounded bg-white"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.nameBn} ({sub.code})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 md:col-span-4 flex justify-end">
          <button
            onClick={loadStudentMarks}
            disabled={loading}
            className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "লোড হচ্ছে..." : "শিক্ষার্থী তালিকা লোড করুন"}
          </button>
        </div>
      </div>

      {/* Marks Table */}
      {students.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border">
            <div>
              বিষয়: <strong className="text-gray-900">{subjectData?.nameBn}</strong> | পূর্ণমান:{" "}
              <strong className="text-gray-900">{fullMarks}</strong> | পাস মার্ক:{" "}
              <strong className="text-emerald-800">{subjectData?.passMarks}</strong>
            </div>
            <div>মোট পরীক্ষার্থী: {students.length} জন</div>
          </div>

          <div className="border rounded-xl overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#F9F8F3] border-b font-semibold text-gray-700">
                <tr>
                  <th className="p-3 w-16">রোল</th>
                  <th className="p-3">আইডি ও শিক্ষার্থীর নাম</th>
                  <th className="p-3 w-32">প্রাপ্ত নম্বর (০-{fullMarks})</th>
                  <th className="p-3 text-center w-28">অনুপস্থিত (Absent)</th>
                  <th className="p-3 text-center w-28">অব্যাহতি (Exempt)</th>
                  <th className="p-3">মন্তব্য / ইসলামিক গ্রেড</th>
                  <th className="p-3 text-right">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((st) => {
                  const state = marksState[st.studentId] || { marks: "", isAbsent: false, isExempt: false, remarks: "" };
                  const numMarks = Number(state.marks);
                  const isInvalid =
                    !state.isAbsent &&
                    !state.isExempt &&
                    state.marks !== "" &&
                    (isNaN(numMarks) || numMarks < 0 || numMarks > fullMarks);

                  return (
                    <tr key={st.studentId} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold">{st.rollNumber}</td>
                      <td className="p-3">
                        <p className="font-semibold text-gray-900">{st.fullNameBn}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{st.studentIdNumber}</p>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          disabled={isPublished || state.isAbsent || state.isExempt}
                          min="0"
                          max={fullMarks}
                          value={state.marks}
                          onChange={(e) => handleMarkChange(st.studentId, e.target.value)}
                          placeholder="—"
                          className={`w-24 p-1.5 border rounded text-center font-mono font-bold outline-none ${
                            isInvalid
                              ? "border-red-500 bg-red-50 text-red-700"
                              : state.isAbsent || state.isExempt
                              ? "bg-gray-100 text-gray-400"
                              : "bg-white text-[#0D5C3A]"
                          }`}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isPublished}
                          checked={state.isAbsent}
                          onChange={() => handleAbsentToggle(st.studentId)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isPublished}
                          checked={state.isExempt}
                          onChange={() => handleExemptToggle(st.studentId)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-gray-600">
                        {state.isAbsent ? (
                          <span className="text-red-700 font-bold">অনুপস্থিত (Absent)</span>
                        ) : state.isExempt ? (
                          <span className="text-amber-700 font-bold">অব্যাহতি (Exempt)</span>
                        ) : st.letterGrade ? (
                          <span className="font-semibold text-emerald-800">{st.letterGrade}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            st.status === "SUBMITTED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {st.status === "SUBMITTED" ? "দাখিলকৃত" : "খসড়া"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
            <p className="text-xs text-gray-500">
              * পরীক্ষার নম্বর এন্ট্রি সম্পন্ন হলে প্রথমে খসড়া সংরক্ষণ করুন, অতঃপর দাখিল করুন।
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {hasUnsavedChanges && (
                <span className="text-[11px] bg-amber-50 text-amber-800 font-bold px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  অসংরক্ষিত নম্বর রয়েছে
                </span>
              )}

              <button
                type="button"
                disabled={saving || isPublished}
                onClick={() => handleSave("DRAFT")}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                খসড়া সংরক্ষণ (Draft)
              </button>

              <button
                type="button"
                disabled={saving || isPublished}
                onClick={() => handleSave("SUBMIT")}
                className="px-4 py-2 bg-[#0D5C3A] hover:bg-[#158052] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                চূড়ান্ত দাখিল (Submit)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
