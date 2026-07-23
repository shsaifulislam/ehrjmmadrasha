"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Heart, Plus, Loader2, Gift } from "lucide-react";
import { useDonations, useCreateDonation } from "@/hooks/useFinance";
import { toast } from "sonner";

export default function DonationsPage() {
  const { data, isLoading } = useDonations({ limit: 50 });
  const createDonation = useCreateDonation();
  const [open, setOpen] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");

  const handleCreate = async () => {
    if (!donorName || !amount) {
      toast.error("দাতার নাম এবং পরিমাণ প্রয়োজন");
      return;
    }
    try {
      await createDonation.mutateAsync({
        donorName, amount: parseFloat(amount), purpose: purpose || null,
      });
      toast.success("দান সফলভাবে গ্রহণ হয়েছে");
      setOpen(false);
      setDonorName("");
      setAmount("");
      setPurpose("");
    } catch (err: any) {
      toast.error(err.message || "দান গ্রহণ করা যায়নি");
    }
  };

  const donations = data?.donations || [];
  const totalDonation = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            দান ব্যবস্থাপনা
          </h1>
          <p className="text-muted-foreground">মাদ্রাসায় প্রাপ্ত দান ও অনুদান</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" /> নতুন দান
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন দান গ্রহণ</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>দাতার নাম</Label>
                <Input value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="দাতার পূর্ণ নাম" />
              </div>
              <div className="space-y-2">
                <Label>পরিমাণ (টাকা)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>উদ্দেশ্য (ঐচ্ছিক)</Label>
                <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="যেমন: মসজিদ নির্মাণ, ছাত্রবৃত্তি" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>বাতিল</DialogClose>
              <Button onClick={handleCreate} disabled={createDonation.isPending}>
                {createDonation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                গ্রহণ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {donations.length > 0 && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="py-4 flex items-center justify-between">
            <span className="font-medium text-green-700 dark:text-green-300">মোট দান</span>
            <span className="text-2xl font-bold text-green-600">৳ {totalDonation.toLocaleString("bn-BD")}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !donations.length ? (
            <div className="text-center py-16">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">কোনো দানের রেকর্ড নেই</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>দাতার নাম</TableHead>
                  <TableHead>উদ্দেশ্য</TableHead>
                  <TableHead className="text-right">পরিমাণ</TableHead>
                  <TableHead>তারিখ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((don, idx) => (
                  <TableRow key={don.id}>
                    <TableCell>{(idx + 1).toLocaleString("bn-BD")}</TableCell>
                    <TableCell className="font-medium">{don.donorName}</TableCell>
                    <TableCell className="text-muted-foreground">{don.purpose || "—"}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">৳ {Number(don.amount).toLocaleString("bn-BD")}</TableCell>
                    <TableCell>{new Date(don.date).toLocaleDateString("bn-BD")}</TableCell>
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
