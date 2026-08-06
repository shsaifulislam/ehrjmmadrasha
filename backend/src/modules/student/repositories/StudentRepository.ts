import { Student } from "@prisma/client";
import prisma from "../../../config/prisma";
import { BaseRepository } from "../../../shared/BaseRepository";

export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super(prisma, "student");
  }

  async findByStudentId(studentId: string): Promise<Student | null> {
    return prisma.student.findFirst({
      where: {
        OR: [{ id: studentId }, { studentId }],
        deletedAt: null,
      },
      include: {
        user: { select: { username: true, isActive: true } },
        class: true,
        session: true,
        guardian: true,
        department: true,
      },
    });
  }

  async findPaginatedStudents(options: {
    classId?: string;
    sessionId?: string;
    guardianId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (options.classId) where.classId = options.classId;
    if (options.sessionId) where.sessionId = options.sessionId;
    if (options.guardianId) where.guardianId = options.guardianId;
    if (options.search) {
      const q = options.search.trim();
      where.OR = [
        { nameBn: { contains: q, mode: "insensitive" } },
        { nameEn: { contains: q, mode: "insensitive" } },
        { studentId: { contains: q, mode: "insensitive" } },
        { brn: { contains: q, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ classId: "asc" }, { roll: "asc" }],
        include: {
          class: true,
          session: true,
          guardian: true,
        },
      }),
      prisma.student.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getStudentStats() {
    const [totalActive, totalInactive, totalMale, totalFemale] = await Promise.all([
      prisma.student.count({ where: { isActive: true, deletedAt: null } }),
      prisma.student.count({ where: { isActive: false, deletedAt: null } }),
      prisma.student.count({ where: { deletedAt: null } }),
      prisma.student.count({ where: { deletedAt: null } }),
    ]);

    return { totalActive, totalInactive, totalMale, totalFemale };
  }
}

export default new StudentRepository();
