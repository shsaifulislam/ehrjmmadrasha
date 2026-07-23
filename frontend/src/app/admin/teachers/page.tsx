"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserCog, Plus, Search, Trash2, Pencil, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import type { Teacher } from "@/lib/types";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    teacherId: "", nameBn: "", phone: "", designation: "", username: "", password: ""
  });

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/teachers", { params: { search, limit: 50 } });
      setTeachers(res.data.data.teachers);
      setTotal(res.data.data.total);
    } catch (err: any) {
      toast.error(err.message || "শিক্ষক তালিকা লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeachers(); }, [search]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post("/admin/teachers", form);
      toast.success("শিক্ষক সফলভাবে যোগ করা হয়েছে");
      setForm({ teacherId: "", nameBn: "", phone: "", designation: "", username: "", password: "" });
      setDialogOpen(false);
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.message || "শিক্ষক যোগ করা যায়নি");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি এই শিক্ষককে মুছে ফেলতে চান?")) return;
    try {
      await api.delete(`/admin/teachers/${id}`);
      toast.success("শিক্ষক মুছে ফেলা হয়েছে");
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.message || "মুছে ফেলা যায়নি");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">শিক্ষক তালিকা</h1>
          <p className="text-muted-foreground">সকল শিক্ষকের তথ্য পরিচালনা করুন</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={
            <Button><Plus className="mr-2 h-4 w-4" /> নতুন শিক্ষক</Button>
          } />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>নতুন শিক্ষক যোগ করুন</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>শিক্ষক আইডি *</Label>
                <Input value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })} placeholder="TCH-001" />
              </div>
              <div className="grid gap-2">
                <Label>নাম (বাংলা) *</Label>
                <Input value={form.nameBn} onChange={e => setForm({ ...form, nameBn: e.target.value })} placeholder="মাওলানা আব্দুল করিম" />
              </div>
              <div className="grid gap-2">
                <Label>ফোন *</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01700000000" />
              </div>
              <div className="grid gap-2">
                <Label>পদবী</Label>
                <Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="সিনিয়র শিক্ষক" />
              </div>
              <div className="grid gap-2">
                <Label>ইউজারনেম *</Label>
                <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="teacher01" />
              </div>
              <div className="grid gap-2">
                <Label>পাসওয়ার্ড *</Label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="ন্যূনতম ৬ অক্ষর" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">বাতিল</Button>} />
              <Button onClick={handleCreate} disabled={saving || !form.teacherId || !form.nameBn || !form.phone || !form.username || !form.password}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                সংরক্ষণ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="নাম, আইডি বা ফোন দিয়ে খুঁজুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            শিক্ষক ({total} জন)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">লোড হচ্ছে...</span>
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">কোনো শিক্ষক পাওয়া যায়নি</p>
              <p className="text-sm text-muted-foreground/70 mt-1">নতুন শিক্ষক যোগ করতে উপরের বাটনে ক্লিক করুন</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>আইডি</TableHead>
                    <TableHead>নাম</TableHead>
                    <TableHead>ফোন</TableHead>
                    <TableHead>পদবী</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.teacherId}</TableCell>
                      <TableCell>{t.nameBn}</TableCell>
                      <TableCell>{t.phone}</TableCell>
                      <TableCell>{t.designation || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={t.user?.isActive ? "default" : "secondary"}>
                          {t.user?.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t.id)}>
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
    </div>
  );
}
