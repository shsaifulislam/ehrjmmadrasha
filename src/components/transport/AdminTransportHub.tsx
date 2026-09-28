"use client";

import React, { useState, useEffect } from "react";
import {
  Bus,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Calendar,
  FileText,
  DollarSign,
  Car,
  UserCheck,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Edit2,
  Trash2,
  Check,
  X,
  CreditCard,
  Phone,
  Info
} from "lucide-react";

export default function AdminTransportHub() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "routes" | "vehicles" | "drivers" | "students" | "requests" | "reports"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Routes State
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [routeForm, setRouteForm] = useState({
    routeName: "",
    routeCode: "",
    description: "",
    direction: "BOTH",
    startPoint: "",
    endPoint: "",
    vehicleId: "",
    monthlyFee: "1500",
    notes: "",
  });
  const [stopForm, setStopForm] = useState({
    stopName: "",
    address: "",
    sequenceOrder: "1",
    pickupTime: "07:30 AM",
    dropTime: "02:00 PM",
    notes: "",
  });

  // Vehicles State
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: "",
    vehicleType: "BUS",
    model: "",
    capacity: "30",
    driverId: "",
    status: "ACTIVE",
    notes: "",
  });

  // Drivers State
  const [drivers, setDrivers] = useState<any[]>([]);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [driverForm, setDriverForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    licenseNumber: "",
    licenseExpiry: "",
    emergencyContact: "",
    notes: "",
  });

  // Student Enrollments State
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [enrollmentRouteFilter, setEnrollmentRouteFilter] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    studentId: "",
    sessionId: "",
    routeId: "",
    pickupStopId: "",
    dropStopId: "",
    monthlyFee: "",
    startDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [sessions, setSessions] = useState<any[]>([]);
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<any | null>(null);

  // Route Change Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedEnrollmentForTransfer, setSelectedEnrollmentForTransfer] = useState<any | null>(null);
  const [transferForm, setTransferForm] = useState({
    newRouteId: "",
    newPickupStopId: "",
    newDropStopId: "",
    newMonthlyFee: "",
    reason: "",
  });

  // Requests State
  const [requests, setRequests] = useState<any[]>([]);
  const [requestFilter, setRequestFilter] = useState("");
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<any | null>(null);
  const [reviewForm, setReviewForm] = useState({
    status: "APPROVED",
    rejectionReason: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    monthlyFee: "",
  });

  // Billing / Invoicing State
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7));
  const [billingLoading, setBillingLoading] = useState(false);

  // Load initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, routesRes, vehiclesRes, driversRes, enrollRes, requestsRes] = await Promise.all([
        fetch("/api/admin/transport/stats").then((r) => r.json()),
        fetch("/api/admin/transport/routes").then((r) => r.json()),
        fetch("/api/admin/transport/vehicles").then((r) => r.json()),
        fetch("/api/admin/transport/drivers").then((r) => r.json()),
        fetch("/api/admin/transport/enrollments").then((r) => r.json()),
        fetch("/api/admin/transport/requests").then((r) => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (routesRes.success) setRoutes(routesRes.routes);
      if (vehiclesRes.success) setVehicles(vehiclesRes.vehicles);
      if (driversRes.success) setDrivers(driversRes.drivers);
      if (enrollRes.success) setEnrollments(enrollRes.enrollments);
      if (requestsRes.success) setRequests(requestsRes.requests);

      // Fetch sessions
      const sessRes = await fetch("/api/academic-sessions").then((r) => r.json()).catch(() => null);
      if (sessRes && sessRes.sessions) {
        setSessions(sessRes.sessions);
        const curr = sessRes.sessions.find((s: any) => s.isCurrent);
        if (curr) {
          setEnrollForm((prev) => ({ ...prev, sessionId: curr.id }));
        }
      }
    } catch (err: any) {
      console.error("Transport data fetch error:", err);
      setActionMsg({ text: "তথ্য লোড করতে সমস্যা হয়েছে।", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search students for enrollment
  const handleStudentSearch = async (val: string) => {
    setStudentQuery(val);
    if (val.trim().length < 2) {
      setStudentSearchResults([]);
      return;
    }
    setSearchingStudent(true);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(val)}&limit=6`);
      const data = await res.json();
      if (data.students) {
        setStudentSearchResults(data.students);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingStudent(false);
    }
  };

  // Add Route Handler
  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/transport/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routeForm),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({ text: "নতুন রুট সফলভাবে তৈরি করা হয়েছে।", type: "success" });
        setShowAddRouteModal(false);
        setRouteForm({
          routeName: "",
          routeCode: "",
          description: "",
          direction: "BOTH",
          startPoint: "",
          endPoint: "",
          vehicleId: "",
          monthlyFee: "1500",
          notes: "",
        });
        fetchData();
      } else {
        setActionMsg({ text: data.error || "রুট তৈরিতে ত্রুটি।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    }
  };

  // Add Stop Handler
  const handleCreateStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;
    try {
      const res = await fetch("/api/admin/transport/stops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeId: selectedRoute.id,
          ...stopForm,
          sequenceOrder: Number(stopForm.sequenceOrder),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({ text: "স্টপ সফলভাবে রুটে যুক্ত করা হয়েছে।", type: "success" });
        setShowAddStopModal(false);
        setStopForm({
          stopName: "",
          address: "",
          sequenceOrder: (selectedRoute.stops.length + 1).toString(),
          pickupTime: "07:30 AM",
          dropTime: "02:00 PM",
          notes: "",
        });
        // refresh route
        const updated = await fetch(`/api/admin/transport/routes/${selectedRoute.id}`).then((r) => r.json());
        if (updated.success) setSelectedRoute(updated.route);
        fetchData();
      } else {
        setActionMsg({ text: data.error || "স্টপ যুক্ত করা সম্ভব হয়নি।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    }
  };

  // Add Vehicle Handler
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/transport/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleForm),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({ text: "যানবাহন সফলভাবে যোগ করা হয়েছে।", type: "success" });
        setShowAddVehicleModal(false);
        setVehicleForm({
          vehicleNumber: "",
          vehicleType: "BUS",
          model: "",
          capacity: "30",
          driverId: "",
          status: "ACTIVE",
          notes: "",
        });
        fetchData();
      } else {
        setActionMsg({ text: data.error || "যানবাহন যোগ করা যায়নি।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    }
  };

  // Add Driver Handler
  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/transport/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driverForm),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({ text: "চালক সফলভাবে নিবন্ধিত হয়েছে।", type: "success" });
        setShowAddDriverModal(false);
        setDriverForm({
          fullName: "",
          phone: "",
          address: "",
          licenseNumber: "",
          licenseExpiry: "",
          emergencyContact: "",
          notes: "",
        });
        fetchData();
      } else {
        setActionMsg({ text: data.error || "চালক নিবন্ধন করা যায়নি।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    }
  };

  // Student Enrollment Handler
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForEnroll) {
      setActionMsg({ text: "অনুগ্রহ করে শিক্ষার্থী নির্বাচন করুন।", type: "error" });
      return;
    }
    try {
      const res = await fetch("/api/admin/transport/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentForEnroll.id,
          sessionId: enrollForm.sessionId,
          routeId: enrollForm.routeId,
          pickupStopId: enrollForm.pickupStopId,
          dropStopId: enrollForm.dropStopId || enrollForm.pickupStopId,
          monthlyFee: enrollForm.monthlyFee ? Number(enrollForm.monthlyFee) : undefined,
          startDate: enrollForm.startDate,
          notes: enrollForm.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({ text: "শিক্ষার্থীকে পরিবহন সেবায় সফলভাবে যুক্ত করা হয়েছে।", type: "success" });
        setShowEnrollModal(false);
        setSelectedStudentForEnroll(null);
        setStudentQuery("");
        fetchData();
      } else {
        setActionMsg({ text: data.error || "পরিবহন বরাদ্দ ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    }
  };

  // Route Transfer Handler
  const handleTransferRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollmentForTransfer) return;
    try {
      const res = await fetch(`/api/admin/transport/enrollments/${selectedEnrollmentForTransfer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferForm),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({ text: "শিক্ষার্থীর পরিবহন রুট সফলভাবে পরিবর্তন করা হয়েছে।", type: "success" });
        setShowTransferModal(false);
        setSelectedEnrollmentForTransfer(null);
        fetchData();
      } else {
        setActionMsg({ text: data.error || "রুট পরিবর্তন ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    }
  };

  // Cancel Enrollment Handler
  const handleCancelEnrollment = async (enrollmentId: string) => {
    const reason = prompt("পরিবহন সেবা বাতিলের কারণ লিখুন:") || "অ্যাডমিন কর্তৃক বাতিল";
    try {
      const res = await fetch(`/api/admin/transport/enrollments/${enrollmentId}?reason=${encodeURIComponent(reason)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({ text: "পরিবহন সেবা সফলভাবে বাতিল করা হয়েছে।", type: "success" });
        fetchData();
      } else {
        setActionMsg({ text: data.error || "বাতিল করা সম্ভব হয়নি।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    }
  };

  // Review Request Handler
  const handleReviewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForReview) return;
    try {
      const res = await fetch(`/api/admin/transport/requests/${selectedRequestForReview.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewForm.status,
          rejectionReason: reviewForm.rejectionReason,
          effectiveDate: reviewForm.effectiveDate,
          monthlyFee: reviewForm.monthlyFee ? Number(reviewForm.monthlyFee) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({
          text: reviewForm.status === "APPROVED" ? "আবেদন অনুমোদিত এবং শিক্ষার্থী নিবন্ধিত হয়েছে।" : "আবেদন বাতিল করা হয়েছে।",
          type: "success",
        });
        setSelectedRequestForReview(null);
        fetchData();
      } else {
        setActionMsg({ text: data.error || "আবেদন প্রক্রিয়াকরণ ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    }
  };

  // Trigger Monthly Billing
  const handleGenerateInvoices = async () => {
    if (!confirm(`আপনি কি ${billingMonth} মাসের জন্য সকল সক্রিয় শিক্ষার্থীদের পরিবহন বিল জেনারেট করতে চান?`)) {
      return;
    }
    setBillingLoading(true);
    try {
      const res = await fetch("/api/admin/transport/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingMonth }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({
          text: `সফল! মোট ${data.generatedCount} টি পরিবহন ফি ইনভয়েস জেনারেট করা হয়েছে।`,
          type: "success",
        });
        fetchData();
      } else {
        setActionMsg({ text: data.error || "ইনভয়েস তৈরি ব্যর্থ হয়েছে।", type: "error" });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || "সার্ভার এরর", type: "error" });
    } finally {
      setBillingLoading(false);
    }
  };

  // Filtered enrollments
  const filteredEnrollments = enrollments.filter((e) => {
    const matchesSearch =
      !enrollmentSearch ||
      e.student.fullNameBn.toLowerCase().includes(enrollmentSearch.toLowerCase()) ||
      e.student.studentIdNumber.toLowerCase().includes(enrollmentSearch.toLowerCase());
    const matchesRoute = !enrollmentRouteFilter || e.routeId === enrollmentRouteFilter;
    return matchesSearch && matchesRoute;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-500/30">
              <Bus className="w-3.5 h-3.5" />
              <span>Phase 11 — Transport Management</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">মাদ্রাসা শিক্ষার্থী পরিবহন ব্যবস্থাপনা</h1>
            <p className="text-emerald-200/80 text-sm mt-1">
              রুট, স্টপ, যানবাহন, চালক, শিক্ষার্থী আসন বরাদ্দ ও অভিভাবক আবেদন নিয়ন্ত্রণ কেন্দ্র
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 border border-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>রিফ্রেশ</span>
            </button>
            <button
              onClick={() => setShowEnrollModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-500/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>শিক্ষার্থী বরাদ্দ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            actionMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {actionMsg.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{actionMsg.text}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="p-1 hover:bg-black/5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "ওভারভিউ", icon: Bus },
          { id: "routes", label: "রুট ও স্টপ", icon: MapPin },
          { id: "vehicles", label: "যানবাহন", icon: Car },
          { id: "drivers", label: "চালকবৃন্দ", icon: UserCheck },
          { id: "students", label: "শিক্ষার্থী বরাদ্দ", icon: Users },
          { id: "requests", label: "অভিভাবক আবেদন", icon: FileText, badge: stats?.pendingRequestsCount },
          { id: "reports", label: "ফি ও রিপোর্ট", icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                isActive
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                label: "সক্রিয় রুট",
                value: stats?.totalRoutes ?? 0,
                desc: `${stats?.totalStops ?? 0} টি স্টপ`,
                icon: MapPin,
                color: "text-blue-600 bg-blue-50 border-blue-100",
              },
              {
                label: "যানবাহন বহর",
                value: stats?.totalVehicles ?? 0,
                desc: `${stats?.activeVehicles ?? 0} টি সচল`,
                icon: Car,
                color: "text-emerald-600 bg-emerald-50 border-emerald-100",
              },
              {
                label: "নিবন্ধিত চালক",
                value: stats?.totalDrivers ?? 0,
                desc: `${stats?.activeDrivers ?? 0} জন সচল`,
                icon: UserCheck,
                color: "text-purple-600 bg-purple-50 border-purple-100",
              },
              {
                label: "পরিবহন শিক্ষার্থী",
                value: stats?.activeTransportStudents ?? 0,
                desc: "সক্রিয় যাত্রী",
                icon: Users,
                color: "text-teal-600 bg-teal-50 border-teal-100",
              },
              {
                label: "অপেক্ষমাণ আবেদন",
                value: stats?.pendingRequestsCount ?? 0,
                desc: "পর্যালোচনা প্রয়োজন",
                icon: FileText,
                color: "text-amber-600 bg-amber-50 border-amber-100",
              },
              {
                label: "পরিবহন ফি আদায়",
                value: `৳${(stats?.finance?.paidTotal ?? 0).toLocaleString()}`,
                desc: `বকেয়া: ৳${(stats?.finance?.dueTotal ?? 0).toLocaleString()}`,
                icon: DollarSign,
                color: "text-indigo-600 bg-indigo-50 border-indigo-100",
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">{stat.label}</span>
                    <div className={`p-2 rounded-lg border ${stat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-bold text-slate-800">{stat.value}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Operational Alerts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capacity Alerts */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-800">ধারণক্ষমতা সতর্কতা (Capacity Guard)</h3>
                </div>
                <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-semibold border border-amber-200">
                  {stats?.capacityAlerts?.length || 0} টি রুট/যানবাহন
                </span>
              </div>
              {stats?.capacityAlerts && stats.capacityAlerts.length > 0 ? (
                <div className="space-y-3">
                  {stats.capacityAlerts.map((ca: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm text-slate-800">{ca.routeName} ({ca.routeCode})</div>
                        <div className="text-xs text-slate-500">গাড়ি: {ca.vehicleNumber} | ক্যাপাসিটি: {ca.capacity}</div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          ca.occupancyRate >= 100 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {ca.activeStudents}/{ca.capacity} আসন ({Math.round(ca.occupancyRate)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-sm bg-slate-50 rounded-xl">
                  সকল রুটে যথেষ্ট আসন অবশিষ্ট রয়েছে। কোনো ওভারলোডিং নেই।
                </div>
              )}
            </div>

            {/* License Expiry Alerts */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-slate-800">ড্রাইভিং লাইসেন্স সতর্কতা</h3>
                </div>
                <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-semibold border border-rose-200">
                  {stats?.expiringLicenses?.length || 0} জন চালক
                </span>
              </div>
              {stats?.expiringLicenses && stats.expiringLicenses.length > 0 ? (
                <div className="space-y-3">
                  {stats.expiringLicenses.map((dl: any, idx: number) => (
                    <div key={idx} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm text-slate-800">{dl.fullName}</div>
                        <div className="text-xs text-slate-500">লাইসেন্স: {dl.licenseNumber} | ফোন: {dl.phone}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-rose-700">
                          {dl.isExpired ? "মেয়াদোত্তীর্ণ!" : `${dl.daysRemaining} দিন বাকি`}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {new Date(dl.licenseExpiry).toLocaleDateString("bn-BD")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-sm bg-slate-50 rounded-xl">
                  সকল চালকের ড্রাইভিং লাইসেন্স বৈধ ও হালনাগাদ রয়েছে।
                </div>
              )}
            </div>
          </div>

          {/* Quick Route Cards Summary */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">সক্রিয় পরিবহন রুট বিবরণী</h3>
              <button
                onClick={() => setActiveTab("routes")}
                className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
              >
                <span>সব দেখুন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {routes.slice(0, 3).map((rt) => (
                <div key={rt.id} className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition bg-gradient-to-br from-white to-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-bold">
                      {rt.routeCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      মাসিক: ৳{rt.monthlyFee}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 mt-2">{rt.routeName}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <span>{rt.startPoint}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span>{rt.endPoint}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                    <span>স্টপ: {rt.stops?.length || 0} টি</span>
                    <span>গাড়ি: {rt.vehicle?.vehicleNumber || "বরাদ্দহীন"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROUTES & STOPS */}
      {activeTab === "routes" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-bold text-lg text-slate-800">মাদ্রাসা পরিবহন রুট ও স্টপেজ তালিকা</h3>
            <button
              onClick={() => setShowAddRouteModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন রুট তৈরি</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Routes List */}
            <div className="lg:col-span-1 space-y-3">
              {routes.map((rt) => {
                const isSelected = selectedRoute?.id === rt.id;
                return (
                  <div
                    key={rt.id}
                    onClick={() => setSelectedRoute(rt)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-bold">
                        {rt.routeCode}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        rt.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                      }`}>
                        {rt.status === "ACTIVE" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 mt-1">{rt.routeName}</h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <span>{rt.startPoint}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span>{rt.endPoint}</span>
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
                      <span>স্টপ: {rt.stops?.length || 0} টি</span>
                      <span>ফি: ৳{rt.monthlyFee}/মাস</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Route & Stops Detail */}
            <div className="lg:col-span-2">
              {selectedRoute ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-xs">
                          {selectedRoute.routeCode}
                        </span>
                        <h3 className="text-xl font-bold text-slate-800">{selectedRoute.routeName}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        প্রারম্ভিক: {selectedRoute.startPoint} → গন্তব্য: {selectedRoute.endPoint} | মাসিক ফি: ৳{selectedRoute.monthlyFee}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setStopForm((prev) => ({
                            ...prev,
                            sequenceOrder: (selectedRoute.stops.length + 1).toString(),
                          }));
                          setShowAddStopModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>স্টপ যোগ করুন</span>
                      </button>
                    </div>
                  </div>

                  {/* Vehicle & Driver assigned */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">বরাদ্দকৃত গাড়ি:</span>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {selectedRoute.vehicle?.vehicleNumber || "কোনো গাড়ি নির্ধারিত নেই"}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        ধারণক্ষমতা: {selectedRoute.vehicle?.capacity || 0} আসন
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">নির্ধারিত চালক:</span>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {selectedRoute.vehicle?.driver?.fullName || "চালক নির্ধারিত নেই"}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        ফোন: {selectedRoute.vehicle?.driver?.phone || "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Stops Sequence Timeline */}
                  <div>
                    <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>রুট স্টপেজ ক্রমধারা (Sequence of Stops)</span>
                    </h4>
                    {selectedRoute.stops && selectedRoute.stops.length > 0 ? (
                      <div className="space-y-3">
                        {selectedRoute.stops
                          .sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder)
                          .map((stop: any, idx: number) => (
                            <div
                              key={stop.id}
                              className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                  {stop.sequenceOrder}
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-slate-800">{stop.stopName}</div>
                                  <div className="text-xs text-slate-500">{stop.address || "ঠিকানা উল্লেখ নেই"}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-600">
                                <div className="text-right">
                                  <span className="font-medium text-emerald-700">পিকআপ: {stop.pickupTime || "N/A"}</span>
                                  <div className="text-slate-400">ড্রপ: {stop.dropTime || "N/A"}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl">
                        এই রুটে এখনো কোনো স্টপ যুক্ত করা হয়নি। স্টপ যোগ করতে উপরের বাটনে চাপুন।
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
                  বিস্তারিত দেখতে বাম পাশ থেকে যেকোনো একটি রুট নির্বাচন করুন।
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VEHICLES */}
      {activeTab === "vehicles" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-bold text-lg text-slate-800">মাদ্রাসার যানবাহন বহর (Fleet Directory)</h3>
            <button
              onClick={() => setShowAddVehicleModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন গাড়ি যোগ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs">
                    {v.vehicleType}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      v.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : v.status === "MAINTENANCE"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {v.status === "ACTIVE" ? "সচল" : v.status === "MAINTENANCE" ? "মেরামত চলছে" : "অবসরপ্রাপ্ত"}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-slate-800">{v.vehicleNumber}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">মডেল: {v.model || "তথ্য নেই"}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">ধারণক্ষমতা:</span>
                    <div className="font-bold text-slate-800">{v.capacity} আসন</div>
                  </div>
                  <div>
                    <span className="text-slate-400">চালক:</span>
                    <div className="font-bold text-slate-800">{v.driver?.fullName || "নির্ধারিত নেই"}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span>যুক্ত রুট: {v.routes?.map((r: any) => r.routeCode).join(", ") || "কোনোটি নয়"}</span>
                  {v.driver?.phone && (
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {v.driver.phone}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DRIVERS */}
      {activeTab === "drivers" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-bold text-lg text-slate-800">মাদ্রাসার পরিবহন চালকবৃন্দ (Driver Profiles)</h3>
            <button
              onClick={() => setShowAddDriverModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন চালক যোগ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((d) => (
              <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    d.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {d.status === "ACTIVE" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                  </span>
                  {d.licenseExpiry && new Date(d.licenseExpiry) < new Date() && (
                    <span className="text-[11px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">
                      লাইসেন্স মেয়াদোত্তীর্ণ
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-bold text-slate-800">{d.fullName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{d.phone}</span>
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">লাইসেন্স নং:</span>
                    <span className="font-semibold text-slate-700">{d.licenseNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">লাইসেন্স মেয়াদ:</span>
                    <span className="font-semibold text-slate-700">
                      {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString("bn-BD") : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">জরুরি যোগাযোগ:</span>
                    <span className="font-semibold text-slate-700">{d.emergencyContact || "N/A"}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                  ঠিকানা: {d.address || "ঠিকানা উল্লেখ নেই"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: STUDENT ENROLLMENTS */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-lg text-slate-800">শিক্ষার্থী পরিবহন তালিকা ও আসন বরাদ্দ</h3>
              <p className="text-xs text-slate-500">মোট পরিবহন শিক্ষার্থী: {enrollments.length} জন</p>
            </div>
            <button
              onClick={() => setShowEnrollModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন শিক্ষার্থী বরাদ্দ</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="নাম বা শিক্ষার্থী আইডি দিয়ে খুঁজুন..."
                value={enrollmentSearch}
                onChange={(e) => setEnrollmentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <select
                value={enrollmentRouteFilter}
                onChange={(e) => setEnrollmentRouteFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">সকল রুট</option>
                {routes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.routeCode} — {rt.routeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Enrollments Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">শিক্ষার্থী</th>
                    <th className="px-4 py-3">রুট ও গাড়ি</th>
                    <th className="px-4 py-3">পিকআপ ও ড্রপ স্টপ</th>
                    <th className="px-4 py-3">মাসিক ফি</th>
                    <th className="px-4 py-3">অবস্থা</th>
                    <th className="px-4 py-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnrollments.map((en) => (
                    <tr key={en.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{en.student?.fullNameBn}</div>
                        <div className="text-xs text-slate-500">{en.student?.studentIdNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{en.route?.routeName}</div>
                        <div className="text-xs text-slate-500">
                          কোড: {en.route?.routeCode} | গাড়ি: {en.route?.vehicle?.vehicleNumber || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="text-emerald-700 font-medium">
                          পিকআপ: {en.pickupStop?.stopName || "N/A"} ({en.pickupStop?.pickupTime || "N/A"})
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          ড্রপ: {en.dropStop?.stopName || "N/A"} ({en.dropStop?.dropTime || "N/A"})
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        ৳{en.monthlyFee}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            en.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : en.status === "CANCELLED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {en.status === "ACTIVE" ? "সক্রিয়" : en.status === "CANCELLED" ? "বাতিল" : en.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {en.status === "ACTIVE" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedEnrollmentForTransfer(en);
                                setTransferForm({
                                  newRouteId: en.routeId,
                                  newPickupStopId: en.pickupStopId || "",
                                  newDropStopId: en.dropStopId || "",
                                  newMonthlyFee: en.monthlyFee.toString(),
                                  reason: "",
                                });
                                setShowTransferModal(true);
                              }}
                              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition"
                            >
                              রুট পরিবর্তন
                            </button>
                            <button
                              onClick={() => handleCancelEnrollment(en.id)}
                              className="px-2.5 py-1 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-semibold transition"
                            >
                              বাতিল
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredEnrollments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                        কোনো শিক্ষার্থী পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GUARDIAN REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-lg text-slate-800">অভিভাবক পরিবহন আবেদনসমূহ (Portal Requests)</h3>
              <p className="text-xs text-slate-500">
                অভিভাবক কর্তৃক সন্তানদের জন্য জমা দেওয়া আবেদন পর্যালোচনা ও অনুমোদন
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={requestFilter}
                onChange={(e) => setRequestFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">সকল আবেদন</option>
                <option value="SUBMITTED">অপেক্ষমাণ (SUBMITTED)</option>
                <option value="APPROVED">অনুমোদিত (APPROVED)</option>
                <option value="REJECTED">বাতিলকৃত (REJECTED)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {requests
              .filter((r) => !requestFilter || r.status === requestFilter)
              .map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded">
                        {req.requestNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          req.status === "SUBMITTED"
                            ? "bg-amber-100 text-amber-800"
                            : req.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {req.status === "SUBMITTED" ? "অপেক্ষমাণ" : req.status === "APPROVED" ? "অনুমোদিত" : "বাতিল"}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 text-base">{req.student?.fullNameBn}</div>
                    <div className="text-xs text-slate-500">
                      অভিভাবক: {req.guardian?.fullNameBn} | ফোন: {req.guardian?.phone}
                    </div>
                    <div className="text-xs text-emerald-700 font-medium mt-1">
                      অনুরোধকৃত রুট: {req.route?.routeName} ({req.route?.routeCode}) | স্টপ: {req.pickupStop?.stopName}
                    </div>
                    {req.guardianNotes && (
                      <div className="text-xs text-slate-500 italic">মন্তব্য: "{req.guardianNotes}"</div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {req.status === "SUBMITTED" ? (
                      <button
                        onClick={() => {
                          setSelectedRequestForReview(req);
                          setReviewForm({
                            status: "APPROVED",
                            rejectionReason: "",
                            effectiveDate: new Date().toISOString().split("T")[0],
                            monthlyFee: req.route?.monthlyFee ? req.route.monthlyFee.toString() : "1500",
                          });
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        পর্যালোচনা ও অনুমোদন
                      </button>
                    ) : (
                      <div className="text-right text-xs text-slate-400">
                        {req.status === "APPROVED" ? (
                          <span className="text-emerald-600 font-semibold">বরাদ্দ সক্রিয়</span>
                        ) : (
                          <span className="text-rose-600 font-semibold">কারণ: {req.rejectionReason}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            {requests.length === 0 && (
              <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
                কোনো পরিবহন আবেদন পাওয়া যায়নি।
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: FEES & REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>মাসিক পরিবহন ফি বিলিং (Finance Engine Batch Invoicing)</span>
            </h3>
            <p className="text-xs text-slate-500">
              সকল সক্রিয় পরিবহন শিক্ষার্থীদের জন্য নির্দিষ্ট মাসের পরিবহন ফি স্বয়ংক্রিয়ভাবে Phase 6 Finance ইনভয়েসে যুক্ত হবে।
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
              <input
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleGenerateInvoices}
                disabled={billingLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <DollarSign className="w-4 h-4" />
                <span>{billingLoading ? "জেনারেট হচ্ছে..." : "মাসিক বিলিং রান করুন"}</span>
              </button>
            </div>
          </div>

          {/* Printable Registers */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" />
              <span>প্রিন্ট ও অফিশিয়াল রেজিস্টার রিপোর্ট</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => window.print()}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition text-left space-y-1 bg-slate-50"
              >
                <div className="font-bold text-sm text-slate-800">শিক্ষার্থী পরিবহন রেজিস্টার</div>
                <div className="text-xs text-slate-500">সকল সক্রিয় পরিবহন যাত্রীদের তালিকা প্রিন্ট করুন</div>
              </button>
              <button
                onClick={() => window.print()}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition text-left space-y-1 bg-slate-50"
              >
                <div className="font-bold text-sm text-slate-800">রুট ও স্টপ বিবরণী</div>
                <div className="text-xs text-slate-500">মাদ্রাসার সমস্ত রুট ও সময়সূচির নথি</div>
              </button>
              <button
                onClick={() => window.print()}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition text-left space-y-1 bg-slate-50"
              >
                <div className="font-bold text-sm text-slate-800">যানবাহন ও চালক তালিকা</div>
                <div className="text-xs text-slate-500">বহর ও চালকের লাইসেন্স নথিপত্র</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ROUTE */}
      {showAddRouteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-800">নতুন পরিবহন রুট তৈরি</h3>
              <button onClick={() => setShowAddRouteModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRoute} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">রুটের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: রুট ১ — ইলিয়টগঞ্জ বাজার → মাদ্রাসা"
                  value={routeForm.routeName}
                  onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">রুট কোড *</label>
                  <input
                    type="text"
                    required
                    placeholder="ROUTE-01"
                    value={routeForm.routeCode}
                    onChange={(e) => setRouteForm({ ...routeForm, routeCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">মাসিক ফি (টাকা) *</label>
                  <input
                    type="number"
                    required
                    value={routeForm.monthlyFee}
                    onChange={(e) => setRouteForm({ ...routeForm, monthlyFee: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">প্রারম্ভিক স্থান *</label>
                  <input
                    type="text"
                    required
                    placeholder="ইলিয়টগঞ্জ বাস স্ট্যান্ড"
                    value={routeForm.startPoint}
                    onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">গন্তব্য *</label>
                  <input
                    type="text"
                    required
                    placeholder="মাদ্রাসা ক্যাম্পাস"
                    value={routeForm.endPoint}
                    onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">নির্ধারিত গাড়ি (ঐচ্ছিক)</label>
                <select
                  value={routeForm.vehicleId}
                  onChange={(e) => setRouteForm({ ...routeForm, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">কোনো গাড়ি নির্ধারিত নেই</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.model || v.vehicleType}, ক্যাপাসিটি: {v.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
                >
                  রুট সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STOP */}
      {showAddStopModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-800">স্টপেজ যুক্ত করুন</h3>
              <button onClick={() => setShowAddStopModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStop} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">স্টপের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: স্টেশন রোড মোড়"
                  value={stopForm.stopName}
                  onChange={(e) => setStopForm({ ...stopForm, stopName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">ক্রম (Seq) *</label>
                  <input
                    type="number"
                    required
                    value={stopForm.sequenceOrder}
                    onChange={(e) => setStopForm({ ...stopForm, sequenceOrder: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">পিকআপ সময়</label>
                  <input
                    type="text"
                    placeholder="07:30 AM"
                    value={stopForm.pickupTime}
                    onChange={(e) => setStopForm({ ...stopForm, pickupTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">ড্রপ সময়</label>
                  <input
                    type="text"
                    placeholder="02:00 PM"
                    value={stopForm.dropTime}
                    onChange={(e) => setStopForm({ ...stopForm, dropTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">ঠিকানা বা ল্যান্ডমার্ক</label>
                <input
                  type="text"
                  placeholder="যেমন: জামে মসজিদের সামনে"
                  value={stopForm.address}
                  onChange={(e) => setStopForm({ ...stopForm, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddStopModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
                >
                  স্টপ যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD VEHICLE */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-800">নতুন গাড়ি নিবন্ধন</h3>
              <button onClick={() => setShowAddVehicleModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateVehicle} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">গাড়ির নম্বর / রেজিস্ট্রেশন *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ঢাকা মেট্রো-চ ১১-২২৩৩"
                  value={vehicleForm.vehicleNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">গাড়ির ধরন</label>
                  <select
                    value={vehicleForm.vehicleType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  >
                    <option value="BUS">বাস (Bus)</option>
                    <option value="MICROBUS">মাইক্রোবাস (Microbus)</option>
                    <option value="VAN">ভ্যান (Van)</option>
                    <option value="OTHER">অন্যান্য</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">আসন সংখ্যা (ক্যাপাসিটি) *</label>
                  <input
                    type="number"
                    required
                    value={vehicleForm.capacity}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">মডেল বা বিবরণ</label>
                <input
                  type="text"
                  placeholder="যেমন: Toyota HiAce 2018"
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">নির্ধারিত চালক</label>
                <select
                  value={vehicleForm.driverId}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">চালক পরে নির্ধারণ করা হবে</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
                >
                  গাড়ি সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DRIVER */}
      {showAddDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-800">নতুন চালক নিবন্ধন</h3>
              <button onClick={() => setShowAddDriverModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDriver} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">চালকের পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="চালকের নাম"
                  value={driverForm.fullName}
                  onChange={(e) => setDriverForm({ ...driverForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">জরুরি যোগাযোগ</label>
                  <input
                    type="tel"
                    placeholder="018XXXXXXXX"
                    value={driverForm.emergencyContact}
                    onChange={(e) => setDriverForm({ ...driverForm, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">লাইসেন্স নম্বর</label>
                  <input
                    type="text"
                    placeholder="DK-1234567"
                    value={driverForm.licenseNumber}
                    onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">লাইসেন্স মেয়াদ</label>
                  <input
                    type="date"
                    value={driverForm.licenseExpiry}
                    onChange={(e) => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">ঠিকানা</label>
                <input
                  type="text"
                  placeholder="বর্তমান ঠিকানা"
                  value={driverForm.address}
                  onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENROLL STUDENT */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-800">শিক্ষার্থী পরিবহন বরাদ্দ</h3>
              <button onClick={() => setShowEnrollModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEnrollStudent} className="space-y-3">
              {/* Student Search */}
              <div>
                <label className="text-xs font-semibold text-slate-600">শিক্ষার্থী নির্বাচন *</label>
                {selectedStudentForEnroll ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-emerald-900">{selectedStudentForEnroll.fullNameBn}</div>
                      <div className="text-xs text-emerald-700">আইডি: {selectedStudentForEnroll.studentIdNumber}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForEnroll(null)}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      পরিবর্তন
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 relative">
                    <input
                      type="text"
                      placeholder="নাম বা আইডি লিখুন..."
                      value={studentQuery}
                      onChange={(e) => handleStudentSearch(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    />
                    {studentSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 bg-white border rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {studentSearchResults.map((st) => (
                          <div
                            key={st.id}
                            onClick={() => {
                              setSelectedStudentForEnroll(st);
                              setStudentSearchResults([]);
                            }}
                            className="p-2.5 hover:bg-emerald-50 cursor-pointer border-b last:border-0 text-xs"
                          >
                            <div className="font-bold text-slate-800">{st.fullNameBn}</div>
                            <div className="text-slate-500">আইডি: {st.studentIdNumber}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Session Select */}
              <div>
                <label className="text-xs font-semibold text-slate-600">শিক্ষাবর্ষ *</label>
                <select
                  required
                  value={enrollForm.sessionId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, sessionId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">সেশন নির্বাচন করুন</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isCurrent ? "(বর্তমান)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Route Select */}
              <div>
                <label className="text-xs font-semibold text-slate-600">পরিবহন রুট *</label>
                <select
                  required
                  value={enrollForm.routeId}
                  onChange={(e) => {
                    const rId = e.target.value;
                    const r = routes.find((rt) => rt.id === rId);
                    setEnrollForm({
                      ...enrollForm,
                      routeId: rId,
                      pickupStopId: r?.stops?.[0]?.id || "",
                      dropStopId: r?.stops?.[r?.stops?.length - 1]?.id || "",
                      monthlyFee: r?.monthlyFee ? r.monthlyFee.toString() : "1500",
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">রুট নির্বাচন করুন</option>
                  {routes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.routeCode} — {rt.routeName} (মাসিক: ৳{rt.monthlyFee})
                    </option>
                  ))}
                </select>
              </div>

              {/* Stop Selects */}
              {enrollForm.routeId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">পিকআপ স্টপ *</label>
                    <select
                      required
                      value={enrollForm.pickupStopId}
                      onChange={(e) => setEnrollForm({ ...enrollForm, pickupStopId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    >
                      <option value="">পিকআপ স্টপ</option>
                      {routes
                        .find((rt) => rt.id === enrollForm.routeId)
                        ?.stops?.map((st: any) => (
                          <option key={st.id} value={st.id}>
                            {st.sequenceOrder}. {st.stopName} ({st.pickupTime})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">ড্রপ স্টপ</label>
                    <select
                      value={enrollForm.dropStopId}
                      onChange={(e) => setEnrollForm({ ...enrollForm, dropStopId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    >
                      <option value="">ড্রপ স্টপ</option>
                      {routes
                        .find((rt) => rt.id === enrollForm.routeId)
                        ?.stops?.map((st: any) => (
                          <option key={st.id} value={st.id}>
                            {st.sequenceOrder}. {st.stopName} ({st.dropTime})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Fee & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">মাসিক ফি (টাকা)</label>
                  <input
                    type="number"
                    value={enrollForm.monthlyFee}
                    onChange={(e) => setEnrollForm({ ...enrollForm, monthlyFee: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">শুরুর তারিখ</label>
                  <input
                    type="date"
                    value={enrollForm.startDate}
                    onChange={(e) => setEnrollForm({ ...enrollForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
                >
                  বরাদ্দ সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER ROUTE */}
      {showTransferModal && selectedEnrollmentForTransfer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-800">শিক্ষার্থীর রুট পরিবর্তন</h3>
              <button onClick={() => setShowTransferModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
              <div>শিক্ষার্থী: <strong>{selectedEnrollmentForTransfer.student?.fullNameBn}</strong></div>
              <div>বর্তমান রুট: {selectedEnrollmentForTransfer.route?.routeName}</div>
            </div>
            <form onSubmit={handleTransferRoute} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">নতুন রুট নির্বাচন *</label>
                <select
                  required
                  value={transferForm.newRouteId}
                  onChange={(e) => {
                    const rId = e.target.value;
                    const r = routes.find((rt) => rt.id === rId);
                    setTransferForm({
                      ...transferForm,
                      newRouteId: rId,
                      newPickupStopId: r?.stops?.[0]?.id || "",
                      newDropStopId: r?.stops?.[r?.stops?.length - 1]?.id || "",
                      newMonthlyFee: r?.monthlyFee ? r.monthlyFee.toString() : transferForm.newMonthlyFee,
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">রুট নির্বাচন করুন</option>
                  {routes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.routeCode} — {rt.routeName} (মাসিক: ৳{rt.monthlyFee})
                    </option>
                  ))}
                </select>
              </div>

              {transferForm.newRouteId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">পিকআপ স্টপ</label>
                    <select
                      value={transferForm.newPickupStopId}
                      onChange={(e) => setTransferForm({ ...transferForm, newPickupStopId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    >
                      {routes
                        .find((rt) => rt.id === transferForm.newRouteId)
                        ?.stops?.map((st: any) => (
                          <option key={st.id} value={st.id}>
                            {st.stopName}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">ড্রপ স্টপ</label>
                    <select
                      value={transferForm.newDropStopId}
                      onChange={(e) => setTransferForm({ ...transferForm, newDropStopId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    >
                      {routes
                        .find((rt) => rt.id === transferForm.newRouteId)
                        ?.stops?.map((st: any) => (
                          <option key={st.id} value={st.id}>
                            {st.stopName}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600">পরিবর্তনের কারণ</label>
                <input
                  type="text"
                  placeholder="যেমন: বাসা পরিবর্তন"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
                >
                  রুট আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW REQUEST */}
      {selectedRequestForReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-800">পরিবহন আবেদন পর্যালোচনা</h3>
              <button onClick={() => setSelectedRequestForReview(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div>আবেদন নং: <strong>{selectedRequestForReview.requestNumber}</strong></div>
              <div>শিক্ষার্থী: <strong>{selectedRequestForReview.student?.fullNameBn}</strong></div>
              <div>অভিভাবক: {selectedRequestForReview.guardian?.fullNameBn} ({selectedRequestForReview.guardian?.phone})</div>
              <div>অনুরোধকৃত রুট: {selectedRequestForReview.route?.routeName}</div>
              <div>স্টপ: {selectedRequestForReview.pickupStop?.stopName}</div>
            </div>
            <form onSubmit={handleReviewRequest} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">সিদ্ধান্ত *</label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-bold"
                >
                  <option value="APPROVED" className="text-emerald-700">অনুমোদন (APPROVE)</option>
                  <option value="REJECTED" className="text-rose-700">বাতিল (REJECT)</option>
                </select>
              </div>

              {reviewForm.status === "APPROVED" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">কার্যকর তারিখ</label>
                      <input
                        type="date"
                        value={reviewForm.effectiveDate}
                        onChange={(e) => setReviewForm({ ...reviewForm, effectiveDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">মাসিক ফি (টাকা)</label>
                      <input
                        type="number"
                        value={reviewForm.monthlyFee}
                        onChange={(e) => setReviewForm({ ...reviewForm, monthlyFee: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-600">বাতিলের কারণ *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="বাতিলের সুনির্দিষ্ট কারণ লিখুন..."
                    value={reviewForm.rejectionReason}
                    onChange={(e) => setReviewForm({ ...reviewForm, rejectionReason: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForReview(null)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-xl text-sm font-bold ${
                    reviewForm.status === "APPROVED"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {reviewForm.status === "APPROVED" ? "অনুমোদন নিশ্চিত করুন" : "আবেদন বাতিল করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
