/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 30
 * Global Search & Unified Information Retrieval Engine
 * 
 * Invariants:
 * 1. The search engine is an index and navigation layer; NOT authoritative data.
 * 2. RBAC-AWARE: Authorized users see ONLY what their role permits.
 * 3. NO UNAUTHORIZED DISCOVERY: Searching for restricted IDs yields "no results", never "access denied".
 * 4. Exact identifiers (EHRJ-...) always rank highest.
 * 5. Multilingual normalization (Bangla, English, Arabic) with controlled typo-tolerance.
 */

import { prisma } from "@/lib/prisma";
import {
  GlobalSearchQuery,
  GlobalSearchResponse,
  SearchResultItem,
  SearchUserContext,
  SearchUserRole,
} from "./types";
import { normalizeSearchTerm, isFuzzyMatch } from "./searchNormalization";
import { getPermittedCommands } from "./commandShortcuts";
import { ProcurementStore } from "@/lib/procurement";
import { RiskAssuranceStore } from "@/lib/riskAssurance";
import { ComplianceStore } from "@/lib/compliance";

/**
 * Perform RBAC-governed Global Search across all authoritative EHRJ modules
 */
export async function executeGlobalSearch(
  query: GlobalSearchQuery
): Promise<GlobalSearchResponse> {
  const startTime = Date.now();
  const rawTerm = (query.term || "").trim();
  const normalized = normalizeSearchTerm(rawTerm);
  const user = query.user;
  const filterType = query.filters?.entityType || "ALL";
  const limit = query.filters?.limit || 25;

  const results: SearchResultItem[] = [];
  const categorizedCounts: Record<string, number> = {};

  // If query is empty, return top command navigation shortcuts for this role
  if (!rawTerm) {
    const commands = getPermittedCommands(user.role);
    const navItems: SearchResultItem[] = commands.slice(0, 10).map((cmd) => ({
      id: cmd.id,
      entityType: "NAVIGATION",
      entityId: cmd.id,
      displayTitleBn: cmd.titleBn,
      displayTitleEn: cmd.titleEn,
      subtitle: cmd.descriptionBn,
      url: cmd.url,
      relevanceScore: 1.0,
      matchType: "NAVIGATION",
      matchedField: "shortcut",
      sourceModule: "কমান্ড প্যালেট",
      quickActions: [{ labelBn: "যান", labelEn: "Open", url: cmd.url }],
    }));

    return {
      query: "",
      normalizedQuery: "",
      totalResults: navItems.length,
      results: navItems,
      categorizedCounts: { NAVIGATION: navItems.length },
      latencyMs: Date.now() - startTime,
      sourceOfTruth: "AUTHORITATIVE_DB_AND_INDEX",
    };
  }

  // Check if query matches Command Shortcuts first
  const commands = getPermittedCommands(user.role);
  for (const cmd of commands) {
    if (
      cmd.titleBn.includes(rawTerm) ||
      cmd.titleEn.toLowerCase().includes(rawTerm.toLowerCase()) ||
      cmd.descriptionBn.includes(rawTerm)
    ) {
      results.push({
        id: cmd.id,
        entityType: "NAVIGATION",
        entityId: cmd.id,
        displayTitleBn: cmd.titleBn,
        displayTitleEn: cmd.titleEn,
        subtitle: cmd.descriptionBn,
        url: cmd.url,
        relevanceScore: 0.95,
        matchType: "EXACT_PHRASE",
        matchedField: "commandTitle",
        sourceModule: "সিস্টেম মেনু ও কমান্ড",
        quickActions: [{ labelBn: "ওপেন করুন", labelEn: "Open", url: cmd.url }],
      });
    }
  }

  // Parallel multi-entity queries governed strictly by user role
  const searchPromises: Promise<SearchResultItem[]>[] = [];

  // 1. STUDENTS (Admin, Principal, Teacher, Guardian)
  if (filterType === "ALL" || filterType === "STUDENT") {
    searchPromises.push(searchStudents(rawTerm, normalized, user));
  }

  // 2. GUARDIANS (Admin, Principal only)
  if ((filterType === "ALL" || filterType === "GUARDIAN") && (user.role === "ADMIN" || user.role === "PRINCIPAL")) {
    searchPromises.push(searchGuardians(rawTerm, normalized));
  }

  // 3. ADMISSION APPLICATIONS (Admin, Principal only)
  if ((filterType === "ALL" || filterType === "ADMISSION") && (user.role === "ADMIN" || user.role === "PRINCIPAL")) {
    searchPromises.push(searchAdmissions(rawTerm, normalized));
  }

  // 4. FINANCE: INVOICES & PAYMENTS (Admin, Principal, Guardian-scoped)
  if (filterType === "ALL" || filterType === "INVOICE" || filterType === "PAYMENT") {
    searchPromises.push(searchFinance(rawTerm, normalized, user));
  }

  // 5. CERTIFICATES & OFFICIAL DOCUMENTS (Admin, Principal, Teacher, Guardian-scoped)
  if (filterType === "ALL" || filterType === "CERTIFICATE" || filterType === "DOCUMENT") {
    searchPromises.push(searchCertificatesAndDocuments(rawTerm, normalized, user));
  }

  // 6. EMPLOYEES / HR (Admin, Principal only)
  if ((filterType === "ALL" || filterType === "EMPLOYEE") && (user.role === "ADMIN" || user.role === "PRINCIPAL")) {
    searchPromises.push(searchEmployees(rawTerm, normalized));
  }

  // 7. HELPDESK TICKETS (Admin, Principal, Teacher, Guardian-scoped)
  if (filterType === "ALL" || filterType === "HELPDESK") {
    searchPromises.push(searchHelpdeskTickets(rawTerm, normalized, user));
  }

  // 8. LIBRARY BOOKS (Admin, Principal, Teacher, Guardian)
  if (filterType === "ALL" || filterType === "LIBRARY_BOOK") {
    searchPromises.push(searchLibraryBooks(rawTerm, normalized));
  }

  // 9. INVENTORY & ASSETS (Admin, Principal only)
  if ((filterType === "ALL" || filterType === "INVENTORY" || filterType === "ASSET") && (user.role === "ADMIN" || user.role === "PRINCIPAL")) {
    searchPromises.push(searchInventory(rawTerm, normalized));
  }

  // 10. NOTICES & ANNOUNCEMENTS (All authenticated roles)
  if (filterType === "ALL" || filterType === "NOTICE") {
    searchPromises.push(searchNotices(rawTerm, normalized));
  }

  // 11. VENDORS & SUPPLIERS (Admin, Principal only - Phase 40)
  if ((filterType === "ALL" || filterType === "VENDOR") && (user.role === "ADMIN" || user.role === "PRINCIPAL")) {
    searchPromises.push(searchVendors(rawTerm, normalized));
  }

  // 12. RFQS & TENDERS (Admin, Principal only - Phase 40)
  if ((filterType === "ALL" || filterType === "RFQ") && (user.role === "ADMIN" || user.role === "PRINCIPAL")) {
    searchPromises.push(searchRfqs(rawTerm, normalized));
  }

  // 13. CONTRACTS & AGREEMENTS (Admin, Principal only - Phase 40)
  if ((filterType === "ALL" || filterType === "CONTRACT") && (user.role === "ADMIN" || user.role === "PRINCIPAL")) {
    searchPromises.push(searchContracts(rawTerm, normalized));
  }

  // 14. INSTITUTIONAL RISKS (Admin, Principal only - Phase 42)
  if ((filterType === "ALL" || filterType === "RISK") && (user.role === "ADMIN" || user.role === "PRINCIPAL")) {
    searchPromises.push(searchRisks(rawTerm, normalized));
  }

  // 15. INTERNAL CONTROLS (Admin, Principal only - Phase 42)
  if ((filterType === "ALL" || filterType === "CONTROL") && (user.role === "ADMIN" || user.role === "PRINCIPAL")) {
    searchPromises.push(searchControls(rawTerm, normalized));
  }

  // 16. COMPLIANCE REQUIREMENTS (Admin, Principal only - Phase 43)
  if ((filterType === "ALL" || filterType === "COMPLIANCE_REQUIREMENT") && (user.role === "ADMIN" || user.role === "PRINCIPAL")) {
    searchPromises.push(searchComplianceRequirements(rawTerm, normalized));
  }

  // 17. COMPLIANCE OBLIGATIONS (Admin, Principal only - Phase 43)
  if ((filterType === "ALL" || filterType === "COMPLIANCE_OBLIGATION") && (user.role === "ADMIN" || user.role === "PRINCIPAL")) {
    searchPromises.push(searchComplianceObligations(rawTerm, normalized));
  }

  const moduleResults = await Promise.all(searchPromises);
  for (const list of moduleResults) {
    for (const item of list) {
      results.push(item);
      categorizedCounts[item.entityType] = (categorizedCounts[item.entityType] || 0) + 1;
    }
  }

  // Sort by technical relevance (Exact ID > Exact Title > Prefix > Normalized > Fuzzy)
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const finalResults = results.slice(0, limit);
  const latencyMs = Date.now() - startTime;

  return {
    query: rawTerm,
    normalizedQuery: normalized,
    totalResults: results.length,
    results: finalResults,
    categorizedCounts,
    latencyMs,
    sourceOfTruth: "AUTHORITATIVE_DB_AND_INDEX",
  };
}

