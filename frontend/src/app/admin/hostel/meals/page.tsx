'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Utensils, Calendar, RefreshCw, Calculator, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface MealStats {
  year: number;
  month: number;
  totalExpense: number;
  totalMeals: number;
  costPerMeal: number;
}

export default function MealAttendancePage() {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [stats, setStats] = useState<MealStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Meal Attendance Recording State
  const [mealDate, setMealDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER'>('LUNCH');
  const [guestCount, setGuestCount] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const fetchCostPerMeal = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/bazar/cost-per-meal', {
        params: { year: selectedYear, month: selectedMonth },
      });
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostPerMeal();
  }, [selectedYear, selectedMonth]);

  const handleRecordMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/admin/bazar/meals', {
        date: mealDate,
        mealType,
        guestCount: Number(guestCount),
      });

      setGuestCount('0');
      fetchCostPerMeal();
      alert('মিল এটেন্ডেন্স সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'মিল এন্ট্রি করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Meal Attendance & Cost Per Meal Analytics (মিল এটেন্ডেন্স ও খরচ এনালিটিক্স)</h1>
          <p className="text-sm text-slate-500">দৈনিক খাবার গণনা এবং প্রতি মিল খরচের (Cost Per Meal) স্বয়ংক্রিয় হিসাব</p>
        </div>
        <Link href="/admin/hostel">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> হোস্টেল ড্যাশবোর্ডে ফিরুন</Button>
        </Link>
      </div>

      {/* Analytics Summary */}
      <Card className="bg-slate-50">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-slate-700">মাস ও বছর নির্বাচন:</span>
            <select
              className="border rounded p-2 text-sm bg-white font-semibold"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {m} নম্বর মাস ({new Date(2026, m - 1, 1).toLocaleString('bn-BD', { month: 'long' })})
                </option>
              ))}
            </select>
          </div>

          <Button onClick={fetchCostPerMeal} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> এনালিটিক্স রিফ্রেশ
          </Button>
        </CardContent>
      </Card>

      {/* Cost Analytics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-50">
            <CardContent className="p-4 space-y-1">
              <span className="text-slate-500 text-xs font-semibold">মাসিক মোট খাবার ও বাজার খরচ</span>
              <div className="text-2xl font-bold font-mono text-slate-800">
                ৳{Number(stats.totalExpense).toLocaleString('bn-BD')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/60 border-blue-200">
            <CardContent className="p-4 space-y-1">
              <span className="text-blue-600 text-xs font-semibold">মাসিক পরিবেশনকৃত মোট মিল (Total Meals)</span>
              <div className="text-2xl font-bold font-mono text-blue-800">
                {stats.totalMeals.toLocaleString('bn-BD')} টি মিল
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/60 border-emerald-200">
            <CardContent className="p-4 space-y-1">
              <span className="text-emerald-700 text-xs font-semibold">প্রতি মিলের গড় খরচ (Cost Per Meal)</span>
              <div className="text-3xl font-bold font-mono text-emerald-800">
                ৳{stats.costPerMeal} /মিল
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Record Meal Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-600" /> দৈনিক মিল এটেন্ডেন্স এন্ট্রি
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRecordMeal} className="space-y-4 max-w-lg">
            <div>
              <label className="text-xs font-semibold text-slate-600">তারিখ</label>
              <Input type="date" required value={mealDate} onChange={(e) => setMealDate(e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">খাবারের সময় (Meal Type)</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as any)}
              >
                <option value="BREAKFAST">সকালের নাস্তা (Breakfast)</option>
                <option value="LUNCH">দুপুরের খাবার (Lunch)</option>
                <option value="DINNER">রাতের খাবার (Dinner)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">মেহমান / অতিধি মিল সংখ্যা</label>
              <Input type="number" required value={guestCount} onChange={(e) => setGuestCount(e.target.value)} />
            </div>

            <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
              {submitting ? 'সংরক্ষণ হচ্ছে...' : 'মিল এটেন্ডেন্স সেভ করুন'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
