"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface ExamRoutineItem {
  id: string;
  examId: string;
  classId: string;
  sectionId?: string | null;
  subjectId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  roomNo?: string | null;
  instructions?: string | null;
  status: string;
  exam: {
    id: string;
    nameBn: string;
    nameEn: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  jamatClass: {
    id: string;
    nameBn: string;
    nameEn: string;
    code: string;
  };
  section?: {
    id: string;
    nameBn: string;
    nameEn: string;
  } | null;
  subject: {
    id: string;
    nameBn: string;
    nameEn: string;
    code: string;
    fullMarks: number;
    passMarks: number;
  };
}

interface ExamItem {
  id: string;
  nameBn: string;
  nameEn: string;
  startDate: string;
  endDate: string;
  status: string;
  instructions?: string | null;
}

export default function TeacherExamViewer() {
  const [routines, setRoutines] = useState<ExamRoutineItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/teacher/exams/routines");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "পরীক্ষার রুটিন লোড করতে ব্যর্থ হয়েছে।");
      }
      setRoutines(data.routines || []);
      setExams(data.exams || []);
    } catch (err: any) {
      setError(err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamData();
  }, []);

  const filteredRoutines = routines.filter((r) =>
    selectedExamId === "ALL" ? true : r.examId === selectedExamId
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#0D5C3A]" />
            পরীক্ষার সময়সূচি ও রুটিন (Exam Routine)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            আপনার দায়িত্বপ্রাপ্ত জামাতসমূহের আসন্ন ও চলমান পরীক্ষার রুটিন এবং সময়সূচি।
          </p>
        </div>
        <div className="flex items-center gap-2">
          {exams.length > 0 && (
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0D5C3A]/20"
            >
              <option value="ALL">সকল পরীক্ষা ({routines.length})</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.nameBn}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={fetchExamData}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="রিফ্রেশ করুন"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scheduled Exams Banner if any */}
      {exams.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            সক্রিয় ও আসন্ন পরীক্ষাসমূহ
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="p-4 rounded-xl border border-slate-200 bg-emerald-50/30 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 truncate">
                    {exam.nameBn}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {exam.status === "PUBLISHED" ? "প্রকাশিত" : exam.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 flex items-center gap-1.5 font-sans">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {new Date(exam.startDate).toLocaleDateString("bn-BD")} হতে{" "}
                    {new Date(exam.endDate).toLocaleDateString("bn-BD")}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Routines */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          বিষয়ভিত্তিক পরীক্ষার রুটিন
        </h3>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            পরীক্ষার রুটিন লোড হচ্ছে...
          </div>
        ) : filteredRoutines.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">
              কোনো পরীক্ষার রুটিন প্রকাশিত হয়নি
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              আপনার দায়িত্বপ্রাপ্ত শ্রেণি বা জামাতসমূহের জন্য এখনও কোনো পরীক্ষার রুটিন প্রকাশিত হয়নি। রুটিন চূড়ান্ত হলে এখানে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-bold">
                  <th className="p-3 text-left">তারিখ ও বার</th>
                  <th className="p-3 text-left">সময়</th>
                  <th className="p-3 text-left">জামাত ও শাখা</th>
                  <th className="p-3 text-left">পরীক্ষার বিষয়</th>
                  <th className="p-3 text-center">পূর্ণমান / পাস</th>
                  <th className="p-3 text-left">কক্ষ নম্বর</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoutines.map((routine) => {
                  const examDateObj = new Date(routine.examDate);
                  const dayName = [
                    "রবিবার",
                    "সোমবার",
                    "মঙ্গলবার",
                    "বুধবার",
                    "বৃহস্পতিবার",
                    "শুক্রবার",
                    "শনিবার",
                  ][examDateObj.getDay()];

                  return (
                    <tr
                      key={routine.id}
                      className="hover:bg-emerald-50/30 transition text-slate-800"
                    >
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {examDateObj.toLocaleDateString("bn-BD")}
                        </div>
                        <div className="text-[11px] text-slate-500">{dayName}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {routine.startTime} - {routine.endTime}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">
                          {routine.jamatClass?.nameBn}
                        </div>
                        <div className="text-[11px] text-[#0D5C3A] font-semibold">
                          {routine.section?.nameBn
                            ? `শাখা: ${routine.section.nameBn}`
                            : "সকল শাখা"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">
                          {routine.subject?.nameBn}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {routine.subject?.code}
                        </div>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap font-mono">
                        <span className="font-bold text-slate-900">
                          {routine.subject?.fullMarks}
                        </span>{" "}
                        /{" "}
                        <span className="text-slate-500">
                          {routine.subject?.passMarks}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {routine.roomNo ? (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {routine.roomNo}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
