import { prisma } from "./prisma";
import { recordAuditLog } from "./security";
import { dispatchNotification } from "./communicationEngine";
import QRCode from "qrcode";
import { INSTITUTION_INFO } from "./constants";
import { getAppUrl } from "./env";

// =================================================================
// 1. DEFAULT SEEDING & MASTER DATA INITIALIZATION
// =================================================================

export const DEFAULT_HR_DEPARTMENTS = [
  { nameBn: "শিক্ষা ও হিফজ বিভাগ", nameEn: "Academic", description: "কুরআন, হিফজ, কিতাব ও সাধারণ শিক্ষা শাখা", sortOrder: 1 },
  { nameBn: "সাধারণ প্রশাসন ও দপ্তর", nameEn: "Administration", description: "মাদরাসা সার্বিক প্রশাসনিক কার্যক্রম ও রেকর্ড", sortOrder: 2 },
  { nameBn: "হিসাব ও অর্থ বিভাগ", nameEn: "Accounts", description: "আয়-ব্যয়, বেতন ও অডিট ব্যবস্থাপনা", sortOrder: 3 },
  { nameBn: "লিল্লাহ বোর্ডিং ও পাকঘর", nameEn: "Kitchen", description: "আবাসিক ও লিল্লাহ শিক্ষার্থীদের খাদ্য ও রন্ধন", sortOrder: 4 },
  { nameBn: "যানবাহন ও পরিবহন", nameEn: "Transport", description: "মাদরাসা ছাত্র ও শিক্ষক পরিবহন শাখা", sortOrder: 5 },
  { nameBn: "আবাসন ও ছাত্রাবাস", nameEn: "Hostel", description: "আবাসিক ছাত্র ও তদারকি ব্যবস্থাপনা", sortOrder: 6 },
  { nameBn: "পরিচ্ছন্নতা ও নিরাপত্তা", nameEn: "Security", description: "ক্যাম্পাস নিরাপত্তা ও পরিষ্কার-পরিচ্ছন্নতা", sortOrder: 7 },
  { nameBn: "রক্ষণাবেক্ষণ ও টেকনিক্যাল", nameEn: "Maintenance", description: "ভবন ও বৈদ্যুতিক যন্ত্রপাতি মেরামত", sortOrder: 8 },
  { nameBn: "কেন্দ্রীয় লাইব্রেরি", nameEn: "Library", description: "কিতাবখানা ও রেফারেন্স সংগ্রহশালা", sortOrder: 9 },
  { nameBn: "তথ্যপ্রযুক্তি ও যোগাযোগ", nameEn: "IT", description: "ডিজিটাল ক্যাম্পাস ও কম্পিউটার নেটওয়ার্ক", sortOrder: 10 },
  { nameBn: "অন্যান্য প্রাতিষ্ঠানিক সেবা", nameEn: "Other", description: "অন্যান্য সহায়ক দপ্তর", sortOrder: 11 },
];

export const DEFAULT_HR_DESIGNATIONS = [
  { nameBn: "মুহতামিম ও অধ্যক্ষ", nameEn: "Principal", sortOrder: 1 },
  { nameBn: "শায়খুল হাদীস ও প্রধান মুফাসসির", nameEn: "Chief Professor", sortOrder: 2 },
  { nameBn: "নায়েবে মুহতামিম (সহকারী অধ্যক্ষ)", nameEn: "Vice Principal", sortOrder: 3 },
  { nameBn: "উস্তাদ / শিক্ষক", nameEn: "Teacher", sortOrder: 4 },
  { nameBn: "সহকারী শিক্ষক", nameEn: "Assistant Teacher", sortOrder: 5 },
  { nameBn: "হিফজুল কুরআন শিক্ষক", nameEn: "Hifz Teacher", sortOrder: 6 },
  { nameBn: "নাযেরা ও কায়দা শিক্ষক", nameEn: "Nazera Teacher", sortOrder: 7 },
  { nameBn: "প্রধান হিসাবরক্ষক", nameEn: "Accountant", sortOrder: 8 },
  { nameBn: "অফিস সহকারী ও কম্পিউটার অপারেটর", nameEn: "Office Assistant", sortOrder: 9 },
  { nameBn: "প্রধান বাবুর্চি", nameEn: "Chief Cook", sortOrder: 10 },
  { nameBn: "সহকারী বাবুর্চি", nameEn: "Assistant Cook", sortOrder: 11 },
  { nameBn: "যানবাহন চালক / ড্রাইভার", nameEn: "Driver", sortOrder: 12 },
  { nameBn: "নিরাপত্তা প্রহরী", nameEn: "Security Guard", sortOrder: 13 },
  { nameBn: "পরিচ্ছন্নতাকর্মী", nameEn: "Cleaner", sortOrder: 14 },
  { nameBn: "সহায়ক স্টাফ", nameEn: "Support Staff", sortOrder: 15 },
];

export const DEFAULT_LEAVE_TYPES = [
  { code: "CASUAL", nameBn: "নৈমিত্তিক ছুটি (ক্যাজুয়াল)", nameEn: "Casual Leave", defaultDaysPerYear: 10, isPaid: true, requiresDocument: false },
  { code: "SICK", nameBn: "অসুস্থতাজনিত ছুটি (মেডিকেল)", nameEn: "Sick Leave", defaultDaysPerYear: 14, isPaid: true, requiresDocument: true },
  { code: "EMERGENCY", nameBn: "জরুরি পারিবারিক ছুটি", nameEn: "Emergency Leave", defaultDaysPerYear: 5, isPaid: true, requiresDocument: false },
  { code: "ANNUAL", nameBn: "বার্ষিক প্রাতিষ্ঠানিক ছুটি", nameEn: "Annual Leave", defaultDaysPerYear: 15, isPaid: true, requiresDocument: false },
  { code: "OFFICIAL", nameBn: "অফিসিয়াল বা প্রাতিষ্ঠানিক ডিউটি", nameEn: "Official Duty", defaultDaysPerYear: 10, isPaid: true, requiresDocument: false },
  { code: "MATERNITY", nameBn: "মাতৃত্বকালীন ছুটি", nameEn: "Maternity Leave", defaultDaysPerYear: 90, isPaid: true, requiresDocument: true },
  { code: "UNPAID", nameBn: "বিনা বেতনে ছুটি", nameEn: "Unpaid Leave", defaultDaysPerYear: 30, isPaid: false, requiresDocument: false },
  { code: "OTHER", nameBn: "অন্যান্য বিশেষ ছুটি", nameEn: "Other Leave", defaultDaysPerYear: 5, isPaid: true, requiresDocument: false },
];

export async function ensureDefaultHrMasterData(): Promise<void> {
  // 1. Departments
  for (const dept of DEFAULT_HR_DEPARTMENTS) {
    await prisma.employeeDepartment.upsert({
      where: { nameEn: dept.nameEn },
      update: {},
      create: {
        nameBn: dept.nameBn,
        nameEn: dept.nameEn,
        description: dept.description,
        sortOrder: dept.sortOrder,
        isActive: true,
      },
    });
  }

  // 2. Designations
  for (const desig of DEFAULT_HR_DESIGNATIONS) {
    await prisma.employeeDesignation.upsert({
      where: { nameEn: desig.nameEn },
      update: {},
      create: {
        nameBn: desig.nameBn,
        nameEn: desig.nameEn,
        sortOrder: desig.sortOrder,
        isActive: true,
      },
    });
  }

  // 3. Leave Types
  for (const lt of DEFAULT_LEAVE_TYPES) {
    await prisma.employeeLeaveType.upsert({
      where: { code: lt.code },
      update: {},
      create: {
        code: lt.code,
        nameBn: lt.nameBn,
        nameEn: lt.nameEn,
        defaultDaysPerYear: lt.defaultDaysPerYear,
        isPaid: lt.isPaid,
        requiresDocument: lt.requiresDocument,
        isActive: true,
      },
    });
  }
}

