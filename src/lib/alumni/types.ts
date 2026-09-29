/**
 * EHRJ Alumni, Former Student & Community Relationship Engine Types
 * Checkpoint: EHRJ-AI-2026-PHASE36
 */

export type AlumniStatus =
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "ACTIVE"
  | "INACTIVE"
  | "REJECTED"
  | "DECEASED"
  | "OPTED_OUT"
  | "ARCHIVED";

export type AlumniRelationshipType =
  | "COMPLETED_GRADUATE"      // তাকমীল / দাওরায়ে হাদিস সম্পন্ন
  | "HIFZ_COMPLETED"          // হিফজুল কুরআন সমাপনকারী
  | "TRANSFERRED_STUDENT"     // অন্য প্রতিষ্ঠানে স্থানান্তরিত
  | "FORMER_STUDENT"          // প্রাক্তন শিক্ষার্থী
  | "FORMER_TEACHER"          // প্রাক্তন শিক্ষক
  | "APPROVED_SUPPORTER"      // অনুমোদিত শুভানুধ্যায়ী
  | "LEGACY_ALUMNI";          // ঐতিহাসিক/ডিজিটাল-পূর্ব প্রাক্তন ছাত্র

export type GroupType =
  | "SESSION_GROUP"           // শিক্ষাবর্ষ ভিত্তিক (যেমন: ব্যাচ ২০২৪)
  | "CLASS_GROUP"             // জামাত ভিত্তিক (যেমন: দাওরায়ে হাদিস)
  | "GEOGRAPHIC_GROUP"        // এলাকা/প্রবাসী পরিষদ (যেমন: ঢাকা চ্যাপ্টার, মধ্যপ্রাচ্য)
  | "PROFESSION_GROUP"        // পেশাজীবী (যেমন: ইমাম ও খতিব, শিক্ষক, উদ্যোক্তা)
  | "VOLUNTEER_GROUP"         // সমাজসেবা ও ত্রাণ স্বেচ্ছাসেবক
  | "INTEREST_GROUP";         // বিশেষ আগ্রহ ও গবেষণা

export type VolunteerStatus =
  | "INTERESTED"
  | "APPLIED"
  | "REVIEWING"
  | "APPROVED"
  | "ACTIVE"
  | "COMPLETED"
  | "DECLINED"
  | "WITHDRAWN";

export type MentorshipRequestStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "CONNECTED"
  | "COMPLETED"
  | "REJECTED";

export interface AlumniPrivacyPreference {
  isProfilePublic?: boolean;          // Public web visibility
  showEmail?: boolean;                // Hide email by default
  showPhone?: boolean;                // Hide phone by default
  showLocation?: boolean;             // Show current city/country
  showProfession?: boolean;           // Show current career/job
  showInDirectory?: boolean;          // Include in alumni directory
  allowMentorshipContact?: boolean;   // Open to receiving mentorship requests
  allowEventInvites?: boolean;        // Receive reunion/event invitations
  allowNewsletter?: boolean;          // Receive institutional newsletter

  // Aliases for UI & Test compatibility
  showInPublicDirectory?: boolean;
  allowDirectContact?: boolean;
  sharePhoneWithApprovedAlumni?: boolean;
  shareEmailWithApprovedAlumni?: boolean;
  allowMentorshipRequests?: boolean;
}

export interface SanitizedAlumniProfile {
  id: string;
  studentId: string;
  fullNameBn: string;
  fullNameEn?: string;
  passOutYear?: number;
  department?: string;
  currentProfession?: string;
  currentOrganization?: string;
  currentCity?: string;
  currentCountry?: string;
  bioBn?: string;
  skills?: string[];
  isVerified: boolean;
  isLegacy: boolean;
  publicPhone?: string;
  publicEmail?: string;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
  };
}

export interface AlumniProfile {
  id: string; // Canonical: EHRJ-ALM-YYYY-XXXXXX
  relationshipType: AlumniRelationshipType;
  status: AlumniStatus;
  
  // Authoritative Historical Student Link
  studentId?: string;                // Prisma Student.id
  studentIdNumber?: string;          // e.g. "EHRJ-2022-00123"
  isLegacy: boolean;                 // True if pre-ERP historical alumni
  legacySourceNote?: string;         // e.g. "১৯৯৫ সালের দাওরায়ে হাদিস খাতা"
  
