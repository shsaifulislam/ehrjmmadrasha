'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserCheck, PlusCircle, Search, RefreshCw, Briefcase, Phone } from 'lucide-react';

interface Staff {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  designation: string;
  department?: string;
  paymentMethod: string;
  isActive: boolean;
  salaryStructure?: { basicSalary: number; grossSalary: number };
}

export default function StaffDirectoryPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    designation: 'Office Assistant',
    department: 'Administration',
    address: '',
    nid: '',
    paymentMethod: 'CASH',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/staff');
      setStaffList(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/admin/staff', formData);
      setShowModal(false);
      setFormData({
        name: '',
        phone: '',
        designation: 'Office Assistant',
        department: 'Administration',
        address: '',
        nid: '',
        paymentMethod: 'CASH',
      });
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || 'কর্মচারী যুক্ত করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = staffList.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.employeeId.includes(search) || s.designation.includes(search)
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff & HR Management (কর্মচারী তালিকা)</h1>
          <p className="text-sm text-slate-500">মাদ্রাসার অশিক্ষক কর্মচারী (অফিস সহকারী, হিসাবরক্ষক, ড্রাইভার, বাবুর্চি, সিকিউরিটি গার্ড) ব্যবস্থাপনা</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchStaff} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> রিফ্রেশ
          </Button>
          <Button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <PlusCircle className="w-4 h-4 mr-2" /> নতুন কর্মচারী যুক্ত করুন
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              কর্মচারী তালিকা ({filtered.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>আইডি</TableHead>
                <TableHead>নাম</TableHead>
                <TableHead>পদবী</TableHead>
                <TableHead>মোবাইল</TableHead>
                <TableHead>স্যালারি স্ট্রাকচার</TableHead>
                <TableHead>পেমেন্ট মেথড</TableHead>
                <TableHead className="text-right">স্ট্যাটাস</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-slate-500">লোড হচ্ছে...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-slate-500">কোনো কর্মচারী পাওয়া যায়নি</TableCell>
                </TableRow>
              ) : (
                filtered.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-mono font-bold text-slate-700">{staff.employeeId}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{staff.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center w-fit gap-1">
                        <Briefcase className="w-3 h-3" /> {staff.designation}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-slate-600">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {staff.phone}</span>
                    </TableCell>
                    <TableCell>
                      {staff.salaryStructure ? (
                        <span className="font-mono font-bold text-emerald-700">
                          ৳{Number(staff.salaryStructure.grossSalary).toLocaleString('bn-BD')} (গ্রস)
                        </span>
                      ) : (
                        <Badge variant="destructive">স্ট্রাকচার সেট নেই</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{staff.paymentMethod}</TableCell>
                    <TableCell className="text-right">
                      {staff.isActive ? (
                        <Badge className="bg-emerald-600">সক্রিয় (Active)</Badge>
                      ) : (
                        <Badge variant="secondary">নিষ্ক্রিয়</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-slate-800">নতুন কর্মচারী যুক্ত করুন</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">পূর্ণ নাম</label>
                <Input
                  required
                  placeholder="যেমন: আব্দুর রহিম"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">মোবাইল নম্বর</label>
                <Input
                  required
                  placeholder="018XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">পদবী (Designation)</label>
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                >
                  <option value="Accountant">হিসাবরক্ষক (Accountant)</option>
                  <option value="Office Assistant">অফিস সহকারী (Office Assistant)</option>
                  <option value="Cook">প্রধান বাবুর্চি (Head Cook)</option>
                  <option value="Guard">দারোয়ান/সিকিউরিটি (Guard)</option>
                  <option value="Cleaner">পরিচ্ছন্নতাকর্মী (Cleaner)</option>
                  <option value="Driver">ড্রাইভার (Driver)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">পেমেন্ট মেথড</label>
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="CASH">ক্যাশ (Cash)</option>
                  <option value="BANK">ব্যাংক (Bank Account)</option>
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="NAGAD">নগদ (Nagad)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>বাতিল</Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 text-white">
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'যুক্ত করুন'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
