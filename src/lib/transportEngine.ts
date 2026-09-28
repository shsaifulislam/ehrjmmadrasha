import { prisma } from "./prisma";
import { recordAuditLog } from "./security";
import { dispatchNotification } from "./communicationEngine";

// =================================================================
// 1. SEQUENCE & CODE GENERATORS
// =================================================================

/**
 * Concurrency-safe Transport Request Number Generator
 * Format: EHRJ-TRQ-YYYY-XXXXXX
 */
export async function generateNextTransportRequestNumber(txClient?: any): Promise<string> {
  const db = txClient || prisma;
  const currentYear = new Date().getFullYear();

  const seqRecord = await db.transportRequestSequence.upsert({
    where: { year: currentYear },
    create: { year: currentYear, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });

  const seqNumber = String(seqRecord.lastSeq).padStart(6, "0");
  return `EHRJ-TRQ-${currentYear}-${seqNumber}`;
}

// =================================================================
// 2. TYPES & INTERFACES
// =================================================================

export interface CreateRouteParams {
  routeName: string;
  routeCode: string;
  description?: string;
  direction?: string;
  startPoint: string;
  endPoint: string;
  vehicleId?: string;
  monthlyFee?: number;
  notes?: string;
  adminUserId: string;
}

export interface CreateStopParams {
  routeId: string;
  stopName: string;
  address?: string;
  sequenceOrder: number;
  pickupTime?: string;
  dropTime?: string;
  notes?: string;
  adminUserId: string;
}

export interface CreateVehicleParams {
  vehicleNumber: string;
  vehicleType?: string;
  model?: string;
  capacity: number;
  driverId?: string;
  notes?: string;
  adminUserId: string;
}

export interface CreateDriverParams {
  name: string;
  phone: string;
  address?: string;
  licenseNumber: string;
  licenseExpiry: Date;
  emergencyContact?: string;
  notes?: string;
  adminUserId: string;
}

export interface EnrollStudentTransportParams {
  studentId: string;
  sessionId?: string;
  routeId: string;
  pickupStopId: string;
  dropStopId?: string;
  startDate?: Date;
  monthlyFee?: number;
  notes?: string;
  adminUserId: string;
}

export interface ChangeStudentTransportRouteParams {
  enrollmentId: string;
  newRouteId: string;
  newPickupStopId: string;
  newDropStopId?: string;
  effectiveDate?: Date;
  newMonthlyFee?: number;
  reason: string;
  notes?: string;
  adminUserId: string;
}

export interface CancelStudentTransportParams {
  enrollmentId: string;
  reason: string;
  notes?: string;
  adminUserId: string;
}

export interface SubmitTransportRequestParams {
  studentId: string;
  guardianUserId: string;
  routeId: string;
  pickupStopId: string;
  dropStopId?: string;
  preferredStartDate: Date;
  reason?: string;
}

export interface ReviewTransportRequestParams {
  requestId: string;
  action: "APPROVE" | "REJECT";
  adminUserId: string;
  adminNotes?: string;
  rejectionReason?: string;
  assignedRouteId?: string;
  assignedPickupStopId?: string;
  assignedDropStopId?: string;
  effectiveStartDate?: Date;
  monthlyFee?: number;
}

// =================================================================
// 3. ROUTE OPERATIONS
// =================================================================

export async function createTransportRoute(params: CreateRouteParams) {
  const existing = await prisma.transportRoute.findUnique({
    where: { routeCode: params.routeCode.trim().toUpperCase() },
  });

  if (existing) {
    throw new Error(`রুট কোড '${params.routeCode}' ইতিমধ্যে বিদ্যমান। ভিন্ন কোড ব্যবহার করুন।`);
  }

  const route = await prisma.transportRoute.create({
    data: {
      routeName: params.routeName.trim(),
      routeCode: params.routeCode.trim().toUpperCase(),
      description: params.description?.trim(),
      direction: params.direction || "BOTH",
      startPoint: params.startPoint.trim(),
      endPoint: params.endPoint.trim(),
      vehicleId: params.vehicleId || null,
      monthlyFee: params.monthlyFee ?? 800,
      notes: params.notes?.trim(),
      status: "ACTIVE",
    },
    include: {
      vehicle: {
        include: { driver: true },
      },
      stops: {
        orderBy: { sequenceOrder: "asc" },
      },
    },
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "CREATE",
    entityType: "TransportRoute",
    entityId: route.id,
    details: { routeName: route.routeName, routeCode: route.routeCode },
  });

  return route;
}

export async function updateTransportRoute(
  id: string,
  params: Partial<CreateRouteParams> & { status?: string },
  adminUserId: string
) {
  const current = await prisma.transportRoute.findUnique({ where: { id } });
  if (!current) throw new Error("রুটটি পাওয়া যায়নি।");

  if (params.routeCode && params.routeCode.trim().toUpperCase() !== current.routeCode) {
    const existing = await prisma.transportRoute.findUnique({
      where: { routeCode: params.routeCode.trim().toUpperCase() },
    });
    if (existing) throw new Error(`রুট কোড '${params.routeCode}' ইতিমধ্যে ব্যবহৃত হচ্ছে।`);
  }

  const updated = await prisma.transportRoute.update({
    where: { id },
    data: {
      routeName: params.routeName?.trim(),
      routeCode: params.routeCode ? params.routeCode.trim().toUpperCase() : undefined,
      description: params.description !== undefined ? params.description?.trim() : undefined,
      direction: params.direction,
      startPoint: params.startPoint?.trim(),
      endPoint: params.endPoint?.trim(),
      vehicleId: params.vehicleId !== undefined ? params.vehicleId || null : undefined,
      monthlyFee: params.monthlyFee !== undefined ? params.monthlyFee : undefined,
      status: params.status,
      notes: params.notes !== undefined ? params.notes?.trim() : undefined,
    },
    include: {
      vehicle: { include: { driver: true } },
      stops: { orderBy: { sequenceOrder: "asc" } },
    },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "UPDATE",
    entityType: "TransportRoute",
    entityId: id,
    details: { previous: current, updated },
  });

  return updated;
}

export async function archiveTransportRoute(id: string, adminUserId: string) {
  const current = await prisma.transportRoute.findUnique({
    where: { id },
    include: {
      enrollments: { where: { status: "ACTIVE" } },
    },
  });

  if (!current) throw new Error("রুটটি পাওয়া যায়নি।");
  if (current.enrollments.length > 0) {
    throw new Error(
      `এই রুটে বর্তমানে ${current.enrollments.length} জন সক্রিয় শিক্ষার্থী রয়েছে। আগে শিক্ষার্থীদের অন্য রুটে স্থানান্তর করুন।`
    );
  }

  const updated = await prisma.transportRoute.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "ARCHIVE",
    entityType: "TransportRoute",
    entityId: id,
    details: { routeName: current.routeName },
  });

  return updated;
}

