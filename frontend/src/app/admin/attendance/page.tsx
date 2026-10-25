"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  Search,
  Loader2,
  Save,
  CheckCircle,
  XCircle,
  Clock,
  BarChart2,
  RotateCcw,
  Users,
} from "lucide-react";
import { useClasses, useSessions, useDepartments } from "@/hooks/useAcademic";
import { useAttendance, useSaveBulkAttendance } from "@/hooks/useAttendance";
import type { AttendanceStatus } from "@/lib/types";
import { toast } from "sonner";

export default function AttendancePage() {
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: classes, isLoading: loadingClasses } = useClasses();
  const { data: sessions } = useSessions();
  const { data: departments } = useDepartments();

  // Set default class if available
  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const { data: attendanceData, isLoading: loadingAttendance, refetch } = useAttendance(
    selectedClassId,
    selectedDate
  );
  const saveAttendanceMutation = useSaveBulkAttendance();

  // Local state for interactive editing before save
  const [localStatuses, setLocalStatuses] = useState<Record<string, AttendanceStatus>>({});

  // Sync fetched status into local state
  useEffect(() => {
    if (attendanceData?.students) {
      const initialMap: Record<string, AttendanceStatus> = {};
      attendanceData.students.forEach((s) => {
        initialMap[s.id] = s.status || "PRESENT"; // Default to PRESENT if unrecorded
      });
      setLocalStatuses(initialMap);
    }
  }, [attendanceData]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setLocalStatuses((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!attendanceData?.students) return;
    const newMap: Record<string, AttendanceStatus> = {};
    attendanceData.students.forEach((s) => {
      newMap[s.id] = status;
    });
    setLocalStatuses(newMap);
  };

  const handleReset = () => {
    if (attendanceData?.students) {
      const initialMap: Record<string, AttendanceStatus> = {};
      attendanceData.students.forEach((s) => {
        initialMap[s.id] = s.status || "PRESENT";
      });
      setLocalStatuses(initialMap);
      toast.info("পরিবর্তনগুলো পূর্বাবস্থায় আনা হয়েছে");
    }
  };

  const handleSave = async () => {
    if (!selectedClassId || !selectedDate || !attendanceData?.students.length) {
      toast.error("উপস্থিতির কোনো ছাত্র তথ্য নেই");
      return;
    }

    const payload = {
      date: selectedDate,
      classId: selectedClassId,
      attendances: attendanceData.students.map((s) => ({
        studentId: s.id,
        status: localStatuses[s.id] || "PRESENT",
      })),
    };

    try {
      await saveAttendanceMutation.mutateAsync(payload);
      toast.success("উপস্থিতি সফলভাবে সংরক্ষণ করা হয়েছে!");
    } catch (err: any) {
      toast.error(err.message || "উপস্থিতি সংরক্ষণ করা যায়নি");
    }
  };

  // Filter students by search term
  const filteredStudents = attendanceData?.students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.nameBn.toLowerCase().includes(term) ||
      s.roll.toString().includes(term) ||
      s.studentId.toLowerCase().includes(term)
    );
  }) || [];

  // Local summary calculation
  const totalCount = filteredStudents.length;
  const presentCount = filteredStudents.filter((s) => localStatuses[s.id] === "PRESENT").length;
  const absentCount = filteredStudents.filter((s) => localStatuses[s.id] === "ABSENT").length;
  const leaveCount = filteredStudents.filter((s) => localStatuses[s.id] === "LEAVE").length;
  const percentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            ডিজিটাল উপস্থিতি উপস্থাপন
          </h1>
          <p className="text-muted-foreground">শ্রেণীভিত্তিক দৈনিক উপস্থিতি গ্রহণ ও সংশোধন করুন</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/attendance/report">
            <Button variant="outline" size="sm">
              <BarChart2 className="h-4 w-4 mr-2" />
              উপস্থিতি রিপোর্ট
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">সেশন</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">সকল সেশন</option>
              {sessions?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.year} {s.isActive ? "(চলতি)" : ""}
                </option>
              ))}
            </select>
          </div>

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

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">বিভাগ (ঐচ্ছিক)</label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">সকল বিভাগ</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">তারিখ *</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">মোট ছাত্র</p>
            <p className="text-xl font-bold text-blue-600">{totalCount.toLocaleString("bn-BD")}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">উপস্থিত (Present)</p>
            <p className="text-xl font-bold text-emerald-600">{presentCount.toLocaleString("bn-BD")}</p>
          </CardContent>
        </Card>
        <Card className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">অনুপস্থিত (Absent)</p>
            <p className="text-xl font-bold text-rose-600">{absentCount.toLocaleString("bn-BD")}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">ছুটি (Leave)</p>
            <p className="text-xl font-bold text-amber-600">{leaveCount.toLocaleString("bn-BD")}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 col-span-2 lg:col-span-1">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">উপস্থিতির হার</p>
            <p className="text-xl font-bold text-purple-600">{percentage}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ছাত্রের নাম বা রোল নম্বর দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll("PRESENT")}
            className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            সবাই উপস্থিত
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll("ABSENT")}
            className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <XCircle className="h-3.5 w-3.5 mr-1 text-rose-600" />
            সবাই অনুপস্থিত
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            রিসেট
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveAttendanceMutation.isPending || !filteredStudents.length}
            className="bg-primary text-primary-foreground font-semibold"
          >
            {saveAttendanceMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            উপস্থিতি সংরক্ষণ করুন
          </Button>
        </div>
      </div>

      {/* Student Attendance Table */}
      <Card>
        <CardContent className="p-0">
          {loadingAttendance ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">উপস্থিতি ডাটা লোড হচ্ছে...</span>
            </div>
          ) : !selectedClassId ? (
            <div className="text-center py-20">
              <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">উপস্থিতি নিতে একটি শ্রেণী নির্বাচন করুন</p>
            </div>
          ) : !filteredStudents.length ? (
            <div className="text-center py-20">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">উক্ত শ্রেণীতে কোনো ছাত্র পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">রোল</TableHead>
                    <TableHead>ছাত্রের নাম</TableHead>
                    <TableHead className="hidden md:table-cell">স্টুডেন্ট আইডি</TableHead>
                    <TableHead className="text-center w-64">উপস্থিতি স্ট্যাটাস</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const currentStatus = localStatuses[student.id] || "PRESENT";
                    return (
                      <TableRow key={student.id} className="hover:bg-muted/30">
                        <TableCell className="font-bold text-base">
                          {student.roll.toLocaleString("bn-BD")}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-base">{student.nameBn}</div>
                          {student.nameEn && (
                            <div className="text-xs text-muted-foreground">{student.nameEn}</div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                          {student.studentId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, "PRESENT")}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                                currentStatus === "PRESENT"
                                  ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30"
                                  : "bg-muted/60 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700"
                              }`}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              উপস্থিত
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, "ABSENT")}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                                currentStatus === "ABSENT"
                                  ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30"
                                  : "bg-muted/60 text-muted-foreground hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700"
                              }`}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              অনুপস্থিত
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, "LEAVE")}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                                currentStatus === "LEAVE"
                                  ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/30"
                                  : "bg-muted/60 text-muted-foreground hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700"
                              }`}
                            >
                              <Clock className="h-3.5 w-3.5" />
                              ছুটি
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
