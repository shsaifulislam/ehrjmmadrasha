import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logAudit } from '../../utils/auditLogger';

export class CertificateService {
  // 1. Issue Official Certificate with QR Verification Code
  static async issueCertificate(data: {
    studentId: string;
    type: 'TESTIMONIAL' | 'CHARACTER' | 'ADMISSION' | 'TRANSFER_CERTIFICATE' | 'TRANSCRIPT';
    issuedById: string;
    note?: string;
  }) {
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { class: true, session: true, guardian: true },
    });
    if (!student) throw new AppError('শিক্ষার্থীর ডাটা পাওয়া যায়নি', 404);

    const certCode = Math.floor(100000 + Math.random() * 900000);
    const certificateNumber = `CERT-${new Date().getFullYear()}-${certCode}`;
    const verifiedUrl = `https://ehrjmadrasha.edu.bd/verify/certificate/${certificateNumber}`;
    const qrCodeData = JSON.stringify({
      certNo: certificateNumber,
      studentName: student.nameBn,
      studentId: student.studentId,
      madrasha: 'ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা (ehrjmadrasha.edu.bd)',
      verifiedUrl,
    });

    const cert = await prisma.certificate.create({
      data: {
        certificateNumber,
        studentId: data.studentId,
        type: data.type,
        qrCodeData,
        verifiedUrl,
        issuedById: data.issuedById,
        note: data.note,
      },
      include: {
        student: { include: { class: true, session: true, guardian: true } },
        issuedBy: { select: { username: true } },
      },
    });

    await logAudit(data.issuedById, 'ISSUE_CERTIFICATE', 'certificate', `সার্টিফিকেট ইস্যু: ${certificateNumber} (${data.type})`);
    return cert;
  }

  // 2. Public Certificate Verification Engine by Certificate Number
  static async verifyCertificate(certificateNumber: string) {
    const cert = await prisma.certificate.findUnique({
      where: { certificateNumber },
      include: {
        student: {
          include: {
            class: true,
            session: true,
            guardian: true,
          },
        },
        issuedBy: { select: { username: true } },
      },
    });

    if (!cert) {
      return {
        isValid: false,
        message: 'সার্টিফিকেট সনাক্ত করা সম্ভব হয়নি। ভুয়া বা অবৈধ ট্র্যাকিং নম্বর।',
      };
    }

    return {
      isValid: true,
      madrasha: 'ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা',
      domain: 'ehrjmadrasha.edu.bd',
      certificateNumber: cert.certificateNumber,
      type: cert.type,
      issueDate: cert.issueDate,
      studentName: cert.student.nameBn,
      studentId: cert.student.studentId,
      className: cert.student.class.name,
      sessionYear: cert.student.session.year,
      fatherName: cert.student.guardian?.name || 'N/A',
      verifiedUrl: cert.verifiedUrl,
      status: 'VERIFIED & AUTHENTIC ✅',
    };
  }

  static async getStudentCertificates(studentId: string) {
    return await prisma.certificate.findMany({
      where: { studentId },
      include: { issuedBy: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

