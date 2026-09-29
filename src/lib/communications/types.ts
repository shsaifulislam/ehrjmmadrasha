/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 32
 * Institutional Communication, Community Engagement & Outreach Engine
 * Type Definitions & Contracts
 * Checkpoint: EHRJ-AI-2026-PHASE32
 */

export type CommunicationChannel = "PORTAL" | "EMAIL" | "PUBLIC_WEBSITE";

export type CommunicationType =
  | "OFFICIAL_NOTICE"
  | "ANNOUNCEMENT"
  | "REMINDER"
  | "ALERT"
  | "EVENT_INVITATION"
  | "ADMISSION_UPDATE"
  | "PAYMENT_REMINDER"
  | "PAYMENT_CONFIRMATION"
  | "RESULT_NOTIFICATION"
  | "DOCUMENT_NOTIFICATION"
  | "LIBRARY_REMINDER"
  | "HELPDESK_UPDATE"
  | "SYSTEM_ALERT"
  | "DIGEST";

export type AudienceType =
  | "ALL_PUBLIC_USERS"
  | "ALL_GUARDIANS"
  | "ALL_TEACHERS"
  | "ALL_PRINCIPAL_OVERSIGHT"
  | "CLASS"
  | "JAMAT"
  | "SECTION"
  | "STUDENT_GROUP"
  | "GUARDIAN_GROUP"
  | "RESIDENTIAL_GROUP"
  | "ADMISSION_APPLICANTS"
  | "FINANCE_TARGET_GROUP"
  | "LIBRARY_TARGET_GROUP"
  | "EMPLOYEE_GROUP"
  | "CUSTOM_FILTER";

export interface AudienceFilter {
  classId?: string;
  jamatCode?: string;
  sectionId?: string;
  residentialStatus?: "RESIDENTIAL" | "NON_RESIDENTIAL" | "DAY_CARE";
  applicantStatus?: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  financeMinDue?: number;
  libraryOverdueOnly?: boolean;
  customUserIds?: string[];
  searchQuery?: string;
}

export interface ResolvedRecipientItem {
  recipientId: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  recipientType: "GUARDIAN" | "TEACHER" | "STAFF" | "ADMIN" | "PUBLIC";
  studentId?: string;
  studentNameBn?: string;
  studentRoll?: number;
  classTitle?: string;
  reasonForInclusion: string;
  extraContext?: Record<string, any>;
}

export interface AudienceSnapshot {
  snapshotId: string;
  campaignId: string;
  audienceType: AudienceType;
  audienceFilter: AudienceFilter;
  resolvedAt: string;
  totalCount: number;
  recipients: ResolvedRecipientItem[];
}

export type CampaignStatus =
  | "DRAFT"
  | "REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "SENDING"
  | "SENT"
  | "PARTIALLY_SENT"
  | "FAILED"
  | "CANCELLED"
  | "ARCHIVED";

export interface CampaignMetrics {
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  suppressed: number;
}

export interface CommunicationCampaign {
  id: string; // e.g. "EHRJ-COM-2026-000001"
  title: string;
  objective: string;
  communicationType: CommunicationType;
  channels: CommunicationChannel[];
  audienceType: AudienceType;
  audienceFilter: AudienceFilter;
  templateCode?: string;
  templateVersion: number;
  subject: string;
  body: string;
  variables: Record<string, any>;
  actionUrl?: string;
  publicCmsNoticeId?: string;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  status: CampaignStatus;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
  scheduledAt?: string;
  sentAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  snapshotId?: string;
  metrics: CampaignMetrics;
  deliveryResults?: Array<{
    recipientId: string;
    userId: string;
    channel: CommunicationChannel;
    destination: string;
    status: "SENT" | "DELIVERED" | "SUPPRESSED" | "FAILED";
    error?: string;
    dispatchedAt: string;
  }>;
}

export interface TemplateVersionHistoryItem {
  version: number;
  subjectTemplateBn: string;
  bodyTemplateBn: string;
  updatedAt: string;
  updatedBy: string;
  changeNote?: string;
}

export interface CommunicationTemplate {
  code: string; // Unique identifier e.g. "COM_EXAM_ROUTINE"
  nameBn: string;
  nameEn?: string;
  category: CommunicationType;
  subjectTemplateBn: string;
  subjectTemplateEn?: string;
  subjectTemplateAr?: string;
  bodyTemplateBn: string;
  bodyTemplateEn?: string;
  bodyTemplateAr?: string;
  allowedVariables: string[];
  supportedChannels: CommunicationChannel[];
  version: number;
  isMandatory: boolean;
  isActive: boolean;
  versionsHistory: TemplateVersionHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SuppressionRecord {
  id: string;
  email: string;
  reason: "BOUNCE_PERMANENT" | "INVALID_ADDRESS" | "USER_UNSUBSCRIBE" | "ADMIN_BLOCK";
  suppressedAt: string;
  sourceCampaignId?: string;
  notes?: string;
}

export interface DigestItem {
  title: string;
  category: string;
  summary: string;
  url: string;
  date: string;
}

export interface CommunicationDigest {
  id: string; // e.g. "DIG-2026-XXXXXX"
  digestType: "DAILY" | "WEEKLY";
  targetRole: "GUARDIAN" | "TEACHER" | "ADMIN";
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  totalItems: number;
  items: DigestItem[];
  status: "GENERATED" | "DISPATCHED";
  dispatchedRecipientsCount?: number;
}

export interface CommunicationAuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: string;
  action:
    | "CREATE_CAMPAIGN"
    | "UPDATE_CAMPAIGN"
    | "APPROVE_CAMPAIGN"
    | "SCHEDULE_CAMPAIGN"
    | "SEND_CAMPAIGN"
    | "TEST_SEND"
    | "DRY_RUN"
    | "CANCEL_CAMPAIGN"
    | "ARCHIVE_CAMPAIGN"
    | "CREATE_TEMPLATE"
    | "UPDATE_TEMPLATE"
    | "ADD_SUPPRESSION"
    | "REMOVE_SUPPRESSION"
    | "GENERATE_DIGEST";
  campaignId?: string;
  templateCode?: string;
  details: Record<string, any>;
}

export interface CommunicationOverviewMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  scheduledCampaigns: number;
  totalMessagesSent: number;
  totalDelivered: number;
  totalFailed: number;
  suppressionCount: number;
  templatesCount: number;
  recentCampaigns: CommunicationCampaign[];
}
