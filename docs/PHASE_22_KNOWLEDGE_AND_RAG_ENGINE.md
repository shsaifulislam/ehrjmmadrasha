# EHRJ MADRASHA ERP — PHASE 22
## INSTITUTIONAL KNOWLEDGE, ADVANCED SEARCH, SEMANTIC RETRIEVAL & RAG ENGINE

**ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (EHRJ Madrasha)**  
**Checkpoint ID:** `EHRJ-AI-2026-PHASE22`

---

## 1. Executive Summary

Phase 22 establishes an institutional knowledge architecture, permission-aware hybrid search engine, and Retrieval-Augmented Generation (RAG) grounding layer over the EHRJ Madrasha ERP platform.

### Core Non-Negotiable Invariants:
1. **KNOWLEDGE MUST BE GROUNDED IN AUTHORITATIVE INSTITUTIONAL SOURCES.**
2. **AI ANSWER ≠ SOURCE OF TRUTH.**
3. **RETRIEVED SOURCE > AI MEMORY.**
4. **USER PERMISSION > SEARCH RESULT (Authorization must apply before retrieval).**
5. **CURRENT AUTHORITATIVE RECORD > OUTDATED DOCUMENT.**
6. **NO SECRETS IN KNOWLEDGE INDEX.**
7. **PROMPT INJECTION DEFENSE (Retrieved documents are treated as DATA, not instructions).**

---

## 2. Source-of-Truth Hierarchy

| Tier | Category | Description | Authority Level |
|---|---|---|---|
| **Tier 1** | **Authoritative Live ERP Records** | Prisma master tables (Student, Enrollment, Session, JamatClass, Attendance, Results, FeeInvoices, PaymentReceipts, Notices, CashFunds). | Canonical & Live (Overrides all static texts) |
| **Tier 2** | **Approved Institutional Documents** | Official policies, regulations, guidelines, SOPs with strict versioning (`EHRJ-DOC-ADM-001`, `EHRJ-DOC-FIN-001`, etc.). | High Official Authority |
| **Tier 3** | **Published Official Content** | Published FAQs, website pages, announcements, academic calendars. | General Public/Community Authority |
| **Tier 4** | **Draft / Internal Knowledge** | Internal HR salary guidelines, drafts under review. Restricted to Admin/HR. | Internal Scoped |
| **Tier 5** | **AI-Generated Content** | Machine-generated responses, summaries, or classifications. Strictly non-authoritative until approved by a human. | Advisory Only |

---

## 3. Document Lifecycle & Versioning Model

```
DRAFT
  ↓ (Submit for review)
UNDER_REVIEW
  ↓ (Admin / Principal approval)
APPROVED
  ↓ (Publish with effective date)
PUBLISHED
  ↓ (When replaced by new version)
SUPERSEDED  ← [Immutable historical reference retained]
  ↓ (If deprecated permanently)
ARCHIVED
```

- Updating an approved policy creates a new version (`v1.0` $\to$ `v2.0`).
- The superseded version is automatically linked via `supersededVersionId` and retained for historical auditing.
- Search engine automatically detects superseded documents and issues conflict notices when queries match historical policies, ensuring current effective policy is served.

---

## 4. Multi-Lingual Normalization & Search Architecture

- **Bangla Support:** Unicode NFC normalization, synonym harmonizations (e.g. `ভর্তি`, `ভর্তি ফি`, `বেতন`, `ছুটি`, `হাজিরা`).
- **English Support:** Case-insensitive tokenization and common transliterations (`admission`, `fee`, `attendance`).
- **Arabic Support:** Harakat/tashkeel stripping, unification of Alef variations (`أ`, `إ`, `آ` $\to$ `ا`), Ta Marbuta (`ة` $\to$ `ه`), and Alef Maqsura (`ى` $\to$ `ي`).
- **Hybrid Reranking:**
  $$\text{Score} = 0.5 \times \text{Lexical Score} + 0.2 \times \text{Freshness/Effective Boost} + 0.3 \times \text{Source Tier Authority}$$

---

## 5. Security & Permission Matrix

| Role | Public Docs | Institutional Policies | Own Child Records | Other Children Records | Internal HR / Salary |
|---|---|---|---|---|---|
| **PUBLIC** | Allowed | Published Only | Denied | Denied | Denied |
| **GUARDIAN** | Allowed | Published Only | Allowed (Linked Only) | Strictly Denied (IDOR Protected) | Denied |
| **TEACHER** | Allowed | Published + Scoped Academic | Assigned Class Only | Denied | Strictly Denied |
| **PRINCIPAL** | Allowed | Full Institutional | Full Institutional | Full Institutional | Oversight |
| **ADMIN** | Allowed | Full Institutional | Full Institutional | Full Institutional | Full Institutional |

---

## 6. RAG Grounding & Verifiable Citations

When answering questions, the system adheres to:
```
User Query
   ↓
Authentication & RBAC
   ↓
Query Intent Classification
   ↓
Permission-Aware Retrieval (Tier 1 Live DB + Tier 2 Approved Docs)
   ↓
Context Assembly & Prompt Injection Defense
   ↓
Grounded Synthesis
   ↓
Verifiable Citations Generation ([ভর্তি নির্দেশিকা ২০২৬, সংস্করণ ২.০, কোড: EHRJ-DOC-ADM-001])
```

If no authoritative record exists, the system outputs:
> *"ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার বর্তমান ডাটাবেজ ও অনুমোদিত নীতিমালায় এই বিষয়ে কোনো তথ্য সংরক্ষিত নেই। কোনো অনুমাননির্ভর তথ্য প্রদান করা সম্ভব নয়।"*
