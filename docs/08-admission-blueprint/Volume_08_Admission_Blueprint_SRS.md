# Volume 08 – Admission & Student Onboarding Blueprint (Enterprise SRS)

**Document ID:** EHRJ-SRS-V08  
**Version:** 1.0  
**Status:** Draft Architecture  
**Priority:** Critical  

---

## 1. Purpose & Scope
Admission Module হলো পুরো ERP-এর প্রধান Entry Point।
এই মডিউলের মাধ্যমে একজন Applicant পর্যায়ক্রমে:
`Applicant` ➔ `Admission` ➔ `Guardian` ➔ `Student` ➔ `User Account` ➔ `Student360` ➔ `Finance` ➔ `Accounting` ➔ `Dashboard` ➔ `Notification` ➔ `Website`
এর সাথে সম্পূর্ণ অটোমেটেড এবং রিলেশনালভাবে সংযুক্ত হবে।
কোনো তথ্য Hardcoded হবে না; সমস্ত ডাটাবেস ও কনফিগারেশন Dynamic থাকবে।

---

## 2. Complete End-to-End Admission Workflow

```text
Online/Offline Form
       │
       ▼
   Draft Save ──► OTP Verification ──► Final Submit ──► Duplicate Check
                                                              │
                                                              ▼
                                                        Pending Queue
                                                              │
                                                              ▼
                                                    Document Verification
                                                              │
                                                              ▼
                                                     Interview (Optional)
                                                              │
                                                              ▼
                                                      Approve / Reject
                                                              │
                                       ┌──────────────────────┴──────────────────────┐
                                       ▼                                             ▼
                                  [ Rejected ]                                  [ Approved ]
                                       │                                             │
                             SMS & Email Notice                             BEGIN DB TRANSACTION
                                                                                     │
                                                                     Create Guardian, Student & User
                                                                                     │
                                                                     Generate Student ID, Roll, Barcode, QR
                                                                                     │
                                                                     Generate Invoice & Journal Entries
                                                                                     │
                                                                     Initialize Student360 & Audit Log
                                                                                     │
                                                                           COMMIT DB TRANSACTION
                                                                                     │
                                                                     Send Approval SMS/Email & Active Tracking
```

---

## 3. Applicant Journey
```text
Applicant Website ➔ Admission Form ➔ Upload Documents ➔ Save Draft ➔ Resume Later ➔ Submit ➔ Tracking Number ➔ Track Status ➔ Receive SMS ➔ Approval ➔ Payment ➔ Download Receipt ➔ Student Login Portal
```

---

## 4. Complete Sitemap (Public & Admin Routes)

### Public Admission Pages
- `/admission`
- `/admission/apply`
- `/admission/draft`
- `/admission/requirements`
- `/admission/fees`
- `/admission/eligibility`
- `/admission/faq`
- `/admission/track`
- `/admission/payment`
- `/admission/receipt`
- `/admission/download`
- `/admission/verification`

### Admin ERP Admission Pages
- `/admin/admissions/dashboard`
- `/admin/admissions/pending`
- `/admin/admissions/approved`
- `/admin/admissions/rejected`
- `/admin/admissions/draft`
- `/admin/admissions/online`
- `/admin/admissions/offline`
- `/admin/admissions/create`
- `/admin/admissions/[id]`
- `/admin/admissions/[id]/documents`
- `/admin/admissions/[id]/timeline`
- `/admin/admissions/[id]/payments`
- `/admin/admissions/[id]/receipt`
- `/admin/admissions/[id]/approval-letter`
- `/admin/admissions/[id]/id-slip`
- `/admin/admissions/[id]/print`
- `/admin/admissions/[id]/pdf`
- `/admin/admissions/import`
- `/admin/admissions/export`
- `/admin/admissions/settings`
- `/admin/admissions/reports`
- `/admin/admissions/audit-logs`
- `/admin/admissions/analytics`

---

## 5. Comprehensive Admission Form Structure
1. **Personal Information:** Full Name, Bangla Name, Photo, DOB, Gender, Blood Group, Birth Registration No, NID, Religion, Nationality, Previous School & TC Details.
2. **Guardian Information:** Father Info, Mother Info, Local Guardian Info, Occupation, Income, Phone, Email, NID, Address, Emergency Contact.
3. **Academic Selection:** Session, Department, Class, Section, Shift, Group, Medium, Previous GPA, Previous Roll.
4. **Address Details:** Present Address, Permanent Address (District, Thana, Village, Post Code).
5. **Medical & Special Requirements:** Blood Group, Disability, Allergies, Emergency Medical Notes.
6. **Hostel & Transport Options:** Hostel Choice, Room Preference, Meal Plan, Transport Pickup Point & Route Selection.
7. **Document Upload Vault:** Birth Cert, Photo, Marksheet, Testimonial, Guardian NID, Character Cert, Transfer Cert, Medical Cert.

