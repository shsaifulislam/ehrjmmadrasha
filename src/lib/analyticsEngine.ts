import { prisma } from "@/lib/prisma";

export interface DateFilterRange {
  startDate?: Date;
  endDate?: Date;
  label: string;
}

/**
 * Parse date filter preset to Date range
 */
export function parseDateFilter(
  filterType?: string,
  customStart?: string,
  customEnd?: string
): DateFilterRange {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (filterType?.toUpperCase()) {
    case "TODAY":
      return { startDate: todayStart, endDate: todayEnd, label: "আজকের তথ্য" };

    case "YESTERDAY": {
      const yStart = new Date(todayStart);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(todayEnd);
      yEnd.setDate(yEnd.getDate() - 1);
      return { startDate: yStart, endDate: yEnd, label: "গতকালের তথ্য" };
    }

    case "THIS_WEEK": {
      const wStart = new Date(todayStart);
      wStart.setDate(wStart.getDate() - 7);
      return { startDate: wStart, endDate: todayEnd, label: "গত ৭ দিন" };
    }

    case "THIS_MONTH": {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { startDate: mStart, endDate: todayEnd, label: "চলতি মাস" };
    }

    case "PREVIOUS_MONTH": {
      const prevMStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const prevMEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: prevMStart, endDate: prevMEnd, label: "গত মাস" };
    }

    case "CUSTOM": {
      const s = customStart ? new Date(customStart) : undefined;
      const e = customEnd ? new Date(customEnd) : undefined;
      return { startDate: s, endDate: e, label: "কাস্টম সময়কাল" };
    }

    case "ALL_TIME":
    default:
      return { startDate: undefined, endDate: undefined, label: "সর্বকালের তথ্য" };
  }
}

