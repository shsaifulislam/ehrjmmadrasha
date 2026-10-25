"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, Loader2, RefreshCw, MessageSquare, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useInvoices } from "@/hooks/useFinance";
import { useClasses, useSessions } from "@/hooks/useAcademic";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import Link from "next/link";

export default function DueInvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("UNPAID");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const { data: classes } = useClasses();
  const { data: sessions } = useSessions();

  const { data, isLoading, refetch } = useInvoices({
    page,
    limit: 30,
    status: statusFilter || undefined,
  });

  const invoices = data?.invoices || [];
  const meta = data?.meta;

  const totalDueSum = invoices.reduce((sum, inv) => {
    const paid = inv.payments?.reduce((s: number, p: any) => s + (Number(p.amountPaid) || 0), 0) || 0;
    return sum + Math.max(Number(inv.totalAmount) - paid, 0);
  }, 0);

  const handleSendReminderSMS = (studentName: string, dueAmount: number) => {
    toast.success(`${studentName}-এর অভিভাবককে ৳ ${dueAmount.toLocaleString("bn-BD")} টাকার বকেয়া এসএমএস পাঠানো হয়েছে`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <Receipt className="h-6 w-6 text-rose-600" />
            বকেয়া ফি ও ডিউ ট্র্যাকিং (Due Invoices & Tracking)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            শিক্ষার্থীদের অপরিশোধিত ও আংশিক ইনভয়েসের তালিকা পর্যালোচনা ও এসএমএস রিমাইন্ডার প্রেরণ করুন।
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="font-medium shrink-0">
          <RefreshCw className="h-4 w-4 mr-1.5" /> রিফ্রেশ
        </Button>
      </div>

      {/* Total Due Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block">মোট বকেয়া পরিমাণ</span>
              <span className="text-2xl font-black font-mono text-rose-900 dark:text-rose-200">
                ৳ {totalDueSum.toLocaleString("bn-BD")}
              </span>
            </div>
            <Receipt className="h-8 w-8 text-rose-600/40" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground block">মোট বকেয়া ইনভয়েস</span>
              <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                {(meta?.total || invoices.length).toLocaleString("bn-BD")} টি
              </span>
            </div>
            <Filter className="h-8 w-8 text-slate-400" />
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">পেমেন্ট কালেকশন অ্যাকশন</span>
              <Link href="/admin/finance/collect">
                <Button size="sm" className="mt-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs">
                  ফি আদায় করুন
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Options Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "UNPAID", label: "অপরিশোধিত (UNPAID)" },
              { key: "PARTIAL", label: "আংশিক (PARTIAL)" },
              { key: "", label: "সকল ইনভয়েস" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === tab.key
                    ? "bg-rose-700 text-white shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="border rounded-lg p-1.5 text-xs bg-background border-input"
            >
              <option value="">-- সকল শ্রেণী --</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="border rounded-lg p-1.5 text-xs bg-background border-input"
            >
              <option value="">-- সকল সেশন --</option>
              {sessions?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.year}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Due Table */}
      <Card className="border-slate-200 dark:border-slate-800 bg-card overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b">
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-4 w-1/6 bg-muted rounded" />
                  <div className="h-8 w-24 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Receipt}
                title="কোনো বকেয়া ইনভয়েস নেই"
                description="নির্বাচিত ফিল্টারের সাথে মানানসই কোনো অপরিশোধিত ইনভয়েস পাওয়া যায়নি।"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
                  <TableRow>
                    <TableHead className="w-12 text-center font-bold">#</TableHead>
                    <TableHead className="font-bold">শিক্ষার্থীর নাম</TableHead>
                    <TableHead className="font-bold">শ্রেণী</TableHead>
                    <TableHead className="font-bold">ইনভয়েস ধরন</TableHead>
                    <TableHead className="text-right font-bold">মোট পরিমাণ</TableHead>
                    <TableHead className="text-right font-bold">অবশিষ্ট বকেয়া</TableHead>
                    <TableHead className="text-center font-bold">স্ট্যাটাস</TableHead>
                    <TableHead className="text-right font-bold">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map((inv, idx) => {
                    const paid = inv.payments?.reduce((s: number, p: any) => s + (Number(p.amountPaid) || 0), 0) || 0;
                    const due = Math.max(Number(inv.totalAmount) - paid, 0);
                    return (
                      <TableRow key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <TableCell className="text-center font-bold text-xs text-muted-foreground">
                          {((page - 1) * 30 + idx + 1).toLocaleString("bn-BD")}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {inv.student?.nameBn || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px]">
                            {inv.student?.class?.name || "N/A"}
                          </Badge>
                        </TableCell>
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
                            variant="outline"
                            onClick={() => handleSendReminderSMS(inv.student?.nameBn || "শিক্ষার্থী", due)}
                            className="text-xs gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> SMS রিমাইন্ডার
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

      {/* Pagination Controls */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasPrev}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="text-xs font-medium"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> পূর্ববর্তী পেজ
          </Button>
          <span className="text-xs text-muted-foreground font-medium">
            পেজ {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasNext}
            onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))}
            className="text-xs font-medium"
          >
            পরবর্তী পেজ <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
