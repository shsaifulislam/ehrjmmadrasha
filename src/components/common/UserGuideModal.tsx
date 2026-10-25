"use client";

import React, { useState } from "react";
import {
  X,
  BookOpen,
  Search,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Calendar,
  Award,
  Clock,
  HelpCircle,
  FileText,
  Shield,
  Printer,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: "GUARDIAN" | "TEACHER" | "PRINCIPAL";
}

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  summary: string;
  steps: string[];
  tips?: string;
}

const GUARDIAN_SECTIONS: GuideSection[] = [
  {
    id: "login-child",
    title: "১. লগইন ও সন্তান নির্বাচন (Child Switcher)",
    icon: Smartphone,
    summary: "পোর্টালে প্রবেশ এবং একাধিক সন্তান অধ্যয়নরত থাকলে প্রোফাইল পরিবর্তন করার নিয়ম।",
    steps: [
      "মাদরাসার ওয়েবসাইটে গিয়ে 'লগইন' মেনু থেকে 'অভিভাবক' ট্যাব নির্বাচন করুন।",
      "মাদরাসায় নিবন্ধিত মোবাইল নম্বর বা ইমেইল এবং পাসওয়ার্ড প্রদান করে লগইন করুন।",
      "একাধিক সন্তান থাকলে ড্যাশবোর্ডের উপরে 'সন্তান পরিবর্তন করুন' ড্রপডাউন বা কার্ডে ক্লিক করে কাঙ্ক্ষিত সন্তান সিলেক্ট করুন।",
      "সন্তান পরিবর্তনের সাথে সাথে হাজিরা, ফলাফল, রুটিন ও ইনভয়েস ওই সন্তানের তথ্যে আপডেট হবে।",
    ],
    tips: "পাসওয়ার্ড ভুলে গেলে মাদরাসার শিক্ষা সচিব বা অ্যাডমিন অফিসে যোগাযোগ করে রিসেট টোকেন নিন।",
  },
  {
    id: "finance",
    title: "২. ফি পরিশোধ ও ডিজিটাল রসিদ (bKash ও Nagad)",
    icon: CreditCard,
    summary: "বকেয়া ইনভয়েস পরিশোধ এবং কিউআর কোডযুক্ত ক্যাশ রসিদ ডাউনলোড।",
    steps: [
      "'ফি ও পেমেন্ট' ট্যাবে গিয়ে বকেয়া ইনভয়েসের তালিকা দেখুন।",
      "ইনভয়েসের পাশে 'বিকাশ/নগদ দিয়ে পরিশোধ করুন' বাটনে চাপুন।",
      "বিকাশ বা নগদ গেটওয়ে পেজে আপনার মোবাইল নম্বর, ওটিপি এবং পিন দিয়ে পেমেন্ট কনফার্ম করুন।",
      "পেমেন্ট সফল হওয়ামাত্র ইনভয়েস স্ট্যাটাস 'পরিশোধিত' (PAID) হয়ে যাবে।",
      "'রসিদ ডাউনলোড' বাটনে চাপ দিয়ে কিউআর কোড সংবলিত অফিসিয়াল মানি রিসিট পিডিএফ ডাউনলোড বা প্রিন্ট করুন।",
    ],
    tips: "প্রতিটি রসিদে ইউনিক সিকিউরিটি কিউআর কোড থাকে যা মোবাইলের ক্যামেরা দিয়ে স্ক্যান করে সত্যতা যাচাই করা যায়।",
  },
  {
    id: "attendance",
    title: "৩. দৈনিক হাজিরা ও উপস্থিতি ক্যালেন্ডার",
    icon: Calendar,
    summary: "শিক্ষার্থীর উপস্থিতি হার এবং মাসভিত্তিক ক্যালেন্ডার পর্যবেক্ষণ।",
    steps: [
      "'হাজিরা' ট্যাবে গিয়ে মাসভিত্তিক রঙিন ক্যালেন্ডার দেখুন।",
      "সবুজ = উপস্থিত, লাল = অনুপস্থিত, হলুদ = ছুটি, নীল = দেরিতে আগমন।",
      "কোনো দিন শিক্ষার্থী অনুপস্থিত থাকলে শিক্ষকের হাজিরা দাখিলের সাথে সাথে আপনার ফোনে স্বয়ংক্রিয় এলার্ট পাঠানো হয়।",
    ],
    tips: "উপস্থিতি ৮০% এর নিচে নামলে লাল সতর্কবার্তা প্রদর্শিত হবে।",
  },
  {
    id: "results",
    title: "৪. পরীক্ষার ফলাফল ও গ্রেডশিট",
    icon: Award,
    summary: "সাময়িক ও বার্ষিক পরীক্ষার নম্বরপত্র, মেধা স্থান ও গ্রেড দেখা।",
    steps: [
      "'ফলাফল' ট্যাবে গিয়ে কাঙ্ক্ষিত পরীক্ষার ফলাফল কার্ড ওপেন করুন।",
      "বিষয়ভিত্তিক প্রাপ্ত নম্বর, পূর্ণমান এবং গ্রেড স্তর (মুমতাজ, জায়্যিদ জিদ্দান, জায়্যিদ, মাকবুল, রাসিব) দেখুন।",
      "'মার্কশিট প্রিন্ট করুন' বাটনে ক্লিক করে অফিশিয়াল গ্রেডশিট ডাউনলোড বা প্রিন্ট করা যাবে।",
    ],
  },
  {
    id: "routine",
    title: "৫. ক্লাস রুটিন ও সময়সূচি",
    icon: Clock,
    summary: "শনি থেকে বৃহস্পতিবার পর্যন্ত পিরিয়ড ও শিক্ষকের সময়সূচি।",
    steps: [
      "'ক্লাস রুটিন' ট্যাবে গিয়ে চলতি জামাত ও শাখার পূর্ণাঙ্গ পিরিয়ডভিত্তিক রুটিন দেখুন।",
      "প্রতিটি পিরিয়ডে বিষয়/কিতাব এবং দায়িত্বপ্রাপ্ত উস্তাদের নাম উল্লেখ থাকে।",
    ],
  },
  {
    id: "leave-correction",
    title: "৬. ছুটির আবেদন ও তথ্য সংশোধন",
    icon: FileText,
    summary: "অনলাইনে আগাম ছুটির আবেদন দাখিল এবং শিক্ষার্থীর তথ্যের ভুল সংশোধন।",
    steps: [
      "'আবেদনসমূহ' ট্যাবে গিয়ে 'নতুন ছুটির আবেদন' বাটনে চাপুন।",
      "ছুটির শুরু ও শেষের তারিখ এবং সুনির্দিষ্ট কারণ লিখে দাখিল করুন।",
      "শ্রেণি শিক্ষক বা শিক্ষা সচিব অনুমোদন করলে স্ট্যাটাস 'অনুমোদিত' দেখাবে।",
      "নামের বানান বা মোবাইল নম্বর সংশোধনের জন্য 'তথ্য সংশোধনের আবেদন' ব্যবহার করুন।",
    ],
  },
  {
    id: "helpdesk",
    title: "৭. সহায়তা কেন্দ্র ও কমপ্লেন টিকিট (Helpdesk)",
    icon: HelpCircle,
    summary: "মাদরাসা প্রশাসনের সাথে সরাসরি অনলাইন যোগাযোগ ও অভিযোগ জানানো।",
    steps: [
      "'সহায়তা কেন্দ্র' ট্যাবে গিয়ে 'নতুন টিকিট তৈরি করুন' চাপুন।",
      "ক্যাটাগরি সিলেক্ট করুন (একাডেমিক, ফি ও পেমেন্ট, হোস্টেল ইত্যাদি)।",
      "বিষয় ও বিস্তারিত লিখে সাবমিট করুন; প্রশাসন উত্তর দিলে মেসেজ হিস্ট্রিতে দেখতে পাবেন।",
    ],
  },
];

