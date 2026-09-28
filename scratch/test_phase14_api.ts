import { prisma } from "../src/lib/prisma";
import {
  ensureDefaultHelpdeskCategories,
  getHelpdeskCategories,
  createHelpdeskCategory,
  updateHelpdeskCategory,
  generateNextTicketNumber,
  createSupportRequest,
  getSupportRequests,
  getGuardianSupportRequests,
  getSupportRequestById,
  updateSupportRequestStatus,
  addSupportRequestMessage,
  addSupportRequestAttachment,
  getHelpdeskDashboardStats,
  verifyGuardianStudentAccess,
  verifyRelatedEntityOwnership,
} from "../src/lib/helpdeskEngine";

async function runPhase14UnitTests() {
  console.log("=================================================================");
  console.log("  PHASE 14 — HELPDESK & SERVICE REQUEST ENGINE UNIT/INTEGRATION TESTS");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // SETUP FIXTURES
    // -------------------------------------------------------------
    console.log("--- Setup Fixtures ---");

    // Admin user
    const adminUser = await prisma.user.upsert({
      where: { username: "admin_test_p14" },
      update: {},
      create: {
        username: "admin_test_p14",
        name: "টেস্ট অ্যাডমিন",
        role: "ADMIN",
        status: "ACTIVE",
        email: "admin_test_p14@ehrj.local",
        passwordHash: "$2a$12$placeholderhashforphase14testing",
      },
    });

    // Guardian 1 User & Profile
    const guardianUser1 = await prisma.user.upsert({
      where: { username: "guardian1_p14" },
      update: {},
      create: {
        username: "guardian1_p14",
        name: "আব্দুল করিম (অভিভাবক ১)",
        role: "GUARDIAN",
        status: "ACTIVE",
        email: "guardian1_p14@ehrj.local",
        passwordHash: "$2a$12$placeholderhashforphase14testing",
      },
    });

    const guardian1 = await prisma.guardian.upsert({
      where: { phone: "01826000014" },
      update: { userId: guardianUser1.id },
      create: {
        fullNameBn: "আব্দুল করিম",
        phone: "01826000014",
        relation: "FATHER",
        userId: guardianUser1.id,
      },
    });

    // Guardian 2 User & Profile (for IDOR isolation tests)
    const guardianUser2 = await prisma.user.upsert({
      where: { username: "guardian2_p14" },
      update: {},
      create: {
        username: "guardian2_p14",
        name: "রফীকুল ইসলাম (অভিভাবক ২)",
        role: "GUARDIAN",
        status: "ACTIVE",
        email: "guardian2_p14@ehrj.local",
        passwordHash: "$2a$12$placeholderhashforphase14testing",
      },
    });

    const guardian2 = await prisma.guardian.upsert({
      where: { phone: "01826000024" },
      update: { userId: guardianUser2.id },
      create: {
        fullNameBn: "রফীকুল ইসলাম",
        phone: "01826000024",
        relation: "FATHER",
        userId: guardianUser2.id,
      },
    });

    // Student 1 (linked to Guardian 1)
    const student1 = await prisma.student.upsert({
      where: { studentIdNumber: "EHRJ-TEST-P14-01" },
      update: {},
      create: {
        studentIdNumber: "EHRJ-TEST-P14-01",
        fullNameBn: "মুহাম্মদ তাহমিদ করিম",
        fullNameEn: "Muhammad Tahmid Karim",
        dateOfBirth: new Date("2014-05-10"),
        gender: "MALE",
        fatherNameBn: "আব্দুল করিম",
        motherNameBn: "মোসাম্মৎ ফাতেমা বেগম",
        presentAddress: "দাউদকান্দি, কুমিল্লা",
        permanentAddress: "দাউদকান্দি, কুমিল্লা",
      },
    });

    await prisma.guardianStudent.upsert({
      where: {
        guardianId_studentId: {
          guardianId: guardian1.id,
          studentId: student1.id,
        },
      },
      update: {},
      create: {
        guardianId: guardian1.id,
        studentId: student1.id,
        isPrimary: true,
      },
    });

    // Student 2 (linked to Guardian 2)
    const student2 = await prisma.student.upsert({
      where: { studentIdNumber: "EHRJ-TEST-P14-02" },
      update: {},
      create: {
        studentIdNumber: "EHRJ-TEST-P14-02",
        fullNameBn: "মুহাম্মদ সালমান ইসলাম",
        fullNameEn: "Muhammad Salman Islam",
        dateOfBirth: new Date("2015-08-12"),
        gender: "MALE",
        fatherNameBn: "রফীকুল ইসলাম",
        motherNameBn: "মোসাম্মৎ রহিমা খাতুন",
        presentAddress: "ইলিয়টগঞ্জ, কুমিল্লা",
        permanentAddress: "ইলিয়টগঞ্জ, কুমিল্লা",
      },
    });

    await prisma.guardianStudent.upsert({
      where: {
        guardianId_studentId: {
          guardianId: guardian2.id,
          studentId: student2.id,
        },
      },
      update: {},
      create: {
        guardianId: guardian2.id,
        studentId: student2.id,
        isPrimary: true,
      },
    });

    // Academic session for invoice test
    const session = await prisma.academicSession.findFirst();
    const sessionId = session ? session.id : (await prisma.academicSession.create({
      data: {
        name: "2026 Academic Session",
        code: "2026-P14",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        isCurrent: true,
      },
    })).id;

    // Student 1 Invoice
    const student1Invoice = await prisma.feeInvoice.upsert({
      where: { invoiceNumber: "INV-P14-ST1-001" },
      update: {},
      create: {
        invoiceNumber: "INV-P14-ST1-001",
        studentId: student1.id,
        sessionId,
        title: "মার্চ ২০২৬ বেতন",
        dueDate: new Date("2026-03-10"),
        totalAmount: 1500,
        netAmount: 1500,
        dueAmount: 1500,
      },
    });

    // Student 2 Invoice
    const student2Invoice = await prisma.feeInvoice.upsert({
      where: { invoiceNumber: "INV-P14-ST2-001" },
      update: {},
      create: {
        invoiceNumber: "INV-P14-ST2-001",
        studentId: student2.id,
        sessionId,
        title: "মার্চ ২০২৬ বেতন",
        dueDate: new Date("2026-03-10"),
        totalAmount: 2000,
        netAmount: 2000,
        dueAmount: 2000,
      },
    });

    // Clean up any previous test tickets for test users to ensure clean slate
    await prisma.supportRequest.deleteMany({
      where: {
        submittedByUserId: { in: [adminUser.id, guardianUser1.id, guardianUser2.id] },
      },
    });

    console.log("Fixtures initialized successfully.\n");

    // -------------------------------------------------------------
    // TEST 1: CATEGORY SEEDING & VERIFICATION
    // -------------------------------------------------------------
    console.log("--- Test 1: Category Seeding & Verification ---");
    await ensureDefaultHelpdeskCategories();
    const allCategories = await getHelpdeskCategories();
    assert(allCategories.length >= 12, `Default categories count >= 12 (Found: ${allCategories.length})`);
    const feeCat = allCategories.find((c) => c.code === "FEE_PAYMENT");
    assert(!!feeCat && feeCat.slaHours === 24, "FEE_PAYMENT category configured with 24 hours SLA");

    // -------------------------------------------------------------
    // TEST 2: CUSTOM CATEGORY CREATION & UPDATE
    // -------------------------------------------------------------
    console.log("\n--- Test 2: Custom Category Creation & Update ---");
    const testCatCode = `CUSTOM_CAT_${Date.now()}`;
    const customCat = await createHelpdeskCategory({
      code: testCatCode,
      nameBn: "বিশেষ অনুরোধ টেস্ট",
      nameEn: "Special Request Test",
      slaHours: 36,
      adminId: adminUser.id,
    });
    assert(customCat.code === testCatCode, `Custom category created with code ${testCatCode}`);

    const updatedCat = await updateHelpdeskCategory(customCat.id, {
      nameBn: "বিশেষ অনুরোধ টেস্ট (হালনাগাদ)",
      slaHours: 40,
      adminId: adminUser.id,
    });
    assert(updatedCat.nameBn === "বিশেষ অনুরোধ টেস্ট (হালনাগাদ)" && updatedCat.slaHours === 40, "Category updated successfully");

    // -------------------------------------------------------------
    // TEST 3: CONCURRENCY-SAFE TICKET NUMBER GENERATION
    // -------------------------------------------------------------
    console.log("\n--- Test 3: Concurrency-Safe Ticket Number Generation ---");
    const ticketNum1 = await generateNextTicketNumber("REQ");
    const ticketNum2 = await generateNextTicketNumber("REQ");
    assert(ticketNum1.startsWith("EHRJ-REQ-") && ticketNum2.startsWith("EHRJ-REQ-"), `Ticket number format valid (${ticketNum1})`);
    assert(ticketNum1 !== ticketNum2, `Unique sequential numbers generated (${ticketNum1} !== ${ticketNum2})`);

    // -------------------------------------------------------------
    // TEST 4: GUARDIAN AUTHORIZATION & CHILD LINK VERIFICATION
    // -------------------------------------------------------------
    console.log("\n--- Test 4: Guardian Child Access Authorization ---");
    const guardian1CanAccessStudent1 = await verifyGuardianStudentAccess(guardian1.id, student1.id);
    assert(guardian1CanAccessStudent1 === true, "Guardian 1 authorized for linked Student 1");

    const guardian1CanAccessStudent2 = await verifyGuardianStudentAccess(guardian1.id, student2.id);
    assert(guardian1CanAccessStudent2 === false, "Guardian 1 NOT authorized for Student 2 (Access blocked)");

    // -------------------------------------------------------------
    // TEST 5: RELATED ENTITY OWNERSHIP VERIFICATION (IDOR PROTECTION)
    // -------------------------------------------------------------
    console.log("\n--- Test 5: Related Entity Ownership Verification ---");
    const validInvoiceOwnership = await verifyRelatedEntityOwnership({
      relatedEntityType: "INVOICE",
      relatedEntityId: student1Invoice.id,
      studentId: student1.id,
      guardianId: guardian1.id,
    });
    assert(validInvoiceOwnership.valid === true, "Valid invoice linked to authorized student passes");

    const unownedInvoiceAttempt = await verifyRelatedEntityOwnership({
      relatedEntityType: "INVOICE",
      relatedEntityId: student2Invoice.id,
      studentId: student1.id, // Student 1 trying to claim Student 2's invoice
      guardianId: guardian1.id,
    });
    assert(unownedInvoiceAttempt.valid === false, "Cross-student invoice reference correctly blocked");

    // -------------------------------------------------------------
    // TEST 6: SUPPORT REQUEST CREATION
    // -------------------------------------------------------------
    console.log("\n--- Test 6: Support Request Creation ---");
    const ticket1 = await createSupportRequest({
      userId: guardianUser1.id,
      role: "GUARDIAN",
      guardianId: guardian1.id,
      studentId: student1.id,
      categoryCode: "FEE_PAYMENT",
      requestType: "COMPLAINT",
      priority: "IMPORTANT",
      subject: "মার্চ মাসের ফি ইনভয়েস সংক্রান্ত সমস্যা",
      description: "মার্চ ২০২৬ মাসের ইনভয়েসে অতিরিক্ত টাকা যোগ হয়েছে বলে মনে হচ্ছে। দয়া করে পুনঃযাচাই করুন।",
      relatedEntityType: "INVOICE",
      relatedEntityId: student1Invoice.id,
    });

    assert(!!ticket1.id && ticket1.ticketNumber.startsWith("EHRJ-REQ-"), `Ticket created with number: ${ticket1.ticketNumber}`);
    assert(ticket1.status === "SUBMITTED", "Initial status is SUBMITTED");
    assert(ticket1.messages.length === 1, "Initial message automatically created in thread");

    // -------------------------------------------------------------
    // TEST 7: DUPLICATE REQUEST PROTECTION
    // -------------------------------------------------------------
    console.log("\n--- Test 7: Duplicate Request Protection ---");
    let duplicateBlocked = false;
    try {
      await createSupportRequest({
        userId: guardianUser1.id,
        role: "GUARDIAN",
        guardianId: guardian1.id,
        studentId: student1.id,
        categoryCode: "FEE_PAYMENT",
        requestType: "COMPLAINT",
        subject: "মার্চ মাসের ফি ইনভয়েস সংক্রান্ত সমস্যা",
        description: "একই বিবরণ দিয়ে দ্বিতীয়বার সাবমিট করার চেষ্টা।",
      });
    } catch (err: any) {
      duplicateBlocked = true;
      assert(err.message.includes("ইতিমধ্যে জমা রয়েছে"), `Duplicate request blocked: "${err.message}"`);
    }
    assert(duplicateBlocked, "Rapid duplicate ticket within 15 minutes was successfully blocked");

    // -------------------------------------------------------------
    // TEST 8: UNAUTHORIZED STUDENT TICKET CREATION BLOCKED
    // -------------------------------------------------------------
    console.log("\n--- Test 8: Unauthorized Student Ticket Creation Blocked ---");
    let unauthorizedChildBlocked = false;
    try {
      await createSupportRequest({
        userId: guardianUser1.id,
        role: "GUARDIAN",
        guardianId: guardian1.id,
        studentId: student2.id, // Student 2 not linked to Guardian 1
        categoryCode: "ADMISSION",
        requestType: "SERVICE_REQUEST",
        subject: "অননুমোদিত ছাত্রের জন্য আবেদন",
        description: "টেস্ট বিবরণ",
      });
    } catch (err: any) {
      unauthorizedChildBlocked = true;
      assert(err.message.includes("Student is not linked"), "Submitting ticket for unlinked child is blocked");
    }
    assert(unauthorizedChildBlocked, "Security check: Guardian cannot submit ticket for another guardian's child");

    // -------------------------------------------------------------
    // TEST 9: TICKET QUERIES & PAGINATION
    // -------------------------------------------------------------
    console.log("\n--- Test 9: Admin Ticket Queue & Filters ---");
    const adminQueue = await getSupportRequests({
      categoryCode: "FEE_PAYMENT",
      page: 1,
      limit: 10,
    });
    assert(adminQueue.items.length >= 1, `Admin query returned items (Count: ${adminQueue.items.length})`);
    assert(adminQueue.pagination.total >= 1, `Pagination total count correct: ${adminQueue.pagination.total}`);

    // -------------------------------------------------------------
    // TEST 10: GUARDIAN TICKET ISOLATION (IDOR)
    // -------------------------------------------------------------
    console.log("\n--- Test 10: Guardian Ticket Isolation ---");
    const guardian1Tickets = await getGuardianSupportRequests({ guardianId: guardian1.id });
    const guardian2Tickets = await getGuardianSupportRequests({ guardianId: guardian2.id });

    assert(guardian1Tickets.items.some((t) => t.id === ticket1.id), "Guardian 1 sees their own ticket");
    assert(!guardian2Tickets.items.some((t) => t.id === ticket1.id), "Guardian 2 cannot see Guardian 1's ticket");

    // -------------------------------------------------------------
    // TEST 11: STATUS STATE MACHINE & TRANSITIONS
    // -------------------------------------------------------------
    console.log("\n--- Test 11: Status Transitions & State Machine ---");
    // SUBMITTED -> UNDER_REVIEW
    const underReview = await updateSupportRequestStatus({
      requestId: ticket1.id,
      toStatus: "UNDER_REVIEW",
      actorId: adminUser.id,
      actorRole: "ADMIN",
      notes: "প্রশাসনিক পর্যালোচনা শুরু হয়েছে।",
    });
    assert(underReview.status === "UNDER_REVIEW", "Transition: SUBMITTED -> UNDER_REVIEW");

    // UNDER_REVIEW -> IN_PROGRESS
    const inProgress = await updateSupportRequestStatus({
      requestId: ticket1.id,
      toStatus: "IN_PROGRESS",
      actorId: adminUser.id,
      actorRole: "ADMIN",
      notes: "হিসাব বিভাগের সাথে সমন্বয় চলছে।",
    });
    assert(inProgress.status === "IN_PROGRESS", "Transition: UNDER_REVIEW -> IN_PROGRESS");

    // IN_PROGRESS -> WAITING_FOR_INFORMATION
    const waitingInfo = await updateSupportRequestStatus({
      requestId: ticket1.id,
      toStatus: "WAITING_FOR_INFORMATION",
      actorId: adminUser.id,
      actorRole: "ADMIN",
      notes: "পেমেন্ট স্লিপ চাওয়া হয়েছে।",
    });
    assert(waitingInfo.status === "WAITING_FOR_INFORMATION", "Transition: IN_PROGRESS -> WAITING_FOR_INFORMATION");

    // WAITING_FOR_INFORMATION -> IN_PROGRESS
    const resumed = await updateSupportRequestStatus({
      requestId: ticket1.id,
      toStatus: "IN_PROGRESS",
      actorId: adminUser.id,
      actorRole: "ADMIN",
      notes: "অভিভাবক তথ্য দিয়েছেন।",
    });
    assert(resumed.status === "IN_PROGRESS", "Transition: WAITING_FOR_INFORMATION -> IN_PROGRESS");

    // IN_PROGRESS -> RESOLVED
    const resolved = await updateSupportRequestStatus({
      requestId: ticket1.id,
      toStatus: "RESOLVED",
      actorId: adminUser.id,
      actorRole: "ADMIN",
      resolutionSummary: "ইনভয়েস সমন্বয় করে অতিরিক্ত ফি মওকুফ করা হয়েছে।",
    });
    assert(resolved.status === "RESOLVED", "Transition: IN_PROGRESS -> RESOLVED");
    assert(resolved.resolutionDate !== null, "Resolution date recorded on resolution");
    assert(resolved.resolvedByUserId === adminUser.id, "Resolved by user recorded");

    // RESOLVED -> CLOSED
    const closed = await updateSupportRequestStatus({
      requestId: ticket1.id,
      toStatus: "CLOSED",
      actorId: adminUser.id,
      actorRole: "ADMIN",
      notes: "টিকিট সফলভাবে সমাপ্ত।",
    });
    assert(closed.status === "CLOSED", "Transition: RESOLVED -> CLOSED");
    assert(closed.closedAt !== null, "Closed at timestamp recorded");

    // -------------------------------------------------------------
    // TEST 12: INVALID TRANSITIONS BLOCKED
    // -------------------------------------------------------------
    console.log("\n--- Test 12: Invalid Transitions Blocked ---");
    let invalidTransitionBlocked = false;
    try {
      // CLOSED -> WAITING_FOR_INFORMATION is illegal
      await updateSupportRequestStatus({
        requestId: ticket1.id,
        toStatus: "WAITING_FOR_INFORMATION",
        actorId: adminUser.id,
        actorRole: "ADMIN",
      });
    } catch (err: any) {
      invalidTransitionBlocked = true;
      assert(err.message.includes("Invalid status transition"), `Illegal transition rejected: ${err.message}`);
    }
    assert(invalidTransitionBlocked, "State machine correctly blocked illegal status jump");

    // -------------------------------------------------------------
    // TEST 13: REOPEN REQUEST
    // -------------------------------------------------------------
    console.log("\n--- Test 13: Ticket Reopen Request ---");
    const reopenReq = await updateSupportRequestStatus({
      requestId: ticket1.id,
      toStatus: "REOPEN_REQUESTED",
      actorId: guardianUser1.id,
      actorRole: "GUARDIAN",
      notes: "সমস্যার সমাধান পুরোপুরি হয়নি, রশিদ এখনো আপডেট হয়নি।",
    });
    assert(reopenReq.status === "REOPEN_REQUESTED", "Status updated to REOPEN_REQUESTED");
    assert(reopenReq.reopenReason?.includes("রশিদ এখনো আপডেট হয়নি"), "Reopen reason persisted in database");

    // -------------------------------------------------------------
    // TEST 14: MESSAGES & INTERNAL NOTE ISOLATION
    // -------------------------------------------------------------
    console.log("\n--- Test 14: Internal Notes vs Public Messages Isolation ---");
    // Admin posts internal note
    const internalNote = await addSupportRequestMessage({
      requestId: ticket1.id,
      authorId: adminUser.id,
      authorRole: "ADMIN",
      content: "গোপন অভ্যন্তরীণ নোট: হিসাবরক্ষকের ভুল ছিল, সংশোধন দরকার।",
      isInternal: true,
    });
    assert(internalNote.isInternal === true, "Internal note created with isInternal=true");

    // Admin posts official response
    const publicMsg = await addSupportRequestMessage({
      requestId: ticket1.id,
      authorId: adminUser.id,
      authorRole: "ADMIN",
      content: "সম্মানিত অভিভাবক, আপনার ইনভয়েসটি সংশোধন করা হয়েছে। নতুন রশিদ দেখুন।",
      isInternal: false,
    });
    assert(publicMsg.isInternal === false, "Public response created with isInternal=false");

    // Query ticket as Admin: should see BOTH
    const adminView = await getSupportRequestById(ticket1.id, {
      userId: adminUser.id,
      role: "ADMIN",
    });
    assert(
      adminView?.messages.some((m) => m.id === internalNote.id),
      "Admin view includes internal note"
    );

    // Query ticket as Guardian: should NOT see internal note
    const guardianView = await getSupportRequestById(ticket1.id, {
      userId: guardianUser1.id,
      role: "GUARDIAN",
      guardianId: guardian1.id,
    });
    assert(
      !guardianView?.messages.some((m) => m.id === internalNote.id),
      "SECURITY PASS: Guardian view completely redacts internal notes"
    );
    assert(
      guardianView?.messages.some((m) => m.id === publicMsg.id),
      "Guardian view includes official public response"
    );

    // -------------------------------------------------------------
    // TEST 15: ATTACHMENTS & ISOLATION
    // -------------------------------------------------------------
    console.log("\n--- Test 15: Attachments Handling & Security ---");
    const attachment = await addSupportRequestAttachment({
      requestId: ticket1.id,
      uploadedById: adminUser.id,
      uploadedByRole: "ADMIN",
      fileName: "invoice_correction.pdf",
      fileUrl: "/uploads/helpdesk/invoice_correction.pdf",
      fileSize: 102400,
      mimeType: "application/pdf",
      isInternal: false,
    });
    assert(attachment.fileName === "invoice_correction.pdf", "Attachment added successfully");

    // -------------------------------------------------------------
    // TEST 16: DASHBOARD STATS & SLA CALCULATION
    // -------------------------------------------------------------
    console.log("\n--- Test 16: Dashboard Statistics & SLA ---");
    const dashboardStats = await getHelpdeskDashboardStats();
    assert(dashboardStats.totalRequests >= 1, `Total requests tracked: ${dashboardStats.totalRequests}`);
    assert(Array.isArray(dashboardStats.categoryDistribution), "Category distribution returned");
    assert(Array.isArray(dashboardStats.statusDistribution), "Status distribution returned");
    assert(typeof dashboardStats.avgResolutionHours === "number", `Average resolution hours: ${dashboardStats.avgResolutionHours}h`);

  } catch (err: any) {
    console.error("Test execution aborted with error:", err);
    failed++;
  }

  console.log("\n=================================================================");
  console.log(`  PHASE 14 UNIT & INTEGRATION TESTS FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase14UnitTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