  // Historical Institutional Academic Snapshot (Immutable)
  admissionYear?: number;
  completionYear?: number;
  passOutYear?: number;              // Alias for completionYear
  department?: string;               // e.g. "Hifz", "Kitab", "General"
  lastSessionId?: string;
  lastSessionName?: string;          // e.g. "২০২১-২০২২ শিক্ষাবর্ষ"
  lastClassId?: string;
  lastClassNameBn?: string;          // e.g. "দাওরায়ে হাদিস (তাকমীল)"
  certificateNumbers?: string[];     // References to Prisma Certificate
  enrollmentId?: string;
  
  // Identity (Self-Reported / Verified)
  fullNameBn: string;
  fullNameEn?: string;
  email?: string;
  phone?: string;
  currentCity?: string;
  currentCountry?: string;
  photoUrl?: string;
  bioBn?: string;
  bioEn?: string;
  
  // Current Professional & Educational Information (Self-Reported)
  profession?: string;               // e.g. "ইমাম ও খতিব", "মুহাদ্দিস", "ব্যবসায়ী"
  currentProfession?: string;        // Alias for profession
  organization?: string;             // e.g. "বায়তুল মুকাররম জাতীয় মসজিদ"
  currentOrganization?: string;      // Alias for organization
  designation?: string;
  highestDegree?: string;
  skills?: string[];                 // e.g. ["আরবি ভাষা", "কিরাত", "ফিকহ", "আইটি"]
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  userId?: string;
  
