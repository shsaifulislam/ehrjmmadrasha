import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { atomicWriteFileSync, safeReadJsonSync } from "@/lib/storageUtils";

export interface GatePassRecord {
  id: string;
  passNumber: string;
  studentId: string;
  studentNameBn: string;
  studentIdNumber: string;
  className: string;
  rollNumber: number;
  residentialStatus: string;
  roomOrSeat?: string;
  purpose: "TREATMENT" | "EMERGENCY_FAMILY" | "WEEKEND_LEAVE" | "OFFICIAL_LEAVE" | "OTHER";
  purposeLabelBn: string;
  purposeDescription: string;
  escortName: string;
  escortPhone: string;
  escortRelation: string;
  departureExpected: string; // ISO String
  returnExpected: string; // ISO String
  actualExitTime: string | null;
  actualReturnTime: string | null;
  status: "APPROVED" | "EXITED" | "RETURNED" | "OVERDUE" | "CANCELLED";
  securityNotes?: string | null;
  approvedBy: string;
  issuedAt: string;
  qrToken: string;
}

const GATEPASS_DIR = path.join(process.cwd(), "data", "gatepass");
const GATEPASS_FILE = path.join(GATEPASS_DIR, "gatepass_records.json");

export const GATEPASS_PURPOSE_MAP: Record<string, string> = {
  TREATMENT: "জরুরি চিকিৎসা / ডাক্তারের পরামর্শ",
  EMERGENCY_FAMILY: "জরুরি পারিবারিক কারণ",
  WEEKEND_LEAVE: "সাপ্তাহিক নিয়মিত ছুটি",
  OFFICIAL_LEAVE: "অনুমোদিত প্রাতিষ্ঠানিক ছুটি",
  OTHER: "অন্যান্য বিশেষ প্রয়োজন",
};

/**
 * Initialize storage with default/seeded records if empty.
 */
export async function initGatePassStorage(): Promise<GatePassRecord[]> {
  const existing = safeReadJsonSync<GatePassRecord[]>(GATEPASS_FILE, []);
  if (existing.length > 0) return existing;

  // Find active residential students
  const students = await prisma.student.findMany({
    where: { residentialStatus: "RESIDENTIAL", status: "ACTIVE" },
    include: {
      enrollments: {
        include: { jamatClass: true, section: true },
        take: 1,
      },
      guardianLinks: {
        include: { guardian: true },
        take: 1,
      },
    },
    take: 5,
  });

  if (students.length === 0) return [];

  const now = new Date();
  const sampleRecords: GatePassRecord[] = students.map((st, idx) => {
    const en = st.enrollments[0];
    const guardian = st.guardianLinks[0]?.guardian;
    const passSeq = String(idx + 1).padStart(4, "0");
    const departure = new Date(now.getTime() - (idx * 6) * 3600000);
    const returnTime = new Date(departure.getTime() + 24 * 3600000);

    const statuses: Array<GatePassRecord["status"]> = [
      "EXITED",
      "APPROVED",
      "RETURNED",
      "EXITED",
      "APPROVED",
    ];

    const currentStatus = statuses[idx % statuses.length];
    const actualExit = currentStatus === "EXITED" || currentStatus === "RETURNED"
      ? departure.toISOString()
      : null;
    const actualReturn = currentStatus === "RETURNED"
      ? new Date(departure.getTime() + 18 * 3600000).toISOString()
      : null;

    return {
      id: crypto.randomUUID(),
      passNumber: `GP-2026-${passSeq}`,
      studentId: st.id,
      studentNameBn: st.fullNameBn,
      studentIdNumber: st.studentIdNumber,
      className: en?.jamatClass?.nameBn || "হিফজুল কুরআন",
      rollNumber: en?.rollNumber || (idx + 1),
      residentialStatus: "আবাসিক",
      roomOrSeat: `দারুল ইক্বামা কক্ষ-${(idx % 3) + 1}, সিট-${idx + 1}`,
      purpose: idx % 2 === 0 ? "WEEKEND_LEAVE" : "TREATMENT",
      purposeLabelBn: idx % 2 === 0 ? GATEPASS_PURPOSE_MAP.WEEKEND_LEAVE : GATEPASS_PURPOSE_MAP.TREATMENT,
      purposeDescription: idx % 2 === 0 ? "অভিভাবকের সাথে সাপ্তাহিক অনুমোদিত ছুটি গ্রহণ।" : "স্থানীয় ক্লিনিকে চক্ষু পরীক্ষা ও ডাক্তারের পরামর্শ।",
      escortName: guardian?.fullNameBn || st.fatherNameBn || "অভিভাবক",
      escortPhone: guardian?.phone || st.fatherPhone || "01711000000",
      escortRelation: guardian?.relation || "পিতা",
      departureExpected: departure.toISOString(),
      returnExpected: returnTime.toISOString(),
      actualExitTime: actualExit,
      actualReturnTime: actualReturn,
      status: currentStatus,
      securityNotes: currentStatus === "EXITED" ? "প্রধান ফটকে নিরাপত্তা প্রহরী কর্তৃক বহির্গমন ভেরিফাইড।" : null,
      approvedBy: "মুহতামিম / হোস্টেল সুপারিনটেনডেন্ট",
      issuedAt: departure.toISOString(),
      qrToken: `GP_${st.studentIdNumber}_${passSeq}_${crypto.randomBytes(4).toString("hex")}`,
    };
  });

  atomicWriteFileSync(GATEPASS_FILE, JSON.stringify(sampleRecords, null, 2));
  return sampleRecords;
}

