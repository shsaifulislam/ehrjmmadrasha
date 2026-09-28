# ADR-004: Server-Enforced RBAC & Multi-Persona Session Isolation
**Eliotganj Hazi Rohmatollah Jamiria Madrasha (EHRJ Madrasha)**

- **Status:** `ACCEPTED`
- **Decided Date:** 2026-09-28
- **Deciders:** Senior Security Architect, Application Security Lead

---

## 1. Context & Problem Statement
EHRJ Madrasha ERP serves four distinct user personas:
1. `ADMIN` (Principal, Mutawalli, Administrative Staff)
2. `PRINCIPAL` (Academic Executive Oversight)
3. `TEACHER` (Faculty & Class Instructors)
4. `GUARDIAN` (Parents & Legal Guardians)

Direct Object Reference (IDOR) attacks, privilege escalation, and leaking private student/financial records across unauthorized guardians represent severe security and privacy threats.

## 2. Decision
Enforce **strict server-side Role-Based Access Control (RBAC)** on every API route handler and server action, combined with database-level ownership verification.

## 3. Principles & Constraints
- Zero client-side trust: Frontend UI role checks are strictly for rendering convenience; every sensitive API operation inspects the authenticated session cookie on the server.
- Guardian Isolation: Guardians can ONLY query or mutate records linked to their specific verified children (`guardianStudent.guardianId == user.guardian.id`). Querying full student rosters returns HTTP 403 Forbidden.
- Destructive Command Restriction: Only the `ADMIN` role possesses authority to initiate database restores, execute bulk migrations, or trigger maintenance windows. The `PRINCIPAL` role is limited to executive read-only oversight.

## 4. Consequences
- **Positive:**
  - Complete elimination of IDOR vulnerabilities.
  - Transparent audit trail via append-only `AuditLog` records for all administrative mutations.
- **Negative / Trade-offs:**
  - Slight overhead on multi-child queries to perform ownership filtering.
