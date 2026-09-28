import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSecurityEvents } from "@/lib/securityEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন প্রবেশের অধিকার রয়েছে।" },
        { status: 403 }
      );
    }

    // 1. Count active sessions
    const activeSessionsCount = await prisma.session.count({
      where: { expiresAt: { gt: new Date() } },
    });

    // 2. Count locked & suspended accounts
    const lockedAccountsCount = await prisma.user.count({
      where: { status: "LOCKED" },
    });
    const suspendedAccountsCount = await prisma.user.count({
      where: { status: "SUSPENDED" },
    });

    // 3. Count open incidents
    const openIncidentsCount = await prisma.systemIncident.count({
      where: { status: { in: ["OPEN", "INVESTIGATING", "CONTAINED"] } },
    });

    // 4. Retrieve recent security events
    const recentEvents = getSecurityEvents({ limit: 15 });
    const highRiskEventsCount = recentEvents.filter(
      (e) => e.severity === "HIGH" || e.severity === "CRITICAL"
    ).length;

    // 5. Active operational alerts
    const activeAlerts = await prisma.operationalAlert.findMany({
      where: { status: "ACTIVE" },
      orderBy: { id: "desc" },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          activeSessions: activeSessionsCount,
          lockedAccounts: lockedAccountsCount,
          suspendedAccounts: suspendedAccountsCount,
          openIncidents: openIncidentsCount,
          recentHighRiskEvents: highRiskEventsCount,
        },
        recentEvents,
        activeAlerts,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Security Overview API Error:", error);
    return NextResponse.json(
      { error: "নিরাপত্তা ড্যাশবোর্ড ডেটা লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
