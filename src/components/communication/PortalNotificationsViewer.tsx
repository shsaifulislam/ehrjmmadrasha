"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle,
  Clock,
  ExternalLink,
  CheckCheck,
  Settings,
  FileText,
  ShieldAlert,
  DollarSign,
  Award,
  BookOpen,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function PortalNotificationsViewer() {
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "NOTICES" | "PREFERENCES">("ALL");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Targeted Notices State
  const [notices, setNotices] = useState<any[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  // Preferences State
  const [preferences, setPreferences] = useState<any[]>([]);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);

  // Fetch Notifications
  const fetchNotifications = () => {
    setLoading(true);
    const unreadParam = activeTab === "UNREAD" ? "?unreadOnly=true" : "";
    fetch(`/api/portal/notifications${unreadParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 0);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  // Fetch Targeted Notices
  const fetchNotices = () => {
    setLoadingNotices(true);
    fetch("/api/portal/notices")
      .then((res) => res.json())
      .then((data) => {
        if (data.notices) setNotices(data.notices);
        setLoadingNotices(false);
      })
      .catch(() => setLoadingNotices(false));
  };

  // Fetch Preferences
  const fetchPreferences = () => {
    setLoadingPrefs(true);
    fetch("/api/portal/notifications/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data.preferences) setPreferences(data.preferences);
        setLoadingPrefs(false);
      })
      .catch(() => setLoadingPrefs(false));
  };

  useEffect(() => {
    if (activeTab === "ALL" || activeTab === "UNREAD") {
      fetchNotifications();
    } else if (activeTab === "NOTICES") {
      fetchNotices();
    } else if (activeTab === "PREFERENCES") {
      fetchPreferences();
    }
  }, [activeTab]);

  // Mark single read
  const handleMarkRead = async (id: string, actionUrl?: string) => {
    try {
      await fetch(`/api/portal/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (actionUrl) {
        window.location.href = actionUrl;
      }
    } catch (err) {}
  };

  // Mark all read
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/portal/notifications/mark-all-read", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {}
  };

  // Toggle Preference
  const handleTogglePreference = async (
    category: string,
    channel: "portal" | "email",
    currentVal: boolean
  ) => {
    setPrefSaving(true);
    const targetPref = preferences.find((p) => p.category === category);
    if (!targetPref) return;

    const payload = {
      category,
      portalEnabled: channel === "portal" ? !currentVal : targetPref.portalEnabled,
      emailEnabled: channel === "email" ? !currentVal : targetPref.emailEnabled,
    };

    try {
      const res = await fetch("/api/portal/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setPreferences((prev) =>
          prev.map((p) =>
            p.category === category
              ? {
                  ...p,
                  portalEnabled: payload.portalEnabled,
                  emailEnabled: payload.emailEnabled,
                }
              : p
          )
        );
      }
      setPrefSaving(false);
    } catch (err) {
      setPrefSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "FINANCE":
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case "DOCUMENT":
        return <Award className="w-4 h-4 text-blue-600" />;
      case "EXAM":
        return <FileText className="w-4 h-4 text-purple-600" />;
      case "ATTENDANCE":
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case "SYSTEM":
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#0D5C3A]" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-4">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#083B25] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0D5C3A]" />
            অভিভাবক নোটিফিকেশন ও নোটিশ ইনবক্স
            {unreadCount > 0 && (
              <span className="bg-amber-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} নতুন
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            সন্তানের ভর্তি, ফি ইনভয়েস, পরীক্ষা, মার্কশিট ও মাদরাসার অফিশিয়াল নোটিশ সংক্রান্ত বার্তা।
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-[#0D5C3A] hover:text-[#158052] font-semibold flex items-center gap-1 border border-emerald-200 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition w-fit"
          >
            <CheckCheck className="w-4 h-4" /> সব পঠিত করুন
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-5 border-b border-gray-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`pb-3 px-3 transition border-b-2 ${
            activeTab === "ALL"
              ? "border-[#0D5C3A] text-[#0D5C3A] font-bold"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          সকল বার্তা
        </button>

        <button
          onClick={() => setActiveTab("UNREAD")}
          className={`pb-3 px-3 transition border-b-2 flex items-center gap-1 ${
            activeTab === "UNREAD"
              ? "border-[#0D5C3A] text-[#0D5C3A] font-bold"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          অপঠিত
          {unreadCount > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("NOTICES")}
          className={`pb-3 px-3 transition border-b-2 flex items-center gap-1 ${
            activeTab === "NOTICES"
              ? "border-[#0D5C3A] text-[#0D5C3A] font-bold"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          মাদরাসা নোটিশ বোর্ড
        </button>

        <button
          onClick={() => setActiveTab("PREFERENCES")}
          className={`pb-3 px-3 transition border-b-2 flex items-center gap-1 ${
            activeTab === "PREFERENCES"
              ? "border-[#0D5C3A] text-[#0D5C3A] font-bold"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          বার্তা পছন্দসমূহ
        </button>
      </div>

      {/* Body: Notifications List */}
      {(activeTab === "ALL" || activeTab === "UNREAD") && (
        <div className="divide-y divide-gray-100 px-5 pb-5">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-xs">নোটিফিকেশন লোড হচ্ছে...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs space-y-1">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="font-semibold text-gray-700">কোনো অপঠিত বার্তা নেই</p>
              <p className="text-[11px] text-gray-400">আপনার সকল জরুরি বার্তা হালনাগাদ রয়েছে।</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`py-4 flex items-start justify-between gap-4 transition ${
                  !n.isRead ? "bg-amber-50/40 -mx-5 px-5" : ""
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 mt-0.5">
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-xs">{n.title}</span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-600 block"></span>
                      )}
                      {n.priority === "URGENT" && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                          জরুরি
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{n.body}</p>
                    <span className="text-[10px] text-gray-400 block pt-1">
                      {new Date(n.createdAt).toLocaleString("bn-BD")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 whitespace-nowrap">
                  {n.actionUrl && (
                    <button
                      onClick={() => handleMarkRead(n.id, n.actionUrl)}
                      className="text-xs text-[#0D5C3A] font-semibold flex items-center gap-1 hover:underline"
                    >
                      দেখুন <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                  {!n.isRead && !n.actionUrl && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-[11px] text-gray-500 hover:text-gray-800"
                    >
                      পঠিত চিহ্নিত করুন
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Body: Targeted Notices List */}
      {activeTab === "NOTICES" && (
        <div className="p-5 space-y-3">
          {loadingNotices ? (
            <div className="p-8 text-center text-gray-400 text-xs">নোটিশ লোড হচ্ছে...</div>
          ) : notices.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              এই মুহূর্তে কোনো নোটিশ কার্যকর নেই।
            </div>
          ) : (
            notices.map((notice) => (
              <div
                key={notice.id}
                className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 transition space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    {notice.titleBn}
                    {notice.priority === "URGENT" && (
                      <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        জরুরি
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(notice.publishedAt).toLocaleDateString("bn-BD")}
                  </span>
                </div>
                <p className="text-gray-600 line-clamp-2 leading-relaxed">{notice.contentBn}</p>
                <div className="flex items-center justify-between pt-2 border-t text-[11px]">
                  <span className="text-gray-500">
                    প্রযোজ্য: {notice.jamatClass ? `জামাত ${notice.jamatClass.nameBn}` : "সকল অভিভাবক"}
                  </span>
                  <Link
                    href={`/notices/${notice.id}`}
                    className="text-[#0D5C3A] font-bold flex items-center gap-1 hover:underline"
                  >
                    পূর্ণাঙ্গ নোটিশ পড়ুন →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Body: Notification Preferences */}
      {activeTab === "PREFERENCES" && (
        <div className="p-5 space-y-4 text-xs">
          <p className="text-gray-600 text-xs">
            আপনি কোন ধরনের বার্তা পোর্টাল বা ইমেইলে পেতে চান তা নির্ধারণ করুন। আর্থিক রসিদ ও নিরাপত্তা অ্যালার্ট নীতি অনুযায়ী বাধ্যতামূলক।
          </p>

          <div className="divide-y divide-gray-100 border rounded-xl overflow-hidden">
            {loadingPrefs ? (
              <div className="p-8 text-center text-gray-400">পছন্দসমূহ লোড হচ্ছে...</div>
            ) : (
              preferences.map((p) => (
                <div key={p.category} className="p-4 flex items-center justify-between gap-4 bg-white">
                  <div>
                    <span className="font-bold text-gray-900 block">{p.nameBn}</span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      {!p.configurable
                        ? "প্রাতিষ্ঠানিক নীতি অনুযায়ী এই নোটিফিকেশন বন্ধ করা যাবে না।"
                        : "পোর্টাল এবং ইমেইল সতর্কতা নিয়ন্ত্রণ করুন।"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!p.configurable || prefSaving}
                        checked={p.portalEnabled}
                        onChange={() =>
                          handleTogglePreference(p.category, "portal", p.portalEnabled)
                        }
                        className="rounded text-[#0D5C3A]"
                      />
                      <span>পোর্টাল</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!p.configurable || prefSaving}
                        checked={p.emailEnabled}
                        onChange={() =>
                          handleTogglePreference(p.category, "email", p.emailEnabled)
                        }
                        className="rounded text-[#0D5C3A]"
                      />
                      <span>ইমেইল</span>
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
