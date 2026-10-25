"use client";

import React, { useState, useEffect } from "react";
import {
  BookMarked,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Printer,
  Search,
  BookOpen,
  CheckSquare,
  AlertCircle,
  RotateCcw,
  Sparkles,
  FileText,
  Send,
  X,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

interface LessonPlan {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  classNameBn: string;
  sectionNameBn?: string;
  subjectNameBn: string;
  lessonDate: string;
  topicTitleBn: string;
  homeworkBn: string;
  status: "COMPLETED" | "IN_PROGRESS" | "SCHEDULED";
  notes?: string;
  createdAt: string;
}

interface ClassOption {
  id: string;
  nameBn: string;
  sections: { id: string; nameBn: string }[];
}

export default function TeacherLessonPlanManager() {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [searchDate, setSearchDate] = useState<string>("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [classNameBn, setClassNameBn] = useState("হিফজুল কুরআন বিভাগ");
  const [sectionNameBn, setSectionNameBn] = useState("ক শাখা");
  const [subjectNameBn, setSubjectNameBn] = useState("কুরআন মাজীদ ও তাজবীদ");
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split("T")[0]);
  const [topicTitleBn, setTopicTitleBn] = useState("");
  const [homeworkBn, setHomeworkBn] = useState("");
  const [status, setStatus] = useState<"COMPLETED" | "IN_PROGRESS" | "SCHEDULED">("COMPLETED");
  const [notes, setNotes] = useState("");

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/teacher/lessons");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "পাঠ পরিকল্পনা লোড করতে ব্যর্থ হয়েছে।");
      }
      setPlans(data.plans || []);
      setClasses(data.classes || []);
    } catch (err: any) {
      setError(err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreateModal = () => {
    setFormId(null);
    setClassNameBn(classes[0]?.nameBn || "হিফজুল কুরআন বিভাগ");
    setSectionNameBn("ক শাখা");
    setSubjectNameBn("কুরআন মাজীদ ও তাজবীদ");
    setLessonDate(new Date().toISOString().split("T")[0]);
    setTopicTitleBn("");
    setHomeworkBn("");
    setStatus("COMPLETED");
    setNotes("");
    setShowModal(true);
  };

  const handleEdit = (p: LessonPlan) => {
    setFormId(p.id);
    setClassNameBn(p.classNameBn);
    setSectionNameBn(p.sectionNameBn || "ক শাখা");
    setSubjectNameBn(p.subjectNameBn);
    setLessonDate(p.lessonDate);
    setTopicTitleBn(p.topicTitleBn);
    setHomeworkBn(p.homeworkBn);
    setStatus(p.status);
    setNotes(p.notes || "");
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই পাঠ পরিকল্পনাটি মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch(`/api/teacher/lessons?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlans(plans.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitleBn.trim() || !subjectNameBn.trim()) {
      alert("অনুগ্রহ করে বিষয় এবং পাঠের শিরোনাম প্রবেশ করান।");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/teacher/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formId,
          classNameBn,
          sectionNameBn,
          subjectNameBn,
          lessonDate,
          topicTitleBn,
          homeworkBn: homeworkBn || "আজকের পাঠ অনুশীলন ও মুখস্থ শুনানো",
          status,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "সংরক্ষণ ব্যর্থ হয়েছে।");
      }

      setShowModal(false);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || "ত্রুটি হয়েছে।");
    } finally {
      setSaving(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (selectedClass !== "ALL" && p.classNameBn !== selectedClass) return false;
    if (searchDate && p.lessonDate !== searchDate) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                একাডেমিক পেডাগজি ও ক্লাস ডায়েরি
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                দৈনিক পাঠ পরিকল্পনা
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 font-display mt-1.5 flex items-center gap-2">
              <BookMarked className="w-6 h-6 text-[#0D5C3A]" />
              উস্তাদের দৈনিক পাঠ পরিকল্পনা ও বাড়ির কাজ (Lesson Plan & Diary)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              প্রতিদিনের পাঠদান পরিকল্পনা (সবক), পড়ানো বিষয়বস্তু এবং শিক্ষার্থীদের নির্ধারিত বাড়ির কাজ সংরক্ষণ করুন।
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={fetchPlans}
              disabled={loading}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition"
              title="রিফ্রেশ"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-[#0D5C3A] hover:bg-[#158052] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন পাঠ পরিকল্পনা যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">জামাত / ক্লাস ফিল্টার</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            >
              <option value="ALL">সকল জামাত ও শ্রেণি</option>
              {classes.map((c) => (
                <option key={c.id} value={c.nameBn}>
                  {c.nameBn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">তারিখ অনুযায়ী ফিল্টার</label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedClass("ALL");
                setSearchDate("");
              }}
              className="w-full p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              ফিল্টার রিসেট করুন
            </button>
          </div>
        </div>
      </div>

      {/* 2. Lesson Plans Grid / Table */}
      <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0D5C3A]" />
            সংরক্ষিত পাঠ পরিকল্পনা তালিকা ({filteredPlans.length} টি)
          </h3>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>ডায়েরি প্রিন্ট</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            পাঠ পরিকল্পনা লোড হচ্ছে...
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-2">
            <BookMarked className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">কোনো পাঠ পরিকল্পনা পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              নতুন পাঠ পরিকল্পনা যুক্ত করতে উপরের "নতুন পাঠ পরিকল্পনা যোগ করুন" বাটনে ক্লিক করুন।
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredPlans.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border-2 border-slate-200/80 hover:border-[#D4AF37] hover:shadow-md transition bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0D5C3A] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      তারিখ: {p.lessonDate}
                    </span>
                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      জামাত: {p.classNameBn} {p.sectionNameBn ? `(${p.sectionNameBn})` : ""}
                    </span>
                    <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                      বিষয়: {p.subjectNameBn}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        p.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-blue-50 text-blue-800 border-blue-300"
                      }`}
                    >
                      {p.status === "COMPLETED" ? "✓ সম্পন্ন" : "চলমান"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      📖 পঠিত বিষয় / সবক: {p.topicTitleBn}
                    </h4>
                    <p className="text-xs text-slate-700 mt-1 flex items-start gap-1">
                      <strong className="text-amber-800 flex-shrink-0">📝 বাড়ির কাজ:</strong>
                      <span>{p.homeworkBn}</span>
                    </p>
                    {p.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">
                        মন্তব্য: {p.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                    title="সম্পাদনা করুন"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-300 space-y-5 animate-scaleUp my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-[#0D5C3A]" />
                {formId ? "পাঠ পরিকল্পনা সম্পাদনা" : "নতুন দৈনিক পাঠ পরিকল্পনা এন্ট্রি"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={lessonDate}
                    onChange={(e) => setLessonDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">স্ট্যাটাস</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  >
                    <option value="COMPLETED">সম্পন্ন (Completed)</option>
                    <option value="IN_PROGRESS">চলমান (In Progress)</option>
                    <option value="SCHEDULED">পরিকল্পিত (Scheduled)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">জামাত / শ্রেণি *</label>
                  <input
                    type="text"
                    required
                    value={classNameBn}
                    onChange={(e) => setClassNameBn(e.target.value)}
                    placeholder="উদাঃ হিফজুল কুরআন বিভাগ"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">শাখা</label>
                  <input
                    type="text"
                    value={sectionNameBn}
                    onChange={(e) => setSectionNameBn(e.target.value)}
                    placeholder="উদাঃ ক শাখা"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">বিষয় / কিতাবের নাম *</label>
                <input
                  type="text"
                  required
                  value={subjectNameBn}
                  onChange={(e) => setSubjectNameBn(e.target.value)}
                  placeholder="উদাঃ কুরআন মাজীদ ও তাজবীদ / হেদায়া ১ম খণ্ড"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  আজকের পঠিত পাঠ / সবক (Lesson Topic) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={topicTitleBn}
                  onChange={(e) => setTopicTitleBn(e.target.value)}
                  placeholder="উদাঃ সূরা আল-মুলক (১-১৫ আয়াত) সহীহ মাখরাজ ও সিফাত সহ তিলাওয়াত..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  নির্ধারিত বাড়ির কাজ (Home Work) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={homeworkBn}
                  onChange={(e) => setHomeworkBn(e.target.value)}
                  placeholder="উদাঃ ১-১৫ আয়াত মুখস্থ শুনানো এবং মাখরাজ খাতা অনুশীলন..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">মন্তব্য (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ছাত্রদের প্রস্তুতি বা বিশেষ কোনো নির্দেশনা..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#0D5C3A] hover:bg-[#158052] text-white font-bold disabled:opacity-50 transition"
                >
                  {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
