import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getSanitizedAlumniDirectory,
  getAlumniProfiles,
  registerAlumniProfile,
  getAlumniStats,
} from "@/lib/alumni";

export const dynamic = "force-dynamic";

/**
 * GET /api/alumni
 * Public and administrative alumni directory endpoint.
 * Returns privacy-sanitized results for public/standard users.
 * Supports filtering by year, department, profession, city, and text search.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const passOutYear = searchParams.get("passOutYear") ? parseInt(searchParams.get("passOutYear")!) : undefined;
    const department = searchParams.get("department") || undefined;
    const currentCity = searchParams.get("currentCity") || undefined;
    const currentProfession = searchParams.get("currentProfession") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;
    const includeStats = searchParams.get("stats") === "true";

    // Optional admin view
    const session = await getSessionUser();
    const isAdmin = session?.role === "ADMIN" || session?.role === "PRINCIPAL" || session?.role === "STAFF";
    const viewRaw = searchParams.get("view") === "admin" && isAdmin;

    if (viewRaw) {
      const all = getAlumniProfiles();
      const filtered = all.filter((p) => {
        if (passOutYear && p.passOutYear !== passOutYear) return false;
        if (department && p.department !== department) return false;
        if (currentCity && !p.currentCity?.toLowerCase().includes(currentCity.toLowerCase())) return false;
        if (currentProfession && !p.currentProfession?.toLowerCase().includes(currentProfession.toLowerCase())) return false;
        if (search) {
          const s = search.toLowerCase();
          return (
            p.fullNameBn.toLowerCase().includes(s) ||
            (p.fullNameEn && p.fullNameEn.toLowerCase().includes(s)) ||
            (p.studentId && p.studentId.toLowerCase().includes(s)) ||
            (p.currentOrganization && p.currentOrganization.toLowerCase().includes(s))
          );
        }
        return true;
      });

      const total = filtered.length;
      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + limit);

      return NextResponse.json({
        success: true,
        data: paginated,
        total,
        page,
        limit,
        stats: includeStats ? getAlumniStats() : undefined,
      });
    }

    // Public / privacy-sanitized directory
    const result = getSanitizedAlumniDirectory(
      {
        search,
        passOutYear,
        department,
        currentCity,
        currentProfession,
      },
      page,
      limit
    );

    return NextResponse.json({
      success: true,
      ...result,
      stats: includeStats ? getAlumniStats() : undefined,
    });
  } catch (error: any) {
    console.error("[API /api/alumni] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve alumni directory" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alumni
 * Register an alumni profile (self-registration or admin entry).
 * Status starts as PENDING_VERIFICATION unless verified by admin directly.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const body = await request.json();

    const {
      studentId,
      fullNameBn,
      fullNameEn,
      passOutYear,
      department,
      enrollmentId,
      phone,
      email,
      currentProfession,
      currentOrganization,
      currentCity,
      currentCountry,
      bioBn,
      bioEn,
      skills,
      socialLinks,
      privacyPreferences,
      isLegacy,
      legacySourceNote,
    } = body;

    if (!studentId || !fullNameBn || !fullNameEn || !passOutYear) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: studentId, fullNameBn, fullNameEn, passOutYear are mandatory.",
        },
        { status: 400 }
      );
    }

    const registered = await registerAlumniProfile(
      {
        studentId,
        fullNameBn,
        fullNameEn,
        passOutYear,
        department: department || "General / Dakhil",
        enrollmentId,
        phone,
        email,
        currentProfession,
        currentOrganization,
        currentCity,
        currentCountry,
        bioBn,
        bioEn,
        skills,
        socialLinks,
        privacyPreferences,
        isLegacy: isLegacy || false,
        legacySourceNote,
      },
      session?.userId || "ANONYMOUS_SELF_REG"
    );

    return NextResponse.json({
      success: true,
      data: registered,
      message: "Alumni profile submitted successfully. Pending institutional verification.",
    });
  } catch (error: any) {
    console.error("[API /api/alumni] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register alumni profile" },
      { status: 400 }
    );
  }
}
