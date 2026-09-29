import { NextResponse } from "next/server";
import { getHomepageConfig } from "@/lib/cms";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getHomepageConfig();
    const currentSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });

    return NextResponse.json({
      success: true,
      admissionState: config.admissionState,
      announcementBn: config.admissionAnnouncementBn,
      sessionName: currentSession?.name || "২০২৫-২০২৬",
      sessionId: currentSession?.id || null,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error("Admission Status API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load admission status" },
      { status: 500 }
    );
  }
}