/**
 * Get all Gate Pass records with optional filtering
 */
export async function getGatePassList(options?: {
  status?: string;
  studentId?: string;
  search?: string;
}): Promise<GatePassRecord[]> {
  let records = safeReadJsonSync<GatePassRecord[]>(GATEPASS_FILE, []);
  if (records.length === 0) {
    records = await initGatePassStorage();
  }

  const now = new Date();

  // Dynamically mark overdue if returnExpected < now and status === 'EXITED'
  records = records.map((r) => {
    if (r.status === "EXITED" && new Date(r.returnExpected) < now) {
      return { ...r, status: "OVERDUE" as const };
    }
    return r;
  });

  if (options?.studentId) {
    records = records.filter((r) => r.studentId === options.studentId);
  }

  if (options?.status && options.status !== "ALL") {
    records = records.filter((r) => r.status === options.status);
  }

  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    records = records.filter(
      (r) =>
        r.studentNameBn.toLowerCase().includes(q) ||
        r.studentIdNumber.toLowerCase().includes(q) ||
        r.passNumber.toLowerCase().includes(q) ||
        r.escortName.toLowerCase().includes(q) ||
        r.escortPhone.includes(q)
    );
  }

  // Sort descending by issuedAt
  return records.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
}

/**
 * Summary Stats for the Gate-Pass & Campus Security Dashboard
 */
export async function getGatePassStats(): Promise<{
  totalIssued: number;
  activeOutside: number;
  pendingDeparture: number;
  returnedCount: number;
  overdueCount: number;
}> {
  const records = await getGatePassList();
  return {
    totalIssued: records.length,
    activeOutside: records.filter((r) => r.status === "EXITED").length,
    pendingDeparture: records.filter((r) => r.status === "APPROVED").length,
    returnedCount: records.filter((r) => r.status === "RETURNED").length,
    overdueCount: records.filter((r) => r.status === "OVERDUE").length,
  };
}

/**
 * Issue a new Gate-Pass and notify guardian
 */