  // Privacy & Verification Controls
  privacy: AlumniPrivacyPreference;
  privacyPreferences?: AlumniPrivacyPreference; // Alias for privacy
  isVerified?: boolean;
  verifiedAt?: string;
  verifiedByUserId?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  
  // Engagement Summary
  volunteerHoursTotal: number;
  mentorshipSessionsCount: number;
  eventsAttendedCount: number;
  contributionsTotalBdt: number;
  
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlumniGroup {
  id: string; // EHRJ-ALM-GRP-YYYY-XXXX
  code?: string;
  nameBn: string;
  nameEn?: string;
  type: GroupType;
  descriptionBn: string;
  descriptionEn?: string;
  sessionYear?: number;
  batchYear?: number;
  department?: string;
  locationScope?: string;
  region?: string;
  profession?: string;
  maxMembers?: number;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  createdBy: string;
}

export interface AlumniGroupMembership {
  id: string;
  groupId: string;
  alumniId: string;
  alumniNameBn: string;
  role: "MEMBER" | "MODERATOR" | "COORDINATOR";
  status: "PENDING" | "APPROVED" | "REJECTED";
  joinedAt: string;
  approvedBy?: string;
  note?: string;
  rejectionReason?: string;
}

export interface AlumniVolunteerOpportunity {
  id: string;
  titleBn: string;
  titleEn?: string;
  descriptionBn: string;
  descriptionEn?: string;
  category: "TEACHING_ASSIST" | "EVENT_SUPPORT" | "CAREER_GUIDANCE" | "COMMUNITY_RELIEF" | "INSTITUTIONAL_PROJECT" | string;
  eventId?: string; // Phase 35 Event reference if event-related
  startAt?: string;
  endAt?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  requiredVolunteers?: number;
  maxVolunteers?: number;
  appliedCount: number;
  status: "OPEN" | "CLOSED" | "COMPLETED";
  createdAt: string;
}

export interface AlumniVolunteerApplication {
  id: string;
  opportunityId: string;
  opportunityTitleBn: string;
  alumniId: string;
  alumniNameBn: string;
  alumniPhone?: string;
  motivationBn: string;
  statementOfIntent?: string;
  availabilityNote?: string;
  status: VolunteerStatus;
  hoursContributed?: number;
  hoursServed?: number;
  feedbackNotes?: string;
  reviewNotes?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlumniMentorshipProfile {
  alumniId: string;
  alumniNameBn: string;
  profession: string;
  organization?: string;
  expertiseTopics: string[];        // e.g. "মাদরাসা উচ্চশিক্ষা", "বিসিএস ও সরকারি চাকরি", "হিফজ শিক্ষকতা"
  availableDays?: string[];
  maxMentees: number;
  currentMenteesCount: number;
  isAcceptingMentees?: boolean;
  preferredMode?: "ONLINE" | "IN_PERSON" | "HYBRID";
  linkedinUrl?: string;
  bio?: string;
  status: "AVAILABLE" | "BUSY" | "PAUSED";
  createdAt: string;
}

export interface AlumniMentorshipRequest {
  id: string;
  alumniId: string;
  mentorAlumniId?: string;
  alumniNameBn: string;
  studentId: string;
  studentNameBn: string;
  studentIdNumber: string;
  guardianId?: string;
  topic: string;
  questionBn?: string;
  goalsNote?: string;
  preferredSchedule?: string;
  status: MentorshipRequestStatus;
  reviewedByUserId?: string;
  facilitatorAdminId?: string;
  facilitationNotes?: string;
  outcomeNotes?: string;
  institutionalNotes?: string;
  connectedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AlumniContribution {
  id: string;
  alumniId: string;
  alumniNameBn: string;
  type: "FINANCIAL" | "IN_KIND" | "VOLUNTEER_EFFORT";
  fund?: "GENERAL" | "LILLAH" | "ZAKAT" | "CONSTRUCTION" | "ORPHAN_SUPPORT" | string;
  fundType?: "GENERAL" | "LILLAH" | "ZAKAT" | "CONSTRUCTION" | "ORPHAN_SUPPORT";
  amount?: number;
  currency?: string;
  inKindDescription?: string;
  purposeBn?: string;
  purposeEn?: string;
  isPubliclyVisible?: boolean;
  contributionDate?: string;
  status?: "PENDING" | "VERIFIED" | "CONFIRMED" | "CANCELLED";
  paymentReference?: string; // Reference to Phase 6 Finance Ledger
  amountBdt?: number;
  hours?: number;
  descriptionBn?: string;
  financeTransactionId?: string; // Linked Phase 6 CashTransaction ID
  isPublicConsentGiven?: boolean; // Must be false by default
  recordedByUserId?: string;
  createdAt: string;
}

export interface AlumniImportRow {
  rowNumber: number;
  fullNameBn: string;
  phone?: string;
  email?: string;
  completionYear?: number;
  lastClassNameBn?: string;
  profession?: string;
  sourceNote?: string;
  status: "VALID" | "INVALID" | "POTENTIAL_DUPLICATE";
  validationError?: string;
  matchedExistingAlumniId?: string;
}

export interface AlumniImportBatch {
  id: string;
  fileName?: string;
  batchName?: string;
  sourceFormat?: "CSV" | "JSON";
  totalRows: number;
  validRows?: number;
  duplicateRows?: number;
  duplicatesCount?: number;
  importedRows?: number;
  importedCount?: number;
  errorsCount?: number;
  status?: "PENDING_REVIEW" | "APPROVED_IMPORTED" | "REJECTED";
  rows?: AlumniImportRow[];
  uploadedBy?: string;
  uploadedByUserId?: string;
  uploadedAt?: string;
  createdAt?: string;
}

export interface AlumniAuditEntry {
  id: string;
  alumniId?: string;
  action:
    | "CREATE_PROFILE"
    | "UPDATE_PROFILE"
    | "UPDATE_PRIVACY"
    | "VERIFY_ALUMNI"
    | "REJECT_VERIFICATION"
    | "STATUS_CHANGE"
    | "OPT_OUT"
    | "ARCHIVE_PROFILE"
    | "PROFILE_UPDATED"
    | "GROUP_JOINED"
    | "JOIN_GROUP"
    | "APPROVE_GROUP_MEMBER"
    | "VOLUNTEER_APPLIED"
    | "APPLY_VOLUNTEER"
    | "VOLUNTEER_REVIEWED"
    | "APPROVE_VOLUNTEER"
    | "VOLUNTEER_HOURS_LOGGED"
    | "VOLUNTEER_OPP_CREATED"
    | "MENTOR_REGISTERED"
    | "MENTORSHIP_REQUEST"
    | "REQUEST_MENTORSHIP"
    | "MENTORSHIP_REVIEWED"
    | "APPROVE_MENTORSHIP"
    | "MENTORSHIP_COMPLETED"
    | "RECORD_CONTRIBUTION"
    | "CONTRIBUTION_RECORDED"
    | "BATCH_IMPORT"
    | "IMPORT_BATCH"
    | "MERGE_ALUMNI"
    | (string & {});
  actorId: string;
  actorRole: string;
  details: string;
  timestamp: string;
}

export interface AlumniDirectoryFilter {
  search?: string;
  sessionYear?: number;
  className?: string;
  profession?: string;
  city?: string;
  country?: string;
  page?: number;
  limit?: number;
}
