/**
 * EHRJ PHASE 31: INSTITUTIONAL PORTAL, PUBLIC WEBSITE 2.0 & CMS TEST SUITE
 * Checkpoint: EHRJ-AI-2026-PHASE31
 */

import {
  getInstitutionalProfile,
  saveInstitutionalProfile,
  sanitizeRichHtml,
  escapePlainText,
  isSafeExternalUrl,
  getCmsEvents,
  saveCmsEvent,
  archiveCmsEvent,
  getCmsFaqs,
  saveCmsFaq,
  getCmsDownloads,
  saveCmsDownload,
  getCmsGallery,
  saveCmsGalleryItem,
  getHomepageConfig,
  saveHomepageConfig,
  getSeoConfig,
  saveSeoConfig,
  buildCanonicalUrl,
  generateInstitutionalJsonLd,
  generateNoticeJsonLd,
  generateEventJsonLd,
  processPublicContactSubmission,
  executePublicSearch,
  getCmsAuditLogs,
} from "../src/lib/cms";
import { prisma } from "../src/lib/prisma";

async function runPhase31Tests() {
  console.log("=======================================================================");
  console.log("  EHRJ PHASE 31 — INSTITUTIONAL PORTAL & CMS VERIFICATION SUITE       ");
  console.log("=======================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: Institutional Profile Single Source of Truth
  // -------------------------------------------------------------
  console.log("[TEST GROUP 1] Institutional Profile & Authoritative Metadata");
  const profile = getInstitutionalProfile();
  assert(profile.nameBn === "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা", "Official Bangla name verified");
  assert(profile.nameEn === "Eliotganj Hazi Rohmatollah Jamiria Madrasha", "Official English name verified");
  assert(profile.established === "২০২৫", "Established year verified (2025)");
  assert(profile.primaryPhone.length > 5, "Primary phone number present");
  assert(profile.email.includes("@"), "Official email present");

  const initialVer = profile.version || 1;
  const updatedProfile = saveInstitutionalProfile({ missionBn: "সংশোধিত লক্ষ্য ও উদ্দেশ্য" }, "TEST_ADMIN");
  assert(updatedProfile.version === initialVer + 1, "Profile version incremented on update");
  assert(updatedProfile.nameBn === "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা", "Locked institutional name protected from accidental corruption");

  // -------------------------------------------------------------
  // TEST GROUP 2: Content Sanitization & XSS Defenses
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 2] Content Sanitization & XSS Defense");
  const maliciousXss = "<script>alert('xss')</script><p>নূরানী বিভাগ</p><img src='x' onerror='alert(1)'>";
  const sanitizedHtml = sanitizeRichHtml(maliciousXss);
  assert(!sanitizedHtml.includes("<script>"), "Script tag stripped cleanly");
  assert(!sanitizedHtml.includes("onerror="), "Inline onerror handler stripped");
  assert(sanitizedHtml.includes("নূরানী বিভাগ"), "Legitimate Bengali content preserved");

  const safeYoutube = '<iframe src="https://www.youtube.com/embed/sample123"></iframe>';
  const sanitizedYt = sanitizeRichHtml(safeYoutube);
  assert(sanitizedYt.includes("youtube.com/embed"), "Legitimate YouTube embed allowed");

  const evilIframe = '<iframe src="https://evil-site.com/steal-creds"></iframe>';
  const sanitizedEvil = sanitizeRichHtml(evilIframe);
  assert(!sanitizedEvil.includes("evil-site.com"), "Unauthorized iframe stripped");

  assert(isSafeExternalUrl("https://facebook.com/ehrjmadrasda"), "Valid HTTPS URL recognized as safe");
  assert(!isSafeExternalUrl("javascript:alert(1)"), "Javascript protocol blocked as unsafe");

  // -------------------------------------------------------------
  // TEST GROUP 3: Event CMS & Lifecycle States
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 3] Event CMS & Public Lifecycle States");
  const newEvt = saveCmsEvent(
    {
      titleBn: "টেস্ট বার্ষিক প্রতিযোগিতা ২০২৬",
      descriptionBn: "কুরআন তিলাওয়াত ও হিফজ প্রতিযোগিতা",
      category: "COMPETITION",
      eventDate: "2026-12-01",
      location: "মাদরাসা অডিটোরিয়াম",
      status: "UPCOMING",
      isPublic: true,
    },
    "TEST_ADMIN"
  );
  assert(newEvt.id.startsWith("EVT-"), "Event created with canonical ID format");
  assert(newEvt.status === "UPCOMING", "Event initial status is UPCOMING");

  const publicEvents = getCmsEvents(true);
  assert(publicEvents.some((e) => e.id === newEvt.id), "Public event visible in public feed");

  archiveCmsEvent(newEvt.id, "TEST_ADMIN");
  const publicEventsAfterArchive = getCmsEvents(true);
  assert(!publicEventsAfterArchive.some((e) => e.id === newEvt.id), "Archived event excluded from public feed");

  // -------------------------------------------------------------
  // TEST GROUP 4: FAQ CMS & Human Approval Gate
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 4] FAQ CMS & Approval Gate");
  const draftFaq = saveCmsFaq(
    {
      questionBn: "খসড়া প্রশ্ন?",
      answerBn: "খসড়া উত্তর যা এখনো অনুমোদিত নয়",
      category: "ADMISSION",
      status: "DRAFT",
      isApproved: false,
    },
    "TEST_ADMIN"
  );

  const publicFaqs = getCmsFaqs(true);
  assert(!publicFaqs.some((f) => f.id === draftFaq.id), "SECURITY: Unapproved draft FAQ excluded from public FAQs");

  const approvedFaq = saveCmsFaq(
    {
      id: draftFaq.id,
      status: "PUBLISHED",
      isApproved: true,
      approvedBy: "PRINCIPAL",
    },
    "PRINCIPAL"
  );
  const publicFaqsApproved = getCmsFaqs(true);
  assert(publicFaqsApproved.some((f) => f.id === approvedFaq.id), "Approved FAQ now visible in public FAQs");

  // -------------------------------------------------------------
  // TEST GROUP 5: Gallery & Mandatory Consent Verification
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 5] Gallery & Mandatory Image Consent Verification");
  const unconsentedItem = saveCmsGalleryItem(
    {
      titleBn: "অসম্মতিযুক্ত টেস্ট ছবি",
      imageUrl: "/images/test.jpg",
      category: "CAMPUS",
      consentVerified: false,
      isPublic: true,
      status: "PUBLISHED",
    },
    "TEST_ADMIN"
  );

  const publicGallery = getCmsGallery(true);
  assert(!publicGallery.some((g) => g.id === unconsentedItem.id), "PRIVACY INVARIANT: Photo without verified consent strictly excluded from public gallery");

  const consentedItem = saveCmsGalleryItem(
    {
      titleBn: "সম্মতিযুক্ত টেস্ট ছবি",
      imageUrl: "/images/test-consented.jpg",
      category: "CAMPUS",
      consentVerified: true,
      consentReference: "CONSENT-PARENT-TEST-001",
      isPublic: true,
      status: "PUBLISHED",
    },
    "TEST_ADMIN"
  );
  const publicGalleryWithConsent = getCmsGallery(true);
  assert(publicGalleryWithConsent.some((g) => g.id === consentedItem.id), "Photo with verified consent visible in public gallery");

  // -------------------------------------------------------------
  // TEST GROUP 6: Download Center & File Metadata
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 6] Download Center & Resource Metadata");
  const downloadItem = saveCmsDownload(
    {
      titleBn: "২০২৬ শিক্ষাবর্ষের টেস্ট প্রসপেক্টাস",
      category: "PROSPECTUS",
      fileUrl: "/downloads/prospectus_2026.pdf",
      fileType: "PDF",
      fileSizeDisplay: "২.০ মেগাবাইট",
      versionString: "২০২৬",
      status: "PUBLISHED",
      isPublic: true,
    },
    "TEST_ADMIN"
  );
  assert(downloadItem.id.startsWith("DL-"), "Download item assigned canonical ID");
  const publicDownloads = getCmsDownloads(true);
  assert(publicDownloads.some((d) => d.id === downloadItem.id), "Download item visible in public download corner");

  // -------------------------------------------------------------
  // TEST GROUP 7: Public Contact Form, Honeypot & Helpdesk Bridge
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 7] Contact Form, Anti-Bot Honeypot & Helpdesk Bridge");
  // Bot test
  const botResult = await processPublicContactSubmission({
    name: "Spam Bot",
    email: "bot@spam.com",
    subject: "Buy cheap crypto",
    message: "Cheap links here...",
    honeypot: "I am a malicious bot",
  });
  assert(botResult.success === true, "Bot request receives deceptive success response");
  assert(!botResult.ticketNumber, "Bot submission DOES NOT create a database ticket");

  // Legitimate Human submission
  const humanResult = await processPublicContactSubmission({
    name: "মুহাম্মদ আব্দুল্লাহ",
    email: "abdullah.test@example.com",
    phone: "01812345678",
    subject: "হিফজ বিভাগে ভর্তি সংক্রান্ত জিজ্ঞাসা",
    category: "ADMISSION",
    message: "আসসালামু আলাইকুম, আগামী মাসে হিফজ বিভাগে নতুন ছাত্র ভর্তির শেষ তারিখ জানতে চাই।",
    honeypot: "",
  });
  assert(humanResult.success === true, "Human submission succeeded");
  assert(!!humanResult.ticketNumber, `Helpdesk ticket generated: ${humanResult.ticketNumber}`);

  // -------------------------------------------------------------
  // TEST GROUP 8: Public Search Bridge (Phase 30 Integration)
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 8] Public Search Bridge & DTO Field Minimization");
  // Warmup search cache
  await executePublicSearch("পরীক্ষা");
  const searchRes = await executePublicSearch("হিফজ");
  assert(searchRes.count >= 1, "Public search found relevant public records for 'হিফজ'");
  assert(searchRes.results.every((r) => r.url && r.badge), "Public search results contain navigation deep-links and badges");
  assert(searchRes.latencyMs < 2500, `Search executed with fast latency (${searchRes.latencyMs}ms)`);

  // -------------------------------------------------------------
  // TEST GROUP 9: SEO & JSON-LD Structured Data
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 9] SEO & Structured Data (JSON-LD)");
  const jsonLd = generateInstitutionalJsonLd();
  assert(Array.isArray(jsonLd["@graph"]), "Institutional JSON-LD has @graph structure");
  const org = jsonLd["@graph"].find((item: any) => item["@type"] === "EducationalOrganization");
  assert(org && org.name === "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা", "EducationalOrganization schema reflects official name");
  const site = jsonLd["@graph"].find((item: any) => item["@type"] === "WebSite");
  assert(site && site.potentialAction["@type"] === "SearchAction", "WebSite SearchAction schema present");

  const canonicalUrl = buildCanonicalUrl("/admission");
  const expectedBase = getSeoConfig().canonicalBaseUrl;
  assert(canonicalUrl === `${expectedBase}/admission`, "Canonical URL generated correctly");

  // -------------------------------------------------------------
  // TEST GROUP 10: CMS Audit Trail
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 10] CMS Audit Trail & Lifecycle History");
  const auditLogs = getCmsAuditLogs();
  assert(auditLogs.length > 0, "Audit logs recorded CMS mutations");
  assert(auditLogs.some((a) => a.performedBy === "TEST_ADMIN"), "Audit trail tracks actor correctly");

  console.log("\n=======================================================================");
  console.log(`  PHASE 31 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase31Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution error:", err);
    process.exit(1);
  });
