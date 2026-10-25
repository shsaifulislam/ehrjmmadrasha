import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    // RBAC & IDOR check: ADMIN and PRINCIPAL permitted; GUARDIAN must be linked; others forbidden
    if (user.role !== "ADMIN" && user.role !== "PRINCIPAL") {
      if (user.role === "GUARDIAN") {
        const isLinked = await prisma.guardianStudent.findFirst({
          where: {
            studentId: params.id,
            guardian: { OR: [{ userId: user.userId }, { phone: user.username }] },
          },
        });
        if (!isLinked) {
          return NextResponse.json(
            { error: "নিরাপত্তা সতর্কতা: অননুমোদিত ছাত্রের ডকুমেন্ট দেখার অনুমতি নেই।" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
      }
    }

    const documents = await prisma.studentDocument.findMany({
      where: { studentId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    return NextResponse.json({ error: "ডকুমেন্টস তালিকা আনতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { documentType, fileUrl, fileName, fileSize, mimeType, verificationStatus = "VERIFIED" } = body;

    if (!documentType || !fileUrl || !fileName) {
      return NextResponse.json(
        { error: "ডকুমেন্টের ধরণ, ফাইলের নাম ও লিংক আবশ্যক।" },
        { status: 400 }
      );
    }

    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.studentDocument.create({
        data: {
          studentId: params.id,
          documentType,
          fileUrl,
          fileName,
          fileSize: fileSize ? Number(fileSize) : null,
          mimeType: mimeType || null,
          verificationStatus,
          verifiedAt: verificationStatus === "VERIFIED" ? new Date() : null,
          uploadedByUserId: user.userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "CREATE",
          entityType: "StudentDocument",
          entityId: doc.id,
          detailsJson: JSON.stringify({ studentId: params.id, docType: documentType, fileName }),
        },
      });

      return doc;
    });

    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    console.error("POST Student Document Error:", error);
    return NextResponse.json({ error: error.message || "ডকুমেন্ট যুক্ত করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
