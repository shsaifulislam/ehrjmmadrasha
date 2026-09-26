import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INSTITUTION_INFO } from "@/lib/constants";

/**
 * GET /api/verify/document/[token]
 * Public Privacy-Safe Document & Certificate Verification Endpoint
 */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const rawToken = params?.token;
    if (!rawToken || !rawToken.trim()) {
      return NextResponse.json({ error: "ভেরিফিকেশন কোড বা প্রত্যয়ন নম্বর আবশ্যক।" }, { status: 400 });
    }

    const token = decodeURIComponent(rawToken.trim().toUpperCase());

    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [
          { verificationCode: token },
          { certificateNumber: token },
        ],
      },
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            fullNameEn: true,
            gender: true,
          },
        },
        session: {
          select: { name: true },
        },
        template: {
          select: { nameBn: true, titleBn: true, documentType: true },
        },
      },
    });

    if (!cert) {
      return NextResponse.json(
        {
          verified: false,
          error: "প্রদত্ত কোড বা নম্বরে কোনো সনদপত্র পাওয়া যায়নি। এটি অবৈধ বা অনিবন্ধিত হতে পারে।",
        },
        { status: 404 }
      );
    }

    let parsedSnapshot: any = null;
    if (cert.snapshotJson) {
      try {
        parsedSnapshot = JSON.parse(cert.snapshotJson);
      } catch (e) {
        // Fallback
      }
    }

    // Return strictly privacy-safe verification data
    return NextResponse.json({
      success: true,
      verified: !cert.isRevoked,
      document: {
        certificateNumber: cert.certificateNumber,
        verificationCode: cert.verificationCode,
        documentType: cert.certificateType,
        titleBn: cert.titleBn || cert.template?.titleBn || "অফিশিয়াল প্রত্যয়নপত্র",
        titleEn: cert.titleEn || cert.template?.nameBn || "Official Certificate",
        studentName: cert.student.fullNameBn,
        studentId: cert.student.studentIdNumber,
        className: parsedSnapshot?.class?.name || "জামাতভুক্ত",
        sessionName: cert.session?.name || parsedSnapshot?.session?.name || "বর্তমান শিক্ষাবর্ষ",
        issueDate: cert.issueDate,
        version: cert.version,
        isRevoked: cert.isRevoked,
        status: cert.isRevoked ? "REVOKED" : "VALID",
        revocationNotice: cert.isRevoked ? "সতর্কতা: এই সনদপত্রটি মাদরাসা কর্তৃপক্ষ কর্তৃক আনুষ্ঠানিকভাবে বাতিল (REVOKED) করা হয়েছে।" : null,
        institution: {
          nameBn: INSTITUTION_INFO.nameBn,
          nameEn: INSTITUTION_INFO.nameEn,
          address: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
          principal: INSTITUTION_INFO.principal,
        },
      },
    });
  } catch (error: any) {
    console.error("Public Document Verification error:", error);
    return NextResponse.json({ error: "যাচাইকরণ প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি।" }, { status: 500 });
  }
}
