"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  Globe, 
  LogOut, 
  RefreshCw, 
  AlertCircle, 
  X,
  CheckCircle2,
  Clock
} from "lucide-react";

interface SessionItem {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  lastActiveAt?: string;
  isCurrent?: boolean;
}

interface GuardianActiveSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuardianActiveSessionsModal({ isOpen, onClose }: GuardianActiveSessionsModalProps) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/portal/security/sessions", { cache: "no-store" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "সেশন তথ্য লোড করতে ব্যর্থ হয়েছে।");
      }
      const json = await res.json();
      if (json.success && json.data) {
        setSessions(json.data.sessions || []);
      }
    } catch (err: any) {
      setMessage({ text: err.message || "ত্রুটি ঘটেছে।", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const handleRevoke = async (sessionId: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই ডিভাইসটি লগআউট করতে চান?")) return;
    setRevokingId(sessionId);
    setMessage(null);
    try {
      const res = await fetch("/api/portal/security/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVOKE_SESSION",
          sessionId
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ text: json.message || "ডিভাইসটি সফলভাবে দূর থেকে লগআউট করা হয়েছে।", type: "success" });
        await fetchSessions();
      } else {
        setMessage({ text: json.error || "সেশন বাতিল করতে ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "ত্রুটি ঘটেছে।", type: "error" });
    } finally {
      setRevokingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
            <div>
              <h3 className="font-bold text-lg">নিরাপত্তা ও সক্রিয় সেশন</h3>
              <p className="text-emerald-100 text-xs">আপনার অভিভাবক অ্যাকাউন্টে লগইন থাকা ডিভাইসসমূহ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-stone-500">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
              <p className="text-sm font-medium">সেশন তালিকা পরীক্ষা করা হচ্ছে...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-stone-500 text-sm">
              কোনো সক্রিয় সেশন খুঁজে পাওয়া যায়নি।
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((sess) => {
                const isMobile = sess.userAgent?.toLowerCase().includes("mobile") ||
                                 sess.userAgent?.toLowerCase().includes("android") ||
                                 sess.userAgent?.toLowerCase().includes("iphone");

                return (
                  <div
                    key={sess.id}
                    className={`border rounded-xl p-4 transition-all ${
                      sess.isCurrent
                        ? "border-emerald-300 bg-emerald-50/40"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-lg ${
                            sess.isCurrent ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-stone-800">
                              {isMobile ? "স্মার্টফোন / মোবাইল ব্রাউজার" : "কম্পিউটার / ডেস্কটপ ব্রাউজার"}
                            </span>
                            {sess.isCurrent && (
                              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                বর্তমান ডিভাইস
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 line-clamp-1">
                            {sess.userAgent || "অজানা ব্রাউজার"}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-stone-400 pt-1">
                            {sess.ipAddress && (
                              <span className="flex items-center gap-1 font-mono">
                                <Globe className="w-3 h-3" />
                                {sess.ipAddress}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              লগইন: {new Date(sess.createdAt).toLocaleDateString("bn-BD")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!sess.isCurrent && (
                        <button
                          onClick={() => handleRevoke(sess.id)}
                          disabled={revokingId === sess.id}
                          className="px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex items-center gap-1 flex-shrink-0"
                        >
                          {revokingId === sess.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <LogOut className="w-3 h-3" />
                          )}
                          <span>লগআউট</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          <button
            onClick={fetchSessions}
            className="text-xs text-stone-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>তালিকা রিফ্রেশ করুন</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