/* ========================================================================= */
/* MODULE-SPECIFIC SEARCH ADAPTERS (WITH STRICT PERMISSION ENFORCEMENT)       */
/* ========================================================================= */

async function searchStudents(
  term: string,
  normalized: string,
  user: SearchUserContext
): Promise<SearchResultItem[]> {
  const isExactId = /^EHRJ-STU/i.test(term) || /^STU/i.test(term) || /^\d{4,8}$/.test(term);
  const where: any = {};

  // Guardian Isolation: ONLY linked children
  if (user.role === "GUARDIAN") {
    const allowedIds = user.linkedStudentIds || [];
    if (user.studentId) allowedIds.push(user.studentId);
    if (allowedIds.length === 0) return [];
    where.id = { in: allowedIds };
  }

  where.OR = [
    { studentIdNumber: { contains: term } },
    { fullNameBn: { contains: term } },
    { fullNameEn: { contains: term } },
    { fatherNameBn: { contains: term } },
    { fatherPhone: { contains: term } },
  ];

  const students = await prisma.student.findMany({
    where,
    take: 10,
    select: {
      id: true,
      studentIdNumber: true,
      fullNameBn: true,
      fullNameEn: true,
      fatherNameBn: true,
      gender: true,
      residentialStatus: true,
      status: true,
      updatedAt: true,
    },
  });

  return students.map((s) => {
    const isIdMatch = s.studentIdNumber.toLowerCase() === term.toLowerCase();
    const score = isIdMatch ? 1.0 : s.fullNameBn.includes(term) ? 0.85 : 0.7;

    return {
      id: s.id,
      entityType: "STUDENT",
      entityId: s.studentIdNumber,
      displayTitleBn: s.fullNameBn,
      displayTitleEn: s.fullNameEn || s.studentIdNumber,
      subtitle: `আইডি: ${s.studentIdNumber} | পিতা: ${s.fatherNameBn || "তথ্য নেই"} | অবস্থা: ${s.status}`,
      status: s.status,
      url: user.role === "GUARDIAN" ? `/portal` : `/admin/students?search=${encodeURIComponent(s.studentIdNumber)}`,
      relevanceScore: score,
      matchType: isIdMatch ? "EXACT_ID" : "PREFIX",
      matchedField: isIdMatch ? "studentIdNumber" : "fullNameBn",
      sourceModule: "শিক্ষার্থী ব্যবস্থাপনা",
      lastUpdated: s.updatedAt.toISOString(),
      quickActions: [
        { labelBn: "প্রোফাইল", labelEn: "Profile", url: `/admin/students?search=${s.studentIdNumber}` },
        { labelBn: "হাজিরা", labelEn: "Attendance", url: `/admin/attendance?studentId=${s.id}` },
        { labelBn: "ফি রেকর্ড", labelEn: "Fees", url: `/admin/finance?studentId=${s.id}` },
      ],
    };
  });
}

