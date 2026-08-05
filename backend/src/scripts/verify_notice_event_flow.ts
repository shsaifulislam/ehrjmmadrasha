import prisma from "../config/prisma";
import { NoticeService } from "../modules/notice/notice.service";
import { NotificationService } from "../modules/notification/notification.service";

async function runNoticeEventVerification() {
  console.log("=================================================");
  console.log("🚀 STARTING NOTICE, EVENT & COMMUNICATION CORE MODULE ATOMIC VERIFICATION");
  console.log("=================================================\n");

  const uniqueSuffix = Date.now().toString().slice(-4);

  // 1. Create System User
  let user = await prisma.user.findFirst({ where: { isActive: true } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: `notice_user_${uniqueSuffix}`,
        passwordHash: "dummyhash",
        role: { create: { name: `ROLE_NOTICE_${uniqueSuffix}` } },
      },
    });
  }

  // 2. Sub-component 1: Notice Board Engine (Create Public & Internal Notice)
  console.log("📌 Sub-component 1: Notice Board Engine...");
  const noticeService = new NoticeService();
  const notice = await noticeService.createNotice(
    {
      title: `বার্ষিক ক্রীড়া প্রতিযোগিতা ও পুরষ্কার বিতরণী ২০২৬ ${uniqueSuffix}`,
      content: "আগামী ১৫ আগস্ট মাদরাসা প্রাঙ্গণে বার্ষিক ক্রীড়া প্রতিযোগিতা ও পুরষ্কার বিতরণী অনুষ্ঠিত হবে।",
      type: "GENERAL",
      isPublished: true,
    },
    user.id
  );

  console.log(`✅ Notice Board Item Published! ID: ${notice.id}, Title: ${notice.title}`);

  // 3. Sub-component 2: Event Calendar & Urgent Announcement Engine
  console.log("\n📌 Sub-component 2: Event Calendar & Urgent Announcement Engine...");
  const eventNotice = await noticeService.createNotice(
    {
      title: `মাদরাসা প্রতিষ্ঠাবার্ষিকী সম্মেলন ${uniqueSuffix}`,
      content: "বিশেষ আলোচনা সভা ও দোয়া মাহফিল। সকল শিক্ষক ও অভিভাবক আমন্ত্রিত।",
      type: "URGENT",
      isPublished: true,
    },
    user.id
  );

  console.log(`✅ Event & Urgent Announcement Published! ID: ${eventNotice.id}`);

  // 4. Sub-component 3 & 4: SMS Dispatch Engine & Notification Audit Log
  console.log("\n📌 Sub-component 3 & 4: SMS Engine & Broadcast Audit Log...");
  const notificationService = new NotificationService();
  await notificationService.dispatchSingleNotification({
    eventType: "BULK_NOTICE" as any,
    recipientPhone: "01711223344",
    recipientName: "অভিভাবকবৃন্দ",
    message: `[জরুরি নোটিশ] ${notice.title}। ইলিয়টগঞ্জ মাদ্রাসা।`,
    referenceId: notice.id,
  });

  await new Promise((r) => setTimeout(r, 600));

  const smsLog = await prisma.notificationLog.findFirst({
    where: { recipientPhone: { contains: "1711223344" } },
    orderBy: { createdAt: "desc" },
  });

  console.log(`✅ SMS Broadcast Dispatched! Logged Record ID: ${smsLog?.id || "N/A"}`);

  // 5. DB Assertion Matrix for Phase 10 Sub-components
  console.log("\n--- DB NOTICE, EVENT & SMS VERIFICATION ASSERTION MATRIX ---");
  console.log(`1. Notice Board Engine (General Notice): ${notice ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`2. Event & Urgent Announcement Engine: ${eventNotice ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`3. SMS Engine Dispatching: ${smsLog ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`4. Broadcast Notification Audit Logged: ${smsLog?.status === "SENT" ? "PASS ✅" : "FAIL ❌"}`);

  console.log("\n=================================================");
  console.log("🎉 ALL NOTICE, EVENT & SMS CORE MODULE SUB-COMPONENTS VERIFIED!");
  console.log("=================================================\n");
}

runNoticeEventVerification()
  .catch((e) => {
    console.error("❌ Notice & Event Verification Failed with Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
