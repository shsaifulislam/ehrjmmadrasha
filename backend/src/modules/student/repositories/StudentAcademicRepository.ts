import prisma from "../../../config/prisma";

export class StudentAcademicRepository {
  async promoteStudent(studentId: string, nextClassId: string, nextSessionId: string, nextRoll: number, updatedBy: string) {
    return prisma.student.update({
      where: { id: studentId },
      data: {
        classId: nextClassId,
        sessionId: nextSessionId,
        roll: nextRoll,
        updatedBy,
        version: { increment: 1 },
      },
    });
  }

  async transferStudent(studentId: string, remarks: string, updatedBy: string) {
    return prisma.student.update({
      where: { id: studentId },
      data: {
        isActive: false,
        remarks: `Transferred/TC Issued: ${remarks}`,
        updatedBy,
      },
    });
  }
}

export default new StudentAcademicRepository();
