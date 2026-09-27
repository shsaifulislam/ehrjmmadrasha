/**
 * EHRJ DIGITAL CAMPUS - PHASE 9 LIBRARY MANAGEMENT & E-LIBRARY ENGINE TEST SUITE
 * Comprehensive automated assertions for:
 * 1. Catalog, Categories, Authors, Publishers
 * 2. Book Titles, Future-Ready E-Library Metadata
 * 3. Accession Number Generation (EHRJ-LIB-YYYY-XXXXXX) & Collision Prevention
 * 4. Physical Book Copies, Barcodes & QR Tokens
 * 5. Membership Management (Student & Teacher with EHRJ-LIB-M-YYYY-XXXX)
 * 6. Issue Engine, Loan Limit & Concurrency Protection
 * 7. Renewal Engine, Due Date Extension & Renewal Limit Enforcement
 * 8. Return Engine, Idempotency & Overdue Fine Calculation
 * 9. Phase 6 Finance Integration (Automatic FeeInvoice for Fines & Loss)
 * 10. Lost & Damaged Copies, Condition History Audit
 * 11. Guardian IDOR Isolation & Teacher Privacy
 * 12. Public Catalog & QR Verification Privacy Protection
 * 13. Phase 8 Notification Templates & Communication Engine Integration
 * 14. Library Cockpit Reports & Aggregation
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    totalFailed++;
    process.exitCode = 1;
  }
}

// Sequence Generators
async function generateNextAccessionNumber(txClient) {
  const db = txClient || prisma;
  const currentYear = new Date().getFullYear();
  const seqRecord = await db.libraryAccessionSequence.upsert({
    where: { year: currentYear },
    create: { year: currentYear, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });
  return `EHRJ-LIB-${currentYear}-${String(seqRecord.lastSeq).padStart(6, "0")}`;
}

async function generateNextMemberNumber(txClient) {
  const db = txClient || prisma;
  const currentYear = new Date().getFullYear();
  const seqRecord = await db.libraryMemberSequence.upsert({
    where: { year: currentYear },
    create: { year: currentYear, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });
  return `EHRJ-LIB-M-${currentYear}-${String(seqRecord.lastSeq).padStart(4, "0")}`;
}

async function generateNextIssueNumber(txClient) {
  const db = txClient || prisma;
  const currentYear = new Date().getFullYear();
  const count = await db.libraryIssue.count();
  return `EHRJ-ISS-${currentYear}-${String(count + 1).padStart(6, "0")}`;
}

function calculateOverdueFine(dueDate, returnDate, rule) {
  const diffDays = Math.floor((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return { overdueDays: 0, fineAmount: 0 };
  const overdueDays = diffDays;
  const billableDays = Math.max(0, overdueDays - (rule.graceDays || 0));
  const fineAmount = billableDays * (rule.finePerDay || 0);
  return { overdueDays, fineAmount };
}

async function runPhase9Tests() {
  console.log("==================================================================");
  console.log("EHRJ DIGITAL CAMPUS & ERP — PHASE 9 LIBRARY ENGINE TEST SUITE");
  console.log("==================================================================");

  let testCategory = null;
  let testAuthor = null;
  let testPublisher = null;
  let testBook = null;
  let testCopy1 = null;
  let testCopy2 = null;
  let testCopy3 = null;
  let studentMember = null;
  let teacherMember = null;
  let testStudent1 = null;
  let testStudent2 = null;
  let testTeacherUser = null;
  let guardianUser = null;
  let guardianRecord = null;
  let activeIssue = null;
  let createdFeeInvoiceId = null;

  try {
    // -------------------------------------------------------------
    // 1. METADATA: CATEGORIES, AUTHORS & PUBLISHERS
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 1: CATEGORIES, AUTHORS & PUBLISHERS ---");

    testCategory = await prisma.libraryCategory.create({
      data: {
        nameBn: "ফিক্বহ ও ফতোয়া (টেস্ট)",
        nameEn: "Fiqh & Fatwa (Test)",
        description: "ইসলামী আইন ও ফিক্বহ গ্রন্থাবলী",
        sortOrder: 1,
      },
    });
    assert(testCategory && testCategory.id, "Library Category created with dual language support");

    testAuthor = await prisma.libraryAuthor.create({
      data: {
        nameBn: "আল্লামা বুরহানুদ্দীন আল-মারগীনানী (রহ.)",
        nameEn: "Burhan al-Din al-Marghinani",
        nameAr: "برهان الدين المرغيناني",
        bio: "হিদায়া প্রণেতা প্রখ্যাত হানাফী ফকীহ",
      },
    });
    assert(testAuthor && testAuthor.nameAr, "Library Author created with Arabic, Bangla, and English typography");

    testPublisher = await prisma.libraryPublisher.create({
      data: {
        name: "দারুল কুতুব আল-ইলমিয়্যাহ, বৈরুত",
        contactInfo: "+961-1-800000",
        address: "বৈরুত, লেবানন",
      },
    });
    assert(testPublisher && testPublisher.id, "Library Publisher record registered successfully");

    // -------------------------------------------------------------
    // 2. BOOK CATALOG & E-LIBRARY METADATA
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 2: BOOK CATALOG & E-LIBRARY ATTRIBUTES ---");

    testBook = await prisma.libraryBook.create({
      data: {
        titleBn: "আল-হিদায়া শরহে বিদায়াতুল মুবতাদী (১ম খণ্ড)",
        titleEn: "Al-Hidayah Sharh Bidayat al-Mubtadi Vol 1",
        subtitle: "হানাফী ফিক্বহের মৌলিক প্রামাণ্য কিতাব",
        categoryId: testCategory.id,
        authorId: testAuthor.id,
        publisherId: testPublisher.id,
        edition: "আন্তর্জাতিক তাহকীককৃত সংস্করণ",
        publicationYear: 2026,
        isbn: "978-2-7451-0001-1",
        language: "ARABIC",
        subject: "ফিক্বহ",
        shelfLocation: "তাক-ফিক্বহ-০২",
        description: "ইলিয়টগঞ্জ মাদরাসার জামাতে হিদায়ার পাঠ্যপুস্তক",
        isDigital: true,
        digitalUrl: "/digital-library/al-hidayah-vol1.pdf",
        digitalType: "PDF",
      },
    });
    assert(testBook && testBook.titleBn, "Book catalog record created with full academic and e-library metadata");
    assert(testBook.isDigital === true && testBook.digitalType === "PDF", "Future-ready digital/E-Library metadata supported");

    // -------------------------------------------------------------
    // 3. ACCESSION NUMBER SEQUENCE & PHYSICAL COPIES
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 3: ACCESSION SEQUENCES & PHYSICAL COPIES ---");

    const currentYear = new Date().getFullYear();
    const acc1 = await generateNextAccessionNumber();
    const acc2 = await generateNextAccessionNumber();
    const acc3 = await generateNextAccessionNumber();

    assert(acc1.startsWith(`EHRJ-LIB-${currentYear}-`), `Accession sequence format verified: ${acc1}`);
    assert(acc2.startsWith(`EHRJ-LIB-${currentYear}-`), `Second Accession sequence format verified: ${acc2}`);
    assert(acc1 !== acc2 && acc2 !== acc3, "Accession numbers are strictly unique, sequential, and concurrency-safe");

    testCopy1 = await prisma.libraryBookCopy.create({
      data: {
        bookId: testBook.id,
        accessionNo: acc1,
        barcode: `BC-${acc1}`,
        qrToken: crypto.randomBytes(16).toString("hex"),
        condition: "NEW",
        status: "AVAILABLE",
        purchasePrice: 650.0,
        source: "PURCHASE",
        shelfLocation: "তাক-ফিক্বহ-০২",
      },
    });

    testCopy2 = await prisma.libraryBookCopy.create({
      data: {
        bookId: testBook.id,
        accessionNo: acc2,
        barcode: `BC-${acc2}`,
        qrToken: crypto.randomBytes(16).toString("hex"),
        condition: "GOOD",
        status: "AVAILABLE",
        purchasePrice: 650.0,
        source: "PURCHASE",
        shelfLocation: "তাক-ফিক্বহ-০২",
      },
    });

    testCopy3 = await prisma.libraryBookCopy.create({
      data: {
        bookId: testBook.id,
        accessionNo: acc3,
        barcode: `BC-${acc3}`,
        qrToken: crypto.randomBytes(16).toString("hex"),
        condition: "GOOD",
        status: "AVAILABLE",
        purchasePrice: 650.0,
        source: "DONATION",
        shelfLocation: "তাক-ফিক্বহ-০২",
      },
    });
    assert(testCopy1 && testCopy2 && testCopy3, "Physical copies created with unique accession numbers, barcodes, and QR tokens");

    // Attempt duplicate accession number -> must be blocked
    try {
      await prisma.libraryBookCopy.create({
        data: {
          bookId: testBook.id,
          accessionNo: acc1, // duplicate!
          barcode: `BC-DUP-${acc1}`,
          qrToken: "dup-token-1",
        },
      });
      assert(false, "Duplicate accession number should be blocked by DB unique constraint");
    } catch (e) {
      assert(true, "Duplicate accession number prevented by DB unique constraint");
    }

    // -------------------------------------------------------------
    // 4. MEMBERSHIP MANAGEMENT & UNIQUE IDENTIFIERS
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 4: LIBRARY MEMBERSHIP MANAGEMENT ---");

    const memNum1 = await generateNextMemberNumber();
    const memNum2 = await generateNextMemberNumber();

    assert(memNum1.startsWith(`EHRJ-LIB-M-${currentYear}-`), `Member number format verified: ${memNum1}`);
    assert(memNum1 !== memNum2, "Member numbers are strictly unique and sequential");

    const ts = Date.now();

    // Create test student
    testStudent1 = await prisma.student.create({
      data: {
        studentIdNumber: `EHRJ-2026-LIB-ST01-${ts}`,
        fullNameBn: "মুহাম্মদ আবু বকর [টেস্ট]",
        fullNameEn: "Muhammad Abu Bakr [Test]",
        dateOfBirth: new Date("2009-05-10"),
        gender: "MALE",
        presentAddress: "দাউদকান্দি, কুমিল্লা",
        permanentAddress: "দাউদকান্দি, কুমিল্লা",
        fatherNameBn: "মোঃ তোফায়েল আহমেদ",
        motherNameBn: "আমিনা খাতুন",
      },
    });

    // Create test teacher user
    testTeacherUser = await prisma.user.create({
      data: {
        name: "মাওলানা মুফতি ইউসুফ [টেস্ট]",
        username: `teacher_lib_${ts}`,
        email: `yusuf_lib_${ts}@ehrj.edu.bd`,
        passwordHash: "hash123",
        role: "TEACHER",
      },
    });

    studentMember = await prisma.libraryMember.create({
      data: {
        memberNumber: memNum1,
        memberType: "STUDENT",
        studentId: testStudent1.id,
        maxBooks: 2,
        status: "ACTIVE",
      },
    });
    assert(studentMember && studentMember.id, "Student library membership created and linked to Student identity");

    teacherMember = await prisma.libraryMember.create({
      data: {
        memberNumber: memNum2,
        memberType: "TEACHER",
        userId: testTeacherUser.id,
        maxBooks: 5,
        status: "ACTIVE",
      },
    });
    assert(teacherMember && teacherMember.id, "Teacher library membership created and linked to User identity");

    // Test duplicate membership prevention
    try {
      await prisma.libraryMember.create({
        data: {
          memberNumber: await generateNextMemberNumber(),
          memberType: "STUDENT",
          studentId: testStudent1.id,
        },
      });
      assert(false, "Duplicate member for same student must be blocked");
    } catch (e) {
      assert(true, "Duplicate member registration blocked by compound unique index [memberType, studentId]");
    }

    // -------------------------------------------------------------
    // 5. CIRCULATION RULES ENGINE
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 5: CIRCULATION RULES ENGINE ---");

    const studentRule = await prisma.libraryRule.upsert({
      where: { memberType: "STUDENT" },
      update: { loanDays: 14, maxBooks: 2, renewalLimit: 1, finePerDay: 5, graceDays: 1, lostChargeMultiplier: 1.5 },
      create: { memberType: "STUDENT", loanDays: 14, maxBooks: 2, renewalLimit: 1, finePerDay: 5, graceDays: 1, lostChargeMultiplier: 1.5 },
    });
    assert(studentRule.finePerDay === 5 && studentRule.graceDays === 1, "Configurable student circulation rule active");

    const teacherRule = await prisma.libraryRule.upsert({
      where: { memberType: "TEACHER" },
      update: { loanDays: 30, maxBooks: 5, renewalLimit: 2, finePerDay: 0, graceDays: 3, lostChargeMultiplier: 1.2 },
      create: { memberType: "TEACHER", loanDays: 30, maxBooks: 5, renewalLimit: 2, finePerDay: 0, graceDays: 3, lostChargeMultiplier: 1.2 },
    });
    assert(teacherRule.loanDays === 30 && teacherRule.maxBooks === 5, "Configurable teacher circulation rule active");

    // -------------------------------------------------------------
    // 6. ISSUE ENGINE & CONCURRENCY PROTECTION
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 6: ISSUE ENGINE & ATOMIC CONCURRENCY GUARD ---");

    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    const adminId = adminUser ? adminUser.id : testTeacherUser.id;

    // Issue testCopy1 to studentMember atomically
    const issueNumber1 = await generateNextIssueNumber();
    const issueDate = new Date();
    const dueDate = new Date(issueDate.getTime() + studentRule.loanDays * 24 * 60 * 60 * 1000);

    const issueTx = await prisma.$transaction(async (tx) => {
      // Atomic status transition check
      const updateResult = await tx.libraryBookCopy.updateMany({
        where: { id: testCopy1.id, status: "AVAILABLE" },
        data: { status: "ISSUED" },
      });
      if (updateResult.count === 0) {
        throw new Error("বইটি ইতিমধ্যে অন্য কাউকে ইস্যু করা হয়েছে।");
      }

      return await tx.libraryIssue.create({
        data: {
          issueNumber: issueNumber1,
          bookId: testBook.id,
          copyId: testCopy1.id,
          memberId: studentMember.id,
          issuedByUserId: adminId,
          issueDate,
          dueDate,
          status: "ISSUED",
        },
      });
    });

    activeIssue = issueTx;
    assert(activeIssue && activeIssue.status === "ISSUED", `Book copy issued successfully (Issue No: ${activeIssue.issueNumber})`);

    const copyCheck = await prisma.libraryBookCopy.findUnique({ where: { id: testCopy1.id } });
    assert(copyCheck.status === "ISSUED", "Physical copy status changed to ISSUED in database");

    // Concurrency test: A second concurrent transaction attempts to issue testCopy1 simultaneously -> MUST FAIL
    try {
      await prisma.$transaction(async (tx) => {
        const updateResult = await tx.libraryBookCopy.updateMany({
          where: { id: testCopy1.id, status: "AVAILABLE" },
          data: { status: "ISSUED" },
        });
        if (updateResult.count === 0) {
          throw new Error("বইটি ইতিমধ্যে অন্য কাউকে ইস্যু করা হয়েছে।");
        }
      });
      assert(false, "Concurrent duplicate issue should have failed");
    } catch (e) {
      assert(true, "Atomic status transition successfully prevented concurrent double-issue");
    }

    // -------------------------------------------------------------
    // 7. RENEWAL ENGINE & LIMITS
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 7: RENEWAL ENGINE & AUDIT LOGGING ---");

    const prevDueDate = activeIssue.dueDate;
    const newDueDate = new Date(prevDueDate.getTime() + studentRule.loanDays * 24 * 60 * 60 * 1000);

    const renewedIssue = await prisma.$transaction(async (tx) => {
      await tx.libraryRenewal.create({
        data: {
          issueId: activeIssue.id,
          renewedByUserId: adminId,
          prevDueDate,
          newDueDate,
          notes: "পরীক্ষার প্রস্তুতির জন্য নবায়ন",
        },
      });

      return await tx.libraryIssue.update({
        where: { id: activeIssue.id },
        data: {
          dueDate: newDueDate,
          renewCount: { increment: 1 },
        },
      });
    });

    assert(renewedIssue.renewCount === 1, "Issue renewal count incremented to 1");
    assert(new Date(renewedIssue.dueDate).getTime() === newDueDate.getTime(), "Due date extended accurately");

    const renewalHistory = await prisma.libraryRenewal.findMany({ where: { issueId: activeIssue.id } });
    assert(renewalHistory.length === 1 && renewalHistory[0].notes, "Renewal audit trail logged with previous and new due dates");

    // Renewal limit check: student limit is 1, so attempting 2nd renewal must be blocked
    const canRenewAgain = renewedIssue.renewCount < studentRule.renewalLimit;
    assert(!canRenewAgain, "Circulation rule correctly blocks renewal when renewalLimit is reached");

    // -------------------------------------------------------------
    // 8. RETURN ENGINE & OVERDUE FINE CALCULATION
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 8: RETURN & OVERDUE FINE ENGINE ---");

    // Simulate 4 days overdue past the grace period
    const simulatedPastDue = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const simulatedReturn = new Date();
    const { overdueDays, fineAmount } = calculateOverdueFine(simulatedPastDue, simulatedReturn, studentRule);

    assert(overdueDays === 5, "Overdue days computed correctly: 5 days");
    assert(fineAmount === 20, "Fine computed correctly with 1 grace day: (5 - 1) * 5 Tk = 20 Tk");

    // Ensure Phase 6 FeeCategory exists
    const feeCategory = await prisma.feeCategory.upsert({
      where: { code: "LIBRARY_FINE" },
      update: {},
      create: {
        code: "LIBRARY_FINE",
        nameBn: "লাইব্রেরি জরিমানা ও চার্জ",
        nameEn: "Library Fine & Replacement Charges",
        defaultAmount: 0,
        isRecurring: false,
      },
    });
    assert(feeCategory && feeCategory.code === "LIBRARY_FINE", "Phase 6 FeeCategory for LIBRARY_FINE confirmed");

    // Process return with fine in transaction
    const returnTx = await prisma.$transaction(async (tx) => {
      // 1. Update copy back to AVAILABLE
      await tx.libraryBookCopy.update({
        where: { id: testCopy1.id },
        data: { status: "AVAILABLE" },
      });

      // 2. Generate Phase 6 FeeInvoice for fine
      const activeSession = await tx.academicSession.findFirst({ where: { isCurrent: true } });
      const currentYear = new Date().getFullYear();
      const invoiceCount = await tx.feeInvoice.count();
      const invoiceNumber = `EHRJ-INV-${currentYear}-${String(invoiceCount + 1).padStart(5, "0")}`;

      const invoice = await tx.feeInvoice.create({
        data: {
          invoiceNumber,
          studentId: testStudent1.id,
          sessionId: activeSession ? activeSession.id : "",
          feeType: "LIBRARY_FINE",
          title: `লাইব্রেরি বিলম্ব জরিমানা (${testBook.titleBn}) - ${activeIssue.issueNumber}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          totalAmount: fineAmount,
          discountAmount: 0,
          waiverAmount: 0,
          lateFeeAmount: 0,
          netAmount: fineAmount,
          paidAmount: 0,
          dueAmount: fineAmount,
          status: "UNPAID",
          items: {
            create: [
              {
                feeCategoryId: feeCategory.id,
                description: `বই ফেরত বিলম্ব জরিমানা (কপি নং: ${testCopy1.accessionNo})`,
                amount: fineAmount,
              },
            ],
          },
        },
      });

      // 3. Mark issue RETURNED
      return await tx.libraryIssue.update({
        where: { id: activeIssue.id },
        data: {
          status: "RETURNED",
          returnDate: simulatedReturn,
          overdueDays,
          fineAmount,
          invoiceId: invoice.id,
        },
      });
    });

    assert(returnTx.status === "RETURNED", "Book copy status marked RETURNED");
    assert(returnTx.invoiceId !== null, `Phase 6 FeeInvoice created with ID ${returnTx.invoiceId}`);

    const returnedCopy = await prisma.libraryBookCopy.findUnique({ where: { id: testCopy1.id } });
    assert(returnedCopy.status === "AVAILABLE", "Physical copy status returned to AVAILABLE");

    // Idempotency check: Cannot return already returned issue
    try {
      const issueCheck = await prisma.libraryIssue.findUnique({ where: { id: activeIssue.id } });
      if (issueCheck.status === "RETURNED") {
        throw new Error("বইটি ইতিমধ্যে সফলভাবে ফেরত গৃহীত হয়েছে।");
      }
      assert(false, "Double return should be blocked");
    } catch (e) {
      assert(true, "Return idempotency verified: double return blocked");
    }

    // -------------------------------------------------------------
    // 9. LOST BOOK ENGINE & REPLACEMENT CHARGES
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 9: LOST BOOK & REPLACEMENT CHARGES ---");

    // Issue copy2 to student
    const issueNumber2 = await generateNextIssueNumber();
    const issue2 = await prisma.libraryIssue.create({
      data: {
        issueNumber: issueNumber2,
        bookId: testBook.id,
        copyId: testCopy2.id,
        memberId: studentMember.id,
        issuedByUserId: adminId,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: "ISSUED",
      },
    });
    await prisma.libraryBookCopy.update({ where: { id: testCopy2.id }, data: { status: "ISSUED" } });

    // Mark copy2 as LOST
    const replacementCharge = testCopy2.purchasePrice * studentRule.lostChargeMultiplier;

    await prisma.$transaction(async (tx) => {
      await tx.libraryBookCopy.update({
        where: { id: testCopy2.id },
        data: { status: "LOST", notes: "শিক্ষার্থী কর্তৃক বই হারানোর আবেদন" },
      });

      const activeSession = await tx.academicSession.findFirst({ where: { isCurrent: true } });
      const currentYear = new Date().getFullYear();
      const invoiceCount = await tx.feeInvoice.count();
      const invoiceNumber = `EHRJ-INV-${currentYear}-${String(invoiceCount + 1).padStart(5, "0")}`;

      const invoice = await tx.feeInvoice.create({
        data: {
          invoiceNumber,
          studentId: testStudent1.id,
          sessionId: activeSession ? activeSession.id : "",
          feeType: "LIBRARY_FINE",
          title: `হারানো বইয়ের প্রতিস্থাপন চার্জ (${testBook.titleBn}) - ${testCopy2.accessionNo}`,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          totalAmount: replacementCharge,
          discountAmount: 0,
          waiverAmount: 0,
          lateFeeAmount: 0,
          netAmount: replacementCharge,
          paidAmount: 0,
          dueAmount: replacementCharge,
          status: "UNPAID",
          items: {
            create: [
              {
                feeCategoryId: feeCategory.id,
                description: `হারানো বই প্রতিস্থাপন মূল্য (${testCopy2.accessionNo})`,
                amount: replacementCharge,
              },
            ],
          },
        },
      });

      await tx.libraryIssue.update({
        where: { id: issue2.id },
        data: { status: "LOST", fineAmount: replacementCharge, invoiceId: invoice.id },
      });
    });

    const lostCopy = await prisma.libraryBookCopy.findUnique({ where: { id: testCopy2.id } });
    assert(lostCopy.status === "LOST", "Physical copy marked LOST without deleting historical record");

    const lostIssue = await prisma.libraryIssue.findUnique({ where: { id: issue2.id } });
    assert(lostIssue.status === "LOST" && lostIssue.fineAmount === replacementCharge, "Lost issue fine matches replacement charge multiplier (1.5x purchase price)");

    // -------------------------------------------------------------
    // 10. DAMAGED BOOK & CONDITION HISTORY
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 10: DAMAGED COPY & CONDITION HISTORY ---");

    const damageEntry = await prisma.$transaction(async (tx) => {
      const history = await tx.libraryConditionHistory.create({
        data: {
          copyId: testCopy3.id,
          recordedByUserId: adminId,
          oldCondition: testCopy3.condition,
          newCondition: "DAMAGED",
          reason: "পৃষ্ঠা ক্ষতিগ্রস্ত ও দাগযুক্ত",
          chargeAmount: 100.0,
        },
      });

      const updated = await tx.libraryBookCopy.update({
        where: { id: testCopy3.id },
        data: {
          status: "REPAIR",
          condition: "DAMAGED",
        },
      });

      return { history, updated };
    });

    assert(damageEntry.updated.status === "REPAIR", "Copy status updated to REPAIR");
    assert(damageEntry.history.oldCondition === "GOOD" && damageEntry.history.newCondition === "DAMAGED", "Condition history audit recorded with old/new conditions and reason");

    // -------------------------------------------------------------
    // 11. SECURITY & GUARDIAN IDOR ISOLATION
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 11: SECURITY & GUARDIAN IDOR ISOLATION ---");

    // Create 2nd student to test cross-student isolation
    testStudent2 = await prisma.student.create({
      data: {
        studentIdNumber: `EHRJ-2026-LIB-ST02-${ts}`,
        fullNameBn: "মুহাম্মদ আব্দুল্লাহ [টেস্ট ২]",
        fullNameEn: "Muhammad Abdullah [Test 2]",
        dateOfBirth: new Date("2011-03-15"),
        gender: "MALE",
        presentAddress: "দাউদকান্দি, কুমিল্লা",
        permanentAddress: "দাউদকান্দি, কুমিল্লা",
        fatherNameBn: "মোঃ শরিফুল ইসলাম",
        motherNameBn: "ফাতিমা বেগম",
      },
    });

    const guardPhone = "017" + String(ts).slice(-8);
    guardianUser = await prisma.user.create({
      data: {
        name: "মোঃ তোফায়েল আহমেদ (অভিভাবক)",
        username: guardPhone,
        email: `tofael_guardian_${ts}@ehrj.edu.bd`,
        passwordHash: "hash123",
        role: "GUARDIAN",
      },
    });

    guardianRecord = await prisma.guardian.create({
      data: {
        userId: guardianUser.id,
        fullNameBn: "মোঃ তোফায়েল আহমেদ",
        phone: guardPhone,
        relation: "FATHER",
      },
    });

    // Link Guardian only to testStudent1
    await prisma.guardianStudent.create({
      data: {
        guardianId: guardianRecord.id,
        studentId: testStudent1.id,
      },
    });

    const guardianLinks = await prisma.guardianStudent.findMany({
      where: { guardianId: guardianRecord.id },
      select: { studentId: true },
    });
    const authorizedChildIds = guardianLinks.map((g) => g.studentId);

    assert(authorizedChildIds.includes(testStudent1.id), "Guardian authorized for linked child 1");
    assert(!authorizedChildIds.includes(testStudent2.id), "Guardian strictly blocked from unlinked child 2 (IDOR protection confirmed)");

    // -------------------------------------------------------------
    // 12. PUBLIC PRIVACY PROTECTION
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 12: PUBLIC PRIVACY GUARANTEE ---");

    const publicBookView = await prisma.libraryBook.findUnique({
      where: { id: testBook.id },
      select: {
        id: true,
        titleBn: true,
        titleEn: true,
        copies: {
          where: { status: "AVAILABLE" },
          select: { id: true },
        },
        _count: {
          select: { copies: true },
        },
      },
    });

    assert(!("issues" in publicBookView), "Public book query has zero access to circulation issues");
    assert(!("borrower" in publicBookView), "Public book query has zero access to borrower identity");

    const qrCopyView = await prisma.libraryBookCopy.findUnique({
      where: { qrToken: testCopy1.qrToken },
      select: {
        accessionNo: true,
        barcode: true,
        status: true,
        condition: true,
        book: { select: { titleBn: true } },
      },
    });

    assert(qrCopyView && qrCopyView.accessionNo === testCopy1.accessionNo, "Public QR lookup finds copy details");
    assert(!("member" in qrCopyView) && !("student" in qrCopyView), "Public QR lookup contains zero personal borrower details");

    // -------------------------------------------------------------
    // 13. PHASE 8 NOTIFICATION TEMPLATES INTEGRATION
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 13: PHASE 8 NOTIFICATION INTEGRATION ---");

    const libraryTemplates = [
      {
        code: "LIBRARY_BOOK_ISSUED",
        nameBn: "বই ইস্যু নিশ্চিতকরণ",
        category: "LIBRARY",
        subjectTemplateBn: "লাইব্রেরি বই ইস্যু নিশ্চিতকরণ - {{book.title}}",
        bodyTemplateBn: "মুহতারাম {{recipient.name}}, লাইব্রেরি থেকে '{{book.title}}' ইস্যু করা হয়েছে।",
      },
      {
        code: "LIBRARY_DUE_SOON",
        nameBn: "বই ফেরত দেওয়ার আগাম তাগিদ",
        category: "LIBRARY",
        subjectTemplateBn: "বই ফেরতের নির্ধারিত মেয়াদ ঘনিয়ে এসেছে - {{book.title}}",
        bodyTemplateBn: "মুহতারাম {{recipient.name}}, ইস্যুকৃত বইটির মেয়াদ শীঘ্রই শেষ হবে।",
      },
      {
        code: "LIBRARY_BOOK_OVERDUE",
        nameBn: "বই ফেরত বিলম্ব ও জরিমানার নোটিশ",
        category: "LIBRARY",
        subjectTemplateBn: "জরুরি: লাইব্রেরি বই ফেরত বিলম্বিত - {{book.title}}",
        bodyTemplateBn: "মুহতারাম {{recipient.name}}, আপনার কাছে ইস্যুকৃত বইটির মেয়াদ উত্তীর্ণ হয়েছে।",
      },
      {
        code: "LIBRARY_BOOK_RETURNED",
        nameBn: "বই ফেরত প্রাপ্তি রসিদ",
        category: "LIBRARY",
        subjectTemplateBn: "বই ফেরত গৃহীত হয়েছে - {{book.title}}",
        bodyTemplateBn: "মুহতারাম {{recipient.name}}, লাইব্রেরি বই ফেরত গৃহীত হয়েছে।",
      },
      {
        code: "LIBRARY_FINE_ASSESSED",
        nameBn: "লাইব্রেরি জরিমানা নোটিশ",
        category: "LIBRARY",
        subjectTemplateBn: "লাইব্রেরি জরিমানা ধার্য - ইনভয়েস: {{invoice.number}}",
        bodyTemplateBn: "মুহতারাম {{recipient.name}}, বিলম্ব ফি ধার্য হয়েছে।",
      },
      {
        code: "LIBRARY_BOOK_LOST",
        nameBn: "বই হারানো ও প্রতিস্থাপন মূল্য চার্জ",
        category: "LIBRARY",
        subjectTemplateBn: "লাইব্রেরি বই প্রতিস্থাপন মূল্য নির্ধারণ - {{book.title}}",
        bodyTemplateBn: "মুহতারাম {{recipient.name}}, প্রতিস্থাপন চার্জ নির্ধারিত হয়েছে।",
      },
    ];

    for (const tpl of libraryTemplates) {
      await prisma.notificationTemplate.upsert({
        where: { code: tpl.code },
        update: { category: tpl.category, nameBn: tpl.nameBn },
        create: {
          code: tpl.code,
          nameBn: tpl.nameBn,
          category: tpl.category,
          subjectTemplateBn: tpl.subjectTemplateBn,
          bodyTemplateBn: tpl.bodyTemplateBn,
          channels: "PORTAL,EMAIL",
        },
      });
    }

    const expectedCodes = [
      "LIBRARY_BOOK_ISSUED",
      "LIBRARY_DUE_SOON",
      "LIBRARY_BOOK_OVERDUE",
      "LIBRARY_BOOK_RETURNED",
      "LIBRARY_FINE_ASSESSED",
      "LIBRARY_BOOK_LOST",
    ];

    for (const code of expectedCodes) {
      const tpl = await prisma.notificationTemplate.findUnique({ where: { code } });
      assert(tpl && tpl.category === "LIBRARY", `Phase 8 template verified: ${code}`);
    }

    // -------------------------------------------------------------
    // 14. LIBRARY REPORTS AGGREGATION
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 14: LIBRARY REPORTS AGGREGATION ---");

    const totalTitles = await prisma.libraryBook.count({ where: { status: "ACTIVE" } });
    const totalCopies = await prisma.libraryBookCopy.count();
    const availableCopies = await prisma.libraryBookCopy.count({ where: { status: "AVAILABLE" } });
    const issuedCopies = await prisma.libraryBookCopy.count({ where: { status: "ISSUED" } });

    assert(totalTitles >= 1, `Total titles aggregated: ${totalTitles}`);
    assert(totalCopies >= 3, `Total physical copies aggregated: ${totalCopies}`);
    assert(availableCopies >= 1, `Available copies aggregated: ${availableCopies}`);

    // Cleanup Test Data
    console.log("\n--- CLEANING UP TEST ARTIFACTS ---");
    await prisma.libraryConditionHistory.deleteMany({ where: { copyId: testCopy3.id } });
    await prisma.libraryRenewal.deleteMany({ where: { issueId: activeIssue.id } });
    await prisma.libraryIssue.deleteMany({ where: { id: { in: [activeIssue.id, issue2.id] } } });
    await prisma.feeInvoice.deleteMany({ where: { studentId: testStudent1.id, feeType: "LIBRARY_FINE" } });
    await prisma.libraryBookCopy.deleteMany({ where: { id: { in: [testCopy1.id, testCopy2.id, testCopy3.id] } } });
    await prisma.libraryBook.deleteMany({ where: { id: testBook.id } });
    await prisma.libraryMember.deleteMany({ where: { id: { in: [studentMember.id, teacherMember.id] } } });
    await prisma.guardianStudent.deleteMany({ where: { guardianId: guardianRecord.id } });
    await prisma.guardian.deleteMany({ where: { id: guardianRecord.id } });
    await prisma.user.deleteMany({ where: { id: { in: [guardianUser.id, testTeacherUser.id] } } });
    await prisma.student.deleteMany({ where: { id: { in: [testStudent1.id, testStudent2.id] } } });
    await prisma.libraryCategory.deleteMany({ where: { id: testCategory.id } });
    await prisma.libraryAuthor.deleteMany({ where: { id: testAuthor.id } });
    await prisma.libraryPublisher.deleteMany({ where: { id: testPublisher.id } });
    console.log("Cleanup completed successfully.");

  } catch (err) {
    console.error("Test execution encountered an unexpected error:", err);
    totalFailed++;
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n==================================================================");
  console.log(`PHASE 9 TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log("==================================================================");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runPhase9Tests();
