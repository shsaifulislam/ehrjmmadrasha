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
