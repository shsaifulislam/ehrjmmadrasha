"use client";

import { useVerifyAdmission } from "@/hooks/useCms";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function VerifyAdmissionSlip() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const { data: admission, isLoading, isError } = useVerifyAdmission(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (isError || !admission) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">আবেদন পাওয়া যায়নি</h2>
          <p className="text-slate-600 dark:text-slate-400">আপনার ট্র্যাকিং নম্বরটি সঠিক নয় অথবা আবেদনটি মুছে ফেলা হয়েছে।</p>
          <Button onClick={() => router.push("/admission")} variant="outline">
            ফিরে যান
          </Button>
        </div>
      </div>
    );
  }

  const verificationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/admission/verify/${admission.verificationToken || token}`
    : `https://ehrjmadrasha.edu.bd/admission/verify/${admission.verificationToken || token}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    verificationUrl
  )}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #slip-content,
          #slip-content * {
            visibility: visible;
          }
          #slip-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b shadow-sm sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admission" className="flex items-center gap-3 group">
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
                জমিরীয়া মাদ্রাসা
              </span>
            </div>
          </Link>
          <Button
            onClick={() => router.push("/admission")}
            variant="ghost"
            className="text-sm text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> ফিরে যান
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 w-full flex-1">
        <div className="flex justify-between items-center mb-6 no-print">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            আপনার আবেদন স্লিপ
          </h1>
          <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700">
            <Printer className="h-4 w-4 mr-2" /> স্লিপ প্রিন্ট করুন
          </Button>
        </div>

        <div id="slip-content" className="bg-white text-slate-900 p-8 sm:p-12 border-2 border-slate-200 shadow-sm mx-auto relative rounded-sm">
          {/* Slip Header */}
          <div className="flex flex-col items-center justify-center text-center border-b-2 border-slate-800 pb-6 mb-6">
            <Image src="/images/logo.png" alt="Logo" width={60} height={60} className="mb-3 grayscale" />
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা
            </h1>
            <p className="text-sm font-semibold mt-1">ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা</p>
            <div className="mt-4 px-4 py-1.5 border-2 border-slate-800 rounded-full text-sm font-bold uppercase tracking-widest inline-block">
              ভর্তি আবেদন স্লিপ - ২০২৬
            </div>
          </div>

          {/* Core Info & QR */}
          <div className="flex justify-between items-start mb-8 gap-4">
            <div className="space-y-3 flex-1">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-slate-600">ট্র্যাকিং আইডি:</span>
                <span className="col-span-2 font-mono font-black">{admission.id.split('-')[0].toUpperCase()}...</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-slate-600">আবেদনের তারিখ:</span>
                <span className="col-span-2">{new Date(admission.createdAt).toLocaleDateString("bn-BD")}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-slate-600">আবেদনকৃত শ্রেণী:</span>
                <span className="col-span-2 font-bold">{admission.class?.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-slate-600">আবেদনের অবস্থা:</span>
                <span className="col-span-2 font-bold">{admission.status === 'PENDING' ? 'অপেক্ষমান (Pending)' : admission.status}</span>
              </div>
            </div>
            <div className="shrink-0 p-2 border-2 border-slate-200 rounded-md">
              <img src={qrUrl} alt="QR Code" className="w-24 h-24" />
            </div>
          </div>

          {/* Personal Info */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-bold text-lg uppercase tracking-wide border-b pb-2">শিক্ষার্থীর তথ্য</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">নাম</span>
                <span className="font-bold text-base">{admission.applicantName}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">পিতার নাম</span>
                <span className="font-medium">{admission.fatherName || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">মাতার নাম</span>
                <span className="font-medium">{admission.motherName || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">অভিভাবকের মোবাইল</span>
                <span className="font-mono font-bold">{admission.phone}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">জন্ম নিবন্ধন (BRN)</span>
                <span className="font-mono">{admission.brn || '-'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">ঠিকানা</span>
                <span className="font-medium">
                  {[admission.village, admission.postOffice, admission.upazila, admission.district, admission.address].filter(Boolean).join(', ') || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="mt-12 border-t-2 border-slate-200 pt-6 text-xs text-center text-slate-600 font-medium">
            <p>এই স্লিপটি ভর্তি পরীক্ষার দিন অবশ্যই সাথে আনতে হবে।</p>
            <p className="mt-1">যেকোনো প্রয়োজনে যোগাযোগ করুন: ০১৮৪৫-১৬২৬৬৪</p>
          </div>
        </div>
      </main>
    </div>
  );
}
