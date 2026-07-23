"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Download, RefreshCw, ShieldAlert, CheckCircle2, HardDrive } from "lucide-react";
import { toast } from "sonner";

export default function AdminBackupPage() {
  const [backups, setBackups] = useState([
    { id: "bk-2026-07-22", fileName: "ehrj_madrasha_backup_2026_07_22.sql", size: "4.8 MB", date: "২০২৬-০৭-২২ ২০:১৫:০০", type: "AUTOMATIC", status: "SUCCESS" },
    { id: "bk-2026-07-15", fileName: "ehrj_madrasha_backup_2026_07_15.sql", size: "4.6 MB", date: "২০২৬-০৭-১৫ ০০:০০:০০", type: "AUTOMATIC", status: "SUCCESS" },
    { id: "bk-2026-07-01", fileName: "ehrj_madrasha_backup_2026_07_01.sql", size: "4.2 MB", date: "২০২৬-০৭-০১ ০০:০০:০০", type: "MANUAL", status: "SUCCESS" },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreateBackup = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const now = new Date();
      const newBk = {
        id: `bk-${Date.now()}`,
        fileName: `ehrj_madrasha_manual_backup_${now.toISOString().split('T')[0]}.sql`,
        size: "4.9 MB",
        date: `${now.toLocaleDateString('bn-BD')} ${now.toLocaleTimeString('bn-BD')}`,
        type: "MANUAL",
        status: "SUCCESS"
      };
      setBackups([newBk, ...backups]);
      setIsGenerating(false);
      toast.success("নতুন ডাটাবেজ ব্যাকআপ সফলভাবে তৈরি করা হয়েছে!");
    }, 1500);
  };

  const handleRestore = (fileName: string) => {
    const confirmRestore = confirm(`সতর্কতা: আপনি কি নিশ্চিত যে ${fileName} ব্যাকআপ ফাইল থেকে ডাটাবেজ রিস্টোর করতে চান?`);
    if (confirmRestore) {
      toast.info("ডাটাবেজ রিস্টোর প্রক্রিয়া শুরু হয়েছে...");
      setTimeout(() => {
        toast.success("ডাটাবেজ সফলভাবে পূর্বে অবস্থায় রিস্টোর হয়েছে!");
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-emerald-600" />
            ডাটাবেস ব্যাকআপ ও রিস্টোর কেন্দ্র
          </h1>
          <p className="text-xs text-muted-foreground mt-1">মাদ্রাসার সমস্ত ডাটাবেজ রেকর্ডের নিরাপদ ব্যাকআপ ও রিস্টোর সার্ভিস</p>
        </div>
        <Button 
          onClick={handleCreateBackup} 
          disabled={isGenerating}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
        >
          <HardDrive className="mr-2 h-4 w-4" />
          {isGenerating ? "ব্যাকআপ ফাইল তৈরি হচ্ছে..." : "নতুন ম্যানুয়াল ব্যাকআপ নিন"}
        </Button>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3 text-amber-900 text-xs">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm">ব্যাকআপ ও রিস্টোর নিরাপত্তা সতর্কবার্তা:</p>
          <p className="mt-0.5">ব্যাকআপ ফাইল থেকে ডাটাবেজ রিস্টোর করলে বর্তমান ডাটা ওভাররাইট হতে পারে। ব্যাকআপ রিস্টোর করার পূর্বে অবশ্যই একটি নতুন স Snapshot গ্রহণ করুন।</p>
        </div>
      </div>

      <Card className="shadow-sm border-t-4 border-t-emerald-600">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <CardTitle className="text-md font-bold text-slate-800">সংরক্ষিত ব্যাকআপ স্ন্যাপশট ({backups.length} টি)</CardTitle>
          <CardDescription className="text-xs">স্বয়ংক্রিয় ও ম্যানুয়াল প্রস্তুতকৃত ব্যাকআপ তালিকা</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <TableHead>ব্যাকআপ ফাইল</TableHead>
                  <TableHead>ফাইল সাইজ</TableHead>
                  <TableHead>তৈরির সময়</TableHead>
                  <TableHead>ধরন</TableHead>
                  <TableHead className="text-center">স্টেটাস</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((bk) => (
                  <TableRow key={bk.id} className="hover:bg-slate-50">
                    <TableCell className="font-mono font-bold text-slate-800">{bk.fileName}</TableCell>
                    <TableCell className="font-mono text-slate-600 text-xs">{bk.size}</TableCell>
                    <TableCell className="text-slate-600 text-xs">{bk.date}</TableCell>
                    <TableCell>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        bk.type === "AUTOMATIC" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                      }`}>
                        {bk.type === "AUTOMATIC" ? "স্বয়ংক্রিয়" : "ম্যানুয়াল"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> সফল
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => toast.success("ব্যাকআপ ফাইল ডাউনলোড শুরু হয়েছে")} 
                          className="h-8 text-xs gap-1 border-slate-300"
                        >
                          <Download className="h-3.5 w-3.5" /> ডাউনলোড
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleRestore(bk.fileName)} 
                          className="h-8 text-xs gap-1 bg-rose-600 hover:bg-rose-700"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> রিস্টোর
                        </Button>
                      </div>
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
