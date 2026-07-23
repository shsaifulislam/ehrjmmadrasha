// Frontend API type definitions matching backend ApiResponse
// frontend/src/lib/types.ts

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
  // Legacy compat
  status?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── Auth Types ─────────────────────────────────────
export interface AuthUser {
  id: string;
  username: string;
  roleId: string;
  mustChangePassword: boolean;
  isActive: boolean;
  role: {
    id: string;
    name: string;
    permissions: Array<{
      permission: { id: string; name: string; module: string };
    }>;
  };
}

// ─── Dashboard Types ────────────────────────────────
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSessions: number;
  totalFeeTypes: number;
  pendingAdmissions: number;
  todayIncome: number;
  todayExpense: number;
  monthlyIncome: number;
  monthlyDue: number;
  recentPayments: RecentPayment[];
  recentActivities: RecentActivity[];
}

export interface RecentPayment {
  id: string;
  studentName: string;
  className: string;
  amount: number;
  method: string;
  date: string;
  receivedBy: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  resource: string;
  details: string | null;
  user: string;
  date: string;
}

// ─── Academic Types ─────────────────────────────────
export interface Session {
  id: string;
  year: string;
  isActive: boolean;
  createdAt: string;
}

export interface Class {
  id: string;
  name: string;
  numericValue: number;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: { students: number };
}
export type ClassModel = Class;
export type SessionModel = Session;
export type StudentModel = Student;
export type TeacherModel = Teacher;
export type FeeTypeModel = FeeType;

export interface Department {
  id: string;
  name: string;
  type: string;
  isDeleted: boolean;
  _count?: { students: number };
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  classId: string;
  class?: Class;
}

export interface Student {
  id: string;
  studentId: string;
  roll: number;
  nameBn: string;
  nameEn?: string | null;
  gender?: string | null;
  address?: string | null;
  phone?: string | null;
  guardian?: { id?: string; name?: string | null; phone?: string | null } | null;
  classId: string;
  sessionId: string;
  class?: Class;
  session?: Session;
  department?: Department | null;
  user?: { id: string; username: string; isActive: boolean };
}

// ─── Teacher Types ──────────────────────────────────
export interface Teacher {
  id: string;
  teacherId: string;
  nameBn: string;
  phone: string;
  designation?: string | null;
  joinDate?: string | null;
  userId: string;
  user?: { id: string; username: string; isActive: boolean };
}

// ─── Finance Types ──────────────────────────────────
export interface FeeType {
  id: string;
  name: string;
  defaultAmount: number;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  month: number | null;
  year: number;
  type: string;
  totalAmount: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  student?: {
    id: string;
    studentId: string;
    roll: number;
    nameBn: string;
    class?: { id: string; name: string };
  };
  items?: InvoiceItem[];
  payments?: Payment[];
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  feeTypeId: string;
  amount: number;
  feeType?: { id: string; name: string };
}

export interface Payment {
  id: string;
  invoiceId: string;
  amountPaid: number;
  method: string;
  paymentDate: string;
  receivedBy?: { id: string; username: string };
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  loggedBy?: { id: string; username: string };
}

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  purpose: string | null;
  date: string;
}

// ─── Attendance Types ───────────────────────────────
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE";

export interface AttendanceStudentItem {
  id: string;
  studentId: string;
  roll: number;
  nameBn: string;
  nameEn?: string | null;
  className: string;
  status: AttendanceStatus | null;
}

export interface AttendanceSummary {
  totalStudents: number;
  recordedCount: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  percentage: number;
}

export interface AttendanceDataResponse {
  date: string;
  class: { id: string; name: string };
  summary: AttendanceSummary;
  students: AttendanceStudentItem[];
}

export interface DailyReportResponse {
  date: string;
  class: { id: string; name: string };
  summary: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    leaveCount: number;
    unrecordedCount: number;
    percentage: number;
  };
  absentStudents: Array<{ id: string; studentId: string; roll: number; nameBn: string }>;
  leaveStudents: Array<{ id: string; studentId: string; roll: number; nameBn: string }>;
}

export interface MonthlyReportResponse {
  year: number;
  month: number;
  class: { id: string; name: string };
  totalWorkingDays: number;
  students: Array<{
    id: string;
    studentId: string;
    roll: number;
    nameBn: string;
    presentCount: number;
    absentCount: number;
    leaveCount: number;
    percentage: number;
  }>;
}

// ─── Exam & Result Types ────────────────────────────
export interface Exam {
  id: string;
  name: string;
  sessionId: string;
  isPublished: boolean;
  createdAt: string;
  session?: { id: string; year: string };
  _count?: { results: number };
}

export interface MarksEntrySheetResponse {
  exam: { id: string; name: string };
  class: { id: string; name: string };
  subject: {
    id: string;
    name: string;
    code: string | null;
    fullMarks: number;
    passMarks: number;
  };
  students: Array<{
    id: string;
    studentId: string;
    roll: number;
    nameBn: string;
    nameEn?: string | null;
    marks: number | null;
    grade: string | null;
  }>;
}

export interface SubjectResultItem {
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  fullMarks: number;
  passMarks: number;
  obtainedMarks: number | null;
  grade: string;
  gradePoint: number;
}

export interface RankedStudentResult {
  student: {
    id: string;
    studentId: string;
    roll: number;
    nameBn: string;
    nameEn?: string | null;
  };
  subjectBreakdown: SubjectResultItem[];
  totalObtained: number;
  totalFullMarks: number;
  gpa: number;
  finalGrade: string;
  position: number;
  hasFailed: boolean;
}

export interface ClassResultSheetResponse {
  exam: { id: string; name: string; session: string; isPublished: boolean };
  class: { id: string; name: string };
  subjects: Array<{ id: string; name: string; fullMarks: number }>;
  students: RankedStudentResult[];
}

export interface StudentResultCardResponse {
  madrasaInfo: {
    nameBn: string;
    address: string;
    established: string;
  };
  exam: { id: string; name: string; session: string; isPublished: boolean };
  student: {
    id: string;
    studentId: string;
    roll: number;
    nameBn: string;
    nameEn?: string | null;
    className: string;
    sessionYear: string;
    departmentName?: string | null;
  };
  results: SubjectResultItem[];
  summary: {
    totalObtained: number;
    totalFullMarks: number;
    gpa: number;
    finalGrade: string;
    position: number;
    hasFailed: boolean;
  };
}


