import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  loadAutomationJobs,
  getJobQueueMetrics,
  replayDeadLetterJob,
  cancelJob,
} from "@/lib/workflow";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। অ্যাডমিন বা অধ্যক্ষের অনুমোদন প্রয়োজন।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let jobs = loadAutomationJobs();
    if (status) {
      jobs = jobs.filter((j) => j.status === status);
    }

    const metrics = getJobQueueMetrics();

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        jobs: jobs.reverse(), // latest first
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve automation jobs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন জব নিয়ন্ত্রণ করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, jobId, reason } = body;

    if (!jobId || !action) {
      return NextResponse.json(
        { error: "জব আইডি এবং অ্যাকশন (REPLAY বা CANCEL) আবশ্যক।" },
        { status: 400 }
      );
    }

    if (action === "REPLAY") {
      const replayed = await replayDeadLetterJob(jobId);
      return NextResponse.json({
        success: true,
        message: `জব ${jobId} সফলভাবে পুনরায় এক্সিকিউট করা হয়েছে। বর্তমান স্ট্যাটাস: ${replayed.status}`,
        job: replayed,
      });
    }

    if (action === "CANCEL") {
      const cancelled = cancelJob(jobId, reason);
      return NextResponse.json({
        success: true,
        message: `জব ${jobId} বাতিল (CANCELLED) করা হয়েছে।`,
        job: cancelled,
      });
    }

    return NextResponse.json({ error: "অজানা অ্যাকশন।" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process job action" },
      { status: 400 }
    );
  }
}
