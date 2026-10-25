"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Phone,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface AdmissionStatus {
  isOpen: boolean;
  sessionName: string;
  closedMessage: string;
  helplinePhone: string;
  updatedAt?: string;
}

export default function AdmissionControlConsole() {
  const [status, setStatus] = useState<AdmissionStatus>({
    isOpen: true,
    sessionName: "২০২৬",
    closedMessage:
      "বর্তমানে নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম সাময়িকভাবে বন্ধ রয়েছে। পরবর্তী সেশনের ভর্তি বিজ্ঞপ্তি খুব শীঘ্রই ওয়েবসাইটে এবং নোটিশ বোর্ডে প্রকাশ করা হবে। জরুরি তথ্যের জন্য মাদরাসা অফিসে যোগাযোগ করুন।",
    helplinePhone: "01845-162664",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchStatus = () => {
    setLoading(true);
    fetch("/api/admissions/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.admission) {
          setStatus(data.admission);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggle = () => {
    setStatus((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admissions/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(status),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          text: `ভর্তি নিয়ন্ত্রণ সফলভাবে সংরক্ষিত হয়েছে। বর্তমান অবস্থা: ${status.isOpen ? "ভর্তি চালু (OPEN)" : "ভর্তি বন্ধ (CLOSED)"}`,
          type: "success",
        });
        if (data.admission) setStatus(data.admission);
      } else {
        setMessage({ text: data.error || "সংরক্ষণ করতে সমস্যা হয়েছে।", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-slate-50 border rounded-xl text-center text-xs text-slate-500">
        ভর্তি নিয়ন্ত্রণ কনসোল লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <span className="text-[11px] font-extrabold text-[#083B25] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            ভর্তি নিয়ন্ত্রণ প্যানেল (Admission On/Off)
          </span>
          <h4 className="text-sm font-bold text-slate-900 mt-1">
            শিক্ষার্থী ভর্তি আবেদন উইন্ডো নিয়ন্ত্রণ ও নোটিশ
          </h4>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
            status.isOpen
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-rose-600 hover:bg-rose-700 text-white"
          }`}
        >
          {status.isOpen ? (
            <>
              <ToggleRight className="w-5 h-5 text-emerald-100" />
              <span>ভর্তি বর্তমানে: চালু (OPEN)</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5 text-rose-100" />
              <span>ভর্তি বর্তমানে: বন্ধ (CLOSED)</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ভর্তি সেশনের নাম:</label>
            <input
              type="text"
              value={status.sessionName}
              onChange={(e) => setStatus({ ...status, sessionName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-[#083B25] outline-none"
              placeholder="যেমন: ২০২৬ বা ২০২৬-২০২৭"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">ভর্তি সংক্রান্ত হেল্পলাইন নম্বর:</label>
            <input
              type="text"
              value={status.helplinePhone}
              onChange={(e) => setStatus({ ...status, helplinePhone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:border-[#083B25] outline-none"
              placeholder="01845-162664"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">
            ভর্তি বন্ধ থাকা অবস্থায় সর্বসাধারণের জন্য প্রদর্শিত নোটিশ বার্তা:
          </label>
          <textarea
            rows={3}
            value={status.closedMessage}
            onChange={(e) => setStatus({ ...status, closedMessage: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs leading-relaxed focus:border-[#083B25] outline-none"
            placeholder="ভর্তি বন্ধের কারণ ও পরবর্তী বিজ্ঞপ্তি সংক্রান্ত বার্তা..."
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#083B25] hover:bg-[#062c1c] text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "সংরক্ষণ হচ্ছে..." : "ভর্তি নিয়ন্ত্রণ সেটিংস সংরক্ষণ করুন"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
