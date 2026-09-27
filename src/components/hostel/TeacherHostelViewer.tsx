"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  Users,
  Search,
  CheckCircle,
  Info,
  User,
  ShieldCheck,
  RotateCw,
  AlertTriangle,
} from "lucide-react";

export default function TeacherHostelViewer() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHostelRoster = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/hostel");
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.assignedClasses && json.assignedClasses.length > 0 && !selectedClassId) {
          setSelectedClassId(json.assignedClasses[0].id);
        }
      } else {
        setError(json.error || "আবাসিক তথ্য লোড করতে ব্যর্থ।");
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগ ত্রুটি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostelRoster();
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-500 shadow-sm">
        <RotateCw className="w-5 h-5 animate-spin mx-auto text-[#0D5C3A] mb-2" />
        উস্তাদ আবাসন তালিকা লোড হচ্ছে...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-xs text-red-800 shadow-sm">
        <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  const students = data?.students || [];

  const filteredStudents = students.filter((st: any) => {
    const matchesSearch =
      st.fullNameBn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.fullNameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.roll?.toString().includes(searchTerm);

    const matchesStatus =
      statusFilter === "ALL" || st.residentialStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESIDENTIAL":
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            আবাসিক (Residential)
          </span>
        );
      case "DAY_CARE":
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
            <Info className="w-3 h-3 text-blue-600" />
            ডে-কেয়ার (Day Care)
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-700 border border-gray-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
            <User className="w-3 h-3 text-gray-500" />
            অনাবাসিক (Non-Res)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Scoped Notice */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#0D5C3A]" />
            <h2 className="text-base font-bold text-gray-900">
              উস্তাদ আবাসন অবলোকন (Teacher Residential View)
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            শিক্ষাদানের সুবিধার্থে নিজ শ্রেণির ছাত্রদের আবাসিক/অনাবাসিক অবস্থা অবলোকন (পঠনযোগ্য অধিকার)।
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>শিক্ষা সহায়ক রিড-অনলি এক্সেস</span>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-[#0D5C3A]">
          <span className="text-[11px] text-gray-500 font-semibold block">মোট ছাত্র</span>
          <span className="text-xl font-bold text-gray-900 block mt-1 font-mono">
            {students.length} জন
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-emerald-600">
          <span className="text-[11px] text-gray-500 font-semibold block">আবাসিক ছাত্র</span>
          <span className="text-xl font-bold text-emerald-700 block mt-1 font-mono">
            {students.filter((s: any) => s.residentialStatus === "RESIDENTIAL").length} জন
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-600">
          <span className="text-[11px] text-gray-500 font-semibold block">ডে-কেয়ার ছাত্র</span>
          <span className="text-xl font-bold text-blue-700 block mt-1 font-mono">
            {students.filter((s: any) => s.residentialStatus === "DAY_CARE").length} জন
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-gray-400">
          <span className="text-[11px] text-gray-500 font-semibold block">অনাবাসিক ছাত্র</span>
          <span className="text-xl font-bold text-gray-700 block mt-1 font-mono">
            {students.filter((s: any) => s.residentialStatus === "NON_RESIDENTIAL").length} জন
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="নাম, রোল বা আইডি দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-semibold">আবাসন ধরণ:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 border border-gray-300 rounded-lg text-xs bg-gray-50 outline-none"
          >
            <option value="ALL">সকল শিক্ষার্থী</option>
            <option value="RESIDENTIAL">শুধুমাত্র আবাসিক</option>
            <option value="DAY_CARE">শুধুমাত্র ডে-কেয়ার</option>
            <option value="NON_RESIDENTIAL">শুধুমাত্র অনাবাসিক</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F8F3] border-b border-gray-200 text-gray-700 font-semibold">
              <tr>
                <th className="p-3">রোল</th>
                <th className="p-3">আইডি</th>
                <th className="p-3">শিক্ষার্থীর নাম</th>
                <th className="p-3">শ্রেণি / জামাত</th>
                <th className="p-3">আবাসন স্ট্যাটাস</th>
                <th className="p-3">ভর্তি / চেক-ইন তারিখ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    কোনো শিক্ষার্থী পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st: any) => (
                  <tr key={st.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-gray-900">{st.roll}</td>
                    <td className="p-3 font-mono text-gray-600">{st.studentId}</td>
                    <td className="p-3 font-semibold text-gray-900">{st.fullNameBn}</td>
                    <td className="p-3 text-gray-700">{st.className}</td>
                    <td className="p-3">{getStatusBadge(st.residentialStatus)}</td>
                    <td className="p-3 font-mono text-gray-600">
                      {st.checkInDate
                        ? new Date(st.checkInDate).toLocaleDateString("bn-BD")
                        : "প্রযোজ্য নয়"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