// -------------------------------------------------------------
// 1. EXECUTIVE OVERVIEW & KPI CARDS
// -------------------------------------------------------------
export async function getOverviewAnalytics(filterType?: string, customStart?: string, customEnd?: string) {
  const dateRange = parseDateFilter(filterType, customStart, customEnd);
  const dateFilter = dateRange.startDate && dateRange.endDate ? {
    createdAt: { gte: dateRange.startDate, lte: dateRange.endDate }
  } : {};

  // 1. Students KPI
  const [
    totalStudents,
    activeStudents,
    residentialStudents,
    dayCareStudents,
    nonResidentialStudents,
    orphanStudents,
    assistanceStudents,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.student.count({ where: { residentialStatus: "RESIDENTIAL", status: "ACTIVE" } }),
    prisma.student.count({ where: { residentialStatus: "DAY_CARE", status: "ACTIVE" } }),
    prisma.student.count({ where: { residentialStatus: "NON_RESIDENTIAL", status: "ACTIVE" } }),
    prisma.student.count({ where: { isOrphan: true, status: "ACTIVE" } }),
    prisma.student.count({ where: { isFinanciallyWeak: true, status: "ACTIVE" } }),
  ]);

  // 2. Admissions KPI
  const [
    totalApplications,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
  ] = await Promise.all([
    prisma.application.count({ where: dateFilter }),
    prisma.application.count({ where: { status: "SUBMITTED" } }),
    prisma.application.count({ where: { status: "APPROVED", ...dateFilter } }),
    prisma.application.count({ where: { status: "REJECTED", ...dateFilter } }),
  ]);

  const admissionConversionRate = totalApplications > 0
    ? Math.round((approvedApplications / totalApplications) * 100)
    : 0;

  // 3. Attendance KPI (Today's snapshot)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [presentToday, absentToday, lateToday, leaveToday] = await Promise.all([
    prisma.attendance.count({ where: { date: { gte: today, lt: tomorrow }, status: "PRESENT" } }),
    prisma.attendance.count({ where: { date: { gte: today, lt: tomorrow }, status: "ABSENT" } }),
    prisma.attendance.count({ where: { date: { gte: today, lt: tomorrow }, status: "LATE" } }),
    prisma.attendance.count({ where: { date: { gte: today, lt: tomorrow }, status: "LEAVE" } }),
  ]);

  const totalMarkedToday = presentToday + absentToday + lateToday + leaveToday;
  const attendanceRateToday = totalMarkedToday > 0
    ? Math.round(((presentToday + lateToday) / totalMarkedToday) * 100)
    : 0;

  // 4. Academic / Results KPI
  const [totalExams, publishedExams, totalResults, passedResults, mumtazResults] = await Promise.all([
    prisma.exam.count(),
    prisma.exam.count({ where: { isPublished: true } }),
    prisma.result.count(),
    prisma.result.count({ where: { isPassed: true } }),
    prisma.result.count({ where: { finalGradeBn: { contains: "মুমতাজ" } } }),
  ]);

  const overallPassRate = totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0;

  // 5. Finance KPI
  const invoiceDateFilter = dateRange.startDate && dateRange.endDate ? {
    createdAt: { gte: dateRange.startDate, lte: dateRange.endDate }
  } : {};

  const receiptDateFilter = dateRange.startDate && dateRange.endDate ? {
    receiptDate: { gte: dateRange.startDate, lte: dateRange.endDate }
  } : {};

  const txDateFilter = dateRange.startDate && dateRange.endDate ? {
    transactionDate: { gte: dateRange.startDate, lte: dateRange.endDate }
  } : {};

  const [
    invoiceAgg,
    receiptAgg,
    expenseAgg,
    cashFunds,
  ] = await Promise.all([
    prisma.feeInvoice.aggregate({
      where: invoiceDateFilter,
      _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
    }),
    prisma.paymentReceipt.aggregate({
      where: { ...receiptDateFilter, paymentStatus: "SUCCESSFUL" },
      _sum: { amount: true },
    }),
    prisma.cashTransaction.aggregate({
      where: { ...txDateFilter, type: "EXPENSE" },
      _sum: { amount: true },
    }),
    prisma.cashFund.findMany({
      select: { code: true, nameBn: true, currentBalance: true },
    }),
  ]);

  const totalBilled = invoiceAgg._sum.totalAmount || 0;
  const totalCollections = receiptAgg._sum.amount || (invoiceAgg._sum.paidAmount || 0);
  const totalOutstanding = invoiceAgg._sum.dueAmount || 0;
  const totalExpenses = expenseAgg._sum.amount || 0;
  const netOperatingBalance = totalCollections - totalExpenses;
  const totalFundsBalance = cashFunds.reduce((sum, f) => sum + f.currentBalance, 0);

  // 6. Operations Summary
  const [
    totalBooks,
    totalCopies,
    activeLoans,
    overdueLoans,
    transportRoutes,
    transportStudents,
    inventoryItems,
    lowStockItems,
    activeEmployees,
    employeesOnLeave,
    openTickets,
    urgentTickets,
  ] = await Promise.all([
    prisma.libraryBook.count(),
    prisma.libraryBookCopy.count(),
    prisma.libraryIssue.count({ where: { status: "ISSUED" } }),
    prisma.libraryIssue.count({ where: { status: "OVERDUE" } }),
    prisma.transportRoute.count({ where: { status: "ACTIVE" } }),
    prisma.transportEnrollment.count({ where: { status: "ACTIVE" } }),
    prisma.inventoryItem.count({ where: { isActive: true } }),
    prisma.inventoryStockBalance.count({
      where: {
        currentBalance: { lte: 5 },
      },
    }),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.employeeLeaveRequest.count({ where: { status: "APPROVED" } }),
    prisma.supportRequest.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "WAITING_FOR_INFORMATION"] } },
    }),
    prisma.supportRequest.count({
      where: {
        priority: "URGENT",
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "WAITING_FOR_INFORMATION"] },
      },
    }),
  ]);

  // 7. Actionable Alerts
  const alerts: Array<{
    id: string;
    title: string;
    description: string;
    severity: "INFO" | "WARNING" | "URGENT";
    module: string;
    actionUrl: string;
  }> = [];

  if (urgentTickets > 0) {
    alerts.push({
      id: "alert-urgent-tickets",
      title: "জরুরি হেল্পডেস্ক টিকিট",
      description: `${urgentTickets}টি জরুরি আবেদন বা অভিযোগ পর্যালোচনার অপেক্ষায় রয়েছে।`,
      severity: "URGENT",
      module: "HELPDESK",
      actionUrl: "/admin/helpdesk?priority=URGENT",
    });
  }

  if (lowStockItems > 0) {
    alerts.push({
      id: "alert-low-stock",
      title: "স্বল্প ইনভেন্টরি স্টক সতর্কতা",
      description: `${lowStockItems}টি আইটেমের মজুদ নির্দিষ্ট সতর্কীকরণ সীমার নিচে রয়েছে।`,
      severity: "WARNING",
      module: "INVENTORY",
      actionUrl: "/admin/inventory?tab=STOCK",
    });
  }

  if (overdueLoans > 0) {
    alerts.push({
      id: "alert-overdue-books",
      title: "লাইব্রেরি বই বিলম্ব সতর্কতা",
      description: `${overdueLoans}টি বইয়ের নির্ধারিত ফেরত দেওয়ার মেয়াদ উত্তীর্ণ হয়েছে।`,
      severity: "WARNING",
      module: "LIBRARY",
      actionUrl: "/admin/library?tab=CIRCULATION",
    });
  }

  if (pendingApplications > 0) {
    alerts.push({
      id: "alert-pending-admissions",
      title: "অপেক্ষমান নতুন ভর্তি আবেদন",
      description: `${pendingApplications}টি নতুন ভর্তি আবেদন পর্যালোচনার অপেক্ষায় রয়েছে।`,
      severity: "INFO",
      module: "ADMISSIONS",
      actionUrl: "/admin/admissions?status=SUBMITTED",
    });
  }

  if (totalOutstanding > 50000) {
    alerts.push({
      id: "alert-outstanding-dues",
      title: "বকেয়া ফি সতর্কতা",
      description: `মোট বকেয়া ফি ৳${totalOutstanding.toLocaleString("bn-BD")}; দ্রুত তাগাদা প্রেরণ প্রয়োজন।`,
      severity: "WARNING",
      module: "FINANCE",
      actionUrl: "/admin/finance?tab=INVOICES&status=UNPAID",
    });
  }

  // 8. Factual Executive Summary Text
  const executiveSummaryBn = `ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় বর্তমানে সক্রিয় শিক্ষার্থীর সংখ্যা ${activeStudents.toLocaleString("bn-BD")} জন (আবাসিক: ${residentialStudents.toLocaleString("bn-BD")}, ডে-কেয়ার: ${dayCareStudents.toLocaleString("bn-BD")})। আজকের উপস্থিতির হার ${attendanceRateToday}%। চলতি অর্থবছরে মোট আদায়কৃত ফি ও অনুদান ৳${totalCollections.toLocaleString("bn-BD")} এবং মোট ব্যয় ৳${totalExpenses.toLocaleString("bn-BD")}। মাদরাসার ৫টি তহবিলে সর্বমোট রক্ষিত ব্যালেন্স ৳${totalFundsBalance.toLocaleString("bn-BD")}। প্রাতিষ্ঠানিক কার্যক্রমে লাইব্রেরিতে ${activeLoans}টি বই চালু ঋণ রয়েছে, ইনভেন্টরিতে ${lowStockItems}টি স্বল্প স্টক আইটেম এবং হেল্পডেস্কে ${urgentTickets}টি জরুরি আবেদন রয়েছে।`;

  const executiveSummaryEn = `Eliotganj Hazi Rohmatollah Jamiria Madrasha currently has ${activeStudents} active students (${residentialStudents} residential, ${dayCareStudents} day-care). Today's overall attendance rate stands at ${attendanceRateToday}%. In the recorded period, collections totaled ৳${totalCollections.toLocaleString()} against operating expenses of ৳${totalExpenses.toLocaleString()}. Total balance across all 5 dedicated funds is ৳${totalFundsBalance.toLocaleString()}. Institutional operations track ${activeLoans} active library loans, ${lowStockItems} low-stock alerts, and ${urgentTickets} urgent helpdesk requests.`;

  return {
    period: dateRange.label,
    generatedAt: new Date().toISOString(),
    students: {
      total: totalStudents,
      active: activeStudents,
      residential: residentialStudents,
      dayCare: dayCareStudents,
      nonResidential: nonResidentialStudents,
      orphans: orphanStudents,
      assistance: assistanceStudents,
    },
    admissions: {
      total: totalApplications,
      pending: pendingApplications,
      approved: approvedApplications,
      rejected: rejectedApplications,
      conversionRate: admissionConversionRate,
    },
    attendance: {
      rateToday: attendanceRateToday,
      totalMarkedToday,
      presentToday,
      absentToday,
      lateToday,
      leaveToday,
    },
    academics: {
      totalExams,
      publishedExams,
      totalResults,
      passRate: overallPassRate,
      passedCount: passedResults,
      mumtazCount: mumtazResults,
    },
    finance: {
      totalBilled,
      totalCollections,
      totalOutstanding,
      totalExpenses,
      netBalance: netOperatingBalance,
      fundsTotal: totalFundsBalance,
      funds: cashFunds,
    },
    operations: {
      library: { totalBooks, totalCopies, activeLoans, overdueLoans },
      residential: { residentialStudents, dayCareStudents, nonResidentialStudents },
      transport: { routes: transportRoutes, students: transportStudents },
      inventory: { totalItems: inventoryItems, lowStockItems },
      hr: { activeEmployees, employeesOnLeave },
      helpdesk: { openTickets, urgentTickets },
    },
    alerts,
    executiveSummary: {
      bn: executiveSummaryBn,
      en: executiveSummaryEn,
    },
  };
}

