"use client";

import { useState } from "react";
import { Search, Loader2, Printer, CheckCircle, Banknote, UserCheck, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios";
import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";

export default function CollectFeePage() {
  const [searchId, setSearchId] = useState("");
  const [matchingStudents, setMatchingStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [createdReceipt, setCreatedReceipt] = useState<{ id: string; number: string } | null>(null);

  // Search student
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsSearching(true);
    setCreatedReceipt(null);
    setSelectedInvoice(null);
    setSelectedStudent(null);

    try {
      const studentRes = await api.get(`/academic/students?search=${encodeURIComponent(searchId.trim())}`);
      const fetched = studentRes.data.data.students || [];

      if (!fetched.length) {
        toast.error("কোনো শিক্ষার্থী পাওয়া যায়নি");
        setMatchingStudents([]);
        setInvoices([]);
        return;
      }

      setMatchingStudents(fetched);

      // If exact 1 student found, select automatically
      if (fetched.length === 1) {
        selectStudentAndFetchInvoices(fetched[0]);
      }
    } catch (error) {
      toast.error("অনুসন্ধান করতে সমস্যা হয়েছে");
    } finally {
      setIsSearching(false);
    }
  };

  const selectStudentAndFetchInvoices = async (student: any) => {
    setSelectedStudent(student);
    setSelectedInvoice(null);
    try {
      const invoicesRes = await api.get(`/admin/finance/invoices?studentId=${student.id}`);
      const allInvoices = invoicesRes.data.data.invoices || [];

      // Filter UNPAID and PARTIAL invoices
      const pendingInvoices = allInvoices.filter(
        (inv: any) => inv.status === "UNPAID" || inv.status === "PARTIAL"
      );

      setInvoices(pendingInvoices);
      if (pendingInvoices.length === 0) {
        toast.info("এই শিক্ষার্থীর বর্তমানে কোনো বকেয়া ইনভয়েস নেই");
      }
    } catch (error) {
      toast.error("ইনভয়েস তালিকা লোড করতে সমস্যা হয়েছে");
    }
  };

  const calculateRemainingDue = (invoice: any) => {
    const total = Number(invoice.totalAmount) || 0;
    const paid = invoice.payments?.reduce((sum: number, p: any) => sum + (Number(p.amountPaid) || 0), 0) || 0;
    return Math.max(total - paid, 0);
  };

  const handleSelectInvoice = (invoice: any) => {
    if (invoice.status === "PAID") {
      toast.error("এই ইনভয়েসটি ইতিমধ্যে সম্পূর্ণরূপে পরিশোধিত");
      return;
    }
    setSelectedInvoice(invoice);
    const due = calculateRemainingDue(invoice);
    setPaymentAmount(due.toString());
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const remainingDue = calculateRemainingDue(selectedInvoice);
    const amount = Number(paymentAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("পরিশোধের পরিমাণ অবশ্যই ০ টাকার বেশি হতে হবে");
      return;
    }

    if (amount > remainingDue) {
      toast.error(`পরিশোধের পরিমাণ অবশিষ্ট বকেয়া ৳ ${remainingDue.toLocaleString("bn-BD")}-এর বেশি হতে পারবে না`);
      return;
    }

    setIsPaying(true);
    try {
      const res = await api.post("/admin/finance/collect", {
        invoiceId: selectedInvoice.id,
        amountPaid: amount,
        method: paymentMethod,
      });

      const receiptData = res.data.data.receipt || res.data.data;
      toast.success("পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে");
      setCreatedReceipt({
        id: receiptData.id || receiptData.receiptId,
        number: receiptData.receiptNumber || receiptData.number,
      });

      // Reset selection state
      setSelectedStudent(null);
      setMatchingStudents([]);
      setInvoices([]);
      setSelectedInvoice(null);
    } catch (error: any) {
      const message = error.response?.data?.message || "পেমেন্ট গ্রহণ ব্যর্থ হয়েছে";
      toast.error(message);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <Banknote className="h-6 w-6 text-emerald-600" />
            নগদ ফি সংগ্রহ (Fee Collection)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            শিক্ষার্থীর বকেয়া ফি আদায় করুন এবং তাত্ক্ষণিক ডিজিটাল রশিদ প্রিন্ট করুন।
          </p>
        </div>
      </div>

      {/* Student Search Box Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">শিক্ষার্থী অনুসন্ধান</CardTitle>
          <CardDescription className="text-xs">
            স্টুডেন্ট আইডি বা নাম দিয়ে শিক্ষার্থী খুঁজুন
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="স্টুডেন্ট আইডি বা নাম লিখুন (যেমন: STD-2026-101)..."
                className="pl-9 text-xs sm:text-sm"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSearching} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs">
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              অনুসন্ধান
            </Button>
          </form>

          {/* Multiple Matching Students Selection Dropdown */}
          {matchingStudents.length > 1 && !selectedStudent && (
            <div className="mt-4 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                একাধিক শিক্ষার্থী পাওয়া গেছে। সঠিক শিক্ষার্থীটি নির্বাচন করুন:
              </p>
              <div className="divide-y border rounded-lg overflow-hidden bg-card">
                {matchingStudents.map((std) => (
                  <div
                    key={std.id}
                    onClick={() => selectStudentAndFetchInvoices(std)}
                    className="p-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs transition-colors"
                  >
                    <div>
                      <strong className="text-slate-900 dark:text-slate-100">{std.nameBn}</strong>
                      <p className="text-muted-foreground text-[11px]">
                        আইডি: {std.studentId} • শ্রেণী: {std.class?.name || "N/A"} • রোল: {std.roll}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs font-bold">
                      নির্বাচন করুন
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Receipt Card */}
      {createdReceipt && (
        <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 shadow-md">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
            <div>
              <h3 className="text-lg font-extrabold text-emerald-900 dark:text-emerald-300">
                ফি আদায় সফলভাবে সম্পন্ন হয়েছে!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold mt-1">
                রশিদ নাম্বার: {createdReceipt.number}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Link href={`/admin/receipts/${createdReceipt.id}/print`} target="_blank">
                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5">
                  <Printer className="h-4 w-4" /> রশিদ প্রিন্ট করুন
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setCreatedReceipt(null)} className="text-xs font-medium">
                নতুন ফি সংগ্রহ করুন
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Student Information & Invoices */}
      {selectedStudent && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 items-start">
          {/* Student Profile Card */}
          <Card className="md:col-span-1 border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" /> শিক্ষার্থীর পরিচিতি
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">নাম</span>
                <strong className="text-slate-900 dark:text-slate-100 text-sm">{selectedStudent.nameBn}</strong>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground block text-[11px]">স্টুডেন্ট আইডি</span>
                  <strong className="font-mono text-emerald-800 dark:text-emerald-400">{selectedStudent.studentId}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">রোল</span>
                  <strong className="font-bold">{selectedStudent.roll}</strong>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">শ্রেণী</span>
                <Badge variant="outline" className="text-[11px]">
                  {selectedStudent.class?.name || "N/A"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pending Invoices List */}
          <Card className="md:col-span-2 border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">বকেয়া ইনভয়েসসমূহ</CardTitle>
              <CardDescription className="text-xs">
                পেমেন্ট গ্রহণের জন্য ইনভয়েস নির্বাচন করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    icon={Banknote}
                    title="কোনো বকেয়া ইনভয়েস নেই"
                    description="এই শিক্ষার্থীর সকল ইনভয়েস পরিশোধিত রয়েছে।"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
                      <TableRow>
                        <TableHead className="font-bold">ইনভয়েস ধরন</TableHead>
                        <TableHead className="font-bold text-right">মোট পরিমাণ</TableHead>
                        <TableHead className="font-bold text-right">অবশিষ্ট বকেয়া</TableHead>
                        <TableHead className="text-center font-bold">স্ট্যাটাস</TableHead>
                        <TableHead className="text-right font-bold">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y">
                      {invoices.map((inv) => {
                        const due = calculateRemainingDue(inv);
                        const isSelected = selectedInvoice?.id === inv.id;
                        return (
                          <TableRow key={inv.id} className={isSelected ? "bg-emerald-50/70 dark:bg-emerald-950/40" : ""}>
                            <TableCell className="font-bold text-xs">{inv.type}</TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              ৳ {Number(inv.totalAmount).toLocaleString("bn-BD")}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                              ৳ {due.toLocaleString("bn-BD")}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={inv.status === "UNPAID" ? "destructive" : "secondary"} className="text-[10px]">
                                {inv.status === "UNPAID" ? "অপরিশোধিত" : "আংশিক"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={isSelected ? "default" : "outline"}
                                onClick={() => handleSelectInvoice(inv)}
                                className="text-xs font-bold"
                              >
                                {isSelected ? "নির্বাচিত" : "সিলেক্ট করুন"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Collect Payment Input Card */}
      {selectedInvoice && (
        <Card className="max-w-xl mx-auto border-2 border-emerald-600 dark:border-emerald-700 bg-card shadow-md">
          <CardHeader className="bg-emerald-950 text-white p-4">
            <CardTitle className="text-base font-bold flex items-center justify-between text-white">
              <span>পেমেন্ট গ্রহণ ফরম</span>
              <Badge className="bg-emerald-600 text-white text-[10px]">
                {selectedInvoice.type}
              </Badge>
            </CardTitle>
            <CardDescription className="text-emerald-200 text-xs mt-0.5">
              মোট পরিমাণ: ৳ {Number(selectedInvoice.totalAmount).toLocaleString("bn-BD")} | অবশিষ্ট বকেয়া:{" "}
              <strong className="text-white font-mono">
                ৳ {calculateRemainingDue(selectedInvoice).toLocaleString("bn-BD")}
              </strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <form onSubmit={handlePayment} className="space-y-4 text-xs">
              <div>
                <Label className="font-semibold block mb-1">পরিশোধের পরিমাণ (৳) *</Label>
                <Input
                  type="number"
                  required
                  min={1}
                  max={calculateRemainingDue(selectedInvoice)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="font-mono text-sm font-bold"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  সর্বোচ্চ পরিশোধের পরিমাণ ৳ {calculateRemainingDue(selectedInvoice).toLocaleString("bn-BD")}
                </p>
              </div>

              <div>
                <Label className="font-semibold block mb-1">পেমেন্ট মেথড (Payment Method) *</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-background border-input text-xs font-semibold"
                >
                  <option value="CASH">ক্যাশ (CASH)</option>
                  <option value="BKASH">বিকাশ (BKASH)</option>
                  <option value="NAGAD">নগদ (NAGAD)</option>
                  <option value="BANK">ব্যাংক ট্রান্সফার (BANK)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedInvoice(null)}
                  className="text-xs font-medium"
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  disabled={isPaying}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> পেমেন্ট প্রক্রিয়াধীন...
                    </>
                  ) : (
                    "পেমেন্ট নিশ্চিত করুন"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