// =================================================================
// 2. CONCURRENCY-SAFE SEQUENCE GENERATORS
// =================================================================

export type HrSequencePrefix = "EMP" | "LRQ" | "DOC";

export async function generateNextHrSequence(
  prefix: HrSequencePrefix,
  year?: number,
  client?: any
): Promise<string> {
  const currentYear = year || new Date().getFullYear();
  const db = client || prisma;

  const existing = await db.hrSequence.findUnique({
    where: {
      prefix_year: {
        prefix,
        year: currentYear,
      },
    },
  });

  let lastSeq = 1;
  if (!existing) {
    try {
      const created = await db.hrSequence.create({
        data: {
          prefix,
          year: currentYear,
          lastSeq: 1,
        },
      });
      lastSeq = created.lastSeq;
    } catch {
      const fallback = await db.hrSequence.update({
        where: {
          prefix_year: {
            prefix,
            year: currentYear,
          },
        },
        data: {
          lastSeq: { increment: 1 },
        },
      });
      lastSeq = fallback.lastSeq;
    }
  } else {
    const updated = await db.hrSequence.update({
      where: {
        prefix_year: {
          prefix,
          year: currentYear,
        },
      },
      data: {
        lastSeq: { increment: 1 },
      },
    });
    lastSeq = updated.lastSeq;
  }

  return `EHRJ-${prefix}-${currentYear}-${String(lastSeq).padStart(4, "0")}`;
}

export async function generateNextEmployeeId(year?: number, client?: any): Promise<string> {
  return generateNextHrSequence("EMP", year, client);
}

export async function generateNextLeaveRequestCode(year?: number, client?: any): Promise<string> {
  return generateNextHrSequence("LRQ", year, client);
}

// =================================================================
// 3. DEPARTMENT & DESIGNATION MANAGEMENT
// =================================================================

export async function getDepartments(params?: { isActive?: boolean }) {
  await ensureDefaultHrMasterData();
  const where: any = {};
  if (params?.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  return prisma.employeeDepartment.findMany({
    where,
    include: {
      _count: {
        select: { employees: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { nameBn: "asc" }],
  });
}

export async function createDepartment(params: {
  nameBn: string;
  nameEn: string;
  description?: string;
  sortOrder?: number;
  recordedByUserId?: string;
}) {
  const existing = await prisma.employeeDepartment.findUnique({
    where: { nameEn: params.nameEn.trim() },
  });
  if (existing) {
    throw new Error(`বিভাগ ইংরেজি নাম '${params.nameEn}' ইতিমধ্যে ব্যবহৃত হয়েছে।`);
  }

  const dept = await prisma.employeeDepartment.create({
    data: {
      nameBn: params.nameBn.trim(),
      nameEn: params.nameEn.trim(),
      description: params.description?.trim() || null,
      sortOrder: params.sortOrder ?? 0,
      isActive: true,
    },
  });

  if (params.recordedByUserId) {
    await recordAuditLog({
      userId: params.recordedByUserId,
      action: "CREATE_HR_DEPARTMENT",
      entityType: "EmployeeDepartment",
      entityId: dept.id,
      details: { nameBn: dept.nameBn, nameEn: dept.nameEn },
    });
  }

  return dept;
}

export async function updateDepartment(
  id: string,
  params: {
    nameBn?: string;
    nameEn?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
    recordedByUserId?: string;
  }
) {
  const dept = await prisma.employeeDepartment.findUnique({ where: { id } });
  if (!dept) throw new Error("বিভাগটি পাওয়া যায়নি।");

  if (params.nameEn && params.nameEn.trim().toLowerCase() !== dept.nameEn.toLowerCase()) {
    const existing = await prisma.employeeDepartment.findUnique({
      where: { nameEn: params.nameEn.trim() },
    });
    if (existing && existing.id !== id) {
      throw new Error(`বিভাগ ইংরেজি নাম '${params.nameEn}' ইতিমধ্যে ব্যবহৃত হয়েছে।`);
    }
  }

  const updated = await prisma.employeeDepartment.update({
    where: { id },
    data: {
      nameBn: params.nameBn?.trim(),
      nameEn: params.nameEn?.trim(),
      description: params.description !== undefined ? params.description?.trim() || null : undefined,
      sortOrder: params.sortOrder,
      isActive: params.isActive,
    },
  });

  if (params.recordedByUserId) {
    await recordAuditLog({
      userId: params.recordedByUserId,
      action: "UPDATE_HR_DEPARTMENT",
      entityType: "EmployeeDepartment",
      entityId: id,
      details: { before: dept, after: updated },
    });
  }

  return updated;
}

export async function getDesignations(params?: { isActive?: boolean; departmentId?: string }) {
  await ensureDefaultHrMasterData();
  const where: any = {};
  if (params?.isActive !== undefined) {
    where.isActive = params.isActive;
  }
  if (params?.departmentId) {
    where.departmentId = params.departmentId;
  }

  return prisma.employeeDesignation.findMany({
    where,
    include: {
      _count: {
        select: { employees: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { nameBn: "asc" }],
  });
}

export async function createDesignation(params: {
  nameBn: string;
  nameEn: string;
  departmentId?: string;
  description?: string;
  sortOrder?: number;
  recordedByUserId?: string;
}) {
  const existing = await prisma.employeeDesignation.findUnique({
    where: { nameEn: params.nameEn.trim() },
  });
  if (existing) {
    throw new Error(`পদবি ইংরেজি নাম '${params.nameEn}' ইতিমধ্যে ব্যবহৃত হয়েছে।`);
  }

  const desig = await prisma.employeeDesignation.create({
    data: {
      nameBn: params.nameBn.trim(),
      nameEn: params.nameEn.trim(),
      departmentId: params.departmentId || null,
      description: params.description?.trim() || null,
      sortOrder: params.sortOrder ?? 0,
      isActive: true,
    },
  });

  if (params.recordedByUserId) {
    await recordAuditLog({
      userId: params.recordedByUserId,
      action: "CREATE_HR_DESIGNATION",
      entityType: "EmployeeDesignation",
      entityId: desig.id,
      details: { nameBn: desig.nameBn, nameEn: desig.nameEn },
    });
  }

  return desig;
}

export async function updateDesignation(
  id: string,
  params: {
    nameBn?: string;
    nameEn?: string;
    departmentId?: string | null;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
    recordedByUserId?: string;
  }
) {
  const desig = await prisma.employeeDesignation.findUnique({ where: { id } });
  if (!desig) throw new Error("পদবি পাওয়া যায়নি।");

  if (params.nameEn && params.nameEn.trim().toLowerCase() !== desig.nameEn.toLowerCase()) {
    const existing = await prisma.employeeDesignation.findUnique({
      where: { nameEn: params.nameEn.trim() },
    });
    if (existing && existing.id !== id) {
      throw new Error(`পদবি ইংরেজি নাম '${params.nameEn}' ইতিমধ্যে ব্যবহৃত হয়েছে।`);
    }
  }

  const updated = await prisma.employeeDesignation.update({
    where: { id },
    data: {
      nameBn: params.nameBn?.trim(),
      nameEn: params.nameEn?.trim(),
      departmentId: params.departmentId !== undefined ? params.departmentId : undefined,
      description: params.description !== undefined ? params.description?.trim() || null : undefined,
      sortOrder: params.sortOrder,
      isActive: params.isActive,
    },
  });

  if (params.recordedByUserId) {
    await recordAuditLog({
      userId: params.recordedByUserId,
      action: "UPDATE_HR_DESIGNATION",
      entityType: "EmployeeDesignation",
      entityId: id,
      details: { before: desig, after: updated },
    });
  }

  return updated;
}

// =================================================================
// 4. EMPLOYEE MASTER CRUD & LIFECYCLE
// =================================================================

export interface GetEmployeesFilter {
  search?: string;
  employeeType?: string;
  departmentId?: string;
  designationId?: string;
  status?: string;
  hasUserAccount?: boolean;
  page?: number;
  limit?: number;
}

export async function getEmployees(filters: GetEmployeesFilter = {}) {
  await ensureDefaultHrMasterData();
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 25));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.employeeType) {
    where.employeeType = filters.employeeType;
  }
  if (filters.departmentId) {
    where.departmentId = filters.departmentId;
  }
  if (filters.designationId) {
    where.designationId = filters.designationId;
  }
  if (filters.hasUserAccount !== undefined) {
    where.userId = filters.hasUserAccount ? { not: null } : null;
  }

  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { employeeId: { contains: q } },
      { nameBn: { contains: q } },
      { nameEn: { contains: q } },
      { mobile: { contains: q } },
      { email: { contains: q } },
      { nidNumber: { contains: q } },
    ];
  }

  const [total, employees] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      include: {
        department: true,
        designation: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
          },
        },
        _count: {
          select: {
            qualifications: true,
            documents: true,
            leaveRequests: true,
            payrollRecords: true,
            assignedAssets: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    employees,
  };
}

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findFirst({
    where: {
      OR: [{ id }, { employeeId: id }],
    },
    include: {
      department: true,
      designation: true,
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          photoUrl: true,
          twoFactorEnabled: true,
          createdAt: true,
          teacherAssignments: {
            include: {
              session: true,
              section: {
                include: { jamatClass: true },
              },
              subject: true,
            },
          },
        },
      },
      qualifications: {
        orderBy: [{ passingYear: "desc" }, { createdAt: "desc" }],
      },
      documents: {
        orderBy: [{ createdAt: "desc" }],
        include: {
          uploadedByUser: {
            select: { id: true, name: true, role: true },
          },
        },
      },
      employmentHistories: {
        orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
        include: {
          recordedByUser: {
            select: { id: true, name: true, role: true },
          },
        },
      },
      leaveBalances: {
        include: { leaveType: true },
        orderBy: { createdAt: "asc" },
      },
      leaveRequests: {
        orderBy: [{ createdAt: "desc" }],
        take: 20,
        include: {
          leaveType: true,
          reviewedByUser: {
            select: { id: true, name: true, role: true },
          },
        },
      },
      attendanceRecords: {
        orderBy: [{ date: "desc" }],
        take: 30,
      },
      payrollRecords: {
        orderBy: [{ month: "desc" }],
        take: 12,
      },
      assignedAssets: {
        include: {
          item: {
            include: { category: true },
          },
          location: true,
        },
      },
      transportDrivers: {
        include: {
          vehicles: {
            include: { routes: true },
          },
        },
      },
    },
  });

  return employee;
}

