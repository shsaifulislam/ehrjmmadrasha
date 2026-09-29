"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Trophy,
  ArrowLeft,
  Share2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Star,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { InstitutionalEvent, EventCompetitionResult } from "@/lib/events/types";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function PublicEventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<InstitutionalEvent | null>(null);
  const [results, setResults] = useState<EventCompetitionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    Promise.all([
      fetch(`/api/events/${eventId}`),
      fetch(`/api/events/${eventId}/results?role=PUBLIC`),
    ])
      .then(async ([evtRes, resRes]) => {
        const evtData = await evtRes.json();
        const resData = await resRes.json();
        if (evtData.success) setEvent(evtData.data);
        if (resData.success) setResults(resData.data || []);
      })
      .catch((err) => console.error("Error loading event detail:", err))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComments.trim()) return;

    setSubmittingFeedback(true);
    try {
      const res = await fetch(`/api/events/${eventId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: feedbackRating,
          commentsBn: feedbackComments,
          isAnonymous: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSuccess(true);
        setFeedbackComments("");
      }
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-sm text-gray-500">ইভেন্ট তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">ইভেন্টটি পাওয়া যায়নি</h2>
          <p className="text-xs text-gray-600 mb-4">
            অনুরোধকৃত ইভেন্টটি ড্রাফট অবস্থায় রয়েছে অথবা সিস্টেমে বিদ্যমান নেই।
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 bg-[#083B25] text-white text-xs font-semibold px-4 py-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" /> ইভেন্ট তালিকায় ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const isRegistrationOpen = event.status === "REGISTRATION_OPEN";
  const remainingCapacity =
    event.maxCapacity > 0 ? Math.max(0, event.maxCapacity - event.registeredCount) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/20 via-white to-gray-50 text-gray-800">
      {/* Top Breadcrumb Header */}
      <div className="bg-[#083B25] text-white py-8 px-4 md:px-8 border-b border-emerald-800">
        <div className="max-w-4xl mx-auto space-y-3">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> সকল ইভেন্ট তালিকা
          </Link>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-800 text-[#C59B27] px-2.5 py-0.5 rounded border border-emerald-600/50">
              {event.typeCode.replace("_", " ")}
            </span>
            <span className="text-xs text-emerald-300 font-mono">{event.id}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {event.titleBn}
          </h1>
          {event.titleEn && (
            <p className="text-sm text-emerald-100 italic">{event.titleEn}</p>
          )}
        </div>
      </div>

      {/* Main Body */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Info Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-700" /> তারিখ ও সময়সূচি
            </h3>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-start gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">অনুষ্ঠান শুরু:</span>{" "}
                  {startDate.toLocaleDateString("bn-BD", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  ({startDate.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })})
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">অনুষ্ঠান সমাপ্তি:</span>{" "}
                  {endDate.toLocaleDateString("bn-BD", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  ({endDate.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })})
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" /> ভেন্যু ও আয়োজন
            </h3>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">নির্ধারিত স্থান:</span> {event.venueText}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">আয়োজক বিভাগ:</span> {event.organizer}
                </div>
              </div>
              {event.contactPhone && (
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-900">যোগাযোগ:</span> {event.contactPhone}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description & Instructions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900">ইভেন্টের বিস্তারিত বিবরণ</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {event.descriptionBn}
          </p>

          {event.instructionsBn && (
            <div className="mt-4 p-4 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
              <h4 className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> নির্দেশিকা ও অংশগ্রহণের নিয়মাবলী
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed whitespace-pre-line">
                {event.instructionsBn}
              </p>
            </div>
          )}
        </div>

        {/* Registration CTA Box */}
        {event.isRegistrationRequired && (
          <div className="bg-gradient-to-r from-emerald-900 to-[#083B25] text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 justify-center md:justify-start">
                <Users className="w-5 h-5 text-[#C59B27]" /> শিক্ষার্থী রেজিস্ট্রেশন
              </h3>
              <p className="text-xs text-emerald-100 max-w-lg">
                নিবন্ধিত শিক্ষার্থীরা অভিভাবক পোর্টাল থেকে সরাসরি রেজিস্ট্রেশন সম্পন্ন করতে পারবে।
                {event.maxCapacity > 0 && (
                  <span className="block mt-1 text-[#C59B27] font-semibold">
                    মোট আসন: {event.maxCapacity} টি | নিবন্ধিত: {event.registeredCount} টি{" "}
                    {remainingCapacity !== null && `(${remainingCapacity} টি অবশিষ্ট)`}
                  </span>
                )}
              </p>
            </div>

            <div>
              {isRegistrationOpen ? (
                <Link
                  href="/portal/events"
                  className="inline-flex items-center gap-2 bg-[#C59B27] hover:bg-[#b0891f] text-gray-900 font-bold px-6 py-3 rounded-lg text-sm transition-all shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  পোর্টাল থেকে রেজিস্ট্রেশন করুন
                </Link>
              ) : (
                <span className="inline-block bg-emerald-800/80 text-emerald-200 px-4 py-2 rounded-lg text-xs font-semibold border border-emerald-600/50">
                  রেজিস্ট্রেশন বর্তমানে বন্ধ
                </span>
              )}
            </div>
          </div>
        )}

        {/* Competition Results (Publicly Published) */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#C59B27]" /> প্রতিযোগিতার চূড়ান্ত ফলাফল ও বিজয়ীবৃন্দ
              </h3>
              <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
                অফিশিয়াল ফলাফল
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                    <th className="p-3">স্থান / অর্জন</th>
                    <th className="p-3">শিক্ষার্থীর নাম</th>
                    <th className="p-3">প্রতিযোগিতার বিভাগ</th>
                    <th className="p-3">বিচারকমণ্ডলীর মূল্যায়ন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                          {r.rank ? `${r.rank}ম স্থান` : r.awardType || "স্বীকৃতি"}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-gray-900">
                        {r.studentNameBn}
                        <span className="block text-[11px] text-gray-500 font-mono font-normal">
                          {r.studentIdNumber}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700">{r.competitionCategory}</td>
                      <td className="p-3 text-gray-600 italic">
                        {r.judgeCommentsBn || "অনুকরণীয় পারফরম্যান্স"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feedback Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-700" /> মতামত ও পরামর্শ
          </h3>
          <p className="text-xs text-gray-500">
            এই ইভেন্ট সম্পর্কে আপনার মূল্যবান মতামত ও পরামর্শ প্রদান করুন।
          </p>

          {feedbackSuccess ? (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> আপনার মতামত সফলভাবে গৃহীত হয়েছে। শুকরিয়া!
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  রেটিং প্রদান করুন:
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= feedbackRating
                            ? "text-[#C59B27] fill-[#C59B27]"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  আপনার মন্তব্য / পরামর্শ:
                </label>
                <textarea
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  placeholder="ইভেন্টের সার্বিক ব্যবস্থাপনা কেমন লেগেছে লিখুন..."
                  rows={3}
                  required
                  className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={submittingFeedback}
                className="bg-[#083B25] hover:bg-emerald-900 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {submittingFeedback ? "জমা হচ্ছে..." : "মতামত জমা দিন"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
