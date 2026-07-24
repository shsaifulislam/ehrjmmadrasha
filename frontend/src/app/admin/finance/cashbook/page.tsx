'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Calculator, Wallet, ArrowDownRight, ArrowUpRight, Lock } from 'lucide-react';

interface CashbookSummary {
  date: string;
  openingBalance: number;
  totalCashIncome: number;
  totalCashExpense: number;
  expectedClosingCash: number;
  existingClosing?: {
    id: string;
    actualCountedCash: number;
    shortageOrSurplus: number;
    note?: string;
    closedBy: { username: string };
  };
}

export default function DailyCashbookPage() {
  const [summary, setSummary] = useState<CashbookSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actualCash, setActualCash] = useState('');
  const [note, setNote] = useState('');
  const [closing, setClosing] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/accounting/cashbook');
      const data = res.data.data;
      setSummary(data);
      if (data.existingClosing) {
        setActualCash(data.existingClosing.actualCountedCash.toString());
        setNote(data.existingClosing.note || '');
      } else {
        setActualCash(data.expectedClosingCash.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleCloseCashbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualCash) return;

    try {
      setClosing(true);
      await api.post('/admin/accounting/cashbook/close', {
        actualCountedCash: Number(actualCash),
        note,
      });
      fetchSummary();
      alert('দৈনিক ক্যাশ ক্লোজিং সফলভাবে সম্পন্ন হয়েছে!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'ক্লোজিং সম্পন্ন করতে সমস্যা হয়েছে');
    } finally {
      setClosing(false);
    }
  };

  const calculatedDiff = summary
    ? Number(actualCash || 0) - summary.expectedClosingCash
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daily Cashbook & Closing (দৈনিক ক্যাশ হিসাব ও ক্লোজিং)</h1>
          <p className="text-sm text-slate-500">আজকের ক্যাশ আগমন, নির্গমন, প্রত্যাশিত ক্লোজিং ও নগদ মেলানোর হিসাব</p>
        </div>
        <Button variant="outline" onClick={fetchSummary} disabled={loading}>
          রিফ্রেশ
        </Button>
      </div>

      {loading || !summary ? (
        <Card><CardContent className="p-6 text-center text-slate-500">ক্যাশ হিসাব লোড হচ্ছে...</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-50">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center text-slate-500 text-xs font-semibold">
                  <Wallet className="w-4 h-4 mr-1 text-slate-600" /> প্রারম্ভিক ক্যাশ (Opening)
                </div>
                <div className="text-2xl font-bold font-mono text-slate-800">
                  ৳{Number(summary.openingBalance).toLocaleString('bn-BD')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50/60 border-emerald-200">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center text-emerald-600 text-xs font-semibold">
                  <ArrowDownRight className="w-4 h-4 mr-1" /> আজ ক্যাশ জমা (+Income)
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-700">
                  +৳{Number(summary.totalCashIncome).toLocaleString('bn-BD')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-rose-50/60 border-rose-200">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center text-rose-600 text-xs font-semibold">
                  <ArrowUpRight className="w-4 h-4 mr-1" /> আজ ক্যাশ খরচ (-Expense)
                </div>
                <div className="text-2xl font-bold font-mono text-rose-700">
                  -৳{Number(summary.totalCashExpense).toLocaleString('bn-BD')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/60 border-blue-200">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center text-blue-600 text-xs font-semibold">
                  <Calculator className="w-4 h-4 mr-1" /> প্রত্যাশিত সমাপনী (Expected)
                </div>
                <div className="text-2xl font-bold font-mono text-blue-800">
                  ৳{Number(summary.expectedClosingCash).toLocaleString('bn-BD')}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Closing Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-slate-600" />
                  আজকের ক্যাশ ক্লোজিং রেজিস্টার
                </span>
                {summary.existingClosing && (
                  <Badge className="bg-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> ক্লোজিং সম্পন্ন (দ্বারা: {summary.existingClosing.closedBy.username})
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCloseCashbook} className="space-y-4 max-w-xl">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">
                    বাস্তবে গণনাকৃত নগদ ক্যাশ (Actual Counted Cash)
                  </label>
                  <Input
                    type="number"
                    required
                    placeholder="হাতে গণনাকৃত আসল টাকা"
                    className="text-lg font-mono font-bold"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                  />
                </div>

                {/* Shortage / Surplus Warning Box */}
                {calculatedDiff !== 0 && (
                  <div className={`p-4 rounded-lg flex items-start gap-3 ${
                    calculatedDiff < 0 ? 'bg-amber-50 border border-amber-300 text-amber-900' : 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                  }`}>
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm">
                        {calculatedDiff < 0 ? '⚠️ ক্যাশ ঘাটতি সতর্কবার্তা (Cash Shortage Alert)' : '✅ ক্যাশ উদ্বৃত্ত (Cash Surplus)'}
                      </h4>
                      <p className="text-sm mt-1">
                        প্রত্যাশিত ক্যাশ <strong>৳{summary.expectedClosingCash}</strong> এর বিপরীতে বাস্তবে গণনাকৃত ক্যাশ{' '}
                        <strong>৳{actualCash || 0}</strong>। পার্থক্যের পরিমাণ:{' '}
                        <strong className="font-mono text-base">৳{calculatedDiff}</strong>
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">ক্লোজিং মন্তব্য / নোট (ঐচ্ছিক)</label>
                  <Input
                    placeholder="নোট বা ক্যাশ ঘাটতি/উদ্বৃত্তের কারণ..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={closing} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                  {closing ? 'ক্লোজিং সংরক্ষণ হচ্ছে...' : 'আজকের ক্যাশ ক্লোজিং সম্পন্ন করুন'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
