"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  Loader2,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Calendar,
  Phone,
  UserCheck,
  XCircle,
  CheckCircle,
  MapPin,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  useStudents,
  useClasses,
  useSessions,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent
} from "@/hooks/useAcademic";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import type { Student } from "@/lib/types";

export default function StudentsPage() {
  const [search, setSearch] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const { data: classes } = useClasses();
  const { data: sessions } = useSessions();

  const { data: studentData, isLoading, refetch } = useStudents({
    page,
    limit: 15,
    search: search.trim() || undefined,
    classId: selectedClassId || undefined,
    sessionId: selectedSessionId || undefined,
  });

  const students = studentData?.students || [];
  const meta = studentData?.meta;

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  // Modals state
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    nameBn: "",
    nameEn: "",
    roll: "",
    classId: "",
    sessionId: "",
    gender: "MALE",
    guardianPhone: "",
    guardianName: "",
    address: "",
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameBn || !formData.roll || !formData.classId || !formData.sessionId) {
      toast.error("স্টার চিহ্নিত আবশ্যিক ঘরগুলো পূরণ করুন");
      return;
    }

    try {
      await createStudent.mutateAsync({
        nameBn: formData.nameBn,
        nameEn: formData.nameEn || undefined,
        roll: parseInt(formData.roll, 10),
        classId: formData.classId,
        sessionId: formData.sessionId,
        gender: formData.gender,
        phone: formData.guardianPhone || undefined,
        address: formData.address || undefined,
      });
      toast.success("নতুন ছাত্র সফলভাবে যুক্ত করা হয়েছে");
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "ছাত্র সংযোজন করা যায়নি");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;

    try {
      await updateStudent.mutateAsync({
        id: editStudent.id,
        body: {
          nameBn: formData.nameBn,
          nameEn: formData.nameEn || undefined,
          roll: parseInt(formData.roll, 10),
          classId: formData.classId,
          sessionId: formData.sessionId,
          gender: formData.gender,
          address: formData.address || undefined,
        },
      });
      toast.success("ছাত্রের তথ্য আপডেট করা হয়েছে");
      setEditStudent(null);
      resetForm();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "আপডেট করা যায়নি");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteStudent.mutateAsync(deleteId);
      toast.success("ছাত্র রেকর্ড সফট ডিলিট করা হয়েছে");
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "ডিলিট করা যায়নি");
    }
  };

  const resetForm = () => {
    setFormData({
      nameBn: "",
      nameEn: "",
      roll: "",
      classId: "",
      sessionId: "",
      gender: "MALE",
      guardianPhone: "",
      guardianName: "",
      address: "",
    });
  };

  const openEditModal = (student: Student) => {
    setEditStudent(student);
    setFormData({
      nameBn: student.nameBn || "",
      nameEn: student.nameEn || "",
      roll: student.roll ? String(student.roll) : "",
      classId: student.classId || "",
      sessionId: student.sessionId || "",
      gender: student.gender || "MALE",
      guardianPhone: "",
      guardianName: "",
      address: student.address || "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <Users className="h-6 w-6 text-emerald-600" />
            ছাত্র পরিচিতি ও ব্যবস্থাপনা (Student Directory)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            মাদ্রাসার সকল নিবন্ধিত শিক্ষার্থীদের তালিকা, শ্রেণী, রোল ও প্রোফাইল ব্যবস্থাপনা।
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="font-medium">
            <RefreshCw className="h-4 w-4 mr-1.5" /> রিফ্রেশ
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
          >
            <Plus className="mr-1.5 h-4 w-4" /> নতুন ছাত্র যুক্ত করুন
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ছাত্রের নাম বা স্টুডেন্ট আইডি দিয়ে খুঁজুন..."
                className="pl-9 text-xs sm:text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Class Filter Dropdown */}
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg p-2.5 text-xs sm:text-sm bg-background border-input focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- সকল শ্রেণী --</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Session Filter Dropdown */}
            <select
              value={selectedSessionId}
              onChange={(e) => {
                setSelectedSessionId(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg p-2.5 text-xs sm:text-sm bg-background border-input focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- সকল সেশন --</option>
              {sessions?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.year}
                </option>
              ))}
            </select>
          </form>
        </CardContent>
      </Card>

      {/* Main Student Directory Table */}
      <Card className="border-slate-200 dark:border-slate-800 bg-card overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b">
                  <div className="h-4 w-1/4 bg-muted rounded" />
                  <div className="h-4 w-1/6 bg-muted rounded" />
                  <div className="h-8 w-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Users}
                title="কোনো ছাত্র পাওয়া যায়নি"
                description="প্রদত্ত অনুসন্ধানের শর্ত বা ফিল্টারের সাথে মানানসই কোনো শিক্ষার্থী নিবন্ধিত নেই।"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
                  <TableRow>
                    <TableHead className="font-bold">স্টুডেন্ট আইডি</TableHead>
                    <TableHead className="font-bold">রোল</TableHead>
                    <TableHead className="font-bold">নাম</TableHead>
                    <TableHead className="font-bold">শ্রেণী</TableHead>
                    <TableHead className="font-bold">সেশন</TableHead>
                    <TableHead className="text-right font-bold">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <TableCell className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        {student.studentId}
                      </TableCell>
                      <TableCell className="font-bold text-xs">{student.roll}</TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                        {student.nameBn}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] border-emerald-600/40 text-emerald-800 dark:text-emerald-300">
                          {student.class?.name || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {student.session?.year || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="প্রোফাইল দেখুন"
                            onClick={() => setViewStudent(student)}
                          >
                            <Eye className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="সম্পাদনা করুন"
                            onClick={() => openEditModal(student)}
                          >
                            <Edit className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="মুছে ফেলুন"
                            onClick={() => setDeleteId(student.id)}
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {meta && meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground font-medium">
            মোট <strong>{meta.total.toLocaleString("bn-BD")}</strong> জনের মধ্যে পেজ{" "}
            <strong>{meta.page.toLocaleString("bn-BD")}</strong> /{" "}
            <strong>{meta.totalPages.toLocaleString("bn-BD")}</strong>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrev}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="text-xs font-medium"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> পূর্ববর্তী
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))}
              className="text-xs font-medium"
            >
              পরবর্তী <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* View Student Detail Modal */}
      {viewStudent && (
        <Dialog open={!!viewStudent} onOpenChange={() => setViewStudent(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
                শিক্ষার্থীর প্রোফাইল বিবরণী
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border space-y-1">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {viewStudent.nameBn}
                </h3>
                {viewStudent.nameEn && (
                  <p className="text-muted-foreground text-xs">{viewStudent.nameEn}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Badge className="bg-emerald-700 text-white text-[10px]">
                    আইডি: {viewStudent.studentId}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    রোল: {viewStudent.roll}
                  </Badge>
                </div>
              </div>

              <div className="border p-4 rounded-xl space-y-2.5 bg-card">
                <div className="grid grid-cols-2 gap-2 pb-2 border-b">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">শ্রেণী</span>
                    <strong className="text-slate-800 dark:text-slate-200">{viewStudent.class?.name || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">সেশন</span>
                    <strong className="text-slate-800 dark:text-slate-200">{viewStudent.session?.year || "—"}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pb-2 border-b">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">লিঙ্গ</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {viewStudent.gender === "FEMALE" ? "ছাত্রী" : "ছাত্র"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">অভিভাবক ফোন</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">
                      {viewStudent.guardian?.phone || viewStudent.phone || "—"}
                    </strong>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">ঠিকানা</span>
                  <strong className="text-slate-800 dark:text-slate-200">{viewStudent.address || "—"}</strong>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-600" />
                নতুন ছাত্র নিবন্ধিত করুন
              </DialogTitle>
              <DialogDescription className="text-xs">
                তারকা চিহ্নিত ঘরগুলো আবশ্যিকভাবে পূরণ করতে হবে।
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="space-y-3 py-2 text-xs">
              <div>
                <label className="font-semibold block mb-1">ছাত্রের নাম (বাংলা) *</label>
                <Input
                  required
                  placeholder="যেমন: মোহাম্মদ আব্দুল্লাহ"
                  value={formData.nameBn}
                  onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">রোল নম্বর *</label>
                  <Input
                    type="number"
                    required
                    placeholder="১০১"
                    value={formData.roll}
                    onChange={(e) => setFormData({ ...formData, roll: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">লিঙ্গ</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-background border-input text-xs"
                  >
                    <option value="MALE">ছাত্র (MALE)</option>
                    <option value="FEMALE">ছাত্রী (FEMALE)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">শ্রেণী *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-background border-input text-xs"
                  >
                    <option value="">-- শ্রেণী নির্বাচন --</option>
                    {classes?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">সেশন *</label>
                  <select
                    required
                    value={formData.sessionId}
                    onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-background border-input text-xs"
                  >
                    <option value="">-- সেশন নির্বাচন --</option>
                    {sessions?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">অভিভাবক ফোন নম্বর</label>
                <Input
                  placeholder="018XXXXXXXX"
                  value={formData.guardianPhone}
                  onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">ঠিকানা</label>
                <Input
                  placeholder="গ্রাম, থানা, জেলা"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  disabled={createStudent.isPending}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  {createStudent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "সংযোজন নিশ্চিত করুন"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <Dialog open={!!editStudent} onOpenChange={() => setEditStudent(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit className="h-5 w-5 text-amber-600" />
                ছাত্রের তথ্য সম্পাদনা
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-3 py-2 text-xs">
              <div>
                <label className="font-semibold block mb-1">ছাত্রের নাম (বাংলা) *</label>
                <Input
                  required
                  value={formData.nameBn}
                  onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">রোল নম্বর *</label>
                  <Input
                    type="number"
                    required
                    value={formData.roll}
                    onChange={(e) => setFormData({ ...formData, roll: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">লিঙ্গ</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-background border-input text-xs"
                  >
                    <option value="MALE">ছাত্র (MALE)</option>
                    <option value="FEMALE">ছাত্রী (FEMALE)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">শ্রেণী *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-background border-input text-xs"
                  >
                    <option value="">-- শ্রেণী নির্বাচন --</option>
                    {classes?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">সেশন *</label>
                  <select
                    required
                    value={formData.sessionId}
                    onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-background border-input text-xs"
                  >
                    <option value="">-- সেশন নির্বাচন --</option>
                    {sessions?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">ঠিকানা</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={() => setEditStudent(null)}>
                  বাতিল
                </Button>
                <Button type="submit" disabled={updateStudent.isPending} className="bg-amber-600 text-white font-bold">
                  {updateStudent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "আপডেট নিশ্চিত করুন"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-rose-600 font-bold flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-600" />
                ছাত্র রেকর্ড অপসারণ নিশ্চিতকরণ
              </DialogTitle>
              <DialogDescription className="text-xs">
                এই ছাত্রের রেকর্ড সফট ডিলিট করা হবে। আর্থিক লেনদেন ও ঐতিহাসিক হিসাব নিরাপদ থাকবে।
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} className="text-xs">
                আগে ফিরে যান
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteDeleteStudentPending(deleteStudent)}
                className="text-xs font-bold"
              >
                {deleteStudent.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> ডিলিট হচ্ছে...
                  </>
                ) : (
                  "ডিলিট নিশ্চিত করুন"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function deleteDeleteStudentPending(deleteStudent: any) {
  return deleteStudent.isPending;
}