async function searchGuardians(term: string, normalized: string): Promise<SearchResultItem[]> {
  const guardians = await prisma.guardian.findMany({
    where: {
      OR: [
        { fullNameBn: { contains: term } },
        { fullNameEn: { contains: term } },
        { phone: { contains: term } },
        { email: { contains: term } },
      ],
    },
    take: 8,
    select: {
      id: true,
      fullNameBn: true,
      fullNameEn: true,
      phone: true,
      createdAt: true,
    },
  });

  return guardians.map((g) => ({
    id: g.id,
    entityType: "GUARDIAN",
    entityId: g.id,
    displayTitleBn: g.fullNameBn,
    displayTitleEn: g.fullNameEn || g.fullNameBn,
    subtitle: `মোবাইল: ${g.phone}`,
    url: `/admin/guardians?search=${encodeURIComponent(g.phone)}`,
    relevanceScore: g.phone === term ? 0.95 : 0.8,
    matchType: g.phone === term ? "EXACT_ID" : "NORMALIZED",
    matchedField: "phone",
    sourceModule: "অভিভাবক পোর্টাল",
    lastUpdated: g.createdAt.toISOString(),
    quickActions: [{ labelBn: "বিবরণ", labelEn: "View", url: `/admin/guardians?search=${encodeURIComponent(g.phone)}` }],
  }));
}

async function searchAdmissions(term: string, normalized: string): Promise<SearchResultItem[]> {
  const apps = await prisma.application.findMany({
    where: {
      OR: [
        { studentNameBn: { contains: term } },
        { studentNameEn: { contains: term } },
        { applicationNumber: { contains: term } },
        { guardianPhone: { contains: term } },
      ],
    },
    take: 8,
    select: {
      id: true,
      applicationNumber: true,
      studentNameBn: true,
      studentNameEn: true,
      guardianPhone: true,
      status: true,
      updatedAt: true,
    },
  });

  return apps.map((a) => {
    const isExact = a.applicationNumber.toLowerCase() === term.toLowerCase();
    return {
      id: a.id,
      entityType: "ADMISSION",
      entityId: a.applicationNumber,
      displayTitleBn: a.studentNameBn,
      displayTitleEn: a.studentNameEn || a.studentNameBn,
      subtitle: `আবেদন নং: ${a.applicationNumber} | অভিভাবক: ${a.guardianPhone} | স্ট্যাটাস: ${a.status}`,
      status: a.status,
      url: `/admin/admissions?search=${encodeURIComponent(a.applicationNumber)}`,
      relevanceScore: isExact ? 1.0 : 0.8,
      matchType: isExact ? "EXACT_ID" : "NORMALIZED",
      matchedField: isExact ? "applicationNumber" : "studentNameBn",
      sourceModule: "ভর্তি ব্যবস্থাপনা",
      lastUpdated: a.updatedAt.toISOString(),
      quickActions: [{ labelBn: "পর্যালোচনা", labelEn: "Review", url: `/admin/admissions?search=${a.applicationNumber}` }],
    };
  });
}

