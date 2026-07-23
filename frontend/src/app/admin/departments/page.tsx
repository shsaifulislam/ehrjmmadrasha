"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BookOpen, Plus, Trash2, Loader2, Users } from "lucide-react";
import { useDepartments, useCreateDepartment } from "@/hooks/useAcademic";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const { data: departments, isLoading } = useDepartments();
  const createDept = useCreateDepartment();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");

  const handleCreate = async () => {
    if (!name || !type) {
      toast.error("সব ফিল্ড পূরণ করুন");
      return;
    }
    try {
      await createDept.mutateAsync({ name, type });
      toast.success("বিভাগ সফলভাবে তৈরি হয়েছে");
      setOpen(false);
      setName("");
      setType("");
    } catch (err: any) {
      toast.error(err.message || "বিভাগ তৈরি করা যায়নি");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            বিভাগ ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground">মাদ্রাসার সকল বিভাগ পরিচালনা করুন</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" /> নতুন বিভাগ
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>নতুন বিভাগ তৈরি</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>বিভাগের নাম</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: নূরানী বিভাগ" />
              </div>
              <div className="space-y-2">
                <Label>ধরন</Label>
                <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="যেমন: কওমী, নূরানী, হিফজ" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>বাতিল</DialogClose>
              <Button onClick={handleCreate} disabled={createDept.isPending}>
                {createDept.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                তৈরি করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">লোড হচ্ছে...</span>
            </div>
          ) : !departments?.length ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">কোনো বিভাগ নেই</p>
              <p className="text-sm text-muted-foreground/70">উপরে "নতুন বিভাগ" বাটনে ক্লিক করে বিভাগ তৈরি করুন</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>বিভাগের নাম</TableHead>
                  <TableHead>ধরন</TableHead>
                  <TableHead className="text-center">ছাত্র সংখ্যা</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept, idx) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{(idx + 1).toLocaleString("bn-BD")}</TableCell>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>{dept.type}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Users className="h-3.5 w-3.5" />
                        {(dept._count?.students ?? 0).toLocaleString("bn-BD")}
                      </span>
                    </TableCell>
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