export async function getTransportRoutes(includeInactive = false) {
  const routes = await prisma.transportRoute.findMany({
    where: includeInactive ? {} : { status: { not: "ARCHIVED" } },
    include: {
      vehicle: {
        include: { driver: true },
      },
      stops: {
        orderBy: { sequenceOrder: "asc" },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
    orderBy: { routeCode: "asc" },
  });

  return routes.map((r) => ({
    ...r,
    activeStudentCount: r.enrollments.length,
    stopsCount: r.stops.length,
  }));
}

export async function getTransportRouteById(id: string) {
  const route = await prisma.transportRoute.findUnique({
    where: { id },
    include: {
      vehicle: {
        include: { driver: true },
      },
      stops: {
        orderBy: { sequenceOrder: "asc" },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: true,
          pickupStop: true,
          dropStop: true,
        },
      },
      histories: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { student: true },
      },
    },
  });

  if (!route) return null;

  return {
    ...route,
    activeStudentCount: route.enrollments.length,
    stopsCount: route.stops.length,
  };
}

// =================================================================
// 4. STOP OPERATIONS
// =================================================================

export async function createTransportStop(params: CreateStopParams) {
  const route = await prisma.transportRoute.findUnique({ where: { id: params.routeId } });
  if (!route) throw new Error("নির্দিষ্ট রুটটি পাওয়া যায়নি।");

  // Check sequence order duplicate
  const existingSeq = await prisma.transportStop.findUnique({
    where: {
      routeId_sequenceOrder: {
        routeId: params.routeId,
        sequenceOrder: params.sequenceOrder,
      },
    },
  });

  if (existingSeq) {
    throw new Error(
      `এই রুটে ক্রমিক নম্বর ${params.sequenceOrder} এ ইতিমধ্যে '${existingSeq.stopName}' স্টপ রয়েছে। ভিন্ন ক্রমিক নম্বর দিন।`
    );
  }

  const stop = await prisma.transportStop.create({
    data: {
      routeId: params.routeId,
      stopName: params.stopName.trim(),
      address: params.address?.trim(),
      sequenceOrder: params.sequenceOrder,
      pickupTime: params.pickupTime?.trim(),
      dropTime: params.dropTime?.trim(),
      notes: params.notes?.trim(),
      status: "ACTIVE",
    },
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "CREATE",
    entityType: "TransportStop",
    entityId: stop.id,
    details: { stopName: stop.stopName, routeId: params.routeId, sequenceOrder: stop.sequenceOrder },
  });

  return stop;
}

export async function updateTransportStop(
  id: string,
  params: Partial<CreateStopParams> & { status?: string },
  adminUserId: string
) {
  const current = await prisma.transportStop.findUnique({ where: { id } });
  if (!current) throw new Error("স্টপ পাওয়া যায়নি।");

  if (params.sequenceOrder && params.sequenceOrder !== current.sequenceOrder) {
    const existingSeq = await prisma.transportStop.findUnique({
      where: {
        routeId_sequenceOrder: {
          routeId: current.routeId,
          sequenceOrder: params.sequenceOrder,
        },
      },
    });
    if (existingSeq && existingSeq.id !== id) {
      throw new Error(`ক্রমিক নম্বর ${params.sequenceOrder} ইতিমধ্যে ব্যবহৃত হচ্ছে।`);
    }
  }

  const updated = await prisma.transportStop.update({
    where: { id },
    data: {
      stopName: params.stopName?.trim(),
      address: params.address !== undefined ? params.address?.trim() : undefined,
      sequenceOrder: params.sequenceOrder,
      pickupTime: params.pickupTime !== undefined ? params.pickupTime?.trim() : undefined,
      dropTime: params.dropTime !== undefined ? params.dropTime?.trim() : undefined,
      notes: params.notes !== undefined ? params.notes?.trim() : undefined,
      status: params.status,
    },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "UPDATE",
    entityType: "TransportStop",
    entityId: id,
    details: { previous: current, updated },
  });

  return updated;
}

export async function archiveTransportStop(id: string, adminUserId: string) {
  const current = await prisma.transportStop.findUnique({
    where: { id },
    include: {
      pickupEnrollments: { where: { status: "ACTIVE" } },
      dropEnrollments: { where: { status: "ACTIVE" } },
    },
  });

  if (!current) throw new Error("স্টপ পাওয়া যায়নি।");
  const totalActive = current.pickupEnrollments.length + current.dropEnrollments.length;
  if (totalActive > 0) {
    throw new Error(
      `এই স্টপে বর্তমানে ${totalActive} জন শিক্ষার্থী সক্রিয় রয়েছে। আগে স্টপ স্থানান্তর করুন।`
    );
  }

  const updated = await prisma.transportStop.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "ARCHIVE",
    entityType: "TransportStop",
    entityId: id,
    details: { stopName: current.stopName },
  });

  return updated;
}

// =================================================================
// 5. VEHICLE OPERATIONS
// =================================================================

export async function createTransportVehicle(params: CreateVehicleParams) {
  const existing = await prisma.transportVehicle.findUnique({
    where: { vehicleNumber: params.vehicleNumber.trim() },
  });

  if (existing) {
    throw new Error(`গাড়ি নম্বর '${params.vehicleNumber}' ইতিমধ্যে সিস্টেমে নিবন্ধিত রয়েছে।`);
  }

  if (params.capacity <= 0) {
    throw new Error("গাড়ির আসন ধারণক্ষমতা (Capacity) কমপক্ষে ১ হতে হবে।");
  }

  const vehicle = await prisma.transportVehicle.create({
    data: {
      vehicleNumber: params.vehicleNumber.trim(),
      vehicleType: params.vehicleType || "BUS",
      model: params.model?.trim(),
      capacity: params.capacity,
      driverId: params.driverId || null,
      notes: params.notes?.trim(),
      status: "ACTIVE",
    },
    include: { driver: true },
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "CREATE",
    entityType: "TransportVehicle",
    entityId: vehicle.id,
    details: { vehicleNumber: vehicle.vehicleNumber, capacity: vehicle.capacity },
  });

  return vehicle;
}

