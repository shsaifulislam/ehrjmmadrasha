"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutTemplate,
  Globe,
  Calendar,
  HelpCircle,
  Download,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Eye,
  FileText,
  Trash2,
  ArrowLeft,
} from "lucide-react";

type CmsTab = "PROFILE" | "HOMEPAGE" | "EVENTS" | "FAQS" | "DOWNLOADS" | "GALLERY" | "SEO" | "AI_ASSIST";

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<CmsTab>("PROFILE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(true);

  // Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [homepage, setHomepage] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [seo, setSeo] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);

  // AI draft states
  const [aiTask, setAiTask] = useState<"FAQ_DRAFT" | "NOTICE_SUMMARY" | "SEO_META">("FAQ_DRAFT");
  const [aiTopic, setAiTopic] = useState("");
  const [aiDraftResult, setAiDraftResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // New item modal/states
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    titleBn: "",
    titleEn: "",
    descriptionBn: "",
    category: "GENERAL",
    eventDate: new Date().toISOString().split("T")[0],
    startTime: "সকাল ১০:০০",
    endTime: "দুপুর ০১:০০",
    location: "মাদরাসা প্রাঙ্গণ",
    organizer: "মাদরাসা কর্তৃপক্ষ",
    isPublic: true,
  });

  const [showFaqModal, setShowFaqModal] = useState(false);
  const [newFaq, setNewFaq] = useState({
    questionBn: "",
    answerBn: "",
    category: "ADMISSION",
    isApproved: true,
  });

  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [newGallery, setNewGallery] = useState({
    titleBn: "",
    descriptionBn: "",
    imageUrl: "/images/students-class.jpg",
    altText: "",
    category: "CAMPUS",
    consentVerified: true,
    consentReference: "CONSENT-PARENT-2026-VERIFIED",
    isPublic: true,
  });

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [newDownload, setNewDownload] = useState({
    titleBn: "",
    descriptionBn: "",
    category: "ADMISSION",
    fileUrl: "/downloads/sample.pdf",
    fileType: "PDF",
    fileSizeDisplay: "১.০ মেগাবাইট",
    versionString: "২০২৬",
    isPublic: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, eventsRes, faqsRes, downloadsRes, galleryRes] = await Promise.all([
        fetch("/api/admin/content/overview").then((r) => r.json()),
        fetch("/api/admin/content/events").then((r) => r.json()),
        fetch("/api/admin/content/faqs").then((r) => r.json()),
        fetch("/api/admin/content/downloads").then((r) => r.json()),
        fetch("/api/admin/content/gallery").then((r) => r.json()),
      ]);

      if (overviewRes.success) {
        setMetrics(overviewRes.metrics);
        setProfile(overviewRes.profile);
        setHomepage(overviewRes.homepage);
        setSeo(overviewRes.seo);
        setAudits(overviewRes.recentAudits || []);
      }
      if (eventsRes.success) setEvents(eventsRes.events || []);
      if (faqsRes.success) setFaqs(faqsRes.faqs || []);
      if (downloadsRes.success) setDownloads(downloadsRes.downloads || []);
      if (galleryRes.success) setGallery(galleryRes.gallery || []);
    } catch (err) {
      console.error("Failed to load CMS data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/content/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      setIsSuccess(res.ok && data.success);
      setMessage(data.messageBn || "প্রোফাইল সংরক্ষিত হয়েছে।");
      if (res.ok) loadData();
    } catch (err) {
      setIsSuccess(false);
      setMessage("সংরক্ষণ ব্যর্থ হয়েছে।");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHomepage = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/content/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(homepage),
      });
      const data = await res.json();
      setIsSuccess(res.ok && data.success);
      setMessage(data.messageBn || "হোমপেজ সেটিংস সংরক্ষিত হয়েছে।");
      if (res.ok) loadData();
    } catch (err) {
      setIsSuccess(false);
      setMessage("সংরক্ষণ ব্যর্থ হয়েছে।");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSeo = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/content/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seo),
      });
      const data = await res.json();
      setIsSuccess(res.ok && data.success);
      setMessage(data.messageBn || "SEO সেটিংস সংরক্ষিত হয়েছে।");
      if (res.ok) loadData();
    } catch (err) {
      setIsSuccess(false);
      setMessage("সংরক্ষণ ব্যর্থ হয়েছে।");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/content/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowEventModal(false);
        loadData();
      } else {
        alert(data.error || "অনুষ্ঠান তৈরি ব্যর্থ হয়েছে");
      }
    } catch (err) {
      alert("সার্ভার ত্রুটি");
    }
  };

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/content/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFaq),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowFaqModal(false);
        loadData();
      } else {
        alert(data.error || "FAQ তৈরি ব্যর্থ হয়েছে");
      }
    } catch (err) {
      alert("সার্ভার ত্রুটি");
    }
  };

  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/content/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGallery),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowGalleryModal(false);
        loadData();
      } else {
        alert(data.error || "ছবি তৈরি ব্যর্থ হয়েছে");
      }
    } catch (err) {
      alert("সার্ভার ত্রুটি");
    }
  };

  const handleCreateDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/content/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDownload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowDownloadModal(false);
        loadData();
      } else {
        alert(data.error || "নথি তৈরি ব্যর্থ হয়েছে");
      }
    } catch (err) {
      alert("সার্ভার ত্রুটি");
    }
  };

  const handleGenerateAiDraft = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    setAiDraftResult(null);
    try {
      const res = await fetch("/api/admin/content/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: aiTask, topic: aiTopic }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAiDraftResult(data.draft);
      } else {
        alert(data.error || "AI ড্রাফট প্রস্তুত ব্যর্থ হয়েছে");
      }
    } catch (err) {
      alert("সার্ভার সংযোগ সমস্যা");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F3] p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-800 font-semibold">
          <RefreshCw className="w-5 h-5 animate-spin" />
          CMS ও ওয়েবসাইট পোর্টাল ব্যবস্থাপনা লোড হচ্ছে...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      {/* Top Admin Header */}
      <header className="bg-[#083B25] text-white px-6 py-4 border-b-4 border-[#C59B27] flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-gray-300 hover:text-white transition"
            title="মূল অ্যাডমিন প্যানেলে ফিরুন"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#C59B27]" />
              <h1 className="text-lg font-bold">ওয়েবসাইট ও কনটেন্ট ম্যানেজমেন্ট কন্ট্রোল প্যানেল</h1>
            </div>
            <p className="text-[11px] text-emerald-200">
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা • প্রাতিষ্ঠানিক তথ্য ও প্রকাশনা ব্যবস্থাপনা
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 bg-[#C59B27] hover:bg-amber-500 text-[#0B1914] px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow"
          >
            <Eye className="w-4 h-4" />
            লাইভ ওয়েবসাইট দেখুন
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-gray-300 hover:text-white transition"
            title="রিফ্রেশ"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main CMS Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Badges */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[11px] text-gray-500 font-semibold block">প্রকাশিত নোটিশ</span>
              <span className="text-xl font-bold font-mono text-[#083B25]">{metrics.totalNotices}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[11px] text-gray-500 font-semibold block">আসন্ন অনুষ্ঠান</span>
              <span className="text-xl font-bold font-mono text-[#083B25]">{metrics.publishedEvents}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[11px] text-gray-500 font-semibold block">অনুমোদিত FAQ</span>
              <span className="text-xl font-bold font-mono text-[#083B25]">{metrics.approvedFaqs}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[11px] text-gray-500 font-semibold block">পাবলিক ডাউনলোড</span>
              <span className="text-xl font-bold font-mono text-[#083B25]">{metrics.publicDownloads}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[11px] text-gray-500 font-semibold block">সম্মতিযুক্ত গ্যালারি</span>
              <span className="text-xl font-bold font-mono text-[#083B25]">{metrics.consentVerifiedGallery}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/40 shadow-sm">
              <span className="text-[11px] text-emerald-800 font-semibold block">ভর্তি স্ট্যাটাস</span>
              <span className="text-sm font-bold font-mono text-[#0D5C3A] bg-emerald-100 px-2 py-0.5 rounded w-fit block mt-1">
                {metrics.admissionState}
              </span>
            </div>
          </div>
        )}

        {/* Global Feedback Alert */}
        {message && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              isSuccess
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {isSuccess ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {message}
          </div>
        )}

        {/* Tabs Bar */}
        <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-1.5">
          {[
            { id: "PROFILE", label: "প্রাতিষ্ঠানিক প্রোফাইল", icon: Globe },
            { id: "HOMEPAGE", label: "হোমপেজ সেকশন", icon: LayoutTemplate },
            { id: "EVENTS", label: "অনুষ্ঠান (Events)", icon: Calendar },
            { id: "FAQS", label: "প্রশ্নোত্তর (FAQ)", icon: HelpCircle },
            { id: "DOWNLOADS", label: "ডাউনলোড কর্নার", icon: Download },
            { id: "GALLERY", label: "ফটো গ্যালারি", icon: ImageIcon },
            { id: "SEO", label: "SEO ও মেটাডাটা", icon: Sliders },
            { id: "AI_ASSIST", label: "AI খসড়া সহকারী", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as CmsTab);
                  setMessage(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#0D5C3A] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: INSTITUTIONAL PROFILE */}
        {activeTab === "PROFILE" && profile && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-[#083B25]">প্রাতিষ্ঠানিক পরিচয় ও তথ্য</h2>
                <p className="text-xs text-gray-500">মাদরাসার একক প্রামাণ্য পরিচয় যা সমস্ত পেজ ও মেটাতে ব্যবহৃত হয়।</p>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-[#0D5C3A] hover:bg-[#158052] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" />
                {saving ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">বাংলা নাম (লকড)</label>
                <input
                  type="text"
                  disabled
                  value={profile.nameBn}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ইংরেজি নাম (লকড)</label>
                <input
                  type="text"
                  disabled
                  value={profile.nameEn}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">আরবি নাম</label>
                <input
                  type="text"
                  value={profile.nameAr || ""}
                  onChange={(e) => setProfile({ ...profile, nameAr: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-arabic"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">প্রতিষ্ঠার সন</label>
                <input
                  type="text"
                  value={profile.established || "২০২১"}
                  onChange={(e) => setProfile({ ...profile, established: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">প্রতিষ্ঠাতা মুহতামিম ও অধ্যক্ষ</label>
                <input
                  type="text"
                  value={profile.principal || ""}
                  onChange={(e) => setProfile({ ...profile, principal: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">প্রাথমিক মোবাইল নম্বর</label>
                <input
                  type="text"
                  value={profile.primaryPhone || ""}
                  onChange={(e) => setProfile({ ...profile, primaryPhone: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">অফিসিয়াল ইমেইল</label>
                <input
                  type="email"
                  value={profile.email || ""}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ক্যাম্পাসের ঠিকানা (বাংলা)</label>
                <input
                  type="text"
                  value={profile.addressBn || ""}
                  onChange={(e) => setProfile({ ...profile, addressBn: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">মাদরাসার লক্ষ্য ও উদ্দেশ্য (Mission)</label>
              <textarea
                rows={3}
                value={profile.missionBn || ""}
                onChange={(e) => setProfile({ ...profile, missionBn: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
              ></textarea>
            </div>
          </div>
        )}

        {/* TAB 2: HOMEPAGE SECTIONS CONFIG */}
        {activeTab === "HOMEPAGE" && homepage && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-[#083B25]">হোমপেজ সেকশন ও ভর্তি স্ট্যাটাস</h2>
                <p className="text-xs text-gray-500">হোমপেজের সেকশন সক্রিয়/নিষ্ক্রিয় করুন এবং ভর্তি বিজ্ঞপ্তি নির্ধারণ করুন।</p>
              </div>
              <button
                onClick={handleSaveHomepage}
                disabled={saving}
                className="bg-[#0D5C3A] hover:bg-[#158052] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" />
                {saving ? "সংরক্ষণ হচ্ছে..." : "হোমপেজ সেটিংস সংরক্ষণ করুন"}
              </button>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
              <h3 className="font-bold text-xs text-[#083B25]">ভর্তি আবেদন স্ট্যাটাস কনফিগারেশন</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ভর্তি অবস্থা</label>
                  <select
                    value={homepage.admissionState}
                    onChange={(e) => setHomepage({ ...homepage, admissionState: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white font-semibold"
                  >
                    <option value="OPEN">ভর্তি চলছে (OPEN)</option>
                    <option value="UPCOMING">আসন্ন শিক্ষাবর্ষে শুরু হবে (UPCOMING)</option>
                    <option value="CLOSED">ভর্তি বন্ধ (CLOSED)</option>
                    <option value="WAITLIST">অপেক্ষমাণ তালিকা (WAITLIST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ভর্তি ব্যানার ঘোষণা বার্তা</label>
                  <input
                    type="text"
                    value={homepage.admissionAnnouncementBn || ""}
                    onChange={(e) => setHomepage({ ...homepage, admissionAnnouncementBn: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-xs text-gray-800">হোমপেজ সেকশন তালিকা</h3>
              <div className="space-y-2">
                {homepage.sections.map((sec: any, idx: number) => (
                  <div
                    key={sec.id}
                    className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-xs text-gray-900 block">{sec.titleBn}</span>
                        <span className="text-[11px] font-mono text-gray-400">ID: {sec.id}</span>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sec.enabled}
                        onChange={(e) => {
                          const updatedSecs = [...homepage.sections];
                          updatedSecs[idx].enabled = e.target.checked;
                          setHomepage({ ...homepage, sections: updatedSecs });
                        }}
                        className="w-4 h-4 text-[#0D5C3A] rounded border-gray-300 focus:ring-[#0D5C3A]"
                      />
                      <span className="text-xs font-semibold text-gray-700">
                        {sec.enabled ? "সক্রিয়" : "বন্ধ"}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EVENTS */}
        {activeTab === "EVENTS" && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-[#083B25]">অনুষ্ঠান ও মাহফিল ব্যবস্থাপনা (Events)</h2>
                <p className="text-xs text-gray-500">আসন্ন মাহফিল, পরীক্ষা বা সম্মেলনের বিবরণী যুক্ত ও প্রকাশ করুন।</p>
              </div>
              <button
                onClick={() => setShowEventModal(true)}
                className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                নতুন অনুষ্ঠান যোগ করুন
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((evt) => (
                <div key={evt.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      {evt.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        evt.isPublic ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {evt.isPublic ? "প্রকাশিত (Public)" : "খসড়া (Draft)"}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#083B25]">{evt.titleBn}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2">{evt.descriptionBn}</p>
                  <div className="text-[11px] text-gray-500 flex items-center justify-between pt-2 border-t border-gray-200/60">
                    <span>তারিখ: {evt.eventDate}</span>
                    <span>স্থান: {evt.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: FAQS */}
        {activeTab === "FAQS" && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-[#083B25]">প্রশ্নোত্তর ব্যবস্থাপনা (FAQ)</h2>
                <p className="text-xs text-gray-500">অভিভাবক ও শিক্ষার্থীদের সাধারণ জিজ্ঞাসার অনুমোদিত উত্তরমালা।</p>
              </div>
              <button
                onClick={() => setShowFaqModal(true)}
                className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                নতুন FAQ যোগ করুন
              </button>
            </div>

            <div className="space-y-3">
              {faqs.map((f) => (
                <div key={f.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {f.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        f.isApproved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {f.isApproved ? "অনুমোদিত" : "পর্যালোচনাধীন"}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-gray-900">{f.questionBn}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{f.answerBn}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: DOWNLOADS */}
        {activeTab === "DOWNLOADS" && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-[#083B25]">ডাউনলোড কর্নার ও নথিপত্র</h2>
                <p className="text-xs text-gray-500">ভর্তি ফরম, সিলেবাস ও একাডেমিক ক্যালেন্ডারের ফাইল পরিচালনা।</p>
              </div>
              <button
                onClick={() => setShowDownloadModal(true)}
                className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                নতুন ডাউনলোড ফাইল যোগ করুন
              </button>
            </div>

            <div className="space-y-2.5">
              {downloads.map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {d.fileType}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-gray-900">{d.titleBn}</h3>
                      <p className="text-[11px] text-gray-500">
                        {d.category} • {d.fileSizeDisplay} • {d.versionString}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    সক্রিয়
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: GALLERY */}
        {activeTab === "GALLERY" && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-[#083B25]">ফটো গ্যালারি ও অভিভাবক সম্মতি যাচাই</h2>
                <p className="text-xs text-gray-500">
                  নিরাপত্তা নীতি: প্রকাশ্যে প্রদর্শনের জন্য সম্মতি (Consent) যাচাইকৃত ছবি மட்டுமே লাইভে প্রদর্শিত হয়।
                </p>
              </div>
              <button
                onClick={() => setShowGalleryModal(true)}
                className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                নতুন ছবি যোগ করুন
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gallery.map((g) => (
                <div key={g.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="h-32 bg-gray-200 rounded-lg overflow-hidden relative">
                    <img src={g.imageUrl} alt={g.altText} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-gray-900">{g.titleBn}</h3>
                    <p className="text-[11px] text-gray-500">{g.descriptionBn || g.altText}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-[10px]">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      সম্মতি যাচাইকৃত
                    </span>
                    <span className="text-gray-400">{g.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: SEO */}
        {activeTab === "SEO" && seo && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-[#083B25]">এসইও ও মেটাডাটা কনফিগারেশন (SEO)</h2>
                <p className="text-xs text-gray-500">গুগল সার্চ ও সামাজিক মাধ্যমে প্রদর্শিত সাইটের মেটা তথ্য।</p>
              </div>
              <button
                onClick={handleSaveSeo}
                disabled={saving}
                className="bg-[#0D5C3A] hover:bg-[#158052] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" />
                {saving ? "সংরক্ষণ হচ্ছে..." : "SEO সেটিংস সংরক্ষণ করুন"}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ক্যানোনিকাল বেস ইউআরএল (Canonical Base URL)</label>
                <input
                  type="text"
                  value={seo.canonicalBaseUrl || "https://www.ehrjmadrasha.com"}
                  onChange={(e) => setSeo({ ...seo, canonicalBaseUrl: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ডিফল্ট মেটা শিরোনাম (বাংলা)</label>
                <input
                  type="text"
                  value={seo.defaultTitleBn || ""}
                  onChange={(e) => setSeo({ ...seo, defaultTitleBn: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ডিফল্ট মেটা বিবরণ (Description)</label>
                <textarea
                  rows={3}
                  value={seo.defaultDescriptionBn || ""}
                  onChange={(e) => setSeo({ ...seo, defaultDescriptionBn: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: AI DRAFT ASSISTANT */}
        {activeTab === "AI_ASSIST" && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-[#083B25]">এআই কন্টেন্ট ড্রাফট সহকারী (Phase 21 Integration)</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                এআই কেবল খসড়া প্রস্তুত করে। কোনো কন্টেন্টই সরাসরি প্রকাশিত হয় না; মানবিক যাচাই ও অনুমোদন সাপেক্ষ।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ড্রাফটের ধরণ</label>
                <select
                  value={aiTask}
                  onChange={(e) => setAiTask(e.target.value as any)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white font-semibold"
                >
                  <option value="FAQ_DRAFT">প্রশ্নোত্তর খসড়া (FAQ Draft)</option>
                  <option value="NOTICE_SUMMARY">নোটিশ সংক্ষেপণ (Notice Summary)</option>
                  <option value="SEO_META">এসইও মেটা প্রস্তাবনা (SEO Meta Suggestion)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">বিষয় বা কিওয়ার্ড</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="যেমন: হিফজ বিভাগের মাসিক ফি অথবা ছুটির নোটিশ..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateAiDraft}
              disabled={aiLoading || !aiTopic.trim()}
              className="bg-[#0D5C3A] hover:bg-[#158052] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {aiLoading ? "খসড়া তৈরি হচ্ছে..." : "AI খসড়া তৈরি করুন"}
            </button>

            {aiDraftResult && (
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3">
                <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  প্রস্তুতকৃত খসড়া (মানবিক পর্যালোচনা বাধ্যতামূলক)
                </div>
                <pre className="text-xs bg-white p-3 rounded border border-amber-100 overflow-x-auto text-gray-800 font-sans whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(aiDraftResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: EVENT CREATE */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-sm text-[#083B25]">নতুন অনুষ্ঠান যুক্ত করুন</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">অনুষ্ঠানের শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={newEvent.titleBn}
                  onChange={(e) => setNewEvent({ ...newEvent, titleBn: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">স্থান</label>
                  <input
                    type="text"
                    required
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">বিবরণ</label>
                <textarea
                  rows={3}
                  required
                  value={newEvent.descriptionBn}
                  onChange={(e) => setNewEvent({ ...newEvent, descriptionBn: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-xs"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-gray-600 bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded text-xs font-bold text-white bg-[#0D5C3A]"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FAQ CREATE */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-sm text-[#083B25]">নতুন FAQ প্রশ্নোত্তর যুক্ত করুন</h3>
            <form onSubmit={handleCreateFaq} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">প্রশ্ন *</label>
                <input
                  type="text"
                  required
                  value={newFaq.questionBn}
                  onChange={(e) => setNewFaq({ ...newFaq, questionBn: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">উত্তর *</label>
                <textarea
                  rows={4}
                  required
                  value={newFaq.answerBn}
                  onChange={(e) => setNewFaq({ ...newFaq, answerBn: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-xs"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFaqModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-gray-600 bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded text-xs font-bold text-white bg-[#0D5C3A]"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GALLERY CREATE */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-sm text-[#083B25]">নতুন গ্যালারি ছবি যুক্ত করুন</h3>
            <form onSubmit={handleCreateGallery} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ছবির শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={newGallery.titleBn}
                  onChange={(e) => setNewGallery({ ...newGallery, titleBn: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ছবির পাথ (URL) *</label>
                <input
                  type="text"
                  required
                  value={newGallery.imageUrl}
                  onChange={(e) => setNewGallery({ ...newGallery, imageUrl: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ক্যাটাগরি</label>
                <select
                  value={newGallery.category}
                  onChange={(e) => setNewGallery({ ...newGallery, category: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded text-xs bg-white"
                >
                  <option value="CAMPUS">ক্যাম্পাস</option>
                  <option value="CLASSROOM">শ্রেণিকক্ষ</option>
                  <option value="EVENTS">অনুষ্ঠান</option>
                  <option value="FACILITIES">অবকাঠামো</option>
                </select>
              </div>
              <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={newGallery.consentVerified}
                    onChange={(e) => setNewGallery({ ...newGallery, consentVerified: e.target.checked })}
                    className="w-4 h-4 text-[#0D5C3A] rounded border-gray-300"
                  />
                  অভিভাবক/কর্তৃপক্ষের সম্মতি যাচাই সম্পন্ন হয়েছে (Consent Verified)
                </label>
                <span className="block text-gray-500 text-[10px]">
                  সম্মতি ছাড়া শিক্ষার্থীদের ছবি জনসমক্ষে প্রচার করা প্রাতিষ্ঠানিক নীতিবিরুদ্ধ।
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGalleryModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-gray-600 bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded text-xs font-bold text-white bg-[#0D5C3A]"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOWNLOAD CREATE */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-sm text-[#083B25]">নতুন ডাউনলোড নথি যুক্ত করুন</h3>
            <form onSubmit={handleCreateDownload} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">নথির শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={newDownload.titleBn}
                  onChange={(e) => setNewDownload({ ...newDownload, titleBn: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={newDownload.category}
                    onChange={(e) => setNewDownload({ ...newDownload, category: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded text-xs bg-white"
                  >
                    <option value="ADMISSION">ভর্তি</option>
                    <option value="SYLLABUS">সিলেবাস</option>
                    <option value="ROUTINE">রুটিন</option>
                    <option value="CALENDAR">ক্যালেন্ডার</option>
                    <option value="PROSPECTUS">পরিচিতি</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">সাইজ</label>
                  <input
                    type="text"
                    required
                    value={newDownload.fileSizeDisplay}
                    onChange={(e) => setNewDownload({ ...newDownload, fileSizeDisplay: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">বিবরণ</label>
                <textarea
                  rows={2}
                  required
                  value={newDownload.descriptionBn}
                  onChange={(e) => setNewDownload({ ...newDownload, descriptionBn: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-xs"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDownloadModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-gray-600 bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded text-xs font-bold text-white bg-[#0D5C3A]"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
