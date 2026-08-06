# Volume 17 – Certificate & Document Management Blueprint (EHRJ-SRS-V17)

**Document Code:** EHRJ-SRS-V17  
**Module:** Certificate & Document Management Blueprint  
**Applies To:** Registrar Office, Exam Controller, HR, Students, Employees, Public Verification Portal  

---

## 1. Purpose & Core Generation Scope
EHRJ Madrasha ERP-এর সমস্ত আইডি কার্ড (Student & Employee ID Cards), অ্যাডমিট কার্ড, মার্কশিট, একাডেমিক ট্রান্সক্রিপ্ট, টেস্টিমোনিয়াল, চারিত্রিক সনদ, ছাড়পত্র (Transfer Certificate), অভিজ্ঞতা সনদ, পে-স্লিপ, ফি রসিদ এবং কাস্টম প্রসেস্ড ডকুমেন্টের ডিজিটাল টেমপ্লেটিং, ডিজিটাল সিগনেচার পোস্টিং, কিউআর পাবলিক ভেরিফিকেশন এবং সিকিউর ডকুমেন্ট ভল্ট এই মডিউলের মাধ্যমে অটোমেটেড হবে।

```text
Template Design ➔ Multi-Dept Clearance Verification ➔ Dynamic Field Merge ➔ Digital Hash Signature ➔ Barcode & QR Code Injection ➔ PDF Batch Generation ➔ Public QR Verification Portal
```

---

## 2. Core Generation & Verification Engines

### A. Dynamic Template & Merge Engine
- **Supported Canvas Sizes:** A4, A5, Letter, Custom Dimensions.
- **Dynamic Field Injection:** Student Name, Roll No, Registration No, Session, Class, Section, GPA/CGPA, Certificate No, Issue Date, Principal/Controller Signature.
- **Visual Branding:** Institution Logo, Custom Border, Anti-Tamper Background Watermark.

### B. Digital Signature & Public QR Verification
- **Digital Hash Signature:** অধ্যক্ষ, পরীক্ষা নিয়ন্ত্রক ও অর্থ কর্মকর্তার ইমেজেড সিগনেচার উইথ টাইমস্ট্যাম্প ও এনক্রিপ্টেড ডিজিটাল হ্যাশ।
- **Public Verification Portal:** কিউআর কোড স্ক্যান অথবা মেটা সার্টিফিকেট আইডি ইনপুট করে পাবলিক ওয়েবসাইটে সার্টিফিকেটের বৈধতা (`Valid`, `Invalid`, `Revoked`) যাচাইকরণ।

### C. Transfer Certificate (TC) Multi-Dept Clearance Workflow
```text
TC Application ➔ Academic Dept Clearance ➔ Library Book Clearance ➔ Hostel Fee Clearance ➔ Finance Due Clearance ➔ Final Approval ➔ Auto-Generate Transfer Certificate (TC)
```
- **Finance Clearance Guardrail Policy:** অর্থ বা লাইব্রেরি বকেয়া থাকলে ট্রান্সফার বা কারেক্টার সার্টিফিকেট জেনারেট সম্পূর্ণ ব্লক রাখা।

### D. Bulk Certificate & Batch Printing Engine
- **Mass Generation:** পুরো ক্লাস বা সেশনের জন্য এক ক্লিকে ১০০০+ এডমিট কার্ড, আইডি কার্ড বা মার্কশিট অটোমেটিক জেনারেট।
- **PDF Merge & Zip Download:** প্রিন্টিং সার্ভারে পিডিএফ মার্চিং, দুমুখো প্রিন্টিং এবং অটোমেটিক জিপ ফাইল ডাউনলোড।

---

## 3. Integrations with Portals & ERP Core
- **Student360 Sync:** শিক্ষার্থীর অর্জিত সমস্ত সনদ, আইডি কার্ড ও এডমিট কার্ডের ডিজিটাল কপি এবং পাবলিক ভেরিফিকেশন লিঙ্ক লাইভ ভিউ।
- **Finance & HR Integration:** স্যালারি ও এক্সপেরিয়েন্স সার্টিফিকেটের জন্য HR সিঙ্ক এবং বকেয়া না থাকার ভ্যালিডেশন চেক।

---

## 4. REST API Integration Contracts (17 API Groups)
- `GET /api/v1/certificates/templates`
- `POST /api/v1/certificates/templates`
- `POST /api/v1/certificates/generate`
- `POST /api/v1/certificates/bulk-generate`
- `GET /api/v1/certificates/verify/:certNo`
- `GET /api/v1/certificates/qr-verify/:qrHash`
- `GET /api/v1/certificates/document-vault`
- `POST /api/v1/certificates/document-vault/upload`
- `GET /api/v1/certificates/id-cards/student`
- `GET /api/v1/certificates/id-cards/employee`
- `GET /api/v1/certificates/admit-cards`
- `GET /api/v1/certificates/transcripts`
- `POST /api/v1/certificates/tc/clearance`
- `GET /api/v1/certificates/reports`
- `GET /api/v1/certificates/dashboard`

---

## 5. Master Database Entities Mapped (25 Core Entities)
`CertificateTemplate`, `CertificateTemplateField`, `Certificate`, `CertificateHistory`, `CertificateRequest`, `CertificateVerification`, `DigitalSignature`, `Document`, `DocumentFolder`, `DocumentVersion`, `DocumentCategory`, `StudentDocument`, `EmployeeDocument`, `IDCard`, `AdmitCard`, `Transcript`, `Testimonial`, `CharacterCertificate`, `TransferCertificate`, `SalaryCertificate`, `SalarySlip`, `ExperienceCertificate`, `VerificationLog`, `PrintQueue`, `CertificateSettings`

---

## 6. Verification & 20-Point Completion Condition
Certificate & Document Management মডিউল সম্পূর্ণ বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] ডায়নামিক টেমপ্লেট ডিজাইনার A4/A5 সাইজে পিডিএফ জেনারেট করবে।
- [ ] কিউআর স্ক্যান করে পাবলিক ভেরিফিকেশন পোর্টালে সার্টিফিকেটের আসল কপি দেখা যাবে।
- [ ] বকেয়া পাওনা (Finance/Library Due) থাকলে সার্টিফিকেট ব্লক থাকবে।
- [ ] টিসি (Transfer Certificate) প্রক্রিয়ায় মাল্টি-ডিপার্টমেন্ট ক্লিয়ারেন্স ফ্লো কাজ করবে।
- [ ] ১,০০০+ বাল্ক আইডি কার্ড ও এডমিট কার্ড এক ক্লিকে মার্চড পিডিএফ আকারে জেনারেট হবে।
- [ ] Student360 এবং HR পোর্টালে আপলোডকৃত ডকুমেন্ট ভল্ট রিয়েল-টাইমে দেখাবে।
- [ ] কোনো Placeholder বা Mock Data অবশিষ্ট থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সফল হবে।
- [ ] Runtime Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
