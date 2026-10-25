import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getTransportRouteById, updateTransportRoute, archiveTransportRoute } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const route = await getTransportRouteById(params.id);
    if (!route) {
      return NextResponse.json({ error: "রুট পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, route });
  } catch (error: any) {
    console.error("Get route by id error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await updateTransportRoute(params.id, body, user.userId);
    return NextResponse.json({ success: true, route: updated });
  } catch (error: any) {
    console.error("Update route error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const archived = await archiveTransportRoute(params.id, user.userId);
    return NextResponse.json({ success: true, route: archived });
  } catch (error: any) {
    console.error("Archive route error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
