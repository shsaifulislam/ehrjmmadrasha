"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ClipboardCheck,
  ArrowLeft,
  GitBranch,
  Lock,
  CheckCircle,
  Clock,
  EyeOff,
  BarChart2,
  Users,
  ShieldCheck,
  Sparkles,
  Ticket,
  Plus,
  RefreshCw,
  AlertTriangle,
  Send,
  Building,
  HelpCircle,
} from "lucide-react";
import {
  Survey,
  SurveyStatus,
  SurveyAnalytics,
  SurveyAction,
  SanitizedSurveyResponse,
} from "@/lib/surveys/types";

export default function AdminSurveyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params?.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [responses, setResponses] = useState<SanitizedSurveyResponse[]>([]);
  const [actions, setActions] = useState<SurveyAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"analytics" | "responses" | "actions" | "questions">("analytics");

  // Action creation / helpdesk state
  const [showActionModal, setShowActionModal] = useState(false);
  const [newAction, setNewAction] = useState({
    findingBn: "",
    findingEn: "",
    priority: "NORMAL" as any,
    ownerName: "হোস্টেল সুপারিনটেনডেন্ট",
    assignedRole: "STAFF",
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    evidenceDescription: "",
  });
  const [processingAction, setProcessingAction] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/surveys/${surveyId}`).then((r) => r.json()),
      fetch(`/api/surveys/${surveyId}/analytics`).then((r) => r.json()),
      fetch(`/api/surveys/${surveyId}/responses`).then((r) => r.json()),
      fetch(`/api/surveys/${surveyId}/actions`).then((r) => r.json()),
    ])
      .then(([surveyRes, analyticsRes, responsesRes, actionsRes]) => {
        if (surveyRes.success) setSurvey(surveyRes.data);
        if (analyticsRes.success) setAnalytics(analyticsRes.data);
        if (responsesRes.success) setResponses(responsesRes.data || []);
        if (actionsRes.success) setActions(actionsRes.data || []);
      })
      .catch((err) => console.error("Error loading survey details:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (surveyId) loadAll();
  }, [surveyId]);

  const handleStatusChange = async (newStatus: SurveyStatus) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Status update failed");
      }
      loadAll();
    } catch (err: any) {
      alert(err.message || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।");
    }
  };

  const handleCreateNewVersion = async () => {
    if (!confirm("আপনি কি এই জরিপটির নতুন একটি সংস্করণ (v" + ((survey?.version || 1) + 1) + ") তৈরি করতে চান?")) {
      return;
    }
    try {
      const res = await fetch(`/api/surveys/${surveyId}/version`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create new version");
      }
      router.push(`/admin/surveys/${data.data.id}`);
    } catch (err: any) {
      alert(err.message || "নতুন সংস্করণ তৈরিতে সমস্যা হয়েছে।");
    }
  };

  const handleCreateAction = async () => {
    if (!newAction.findingBn || !newAction.ownerName) {
      alert("চিহ্নিত বিষয় এবং দায়িত্বপ্রাপ্ত ব্যক্তির নাম লিখুন");
      return;
    }
    setProcessingAction(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAction),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Action creation failed");
      }
      setShowActionModal(false);
      loadAll();
    } catch (err: any) {
      alert(err.message || "পদক্ষেপ তৈরিতে সমস্যা হয়েছে।");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleConvertToHelpdesk = async (actionId: string) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONVERT_TO_HELPDESK",
          actionId,
          categoryCode: "GENERAL",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Helpdesk ticket creation failed");
      }
      alert(`হেল্পডেস্ক টিকিট সফলভাবে তৈরি হয়েছে: ${data.data.ticketNumber}`);
      loadAll();
    } catch (err: any) {
      alert(err.message || "হেল্পডেস্ক টিকিট তৈরিতে ত্রুটি।");
    }
  };

  const handleActionStatusChange = async (actionId: string, status: string) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATUS",
          actionId,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Status update failed");
      }
      loadAll();
    } catch (err: any) {
      alert(err.message || "পদক্ষেপের স্ট্যাটাস হালনাগাদ ব্যর্থ হয়েছে।");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">জরিপ ও অ্যানালিটিক্স লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation back */}
        <Link
          href="/admin/surveys"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>জরিপ ও জনমত ককপিটে ফিরুন</span>
        </Link>

        {/* Survey Command Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {survey.surveyType}
                </span>
                <span className="font-mono text-slate-400">ID: {survey.id}</span>
                <span className="flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                  <span>v{survey.version}</span>
                  {survey.isVersionLocked && (
                    <span title="প্রশ্নমালা লকড">
                      <Lock className="w-3 h-3 text-amber-600" />
                    </span>
                  )}
                </span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full ${
                    survey.status === "OPEN"
                      ? "bg-emerald-100 text-emerald-800"
                      : survey.status === "PUBLISHED"
                      ? "bg-blue-100 text-blue-800"
                      : survey.status === "DRAFT"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {survey.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {survey.titleBn}
              </h1>
              <p className="text-sm text-slate-500 font-mono">{survey.titleEn}</p>
              <p className="text-sm text-slate-600 max-w-3xl">{survey.descriptionBn}</p>
            </div>

            {/* Quick Transition & Versioning Controls */}
            <div className="flex flex-wrap lg:flex-col items-end gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                {survey.status === "DRAFT" && (
                  <button
                    onClick={() => handleStatusChange("REVIEW")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                  >
                    পর্যালোচনায় পাঠান (Send for Review)
                  </button>
                )}
                {survey.status === "REVIEW" && (
                  <button
                    onClick={() => handleStatusChange("APPROVED")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                  >
                    অনুমোদন করুন (Approve)
                  </button>
                )}
                {survey.status === "APPROVED" && (
                  <button
                    onClick={() => handleStatusChange("PUBLISHED")}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                  >
                    প্রকাশ করুন (Publish)
                  </button>
                )}
                {survey.status === "PUBLISHED" && (
                  <button
                    onClick={() => handleStatusChange("OPEN")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                  >
                    মতামত গ্রহণ উন্মুক্ত করুন (Open Survey)
                  </button>
                )}
                {survey.status === "OPEN" && (
                  <button
                    onClick={() => handleStatusChange("CLOSED")}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                  >
                    জরিপ সমাপ্ত করুন (Close)
                  </button>
                )}
                {survey.status === "CLOSED" && (
                  <button
                    onClick={() => handleStatusChange("ANALYZING")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                  >
                    বিশ্লেষণ শুরু (Analyze)
                  </button>
                )}
              </div>

              {/* Version branching button */}
              <button
                onClick={handleCreateNewVersion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
              >
                <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                <span>নতুন সংস্করণ তৈরি (Create v{survey.version + 1})</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div>
              <span className="text-xs text-slate-400 font-medium">প্রতিক্রিয়া সংখ্যা</span>
              <div className="text-xl font-black text-slate-900">
                {survey.responseCount} জন
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">সম্পূর্ণতার হার</span>
              <div className="text-xl font-black text-emerald-600">
                {analytics?.completionRate || 0}%
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">সন্তুষ্টি সূচক (CSAT)</span>
              <div className="text-xl font-black text-blue-600">
                {analytics?.averageSatisfactionIndex || 0}%
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">উন্নয়ন পদক্ষেপ</span>
              <div className="text-xl font-black text-purple-600">
                {actions.length} টি
              </div>
            </div>
          </div>
        </div>

        {/* Deep-dive Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "analytics"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>অ্যানালিটিক্স ও ফলাফল</span>
          </button>

          <button
            onClick={() => setActiveTab("responses")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "responses"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>প্রতিক্রিয়া তালিকা ({responses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("actions")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "actions"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>উন্নয়ন পদক্ষেপ ও হেল্পডেস্ক ({actions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("questions")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "questions"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>প্রশ্নমালা ও অডিয়েন্স ({survey.questions.length})</span>
          </button>
        </div>

        {/* Tab 1: Analytics & Distributions */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Small group protection notification */}
            {analytics?.isSmallGroupSuppressed && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-center gap-3 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  <strong>ক্ষুদ্র-দলীয় সুরক্ষা নীতি (Small-Group Protection):</strong> অংশগ্রহণকারী ৫ জনের কম হওয়ায় কোনো সূক্ষ্ম ডেমোগ্রাফিক বা বিভাগীয় ফিল্টারিং নিষ্ক্রিয় রাখা হয়েছে যাতে অংশগ্রহণকারীর পরিচয় গোপন থাকে।
                </span>
              </div>
            )}

            {/* Bounded AI Qualitative Theme Banner */}
            {analytics?.qualitativeThemes && analytics.qualitativeThemes.length > 0 && (
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-bold">গুণগত মূলভাব ও মতামত ক্লাস্টার</h3>
                  </div>
                  <span className="text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full">
                    AI-generated analysis — human review required
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  অংশগ্রহণকারীদের মুক্ত টেক্সট ও মন্তব্যসমূহের সারসংক্ষেপ। এটি সিদ্ধান্ত গ্রহণের সহায়ক উপকরণ; চূড়ান্ত সিদ্ধান্তের জন্য সংশ্লিষ্ট পর্যালোচনা আবশ্যক।
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {analytics.qualitativeThemes.map((theme, i) => (
                    <div key={i} className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400">{theme.category}</span>
                        <span className="text-slate-400 font-mono">{theme.frequency} টি মন্তব্য</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100">{theme.themeBn}</h4>
                      {theme.sampleQuotes && theme.sampleQuotes.length > 0 && (
                        <p className="text-xs text-slate-400 italic">"{theme.sampleQuotes[0]}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question by Question Analytics Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                প্রশ্নভিত্তিক প্রতিক্রিয়া ও বিতরণ
              </h3>
              {analytics?.questions.map((q, idx) => (
                <div key={q.questionId} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{q.questionTextBn}</h4>
                    </div>
                    {q.averageRating && (
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 w-fit">
                        গড় রেটিং: {q.averageRating} / ৫
                      </span>
                    )}
                  </div>

                  {q.distribution && (
                    <div className="space-y-2 pt-2">
                      {q.distribution.map((dist, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-700 font-medium">
                            <span>{dist.labelBn}</span>
                            <span className="font-bold">{dist.count} জন ({dist.percentage}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${dist.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Responses List */}
        {activeTab === "responses" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>মোট সংগৃহীত প্রতিক্রিয়া: {responses.length} টি</span>
              <span className="font-semibold text-emerald-800">
                গোপনীয়তা নিশ্চিতকরণ: {survey.responseMode}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">রেসপন্স আইডি</th>
                    <th className="px-6 py-3">অংশগ্রহণকারী</th>
                    <th className="px-6 py-3">মোড</th>
                    <th className="px-6 py-3">দাখিলের তারিখ</th>
                    <th className="px-6 py-3">উত্তর সংখ্যা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {responses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        কোনো প্রতিক্রিয়া এখনও পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    responses.map((resp) => (
                      <tr key={resp.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-800">
                          {resp.id}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-900">
                            {resp.respondentName || (resp.responseMode === "ANONYMOUS" ? "সম্পূর্ণ বেনামী" : "ছদ্মনামযুক্ত")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                            {resp.responseMode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {resp.submittedAt ? new Date(resp.submittedAt).toLocaleDateString("bn-BD") : "খসড়া"}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-700">
                          {resp.answers.length} টি উত্তর
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Improvement Actions & Helpdesk */}
        {activeTab === "actions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  জরিপ পরবর্তী প্রাতিষ্ঠানিক উন্নয়ন পদক্ষেপ
                </h3>
                <p className="text-xs text-slate-500">
                  মতামত ও অভিযোগের ভিত্তিতে গৃহীত পদক্ষেপ ও হেল্পডেস্ক সমন্বয়।
                </p>
              </div>
              <button
                onClick={() => setShowActionModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন পদক্ষেপ গ্রহণ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {actions.length === 0 ? (
                <div className="col-span-2 bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
                  <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">এখনও কোনো উন্নয়ন পদক্ষেপ নেওয়া হয়নি</p>
                  <p className="text-xs text-slate-400">জরিপের ফলাফলের ভিত্তিতে নতুন পদক্ষেপ যুক্ত করুন।</p>
                </div>
              ) : (
                actions.map((act) => (
                  <div key={act.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-400 font-bold">{act.id}</span>
                        <span className="px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {act.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 leading-snug">{act.findingBn}</h4>
                      <p className="text-xs text-slate-500">দায়িত্বপ্রাপ্ত: {act.ownerName} ({act.assignedRole})</p>
                      <p className="text-xs text-slate-400">নির্ধারিত তারিখ: {act.dueDate}</p>

                      {act.helpdeskTicketId && (
                        <div className="mt-2 text-xs font-mono bg-blue-50 text-blue-800 p-2 rounded-xl border border-blue-200 flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5 text-blue-600" />
                          <span>সংযুক্ত হেল্পডেস্ক টিকিট: {act.helpdeskTicketId}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                      {!act.helpdeskTicketId ? (
                        <button
                          onClick={() => handleConvertToHelpdesk(act.id)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-lg border border-blue-200 flex items-center gap-1"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>হেল্পডেস্কে প্রেরণ</span>
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>টিকিট সক্রিয়</span>
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        {act.status !== "COMPLETED" && (
                          <button
                            onClick={() => handleActionStatusChange(act.id, "COMPLETED")}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200"
                          >
                            সম্পন্ন মার্ক করুন
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Questions & Audience */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900">টার্গেট অডিয়েন্স স্ন্যাপশট</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">অডিয়েন্স ধরন</span>
                  <span className="font-bold text-slate-800">{survey.audience.type}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">লক্ষ্যমাত্রা সংখ্যা</span>
                  <span className="font-bold text-slate-800">{survey.audienceSnapshot?.targetCount || "উন্মুক্ত"}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">স্ন্যাপশট সময়</span>
                  <span className="font-bold text-slate-800">
                    {survey.audienceSnapshot?.snapshotTimestamp
                      ? new Date(survey.audienceSnapshot.snapshotTimestamp).toLocaleDateString("bn-BD")
                      : "নির্ধারিত হয়নি"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900">জরিপের প্রশ্নমালা ({survey.questions.length} টি)</h3>
              {survey.questions.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400">প্রশ্ন {idx + 1} ({q.type})</span>
                    {q.required && <span className="text-red-500 font-bold">* আবশ্যক</span>}
                  </div>
                  <h4 className="font-bold text-slate-900">{q.textBn}</h4>
                  <p className="text-xs text-slate-400">{q.textEn}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Action Modal */}
        {showActionModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900">নতুন উন্নয়নমূলক পদক্ষেপ গ্রহণ</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">চিহ্নিত বিষয় / প্রস্তাবনা (বাংলা) *</label>
                  <textarea
                    rows={3}
                    value={newAction.findingBn}
                    onChange={(e) => setNewAction({ ...newAction, findingBn: e.target.value })}
                    placeholder="যেমন: হোস্টেল ডাইনিং এ বিকালের খাদ্যতালিকা সংস্কার"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">দায়িত্বপ্রাপ্ত কর্মকর্তার নাম / পদবী *</label>
                  <input
                    type="text"
                    value={newAction.ownerName}
                    onChange={(e) => setNewAction({ ...newAction, ownerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">বাস্তবায়নের শেষ তারিখ *</label>
                  <input
                    type="date"
                    value={newAction.dueDate}
                    onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={processingAction}
                  onClick={handleCreateAction}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
