/**
 * EHRJ Institutional Calendar, Scheduling, Routine & Resource Booking Engine Types
 * Checkpoint: EHRJ-AI-2026-PHASE33
 */

export type CalendarType =
  | "INSTITUTIONAL"
  | "ACADEMIC"
  | "EXAMINATION"
  | "ADMISSION"
  | "FINANCE"
  | "EVENT"
  | "MEETING"
  | "LIBRARY"
  | "RESIDENTIAL"
  | "TRANSPORT"
  | "HR"
  | "HELPDESK"
  | "WORKFLOW"
  | "PERSONAL";

export type CalendarEventStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED"
  | "POSTPONED"
  | "ARCHIVED";

export type CalendarEventVisibility =
  | "PUBLIC"
  | "INSTITUTIONAL"
  | "ADMIN_ONLY"
  | "PRINCIPAL"
  | "TEACHER"
  | "GUARDIAN"
  | "TARGETED";

export type EventSourceModule =
  | "ACADEMIC"
  | "EXAM"
  | "ADMISSION"
  | "FINANCE"
  | "DOCUMENT"
  | "LIBRARY"
  | "RESIDENTIAL"
  | "TRANSPORT"
  | "INVENTORY"
  | "HR"
  | "HELPDESK"
  | "CMS"
  | "WORKFLOW"
  | "GOVERNANCE"
  | "COMPLIANCE"
  | "MANUAL";

export type ConflictType =
  | "TEACHER_CONFLICT"
  | "CLASS_CONFLICT"
  | "SECTION_CONFLICT"
  | "ROOM_CONFLICT"
  | "RESOURCE_CONFLICT"
  | "EXAM_CONFLICT"
  | "EVENT_CONFLICT"
  | "TRANSPORT_CONFLICT"
  | "HOLIDAY_CONFLICT";

export type ConflictSeverity = "INFO" | "WARNING" | "ERROR" | "BLOCKING";

export type ResourceType =
  | "CLASSROOM"
  | "MEETING_ROOM"
  | "AUDITORIUM"
  | "LAB"
  | "PROJECTOR"
  | "VEHICLE"
  | "OTHER";

export type ResourceStatus = "AVAILABLE" | "MAINTENANCE" | "RETIRED";

export type BookingStatus =
  | "REQUESTED"
  | "PENDING_APPROVAL"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export type HolidayType =
  | "RELIGIOUS"
  | "NATIONAL"
  | "ACADEMIC_BREAK"
  | "EMERGENCY"
  | "INSTITUTIONAL";

export interface RecurrenceRule {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
  interval: number; // e.g. 1 = every week
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  until?: string; // ISO date YYYY-MM-DD
  count?: number; // max occurrences
}

export interface RecurrenceException {
  originalDate: string; // YYYY-MM-DD
  exceptionType: "SKIP" | "MOVE" | "CANCEL" | "REPLACE";
  newStartAt?: string;
  newEndAt?: string;
  reason?: string;
}

export interface ScheduleReminder {
  id: string;
  eventId: string;
  recipientId: string;
  recipientRole: string;
  reminderType: "EMAIL" | "PORTAL";
  offsetMinutes: number; // e.g. 1440 (1 day), 60 (1 hour), 30 (30 min)
  scheduledTime: string; // ISO string
  dispatchedAt?: string;
  status: "PENDING" | "DISPATCHED" | "FAILED";
}

export interface ScheduleConflict {
  id: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  messageBn: string;
  messageEn: string;
  entityA: { type: string; id: string; name: string };
  entityB: { type: string; id: string; name: string };
  timeRange: { startAt: string; endAt: string };
}

