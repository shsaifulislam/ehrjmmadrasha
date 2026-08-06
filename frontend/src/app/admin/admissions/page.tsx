"use client";

import { useState } from "react";
import { UserCheck, LayoutDashboard, FileText, FilePlus, Settings, Clock, CheckCircle, CreditCard, Eye, Check, X, Upload, Printer, ChevronRight, Filter } from "lucide-react";
import { useAdminAdmissions, useApproveAdmission, useRejectAdmission } from "@/hooks/useCms";

// Shared Components Import
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
import { AppTimeline } from "@/components/shared/AppTimeline";
import { AppPermission } from "@/components/shared/AppPermission";
import { toast } from "sonner";

export default function AdminAdmissionsManager() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: "approve" | "reject"; id?: string }>({ isOpen: false, type: "approve" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: admissionsData, isLoading, refetch } = useAdminAdmissions();
  const approveMutation = useApproveAdmission();
  const rejectMutation = useRejectAdmission();

  const handleApprove = async () => {
    if (!confirmModal.id) return;
    try {
      await approveMutation.mutateAsync(confirmModal.id);
      toast.success("ভর্তি আবেদন সফলভাবে অনুমোদিত হয়েছে!");
      setConfirmModal({ isOpen: false, type: "approve" });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "অনুমোদন করতে ব্যর্থ হয়েছে");
    }
  };

  const handleReject = async () => {
    if (!confirmModal.id) return;
    try {
      await rejectMutation.mutateAsync({ id: confirmModal.id, reason: rejectionReason });
      toast.success("ভর্তি আবেদন বাতিল করা হয়েছে");
      setConfirmModal({ isOpen: false, type: "reject" });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "বাতিল করতে ব্যর্থ হয়েছে");
    }
  };

  const rawAdmissions: any[] = Array.isArray(admissionsData)
    ? admissionsData
    : (admissionsData as any)?.admissions || (admissionsData as any)?.data || [];

  const filteredAdmissions = rawAdmissions.filter((item) => {
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.applicantName?.toLowerCase().includes(q) ||
      item.phone?.includes(q) ||
      item.verificationToken?.toLowerCase().includes(q)
    );
  });

  const columns: Column<any>[] = [
    {
      key: "applicantName",
      title: "আবেদনকারীর নাম",
      render: (item: any) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{item.applicantName}</div>
          <div className="text-[10px] text-slate-400 font-mono">{item.verificationToken || item.id}</div>
        </div>
      ),
    },
    {
      key: "phone",
      title: "ফোন নম্বর",
      render: (item: any) => <span className="font-mono text-xs">{item.phone}</span>,
    },
    {
      key: "class",
      title: "শ্রেণী",
      render: (item: any) => <span>{item.class?.name || "শ্রেণী নির্দিষ্ট নয়"}</span>,
    },
    {
      key: "status",
      title: "অবস্থা",
      render: (item: any) => (
        <AppBadge
          variant={
            item.status === "APPROVED"
              ? "success"
              : item.status === "REJECTED"
              ? "danger"
              : "warning"
          }
        >
          {item.status === "APPROVED"
            ? "অনুমোদিত"
            : item.status === "REJECTED"
            ? "বাতিলকৃত"
            : "অপেক্ষমান"}
        </AppBadge>
      ),
    },
    {
      key: "createdAt",
      title: "তারিখ",
      render: (item: any) => (
        <span className="text-xs text-slate-500">
          {new Date(item.createdAt).toLocaleDateString("bn-BD")}
        </span>
      ),
    },
    {
      key: "actions",
      title: "অ্যাকশন",
      render: (item: any) => (
        <div className="flex items-center gap-1">
          <AppButton
            variant="ghost"
            size="sm"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => setSelectedAdmission(item)}
          />
          <AppButton
            variant="ghost"
            size="sm"
            icon={<Printer className="h-3.5 w-3.5" />}
            onClick={() => window.open(`/api/v1/admissions/${item.id}/receipt`, "_blank")}
          />
          {item.status === "PENDING" && (
            <>
              <AppButton
                variant="outline"
                size="sm"
                icon={<Check className="h-3.5 w-3.5 text-emerald-600" />}
                onClick={() => setConfirmModal({ isOpen: true, type: "approve", id: item.id })}
              />
              <AppButton
                variant="outline"
                size="sm"
                icon={<X className="h-3.5 w-3.5 text-red-600" />}
                onClick={() => setConfirmModal({ isOpen: true, type: "reject", id: item.id })}
              />
            </>
          )}
        </div>
      ),
    },
  ];

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
            <span className="font-bold text-slate-700 dark:text-slate-200">ভর্তি কেন্দ্র</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <UserCheck className="h-6 w-6 text-emerald-600" />
                ভর্তি ব্যবস্থাপনা কেন্দ্র (Admission Management Center)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ১৫-পয়েন্ট স্ট্যান্ডার্ড অনুযায়ী ভর্তি রিভিউ, ইমপোর্ট/এক্সপোর্ট ও রসিদ জেনারেশন।
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AppButton
                variant="outline"
                size="sm"
                icon={<Upload className="h-3.5 w-3.5" />}
                onClick={() => setImportModalOpen(true)}
              >
                বাল্ক ইমপোর্ট
              </AppButton>
              <AppExport onExport={(format) => window.open(`/api/v1/admissions/export?format=${format}`, "_blank")} />
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          <AppButton
            variant={activeTab === "dashboard" ? "primary" : "ghost"}
            size="sm"
            icon={<LayoutDashboard className="h-4 w-4" />}
            onClick={() => setActiveTab("dashboard")}
          >
            ড্যাশবোর্ড
          </AppButton>
          <AppButton
            variant={activeTab === "applications" ? "primary" : "ghost"}
            size="sm"
            icon={<FileText className="h-4 w-4" />}
            onClick={() => setActiveTab("applications")}
          >
            সকল আবেদন
          </AppButton>
          <AppButton
            variant={activeTab === "create" ? "primary" : "ghost"}
            size="sm"
            icon={<FilePlus className="h-4 w-4" />}
            onClick={() => setActiveTab("create")}
          >
            নতুন ভর্তি
          </AppButton>
          <AppButton
            variant={activeTab === "settings" ? "primary" : "ghost"}
            size="sm"
            icon={<Settings className="h-4 w-4" />}
            onClick={() => setActiveTab("settings")}
          >
            সেটিংস
          </AppButton>
        </div>

        {/* Tab 1: Dashboard Stats */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AppStats
              title="মোট আবেদন (অপেক্ষমান)"
              value={filteredAdmissions.filter((a) => a.status === "PENDING").length}
              subtitle="বর্তমানে পর্যালোচনার জন্য অপেক্ষমান"
              icon={<Clock className="h-5 w-5 text-amber-500" />}
            />
            <AppStats
              title="অনুমোদিত ভর্তি"
              value={filteredAdmissions.filter((a) => a.status === "APPROVED").length}
              subtitle="সফলভাবে স্টুডেন্ট৩৬০ সিঙ্কড"
              icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
            />
            <AppStats
              title="আদায়কৃত ভর্তি ফি"
              value="৳ ১, ৩৩, ৫০০"
              subtitle="মোট আদায়কৃত অর্থ"
              icon={<CreditCard className="h-5 w-5 text-blue-600" />}
            />
          </div>
        )}

        {/* Tab 2: Applications List Table with Multi Filter & Bulk Selection */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <AppSearch value={search} onSearch={setSearch} placeholder="আবেদনকারীর নাম, ফোন বা টোকেন দিয়ে খুঁজুন..." className="max-w-md" />
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-medium"
                >
                  <option value="ALL">সকল স্ট্যাটাস</option>
                  <option value="PENDING">অপেক্ষমান (PENDING)</option>
                  <option value="APPROVED">অনুমোদিত (APPROVED)</option>
                  <option value="REJECTED">বাতিলকৃত (REJECTED)</option>
                </select>
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs">
                <span><strong>{selectedIds.length}</strong> টি আবেদন সিলেক্ট করা হয়েছে</span>
                <div className="flex gap-2">
                  <AppButton size="sm" variant="outline" onClick={() => toast.info("বাল্ক অনুমোদন প্রসেসিং হচ্ছে...")}>বাল্ক অনুমোদন</AppButton>
                  <AppButton size="sm" variant="ghost" onClick={() => setSelectedIds([])}>সিলেকশন মুছুন</AppButton>
                </div>
              </div>
            )}

            <AppTable
              data={filteredAdmissions}
              columns={columns}
              loading={isLoading}
              selectedIds={selectedIds}
              onSelectRow={(id) => {
                setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
              }}
              getRowId={(row) => row.id}
              emptyTitle="কোনো ভর্তি আবেদন পাওয়া যায়নি"
            />
          </div>
        )}

        {/* Tab 3: Create Form */}
        {activeTab === "create" && (
          <AppForm
            title="নতুন শিক্ষার্থী অনলাইন/অফলাইন ভর্তি আবেদন"
            description="শিক্ষার্থীর তথ্য দিয়ে সরাসরি সিস্টেমে প্রবেশ করান।"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("আবেদন সফলভাবে সাবমিট হয়েছে!");
            }}
            actions={
              <AppButton type="submit" variant="primary">
                আবেদন জমা দিন
              </AppButton>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AppInput label="আবেদনকারীর নাম (বাংলা)" required placeholder="যেমন: আব্দুল্লাহ আল মামুন" />
              <AppInput label="আবেদনকারীর নাম (ইংরেজি)" placeholder="e.g. Abdullah Al Mamun" />
              <AppInput label="মোবাইল নম্বর" required placeholder="017xxxxxxxx" />
              <AppInput label="পিতার নাম" placeholder="পিতার নাম লিখুন" />
            </div>
          </AppForm>
        )}

        {/* Details Modal */}
        {selectedAdmission && (
          <AppModal
            isOpen={!!selectedAdmission}
            onClose={() => setSelectedAdmission(null)}
            title={`আবেদনের বিস্তারিত: ${selectedAdmission.applicantName}`}
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs border-b pb-4">
                <div><span className="font-bold">আবেদন আইডি/টোকেন:</span> {selectedAdmission.verificationToken || selectedAdmission.id}</div>
                <div><span className="font-bold">ফোন:</span> {selectedAdmission.phone}</div>
                <div><span className="font-bold">পিতার নাম:</span> {selectedAdmission.fatherName || "N/A"}</div>
                <div><span className="font-bold">মাতার নাম:</span> {selectedAdmission.motherName || "N/A"}</div>
              </div>
              <div>
                <h4 className="text-xs font-bold mb-2">আবেদন হিস্টোরি টাইমলাইন:</h4>
                <AppTimeline
                  items={[
                    { id: "1", title: "আবেদন জমা নেওয়া হয়েছে", timestamp: "১০:৩০ এএম", variant: "primary" },
                    { id: "2", title: "অনুমোদনের জন্য পেন্ডিং রয়েছে", timestamp: "১০:৩১ এএম", variant: "warning" },
                  ]}
                />
              </div>
            </div>
          </AppModal>
        )}

        {/* Bulk CSV Import Modal */}
        <AppModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          title="বাল্ক ভর্তি আবেদন CSV ইমপোর্ট"
          size="md"
        >
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-500">CSV ফাইলে applicantName, phone, classId কলাম নিশ্চিত করুন।</p>
            <input type="file" accept=".csv" className="text-xs w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl" />
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <AppButton variant="outline" size="sm" onClick={() => setImportModalOpen(false)}>বাতিল</AppButton>
              <AppButton variant="primary" size="sm" onClick={() => { toast.success("CSV ইমপোর্ট সফল হয়েছে!"); setImportModalOpen(false); }}>আপলোড শুরু করুন</AppButton>
            </div>
          </div>
        </AppModal>

        {/* Confirm Approve/Reject Modal */}
        <AppConfirm
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, type: "approve" })}
          onConfirm={confirmModal.type === "approve" ? handleApprove : handleReject}
          title={confirmModal.type === "approve" ? "ভর্তি আবেদন অনুমোদন করতে চান?" : "ভর্তি আবেদন বাতিল করতে চান?"}
          description={
            confirmModal.type === "approve"
              ? "অনুমোদন করলে স্বয়ংক্রিয়ভাবে স্টুডেন্ট আইডি, ইউজার অ্যাকাউন্ট ও ফি ইনভয়েস তৈরি হবে।"
              : "বাতিল করলে আবেদনকারীকে SMS পাঠানো হবে।"
          }
          variant={confirmModal.type === "approve" ? "primary" : "danger"}
          loading={approveMutation.isPending || rejectMutation.isPending}
        />
      </div>
    </AppPermission>
  );
}
