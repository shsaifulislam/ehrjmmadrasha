import { NextRequest, NextResponse } from "next/server";
import {
  getEvents,
  getRegistrations,
  getCompetitionResults,
  getCertificateLinks,
  evaluateStudentEligibility,
} from "@/lib/events";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guardianPhone = searchParams.get("phone");
    const guardianId = searchParams.get("guardianId");
    const studentIdParam = searchParams.get("studentId");

    if (!guardianPhone && !guardianId && !studentIdParam) {
      return NextResponse.json(
        { success: false, error: "অভিভাবকের ফোন নম্বর বা আইডি আবশ্যক।" },
        { status: 400 }
      );
    }

    // 1. Resolve Guardians and Linked Children
    let guardian = null;
    if (guardianId) {
      guardian = await prisma.guardian.findUnique({
        where: { id: guardianId },
        include: {
          students: {
            include: {
              student: {
                include: {
                  enrollments: {
                    include: { jamatClass: true, section: true, session: true },
                    orderBy: { enrolledAt: "desc" },
                  },
                },
              },
            },
          },
        },
      });
    } else if (guardianPhone) {
      guardian = await prisma.guardian.findFirst({
        where: { phone: guardianPhone },
        include: {
          students: {
            include: {
              student: {
                include: {
                  enrollments: {
                    include: { jamatClass: true, section: true, session: true },
                    orderBy: { enrolledAt: "desc" },
                  },
                },
              },
            },
          },
        },
      });
    }

    // If querying directly by studentId with guardian phone verification
    let linkedStudents: any[] = [];
    if (guardian && guardian.students) {
      linkedStudents = guardian.students.map((l) => l.student);
    } else if (studentIdParam) {
      const singleStudent = await prisma.student.findUnique({
        where: { id: studentIdParam },
        include: {
          enrollments: {
            include: { jamatClass: true, section: true, session: true },
            orderBy: { enrolledAt: "desc" },
          },
        },
      });
      if (singleStudent) linkedStudents = [singleStudent];
    }

    if (linkedStudents.length === 0) {
      return NextResponse.json({
        success: true,
        guardian: guardian ? { id: guardian.id, nameBn: guardian.fullNameBn, phone: guardian.phone } : null,
        children: [],
      });
    }

    const allEvents = getEvents().filter(
      (e) => !["DRAFT", "ARCHIVED", "CANCELLED"].includes(e.status)
    );
    const allRegistrations = getRegistrations();
    const allResults = getCompetitionResults().filter((r) => r.isPublished);
    const allCerts = getCertificateLinks().filter((c) => !c.isRevoked);

    const childrenData = await Promise.all(
      linkedStudents.map(async (student) => {
        const studentRegistrations = allRegistrations.filter((r) => r.studentId === student.id);
        const studentResults = allResults.filter((r) => r.studentId === student.id);
        const studentCerts = allCerts.filter((c) => c.studentId === student.id);

        // Check eligibility for each active event
        const eligibleEvents = await Promise.all(
          allEvents.map(async (event) => {
            const eligibility = await evaluateStudentEligibility(event, student.id);
            const isRegistered = studentRegistrations.some(
              (r) => r.eventId === event.id && r.status !== "CANCELLED"
            );
            return {
              event,
              isEligible: eligibility.isEligible,
              ineligibilityReason: eligibility.reasonBn,
              isRegistered,
              registration: studentRegistrations.find((r) => r.eventId === event.id),
            };
          })
        );

        return {
          student: {
            id: student.id,
            studentIdNumber: student.studentIdNumber,
            fullNameBn: student.fullNameBn,
            gender: student.gender,
            residentialStatus: student.residentialStatus,
            classNameBn: student.enrollments?.[0]?.jamatClass?.nameBn || "সাধারণ",
            sectionNameBn: student.enrollments?.[0]?.section?.nameBn || "ক",
            rollNumber: student.enrollments?.[0]?.rollNumber,
          },
          events: eligibleEvents,
          registrations: studentRegistrations,
          achievements: studentResults,
          certificates: studentCerts,
        };
      })
    );

    return NextResponse.json({
      success: true,
      guardian: guardian ? { id: guardian.id, nameBn: guardian.fullNameBn, phone: guardian.phone } : null,
      children: childrenData,
    });
  } catch (error: any) {
    console.error("[API /api/portal/events] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load portal events" },
      { status: 500 }
    );
  }
}
