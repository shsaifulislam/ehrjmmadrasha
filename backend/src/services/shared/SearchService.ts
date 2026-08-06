import prisma from "../../config/prisma";

export class SearchService {
  /**
   * Performs global multi-entity search across Students, Teachers, Admissions, and Invoices.
   */
  static async globalSearch(query: string) {
    if (!query || query.trim().length === 0) {
      return { students: [], teachers: [], admissions: [], invoices: [] };
    }

    const searchTerm = query.trim();

    const [students, teachers, admissions, invoices] = await Promise.all([
      prisma.student.findMany({
        where: {
          OR: [
            { nameBn: { contains: searchTerm, mode: "insensitive" } },
            { nameEn: { contains: searchTerm, mode: "insensitive" } },
            { studentId: { contains: searchTerm, mode: "insensitive" } },
            { brn: { contains: searchTerm, mode: "insensitive" } },
          ],
          isDeleted: false,
        },
        take: 10,
        select: {
          id: true,
          studentId: true,
          nameBn: true,
          nameEn: true,
          roll: true,
          class: { select: { name: true } },
        },
      }),
      prisma.teacher.findMany({
        where: {
          OR: [
            { nameBn: { contains: searchTerm, mode: "insensitive" } },
            { phone: { contains: searchTerm } },
            { teacherId: { contains: searchTerm, mode: "insensitive" } },
          ],
          isDeleted: false,
        },
        take: 10,
        select: {
          id: true,
          teacherId: true,
          nameBn: true,
          designation: true,
          phone: true,
        },
      }),
      prisma.admission.findMany({
        where: {
          OR: [
            { applicantName: { contains: searchTerm, mode: "insensitive" } },
            { applicantNameEn: { contains: searchTerm, mode: "insensitive" } },
            { phone: { contains: searchTerm } },
            { verificationToken: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        take: 10,
        select: {
          id: true,
          verificationToken: true,
          applicantName: true,
          phone: true,
          status: true,
        },
      }),
      prisma.invoice.findMany({
        where: {
          OR: [
            { id: { contains: searchTerm, mode: "insensitive" } },
            { type: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        take: 10,
        select: {
          id: true,
          type: true,
          totalAmount: true,
          status: true,
          student: { select: { nameBn: true, studentId: true } },
        },
      }),
    ]);

    return {
      students,
      teachers,
      admissions,
      invoices,
    };
  }
}

export default SearchService;
