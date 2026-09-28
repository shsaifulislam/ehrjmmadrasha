/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 27
 * Master Workflow Automation & Rules Engine Entrypoint
 */

import { eventBus, DomainEvent } from "./eventBus";
import { handleEventThroughWorkflow } from "./workflowEngine";

export * from "./eventBus";
export * from "./jobQueue";
export * from "./rulesEngine";
export * from "./approvalEngine";
export * from "./workflowEngine";

let isInitialized = false;

/**
 * Initializes the default system event subscriptions connecting domain events
 * to workflow orchestrations. Idempotent.
 */
export function initializeWorkflowEngine(): void {
  if (isInitialized) return;

  // Wildcard subscriber to route all domain events through active workflow definitions
  eventBus.subscribe("*", async (event: DomainEvent) => {
    try {
      await handleEventThroughWorkflow(event);
    } catch (err) {
      console.error(`Error processing event ${event.eventId} through workflows:`, err);
    }
  });

  isInitialized = true;
}

// Auto-initialize when imported
initializeWorkflowEngine();
