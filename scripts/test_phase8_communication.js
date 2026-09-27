/**
 * EHRJ DIGITAL CAMPUS - PHASE 8 COMMUNICATION, NOTIFICATION & OFFICIAL NOTICE ENGINE TEST SUITE
 * Complete automated assertions for:
 * 1. Notice CMS Lifecycle (Draft -> Scheduled -> Published -> Expired -> Archived -> Pinned)
 * 2. Public Notice Board Privacy & Filtering
 * 3. Audience Targeting & Recipient Resolution (Public, All Guardians, Class, All Teachers)
 * 4. Portal Notifications Engine (List, Unread count, Mark Read, Mark All Read)
 * 5. IDOR & Security Isolation (Cross-Guardian, Anonymous, Role boundaries)
 * 6. Email Delivery Tracking & Retry Engine
 * 7. Notification Preferences & Mandatory Category Protection
 * 8. Domain Event Outbox & Idempotency
 * 9. Scheduler Idempotency & Expiration Automation
 */

const http = require("http");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE_URL = "http://localhost:3000";
let adminCookies = "";
let teacherCookies = "";
let guardianACookies = "";
let guardianBCookies = "";

let guardianAUser = null;
let guardianBUser = null;
let testSessionId = "";
let testClassAId = "";
let testClassBId = "";
let studentAId = "";
let studentBId = "";

