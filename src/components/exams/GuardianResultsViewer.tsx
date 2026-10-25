"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle,
  AlertCircle,
  Printer,
  ShieldCheck,
  ChevronRight,
  QrCode,
  FileText,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function GuardianResultsViewer({ initialStudentId }: { initialStudentId?: string }) {
  const [studentId, setStudentId] = useState(initialStudentId || "");
  const [loading, setLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStudentId && initialStudentId !== studentId) {
      setStudentId(initialStudentId);
    }
  }, [initialStudentId, studentId]);

  useEffect(() => {
    if (!studentId) return;

    const controller = new AbortController();
    let isCurrent = true;

    const loadPublishedResults = async (sId: string) => {
      setLoading(true);
      setError(null);
      // Clear previous student's results immediately to avoid stale data
      setStudentInfo(null);
      setResults([]);
      setSelectedResult(null);

      try {
        const res = await fetch(`/api/portal/results?studentId=${sId}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (!isCurrent) return;

        if (res.ok) {
          setStudentInfo(data.student);
          setResults(data.results || []);
          if (data.results && data.results.length > 0) {
            setSelectedResult(data.results[0]);
          } else {
            setSelectedResult(null);
          }
        } else {
          setError(data.error || "ফলাফল পাওয়া যায়নি।");
        }
      } catch (err: any) {
        if (err.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        if (isCurrent) {
          setError(err.message || "সার্ভার এরর");
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    loadPublishedResults(studentId);

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [studentId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
        <div>
          <span className="text-[10px] font-bold text-[#C59B27] uppercase tracking-wider block">
            অভিভাবক ফলাফল পোর্টাল
          </span>
          <h2 className="text-base font-bold text-[#083B25] flex items-center gap-1.5">
            <Award className="w-5 h-5 text-[#0D5C3A]" />
            সাময়িক ও বার্ষিক পরীক্ষার মার্কশিট
          </h2>
          <p className="text-xs text-gray-500">
            মাদরাসা কর্তৃপক্ষ কর্তৃক অনুমোদিত ও প্রকাশিত অফিসিয়াল ফলাফল বিবরণী।
          </p>
        </div>

        {selectedResult && (
          <button
            onClick={() => window.print()}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm print:hidden self-start sm:self-auto"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" />
            মার্কশিট প্রিন্ট করুন
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center py-12 text-xs text-gray-500">ফলাফল লোড হচ্ছে...</p>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 p-8 space-y-2">
          <FileText className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-xs text-gray-500 font-medium">
            এই শিক্ষার্থীর কোনো পরীক্ষার ফলাফল এখনো আনুষ্ঠানিকভাবে প্রকাশিত হয়নি।
          </p>
          <p className="text-[11px] text-gray-400">
            উস্তাদ ও প্রশাসন কর্তৃক চূড়ান্ত নিরীক্ষার পর ফলাফল এখানে প্রদর্শিত হবে।
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Exam Selector if multiple published exams */}
          {results.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs print:hidden">
              <span className="font-semibold text-gray-700 whitespace-nowrap">পরীক্ষা নির্বাচন:</span>
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedResult(r)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                    selectedResult?.id === r.id
                      ? "bg-[#0D5C3A] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {r.examNameBn}
                </button>
              ))}
            </div>
          )}

          {/* Marksheet Container (3D Gold Institutional Certificate) */}
          {selectedResult && (
            <div className="perspective-1000">
              <div className="card-3d bg-white rounded-3xl border-2 border-[#D4AF37] p-6 sm:p-10 shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0 relative overflow-hidden">
                {/* Gold Gradient Top Bar & Subtle Watermark */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0D5C3A] via-[#D4AF37] to-[#0D5C3A]" />
                <div className="absolute inset-0 bg-islamic-pattern opacity-5 pointer-events-none" />

                {/* Institutional Header */}
                <div className="text-center pb-5 border-b-2 border-emerald-900/10 space-y-2 relative">
                  <span className="font-arabic text-[#9A781D] text-sm tracking-widest block font-bold">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full">
                      স্থাপিত: ২০২১ ইং
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      অফিসিয়াল একাডেমিক মার্কশিট
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-3xl font-black font-serif-bn text-[#083B25]">
                    {INSTITUTION_INFO.nameBn}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">{INSTITUTION_INFO.addressBn}</p>
                  
                  <div className="pt-2">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0D5C3A] to-[#063321] text-amber-300 border border-[#D4AF37] text-xs sm:text-sm font-extrabold px-5 py-1.5 rounded-full uppercase shadow-md">
                      <Award className="w-4 h-4 text-amber-300" />
                      <span>{selectedResult.examNameBn} — {selectedResult.sessionYear}</span>
                    </div>
                  </div>
                </div>

                {/* Student Metadata Card (3D Institutional Card) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-gradient-to-br from-emerald-50/50 via-amber-50/30 to-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/40 text-xs shadow-inner">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">শিক্ষার্থীর নাম</span>
                    <span className="font-black text-slate-900 block mt-1 text-sm font-serif-bn">
                      {studentInfo?.fullNameBn}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">ছাত্র আইডি</span>
                    <span className="font-mono font-bold text-[#0D5C3A] block mt-1 text-sm">
                      {studentInfo?.studentIdNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">জামাত ও শাখা</span>
                    <span className="font-bold text-slate-800 block mt-1">
                      {studentInfo?.className} {studentInfo?.sectionName ? `(${studentInfo.sectionName})` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">শ্রেণি রোল নম্বর</span>
                    <span className="font-mono font-black text-base text-slate-900 block mt-0.5">
                      {studentInfo?.rollNumber}
                    </span>
                  </div>
                </div>

                {/* Subjects and Marks Table */}
                <div className="space-y-2">
                  <h3 className="font-black text-xs sm:text-sm text-[#083B25] flex items-center justify-between font-serif-bn">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#D4AF37]" />
                      বিষয়ভিত্তিক নম্বর ও গ্রেড বিবরণী
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      সর্বমোট বিষয়: {selectedResult.snapshot?.result?.subjects?.length || 0} টি
                    </span>
                  </h3>

                  <div className="border-2 border-slate-200/90 rounded-2xl overflow-hidden text-xs shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-[#F8FAFC] border-b-2 border-slate-200 font-bold text-slate-700">
                        <tr>
                          <th className="p-3.5">বিষয়</th>
                          <th className="p-3.5 text-center">পূর্ণমান</th>
                          <th className="p-3.5 text-center">পাস মার্ক</th>
                          <th className="p-3.5 text-center">প্রাপ্ত নম্বর</th>
                          <th className="p-3.5 text-center">গ্রেড</th>
                          <th className="p-3.5 text-right">ফলাফল</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedResult.snapshot?.result?.subjects?.map((sub: any, idx: number) => (
                          <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900">
                              {sub.subjectNameBn}{" "}
                              {sub.isOptional && (
                                <span className="text-[10px] text-amber-700 font-medium">(ঐচ্ছিক)</span>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-center text-slate-600">{sub.fullMarks}</td>
                            <td className="p-3.5 font-mono text-center text-slate-500">{sub.passMarks}</td>
                            <td className="p-3.5 font-mono font-bold text-center text-[#0D5C3A] text-sm">
                              {sub.isAbsent ? (
                                <span className="text-red-700">অনুপস্থিত</span>
                              ) : sub.isExempt ? (
                                <span className="text-amber-700">অব্যাহতি</span>
                              ) : (
                                sub.marksObtained
                              )}
                            </td>
                            <td className="p-3.5 text-center font-bold text-emerald-900">
                              <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                                {sub.gradeBn}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                  sub.isPassed
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : "bg-red-100 text-red-800 border border-red-300"
                                }`}
                              >
                                {sub.isPassed ? "পাস" : "ফেল"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[#F8FAFC] border-t-2 border-slate-200 font-black text-slate-900">
                        <tr>
                          <td className="p-3.5">সর্বমোট নম্বর</td>
                          <td className="p-3.5 font-mono text-center">{selectedResult.totalFullMarks}</td>
                          <td className="p-3.5 text-center">—</td>
                          <td className="p-3.5 font-mono text-center text-[#0D5C3A] text-sm">
                            {selectedResult.totalObtained}
                          </td>
                          <td className="p-3.5 text-center text-emerald-900 font-bold">
                            {selectedResult.finalGradeBn}
                          </td>
                          <td className="p-3.5 text-right">
                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-full ${
                                selectedResult.isPassed
                                  ? "bg-gradient-to-r from-[#0D5C3A] to-[#158052] text-amber-300 border border-[#D4AF37]"
                                  : "bg-red-600 text-white"
                              }`}
                            >
                              {selectedResult.isPassed ? "কৃতকার্য" : "অকৃতকার্য"}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Percentage & Islamic Grade Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center shadow-xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">প্রাপ্ত শতকরা হার</span>
                    <span className="font-mono font-black text-xl text-emerald-900 block mt-1">
                      {selectedResult.percentage}%
                    </span>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-center shadow-xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">ইসলামিক ফলাফল গ্রেড</span>
                    <span className="font-black text-base text-amber-900 block mt-1 font-serif-bn">
                      {selectedResult.finalGradeBn}
                    </span>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center shadow-xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">ফলাফল স্থিতি</span>
                    <span
                      className={`font-black text-base block mt-1 ${
                        selectedResult.isPassed ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {selectedResult.isPassed ? "উত্তীর্ণ (PASSED)" : "অনুত্তীর্ণ (FAILED)"}
                    </span>
                  </div>
                </div>

                {/* Signature Areas for Print */}
                <div className="pt-10 grid grid-cols-3 gap-4 text-center text-xs text-slate-600 border-t border-dashed border-slate-300">
                  <div>
                    <div className="border-t border-slate-400 w-32 mx-auto pt-1 font-semibold">
                      শ্রেণি শিক্ষক
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 w-32 mx-auto pt-1 font-semibold">
                      পরীক্ষা নিয়ন্ত্রক
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 w-32 mx-auto pt-1 font-bold text-[#083B25]">
                      মুহতামিম / অধ্যক্ষ
                    </div>
                  </div>
                </div>

                {/* Security Seal & Verification Link */}
                <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      ডিজিটাল ভেরিফিকেশন কোড:{" "}
                      <strong className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {selectedResult.verificationCode}
                      </strong>
                    </span>
                  </div>

                  {selectedResult.verificationCode && (
                    <Link
                      href={`/verify/result/${selectedResult.verificationCode}`}
                      target="_blank"
                      className="text-[#0D5C3A] hover:underline font-bold flex items-center gap-1.5 print:hidden bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>অনলাইন সত্যতা যাচাই করুন</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
