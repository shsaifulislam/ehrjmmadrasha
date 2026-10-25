'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Wrench,
  DollarSign,
  Search,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
} from 'lucide-react';

export default function FixedAssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // Forms
  const [assetForm, setAssetForm] = useState({
    assetCode: '',
    name: '',
    category: 'FURNITURE',
    purchasePrice: 0,
    location: '',
    assignedTo: '',
    serialNumber: '',
  });

  const [maintForm, setMaintForm] = useState({
    cost: 0,
    description: '',
    performedBy: '',
    newStatus: 'ACTIVE',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory/assets', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setAssets(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/inventory/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...assetForm,
          purchasePrice: Number(assetForm.purchasePrice),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'স্থায়ী সম্পদ রেজিস্টার্ড ও 1060 Fixed Assets লেজারে জমা হয়েছে' });
        setShowAssetModal(false);
        setAssetForm({ assetCode: '', name: '', category: 'FURNITURE', purchasePrice: 0, location: '', assignedTo: '', serialNumber: '' });
        fetchAssets();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleRecordMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      const res = await fetch('/api/admin/inventory/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assetId: selectedAsset.id,
          cost: Number(maintForm.cost),
          description: maintForm.description,
          performedBy: maintForm.performedBy,
          newStatus: maintForm.newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'মেন্টেন্যান্স খরচ রেকর্ড ও লেজারে পোস্ট হয়েছে' });
        setShowMaintModal(false);
        setMaintForm({ cost: 0, description: '', performedBy: '', newStatus: 'ACTIVE' });
        fetchAssets();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAssetValuation = assets.reduce((sum, a) => sum + Number(a.purchasePrice || 0), 0);

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Building2 className="w-7 h-7 text-indigo-600" />
              স্থায়ী সম্পদ ও আসবাবপত্র রেজিস্ট্রি (Fixed Assets Management)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              মাদ্রাসার ফ্যান, কম্পিউটার, আসবাবপত্র, ভবন ও জেনারেটরের হিসাব ও মেন্টেন্যান্স
            </p>
          </div>
          <button
            onClick={() => setShowAssetModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> নতুন সম্পদ এন্ট্রি
          </button>
        </div>

        {/* Alert Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xs underline">
              বন্ধ করুন
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">মোট নিবন্ধিত সম্পদ</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-3">{assets.length} টি</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">মোট সম্পদের অর্থমূল্য (Capital Value)</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">৳{totalAssetValuation.toLocaleString('bn-BD')}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">মেরামতাধীন সম্পদ</span>
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-3">
              {assets.filter((a) => a.status === 'REPAIR').length} টি
            </p>
          </div>
        </div>

        {/* Filter / Search */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="সম্পদ বা কোড খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4">এসেট কোড</th>
                  <th className="p-4">সম্পদের নাম</th>
                  <th className="p-4">ক্যাটাগরি</th>
                  <th className="p-4">ক্রয়মূল্য</th>
                  <th className="p-4">অবস্থান / দায়িত্বপ্রাপ্ত</th>
                  <th className="p-4">স্ট্যাটাস</th>
                  <th className="p-4 text-right">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      ডাটা লোড হচ্ছে...
                    </td>
                  </tr>
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      কোনো স্থায়ী সম্পদ রেজিস্ট্রি করা হয়নি
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">{asset.assetCode}</td>
                      <td className="p-4 font-medium text-slate-800 dark:text-white">{asset.name}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-semibold">{asset.category}</td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{Number(asset.purchasePrice).toLocaleString('bn-BD')}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 text-xs">
                        {asset.location || 'N/A'} {asset.assignedTo ? `(${asset.assignedTo})` : ''}
                      </td>
                      <td className="p-4">
                        {asset.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" /> সক্রিয় (Active)
                          </span>
                        ) : asset.status === 'REPAIR' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <Wrench className="w-3.5 h-3.5" /> মেরামতাধীন
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <AlertOctagon className="w-3.5 h-3.5" /> {asset.status}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowMaintModal(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Wrench className="w-3.5 h-3.5" /> মেন্টেন্যান্স
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal 1: Register Asset */}
        {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">নতুন স্থায়ী সম্পদ রেজিস্ট্রি</h2>
              <form onSubmit={handleCreateAsset} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">এসেট কোড</label>
                    <input
                      type="text"
                      required
                      value={assetForm.assetCode}
                      onChange={(e) => setAssetForm({ ...assetForm, assetCode: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-mono"
                      placeholder="AST-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">ক্যাটাগরি</label>
                    <select
                      value={assetForm.category}
                      onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                    >
                      <option value="COMPUTER">কম্পিউটার ও আইটি (COMPUTER)</option>
                      <option value="FURNITURE">আসবাবপত্র (FURNITURE)</option>
                      <option value="AC">এসি ও কুলার (AC)</option>
                      <option value="FAN">ফ্যান ও ডাইনিং (FAN)</option>
                      <option value="GENERATOR">জেনারেটর (GENERATOR)</option>
                      <option value="BUILDING">বিল্ডিং ও কাঠামো (BUILDING)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">সম্পদের নাম</label>
                  <input
                    type="text"
                    required
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                    placeholder="ডেল কোর আই ৫ পিসি"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">ক্রয়মূল্য (৳)</label>
                    <input
                      type="number"
                      required
                      value={assetForm.purchasePrice}
                      onChange={(e) => setAssetForm({ ...assetForm, purchasePrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">অবস্থান / রুম</label>
                    <input
                      type="text"
                      value={assetForm.location}
                      onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                      placeholder="আইটি ল্যাব room 202"
                    />
                  </div>
                </div>

                <p className="text-xs text-indigo-600 font-medium bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-lg border border-indigo-200">
                  💡 স্থায়ী সম্পদ ক্রয়ের সাথে সাথে ৳{assetForm.purchasePrice} টাকা General Ledger 1060 (Fixed Assets)-এ ডেবিট ও ক্যাশে ক্রেডিট হবে।
                </p>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAssetModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                  >
                    বাতিল
                  </button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
                    সংরক্ষণ ও লেজারে পোস্ট
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Maintenance */}
        {showMaintModal && selectedAsset && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">মেন্টেন্যান্স এন্ট্রি: {selectedAsset.name}</h2>
              <form onSubmit={handleRecordMaintenance} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">মেরামত খরচ (৳)</label>
                  <input
                    type="number"
                    required
                    value={maintForm.cost}
                    onChange={(e) => setMaintForm({ ...maintForm, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">কাজের বিবরণ</label>
                  <textarea
                    rows={2}
                    required
                    value={maintForm.description}
                    onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                    placeholder="পাওয়ার সাপ্লাই পরিবর্তন ও সার্ভিসিং"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">নতুন স্ট্যাটাস</label>
                  <select
                    value={maintForm.newStatus}
                    onChange={(e) => setMaintForm({ ...maintForm, newStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-bold"
                  >
                    <option value="ACTIVE">সক্রিয় (Active)</option>
                    <option value="REPAIR">মেরামতাধীন (Under Repair)</option>
                    <option value="DISPOSED">পরিত্যাক্ত (Disposed)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowMaintModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                  >
                    বাতিল
                  </button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
                    কনফার্ম করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
