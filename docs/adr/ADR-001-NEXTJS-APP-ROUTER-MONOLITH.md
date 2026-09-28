# ADR-001: Unified Monolithic Full-Stack Next.js 14 App Router
**Eliotganj Hazi Rohmatollah Jamiria Madrasha (EHRJ Madrasha)**

- **Status:** `ACCEPTED`
- **Decided Date:** 2026-09-28
- **Deciders:** Senior Product Architect, DevOps Lead, Full-Stack Lead

---

## 1. Context & Problem Statement
Educational institutions in Bangladesh often struggle with fragmented IT stacks (separate frontend hosting, decoupled backend microservices, third-party databases, inconsistent API contracts). For Eliotganj Madrasha, high operational overhead, distributed network failures, and synchronization latencies between public websites and internal management portals represented major operational risks.

## 2. Decision
Adopt a **unified monolithic architecture** using Next.js 14 (App Router) with integrated API route handlers (`/api/*`), React Server Components (RSC), and TypeScript.

## 3. Evaluated Options
- **Option A (Chosen):** Monolithic Next.js 14 App Router (Full-Stack).
- **Option B:** Decoupled React/Vite SPA + Express/NestJS backend API.
- **Option C:** Microservices architecture with independent micro-frontends.

## 4. Rationale
- Zero API drift: Types are shared end-to-end across Prisma models, server actions, and frontend components.
- Single deployment bundle: Deployable with a single PM2 cluster and unified Nginx reverse proxy.
- Fast Time-To-First-Byte (TTFB) and excellent SEO for public portal pages (notices, admissions, results verification).

## 5. Consequences
- **Positive:**
  - Dramatically simplified CI/CD, local development, and backup pipelines.
  - Consistent security perimeter with unified middleware and session management.
- **Negative / Trade-offs:**
  - High build trace analysis time during Next.js static page generation (109 routes take ~35s to build).
  - Heavy server-side CPU utilization if complex PDF generation runs synchronously on the main thread (tracked in `EHRJ-DEBT-003`).
