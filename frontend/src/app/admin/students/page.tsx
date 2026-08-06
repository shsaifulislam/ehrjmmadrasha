"use client";

import { useState } from "react";
import { Users, GraduationCap, Plus, Eye, Edit, Trash2, ChevronRight, Upload, Filter, CheckCircle, Clock } from "lucide-react";
import { useStudents, useClasses, useSessions, useCreateStudent, useDeleteStudent } from "@/hooks/useAcademic";

// Shared Components
import { AppButton } from "@/components/shared/AppButton";
import { AppBadge } from "@/components/shared/AppBadge";
import { AppStats } from "@/components/shared/AppStats";
import { AppTable, Column } from "@/components/shared/AppTable";
import { AppModal } from "@/components/shared/AppModal";
import { AppConfirm } from "@/components/shared/AppConfirm";
import { AppSearch } from "@/components/shared/AppSearch";
import { AppExport } from "@/components/shared/AppExport";
import { AppForm } from "@/components/shared/AppForm";
import { AppInput } from "@/components/shared/AppInput";
import { AppAvatar } from "@/components/shared/AppAvatar";
import { AppPermission } from "@/components/shared/AppPermission";
import { toast } from "sonner";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewStudent, setViewStudent] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: classes } = useClasses();
  const { data: sessions } = useSessions();
  const { data: studentData, isLoading, refetch } = useStudents({
    page,
    limit: 15,
    search: search.trim() || undefined,
    classId: selectedClassId || undefined,
    sessionId: selectedSessionId || undefined,
  });

  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();

  const studentsList = Array.isArray(studentData) ? studentData : (studentData as any)?.students || (studentData as any)?.data || [];

  const columns: Column<any>[] = [
    {
      key: "nameBn",
      title: "শিক্ষার্থীর নাম",
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <AppAvatar name={row.nameBn} src={row.photoUrl} size="sm" />
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100">{row.nameBn}</div>
            <div className="text-[10px] text-slate-400 font-mono">{row.studentId}</div>
          </div>
        </div>
      ),
    },
    {
      key: "roll",
      title: "রোল",
      render: (row: any) => <span className="font-bold font-mono text-xs">{row.roll}</span>,
    },
    {
      key: "class",
      title: "শ্রেণী",
      render: (row: any) => <span>{row.class?.name || "N/A"}</span>,
    },
    {
      key: "guardian",
      title: "অভিভাবক ও ফোন",
      render: (row: any) => (
        <div>
          <div className="text-xs font-semibold">{row.guardian?.name || "N/A"}</div>
          <div className="text-[10px] text-slate-400 font-mono">{row.guardian?.phone || "N/A"}</div>
        </div>
      ),
    },
    {
      key: "status",
      title: "অবস্থা",
      render: (row: any) => (
        <AppBadge variant={row.isActive !== false ? "success" : "danger"}>
          {row.isActive !== false ? "সক্রিয়" : "নিষ্ক্রিয়"}
        </AppBadge>
      ),
    },
    {
      key: "actions",
      title: "অ্যাকশন",
      render: (row: any) => (
        <div className="flex items-center gap-1">
          <AppButton
            variant="ghost"
            size="sm"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => window.location.href = `/admin/students/${row.id}`}
          />
          <AppButton
            variant="ghost"
            size="sm"
            icon={<Edit className="h-3.5 w-3.5" />}
            onClick={() => window.location.href = `/admin/students/${row.id}`}
          />
          <AppButton
            variant="ghost"
            size="sm"
            icon={<Trash2 className="h-3.5 w-3.5 text-red-500" />}
            onClick={() => setDeleteId(row.id)}
          />
        </div>
      ),
    },
  ];

  const [formNameBn, setFormNameBn] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formRoll, setFormRoll] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formGuardianName, setFormGuardianName] = useState("");
  const [formGuardianPhone, setFormGuardianPhone] = useState("");

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameBn || !formGuardianPhone || !formClassId) {
      toast.error("প্রয়োজনীয় তথ্য প্রদান করুন");
      return;
    }
    try {
      await createStudent.mutateAsync({
        nameBn: formNameBn,
        nameEn: formNameEn,
        roll: Number(formRoll) || 1,
        classId: formClassId,
        guardianName: formGuardianName,
        guardianPhone: formGuardianPhone,
      });
      toast.success("শিক্ষার্থী সফলভাবে সিস্টেমে যুক্ত হয়েছে!");
      setIsAddModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "শিক্ষার্থী তৈরি করা যায়নি");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteStudent.mutateAsync(deleteId);
      toast.success("শিক্ষার্থীর রেকর্ড ডিলিট/ইনঅ্যাক্টিভ করা হয়েছে");
      setDeleteId(null);
      refetch();
    } catch (err: any) {
      toast.error("ডিলিট করা সম্ভব হয়নি");
    }
  };

  return (
    <AppPermission permission="manage_students">
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>ড্যাশবোর্ড</span>
            <ChevronRight className="h-3 w-3" />
            <span>অ্যাডমিন</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-bold text-slate-700 dark:text-slate-200">শিক্ষার্থী ডিরেক্টরি</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                শিক্ষার্থী মূল কেন্দ্র (Student Core Management)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ১৫-পয়েন্ট স্ট্যান্ডার্ড অনুযায়ী শিক্ষার্থী প্রোফাইল, প্রমোশন, টিসি ও স্টুডেন্ট৩৬০ ম্যানেজমেন্ট।
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AppButton
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setIsAddModalOpen(true)}
              >
                নতুন শিক্ষার্থী
              </AppButton>
              <AppExport onExport={(format) => window.open(`/api/admin/students/export?format=${format}`, "_blank")} />
            </div>
          </div>
        </div>

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AppStats
            title="মোট শিক্ষার্থী"
            value={studentsList.length}
            subtitle="সক্রিয় শিক্ষার্থী সংখ্যা"
            icon={<Users className="h-5 w-5 text-blue-600" />}
          />
          <AppStats
            title="উপস্থিতি হার"
            value="৯৪.২%"
            subtitle="চলতি মাসের গড় উপস্থিতি"
            icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
          />
          <AppStats
            title="পেন্ডিং আবেদন"
            value="১২"
            subtitle="নতুন ভর্তি ক্যু"
            icon={<Clock className="h-5 w-5 text-amber-500" />}
          />
        </div>

        {/* Table & Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <AppSearch value={search} onSearch={setSearch} placeholder="নাম, রোল, স্টুডেন্ট আইডি বা ফোন নম্বর দিয়ে খুঁজুন..." className="max-w-md" />
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2"
              >
                <option value="">সকল শ্রেণী</option>
                {classes?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <AppTable
            data={studentsList}
            columns={columns}
            loading={isLoading}
            selectedIds={selectedIds}
            onSelectRow={(id) => {
              setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
            }}
            getRowId={(row) => row.id}
            emptyTitle="কোনো শিক্ষার্থীর রেকর্ড পাওয়া যায়নি"
          />
        </div>

        {/* Add Student Modal */}
        <AppModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="নতুন শিক্ষার্থী এনরোলমেন্ট"
          size="lg"
        >
          <AppForm
            onSubmit={handleCreateSubmit}
            actions={
              <AppButton type="submit" variant="primary">
                সংরক্ষণ করুন
              </AppButton>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AppInput label="শিক্ষার্থীর নাম (বাংলা) *" required value={formNameBn} onChange={(e) => setFormNameBn(e.target.value)} placeholder="যেমন: আবদুল্লাহ" />
              <AppInput label="শিক্ষার্থীর নাম (ইংরেজি)" value={formNameEn} onChange={(e) => setFormNameEn(e.target.value)} placeholder="Abdullah" />
              <div>
                <label className="text-xs font-semibold block mb-1">শ্রেণী *</label>
                <select
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                  required
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                >
                  <option value="">শ্রেণী নির্বাচন করুন</option>
                  {classes?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <AppInput label="রোল নম্বর *" type="number" required value={formRoll} onChange={(e) => setFormRoll(e.target.value)} placeholder="যেমন: ১" />
              <AppInput label="অভিভাবকের মোবাইল *" required value={formGuardianPhone} onChange={(e) => setFormGuardianPhone(e.target.value)} placeholder="017xxxxxxxx" />
              <AppInput label="অভিভাবকের নাম *" required value={formGuardianName} onChange={(e) => setFormGuardianName(e.target.value)} placeholder="অভিভাবকের নাম" />
            </div>
          </AppForm>
        </AppModal>

        {/* Confirm Delete */}
        <AppConfirm
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDeleteConfirm}
          title="শিক্ষার্থী রেকর্ড মুছে ফেলতে চান?"
          description="এই রেকর্ডটি সিস্টেমে ইনঅ্যাক্টিভ হিসেবে চিহ্নিত হবে।"
        />
      </div>
    </AppPermission>
  );
}
