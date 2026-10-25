"use client";

import React, { useState } from "react";
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, ShieldCheck } from "lucide-react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg("অনুগ্রহ করে আপনার বর্তমান পাসওয়ার্ড প্রদান করুন।");
      return;
    }
    if (!newPassword) {
      setErrorMsg("অনুগ্রহ করে একটি নতুন পাসওয়ার্ড লিখুন।");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।");
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMsg("নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ড থেকে আলাদা হতে হবে।");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || "পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMsg(data.error || "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "সার্ভারে সংযোগে ত্রুটি হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  // Password strength helper
  const getStrength = (pass: string) => {
    if (!pass) return { score: 0, text: "", color: "bg-gray-200" };
    if (pass.length < 6) return { score: 1, text: "খুব দুর্বল (কমপক্ষে ৬ অক্ষর)", color: "bg-red-500" };
    const hasNum = /\d/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const total = [hasNum, hasUpper, hasSpecial].filter(Boolean).length;
    if (pass.length >= 8 && total >= 2) return { score: 3, text: "শক্তিশালী", color: "bg-emerald-500" };
    return { score: 2, text: "মাঝারি", color: "bg-amber-500" };
  };

  const strength = getStrength(newPassword);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#052216] via-[#0D5C3A] to-[#083823] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">পাসওয়ার্ড পরিবর্তন</h3>
              <p className="text-[11px] text-emerald-200/90">অ্যাকাউন্ট নিরাপত্তা ও গোপনীয়তা সেটিংস</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Strip */}
        {currentUser && (
          <div className="bg-[#F8FAF9] px-4 py-2 border-b border-gray-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="font-semibold text-gray-800 truncate">{currentUser.name || "ব্যবহারকারী"}</span>
              <span className="text-gray-500 text-[11px] truncate">({currentUser.email || currentUser.role})</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
              {currentUser.role || "USER"}
            </span>
          </div>
        )}

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
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

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              বর্তমান পাসওয়ার্ড <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="আপনার বর্তমান পাসওয়ার্ড লিখুন"
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:bg-white transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              নতুন পাসওয়ার্ড <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড"
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:bg-white transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                <span className="text-gray-500">নিরাপত্তা মাত্রা:</span>
                <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${strength.color}`} />
                  {strength.text}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              নতুন পাসওয়ার্ড নিশ্চিত করুন <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="পুনরায় নতুন পাসওয়ার্ড লিখুন"
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:bg-white transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-red-600 font-medium">পাসওয়ার্ড দুটি মিলছে না</p>
            )}
          </div>

          {/* Submit Buttons */}
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
              className="bg-[#0D5C3A] hover:bg-[#158052] disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  পাসওয়ার্ড আপডেট করুন
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
