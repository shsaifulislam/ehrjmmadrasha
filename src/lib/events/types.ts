/**
 * EHRJ Institutional Student Life, Events, Activities & Engagement Engine Types
 * Checkpoint: EHRJ-AI-2026-PHASE35
 */

export type EventStatus =
  | "DRAFT"
  | "REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ARCHIVED"
  | "CANCELLED";

export type EventAudienceType =
  | "ALL_STUDENTS"
  | "SPECIFIC_SESSION"
  | "SPECIFIC_CLASS"
  | "SPECIFIC_SECTION"
  | "BOYS_ONLY"
  | "GIRLS_ONLY"
  | "RESIDENTIAL_ONLY"
  | "NON_RESIDENTIAL_ONLY"
  | "DAY_CARE_ONLY"
  | "SPECIFIC_STUDENTS"
  | "GUARDIANS"
  | "TEACHERS"
  | "PUBLIC";

export type RegistrationStatus =
  | "PENDING"
  | "APPROVED"
  | "WAITLISTED"
  | "CONFIRMED"
  | "CANCELLED"
  | "REJECTED";

export type EventAttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "EXCUSED";

export type AwardRecognitionType =
  | "FIRST_PLACE"
  | "SECOND_PLACE"
  | "THIRD_PLACE"
  | "WINNER"
  | "RUNNER_UP"
  | "SPECIAL_RECOGNITION"
  | "APPRECIATION"
  | "PARTICIPATION"
  | "HONORABLE_MENTION";

export type CertificateCategory =
  | "PARTICIPATION"
  | "WINNER"
  | "APPRECIATION"
  | "VOLUNTEER"
  | "ACHIEVEMENT";

export interface EventTypeConfig {
  id: string;
  code: string;
  nameBn: string;
  nameEn: string;
  descriptionBn?: string;
  isCompetitive: boolean;
  requiresRegistration: boolean;
  requiresAttendance: boolean;
  awardsCertificates: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface EventAudienceRule {
  audienceTypes: EventAudienceType[];
  sessionIds?: string[];
  classIds?: string[];
  sectionIds?: string[];
  studentIds?: string[];
  genders?: ("MALE" | "FEMALE")[];
  residentialStatuses?: ("RESIDENTIAL" | "NON_RESIDENTIAL" | "DAY_CARE")[];
  minAgeYears?: number;
  maxAgeYears?: number;
  notes?: string;
}

export interface InstitutionalEvent {
  id: string; // Format: EHRJ-EVT-YYYY-XXXXXX
  typeCode: string;
  titleBn: string;
  titleEn?: string;
  titleAr?: string;
  descriptionBn: string;
  descriptionEn?: string;
  organizer: string;
  sessionId: string;
  sessionName?: string;
  audienceRule: EventAudienceRule;
  
  // Timing & Venue
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  registrationOpensAt?: string; // ISO datetime
  registrationClosesAt?: string; // ISO datetime
  venueText: string;
  resourceId?: string; // Phase 33 Resource ID e.g. RES-001 (Darul Hadith Auditorium)
  calendarEventId?: string; // Linked Phase 33 Calendar event
  bookingId?: string; // Linked Phase 33 Resource booking
  
  // Capacity & Registration Requirements
  isRegistrationRequired: boolean;
  maxCapacity: number; // 0 for unlimited
  registeredCount: number;
  waitlistCapacity: number;
  waitlistedCount: number;
  isPublic: boolean;
  status: EventStatus;
  
  // Personnel / Assignment
  leadTeacherId?: string;
  assignedTeacherIds?: string[];
  
  // Materials & Media
  bannerUrl?: string;
  attachments?: Array<{
    name: string;
    url: string;
    sizeBytes?: number;
    mimeType?: string;
  }>;
  instructionsBn?: string;
  contactPhone?: string;
  contactEmail?: string;
  
  // Financial reference (Phase 6)
  hasFee: boolean;
  feeAmount?: number;
  feeCategoryId?: string;
  
