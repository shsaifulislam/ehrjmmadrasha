"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Printer,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Download,
  CheckCircle2,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export interface StudentCardData {
  id: string;
  studentIdNumber: string;
  fullNameBn: string;
  fullNameEn: string;
  dateOfBirth: string;
  bloodGroup: string;
  residentialStatus: string;
  photoUrl?: string | null;
  fatherNameBn: string;
  fatherPhone: string;
  presentAddress: string;
  className: string;
  classCode?: string;
  sectionName: string;
  rollNumber: number;
  sessionName: string;
  expiryDate: string;
  qrCodeDataUrl: string;
  verifyUrl: string;
}

interface StudentIdCardViewProps {
  student: StudentCardData;
  onPrint?: () => void;
}

export default function StudentIdCardView({ student, onPrint }: StudentIdCardViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-4">
      {/* Action controls */}
      <div className="flex items-center justify-between gap-2 no-print">
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isFlipped ? "সামনের অংশ দেখুন (Front)" : "পেছনের অংশ দেখুন (Back)"}</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D5C3A] hover:bg-[#158052] text-white text-xs font-black shadow-md transition active:scale-95"
        >
          <Printer className="w-4 h-4 text-amber-300" />
          <span>আইডি কার্ড প্রিন্ট করুন (CR80)</span>
        </button>
      </div>

      {/* Card Container (Standard CR80 Aspect Ratio 85.6mm x 53.98mm approx 54:86 -> 320px x 500px in vertical ID) */}
      <div className="perspective-1000 flex justify-center">
        <div
          className={`id-card-element relative w-[320px] h-[510px] rounded-2xl shadow-2xl transition-all duration-700 transform-style-3d cursor-pointer ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* ==================== FRONT OF CARD ==================== */}
          <div
            className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-white border-2 border-[#D4AF37] flex flex-col backface-hidden shadow-xl ${
              isFlipped ? "invisible" : "visible"
            }`}
          >
            {/* Header: Dark Green & Gold Institutional Ribbon */}
            <div className="bg-gradient-to-br from-[#042416] via-[#0D5C3A] to-[#083822] text-white p-3.5 text-center relative border-b-2 border-[#D4AF37]">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-[9px] uppercase tracking-widest font-black bg-amber-400/20 text-amber-300 border border-[#D4AF37]/50 px-2 py-0.5 rounded-full">
                  শিক্ষার্থী ডিজিটাল পরিচয়পত্র
                </span>
              </div>
              <h3 className="text-[13px] font-black font-serif-bn leading-tight text-amber-200">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
              </h3>
              <p className="text-[8.5px] text-emerald-200/90 font-mono mt-0.5">
                স্থাপিত: ২০২১ ইং • ডাকঘর: ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা
              </p>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 flex flex-col items-center justify-between bg-gradient-to-b from-white via-emerald-50/20 to-white relative">
              {/* Decorative institutional watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <div className="w-40 h-40 rounded-full border-8 border-[#0D5C3A]" />
              </div>

              {/* Photo Frame */}
              <div className="relative mt-1">
                <div className="w-24 h-28 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-[#D4AF37] shadow-md flex items-center justify-center overflow-hidden">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.fullNameBn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0D5C3A] to-[#042416] text-amber-300">
                      <span className="font-serif-bn font-black text-3xl">
                        {student.fullNameBn.charAt(0)}
                      </span>
                      <span className="text-[8px] font-mono text-emerald-200 mt-1 uppercase">EHRJ</span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-700 text-white p-1 rounded-full border-2 border-white shadow">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                </div>
              </div>

              {/* Name & ID */}
              <div className="text-center w-full space-y-0.5 mt-2">
                <h4 className="text-base font-black text-slate-900 font-serif-bn leading-tight">
                  {student.fullNameBn}
                </h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {student.fullNameEn}
                </p>
                <div className="inline-block mt-1 bg-emerald-950 text-amber-300 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border border-amber-400/40 shadow-sm">
                  আইডি: {student.studentIdNumber}
                </div>
              </div>

              {/* Academic Grid */}
              <div className="w-full bg-slate-50/90 border border-slate-200/90 rounded-xl p-2.5 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] mt-1 shadow-inner">
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase">জামাত / শ্রেণি</span>
                  <strong className="text-slate-800 font-serif-bn truncate block">
                    {student.className}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase">শাখা ও রোল</span>
                  <strong className="text-slate-800 truncate block">
                    {student.sectionName} • রোল: {student.rollNumber}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase">আবাসিক মর্যাদা</span>
                  <strong className="text-emerald-800 block truncate font-bold">
                    {student.residentialStatus}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase">রক্তের গ্রুপ</span>
                  <strong className="text-red-600 block truncate font-black">
                    {student.bloodGroup}
                  </strong>
                </div>
              </div>

              {/* Signature Footer */}
              <div className="w-full flex items-end justify-between pt-2 border-t border-slate-200 text-[9px]">
                <div className="text-left">
                  <span className="text-slate-400 block text-[8px]">মেয়াদকাল</span>
                  <strong className="text-slate-700 block text-[8.5px]">
                    {student.expiryDate}
                  </strong>
                </div>

                <div className="text-center">
                  <div className="w-16 border-b border-slate-700 border-dashed pb-0.5">
                    <span className="font-serif italic text-[8.5px] text-emerald-950 block font-bold">
                      মুহতামিম
                    </span>
                  </div>
                  <span className="text-[7.5px] text-slate-500 block mt-0.5">কর্তৃপক্ষের স্বাক্ষর</span>
                </div>
              </div>
            </div>

            {/* Bottom green bar */}
            <div className="h-1.5 bg-gradient-to-r from-[#0D5C3A] via-[#D4AF37] to-[#0D5C3A]" />
          </div>

          {/* ==================== BACK OF CARD ==================== */}
          <div
            className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-white border-2 border-[#D4AF37] flex flex-col backface-hidden shadow-xl rotate-y-180 ${
              isFlipped ? "visible" : "invisible"
            }`}
          >
            {/* Header Ribbon */}
            <div className="bg-gradient-to-r from-[#0D5C3A] to-[#083822] text-white p-2 text-center border-b border-[#D4AF37]">
              <span className="text-[10px] font-black uppercase text-amber-200">
                জরুরি তথ্য ও প্রাতিষ্ঠানিক নির্দেশাবলী
              </span>
            </div>

            {/* Back Body */}
            <div className="flex-1 p-3.5 flex flex-col justify-between text-[9.5px] bg-slate-50/50">
              {/* Guardian Info */}
              <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">পিতার নাম:</span>
                  <strong className="text-slate-900 font-serif-bn">{student.fatherNameBn}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">জরুরি যোগাযোগ:</span>
                  <strong className="font-mono text-emerald-900">{student.fatherPhone}</strong>
                </div>
                <div className="flex items-start justify-between gap-1">
                  <span className="text-slate-500 shrink-0">ঠিকানা:</span>
                  <span className="text-slate-700 text-right truncate font-medium">
                    {student.presentAddress}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1 text-[8px] text-slate-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                <strong className="text-[8.5px] text-[#0D5C3A] block font-black">সাধারণ নিয়মাবলী:</strong>
                <p>১. এই পরিচয়পত্রটি হস্তান্তরযোগ্য নয় এবং সর্বদা সঙ্গে রাখা আবশ্যক।</p>
                <p>২. কার্ড হারিয়ে গেলে অবিলম্বে মাদরাসা অফিসে অবগত করতে হবে।</p>
                <p>৩. কার্ড প্রাপ্ত ব্যক্তিকে মাদরাসা ঠিকানায় জমা দেওয়ার অনুরোধ করা হলো।</p>
              </div>

              {/* QR Code and Official Stamp */}
              <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-16 h-16 shrink-0 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                  {student.qrCodeDataUrl ? (
                    <img
                      src={student.qrCodeDataUrl}
                      alt="Student QR Verification"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100" />
                  )}
                </div>

                <div className="flex-1 text-[8px] space-y-0.5">
                  <span className="font-bold text-slate-800 block text-[8.5px]">ডিজিটাল যাচাইকরণ</span>
                  <p className="text-slate-500 leading-tight">
                    স্মার্টফোনের ক্যামেরা দিয়ে কিউআর কোড স্ক্যান করে অফিসিয়াল ভেরিফিকেশন যাচাই করা যাবে।
                  </p>
                  <span className="text-[7.5px] font-mono text-[#0D5C3A] block font-semibold">
                    স্থাপিত: ২০২১ ইং • EHRJ-2021
                  </span>
                </div>
              </div>

              {/* Institutional Helpline */}
              <div className="text-center pt-1 border-t border-slate-200 text-[8px] text-slate-500">
                <span>মাদরাসা হেল্পলাইন: ০১৭১১-২২৩৩৪৪ • ওয়েবসাইট: ehrj.edu.bd</span>
              </div>
            </div>

            <div className="h-1.5 bg-gradient-to-r from-[#0D5C3A] via-[#D4AF37] to-[#0D5C3A]" />
          </div>
        </div>
      </div>
    </div>
  );
}
