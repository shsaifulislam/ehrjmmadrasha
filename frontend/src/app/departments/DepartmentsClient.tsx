"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Search,
  ArrowLeft,
  Filter,
  Clock,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

interface Department {
  id: string;
  nameBn: string;
  nameEn: string;
  categoryKey: string;
  description: string;
  classes: string[];
  durationInfo: string;
  eligibilityInfo: string;
  bgClass: string;
}

const DEPARTMENTS_DATA: Department[] = [
  {
    id: "nurani",
    categoryKey: "nurani",
    nameBn: "নূরানী / মক্তব বিভাগ",
    nameEn: "Nursery / Maktab Department",
    description:
      "প্রাথমিক ইসলামী শিক্ষা, কায়েদা, আমপারা ও নূরানী পদ্ধতিতে অত্যন্ত যত্নসহকারে শিশু কিশোরদের বিশুদ্ধভাবে পবিত্র কুরআনুল কারীম তিলাওয়াত ও দ্বীনি বুনিয়াদি শিক্ষা দেয়া হয়।",
    classes: ["শিশু শ্রেণী (Nursery)", "১ম শ্রেণী (Class 1)", "২য় শ্রেণী (Class 2)", "৩য় শ্রেণী (Class 3)"],
    durationInfo: "মেয়াদকাল: ১ - ৪ বছর (শ্রেণীভিত্তিক)",
    eligibilityInfo: "যোগ্যতা: ৪ বছর বা তদুর্ধ শিশু-কিশোর",
    bgClass: "border-l-emerald-600 dark:border-l-emerald-500",
  },
  {
    id: "nazera",
    categoryKey: "nazera",
    nameBn: "নাযেরা বিভাগ",
    nameEn: "Nazera Department",
    description:
      "তাজবীদ ও মাখরাজের বিশুদ্ধ উচ্চারণে দেখে দেখে সম্পূর্ণ পবিত্র কুরআনুল কারীম পাঠ সম্পন্ন করার বিশেষ বিভাগ।",
    classes: ["নাযেরা (Nazera)"],
    durationInfo: "মেয়াদকাল: ১ বছর",
    eligibilityInfo: "যোগ্যতা: নূরানী ও কায়দা সম্পন্নকারী",
    bgClass: "border-l-teal-600 dark:border-l-teal-500",
  },
  {
    id: "hifz",
    categoryKey: "hifz",
    nameBn: "হিফজ বিভাগ",
    nameEn: "Hifz Department",
    description:
      "অভিজ্ঞ হুফফাজে کرامদের সার্বক্ষণিক নিবিড় তত্ত্বাবধানে সম্পূর্ণ ৩০ পারা পবিত্র কুরআনুল কারীম হিফজকরণের আন্তর্জাতিক মানের হিফজ প্রোগ্রাম।",
    classes: ["হিফজ (Hifz)"],
    durationInfo: "মেয়াদকাল: ২ - ৩ বছর (মেধাক্রম অনুযায়ী)",
    eligibilityInfo: "যোগ্যতা: নাযেরা সম্পন্নকারী শিক্ষার্থী",
    bgClass: "border-l-amber-500 dark:border-l-amber-400",
  },
  {
    id: "kitab",
    categoryKey: "kitab",
    nameBn: "কিতাব বিভাগ",
    nameEn: "Kitab Department",
    description:
      "আরবি ভাষা ও সাহিত্য, ব্যাকরণ, ফিকহ, তাফসির, উসূলে হাদিস ও দাওরায়ে হাদীস (এম.এ সমমান) পর্যন্ত কওমি মাদ্রাসা শিক্ষাবোর্ডের মানসম্মত উচ্চতর শিক্ষা।",
    classes: [
      "মিযান (Mizan)",
      "নাহবেমীর (Nahvemeer)",
      "হেদায়েতুন্নাহু (Hidayatunnahu)",
      "কাফিয়া (Kafiyah)",
      "শরহে বেকায়া (Sharhe Beqayah)",
      "জালালাইন (Jalalayn)",
      "মেশকাত (Mishkat)",
      "দাওরায়ে হাদীস (Dawra-e-Hadith)",
    ],
    durationInfo: "মেয়াদকাল: ৮ বছর (প্রাথমিক থেকে স্নাতকোত্তর সমমান)",
    eligibilityInfo: "যোগ্যতা: হিফজ/নাযেরা অথবা সমমান যোগ্যতা সম্পন্ন",
    bgClass: "border-l-blue-600 dark:border-l-blue-500",
  },
  {
    id: "takhassus",
    categoryKey: "takhassus",
    nameBn: "তাখাস্সুস / উচ্চতর বিভাগ",
    nameEn: "Takhassus / Post-Graduation Department",
    description:
      "দাওরায়ে হাদীস পরবর্তীতে ইসলামী আইন ও ফতোয়া গবেষণা (ইফতা), হাদিস শাস্ত্র ও আরবি সাহিত্যে সর্বোচ্চ ডিগ্রি ও আন্তর্জাতিক গবেষণা বিভাগ।",
    classes: [
      "ইফতা (Ifta)",
      "তাখাস্সুস ফিল হাদীস (Takhassus Hadith)",
      "তাখাস্সুস ফিল আদাব (Takhassus Adab)",
    ],
    durationInfo: "মেয়াদকাল: ১ - ২ বছর",
    eligibilityInfo: "যোগ্যতা: দাওরায়ে হাদীস (উত্তীর্ণ)",
    bgClass: "border-l-purple-600 dark:border-l-purple-500",
  },
];

