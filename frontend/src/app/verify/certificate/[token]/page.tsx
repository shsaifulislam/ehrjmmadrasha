'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, XCircle, CheckCircle2, Award, Building2, QrCode } from 'lucide-react';

export default function CertificateVerificationPage() {
  const params = useParams();
  const certificateNumber = params.token as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (certificateNumber) {
      fetchVerification();
    }
  }, [certificateNumber]);

  const fetchVerification = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${apiBase}/certificate/public/verify/${certificateNumber}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setData({ isValid: false, message: json.message || 'অবৈধ সনদ নম্বর' });
      }
    } catch (err) {
      setData({ isValid: false, message: 'সার্ভার সংযোগ বিচ্ছিন্ন' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-800 rounded-3xl border border-slate-700 p-8 shadow-2xl space-y-6">
        {/* Header Logo & Institution */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <Award className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-emerald-400 tracking-tight">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা</h1>
          <p className="text-xs text-slate-400 font-mono">অফিসিয়াল সনদপত্র অনলাইন যাচাইকরণ পোর্টাল (ehrjmadrasha.edu.bd)</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <p className="animate-pulse">QR কোড ও সনদ যাচাই করা হচ্ছে...</p>
          </div>
        ) : data && data.isValid ? (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <h3 className="font-bold text-emerald-300 text-lg">সনদপত্রটি ১০০% খাঁটি ও সত্য Verified ✅</h3>
                <p className="text-xs text-emerald-400/80">অফিসিয়াল রেজিস্ট্রি ডাটাবেসে সফলভাবে ভেরিফাইড হয়েছে</p>
              </div>
            </div>

            {/* Certificate Dossier Box */}
            <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700/60 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                <span className="text-xs text-slate-400">সনদ নম্বর (Certificate No)</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{data.certificateNumber}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block">শিক্ষার্থীর নাম</span>
                  <span className="font-bold text-white text-base">{data.studentName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">স্টুডেন্ট আইডি</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">{data.studentId}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block">সনদের ধরন</span>
                  <span className="font-bold text-amber-400 text-sm">{data.type}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">শ্রেণী / শিক্ষাবর্ষ</span>
                  <span className="font-semibold text-slate-300 text-sm">{data.className} ({data.sessionYear})</span>
                </div>
              </div>

              <div className="border-t border-slate-700/50 pt-3 flex justify-between items-center text-xs text-slate-400">
                <span>পিতার নাম: <strong className="text-slate-200">{data.fatherName}</strong></span>
                <span>ইস্যুর তারিখ: <strong className="text-slate-200">{new Date(data.issueDate).toLocaleDateString('bn-BD')}</strong></span>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 font-mono">
              ক্যানোনিকাল ডোমেইন: <a href="https://www.ehrjmadrasha.com" className="text-emerald-400 underline">https://www.ehrjmadrasha.com</a>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center space-y-3">
            <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
            <h3 className="font-bold text-rose-300 text-lg">অবৈধ বা ভুয়া সনদপত্র ❌</h3>
            <p className="text-xs text-rose-300/80">{data?.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
