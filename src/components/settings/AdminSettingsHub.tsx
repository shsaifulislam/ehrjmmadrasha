"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  Shield,
  CreditCard,
  Bell,
  HardDrive,
  Activity,
  FileText,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Mail,
  UserCheck,
  Calendar,
  Layers,
} from "lucide-react";
import AdmissionControlConsole from "./AdmissionControlConsole";
import PaymentMethodsConsole from "./PaymentMethodsConsole";

export default function AdminSettingsHub() {
  const [activeSubTab, setActiveSubTab] = useState<
    "SITE" | "BRANDING" | "ACADEMIC" | "FINANCE" | "COMMUNICATION" | "SECURITY" | "BACKUP" | "AUDIT"
  >("SITE");
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSettings = () => {
    setLoading(true);
    fetch("/api/admin/settings")
      .then((res) => {
        if (!res.ok) throw new Error("সেটিংস লোড ব্যর্থ হয়েছে");
        return res.json();
      })
      .then((data) => {
        if (data?.settings) setSettings(data.settings);
      })
      .catch((err) => {
        setErrorMsg(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureUrl: settings?.branding?.signatureUrl,
          attendanceCorrectionWindowHours: settings?.academic?.attendanceCorrectionWindowHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে");
      setSuccessMsg(data.message || "সেটিংস সফলভাবে সংরক্ষিত হয়েছে।");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
        <div className="w-8 h-8 border-4 border-[#083B25] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-gray-600">প্রাতিষ্ঠানিক সিস্টেম সেটিংস লোড করা হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#083B25] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#C59B27]" />
            সেন্ট্রাল সিস্টেম ও প্রাতিষ্ঠানিক গভর্ন্যান্স সেটিংস
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সমন্বিত নীতি, নিরাপত্তা ও প্রাতিষ্ঠানিক পরামিতি কনফিগারেশন।
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSettings}
            disabled={loading}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Sub Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1.5 shadow-sm flex items-center gap-1 overflow-x-auto text-xs font-semibold">
        {[
          { id: "SITE", label: "প্রতিষ্ঠান পরিচিতি", icon: Building },
          { id: "BRANDING", label: "ব্র্যান্ডিং ও সিলমোহর", icon: Layers },
          { id: "ACADEMIC", label: "অ্যাকাডেমিক নীতি", icon: Calendar },
          { id: "FINANCE", label: "৫ তহবিল ও ফি নীতি", icon: CreditCard },
          { id: "COMMUNICATION", label: "যোগাযোগ চ্যানেল", icon: Bell },
          { id: "SECURITY", label: "নিরাপত্তা ও সেশন", icon: Shield },
          { id: "BACKUP", label: "ব্যাকআপ ও রিকভারি", icon: HardDrive },
          { id: "AUDIT", label: "অডিট ট্রেইল", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
                isActive
                  ? "bg-[#083B25] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. SITE SETTINGS */}
      {activeSubTab === "SITE" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-[#083B25] border-b pb-2 flex items-center gap-2">
            <Building className="w-4 h-4 text-[#C59B27]" />
            প্রাতিষ্ঠানিক তথ্যাবলী ও যোগাযোগ ঠিকানা
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <span className="text-gray-500 block mb-0.5 font-medium">প্রতিষ্ঠানের নাম (বাংলা):</span>
              <span className="font-bold text-gray-900 text-sm">{settings?.site?.nameBn}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <span className="text-gray-500 block mb-0.5 font-medium">প্রতিষ্ঠানের নাম (ইংরেজি):</span>
              <span className="font-bold text-gray-900 text-sm">{settings?.site?.nameEn}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <span className="text-gray-500 block mb-0.5 font-medium">প্রতিষ্ঠানের নাম (আরবি):</span>
              <span className="font-bold text-gray-900 text-sm font-serif" dir="rtl">
                {settings?.site?.nameAr}
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <span className="text-gray-500 block mb-0.5 font-medium">প্রতিষ্ঠাতা ও মুহতামিম:</span>
              <span className="font-bold text-emerald-800 text-sm">{settings?.site?.principal}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <span className="text-gray-500 block mb-0.5 font-medium">প্রতিষ্ঠা সাল:</span>
              <span className="font-bold text-gray-900">{settings?.site?.establishedYear} খ্রিস্টাব্দ</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <span className="text-gray-500 block mb-0.5 font-medium">অফিশিয়াল সাপোর্ট ইমেইল:</span>
              <span className="font-bold text-gray-900 font-mono">{settings?.site?.email}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <span className="text-gray-500 block mb-0.5 font-medium">অফিশিয়াল ডোমেইন ও লাইভ পোর্টাল:</span>
              <a
                href={settings?.site?.publicDomain || "https://www.ehrjmadrasha.com"}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-emerald-800 font-mono hover:underline"
              >
                {settings?.site?.domain || "www.ehrjmadrasha.com"}
              </a>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border md:col-span-2">
              <span className="text-gray-500 block mb-0.5 font-medium">ক্যাম্পাস অবস্থান ও ঠিকানা:</span>
              <span className="font-bold text-gray-900">{settings?.site?.address}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border md:col-span-2">
              <span className="text-gray-500 block mb-0.5 font-medium">প্রাতিষ্ঠানিক হেল্পলাইন ফোন নম্বরসমূহ:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {settings?.site?.phones?.map((p: string, i: number) => (
                  <span key={i} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded font-mono font-semibold">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BRANDING SETTINGS */}
      {activeSubTab === "BRANDING" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-[#083B25] border-b pb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C59B27]" />
            প্রাতিষ্ঠানিক ব্র্যান্ডিং, লোগো ও ডিজিটাল সিলমোহর
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-gray-50 rounded-xl border text-center space-y-2">
              <div className="text-gray-600 font-semibold">প্রাতিষ্ঠানিক মনোগ্রাম / লোগো</div>
              <div className="w-20 h-20 bg-white border-2 border-emerald-800 rounded-full mx-auto flex items-center justify-center overflow-hidden shadow-sm">
                <img src={settings?.branding?.logoUrl || "/images/logo.png"} alt="Logo" className="w-16 h-16 object-contain" />
              </div>
              <span className="text-[11px] text-gray-500 block">অনুমোদিত ডিজিটাল ক্রেস্ট</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border text-center space-y-2">
              <div className="text-gray-600 font-semibold">মুহতামিমের অফিসিয়াল স্বাক্ষর</div>
              <div className="h-20 bg-white border border-dashed border-gray-300 rounded-lg flex items-center justify-center px-2">
                {settings?.branding?.signatureUrl ? (
                  <img src={settings?.branding?.signatureUrl} alt="Signature" className="max-h-16 object-contain" />
                ) : (
                  <span className="text-gray-400 italic text-[11px]">স্বাক্ষর সংরক্ষিত রয়েছে</span>
                )}
              </div>
              <span className="text-[11px] text-gray-500 block">সনদপত্র ও রশিদে স্বয়ংক্রিয় সংযুক্তি</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border text-center space-y-2">
              <div className="text-gray-600 font-semibold">প্রাতিষ্ঠানিক কালার প্যালেট</div>
              <div className="flex justify-center items-center gap-3 pt-4">
                <div className="w-10 h-10 rounded-lg bg-[#083B25] border shadow text-[9px] text-white flex items-center justify-center font-bold">
                  #083B25
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#C59B27] border shadow text-[9px] text-emerald-950 flex items-center justify-center font-bold">
                  #C59B27
                </div>
              </div>
              <span className="text-[11px] text-gray-500 block">ঐতিহ্যবাহী গাঢ় সবুজ ও সোনালী</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACADEMIC SETTINGS */}
      {activeSubTab === "ACADEMIC" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-[#083B25] border-b pb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C59B27]" />
            অ্যাকাডেমিক শিক্ষাবর্ষ ও পাঠদান কনফিগারেশন
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-emerald-800 font-semibold block">বর্তমান সক্রিয় শিক্ষাবর্ষ:</span>
              <span className="text-lg font-bold text-emerald-950">{settings?.academic?.currentSessionName} শিক্ষাবর্ষ</span>
            </div>
            <div className="p-3 bg-gray-50 border rounded-lg">
              <span className="text-gray-600 font-semibold block">অনুমোদিত জামাত/শ্রেণি সংখ্যা:</span>
              <span className="text-lg font-bold text-gray-900">{settings?.academic?.classesCount} টি সক্রিয় জামাত</span>
            </div>
            <div className="p-3 bg-gray-50 border rounded-lg">
              <span className="text-gray-600 font-semibold block">দৈনিক হাজিরা সংশোধন উইন্ডো:</span>
              <span className="text-lg font-bold text-gray-900">{settings?.academic?.attendanceCorrectionWindowHours} ঘণ্টা</span>
              <span className="text-[11px] text-gray-500 block mt-0.5">নির্ধারিত সময়ের পর হাজিরা লক হয়ে যায়।</span>
            </div>
            <div className="p-3 bg-gray-50 border rounded-lg">
              <span className="text-gray-600 font-semibold block">অ্যাকাডেমিক সেশন স্থিতি:</span>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                সক্রিয় ও চলমান (UNLOCKED)
              </span>
            </div>
          </div>

          {/* Admission On/Off Control Console */}
          <AdmissionControlConsole />
        </div>
      )}

      {/* 4. FINANCE SETTINGS */}
      {activeSubTab === "FINANCE" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-[#083B25] border-b pb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#C59B27]" />
            অনুমোদিত ৫ ফান্ড ও পেমেন্ট গেটওয়ে পলিসি
          </h3>

          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-700">অনুমোদিত ৫টি স্বতন্ত্র তহবিল স্থিতি:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {settings?.finance?.approvedFunds?.map((f: any) => (
                <div key={f.code} className="p-3 bg-gray-50 border rounded-lg text-xs space-y-1">
                  <div className="font-bold text-emerald-900">{f.nameBn}</div>
                  <div className="text-[11px] font-mono text-gray-500">কোড: {f.code}</div>
                  <div className="text-sm font-bold text-emerald-700">৳ {f.currentBalance.toLocaleString("bn-BD")}</div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1 mt-3">
              <div className="font-bold text-emerald-900">পেমেন্ট গেটওয়ে ও সিকিউরিটি মোড:</div>
              <div className="text-gray-700">
                প্রোভাইডার: <b>{settings?.finance?.paymentGateway?.provider}</b> | স্থিতি: <b>{settings?.finance?.paymentGateway?.status}</b> | মোড: <b>{settings?.finance?.paymentGateway?.mode}</b>
              </div>
              <div className="text-[11px] text-emerald-800">
                সার্ভার-সাইড পেমেন্ট নির্ধারণ ও অ্যান্টি-ফ্রড ট্রানজাকশন গার্ড সক্রিয়।
              </div>
            </div>
          </div>

          {/* Dynamic Payment Gateways and Methods Manager */}
          <PaymentMethodsConsole />
        </div>
      )}

      {/* 5. COMMUNICATION SETTINGS */}
      {activeSubTab === "COMMUNICATION" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-[#083B25] border-b pb-2 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#C59B27]" />
            যোগাযোগ ও নোটিফিকেশন চ্যানেল নীতিমালা
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  ইন-অ্যাপ / অভিভাবক পোর্টাল চ্যানেল
                </span>
                <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold">সক্রিয়</span>
              </div>
              <p className="text-emerald-800 text-[11px]">
                অভিভাবক, উস্তাদ ও অ্যাডমিন পোর্টালে রিয়েল-টাইম নোটিফিকেশন প্রদান।
              </p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-emerald-700" />
                  অফিশিয়াল প্রাতিষ্ঠানিক ইমেইল
                </span>
                <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold">সক্রিয়</span>
              </div>
              <p className="text-emerald-800 text-[11px]">
                Nodemailer ব্র্যান্ডেড এইচটিএমএল টেমপ্লেট ডেলিভারি।
              </p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-300 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-gray-400" />
                  এসএমএস (SMS Gateway)
                </span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">নিষিদ্ধ / নিষ্ক্রিয়</span>
              </div>
              <p className="text-gray-500 text-[11px]">
                প্রাতিষ্ঠানিক পলিসি ও খরচ রোধে এসএমএস সার্ভিস সম্পূর্ণরূপে নিষিদ্ধ রাখা হয়েছে।
              </p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-300 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-gray-400" />
                  ওটিপি প্রমাণীকরণ (OTP Auth)
                </span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">নিষিদ্ধ / নিষ্ক্রিয়</span>
              </div>
              <p className="text-gray-500 text-[11px]">
                নিরাপদ কুঁকি সেশন আর্কিটেকচার দ্বারা প্রমাণীকরণ নিশ্চিত করা হয়। কোনো ওটিপি প্রয়োজন নেই।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. SECURITY SETTINGS */}
      {activeSubTab === "SECURITY" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-[#083B25] border-b pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#C59B27]" />
            নিরাপত্তা, অ্যাক্সেস কন্ট্রোল ও সেশন স্থিতি
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-gray-50 border rounded-lg">
              <span className="text-gray-500 font-medium block">সেশন মেয়াদ (Session TTL):</span>
              <span className="font-bold text-gray-900 text-sm">{settings?.security?.sessionTtlDays} দিন (Secure HttpOnly Cookie)</span>
            </div>
            <div className="p-3 bg-gray-50 border rounded-lg">
              <span className="text-gray-500 font-medium block">টোকেন এনক্রিপশন অ্যালগরিদম:</span>
              <span className="font-bold text-gray-900 text-sm font-mono">{settings?.security?.tokenAlgorithm}</span>
            </div>
            <div className="p-3 bg-gray-50 border rounded-lg">
              <span className="text-gray-500 font-medium block">বর্তমানে সক্রিয় বৈধ সেশন:</span>
              <span className="font-bold text-emerald-700 text-sm">{settings?.security?.activeSessionsCount} টি ডিভাইস/সেশন</span>
            </div>
            <div className="p-3 bg-gray-50 border rounded-lg">
              <span className="text-gray-500 font-medium block">রেট লিমিটিং গার্ড:</span>
              <span className="font-bold text-gray-900 text-sm">{settings?.security?.rateLimiting}</span>
            </div>
          </div>
        </div>
      )}

      {/* 7. BACKUP & RESTORE */}
      {activeSubTab === "BACKUP" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-[#083B25] border-b pb-2 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#C59B27]" />
            সিস্টেম ডেটাবেজ স্ন্যাপশট ও ব্যাকআপ ইঞ্জিন
          </h3>

          <div className="p-4 bg-gray-50 border rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">সর্বশেষ ব্যাকআপ ফাইল:</span>
              <span className="font-mono bg-white px-2 py-0.5 border rounded">{settings?.backup?.latestBackupFilename}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">ব্যাকআপ অবস্থা:</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {settings?.backup?.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">ইঞ্জিন পদ্ধতি:</span>
              <span className="text-gray-600">{settings?.backup?.backupEngine}</span>
            </div>
          </div>
        </div>
      )}

      {/* 8. AUDIT LOGS */}
      {activeSubTab === "AUDIT" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-[#083B25] border-b pb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#C59B27]" />
            অপরিবর্তনীয় অডিট লগ রেজিস্ট্রি (Immutable Audit Stream)
          </h3>

          <div className="divide-y divide-gray-100 text-xs">
            {settings?.recentAudits?.length > 0 ? (
              settings.recentAudits.map((a: any) => (
                <div key={a.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-900">{a.action}</span>
                    <span className="text-gray-500 ml-2">[{a.entityType}]</span>
                    <div className="text-[11px] text-gray-500">
                      ব্যবহারকারী: {a.user?.name || "সিস্টেম"} ({a.user?.role || "SYSTEM"})
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {new Date(a.createdAt).toLocaleString("bn-BD")}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">কোনো অডিট লগ পাওয়া যায়নি।</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
