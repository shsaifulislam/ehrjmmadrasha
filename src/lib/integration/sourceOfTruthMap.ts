/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 28
 * Source-of-Truth & Institutional Data Ownership Matrix
 *
 * Core Governance Invariant:
 * External systems MUST NEVER silently become the source of truth.
 * Internal EHRJ domain services remain authoritative.
 */

import { SourceOfTruthEntry } from "./types";

export const INSTITUTIONAL_SOURCE_OF_TRUTH_MAP: SourceOfTruthEntry[] = [
  {
    domain: "STUDENT_MASTER",
    domainBn: "শিক্ষার্থী মাস্টার প্রোফাইল",
    authoritativeEngine: "Student / Enrollment Service",
    internalOwnerModule: "Academic & Admissions",
    externalConsumerAccess: "READ_ONLY",
    conflictResolutionRule: "Internal master always wins. External changes require approval workflow.",
  },
  {
    domain: "GUARDIAN_MASTER",
    domainBn: "অভিভাবক প্রোফাইল ও সম্পর্ক",
    authoritativeEngine: "Guardian Engine",
    internalOwnerModule: "Student & Guardian Services",
    externalConsumerAccess: "READ_ONLY",
    conflictResolutionRule: "Internal records authoritative; guardian portal update requests undergo staff review.",
  },
  {
    domain: "ATTENDANCE_RECORDS",
    domainBn: "উপস্থিতি ও অনুপস্থিতি হিসাব",
    authoritativeEngine: "Attendance Engine",
    internalOwnerModule: "Attendance Module",
    externalConsumerAccess: "READ_ONLY",
    conflictResolutionRule: "Teacher/admin marked attendance is authoritative. External biometric device feeds validate against class rosters.",
  },
  {
    domain: "ACADEMIC_EXAMS_RESULTS",
    domainBn: "পরীক্ষা, নম্বর ও ফলাফল",
    authoritativeEngine: "Academic & Exam Engine",
    internalOwnerModule: "Academic Module",
    externalConsumerAccess: "READ_ONLY",
    conflictResolutionRule: "Authoritative grade book locked after publication; external BI receives read-only snapshots.",
  },
  {
    domain: "FINANCE_INVOICES",
    domainBn: "ফি ইনভয়েস ও বকেয়া",
    authoritativeEngine: "Finance Engine",
    internalOwnerModule: "Finance & Accounts",
    externalConsumerAccess: "READ_ONLY",
    conflictResolutionRule: "Only Finance Engine can create, modify, or cancel invoices. No external gateway can alter dues directly.",
  },
  {
    domain: "PAYMENT_RECEIPTS",
    domainBn: "পেমেন্ট রসিদ ও লেনদেন",
    authoritativeEngine: "Finance & Cash Ledger",
    internalOwnerModule: "Finance & Accounts",
    externalConsumerAccess: "WRITE_REQUEST",
    conflictResolutionRule: "Two-way verification required. External gateway success initiates an internal transaction check before finalizing receipt.",
  },
  {
    domain: "DOCUMENTS_CERTIFICATES",
    domainBn: "সনদপত্র ও চারিত্রিক প্রত্যয়ন",
    authoritativeEngine: "Document & Verification Engine",
    internalOwnerModule: "Document Services",
    externalConsumerAccess: "READ_ONLY",
    conflictResolutionRule: "Cryptographically signed QR and serials authoritative. External verification portals query read-only verification service.",
  },
  {
    domain: "LIBRARY_CATALOGUE",
    domainBn: "গ্রন্থাগার কিতাব ও ইস্যু-ফেরত",
    authoritativeEngine: "Library Engine",
    internalOwnerModule: "Library Services",
    externalConsumerAccess: "READ_ONLY",
    conflictResolutionRule: "Internal library barcode and book copy registers win over external inventory sync.",
  },
  {
    domain: "RESIDENTIAL_HOSTEL",
    domainBn: "আবাসিক ও বোর্ডিং সিট বরাদ্দ",
    authoritativeEngine: "Residential Engine",
    internalOwnerModule: "Hostel Management",
    externalConsumerAccess: "READ_ONLY",
    conflictResolutionRule: "Internal room and mess roster authoritative.",
  },
  {
    domain: "TRANSPORT_FLEET",
    domainBn: "যাতায়াত ও পরিবহন রুট",
    authoritativeEngine: "Transport Engine",
    internalOwnerModule: "Transport Management",
    externalConsumerAccess: "READ_ONLY",
    conflictResolutionRule: "Vehicle route assignments and stop lists authoritative.",
  },
  {
    domain: "INVENTORY_ASSETS",
    domainBn: "মাদরাসা সম্পদ ও মালামাল",
    authoritativeEngine: "Inventory Engine",
    internalOwnerModule: "Inventory & Procurement",
    externalConsumerAccess: "READ_ONLY",
    conflictResolutionRule: "Institutional asset tag register authoritative.",
  },
  {
    domain: "HR_EMPLOYEE",
    domainBn: "উস্তাদ ও কর্মচারী তথ্য",
    authoritativeEngine: "HR & Payroll Engine",
    internalOwnerModule: "Human Resources",
    externalConsumerAccess: "RESTRICTED",
    conflictResolutionRule: "Employment, designations, and salary structures internal only.",
  },
  {
    domain: "NOTIFICATIONS",
    domainBn: "যোগাযোগ ও বিজ্ঞপ্তি",
    authoritativeEngine: "Notification & Communication Engine (Phase 8)",
    internalOwnerModule: "Communication Module",
    externalConsumerAccess: "RESTRICTED",
    conflictResolutionRule: "Nodemailer/Gmail delivery status tracked; message template and recipient rules internal.",
  },
  {
    domain: "WORKFLOW_AUTOMATION",
    domainBn: "স্বয়ংক্রিয় প্রসেস ও রুলস",
    authoritativeEngine: "Workflow & Rules Engine (Phase 27)",
    internalOwnerModule: "Process Orchestration",
    externalConsumerAccess: "RESTRICTED",
    conflictResolutionRule: "Internal rules and approval gates cannot be overridden by external API triggers.",
  },
];

export function getSourceOfTruthForDomain(domain: string): SourceOfTruthEntry | undefined {
  return INSTITUTIONAL_SOURCE_OF_TRUTH_MAP.find(
    (e) => e.domain === domain || e.domain.toLowerCase() === domain.toLowerCase()
  );
}