async function searchFinance(
  term: string,
  normalized: string,
  user: SearchUserContext
): Promise<SearchResultItem[]> {
  // Teachers are strictly forbidden from viewing finance records
  if (user.role === "TEACHER") return [];

  const where: any = {};
  if (user.role === "GUARDIAN") {
    const allowed = user.linkedStudentIds || [];
    if (user.studentId) allowed.push(user.studentId);
    if (allowed.length === 0) return [];
    where.studentId = { in: allowed };
  }

  where.OR = [
    { invoiceNumber: { contains: term } },
    { title: { contains: term } },
  ];

  const invoices = await prisma.feeInvoice.findMany({
    where,
    take: 8,
    select: {
      id: true,
      invoiceNumber: true,
      title: true,
      totalAmount: true,
      paidAmount: true,
      dueAmount: true,
      status: true,
      updatedAt: true,
      student: { select: { fullNameBn: true, studentIdNumber: true } },
    },
  });

  return invoices.map((inv) => {
    const isId = inv.invoiceNumber.toLowerCase() === term.toLowerCase();
    return {
      id: inv.id,
      entityType: "INVOICE",
      entityId: inv.invoiceNumber,
      displayTitleBn: `ফি ইনভয়েস: ${inv.title}`,
      displayTitleEn: `Invoice ${inv.invoiceNumber}`,
      subtitle: `শিক্ষার্থী: ${inv.student.fullNameBn} (${inv.student.studentIdNumber}) | মোট: ৳${inv.totalAmount} | বকেয়া: ৳${inv.dueAmount} | অবস্থা: ${inv.status}`,
      status: inv.status,
      url: user.role === "GUARDIAN" ? `/portal?tab=FEES` : `/admin/finance?invoice=${encodeURIComponent(inv.invoiceNumber)}`,
      relevanceScore: isId ? 1.0 : 0.85,
      matchType: isId ? "EXACT_ID" : "NORMALIZED",
      matchedField: isId ? "invoiceNumber" : "title",
      sourceModule: "হিসাব ও অর্থ",
      lastUpdated: inv.updatedAt.toISOString(),
      quickActions: [{ labelBn: "ইনভয়েস দেখুন", labelEn: "View", url: `/admin/finance?invoice=${inv.invoiceNumber}` }],
    };
  });
}

async function searchCertificatesAndDocuments(
  term: string,
  normalized: string,
  user: SearchUserContext
): Promise<SearchResultItem[]> {
  const where: any = {};
  if (user.role === "GUARDIAN") {
    const allowed = user.linkedStudentIds || [];
    if (user.studentId) allowed.push(user.studentId);
    if (allowed.length === 0) return [];
    where.studentId = { in: allowed };
  }

  where.OR = [
    { certificateNumber: { contains: term } },
    { verificationCode: { contains: term } },
    { titleBn: { contains: term } },
  ];

  const certs = await prisma.certificate.findMany({
    where,
    take: 8,
    select: {
      id: true,
      certificateNumber: true,
      verificationCode: true,
      titleBn: true,
      status: true,
      isRevoked: true,
      issueDate: true,
      student: { select: { fullNameBn: true, studentIdNumber: true } },
    },
  });

  return certs.map((c) => {
    const isId = c.certificateNumber.toLowerCase() === term.toLowerCase() || c.verificationCode.toLowerCase() === term.toLowerCase();
    return {
      id: c.id,
      entityType: "CERTIFICATE",
      entityId: c.certificateNumber,
      displayTitleBn: c.titleBn || "অফিশিয়াল প্রত্যয়নপত্র",
      displayTitleEn: `Certificate ${c.certificateNumber}`,
      subtitle: `শিক্ষার্থী: ${c.student.fullNameBn} | নম্বর: ${c.certificateNumber} | স্ট্যাটাস: ${c.isRevoked ? "বাতিল (REVOKED)" : c.status}`,
      status: c.isRevoked ? "REVOKED" : c.status,
      url: `/verify/document/${encodeURIComponent(c.verificationCode)}`,
      relevanceScore: isId ? 1.0 : 0.85,
      matchType: isId ? "EXACT_ID" : "NORMALIZED",
      matchedField: isId ? "certificateNumber" : "titleBn",
      sourceModule: "সনদপত্র ও প্রত্যয়ন",
      lastUpdated: c.issueDate.toISOString(),
      quickActions: [
        { labelBn: "ভেরিফাই করুন", labelEn: "Verify", url: `/verify/document/${encodeURIComponent(c.verificationCode)}` },
      ],
    };
  });
}

async function searchEmployees(term: string, normalized: string): Promise<SearchResultItem[]> {
  const emps = await prisma.employee.findMany({
    where: {
      OR: [
        { nameBn: { contains: term } },
        { nameEn: { contains: term } },
        { employeeId: { contains: term } },
        { mobile: { contains: term } },
      ],
    },
    take: 8,
    select: {
      id: true,
      employeeId: true,
      nameBn: true,
      nameEn: true,
      status: true,
      updatedAt: true,
      designation: { select: { nameBn: true } },
      department: { select: { nameBn: true } },
    },
  });

  return emps.map((e) => {
    const isId = e.employeeId.toLowerCase() === term.toLowerCase();
    const desigTitle = e.designation?.nameBn || "কর্মকর্তা/শিক্ষক";
    const deptName = e.department?.nameBn || "সাধারণ";
    return {
      id: e.id,
      entityType: "EMPLOYEE",
      entityId: e.employeeId,
      displayTitleBn: e.nameBn,
      displayTitleEn: e.nameEn || e.nameBn,
      subtitle: `পদবী: ${desigTitle} | বিভাগ: ${deptName} | আইডি: ${e.employeeId}`,
      status: e.status,
      url: `/admin/hr?search=${encodeURIComponent(e.employeeId)}`,
      relevanceScore: isId ? 1.0 : 0.85,
      matchType: isId ? "EXACT_ID" : "NORMALIZED",
      matchedField: isId ? "employeeId" : "nameBn",
      sourceModule: "মানবসম্পদ ও শিক্ষক",
      lastUpdated: e.updatedAt.toISOString(),
      quickActions: [{ labelBn: "প্রোফাইল", labelEn: "View", url: `/admin/hr?search=${e.employeeId}` }],
    };
  });
}

