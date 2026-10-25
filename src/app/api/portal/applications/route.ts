import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/applications
 * Returns all admission applications submitted by or linked to the authenticated Guardian.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    // 1. Find user details and linked guardian record
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { phone: true, email: true },
    });

    const guardian = await prisma.guardian.findFirst({
      where: {
        OR: [
          { userId: user.userId },
          ...(dbUser?.phone ? [{ phone: dbUser.phone }] : []),
          ...(dbUser?.email ? [{ email: dbUser.email }] : []),
        ],
      },
    });

    const searchPhones: string[] = [];
    if (dbUser?.phone) searchPhones.push(dbUser.phone);
    if (guardian?.phone && !searchPhones.includes(guardian.phone)) searchPhones.push(guardian.phone);

    const searchEmails: string[] = [];
    if (dbUser?.email) searchEmails.push(dbUser.email);
    if (guardian?.email && !searchEmails.includes(guardian.email)) searchEmails.push(guardian.email);

    // 2. Fetch applications matching phone or email
    const orConditions: any[] = [];
    searchPhones.forEach((p) => orConditions.push({ guardianPhone: p }));
    searchEmails.forEach((e) => orConditions.push({ guardianEmail: e }));

    if (orConditions.length === 0) {
      return NextResponse.json({ success: true, applications: [] });
    }

    const applications = await prisma.application.findMany({
      where: { OR: orConditions },
      orderBy: { submittedAt: "desc" },
    });

    // 3. Enrich with Class names and Session names
    const classIds = Array.from(new Set(applications.map((a) => a.desiredClassId).filter(Boolean)));
    const sessionIds = Array.from(new Set(applications.map((a) => a.sessionId).filter(Boolean))) as string[];

    const [classes, sessions] = await Promise.all([
      prisma.jamatClass.findMany({
        where: { id: { in: classIds } },
        select: { id: true, nameBn: true, nameEn: true },
      }),
      prisma.academicSession.findMany({
        where: { id: { in: sessionIds } },
        select: { id: true, name: true },
      }),
    ]);

    const classMap = new Map(classes.map((c) => [c.id, c.nameBn]));
    const sessionMap = new Map(sessions.map((s) => [s.id, s.name]));

    const formattedApplications = applications.map((app) => ({
      id: app.id,
      applicationNumber: app.applicationNumber,
      studentNameBn: app.studentNameBn,
      studentNameEn: app.studentNameEn,
      className: classMap.get(app.desiredClassId) || "সাধারণ জামাত",
      sessionName: (app.sessionId && sessionMap.get(app.sessionId)) || "২০২৬ সেশন",
      desiredResidentialStatus: app.desiredResidentialStatus,
      status: app.status,
      verificationStatus: app.verificationStatus,
      submittedAt: app.submittedAt,
      examInterviewScheduledAt: app.examInterviewScheduledAt,
      examInterviewResult: app.examInterviewResult,
      reviewNotes: app.reviewNotes,
      remarks: app.remarks,
    }));

    return NextResponse.json({
      success: true,
      applications: formattedApplications,
    });
  } catch (error: any) {
    console.error("GET /api/portal/applications error:", error);
    return NextResponse.json(
      { error: "আবেদন তালিকা লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
