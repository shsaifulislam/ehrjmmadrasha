"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Printer, X, QrCode, ShieldCheck, Download, CheckCircle2 } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export interface ReceiptData {
  receiptNumber: string;
  invoiceNumber?: string;
  receiptDate: string;
  studentIdNumber: string;
  studentNameBn: string;
  className: string;
  sectionName?: string;
  rollNumber?: number | string;
  title: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  receivedBy?: string;
  qrCodeToken?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

// Convert number to Bengali words
function numberToBengaliWords(num: number): string {
  const units: { [key: number]: string } = {
    0: "শূন্য",
    1: "এক",
    2: "দুই",
    3: "তিন",
    4: "চার",
    5: "পাঁচ",
    6: "ছয়",
    7: "সাত",
    8: "আট",
    9: "নয়",
    10: "দশ",
    12: "বারো",
    15: "পনেরো",
    20: "বিশ",
    50: "পঞ্চাশ",
    100: "এক শত",
    500: "পাঁচ শত",
    800: "আট শত",
    1000: "এক হাজার",
    1200: "এক হাজার দুই শত",
    1500: "এক হাজার পাঁচ শত",
    2000: "দুই হাজার",
    2200: "দুই হাজার দুই শত",
    2500: "দুই হাজার পাঁচ শত",
    3000: "তিন হাজার",
    5000: "পাঁচ হাজার",
  };

  if (units[num]) return `${units[num]} টাকা মাত্র`;
  return `${num.toLocaleString("bn-BD")} টাকা মাত্র`;
}

