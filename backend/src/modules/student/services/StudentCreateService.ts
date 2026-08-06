import bcrypt from "bcryptjs";
import prisma from "../../../config/prisma";
import AuditService from "../../../services/shared/AuditService";

export interface CreateStudentInput {
  nameBn: string;
  nameEn?: string;
  dob?: string;
  brn?: string;
  religion?: string;
  bloodGroup?: string;
  address?: string;
  classId: string;
  sessionId: string;
  guardianPhone: string;
  guardianName: string;
  createdBy?: string;
}

export class StudentCreateService {
  static async execute(input: CreateStudentInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Create or link Guardian
      let guardian = await tx.guardian.findFirst({
        where: { phone: input.guardianPhone, isDeleted: false },
      });

      if (!guardian) {
        guardian = await tx.guardian.create({
          data: {
            name: input.guardianName,
            phone: input.guardianPhone,
            relation: "GUARDIAN",
            address: input.address || "",
          },
        });
      }

      // 2. Generate Student ID & User Account
      const yearStr = new Date().getFullYear().toString().slice(-2);
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const studentIdStr = `STU-${yearStr}-${randomId}`;

      const defaultPassword = await bcrypt.hash("12345678", 10);

      let studentRole = await tx.role.findUnique({ where: { name: "STUDENT" } });
      if (!studentRole) {
        studentRole = await tx.role.create({
          data: { name: "STUDENT", description: "Student Role" },
        });
      }

      const user = await tx.user.create({
        data: {
          username: studentIdStr,
          passwordHash: defaultPassword,
          roleId: studentRole.id,
          isActive: true,
        },
      });

      // 3. Roll Number
      const rollCount = await tx.student.count({
        where: { classId: input.classId, sessionId: input.sessionId },
      });
      const nextRoll = rollCount + 1;

      // 4. Create Student
      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentId: studentIdStr,
          roll: nextRoll,
          nameBn: input.nameBn,
          nameEn: input.nameEn || null,
          dob: input.dob ? new Date(input.dob) : null,
          brn: input.brn || null,
          religion: input.religion || "ISLAM",
          bloodGroup: input.bloodGroup || null,
          address: input.address || null,
          classId: input.classId,
          sessionId: input.sessionId,
          guardianId: guardian.id,
          createdBy: input.createdBy || "SYSTEM",
        },
      });

      // 5. Audit Log
      await AuditService.log({
        userId: input.createdBy || "SYSTEM",
        action: "STUDENT_CREATED",
        resource: "Student",
        details: { studentId: student.id, studentCode: student.studentId },
      });

      return student;
    }, { timeout: 25000 });
  }
}

export default StudentCreateService;
