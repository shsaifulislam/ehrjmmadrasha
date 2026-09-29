import { NextRequest, NextResponse } from "next/server";
import {
  getCommunicationCampaigns,
  createCampaign,
} from "@/lib/communications";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    let campaigns = getCommunicationCampaigns();

    if (status && status !== "ALL") {
      campaigns = campaigns.filter((c) => c.status === status);
    }

    return NextResponse.json({ success: true, count: campaigns.length, campaigns });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.subject || !body.body || !body.audienceType) {
      return NextResponse.json(
        { success: false, error: "Title, Subject, Body, and Audience Type are required." },
        { status: 400 }
      );
    }

    const campaign = await createCampaign({
      title: body.title,
      objective: body.objective || "সাধারণ প্রাতিষ্ঠানিক যোগাযোগ",
      communicationType: body.communicationType || "OFFICIAL_NOTICE",
      channels: body.channels || ["PORTAL", "EMAIL"],
      audienceType: body.audienceType,
      audienceFilter: body.audienceFilter,
      templateCode: body.templateCode,
      subject: body.subject,
      body: body.body,
      variables: body.variables,
      actionUrl: body.actionUrl,
      publicCmsNoticeId: body.publicCmsNoticeId,
      priority: body.priority,
      scheduledAt: body.scheduledAt,
      createdBy: body.actorId || "ADMIN",
    });

    return NextResponse.json({ success: true, campaign });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
