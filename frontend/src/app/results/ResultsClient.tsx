"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Award,
  Search,
  Loader2,
  Printer,
  ArrowLeft,
  GraduationCap,
  AlertCircle,
  Building2,
  CheckCircle,
  XCircle,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePublicSessions } from "@/hooks/useAcademic";
import { usePublicExams, usePublicResultSearch } from "@/hooks/useExams";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";

export function ResultsClient() {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [roll, setRoll] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");

  const [searchParams, setSearchParams] = useState<{
    sessionId: string;
    examId: string;
    roll: number;
    studentId?: string;
  } | null>(null);

  const { data: sessions } = usePublicSessions();
  const { data: exams } = usePublicExams(selectedSessionId || undefined);

  // Filter only published exams for public search
  const publishedExams = exams?.filter((e) => e.isPublished) || [];

  const { data: resultCard, isLoading: searching, error } = usePublicResultSearch(
    searchParams || { sessionId: "", examId: "", roll: 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !selectedExamId || !roll.trim()) {
      toast.error("সেশন, পরীক্ষা এবং রোল নম্বর প্রদান করুন");
      return;
    }

    const rollNum = parseInt(roll, 10);
    if (isNaN(rollNum) || rollNum <= 0) {
      toast.error("সঠিক রোল নম্বর দিন");
      return;
    }

    setSearchParams({
      sessionId: selectedSessionId,
      examId: selectedExamId,
      roll: rollNum,
      studentId: studentId.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Printable Area Global Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-marksheet,
          #printable-marksheet * {
            visibility: visible;
          }
          #printable-marksheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
            background: white;
            color: black;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b shadow-sm sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-full overflow-hidden shrink-0 shadow-sm border-2 border-emerald-600 bg-white p-0.5 transition-transform group-hover:scale-105">
              <Image
                src="/images/logo.png"
                alt="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার লোগো"
                width={44}
                height={44}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="leading-tight">
              <span className="text-base font-bold text-emerald-800 dark:text-emerald-400 block leading-tight">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold">
                জমিরীয়া মাদ্রাসা (অনলাইন ফলাফল কেন্দ্র)
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-sm text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> মূল পাতায় ফিরে যান
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 flex-1 w-full">
        {/* Banner Header */}
        <div className="text-center space-y-2 no-print">
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-4 py-1 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>অনলাইন ফলাফল ওয়েব সার্ভিস</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            পরীক্ষার ফলাফল অনুসন্ধান
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
            সেশন, পরীক্ষা ও রোল নম্বর দিয়ে আপনার কাঙ্ক্ষিত রেজাল্ট কার্ডটি খুঁজুন ও সংরক্ষণ করুন।
          </p>
        </div>

        {/* Search Form Card */}
        <Card className="shadow-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 no-print">
          <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-800/40">
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Search className="h-4 w-4 text-emerald-600" /> ফলাফল সার্চ করুন
            </CardTitle>
            <CardDescription className="text-xs">
              তারকা চিহ্নিত (*) ঘরগুলো আবশ্যিকভাবে পূরণ করতে হবে।
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSearch} className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="sessionSelect" className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  শিক্ষাবর্ষ / সেশন <span className="text-red-500">*</span>
                </label>
                <select
                  id="sessionSelect"
                  value={selectedSessionId}
                  onChange={(e) => {
                    setSelectedSessionId(e.target.value);
                    setSelectedExamId("");
                  }}
                  className="w-full border rounded-lg p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                >
                  <option value="">-- সেশন নির্বাচন --</option>
                  {sessions?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="examSelect" className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  পরীক্ষা <span className="text-red-500">*</span>
                </label>
                <select
                  id="examSelect"
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  disabled={!selectedSessionId}
                  className="w-full border rounded-lg p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-medium disabled:opacity-50"
                  required
                >
                  <option value="">-- পরীক্ষা নির্বাচন --</option>
                  {publishedExams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="rollInput" className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  রোল নম্বর <span className="text-red-500">*</span>
                </label>
                <Input
                  id="rollInput"
                  type="number"
                  placeholder="যেমন: ১০১"
                  value={roll}
                  onChange={(e) => setRoll(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="studentIdInput" className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  স্টুডেন্ট আইডি (ঐচ্ছিক)
                </label>
                <Input
                  id="studentIdInput"
                  placeholder="STD-2026-XXXX"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={searching}
                  className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8 shadow-sm"
                >
                  {searching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> ফলাফল খোঁজা হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" /> ফলাফল দেখুন
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Output Section */}
        {searching ? (
          <Card className="py-16 text-center shadow-sm">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-emerald-600 mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              ফলাফল অনুসন্ধান করা হচ্ছে...
            </p>
          </Card>
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="ফলাফল পাওয়া যায়নি"
            description={
              (error as any)?.response?.data?.message ||
              (error as any)?.message ||
              "প্রদত্ত রোল নম্বর বা তথ্যের সাথে কোনো শিক্ষার্থীর প্রকাশিত পরীক্ষার ফলাফল মেলেনি।"
            }
          />
        ) : resultCard ? (
          <div id="printable-marksheet">
            <Card className="shadow-lg border-emerald-200 dark:border-emerald-900 bg-white dark:bg-slate-900 overflow-hidden">
              {/* Marksheet Header */}
              <CardHeader className="bg-emerald-50/60 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900 text-center py-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 border-2 border-emerald-600 bg-white p-0.5 shadow-sm">
                    <Image
                      src="/images/logo.png"
                      alt="ইলিয়টগঞ্জ মাদ্রাসা লোগো"
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-200 leading-tight">
                      {resultCard.madrasaInfo.nameBn}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {resultCard.madrasaInfo.address}
                    </p>
                  </div>
                </div>

                <div className="inline-block mt-2">
                  <Badge className="bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-4 py-1 shadow-2xs">
                    {resultCard.exam.name} ({resultCard.exam.session})
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Student Personal Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">শিক্ষার্থীর নাম</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-bold text-sm sm:text-base">
                      {resultCard.student.nameBn}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">শ্রেণী / জামায়াত</span>
                    <strong className="text-slate-800 dark:text-slate-200">{resultCard.student.className}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">রোল নম্বর</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">{resultCard.student.roll}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">স্টুডেন্ট আইডি</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{resultCard.student.studentId}</strong>
                  </div>
                </div>

                {/* Digital Verification Box */}
                <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs no-print">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">অফিশিয়াল ডিজিটাল ভেরিফিকেশন রেকর্ড:</span>
                  <Link
                    href={`/verify/result/${resultCard.student.id}`}
                    target="_blank"
                    className="font-mono text-emerald-700 dark:text-emerald-400 underline hover:text-emerald-900 font-bold"
                  >
                    ভেরিফিকেশন বিবরণী দেখুন &rarr;
                  </Link>
                </div>


                {/* Subject Mark Breakdown Table */}
                <div className="border rounded-xl overflow-hidden shadow-2xs">
                  <Table>
                    <TableHeader className="bg-slate-100 dark:bg-slate-800">
                      <TableRow>
                        <TableHead className="font-bold text-slate-800 dark:text-slate-200">বিষয়</TableHead>
                        <TableHead className="text-center font-bold text-slate-800 dark:text-slate-200">পূর্ণমান</TableHead>
                        <TableHead className="text-center font-bold text-slate-800 dark:text-slate-200">প্রাপ্ত নম্বর</TableHead>
                        <TableHead className="text-center font-bold text-slate-800 dark:text-slate-200">লেটার গ্রেড</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {resultCard.results.map((sb) => (
                        <TableRow key={sb.subjectId}>
                          <TableCell className="font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                            {sb.subjectName}
                          </TableCell>
                          <TableCell className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            {sb.fullMarks}
                          </TableCell>
                          <TableCell className="text-center font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                            {sb.obtainedMarks !== null ? sb.obtainedMarks : "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={sb.grade === "F" ? "destructive" : "outline"}
                              className={`font-bold ${
                                sb.grade !== "F"
                                  ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                                  : ""
                              }`}
                            >
                              {sb.grade}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Performance Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <span className="text-xs text-slate-600 dark:text-slate-400 block font-medium">মোট নম্বর</span>
                    <span className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-300">
                      {resultCard.summary.totalObtained} / {resultCard.summary.totalFullMarks}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-xs text-slate-600 dark:text-slate-400 block font-medium">জিপিএ (GPA)</span>
                    <span className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {resultCard.summary.hasFailed ? "0.00" : resultCard.summary.gpa.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <span className="text-xs text-slate-600 dark:text-slate-400 block font-medium">ফাইনাল গ্রেড</span>
                    <span className="text-base sm:text-lg font-bold text-amber-700 dark:text-amber-300">
                      {resultCard.summary.finalGrade}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                    <span className="text-xs text-slate-600 dark:text-slate-400 block font-medium">মেধা স্থান</span>
                    <span className="text-base sm:text-lg font-bold text-purple-700 dark:text-purple-300">
                      {resultCard.summary.position}তম
                    </span>
                  </div>
                </div>

                {/* Print Action Button */}
                <div className="flex justify-end pt-4 border-t no-print">
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                    className="border-emerald-600 text-emerald-800 dark:text-emerald-300 font-bold hover:bg-emerald-50"
                  >
                    <Printer className="h-4 w-4 mr-2" /> প্রিন্ট / PDF সংরক্ষণ করুন
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
}
