# PHASE 30 — COMPLETE APPLICATION ROUTE INVENTORY

**Audit Date:** 2026-10-22  
**Application:** EHRJ Madrasha ERP & Digital Campus  
**Branch:** `chore/phase21-nextjs-upgrade`  
**Next.js Framework:** 15.5.28 (App Router)  
**Total Application Routes Discovered:** 194

---

## 1. Route Summary by Functional Surface

| Application Surface | Route Count | Primary Target User | Access Enforcement |
| :--- | :---: | :--- | :--- |
| **Public Website** | 33 | Public, Prospective Students, Donors | Public / Unrestricted |
| **Admin Panel** | 107 | System Administrators, Superadmins | Role `ADMIN` or `PRINCIPAL` |
| **Teacher Panel** | 16 | Teachers, Ustads | Role `TEACHER`, `ADMIN`, `PRINCIPAL` |
| **Principal Panel** | 6 | Principal, Muhtamim | Role `PRINCIPAL` or `ADMIN` |
| **Student & Guardian Portal** | 27 | Guardians, Enrolled Students | Role `GUARDIAN`, `ADMIN`, `PRINCIPAL` |
| **Authentication & Gateways** | 4 | All Institutional Actors | Public Entry / Callback-aware |
| **PWA & Mobile Campus App** | 1 | All Mobile Users / PWA Installers | Offline-first / Hybrid |
| **TOTAL** | **194** | **Complete Campus Ecosystem** | **Edge Middleware Protected** |

---

## 2. Detailed Route Catalogue

### Public Website (33 Routes)

| Route URL | Component File Path | Primary Role | Route Type |
| :--- | :--- | :---: | :---: |
| `/about` | `src/app/about/page.tsx` | `PUBLIC` | Static Route |
| `/academic` | `src/app/academic/page.tsx` | `PUBLIC` | Static Route |
| `/admission/apply` | `src/app/admission/apply/page.tsx` | `PUBLIC` | Static Route |
| `/admission` | `src/app/admission/page.tsx` | `PUBLIC` | Static Route |
| `/admission/track` | `src/app/admission/track/page.tsx` | `PUBLIC` | Static Route |
| `/alumni/directory` | `src/app/alumni/directory/page.tsx` | `PUBLIC` | Static Route |
| `/alumni` | `src/app/alumni/page.tsx` | `PUBLIC` | Static Route |
| `/calendar` | `src/app/calendar/page.tsx` | `PUBLIC` | Static Route |
| `/contact` | `src/app/contact/page.tsx` | `PUBLIC` | Static Route |
| `/donate` | `src/app/donate/page.tsx` | `PUBLIC` | Static Route |
| `/downloads` | `src/app/downloads/page.tsx` | `PUBLIC` | Static Route |
| `/events` | `src/app/events/page.tsx` | `PUBLIC` | Static Route |
| `/events/[id]` | `src/app/events/[id]/page.tsx` | `PUBLIC` | Dynamic Segment (`[param]`) |
| `/gallery` | `src/app/gallery/page.tsx` | `PUBLIC` | Static Route |
| `/inventory/verify/asset/[token]` | `src/app/inventory/verify/asset/[token]/page.tsx` | `PUBLIC` | Dynamic Segment (`[param]`) |
| `/knowledge` | `src/app/knowledge/page.tsx` | `PUBLIC` | Static Route |
| `/library` | `src/app/library/page.tsx` | `PUBLIC` | Static Route |
| `/library/verify/copy/[token]` | `src/app/library/verify/copy/[token]/page.tsx` | `PUBLIC` | Dynamic Segment (`[param]`) |
| `/notices` | `src/app/notices/page.tsx` | `PUBLIC` | Static Route |
| `/notices/[id]` | `src/app/notices/[id]/page.tsx` | `PUBLIC` | Dynamic Segment (`[param]`) |
| `/` | `src/app/page.tsx` | `PUBLIC` | Static Route |
| `/results` | `src/app/results/page.tsx` | `PUBLIC` | Static Route |
| `/search` | `src/app/search/page.tsx` | `PUBLIC` | Static Route |
| `/surveys` | `src/app/surveys/page.tsx` | `PUBLIC` | Static Route |
| `/surveys/[id]` | `src/app/surveys/[id]/page.tsx` | `PUBLIC` | Dynamic Segment (`[param]`) |
| `/transport` | `src/app/transport/page.tsx` | `PUBLIC` | Static Route |
| `/verify/document/[token]` | `src/app/verify/document/[token]/page.tsx` | `PUBLIC` | Dynamic Segment (`[param]`) |
| `/verify/employee/[token]` | `src/app/verify/employee/[token]/page.tsx` | `PUBLIC` | Dynamic Segment (`[param]`) |
| `/verify/gatepass/[token]` | `src/app/verify/gatepass/[token]/page.tsx` | `PUBLIC` | Dynamic Segment (`[param]`) |
| `/verify` | `src/app/verify/page.tsx` | `PUBLIC` | Static Route |
| `/verify/receipt/[token]` | `src/app/verify/receipt/[token]/page.tsx` | `PUBLIC` | Dynamic Segment (`[param]`) |
| `/verify/result/[code]` | `src/app/verify/result/[code]/page.tsx` | `PUBLIC` | Dynamic Segment (`[param]`) |
| `/verify/student/[id]` | `src/app/verify/student/[id]/page.tsx` | `PUBLIC` | Dynamic Segment (`[param]`) |

