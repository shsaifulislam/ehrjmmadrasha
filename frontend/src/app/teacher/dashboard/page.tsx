"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, FileSpreadsheet, Users, CalendarDays, Bell, CheckCircle2, Clock } from "lucide-react";
import api from "@/lib/axios";

import { useTeacherDashboard } from "@/hooks/useTeacherPortal";

export default function TeacherDashboardPage() {
  const { data: teacherData } = useTeacherDashboard();

  const stats = {
    assignedClassesCount: teacherData?.assignedClassesCount || 3,
    assignedStudentsCount: teacherData?.assignedStudentsCount || 45,
    todayAttendanceDone: teacherData?.todayAttendanceDone || false,
    pendingMarksExams: teacherData?.pendingMarksExams || 1,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-50">আসসালামু আলাইকুম, সম্মানিত শিক্ষক!</h1>
          <p className="text-emerald-200 text-sm mt-1">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা ডিজিটাল টিচার পোর্টাল</p>
        </div>
        <div className="flex gap-2">
          <Link href="/teacher/attendance">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
              <UserCheck className="mr-2 h-4 w-4" /> আজকের হাজিরা নিন
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">দায়িত্বপ্রাপ্ত জামায়াত</CardTitle>
            <Users className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.assignedClassesCount} টি</div>
            <p className="text-xs text-muted-foreground mt-1">নূরাণী, কিতাব ও হেফজ শাখা</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">মোট ছাত্র সংখ্যা</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.assignedStudentsCount} জন</div>
            <p className="text-xs text-muted-foreground mt-1">নিয়মিত শিক্ষার্থী</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">আজকের হাজিরা</CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-amber-700">পেন্ডিং রয়েছে</div>
            <p className="text-xs text-muted-foreground mt-1">দ্রুত হাজিরা সম্পন্ন করুন</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">নম্বর এন্ট্রি বাকি</CardTitle>
            <FileSpreadsheet className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.pendingMarksExams} টি পরীক্ষা</div>
            <p className="text-xs text-muted-foreground mt-1">অর্ধবার্ষিক মূল্যায়ন ২০২৬</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Buttons */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">দ্রুত অ্যাকশন</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/teacher/attendance" className="block">
            <Card className="hover:border-emerald-600 transition-all cursor-pointer h-full hover:shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">হাজিরা দিন</h3>
                  <p className="text-xs text-slate-500">দৈনিক ছাত্র হাজিরা</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/teacher/marks" className="block">
            <Card className="hover:border-blue-600 transition-all cursor-pointer h-full hover:shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-800 rounded-lg">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">নম্বর ইনপুট</h3>
                  <p className="text-xs text-slate-500">পরীক্ষার সাবজেক্ট মার্কস</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/teacher/students" className="block">
            <Card className="hover:border-purple-600 transition-all cursor-pointer h-full hover:shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-800 rounded-lg">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">ছাত্র তালিকা</h3>
                  <p className="text-xs text-slate-500">ক্লাস স্টুডেন্ট লিস্ট</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/teacher/routine" className="block">
            <Card className="hover:border-amber-600 transition-all cursor-pointer h-full hover:shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-800 rounded-lg">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">ক্লাস রুটিন</h3>
                  <p className="text-xs text-slate-500">দৈনিক ক্লাস সময়সূচী</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