export async function createEmployee(
  params: {
    nameBn: string;
    nameEn: string;
    nameAr?: string;
    employeeType?: string;
    departmentId?: string;
    designationId?: string;
    gender?: string;
    dateOfBirth?: string | Date;
    bloodGroup?: string;
    mobile: string;
    email?: string;
    nidNumber?: string;
    presentAddress?: string;
    permanentAddress?: string;
    emergencyContact?: string;
    joiningDate?: string | Date;
    baseSalary?: number;
    photoUrl?: string;
    notes?: string;
    userId?: string;
  },
  recordedByUserId: string
) {
  await ensureDefaultHrMasterData();

  // Validate User linkage uniqueness if provided
  if (params.userId) {
    const existingEmpWithUser = await prisma.employee.findUnique({
      where: { userId: params.userId },
    });
    if (existingEmpWithUser) {
      throw new Error("এই ব্যবহারকারী (User) অ্যাকাউন্টের সাথে ইতিমধ্যে একজন কর্মী যুক্ত রয়েছে।");
    }

    const targetUser = await prisma.user.findUnique({ where: { id: params.userId } });
    if (!targetUser) {
      throw new Error("প্রদত্ত ব্যবহারকারী (User) আইডি সিস্টেমে বিদ্যমান নেই।");
    }
  }

  // Validate mobile format / required
  if (!params.mobile || params.mobile.trim().length < 6) {
    throw new Error("বৈধ মোবাইল নম্বর প্রদান আবশ্যক।");
  }

  return prisma.$transaction(async (tx) => {
    // Generate concurrency-safe sequential Employee ID
    const employeeId = await generateNextEmployeeId(new Date().getFullYear(), tx);

    const joiningDate = params.joiningDate ? new Date(params.joiningDate) : new Date();
    const dateOfBirth = params.dateOfBirth ? new Date(params.dateOfBirth) : null;

    const employee = await tx.employee.create({
      data: {
        employeeId,
        userId: params.userId || null,
        departmentId: params.departmentId || null,
        designationId: params.designationId || null,
        nameBn: params.nameBn.trim(),
        nameEn: params.nameEn.trim(),
        nameAr: params.nameAr?.trim() || null,
        employeeType: params.employeeType || "TEACHER",
        gender: params.gender || "MALE",
        dateOfBirth,
        bloodGroup: params.bloodGroup || null,
        mobile: params.mobile.trim(),
        email: params.email?.trim() || null,
        nidNumber: params.nidNumber?.trim() || null,
        presentAddress: params.presentAddress?.trim() || null,
        permanentAddress: params.permanentAddress?.trim() || null,
        emergencyContact: params.emergencyContact?.trim() || null,
        joiningDate,
        baseSalary: params.baseSalary !== undefined ? Number(params.baseSalary) : 0,
        status: "ACTIVE",
        photoUrl: params.photoUrl || null,
        notes: params.notes?.trim() || null,
      },
      include: {
        department: true,
        designation: true,
      },
    });

    // Initialize Default Leave Balances for the current year
    const currentYear = new Date().getFullYear();
    const activeLeaveTypes = await tx.employeeLeaveType.findMany({
      where: { isActive: true },
    });

    for (const lt of activeLeaveTypes) {
      await tx.employeeLeaveBalance.create({
        data: {
          employeeId: employee.id,
          leaveTypeId: lt.id,
          year: currentYear,
          allocatedDays: lt.defaultDaysPerYear,
          usedDays: 0,
          pendingDays: 0,
          remainingDays: lt.defaultDaysPerYear,
        },
      });
    }

    // Record initial Joining Employment History
    await tx.employeeEmploymentHistory.create({
      data: {
        employeeId: employee.id,
        changeType: "JOINING",
        previousValue: null,
        newValue: `যোগদান - পদবি: ${employee.designation?.nameBn || "নির্ধারিত হয়নি"}, বেতন: ৳${employee.baseSalary.toLocaleString("bn-BD")}`,
        effectiveDate: joiningDate,
        reason: "প্রাতিষ্ঠানিক নতুন নিয়োগ ও যোগদান",
        recordedByUserId,
      },
    });

    // Record Audit Log
    await tx.auditLog.create({
      data: {
        userId: recordedByUserId,
        action: "CREATE_EMPLOYEE",
        entityType: "Employee",
        entityId: employee.id,
        detailsJson: JSON.stringify({
          employeeId: employee.employeeId,
          nameBn: employee.nameBn,
          nameEn: employee.nameEn,
          department: employee.department?.nameBn,
          designation: employee.designation?.nameBn,
          baseSalary: employee.baseSalary,
        }),
      },
    });

    return employee;
  });
}

