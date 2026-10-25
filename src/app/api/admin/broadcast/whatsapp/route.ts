import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { resolveSmsRecipients, generateWhatsAppLink } from "@/lib/smsGateway";

export const dynamic = "force-dynamic";

/**
 * POST: Resolves recipients and generates personalized WhatsApp Web direct links
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      message = "আসসালামু আলাইকুম। মাদরাসা সংক্রান্ত জরুরি বার্তা।",
      audience = "ALL_GUARDIANS",
      classId,
    } = body;

    const recipients = await resolveSmsRecipients({
      audience,
      classId,
    });

    const list = recipients.map((r) => {
      // Personalize if template contains tokens
      let personalizedMsg = message
        .replace(/\{GUARDIAN\}/g, r.name)
        .replace(/\{STUDENT\}/g, r.studentName || "আপনার সন্তান")
        .replace(/\{CLASS\}/g, r.className || "");

      return {
        name: r.name,
        phone: r.phone,
        role: r.role,
        studentName: r.studentName,
        className: r.className,
        whatsAppLink: generateWhatsAppLink(r.phone, personalizedMsg),
      };
    });

    return NextResponse.json({
      success: true,
      totalCount: list.length,
      recipients: list,
    });
  } catch (error: any) {
    console.error("WhatsApp Link Generator Error:", error);
    return NextResponse.json(
      { error: "হোয়াটসঅ্যাপ তালিকা প্রস্তুত করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
