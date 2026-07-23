"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";

export default function PrintReceiptPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [receipt, setReceipt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/admin/finance/receipts/${params.id}`);
        setReceipt(res.data.data.receipt);
      } catch (error) {
        toast.error("রশিদ লোড করতে সমস্যা হয়েছে");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReceipt();
  }, [params.id]);

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const res = await api.post(`/admin/finance/receipts/${params.id}/print`);
      setReceipt((prev: any) => ({
        ...prev,
        printedCount: res.data.data.receipt.printedCount,
        lastPrintedAt: res.data.data.receipt.lastPrintedAt,
      }));

      setTimeout(() => {
        window.print();
      }, 300);
    } catch (error) {
      toast.error("প্রিন্ট করতে সমস্যা হয়েছে");
    } finally {
      setIsPrinting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            অফিশিয়াল রশিদ লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <p className="text-destructive font-bold text-base">রশিদটি পাওয়া যায়নি</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> ফিরে যান
          </Button>
        </div>
      </div>
    );
  }

  const isFee = receipt.type === "FEE";
  const student = receipt.payment?.invoice?.student;
  const paymentDetails = receipt.payment;
  const donationDetails = receipt.donation;

  const payerName = isFee ? student?.nameBn : donationDetails?.donorName;
  const amount = isFee ? Number(paymentDetails?.amountPaid) : Number(donationDetails?.amount);
  const date = new Date(isFee ? paymentDetails?.paymentDate : donationDetails?.date).toLocaleDateString("bn-BD");
  const method = isFee ? paymentDetails?.method : "CASH";
  const receivedBy = isFee ? paymentDetails?.receivedBy?.username : "অ্যাডমিন/ক্যাশিয়ার";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 md:p-8 print:p-0 print:bg-white flex flex-col items-center">
      {/* Control Bar (Non-Printable) */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 print:hidden">
        <Button variant="outline" onClick={() => router.back()} className="text-xs font-bold">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> ফিরে যান
        </Button>
        <Button
          onClick={handlePrint}
          disabled={isPrinting}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
        >
          {isPrinting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Printer className="mr-1.5 h-4 w-4" />}
          রশিদ প্রিন্ট করুন (A4/Memo)
        </Button>
      </div>

      {/* Printable Receipt Card */}
      <div className="relative bg-white w-full max-w-2xl border border-slate-300 p-8 shadow-md print:shadow-none print:border-none print:w-full text-slate-900 font-sans">
        {/* Duplicate Print Watermark */}
        {receipt.printedCount > 0 && (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none rotate-[-30deg] select-none">
            <span className="text-8xl font-black tracking-widest uppercase text-slate-900">
              পুনর্মুদ্রণ
            </span>
          </div>
        )}

        {/* Institution Header */}
        <div className="text-center border-b-2 border-emerald-700 pb-5 mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-14 w-14 rounded-full overflow-hidden shrink-0 border-2 border-emerald-700 p-0.5 bg-white">
              <Image
                src="/images/logo.png"
                alt="লোগো"
                width={56}
                height={56}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="text-left leading-tight">
              <h1 className="text-xl sm:text-2xl font-extrabold text-emerald-900 leading-tight">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা
              </h1>
              <p className="text-xs text-slate-600 font-semibold">
                ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা • প্রতিষ্ঠাতা: ২০২১ খ্রি.
              </p>
            </div>
          </div>
          <div className="mt-3 inline-block bg-emerald-800 text-white px-5 py-1 rounded-full text-xs font-bold tracking-wider">
            {isFee ? "অফিশিয়াল টাকা প্রাপ্তির রশিদ" : "অফিশিয়াল দান রশিদ"}
          </div>
        </div>

        {/* Receipt Metadata */}
        <div className="flex justify-between items-start mb-6 text-xs border-b pb-4">
          <div className="space-y-1">
            <p>
              <span className="font-bold text-slate-600">রশিদ নাম্বার:</span>{" "}
              <span className="font-mono font-bold text-emerald-900">{receipt.receiptNumber}</span>
            </p>
            <p>
              <span className="font-bold text-slate-600">পেমেন্ট মেথড:</span>{" "}
              <span className="font-bold uppercase">{method}</span>
            </p>
          </div>
          <div className="text-right space-y-1">
            <p>
              <span className="font-bold text-slate-600">তারিখ:</span> <span className="font-mono">{date}</span>
            </p>
            {receipt.printedCount > 0 && (
              <p className="text-[10px] text-amber-700 font-bold">
                পুনর্মুদ্রণ সংখ্যা: {receipt.printedCount.toLocaleString("bn-BD")}
              </p>
            )}
          </div>
        </div>

        {/* Payer Information */}
        <div className="bg-slate-50 border p-4 rounded-xl mb-6">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-500 text-[11px] uppercase tracking-wider font-bold mb-1">
                {isFee ? "শিক্ষার্থীর তথ্য" : "দাতার তথ্য"}
              </p>
              <p className="font-extrabold text-sm text-slate-900">{payerName || "—"}</p>
              {isFee && (
                <div className="text-slate-700 space-y-0.5 mt-1">
                  <p>স্টুডেন্ট আইডি: <span className="font-mono font-bold">{student?.studentId}</span></p>
                  <p>শ্রেণী: <span>{student?.class?.name || "N/A"}</span> • রোল: <span>{student?.roll}</span></p>
                </div>
              )}
            </div>
            <div className="text-right border-l pl-4 flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-[11px] uppercase tracking-wider font-bold mb-1">
                  ফি বিবরণী
                </p>
                <p className="font-bold text-slate-800">
                  {isFee ? receipt.payment?.invoice?.type || "টিউশন ফি" : "সাধারণ দান / এতিম তহবিল"}
                </p>
              </div>
              <div className="pt-2">
                <span className="text-[11px] text-slate-500 block">আদায়কৃত অর্থ</span>
                <span className="text-xl font-extrabold font-mono text-emerald-800">
                  ৳ {amount.toLocaleString("bn-BD")} /-
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex justify-between items-center mb-8">
          <span className="font-bold text-emerald-900">কথায়:</span>
          <span className="font-bold text-emerald-950">কথায় ৳ {amount.toLocaleString("bn-BD")} টাকা মাত্র।</span>
        </div>

        {/* Signature Section */}
        <div className="grid grid-cols-2 gap-8 pt-12 text-xs border-t">
          <div>
            <div className="border-t border-slate-400 w-36 text-center pt-1 font-bold text-slate-700">
              অভিভাবক / জমাদানকারী
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="border-t border-slate-400 w-44 text-center pt-1 font-bold text-slate-900">
              আদায়কারী (ক্যাশিয়ার/অ্যাডমিন)
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">গ্রহীতা: {receivedBy}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
