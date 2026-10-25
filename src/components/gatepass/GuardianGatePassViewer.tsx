"use client";

import React, { useState, useEffect } from "react";
import {
  DoorOpen,
  CreditCard,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Phone,
  Calendar,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import StudentIdCardView, { StudentCardData } from "@/components/idcard/StudentIdCardView";
import { GatePassRecord } from "@/lib/gatepass/gatepassEngine";

interface GuardianGatePassViewerProps {
  studentId?: string;
  studentName?: string;
}

export default function GuardianGatePassViewer({
  studentId,
  studentName,
}: GuardianGatePassViewerProps) {
  const [subTab, setSubTab] = useState<"GATEPASS" | "IDCARD">("GATEPASS");
  const [loading, setLoading] = useState(true);
  const [gatePasses, setGatePasses] = useState<GatePassRecord[]>([]);
  const [studentCard, setStudentCard] = useState<StudentCardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const gatePassUrl = studentId ? `/api/gatepass?studentId=${studentId}` : "/api/gatepass";
      const idCardUrl = studentId ? `/api/idcard/students?studentId=${studentId}` : "/api/idcard/students";

      const [gpRes, idRes] = await Promise.all([fetch(gatePassUrl), fetch(idCardUrl)]);

      const gpJson = await gpRes.json();
      const idJson = await idRes.json();

      if (gpJson.success && gpJson.data) {
        setGatePasses(gpJson.data.records || []);
      }

      const cardList = idJson.data?.students || idJson.students || [];
      if (cardList.length > 0) {
        setStudentCard(cardList[0]);
      }
    } catch (err: any) {
      setError(err.message || "তথ্য লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
        <div className="w-8 h-8 border-4 border-[#0D5C3A] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">গেটপাস ও ডিজিটাল আইডি কার্ড লোড হচ্ছে...</p>
      </div>
    );
  }

  const activeGatePass = gatePasses.find(
    (g) => g.status === "APPROVED" || g.status === "EXITED" || g.status === "OVERDUE"
  );

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setSubTab("GATEPASS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            subTab === "GATEPASS"
              ? "bg-[#0D5C3A] text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5" />
          <span>সিকিউরিটি গেটপাস ({gatePasses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("IDCARD")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            subTab === "IDCARD"
              ? "bg-[#0D5C3A] text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>ডিজিটাল স্টুডেন্ট আইডি কার্ড</span>
        </button>
      </div>

      {/* Sub-tab 1: GATEPASS */}
      {subTab === "GATEPASS" && (
        <div className="space-y-6">
          {/* Active Pass Hero Alert */}
          {activeGatePass ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 shadow-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <DoorOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
                        সক্রিয় গেটপাস #{activeGatePass.passNumber}
                      </span>
                      {activeGatePass.status === "EXITED" && (
                        <span className="text-[10px] font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
                          ক্যাম্পাসের বাইরে অবস্থানরত
                        </span>
                      )}
                      {activeGatePass.status === "APPROVED" && (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                          অনুমোদিত (প্রস্থানের অপেক্ষায়)
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-1 font-serif-bn">
                      গমনের উদ্দেশ্য: {activeGatePass.purposeLabelBn}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">{activeGatePass.purposeDescription}</p>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur p-3 rounded-2xl border border-amber-200 text-xs text-right self-stretch sm:self-auto space-y-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">প্রত্যাশিত প্রস্থান:</span>
                    <strong className="text-slate-800 font-mono">
                      {new Date(activeGatePass.departureExpected).toLocaleString("bn-BD")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">প্রত্যাশিত প্রত্যাবর্তন:</span>
                    <strong className="text-slate-800 font-mono">
                      {new Date(activeGatePass.returnExpected).toLocaleString("bn-BD")}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-3xl p-6 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">বর্তমানে কোনো সক্রিয় গেটপাস নেই</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                শিক্ষার্থী বর্তমানে নিরাপদে মাদরাসা ক্যাম্পাসে অবস্থান করছেন। জরুরি প্রয়োজনে মাদরাসা কর্তৃপক্ষের মাধ্যমে গেটপাস ইস্যু করা যাবে।
              </p>
            </div>
          )}

          {/* Historical GatePass List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h3 className="font-black text-slate-900 text-sm font-serif-bn flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0D5C3A]" />
              বিগত বহির্গমন ও গেটপাস ইতিহাস
            </h3>

            {gatePasses.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">কোনো পূর্ববর্তী গেটপাস রেকর্ড পাওয়া যায়নি।</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {gatePasses.map((pass) => (
                  <div key={pass.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0D5C3A]">{pass.passNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(pass.issuedAt).toLocaleDateString("bn-BD")}
                        </span>
                      </div>
                      <span className="text-slate-800 font-medium block mt-0.5">
                        {pass.purposeLabelBn}
                      </span>
                    </div>

                    <div className="text-right">
                      {pass.status === "RETURNED" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          নিরাপদে প্রত্যাবর্তিত
                        </span>
                      )}
                      {pass.status === "EXITED" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          ক্যাম্পাসের বাহিরে
                        </span>
                      )}
                      {pass.status === "APPROVED" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          অনুমোদিত
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                        ফেরত: {new Date(pass.returnExpected).toLocaleDateString("bn-BD")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-tab 2: IDCARD */}
      {subTab === "IDCARD" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="text-center max-w-md mx-auto space-y-1">
            <h3 className="text-base font-black text-slate-900 font-serif-bn">
              সন্তানের অফিসিয়াল ডিজিটাল পরিচয়পত্র
            </h3>
            <p className="text-xs text-slate-500">
              মাদরাসা কর্তৃপক্ষের সিল ও কিউআর কোড সম্বলিত দুই পৃষ্ঠার পরিচয়পত্র। কার্ডে ক্লিক করে উল্টো পৃষ্ঠা দেখতে পারেন।
            </p>
          </div>

          {studentCard ? (
            <div className="flex justify-center py-2">
              <StudentIdCardView student={studentCard} />
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">আইডি কার্ড তথ্য পাওয়া যায়নি।</p>
          )}
        </div>
      )}
    </div>
  );
}
