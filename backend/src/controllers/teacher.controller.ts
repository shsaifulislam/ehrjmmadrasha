import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { logAudit } from '../utils/auditLogger';

export const createTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teacherId, nameBn, phone, designation, joinDate, username, password } = req.body;

    const teacherRole = await prisma.role.findUnique({ where: { name: 'TEACHER' } });
    if (!teacherRole) return next(new AppError('Teacher role not found', 500));

    const result = await prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(password, 10);
      
      const user = await tx.user.create({
        data: {
          username,
          passwordHash,
          roleId: teacherRole.id,
          mustChangePassword: true,
          isActive: true
        }
      });

      const teacher = await tx.teacher.create({
        data: {
          teacherId,
          nameBn,
          phone,
          designation,
          joinDate: joinDate ? new Date(joinDate) : null,
          userId: user.id
        }
      });

      await logAudit(req.user.id, 'CREATE_TEACHER', `Teacher ${teacher.teacherId}`);
      return teacher;
    });

    res.status(201).json({ status: 'success', data: { teacher: result } });
  } catch (error) { next(error); }
};

export const getTeachers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    let whereClause: any = { isDeleted: false };
    if (search) {
      whereClause.OR = [
        { nameBn: { contains: String(search), mode: 'insensitive' } },
        { teacherId: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where: whereClause,
        include: { user: { select: { id: true, username: true, isActive: true } }, classes: true, subjects: true },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.teacher.count({ where: whereClause })
    ]);

    res.status(200).json({ status: 'success', data: { teachers, total, page: Number(page), limit: Number(limit) } });
  } catch (error) { next(error); }
};

export const getTeacherById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teacher = await prisma.teacher.findFirst({
      where: { id: req.params.id as string, isDeleted: false },
      include: { user: { select: { id: true, username: true, isActive: true } }, classes: true, subjects: true }
    });

    if (!teacher) return next(new AppError('Teacher not found', 404));

    res.status(200).json({ status: 'success', data: { teacher } });
  } catch (error) { next(error); }
};

export const updateTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nameBn, phone, designation, joinDate } = req.body;
    
    const teacher = await prisma.teacher.update({
      where: { id: req.params.id as string },
      data: {
        nameBn, phone, designation,
        joinDate: joinDate ? new Date(joinDate) : undefined
      }
    });

    await logAudit(req.user.id, 'UPDATE_TEACHER', `Teacher ${teacher.teacherId}`);
    res.status(200).json({ status: 'success', data: { teacher } });
  } catch (error) { next(error); }
};

export const deleteTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teacher = await prisma.teacher.update({
      where: { id: req.params.id as string },
      data: { isDeleted: true }
    });
    
    await prisma.user.update({
      where: { id: teacher.userId },
      data: { isActive: false, isDeleted: true }
    });

    await logAudit(req.user.id, 'DELETE_TEACHER', `Teacher ${teacher.teacherId}`);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) { next(error); }
};