### Admin Panel (107 Routes)

| Route URL | Component File Path | Primary Role | Route Type |
| :--- | :--- | :---: | :---: |
| `/admin/academic/classes` | `src/app/admin/academic/classes/page.tsx` | `ADMIN` | Static Route |
| `/admin/academic` | `src/app/admin/academic/page.tsx` | `ADMIN` | Static Route |
| `/admin/academic/promotions` | `src/app/admin/academic/promotions/page.tsx` | `ADMIN` | Static Route |
| `/admin/academic/sections` | `src/app/admin/academic/sections/page.tsx` | `ADMIN` | Static Route |
| `/admin/academic/sessions` | `src/app/admin/academic/sessions/page.tsx` | `ADMIN` | Static Route |
| `/admin/admission` | `src/app/admin/admission/page.tsx` | `ADMIN` | Static Route |
| `/admin/admissions` | `src/app/admin/admissions/page.tsx` | `ADMIN` | Static Route |
| `/admin/admissions/[id]` | `src/app/admin/admissions/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/ai` | `src/app/admin/ai/page.tsx` | `ADMIN` | Static Route |
| `/admin/alumni` | `src/app/admin/alumni/page.tsx` | `ADMIN` | Static Route |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | `ADMIN` | Static Route |
| `/admin/attendance/kiosk` | `src/app/admin/attendance/kiosk/page.tsx` | `ADMIN` | Static Route |
| `/admin/attendance` | `src/app/admin/attendance/page.tsx` | `ADMIN` | Static Route |
| `/admin/budgets/new` | `src/app/admin/budgets/new/page.tsx` | `ADMIN` | Static Route |
| `/admin/budgets` | `src/app/admin/budgets/page.tsx` | `ADMIN` | Static Route |
| `/admin/budgets/periods` | `src/app/admin/budgets/periods/page.tsx` | `ADMIN` | Static Route |
| `/admin/budgets/projects` | `src/app/admin/budgets/projects/page.tsx` | `ADMIN` | Static Route |
| `/admin/budgets/[id]` | `src/app/admin/budgets/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/budgets/[id]/revisions` | `src/app/admin/budgets/[id]/revisions/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/budgets/[id]/variance` | `src/app/admin/budgets/[id]/variance/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/budgets/[id]/versions` | `src/app/admin/budgets/[id]/versions/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/business-intelligence` | `src/app/admin/business-intelligence/page.tsx` | `ADMIN` | Static Route |
| `/admin/calendar` | `src/app/admin/calendar/page.tsx` | `ADMIN` | Static Route |
| `/admin/cms` | `src/app/admin/cms/page.tsx` | `ADMIN` | Static Route |
| `/admin/command-center` | `src/app/admin/command-center/page.tsx` | `ADMIN` | Static Route |
| `/admin/communication` | `src/app/admin/communication/page.tsx` | `ADMIN` | Static Route |
| `/admin/communications` | `src/app/admin/communications/page.tsx` | `ADMIN` | Static Route |
| `/admin/compliance/evidence` | `src/app/admin/compliance/evidence/page.tsx` | `ADMIN` | Static Route |
| `/admin/compliance/exceptions` | `src/app/admin/compliance/exceptions/page.tsx` | `ADMIN` | Static Route |
| `/admin/compliance/obligations` | `src/app/admin/compliance/obligations/page.tsx` | `ADMIN` | Static Route |
| `/admin/compliance/obligations/[id]` | `src/app/admin/compliance/obligations/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/compliance` | `src/app/admin/compliance/page.tsx` | `ADMIN` | Static Route |
| `/admin/compliance/remediation` | `src/app/admin/compliance/remediation/page.tsx` | `ADMIN` | Static Route |
| `/admin/compliance/reports` | `src/app/admin/compliance/reports/page.tsx` | `ADMIN` | Static Route |
| `/admin/compliance/requirements/new` | `src/app/admin/compliance/requirements/new/page.tsx` | `ADMIN` | Static Route |
| `/admin/compliance/requirements` | `src/app/admin/compliance/requirements/page.tsx` | `ADMIN` | Static Route |
| `/admin/compliance/requirements/[id]` | `src/app/admin/compliance/requirements/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/compliance/reviews` | `src/app/admin/compliance/reviews/page.tsx` | `ADMIN` | Static Route |
| `/admin/content` | `src/app/admin/content/page.tsx` | `ADMIN` | Static Route |
| `/admin/contracts` | `src/app/admin/contracts/page.tsx` | `ADMIN` | Static Route |
| `/admin/contracts/renewals` | `src/app/admin/contracts/renewals/page.tsx` | `ADMIN` | Static Route |
| `/admin/contracts/[id]` | `src/app/admin/contracts/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/data-quality` | `src/app/admin/data-quality/page.tsx` | `ADMIN` | Static Route |
| `/admin/documents` | `src/app/admin/documents/page.tsx` | `ADMIN` | Static Route |
| `/admin/donations` | `src/app/admin/donations/page.tsx` | `ADMIN` | Static Route |
| `/admin/events` | `src/app/admin/events/page.tsx` | `ADMIN` | Static Route |
| `/admin/exams` | `src/app/admin/exams/page.tsx` | `ADMIN` | Static Route |
| `/admin/finance` | `src/app/admin/finance/page.tsx` | `ADMIN` | Static Route |
| `/admin/gatepass` | `src/app/admin/gatepass/page.tsx` | `ADMIN` | Static Route |
| `/admin/governance/actions` | `src/app/admin/governance/actions/page.tsx` | `ADMIN` | Static Route |
| `/admin/governance/controls` | `src/app/admin/governance/controls/page.tsx` | `ADMIN` | Static Route |
| `/admin/governance/exceptions` | `src/app/admin/governance/exceptions/page.tsx` | `ADMIN` | Static Route |
| `/admin/governance/findings` | `src/app/admin/governance/findings/page.tsx` | `ADMIN` | Static Route |
| `/admin/governance` | `src/app/admin/governance/page.tsx` | `ADMIN` | Static Route |
| `/admin/governance/reviews` | `src/app/admin/governance/reviews/page.tsx` | `ADMIN` | Static Route |
| `/admin/governance/risks/new` | `src/app/admin/governance/risks/new/page.tsx` | `ADMIN` | Static Route |
| `/admin/governance/risks` | `src/app/admin/governance/risks/page.tsx` | `ADMIN` | Static Route |
| `/admin/governance/risks/[id]` | `src/app/admin/governance/risks/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/guardians` | `src/app/admin/guardians/page.tsx` | `ADMIN` | Static Route |
| `/admin/helpdesk` | `src/app/admin/helpdesk/page.tsx` | `ADMIN` | Static Route |
| `/admin/helpdesk/requests/[id]` | `src/app/admin/helpdesk/requests/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/hostel` | `src/app/admin/hostel/page.tsx` | `ADMIN` | Static Route |
| `/admin/hr/employees/[id]` | `src/app/admin/hr/employees/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/hr` | `src/app/admin/hr/page.tsx` | `ADMIN` | Static Route |
| `/admin/idcards` | `src/app/admin/idcards/page.tsx` | `ADMIN` | Static Route |
| `/admin/integrations` | `src/app/admin/integrations/page.tsx` | `ADMIN` | Static Route |
| `/admin/inventory` | `src/app/admin/inventory/page.tsx` | `ADMIN` | Static Route |
| `/admin/knowledge/acknowledgements` | `src/app/admin/knowledge/acknowledgements/page.tsx` | `ADMIN` | Static Route |
| `/admin/knowledge/conflicts` | `src/app/admin/knowledge/conflicts/page.tsx` | `ADMIN` | Static Route |
| `/admin/knowledge/documents` | `src/app/admin/knowledge/documents/page.tsx` | `ADMIN` | Static Route |
| `/admin/knowledge` | `src/app/admin/knowledge/page.tsx` | `ADMIN` | Static Route |
| `/admin/knowledge/reviews` | `src/app/admin/knowledge/reviews/page.tsx` | `ADMIN` | Static Route |
| `/admin/library` | `src/app/admin/library/page.tsx` | `ADMIN` | Static Route |
| `/admin/notices` | `src/app/admin/notices/page.tsx` | `ADMIN` | Static Route |
| `/admin/operations` | `src/app/admin/operations/page.tsx` | `ADMIN` | Static Route |
| `/admin` | `src/app/admin/page.tsx` | `ADMIN` | Static Route |
| `/admin/procurement/contracts` | `src/app/admin/procurement/contracts/page.tsx` | `ADMIN` | Static Route |
| `/admin/procurement/contracts/[id]` | `src/app/admin/procurement/contracts/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/procurement/evaluations` | `src/app/admin/procurement/evaluations/page.tsx` | `ADMIN` | Static Route |
| `/admin/procurement` | `src/app/admin/procurement/page.tsx` | `ADMIN` | Static Route |
| `/admin/procurement/quotations` | `src/app/admin/procurement/quotations/page.tsx` | `ADMIN` | Static Route |
| `/admin/procurement/rfqs` | `src/app/admin/procurement/rfqs/page.tsx` | `ADMIN` | Static Route |
| `/admin/procurement/rfqs/[id]` | `src/app/admin/procurement/rfqs/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/procurement/vendors` | `src/app/admin/procurement/vendors/page.tsx` | `ADMIN` | Static Route |
| `/admin/procurement/vendors/[id]` | `src/app/admin/procurement/vendors/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/reports` | `src/app/admin/reports/page.tsx` | `ADMIN` | Static Route |
| `/admin/results` | `src/app/admin/results/page.tsx` | `ADMIN` | Static Route |
| `/admin/security` | `src/app/admin/security/page.tsx` | `ADMIN` | Static Route |
| `/admin/settings` | `src/app/admin/settings/page.tsx` | `ADMIN` | Static Route |
| `/admin/students` | `src/app/admin/students/page.tsx` | `ADMIN` | Static Route |
| `/admin/students/[id]` | `src/app/admin/students/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/surveys` | `src/app/admin/surveys/page.tsx` | `ADMIN` | Static Route |
| `/admin/surveys/[id]` | `src/app/admin/surveys/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/teachers` | `src/app/admin/teachers/page.tsx` | `ADMIN` | Static Route |
| `/admin/training/assessments` | `src/app/admin/training/assessments/page.tsx` | `ADMIN` | Static Route |
| `/admin/training/certificates` | `src/app/admin/training/certificates/page.tsx` | `ADMIN` | Static Route |
| `/admin/training` | `src/app/admin/training/page.tsx` | `ADMIN` | Static Route |
| `/admin/training/participants` | `src/app/admin/training/participants/page.tsx` | `ADMIN` | Static Route |
| `/admin/training/programs` | `src/app/admin/training/programs/page.tsx` | `ADMIN` | Static Route |
| `/admin/training/renewals` | `src/app/admin/training/renewals/page.tsx` | `ADMIN` | Static Route |
| `/admin/training/sessions` | `src/app/admin/training/sessions/page.tsx` | `ADMIN` | Static Route |
| `/admin/transport` | `src/app/admin/transport/page.tsx` | `ADMIN` | Static Route |
| `/admin/users` | `src/app/admin/users/page.tsx` | `ADMIN` | Static Route |
| `/admin/vendors/new` | `src/app/admin/vendors/new/page.tsx` | `ADMIN` | Static Route |
| `/admin/vendors` | `src/app/admin/vendors/page.tsx` | `ADMIN` | Static Route |
| `/admin/vendors/[id]` | `src/app/admin/vendors/[id]/page.tsx` | `ADMIN` | Dynamic Segment (`[param]`) |
| `/admin/workflows` | `src/app/admin/workflows/page.tsx` | `ADMIN` | Static Route |

