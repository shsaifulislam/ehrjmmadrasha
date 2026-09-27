"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  User,
  Users,
  BookOpen,
  Calendar,
  Award,
  DollarSign,
  FileText,
  ShieldCheck,
  Send,
  Bell,
  Search,
  CheckCircle,
  Printer,
  ChevronRight,
} from "lucide-react";
import GuardianAttendanceViewer from "@/components/attendance/GuardianAttendanceViewer";
import GuardianResultsViewer from "@/components/exams/GuardianResultsViewer";
import GuardianFinanceViewer from "@/components/finance/GuardianFinanceViewer";
import GuardianDocumentsViewer from "@/components/documents/GuardianDocumentsViewer";
import PortalNotificationsViewer from "@/components/communication/PortalNotificationsViewer";
import GuardianLibraryViewer from "@/components/library/GuardianLibraryViewer";

export default function StudentGuardianPortalPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [rollNumber, setRollNumber] = useState("1");
  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "DASHBOARD"
    | "CHILDREN"
    | "ACADEMIC"
    | "ATTENDANCE"
    | "RESULTS"
    | "FINANCE"
    | "DOCUMENTS"
    | "CERTIFICATES"
    | "REQUESTS"
    | "NOTIFICATIONS"
    | "LIBRARY"
  >("DASHBOARD");

  // Leave request state
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveDays, setLeaveDays] = useState("১");
  const [leaveSuccess, setLeaveSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        const upper = tabParam.toUpperCase();
        const validTabs = [
          "DASHBOARD",
          "CHILDREN",
          "ACADEMIC",
          "ATTENDANCE",
          "RESULTS",
          "FINANCE",
          "DOCUMENTS",
          "CERTIFICATES",
          "REQUESTS",
          "NOTIFICATIONS",
          "LIBRARY",
        ];
        if (validTabs.includes(upper)) {
          setActiveTab(upper as any);
        }
      }
    }

    fetch("/api/academic/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.classes) {
          setClasses(data.classes);
          if (data.classes.length > 0) {
            setSelectedClassId(data.classes[0].id);
            // Auto search first student for zero-friction experience
            fetchStudentData(data.classes[0].id, 1);
          }
        }
      })
      .catch(console.error);
  }, []);

  const fetchStudentData = async (classId: string, roll: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/students/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, rollNumber: roll }),
      });
      const data = await res.json();
      if (res.ok && data.student) {
        setStudent(data.student);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudentData(selectedClassId, Number(rollNumber));
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveSuccess(true);
    setLeaveReason("");
    setTimeout(() => setLeaveSuccess(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#083B25] to-[#0D5C3A] text-white py-8 px-4 border-b-4 border-[#C59B27]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="bg-[#C59B27]/20 text-amber-200 border border-[#C59B27]/40 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider inline-block mb-1.5">
              অভিভাবক ও শিক্ষার্থী পোর্টাল (জিরো-ফ্রিকশন)
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
              {student ? `${student.fullNameBn} এর স্টুডেন্ট পোর্টাল` : "শিক্ষার্থী ও অভিভাবক কর্নার"}
            </h1>
            <p className="text-xs text-emerald-200">
              কোনো পাসওয়ার্ড প্রয়োজন নেই • সরাসরি জামাত ও রোল দিয়ে যেকোনো সময় রেজাল্ট, হাজিরা ও ফি দেখুন
            </p>
          </div>

          {/* Quick Roll Switcher */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 bg-[#083B25]/80 p-2 rounded-xl border border-emerald-800">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-[#0D5C3A] text-white text-xs p-1.5 rounded outline-none border border-emerald-700"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nameBn}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="রোল"
              className="w-16 bg-[#0D5C3A] text-white text-xs p-1.5 rounded outline-none border border-emerald-700 font-mono text-center"
            />
            <button
              type="submit"
              className="bg-[#C59B27] hover:bg-amber-500 text-[#0B1914] px-3 py-1.5 rounded text-xs font-bold transition shadow"
            >
              খুঁজুন
            </button>
          </form>
        </div>
      </section>

      {/* Sub-Navigation (The 10 portal modules) */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 overflow-x-auto sticky top-[69px] z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-2 sm:gap-4 text-xs font-semibold whitespace-nowrap">
          {[
            { id: "DASHBOARD", label: "ড্যাশবোর্ড", icon: User },
            { id: "CHILDREN", label: "প্রোফাইল", icon: Users },
            { id: "ACADEMIC", label: "একাডেমিক", icon: BookOpen },
            { id: "ATTENDANCE", label: "হাজিরা", icon: Calendar },
            { id: "RESULTS", label: "ফলাফল", icon: Award },
            { id: "FINANCE", label: "ফি ও হিসাব", icon: DollarSign },
            { id: "DOCUMENTS", label: "নথিপত্র", icon: FileText },
            { id: "CERTIFICATES", label: "সনদপত্র", icon: ShieldCheck },
            { id: "LIBRARY", label: "লাইব্রেরি", icon: BookOpen },
            { id: "REQUESTS", label: "ছুটির আবেদন", icon: Send },
            { id: "NOTIFICATIONS", label: "নোটিফিকেশন", icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-2 border-b-2 flex items-center gap-1.5 transition ${
                  activeTab === tab.id
                    ? "border-[#0D5C3A] text-[#0D5C3A]"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {loading ? (
          <p className="text-center text-xs text-gray-500 py-16">তথ্য লোড হচ্ছে...</p>
        ) : !student ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8">
            <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">প্রদত্ত জামাত ও রোলে কোনো শিক্ষার্থী পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. DASHBOARD OVERVIEW */}
            {activeTab === "DASHBOARD" && (
              <div className="space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-[#0D5C3A]">
                    <span className="text-[11px] text-gray-500 font-semibold block">বর্তমান শ্রেণি ও রোল</span>
                    <span className="text-base font-bold text-gray-900 block mt-1">রোল {student.enrollment.rollNumber}</span>
                    <span className="text-[11px] text-emerald-700">{student.enrollment.className}</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-600">
                    <span className="text-[11px] text-gray-500 font-semibold block">উপস্থিতি হার</span>
                    <span className="text-base font-bold text-gray-900 block mt-1 font-mono">
                      {student.attendanceStats.percentage}%
                    </span>
                    <span className="text-[11px] text-blue-700">{student.attendanceStats.present} দিন উপস্থিত</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-[#C59B27]">
                    <span className="text-[11px] text-gray-500 font-semibold block">ফলাফল গ্রেড</span>
                    <span className="text-base font-bold text-amber-700 block mt-1">মুমতাজ (Mumtaz)</span>
                    <span className="text-[11px] text-gray-500">গড় নম্বর: ৯৩.৫</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-red-600">
                    <span className="text-[11px] text-gray-500 font-semibold block">বকেয়া ফি</span>
                    <span className="text-base font-bold text-red-700 block mt-1 font-mono">
                      ৳ {student.feeSummary.totalDue}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {student.feeSummary.totalDue === 0 ? "পরিশোধিত" : "পরিশোধযোগ্য"}
                    </span>
                  </div>
                </div>

                {/* Quick Profile Summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-[#0D5C3A] flex items-center justify-center font-bold text-lg text-[#0D5C3A]">
                      {student.fullNameBn.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">{student.fullNameBn}</h2>
                      <p className="text-xs text-gray-500 font-mono">আইডি: {student.studentIdNumber}</p>
                      <p className="text-xs text-gray-600 mt-0.5">অভিভাবক: {student.fatherNameBn} ({student.guardianPhone})</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("RESULTS")}
                    className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow flex items-center gap-1.5"
                  >
                    মার্কশিট দেখুন
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. CHILDREN / STUDENT PROFILE */}
            {activeTab === "CHILDREN" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-[#083B25] border-b pb-2">শিক্ষার্থীর ব্যক্তিগত পরিচিতি</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 block">পূর্ণ নাম (বাংলা):</span>
                    <span className="font-bold text-gray-900">{student.fullNameBn}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 block">পূর্ণ নাম (ইংরেজি):</span>
                    <span className="font-semibold text-gray-900">{student.fullNameEn}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 block">স্থায়ী ছাত্র আইডি:</span>
                    <span className="font-mono font-bold text-[#0D5C3A]">{student.studentIdNumber}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 block">আবাসিক অবস্থা:</span>
                    <span className="font-semibold text-gray-900">
                      {student.residentialStatus === "RESIDENTIAL" ? "আবাসিক (হোস্টেল)" : "অনাবাসিক"}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 block">পিতা / অভিভাবকের নাম:</span>
                    <span className="font-semibold text-gray-900">{student.fatherNameBn}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 block">অভিভাবকের মোবাইল:</span>
                    <span className="font-mono font-semibold text-gray-900">{student.guardianPhone}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg sm:col-span-2">
                    <span className="text-gray-500 block">বর্তমান ও স্থায়ী ঠিকানা:</span>
                    <span className="text-gray-800">{student.presentAddress}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ACADEMIC */}
            {activeTab === "ACADEMIC" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-[#083B25] border-b pb-2">একাডেমিক তথ্য ও বিষয়সূচি</h2>
                <div className="space-y-3 text-xs">
                  <p className="text-gray-600">
                    শিক্ষার্থী বর্তমানে <strong>{student.enrollment.className}</strong>-এ অধ্যয়নরত।
                  </p>
                  <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                    <div className="p-3 bg-gray-50 font-bold flex justify-between">
                      <span>অধ্যয়নকৃত বিষয়</span>
                      <span>শ্রেণি শিক্ষক</span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span>কুরআন মাজীদ ও তাজবীদ</span>
                      <span>মাওলানা আব্দুল কাইয়ুম</span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span>হিফজ ও সবক তদারকি</span>
                      <span>হাফেজ কারী মো. ইসমাইল</span>
                    </div>
                    <div className="p-3 flex justify-between">
                      <span>মৌলিক দীনিয়াত ও আকাইদ</span>
                      <span>মুফতি মাওলানা মো. ইউসুফ</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ATTENDANCE */}
            {activeTab === "ATTENDANCE" && <GuardianAttendanceViewer initialStudentId={student?.id} />}

            {/* 5. RESULTS */}
            {activeTab === "RESULTS" && <GuardianResultsViewer initialStudentId={student?.id} />}

            {/* 6. FINANCE */}
            {activeTab === "FINANCE" && <GuardianFinanceViewer />}

            {/* 7 & 8. DOCUMENTS & CERTIFICATES */}
            {(activeTab === "DOCUMENTS" || activeTab === "CERTIFICATES") && (
              <GuardianDocumentsViewer />
            )}


            {/* 9. REQUESTS */}
            {activeTab === "REQUESTS" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-[#083B25] border-b pb-2">ছুটি বা ছাড়পত্রের অনলাইন আবেদন</h2>

                {leaveSuccess && (
                  <div className="p-3 rounded bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                    ছুটির আবেদন মাদরাসা কর্তৃপক্ষের নিকট সফলভাবে পাঠানো হয়েছে।
                  </div>
                )}

                <form onSubmit={handleLeaveSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">ছুটির দিন সংখ্যা</label>
                    <select
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="১">১ দিন</option>
                      <option value="২">২ দিন</option>
                      <option value="৩">৩ দিন</option>
                      <option value="৫">৫ দিন বা তদূর্ধ্ব</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">ছুটির কারণ ও বিবরণ *</label>
                    <textarea
                      required
                      rows={3}
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="অসুস্থতা বা পারিবারিক জরুরি প্রয়োজনে ছুটির বিবরণ লিখুন..."
                      className="w-full p-2 border rounded outline-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded font-semibold transition shadow"
                  >
                    আবেদন দাখিল করুন
                  </button>
                </form>
              </div>
            )}

            {/* 10. NOTIFICATIONS */}
            {activeTab === "NOTIFICATIONS" && <PortalNotificationsViewer />}

            {/* 11. LIBRARY */}
            {activeTab === "LIBRARY" && <GuardianLibraryViewer defaultStudentId={student?.id} />}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
