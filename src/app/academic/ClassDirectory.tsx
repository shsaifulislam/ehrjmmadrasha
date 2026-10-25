"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Users, BookOpen } from "lucide-react";

interface JamatClassItem {
  id: string;
  nameBn: string;
  nameEn: string | null;
  code: string;
  sections?: { id: string; name: string }[];
}

export default function ClassDirectory({
  initialClasses,
}: {
  initialClasses: JamatClassItem[];
}) {
  const [filterQuery, setFilterQuery] = useState("");

  const filteredClasses = initialClasses.filter(
    (cls) =>
      cls.nameBn?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      cls.nameEn?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      cls.code?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-extrabold text-[#0D5C3A] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            অফিসিয়াল জামাত তালিকা
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            মাদরাসার অনুমোদিত সক্রিয় জামাত ও শ্রেণি
          </h3>
          <p className="text-xs text-slate-500">
            চলতি শিক্ষাবর্ষের সক্রিয় ক্লাস ও শিক্ষার্থী ভর্তি কোড ({filteredClasses.length}টি বিভাগ)
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial w-full sm:w-auto min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="শ্রেণি বা কোড খুঁজুন..."
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:border-transparent transition"
            />
          </div>

          <Link
            href="/admission/apply"
            className="btn-gold px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap w-full sm:w-auto"
          >
            <span>আবেদন করুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            কোনো জামাত বা শ্রেণি পাওয়া যায়নি।
          </div>
        ) : (
          filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 group-hover:text-[#0D5C3A] transition">
                  {cls.nameBn}
                </span>
                <span className="text-[10px] font-mono text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold">
                  {cls.code}
                </span>
              </div>

              <p className="text-xs text-slate-500">
                {cls.nameEn || "Islamic Curriculum"}
              </p>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-600" />
                  <span>ভর্তি উন্মুক্ত</span>
                </span>
                <Link
                  href={`/admission/apply?classId=${cls.id}`}
                  className="text-[#0D5C3A] font-bold hover:underline"
                >
                  আবেদন ফরম →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
