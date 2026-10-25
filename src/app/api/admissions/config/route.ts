import { NextRequest, NextResponse } from "next/server";
import {
  getAdmissionSessionConfig,
  isAdmissionCurrentlyOpen,
  isValidAdmissionDateRange,
  updateAdmissionSessionConfig,
} from "@/lib/admissions/admissionConfigEngine";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admissions/config
 * Public endpoint to fetch active admission configuration, dates, class quotas, and availability.
 */
export async function GET(req: NextRequest) {
  try {
    const config = await getAdmissionSessionConfig();
    const admissionStatus = await isAdmissionCurrentlyOpen();

    const enrichedConfig = {
      ...config,
      isAdmissionOpen: admissionStatus.isOpen,
      admissionClosedReason: admissionStatus.reason,
      generalRequirements: [
        "শিক্ষার্থীর মৌলিক দীনী শিক্ষার প্রতি আন্তরিক আগ্রহ ও শৃঙ্খলা বজায় রাখার মানসিকতা থাকতে হবে।",
        "অনলাইন অথবা মাদরাসা অফিসে নির্ধারিত আবেদন ফরম যথাযথভাবে পূরণ করতে হবে।",
        "প্রবেশিকা ও মৌখিক পরীক্ষায় ন্যূনতম উত্তীর্ণ মান অর্জন করতে হবে।",
        "আবাসিক শিক্ষার্থীদের ক্ষেত্রে অভিভাবকের সুস্পষ্ট সম্মতি ও নিয়মাবলী মেনে চলার অঙ্গীকার আবশ্যক।"
      ],
      faqList: [
        { questionBn: "ভর্তির জন্য কি কোনো লিখিত পরীক্ষা দিতে হবে?", answerBn: "হিফজ ও কিতাব বিভাগের ক্ষেত্রে মৌখিক ও সাধারণ যোগ্যতা যাচাইমূলক মূল্যায়ন নেওয়া হয়। নূরানী বিভাগে অভিভাবকসহ সাক্ষাৎকার অনুষ্ঠিত হয়।", category: "EXAM" },
        { questionBn: "আবাসিক ও অনাবাসিক ব্যবস্থা কেমন?", answerBn: "আমাদের রয়েছে কঠোর নিরাপত্তা ও ২৪ ঘণ্টা তদারকিসহ উন্নত মনোরম আবাসিক হোস্টেল এবং স্বাস্থ্যসম্মত খাবার ব্যবস্থা। অনাবাসিক শিক্ষার্থীদের জন্যও সুব্যবস্থা রয়েছে।", category: "FACILITIES" },
        { questionBn: "অনলাইনে আবেদনের পর কী করণীয়?", answerBn: "আবেদন সাবমিটের পর ট্র্যাকিং নম্বর ও প্রবেশপত্রটি সংরক্ষণ করুন। নির্দিষ্ট তারিখে প্রয়োজনীয় মূল সনদসহ মাদরাসা ক্যাম্পাসে উপস্থিত হতে হবে।", category: "PROCESS" },
        { questionBn: "এতিম বা অসচ্ছল শিক্ষার্থীদের জন্য কোনো সুযোগ আছে কি?", answerBn: "হ্যাঁ, ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় লিল্লাহ বোর্ডিং ও যাকাত তহবিলের মাধ্যমে যোগ্য ও অসচ্ছল শিক্ষার্থীদের সম্পূর্ণ বা আংশিক ফ্রি শিক্ষার সুবিধা রয়েছে।", category: "FINANCIAL" }
      ]
    };

    return NextResponse.json({
      success: true,
      config: enrichedConfig,
    });
  } catch (error: any) {
    console.error("GET /api/admissions/config error:", error);
    return NextResponse.json(
      { error: "ভর্তি সেশন কনফিগারেশন লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admissions/config
 * Admin endpoint to update session settings, dates, and class availability.
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন কনফিগারেশন পরিবর্তন করতে পারেন।" },
        { status: 403 }
      );
    }

    const updates = await req.json();
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return NextResponse.json({ error: "অবৈধ ভর্তি কনফিগারেশন।" }, { status: 400 });
    }

    const currentConfig = await getAdmissionSessionConfig();
    const nextStartDate = typeof updates.startDate === "string" ? updates.startDate : currentConfig.startDate;
    const nextEndDate = typeof updates.endDate === "string" ? updates.endDate : currentConfig.endDate;
    const nextIsOpen = typeof updates.isOpen === "boolean" ? updates.isOpen : currentConfig.isOpen;
    if (nextIsOpen && !isValidAdmissionDateRange(nextStartDate, nextEndDate)) {
      return NextResponse.json(
        { error: "ভর্তি চালু করতে একটি বৈধ শুরু ও শেষ তারিখ নির্ধারণ করুন।" },
        { status: 400 }
      );
    }

    const updatedConfig = await updateAdmissionSessionConfig(updates, user.userId);

    return NextResponse.json({
      success: true,
      message: "ভর্তি কনফিগারেশন সফলভাবে আপডেট করা হয়েছে।",
      config: updatedConfig,
    });
  } catch (error: unknown) {
    console.error("PUT /api/admissions/config error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ভর্তি কনফিগারেশন সংরক্ষণে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
