// backend/src/modules/teacher/teacher.service.ts
// Teacher business logic

import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logAudit } from '../../utils/auditLogger';
import { notDeleted, PaginationQuery } from '../../shared/types';
import { buildPaginationMeta } from '../../shared/utils/response';
import type { CreateTeacherInput, UpdateTeacherInput } from './teacher.schema';

const teacherInclude = {
  user: { select: { id: true, username: true, isActive: true } },
  classes: true,
  subjects: true,
} as const;

export class TeacherService {
  /**
   * Get paginated list of teachers
   */
  async findAll(query: PaginationQuery) {
    const pageNum = Number(query.page) || 1;
    const limitNum = Number(query.limit) || 20;
    const search = query.search || '';
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const skip = (pageNum - 1) * limitNum;

    const where: any = { ...notDeleted };
    if (search) {
      where.OR = [
        { nameBn: { contains: search, mode: 'insensitive' } },
        { teacherId: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        include: teacherInclude,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.teacher.count({ where }),
    ]);

    return {
      teachers,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    };
  }

  /**
   * Get single teacher by ID
   */
  async findById(id: string) {
    const teacher = await prisma.teacher.findFirst({
      where: { id, ...notDeleted },
      include: teacherInclude,
    });

    if (!teacher) throw new AppError('শিক্ষক পাওয়া যায়নি', 404);
    return teacher;
  }

  /**
   * Create teacher + associated user account
   */
  async create(input: CreateTeacherInput, actorId: string) {
    const teacherRole = await prisma.role.findUnique({ where: { name: 'TEACHER' } });
    if (!teacherRole) throw new AppError('Teacher role পাওয়া যায়নি, সিড চালান', 500);

    const teacher = await prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(input.password, 12);

      const user = await tx.user.create({
        data: {
          username: input.username,
          passwordHash,
          roleId: teacherRole.id,
          mustChangePassword: true,
          isActive: true,
        },
      });

      return tx.teacher.create({
        data: {
          teacherId: input.teacherId,
          nameBn: input.nameBn,
          phone: input.phone,
          designation: input.designation || null,
          joinDate: input.joinDate ? new Date(input.joinDate) : null,
          userId: user.id,
        },
        include: teacherInclude,
      });
    });

    await logAudit(actorId, 'CREATE_TEACHER', 'teacher', `শিক্ষক ${teacher.teacherId} তৈরি`);
    return teacher;
  }

  /**
   * Update teacher details
   */
  async update(id: string, input: UpdateTeacherInput, actorId: string) {
    await this.findById(id); // Throws 404 if not found

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        nameBn: input.nameBn,
        phone: input.phone,
        designation: input.designation,
        joinDate: input.joinDate ? new Date(input.joinDate) : undefined,
      },
      include: teacherInclude,
    });

    await logAudit(actorId, 'UPDATE_TEACHER', 'teacher', `শিক্ষক ${teacher.teacherId} আপডেট`);
    return teacher;
  }

  /**
   * Soft delete teacher + deactivate user
   */
  async delete(id: string, actorId: string) {
    const teacher = await this.findById(id);

    await prisma.$transaction(async (tx) => {
      await tx.teacher.update({ where: { id }, data: { isDeleted: true } });
      await tx.user.update({ where: { id: teacher.userId }, data: { isActive: false, isDeleted: true } });
    });

    await logAudit(actorId, 'DELETE_TEACHER', 'teacher', `শিক্ষক ${teacher.teacherId} মুছে ফেলা`);
  }
}

export const teacherService = new TeacherService();
