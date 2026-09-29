"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  QrCode,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  ChevronLeft,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { TrainingCertificate } from "@/lib/training/types";

export default function PortalCertificatesPage() {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<TrainingCertificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<TrainingCertificate | null>(null);

  useEffect(() => {
    fetch("/api/training/certificates")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCertificates(data.certificates || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <a
          href="/portal/training"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>প্রশিক্ষণ তালিকায় ফিরে যান</span>
        </a>

        <div className="text-xs font-medium text-slate-500">
          মোট অর্জিত সনদ: <span className="font-bold text-slate-800">{certificates.length}</span> টি
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-emerald-700/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
            <Award className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">আমার অর্জিত প্রশিক্ষণ সনদপত্রসমূহ</h1>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কর্তৃক স্বীকৃত ও যাচাইযোগ্য সনদসমূহ
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certificates.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <Award className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-medium">বর্তমানে আপনার কোনো প্রশিক্ষণ সনদপত্র নেই।</p>
            <p className="text-xs text-slate-400 mt-1">প্রশিক্ষণ সমাপ্ত করে ও মূল্যায়নে উত্তীর্ণ হয়ে সনদ সংগ্রহ করুন।</p>
          </div>
        ) : (
          certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono text-slate-400">{cert.id}</span>
                  <h3 className="font-bold text-slate-900 text-base leading-snug mt-0.5">
                    {cert.trainingProgramTitleBn}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    প্রাপক: <span className="font-semibold text-slate-800">{cert.employeeName}</span> (
                    {cert.designation})
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    cert.status === "VALID"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {cert.status}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">সনদের ধরন:</span>
                  <span className="font-medium text-slate-800">{cert.certificateType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ইস্যুর তারিখ:</span>
                  <span className="font-medium text-slate-800">{cert.issueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">বৈধতার মেয়াদ:</span>
                  <span className="font-medium text-slate-800">{cert.validUntil ? cert.validUntil : "আজীবন"}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`/verify/document/${cert.verificationToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>যাচাইকরণ লিংক</span>
                </a>

                <button
                  onClick={() => setSelectedCert(cert)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>সনদ দেখুন ও প্রিন্ট</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PRINTABLE CERTIFICATE MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 space-y-6 border-4 border-double border-emerald-800">
            {/* Certificate Header */}
            <div className="text-center space-y-1 border-b border-emerald-800/30 pb-4">
              <div className="text-xs uppercase tracking-widest text-emerald-800 font-bold">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
              </div>
              <h2 className="text-2xl font-serif font-bold text-slate-900">প্রশিক্ষণ ও দক্ষতা সনদপত্র</h2>
              <div className="text-xs text-slate-500 font-mono">সনদ ট্র্যাকিং কোড: {selectedCert.id}</div>
            </div>

            {/* Certificate Body */}
            <div className="text-center space-y-4 py-4">
              <p className="text-xs text-slate-600">প্রত্যয়ন করা যাচ্ছে যে,</p>
              <div className="text-2xl font-bold text-emerald-900">{selectedCert.employeeName}</div>
              <p className="text-xs text-slate-600">
                পদবী: <span className="font-semibold text-slate-800">{selectedCert.designation}</span>, বিভাগ:{" "}
                <span className="font-semibold text-slate-800">{selectedCert.department}</span>
              </p>
              <p className="text-xs text-slate-700 max-w-md mx-auto leading-relaxed">
                সফলতার সাথে{" "}
                <span className="font-bold text-slate-900">“{selectedCert.trainingProgramTitleBn}”</span> শীর্ষক
                প্রাতিষ্ঠানিক প্রশিক্ষণ সম্পন্ন করেছেন এবং মূল্যায়নে উত্তীর্ণ হয়েছেন।
              </p>
            </div>

            {/* Verification Footer */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs text-slate-500">
              <div className="space-y-0.5">
                <div>ইস্যু তারিখ: {selectedCert.issueDate}</div>
                <div>মেয়াদ: {selectedCert.validUntil || "আজীবন"}</div>
                <div className="font-mono text-[10px] text-emerald-700">টোকেন: {selectedCert.verificationToken}</div>
              </div>

              <div className="text-center">
                <div className="font-semibold text-slate-800">কর্তৃপক্ষ স্বাক্ষর</div>
                <div className="text-[10px] text-slate-400">ইলিয়টগঞ্জ মাদরাসা প্রশাসন</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
