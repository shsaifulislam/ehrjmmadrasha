"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Trophy,
  QrCode,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Search,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

interface ChildEventData {
  student: {
    id: string;
    studentIdNumber: string;
    fullNameBn: string;
    gender: string;
    residentialStatus: string;
    classNameBn: string;
    sectionNameBn: string;
    rollNumber?: number;
  };
  events: Array<{
    event: any;
    isEligible: boolean;
    ineligibilityReason?: string;
    isRegistered: boolean;
    registration?: any;
  }>;
  registrations: any[];
  achievements: any[];
  certificates: any[];
}

export default function GuardianPortalEventsPage() {
  const [phone, setPhone] = useState("01712345678");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [childrenData, setChildrenData] = useState<ChildEventData[]>([]);
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [regNotes, setRegNotes] = useState("");
  const [submittingReg, setSubmittingReg] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPortalData = async (searchPhone: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/portal/events?phone=${encodeURIComponent(searchPhone)}`);
      const data = await res.json();
      if (data.success) {
        setChildrenData(data.children || []);
        setSearched(true);
      } else {
        setMessage({ type: "error", text: data.error || "তথ্য লোড ব্যর্থ হয়েছে।" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "সার্ভারে যোগাযোগ করা যায়নি।" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchPortalData("01712345678");
  }, []);

  const handleRegister = async (eventId: string, studentId: string) => {
    if (!consentGiven) {
      alert("অনুগ্রহ করে অংশগ্রহণের সম্মতি প্রদান করুন।");
      return;
    }

    setSubmittingReg(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          registeredByRole: "GUARDIAN",
          consentGiven: true,
          notes: regNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: "success",
          text: `রেজিস্ট্রেশন সফল হয়েছে! স্ট্যাটাস: ${data.data.status === "WAITLISTED" ? "অপেক্ষমাণ তালিকা" : "অনুমোদিত"}`,
        });
        setRegisteringEventId(null);
        setConsentGiven(false);
        setRegNotes("");
        fetchPortalData(phone);
      } else {
        setMessage({ type: "error", text: data.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে।" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "সার্ভার এরর।" });
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই ইভেন্টের রেজিস্ট্রেশন বাতিল করতে চান?")) return;

    try {
      const res = await fetch(`/api/events/any/register?registrationId=${registrationId}&reason=অভিভাবক_কর্তৃক_বাতিল`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "রেজিস্ট্রেশন সফলভাবে বাতিল করা হয়েছে।" });
        fetchPortalData(phone);
      } else {
        setMessage({ type: "error", text: data.error || "বাতিল করা সম্ভব হয়নি।" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "সার্ভার এরর।" });
    }
  };

  const currentChild = childrenData[activeChildIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/20 via-white to-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-[#083B25] text-white py-8 px-4 md:px-8 border-b border-emerald-800 shadow-sm">
        <div className="max-w-6xl mx-auto space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C59B27]">
            <ShieldCheck className="w-4 h-4" />
            অভিভাবক সেলফ-সার্ভিস পোর্টাল
          </div>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">
            সন্তানের ইভেন্ট, প্রতিযোগিতা ও সহশিক্ষা কার্যক্রম
          </h1>
          <p className="text-xs md:text-sm text-emerald-100 font-light">
            {INSTITUTION_INFO.nameBn}-এ আপনার নিবন্ধিত সন্তানের জন্য যোগ্যতাসম্পন্ন ইভেন্টে রেজিস্ট্রেশন করুন এবং সনদপত্র দেখুন।
          </p>

          {/* Search/Phone Switcher */}
          <div className="pt-4 flex flex-wrap gap-2 items-center">
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="অভিভাবকের মোবাইল নম্বর"
                className="pl-3 pr-3 py-1.5 text-xs rounded-lg bg-emerald-950/70 border border-emerald-700 text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-[#C59B27]"
              />
            </div>
            <button
              onClick={() => fetchPortalData(phone)}
              disabled={loading}
              className="bg-[#C59B27] hover:bg-[#b0891f] text-gray-900 font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow"
            >
              {loading ? "অনুসন্ধান হচ্ছে..." : "যাচাই করুন"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Alerts */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Children Tabs */}
        {childrenData.length > 0 ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
              {childrenData.map((cd, idx) => (
                <button
                  key={cd.student.id}
                  onClick={() => setActiveChildIndex(idx)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeChildIndex === idx
                      ? "bg-[#083B25] text-white shadow-sm"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{cd.student.fullNameBn}</span>
                  <span className="text-[10px] opacity-80 font-mono">
                    ({cd.student.studentIdNumber})
                  </span>
                </button>
              ))}
            </div>

            {/* Child Profile Banner */}
            {currentChild && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">
                      {currentChild.student.fullNameBn}
                    </h2>
                    <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                      জামাত: {currentChild.student.classNameBn}
                    </span>
                    <span className="text-[11px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded">
                      রোল: {currentChild.student.rollNumber || "-"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    মাদরাসা আইডি: <span className="font-mono">{currentChild.student.studentIdNumber}</span> | আবাসন: {currentChild.student.residentialStatus}
                  </p>
                </div>

                <div className="flex gap-4 text-xs font-semibold">
                  <div className="text-center bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <span className="block text-emerald-800 text-sm font-bold">
                      {currentChild.registrations.filter((r) => r.status !== "CANCELLED").length}
                    </span>
                    <span className="text-[10px] text-emerald-600">রেজিস্ট্রেশন</span>
                  </div>
                  <div className="text-center bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                    <span className="block text-amber-800 text-sm font-bold">
                      {currentChild.achievements.length}
                    </span>
                    <span className="text-[10px] text-amber-600">অর্জন</span>
                  </div>
                  <div className="text-center bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                    <span className="block text-blue-800 text-sm font-bold">
                      {currentChild.certificates.length}
                    </span>
                    <span className="text-[10px] text-blue-600">সনদপত্র</span>
                  </div>
                </div>
              </div>
            )}

            {/* Eligible Events List */}
            {currentChild && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  উপলব্ধ ইভেন্ট ও প্রতিযোগিতাসমূহ
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentChild.events.map(({ event, isEligible, ineligibilityReason, isRegistered, registration }) => {
                    const isOpen = event.status === "REGISTRATION_OPEN";
                    return (
                      <div
                        key={event.id}
                        className={`bg-white rounded-xl border p-5 shadow-sm space-y-3 flex flex-col justify-between ${
                          isRegistered
                            ? "border-emerald-500 ring-1 ring-emerald-500"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                              {event.typeCode.replace("_", " ")}
                            </span>
                            {isRegistered ? (
                              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {registration?.status === "WAITLISTED"
                                  ? `অপেক্ষমাণ তালিকা (#${registration.waitlistPosition})`
                                  : "নিবন্ধিত"}
                              </span>
                            ) : isEligible ? (
                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                যোগ্য প্রার্থী
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                অযোগ্য
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-gray-900">{event.titleBn}</h4>
                          <p className="text-xs text-gray-600 line-clamp-2">{event.descriptionBn}</p>

                          <div className="text-[11px] text-gray-500 space-y-1 pt-1">
                            <div>তারিখ: {new Date(event.startAt).toLocaleDateString("bn-BD")}</div>
                            <div>স্থান: {event.venueText}</div>
                          </div>

                          {!isEligible && (
                            <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                              অযোগ্যতার কারণ: {ineligibilityReason}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                          <Link
                            href={`/events/${event.id}`}
                            className="text-xs font-semibold text-gray-600 hover:text-emerald-800 flex items-center gap-1"
                          >
                            বিস্তারিত <ArrowRight className="w-3 h-3" />
                          </Link>

                          {isRegistered ? (
                            <button
                              onClick={() => handleCancelRegistration(registration?.id)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors"
                            >
                              রেজিস্ট্রেশন বাতিল
                            </button>
                          ) : isEligible && isOpen ? (
                            <button
                              onClick={() => setRegisteringEventId(event.id)}
                              className="text-xs font-bold text-gray-900 bg-[#C59B27] hover:bg-[#b0891f] px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
                            >
                              রেজিস্ট্রেশন করুন
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400">আবেদন অনুপলব্ধ</span>
                          )}
                        </div>

                        {/* Registration Modal Inline */}
                        {registeringEventId === event.id && (
                          <div className="mt-3 p-4 bg-emerald-50/80 rounded-xl border border-emerald-300 space-y-3">
                            <h5 className="text-xs font-bold text-emerald-950">
                              {currentChild.student.fullNameBn}-এর রেজিস্ট্রেশন নিশ্চিতকরণ
                            </h5>

                            <div>
                              <label className="flex items-start gap-2 text-xs text-gray-800 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={consentGiven}
                                  onChange={(e) => setConsentGiven(e.target.checked)}
                                  className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
                                />
                                <span>
                                  আমি অভিভাবক হিসেবে আমার সন্তানের এই প্রতিযোগিতায় অংশগ্রহণে পূর্ণ সম্মতি প্রদান করছি।
                                </span>
                              </label>
                            </div>

                            <input
                              type="text"
                              value={regNotes}
                              onChange={(e) => setRegNotes(e.target.value)}
                              placeholder="বিশেষ কোনো মন্তব্য বা অনুরোধ (ঐচ্ছিক)"
                              className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white"
                            />

                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setRegisteringEventId(null)}
                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-200 text-gray-700"
                              >
                                বাতিল
                              </button>
                              <button
                                onClick={() => handleRegister(event.id, currentChild.student.id)}
                                disabled={submittingReg}
                                className="px-4 py-1 rounded-lg text-xs font-bold bg-[#083B25] text-white hover:bg-emerald-900"
                              >
                                {submittingReg ? "প্রক্রিয়াধীন..." : "নিশ্চিত করুন"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Issued Certificates */}
            {currentChild && currentChild.certificates.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-700" />
                  অর্জিত প্রাতিষ্ঠানিক সনদপত্রসমূহ
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentChild.certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {cert.category}
                        </span>
                        <h4 className="text-xs font-bold text-gray-900">{cert.titleBn}</h4>
                        <p className="text-[11px] font-mono text-gray-500">
                          সনদ নং: {cert.certificateNumber}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-[10px] text-gray-500 block">
                          ইস্যু: {new Date(cert.issueDate).toLocaleDateString("bn-BD")}
                        </span>
                        <Link
                          href={`/verify/document/${encodeURIComponent(cert.verificationCode)}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline"
                        >
                          <QrCode className="w-3 h-3" /> যাচাই করুন
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {currentChild && currentChild.achievements.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#C59B27]" />
                  প্রতিযোগিতার সাফল্য ও স্বীকৃতি
                </h3>

                <div className="space-y-2">
                  {currentChild.achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className="p-3 rounded-lg border border-amber-200 bg-amber-50/40 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold text-gray-900">{ach.competitionCategory}</span>
                        <span className="block text-gray-600 italic">{ach.judgeCommentsBn}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-amber-800 text-sm">
                          {ach.rank ? `${ach.rank}ম স্থান` : ach.awardType || "কৃতি শিক্ষার্থী"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          searched && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800 mb-1">কোনো শিক্ষার্থী পাওয়া যায়নি</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                প্রদত্ত মোবাইল নম্বরের সাথে কোনো শিক্ষার্থীর রেকর্ড সংযুক্ত পাওয়া যায়নি। মাদরাসা অফিসে যোগাযোগ করুন।
              </p>
            </div>
          )
        )}
      </main>
    </div>
  );
}