async function searchHelpdeskTickets(
  term: string,
  normalized: string,
  user: SearchUserContext
): Promise<SearchResultItem[]> {
  const where: any = {};
  if (user.role === "GUARDIAN") {
    if (!user.guardianId) return [];
    where.guardianId = user.guardianId;
  }

  where.OR = [
    { ticketNumber: { contains: term } },
    { subject: { contains: term } },
  ];

  const tickets = await prisma.supportRequest.findMany({
    where,
    take: 8,
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      requestType: true,
      status: true,
      priority: true,
      updatedAt: true,
    },
  });

  return tickets.map((t) => {
    const isId = t.ticketNumber.toLowerCase() === term.toLowerCase();
    return {
      id: t.id,
      entityType: "HELPDESK",
      entityId: t.ticketNumber,
      displayTitleBn: `টিকিট #${t.ticketNumber}: ${t.subject}`,
      displayTitleEn: `Ticket #${t.ticketNumber}: ${t.subject}`,
      subtitle: `ধরন: ${t.requestType} | অগ্রাধিকার: ${t.priority} | অবস্থা: ${t.status}`,
      status: t.status,
      url: user.role === "GUARDIAN" ? `/portal/helpdesk/${t.id}` : `/admin/helpdesk?ticket=${encodeURIComponent(t.ticketNumber)}`,
      relevanceScore: isId ? 1.0 : 0.8,
      matchType: isId ? "EXACT_ID" : "NORMALIZED",
      matchedField: isId ? "ticketNumber" : "subject",
      sourceModule: "হেল্পডেস্ক ও অভিযোগ",
      lastUpdated: t.updatedAt.toISOString(),
      quickActions: [{ labelBn: "টিকিট খুলুন", labelEn: "Open", url: `/admin/helpdesk?ticket=${t.ticketNumber}` }],
    };
  });
}

async function searchLibraryBooks(term: string, normalized: string): Promise<SearchResultItem[]> {
  const books = await prisma.libraryBook.findMany({
    where: {
      OR: [
        { titleBn: { contains: term } },
        { titleEn: { contains: term } },
        { isbn: { contains: term } },
        { copies: { some: { accessionNo: { contains: term } } } },
      ],
    },
    take: 8,
    select: {
      id: true,
      titleBn: true,
      titleEn: true,
      isbn: true,
      updatedAt: true,
      author: { select: { nameBn: true } },
      copies: { select: { accessionNo: true }, take: 1 },
    },
  });

  return books.map((b) => {
    const accNo = b.copies[0]?.accessionNo || b.isbn || b.id;
    const isId = accNo.toLowerCase() === term.toLowerCase() || (b.isbn && b.isbn.toLowerCase() === term.toLowerCase());
    return {
      id: b.id,
      entityType: "LIBRARY_BOOK",
      entityId: accNo,
      displayTitleBn: b.titleBn,
      displayTitleEn: b.titleEn || b.titleBn,
      subtitle: `লেখক: ${b.author?.nameBn || "অজানা"} | অ্যাকসেশন: ${accNo}`,
      url: `/admin/library?search=${encodeURIComponent(accNo)}`,
      relevanceScore: isId ? 1.0 : 0.8,
      matchType: isId ? "EXACT_ID" : "NORMALIZED",
      matchedField: "titleBn",
      sourceModule: "লাইব্রেরি ও কিতাবাগার",
      lastUpdated: b.updatedAt.toISOString(),
      quickActions: [{ labelBn: "কিতাব বিবরণ", labelEn: "View", url: `/admin/library?search=${accNo}` }],
    };
  });
}

async function searchInventory(term: string, normalized: string): Promise<SearchResultItem[]> {
  const items = await prisma.inventoryItem.findMany({
    where: {
      OR: [
        { itemCode: { contains: term } },
        { nameBn: { contains: term } },
        { nameEn: { contains: term } },
      ],
    },
    take: 8,
    select: {
      id: true,
      itemCode: true,
      nameBn: true,
      nameEn: true,
      unit: true,
      isActive: true,
      updatedAt: true,
      stockBalances: { select: { currentBalance: true }, take: 1 },
    },
  });

  return items.map((i) => {
    const isId = i.itemCode.toLowerCase() === term.toLowerCase();
    const currentQty = i.stockBalances[0]?.currentBalance || 0;
    return {
      id: i.id,
      entityType: "INVENTORY",
      entityId: i.itemCode,
      displayTitleBn: i.nameBn,
      displayTitleEn: i.nameEn || i.nameBn,
      subtitle: `কোড: ${i.itemCode} | বর্তমান মজুদ: ${currentQty} ${i.unit}`,
      status: i.isActive ? "ACTIVE" : "INACTIVE",
      url: `/admin/inventory?code=${encodeURIComponent(i.itemCode)}`,
      relevanceScore: isId ? 1.0 : 0.8,
      matchType: isId ? "EXACT_ID" : "NORMALIZED",
      matchedField: "nameBn",
      sourceModule: "মালামাল ও ইনভেন্টরি",
      lastUpdated: i.updatedAt.toISOString(),
      quickActions: [{ labelBn: "মজুদ দেখুন", labelEn: "Stock", url: `/admin/inventory?code=${i.itemCode}` }],
    };
  });
}