export async function updateTransportVehicle(
  id: string,
  params: Partial<CreateVehicleParams> & { status?: string },
  adminUserId: string
) {
  const current = await prisma.transportVehicle.findUnique({ where: { id } });
  if (!current) throw new Error("গাড়ি পাওয়া যায়নি।");

  if (params.vehicleNumber && params.vehicleNumber.trim() !== current.vehicleNumber) {
    const existing = await prisma.transportVehicle.findUnique({
      where: { vehicleNumber: params.vehicleNumber.trim() },
    });
    if (existing) throw new Error(`গাড়ি নম্বর '${params.vehicleNumber}' ইতিমধ্যে ব্যবহৃত হচ্ছে।`);
  }

  const updated = await prisma.transportVehicle.update({
    where: { id },
    data: {
      vehicleNumber: params.vehicleNumber?.trim(),
      vehicleType: params.vehicleType,
      model: params.model !== undefined ? params.model?.trim() : undefined,
      capacity: params.capacity !== undefined ? params.capacity : undefined,
      driverId: params.driverId !== undefined ? params.driverId || null : undefined,
      status: params.status,
      notes: params.notes !== undefined ? params.notes?.trim() : undefined,
    },
    include: { driver: true },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "UPDATE",
    entityType: "TransportVehicle",
    entityId: id,
    details: { previous: current, updated },
  });

  return updated;
}

