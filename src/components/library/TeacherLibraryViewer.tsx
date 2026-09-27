"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  ShieldCheck,
  RotateCw,
} from "lucide-react";

export default function TeacherLibraryViewer() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTeacherLibraryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/library");
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setError(json.error || "লাইব্রেরি তথ্য লোড করতে ব্যর্থ।");
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগে ত্রুটি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherLibraryData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-500 shadow-sm">
        <RotateCw className="w-5 h-5 animate-spin mx-auto text-[#0D5C3A] mb-2" />
        উস্তাদ লাইব্রেরি রেকর্ড লোড হচ্ছে...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-xs text-red-800 shadow-sm">
        <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0D5C3A] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> শিক্ষক লাইব্রেরি পোর্টাল
          </span>
          <h2 className="text-lg font-bold text-gray-900 mt-1">আমার লাইব্রেরি কার্ড ও পঠিত কিতাব</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            মুহতারাম উস্তাদগণের জন্য মাদরাসা লাইব্রেরি থেকে গৃহীত কিতাব ও ফেরত তথ্যাবলী
          </p>
        </div>

        <button
          onClick={fetchTeacherLibraryData}
          className="text-xs font-semibold text-[#0D5C3A] hover:bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 self-start sm:self-auto flex items-center gap-1.5 transition"
        >
          <RotateCw className="w-3.5 h-3.5" /> রিফ্রেশ
        </button>
      </div>

      {/* Member Card Summary */}
      {data?.membership ? (
        <div className="bg-gradient-to-br from-[#083B25] to-[#0D5C3A] rounded-xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <User className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <span className="text-[11px] text-emerald-200 font-semibold tracking-wider uppercase">
                উস্তাদ লাইব্রেরি মেম্বারশিপ
              </span>
              <h3 className="font-bold text-base">{data.teacherName}</h3>
              <p className="font-mono text-xs text-emerald-100">কার্ড নং: {data.membership.memberNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-white/20 pt-3 sm:pt-0 sm:pl-5 text-xs">
            <div>
              <span className="text-[11px] text-emerald-200 block">বর্তমান ধার</span>
              <span className="font-bold text-lg">{data.membership.activeCount}টি কিতাব</span>
            </div>
            <div>
              <span className="text-[11px] text-emerald-200 block">সর্বোচ্চ সীমা</span>
              <span className="font-bold text-lg">{data.membership.maxBooks}টি কিতাব</span>
            </div>
            <div>
              <span className="text-[11px] text-emerald-200 block">স্ট্যাটাস</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-bold">
                {data.membership.status}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>আপনার অ্যাকাউন্টের বিপরীতে এখনও লাইব্রেরি মেম্বারশিপ কার্ড সক্রিয় করা হয়নি। লাইব্রেরি প্রশাসনের সাথে যোগাযোগ করুন।</span>
        </div>
      )}

      {/* Currently Borrowed Books */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-3">
          <Clock className="w-4 h-4 text-emerald-600" /> বর্তমানে গৃহীত কিতাবসমূহ (Active Loans)
        </h3>

        {data?.activeLoans && data.activeLoans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.activeLoans.map((loan: any) => (
              <div
                key={loan.id}
                className={`p-4 rounded-xl border transition ${
                  loan.isOverdue
                    ? "bg-red-50/50 border-red-200"
                    : "bg-gray-50/50 border-gray-200 hover:border-emerald-300"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {loan.categoryName}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm mt-1.5">{loan.bookTitle}</h4>
                    <p className="text-gray-500 text-xs">লেখক: {loan.authorName}</p>
                    <p className="text-gray-400 font-mono text-[11px] mt-0.5">একসেশন নং: {loan.accessionNo}</p>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      loan.isOverdue ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {loan.isOverdue ? "বিলম্বিত (Overdue)" : "ইস্যুকৃত"}
                  </span>
                </div>

                <div className="border-t border-gray-200/80 mt-3 pt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px]">নির্ধারিত ফেরত তারিখ:</span>
                    <span className={`font-bold ${loan.isOverdue ? "text-red-600" : "text-gray-800"}`}>
                      {new Date(loan.dueDate).toLocaleDateString("bn-BD")}
                    </span>
                  </div>

                  <div>
                    {loan.isOverdue ? (
                      <span className="text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded text-[11px]">
                        মেয়াদ উত্তীর্ণ
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold text-[11px]">
                        অবশিষ্ট: {loan.daysRemaining} দিন
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400 text-xs">বর্তমানে আপনার কাছে কোনো কিতাব ইস্যু করা নেই।</div>
        )}
      </div>

      {/* Borrowing & Return History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b pb-3">
          <BookOpen className="w-4 h-4 text-emerald-600" /> পূর্বে ফেরত দেওয়ার ইতিহাস (History)
        </h3>

        {data?.returnedHistory && data.returnedHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="py-2.5 px-3">ইস্যু নম্বর</th>
                  <th className="py-2.5 px-3">কিতাবের নাম</th>
                  <th className="py-2.5 px-3">ইস্যুর তারিখ</th>
                  <th className="py-2.5 px-3">ফেরতের তারিখ</th>
                  <th className="py-2.5 px-3">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {data.returnedHistory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/70">
                    <td className="py-2.5 px-3 font-mono font-medium">{item.issueNumber}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold block">{item.bookTitle}</span>
                      <span className="text-[11px] text-gray-400">{item.authorName}</span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">
                      {new Date(item.issueDate).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">
                      {item.returnDate ? new Date(item.returnDate).toLocaleDateString("bn-BD") : "N/A"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-gray-400 text-xs">কোনো পূর্ববর্তী কিতাব ফেরতের তথ্য পাওয়া যায়নি।</div>
        )}
      </div>

      {/* Privacy Isolation Notice */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>উস্তাদ তথ্য আইসোলেশন ও প্রাইভেসি প্রটেক্টেড</span>
      </div>
    </div>
  );
}
