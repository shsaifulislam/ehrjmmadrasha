"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart2,
  Calendar,
  CheckSquare,
  ArrowLeft,
  Loader2,
  Users,
  AlertCircle,
  Clock,
  Search,
  FileSpreadsheet,
} from "lucide-react";
import { useClasses } from "@/hooks/useAcademic";
import { useDailyAttendanceReport, useMonthlyAttendanceReport } from "@/hooks/useAttendance";

export default function AttendanceReportPage() {
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: classes } = useClasses();

  // Set default class if available
  if (classes && classes.length > 0 && !selectedClassId) {
    setSelectedClassId(classes[0].id);
  }

  const { data: dailyReport, isLoading: loadingDaily } = useDailyAttendanceReport(
    selectedClassId,
    selectedDate
  );

  const { data: monthlyReport, isLoading: loadingMonthly } = useMonthlyAttendanceReport(
    selectedClassId,
    selectedYear,
    selectedMonth
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            উপস্থিতি রিপোর্ট ও বিবরণী
          </h1>
          <p className="text-muted-foreground">দৈনিক ও মাসিক উপস্থিতি বিশ্লেষণ করুন</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/attendance">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              উপস্থিতি গ্রহণ পাতায় ফিরে যান
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-4">
        <button
          onClick={() => setActiveTab("daily")}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "daily"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="h-4 w-4" />
          দৈনিক রিপোর্ট (Daily Report)
        </button>
        <button
          onClick={() => setActiveTab("monthly")}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "monthly"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          মাসিক বিবরণী (Monthly Summary)
        </button>
      </div>

      {/* Controls & Filters */}
      <Card>
        <CardContent className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">শ্রেণী *</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background font-medium"
            >
              <option value="">শ্রেণী নির্বাচন করুন</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {activeTab === "daily" ? (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">তারিখ *</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">মাস *</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  {[
                    { val: 1, name: "জানুয়ারি" },
                    { val: 2, name: "ফেব্রুয়ারি" },
                    { val: 3, name: "মার্চ" },
                    { val: 4, name: "এপ্রিল" },
                    { val: 5, name: "মে" },
                    { val: 6, name: "জুন" },
                    { val: 7, name: "জুলাই" },
                    { val: 8, name: "আগস্ট" },
                    { val: 9, name: "সেপ্টেম্বর" },
                    { val: 10, name: "অক্টোবর" },
                    { val: 11, name: "নভেম্বর" },
                    { val: 12, name: "ডিসেম্বর" },
                  ].map((m) => (
                    <option key={m.val} value={m.val}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">বছর *</label>
                <Input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">অনুসন্ধান</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="রোল বা নাম..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Report Tab Content */}
      {activeTab === "daily" && (
        <div className="space-y-6">
          {loadingDaily ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !dailyReport ? (
            <div className="text-center py-20">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">কোনো রিপোর্ট পাওয়া যায়নি</p>
            </div>
          ) : (
            <>
              {/* Daily Summary Cards */}
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
                <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">মোট ছাত্র</p>
                    <p className="text-xl font-bold text-blue-600">
                      {dailyReport.summary.totalStudents.toLocaleString("bn-BD")}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">উপস্থিত</p>
                    <p className="text-xl font-bold text-emerald-600">
                      {dailyReport.summary.presentCount.toLocaleString("bn-BD")}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">অনুপস্থিত</p>
                    <p className="text-xl font-bold text-rose-600">
                      {dailyReport.summary.absentCount.toLocaleString("bn-BD")}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">ছুটি</p>
                    <p className="text-xl font-bold text-amber-600">
                      {dailyReport.summary.leaveCount.toLocaleString("bn-BD")}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 col-span-2 lg:col-span-1">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">উপস্থিতির হার</p>
                    <p className="text-xl font-bold text-purple-600">{dailyReport.summary.percentage}%</p>
                  </CardContent>
                </Card>
              </div>

              {/* Absent & Leave Lists */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Absent Students List */}
                <Card className="border-rose-200 dark:border-rose-900">
                  <CardHeader className="py-3 bg-rose-50/40 dark:bg-rose-950/20">
                    <CardTitle className="text-base text-rose-700 dark:text-rose-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      অনুপস্থিত ছাত্র তালিকা ({dailyReport.absentStudents.length.toLocaleString("bn-BD")})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {!dailyReport.absentStudents.length ? (
                      <p className="text-center py-6 text-xs text-muted-foreground">আজ কেউ অনুপস্থিত নেই!</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">রোল</TableHead>
                            <TableHead>নাম</TableHead>
                            <TableHead className="text-right">আইডি</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailyReport.absentStudents.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell className="font-bold">{s.roll.toLocaleString("bn-BD")}</TableCell>
                              <TableCell className="font-medium text-rose-600">{s.nameBn}</TableCell>
                              <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                {s.studentId}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Leave Students List */}
                <Card className="border-amber-200 dark:border-amber-900">
                  <CardHeader className="py-3 bg-amber-50/40 dark:bg-amber-950/20">
                    <CardTitle className="text-base text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      ছুটিতে থাকা ছাত্র তালিকা ({dailyReport.leaveStudents.length.toLocaleString("bn-BD")})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {!dailyReport.leaveStudents.length ? (
                      <p className="text-center py-6 text-xs text-muted-foreground">আজ কেউ ছুটিতে নেই</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">রোল</TableHead>
                            <TableHead>নাম</TableHead>
                            <TableHead className="text-right">আইডি</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailyReport.leaveStudents.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell className="font-bold">{s.roll.toLocaleString("bn-BD")}</TableCell>
                              <TableCell className="font-medium text-amber-600">{s.nameBn}</TableCell>
                              <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                {s.studentId}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Monthly Report Tab Content */}
      {activeTab === "monthly" && (
        <div className="space-y-6">
          {loadingMonthly ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !monthlyReport ? (
            <div className="text-center py-20">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">মাসিক বিবরণী ডাটা পাওয়া যায়নি</p>
            </div>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {monthlyReport.class.name} - মোট ক্লাস দিন:{" "}
                    <span className="text-primary font-bold">
                      {monthlyReport.totalWorkingDays.toLocaleString("bn-BD")}
                    </span>{" "}
                    দিন
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">রোল</TableHead>
                      <TableHead>ছাত্রের নাম</TableHead>
                      <TableHead className="text-center">উপস্থিত দিন</TableHead>
                      <TableHead className="text-center">অনুপস্থিত দিন</TableHead>
                      <TableHead className="text-center">ছুটি</TableHead>
                      <TableHead className="text-right">উপস্থিতির হার</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyReport.students
                      .filter((s) => {
                        const term = searchTerm.toLowerCase();
                        return (
                          s.nameBn.toLowerCase().includes(term) ||
                          s.roll.toString().includes(term) ||
                          s.studentId.toLowerCase().includes(term)
                        );
                      })
                      .map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-bold">{s.roll.toLocaleString("bn-BD")}</TableCell>
                          <TableCell className="font-medium">{s.nameBn}</TableCell>
                          <TableCell className="text-center font-semibold text-emerald-600">
                            {s.presentCount.toLocaleString("bn-BD")}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-rose-600">
                            {s.absentCount.toLocaleString("bn-BD")}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-amber-600">
                            {s.leaveCount.toLocaleString("bn-BD")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-bold">{s.percentage}%</span>
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    s.percentage >= 80
                                      ? "bg-emerald-500"
                                      : s.percentage >= 60
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  }`}
                                  style={{ width: `${Math.min(s.percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
