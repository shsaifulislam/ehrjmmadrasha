# EHRJ MADRASHA ERP — PHASE 26
## BUSINESS INTELLIGENCE, FORECASTING & EARLY-WARNING AUDIT & GOVERNANCE REPORT

**Audit Date:** 2026-09-29  
**System:** Eliotganj Hazi Rohmatollah Jamiria Madrasha ERP  
**Auditor:** Senior Data Architect, BI Architect, and Data Governance Engineer  
**Checkpoint ID:** `EHRJ-AI-2026-PHASE26`  

---

### 1. METRIC INVENTORY

The EHRJ ERP contains established analytical metrics across Phase 15 and Phase 25. The audited inventory includes:

| Metric Code | Metric Name (Bangla / English) | Domain | Unit / Grain | Existing Formula / Logic |
|---|---|---|---|---|
| `METRIC-STU-001` | মোট সক্রিয় শিক্ষার্থী (Total Active Students) | Student | Count (Current) | `COUNT(Student WHERE status='ACTIVE')` |
| `METRIC-STU-002` | আবাসিক বন্টন (Residential Distribution) | Student | Breakdown (Count) | `GROUP_BY(residentialStatus WHERE status='ACTIVE')` |
| `METRIC-ADM-001` | মোট ভর্তি আবেদন (Total Admissions Applications) | Admission | Count (Session/Range) | `COUNT(Application WHERE dateFilter)` |
| `METRIC-ADM-002` | ভর্তি রূপান্তর হার (Admission Conversion Rate) | Admission | Percentage (%) | `(Approved / Total Applications) * 100` |
| `METRIC-ATT-001` | দৈনিক উপস্থিতি হার (Daily Attendance Rate) | Attendance | Percentage (%) | `((Present + Late) / Total Marked) * 100` |
| `METRIC-ATT-002` | দীর্ঘমেয়াদী অনুপস্থিতি (Chronic Absence) | Attendance | Count / Student | `COUNT(Attendance WHERE status='ABSENT') >= Threshold` |
| `METRIC-ACAD-001` | প্রাতিষ্ঠানিক পাসের হার (Institutional Pass Rate) | Academic | Percentage (%) | `(COUNT(Passed) / COUNT(Published Results)) * 100` |
| `METRIC-ACAD-002` | জিপিএ ও মুমতাজ হার (GPA & Mumtaz Honors Rate) | Academic | Percentage (%) | `(COUNT(Grade='মুমতাজ') / Total Published) * 100` |
| `METRIC-FIN-001` | মোট আদায়কৃত ফি (Total Fees Collected) | Finance | BDT (Currency) | `SUM(PaymentReceipt.amount WHERE status='SUCCESSFUL') - SUM(Refund)` |
| `METRIC-FIN-002` | মোট বকেয়া ফি (Outstanding Dues) | Finance | BDT (Currency) | `SUM(FeeInvoice.dueAmount WHERE status IN ['UNPAID','PARTIAL','OVERDUE'])` |
| `METRIC-FIN-003` | মোট ব্যয় (Total Operating Expenses) | Finance | BDT (Currency) | `SUM(CashTransaction.amount WHERE type='EXPENSE')` |
| `METRIC-FIN-004` | তহবিল উদ্বৃত্ত (Fund Balance Distribution) | Finance | BDT per Fund | `SUM(CashFund.currentBalance) grouped by Fund Code` |
| `METRIC-INV-001` | মোট সম্পদ মূল্যায়ন (Physical Asset Valuation) | Inventory | BDT (Currency) | `SUM(InventoryAsset.purchaseCost WHERE status != 'DISPOSED')` |
| `METRIC-INV-002` | নিম্ন স্টক আইটেম সংখ্যা (Low Stock Items) | Inventory | Count (Items) | `COUNT(InventoryStockBalance WHERE currentBalance <= minThreshold)` |
| `METRIC-LIB-001` | সক্রিয় বই ঋণ ও মেয়াদোত্তীর্ণ হার (Active & Overdue Loans) | Library | Count / Rate (%) | `COUNT(LibraryIssue WHERE status='ISSUED' / 'OVERDUE')` |
| `METRIC-HR-001` | সক্রিয় কর্মী ও মাসিক বেতন বিল (Active Staff & Payroll Bill) | HR | Count / BDT | `COUNT(Employee WHERE status='ACTIVE'), SUM(PayrollRecord.netSalary)` |
| `METRIC-OPS-001` | উন্মুক্ত ও জরুরি হেল্পডেস্ক টিকিট (Open & Urgent Tickets) | Helpdesk | Count (Tickets) | `COUNT(SupportRequest WHERE status IN OPEN_STATES AND priority='URGENT')` |

