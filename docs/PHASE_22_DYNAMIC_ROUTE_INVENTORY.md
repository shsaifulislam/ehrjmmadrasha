# EHRJ Madrasha ERP — Phase 22: Dynamic Route Inventory & Contract Audit

**Generated:** 2026-10-20  
**Branch:** `chore/phase21-nextjs-upgrade`  
**Framework:** Next.js `15.5.28` (LTS Security Backport) / React `18.3.1`  
**Target Environment:** Isolated Upgrade Branch (Master SQLite byte-preserved: `db452633adeddb9f4baf0441c500e7df2c460a7fe58b40d99d693af3994dc094`)

---

## 1. Executive Summary & Inventory Scope

In Next.js 15, the parameter contract for App Router dynamic pages and route handlers transitioned from synchronous objects to asynchronous Promises (`params: Promise<T>`, `searchParams?: Promise<T>`).

An exhaustive recursive scan of `src/app` was conducted to audit every dynamic path containing bracket segments (`[id]`, `[token]`, `[code]`, `[provider]`, `[studentId]`, `[docId]`, etc.) as well as pages handling dynamic `searchParams`.

### Global Inventory Metrics
* **Total Dynamic / Query-Dependent Page Files:** **34 files** (30 dynamic bracket routes + 4 login redirect pages)
  * *Original Preliminary Estimate:* 22 dynamic pages
  * *Discrepancy Analysis:* 8 additional nested/verification dynamic pages were discovered (`/library/verify/copy/[token]`, `/verify/employee/[token]`, `/verify/gatepass/[token]`, `/verify/student/[id]`, `/portal/helpdesk/[id]`, `/login/admin`, `/login/guardian`, `/login/teacher`).
* **Total Dynamic Route Handler (`route.ts`) Files:** **157 files**
  * *Pre-existing Async Promise routes:* 36 files (previously migrated during budget/governance additions)
  * *Routes Migrated in Phase 22:* 121 files (including 1 multi-segment route and 7 survey routes)
* **Total API Route Handlers Migrated:** **162 handlers** (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)

---

## 2. Dynamic Page Inventory & Migration Checklist

| # | Route File Path | Dynamic Parameter | Mode | Pre-Migration Signature | Next.js 15 Target Contract | Migration Status |
|---|----------------|-------------------|------|-------------------------|----------------------------|------------------|
| 1 | `src/app/admin/budgets/[id]/page.tsx` | `[id]` | Server | `params: Promise<{ id: string }>` | Awaited `params` | **VERIFIED (Pre-existing)** |
| 2 | `src/app/admin/budgets/[id]/revisions/page.tsx` | `[id]` | Server | `params: Promise<{ id: string }>` | Awaited `params` | **VERIFIED (Pre-existing)** |
| 3 | `src/app/admin/budgets/[id]/variance/page.tsx` | `[id]` | Server | `params: Promise<{ id: string }>` | Awaited `params` | **VERIFIED (Pre-existing)** |
| 4 | `src/app/admin/budgets/[id]/versions/page.tsx` | `[id]` | Server | `params: Promise<{ id: string }>` | Awaited `params` | **VERIFIED (Pre-existing)** |
| 5 | `src/app/admin/compliance/obligations/[id]/page.tsx` | `[id]` | Server | `params: Promise<{ id: string }>` | Awaited `params` | **VERIFIED (Pre-existing)** |
| 6 | `src/app/admin/compliance/requirements/[id]/page.tsx` | `[id]` | Server | `params: Promise<{ id: string }>` | Awaited `params` | **VERIFIED (Pre-existing)** |
| 7 | `src/app/admin/contracts/[id]/page.tsx` | `[id]` | Server | `params: Promise<{ id: string }>` | Awaited `params` | **VERIFIED (Pre-existing)** |
| 8 | `src/app/admin/governance/risks/[id]/page.tsx` | `[id]` | Server | `params: Promise<{ id: string }>` | Awaited `params` | **VERIFIED (Pre-existing)** |
| 9 | `src/app/admin/procurement/contracts/[id]/page.tsx` | `[id]` | Server | `params: Promise<{ id: string }>` | Awaited `params` | **VERIFIED (Pre-existing)** |
| 10 | `src/app/admin/procurement/rfqs/[id]/page.tsx` | `[id]` | Server | `params: Promise<{ id: string }>` | Awaited `params` | **VERIFIED (Pre-existing)** |
| 11 | `src/app/admin/procurement/vendors/[id]/page.tsx` | `[id]` | Server | `params: Promise<{ id: string }>` | Awaited `params` | **VERIFIED (Pre-existing)** |
| 12 | `src/app/admin/vendors/[id]/page.tsx` | `[id]` | Server | `params: Promise<{ id: string }>` | Awaited `params` | **VERIFIED (Pre-existing)** |
| 13 | `src/app/admin/helpdesk/requests/[id]/page.tsx` | `[id]` | Server | `{ params: { id: string } }` | `params: Promise<{ id: string }>` | **VERIFIED (Migrated)** |
| 14 | `src/app/admin/hr/employees/[id]/page.tsx` | `[id]` | Server | `{ params: { id: string } }` | `params: Promise<{ id: string }>` | **VERIFIED (Migrated)** |
| 15 | `src/app/library/verify/copy/[token]/page.tsx` | `[token]` | Server | `{ params: { token: string } }` | `params: Promise<{ token: string }>` | **VERIFIED (Migrated)** |
| 16 | `src/app/notices/[id]/page.tsx` | `[id]` | Server | `NoticeDetailsProps { params: { id } }` | `params: Promise<{ id: string }>` | **VERIFIED (Migrated)** |
| 17 | `src/app/portal/helpdesk/[id]/page.tsx` | `[id]` | Server | `{ params: { id: string } }` | `params: Promise<{ id: string }>` | **VERIFIED (Migrated)** |
| 18 | `src/app/verify/employee/[token]/page.tsx` | `[token]` | Client | `params: { token: string }` | `useParams<{ token: string }>()` | **VERIFIED (Migrated)** |
| 19 | `src/app/verify/gatepass/[token]/page.tsx` | `[token]` | Client | `params: { token: string }` | `useParams<{ token: string }>()` | **VERIFIED (Migrated)** |
| 20 | `src/app/verify/student/[id]/page.tsx` | `[id]` | Client | `params: { id: string }` | `useParams<{ id: string }>()` | **VERIFIED (Migrated)** |
| 21 | `src/app/login/admin/page.tsx` | `searchParams` | Server | `searchParams?: { redirect?: string }` | `searchParams?: Promise<{ redirect?: string }>` | **VERIFIED (Migrated)** |
| 22 | `src/app/login/guardian/page.tsx` | `searchParams` | Server | `searchParams?: { redirect?: string }` | `searchParams?: Promise<{ redirect?: string }>` | **VERIFIED (Migrated)** |
| 23 | `src/app/login/teacher/page.tsx` | `searchParams` | Server | `searchParams?: { redirect?: string }` | `searchParams?: Promise<{ redirect?: string }>` | **VERIFIED (Migrated)** |
| 24 | `src/app/admin/admissions/[id]/page.tsx` | `[id]` | Client | `useParams()` | `useParams()` | **VERIFIED (Pre-existing)** |
| 25 | `src/app/admin/students/[id]/page.tsx` | `[id]` | Client | `useParams()` | `useParams()` | **VERIFIED (Pre-existing)** |
| 26 | `src/app/admin/surveys/[id]/page.tsx` | `[id]` | Client | `useParams()` | `useParams()` | **VERIFIED (Pre-existing)** |
| 27 | `src/app/events/[id]/page.tsx` | `[id]` | Client | `useParams()` | `useParams()` | **VERIFIED (Pre-existing)** |
| 28 | `src/app/inventory/verify/asset/[token]/page.tsx` | `[token]` | Client | `useParams()` | `useParams()` | **VERIFIED (Pre-existing)** |
| 29 | `src/app/surveys/[id]/page.tsx` | `[id]` | Client | `useParams()` | `useParams()` | **VERIFIED (Pre-existing)** |
| 30 | `src/app/verify/document/[token]/page.tsx` | `[token]` | Client | `useParams()` | `useParams()` | **VERIFIED (Pre-existing)** |
| 31 | `src/app/verify/receipt/[token]/page.tsx` | `[token]` | Client | `useParams()` | `useParams()` | **VERIFIED (Pre-existing)** |
| 32 | `src/app/verify/result/[code]/page.tsx` | `[code]` | Client | `useParams()` | `useParams()` | **VERIFIED (Pre-existing)** |
| 33 | `src/app/verify/page.tsx` | None (static) | Client | None | None | **VERIFIED (Static Hub)** |
| 34 | `src/app/login/page.tsx` | `searchParams` | Client | `useSearchParams()` | `useSearchParams()` | **VERIFIED (Client Hook)** |

