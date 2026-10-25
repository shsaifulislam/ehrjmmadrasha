"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VendorType, VendorCategoryCode } from "@/lib/procurement/types";

export default function NewVendorOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const [form, setForm] = useState({
    legalNameBn: "",
    legalNameEn: "",
    displayName: "",
    vendorType: "SUPPLIER" as VendorType,
    categoryCode: "BOOKS" as VendorCategoryCode,
    phone: "",
    altPhone: "",
    email: "",
    addressBn: "ইলিয়টগঞ্জ বাজার, দাউদকান্দি, কুমিল্লা",
    district: "Comilla",
    tradeLicenseNo: "",
    tinNumber: "",
    binVatNumber: "",
    bankName: "Islami Bank Bangladesh PLC",
    bankBranch: "Kandirpar Branch",
    bankAccountTitle: "",
    bankAccountNumber: "",
    contactName: "",
    contactDesignation: "ম্যানেজার",
    contactPhone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDuplicateWarning(null);

    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ভেন্ডর নিবন্ধন ব্যর্থ হয়েছে।");
      }

      if (data.duplicateWarnings && data.duplicateWarnings.length > 0) {
        setDuplicateWarning(data.duplicateWarnings.join(", "));
      }

      // Successful redirect after brief toast
      setTimeout(() => {
        router.push(`/admin/vendors/${data.vendor.id}`);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "ত্রুটি ঘটেছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono mb-1">
              <span>EHRJ-AI-2026-PHASE40</span>
              <span>•</span>
              <span>SUPPLIER ONBOARDING GATE</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              নতুন সরবরাহকারী / ভেন্ডর নিবন্ধন ও অনবোর্ডিং
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার প্রাতিষ্ঠানিক সরবরাহকারী নীতিমালার অধীন নিয়ন্ত্রিত নিবন্ধন
            </p>
          </div>
          <Link
            href="/admin/vendors"
            className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          >
            ← ভেন্ডর তালিকায় ফেরত
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm">
            ❌ {error}
          </div>
        )}

        {duplicateWarning && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-sm">
            ⚠️ সতর্কতা: {duplicateWarning}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 shadow-xl backdrop-blur-sm">
          {/* Section 1: Business Identity */}
          <div>
            <h2 className="text-lg font-semibold text-emerald-400 border-b border-slate-700/60 pb-2 mb-4">
              ১. ব্যবসায়িক পরিচয় ও প্রাতিষ্ঠানিক তথ্য
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  আইনি নাম (বাংলায়) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: কুমিল্লা মডার্ন প্রেস অ্যান্ড পাবলিকেশন্স"
                  value={form.legalNameBn}
                  onChange={(e) => setForm({ ...form, legalNameBn: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  আইনি নাম (ইংরেজিতে)
                </label>
                <input
                  type="text"
                  placeholder="Comilla Modern Press & Publications"
                  value={form.legalNameEn}
                  onChange={(e) => setForm({ ...form, legalNameEn: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  সরবরাহকারীর ধরণ (Vendor Type) *
                </label>
                <select
                  value={form.vendorType}
                  onChange={(e) => setForm({ ...form, vendorType: e.target.value as VendorType })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="SUPPLIER">সরবরাহকারী (Supplier)</option>
                  <option value="CONTRACTOR">ঠিকাদার (Contractor)</option>
                  <option value="SERVICE_PROVIDER">সেবা প্রদানকারী (Service Provider)</option>
                  <option value="CONSULTANT">পরামর্শক (Consultant)</option>
                  <option value="MANUFACTURER">উত্পাদক (Manufacturer)</option>
                  <option value="DISTRIBUTOR">পরিবেশক (Distributor)</option>
                  <option value="LOCAL_VENDOR">স্থানীয় বিক্রেতা (Local Vendor)</option>
                  <option value="OTHER">অন্যান্য (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ক্যাটাগরি (Category) *
                </label>
                <select
                  value={form.categoryCode}
                  onChange={(e) => setForm({ ...form, categoryCode: e.target.value as VendorCategoryCode })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="BOOKS">বই ও প্রকাশনা (Books)</option>
                  <option value="FOOD">খাদ্য ও ছাত্রাবাস সামগ্রী (Food & Mess)</option>
                  <option value="STATIONERY">স্টেশনারি ও মুদ্রণ (Stationery)</option>
                  <option value="FURNITURE">আসবাবপত্র (Furniture)</option>
                  <option value="IT">আইটি ও সফটওয়্যার (IT)</option>
                  <option value="ELECTRONICS">ইলেকট্রনিক্স ও যন্ত্রপাতি (Electronics)</option>
                  <option value="CONSTRUCTION">নির্মাণ ও সংস্কার (Construction)</option>
                  <option value="ELECTRICAL">বৈদ্যুতিক ফিটিংস (Electrical)</option>
                  <option value="PLUMBING">প্লাম্বিং ও স্যানিটারি (Plumbing)</option>
                  <option value="MAINTENANCE">রক্ষণাবেক্ষণ ও মেরামত (Maintenance)</option>
                  <option value="TRANSPORT">যানবাহন ও লজিস্টিকস (Transport)</option>
                  <option value="CLEANING">পরিচ্ছন্নতা সামগ্রী (Cleaning)</option>
                  <option value="TRAINING">প্রশিক্ষণ ও কর্মশালা (Training)</option>
                  <option value="OTHER">অন্যান্য (Other)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Location */}
          <div>
            <h2 className="text-lg font-semibold text-emerald-400 border-b border-slate-700/60 pb-2 mb-4">
              ২. যোগাযোগের মাধ্যম ও ঠিকানা
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  প্রাতিষ্ঠানিক মোবাইল নম্বর *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017xxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  বিকল্প ফোন নম্বর
                </label>
                <input
                  type="tel"
                  placeholder="018xxxxxxxx"
                  value={form.altPhone}
                  onChange={(e) => setForm({ ...form, altPhone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ইমেইল অ্যাড্রেস
                </label>
                <input
                  type="email"
                  placeholder="supplier@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ব্যবসার ঠিকানা *
                </label>
                <input
                  type="text"
                  required
                  placeholder="বাজার রোড, দাউদকান্দি, কুমিল্লা"
                  value={form.addressBn}
                  onChange={(e) => setForm({ ...form, addressBn: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  জেলা
                </label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Legal & Tax Registration */}
          <div>
            <h2 className="text-lg font-semibold text-emerald-400 border-b border-slate-700/60 pb-2 mb-4">
              ৩. আইনি ও কর নিবন্ধন (Tax & Licenses)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ট্রেড লাইসেন্স নম্বর
                </label>
                <input
                  type="text"
                  placeholder="TRAD/COM/..."
                  value={form.tradeLicenseNo}
                  onChange={(e) => setForm({ ...form, tradeLicenseNo: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ই-টিন নম্বর (TIN)
                </label>
                <input
                  type="text"
                  placeholder="১২ ডিজিটের ই-টিন"
                  value={form.tinNumber}
                  onChange={(e) => setForm({ ...form, tinNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ভ্যাট / বিন নম্বর (BIN / VAT)
                </label>
                <input
                  type="text"
                  placeholder="১১ ডিজিটের ভ্যাট বিন"
                  value={form.binVatNumber}
                  onChange={(e) => setForm({ ...form, binVatNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Bank Information Reference (Secured & Masked) */}
          <div>
            <h2 className="text-lg font-semibold text-emerald-400 border-b border-slate-700/60 pb-2 mb-4 flex items-center justify-between">
              <span>৪. ব্যাংক হিসাব রেফারেন্স (নিরাপদ মাস্কিং কার্যকর)</span>
              <span className="text-xs font-normal text-slate-400">Phase 6 ফাইন্যান্স পেমেন্ট রেফারেন্স</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ব্যাংকের নাম
                </label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  শাখা (Branch)
                </label>
                <input
                  type="text"
                  value={form.bankBranch}
                  onChange={(e) => setForm({ ...form, bankBranch: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  হিসাবের শিরোনাম (Account Title)
                </label>
                <input
                  type="text"
                  placeholder="ব্যবসায়িক হিসাবের নাম"
                  value={form.bankAccountTitle}
                  onChange={(e) => setForm({ ...form, bankAccountTitle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ব্যাংক হিসাব নম্বর (সংরক্ষিত হওয়ার পর মাস্ক করা হবে)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ২০৫০১১২২৩৩৪৪৫৫৬৬৭"
                  value={form.bankAccountNumber}
                  onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Primary Contact Person */}
          <div>
            <h2 className="text-lg font-semibold text-emerald-400 border-b border-slate-700/60 pb-2 mb-4">
              ৫. দায়িত্বপ্রাপ্ত যোগাযোগের ব্যক্তি (Primary Contact)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ব্যক্তির নাম
                </label>
                <input
                  type="text"
                  placeholder="মো: হাবিবুর রহমান"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  পদবি
                </label>
                <input
                  type="text"
                  value={form.contactDesignation}
                  onChange={(e) => setForm({ ...form, contactDesignation: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  যোগাযোগের ফোন নম্বর
                </label>
                <input
                  type="tel"
                  placeholder="017xxxxxxxx"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Institutional Rule Notice */}
          <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-400 leading-relaxed space-y-1">
            <div className="font-semibold text-slate-300">
              📌 প্রাতিষ্ঠানিক অনবোর্ডিং নীতিমালা (Invariants):
            </div>
            <div>১. নতুন ভেন্ডর প্রাথমিক অবস্থায় <span className="text-amber-400 font-mono">PENDING_VERIFICATION</span> স্ট্যাটাসে থাকবে।</div>
            <div>২. দায়িত্বপ্রাপ্ত প্রশাসনিক কর্মকর্তা কর্তৃক ট্রেড লাইসেন্স ও সত্যতা যাচাইকরণের পরেই কেবল সক্রিয় (<span className="text-emerald-400 font-mono">ACTIVE</span>) হবে।</div>
            <div>৩. কোনো প্রকার গোপন ভেন্ডর অগ্রাধিকার বা স্বয়ংক্রিয় সিলেকশন কঠোরভাবে নিষিদ্ধ।</div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <Link
              href="/admin/vendors"
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
            >
              বাতিল
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm transition shadow-lg shadow-emerald-900/30 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? "সংরক্ষণ করা হচ্ছে..." : "ভেন্ডর নিবন্ধন সম্পন্ন করুন →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
