"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  LogOut,
  Building,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

interface UserItem {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [bannerMsg, setBannerMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // New Teacher Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submittingTeacher, setSubmittingTeacher] = useState(false);

  // Password Reset Modal
  const [resettingUser, setResettingUser] = useState<UserItem | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [submittingReset, setSubmittingReset] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/login";
        return;
      }
      const json = await res.json();
      if (json.success && json.data) {
        setUsers(json.data.users);
      } else {
        setBannerMsg({ text: json.error?.message || "ব্যবহারকারী লোড করা যায়নি।", type: "error" });
      }
    } catch {
      setBannerMsg({ text: "নেটওয়ার্ক ত্রুটি ঘটেছে।", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTeacher(true);
    setBannerMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          password: newPassword,
          role: "TEACHER",
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBannerMsg({ text: json.message || "উস্তাদের অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!", type: "success" });
        setShowAddModal(false);
        setNewName("");
        setNewEmail("");
        setNewPhone("");
        setNewPassword("");
        fetchUsers();
      } else {
        setBannerMsg({ text: json.error?.message || json.error || "অ্যাকাউন্ট তৈরি করা যায়নি।", type: "error" });
      }
    } catch {
      setBannerMsg({ text: "সার্ভার সংযোগে ব্যর্থ হয়েছে।", type: "error" });
    } finally {
      setSubmittingTeacher(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setBannerMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "UPDATE_STATUS",
          status: newStatus,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBannerMsg({ text: json.message, type: "success" });
        fetchUsers();
      } else {
        setBannerMsg({ text: json.error?.message || "স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি।", type: "error" });
      }
    } catch {
      setBannerMsg({ text: "সার্ভারে অনুরোধ পাঠানো যায়নি।", type: "error" });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    setSubmittingReset(true);
    setBannerMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resettingUser.id,
          action: "RESET_PASSWORD",
          newPassword: resetNewPassword,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBannerMsg({ text: json.message, type: "success" });
        setResettingUser(null);
        setResetNewPassword("");
      } else {
        setBannerMsg({ text: json.error?.message || "পাসওয়ার্ড রিসেট করা যায়নি।", type: "error" });
      }
    } catch {
      setBannerMsg({ text: "সার্ভার সংযোগে ব্যর্থ হয়েছে।", type: "error" });
    } finally {
      setSubmittingReset(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-[#083B25] text-white border-b border-emerald-900 shadow sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-1.5 rounded bg-emerald-900/60 hover:bg-emerald-800 transition text-emerald-200"
              title="অ্যাডমিন ড্যাশবোর্ডে ফিরে যান"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#C59B27]" />
                <h1 className="text-sm font-bold text-white">{INSTITUTION_INFO.nameBn}</h1>
              </div>
              <p className="text-[11px] text-emerald-300">কেন্দ্রীয় অ্যাডমিন প্যানেল — ইউজার ও শিক্ষক পরিচালনা</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded text-emerald-200 hidden sm:inline-block">
              প্রধান অ্যাডমিন
            </span>
            <button
              onClick={handleLogout}
              className="text-xs bg-red-800/80 hover:bg-red-700 text-white px-3 py-1.5 rounded flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              লগআউট
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Banner Alert */}
        {bannerMsg && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-center gap-2 ${
              bannerMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {bannerMsg.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span className="font-medium">{bannerMsg.text}</span>
          </div>
        )}

        {/* Section Header */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0D5C3A]" />
              <h2 className="text-base font-bold text-[#0B1914]">ব্যবহারকারী ও শিক্ষক পরিষদ (Staff & Faculty)</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              মাদরাসার একক অ্যাডমিন পরিচালনা, উস্তাদদের অ্যাকাউন্ট ক্রিয়েশন, স্ট্যাটাস কন্ট্রোল ও পাসওয়ার্ড রিসেট ব্যবস্থা।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="p-2 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1.5"
              title="তালিকা রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              রিফ্রেশ
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 shadow transition"
            >
              <UserPlus className="w-4 h-4" />
              নতুন উস্তাদ/শিক্ষক যোগ করুন
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
              />
            </div>
            <button
              type="submit"
              className="bg-gray-800 text-white px-3 py-2 rounded text-xs font-medium hover:bg-gray-700"
            >
              অনুসন্ধান
            </button>
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="p-2 border border-gray-200 rounded text-xs outline-none text-gray-700 bg-white"
            >
              <option value="ALL">সকল ভূমিকা (All Roles)</option>
              <option value="ADMIN">ADMIN</option>
              <option value="TEACHER">TEACHER</option>
              <option value="PRINCIPAL">PRINCIPAL</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-gray-200 rounded text-xs outline-none text-gray-700 bg-white"
            >
              <option value="ALL">সকল স্ট্যাটাস (All)</option>
              <option value="ACTIVE">সক্রিয় (Active)</option>
              <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
              <option value="SUSPENDED">স্থগিত (Suspended)</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8F3] border-b border-gray-200 text-gray-700 font-semibold">
                <tr>
                  <th className="p-3.5">পূর্ণ নাম ও ইউজারনেম</th>
                  <th className="p-3.5">ইমেইল ও মোবাইল</th>
                  <th className="p-3.5">ভূমিকা (Role)</th>
                  <th className="p-3.5">বর্তমান স্ট্যাটাস</th>
                  <th className="p-3.5">তৈরির তারিখ</th>
                  <th className="p-3.5 text-right">পদক্ষেপ (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      ইউজার ডেটা লোড হচ্ছে...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      কোনো ব্যবহারকারী পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">@{u.username}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono text-gray-800">{u.email}</div>
                        {u.phone && <div className="text-[11px] text-gray-500 font-mono">{u.phone}</div>}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                            u.role === "ADMIN"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : u.role === "TEACHER"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : "bg-purple-50 text-purple-800 border-purple-200"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                            u.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : u.status === "INACTIVE"
                              ? "bg-gray-200 text-gray-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {u.status === "ACTIVE" ? "সক্রিয়" : u.status === "INACTIVE" ? "নিষ্ক্রিয়" : "স্থগিত"}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {/* Status Toggle */}
                        {u.role !== "ADMIN" && (
                          <>
                            {u.status === "ACTIVE" ? (
                              <button
                                onClick={() => handleStatusChange(u.id, "INACTIVE")}
                                className="px-2 py-1 text-[11px] border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                                title="নিষ্ক্রিয় করুন"
                              >
                                নিষ্ক্রিয়
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(u.id, "ACTIVE")}
                                className="px-2 py-1 text-[11px] bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 font-medium"
                                title="সক্রিয় করুন"
                              >
                                সক্রিয় করুন
                              </button>
                            )}

                            {u.status !== "SUSPENDED" && (
                              <button
                                onClick={() => handleStatusChange(u.id, "SUSPENDED")}
                                className="px-2 py-1 text-[11px] bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
                                title="স্থগিত করুন"
                              >
                                স্থগিত
                              </button>
                            )}
                          </>
                        )}

                        {/* Reset Password */}
                        <button
                          onClick={() => {
                            setResettingUser(u);
                            setResetNewPassword("");
                          }}
                          className="px-2 py-1 text-[11px] bg-amber-50 text-amber-800 border border-amber-200 rounded hover:bg-amber-100 inline-flex items-center gap-1"
                          title="পাসওয়ার্ড রিসেট করুন"
                        >
                          <KeyRound className="w-3 h-3" />
                          পাসওয়ার্ড
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4 border border-[#E2E8F0]">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#0B1914] flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#0D5C3A]" />
                নতুন উস্তাদ/শিক্ষকের অ্যাকাউন্ট তৈরি
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">উস্তাদের পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="মাওলানা মুহাম্মদ..."
                  className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">ইমেইল ঠিকানা *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ustad@gmail.com বা teacher@ehrjmadrasha.com"
                  className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">লগইন করার আইডি হিসেবে ব্যবহৃত হবে (জিমেইল বা ডোমেইন ইমেইল)।</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">মোবাইল নম্বর</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="018XXXXXXXX"
                  className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">প্রাথমিক পাসওয়ার্ড *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড..."
                  className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingTeacher}
                  className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-1.5 rounded font-semibold flex items-center gap-1.5 shadow"
                >
                  {submittingTeacher ? "তৈরি হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resettingUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 space-y-4 border border-[#E2E8F0]">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#0B1914] flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                পাসওয়ার্ড রিসেট করুন
              </h3>
              <button onClick={() => setResettingUser(null)} className="text-gray-400 hover:text-gray-600 p-1">
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-600">
              <span className="font-semibold text-gray-900">{resettingUser.name}</span> ({resettingUser.email})-এর
              অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড নির্ধারণ করুন।
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">নতুন পাসওয়ার্ড *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষর..."
                  className="w-full p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingReset}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded font-semibold shadow"
                >
                  {submittingReset ? "রিসেট হচ্ছে..." : "পাসওয়ার্ড আপডেট করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
