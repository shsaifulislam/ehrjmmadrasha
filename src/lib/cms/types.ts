/**
 * EHRJ Institutional Portal, CMS & Digital Engagement Engine Types
 * Checkpoint: EHRJ-AI-2026-PHASE31
 */

export type CmsContentStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "SCHEDULED" | "EXPIRED" | "ARCHIVED";

export type EventStatus = "DRAFT" | "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED" | "ARCHIVED";

export type AdmissionState = "OPEN" | "UPCOMING" | "CLOSED" | "WAITLIST";

export type FaqCategory =
  | "ADMISSION"
  | "ACADEMIC"
  | "FEES"
  | "RESIDENTIAL"
  | "LIBRARY"
  | "DOCUMENTS"
  | "CONTACT"
  | "GENERAL";

export type GalleryCategory = "CAMPUS" | "ACADEMIC" | "EVENTS" | "STUDENTS" | "TEACHERS" | "FACILITIES";

export interface InstitutionalProfileData {
  nameBn: string;
  nameEn: string;
  nameAr: string;
  code: string;
  established: string;
  establishedEn: string;
  founder: string;
  principal: string;
  principalDesignationBn: string;
  principalDesignationEn: string;
  addressBn: string;
  addressEn: string;
  locationDetails: string;
  phones: string[];
  primaryPhone: string;
  email: string;
  adminEmail: string;
  socialLinks: {
    facebook: string;
    youtube: string;
    whatsappChannel: string;
  };
  missionBn: string;
  missionEn?: string;
  visionBn: string;
  visionEn?: string;
  historyBn: string;
  facilities: Array<{
    titleBn: string;
    descriptionBn: string;
    icon: string;
  }>;
  statistics: {
    totalStudentsDisplay: string;
    huffazGraduatesDisplay: string;
    teachersCountDisplay: string;
    orphanStudentsDisplay: string;
    sourceVerified: boolean;
  };
  logoUrl: string;
  principalPhotoUrl: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface CmsEvent {
  id: string;
  titleBn: string;
  titleEn?: string;
  descriptionBn: string;
  category: "ACADEMIC" | "RELIGIOUS" | "CONVOCATION" | "EXAM" | "COMPETITION" | "GENERAL";
  eventDate: string; // ISO date YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  location: string;
  coverImageUrl?: string;
  organizer: string;
  registrationUrl?: string;
  status: EventStatus;
  isPublic: boolean;
  isPinned: boolean;
  version: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CmsFaq {
  id: string;
  questionBn: string;
  questionEn?: string;
  answerBn: string;
  answerEn?: string;
  category: FaqCategory;
  order: number;
  status: CmsContentStatus;
  isApproved: boolean;
  approvedBy?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CmsDownloadItem {
  id: string;
  titleBn: string;
  titleEn?: string;
  descriptionBn: string;
  category: "ADMISSION" | "SYLLABUS" | "ROUTINE" | "CALENDAR" | "PROSPECTUS" | "FORM" | "OTHER";
  fileUrl: string;
  fileType: "PDF" | "DOCX" | "ZIP" | "IMAGE";
  fileSizeBytes: number;
  fileSizeDisplay: string;
  versionString: string;
  status: CmsContentStatus;
  isPublic: boolean;
  downloadCount: number;
  uploadedAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CmsGalleryItem {
  id: string;
  titleBn: string;
  descriptionBn?: string;
  category: GalleryCategory;
  imageUrl: string;
  altText: string;
  consentVerified: boolean;
  consentReference?: string;
  status: CmsContentStatus;
  isPublic: boolean;
  order: number;
  uploadedAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface HomepageSectionConfig {
  id: "hero" | "stats" | "notices" | "principal" | "departments" | "events" | "gallery" | "faq" | "donate" | "contact";
  titleBn: string;
  enabled: boolean;
  order: number;
}

export interface HomepageConfig {
  admissionState: AdmissionState;
  admissionAnnouncementBn?: string;
  sections: HomepageSectionConfig[];
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface SeoConfig {
  defaultTitleBn: string;
  defaultTitleEn: string;
  defaultDescriptionBn: string;
  canonicalBaseUrl: string;
  ogImageUrl: string;
  twitterCard: "summary" | "summary_large_image";
  siteKeywords: string[];
  version: number;
  updatedAt: string;
}

export interface PublicContactPayload {
  name: string;
  phone?: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
  honeypot?: string; // Must be empty to pass anti-bot check
}

export interface CmsAuditEntry {
  id: string;
  action: "CREATE" | "UPDATE" | "PUBLISH" | "UNPUBLISH" | "ARCHIVE" | "DELETE_BLOCKED";
  contentType: "PROFILE" | "EVENT" | "FAQ" | "DOWNLOAD" | "GALLERY" | "HOMEPAGE" | "SEO";
  contentId: string;
  details: string;
  performedBy: string;
  timestamp: string;
}