### Teacher Panel (16 Routes)

| Route URL | Component File Path | Primary Role | Route Type |
| :--- | :--- | :---: | :---: |
| `/teacher/attendance` | `src/app/teacher/attendance/page.tsx` | `TEACHER` | Static Route |
| `/teacher/calendar` | `src/app/teacher/calendar/page.tsx` | `TEACHER` | Static Route |
| `/teacher/classes` | `src/app/teacher/classes/page.tsx` | `TEACHER` | Static Route |
| `/teacher/events` | `src/app/teacher/events/page.tsx` | `TEACHER` | Static Route |
| `/teacher/exams` | `src/app/teacher/exams/page.tsx` | `TEACHER` | Static Route |
| `/teacher/hostel` | `src/app/teacher/hostel/page.tsx` | `TEACHER` | Static Route |
| `/teacher/inventory` | `src/app/teacher/inventory/page.tsx` | `TEACHER` | Static Route |
| `/teacher/leave` | `src/app/teacher/leave/page.tsx` | `TEACHER` | Static Route |
| `/teacher/library` | `src/app/teacher/library/page.tsx` | `TEACHER` | Static Route |
| `/teacher/notes` | `src/app/teacher/notes/page.tsx` | `TEACHER` | Static Route |
| `/teacher/notices` | `src/app/teacher/notices/page.tsx` | `TEACHER` | Static Route |
| `/teacher` | `src/app/teacher/page.tsx` | `TEACHER` | Static Route |
| `/teacher/profile` | `src/app/teacher/profile/page.tsx` | `TEACHER` | Static Route |
| `/teacher/results` | `src/app/teacher/results/page.tsx` | `TEACHER` | Static Route |
| `/teacher/routine` | `src/app/teacher/routine/page.tsx` | `TEACHER` | Static Route |
| `/teacher/transport` | `src/app/teacher/transport/page.tsx` | `TEACHER` | Static Route |

