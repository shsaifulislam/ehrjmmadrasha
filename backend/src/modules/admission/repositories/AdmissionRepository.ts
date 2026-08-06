import { Admission, AdmissionStatus } from "@prisma/client";
import prisma from "../../../config/prisma";
import { BaseRepository } from "../../../shared/BaseRepository";

export class AdmissionRepository extends BaseRepository<Admission> {
  constructor() {
    super(prisma, "admission");
  }

  async findByVerificationToken(verificationToken: string): Promise<Admission | null> {
    return prisma.admission.findUnique({
      where: { verificationToken },
      include: {
        class: true,
        session: true,
        documents: true,
        timelines: { orderBy: { createdAt: "asc" } },
        student: true,
        guardian: true,
        invoice: { include: { payments: true } },
      },
    });
  }

  async findWithDetails(id: string): Promise<Admission | null> {
    return prisma.admission.findFirst({
      where: { id, deletedAt: null },
      include: {
        class: true,
        session: true,
        documents: true,
        timelines: { orderBy: { createdAt: "asc" } },
        student: true,
        guardian: true,
        invoice: { include: { payments: true } },
      },
    });
  }

  async findPaginatedAdmissions(options: {
    status?: AdmissionStatus;
    classId?: string;
    sessionId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (options.status) where.status = options.status;
    if (options.classId) where.classId = options.classId;
    if (options.sessionId) where.sessionId = options.sessionId;
    if (options.search) {
      const q = options.search.trim();
      where.OR = [
        { applicantName: { contains: q, mode: "insensitive" } },
        { applicantNameEn: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { verificationToken: { contains: q, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.admission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          class: true,
          session: true,
          invoice: { select: { id: true, status: true, totalAmount: true } },
        },
      }),
      prisma.admission.count({ where }),
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

  async getAdmissionStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      prisma.admission.count({ where: { deletedAt: null } }),
      prisma.admission.count({ where: { status: "PENDING", deletedAt: null } }),
      prisma.admission.count({ where: { status: "APPROVED", deletedAt: null } }),
      prisma.admission.count({ where: { status: "REJECTED", deletedAt: null } }),
    ]);

    return { total, pending, approved, rejected };
  }
}

export default new AdmissionRepository();
