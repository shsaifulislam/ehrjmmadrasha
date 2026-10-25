# EHRJ Digital Campus & ERP — Attack Surface Analysis

> **System:** Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Application & Enterprise ERP  
> **Status:** Exhaustive Evidence-Based Attack Surface Mapping  
> **Scope:** Network Ingress, Edge Middleware, Route Handlers, Database, and Integrations  
> **Date:** October 2026

---

## 1. Network & Ingress Exposure Surface

The EHRJ platform exposes web interfaces and HTTP APIs to various categories of network clients:

```
[ Untrusted Public Internet ] ───► Port 443 (HTTPS / Nginx Reverse Proxy)
                                       │
                                       ▼ (Proxy Pass to localhost:3000)
                              [ Next.js 14 App Server ]
```

- **Public Port:** TCP 443 (HTTPS) & TCP 80 (HTTP 301 Redirect to HTTPS).
- **Internal Port:** TCP 3000 (Bound strictly to `127.0.0.1` on host or container internal network).
- **Database Port:** None. The SQLite database is embedded within the application runtime process on the local filesystem. There is no open TCP port for database connectivity.

---

## 2. API Endpoint Exposure Breakdown

The backend contains **469 distinct route handler files** exporting **693 HTTP method operations**:

| Exposure Category | Route Files | Allowed Roles | Authentication Requirement | Primary Attack Surface |
| :--- | :---: | :--- | :--- | :--- |
| **Public Endpoints** | 57 | `PUBLIC` | None | Admissions submission, notices, public verification, health check |
| **Administrative Cockpit** | 324 | `ADMIN`, `PRINCIPAL` | Session Cookie / JWT Bearer | Institutional ERP configuration, user control, finance ledger, inventory |
| **Guardian Portal** | 31 | `GUARDIAN`, `ADMIN` | Session Cookie / JWT Bearer | Linked student performance, fee review, manual/MFS payment submission |
| **Teacher Cockpit** | 8 | `TEACHER`, `ADMIN` | Session Cookie / JWT Bearer | Classroom attendance, exam mark submission, class roster |
| **Principal Oversight** | 2 | `PRINCIPAL`, `ADMIN` | Session Cookie / JWT Bearer | Executive approvals, circular dispatch |
| **General Authenticated** | 47 | Any Active Role | Session Cookie / JWT Bearer | Session profile, password update, logout |
| **Inbound Webhooks** | 4 | External Payment Gateways | Provider HMAC Signature / IP | Inbound payment event processing (bKash, Nagad) |

---

## 3. User Input & Request Parsing Surfaces

Every route handler accepting mutation requests constitutes an input parsing surface:

### 3.1 JSON Payload Parsing (`req.json()`)
- Utilized across all 280 `POST`, 44 `PATCH`, and 26 `PUT` endpoints.
- **Risk:** Malformed JSON, prototype pollution, oversized request bodies.
- **Mitigation:** Next.js body parser limits payload size (default 1MB). JSON parsing is wrapped in `try / catch` blocks returning HTTP 400 or 500 on malformed syntax.

### 3.2 URL Search Parameters (`searchParams.get()`)
- Utilized in 321 `GET` endpoints for filtering, sorting, and pagination (e.g. `?status=`, `?sessionId=`, `?page=`, `?limit=`).
- **Risk:** Unbounded database queries, unexpected type coercion.
- **Finding:** Endpoints such as `/api/admin/students` and `/api/admin/attendance` accept optional limit parameters but omit a forced ceiling if omitted by the caller.

### 3.3 Dynamic Route Path Parameters (`[id]`, `[token]`, `[provider]`)
- Path parameters are parsed via route context arguments (e.g. `/api/admin/students/[id]`).
- **Risk:** Path traversal, SQL injection, NoSQL injection.
- **Mitigation:** Passed directly to Prisma ORM parameterized queries (`where: { id }`). Path traversal is mathematically impossible on database lookups.

---

## 4. File Upload & Storage Surface

- **File Intake Mechanism:**
  Unlike traditional PHP or Express applications that stream multipart files directly to public server folders, EHRJ processes documents and payment slips via structured base64 strings or dedicated document factory services.
- **Storage Locations:**
  - `data/`: Internal application JSON records (audit events, lockout state, policy stores).
  - `backups/`: Automated SQLite database snapshots created by `operationsEngine.ts`.
  - `public/uploads/`: Static asset directory for verified institutional images.
- **Risk Evaluation:**
  Zero endpoints execute uploaded files. File writes use [`src/lib/storageUtils.ts:atomicWriteFileSync`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/storageUtils.ts), preventing file corruption during concurrent operations.

---

## 5. Third-Party Integrations & External Callbacks

| External Service | Direction | Protocol | Security Mechanism | Attack Vector |
| :--- | :--- | :--- | :--- | :--- |
| **bKash Payment Gateway** | Inbound / Outbound | HTTPS REST | HMAC-SHA256 signature verification & Token Grant | Webhook tampering, replay of transaction IDs |
| **Nagad Payment Gateway** | Inbound / Outbound | HTTPS REST | Merchant Key & Signature | Webhook replay, callback spoofing |
| **Greenweb SMS Gateway** | Outbound | HTTPS REST | API Token / IP Whitelist | Gateway timeout, exhaustion of SMS balance |
| **Nodemailer SMTP Relay** | Outbound | TLS (Port 587/465) | Username & App Password | SMTP connection timeouts, spam relay abuse |

---

## 6. Supply Chain & Dependency Surface

- **Runtime Dependencies:**
  - `@prisma/client` & `prisma`: Database ORM.
  - `jose`: Cryptographic JWT signing and verification.
  - `bcryptjs`: Password hashing.
  - `next` (v14.2): Core web application framework.
  - `react` (v18): User interface framework.
  - `lucide-react`: Icon library.
- **Supply Chain Hygiene:** Zero vulnerable native C++ bindings outside standard SQLite binaries. Dependencies are pinned in `package.json` and `package-lock.json`.
