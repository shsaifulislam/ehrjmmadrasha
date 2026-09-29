import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAllProjects, saveProject, recordBudgetAudit, BudgetProject } from "@/lib/budget";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const projects = getAllProjects();
    return NextResponse.json({
      success: true,
      total: projects.length,
      projects,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.nameBn || !body.fundCode || !body.approvedBudget || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { success: false, error: "প্রকল্পের নাম, ফান্ড, অনুমোদিত বরাদ্দ এবং তারিখ আবশ্যক।" },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const projectId = body.id || `EHRJ-BPRJ-${year}-${Math.floor(100 + Math.random() * 900)}`;

    const project: BudgetProject = {
      id: projectId,
      projectCode: body.projectCode || `PRJ-${year}-${Math.floor(10 + Math.random() * 90)}`,
      nameBn: body.nameBn,
      nameEn: body.nameEn || body.nameBn,
      descriptionBn: body.descriptionBn || "",
      fundCode: body.fundCode,
      fundNameBn: body.fundNameBn || body.fundCode,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status || "PLANNED",
      approvedBudget: body.approvedBudget,
      revisedBudget: body.revisedBudget || body.approvedBudget,
      actualExpense: body.actualExpense || 0,
      committedAmount: body.committedAmount || 0,
      remainingBudget: (body.revisedBudget || body.approvedBudget) - ((body.actualExpense || 0) + (body.committedAmount || 0)),
      utilizationRate: (body.revisedBudget || body.approvedBudget) > 0
        ? Math.round((((body.actualExpense || 0) + (body.committedAmount || 0)) / (body.revisedBudget || body.approvedBudget)) * 1000) / 10
        : 0,
      projectManagerName: body.projectManagerName || user.username || "প্রকল্প ইনচার্জ",
      contractorVendorName: body.contractorVendorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProject(project);

    recordBudgetAudit({
      budgetId: project.id,
      action: "CREATE_PROJECT",
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
      notes: `প্রাতিষ্ঠানিক উন্নয়ন প্রকল্প তৈরি: ${project.nameBn} (বরাদ্দ ৳${project.approvedBudget})`,
      details: { projectId: project.id, fundCode: project.fundCode },
    });

    return NextResponse.json({
      success: true,
      message: "প্রকল্প বাজেট সফলভাবে সংরক্ষিত হয়েছে।",
      project,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save project" },
      { status: 500 }
    );
  }
}