export async function updateEmployee(
  id: string,
  params: {
    nameBn?: string;
    nameEn?: string;
    nameAr?: string;
    employeeType?: string;
    departmentId?: string | null;
    designationId?: string | null;
    gender?: string;
    dateOfBirth?: string | Date | null;
    bloodGroup?: string | null;
    mobile?: string;
    email?: string | null;
    nidNumber?: string | null;
    presentAddress?: string | null;
    permanentAddress?: string | null;
    emergencyContact?: string | null;
    baseSalary?: number;
    photoUrl?: string | null;
    notes?: string | null;
    userId?: string | null;
    changeReason?: string;
  },
  recordedByUserId: string
) {
  const current = await prisma.employee.findUnique({
    where: { id },
    include: {
      department: true,
      designation: true,
    },
  });
  if (!current) throw new Error("কর্মী রেকর্ড পাওয়া যায়নি।");

  // Validate user link if changed
  if (params.userId !== undefined && params.userId !== current.userId) {
    if (params.userId) {
      const existingUserEmp = await prisma.employee.findUnique({
        where: { userId: params.userId },
      });
      if (existingUserEmp && existingUserEmp.id !== id) {
        throw new Error("উক্ত ব্যবহারকারী (User) অ্যাকাউন্টের সাথে অন্য একজন কর্মী যুক্ত রয়েছে।");
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    // Check for Designation change to track in history
    if (params.designationId !== undefined && params.designationId !== current.designationId) {
      const newDesig = params.designationId
        ? await tx.employeeDesignation.findUnique({ where: { id: params.designationId } })
        : null;
      await tx.employeeEmploymentHistory.create({
        data: {
          employeeId: id,
          changeType: "DESIGNATION_CHANGE",
          previousValue: current.designation?.nameBn || "পূর্বপদবি নেই",
          newValue: newDesig?.nameBn || "পদবি বাতিল",
          effectiveDate: new Date(),
          reason: params.changeReason || "পদবি পদোন্নতি বা পরিবর্তন",
          recordedByUserId,
        },
      });
    }

    // Check for Department change to track in history
    if (params.departmentId !== undefined && params.departmentId !== current.departmentId) {
      const newDept = params.departmentId
        ? await tx.employeeDepartment.findUnique({ where: { id: params.departmentId } })
        : null;
      await tx.employeeEmploymentHistory.create({
        data: {
          employeeId: id,
          changeType: "DEPARTMENT_CHANGE",
          previousValue: current.department?.nameBn || "পূর্ববিভাগ নেই",
          newValue: newDept?.nameBn || "বিভাগ পরিবর্তন",
          effectiveDate: new Date(),
          reason: params.changeReason || "দপ্তর স্থানান্তর",
          recordedByUserId,
        },
      });
    }

    // Check for Salary change to track in history (Historical payroll stays unchanged)
    if (params.baseSalary !== undefined && params.baseSalary !== current.baseSalary) {
      await tx.employeeEmploymentHistory.create({
        data: {
          employeeId: id,
          changeType: "SALARY_CHANGE",
          previousValue: `৳${current.baseSalary.toLocaleString("bn-BD")}`,
          newValue: `৳${Number(params.baseSalary).toLocaleString("bn-BD")}`,
          effectiveDate: new Date(),
          reason: params.changeReason || "মাসিক বেতন কাঠামো পুনর্বিন্যাস",
          recordedByUserId,
        },
      });
    }

    const updated = await tx.employee.update({
      where: { id },
      data: {
        nameBn: params.nameBn?.trim(),
        nameEn: params.nameEn?.trim(),
        nameAr: params.nameAr !== undefined ? params.nameAr?.trim() || null : undefined,
        employeeType: params.employeeType,
        departmentId: params.departmentId !== undefined ? params.departmentId : undefined,
        designationId: params.designationId !== undefined ? params.designationId : undefined,
        gender: params.gender,
        dateOfBirth: params.dateOfBirth !== undefined ? (params.dateOfBirth ? new Date(params.dateOfBirth) : null) : undefined,
        bloodGroup: params.bloodGroup !== undefined ? params.bloodGroup : undefined,
        mobile: params.mobile?.trim(),
        email: params.email !== undefined ? params.email?.trim() || null : undefined,
        nidNumber: params.nidNumber !== undefined ? params.nidNumber?.trim() || null : undefined,
        presentAddress: params.presentAddress !== undefined ? params.presentAddress?.trim() || null : undefined,
        permanentAddress: params.permanentAddress !== undefined ? params.permanentAddress?.trim() || null : undefined,
        emergencyContact: params.emergencyContact !== undefined ? params.emergencyContact?.trim() || null : undefined,
        baseSalary: params.baseSalary !== undefined ? Number(params.baseSalary) : undefined,
        photoUrl: params.photoUrl !== undefined ? params.photoUrl : undefined,
        notes: params.notes !== undefined ? params.notes?.trim() || null : undefined,
        userId: params.userId !== undefined ? params.userId : undefined,
      },
      include: {
        department: true,
        designation: true,
        user: { select: { id: true, username: true, role: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: recordedByUserId,
        action: "UPDATE_EMPLOYEE",
        entityType: "Employee",
        entityId: id,
        detailsJson: JSON.stringify({
          employeeId: updated.employeeId,
          changes: params,
        }),
      },
    });

    return updated;
  });
}

// =================================================================
// 5. EMPLOYMENT STATUS LIFECYCLE & OFFBOARDING
// =================================================================

export type EmploymentStatus =
  | "ACTIVE"
  | "ON_LEAVE"
  | "SUSPENDED"
  | "RESIGNED"
  | "TERMINATED"
  | "RETIRED"
  | "INACTIVE";

export async function changeEmployeeStatus(params: {
  employeeId: string;
  newStatus: EmploymentStatus;
  effectiveDate?: string | Date;
  reason: string;
  remarks?: string;
  recordedByUserId: string;
}) {
  const { employeeId, newStatus, reason, remarks, recordedByUserId } = params;
  const effectiveDate = params.effectiveDate ? new Date(params.effectiveDate) : new Date();

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      user: true,
      department: true,
      designation: true,
      assignedAssets: {
        where: { status: { in: ["ACTIVE", "IN_USE"] } },
      },
      transportDrivers: {
        where: { status: "ACTIVE" },
      },
    },
  });

  if (!employee) throw new Error("কর্মী পাওয়া যায়নি।");
  if (employee.status === newStatus) {
    throw new Error(`কর্মীর বর্তমান স্ট্যাটাস ইতিমধ্যে '${newStatus}'।`);
  }

  const previousStatus = employee.status;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update Employee status and exit fields if offboarding
    const isOffboarding = ["RESIGNED", "TERMINATED", "RETIRED", "INACTIVE"].includes(newStatus);

    const updated = await tx.employee.update({
      where: { id: employeeId },
      data: {
        status: newStatus,
        exitDate: isOffboarding ? effectiveDate : null,
        exitReason: isOffboarding ? reason : null,
      },
    });

    // 2. Map history change type
    let changeType = "STATUS_CHANGE";
    if (newStatus === "RESIGNED") changeType = "RESIGNATION";
    else if (newStatus === "TERMINATED") changeType = "TERMINATION";
    else if (newStatus === "RETIRED") changeType = "RETIREMENT";

    await tx.employeeEmploymentHistory.create({
      data: {
        employeeId,
        changeType,
        previousValue: previousStatus,
        newValue: newStatus,
        effectiveDate,
        reason,
        remarks: remarks?.trim() || null,
        recordedByUserId,
      },
    });

    // 3. If offboarding: review active links, de-assign assets or flag warnings
    if (isOffboarding) {
      // If linked to User account, suspend or deactivate user login safely
      if (employee.userId) {
        await tx.user.update({
          where: { id: employee.userId },
          data: { status: "INACTIVE" },
        });
      }

      // If active transport driver, set driver to INACTIVE
      if (employee.transportDrivers && employee.transportDrivers.length > 0) {
        for (const driver of employee.transportDrivers) {
          await tx.transportDriver.update({
            where: { id: driver.id },
            data: { status: "INACTIVE" },
          });
        }
      }
    }

    // 4. Record Audit Log
    await tx.auditLog.create({
      data: {
        userId: recordedByUserId,
        action: "CHANGE_EMPLOYEE_STATUS",
        entityType: "Employee",
        entityId: employeeId,
        detailsJson: JSON.stringify({
          employeeId: employee.employeeId,
          previousStatus,
          newStatus,
          reason,
          effectiveDate,
        }),
      },
    });

    return updated;
  }, { timeout: 15000 });

  // 5. Trigger notification outside transaction
  try {
    if (employee) {
      await dispatchNotification({
        templateCode: "HR_STATUS_CHANGED",
        recipients: [
          {
            userId: employee.userId || recordedByUserId,
            name: employee.nameBn,
            email: employee.email || null,
            role: employee.user?.role || "TEACHER",
          },
        ],
        variables: {
          "employee.nameBn": employee.nameBn,
          "employee.employeeId": employee.employeeId,
          previousStatus,
          newStatus,
          effectiveDate: effectiveDate.toLocaleDateString("bn-BD"),
        },
        idempotencyBaseKey: `hr-status-${employee.id}-${newStatus}-${effectiveDate.getTime()}`,
      });
    }
  } catch (notifErr) {
    console.warn("Status change notification trigger failed (non-blocking):", notifErr);
  }

  return result;
}

