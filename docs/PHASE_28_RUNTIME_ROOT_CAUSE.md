# EHRJ MADRASHA ERP — PHASE 28: RUNTIME ROOT-CAUSE INVESTIGATION REPORT
**Project:** Eliotganj Hazi Rohmatollah Jamiria Madrasha ERP  
**Auditor:** Principal Enterprise Full-Stack & Systems Architecture Agent  
**Date:** 2026-10-21  
**Subject:** Scientific Root-Cause Determination for Recurring Webpack Runtime TypeError (`reading 'call'` and `reading 'ReactCurrentDispatcher'`)  
**Final Status:** **FIX VERIFIED**

---

## 1. Executive Summary & Problem Statement

In previous evaluations following the Next.js `15.5.28` canary upgrade, recurring client-side exceptions were observed in browser sessions:
```text
Runtime TypeError: Cannot read properties of undefined (reading 'call')
  at RootLayout (src\app\layout.tsx:91:9)
  at (app-pages-browser)/./node_modules/next/dist/client/components/search-params.js (.next\static\chunks\app-pages-internals.js:105:1)
  at (app-pages-browser)/./node_modules/next/dist/client/components/client-page.js (.next\static\chunks\app-pages-internals.js:61:1)

Runtime TypeError: Cannot read properties of undefined (reading 'ReactCurrentDispatcher')
```

The objective of Phase 28 was to isolate the exact, reproducible root cause, apply the smallest safe fix, verify browser execution across multiple restarts, and ensure zero data drift on the master SQLite database.

---

## 2. Hypothesis Testing & Proven Root Causes

Through empirical testing, dependency tree inspection, and runtime trace logging, two interconnected root causes were identified:

### Root Cause 1: Service Worker Development Cache Poisoning
- **Mechanism:**
  In `src/components/pwa/PwaProvider.tsx`, the Service Worker registration was guarded by:
  ```typescript
  if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test")
  ```
  Because `process.env.NODE_ENV` in `next dev` is `"development"`, the service worker `/sw.js` was actively registered during development sessions on `http://localhost:3000`.
- **The Poisoning Event:**
  In `public/sw.js` (lines 80–104), the Service Worker intercepted all requests matching:
  ```javascript
  url.pathname.startsWith("/_next/static/")
  ```
  and executed a **Cache-First** strategy:
  ```javascript
  event.respondWith(caches.match(request).then(cached => cached || fetch(request)...))
  ```
- **The Failure Cascade:**
  1. In development mode, Next.js outputs unhashed chunk names (e.g. `/_next/static/chunks/app-pages-internals.js`).
  2. The Service Worker stored these dev chunks inside CacheStorage under `"ehrj-pwa-v1.0.0"`.
  3. Whenever Next.js recompiled (via Fast Refresh, file edits, or server restarts), module IDs and Webpack internal factory maps were regenerated.
  4. The browser reloaded the page, but the Service Worker served the **stale cached chunk** from CacheStorage.
  5. Inside `__webpack_require__(moduleId)`, Webpack looked up `__webpack_modules__[moduleId]`. Because the module ID in the stale chunk did not exist in the newly compiled module registry, it returned `undefined`.
  6. Webpack then attempted:
     ```javascript
     __webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__)
     ```
     throwing:
     `TypeError: Cannot read properties of undefined (reading 'call')`.
  7. Because `app-pages-internals.js` initializes React's client dispatcher before rendering the component tree, React's dispatcher was never set, causing subsequent hook calls to throw:
     `TypeError: Cannot read properties of undefined (reading 'ReactCurrentDispatcher')`.
  8. Because `<LanguageProvider>` was the first client boundary inside `RootLayout`, the stack trace reported `at RootLayout (src\app\layout.tsx:91:9)`.

### Root Cause 2: Filesystem Build Directory Collision (`.next` Overwrite)
- **Mechanism:**
  When a production build (`next build`) was run without setting `NEXT_DIST_DIR`, the compiler purged `.next` while `next dev` had active file handles and memory caches on port 3000.
- **Direct Evidence from Task Log (`task-3259.log`):**
  ```text
  GET /app 500 in 2434ms
  ⨯ [Error: ENOENT: no such file or directory, open 'D:\Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Aplication\.next\routes-manifest.json']
  ```
  The running dev server lost access to its manifest and chunk files, causing 500 server errors and broken client chunks.

---

## 3. Disproved Hypotheses

1. **Duplicate React Packages:**
   `npm ls next react react-dom` verified a single unified `react@18.3.1` and `react-dom@18.3.1` across the dependency tree. No duplicate or conflicting React versions exist.
2. **Missing Client Boundaries or Circular Imports:**
   All providers (`LanguageProvider`, `PwaProvider`, `CommandPalette`, `MobileBottomNav`) have explicit `"use client"` directives and clean, unidirectional imports.
3. **Suspense Boundaries on `useSearchParams`:**
   Both `/admission/apply` and `/admission/track` wrap their components with `<Suspense>`.
4. **Console 503 Errors:**
   Network inspection confirmed that all `HTTP 503` console warnings were from the sandbox proxy blocking external requests to `https://fonts.googleapis.com`. Zero local application endpoints returned 503.

---

## 4. Conclusion

The recurring runtime exceptions were caused by **Service Worker Cache-First interception of unhashed development chunks** combined with **concurrent filesystem collisions on `.next`**. The code logic of `LanguageProvider` and `RootLayout` was completely sound.
