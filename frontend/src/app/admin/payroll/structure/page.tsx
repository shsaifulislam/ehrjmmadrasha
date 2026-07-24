'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, UserCheck } from 'lucide-react';
import Link from 'next/link';

interface Teacher {
  id: string;
  teacherId: string;
  nameBn: string;
  designation?: string;
  salaryStructure?: any;
}

interface Staff {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  salaryStructure?: any;
}

export default function SalaryStructurePage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTarget, setSelectedTarget] = useState<{ id: string; type: 'TEACHER' | 'STAFF'; name: string } | null>(null);
  const [basic, setBasic] = useState('');
  const [house, setHouse] = useState('');
  const [medical, setMedical] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, sRes] = await Promise.all([
        api.get('/admin/teachers'),
        api.get('/admin/staff'),
      ]);
      setTeachers(tRes.data.data || []);
      setStaffList(sRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget || !basic) return;

    try {
      setSaving(true);
      const payload: any = {
        basicSalary: Number(basic),
        houseRent: Number(house || 0),
        medicalAllowance: Number(medical || 0),
      };

      if (selectedTarget.type === 'TEACHER') {
        payload.teacherId = selectedTarget.id;
      } else {
        payload.staffId = selectedTarget.id;
      }

      await api.post('/admin/payroll/structure', payload);
      setSelectedTarget(null);
      setBasic('');
      setHouse('');
      setMedical('');
      fetchData();
      alert('স্যালারি স্ট্রাকচার সফলভাবে সংরক্ষণ হয়েছে!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'স্যালারি সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Salary Structure Configuration (স্যালারি কনফিগারেশন)</h1>
          <p className="text-sm text-slate-500">শিক্ষক ও কর্মচারীদের বেসিক বেতন ও ভাতাসমূহ সেট করুন</p>
        </div>
        <Link href="/admin/payroll">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> পে-রোল ড্যাশবোর্ডে ফিরুন</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">শিক্ষক ও কর্মচারীদের বেতন স্ট্রাকচার তালিকা</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-6 text-slate-500">ডাটা লোড হচ্ছে...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>টাইপ</TableHead>
                  <TableHead>আইডি</TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead>পদবী</TableHead>
                  <TableHead className="text-right">বেসিক (৳)</TableHead>
                  <TableHead className="text-right">বাড়ি ভাড়া (৳)</TableHead>
                  <TableHead className="text-right">চিকিৎসা ভাতা (৳)</TableHead>
                  <TableHead className="text-right">গ্রস বেতন (৳)</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Teachers */}
                {teachers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell><span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">TEACHER</span></TableCell>
                    <TableCell className="font-mono">{t.teacherId}</TableCell>
                    <TableCell className="font-bold">{t.nameBn}</TableCell>
                    <TableCell className="text-slate-500">{t.designation || '-'}</TableCell>
                    <TableCell className="text-right font-mono">৳{t.salaryStructure?.basicSalary || 0}</TableCell>
                    <TableCell className="text-right font-mono text-slate-500">৳{t.salaryStructure?.houseRent || 0}</TableCell>
                    <TableCell className="text-right font-mono text-slate-500">৳{t.salaryStructure?.medicalAllowance || 0}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-700">৳{t.salaryStructure?.grossSalary || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTarget({ id: t.id, type: 'TEACHER', name: t.nameBn });
                          setBasic(t.salaryStructure?.basicSalary?.toString() || '');
                          setHouse(t.salaryStructure?.houseRent?.toString() || '');
                          setMedical(t.salaryStructure?.medicalAllowance?.toString() || '');
                        }}
                        className="bg-emerald-600 text-white"
                      >
                        কনফিগ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Staff */}
                {staffList.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell><span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">STAFF</span></TableCell>
                    <TableCell className="font-mono">{s.employeeId}</TableCell>
                    <TableCell className="font-bold">{s.name}</TableCell>
                    <TableCell className="text-slate-500">{s.designation}</TableCell>
                    <TableCell className="text-right font-mono">৳{s.salaryStructure?.basicSalary || 0}</TableCell>
                    <TableCell className="text-right font-mono text-slate-500">৳{s.salaryStructure?.houseRent || 0}</TableCell>
                    <TableCell className="text-right font-mono text-slate-500">৳{s.salaryStructure?.medicalAllowance || 0}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-700">৳{s.salaryStructure?.grossSalary || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTarget({ id: s.id, type: 'STAFF', name: s.name });
                          setBasic(s.salaryStructure?.basicSalary?.toString() || '');
                          setHouse(s.salaryStructure?.houseRent?.toString() || '');
                          setMedical(s.salaryStructure?.medicalAllowance?.toString() || '');
                        }}
                        className="bg-emerald-600 text-white"
                      >
                        কনফিগ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Structure Config Modal */}
      {selectedTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-slate-800">স্যালারি স্ট্রাকচার সেট: {selectedTarget.name}</h2>
            <form onSubmit={handleSaveStructure} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">মূল বেতন / বেসিক (৳)</label>
                <Input
                  type="number"
                  required
                  placeholder="যেমন: 15000"
                  value={basic}
                  onChange={(e) => setBasic(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">বাড়ি ভাড়া ভাতা (৳)</label>
                <Input
                  type="number"
                  placeholder="যেমন: 3000"
                  value={house}
                  onChange={(e) => setHouse(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">চিকিৎসা ভাতা (৳)</label>
                <Input
                  type="number"
                  placeholder="যেমন: 1000"
                  value={medical}
                  onChange={(e) => setMedical(e.target.value)}
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded text-sm font-semibold text-emerald-900">
                মোট গ্রস বেতন: ৳{(Number(basic || 0) + Number(house || 0) + Number(medical || 0)).toLocaleString('bn-BD')}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedTarget(null)}>বাতিল</Button>
                <Button type="submit" disabled={saving} className="bg-emerald-600 text-white">
                  <Save className="w-4 h-4 mr-1" /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
