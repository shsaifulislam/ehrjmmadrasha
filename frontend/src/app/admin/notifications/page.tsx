"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertTriangle,
  Radio,
  FileText,
} from "lucide-react";
import { useClasses } from "@/hooks/useAcademic";
import { useNotificationLogs, useSendBulkSms, useRetryNotification } from "@/hooks/useNotifications";
import { toast } from "sonner";

const eventTypeMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  FEE_PAYMENT_SUCCESS: { label: "ফি আদায় SMS", variant: "default" },
  STUDENT_ABSENCE: { label: "অনুপস্থিতি Alert", variant: "destructive" },
  ADMISSION_APPROVED: { label: "ভর্তি অনুমোদন", variant: "secondary" },
  EMERGENCY_NOTICE: { label: "জরুরি নোটিশ", variant: "destructive" },
  BULK_NOTICE: { label: "বাল্ক বার্তা", variant: "outline" },
};

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data: logsData, isLoading: loadingLogs, refetch } = useNotificationLogs(page, 50);
  const { data: classes } = useClasses();

  const sendBulkSms = useSendBulkSms();
  const retrySms = useRetryNotification();

  // Form State
  const [recipientType, setRecipientType] = useState<"ALL_STUDENTS" | "CLASS" | "ALL_TEACHERS" | "CUSTOM">("ALL_STUDENTS");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [customNumbersInput, setCustomNumbersInput] = useState("");
  const [messageText, setMessageText] = useState("");

  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      toast.error("এসএমএস বার্তা লিখুন");
      return;
    }

    if (recipientType === "CLASS" && !selectedClassId) {
      toast.error("শ্রেণী নির্বাচন করুন");
      return;
    }

    let customNumbers: string[] | undefined = undefined;
    if (recipientType === "CUSTOM") {
      customNumbers = customNumbersInput
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      if (!customNumbers.length) {
        toast.error("কমপক্ষে একটি কাস্টম মোবাইল নম্বর দিন");
        return;
      }
    }

    try {
      const res = await sendBulkSms.mutateAsync({
        recipientType,
        classId: recipientType === "CLASS" ? selectedClassId : undefined,
        customNumbers,
        message: messageText,
      });
      toast.success(res.data?.message || "বাল্ক এসএমএস প্রসেসিং লাইনে যুক্ত করা হয়েছে");
      setMessageText("");
      setCustomNumbersInput("");
    } catch (err: any) {
      toast.error(err.message || "এসএমএস পাঠানো যায়নি");
    }
  };

  const handleRetry = async (logId: string) => {
    try {
      await retrySms.mutateAsync(logId);
      toast.success("এসএমএস পুনরায় পাঠানো হয়েছে");
    } catch (err: any) {
      toast.error(err.message || "রিট্রাই করা যায়নি");
    }
  };

  const logs = logsData?.logs || [];
  const totalLogs = logsData?.pagination?.total || 0;
  const sentCount = logs.filter((l) => l.status === "SENT").length;
  const failedCount = logs.filter((l) => l.status === "FAILED").length;
  const pendingCount = logs.filter((l) => l.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            এসএমএস ও নোটিফিকেশন সেন্টার
          </h1>
          <p className="text-muted-foreground">স্বয়ংক্রিয় বাংলা এসএমএস, বাল্ক বার্তা এবং ডেলিভারি স্ট্যাটাস ট্র্যাকিং</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          রিফ্রেশ
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">মোট প্রেরিত এসএমএস</p>
            <p className="text-xl font-bold text-blue-600">{totalLogs.toLocaleString("bn-BD")}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">সফল (Sent)</p>
            <p className="text-xl font-bold text-emerald-600">{sentCount.toLocaleString("bn-BD")}</p>
          </CardContent>
        </Card>
        <Card className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">ব্যর্থ (Failed)</p>
            <p className="text-xl font-bold text-rose-600">{failedCount.toLocaleString("bn-BD")}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">প্রসেসিং (Pending)</p>
            <p className="text-xl font-bold text-amber-600">{pendingCount.toLocaleString("bn-BD")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk SMS Sender Form */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            জরুরি / বাল্ক এসএমএস পাঠান
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendBulk} className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">প্রাপকের ধরন *</label>
                <select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value as any)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background font-medium"
                >
                  <option value="ALL_STUDENTS">সকল অভিভাবক (All Students)</option>
                  <option value="CLASS">নির্দিষ্ট শ্রেণী (Specific Class)</option>
                  <option value="ALL_TEACHERS">সকল শিক্ষক (All Teachers)</option>
                  <option value="CUSTOM">কাস্টম নম্বরসমূহ (Custom Numbers)</option>
                </select>
              </div>

              {recipientType === "CLASS" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">শ্রেণী নির্বাচন করুন *</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="">শ্রেণী নির্বাচন করুন</option>
                    {classes?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {recipientType === "CUSTOM" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    মোবাইল নম্বরসমূহ (কমা দিয়ে পৃথক করুন) *
                  </label>
                  <Input
                    placeholder="01712345678, 01812345678..."
                    value={customNumbersInput}
                    onChange={(e) => setCustomNumbersInput(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-muted-foreground">বাংলা বার্তা লিখুন *</label>
                <span className="text-xs text-muted-foreground font-mono">
                  দৈর্ঘ্য: {messageText.length} অক্ষর
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="যেমন: আসসালামু আলাইকুম, আগামী কাল মাদ্রাসা বিশেষ কারণে বন্ধ থাকিবে। - মুহতামিম"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full border rounded-md p-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={sendBulkSms.isPending} className="px-6">
                {sendBulkSms.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                এসএমএস পাঠান
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* SMS Delivery Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            এসএমএস ডেলিভারি লগ (SMS Delivery History)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingLogs ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !logs.length ? (
            <div className="text-center py-16">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">কোনো এসএমএস ডেলিভারি রেকর্ড পাওয়া যায়নি</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>ইভেন্ট টাইপ</TableHead>
                  <TableHead>প্রাপক</TableHead>
                  <TableHead>বার্তা</TableHead>
                  <TableHead className="text-center">স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">তারিখ ও সময়</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, idx) => {
                  const ev = eventTypeMap[log.eventType] || { label: log.eventType, variant: "outline" };
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-bold">{(idx + 1).toLocaleString("bn-BD")}</TableCell>
                      <TableCell>
                        <Badge variant={ev.variant}>{ev.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">{log.recipientPhone}</div>
                        {log.recipientName && (
                          <div className="text-xs text-muted-foreground">{log.recipientName}</div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate text-xs font-mono" title={log.message}>
                        {log.message}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            log.status === "SENT"
                              ? "default"
                              : log.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                          }
                          className="gap-1"
                        >
                          {log.status === "SENT" && <CheckCircle className="h-3 w-3" />}
                          {log.status === "FAILED" && <XCircle className="h-3 w-3" />}
                          {log.status === "PENDING" && <Clock className="h-3 w-3" />}
                          {log.status === "SENT" ? "সফল" : log.status === "FAILED" ? "ব্যর্থ" : "প্রসেসিং"}
                        </Badge>
                        {log.failureReason && (
                          <div className="text-[10px] text-rose-500 mt-0.5 truncate max-w-[120px] mx-auto" title={log.failureReason}>
                            {log.failureReason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("bn-BD")}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.status === "FAILED" && log.retryCount < 3 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetry(log.id)}
                            disabled={retrySms.isPending}
                            className="text-xs"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            রিট্রাই ({log.retryCount}/3)
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
