/**
 * Eliotganj Hazi Rohmatollah Jamiria Madrasha ERP
 * Phase 36: Alumni, Former Student & Community Relationship Management Engine
 * 
 * Barrel export for alumni types, stores, and engines.
 * 
 * Invariants:
 * 1. Alumni is a relationship layer, NOT a second student database.
 * 2. Self-reported profile fields are strictly distinct from institutional historical records.
 * 3. Privacy-first: public directory masks contact info unless explicit permission given.
 * 4. Controlled mentorship workflows (no open social chat).
 * 5. Donations link directly to Phase 6 Finance funds.
 * 6. Strictly NO SMS.
 */

export * from './types';
export * from './alumniStore';
export * from './alumniVerificationEngine';
export * from './alumniPrivacyEngine';
export * from './alumniGroupEngine';
export * from './alumniMentorshipEngine';
export * from './alumniVolunteerEngine';
export * from './alumniContributionEngine';
export * from './alumniImportEngine';
