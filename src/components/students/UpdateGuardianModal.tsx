"use client";

import React, { useState } from "react";
import { X, UserCheck, ShieldAlert, Phone, Mail, MapPin, Check, AlertCircle } from "lucide-react";

interface UpdateGuardianModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  studentIdNumber: string;
  initialGuardianName?: string;
  initialPhone?: string;
  onSuccess: () => void;
}

export default function UpdateGuardianModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  studentIdNumber,
  initialGuardianName = "",
  initialPhone = "",
  onSuccess,
}: UpdateGuardianModalProps) {
  const [guardianName, setGuardianName] = useState(
    initialGuardianName === "অজানা" ? "" : initialGuardianName
  );
  const [relation, setRelation] = useState("পিতা (Father)");
  const [phone, setPhone] = useState(
    initialPhone === "অজানা" || initialPhone === "যোগাযোগ নেই" ? "" : initialPhone
  );
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianName.trim() || !phone.trim()) {
      setError("অভিভাবকের নাম এবং সক্রিয় মোবাইল নম্বর পূরণ করা আবশ্যক।");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/students/${studentId}/guardians`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardianName: guardianName.trim(),
          relation: relation.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "অভিভাবকের তথ্য সংরক্ষণে ত্রুটি ঘটেছে।");
      }
    } catch {
      setError("নেটওয়ার্ক সমস্যা। পুনরায় চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#052216] to-[#0D5C3A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">অভিভাবকের তথ্য হালনাগাদ</h3>
              <p className="text-xs text-emerald-100 font-mono">
                {studentName} • আইডি: {studentIdNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              এই তথ্য সরাসরি ছাত্রের মাস্টার রেকর্ডে যুক্ত হবে এবং নিরাপত্তার স্বার্থে আপনার অ্যাডমিন আইডিসহ
              অডিট লগ সংরক্ষিত হবে।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                অভিভাবকের নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: হাজী আবদুর রহমান"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0D5C3A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">সম্পর্ক (Relation)</label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0D5C3A] outline-none bg-white"
              >
                <option value="পিতা (Father)">পিতা (Father)</option>
                <option value="মাতা (Mother)">মাতা (Mother)</option>
                <option value="বড় ভাই (Brother)">বড় ভাই (Brother)</option>
                <option value="চাচা / মামা (Uncle)">চাচা / মামা (Uncle)</option>
                <option value="আইনগত অভিভাবক (Guardian)">আইনগত অভিভাবক (Guardian)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                মোবাইল নম্বর <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="017xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#0D5C3A] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">ইমেইল (ঐচ্ছিক)</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="guardian@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0D5C3A] outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">বর্তমান ঠিকানা</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <textarea
                rows={2}
                placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0D5C3A] outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <span>সংরক্ষণ হচ্ছে...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>তথ্য আপডেট করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
