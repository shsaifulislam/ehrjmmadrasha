import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

/**
 * GET /api/admin/documents/[id]
 * Get full document details, parsed data snapshot, and history
 */
export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { id } = params;

    const cert = await prisma.certificate.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            enrollments: {
              include: { jamatClass: true, section: true, session: true },
              orderBy: { enrolledAt: "desc" },
            },
            guardianLinks: { include: { guardian: true } },
          },
        },
        session: true,
        template: true,
        issuedByUser: { select: { id: true, name: true, role: true } },
        revokedByUser: { select: { id: true, name: true, role: true } },
        reissuedFrom: {
          select: {
            id: true,
            certificateNumber: true,
            version: true,
            status: true,
            issueDate: true,
          },
        },
        reissues: {
          select: {
            id: true,
            certificateNumber: true,
            version: true,
            status: true,
            issueDate: true,
          },
        },
      },
    });

    if (!cert) {
      return NextResponse.json({ error: "প্রত্যয়নপত্রটি পাওয়া যায়নি।" }, { status: 404 });
    }

    let parsedSnapshot = null;
    if (cert.snapshotJson) {
      try {
        parsedSnapshot = JSON.parse(cert.snapshotJson);
      } catch (e) {
        console.error("Failed to parse snapshotJson:", e);
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        ...cert,
        parsedSnapshot,
      },
    });
  } catch (error: any) {
    console.error("Admin Document Detail GET error:", error);
    return NextResponse.json({ error: "প্রত্যয়নপত্রের বিস্তারিত লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}
