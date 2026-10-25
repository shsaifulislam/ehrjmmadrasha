import { NextRequest, NextResponse } from "next/server";
import {
  getEventResults,
  recordCompetitionResult,
  publishEventResults,
  getEventById,
} from "@/lib/events";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const event = getEventById(params.id);
    if (!event) {
      return NextResponse.json({ success: false, error: "ইভেন্টটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "PUBLIC";
    const publicOnly = role === "PUBLIC";

    const results = getEventResults(params.id, publicOnly);

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error("[API /api/events/[id]/results] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load results" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || !["ADMIN", "PRINCIPAL", "TEACHER"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত: শুধুমাত্র শিক্ষক ও প্রশাসন ফলাফল এন্ট্রি করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const actorRole = user.role;
    const actorId = user.email || user.username || user.userId;

    // 1. If publish all action
    if (body.action === "PUBLISH_ALL") {
      if (!["ADMIN", "PRINCIPAL"].includes(user.role)) {
        return NextResponse.json(
          { success: false, error: "অননুমোদিত: ফলাফল চূড়ান্ত প্রকাশের ক্ষমতা শুধুমাত্র প্রশাসনের রয়েছে।" },
          { status: 403 }
        );
      }
      const pubResult = publishEventResults(params.id, actorId, actorRole);
      if (!pubResult.success) {
        return NextResponse.json({ success: false, error: pubResult.error }, { status: 403 });
      }
      return NextResponse.json({
        success: true,
        message: `${pubResult.count} টি ফলাফল আনুষ্ঠানিকভাবে প্রকাশিত হয়েছে।`,
      });
    }

    // 2. Record individual result
    if (!body.studentId || !body.competitionCategory) {
      return NextResponse.json(
        { success: false, error: "শিক্ষার্থী আইডি এবং প্রতিযোগিতার বিভাগ আবশ্যক।" },
        { status: 400 }
      );
    }

    const res = await recordCompetitionResult({
      eventId: params.id,
      studentId: body.studentId,
      competitionCategory: body.competitionCategory,
      score: body.score !== undefined ? Number(body.score) : undefined,
      maxScore: body.maxScore ? Number(body.maxScore) : 100,
      rank: body.rank ? Number(body.rank) : undefined,
      awardType: body.awardType,
      judgeName: body.judgeName,
      judgeCommentsBn: body.judgeCommentsBn,
      isPublished: Boolean(body.isPublished),
      evaluatedByUserId: actorId,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: res.result }, { status: 201 });
  } catch (error: any) {
    console.error("[API /api/events/[id]/results] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save result" },
      { status: 500 }
    );
  }
}
