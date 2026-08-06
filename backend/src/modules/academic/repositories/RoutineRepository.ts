import prisma from "../../../config/prisma";

export interface CreateRoutineData {
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNo?: string;
}

export class RoutineRepository {
  static async create(data: CreateRoutineData) {
    return prisma.classRoutine.create({
      data,
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });
  }

  static async findByClass(classId: string) {
    return prisma.classRoutine.findMany({
      where: { classId, isDeleted: false },
      include: {
        subject: true,
        teacher: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  static async findByTeacher(teacherId: string) {
    return prisma.classRoutine.findMany({
      where: { teacherId, isDeleted: false },
      include: {
        class: true,
        subject: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  static async findTeacherTimeSlotClashes(teacherId: string, dayOfWeek: string, startTime: string, endTime: string, excludeId?: string) {
    return prisma.classRoutine.findMany({
      where: {
        teacherId,
        dayOfWeek,
        isDeleted: false,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
          { startTime: { gte: startTime }, endTime: { lte: endTime } },
        ],
      },
      include: {
        class: true,
        subject: true,
      },
    });
  }

  static async findClassTimeSlotClashes(classId: string, dayOfWeek: string, startTime: string, endTime: string, excludeId?: string) {
    return prisma.classRoutine.findMany({
      where: {
        classId,
        dayOfWeek,
        isDeleted: false,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
          { startTime: { gte: startTime }, endTime: { lte: endTime } },
        ],
      },
      include: {
        subject: true,
        teacher: true,
      },
    });
  }

  static async findRoomTimeSlotClashes(roomNo: string, dayOfWeek: string, startTime: string, endTime: string, excludeId?: string) {
    if (!roomNo) return [];
    return prisma.classRoutine.findMany({
      where: {
        roomNo,
        dayOfWeek,
        isDeleted: false,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
          { startTime: { gte: startTime }, endTime: { lte: endTime } },
        ],
      },
    });
  }

  static async softDelete(id: string) {
    return prisma.classRoutine.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
