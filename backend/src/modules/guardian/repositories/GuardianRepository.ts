import prisma from "../../../config/prisma";
import { CreateGuardianInput, UpdateGuardianInput } from "../guardian.schema";

export class GuardianRepository {
  static async create(data: CreateGuardianInput) {
    return prisma.guardian.create({
      data: {
        name: data.name,
        phone: data.phone,
        relation: data.relation,
        address: data.address,
      },
    });
  }

  static async findById(id: string) {
    return prisma.guardian.findFirst({
      where: { id, isDeleted: false },
      include: {
        students: {
          where: { isDeleted: false },
          include: {
            class: true,
            session: true,
          },
        },
      },
    });
  }

  static async findByPhone(phone: string) {
    return prisma.guardian.findFirst({
      where: { phone, isDeleted: false },
      include: {
        students: {
          where: { isDeleted: false },
        },
      },
    });
  }

  static async findAll(query?: { search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search } },
      ];
    }

    const [guardians, total] = await Promise.all([
      prisma.guardian.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          students: {
            where: { isDeleted: false },
            select: {
              id: true,
              studentId: true,
              nameBn: true,
              roll: true,
              class: { select: { name: true } },
            },
          },
        },
      }),
      prisma.guardian.count({ where }),
    ]);

    return {
      guardians,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async update(id: string, data: UpdateGuardianInput) {
    return prisma.guardian.update({
      where: { id },
      data,
    });
  }

  static async linkWard(guardianId: string, studentId: string) {
    return prisma.student.update({
      where: { id: studentId },
      data: { guardianId },
    });
  }

  static async unlinkWard(studentId: string) {
    return prisma.student.update({
      where: { id: studentId },
      data: { guardianId: null },
    });
  }

  static async softDelete(id: string) {
    return prisma.guardian.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