export async function issueGatePass(params: {
  studentId: string;
  purpose: GatePassRecord["purpose"];
  purposeDescription: string;
  escortName: string;
  escortPhone: string;
  escortRelation: string;
  departureExpected: string;
  returnExpected: string;
  roomOrSeat?: string;
  approvedBy: string;
}): Promise<GatePassRecord> {
  const student = await prisma.student.findUnique({
    where: { id: params.studentId },
    include: {
      enrollments: {
        include: { jamatClass: true, section: true },
        take: 1,
      },
      guardianLinks: {
        include: { guardian: { include: { user: true } } },
      },
    },
  });

  if (!student) {
    throw new Error("শিক্ষার্থীর তথ্য পাওয়া যায়নি।");
  }

  const existingRecords = await getGatePassList();
  const passSeq = String(existingRecords.length + 1).padStart(4, "0");
  const passNumber = `GP-${new Date().getFullYear()}-${passSeq}`;
  const en = student.enrollments[0];

  const newRecord: GatePassRecord = {
    id: crypto.randomUUID(),
    passNumber,
    studentId: student.id,
    studentNameBn: student.fullNameBn,
    studentIdNumber: student.studentIdNumber,
    className: en?.jamatClass?.nameBn || "নির্ধারিত নয়",
    rollNumber: en?.rollNumber || 1,
    residentialStatus: student.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক",
    roomOrSeat: params.roomOrSeat || "দারুল ইক্বামা",
    purpose: params.purpose,
    purposeLabelBn: GATEPASS_PURPOSE_MAP[params.purpose] || "বিশেষ প্রয়োজন",
    purposeDescription: params.purposeDescription,
    escortName: params.escortName,
    escortPhone: params.escortPhone,
    escortRelation: params.escortRelation,
    departureExpected: params.departureExpected,
    returnExpected: params.returnExpected,
    actualExitTime: null,
    actualReturnTime: null,
    status: "APPROVED",
    approvedBy: params.approvedBy,
    issuedAt: new Date().toISOString(),
    qrToken: `GP_${student.studentIdNumber}_${passSeq}_${crypto.randomBytes(6).toString("hex")}`,
  };

  const updatedRecords = [newRecord, ...existingRecords];
  atomicWriteFileSync(GATEPASS_FILE, JSON.stringify(updatedRecords, null, 2));

  // Send In-app notification to guardian
  try {
    if (student.guardianLinks.length > 0) {
      for (const link of student.guardianLinks) {
        const guardianUserId = link.guardian.userId || link.guardian.user?.id;
        if (guardianUserId) {
          await prisma.notification.create({
            data: {
              recipientUserId: guardianUserId,
              title: "সিকিউরিটি গেটপাস ইস্যু করা হয়েছে",
              body: `${student.fullNameBn}-এর জন্য গেটপাস (${passNumber}) অনুমোদিত হয়েছে। গমনের কারণ: ${newRecord.purposeLabelBn}। প্রত্যাবর্তনের সম্ভাব্য সময়: ${new Date(params.returnExpected).toLocaleDateString("bn-BD")}।`,
              type: "SYSTEM",
              channel: "PORTAL",
              priority: "IMPORTANT",
              relatedEntityType: "GatePass",
              relatedEntityId: newRecord.id,
              actionUrl: "/portal?tab=GATEPASS",
            },
          });
        }
      }
    }
  } catch (err) {
    console.warn("Could not dispatch gatepass notification to guardian:", err);
  }

  return newRecord;
}

/**
 * Checkpoint Action: Mark Gate Exit (Student exits campus gate)
 */
export async function markGateExit(passId: string, securityNotes?: string): Promise<GatePassRecord> {
  const records = await getGatePassList();
  const index = records.findIndex((r) => r.id === passId);
  if (index === -1) throw new Error("গেটপাস রেকর্ড পাওয়া যায়নি।");

  const record = records[index];
  record.status = "EXITED";
  record.actualExitTime = new Date().toISOString();
  if (securityNotes) record.securityNotes = securityNotes;

  atomicWriteFileSync(GATEPASS_FILE, JSON.stringify(records, null, 2));
  return record;
}

/**
 * Checkpoint Action: Mark Gate Return (Student safely returns to campus)
 */
export async function markGateReturn(passId: string, securityNotes?: string): Promise<GatePassRecord> {
  const records = await getGatePassList();
  const index = records.findIndex((r) => r.id === passId);
  if (index === -1) throw new Error("গেটপাস রেকর্ড পাওয়া যায়নি।");

  const record = records[index];
  record.status = "RETURNED";
  record.actualReturnTime = new Date().toISOString();
  if (securityNotes) {
    record.securityNotes = record.securityNotes
      ? `${record.securityNotes} | প্রত্যাবর্তন: ${securityNotes}`
      : securityNotes;
  }

  atomicWriteFileSync(GATEPASS_FILE, JSON.stringify(records, null, 2));
  return record;
}

/**
 * QR Verification retrieval for Security Guard / Public scanner
 */
export async function getGatePassByToken(qrToken: string): Promise<GatePassRecord | null> {
  const records = await getGatePassList();
  return records.find((r) => r.qrToken === qrToken) || null;
}
