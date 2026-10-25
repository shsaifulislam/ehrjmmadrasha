"use client";

import React, { useState } from "react";
import { KeyRound, ShieldAlert, Eye, EyeOff, CheckCircle2, AlertCircle, X, User } from "lucide-react";

interface AdminResetUserPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role?: string;
  } | null;
  onSuccess?: () => void;
}

export default function AdminResetUserPasswordModal({
  isOpen,
  onClose,
  targetUser,
  onSuccess,
}: AdminResetUserPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !targetUser) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESET_PASSWORD",
          userId: targetUser.id,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || "পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে!");
        setNewPassword("");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMsg(data.error?.message || data.error || "পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "সার্ভারে সংযোগে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRandom = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let generated = "";
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setShowPass(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 via-rose-800 to-amber-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">ইউজার পাসওয়ার্ড রিসেট</h3>
              <p className="text-[11px] text-rose-200/90">অ্যাডমিন প্রিভিলেজড সিকিউরিটি অ্যাকশন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="bg-[#FFF8F8] p-4 border-b border-rose-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-900 flex items-center justify-center font-bold shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="font-bold text-gray-900 block truncate">{targetUser.name}</span>
              <span className="text-gray-500 text-[11px] font-mono truncate">{targetUser.email || targetUser.phone}</span>
            </div>
          </div>
          <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full uppercase shrink-0">
            {targetUser.role || "USER"}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleReset} className="p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold leading-relaxed">{successMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">
                নির্ধারিত নতুন পাসওয়ার্ড <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="text-[11px] text-[#0D5C3A] hover:underline font-semibold"
              >
                র‍্যান্ডম পাসওয়ার্ড তৈরি করুন
              </button>
            </div>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড লিখুন..."
                className="w-full pl-3 pr-10 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white font-mono transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              পাসওয়ার্ড রিসেটের পর ব্যবহারকারীর পুরনো সমস্ত সেশন বাতিল হবে এবং তাকে এই নতুন পাসওয়ার্ড দিয়ে লগইন করতে হবে।
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-semibold transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  রিসেট হচ্ছে...
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  পাসওয়ার্ড রিসেট নিশ্চিত করুন
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
