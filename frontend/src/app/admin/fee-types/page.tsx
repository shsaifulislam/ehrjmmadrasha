"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Banknote, Plus, Loader2, Trash2 } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import type { FeeType } from "@/lib/types";

export default function FeeTypesPage() {
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [defaultAmount, setDefaultAmount] = useState("");

  const fetchFeeTypes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/fee-types");
      setFeeTypes(res.data.data || []);
    } catch (err: any) {
      toast.error(err.message || "ফি টাইপ তালিকা লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeeTypes(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post("/admin/fee-types", { name, defaultAmount: Number(defaultAmount) });
      toast.success("ফি টাইপ সফলভাবে তৈরি হয়েছে");
      setName(""); setDefaultAmount("");
      setDialogOpen(false);
      fetchFeeTypes();
    } catch (err: any) {
      toast.error(err.message || "ফি টাইপ তৈরি করা যায়নি");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি এই ফি টাইপ মুছে ফেলতে চান?")) return;
    try {
      await api.delete(`/admin/fee-types/${id}`);
      toast.success("ফি টাইপ মুছে ফেলা হয়েছে");
      fetchFeeTypes();
    } catch (err: any) {
      toast.error(err.message || "মুছে ফেলা যায়নি");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ফি টাইপ ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground">মাসিক ফি, ভর্তি ফি, পরীক্ষা ফি ইত্যাদি পরিচালনা করুন</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> নতুন ফি টাইপ</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>নতুন ফি টাইপ তৈরি করুন</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>ফি টাইপের নাম *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="মাসিক ফি" />
              </div>
              <div className="grid gap-2">
                <Label>ডিফল্ট পরিমাণ (৳) *</Label>
                <Input type="number" value={defaultAmount} onChange={e => setDefaultAmount(e.target.value)} placeholder="500" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">বাতিল</Button>} />
              <Button onClick={handleCreate} disabled={saving || !name || !defaultAmount}>
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
            <Banknote className="h-5 w-5 text-primary" />
            ফি টাইপ তালিকা ({feeTypes.length}টি)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">লোড হচ্ছে...</span>
            </div>
          ) : feeTypes.length === 0 ? (
            <div className="text-center py-12">
              <Banknote className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">কোনো ফি টাইপ পাওয়া যায়নি</p>
              <p className="text-sm text-muted-foreground/70 mt-1">নতুন ফি টাইপ তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ফি টাইপ</TableHead>
                    <TableHead>ডিফল্ট পরিমাণ</TableHead>
                    <TableHead>তৈরির তারিখ</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeTypes.map((ft) => (
                    <TableRow key={ft.id}>
                      <TableCell className="font-medium">{ft.name}</TableCell>
                      <TableCell>৳ {Number(ft.defaultAmount).toLocaleString("bn-BD")}</TableCell>
                      <TableCell className="text-muted-foreground">{ft.createdAt ? new Date(ft.createdAt).toLocaleDateString("bn-BD") : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ft.id)}>
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
