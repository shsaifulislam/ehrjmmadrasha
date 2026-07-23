"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, MapPin, Calendar, Heart, Shield, GraduationCap } from "lucide-react";

export default function StudentProfilePage() {
  const student = {
    nameBn: "মুহাম্মদ আব্দুল্লাহ",
    nameEn: "Muhammed Abdullah",
    studentId: "EHRJ-2026-001",
    roll: 1,
    class: "দাওরায়ে হাদীস (Dawra-e-Hadith)",
    department: "কিতাব বিভাগ",
    session: "২০২৬",
    guardianName: "মাওলানা আব্দুর রহমান",
    guardianPhone: "01845-162664",
    bloodGroup: "B+",
    address: "ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <User className="h-6 w-6 text-teal-600" /> শিক্ষার্থী তথ্য প্রোফাইল
        </h1>
        <p className="text-xs text-slate-500 mt-1">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা - অফিশিয়াল রেকর্ড</p>
      </div>

      <Card className="shadow-sm border-t-4 border-t-teal-600">
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-2xl border-2 border-teal-500 shadow">
              {student.nameBn[0]}
            </div>
            <div className="text-center sm:text-left">
              <CardTitle className="text-lg font-bold text-slate-800">{student.nameBn}</CardTitle>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{student.nameEn}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  আইডি: {student.studentId}
                </span>
                <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  রোল: {student.roll}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-teal-900 border-b pb-1 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> একাডেমিক তথ্য
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">বিভাগ:</span>
                <span className="font-bold text-slate-800">{student.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">জামায়াত / শ্রেণী:</span>
                <span className="font-bold text-slate-800">{student.class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">শিক্ষাবর্ষ (সেশন):</span>
                <span className="font-bold text-slate-800">{student.session}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-teal-900 border-b pb-1 flex items-center gap-2">
              <Shield className="h-4 w-4" /> অভিভাবক ও যোগাযোগ
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">অভিভাবকের নাম:</span>
                <span className="font-bold text-slate-800">{student.guardianName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">যোগাযোগের মোবাইল:</span>
                <span className="font-bold text-slate-800 font-mono">{student.guardianPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">রক্তের গ্রুপ:</span>
                <span className="font-bold text-rose-700">{student.bloodGroup}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ঠিকানা:</span>
                <span className="font-bold text-slate-800">{student.address}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
