import prisma from "../../config/prisma";

export class Student360Service {
  /**
   * Central Aggregator: Fetches 360-degree aggregated profile data for a given student ID.
   */
  static async getStudentFullProfile(studentId: string) {
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: studentId }, { studentId: studentId }],
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            isActive: true,
          },
        },
        class: true,
        department: true,
        session: true,
        guardian: true,
        attendances: {
          take: 30,
          orderBy: { date: "desc" },
        },
        invoices: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            payments: true,
          },
        },
        results: {
          include: {
            exam: true,
            subject: true,
          },
        },
        hostelAllocations: {
          include: {
            bed: {
              include: {
                room: true,
              },
            },
          },
        },
        borrowedBooks: {
          take: 10,
          orderBy: { issueDate: "desc" },
          include: {
            book: true,
          },
        },
        certificates: {
          orderBy: { issueDate: "desc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        transportAssignments: {
          include: {
            route: true,
          },
        },
        issuedAssets: {
          orderBy: { issueDate: "desc" },
        },
      },
    });

    if (!student) {
      throw new Error(`Student not found for ID: ${studentId}`);
    }

    // Aggregate summary statistics
    const totalInvoices = student.invoices.length;
    const paidInvoices = student.invoices.filter((inv) => inv.status === "PAID").length;
    const pendingInvoices = student.invoices.filter((inv) => inv.status === "UNPAID" || inv.status === "PARTIAL").length;
    const attendanceCount = student.attendances.length;
    const presentCount = student.attendances.filter((att) => att.status === "PRESENT").length;

    const attendanceRate = attendanceCount > 0 ? (presentCount / attendanceCount) * 100 : 100;

    return {
      student,
      metrics: {
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        borrowedBooksCount: student.borrowedBooks.filter((b) => !b.returnDate).length,
      },
    };
  }
}

export default Student360Service;
