"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Award, CheckCircle, AlertCircle, Printer, QrCode } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function ResultsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [studentResult, setStudentResult] = useState<any | null>(null);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    fetch("/api/academic/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.classes) {
          setClasses(data.classes);
          if (data.classes.length > 0) setSelectedClassId(data.classes[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setSearchError("");
    setStudentResult(null);

    try {
      const res = await fetch("/api/students/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          rollNumber: Number(rollNumber),
        }),
      });

      const data = await res.json();
      if (res.ok && data.student) {
        setStudentResult(data.student);
      } else {
        setSearchError(data.error || "প্রদত্ত জামাত ও রোল নম্বরে কোনো তথ্য পাওয়া যায়নি।");
      }
    } catch {
      setSearchError("ফলাফল অনুসন্ধানে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <Navbar />

      <section className="bg-gradient-to-b from-[#083B25] to-[#0D5C3A] text-white py-14 px-4 border-b-4 border-[#C59B27] text-center">
        <div className="max-w-6xl mx-auto">
          <span className="bg-[#C59B27]/20 text-amber-200 border border-[#C59B27]/40 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block mb-3">
            অনলাইন রেজাল্ট ও মার্কশিট
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-white mb-3">
            শিক্ষার্থীর ফলাফল ও প্রগ্রেসিভ রিপোর্ট
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            কোনো পাসওয়ার্ডের প্রয়োজন নেই। জামাত নির্বাচন করে শিক্ষার্থীর ক্লাস রোল লিখুন।
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8 flex-1 w-full">
        {/* Search Box */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  জামাত / শ্রেণি নির্বাচন করুন *
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-1 focus:ring-[#0D5C3A]"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameBn} ({cls.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  ক্লাস রোল নম্বর লিখুন *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="যেমন: ১"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-2.5 rounded-lg text-xs font-bold transition shadow flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              {searching ? "ফলাফল খোঁজা হচ্ছে..." : "ফলাফল অনুসন্ধান করুন"}
            </button>
          </form>

          {searchError && (
            <div className="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              {searchError}
            </div>
          )}
        </div>

        {/* Result & Marksheet Card */}
        {studentResult && (
          <div className="bg-white rounded-2xl border-2 border-[#0D5C3A] p-6 shadow-md space-y-6 print:border-none print:shadow-none">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
              <div>
                <span className="text-[10px] font-bold text-[#C59B27] uppercase tracking-wide">
                  অফিসিয়াল একাডেমিক রিপোর্ট
                </span>
                <h2 className="text-xl font-bold text-[#083B25]">{studentResult.fullNameBn}</h2>
                <p className="text-xs text-gray-500 font-mono">
                  আইডি: {studentResult.studentIdNumber} | রোল: {studentResult.enrollment.rollNumber} | জামাত:{" "}
                  {studentResult.enrollment.className}
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto print:hidden"
              >
                <Printer className="w-3.5 h-3.5" />
                প্রিন্ট করুন
              </button>
            </div>

            {/* Attendance & Fee summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#F9F8F3] p-3 rounded-lg border border-gray-100 text-center">
                <span className="text-[10px] text-gray-500 block">উপস্থিতি হার</span>
                <span className="font-bold text-sm text-[#0D5C3A] font-mono">
                  {studentResult.attendanceStats.percentage}%
                </span>
              </div>
              <div className="bg-[#F9F8F3] p-3 rounded-lg border border-gray-100 text-center">
                <span className="text-[10px] text-gray-500 block">মোট ক্লাস</span>
                <span className="font-bold text-sm text-gray-800 font-mono">
                  {studentResult.attendanceStats.total} দিন
                </span>
              </div>
              <div className="bg-[#F9F8F3] p-3 rounded-lg border border-gray-100 text-center">
                <span className="text-[10px] text-gray-500 block">মোট ফি বকেয়া</span>
                <span className="font-bold text-sm text-red-700 font-mono">
                  ৳ {studentResult.feeSummary.totalDue}
                </span>
              </div>
              <div className="bg-[#F9F8F3] p-3 rounded-lg border border-gray-100 text-center">
                <span className="text-[10px] text-gray-500 block">আবাসিক অবস্থা</span>
                <span className="font-bold text-xs text-gray-800">
                  {studentResult.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}
                </span>
              </div>
            </div>

            {/* Marksheet Table */}
            <div>
              <h3 className="font-bold text-xs text-[#083B25] mb-2">বিষয়ভিত্তিক ফলাফল ও নম্বরপত্র</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-200">
                  <thead className="bg-[#F9F8F3] border-b border-gray-200 text-gray-700 font-semibold">
                    <tr>
                      <th className="p-2.5">বিষয়</th>
                      <th className="p-2.5">পূর্ণমান</th>
                      <th className="p-2.5">প্রাপ্ত নম্বর</th>
                      <th className="p-2.5">ইসলামিক গ্রেড</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {studentResult.examMarks.map((m: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2.5 font-semibold text-gray-900">{m.subjectName}</td>
                        <td className="p-2.5 font-mono">১০০</td>
                        <td className="p-2.5 font-mono font-bold text-[#0D5C3A]">{m.marks}</td>
                        <td className="p-2.5 font-semibold text-emerald-800">{m.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center pt-2 border-t border-gray-100 text-[11px] text-gray-400">
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা ডিজিটাল ক্যাম্পাস অথেন্টিকেশন দ্বারা ভেরিফাইড
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
