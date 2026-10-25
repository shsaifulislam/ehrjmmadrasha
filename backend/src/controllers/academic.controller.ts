import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { logAudit } from '../utils/auditLogger';
import bcrypt from 'bcryptjs';

// ----------------- SESSION CRUD -----------------
export const createSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { year, isActive } = req.body;
    
    // Check if session already exists
    const existing = await prisma.session.findFirst({ where: { year } });
    if (existing) return next(new AppError('এই সেশনটি ইতিমধ্যে তৈরি করা হয়েছে।', 400));

    const session = await prisma.session.create({ data: { year, isActive } });
    await logAudit(req.user.id, 'CREATE_SESSION', `Session ${session.id}`);
    res.status(201).json({ status: 'success', data: { session } });
  } catch (error) { next(error); }
};

export const getAllSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await prisma.session.findMany({ orderBy: { year: 'desc' } });
    res.status(200).json({ status: 'success', data: { sessions } });
  } catch (error) { next(error); }
};

// ----------------- CLASS CRUD -----------------
export const createClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, numericValue } = req.body;

    const existing = await prisma.class.findFirst({ where: { name, isDeleted: false } });
    if (existing) return next(new AppError('এই শ্রেণীটি ইতিমধ্যে তৈরি করা হয়েছে।', 400));

    const newClass = await prisma.class.create({ data: { name, numericValue } });
    await logAudit(req.user.id, 'CREATE_CLASS', `Class ${newClass.id}`);
    res.status(201).json({ status: 'success', data: { class: newClass } });
  } catch (error) { next(error); }
};

export const getAllClasses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classes = await prisma.class.findMany({ where: { isDeleted: false }, orderBy: { numericValue: 'asc' } });
    res.status(200).json({ status: 'success', data: { classes } });
  } catch (error) { next(error); }
};

// ----------------- STUDENT CRUD -----------------
export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, roll, nameBn, classId, sessionId, guardianId } = req.body;
    
    // Check duplicate studentId
    const existingId = await prisma.student.findUnique({ where: { studentId } });
    if (existingId) return next(new AppError('এই স্টুডেন্ট আইডিটি ইতিমধ্যে ব্যবহৃত হচ্ছে।', 400));

    // Check duplicate roll/class/session
    const existingRoll = await prisma.student.findFirst({
      where: { roll, classId, sessionId, isDeleted: false }
    });
    if (existingRoll) return next(new AppError('এই শ্রেণীতে এই রোল নম্বরটি ইতিমধ্যে বরাদ্দ করা হয়েছে।', 400));

    // Create student with user transactionally
    const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    if (!studentRole) return next(new AppError('Student role not found', 500));

    const defaultPassword = studentId; // ID as default password
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: studentId,
          passwordHash,
          roleId: studentRole.id,
          mustChangePassword: true,
          isActive: true
        }
      });

      const student = await tx.student.create({
        data: {
          studentId,
          roll,
          nameBn,
          classId,
          sessionId,
          guardianId,
          userId: user.id
        }
      });

      await logAudit(req.user.id, 'CREATE_STUDENT', `Student ${student.studentId}`);
      return student;
    });

    res.status(201).json({ status: 'success', data: { student: result } });
  } catch (error) { next(error); }
};

export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, sessionId, search } = req.query;
    
    let whereClause: any = { isDeleted: false };
    if (classId) whereClause.classId = String(classId);
    if (sessionId) whereClause.sessionId = String(sessionId);
    if (search) {
      whereClause.OR = [
        { nameBn: { contains: String(search), mode: 'insensitive' } },
        { studentId: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        class: true,
        session: true,
        user: {
          select: {
            id: true,
            username: true,
            isActive: true
          }
        }
      },
      orderBy: { roll: 'asc' }
    });

    res.status(200).json({ status: 'success', data: { students } });
  } catch (error) { next(error); }
};

export const getStudentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id as string, isDeleted: false },
      include: {
        class: true,
        session: true,
        user: {
          select: {
            id: true,
            username: true,
            isActive: true
          }
        }
      }
    });

    if (!student) return next(new AppError('শিক্ষার্থী পাওয়া যায়নি।', 404));

    res.status(200).json({ status: 'success', data: { student } });
  } catch (error) { next(error); }
};

export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roll, nameBn, nameEn, classId, sessionId, guardianId } = req.body;

    const student = await prisma.student.findFirst({
      where: { id: req.params.id as string, isDeleted: false }
    });
    if (!student) return next(new AppError('শিক্ষার্থী পাওয়া যায়নি।', 404));

    // Check duplicate roll/class/session if changing
    const finalRoll = roll !== undefined ? roll : student.roll;
    const finalClassId = classId !== undefined ? classId : student.classId;
    const finalSessionId = sessionId !== undefined ? sessionId : student.sessionId;

    if (roll !== undefined || classId !== undefined || sessionId !== undefined) {
      const duplicate = await prisma.student.findFirst({
        where: {
          roll: finalRoll,
          classId: finalClassId,
          sessionId: finalSessionId,
          id: { not: student.id },
          isDeleted: false
        }
      });
      if (duplicate) {
        return next(new AppError('এই শ্রেণীতে এই রোল নম্বরটি ইতিমধ্যে বরাদ্দ করা হয়েছে।', 400));
      }
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: { roll, nameBn, nameEn, classId, sessionId, guardianId }
    });

    await logAudit(req.user.id, 'UPDATE_STUDENT', `Student ${updated.studentId}`);
    res.status(200).json({ status: 'success', data: { student: updated } });
  } catch (error) { next(error); }
};

export const deleteStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id as string, isDeleted: false }
    });
    if (!student) return next(new AppError('শিক্ষার্থী পাওয়া যায়নি।', 404));

    await prisma.$transaction([
      prisma.student.update({
        where: { id: student.id },
        data: { isDeleted: true }
      }),
      prisma.user.update({
        where: { id: student.userId },
        data: { isActive: false, isDeleted: true }
      })
    ]);

    await logAudit(req.user.id, 'DELETE_STUDENT', `Student ${student.studentId}`);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) { next(error); }
};
