import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getEmployees, createEmployee } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const employeeType = searchParams.get("employeeType") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const designationId = searchParams.get("designationId") || undefined;
    const status = searchParams.get("status") || undefined;
    const hasUserAccountParam = searchParams.get("hasUserAccount");
    const hasUserAccount = hasUserAccountParam !== null ? hasUserAccountParam === "true" : undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    const result = await getEmployees({
      search,
      employeeType,
      departmentId,
      designationId,
      status,
      hasUserAccount,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Get employees error:", error);
    return NextResponse.json(
      { error: error.message || "কর্মী তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন কর্মী যুক্ত করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      nameBn,
      nameEn,
      nameAr,
      employeeType,
      departmentId,
      designationId,
      gender,
      dateOfBirth,
      bloodGroup,
      mobile,
      email,
      nidNumber,
      presentAddress,
      permanentAddress,
      emergencyContact,
      joiningDate,
      baseSalary,
      photoUrl,
      notes,
      userId,
    } = body;

    if (!nameBn || !nameEn || !mobile) {
      return NextResponse.json({ error: "বাংলা নাম, ইংরেজি নাম ও মোবাইল নম্বর আবশ্যক।" }, { status: 400 });
    }

    const employee = await createEmployee(
      {
        nameBn,
        nameEn,
        nameAr,
        employeeType,
        departmentId,
        designationId,
        gender,
        dateOfBirth,
        bloodGroup,
        mobile,
        email,
        nidNumber,
        presentAddress,
        permanentAddress,
        emergencyContact,
        joiningDate,
        baseSalary,
        photoUrl,
        notes,
        userId,
      },
      user.userId
    );

    return NextResponse.json({ success: true, employee }, { status: 201 });
  } catch (error: any) {
    console.error("Create employee error:", error);
    return NextResponse.json(
      { error: error.message || "কর্মী নিবন্ধন ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
