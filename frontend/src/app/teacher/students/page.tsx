"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TeacherStudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const students = [
    { id: "s1", roll: 1, nameBn: "মুহাম্মদ আব্দুল্লাহ", class: "দাওরায়ে হাদীস", guardianPhone: "01845162664", status: "নিয়মিত" },
    { id: "s2", roll: 2, nameBn: "উমর ফারুক", class: "দাওরায়ে হাদীস", guardianPhone: "01826416696", status: "নিয়মিত" },
    { id: "s3", roll: 3, nameBn: "আবু বকর সিদ্দীক", class: "জালালাইন", guardianPhone: "01949091911", status: "নিয়মিত" },
    { id: "s4", roll: 4, nameBn: "উসমান গনি", class: "হিফজ (Hifz)", guardianPhone: "01845162664", status: "নিয়মিত" },
    { id: "s5", roll: 5, nameBn: "আলী ইবনে আবী তালিব", class: "শিশু শ্রেণী (Nursery)", guardianPhone: "01826416696", status: "নিয়মিত" },
  ];

  const filtered = students.filter(s => 
    s.nameBn.includes(searchTerm) || s.roll.toString().includes(searchTerm) || s.class.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600" /> দায়িত্বপ্রাপ্ত জামায়াতের ছাত্র তালিকা
          </h1>
          <p className="text-xs text-slate-500 mt-1">শিক্ষক হিসেবে আপনার অ্যাসাইনকৃত জামায়াতের শিক্ষার্থীদের তথ্য</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ছাত্রের নাম বা রোল খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white text-sm"
          />
        </div>
      </div>

      <Card className="shadow-sm border-t-4 border-t-purple-600">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <CardTitle className="text-md font-bold text-slate-800">শিক্ষার্থী তালিকা ({filtered.length} জন)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/80">
                <TableRow>
                  <TableHead className="w-16">রোল</TableHead>
                  <TableHead>ছাত্রের নাম</TableHead>
                  <TableHead>জামায়াত / শ্রেণী</TableHead>
                  <TableHead>অভিভাবকের মোবাইল</TableHead>
                  <TableHead className="text-right">স্টেটাস</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className="hover:bg-slate-50">
                    <TableCell className="font-bold text-slate-700">{s.roll}</TableCell>
                    <TableCell className="font-medium text-slate-800">{s.nameBn}</TableCell>
                    <TableCell className="text-slate-600">{s.class}</TableCell>
                    <TableCell className="font-mono text-slate-600">{s.guardianPhone}</TableCell>
                    <TableCell className="text-right">
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
                        {s.status}
                      </span>
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
