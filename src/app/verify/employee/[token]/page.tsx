"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, ShieldCheck, Building, User, Calendar, Award } from "lucide-react";

export default function PublicEmployeeVerifyPage() {
  const params = useParams();
  const token = params?.token as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/public/hr/verify/${token}`);
        const result = await res.json();
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      verify();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F9F8F3] py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 space-y-6 text-center">
        {loading ? (
          <div className="py-12 space-y-3">
            <div className="w-12 h-12 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-gray-500 font-semibold">ডিজিটাল ভেরিফিকেশন তথ্য যাচাই করা হচ্ছে...</p>
          </div>
        ) : data?.isValid ? (
          <div className="space-y-6">
            <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-10 h-10 text-emerald-600" />
            </div>

            <div>
              <span className="text-[11px] font-bold tracking-widest text-[#C59B27] uppercase block">
                অফিশিয়াল ডিজিটাল প্রত্যয়ন
              </span>
              <h2 className="text-xl font-black text-[#083B25] mt-1">{data.institution?.nameBn}</h2>
              <p className="text-xs text-gray-500 font-sans">{data.institution?.nameEn}</p>
            </div>

            {data.verificationType === "EMPLOYEE_IDENTITY_CARD" && (
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 text-left space-y-3 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-gray-500">কর্মী পরিচয় নম্বর</span>
                  <span className="font-mono font-bold text-[#083B25]">{data.employee?.employeeId}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-gray-500">কর্মীর নাম</span>
                  <span className="font-bold text-gray-900">{data.employee?.nameBn}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-gray-500">পদবি</span>
                  <span className="font-semibold text-gray-800">{data.employee?.designation}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-gray-500">দপ্তর / বিভাগ</span>
                  <span className="font-semibold text-gray-800">{data.employee?.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">বর্তমান স্ট্যাটাস</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                    {data.employee?.status}
                  </span>
                </div>
              </div>
            )}

            {data.verificationType === "EMPLOYEE_OFFICIAL_DOCUMENT" && (
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 text-left space-y-3 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-gray-500">নথির শিরোনাম</span>
                  <span className="font-bold text-gray-900">{data.document?.title}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-gray-500">কর্মীর নাম</span>
                  <span className="font-bold text-gray-900">{data.employee?.nameBn}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-gray-500">পদবি</span>
                  <span className="font-semibold text-gray-800">{data.employee?.designation}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-gray-500">ইস্যুর তারিখ</span>
                  <span className="font-semibold text-gray-800">{data.document?.issueDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">ভেরিফিকেশন স্থিতি</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                    {data.document?.verificationStatus}
                  </span>
                </div>
              </div>
            )}

            <div className="text-[11px] text-gray-400">
              এই ডিজিটাল রেকর্ডটি প্রাতিষ্ঠানিক ডাটাবেজ দ্বারা সরাসরি যাচাইকৃত। গোপনীয় তথ্যের সুরক্ষার্থে বেতন ও ব্যক্তিগত তথ্য উন্মুক্ত নয়।
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex p-3 rounded-full bg-rose-100 text-rose-800">
              <XCircle className="w-10 h-10 text-rose-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">ভেরিফিকেশন পাওয়া যায়নি</h2>
            <p className="text-xs text-gray-500">
              প্রদত্ত কিউআর কোড বা ভেরিফিকেশন টোকেনটি সঠিক নয় অথবা প্রতিষ্ঠান কর্তৃক বাতিল করা হয়েছে।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