// =================================================================
// 6. QUALIFICATIONS & PROFESSIONAL DOCUMENTS
// =================================================================

export async function addQualification(params: {
  employeeId: string;
  degreeTitle: string;
  institution: string;
  boardOrUniversity?: string;
  majorOrSubject?: string;
  passingYear?: number;
  resultOrGrade?: string;
  certificateUrl?: string;
  notes?: string;
  recordedByUserId: string;
}) {
  const employee = await prisma.employee.findUnique({ where: { id: params.employeeId } });
  if (!employee) throw new Error("কর্মী পাওয়া যায়নি।");

  const qual = await prisma.employeeQualification.create({
    data: {
      employeeId: params.employeeId,
      degreeTitle: params.degreeTitle.trim(),
      institution: params.institution.trim(),
      boardOrUniversity: params.boardOrUniversity?.trim() || null,
      majorOrSubject: params.majorOrSubject?.trim() || null,
      passingYear: params.passingYear ? Number(params.passingYear) : null,
      resultOrGrade: params.resultOrGrade?.trim() || null,
      certificateUrl: params.certificateUrl || null,
      verificationStatus: "VERIFIED",
      notes: params.notes?.trim() || null,
    },
  });

  await recordAuditLog({
    userId: params.recordedByUserId,
    action: "ADD_EMPLOYEE_QUALIFICATION",
    entityType: "EmployeeQualification",
    entityId: qual.id,
    details: { employeeId: employee.employeeId, degreeTitle: qual.degreeTitle },
  });

  return qual;
}

export async function deleteQualification(id: string, recordedByUserId: string) {
  const qual = await prisma.employeeQualification.findUnique({ where: { id } });
  if (!qual) throw new Error("শিক্ষাগত যোগ্যতা রেকর্ড পাওয়া যায়নি।");

  await prisma.employeeQualification.delete({ where: { id } });

  await recordAuditLog({
    userId: recordedByUserId,
    action: "DELETE_EMPLOYEE_QUALIFICATION",
    entityType: "EmployeeQualification",
    entityId: id,
    details: { degreeTitle: qual.degreeTitle, employeeId: qual.employeeId },
  });

  return { success: true };
}

export async function addEmployeeDocument(params: {
  employeeId: string;
  documentType: string;
  title: string;
  fileUrl: string;
  issueDate?: string | Date;
  expiryDate?: string | Date;
  notes?: string;
  uploadedByUserId: string;
}) {
  const employee = await prisma.employee.findUnique({ where: { id: params.employeeId } });
  if (!employee) throw new Error("কর্মী পাওয়া যায়নি।");

  const issueDate = params.issueDate ? new Date(params.issueDate) : null;
  const expiryDate = params.expiryDate ? new Date(params.expiryDate) : null;

  if (issueDate && expiryDate && expiryDate < issueDate) {
    throw new Error("মেয়াদ উত্তীর্ণের তারিখ ইস্যুর তারিখের পূর্বের হতে পারে না।");
  }

  const doc = await prisma.employeeDocument.create({
    data: {
      employeeId: params.employeeId,
      documentType: params.documentType,
      title: params.title.trim(),
      fileUrl: params.fileUrl.trim(),
      issueDate,
      expiryDate,
      verificationStatus: "VERIFIED",
      notes: params.notes?.trim() || null,
      uploadedByUserId: params.uploadedByUserId,
    },
  });

  await recordAuditLog({
    userId: params.uploadedByUserId,
    action: "ADD_EMPLOYEE_DOCUMENT",
    entityType: "EmployeeDocument",
    entityId: doc.id,
    details: { employeeId: employee.employeeId, title: doc.title, documentType: doc.documentType },
  });

  return doc;
}

export async function verifyEmployeeDocument(
  docId: string,
  verificationStatus: "VERIFIED" | "REJECTED" | "PENDING",
  recordedByUserId: string
) {
  const doc = await prisma.employeeDocument.findUnique({ where: { id: docId } });
  if (!doc) throw new Error("নথিটি পাওয়া যায়নি।");

  const updated = await prisma.employeeDocument.update({
    where: { id: docId },
    data: { verificationStatus },
  });

  await recordAuditLog({
    userId: recordedByUserId,
    action: "VERIFY_EMPLOYEE_DOCUMENT",
    entityType: "EmployeeDocument",
    entityId: docId,
    details: { previousStatus: doc.verificationStatus, newStatus: verificationStatus },
  });

  return updated;
}

export async function getExpiringDocuments(daysThreshold: number = 30) {
  const now = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + daysThreshold);

  return prisma.employeeDocument.findMany({
    where: {
      expiryDate: {
        gte: now,
        lte: maxDate,
      },
    },
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          nameBn: true,
          nameEn: true,
          mobile: true,
          employeeType: true,
          department: true,
          designation: true,
        },
      },
    },
    orderBy: { expiryDate: "asc" },
  });
}