---

### 2. AUTHORITATIVE SOURCE MAP

To enforce the invariant **"ONE SOURCE OF TRUTH — NEVER MAINTAIN MANUAL KPI NUMBERS"**, the authoritative tables and services producing these metrics are strictly bound:

```
┌─────────────────────────────────┬──────────────────────────────────────────────┐
│ Analytical Domain               │ Authoritative Source Models (Prisma)        │
├─────────────────────────────────┼──────────────────────────────────────────────┤
│ Student Master & Demographics   │ Student, Enrollment, JamatClass, Section     │
│ Admissions & Conversion         │ Application, AdmissionSession                │
│ Attendance & Baselines          │ Attendance, AttendanceLock, Enrollment       │
│ Examination & Academic Results  │ Exam, ExamSubject, Result, ExamMark          │
│ Fee Invoicing & Receivables     │ FeeInvoice, InvoiceItem, FeeStructure        │
│ Collections & Receipts          │ PaymentReceipt, Refund                       │
│ Cash Ledger & Disbursements     │ CashTransaction, CashFund                    │
│ Library Operations              │ LibraryBookCopy, LibraryIssue, LibraryMember │
│ Inventory & Physical Assets     │ InventoryAsset, InventoryStockBalance        │
│ Human Resources & Payroll       │ Employee, PayrollRecord, EmployeeLeaveRequest│
│ Customer Care & Helpdesk        │ SupportRequest, SupportRequestStatusHistory  │
│ Institutional Knowledge / RAG   │ KnowledgeDocument, SearchAudit               │
│ Data Quality Health / Issues    │ DataQualityIssue (from Phase 25)             │
└─────────────────────────────────┴──────────────────────────────────────────────┘
```

---

### 3. DATA SUFFICIENCY AUDIT

Direct query of `prisma/dev.db` reveals the following temporal data distribution:

| Domain | Historical Records | Distinct Time Periods | Sufficiency Classification | Forecasting Readiness |
|---|---|---|---|---|
| **Enrollment** | 102 active enrollments | 2 academic sessions (`২০২৫-২০২৬`, `2026`) | **MODERATE** | Session-level enrollment trend forecasting possible with linear baseline. |
| **Finance (Revenue)** | 45 receipts (৳22,500) | Concentrated in `2026-09` | **INSUFFICIENT** | Insufficient monthly history for pure time-series forecasting. **Must trigger Rule 5 Insufficiency Guard** unless multi-period data is provided. |
| **Finance (Expenses)** | 78 transactions (৳162,900) | Concentrated in `2026-09` | **INSUFFICIENT** | Requires rolling baseline $\ge 3$ months. Insufficiency guard must be active. |
| **Attendance** | 16 daily records | 2 dates | **INSUFFICIENT** | Daily rate available; seasonal absence forecasting requires historical baseline. |
| **Results** | 34 published results | 2 exams | **LOW / BASELINE** | Pass rate baseline available; grade shift projection requires prior term exam. |
| **Admissions** | 69 applications | 1 campaign | **MODERATE** | Stage conversion analytics available; multi-year seasonal demand requires prior intake data. |
| **Inventory** | 41 stock balances, 16 assets | Current snapshot + 152 tx | **SUFFICIENT** | Consumption velocity and stockout horizon forecasting is viable. |
| **Helpdesk** | 15 tickets | Active distribution | **SUFFICIENT** | SLA backlog & ticket resolution trend analysis viable. |