// -------------------------------------------------------------
// 2. STUDENT ANALYTICS
// -------------------------------------------------------------
export async function getStudentsAnalytics(sessionId?: string) {
  const sessionFilter = sessionId ? { enrollments: { some: { sessionId } } } : {};

  const [
    totalStudents,
    activeStudents,
    withdrawnStudents,
    completedStudents,
    transferredStudents,
    maleStudents,
    femaleStudents,
    residentialStudents,
    dayCareStudents,
    nonResidentialStudents,
    orphanStudents,
    financiallyWeakStudents,
    classes,
  ] = await Promise.all([
    prisma.student.count({ where: sessionFilter }),
    prisma.student.count({ where: { status: "ACTIVE", ...sessionFilter } }),
    prisma.student.count({ where: { status: "WITHDRAWN", ...sessionFilter } }),
    prisma.student.count({ where: { status: "COMPLETED", ...sessionFilter } }),
    prisma.student.count({ where: { status: "TRANSFERRED", ...sessionFilter } }),
    prisma.student.count({ where: { gender: "MALE", ...sessionFilter } }),
    prisma.student.count({ where: { gender: "FEMALE", ...sessionFilter } }),
    prisma.student.count({ where: { residentialStatus: "RESIDENTIAL", ...sessionFilter } }),
    prisma.student.count({ where: { residentialStatus: "DAY_CARE", ...sessionFilter } }),
    prisma.student.count({ where: { residentialStatus: "NON_RESIDENTIAL", ...sessionFilter } }),
    prisma.student.count({ where: { isOrphan: true, ...sessionFilter } }),
    prisma.student.count({ where: { isFinanciallyWeak: true, ...sessionFilter } }),
    prisma.jamatClass.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nameBn: true,
        nameEn: true,
        code: true,
        _count: {
          select: {
            enrollments: sessionId ? { where: { sessionId, status: "ACTIVE" } } : { where: { status: "ACTIVE" } },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const classDistribution = classes.map((c) => ({
    classId: c.id,
    nameBn: c.nameBn,
    nameEn: c.nameEn,
    code: c.code,
    studentCount: c._count.enrollments,
    percentage: activeStudents > 0 ? Math.round((c._count.enrollments / activeStudents) * 100) : 0,
  }));

  return {
    totalStudents,
    activeStudents,
    statusBreakdown: {
      active: activeStudents,
      withdrawn: withdrawnStudents,
      completed: completedStudents,
      transferred: transferredStudents,
    },
    genderDistribution: {
      male: maleStudents,
      female: femaleStudents,
      malePercentage: totalStudents > 0 ? Math.round((maleStudents / totalStudents) * 100) : 0,
      femalePercentage: totalStudents > 0 ? Math.round((femaleStudents / totalStudents) * 100) : 0,
    },
    residentialDistribution: {
      residential: residentialStudents,
      dayCare: dayCareStudents,
      nonResidential: nonResidentialStudents,
    },
    specialCategories: {
      orphans: orphanStudents,
      financiallyWeak: financiallyWeakStudents,
    },
    classDistribution,
  };
}

// -------------------------------------------------------------
// 3. ADMISSION ANALYTICS
// -------------------------------------------------------------
export async function getAdmissionAnalytics(sessionId?: string) {
  const whereFilter = sessionId ? { sessionId } : {};

  const [
    totalApplications,
    submittedApplications,
    underReviewApplications,
    verificationApplications,
    interviewApplications,
    approvedApplications,
    rejectedApplications,
    onlineSource,
    officeSource,
    residentialApps,
    nonResidentialApps,
    dayCareApps,
    classes,
  ] = await Promise.all([
    prisma.application.count({ where: whereFilter }),
    prisma.application.count({ where: { ...whereFilter, status: "SUBMITTED" } }),
    prisma.application.count({ where: { ...whereFilter, status: "UNDER_REVIEW" } }),
    prisma.application.count({ where: { ...whereFilter, status: "VERIFICATION" } }),
    prisma.application.count({ where: { ...whereFilter, status: "EXAM_INTERVIEW" } }),
    prisma.application.count({ where: { ...whereFilter, status: "APPROVED" } }),
    prisma.application.count({ where: { ...whereFilter, status: "REJECTED" } }),
    prisma.application.count({ where: { ...whereFilter, source: "ONLINE" } }),
    prisma.application.count({ where: { ...whereFilter, source: "OFFICE" } }),
    prisma.application.count({ where: { ...whereFilter, desiredResidentialStatus: "RESIDENTIAL" } }),
    prisma.application.count({ where: { ...whereFilter, desiredResidentialStatus: "NON_RESIDENTIAL" } }),
    prisma.application.count({ where: { ...whereFilter, desiredResidentialStatus: "DAY_CARE" } }),
    prisma.jamatClass.findMany({
      where: { isActive: true },
      select: { id: true, nameBn: true, nameEn: true, code: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const classApplications = await Promise.all(
    classes.map(async (c) => {
      const count = await prisma.application.count({
        where: { ...whereFilter, desiredClassId: c.id },
      });
      return {
        classId: c.id,
        nameBn: c.nameBn,
        nameEn: c.nameEn,
        code: c.code,
        count,
      };
    })
  );

  const conversionRate = totalApplications > 0
    ? Math.round((approvedApplications / totalApplications) * 100)
    : 0;

  return {
    totalApplications,
    conversionRate,
    statusBreakdown: {
      submitted: submittedApplications,
      underReview: underReviewApplications,
      verification: verificationApplications,
      examInterview: interviewApplications,
      approved: approvedApplications,
      rejected: rejectedApplications,
    },
    sourceDistribution: {
      online: onlineSource,
      office: officeSource,
      onlinePercentage: totalApplications > 0 ? Math.round((onlineSource / totalApplications) * 100) : 0,
      officePercentage: totalApplications > 0 ? Math.round((officeSource / totalApplications) * 100) : 0,
    },
    residentialPreference: {
      residential: residentialApps,
      nonResidential: nonResidentialApps,
      dayCare: dayCareApps,
    },
    classDistribution: classApplications,
  };
}

// -------------------------------------------------------------
// 4. ATTENDANCE ANALYTICS
// -------------------------------------------------------------
export async function getAttendanceAnalytics(params?: {
  sessionId?: string;
  classId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const where: any = {};
  if (params?.sessionId) where.sessionId = params.sessionId;
  if (params?.classId) where.classId = params.classId;

  if (params?.startDate || params?.endDate) {
    where.date = {};
    if (params.startDate) where.date.gte = new Date(params.startDate);
    if (params.endDate) where.date.lte = new Date(params.endDate);
  }

  const [present, absent, late, leave] = await Promise.all([
    prisma.attendance.count({ where: { ...where, status: "PRESENT" } }),
    prisma.attendance.count({ where: { ...where, status: "ABSENT" } }),
    prisma.attendance.count({ where: { ...where, status: "LATE" } }),
    prisma.attendance.count({ where: { ...where, status: "LEAVE" } }),
  ]);

  const total = present + absent + late + leave;
  const overallRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  const classes = await prisma.jamatClass.findMany({
    where: { isActive: true },
    select: { id: true, nameBn: true, nameEn: true, code: true },
    orderBy: { sortOrder: "asc" },
  });

  const classRates = await Promise.all(
    classes.map(async (c) => {
      const cWhere = { ...where, classId: c.id };
      const [cPresent, cAbsent, cLate, cLeave] = await Promise.all([
        prisma.attendance.count({ where: { ...cWhere, status: "PRESENT" } }),
        prisma.attendance.count({ where: { ...cWhere, status: "ABSENT" } }),
        prisma.attendance.count({ where: { ...cWhere, status: "LATE" } }),
        prisma.attendance.count({ where: { ...cWhere, status: "LEAVE" } }),
      ]);
      const cTotal = cPresent + cAbsent + cLate + cLeave;
      const rate = cTotal > 0 ? Math.round(((cPresent + cLate) / cTotal) * 100) : 0;
      return {
        classId: c.id,
        nameBn: c.nameBn,
        nameEn: c.nameEn,
        code: c.code,
        total: cTotal,
        present: cPresent,
        absent: cAbsent,
        late: cLate,
        leave: cLeave,
        attendanceRate: rate,
      };
    })
  );

  return {
    totalRecords: total,
    overallRate,
    summary: { present, absent, late, leave },
    classComparison: classRates,
  };
}

// -------------------------------------------------------------
// 5. ACADEMIC & QAWMI RESULT ANALYTICS
// -------------------------------------------------------------
export async function getAcademicAnalytics(examId?: string, sessionId?: string) {
  const where: any = {};
  if (examId) where.examId = examId;
  if (sessionId) where.exam = { sessionId };

  const [
    totalResults,
    passedResults,
    failedResults,
    mumtazResults,
    jayyidJiddanResults,
    jayyidResults,
    maqbulResults,
    rasibResults,
    exams,
  ] = await Promise.all([
    prisma.result.count({ where }),
    prisma.result.count({ where: { ...where, isPassed: true } }),
    prisma.result.count({ where: { ...where, isPassed: false } }),
    prisma.result.count({ where: { ...where, finalGradeBn: { contains: "মুমতাজ" } } }),
    prisma.result.count({ where: { ...where, finalGradeBn: { contains: "জায়্যিদ জিদ্দান" } } }),
    prisma.result.count({ where: { ...where, finalGradeBn: { equals: "জায়্যিদ" } } }),
    prisma.result.count({ where: { ...where, finalGradeBn: { contains: "মাকবুল" } } }),
    prisma.result.count({ where: { ...where, finalGradeBn: { contains: "রাসিব" } } }),
    prisma.exam.findMany({
      where: sessionId ? { sessionId } : {},
      select: {
        id: true,
        nameBn: true,
        nameEn: true,
        isPublished: true,
        status: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: "desc" },
      take: 10,
    }),
  ]);

  const passRate = totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0;

  return {
    totalExaminees: totalResults,
    passedCount: passedResults,
    failedCount: failedResults,
    passRate,
    gradeDistribution: [
      { gradeBn: "মুমতাজ (Mumtaz)", gradeCode: "MUMTAZ", range: ">= ৮০%", count: mumtazResults },
      { gradeBn: "জায়্যিদ জিদ্দান (Jayyid Jiddan)", gradeCode: "JAYYID_JIDDAN", range: "৭০% - ৭৯%", count: jayyidJiddanResults },
      { gradeBn: "জায়্যিদ (Jayyid)", gradeCode: "JAYYID", range: "৬০% - ৬৯%", count: jayyidResults },
      { gradeBn: "মাকবুল (Maqbul)", gradeCode: "MAQBUL", range: "৫০% - ৫৯%", count: maqbulResults },
      { gradeBn: "রাসিব (Rasib)", gradeCode: "RASIB", range: "< ৫০%", count: rasibResults },
    ],
    recentExams: exams,
  };
}

// -------------------------------------------------------------
// 6. FINANCIAL & 5-FUND ANALYTICS
// -------------------------------------------------------------
export async function getFinanceAnalytics(filterType?: string, customStart?: string, customEnd?: string) {
  const dateRange = parseDateFilter(filterType, customStart, customEnd);
  const invoiceWhere: any = {};
  const receiptWhere: any = { paymentStatus: "SUCCESSFUL" };
  const txWhere: any = {};

  if (dateRange.startDate && dateRange.endDate) {
    invoiceWhere.createdAt = { gte: dateRange.startDate, lte: dateRange.endDate };
    receiptWhere.receiptDate = { gte: dateRange.startDate, lte: dateRange.endDate };
    txWhere.transactionDate = { gte: dateRange.startDate, lte: dateRange.endDate };
  }

  const [
    invoiceAgg,
    receiptAgg,
    expenseAgg,
    categories,
    funds,
  ] = await Promise.all([
    prisma.feeInvoice.aggregate({
      where: invoiceWhere,
      _sum: { totalAmount: true, paidAmount: true, dueAmount: true, discountAmount: true },
    }),
    prisma.paymentReceipt.aggregate({
      where: receiptWhere,
      _sum: { amount: true },
    }),
    prisma.cashTransaction.aggregate({
      where: { ...txWhere, type: "EXPENSE" },
      _sum: { amount: true },
    }),
    prisma.feeCategory.findMany({ select: { id: true, nameBn: true, code: true } }),
    prisma.cashFund.findMany({
      select: { id: true, nameBn: true, nameEn: true, code: true, currentBalance: true },
    }),
  ]);

  const billedAmount = invoiceAgg._sum.totalAmount || 0;
  const collectedAmount = receiptAgg._sum.amount || (invoiceAgg._sum.paidAmount || 0);
  const outstandingAmount = invoiceAgg._sum.dueAmount || 0;
  const expenseAmount = expenseAgg._sum.amount || 0;
  const netSurplus = collectedAmount - expenseAmount;

  const paymentMethods = ["CASH", "BKASH", "NAGAD", "ROCKET", "BANK"];
  const methodBreakdown = await Promise.all(
    paymentMethods.map(async (m) => {
      const agg = await prisma.paymentReceipt.aggregate({
        where: { ...receiptWhere, paymentMethod: m },
        _sum: { amount: true },
        _count: { id: true },
      });
      return {
        method: m,
        amount: agg._sum.amount || 0,
        count: agg._count.id,
      };
    })
  );

  const fundMovements = await Promise.all(
    funds.map(async (fund) => {
      const [incomeAgg, expAgg] = await Promise.all([
        prisma.cashTransaction.aggregate({
          where: { ...txWhere, fundId: fund.id, type: "INCOME" },
          _sum: { amount: true },
        }),
        prisma.cashTransaction.aggregate({
          where: { ...txWhere, fundId: fund.id, type: "EXPENSE" },
          _sum: { amount: true },
        }),
      ]);
      const inc = incomeAgg._sum.amount || 0;
      const exp = expAgg._sum.amount || 0;
      return {
        fundId: fund.id,
        code: fund.code,
        nameBn: fund.nameBn,
        currentBalance: fund.currentBalance,
        periodIncome: inc,
        periodExpense: exp,
        periodNet: inc - exp,
      };
    })
  );

  const incomeByType = await Promise.all(
    ["TUITION", "ADMISSION", "HOSTEL", "FOOD", "EXAM", "CERTIFICATE", "OTHER"].map(async (type) => {
      const agg = await prisma.feeInvoice.aggregate({
        where: { ...invoiceWhere, feeType: type },
        _sum: { paidAmount: true, totalAmount: true },
      });
      return {
        feeType: type,
        billed: agg._sum.totalAmount || 0,
        collected: agg._sum.paidAmount || 0,
      };
    })
  );

  return {
    period: dateRange.label,
    summary: {
      billedAmount,
      collectedAmount,
      outstandingAmount,
      expenseAmount,
      netSurplus,
      collectionRate: billedAmount > 0 ? Math.round((collectedAmount / billedAmount) * 100) : 0,
    },
    methodBreakdown,
    fundMovements,
    incomeByType,
  };
}

// -------------------------------------------------------------
// 7. OPERATIONS ANALYTICS (LIBRARY, HOSTEL, TRANSPORT, INVENTORY, HR, HELPDESK)
// -------------------------------------------------------------
export async function getOperationsAnalytics() {
  const [
    totalBooks,
    totalCopies,
    activeLoans,
    overdueLoans,
    returnedLoans,
    residentialStudents,
    dayCareStudents,
    nonResidentialStudents,
    routesCount,
    vehiclesCount,
    driversCount,
    transportEnrolled,
    inventoryItems,
    inventoryStockSum,
    lowStockBalances,
    damagedAssets,
    pendingPRs,
    totalStaff,
    activeStaff,
    teachersCount,
    nonTeachingStaff,
    expiringDocs,
    totalTickets,
    openTickets,
    resolvedTickets,
    closedTickets,
    urgentTickets,
  ] = await Promise.all([
    prisma.libraryBook.count(),
    prisma.libraryBookCopy.count(),
    prisma.libraryIssue.count({ where: { status: "ISSUED" } }),
    prisma.libraryIssue.count({ where: { status: "OVERDUE" } }),
    prisma.libraryIssue.count({ where: { status: "RETURNED" } }),
    prisma.student.count({ where: { residentialStatus: "RESIDENTIAL", status: "ACTIVE" } }),
    prisma.student.count({ where: { residentialStatus: "DAY_CARE", status: "ACTIVE" } }),
    prisma.student.count({ where: { residentialStatus: "NON_RESIDENTIAL", status: "ACTIVE" } }),
    prisma.transportRoute.count({ where: { status: "ACTIVE" } }),
    prisma.transportVehicle.count({ where: { status: "ACTIVE" } }),
    prisma.transportDriver.count({ where: { status: "ACTIVE" } }),
    prisma.transportEnrollment.count({ where: { status: "ACTIVE" } }),
    prisma.inventoryItem.count({ where: { isActive: true } }),
    prisma.inventoryStockBalance.aggregate({ _sum: { currentBalance: true } }),
    prisma.inventoryStockBalance.count({ where: { currentBalance: { lte: 5 } } }),
    prisma.inventoryAsset.count({ where: { condition: { in: ["POOR", "DAMAGED"] } } }),
    prisma.purchaseRequest.count({ where: { status: "PENDING" } }),
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "TEACHER", status: "ACTIVE" } }),
    prisma.employee.count({ where: { status: "ACTIVE", userId: null } }),
    prisma.employeeDocument.count({
      where: {
        expiryDate: {
          lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
    }),
    prisma.supportRequest.count(),
    prisma.supportRequest.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "WAITING_FOR_INFORMATION"] } },
    }),
    prisma.supportRequest.count({ where: { status: "RESOLVED" } }),
    prisma.supportRequest.count({ where: { status: "CLOSED" } }),
    prisma.supportRequest.count({
      where: {
        priority: "URGENT",
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "WAITING_FOR_INFORMATION"] },
      },
    }),
  ]);

  return {
    library: {
      totalTitles: totalBooks,
      totalCopies,
      activeLoans,
      overdueLoans,
      returnedLoans,
    },
    hostel: {
      residential: residentialStudents,
      dayCare: dayCareStudents,
      nonResidential: nonResidentialStudents,
      totalStudents: residentialStudents + dayCareStudents + nonResidentialStudents,
    },
    transport: {
      activeRoutes: routesCount,
      activeVehicles: vehiclesCount,
      activeDrivers: driversCount,
      enrolledStudents: transportEnrolled,
    },
    inventory: {
      totalItems: inventoryItems,
      totalStockUnits: inventoryStockSum._sum.currentBalance || 0,
      lowStockAlerts: lowStockBalances,
      damagedAssets,
      pendingPurchaseRequests: pendingPRs,
    },
    hr: {
      totalEmployees: totalStaff,
      activeEmployees: activeStaff,
      teachers: teachersCount,
      supportStaff: nonTeachingStaff,
      expiringDocumentsCount: expiringDocs,
    },
    helpdesk: {
      totalRequests: totalTickets,
      openRequests: openTickets,
      resolvedRequests: resolvedTickets,
      closedRequests: closedTickets,
      urgentRequests: urgentTickets,
    },
  };
}

// -------------------------------------------------------------
// 8. SESSION COMPARISON
// -------------------------------------------------------------
export async function getSessionComparison(sessionAId: string, sessionBId: string) {
  const [sessionA, sessionB] = await Promise.all([
    prisma.academicSession.findUnique({ where: { id: sessionAId } }),
    prisma.academicSession.findUnique({ where: { id: sessionBId } }),
  ]);

  if (!sessionA || !sessionB) {
    throw new Error("তুলনার জন্য উভয় শিক্ষাবর্ষের আইডি বৈধ হতে হবে।");
  }

  const [
    studentsA,
    studentsB,
    admissionsA,
    admissionsB,
    invoicesA,
    invoicesB,
    residentialA,
    residentialB,
  ] = await Promise.all([
    prisma.enrollment.count({ where: { sessionId: sessionAId, status: "ACTIVE" } }),
    prisma.enrollment.count({ where: { sessionId: sessionBId, status: "ACTIVE" } }),
    prisma.application.count({ where: { sessionId: sessionAId } }),
    prisma.application.count({ where: { sessionId: sessionBId } }),
    prisma.feeInvoice.aggregate({
      where: { sessionId: sessionAId },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    prisma.feeInvoice.aggregate({
      where: { sessionId: sessionBId },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    prisma.enrollment.count({
      where: { sessionId: sessionAId, student: { residentialStatus: "RESIDENTIAL" } },
    }),
    prisma.enrollment.count({
      where: { sessionId: sessionBId, student: { residentialStatus: "RESIDENTIAL" } },
    }),
  ]);

  const billedA = invoicesA._sum.totalAmount || 0;
  const billedB = invoicesB._sum.totalAmount || 0;
  const collectedA = invoicesA._sum.paidAmount || 0;
  const collectedB = invoicesB._sum.paidAmount || 0;

  const calcDiff = (a: number, b: number) => {
    const diff = b - a;
    const pct = a > 0 ? Math.round((diff / a) * 100) : b > 0 ? 100 : 0;
    return { valA: a, valB: b, diff, percentage: pct };
  };

  return {
    sessionA: { id: sessionA.id, name: sessionA.name },
    sessionB: { id: sessionB.id, name: sessionB.name },
    metrics: {
      students: calcDiff(studentsA, studentsB),
      admissions: calcDiff(admissionsA, admissionsB),
      residential: calcDiff(residentialA, residentialB),
      billedFees: calcDiff(billedA, billedB),
      collections: calcDiff(collectedA, collectedB),
    },
  };
}

// -------------------------------------------------------------
// 9. TEACHER SCOPED ANALYTICS
// -------------------------------------------------------------
export async function getTeacherScopedAnalytics(teacherUserId: string) {
  const currentSession = await prisma.academicSession.findFirst({
    where: { isCurrent: true },
  });

  let assignments = await prisma.teacherAssignment.findMany({
    where: {
      teacherId: teacherUserId,
      ...(currentSession ? { sessionId: currentSession.id } : {}),
    },
    include: {
      section: {
        include: {
          jamatClass: true,
        },
      },
      subject: true,
    },
  });

  if (assignments.length === 0) {
    assignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: teacherUserId,
      },
      include: {
        section: {
          include: {
            jamatClass: true,
          },
        },
        subject: true,
      },
    });
  }

  const sectionIds = assignments.map((a) => a.sectionId).filter(Boolean) as string[];

  const studentsCount = await prisma.enrollment.count({
    where: {
      sectionId: { in: sectionIds },
      status: "ACTIVE",
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [presentToday, absentToday] = await Promise.all([
    prisma.attendance.count({
      where: {
        sectionId: { in: sectionIds },
        date: { gte: today },
        status: "PRESENT",
      },
    }),
    prisma.attendance.count({
      where: {
        sectionId: { in: sectionIds },
        date: { gte: today },
        status: "ABSENT",
      },
    }),
  ]);

  const totalToday = presentToday + absentToday;
  const attendanceRate = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;

  return {
    teacherId: teacherUserId,
    totalAssignments: assignments.length,
    assignedStudentsCount: studentsCount,
    todayAttendance: {
      present: presentToday,
      absent: absentToday,
      rate: attendanceRate,
    },
    assignments: assignments.map((a) => ({
      assignmentId: a.id,
      className: a.section?.jamatClass?.nameBn || "নির্দিষ্ট নয়",
      sectionName: a.section?.nameBn || "সকল",
      subjectName: a.subject?.nameBn || "সকল বিষয়",
    })),
  };
}

// -------------------------------------------------------------
// 10. GUARDIAN CHILD SCOPED ANALYTICS
// -------------------------------------------------------------
export async function getGuardianChildAnalytics(guardianUserId: string, studentId: string) {
  const link = await prisma.guardianStudent.findFirst({
    where: {
      studentId,
      guardian: {
        userId: guardianUserId,
      },
    },
    include: {
      student: true,
    },
  });

  if (!link) {
    throw new Error("অননুমোদিত অ্যাক্সেস: এই শিক্ষার্থীর তথ্যের অধিকার আপনার নেই।");
  }

  const student = link.student;

  const [present, absent, late, leave] = await Promise.all([
    prisma.attendance.count({ where: { studentId, status: "PRESENT" } }),
    prisma.attendance.count({ where: { studentId, status: "ABSENT" } }),
    prisma.attendance.count({ where: { studentId, status: "LATE" } }),
    prisma.attendance.count({ where: { studentId, status: "LEAVE" } }),
  ]);
  const totalAtt = present + absent + late + leave;
  const attRate = totalAtt > 0 ? Math.round(((present + late) / totalAtt) * 100) : 0;

  const results = await prisma.result.findMany({
    where: { studentId, status: "PUBLISHED" },
    include: {
      exam: { select: { nameBn: true, startDate: true } },
    },
    orderBy: { exam: { startDate: "desc" } },
    take: 5,
  });

  const invoiceAgg = await prisma.feeInvoice.aggregate({
    where: { studentId },
    _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
  });

  const [activeLoans, residentialEnrollment, transportEnrollment, openTickets] = await Promise.all([
    prisma.libraryIssue.count({
      where: { member: { studentId }, status: "ISSUED" },
    }),
    prisma.residentialEnrollment.findFirst({
      where: { studentId, status: "ACTIVE" },
    }),
    prisma.transportEnrollment.findFirst({
      where: { studentId, status: "ACTIVE" },
      include: { route: true },
    }),
    prisma.supportRequest.count({
      where: {
        studentId,
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "WAITING_FOR_INFORMATION"] },
      },
    }),
  ]);

  return {
    student: {
      id: student.id,
      studentIdNumber: student.studentIdNumber,
      fullNameBn: student.fullNameBn,
      residentialStatus: student.residentialStatus,
    },
    attendance: {
      total: totalAtt,
      present,
      absent,
      late,
      leave,
      attendanceRate: attRate,
    },
    finance: {
      totalBilled: invoiceAgg._sum.totalAmount || 0,
      totalPaid: invoiceAgg._sum.paidAmount || 0,
      totalDue: invoiceAgg._sum.dueAmount || 0,
    },
    results: results.map((r) => ({
      examName: r.exam.nameBn,
      totalMarks: r.totalMarks,
      percentage: r.percentage,
      gradeBn: r.finalGradeBn,
      isPassed: r.isPassed,
    })),
    operations: {
      activeLibraryLoans: activeLoans,
      residentialRoom: residentialEnrollment?.roomOrWardLabel || null,
      transportRoute: transportEnrollment?.route?.routeName || null,
      openTickets,
    },
  };
}

// -------------------------------------------------------------
// 11. REPORT BUILDER & SAVED REPORTS
// -------------------------------------------------------------
export async function executeReportBuilder(config: {
  module: string;
  startDate?: string;
  endDate?: string;
  sessionId?: string;
  classId?: string;
  limit?: number;
}) {
  const limit = config.limit || 50;
  const whereDate: any = {};
  if (config.startDate || config.endDate) {
    if (config.startDate) whereDate.gte = new Date(config.startDate);
    if (config.endDate) whereDate.lte = new Date(config.endDate);
  }

  switch (config.module?.toUpperCase()) {
    case "STUDENTS": {
      const where: any = {};
      if (config.classId) where.enrollments = { some: { classId: config.classId } };
      if (config.sessionId) where.enrollments = { some: { sessionId: config.sessionId } };

      const items = await prisma.student.findMany({
        where,
        select: {
          id: true,
          studentIdNumber: true,
          fullNameBn: true,
          fullNameEn: true,
          residentialStatus: true,
          gender: true,
          status: true,
          createdAt: true,
        },
        take: limit,
        orderBy: { studentIdNumber: "asc" },
      });
      return { module: "STUDENTS", count: items.length, data: items };
    }

    case "FINANCE": {
      const where: any = {};
      if (Object.keys(whereDate).length > 0) where.createdAt = whereDate;
      if (config.sessionId) where.sessionId = config.sessionId;

      const items = await prisma.feeInvoice.findMany({
        where,
        select: {
          id: true,
          invoiceNumber: true,
          title: true,
          feeType: true,
          totalAmount: true,
          paidAmount: true,
          dueAmount: true,
          status: true,
          dueDate: true,
          student: { select: { fullNameBn: true, studentIdNumber: true } },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      return { module: "FINANCE", count: items.length, data: items };
    }

    case "ATTENDANCE": {
      const where: any = {};
      if (Object.keys(whereDate).length > 0) where.date = whereDate;
      if (config.classId) where.classId = config.classId;

      const items = await prisma.attendance.findMany({
        where,
        select: {
          id: true,
          date: true,
          status: true,
          student: { select: { fullNameBn: true, studentIdNumber: true } },
          jamatClass: { select: { nameBn: true } },
        },
        take: limit,
        orderBy: { date: "desc" },
      });
      return { module: "ATTENDANCE", count: items.length, data: items };
    }

    case "HELPDESK": {
      const where: any = {};
      if (Object.keys(whereDate).length > 0) where.createdAt = whereDate;

      const items = await prisma.supportRequest.findMany({
        where,
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          requestType: true,
          priority: true,
          status: true,
          createdAt: true,
          category: { select: { nameBn: true } },
          student: { select: { fullNameBn: true } },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      return { module: "HELPDESK", count: items.length, data: items };
    }

    default:
      return { module: config.module, count: 0, data: [] };
  }
}

export async function getSavedReports(userId: string) {
  return prisma.savedReport.findMany({
    where: {
      OR: [{ createdById: userId }, { isPublic: true }],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createSavedReport(data: {
  title: string;
  description?: string;
  module: string;
  reportType: string;
  filtersJson: string;
  isPublic?: boolean;
  createdById: string;
}) {
  return prisma.savedReport.create({
    data: {
      title: data.title,
      description: data.description,
      module: data.module,
      reportType: data.reportType,
      filtersJson: data.filtersJson,
      isPublic: data.isPublic || false,
      createdById: data.createdById,
    },
  });
}

export async function deleteSavedReport(id: string, userId: string) {
  const existing = await prisma.savedReport.findUnique({ where: { id } });
  if (!existing || existing.createdById !== userId) {
    throw new Error("অননুমোদিত অ্যাক্সেস বা রিপোর্ট পাওয়া যায়নি।");
  }
  return prisma.savedReport.delete({ where: { id } });
}
