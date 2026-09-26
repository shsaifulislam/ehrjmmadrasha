"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GraduationCap, CheckCircle2, AlertCircle, ArrowLeft, Printer } from "lucide-react";

interface JamatClass {
  id: string;
  nameBn: string;
  nameEn: string;
  code: string;
}

export default function AdmissionPage() {
  const [classes, setClasses] = useState<JamatClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    applicationNumber: string;
    message: string;
    duplicateWarning?: string;
  } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    studentNameBn: "",
    studentNameEn: "",
    dateOfBirth: "",
    gender: "MALE",
    desiredClassId: "",
    desiredResidentialStatus: "NON_RESIDENTIAL",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    address: "",
    isOrphan: false,
    financialAssistanceRequested: false,
  });

  useEffect(() => {
    fetch("/api/academic/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.classes) {
          setClasses(data.classes);
          if (data.classes.length > 0) {
            setFormData((prev) => ({ ...prev, desiredClassId: data.classes[0].id }));
          }
        }
        setLoadingClasses(false);
      })
      .catch(() => setLoadingClasses(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admissions/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "আবেদন জমাদান ব্যর্থ হয়েছে।");
        setSubmitting(false);
        return;
      }

      setSuccessData({
        applicationNumber: data.applicationNumber,
        message: data.message,
        duplicateWarning: data.duplicateWarning,
      });
      setSubmitting(false);
    } catch {
      setError("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F8F3]">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full py-10 px-4">
        {successData ? (
          /* Success Receipt Card */
          <div className="bg-white rounded-xl border-2 border-[#0D5C3A] p-8 shadow-xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0D5C3A] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h1 className="text-2xl font-bold text-[#0B1914] mb-2 font-display">
              ভর্তি আবেদন সফলভাবে সম্পন্ন হয়েছে!
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mb-6">{successData.message}</p>

            {successData.duplicateWarning && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded text-xs mb-6">
                {successData.duplicateWarning}
              </div>
            )}

            <div className="bg-[#F9F8F3] border border-[#E2E8F0] p-6 rounded-lg max-w-md mx-auto mb-8 text-left">
              <div className="border-b border-gray-200 pb-3 mb-3">
                <span className="text-xs text-gray-500 font-semibold block">আবেদন ট্র্যাকিং নম্বর (Application No):</span>
                <span className="font-mono text-xl font-bold text-[#0D5C3A]">
                  {successData.applicationNumber}
                </span>
              </div>
              <div className="text-xs space-y-1.5 text-gray-700">
                <p>শিক্ষার্থীর নাম: <span className="font-semibold text-gray-900">{formData.studentNameBn}</span></p>
                <p>অভিভাবকের নাম: <span className="font-semibold text-gray-900">{formData.guardianName}</span></p>
                <p>মোবাইল নম্বর: <span className="font-mono font-semibold text-gray-900">{formData.guardianPhone}</span></p>
                <p>আবেদনের তারিখ: <span className="font-semibold text-gray-900">{new Date().toLocaleDateString("bn-BD")}</span></p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-[#0D5C3A] hover:bg-[#158052] text-white px-5 py-2.5 rounded-md font-semibold text-sm transition shadow"
              >
                <Printer className="w-4 h-4" />
                রিসিপ্ট প্রিন্ট করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccessData(null);
                  setFormData({
                    studentNameBn: "",
                    studentNameEn: "",
                    dateOfBirth: "",
                    gender: "MALE",
                    desiredClassId: classes[0]?.id || "",
                    desiredResidentialStatus: "NON_RESIDENTIAL",
                    guardianName: "",
                    guardianPhone: "",
                    guardianEmail: "",
                    address: "",
                    isOrphan: false,
                    financialAssistanceRequested: false,
                  });
                }}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-100 px-5 py-2.5 rounded-md font-semibold text-sm transition"
              >
                নতুন আরেকটি আবেদন করুন
              </button>
            </div>
          </div>
        ) : (
          /* Admission Application Form */
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-md overflow-hidden">
            <div className="bg-[#0D5C3A] text-white p-6 border-b-2 border-[#C59B27]">
              <div className="flex items-center gap-2 text-[#C59B27] text-xs font-semibold uppercase tracking-wider mb-1">
                <GraduationCap className="w-4 h-4" />
                ভর্তি সেশন ২০২৫-২০২৬
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-display">
                অনলাইন ছাত্র ভর্তি আবেদন ফরম
              </h1>
              <p className="text-xs text-emerald-200 mt-1">
                ইলিয়টগঞ্জ হাজী রহমত উল্লাহ জামিয়া মাদ্রাসা (নূরানী, হিফজ ও কিতাব বিভাগ)
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Student Personal Information */}
              <div>
                <h2 className="text-sm font-bold text-[#0D5C3A] pb-2 border-b border-gray-200 mb-4">
                  ১. শিক্ষার্থীর ব্যক্তিগত তথ্য
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      শিক্ষার্থীর পূর্ণ নাম (বাংলায়) *
                    </label>
                    <input
                      type="text"
                      required
                      name="studentNameBn"
                      value={formData.studentNameBn}
                      onChange={handleChange}
                      placeholder="যেমন: মোঃ আব্দুল্লাহ আল মামুন"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D5C3A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Full Name in English (Capital)
                    </label>
                    <input
                      type="text"
                      name="studentNameEn"
                      value={formData.studentNameEn}
                      onChange={handleChange}
                      placeholder="e.g. MD ABDULLAH AL MAMUN"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D5C3A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      জন্ম তারিখ *
                    </label>
                    <input
                      type="date"
                      required
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D5C3A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      লিঙ্গ (Gender) *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D5C3A] focus:outline-none"
                    >
                      <option value="MALE">ছাত্র (Boy)</option>
                      <option value="FEMALE">ছাত্রী (Girl)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Desired Class & Residential Status */}
              <div>
                <h2 className="text-sm font-bold text-[#0D5C3A] pb-2 border-b border-gray-200 mb-4">
                  ২. ভর্তিচ্ছু জামাত ও আবাসন ব্যবস্থা
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ভর্তিচ্ছু জামাত / শ্রেণি *
                    </label>
                    {loadingClasses ? (
                      <div className="text-xs text-gray-500 py-2">লোড হচ্ছে...</div>
                    ) : (
                      <select
                        required
                        name="desiredClassId"
                        value={formData.desiredClassId}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D5C3A] focus:outline-none"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nameBn} ({c.nameEn})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      আবাসন ধরন *
                    </label>
                    <select
                      name="desiredResidentialStatus"
                      value={formData.desiredResidentialStatus}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D5C3A] focus:outline-none"
                    >
                      <option value="NON_RESIDENTIAL">অনাবাসিক (Non-Residential / ডে-কেয়ার)</option>
                      <option value="RESIDENTIAL">আবাসিক (Residential / বোর্ডিং)</option>
                      <option value="DAY_CARE">ডে কেয়ার (Day Care - সকাল থেকে সন্ধ্যা)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Guardian Details */}
              <div>
                <h2 className="text-sm font-bold text-[#0D5C3A] pb-2 border-b border-gray-200 mb-4">
                  ৩. অভিভাবকের বিবরণ ও যোগাযোগ
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      পিতা / অভিভাবকের নাম *
                    </label>
                    <input
                      type="text"
                      required
                      name="guardianName"
                      value={formData.guardianName}
                      onChange={handleChange}
                      placeholder="অভিভাবকের পূর্ণ নাম"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D5C3A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      সক্রিয় মোবাইল নম্বর *
                    </label>
                    <input
                      type="tel"
                      required
                      name="guardianPhone"
                      value={formData.guardianPhone}
                      onChange={handleChange}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D5C3A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ইমেইল (যদি থাকে)
                    </label>
                    <input
                      type="email"
                      name="guardianEmail"
                      value={formData.guardianEmail}
                      onChange={handleChange}
                      placeholder="example@gmail.com"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D5C3A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      বর্তমান ঠিকানা *
                    </label>
                    <input
                      type="text"
                      required
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D5C3A] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Special Welfare & Assistance Check */}
              <div className="bg-[#F9F8F3] p-4 rounded-lg border border-[#E2E8F0] space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isOrphan"
                    checked={formData.isOrphan}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#0D5C3A] rounded border-gray-300 focus:ring-[#0D5C3A] mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-800">শিক্ষার্থী এতিম (পিতৃহীন)</span>
                    <p className="text-[11px] text-gray-500">
                      লিল্লাহ বোর্ডিং ও ফ্রি স্পনসরশিপের জন্য এতিম সনদ যাচাই করা হবে।
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="financialAssistanceRequested"
                    checked={formData.financialAssistanceRequested}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#0D5C3A] rounded border-gray-300 focus:ring-[#0D5C3A] mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-800">আর্থিক অসচ্ছলতার জন্য সহায়তা আবেদন</span>
                    <p className="text-[11px] text-gray-500">
                      ভর্তি নিশ্চিত হওয়ার পর অভিভাবক পোর্টাল থেকে বিস্তারিত তথ্য পর্যালোচনা সাপেক্ষে ওয়েভার বিবেচনা করা হবে।
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0D5C3A] hover:bg-[#158052] text-white py-3 rounded-md font-bold text-sm sm:text-base shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? "আবেদন জমা হচ্ছে..." : "ভর্তি আবেদন জমা দিন (Submit Application)"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
