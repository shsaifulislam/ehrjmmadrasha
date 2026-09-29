"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Phone, Mail, MapPin, Send, MessageSquare, CheckCircle, ExternalLink } from "lucide-react";
import { INSTITUTION_INFO } from "@/lib/constants";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Anti-bot honeypot
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResultMessage(null);

    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject,
          category,
          message,
          honeypot,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        setTicketNumber(data.ticketNumber || null);
        setResultMessage(data.messageBn || "আপনার বার্তাটি সফলভাবে মাদরাসা অফিসে পৌঁছেছে।");
        setName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setMessage("");
      } else {
        setIsSuccess(false);
        setResultMessage(data.messageBn || "বার্তা প্রেরণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      setResultMessage("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। সরাসরি ফোনে যোগাযোগ করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col font-sans text-[#0B1914]">
      <Navbar />

      <section className="bg-gradient-to-b from-[#083B25] to-[#0D5C3A] text-white py-14 px-4 border-b-4 border-[#C59B27] text-center">
        <div className="max-w-6xl mx-auto">
          <span className="bg-[#C59B27]/20 text-amber-200 border border-[#C59B27]/40 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-block mb-3">
            যোগাযোগ ও অবস্থান
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-white mb-3">
            আমাদের সাথে যোগাযোগ করুন
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            মাদরাসা প্রাঙ্গণ পরিদর্শন, ভর্তি বিষয়ক তথ্য অথবা যে কোনো পরামর্শে সরাসরি যোগাযোগ করুন।
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Contact Details & Socials */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-[#083B25]">প্রতিষ্ঠানের স্থায়ী ঠিকানা ও তথ্য</h2>
              
              <div className="space-y-3.5 text-xs text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0D5C3A] flex items-center justify-center font-bold flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold block text-gray-900">ক্যাম্পাস অবস্থান:</span>
                    <span>পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ।</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#C59B27] flex items-center justify-center font-bold flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold block text-gray-900">জরুরি হেল্পলাইন নম্বরসমূহ:</span>
                    <span className="font-mono block">01845-162664</span>
                    <span className="font-mono block">01826-416696</span>
                    <span className="font-mono block">01949-091911</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold block text-gray-900">অফিসিয়াল ইমেইল:</span>
                    <span className="font-mono text-[#0D5C3A]">ehrjmadrasha@gmail.com</span>
                    <span className="font-mono text-gray-500 block">adminehrjmadrasha@gmail.com</span>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-4 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-800 block mb-2">অফিসিয়াল সোশ্যাল লিংক:</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <a
                    href="https://www.facebook.com/ehrjmadrasda"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 font-semibold transition"
                  >
                    ফেসবুক পেজ <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://www.youtube.com/@ehrjmadrasha"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-800 hover:bg-red-100 font-semibold transition"
                  >
                    ইউটিউব চ্যানেল <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://whatsapp.com/channel/0029VbC30aF6buMF0LGPMp3F"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold transition"
                  >
                    হোয়াটসঅ্যাপ চ্যানেল <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Travel directions */}
            <div className="bg-[#F9F8F3] p-5 rounded-2xl border border-gray-200 text-xs text-gray-700 space-y-1.5">
              <h3 className="font-bold text-[#083B25]">আসার সহজ পথনির্দেশনা:</h3>
              <p>
                ঢাকা-চট্টগ্রাম মহাসড়কের ইলিয়টগঞ্জ বাসস্ট্যান্ডে নেমে রিকশা বা সিএনজিযোগে মাত্র ৫ মিনিটে পূর্ব লক্ষ্মীপুর হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় পৌঁছানো যায়।
              </p>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-[#083B25]">সরাসরি বার্তা বা প্রশ্ন পাঠান</h2>
            <p className="text-xs text-gray-500">আপনার যেকোনো জিজ্ঞাসা লিখুন, কর্তৃপক্ষ দ্রুত উত্তর প্রদান করবে।</p>

            {resultMessage && (
              <div
                className={`p-3.5 rounded-lg border text-xs flex flex-col gap-1 ${
                  isSuccess
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {resultMessage}
                </div>
                {ticketNumber && (
                  <p className="text-[11px] font-mono text-emerald-700 bg-white/70 px-2 py-1 rounded w-fit mt-1">
                    হেল্পডেস্ক টিকিট নং: {ticketNumber}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Anti-bot honeypot field - invisible to human users */}
              <div style={{ display: "none" }} aria-hidden="true">
                <input
                  type="text"
                  name="honeypot_field"
                  tabIndex={-1}
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">আপনার নাম *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="মুহাম্মদ..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ইমেইল ঠিকানা *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">মোবাইল নম্বর (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">জিজ্ঞাসার ধরণ</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A] bg-white"
                  >
                    <option value="GENERAL">সাধারণ পরামর্শ</option>
                    <option value="ADMISSION">ভর্তি বিষয়ক তথ্য</option>
                    <option value="ACADEMIC">সিলেবাস ও শিক্ষা কার্যক্রম</option>
                    <option value="FEES">ফি ও দান সংক্রান্ত</option>
                    <option value="RESIDENTIAL">ছাত্রাবাস ও এতিমখানা</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">বার্তার বিষয় *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="যেমন: হিফজ বিভাগে নতুন ছাত্র ভর্তি সম্পর্কে..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">বার্তার বিবরণ *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="আপনার বার্তা বা প্রশ্ন বিস্তারিত লিখুন (কমপক্ষে ১০ অক্ষর)..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0D5C3A]"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0D5C3A] hover:bg-[#158052] disabled:opacity-50 text-white py-2.5 rounded-lg text-xs font-bold transition shadow flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {loading ? "বার্তা পাঠানো হচ্ছে..." : "বার্তা পাঠান"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
