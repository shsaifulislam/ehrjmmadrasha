/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 23
 * Offline Sync Queue & Idempotency Engine
 * 
 * Invariants:
 * 1. OFFLINE DATA IS TEMPORARY UNTIL SERVER CONFIRMATION.
 * 2. SYNC IDEMPOTENCY: Every mutation carries a unique idempotencyKey.
 * 3. NO OFFLINE FINANCIAL OR RESULT FINALIZATION: Strictly limited to safe drafts.
 * 4. CONFLICT DETECTION: Never silently overwrite server records.
 */

export interface SyncOperationItem {
  syncId: string;
  operationType: "TEACHER_ATTENDANCE" | "HELPDESK_TICKET" | "PROFILE_DRAFT";
  payload: Record<string, any>;
  idempotencyKey: string;
  status: "PENDING_SYNC" | "SYNCING" | "SYNCED" | "SYNC_FAILED" | "CONFLICT_REQUIRES_REVIEW";
  createdAt: string;
  syncedAt?: string;
  conflictDetails?: string;
  retryCount: number;
}

const STORAGE_KEY = "ehrj_offline_sync_queue_v1";

export function generateSyncIdempotencyKey(operationType: string): string {
  const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EHRJ-SYNC-${dateStr}-${operationType.substring(0, 3)}-${randomPart}`;
}

export function getSyncQueue(): SyncOperationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read sync queue:", err);
    return [];
  }
}

export function saveSyncQueue(queue: SyncOperationItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Failed to save sync queue:", err);
  }
}

export function enqueueOfflineOperation(
  operationType: "TEACHER_ATTENDANCE" | "HELPDESK_TICKET" | "PROFILE_DRAFT",
  payload: Record<string, any>
): SyncOperationItem {
  // Financial, result publication, and security mutations are strictly rejected from offline queue
  const forbiddenOfflineTypes = ["PAYMENT", "REFUND", "FEE_WAIVER", "RESULT_PUBLISH", "USER_ROLE_CHANGE"];
  if (forbiddenOfflineTypes.includes(operationType as any)) {
    throw new Error("নিরাপত্তা নীতি: আর্থিক লেনদেন বা রেজাল্ট চূড়ান্তকরণ অফলাইনে অনুমোদিত নয়।");
  }

  const queue = getSyncQueue();
  const newItem: SyncOperationItem = {
    syncId: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    operationType,
    payload,
    idempotencyKey: generateSyncIdempotencyKey(operationType),
    status: "PENDING_SYNC",
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  queue.push(newItem);
  saveSyncQueue(queue);
  return newItem;
}

export function updateSyncItemStatus(
  syncId: string,
  status: SyncOperationItem["status"],
  updates?: Partial<SyncOperationItem>
): void {
  const queue = getSyncQueue();
  const idx = queue.findIndex((item) => item.syncId === syncId);
  if (idx !== -1) {
    queue[idx] = {
      ...queue[idx],
      status,
      ...updates,
    };
    saveSyncQueue(queue);
  }
}

export function clearSyncedItems(): void {
  const queue = getSyncQueue();
  const remaining = queue.filter((item) => item.status !== "SYNCED");
  saveSyncQueue(remaining);
}

/**
 * Dispatches pending sync operations to server when back online.
 */
export async function flushSyncQueueToServer(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  conflicts: number;
}> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { processed: 0, succeeded: 0, failed: 0, conflicts: 0 };
  }

  const queue = getSyncQueue();
  const pending = queue.filter((item) => item.status === "PENDING_SYNC" || item.status === "SYNC_FAILED");

  let succeeded = 0;
  let failed = 0;
  let conflicts = 0;

  for (const item of pending) {
    updateSyncItemStatus(item.syncId, "SYNCING");
    try {
      const response = await fetch("/api/sync/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syncId: item.syncId,
          operationType: item.operationType,
          idempotencyKey: item.idempotencyKey,
          payload: item.payload,
          clientCreatedAt: item.createdAt,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        updateSyncItemStatus(item.syncId, "SYNCED", { syncedAt: new Date().toISOString() });
        succeeded++;
      } else if (response.status === 409 || data.conflict) {
        updateSyncItemStatus(item.syncId, "CONFLICT_REQUIRES_REVIEW", {
          conflictDetails: data.conflictReason || "সার্ভারে তথ্য ইতোমধ্যে পরিবর্তিত হয়েছে।",
        });
        conflicts++;
      } else {
        updateSyncItemStatus(item.syncId, "SYNC_FAILED", { retryCount: item.retryCount + 1 });
        failed++;
      }
    } catch (err) {
      updateSyncItemStatus(item.syncId, "SYNC_FAILED", { retryCount: item.retryCount + 1 });
      failed++;
    }
  }

  return {
    processed: pending.length,
    succeeded,
    failed,
    conflicts,
  };
}
