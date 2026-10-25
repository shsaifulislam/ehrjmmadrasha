import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INSTITUTION_INFO } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "আইডি আবশ্যক।" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            jamatClass: true,
            section: true,
            session: true,
          },
          take: 1,
        },
      },
    });

    if (!student) {
      return NextResponse.json({
        verified: false,
        message: "শিক্ষার্থীর কোনো বৈধ রেকর্ড পাওয়া যায়নি।",
      }, { status: 404 });
    }

    const en = student.enrollments[0];

    return NextResponse.json({
      verified: true,
      institution: {
        nameBn: INSTITUTION_INFO.nameBn,
        nameEn: INSTITUTION_INFO.nameEn,
        establishedYear: "২০২১ ইং", // Strictly 2021
      },
      student: {
        studentIdNumber: student.studentIdNumber,
        fullNameBn: student.fullNameBn,
        fullNameEn: student.fullNameEn,
        className: en?.jamatClass?.nameBn || "তাহফীজুল কুরআন",
        sectionName: en?.section?.nameBn || "ক",
        rollNumber: en?.rollNumber || 1,
        sessionName: en?.session?.name || "২০২৬",
        residentialStatus: student.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক",
        bloodGroup: student.bloodGroup || "O+",
        status: student.status === "ACTIVE" ? "নিয়মিত শিক্ষার্থী" : student.status,
        validTill: "৩১ ডিসেম্বর ২০২৬",
      },
    });
  } catch (error: any) {
    console.error("Student Verification Error:", error);
    return NextResponse.json({ error: "যাচাইকরণ প্রক্রিয়ায় ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}
