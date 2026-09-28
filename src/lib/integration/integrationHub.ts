/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 28
 * Central Integration Hub Orchestrator & Interoperability Gateway
 *
 * Core Invariant: CONNECT SYSTEMS, NOT AUTHORITIES.
 */

import { loadIntegrationRegistry } from "./registry";
import { loadApiKeys } from "./apiKeyManager";
import {
  loadWebhookSubscriptions,
  loadWebhookDeliveries,
  loadDeadLetterQueue,
  loadInboundWebhooks,
  initializeWebhookEventBusBridge,
} from "./webhookEngine";
import { loadReconciliationRecords } from "./paymentAdapter";
import { loadIntegrationLogs } from "./circuitBreaker";
import { loadImportExportJobs } from "./exportImportHub";

// Auto-initialize Event Bus Webhook Bridge
initializeWebhookEventBusBridge();

export * from "./types";
export * from "./sourceOfTruthMap";
export * from "./registry";
export * from "./apiKeyManager";
export * from "./circuitBreaker";
export * from "./webhookEngine";
export * from "./paymentAdapter";
export * from "./exportImportHub";

export interface IntegrationHubOverview {
  integrations: {
    total: number;
    active: number;
    configured: number;
    paused: number;
    healthy: number;
    degraded: number;
  };
  apiGateway: {
    totalKeys: number;
    activeKeys: number;
    revokedKeys: number;
  };
  webhooks: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalDeliveries: number;
    inboundProcessed: number;
    deadLetterCount: number;
  };
  reconciliation: {
    totalRecords: number;
    matched: number;
    unmatched: number;
    conflicts: number;
  };
  jobs: {
    totalJobs: number;
    exports: number;
    imports: number;
  };
  recentLogs: any[];
  deadLetterItems: any[];
  timestamp: string;
}

export function getIntegrationHubOverview(): IntegrationHubOverview {
  const integrations = loadIntegrationRegistry();
  const apiKeys = loadApiKeys();
  const subscriptions = loadWebhookSubscriptions();
  const deliveries = loadWebhookDeliveries(50);
  const dlq = loadDeadLetterQueue();
  const inbound = loadInboundWebhooks();
  const recons = loadReconciliationRecords();
  const logs = loadIntegrationLogs(15);
  const jobs = loadImportExportJobs();

  return {
    integrations: {
      total: integrations.length,
      active: integrations.filter((i) => i.status === "ACTIVE").length,
      configured: integrations.filter((i) => i.status === "CONFIGURED").length,
      paused: integrations.filter((i) => i.status === "PAUSED").length,
      healthy: integrations.filter((i) => i.healthStatus === "HEALTHY").length,
      degraded: integrations.filter((i) => i.healthStatus === "DEGRADED" || i.healthStatus === "UNAVAILABLE").length,
    },
    apiGateway: {
      totalKeys: apiKeys.length,
      activeKeys: apiKeys.filter((k) => k.status === "ACTIVE").length,
      revokedKeys: apiKeys.filter((k) => k.status === "REVOKED").length,
    },
    webhooks: {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter((s) => s.status === "ACTIVE").length,
      totalDeliveries: deliveries.length,
      inboundProcessed: inbound.length,
      deadLetterCount: dlq.filter((d) => d.resolutionStatus === "PENDING").length,
    },
    reconciliation: {
      totalRecords: recons.length,
      matched: recons.filter((r) => r.status === "MATCHED").length,
      unmatched: recons.filter((r) => r.status === "UNMATCHED").length,
      conflicts: recons.filter((r) => r.status === "CONFLICT" || r.status === "DUPLICATE").length,
    },
    jobs: {
      totalJobs: jobs.length,
      exports: jobs.filter((j) => j.jobType === "EXPORT").length,
      imports: jobs.filter((j) => j.jobType === "IMPORT").length,
    },
    recentLogs: logs,
    deadLetterItems: dlq.filter((d) => d.resolutionStatus === "PENDING").slice(0, 10),
    timestamp: new Date().toISOString(),
  };
}