### Principal Panel (6 Routes)

| Route URL | Component File Path | Primary Role | Route Type |
| :--- | :--- | :---: | :---: |
| `/principal/issues` | `src/app/principal/issues/page.tsx` | `PRINCIPAL` | Static Route |
| `/principal/notices` | `src/app/principal/notices/page.tsx` | `PRINCIPAL` | Static Route |
| `/principal/operations` | `src/app/principal/operations/page.tsx` | `PRINCIPAL` | Static Route |
| `/principal/overview` | `src/app/principal/overview/page.tsx` | `PRINCIPAL` | Static Route |
| `/principal` | `src/app/principal/page.tsx` | `PRINCIPAL` | Static Route |
| `/principal/reports` | `src/app/principal/reports/page.tsx` | `PRINCIPAL` | Static Route |

### Student & Guardian Portal (27 Routes)

| Route URL | Component File Path | Primary Role | Route Type |
| :--- | :--- | :---: | :---: |
| `/guardian` | `src/app/guardian/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/academic` | `src/app/portal/academic/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/alumni` | `src/app/portal/alumni/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/attendance` | `src/app/portal/attendance/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/calendar` | `src/app/portal/calendar/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/certificates` | `src/app/portal/certificates/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/children` | `src/app/portal/children/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/dashboard` | `src/app/portal/dashboard/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/documents` | `src/app/portal/documents/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/events` | `src/app/portal/events/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/finance` | `src/app/portal/finance/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/helpdesk/new` | `src/app/portal/helpdesk/new/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/helpdesk` | `src/app/portal/helpdesk/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/helpdesk/[id]` | `src/app/portal/helpdesk/[id]/page.tsx` | `GUARDIAN / STUDENT` | Dynamic Segment (`[param]`) |
| `/portal/hostel` | `src/app/portal/hostel/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/knowledge` | `src/app/portal/knowledge/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/library` | `src/app/portal/library/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/notifications` | `src/app/portal/notifications/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal` | `src/app/portal/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/requests` | `src/app/portal/requests/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/results` | `src/app/portal/results/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/routine` | `src/app/portal/routine/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/surveys` | `src/app/portal/surveys/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/training/certificates` | `src/app/portal/training/certificates/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/training` | `src/app/portal/training/page.tsx` | `GUARDIAN / STUDENT` | Static Route |
| `/portal/training/[id]` | `src/app/portal/training/[id]/page.tsx` | `GUARDIAN / STUDENT` | Dynamic Segment (`[param]`) |
| `/portal/transport` | `src/app/portal/transport/page.tsx` | `GUARDIAN / STUDENT` | Static Route |

