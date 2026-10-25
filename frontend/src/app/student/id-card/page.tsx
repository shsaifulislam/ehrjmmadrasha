"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, GraduationCap, ShieldCheck } from "lucide-react";

export default function StudentIdCardPage() {
  const student = {
    nameBn: "মুহাম্মদ আব্দুল্লাহ",
    nameEn: "Muhammed Abdullah",
    studentId: "EHRJ-2026-001",
    roll: 1,
    class: "দাওরায়ে হাদীস (Dawra-e-Hadith)",
    department: "কিতাব বিভাগ",
    session: "২০২৬",
    guardianPhone: "01845-162664",
    bloodGroup: "B+",
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-teal-600" /> ডিজিটাল শিক্ষার্থী পরিচয়পত্র (ID Card)
          </h1>
          <p className="text-xs text-slate-500 mt-1">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা - প্রিন্টযোগ্য আইডি কার্ড</p>
        </div>

        <Button onClick={handlePrint} className="bg-teal-800 hover:bg-teal-900 text-white font-bold">
          <Printer className="mr-2 h-4 w-4" /> আইডি কার্ড প্রিন্ট করুন
        </Button>
      </div>

      {/* ID Card Box */}
      <div className="flex justify-center p-4">
        <div className="w-80 bg-white border-2 border-teal-800 rounded-xl shadow-xl overflow-hidden print:shadow-none print:m-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-900 to-emerald-950 text-white p-3 text-center border-b border-amber-400">
            <h2 className="text-xs font-bold leading-tight">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা</h2>
            <p className="text-[10px] text-amber-300">Eliotganj, Daudkandi, Comilla | ESTD. 2021</p>
            <div className="mt-1 inline-block bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
              ছাত্র পরিচয়পত্র - {student.session}
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-teal-100 text-teal-900 border-2 border-teal-700 flex items-center justify-center font-bold text-2xl shadow-inner">
              {student.nameBn[0]}
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">{student.nameBn}</h3>
              <p className="text-xs text-slate-500 font-mono">{student.nameEn}</p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-left text-xs space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">আইডি নম্বর:</span>
                <span className="font-bold font-mono text-teal-800">{student.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">জামায়াত:</span>
                <span className="font-bold text-slate-800">{student.class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">রোল নম্বর:</span>
                <span className="font-bold text-amber-700">{student.roll}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">অভিভাবক ফোন:</span>
                <span className="font-bold font-mono text-slate-700">{student.guardianPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">রক্তের গ্রুপ:</span>
                <span className="font-bold text-rose-600">{student.bloodGroup}</span>
              </div>
            </div>
          </div>

          {/* Footer Signature Area */}
          <div className="p-3 bg-teal-50 border-t flex justify-between items-center text-[10px]">
            <div className="flex items-center gap-1 text-teal-800 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" /> অফিশিয়াল কার্ড
            </div>
            <div className="text-right">
              <div className="h-4 border-b border-slate-400 w-16 mb-0.5"></div>
              <span className="text-slate-600 font-bold">অধ্যক্ষের স্বাক্ষর</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
