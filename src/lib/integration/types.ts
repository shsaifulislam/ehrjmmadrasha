/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 28
 * Integration Hub & Interoperability Engine Types
 *
 * Core Governance Invariants:
 * 1. CONNECT SYSTEMS, NOT AUTHORITIES. Internal engines remain authoritative.
 * 2. NO SECRETS IN CODE, LOGS, OR PAYLOADS.
 * 3. IDEMPOTENCY & REPLAY PROTECTION on all external callbacks and deliveries.
 * 4. DEAD-LETTER QUEUE & CIRCUIT BREAKER for fault isolation.
 */

export type IntegrationCategory =
  | "PAYMENT"
  | "EMAIL"
  | "NOTIFICATION"
  | "WEBHOOK"
  | "BANK"
  | "ACCOUNTING"
  | "IDENTITY"
  | "STORAGE"
  | "ANALYTICS"
  | "DOCUMENT"
  | "MESSAGING"
  | "AI"
  | "IMPORT_EXPORT"
  | "EXTERNAL_ERP"
  | "CUSTOM_API";

export type IntegrationEnvironment = "SANDBOX" | "STAGING" | "PRODUCTION";

export type IntegrationStatus =
  | "DRAFT"
  | "CONFIGURED"
  | "TESTING"
  | "ACTIVE"
  | "PAUSED"
  | "FAILED"
  | "DISABLED"
  | "ARCHIVED";

export type IntegrationHealthStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "NOT_CONFIGURED"
  | "UNKNOWN";

export type AuthType =
  | "API_KEY"
  | "BEARER_TOKEN"
  | "BASIC_AUTH"
  | "OAUTH2"
  | "HMAC_SIGNATURE"
  | "NONE";

export interface IntegrationRegistryItem {
  id: string;
  integrationCode: string; // e.g. "BKASH_PGW", "GMAIL_SMTP"
  name: string;
  nameBn: string;
  description: string;
  provider: string; // e.g. "bKash Limited", "Google Workspace"
  category: IntegrationCategory;
  environment: IntegrationEnvironment;
  status: IntegrationStatus;
  healthStatus: IntegrationHealthStatus;
  version: string;
  baseUrl?: string;
  authenticationType: AuthType;
  configuration: Record<string, any>; // Masked for display
  enabledAt?: string;
  disabledAt?: string;
  lastHealthCheck?: string;
  lastSuccessfulSync?: string;
  lastFailure?: {
    timestamp: string;
    error: string;
    code?: string;
  };
  metrics: {
    totalRequests: number;
    successRequests: number;
    failedRequests: number;
    averageLatencyMs: number;
  };
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ApiKeyStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPENDED";

export type ApiScope =
  | "students:read"
  | "students:write"
  | "guardians:read"
  | "attendance:read"
  | "attendance:write"
  | "results:read"
  | "finance:read"
  | "finance:write"
  | "payments:read"
  | "payments:write"
  | "documents:read"
  | "library:read"
  | "analytics:read"
  | "webhooks:manage"
  | "integrations:read";

export interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: string; // e.g. "ehrj_live_a1b2..."
  keyHash: string; // SHA-256 hash of raw key
  owner: string;
  ownerType: "EXTERNAL_INSTITUTION" | "VENDOR_PARTNER" | "INTERNAL_SERVICE";
  scopes: ApiScope[];
  environment: IntegrationEnvironment;
  rateLimitPerMin: number;
  status: ApiKeyStatus;
  expiresAt: string; // ISO 8601
  lastUsedAt?: string;
  revokedAt?: string;
  revokedReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type WebhookProcessingStatus =
  | "RECEIVED"
  | "VALIDATED"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED"
  | "RETRYING"
  | "DEAD_LETTER"
  | "IGNORED";

export interface InboundWebhookRecord {
  webhookId: string;
  integrationCode: string;
  eventType: string;
  provider: string;
  receivedAt: string;
  payloadHash: string;
  signatureStatus: "VERIFIED" | "INVALID" | "MISSING";
  processingStatus: WebhookProcessingStatus;
  attemptCount: number;
  processedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  correlationId: string;
  causationId?: string;
  idempotencyKey: string;
  sanitizedPayload: Record<string, any>;
}

export interface WebhookSubscription {
  id: string;
  name: string;
  integrationCode: string;
  targetUrl: string;
  eventTypes: string[]; // e.g. ["PAYMENT_SUCCESSFUL", "ADMISSION_APPROVED"]
  secretMasked: string;
  secretHash: string;
  status: "ACTIVE" | "PAUSED" | "DISABLED";
  retryPolicy: {
    maxAttempts: number;
    initialBackoffSec: number;
    backoffMultiplier: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type DeliveryStatus =
  | "PENDING"
  | "SENT"
  | "ACKNOWLEDGED"
  | "FAILED"
  | "RETRYING"
  | "DEAD_LETTER";

export interface OutboundWebhookDelivery {
  deliveryId: string;
  eventId: string;
  subscriptionId: string;
  targetUrl: string;
  attempt: number;
  maxAttempts: number;
  timestamp: string;
  httpStatus?: number;
  responseBodySummary?: string;
  latencyMs: number;
  signature: string;
  deliveryStatus: DeliveryStatus;
  error?: string;
  nextRetryAt?: string;
  correlationId: string;
}

export interface DeadLetterItem {
  id: string;
  source: "INBOUND_WEBHOOK" | "OUTBOUND_DELIVERY" | "EVENT_SYNC";
  integrationCode: string;
  referenceId: string;
  eventType: string;
  requestPayload: any;
  lastError: string;
  attempts: number;
  quarantinedAt: string;
  resolvedAt?: string;
  resolutionStatus: "PENDING" | "REPLAYED" | "DISCARDED";
  correlationId: string;
}

export interface IntegrationLog {
  id: string;
  integrationCode: string;
  operation: string;
  timestamp: string;
  requestId: string;
  correlationId: string;
  status: "SUCCESS" | "FAILURE" | "WARN";
  durationMs: number;
  httpStatus?: number;
  sanitizedMetadata: Record<string, any>;
  errorCode?: string;
  errorMessage?: string;
}

export type JobType = "IMPORT" | "EXPORT";
export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "PARTIALLY_FAILED" | "FAILED";

export interface ImportExportJob {
  id: string; // e.g. "EHRJ-IMP-2026-000001"
  jobType: JobType;
  entityType: "STUDENT" | "ATTENDANCE" | "FINANCE" | "EXAM";
  status: JobStatus;
  totalCount: number;
  successCount: number;
  failureCount: number;
  errorReport?: any[];
  initiatedBy: string;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

export type ReconciliationStatus =
  | "MATCHED"
  | "UNMATCHED"
  | "PARTIAL_MATCH"
  | "DUPLICATE"
  | "CONFLICT";

export interface PaymentReconciliationRecord {
  id: string;
  provider: string;
  providerTransactionId: string;
  invoiceId?: string;
  invoiceNumber?: string;
  paymentReceiptId?: string;
  amount: number;
  currency: string;
  transactionDate: string;
  status: ReconciliationStatus;
  notes?: string;
  reconciledBy?: string;
  reconciledAt?: string;
}

export interface SourceOfTruthEntry {
  domain: string;
  domainBn: string;
  authoritativeEngine: string;
  internalOwnerModule: string;
  externalConsumerAccess: "READ_ONLY" | "WRITE_REQUEST" | "RESTRICTED";
  conflictResolutionRule: string;
}
