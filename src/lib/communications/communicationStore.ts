/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 32
 * Persistent Communication Store & Data Access Layer
 * Checkpoint: EHRJ-AI-2026-PHASE32
 */

import * as fs from "fs";
import * as path from "path";
import {
  CommunicationCampaign,
  AudienceSnapshot,
  CommunicationTemplate,
  SuppressionRecord,
  CommunicationDigest,
  CommunicationAuditEntry,
  CommunicationOverviewMetrics,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "communications");

function ensureDirectoryExists(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureDirectoryExists();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf-8");
    return defaultValue;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[CommunicationStore] Error parsing ${filename}:`, err);
    return defaultValue;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  ensureDirectoryExists();
  const filePath = path.join(DATA_DIR, filename);
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tempPath, filePath);
}

// =================================================================
// 1. DEFAULT COMMUNICATION TEMPLATES
// =================================================================

const DEFAULT_COMMUNICATION_TEMPLATES: CommunicationTemplate[] = [
  {
    code: "COM_EXAM_ROUTINE_ANNOUNCEMENT",
    nameBn: "পরীক্ষার রুটিন ও নির্দেশনা ঘোষণা",
    nameEn: "Exam Schedule & Instructions Announcement",
    category: "OFFICIAL_NOTICE",
    subjectTemplateBn: "আসন্ন পরীক্ষার সময়সূচি ও দিকনির্দেশনা: {{exam_name}}",
    subjectTemplateEn: "Upcoming Examination Schedule & Guidelines: {{exam_name}}",
    subjectTemplateAr: "إعلان جدول الامتحانات والتعليمات: {{exam_name}}",
    bodyTemplateBn: "মুহতারাম {{recipient_name}}, আগামী {{start_date}} তারিখ হতে অত্র মাদরাসার {{exam_name}} শুরু হতে যাচ্ছে। বিস্তারিত রুটিন ও আসন বিন্যাস শিক্ষার্থী ও অভিভাবক পোর্টালে প্রকাশ করা হয়েছে। সকল শিক্ষার্থীকে সময়মতো উপস্থিত থাকার নির্দেশ দেওয়া যাচ্ছে।",
    bodyTemplateEn: "Respected {{recipient_name}}, The {{exam_name}} will commence on {{start_date}}. Detailed schedule has been published on the student portal.",
    bodyTemplateAr: "المحترم {{recipient_name}}، ستبدأ امتحانات {{exam_name}} في تاريخ {{start_date}}.",
    allowedVariables: ["recipient_name", "exam_name", "start_date", "class_title"],
    supportedChannels: ["PORTAL", "EMAIL", "PUBLIC_WEBSITE"],
    version: 1,
    isMandatory: false,
    isActive: true,
    versionsHistory: [
      {
        version: 1,
        subjectTemplateBn: "আসন্ন পরীক্ষার সময়সূচি ও দিকনির্দেশনা: {{exam_name}}",
        bodyTemplateBn: "মুহতারাম {{recipient_name}}, আগামী {{start_date}} তারিখ হতে অত্র মাদরাসার {{exam_name}} শুরু হতে যাচ্ছে।",
        updatedAt: new Date().toISOString(),
        updatedBy: "SYSTEM_INIT",
        changeNote: "Initial default template",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    code: "COM_FEE_PAYMENT_DUE_REMINDER",
    nameBn: "বকেয়া মাসিক ফি পরিশোধের তাগিদপত্র",
    nameEn: "Monthly Fee Due Reminder",
    category: "PAYMENT_REMINDER",
    subjectTemplateBn: "জরুরি: শিক্ষার্থী {{student_name}}-এর বকেয়া ফি পরিশোধের অনুরোধ",
    subjectTemplateEn: "Reminder: Outstanding Fee Payment for {{student_name}}",
    bodyTemplateBn: "মুহতারাম {{guardian_name}}, আপনার সন্তান {{student_name}} (জামাত: {{class_title}}, রোল: {{roll}})-এর চলতি মাসের নির্ধারিত ফি বাবদ ৳{{amount}} টাকা বকেয়া রয়েছে (শেষ তারিখ: {{due_date}})। অনলাইন পোর্টাল অথবা মাদরাসা ক্যাশ কাউন্টারে উক্ত ফি পরিশোধের অনুরোধ করা হলো।",
    bodyTemplateEn: "Respected {{guardian_name}}, Outstanding fee of ৳{{amount}} for student {{student_name}} is due by {{due_date}}.",
    allowedVariables: ["guardian_name", "student_name", "class_title", "roll", "amount", "due_date"],
    supportedChannels: ["PORTAL", "EMAIL"],
    version: 1,
    isMandatory: false,
    isActive: true,
    versionsHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    code: "COM_ADMISSION_APPLICATION_UPDATE",
    nameBn: "ভর্তি আবেদন ও যাচাইকরণ অগ্রগতি",
    nameEn: "Admission Application Status Update",
    category: "ADMISSION_UPDATE",
    subjectTemplateBn: "ভর্তি আবেদন স্থিতি: ট্র্যাকিং নম্বর {{tracking_id}} - {{status_bn}}",
    subjectTemplateEn: "Admission Application Status: {{tracking_id}} - {{status_en}}",
    bodyTemplateBn: "মুহতারাম {{applicant_name}}, আপনার দাখিলকৃত ভর্তি আবেদন (ট্র্যাকিং আইডি: {{tracking_id}})-এর বর্তমান অবস্থা: '{{status_bn}}'। বিস্তারিত তথ্য ও পরবর্তী নির্দেশনার জন্য ওয়েবসাইট ভিজিট করুন।",
    allowedVariables: ["applicant_name", "tracking_id", "status_bn", "status_en", "action_url"],
    supportedChannels: ["PORTAL", "EMAIL"],
    version: 1,
    isMandatory: true,
    isActive: true,
    versionsHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    code: "COM_LIBRARY_OVERDUE_ALERT",
    nameBn: "লাইব্রেরি বই ফেরত বিলম্ব নোটিশ",
    nameEn: "Library Book Overdue Alert",
    category: "LIBRARY_REMINDER",
    subjectTemplateBn: "তাগিদপত্র: লাইব্রেরি বই ফেরত দেওয়ার মেয়াদ উত্তীর্ণ হয়েছে - {{book_title}}",
    subjectTemplateEn: "Alert: Overdue Library Book - {{book_title}}",
    bodyTemplateBn: "মুহতারাম {{recipient_name}}, আপনার নামে ইস্যুকৃত '{{book_title}}' বইটির ফেরত দেওয়ার নির্ধারিত মেয়াদ উত্তীর্ণ হয়েছে। দৈনিক বিলম্ব জরিমানা এড়াতে অবিলম্বে লাইব্রেরি শাখায় বইটি ফেরত দিন।",
    allowedVariables: ["recipient_name", "book_title", "accession_no", "due_date"],
    supportedChannels: ["PORTAL", "EMAIL"],
    version: 1,
    isMandatory: true,
    isActive: true,
    versionsHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    code: "COM_INSTITUTIONAL_EVENT_INVITATION",
    nameBn: "বার্ষিক ওয়াজ মাহফিল ও আলোচনা সভার দাওয়াত",
    nameEn: "Annual Program / Event Invitation",
    category: "EVENT_INVITATION",
    subjectTemplateBn: "আমন্ত্রণপত্র: ইলিয়টগঞ্জ মাদরাসার {{event_title}}",
    subjectTemplateEn: "Invitation: {{event_title}} at Eliotganj Madrasha",
    bodyTemplateBn: "আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ, ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার উদ্যোগে আগামী {{event_date}} তারিখে '{{event_title}}' অনুষ্ঠিত হতে যাচ্ছে। উক্ত বরকতময় মাহফিলে আপনার উপস্থিতি ও আন্তরিক দোয়া কামনা করছি।",
    allowedVariables: ["recipient_name", "event_title", "event_date", "location"],
    supportedChannels: ["PORTAL", "EMAIL", "PUBLIC_WEBSITE"],
    version: 1,
    isMandatory: false,
    isActive: true,
    versionsHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// =================================================================
// 2. TEMPLATES CRUD & VERSIONING
// =================================================================

export function getCommunicationTemplates(): CommunicationTemplate[] {
  return readJsonFile<CommunicationTemplate[]>("templates.json", DEFAULT_COMMUNICATION_TEMPLATES);
}

export function saveCommunicationTemplate(
  template: Partial<CommunicationTemplate> & { code: string; nameBn: string; category: any },
  actorId: string = "SYSTEM_ADMIN"
): CommunicationTemplate {
  const templates = getCommunicationTemplates();
  const existingIdx = templates.findIndex((t) => t.code === template.code);

  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    const existing = templates[existingIdx];
    const newVersion = existing.version + 1;

    const historyItem = {
      version: existing.version,
      subjectTemplateBn: existing.subjectTemplateBn,
      bodyTemplateBn: existing.bodyTemplateBn,
      updatedAt: now,
      updatedBy: actorId,
      changeNote: `Updated to v${newVersion}`,
    };

    const updated: CommunicationTemplate = {
      ...existing,
      ...template,
      version: newVersion,
      versionsHistory: [historyItem, ...(existing.versionsHistory || [])],
      updatedAt: now,
    };

    templates[existingIdx] = updated;
    writeJsonFile("templates.json", templates);
    recordCommunicationAudit({
      actorId,
      actorRole: "ADMIN",
      action: "UPDATE_TEMPLATE",
      templateCode: template.code,
      details: { version: newVersion },
    });
    return updated;
  } else {
    const created: CommunicationTemplate = {
      code: template.code,
      nameBn: template.nameBn,
      nameEn: template.nameEn,
      category: template.category,
      subjectTemplateBn: template.subjectTemplateBn || "বিজ্ঞপ্তি",
      subjectTemplateEn: template.subjectTemplateEn,
      subjectTemplateAr: template.subjectTemplateAr,
      bodyTemplateBn: template.bodyTemplateBn || "",
      bodyTemplateEn: template.bodyTemplateEn,
      bodyTemplateAr: template.bodyTemplateAr,
      allowedVariables: template.allowedVariables || ["recipient_name"],
      supportedChannels: template.supportedChannels || ["PORTAL", "EMAIL"],
      version: 1,
      isMandatory: template.isMandatory || false,
      isActive: template.isActive !== false,
      versionsHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    templates.push(created);
    writeJsonFile("templates.json", templates);
    recordCommunicationAudit({
      actorId,
      actorRole: "ADMIN",
      action: "CREATE_TEMPLATE",
      templateCode: template.code,
      details: { nameBn: template.nameBn },
    });
    return created;
  }
}

// =================================================================
// 3. CAMPAIGNS CRUD
// =================================================================

export function getCommunicationCampaigns(): CommunicationCampaign[] {
  return readJsonFile<CommunicationCampaign[]>("campaigns.json", []);
}

export function getCommunicationCampaignById(id: string): CommunicationCampaign | null {
  const campaigns = getCommunicationCampaigns();
  return campaigns.find((c) => c.id === id) || null;
}

export function saveCommunicationCampaign(campaign: CommunicationCampaign): void {
  const campaigns = getCommunicationCampaigns();
  const idx = campaigns.findIndex((c) => c.id === campaign.id);
  if (idx >= 0) {
    campaigns[idx] = { ...campaign, updatedAt: new Date().toISOString() };
  } else {
    campaigns.unshift(campaign);
  }
  writeJsonFile("campaigns.json", campaigns);
}

// =================================================================
// 4. AUDIENCE SNAPSHOTS
// =================================================================

export function getAudienceSnapshots(): AudienceSnapshot[] {
  return readJsonFile<AudienceSnapshot[]>("audience_snapshots.json", []);
}

export function getAudienceSnapshotById(snapshotId: string): AudienceSnapshot | null {
  const snapshots = getAudienceSnapshots();
  return snapshots.find((s) => s.snapshotId === snapshotId) || null;
}

export function saveAudienceSnapshot(snapshot: AudienceSnapshot): void {
  const snapshots = getAudienceSnapshots();
  const idx = snapshots.findIndex((s) => s.snapshotId === snapshot.snapshotId);
  if (idx >= 0) {
    snapshots[idx] = snapshot;
  } else {
    snapshots.push(snapshot);
  }
  writeJsonFile("audience_snapshots.json", snapshots);
}

// =================================================================
// 5. EMAIL SUPPRESSIONS & PREFERENCES
// =================================================================

export function getSuppressions(): SuppressionRecord[] {
  return readJsonFile<SuppressionRecord[]>("suppressions.json", []);
}

export function isEmailSuppressed(email: string): boolean {
  if (!email) return true;
  const list = getSuppressions();
  const normalized = email.trim().toLowerCase();
  return list.some((s) => s.email.toLowerCase() === normalized);
}

export function addSuppression(
  email: string,
  reason: SuppressionRecord["reason"],
  notes?: string,
  sourceCampaignId?: string,
  actorId: string = "SYSTEM"
): SuppressionRecord {
  const list = getSuppressions();
  const normalized = email.trim().toLowerCase();
  const existing = list.find((s) => s.email.toLowerCase() === normalized);
  if (existing) return existing;

  const record: SuppressionRecord = {
    id: `SUP-${Date.now().toString(36).toUpperCase()}`,
    email: normalized,
    reason,
    suppressedAt: new Date().toISOString(),
    notes,
    sourceCampaignId,
  };
  list.push(record);
  writeJsonFile("suppressions.json", list);

  recordCommunicationAudit({
    actorId,
    actorRole: "ADMIN",
    action: "ADD_SUPPRESSION",
    details: { email: normalized, reason },
  });

  return record;
}

export function removeSuppression(email: string, actorId: string = "SYSTEM_ADMIN"): boolean {
  const list = getSuppressions();
  const normalized = email.trim().toLowerCase();
  const filtered = list.filter((s) => s.email.toLowerCase() !== normalized);
  if (filtered.length !== list.length) {
    writeJsonFile("suppressions.json", filtered);
    recordCommunicationAudit({
      actorId,
      actorRole: "ADMIN",
      action: "REMOVE_SUPPRESSION",
      details: { email: normalized },
    });
    return true;
  }
  return false;
}

// =================================================================
// 6. DIGESTS
// =================================================================

export function getCommunicationDigests(): CommunicationDigest[] {
  return readJsonFile<CommunicationDigest[]>("digests.json", []);
}

export function saveCommunicationDigest(digest: CommunicationDigest): void {
  const digests = getCommunicationDigests();
  const idx = digests.findIndex((d) => d.id === digest.id);
  if (idx >= 0) {
    digests[idx] = digest;
  } else {
    digests.unshift(digest);
  }
  writeJsonFile("digests.json", digests);
}

// =================================================================
// 7. AUDIT LOGGING
// =================================================================

export function getCommunicationAuditLog(): CommunicationAuditEntry[] {
  return readJsonFile<CommunicationAuditEntry[]>("audit_log.json", []);
}

export function recordCommunicationAudit(entry: Omit<CommunicationAuditEntry, "id" | "timestamp">): void {
  const logs = getCommunicationAuditLog();
  const newEntry: CommunicationAuditEntry = {
    id: `AUD-COM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  logs.unshift(newEntry);
  if (logs.length > 500) logs.pop();
  writeJsonFile("audit_log.json", logs);
}

// =================================================================
// 8. OVERVIEW METRICS SYNTHESIS
// =================================================================

export function getCommunicationOverviewMetrics(): CommunicationOverviewMetrics {
  const campaigns = getCommunicationCampaigns();
  const suppressions = getSuppressions();
  const templates = getCommunicationTemplates();

  let totalMessagesSent = 0;
  let totalDelivered = 0;
  let totalFailed = 0;

  for (const c of campaigns) {
    totalMessagesSent += c.metrics?.sent || 0;
    totalDelivered += c.metrics?.delivered || 0;
    totalFailed += c.metrics?.failed || 0;
  }

  const activeCampaigns = campaigns.filter((c) =>
    ["SENDING", "SCHEDULED", "APPROVED", "REVIEW"].includes(c.status)
  ).length;

  const scheduledCampaigns = campaigns.filter((c) => c.status === "SCHEDULED").length;

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns,
    scheduledCampaigns,
    totalMessagesSent,
    totalDelivered,
    totalFailed,
    suppressionCount: suppressions.length,
    templatesCount: templates.length,
    recentCampaigns: campaigns.slice(0, 8),
  };
}
