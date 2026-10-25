"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Phone,
  Home,
  BookOpen,
  Award,
  CreditCard,
  FileCheck,
  Building,
  DollarSign,
  QrCode,
  Check,
  Printer,
  Sparkles,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

// =========================================================================
// 0. AUTHORITATIVE HELPERS: DATE FORMATTER & DYNAMIC QR
// =========================================================================
export function formatGovtDate(rawDate: any, fallback = "০৮/১০/২০২৬"): string {
  if (!rawDate) return fallback;
  const str = String(rawDate).trim();
  if (
    str === "Invalid Date" ||
    str === "NaN" ||
    str === "undefined" ||
    str === "null" ||
    str === ""
  ) {
    return fallback;
  }

  const bnToEnMap: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };
  const asciiStr = str.replace(/[০-৯]/g, (w) => bnToEnMap[w] || w);

  try {
    const d = new Date(asciiStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("bn-BD", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  } catch {
    // continue
  }

  if (str.length >= 4 && !str.includes("Invalid") && !str.includes("NaN")) {
    return str;
  }

  return fallback;
}

export function useDocumentQr(doc: any): string {
  const [qrUri, setQrUri] = useState<string>(() => {
    if (doc?.qrCodeUrl && typeof doc.qrCodeUrl === "string" && doc.qrCodeUrl.length > 20) {
      return doc.qrCodeUrl;
    }
    const token = doc?.certificateNumber || doc?.verificationCode || "EHRJ-VERIFY-2026";
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://ehrjmadrasha.com/verify/document/${token}`)}`;
  });

  useEffect(() => {
    if (doc?.qrCodeUrl && typeof doc.qrCodeUrl === "string" && doc.qrCodeUrl.length > 20) {
      setQrUri(doc.qrCodeUrl);
      return;
    }
    const token = doc?.certificateNumber || doc?.verificationCode || "EHRJ-VERIFY-2026";
    const url = `https://ehrjmadrasha.com/verify/document/${encodeURIComponent(token)}`;

    let isMounted = true;
    import("qrcode")
      .then((QRCode) => {
        QRCode.default
          .toString(url, { type: "svg", margin: 1, color: { dark: "#083B25", light: "#FFFFFF" } })
          .then((svg) => {
            if (isMounted) {
              setQrUri(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
            }
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [doc?.qrCodeUrl, doc?.certificateNumber, doc?.verificationCode]);

  return qrUri;
}

export function DocumentQrImage({
  doc,
  className = "w-16 h-16",
  alt = "QR Code",
}: {
  doc: any;
  className?: string;
  alt?: string;
}) {
  const qrUri = useDocumentQr(doc);
  return (
    <img
      src={qrUri}
      alt={alt}
      className={`${className} border border-emerald-900/30 rounded-lg p-0.5 bg-white shadow-sm object-contain`}
    />
  );
}

// =========================================================================
// ISLAMIC ARABESQUE CORNER ORNAMENTS (SVG)
// =========================================================================
function ArabesqueCorner({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const rotation = {
    "top-left": "rotate-0",
    "top-right": "rotate-90",
    "bottom-right": "rotate-180",
    "bottom-left": "-rotate-90",
  }[position];

  return (
    <svg
      viewBox="0 0 100 100"
      className={`w-16 h-16 sm:w-20 sm:h-20 absolute pointer-events-none fill-none stroke-[#C59B27] ${rotation} ${
        position.includes("top") ? "top-2 sm:top-3" : "bottom-2 sm:bottom-3"
      } ${position.includes("left") ? "left-2 sm:left-3" : "right-2 sm:right-3"}`}
    >
      <path
        d="M 10 10 L 90 10 M 10 10 L 10 90 M 18 18 L 75 18 M 18 18 L 18 75 M 26 26 L 60 26 M 26 26 L 26 60"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="10" r="4" fill="#C59B27" />
      <circle cx="26" cy="26" r="3" fill="#083B25" stroke="#C59B27" strokeWidth="1" />
      <path
        d="M 26 26 Q 45 35 65 26 Q 35 45 26 65"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <circle cx="45" cy="45" r="2.5" fill="#C59B27" />
    </svg>
  );
}

// Ornate Official Seal of EHRJM
function OfficialMadrasaSeal({ year = "২০২৬" }: { year?: string }) {
  return (
    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 border-double border-[#C59B27] bg-[#FDFBF7] mx-auto flex flex-col items-center justify-center p-1 text-[#083B25] shadow-inner relative">
      <div className="absolute inset-1 rounded-full border border-dashed border-[#083B25]/50 pointer-events-none" />
      <span className="text-[7.5px] font-bold text-[#C59B27] tracking-wider uppercase">মাদরাসা মোহর</span>
      <span className="text-[9px] font-black leading-tight text-center">একাডেমিক<br />কাউন্সিল</span>
      <span className="text-[7px] font-mono text-emerald-900 font-bold mt-0.5">{year}</span>
      <span className="text-[6.5px] text-gray-500 font-mono">স্থাপিত: ২০২১ ইং</span>
    </div>
  );
}

// Dual Official Signature Blocks
function DualSignaturesBlock({
  principalTitle = "মুহতামিম ও অধ্যক্ষ",
  secondTitle = "সভাপতি, গভর্নিং বডি",
  secondName = "আলহাজ্ব ইঞ্জিনিয়ার মো: রফিকুল ইসলাম",
  thirdTitle,
  thirdName,
}: {
  principalTitle?: string;
  secondTitle?: string;
  secondName?: string;
  thirdTitle?: string;
  thirdName?: string;
}) {
  return (
    <div className="flex justify-between items-end gap-4 w-full pt-6 border-t-2 border-[#C59B27]/40 text-xs">
      {/* 1. Left: Controller / Third Authority (if provided) */}
      <div className="text-center space-y-1 flex-1">
        <div className="h-9 flex items-end justify-center">
          <span className="font-serif italic text-gray-800 text-xs sm:text-sm font-semibold border-b border-gray-700 pb-0.5 px-3">
            {thirdName || "মাওলানা আহমাদুল্লাহ"}
          </span>
        </div>
        <span className="font-bold text-gray-900 block text-[11px] sm:text-xs">
          {thirdTitle || "পরীক্ষা নিয়ন্ত্রক / নাজেমে তালিমাত"}
        </span>
        <span className="text-[9.5px] text-gray-500 block">একাডেমিক পরিষদ</span>
      </div>

      {/* 2. Center: Governing Body President */}
      <div className="text-center space-y-1 flex-1">
        <div className="h-9 flex items-end justify-center">
          <span className="font-serif italic text-gray-800 text-xs sm:text-sm font-semibold border-b border-gray-700 pb-0.5 px-3">
            {secondName}
          </span>
        </div>
        <span className="font-bold text-gray-900 block text-[11px] sm:text-xs">{secondTitle}</span>
        <span className="text-[9.5px] text-gray-500 block">পরিচালনা পরিষদ</span>
      </div>

      {/* 3. Right: Muhtamim & Principal */}
      <div className="text-center space-y-1 flex-1">
        <div className="h-9 flex items-end justify-center">
          <span className="font-serif italic text-[#083B25] text-xs sm:text-sm font-bold border-b-2 border-[#083B25] pb-0.5 px-3">
            মাওলানা মো: আবুল কালাম সরকার
          </span>
        </div>
        <span className="font-black text-[#083B25] block text-[11px] sm:text-xs">{principalTitle}</span>
        <span className="text-[9.5px] text-emerald-800 font-semibold block">{INSTITUTION_INFO.nameBn}</span>
      </div>
    </div>
  );
}

// Institutional Header for A4 Landscape Certificates
function CertificateHeader({
  subDepartment = "উচ্চতর ইসলামী শিক্ষা ও গবেষণা অনুষদ",
  hadithArabic = "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
  memoNo,
  issueDate,
}: {
  subDepartment?: string;
  hadithArabic?: string;
  memoNo?: string;
  issueDate?: any;
}) {
  return (
    <div className="space-y-2 relative z-10 border-b-2 border-[#C59B27]/50 pb-4">
      {/* Ornate Bismillah Ribbon */}
      <div className="flex items-center justify-center gap-3">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#C59B27] to-[#C59B27] flex-1 max-w-[120px]" />
        <span className="text-base sm:text-xl font-arabic text-emerald-950 font-bold tracking-widest px-3 py-0.5 bg-[#FAF7EE] border border-[#C59B27]/40 rounded-full shadow-sm">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </span>
        <div className="h-[1px] bg-gradient-to-l from-transparent via-[#C59B27] to-[#C59B27] flex-1 max-w-[120px]" />
      </div>

      {hadithArabic && (
        <span className="text-xs sm:text-sm font-arabic text-amber-900 font-semibold block text-center">
          {hadithArabic}
        </span>
      )}

      {/* Madrasa Title & Metadata Strip */}
      <div className="flex items-center justify-between gap-4 pt-1">
        {/* Memo & Serial */}
        <div className="text-left text-[11px] font-mono text-gray-700 space-y-0.5 flex-1">
          <div>স্মারক নং: <strong className="text-[#083B25]">{memoNo || "EHRJ/সনদ/২০২৬/০৮৯"}</strong></div>
          <div className="text-[10px] text-gray-500">নিবন্ধিত সনদ রেজিস্টার বহি</div>
        </div>

        {/* Center: Monogram & Full Bengali Title */}
        <div className="text-center flex-2">
          <div className="flex items-center justify-center gap-2.5">
            <img
              src={INSTITUTION_INFO.logoUrl}
              alt="Logo"
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border-2 border-[#C59B27] bg-white object-cover shadow-sm"
            />
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black font-display text-[#083B25] tracking-tight leading-tight">
                {INSTITUTION_INFO.nameBn}
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-700 font-serif font-semibold">{INSTITUTION_INFO.nameEn}</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-600 mt-0.5">
            ডাকঘর: ইলিয়টগঞ্জ, উপজেলা: দাউদকান্দি, জেলা: কুমিল্লা | <strong>স্থাপিত: ২০২১ ইং (ESTD 2021)</strong>
          </p>
          <span className="inline-block mt-0.5 bg-emerald-900/10 border border-[#C59B27]/40 text-[#083B25] text-[10px] font-bold px-3 py-0.5 rounded-full">
            {subDepartment} • কঠোরভাবে কোনো EIIN নেই
          </span>
        </div>

        {/* Right: Date */}
        <div className="text-right text-[11px] font-mono text-gray-700 space-y-0.5 flex-1">
          <div>ইস্যুর তারিখ: <strong>{formatGovtDate(issueDate, "০৮/১০/২০২৬")}</strong></div>
          <div className="text-[10px] text-gray-500">হিজরি সন: ১৪৪৭-৪৮ হি.</div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 1. DUAL-SIDED CR80 PVC SMART STUDENT ID CARD (আন্তর্জাতিক স্ট্যান্ডার্ড)
// =========================================================================
export function StudentIDCanvas({ doc, compact = false }: { doc: any; compact?: boolean }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const student = snapshot.student || {};
  const cls = snapshot.class || {};
  const sec = snapshot.section || {};
  const guardian = snapshot.guardian || {};
  const session = snapshot.session || {};
  const isRevoked = Boolean(doc?.isRevoked);

  return (
    <div className={`flex flex-col md:flex-row gap-6 justify-center items-center ${compact ? "p-1" : "p-4"} font-sans`}>
      {/* FRONT SIDE (CR80 Standard Ratio: 85.6mm x 53.98mm / 340px x 215px) */}
      <div className="w-[340px] h-[215px] bg-gradient-to-br from-[#041F14] via-[#083B25] to-[#0D5C3A] text-white rounded-2xl p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between border-2 border-[#C59B27] select-none">
        {/* Subtle Watermark Islamic Arch */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none flex items-center justify-center font-serif text-8xl font-black tracking-widest">
          EHRJ
        </div>

        {isRevoked && (
          <div className="absolute inset-0 bg-red-950/85 z-30 flex items-center justify-center -rotate-12 pointer-events-none">
            <span className="bg-red-600 text-white font-black text-xs px-6 py-1 tracking-widest border border-white uppercase shadow-2xl">
              বাতিল / REVOKED
            </span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center gap-2 border-b border-amber-400/40 pb-1.5 relative z-10">
          <img
            src={INSTITUTION_INFO.logoUrl}
            alt="Logo"
            className="w-9 h-9 rounded-full border border-amber-300 bg-white object-cover shrink-0 shadow-sm"
          />
          <div className="text-left flex-1 min-w-0 pr-1">
            <span className="text-[10px] font-bold font-display text-amber-300 block leading-tight truncate">
              {INSTITUTION_INFO.nameBn}
            </span>
            <span className="text-[7px] text-emerald-100 font-mono tracking-wider block uppercase truncate">
              ELIOTGANJ HAZI ROHMATOLLAH JAMIRIA MADRASHA
            </span>
            <span className="text-[6.5px] text-amber-200/90 block">স্থাপিত: ২০২১ ইং • দাউদকান্দি, কুমিল্লা</span>
          </div>
          <span className="text-[8px] font-mono bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full font-black shrink-0 shadow-sm">
            {session.name || "২০২৬"}
          </span>
        </div>

        {/* Center Details */}
        <div className="flex items-center gap-3 my-auto relative z-10">
          <div className="w-18 h-22 rounded-xl bg-white/10 border-2 border-amber-300/80 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-900/50 text-emerald-200">
                <UserCheck className="w-7 h-7 text-amber-200" />
                <span className="text-[6.5px] font-mono">ছবি সংরক্ষিত</span>
              </div>
            )}
          </div>
          <div className="text-left text-[11px] space-y-0.5 flex-1 min-w-0">
            <span className="font-black text-white text-xs block truncate leading-tight">
              {student.nameBn || "শিক্ষার্থীর নাম"}
            </span>
            <span className="text-[9px] text-amber-200 block truncate font-mono">
              {student.nameEn || "STUDENT NAME"}
            </span>
            <div className="text-[9.5px] text-emerald-100 font-mono space-y-0.5 pt-0.5">
              <div>আইডি: <strong className="text-amber-300 text-[10.5px]">{student.studentId}</strong></div>
              <div>জামাত: <strong className="text-white">{cls.name || "সাধারণ"}</strong> | রোল: <strong>{student.roll || 1}</strong></div>
              <div>শাখা: {sec.name || "ক"} | ধরন: {student.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}</div>
              {student.bloodGroup && student.bloodGroup !== "N/A" && (
                <div className="flex items-center gap-1">
                  <span>রক্তের গ্রুপ:</span>
                  <span className="bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full">
                    {student.bloodGroup}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-center border-t border-amber-400/30 pt-1 text-[8px] relative z-10">
          <span className="font-mono text-emerald-200 font-bold">{doc?.certificateNumber}</span>
          <span className="text-amber-300 font-bold tracking-wide">স্মার্ট শিক্ষার্থী ডিজিটাল পরিচয়পত্র</span>
        </div>
      </div>

      {/* BACK SIDE (CR80 Standard) */}
      <div className="w-[340px] h-[215px] bg-[#FFFDF9] text-gray-800 rounded-2xl p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between border-2 border-gray-300 select-none">
        {/* Top Header */}
        <div className="border-b border-gray-200 pb-1 text-center">
          <span className="text-[10px] font-bold text-[#083B25] block">জরুরি যোগাযোগ ও কার্ডের শর্তাবলি</span>
          <span className="text-[7px] text-gray-500 block">
            পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা | স্থাপিত: ২০২১ ইং
          </span>
        </div>

        {/* Body & QR */}
        <div className="flex items-center justify-between gap-2.5 text-[9.5px] my-auto">
          <div className="space-y-1 text-left flex-1 min-w-0">
            <div>
              <span className="text-gray-500 text-[8.5px]">পিতা/অভিভাবক:</span>{" "}
              <strong className="text-gray-900 truncate block text-[9.5px]">{guardian.name || student.fatherNameBn}</strong>
            </div>
            <div>
              <span className="text-gray-500 text-[8.5px]">জরুরি ফোন:</span>{" "}
              <span className="font-mono font-bold text-[#083B25]">{guardian.phone || INSTITUTION_INFO.primaryPhone}</span>
            </div>
            <div>
              <span className="text-gray-500 text-[8.5px]">স্থায়ী ঠিকানা:</span>{" "}
              <span className="text-[8.5px] block text-gray-700 truncate">{student.presentAddress || "ইলিয়টগঞ্জ, কুমিল্লা"}</span>
            </div>
            <div className="text-[7px] text-gray-500 leading-tight pt-0.5">
              * কার্ডটি হারিয়ে গেলে অবিলম্বে মাদরাসা অফিসে অবহিত করুন। পাওয়া গেলে নিকটস্থ ডাকবাক্সে ফেলুন বা মাদরাসায় হস্তান্তর করুন।
            </div>
          </div>

          {/* Real Live QR Code */}
          <div className="text-center shrink-0 pl-1">
            <DocumentQrImage doc={doc} className="w-16 h-16" />
            <span className="text-[6.5px] font-mono text-emerald-900 font-bold block mt-0.5">ভেরিফাই স্ক্যান</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end border-t border-gray-200 pt-1 text-[8px] text-gray-500">
          <div>
            <span>ইস্যু: {formatGovtDate(doc?.issueDate, "০৮/১০/২০২৬")}</span>
            <span className="block font-mono text-[7px] text-gray-400">{doc?.verificationCode}</span>
          </div>
          <div className="text-center">
            <span className="block border-b border-gray-400 text-[8px] italic font-serif text-[#083B25] pb-0.5 font-bold">
              মাওলানা মো: আবুল কালাম সরকার
            </span>
            <span className="font-bold text-[#083B25] text-[7.5px]">মুহতামিম ও অধ্যক্ষ স্বাক্ষর</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Teacher ID Card
export function TeacherIDCanvas({ doc }: { doc: any }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const teacher = snapshot.teacher || {};
  const isRevoked = Boolean(doc?.isRevoked);

  return (
    <div className="flex flex-col md:flex-row gap-6 justify-center items-center p-4 font-sans">
      {/* Front */}
      <div className="w-[340px] h-[215px] bg-gradient-to-br from-[#062447] via-[#0E3A6C] to-[#124C8F] text-white rounded-2xl p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between border-2 border-[#C59B27] select-none">
        <div className="flex items-center gap-2 border-b border-amber-300/40 pb-1.5 relative z-10">
          <img src={INSTITUTION_INFO.logoUrl} alt="Logo" className="w-9 h-9 rounded-full border border-amber-300 bg-white object-cover shrink-0" />
          <div className="text-left flex-1 min-w-0 pr-1">
            <span className="text-[10px] font-bold text-amber-300 block truncate">{INSTITUTION_INFO.nameBn}</span>
            <span className="text-[7px] text-blue-100 font-mono tracking-wider block truncate">FACULTY IDENTITY CARD</span>
            <span className="text-[6.5px] text-amber-200 block">স্থাপিত: ২০২১ ইং • কোনো EIIN নেই</span>
          </div>
          <span className="text-[8px] font-mono bg-amber-400 text-blue-950 px-2 py-0.5 rounded-full font-black shrink-0">
            শিক্ষক / স্টাফ
          </span>
        </div>

        <div className="flex items-center gap-3 my-auto relative z-10">
          <div className="w-18 h-22 rounded-xl bg-white/10 border-2 border-amber-300/80 overflow-hidden flex items-center justify-center shrink-0">
            {teacher.photoUrl ? (
              <img src={teacher.photoUrl} alt="Teacher" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-blue-950/60 text-blue-200">
                <UserCheck className="w-7 h-7 text-amber-300" />
                <span className="text-[6.5px] font-mono">ছবি সংরক্ষিত</span>
              </div>
            )}
          </div>
          <div className="text-left text-[11px] space-y-0.5 flex-1 min-w-0">
            <span className="font-black text-white text-xs block truncate">{teacher.nameBn || "শিক্ষকের নাম"}</span>
            <span className="text-[9px] text-amber-200 block truncate font-mono">{teacher.nameEn || "FACULTY MEMBER"}</span>
            <div className="text-[9.5px] text-blue-100 font-mono space-y-0.5 pt-0.5">
              <div>এমপ্লয়ি আইডি: <strong className="text-amber-300 text-[10.5px]">{teacher.employeeId || "EMP-001"}</strong></div>
              <div>পদবি: <strong className="text-white">{teacher.designation || "উস্তাদ / শিক্ষক"}</strong></div>
              <div>বিভাগ: {teacher.department || "হিফজুল কুরআন ও কিতাব"}</div>
              <div>মোবাইল: <span className="text-amber-300 font-bold">{teacher.phone}</span></div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-amber-300/30 pt-1 text-[8px] relative z-10">
          <span className="font-mono text-blue-200 font-bold">{doc?.certificateNumber}</span>
          <span className="text-amber-300 font-bold">অফিশিয়াল ফ্যাকাল্টি পরিচয়পত্র</span>
        </div>
      </div>

      {/* Back */}
      <div className="w-[340px] h-[215px] bg-[#FFFDF9] text-gray-800 rounded-2xl p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between border-2 border-gray-300 select-none">
        <div className="border-b border-gray-200 pb-1 text-center">
          <span className="text-[10px] font-bold text-[#0E3A6C] block">শিক্ষক ও কর্মকর্তা পরিচয়পত্রের নিয়মাবলি</span>
          <span className="text-[7px] text-gray-500 block">পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা | স্থাপিত: ২০২১ ইং</span>
        </div>

        <div className="flex items-center justify-between gap-2.5 text-[9.5px] my-auto">
          <div className="space-y-1 text-left flex-1 min-w-0">
            <div><span className="text-gray-500 text-[8.5px]">জাতীয় পরিচয়পত্র:</span> <strong className="text-gray-900 block text-[9px]">{teacher.nid || "১৯৮৫১৯১...০৯"}</strong></div>
            <div><span className="text-gray-500 text-[8.5px]">স্থায়ী ঠিকানা:</span> <span className="text-[8.5px] block text-gray-700 truncate">{teacher.permanentAddress || "দাউদকান্দি, কুমিল্লা"}</span></div>
            <div className="text-[7px] text-gray-500 leading-tight pt-0.5">
              * অত্র কার্ডটি ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সম্পত্তি। কার্ডধারী প্রতিষ্ঠানের একজন দায়িত্বশীল শিক্ষক/কর্মকর্তা।
            </div>
          </div>

          <div className="text-center shrink-0 pl-1">
            <DocumentQrImage doc={doc} className="w-16 h-16 border-blue-900/30" />
            <span className="text-[6.5px] font-mono text-blue-950 font-bold block mt-0.5">ভেরিফাই স্ক্যান</span>
          </div>
        </div>

        <div className="flex justify-between items-end border-t border-gray-200 pt-1 text-[8px] text-gray-500">
          <div>
            <span>ইস্যু: {formatGovtDate(doc?.issueDate, "০৮/১০/২০২৬")}</span>
            <span className="block font-mono text-[7px] text-gray-400">{doc?.verificationCode}</span>
          </div>
          <div className="text-center">
            <span className="block border-b border-gray-400 text-[8px] italic font-serif text-[#083B25] pb-0.5 font-bold">
              মাওলানা মো: আবুল কালাম সরকার
            </span>
            <span className="font-bold text-[#083B25] text-[7.5px]">মুহতামিম ও অধ্যক্ষ স্বাক্ষর</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 2. TRANSFER CERTIFICATE (ছাড়পত্র / বদলি সনদ - TC / পিসি)
// =========================================================================
export function TransferCertificateCanvas({ doc }: { doc: any }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const student = snapshot.student || {};
  const cls = snapshot.class || {};
  const session = snapshot.session || {};
  const isRevoked = Boolean(doc?.isRevoked);

  return (
    <div className="w-full max-w-[850px] mx-auto bg-[#FFFDF8] border-4 border-[#083B25] p-6 sm:p-10 rounded-2xl shadow-xl relative overflow-hidden font-sans text-left space-y-5">
      {/* Corner Ornaments */}
      <ArabesqueCorner position="top-left" />
      <ArabesqueCorner position="top-right" />
      <ArabesqueCorner position="bottom-left" />
      <ArabesqueCorner position="bottom-right" />

      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none font-black text-8xl text-emerald-950">
        ছাড়পত্র
      </div>

      {isRevoked && (
        <div className="bg-red-100 border-2 border-red-600 p-2.5 rounded-xl text-red-900 text-xs font-bold uppercase tracking-wider text-center">
          ⚠ এই ছাড়পত্রটি মাদরাসা কর্তৃপক্ষ কর্তৃক বাতিল (REVOKED) করা হয়েছে।
        </div>
      )}

      {/* Header */}
      <div className="text-center border-b-2 border-[#C59B27]/60 pb-4 relative z-10 space-y-1">
        <span className="text-sm font-arabic text-emerald-950 font-bold block">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </span>
        <div className="flex items-center justify-center gap-3">
          <img src={INSTITUTION_INFO.logoUrl} alt="Logo" className="w-14 h-14 rounded-full border-2 border-[#C59B27] object-cover bg-white shadow-sm" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-[#083B25]">
              {INSTITUTION_INFO.nameBn}
            </h1>
            <p className="text-xs text-gray-700 font-serif font-bold">{INSTITUTION_INFO.nameEn}</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-600">
          পূর্ব লক্ষ্মীপুর, ডাকঘর: ইলিয়টগঞ্জ, উপজেলা: দাউদকান্দি, জেলা: কুমিল্লা | <strong>স্থাপিত: ২০২১ ইং (ESTD 2021)</strong>
        </p>
        <span className="inline-block bg-emerald-900/10 border border-[#C59B27]/40 text-[#083B25] text-[10px] font-bold px-3 py-0.5 rounded-full">
          কওমি, তাহফীজুল কুরআন ও কিতাব বিভাগ • কঠোরভাবে কোনো EIIN নেই
        </span>

        {/* Memo & Date Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-gray-700 pt-3 border-t border-gray-200 mt-2">
          <div>স্মারক নং: <strong className="text-[#083B25]">{doc?.certificateNumber || "EHRJ/TC/২০২৬/০৫১"}</strong></div>
          <div>ইস্যুর তারিখ: <strong>{formatGovtDate(doc?.issueDate, "০৮/১০/২০২৬")}</strong></div>
        </div>
      </div>

      {/* TC Title Badge */}
      <div className="text-center py-1 relative z-10">
        <span className="inline-block bg-[#083B25] text-amber-300 border-2 border-[#C59B27] px-8 py-2 rounded-full text-base sm:text-lg font-black shadow-md">
          ★ ছাড়পত্র ও বদলি সনদ (TRANSFER CERTIFICATE - TC / পিসি) ★
        </span>
        <p className="text-[11px] text-gray-500 mt-1">
          (পূর্ববর্তী সকল দেনা-পাওনা পরিশোধপূর্বক প্রতিষ্ঠান ত্যাগের চূড়ান্ত প্রত্যয়নপত্র)
        </p>
      </div>

      {/* Structured 10-Row Official Student Information Grid */}
      <div className="border border-gray-300 rounded-xl overflow-hidden bg-white text-xs relative z-10">
        <table className="w-full border-collapse">
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="w-1/3 p-2.5 font-bold bg-[#FBF9F3] text-gray-800 border-r border-gray-200">১. শিক্ষার্থীর পূর্ণ নাম:</td>
              <td className="p-2.5 text-gray-900 font-bold text-sm text-[#083B25]">{student.nameBn || "মুহাম্মদ আব্দুল্লাহ"}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#FBF9F3] text-gray-800 border-r border-gray-200">২. ইংরেজি নাম (বড় অক্ষরে):</td>
              <td className="p-2.5 font-mono text-gray-800 font-bold">{student.nameEn || "MUHAMMAD ABDULLAH"}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#FBF9F3] text-gray-800 border-r border-gray-200">৩. স্টুডেন্ট আইডি ও রোল:</td>
              <td className="p-2.5 font-mono text-gray-900">
                আইডি: <strong className="text-emerald-900">{student.studentId}</strong> | শ্রেণি রোল: <strong>{student.roll || 1}</strong>
              </td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#FBF9F3] text-gray-800 border-r border-gray-200">৪. পিতা ও মাতার নাম:</td>
              <td className="p-2.5 text-gray-800">
                পিতা: <strong>{student.fatherNameBn}</strong> | মাতা: <strong>{student.motherNameBn}</strong>
              </td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#FBF9F3] text-gray-800 border-r border-gray-200">৫. স্থায়ী ও বর্তমান ঠিকানা:</td>
              <td className="p-2.5 text-gray-800">{student.presentAddress || "গ্রাম: পূর্ব লক্ষ্মীপুর, ডাক: ইলিয়টগঞ্জ, উপজেলা: দাউদকান্দি, জেলা: কুমিল্লা"}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#FBF9F3] text-gray-800 border-r border-gray-200">৬. জন্ম তারিখ:</td>
              <td className="p-2.5 text-gray-800 font-mono">
                {formatGovtDate(student.dob, "১৫/০৩/২০১৪")} (রেকর্ড বহি অনুযায়ী)
              </td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#FBF9F3] text-gray-800 border-r border-gray-200">৭. অত্র মাদরাসায় ভর্তির শিক্ষাবর্ষ:</td>
              <td className="p-2.5 text-gray-800 font-semibold">{session.name || "২০২৬"} শিক্ষাবর্ষ (ভর্তি রেজিস্টার ক্রম অনুযায়ী)</td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#FBF9F3] text-gray-800 border-r border-gray-200">৮. ত্যাগের সময় অধ্যয়নরত জামাত/শ্রেণি:</td>
              <td className="p-2.5 text-gray-900 font-bold">{cls.name || "হিফজুল কুরআন বিভাগ / কিতাব বিভাগ"}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#FBF9F3] text-gray-800 border-r border-gray-200">৯. আর্থিক দেনা-পাওনা পরিশোধের বিবরণ:</td>
              <td className="p-2.5 text-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>সম্পূর্ণ পরিশোধিত (মাদরাসার নিকট কোনো প্রকার বকেয়া দেনা-পাওনা নেই)</span>
              </td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#FBF9F3] text-gray-800 border-r border-gray-200">১০. মাদরাসা ত্যাগের কারণ:</td>
              <td className="p-2.5 text-gray-800 font-semibold">অভিভাবকের লিখিত আবেদন ও বাসস্থান পরিবর্তন / উচ্চতর শিক্ষার্থে</td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#FBF9F3] text-gray-800 border-r border-gray-200">১১. আচরণ ও চারিত্রিক রেকর্ড:</td>
              <td className="p-2.5 text-gray-900 font-bold">অত্যন্ত উত্তম, দ্বীনি আদববান ও অনুকরণীয়</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Formal Certification Statement */}
      <div className="text-justify text-xs text-gray-700 leading-relaxed bg-[#F8FAFC] p-3.5 rounded-xl border border-gray-200 relative z-10">
        <p>
          এতদ্বারা প্রত্যয়ন করা যাইতেছে যে, অত্র মাদরাসায় অধ্যয়নকালে শিক্ষার্থী প্রতিষ্ঠানের যাবতীয় নিয়মশৃঙ্খলা মান্য করিয়া চলিয়াছে। তাহার বিরুদ্ধে কোনো প্রকার শৃঙ্খলাভঙ্গ বা অনৈতিক কার্যকলাপে জড়িত থাকার প্রমাণ পাওয়া যায়নি। তাহার প্রার্থিত ভবিষ্যৎ শিক্ষাজীবনে অন্য যেকোনো দ্বীনি মাদরাসা কিংবা শিক্ষা প্রতিষ্ঠানে ভর্তি হইতে কর্তৃপক্ষের কোনো আপত্তি নেই। আমরা তাহার উত্তরোত্তর দ্বীনি ও ইহলৌকিক সাফল্য কামনা করি।
        </p>
      </div>

      {/* Verification Stamp & Dual Signatures */}
      <div className="pt-4 relative z-10">
        <div className="flex items-center justify-between pb-3">
          <div className="text-center space-y-1">
            <DocumentQrImage doc={doc} className="w-18 h-18 mx-auto" />
            <span className="text-[8px] font-mono text-gray-500 block">ডিজিটাল সত্যতা যাচাই: {doc?.verificationCode}</span>
          </div>

          <OfficialMadrasaSeal />

          <div className="text-right text-[10px] text-gray-500 font-mono">
            <div>যাচাই ওয়েব: ehrjmadrasha.com</div>
            <div>হেল্পলাইন: {INSTITUTION_INFO.primaryPhone}</div>
          </div>
        </div>

        <DualSignaturesBlock
          principalTitle="মুহতামিম ও অধ্যক্ষ"
          secondTitle="সভাপতি, গভর্নিং বডি"
          secondName="আলহাজ্ব ইঞ্জিনিয়ার মো: রফিকুল ইসলাম"
          thirdTitle="হি.শা. ছাড়পত্র / রেজিস্ট্রার"
          thirdName="মাওলানা আব্দুর রহমান"
        />
      </div>
    </div>
  );
}

// =========================================================================
// 3. ACADEMIC RESULT MARKSHEET (নম্বরপত্র / একাডেমিক ফলাফল)
// =========================================================================
export function ResultMarksheetCanvas({ doc }: { doc: any }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const student = snapshot.student || {};
  const cls = snapshot.class || {};
  const session = snapshot.session || {};
  const exam = snapshot.exam || {};
  const isRevoked = Boolean(doc?.isRevoked);

  return (
    <div className="w-full max-w-[850px] mx-auto bg-[#FFFDF9] border-4 border-[#083B25] p-6 sm:p-10 rounded-2xl shadow-xl relative overflow-hidden font-sans text-left space-y-5">
      <ArabesqueCorner position="top-left" />
      <ArabesqueCorner position="top-right" />
      <ArabesqueCorner position="bottom-left" />
      <ArabesqueCorner position="bottom-right" />

      {isRevoked && (
        <div className="bg-red-100 border-2 border-red-600 p-2.5 rounded-xl text-red-900 text-xs font-bold uppercase tracking-wider text-center">
          ⚠ এই একাডেমিক নম্বরপত্রটি বাতিল (REVOKED) করা হয়েছে।
        </div>
      )}

      {/* Header */}
      <div className="text-center border-b-2 border-[#C59B27]/60 pb-4 relative z-10 space-y-1">
        <span className="text-sm font-arabic text-emerald-950 font-bold block">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </span>
        <div className="flex items-center justify-center gap-3">
          <img src={INSTITUTION_INFO.logoUrl} alt="Logo" className="w-14 h-14 rounded-full border-2 border-[#C59B27] object-cover bg-white shadow-sm" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-[#083B25]">
              {INSTITUTION_INFO.nameBn}
            </h1>
            <p className="text-xs text-gray-700 font-serif font-bold">{INSTITUTION_INFO.nameEn}</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-600">
          পূর্ব লক্ষ্মীপুর, ডাকঘর: ইলিয়টগঞ্জ, উপজেলা: দাউদকান্দি, জেলা: কুমিল্লা | <strong>স্থাপিত: ২০২১ ইং (ESTD 2021)</strong>
        </p>
        <span className="inline-block bg-emerald-900/10 border border-[#C59B27]/40 text-[#083B25] text-[10px] font-bold px-3 py-0.5 rounded-full">
          কেন্দ্রীয় পরীক্ষা নিয়ন্ত্রণ ও ফলাফল মূল্যায়ন বোর্ড • কোনো EIIN নেই
        </span>

        <div className="flex items-center justify-between text-xs font-mono text-gray-700 pt-3 border-t border-gray-200 mt-2">
          <div>ট্রান্সক্রিপ্ট নং: <strong className="text-[#083B25]">{doc?.certificateNumber || "EHRJ/RES/২০২৬/০৮৮"}</strong></div>
          <div>প্রকাশের তারিখ: <strong>{formatGovtDate(doc?.issueDate, "০৮/১০/২০২৬")}</strong></div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center py-1 relative z-10">
        <span className="inline-block bg-[#083B25] text-amber-300 border-2 border-[#C59B27] px-8 py-2 rounded-full text-base sm:text-lg font-black shadow-md">
          ★ একাডেমিক ফলাফল ও নম্বরপত্র (ACADEMIC MARKSHEET / TRANSCRIPT) ★
        </span>
        <p className="text-xs font-bold text-amber-900 mt-1">
          {exam.name || "কেন্দ্রীয় বার্ষিক সমাপনী পরীক্ষা ২০২৬"}
        </p>
      </div>

      {/* Student Details Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-gray-300 text-xs shadow-sm relative z-10">
        <div>
          <span className="text-gray-500 block text-[10px]">শিক্ষার্থীর পূর্ণ নাম:</span>
          <strong className="text-gray-900 text-sm">{student.nameBn || "মুহাম্মদ আব্দুল্লাহ"}</strong>
        </div>
        <div>
          <span className="text-gray-500 block text-[10px]">স্টুডেন্ট আইডি:</span>
          <strong className="font-mono text-[#083B25] text-sm">{student.studentId}</strong>
        </div>
        <div>
          <span className="text-gray-500 block text-[10px]">জামাত ও শাখা:</span>
          <strong className="text-gray-900">{cls.name || "সাধারণ"} (রোল: {student.roll || 1})</strong>
        </div>
        <div>
          <span className="text-gray-500 block text-[10px]">শিক্ষাবর্ষ:</span>
          <strong className="text-gray-900 font-mono">{session.name || "২০২৬"}</strong>
        </div>
      </div>

      {/* Tabular Subject Marks */}
      <div className="overflow-x-auto relative z-10">
        <table className="w-full text-xs border border-gray-300 rounded-xl overflow-hidden">
          <thead className="bg-[#083B25] text-white">
            <tr>
              <th className="p-2.5 text-left border-r border-emerald-800">ক্রম</th>
              <th className="p-2.5 text-left border-r border-emerald-800">কিতাব ও বিষয়সমূহ</th>
              <th className="p-2.5 text-center border-r border-emerald-800">পূর্ণমান</th>
              <th className="p-2.5 text-center border-r border-emerald-800">লিখিত</th>
              <th className="p-2.5 text-center border-r border-emerald-800">মৌখিক/আমলি</th>
              <th className="p-2.5 text-center border-r border-emerald-800">প্রাপ্ত নম্বর</th>
              <th className="p-2.5 text-center border-r border-emerald-800">লেটার গ্রেড</th>
              <th className="p-2.5 text-center">গ্রেড পয়েন্ট</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            <tr>
              <td className="p-2 font-mono border-r text-center">০১</td>
              <td className="p-2 font-semibold border-r">পবিত্র কুরআনুল কারীম ও তাজবীদ / হিফজ</td>
              <td className="p-2 text-center font-mono border-r">১০০</td>
              <td className="p-2 text-center font-mono border-r">৪৮</td>
              <td className="p-2 text-center font-mono border-r">৪৭</td>
              <td className="p-2 text-center font-mono font-bold text-emerald-900 border-r">৯৫</td>
              <td className="p-2 text-center font-bold text-emerald-900 border-r">A+</td>
              <td className="p-2 text-center font-mono font-bold">৫.০০</td>
            </tr>
            <tr>
              <td className="p-2 font-mono border-r text-center">০২</td>
              <td className="p-2 font-semibold border-r">হাদিস শরিফ ও উলূমুল হাদিস</td>
              <td className="p-2 text-center font-mono border-r">১০০</td>
              <td className="p-2 text-center font-mono border-r">৪৬</td>
              <td className="p-2 text-center font-mono border-r">৪৬</td>
              <td className="p-2 text-center font-mono font-bold text-emerald-900 border-r">৯২</td>
              <td className="p-2 text-center font-bold text-emerald-900 border-r">A+</td>
              <td className="p-2 text-center font-mono font-bold">৫.০০</td>
            </tr>
            <tr>
              <td className="p-2 font-mono border-r text-center">০৩</td>
              <td className="p-2 font-semibold border-r">আল-ফিক্বহ ও উসূলে ফিক্বহ (মাসায়েল)</td>
              <td className="p-2 text-center font-mono border-r">১০০</td>
              <td className="p-2 text-center font-mono border-r">৪৪</td>
              <td className="p-2 text-center font-mono border-r">৪৪</td>
              <td className="p-2 text-center font-mono font-bold text-emerald-900 border-r">৮৮</td>
              <td className="p-2 text-center font-bold text-emerald-900 border-r">A+</td>
              <td className="p-2 text-center font-mono font-bold">৫.০০</td>
            </tr>
            <tr>
              <td className="p-2 font-mono border-r text-center">০৪</td>
              <td className="p-2 font-semibold border-r">আরবী ব্যাকরণ ও ভাষা সাহিত্য (নাহু-ছরফ)</td>
              <td className="p-2 text-center font-mono border-r">১০০</td>
              <td className="p-2 text-center font-mono border-r">৪২</td>
              <td className="p-2 text-center font-mono border-r">৪২</td>
              <td className="p-2 text-center font-mono font-bold text-emerald-900 border-r">৮৪</td>
              <td className="p-2 text-center font-bold text-emerald-900 border-r">A+</td>
              <td className="p-2 text-center font-mono font-bold">৫.০০</td>
            </tr>
            <tr>
              <td className="p-2 font-mono border-r text-center">০৫</td>
              <td className="p-2 font-semibold border-r">বাংলা, ইংরেজি, গণিত ও সাধারণ জ্ঞান</td>
              <td className="p-2 text-center font-mono border-r">১০০</td>
              <td className="p-2 text-center font-mono border-r">৪৩</td>
              <td className="p-2 text-center font-mono border-r">৪৩</td>
              <td className="p-2 text-center font-mono font-bold text-emerald-900 border-r">৮৬</td>
              <td className="p-2 text-center font-bold text-emerald-900 border-r">A+</td>
              <td className="p-2 text-center font-mono font-bold">৫.০০</td>
            </tr>
            {/* Total Row */}
            <tr className="bg-emerald-50/80 font-bold border-t-2 border-[#083B25]">
              <td colSpan={2} className="p-2.5 text-right text-gray-900 border-r">সর্বমোট ফলাফল:</td>
              <td className="p-2.5 text-center font-mono border-r">৫০০</td>
              <td className="p-2.5 text-center font-mono border-r">২২৩</td>
              <td className="p-2.5 text-center font-mono border-r">২২২</td>
              <td className="p-2.5 text-center font-mono text-[#083B25] text-sm border-r">৪৪৫</td>
              <td className="p-2.5 text-center text-emerald-900 border-r">মুমতাজ (A+)</td>
              <td className="p-2.5 text-center font-mono text-emerald-900 text-sm">৫.০০</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Box & Grading Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs relative z-10">
        {/* Grading Scale */}
        <div className="p-2.5 bg-white border border-gray-200 rounded-xl">
          <span className="font-bold text-[10px] text-gray-700 block mb-1">গ্রেডিং পদ্ধতি নির্দেশিকা:</span>
          <div className="grid grid-cols-3 gap-1 text-[9.5px]">
            <span>৮০-১০০: <strong>A+ (মুমতাজ)</strong></span>
            <span>৭০-৭৯: <strong>A (জায়েদ জিদ্দান)</strong></span>
            <span>৬০-৬৯: <strong>B (জায়েদ)</strong></span>
            <span>৫০-৫৯: <strong>C (মাকবুল)</strong></span>
            <span>৩৩-৪৯: <strong>D (উত্তীর্ণ)</strong></span>
            <span>০-৩২: <strong className="text-red-600">F (রাসেব)</strong></span>
          </div>
        </div>

        {/* Merit and Remarks */}
        <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">মেধা স্থান:</span>
            <strong className="text-emerald-900 font-black">১ম স্থান (শীর্ষ মেধা)</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">উপস্থিতির হার:</span>
            <strong className="text-gray-900 font-mono">৯৬.৫% (নিয়মিত)</strong>
          </div>
          <div className="text-[10px] text-gray-600 pt-0.5 border-t border-emerald-200">
            <strong>মন্তব্য:</strong> নিরলস অধ্যবসায় ও চরিত্র অত্যন্ত প্রশংসনীয়। মা-শা-আল্লাহ।
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="pt-4 relative z-10">
        <DualSignaturesBlock
          principalTitle="মুহতামিম ও অধ্যক্ষ"
          secondTitle="সভাপতি, গভর্নিং বডি"
          secondName="আলহাজ্ব ইঞ্জিনিয়ার মো: রফিকুল ইসলাম"
          thirdTitle="পরীক্ষা নিয়ন্ত্রক / শ্রেণি শিক্ষক"
          thirdName="মাওলানা ক্বারী ইলিয়াস"
        />
      </div>
    </div>
  );
}

// =========================================================================
// 4. OFFICIAL MONEY RECEIPT (মানি রিসিট ও ফি ভাউচার - ২ খণ্ড বিশিষ্ট)
// =========================================================================
export function PaymentReceiptCanvas({ doc }: { doc: any }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const student = snapshot.student || {};
  const cls = snapshot.class || {};
  const session = snapshot.session || {};
  const receipt = snapshot.receipt || {};
  const isRevoked = Boolean(doc?.isRevoked);

  const amount = receipt.amount || 1500;

  // Single Voucher Half
  const renderVoucherHalf = (copyTitle: string) => (
    <div className="border-2 border-[#083B25] p-5 rounded-2xl bg-white space-y-3.5 relative overflow-hidden text-left shadow-sm flex-1">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b-2 border-[#083B25] pb-2.5">
        <div className="flex items-center gap-2">
          <img src={INSTITUTION_INFO.logoUrl} alt="Logo" className="w-10 h-10 rounded-full border border-gray-300 object-cover" />
          <div>
            <h3 className="font-black text-xs sm:text-sm text-[#083B25] leading-tight">
              {INSTITUTION_INFO.nameBn}
            </h3>
            <p className="text-[9px] text-gray-600 font-serif">{INSTITUTION_INFO.nameEn}</p>
            <p className="text-[8.5px] text-gray-500">পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি | স্থাপিত: ২০২১ ইং</p>
          </div>
        </div>

        <div className="text-right">
          <span className="bg-[#083B25] text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block">
            {copyTitle}
          </span>
          <div className="font-mono text-[9px] text-gray-600 mt-0.5">
            রসিদ নং: <strong className="text-[#083B25]">{receipt.number || doc?.certificateNumber || "EHRJ-REC-2026-001"}</strong>
          </div>
          <div className="text-[8.5px] text-gray-500">তারিখ: {formatGovtDate(receipt.date || doc?.issueDate, "০৮/১০/২০২৬")}</div>
        </div>
      </div>

      {/* Student Quick Strip */}
      <div className="grid grid-cols-2 gap-2 bg-[#FDFCF8] p-2.5 rounded-xl border border-gray-200 text-[10.5px]">
        <div>শিক্ষার্থী: <strong className="text-gray-900">{student.nameBn || "মুহাম্মদ আব্দুল্লাহ"}</strong></div>
        <div>আইডি: <strong className="font-mono text-[#083B25]">{student.studentId}</strong></div>
        <div>জামাত: <strong className="text-gray-800">{cls.name || "সাধারণ"}</strong> (রোল: {student.roll || 1})</div>
        <div>শিক্ষাবর্ষ: <strong className="font-mono text-gray-800">{session.name || "২০২৬"}</strong></div>
      </div>

      {/* Itemized Table */}
      <table className="w-full text-[10.5px] border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-[#083B25] text-white">
          <tr>
            <th className="p-1.5 text-left border-r border-emerald-800">ক্রম</th>
            <th className="p-1.5 text-left border-r border-emerald-800">ফি বিবরণী</th>
            <th className="p-1.5 text-right">টাকা (৳)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          <tr>
            <td className="p-1.5 border-r text-center font-mono">০১</td>
            <td className="p-1.5 border-r">মাসিক টিউশন ও শিক্ষাদান ফি</td>
            <td className="p-1.5 text-right font-mono">১,০০০</td>
          </tr>
          <tr>
            <td className="p-1.5 border-r text-center font-mono">০২</td>
            <td className="p-1.5 border-r">আবাসিক লিল্লাহ বোর্ডিং ও খাদ্য ব্যবস্থাপনা</td>
            <td className="p-1.5 text-right font-mono">৫০০</td>
          </tr>
          <tr className="bg-emerald-50 font-bold border-t border-[#083B25]">
            <td colSpan={2} className="p-1.5 text-right border-r">সর্বমোট আদায়:</td>
            <td className="p-1.5 text-right font-mono text-[#083B25] text-xs">৳ {amount.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div className="text-[10px] text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-200">
        কথায়: <strong>{receipt.amountWordsBn || "এক হাজার পাঁচশত টাকা মাত্র।"}</strong>
      </div>

      {/* Bottom Signatures & Seal */}
      <div className="flex justify-between items-end pt-3 border-t border-gray-200 text-[9px]">
        <div className="text-center">
          <span className="block border-b border-gray-400 pb-0.5 text-gray-700 italic">মাওলানা আহমাদ</span>
          <span className="font-bold text-gray-700">আদায়কারী ক্যাশিয়ার</span>
        </div>

        <div className="w-14 h-14 rounded-full border border-dashed border-emerald-800 bg-emerald-50 flex items-center justify-center text-[7.5px] font-bold text-[#083B25]">
          ক্যাশ সিল
        </div>

        <div className="text-center">
          <span className="block border-b border-gray-400 pb-0.5 text-[#083B25] font-bold italic">মাওলানা মো: আবুল কালাম</span>
          <span className="font-bold text-[#083B25]">মুহতামিম ও অধ্যক্ষ</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[900px] mx-auto space-y-4 font-sans">
      {isRevoked && (
        <div className="bg-red-100 border-2 border-red-600 p-2 text-center rounded-xl text-red-900 text-xs font-bold">
          ⚠ এই মানি রিসিটটি কর্তৃপক্ষ কর্তৃক বাতিল (REVOKED) করা হয়েছে।
        </div>
      )}

      {/* Two Part Side-by-Side Voucher (Customer Copy + Office Copy) */}
      <div className="flex flex-col lg:flex-row gap-4">
        {renderVoucherHalf("গ্রাহক / শিক্ষার্থী কপি")}
        
        {/* Perforation Line */}
        <div className="hidden lg:flex flex-col items-center justify-center text-gray-400 font-mono text-[9px]">
          <span>✂</span>
          <div className="w-[1px] h-full border-r border-dashed border-gray-400 my-1" />
          <span>✂</span>
        </div>

        {renderVoucherHalf("মাদরাসা / অফিস কপি")}
      </div>
    </div>
  );
}

// =========================================================================
// 5. HIFZUL QURAN GRAND COMPLETION SANAD (হিফজ সমাপনী মহাসনদ)
// =========================================================================
export function HifzCertificateCanvas({ doc }: { doc: any }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const student = snapshot.student || {};
  const isRevoked = Boolean(doc?.isRevoked);

  return (
    <div className="w-full max-w-[1000px] mx-auto bg-[#FFFDF5] border-[10px] border-double border-[#083B25] p-6 sm:p-12 rounded-3xl shadow-2xl relative overflow-hidden font-sans text-center space-y-6">
      <ArabesqueCorner position="top-left" />
      <ArabesqueCorner position="top-right" />
      <ArabesqueCorner position="bottom-left" />
      <ArabesqueCorner position="bottom-right" />

      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none text-9xl font-arabic font-bold text-amber-900">
        القرآن
      </div>

      {isRevoked && (
        <div className="bg-red-100 border-2 border-red-600 p-2.5 rounded-xl text-red-900 text-xs font-bold uppercase tracking-wider">
          ⚠ এই সনদপত্রটি বাতিল (REVOKED) করা হয়েছে।
        </div>
      )}

      <CertificateHeader
        subDepartment="তাহফীজুল কুরআন (হিফজ) বিভাগ"
        hadithArabic="إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ • خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"
        memoNo={doc?.certificateNumber}
        issueDate={doc?.issueDate}
      />

      {/* Grand Title Ribbon */}
      <div className="inline-block bg-[#083B25] text-amber-300 border-2 border-[#C59B27] px-10 py-2.5 rounded-full text-base sm:text-xl font-black shadow-lg relative z-10">
        ★ হিফজুল কুরআন সমাপনী মহাসনদ ★
      </div>
      <div className="text-xs font-arabic text-emerald-950 font-bold -mt-2">
        شهادة إتمام حفظ القرآن الكريم كاملاً
      </div>

      {/* Dotted Fill Traditional Phrasing */}
      <div className="text-justify text-xs sm:text-sm text-gray-800 leading-loose space-y-4 px-4 sm:px-12 relative z-10">
        <p>
          আল্লাহ তাআলার অশেষ রহমত ও মেহেরবানিতে অত্র ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার তাহফীজুল কুরআন বিভাগ হইতে{" "}
          <strong className="text-[#083B25] text-base font-black underline decoration-[#C59B27] decoration-2 underline-offset-4">
            হাফেজ {student.nameBn || "মুহাম্মদ আব্দুল্লাহ"}
          </strong>{" "}
          (স্টুডেন্ট আইডি: <span className="font-mono font-bold text-emerald-900">{student.studentId}</span>), পিতা:{" "}
          <strong>{student.fatherNameBn}</strong>, মাতা: <strong>{student.motherNameBn}</strong>, ঠিকানা: {student.presentAddress || "ইলিয়টগঞ্জ, কুমিল্লা"}— মহাগ্রন্থ আল-কুরআনুল কারীমের পূর্ণ ৩০ পারা বিশুদ্ধ উচ্চারণ, মাখরাজ ও তাজবীদ সহকারে হিফজ সম্পন্ন করিয়া কেন্দ্রীয় সমাপনী পরীক্ষায় কৃতিত্বের সাথে উত্তীর্ণ হইয়াছে।
        </p>
        <p>
          আমরা তাহার বক্ষে কুরআনের নূর আজীবন সমুন্নত রাখা এবং কুরআন অনুযায়ী জীবন পরিচালনার জন্য কায়মনোবাক্যে দোয়া করিয়া অত্র মহা-স্বীকৃতি প্রদান করিতেছি।
        </p>
      </div>

      <div className="pt-6 relative z-10">
        <DualSignaturesBlock
          principalTitle="মুহতামিম ও অধ্যক্ষ"
          secondTitle="সভাপতি, গভর্নিং বডি"
          secondName="আলহাজ্ব ইঞ্জিনিয়ার মো: রফিকুল ইসলাম"
          thirdTitle="প্রধান শায়খুল হিফজ"
          thirdName="মাওলানা ক্বারী ইলিয়াস"
        />
      </div>
    </div>
  );
}

// =========================================================================
// 6. DAWRA-E-HADITH GRAND SANAD (দাওরায়ে হাদীস মহাসনদ)
// =========================================================================
export function DawraCertificateCanvas({ doc }: { doc: any }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const student = snapshot.student || {};
  const isRevoked = Boolean(doc?.isRevoked);

  return (
    <div className="w-full max-w-[1000px] mx-auto bg-[#FFFDF5] border-[12px] border-double border-[#083B25] p-6 sm:p-12 rounded-3xl shadow-2xl relative overflow-hidden font-sans text-center space-y-6">
      <ArabesqueCorner position="top-left" />
      <ArabesqueCorner position="top-right" />
      <ArabesqueCorner position="bottom-left" />
      <ArabesqueCorner position="bottom-right" />

      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none text-9xl font-arabic font-bold text-amber-900">
        الحديث الشريف
      </div>

      {isRevoked && (
        <div className="bg-red-100 border-2 border-red-600 p-2.5 rounded-xl text-red-900 text-xs font-bold uppercase tracking-wider">
          ⚠ এই সনদপত্রটি বাতিল (REVOKED) করা হয়েছে।
        </div>
      )}

      <CertificateHeader
        subDepartment="উচ্চতর উলূমুল হাদীস ও কিতাব অনুষদ"
        hadithArabic="مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ • الْعُلَمَاءُ وَرَثَةُ الْأَنْبِيَاءِ"
        memoNo={doc?.certificateNumber}
        issueDate={doc?.issueDate}
      />

      <div className="inline-block bg-[#083B25] text-amber-300 border-2 border-[#C59B27] px-10 py-2.5 rounded-full text-base sm:text-xl font-black shadow-lg relative z-10">
        ★ দাওরায়ে হাদীস (মাস্টার্স সমমান) সমাপনী মহাসনদ ★
      </div>
      <div className="text-xs font-arabic text-emerald-950 font-bold -mt-2">
        شهادة العالمية في الحديث النبوي الشريف
      </div>

      <div className="text-justify text-xs sm:text-sm text-gray-800 leading-loose space-y-4 px-4 sm:px-12 relative z-10">
        <p>
          আল্লাহ রাব্বুল আলামীনের মেহেরবানিতে শিক্ষার্থী{" "}
          <strong className="text-[#083B25] text-base font-black underline decoration-[#C59B27] decoration-2 underline-offset-4">
            মাওলানা {student.nameBn || "মুহাম্মদ আব্দুল্লাহ"}
          </strong>{" "}
          (স্টুডেন্ট আইডি: <span className="font-mono font-bold text-emerald-900">{student.studentId}</span>), পিতা:{" "}
          <strong>{student.fatherNameBn}</strong>, মাতা: <strong>{student.motherNameBn}</strong>, ঠিকানা: {student.presentAddress || "ইলিয়টগঞ্জ, কুমিল্লা"}— অত্র ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় সিহাহ সিত্তাহ সহ হাদিসের সকল প্রামাণ্য কিতাবের দরস সমাপ্ত করিয়া দাওরায়ে হাদীস কেন্দ্রীয় পরীক্ষায় কৃতিত্বের সহিত উত্তীর্ণ হইয়াছে।
        </p>
        <p>
          অত্র সনদপত্র দ্বারা তাহাকে সনদ ও হাদীসের রিওয়ায়াতের অনুমতি (ইজাজাহ) প্রদান করা হইল। আমরা তাহার ভবিষ্যৎ জীবনে দ্বীনের একনিষ্ঠ খাদেম হওয়ার দোয়া করি।
        </p>
      </div>

      <div className="pt-6 relative z-10">
        <DualSignaturesBlock
          principalTitle="মুহতামিম ও অধ্যক্ষ"
          secondTitle="সভাপতি, গভর্নিং বডি"
          secondName="আলহাজ্ব ইঞ্জিনিয়ার মো: রফিকুল ইসলাম"
          thirdTitle="প্রধান শায়খুল হাদীস"
          thirdName="মাওলানা আহমাদুল্লাহ"
        />
      </div>
    </div>
  );
}

// =========================================================================
// 7. MISHKAT JAMAT COMPLETION SANAD (মেশকাত জামাত সনদ)
// =========================================================================
export function MishkatCertificateCanvas({ doc }: { doc: any }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const student = snapshot.student || {};
  const isRevoked = Boolean(doc?.isRevoked);

  return (
    <div className="w-full max-w-[1000px] mx-auto bg-[#FFFDF5] border-[10px] border-double border-[#083B25] p-6 sm:p-12 rounded-3xl shadow-2xl relative overflow-hidden font-sans text-center space-y-6">
      <ArabesqueCorner position="top-left" />
      <ArabesqueCorner position="top-right" />
      <ArabesqueCorner position="bottom-left" />
      <ArabesqueCorner position="bottom-right" />

      {isRevoked && (
        <div className="bg-red-100 border-2 border-red-600 p-2.5 rounded-xl text-red-900 text-xs font-bold uppercase tracking-wider">
          ⚠ এই সনদপত্রটি বাতিল (REVOKED) করা হয়েছে।
        </div>
      )}

      <CertificateHeader
        subDepartment="উচ্চতর কিতাব ও হাদিস প্রস্তুতি অনুষদ"
        hadithArabic="مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ"
        memoNo={doc?.certificateNumber}
        issueDate={doc?.issueDate}
      />

      <div className="inline-block bg-[#083B25] text-amber-300 border-2 border-[#C59B27] px-10 py-2.5 rounded-full text-base sm:text-xl font-black shadow-lg relative z-10">
        ★ মেশকাত জামাত সমাপনী সনদ ★
      </div>

      <div className="text-justify text-xs sm:text-sm text-gray-800 leading-loose space-y-4 px-4 sm:px-12 relative z-10">
        <p>
          এই মর্মে প্রত্যয়ন করা যাইতেছে যে, শিক্ষার্থী{" "}
          <strong className="text-[#083B25] text-base font-black underline decoration-[#C59B27] decoration-2 underline-offset-4">
            {student.nameBn || "মুহাম্মদ আব্দুল্লাহ"}
          </strong>{" "}
          (স্টুডেন্ট আইডি: <span className="font-mono font-bold text-emerald-900">{student.studentId}</span>), পিতা:{" "}
          <strong>{student.fatherNameBn}</strong>, মাতা: <strong>{student.motherNameBn}</strong>— অত্র মাদরাসায় উচ্চতর হাদিস বিভাগপূর্ব 'মেশকাত জামাত'-এর নির্ধারিত শিক্ষাক্রম সফলতার সাথে সম্পন্ন করিয়াছে এবং কেন্দ্রীয় পরীক্ষায় উত্তীর্ণ হইয়াছে।
        </p>
        <p>
          অধ্যয়নকালে তাহার স্বভাব-চরিত্র ও দ্বীনি আদব প্রশংসনীয় ছিল। আমরা তাহার দাওরায়ে হাদীসে প্রবেশের সর্বাঙ্গীন সফলতা কামনা করি।
        </p>
      </div>

      <div className="pt-6 relative z-10">
        <DualSignaturesBlock
          principalTitle="মুহতামিম ও অধ্যক্ষ"
          secondTitle="সভাপতি, গভর্নিং বডি"
          secondName="আলহাজ্ব ইঞ্জিনিয়ার মো: রফিকুল ইসলাম"
          thirdTitle="বিভাগীয় প্রধান শিক্ষক"
          thirdName="মাওলানা আব্দুর রহমান"
        />
      </div>
    </div>
  );
}

// =========================================================================
// 8. NOORANI & NAZERA COMPLETION SANAD (নূরানী ও নাযেরা সমাপনী সনদ)
// =========================================================================
export function NooraniCertificateCanvas({ doc }: { doc: any }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const student = snapshot.student || {};
  const isRevoked = Boolean(doc?.isRevoked);

  return (
    <div className="w-full max-w-[1000px] mx-auto bg-[#FFFDF5] border-[10px] border-double border-[#083B25] p-6 sm:p-12 rounded-3xl shadow-2xl relative overflow-hidden font-sans text-center space-y-6">
      <ArabesqueCorner position="top-left" />
      <ArabesqueCorner position="top-right" />
      <ArabesqueCorner position="bottom-left" />
      <ArabesqueCorner position="bottom-right" />

      {/* Watermark with controlled size */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none text-9xl font-arabic font-bold text-emerald-950">
        نوراني
      </div>

      {isRevoked && (
        <div className="bg-red-100 border-2 border-red-600 p-2.5 rounded-xl text-red-900 text-xs font-bold uppercase tracking-wider">
          ⚠ এই সনদপত্রটি বাতিল (REVOKED) করা হয়েছে।
        </div>
      )}

      <CertificateHeader
        subDepartment="নূরানী ও নাযেরা প্রাথমিক কুরআন শিক্ষা শাখা"
        hadithArabic="اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ • خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"
        memoNo={doc?.certificateNumber}
        issueDate={doc?.issueDate}
      />

      <div className="inline-block bg-[#083B25] text-amber-300 border-2 border-[#C59B27] px-10 py-2.5 rounded-full text-base sm:text-xl font-black shadow-lg relative z-10">
        ★ নূরানী ও নাযেরা সমাপনী সনদপত্র ★
      </div>

      <div className="text-justify text-xs sm:text-sm text-gray-800 leading-loose space-y-4 px-4 sm:px-12 relative z-10">
        <p>
          এতদ্বারা প্রত্যয়ন করা যাইতেছে যে, শিক্ষার্থী{" "}
          <strong className="text-[#083B25] text-base font-black underline decoration-[#C59B27] decoration-2 underline-offset-4">
            {student.nameBn || "মুহাম্মদ আব্দুল্লাহ"}
          </strong>{" "}
          (স্টুডেন্ট আইডি: <span className="font-mono font-bold text-emerald-900">{student.studentId}</span>), পিতা:{" "}
          <strong>{student.fatherNameBn}</strong>, মাতা: <strong>{student.motherNameBn}</strong>, ঠিকানা: {student.presentAddress || "ইলিয়টগঞ্জ, কুমিল্লা"}— অত্র ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার নূরানী ও নাযেরা বিভাগ হইতে সহীহ্-শুদ্ধভাবে পবিত্র কুরআন শিক্ষা ও জরুরি মাসায়েলসহ নির্ধারিত পাঠ্যক্রম সফলতার সহিত সম্পন্ন করিয়াছে।
        </p>
        <p>
          আমরা তাহার দ্বীনি ও পার্থিব জীবনের সর্বাঙ্গীন উন্নতি এবং ভবিষ্যৎ শিক্ষাজীবনে হিফজুল কুরআন ও কিতাব বিভাগে ধারাবাহিক সাফল্য কামনা করি।
        </p>
      </div>

      <div className="pt-6 relative z-10">
        <DualSignaturesBlock
          principalTitle="মুহতামিম ও অধ্যক্ষ"
          secondTitle="সভাপতি, গভর্নিং বডি"
          secondName="আলহাজ্ব ইঞ্জিনিয়ার মো: রফিকুল ইসলাম"
          thirdTitle="নূরানী বিভাগীয় প্রধান"
          thirdName="মাওলানা ক্বারী ইলিয়াস"
        />
      </div>
    </div>
  );
}

// =========================================================================
// 9. MERIT & EXCELLENCE AWARD CERTIFICATE (মেধাবৃত্তি ও বিশেষ কৃতিত্ব সনদ)
// =========================================================================
export function MeritCertificateCanvas({ doc }: { doc: any }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const student = snapshot.student || {};
  const cls = snapshot.class || {};
  const isRevoked = Boolean(doc?.isRevoked);

  return (
    <div className="w-full max-w-[1000px] mx-auto bg-[#FCFBF7] border-[12px] border-double border-[#C59B27] p-6 sm:p-12 rounded-3xl shadow-2xl relative overflow-hidden font-sans text-center space-y-6">
      <ArabesqueCorner position="top-left" />
      <ArabesqueCorner position="top-right" />
      <ArabesqueCorner position="bottom-left" />
      <ArabesqueCorner position="bottom-right" />

      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none text-9xl font-arabic font-bold text-amber-700">
        امتياز
      </div>

      {isRevoked && (
        <div className="bg-red-100 border-2 border-red-600 p-2.5 rounded-xl text-red-900 text-xs font-bold uppercase tracking-wider">
          ⚠ এই সনদপত্রটি বাতিল (REVOKED) করা হয়েছে।
        </div>
      )}

      <CertificateHeader
        subDepartment="মেধা মূল্যায়ন ও বার্ষিক পুরস্কার পরিষদ"
        hadithArabic="وَقُلْ رَبِّ زِدْنِي عِلْمًا • إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ"
        memoNo={doc?.certificateNumber}
        issueDate={doc?.issueDate}
      />

      <div className="inline-block bg-gradient-to-r from-[#C59B27] via-amber-400 to-[#C59B27] text-emerald-950 border-2 border-[#083B25] px-10 py-2.5 rounded-full text-base sm:text-xl font-black shadow-lg relative z-10">
        ★ মেধাবৃত্তি ও বিশেষ কৃতিত্ব সনদপত্র (Certificate of Excellence) ★
      </div>

      <div className="text-justify text-xs sm:text-sm text-gray-800 leading-loose space-y-4 px-4 sm:px-12 relative z-10">
        <p>
          অত্যন্ত আনন্দের সাথে স্বীকৃতি প্রদান করা যাইতেছে যে, শিক্ষার্থী{" "}
          <strong className="text-[#083B25] text-base font-black underline decoration-[#C59B27] decoration-2 underline-offset-4">
            {student.nameBn || "মুহাম্মদ আব্দুল্লাহ"}
          </strong>{" "}
          (স্টুডেন্ট আইডি: <span className="font-mono font-bold text-emerald-900">{student.studentId}</span>, শ্রেণি: {cls.name || "সাধারণ"}, রোল: {student.roll || 1}), পিতা: <strong>{student.fatherNameBn}</strong>— শিক্ষাবর্ষের বার্ষিক মেধা মূল্যায়ন ও কেন্দ্রীয় হিফজ/কিতাব প্রতিযোগিতায়{" "}
          <strong className="text-amber-800 font-black">প্রথম স্থান / শীর্ষ মেধা স্থান</strong> অধিকার করিয়া গৌরবোজ্জ্বল কৃতিত্ব অর্জন করিয়াছে।
        </p>
        <p>
          তাহার এই অসামান্য মেধা, নিরলস অধ্যবসায় ও দ্বীনি শৃঙ্খলার স্বীকৃতিস্বরূপ অত্র প্রতিষ্ঠান হইতে এই মেধা সনদ ও বিশেষ সম্মাননা প্রদান করা হইল।
        </p>
      </div>

      <div className="pt-6 relative z-10">
        <DualSignaturesBlock
          principalTitle="মুহতামিম ও অধ্যক্ষ"
          secondTitle="সভাপতি, গভর্নিং বডি"
          secondName="আলহাজ্ব ইঞ্জিনিয়ার মো: রফিকুল ইসলাম"
          thirdTitle="পুরস্কার ও মেধা পরিষদ"
          thirdName="মাওলানা মুজাম্মেল"
        />
      </div>
    </div>
  );
}

// =========================================================================
// 10. CHARACTER CERTIFICATE (চারিত্রিক প্রশংসাপত্র ও সনদ)
// =========================================================================
export function CharacterCertificateCanvas({ doc }: { doc: any }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const student = snapshot.student || {};
  const cls = snapshot.class || {};
  const session = snapshot.session || {};
  const isRevoked = Boolean(doc?.isRevoked);

  return (
    <div className="w-full max-w-[850px] mx-auto bg-[#FFFDF8] border-4 border-[#083B25] p-6 sm:p-10 rounded-2xl shadow-xl relative overflow-hidden font-sans text-left space-y-5">
      <ArabesqueCorner position="top-left" />
      <ArabesqueCorner position="top-right" />
      <ArabesqueCorner position="bottom-left" />
      <ArabesqueCorner position="bottom-right" />

      {isRevoked && (
        <div className="bg-red-100 border-2 border-red-600 p-2.5 rounded-xl text-red-900 text-xs font-bold uppercase tracking-wider text-center">
          ⚠ এই চারিত্রিক সনদটি বাতিল (REVOKED) করা হয়েছে।
        </div>
      )}

      {/* Header */}
      <div className="text-center border-b-2 border-[#C59B27]/60 pb-4 relative z-10 space-y-1">
        <span className="text-sm font-arabic text-emerald-950 font-bold block">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </span>
        <div className="flex items-center justify-center gap-3">
          <img src={INSTITUTION_INFO.logoUrl} alt="Logo" className="w-14 h-14 rounded-full border-2 border-[#C59B27] object-cover bg-white shadow-sm" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-[#083B25]">
              {INSTITUTION_INFO.nameBn}
            </h1>
            <p className="text-xs text-gray-700 font-serif font-bold">{INSTITUTION_INFO.nameEn}</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-600">
          পূর্ব লক্ষ্মীপুর, ডাকঘর: ইলিয়টগঞ্জ, উপজেলা: দাউদকান্দি, জেলা: কুমিল্লা | <strong>স্থাপিত: ২০২১ ইং (ESTD 2021)</strong>
        </p>
        <span className="inline-block bg-emerald-900/10 border border-[#C59B27]/40 text-[#083B25] text-[10px] font-bold px-3 py-0.5 rounded-full">
          শৃঙ্খলা ও চরিত্র গঠন মূল্যায়ন পর্ষদ • কোনো EIIN নেই
        </span>

        <div className="flex items-center justify-between text-xs font-mono text-gray-700 pt-3 border-t border-gray-200 mt-2">
          <div>স্মারক নং: <strong className="text-[#083B25]">{doc?.certificateNumber || "EHRJ/CHAR/২০২৬/১০২"}</strong></div>
          <div>ইস্যুর তারিখ: <strong>{formatGovtDate(doc?.issueDate, "০৮/১০/২০২৬")}</strong></div>
        </div>
      </div>

      <div className="text-center py-1 relative z-10">
        <span className="inline-block bg-[#083B25] text-amber-300 border-2 border-[#C59B27] px-8 py-2 rounded-full text-base sm:text-lg font-black shadow-md">
          ★ চারিত্রিক প্রশংসাপত্র ও সনদ (CHARACTER TESTIMONIAL) ★
        </span>
      </div>

      <div className="text-justify text-xs sm:text-sm text-gray-800 leading-loose space-y-4 px-4 sm:px-6 relative z-10 bg-white p-5 rounded-xl border border-gray-200">
        <p>
          এই মর্মে চারিত্রিক প্রত্যয়ন প্রদান করা যাইতেছে যে, <strong className="text-[#083B25] text-base font-bold">{student.nameBn || "মুহাম্মদ আব্দুল্লাহ"}</strong>, পিতা: <strong>{student.fatherNameBn}</strong>, মাতা: <strong>{student.motherNameBn}</strong>, বর্তমান ঠিকানা: {student.presentAddress || "ইলিয়টগঞ্জ, কুমিল্লা"}— অত্র ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় <strong className="text-[#083B25]">{session.name || "২০২৬"}</strong> শিক্ষাবর্ষে <strong className="text-[#083B25]">{cls.name || "হিফজুল কুরআন বিভাগ"}</strong> জামাতে (রোল নম্বর: {student.roll || 1}, স্টুডেন্ট আইডি: <span className="font-mono font-bold text-emerald-900">{student.studentId}</span>) নিয়মিত অধ্যয়নরত ছিল।
        </p>
        <p>
          অত্র মাদরাসার প্রাতিষ্ঠানিক ও শৃঙ্খলা রেকর্ড অনুযায়ী সে অধ্যয়নকালীন সময়ে সর্বদা দ্বীনি আদব, শিক্ষাগুরুদের প্রতি গভীর শ্রদ্ধা ও উত্তম আচরণ বজায় রাখিয়াছে। তাহার বিরুদ্ধে কোনো প্রকার নৈতিক স্খলন, বিশৃঙ্খলা বা সমাজবিরোধী কার্যকলাপে জড়িত থাকার কোনো প্রমাণ নেই।
        </p>
        <p>
          আমাদের জানামতে তাহার স্বভাব-চরিত্র অত্যন্ত নিষ্কলুষ ও প্রশংসনীয়। আমরা তাহার ভবিষ্যৎ জীবনের ইহলৌকিক ও পারলৌকিক কামিয়াবি কামনা করি।
        </p>
      </div>

      <div className="pt-4 relative z-10">
        <div className="flex items-center justify-between pb-3">
          <div className="text-center space-y-1">
            <DocumentQrImage doc={doc} className="w-18 h-18 mx-auto" />
            <span className="text-[8px] font-mono text-gray-500 block">ভেরিফিকেশন: {doc?.verificationCode}</span>
          </div>
          <OfficialMadrasaSeal />
          <div className="text-right text-[10px] text-gray-500 font-mono">
            <div>যাচাই ওয়েব: ehrjmadrasha.com</div>
            <div>হেল্পলাইন: {INSTITUTION_INFO.primaryPhone}</div>
          </div>
        </div>

        <DualSignaturesBlock
          principalTitle="মুহতামিম ও অধ্যক্ষ"
          secondTitle="সভাপতি, গভর্নিং বডি"
          secondName="আলহাজ্ব ইঞ্জিনিয়ার মো: রফিকুল ইসলাম"
          thirdTitle="শৃঙ্খলা পর্ষদ প্রধান"
          thirdName="মাওলানা ক্বারী ইলিয়াস"
        />
      </div>
    </div>
  );
}

// =========================================================================
// 11. DEDICATED প্রত্যয়নপত্র CANVAS (Official Letterhead)
// =========================================================================
export function PratyayanCanvas({ doc }: { doc: any }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const student = snapshot.student || {};
  const cls = snapshot.class || {};
  const session = snapshot.session || {};
  const isRevoked = Boolean(doc?.isRevoked);

  return (
    <div className="w-full max-w-[850px] mx-auto bg-white border-2 border-gray-300 p-6 sm:p-10 rounded-2xl shadow-xl relative overflow-hidden font-sans text-left space-y-5">
      {isRevoked && (
        <div className="bg-red-100 border border-red-500 p-2 text-center rounded-lg text-red-900 text-xs font-bold">
          ⚠ এই প্রত্যয়নপত্রটি বাতিল (REVOKED) করা হয়েছে।
        </div>
      )}

      {/* Official Institutional Letterhead */}
      <div className="flex items-center justify-between border-b-2 border-[#083B25] pb-4">
        <div className="flex items-center gap-3">
          <img src={INSTITUTION_INFO.logoUrl} alt="Logo" className="w-14 h-14 rounded-full border border-gray-200 object-cover" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-[#083B25]">
              {INSTITUTION_INFO.nameBn}
            </h1>
            <p className="text-xs text-gray-700 font-serif font-bold">{INSTITUTION_INFO.nameEn}</p>
            <p className="text-[10px] text-gray-600">
              পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা | স্থাপিত: ২০২১ ইং (কোনো EIIN নেই) | হেল্পলাইন: {INSTITUTION_INFO.primaryPhone}
            </p>
          </div>
        </div>
        <div className="text-right text-[11px] font-mono text-gray-600 space-y-0.5">
          <div>স্মারক নং: <strong className="text-[#083B25]">{doc?.certificateNumber || "EHRJ/PRAT/২০২৬/০৯৯"}</strong></div>
          <div>তারিখ: <strong>{formatGovtDate(doc?.issueDate, "০৮/১০/২০২৬")}</strong></div>
        </div>
      </div>

      <div className="text-center py-2">
        <span className="border-b-2 border-gray-900 pb-1 text-base sm:text-lg font-black text-gray-900 uppercase tracking-wide">
          {doc?.titleBn || "প্রাতিষ্ঠানিক প্রত্যয়নপত্র (STUDY CERTIFICATE)"}
        </span>
      </div>

      <div className="text-justify text-xs sm:text-sm text-gray-800 leading-loose space-y-4 px-2 sm:px-6">
        <p>
          এতদ্বারা প্রত্যয়ন করা যাইতেছে যে, <strong className="text-gray-950 font-bold">{student.nameBn || "মুহাম্মদ আব্দুল্লাহ"}</strong>, পিতা: <strong>{student.fatherNameBn}</strong>, মাতা: <strong>{student.motherNameBn}</strong>, বর্তমান ঠিকানা: {student.presentAddress || "ইলিয়টগঞ্জ, কুমিল্লা"}— অত্র ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় <strong className="text-[#083B25]">{session.name || "২০২৬"}</strong> শিক্ষাবর্ষে <strong className="text-[#083B25]">{cls.name || "সাধারণ"}</strong> জামাতে (রোল নম্বর: {student.roll || 1}, স্টুডেন্ট আইডি: <span className="font-mono font-bold text-[#083B25]">{student.studentId}</span>) নিয়মিত অধ্যয়নরত একজন শিক্ষার্থী।
        </p>
        <p>
          অত্র মাদরাসার প্রাতিষ্ঠানিক রেকর্ড অনুযায়ী সে প্রতিষ্ঠানের যাবতীয় নিয়মশৃঙ্খলা মান্য করিয়া নিষ্ঠার সহিত পাঠগ্রহণ করিতেছে। তাহার বিরুদ্ধে কোনো প্রকার শৃঙ্খলাভঙ্গ বা নৈতিক স্খলনের অভিযোগ নেই।
        </p>
        <p>
          তাহার বিশেষ প্রয়োজনে এবং অভিভাবকের আবেদনের প্রেক্ষিতে অত্র প্রত্যয়নপত্রটি প্রদান করা হইল। আমরা তাহার ভবিষ্যৎ জীবনের উত্তরোত্তর মঙ্গল ও সফলতা কামনা করি।
        </p>
      </div>

      <div className="pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between pb-3">
          <div className="text-center space-y-1">
            <DocumentQrImage doc={doc} className="w-18 h-18 mx-auto" />
            <span className="text-[8px] font-mono text-gray-500 block">ডিজিটাল ভেরিফিকেশন: {doc?.verificationCode}</span>
          </div>
          <OfficialMadrasaSeal />
          <div className="text-right text-[10px] text-gray-500 font-mono">
            <div>যাচাই ওয়েব: ehrjmadrasha.com</div>
            <div>দাউদকান্দি, কুমিল্লা</div>
          </div>
        </div>

        <DualSignaturesBlock
          principalTitle="মুহতামিম ও অধ্যক্ষ"
          secondTitle="সভাপতি, গভর্নিং বডি"
          secondName="আলহাজ্ব ইঞ্জিনিয়ার মো: রফিকুল ইসলাম"
        />
      </div>
    </div>
  );
}

// =========================================================================
// 12. EXAMINATION ADMIT CARD (পরীক্ষার প্রবেশপত্র)
// =========================================================================
export function AdmitCardCanvas({ doc }: { doc: any }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const student = snapshot.student || {};
  const cls = snapshot.class || {};
  const sec = snapshot.section || {};
  const session = snapshot.session || {};
  const exam = snapshot.exam || {};

  return (
    <div className="w-full max-w-[850px] mx-auto bg-white border-4 border-[#083B25] p-6 sm:p-8 rounded-2xl shadow-lg relative overflow-hidden font-sans text-left space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-emerald-900 pb-3">
        <div className="flex items-center gap-3">
          <img src={INSTITUTION_INFO.logoUrl} alt="Logo" className="w-13 h-13 rounded-full border border-gray-200 object-cover" />
          <div>
            <h1 className="text-lg sm:text-xl font-black font-display text-[#083B25]">
              {INSTITUTION_INFO.nameBn}
            </h1>
            <p className="text-[10px] text-gray-600 font-serif">{INSTITUTION_INFO.nameEn}</p>
            <p className="text-[9.5px] text-gray-500">পরীক্ষা নিয়ন্ত্রণ শাখা | স্থাপিত: ২০২১ ইং (কোনো EIIN নেই)</p>
          </div>
        </div>
        <div className="text-right text-[10.5px] font-mono text-gray-600">
          <div>প্রবেশপত্র নং: <strong className="text-[#083B25]">{doc?.certificateNumber || "EHRJ/ADMIT/2026/01"}</strong></div>
          <div>ইস্যু: {formatGovtDate(doc?.issueDate, "০৮/১০/২০২৬")}</div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center py-1">
        <span className="bg-[#083B25] text-amber-300 px-8 py-1.5 rounded-full text-sm font-bold shadow-sm inline-block">
          পরীক্ষার প্রবেশপত্র (ADMIT CARD) - {exam.name || "বার্ষিক সমাপনী পরীক্ষা ২০২৬"}
        </span>
      </div>

      {/* Student Details & Photo */}
      <div className="flex items-center justify-between gap-4 bg-[#FDFCF8] p-3.5 rounded-xl border border-gray-200 text-xs">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 flex-1">
          <div><span className="text-gray-500">পরীক্ষার্থীর নাম:</span> <strong className="text-gray-900 block">{student.nameBn || "মুহাম্মদ আব্দুল্লাহ"}</strong></div>
          <div><span className="text-gray-500">স্টুডেন্ট আইডি:</span> <strong className="font-mono text-[#083B25] block">{student.studentId}</strong></div>
          <div><span className="text-gray-500">জামাত / শ্রেণি:</span> <span className="font-semibold block">{cls.name || "সাধারণ"} (শাখা: {sec.name || "ক"})</span></div>
          <div><span className="text-gray-500">শ্রেণি রোল নম্বর:</span> <strong className="font-mono block">{student.roll || 1}</strong></div>
          <div><span className="text-gray-500">পিতার নাম:</span> <span className="block">{student.fatherNameBn}</span></div>
          <div><span className="text-gray-500">পরীক্ষা কেন্দ্র:</span> <span className="block">মাদরাসা অডিটোরিয়াম ও মূল ভবন</span></div>
        </div>
        <div className="w-18 h-22 rounded-xl bg-gray-100 border border-gray-300 overflow-hidden flex items-center justify-center shrink-0">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" />
          ) : (
            <UserCheck className="w-8 h-8 text-gray-400" />
          )}
        </div>
      </div>

      {/* Schedule Table */}
      <table className="w-full text-[10.5px] border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="p-1.5 text-left border">তারিখ</th>
            <th className="p-1.5 text-left border">বিষয় / কিতাব</th>
            <th className="p-1.5 text-center border">সময়</th>
            <th className="p-1.5 text-center border">কক্ষ</th>
            <th className="p-1.5 text-center border">পরিদর্শকের স্বাক্ষর</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          <tr>
            <td className="p-1.5 border font-mono">১০/১০/২০২৬</td>
            <td className="p-1.5 border font-semibold">কুরআনুল কারীম ও তাজবীদ / হিফজ</td>
            <td className="p-1.5 border text-center font-mono">০৯:০০ - ১২:০০</td>
            <td className="p-1.5 border text-center font-mono">১০১</td>
            <td className="p-1.5 border"></td>
          </tr>
          <tr>
            <td className="p-1.5 border font-mono">১২/১০/২০২৬</td>
            <td className="p-1.5 border font-semibold">হাদিস শরিফ ও ফিক্বহুল ইসলামী</td>
            <td className="p-1.5 border text-center font-mono">০৯:০০ - ১২:০০</td>
            <td className="p-1.5 border text-center font-mono">১০১</td>
            <td className="p-1.5 border"></td>
          </tr>
          <tr>
            <td className="p-1.5 border font-mono">১৪/১০/২০২৬</td>
            <td className="p-1.5 border font-semibold">আরবী ব্যাকরণ, বাংলা ও গণিত</td>
            <td className="p-1.5 border text-center font-mono">০৯:০০ - ১২:০০</td>
            <td className="p-1.5 border text-center font-mono">১০১</td>
            <td className="p-1.5 border"></td>
          </tr>
        </tbody>
      </table>

      {/* Rules & Signatures */}
      <div className="flex justify-between items-end pt-3 border-t border-gray-200 text-xs">
        <div className="text-[9px] text-gray-500 max-w-sm space-y-0.5">
          <p>১. পরীক্ষার নির্ধারিত সময়ের ১৫ মিনিট পূর্বে অবশ্যই আসন গ্রহণ করতে হবে।</p>
          <p>২. প্রবেশপত্র ব্যতিরেকে কোনো অবস্থাতেই পরীক্ষা কক্ষে প্রবেশ নিষিদ্ধ।</p>
        </div>

        <div className="flex gap-8">
          <div className="text-center space-y-0.5">
            <span className="block border-b border-gray-700 pb-1 text-xs italic font-serif">মাওলানা মুজাম্মেল</span>
            <span className="font-bold text-gray-900 block text-[10px]">পরীক্ষা নিয়ন্ত্রক</span>
          </div>
          <div className="text-center space-y-0.5">
            <span className="block border-b border-gray-700 pb-1 text-[#083B25] text-xs font-bold italic font-serif">মাওলানা মো: আবুল কালাম সরকার</span>
            <span className="font-bold text-[#083B25] block text-[10px]">মুহতামিম ও অধ্যক্ষ</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact Thermal Receipt Canvas
export function Thermal80mmReceiptCanvas({ doc }: { doc: any }) {
  const snapshot = doc?.parsedSnapshot || (typeof doc?.snapshotJson === "string" ? JSON.parse(doc.snapshotJson) : doc?.snapshotJson) || {};
  const student = snapshot.student || {};
  const cls = snapshot.class || {};
  const receipt = snapshot.receipt || {};

  return (
    <div className="w-[300px] bg-white border border-gray-300 p-4 rounded-xl text-gray-900 font-mono text-[11px] space-y-3 shadow-md mx-auto select-none">
      <div className="text-center border-b border-dashed border-gray-400 pb-2 space-y-0.5">
        <h2 className="font-bold text-xs">{INSTITUTION_INFO.nameBn}</h2>
        <p className="text-[9px] text-gray-500">ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা | স্থাপিত: ২০২১ ইং</p>
        <div className="pt-1 font-bold text-[10px] text-emerald-800">*** ফি পরিশোধ ক্যাশ মেমো ***</div>
      </div>

      <div className="space-y-0.5 text-[10px] border-b border-dashed border-gray-300 pb-2">
        <div className="flex justify-between"><span>রশিদ নং:</span> <span className="font-bold">{receipt.number || doc?.certificateNumber}</span></div>
        <div className="flex justify-between"><span>তারিখ:</span> <span>{formatGovtDate(receipt.date || doc?.issueDate, "০৮/১০/২০২৬")}</span></div>
        <div className="flex justify-between"><span>ছাত্র নাম:</span> <span className="font-bold truncate max-w-[170px]">{student.nameBn}</span></div>
        <div className="flex justify-between"><span>আইডি:</span> <span className="font-bold">{student.studentId}</span></div>
      </div>

      <div className="space-y-1 border-b border-dashed border-gray-300 pb-2 text-[10px]">
        <div className="flex justify-between"><span>১. মাসিক বেতন:</span> <span>৳১,০০০</span></div>
        <div className="flex justify-between"><span>২. ব্যবস্থাপনা ফি:</span> <span>৳৫০০</span></div>
        <div className="flex justify-between font-bold pt-1 border-t border-gray-200">
          <span>মোট পরিশোধ:</span>
          <span>৳{receipt.amount || 1500}</span>
        </div>
      </div>

      <div className="text-center space-y-1 pt-1">
        <DocumentQrImage doc={doc} className="w-14 h-14 mx-auto" />
        <div className="text-[8px] text-gray-400">{doc?.verificationCode}</div>
        <p className="text-[8px] text-gray-500 italic">ধন্যবাদ। দ্বীনি শিক্ষায় আপনার অংশগ্রহণ সাদাকায়ে জারিয়া।</p>
      </div>
    </div>
  );
}

// =========================================================================
// UNIVERSAL ROUTER SWITCH
// =========================================================================
export function UniversalDocumentRenderer({
  doc,
  layoutMode = "A4",
}: {
  doc: any;
  layoutMode?: "A4" | "ID_CARD" | "THERMAL_80MM";
}) {
  const typeCode = doc?.certificateType || doc?.documentType;

  if (layoutMode === "THERMAL_80MM" || typeCode === "THERMAL_RECEIPT") {
    return <Thermal80mmReceiptCanvas doc={doc} />;
  }

  if (typeCode === "TEACHER_ID" || (layoutMode === "ID_CARD" && doc?.parsedSnapshot?.teacher)) {
    return <TeacherIDCanvas doc={doc} />;
  }

  if (layoutMode === "ID_CARD" || typeCode === "STUDENT_ID") {
    return <StudentIDCanvas doc={doc} />;
  }

  if (typeCode === "HIFZ_CERTIFICATE") {
    return <HifzCertificateCanvas doc={doc} />;
  }

  if (typeCode === "MISHKAT_CERTIFICATE") {
    return <MishkatCertificateCanvas doc={doc} />;
  }

  if (typeCode === "DAWRA_CERTIFICATE") {
    return <DawraCertificateCanvas doc={doc} />;
  }

  if (typeCode === "NOORANI_CERTIFICATE") {
    return <NooraniCertificateCanvas doc={doc} />;
  }

  if (typeCode === "MERIT_CERTIFICATE") {
    return <MeritCertificateCanvas doc={doc} />;
  }

  if (typeCode === "TRANSFER_CERTIFICATE" || typeCode === "TC") {
    return <TransferCertificateCanvas doc={doc} />;
  }

  if (typeCode === "CHARACTER_CERTIFICATE") {
    return <CharacterCertificateCanvas doc={doc} />;
  }

  if (typeCode === "PAYMENT_RECEIPT" || typeCode === "FEE_INVOICE") {
    return <PaymentReceiptCanvas doc={doc} />;
  }

  if (typeCode === "ADMIT_CARD") {
    return <AdmitCardCanvas doc={doc} />;
  }

  if (typeCode === "RESULT_MARKSHEET") {
    return <ResultMarksheetCanvas doc={doc} />;
  }

  return <PratyayanCanvas doc={doc} />;
}
