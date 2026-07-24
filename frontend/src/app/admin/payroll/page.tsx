'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Calendar, RefreshCw, CheckCircle, FileText, Send, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface PayrollRecord {
  id: string;
  employeeType: 'TEACHER' | 'STAFF';
  basicSalary: number;
  totalAllowances: number;
  absentDeduction: number;
  advanceDeduction: number;
  grossSalary: number;
  netPayable: number;
  paidAmount: number;
  dueAmount: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  teacher?: { nameBn: string; teacherId: string };
  staff?: { name: string; employeeId: string; designation: string };
}

interface PayrollMonthData {
  id: string;
  year: number;
  month: number;
  status: string;
  totalGross: number;
  totalDeductions: number;
  totalNetPayable: number;
  totalPaid: number;
  records: PayrollRecord[];
}

export default function PayrollDashboardPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [monthData, setMonthData] = useState<PayrollMonthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Payment modal state
  const [payModalRecord, setPayModalRecord] = useState<PayrollRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK' | 'BKASH' | 'NAGAD'>('CASH');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/payroll/month', {
        params: { year: selectedYear, month: selectedMonth },
      });
      setMonthData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [selectedYear, selectedMonth]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await api.post('/admin/payroll/generate', { year: selectedYear, month: selectedMonth });
      fetchPayroll();
      alert(`${selectedYear} সালের ${selectedMonth} মাসের পে-রোল সফলভাবে জেনারেট করা হয়েছে!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'পে-রোল জেনারেট করতে সমস্যা হয়েছে');
    } finally {
      setGenerating(false);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalRecord || !payAmount) return;

    try {
      setPaying(true);
      await api.post('/admin/payroll/pay', {
        payrollRecordId: payModalRecord.id,
        amountPaid: Number(payAmount),
        paymentMethod: payMethod,
        note: payNote,
      });

      setPayModalRecord(null);
      setPayAmount('');
      setPayNote('');
      fetchPayroll();
      alert('বেতন পেমেন্ট সফলভাবে প্রসেস হয়েছে এবং জেনারেল লেজারে পোস্ট করা হয়েছে!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'পেমেন্ট প্রসেস করতে সমস্যা হয়েছে');
    } finally {
      setPaying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-emerald-600">পরিশোধিত (PAID)</Badge>;
      case 'PARTIAL':
        return <Badge className="bg-amber-600">আংশিক (PARTIAL)</Badge>;
      default:
        return <Badge variant="destructive">বকেয়া (UNPAID)</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payroll & Salary Disbursement (বেতন প্রসেসিং ও ভাউচার)</h1>
          <p className="text-sm text-slate-500">মাসিক শিক্ষক ও স্টাফদের বেতন জেনারেশন, আংশিক/পূর্ণ পেমেন্ট এবং হিসাব লেজার পোস্ট</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/payroll/structure">
            <Button variant="outline">স্যালারি স্ট্রাকচার কনফিগ</Button>
          </Link>
          <Button onClick={fetchPayroll} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> রিফ্রেশ
          </Button>
        </div>
      </div>

      {/* Filter & Batch Generation Controls */}
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

            <select
              className="border rounded p-2 text-sm bg-white font-semibold"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <div>
            {!monthData ? (
              <Button onClick={handleGenerate} disabled={generating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Send className="w-4 h-4 mr-2" /> এই মাসের পে-রোল জেনারেট করুন
              </Button>
            ) : (
              <Badge className="bg-blue-600 text-sm py-1.5 px-3">
                <CheckCircle className="w-4 h-4 mr-1" /> পে-রোল জেনারেটেড (ব্যাচ ID: {monthData.id.slice(0, 8)})
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batch Summary Cards */}
      {monthData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-50">
            <CardContent className="p-4 space-y-1">
              <span className="text-slate-500 text-xs font-semibold">মোট গ্রস বেতন (Gross)</span>
              <div className="text-2xl font-bold font-mono text-slate-800">
                ৳{Number(monthData.totalGross).toLocaleString('bn-BD')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50/60 border-amber-200">
            <CardContent className="p-4 space-y-1">
              <span className="text-amber-600 text-xs font-semibold">মোট কর্তন/এডভান্স (Deductions)</span>
              <div className="text-2xl font-bold font-mono text-amber-700">
                -৳{Number(monthData.totalDeductions).toLocaleString('bn-BD')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/60 border-emerald-200">
            <CardContent className="p-4 space-y-1">
              <span className="text-emerald-600 text-xs font-semibold">মোট প্রদেয় বেতন (Net Payable)</span>
              <div className="text-2xl font-bold font-mono text-emerald-800">
                ৳{Number(monthData.totalNetPayable).toLocaleString('bn-BD')}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/60 border-blue-200">
            <CardContent className="p-4 space-y-1">
              <span className="text-blue-600 text-xs font-semibold">মোট পরিশোধিত (Paid)</span>
              <div className="text-2xl font-bold font-mono text-blue-800">
                ৳{Number(monthData.totalPaid).toLocaleString('bn-BD')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payroll Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>মাসিক বেতন তালিকা ({monthData?.records.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-6 text-slate-500">পে-রোল ডাটা লোড হচ্ছে...</p>
          ) : !monthData ? (
            <div className="text-center py-12 space-y-3">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="font-bold text-slate-700">এই মাসের কোনো পে-রোল ব্যাচ জেনারেট করা হয়নি</h3>
              <p className="text-sm text-slate-500">উপরে 'এই মাসের পে-রোল জেনারেট করুন' বাটনে ক্লিক করে হিসাব শুরু করুন</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>এমপ্লয়ি নাম ও টাইপ</TableHead>
                  <TableHead className="text-right">বেসিক (৳)</TableHead>
                  <TableHead className="text-right">গ্রস বেতন (৳)</TableHead>
                  <TableHead className="text-right">কর্তন/এডভান্স (৳)</TableHead>
                  <TableHead className="text-right">প্রদেয় বেতন (৳)</TableHead>
                  <TableHead className="text-right">পরিশোধিত (৳)</TableHead>
                  <TableHead className="text-right">বকেয়া (৳)</TableHead>
                  <TableHead className="text-center">স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthData.records.map((rec) => {
                  const empName = rec.teacher ? rec.teacher.nameBn : rec.staff?.name;
                  const empCode = rec.teacher ? rec.teacher.teacherId : rec.staff?.employeeId;

                  return (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <div className="font-bold text-slate-800">{empName}</div>
                        <div className="text-xs font-mono text-slate-500">{empCode} ({rec.employeeType})</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">৳{Number(rec.basicSalary).toLocaleString('bn-BD')}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">৳{Number(rec.grossSalary).toLocaleString('bn-BD')}</TableCell>
                      <TableCell className="text-right font-mono text-amber-700">-৳{Number(rec.advanceDeduction + rec.absentDeduction).toLocaleString('bn-BD')}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-800">৳{Number(rec.netPayable).toLocaleString('bn-BD')}</TableCell>
                      <TableCell className="text-right font-mono text-blue-700">৳{Number(rec.paidAmount).toLocaleString('bn-BD')}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-rose-600">৳{Number(rec.dueAmount).toLocaleString('bn-BD')}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(rec.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {Number(rec.dueAmount) > 0 && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setPayModalRecord(rec);
                              setPayAmount(rec.dueAmount.toString());
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <DollarSign className="w-3.5 h-3.5 mr-1" /> পে করুন
                          </Button>
                        )}
                        <Link href={`/admin/payroll/payslip/${rec.id}`}>
                          <Button size="sm" variant="outline">
                            <FileText className="w-3.5 h-3.5 mr-1" /> পে-স্লিপ
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Processing Modal */}
      {payModalRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-slate-800">বেতন পেমেন্ট প্রসেসিং</h2>
            <div className="p-3 bg-slate-50 rounded text-sm space-y-1">
              <div>এমপ্লয়ি: <strong>{payModalRecord.teacher?.nameBn || payModalRecord.staff?.name}</strong></div>
              <div>প্রদেয় মোট বেতন: <strong>৳{payModalRecord.netPayable}</strong></div>
              <div>বর্তমান বকেয়া: <strong className="text-rose-600">৳{payModalRecord.dueAmount}</strong></div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">পেমেন্টের পরিমাণ (৳)</label>
                <Input
                  type="number"
                  required
                  max={payModalRecord.dueAmount}
                  placeholder="টাকার পরিমাণ"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">পেমেন্ট মেথড</label>
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                >
                  <option value="CASH">ক্যাশ (Cash in Hand)</option>
                  <option value="BANK">ব্যাংক স্থানান্তর (Main Bank)</option>
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="NAGAD">নগদ (Nagad)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">নোট (ঐচ্ছিক)</label>
                <Input
                  placeholder="যেমন: প্রথম কিস্তির বেতন"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setPayModalRecord(null)}>বাতিল</Button>
                <Button type="submit" disabled={paying} className="bg-emerald-600 text-white">
                  {paying ? 'প্রসেস হচ্ছে...' : 'পেমেন্ট ডন & লেজার হিট করুন'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
