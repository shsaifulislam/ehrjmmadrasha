import { AdmissionTimeline } from "@prisma/client";
import prisma from "../../../config/prisma";

export class AdmissionTimelineRepository {
  async createTimeline(admissionId: string, action: string, description?: string, performedBy?: string): Promise<AdmissionTimeline> {
    return prisma.admissionTimeline.create({
      data: {
        admissionId,
        action,
        description: description || null,
        performedBy: performedBy || "SYSTEM",
      },
    });
  }

  async findByAdmissionId(admissionId: string): Promise<AdmissionTimeline[]> {
    return prisma.admissionTimeline.findMany({
      where: { admissionId },
      orderBy: { createdAt: "asc" },
    });
  }
}

export default new AdmissionTimelineRepository();
