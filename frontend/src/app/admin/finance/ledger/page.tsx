'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, FileText, Calendar, CheckCircle2 } from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
}

interface JournalLine {
  id: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  description?: string;
  account: Account;
}

interface JournalEntry {
  id: string;
  voucherNumber: string;
  date: string;
  description: string;
  reference?: string;
  createdBy: { username: string };
  lines: JournalLine[];
}

export default function GeneralLedgerPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Journal creation form state
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<Array<{ accountId: string; type: 'DEBIT' | 'CREDIT'; amount: string; description: string }>>([
    { accountId: '', type: 'DEBIT', amount: '', description: '' },
    { accountId: '', type: 'CREDIT', amount: '', description: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ledgerRes, coaRes] = await Promise.all([
        api.get('/admin/accounting/ledger'),
        api.get('/admin/accounting/chart-of-accounts'),
      ]);
      setEntries(ledgerRes.data.data || []);
      setAccounts(coaRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addLine = () => {
    setLines([...lines, { accountId: '', type: 'DEBIT', amount: '', description: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, value: string) => {
    const newLines = [...lines];
    (newLines[index] as any)[field] = value;
    setLines(newLines);
  };

  const calculateTotals = () => {
    let debit = 0;
    let credit = 0;
    lines.forEach((l) => {
      const amt = Number(l.amount) || 0;
      if (l.type === 'DEBIT') debit += amt;
      if (l.type === 'CREDIT') credit += amt;
    });
    return { debit, credit, isBalanced: Math.abs(debit - credit) < 0.01 && debit > 0 };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isBalanced } = calculateTotals();
    if (!isBalanced) {
      alert('ডেবিট এবং ক্রেডিট এর পরিমাণ সমান নয় বা ০ এর বেশি হতে হবে!');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/admin/accounting/journal-entry', {
        description,
        reference,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          type: l.type,
          amount: Number(l.amount),
          description: l.description,
        })),
      });

      setShowModal(false);
      setDescription('');
      setReference('');
      setLines([
        { accountId: '', type: 'DEBIT', amount: '', description: '' },
        { accountId: '', type: 'CREDIT', amount: '', description: '' },
      ]);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'জার্নাল তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">General Ledger & Journal Entries</h1>
          <p className="text-sm text-slate-500">মাদ্রাসার সমস্ত ডাবল-এন্ট্রি লেনদেন ও ভাউচার লেজার</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <PlusCircle className="w-4 h-4 mr-2" /> নতুন ডাবল-এন্ট্রি জার্নাল
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            জার্নাল ভাউচার সমূহ ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-6 text-slate-500">লোড হচ্ছে...</p>
          ) : entries.length === 0 ? (
            <p className="text-center py-6 text-slate-500">কোনো লেজার এন্ট্রি পাওয়া যায়নি</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 bg-slate-50 space-y-3">
                  <div className="flex justify-between items-start border-b pb-2">
                    <div>
                      <span className="font-mono font-bold text-emerald-700">{entry.voucherNumber}</span>
                      <span className="text-sm text-slate-500 ml-3">{new Date(entry.date).toLocaleDateString('bn-BD')}</span>
                      <h3 className="font-semibold text-slate-800 mt-1">{entry.description}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      এন্ট্রি করেছে: {entry.createdBy?.username}
                    </Badge>
                  </div>
                  <Table className="bg-white rounded">
                    <TableHeader>
                      <TableRow>
                        <TableHead>অ্যাকাউন্ট</TableHead>
                        <TableHead>বিবরণ</TableHead>
                        <TableHead className="text-right">ডেবিট (৳)</TableHead>
                        <TableHead className="text-right">ক্রেডিট (৳)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entry.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">
                            <span className="font-mono text-slate-500 mr-2">{line.account.code}</span>
                            {line.account.name}
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">{line.description || '-'}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-700">
                            {line.type === 'DEBIT' ? `৳${Number(line.amount).toLocaleString('bn-BD')}` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-blue-700">
                            {line.type === 'CREDIT' ? `৳${Number(line.amount).toLocaleString('bn-BD')}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800">নতুন ডাবল-এন্ট্রি জার্নাল ভাউচার তৈরি</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">ভাউচার বিবরণ / বাবদ</label>
                <Input
                  required
                  placeholder="যেমন: শিক্ষক বেতন প্রদান অথবা বিদ্যুৎ বিল প্রদান"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2 border p-3 rounded bg-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">জার্নাল অ্যাকাউন্ট লাইনস (অন্তত ২টি)</span>
                  <Button type="button" size="sm" variant="outline" onClick={addLine}>+ লাইন যোগ করুন</Button>
                </div>

                {lines.map((line, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select
                      className="border rounded p-2 text-sm flex-1"
                      required
                      value={line.accountId}
                      onChange={(e) => updateLine(index, 'accountId', e.target.value)}
                    >
                      <option value="">অ্যাকাউন্ট নির্বাচন করুন</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="border rounded p-2 text-sm w-28"
                      value={line.type}
                      onChange={(e) => updateLine(index, 'type', e.target.value as any)}
                    >
                      <option value="DEBIT">ডেবিট</option>
                      <option value="CREDIT">ক্রেডিট</option>
                    </select>

                    <Input
                      type="number"
                      placeholder="টাকা"
                      className="w-28"
                      required
                      value={line.amount}
                      onChange={(e) => updateLine(index, 'amount', e.target.value)}
                    />

                    {lines.length > 2 && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeLine(index)}>
                        ✕
                      </Button>
                    )}
                  </div>
                ))}

                <div className="flex justify-between items-center pt-2 border-t font-mono text-sm">
                  <div>
                    মোট ডেবিট: <span className="font-bold text-emerald-700">৳{totals.debit}</span> | মোট ক্রেডিট: <span className="font-bold text-blue-700">৳{totals.credit}</span>
                  </div>
                  {totals.isBalanced ? (
                    <Badge className="bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1" /> ব্যালেন্সড</Badge>
                  ) : (
                    <Badge variant="destructive">ইমব্যালেন্সড</Badge>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>বাতিল</Button>
                <Button type="submit" disabled={submitting || !totals.isBalanced} className="bg-emerald-600 text-white">
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'ভাউচার পোস্ট করুন'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
