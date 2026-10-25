"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Save, Loader2, CheckCircle2, AlertCircle, RefreshCw, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useClasses, useSessions, useSubjects } from "@/hooks/useAcademic";
import { useExams, useMarksSheet, useSaveBulkMarks } from "@/hooks/useExams";
import { EmptyState } from "@/components/shared/EmptyState";

export default function TeacherMarksPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  // Queries
  const { data: sessions } = useSessions();
  const { data: classes } = useClasses();
  const { data: exams, isLoading: loadingExams } = useExams(selectedSessionId || undefined);
  const { data: subjects } = useSubjects(selectedClassId || undefined);

  // Set default query selections
  useEffect(() => {
    if (sessions?.length && !selectedSessionId) {
      const active = sessions.find((s) => s.isActive) || sessions[0];
      setSelectedSessionId(active.id);
    }
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    if (exams?.length && !selectedExamId) {
      setSelectedExamId(exams[0].id);
    }
  }, [exams, selectedExamId]);

  useEffect(() => {
    if (classes?.length && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (subjects?.length && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Fetch Marks Sheet from Backend API
  const {
    data: marksSheet,
    isLoading: loadingMarksSheet,
    refetch,
  } = useMarksSheet(selectedExamId, selectedClassId, selectedSubjectId);

  const saveMarks = useSaveBulkMarks();

  // Local state for modified marks
  const [localMarks, setLocalMarks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (marksSheet?.students) {
      const initialMap: Record<string, number> = {};
      marksSheet.students.forEach((s) => {
        if (s.marks !== null && s.marks !== undefined) {
          initialMap[s.id] = s.marks;
        }
      });
      setLocalMarks(initialMap);
    }
  }, [marksSheet]);

  const handleMarkChange = (studentId: string, value: string, fullMarks = 100) => {
    if (value === "") {
      const copy = { ...localMarks };
      delete copy[studentId];
      setLocalMarks(copy);
      return;
    }

    const num = Number(value);
    if (isNaN(num)) return;

    if (num < 0 || num > fullMarks) {
      toast.error(`নম্বর ০ থেকে ${fullMarks}-এর মধ্যে হতে হবে`);
      return;
    }

    setLocalMarks((prev) => ({ ...prev, [studentId]: num }));
  };

  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId || !marksSheet?.students.length) {
      toast.error("নম্বর এন্ট্রির সঠিক ক্ষেত্রসমূহ নির্বাচন করুন");
      return;
    }

    const marksArray = marksSheet.students
      .filter((s) => localMarks[s.id] !== undefined)
      .map((s) => ({
        studentId: s.id,
        marks: localMarks[s.id],
      }));

    if (!marksArray.length) {
      toast.error("কমপক্ষে একজন শিক্ষার্থীর নম্বর প্রদান করুন");
      return;
    }

    try {
      await saveMarks.mutateAsync({
        examId: selectedExamId,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        marks: marksArray,
      });
      toast.success("পরীক্ষার নম্বর সফলভাবে ইনপুট ও ড্যাশবোর্ডে সংরক্ষিত হয়েছে!");
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "নম্বর সংরক্ষণে ব্যর্থ হয়েছে");
    }
  };

  const fullMarks = marksSheet?.subject?.fullMarks || 100;
  const passMarks = marksSheet?.subject?.passMarks || 33;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            শিক্ষক নম্বর ইনপুট পোর্টাল (Marks Entry)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            দায়িত্বপ্রাপ্ত বিষয়ে শিক্ষার্থীদের পরীক্ষার নম্বর ইনপুট ও সংরক্ষণ করুন।
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="font-medium shrink-0">
          <RefreshCw className="h-4 w-4 mr-1.5" /> রিফ্রেশ
        </Button>
      </div>

      {/* Selectors Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Session Selector */}
            <div>
              <label className="font-bold block mb-1">শিক্ষাবর্ষ (Session)</label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full border rounded-lg p-2.5 bg-background border-input font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- সেশন নির্বাচন করুন --</option>
                {sessions?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.year} {s.isActive ? "(চলতি)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Selector */}
            <div>
              <label className="font-bold block mb-1">পরীক্ষা (Exam)</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full border rounded-lg p-2.5 bg-background border-input font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- পরীক্ষা নির্বাচন করুন --</option>
                {exams?.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} {!ex.isPublished ? "(ড্রাফট)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Selector */}
            <div>
              <label className="font-bold block mb-1">শ্রেণী (Class)</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSubjectId("");
                }}
                className="w-full border rounded-lg p-2.5 bg-background border-input font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- শ্রেণী নির্বাচন করুন --</option>
                {classes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selector */}
            <div>
              <label className="font-bold block mb-1">বিষয় (Subject)</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full border rounded-lg p-2.5 bg-background border-input font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- বিষয় নির্বাচন করুন --</option>
                {subjects?.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marks Sheet Table */}
      <Card className="border-slate-200 dark:border-slate-800 bg-card overflow-hidden">
        <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                {marksSheet?.subject?.name || "বিষয় নম্বর এন্ট্রি শীট"}
              </CardTitle>
              <CardDescription className="text-xs">
                পূর্ণমান: <strong>{fullMarks}</strong> | পাস মার্কস: <strong>{passMarks}</strong>
              </CardDescription>
            </div>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
              onClick={handleSaveMarks}
              disabled={saveMarks.isPending || !marksSheet?.students?.length}
            >
              {saveMarks.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> সংরক্ষণ করা হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" /> নম্বর সেভ করুন
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingMarksSheet ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b">
                  <div className="h-4 w-1/4 bg-muted rounded" />
                  <div className="h-4 w-1/6 bg-muted rounded" />
                  <div className="h-8 w-24 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : !marksSheet?.students?.length ? (
            <div className="py-12">
              <EmptyState
                icon={FileSpreadsheet}
                title="কোনো শিক্ষার্থী পাওয়া যায়নি"
                description="পরীক্ষা, শ্রেণী এবং বিষয় নির্বাচন করে নম্বর প্রদান করুন।"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
                  <TableRow>
                    <TableHead className="w-16 text-center font-bold">রোল</TableHead>
                    <TableHead className="font-bold">শিক্ষার্থীর নাম</TableHead>
                    <TableHead className="font-bold">স্টুডেন্ট আইডি</TableHead>
                    <TableHead className="text-center font-bold">স্ট্যাটাস</TableHead>
                    <TableHead className="w-48 text-right font-bold">প্রাপ্ত নম্বর ({fullMarks})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {marksSheet.students.map((student) => {
                    const currentMark = localMarks[student.id];
                    const hasMarked = currentMark !== undefined;
                    const isPassed = hasMarked && currentMark >= passMarks;

                    return (
                      <TableRow key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <TableCell className="text-center font-bold text-xs">{student.roll}</TableCell>
                        <TableCell className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {student.nameBn}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {student.studentId}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasMarked ? (
                            isPassed ? (
                              <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                                কৃতকার্য (Pass)
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[10px]">
                                অকৃতকার্য (Fail)
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              অপ্রদানকৃত
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={0}
                            max={fullMarks}
                            placeholder={`0 - ${fullMarks}`}
                            value={currentMark !== undefined ? currentMark : ""}
                            onChange={(e) => handleMarkChange(student.id, e.target.value, fullMarks)}
                            className="w-32 ml-auto text-right font-mono font-bold text-sm border-slate-300 dark:border-slate-700"
                          />
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
