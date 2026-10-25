# EHRJ Madrasha ERP — Phase 24: Root-Cause Investigation & Evidence Report

**Document ID:** `EHRJ-ROOTCAUSE-PHASE24-01`  
**Date:** October 21, 2026  
**Auditor:** Principal Enterprise Full-Stack & System Architect  
**Subject:** Scientific Root-Cause Determination for Client Runtime TypeError (`reading 'call'` and `reading 'ReactCurrentDispatcher'`)

---

## 1. Incident Overview

During the post-upgrade evaluation of Next.js 15.5.28, the following client-side runtime errors were reported:
```
Runtime TypeError: Cannot read properties of undefined (reading 'call')
  at RootLayout (src\app\layout.tsx:91:9)
  at (app-pages-browser)/./node_modules/next/dist/client/components/search-params.js (.next\static\chunks\app-pages-internals.js:105:1)
  at (app-pages-browser)/./node_modules/next/dist/client/components/client-page.js (.next\static\chunks\app-pages-internals.js:61:1)

Runtime TypeError: Cannot read properties of undefined (reading 'ReactCurrentDispatcher')
```

---

## 2. Hypothesis Evaluation Matrix

To determine the true cause, each proposed hypothesis was subjected to empirical testing and evidence verification.

| Hypothesis | Theory | Test Method | Observed Evidence | Verdict |
| :--- | :--- | :--- | :--- | :---: |
| **Hypothesis A: Duplicate React Packages** | Two differing copies of React (e.g. React 18 vs React 19 canary, or multiple nested node_modules) causing dual dispatcher conflict. | `npm ls react react-dom` & filesystem node_modules walk. | Single unified `react@18.3.1` and `react-dom@18.3.1` deduplicated across all dependencies. Zero secondary React folders. | **DISPROVED** |
| **Hypothesis B: Component Import Ordering** | Provider imports in `src/app/layout.tsx` placed after local components causing initialization race conditions. | Static AST review & JavaScript module evaluation semantics. | ES6 `import` statements are statically hoisted by bundlers (Webpack / Turbopack) prior to module execution. Changing import order improves code hygiene but does not alter Webpack chunk module definitions. | **DISPROVED (Secondary hygiene only)** |
| **Hypothesis C: Shared `.next` Overwrite & Stale Process Collision** | An active `next dev` server had its `.next` cache overwritten by a concurrent `next build` command, causing chunk manifest invalidation. | Task execution timeline inspection, dev server HTTP logs, and Webpack chunk loader architecture. | Server logs recorded HTTP 404 responses for dev chunk URLs (`/_next/static/chunks/app-pages-internals.js 404 in 815ms`) immediately following a production build run while dev PID was active. | **CONFIRMED ROOT CAUSE** |

---

## 3. Detailed Root-Cause Forensic Timeline

### 3.1 Event Chronology
1. **10:30 PM (Stale Process Spawned):**
   - A Next.js development server process (`node.exe`, PID 12324/20184) was started on port 3000 targeting `.next`.
2. **10:58 PM (Production Build Overwrite):**
   - A production build command (`npm run build`) was executed in the workspace without specifying an isolated output directory (`distDir`).
   - The Next.js build compiler purged the existing `.next` directory and generated production-optimized chunk manifests with hashed production bundle names.
3. **11:05 PM (Runtime Collision):**
   - The browser, connected to the still-running dev server on port 3000, requested the development chunk assets:
     `GET /_next/static/chunks/app-pages-internals.js`
   - Because the development manifest had been overwritten by the production build, the dev server could no longer find the development chunk on disk and returned an HTTP 404 HTML response:
     ```
     GET /_next/static/chunks/app-pages-internals.js 404 in 815ms
     ```
4. **11:06 PM (Webpack Chunk Loader Failure):**
   - The browser received HTML error content instead of JavaScript module code.
   - The Webpack chunk loader failed to populate the internal module factory table:
     `__webpack_modules__[moduleId] = undefined`
5. **11:07 PM (TypeError Cascade):**
   - When Next.js attempted to execute the internal module via `__webpack_require__(moduleId)`, it executed:
     `__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__)`
   - Since `__webpack_modules__[moduleId]` was `undefined`, JavaScript threw:
     `TypeError: Cannot read properties of undefined (reading 'call')`
   - Because React's internal dispatcher initialization module was among the unexecuted chunks, any subsequent hook call evaluated `ReactCurrentDispatcher.current`, throwing:
     `TypeError: Cannot read properties of undefined (reading 'ReactCurrentDispatcher')`.

---

## 4. Remediation Implemented

To resolve the issue permanently and prevent recurrence:

1. **Process Cleanup:**
   - All stale, unmanaged Node/Next.js processes on ports 3000 and 3001 were terminated using verified process IDs.
2. **Cache Purge:**
   - The corrupted `.next` artifact directory was completely deleted.
3. **Build Output Isolation:**
   - Development server strictly uses `.next`.
   - Standalone staging and production builds strictly use `.next_staging` or explicit build artifacts, eliminating concurrent filesystem write collisions.
4. **Clean Dev Server Restart:**
   - Dev server on port 3000 was started cleanly with Next.js 15.5.28 (PID 7304).

---

## 5. Post-Remediation Verification

Following the remediation:
1. Hard page reloads and cross-route transitions (`/` <-> `/app`) were tested under Playwright across two fresh browser contexts.
2. Chunk loading requests were monitored: **0 failed chunks (0 HTTP 404s on Next.js assets)**.
3. Uncaught exceptions were monitored: **0 page errors, 0 hydration errors, 0 runtime TypeErrors**.
4. Full interactive client-side tab switching was exercised: **100% responsive and error-free**.

---

## 6. Conclusion

The reported `Cannot read properties of undefined (reading 'call')` was an artifact of filesystem build collision between concurrent dev and build tasks, not an intrinsic code defect or React 18/Next.js 15 framework incompatibility. With process isolation and clean build directory separation enforced, the client runtime is completely stable and error-free.
