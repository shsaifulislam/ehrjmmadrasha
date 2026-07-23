"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  UserCheck,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Calendar,
  MapPin,
  FileText,
  User
} from "lucide-react";
import { useAdminAdmissions, useApproveAdmission, useRejectAdmission, AdmissionItem } from "@/hooks/useCms";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "অপেক্ষমান", variant: "outline" },
  APPROVED: { label: "অনুমোদিত", variant: "default" },
  REJECTED: { label: "বাতিলকৃত", variant: "destructive" },
};

export default function AdminAdmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [page, setPage] = useState<number>(1);
  const { data, isLoading, refetch } = useAdminAdmissions(statusFilter || undefined, page);
  const admissions = data?.admissions || [];
  const pagination = data?.pagination;

  const approveAdmission = useApproveAdmission();
  const rejectAdmission = useRejectAdmission();

  // Modals & Selection States
  const [selectedItem, setSelectedItem] = useState<AdmissionItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState<boolean>(false);

  const handleApproveConfirm = async () => {
    if (!selectedItem) return;
    try {
      const res = await approveAdmission.mutateAsync(selectedItem.id);
      toast.success(res.data?.message || "ভর্তি আবেদন সফলভাবে অনুমোদিত হয়েছে এবং ছাত্র আইডি তৈরি হয়েছে");
      setIsApproveConfirmOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "অনুমোদন করা যায়নি");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !rejectReason.trim()) {
      toast.error("বাতিলের কারণ উল্লেখ করুন");
      return;
    }

    try {
      await rejectAdmission.mutateAsync({ id: selectedItem.id, reason: rejectReason });
      toast.success("আবেদনটি বাতিল করা হয়েছে");
      setIsRejectModalOpen(false);
      setSelectedItem(null);
      setRejectReason("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "বাতিল করা যায়নি");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <UserCheck className="h-6 w-6 text-emerald-600" />
            অনলাইন ভর্তি আবেদন কিউ (Admissions Queue)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            অনলাইনে জমাকৃত ভর্তি আবেদন পর্যালোচনা, অনুমোদন ও বাতিল করুন।
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="shrink-0 font-medium">
          <RefreshCw className="h-4 w-4 mr-2" /> রিফ্রেশ
        </Button>
      </div>

      {/* Category Filter Tabs */}
      <div className="bg-card rounded-xl border p-3 shadow-2xs">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "PENDING", label: "অপেক্ষমান (PENDING)" },
            { key: "APPROVED", label: "অনুমোদিত (APPROVED)" },
            { key: "REJECTED", label: "বাতিলকৃত (REJECTED)" },
            { key: "", label: "সকল আবেদন" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === tab.key
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-card overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b">
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-4 w-1/6 bg-muted rounded" />
                  <div className="h-8 w-24 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : !admissions.length ? (
            <div className="py-12">
              <EmptyState
                icon={UserCheck}
                title="কোনো ভর্তি আবেদন পাওয়া যায়নি"
                description="নির্বাচিত স্ট্যাটাস ফিল্টারে বর্তমানে কোনো অনলাইন ভর্তি আবেদন জমা নেই।"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
                  <TableRow>
                    <TableHead className="w-12 text-center font-bold">#</TableHead>
                    <TableHead className="font-bold">শিক্ষার্থীর নাম</TableHead>
                    <TableHead className="font-bold">শ্রেণী</TableHead>
                    <TableHead className="font-bold">অভিভাবক মোবাইল</TableHead>
                    <TableHead className="text-center font-bold">স্ট্যাটাস</TableHead>
                    <TableHead className="text-right font-bold">আবেদনের তারিখ</TableHead>
                    <TableHead className="text-right font-bold">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {admissions.map((adm, idx) => {
                    const st = STATUS_MAP[adm.status] || STATUS_MAP.PENDING;
                    return (
                      <TableRow key={adm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <TableCell className="text-center font-bold text-xs text-muted-foreground">
                          {((page - 1) * 30 + idx + 1).toLocaleString("bn-BD")}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {adm.applicantName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px] font-medium border-emerald-600/40 text-emerald-800 dark:text-emerald-300">
                            {adm.class?.name || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">
                          {adm.phone}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={st.variant} className="text-[11px]">
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground font-mono">
                          {new Date(adm.createdAt).toLocaleDateString("bn-BD")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedItem(adm)}
                            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> বিস্তারিত
                          </Button>
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

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="text-xs font-medium"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> পূর্ববর্তী পেজ
          </Button>
          <span className="text-xs text-muted-foreground font-medium">
            পেজ {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
            className="text-xs font-medium"
          >
            পরবর্তী পেজ <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* View Application Detail Modal */}
      {selectedItem && !isRejectModalOpen && !isApproveConfirmOpen && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                ভর্তি আবেদন পর্যালোচনা
              </DialogTitle>
              <DialogDescription className="text-xs">
                আবেদনকারীর তথ্য যাচাই করুন এবং অনুমোদন বা বাতিল সিদ্ধান্ত প্রদান করুন।
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Applicant Header Profile Card */}
              <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border">
                {selectedItem.photoUrl ? (
                  <img
                    src={selectedItem.photoUrl}
                    alt="Applicant Photo"
                    className="h-16 w-16 rounded-full object-cover border-2 border-emerald-600 shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300 text-2xl shrink-0">
                    {selectedItem.applicantName[0]}
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {selectedItem.applicantName}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className="bg-emerald-700 text-white text-[10px]">
                      শ্রেণী: {selectedItem.class?.name || "—"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      লিঙ্গ: {selectedItem.gender === "MALE" ? "ছাত্র" : "ছাত্রী"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="text-xs space-y-2 border p-4 rounded-xl bg-card">
                <div className="grid grid-cols-2 gap-2 pb-2 border-b">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">পিতার নাম</span>
                    <strong className="text-slate-800 dark:text-slate-200">{selectedItem.fatherName || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">মাতার নাম</span>
                    <strong className="text-slate-800 dark:text-slate-200">{selectedItem.motherName || "—"}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pb-2 border-b">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">অভিভাবক মোবাইল</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedItem.phone}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">জন্ম তারিখ</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedItem.dateOfBirth
                        ? new Date(selectedItem.dateOfBirth).toLocaleDateString("bn-BD")
                        : "—"}
                    </strong>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">ঠিকানা</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedItem.address || "—"}</strong>
                </div>

                {selectedItem.rejectionReason && (
                  <div className="pt-2 border-t text-rose-600 dark:text-rose-400">
                    <span className="block text-[11px] font-bold">বাতিলকরণের কারণ:</span>
                    <p className="italic">{selectedItem.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedItem.status === "PENDING" ? (
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-bold"
                    onClick={() => setIsRejectModalOpen(true)}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> বাতিল করুন
                  </Button>
                  <Button
                    onClick={() => setIsApproveConfirmOpen(true)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> অনুমোদন প্রদান করুন
                  </Button>
                </div>
              ) : (
                <div className="text-center pt-2">
                  <Badge variant={STATUS_MAP[selectedItem.status]?.variant as any}>
                    আবেদনের স্ট্যাটাস: {STATUS_MAP[selectedItem.status]?.label}
                  </Badge>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Modal for Approval */}
      {isApproveConfirmOpen && selectedItem && (
        <Dialog open={isApproveConfirmOpen} onOpenChange={setIsApproveConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-emerald-700 font-bold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                ভর্তি আবেদন অনুমোদন নিশ্চিতকরণ
              </DialogTitle>
              <DialogDescription className="text-xs">
                আবেদনটি অনুমোদন করলে স্বয়ংক্রিয়ভাবে ছাত্রের ডাটাবেজ একাউন্ট ও ইউনিক রোল নম্বর তৈরি হবে।
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 text-xs space-y-2">
              <p>
                <strong>আবেদনকারী:</strong> {selectedItem.applicantName}
              </p>
              <p>
                <strong>শ্রেণী:</strong> {selectedItem.class?.name || "—"}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsApproveConfirmOpen(false)} className="text-xs font-medium">
                ফিরে যান
              </Button>
              <Button
                onClick={handleApproveConfirm}
                disabled={approveAdmission.isPending}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
              >
                {approveAdmission.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> অনুমোদন হচ্ছে...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1.5" /> অনুমোদন নিশ্চিত করুন
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Reason Modal */}
      {isRejectModalOpen && selectedItem && (
        <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-rose-600 font-bold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-rose-600" />
                আবেদন বাতিলের কারণ
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRejectSubmit} className="space-y-4 py-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  বাতিলকরণের কারণ উল্লেখ করুন *
                </label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="যেমন: বয়সসীমা উত্তীর্ণ বা সিট খালি না থাকার কারণে"
                  required
                  className="text-xs sm:text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="text-xs font-medium"
                >
                  আগে ফিরে যান
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={rejectAdmission.isPending}
                  className="text-xs font-bold"
                >
                  {rejectAdmission.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> বাতিল হচ্ছে...
                    </>
                  ) : (
                    "আবেদন বাতিল নিশ্চিত করুন"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
