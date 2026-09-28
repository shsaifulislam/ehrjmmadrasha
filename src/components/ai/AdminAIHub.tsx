"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  Power,
  FileText,
  UserCheck,
  Check,
  Search,
  Languages,
} from "lucide-react";

export default function AdminAIHub() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"ASSISTANT" | "ANOMALIES" | "HUMAN_REVIEW" | "ARABIC_NAME">("ASSISTANT");

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      sender: "AI",
      text: "সালামু আলাইকুম! আমি ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার এআই ডিসিশন-সাপোর্ট সহকারী। আমি প্রাতিষ্ঠানিক তথ্য বিশ্লেষণ ও সারাংশ প্রদানে আপনাকে সহায়তা করতে পারি।",
      evidence: ["Authoritative System Data Grounded"],
      timestamp: new Date().toLocaleTimeString("bn-BD"),
    },
  ]);
  const [querying, setQuerying] = useState(false);

  // Arabic Name Tool State
  const [nameInput, setNameInput] = useState("মুহাম্মদ তাওহীদ হোসেন");
  const [fatherNameInput, setFatherNameInput] = useState("আব্দুর রহমান");
  const [phoneInput, setPhoneInput] = useState("01711223344");
  const [arabicResult, setArabicResult] = useState<any>(null);
  const [evaluatingName, setEvaluatingName] = useState(false);

  // Action Loading
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAIGovernance = async () => {
    try {
      const res = await fetch("/api/ai/governance");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load AI governance data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIGovernance();
  }, []);

  const handleToggleMasterAI = async () => {
    if (!data?.flags) return;
    try {
      setActionLoading(true);
      const newStatus = !data.flags.masterEnabled;
      const res = await fetch("/api/ai/governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flags: { masterEnabled: newStatus },
          reason: newStatus ? "Administrative re-activation" : "Emergency administrative kill-switch triggered",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setData((prev: any) => ({ ...prev, flags: json.flags }));
      }
    } catch (err) {
      console.error("Toggle failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || querying) return;

    const userMsg = {
      sender: "USER",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString("bn-BD"),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    const prompt = chatInput;
    setChatInput("");
    setQuerying(true);

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt }),
      });
      const json = await res.json();
      if (json.success) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: json.result.answer,
            evidence: json.result.evidence,
            module: json.result.module,
            timestamp: new Date().toLocaleTimeString("bn-BD"),
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: json.error || "দুঃখিত, উত্তর তৈরি করা যায়নি।",
            timestamp: new Date().toLocaleTimeString("bn-BD"),
          },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          text: "সার্ভার সংযোগে ত্রুটি ঘটেছে। স্বাভাবিক ইআরপি সচল রয়েছে।",
          timestamp: new Date().toLocaleTimeString("bn-BD"),
        },
      ]);
    } finally {
      setQuerying(false);
    }
  };

  const handleReviewDecision = async (reviewId: string, decision: "APPROVED" | "REJECTED") => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/ai/governance/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, decision }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchAIGovernance();
      }
    } catch (err) {
      console.error("Decision failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEvaluateArabic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEvaluatingName(true);
      const res = await fetch("/api/ai/admissions/arabic-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullNameBn: nameInput,
          fatherNameBn: fatherNameInput,
          guardianPhone: phoneInput,
          dateOfBirth: "2018-01-01",
          hasBirthCertDoc: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setArabicResult(json.evaluation);
      }
    } catch (err) {
      console.error("Arabic eval failed", err);
    } finally {
      setEvaluatingName(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-slate-600 font-medium">এআই ইন্টেলিজেন্স ও গভর্ন্যান্স হাব লোড হচ্ছে...</p>
      </div>
    );
  }

  const flags = data?.flags;
  const anomalies = data?.financialAnomalies?.anomalies || [];
  const pendingReviews = data?.pendingReviews || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">এআই ইন্টেলিজেন্স ও ডিসিশন-সাপোর্ট হাব</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                Phase 21
              </span>
            </div>
            <p className="text-sm text-slate-500">
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা • নীতি:{" "}
              <strong className="text-slate-800 font-bold">AI ASSISTS. AUTHORIZED HUMANS DECIDE.</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAIGovernance}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            রিফ্রেশ
          </button>
          <button
            onClick={handleToggleMasterAI}
            disabled={actionLoading}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl font-medium text-sm shadow-sm transition ${
              flags?.masterEnabled
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <Power className="w-4 h-4" />
            {flags?.masterEnabled ? "ইমার্জেন্সি AI বন্ধ করুন" : "AI চালু করুন"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              flags?.masterEnabled ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            }`}
          >
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI মাস্টার স্ট্যাটাস</div>
            <div className="text-xl font-bold text-slate-900">
              {flags?.masterEnabled ? "সক্রিয় (Active)" : "নিষ্ক্রিয় (Disabled)"}
            </div>
            <div className="text-xs text-slate-500 font-medium">ফলব্যাক: লোকাল ইঞ্জিন রেডি</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">হিউম্যান রিভিউ কিউ</div>
            <div className="text-xl font-bold text-slate-900">{pendingReviews.length} টি পেন্ডিং</div>
            <div className="text-xs text-amber-600 font-medium">মানবিক অনুমোদন আবশ্যক</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">আর্থিক অসঙ্গতি ফ্ল্যাগ</div>
            <div className="text-xl font-bold text-slate-900">{anomalies.length} টি সনাক্তকৃত</div>
            <div className="text-xs text-slate-500 font-medium">নন-অভিযোগমূলক নিরীক্ষা</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">আরবি বানান সহকারী</div>
            <div className="text-xl font-bold text-slate-900">সক্রিয়</div>
            <div className="text-xs text-purple-600 font-medium">ইসলামিক নাম অভিধান</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveTab("ASSISTANT")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "ASSISTANT"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          প্রশাসনিক এআই সহকারী
        </button>
        <button
          onClick={() => setActiveTab("ANOMALIES")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "ANOMALIES"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          অসঙ্গতি সনাক্তকরণ ({anomalies.length})
        </button>
        <button
          onClick={() => setActiveTab("HUMAN_REVIEW")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "HUMAN_REVIEW"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          হিউম্যান-ইন-দ্য-লুপ রিভিউ ({pendingReviews.length})
        </button>
        <button
          onClick={() => setActiveTab("ARABIC_NAME")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "ARABIC_NAME"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          আরবি নাম ও আবেদন মূল্যায়ন
        </button>
      </div>

      {/* TAB 1: ASSISTANT CHAT */}
      {activeTab === "ASSISTANT" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">অথরিটেটিভ ডেটা গ্রাউন্ডেড চ্যাট অ্যাসিস্ট্যান্ট</span>
            <div className="flex gap-2">
              <button
                onClick={() => setChatInput("এই মাসের সার্বিক আর্থিক স্থিতি ও ফান্ড ব্যালেন্সের সারাংশ দিন")}
                className="px-2.5 py-1 bg-white border rounded-lg text-slate-600 hover:bg-slate-100"
              >
                আর্থিক স্থিতি
              </button>
              <button
                onClick={() => setChatInput("আজকের ক্লাসের উপস্থিতি পরিস্থিতি কেমন?")}
                className="px-2.5 py-1 bg-white border rounded-lg text-slate-600 hover:bg-slate-100"
              >
                উপস্থিতি
              </button>
              <button
                onClick={() => setChatInput("সিস্টেম অপারেশনস ও ব্যাকআপ স্বাস্থ্য কেমন?")}
                className="px-2.5 py-1 bg-white border rounded-lg text-slate-600 hover:bg-slate-100"
              >
                অপারেশনস
              </button>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === "USER" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-xl rounded-2xl p-4 text-sm ${
                    msg.sender === "USER"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-900 border border-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs space-y-0.5">
                      <span className="font-semibold text-slate-500">প্রামাণ্য রেফারেন্স (Evidence):</span>
                      {msg.evidence.map((ev: string, i: number) => (
                        <div key={i} className="text-slate-600 font-mono text-[11px]">
                          • {ev}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            {querying && (
              <div className="flex items-center gap-2 text-slate-500 text-xs italic">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                তথ্য বিশ্লেষণ করা হচ্ছে...
              </div>
            )}
          </div>

          <form onSubmit={handleSendChat} className="p-3 border-t bg-slate-50 flex items-center gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="মাদরাসার তথ্য সংক্রান্ত যে কোনো প্রশ্ন লিখুন..."
              className="flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:border-indigo-600"
            />
            <button
              type="submit"
              disabled={querying || !chatInput.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              পাঠান
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: ANOMALIES */}
      {activeTab === "ANOMALIES" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">সনাক্তকৃত আর্থিক ও ডেটা অসঙ্গতিসমূহ</h3>
            <p className="text-xs text-slate-500">
              এআই কোনো ব্যক্তিকে অভিযুক্ত করে না; শুধুমাত্র সম্ভাব্য অসঙ্গতি চিহ্নিত করে মানবিক পর্যালোচনার আহ্বান জানায়।
            </p>
          </div>

          {anomalies.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 rounded-xl text-emerald-800">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
              <p className="font-bold">মাশাআল্লাহ! কোনো অস্বাভাবিক লেনদেন বা ডুপ্লিকেট ইনভয়েস প্যাটার্ন পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {anomalies.map((a: any, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{a.title}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                        {a.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{a.description}</p>
                    <div className="text-xs font-mono text-slate-500 bg-white p-2 rounded border">
                      প্রমাণ: {a.evidence}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HUMAN REVIEW */}
      {activeTab === "HUMAN_REVIEW" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">হিউম্যান-ইন-দ্য-লুপ অনুমোদন কিউ (Human Review Gate)</h3>
            <p className="text-xs text-slate-500">
              উচ্চ-ঝুঁকিপূর্ণ কোনো সিদ্ধান্ত এআই নিজে কার্যকর করতে পারবে না। অনুমোদিত অ্যাডমিনের ক্লিক ব্যতীত কোনো ডেটা মিউটেশন হবে না।
            </p>
          </div>

          {pendingReviews.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-600">
              <CheckCircle2 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-medium">বর্তমানে অনুমোদনের অপেক্ষায় কোনো এআই রিকমেন্ডেশন নেই।</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((r: any) => (
                <div key={r.reviewId} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-slate-400">{r.reviewId}</span>
                      <h4 className="font-bold text-sm text-slate-900">{r.proposedAction}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800">
                      {r.riskTier} RISK
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border">{r.recommendationSummary}</p>
                  <div className="text-[11px] text-slate-500">প্রমাণ: {r.supportingEvidence}</div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleReviewDecision(r.reviewId, "REJECTED")}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold"
                    >
                      প্রত্যাখ্যান করুন
                    </button>
                    <button
                      onClick={() => handleReviewDecision(r.reviewId, "APPROVED")}
                      disabled={actionLoading}
                      className="px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold"
                    >
                      অনুমোদন করুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ARABIC NAME & ADMISSION EVALUATOR */}
      {activeTab === "ARABIC_NAME" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">আরবি নাম রূপান্তর ও ভর্তি আবেদন মূল্যায়ন</h3>
            <p className="text-xs text-slate-500">
              বাংলা নামের সঠিক আরবি রসমুল খত (Orthography) প্রস্তাবনা ও আবেদনের স্বয়ংক্রিয় তথ্য পূর্ণতা যাচাই।
            </p>
          </div>

          <form onSubmit={handleEvaluateArabic} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">শিক্ষার্থীর বাংলা নাম</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">পিতার নাম</label>
              <input
                type="text"
                value={fatherNameInput}
                onChange={(e) => setFatherNameInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">অভিভাবকের মোবাইল</label>
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={evaluatingName}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm flex items-center gap-2"
              >
                <Languages className="w-4 h-4" />
                {evaluatingName ? "মূল্যায়ন হচ্ছে..." : "মূল্যায়ন ও আরবি বানান তৈরি করুন"}
              </button>
            </div>
          </form>

          {arabicResult && (
            <div className="mt-4 p-5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border">
                  <div className="text-xs text-slate-400 font-semibold uppercase">প্রস্তাবিত আরবি নাম</div>
                  <div className="text-2xl font-bold text-slate-900 font-arabic mt-1">
                    {arabicResult.arabicNameSuggestion || "مُحَمَّد"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    পিতার আরবি নাম: <span className="font-arabic font-bold text-slate-800">{arabicResult.arabicFatherNameSuggestion}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border">
                  <div className="text-xs text-slate-400 font-semibold uppercase">আবেদনের পূর্ণতা স্কোর</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    {arabicResult.completenessScore}%
                  </div>
                  <div className="text-xs text-slate-600 mt-1">{arabicResult.recommendationNote}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
