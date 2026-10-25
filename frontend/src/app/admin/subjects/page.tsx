"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BookMarked, Plus, Loader2, BookOpen } from "lucide-react";
import { useSubjects, useCreateSubject, useClasses } from "@/hooks/useAcademic";
import { toast } from "sonner";

export default function SubjectsPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const { data: subjects, isLoading } = useSubjects(selectedClassId || undefined);
  const { data: classes } = useClasses();
  const createSubject = useCreateSubject();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [classId, setClassId] = useState("");

  const handleCreate = async () => {
    if (!name || !classId) {
      toast.error("বিষয়ের নাম এবং শ্রেণী নির্বাচন করুন");
      return;
    }
    try {
      await createSubject.mutateAsync({ name, code: code || undefined, classId });
      toast.success("বিষয় সফলভাবে তৈরি হয়েছে");
      setOpen(false);
      setName("");
      setCode("");
      setClassId("");
    } catch (err: any) {
      toast.error(err.message || "বিষয় তৈরি করা যায়নি");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-primary" />
            বিষয় ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground">শ্রেণী ভিত্তিক বিষয় সমূহ পরিচালনা করুন</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" /> নতুন বিষয়
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন বিষয় তৈরি</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>বিষয়ের নাম</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: আরবী, বাংলা" />
              </div>
              <div className="space-y-2">
                <Label>বিষয় কোড (ঐচ্ছিক)</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="যেমন: ARB-101" />
              </div>
              <div className="space-y-2">
                <Label>শ্রেণী</Label>
                <select value={classId} onChange={(e) => setClassId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                  <option value="">শ্রেণী নির্বাচন করুন</option>
                  {classes?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>বাতিল</DialogClose>
              <Button onClick={handleCreate} disabled={createSubject.isPending}>
                {createSubject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                তৈরি করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={!selectedClassId ? "default" : "outline"} size="sm"
          onClick={() => setSelectedClassId("")}>সব শ্রেণী</Button>
        {classes?.map((c) => (
          <Button key={c.id} variant={selectedClassId === c.id ? "default" : "outline"} size="sm"
            onClick={() => setSelectedClassId(c.id)}>{c.name}</Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">লোড হচ্ছে...</span>
            </div>
          ) : !subjects?.length ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">কোনো বিষয় নেই</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>বিষয়ের নাম</TableHead>
                  <TableHead>কোড</TableHead>
                  <TableHead>শ্রেণী</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subj, idx) => (
                  <TableRow key={subj.id}>
                    <TableCell>{(idx + 1).toLocaleString("bn-BD")}</TableCell>
                    <TableCell className="font-medium">{subj.name}</TableCell>
                    <TableCell className="text-muted-foreground">{subj.code || "—"}</TableCell>
                    <TableCell>{subj.class?.name || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