  // Cancellation tracking
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  
  // Metadata
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface EventRegistration {
  id: string; // Format: EHRJ-EVT-REG-YYYY-XXXXXX
  eventId: string;
  studentId: string;
  studentNameBn: string;
  studentIdNumber: string;
  guardianId?: string;
  guardianNameBn?: string;
  guardianPhone?: string;
  classId?: string;
  classNameBn?: string;
  sectionId?: string;
  sectionNameBn?: string;
  rollNumber?: number;
  
  status: RegistrationStatus;
  registeredAt: string;
  registeredByRole: "GUARDIAN" | "STUDENT" | "TEACHER" | "ADMIN";
  registeredByUserId: string;
  
  consentGiven: boolean;
  notes?: string;
  
  // Waitlist position if applicable
  waitlistPosition?: number;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface EventAttendanceRecord {
  id: string; // Format: EHRJ-EVT-ATT-YYYY-XXXXXX
  eventId: string;
  studentId: string;
  studentNameBn: string;
  studentIdNumber: string;
  registrationId?: string;
  
  status: EventAttendanceStatus;
  checkInAt?: string; // ISO datetime
  checkOutAt?: string; // ISO datetime
  recordedByTeacherId?: string;
  recordedByTeacherName?: string;
  recordedMethod: "QR_SCAN" | "MANUAL_PANEL" | "OFFLINE_SYNC";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventCompetitionResult {
  id: string; // Format: EHRJ-EVT-RES-YYYY-XXXXXX
  eventId: string;
  studentId: string;
  studentNameBn: string;
  studentIdNumber: string;
  competitionCategory: string; // e.g. "হিফজ ৩০ পারা", "ক্বেরাত গ্রুপ ক", "বাংলা বিতর্ক"
  
  score?: number; // Out of 100 or maxScore
  maxScore?: number;
  rank?: number; // 1, 2, 3...
  awardType?: AwardRecognitionType;
  judgeName?: string;
  judgeCommentsBn?: string;
  isPublished: boolean;
  publishedAt?: string;
  evaluatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventCertificateLink {
  id: string;
  eventId: string;
  studentId: string;
  studentNameBn: string;
  certificateId: string; // Prisma Certificate.id
  certificateNumber: string; // Format: EHRJ-EVT-CERT-YYYY-XXXXXX
  verificationCode: string; // Format: EHRJ-VER-YYYY-XXXXX
  category: CertificateCategory;
  titleBn: string;
  issueDate: string;
  qrCodeUrl?: string;
  isRevoked: boolean;
  revokedReason?: string;
  createdAt: string;
}

export interface EventFeedback {
  id: string;
  eventId: string;
  studentId?: string;
  guardianId?: string;
  isAnonymous: boolean;
  rating: number; // 1 to 5
  commentsBn: string;
  suggestionsBn?: string;
  createdAt: string;
}

export interface EventAuditEntry {
  id: string;
  eventId: string;
  action:
    | "CREATE_EVENT"
    | "UPDATE_EVENT"
    | "STATUS_CHANGE"
    | "REGISTER_STUDENT"
    | "UPDATE_REGISTRATION"
    | "CANCEL_REGISTRATION"
    | "PROMOTE_WAITLIST"
    | "MARK_ATTENDANCE"
    | "RECORD_RESULT"
    | "PUBLISH_RESULTS"
    | "ISSUE_CERTIFICATE"
    | "REVOKE_CERTIFICATE"
    | "CANCEL_EVENT"
    | "CALENDAR_SYNC";
  actorId: string;
  actorRole: string;
  actorName?: string;
  details: string;
  timestamp: string;
}

export interface EventSummaryReport {
  event: InstitutionalEvent;
  totalRegistered: number;
  totalWaitlisted: number;
  totalApproved: number;
  totalPresent: number;
  totalAbsent: number;
  attendanceRatePercent: number;
  resultsCount: number;
  topAchievements: EventCompetitionResult[];
  certificatesIssuedCount: number;
  feedbackSummary: {
    totalFeedbacks: number;
    averageRating: number;
  };
}
