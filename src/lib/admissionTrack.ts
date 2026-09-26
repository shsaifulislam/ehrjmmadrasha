import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export function getStatusInstruction(status: string, correctionReason?: string | null): string {
  switch (status) {
    case "SUBMITTED":
      return "আপনার আবেদন সফলভাবে গৃহীত হয়েছে। প্রাথমিক তথ্য ও কাগজপত্র নিরীক্ষার জন্য অপেক্ষমাণ রয়েছে।";
    case "UNDER_REVIEW":
      return "আবেদনপত্রটি বর্তমানে মাদরাসা কর্তৃপক্ষের নিবিড় পর্যালোচনার অধীনে রয়েছে।";
    case "VERIFICATION":
      return "দাখিলকৃত কাগজপত্র ও তথ্যাদি যাচাইকরণ চলছে। প্রয়োজনীয় ক্ষেত্রে মাদরাসা অফিস থেকে ফোনে যোগাযোগ করা হতে পারে।";
    case "EXAM_INTERVIEW":
      return "আবেদনকারীকে ভর্তি পরীক্ষা বা মৌখিক সাক্ষাতকারের জন্য মাদরাসায় উপস্থিত হতে হবে। নির্ধারিত সময়সূচির জন্য অফিসের সাথে যোগাযোগ রাখুন।";
    case "CORRECTION_REQUESTED":
      return `আবেদনের তথ্যে সংশোধনের অনুরোধ করা হয়েছে: "${correctionReason || "অনুরোধকৃত কাগজপত্র মাদরাসা অফিসে জমা দিন"}। অনুগ্রহ করে মাদরাসা অফিসে যোগাযোগ করে তা সংশোধন করুন।`;
    case "APPROVED":
      return "অভিনন্দন! ভর্তি আবেদন অনুমোদিত হয়েছে। দ্রুততম সময়ে মাদরাসা অফিসে উপস্থিত হয়ে মূল সনদপত্র প্রদর্শন এবং ভর্তি আনুষ্ঠানিকতা সম্পন্ন করুন।";
    case "REJECTED":
      return "দুঃখিত, আসন সংকট বা অন্যান্য প্রাতিষ্ঠানিক বিবেচনায় আবেদনটি এই সেশনে অনুমোদিত করা সম্ভব হয়নি।";
    default:
      return "আবেদনটি প্রক্রিয়াধীন রয়েছে।";
  }
}

export async function handleTracking(trackingIdOrPhone: string) {
  const query = trackingIdOrPhone.trim();
  const isPhone = /^01[0-9]{9}$/.test(query);

  const application = await prisma.application.findFirst({
    where: {
      OR: [
        { applicationNumber: query },
        ...(isPhone ? [{ guardianPhone: query }] : []),
      ],
    },
    select: {
      id: true,
      applicationNumber: true,
      studentNameBn: true,
      status: true,
      correctionReason: true,
      examInterviewScheduledAt: true,
      submittedAt: true,
      createdAt: true,
      desiredClassId: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!application) {
    return NextResponse.json(
      { error: "প্রদত্ত ট্র্যাকিং নম্বর বা মোবাইল নম্বরের সাথে কোনো ভর্তি আবেদন খুঁজে পাওয়া যায়নি।" },
      { status: 404 }
    );
  }

  // Lookup class name safely
  let classNameBn = "নির্ধারিত বিভাগ";
  if (application.desiredClassId) {
    const cls = await prisma.jamatClass.findUnique({
      where: { id: application.desiredClassId },
      select: { nameBn: true },
    });
    if (cls) classNameBn = cls.nameBn;
  }

  const nextInstruction = getStatusInstruction(application.status, application.correctionReason);

  // Return strictly privacy-safe projection
  return NextResponse.json({
    success: true,
    application: {
      trackingId: application.applicationNumber,
      studentNameBn: application.studentNameBn,
      desiredClass: classNameBn,
      status: application.status,
      applicationDate: (application.submittedAt || application.createdAt).toISOString().split("T")[0],
      nextActionInstruction: nextInstruction,
      correctionRequired: application.status === "CORRECTION_REQUESTED" ? application.correctionReason : null,
      examScheduledAt: application.examInterviewScheduledAt
        ? application.examInterviewScheduledAt.toISOString()
        : null,
    },
  });
}