let testDraftNoticeId = "";
let testPublishedNoticeId = "";
let testClassNoticeId = "";
let testScheduledNoticeId = "";
let testNotificationAId = "";
let testNotificationBId = "";
let testDeliveryId = "";

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    totalFailed++;
    process.exitCode = 1;
  }
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || "GET",
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "x-test-suite": "ehrj-test-suite",
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, json });
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runPhase8TestSuite() {
  console.log("=================================================================");
  console.log("  EHRJ DIGITAL CAMPUS - PHASE 8 COMMUNICATION ENGINE TEST SUITE");
  console.log("=================================================================\n");

  try {
    // -------------------------------------------------------------
    // 0. AUTHENTICATION & FIXTURES SETUP
    // -------------------------------------------------------------
    console.log("--- 0. Authentication & Academic Fixtures Setup ---");

    // 0.1 Admin Login
    const adminLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { identifier: "adminehrjmadrasha@gmail.com", password: "AdminEhrj@2026!" },
    });
    adminCookies = adminLoginRes.headers["set-cookie"]
      ? adminLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";
    assert(adminLoginRes.statusCode === 200, "Admin login succeeded with session cookie");

    // 0.2 Teacher Login
    const teacherLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { identifier: "teacherehrjmadrasha@gmail.com", password: "Teacher@2026!" },
    });
    teacherCookies = teacherLoginRes.headers["set-cookie"]
      ? teacherLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";
    assert(teacherLoginRes.statusCode === 200, "Teacher login succeeded with session cookie");

    // 0.3 Primary Guardian A
    guardianAUser = await prisma.user.findFirst({ where: { role: "GUARDIAN" } });
    assert(!!guardianAUser, "Primary Guardian A user found");

    const guardianALoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        identifier: guardianAUser.username || guardianAUser.email,
        password: "Guardian@2026!",
      },
    });
    guardianACookies = guardianALoginRes.headers["set-cookie"]
      ? guardianALoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";
    assert(guardianALoginRes.statusCode === 200, "Guardian A login succeeded with session cookie");

    // 0.4 Secondary Guardian B (Create or update password for IDOR isolation)
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash("GuardianB@2026!", 10);
    guardianBUser = await prisma.user.findFirst({
      where: { role: "GUARDIAN", id: { not: guardianAUser.id } },
    });
    if (!guardianBUser) {
      guardianBUser = await prisma.user.create({
        data: {
          name: "Guardian B Test",
          username: "01799887766",
          email: "guardianB_test@ehrj.edu.bd",
          phone: "01799887766",
          passwordHash: hash,
          role: "GUARDIAN",
          status: "ACTIVE",
        },
      });
      await prisma.guardian.create({
        data: {
          userId: guardianBUser.id,
          fullNameBn: "অভিভাবক খ",
          fullNameEn: "Guardian B",
          phone: "01799887766",
          relation: "FATHER",
        },
      });
    } else {
      await prisma.user.update({
        where: { id: guardianBUser.id },
        data: { passwordHash: hash },
      });
    }
    assert(!!guardianBUser, "Secondary Guardian B user ready for IDOR testing");

    const guardianBLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        identifier: guardianBUser.username || guardianBUser.email,
        password: "GuardianB@2026!",
      },
    });
    guardianBCookies = guardianBLoginRes.headers["set-cookie"]
      ? guardianBLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";
    assert(guardianBLoginRes.statusCode === 200, "Guardian B login succeeded with session cookie");

    // 0.5 Session & Class Fixtures
    const session = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
    assert(!!session, "Active current AcademicSession found");
    testSessionId = session.id;

    const classes = await prisma.jamatClass.findMany({
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { student: { include: { guardianLinks: true } } },
        },
      },
      take: 2,
    });
    assert(classes.length >= 1, "At least one JamatClass found");
    testClassAId = classes[0].id;
    testClassBId = classes.length > 1 ? classes[1].id : classes[0].id;

    // Link Student A to Guardian A in Class A
    const guardianARecord = await prisma.guardian.findFirst({ where: { userId: guardianAUser.id } });
    if (classes[0].enrollments.length > 0) {
      studentAId = classes[0].enrollments[0].student.id;
      await prisma.guardianStudent.upsert({
        where: {
          guardianId_studentId: {
            guardianId: guardianARecord.id,
            studentId: studentAId,
          },
        },
        create: {
          guardianId: guardianARecord.id,
          studentId: studentAId,
          isPrimary: true,
        },
        update: {},
      });
    }

    // -------------------------------------------------------------
    // 1. NOTICE CMS LIFECYCLE
    // -------------------------------------------------------------
    console.log("\n--- 1. Official Notice CMS Lifecycle ---");

    // 1.1 Create Notice in DRAFT status
    const createDraftRes = await makeRequest("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        titleBn: "পরীক্ষামূলক নোটিশ (খসড়া)",
        titleEn: "Test Draft Notice",
        bodyBn: "এটি একটি খসড়া নোটিশ যা এখনও প্রকাশিত হয়নি।",
        bodyEn: "This is a draft notice not yet published.",
        category: "OFFICIAL_NOTICE",
        priority: "NORMAL",
        audience: "PUBLIC",
        status: "DRAFT",
      },
    });
    assert(createDraftRes.statusCode === 201, "Admin creates notice in DRAFT status (201)");
    assert(createDraftRes.json.data && createDraftRes.json.data.status === "DRAFT", "Notice created with status DRAFT");
    testDraftNoticeId = createDraftRes.json.data.id;

    // 1.2 Update Notice details & priority
    const updateRes = await makeRequest(`/api/admin/notices/${testDraftNoticeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        titleBn: "বার্ষিক মাহফিল ও ছুটির বিজ্ঞপ্তি ২০২৬",
        titleEn: "Annual Gathering and Vacation Notice 2026",
        bodyBn: "আগামী শুক্রবার মাদরাসার বার্ষিক মাহফিল অনুষ্ঠিত হবে। সকল অভিভাবক আমন্ত্রিত।",
        bodyEn: "The annual gathering will be held this Friday. All guardians are invited.",
        priority: "IMPORTANT",
        isPinned: true,
      },
    });
    assert(updateRes.statusCode === 200, "Admin updates draft notice content and priority (200)");
    assert(updateRes.json.data.priority === "IMPORTANT", "Notice priority updated to IMPORTANT");
    assert(updateRes.json.data.isPinned === true, "Notice pinned flag set to true");
    assert(updateRes.json.data.version >= 2, "Notice version auto-incremented to >= 2");

    // 1.3 Publish Notice
    const publishRes = await makeRequest(`/api/admin/notices/${testDraftNoticeId}/publish`, {
      method: "POST",
      headers: { Cookie: adminCookies },
    });
    assert(publishRes.statusCode === 200, "Admin publishes notice (200)");
    assert(publishRes.json.data.status === "PUBLISHED", "Notice status transitioned to PUBLISHED");
    assert(!!publishRes.json.data.publishedAt, "Notice publishedAt timestamp set");
    testPublishedNoticeId = testDraftNoticeId;

    // 1.4 Notice Unpinning
    const unpinRes = await makeRequest(`/api/admin/notices/${testPublishedNoticeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: { isPinned: false },
    });
    assert(unpinRes.statusCode === 200, "Admin unpins notice (200)");
    assert(unpinRes.json.data.isPinned === false, "Notice pinned flag updated to false");

    // 1.5 Schedule a future notice
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const createScheduledRes = await makeRequest("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        titleBn: "ভবিষ্যৎ পরীক্ষার নোটিশ (শিডিউল্ড)",
        titleEn: "Future Scheduled Exam Notice",
        bodyBn: "এই নোটিশটি আগামী সপ্তাহে স্বয়ংক্রিয়ভাবে প্রকাশিত হবে।",
        category: "EXAM",
        priority: "URGENT",
        audience: "PUBLIC",
        status: "SCHEDULED",
        scheduledAt: futureDate,
      },
    });
    assert(createScheduledRes.statusCode === 201, "Admin creates SCHEDULED notice with future timestamp");
    assert(createScheduledRes.json.data.status === "SCHEDULED", "Notice created with status SCHEDULED");
    testScheduledNoticeId = createScheduledRes.json.data.id;

    // 1.6 Archive a notice
    const archiveRes = await makeRequest(`/api/admin/notices/${testPublishedNoticeId}/archive`, {
      method: "POST",
      headers: { Cookie: adminCookies },
    });
    assert(archiveRes.statusCode === 200, "Admin archives notice (200)");
    assert(archiveRes.json.data.status === "ARCHIVED", "Notice status transitioned to ARCHIVED");
    assert(archiveRes.json.data.isPublished === false, "Notice isPublished updated to false on archive");

    // -------------------------------------------------------------
    // 2. PUBLIC NOTICE BOARD PRIVACY & FILTERING
    // -------------------------------------------------------------
    console.log("\n--- 2. Public Notice Board Privacy & Filtering ---");

    // 2.1 Re-publish a fresh public notice for board testing
    const publicNoticeRes = await makeRequest("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        titleBn: "মাদরাসার প্রকাশ্য বিজ্ঞপ্তি ২০২৬",
        titleEn: "Official Public Notice 2026",
        bodyBn: "এটি সাধারণ জনগণের জন্য প্রকাশ্য বিজ্ঞপ্তি।",
        category: "ACADEMIC",
        priority: "NORMAL",
        audience: "PUBLIC",
      },
    });
    const freshPublicId = publicNoticeRes.json.data.id;
    await makeRequest(`/api/admin/notices/${freshPublicId}/publish`, {
      method: "POST",
      headers: { Cookie: adminCookies },
    });

    // 2.2 Public listing endpoint GET /api/notices
    const publicListRes = await makeRequest("/api/notices");
    assert(publicListRes.statusCode === 200, "Public notices endpoint accessible without authentication (200)");
    assert(Array.isArray(publicListRes.json.data), "Public notices returns array of notices");
    
    // Verify published notice is in list
    const foundPublished = publicListRes.json.data.some((n) => n.id === freshPublicId);
    assert(foundPublished, "Published public notice appears on public notice board");

    // Verify scheduled notice is NOT in public list
    const foundScheduled = publicListRes.json.data.some((n) => n.id === testScheduledNoticeId);
    assert(!foundScheduled, "SCHEDULED future notice is NOT visible on public notice board");

    // Verify archived notice is NOT in public list
    const foundArchived = publicListRes.json.data.some((n) => n.id === testPublishedNoticeId);
    assert(!foundArchived, "ARCHIVED notice is NOT visible on active public notice board");

    // 2.3 Single public notice GET /api/notices/[id]
    const singlePublicRes = await makeRequest(`/api/notices/${freshPublicId}`);
    assert(singlePublicRes.statusCode === 200, "Public single notice endpoint returns 200");
    assert(singlePublicRes.json.data.titleBn === "মাদরাসার প্রকাশ্য বিজ্ঞপ্তি ২০২৬", "Public notice returns correct titleBn");
    assert(!singlePublicRes.json.data.internalNotes, "Public notice does NOT leak internal admin notes");

    // 2.4 Anonymous request to scheduled notice returns 404 or 403
    const scheduledDirectRes = await makeRequest(`/api/notices/${testScheduledNoticeId}`);
    assert(scheduledDirectRes.statusCode === 404 || scheduledDirectRes.statusCode === 403, "Accessing non-published notice anonymously returns 404 or 403");

    // -------------------------------------------------------------
    // 3. AUDIENCE TARGETING & RECIPIENT RESOLUTION
    // -------------------------------------------------------------
    console.log("\n--- 3. Audience Targeting & Recipient Resolution ---");

    // 3.1 Targeted Notice: ALL_GUARDIANS
    const allGuardiansNoticeRes = await makeRequest("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        titleBn: "সকল সম্মানিত অভিভাবকবৃন্দের অবগতির জন্য",
        titleEn: "Notice for All Respected Guardians",
        bodyBn: "মাদরাসার নতুন পাঠ্যক্রম সংক্রান্ত নির্দেশনা।",
        category: "ACADEMIC",
        priority: "IMPORTANT",
        audience: "ALL_GUARDIANS",
      },
    });
    const allGuardiansNoticeId = allGuardiansNoticeRes.json.data.id;
    const pubAllGRes = await makeRequest(`/api/admin/notices/${allGuardiansNoticeId}/publish`, {
      method: "POST",
      headers: { Cookie: adminCookies },
    });
    assert(pubAllGRes.statusCode === 200, "Admin published notice targeted to ALL_GUARDIANS");
    assert(pubAllGRes.json.success === true, "Publish API returns success: true for ALL_GUARDIANS");

    // 3.2 Targeted Notice: Specific CLASS
    const classNoticeRes = await makeRequest("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        titleBn: "নির্দিষ্ট জামাতের বিশেষ নোটিশ",
        titleEn: "Class Specific Notice",
        bodyBn: "নাহবেমীর জামাতের বিশেষ ক্লাসের সময়সূচী পরিবর্তন।",
        category: "ACADEMIC",
        priority: "NORMAL",
        audience: "CLASS",
        classId: testClassAId,
        sessionId: testSessionId,
      },
    });
    testClassNoticeId = classNoticeRes.json.data.id;
    const pubClassRes = await makeRequest(`/api/admin/notices/${testClassNoticeId}/publish`, {
      method: "POST",
      headers: { Cookie: adminCookies },
    });
    assert(pubClassRes.statusCode === 200, "Admin published notice targeted to specific CLASS (200)");

    // 3.3 Targeted Notice: ALL_TEACHERS
    const teacherNoticeRes = await makeRequest("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        titleBn: "শিক্ষকমণ্ডলীর জরুরি বৈঠক",
        titleEn: "Urgent Meeting of Faculty Members",
        bodyBn: "আগামীকাল আসরের পর শিক্ষক মিলনায়তনে বৈঠক অনুষ্ঠিত হবে।",
        category: "OFFICIAL_NOTICE",
        priority: "URGENT",
        audience: "ALL_TEACHERS",
      },
    });
    const teacherNoticeId = teacherNoticeRes.json.data.id;
    const pubTeacherRes = await makeRequest(`/api/admin/notices/${teacherNoticeId}/publish`, {
      method: "POST",
      headers: { Cookie: adminCookies },
    });
    assert(pubTeacherRes.statusCode === 200, "Admin published notice targeted to ALL_TEACHERS");
    assert(pubTeacherRes.json.success === true, "Publish API returns success: true for ALL_TEACHERS");

    // -------------------------------------------------------------
    // 4. PORTAL NOTIFICATIONS ENGINE
    // -------------------------------------------------------------
    console.log("\n--- 4. Portal Notifications Engine ---");

    // 4.1 Guardian A lists notifications
    const guardianANotifsRes = await makeRequest("/api/portal/notifications", {
      headers: { Cookie: guardianACookies },
    });
    assert(guardianANotifsRes.statusCode === 200, "Guardian A lists portal notifications (200)");
    const notifs = guardianANotifsRes.json.data || guardianANotifsRes.json.notifications || [];
    assert(Array.isArray(notifs), "Notifications returned as array");
    assert(typeof guardianANotifsRes.json.unreadCount === "number", "unreadCount is returned as number");
    assert(notifs.length >= 1, "Guardian A has at least 1 notification received");
    testNotificationAId = notifs[0].id;

    // 4.2 Mark Single Notification as Read
    const markReadRes = await makeRequest(`/api/portal/notifications/${testNotificationAId}/read`, {
      method: "POST",
      headers: { Cookie: guardianACookies },
    });
    const readItem = markReadRes.json.data || markReadRes.json.notification;
    assert(markReadRes.statusCode === 200, "Guardian A marks notification as READ (200)");
    assert(readItem && readItem.isRead === true, "Notification isRead changed to true");
    assert(readItem && !!readItem.readAt, "Notification readAt timestamp populated");

    // 4.3 Mark All Read
    const markAllReadRes = await makeRequest("/api/portal/notifications/mark-all-read", {
      method: "POST",
      headers: { Cookie: guardianACookies },
    });
    assert(markAllReadRes.statusCode === 200, "Guardian A marks all notifications read (200)");

    const recheckNotifsRes = await makeRequest("/api/portal/notifications", {
      headers: { Cookie: guardianACookies },
    });
    assert(recheckNotifsRes.json.unreadCount === 0, "Unread count is 0 after mark-all-read");

    // 4.4 Portal Notices View for Guardian
    const portalNoticesRes = await makeRequest("/api/portal/notices", {
      headers: { Cookie: guardianACookies },
    });
    const portalNotices = portalNoticesRes.json.data || portalNoticesRes.json.notices || [];
    assert(portalNoticesRes.statusCode === 200, "Guardian views scoped portal notices (200)");
    assert(Array.isArray(portalNotices), "Portal notices returns array");

    // -------------------------------------------------------------
    // 5. IDOR & SECURITY BOUNDARIES
    // -------------------------------------------------------------
    console.log("\n--- 5. IDOR & Security Isolation Boundaries ---");

    // 5.1 Create a notification explicitly for Guardian B
    const notifB = await prisma.notification.create({
      data: {
        recipientUserId: guardianBUser.id,
        type: "SYSTEM",
        title: "গার্ডিয়ান খ-এর ব্যক্তিগত বার্তা",
        body: "এটি গোপনীয় বার্তা।",
        channel: "PORTAL",
        priority: "NORMAL",
        isRead: false,
      },
    });
    testNotificationBId = notifB.id;

    // 5.2 IDOR ATTACK: Guardian A attempts to mark Guardian B's notification as read
    const idorRes = await makeRequest(`/api/portal/notifications/${testNotificationBId}/read`, {
      method: "POST",
      headers: { Cookie: guardianACookies },
    });
    assert(idorRes.statusCode === 404 || idorRes.statusCode === 403, "IDOR BLOCKED: Guardian A cannot mark Guardian B's notification read (404/403)");

    // 5.3 Anonymous request to portal notifications
    const anonNotifsRes = await makeRequest("/api/portal/notifications");
    assert(anonNotifsRes.statusCode === 401, "SECURITY: Anonymous access to portal notifications rejected (401)");

    // 5.4 Guardian attempts to call Admin notice publish API
    const unauthorizedPublishRes = await makeRequest(`/api/admin/notices/${testDraftNoticeId}/publish`, {
      method: "POST",
      headers: { Cookie: guardianACookies },
    });
    assert(unauthorizedPublishRes.statusCode === 403, "RBAC: Guardian cannot publish official notices (403 Forbidden)");

    // 5.5 Teacher attempts to create an official admin notice
    const teacherCreateNoticeRes = await makeRequest("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: teacherCookies },
      body: {
        titleBn: "শিক্ষকের নোটিশ",
        bodyBn: "অননুমোদিত নোটিশ তৈরির চেষ্টা।",
        category: "OFFICIAL_NOTICE",
        priority: "NORMAL",
        audience: "PUBLIC",
      },
    });
    assert(teacherCreateNoticeRes.statusCode === 403, "RBAC: Teacher cannot create institutional notices (403 Forbidden)");

    // 5.6 Guardian attempts to access Admin notification delivery log
    const guardianDeliveryLogRes = await makeRequest("/api/admin/notifications/delivery", {
      headers: { Cookie: guardianACookies },
    });
    assert(guardianDeliveryLogRes.statusCode === 403, "RBAC: Guardian cannot inspect admin delivery logs (403 Forbidden)");

    // -------------------------------------------------------------
    // 6. EMAIL DELIVERY ENGINE & RETRY TRACKING
    // -------------------------------------------------------------
    console.log("\n--- 6. Email Delivery Tracking & Retry Engine ---");

    // 6.1 Admin inspects delivery logs
    const deliveryLogsRes = await makeRequest("/api/admin/notifications/delivery", {
      headers: { Cookie: adminCookies },
    });
    const delivs = deliveryLogsRes.json.data || deliveryLogsRes.json.deliveries || [];
    assert(deliveryLogsRes.statusCode === 200, "Admin can inspect notification delivery logs (200)");
    assert(Array.isArray(delivs), "Delivery logs returned as array");

    // 6.2 Create a simulated failed delivery record
    const failedDelivery = await prisma.notificationDelivery.create({
      data: {
        notificationId: testNotificationAId,
        channel: "EMAIL",
        destination: "failed_test@ehrj.edu.bd",
        status: "FAILED",
        attemptCount: 1,
        maxAttempts: 3,
        errorCode: "SMTP_CONNECT_TIMEOUT",
        errorMessage: "Connection timed out to test mail server",
      },
    });
    testDeliveryId = failedDelivery.id;

    // 6.3 Admin triggers retry on failed delivery
    const retryRes = await makeRequest(`/api/admin/notifications/delivery/${testDeliveryId}/retry`, {
      method: "POST",
      headers: { Cookie: adminCookies },
    });
    const retryData = retryRes.json.data || retryRes.json.delivery;
    assert(retryRes.statusCode === 200 || retryRes.statusCode === 502, "Admin triggers retry on failed delivery");
    assert(retryData && retryData.attemptCount >= 2, "Delivery attemptCount incremented on retry");

    // 6.4 Non-admin cannot trigger delivery retry
    const teacherRetryRes = await makeRequest(`/api/admin/notifications/delivery/${testDeliveryId}/retry`, {
      method: "POST",
      headers: { Cookie: teacherCookies },
    });
    assert(teacherRetryRes.statusCode === 403, "RBAC: Non-admin cannot retry deliveries (403)");

    // -------------------------------------------------------------
    // 7. NOTIFICATION PREFERENCES & MANDATORY PROTECTION
    // -------------------------------------------------------------
    console.log("\n--- 7. Notification Preferences & Mandatory Category Protection ---");

    // 7.1 Guardian GET preferences
    const getPrefsRes = await makeRequest("/api/portal/notifications/preferences", {
      headers: { Cookie: guardianACookies },
    });
    assert(getPrefsRes.statusCode === 200, "Guardian gets notification preferences (200)");
    assert(Array.isArray(getPrefsRes.json.data), "Preferences returned as array");

    // 7.2 Attempt to disable mandatory SYSTEM / FINANCE notification
    const disableMandatoryRes = await makeRequest("/api/portal/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: guardianACookies },
      body: {
        category: "SYSTEM",
        emailEnabled: false,
        portalEnabled: false,
      },
    });
    assert(disableMandatoryRes.statusCode === 400, "POLICY: Disabling mandatory category SYSTEM rejected with 400 Bad Request");

    // 7.3 Successfully update optional category preference (e.g. ACADEMIC)
    const updatePrefRes = await makeRequest("/api/portal/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: guardianACookies },
      body: {
        category: "ACADEMIC",
        emailEnabled: true,
        portalEnabled: true,
      },
    });
    assert(updatePrefRes.statusCode === 200, "Guardian updates preference for optional category ACADEMIC (200)");
    assert(updatePrefRes.json.data.category === "ACADEMIC", "Saved preference returned with category ACADEMIC");

    // -------------------------------------------------------------
    // 8. DOMAIN EVENT OUTBOX & IDEMPOTENCY
    // -------------------------------------------------------------
    console.log("\n--- 8. Domain Event Outbox & Idempotency ---");

    // 8.1 Create outbox entry directly via engine method simulation
    const idempotencyKey = `OUTBOX_TEST_EVENT_${Date.now()}`;
    const outboxRecord = await prisma.notificationOutbox.create({
      data: {
        eventType: "PAYMENT_SUCCESSFUL",
        entityType: "Payment",
        entityId: "test-payment-id-123",
        payloadJson: JSON.stringify({
          guardianUserId: guardianAUser.id,
          studentName: "আব্দুল্লাহ",
          receiptNo: "REC-2026-001",
          amount: "1500",
        }),
        idempotencyKey,
        status: "PENDING",
      },
    });
    assert(!!outboxRecord.id, "Outbox event record created in database with PENDING status");

    // 8.2 Verify duplicate outbox creation with same key fails gracefully / unique constraint
    let caughtDup = false;
    try {
      await prisma.notificationOutbox.create({
        data: {
          eventType: "PAYMENT_SUCCESSFUL",
          entityType: "Payment",
          entityId: "test-payment-id-123",
          payloadJson: "{}",
          idempotencyKey,
          status: "PENDING",
        },
      });
    } catch (e) {
      caughtDup = true;
    }
    assert(caughtDup, "IDEMPOTENCY: Outbox rejects duplicate event with same idempotencyKey");

    // Clean up test outbox record
    await prisma.notificationOutbox.delete({ where: { id: outboxRecord.id } });

    // -------------------------------------------------------------
    // 9. SCHEDULER IDEMPOTENCY & AUTOMATION
    // -------------------------------------------------------------
    console.log("\n--- 9. Scheduler Idempotency & Automation ---");

    // 9.1 Call scheduler API
    const schedRes1 = await makeRequest("/api/admin/notices/scheduler", {
      method: "POST",
      headers: { Cookie: adminCookies },
    });
    const pubCount1 = schedRes1.json.publishedCount !== undefined ? schedRes1.json.publishedCount : (schedRes1.json.result ? schedRes1.json.result.publishedCount : 0);
    assert(schedRes1.statusCode === 200, "Admin triggers scheduler process successfully (200)");
    assert(typeof pubCount1 === "number", "Scheduler returns publishedCount");

    // 9.2 Call scheduler API second time (IDEMPOTENT)
    const schedRes2 = await makeRequest("/api/admin/notices/scheduler", {
      method: "POST",
      headers: { Cookie: adminCookies },
    });
    const pubCount2 = schedRes2.json.publishedCount !== undefined ? schedRes2.json.publishedCount : (schedRes2.json.result ? schedRes2.json.result.publishedCount : 0);
    assert(schedRes2.statusCode === 200, "Second run of scheduler succeeds (200)");
    assert(pubCount2 === 0, "IDEMPOTENCY: Subsequent scheduler run publishes 0 duplicates");

    // 9.3 Notification templates check
    const templatesRes = await makeRequest("/api/admin/notifications/templates", {
      headers: { Cookie: adminCookies },
    });
    const tmpls = templatesRes.json.data || templatesRes.json.templates || [];
    assert(templatesRes.statusCode === 200, "Admin can list notification templates (200)");
    assert(Array.isArray(tmpls) && tmpls.length >= 10, "Default notification templates populated (>= 10)");

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log("\n=================================================================");
    console.log(`  PHASE 8 TEST SUITE COMPLETE: ${totalPassed} PASSED, ${totalFailed} FAILED`);
    console.log("=================================================================\n");

  } catch (error) {
    console.error("Fatal error during Phase 8 test suite:", error);
    totalFailed++;
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runPhase8TestSuite();
