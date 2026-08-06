import prisma from "../../../config/prisma";
import { AppError } from "../../../utils/AppError";

export class Guardian360Service {
  static async getGuardianFull360Profile(guardianId: string) {
    const guardian = await prisma.guardian.findFirst({
      where: { id: guardianId, isDeleted: false },
      include: {
        students: {
          where: { isDeleted: false },
          include: {
            class: true,
            session: true,
            user: { select: { username: true, isActive: true } },
          },
        },
      },
    });

    if (!guardian) {
      throw new AppError("অভিভাবক প্রোফাইল পাওয়া যায়নি", 404);
    }

    const studentIds = guardian.students.map((s) => s.id);

    // 1. Fee Invoices & Payment Summary across Wards
    const wardInvoices = await prisma.invoice.findMany({
      where: {
        studentId: { in: studentIds },
      },
      include: {
        payments: true,
      },
    });

    const totalInvoiceAmount = wardInvoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
    const totalPaidAmount = wardInvoices.reduce(
      (acc, inv) => acc + inv.payments.reduce((pAcc, p) => pAcc + Number(p.amountPaid || 0), 0),
      0
    );
    const totalDueAmount = totalInvoiceAmount - totalPaidAmount;

    // 2. Attendance Summary across Wards
    const recentAttendances = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
      },
      orderBy: { date: "desc" },
      take: 30,
    });

    // 3. Notification & SMS Logs to Guardian Phone
    const notificationLogs = await prisma.notificationLog.findMany({
      where: {
        recipientPhone: guardian.phone,
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    return {
      guardian: {
        id: guardian.id,
        name: guardian.name,
        phone: guardian.phone,
        relation: guardian.relation,
        address: guardian.address,
        createdAt: guardian.createdAt,
      },
      wards: guardian.students.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        nameBn: s.nameBn,
        nameEn: s.nameEn,
        roll: s.roll,
        className: s.class?.name || "N/A",
        sessionYear: s.session?.year || "N/A",
        isActive: s.isActive,
      })),
      financialSummary: {
        totalInvoiceAmount,
        totalPaidAmount,
        totalDueAmount,
        invoiceCount: wardInvoices.length,
      },
      recentAttendances,
      notificationLogs,
    };
  }
}
