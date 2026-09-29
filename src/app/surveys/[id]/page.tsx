"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ClipboardCheck,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Send,
  Save,
  Star,
  ShieldCheck,
  EyeOff,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { Survey, SurveyQuestion } from "@/lib/surveys/types";

export default function TakeSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params?.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState<any | null>(null);
  const [saveDraftMessage, setSaveDraftMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!surveyId) return;
    fetch(`/api/surveys/${surveyId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSurvey(data.data);
        } else {
          setError(data.error || "জরিপটি খুঁজে পাওয়া যায়নি বা এটি সক্রিয় নয়।");
        }
      })
      .catch((err) => {
        console.error("Error loading survey:", err);
        setError("সার্ভার সংযোগে ত্রুটি দেখা দিয়েছে।");
      })
      .finally(() => setLoading(false));
  }, [surveyId]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Evaluate conditional visibility for question in client form
  const isQuestionVisibleClient = (q: SurveyQuestion): boolean => {
    if (!q.conditionalRules || q.conditionalRules.length === 0) return true;

    for (const rule of q.conditionalRules) {
      const parentVal = answers[rule.questionId];
      let conditionMet = false;

      switch (rule.operator) {
        case "EQUALS":
          conditionMet = parentVal === rule.value;
          break;
        case "NOT_EQUALS":
          conditionMet = parentVal !== rule.value;
          break;
        case "CONTAINS":
          conditionMet = Array.isArray(parentVal) && parentVal.includes(rule.value);
          break;
        case "LESS_THAN_OR_EQUAL":
          conditionMet = typeof parentVal === "number" && parentVal <= rule.value;
          break;
        case "GREATER_THAN_OR_EQUAL":
          conditionMet = typeof parentVal === "number" && parentVal >= rule.value;
          break;
        default:
          conditionMet = false;
      }

      if (rule.action === "SHOW" && !conditionMet) return false;
      if (rule.action === "HIDE" && conditionMet) return false;
    }
    return true;
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!survey) return;
    setIsSubmitting(true);
    setError(null);
    setSaveDraftMessage(null);

    const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
      questionId: qId,
      answerValue: val,
      numericValue: typeof val === "number" ? val : undefined,
      textValue: typeof val === "string" ? val : undefined,
      booleanValue: typeof val === "boolean" ? val : undefined,
      selectedOptionIds: Array.isArray(val) ? val : typeof val === "string" ? [val] : undefined,
    }));

    try {
      const res = await fetch(`/api/surveys/${survey.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: formattedAnswers,
          isDraft,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "প্রতিক্রিয়া দাখিলে ত্রুটি হয়েছে");
      }

      if (isDraft) {
        setSaveDraftMessage("খসড়া সফলভাবে সংরক্ষিত হয়েছে। আপনি পরবর্তীতে এসে বাকি অংশ পূরণ করতে পারবেন।");
      } else {
        setSubmittedResponse(data.data);
      }
    } catch (err: any) {
      setError(err.message || "দাখিল করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">জরিপ তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-red-200 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">জরিপ পাওয়া যায়নি</h2>
          <p className="text-sm text-slate-600">{error}</p>
          <Link
            href="/surveys"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>সকল জরিপ তালিকায় ফিরুন</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  // Completion confirmation view
  if (submittedResponse) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-emerald-200 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              জরিপ দাখিল নিশ্চিতকরণ
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">
              আপনার মূল্যবান মতামত সফলভাবে গৃহীত হয়েছে
            </h1>
            <p className="text-sm text-slate-600">
              জাযাকাল্লাহু খাইরান। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার উন্নয়ন ও সেবার মানোন্নয়নে আপনার প্রতিটি পরামর্শ গুরুত্বের সাথে বিবেচনা করা হবে।
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 font-mono text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">রেফারেন্স আইডি:</span>
              <span className="font-bold text-slate-800">{submittedResponse.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">জরিপ শিরোনাম:</span>
              <span className="text-slate-800 font-sans">{survey.titleBn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">গোপনীয়তা মোড:</span>
              <span className="text-emerald-700 font-semibold">{survey.responseMode}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/surveys"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-emerald-600/20"
            >
              অন্যান্য জরিপ দেখুন
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
            >
              মূল ওয়েবসাইটে ফিরুন
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active form view
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation back */}
        <Link
          href="/surveys"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>জরিপ তালিকায় ফিরুন</span>
        </Link>

        {/* Survey Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              {survey.surveyType}
            </span>
            <div className="flex items-center gap-2 text-xs">
              {survey.responseMode === "ANONYMOUS" ? (
                <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>সম্পূর্ণ বেনামী জরিপ</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>সুরক্ষিত ও ছদ্মনামযুক্ত</span>
                </span>
              )}
              <span className="text-slate-400 font-mono">v{survey.version}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {survey.titleBn}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {survey.descriptionBn}
          </p>

          {survey.instructionsBn && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{survey.instructionsBn}</span>
            </div>
          )}
        </div>

        {/* Error / Alert banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {saveDraftMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-2xl flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{saveDraftMessage}</span>
          </div>
        )}

        {/* Questions Form */}
        <div className="space-y-6">
          {survey.questions.map((question, index) => {
            const visible = isQuestionVisibleClient(question);
            if (!visible) return null;

            const currentVal = answers[question.id];

            return (
              <div
                key={question.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 hover:border-emerald-300 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {question.textBn}
                      {question.required && (
                        <span className="text-red-500 ml-1 font-normal">*</span>
                      )}
                    </h3>
                  </div>
                  {question.helpTextBn && (
                    <p className="text-xs text-slate-500 ml-8">{question.helpTextBn}</p>
                  )}
                </div>

                <div className="pt-2 ml-1 sm:ml-8">
                  {/* 1. Rating Scale (1 to 5) */}
                  {question.type === "RATING_SCALE" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isSelected = currentVal >= star;
                          return (
                            <button
                              type="button"
                              key={star}
                              onClick={() => handleAnswerChange(question.id, star)}
                              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold text-sm transition-all ${
                                isSelected
                                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-105"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              <Star className={`w-4 h-4 ${isSelected ? "fill-white" : ""}`} />
                              <span className="text-xs mt-0.5">{star}</span>
                            </button>
                          );
                        })}
                      </div>
                      {question.scaleLabels && (
                        <div className="flex justify-between text-xs text-slate-500 max-w-xs font-medium">
                          <span>{question.scaleLabels.minLabelBn}</span>
                          <span>{question.scaleLabels.maxLabelBn}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Likert Scale or Single Choice */}
                  {(question.type === "LIKERT_SCALE" || question.type === "SINGLE_CHOICE") && (
                    <div className="space-y-2.5">
                      {question.options?.map((opt) => {
                        const isChecked = currentVal === opt.id || currentVal === opt.textBn;
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer text-sm transition-all ${
                              isChecked
                                ? "bg-emerald-50/70 border-emerald-400 text-emerald-900 font-semibold"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              checked={isChecked}
                              onChange={() => handleAnswerChange(question.id, opt.id)}
                              className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span>{opt.textBn}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* 3. Multiple Choice */}
                  {question.type === "MULTIPLE_CHOICE" && (
                    <div className="space-y-2.5">
                      {question.options?.map((opt) => {
                        const currentArr: string[] = Array.isArray(currentVal) ? currentVal : [];
                        const isChecked = currentArr.includes(opt.id);

                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer text-sm transition-all ${
                              isChecked
                                ? "bg-emerald-50/70 border-emerald-400 text-emerald-900 font-semibold"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleAnswerChange(question.id, [...currentArr, opt.id]);
                                } else {
                                  handleAnswerChange(
                                    question.id,
                                    currentArr.filter((id) => id !== opt.id)
                                  );
                                }
                              }}
                              className="text-emerald-600 focus:ring-emerald-500 rounded h-4 w-4"
                            />
                            <span>{opt.textBn}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* 4. Yes / No */}
                  {question.type === "YES_NO" && (
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleAnswerChange(question.id, true)}
                        className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                          currentVal === true
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        হ্যাঁ (Yes)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAnswerChange(question.id, false)}
                        className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                          currentVal === false
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        না (No)
                      </button>
                    </div>
                  )}

                  {/* 5. Short Text */}
                  {question.type === "SHORT_TEXT" && (
                    <input
                      type="text"
                      value={currentVal || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="আপনার উত্তর লিখুন..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800"
                    />
                  )}

                  {/* 6. Long Text */}
                  {question.type === "LONG_TEXT" && (
                    <div className="space-y-1">
                      <textarea
                        rows={4}
                        value={currentVal || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="আপনার বিস্তারিত মতামত ও পরামর্শ লিখুন..."
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 resize-y"
                      ></textarea>
                      <p className="text-right text-xs text-slate-400">
                        {String(currentVal || "").length} অক্ষর
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>খসড়া সংরক্ষণ (Save Draft)</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? "দাখিল হচ্ছে..." : "চূড়ান্তভাবে দাখিল করুন (Submit Feedback)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
