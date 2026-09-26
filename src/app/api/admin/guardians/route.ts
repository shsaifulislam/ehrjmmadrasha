import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query) {
      where.OR = [
        { fullNameBn: { contains: query } },
        { fullNameEn: { contains: query } },
        { phone: { contains: query } },
        { email: { contains: query } },
        { nidNo: { contains: query } },
        {
          students: {
            some: {
              student: {
                fullNameBn: { contains: query },
              },
            },
          },
        },
      ];
    }

    const [total, guardians] = await Promise.all([
      prisma.guardian.count({ where }),
      prisma.guardian.findMany({
        where,
        include: {
          students: {
            include: {
              student: {
                select: {
                  id: true,
                  studentIdNumber: true,
                  fullNameBn: true,
                  gender: true,
                  residentialStatus: true,
                  enrollments: {
                    include: {
                      jamatClass: { select: { nameBn: true } },
                      section: { select: { nameBn: true } },
                    },
                    orderBy: { enrolledAt: "desc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const formatted = guardians.map((g) => ({
      id: g.id,
      fullNameBn: g.fullNameBn,
      fullNameEn: g.fullNameEn,
      relation: g.relation,
      phone: g.phone,
      email: g.email,
      nidNo: g.nidNo,
      occupation: g.occupation,
      address: g.address,
      linkedStudents: g.students.map((gs) => {
        const currentEnrollment = gs.student.enrollments[0];
        return {
          id: gs.student.id,
          studentIdNumber: gs.student.studentIdNumber,
          fullNameBn: gs.student.fullNameBn,
          className: currentEnrollment?.jamatClass?.nameBn || "বরাদ্দহীন",
          sectionName: currentEnrollment?.section?.nameBn || "সাধারণ",
          isPrimary: gs.isPrimary,
        };
      }),
      createdAt: g.createdAt,
    }));

    return NextResponse.json({
      success: true,
      guardians: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET Guardians Error:", error);
    return NextResponse.json({ error: "অভিভাবক তালিকা আনতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন নতুন অভিভাবক যুক্ত করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { fullNameBn, fullNameEn, relation = "FATHER", phone, email, nidNo, occupation, address, studentId } = body;

    if (!fullNameBn || !phone) {
      return NextResponse.json({ error: "অভিভাবকের নাম এবং মোবাইল নম্বর আবশ্যক।" }, { status: 400 });
    }

    const cleanPhone = phone.trim();

    // Check duplicate phone
    const existing = await prisma.guardian.findUnique({
      where: { phone: cleanPhone },
    });
    if (existing) {
      // If studentId provided, link to this student if not already linked
      if (studentId) {
        const link = await prisma.guardianStudent.findUnique({
          where: {
            guardianId_studentId: {
              guardianId: existing.id,
              studentId,
            },
          },
        });
        if (!link) {
          await prisma.guardianStudent.create({
            data: {
              guardianId: existing.id,
              studentId,
              isPrimary: false,
            },
          });
        }
      }
      return NextResponse.json({
        success: true,
        guardian: existing,
        message: "অভিভাবক ইতিমধ্যে বিদ্যমান ছিলেন এবং শিক্ষার্থীর সাথে সংযুক্ত করা হয়েছে।",
      });
    }

    const newGuardian = await prisma.$transaction(async (tx) => {
      const g = await tx.guardian.create({
        data: {
          fullNameBn: fullNameBn.trim(),
          fullNameEn: fullNameEn?.trim() || null,
          relation,
          phone: cleanPhone,
          email: email?.trim() || null,
          nidNo: nidNo?.trim() || null,
          occupation: occupation?.trim() || null,
          address: address?.trim() || null,
        },
      });

      if (studentId) {
        await tx.guardianStudent.create({
          data: {
            guardianId: g.id,
            studentId,
            isPrimary: true,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "CREATE",
          entityType: "Guardian",
          entityId: g.id,
          detailsJson: JSON.stringify({ name: g.fullNameBn, phone: g.phone }),
        },
      });

      return g;
    });

    return NextResponse.json({
      success: true,
      guardian: newGuardian,
      message: "অভিভাবকের তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।",
    });
  } catch (error: any) {
    console.error("POST Guardian Error:", error);
    return NextResponse.json({ error: error.message || "অভিভাবক যোগ করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
