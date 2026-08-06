import prisma from "../../../config/prisma";

export class AdmissionExportService {
  /**
   * Exports admission records into CSV format.
   */
  static async exportToCsv(status?: string): Promise<string> {
    const where: any = { deletedAt: null };
    if (status) where.status = status;

    const admissions = await prisma.admission.findMany({
      where,
      include: { class: true },
      orderBy: { createdAt: "desc" },
    });

    const headers = ["Verification Token", "Applicant Name", "Phone", "Father Name", "Class", "Status", "Application Date"];
    const rows = admissions.map((a) => [
      `"${a.verificationToken || a.id}"`,
      `"${a.applicantName.replace(/"/g, '""')}"`,
      `"${a.phone}"`,
      `"${(a.fatherName || "").replace(/"/g, '""')}"`,
      `"${a.class?.name || ""}"`,
      `"${a.status}"`,
      `"${new Date(a.createdAt).toISOString().slice(0, 10)}"`,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }
}

export default AdmissionExportService;
