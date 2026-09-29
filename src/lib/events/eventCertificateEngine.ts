/**
 * EHRJ Event Certificate Integration Engine
 * Checkpoint: EHRJ-AI-2026-PHASE35
 * Integrates with Phase 7/29 Document & Certificate Engine.
 * Invariant: Do NOT create a separate certificate generation engine. Use authoritative Prisma Certificate & DocumentFactory.
 */

import { EventCertificateLink, CertificateCategory } from "./types";
import {
  getCertificateLinks,
  saveCertificateLinks,
  getEventById,
  appendEventAudit,
} from "./eventStore";
import { prisma } from "../prisma";
import { generateNextVerificationCode, generateDocumentQrCode } from "../documentFactory";
import { INSTITUTION_INFO } from "../constants";

export interface IssueEventCertificateParams {
  eventId: string;
  studentId: string;
  category: CertificateCategory;
  awardTextBn?: string;
  issuedByUserId: string;
  actorRole: string;
}

/**
 * Generates an official event certificate referencing the participant, event, and authoritative Prisma Certificate model.
 */
export async function issueEventCertificate(
  params: IssueEventCertificateParams
): Promise<{ success: boolean; certificateLink?: EventCertificateLink; error?: string }> {
  const { eventId, studentId, category, awardTextBn, issuedByUserId, actorRole } = params;

  // Authorization check: Only Admin or Principal can issue official certificates
  if (!["ADMIN", "PRINCIPAL"].includes(actorRole)) {
    return {
      success: false,
      error: "অননুমোদিত: শুধুমাত্র প্রশাসন বা মুহতামিম সনদপত্র ইস্যু করতে পারবেন।",
    };
  }

  // 1. Resolve Event
  const event = getEventById(eventId);
  if (!event) {
    return { success: false, error: "ইভেন্টটি পাওয়া যায়নি।" };
  }

  // 2. Resolve Student
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        include: { jamatClass: true, section: true, session: true },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });

  if (!student) {
    return { success: false, error: "শিক্ষার্থী তথ্য পাওয়া যায়নি।" };
  }

  // Check if certificate of this category already issued for this student & event
  const links = getCertificateLinks();
  const existing = links.find(
    (l) => l.eventId === eventId && l.studentId === studentId && l.category === category && !l.isRevoked
  );
  if (existing) {
    return {
      success: false,
      error: "এই শিক্ষার্থীর জন্য সংশ্লিষ্ট ক্যাটাগরির সনদপত্র ইতিমধ্যে ইস্যু করা হয়েছে।",
      certificateLink: existing,
    };
  }

  // 3. Generate Verification Code and QR Code via Document Engine
  const verificationCode = await generateNextVerificationCode();
  const qrCodeUrl = await generateDocumentQrCode(verificationCode);

  const currentYear = new Date().getFullYear();
  const certSeq = links.length + 1;
  const certificateNumber = `EHRJ-EVT-CERT-${currentYear}-${String(certSeq).padStart(5, "0")}`;

  const categoryTitlesBn: Record<CertificateCategory, string> = {
    PARTICIPATION: "অংশগ্রহণমূলক প্রশংসাপত্র",
    WINNER: "বিজয়ী সম্মাননা সনদপত্র",
    APPRECIATION: "বিশেষ কৃতিত্ব ও কৃতজ্ঞতা সনদ",
    VOLUNTEER: "স্বেচ্ছাসেবী স্বীকৃতি সনদপত্র",
    ACHIEVEMENT: "বিশেষ অর্জন সনদপত্র",
  };

  const titleBn = `${event.titleBn} — ${categoryTitlesBn[category] || "সনদপত্র"}`;
  const now = new Date();

  // 4. Build frozen snapshot
  const activeEnrollment = student.enrollments[0];
  const snapshotData = {
    event: {
      id: event.id,
      titleBn: event.titleBn,
      titleEn: event.titleEn,
      venue: event.venueText,
      startAt: event.startAt,
      endAt: event.endAt,
      organizer: event.organizer,
    },
    student: {
      id: student.id,
      studentIdNumber: student.studentIdNumber,
      fullNameBn: student.fullNameBn,
      fullNameEn: student.fullNameEn,
      fatherNameBn: student.fatherNameBn,
      classNameBn: activeEnrollment?.jamatClass?.nameBn || "সাধারণ",
      rollNumber: activeEnrollment?.rollNumber,
    },
    certificate: {
      certificateNumber,
      verificationCode,
      category,
      awardTextBn: awardTextBn || categoryTitlesBn[category],
      issueDateBn: now.toLocaleDateString("bn-BD"),
      issuedBy: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা প্রশাসন",
    },
    institution: {
      nameBn: INSTITUTION_INFO.nameBn,
      nameEn: INSTITUTION_INFO.nameEn,
      principal: INSTITUTION_INFO.principal,
    },
  };

  // 5. Resolve valid User ID for foreign key constraint if available
  let resolvedUserId: string | null = null;
  if (issuedByUserId) {
    const userMatch = await prisma.user.findFirst({
      where: {
        OR: [{ id: issuedByUserId }, { email: issuedByUserId }],
      },
      select: { id: true },
    });
    resolvedUserId = userMatch?.id || null;
  }

  // 6. Create authoritative record in Prisma Certificate table
  const certRecord = await prisma.certificate.create({
    data: {
      certificateNumber,
      verificationCode,
      studentId: student.id,
      sessionId: activeEnrollment?.sessionId || null,
      certificateType: `EVENT_${category}`,
      titleBn,
      titleEn: `${event.titleEn || event.titleBn} Certificate`,
      version: 1,
      status: "ISSUED",
      issueDate: now,
      issuedByUserId: resolvedUserId,
      isRevoked: false,
      qrCodeUrl,
      snapshotJson: JSON.stringify(snapshotData),
    },
  });

  // 6. Record link in event certificate registry
  const linkId = `LNK-CERT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const newLink: EventCertificateLink = {
    id: linkId,
    eventId: event.id,
    studentId: student.id,
    studentNameBn: student.fullNameBn,
    certificateId: certRecord.id,
    certificateNumber,
    verificationCode,
    category,
    titleBn,
    issueDate: now.toISOString(),
    qrCodeUrl,
    isRevoked: false,
    createdAt: now.toISOString(),
  };

  links.push(newLink);
  saveCertificateLinks(links);

  appendEventAudit({
    eventId: event.id,
    action: "ISSUE_CERTIFICATE",
    actorId: issuedByUserId,
    actorRole,
    details: `সনদপত্র ইস্যু সম্পন্ন: ${student.fullNameBn} (${certificateNumber}) - ধরন: ${category}`,
  });

  return { success: true, certificateLink: newLink };
}

/**
 * Revokes an issued event certificate
 */
export async function revokeEventCertificate(params: {
  certificateId: string;
  revokedByUserId: string;
  actorRole: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  const { certificateId, revokedByUserId, actorRole, reason } = params;

  if (!["ADMIN", "PRINCIPAL"].includes(actorRole)) {
    return { success: false, error: "অননুমোদিত: শুধুমাত্র প্রশাসন বা মুহতামিম সনদপত্র বাতিল করতে পারবেন।" };
  }

  const links = getCertificateLinks();
  const linkIndex = links.findIndex(
    (l) => l.certificateId === certificateId || l.id === certificateId || l.certificateNumber === certificateId
  );

  if (linkIndex >= 0) {
    links[linkIndex].isRevoked = true;
    links[linkIndex].revokedReason = reason;
    saveCertificateLinks(links);

    // Resolve valid User ID for foreign key constraint if available
    let resolvedUserId: string | null = null;
    if (revokedByUserId) {
      const userMatch = await prisma.user.findFirst({
        where: {
          OR: [{ id: revokedByUserId }, { email: revokedByUserId }],
        },
        select: { id: true },
      });
      resolvedUserId = userMatch?.id || null;
    }

    // Also update prisma certificate record
    await prisma.certificate.updateMany({
      where: {
        OR: [
          { id: certificateId },
          { certificateNumber: certificateId },
        ],
      },
      data: {
        isRevoked: true,
        status: "REVOKED",
        revokedAt: new Date(),
        revokedByUserId: resolvedUserId,
        revokeReason: reason,
      },
    });

    appendEventAudit({
      eventId: links[linkIndex].eventId,
      action: "REVOKE_CERTIFICATE",
      actorId: revokedByUserId,
      actorRole,
      details: `সনদপত্র বাতিল: ${links[linkIndex].certificateNumber} - কারণ: ${reason}`,
    });

    return { success: true };
  }

  return { success: false, error: "সনদপত্র রেকর্ড পাওয়া যায়নি।" };
}
