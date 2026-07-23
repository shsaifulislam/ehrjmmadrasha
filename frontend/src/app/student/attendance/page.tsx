"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function StudentAttendancePage() {
  const attendanceSummary = {
    totalClasses: 120,
    presentDays: 115,
    absentDays: 3,
    lateDays: 2,
    percentage: 96,
  };

  const recentHistory = [
    { date: "২০২৬-০৭-২২", status: "PRESENT", note: "উপস্থিত" },
    { date: "২০২৬-০৭-২১", status: "PRESENT", note: "উপস্থিত" },
    { date: "২০২৬-০৭-২০", status: "PRESENT", note: "উপস্থিত" },
    { date: "২০২৬-০৭-১৯", status: "LATE", note: "বিলম্ব (১০ মিনিট)" },
    { date: "২০২৬-০৭-১৮", status: "ABSENT", note: "অনুপস্থিত" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-teal-600" /> আমার উপস্থিতি রেকর্ড
        </h1>
        <p className="text-xs text-slate-500 mt-1">সেশন ২০২৬ - দৈনিক ক্লাসের হাজিরা হিসেব</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-600 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 font-medium">উপস্থিতি পার্সেন্টেজ</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{attendanceSummary.percentage}%</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-600 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 font-medium">মোট উপস্থিত দিন</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{attendanceSummary.presentDays} দিন</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-600 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 font-medium">অনুপস্থিত দিন</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{attendanceSummary.absentDays} দিন</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 font-medium">বিলম্ব দিন</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{attendanceSummary.lateDays} দিন</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent History Card */}
      <Card className="shadow-sm border-t-4 border-t-teal-600">
        <CardHeader className="bg-slate-50/50 border-b pb-3">
          <CardTitle className="text-md font-bold text-slate-800">সাম্প্রতিক উপস্থিতি ইতিহাস</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {recentHistory.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50">
              <div className="flex items-center gap-3">
                {item.status === "PRESENT" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                {item.status === "ABSENT" && <XCircle className="h-5 w-5 text-rose-600" />}
                {item.status === "LATE" && <Clock className="h-5 w-5 text-amber-500" />}
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.date}</p>
                  <p className="text-xs text-slate-500">{item.note}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                item.status === "PRESENT" ? "bg-emerald-100 text-emerald-800" :
                item.status === "ABSENT" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
              }`}>
                {item.status === "PRESENT" ? "উপস্থিত" : item.status === "ABSENT" ? "অনুপস্থিত" : "বিলম্ব"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
