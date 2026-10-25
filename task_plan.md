# Master Task Plan: Independent Reality Verification & Zero-Gap Challenge
## Checkpoint: `EHRJ-AI-2026-FINAL-INDEPENDENT-VERIFICATION-02`

### Mission Objective
Independently challenge, probe, attack, test, and verify the EHRJ Digital Campus & ERP system without assuming past reports are true. Uncover any hidden security, RBAC, IDOR, financial, academic, guardian, teacher, database, or UI/UX gaps. Repair all discovered gaps, execute exhaustive multi-layer test verification, and produce the definitive evidence-based Final Independent Verification Report.

---

## Verification Tracks & Execution Stages

- [ ] **Stage 1: Deep Security Codebase Search (Client-Controlled Authorities & Status Mutations)**
  - [ ] Comprehensive regex scan across all 475 API route handlers for:
    - `body.role`, `body.actorRole`, `body.requestedBy`, `body.userId`, `body.guardianId`, `body.studentId`
    - `body.status`, `body.amount`, `body.transactionId`
    - Direct assignment of `"PAID"`, `"SUCCESS"`, `"VERIFIED"`, `"COMPLETED"`, `"APPROVED"` based on client input
  - [ ] Secrets scan: Hardcoded JWT secrets, API keys, passwords, database credentials in client/server code
  - [ ] Repair any endpoint where client request body controls security, identity, or financial status

- [ ] **Stage 2: Authentication & RBAC / IDOR Attack Simulation**
  - [ ] Test real HTTP authentication with live credentials for:
    - `ADMIN`, `PRINCIPAL`, `TEACHER`, `GUARDIAN`, `PUBLIC`
  - [ ] Test token lifecycle: Wrong password, inactive user, forged JWT token, expired token, revoked token
  - [ ] Simulate active IDOR attacks:
    - Guardian A attempting access to Student B, Invoice B, Result B, Document B
    - Teacher A attempting to enter marks/attendance for Class B, Subject B
    - Principal attempting Admin-only configuration / settings
    - Public / Anonymous accessing protected academic or financial APIs

- [ ] **Stage 3: Financial & Five-Fund Reality Challenge**
  - [ ] Five-fund segregation verification: `GENERAL`, `LILLAH`, `ZAKAT`, `CONSTRUCTION`, `ORPHAN_SUPPORT`
  - [ ] Prohibit illegal cross-fund transfers (e.g. Zakat to General operational expenses)
  - [ ] Attack financial mutation endpoints:
    - Negative amounts, zero amounts, floating point overflow
    - Wrong invoice / student mismatch
    - Fake transaction IDs, fake gateway SUCCESS callback
    - Duplicate webhooks and parallel payment/refund race conditions
  - [ ] Dual-approval workflow verification for disbursements > ৳5,000

- [ ] **Stage 4: Academic Engine, Qawmi Grading & Student Lifecycle Verification**
  - [ ] End-to-end Student Lifecycle: Admission -> Approval -> Enrollment -> Roll -> Attendance -> Exam -> Marks -> Result -> Promotion
  - [ ] Strict Qawmi grade boundary verification:
    - Mumtaz (80%+), Jayyid Jiddan (70-79.99%), Jayyid (60-69.99%), Maqbool (50-59.99%), Rasib (<50%)
    - Fail boundary edge cases (79.99 vs 80.00, 49.99 vs 50.00)
    - Mandatory subject failure, absent handling, exemption handling, frozen result verification codes
  - [ ] Secondary lifecycle states: Transfer, Withdrawal, Inactive, Completed (verify historical immutability)

- [ ] **Stage 5: Role-Specific Workplace Verification**
  - [ ] Guardian Portal: Child switcher, multi-student invoice aggregation, receipt downloads, notice board
  - [ ] Teacher Workplace: Class-section scoping enforcement, routine, attendance mark-up
  - [ ] Principal Workplace: Oversight metrics, dual-approval pending queue, institutional analytics
  - [ ] Public Portal & Verification: Privacy-safe certificate/result QR verification

- [ ] **Stage 6: Real Browser UI/UX, Responsive & Localization Matrix**
  - [ ] Test viewports: 320px, 375px, 390px, 414px, 768px, 1024px, 1280px, 1440px, 1920px
  - [ ] Verify zero horizontal overflow, legible typography (Bengali, Arabic, English), touch targets >= 44x44px
  - [ ] Verify form validation, loading states, empty states, and error alerts

- [ ] **Stage 7: Database & Performance Reality Checks**
  - [ ] PRAGMA checks (`integrity_check`, `foreign_key_check`, WAL journaling mode)
  - [ ] Audit all 120 Prisma models against active SQLite `prisma/dev.db`
  - [ ] Check for N+1 queries, unbounded aggregations, and transaction deadlocks

- [ ] **Stage 8: Live Production Verification & Environmental Blocker Determination**
  - [ ] Real DNS check for `ehrjmadrasha.com`
  - [ ] Document exact network / registrar configuration requirements
  - [ ] Determine final production readiness verdict (`CONDITIONALLY PRODUCTION READY` vs `PRODUCTION READY` vs `NOT PRODUCTION READY`)

- [ ] **Stage 9: Deliver Final Independent Verification Report & Archive Checkpoint**
  - [ ] Deliver authoritative report in `docs/checkpoints/EHRJ-AI-2026-FINAL-INDEPENDENT-VERIFICATION-02/`
  - [ ] Answer all 20 required questions with undeniable quantitative and line-level evidence
