"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Save,
  Key,
  Building,
  RefreshCw,
} from "lucide-react";

interface PaymentMethod {
  id: string;
  type: string;
  nameBn: string;
  accountNumber: string;
  accountType?: string;
  bankName?: string;
  branchName?: string;
  accountHolderName?: string;
  routingNumber?: string;
  instructions: string;
  isEnabled: boolean;
  apiMode?: "SANDBOX" | "LIVE";
  apiKey?: string;
  apiSecret?: string;
  merchantId?: string;
  updatedAt?: string;
}

export default function PaymentMethodsConsole() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [form, setForm] = useState<Partial<PaymentMethod>>({
    type: "BKASH",
    nameBn: "বিকাশ (bKash)",
    accountNumber: "",
    accountType: "MERCHANT",
    bankName: "",
    branchName: "",
    accountHolderName: "",
    routingNumber: "",
    instructions: "অ্যাপ বা ইউএসএসডি দিয়ে নির্ধারিত মার্চেন্ট নম্বরে পরিশোধ করুন।",
    isEnabled: true,
    apiMode: "SANDBOX",
    apiKey: "",
    apiSecret: "",
    merchantId: "",
  });

  const fetchMethods = () => {
    setLoading(true);
    fetch("/api/admin/payments/methods")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.methods)) {
          setMethods(data.methods);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    try {
      const res = await fetch("/api/admin/payments/methods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isEnabled: !currentEnabled }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMethods(data.methods);
        setMessage({ text: data.message, type: "success" });
      } else {
        setMessage({ text: data.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই পেমেন্ট মেথডটি মুছে ফেলতে চান?")) return;

    try {
      const res = await fetch(`/api/admin/payments/methods?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMethods(data.methods);
        setMessage({ text: data.message, type: "success" });
      } else {
        setMessage({ text: data.error || "মুছতে সমস্যা হয়েছে।", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।", type: "error" });
    }
  };

  const handleEditClick = (method: PaymentMethod) => {
    setEditingId(method.id);
    setForm(method);
    setShowAddForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/payments/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: editingId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMethods(data.methods);
        setMessage({ text: data.message, type: "success" });
        setShowAddForm(false);
        setEditingId(null);
        setForm({
          type: "BKASH",
          nameBn: "বিকাশ (bKash)",
          accountNumber: "",
          accountType: "MERCHANT",
          bankName: "",
          branchName: "",
          accountHolderName: "",
          routingNumber: "",
          instructions: "অ্যাপ বা ইউএসএসডি দিয়ে নির্ধারিত মার্চেন্ট নম্বরে পরিশোধ করুন।",
          isEnabled: true,
          apiMode: "SANDBOX",
          apiKey: "",
          apiSecret: "",
          merchantId: "",
        });
      } else {
        setMessage({ text: data.error || "সংরক্ষণ ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি।", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <span className="text-[11px] font-extrabold text-[#083B25] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            পেমেন্ট মেথড ও গেটওয়ে কনফিগারেশন
          </span>
          <h4 className="text-sm font-bold text-slate-900 mt-1">
            বিকাশ, নগদ, ব্যাংক বা অনলাইন গেটওয়ে ডায়নামিক অ্যাডমিন প্যানেল
          </h4>
          <p className="text-[11px] text-slate-500">
            এখানে যুক্ত করা পেমেন্ট চ্যানেলগুলো শুধুমাত্র অনুদান বা ফি পেমেন্টের সময় প্রদর্শিত হবে (পাবলিক পেজে নম্বর সুরক্ষিত থাকবে)।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchMethods}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 border rounded-lg text-xs"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#083B25] hover:bg-[#062c1c] text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? "ফরম বন্ধ করুন" : "নতুন মেথড যোগ করুন"}</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Add / Edit Form Modal/Collapse */}
      {showAddForm && (
        <form onSubmit={handleFormSubmit} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
          <h5 className="font-bold text-[#083B25] border-b pb-1">
            {editingId ? "পেমেন্ট মেথড সম্পাদনা করুন" : "নতুন পেমেন্ট মেথড বা গেটওয়ে যোগ করুন"}
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">পদ্ধতির ধরন (Type):</label>
              <select
                value={form.type}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    type: val,
                    nameBn:
                      val === "BKASH"
                        ? "বিকাশ (bKash)"
                        : val === "NAGAD"
                        ? "নগদ (Nagad)"
                        : val === "ROCKET"
                        ? "রকেট (Rocket)"
                        : val === "BANK"
                        ? "ব্যাংক ট্রান্সফার (Bank Deposit)"
                        : val === "SSLCOMMERZ"
                        ? "এসএসএল কমার্জ (SSLCommerz Gateway)"
                        : "আমার পে (AamarPay Gateway)",
                  });
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              >
                <option value="BKASH">বিকাশ (bKash)</option>
                <option value="NAGAD">নগদ (Nagad)</option>
                <option value="ROCKET">রকেট (Rocket)</option>
                <option value="BANK">ব্যাংক ট্রান্সফার (Bank)</option>
                <option value="SSLCOMMERZ">SSLCommerz গেটওয়ে</option>
                <option value="AAMARPAY">AamarPay গেটওয়ে</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">পদ্ধতির নাম (বাংলা):</label>
              <input
                type="text"
                value={form.nameBn || ""}
                onChange={(e) => setForm({ ...form, nameBn: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                placeholder="যেমন: বিকাশ মার্চেন্ট"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">হিসাব নম্বর / মার্চেন্ট নম্বর / ID:</label>
              <input
                type="text"
                value={form.accountNumber || ""}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono"
                placeholder="01XXXXXXXXX বা অ্যাকাউন্ট নং"
              />
            </div>
          </div>

          {form.type === "BANK" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-white rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ব্যাংকের নাম:</label>
                <input
                  type="text"
                  value={form.bankName || ""}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="ইসলামী ব্যাংক / সোনালী ব্যাংক"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">শাখার নাম (Branch):</label>
                <input
                  type="text"
                  value={form.branchName || ""}
                  onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                  placeholder="ইলিয়টগঞ্জ শাখা"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">হিসাবধারীর নাম:</label>
                <input
                  type="text"
                  value={form.accountHolderName || ""}
                  onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                  placeholder="মাদরাসা ফান্ড একাউন্ট"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">রাউটিং নম্বর (Routing):</label>
                <input
                  type="text"
                  value={form.routingNumber || ""}
                  onChange={(e) => setForm({ ...form, routingNumber: e.target.value })}
                  placeholder="125XXXXXX"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono"
                />
              </div>
            </div>
          )}

          {/* API Credentials (optional for gateways) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              API বা মার্চেন্ট ইন্টিগ্রেশন (প্রযোজ্য ক্ষেত্রে):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">মার্চেন্ট আইডি / স্টোর আইডি:</label>
                <input
                  type="text"
                  value={form.merchantId || ""}
                  onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px]"
                  placeholder="MERCHANT_ID"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">API Key / App Key:</label>
                <input
                  type="password"
                  value={form.apiKey || ""}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px]"
                  placeholder="API Key"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">API Secret / Password:</label>
                <input
                  type="password"
                  value={form.apiSecret || ""}
                  onChange={(e) => setForm({ ...form, apiSecret: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px]"
                  placeholder="Secret Key"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">পেমেন্ট নির্দেশনা (Instructions):</label>
            <textarea
              rows={2}
              value={form.instructions || ""}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              placeholder="পেমেন্ট করার নিয়ম বা TrxID প্রদানের নির্দেশনা..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#083B25] hover:bg-[#062c1c] text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "সংরক্ষণ হচ্ছে..." : "পেমেন্ট মেথড সংরক্ষণ করুন"}</span>
            </button>
          </div>
        </form>
      )}

      {/* List of Configured Methods */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500">পেমেন্ট মেথড তালিকা লোড হচ্ছে...</div>
        ) : methods.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed">
            কোনো পেমেন্ট মেথড কনফিগার করা নেই। নতুন পেমেন্ট মেথড যোগ করুন।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {methods.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition space-y-2 relative ${
                  m.isEnabled
                    ? "bg-white border-slate-200 shadow-sm"
                    : "bg-slate-50 border-slate-200 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#083B25] block">{m.nameBn}</span>
                    <span className="text-[11px] font-mono text-slate-500 uppercase">{m.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggle(m.id, m.isEnabled)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                        m.isEnabled
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      {m.isEnabled ? <ToggleRight className="w-3.5 h-3.5 text-emerald-700" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      <span>{m.isEnabled ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">হিসাব / মার্চেন্ট:</span>
                    <span className="font-mono font-bold text-slate-900">{m.accountNumber || "N/A"}</span>
                  </div>
                  {m.bankName && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">ব্যাংক:</span>
                      <span className="font-semibold text-slate-800">{m.bankName}</span>
                    </div>
                  )}
                  {m.apiKey && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">API ইন্টিগ্রেশন:</span>
                      <span className="text-emerald-700 font-bold">কনফিগার করা আছে ({m.apiMode || "SANDBOX"})</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500 text-[10px]">
                    আপডেট: {new Date(m.updatedAt || Date.now()).toLocaleDateString("bn-BD")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditClick(m)}
                      className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                      title="সম্পাদনা"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
