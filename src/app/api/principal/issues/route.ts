import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createSupportRequest, getSupportRequests } from "@/lib/helpdeskEngine";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/principal/issues
 * List governance directives and institutional issue requests
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // Fetch support requests initiated by Principal or tagged as GOVERNANCE_DIRECTIVE
    const where: any = {
      OR: [
        { submittedByUser: { role: "PRINCIPAL" } },
        { category: { code: "GOVERNANCE_DIRECTIVE" } },
        { requestType: "CORRECTION_REQUEST" },
      ],
    };

    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;

    const [total, issues] = await Promise.all([
      prisma.supportRequest.count({ where }),
      prisma.supportRequest.findMany({
        where,
        include: {
          category: { select: { code: true, nameBn: true, nameEn: true } },
          submittedByUser: { select: { id: true, name: true, role: true } },
          assignedToUser: { select: { id: true, name: true, role: true } },
          resolvedByUser: { select: { id: true, name: true, role: true } },
          statusHistories: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { recordedByUser: { select: { name: true, role: true } } },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { authorUser: { select: { name: true, role: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      issues,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Principal Issues GET Error:", error);
    return NextResponse.json({ error: "ইস্যু তালিকা লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}

/**
 * POST /api/principal/issues
 * Submit formal Principal Governance Directive / Institutional Correction Request
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "PRINCIPAL" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র মুহতামিম ও অ্যাডমিন প্রাতিষ্ঠানিক নির্দেশ দাখিল করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      subject,
      description,
      priority = "IMPORTANT",
      categoryCode = "GENERAL",
      requestType = "SERVICE_REQUEST",
      relatedEntityType,
      relatedEntityId,
    } = body;

    if (!subject || !subject.trim() || !description || !description.trim()) {
      return NextResponse.json(
        { error: "নির্দেশনার শিরোনাম (Subject) ও বিস্তারিত বিবরণ (Description) আবশ্যক।" },
        { status: 400 }
      );
    }

    // Resolve or fallback to valid category
    const category = await prisma.supportRequestCategory.findFirst({
      where: {
        OR: [{ code: categoryCode }, { code: "GENERAL" }],
      },
    });

    if (!category) {
      return NextResponse.json({ error: "সাপোর্ট ক্যাটাগরি পাওয়া যায়নি।" }, { status: 400 });
    }

    const ticket = await createSupportRequest({
      userId: user.userId,
      role: user.role,
      categoryCode: category.code,
      requestType: requestType === "CORRECTION_REQUEST" ? "CORRECTION_REQUEST" : "SERVICE_REQUEST",
      priority: ["NORMAL", "IMPORTANT", "URGENT"].includes(priority) ? priority : "IMPORTANT",
      subject: subject.trim(),
      description: description.trim(),
      relatedEntityType: relatedEntityType || null,
      relatedEntityId: relatedEntityId || null,
    });

    // Record immutable audit log
    await recordAuditLog({
      userId: user.userId,
      action: "PRINCIPAL_DIRECTIVE_SUBMITTED",
      entityType: "SupportRequest",
      entityId: ticket.id,
      details: {
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        priority: ticket.priority,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "প্রাতিষ্ঠানিক নির্দেশনা সফলভাবে দাখিল হয়েছে এবং অ্যাডমিন অ্যাকশন ট্র্যাকিংয়ে অন্তর্ভুক্ত করা হয়েছে।",
      ticket,
    });
  } catch (error: any) {
    console.error("Principal Issues POST Error:", error);
    return NextResponse.json({ error: error.message || "নির্দেশনা দাখিল ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