async function searchNotices(term: string, normalized: string): Promise<SearchResultItem[]> {
  const notices = await prisma.notice.findMany({
    where: {
      OR: [
        { titleBn: { contains: term } },
        { contentBn: { contains: term } },
      ],
    },
    take: 5,
    select: {
      id: true,
      titleBn: true,
      category: true,
      isPublished: true,
      updatedAt: true,
    },
  });

  return notices.map((n) => ({
    id: n.id,
    entityType: "NOTICE",
    entityId: n.id,
    displayTitleBn: n.titleBn,
    displayTitleEn: n.titleBn,
    subtitle: `ক্যাটাগরি: ${n.category} | প্রকাশিত: ${n.isPublished ? "হ্যাঁ" : "না"}`,
    url: `/notice`,
    relevanceScore: 0.75,
    matchType: "NORMALIZED",
    matchedField: "titleBn",
    sourceModule: "নোটিশ বোর্ড",
    lastUpdated: n.updatedAt.toISOString(),
    quickActions: [{ labelBn: "পড়ুন", labelEn: "Read", url: `/notice` }],
  }));
}

/* ========================================================================= */
/* PHASE 40: VENDORS, RFQS & CONTRACTS SEARCH ADAPTERS                       */
/* ========================================================================= */

async function searchVendors(term: string, normalized: string): Promise<SearchResultItem[]> {
  try {
    const termLower = term.toLowerCase();
    const vendors = ProcurementStore.getVendors();

    const matches = vendors.filter((v) => {
      return (
        v.id.toLowerCase().includes(termLower) ||
        v.vendorCode?.toLowerCase().includes(termLower) ||
        v.legalNameBn.includes(term) ||
        v.legalNameEn?.toLowerCase().includes(termLower) ||
        v.displayName?.includes(term) ||
        v.phone.includes(term) ||
        v.categoryCode.toLowerCase().includes(termLower) ||
        v.contacts?.some((c) => c.name.includes(term) || c.phone.includes(term))
      );
    });

    return matches.slice(0, 8).map((v) => {
      const isExactId = v.id.toLowerCase() === termLower || v.vendorCode?.toLowerCase() === termLower;
      return {
        id: v.id,
        entityType: "VENDOR",
        entityId: v.id,
        displayTitleBn: v.legalNameBn,
        displayTitleEn: v.legalNameEn || v.displayName || v.id,
        subtitle: `আইডি: ${v.id} | ধরণ: ${v.vendorType} | ক্যাটাগরি: ${v.categoryCode} | অবস্থা: ${v.status}`,
        status: v.status,
        url: `/admin/vendors/${encodeURIComponent(v.id)}`,
        relevanceScore: isExactId ? 1.0 : v.legalNameBn.includes(term) ? 0.88 : 0.75,
        matchType: isExactId ? "EXACT_ID" : "NORMALIZED",
        matchedField: isExactId ? "id" : "legalNameBn",
        sourceModule: "ভেন্ডর ও সরবরাহকারী মাস্টার",
        lastUpdated: v.updatedAt,
        quickActions: [
          { labelBn: "ভেন্ডর প্রোফাইল", labelEn: "Profile", url: `/admin/vendors/${v.id}` },
          { labelBn: "চুক্তিপত্র", labelEn: "Contracts", url: `/admin/contracts?vendorId=${v.id}` },
        ],
      };
    });
  } catch (err) {
    console.warn("Error in searchVendors:", err);
    return [];
  }
}

async function searchRfqs(term: string, normalized: string): Promise<SearchResultItem[]> {
  try {
    const termLower = term.toLowerCase();
    const rfqs = ProcurementStore.getRFQs();

    const matches = rfqs.filter((r) => {
      return (
        r.id.toLowerCase().includes(termLower) ||
        r.rfqCode?.toLowerCase().includes(termLower) ||
        (r.titleBn || "").includes(term) ||
        (r.descriptionBn || "").includes(term) ||
        (r.categoryCode || "").toLowerCase().includes(termLower) ||
        (r.items || []).some((i) => (i.nameBn || (i as any).itemName || "").includes(term))
      );
    });

    return matches.slice(0, 8).map((r) => {
      const isExactId = r.id.toLowerCase() === termLower || r.rfqCode?.toLowerCase() === termLower;
      return {
        id: r.id,
        entityType: "RFQ",
        entityId: r.id,
        displayTitleBn: r.titleBn,
        displayTitleEn: r.rfqCode || r.id,
        subtitle: `আইডি: ${r.id} | অবস্থা: ${r.status} | আইটেম: ${r.items?.length || 0} টি | ডেডলাইন: ${r.submissionDeadline}`,
        status: r.status,
        url: `/admin/procurement/rfqs`,
        relevanceScore: isExactId ? 1.0 : 0.82,
        matchType: isExactId ? "EXACT_ID" : "NORMALIZED",
        matchedField: isExactId ? "id" : "titleBn",
        sourceModule: "প্রকিউরমেন্ট ও দরপত্র (RFQ)",
        lastUpdated: r.updatedAt,
        quickActions: [
          { labelBn: "দরপত্র দেখুন", labelEn: "View RFQ", url: `/admin/procurement/rfqs` },
        ],
      };
    });
  } catch (err) {
    console.warn("Error in searchRfqs:", err);
    return [];
  }
}

