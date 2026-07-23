"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileText, Plus, Loader2, RefreshCw, Trash2, Edit, Download, Eye, EyeOff } from "lucide-react";
import { useAdminNotices, useCreateNotice, useUpdateNotice, useDeleteNotice, NoticeItem } from "@/hooks/useCms";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AdminNoticesPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const { data, isLoading, refetch } = useAdminNotices(page);
  const notices = data?.notices || [];

  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();
  const deleteNotice = useDeleteNotice();

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeItem | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("GENERAL");
  const [isPublished, setIsPublished] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const handleOpenModal = (notice?: NoticeItem) => {
    if (notice) {
      setEditingNotice(notice);
      setTitle(notice.title);
      setContent(notice.content);
      setType(notice.type);
      setIsPublished(notice.isPublished);
      setFile(null);
    } else {
      setEditingNotice(null);
      setTitle("");
      setContent("");
      setType("GENERAL");
      setIsPublished(true);
      setFile(null);
    }
    setIsOpen(true);
  };

  const handleTogglePublish = async (notice: NoticeItem) => {
    const actionText = !notice.isPublished
      ? "আপনি কি নিশ্চিত যে এই নোটিশটি সর্বসাধারণের জন্য প্রকাশ (Publish) করতে চান?"
      : "আপনি কি নিশ্চিত যে এই নোটিশটি অপ্রকাশিত (Unpublish) করতে চান?";

    if (!confirm(actionText)) return;

    const formData = new FormData();
    formData.append("title", notice.title);
    formData.append("content", notice.content);
    formData.append("type", notice.type);
    formData.append("isPublished", String(!notice.isPublished));

    try {
      await updateNotice.mutateAsync({ id: notice.id, formData });
      toast.success(!notice.isPublished ? "নোটিশ পাবলিক সাইটে প্রকাশ করা হয়েছে" : "নোটিশ অপ্রকাশিত (Draft) রাখা হয়েছে");
      refetch();
    } catch (err: any) {
      toast.error("স্ট্যাটাস পরিবর্তন করা যায়নি");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("শিরোনাম ও বিবরণ পূরণ করুন");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("type", type);
    formData.append("isPublished", String(isPublished));
    if (file) {
      formData.append("attachment", file);
    }

    try {
      if (editingNotice) {
        await updateNotice.mutateAsync({ id: editingNotice.id, formData });
        toast.success("নোটিশ সফলভাবে আপডেট করা হয়েছে");
      } else {
        await createNotice.mutateAsync(formData);
        toast.success("নতুন নোটিশ প্রকাশিত হয়েছে");
      }
      setIsOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "সংরক্ষণ করা যায়নি");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("আপনি কি নিশ্চিতভাবে এই নোটিশটি মুছে ফেলতে চান?")) {
      try {
        await deleteNotice.mutateAsync(id);
        toast.success("নোটিশ মুছে ফেলা হয়েছে");
        refetch();
      } catch (err: any) {
        toast.error(err.message || "মুছে ফেলা যায়নি");
      }
    }
  };

  const filteredNotices = notices.filter(
    (n) => !typeFilter || n.type === typeFilter
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <FileText className="h-6 w-6 text-emerald-600" />
            নোটিশ বোর্ড ব্যবস্থাপনা (Notice CMS)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            পাবলিক নোটিশ প্রকাশ, ড্রাফট ও সংলগ্ন PDF ডকুমেন্টস পরিচালনা করুন।
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="font-medium">
            <RefreshCw className="h-4 w-4 mr-1.5" /> রিফ্রেশ
          </Button>
          <Button
            onClick={() => handleOpenModal()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" /> নতুন নোটিশ
          </Button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex gap-2 flex-wrap">
          {[
            { key: "", label: "সকল নোটিশ" },
            { key: "GENERAL", label: "সাধারণ (General)" },
            { key: "EXAM", label: "পরীক্ষা (Exam)" },
            { key: "HOLIDAY", label: "ছুটি (Holiday)" },
            { key: "ADMISSION", label: "ভর্তি (Admission)" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                typeFilter === tab.key
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Main Notice Table */}
      <Card className="border-slate-200 dark:border-slate-800 bg-card overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={FileText}
                title="কোনো নোটিশ পাওয়া যায়নি"
                description="নতুন নোটিশ যুক্ত করতে উপরের বাটনে ক্লিক করুন।"
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
                    <TableHead className="font-bold">সংযুক্ত ফাইল</TableHead>
                    <TableHead className="text-center font-bold">স্ট্যাটাস</TableHead>
                    <TableHead className="text-right font-bold">তারিখ</TableHead>
                    <TableHead className="text-right font-bold">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredNotices.map((n, idx) => (
                    <TableRow key={n.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <TableCell className="text-center font-bold text-xs text-muted-foreground">
                        {(idx + 1).toLocaleString("bn-BD")}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100 text-xs max-w-[280px] truncate" title={n.title}>
                        {n.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {n.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {n.attachmentUrl ? (
                          <a
                            href={n.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" /> PDF দেখুন
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={n.isPublished ? "default" : "secondary"} className="text-[10px]">
                          {n.isPublished ? "প্রকাশিত (Published)" : "খসড়া (Draft)"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleDateString("bn-BD")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTogglePublish(n)}
                            title={n.isPublished ? "ড্রাফট করুন" : "পাবলিশ করুন"}
                            className="h-8 w-8 p-0"
                          >
                            {n.isPublished ? <EyeOff className="h-4 w-4 text-amber-600" /> : <Eye className="h-4 w-4 text-emerald-600" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenModal(n)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(n.id)}
                            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Notice Form Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingNotice ? "নোটিশ সম্পাদনা করুন" : "নতুন নোটিশ প্রকাশ করুন"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
            <div>
              <Label className="font-semibold block mb-1">নোটিশের শিরোনাম *</Label>
              <Input
                required
                placeholder="যেমন: প্রথম সাময়িক পরীক্ষার সময়সূচি প্রকাশ..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label className="font-semibold block mb-1">ক্যাটাগরি টাইপ *</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded-lg p-2.5 bg-background border-input text-xs font-semibold"
              >
                <option value="GENERAL">সাধারণ (GENERAL)</option>
                <option value="EXAM">পরীক্ষা (EXAM)</option>
                <option value="HOLIDAY">ছুটি (HOLIDAY)</option>
                <option value="ADMISSION">ভর্তি (ADMISSION)</option>
              </select>
            </div>

            <div>
              <Label className="font-semibold block mb-1">নোটিশের বিবরণ *</Label>
              <textarea
                required
                rows={4}
                placeholder="বিস্তারিত বিবরণ লিখুন..."
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                className="w-full border rounded-md p-2.5 text-xs bg-background border-input font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <Label className="font-semibold block mb-1">PDF ফাইল সংযুক্তি (ঐচ্ছিক)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="pubCheck"
                checked={isPublished}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsPublished(e.target.checked)}
                className="rounded border-input text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="pubCheck" className="font-medium cursor-pointer">
                সরাসরি পাবলিক ওয়েবসাইটে প্রকাশ করুন (isPublished)
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                বাতিল
              </Button>
              <Button
                type="submit"
                disabled={createNotice.isPending || updateNotice.isPending}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                {createNotice.isPending || updateNotice.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : null}
                {editingNotice ? "আপডেট করুন" : "নোটিশ প্রকাশ করুন"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
