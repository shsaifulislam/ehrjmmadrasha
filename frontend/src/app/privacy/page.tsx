"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Lock, FileText, CheckCircle2 } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold">
            <ShieldCheck className="h-4 w-4" /> ডাটা নিরাপত্তা ও গোপনীয়তা নীতিমালা
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">গোপনীয়তা নীতিমালা (Privacy Policy)</h1>
          <p className="text-slate-600 text-sm">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা অফিশিয়াল প্রাইভেসি স্ট্যান্ডার্ড</p>
        </div>

        <Card className="shadow-sm border-t-4 border-t-emerald-600 bg-white p-6 space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-1">
              <Lock className="h-4 w-4 text-emerald-600" /> ১. তথ্যের সংগ্রহ ও ব্যবহার
            </h2>
            <p>
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসার প্রাতিষ্ঠানিক ডিজিটাল পোর্টেলে ভর্তি আবেদন, উপস্থিতি ও ফি আদায়ের উদ্দেশ্যে শিক্ষার্থী ও অভিভাবকের নাম, মোবাইল নম্বর, এনআইডি/জন্ম নিবন্ধন এবং ছবি সংগ্রহ করা হয়। এই তথ্যসমূহ শুধুমাত্র শিক্ষা ও প্রাতিষ্ঠানিক প্রশাসনিক কাজে ব্যবহৃত হয়।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> ২. তথ্য সুরক্ষা ও গোপনীয়তা
            </h2>
            <p>
              আমরা শিক্ষার্থীদের তথ্য সর্বোচ্চ নিরাপত্তায় এনক্রিপ্ট করে সংরক্ষণ করি। কোনো অবস্থাতেই শিক্ষার্থী বা অভিভাবকের ব্যক্তিগত মোবাইল নম্বর বা তথ্য তৃতীয় কোনো ব্যক্তি বা কমার্শিয়াল প্রতিষ্ঠানের নিকট শেয়ার বা বিক্রি করা হয় না।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-1">
              <FileText className="h-4 w-4 text-emerald-600" /> ৩. আর্থিক লেনদেনের রসিদ ও সিকিউরিটি
            </h2>
            <p>
              বিকাশ, নগদ বা ক্যাশ কাউন্টারে প্রদেয় প্রতিটি ফি ও অনুদানের রসিদ এনক্রিপ্টেড ডাটাবেজে ডাটাবেজ অডিট লগের সাথে সংরক্ষিত থাকে। কোনো রসিদ বা আর্থিক রেকর্ড অননুমোদিতভাবে মুছে ফেলা সম্পূর্ণ নিষিদ্ধ।
            </p>
          </section>

          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-xs text-emerald-950 font-medium">
            যেকোনো তথ্য সংশোধন বা ডাটা সম্পর্কিত প্রশ্নের জন্য সরাসরি অফিশিয়াল মেইলে বা আমাদের হটলাইন নম্বর <strong>01845-162664</strong>-এ যোগাযোগ করুন।
          </div>
        </Card>
      </div>
    </div>
  );
}
