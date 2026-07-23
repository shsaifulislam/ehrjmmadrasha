"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, GraduationCap, Receipt, Contact, Bell, CheckCircle2, AlertCircle } from "lucide-react";

export default function StudentDashboardPage() {
  const student = {
    nameBn: "মুহাম্মদ আব্দুল্লাহ",
    roll: 1,
    studentId: "EHRJ-2026-001",
    class: "দাওরায়ে হাদীস (Dawra-e-Hadith)",
    department: "কিতাব বিভাগ",
    attendanceRate: 96,
    latestGpa: "5.00 (A+)",
    dueAmount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-950 text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-teal-50">স্বাগতম, {student.nameBn}!</h1>
          <p className="text-teal-200 text-sm mt-1">আইডি: <span className="font-mono">{student.studentId}</span> | জামায়াত: {student.class}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/student/id-card">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
              <Contact className="mr-2 h-4 w-4" /> আইডি কার্ড দেখুন
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">উপস্থিতি হার</CardTitle>
            <UserCheck className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{student.attendanceRate}%</div>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> চমৎকার উপস্থিতি রেটিং
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">সাম্প্রতিক রেজাল্ট</CardTitle>
            <GraduationCap className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{student.latestGpa}</div>
            <p className="text-xs text-muted-foreground mt-1">অর্ধবার্ষিক পরীক্ষা ২০২৬</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">বকেয়া ফি</CardTitle>
            <Receipt className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">৳ {student.dueAmount}</div>
            <p className="text-xs text-emerald-600 mt-1 font-semibold">কোনো বকেয়া নেই</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">রোল নম্বর</CardTitle>
            <Contact className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{student.roll}</div>
            <p className="text-xs text-muted-foreground mt-1">সেশন ২০২৬</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">আমার মেনু</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/student/profile" className="block">
            <Card className="hover:border-teal-600 transition-all cursor-pointer h-full hover:shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-teal-100 text-teal-800 rounded-lg">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">প্রোফাইল</h3>
                  <p className="text-xs text-slate-500">আমার ব্যক্তিগত তথ্য</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/student/results" className="block">
            <Card className="hover:border-blue-600 transition-all cursor-pointer h-full hover:shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-800 rounded-lg">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">পরীক্ষার ফলাফল</h3>
                  <p className="text-xs text-slate-500">রেজাল্ট ও মার্কশিট</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/student/fees" className="block">
            <Card className="hover:border-emerald-600 transition-all cursor-pointer h-full hover:shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">ফি ও রসিদ</h3>
                  <p className="text-xs text-slate-500">টাকা জমার রসিদ সমূহ</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/student/id-card" className="block">
            <Card className="hover:border-amber-600 transition-all cursor-pointer h-full hover:shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-800 rounded-lg">
                  <Contact className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">আইডি কার্ড</h3>
                  <p className="text-xs text-slate-500">প্রিন্টযোগ্য ডিজিটাল পরিচয়পত্র</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
