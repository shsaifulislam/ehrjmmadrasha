/**
 * EHRJ MADRASHA ERP — PHASE 39
 * Teacher/Staff Training, Professional Development & Certification Engine
 * 
 * Checkpoint: EHRJ-AI-2026-PHASE39
 * 
 * Invariants:
 * 1. PHASE 39 MANAGES PROFESSIONAL DEVELOPMENT; PHASE 13 REMAINS THE AUTHORITATIVE EMPLOYEE MASTER.
 * 2. TRAINING ATTENDANCE IS SEPARATE FROM NORMAL EMPLOYEE/PAYROLL ATTENDANCE.
 * 3. TRAINING ASSESSMENT MUST NEVER MODIFY STUDENT GRADES, PAYROLL, OR ACADEMIC RESULTS.
 * 4. CERTIFICATES USE PHASE 7/29 VERIFICATION ENGINE (QR TOKEN, VERIFICATION URL).
 * 5. AI MAY ASSIST LEARNING BUT MUST NEVER AUTONOMOUSLY PASS/FAIL OR CERTIFY PARTICIPANTS.
 * 6. NO SMS — IN-APP PORTAL ALERTS AND CALENDAR ONLY.
 */

export type TrainingType =
  | "NEW_TEACHER_ORIENTATION"
  | "EMPLOYEE_ORIENTATION"
  | "TEACHING_METHODOLOGY"
  | "CLASSROOM_MANAGEMENT"
  | "ASSESSMENT_TRAINING"
  | "CURRICULUM_TRAINING"
  | "QURAN_TAHFEEZ_PEDAGOGY"
  | "IT_TRAINING"
  | "ERP_TRAINING"
  | "CYBERSECURITY_AWARENESS"
  | "CHILD_SAFEGUARDING"
  | "FIRST_AID_SAFETY"
  | "ADMINISTRATIVE_TRAINING"
  | "FINANCE_PROCESS_TRAINING"
  | "LIBRARY_TRAINING"
  | "HOSTEL_PROCESS_TRAINING"
  | "TRANSPORT_SAFETY_TRAINING"
  | "PROFESSIONAL_DEVELOPMENT"
  | "WORKSHOP"
  | "SEMINAR"
  | "OTHER";

export type DeliveryMethod =
  | "IN_PERSON"
  | "ONLINE"
  | "HYBRID"
  | "SELF_PACED"
  | "WORKSHOP"
  | "SEMINAR"
  | "ORIENTATION";

export type TrainingStatus =
  | "DRAFT"
  | "REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "REGISTRATION_OPEN"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type MandatoryStatus =
  | "MANDATORY"
  | "OPTIONAL"
  | "RECOMMENDED";

export type ParticipantStatus =
  | "ASSIGNED"
  | "REGISTERED"
  | "CONFIRMED"
  | "WAITLISTED"
  | "ATTENDED"
  | "PARTIALLY_ATTENDED"
  | "COMPLETED"
  | "FAILED"
  | "WITHDRAWN"
  | "EXEMPT";

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "EXCUSED"
  | "PARTIAL";

export type AssessmentStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "PASSED"
  | "FAILED"
  | "EXEMPT";

export type CompetencyLevel =
  | "INTRODUCTORY"
  | "DEVELOPING"
  | "PROFICIENT"
  | "ADVANCED";

export type CertificateStatus =
  | "VALID"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "RENEWED"
  | "REVOKED";

export interface TrainingMaterial {
  id: string;
  titleBn: string;
  titleEn: string;
  type: "PDF" | "DOCUMENT" | "SLIDES" | "LINK" | "VIDEO_REF" | "SOP_REF";
  fileUrl?: string;
  sopDocumentId?: string; // Phase 38 Knowledge SOP link
  description?: string;
}

export interface TrainingModule {
  id: string;
  moduleNumber: number;
  titleBn: string;
  titleEn: string;
  description: string;
  topics: string[];
  materials?: TrainingMaterial[];
  estimatedHours: number;
  requiresCompletion: boolean;
}

