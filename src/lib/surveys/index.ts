/**
 * Eliotganj Hazi Rohmatollah Jamiria Madrasha ERP
 * Phase 37: Institutional Survey, Feedback, Assessment & Voice-of-Community Engine
 * Checkpoint: EHRJ-AI-2026-PHASE37
 * 
 * Barrel export for surveys types, datastore, lifecycle, response, privacy, analytics, and action engines.
 * 
 * CORE PRINCIPLE:
 * "FEEDBACK INFORMS DECISIONS; IT DOES NOT AUTOMATICALLY MAKE HIGH-STAKES DECISIONS."
 * 
 * Invariants Enforced:
 * 1. Feedback layer, NOT a duplicate student, HR, or finance engine.
 * 2. Immutable question versions once published.
 * 3. Privacy-first: Technical separation of identity for anonymous responses.
 * 4. Small-Group Protection: Suppresses granular demographic breakdown when responses < 5.
 * 5. Bounded AI theme generation (always labeled human review required).
 * 6. Bridge to Phase 14 Help Desk for actionable complaints.
 * 7. Strictly NO SMS.
 */

export * from "./types";
export * from "./surveyStore";
export * from "./surveyLifecycleEngine";
export * from "./surveyResponseEngine";
export * from "./surveyPrivacyEngine";
export * from "./surveyAnalyticsEngine";
export * from "./surveyActionEngine";
export * from "./surveyCommunicationBridge";
