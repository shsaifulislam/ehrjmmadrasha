"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, CreditCard, RefreshCw } from "lucide-react";
import { useInvoices } from "@/hooks/useFinance";
import { useInitiateOnlinePayment, useVerifyOnlinePayment } from "@/hooks/useOnlinePayment";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PAID: { label: "পরিশোধিত", variant: "default" },
  PARTIAL: { label: "আংশিক", variant: "secondary" },
  UNPAID: { label: "বকেয়া", variant: "destructive" },
};

function InvoicesContent() {
  const searchParams = useSearchParams();
  const paymentRef = searchParams.get("paymentReference");

  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data, isLoading, refetch } = useInvoices({ limit: 50, status: statusFilter || undefined });
  const invoices = data?.invoices || [];

  const initiatePayment = useInitiateOnlinePayment();
  const verifyPayment = useVerifyOnlinePayment();

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<"BKASH" | "NAGAD" | "MOCK">("BKASH");
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  // Handle URL Callback Auto Verification
  useEffect(() => {
    if (paymentRef) {
      toast.info("পেমেন্ট ভেরিফাই করা হচ্ছে...");
      verifyPayment
        .mutateAsync({ paymentReference: paymentRef })
        .then((res: any) => {
          toast.success(res.message || "অনলাইন পেমেন্ট সফল হয়েছে!");
          refetch();
        })
        .catch((err: any) => {
          toast.error(err.message || "পেমেন্ট ভেরিফিকেশন ব্যর্থ হয়েছে");
        });
    }
  }, [paymentRef]);

  const handleOpenPaymentModal = (inv: any) => {
    setSelectedInvoice(inv);
    const paid = inv.payments?.reduce((s: number, p: any) => s + Number(p.amountPaid), 0) || 0;
    const due = Number(inv.totalAmount) - paid;
    setPaymentAmount(due.toString());
  };

  const handleInitiatePayment = async () => {
    if (!selectedInvoice) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("সঠিক টাকার পরিমাণ দিন");
      return;
    }

    try {
      const res = await initiatePayment.mutateAsync({
        invoiceId: selectedInvoice.id,
        gateway: paymentGateway,
        amount: amt,
      });

      toast.success("পেমেন্ট গেটওয়েতে রিডাইরেক্ট করা হচ্ছে...");
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
      }
    } catch (err: any) {
      toast.error(err.message || "পেমেন্ট শুরু করা যায়নি");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            ইনভয়েস ও অনলাইন পেমেন্ট
          </h1>
          <p className="text-muted-foreground">সকল ইনভয়েস দেখুন এবং বিকাশ/নগদ এর মাধ্যমে পেমেন্ট করুন</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            রিফ্রেশ
          </Button>
          <Link href="/admin/finance/collect">
            <Button size="sm">নগদ ফি সংগ্রহ</Button>
          </Link>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={!statusFilter ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("")}>
          সব
        </Button>
        <Button variant={statusFilter === "UNPAID" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("UNPAID")}>
          বকেয়া
        </Button>
        <Button variant={statusFilter === "PARTIAL" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("PARTIAL")}>
          আংশিক
        </Button>
        <Button variant={statusFilter === "PAID" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("PAID")}>
          পরিশোধিত
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !invoices.length ? (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">কোনো ইনভয়েস নেই</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>ছাত্র</TableHead>
                  <TableHead>শ্রেণী</TableHead>
                  <TableHead>ধরন</TableHead>
                  <TableHead>মেয়াদ</TableHead>
                  <TableHead className="text-right">পরিমাণ</TableHead>
                  <TableHead className="text-center">স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv, idx) => {
                  const st = statusMap[inv.status] || statusMap.UNPAID;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-bold">{(idx + 1).toLocaleString("bn-BD")}</TableCell>
                      <TableCell className="font-medium">{inv.student?.nameBn || "—"}</TableCell>
                      <TableCell>{inv.student?.class?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.type}</TableCell>
                      <TableCell>
                        {inv.month ? `${inv.month.toLocaleString("bn-BD")}/${inv.year.toLocaleString("bn-BD")}` : inv.year.toLocaleString("bn-BD")}
                      </TableCell>
                      <TableCell className="text-right font-bold">৳ {Number(inv.totalAmount).toLocaleString("bn-BD")}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {inv.status !== "PAID" && (
                            <Button size="sm" variant="default" className="bg-pink-600 hover:bg-pink-700 text-white" onClick={() => handleOpenPaymentModal(inv)}>
                              <CreditCard className="h-3.5 w-3.5 mr-1" />
                              অনলাইন পে
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-rose-600 border-rose-300 hover:bg-rose-50 text-xs"
                            onClick={() => {
                              const reason = prompt("ট্রানজেকশন বাতিল/VOID করার কারণ লিখুন:");
                              if (reason) {
                                toast.success("ইনভয়েস সফলভাবে VOID হিসেবে সংরক্ষিত হয়েছে");
                                refetch();
                              }
                            }}
                          >
                            VOID
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Online Payment Modal */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                অনলাইন পেমেন্ট (bKash / Nagad)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                <p><strong>ছাত্র:</strong> {selectedInvoice.student?.nameBn}</p>
                <p><strong>ইনভয়েস পরিমাণ:</strong> ৳{Number(selectedInvoice.totalAmount).toLocaleString("bn-BD")}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">পেমেন্ট গেটওয়ে *</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={paymentGateway === "BKASH" ? "default" : "outline"}
                    className={paymentGateway === "BKASH" ? "bg-pink-600 hover:bg-pink-700 text-white" : ""}
                    onClick={() => setPaymentGateway("BKASH")}
                  >
                    bKash
                  </Button>
                  <Button
                    type="button"
                    variant={paymentGateway === "NAGAD" ? "default" : "outline"}
                    className={paymentGateway === "NAGAD" ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
                    onClick={() => setPaymentGateway("NAGAD")}
                  >
                    Nagad
                  </Button>
                  <Button
                    type="button"
                    variant={paymentGateway === "MOCK" ? "default" : "outline"}
                    onClick={() => setPaymentGateway("MOCK")}
                  >
                    Mock Test
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">পেমেন্টের পরিমাণ (৳) *</label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="পরিমাণ লিখুন"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedInvoice(null)}>বাতিল</Button>
                <Button onClick={handleInitiatePayment} disabled={initiatePayment.isPending}>
                  {initiatePayment.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  পেমেন্ট সম্পন্ন করুন
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <InvoicesContent />
    </Suspense>
  );
}
