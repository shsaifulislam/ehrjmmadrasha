"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CreditCard, Plus, Loader2, Receipt } from "lucide-react";
import { useExpenses, useCreateExpense } from "@/hooks/useFinance";
import { toast } from "sonner";

export default function ExpensesPage() {
  const { data, isLoading } = useExpenses({ limit: 50 });
  const createExpense = useCreateExpense();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!category || !amount) {
      toast.error("ক্যাটাগরি এবং পরিমাণ প্রয়োজন");
      return;
    }
    try {
      await createExpense.mutateAsync({
        category, amount: parseFloat(amount), description: description || null,
      });
      toast.success("খরচ সফলভাবে যোগ হয়েছে");
      setOpen(false);
      setCategory("");
      setAmount("");
      setDescription("");
    } catch (err: any) {
      toast.error(err.message || "খরচ যোগ করা যায়নি");
    }
  };

  const expenses = data?.expenses || [];
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            ব্যয় ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground">মাদ্রাসার সকল ব্যয়ের হিসাব রাখুন</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" /> নতুন ব্যয়
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন ব্যয় যোগ করুন</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>ক্যাটাগরি</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="যেমন: বিদ্যুৎ বিল, বেতন" />
              </div>
              <div className="space-y-2">
                <Label>পরিমাণ (টাকা)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>বিবরণ (ঐচ্ছিক)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="বিস্তারিত বিবরণ" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>বাতিল</DialogClose>
              <Button onClick={handleCreate} disabled={createExpense.isPending}>
                {createExpense.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                যোগ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Summary */}
      {expenses.length > 0 && (
        <Card className="bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800">
          <CardContent className="py-4 flex items-center justify-between">
            <span className="font-medium text-rose-700 dark:text-rose-300">মোট ব্যয়</span>
            <span className="text-2xl font-bold text-rose-600">৳ {totalExpense.toLocaleString("bn-BD")}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !expenses.length ? (
            <div className="text-center py-16">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">কোনো ব্যয়ের রেকর্ড নেই</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>ক্যাটাগরি</TableHead>
                  <TableHead>বিবরণ</TableHead>
                  <TableHead className="text-right">পরিমাণ</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>দায়িত্বপ্রাপ্ত</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp, idx) => (
                  <TableRow key={exp.id}>
                    <TableCell>{(idx + 1).toLocaleString("bn-BD")}</TableCell>
                    <TableCell className="font-medium">{exp.category}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{exp.description || "—"}</TableCell>
                    <TableCell className="text-right font-bold text-rose-600">৳ {Number(exp.amount).toLocaleString("bn-BD")}</TableCell>
                    <TableCell>{new Date(exp.date).toLocaleDateString("bn-BD")}</TableCell>
                    <TableCell>{exp.loggedBy?.username || "—"}</TableCell>
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
