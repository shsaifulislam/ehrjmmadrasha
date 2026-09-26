import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: { publishedAt: "desc" },
    });
    return NextResponse.json({ success: true, notices });
  } catch (error: any) {
    console.error("Admin Notices GET Error:", error);
    return NextResponse.json({ error: "নোটিশ লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { titleBn, contentBn, category, isUrgent } = await req.json();

    if (!titleBn || !contentBn) {
      return NextResponse.json(
        { error: "নোটিশের শিরোনাম ও বিস্তারিত বিবরণ প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const notice = await prisma.notice.create({
      data: {
        titleBn,
        contentBn,
        category: category || "GENERAL",
        isUrgent: Boolean(isUrgent),
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "CREATE_NOTICE",
      entityType: "Notice",
      entityId: notice.id,
      details: { titleBn, category },
    });

    return NextResponse.json({
      success: true,
      message: "নতুন নোটিশ সফলভাবে ওয়েবসাইটে প্রকাশিত হয়েছে।",
      notice,
    });
  } catch (error: any) {
    console.error("Admin Notices POST Error:", error);
    return NextResponse.json({ error: "নোটিশ প্রকাশে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "নোটিশ আইডি আবশ্যক।" }, { status: 400 });
    }

    await prisma.notice.delete({
      where: { id },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "DELETE_NOTICE",
      entityType: "Notice",
      entityId: id,
    });

    return NextResponse.json({ success: true, message: "নোটিশটি সফলভাবে অপসারিত হয়েছে।" });
  } catch (error: any) {
    console.error("Admin Notices DELETE Error:", error);
    return NextResponse.json({ error: "নোটিশ মুছতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