export default function OfficialReceiptModal({ isOpen, onClose, receipt }: Props) {
  const [printFormat, setPrintFormat] = useState<"A4" | "THERMAL">("A4");

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden my-8">
        
        {/* Modal Controls Bar (Hidden in Print) */}
        <div className="no-print bg-[#083B25] text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#C59B27]" />
            <h3 className="font-bold text-sm">অফিসিয়াল ফি রসিদ (EHRJ Official Receipt)</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Switcher */}
            <div className="bg-black/30 p-1 rounded-lg flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat("A4")}
                className={`px-3 py-1 rounded transition ${
                  printFormat === "A4"
                    ? "bg-[#C59B27] text-[#083B25] font-bold"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                A4 স্ট্যান্ডার্ড
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat("THERMAL")}
                className={`px-3 py-1 rounded transition ${
                  printFormat === "THERMAL"
                    ? "bg-[#C59B27] text-[#083B25] font-bold"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                80mm থার্মাল POS
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>প্রিন্ট করুন</span>
            </button>

            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white p-1 rounded-lg"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RECEIPT VIEW CONTAINER */}
        <div className="p-6 bg-gray-50 flex justify-center overflow-x-auto">
          
          {/* 1. A4 STANDARD RECEIPT DESIGN */}
          {printFormat === "A4" && (
            <div className="receipt-a4 bg-white border-2 border-[#0D5C3A] rounded-xl p-8 max-w-2xl w-full shadow-sm space-y-6 text-[#0B1914]">
              
              {/* Header: Institution Emblem & Title */}
              <div className="text-center pb-4 border-b-2 border-emerald-900/40 relative">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <div className="w-16 h-16 rounded-full border-2 border-[#C59B27] p-0.5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <Image
                      src="/images/logo.jpg"
                      alt={INSTITUTION_INFO.nameBn}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-arabic text-xs text-[#0D5C3A] font-semibold">
                      الجامعة الإسلامية رحمة الله إليوت غنج
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-display text-[#083B25]">
                      {INSTITUTION_INFO.nameBn}
                    </h2>
                    <p className="text-[11px] text-gray-600">
                      কওমি ও হাফিজিয়া মাদ্রাসা, লিল্লাহ বোর্ডিং ও এতিমখানা • স্থাপিত: {INSTITUTION_INFO.established}ইং
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium">
                      পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা • ফোন: {INSTITUTION_INFO.primaryPhone}
                    </p>
                  </div>
                </div>

                <div className="inline-block bg-[#0D5C3A] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-2 border border-[#C59B27]">
                  ফি আদায় রশিদ (MONEY RECEIPT)
                </div>
              </div>

              {/* Receipt Metadata Row */}
              <div className="grid grid-cols-2 text-xs gap-4 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                <div>
                  <p><span className="text-gray-500">রশিদ নম্বর:</span> <strong className="font-mono text-sm text-[#0D5C3A]">{receipt.receiptNumber}</strong></p>
                  {receipt.invoiceNumber && (
                    <p className="mt-1"><span className="text-gray-500">ইনভয়েস নম্বর:</span> <span className="font-mono">{receipt.invoiceNumber}</span></p>
                  )}
                </div>
                <div className="text-right">
                  <p><span className="text-gray-500">আদায়ের তারিখ:</span> <strong>{new Date(receipt.receiptDate).toLocaleDateString("bn-BD")}</strong></p>
                  <p className="mt-1"><span className="text-gray-500">পেমেন্ট মাধ্যম:</span> <span className="font-semibold text-emerald-800">{receipt.paymentMethod}</span></p>
                  {receipt.transactionId && (
                    <p className="mt-0.5"><span className="text-gray-500">TrxID:</span> <span className="font-mono text-[11px] font-bold">{receipt.transactionId}</span></p>
                  )}
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3.5 border rounded-lg">
                <div>
                  <span className="text-gray-500 block text-[10px]">শিক্ষার্থীর নাম</span>
                  <span className="font-bold text-gray-900">{receipt.studentNameBn}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">শিক্ষার্থী আইডি</span>
                  <span className="font-mono font-bold text-[#0D5C3A]">{receipt.studentIdNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">জামাত / শ্রেণি</span>
                  <span className="font-semibold text-gray-800">{receipt.className}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">শাখা ও রোল</span>
                  <span className="font-semibold text-gray-800">{receipt.sectionName || "ক শাখা"} • রোল: {receipt.rollNumber || "১"}</span>
                </div>
              </div>

              {/* Itemized Fee Breakdown Table */}
              <div className="border rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#0D5C3A] text-white">
                    <tr>
                      <th className="p-2.5">ক্রম</th>
                      <th className="p-2.5">ফি বিবরণী ও খাত</th>
                      <th className="p-2.5 text-right">আদায়কৃত পরিমাণ (টাকা)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="p-3 text-gray-500">১</td>
                      <td className="p-3 font-semibold text-gray-900">{receipt.title}</td>
                      <td className="p-3 font-mono font-bold text-right text-gray-900">৳ {receipt.amount.toLocaleString("bn-BD")}</td>
                    </tr>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={2} className="p-3 text-right">সর্বমোট প্রাপ্ত টাকা:</td>
                      <td className="p-3 font-mono text-right text-[#0D5C3A] text-sm">৳ {receipt.amount.toLocaleString("bn-BD")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Amount in Words */}
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-xs">
                <span className="text-gray-600 font-medium">কথায়: </span>
                <strong className="text-[#083B25]">{numberToBengaliWords(receipt.amount)}</strong>
              </div>

              {/* Verification & Signatures */}
              <div className="pt-6 border-t flex items-end justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 border-2 border-dashed border-gray-400 p-1 flex items-center justify-center rounded">
                    <QrCode className="w-12 h-12 text-[#083B25]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      TOKEN: {receipt.qrCodeToken || "EHRJ-VERIFIED-AUTH"}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ডিজিটাল সত্যতা নিশ্চিতকৃত
                    </span>
                  </div>
                </div>

                <div className="flex items-end gap-6">
                  <div className="text-center space-y-1">
                    <div className="w-32 border-b border-gray-400 mx-auto" />
                    <span className="text-gray-600 text-[11px] block font-medium">
                      আদায়কারীর স্বাক্ষর
                    </span>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      {receipt.receivedBy || "হিসাব বিভাগ"}
                    </span>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="w-36 border-b border-gray-400 mx-auto" />
                    <span className="text-gray-800 text-[11px] block font-bold">
                      {INSTITUTION_INFO.principal}
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      মুহতামিম / অধ্যক্ষ
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Notice */}
              <div className="text-center text-[10px] text-gray-400 pt-2 border-t">
                এটি একটি কম্পিউটার-জেনারেটেড অফিশিয়াল ডিজিটাল রশিদ। কোনো ঘষামাজা গ্রহণযোগ্য নয়।
              </div>
            </div>
          )}

          {/* 2. 80MM POS THERMAL RECEIPT DESIGN */}
          {printFormat === "THERMAL" && (
            <div className="receipt-thermal bg-white border border-gray-300 p-4 max-w-[80mm] w-full shadow-sm text-xs font-mono space-y-3 text-black">
              {/* Thermal Header */}
              <div className="text-center border-b pb-2 space-y-1">
                <div className="font-bold text-xs uppercase tracking-wider">
                  {INSTITUTION_INFO.nameBn}
                </div>
                <div className="text-[10px]">
                  ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা
                </div>
                <div className="text-[9px]">
                  মোবাইল: {INSTITUTION_INFO.primaryPhone}
                </div>
                <div className="font-bold text-[11px] pt-1">
                  *** মানি রসিদ (MONEY RECEIPT) ***
                </div>
              </div>

              {/* Thermal Metadata */}
              <div className="text-[10px] space-y-0.5 border-b pb-2">
                <div>রশিদ: {receipt.receiptNumber}</div>
                <div>তারিখ: {new Date(receipt.receiptDate).toLocaleDateString("bn-BD")}</div>
                <div>শিক্ষার্থী: {receipt.studentNameBn}</div>
                <div>আইডি: {receipt.studentIdNumber}</div>
                <div>জামাত: {receipt.className} (রোল: {receipt.rollNumber || 1})</div>
                <div>মাধ্যম: {receipt.paymentMethod} {receipt.transactionId ? `(${receipt.transactionId})` : ""}</div>
              </div>

              {/* Thermal Breakdown */}
              <div className="border-b pb-2">
                <div className="flex justify-between font-bold text-[10px]">
                  <span>বিবরণ</span>
                  <span>টাকা</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1">
                  <span className="truncate max-w-[130px]">{receipt.title}</span>
                  <span>{receipt.amount}</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-2 border-t mt-1">
                  <span>মোট আদায়:</span>
                  <span>৳ {receipt.amount}</span>
                </div>
              </div>

              {/* In words */}
              <div className="text-[10px] italic">
                কথায়: {numberToBengaliWords(receipt.amount)}
              </div>

              {/* Thermal QR & Footer */}
              <div className="text-center pt-2 space-y-1">
                <div className="w-12 h-12 mx-auto border border-dashed flex items-center justify-center">
                  <QrCode className="w-10 h-10" />
                </div>
                <div className="text-[9px]">
                  যাচাই কোড: {receipt.qrCodeToken || "EHRJ-2026-QR"}
                </div>
                <div className="text-[9px] pt-1">
                  ধন্যবাদ। রসিদটি যত্ন সহকারে সংরক্ষণ করুন।
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