> **CRITICAL BI INVARIANT:**
> Under **RULE 5**, when temporal periods $N < 3$, the system must return `status: "INSUFFICIENT_DATA"` with a clear explanatory notice:  
> *"ঐতিহাসিক তথ্যের স্বল্পতার কারণে এই সূচকের জন্য নির্ভরযোগ্য পূর্বাভাস (Forecasting) এখনো তৈরি করা সম্ভব নয়। নূন্যতম ৩টি সময়কালের তথ্য প্রয়োজন।"*  
> **Manufacturing fake forecasts is strictly prohibited.**

---

### 4. DATA QUALITY INTEGRATION (PHASE 25)

The BI engine directly reads the data quality registry:
- Active issues in `data/governance/data_quality_issues.json` are evaluated for each reporting period.
- If open issues exist in the selected domain (e.g. un-reconciled receipts or roll collisions), the BI dashboard injects a **Data Quality Advisory Banner**:
  - *"সতর্কতা: নির্বাচিত সময়কালের আর্থিক লেনদেনে অমীমাংসিত ডেটা কোয়ালিটি বা রিকনসিলিয়েশন সমস্যা রয়েছে। এই পূর্বাভাস ও পরিসংখ্যান সতর্কতার সাথে বিশ্লেষণ করুন।"*

---

### 5. FORECAST CANDIDATES & METHODOLOGIES

Where data sufficiency is met ($N \ge 3$ periods), the following simple, explainable models are approved:

