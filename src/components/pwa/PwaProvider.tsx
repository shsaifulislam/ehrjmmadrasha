"use client";

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, Download, X } from "lucide-react";
import { flushSyncQueueToServer, getSyncQueue } from "@/lib/pwa/syncQueue";

export default function PwaProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    // 1. Initial online status
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      updatePendingCount();

      // Service Worker Registration
      if ("serviceWorker" in navigator) {
        if (process.env.NODE_ENV === "production") {
          navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => {
              console.log("EHRJ Service Worker registered:", reg.scope);
            })
            .catch((err) => {
              console.warn("Service Worker registration failed:", err);
            });
        } else {
          // In development mode, ensure any stale EHRJ service worker is unregistered
          // and EHRJ caches are cleared to prevent stale chunk caching and Webpack runtime TypeErrors
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              const swUrl =
                registration.active?.scriptURL ||
                registration.waiting?.scriptURL ||
                registration.installing?.scriptURL ||
                "";
              if (swUrl.endsWith("/sw.js") || swUrl.includes("/sw.js")) {
                registration.unregister();
              }
            }
          });
          if (typeof caches !== "undefined") {
            caches.keys().then((keys) => {
              for (const key of keys) {
                if (key.startsWith("ehrj-")) {
                  caches.delete(key);
                }
              }
            });
          }
        }
      }

      // Event Listeners for Network changes
      const handleOnline = async () => {
        setIsOnline(true);
        setSyncStatusMsg("ইন্টারনেট ফিরে এসেছে — অফলাইন কাজ সিঙ্ক হচ্ছে...");
        setSyncing(true);
        try {
          const res = await flushSyncQueueToServer();
          if (res.processed > 0) {
            setSyncStatusMsg(`${res.succeeded}টি কাজ সফলভাবে সার্ভারে সিঙ্ক হয়েছে।`);
          } else {
            setSyncStatusMsg(null);
          }
          updatePendingCount();
        } catch (e) {
          console.error(e);
        } finally {
          setSyncing(false);
          setTimeout(() => setSyncStatusMsg(null), 4000);
        }
      };

      const handleOffline = () => {
        setIsOnline(false);
        setSyncStatusMsg("ইন্টারনেট নেই — অফলাইন মোড সক্রিয়। ড্রাফট সুরক্ষিত রয়েছে।");
        updatePendingCount();
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // PWA Install prompt listener
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e);
        setShowInstallBanner(true);
      };
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  const updatePendingCount = () => {
    const queue = getSyncQueue();
    const count = queue.filter((i) => i.status === "PENDING_SYNC" || i.status === "SYNC_FAILED").length;
    setPendingSyncCount(count);
  };

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the EHRJ PWA prompt");
        }
        setInstallPrompt(null);
        setShowInstallBanner(false);
      });
    }
  };

  return (
    <>
      {/* 1. Offline & Sync Status Banner */}
      {(!isOnline || syncStatusMsg || pendingSyncCount > 0) && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 text-xs py-2 px-4 flex items-center justify-between shadow-md transition ${
            !isOnline
              ? "bg-amber-600 text-white"
              : syncing
              ? "bg-blue-600 text-white"
              : "bg-emerald-700 text-white"
          }`}
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            {!isOnline ? (
              <WifiOff className="w-4 h-4 flex-shrink-0" />
            ) : syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              <Wifi className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="font-medium">
              {syncStatusMsg ||
                (!isOnline
                  ? "ইন্টারনেট বিচ্ছিন্ন। অফলাইন মোড সক্রিয় (ড্রাফট সুরক্ষিত)।"
                  : pendingSyncCount > 0
                  ? `${pendingSyncCount}টি ড্রাফট সিঙ্ক হওয়ার অপেক্ষায় আছে।`
                  : "অনলাইন মোড সক্রিয়")}
            </span>
          </div>
        </div>
      )}

      {/* 2. PWA Install Prompt Banner (Mobile Friendly) */}
      {showInstallBanner && (
        <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-40 bg-white border-2 border-[#0D5C3A] p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 max-w-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0D5C3A] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              EHRJ
            </div>
            <div>
              <div className="font-bold text-gray-900 text-xs">মাদরাসা অ্যাপ ইনস্টল করুন</div>
              <div className="text-[11px] text-gray-500">হোম স্ক্রিন থেকে সহজে ব্যবহার করুন</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleInstallClick}
              className="bg-[#0D5C3A] hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              ইনস্টল
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