export interface CalendarEvent {
  id: string;
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  eventType: CalendarType;
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  timezone: string; // "Asia/Dhaka"
  allDay: boolean;
  status: CalendarEventStatus;
  visibility: CalendarEventVisibility;
  sourceModule: EventSourceModule;
  sourceEntityId?: string;
  location?: string;
  resourceId?: string;
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;
  recurrenceExceptions?: RecurrenceException[];
  targetAudience?: {
    roles?: string[];
    classId?: string;
    sectionId?: string;
    studentId?: string;
    teacherId?: string;
  };
  rescheduledFrom?: {
    startAt: string;
    endAt: string;
    reason: string;
    timestamp: string;
  };
  cancelledReason?: string;
  reminders?: ScheduleReminder[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassRoutineSlot {
  id: string;
  sessionId: string;
  sessionName?: string;
  classId: string;
  classNameBn: string;
  classNameEn?: string;
  sectionId?: string;
  sectionNameBn?: string;
  subjectId: string;
  subjectNameBn: string;
  subjectNameEn?: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  startTime: string; // HH:mm e.g. "08:00"
  endTime: string; // HH:mm e.g. "08:50"
  roomNo?: string;
  periodNumber?: number; // 1st period, 2nd period...
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionalHoliday {
  id: string;
  titleBn: string;
  titleEn: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  holidayType: HolidayType;
  description?: string;
  descriptionBn?: string;
  affectsClassRoutine: boolean;
  affectsExamRoutine: boolean;
  affectsOffices: boolean;
  isPublic: boolean;
  createdAt: string;
}

export interface InstitutionalResource {
  id: string;
  nameBn: string;
  nameEn: string;
  type: ResourceType;
  capacity: number;
  location: string;
  status: ResourceStatus;
  isExclusive: boolean;
  requiresApproval: boolean;
  description?: string;
  equipment?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ResourceBooking {
  id: string;
  resourceId: string;
  resourceNameBn: string;
  title: string;
  purpose: string;
  requestedBy: string; // userId
  requestedByName: string;
  requestedByRole: string;
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  participantCount: number;
  status: BookingStatus;
  approvalNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InternalMeeting {
  id: string;
  title: string;
  agenda: string;
  meetingType:
    | "ADMINISTRATIVE"
    | "ACADEMIC_COUNCIL"
    | "TEACHER_STAFF"
    | "DEPARTMENTAL"
    | "DISCIPLINARY"
    | "EMERGENCY";
  startAt: string;
  endAt: string;
  location: string;
  resourceId?: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "POSTPONED";
  organizerId: string;
  organizerName: string;
  participants: Array<{
    userId: string;
    role: string;
    name: string;
    status: "INVITED" | "ACCEPTED" | "DECLINED" | "ATTENDED";
  }>;
  notes?: string;
  visibility: "ADMIN_ONLY" | "PRINCIPAL" | "TEACHER" | "TARGETED";
  createdAt: string;
  updatedAt: string;
}

export interface CalendarAuditEntry {
  id: string;
  action:
    | "CREATE_EVENT"
    | "UPDATE_EVENT"
    | "RESCHEDULE_EVENT"
    | "CANCEL_EVENT"
    | "CREATE_ROUTINE"
    | "UPDATE_ROUTINE"
    | "DELETE_ROUTINE"
    | "CREATE_HOLIDAY"
    | "UPDATE_HOLIDAY"
    | "BOOK_RESOURCE"
    | "APPROVE_BOOKING"
    | "REJECT_BOOKING"
    | "CANCEL_BOOKING"
    | "SCHEDULE_MEETING";
  entityType: "EVENT" | "ROUTINE" | "HOLIDAY" | "RESOURCE" | "BOOKING" | "MEETING";
  entityId: string;
  actorId: string;
  actorRole: string;
  details: string;
  timestamp: string;
}

export interface CalendarQueryOptions {
  startDate: string; // ISO string or YYYY-MM-DD
  endDate: string; // ISO string or YYYY-MM-DD
  userRole?: string; // ADMIN, PRINCIPAL, TEACHER, GUARDIAN, PUBLIC
  userId?: string;
  classId?: string;
  sectionId?: string;
  studentId?: string;
  types?: CalendarType[];
  search?: string;
  includeRoutineOccurrences?: boolean;
}