// =================================================================
// 7. LEAVE MANAGEMENT & BALANCES
// =================================================================

export async function getLeaveTypes() {
  await ensureDefaultHrMasterData();
  return prisma.employeeLeaveType.findMany({
    where: { isActive: true },
    orderBy: { defaultDaysPerYear: "asc" },
  });
}

export async function getEmployeeLeaveBalances(employeeId: string, year?: number) {
  const targetYear = year || new Date().getFullYear();
  let balances = await prisma.employeeLeaveBalance.findMany({
    where: { employeeId, year: targetYear },
    include: { leaveType: true },
  });

  if (balances.length === 0) {
    const leaveTypes = await prisma.employeeLeaveType.findMany({ where: { isActive: true } });
    for (const lt of leaveTypes) {
      await prisma.employeeLeaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId: lt.id,
            year: targetYear,
          },
        },
        update: {},
        create: {
          employeeId,
          leaveTypeId: lt.id,
          year: targetYear,
          allocatedDays: lt.defaultDaysPerYear,
          usedDays: 0,
          pendingDays: 0,
          remainingDays: lt.defaultDaysPerYear,
        },
      });
    }
    balances = await prisma.employeeLeaveBalance.findMany({
      where: { employeeId, year: targetYear },
      include: { leaveType: true },
    });
  }

  return balances;
}

export async function submitLeaveRequest(params: {
  employeeId: string;
  leaveTypeId: string;
  startDate: string | Date;
  endDate: string | Date;
  reason: string;
  emergencyContact?: string;
  attachmentUrl?: string;
  recordedByUserId: string;
}) {
  const employee = await prisma.employee.findUnique({
    where: { id: params.employeeId },
    include: { department: true, designation: true },
  });
  if (!employee) throw new Error("কর্মী পাওয়া যায়নি।");

  if (employee.status !== "ACTIVE" && employee.status !== "ON_LEAVE") {
    throw new Error(`নিষ্ক্রিয় বা স্থগিত কর্মীর জন্য ছুটির আবেদন গ্রহণযোগ্য নয় (বর্তমান স্ট্যাটাস: ${employee.status})।`);
  }

  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("ছুটির শুরুর ও শেষের তারিখ সঠিক নয়।");
  }

  if (endDate < startDate) {
    throw new Error("ছুটির শেষের তারিখ শুরুর তারিখের পূর্বের হতে পারে না।");
  }

  // Calculate total days (inclusive)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const leaveType = await prisma.employeeLeaveType.findUnique({
    where: { id: params.leaveTypeId },
  });
  if (!leaveType) throw new Error("ছুটির ধরন পাওয়া যায়নি।");

  // Prevent duplicate overlapping approved leave requests
  const overlapping = await prisma.employeeLeaveRequest.findFirst({
    where: {
      employeeId: params.employeeId,
      status: { in: ["SUBMITTED", "APPROVED"] },
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
    },
  });

  if (overlapping) {
    throw new Error(`নির্ধারিত তারিখে (${startDate.toLocaleDateString("bn-BD")} হতে ${endDate.toLocaleDateString("bn-BD")}) ইতিমধ্যে ছুটির আবেদন বিদ্যমান রয়েছে (কোড: ${overlapping.requestCode})।`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const currentYear = startDate.getFullYear();
    const requestCode = await generateNextLeaveRequestCode(currentYear, tx);

    const reqRecord = await tx.employeeLeaveRequest.create({
      data: {
        requestCode,
        employeeId: params.employeeId,
        leaveTypeId: params.leaveTypeId,
        startDate,
        endDate,
        totalDays,
        reason: params.reason.trim(),
        emergencyContact: params.emergencyContact?.trim() || employee.mobile,
        attachmentUrl: params.attachmentUrl || null,
        status: "SUBMITTED",
      },
      include: {
        leaveType: true,
        employee: true,
      },
    });

    // Update pending days in balance
    await tx.employeeLeaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: params.employeeId,
          leaveTypeId: params.leaveTypeId,
          year: currentYear,
        },
      },
      update: {
        pendingDays: { increment: totalDays },
      },
      create: {
        employeeId: params.employeeId,
        leaveTypeId: params.leaveTypeId,
        year: currentYear,
        allocatedDays: leaveType.defaultDaysPerYear,
        usedDays: 0,
        pendingDays: totalDays,
        remainingDays: leaveType.defaultDaysPerYear,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: params.recordedByUserId,
        action: "SUBMIT_LEAVE_REQUEST",
        entityType: "EmployeeLeaveRequest",
        entityId: reqRecord.id,
        detailsJson: JSON.stringify({
          requestCode,
          employeeId: employee.employeeId,
          totalDays,
          startDate,
          endDate,
        }),
      },
    });

    return reqRecord;
  }, { timeout: 15000 });

  // Dispatch notification outside transaction
  try {
    if (employee) {
      await dispatchNotification({
        templateCode: "HR_LEAVE_SUBMITTED",
        recipients: [
          {
            userId: params.recordedByUserId,
            name: employee.nameBn,
            email: employee.email || null,
            role: "ADMIN",
          },
        ],
        variables: {
          "employee.nameBn": employee.nameBn,
          "employee.employeeId": employee.employeeId,
          "designation.nameBn": employee.designation?.nameBn || "স্টাফ",
          "request.code": result.requestCode,
          startDate: startDate.toLocaleDateString("bn-BD"),
          endDate: endDate.toLocaleDateString("bn-BD"),
          totalDays: String(totalDays),
          reason: params.reason,
        },
        idempotencyBaseKey: `hr-leave-sub-${result.id}`,
      });
    }
  } catch (e) {
    console.warn("Leave submit notification warning:", e);
  }

  return result;
}

