"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  FileText,
  Play,
  QrCode,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  X,
  FileCheck,
  Sparkles,
} from "lucide-react";
import {
  TrainingProgram,
  TrainingEnrollment,
  TrainingCertificate,
} from "@/lib/training/types";

export default function PortalTrainingPage() {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [certificates, setCertificates] = useState<TrainingCertificate[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Active Learning / Quiz State
  const [activeProgram, setActiveProgram] = useState<TrainingProgram | null>(null);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "MODULES" | "ASSESSMENT">("OVERVIEW");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const loadPortalData = async () => {
    setLoading(true);
    try {
      const [progsRes, certsRes] = await Promise.all([
        fetch("/api/training/programs"),
        fetch("/api/training/certificates"),
      ]);

      const [progsData, certsData] = await Promise.all([
        progsRes.json(),
        certsRes.json(),
      ]);

      if (progsData.success) {
        setPrograms(progsData.programs || []);
      }
      if (certsData.success) {
        setCertificates(certsData.certificates || []);
      }
    } catch (err) {
      console.error("Portal training load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSelfEnroll = async (programId: string) => {
    try {
      const res = await fetch(`/api/training/programs/${programId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || "রেজিস্ট্রেশন সফল হয়েছে!");
        await loadPortalData();
      } else {
        alert(data.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    }
  };

  const handleOpenCourse = async (program: TrainingProgram) => {
    try {
      // Fetch detailed sanitized program
      const res = await fetch(`/api/training/programs/${program.id}`);
      const data = await res.json();
      if (data.success) {
        setActiveProgram(data.program);
        setActiveTab("OVERVIEW");
        setQuizResult(null);
        setQuizAnswers({});
      } else {
        setActiveProgram(program);
      }
    } catch (err) {
      setActiveProgram(program);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeProgram) return;

    setSubmittingQuiz(true);
    try {
      const res = await fetch(`/api/training/assessments/${activeProgram.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: quizAnswers }),
      });

      const data = await res.json();
      if (data.success) {
        setQuizResult(data.submission);
        showToast(data.message);
        await loadPortalData();
      } else {
        alert(data.error || "মূল্যায়ন জমা দিতে সমস্যা হয়েছে।");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleClaimCertificate = async (programId: string) => {
    try {
      const res = await fetch("/api/training/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("আলহামদুলিল্লাহ! আপনার সনদ সফলভাবে প্রস্তুত হয়েছে।");
        await loadPortalData();
      } else {
        alert(data.error || "সনদপত্র ইস্যু করা সম্ভব হয়নি। শর্তাবলী যাচাই করুন।");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-800 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-600 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
          <span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-emerald-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>শিক্ষক ও কর্মী লার্নিং পোর্টাল</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              আমার প্রাতিষ্ঠানিক প্রশিক্ষণ ও পেশাগত উন্নয়ন
            </h1>
            <p className="text-emerald-100/80 text-sm max-w-2xl leading-relaxed">
              আপনার নির্ধারিত প্রশিক্ষণ কোর্সের পাঠ্য উপাদান অধ্যয়ন করুন, মূল্যায়নে অংশগ্রহণ করুন এবং
              সফল সমাপ্তির পর অফিশিয়াল যাচাইযোগ্য সনদপত্র সংগ্রহ করুন।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/portal/training/certificates"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow transition"
            >
              <Award className="w-4 h-4" />
              <span>অর্জিত সনদপত্র ({certificates.length})</span>
            </a>
          </div>
        </div>
      </div>

      {/* Course List & Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>উপলব্ধ প্রশিক্ষণ কোর্সসমূহ ({programs.length})</span>
          </h2>
          <span className="text-xs text-slate-500">নিয়মিত দক্ষতা বৃদ্ধি করুন</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-medium">বর্তমানে কোনো training program নেই।</p>
            </div>
          ) : (
            programs.map((prog) => {
              const hasCertificate = certificates.some((c) => c.trainingProgramId === prog.id);

              return (
                <div
                  key={prog.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:shadow-lg transition p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-400">{prog.trainingCode}</span>
                      <div className="flex items-center gap-1.5">
                        {prog.mandatoryStatus === "MANDATORY" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            বাধ্যতামূলক
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {prog.deliveryMethod}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                      {prog.titleBn}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{prog.description}</p>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">প্রশিক্ষক:</span>
                        <span className="font-medium text-slate-800">{prog.instructorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">মেয়াদ ও সেশন:</span>
                        <span className="font-medium text-slate-800">
                          {prog.totalHours} ঘন্টা ({prog.sessions.length} সেশন)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">পাস মার্ক:</span>
                        <span className="font-medium text-slate-800">{prog.passPercentage}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {hasCertificate ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>সনদ অর্জিত</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaimCertificate(prog.id)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
                      >
                        সনদ দাবি করুন
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      {prog.status === "REGISTRATION_OPEN" && (
                        <button
                          onClick={() => handleSelfEnroll(prog.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
                        >
                          নিবন্ধন
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenCourse(prog)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm"
                      >
                        <span>পাঠ্য ও কুইজ</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ACTIVE COURSE & QUIZ MODAL */}
      {activeProgram && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-mono text-slate-400">{activeProgram.trainingCode}</span>
                <h3 className="text-lg font-bold text-slate-900">{activeProgram.titleBn}</h3>
                <p className="text-xs text-slate-500">প্রশিক্ষক: {activeProgram.instructorName}</p>
              </div>
              <button onClick={() => setActiveProgram(null)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Course Tabs */}
            <div className="flex gap-2 border-b border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("OVERVIEW")}
                className={`pb-2 px-3 border-b-2 transition ${
                  activeTab === "OVERVIEW"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                উদ্দেশ্য ও সারসংক্ষেপ
              </button>
              <button
                onClick={() => setActiveTab("MODULES")}
                className={`pb-2 px-3 border-b-2 transition ${
                  activeTab === "MODULES"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                পাঠ্য মডিউলসমূহ ({activeProgram.modules.length})
              </button>
              {activeProgram.assessment && (
                <button
                  onClick={() => setActiveTab("ASSESSMENT")}
                  className={`pb-2 px-3 border-b-2 transition ${
                    activeTab === "ASSESSMENT"
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  পরীক্ষা ও মূল্যায়ন ({activeProgram.assessment.questions.length} প্রশ্ন)
                </button>
              )}
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === "OVERVIEW" && (
              <div className="space-y-4 text-xs text-slate-700">
                <p className="text-slate-600 text-sm leading-relaxed">{activeProgram.description}</p>

                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-2">
                  <h4 className="font-bold text-emerald-900 text-sm">শিখন উদ্দেশ্যসমূহ:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {activeProgram.objectivesBn.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px]">মোট সময়</span>
                    <div className="font-bold text-slate-800">{activeProgram.totalHours} ঘন্টা</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px]">উপস্থিতি শর্ত</span>
                    <div className="font-bold text-slate-800">{activeProgram.attendanceThresholdPercentage}%</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px]">পাস মার্ক</span>
                    <div className="font-bold text-slate-800">{activeProgram.passPercentage}%</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px]">সনদপত্র</span>
                    <div className="font-bold text-slate-800">
                      {activeProgram.issuesCertificate ? "হ্যাঁ (প্রযোজ্য)" : "না"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MODULES */}
            {activeTab === "MODULES" && (
              <div className="space-y-3">
                {activeProgram.modules.map((m) => (
                  <div key={m.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">
                        মডিউল {m.moduleNumber}: {m.titleBn}
                      </h4>
                      <span className="text-slate-400 text-xs font-mono">{m.estimatedHours} ঘন্টা</span>
                    </div>
                    <p className="text-xs text-slate-600">{m.description}</p>

                    {m.topics && m.topics.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <span className="text-[11px] font-semibold text-slate-500">আলোচ্য বিষয়সমূহ:</span>
                        <ul className="list-disc list-inside text-xs text-slate-700 mt-1 space-y-0.5">
                          {m.topics.map((t, idx) => (
                            <li key={idx}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: ASSESSMENT RUNNER */}
            {activeTab === "ASSESSMENT" && activeProgram.assessment && (
              <div className="space-y-5">
                <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                  <div className="font-bold text-sm">{activeProgram.assessment.titleBn}</div>
                  <p>
                    পাস করার জন্য ন্যূনতম {activeProgram.assessment.passPercentage}% নম্বর অর্জন আবশ্যক। সকল প্রশ্নের
                    উত্তর প্রদান করে নিচে সাবমিট বাটনে ক্লিক করুন।
                  </p>
                </div>

                {/* Display Quiz Result if already submitted */}
                {quizResult && (
                  <div
                    className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
                      quizResult.status === "PASSED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : quizResult.status === "FAILED"
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    <div>
                      <div>
                        {quizResult.status === "PASSED"
                          ? "মাশাআল্লাহ! আপনি উত্তীর্ণ হয়েছেন।"
                          : "দুর্ভাগ্যবশত আপনি পাস করতে পারেননি।"}
                      </div>
                      <div className="text-xs font-normal mt-0.5">
                        অর্জিত স্কোর: {quizResult.score} ({quizResult.percentage}%) | স্ট্যাটাস: {quizResult.status}
                      </div>
                    </div>
                    {quizResult.status === "PASSED" && (
                      <button
                        onClick={() => handleClaimCertificate(activeProgram.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        সনদপত্র সংগ্রহ
                      </button>
                    )}
                  </div>
                )}

                {/* Question List */}
                <div className="space-y-4">
                  {activeProgram.assessment.questions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {idx + 1}. {q.questionBn}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">{q.points} নম্বর</span>
                      </div>

                      {q.options && q.options.length > 0 && (
                        <div className="space-y-2 text-xs">
                          {q.options.map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                                quizAnswers[q.id] === opt
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-medium"
                                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                value={opt}
                                checked={quizAnswers[q.id] === opt}
                                onChange={() => handleAnswerSelect(q.id, opt)}
                                className="text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {submittingQuiz ? "সাবমিট হচ্ছে..." : "মূল্যায়ন উত্তরপত্র জমা দিন"}
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveProgram(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold"
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
