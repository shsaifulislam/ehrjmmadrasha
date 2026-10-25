"use client";

import React, { useState, useEffect } from "react";
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  Search,
  User,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  Users,
  CheckCircle2,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

interface TransportStudentItem {
  id: string;
  startDate: string;
  student: {
    id: string;
    studentIdNumber: string;
    fullNameBn: string;
    fullNameEn?: string | null;
    residentialStatus: string;
    enrollments?: Array<{
      rollNumber: number;
      jamatClass?: { nameBn: string };
      section?: { nameBn: string };
    }>;
  };
  route: {
    id: string;
    routeName: string;
    routeCode: string;
    startPoint: string;
    endPoint: string;
    vehicle?: {
      vehicleNumber: string;
      model?: string | null;
      driver?: {
        name: string;
        phone: string;
      } | null;
    } | null;
  };
}

interface RouteOption {
  id: string;
  routeName: string;
  routeCode: string;
  vehicle?: {
    vehicleNumber: string;
    driver?: {
      name: string;
      phone: string;
    } | null;
  } | null;
}

export default function TeacherTransportViewer() {
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState<TransportStudentItem[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchTransportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = selectedRouteId && selectedRouteId !== "ALL"
        ? `/api/teacher/transport?routeId=${selectedRouteId}`
        : "/api/teacher/transport";

      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) {
        setRoster(json.roster || []);
        if (json.routes) setRoutes(json.routes);
      } else {
        setError(json.error || "পরিবহন রোস্টার লোড করতে ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগে ত্রুটি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportData();
  }, [selectedRouteId]);

  const filteredRoster = roster.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const s = item.student;
    return (
      s.fullNameBn.toLowerCase().includes(q) ||
      s.studentIdNumber.toLowerCase().includes(q) ||
      item.route.routeName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold mb-1.5">
            <Bus className="w-3.5 h-3.5 text-[#0D5C3A]" />
            <span>মাদরাসা পরিবহন সেবা ও শিক্ষার্থী রোস্টার</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
            শিক্ষার্থী পরিবহন সমন্বয় ও বাসরুট
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            যে সকল শিক্ষার্থী নিয়মিত মাদরাসার বাস ও মাইক্রোবাসে যাতায়াত করে তাদের জামাত, রুট এবং চালকের সরাসরি তথ্য।
          </p>
        </div>

        <button
          onClick={fetchTransportData}
          disabled={loading}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition self-start sm:self-center"
          title="রিফ্রেশ করুন"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">মোট পরিবহন শিক্ষার্থী</span>
            <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
              {roster.length} জন
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">সক্রিয় পরিবহন রুট</span>
            <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
              {routes.length} টি রুট
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center border border-emerald-200">
            <Bus className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">পরিবহন হেল্পলাইন</span>
            <a
              href={`tel:${INSTITUTION_INFO.primaryPhone}`}
              className="text-sm font-black text-emerald-800 hover:underline mt-0.5 block"
            >
              {INSTITUTION_INFO.primaryPhone}
            </a>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Phone className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="শিক্ষার্থীর নাম, আইডি বা রুট খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">রুট নির্বাচন:</span>
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-white font-semibold text-slate-700"
          >
            <option value="ALL">সকল রুট ({roster.length} জন)</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.routeName} ({r.routeCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          পরিবহন শিক্ষার্থী তালিকা লোড হচ্ছে...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredRoster.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 space-y-2">
          <Bus className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-sm text-slate-700">কোনো পরিবহন শিক্ষার্থী পাওয়া যায়নি</p>
          <p className="text-xs text-slate-500">অন্যান্য ফিল্টার নির্বাচন করুন বা অনুসন্ধান শব্দ পরিবর্তন করুন।</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3.5">শিক্ষার্থীর তথ্য</th>
                <th className="p-3.5">জামাত ও শাখা</th>
                <th className="p-3.5">রুট ও গন্তব্য</th>
                <th className="p-3.5">গাড়ি নম্বর</th>
                <th className="p-3.5">চালকের যোগাযোগ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoster.map((item) => {
                const s = item.student;
                const en = s.enrollments?.[0];
                const driver = item.route.vehicle?.driver;

                return (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{s.fullNameBn}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        আইডি: {s.studentIdNumber} • রোল: {en?.rollNumber || "১"}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">
                        {en?.jamatClass?.nameBn || "N/A"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {en?.section?.nameBn || "সাধারণ শাখা"}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-[#0D5C3A] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>{item.route.routeName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.route.startPoint} ➔ {item.route.endPoint}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.route.vehicle?.vehicleNumber || "মাদরাসা মাইক্রো"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {driver ? (
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold text-slate-900">{driver.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{driver.phone}</div>
                          </div>
                          <a
                            href={`tel:${driver.phone}`}
                            className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition"
                            title="সরাসরি কল করুন"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">নির্ধারিত নেই</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
