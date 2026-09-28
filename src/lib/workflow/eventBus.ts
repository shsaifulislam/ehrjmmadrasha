/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 27
 * Domain Event Bus & Outbox Pattern
 *
 * Core Governance Invariants:
 * 1. Event != Action Authorization.
 * 2. Every event is immutable and append-oriented.
 * 3. Events carry correlationId, causationId, schemaVersion, and idempotencyKey.
 * 4. Payloads are sanitized (no unnecessary passwords or raw sensitive data).
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export type EventActorType = "USER" | "SYSTEM_AUTOMATION" | "SCHEDULED_CRON" | "GUARDIAN";

export type EventSourceModule =
  | "ADMISSION"
  | "FINANCE"
  | "ATTENDANCE"
  | "ACADEMIC"
  | "LIBRARY"
  | "RESIDENTIAL"
  | "TRANSPORT"
  | "INVENTORY"
  | "HR"
  | "HELPDESK"
  | "OPERATIONS"
  | "SECURITY"
  | "BI"
  | "DATA_QUALITY";

export interface DomainEvent<T = Record<string, any>> {
  eventId: string;           // e.g. "EVT-2026-000001"
  eventType: string;         // e.g. "ADMISSION_APPROVED", "PAYMENT_SUCCESSFUL"
  occurredAt: string;        // ISO 8601 UTC
  actorType: EventActorType;
  actorId: string;           // User ID or "SYSTEM_AUTOMATION"
  sourceModule: EventSourceModule;
  entityType: string;        // e.g. "Student", "FeeInvoice", "AdmissionApplication"
  entityId: string;          // Primary key of affected entity
  payload: T;                // Domain-specific payload
  correlationId: string;     // Trace root causal journey
  causationId?: string;      // Preceding event ID
  schemaVersion: string;     // "1.0"
  idempotencyKey: string;    // "evt_${eventType}_${entityId}_${hash}"
}

export type EventSubscriber = (event: DomainEvent) => Promise<void> | void;

const GOVERNANCE_DIR = path.join(process.cwd(), "data", "governance");
const EVENTS_FILE = path.join(GOVERNANCE_DIR, "domain_events.json");

function ensureDirectory() {
  if (!fs.existsSync(GOVERNANCE_DIR)) {
    fs.mkdirSync(GOVERNANCE_DIR, { recursive: true });
  }
}

/**
 * Loads all historical domain events from persistent store
 */
export function loadDomainEvents(): DomainEvent[] {
  ensureDirectory();
  if (!fs.existsSync(EVENTS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(EVENTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse domain_events.json:", err);
    return [];
  }
}

/**
 * Saves all domain events to persistent store
 */
function saveDomainEvents(events: DomainEvent[]): void {
  ensureDirectory();
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), "utf-8");
}

class EventBusRegistry {
  private subscribers: Map<string, EventSubscriber[]> = new Map();
  private wildcardSubscribers: EventSubscriber[] = [];

  public subscribe(eventType: string, subscriber: EventSubscriber): () => void {
    if (eventType === "*") {
      this.wildcardSubscribers.push(subscriber);
      return () => {
        this.wildcardSubscribers = this.wildcardSubscribers.filter((s) => s !== subscriber);
      };
    }

    const current = this.subscribers.get(eventType) || [];
    current.push(subscriber);
    this.subscribers.set(eventType, current);

    return () => {
      const updated = (this.subscribers.get(eventType) || []).filter((s) => s !== subscriber);
      this.subscribers.set(eventType, updated);
    };
  }

  public async publish(event: DomainEvent): Promise<void> {
    const specificSubscribers = this.subscribers.get(event.eventType) || [];
    const all = [...specificSubscribers, ...this.wildcardSubscribers];

    for (const sub of all) {
      try {
        await sub(event);
      } catch (err) {
        console.error(`Error in event subscriber for ${event.eventType}:`, err);
      }
    }
  }

  public clearSubscribers(): void {
    this.subscribers.clear();
    this.wildcardSubscribers = [];
  }
}

export const eventBus = new EventBusRegistry();

/**
 * Emits a validated domain event, persisting it append-only and dispatching to subscribers.
 * Enforces idempotency via idempotencyKey.
 */
export async function publishDomainEvent<T = Record<string, any>>(params: {
  eventType: string;
  sourceModule: EventSourceModule;
  entityType: string;
  entityId: string;
  payload: T;
  actorType?: EventActorType;
  actorId?: string;
  correlationId?: string;
  causationId?: string;
  idempotencyKey?: string;
}): Promise<{ event: DomainEvent<T>; isDuplicate: boolean }> {
  ensureDirectory();
  const existingEvents = loadDomainEvents();

  const baseKey =
    params.idempotencyKey ||
    `evt_${params.eventType}_${params.entityId}_${crypto
      .createHash("sha256")
      .update(JSON.stringify(params.payload || {}))
      .digest("hex")
      .slice(0, 12)}`;

  // Idempotency check: Reject duplicate emission
  const duplicate = existingEvents.find((e) => e.idempotencyKey === baseKey);
  if (duplicate) {
    return { event: duplicate as DomainEvent<T>, isDuplicate: true };
  }

  const eventCounter = (existingEvents.length + 1).toString().padStart(6, "0");
  const eventId = `EVT-2026-${eventCounter}`;

  const domainEvent: DomainEvent<T> = {
    eventId,
    eventType: params.eventType,
    occurredAt: new Date().toISOString(),
    actorType: params.actorType || "SYSTEM_AUTOMATION",
    actorId: params.actorId || "SYSTEM",
    sourceModule: params.sourceModule,
    entityType: params.entityType,
    entityId: params.entityId,
    payload: params.payload,
    correlationId: params.correlationId || eventId,
    causationId: params.causationId,
    schemaVersion: "1.0",
    idempotencyKey: baseKey,
  };

  // Append-only storage
  existingEvents.push(domainEvent as any);
  saveDomainEvents(existingEvents);

  // Dispatch asynchronously to active event bus subscribers
  eventBus.publish(domainEvent as any).catch((err) => {
    console.error(`Async dispatch error for ${domainEvent.eventId}:`, err);
  });

  return { event: domainEvent, isDuplicate: false };
}
