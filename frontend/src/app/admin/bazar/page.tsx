'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, PlusCircle, RefreshCw, DollarSign, Users, FileText, CheckCircle } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  companyName?: string;
  phone: string;
  currentBalance: number;
}

interface BazarPurchase {
  id: string;
  date: string;
  invoiceNumber: string;
  voucherNumber: string;
  totalAmount: number;
  paymentMethod: string;
  isPaid: boolean;
  vendor?: { name: string };
  items: { id: string; itemName: string; quantity: number; unit: string; unitPrice: number; totalPrice: number }[];
}

export default function DailyBazarPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchases, setPurchases] = useState<BazarPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  // Bazar Modal State
  const [showBazarModal, setShowBazarModal] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK' | 'CREDIT'>('CASH');
  const [items, setItems] = useState([{ itemName: '', quantity: '1', unit: 'KG', unitPrice: '' }]);
  const [submitting, setSubmitting] = useState(false);

  // Vendor Modal State
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');

  // Pay Vendor Modal State
  const [payVendorObj, setPayVendorObj] = useState<Vendor | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [paying, setPaying] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, pRes] = await Promise.all([
        api.get('/admin/bazar/vendors'),
        api.get('/admin/bazar/purchases'),
      ]);
      setVendors(vRes.data.data || []);
      setPurchases(pRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItemLine = () => {
    setItems([...items, { itemName: '', quantity: '1', unit: 'KG', unitPrice: '' }]);
  };

  const handleRemoveItemLine = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/bazar/vendors', { name: vendorName, companyName, phone: vendorPhone });
      setShowVendorModal(false);
      setVendorName('');
      setVendorPhone('');
      fetchData();
      alert('সাপ্লায়ার / ভেন্ডর সফলভাবে যুক্ত হয়েছে!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'ভেন্ডর তৈরি করতে সমস্যা হয়েছে');
    }
  };

  const handleRecordBazar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/admin/bazar/purchases', {
        invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        vendorId: vendorId || undefined,
        paymentMethod,
        items: items.map((i) => ({
          itemName: i.itemName,
          quantity: Number(i.quantity),
          unit: i.unit,
          unitPrice: Number(i.unitPrice),
        })),
      });

      setShowBazarModal(false);
      setItems([{ itemName: '', quantity: '1', unit: 'KG', unitPrice: '' }]);
      fetchData();
      alert('দৈনিক বাজারের হিসাব সংরক্ষিত হয়েছে এবং জেনারেল লেজারে পোস্ট হয়েছে!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'বাজারের এন্ট্রি করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payVendorObj) return;

    try {
      setPaying(true);
      await api.post('/admin/bazar/pay-vendor', {
        vendorId: payVendorObj.id,
        amountPaid: Number(payAmount),
        paymentMethod: payMethod,
      });

      setPayVendorObj(null);
      setPayAmount('');
      fetchData();
      alert('সাপ্লায়ারের বাকি পরিশোধ সফলভাবে লেজারে রেকর্ড করা হয়েছে!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'বাকি পরিশোধ করতে সমস্যা হয়েছে');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daily Bazar & Vendor Payables (দৈনিক বাজার ও ভেন্ডর হিসাব)</h1>
          <p className="text-sm text-slate-500">নগদ/বাকিতে বাজার ক্রয়, চাল/ডাল/সবজি এন্ট্রি এবং সাপ্লায়ার লেজার পোস্ট</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> রিফ্রেশ
          </Button>
          <Button onClick={() => setShowVendorModal(true)} variant="outline">
            <Users className="w-4 h-4 mr-2" /> নতুন সাপ্লায়ার যুক্ত করুন
          </Button>
          <Button onClick={() => setShowBazarModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <ShoppingCart className="w-4 h-4 mr-2" /> নতুন বাজারের এন্ট্রি দিন
          </Button>
        </div>
      </div>

      {/* Supplier Payables Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vendors.map((v) => (
          <Card key={v.id} className="bg-slate-50 border-slate-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">{v.name}</div>
                <div className="text-xs text-slate-500">{v.companyName || 'সাপ্লায়ার'} | {v.phone}</div>
                <div className="mt-2 text-xs text-slate-600">
                  বর্তমান বাকি (Payable): <strong className="font-mono text-rose-600 text-sm">৳{Number(v.currentBalance).toLocaleString('bn-BD')}</strong>
                </div>
              </div>
              {Number(v.currentBalance) > 0 && (
                <Button size="sm" onClick={() => setPayVendorObj(v)} className="bg-emerald-600 text-white text-xs">
                  বাকি পরিশোধ করুন
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Bazar Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" /> সাম্প্রতিক বাজারের তালিকা ({purchases.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-6 text-slate-500">বাজার ডাটা লোড হচ্ছে...</p>
          ) : purchases.length === 0 ? (
            <p className="text-center py-6 text-slate-500">কোনো বাজারের রেকর্ড পাওয়া যায়নি</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>তারিখ & চালান</TableHead>
                  <TableHead>ভাউচার#</TableHead>
                  <TableHead>সাপ্লায়ার</TableHead>
                  <TableHead>পণ্যের বিবরণ</TableHead>
                  <TableHead className="text-right">মোট টাকা (৳)</TableHead>
                  <TableHead className="text-center">মেথড</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-bold text-slate-800">{new Date(p.date).toLocaleDateString('bn-BD')}</div>
                      <div className="text-xs font-mono text-slate-500">চালান: #{p.invoiceNumber}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-emerald-700">{p.voucherNumber}</TableCell>
                    <TableCell>{p.vendor?.name || 'নগদ বাজার'}</TableCell>
                    <TableCell className="text-xs">
                      {p.items.map((i) => `${i.itemName} (${i.quantity}${i.unit} x ৳${i.unitPrice})`).join(', ')}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-slate-900">
                      ৳{Number(p.totalAmount).toLocaleString('bn-BD')}
                    </TableCell>
                    <TableCell className="text-center">
                      {p.paymentMethod === 'CREDIT' ? (
                        <Badge className="bg-rose-600">বাকিতে (CREDIT)</Badge>
                      ) : (
                        <Badge className="bg-emerald-600">নগদ ({p.paymentMethod})</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bazar Entry Modal */}
      {showBazarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800">দৈনিক বাজারের এন্ট্রি দিন</h2>
            <form onSubmit={handleRecordBazar} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">চালান নম্বর</label>
                  <Input placeholder="INV-1001" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">পেমেন্ট পদ্ধতি</label>
                  <select
                    className="w-full border rounded p-2 text-sm"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                  >
                    <option value="CASH">নগদ ক্যাশ (Cash)</option>
                    <option value="BANK">ব্যাংক স্থানান্তর (Bank)</option>
                    <option value="CREDIT">বাকিতে বাজার (Credit Supplier)</option>
                  </select>
                </div>
              </div>

              {paymentMethod === 'CREDIT' && (
                <div>
                  <label className="text-xs font-semibold text-slate-600">সাপ্লায়ার নির্বাচন করুন</label>
                  <select
                    className="w-full border rounded p-2 text-sm"
                    required
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                  >
                    <option value="">সাপ্লায়ার নির্বাচন করুন...</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-700">পণ্যের তালিকা</h3>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddItemLine}>
                    + আরও পণ্য যোগ করুন
                  </Button>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        required
                        placeholder="পণ্যের নাম (যেমন: চাল, সবজি, মাছ)"
                        value={item.itemName}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].itemName = e.target.value;
                          setItems(updated);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        required
                        placeholder="পরিমাণ"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].quantity = e.target.value;
                          setItems(updated);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        className="w-full border rounded p-2 text-sm"
                        value={item.unit}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].unit = e.target.value;
                          setItems(updated);
                        }}
                      >
                        <option value="KG">কেজি (KG)</option>
                        <option value="LITER">লিটার</option>
                        <option value="PIECE">পিস</option>
                        <option value="BAG">বস্তা (BAG)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        required
                        placeholder="একক দর (৳)"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].unitPrice = e.target.value;
                          setItems(updated);
                        }}
                      />
                    </div>
                    <div className="col-span-1">
                      {items.length > 1 && (
                        <Button type="button" size="sm" variant="destructive" onClick={() => handleRemoveItemLine(idx)}>
                          ✕
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowBazarModal(false)}>বাতিল</Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 text-white">
                  {submitting ? 'সংরক্ষণ হচ্ছে...' : 'বাজার সেভ করুন & লেজার হিট দিন'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-slate-800">নতুন সাপ্লায়ার / ভেন্ডর</h2>
            <form onSubmit={handleCreateVendor} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">সাপ্লায়ার নাম</label>
                <Input required placeholder="যেমন: রহিম ট্রেডার্স" value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">কোম্পানি / দোকানের নাম</label>
                <Input placeholder="যেমন: রাইস এজেন্সী" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">মোবাইল নম্বর</label>
                <Input required placeholder="018XXXXXXXX" value={vendorPhone} onChange={(e) => setVendorPhone(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowVendorModal(false)}>বাতিল</Button>
                <Button type="submit" className="bg-emerald-600 text-white">যুক্ত করুন</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Vendor Modal */}
      {payVendorObj && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-slate-800">সাপ্লায়ার বাকি পরিশোধ</h2>
            <div className="p-3 bg-slate-50 rounded text-sm space-y-1">
              <div>সাপ্লায়ার: <strong>{payVendorObj.name}</strong></div>
              <div>বর্তমান বাকি: <strong className="text-rose-600">৳{payVendorObj.currentBalance}</strong></div>
            </div>

            <form onSubmit={handlePayVendor} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">পরিশোধের পরিমাণ (৳)</label>
                <Input
                  type="number"
                  required
                  max={payVendorObj.currentBalance}
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
                  <option value="BANK">ব্যাংক স্থানান্তর (Bank)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setPayVendorObj(null)}>বাতিল</Button>
                <Button type="submit" disabled={paying} className="bg-emerald-600 text-white">
                  {paying ? 'প্রসেস হচ্ছে...' : 'পরিশোধ করুন & লেজার সিঙ্ক দিন'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
