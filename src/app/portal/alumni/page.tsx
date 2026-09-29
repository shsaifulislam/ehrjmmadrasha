"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  User,
  Shield,
  Users,
  BookOpen,
  HandHeart,
  HeartHandshake,
  CheckCircle2,
  Clock,
  Save,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  MapPin,
  Briefcase,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { AlumniProfile, AlumniGroup, AlumniVolunteerOpportunity } from "@/lib/alumni/types";

export default function AlumniPortalPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "profile" | "privacy" | "groups" | "mentorship" | "volunteering" | "contributions"
  >("profile");

  // Profile form state
  const [editForm, setEditForm] = useState<any>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Group join state
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);

  // Volunteer apply state
  const [applyingOpportunity, setApplyingOpportunity] = useState<string | null>(null);

  const fetchPortalData = () => {
    setLoading(true);
    fetch("/api/portal/alumni")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.isRegistered) {
          setData(resData);
          setEditForm({
            currentProfession: resData.profile.currentProfession || "",
            currentOrganization: resData.profile.currentOrganization || "",
            currentCity: resData.profile.currentCity || "",
            currentCountry: resData.profile.currentCountry || "Bangladesh",
            bioBn: resData.profile.bioBn || "",
            bioEn: resData.profile.bioEn || "",
            skills: (resData.profile.skills || []).join(", "),
            linkedin: resData.profile.socialLinks?.linkedin || "",
            facebook: resData.profile.socialLinks?.facebook || "",
            privacyPreferences: resData.profile.privacyPreferences || {
              showInPublicDirectory: true,
              allowDirectContact: false,
              sharePhoneWithApprovedAlumni: false,
              shareEmailWithApprovedAlumni: false,
              allowMentorshipRequests: true,
            },
          });
        } else {
          setData(resData);
        }
      })
      .catch((err) => console.error("Error loading alumni portal:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const skillsArray = editForm.skills
        ? editForm.skills
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

      const res = await fetch("/api/portal/alumni", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentProfession: editForm.currentProfession,
          currentOrganization: editForm.currentOrganization,
          currentCity: editForm.currentCity,
          currentCountry: editForm.currentCountry,
          bioBn: editForm.bioBn,
          bioEn: editForm.bioEn,
          skills: skillsArray,
          socialLinks: {
            linkedin: editForm.linkedin,
            facebook: editForm.facebook,
          },
          privacyPreferences: editForm.privacyPreferences,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setSaveMessage("প্রোফাইল তথ্য সফলভাবে হালনাগাদ করা হয়েছে।");
        fetchPortalData();
      } else {
        setSaveError(resData.error || "আপডেট ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setSaveError(err.message || "নেটওয়ার্ক ত্রুটি ঘটেছে।");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!data?.profile?.id) return;
    setJoiningGroup(groupId);
    try {
      const res = await fetch("/api/alumni/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "JOIN",
          alumniId: data.profile.id,
          groupId,
          note: "Self request from Alumni Portal",
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        fetchPortalData();
      } else {
        alert(resJson.error || "যুক্ত হতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      alert("নেটওয়ার্ক সমস্যা");
    } finally {
      setJoiningGroup(null);
    }
  };

  const handleApplyVolunteer = async (opportunityId: string) => {
    if (!data?.profile?.id) return;
    setApplyingOpportunity(opportunityId);
    try {
      const res = await fetch("/api/alumni/volunteering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPLY",
          alumniId: data.profile.id,
          opportunityId,
          statementOfIntent: "Portal volunteer submission",
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        fetchPortalData();
      } else {
        alert(resJson.error || "আবেদন ব্যর্থ হয়েছে");
      }
    } catch (err) {
      alert("নেটওয়ার্ক সমস্যা");
    } finally {
      setApplyingOpportunity(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-600">অ্যালামনাই পোর্টাল প্রস্তুত হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!data?.isRegistered) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
          <GraduationCap className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-serif text-slate-800">
            অ্যালামনাই নিবন্ধন পাওয়া যায়নি
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            বর্তমান একাউন্টের সাথে কোনো অনুমোদিত প্রাক্তন ছাত্র রেকর্ড সংযুক্ত নেই।
            আপনি যদি ইলিয়টগঞ্জ মাদরাসার প্রাক্তন শিক্ষার্থী হয়ে থাকেন, তবে অনুগ্রহ করে নিবন্ধন ফরম পূরণ করুন অথবা পাবলিক ডিরেক্টরি ব্রাউজ করুন।
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/alumni/directory"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
            >
              ডিরেক্টরি ও নিবন্ধন পৃষ্ঠায় যান
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const profile: AlumniProfile = data.profile;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border-b border-emerald-800/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-lg border border-emerald-400/30">
              {profile.fullNameBn.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold font-serif text-white">
                  {profile.fullNameBn}
                </h1>
                {profile.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> যাচাইকৃত
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <Clock className="w-3.5 h-3.5" /> প্রক্রিয়াধীন
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                আইডি: <span className="font-mono">{profile.studentId}</span> • ব্যাচ: {profile.passOutYear} • বিভাগ: {profile.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/alumni/directory"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center gap-1.5"
            >
              পাবলিক ডিরেক্টরি <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "profile"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <User className="w-4 h-4" /> প্রোফাইল তথ্য
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "privacy"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Shield className="w-4 h-4" /> গোপনীয়তা সেটিংস
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "groups"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Users className="w-4 h-4" /> ব্যাচ ও গ্রুপ ({data?.groups?.joined?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("mentorship")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "mentorship"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" /> মেন্টরশিপ
          </button>
          <button
            onClick={() => setActiveTab("volunteering")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "volunteering"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <HandHeart className="w-4 h-4" /> সমাজসেবা ও খেদমত
          </button>
          <button
            onClick={() => setActiveTab("contributions")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "contributions"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <HeartHandshake className="w-4 h-4" /> অনুদান ও ফান্ড
          </button>
        </div>

        {/* Tab 1: Profile */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold font-serif text-slate-900 mb-1">
                প্রোফাইল তথ্য সম্পাদনা
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                স্ব-ঘোষিত তথ্য হালনাগাদ করুন। প্রাতিষ্ঠানিক শিক্ষাবর্ষ ও সনদ অপরিবর্তনযোগ্য।
              </p>

              {saveMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {saveMessage}
                </div>
              )}
              {saveError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  {saveError}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      বর্তমান পেশা / পদবি
                    </label>
                    <input
                      type="text"
                      value={editForm.currentProfession || ""}
                      onChange={(e) => setEditForm({ ...editForm, currentProfession: e.target.value })}
                      placeholder="যেমন: মুহাদ্দিস, সফটওয়্যার ইঞ্জিনিয়ার, ব্যবসায়ী"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      প্রতিষ্ঠান / কর্মস্থল
                    </label>
                    <input
                      type="text"
                      value={editForm.currentOrganization || ""}
                      onChange={(e) => setEditForm({ ...editForm, currentOrganization: e.target.value })}
                      placeholder="যেমন: আল-জামিয়া, রহিম ট্রেডার্স ইত্যাদি"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      বর্তমান শহর
                    </label>
                    <input
                      type="text"
                      value={editForm.currentCity || ""}
                      onChange={(e) => setEditForm({ ...editForm, currentCity: e.target.value })}
                      placeholder="যেমন: ঢাকা / কুমিল্লা"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      দেশ
                    </label>
                    <input
                      type="text"
                      value={editForm.currentCountry || ""}
                      onChange={(e) => setEditForm({ ...editForm, currentCountry: e.target.value })}
                      placeholder="Bangladesh"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    দক্ষতা ও পারদর্শিতা (কমা দিয়ে লিখুন)
                  </label>
                  <input
                    type="text"
                    value={editForm.skills || ""}
                    onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                    placeholder="হাদিস শাস্ত্র, তাজবীদ, ক্যালিগ্রাফি, আরবি বক্তৃতা, নেতৃত্ব"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সংক্ষিপ্ত পরিচিতি ও বক্তব্য (বাংলা)
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.bioBn || ""}
                    onChange={(e) => setEditForm({ ...editForm, bioBn: e.target.value })}
                    placeholder="মাদরাসায় আপনার দিনগুলি ও বর্তমান কর্মকাণ্ড..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      লিংকডইন প্রোফাইল লিংক
                    </label>
                    <input
                      type="url"
                      value={editForm.linkedin || ""}
                      onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ফেসবুক প্রোফাইল লিংক
                    </label>
                    <input
                      type="url"
                      value={editForm.facebook || ""}
                      onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                      placeholder="https://facebook.com/username"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingProfile ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
                  </button>
                </div>
              </form>
            </div>

            {/* Authoritative Institutional Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" /> প্রাতিষ্ঠানিক তথ্য (Authoritative)
                </h3>
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">শিক্ষার্থী আইডি:</span>
                    <span className="font-mono font-bold text-slate-800">{profile.studentId}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">পাসিং ব্যাচ:</span>
                    <span className="font-bold text-slate-800">{profile.passOutYear} খ্রি.</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">বিভাগ:</span>
                    <span className="font-bold text-slate-800">{profile.department}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">যাচাইকরণ অবস্থা:</span>
                    <span className="font-bold text-emerald-700">{profile.status}</span>
                  </div>
                  {profile.isLegacy && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 mt-2">
                      ঐতিহাসিক শিক্ষার্থী রেকর্ড: {profile.legacySourceNote || "নথি দ্বারা অন্তর্ভুক্ত"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Privacy */}
        {activeTab === "privacy" && (
          <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold font-serif text-slate-900 mb-1">
              গোপনীয়তা ও দৃশ্যমানতা নিয়ন্ত্রণ
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              ডিফল্টভাবে আপনার ব্যক্তিগত যোগাযোগ সম্পূর্ণ সুরক্ষিত রাখা হয়। আপনি চাইলে নির্দিষ্ট তথ্য উন্মুক্ত করতে পারেন।
            </p>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <div className="font-bold text-xs text-slate-800">
                    পাবলিক ডিরেক্টরিতে নাম ও ব্যাচ প্রদর্শন
                  </div>
                  <div className="text-[11px] text-slate-500">
                    সক্ষম থাকলে ডিরেক্টরি সার্চে অন্যান্যরা আপনাকে খুঁজে পাবেন।
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.privacyPreferences?.showInPublicDirectory ?? true}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      privacyPreferences: {
                        ...editForm.privacyPreferences,
                        showInPublicDirectory: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <div className="font-bold text-xs text-slate-800">
                    মোবাইল নম্বর প্রদর্শন
                  </div>
                  <div className="text-[11px] text-slate-500">
                    অনুমোদিত সহপাঠী ও অ্যালামনাই সদস্যদের জন্য ফোন নম্বর দৃশ্যমান থাকবে।
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.privacyPreferences?.sharePhoneWithApprovedAlumni ?? false}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      privacyPreferences: {
                        ...editForm.privacyPreferences,
                        sharePhoneWithApprovedAlumni: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <div className="font-bold text-xs text-slate-800">
                    ইমেইল ঠিকানা প্রদর্শন
                  </div>
                  <div className="text-[11px] text-slate-500">
                    অনুমোদিত সদস্যদের জন্য ইমেইল ঠিকানা দৃশ্যমান থাকবে।
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.privacyPreferences?.shareEmailWithApprovedAlumni ?? false}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      privacyPreferences: {
                        ...editForm.privacyPreferences,
                        shareEmailWithApprovedAlumni: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <div className="font-bold text-xs text-slate-800">
                    ছাত্রদের মেন্টরশিপের অনুরোধ গ্রহণ
                  </div>
                  <div className="text-[11px] text-slate-500">
                    মাদরাসার বর্তমান ছাত্রদের ক্যারিয়ার গাইডেন্স দেওয়ার অনুমতি দিন।
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.privacyPreferences?.allowMentorshipRequests ?? true}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      privacyPreferences: {
                        ...editForm.privacyPreferences,
                        allowMentorshipRequests: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleProfileSubmit}
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  {savingProfile ? "সংরক্ষণ হচ্ছে..." : "গোপনীয়তা সেটিংস সংরক্ষণ করুন"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Groups */}
        {activeTab === "groups" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold font-serif text-slate-900 mb-1">
                প্রাতিষ্ঠানিক ব্যাচ ও চ্যাপ্টার গ্রুপ
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                আপনার ব্যাচ এবং আঞ্চলিক চ্যাপ্টারে যুক্ত থাকুন। কোনো উন্মুক্ত অনিয়ন্ত্রিত আড্ডা নয়, গঠনমূলক প্রাতিষ্ঠানিক যোগাযোগ।
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(data?.groups?.all || []).map((grp: AlumniGroup) => {
                  const membership = (data?.groups?.joined || []).find((m: any) => m.groupId === grp.id);
                  return (
                    <div
                      key={grp.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {grp.type}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{grp.code}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{grp.nameBn}</h4>
                        <p className="text-xs text-slate-500 mt-1">{grp.descriptionBn}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                        {membership ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> সদস্য ({membership.status})
                          </span>
                        ) : (
                          <button
                            onClick={() => handleJoinGroup(grp.id)}
                            disabled={joiningGroup === grp.id}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
                          >
                            {joiningGroup === grp.id ? "যোগদান হচ্ছে..." : "যুক্ত হোন"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Mentorship */}
        {activeTab === "mentorship" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold font-serif text-slate-900 mb-1">
              মেন্টরশিপ ও ক্যারিয়ার নেটওয়ার্ক
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              মাদরাসার অনুজ ছাত্রদের একাডেমিক ও পেশাগত লক্ষ্য অর্জনে সহায়তা করুন।
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">নিয়ন্ত্রিত প্রাতিষ্ঠানিক মেন্টরশিপ নীতি</div>
                  <div className="mt-0.5 text-indigo-800">
                    এখানে কোনো উন্মুক্ত অনিয়ন্ত্রিত চ্যাট নেই। সকল অনুরোধ মাদরাসা কর্তৃপক্ষ যাচাই করে প্রাতিষ্ঠানিক সেশনের মাধ্যমে সংযোগ করিয়ে দেয়।
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-sm text-slate-800 mb-3">আপনার নিকট আসা মেন্টরশিপ অনুরোধ</h3>
                {(data?.mentorship?.requests || []).length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-xl">
                    বর্তমানে কোনো অপেক্ষমাণ অনুরোধ নেই।
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.mentorship.requests.map((req: any) => (
                      <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-800">বিষয়: {req.topic}</span>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">
                            {req.status}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">লক্ষ্য: {req.goalsNote}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Volunteering */}
        {activeTab === "volunteering" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold font-serif text-slate-900 mb-1">
              স্বেচ্ছাসেবী সুযোগ ও খেদমত
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              বার্ষিক মাহফিল, দস্তারবন্দী সম্মেলন ও ক্যাম্প সমূহে খেদমতের জন্য আবেদন করুন।
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(data?.volunteering?.opportunities || []).map((opp: AlumniVolunteerOpportunity) => {
                const applied = (data?.volunteering?.applications || []).find((a: any) => a.opportunityId === opp.id);
                return (
                  <div key={opp.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {opp.category}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">{opp.status}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{opp.titleBn}</h4>
                      <p className="text-xs text-slate-600 mt-1">{opp.descriptionBn}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                      {applied ? (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> আবেদন করা হয়েছে ({applied.status})
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApplyVolunteer(opp.id)}
                          disabled={applyingOpportunity === opp.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                        >
                          {applyingOpportunity === opp.id ? "জমা হচ্ছে..." : "স্বেচ্ছাসেবক আবেদন"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 6: Contributions */}
        {activeTab === "contributions" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold font-serif text-slate-900 mb-1">
              মাদরাসা ফান্ড ও অনুদান হিসেব
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              আপনার আর্থিক ও সেবামূলক অবদানের তালিকা। সকল আর্থিক অনুদান মাদরাসার মূল ফান্ড খাতের সাথে যুক্ত।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="text-xs text-emerald-700 font-semibold">মোট আর্থিক অনুদান</div>
                <div className="text-2xl font-black text-emerald-900 mt-1">
                  ৳ {(data?.contributions?.summary?.totalFinancialAmount || 0).toLocaleString()} BDT
                </div>
              </div>
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl">
                <div className="text-xs text-teal-700 font-semibold">মোট অবদানের সংখ্যা</div>
                <div className="text-2xl font-black text-teal-900 mt-1">
                  {data?.contributions?.summary?.totalCount || 0} টি
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5">তারিখ</th>
                    <th className="py-2.5">খাত / ফান্ড</th>
                    <th className="py-2.5">পরিমাণ</th>
                    <th className="py-2.5">উদ্দেশ্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.contributions?.list || []).map((c: any) => (
                    <tr key={c.id}>
                      <td className="py-2.5 text-slate-600">
                        {new Date(c.contributionDate).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="py-2.5 font-bold text-slate-800">{c.fund || "IN_KIND"}</td>
                      <td className="py-2.5 font-bold text-emerald-700">
                        {c.type === "FINANCIAL" ? `৳ ${c.amount} ${c.currency}` : "সেবামূলক"}
                      </td>
                      <td className="py-2.5 text-slate-600">{c.purposeBn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
