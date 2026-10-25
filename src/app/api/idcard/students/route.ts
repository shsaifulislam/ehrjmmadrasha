import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { INSTITUTION_INFO } from "@/lib/constants";

export const dynamic = "force-dynamic";

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  );
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const studentId = searchParams.get("studentId");
    const search = searchParams.get("q")?.trim();

    // If Guardian, only allow their own children
    let guardianStudentIds: string[] | null = null;
    if (user.role === "GUARDIAN") {
      const guardian = await prisma.guardian.findFirst({
        where: { userId: user.userId },
        include: { students: true },
      });
      if (!guardian || guardian.students.length === 0) {
        return NextResponse.json({ success: true, data: { students: [], classes: [] } });
      }
      guardianStudentIds = guardian.students.map((s) => s.studentId);
    }

    const whereClause: any = {
      status: "ACTIVE",
    };

    if (guardianStudentIds) {
      whereClause.id = { in: guardianStudentIds };
    } else if (studentId) {
      whereClause.id = studentId;
    }

    if (search) {
      whereClause.OR = [
        { fullNameBn: { contains: search } },
        { fullNameEn: { contains: search } },
        { studentIdNumber: { contains: search } },
      ];
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        enrollments: {
          where: {
            status: "ACTIVE",
            ...(classId ? { classId } : {}),
            ...(sectionId ? { sectionId } : {}),
          },
          include: {
            jamatClass: true,
            section: true,
            session: true,
          },
          orderBy: { enrolledAt: "desc" },
          take: 1,
        },
        guardianLinks: {
          include: { guardian: true },
          take: 1,
        },
      },
      take: studentId ? 1 : 100,
      orderBy: { studentIdNumber: "asc" },
    });

    const baseUrl = getBaseUrl();

    // Prepare card details and QR codes in parallel
    const cardStudents = await Promise.all(
      students.map(async (st) => {
        const en = st.enrollments[0];
        const primaryGuardian = st.guardianLinks[0]?.guardian;

        const verifyUrl = `${baseUrl}/verify/student/${st.id}`;
        const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 200,
          color: {
            dark: "#0D5C3A", // Institutional Emerald
            light: "#FFFFFF",
          },
        });

        return {
          id: st.id,
          studentIdNumber: st.studentIdNumber,
          fullNameBn: st.fullNameBn,
          fullNameEn: st.fullNameEn,
          dateOfBirth: st.dateOfBirth.toISOString().split("T")[0],
          bloodGroup: st.bloodGroup || "O+",
          residentialStatus: st.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক",
          photoUrl: st.photoUrl,
          fatherNameBn: st.fatherNameBn,
          fatherPhone: st.fatherPhone || primaryGuardian?.phone || "০১৭০০০০০০০০",
          presentAddress: st.presentAddress || "ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
          className: en?.jamatClass?.nameBn || "তাহফীজুল কুরআন",
          classCode: en?.jamatClass?.code || "HIFZ",
          sectionName: en?.section?.nameBn || "ক শাখা",
          rollNumber: en?.rollNumber || 1,
          sessionName: en?.session?.name || "২০২৬",
          expiryDate: "৩১ ডিসেম্বর ২০২৬",
          qrCodeDataUrl,
          verifyUrl,
        };
      })
    );

    // Fetch classes list for filtering
    const classes = await prisma.jamatClass.findMany({
      select: { id: true, nameBn: true, code: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        students: cardStudents,
        classes,
        institution: {
          nameBn: INSTITUTION_INFO.nameBn,
          nameEn: INSTITUTION_INFO.nameEn,
          establishedYear: "২০২১ ইং", // Strictly 2021
          address: "ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
          phone: "০১৭১১-২২৩৩৪৪",
          email: "info@ehrj.edu.bd",
        },
      },
    });
  } catch (error: any) {
    console.error("ID Card Generation Error:", error);
    return NextResponse.json({ error: "আইডি কার্ড তথ্য লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
