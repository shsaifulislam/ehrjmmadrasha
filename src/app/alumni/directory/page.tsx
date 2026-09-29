"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  GraduationCap,
  Briefcase,
  MapPin,
  CheckCircle,
  Clock,
  ShieldAlert,
  Mail,
  Phone,
  Linkedin,
  Facebook,
  Globe,
  UserPlus,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { SanitizedAlumniProfile } from "@/lib/alumni/types";

export default function AlumniDirectoryPage() {
  const [profiles, setProfiles] = useState<SanitizedAlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // Filters
  const [search, setSearch] = useState("");
  const [passOutYear, setPassOutYear] = useState("");
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [profession, setProfession] = useState("");

  // Self-registration modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    studentId: "",
    fullNameBn: "",
    fullNameEn: "",
    passOutYear: "",
    department: "Hifz / Dakhil",
    phone: "",
    email: "",
    currentProfession: "",
    currentOrganization: "",
    currentCity: "",
    bioBn: "",
  });
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  const fetchDirectory = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (passOutYear) params.set("passOutYear", passOutYear);
    if (department) params.set("department", department);
    if (city) params.set("currentCity", city);
    if (profession) params.set("currentProfession", profession);
    params.set("page", page.toString());
    params.set("limit", limit.toString());

    fetch(`/api/alumni?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfiles(data.data || []);
          setTotal(data.total || 0);
        }
      })
      .catch((err) => console.error("Error loading alumni directory:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDirectory();
  }, [page, passOutYear, department]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDirectory();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReg(true);
    setRegSuccess(null);
    setRegError(null);

    try {
      const res = await fetch("/api/alumni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...regForm,
          passOutYear: parseInt(regForm.passOutYear, 10),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRegSuccess("আপনার তথ্য সফলভাবে সংরক্ষিত হয়েছে। প্রাতিষ্ঠানিক যাচাইকরণের পর ডিরেক্টরিতে প্রকাশিত হবে।");
        setRegForm({
          studentId: "",
          fullNameBn: "",
          fullNameEn: "",
          passOutYear: "",
          department: "Hifz / Dakhil",
          phone: "",
          email: "",
          currentProfession: "",
          currentOrganization: "",
          currentCity: "",
          bioBn: "",
        });
      } else {
        setRegError(data.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setRegError(err.message || "নেটওয়ার্ক বিভ্রাট ঘটেছে।");
    } finally {
      setSubmittingReg(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-2">
              <Link href="/alumni" className="hover:underline">অ্যালামনাই হোম</Link>
              <span>/</span>
              <span>ডিরেক্টরি</span>
            </div>
            <h1 className="text-3xl font-extrabold font-serif">প্রাক্তন ছাত্র ডিরেক্টরি</h1>
            <p className="text-sm text-emerald-100/80 mt-1 max-w-xl">
              ইলিয়টগঞ্জ মাদরাসা থেকে কৃতিত্বের সাথে সমাপ্তকারী শিক্ষার্থীদের যাচাইকৃত প্রোফাইল ও পরিচিতি
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg transition"
            >
              <UserPlus className="w-4 h-4" /> নতুন নাম নিবন্ধন
            </button>
            <Link
              href="/portal/alumni"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition"
            >
              পোর্টাল লগইন
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Search & Filter Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="নাম বা প্রতিষ্ঠানের নাম দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <select
                value={passOutYear}
                onChange={(e) => { setPassOutYear(e.target.value); setPage(1); }}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">সকল ব্যাচ / বছর</option>
                <option value="2025">ব্যাচ ২০২৫</option>
                <option value="2024">ব্যাচ ২০২৪</option>
                <option value="2023">ব্যাচ ২০২৩</option>
                <option value="2022">ব্যাচ ২০২২</option>
                <option value="2021">ব্যাচ ২০২১</option>
                <option value="2020">ব্যাচ ২০২০ (ঐতিহাসিক)</option>
              </select>
            </div>

            <div>
              <select
                value={department}
                onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">সকল বিভাগ</option>
                <option value="Hifz">হিফজুল কুরআন</option>
                <option value="Kitab">কিতাব ও কওমি শাখা</option>
                <option value="General">জেনারেল ও দাখিল</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" /> ফিল্টার
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPassOutYear("");
                  setDepartment("");
                  setCity("");
                  setProfession("");
                  setPage(1);
                  setTimeout(fetchDirectory, 0);
                }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                title="রিসেট"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Directory Results */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-slate-600">
            মোট ফলাফল: <span className="text-slate-900 font-bold">{total}</span> জন প্রাক্তন শিক্ষার্থী
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            যাচাইকৃত শিক্ষার্থী প্রোফাইল
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-medium text-slate-500">ডিরেক্টরি তথ্য লোড হচ্ছে...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">কোনো ফলাফল পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              প্রদত্ত ফিল্টারের সাথে মিলে এমন কোনো অ্যালামনাই তথ্য মেলেনি। অন্য ব্যাচ বা ফিল্টার নির্বাচন করুন।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 font-serif">
                        {profile.fullNameBn}
                      </h3>
                      <div className="text-xs text-slate-500 font-sans">
                        {profile.fullNameEn}
                      </div>
                    </div>
                    {profile.isVerified ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
                        title="প্রাতিষ্ঠানিক রেকর্ড যাচাইকৃত"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> যাচাইকৃত
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3" /> প্রক্রিয়াধীন
                      </span>
                    )}
                  </div>

                  {/* Batch & Department tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg">
                      ব্যাচ {profile.passOutYear}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-lg">
                      {profile.department}
                    </span>
                  </div>

                  {/* Profession & Organization */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    {profile.currentProfession && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">
                          {profile.currentProfession}
                          {profile.currentOrganization && ` • ${profile.currentOrganization}`}
                        </span>
                      </div>
                    )}
                    {profile.currentCity && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {profile.currentCity}
                          {profile.currentCountry && `, ${profile.currentCountry}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {profile.bioBn && (
                    <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4">
                      "{profile.bioBn}"
                    </p>
                  )}

                  {/* Skills */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {profile.skills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] rounded-md font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer / Privacy-safe contact */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {profile.publicPhone ? (
                      <a
                        href={`tel:${profile.publicPhone}`}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                        title={profile.publicPhone}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                    {profile.publicEmail ? (
                      <a
                        href={`mailto:${profile.publicEmail}`}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                        title={profile.publicEmail}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                    {profile.socialLinks?.linkedin && (
                      <a
                        href={profile.socialLinks.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {!profile.publicPhone && !profile.publicEmail && (
                      <span className="text-[11px] text-slate-400 italic">
                        যোগাযোগ সুরক্ষিত
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {profile.studentId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-600 px-3">
              পৃষ্ঠা {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Self Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <Sparkles className="w-3.5 h-3.5" /> প্রাক্তন ছাত্র নিবন্ধন
              </span>
              <h2 className="text-xl font-bold font-serif text-slate-900 mt-2">
                অ্যালামনাই নেটওয়ার্কে যুক্ত হোন
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                আপনার সঠিক তথ্য প্রদান করুন। মাদরাসা রেকর্ড মিলিয়ে অনুমোদিত হলে ডিরেক্টরিতে প্রকাশিত হবে।
              </p>
            </div>

            {regSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs mb-4">
                {regSuccess}
                <div className="mt-3">
                  <button
                    onClick={() => { setShowRegisterModal(false); setRegSuccess(null); }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                  >
                    ঠিক আছে
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {regError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                    {regError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ছাত্র আইডি (Student ID) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: EHRJ-2023-010"
                      value={regForm.studentId}
                      onChange={(e) => setRegForm({ ...regForm, studentId: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      পাসিং বছর (Pass Out Year) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1990}
                      max={2030}
                      placeholder="যেমন: 2024"
                      value={regForm.passOutYear}
                      onChange={(e) => setRegForm({ ...regForm, passOutYear: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      পূর্ণ নাম (বাংলা) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: হাফেজ আব্দুল্লাহ মাহমুদ"
                      value={regForm.fullNameBn}
                      onChange={(e) => setRegForm({ ...regForm, fullNameBn: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      পূর্ণ নাম (ইংরেজি) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hafez Abdullah Mahmud"
                      value={regForm.fullNameEn}
                      onChange={(e) => setRegForm({ ...regForm, fullNameEn: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      বিভাগ (Department)
                    </label>
                    <select
                      value={regForm.department}
                      onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Hifz">হিফজুল কুরআন</option>
                      <option value="Kitab">কিতাব বিভাগ</option>
                      <option value="General">জেনারেল / দাখিল</option>
                      <option value="Other">অন্যান্য</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      বর্তমান পেশা
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: শিক্ষক / ব্যবসায়ী / শিক্ষার্থী"
                      value={regForm.currentProfession}
                      onChange={(e) => setRegForm({ ...regForm, currentProfession: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      মোবাইল নম্বর (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      placeholder="018XXXXXXXX"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      বর্তমান অবস্থান (শহর)
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: ঢাকা / কুমিল্লা / চট্টগ্রাম"
                      value={regForm.currentCity}
                      onChange={(e) => setRegForm({ ...regForm, currentCity: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সংক্ষিপ্ত বিবরণ বা স্মৃতিচারণ
                  </label>
                  <textarea
                    rows={2}
                    placeholder="মাদরাসায় আপনার পড়ার সময় বা বর্তমান ব্যস্ততা..."
                    value={regForm.bioBn}
                    onChange={(e) => setRegForm({ ...regForm, bioBn: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReg}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submittingReg ? "জমা হচ্ছে..." : "নিবন্ধন জমা দিন"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