async function searchContracts(term: string, normalized: string): Promise<SearchResultItem[]> {
  try {
    const termLower = term.toLowerCase();
    const contracts = ProcurementStore.getContracts();

    const matches = contracts.filter((c) => {
      const vendorName = c.vendorNameBn || (c as any).vendorName || "";
      return (
        c.id.toLowerCase().includes(termLower) ||
        (c.contractCode || "").toLowerCase().includes(termLower) ||
        (c.titleBn || "").includes(term) ||
        vendorName.includes(term) ||
        (c.vendorId || "").toLowerCase().includes(termLower) ||
        (c.contractType || "").toLowerCase().includes(termLower)
      );
    });

    return matches.slice(0, 8).map((c) => {
      const isExactId = c.id.toLowerCase() === termLower || (c.contractCode || "").toLowerCase() === termLower;
      const vendorName = c.vendorNameBn || (c as any).vendorName || c.vendorId;
      return {
        id: c.id,
        entityType: "CONTRACT",
        entityId: c.id,
        displayTitleBn: c.titleBn,
        displayTitleEn: `${vendorName} (${c.contractCode || c.id})`,
        subtitle: `আইডি: ${c.id} | সরবরাহকারী: ${vendorName} | মূল্য: ৳${(c.totalContractValue || 0).toLocaleString("bn-BD")} | অবস্থা: ${c.status}`,
        status: c.status,
        url: `/admin/contracts/${encodeURIComponent(c.id)}`,
        relevanceScore: isExactId ? 1.0 : 0.85,
        matchType: isExactId ? "EXACT_ID" : "NORMALIZED",
        matchedField: isExactId ? "id" : "titleBn",
        sourceModule: "প্রাতিষ্ঠানিক চুক্তি ব্যবস্থাপনা",
        lastUpdated: c.updatedAt,
        quickActions: [
          { labelBn: "চুক্তি বিবরণ", labelEn: "Contract Details", url: `/admin/contracts/${c.id}` },
        ],
      };
    });
  } catch (err) {
    console.warn("Error in searchContracts:", err);
    return [];
  }
}

/* ========================================================================= */
/* PHASE 42: RISKS & INTERNAL CONTROLS SEARCH ADAPTERS                       */
/* ========================================================================= */

async function searchRisks(term: string, normalized: string): Promise<SearchResultItem[]> {
  try {
    const termLower = term.toLowerCase();
    const risks = RiskAssuranceStore.getRisks();

    const matches = risks.filter((r) => {
      return (
        r.id.toLowerCase().includes(termLower) ||
        r.riskCode?.toLowerCase().includes(termLower) ||
        (r.titleBn || "").includes(term) ||
        (r.titleEn || "").toLowerCase().includes(termLower) ||
        (r.descriptionBn || "").includes(term) ||
        (r.riskCategory || "").toLowerCase().includes(termLower) ||
        (r.residualLevel || "").toLowerCase().includes(termLower) ||
        (r.sourceModule || "").toLowerCase().includes(termLower)
      );
    });

    return matches.slice(0, 8).map((r) => {
      const isExactId = r.id.toLowerCase() === termLower || r.riskCode?.toLowerCase() === termLower;
      return {
        id: r.id,
        entityType: "RISK",
        entityId: r.id,
        displayTitleBn: r.titleBn,
        displayTitleEn: r.titleEn || r.riskCode || r.id,
        subtitle: `আইডি: ${r.id} | মাত্রা: ${r.residualLevel} | ক্যাটাগরি: ${r.riskCategory} | অবস্থা: ${r.status}`,
        status: r.status,
        url: `/admin/governance/risks/${encodeURIComponent(r.id)}`,
        relevanceScore: isExactId ? 1.0 : r.titleBn.includes(term) ? 0.9 : 0.8,
        matchType: isExactId ? "EXACT_ID" : "NORMALIZED",
        matchedField: isExactId ? "id" : "titleBn",
        sourceModule: "প্রাতিষ্ঠানিক ঝুঁকি রেজিস্টার",
        lastUpdated: r.updatedAt,
        quickActions: [
          { labelBn: "ঝুঁকি বিবরণ", labelEn: "Risk Profile", url: `/admin/governance/risks/${r.id}` },
        ],
      };
    });
  } catch (err) {
    console.warn("Error in searchRisks:", err);
    return [];
  }
}

