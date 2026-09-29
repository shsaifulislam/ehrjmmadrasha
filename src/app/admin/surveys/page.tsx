"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  Eye,
  BarChart2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  ShieldCheck,
  RefreshCw,
  GitBranch,
  X,
  Trash2,
  Lock,
} from "lucide-react";
import { Survey, SurveyStatus, SurveyType, ResponseMode, QuestionType } from "@/lib/surveys/types";

export default function AdminSurveysCockpitPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Modal / Creator State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    titleBn: "",
    titleEn: "",
    descriptionBn: "",
    surveyType: "GUARDIAN_SURVEY" as SurveyType,
    audienceType: "ALL_GUARDIANS",
    responseMode: "PSEUDONYMOUS" as ResponseMode,
    isPublic: false,
    questions: [
      {
        id: "Q1",
        textBn: "মাদরাসার সার্বিক দ্বীনি পরিবেশ ও শিক্ষা মান কেমন?",
        textEn: "How is the academic quality and environment?",
        type: "RATING_SCALE" as QuestionType,
        required: true,
        displayOrder: 1,
      },
    ],
  });

  const loadSurveys = () => {
    setLoading(true);
    fetch("/api/surveys")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSurveys(data.data || []);
        }
      })
      .catch((err) => console.error("Error loading surveys:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  // Filtered surveys
  const filteredSurveys = surveys.filter((s) => {
    const matchesSearch =
      s.titleBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchesType = typeFilter === "ALL" || s.surveyType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate high-level KPIs
  const totalSurveys = surveys.length;
  const activeSurveys = surveys.filter((s) => s.status === "OPEN" || s.status === "PUBLISHED").length;
  const totalResponses = surveys.reduce((sum, s) => sum + (s.responseCount || 0), 0);
  const completedResponses = surveys.reduce((sum, s) => sum + (s.completionCount || 0), 0);

  const handleAddQuestion = () => {
    const nextIndex = newSurvey.questions.length + 1;
    setNewSurvey((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `Q${nextIndex}`,
          textBn: `নতুন প্রশ্ন ${nextIndex}`,
          textEn: `New Question ${nextIndex}`,
          type: "RATING_SCALE",
          required: true,
          displayOrder: nextIndex,
        },
      ],
    }));
  };

  const handleCreateSurvey = async () => {
    if (!newSurvey.titleBn || !newSurvey.titleEn) {
      alert("অনুগ্রহ করে জরিপের বাংলা ও ইংরেজি শিরোনাম পূরণ করুন");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleBn: newSurvey.titleBn,
          titleEn: newSurvey.titleEn,
          descriptionBn: newSurvey.descriptionBn,
          surveyType: newSurvey.surveyType,
          audience: {
            type: newSurvey.audienceType,
          },
          responseMode: newSurvey.responseMode,
          isPublic: newSurvey.isPublic,
          questions: newSurvey.questions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create survey");
      }

      setShowCreateModal(false);
      loadSurveys();
    } catch (err: any) {
      alert(err.message || "জরিপ তৈরিতে সমস্যা হয়েছে।");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Cockpit Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-2">
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>প্রাতিষ্ঠানিক জরিপ ও জনমত ককপিট • Phase 37</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              জরিপ ও মূল্যায়ন ব্যবস্থাপনা
            </h1>
            <p className="text-sm text-slate-600">
              অভিভাবক, শিক্ষক, শিক্ষার্থী ও শুভানুধ্যায়ীদের মতামত গ্রহণ, বিশ্লেষণ এবং প্রাতিষ্ঠানিক সংস্কার ট্র্যাকিং।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadSurveys}
              className="p-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors text-sm"
              title="রিফ্রেশ"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন জরিপ তৈরি (Builder)</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-500">মোট জরিপ (Total Surveys)</span>
            <div className="text-2xl font-black text-slate-900">{totalSurveys}</div>
            <span className="text-xs text-slate-400">সকল বিভাগ ও স্তর মিলিয়ে</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-emerald-700">সক্রিয় ও উন্মুক্ত জরিপ</span>
            <div className="text-2xl font-black text-emerald-600">{activeSurveys}</div>
            <span className="text-xs text-slate-400">বর্তমানে মতামত গ্রহণ চলছে</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-blue-700">মোট প্রতিক্রিয়া দাখিল</span>
            <div className="text-2xl font-black text-blue-600">{totalResponses}</div>
            <span className="text-xs text-slate-400">সম্পন্ন: {completedResponses} টি</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-purple-700">সুরক্ষা ও সত্যতা নীতি</span>
            <div className="text-sm font-bold text-purple-900 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>ফলাফল কোনো একাডেমিক সিদ্ধান্ত বদলায় না</span>
            </div>
            <span className="text-[11px] text-slate-500">মানুষের বিবেচনা প্রাধান্য পায়</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="জরিপের নাম বা আইডি খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">সকল স্ট্যাটাস</option>
              <option value="OPEN">চলমান (OPEN)</option>
              <option value="DRAFT">খসড়া (DRAFT)</option>
              <option value="PUBLISHED">প্রকাশিত (PUBLISHED)</option>
              <option value="CLOSED">সমাপ্ত (CLOSED)</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">সকল ধরন</option>
              <option value="GUARDIAN_SURVEY">অভিভাবক জরিপ</option>
              <option value="EVENT_FEEDBACK">ইভেন্ট প্রতিক্রিয়া</option>
              <option value="ADMISSION_FEEDBACK">ভর্তি অভিজ্ঞতা</option>
              <option value="ALUMNI_SURVEY">অ্যালামনাই জরিপ</option>
              <option value="SATISFACTION">সাধারণ সন্তুষ্টি</option>
            </select>
          </div>
        </div>

        {/* Survey Master Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">জরিপ শিরোনাম ও আইডি</th>
                  <th className="px-6 py-4">ধরন ও অডিয়েন্স</th>
                  <th className="px-6 py-4">সংস্করণ ও মোড</th>
                  <th className="px-6 py-4">প্রতিক্রিয়া</th>
                  <th className="px-6 py-4">স্ট্যাটাস</th>
                  <th className="px-6 py-4 text-right">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : filteredSurveys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      কোনো জরিপ পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredSurveys.map((survey) => (
                    <tr key={survey.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 leading-snug">
                          {survey.titleBn}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {survey.id}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {survey.surveyType}
                        </span>
                        <div className="text-xs text-slate-500 mt-1">
                          {survey.audience.type}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700">
                          <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                          <span>v{survey.version}</span>
                          {survey.isVersionLocked && (
                            <span title="লকড সংস্করণ">
                              <Lock className="w-3 h-3 text-amber-600" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {survey.responseMode}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-black text-slate-900 text-sm">
                          {survey.responseCount} জন
                        </div>
                        <div className="text-xs text-slate-400">
                          প্রশ্ন: {survey.questions.length} টি
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
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
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/surveys/${survey.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>বিশ্লেষণ ও বিবরণ</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Survey Builder Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    নতুন প্রাতিষ্ঠানিক জরিপ তৈরি (Survey Builder)
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    জরিপের শিরোনাম (বাংলা) *
                  </label>
                  <input
                    type="text"
                    value={newSurvey.titleBn}
                    onChange={(e) => setNewSurvey({ ...newSurvey, titleBn: e.target.value })}
                    placeholder="যেমন: অভিভাবক সন্তুষ্টি মূল্যায়ন ২০২৬"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    জরিপের শিরোনাম (English) *
                  </label>
                  <input
                    type="text"
                    value={newSurvey.titleEn}
                    onChange={(e) => setNewSurvey({ ...newSurvey, titleEn: e.target.value })}
                    placeholder="e.g. Annual Guardian Satisfaction Survey 2026"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      জরিপের ধরন (Survey Type)
                    </label>
                    <select
                      value={newSurvey.surveyType}
                      onChange={(e) => setNewSurvey({ ...newSurvey, surveyType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="GUARDIAN_SURVEY">অভিভাবক জরিপ</option>
                      <option value="TEACHER_SURVEY">শিক্ষক মতামত</option>
                      <option value="EVENT_FEEDBACK">ইভেন্ট প্রতিক্রিয়া</option>
                      <option value="ADMISSION_FEEDBACK">ভর্তি অভিজ্ঞতা</option>
                      <option value="ALUMNI_SURVEY">অ্যালামনাই জরিপ</option>
                      <option value="SATISFACTION">সাধারণ সন্তুষ্টি</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      গোপনীয়তা মোড (Response Mode)
                    </label>
                    <select
                      value={newSurvey.responseMode}
                      onChange={(e) => setNewSurvey({ ...newSurvey, responseMode: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="PSEUDONYMOUS">ছদ্মনামযুক্ত (সুরক্ষিত)</option>
                      <option value="ANONYMOUS">সম্পূর্ণ বেনামী (কারিগরি গোপন)</option>
                      <option value="IDENTIFIED">পরিচিত (নাম ও আইডি সংরক্ষিত)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    লক্ষ্যমাত্রা অডিয়েন্স (Target Audience)
                  </label>
                  <select
                    value={newSurvey.audienceType}
                    onChange={(e) => setNewSurvey({ ...newSurvey, audienceType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL_GUARDIANS">সকল সক্রিয় অভিভাবক</option>
                    <option value="TEACHERS">সকল সম্মানিত শিক্ষক</option>
                    <option value="ALUMNI">প্রাক্তন শিক্ষার্থী পরিষদ</option>
                    <option value="PUBLIC">উন্মুক্ত সাধারণ জনতা</option>
                  </select>
                </div>

                {/* Questions Builder */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      প্রশ্নাবলী কনফিগারেশন ({newSurvey.questions.length} টি)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>প্রশ্ন যুক্ত করুন</span>
                    </button>
                  </div>

                  {newSurvey.questions.map((q, idx) => (
                    <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span>প্রশ্ন {idx + 1}</span>
                        {newSurvey.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setNewSurvey((prev) => ({
                                ...prev,
                                questions: prev.questions.filter((_, i) => i !== idx),
                              }))
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={q.textBn}
                        onChange={(e) => {
                          const updated = [...newSurvey.questions];
                          updated[idx].textBn = e.target.value;
                          setNewSurvey({ ...newSurvey, questions: updated });
                        }}
                        placeholder="প্রশ্নের বিবরণ (বাংলা)"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={handleCreateSurvey}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {creating ? "সংরক্ষণ হচ্ছে..." : "খসড়া হিসেবে সংরক্ষণ করুন"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
