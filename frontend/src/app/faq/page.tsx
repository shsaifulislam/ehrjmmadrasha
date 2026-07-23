"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, HelpCircle, MessageSquare } from "lucide-react";

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "মাদ্রাসায় কীভাবে নতুন ভর্তি হওয়া যাবে?",
      a: "আমাদের ওয়েবসাইটের 'অনলাইনে ভর্তি' মেনুতে গিয়ে ফর্ম পূরণ করতে হবে। ফর্ম পূরণের পর প্রাপ্ত ট্র্যাকিং নম্বরটি সংরক্ষণ করবেন এবং ভাইভা পরীক্ষার দিন সাথে আনবেন।"
    },
    {
      q: "মাদ্রাসায় কোন কোন শিক্ষা বিভাগ চালু রয়েছে?",
      a: "আমাদের মাদ্রাসায় নূরানী/মক্তব বিভাগ, নাযেরা বিভাগ, সম্পূর্ণ কুরআন হিফজ বিভাগ, দাওরায়ে হাদীস (এম.এ সমমান) পর্যন্ত কিতাব বিভাগ এবং ইফতা ও আরবি সাহিত্য তাখাস্সুস বিভাগ চালু রয়েছে।"
    },
    {
      q: "ভর্তি ফি ও মাসিক বেতন কীভাবে পরিশোধ করব?",
      a: "মাদ্রাসার ক্যাশ কাউন্টারে সরাসরি অথবা অফিশিয়াল বিকাশ/নগদ নম্বর (01845-162664) এর মাধ্যমে ফি পরিশোধ করে ডিজিটাল রসিদ সংগ্রহ করতে পারবেন।"
    },
    {
      q: "পরীক্ষার ফলাফল অনলাইন থেকে কীভাবে দেখা যাবে?",
      a: "আমাদের ওয়েবসাইটের 'ফলাফল' পাতায় গিয়ে শিক্ষাবর্ষ, পরীক্ষার নাম এবং ছাত্রের রোল নম্বর প্রদান করে খুব সহজেই ফুল মার্কশিট ও রেজাল্ট দেখতে পারবেন।"
    },
    {
      q: "শিক্ষার্থী বা অভিভাবক কীভাবে ডিজিটাল পোর্টেলে ঢুকবেন?",
      a: "ওয়েবসাইটের 'লগইন' বাটনে ক্লিক করে মাদ্রাসা কর্তৃপক্ষ থেকে প্রাপ্ত ইউজারনেম/মোবাইল এবং পাসওয়ার্ড প্রদান করে স্টুডেন্ট পোর্টেলে প্রবেশ করা যাবে।"
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold">
            <HelpCircle className="h-4 w-4" /> সাধারণ প্রশ্নের উত্তর (FAQ)
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">আপনার প্রশ্ন ও সহজ সমাধান</h1>
          <p className="text-slate-600 text-sm">ভর্তি, শিক্ষা বিভাগ, ফি ও পোর্টাল সংক্রান্ত সচরাচর জিজ্ঞাসিত প্রশ্নসমূহ</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <Card key={idx} className="shadow-sm border border-slate-200 overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-5 font-bold text-slate-800 flex justify-between items-center hover:bg-slate-50 transition-colors"
                >
                  <span className="text-base">{faq.q}</span>
                  {isOpen ? <ChevronUp className="h-5 w-5 text-emerald-600 shrink-0" /> : <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <CardContent className="p-5 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Fallback Help Box */}
        <Card className="bg-emerald-950 text-white p-6 text-center space-y-4">
          <CardTitle className="text-lg font-bold">অন্য কোনো প্রশ্ন আছে বা তাতক্ষণিক সাহায্য চান?</CardTitle>
          <p className="text-emerald-200 text-xs max-w-lg mx-auto">
            আপনার কাঙ্ক্ষিত প্রশ্নের উত্তর এখানে না পেলে আমাদের অফিশিয়াল হোয়াটসঅ্যাপ হেল্পডেস্কে সরাসরি বার্তা পাঠাতে পারেন।
          </p>
          <a href="https://wa.me/8801845162664?text=আমি%20মাদ্রাসার%20তথ্য%20সম্পর্কে%20জানতে%20চাই" target="_blank" rel="noopener noreferrer">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6">
              <MessageSquare className="mr-2 h-4 w-4" /> সরাসরি হোয়াটসঅ্যাপ সহায়তা
            </Button>
          </a>
        </Card>
      </div>
    </div>
  );
}
