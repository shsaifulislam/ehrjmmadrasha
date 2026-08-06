import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';

export class Student360Service {
  static async getStudent360Dossier(studentId: string) {
    // 1. Fetch Student Core Info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        session: true,
        department: true,
        guardian: true,
        user: { select: { username: true, role: { select: { name: true } } } },
      },
    });

    if (!student) throw new AppError('শিক্ষার্থীর ৩৬০° প্রোফাইল পাওয়া যায়নি', 404);


    // 2. Parallel Dossier Aggregation
    const [attendances, results, invoices, hostelAllocations, mealAttendances, borrowedBooks, certificates] =
      await Promise.all([
        prisma.attendance.findMany({ where: { studentId } }),
        prisma.result.findMany({ where: { studentId }, include: { exam: true, subject: true } }),
        prisma.invoice.findMany({ where: { studentId }, include: { payments: true, items: { include: { feeType: true } } } }),
        prisma.hostelAllocation.findMany({
          where: { studentId },
          include: { bed: { include: { room: { include: { building: true } } } } },
        }),
        prisma.mealAttendance.findMany({ where: { studentId } }),
        prisma.bookIssue.findMany({ where: { studentId }, include: { book: true } }),
        prisma.certificate.findMany({ where: { studentId } }),
      ]);

    // 3. Attendance Rate Calculation
    const totalDays = attendances.length;
    const presentDays = attendances.filter((a) => a.status === 'PRESENT').length;
    const absentDays = attendances.filter((a) => a.status === 'ABSENT').length;
    const attendancePercentage = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(1)) : 100;

    // 4. Financial Calculations (Invoices, Paid, Due)
    let totalBilled = 0;
    let totalPaid = 0;

    invoices.forEach((inv) => {
      totalBilled += Number(inv.totalAmount);
      inv.payments.forEach((p) => {
        totalPaid += Number(p.amountPaid);
      });
    });

    const totalDue = totalBilled - totalPaid;

    // 5. Active Hostel Allocation
    const activeHostel = hostelAllocations.find((h) => h.status === 'ACTIVE');

    return {
      studentInfo: {
        id: student.id,
        studentId: student.studentId,
        nameBn: student.nameBn,
        nameEn: student.nameEn,
        roll: student.roll,
        gender: 'MALE',
        bloodGroup: student.bloodGroup,
        className: student.class.name,
        sessionYear: student.session.year,
        fatherName: student.guardian?.name || 'N/A',
        motherName: 'N/A',
        guardianName: student.guardian?.name || 'N/A',
        guardianPhone: student.guardian?.phone || 'N/A',
        photoUrl: student.photoUrl,
      },
      academicSummary: {
        attendanceRate: `${attendancePercentage}%`,
        totalClasses: totalDays,
        presentDays,
        absentDays,
        totalExamsTaken: results.length,
      },
      financialLedger: {
        totalBilled: Number(totalBilled.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        totalDue: Number(totalDue.toFixed(2)),
        invoiceCount: invoices.length,
        invoices: invoices.map((inv) => ({
          id: inv.id,
          feeType: inv.type || 'ফি',
          amount: Number(inv.totalAmount),
          status: inv.status,
        })),
      },
      hostelDossier: activeHostel
        ? {
            buildingName: activeHostel.bed.room.building.name,
            roomNumber: activeHostel.bed.room.roomNumber,
            bedNumber: activeHostel.bed.bedNumber,
            monthlyFee: Number(activeHostel.monthlyFee),
            allocationDate: activeHostel.allocationDate,
          }
        : null,
      libraryDossier: {
        totalBorrowed: borrowedBooks.length,
        currentlyIssued: borrowedBooks.filter((b) => b.status === 'ISSUED').length,
        borrowedBooks: borrowedBooks.map((b) => ({
          title: b.book.title,
          issueDate: b.issueDate,
          dueDate: b.dueDate,
          status: b.status,
        })),
      },
      certificateDossier: certificates.map((c) => ({
        certificateNumber: c.certificateNumber,
        type: c.type,
        issueDate: c.issueDate,
        verifiedUrl: c.verifiedUrl,
      })),
      timeline: [
        { date: student.createdAt, event: 'মাদরাসায় অনলাইন/অফলাইন ভর্তি সম্পন্ন' },
        ...(activeHostel ? [{ date: activeHostel.allocationDate, event: `আবাসিক হোস্টেল সিট বরাদ্দ: ${activeHostel.bed.room.roomNumber}` }] : []),
        ...certificates.map((c) => ({ date: c.issueDate, event: `সার্টিফিকেট প্রদান: ${c.type} (${c.certificateNumber})` })),
      ],
    };
  }
}