---

## 6. Admission Lifecycle Statuses
- `Draft`, `Pending`, `Under Review`, `Documents Pending`, `Interview`, `Approved`, `Rejected`, `Cancelled`, `Expired`, `Archived`

---

## 7. Approval Transaction Isolation (Prisma Atomic Spec)
```typescript
await prisma.$transaction(async (tx) => {
  const guardian = await tx.guardian.create({...});
  const student = await tx.student.create({...});
  const user = await tx.user.create({...});
  await tx.userRole.create({...});
  
  // Assign ID, Roll, Barcode & QR Code
  const studentId = await generateStudentId(tx);
  const roll = await generateRollNumber(tx);
  const qrCode = await generateQRCode(studentId);
  
  // Finance & Accounting Execution
  const invoice = await tx.invoice.create({...});
  const journal = await tx.journalEntry.create({...});
  await tx.journalLine.createMany({...});
  
  // Initialization & Queues
  await tx.student360.create({...});
  await tx.notification.create({...});
  await tx.sMSQueue.create({...});
  await tx.emailQueue.create({...});
  await tx.auditLog.create({...});
});
// Automated Rollback on any failure
```

---

## 8. Database Tables & Entity Map
- `Admission`, `Guardian`, `Student`, `User`, `Role`, `Invoice`, `InvoiceItem`, `Payment`, `Receipt`, `JournalEntry`, `JournalLine`, `AuditLog`, `Notification`, `SMSQueue`, `EmailQueue`, `Student360`, `Document`, `ActivityTimeline`

---

## 9. REST API Integration Contracts

### Public API Endpoints
- `POST /api/v1/admission`
- `PUT /api/v1/admission/draft`
- `GET /api/v1/admission/track`
- `GET /api/v1/admission/requirements`
- `GET /api/v1/admission/fees`
- `GET /api/v1/admission/eligibility`
- `GET /api/v1/admission/status`
- `GET /api/v1/admission/download`

### Admin API Endpoints
- `GET /api/v1/admin/admissions`
- `GET /api/v1/admin/admissions/dashboard`
- `GET /api/v1/admin/admissions/:id`
- `POST /api/v1/admin/admissions`
- `PUT /api/v1/admin/admissions/:id`
- `DELETE /api/v1/admin/admissions/:id`
- `POST /api/v1/admin/admissions/:id/approve`
- `POST /api/v1/admin/admissions/:id/reject`
- `POST /api/v1/admin/admissions/import`
- `GET /api/v1/admin/admissions/export`
- `GET /api/v1/admin/admissions/report`
- `GET /api/v1/admin/admissions/statistics`

---

## 10. Verification & 26-Point Completion Checklist
Admission Module তখনই সম্পূর্ণ হিসেবে গণ্য হবে যখন নিচের ২৬টি পয়েন্ট বাস্তবে যাচাই করা হবে:
- [ ] Database Schema & Prisma Relations verified
- [ ] Service Layer & Business Logic implemented
- [ ] Controller Layer & Validations complete
- [ ] All Public Pages operational
- [ ] All Admin Pages operational
- [ ] Finance Invoice & Collection integration active
- [ ] Accounting Double Entry Journal & Ledger posting verified
- [ ] Student360 Initialization active
- [ ] Core Dashboard Counters & Analytics active
- [ ] Notification System (SMS, Email) queued
- [ ] Print Templates (Form, Receipt, Admit Card) functional
- [ ] PDF Generation engine operational
- [ ] QR Code & Barcode Generator working
- [ ] CSV/Excel Import & Export tested
- [ ] Search Engine & Multi-criteria Filter active
- [ ] Reports Engine active
- [ ] Responsive UI across Desktop, Tablet, Mobile
- [ ] Playwright E2E Test Suite Passed: `Apply` ➔ `Verify` ➔ `Approve` ➔ `Student` ➔ `Invoice` ➔ `Payment` ➔ `Receipt` ➔ `Student360`
- [ ] Clean Production Build (`npm run build`)
- [ ] Runtime Verification Passed
- [ ] Physical Screenshot Evidence captured
- [ ] Physical Video Evidence recorded