const TEACHER_SECTIONS: GuideSection[] = [
  {
    id: "attendance-entry",
    title: "১. দৈনিক হাজিরা গ্রহণ ও সংশোধন",
    icon: Calendar,
    summary: "ক্লাস ও জামাতভিত্তিক শিক্ষার্থীদের উপস্থিতি নেওয়া ও আপডেট করার নিয়ম।",
    steps: [
      "'হাজিরা গ্রহণ' ট্যাবে গিয়ে আপনার দায়িত্বপ্রাপ্ত জামাত ও শাখা নির্বাচন করুন।",
      "ডিফল্টভাবে সকল ছাত্র 'উপস্থিত' থাকবে; শুধুমাত্র অনুপস্থিত ছাত্রদের 'অনুপস্থিত' বা 'ছুটি' সিলেক্ট করুন।",
      "'হাজিরা দাখিল ও সংরক্ষণ করুন' চাপলে সাথে সাথে ডাটাবেজে রেকর্ড জমা হবে এবং অভিভাবকদের কাছে অ্যালার্ট চলে যাবে।",
      "একই দিনে পুনরায় শিটটি খুলে তথ্য সংশোধন করে 'হাজিরা আপডেট' করা যাবে।",
    ],
    tips: "হাজিরা শিট সংরক্ষণের সাথে সাথে অডিট লগে এন্ট্রি সংরক্ষিত থাকে।",
  },
  {
    id: "marks-entry",
    title: "২. পরীক্ষার নম্বর এন্ট্রি ও ফাইনাল সাবমিশন",
    icon: Award,
    summary: "প্রাপ্ত নম্বর ইনপুট, খসড়া সংরক্ষণ এবং পরীক্ষা নিয়ন্ত্রকের কাছে দাখিল।",
    steps: [
      "'নম্বর এন্ট্রি' ট্যাবে গিয়ে চলমান পরীক্ষা এবং কিতাব/বিষয় নির্বাচন করুন।",
      "প্রতিটি ছাত্রের প্রাপ্ত নম্বর ঘরে লিখুন (পূর্ণমানের অতিরিক্ত নম্বর সিস্টেম আটকে দেবে)।",
      "অসম্পূর্ণ কাজ সংরক্ষণ করতে 'খসড়া সংরক্ষণ করুন' বাটনে চাপুন।",
      "সব নম্বর মেলানো শেষে 'প্রধান পরীক্ষা নিয়ন্ত্রকের কাছে দাখিল করুন' বাটনে চাপলে নম্বরটি লক হয়ে যাবে।",
    ],
  },
  {
    id: "routine-calendar",
    title: "৩. ক্লাস রুটিন ও প্রাতিষ্ঠানিক ক্যালেন্ডার",
    icon: Clock,
    summary: "সাপ্তাহিক ক্লাসের সময়সূচি ও প্রাতিষ্ঠানিক ছুটির দিনলিপি।",
    steps: [
      "'ক্লাস রুটিন' ট্যাবে গিয়ে আপনার সপ্তাহের প্রতিটি পিরিয়ড ও রুম নম্বর দেখুন।",
      "কোনো ক্লাসের অগ্রগতি বা বাড়ির কাজের বিষয় নোট সেকশনে যোগ করা যায়।",
    ],
  },
  {
    id: "teacher-leave",
    title: "৪. উস্তাদের নিজস্ব ছুটির আবেদন",
    icon: FileText,
    summary: "জরুরি প্রয়োজনে উস্তাদদের অনলাইন ছুটির আবেদন দাখিল।",
    steps: [
      "'ছুটির আবেদন' ট্যাবে গিয়ে ছুটির ধরন ও তারিখ নির্বাচন করুন।",
      "আপনার অনুপস্থিতিতে বিকল্প হিসেবে দায়িত্বপ্রাপ্ত উস্তাদের নাম ও কারণ উল্লেখ করে দাখিল করুন।",
      "মুহতামিম বা শিক্ষা সচিব অনুমোদন করলে স্ট্যাটাসে 'অনুমোদিত' দেখা যাবে।",
    ],
  },
  {
    id: "security",
    title: "৫. অ্যাকাউন্ট নিরাপত্তা ও পাসওয়ার্ড পলিসি",
    icon: Shield,
    summary: "পাসওয়ার্ড সুরক্ষা ও সেশন ব্যবস্থাপনা।",
    steps: [
      "কমপক্ষে ৮ অক্ষরের শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।",
      "শেয়ার্ড কম্পিউটার থেকে কাজ শেষে সর্বদাই 'লগআউট' করুন।",
    ],
  },
];