1. **Student Enrollment & Retention:**
   - *Method:* Double Exponential Smoothing (Holt's Linear Trend) with session step.
   - *Outputs:* Projected enrollment, Upper/Lower 95% Confidence Bounds ($\pm 1.96 \sigma$).
2. **Monthly Fee Collections:**
   - *Method:* Weighted Moving Average (WMA with weights 0.5, 0.3, 0.2 for latest 3 months) or Seasonal Factor where available.
   - *Outputs:* Projected cash inflow, collection uncertainty range.
3. **Operational Expenditure (OPEX):**
   - *Method:* Simple Moving Average (SMA-3) + Linear Trend.
   - *Outputs:* Projected operational burn rate, stress factor.
4. **Inventory Consumption & Reorder Horizon:**
   - *Method:* Average Daily Burn Rate (Runway calculation: $\text{Current Balance} / \text{Daily Consumption}$).
   - *Outputs:* Estimated stockout date and recommended reorder date.
5. **Admissions Application Intake:**
   - *Method:* Application Velocity Curve (Current applications / Days elapsed $\times$ Total Campaign Days).

---

### 6. EARLY-WARNING CANDIDATES & MEASURABLE THRESHOLDS

Operational indicators with deterministic triggers:

| Indicator Code | Domain | Condition / Trigger Threshold | Severity | Audience | Non-Punitive Observable Message |
|---|---|---|---|---|---|
| `EW-ATT-001` | Attendance | Class attendance $< 75\%$ over 3 consecutive days | `WARNING` | Teacher, Admin | "নির্দিষ্ট জামাতে গড় উপস্থিতি নির্ধারিত ৭৫% সীমার নিচে রয়েছে।" |
| `EW-ATT-002` | Attendance | Individual student absent $\ge 3$ consecutive days | `NOTICE` | Teacher, Guardian | "শিক্ষার্থীর সাম্প্রতিক উপস্থিতি পূর্ববর্তী গড় থেকে হ্রাস পেয়েছে।" |
| `EW-FIN-001` | Finance | Monthly collection $< 70\%$ of billed dues by 20th | `HIGH` | Principal, Admin | "চলতি মাসে বিলকৃত ফির বিপরীতে আদায় প্রত্যাশিত হারের চেয়ে কম।" |
| `EW-FIN-002` | Finance | Operating balance covers $< 1$ month of payroll | `CRITICAL` | Principal, Admin | "সাধারণ তহবিলের নগদ স্থিতি এক মাসের বেতন ব্যয়ের কাছাকাছি পৌঁছেছে।" |
| `EW-INV-001` | Inventory | Item stock $\le$ Minimum Reorder Level (or $< 7$ days runway) | `WARNING` | Admin, Storekeeper | "মালামালের মজুদ নির্ধারিত রি-অর্ডার সীমার নিচে পৌঁছেছে।" |
| `EW-HR-001` | HR | Employee leave approval $> 25\%$ of faculty concurrently | `HIGH` | Principal | "একই সময়ে উল্লেখযোগ্য সংখ্যক শিক্ষক ছুটিতে থাকায় ক্লাসের বিকল্প পরিকল্পনা প্রয়োজন।" |
| `EW-OPS-001` | Operations | Urgent helpdesk tickets pending $> 48$ hours | `WARNING` | Admin | "জরুরি ক্যাটাগরির সহায়তা টিকিট নির্ধারিত সময়ের বেশি অনিষ্পন্ন রয়েছে।" |
| `EW-ACAD-001` | Academic | Subject failure rate $> 30\%$ in published term exam | `WARNING` | Teacher, Principal | "উক্ত বিষয়ে ফলাফল পাসের গড় হার মাদরাসার স্বাভাবিক বেঞ্চমার্কের নিচে।" |

> **PREDICTION SAFETY INVARIANT:**
> No warning may label any student or teacher as "lazy", "incompetent", "failing", or "problematic". Warnings must record only objective, observable facts.

---

### 7. PRIVACY & RBAC REVIEW

The BI system strictly respects role boundaries:
- **`SUPER_ADMIN` / `ADMIN`:** Full access to institutional BI, trends, forecasts, early warnings, and scenario modeling.
- **`PRINCIPAL`:** Full institutional oversight; restricted from editing raw model definitions or manipulating internal parameters.
- **`TEACHER`:** Scoped strictly to assigned Jamats/Classes (class attendance trends, subject averages, class-level early warnings). Strictly blocked from institutional financial ledgers, salary data, and Zakat funds.
- **`GUARDIAN`:** Scoped strictly to their linked children. Individual child attendance and fee progress only. Strictly blocked from comparative rankings and institutional early warnings.
- **Financial Privacy:** Zakat & Lillah donor names are completely masked (`***`) on aggregate trend views. Individual salary sheets remain strictly confidential to HR/Finance.

---

### 8. ARCHITECTURE GAP ANALYSIS & IMPLEMENTATION PLAN

**Identified Gaps in Current System:**
1. No dedicated **Forecasting Engine** with mathematical trend analysis, moving averages, or confidence bounds.
2. No formal **Governed Metric Dictionary** with versioning, ownership, and audit trail.
3. No proactive **Early-Warning Engine** with state machine (`DETECTED` $\to$ `ACKNOWLEDGED` $\to$ `INVESTIGATING` $\to$ `RESOLVED` / `DISMISSED`) and alert deduplication.
4. No **Scenario Analysis Engine** (Base, Conservative, Stress, Custom what-if modeling) isolated from real financial tables.
5. No unified Admin BI Portal at `/admin/business-intelligence`.

**Prioritized Implementation Plan:**
- **Step 1:** Create [`src/lib/biMetricDictionary.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/biMetricDictionary.ts) (governed dictionary, versions, formulas).
- **Step 2:** Create [`src/lib/forecastingEngine.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/forecastingEngine.ts) (SMA, WMA, Holt's linear trend, linear regression, backtesting error MAE/MAPE, uncertainty intervals, insufficiency guards).
- **Step 3:** Create [`src/lib/earlyWarningEngine.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/earlyWarningEngine.ts) (rule catalog, detector, deduplicator, FSM lifecycle, persistence).
- **Step 4:** Create [`src/lib/scenarioEngine.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/scenarioEngine.ts) (cash flow & operational stress testing, hypothetical isolation).
- **Step 5:** Create Admin & Portal BI API Endpoints (`/api/admin/bi/*`).
- **Step 6:** Build the responsive Admin BI Dashboard at [`src/app/admin/business-intelligence/page.tsx`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/app/admin/business-intelligence/page.tsx).
- **Step 7:** Write comprehensive test suite in `scratch/test_phase26_bi_engine.ts` and verify with all regression suites.
