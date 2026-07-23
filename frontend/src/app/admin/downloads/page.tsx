"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FolderDown, Plus, Loader2, RefreshCw, Trash2, Download, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminDownloads, useCreateDownloadItem, useDeleteDownloadItem } from "@/hooks/useCms";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AdminDownloadsPage() {
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const { data, isLoading, refetch } = useAdminDownloads(page);
  const items = data?.items || [];
  const pagination = data?.pagination;

  const createDownload = useCreateDownloadItem();
  const deleteDownload = useDeleteDownloadItem();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("ROUTINE");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("শিরোনাম লিখুন");
      return;
    }
    if (!file) {
      toast.error("ফাইল আপলোড করা আবশ্যক");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("document", file);

    try {
      await createDownload.mutateAsync(formData);
      toast.success("ডকুমেন্ট সফলভাবে ডাউনলোড সেন্টারে যোগ করা হয়েছে");
      setTitle("");
      setFile(null);
      setIsOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "ফাইল আপলোড করা যায়নি");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("আপনি কি নিশ্চিতভাবে এই ডকুমেন্টটি মুছে ফেলতে চান?")) {
      try {
        await deleteDownload.mutateAsync(id);
        toast.success("ডকুমেন্ট মুছে ফেলা হয়েছে");
        refetch();
      } catch (err: any) {
        toast.error(err.message || "মুছে ফেলা যায়নি");
      }
    }
  };

  const filteredItems = items.filter(
    (item) => !categoryFilter || item.category === categoryFilter
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <FolderDown className="h-6 w-6 text-emerald-600" />
            ডাউনলোড সেন্টার ব্যবস্থাপনা (Download CMS)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            সিলেবাস, রুটিন, কারিকুলাম ও প্রাতিষ্ঠানিক ফরম আপলোড ও পরিচালনা করুন।
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="font-medium">
            <RefreshCw className="h-4 w-4 mr-1.5" /> রিফ্রেশ
          </Button>
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" /> নতুন ফাইল আপলোড
          </Button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex gap-2 flex-wrap">
          {[
            { key: "", label: "সকল ফাইল" },
            { key: "ROUTINE", label: "রুটিন (ROUTINE)" },
            { key: "SYLLABUS", label: "সিলেবাস (SYLLABUS)" },
            { key: "FORM", label: "ফরম (FORM)" },
            { key: "OTHER", label: "অন্যান্য (OTHER)" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategoryFilter(tab.key)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                categoryFilter === tab.key
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Main Download Table */}
      <Card className="border-slate-200 dark:border-slate-800 bg-card overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={FolderDown}
                title="কোনো ফাইল পাওয়া যায়নি"
                description="নতুন ফাইল যোগ করতে উপরের বাটনে ক্লিক করুন।"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
                  <TableRow>
                    <TableHead className="w-12 text-center font-bold">#</TableHead>
                    <TableHead className="font-bold">শিরোনাম (Title)</TableHead>
                    <TableHead className="font-bold">ক্যাটাগরি</TableHead>
                    <TableHead className="font-bold">ডাউনলোড ফাইল</TableHead>
                    <TableHead className="text-right font-bold">তারিখ</TableHead>
                    <TableHead className="text-right font-bold">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <TableCell className="text-center font-bold text-xs text-muted-foreground">
                        {(idx + 1).toLocaleString("bn-BD")}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {item.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs font-bold text-emerald-700 hover:underline"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" /> ফাইল ওপেন / ডাউনলোড
                        </a>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString("bn-BD")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-rose-600 hover:text-rose-700 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="text-xs font-medium"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> পূর্ববর্তী পেজ
          </Button>
          <span className="text-xs text-muted-foreground font-medium">
            পেজ {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
            className="text-xs font-medium"
          >
            পরবর্তী পেজ <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Upload File Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ডাউনলোড সেন্টারে নতুন ফাইল যোগ করুন</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
            <div>
              <Label className="font-semibold block mb-1">ডকুমেন্টের শিরোনাম *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: প্রথম সাময়িক পরীক্ষার রুটিন ২০২৬"
                required
              />
            </div>

            <div>
              <Label className="font-semibold block mb-1">ক্যাটাগরি *</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-lg p-2.5 bg-background border-input font-semibold text-xs"
              >
                <option value="ROUTINE">পরীক্ষা ও ক্লাসের রুটিন (ROUTINE)</option>
                <option value="SYLLABUS">পাঠ্যক্রম ও সিলেবাস (SYLLABUS)</option>
                <option value="FORM">প্রাতিষ্ঠানিক ফরম (FORM)</option>
                <option value="OTHER">অন্যান্য ডকুমেন্ট (OTHER)</option>
              </select>
            </div>

            <div>
              <Label className="font-semibold block mb-1">ফাইল আপলোড করুন (PDF, DOCX) *</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                বাতিল
              </Button>
              <Button
                type="submit"
                disabled={createDownload.isPending}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                {createDownload.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                ফাইল যোগ করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
