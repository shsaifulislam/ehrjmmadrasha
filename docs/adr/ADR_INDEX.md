# EHRJ MADRASHA — ARCHITECTURE DECISION RECORDS (ADR) INDEX
**ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা**  
**Eliotganj Hazi Rohmatollah Jamiria Madrasha (EHRJ Madrasha)**

Architecture Decision Records (ADRs) document architectural decisions made in the EHRJ Madrasha ERP platform, including the context, evaluated options, chosen decision, and long-term consequences.

---

## 1. Active Architecture Decisions

| ADR Number | Title | Status | Decided Date | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **[ADR-001](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/docs/adr/ADR-001-NEXTJS-APP-ROUTER-MONOLITH.md)** | Unified Monolithic Full-Stack Next.js 14 App Router | `ACCEPTED` | 2026-09-28 | Frontend & Backend Architecture |
| **[ADR-002](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/docs/adr/ADR-002-SQLITE-WAL-OPERATIONAL-RESILIENCE.md)** | SQLite 3 in WAL Mode with Binary Atomic Disaster Recovery | `ACCEPTED` | 2026-09-28 | Persistence, Backups & RTO/RPO |
| **[ADR-003](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/docs/adr/ADR-003-IDEMPOTENT-5-FUND-FINANCIAL-LEDGER.md)** | Idempotent Multi-Fund Accounting Ledger & Strict Shariah Allocation | `ACCEPTED` | 2026-09-28 | Finance, Invoices & Payments |
| **[ADR-004](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/docs/adr/ADR-004-ROLE-BASED-MULTI-PERSONA-SECURITY.md)** | Server-Enforced RBAC & Multi-Persona Session Isolation | `ACCEPTED` | 2026-09-28 | Security, Auth & IDOR Mitigation |

---

## 2. ADR Governance Principles
1. **Immutable Historical Context:** Once an ADR is marked `ACCEPTED`, it is never rewritten to match changing desires. If an architectural decision changes, a new ADR is drafted which supersedes the old one.
2. **Consequences Transparency:** Every record must honestly articulate trade-offs, operational burdens, and mitigation strategies.
3. **Traceability:** ADRs must be linked in change requests whenever a proposed feature touches an architectural decision boundary.
