# EHRJ MADRASHA ERP — PHASE 38 SPECIFICATION & VERIFICATION REPORT
## INSTITUTIONAL KNOWLEDGE, SOP, POLICY, HANDBOOK & GOVERNANCE DOCUMENT MANAGEMENT ENGINE

**Project:** Eliotganj Hazi Rohmatollah Jamiria Madrasha (ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা)  
**Short Name:** EHRJ Madrasha  
**Phase:** Phase 38  
**Checkpoint:** `EHRJ-AI-2026-PHASE38`  
**Date:** September 2026  
**Status:** COMPLETE & PRODUCTION VERIFIED (55/55 Tests Passed, 173 Next.js Routes Clean)

---

## 1. Executive Summary & Mission

Phase 38 builds a centralized, authoritative **Institutional Knowledge, SOP, Policy, Handbook & Governance Document Management Engine** for EHRJ Madrasha.

### Core Architectural Principle
> **"ONE AUTHORITATIVE POLICY, ONE CONTROLLED VERSION, MANY AUTHORIZED EXPERIENCES."**  
> **"PHASE 38 OWNS DOCUMENT AUTHORITY & LIFECYCLE. PHASE 22 OWNS RETRIEVAL & RAG."**  
> **"DOCUMENT TEXT DOES NOT AUTOMATICALLY BECOME CODE."**  
> **"AI-GENERATED ASSISTANCE IS ADVISORY DRAFT ONLY — HUMAN REVIEW & APPROVAL REQUIRED."**

The system strictly guarantees that:
1. Approved policies are the single source of institutional truth.
2. Historical versions remain retrievable and immutable.
3. High-stakes governance approvals require human oversight (Principal & Admin).
4. Strictly **NO SMS** — in-app portal alerts only.

---

## 2. Architecture & Modules

```
                    ┌────────────────────────────────────────────────────────┐
                    │      Phase 38: Authoritative Document Master           │
                    │   (Documents, Versions, SOP Steps, Handbooks, Holds)   │
                    └─────────────────────────┬──────────────────────────────┘
                                              │
                  ┌───────────────────────────┼──────────────────────────┐
                  ▼                           ▼                          ▼
     ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
     │ Lifecycle & Versioning │  │   Approvals & Review   │  │   Acknowledgements     │
     │      State Machine     │  │       Principal        │  │   Teachers/Staff/Guard │
     └────────────┬───────────┘  └────────────┬───────────┘  └────────────┬───────────┘
                  │                           │                          │
                  ▼                           ▼                          ▼
     ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
     │ Historical Effective-  │  │   Conflict Scanner &   │  │    RAG Sync Bridge     │
     │      Date Engine       │  │  Authorized Exceptions │  │  (Sync to Phase 22)    │
     └────────────────────────┘  └────────────────────────┘  └────────────┬───────────┘
                                                                         │
                                                                         ▼
                                                             ┌────────────────────────┐
                                                             │ Phase 22 RAG Retrieval │
                                                             │ (Search/AI Answers)    │
                                                             └────────────────────────┘
```

### Module Breakdown:
1. `src/lib/policies/types.ts`:
   - Enums and interfaces for `KnowledgeCategory`, `DocumentType`, `DocumentStatus`, `ConfidentialityLevel`, `AudienceType`, `SOPStep`, `HandbookSection`, `PolicyVersionRecord`, `PolicyApprovalRecord`, `PolicyAcknowledgement`, `PolicyConflict`, `PolicyException`, and `PolicyAuditEntry`.
2. `src/lib/policies/policyStore.ts`:
   - Atomic persistence in `data/institutional_knowledge/`: `documents.json`, `approvals.json`, `acknowledgements.json`, `exceptions.json`, `conflicts.json`, `audit_log.json`.
   - Seeded with 8 realistic EHRJ institutional policies, SOPs, and handbooks (Admission Policy v2.1, Tahfeez Sabaq/Manzil SOP v1.2, Lilah Boarding Grocery SOP v1.0, IT/Security Policy v2.0, Guardian Handbook v1.0 with 6 sections, Teacher Conduct Policy v1.1, Tuition Concession Policy v1.0 under review, Historical 2025 Admission Policy v1.0).