export async function reviewLeaveRequest(params: {
  requestId: string;
  decision: "APPROVED" | "REJECTED";
  decisionReason?: string;
  reviewedByUserId: string;
}) {
  const { requestId, decision, decisionReason, reviewedByUserId } = params;

  const reqRecord = await prisma.employeeLeaveRequest.findUnique({
    where: { id: requestId },
    include: {
      employee: { include: { user: true, designation: true } },
      leaveType: true,
    },
  });

  if (!reqRecord) throw new Error("ছুটির আবেদন পাওয়া যায়নি।");
  if (reqRecord.status !== "SUBMITTED") {
    throw new Error(`ছুটির আবেদনটি ইতিমধ্যে '${reqRecord.status}' অবস্থায় রয়েছে।`);
  }

  const currentYear = reqRecord.startDate.getFullYear();

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update Leave Request Record
    const updated = await tx.employeeLeaveRequest.update({
      where: { id: requestId },
      data: {
        status: decision,
        reviewedByUserId,
        reviewedAt: new Date(),
        decisionReason: decisionReason?.trim() || null,
      },
      include: {
        leaveType: true,
        employee: true,
      },
    });

    // 2. Adjust Leave Balance
    if (decision === "APPROVED") {
      await tx.employeeLeaveBalance.updateMany({
        where: {
          employeeId: reqRecord.employeeId,
          leaveTypeId: reqRecord.leaveTypeId,
          year: currentYear,
        },
        data: {
          pendingDays: { decrement: reqRecord.totalDays },
          usedDays: { increment: reqRecord.totalDays },
          remainingDays: { decrement: reqRecord.totalDays },
        },
      });

      // If leave starts today or currently active, employee can be marked ON_LEAVE
      const now = new Date();
      if (reqRecord.startDate <= now && reqRecord.endDate >= now && reqRecord.employee.status === "ACTIVE") {
        await tx.employee.update({
          where: { id: reqRecord.employeeId },
          data: { status: "ON_LEAVE" },
        });
      }
    } else {
      // REJECTED
      await tx.employeeLeaveBalance.updateMany({
        where: {
          employeeId: reqRecord.employeeId,
          leaveTypeId: reqRecord.leaveTypeId,
          year: currentYear,
        },
        data: {
          pendingDays: { decrement: reqRecord.totalDays },
        },
      });
    }

    // 3. Audit Log
    await tx.auditLog.create({
      data: {
        userId: reviewedByUserId,
        action: decision === "APPROVED" ? "APPROVE_LEAVE_REQUEST" : "REJECT_LEAVE_REQUEST",
        entityType: "EmployeeLeaveRequest",
        entityId: requestId,
        detailsJson: JSON.stringify({
          requestCode: reqRecord.requestCode,
          decision,
          decisionReason,
          totalDays: reqRecord.totalDays,
        }),
      },
    });

    return updated;
  }, { timeout: 15000 });

  // 4. Notification outside transaction
  try {
    if (reqRecord) {
      const templateCode = decision === "APPROVED" ? "HR_LEAVE_APPROVED" : "HR_LEAVE_REJECTED";
      await dispatchNotification({
        templateCode,
        recipients: [
          {
            userId: reqRecord.employee.userId || reviewedByUserId,
            name: reqRecord.employee.nameBn,
            email: reqRecord.employee.email || null,
            role: reqRecord.employee.user?.role || "TEACHER",
          },
        ],
        variables: {
          "employee.nameBn": reqRecord.employee.nameBn,
          "employee.employeeId": reqRecord.employee.employeeId,
          "leaveType.nameBn": reqRecord.leaveType.nameBn,
          "request.code": reqRecord.requestCode,
          startDate: reqRecord.startDate.toLocaleDateString("bn-BD"),
          endDate: reqRecord.endDate.toLocaleDateString("bn-BD"),
          totalDays: String(reqRecord.totalDays),
          decisionReason: decisionReason || "কর্তৃপক্ষ কর্তৃক পর্যালোচিত",
        },
        idempotencyBaseKey: `hr-leave-decision-${reqRecord.id}-${decision}`,
      });
    }
  } catch (e) {
    console.warn("Leave decision notification warning:", e);
  }

  return result;
}

export async function getLeaveRequests(params?: {
  employeeId?: string;
  status?: string;
  year?: number;
  limit?: number;
}) {
  const where: any = {};
  if (params?.employeeId) where.employeeId = params.employeeId;
  if (params?.status) where.status = params.status;
  if (params?.year) {
    const startOfYear = new Date(params.year, 0, 1);
    const endOfYear = new Date(params.year, 11, 31, 23, 59, 59);
    where.startDate = { gte: startOfYear, lte: endOfYear };
  }

  return prisma.employeeLeaveRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          nameBn: true,
          nameEn: true,
          employeeType: true,
          department: true,
          designation: true,
        },
      },
      leaveType: true,
      reviewedByUser: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: params?.limit || 50,
  });
}

// =================================================================
// 8. EMPLOYEE ATTENDANCE INTEGRATION
// =================================================================

export async function recordEmployeeAttendance(params: {
  employeeId: string;
  date: string | Date;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | "HALF_DAY" | "HOLIDAY";
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
  recordedByUserId: string;
}) {
  const targetDate = new Date(params.date);
  targetDate.setHours(0, 0, 0, 0);

  const employee = await prisma.employee.findUnique({ where: { id: params.employeeId } });
  if (!employee) throw new Error("কর্মী পাওয়া যায়নি।");

  return prisma.employeeAttendanceRecord.upsert({
    where: {
      employeeId_date: {
        employeeId: params.employeeId,
        date: targetDate,
      },
    },
    update: {
      status: params.status,
      checkInTime: params.checkInTime || undefined,
      checkOutTime: params.checkOutTime || undefined,
      remarks: params.remarks?.trim() || null,
      recordedByUserId: params.recordedByUserId,
    },
    create: {
      employeeId: params.employeeId,
      date: targetDate,
      status: params.status,
      checkInTime: params.checkInTime || null,
      checkOutTime: params.checkOutTime || null,
      remarks: params.remarks?.trim() || null,
      recordedByUserId: params.recordedByUserId,
    },
  });
}

export async function getEmployeeAttendance(params: {
  employeeId?: string;
  date?: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  status?: string;
}) {
  const where: any = {};
  if (params.employeeId) where.employeeId = params.employeeId;
  if (params.status) where.status = params.status;

  if (params.date) {
    const d = new Date(params.date);
    d.setHours(0, 0, 0, 0);
    where.date = d;
  } else if (params.startDate || params.endDate) {
    where.date = {};
    if (params.startDate) {
      const s = new Date(params.startDate);
      s.setHours(0, 0, 0, 0);
      where.date.gte = s;
    }
    if (params.endDate) {
      const e = new Date(params.endDate);
      e.setHours(23, 59, 59, 999);
      where.date.lte = e;
    }
  }

  return prisma.employeeAttendanceRecord.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          nameBn: true,
          nameEn: true,
          employeeType: true,
          department: true,
          designation: true,
        },
      },
      recordedByUser: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: [{ date: "desc" }],
  });
}

// =================================================================
// 9. HR DASHBOARD & AGGREGATE STATS
// =================================================================

export async function getHrDashboardStats() {
  await ensureDefaultHrMasterData();

  const [
    totalEmployees,
    activeEmployees,
    teachersCount,
    staffCount,
    onLeaveCount,
    pendingLeavesCount,
    expiringDocs,
    recentStatusChanges,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.employee.count({ where: { employeeType: "TEACHER", status: "ACTIVE" } }),
    prisma.employee.count({ where: { employeeType: { not: "TEACHER" }, status: "ACTIVE" } }),
    prisma.employee.count({ where: { status: "ON_LEAVE" } }),
    prisma.employee.count({ where: { status: "ACTIVE", leaveRequests: { some: { status: "SUBMITTED" } } } }),
    getExpiringDocuments(30),
    prisma.employeeEmploymentHistory.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            nameBn: true,
            nameEn: true,
            employeeType: true,
          },
        },
        recordedByUser: {
          select: { id: true, name: true, role: true },
        },
      },
    }),
  ]);

  // Aggregate monthly payroll summary if records exist
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const payrollSummary = await prisma.payrollRecord.aggregate({
    where: { month: currentMonth },
    _sum: { netSalary: true },
    _count: { id: true },
  });

  return {
    totalEmployees,
    activeEmployees,
    teachersCount,
    staffCount,
    onLeaveCount,
    pendingLeavesCount,
    expiringDocumentsCount: expiringDocs.length,
    expiringDocuments: expiringDocs,
    recentStatusChanges,
    currentMonthPayroll: {
      month: currentMonth,
      totalNetSalary: payrollSummary._sum.netSalary || 0,
      totalRecords: payrollSummary._count.id || 0,
    },
  };
}

// =================================================================
// 10. HR REPORTS (EMPLOYEE, TEACHER, LEAVE, EXIRY, AUDIT)
// =================================================================

