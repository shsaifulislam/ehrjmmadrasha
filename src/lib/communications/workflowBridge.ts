/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 32
 * Workflow & Domain Event Bus Communication Bridge
 * Subscribes to Phase 27 EventBus to trigger authoritative communications.
 * Checkpoint: EHRJ-AI-2026-PHASE32
 */

import { eventBus, DomainEvent } from "@/lib/workflow/eventBus";
import { dispatchNotification } from "@/lib/communicationEngine";
import { evaluateDeliveryEligibility } from "./suppressionManager";

let isBridgeInitialized = false;

/**
 * Initializes listeners on the Phase 27 EventBus for domain events
 */
export function initializeCommunicationWorkflowBridge(): void {
  if (isBridgeInitialized) return;
  isBridgeInitialized = true;

  eventBus.subscribe("*", async (event: DomainEvent) => {
    try {
      await handleDomainEventCommunication(event);
    } catch (err) {
      console.error(`[CommunicationWorkflowBridge] Error handling event ${event.eventType}:`, err);
    }
  });

  console.log("[CommunicationWorkflowBridge] Initialized Phase 32 EventBus listener.");
}

export async function handleDomainEventCommunication(event: DomainEvent): Promise<boolean> {
  const { eventType, entityId, payload } = event;

  switch (eventType) {
    case "ADMISSION_APPLICATION_SUBMITTED": {
      if (payload.guardianUserId) {
        await dispatchNotification({
          templateCode: "ADMISSION_SUBMITTED",
          recipients: [
            {
              userId: payload.guardianUserId,
              name: payload.guardianName || "সম্মানিত অভিভাবক",
              email: payload.guardianEmail,
              role: "GUARDIAN",
            },
          ],
          variables: {
            "application.trackingId": payload.trackingNumber || entityId,
            "guardian.name": payload.guardianName || "সম্মানিত অভিভাবক",
            "student.nameBn": payload.studentNameBn || "শিক্ষার্থী",
          },
          relatedEntityType: "AdmissionApplication",
          relatedEntityId: entityId,
          priority: "NORMAL",
          idempotencyBaseKey: `comm-adm-sub-${entityId}`,
        });
        return true;
      }
      break;
    }

    case "ADMISSION_APPLICATION_APPROVED": {
      if (payload.guardianUserId) {
        await dispatchNotification({
          templateCode: "ADMISSION_APPROVED",
          recipients: [
            {
              userId: payload.guardianUserId,
              name: payload.guardianName || "সম্মানিত অভিভাবক",
              email: payload.guardianEmail,
              role: "GUARDIAN",
            },
          ],
          variables: {
            "guardian.name": payload.guardianName || "সম্মানিত অভিভাবক",
            "student.nameBn": payload.studentNameBn || "শিক্ষার্থী",
            "student.studentId": payload.studentIdNumber || entityId,
            "class.name": payload.className || "অনুমোদিত জামাত",
            roll: payload.roll || "১",
          },
          relatedEntityType: "Student",
          relatedEntityId: payload.studentId,
          priority: "URGENT",
          idempotencyBaseKey: `comm-adm-app-${entityId}`,
        });
        return true;
      }
      break;
    }

    case "PAYMENT_SUCCESSFUL":
    case "PAYMENT_RECEIVED": {
      if (payload.guardianUserId) {
        await dispatchNotification({
          templateCode: "PAYMENT_SUCCESSFUL",
          recipients: [
            {
              userId: payload.guardianUserId,
              name: payload.guardianName || "সম্মানিত অভিভাবক",
              email: payload.guardianEmail,
              role: "GUARDIAN",
            },
          ],
          variables: {
            "guardian.name": payload.guardianName || "সম্মানিত অভিভাবক",
            "student.nameBn": payload.studentNameBn || "শিক্ষার্থী",
            "payment.amount": payload.amount,
            "receipt.number": payload.receiptNumber || entityId,
          },
          relatedEntityType: "PaymentReceipt",
          relatedEntityId: entityId,
          priority: "IMPORTANT",
          idempotencyBaseKey: `comm-pay-rec-${entityId}`,
        });
        return true;
      }
      break;
    }

    case "EXAM_RESULT_PUBLISHED": {
      if (payload.guardianUserId) {
        await dispatchNotification({
          templateCode: "RESULT_PUBLISHED",
          recipients: [
            {
              userId: payload.guardianUserId,
              name: payload.guardianName || "সম্মানিত অভিভাবক",
              email: payload.guardianEmail,
              role: "GUARDIAN",
            },
          ],
          variables: {
            "guardian.name": payload.guardianName || "সম্মানিত অভিভাবক",
            "student.nameBn": payload.studentNameBn || "শিক্ষার্থী",
            "exam.name": payload.examName || "সাময়িক পরীক্ষা",
            roll: payload.roll || "১",
          },
          relatedEntityType: "ExamResult",
          relatedEntityId: entityId,
          priority: "IMPORTANT",
          idempotencyBaseKey: `comm-res-pub-${entityId}`,
        });
        return true;
      }
      break;
    }

    case "DOCUMENT_ISSUED": {
      if (payload.guardianUserId) {
        await dispatchNotification({
          templateCode: "DOCUMENT_ISSUED",
          recipients: [
            {
              userId: payload.guardianUserId,
              name: payload.guardianName || "সম্মানিত অভিভাবক",
              email: payload.guardianEmail,
              role: "GUARDIAN",
            },
          ],
          variables: {
            "guardian.name": payload.guardianName || "সম্মানিত অভিভাবক",
            "student.nameBn": payload.studentNameBn || "শিক্ষার্থী",
            "document.type": payload.documentType || "সনদপত্র",
            "document.number": payload.documentNumber || entityId,
          },
          relatedEntityType: "Certificate",
          relatedEntityId: entityId,
          priority: "IMPORTANT",
          idempotencyBaseKey: `comm-doc-iss-${entityId}`,
        });
        return true;
      }
      break;
    }

    case "LIBRARY_BOOK_OVERDUE": {
      if (payload.recipientUserId) {
        await dispatchNotification({
          templateCode: "LIBRARY_BOOK_OVERDUE",
          recipients: [
            {
              userId: payload.recipientUserId,
              name: payload.recipientName || "গ্রাহক",
              email: payload.recipientEmail,
              role: payload.role || "GUARDIAN",
            },
          ],
          variables: {
            "recipient.name": payload.recipientName || "গ্রাহক",
            "book.title": payload.bookTitle || "কিতাব/বই",
          },
          relatedEntityType: "LibraryBookIssue",
          relatedEntityId: entityId,
          priority: "URGENT",
          idempotencyBaseKey: `comm-lib-ovd-${entityId}`,
        });
        return true;
      }
      break;
    }

    default:
      break;
  }

  return false;
}