3. `src/lib/policies/policyLifecycleEngine.ts`:
   - State machine: `DRAFT` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `APPROVED` $\rightarrow$ `PUBLISHED` $\rightarrow$ `EFFECTIVE` $\rightarrow$ `SUPERSEDED` $\rightarrow$ `EXPIRED` $\rightarrow$ `ARCHIVED` $\rightarrow$ `WITHDRAWN`.
   - Immutable historical versions preserved in `versions[]`.
   - Historical Effective-Date Engine (`getEffectivePolicyOnDate(docId, date)`).
   - Legal Hold / Institutional Hold guard.
   - Version Diff comparison helper.
4. `src/lib/policies/policyApprovalEngine.ts`:
   - Submissions for review, approval decision handling (`APPROVED`, `REVISION_REQUIRED`, `REJECTED`) with audit references and notes.
5. `src/lib/policies/policyAcknowledgementEngine.ts`:
   - Role-targeted mandatory acknowledgements (e.g. Teachers, Staff).
   - Idempotent recording of explicit user acknowledgements.
   - Compliance metrics and completion percentages.
6. `src/lib/policies/policyConflictEngine.ts`:
   - Automated detection of duplicate active policies in same category, superseded collisions, and overlapping date intervals.
7. `src/lib/policies/policySOPEngine.ts`:
   - SOP step validation (responsible roles, decision points, completion criteria) and workflow execution links.
8. `src/lib/policies/policySyncBridge.ts`:
   - Synchronizes approved/effective policies into Phase 22 knowledge store (`data/knowledge/documents.json`) without creating duplicate RAG infrastructure.

---

## 3. Frontend Routes & Cockpits

| Route | Audience | Purpose |
|---|---|---|
| `/knowledge` | Public / Students / Guardians | Search, filter, read active policies, browse handbook TOCs, preview SOP steps, check historical effective versions. |
| `/portal/knowledge` | Teachers / Staff / Guardians | Personal compliance console: view pending policies requiring acknowledgement, read text, provide explicit digital consent. |
| `/admin/knowledge` | Admin / Principal | Central governance cockpit with KPI overview, master document table, status transitions, version creation, legal hold toggles. |
| `/admin/knowledge/documents` | Admin / Principal | Dedicated document master repository. |
| `/admin/knowledge/reviews` | Principal / Admin | Oversight and approval queue for submitted drafts. |
| `/admin/knowledge/acknowledgements` | Admin | Staff compliance tracker and acknowledgement logs. |
| `/admin/knowledge/conflicts` | Admin | Conflict scanner and authorized policy exceptions manager. |

---

## 4. API Endpoints

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/governance/documents` | GET | All | List documents with category, type, and confidentiality enforcement. |
| `/api/governance/documents` | POST | Admin/Principal | Create draft policy, SOP, or handbook. |
| `/api/governance/documents/[id]` | GET | All | Retrieve document details or query historical date (`?effectiveDate=YYYY-MM-DD`). |
| `/api/governance/documents/[id]` | PATCH | Admin/Principal | Update draft metadata, markdown, SOP steps, or handbook sections. |
| `/api/governance/documents/[id]/action` | POST | Admin/Principal | Execute status transition or toggle legal hold. |
| `/api/governance/documents/[id]/approve` | POST | Admin/Principal | Approve, request revision, or reject a submitted draft. |
| `/api/governance/documents/[id]/version` | POST | Admin/Principal | Create a new minor revision or major version. |
| `/api/governance/documents/[id]/acknowledge` | POST | Authenticated | Record explicit digital user acknowledgement. |
| `/api/governance/acknowledgements` | GET | Authenticated | List pending/completed acknowledgements for user or all for admin. |
| `/api/governance/conflicts` | GET / POST | Admin/Principal | Scan for structural policy conflicts; resolve conflicts. |
| `/api/governance/exceptions` | GET / POST | Admin/Principal | List or grant authorized, scoped, time-bounded policy exceptions. |
| `/api/governance/stats` | GET | Admin/Principal | Retrieve real governance KPI counts. |
| `/api/governance/sync-rag` | POST | Admin/Principal | Sync approved/effective policies to Phase 22 RAG search store. |

---

## 5. Verification & Testing Evidence

```
=========================================================
  PHASE 38 TEST RESULTS: 55 PASSED, 0 FAILED 
