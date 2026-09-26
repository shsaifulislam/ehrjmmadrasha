"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  Search,
  Filter,
  PlusCircle,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Building,
} from "lucide-react";

interface JamatClass {
  id: string;
  nameBn: string;
  code: string;
}

interface AcademicSession {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface AdmissionItem {
  id: string;
  applicationNumber: string;
  source: string;
  studentNameBn: string;
  studentNameEn?: string;
  guardianName: string;
  guardianPhone: string;
  status: string;
  desiredResidentialStatus: string;
  isOrphan: boolean;
  isFinanciallyWeak: boolean;
  createdAt: string;
  desiredClass?: { nameBn: string };
  session?: { name: string };
}

export default function AdminAdmissionsPage() {
  const [admissions, setAdmissions] = useState<AdmissionItem[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({
    TOTAL: 0,
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    VERIFICATION: 0,
    EXAM_INTERVIEW: 0,
    CORRECTION_REQUESTED: 0,
    APPROVED: 0,
    REJECTED: 0,
  });
  const [classes, setClasses] = useState<JamatClass[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Office Admission Modal
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [officeSubmitting, setOfficeSubmitting] = useState(false);
  const [officeForm, setOfficeForm] = useState({
    studentNameBn: "",
    studentNameEn: "",
    dateOfBirth: "",
    gender: "MALE",
    desiredClassId: "",
    desiredResidentialStatus: "NON_RESIDENTIAL",
    guardianName: "",
    guardianPhone: "",
    guardianRelation: "FATHER",
    presentAddress: "",
    birthCertificateNo: "",
    isOrphan: false,
    isFinanciallyWeak: false,
  });

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (selectedSessionId) params.set("sessionId", selectedSessionId);
      if (selectedClassId) params.set("classId", selectedClassId);
      if (selectedSource !== "ALL") params.set("source", selectedSource);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`/api/admin/admissions?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setAdmissions(data.admissions || []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error("Admissions fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/academic/classes").then((res) => res.json()).catch(() => ({ classes: [] })),
      fetch("/api/academic/sessions").then((res) => res.json()).catch(() => ({ sessions: [] })),
    ]).then(([classData, sessionData]) => {
      if (classData.classes) {
        setClasses(classData.classes);
        if (classData.classes.length > 0) {
          setOfficeForm((prev) => ({ ...prev, desiredClassId: classData.classes[0].id }));
        }
      }
      if (sessionData.sessions) {
        setSessions(sessionData.sessions);
      }
    });
  }, []);

  useEffect(() => {
    fetchAdmissions();
  }, [selectedStatus, selectedSessionId, selectedClassId, selectedSource, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAdmissions();
  };

  const handleOfficeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfficeSubmitting(true);
    try {
      const res = await fetch("/api/admin/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(officeForm),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`অফিস ভর্তি আবেদন সফলভাবে তৈরি হয়েছে। ট্র্যাকিং নম্বর: ${data.applicationNumber}`);
        setShowOfficeModal(false);
        fetchAdmissions();
      } else {
        alert(data.error || "অফিস ভর্তি এন্ট্রি ব্যর্থ হয়েছে।");
      }
    } catch {
      alert("সার্ভার ত্রুটি।");
    } finally {
      setOfficeSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">অনুমোদিত</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">বাতিল</span>;
      case "CORRECTION_REQUESTED":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">সংশোধন কাম্য</span>;
      case "EXAM_INTERVIEW":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">পরীক্ষা/সাক্ষাতকার</span>;
      case "VERIFICATION":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-100 text-cyan-800">যাচাইকরণ</span>;
      case "UNDER_REVIEW":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">পর্যালোচনাধীন</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-stone-100 text-stone-700">দাখিলকৃত</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0D5C3A] uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            শিক্ষার্থী ভর্তি ও যাচাইকরণ ব্যবস্থাপনা
          </div>
          <h1 className="text-2xl font-bold text-stone-900 font-display">
            ভর্তি আবেদনসমূহ (Admissions Cockpit)
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAdmissions()}
            className="p-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowOfficeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D5C3A] hover:bg-[#158052] text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            + নতুন অফিস আবেদন এন্ট্রি
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "মোট আবেদন", count: stats.TOTAL, color: "border-stone-300 bg-stone-50 text-stone-800", statusKey: "ALL" },
          { label: "নতুন দাখিল", count: stats.SUBMITTED, color: "border-stone-300 bg-white text-stone-700", statusKey: "SUBMITTED" },
          { label: "পর্যালোচনাধীন", count: stats.UNDER_REVIEW, color: "border-blue-200 bg-blue-50/50 text-blue-800", statusKey: "UNDER_REVIEW" },
          { label: "যাচাইকরণ", count: stats.VERIFICATION, color: "border-cyan-200 bg-cyan-50/50 text-cyan-800", statusKey: "VERIFICATION" },
          { label: "পরীক্ষা/সাক্ষাতকার", count: stats.EXAM_INTERVIEW, color: "border-purple-200 bg-purple-50/50 text-purple-800", statusKey: "EXAM_INTERVIEW" },
          { label: "অনুমোদিত", count: stats.APPROVED, color: "border-emerald-200 bg-emerald-50 text-emerald-800", statusKey: "APPROVED" },
          { label: "বাতিল", count: stats.REJECTED, color: "border-rose-200 bg-rose-50 text-rose-800", statusKey: "REJECTED" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => { setSelectedStatus(item.statusKey); setPage(1); }}
            className={`border rounded-xl p-3 text-left transition hover:shadow-sm ${item.color} ${
              selectedStatus === item.statusKey ? "ring-2 ring-[#0D5C3A]" : ""
            }`}
          >
            <span className="text-[11px] font-semibold block opacity-80">{item.label}</span>
            <span className="text-xl font-bold font-mono block mt-1">{item.count || 0}</span>
          </button>
        ))}
      </div>

      {/* Multi-Filters & Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px]">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ট্র্যাকিং আইডি, শিক্ষার্থীর নাম, অভিভাবকের ফোন..."
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-xs outline-none focus:border-[#0D5C3A]"
              />
            </div>
          </div>

          <div>
            <select
              value={selectedClassId}
              onChange={(e) => { setSelectedClassId(e.target.value); setPage(1); }}
              className="py-2 px-3 border border-stone-300 rounded-lg text-xs bg-white outline-none focus:border-[#0D5C3A]"
            >
              <option value="">সকল জামাত / শ্রেণি</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.nameBn}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSource}
              onChange={(e) => { setSelectedSource(e.target.value); setPage(1); }}
              className="py-2 px-3 border border-stone-300 rounded-lg text-xs bg-white outline-none focus:border-[#0D5C3A]"
            >
              <option value="ALL">সকল উৎস (অনলাইন ও অফিস)</option>
              <option value="ONLINE">অনলাইন আবেদন</option>
              <option value="OFFICE">অফিস এন্ট্রি</option>
            </select>
          </div>

          <div>
            <select
              value={selectedSessionId}
              onChange={(e) => { setSelectedSessionId(e.target.value); setPage(1); }}
              className="py-2 px-3 border border-stone-300 rounded-lg text-xs bg-white outline-none focus:border-[#0D5C3A]"
            >
              <option value="">সকল সেশন</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? "(বর্তমান)" : ""}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-semibold"
          >
            ফিল্টার করুন
          </button>
        </form>
      </div>

      {/* Applications Data Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
              <tr>
                <th className="p-3.5">ট্র্যাকিং নম্বর</th>
                <th className="p-3.5">শিক্ষার্থীর নাম</th>
                <th className="p-3.5">আবেদিত জামাত</th>
                <th className="p-3.5">অভিভাবক ও ফোন</th>
                <th className="p-3.5">উৎস</th>
                <th className="p-3.5">অবস্থা</th>
                <th className="p-3.5">তারিখ</th>
                <th className="p-3.5 text-right">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">
                    লোড করা হচ্ছে...
                  </td>
                </tr>
              ) : admissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-500">
                    কোনো ভর্তি আবেদন পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                admissions.map((app) => (
                  <tr key={app.id} className="hover:bg-stone-50/70 transition">
                    <td className="p-3.5 font-mono font-bold text-[#0D5C3A]">
                      <Link href={`/admin/admissions/${app.id}`} className="hover:underline">
                        {app.applicationNumber}
                      </Link>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-stone-900">{app.studentNameBn}</div>
                      {app.studentNameEn && (
                        <div className="text-[11px] text-stone-400">{app.studentNameEn}</div>
                      )}
                      {app.isOrphan && (
                        <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                          ইয়াতীম
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-semibold text-stone-800">
                      {app.desiredClass?.nameBn || "নির্ধারিত নয়"}
                    </td>
                    <td className="p-3.5">
                      <div className="text-stone-800">{app.guardianName}</div>
                      <div className="font-mono text-stone-500 text-[11px]">{app.guardianPhone}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        app.source === "OFFICE" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {app.source === "OFFICE" ? "অফিস" : "অনলাইন"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="p-3.5 font-mono text-stone-500 text-[11px]">
                      {new Date(app.createdAt).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        href={`/admin/admissions/${app.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-[#0D5C3A] hover:text-white text-stone-700 rounded text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        নিরীক্ষা করুন
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <span>পৃষ্ঠা {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-40"
              >
                পূর্ববর্তী
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-40"
              >
                পরবর্তী
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OFFICE ADMISSION MODAL */}
      {showOfficeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h2 className="text-base font-bold text-stone-900 font-display">
                নতুন অফিস ভর্তি আবেদন এন্ট্রি (Office Admission)
              </h2>
              <button
                onClick={() => setShowOfficeModal(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOfficeSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">
                    শিক্ষার্থীর পূর্ণ নাম (বাংলায়) *
                  </label>
                  <input
                    type="text"
                    required
                    value={officeForm.studentNameBn}
                    onChange={(e) => setOfficeForm({ ...officeForm, studentNameBn: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded outline-none focus:border-[#0D5C3A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">জন্ম তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={officeForm.dateOfBirth}
                    onChange={(e) => setOfficeForm({ ...officeForm, dateOfBirth: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded outline-none focus:border-[#0D5C3A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">জামাত / শ্রেণি *</label>
                  <select
                    value={officeForm.desiredClassId}
                    onChange={(e) => setOfficeForm({ ...officeForm, desiredClassId: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded outline-none focus:border-[#0D5C3A] bg-white"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.nameBn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">অভিভাবকের নাম *</label>
                  <input
                    type="text"
                    required
                    value={officeForm.guardianName}
                    onChange={(e) => setOfficeForm({ ...officeForm, guardianName: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded outline-none focus:border-[#0D5C3A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">অভিভাবকের মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={officeForm.guardianPhone}
                    onChange={(e) => setOfficeForm({ ...officeForm, guardianPhone: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded outline-none focus:border-[#0D5C3A] font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">বর্তমান ঠিকানা</label>
                  <input
                    type="text"
                    value={officeForm.presentAddress}
                    onChange={(e) => setOfficeForm({ ...officeForm, presentAddress: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded outline-none focus:border-[#0D5C3A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">আবাসিক অবস্থা</label>
                  <select
                    value={officeForm.desiredResidentialStatus}
                    onChange={(e) => setOfficeForm({ ...officeForm, desiredResidentialStatus: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded outline-none focus:border-[#0D5C3A] bg-white"
                  >
                    <option value="NON_RESIDENTIAL">অনাবাসিক</option>
                    <option value="RESIDENTIAL">আবাসিক</option>
                    <option value="DAY_CARE">ডে-কেয়ার</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={officeForm.isOrphan}
                      onChange={(e) => setOfficeForm({ ...officeForm, isOrphan: e.target.checked })}
                      className="rounded text-[#0D5C3A]"
                    />
                    <span className="font-semibold text-stone-800">শিক্ষার্থী ইয়াতীম</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowOfficeModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded text-stone-700 hover:bg-stone-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={officeSubmitting}
                  className="px-5 py-2 bg-[#0D5C3A] hover:bg-[#158052] text-white rounded font-bold disabled:opacity-50"
                >
                  {officeSubmitting ? "সংরক্ষণ হচ্ছে..." : "আবেদন সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
