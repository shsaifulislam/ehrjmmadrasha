/**
 * EHRJ MADRASHA ERP — PHASE 39
 * Training Assessment Engine
 * 
 * Invariants:
 * 1. ASSESSMENTS ARE STRICTLY FOR PROFESSIONAL DEVELOPMENT.
 * 2. THEY NEVER WRITE TO ACADEMIC EXAM RESULTS OR HR PAYROLL DEDUCTIONS.
 * 3. QUESTIONS RETURNED TO PARTICIPANTS HAVE CORRECT ANSWERS REDACTED.
 * 4. AI IS BOUNDED: AI CAN ASSIST WITH EXPLANATIONS BUT CANNOT AUTONOMOUSLY PASS/FAIL CANDIDATES.
 */

import {
  TrainingAssessment,
  TrainingAssessmentQuestion,
  TrainingAssessmentSubmission,
  AssessmentStatus,
  TrainingEnrollment,
} from "./types";
import {
  getTrainingProgramById,
  getAllSubmissions,
  saveSubmission,
  getAllEnrollments,
  saveEnrollment,
  recordTrainingAudit,
} from "./trainingStore";
import { ActorContext } from "./trainingLifecycleEngine";

/**
 * Returns assessment with answer keys redacted for safe participant consumption
 */
export function getSanitizedAssessment(programId: string): TrainingAssessment | null {
  const program = getTrainingProgramById(programId);
  if (!program || !program.assessment) return null;

  const raw = program.assessment;
  const sanitizedQuestions: TrainingAssessmentQuestion[] = raw.questions.map((q) => ({
    id: q.id,
    questionBn: q.questionBn,
    questionEn: q.questionEn,
    type: q.type,
    options: q.options,
    points: q.points,
    correctAnswer: "", // Strictly redacted for client security
    explanationBn: undefined,
  }));

  return {
    ...raw,
    questions: sanitizedQuestions,
  };
}

/**
 * Evaluates an assessment attempt submitted by a teacher/staff member
 */
export function submitAssessmentAttempt(
  programId: string,
  participant: { employeeId: string; employeeName: string },
  answers: Record<string, string>,
  actor: ActorContext
): { success: boolean; submission?: TrainingAssessmentSubmission; error?: string } {
  const program = getTrainingProgramById(programId);
  if (!program) {
    return { success: false, error: "Training program not found" };
  }

  const assessment = program.assessment;
  if (!assessment) {
    return { success: false, error: "No assessment configured for this program" };
  }

  // Calculate score for objective questions (MCQ / TRUE_FALSE)
  let earnedScore = 0;
  let totalObjectivePoints = 0;
  let hasManualGradingPending = false;

  for (const q of assessment.questions) {
    if (q.type === "MCQ" || q.type === "TRUE_FALSE") {
      totalObjectivePoints += q.points;
      const submittedAns = (answers[q.id] || "").trim();
      const correctAns = (q.correctAnswer || "").trim();
      if (submittedAns.toLowerCase() === correctAns.toLowerCase()) {
        earnedScore += q.points;
      }
    } else {
      // Short answer or practical assessment requires instructor evaluation
      hasManualGradingPending = true;
    }
  }

  const percentage = assessment.totalPoints > 0 ? Math.round((earnedScore / assessment.totalPoints) * 100) : 0;

  // Determine status
  let status: AssessmentStatus = "UNDER_REVIEW";
  if (!hasManualGradingPending) {
    status = percentage >= assessment.passPercentage ? "PASSED" : "FAILED";
  } else {
    status = "SUBMITTED";
  }

  const existingSubmissions = getAllSubmissions().filter(
    (s) => s.trainingProgramId === programId && s.employeeId === participant.employeeId
  );
  const attemptNumber = existingSubmissions.length + 1;

  const now = new Date().toISOString();
  const submissionId = `SUB-TRN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const submission: TrainingAssessmentSubmission = {
    id: submissionId,
    assessmentId: assessment.id,
    trainingProgramId: programId,
    employeeId: participant.employeeId,
    employeeName: participant.employeeName,
    answers,
    score: earnedScore,
    percentage,
    status,
    attemptNumber,
    submittedAt: now,
  };

  saveSubmission(submission);

  // Update enrollment assessment status
  const allEnrollments = getAllEnrollments();
  const enrollment = allEnrollments.find(
    (e) => e.trainingProgramId === programId && e.employeeId === participant.employeeId
  );

  if (enrollment) {
    enrollment.assessmentScore = percentage;
    enrollment.assessmentStatus = status;
    saveEnrollment(enrollment);
  }

  recordTrainingAudit({
    trainingProgramId: programId,
    employeeId: participant.employeeId,
    action: "SUBMIT_ASSESSMENT",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `Assessment attempt #${attemptNumber} submitted by ${participant.employeeName}: ${status} (${percentage}%)`,
    details: {
      submissionId,
      score: earnedScore,
      totalPoints: assessment.totalPoints,
      percentage,
      status,
    },
  });

  return { success: true, submission };
}

/**
 * Manual instructor evaluation for practicals/short answers
 */
export function instructorEvaluateSubmission(
  submissionId: string,
  adjustedScore: number,
  feedback: string,
  actor: ActorContext
): { success: boolean; submission?: TrainingAssessmentSubmission; error?: string } {
  const submissions = getAllSubmissions();
  const submission = submissions.find((s) => s.id === submissionId);
  if (!submission) {
    return { success: false, error: "Submission not found" };
  }

  const program = getTrainingProgramById(submission.trainingProgramId);
  if (!program || !program.assessment) {
    return { success: false, error: "Training assessment not found" };
  }

  const passPct = program.assessment.passPercentage;
  const totalPoints = program.assessment.totalPoints;
  const percentage = Math.min(100, Math.round((adjustedScore / totalPoints) * 100));
  const newStatus: AssessmentStatus = percentage >= passPct ? "PASSED" : "FAILED";

  submission.score = adjustedScore;
  submission.percentage = percentage;
  submission.status = newStatus;
  submission.evaluatedBy = actor.actorName;
  submission.instructorFeedback = feedback;

  saveSubmission(submission);

  // Update enrollment
  const allEnrollments = getAllEnrollments();
  const enrollment = allEnrollments.find(
    (e) => e.trainingProgramId === submission.trainingProgramId && e.employeeId === submission.employeeId
  );
  if (enrollment) {
    enrollment.assessmentScore = percentage;
    enrollment.assessmentStatus = newStatus;
    saveEnrollment(enrollment);
  }

  recordTrainingAudit({
    trainingProgramId: submission.trainingProgramId,
    employeeId: submission.employeeId,
    action: "EVALUATE_ASSESSMENT",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `Instructor evaluation by ${actor.actorName}: ${newStatus} (${percentage}%) with feedback`,
    details: { submissionId, adjustedScore, percentage, feedback },
  });

  return { success: true, submission };
}
