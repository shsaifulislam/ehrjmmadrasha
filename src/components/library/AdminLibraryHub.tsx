"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Bookmark,
  Layers,
  Users,
  Repeat,
  AlertTriangle,
  FileText,
  Settings,
  PlusCircle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  QrCode,
  DollarSign,
  Info,
  Calendar,
  ShieldCheck,
  Check,
  RotateCw,
} from "lucide-react";

export default function AdminLibraryHub() {
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "BOOKS" | "COPIES" | "ISSUES" | "MEMBERS" | "CATEGORIES" | "RULES"
  >("OVERVIEW");

  // Global State
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Books State
  const [books, setBooks] = useState<any[]>([]);
  const [bookSearch, setBookSearch] = useState("");
  const [bookCategoryFilter, setBookCategoryFilter] = useState("");
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [newBook, setNewBook] = useState({
    titleBn: "",
    titleEn: "",
    subtitle: "",
    categoryId: "",
    authorId: "",
    publisherId: "",
    edition: "",
    publicationYear: "",
    isbn: "",
    language: "BANGLA",
    subject: "",
    shelfLocation: "",
    description: "",
    initialCopiesCount: 1,
    initialPurchasePrice: 150,
  });

  // Copies State
  const [copies, setCopies] = useState<any[]>([]);
  const [copySearch, setCopySearch] = useState("");
  const [copyStatusFilter, setCopyStatusFilter] = useState("ALL");
  const [loadingCopies, setLoadingCopies] = useState(false);
  const [showAddCopiesModal, setShowAddCopiesModal] = useState(false);
  const [addCopiesData, setAddCopiesData] = useState({
    bookId: "",
    count: 1,
    purchasePrice: 150,
    condition: "GOOD",
    source: "PURCHASE",
    shelfLocation: "",
  });

  // Circulation / Issues State
  const [issues, setIssues] = useState<any[]>([]);
  const [issueSearch, setIssueSearch] = useState("");
  const [issueStatusFilter, setIssueStatusFilter] = useState("ALL");
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueData, setIssueData] = useState({
    memberId: "",
    copyId: "",
    customLoanDays: 14,
    notes: "",
  });

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedIssueForReturn, setSelectedIssueForReturn] = useState<any>(null);
  const [returnData, setReturnData] = useState({
    condition: "GOOD",
    damageCharge: 0,
    notes: "",
  });

  // Members State
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberTypeFilter, setMemberTypeFilter] = useState("ALL");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({
    memberType: "STUDENT",
    studentId: "",
    userId: "",
    maxBooks: 2,
    notes: "",
  });

  // Categories & Authors
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Barcode Sheet Modal State
  const [showBarcodeSheetModal, setShowBarcodeSheetModal] = useState(false);
  const [barcodeLabels, setBarcodeLabels] = useState<any[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);

  // Rules State
  const [rules, setRules] = useState<any[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);

  // Helper alert
  const showAlert = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // 1. Fetch Summary & Overview
  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/admin/library/reports");
      const data = await res.json();
      if (res.ok) {
        setSummary(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  // 2. Fetch Books
  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      const query = new URLSearchParams();
      if (bookSearch) query.set("search", bookSearch);
      if (bookCategoryFilter && bookCategoryFilter !== "ALL") query.set("categoryId", bookCategoryFilter);
      const res = await fetch(`/api/admin/library/books?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setBooks(data.books || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBooks(false);
    }
  };

  // 3. Fetch Copies
  const fetchCopies = async () => {
    setLoadingCopies(true);
    try {
      const query = new URLSearchParams();
      if (copySearch) query.set("search", copySearch);
      if (copyStatusFilter && copyStatusFilter !== "ALL") query.set("status", copyStatusFilter);
      const res = await fetch(`/api/admin/library/copies?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setCopies(data.copies || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCopies(false);
    }
  };

  // 4. Fetch Issues
  const fetchIssues = async () => {
    setLoadingIssues(true);
    try {
      const query = new URLSearchParams();
      if (issueSearch) query.set("search", issueSearch);
      if (issueStatusFilter && issueStatusFilter !== "ALL") query.set("status", issueStatusFilter);
      const res = await fetch(`/api/admin/library/issues?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setIssues(data.issues || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIssues(false);
    }
  };

  // 5. Fetch Members
  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const query = new URLSearchParams();
      if (memberSearch) query.set("search", memberSearch);
      if (memberTypeFilter && memberTypeFilter !== "ALL") query.set("memberType", memberTypeFilter);
      const res = await fetch(`/api/admin/library/members?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // 6. Fetch Metadata (Categories, Authors, Publishers, Students, Teachers)
  const fetchMetadata = async () => {
    try {
      const [catRes, autRes, pubRes, stuRes, usrRes] = await Promise.all([
        fetch("/api/admin/library/categories"),
        fetch("/api/admin/library/authors"),
        fetch("/api/admin/library/publishers"),
        fetch("/api/admin/students?limit=200"),
        fetch("/api/admin/users?role=TEACHER"),
      ]);

      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.categories || []);
      }
      if (autRes.ok) {
        const d = await autRes.json();
        setAuthors(d.authors || []);
      }
      if (pubRes.ok) {
        const d = await pubRes.json();
        setPublishers(d.publishers || []);
      }
      if (stuRes.ok) {
        const d = await stuRes.json();
        setStudents(d.students || []);
      }
      if (usrRes.ok) {
        const d = await usrRes.json();
        setTeachers(d.users || []);
      }
    } catch (err) {
      console.error("Metadata fetch error:", err);
    }
  };

  // 7. Fetch Rules
  const fetchRules = async () => {
    setLoadingRules(true);
    try {
      const res = await fetch("/api/admin/library/rules");
      const data = await res.json();
      if (res.ok) {
        setRules(data.rules || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchMetadata();
    fetchRules();
  }, []);

  useEffect(() => {
    if (activeTab === "OVERVIEW") fetchSummary();
    if (activeTab === "BOOKS") fetchBooks();
    if (activeTab === "COPIES") fetchCopies();
    if (activeTab === "ISSUES") fetchIssues();
    if (activeTab === "MEMBERS") fetchMembers();
    if (activeTab === "RULES") fetchRules();
  }, [activeTab]);

  // Handle Add Book Submit
  const handleAddBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/library/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBook),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert("নতুন বই ও কপি সফলভাবে ক্যাটালগে যুক্ত হয়েছে।", "success");
        setShowAddBookModal(false);
        setNewBook({
          titleBn: "",
          titleEn: "",
          subtitle: "",
          categoryId: "",
          authorId: "",
          publisherId: "",
          edition: "",
          publicationYear: "",
          isbn: "",
          language: "BANGLA",
          subject: "",
          shelfLocation: "",
          description: "",
          initialCopiesCount: 1,
          initialPurchasePrice: 150,
        });
        fetchBooks();
        fetchSummary();
      } else {
        showAlert(data.error || "বই যোগ করতে ব্যর্থ।", "error");
      }
    } catch (err: any) {
      showAlert(err.message, "error");
    }
  };

  // Handle Add Copies Submit
  const handleAddCopiesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/library/copies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addCopiesData),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(`${data.count}টি নতুন ফিজিক্যাল কপি সফলভাবে যুক্ত হয়েছে।`, "success");
        setShowAddCopiesModal(false);
        fetchCopies();
        fetchSummary();
      } else {
        showAlert(data.error || "কপি যোগ করতে ব্যর্থ।", "error");
      }
    } catch (err: any) {
      showAlert(err.message, "error");
    }
  };

  // Handle Issue Book Submit
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/library/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issueData),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(`বই সফলভাবে ইস্যু করা হয়েছে (ইস্যু নং: ${data.issue.issueNumber})`, "success");
        setShowIssueModal(false);
        setIssueData({ memberId: "", copyId: "", customLoanDays: 14, notes: "" });
        fetchIssues();
        fetchSummary();
      } else {
        showAlert(data.error || "বই ইস্যু ব্যর্থ।", "error");
      }
    } catch (err: any) {
      showAlert(err.message, "error");
    }
  };

  // Handle Return Book Submit
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueForReturn) return;
    try {
      const res = await fetch(`/api/admin/library/issues/${selectedIssueForReturn.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(returnData),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(`বই সফলভাবে ফেরত গ্রহণ করা হয়েছে। ${data.issue.fineAmount > 0 ? `জরিমানা: ৳${data.issue.fineAmount}` : ""}`, "success");
        setShowReturnModal(false);
        setSelectedIssueForReturn(null);
        fetchIssues();
        fetchSummary();
      } else {
        showAlert(data.error || "বই ফেরত গ্রহণে ব্যর্থ।", "error");
      }
    } catch (err: any) {
      showAlert(err.message, "error");
    }
  };

  // Handle Renewal
  const handleRenew = async (issueId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই বইটির মেয়াদ নবায়ন করতে চান?")) return;
    try {
      const res = await fetch(`/api/admin/library/issues/${issueId}/renew`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(`বইটির মেয়াদ সফলভাবে নবায়ন করা হয়েছে। নতুন মেয়াদ: ${new Date(data.issue.dueDate).toLocaleDateString("bn-BD")}`, "success");
        fetchIssues();
      } else {
        showAlert(data.error || "নবায়ন ব্যর্থ।", "error");
      }
    } catch (err: any) {
      showAlert(err.message, "error");
    }
  };

  // Handle Mark Lost
  const handleMarkLost = async (copyId: string) => {
    const reason = prompt("বইটি হারানো ঘোষণার কারণ/মন্তব্য লিখুন:");
    if (reason === null) return;
    try {
      const res = await fetch(`/api/admin/library/copies/${copyId}/lost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: reason }),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(`বইটি হারানো হিসেবে চিহ্নিত হয়েছে। ক্ষতিপূরণ ফি: ৳${data.replacementCharge}`, "success");
        fetchCopies();
        fetchIssues();
        fetchSummary();
      } else {
        showAlert(data.error || "হারানো রিপোর্ট ব্যর্থ।", "error");
      }
    } catch (err: any) {
      showAlert(err.message, "error");
    }
  };

  // Handle Add Member Submit
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/library/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberForm),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(`সদস্য নিবন্ধন সফল! লাইব্রেরি কার্ড নং: ${data.member.memberNumber}`, "success");
        setShowAddMemberModal(false);
        setMemberForm({ memberType: "STUDENT", studentId: "", userId: "", maxBooks: 2, notes: "" });
        fetchMembers();
        fetchSummary();
      } else {
        showAlert(data.error || "সদস্য নিবন্ধন ব্যর্থ।", "error");
      }
    } catch (err: any) {
      showAlert(err.message, "error");
    }
  };

  // Open Barcode Sheet Modal
  const handlePrintBarcodeSheet = async (copyIds?: string[]) => {
    setLoadingLabels(true);
    setShowBarcodeSheetModal(true);
    try {
      const res = await fetch("/api/admin/library/barcode-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copyIds: copyIds || copies.slice(0, 24).map((c) => c.id) }),
      });
      const data = await res.json();
      if (res.ok) {
        setBarcodeLabels(data.labels || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLabels(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-md transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-medium text-sm">{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D5C3A] to-[#127A4D] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold tracking-wider uppercase mb-1">
            <BookOpen className="w-4 h-4" /> EHRJ Digital Campus • Phase 9
          </div>
          <h1 className="text-2xl font-bold">লাইব্রেরি ও ই-লাইব্রেরি ম্যানেজমেন্ট ইঞ্জিন</h1>
          <p className="text-emerald-100 text-xs mt-1">
            বই ক্যাটালগ, স্বয়ংক্রিয় একসেশন নম্বর, বারকোড/কিউআর লেবেল, সঞ্চালন ও ফি হিসাবের সমন্বিত ব্যবস্থা
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handlePrintBarcodeSheet()}
            className="flex items-center gap-2 bg-emerald-800/60 hover:bg-emerald-800 text-white text-xs px-3.5 py-2.5 rounded-lg border border-emerald-600/40 transition"
          >
            <Printer className="w-4 h-4" /> বারকোড শিট প্রিন্ট
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold text-xs px-3.5 py-2.5 rounded-lg shadow-sm transition"
          >
            <Repeat className="w-4 h-4" /> দ্রুত বই ইস্যু
          </button>
          <button
            onClick={() => setShowAddBookModal(true)}
            className="flex items-center gap-2 bg-white text-[#0D5C3A] font-semibold text-xs px-3.5 py-2.5 rounded-lg shadow-sm hover:bg-emerald-50 transition"
          >
            <PlusCircle className="w-4 h-4" /> নতুন বই ক্যাটালগ
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto text-sm font-medium">
        {[
          { id: "OVERVIEW", label: "ড্যাশবোর্ড ওভারভিউ", icon: Layers },
          { id: "BOOKS", label: "বই ক্যাটালগ", icon: BookOpen },
          { id: "COPIES", label: "কপি ও বারকোড", icon: QrCode },
          { id: "ISSUES", label: "সঞ্চালন (ইস্যু ও ফেরত)", icon: Repeat },
          { id: "MEMBERS", label: "লাইব্রেরি সদস্য", icon: Users },
          { id: "RULES", label: "নীতিমালা ও সেটিংস", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition ${
                isActive
                  ? "bg-[#0D5C3A] text-white shadow-sm font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">মোট শিরোনাম</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.summary?.totalTitles || 0}</p>
              <span className="text-[11px] text-emerald-600">ক্যাটালগভুক্ত বই</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">মোট ফিজিক্যাল কপি</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.summary?.totalCopies || 0}</p>
              <span className="text-[11px] text-blue-600">একসেশন সম্পন্ন</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">উপলব্ধ কপি</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{summary?.summary?.availableCopies || 0}</p>
              <span className="text-[11px] text-gray-500">ধার দেওয়ার জন্য প্রস্তুত</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">বর্তমানে ইস্যুকৃত</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{summary?.summary?.issuedCopies || 0}</p>
              <span className="text-[11px] text-amber-700">সদস্যদের নিকট রক্ষিত</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">মেয়াদোত্তীর্ণ (Overdue)</span>
              <p className="text-2xl font-bold text-red-600 mt-1">{summary?.summary?.overdueCopies || 0}</p>
              <span className="text-[11px] text-red-700">জরিমানা প্রযোজ্য</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">মোট জরিমানার পরিমাণ</span>
              <p className="text-2xl font-bold text-purple-700 mt-1">৳{summary?.summary?.totalFinesAssessed || 0}</p>
              <span className="text-[11px] text-gray-500">ধার্যকৃত জরিমানা</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Circulation Activities */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-emerald-600" /> সাম্প্রতিক সঞ্চালন কার্যক্রম (Recent Circulation)
                </h3>
                <button
                  onClick={() => setActiveTab("ISSUES")}
                  className="text-xs font-semibold text-[#0D5C3A] hover:underline"
                >
                  সব দেখুন &rarr;
                </button>
              </div>

              {summary?.recentIssues && summary.recentIssues.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="py-2.5 px-3">ইস্যু নং</th>
                        <th className="py-2.5 px-3">বই ও কপি</th>
                        <th className="py-2.5 px-3">সদস্য</th>
                        <th className="py-2.5 px-3">ফেরত তারিখ</th>
                        <th className="py-2.5 px-3">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {summary.recentIssues.map((iss: any) => (
                        <tr key={iss.id} className="hover:bg-gray-50/80">
                          <td className="py-2.5 px-3 font-mono font-medium">{iss.issueNumber}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold block">{iss.book.titleBn}</span>
                            <span className="text-[11px] text-gray-500 font-mono">{iss.copy.accessionNo}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="block font-medium">
                              {iss.member.student?.fullNameBn || iss.member.user?.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">{iss.member.memberNumber}</span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {new Date(iss.dueDate).toLocaleDateString("bn-BD")}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                iss.status === "ISSUED"
                                  ? "bg-amber-100 text-amber-800"
                                  : iss.status === "RETURNED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {iss.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-xs">কোনো সাম্প্রতিক সঞ্চালন তথ্য পাওয়া যায়নি।</div>
              )}
            </div>

            {/* Overdue Alerts & Top Books */}
            <div className="space-y-6">
              {/* Overdue Alerts Box */}
              <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-red-800 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> বিলম্বিত বই (Overdue Alerts)
                </h3>
                {summary?.overdueIssues && summary.overdueIssues.length > 0 ? (
                  <div className="space-y-2.5">
                    {summary.overdueIssues.slice(0, 4).map((ov: any) => (
                      <div key={ov.id} className="p-2.5 bg-red-50/60 rounded-lg border border-red-100 text-xs">
                        <div className="flex justify-between items-start font-semibold text-gray-900">
                          <span>{ov.book.titleBn}</span>
                          <span className="text-red-700 font-mono text-[11px] font-bold">
                            {ov.copy.accessionNo}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-gray-500 mt-1">
                          <span>সদস্য: {ov.member.student?.fullNameBn || ov.member.user?.name}</span>
                          <span className="text-red-600 font-semibold">
                            মেয়াদ শেষ: {new Date(ov.dueDate).toLocaleDateString("bn-BD")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> বর্তমানে কোনো বইয়ের মেয়াদ উত্তীর্ণ নেই।
                  </p>
                )}
              </div>

              {/* Top Borrowed Books */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                  <Bookmark className="w-4 h-4 text-emerald-600" /> সর্বাধিক পঠিত বই (Most Borrowed)
                </h3>
                <div className="space-y-2 text-xs">
                  {summary?.topBorrowedBooks && summary.topBorrowedBooks.length > 0 ? (
                    summary.topBorrowedBooks.slice(0, 5).map((tb: any, idx: number) => (
                      <div key={tb.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-semibold text-gray-900 block">{tb.titleBn}</span>
                            <span className="text-[11px] text-gray-500">{tb.author.nameBn}</span>
                          </div>
                        </div>
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {tb._count.issues} বার
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 py-3 text-center">তথ্য সংরক্ষিত নেই।</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOOKS */}
      {activeTab === "BOOKS" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="বইয়ের নাম, লেখক বা ISBN খুঁজুন..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchBooks()}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={bookCategoryFilter}
                onChange={(e) => setBookCategoryFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700"
              >
                <option value="ALL">সকল ক্যাটাগরি</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBn}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchBooks}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Filter className="w-3.5 h-3.5" /> ফিল্টার
              </button>
            </div>

            <button
              onClick={() => setShowAddBookModal(true)}
              className="w-full sm:w-auto bg-[#0D5C3A] hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" /> নতুন বই ক্যাটালগ
            </button>
          </div>

          {/* Book Cards Grid */}
          {loadingBooks ? (
            <div className="py-16 text-center text-gray-400 text-xs">বইয়ের তালিকা লোড হচ্ছে...</div>
          ) : books.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((b) => (
                <div key={b.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {b.category?.nameBn || "সাধারণ"}
                      </span>
                      <span className="text-[11px] font-mono text-gray-400">
                        {b.isbn || "ISBN বিহীন"}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-sm mt-2">{b.titleBn}</h4>
                    <p className="text-gray-500 text-xs">{b.titleEn}</p>
                    <p className="text-emerald-700 text-xs font-medium mt-1">লেখক: {b.author?.nameBn}</p>
                    {b.shelfLocation && (
                      <p className="text-gray-400 text-[11px] mt-0.5">তাক নং: {b.shelfLocation}</p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between text-xs">
                    <div className="space-x-2">
                      <span className="font-semibold text-gray-700">মোট: {b.stats?.totalCopies || 0}</span>
                      <span className="text-emerald-600 font-bold">উপলব্ধ: {b.stats?.availableCopies || 0}</span>
                    </div>
                    <button
                      onClick={() => {
                        setAddCopiesData({ ...addCopiesData, bookId: b.id });
                        setShowAddCopiesModal(true);
                      }}
                      className="text-[#0D5C3A] font-semibold text-[11px] hover:underline"
                    >
                      + কপি যোগ করুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-gray-400 text-xs bg-white rounded-xl border border-gray-200">
              কোনো বই পাওয়া যায়নি। নতুন বই যোগ করুন।
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COPIES & ACCESSIONS */}
      {activeTab === "COPIES" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="একসেশন নং বা বারকোড খুঁজুন..."
                  value={copySearch}
                  onChange={(e) => setCopySearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchCopies()}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={copyStatusFilter}
                onChange={(e) => setCopyStatusFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700"
              >
                <option value="ALL">সকল স্ট্যাটাস</option>
                <option value="AVAILABLE">AVAILABLE (উপলব্ধ)</option>
                <option value="ISSUED">ISSUED (ইস্যুকৃত)</option>
                <option value="LOST">LOST (হারানো)</option>
                <option value="DAMAGED">DAMAGED (ক্ষতিগ্রস্ত)</option>
              </select>

              <button
                onClick={fetchCopies}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Filter className="w-3.5 h-3.5" /> ফিল্টার
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePrintBarcodeSheet(copies.map((c) => c.id))}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" /> প্রিন্ট লেবেল
              </button>
            </div>
          </div>

          {/* Copies Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">একসেশন নম্বর</th>
                    <th className="py-3 px-4">বারকোড</th>
                    <th className="py-3 px-4">বইয়ের নাম</th>
                    <th className="py-3 px-4">অবস্থা (Condition)</th>
                    <th className="py-3 px-4">স্ট্যাটাস</th>
                    <th className="py-3 px-4">তাক / অবস্থান</th>
                    <th className="py-3 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {copies.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{c.accessionNo}</td>
                      <td className="py-3 px-4 font-mono text-gray-500">{c.barcode}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold block text-gray-900">{c.book.titleBn}</span>
                        <span className="text-[11px] text-gray-400">{c.book.author.nameBn}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                          {c.condition}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "AVAILABLE"
                              ? "bg-emerald-100 text-emerald-800"
                              : c.status === "ISSUED"
                              ? "bg-amber-100 text-amber-800"
                              : c.status === "LOST"
                              ? "bg-red-100 text-red-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{c.shelfLocation || "N/A"}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {c.status !== "LOST" && (
                          <button
                            onClick={() => handleMarkLost(c.id)}
                            className="text-red-600 hover:text-red-800 text-[11px] font-semibold"
                          >
                            হারানো রিপোর্ট
                          </button>
                        )}
                        <a
                          href={`/library/verify/copy/${c.qrToken}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0D5C3A] hover:underline text-[11px] font-semibold"
                        >
                          কিউআর যাচাই
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CIRCULATION (ISSUES & RETURNS) */}
      {activeTab === "ISSUES" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="ইস্যু নং, সদস্য আইডি বা বই খুঁজুন..."
                  value={issueSearch}
                  onChange={(e) => setIssueSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchIssues()}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={issueStatusFilter}
                onChange={(e) => setIssueStatusFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700"
              >
                <option value="ALL">সকল স্ট্যাটাস</option>
                <option value="ISSUED">ISSUED (ধার দেওয়া)</option>
                <option value="OVERDUE">OVERDUE (বিলম্বিত)</option>
                <option value="RETURNED">RETURNED (ফেরত)</option>
                <option value="LOST">LOST (হারানো)</option>
              </select>

              <button
                onClick={fetchIssues}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Filter className="w-3.5 h-3.5" /> ফিল্টার
              </button>
            </div>

            <button
              onClick={() => setShowIssueModal(true)}
              className="w-full sm:w-auto bg-[#0D5C3A] hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Repeat className="w-4 h-4" /> নতুন বই ইস্যু
            </button>
          </div>

          {/* Issues Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">ইস্যু নম্বর</th>
                    <th className="py-3 px-4">বই ও একসেশন</th>
                    <th className="py-3 px-4">সদস্যের বিবরণ</th>
                    <th className="py-3 px-4">ইস্যুর তারিখ</th>
                    <th className="py-3 px-4">নির্ধারিত ফেরত</th>
                    <th className="py-3 px-4">নবায়ন</th>
                    <th className="py-3 px-4">স্ট্যাটাস</th>
                    <th className="py-3 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {issues.map((iss) => (
                    <tr key={iss.id} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{iss.issueNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold block text-gray-900">{iss.book.titleBn}</span>
                        <span className="font-mono text-[11px] text-gray-400">{iss.copy.accessionNo}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium block text-gray-900">
                          {iss.member.student?.fullNameBn || iss.member.user?.name}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-mono">
                          {iss.member.memberNumber} ({iss.member.memberType})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(iss.issueDate).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <span
                          className={
                            new Date(iss.dueDate) < new Date() && iss.status !== "RETURNED"
                              ? "text-red-600 font-bold"
                              : "text-gray-700"
                          }
                        >
                          {new Date(iss.dueDate).toLocaleDateString("bn-BD")}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">{iss.renewCount} বার</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            iss.status === "RETURNED"
                              ? "bg-emerald-100 text-emerald-800"
                              : iss.status === "OVERDUE"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {iss.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {iss.status !== "RETURNED" && iss.status !== "LOST" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedIssueForReturn(iss);
                                setShowReturnModal(true);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] px-2.5 py-1 rounded text-[11px] font-bold transition"
                            >
                              ফেরত গ্রহণ
                            </button>
                            <button
                              onClick={() => handleRenew(iss.id)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded text-[11px] font-semibold transition"
                            >
                              নবায়ন
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MEMBERS */}
      {activeTab === "MEMBERS" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="সদস্য নম্বর বা নাম খুঁজুন..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchMembers()}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={memberTypeFilter}
                onChange={(e) => setMemberTypeFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700"
              >
                <option value="ALL">সকল ধরন</option>
                <option value="STUDENT">STUDENT (শিক্ষার্থী)</option>
                <option value="TEACHER">TEACHER (শিক্ষক)</option>
              </select>

              <button
                onClick={fetchMembers}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Filter className="w-3.5 h-3.5" /> ফিল্টার
              </button>
            </div>

            <button
              onClick={() => setShowAddMemberModal(true)}
              className="w-full sm:w-auto bg-[#0D5C3A] hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" /> নতুন সদস্য নিবন্ধন
            </button>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">সদস্য নম্বর (Card No)</th>
                    <th className="py-3 px-4">নাম ও পরিচয়</th>
                    <th className="py-3 px-4">ধরন (Type)</th>
                    <th className="py-3 px-4">বর্তমানে ধার রয়েছে</th>
                    <th className="py-3 px-4">সর্বোচ্চ সীমা</th>
                    <th className="py-3 px-4">স্ট্যাটাস</th>
                    <th className="py-3 px-4">নিবন্ধনের তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{m.memberNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold block text-gray-900">
                          {m.student?.fullNameBn || m.user?.name}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {m.student ? `আইডি: ${m.student.studentIdNumber}` : m.user?.email}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-800">
                          {m.memberType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700">
                        {m.stats?.activeLoansCount || 0}টি
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono">{m.maxBooks || "ডিফল্ট"}টি</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(m.createdAt).toLocaleDateString("bn-BD")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: RULES */}
      {activeTab === "RULES" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-4xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" /> লাইব্রেরি সঞ্চালন ও জরিমানা নীতিমালা (Circulation Rules)
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                শিক্ষার্থী ও শিক্ষকদের জন্য বই ধারের মেয়াদ, সীমা, দৈনিক জরিমানা ও প্রতিস্থাপন চার্জ নীতি নির্ধারণ করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rules.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded-xl p-5 bg-gray-50/50 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-sm text-gray-900">
                      {r.memberType === "STUDENT" ? "শিক্ষার্থী নীতি (Student Rule)" : "শিক্ষক নীতি (Teacher Rule)"}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      সক্রিয়
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600">সর্বোচ্চ বই ধার:</span>
                      <span className="font-bold text-gray-900 font-mono">{r.maxBooks}টি</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600">ধারের মেয়াদ (দিন):</span>
                      <span className="font-bold text-gray-900 font-mono">{r.loanDays} দিন</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600">সর্বোচ্চ নবায়ন সংখ্যা:</span>
                      <span className="font-bold text-gray-900 font-mono">{r.renewalLimit} বার</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600">দৈনিক বিলম্ব জরিমানা:</span>
                      <span className="font-bold text-red-600 font-mono">৳{r.finePerDay} / দিন</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600">গ্রেস পিরিয়ড (বিলম্ব ছাড়):</span>
                      <span className="font-bold text-gray-900 font-mono">{r.graceDays} দিন</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-600">হারানো বই ক্ষতিপূরণ গুণক:</span>
                      <span className="font-bold text-purple-700 font-mono">{r.lostChargeMultiplier}x (ক্রয়মূল্যের)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD BOOK */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">ক্যাটালগে নতুন বই যুক্ত করুন</h3>
              <button onClick={() => setShowAddBookModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBookSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">বাংলা নাম *</label>
                  <input
                    type="text"
                    required
                    value={newBook.titleBn}
                    onChange={(e) => setNewBook({ ...newBook, titleBn: e.target.value })}
                    placeholder="যেমন: সহীহ বুখারী"
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">ইংরেজি নাম *</label>
                  <input
                    type="text"
                    required
                    value={newBook.titleEn}
                    onChange={(e) => setNewBook({ ...newBook, titleEn: e.target.value })}
                    placeholder="e.g. Sahih al-Bukhari"
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">ক্যাটাগরি *</label>
                  <select
                    required
                    value={newBook.categoryId}
                    onChange={(e) => setNewBook({ ...newBook, categoryId: e.target.value })}
                    className="w-full border rounded-lg p-2 bg-white"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">লেখক *</label>
                  <select
                    required
                    value={newBook.authorId}
                    onChange={(e) => setNewBook({ ...newBook, authorId: e.target.value })}
                    className="w-full border rounded-lg p-2 bg-white"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">সংস্করণ</label>
                  <input
                    type="text"
                    value={newBook.edition}
                    onChange={(e) => setNewBook({ ...newBook, edition: e.target.value })}
                    placeholder="যেমন: ৩য় সংস্করণ"
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">ISBN</label>
                  <input
                    type="text"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                    placeholder="ঐচ্ছিক"
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">তাক / অবস্থান</label>
                  <input
                    type="text"
                    value={newBook.shelfLocation}
                    onChange={(e) => setNewBook({ ...newBook, shelfLocation: e.target.value })}
                    placeholder="যেমন: তাক-A2"
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Initial Copies Generation */}
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-900 block text-xs">
                  প্রাথমিক কপি তৈরি (Initial Copies Auto-Generation)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">কপির সংখ্যা</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={newBook.initialCopiesCount}
                      onChange={(e) => setNewBook({ ...newBook, initialCopiesCount: parseInt(e.target.value) || 1 })}
                      className="w-full border rounded-lg p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">কপি প্রতি মূল্য (টাকা)</label>
                    <input
                      type="number"
                      value={newBook.initialPurchasePrice}
                      onChange={(e) => setNewBook({ ...newBook, initialPurchasePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full border rounded-lg p-2 bg-white"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700">
                  সিস্টেম স্বয়ংক্রিয়ভাবে <code className="font-mono font-bold">EHRJ-LIB-YYYY-XXXXXX</code> ক্রমিকে কপি ও কিউআর জেনারেট করবে।
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-gray-600 hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D5C3A] text-white rounded-lg font-bold hover:bg-emerald-800 transition"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD COPIES */}
      {showAddCopiesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">বইয়ের নতুন কপি যোগ করুন</h3>
              <button onClick={() => setShowAddCopiesModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCopiesSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">বই নির্বাচন *</label>
                <select
                  required
                  value={addCopiesData.bookId}
                  onChange={(e) => setAddCopiesData({ ...addCopiesData, bookId: e.target.value })}
                  className="w-full border rounded-lg p-2 bg-white"
                >
                  <option value="">বই নির্বাচন করুন</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.titleBn} ({b.author?.nameBn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">কপির সংখ্যা *</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={addCopiesData.count}
                    onChange={(e) => setAddCopiesData({ ...addCopiesData, count: parseInt(e.target.value) || 1 })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">ক্রয়মূল্য (টাকা)</label>
                  <input
                    type="number"
                    value={addCopiesData.purchasePrice}
                    onChange={(e) => setAddCopiesData({ ...addCopiesData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">তাক / অবস্থান</label>
                <input
                  type="text"
                  value={addCopiesData.shelfLocation}
                  onChange={(e) => setAddCopiesData({ ...addCopiesData, shelfLocation: e.target.value })}
                  placeholder="যেমন: তাক-B1"
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCopiesModal(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-gray-600 hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D5C3A] text-white rounded-lg font-bold hover:bg-emerald-800 transition"
                >
                  কপি জেনারেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ISSUE BOOK */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Repeat className="w-5 h-5 text-emerald-600" /> সদস্যকে বই ইস্যু করুন
              </h3>
              <button onClick={() => setShowIssueModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">লাইব্রেরি সদস্য নির্বাচন *</label>
                <select
                  required
                  value={issueData.memberId}
                  onChange={(e) => setIssueData({ ...issueData, memberId: e.target.value })}
                  className="w-full border rounded-lg p-2 bg-white"
                >
                  <option value="">সদস্য নির্বাচন করুন</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberNumber} - {m.student?.fullNameBn || m.user?.name} ({m.memberType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">উপলব্ধ কপি নির্বাচন *</label>
                <select
                  required
                  value={issueData.copyId}
                  onChange={(e) => setIssueData({ ...issueData, copyId: e.target.value })}
                  className="w-full border rounded-lg p-2 bg-white"
                >
                  <option value="">উপলব্ধ বই ও একসেশন নং নির্বাচন করুন</option>
                  {copies
                    .filter((c) => c.status === "AVAILABLE")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.accessionNo} - {c.book.titleBn} ({c.condition})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">ধারের মেয়াদ (দিন)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={issueData.customLoanDays}
                  onChange={(e) => setIssueData({ ...issueData, customLoanDays: parseInt(e.target.value) || 14 })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">মন্তব্য (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={issueData.notes}
                  onChange={(e) => setIssueData({ ...issueData, notes: e.target.value })}
                  placeholder="কোনো বিশেষ নির্দেশনা থাকলে..."
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-gray-600 hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D5C3A] text-white rounded-lg font-bold hover:bg-emerald-800 transition"
                >
                  ইস্যু নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RETURN BOOK */}
      {showReturnModal && selectedIssueForReturn && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">বই ফেরত গ্রহণ নিশ্চিতকরণ</h3>
              <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border text-xs space-y-1">
              <p>
                <span className="font-semibold">বই:</span> {selectedIssueForReturn.book.titleBn}
              </p>
              <p>
                <span className="font-semibold">একসেশন:</span> {selectedIssueForReturn.copy.accessionNo}
              </p>
              <p>
                <span className="font-semibold">সদস্য:</span>{" "}
                {selectedIssueForReturn.member.student?.fullNameBn || selectedIssueForReturn.member.user?.name}
              </p>
              <p>
                <span className="font-semibold">নির্ধারিত ফেরত:</span>{" "}
                {new Date(selectedIssueForReturn.dueDate).toLocaleDateString("bn-BD")}
              </p>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">ফেরতের সময় বইয়ের অবস্থা</label>
                <select
                  value={returnData.condition}
                  onChange={(e) => setReturnData({ ...returnData, condition: e.target.value })}
                  className="w-full border rounded-lg p-2 bg-white"
                >
                  <option value="GOOD">GOOD (ভালো)</option>
                  <option value="FAIR">FAIR (গ্রহণযোগ্য)</option>
                  <option value="DAMAGED">DAMAGED (ক্ষতিগ্রস্ত)</option>
                  <option value="REPAIR_REQUIRED">REPAIR_REQUIRED (মেরামত প্রয়োজন)</option>
                </select>
              </div>

              {returnData.condition === "DAMAGED" && (
                <div>
                  <label className="block text-red-700 font-semibold mb-1">ক্ষতিপূরণ চার্জ (টাকা)</label>
                  <input
                    type="number"
                    min={0}
                    value={returnData.damageCharge}
                    onChange={(e) => setReturnData({ ...returnData, damageCharge: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg p-2 bg-red-50/50"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    শিক্ষার্থী হলে স্বয়ংক্রিয়ভাবে Phase 6 ফি ইনভয়েস তৈরি হবে।
                  </p>
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-semibold mb-1">মন্তব্য (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={returnData.notes}
                  onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                  placeholder="ফেরত সংক্রান্ত কোনো মন্তব্য..."
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-gray-600 hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800 transition"
                >
                  ফেরত গ্রহণ সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD MEMBER */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">নতুন লাইব্রেরি সদস্য নিবন্ধন</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">সদস্যের ধরন *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="memberType"
                      checked={memberForm.memberType === "STUDENT"}
                      onChange={() => setMemberForm({ ...memberForm, memberType: "STUDENT", userId: "" })}
                    />
                    <span>শিক্ষার্থী (Student)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="memberType"
                      checked={memberForm.memberType === "TEACHER"}
                      onChange={() => setMemberForm({ ...memberForm, memberType: "TEACHER", studentId: "" })}
                    />
                    <span>শিক্ষক (Teacher)</span>
                  </label>
                </div>
              </div>

              {memberForm.memberType === "STUDENT" ? (
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">শিক্ষার্থী নির্বাচন *</label>
                  <select
                    required
                    value={memberForm.studentId}
                    onChange={(e) => setMemberForm({ ...memberForm, studentId: e.target.value })}
                    className="w-full border rounded-lg p-2 bg-white"
                  >
                    <option value="">শিক্ষার্থী নির্বাচন করুন</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.studentIdNumber} - {s.fullNameBn}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">শিক্ষক ব্যবহারকারী নির্বাচন *</label>
                  <select
                    required
                    value={memberForm.userId}
                    onChange={(e) => setMemberForm({ ...memberForm, userId: e.target.value })}
                    className="w-full border rounded-lg p-2 bg-white"
                  >
                    <option value="">শিক্ষক নির্বাচন করুন</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-semibold mb-1">সর্বোচ্চ বই ধারের সীমা</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={memberForm.maxBooks}
                  onChange={(e) => setMemberForm({ ...memberForm, maxBooks: parseInt(e.target.value) || 2 })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">মন্তব্য (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={memberForm.notes}
                  onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-gray-600 hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0D5C3A] text-white rounded-lg font-bold hover:bg-emerald-800 transition"
                >
                  নিবন্ধন সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: BARCODE & QR SHEET MODAL */}
      {showBarcodeSheetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 my-6">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">মুদ্রণযোগ্য বারকোড ও কিউআর লেবেল শিট</h3>
                <p className="text-xs text-gray-500">বইয়ের কভার ও মেরুদণ্ডে লাগানোর জন্য প্রস্তুত লেবেল</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-[#0D5C3A] hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> প্রিন্ট করুন
                </button>
                <button onClick={() => setShowBarcodeSheetModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingLabels ? (
              <div className="py-12 text-center text-gray-400 text-xs">লেবেল জেনারেট হচ্ছে...</div>
            ) : barcodeLabels.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto p-2">
                {barcodeLabels.map((lbl) => (
                  <div
                    key={lbl.id}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-3 bg-white space-y-2 text-center shadow-xs"
                  >
                    <div className="text-[10px] font-bold text-[#0D5C3A] tracking-wider uppercase border-b pb-1">
                      {lbl.institutionNameBn}
                    </div>
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-xs text-gray-900 leading-tight">{lbl.bookTitleBn}</h5>
                      <p className="text-[10px] text-gray-500">{lbl.authorNameBn}</p>
                    </div>

                    <div className="bg-gray-50 p-1.5 rounded border border-gray-200">
                      <div className="font-mono font-bold text-xs tracking-wider text-gray-900">
                        {lbl.accessionNo}
                      </div>
                      <div className="font-mono text-[9px] text-gray-400 tracking-widest">{lbl.barcode}</div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1 border-t">
                      <span>তাক: {lbl.shelfLocation}</span>
                      <span className="font-semibold text-emerald-700">QR ভেরিফায়েড</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs">কোনো লেবেল ডেটা পাওয়া যায়নি।</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
