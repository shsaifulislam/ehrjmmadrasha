# EHRJ MADRASHA ERP — PHASE 23
## DIGITAL EXPERIENCE, PWA, MOBILE APP & OFFLINE-FIRST ENGINE

**ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (EHRJ Madrasha)**  
**Checkpoint ID:** `EHRJ-AI-2026-PHASE23`

---

## 1. Executive Summary

Phase 23 establishes a mobile-first digital experience, installable Progressive Web App (PWA), network-resilient offline caching, and a robust offline-to-online sync queue with idempotency and conflict detection across all roles: Public, Guardian, Teacher, and Admin.

### Core Non-Negotiable Invariants:
1. **MOBILE-FIRST, NOT MOBILE-AFTERTHOUGHT.**
2. **SERVER IS THE SOURCE OF TRUTH.** Server timestamps override client device clocks.
3. **OFFLINE DATA IS TEMPORARY UNTIL SERVER CONFIRMATION.**
4. **NO OFFLINE FINANCIAL OR RESULT FINALIZATION.** Financial payments, waivers, refunds, and result publication strictly require live, authorized server confirmation.
5. **SYNC IDEMPOTENCY:** Every offline mutation carries a canonical operation ID (`EHRJ-SYNC-YYYY-XXXXXX`) to prevent duplicate processing on retries.
6. **NO SILENT OVERWRITES:** Sync conflicts are flagged for review (`CONFLICT_REQUIRES_REVIEW`) rather than silently corrupting server records.
7. **PWA DOES NOT WEAKEN AUTHENTICATION:** All backend authorization and role checks remain mandatory.

---

## 2. PWA Architecture

- **Manifest:** [`public/manifest.json`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/public/manifest.json)
  - Display: `standalone`
  - Orientation: `portrait-primary`
  - Theme Color: `#0D5C3A`
  - Background Color: `#F9F8F3`
  - High-resolution icons: `192x192` and `512x512` (maskable)
  - Quick App Shortcuts: Portal, Teacher Attendance, Notices, Search.
- **Service Worker:** [`public/sw.js`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/public/sw.js)
  - Version: `ehrj-pwa-v1.0.0`
  - App Shell precaching: `/`, `/offline.html`, `/manifest.json`, `/images/logo.jpg`, `/search`.
  - Cache Invalidation: Automatic cleanup of old caches during activation, plus `CLEAR_PRIVATE_CACHE` message handler on user logout.
- **Client Provider:** [`src/components/pwa/PwaProvider.tsx`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/components/pwa/PwaProvider.tsx)
  - Service worker registration.
  - Real-time network detection (`online` / `offline` event listeners).
  - Floating network state banner and PWA install prompt.
  - Automatic background sync flushing when network is restored.

---

## 3. Caching & Offline Capability Matrix

| Tier / Feature | Strategy | Offline Behavior |
|---|---|---|
| **App Shell & Assets** | Cache-First | Fully offline-accessible from local cache. |
| **Public Notices & FAQs** | Stale-While-Revalidate | Cached versions displayed; revalidated in background when online. |
| **Navigation Requests** | Network-First with Cache Fallback | If offline and uncached, gracefully serves `offline.html`. |
| **Teacher Attendance** | Offline-Assisted | Allows marking Present/Absent; saved to client sync queue as `PENDING_SYNC`. Synced automatically on reconnect. |
| **Helpdesk Ticket** | Offline-Assisted | Draft ticket saved in local sync queue; synced upon network reconnection. |
| **Finance / Fees / Payments** | **Strictly Online-Only** | Offline finalization blocked. Requires live server validation and gateway confirmation. |
| **Results & Exams** | **Strictly Online-Only** | Marksheet generation and result publication prohibited offline. |
| **Security / Role Ops** | **Strictly Online-Only** | Password reset, role change, and admin actions blocked offline. |

---

## 4. Sync & Conflict Resolution Engine

```
Teacher marks attendance offline
         ↓
Local Queue: PENDING_SYNC
(Generated: EHRJ-SYNC-2026-ATT-XXXXXX)
         ↓
Network Restored (window.online)
         ↓
flushSyncQueueToServer() → POST /api/sync/process
         ↓
Server Checks:
1. Valid Session & RBAC
2. Idempotency Check in synced_operations.json
3. Conflict Check (Server lastUpdated vs. clientCreatedAt)
         ↓
[If Conflict]: HTTP 409 Conflict → Status: CONFLICT_REQUIRES_REVIEW
[If Succeeded]: Prisma Upsert → Status: SYNCED
```

---

## 5. Mobile-First UX Polish

- **Role-Aware Bottom Navigation:** [`src/components/mobile/MobileBottomNav.tsx`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/components/mobile/MobileBottomNav.tsx)
  - Mobile bottom navigation bar displayed on `< md` screens.
  - Displays tailored shortcuts based on whether user is Guardian, Teacher, Admin, or Public.
  - Touch targets $\ge 44 \times 44$ px with safe area padding (`pb-safe`).
- **Touch-Friendly Controls:** Quick "সকল উপস্থিত" (Mark All Present) button for teachers, large toggle chips, and clear status banners.
- **Offline Banner:** Unobtrusive banner indicating offline mode or syncing progress.