---

## 3. Dynamic API Route Handler Inventory & Architecture

Dynamic API route handlers in Next.js 15 receive a second argument adhering to `RouteContext`:
```ts
{ params: Promise<{ [paramName: string]: string }> }
```

### Route Handler Distribution Summary
1. **Academic Management:** 14 routes (`/api/admin/academic/...`)
2. **Admissions:** 9 routes (`/api/admin/admissions/...`)
3. **Finance & Budgets:** 28 routes (`/api/admin/budgets/...`, `/api/admin/finance/...`)
4. **Governance, Risk & Compliance:** 24 routes (`/api/admin/governance/...`, `/api/admin/compliance/...`)
5. **Human Resources & Employees:** 16 routes (`/api/admin/hr/...`, `/api/teacher/...`)
6. **Surveys & Feedback:** 7 routes (`/api/surveys/[id]/...`)
7. **Verification & Public Trust Services:** 6 routes (`/api/verify/...`)
8. **Webhooks & Communication:** 8 routes (`/api/v1/webhooks/...`, `/api/admin/communications/...`)
9. **Other Admin Operations:** 45 routes (procurement, attendance, calendar, library, hostel, IT assets)

### Multi-Segment Dynamic Routes
* `src/app/api/admin/hr/employees/[id]/documents/[docId]/verify/route.ts`
  * *Parameters:* `{ id: string; docId: string }`
  * *Contract:* `{ params: paramsPromise }: { params: Promise<{ id: string; docId: string }> }`
  * *Resolution:* `const params = await paramsPromise;` (both `params.id` and `params.docId` safely resolved).

---

## 4. Contract Conformance Architecture

To guarantee absolute backwards compatibility and eliminate risk of regression across hundreds of business logic files:
1. **Signature Alignment:** Route parameters are typed as `Promise<{ [key: string]: string }>`.
2. **Asynchronous Unwrapping:** Handlers await the promise at the top of the function:
   ```ts
   export async function METHOD(
     req: NextRequest,
     { params: paramsPromise }: { params: Promise<{ id: string }> }
   ) {
     const params = await paramsPromise;
     // All downstream business logic, auth checks, and Prisma calls remain unchanged
   }
   ```
3. **Zero Suppressions:** No `@ts-ignore` or `any` casts were introduced. Every file satisfies Next.js 15 `.next/types/validator.ts` route context checks.
