"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  Printer,
  Sparkles,
  Users,
  X,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
} from "lucide-react";
import StudentIdCardView, { StudentCardData } from "./StudentIdCardView";

export default function StudentIdCardHub() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentCardData[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentCardData | null>(null);
  const [batchPrintMode, setBatchPrintMode] = useState(false);

  const loadStudents = async (classId?: string, query?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (classId && classId !== "ALL") params.set("classId", classId);
      if (query) params.set("q", query);

      const res = await fetch(`/api/idcard/students?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setStudents(json.data.students || []);
        if (json.data.classes && classes.length === 0) {
          setClasses(json.data.classes);
        }
      }
    } catch (err) {
      console.error("Error loading ID card students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleClassChange = (cId: string) => {
    setSelectedClassId(cId);
    loadStudents(cId, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents(selectedClassId, searchQuery);
  };

  const filteredStudents = students.filter((st) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      st.fullNameBn.toLowerCase().includes(q) ||
      st.fullNameEn.toLowerCase().includes(q) ||
      st.studentIdNumber.toLowerCase().includes(q) ||
      String(st.rollNumber).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="bg-gradient-to-r from-[#063320] via-[#0D5C3A] to-[#0A452B] p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-400 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold mb-2">
              <CreditCard className="w-4 h-4 text-amber-300" />
              <span>ডিজিটাল পিভিসি আইডি কার্ড জেনারেটর</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-serif-bn">
              স্টুডেন্ট আইডি কার্ড হাব (CR80 স্ট্যান্ডার্ড)
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
              মাদরাসার সকল শিক্ষার্থীর জন্য প্রাতিষ্ঠানিক লোগো, কিউআর কোড এবং মুহতামিমের ডিজিটাল সিল সম্বলিত দুই পৃষ্ঠার প্রিন্ট-উপযোগী পরিচয়পত্র।
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setBatchPrintMode(true);
                setTimeout(() => window.print(), 300);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-black shadow-lg shadow-amber-900/20 active:scale-95 transition"
            >
              <Printer className="w-4 h-4 text-stone-900" />
              <span>একসাথে ব্যাচ প্রিন্ট ({filteredStudents.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> জামাত:
          </span>
          <button
            type="button"
            onClick={() => handleClassChange("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedClassId === "ALL"
                ? "bg-[#0D5C3A] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            সকল জামাত
          </button>
          {classes.map((cls) => (
            <button
              key={cls.id}
              type="button"
              onClick={() => handleClassChange(cls.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedClassId === cls.id
                  ? "bg-[#0D5C3A] text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {cls.nameBn}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, রোল বা আইডি দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]/30 focus:border-[#0D5C3A]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* 3. Students Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">আইডি কার্ড তালিকা লোড হচ্ছে...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">কোনো শিক্ষার্থী পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-500">অনুগ্রহ করে ভিন্ন জামাত নির্বাচন করুন বা অনুসন্ধান শব্দ পরিবর্তন করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 no-print">
          {filteredStudents.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#D4AF37] p-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0D5C3A] to-[#042416] text-amber-300 font-black text-xl flex items-center justify-center border border-[#D4AF37] shadow">
                    {st.fullNameBn.charAt(0)}
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    {st.studentIdNumber}
                  </span>
                </div>

                <h3 className="font-black text-slate-900 font-serif-bn text-sm truncate">
                  {st.fullNameBn}
                </h3>
                <p className="text-[11px] text-slate-500 truncate">{st.fullNameEn}</p>

                <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>জামাত:</span>
                    <strong className="text-slate-800 font-serif-bn">{st.className}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>রোল ও শাখা:</span>
                    <strong className="text-slate-800">
                      রোল {st.rollNumber} ({st.sectionName})
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>রক্তের গ্রুপ:</span>
                    <strong className="text-red-600 font-black">{st.bloodGroup}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(st)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-[#0D5C3A] text-[#0D5C3A] hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>কার্ড দেখুন</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Single Student Card Preview Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-[#D4AF37] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 font-serif-bn">
                  {selectedStudent.fullNameBn}-এর আইডি কার্ড
                </h3>
                <p className="text-xs text-slate-500 font-mono">আইডি: {selectedStudent.studentIdNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <StudentIdCardView student={selectedStudent} />
          </div>
        </div>
      )}

      {/* 5. Batch Print Layout (Hidden on screen, Active when window.print() is called) */}
      <div className={`batch-print-container ${batchPrintMode ? "block" : "hidden print:block"}`}>
        <div className="grid grid-cols-2 gap-4 p-4">
          {filteredStudents.map((st) => (
            <div key={st.id} className="break-inside-avoid page-break-inside-avoid">
              <StudentIdCardView student={st} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
