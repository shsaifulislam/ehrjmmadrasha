import { NextRequest, NextResponse } from "next/server";
import { getInstitutionalProfile } from "@/lib/cms/institutionalProfile";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actionType, title, audienceType, rawNotes, language = "bn" } = body;

    const profile = getInstitutionalProfile();

    let suggestedSubject = "";
    let suggestedBody = "";
    let suggestedAudience = audienceType || "ALL_GUARDIANS";

    switch (actionType) {
      case "EXAM_ANNOUNCEMENT":
        suggestedSubject = `আসন্ন পরীক্ষার সময়সূচি ও দিকনির্দেশনা - ${profile.nameBn}`;
        suggestedBody = `মুহতারাম অভিভাবক,\n\nআসসালামু আলাইকুম। ${profile.nameBn}-এর আসন্ন সাময়িক/বার্ষিক পরীক্ষা আগামী সপ্তাহে শুরু হতে যাচ্ছে। রুটিন অনুযায়ী সকল শিক্ষার্থীকে সময়মতো মাদরাসায় উপস্থিত থাকার নির্দেশ দেওয়া হচ্ছে। পরীক্ষার প্রবেশপত্র অনলাইন পোর্টাল থেকে সংগ্রহ করা যাবে।\n\n- মাদরাসা প্রশাসন`;
        suggestedAudience = "ALL_GUARDIANS";
        break;

      case "FEE_REMINDER":
        suggestedSubject = `মাসিক শিক্ষাদান ও আনুষঙ্গিক ফি পরিশোধের তাগিদপত্র`;
        suggestedBody = `মুহতারাম অভিভাবক,\n\nআপনার অবগতির জন্য জানানো যাচ্ছে যে, শিক্ষার্থী {{student_name}} (রোল: {{roll}}, জামাত: {{class_title}})-এর চলতি মাসের প্রদেয় ফি বকেয়া রয়েছে। মাদরাসার নিয়মিত শিক্ষা কার্যক্রম সুষ্ঠুভাবে পরিচালনার স্বার্থে আগামী {{due_date}} তারিখের মধ্যে উক্ত ফি পরিশোধ করার জন্য বিনীত অনুরোধ করা হচ্ছে।\n\nজাযাকুমুল্লাহু খাইরান।`;
        suggestedAudience = "FINANCE_TARGET_GROUP";
        break;

      case "EVENT_INVITATION":
        suggestedSubject = `দাওয়াতনামা: বার্ষিক ওয়াজ মাহফিল ও দোয়া অনুষ্ঠান - ${profile.nameBn}`;
        suggestedBody = `আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ,\n\n${profile.nameBn}-এর বার্ষিক ওয়াজ মাহফিল ও খতমে বুখারী উপলক্ষে এক বরকতময় আলোচনা সভার আয়োজন করা হয়েছে। উক্ত মহতী অনুষ্ঠানে আপনার সবান্ধব উপস্থিতি ও আন্তরিক দোয়া একান্তভাবে কামনা করছি।\n\nস্থান: মাদরাসা প্রাঙ্গণ, ${profile.addressBn}।`;
        suggestedAudience = "ALL_PUBLIC_USERS";
        break;

      case "ADMISSION_OPEN":
        suggestedSubject = `নতুন শিক্ষাবর্ষে ভর্তি বিজ্ঞপ্তি - ${profile.nameBn}`;
        suggestedBody = `আলহামদুলিল্লাহ, ${profile.nameBn}-এ নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম শুরু হয়েছে। নূরানী, নাজেরা, হিফজুল কুরআন ও কিতাব বিভাগে সীমিত সংখ্যক আসনে ভর্তি চলছে। আগ্রহী অভিভাবকগণ অনলাইন পোর্টালের মাধ্যমে আবেদন করতে পারবেন।\n\nযোগাযোগ: ${profile.primaryPhone}`;
        suggestedAudience = "ALL_PUBLIC_USERS";
        break;

      default:
        suggestedSubject = title ? `বিজ্ঞপ্তি: ${title}` : `জরুরি নোটিশ - ${profile.nameBn}`;
        suggestedBody = rawNotes
          ? `মুহতারাম সংশ্লিষ্ট,\n\n${rawNotes}\n\n- প্রশাসন, ${profile.nameBn}`
          : `সম্মানিত সংশ্লিষ্ট ব্যক্তিবর্গ,\n\n${profile.nameBn}-এর পক্ষ থেকে এই জরুরি নোটিফিকেশন প্রদান করা হচ্ছে। বিস্তারিত জানতে অনুগ্রহ করে আপনার অনলাইন পোর্টালে লগইন করুন।`;
        break;
    }

    return NextResponse.json({
      success: true,
      draft: {
        isAiDraft: true,
        approvalRequired: true,
        suggestedSubject,
        suggestedBody,
        suggestedAudience,
        disclaimerBn:
          "এআই কর্তৃক প্রস্তুতকৃত খসড়া। প্রেরণের পূর্বে তথ্য যাচাই ও প্রশাসনিক অনুমোদন বাধ্যতামূলক।",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
