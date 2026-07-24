'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PrintablePayslipPage() {
  const params = useParams();
  const id = params.id as string;
  const [payslip, setPayslip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayslip = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/payroll/payslip/${id}`);
        setPayslip(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayslip();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">পে-স্লিপ লোড হচ্ছে...</div>;
  if (!payslip) return <div className="p-8 text-center text-rose-500">পে-স্লিপ পাওয়া যায়নি</div>;

  const empName = payslip.teacher ? payslip.teacher.nameBn : payslip.staff?.name;
  const empCode = payslip.teacher ? payslip.teacher.teacherId : payslip.staff?.employeeId;
  const designation = payslip.teacher ? payslip.teacher.designation || 'শিক্ষক' : payslip.staff?.designation;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/admin/payroll">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> পে-রোলে ফিরে যান</Button>
        </Link>
        <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Printer className="w-4 h-4 mr-2" /> প্রিন্ট করুন (Print Payslip)
        </Button>
      </div>

      {/* Printable Payslip Container */}
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow border border-slate-200 print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="text-center border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা</h1>
          <p className="text-sm text-slate-600">মাসিক বেতন রশিদ / স্যালারি পে-স্লিপ (Salary Slip)</p>
          <div className="mt-2 text-xs font-semibold uppercase bg-slate-100 py-1 px-4 rounded-full inline-block">
            মাস: {payslip.payrollMonth.month}/{payslip.payrollMonth.year} | রসিদ ID: {payslip.id.slice(0, 8)}
          </div>
        </div>

        {/* Employee Info */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded mb-6 text-sm">
          <div>
            <span className="text-slate-500 block text-xs">এমপ্লয়ি নাম:</span>
            <strong className="text-base text-slate-900">{empName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">এমপ্লয়ি আইডি & পদবী:</span>
            <strong>{empCode} ({designation})</strong>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="space-y-4 mb-6">
          <h3 className="font-bold text-sm text-slate-700 border-b pb-1">বেতন ও কর্তনের বিবরণ (Salary Breakdown)</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-2 text-left">বিবরণ (Earnings / Deductions)</th>
                <th className="p-2 text-right">পরিমাণ (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-2">মূল বেতন (Basic Salary)</td>
                <td className="p-2 text-right font-mono">৳{Number(payslip.basicSalary).toLocaleString('bn-BD')}</td>
              </tr>
              <tr>
                <td className="p-2">মোট ভাতাসমূহ (Total Allowances)</td>
                <td className="p-2 text-right font-mono">+৳{Number(payslip.totalAllowances).toLocaleString('bn-BD')}</td>
              </tr>
              <tr className="font-bold bg-slate-50">
                <td className="p-2">মোট গ্রস বেতন (Gross Salary)</td>
                <td className="p-2 text-right font-mono">৳{Number(payslip.grossSalary).toLocaleString('bn-BD')}</td>
              </tr>
              {Number(payslip.advanceDeduction) > 0 && (
                <tr className="text-amber-800">
                  <td className="p-2">এডভান্স এডজাস্টমেন্ট কর্তন (Advance Deduction)</td>
                  <td className="p-2 text-right font-mono">-৳{Number(payslip.advanceDeduction).toLocaleString('bn-BD')}</td>
                </tr>
              )}
              {Number(payslip.absentDeduction) > 0 && (
                <tr className="text-amber-800">
                  <td className="p-2">অনুপস্থিতি কর্তন (Absent Deduction)</td>
                  <td className="p-2 text-right font-mono">-৳{Number(payslip.absentDeduction).toLocaleString('bn-BD')}</td>
                </tr>
              )}
              <tr className="font-bold text-base bg-emerald-50 text-emerald-900 border-t-2 border-emerald-600">
                <td className="p-3">নিট প্রদেয় বেতন (Net Payable)</td>
                <td className="p-3 text-right font-mono text-lg">৳{Number(payslip.netPayable).toLocaleString('bn-BD')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment History */}
        <div className="space-y-3 mb-8">
          <h3 className="font-bold text-sm text-slate-700 border-b pb-1">পেমেন্ট গ্রহণ বিবরণী (Payment History)</h3>
          <table className="w-full text-sm border">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-2 text-left">তারিখ</th>
                <th className="p-2 text-left">ভাউচার নম্বর</th>
                <th className="p-2 text-left">মেথড</th>
                <th className="p-2 text-right">প্রদত্ত পরিমাণ (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payslip.payments.map((p: any) => (
                <tr key={p.id}>
                  <td className="p-2">{new Date(p.paymentDate).toLocaleDateString('bn-BD')}</td>
                  <td className="p-2 font-mono text-xs text-emerald-700 font-bold">{p.voucherNumber}</td>
                  <td className="p-2 font-mono text-xs">{p.paymentMethod}</td>
                  <td className="p-2 text-right font-mono font-bold">৳{Number(p.amountPaid).toLocaleString('bn-BD')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center p-3 bg-slate-50 rounded border text-sm font-semibold">
            <span>মোট পরিশোধিত: <strong className="text-emerald-700">৳{payslip.paidAmount}</strong></span>
            <span>অবশিষ্ট বকেয়া: <strong className="text-rose-600">৳{payslip.dueAmount}</strong></span>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
          <div>
            <div className="border-t border-slate-400 w-36 mx-auto mb-1"></div>
            গ্রাহক / কর্মচারীর স্বাক্ষর
          </div>
          <div>
            <div className="border-t border-slate-400 w-36 mx-auto mb-1"></div>
            হিসাবরক্ষক / অধ্যক্ষ স্বাক্ষর
          </div>
        </div>
      </div>
    </div>
  );
}
