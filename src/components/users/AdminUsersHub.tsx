"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Lock,
  UserCheck,
  UserX,
  Mail,
  Phone,
  ShieldAlert,
} from "lucide-react";
import AdminResetUserPasswordModal from "@/components/auth/AdminResetUserPasswordModal";

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

export default function AdminUsersHub() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [bannerMsg, setBannerMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // New User/Teacher Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("TEACHER");
  const [submittingUser, setSubmittingUser] = useState(false);

  // Password Reset Modal target
  const [resetTargetUser, setResetTargetUser] = useState<UserItem | null>(null);

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingUser(true);
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
          role: newRole,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBannerMsg({ text: json.message, type: "success" });
        setShowAddModal(false);
        setNewName("");
        setNewEmail("");
        setNewPhone("");
        setNewPassword("");
        fetchUsers();
      } else {
        setBannerMsg({ text: json.error?.message || "অ্যাকাউন্ট তৈরি করা যায়নি।", type: "error" });
      }
    } catch {
      setBannerMsg({ text: "সার্ভারে সংযোগে ত্রুটি ঘটেছে।", type: "error" });
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string, userName: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const promptText =
      nextStatus === "ACTIVE"
        ? `আপনি কি '${userName}' এর অ্যাকাউন্ট পুনরায় সক্রিয় করতে চান?`
        : `আপনি কি '${userName}' এর অ্যাকাউন্ট স্থগিত করতে চান? তিনি আর লগইন করতে পারবেন না।`;

    if (!confirm(promptText)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "UPDATE_STATUS",
          status: nextStatus,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBannerMsg({ text: json.message, type: "success" });
        fetchUsers();
      } else {
        setBannerMsg({ text: json.error?.message || "স্ট্যাটাস পরিবর্তন করা যায়নি।", type: "error" });
      }
    } catch {
      setBannerMsg({ text: "সার্ভার সংযোগে ব্যর্থ হয়েছে।", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Alert */}
      {bannerMsg && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
            bannerMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMsg.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span className="font-medium">{bannerMsg.text}</span>
          </div>
          <button onClick={() => setBannerMsg(null)} className="text-gray-400 hover:text-gray-600 text-xs">
            &times;
          </button>
        </div>
      )}

      {/* Control Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0D5C3A]" />
            <h2 className="text-base font-bold text-slate-900">ব্যবহারকারী ও স্টাফ অ্যাকাউন্ট পরিচালনা</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            সেন্ট্রাল আরবিএসি (RBAC) অ্যাকাউন্টের স্ট্যাটাস পরিবর্তন, নিরাপত্তা নিয়ন্ত্রণ ও সরাসরি পাসওয়ার্ড রিসেট ব্যবস্থা।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#0D5C3A] hover:bg-[#158052] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>নতুন উস্তাদ / স্টাফ অ্যাকাউন্ট</span>
          </button>
          <button
            onClick={fetchUsers}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="নাম, ইমেইল, মোবাইল বা ইউজারনেম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0D5C3A] bg-slate-50 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
          >
            অনুসন্ধান
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 outline-none"
          >
            <option value="ALL">সকল রোল (All Roles)</option>
            <option value="ADMIN">অ্যাডমিন (Admin)</option>
            <option value="TEACHER">উস্তাদ / শিক্ষক (Teacher)</option>
            <option value="STAFF">স্টাফ (Staff)</option>
            <option value="GUARDIAN">অভিভাবক (Guardian)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 outline-none"
          >
            <option value="ALL">সকল অবস্থা (All Status)</option>
            <option value="ACTIVE">সক্রিয় (Active)</option>
            <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
            <option value="SUSPENDED">স্থগিত (Suspended)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-500">ইউজার তালিকা লোড হচ্ছে...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">কোনো ব্যবহারকারী পাওয়া যায়নি।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAF9] border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-3.5">ব্যবহারকারীর নাম</th>
                  <th className="p-3.5">যোগাযোগ</th>
                  <th className="p-3.5">রোল (Role)</th>
                  <th className="p-3.5">স্ট্যাটাস</th>
                  <th className="p-3.5">নিবন্ধন তারিখ</th>
                  <th className="p-3.5 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#0D5C3A] font-bold flex items-center justify-center shrink-0">
                          {u.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">@{u.username || u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-900 border border-purple-200"
                            : u.role === "TEACHER"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            : "bg-blue-100 text-blue-900 border border-blue-200"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === "ACTIVE" ? "bg-emerald-600" : "bg-rose-600"
                          }`}
                        />
                        {u.status === "ACTIVE" ? "সক্রিয়" : "স্থগিত"}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(u.createdAt).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Password Reset Action Button */}
                        <button
                          onClick={() => setResetTargetUser(u)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                          title="পাসওয়ার্ড রিসেট বা পরিবর্তন করুন"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                          <span>পাসওয়ার্ড পরিবর্তন</span>
                        </button>

                        {/* Status Toggle Button (Prevent self-suspension for admin) */}
                        {u.role !== "ADMIN" && (
                          <button
                            onClick={() => handleStatusToggle(u.id, u.status, u.name)}
                            className={`p-1 rounded-lg border transition ${
                              u.status === "ACTIVE"
                                ? "border-rose-200 hover:bg-rose-50 text-rose-700"
                                : "border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                            }`}
                            title={u.status === "ACTIVE" ? "অ্যাকাউন্ট স্থগিত করুন" : "অ্যাকাউন্ট সক্রিয় করুন"}
                          >
                            {u.status === "ACTIVE" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Reset User Password Modal */}
      {resetTargetUser && (
        <AdminResetUserPasswordModal
          isOpen={!!resetTargetUser}
          onClose={() => setResetTargetUser(null)}
          targetUser={resetTargetUser}
          onSuccess={() => {
            fetchUsers();
            setBannerMsg({
              text: `'${resetTargetUser.name}' এর পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।`,
              type: "success",
            });
          }}
        />
      )}

      {/* Create New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-[#0D5C3A] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">নতুন ব্যবহারকারী অ্যাকাউন্ট তৈরি</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white/70 hover:text-white text-lg">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মাওলানা মাহমুদ হাসান"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ইমেইল ঠিকানা *</label>
                <input
                  type="email"
                  required
                  placeholder="teacher@ehrj.edu.bd"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">মোবাইল নম্বর (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="017XXXXXXXX"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ভূমিকা / রোল *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                >
                  <option value="TEACHER">উস্তাদ / শিক্ষক (Teacher)</option>
                  <option value="STAFF">সাধারণ স্টাফ / অপারেটর (Staff)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">প্রাথমিক পাসওয়ার্ড *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0D5C3A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-5 py-2 bg-[#0D5C3A] hover:bg-[#158052] text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {submittingUser ? "তৈরি হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
