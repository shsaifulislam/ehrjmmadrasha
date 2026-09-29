"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  UserX,
  Clock,
  Calendar,
  CheckSquare,
  Save,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Award,
  ListTodo,
  FileSpreadsheet,
  FileText,
  Bell,
  User,
  Send,
  Building,
  Boxes,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";
import TeacherAttendanceManager from "@/components/attendance/TeacherAttendanceManager";
import TeacherMarksEntry from "@/components/exams/TeacherMarksEntry";
import PortalNotificationsViewer from "@/components/communication/PortalNotificationsViewer";
import TeacherLibraryViewer from "@/components/library/TeacherLibraryViewer";
import TeacherHostelViewer from "@/components/hostel/TeacherHostelViewer";
import TeacherInventoryViewer from "@/components/inventory/TeacherInventoryViewer";
import TeacherRoutineViewer from "@/components/calendar/TeacherRoutineViewer";

interface StudentAttendanceItem {
  id: string;
  roll: number;
  name: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  marks?: number;
}

export default function TeacherPanelPage() {
  const [activeTab, setActiveTab] = useState<
    | "DASHBOARD"
    | "CLASSES"
    | "ATTENDANCE"
    | "RESULTS"
    | "ROUTINE"
    | "EXAM"
    | "NOTES"
    | "NOTICES"
    | "PROFILE"
    | "LEAVE"
    | "LIBRARY"
    | "HOSTEL"
    | "INVENTORY"
  >("DASHBOARD");

  const [selectedClass, setSelectedClass] = useState("নূরানী ও নাযেরা বিভাগ");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resultsSuccess, setResultsSuccess] = useState(false);
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);
  const [teacherAnalytics, setTeacherAnalytics] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/teacher/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) setTeacherAnalytics(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        const upper = tabParam.toUpperCase();
        const validTabs = [
          "DASHBOARD",
          "CLASSES",
          "ATTENDANCE",
          "RESULTS",
          "ROUTINE",
          "EXAM",
          "NOTES",
          "NOTICES",
          "PROFILE",
          "LEAVE",
          "LIBRARY",
          "HOSTEL",
          "INVENTORY",
        ];
        if (validTabs.includes(upper)) {
          setActiveTab(upper as any);
        }
      }
    }
  }, []);

  // Student Attendance & Marks state
  const [students, setStudents] = useState<StudentAttendanceItem[]>([
    { id: "1", roll: 1, name: "মুহাম্মদ আব্দুল্লাহ আল মামুন", status: "PRESENT", marks: 95 },
    { id: "2", roll: 2, name: "মুহাম্মদ আব্দুর রহমান", status: "PRESENT", marks: 92 },
    { id: "3", roll: 3, name: "আহমাদ বিন জুবায়ের", status: "PRESENT", marks: 88 },
    { id: "4", roll: 4, name: "মুহাম্মদ উসমান গণি", status: "ABSENT", marks: 78 },
    { id: "5", roll: 5, name: "মুহাম্মদ হাসান", status: "PRESENT", marks: 91 },
    { id: "6", roll: 6, name: "ইব্রাহীম খলিল", status: "LATE", marks: 84 },
  ]);

  const handleStatusChange = (id: string, status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE") => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleMarksChange = (id: string, marks: number) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, marks } : s)));
  };

  const handleAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "PRESENT" })));
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveResults = (e: React.FormEvent) => {
    e.preventDefault();
    setResultsSuccess(true);
    setTimeout(() => setResultsSuccess(false), 3000);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const presentCount = students.filter((s) => s.status === "PRESENT").length;
  const absentCount = students.filter((s) => s.status === "ABSENT").length;
  const lateCount = students.filter((s) => s.status === "LATE").length;

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col text-[#0B1914]">
      {/* Top Header */}
      <header className="bg-[#083B25] text-white px-6 py-4 border-b-2 border-[#C59B27] flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C59B27] text-[#083B25] font-arabic font-bold flex items-center justify-center text-sm shadow">
            أستاذ
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg font-display leading-tight">
              উস্তাদ অ্যাকাডেমিক প্যানেল (Teacher Portal)
            </h1>
            <p className="text-xs text-emerald-200">
              {INSTITUTION_INFO.nameBn} • শিক্ষক ও পাঠদান ব্যবস্থাপনা
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-emerald-200 hover:text-white px-2 py-1 rounded transition hidden sm:inline"
          >
            মূল সাইট
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition shadow"
          >
            <LogOut className="w-3.5 h-3.5" />
            লগআউট
          </button>
        </div>
      </header>

      {/* Navigation Sub-Tabs (The 10 requested Teacher Panel modules) */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 overflow-x-auto sticky top-[73px] z-20 shadow-sm">
        <div className="flex items-center gap-4 text-xs font-semibold whitespace-nowrap">
          {[
            { id: "DASHBOARD", label: "ড্যাশবোর্ড (Dashboard)", icon: LayoutDashboard },
            { id: "CLASSES", label: "আমার ক্লাস (My Classes)", icon: BookOpen },
            { id: "ATTENDANCE", label: "ডিজিটাল হাজিরা (Attendance)", icon: Calendar },
            { id: "RESULTS", label: "নম্বর এন্ট্রি (Results)", icon: Award },
            { id: "ROUTINE", label: "ক্লাস রুটিন (Routine)", icon: Clock },
            { id: "EXAM", label: "পরীক্ষা (Exam)", icon: FileSpreadsheet },
            { id: "NOTES", label: "অ্যাকাডেমিক নোট (Notes)", icon: FileText },
            { id: "NOTICES", label: "নোটিশ (Notices)", icon: Bell },
            { id: "PROFILE", label: "প্রোফাইল (My Profile)", icon: User },
            { id: "LIBRARY", label: "লাইব্রেরি (Library)", icon: BookOpen },
            { id: "HOSTEL", label: "হোস্টেল ও আবাসন (Hostel)", icon: Building },
            { id: "INVENTORY", label: "সরঞ্জাম ও সম্পদ (Assets)", icon: Boxes },
            { id: "LEAVE", label: "ছুটির আবেদন (Leave)", icon: Send },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 transition ${
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

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* 1. DASHBOARD */}
        {activeTab === "DASHBOARD" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-[#0D5C3A]">
                <span className="text-xs text-gray-500 font-semibold block">অ্যাসাইনকৃত ক্লাস ও শাখা</span>
                <span className="text-xl font-bold text-gray-900 block mt-1">
                  {teacherAnalytics ? `${teacherAnalytics.totalAssignments} টি` : "২ টি"}
                </span>
                <span className="text-[11px] text-emerald-700">
                  {teacherAnalytics ? `মোট ছাত্র: ${teacherAnalytics.assignedStudentsCount} জন` : "নূরানী ও নাযেরা অনুষদ"}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-600">
                <span className="text-xs text-gray-500 font-semibold block">আজকের উপস্থিতি হার</span>
                <span className="text-xl font-bold text-blue-700 block mt-1">
                  {teacherAnalytics ? `${teacherAnalytics.todayAttendance.rate}%` : `${presentCount} জন`}
                </span>
                <span className="text-[11px] text-gray-500">
                  {teacherAnalytics
                    ? `উপস্থিত: ${teacherAnalytics.todayAttendance.present}, অনুপস্থিত: ${teacherAnalytics.todayAttendance.absent}`
                    : `অনুপস্থিত: ${absentCount} জন`}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-[#C59B27]">
                <span className="text-xs text-gray-500 font-semibold block">পরীক্ষার বিষয়</span>
                <span className="text-xl font-bold text-amber-700 block mt-1">কুরআন ও তাজবীদ</span>
                <span className="text-[11px] text-gray-500">প্রথম সাময়িক ২০২৬</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-purple-600">
                <span className="text-xs text-gray-500 font-semibold block">শিক্ষক স্ট্যাটাস</span>
                <span className="text-xl font-bold text-purple-700 block mt-1">সক্রিয়</span>
                <span className="text-[11px] text-gray-500">অন-ডিউটি</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-[#083B25]">আজকের দ্রুত কার্যক্রম</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab("ATTENDANCE")}
                  className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  আজকের হাজিরা গ্রহণ করুন
                </button>
                <button
                  onClick={() => setActiveTab("RESULTS")}
                  className="bg-[#C59B27] hover:bg-amber-600 text-[#083B25] px-4 py-2 rounded-lg text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  পরীক্ষার নম্বর এন্ট্রি
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. MY CLASSES */}
        {activeTab === "CLASSES" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#083B25] border-b pb-2">আমার অধীনস্থ ক্লাস ও অনুষদ</h2>
            <div className="space-y-3 text-xs">
              <div className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">নূরানী ও নাযেরা বিভাগ (শাখা ক)</h3>
                  <p className="text-gray-500">ছাত্র সংখ্যা: ৩০ জন • বিষয়: কুরআন মাজীদ, মাখরাজ ও তাজবীদ</p>
                </div>
                <button onClick={() => setActiveTab("ATTENDANCE")} className="text-[#0D5C3A] font-bold">
                  হাজিরা নিন →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. ATTENDANCE */}
        {activeTab === "ATTENDANCE" && <TeacherAttendanceManager />}

        {/* 4. RESULTS */}
        {activeTab === "RESULTS" && <TeacherMarksEntry />}

        {/* 5. ROUTINE */}
        {activeTab === "ROUTINE" && <TeacherRoutineViewer />}

        {/* 6. EXAM */}
        {activeTab === "EXAM" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#083B25] border-b pb-2">আসন্ন পরীক্ষা সময়সূচি</h2>
            <p>প্রথম সাময়িক পরীক্ষা ২০২৬: এপ্রিলের প্রথম সপ্তাহ থেকে শুরু হবে।</p>
          </div>
        )}

        {/* 7. ACADEMIC NOTES */}
        {activeTab === "NOTES" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#083B25] border-b pb-2">অ্যাকাডেমিক লেকচার নোট ও তাফসীর পয়েন্ট</h2>
            <textarea
              rows={4}
              placeholder="শিক্ষার্থীদের জন্য পাঠ্য নোট লিখুন..."
              className="w-full p-2 border rounded"
            ></textarea>
            <button className="bg-[#0D5C3A] text-white px-3 py-1.5 rounded font-semibold">নোট সংরক্ষণ</button>
          </div>
        )}

        {/* 8. NOTICES */}
        {activeTab === "NOTICES" && <PortalNotificationsViewer />}

        {/* 9. MY PROFILE */}
        {activeTab === "PROFILE" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#083B25] border-b pb-2">আমার শিক্ষক প্রোফাইল</h2>
            <p><strong>পদবি:</strong> উস্তাদ ও বিভাগীয় শিক্ষক</p>
            <p><strong>প্রতিষ্ঠান:</strong> {INSTITUTION_INFO.nameBn}</p>
          </div>
        )}

        {/* 10. LEAVE */}
        {activeTab === "LEAVE" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#083B25] border-b pb-2">মুহতামিম বরাবর ছুটির আবেদন</h2>
            {leaveSubmitted && (
              <div className="p-3 bg-green-50 text-green-800 rounded">
                আপনার ছুটির আবেদন মুহতামিম মহোদয়ের কাছে পৌঁছেছে।
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setLeaveSubmitted(true);
                setTimeout(() => setLeaveSubmitted(false), 4000);
              }}
              className="space-y-3"
            >
              <textarea
                required
                rows={3}
                placeholder="ছুটির কারণ ও দিন সংখ্যা লিখুন..."
                className="w-full p-2 border rounded"
              ></textarea>
              <button type="submit" className="bg-[#0D5C3A] text-white px-4 py-2 rounded font-semibold">
                আবেদন দাখিল করুন
              </button>
            </form>
          </div>
        )}

        {/* 11. LIBRARY */}
        {activeTab === "LIBRARY" && <TeacherLibraryViewer />}

        {/* 12. HOSTEL */}
        {activeTab === "HOSTEL" && <TeacherHostelViewer />}

        {/* 13. INVENTORY */}
        {activeTab === "INVENTORY" && <TeacherInventoryViewer />}
      </main>
    </div>
  );
}