=========================================================
[PASS] Store loaded 8 seed documents (minimum 8 expected)
[PASS] Admission Policy v2.1 found in store
[PASS] Admission policy status is EFFECTIVE
[PASS] Admission policy current version is v2.1
[PASS] Tahfeez Sabaq/Manzil SOP found in store
[PASS] Document type is SOP
[PASS] SOP has 3 operational steps
[PASS] Guardian Handbook found in store
[PASS] Handbook has 6 sections in Table of Contents
[PASS] Minor increment of v1.0 gives v1.1
[PASS] Minor increment of v1.2 gives v1.3
[PASS] Major increment of v1.3 gives v2.0
[PASS] Major increment of v2.5 gives v3.0
[PASS] Invalid state transition DRAFT -> PUBLISHED rejected correctly
[PASS] Draft submitted for review successfully
[PASS] Document status transitioned to UNDER_REVIEW
[PASS] Principal approved the document successfully
[PASS] Document status transitioned to APPROVED
[PASS] Approval audit reference generated
[PASS] Document successfully transitioned to PUBLISHED
[PASS] Document successfully transitioned to EFFECTIVE
[PASS] Legal Hold activated successfully
[PASS] Document reflects isLegalHoldActive: true
[PASS] Archive transition blocked when Legal Hold is active
[PASS] Legal Hold released successfully
[PASS] New minor version created successfully
[PASS] Calculated new version is v1.1
[PASS] New version starts in DRAFT status
[PASS] Historical v1.0 retained in versions array
[PASS] Document versions v1.0 and v1.1 compared successfully
[PASS] Diff engine returned added lines metric
[PASS] Historical query for 2026-01-06 succeeded
[PASS] Resolved version for 2026-01-06 is v2.0 (got v2.0)
[PASS] Resolved version correctly identified as historical
[PASS] Effective date query for 2026-05-15 succeeded
[PASS] Resolved version for 2026-05-15 is current v2.1 (got v2.1)
[PASS] Historical policy 2025 resolution succeeded
[PASS] Resolved 2025 version is v1.0
[PASS] Querying date prior to policy inception returns not found
[PASS] Teacher acknowledgement recorded successfully
[PASS] hasUserAcknowledged returns true for recorded teacher
[PASS] hasUserAcknowledged returns false for unacknowledged user
[PASS] getPendingAcknowledgementsForUser returns pending list
[PASS] getPendingAcknowledgementsForUser returns completed list
[PASS] Compliance metrics tracked 2 acknowledgements
[PASS] Conflict engine scanned and returned 0 conflict candidates
[PASS] No initial structural conflicts found
[PASS] Valid SOP steps passed validation
[PASS] SOP with missing Bengali title failed validation as expected
[PASS] Authorized policy exception saved and retrievable
[PASS] Phase 22 RAG sync synced 6 approved/effective policies
[PASS] Phase 22 RAG sync skipped 3 drafts/unapproved documents
[PASS] Governance dashboard stats totalDocs: 9
[PASS] Governance dashboard stats effectiveDocs: 6
[PASS] STRICT INVARIANT: No SMS services or endpoints in policies engine
```

### Cumulative Regression Matrix:
- Phase 22 (Knowledge & RAG): 56/56 PASS
- Phase 30 (Global Search): PASS
- Phase 34 (Admissions Experience): 36/36 PASS
- Phase 37 (Survey Engine): 43/43 PASS
- Next.js Production Build: **173 / 173 routes compiled cleanly** with zero type errors.

---

## 6. Checkpoint Confirmation

```text
Checkpoint: EHRJ-AI-2026-PHASE38
Final Status: COMPLETE
Evidence: Confirmed by automated test executions, cross-phase regression runs, and Next.js production build.
```