const PRINCIPAL_SECTIONS: GuideSection[] = [
  {
    id: "principal-overview",
    title: "১. ড্যাশবোর্ড ও সার্বিক প্রাতিষ্ঠানিক তদারকি",
    icon: Shield,
    summary: "মুহতামিম প্যানেলে মোট শিক্ষার্থী, উপস্থিতি হার ও তহবিলের সার্বিক তথ্য পর্যবেক্ষণ।",
    steps: [
      "বাম পাশের মেনু থেকে 'ড্যাশবোর্ড' বা 'সার্বিক পর্যবেক্ষণ' নির্বাচন করুন।",
      "মোট সক্রিয় ছাত্রছাত্রী, আজকের উপস্থিতি শতকরা হার এবং আবাসিক/অনাবাসিক বিভাজন লাইভ দেখুন।",
      "জরুরি প্রাতিষ্ঠানিক অ্যালার্ট ও নোটিফিকেশন এক নজরে নিরীক্ষা করুন।",
    ],
    tips: "মুহতামিম প্যানেলটি একটি উচ্চ ক্ষমতাসম্পন্ন প্রাতিষ্ঠানিক তদারকি মোড, যেখান থেকে সিদ্ধান্তমূলক আদেশ জারি করা যায়।",
  },
  {
    id: "principal-message",
    title: "২. হোমপেজে প্রদর্শিত অফিসিয়াল বাণী ও বার্তা",
    icon: FileText,
    summary: "মাদরাসার মূল ওয়েবসাইটে সম্মানিত মুহতামিম মহোদয়ের বক্তব্য হালনাগাদ করার নিয়ম।",
    steps: [
      "বাম মেনুর 'অফিসিয়াল বাণী ও বার্তা' অপশনে যান।",
      "টেক্সটবক্সে আপনার দিকনির্দেশনামূলক বাণী ও বক্তব্য লিখুন।",
      "'বাণী সংরক্ষণ করুন' বাটনে ক্লিক করলে তা সরাসরি হোমপেজের 'মুহতামিমের বাণী' সেকশনে প্রতিফলিত হবে।",
    ],
  },
  {
    id: "principal-seal",
    title: "৩. ডিজিটাল সিল ও অফিশিয়াল স্বাক্ষর",
    icon: Award,
    summary: "প্রত্যয়নপত্র, মানি রসিদ ও মার্কশিটে প্রদর্শিত অফিসিয়াল স্বাক্ষর ব্যবস্থাপনা।",
    steps: [
      "বাম মেনুর 'ডিজিটাল সিল ও স্বাক্ষর' অপশনে যান।",
      "আপনার পরিষ্কার স্বাক্ষরের স্ক্যান কপি (PNG বা JPG ফরম্যাট) সিলেক্ট করে আপলোড দিন।",
      "সংরক্ষিত স্বাক্ষর মাদরাসার অনুমোদিত প্রশংসাপত্র ও চারিত্রিক সনদে স্বয়ংক্রিয়ভাবে সিল হিসেবে যুক্ত হবে।",
    ],
  },
  {
    id: "principal-directives",
    title: "৪. প্রশাসনিক নির্দেশ জারি ও রেজোলিউশন ট্র্যাকিং",
    icon: HelpCircle,
    summary: "মাদরাসা প্রশাসন ও উস্তাদগণের প্রতি সুনির্দিষ্ট প্রাতিষ্ঠানিক আদেশ জারি।",
    steps: [
      "বাম মেনুর 'প্রাতিষ্ঠানিক নির্দেশ' অথবা উপরের '+ নির্দেশ জারি' বাটনে চাপুন।",
      "বিষয়, সংশ্লিষ্ট বিভাগ (অ্যাকাডেমিক, হোস্টেল, অর্থ) এবং অগ্রাধিকার (জরুরি/সাধারণ) নির্ধারণ করুন।",
      "নির্দেশনা লিখে দাখিল করুন; অ্যাডমিন তা বাস্তবায়ন করে লিখিত সমাধান রিপোর্ট প্রদান করবে।",
    ],
  },
  {
    id: "principal-notices",
    title: "৫. জরুরি নোটিশ ও সার্কুলার প্রকাশ",
    icon: Clock,
    summary: "মাদরাসার লাইভ নোটিশ বোর্ডে ছুটি, পরীক্ষা বা জরুরি ঘোষণা প্রদান।",
    steps: [
      "বাম মেনুর 'জরুরি নোটিশ জারি' অপশনে যান।",
      "শিরোনাম, বিষয়বস্তু, টার্গেট অডিয়েন্স এবং ক্যাটাগরি পূরণ করুন।",
      "প্রয়োজনে 'নোটিশ শীর্ষে পিন করুন' টিক দিয়ে 'বিজ্ঞপ্তি জারি করুন' বাটনে ক্লিক করুন।",
    ],
  },
  {
    id: "principal-cashbook",
    title: "৬. ৫-তহবিল ক্যাশবুক ও আর্থিক নিরীক্ষা",
    icon: CreditCard,
    summary: "সাধারণ, লিল্লাহ, যাকাত, নির্মাণ ও এতিম সহায়তার ব্যালেন্স ও ভাউচার অডিট।",
    steps: [
      "'৫-তহবিল ক্যাশবুক' অপশনে গিয়ে প্রতিটি ফান্ডের বর্তমান জমা, আয় ও ব্যয়ের হিসাব দেখুন।",
      "ফিল্টার ড্রপডাউন দিয়ে নির্দিষ্ট ফান্ডের ভাউচারভিত্তিক নিরীক্ষিত লেনদেন হিস্ট্রি পরীক্ষা করুন।",
      "প্রয়োজনে 'প্রিন্ট / PDF' বাটনে ক্লিক করে অফিশিয়াল ক্যাশবুক রিপোর্ট প্রিন্ট নিন।",
    ],
  },
  {
    id: "principal-results",
    title: "৭. অ্যাকাডেমিক ফলাফল ও মেধা তালিকা",
    icon: Award,
    summary: "টার্মিনাল ও বার্ষিক পরীক্ষার জামাতভিত্তিক মেধা তালিকা নিরীক্ষা।",
    steps: [
      "'ফলাফল ও মেধা তালিকা' অপশনে গিয়ে পরীক্ষা এবং শ্রেণি নির্বাচন করুন।",
      "রোল নম্বর, নাম, প্রাপ্ত নম্বর, গ্রেড এবং মেধা স্থান (১ম, ২য়, ৩য়...) শিট যাচাই করুন।",
    ],
  },
  {
    id: "principal-ops",
    title: "৮. সিস্টেম স্বাস্থ্য ও প্রযুক্তিগত নিরাপত্তা",
    icon: Shield,
    summary: "ডেটাবেজ ও ক্লাউড সিস্টেমের রিয়েল-টাইম স্বাস্থ্য এবং ব্যাকআপ স্ট্যাটাস।",
    steps: [
      "'সিস্টেম অপারেশন' অপশনে গিয়ে ডেটাবেজ লেটেন্সি ও উপাদান স্থিতি পর্যালোচনা করুন।",
      "সর্বশেষ ডেটাবেজ ব্যাকআপ ও সিকিউরিটি লগ নিরীক্ষা করুন।",
    ],
  },
];

