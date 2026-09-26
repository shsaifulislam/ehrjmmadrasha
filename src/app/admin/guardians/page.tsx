"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  ArrowLeft,
  RefreshCw,
  Building,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Shield,
  Layers,
  XCircle,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function AdminGuardiansPage() {
  const [guardians, setGuardians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [banner, setBanner] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // New Guardian Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [nameBn, setNameBn] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("FATHER");
  const [occupation, setOccupation] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchGuardians = async () => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `/api/admin/guardians?q=${encodeURIComponent(searchQuery)}`
        : "/api/admin/guardians";
      const res = await fetch(url);
      const data = await res.json();
      if (data.guardians) setGuardians(data.guardians);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardians();
  }, [searchQuery]);

  const handleCreateGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/guardians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullNameBn: nameBn,
          fullNameEn: nameEn,
          phone,
          relation,
          occupation,
          address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "অভিভাবক তৈরিতে ত্রুটি");

      setBanner({ text: data.message, type: "success" });
      setShowAddModal(false);
      setNameBn("");
      setNameEn("");
      setPhone("");
      setOccupation("");
      setAddress("");
      fetchGuardians();
    } catch (err: any) {
      setBanner({ text: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ড্যাশবোর্ড</span>
            </Link>
            <div className="h-5 w-px bg-emerald-700 hidden sm:block" />
            <div>
              <h1 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-300" />
                <span>অভিভাবক ব্যবস্থাপনা ডিরেক্টরি</span>
              </h1>
              <p className="text-xs text-emerald-200">{INSTITUTION_INFO.nameBn} • অভিভাবক ও ভাই-বোন সম্পর্ক</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchGuardians}
              className="p-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-lg transition-colors flex items-center gap-1 text-xs"
              title="রিফ্রেশ"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
            <Link
              href="/admin/students"
              className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              <span>শিক্ষার্থী তালিকা</span>
            </Link>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন অভিভাবক নিবন্ধন</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Alert */}
        {banner && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium ${
              banner.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {banner.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
              <span>{banner.text}</span>
            </div>
            <button onClick={() => setBanner(null)} className="text-xs underline hover:no-underline">
              বন্ধ করুন
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="অভিভাবকের নাম, মোবাইল নম্বর অথবা সন্তানের নাম..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            মোট অভিভাবক: <span className="font-bold text-emerald-800">{guardians.length} জন</span>
          </div>
        </div>

        {/* Guardian Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              <span>তথ্য লোড হচ্ছে...</span>
            </div>
          ) : guardians.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <span>কোনো অভিভাবকের রেকর্ড পাওয়া যায়নি।</span>
            </div>
          ) : (
            guardians.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{g.fullNameBn}</h3>
                    <p className="text-xs text-slate-500">সম্পর্ক: {g.relation || "পিতা"}</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                    {g.phone}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  {g.occupation && <p>পেশা: {g.occupation}</p>}
                  {g.address && <p className="truncate">ঠিকানা: {g.address}</p>}
                </div>

                {/* Linked Children / Siblings */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    সংযুক্ত সন্তান / শিক্ষার্থী ({g.linkedStudents?.length || 0})
                  </span>
                  {g.linkedStudents?.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">কোনো শিক্ষার্থী সংযুক্ত নেই</span>
                  ) : (
                    <div className="space-y-1.5">
                      {g.linkedStudents.map((child: any) => (
                        <Link
                          key={child.id}
                          href={`/admin/students/${child.id}`}
                          className="flex items-center justify-between p-2 bg-slate-50 hover:bg-emerald-50 rounded-lg text-xs transition-colors border border-slate-100"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{child.fullNameBn}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {child.studentIdNumber} • {child.className}
                            </span>
                          </div>
                          {child.isPrimary && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              মূল
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* CREATE GUARDIAN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>নতুন অভিভাবক নিবন্ধন</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateGuardian} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">অভিভাবকের নাম (বাংলায়) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমনঃ হাজী মুহাম্মদ করিম"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01845..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">সম্পর্ক</label>
                  <select
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="FATHER">পিতা (Father)</option>
                    <option value="MOTHER">মাতা (Mother)</option>
                    <option value="BROTHER">ভাই (Brother)</option>
                    <option value="UNCLE">চাচা / মামা (Uncle)</option>
                    <option value="OTHER">অন্যান্য</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">পেশা</label>
                <input
                  type="text"
                  placeholder="ব্যবসা / প্রবাসী / চাকরিজীবী"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ঠিকানা</label>
                <textarea
                  rows={2}
                  placeholder="গ্রাম, ডাকঘর, থানা, জেলা"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold"
                >
                  {submitting ? "সংরক্ষণ হচ্ছে..." : "অভিভাবক সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
