// backend/src/modules/academic/academic.service.ts
// Academic module service — Session, Class, Department, Subject, Student

import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logAudit } from '../../utils/auditLogger';
import { notDeleted, PaginationQuery } from '../../shared/types';
import { buildPaginationMeta } from '../../shared/utils/response';
import type {
  CreateSessionInput, CreateClassInput, CreateDepartmentInput,
  CreateSubjectInput, CreateStudentInput, UpdateStudentInput
} from './academic.schema';

const studentInclude = {
  class: true,
  session: true,
  department: true,
  guardian: true,
  user: { select: { id: true, username: true, isActive: true } },
} as const;

export class AcademicService {
  // ─── SESSION ────────────────────────────────────────

  async getAllSessions() {
    return prisma.session.findMany({ orderBy: { year: 'desc' } });
  }

  async createSession(input: CreateSessionInput, actorId: string) {
    const existing = await prisma.session.findFirst({ where: { year: input.year } });
    if (existing) throw new AppError('এই সেশনটি ইতিমধ্যে আছে', 400);

    const session = await prisma.session.create({ data: input });
    await logAudit(actorId, 'CREATE_SESSION', 'session', `সেশন ${input.year} তৈরি`);
    return session;
  }

  async updateSession(id: string, data: Partial<CreateSessionInput>, actorId: string) {
    const session = await prisma.session.update({ where: { id }, data });
    await logAudit(actorId, 'UPDATE_SESSION', 'session', `সেশন ${session.year} আপডেট`);
    return session;
  }

