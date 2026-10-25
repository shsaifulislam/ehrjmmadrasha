"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  QrCode,
  Fingerprint,
  Camera,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Send,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  User,
  ShieldCheck,
  Sparkles,
  Smartphone,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
} from "lucide-react";

interface RecentScan {
  id: string;
  studentId: string;
  studentIdNumber: string;
  studentName: string;
  photoUrl?: string | null;
  className: string;
  sectionName?: string | null;
  rollNumber?: number | null;
  scanType: "CHECK_IN" | "CHECK_OUT";
  method: string;
  status: string;
  smsSent: boolean;
  time: string;
  timestamp: string;
}

interface ScanStats {
  checkInCount: number;
  checkOutCount: number;
  onTimeCount: number;
  lateCount: number;
  smsCount: number;
  totalScansToday: number;
}

export default function DigitalAttendanceKiosk() {
  const [activeTab, setActiveTab] = useState<"QR" | "FINGERPRINT" | "FACE" | "PIN">("QR");
  const [scanTypeMode, setScanTypeMode] = useState<"AUTO" | "CHECK_IN" | "CHECK_OUT">("AUTO");
  const [identifierInput, setIdentifierInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Kiosk Stats & Logs
  const [stats, setStats] = useState<ScanStats>({
    checkInCount: 0,
    checkOutCount: 0,
    onTimeCount: 0,
    lateCount: 0,
    smsCount: 0,
    totalScansToday: 0,
  });
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [currentSessionName, setCurrentSessionName] = useState("চলতি শিক্ষাবর্ষ");

  // Latest Scan Result
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    isDuplicate?: boolean;
    scanType?: "CHECK_IN" | "CHECK_OUT";
    method?: string;
    statusTextBn?: string;
    student?: {
      id: string;
      studentIdNumber: string;
      fullNameBn: string;
      photoUrl?: string | null;
      className: string;
      rollNumber?: number | null;
      guardianPhone?: string | null;
    };
    time?: string;
    sms?: {
      sent: boolean;
      destination?: string | null;
      messageText?: string;
    };
    message?: string;
    error?: string;
  } | null>(null);

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const kioskContainerRef = useRef<HTMLDivElement | null>(null);

  // Audio Chime Synthesizer using Web Audio API
  const playSound = useCallback(
    (type: "SUCCESS" | "WARNING" | "BEEP") => {
      if (!soundEnabled) return;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();

        if (type === "SUCCESS") {
          // Pleasant high chime chord: C5 -> E5 -> G5
          const now = ctx.currentTime;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = "sine";
          osc2.type = "triangle";

          osc1.frequency.setValueAtTime(523.25, now); // C5
          osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
          osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5

          osc2.frequency.setValueAtTime(659.25, now);
          osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2); // C6

          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.5);
          osc2.stop(now + 0.5);
        } else if (type === "WARNING") {
          // Low warning buzzer
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.setValueAtTime(180, now + 0.15);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.4);
        } else {
          // Simple short tick
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(800, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.09);
        }
      } catch (err) {
        console.warn("Audio playback not allowed:", err);
      }
    },
    [soundEnabled]
  );

  // Fetch initial stats and recent scans
  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/scan");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setRecentScans(data.recentScans);
          if (data.sessionName) setCurrentSessionName(data.sessionName);
        }
      }
    } catch (err) {
      console.error("Failed to fetch scan feed:", err);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 8000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  // Handle Camera Stream for QR and Face modes
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (activeTab === "QR" || activeTab === "FACE") {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
          setCameraActive(true);
          setCameraError(null);
        })
        .catch((err) => {
          console.warn("Camera access unavailable:", err);
          setCameraActive(false);
          setCameraError("ওয়েবক্যাম সনাক্ত করা যায়নি। আপনি ম্যানুয়াল কোড বা বারকোড স্ক্যানার ব্যবহার করতে পারেন।");
        });
    } else {
      setCameraActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [activeTab]);

  // Global listener for USB Barcode / QR Scanners
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is manually typing inside input elements
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      const currentTime = Date.now();
      // Hardware barcode scanners send keystrokes extremely rapidly (< 50ms)
      if (currentTime - lastKeyTime > 150) {
        buffer = "";
      }
      lastKeyTime = currentTime;

      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          executeScan(buffer.trim(), "QR_CODE");
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scanTypeMode]);

  // Execute scan request to API
  const executeScan = async (identifier: string, method: string) => {
    if (!identifier || identifier.trim() === "" || isProcessing) return;

    try {
      setIsProcessing(true);
      playSound("BEEP");

      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          scanType: scanTypeMode,
          method,
          deviceUid: "MAIN_GATE_TERMINAL_1",
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.isDuplicate) {
          playSound("WARNING");
        } else {
          playSound("SUCCESS");
        }
        setLastResult(data);
        setIdentifierInput("");
        fetchFeed();
      } else {
        playSound("WARNING");
        setLastResult({
          success: false,
          error: data.error || "শিক্ষার্থী খুঁজে পাওয়া যায়নি।",
        });
      }
    } catch (err: any) {
      playSound("WARNING");
      setLastResult({
        success: false,
        error: "সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      kioskContainerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={kioskContainerRef}
      className="min-h-screen bg-[#07130F] text-white flex flex-col font-sans select-none antialiased"
    >
      {/* 1. Header Toolbar */}
      <header className="bg-[#0B1E17] border-b border-[#1A382C] px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0D5C3A] to-[#15803D] flex items-center justify-center shadow-md border border-[#276F4B]">
            <QrCode className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white sm:text-base">
                ডিজিটাল বায়োমেট্রিক ও কিউআর হাজিরা টার্মিনাল
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                লাইভ গেটওয়ে
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা • {currentSessionName}
            </p>
          </div>
        </div>

        {/* Scan Mode & System Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Scan Type Filter */}
          <div className="bg-[#07130F] p-1 rounded-lg border border-[#1E4335] flex items-center text-xs">
            <button
              type="button"
              onClick={() => setScanTypeMode("AUTO")}
              className={`px-2.5 py-1 rounded-md font-medium transition text-[11px] ${
                scanTypeMode === "AUTO"
                  ? "bg-[#0D5C3A] text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              স্বয়ংক্রিয় (Auto)
            </button>
            <button
              type="button"
              onClick={() => setScanTypeMode("CHECK_IN")}
              className={`px-2.5 py-1 rounded-md font-medium transition text-[11px] flex items-center gap-1 ${
                scanTypeMode === "CHECK_IN"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ArrowDownLeft className="w-3 h-3" />
              আগমন
            </button>
            <button
              type="button"
              onClick={() => setScanTypeMode("CHECK_OUT")}
              className={`px-2.5 py-1 rounded-md font-medium transition text-[11px] flex items-center gap-1 ${
                scanTypeMode === "CHECK_OUT"
                  ? "bg-amber-700 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              প্রস্থান
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-[#0E281F] hover:bg-[#15382B] text-gray-300 border border-[#1A4533] transition"
            title={soundEnabled ? "শব্দ বন্ধ করুন" : "শব্দ চালু করুন"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#0E281F] hover:bg-[#15382B] text-gray-300 border border-[#1A4533] transition"
            title="ফুলস্ক্রিন টার্মিনাল মোড"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Return to Admin Link */}
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-lg bg-[#143226] hover:bg-[#1B4232] text-xs font-semibold text-emerald-300 border border-[#235641] transition flex items-center gap-1"
          >
            <span>ড্যাশবোর্ড</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. Real-time KPI Stats Banner */}
      <div className="bg-[#0A1913] border-b border-[#142C22] px-4 py-2.5 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
        <div className="bg-[#0D241C] p-2 rounded-lg border border-[#1B4031]">
          <span className="text-[11px] text-gray-400 block">আজকের মোট আগমন</span>
          <span className="text-lg font-bold font-mono text-emerald-400">{stats.checkInCount} জন</span>
        </div>
        <div className="bg-[#0D241C] p-2 rounded-lg border border-[#1B4031]">
          <span className="text-[11px] text-gray-400 block">আজকের মোট প্রস্থান</span>
          <span className="text-lg font-bold font-mono text-amber-400">{stats.checkOutCount} জন</span>
        </div>
        <div className="bg-[#0D241C] p-2 rounded-lg border border-[#1B4031]">
          <span className="text-[11px] text-gray-400 block">সময়মতো উপস্থিত</span>
          <span className="text-lg font-bold font-mono text-emerald-300">{stats.onTimeCount} জন</span>
        </div>
        <div className="bg-[#0D241C] p-2 rounded-lg border border-[#1B4031]">
          <span className="text-[11px] text-gray-400 block">বিলম্বিত (Late)</span>
          <span className="text-lg font-bold font-mono text-rose-400">{stats.lateCount} জন</span>
        </div>
        <div className="bg-[#0D241C] p-2 rounded-lg border border-[#1B4031] col-span-2 sm:col-span-1">
          <span className="text-[11px] text-gray-400 block">অভিভাবক SMS প্রেরিত</span>
          <span className="text-lg font-bold font-mono text-sky-400">{stats.smsCount} টি</span>
        </div>
      </div>

      {/* 3. Main Kiosk Body */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto w-full">
        {/* Left Column: Scanner Terminal Modes & Interactive Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Method Tabs */}
          <div className="grid grid-cols-4 gap-2 bg-[#0B1E17] p-1.5 rounded-xl border border-[#1A382C]">
            <button
              type="button"
              onClick={() => setActiveTab("QR")}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 ${
                activeTab === "QR"
                  ? "bg-[#0D5C3A] text-white shadow-md border border-[#276F4B]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>আইডি কার্ড QR</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("FINGERPRINT")}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 ${
                activeTab === "FINGERPRINT"
                  ? "bg-[#0D5C3A] text-white shadow-md border border-[#276F4B]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Fingerprint className="w-4 h-4" />
              <span>ফিঙ্গারপ্রিন্ট</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("FACE")}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 ${
                activeTab === "FACE"
                  ? "bg-[#0D5C3A] text-white shadow-md border border-[#276F4B]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>ফেস স্ক্যান</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("PIN")}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 ${
                activeTab === "PIN"
                  ? "bg-[#0D5C3A] text-white shadow-md border border-[#276F4B]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>ম্যানুয়াল কোড</span>
            </button>
          </div>

          {/* Interactive Scanning Viewport */}
          <div className="bg-[#0B1E17] rounded-2xl border border-[#1A382C] p-5 flex flex-col items-center justify-center relative min-h-[380px] shadow-2xl overflow-hidden">
            {/* Background scanner grid lines */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {/* TAB 1: QR CODE / BARCODE SCANNER */}
            {activeTab === "QR" && (
              <div className="flex flex-col items-center w-full max-w-md text-center space-y-4">
                <div className="relative w-64 h-64 rounded-2xl border-2 border-emerald-500/70 overflow-hidden bg-black/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center justify-center">
                  {cameraActive ? (
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-500 p-4">
                      <QrCode className="w-16 h-16 text-emerald-500/40 mb-2 animate-pulse" />
                      <span className="text-xs">স্ক্যানার অপটিক্যাল রেডি</span>
                    </div>
                  )}

                  {/* Laser Beam Scanner Line Animation */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-[0_0_12px_#34D399]" />

                  {/* Corner Targets */}
                  <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-emerald-400" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-emerald-300">শিক্ষার্থী আইডি কার্ডের QR কোডটি সামনে ধরুন</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    USB বারকোড স্ক্যানার বা গেট স্ক্যানার ডিভাইস সক্রিয় আছে। কার্ড স্ক্যান করলেই স্বয়ংক্রিয় এসএমএস যাবে।
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: BIOMETRIC FINGERPRINT SCANNER */}
            {activeTab === "FINGERPRINT" && (
              <div className="flex flex-col items-center w-full max-w-md text-center space-y-5">
                <div className="relative w-48 h-48 rounded-full border-2 border-emerald-500/60 bg-[#061811] flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.25)] group">
                  <div className="absolute inset-2 rounded-full border border-emerald-500/30 animate-ping opacity-25" />
                  <Fingerprint className="w-24 h-24 text-emerald-400 group-hover:scale-110 transition duration-300 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-emerald-300">বায়োমেট্রিক ফিঙ্গারপ্রিন্ট সেন্সরে আঙুল রাখুন</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    USB ফিঙ্গারপ্রিন্ট রিডার (ZK/DigitalPersona) গেটওয়ে সক্রিয়। ফিঙ্গার স্পর্শ করলেই স্বয়ংক্রিয় ভেরিফিকেশন হবে।
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: FACIAL RECOGNITION */}
            {activeTab === "FACE" && (
              <div className="flex flex-col items-center w-full max-w-md text-center space-y-4">
                <div className="relative w-64 h-64 rounded-2xl border-2 border-sky-500/70 overflow-hidden bg-black/40 shadow-[0_0_30px_rgba(56,189,248,0.2)] flex items-center justify-center">
                  {cameraActive ? (
                    <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-500 p-4">
                      <Camera className="w-16 h-16 text-sky-500/40 mb-2 animate-pulse" />
                      <span className="text-xs">ক্যামেরা ভিউ সক্রিয় হচ্ছে...</span>
                    </div>
                  )}

                  {/* Oval face framing reticle */}
                  <div className="absolute w-40 h-52 border-2 border-dashed border-sky-400/80 rounded-[50%] animate-pulse" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-sky-300">মুখমণ্ডল ফ্রেমের ভেতরে সোজা রাখুন</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    এআই ফেস রিকগনিশন গেট ক্যামেরা শিক্ষার্থীকে সনাক্ত করে স্বয়ংক্রিয় হাজিরা রেকর্ড ও এসএমএস পাঠাবে।
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: MANUAL PIN / ID NUMBER ENTRY */}
            {activeTab === "PIN" && (
              <div className="w-full max-w-sm space-y-4">
                <div className="text-center">
                  <h3 className="text-sm font-bold text-emerald-300">শিক্ষার্থী আইডি বা রোল নম্বর প্রবেশ করান</h3>
                  <p className="text-xs text-gray-400 mt-0.5">উদাহরণ: EHRJ-000001 অথবা শুধু 000001</p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    executeScan(identifierInput, "PIN_ENTRY");
                  }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={identifierInput}
                      onChange={(e) => setIdentifierInput(e.target.value)}
                      placeholder="আইডি বা জন্ম নিবন্ধন নম্বর..."
                      autoFocus
                      className="w-full bg-[#061811] border-2 border-emerald-600 rounded-xl px-4 py-3 text-emerald-200 placeholder-gray-500 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <button
                      type="submit"
                      disabled={isProcessing || !identifierInput.trim()}
                      className="absolute right-2 top-2 bottom-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>সাবমিট</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Interactive keypad for touchscreen kiosk */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map((btn) => (
                      <button
                        key={btn}
                        type="button"
                        onClick={() => {
                          if (btn === "C") {
                            setIdentifierInput("");
                          } else if (btn === "OK") {
                            executeScan(identifierInput, "PIN_ENTRY");
                          } else {
                            setIdentifierInput((prev) => prev + btn);
                          }
                        }}
                        className={`py-3 rounded-xl font-bold font-mono text-sm transition ${
                          btn === "OK"
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : btn === "C"
                            ? "bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800"
                            : "bg-[#0E291F] hover:bg-[#153D2E] text-emerald-100 border border-[#1A4533]"
                        }`}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                </form>
              </div>
            )}

            {/* Quick Test Bar for Demo / Gate Operator */}
            <div className="mt-4 pt-3 border-t border-[#163327] w-full flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                গেটওয়ে সক্রিয় (Terminal ID: GATE_1)
              </span>
              <div className="flex items-center gap-1.5">
                <span>দ্রুত টেস্ট আইডি:</span>
                <button
                  type="button"
                  onClick={() => executeScan("EHRJ-000001", "QR_CODE")}
                  className="px-2 py-0.5 rounded bg-[#102B20] text-emerald-300 hover:bg-emerald-800 border border-emerald-700/50 font-mono transition"
                >
                  EHRJ-000001
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scan Result Card & Real-time Live Log Feed (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Last Result Confirmation Card */}
          <div className="bg-[#0B1E17] rounded-2xl border border-[#1A382C] p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1A382C] pb-2.5 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                সর্বশেষ স্ক্যান ভেরিফিকেশন কার্ড
              </h2>
              {lastResult && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    lastResult.success
                      ? lastResult.scanType === "CHECK_IN"
                        ? "bg-emerald-900 text-emerald-200 border border-emerald-700"
                        : "bg-amber-900 text-amber-200 border border-amber-700"
                      : "bg-rose-900 text-rose-200 border border-rose-700"
                  }`}
                >
                  {lastResult.success
                    ? lastResult.scanType === "CHECK_IN"
                      ? "আগমন রেকর্ড"
                      : "প্রস্থান রেকর্ড"
                    : "ব্যর্থ"}
                </span>
              )}
            </div>

            {lastResult?.success && lastResult.student ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-[#07130F] border-2 border-emerald-500 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md">
                    {lastResult.student.photoUrl ? (
                      <img
                        src={lastResult.student.photoUrl}
                        alt={lastResult.student.fullNameBn}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white truncate">
                      {lastResult.student.fullNameBn}
                    </h3>
                    <div className="text-xs text-emerald-400 font-mono">
                      আইডি: {lastResult.student.studentIdNumber} • রোল: {lastResult.student.rollNumber || "—"}
                    </div>
                    <div className="text-xs text-gray-400">
                      জামাত: {lastResult.student.className}
                    </div>
                  </div>
                </div>

                {/* Status & Time Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#07130F] p-2 rounded-lg border border-[#1A382C]">
                    <span className="text-[10px] text-gray-400 block">স্ট্যাটাস</span>
                    <span className="font-bold text-emerald-300">{lastResult.statusTextBn || "গৃহীত"}</span>
                  </div>
                  <div className="bg-[#07130F] p-2 rounded-lg border border-[#1A382C]">
                    <span className="text-[10px] text-gray-400 block">সময়</span>
                    <span className="font-bold font-mono text-white">{lastResult.time}</span>
                  </div>
                </div>

                {/* SMS Notification Banner */}
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                    lastResult.sms?.sent
                      ? "bg-emerald-950/70 border-emerald-700/80 text-emerald-200"
                      : lastResult.isDuplicate
                      ? "bg-blue-950/70 border-blue-700/80 text-blue-200"
                      : "bg-amber-950/60 border-amber-800/80 text-amber-200"
                  }`}
                >
                  <Smartphone className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                  <div className="flex-1">
                    <div className="font-bold">
                      {lastResult.sms?.sent
                        ? "অভিভাবকের মোবাইলে এসএমএস পাঠানো হয়েছে"
                        : lastResult.isDuplicate
                        ? "ইতিপূর্বেই হাজিরা নথিভুক্ত এবং অভিভাবককে এসএমএস পাঠানো হয়েছে"
                        : "এসএমএস প্রেরণে বিলম্ব বা নম্বর অনুপস্থিত"}
                    </div>
                    <div className="text-[11px] text-gray-300 mt-0.5">
                      {lastResult.sms?.destination
                        ? `মোবাইল: ${lastResult.sms.destination}`
                        : "অভিভাবকের সক্রিয় ফোন নম্বর নেই"}
                    </div>
                  </div>
                </div>

                {lastResult.message && (
                  <p className="text-[11px] text-gray-400 italic bg-[#07130F] p-2 rounded-lg border border-[#163024]">
                    {lastResult.message}
                  </p>
                )}
              </div>
            ) : lastResult?.error ? (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                <h4 className="text-sm font-bold text-rose-200">স্ক্যান অসম্পূর্ণ বা ত্রুটি</h4>
                <p className="text-xs text-rose-300">{lastResult.error}</p>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500 space-y-2">
                <QrCode className="w-12 h-12 text-gray-600 mx-auto" />
                <p className="text-xs">হাজিরা গ্রহণের সাথে সাথে ছাত্রের প্রোফাইল ও এসএমএস স্ট্যাটাস এখানে প্রদর্শিত হবে।</p>
              </div>
            )}
          </div>

          {/* Today's Live Recent Scan Feed */}
          <div className="bg-[#0B1E17] rounded-2xl border border-[#1A382C] p-4 flex-1 flex flex-col shadow-xl min-h-[300px]">
            <div className="flex items-center justify-between border-b border-[#1A382C] pb-2.5 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                আজকের তাৎক্ষণিক স্ক্যান রেকর্ড ({recentScans.length})
              </h2>
              <button
                type="button"
                onClick={fetchFeed}
                className="p-1 rounded-md hover:bg-[#143226] text-gray-400 hover:text-emerald-300 transition"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[350px] space-y-2 pr-1">
              {recentScans.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-500">
                  আজকে এখনও কোনো ডিজিটাল স্ক্যান সম্পন্ন হয়নি।
                </div>
              ) : (
                recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="p-2.5 rounded-xl bg-[#07130F] border border-[#163327] hover:border-emerald-700/60 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#0E281F] border border-[#1E4D38] flex items-center justify-center font-bold text-[11px] text-emerald-300 flex-shrink-0">
                        {scan.rollNumber || "•"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{scan.studentName}</div>
                        <div className="text-[10px] text-gray-400">
                          {scan.className} • {scan.time}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          scan.scanType === "CHECK_IN"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}
                      >
                        {scan.scanType === "CHECK_IN" ? "আগমন" : "প্রস্থান"}
                      </span>

                      {scan.smsSent ? (
                        <span className="p-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800" title="এসএমএস পাঠানো হয়েছে">
                          <CheckCircle2 className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="p-1 rounded-full bg-gray-900 text-gray-500 border border-gray-800" title="এসএমএস অনির্দিষ্ট">
                          <AlertCircle className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 4. Footer Status Bar */}
      <footer className="bg-[#06120E] border-t border-[#132A20] px-4 py-2 text-[11px] text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>ডিজিটাল বায়োমেট্রিক হাজিরা ও অটোমেটেড এসএমএস সার্ভার প্রস্তুত।</span>
        </div>
        <div>
          <span>ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা ম্যানেজমেন্ট সিস্টেম © ২০২৬</span>
        </div>
      </footer>
    </div>
  );
}
