'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  BookMarked,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookUp,
} from 'lucide-react';

export default function LibraryPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [borrowed, setBorrowed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'books' | 'borrowed' | 'categories'>('books');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCatModal, setShowCatModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);

  // Forms
  const [catForm, setCatForm] = useState({ name: '', code: '', description: '' });
  const [bookForm, setBookForm] = useState({
    categoryId: '',
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    rackLocation: '',
    price: 0,
    totalCopies: 1,
  });
  const [issueForm, setIssueForm] = useState({ studentId: '', days: 14 });
  const [returnForm, setReturnForm] = useState({ fineAmount: 0, isFinePaid: false });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, bookRes, borRes] = await Promise.all([
        fetch('/api/admin/library/categories', { credentials: 'include' }),
        fetch('/api/admin/library/books', { credentials: 'include' }),
        fetch('/api/admin/library/borrowed', { credentials: 'include' }),
      ]);

      const catData = await catRes.json();
      const bookData = await bookRes.json();
      const borData = await borRes.json();

      if (catData.success) setCategories(catData.data || []);
      if (bookData.success) setBooks(bookData.data || []);
      if (borData.success) setBorrowed(borData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/library/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(catForm),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'বই ক্যাটাগরি তৈরি হয়েছে' });
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

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/library/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...bookForm,
          price: Number(bookForm.price),
          totalCopies: Number(bookForm.totalCopies),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'লাইব্রেরিতে বই সফলভাবে যুক্ত হয়েছে' });
        setShowBookModal(false);
        setBookForm({ categoryId: '', title: '', author: '', isbn: '', publisher: '', rackLocation: '', price: 0, totalCopies: 1 });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    try {
      const res = await fetch('/api/admin/library/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookId: selectedBook.id,
          studentId: issueForm.studentId,
          days: Number(issueForm.days),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'বই সফলভাবে ছাত্রকে ইস্যু করা হয়েছে' });
        setShowIssueModal(false);
        setIssueForm({ studentId: '', days: 14 });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleReturnBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    try {
      const res = await fetch('/api/admin/library/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          issueId: selectedIssue.id,
          fineAmount: Number(returnForm.fineAmount),
          isFinePaid: returnForm.isFinePaid,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'বই ফেরত রেকর্ড ও জরিমানা 3050 (Library Fine Income) লেজারে পোস্ট হয়েছে' });
        setShowReturnModal(false);
        setReturnForm({ fineAmount: 0, isFinePaid: false });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            লাইব্রেরি ম্যানেজমেন্ট সিস্টেম (Library System)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            বইয়ের ক্যাটালগ, ইস্যু-ফেরত ও বিলম্ব ফি হিসাব
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCatModal(true)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <BookMarked className="w-4 h-4" /> নতুন ক্যাটাগরি
          </button>
          <button
            onClick={() => setShowBookModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> নতুন বই যুক্ত করুন
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
            <span className="text-sm font-medium text-slate-500">মোট বইয়ের সংখ্যা (Books)</span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white mt-3">{books.length} টি শিরোনাম</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">বর্তমানে ইস্যুকৃত বই</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
              <BookUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-3">
            {borrowed.filter((b) => b.status === 'ISSUED').length} টি কপি
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">বইয়ের বিষয় ক্যাটাগরি</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <BookMarked className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">{categories.length} টি বিষয়</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('books')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'books' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            বই ক্যাটালগ ({books.length})
          </button>
          <button
            onClick={() => setActiveTab('borrowed')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'borrowed' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            ইস্যুকৃত বইয়ের তালিকা ({borrowed.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="বইয়ের নাম বা লেখক..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Books Table */}
      {activeTab === 'books' ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4">বইয়ের নাম</th>
                  <th className="p-4">লেখক / বিষয়</th>
                  <th className="p-4">র‍্যাক অবস্থান</th>
                  <th className="p-4">মোট কপি</th>
                  <th className="p-4">অবশিষ্ট কপি (Available)</th>
                  <th className="p-4 text-right">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      ডাটা লোড হচ্ছে...
                    </td>
                  </tr>
                ) : filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      কোনো বই পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800 dark:text-white">{book.title}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {book.author} <span className="text-xs text-slate-400">({book.category?.name})</span>
                      </td>
                      <td className="p-4 font-mono text-xs">{book.rackLocation || 'N/A'}</td>
                      <td className="p-4 text-slate-700 dark:text-slate-300">{book.totalCopies} টি</td>
                      <td className="p-4 font-bold">
                        <span
                          className={`text-base ${
                            book.availableCopies > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400 font-black'
                          }`}
                        >
                          {book.availableCopies} টি
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          disabled={book.availableCopies <= 0}
                          onClick={() => {
                            setSelectedBook(book);
                            setShowIssueModal(true);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ml-auto ${
                            book.availableCopies > 0
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700'
                          }`}
                        >
                          <BookUp className="w-3.5 h-3.5" /> ইস্যু করুন
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4">বইয়ের নাম</th>
                  <th className="p-4">গ্রহীতা (ছাত্র/শিক্ষক)</th>
                  <th className="p-4">ইস্যুর তারিখ</th>
                  <th className="p-4">মেয়াদ শেষ</th>
                  <th className="p-4">স্ট্যাটাস</th>
                  <th className="p-4 text-right">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {borrowed.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800 dark:text-white">{b.book?.title}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                      {b.student?.nameBn || b.teacher?.nameBn || b.staff?.name || 'N/A'}
                    </td>
                    <td className="p-4 text-xs text-slate-500">{new Date(b.issueDate).toLocaleDateString('bn-BD')}</td>
                    <td className="p-4 text-xs text-slate-500 font-bold">{new Date(b.dueDate).toLocaleDateString('bn-BD')}</td>
                    <td className="p-4">
                      {b.status === 'ISSUED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                          <BookUp className="w-3.5 h-3.5" /> ইস্যুকৃত
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ফেরত সম্পন্ন
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {b.status === 'ISSUED' && (
                        <button
                          onClick={() => {
                            setSelectedIssue(b);
                            setShowReturnModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-1 ml-auto"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> বই ফেরত নিন
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Create Category */}
      {showCatModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">নতুন বই ক্যাটাগরি</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">ক্যাটাগরি কোড (যেমন: TAF, HAD)</label>
                <input
                  type="text"
                  required
                  value={catForm.code}
                  onChange={(e) => setCatForm({ ...catForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-mono"
                  placeholder="TAF"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">ক্যাটাগরি নাম</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                  placeholder="তাফসির ও কোরআন বিজ্ঞান"
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
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Book */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">নতুন বই যুক্ত করুন</h2>
            <form onSubmit={handleCreateBook} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">ক্যাটাগরি</label>
                  <select
                    required
                    value={bookForm.categoryId}
                    onChange={(e) => setBookForm({ ...bookForm, categoryId: e.target.value })}
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
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">বইয়ের নাম (Title)</label>
                  <input
                    type="text"
                    required
                    value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                    placeholder="তাফসীরে ইবনে কাছীর (১ম খণ্ড)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">লেখক (Author)</label>
                  <input
                    type="text"
                    required
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                    placeholder="আল্লামা ইবনে কাছীর (র:)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">র‍্যাক ও শেলফ অবস্থান</label>
                  <input
                    type="text"
                    value={bookForm.rackLocation}
                    onChange={(e) => setBookForm({ ...bookForm, rackLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900"
                    placeholder="Rack A, Shelf 3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">মোট কপি (Total Copies)</label>
                  <input
                    type="number"
                    min={1}
                    value={bookForm.totalCopies}
                    onChange={(e) => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">মূল্য (৳)</label>
                  <input
                    type="number"
                    value={bookForm.price}
                    onChange={(e) => setBookForm({ ...bookForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Issue Book */}
      {showIssueModal && selectedBook && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">বই ইস্যু: {selectedBook.title}</h2>
            <p className="text-xs text-emerald-600 font-medium mb-4">
              অবশিষ্ট কপি: {selectedBook.availableCopies} টি
            </p>
            <form onSubmit={handleIssueBook} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">শিক্ষার্থী ID (UUID)</label>
                <input
                  type="text"
                  required
                  placeholder="Student UUID"
                  value={issueForm.studentId}
                  onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">মেয়াদ (দিন)</label>
                <input
                  type="number"
                  min={1}
                  value={issueForm.days}
                  onChange={(e) => setIssueForm({ ...issueForm, days: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                  ইস্যু নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Return Book */}
      {showReturnModal && selectedIssue && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">বই ফেরত ও বিলম্ব ফি</h2>
            <p className="text-xs text-slate-500 mb-4 font-semibold">
              বই: {selectedIssue.book?.title}
            </p>
            <form onSubmit={handleReturnBook} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">বিলম্ব ফি (যদি থাকে ৳)</label>
                <input
                  type="number"
                  value={returnForm.fineAmount}
                  onChange={(e) => setReturnForm({ ...returnForm, fineAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 font-bold text-emerald-600"
                />
              </div>

              {returnForm.fineAmount > 0 && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="finePaid"
                    checked={returnForm.isFinePaid}
                    onChange={(e) => setReturnForm({ ...returnForm, isFinePaid: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="finePaid" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    জরিমানার টাকা ক্যাশে গ্রহণ করা হয়েছে (3050 Fine Income-এ পোস্ট হবে)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium">
                  ফেরত গ্রহণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
