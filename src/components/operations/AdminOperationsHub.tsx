"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Database,
  HardDrive,
  ShieldCheck,
  Mail,
  Bell,
  CreditCard,
  Archive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  Check,
  RotateCcw,
  Sliders,
  Clock,
  FileCheck,
  Plus,
  Terminal,
  Server,
  Lock,
} from "lucide-react";

interface ComponentHealth {
  status: "HEALTHY" | "DEGRADED" | "DOWN" | "UNKNOWN";
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
  lastChecked: string;
}

interface HealthData {
  overallStatus: "HEALTHY" | "DEGRADED" | "DOWN" | "UNKNOWN";
  timestamp: string;
  version: {
    app: string;
    schema: string;
    node: string;
    database: string;
  };
  components: {
    application: ComponentHealth;
    database: ComponentHealth;
    storage: ComponentHealth;
    authentication: ComponentHealth;
    email: ComponentHealth;
    notifications: ComponentHealth;
    payments: ComponentHealth;
    backgroundJobs: ComponentHealth;
    backups: ComponentHealth;
  };
  maintenance: {
    isActive: boolean;
    reason?: string;
    messageBn?: string;
    startedAt?: string;
  };
}

export default function AdminOperationsHub() {
  const [activeSubTab, setActiveSubTab] = useState<
    "HEALTH" | "BACKUPS" | "INCIDENTS" | "ALERTS" | "MAINTENANCE"
  >("HEALTH");

  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Backups state
  const [backups, setBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  // Restore Modal State
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<any | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [restoreReason, setRestoreReason] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any | null>(null);

  // Drill State
  const [runningDrillId, setRunningDrillId] = useState<string | null>(null);
  const [drillResult, setDrillResult] = useState<any | null>(null);

  // Incidents state
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    affectedService: "APPLICATION",
  });
  const [submittingIncident, setSubmittingIncident] = useState(false);

  // Alerts state
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Maintenance state
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [updatingMaintenance, setUpdatingMaintenance] = useState(false);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Fetch Health
  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch("/api/admin/operations/health");
      const json = await res.json();
      if (json.success && json.health) {
        setHealth(json.health);
      }
    } catch {
      showToast("সিস্টেম স্বাস্থ্য ডেটা লোড করতে ব্যর্থ হয়েছে", "error");
    } finally {
      setLoadingHealth(false);
    }
  };

  // Fetch Backups
  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch("/api/admin/operations/backups");
      const json = await res.json();
      if (json.success && json.backups) {
        setBackups(json.backups);
      }
    } catch {
      showToast("ব্যাকআপ তালিকা লোড করতে ব্যর্থ হয়েছে", "error");
    } finally {
      setLoadingBackups(false);
    }
  };

  // Fetch Incidents
  const fetchIncidents = async () => {
    setLoadingIncidents(true);
    try {
      const res = await fetch("/api/admin/operations/incidents");
      const json = await res.json();
      if (json.success && json.incidents) {
        setIncidents(json.incidents);
      }
    } catch {
      showToast("ইনসিডেন্ট তালিকা লোড করতে ব্যর্থ হয়েছে", "error");
    } finally {
      setLoadingIncidents(false);
    }
  };

  // Fetch Alerts
  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch("/api/admin/operations/alerts");
      const json = await res.json();
      if (json.success && json.alerts) {
        setAlerts(json.alerts);
      }
    } catch {
      showToast("অপারেশনাল অ্যালার্ট লোড করতে ব্যর্থ হয়েছে", "error");
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchBackups();
    fetchIncidents();
    fetchAlerts();
  }, []);

  // Create Backup
  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch("/api/admin/operations/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "MANUAL" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`সফলভাবে ব্যাকআপ সম্পন্ন হয়েছে: ${json.backup.backupCode}`, "success");
        fetchBackups();
        fetchHealth();
      } else {
        showToast(json.error || "ব্যাকআপ তৈরি ব্যর্থ হয়েছে", "error");
      }
    } catch {
      showToast("সার্ভার ত্রুটি: ব্যাকআপ তৈরি করা যায়নি", "error");
    } finally {
      setCreatingBackup(false);
    }
  };

  // Verify Backup
  const handleVerifyBackup = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/operations/backups/${id}/verify`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast("ব্যাকআপের অখণ্ডতা এবং SHA-256 হ্যাশ সফলভাবে যাচাই করা হয়েছে!", "success");
        fetchBackups();
      } else {
        showToast(json.error || "যাচাই ব্যর্থ হয়েছে", "error");
      }
    } catch {
      showToast("যাচাই করতে সমস্যা হয়েছে", "error");
    }
  };

  // Run Recovery Drill
  const handleRunDrill = async (id: string) => {
    setRunningDrillId(id);
    setDrillResult(null);
    try {
      const res = await fetch(`/api/admin/operations/backups/${id}/drill`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        setDrillResult(json.drill);
        showToast(`রিকভারি ড্রিল সফল! RTO: ${json.drill.rtoSeconds}s, RPO: ${json.drill.rpoHours}h`, "success");
      } else {
        showToast(json.error || "রিকভারি ড্রিল ব্যর্থ হয়েছে", "error");
      }
    } catch {
      showToast("রিকভারি ড্রিল পরিচালনা ব্যর্থ হয়েছে", "error");
    } finally {
      setRunningDrillId(null);
    }
  };

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!selectedBackupForRestore) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/admin/operations/backups/${selectedBackupForRestore.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: restoreConfirmText,
          reason: restoreReason,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setRestoreResult(json.restore);
        showToast("ডেটাবেস পুনরুদ্ধার সফলভাবে সম্পন্ন হয়েছে!", "success");
        fetchHealth();
        fetchBackups();
      } else {
        showToast(json.error || "পুনরুদ্ধার ব্যর্থ হয়েছে", "error");
      }
    } catch {
      showToast("সার্ভার ত্রুটি: ডেটাবেস পুনরুদ্ধার ব্যর্থ", "error");
    } finally {
      setRestoring(false);
    }
  };

  // Create Incident
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncident.title || !newIncident.description) return;
    setSubmittingIncident(true);
    try {
      const res = await fetch("/api/admin/operations/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIncident),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`ইনসিডেন্ট নথিভুক্ত হয়েছে: ${json.incident.incidentCode}`, "success");
        setShowIncidentModal(false);
        setNewIncident({ title: "", description: "", severity: "MEDIUM", affectedService: "APPLICATION" });
        fetchIncidents();
        fetchAlerts();
      } else {
        showToast(json.error || "ইনসিডেন্ট তৈরি ব্যর্থ", "error");
      }
    } catch {
      showToast("ত্রুটি: ইনসিডেন্ট সংরক্ষণ করা যায়নি", "error");
    } finally {
      setSubmittingIncident(false);
    }
  };

  // Update Incident Status
  const handleUpdateIncidentStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/operations/incidents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`ইনসিডেন্ট স্ট্যাটাস আপডেট: ${status}`, "success");
        fetchIncidents();
        fetchAlerts();
      }
    } catch {
      showToast("স্ট্যাটাস আপডেট ব্যর্থ", "error");
    }
  };

  // Acknowledge Alert
  const handleAcknowledgeAlert = async (id: string) => {
    try {
      await fetch(`/api/admin/operations/alerts/${id}/acknowledge`, { method: "PATCH" });
      fetchAlerts();
      showToast("অ্যালার্ট নিশ্চিতকরণ সম্পন্ন", "success");
    } catch {
      showToast("অ্যালার্ট আপডেট করা যায়নি", "error");
    }
  };

  // Resolve Alert
  const handleResolveAlert = async (id: string) => {
    try {
      await fetch(`/api/admin/operations/alerts/${id}/resolve`, { method: "PATCH" });
      fetchAlerts();
      showToast("অ্যালার্ট সমাধান সম্পন্ন", "success");
    } catch {
      showToast("অ্যালার্ট আপডেট করা যায়নি", "error");
    }
  };

  // Toggle Maintenance Mode
  const handleToggleMaintenance = async (enable: boolean) => {
    setUpdatingMaintenance(true);
    try {
      const res = await fetch("/api/admin/operations/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: enable,
          reason: maintenanceReason || (enable ? "জরুরি সিস্টেম রক্ষণাবেক্ষণ" : "রক্ষণাবেক্ষণ সমাপ্ত"),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(
          enable ? "সিস্টেম মেইনটেনেন্স মোড সক্রিয় করা হয়েছে" : "মেইনটেনেন্স মোড সফলভাবে বন্ধ করা হয়েছে",
          "success"
        );
        fetchHealth();
      } else {
        showToast(json.error || "মেইনটেনেন্স মোড আপডেট ব্যর্থ", "error");
      }
    } catch {
      showToast("সার্ভার ত্রুটি", "error");
    } finally {
      setUpdatingMaintenance(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HEALTHY":
      case "COMPLETED":
      case "VERIFIED":
      case "RESOLVED":
      case "PASSED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3.5 h-3.5" /> স্বাভাবিক (Healthy)</span>;
      case "DEGRADED":
      case "WARNING":
      case "INVESTIGATING":
      case "MITIGATING":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><AlertTriangle className="w-3.5 h-3.5" /> সতর্কবার্তা (Degraded)</span>;
      case "DOWN":
      case "FAILED":
      case "CRITICAL":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800"><XCircle className="w-3.5 h-3.5" /> বিকল (Down)</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"><HelpCircle className="w-3.5 h-3.5" /> অনির্ধারিত (Unknown)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium shadow-lg transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-900 text-emerald-100 border border-emerald-700"
              : "bg-red-900 text-red-100 border border-red-700"
          }`}
        >
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-white hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      {/* Maintenance Mode Alert Banner */}
      {health?.maintenance.isActive && (
        <div className="bg-amber-600 text-white p-4 rounded-xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <div>
              <p className="font-bold text-base">সিস্টেম রক্ষণাবেক্ষণ মোড সক্রিয় রয়েছে</p>
              <p className="text-sm opacity-90">{health.maintenance.messageBn || health.maintenance.reason}</p>
            </div>
          </div>
          <button
            onClick={() => handleToggleMaintenance(false)}
            disabled={updatingMaintenance}
            className="px-4 py-2 bg-white text-amber-900 font-semibold rounded-lg hover:bg-amber-50 text-sm"
          >
            স্বাভাবিক মোডে ফিরুন
          </button>
        </div>
      )}

      {/* Hub Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-xl border border-indigo-400/20">
              <Activity className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">সিস্টেম অপারেশন ও ডিজাস্টার রিকভারি সেন্টার</h1>
              <p className="text-slate-300 text-sm mt-0.5">
                ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা • ফেজ ১৬ প্রোডাকশন রিলায়েবিলিটি ইঞ্জিন
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400">ভার্সন: </span>
            <span className="font-mono font-semibold text-indigo-300">v{health?.version.app || "1.0.0"}</span>
          </div>
          <button
            onClick={() => {
              fetchHealth();
              fetchBackups();
              fetchIncidents();
              fetchAlerts();
              showToast("সকল অপারেশনাল তথ্য রিফ্রেশ করা হয়েছে", "success");
            }}
            disabled={loadingHealth}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow"
          >
            <RefreshCw className={`w-4 h-4 ${loadingHealth ? "animate-spin" : ""}`} />
            রিফ্রেশ স্ট্যাটাস
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: "HEALTH", label: "সিস্টেম স্বাস্থ্য ও পর্যবেক্ষণ", icon: Activity },
          { id: "BACKUPS", label: "ব্যাকআপ ও পুনরুদ্ধার", icon: Archive },
          { id: "INCIDENTS", label: "ইনসিডেন্ট ও বিভ্রাট", icon: AlertTriangle },
          { id: "ALERTS", label: "অপারেশনাল অ্যালার্ট", icon: Bell },
          { id: "MAINTENANCE", label: "মেইনটেনেন্স ও রিকভারি ড্রিল", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: SYSTEM HEALTH & MONITORING */}
      {activeSubTab === "HEALTH" && (
        <div className="space-y-6">
          {/* Top Status & Meta Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">সার্বিক অবস্থা</p>
                <div className="mt-2">{getStatusBadge(health?.overallStatus || "UNKNOWN")}</div>
              </div>
              <Server className="w-8 h-8 text-indigo-500 opacity-30" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ডেটাবেস ল্যাটেন্সি</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {health?.components.database.latencyMs !== undefined ? `${health.components.database.latencyMs} ms` : "—"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">SQLite 3 (dev.db)</p>
              </div>
              <Database className="w-8 h-8 text-emerald-500 opacity-30" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">মেমরি ব্যবহার (RSS)</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {health?.components.application.details?.memoryRssMb ? `${health.components.application.details.memoryRssMb} MB` : "—"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Node {process.version}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500 opacity-30" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">সর্বশেষ ব্যাকআপ</p>
                <p className="text-sm font-bold text-slate-800 mt-1 truncate max-w-[160px]">
                  {health?.components.backups.details?.latestBackupCode || "কোনো ব্যাকআপ নেই"}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                  {health?.components.backups.details?.latestVerifiedCode ? "যাচাইকৃত ব্যাকআপ বিদ্যমান" : "যাচাইকরণ প্রয়োজন"}
                </p>
              </div>
              <Archive className="w-8 h-8 text-amber-500 opacity-30" />
            </div>
          </div>

          {/* Detailed Component Health Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {health &&
              Object.entries(health.components).map(([key, comp]) => {
                let Icon = Server;
                let titleBn = key;
                if (key === "application") { Icon = Activity; titleBn = "অ্যাপ্লিকেশন রানটাইম"; }
                if (key === "database") { Icon = Database; titleBn = "ডেটাবেস ইঞ্জিন"; }
                if (key === "storage") { Icon = HardDrive; titleBn = "ফাইল স্টোরেজ"; }
                if (key === "authentication") { Icon = ShieldCheck; titleBn = "অথেনটিকেশন ও সেশন"; }
                if (key === "email") { Icon = Mail; titleBn = "ইমেইল ও এসএমটিপি"; }
                if (key === "notifications") { Icon = Bell; titleBn = "নোটিফিকেশন আউটবক্স"; }
                if (key === "payments") { Icon = CreditCard; titleBn = "পেমেন্ট লেনদেন"; }
                if (key === "backgroundJobs") { Icon = Clock; titleBn = "শিডিউলড রিপোর্ট ও জবস"; }
                if (key === "backups") { Icon = Archive; titleBn = "ব্যাকআপ ও রিকভারি পয়েন্ট"; }

                return (
                  <div key={key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">{titleBn}</h3>
                          <span className="text-[11px] text-slate-400 uppercase font-mono">{key}</span>
                        </div>
                      </div>
                      {getStatusBadge(comp.status)}
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {comp.message || "পরিষেবা সক্রিয়"}
                    </p>

                    {comp.details && (
                      <div className="space-y-1 text-xs text-slate-500 font-mono bg-slate-900 text-slate-300 p-2.5 rounded-lg overflow-x-auto">
                        {Object.entries(comp.details).map(([dKey, dVal]) => (
                          <div key={dKey} className="flex justify-between">
                            <span className="text-slate-400">{dKey}:</span>
                            <span className="text-indigo-300 font-semibold">{String(dVal)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 text-right">
                      চেক করা হয়েছে: {new Date(comp.lastChecked).toLocaleTimeString("bn-BD")}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BACKUPS & RESTORE */}
      {activeSubTab === "BACKUPS" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">ডেটাবেস ব্যাকআপ ব্যবস্থাপনা</h2>
              <p className="text-slate-500 text-sm">
                সম্পূর্ণ প্রোডাকশন ডেটাবেসের সুরক্ষিত বাইনারি কপি, SHA-256 চেকসাম ও অখণ্ডতা যাচাইকরণ
              </p>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow"
            >
              <Plus className="w-4 h-4" />
              {creatingBackup ? "ব্যাকআপ তৈরি হচ্ছে..." : "নতুন ব্যাকআপ তৈরি করুন"}
            </button>
          </div>

          {/* Drill Result Card */}
          {drillResult && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-indigo-950 text-sm">রিকভারি ড্রিল ফলাফল ({drillResult.drillCode})</p>
                <p className="text-xs text-indigo-700 mt-0.5">
                  স্ট্যাটাস: <span className="font-semibold text-emerald-700">{drillResult.status}</span> •
                  RTO (পুনরুদ্ধার সময়): <span className="font-semibold">{drillResult.rtoSeconds} সেকেন্ড</span> •
                  RPO (ডেটা ফাঁক): <span className="font-semibold">{drillResult.rpoHours} ঘণ্টা</span>
                </p>
              </div>
              <button onClick={() => setDrillResult(null)} className="text-indigo-400 hover:text-indigo-700 text-xs">
                বন্ধ করুন
              </button>
            </div>
          )}

          {/* Backups Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">ব্যাকআপ কোড</th>
                    <th className="px-6 py-4">ধরন</th>
                    <th className="px-6 py-4">আকার</th>
                    <th className="px-6 py-4">চেকসাম (SHA-256)</th>
                    <th className="px-6 py-4">যাচাইকরণ</th>
                    <th className="px-6 py-4">তৈরির সময়</th>
                    <th className="px-6 py-4 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {backups.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        এখনো কোনো ব্যাকআপ রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    backups.map((bkp) => (
                      <tr key={bkp.id} className="hover:bg-slate-50/70 transition-all">
                        <td className="px-6 py-4 font-mono font-bold text-indigo-900">{bkp.backupCode}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                            {bkp.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                          {bkp.sizeBytes ? `${Math.round((bkp.sizeBytes / (1024 * 1024)) * 100) / 100} MB` : "—"}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 truncate max-w-[140px]" title={bkp.checksum}>
                          {bkp.checksum ? `${bkp.checksum.slice(0, 10)}...` : "—"}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(bkp.verificationStatus)}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(bkp.createdAt).toLocaleString("bn-BD")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleVerifyBackup(bkp.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                              title="চেকসাম ও হেডার যাচাই করুন"
                            >
                              যাচাই
                            </button>
                            <button
                              onClick={() => handleRunDrill(bkp.id)}
                              disabled={runningDrillId === bkp.id}
                              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                              title="আইসোলেটেড রিকভারি ড্রিল পরিচালনা করুন"
                            >
                              {runningDrillId === bkp.id ? "ড্রিল চলছে..." : "রিকভারি ড্রিল"}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBackupForRestore(bkp);
                                setRestoreConfirmText("");
                                setRestoreReason("");
                                setRestoreResult(null);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition"
                            >
                              পুনরুদ্ধার
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-7 h-7" />
              <h3 className="text-xl font-bold text-slate-900">ডেটাবেস পুনরুদ্ধারের চূড়ান্ত নিশ্চিতকরণ</h3>
            </div>

            <p className="text-sm text-slate-600">
              আপনি <span className="font-mono font-bold text-red-700">{selectedBackupForRestore.backupCode}</span> ব্যাকআপটি প্রোডাকশনে ফিরিয়ে আনতে যাচ্ছেন।
              এর ফলে এই ব্যাকআপ তৈরির পরের সমস্ত নতুন ডেটা প্রতিস্থাপিত হতে পারে।
            </p>

            <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-100 space-y-1">
              <p className="font-semibold">⚠️ স্বয়ংক্রিয় প্রাক-পুনরুদ্ধার ব্যাকআপ:</p>
              <p>পুনরুদ্ধার শুরুর পূর্বে বর্তমান প্রোডাকশন ডেটাবেসের একটি স্বয়ংক্রিয় ব্যাকআপ তৈরি করে রাখা হবে।</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পুনরুদ্ধারের কারণ লিখুন:
              </label>
              <input
                type="text"
                value={restoreReason}
                onChange={(e) => setRestoreReason(e.target.value)}
                placeholder="যেমন: অনাকাঙ্ক্ষিত ডেটা বিকৃতি সমাধানকল্পে"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                নিশ্চিতকরণ বাক্যটি হুবহু লিখুন: <span className="font-mono text-red-600 select-all">RESTORE PRODUCTION DATABASE</span>
              </label>
              <input
                type="text"
                value={restoreConfirmText}
                onChange={(e) => setRestoreConfirmText(e.target.value)}
                placeholder="RESTORE PRODUCTION DATABASE"
                className="w-full text-sm font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBackupForRestore(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-50"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={restoring || restoreConfirmText !== "RESTORE PRODUCTION DATABASE" || restoreReason.trim().length < 5}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition"
              >
                {restoring ? "পুনরুদ্ধার করা হচ্ছে..." : "পুনরুদ্ধার কার্যকর করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: INCIDENTS */}
      {activeSubTab === "INCIDENTS" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">ইনসিডেন্ট ও বিভ্রাট ব্যবস্থাপনা</h2>
              <p className="text-slate-500 text-sm">
                সিস্টেম বিভ্রাট, ডেটাবেস সমস্যা, এবং অপারেশনাল ঘটনার আনুষ্ঠানিক ট্র্যাকিং ও সমাধান
              </p>
            </div>
            <button
              onClick={() => setShowIncidentModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow"
            >
              <Plus className="w-4 h-4" />
              নতুন ইনসিডেন্ট নথিভুক্ত করুন
            </button>
          </div>

          <div className="space-y-4">
            {incidents.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
                বর্তমানে কোনো উন্মুক্ত বা নথিভুক্ত ইনসিডেন্ট নেই।
              </div>
            ) : (
              incidents.map((inc) => (
                <div key={inc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">
                          {inc.incidentCode}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {inc.affectedService}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            inc.severity === "CRITICAL"
                              ? "bg-red-100 text-red-800"
                              : inc.severity === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 mt-1">{inc.title}</h3>
                    </div>
                    <div>{getStatusBadge(inc.status)}</div>
                  </div>

                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {inc.description}
                  </p>

                  {/* Timeline Events */}
                  {inc.events && inc.events.length > 0 && (
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase">টাইমলাইন অগ্রগতি:</p>
                      <div className="space-y-1.5 pl-2 border-l-2 border-indigo-200 text-xs text-slate-600">
                        {inc.events.map((ev: any) => (
                          <div key={ev.id} className="flex items-center justify-between">
                            <span>
                              <span className="font-semibold text-indigo-700">[{ev.eventType}]</span> {ev.description}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              {new Date(ev.timestamp).toLocaleTimeString("bn-BD")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Transition Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-400">
                      শনাক্ত: {new Date(inc.detectedAt).toLocaleString("bn-BD")}
                    </span>
                    <div className="flex items-center gap-2">
                      {inc.status === "OPEN" && (
                        <button
                          onClick={() => handleUpdateIncidentStatus(inc.id, "ACKNOWLEDGED")}
                          className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg"
                        >
                          স্বীকার করুন (Acknowledge)
                        </button>
                      )}
                      {inc.status === "ACKNOWLEDGED" && (
                        <button
                          onClick={() => handleUpdateIncidentStatus(inc.id, "INVESTIGATING")}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold rounded-lg"
                        >
                          তদন্ত শুরু (Investigating)
                        </button>
                      )}
                      {inc.status === "INVESTIGATING" && (
                        <button
                          onClick={() => handleUpdateIncidentStatus(inc.id, "MITIGATING")}
                          className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold rounded-lg"
                        >
                          প্রতিরোধ শুরু (Mitigating)
                        </button>
                      )}
                      {inc.status === "MITIGATING" && (
                        <button
                          onClick={() => handleUpdateIncidentStatus(inc.id, "RESOLVED")}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg"
                        >
                          সমাধান সম্পন্ন (Resolve)
                        </button>
                      )}
                      {inc.status === "RESOLVED" && (
                        <button
                          onClick={() => handleUpdateIncidentStatus(inc.id, "CLOSED")}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg"
                        >
                          বন্ধ করুন (Close)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CREATE INCIDENT MODAL */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateIncident}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-800">নতুন ইনসিডেন্ট নথিভুক্ত করুন</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">শিরোনাম:</label>
              <input
                type="text"
                required
                value={newIncident.title}
                onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                placeholder="যেমন: নোটিফিকেশন আউটবক্স ডেলিভারি ব্যর্থতা"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">তীব্রতা (Severity):</label>
                <select
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as any })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
                >
                  <option value="LOW">LOW (স্বল্প)</option>
                  <option value="MEDIUM">MEDIUM (মাঝারি)</option>
                  <option value="HIGH">HIGH (উচ্চ)</option>
                  <option value="CRITICAL">CRITICAL (জরুরি)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">প্রভাবিত পরিষেবা:</label>
                <select
                  value={newIncident.affectedService}
                  onChange={(e) => setNewIncident({ ...newIncident, affectedService: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
                >
                  <option value="APPLICATION">APPLICATION</option>
                  <option value="DATABASE">DATABASE</option>
                  <option value="STORAGE">STORAGE</option>
                  <option value="PAYMENTS">PAYMENTS</option>
                  <option value="NOTIFICATIONS">NOTIFICATIONS</option>
                  <option value="AUTHENTICATION">AUTHENTICATION</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">বিস্তারিত বিবরণ:</label>
              <textarea
                required
                rows={4}
                value={newIncident.description}
                onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                placeholder="সমস্যার লক্ষণ, পর্যবেক্ষণকৃত ল্যাটেন্সি বা এরর বার্তা উল্লেখ করুন..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowIncidentModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-50"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={submittingIncident}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition"
              >
                {submittingIncident ? "সংরক্ষণ হচ্ছে..." : "ইনসিডেন্ট তৈরি করুন"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 4: OPERATIONAL ALERTS */}
      {activeSubTab === "ALERTS" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">অপারেশনাল অ্যালার্ট সেন্টার</h2>
              <p className="text-slate-500 text-sm">
                ডুপ্লিকেশন ফিল্টারসহ সিস্টেম ও ইনফ্রাস্ট্রাকচার সতর্কতা পর্যবেক্ষণ
              </p>
            </div>
            <button
              onClick={fetchAlerts}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              রিফ্রেশ
            </button>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
                বর্তমানে কোনো সক্রিয় অ্যালার্ট নেই। সকল পরিষেবা স্বাভাবিক।
              </div>
            ) : (
              alerts.map((al) => (
                <div
                  key={al.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    al.severity === "CRITICAL"
                      ? "bg-red-50/50 border-red-200 text-red-900"
                      : al.severity === "WARNING"
                      ? "bg-amber-50/50 border-amber-200 text-amber-900"
                      : "bg-blue-50/50 border-blue-200 text-blue-900"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 mt-0.5 opacity-80" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{al.title}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/70">
                          বারবার ঘটেছে: {al.occurrenceCount} বার
                        </span>
                        <span className="text-[11px] uppercase font-semibold px-2 py-0.5 rounded bg-white/70">
                          {al.source}
                        </span>
                      </div>
                      <p className="text-xs opacity-90 mt-1">{al.description}</p>
                      <p className="text-[11px] opacity-75 mt-1">
                        সর্বশেষ সক্রিয়: {new Date(al.lastTriggeredAt).toLocaleString("bn-BD")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {al.status === "ACTIVE" && (
                      <button
                        onClick={() => handleAcknowledgeAlert(al.id)}
                        className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg shadow-sm border border-slate-200"
                      >
                        স্বীকার করুন
                      </button>
                    )}
                    {al.status !== "RESOLVED" && (
                      <button
                        onClick={() => handleResolveAlert(al.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        সমাধান সম্পন্ন
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: MAINTENANCE & DISASTER RECOVERY */}
      {activeSubTab === "MAINTENANCE" && (
        <div className="space-y-6">
          {/* Maintenance Mode Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">জরুরি রক্ষণাবেক্ষণ মোড (Maintenance Mode)</h3>
                <p className="text-slate-500 text-sm">
                  সক্রিয় থাকাকালীন সাধারণ ব্যবহারকারীরা রক্ষণাবেক্ষণ বার্তা দেখবেন, তবে অ্যাডমিন এক্সেস সংরক্ষিত থাকবে
                </p>
              </div>
              <div>{health?.maintenance.isActive ? getStatusBadge("WARNING") : getStatusBadge("HEALTHY")}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">রক্ষণাবেক্ষণের কারণ ও বার্তা:</label>
              <input
                type="text"
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                placeholder="যেমন: সার্ভার সফটওয়্যার আপডেট ও সিকিউরিটি প্যাচ ইনস্টলেশন"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
              />
              <div className="flex items-center gap-3">
                {health?.maintenance.isActive ? (
                  <button
                    onClick={() => handleToggleMaintenance(false)}
                    disabled={updatingMaintenance}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
                  >
                    রক্ষণাবেক্ষণ মোড বন্ধ করুন
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleMaintenance(true)}
                    disabled={updatingMaintenance}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl"
                  >
                    রক্ষণাবেক্ষণ মোড চালু করুন
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Disaster Recovery Specifications */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800">ডিজাস্টার রিকভারি স্ট্যান্ডার্ড ও মেট্রিক্স</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-900 uppercase">RPO (Recovery Point Objective)</p>
                <p className="text-2xl font-bold text-indigo-950 mt-1">সর্বোচ্চ ২৪ ঘণ্টা</p>
                <p className="text-xs text-indigo-700 mt-1">দৈনিক স্বয়ংক্রিয় ব্যাকআপ ও প্রি-রিস্টোর ব্যাকআপ দ্বারা সুরক্ষিত।</p>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-900 uppercase">RTO (Recovery Time Objective)</p>
                <p className="text-2xl font-bold text-emerald-950 mt-1">&lt; ৬০ সেকেন্ড</p>
                <p className="text-xs text-emerald-700 mt-1">আইসোলেটেড রিকভারি ড্রিল ও দ্রুত প্রতিস্থাপন প্রক্রিয়ায় পরীক্ষিত।</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-2">
              <p className="font-semibold text-slate-800">নথিভুক্ত পুনরুদ্ধার পরিস্থিতি (Scenarios A–J):</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="font-medium">Scenario A (Database Failure):</span> প্রাক-যাচাইকৃত ব্যাকআপ ফাইল প্রতিস্থাপনের মাধ্যমে পুনরুদ্ধার।</li>
                <li><span className="font-medium">Scenario B (Accidental Modification):</span> প্রি-রিস্টোর ব্যাকআপ পয়েন্ট হতে রোলব্যাক সক্ষমতা।</li>
                <li><span className="font-medium">Scenario C (Storage Failure):</span> public/uploads ও ব্যাকআপ ফোল্ডারের স্বাধীন স্টোরেজ সেগ্রিগেশন।</li>
                <li><span className="font-medium">Scenario D (Notification Outbox Jam):</span> স্টাক হওয়া বার্তার স্বয়ংক্রিয় পুনঃপ্রেরণ ও ব্যর্থতা আইসোলেশন।</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
