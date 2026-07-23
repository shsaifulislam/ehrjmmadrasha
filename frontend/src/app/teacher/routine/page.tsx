"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Clock } from "lucide-react";

export default function TeacherRoutinePage() {
  const schedule = [
    { period: "১ম ঘণ্টা", time: "০৮:৩০ AM - ০৯:১৫ AM", subject: "হাদীস শরীফ (মেশকাত)", class: "মেশকাত (Mishkat)", room: "৩০১ নং কক্ষ" },
    { period: "২য় ঘণ্টা", time: "০৯:১৫ AM - ১০:০০ AM", subject: "আরবি সাহিত্য (তাখাস্সুস)", class: "তাখাস্সুস ফিল আদাব", room: "৩০৪ নং কক্ষ" },
    { period: "৩য় ঘণ্টা", time: "১০:১৫ AM - ১১:০০ AM", subject: "ফিকহ (শরহে বেকায়া)", class: "শরহে বেকায়া", room: "২০২ নং কক্ষ" },
    { period: "৪র্থ ঘণ্টা", time: "১১:০০ AM - ১১:৪৫ AM", subject: "নাহু ও ছরফ (মিযান)", class: "মিযান (Mizan)", room: "১০১ নং কক্ষ" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-amber-600" /> শিক্ষক ক্লাসের দৈনিক সময়সূচী
        </h1>
        <p className="text-xs text-slate-500 mt-1">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা - শিক্ষক সাপ্তাহিক রুটিন</p>
      </div>

      <Card className="shadow-sm border-t-4 border-t-amber-500">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <CardTitle className="text-md font-bold text-slate-800">দৈনিক ক্লাস সময়সূচী (শনিবার - বৃহস্পতিবার)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <TableHead className="w-24">ঘণ্টা</TableHead>
                  <TableHead>সময়</TableHead>
                  <TableHead>বিষয়</TableHead>
                  <TableHead>জামায়াত / শ্রেণী</TableHead>
                  <TableHead className="text-right">শ্রেণীকক্ষ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((s, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50">
                    <TableCell className="font-bold text-amber-700">{s.period}</TableCell>
                    <TableCell className="font-mono text-slate-600 flex items-center gap-1.5 pt-3">
                      <Clock className="h-3.5 w-3.5 text-slate-400" /> {s.time}
                    </TableCell>
                    <TableCell className="font-bold text-slate-800">{s.subject}</TableCell>
                    <TableCell className="text-slate-700 font-medium">{s.class}</TableCell>
                    <TableCell className="text-right font-mono text-slate-600">{s.room}</TableCell>
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