export interface TrainingSession {
  id: string; // e.g. EHRJ-TRN-SES-2026-001
  trainingProgramId: string;
  sessionNumber: number;
  titleBn: string;
  titleEn: string;
  sessionDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string; // e.g. "সেমিনার হল", "কম্পিউটার ল্যাব"
  facilitatorName: string;
  facilitatorRole: string;
  capacity: number;
  calendarEventId?: string; // Phase 33 Calendar Reference
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

export interface TrainingAssessmentQuestion {
  id: string;
  questionBn: string;
  questionEn?: string;
  type: "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER";
  options?: string[];
  correctAnswer: string; // Redacted for participants
  explanationBn?: string;
  points: number;
}

export interface TrainingAssessment {
  id: string;
  trainingProgramId: string;
  titleBn: string;
  passPercentage: number; // e.g. 70%
  totalPoints: number;
  questions: TrainingAssessmentQuestion[];
  instructionsBn?: string;
}

export interface TrainingAssessmentSubmission {
  id: string;
  assessmentId: string;
  trainingProgramId: string;
  employeeId: string; // Phase 13 Employee ID
  employeeName: string;
  answers: Record<string, string>; // questionId -> answer
  score: number;
  percentage: number;
  status: AssessmentStatus;
  attemptNumber: number;
  submittedAt: string;
  evaluatedBy?: string;
  instructorFeedback?: string;
}

export interface TrainingAttendanceRecord {
  id: string;
  trainingProgramId: string;
  sessionId: string;
  employeeId: string; // Phase 13 Employee ID
  employeeName: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  qrVerified: boolean;
  recordedBy: string;
  recordedAt: string;
  notes?: string;
}

export interface TrainingCertificate {
  id: string; // e.g. EHRJ-TRN-CERT-2026-0001
  trainingProgramId: string;
  trainingProgramTitleBn: string;
  employeeId: string; // Phase 13 Employee ID
  employeeName: string;
  designation: string;
  department: string;
  verificationToken: string; // Phase 7/29 token for /verify/document/[token]
  qrCodeToken: string;
  certificateType:
    | "TRAINING_COMPLETION"
    | "PROFESSIONAL_DEVELOPMENT"
    | "WORKSHOP_PARTICIPATION"
    | "MANDATORY_COMPLIANCE";
  issueDate: string; // YYYY-MM-DD
  validFrom: string; // YYYY-MM-DD
  validUntil?: string; // YYYY-MM-DD
  renewalRequired: boolean;
  renewalPeriodMonths?: number;
  status: CertificateStatus;
  issuedBy: string;
  metadata?: {
    attendancePercentage: number;
    assessmentScore: number;
    totalTrainingHours: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TrainingEnrollment {
  id: string;
  trainingProgramId: string;
  employeeId: string; // Phase 13 Employee ID
  employeeName: string;
  designation: string;
  department: string;
  userRole: string; // TEACHER, STAFF, ADMIN
  status: ParticipantStatus;
  assignedAt?: string;
  assignedBy?: string;
  isMandatory: boolean;
  dueDate?: string;
  registrationDate?: string;
  attendanceRate: number; // 0 - 100
  assessmentScore?: number;
  assessmentStatus: AssessmentStatus;
  isCompleted: boolean;
  completionDate?: string;
  certificateId?: string;
  notes?: string;
}

export interface ProfessionalDevelopmentPlan {
  id: string;
  employeeId: string; // Phase 13
  employeeName: string;
  department: string;
  designation: string;
  objectiveBn: string;
  competencyCategory: string; // TEACHING, SAFETY, IT, ADMINISTRATION
  targetCompetencyLevel: CompetencyLevel;
  requiredTrainingIds: string[];
  targetCompletionDate: string;
  progressPercentage: number;
  status: "ACTIVE" | "COMPLETED" | "UNDER_REVIEW";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingProgram {
  id: string; // e.g. EHRJ-TRN-2026-THF001
  trainingCode: string; // e.g. EHRJ-TRN-2026-THF001
  titleBn: string;
  titleEn: string;
  titleAr?: string;
  trainingType: TrainingType;
  deliveryMethod: DeliveryMethod;
  description: string;
  objectivesBn: string[];
  ownerDepartment: string;
  instructorName: string;
  instructorRole: string;
  totalHours: number;
  mandatoryStatus: MandatoryStatus;
  targetDesignations: string[];
  targetDepartments: string[];
  prerequisites?: string[];
  requiredSopIds?: string[]; // Phase 38 SOP preconditions
  capacity: number;
  
  // Completion Criteria Configuration
  attendanceThresholdPercentage: number; // e.g. 80% or 100%
  requiresAssessment: boolean;
  passPercentage?: number;
  requiresInstructorApproval: boolean;
  issuesCertificate: boolean;
  certificateValidityMonths?: number; // e.g. 12 or 24 months, null = permanent
  
  status: TrainingStatus;
  currentVersion: number;
  
  modules: TrainingModule[];
  sessions: TrainingSession[];
  assessment?: TrainingAssessment;
  
  feedbackSurveyId?: string; // Phase 37 Feedback integration
  
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface TrainingAuditEntry {
  id: string;
  timestamp: string;
  trainingProgramId: string;
  employeeId?: string;
  action:
    | "CREATE_PROGRAM"
    | "UPDATE_PROGRAM"
    | "APPROVE_PROGRAM"
    | "PUBLISH_PROGRAM"
    | "SCHEDULE_SESSION"
    | "ASSIGN_EMPLOYEE"
    | "ENROLL_PARTICIPANT"
    | "WAITLIST_PARTICIPANT"
    | "RECORD_ATTENDANCE"
    | "SUBMIT_ASSESSMENT"
    | "EVALUATE_ASSESSMENT"
    | "COMPLETE_TRAINING"
    | "ISSUE_CERTIFICATE"
    | "RENEW_CERTIFICATE"
    | "CANCEL_PROGRAM";
  actorId: string;
  actorName: string;
  actorRole: string;
  notes?: string;
  details?: Record<string, any>;
}

export interface TrainingDashboardStats {
  totalPrograms: number;
  activePrograms: number;
  scheduledSessionsCount: number;
  totalEnrollments: number;
  mandatoryCompletionRate: number; // %
  certificatesIssuedCount: number;
  expiringCertificatesCount: number;
  pendingAssessmentsCount: number;
}
