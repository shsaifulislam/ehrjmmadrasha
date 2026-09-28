import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMonthlyTransportInvoiceForStudent } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { enrollmentId, billingMonth } = body;

    if (!billingMonth) {
      return NextResponse.json({ error: "বিলিং মাস (YYYY-MM ফরম্যাটে) প্রদান আবশ্যক।" }, { status: 400 });
    }

    if (enrollmentId) {
      // Single student billing
      const enrollment = await prisma.transportEnrollment.findUnique({
        where: { id: enrollmentId },
      });
      if (!enrollment) {
        return NextResponse.json({ error: "পরিবহন রেকর্ড পাওয়া যায়নি।" }, { status: 404 });
      }
      const result = await generateMonthlyTransportInvoiceForStudent({
        studentId: enrollment.studentId,
        billingMonth,
        adminUserId: user.userId,
      });
      return NextResponse.json({ success: true, result });
    } else {
      // Batch billing for all active enrollments
      const activeEnrollments = await prisma.transportEnrollment.findMany({
        where: { status: "ACTIVE" },
      });

      const results = [];
      const errors = [];

      for (const enrollment of activeEnrollments) {
        try {
          const res = await generateMonthlyTransportInvoiceForStudent({
            studentId: enrollment.studentId,
            billingMonth,
            adminUserId: user.userId,
          });
          results.push(res);
        } catch (err: any) {
          errors.push({ enrollmentId: enrollment.id, error: err.message });
        }
      }

      return NextResponse.json({
        success: true,
        generatedCount: results.length,
        results,
        errors,
      });
    }
  } catch (error: any) {
    console.error("Generate transport invoices error:", error);
    return NextResponse.json(
      { error: error.message || "পরিবহন ইনভয়েস তৈরি করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