export function DepartmentsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredDepartments = DEPARTMENTS_DATA.filter((dept) => {
    const matchesCategory =
      selectedCategory === "all" || dept.categoryKey === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      dept.nameBn.toLowerCase().includes(query) ||
      dept.nameEn.toLowerCase().includes(query) ||
      dept.description.toLowerCase().includes(query) ||
      dept.classes.some((cls) => cls.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
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
                জমিরীয়া মাদ্রাসা (স্থাপিত: ২০২১)
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-sm text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> মূল পাতায় ফিরে যান
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 flex-1 w-full">
        {/* Banner Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>৫টি অফিশিয়াল শিক্ষা বিভাগ ও ১৭টি জামায়াত</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            আমাদের শিক্ষা বিভাগসমূহ
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-xs sm:text-base leading-relaxed">
            সুন্নতে নববীর আলোকে নূরানী ও হিফজ বিভাগ থেকে শুরু করে দাওরায়ে হাদীস ও উচ্চতর ইফতা কোর্স পর্যন্ত মাদ্রাসার সার্বিক শিক্ষাক্রম।
          </p>
        </div>

        {/* Controls: Search & Category Filter */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="বিভাগ বা ক্লাসের নাম খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto justify-start md:justify-end">
              {[
                { key: "all", label: "সব বিভাগ" },
                { key: "nurani", label: "নূরানী" },
                { key: "nazera", label: "নাযেরা" },
                { key: "hifz", label: "হিফজ" },
                { key: "kitab", label: "কিতাব" },
                { key: "takhassus", label: "তাখাস্সুস" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    selectedCategory === tab.key
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Departments List Grid */}
        {filteredDepartments.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="কোনো বিভাগ বা জামায়াত পাওয়া যায়নি"
            description="আপনার সার্চ ফাইন্ডারের সাথে মিল রেখে কোনো উপাদান খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।"
          />
        ) : (
          <div className="space-y-6">
            {filteredDepartments.map((dept) => (
              <Card
                key={dept.id}
                className={`shadow-sm border-l-4 ${dept.bgClass} hover:shadow-md transition-all bg-white dark:bg-slate-900`}
              >
                <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
                        {dept.nameBn}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {dept.nameEn}
                      </CardDescription>
                    </div>
                    <Link href={`/admission?dept=${dept.id}`}>
                      <Button
                        size="sm"
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors shadow-sm shrink-0"
                      >
                        ভর্তি আবেদন করুন <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {dept.description}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-md border">
                      <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{dept.durationInfo}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-md border">
                      <Award className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>{dept.eligibilityInfo}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                      এই বিভাগের অন্তর্ভুক্ত জামায়াতসমূহ ({dept.classes.length}টি):
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {dept.classes.map((cls, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium px-3 py-1 rounded-md flex items-center gap-1.5 shadow-2xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
