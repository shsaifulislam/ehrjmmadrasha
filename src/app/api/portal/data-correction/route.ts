import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getAllCorrectionRequests,
  submitGuardianCorrectionRequest,
  reviewGuardianCorrectionRequest
} from "@/lib/importValidator";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "লগইন আবশ্যক।" }, { status: 401 });
    }

    if (user.role === "GUARDIAN") {
      const guardian = await prisma.guardian.findFirst({ where: { userId: user.userId } });
      if (!guardian) {
        return NextResponse.json({ success: true, data: [] });
      }
      const requests = await prisma.dataCorrectionRequest.findMany({
        where: { guardianId: guardian.id },
        orderBy: { createdAt: "desc" }
      });
      const data = requests.map(r => ({
        id: r.id,
        guardianId: r.guardianId,
        studentId: r.studentId || r.legacyStudentId,
        studentIdNumber: r.studentIdNumber,
        guardianNameBn: r.guardianNameBn,
        requestedFields: typeof r.requestedFields === "string" ? JSON.parse(r.requestedFields) : r.requestedFields,
        reasonBn: r.reasonBn,
        status: r.status,
        submittedAt: r.createdAt.toISOString(),
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : undefined,
        reviewNotes: r.reviewNotes
      }));
      return NextResponse.json({ success: true, data });
    } else if (user.role === "ADMIN" || user.role === "PRINCIPAL") {
      const requests = await prisma.dataCorrectionRequest.findMany({
        orderBy: { createdAt: "desc" }
      });
      const data = requests.map(r => ({
        id: r.id,
        guardianId: r.guardianId,
        studentId: r.studentId || r.legacyStudentId,
        studentIdNumber: r.studentIdNumber,
        guardianNameBn: r.guardianNameBn,
        requestedFields: typeof r.requestedFields === "string" ? JSON.parse(r.requestedFields) : r.requestedFields,
        reasonBn: r.reasonBn,
        status: r.status,
        submittedAt: r.createdAt.toISOString(),
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : undefined,
        reviewNotes: r.reviewNotes
      }));
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "GUARDIAN") {
      return NextResponse.json({ error: "শুধুমাত্র অভিভাবক তথ্য সংশোধনের আবেদন করতে পারেন।" }, { status: 403 });
    }

    const guardian = await prisma.guardian.findFirst({ where: { userId: user.userId } });
    if (!guardian) {
      return NextResponse.json({ error: "অভিভাবক প্রোফাইল পাওয়া যায়নি।" }, { status: 404 });
    }

    const body = await req.json();
    const { studentId, requestedFields, reasonBn } = body;

    if (!studentId || !requestedFields || !reasonBn) {
      return NextResponse.json({ error: "studentId, requestedFields এবং reasonBn আবশ্যক।" }, { status: 400 });
    }

    // Server-side Ownership / IDOR check
    const link = await prisma.guardianStudent.findUnique({
      where: {
        guardianId_studentId: {
          guardianId: guardian.id,
          studentId
        }
      }
    });
    if (!link) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। আপনি এই শিক্ষার্থীর নিবন্ধিত অভিভাবক নন।" },
        { status: 403 }
      );
    }

    const request = await submitGuardianCorrectionRequest(
      guardian.id,
      studentId,
      requestedFields,
      reasonBn
    );

    return NextResponse.json({
      success: true,
      messageBn: "আপনার তথ্য সংশোধনের আবেদন সফলভাবে জমা হয়েছে। অ্যাডমিন পর্যালোচনার পর কার্যকর হবে।",
      data: request
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "আবেদন জমা করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন তথ্য সংশোধনের আবেদন অনুমোদন করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, decision, notes } = body;

    if (!requestId || !["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json({ error: "সঠিক requestId এবং decision ('APPROVED' | 'REJECTED') আবশ্যক।" }, { status: 400 });
    }

    const reviewed = await reviewGuardianCorrectionRequest(
      requestId,
      decision,
      user.name || user.username,
      notes || ""
    );

    return NextResponse.json({
      success: true,
      messageBn: `আবেদন '${requestId}' সফলভাবে ${decision === "APPROVED" ? "অনুমোদন" : "প্রত্যাখ্যান"} করা হয়েছে।`,
      data: reviewed
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "আবেদন পর্যালোচনায় ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}
