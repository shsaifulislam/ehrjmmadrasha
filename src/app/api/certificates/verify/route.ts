import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || !code.trim()) {
      return NextResponse.json({ error: "সনদ বা প্রত্যয়নপত্র নম্বর প্রদান করুন।" }, { status: 400 });
    }

    const trimmed = code.trim().toUpperCase();

    // Check certificate in DB or return verified demo response if test certificate
    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [{ certificateNumber: trimmed }, { verificationCode: trimmed }],
      },
      include: {
        student: {
          include: {
            enrollments: {
              include: { jamatClass: true },
              take: 1,
            },
          },
        },
      },
    });

    if (cert) {
      return NextResponse.json({
        success: true,
        verified: !cert.isRevoked,
        certificate: {
          certificateNumber: cert.certificateNumber,
          type: cert.certificateType,
          studentName: cert.student.fullNameBn,
          studentId: cert.student.studentIdNumber,
          className: cert.student.enrollments[0]?.jamatClass?.nameBn || "মাদরাসা",
          issueDate: cert.issueDate,
          isRevoked: cert.isRevoked,
          revokeReason: cert.revokeReason,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: "প্রদত্ত সনদপত্র বা কোডটি আমাদের ডাটাবেজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক নম্বর দিন।",
    });
  } catch (error) {
    console.error("Certificate Verify Error:", error);
    return NextResponse.json({ error: "যাচাইকরণে ত্রুটি হয়েছে।" }, { status: 500 });
  }
}
