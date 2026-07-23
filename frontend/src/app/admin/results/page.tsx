"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  Plus,
  Search,
  Loader2,
  Save,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Award,
  BookOpen,
  Printer,
  Trash2,
  Eye,
  EyeOff,
  Globe,
} from "lucide-react";
import { useClasses, useSessions, useSubjects } from "@/hooks/useAcademic";
import {
  useExams,
  useCreateExam,
  useUpdateExam,
  useDeleteExam,
  useMarksSheet,
  useSaveBulkMarks,
  useClassResultSheet,
} from "@/hooks/useExams";
import { toast } from "sonner";

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState<"exams" | "entry" | "sheet">("entry");

  // Filter States
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Data Queries
  const { data: sessions } = useSessions();
  const { data: classes } = useClasses();
  const { data: exams, isLoading: loadingExams } = useExams(selectedSessionId || undefined);
  const { data: subjects } = useSubjects(selectedClassId || undefined);

  // Set default values when data loads
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

  // Mutations
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();
  const saveMarks = useSaveBulkMarks();

  // Create Exam Dialog State
  const [createOpen, setCreateOpen] = useState(false);
  const [examName, setExamName] = useState("");
  const [examSessionId, setExamSessionId] = useState("");

  const handleCreateExam = async () => {
    if (!examName || !examSessionId) {
      toast.error("পরীক্ষার নাম এবং সেশন নির্বাচন করুন");
      return;
    }
    try {
      await createExam.mutateAsync({ name: examName, sessionId: examSessionId });
      toast.success("পরীক্ষা সফলভাবে তৈরি হয়েছে");
      setCreateOpen(false);
      setExamName("");
    } catch (err: any) {
      toast.error(err.message || "পরীক্ষা তৈরি করা যায়নি");
    }
  };

  const handleTogglePublish = async (examId: string, currentStatus: boolean) => {
    const actionText = !currentStatus
      ? "আপনি কি নিশ্চিতভাবে এই পরীক্ষার ফলাফল সর্বসাধারণের জন্য প্রকাশ (Publish) করতে চান?"
      : "আপনি কি নিশ্চিতভাবে ফলাফলটি অপ্রকাশিত (Unpublish) করতে চান?";

    if (!confirm(actionText)) return;

    try {
      await updateExam.mutateAsync({
        id: examId,
        body: { isPublished: !currentStatus },
      });
      toast.success(!currentStatus ? "পরীক্ষার ফলাফল পাবলিক সাইটে প্রকাশ করা হয়েছে" : "ফলাফল অপ্রকাশিত (Draft) রাখা হয়েছে");
    } catch (err: any) {
      toast.error(err.message || "স্ট্যাটাস পরিবর্তন করা যায়নি");
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই পরীক্ষাটি মুছে ফেলতে চান? এতে সকল রেজাল্ট মুছে যাবে।")) return;
    try {
      await deleteExam.mutateAsync(examId);
      toast.success("পরীক্ষা ডিলেট করা হয়েছে");
    } catch (err: any) {
      toast.error(err.message || "পরীক্ষা ডিলেট করা যায়নি");
    }
  };

  // Marks Entry Sheet Query & Local State
  const { data: marksSheet, isLoading: loadingMarksSheet } = useMarksSheet(
    selectedExamId,
    selectedClassId,
    selectedSubjectId
  );
  const [localMarks, setLocalMarks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (marksSheet?.students) {
      const initialMap: Record<string, number> = {};
      marksSheet.students.forEach((s) => {
        if (s.marks !== null) initialMap[s.id] = s.marks;
      });
      setLocalMarks(initialMap);
    }
  }, [marksSheet]);

  const handleMarksChange = (studentId: string, value: string, fullMarks: number) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      const copy = { ...localMarks };
      delete copy[studentId];
      setLocalMarks(copy);
      return;
    }
    if (num > fullMarks) {
      toast.error(`প্রাপ্ত নম্বর পূর্ণমান (${fullMarks}) এর বেশি হতে পারবে না`);
      return;
    }
    setLocalMarks((prev) => ({ ...prev, [studentId]: num }));
  };

  const handleSaveMarks = async () => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId || !marksSheet?.students.length) {
      toast.error("নম্বর এন্ট্রির সঠিক তথ্য পাওয়া যায়নি");
      return;
    }

    const marksArray = marksSheet.students
      .filter((s) => localMarks[s.id] !== undefined)
      .map((s) => ({
        studentId: s.id,
        marks: localMarks[s.id],
      }));

    if (!marksArray.length) {
      toast.error("কমপক্ষে একজন ছাত্রের নম্বর প্রদান করুন");
      return;
    }

    try {
      await saveMarks.mutateAsync({
        examId: selectedExamId,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        marks: marksArray,
      });
      toast.success("নম্বর সফলভাবে সংরক্ষণ করা হয়েছে!");
    } catch (err: any) {
      toast.error(err.message || "নম্বর সংরক্ষণ করা যায়নি");
    }
  };

  // Class Result Sheet Query
  const { data: resultSheet, isLoading: loadingResultSheet } = useClassResultSheet(
    selectedExamId,
    selectedClassId
  );

  // Result Card Modal State
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            পরীক্ষা ও ফলাফল ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground">পরীক্ষা সেটআপ, নম্বর এন্ট্রি, মেধা তালিকা ও রেজাল্ট কার্ড</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" /> নতুন পরীক্ষা তৈরি
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>নতুন পরীক্ষা তৈরি করুন</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>পরীক্ষার নাম</Label>
                <Input
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="যেমন: প্রথম সাময়িক পরীক্ষা ২০২৬"
                />
              </div>
              <div className="space-y-2">
                <Label>সেশন</Label>
                <select
                  value={examSessionId}
                  onChange={(e) => setExamSessionId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="">সেশন নির্বাচন করুন</option>
                  {sessions?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.year} {s.isActive ? "(চলতি)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>বাতিল</DialogClose>
              <Button onClick={handleCreateExam} disabled={createExam.isPending}>
                {createExam.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                তৈরি করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b gap-4">
        <button
          onClick={() => setActiveTab("entry")}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "entry"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          বিষয়ভিত্তিক নম্বর এন্ট্রি
        </button>
        <button
          onClick={() => setActiveTab("sheet")}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "sheet"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Award className="h-4 w-4" />
          ফলাফল ও মেধা তালিকা
        </button>
        <button
          onClick={() => setActiveTab("exams")}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "exams"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          পরীক্ষা তালিকা ({exams?.length || 0})
        </button>
      </div>

      {/* TAB 1: EXAMS LIST */}
      {activeTab === "exams" && (
        <Card>
          <CardContent className="p-0">
            {loadingExams ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !exams?.length ? (
              <div className="text-center py-16">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">কোনো পরীক্ষা তৈরি করা হয়নি</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>পরীক্ষার নাম</TableHead>
                    <TableHead>সেশন</TableHead>
                    <TableHead className="text-center">ফলাফল প্রকাশ</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((ex, idx) => (
                    <TableRow key={ex.id}>
                      <TableCell className="font-bold">{(idx + 1).toLocaleString("bn-BD")}</TableCell>
                      <TableCell className="font-medium text-base">{ex.name}</TableCell>
                      <TableCell>{ex.session?.year || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={ex.isPublished ? "default" : "outline"} className="gap-1">
                          <Globe className="h-3 w-3" />
                          {ex.isPublished ? "প্রকাশিত (Public)" : "খসড়া (Draft)"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(ex.id, ex.isPublished)}
                        >
                          {ex.isPublished ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                          {ex.isPublished ? "অপ্রকাশিত করুন" : "প্রকাশ করুন"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteExam(ex.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: MARKS ENTRY */}
      {activeTab === "entry" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card>
            <CardContent className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">পরীক্ষা *</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background font-medium"
                >
                  <option value="">পরীক্ষা নির্বাচন করুন</option>
                  {exams?.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.session?.year})
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
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">বিষয় *</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background font-medium"
                >
                  <option value="">বিষয় নির্বাচন করুন</option>
                  {subjects?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || "কোড নেই"})
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Action Bar */}
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
            {marksSheet?.subject && (
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs px-2.5 py-1">
                  পূর্ণমান: {marksSheet.subject.fullMarks.toLocaleString("bn-BD")} | পাস নম্বর:{" "}
                  {marksSheet.subject.passMarks.toLocaleString("bn-BD")}
                </Badge>
                <Button
                  size="sm"
                  onClick={handleSaveMarks}
                  disabled={saveMarks.isPending || !marksSheet.students.length}
                >
                  {saveMarks.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  নম্বর সংরক্ষণ করুন
                </Button>
              </div>
            )}
          </div>

          {/* Marks Table */}
          <Card>
            <CardContent className="p-0">
              {loadingMarksSheet ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">নম্বর এন্ট্রি শীট লোড হচ্ছে...</span>
                </div>
              ) : !selectedExamId || !selectedClassId || !selectedSubjectId ? (
                <div className="text-center py-20">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">পরীক্ষা, শ্রেণী ও বিষয় নির্বাচন করুন</p>
                </div>
              ) : !marksSheet?.students.length ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">উক্ত শ্রেণীতে কোনো ছাত্র নেই</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">রোল</TableHead>
                      <TableHead>ছাত্রের নাম</TableHead>
                      <TableHead className="hidden md:table-cell">আইডি</TableHead>
                      <TableHead className="w-48 text-center">প্রাপ্ত নম্বর (পূর্ণমান: {marksSheet.subject.fullMarks})</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marksSheet.students
                      .filter((s) => {
                        const term = searchTerm.toLowerCase();
                        return (
                          s.nameBn.toLowerCase().includes(term) ||
                          s.roll.toString().includes(term) ||
                          s.studentId.toLowerCase().includes(term)
                        );
                      })
                      .map((student) => {
                        const val = localMarks[student.id];
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-bold text-base">
                              {student.roll.toLocaleString("bn-BD")}
                            </TableCell>
                            <TableCell className="font-medium text-base">{student.nameBn}</TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                              {student.studentId}
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min={0}
                                max={marksSheet.subject.fullMarks}
                                placeholder="0"
                                value={val !== undefined ? val : ""}
                                onChange={(e) =>
                                  handleMarksChange(student.id, e.target.value, marksSheet.subject.fullMarks)
                                }
                                className="w-32 mx-auto text-center font-bold text-base"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: RESULT SHEETS & CARDS */}
      {activeTab === "sheet" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card>
            <CardContent className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">পরীক্ষা *</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background font-medium"
                >
                  <option value="">পরীক্ষা নির্বাচন করুন</option>
                  {exams?.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.session?.year})
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
            </CardContent>
          </Card>

          {/* Result Sheet Content */}
          <Card>
            <CardContent className="p-0">
              {loadingResultSheet ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">মেধা তালিকা লোড হচ্ছে...</span>
                </div>
              ) : !selectedExamId || !selectedClassId ? (
                <div className="text-center py-20">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">পরীক্ষা ও শ্রেণী নির্বাচন করুন</p>
                </div>
              ) : !resultSheet?.students.length ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">কোনো ফলাফল পাওয়া যায়নি</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-center">মেধা স্থান</TableHead>
                        <TableHead className="w-16">রোল</TableHead>
                        <TableHead>ছাত্রের নাম</TableHead>
                        <TableHead className="text-right">মোট প্রাপ্ত নম্বর</TableHead>
                        <TableHead className="text-center">GPA</TableHead>
                        <TableHead className="text-center">গ্রেড</TableHead>
                        <TableHead className="text-center">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultSheet.students.map((item) => (
                        <TableRow key={item.student.id}>
                          <TableCell className="text-center">
                            <Badge
                              variant={item.position === 1 ? "default" : item.position <= 3 ? "secondary" : "outline"}
                              className="font-bold text-sm px-2.5 py-0.5"
                            >
                              {item.position === 1 ? "১ম 🏆" : item.position === 2 ? "২য় 🥈" : item.position === 3 ? "৩য় 🥉" : `${item.position.toLocaleString("bn-BD")}তম`}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold">{item.student.roll.toLocaleString("bn-BD")}</TableCell>
                          <TableCell className="font-medium text-base">{item.student.nameBn}</TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {item.totalObtained.toLocaleString("bn-BD")} / {item.totalFullMarks.toLocaleString("bn-BD")}
                          </TableCell>
                          <TableCell className="text-center font-bold text-base">
                            {item.hasFailed ? "0.00" : item.gpa.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={item.hasFailed ? "destructive" : "default"}
                              className="font-bold text-sm"
                            >
                              {item.finalGrade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStudentForCard(item);
                                setCardModalOpen(true);
                              }}
                            >
                              <Printer className="h-3.5 w-3.5 mr-1" />
                              রেজাল্ট কার্ড
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Result Card Modal */}
      <Dialog open={cardModalOpen} onOpenChange={setCardModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>রেজাল্ট কার্ড</DialogTitle>
          </DialogHeader>

          {selectedStudentForCard && (
            <div className="space-y-6 p-4 border rounded-xl bg-card text-card-foreground">
              {/* Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা</h2>
                <p className="text-xs text-muted-foreground">ইলিয়টগঞ্জ, চান্দিনা, কুমিল্লা • স্থাপিত: ১৯৭৫</p>
                <Badge variant="secondary" className="mt-2 text-sm font-semibold">
                  {resultSheet?.exam?.name}
                </Badge>
              </div>

              {/* Student Info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">ছাত্রের নাম:</span>{" "}
                  <strong className="font-semibold">{selectedStudentForCard.student.nameBn}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-mono">আইডি:</span>{" "}
                  <strong>{selectedStudentForCard.student.studentId}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">শ্রেণী:</span>{" "}
                  <strong>{resultSheet?.class?.name}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">রোল:</span>{" "}
                  <strong>{selectedStudentForCard.student.roll.toLocaleString("bn-BD")}</strong>
                </div>
              </div>

              {/* Subject breakdown */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>বিষয়</TableHead>
                    <TableHead className="text-center">পূর্ণমান</TableHead>
                    <TableHead className="text-center">প্রাপ্ত নম্বর</TableHead>
                    <TableHead className="text-center">গ্রেড</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedStudentForCard.subjectBreakdown.map((sb: any) => (
                    <TableRow key={sb.subjectId}>
                      <TableCell className="font-medium">{sb.subjectName}</TableCell>
                      <TableCell className="text-center">{sb.fullMarks}</TableCell>
                      <TableCell className="text-center font-bold">
                        {sb.obtainedMarks !== null ? sb.obtainedMarks : "—"}
                      </TableCell>
                      <TableCell className="text-center font-bold">{sb.grade}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Summary */}
              <div className="bg-muted/40 p-3 rounded-lg flex justify-between items-center text-sm font-medium">
                <div>
                  মোট প্রাপ্ত নম্বর:{" "}
                  <span className="font-bold text-primary">
                    {selectedStudentForCard.totalObtained} / {selectedStudentForCard.totalFullMarks}
                  </span>
                </div>
                <div>
                  জিপিএ: <span className="font-bold text-emerald-600">{selectedStudentForCard.gpa.toFixed(2)}</span>
                </div>
                <div>
                  মেধা স্থান:{" "}
                  <span className="font-bold text-purple-600">
                    {selectedStudentForCard.position.toLocaleString("bn-BD")}তম
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-8 flex justify-between text-xs text-muted-foreground">
                <div className="border-t pt-1 w-32 text-center">অভিভাবকের স্বাক্ষর</div>
                <div className="border-t pt-1 w-32 text-center">শ্রেনী শিক্ষকের স্বাক্ষর</div>
                <div className="border-t pt-1 w-32 text-center">মুহতামিমের স্বাক্ষর</div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> প্রিন্ট করুন
            </Button>
            <DialogClose render={<Button />}>বন্ধ করুন</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