  async deleteSession(id: string, actorId: string) {
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) throw new AppError('সেশন পাওয়া যায়নি', 404);
    await prisma.session.delete({ where: { id } });
    await logAudit(actorId, 'DELETE_SESSION', 'session', `সেশন ${session.year} মুছে ফেলা`);
  }

  // ─── CLASS ──────────────────────────────────────────

  async getAllClasses() {
    return prisma.class.findMany({
      where: notDeleted,
      orderBy: { numericValue: 'asc' },
      include: { _count: { select: { students: true } } },
    });
  }

  async createClass(input: CreateClassInput, actorId: string) {
    const existing = await prisma.class.findFirst({ where: { name: input.name, ...notDeleted } });
    if (existing) throw new AppError('এই শ্রেণীটি ইতিমধ্যে আছে', 400);

    const cls = await prisma.class.create({ data: input });
    await logAudit(actorId, 'CREATE_CLASS', 'class', `শ্রেণী ${input.name} তৈরি`);
    return cls;
  }

  async updateClass(id: string, data: Partial<CreateClassInput>, actorId: string) {
    const cls = await prisma.class.update({ where: { id }, data });
    await logAudit(actorId, 'UPDATE_CLASS', 'class', `শ্রেণী ${cls.name} আপডেট`);
    return cls;
  }

  async deleteClass(id: string, actorId: string) {
    const cls = await prisma.class.findFirst({ where: { id, ...notDeleted } });
    if (!cls) throw new AppError('শ্রেণী পাওয়া যায়নি', 404);
    await prisma.class.update({ where: { id }, data: { isDeleted: true } });
    await logAudit(actorId, 'DELETE_CLASS', 'class', `শ্রেণী ${cls.name} মুছে ফেলা`);
  }

  // ─── DEPARTMENT ─────────────────────────────────────

  async getAllDepartments() {
    return prisma.department.findMany({
      where: notDeleted,
      orderBy: { name: 'asc' },
      include: { _count: { select: { students: true } } },
    });
  }

  async createDepartment(input: CreateDepartmentInput, actorId: string) {
    const existing = await prisma.department.findFirst({ where: { name: input.name, ...notDeleted } });
    if (existing) throw new AppError('এই বিভাগটি ইতিমধ্যে আছে', 400);

    const dept = await prisma.department.create({ data: input });
    await logAudit(actorId, 'CREATE_DEPARTMENT', 'department', `বিভাগ ${input.name} তৈরি`);
    return dept;
  }

  async updateDepartment(id: string, data: Partial<CreateDepartmentInput>, actorId: string) {
    const dept = await prisma.department.update({ where: { id }, data });
    await logAudit(actorId, 'UPDATE_DEPARTMENT', 'department', `বিভাগ ${dept.name} আপডেট`);
    return dept;
  }

  async deleteDepartment(id: string, actorId: string) {
    const dept = await prisma.department.findFirst({ where: { id, ...notDeleted } });
    if (!dept) throw new AppError('বিভাগ পাওয়া যায়নি', 404);
    await prisma.department.update({ where: { id }, data: { isDeleted: true } });
    await logAudit(actorId, 'DELETE_DEPARTMENT', 'department', `বিভাগ ${dept.name} মুছে ফেলা`);
  }

  // ─── SUBJECT ────────────────────────────────────────

  async getAllSubjects(classId?: string) {
    const where: any = { ...notDeleted };
    if (classId) where.classId = classId;

    return prisma.subject.findMany({
      where,
      include: { class: true },
      orderBy: { name: 'asc' },
    });
  }

  async createSubject(input: CreateSubjectInput, actorId: string) {
    const subj = await prisma.subject.create({
      data: input,
      include: { class: true },
    });
    await logAudit(actorId, 'CREATE_SUBJECT', 'subject', `বিষয় ${input.name} তৈরি`);
    return subj;
  }

  async updateSubject(id: string, data: Partial<CreateSubjectInput>, actorId: string) {
    const subj = await prisma.subject.update({ where: { id }, data, include: { class: true } });
    await logAudit(actorId, 'UPDATE_SUBJECT', 'subject', `বিষয় ${subj.name} আপডেট`);
    return subj;
  }

  async deleteSubject(id: string, actorId: string) {
    const subj = await prisma.subject.findFirst({ where: { id, ...notDeleted } });
    if (!subj) throw new AppError('বিষয় পাওয়া যায়নি', 404);
    await prisma.subject.update({ where: { id }, data: { isDeleted: true } });
    await logAudit(actorId, 'DELETE_SUBJECT', 'subject', `বিষয় ${subj.name} মুছে ফেলা`);
  }

  // ─── STUDENT ────────────────────────────────────────

  async findAllStudents(query: PaginationQuery & { classId?: string; sessionId?: string }) {
    const pageNum = Number(query.page) || 1;
    const limitNum = Number(query.limit) || 20;
    const search = query.search || '';
    const sortBy = query.sortBy || 'roll';
    const sortOrder = query.sortOrder || 'asc';
    const skip = (pageNum - 1) * limitNum;

    const where: any = { ...notDeleted };
    if (query.classId) where.classId = query.classId;
    if (query.sessionId) where.sessionId = query.sessionId;
    if (search) {
      where.OR = [
        { nameBn: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: studentInclude,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.student.count({ where }),
    ]);

    return { students, meta: buildPaginationMeta(total, pageNum, limitNum) };
  }

  async findStudentById(id: string) {
    const student = await prisma.student.findFirst({
      where: { id, ...notDeleted },
      include: studentInclude,
    });
    if (!student) throw new AppError('শিক্ষার্থী পাওয়া যায়নি', 404);
    return student;
  }

  async createStudent(input: CreateStudentInput, actorId: string) {
    const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    if (!studentRole) throw new AppError('Student role পাওয়া যায়নি', 500);

    // Duplicate checks
    const existingId = await prisma.student.findUnique({ where: { studentId: input.studentId } });
    if (existingId) throw new AppError('এই স্টুডেন্ট আইডি ইতিমধ্যে ব্যবহৃত', 400);

    const existingRoll = await prisma.student.findFirst({
      where: { roll: input.roll, classId: input.classId, sessionId: input.sessionId, ...notDeleted },
    });
    if (existingRoll) throw new AppError('এই শ্রেণীতে এই রোল নম্বর ইতিমধ্যে বরাদ্দ', 400);

    const student = await prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(input.studentId, 12);

      const user = await tx.user.create({
        data: {
          username: input.studentId,
          passwordHash,
          roleId: studentRole.id,
          mustChangePassword: true,
        },
      });

      return tx.student.create({
        data: {
          studentId: input.studentId,
          roll: input.roll,
          nameBn: input.nameBn,
          nameEn: input.nameEn || null,
          dob: input.dob ? new Date(input.dob) : null,
          bloodGroup: input.bloodGroup || null,
          address: input.address || null,
          classId: input.classId,
          sessionId: input.sessionId,
          departmentId: input.departmentId || null,
          guardianId: input.guardianId || null,
          userId: user.id,
        },
        include: studentInclude,
      });
    });

    await logAudit(actorId, 'CREATE_STUDENT', 'student', `ছাত্র ${input.studentId} তৈরি`);
    return student;
  }

  async updateStudent(id: string, input: UpdateStudentInput, actorId: string) {
    const student = await this.findStudentById(id);

    // Check duplicate roll if changing
    if (input.roll || input.classId || input.sessionId) {
      const finalRoll = input.roll ?? student.roll;
      const finalClassId = input.classId ?? student.classId;
      const finalSessionId = input.sessionId ?? student.sessionId;

      const duplicate = await prisma.student.findFirst({
        where: { roll: finalRoll, classId: finalClassId, sessionId: finalSessionId, id: { not: id }, ...notDeleted },
      });
      if (duplicate) throw new AppError('এই শ্রেণীতে এই রোল নম্বর ইতিমধ্যে বরাদ্দ', 400);
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...input,
        dob: input.dob ? new Date(input.dob) : undefined,
      },
      include: studentInclude,
    });

    await logAudit(actorId, 'UPDATE_STUDENT', 'student', `ছাত্র ${updated.studentId} আপডেট`);
    return updated;
  }

  async deleteStudent(id: string, actorId: string) {
    const student = await this.findStudentById(id);

    await prisma.$transaction([
      prisma.student.update({ where: { id }, data: { isDeleted: true } }),
      prisma.user.update({ where: { id: student.userId }, data: { isActive: false, isDeleted: true } }),
    ]);

    await logAudit(actorId, 'DELETE_STUDENT', 'student', `ছাত্র ${student.studentId} মুছে ফেলা`);
  }
}

export const academicService = new AcademicService();
