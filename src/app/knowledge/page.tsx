"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  BookOpen,
  Search,
  FileText,
  Calendar,
  ShieldCheck,
  Tag,
  Clock,
  ArrowRight,
  ExternalLink,
  Layers,
  ChevronRight,
  CheckCircle2,
  Printer,
  History,
  X,
  Filter,
} from "lucide-react";
import { KnowledgeDocument, SOPStep, HandbookSection } from "@/lib/policies/types";

export default function PublicKnowledgeHub() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [activeDoc, setActiveDoc] = useState<KnowledgeDocument | null>(null);

  // Historical date query state
  const [historicalDate, setHistoricalDate] = useState("");
  const [historicalResult, setHistoricalResult] = useState<any>(null);
  const [resolvingDate, setResolvingDate] = useState(false);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const res = await fetch("/api/governance/documents");
        const data = await res.json();
        if (data.documents) {
          setDocuments(data.documents);
          setFilteredDocs(data.documents);
        }
      } catch (err) {
        console.error("Failed to load policies", err);
      } finally {
        setLoading(false);
      }
    }
    loadPolicies();
  }, []);

  useEffect(() => {
    let result = documents;

    if (selectedCategory !== "ALL") {
      result = result.filter((d) => d.category === selectedCategory);
    }
    if (selectedType !== "ALL") {
      result = result.filter((d) => d.documentType === selectedType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.titleBn.toLowerCase().includes(q) ||
          d.titleEn.toLowerCase().includes(q) ||
          d.documentCode.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    setFilteredDocs(result);
  }, [selectedCategory, selectedType, search, documents]);

  const handleHistoricalCheck = async () => {
    if (!activeDoc || !historicalDate) return;
    setResolvingDate(true);
    try {
      const res = await fetch(`/api/governance/documents/${activeDoc.id}?effectiveDate=${historicalDate}`);
      const data = await res.json();
      setHistoricalResult(data.historicalResolution || null);
    } catch (e) {
      console.error(e);
    } finally {
      setResolvingDate(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <Navbar />

      {/* Banner */}
      <section className="bg-gradient-to-b from-[#083B25] to-[#0D5C3A] text-white py-14 px-4 border-b-4 border-[#C59B27] text-center">
        <div className="max-w-5xl mx-auto">
          <span className="bg-[#C59B27]/20 text-amber-200 border border-[#C59B27]/40 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block mb-3">
            প্রাতিষ্ঠানিক জ্ঞানভান্ডার ও সুশাসন
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-white mb-3">
            নীতিমালা, এসওপি ও অভিভাবক নির্দেশিকা হাব
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সকল অনুমোদিত শিক্ষানীতি, ভর্তি বিধিমালা, তাহফীজ রুটিন এসওপি ও
            হ্যান্ডবুক।
          </p>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-4 sm:p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input
              type="text"
              placeholder="নীতিমালা, এসওপি, হ্যান্ডবুক বা কোড লিখে অনুসন্ধান করুন (যেমন: ভর্তি, তাহফীজ, EHRJ-POL)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/50 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-stone-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> ক্যাটাগরি:
              </span>
              {[
                { id: "ALL", label: "সব" },
                { id: "ADMISSION_POLICY", label: "ভর্তি" },
                { id: "SOP", label: "এসওপি (SOP)" },
                { id: "HANDBOOK", label: "হ্যান্ডবুক" },
                { id: "SECURITY_POLICY", label: "নিরাপত্তা ও আইটি" },
                { id: "TEACHER_GUIDELINE", label: "শিক্ষক আচরণবিধি" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    selectedCategory === c.id
                      ? "bg-emerald-900 text-white shadow-sm"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-500">ধরন:</span>
              {["ALL", "POLICY", "SOP", "HANDBOOK"].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-2.5 py-1 rounded-md transition ${
                    selectedType === t
                      ? "bg-amber-600 text-white font-semibold"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {t === "ALL" ? "সকল ধরন" : t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        {loading ? (
          <div className="py-20 text-center text-stone-500 space-y-3">
            <div className="w-8 h-8 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>প্রাতিষ্ঠানিক নীতিমালা লোড করা হচ্ছে...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 shadow-sm max-w-lg mx-auto">
            <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-bold text-stone-800 text-lg">কোনো ফলাফল পাওয়া যায়নি</h3>
            <p className="text-stone-500 text-sm mt-1">অনুসন্ধানের কি-ওয়ার্ড পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-stone-100 text-stone-700 rounded-md border border-stone-200">
                      {doc.documentCode}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {doc.currentVersion} ({doc.status})
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition line-clamp-2">
                      {doc.titleBn}
                    </h3>
                    {doc.titleEn && (
                      <p className="text-xs text-stone-500 line-clamp-1 mt-0.5 italic">{doc.titleEn}</p>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">{doc.description}</p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {doc.tags.slice(0, 3).map((t, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-600 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>কার্যকর: {doc.effectiveFrom}</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveDoc(doc);
                      setHistoricalResult(null);
                      setHistoricalDate("");
                    }}
                    className="font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                  >
                    বিস্তারিত দেখুন <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Full Document Reader Drawer / Modal */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 to-teal-950 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-2 py-0.5 bg-white/20 rounded text-amber-200">
                    {activeDoc.documentCode}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-emerald-700/80 rounded font-semibold text-white">
                    {activeDoc.currentVersion} • {activeDoc.status}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-stone-800/80 rounded text-stone-300">
                    {activeDoc.confidentiality}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold">{activeDoc.titleBn}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  title="প্রিন্ট করুন"
                  className="p-2 hover:bg-white/10 rounded-xl transition text-emerald-200 hover:text-white"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveDoc(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition text-emerald-200 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow text-stone-800">
              {/* Metadata Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
                <div>
                  <span className="text-stone-400 block font-medium">বিভাগ</span>
                  <span className="font-semibold text-stone-800">{activeDoc.ownerDepartment}</span>
                </div>
                <div>
                  <span className="text-stone-400 block font-medium">কার্যকর তারিখ</span>
                  <span className="font-semibold text-stone-800">{activeDoc.effectiveFrom}</span>
                </div>
                <div>
                  <span className="text-stone-400 block font-medium">পরবর্তী পর্যালোচনা</span>
                  <span className="font-semibold text-stone-800">{activeDoc.reviewDate}</span>
                </div>
                <div>
                  <span className="text-stone-400 block font-medium">অনুমোদনের তারিখ</span>
                  <span className="font-semibold text-stone-800">{activeDoc.approvalDate || "কার্যকর"}</span>
                </div>
              </div>

              {/* Handbook Table of Contents if available */}
              {activeDoc.handbookSections && activeDoc.handbookSections.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-900 border-b pb-1">
                    হ্যান্ডবুক সূচিপত্র ও অধ্যায়সমূহ
                  </h4>
                  <div className="space-y-3">
                    {activeDoc.handbookSections.map((sec) => (
                      <div key={sec.sectionNumber} className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                        <div className="font-bold text-emerald-900 text-sm mb-1">
                          অধ্যায় {sec.sectionNumber}: {sec.titleBn}
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">
                          {sec.contentMarkdown}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SOP Interactive Steps if available */}
              {activeDoc.sopSteps && activeDoc.sopSteps.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-900 border-b pb-1">
                    স্ট্যান্ডার্ড অপারেটিং প্রসিডিউর (SOP) ধাপসমূহ
                  </h4>
                  <div className="space-y-3">
                    {activeDoc.sopSteps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex gap-4"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow">
                          {step.stepNumber}
                        </div>
                        <div className="space-y-1.5 flex-grow text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900 text-sm">{step.titleBn}</span>
                            <span className="px-2 py-0.5 bg-emerald-200/70 text-emerald-900 font-semibold rounded text-[11px]">
                              দায়িত্ব: {step.responsibleRole}
                            </span>
                          </div>
                          <p className="text-stone-700 leading-relaxed">{step.description}</p>
                          {step.decisionPoint && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                              <span className="font-semibold">সিদ্ধান্ত পয়েন্ট: </span> {step.decisionPoint}
                            </div>
                          )}
                          {step.completionCriteria && (
                            <div className="text-stone-500 text-[11px]">
                              <span className="font-medium text-stone-600">সমাপ্তির মাপকাঠি: </span>
                              {step.completionCriteria}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Policy Markdown Text */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-900 border-b pb-1">
                  মূল নীতিমালা ও শর্তাবলী
                </h4>
                <div className="prose prose-sm max-w-none text-stone-700 bg-white p-5 rounded-2xl border border-stone-200 leading-relaxed whitespace-pre-line font-serif">
                  {activeDoc.contentMarkdown || activeDoc.contentText}
                </div>
              </div>

              {/* Historical Effective-Date Resolution Tool */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <History className="w-4 h-4 text-amber-700" />
                  ঐতিহাসিক কার্যকর সংস্করণ যাচাই (Effective-Date Engine)
                </div>
                <p className="text-stone-600">
                  অতীতের কোনো নির্দিষ্ট তারিখে অত্র নীতিমালার কোন সংস্করণটি প্রাতিষ্ঠানিকভাবে কার্যকর ছিল তা যাচাই
                  করুন:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={historicalDate}
                    onChange={(e) => setHistoricalDate(e.target.value)}
                    className="p-2 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                  <button
                    onClick={handleHistoricalCheck}
                    disabled={resolvingDate || !historicalDate}
                    className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {resolvingDate ? "যাচাই হচ্ছে..." : "যাচাই করুন"}
                  </button>
                </div>
                {historicalResult && (
                  <div className="p-3 bg-white border border-amber-300 rounded-xl space-y-1">
                    <div className="font-bold text-stone-900">
                      ফলাফল: {historicalResult.message}
                    </div>
                    {historicalResult.resolvedVersion && (
                      <div className="text-stone-600">
                        ভার্সন: <span className="font-semibold">{historicalResult.resolvedVersion.version}</span> |
                        কার্যকাল: {historicalResult.resolvedVersion.effectiveFrom} থেকে{" "}
                        {historicalResult.resolvedVersion.effectiveUntil || "বর্তমান"} | স্ট্যাটাস:{" "}
                        <span className="font-semibold">{historicalResult.resolvedVersion.status}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500">
                স্বত্বাধিকারী: ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (EHRJ)
              </span>
              <button
                onClick={() => setActiveDoc(null)}
                className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-medium transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
