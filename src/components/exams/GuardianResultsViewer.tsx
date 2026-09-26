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
    if (initialStudentId) {
      setStudentId(initialStudentId);
      loadPublishedResults(initialStudentId);
    }
  }, [initialStudentId]);

  const loadPublishedResults = async (sId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/results?studentId=${sId}`);
      const data = await res.json();
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
      setError(err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

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

          {/* Marksheet Container */}
          {selectedResult && (
            <div className="bg-white rounded-2xl border-2 border-[#0D5C3A] p-6 sm:p-8 shadow-md space-y-6 print:border-none print:shadow-none print:p-0">
              {/* Institutional Header */}
              <div className="text-center pb-4 border-b-2 border-gray-200 space-y-1">
                <span className="text-[11px] font-bold text-[#C59B27] uppercase tracking-wider block">
                  বিসমিল্লাহির রাহমানির রাহিম
                </span>
                <h1 className="text-xl sm:text-2xl font-bold font-display text-[#083B25]">
                  {INSTITUTION_INFO.nameBn}
                </h1>
                <p className="text-xs text-gray-500">{INSTITUTION_INFO.addressBn}</p>
                <div className="inline-block bg-[#0D5C3A] text-white text-xs font-bold px-4 py-1 rounded-full uppercase mt-2 shadow-sm">
                  {selectedResult.examNameBn} — {selectedResult.sessionYear}
                </div>
              </div>

              {/* Student Metadata Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F9F8F3] p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 block">শিক্ষার্থীর নাম</span>
                  <span className="font-bold text-gray-900 block mt-0.5">
                    {studentInfo?.fullNameBn}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">ছাত্র আইডি</span>
                  <span className="font-mono font-bold text-[#0D5C3A] block mt-0.5">
                    {studentInfo?.studentIdNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">জামাত ও শাখা</span>
                  <span className="font-semibold text-gray-800 block mt-0.5">
                    {studentInfo?.className} {studentInfo?.sectionName ? `(${studentInfo.sectionName})` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">শ্রেণি রোল নম্বর</span>
                  <span className="font-mono font-bold text-base text-gray-900 block mt-0.5">
                    {studentInfo?.rollNumber}
                  </span>
                </div>
              </div>

              {/* Subjects and Marks Table */}
              <div>
                <h3 className="font-bold text-xs text-[#083B25] mb-2 flex items-center justify-between">
                  <span>বিষয়ভিত্তিক নম্বর বিবরণী</span>
                  <span className="text-[11px] text-gray-400 font-normal">
                    সর্বমোট বিষয়: {selectedResult.snapshot?.result?.subjects?.length || 0} টি
                  </span>
                </h3>

                <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F9F8F3] border-b font-semibold text-gray-700">
                      <tr>
                        <th className="p-3">বিষয়</th>
                        <th className="p-3 text-center">পূর্ণমান</th>
                        <th className="p-3 text-center">পাস মার্ক</th>
                        <th className="p-3 text-center">প্রাপ্ত নম্বর</th>
                        <th className="p-3 text-center">গ্রেড</th>
                        <th className="p-3 text-right">ফলাফল</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedResult.snapshot?.result?.subjects?.map((sub: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3 font-semibold text-gray-900">
                            {sub.subjectNameBn}{" "}
                            {sub.isOptional && (
                              <span className="text-[10px] text-amber-700 font-normal">(ঐচ্ছিক)</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-center">{sub.fullMarks}</td>
                          <td className="p-3 font-mono text-center text-gray-500">{sub.passMarks}</td>
                          <td className="p-3 font-mono font-bold text-center text-[#0D5C3A]">
                            {sub.isAbsent ? (
                              <span className="text-red-700">অনুপস্থিত</span>
                            ) : sub.isExempt ? (
                              <span className="text-amber-700">অব্যাহতি</span>
                            ) : (
                              sub.marksObtained
                            )}
                          </td>
                          <td className="p-3 text-center font-medium text-emerald-900">
                            {sub.gradeBn}
                          </td>
                          <td className="p-3 text-right">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                sub.isPassed
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {sub.isPassed ? "পাস" : "ফেল"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#F9F8F3] border-t font-bold text-gray-900">
                      <tr>
                        <td className="p-3">সর্বমোট নম্বর</td>
                        <td className="p-3 font-mono text-center">{selectedResult.totalFullMarks}</td>
                        <td className="p-3 text-center">—</td>
                        <td className="p-3 font-mono text-center text-[#0D5C3A]">
                          {selectedResult.totalObtained}
                        </td>
                        <td className="p-3 text-center text-emerald-800">
                          {selectedResult.finalGradeBn}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                              selectedResult.isPassed
                                ? "bg-emerald-600 text-white"
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

              {/* Percentage & Islamic Grade Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-gray-500 block text-[10px]">প্রাপ্ত শতকরা হার</span>
                  <span className="font-mono font-bold text-lg text-emerald-900">
                    {selectedResult.percentage}%
                  </span>
                </div>
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-gray-500 block text-[10px]">ইসলামিক ফলাফল গ্রেড</span>
                  <span className="font-bold text-sm text-amber-900">
                    {selectedResult.finalGradeBn}
                  </span>
                </div>
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <span className="text-gray-500 block text-[10px]">ফলাফল স্থিতি</span>
                  <span
                    className={`font-bold text-sm ${
                      selectedResult.isPassed ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {selectedResult.isPassed ? "উত্তীর্ণ (PASSED)" : "অনুত্তীর্ণ (FAILED)"}
                  </span>
                </div>
              </div>

              {/* Signature Areas for Print */}
              <div className="pt-12 grid grid-cols-3 gap-4 text-center text-xs text-gray-600 border-t border-dashed">
                <div>
                  <div className="border-t border-gray-400 w-32 mx-auto pt-1">
                    শ্রেণি শিক্ষক
                  </div>
                </div>
                <div>
                  <div className="border-t border-gray-400 w-32 mx-auto pt-1">
                    পরীক্ষা নিয়ন্ত্রক
                  </div>
                </div>
                <div>
                  <div className="border-t border-gray-400 w-32 mx-auto pt-1 font-semibold text-[#083B25]">
                    মুহতামিম / অধ্যক্ষ
                  </div>
                </div>
              </div>

              {/* Security Seal & Verification Link */}
              <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    ভেরিফিকেশন কোড:{" "}
                    <strong className="font-mono text-gray-800">
                      {selectedResult.verificationCode}
                    </strong>
                  </span>
                </div>

                {selectedResult.verificationCode && (
                  <Link
                    href={`/verify/result/${selectedResult.verificationCode}`}
                    target="_blank"
                    className="text-[#0D5C3A] hover:underline font-semibold flex items-center gap-1 print:hidden"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    অনলাইন সত্যতা যাচাই করুন
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
