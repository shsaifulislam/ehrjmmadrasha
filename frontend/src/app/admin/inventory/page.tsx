'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Layers,
  Search,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function InventoryPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCatModal, setShowCatModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Forms
  const [catForm, setCatForm] = useState({ name: '', code: '', description: '' });
  const [itemForm, setItemForm] = useState({
    categoryId: '',
    name: '',
    code: '',
    unit: 'PIECE',
    minStockAlert: 5,
    unitPrice: 0,
    reorderLevel: 10,
  });
  const [stockForm, setStockForm] = useState({
    movementType: 'STOCK_IN',
    quantity: 1,
    department: '',
    note: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        fetch('/api/admin/inventory/categories', { credentials: 'include' }),
        fetch('/api/admin/inventory/items', { credentials: 'include' }),
      ]);

      const catData = await catRes.json();
      const itemData = await itemRes.json();

      if (catData.success) setCategories(catData.data || []);
      if (itemData.success) setItems(itemData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/inventory/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(catForm),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'ইনভেন্টরি ক্যাটাগরি তৈরি হয়েছে' });
        setShowCatModal(false);
        setCatForm({ name: '', code: '', description: '' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...itemForm,
          minStockAlert: Number(itemForm.minStockAlert),
          unitPrice: Number(itemForm.unitPrice),
          reorderLevel: Number(itemForm.reorderLevel),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'ইনভেন্টরি আইটেম সফলভাবে তৈরি হয়েছে' });
        setShowItemModal(false);
        setItemForm({ categoryId: '', name: '', code: '', unit: 'PIECE', minStockAlert: 5, unitPrice: 0, reorderLevel: 10 });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      const res = await fetch('/api/admin/inventory/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          itemId: selectedItem.id,
          movementType: stockForm.movementType,
          quantity: Number(stockForm.quantity),
          department: stockForm.department,
          note: stockForm.note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'স্টক মুভমেন্ট রেকর্ড ও লেজারে সিঙ্ক হয়েছে' });
        setShowStockModal(false);
        setStockForm({ movementType: 'STOCK_IN', quantity: 1, department: '', note: '' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = items.filter((i) => i.isLowStock).length;

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Package className="w-7 h-7 text-emerald-600" />
              ইনভেন্টরি ও স্টক ড্যাশবোর্ড (Inventory & Stock)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              মালামাল আইটেম, স্টক ইন/আউট এবং লো-স্টক সতর্কতা ট্র্যাকিং
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCatModal(true)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <Layers className="w-4 h-4" /> নতুন ক্যাটাগরি
            </button>
            <button
              onClick={() => setShowItemModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> নতুন আইটেম
            </button>
          </div>
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

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">মোট আইটেম কোড</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-3">{items.length}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">ইনভেন্টরি ক্যাটাগরি</span>
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-3">{categories.length}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">কম স্টকের অ্যালার্ট</span>
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-3">{lowStockCount} টি আইটেম</p>
          </div>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 border-b sm:border-0 border-slate-200">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'items'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              স্টক আইটেম তালিকা ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'categories'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              ক্যাটাগরি সমূহ ({categories.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="আইটেম বা কোড খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Content Table */}
        {activeTab === 'items' ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-4">কোড</th>
                    <th className="p-4">আইটেম নাম</th>
                    <th className="p-4">ক্যাটাগরি</th>
                    <th className="p-4">বর্তমান মজুদ (Stock)</th>
                    <th className="p-4">একক দাম</th>
                    <th className="p-4">অবস্থা</th>
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
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        কোনো ইনভেন্টরি আইটেম পাওয়া যায়নি
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">{item.code}</td>
                        <td className="p-4 font-medium text-slate-800 dark:text-white">{item.name}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">{item.category?.name || 'N/A'}</td>
                        <td className="p-4 font-bold">
                          <span
                            className={`text-base ${
                              item.isLowStock ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300">৳{Number(item.unitPrice).toFixed(2)}</td>
                        <td className="p-4">
                          {item.isLowStock ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5" /> কম মজুদ (Low Alert)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5" /> পর্যাপ্ত মজুদ
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowStockModal(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 ml-auto"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> স্টক ইন / আউট
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                    {cat.code}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {cat.items?.length || 0} টি মালামাল
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-3">{cat.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cat.description || 'কোনো বিবরণ নেই'}</p>
              </div>
            ))}
          </div>
        )}

        {/* Modal 1: Create Category */}
        {showCatModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">নতুন ইনভেন্টরি ক্যাটাগরি</h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    ক্যাটাগরি কোড (যেমন: STN, ELEC)
                  </label>
                  <input
                    type="text"
                    required
                    value={catForm.code}
                    onChange={(e) => setCatForm({ ...catForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-mono"
                    placeholder="ELEC"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    ক্যাটাগরি নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                    placeholder="ইলেকট্রনিক্স ও ফ্যান"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">বিবরণ (ঐচ্ছিক)</label>
                  <textarea
                    rows={2}
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCatModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                  >
                    বাতিল
                  </button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium">
                    সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Create Item */}
        {showItemModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">নতুন ইনভেন্টরি আইটেম</h2>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">ক্যাটাগরি</label>
                    <select
                      required
                      value={itemForm.categoryId}
                      onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                    >
                      <option value="">নির্বাচন করুন</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">আইটেম কোড</label>
                    <input
                      type="text"
                      required
                      value={itemForm.code}
                      onChange={(e) => setItemForm({ ...itemForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-mono"
                      placeholder="ITEM-01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">আইটেমের নাম</label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                    placeholder="খাতা (White Paper A4)"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">একক (Unit)</label>
                    <select
                      value={itemForm.unit}
                      onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                    >
                      <option value="PIECE">পিস (PIECE)</option>
                      <option value="PACKET">প্যাকেট (PACKET)</option>
                      <option value="KG">কেজি (KG)</option>
                      <option value="LITER">লিটার (LITER)</option>
                      <option value="SET">সেট (SET)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">একক দাম (৳)</label>
                    <input
                      type="number"
                      value={itemForm.unitPrice}
                      onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">মজুদ সতর্কতা</label>
                    <input
                      type="number"
                      value={itemForm.minStockAlert}
                      onChange={(e) => setItemForm({ ...itemForm, minStockAlert: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                  >
                    বাতিল
                  </button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium">
                    সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Stock Movement (Stock In / Stock Out) */}
        {showStockModal && selectedItem && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">স্টক পরিবর্তন: {selectedItem.name}</h2>
              <p className="text-xs text-slate-500 mb-4 font-mono">
                বর্তমান মজুদ: <span className="font-bold text-emerald-600">{selectedItem.currentStock} {selectedItem.unit}</span>
              </p>

              <form onSubmit={handleStockMovement} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">মুভমেন্টের ধরন</label>
                  <select
                    value={stockForm.movementType}
                    onChange={(e) => setStockForm({ ...stockForm, movementType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-bold"
                  >
                    <option value="STOCK_IN">➕ স্টক ইন (নতুন মাল ক্রয়/জমা)</option>
                    <option value="STOCK_OUT">➖ স্টক আউট (বিভাগে বিতরণ/ইসু)</option>
                    <option value="DAMAGE">⚠️ ক্ষতিগ্রস্ত / নষ্ট (Damage)</option>
                    <option value="RETURN">🔄 স্টক রিটার্ন</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">পরিমাণ ({selectedItem.unit})</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={stockForm.quantity}
                      onChange={(e) => setStockForm({ ...stockForm, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">গ্রহীতা বিভাগ/হোস্টেল</label>
                    <input
                      type="text"
                      placeholder="যেমন: হিসাব বিভাগ"
                      value={stockForm.department}
                      onChange={(e) => setStockForm({ ...stockForm, department: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">নোট / রেফারেন্স (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={stockForm.note}
                    onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                  />
                </div>

                {stockForm.movementType === 'STOCK_IN' && (
                  <p className="text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200">
                    💡 স্টক ইন ক্রয়ের জন্য ৳{(stockForm.quantity * Number(selectedItem.unitPrice)).toFixed(2)} টাকা স্বয়ংক্রিয়ভাবে General Ledger 4060 (Stationery Expense)-এ ডেবিট ও ক্যাশে ক্রেডিট হবে।
                  </p>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                  >
                    বাতিল
                  </button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium">
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
