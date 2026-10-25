"use client";

import React, { useState, useEffect } from "react";
import { Settings, CheckCircle2, AlertOctagon, Save, ShieldCheck, Zap } from "lucide-react";

export default function DocumentAutomationSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [settings, setSettings] = useState({
    autoIssueIdCardOnAdmission: true,
    autoIssueAdmissionConfirmation: true,
    autoIssueHifzCertificateOnCompletion: true,
    autoIssueMishkatCertificateOnCompletion: true,
    autoIssueDawraCertificateOnCompletion: true,
    autoIssueCharacterCertificate: false,
    autoIssueTestimonial: false,
    autoIssuePratyayan: false,
    autoIssueTC: false,
    authorizedSignatoryTitleBn: "মুহতামিম ও অধ্যক্ষ",
    authorizedSignatoryName: "মাওলানা মহা. আবুল কালাম সরকার",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/documents/automation-settings");
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/documents/automation-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "ডকুমেন্ট অটোমেশন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!" });
      } else {
        setMessage({ type: "error", text: data.error || "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "সংযোগে ত্রুটি।" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
        <div className="w-8 h-8 border-3 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-gray-600">অটোমেশন সেটিংস লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#0D5C3A]" />
            ডকুমেন্ট অটোমেশন ও স্বয়ংক্রিয় ইস্যু কনফিগারেশন (Issuance Automation)
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            মাদরাসার অনুমোদিত প্রাতিষ্ঠানিক ইভেন্টের সাথে স্বয়ংক্রিয়ভাবে কোন কোন সনদপত্র বা ডকুমেন্ট তৈরি হবে তা নির্ধারণ করুন।
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow disabled:opacity-50 shrink-0"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          সেটিংস সংরক্ষণ করুন
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex justify-between items-center shadow-sm ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <span className="flex items-center gap-2 font-medium">
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertOctagon className="w-4 h-4 text-red-600" />}
            {message.text}
          </span>
          <button onClick={() => setMessage(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* Automation Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admission Automations */}
        <div className="border border-gray-200 rounded-2xl p-5 space-y-4 bg-gray-50/50">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0D5C3A]" />
            ভর্তি অনুমোদন ইভেন্ট (Admission Approved)
          </h4>

          <div className="space-y-3">
            <label className="flex items-start justify-between gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-500 transition">
              <div>
                <span className="text-xs font-bold text-gray-900 block">ডিজিটাল স্টুডেন্ট আইডি কার্ড</span>
                <span className="text-[11px] text-gray-500">ভর্তি অনুমোদনের সাথে সাথে স্বয়ংক্রিয়ভাবে প্রস্তুত হবে</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoIssueIdCardOnAdmission}
                onChange={(e) => setSettings({ ...settings, autoIssueIdCardOnAdmission: e.target.checked })}
                className="w-4 h-4 text-[#0D5C3A] rounded border-gray-300 focus:ring-[#0D5C3A] mt-1"
              />
            </label>

            <label className="flex items-start justify-between gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-500 transition">
              <div>
                <span className="text-xs font-bold text-gray-900 block">ভর্তি নিশ্চয়তা ও সনদপত্র</span>
                <span className="text-[11px] text-gray-500">ভর্তি নিশ্চিতকরণ রসিদ ও প্রত্যয়ন স্বয়ংক্রিয় ইস্যু হবে</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoIssueAdmissionConfirmation}
                onChange={(e) => setSettings({ ...settings, autoIssueAdmissionConfirmation: e.target.checked })}
                className="w-4 h-4 text-[#0D5C3A] rounded border-gray-300 focus:ring-[#0D5C3A] mt-1"
              />
            </label>
          </div>
        </div>

        {/* Academic Completion Automations */}
        <div className="border border-gray-200 rounded-2xl p-5 space-y-4 bg-gray-50/50">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#0D5C3A]" />
            একাডেমিক সমাপনী অনুমোদন ইভেন্ট (Completion Approved)
          </h4>

          <div className="space-y-3">
            <label className="flex items-start justify-between gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-500 transition">
              <div>
                <span className="text-xs font-bold text-gray-900 block">হিফজুল কুরআন সমাপনী সনদ</span>
                <span className="text-[11px] text-gray-500">হিফজ সম্পন্ন অনুমোদন হলে সনদ প্রস্তুতযোগ্য হবে</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoIssueHifzCertificateOnCompletion}
                onChange={(e) => setSettings({ ...settings, autoIssueHifzCertificateOnCompletion: e.target.checked })}
                className="w-4 h-4 text-[#0D5C3A] rounded border-gray-300 focus:ring-[#0D5C3A] mt-1"
              />
            </label>

            <label className="flex items-start justify-between gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-500 transition">
              <div>
                <span className="text-xs font-bold text-gray-900 block">মেশকাত সমাপনী সনদ</span>
                <span className="text-[11px] text-gray-500">মেশকাত চূড়ান্ত পরীক্ষা ও সমাপনে সনদ প্রস্তুত হবে</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoIssueMishkatCertificateOnCompletion}
                onChange={(e) => setSettings({ ...settings, autoIssueMishkatCertificateOnCompletion: e.target.checked })}
                className="w-4 h-4 text-[#0D5C3A] rounded border-gray-300 focus:ring-[#0D5C3A] mt-1"
              />
            </label>

            <label className="flex items-start justify-between gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-500 transition">
              <div>
                <span className="text-xs font-bold text-gray-900 block">দাওরায়ে হাদীস সমাপনী মহাসনদ</span>
                <span className="text-[11px] text-gray-500">দাওরা চূড়ান্ত সমাপন অনুমোদনে মহাসনদ প্রস্তুত হবে</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoIssueDawraCertificateOnCompletion}
                onChange={(e) => setSettings({ ...settings, autoIssueDawraCertificateOnCompletion: e.target.checked })}
                className="w-4 h-4 text-[#0D5C3A] rounded border-gray-300 focus:ring-[#0D5C3A] mt-1"
              />
            </label>
          </div>
        </div>

        {/* Manual Institutional Documents (Default OFF) */}
        <div className="border border-gray-200 rounded-2xl p-5 space-y-4 bg-gray-50/50 md:col-span-2">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            প্রাতিষ্ঠানিক প্রত্যয়ন ও সংবেদনশীল সনদ (ম্যানুয়াল অনুমোদন সাপেক্ষে)
          </h4>
          <p className="text-[11px] text-gray-500">
            নিরাপত্তা ও প্রাতিষ্ঠানিক নীতির স্বার্থে এই সনদসমূহ স্বয়ংক্রিয়ভাবে ইস্যু না করে কেবলমাত্র অ্যাডমিনের প্রত্যক্ষ অনুমোদনে ইস্যু করা বাঞ্ছনীয়।
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <label className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-gray-800">চারিত্রিক সনদ</span>
              <input
                type="checkbox"
                checked={settings.autoIssueCharacterCertificate}
                onChange={(e) => setSettings({ ...settings, autoIssueCharacterCertificate: e.target.checked })}
                className="w-4 h-4 text-[#0D5C3A] rounded"
              />
            </label>
            <label className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-gray-800">প্রশংসাপত্র (Testimonial)</span>
              <input
                type="checkbox"
                checked={settings.autoIssueTestimonial}
                onChange={(e) => setSettings({ ...settings, autoIssueTestimonial: e.target.checked })}
                className="w-4 h-4 text-[#0D5C3A] rounded"
              />
            </label>
            <label className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-gray-800">প্রত্যয়নপত্র</span>
              <input
                type="checkbox"
                checked={settings.autoIssuePratyayan}
                onChange={(e) => setSettings({ ...settings, autoIssuePratyayan: e.target.checked })}
                className="w-4 h-4 text-[#0D5C3A] rounded"
              />
            </label>
            <label className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-gray-800">ছাড়পত্র (TC)</span>
              <input
                type="checkbox"
                checked={settings.autoIssueTC}
                onChange={(e) => setSettings({ ...settings, autoIssueTC: e.target.checked })}
                className="w-4 h-4 text-[#0D5C3A] rounded"
              />
            </label>
          </div>
        </div>

        {/* Signatory Defaults */}
        <div className="border border-gray-200 rounded-2xl p-5 space-y-4 bg-gray-50/50 md:col-span-2">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            ডিফল্ট স্বাক্ষরকারী ও পদবি কনফিগারেশন
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">স্বাক্ষরকারীর নাম</label>
              <input
                type="text"
                value={settings.authorizedSignatoryName}
                onChange={(e) => setSettings({ ...settings, authorizedSignatoryName: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">অফিশিয়াল পদবি</label>
              <input
                type="text"
                value={settings.authorizedSignatoryTitleBn}
                onChange={(e) => setSettings({ ...settings, authorizedSignatoryTitleBn: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