export async function getTransportVehicles() {
  const vehicles = await prisma.transportVehicle.findMany({
    include: {
      driver: true,
      routes: {
        where: { status: "ACTIVE" },
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { vehicleNumber: "asc" },
  });

  return vehicles.map((v) => {
    const totalAssignedStudents = v.routes.reduce((acc, r) => acc + r.enrollments.length, 0);
    return {
      ...v,
      totalAssignedStudents,
      isFull: totalAssignedStudents >= v.capacity,
    };
  });
}

// =================================================================
// 6. DRIVER OPERATIONS
// =================================================================

export async function createTransportDriver(params: CreateDriverParams) {
  const existingPhone = await prisma.transportDriver.findUnique({
    where: { phone: params.phone.trim() },
  });
  if (existingPhone) {
    throw new Error(`মোবাইল নম্বর '${params.phone}' দিয়ে ইতিমধ্যে ড্রাইভার রেকর্ড রয়েছে।`);
  }

  const existingLicense = await prisma.transportDriver.findUnique({
    where: { licenseNumber: params.licenseNumber.trim() },
  });
  if (existingLicense) {
    throw new Error(`লাইসেন্স নম্বর '${params.licenseNumber}' ইতিমধ্যে ব্যবহৃত হয়েছে।`);
  }

  const driver = await prisma.transportDriver.create({
    data: {
      name: params.name.trim(),
      phone: params.phone.trim(),
      address: params.address?.trim(),
      licenseNumber: params.licenseNumber.trim(),
      licenseExpiry: new Date(params.licenseExpiry),
      emergencyContact: params.emergencyContact?.trim(),
      notes: params.notes?.trim(),
      status: "ACTIVE",
    },
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "CREATE",
    entityType: "TransportDriver",
    entityId: driver.id,
    details: { name: driver.name, phone: driver.phone, licenseNumber: driver.licenseNumber },
  });

  return driver;
}

export async function updateTransportDriver(
  id: string,
  params: Partial<CreateDriverParams> & { status?: string },
  adminUserId: string
) {
  const current = await prisma.transportDriver.findUnique({ where: { id } });
  if (!current) throw new Error("ড্রাইভার রেকর্ড পাওয়া যায়নি।");

  if (params.phone && params.phone.trim() !== current.phone) {
    const existing = await prisma.transportDriver.findUnique({
      where: { phone: params.phone.trim() },
    });
    if (existing) throw new Error(`মোবাইল নম্বর '${params.phone}' ইতিমধ্যে ব্যবহৃত হচ্ছে।`);
  }

  if (params.licenseNumber && params.licenseNumber.trim() !== current.licenseNumber) {
    const existing = await prisma.transportDriver.findUnique({
      where: { licenseNumber: params.licenseNumber.trim() },
    });
    if (existing) throw new Error(`লাইসেন্স নম্বর '${params.licenseNumber}' ইতিমধ্যে ব্যবহৃত হচ্ছে।`);
  }

  const updated = await prisma.transportDriver.update({
    where: { id },
    data: {
      name: params.name?.trim(),
      phone: params.phone?.trim(),
      address: params.address !== undefined ? params.address?.trim() : undefined,
      licenseNumber: params.licenseNumber?.trim(),
      licenseExpiry: params.licenseExpiry ? new Date(params.licenseExpiry) : undefined,
      emergencyContact: params.emergencyContact !== undefined ? params.emergencyContact?.trim() : undefined,
      status: params.status,
      notes: params.notes !== undefined ? params.notes?.trim() : undefined,
    },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "UPDATE",
    entityType: "TransportDriver",
    entityId: id,
    details: { previous: current, updated },
  });

  return updated;
}

export async function getTransportDrivers() {
  const drivers = await prisma.transportDriver.findMany({
    include: {
      vehicles: {
        include: {
          routes: { where: { status: "ACTIVE" } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return drivers.map((d) => ({
    ...d,
    isLicenseExpired: d.licenseExpiry < now,
    isLicenseExpiringSoon: d.licenseExpiry >= now && d.licenseExpiry <= thirtyDaysLater,
    assignedVehiclesCount: d.vehicles.length,
  }));
}

// =================================================================
// 7. STUDENT TRANSPORT ENROLLMENT & CAPACITY CONTROLS
// =================================================================

export async function enrollStudentInTransport(params: EnrollStudentTransportParams) {
  // 1. Resolve Academic Session
  let sessionId = params.sessionId;
  if (!sessionId) {
    const activeSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });
    if (!activeSession) throw new Error("কোনো বর্তমান সক্রিয় শিক্ষাবর্ষ পাওয়া যায়নি।");
    sessionId = activeSession.id;
  }

  // 2. Student Verification
  const student = await prisma.student.findUnique({
    where: { id: params.studentId },
    include: {
      guardianLinks: { include: { guardian: { include: { user: true } } } },
    },
  });

  if (!student) throw new Error("শিক্ষার্থী পাওয়া যায়নি।");
  if (student.status !== "ACTIVE") {
    throw new Error("শুধুমাত্র সক্রিয় শিক্ষার্থীদের পরিবহনে অন্তর্ভুক্ত করা সম্ভব।");
  }

  // 3. Route & Stop Verification
  const route = await prisma.transportRoute.findUnique({
    where: { id: params.routeId },
    include: {
      vehicle: true,
      stops: { where: { status: "ACTIVE" } },
    },
  });

  if (!route) throw new Error("রুট পাওয়া যায়নি।");
  if (route.status !== "ACTIVE") throw new Error("নির্বাচিত রুটটি সক্রিয় নয়।");

  const pickupStop = route.stops.find((s) => s.id === params.pickupStopId);
  if (!pickupStop) throw new Error("নির্বাচিত পিকআপ স্টপটি এই রুটের অন্তর্ভুক্ত নয়।");

  if (params.dropStopId) {
    const dropStop = route.stops.find((s) => s.id === params.dropStopId);
    if (!dropStop) throw new Error("নির্বাচিত ড্রপ স্টপটি এই রুটের অন্তর্ভুক্ত নয়।");
  }

  // 4. Duplicate Active Assignment Check
  const existingActive = await prisma.transportEnrollment.findFirst({
    where: {
      studentId: params.studentId,
      sessionId,
      status: "ACTIVE",
    },
    include: { route: true },
  });

  if (existingActive) {
    throw new Error(
      `শিক্ষার্থী ইতিমধ্যে '${existingActive.route.routeName}' রুটে সক্রিয়ভাবে অন্তর্ভুক্ত রয়েছে। পরিবর্তন করতে রুট পরিবর্তনের অপশন ব্যবহার করুন।`
    );
  }

  // 5. Server-Side Capacity Verification
  if (route.vehicle && route.vehicle.capacity > 0) {
    const activeCount = await prisma.transportEnrollment.count({
      where: {
        routeId: route.id,
        sessionId,
        status: "ACTIVE",
      },
    });

    if (activeCount >= route.vehicle.capacity) {
      throw new Error(
        `এই রুটের নির্ধারিত গাড়ির আসন পূর্ণ হয়ে গেছে (ধারণক্ষমতা: ${route.vehicle.capacity}, বরাদ্দ: ${activeCount})। অতিরিক্ত শিক্ষার্থী যুক্ত করা সম্ভব নয়।`
      );
    }
  }

  const monthlyFee = params.monthlyFee ?? route.monthlyFee;
  const startDate = params.startDate || new Date();

  // 6. Transactional Enrollment & History Creation
  const enrollment = await prisma.$transaction(async (tx) => {
    const newEnrollment = await tx.transportEnrollment.create({
      data: {
        studentId: params.studentId,
        sessionId,
        routeId: route.id,
        pickupStopId: params.pickupStopId,
        dropStopId: params.dropStopId || null,
        startDate,
        monthlyFee,
        status: "ACTIVE",
        notes: params.notes?.trim(),
        createdById: params.adminUserId,
      },
      include: {
        student: true,
        route: true,
        pickupStop: true,
        dropStop: true,
      },
    });

    await tx.transportAssignmentHistory.create({
      data: {
        studentId: params.studentId,
        sessionId,
        enrollmentId: newEnrollment.id,
        routeId: route.id,
        action: "ENROLLED",
        newPickupStopId: params.pickupStopId,
        effectiveDate: startDate,
        reason: "INITIAL_ASSIGNMENT",
        notes: params.notes?.trim() || "প্রাথমিক পরিবহন অন্তর্ভুক্তি",
        recordedByUserId: params.adminUserId,
      },
    });

    return newEnrollment;
  });

  // 7. Audit Log
  await recordAuditLog({
    userId: params.adminUserId,
    action: "CREATE",
    entityType: "TransportEnrollment",
    entityId: enrollment.id,
    details: {
      studentId: params.studentId,
      routeId: route.id,
      monthlyFee,
    },
  });

  // 8. Notification
  const guardian = student.guardianLinks[0]?.guardian;
  if (guardian?.user?.id) {
    try {
      await dispatchNotification({
        templateCode: "TRANSPORT_ENROLLMENT_ACTIVATED",
        variables: {
          "guardian.name": guardian.fullNameBn,
          "student.nameBn": student.fullNameBn,
          "route.name": route.routeName,
          pickupTime: pickupStop.pickupTime || "নির্ধারিত সময়সূচি অনুযায়ী",
        },
        recipients: [
          {
            userId: guardian.user.id,
            name: guardian.fullNameBn,
            email: guardian.email || null,
            role: "GUARDIAN",
          },
        ],
        relatedEntityType: "TransportEnrollment",
        relatedEntityId: enrollment.id,
        idempotencyBaseKey: `TR_ENROLL_${student.id}_${enrollment.id}`,
        priority: "IMPORTANT",
      });
    } catch (e) {
      console.error("Notification dispatch failed for transport enrollment:", e);
    }
  }

  return enrollment;
}

export async function changeStudentTransportRoute(params: ChangeStudentTransportRouteParams) {
  const current = await prisma.transportEnrollment.findUnique({
    where: { id: params.enrollmentId },
    include: {
      student: {
        include: { guardianLinks: { include: { guardian: { include: { user: true } } } } },
      },
      route: true,
      pickupStop: true,
    },
  });

  if (!current) throw new Error("পরিবহন এনরোলমেন্ট রেকর্ড পাওয়া যায়নি।");
  if (current.status !== "ACTIVE") throw new Error("শুধুমাত্র সক্রিয় পরিবহন এনরোলমেন্ট পরিবর্তন করা সম্ভব।");

  const newRoute = await prisma.transportRoute.findUnique({
    where: { id: params.newRouteId },
    include: {
      vehicle: true,
      stops: { where: { status: "ACTIVE" } },
    },
  });

  if (!newRoute) throw new Error("নতুন রুট পাওয়া যায়নি।");
  if (newRoute.status !== "ACTIVE") throw new Error("নির্বাচিত নতুন রুটটি সক্রিয় নয়।");

  const newStop = newRoute.stops.find((s) => s.id === params.newPickupStopId);
  if (!newStop) throw new Error("নির্বাচিত নতুন পিকআপ স্টপটি এই রুটের অন্তর্ভুক্ত নয়।");

  // Capacity check if changing route
  if (current.routeId !== params.newRouteId && newRoute.vehicle && newRoute.vehicle.capacity > 0) {
    const activeCount = await prisma.transportEnrollment.count({
      where: {
        routeId: newRoute.id,
        sessionId: current.sessionId,
        status: "ACTIVE",
      },
    });

    if (activeCount >= newRoute.vehicle.capacity) {
      throw new Error("নতুন রুটের গাড়ির আসন পূর্ণ। স্থানান্তর সম্ভব নয়।");
    }
  }

  const effectiveDate = params.effectiveDate || new Date();
  const monthlyFee = params.newMonthlyFee ?? newRoute.monthlyFee;

  const isRouteChange = current.routeId !== params.newRouteId;
  const action = isRouteChange ? "ROUTE_CHANGED" : "STOP_CHANGED";

  const updated = await prisma.$transaction(async (tx) => {
    const updatedEnrollment = await tx.transportEnrollment.update({
      where: { id: params.enrollmentId },
      data: {
        routeId: newRoute.id,
        pickupStopId: params.newPickupStopId,
        dropStopId: params.newDropStopId || null,
        monthlyFee,
        notes: params.notes?.trim() || current.notes,
      },
      include: {
        student: true,
        route: true,
        pickupStop: true,
      },
    });

    await tx.transportAssignmentHistory.create({
      data: {
        studentId: current.studentId,
        sessionId: current.sessionId,
        enrollmentId: current.id,
        routeId: newRoute.id,
        action,
        previousRouteId: current.routeId,
        previousPickupStopId: current.pickupStopId,
        newPickupStopId: params.newPickupStopId,
        effectiveDate,
        reason: params.reason,
        notes: params.notes?.trim(),
        recordedByUserId: params.adminUserId,
      },
    });

    return updatedEnrollment;
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "UPDATE",
    entityType: "TransportEnrollment",
    entityId: params.enrollmentId,
    details: {
      action,
      previousRoute: current.route.routeName,
      newRoute: newRoute.routeName,
      reason: params.reason,
    },
  });

  // Notify guardian
  const guardian = current.student.guardianLinks[0]?.guardian;
  if (guardian?.user?.id) {
    try {
      await dispatchNotification({
        templateCode: "TRANSPORT_ROUTE_CHANGED",
        variables: {
          "guardian.name": guardian.fullNameBn,
          "student.nameBn": current.student.fullNameBn,
          "route.name": newRoute.routeName,
          "stop.name": newStop.stopName,
          effectiveDate: effectiveDate.toISOString().split("T")[0],
        },
        recipients: [
          {
            userId: guardian.user.id,
            name: guardian.fullNameBn,
            email: guardian.email || null,
            role: "GUARDIAN",
          },
        ],
        relatedEntityType: "TransportEnrollment",
        relatedEntityId: current.id,
        idempotencyBaseKey: `TR_CHANGE_${current.id}_${effectiveDate.toISOString().split("T")[0]}`,
        priority: "IMPORTANT",
      });
    } catch (e) {
      console.error("Notification dispatch failed for transport route change:", e);
    }
  }

  return updated;
}

export async function cancelStudentTransport(params: CancelStudentTransportParams) {
  const current = await prisma.transportEnrollment.findUnique({
    where: { id: params.enrollmentId },
    include: {
      student: {
        include: { guardianLinks: { include: { guardian: { include: { user: true } } } } },
      },
      route: true,
    },
  });

  if (!current) throw new Error("পরিবহন এনরোলমেন্ট রেকর্ডটি পাওয়া যায়নি।");
  if (current.status !== "ACTIVE") throw new Error("এনরোলমেন্টটি ইতিমধ্যে সক্রিয় নয়।");

  const now = new Date();

  const cancelled = await prisma.$transaction(async (tx) => {
    const updated = await tx.transportEnrollment.update({
      where: { id: params.enrollmentId },
      data: {
        status: "CANCELLED",
        endDate: now,
        notes: params.notes?.trim() ? `${current.notes || ""}; ${params.notes.trim()}` : current.notes,
      },
    });

    await tx.transportAssignmentHistory.create({
      data: {
        studentId: current.studentId,
        sessionId: current.sessionId,
        enrollmentId: current.id,
        routeId: current.routeId,
        action: "CANCELLED",
        effectiveDate: now,
        reason: params.reason,
        notes: params.notes?.trim() || "পরিবহন সেবা বাতিল করা হয়েছে",
        recordedByUserId: params.adminUserId,
      },
    });

    return updated;
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "UPDATE",
    entityType: "TransportEnrollment",
    entityId: params.enrollmentId,
    details: { action: "CANCEL", reason: params.reason },
  });

  // Notify guardian
  const guardian = current.student.guardianLinks[0]?.guardian;
  if (guardian?.user?.id) {
    try {
      await dispatchNotification({
        templateCode: "TRANSPORT_ENROLLMENT_CANCELLED",
        variables: {
          "guardian.name": guardian.fullNameBn,
          "student.nameBn": current.student.fullNameBn,
          reason: params.reason,
        },
        recipients: [
          {
            userId: guardian.user.id,
            name: guardian.fullNameBn,
            email: guardian.email || null,
            role: "GUARDIAN",
          },
        ],
        relatedEntityType: "TransportEnrollment",
        relatedEntityId: current.id,
        idempotencyBaseKey: `TR_CANCEL_${current.id}_${now.toISOString().split("T")[0]}`,
        priority: "IMPORTANT",
      });
    } catch (e) {
      console.error("Notification dispatch failed for transport cancellation:", e);
    }
  }

  return cancelled;
}

export async function getStudentTransportProfile(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        include: { jamatClass: true, session: true },
        orderBy: { enrolledAt: "desc" },
        take: 1,
      },
      guardianLinks: { include: { guardian: true } },
    },
  });

  if (!student) return null;

  const currentEnrollment = await prisma.transportEnrollment.findFirst({
    where: { studentId, status: "ACTIVE" },
    include: {
      route: { include: { vehicle: { include: { driver: true } } } },
      pickupStop: true,
      dropStop: true,
      session: true,
    },
  });

  const histories = await prisma.transportAssignmentHistory.findMany({
    where: { studentId },
    include: { route: true },
    orderBy: { effectiveDate: "desc" },
  });

  const transportInvoices = await prisma.feeInvoice.findMany({
    where: {
      studentId,
      feeType: "TRANSPORT",
    },
    include: { receipts: true },
    orderBy: { dueDate: "desc" },
  });

  const requests = await prisma.transportRequest.findMany({
    where: { studentId },
    include: { route: true, pickupStop: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    student,
    currentEnrollment,
    histories,
    transportInvoices,
    requests,
  };
}

// =================================================================
// 8. GUARDIAN TRANSPORT REQUESTS & APPROVAL WORKFLOW
// =================================================================

export async function submitTransportRequest(params: SubmitTransportRequestParams) {
  // 1. Guardian Ownership & IDOR Protection Check
  const guardian = await prisma.guardian.findFirst({
    where: {
      OR: [
        { userId: params.guardianUserId },
        { phone: params.guardianUserId },
      ],
    },
    include: { students: true },
  });

  if (!guardian) {
    throw new Error("অভিভাবক অ্যাকাউন্ট সনাক্ত করা যায়নি।");
  }

  const isChildAuthorized = guardian.students.some((gs) => gs.studentId === params.studentId);
  if (!isChildAuthorized) {
    throw new Error("অননুমোদিত চেষ্টা! আপনি শুধুমাত্র আপনার নিবন্ধিত সন্তানের জন্যই আবেদন করতে পারেন।");
  }

  // 2. Active Session
  const activeSession = await prisma.academicSession.findFirst({
    where: { isCurrent: true },
  });
  if (!activeSession) throw new Error("কোনো বর্তমান সক্রিয় শিক্ষাবর্ষ পাওয়া যায়নি।");

  // 3. Prevent duplicate pending requests
  const existingPending = await prisma.transportRequest.findFirst({
    where: {
      studentId: params.studentId,
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
    },
  });

  if (existingPending) {
    throw new Error(
      `এই শিক্ষার্থীর জন্য ইতিমধ্যে একটি আবেদন প্রক্রিয়াধীন রয়েছে (আবেদন ট্র্যাকিং: ${existingPending.requestNumber})।`
    );
  }

  // 4. Validate route and stop
  const route = await prisma.transportRoute.findUnique({
    where: { id: params.routeId },
    include: { stops: { where: { status: "ACTIVE" } } },
  });

  if (!route || route.status !== "ACTIVE") {
    throw new Error("অনুরোধকৃত পরিবহন রুটটি বর্তমানে সক্রিয় নয়।");
  }

  const pickupStop = route.stops.find((s) => s.id === params.pickupStopId);
  if (!pickupStop) {
    throw new Error("নির্বাচিত পিকআপ স্টপটি এই রুটের অন্তর্ভুক্ত নয়।");
  }

  const requestNumber = await generateNextTransportRequestNumber();

  const request = await prisma.transportRequest.create({
    data: {
      requestNumber,
      studentId: params.studentId,
      guardianId: guardian.id,
      sessionId: activeSession.id,
      routeId: params.routeId,
      pickupStopId: params.pickupStopId,
      dropStopId: params.dropStopId || null,
      preferredStartDate: new Date(params.preferredStartDate),
      status: "SUBMITTED",
      reason: params.reason?.trim(),
    },
    include: {
      student: true,
      route: true,
      pickupStop: true,
    },
  });

  // Audit
  await recordAuditLog({
    userId: params.guardianUserId,
    action: "CREATE",
    entityType: "TransportRequest",
    entityId: request.id,
    details: { requestNumber, studentId: params.studentId, routeId: params.routeId },
  });

  // Notify Guardian
  try {
    await dispatchNotification({
      templateCode: "TRANSPORT_REQUEST_SUBMITTED",
      variables: {
        "guardian.name": guardian.fullNameBn,
        "student.nameBn": request.student.fullNameBn,
        "request.number": requestNumber,
      },
      recipients: [
        {
          userId: params.guardianUserId,
          name: guardian.fullNameBn,
          email: guardian.email || null,
          role: "GUARDIAN",
        },
      ],
      relatedEntityType: "TransportRequest",
      relatedEntityId: request.id,
      idempotencyBaseKey: `TR_REQ_SUBMIT_${request.id}`,
      priority: "NORMAL",
    });
  } catch (e) {
    console.error("Notification dispatch failed for transport request submission:", e);
  }

  return request;
}

export async function reviewTransportRequest(params: ReviewTransportRequestParams) {
  const reqRecord = await prisma.transportRequest.findUnique({
    where: { id: params.requestId },
    include: {
      student: true,
      guardian: { include: { user: true } },
      route: { include: { vehicle: true } },
      pickupStop: true,
    },
  });

  if (!reqRecord) throw new Error("আবেদন রেকর্ড পাওয়া যায়নি।");
  if (reqRecord.status !== "SUBMITTED" && reqRecord.status !== "UNDER_REVIEW") {
    throw new Error(`এই আবেদনটি ইতিমধ্যে '${reqRecord.status}' অবস্থায় রয়েছে। পুনরায় সিদ্ধান্ত নেওয়া সম্ভব নয়।`);
  }

  const now = new Date();

  if (params.action === "REJECT") {
    const updated = await prisma.transportRequest.update({
      where: { id: params.requestId },
      data: {
        status: "REJECTED",
        rejectionReason: params.rejectionReason?.trim() || "মাদরাসা কর্তৃপক্ষের সিদ্ধান্ত অনুযায়ী",
        adminNotes: params.adminNotes?.trim(),
        reviewedByUserId: params.adminUserId,
        reviewedAt: now,
      },
    });

    await recordAuditLog({
      userId: params.adminUserId,
      action: "UPDATE",
      entityType: "TransportRequest",
      entityId: params.requestId,
      details: { action: "REJECT", reason: params.rejectionReason },
    });

    if (reqRecord.guardian.user?.id) {
      try {
        await dispatchNotification({
          templateCode: "TRANSPORT_REQUEST_REJECTED",
          variables: {
            "guardian.name": reqRecord.guardian.fullNameBn,
            "request.number": reqRecord.requestNumber,
            reason: params.rejectionReason || "আসন সীমাবদ্ধতা",
          },
          recipients: [
            {
              userId: reqRecord.guardian.user.id,
              name: reqRecord.guardian.fullNameBn,
              email: reqRecord.guardian.email || null,
              role: "GUARDIAN",
            },
          ],
          relatedEntityType: "TransportRequest",
          relatedEntityId: reqRecord.id,
          idempotencyBaseKey: `TR_REQ_REJ_${reqRecord.id}`,
          priority: "NORMAL",
        });
      } catch (e) {
        console.error("Notification error on request rejection:", e);
      }
    }

    return updated;
  }

  // Action: APPROVE -> Transactional enrollment & state transition
  const routeId = params.assignedRouteId || reqRecord.routeId;
  const pickupStopId = params.assignedPickupStopId || reqRecord.pickupStopId;
  const dropStopId = params.assignedDropStopId || reqRecord.dropStopId;
  const startDate = params.effectiveStartDate || reqRecord.preferredStartDate || now;

  const targetRoute = await prisma.transportRoute.findUnique({
    where: { id: routeId },
    include: { vehicle: true, stops: true },
  });

  if (!targetRoute || targetRoute.status !== "ACTIVE") {
    throw new Error("অনুমোদনের জন্য নির্ধারিত রুটটি সক্রিয় নয়।");
  }

  // Capacity validation
  if (targetRoute.vehicle && targetRoute.vehicle.capacity > 0) {
    const activeCount = await prisma.transportEnrollment.count({
      where: {
        routeId: targetRoute.id,
        sessionId: reqRecord.sessionId,
        status: "ACTIVE",
      },
    });

    if (activeCount >= targetRoute.vehicle.capacity) {
      throw new Error(`নির্ধারিত গাড়ির আসন পূর্ণ (ধারণক্ষমতা: ${targetRoute.vehicle.capacity}, বরাদ্দ: ${activeCount})।`);
    }
  }

  const monthlyFee = params.monthlyFee ?? targetRoute.monthlyFee;

  const result = await prisma.$transaction(async (tx) => {
    // Check if student already has active enrollment
    const existing = await tx.transportEnrollment.findFirst({
      where: {
        studentId: reqRecord.studentId,
        sessionId: reqRecord.sessionId,
        status: "ACTIVE",
      },
    });

    if (existing) {
      if (existing.routeId === targetRoute.id && existing.pickupStopId === pickupStopId) {
        throw new Error("শিক্ষার্থী ইতিমধ্যে এই রুট ও স্টপেজে সক্রিয় রয়েছে।");
      }
      // Archive/transition prior active enrollment to maintain single active constraint while keeping history
      await tx.transportEnrollment.update({
        where: { id: existing.id },
        data: {
          status: "TRANSFERRED",
          endDate: startDate,
        },
      });

      await tx.transportAssignmentHistory.create({
        data: {
          enrollmentId: existing.id,
          studentId: reqRecord.studentId,
          sessionId: reqRecord.sessionId,
          routeId: targetRoute.id,
          action: "ROUTE_CHANGED",
          previousRouteId: existing.routeId,
          previousPickupStopId: existing.pickupStopId,
          newPickupStopId: pickupStopId,
          reason: `অভিভাবকের অনুমোদিত আবেদন নং: ${reqRecord.requestNumber}`,
          recordedByUserId: params.adminUserId,
        },
      });
    }

    const enrollment = await tx.transportEnrollment.create({
      data: {
        studentId: reqRecord.studentId,
        sessionId: reqRecord.sessionId,
        routeId: targetRoute.id,
        pickupStopId,
        dropStopId: dropStopId || null,
        startDate,
        monthlyFee,
        status: "ACTIVE",
        notes: `অনুমোদিত আবেদন নং: ${reqRecord.requestNumber}`,
        createdById: params.adminUserId,
      },
    });

    await tx.transportAssignmentHistory.create({
      data: {
        studentId: reqRecord.studentId,
        sessionId: reqRecord.sessionId,
        enrollmentId: enrollment.id,
        routeId: targetRoute.id,
        action: "ENROLLED",
        newPickupStopId: pickupStopId,
        effectiveDate: startDate,
        reason: `REQUEST_APPROVED (${reqRecord.requestNumber})`,
        notes: params.adminNotes?.trim() || "আবেদন অনুমোদনের মাধ্যমে অন্তর্ভুক্তি",
        recordedByUserId: params.adminUserId,
      },
    });

    const updatedRequest = await tx.transportRequest.update({
      where: { id: params.requestId },
      data: {
        status: "APPROVED",
        adminNotes: params.adminNotes?.trim(),
        reviewedByUserId: params.adminUserId,
        reviewedAt: now,
      },
    });

    return { enrollment, request: updatedRequest };
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "APPROVE",
    entityType: "TransportRequest",
    entityId: params.requestId,
    details: { enrollmentId: result.enrollment.id, routeId: targetRoute.id },
  });

  // Notify Guardian
  if (reqRecord.guardian.user?.id) {
    try {
      const stop = targetRoute.stops.find((s) => s.id === pickupStopId);
      await dispatchNotification({
        templateCode: "TRANSPORT_REQUEST_APPROVED",
        variables: {
          "guardian.name": reqRecord.guardian.fullNameBn,
          "student.nameBn": reqRecord.student.fullNameBn,
          "route.name": targetRoute.routeName,
          "stop.name": stop?.stopName || "নির্দিষ্ট স্টপ",
          effectiveDate: startDate.toISOString().split("T")[0],
        },
        recipients: [
          {
            userId: reqRecord.guardian.user.id,
            name: reqRecord.guardian.fullNameBn,
            email: reqRecord.guardian.email || null,
            role: "GUARDIAN",
          },
        ],
        relatedEntityType: "TransportRequest",
        relatedEntityId: reqRecord.id,
        idempotencyBaseKey: `TR_REQ_APP_${reqRecord.id}`,
        priority: "IMPORTANT",
      });
    } catch (e) {
      console.error("Notification error on request approval:", e);
    }
  }

  return result;
}

export async function getGuardianTransportData(guardianUserId: string) {
  const guardian = await prisma.guardian.findFirst({
    where: {
      OR: [
        { userId: guardianUserId },
        { phone: guardianUserId },
      ],
    },
    include: {
      students: {
        include: {
          student: {
            include: {
              enrollments: {
                where: { status: "ACTIVE" },
                include: { jamatClass: true, session: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!guardian) return null;

  const studentIds = guardian.students.map((gs) => gs.studentId);

  const activeEnrollments = await prisma.transportEnrollment.findMany({
    where: {
      studentId: { in: studentIds },
      status: "ACTIVE",
    },
    include: {
      route: { include: { vehicle: { include: { driver: true } } } },
      pickupStop: true,
      dropStop: true,
      student: true,
    },
  });

  const requests = await prisma.transportRequest.findMany({
    where: { guardianId: guardian.id },
    include: {
      student: true,
      route: true,
      pickupStop: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const availableRoutes = await prisma.transportRoute.findMany({
    where: { status: "ACTIVE" },
    include: {
      stops: { where: { status: "ACTIVE" }, orderBy: { sequenceOrder: "asc" } },
      vehicle: true,
    },
    orderBy: { routeCode: "asc" },
  });

  return {
    guardian,
    students: guardian.students.map((gs) => gs.student),
    activeEnrollments,
    requests,
    availableRoutes,
  };
}

// =================================================================
// 9. DASHBOARD METRICS & RECENT AUDIT
// =================================================================

export async function getTransportDashboardStats() {
  const [
    totalRoutes,
    activeRoutes,
    totalStops,
    activeStops,
    totalVehicles,
    activeVehicles,
    maintenanceVehicles,
    totalDrivers,
    activeDrivers,
    activeStudents,
    pendingRequests,
    recentHistories,
    recentRequests,
  ] = await Promise.all([
    prisma.transportRoute.count(),
    prisma.transportRoute.count({ where: { status: "ACTIVE" } }),
    prisma.transportStop.count(),
    prisma.transportStop.count({ where: { status: "ACTIVE" } }),
    prisma.transportVehicle.count(),
    prisma.transportVehicle.count({ where: { status: "ACTIVE" } }),
    prisma.transportVehicle.count({ where: { status: "MAINTENANCE" } }),
    prisma.transportDriver.count(),
    prisma.transportDriver.count({ where: { status: "ACTIVE" } }),
    prisma.transportEnrollment.count({ where: { status: "ACTIVE" } }),
    prisma.transportRequest.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.transportAssignmentHistory.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        student: true,
        route: true,
      },
    }),
    prisma.transportRequest.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        student: true,
        route: true,
        guardian: true,
      },
    }),
  ]);

  // Driver License Expiry Alert (within 30 days or already expired)
  const now = new Date();
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const expiringDrivers = await prisma.transportDriver.findMany({
    where: {
      licenseExpiry: { lte: thirtyDaysLater },
      status: "ACTIVE",
    },
    select: { id: true, name: true, phone: true, licenseExpiry: true },
  });

  // Routes near or at capacity
  const routesWithCapacity = await prisma.transportRoute.findMany({
    where: { status: "ACTIVE" },
    include: {
      vehicle: true,
      enrollments: { where: { status: "ACTIVE" }, select: { id: true } },
    },
  });

  const capacityAlerts = routesWithCapacity
    .filter((r) => r.vehicle && r.vehicle.capacity > 0 && r.enrollments.length >= r.vehicle.capacity * 0.9)
    .map((r) => ({
      routeId: r.id,
      routeName: r.routeName,
      routeCode: r.routeCode,
      vehicleNumber: r.vehicle?.vehicleNumber,
      capacity: r.vehicle?.capacity || 0,
      activeCount: r.enrollments.length,
      isFull: r.enrollments.length >= (r.vehicle?.capacity || 0),
    }));

  // Transport Finance Aggregation from Phase 6
  const transportInvoices = await prisma.feeInvoice.findMany({
    where: { feeType: "TRANSPORT" },
    select: { netAmount: true, paidAmount: true, dueAmount: true },
  });

  const financeSummary = transportInvoices.reduce(
    (acc, inv) => {
      acc.totalBilled += inv.netAmount;
      acc.totalCollected += inv.paidAmount;
      acc.totalDue += inv.dueAmount;
      return acc;
    },
    { totalBilled: 0, totalCollected: 0, totalDue: 0 }
  );

  return {
    totalRoutes,
    activeRoutes,
    totalStops,
    activeStops,
    totalVehicles,
    activeVehicles,
    totalDrivers,
    activeDrivers,
    activeTransportStudents: activeStudents,
    pendingRequestsCount: pendingRequests,
    routes: { total: totalRoutes, active: activeRoutes },
    stops: { total: totalStops, active: activeStops },
    vehicles: {
      total: totalVehicles,
      active: activeVehicles,
      maintenance: maintenanceVehicles,
    },
    drivers: {
      total: totalDrivers,
      active: activeDrivers,
      expiringCount: expiringDrivers.length,
      expiringDrivers,
    },
    students: {
      activeTransportUsers: activeStudents,
      pendingRequests,
    },
    capacityAlerts,
    financeSummary,
    finance: {
      billedTotal: financeSummary.totalBilled,
      paidTotal: financeSummary.totalCollected,
      dueTotal: financeSummary.totalDue,
    },
    recentHistories,
    recentRequests,
  };
}

// =================================================================
// 10. FINANCE INTEGRATION: TRANSPORT INVOICING
// =================================================================

export async function generateMonthlyTransportInvoiceForStudent({
  studentId,
  billingMonth, // Format: YYYY-MM e.g. "2026-03"
  adminUserId,
}: {
  studentId: string;
  billingMonth: string;
  adminUserId: string;
}) {
  const enrollment = await prisma.transportEnrollment.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
    },
    include: {
      route: true,
      session: true,
      student: true,
    },
  });

  if (!enrollment) {
    throw new Error("শিক্ষার্থী বর্তমানে কোনো সক্রিয় পরিবহনে অন্তর্ভুক্ত নয়।");
  }

  // Idempotency key to avoid duplicate invoice for the same month
  const idempotencyKey = `TR_INV_${studentId}_${billingMonth}_${enrollment.sessionId}`;

  const existingInvoice = await prisma.feeInvoice.findUnique({
    where: { idempotencyKey },
  });

  if (existingInvoice) {
    return existingInvoice; // Already created, safe idempotent return
  }

  // Find or create TRANSPORT fee category
  let feeCat = await prisma.feeCategory.findUnique({
    where: { code: "TRANSPORT" },
  });

  if (!feeCat) {
    feeCat = await prisma.feeCategory.create({
      data: {
        code: "TRANSPORT",
        nameBn: "পরিবহন ফি",
        nameEn: "Transport Fee",
        defaultAmount: enrollment.monthlyFee,
        isRecurring: true,
      },
    });
  }

  const invoiceNumber = `INV-TR-${billingMonth.replace("-", "")}-${studentId.slice(0, 8).toUpperCase()}`;

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.feeInvoice.create({
      data: {
        invoiceNumber,
        studentId,
        sessionId: enrollment.sessionId,
        feeType: "TRANSPORT",
        billingMonth,
        title: `পরিবহন ফি - ${enrollment.route.routeName} (${billingMonth})`,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days grace
        totalAmount: enrollment.monthlyFee,
        discountAmount: 0,
        waiverAmount: 0,
        lateFeeAmount: 0,
        netAmount: enrollment.monthlyFee,
        paidAmount: 0,
        dueAmount: enrollment.monthlyFee,
        fundCode: "GENERAL",
        idempotencyKey,
        status: "UNPAID",
      },
    });

    await tx.invoiceItem.create({
      data: {
        invoiceId: inv.id,
        feeCategoryId: feeCat.id,
        description: `মাসিক পরিবহন সার্ভিস ফি (${enrollment.route.routeName})`,
        amount: enrollment.monthlyFee,
      },
    });

    return inv;
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "CREATE",
    entityType: "FeeInvoice",
    entityId: invoice.id,
    details: { feeType: "TRANSPORT", invoiceNumber, amount: enrollment.monthlyFee },
  });

  return invoice;
}
