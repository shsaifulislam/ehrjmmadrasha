import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

/**
 * GET /api/admin/library/publishers
 * List all publishers
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const publishers = await prisma.libraryPublisher.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });

    return NextResponse.json({ publishers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার ত্রুটি।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/library/publishers
 * Create a publisher
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন প্রকাশনী যোগ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { name, contactInfo, address, website, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "প্রকাশনীর নাম আবশ্যক।" }, { status: 400 });
    }

    const publisher = await prisma.libraryPublisher.create({
      data: {
        name,
        contactInfo,
        address,
        website,
        notes,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "CREATE",
      entityType: "LibraryPublisher",
      entityId: publisher.id,
      details: { name },
    });

    return NextResponse.json({ success: true, publisher }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "প্রকাশনী যোগ করতে ব্যর্থ।" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/library/publishers
 * Update a publisher
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন প্রকাশনী সম্পাদনা করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, contactInfo, address, website, notes, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "প্রকাশনী আইডি আবশ্যক।" }, { status: 400 });
    }

    const updated = await prisma.libraryPublisher.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(contactInfo !== undefined && { contactInfo }),
        ...(address !== undefined && { address }),
        ...(website !== undefined && { website }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "UPDATE",
      entityType: "LibraryPublisher",
      entityId: id,
      details: { name, isActive },
    });

    return NextResponse.json({ success: true, publisher: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "প্রকাশনী আপডেট ব্যর্থ।" }, { status: 500 });
  }
}
