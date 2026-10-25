'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Search, RefreshCw } from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  balance: number;
  isSystem: boolean;
  description?: string;
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', type: 'EXPENSE', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/accounting/chart-of-accounts');
      setAccounts(res.data.data || []);
    } catch (err: any) {
      console.error('Error fetching COA:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/admin/accounting/accounts', formData);
      setShowModal(false);
      setFormData({ code: '', name: '', type: 'EXPENSE', description: '' });
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = accounts.filter(
    (a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search)
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ASSET':
        return <Badge className="bg-emerald-600 text-white">সম্পদ (Asset)</Badge>;
      case 'LIABILITY':
        return <Badge className="bg-rose-600 text-white">দায় (Liability)</Badge>;
      case 'INCOME':
        return <Badge className="bg-blue-600 text-white">আয় (Income)</Badge>;
      case 'EXPENSE':
        return <Badge className="bg-amber-600 text-white">ব্যয় (Expense)</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Chart of Accounts (হিসাব তালিকা)</h1>
          <p className="text-sm text-slate-500">মাদ্রাসার সমস্ত ডাবল-এন্ট্রি হিসাবের ক্যাটাগরি ও বর্তমান ব্যালেন্স</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAccounts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> রিফ্রেশ
          </Button>
          <Button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <PlusCircle className="w-4 h-4 mr-2" /> নতুন অ্যাকাউন্ট যোগ করুন
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">অ্যাকাউন্ট তালিকা ({filtered.length})</CardTitle>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="কোড বা নাম দিয়ে খুঁজুন..."
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
                <TableHead>কোড</TableHead>
                <TableHead>অ্যাকাউন্টের নাম</TableHead>
                <TableHead>টাইপ</TableHead>
                <TableHead>বিবরণ</TableHead>
                <TableHead className="text-right">বর্তমান ব্যালেন্স (৳)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-500">লোড হচ্ছে...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-500">কোনো অ্যাকাউন্ট পাওয়া যায়নি</TableCell>
                </TableRow>
              ) : (
                filtered.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell className="font-mono font-bold text-slate-700">{acc.code}</TableCell>
                    <TableCell className="font-medium text-slate-900">{acc.name}</TableCell>
                    <TableCell>{getTypeBadge(acc.type)}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{acc.description || '-'}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-slate-900">
                      ৳{Number(acc.balance).toLocaleString('bn-BD')}
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
            <h2 className="text-lg font-bold">নতুন অ্যাকাউন্ট তৈরি</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">অ্যাকাউন্ট কোড (যেমন: 4070)</label>
                <Input
                  required
                  placeholder="কোড"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">অ্যাকাউন্টের নাম</label>
                <Input
                  required
                  placeholder="নাম (যেমন: কম্পিউটার মেরামত খরচ)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">অ্যাকাউন্ট টাইপ</label>
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="ASSET">সম্পদ (Asset)</option>
                  <option value="LIABILITY">দায় (Liability)</option>
                  <option value="INCOME">আয় (Income)</option>
                  <option value="EXPENSE">ব্যয় (Expense)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">বিবরণ (ঐচ্ছিক)</label>
                <Input
                  placeholder="বিবরণ"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>বাতিল</Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 text-white">
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
