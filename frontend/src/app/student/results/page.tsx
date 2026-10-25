"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { GraduationCap, Printer } from "lucide-react";

export default function StudentResultsPage() {
  const resultData = {
    examName: "অর্ধবার্ষিক মূল্যায়ন পরীক্ষা ২০২৬",
    gpa: "5.00",
    grade: "A+",
    position: "১ম স্থান",
    subjects: [
      { code: "101", name: "সহীহ বুখারী শরীফ (১ম খণ্ড)", fullMarks: 100, obtainedMarks: 95, grade: "A+" },
      { code: "102", name: "সহীহ মুসলিম শরীফ", fullMarks: 100, obtainedMarks: 92, grade: "A+" },
      { code: "103", name: "সুনানে আবু দাউদ", fullMarks: 100, obtainedMarks: 88, grade: "A+" },
      { code: "104", name: "সুনানে তিরমিযী শরীফ", fullMarks: 100, obtainedMarks: 94, grade: "A+" },
      { code: "105", name: "উসূলে হাদীস ও তাফসীর", fullMarks: 100, obtainedMarks: 91, grade: "A+" },
    ]
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" /> আমার পরীক্ষার ফলাফল
          </h1>
          <p className="text-xs text-slate-500 mt-1">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা - অফিশিয়াল গ্রেডশিট</p>
        </div>

        <Button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-900 text-white font-bold">
          <Printer className="mr-2 h-4 w-4" /> রেজাল্ট কার্ড প্রিন্ট
        </Button>
      </div>

      <Card className="shadow-sm border-t-4 border-t-blue-600 print:shadow-none print:border-none">
        <CardHeader className="border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">{resultData.examName}</CardTitle>
            <CardDescription className="text-xs text-slate-500">জামায়াত: দাওরায়ে হাদীস (Dawra-e-Hadith)</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-lg text-center">
              <p className="text-xs font-bold">জিপিএ (GPA)</p>
              <p className="text-xl font-black text-emerald-700">{resultData.gpa}</p>
            </div>
            <div className="bg-blue-100 text-blue-900 border border-blue-300 px-4 py-2 rounded-lg text-center">
              <p className="text-xs font-bold">মেধা স্থান</p>
              <p className="text-xl font-black text-blue-700">{resultData.position}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <TableHead className="w-20">কোড</TableHead>
                  <TableHead>বিষয়</TableHead>
                  <TableHead className="text-center">পূর্ণমান</TableHead>
                  <TableHead className="text-center">প্রাপ্ত নম্বর</TableHead>
                  <TableHead className="text-right">গ্রেড</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultData.subjects.map((sub, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50">
                    <TableCell className="font-mono text-slate-600">{sub.code}</TableCell>
                    <TableCell className="font-bold text-slate-800">{sub.name}</TableCell>
                    <TableCell className="text-center font-mono text-slate-600">{sub.fullMarks}</TableCell>
                    <TableCell className="text-center font-bold text-slate-900">{sub.obtainedMarks}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{sub.grade}</TableCell>
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
