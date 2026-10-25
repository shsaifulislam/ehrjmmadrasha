"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image as ImageIcon, Plus, Loader2, RefreshCw, Trash2, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminGallery, useCreateGalleryItem, useDeleteGalleryItem } from "@/hooks/useCms";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AdminGalleryPage() {
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const { data, isLoading, refetch } = useAdminGallery(page);
  const items = data?.items || [];
  const pagination = data?.pagination;

  const createGallery = useCreateGalleryItem();
  const deleteGallery = useDeleteGalleryItem();

  // Upload Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("CAMPUS");
  const [file, setFile] = useState<File | null>(null);

  // Zoom Lightbox State
  const [zoomImage, setZoomImage] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("শিরোনাম লিখুন");
      return;
    }
    if (!file) {
      toast.error("ছবি আপলোড করা আবশ্যক");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("image", file);

    try {
      await createGallery.mutateAsync(formData);
      toast.success("ছবি গ্যালারিতে সফলভাবে যোগ করা হয়েছে");
      setTitle("");
      setFile(null);
      setIsOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "ছবি আপলোড করা যায়নি");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("আপনি কি নিশ্চিতভাবে এই ছবিটি গ্যালারি থেকে মুছে ফেলতে চান?")) {
      try {
        await deleteGallery.mutateAsync(id);
        toast.success("ছবি মুছে ফেলা হয়েছে");
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
            <ImageIcon className="h-6 w-6 text-emerald-600" />
            ফটো গ্যালারি ব্যবস্থাপনা (Gallery CMS)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            ক্যাম্পাস, অনুষ্ঠান ও পুরস্কার বিতরণীর ছবি আপলোড ও ক্যাটাগরি অনুসারে সাজান।
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
            <Plus className="h-4 w-4 mr-1.5" /> ছবি আপলোড
          </Button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex gap-2 flex-wrap">
          {[
            { key: "", label: "সকল ছবি" },
            { key: "CAMPUS", label: "ক্যাম্পাস (CAMPUS)" },
            { key: "EVENT", label: "অনুষ্ঠান (EVENT)" },
            { key: "AWARD", label: "পুরস্কার (AWARD)" },
            { key: "CLASSROOM", label: "ক্লাসরুম (CLASSROOM)" },
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

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-800 py-12">
          <CardContent>
            <EmptyState
              icon={ImageIcon}
              title="গ্যালারিতে কোনো ছবি পাওয়া যায়নি"
              description="ছবি আপলোড করতে উপরের বাটনে ক্লিক করুন।"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden border-slate-200 dark:border-slate-800 group relative">
              <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setZoomImage(item)}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="font-bold text-xs truncate" title={item.title}>
                  {item.title}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <Badge variant="outline" className="text-[10px]">
                    {item.category}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(item.uploadedAt || Date.now()).toLocaleDateString("bn-BD")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

      {/* Image Upload Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>গ্যালারিতে নতুন ছবি আপলোড করুন</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold block mb-1">ছবির শিরোনাম *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: বার্ষিক ক্রীড়া প্রতিযোগিতা ২০২৬"
                required
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">ক্যাটাগরি *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-lg p-2.5 bg-background border-input font-semibold"
              >
                <option value="CAMPUS">ক্যাম্পাস ও ভবন (CAMPUS)</option>
                <option value="EVENT">অনুষ্ঠান (EVENT)</option>
                <option value="AWARD">পুরস্কার বিতরণী (AWARD)</option>
                <option value="CLASSROOM">ক্লাসরুম (CLASSROOM)</option>
                <option value="OTHER">অন্যান্য (OTHER)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">ছবি আপলোড করুন (Image File) *</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                বাতিল
              </Button>
              <Button
                type="submit"
                disabled={createGallery.isPending}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                {createGallery.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                ছবি আপলোড করুন
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox Modal */}
      {zoomImage && (
        <Dialog open={!!zoomImage} onOpenChange={() => setZoomImage(null)}>
          <DialogContent className="sm:max-w-3xl p-2 bg-black text-white">
            <div className="relative w-full aspect-video">
              <img src={zoomImage.imageUrl} alt={zoomImage.title} className="object-contain w-full h-full" />
            </div>
            <p className="p-2 text-center text-xs font-bold text-slate-200">{zoomImage.title}</p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
