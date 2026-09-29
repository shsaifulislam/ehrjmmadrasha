/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 30
 * ADVANCED GLOBAL SEARCH, COMMAND CENTER & UNIVERSAL NAVIGATION ENGINE
 * Types, Schemas, Enums & Contracts
 * 
 * Checkpoint: EHRJ-AI-2026-PHASE30
 * 
 * CORE INVARIANTS:
 * 1. SEARCH SHOULD FIND WHAT THE USER IS AUTHORIZED TO KNOW — NOT WHAT THE DATABASE HAPPENS TO CONTAIN.
 * 2. The Search Engine is NOT the source of truth; it is an index and navigation layer.
 * 3. NO UNAUTHORIZED DISCOVERY: The search engine must NEVER reveal that a restricted record exists.
 * 4. Exact identifiers (EHRJ-2026-...) take precedence over fuzzy matching.
 */

export type SearchEntityType =
  | "STUDENT"
  | "GUARDIAN"
  | "ADMISSION"
  | "CLASS_JAMAT"
  | "ATTENDANCE"
  | "EXAM"
  | "RESULT"
  | "INVOICE"
  | "PAYMENT"
  | "RECEIPT"
  | "CERTIFICATE"
  | "DOCUMENT"
  | "LIBRARY_BOOK"
  | "LIBRARY_MEMBER"
  | "RESIDENTIAL"
  | "TRANSPORT"
  | "INVENTORY"
  | "ASSET"
  | "EMPLOYEE"
  | "HELPDESK"
  | "NOTICE"
  | "WORKFLOW"
  | "INTEGRATION"
  | "KNOWLEDGE"
  | "NAVIGATION";

export type SearchUserRole =
  | "ADMIN"
  | "PRINCIPAL"
  | "TEACHER"
  | "GUARDIAN"
  | "STAFF"
  | "PUBLIC";

export interface SearchUserContext {
  userId?: string;
  role: SearchUserRole;
  guardianId?: string;
  studentId?: string;
  linkedStudentIds?: string[];
  permissions?: string[];
}

export interface SearchAction {
  labelBn: string;
  labelEn: string;
  icon?: string;
  url: string;
  requiredRole?: SearchUserRole[];
}

export interface SearchResultItem {
  id: string;
  entityType: SearchEntityType;
  entityId: string;
  displayTitleBn: string;
  displayTitleEn: string;
  subtitle?: string;
  snippet?: string;
  status?: string;
  sessionId?: string;
  url: string;
  relevanceScore: number;
  matchType: "EXACT_ID" | "EXACT_PHRASE" | "PREFIX" | "NORMALIZED" | "PARTIAL" | "FUZZY" | "NAVIGATION";
  matchedField: string;
  sourceModule: string;
  lastUpdated?: string;
  quickActions: SearchAction[];
}

export interface SearchFilter {
  entityType?: SearchEntityType | "ALL";
  sessionId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface GlobalSearchQuery {
  term: string;
  filters?: SearchFilter;
  user: SearchUserContext;
  includeSuggestions?: boolean;
}

export interface GlobalSearchResponse {
  query: string;
  normalizedQuery: string;
  totalResults: number;
  results: SearchResultItem[];
  suggestedCorrection?: string;
  categorizedCounts: Record<string, number>;
  latencyMs: number;
  sourceOfTruth: "AUTHORITATIVE_DB_AND_INDEX";
}

export interface SearchIndexRecord {
  indexId: string;
  entityType: SearchEntityType;
  entityId: string;
  titleBn: string;
  titleEn: string;
  titleAr?: string;
  searchText: string;
  keywords: string[];
  status: string;
  sessionId?: string;
  scope: {
    isPublic: boolean;
    allowedRoles: SearchUserRole[];
    entityOwnerId?: string;
    studentId?: string;
  };
  deepLinkUrl: string;
  sourceUpdatedAt: string;
  indexedAt: string;
  version: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter;
  creatorUserId: string;
  creatorRole: SearchUserRole;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommandShortcutItem {
  id: string;
  titleBn: string;
  titleEn: string;
  category: "NAVIGATION" | "ACTION" | "SEARCH";
  shortcutKey?: string;
  url: string;
  requiredRole: SearchUserRole[];
  descriptionBn: string;
}
