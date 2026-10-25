"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, CheckCircle2, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentFeesPage() {
  const feeHistory = [
    { receiptNo: "REC-2026-0012", date: "২০২৬-০৭-১০", feeType: "মাসিক বেতন (জুলাই)", amount: 1500, method: "bKash", status: "PAID" },
    { receiptNo: "REC-2026-0008", date: "২০২৬-০৬-০৫", feeType: "মাসিক বেতন (জুন)", amount: 1500, method: "CASH", status: "PAID" },
    { receiptNo: "REC-2026-0003", date: "২০২৬-০৫-১২", feeType: "অর্ধবার্ষিক পরীক্ষা ফি", amount: 800, method: "Nagad", status: "PAID" },
    { receiptNo: "REC-2026-0001", date: "২০২৬-০১-০৫", feeType: "নতুন সেশন ভর্তি ফি", amount: 3500, method: "CASH", status: "PAID" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Receipt className="h-6 w-6 text-emerald-600" /> ফি পরিশোধের ইতিহাস ও রসিদ
        </h1>
        <p className="text-xs text-slate-500 mt-1">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা - হিসাব সংক্রান্ত তথ্য</p>
      </div>

      <Card className="shadow-sm border-t-4 border-t-emerald-600">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <CardTitle className="text-md font-bold text-slate-800">অনুমোদিত রসিদসমূহ ({feeHistory.length} টি)</CardTitle>
          <CardDescription className="text-xs">সকল লেনদেনের রসিদ প্রিন্ট ও ডাউনলোডযোগ্য</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <TableHead>রসিদ নম্বর</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>ফি বিবরণ</TableHead>
                  <TableHead>পেমেন্ট মেথড</TableHead>
                  <TableHead className="text-right">পরিমাণ (৳)</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeHistory.map((row) => (
                  <TableRow key={row.receiptNo} className="hover:bg-slate-50">
                    <TableCell className="font-mono font-bold text-emerald-800">{row.receiptNo}</TableCell>
                    <TableCell className="text-slate-600 text-xs">{row.date}</TableCell>
                    <TableCell className="font-medium text-slate-800">{row.feeType}</TableCell>
                    <TableCell className="text-slate-600 text-xs font-mono">{row.method}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900">৳ {row.amount}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => window.print()} className="h-7 text-xs gap-1">
                        <Printer className="h-3.5 w-3.5" /> প্রিন্ট
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