export default function UserGuideModal({ isOpen, onClose, role }: UserGuideModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string>(
    role === "GUARDIAN"
      ? "login-child"
      : role === "PRINCIPAL"
      ? "principal-overview"
      : "attendance-entry"
  );

  if (!isOpen) return null;

  const sections =
    role === "GUARDIAN"
      ? GUARDIAN_SECTIONS
      : role === "PRINCIPAL"
      ? PRINCIPAL_SECTIONS
      : TEACHER_SECTIONS;
  const filtered = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.steps.some((step) => step.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#052216] via-[#0D5C3A] to-[#0A482D] text-white p-5 sm:p-6 flex items-center justify-between border-b border-emerald-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <BookOpen className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  {role === "GUARDIAN" ? "অভিভাবক নির্দেশিকা" : role === "PRINCIPAL" ? "মুহতামিম গভর্ন্যান্স ম্যানুয়াল" : "শিক্ষক নির্দেশিকা"}
                </span>
                <span className="text-xs text-emerald-200/80">সংস্করণ ১.০.০</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black font-display text-white mt-1">
                {role === "GUARDIAN" ? "অভিভাবক পোর্টাল ব্যবহার সহায়িকা" : role === "PRINCIPAL" ? "মুহতামিম ও অধ্যক্ষ পরিচালনা গাইড" : "উস্তাদ ও শিক্ষক পরিচালনা ম্যানুয়াল"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition border border-white/20"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="যেকোনো বিষয় খুঁজুন (যেমন: পেমেন্ট, হাজিরা, ফলাফল, ছুটি)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:border-transparent transition"
            />
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition shadow-sm hidden sm:inline-flex"
            title="নির্দেশিকা প্রিন্ট করুন"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট</span>
          </button>
        </div>

        {/* Modal Body: Left Sidebar + Right Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Navigation Sidebar */}
          <div className="md:col-span-5 bg-slate-50/80 border-r border-slate-200 overflow-y-auto p-3 space-y-1.5 max-h-[35vh] md:max-h-none">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 text-center">কোনো ফলাফল পাওয়া যায়নি।</p>
            ) : (
              filtered.map((sec) => {
                const IconComponent = sec.icon;
                const isSelected = sec.id === activeSection.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`w-full text-left p-3 rounded-2xl transition flex items-start gap-3 border ${
                      isSelected
                        ? "bg-white border-[#0D5C3A] shadow-md ring-1 ring-[#0D5C3A]/20"
                        : "bg-white/60 hover:bg-white border-slate-200/80 text-slate-700"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl flex-shrink-0 ${
                        isSelected ? "bg-[#0D5C3A] text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold leading-tight ${isSelected ? "text-[#0D5C3A]" : "text-slate-900"}`}>
                        {sec.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {sec.summary}
                      </p>
                    </div>
                    {isSelected && (
                      <ChevronRight className="w-4 h-4 text-[#0D5C3A] flex-shrink-0 self-center" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Detailed Content Pane */}
          <div className="md:col-span-7 p-5 sm:p-7 overflow-y-auto space-y-5 bg-white">
            {activeSection && (
              <>
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="p-1.5 bg-emerald-50 text-[#0D5C3A] rounded-lg">
                      <activeSection.icon className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      ব্যবহার সহায়িকা বিবরণ
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {activeSection.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {activeSection.summary}
                  </p>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    ধাপসমূহ (Step-by-Step Instructions):
                  </h4>
                  <div className="space-y-2.5">
                    {activeSection.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs text-slate-700 leading-relaxed"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0D5C3A] flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Tips / Notice */}
                {activeSection.tips && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold mb-0.5">পরামর্শ ও সতর্কতা:</strong>
                      <span>{activeSection.tips}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>প্রয়োজনে সরাসরি মাদরাসা অফিসে যোগাযোগ করুন: 01845-162664</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition"
          >
            ঠিক আছে
          </button>
        </div>

      </div>
    </div>
  );
}