### Authentication & Login (4 Routes)

| Route URL | Component File Path | Primary Role | Route Type |
| :--- | :--- | :---: | :---: |
| `/login/admin` | `src/app/login/admin/page.tsx` | `PUBLIC` | Static Route |
| `/login/guardian` | `src/app/login/guardian/page.tsx` | `PUBLIC` | Static Route |
| `/login` | `src/app/login/page.tsx` | `PUBLIC` | Static Route |
| `/login/teacher` | `src/app/login/teacher/page.tsx` | `PUBLIC` | Static Route |

### PWA / Web App (1 Routes)

| Route URL | Component File Path | Primary Role | Route Type |
| :--- | :--- | :---: | :---: |
| `/app` | `src/app/app/page.tsx` | `PUBLIC / HYBRID` | Static Route |

---

## 3. Discovered API Surface Summary

In addition to the 194 UI page routes, the application contains **114 backend API route handlers** located in `src/app/api/`:
- **`api/admin/*`**: 62 endpoints (academics, admissions, attendance, exams, fees, ledger, hostel, transport, library, staff, system settings)
- **`api/teacher/*`**: 14 endpoints (assigned classes, marks entry, attendance submission, leaves, syllabus)
- **`api/principal/*`**: 8 endpoints (institutional analytics, audit logs, approval queues)
- **`api/portal/*`**: 12 endpoints (student profile, attendance history, invoices, receipt verification, notice feeds)
- **`api/public/*` & Unauthenticated**: 18 endpoints (admissions tracking, public results verification, public notices, prayer times, contact form, payment webhooks)

---

## 4. Discovery Methodology & Invariant

Every entry in this inventory was discovered through direct AST/filesystem traversal of `src/app/**/page.tsx` and verified against Next.js App Router route manifests. Zero speculative or phantom routes are included.
