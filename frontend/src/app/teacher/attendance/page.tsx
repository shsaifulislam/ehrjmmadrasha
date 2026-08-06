"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, Save, Check, X, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

import { useTeacherClasses, useTeacherStudents, useSubmitClassAttendance } from "@/hooks/useTeacherPortal";

export default function TeacherAttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, "PRESENT" | "ABSENT" | "LATE">>({});

  const { data: classesData, isLoading: loadingClasses } = useTeacherClasses();
  const classes = Array.isArray(classesData) ? classesData : (classesData as any)?.data || [];

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const { data: studentsData, isLoading: loadingStudents } = useTeacherStudents(selectedClassId || undefined);
  const students = Array.isArray(studentsData) ? studentsData : (studentsData as any)?.data || [];

  const submitAttendance = useSubmitClassAttendance();

  useEffect(() => {
    if (students.length > 0) {
      const initialMap: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
      students.forEach((s: any) => {
        initialMap[s.id] = "PRESENT";
      });
      setAttendanceMap(initialMap);
    }
  }, [students]);

  const handleStatusChange = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE") => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: "PRESENT" | "ABSENT") => {
    const updated: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
    students.forEach((s: any) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || students.length === 0) {
      toast.error("শ্রেণী ও শিক্ষার্থী নির্বাচন করুন");
      return;
    }
    try {
      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status: status === "LATE" ? "ABSENT" : status,
      }));
      await submitAttendance.mutateAsync({
        classId: selectedClassId,
        date: new Date().toISOString(),
        records,
      });
      toast.success("আজকের হাজিরা ডাটাবেসে সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "হাজিরা সংরক্ষণে ব্যর্থ হয়েছে");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-emerald-600" /> জামায়াতভিত্তিক দৈনিক উপস্থিতি
          </h1>
          <p className="text-xs text-slate-500 mt-1">শিক্ষক প্যানেল থেকে দায়িত্বপ্রাপ্ত ক্লাসের হাজিরা গ্রহণ করুন</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-600 outline-none w-full sm:w-auto"
          >
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="shadow-sm border-t-4 border-t-emerald-600">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b bg-slate-50/50 pb-4">
          <div>
            <CardTitle className="text-md font-bold text-slate-800">আজকের হাজিরা তালিকা</CardTitle>
            <CardDescription className="text-xs">তারিখ: {new Date().toLocaleDateString('bn-BD')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleMarkAll("PRESENT")} className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50">
              সবাই উপস্থিত
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleMarkAll("ABSENT")} className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50">
              সবাই অনুপস্থিত
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <TableHead className="w-16">রোল</TableHead>
                  <TableHead>ছাত্রের নাম</TableHead>
                  <TableHead className="text-center">উপস্থিতি স্টেটাস</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => {
                  const currentStatus = attendanceMap[student.id] || "PRESENT";
                  return (
                    <TableRow key={student.id} className="hover:bg-slate-50">
                      <TableCell className="font-bold text-slate-700">{student.roll}</TableCell>
                      <TableCell className="font-medium text-slate-800">{student.nameBn}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, "PRESENT")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${
                              currentStatus === "PRESENT"
                                ? "bg-emerald-600 text-white shadow"
                                : "bg-slate-100 text-slate-600 hover:bg-emerald-50"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" /> উপস্থিত
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, "ABSENT")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${
                              currentStatus === "ABSENT"
                                ? "bg-rose-600 text-white shadow"
                                : "bg-slate-100 text-slate-600 hover:bg-rose-50"
                            }`}
                          >
                            <X className="h-3.5 w-3.5" /> অনুপস্থিত
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, "LATE")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${
                              currentStatus === "LATE"
                                ? "bg-amber-500 text-slate-950 shadow"
                                : "bg-slate-100 text-slate-600 hover:bg-amber-50"
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" /> বিলম্ব
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t flex justify-end">
            <Button
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              onClick={handleSaveAttendance}
              disabled={submitAttendance.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {submitAttendance.isPending ? "সংরক্ষণ করা হচ্ছে..." : "হাজিরা সংরক্ষণ করুন"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
