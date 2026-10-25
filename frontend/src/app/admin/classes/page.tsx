"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { GraduationCap, Plus, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import type { ClassModel } from "@/lib/types";

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [numericValue, setNumericValue] = useState("");

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/academic/classes");
      setClasses(res.data.data || []);
    } catch (err: any) {
      toast.error(err.message || "শ্রেণী তালিকা লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post("/academic/classes", { name, numericValue: Number(numericValue) });
      toast.success("শ্রেণী সফলভাবে তৈরি হয়েছে");
      setName(""); setNumericValue("");
      setDialogOpen(false);
      fetchClasses();
    } catch (err: any) {
      toast.error(err.message || "শ্রেণী তৈরি করা যায়নি");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">শ্রেণী ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground">মাদ্রাসার সকল শ্রেণী পরিচালনা করুন</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> নতুন শ্রেণী</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>নতুন শ্রেণী তৈরি করুন</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>শ্রেণীর নাম *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="দাখিল ১ম বর্ষ" />
              </div>
              <div className="grid gap-2">
                <Label>ক্রমিক নম্বর *</Label>
                <Input type="number" value={numericValue} onChange={e => setNumericValue(e.target.value)} placeholder="1" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">বাতিল</Button>} />
              <Button onClick={handleCreate} disabled={saving || !name || !numericValue}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                সংরক্ষণ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            শ্রেণী তালিকা ({classes.length}টি)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">লোড হচ্ছে...</span>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">কোনো শ্রেণী পাওয়া যায়নি</p>
              <p className="text-sm text-muted-foreground/70 mt-1">নতুন শ্রেণী তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ক্রমিক</TableHead>
                    <TableHead>শ্রেণীর নাম</TableHead>
                    <TableHead>তৈরির তারিখ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.numericValue}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.createdAt ? new Date(c.createdAt).toLocaleDateString("bn-BD") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