export async function getEmployeeRegisterReport(params?: {
  departmentId?: string;
  designationId?: string;
  employeeType?: string;
  status?: string;
}) {
  const where: any = {};
  if (params?.departmentId) where.departmentId = params.departmentId;
  if (params?.designationId) where.designationId = params.designationId;
  if (params?.employeeType) where.employeeType = params.employeeType;
  if (params?.status) where.status = params.status;

  return prisma.employee.findMany({
    where,
    include: {
      department: true,
      designation: true,
      user: {
        select: { id: true, username: true, role: true, status: true },
      },
    },
    orderBy: [{ joiningDate: "desc" }, { employeeId: "asc" }],
  });
}

export async function getTeacherRegisterReport() {
  return prisma.employee.findMany({
    where: {
      OR: [
        { employeeType: "TEACHER" },
        { user: { role: "TEACHER" } },
      ],
    },
    include: {
      department: true,
      designation: true,
      user: {
        include: {
          teacherAssignments: {
            include: {
              session: true,
              section: {
                include: { jamatClass: true },
              },
              subject: true,
            },
          },
        },
      },
    },
    orderBy: [{ status: "asc" }, { employeeId: "asc" }],
  });
}

export async function getLeaveReport(params?: {
  year?: number;
  leaveTypeId?: string;
  status?: string;
}) {
  const where: any = {};
  if (params?.status) where.status = params.status;
  if (params?.leaveTypeId) where.leaveTypeId = params.leaveTypeId;
  if (params?.year) {
    const start = new Date(params.year, 0, 1);
    const end = new Date(params.year, 11, 31, 23, 59, 59);
    where.startDate = { gte: start, lte: end };
  }

  return prisma.employeeLeaveRequest.findMany({
    where,
    include: {
      employee: {
        include: { department: true, designation: true },
      },
      leaveType: true,
      reviewedByUser: { select: { id: true, name: true, role: true } },
    },
    orderBy: { startDate: "desc" },
  });
}

// =================================================================
// 11. PUBLIC PRIVACY-SAFE EMPLOYEE VERIFICATION
// =================================================================

export async function verifyEmployeePublicToken(qrTokenOrDocToken: string) {
  // 1. Try finding by Employee QR Token
  const employee = await prisma.employee.findUnique({
    where: { qrToken: qrTokenOrDocToken },
    include: {
      department: true,
      designation: true,
    },
  });

  if (employee) {
    return {
      isValid: true,
      verificationType: "EMPLOYEE_IDENTITY_CARD",
      institution: {
        nameBn: INSTITUTION_INFO.nameBn,
        nameEn: INSTITUTION_INFO.nameEn,
        nameAr: INSTITUTION_INFO.nameAr,
        location: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
      },
      employee: {
        employeeId: employee.employeeId,
        nameBn: employee.nameBn,
        nameEn: employee.nameEn,
        designation: employee.designation?.nameBn || "স্টাফ",
        department: employee.department?.nameBn || "সাধারণ",
        joiningDate: employee.joiningDate.toLocaleDateString("bn-BD"),
        status: employee.status,
        photoUrl: employee.photoUrl || null,
      },
    };
  }

  // 2. Try finding by Employee Document Verification Token
  const document = await prisma.employeeDocument.findUnique({
    where: { verificationToken: qrTokenOrDocToken },
    include: {
      employee: {
        include: { department: true, designation: true },
      },
    },
  });

  if (document) {
    return {
      isValid: true,
      verificationType: "EMPLOYEE_OFFICIAL_DOCUMENT",
      institution: {
        nameBn: INSTITUTION_INFO.nameBn,
        nameEn: INSTITUTION_INFO.nameEn,
        nameAr: INSTITUTION_INFO.nameAr,
        location: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
      },
      document: {
        title: document.title,
        documentType: document.documentType,
        issueDate: document.issueDate ? document.issueDate.toLocaleDateString("bn-BD") : "নির্ধারিত নেই",
        expiryDate: document.expiryDate ? document.expiryDate.toLocaleDateString("bn-BD") : "মেয়াদহীন",
        verificationStatus: document.verificationStatus,
      },
      employee: {
        employeeId: document.employee.employeeId,
        nameBn: document.employee.nameBn,
        nameEn: document.employee.nameEn,
        designation: document.employee.designation?.nameBn || "স্টাফ",
        department: document.employee.department?.nameBn || "সাধারণ",
        status: document.employee.status,
      },
    };
  }

  return {
    isValid: false,
    message: "কোনো বৈধ কর্মী বা সনদপত্র তথ্য পাওয়া যায়নি।",
  };
}

// =================================================================
// 12. EMPLOYEE DIGITAL ID CARD & OFFICIAL LETTER GENERATION
// =================================================================

export async function generateEmployeeIdCardData(employeeId: string) {
  const employee = await prisma.employee.findFirst({
    where: { OR: [{ id: employeeId }, { employeeId }] },
    include: {
      department: true,
      designation: true,
    },
  });

  if (!employee) throw new Error("কর্মী পাওয়া যায়নি।");

  const verifyUrl = `${getAppUrl()}/verify/employee/${encodeURIComponent(employee.qrToken)}`;
  const qrCodeUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 256,
    color: {
      dark: "#083B25", // Institutional Emerald Dark
      light: "#FFFFFF",
    },
  });

  return {
    institution: INSTITUTION_INFO,
    employee: {
      id: employee.id,
      employeeId: employee.employeeId,
      nameBn: employee.nameBn,
      nameEn: employee.nameEn,
      designation: employee.designation?.nameBn || "পদবি নির্ধারিত হয়নি",
      department: employee.department?.nameBn || "দপ্তর নির্ধারিত হয়নি",
      joiningDate: employee.joiningDate.toLocaleDateString("bn-BD"),
      bloodGroup: employee.bloodGroup || "N/A",
      emergencyContact: employee.emergencyContact || employee.mobile,
      photoUrl: employee.photoUrl || null,
      status: employee.status,
    },
    qrCodeUrl,
    verifyUrl,
  };
}

export async function ensureEmployeeForTeacherUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });
  if (!user) throw new Error("ব্যবহারকারী পাওয়া যায়নি।");

  if (user.employee) {
    return user.employee;
  }

  // Check if an employee exists with user's mobile or email
  let employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { userId: user.id },
        ...(user.phone ? [{ mobile: user.phone }] : []),
        ...(user.email ? [{ email: user.email }] : []),
      ],
    },
  });

  if (employee) {
    if (!employee.userId) {
      employee = await prisma.employee.update({
        where: { id: employee.id },
        data: { userId: user.id },
      });
    }
    return employee;
  }

  await ensureDefaultHrMasterData();

  const dept = await prisma.employeeDepartment.findFirst({
    where: { OR: [{ nameEn: "Academic" }, { nameBn: { contains: "শিক্ষা" } }] },
  });
  const desig = await prisma.employeeDesignation.findFirst({
    where: { OR: [{ nameEn: "Teacher" }, { nameBn: { contains: "শিক্ষক" } }] },
  });

  const employeeCode = await generateNextHrSequence("EMP");
  employee = await prisma.employee.create({
    data: {
      employeeId: employeeCode,
      userId: user.id,
      nameBn: user.name || "উস্তাদ / শিক্ষক",
      nameEn: user.username || "Teacher",
      mobile: user.phone || `01800${Math.floor(100000 + Math.random() * 900000)}`,
      email: user.email || null,
      employeeType: "TEACHER",
      status: "ACTIVE",
      departmentId: dept?.id || null,
      designationId: desig?.id || null,
    },
  });

  return employee;
}
