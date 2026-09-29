import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { executeGlobalSearch, executeAISearch, getPermittedCommands } from "@/lib/search";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/global-search
 * RBAC-governed universal search across all ERP modules
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "ALL";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const isAiMode = searchParams.get("ai") === "true";

    const sessionUser = await getSessionUser();
    const userRole = (sessionUser?.role as any) || "PUBLIC";

    // Resolve guardian linked student IDs if user is a GUARDIAN
    let linkedStudentIds: string[] = [];
    let guardianId: string | undefined;

    if (userRole === "GUARDIAN" && sessionUser) {
      const guardian = await prisma.guardian.findFirst({
        where: {
          OR: [
            { userId: sessionUser.userId },
            { phone: sessionUser.username },
          ],
        },
        include: { students: true },
      });
      if (guardian) {
        guardianId = guardian.id;
        linkedStudentIds = guardian.students.map((gs) => gs.studentId);
      }
    }

    const userContext = {
      userId: sessionUser?.userId,
      role: userRole,
      guardianId,
      linkedStudentIds,
    };

    if (isAiMode && q.length > 2) {
      const aiResults = await executeAISearch(q, userContext);
      return NextResponse.json({
        success: true,
        ...aiResults,
      });
    }

    const results = await executeGlobalSearch({
      term: q,
      filters: {
        entityType: type as any,
        limit,
      },
      user: userContext,
    });

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error("GET /api/global-search error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "অনুসন্ধান ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
