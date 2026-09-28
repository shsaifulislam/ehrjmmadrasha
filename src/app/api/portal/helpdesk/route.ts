import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getGuardianSupportRequests, createSupportRequest, getHelpdeskCategories } from "@/lib/helpdeskEngine";

export const dynamic = "force-dynamic";

async function resolveGuardianProfile(userId: string, username: string) {
  return prisma.guardian.findFirst({
    where: {
      OR: [
        { userId: userId },
        { phone: username },
      ],
    },
    include: {
      students: {
        include: {
          student: true,
        },
      },
    },
  });
}

/**
 * GET /api/portal/helpdesk
 * Fetch requests filed by the authenticated Guardian
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const userId = user.userId;
    const guardian = await resolveGuardianProfile(userId, user.username);
    if (!guardian) {
      return NextResponse.json({ error: "অভিভাবক প্রোফাইল পাওয়া যায়নি।" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || undefined;
    const status = searchParams.get("status") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 15;

    const data = await getGuardianSupportRequests({
      guardianId: guardian.id,
      studentId,
      status,
      page,
      limit,
    });

    const categories = await getHelpdeskCategories();

    return NextResponse.json({
      success: true,
      guardian: {
        id: guardian.id,
        name: guardian.fullNameBn,
        children: guardian.students.map((s) => ({
          id: s.student.id,
          studentIdNumber: s.student.studentIdNumber,
          fullNameBn: s.student.fullNameBn,
        })),
      },
      categories,
      ...data,
    });
  } catch (error: any) {
    console.error("Portal Helpdesk GET error:", error);
    return NextResponse.json(
      { error: error.message || "অনুরোধ তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/helpdesk
 * Submit new support request/complaint from Guardian
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const userId = user.userId;
    const guardian = await resolveGuardianProfile(userId, user.username);
    if (!guardian) {
      return NextResponse.json({ error: "অভিভাবক প্রোফাইল পাওয়া যায়নি।" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.categoryCode || !body.requestType || !body.subject || !body.description) {
      return NextResponse.json(
        { error: "ক্যাটাগরি, আবেদনের ধরন, বিষয় ও বিস্তারিত বিবরণ আবশ্যক।" },
        { status: 400 }
      );
    }

    const ticket = await createSupportRequest({
      userId,
      role: "GUARDIAN",
      guardianId: guardian.id,
      studentId: body.studentId || undefined,
      categoryCode: body.categoryCode,
      requestType: body.requestType,
      priority: body.priority,
      subject: body.subject,
      description: body.description,
      relatedEntityType: body.relatedEntityType,
      relatedEntityId: body.relatedEntityId,
      attachments: body.attachments,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("Portal Helpdesk POST error:", error);
    return NextResponse.json(
      { error: error.message || "অনুরোধ দাখিল করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
