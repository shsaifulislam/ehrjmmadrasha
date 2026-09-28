import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const PWA_DATA_DIR = path.join(process.cwd(), "data", "pwa");
const SYNC_LOG_FILE = path.join(PWA_DATA_DIR, "synced_operations.json");

function ensurePwaDir() {
  if (!fs.existsSync(PWA_DATA_DIR)) {
    fs.mkdirSync(PWA_DATA_DIR, { recursive: true });
  }
}

function readSyncedOps(): Record<string, any> {
  ensurePwaDir();
  if (!fs.existsSync(SYNC_LOG_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(SYNC_LOG_FILE, "utf8"));
  } catch (err) {
    return {};
  }
}

function recordSyncedOp(idempotencyKey: string, result: any) {
  ensurePwaDir();
  const ops = readSyncedOps();
  ops[idempotencyKey] = {
    ...result,
    syncedAt: new Date().toISOString(),
  };
  fs.writeFileSync(SYNC_LOG_FILE, JSON.stringify(ops, null, 2), "utf8");
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { operationType, idempotencyKey, payload, clientCreatedAt } = body;

    if (!operationType || !idempotencyKey || !payload) {
      return NextResponse.json(
        { error: "অবৈধ রিকোয়েস্ট। operationType, idempotencyKey ও payload আবশ্যক।" },
        { status: 400 }
      );
    }

    // 1. Strict Online-Only Restriction Guard
    const forbiddenOfflineOperations = [
      "PAYMENT",
      "REFUND",
      "FEE_WAIVER",
      "RESULT_PUBLISH",
      "CERTIFICATE_ISSUE",
      "USER_ROLE_CHANGE",
    ];
    if (forbiddenOfflineOperations.includes(operationType)) {
      return NextResponse.json(
        {
          error: "নিরাপত্তা লঙ্ঘন: আর্থিক লেনদেন, ফলাফল চূড়ান্তকরণ বা সনদ ইস্যুকরণ অফলাইনে অনুমোদিত নয়।",
        },
        { status: 403 }
      );
    }

    // 2. Idempotency Check
    const existingOps = readSyncedOps();
    if (existingOps[idempotencyKey]) {
      return NextResponse.json({
        success: true,
        idempotent: true,
        message: "অপারেশন ইতোমধ্যে সফলভাবে সম্পন্ন হয়েছে (Idempotent Hit)।",
        data: existingOps[idempotencyKey],
      });
    }

    // 3. Process TEACHER_ATTENDANCE
    if (operationType === "TEACHER_ATTENDANCE") {
      if (user.role !== "TEACHER" && user.role !== "ADMIN" && user.role !== "PRINCIPAL") {
        return NextResponse.json(
          { error: "অননুমোদিত ভূমিকা। শুধুমাত্র শিক্ষক বা অ্যাডমিন হাজিরা সংরক্ষণ করতে পারেন।" },
          { status: 403 }
        );
      }

      const { classId, sectionId, date, records } = payload;
      const targetDate = new Date(date || Date.now());
      targetDate.setHours(0, 0, 0, 0);

      // Conflict Check: Check if attendance lock or newer submission exists
      const existingSubmissions = await prisma.attendance.findMany({
        where: {
          classId,
          date: targetDate,
        },
        orderBy: { updatedAt: "desc" },
        take: 1,
      });

      if (existingSubmissions.length > 0) {
        const lastUpdated = new Date(existingSubmissions[0].updatedAt).getTime();
        const clientCreatedTime = new Date(clientCreatedAt || Date.now()).getTime();

        // If server was updated AFTER client drafted attendance, flag conflict
        if (lastUpdated > clientCreatedTime + 1000) {
          return NextResponse.json(
            {
              conflict: true,
              conflictReason: "সার্ভারে এই ক্লাসের হাজিরা ইতোমধ্যে হালনাগাদ করা হয়েছে। অনুগ্রহ করে কনফ্লিক্ট রিভিউ করুন।",
            },
            { status: 409 }
          );
        }
      }

      // Authoritative Save (Upsert records)
      let savedCount = 0;
      if (Array.isArray(records)) {
        for (const r of records) {
          await prisma.attendance.upsert({
            where: {
              studentId_date: {
                studentId: r.studentId,
                date: targetDate,
              },
            },
            update: {
              status: r.status,
              remarks: r.remarks || "অফলাইন সিঙ্ক দ্বারা সংরক্ষিত",
              updatedByUserId: user.userId,
            },
            create: {
              studentId: r.studentId,
              classId,
              sectionId: sectionId || undefined,
              sessionId: r.sessionId || (await prisma.academicSession.findFirst())?.id || "default",
              date: targetDate,
              status: r.status,
              remarks: r.remarks || "অফলাইন সিঙ্ক দ্বারা সংরক্ষিত",
              markedByUserId: user.userId,
            },
          });
          savedCount++;
        }
      }

      const syncResult = {
        operationType,
        savedRecords: savedCount,
        serverTimestamp: new Date().toISOString(),
      };

      recordSyncedOp(idempotencyKey, syncResult);

      return NextResponse.json({
        success: true,
        message: `${savedCount} জন শিক্ষার্থীর অফলাইন হাজিরা সফলভাবে সার্ভারে সিঙ্ক হয়েছে।`,
        data: syncResult,
      });
    }

    // 4. Process HELPDESK_TICKET
    if (operationType === "HELPDESK_TICKET") {
      const { subject, message, priority } = payload;
      let category = await prisma.supportRequestCategory.findFirst({
        where: { isActive: true },
      });
      if (!category) {
        category = await prisma.supportRequestCategory.create({
          data: {
            code: "GENERAL",
            nameBn: "সাধারণ অনুসন্ধান",
            nameEn: "General Inquiry",
            description: "Default Category",
          },
        });
      }
      const ticketNumber = `EHRJ-TKT-${Date.now().toString().slice(-6)}`;
      const ticket = await prisma.supportRequest.create({
        data: {
          ticketNumber,
          categoryId: category.id,
          submittedByUserId: user.userId,
          requestType: "SERVICE_REQUEST",
          priority: priority === "URGENT" ? "URGENT" : "NORMAL",
          status: "SUBMITTED",
          subject: subject || "অফলাইন হেল্পডেস্ক আবেদন",
          description: message || "অফলাইন ড্রাফট থেকে সিঙ্ক করা হয়েছে।",
        },
      });

      const syncResult = {
        operationType,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        serverTimestamp: new Date().toISOString(),
      };

      recordSyncedOp(idempotencyKey, syncResult);

      return NextResponse.json({
        success: true,
        message: "হেল্পডেস্ক টিকিট সফলভাবে সার্ভারে সিঙ্ক হয়েছে।",
        data: syncResult,
      });
    }

    return NextResponse.json(
      { error: `অসমর্থিত অপারেশন টাইপ: ${operationType}` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Sync Processing Error:", err);
    return NextResponse.json(
      { error: err.message || "সিঙ্ক প্রসেসিং ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
