import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  getCommunicationCampaignById,
  saveCommunicationCampaign,
  previewCampaign,
  recordCommunicationAudit,
} from "@/lib/communications";

export async function GET(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const auth = await requireAdminAuth(_req);
    if (!auth.authorized) return auth.response;

    const campaign = getCommunicationCampaignById(params.id);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    const preview = await previewCampaign(params.id);

    return NextResponse.json({ success: true, campaign, preview });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const campaign = getCommunicationCampaignById(params.id);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.status === "SENT") {
      return NextResponse.json(
        { success: false, error: "Cannot modify a completed campaign" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updated = {
      ...campaign,
      ...body,
      id: campaign.id, // Immutable ID
      status: campaign.status === "APPROVED" ? "DRAFT" : campaign.status, // Re-approval required if modified
    };

    saveCommunicationCampaign(updated);

    recordCommunicationAudit({
      actorId: body.actorId || "ADMIN",
      actorRole: "ADMIN",
      action: "UPDATE_CAMPAIGN",
      campaignId: campaign.id,
      details: { updatedFields: Object.keys(body) },
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const campaign = getCommunicationCampaignById(params.id);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    campaign.status = "ARCHIVED";
    saveCommunicationCampaign(campaign);

    recordCommunicationAudit({
      actorId: "ADMIN",
      actorRole: "ADMIN",
      action: "ARCHIVE_CAMPAIGN",
      campaignId: campaign.id,
      details: { previousStatus: campaign.status },
    });

    return NextResponse.json({ success: true, message: "Campaign archived." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