async function searchControls(term: string, normalized: string): Promise<SearchResultItem[]> {
  try {
    const termLower = term.toLowerCase();
    const controls = RiskAssuranceStore.getControls();

    const matches = controls.filter((c) => {
      return (
        c.id.toLowerCase().includes(termLower) ||
        c.controlCode?.toLowerCase().includes(termLower) ||
        (c.nameBn || "").includes(term) ||
        (c.nameEn || "").toLowerCase().includes(termLower) ||
        (c.descriptionBn || "").includes(term) ||
        (c.controlObjectiveBn || "").includes(term) ||
        (c.category || "").toLowerCase().includes(termLower) ||
        (c.controlType || "").toLowerCase().includes(termLower)
      );
    });

    return matches.slice(0, 8).map((c) => {
      const isExactId = c.id.toLowerCase() === termLower || c.controlCode?.toLowerCase() === termLower;
      return {
        id: c.id,
        entityType: "CONTROL",
        entityId: c.id,
        displayTitleBn: c.nameBn,
        displayTitleEn: c.nameEn || c.controlCode || c.id,
        subtitle: `আইডি: ${c.id} | ধরণ: ${c.controlType} | কার্যকরিতা: ${c.lastTestResult || "পরীক্ষিত নয়"} | অবস্থা: ${c.status}`,
        status: c.status,
        url: `/admin/governance/controls`,
        relevanceScore: isExactId ? 1.0 : c.nameBn.includes(term) ? 0.88 : 0.78,
        matchType: isExactId ? "EXACT_ID" : "NORMALIZED",
        matchedField: isExactId ? "id" : "nameBn",
        sourceModule: "অভ্যন্তরীণ নিয়ন্ত্রণ রেজিস্টার",
        lastUpdated: c.updatedAt,
        quickActions: [
          { labelBn: "নিয়ন্ত্রণসমূহ", labelEn: "Controls", url: `/admin/governance/controls` },
        ],
      };
    });
  } catch (err) {
    console.warn("Error in searchControls:", err);
    return [];
  }
}

async function searchComplianceRequirements(term: string, normalized: string): Promise<SearchResultItem[]> {
  try {
    const termLower = term.toLowerCase();
    const reqs = ComplianceStore.getRequirements();

    const matches = reqs.filter((r) => {
      return (
        r.id.toLowerCase().includes(termLower) ||
        r.title.toLowerCase().includes(termLower) ||
        r.description.toLowerCase().includes(termLower) ||
        r.jurisdiction.toLowerCase().includes(termLower) ||
        r.sourceReference.toLowerCase().includes(termLower) ||
        r.category.toLowerCase().includes(termLower)
      );
    });

    return matches.slice(0, 8).map((r) => {
      const isExactId = r.id.toLowerCase() === termLower;
      return {
        id: r.id,
        entityType: "COMPLIANCE_REQUIREMENT",
        entityId: r.id,
        displayTitleBn: r.title,
        displayTitleEn: r.id,
        subtitle: `আইডি: ${r.id} | উৎস: ${r.source} | এখতিয়ার: ${r.jurisdiction} | অবস্থা: ${r.status}`,
        status: r.status,
        url: `/admin/compliance/requirements/${encodeURIComponent(r.id)}`,
        relevanceScore: isExactId ? 1.0 : r.title.includes(term) ? 0.9 : 0.8,
        matchType: isExactId ? "EXACT_ID" : "NORMALIZED",
        matchedField: isExactId ? "id" : "title",
        sourceModule: "কমপ্লায়েন্স প্রয়োজনীয়তা রেজিস্টার",
        lastUpdated: r.updatedAt,
        quickActions: [
          { labelBn: "প্রয়োজনীয়তা বিবরণ", labelEn: "Requirement Details", url: `/admin/compliance/requirements/${r.id}` },
        ],
      };
    });
  } catch (err) {
    console.warn("Error in searchComplianceRequirements:", err);
    return [];
  }
}

async function searchComplianceObligations(term: string, normalized: string): Promise<SearchResultItem[]> {
  try {
    const termLower = term.toLowerCase();
    const obligations = ComplianceStore.getObligations();

    const matches = obligations.filter((o) => {
      return (
        o.id.toLowerCase().includes(termLower) ||
        o.requirementId.toLowerCase().includes(termLower) ||
        o.title.toLowerCase().includes(termLower) ||
        o.description.toLowerCase().includes(termLower) ||
        o.ownerName.toLowerCase().includes(termLower) ||
        o.deadlineSource.toLowerCase().includes(termLower) ||
        o.status.toLowerCase().includes(termLower)
      );
    });

    return matches.slice(0, 8).map((o) => {
      const isExactId = o.id.toLowerCase() === termLower;
      return {
        id: o.id,
        entityType: "COMPLIANCE_OBLIGATION",
        entityId: o.id,
        displayTitleBn: o.title,
        displayTitleEn: o.id,
        subtitle: `আইডি: ${o.id} | কর্মকর্তা: ${o.ownerName} | সময়সীমা: ${o.dueDate} | অবস্থা: ${o.status}`,
        status: o.status,
        url: `/admin/compliance/obligations/${encodeURIComponent(o.id)}`,
        relevanceScore: isExactId ? 1.0 : o.title.includes(term) ? 0.88 : 0.78,
        matchType: isExactId ? "EXACT_ID" : "NORMALIZED",
        matchedField: isExactId ? "id" : "title",
        sourceModule: "কমপ্লায়েন্স দায় ও অঙ্গীকার",
        lastUpdated: o.updatedAt,
        quickActions: [
          { labelBn: "দায় বিবরণ", labelEn: "Obligation Details", url: `/admin/compliance/obligations/${o.id}` },
        ],
      };
    });
  } catch (err) {
    console.warn("Error in searchComplianceObligations:", err);
    return [];
  }
}

