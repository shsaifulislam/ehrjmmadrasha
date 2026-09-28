"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  RefreshCw,
  QrCode,
  Tag,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface AssignedAsset {
  id: string;
  assetCode: string;
  serialNumber?: string | null;
  status: string;
  condition: string;
  warrantyExpiry?: string | null;
  verificationToken?: string | null;
  item: {
    nameBn: string;
    nameEn: string;
    itemCode: string;
    unit: string;
    category: {
      nameBn: string;
      nameEn: string;
    };
  };
  location?: {
    name: string;
  } | null;
  assignments: Array<{
    id: string;
    department?: string | null;
    startDate: string;
    notes?: string | null;
  }>;
}

export default function TeacherInventoryViewer() {
  const [assets, setAssets] = useState<AssignedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCondition, setFilterCondition] = useState("ALL");
  const [selectedAsset, setSelectedAsset] = useState<AssignedAsset | null>(null);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/inventory/assets");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "সম্পদের তালিকা আনতে ব্যর্থ হয়েছে");
      setAssets(json.assets || []);
    } catch (err: any) {
      setError(err.message || "ত্রুটি ঘটেছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.assetCode.toLowerCase().includes(search.toLowerCase()) ||
      asset.item.nameBn.toLowerCase().includes(search.toLowerCase()) ||
      asset.item.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      (asset.serialNumber && asset.serialNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesCondition = filterCondition === "ALL" || asset.condition === filterCondition;
    return matchesSearch && matchesCondition;
  });

  const getConditionBadge = (c: string) => {
    switch (c) {
      case "NEW":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">নবায়নকৃত / নতুন</span>;
      case "GOOD":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">ভালো কার্যক্ষম</span>;
      case "FAIR":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">চলনসই</span>;
      case "DAMAGED":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800">ক্ষতিগ্রস্ত</span>;
      case "REPAIR_REQUIRED":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">মেরামত প্রয়োজন</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">{c}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#083B25] to-[#0D5C3A] text-white rounded-xl p-6 shadow-md border-l-4 border-[#C59B27] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Boxes className="w-6 h-6 text-[#C59B27]" />
            <h2 className="text-xl font-bold font-display">বরাদ্দকৃত প্রতিষ্ঠানিক সরঞ্জাম ও সম্পদ</h2>
          </div>
          <p className="text-xs text-emerald-100">
            আপনার দায়িত্বে অর্পিত বা শ্রেণিকক্ষে ব্যবহারের জন্য নির্ধারিত সামগ্রীর সঠিক বিবরণ ও অবস্থা পর্যবেক্ষণ করুন
          </p>
        </div>
        <button
          onClick={fetchAssets}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          রিফ্রেশ
        </button>
      </div>

      {/* Info notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold mb-0.5">উস্তাদ সম্পদ নীতিমালা ও হেফাজত নির্দেশনা</h4>
          <p className="text-blue-800 leading-relaxed">
            মাদরাসার সকল সম্পদ আমানতস্বরূপ। যেকোনো ত্রুটি বা মেরামত প্রয়োজন হলে দ্রুত অফিস বা অ্যাডমিন শাখাকে অবহিত করুন। কোনো সামগ্রী স্থানান্তর বা হস্তান্তর করতে অ্যাডমিন অনুমোদন প্রয়োজন।
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="সম্পদের নাম, কোড বা সিরিয়াল খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">অবস্থা:</span>
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-white w-full sm:w-auto"
          >
            <option value="ALL">সকল অবস্থা</option>
            <option value="NEW">নতুন</option>
            <option value="GOOD">ভালো কার্যক্ষম</option>
            <option value="FAIR">চলনসই</option>
            <option value="DAMAGED">ক্ষতিগ্রস্ত</option>
            <option value="REPAIR_REQUIRED">মেরামত প্রয়োজন</option>
          </select>
        </div>
      </div>

      {/* Assets Grid / List */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-[#0D5C3A] animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">সম্পদের তালিকা লোড হচ্ছে...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-xl border border-red-200 p-6">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <button
            onClick={fetchAssets}
            className="mt-3 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-4 py-1.5 rounded-lg font-bold"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <Laptop className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">কোনো বরাদ্দকৃত সরঞ্জাম পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            আপনার অ্যাকাউন্টে বর্তমানে কোনো সরঞ্জাম বরাদ্দ নেই অথবা অনুসন্ধানের তথ্যের সাথে মিল পাওয়া যায়নি।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-[#0D5C3A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {asset.assetCode}
                  </span>
                  {getConditionBadge(asset.condition)}
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-1">{asset.item.nameBn}</h3>
                <p className="text-xs text-slate-500 font-medium mb-3">{asset.item.nameEn}</p>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>ক্যাটেগরি: <strong>{asset.item.category.nameBn}</strong></span>
                  </div>
                  {asset.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>অবস্থান: <strong>{asset.location.name}</strong></span>
                    </div>
                  )}
                  {asset.serialNumber && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-slate-400">সিরিয়াল:</span>
                      <span className="text-slate-700">{asset.serialNumber}</span>
                    </div>
                  )}
                  {asset.warrantyExpiry && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>ওয়ারেন্টি মেয়াদ: {new Date(asset.warrantyExpiry).toLocaleDateString("bn-BD")}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  স্ট্যাটাস: <strong className="text-slate-800">{asset.status}</strong>
                </span>
                {asset.verificationToken && (
                  <Link
                    href={`/inventory/verify/asset/${asset.verificationToken}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] text-[#0D5C3A] hover:underline font-bold"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    যাচাই কার্ড
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
