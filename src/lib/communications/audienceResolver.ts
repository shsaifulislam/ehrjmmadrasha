/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 32
 * Dynamic Audience Resolution & Snapshot Engine
 * Queries authoritative ERP databases without duplicating recipient models.
 * Checkpoint: EHRJ-AI-2026-PHASE32
 */

import { prisma } from "@/lib/prisma";
import {
  AudienceType,
  AudienceFilter,
  ResolvedRecipientItem,
  AudienceSnapshot,
} from "./types";
import { saveAudienceSnapshot } from "./communicationStore";

/**
 * Dynamically resolves real-time recipients from authoritative database models
 */
export async function resolveAudienceRecipients(
  audienceType: AudienceType,
  filter: AudienceFilter = {}
): Promise<ResolvedRecipientItem[]> {
  const recipients: ResolvedRecipientItem[] = [];

  switch (audienceType) {
    case "ALL_GUARDIANS": {
      const guardians = await prisma.guardian.findMany({
        include: {
          user: true,
          students: {
            include: {
              student: {
                include: {
                  enrollments: {
                    where: { status: "ACTIVE" },
                    include: { jamatClass: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      for (const g of guardians) {
        if (!g.user || g.user.status !== "ACTIVE") continue;

        const firstStudent = g.students[0]?.student;
        const activeEnrollment = firstStudent?.enrollments[0];

        recipients.push({
          recipientId: g.id,
          userId: g.user.id,
          name: g.user.name,
          email: g.user.email || undefined,
          phone: g.user.phone || undefined,
          role: "GUARDIAN",
          recipientType: "GUARDIAN",
          studentId: firstStudent?.id,
          studentNameBn: firstStudent?.fullNameBn,
          studentRoll: activeEnrollment?.rollNumber || undefined,
          classTitle: activeEnrollment?.jamatClass?.nameBn,
          reasonForInclusion: "সক্রিয় অভিভাবক ডোমেন",
        });
      }
      break;
    }

    case "ALL_TEACHERS": {
      const teachers = await prisma.user.findMany({
        where: { role: "TEACHER", status: "ACTIVE" },
      });

      for (const t of teachers) {
        recipients.push({
          recipientId: t.id,
          userId: t.id,
          name: t.name,
          email: t.email || undefined,
          phone: t.phone || undefined,
          role: "TEACHER",
          recipientType: "TEACHER",
          reasonForInclusion: "সক্রিয় শিক্ষক পরিষদ",
        });
      }
      break;
    }

    case "ALL_PRINCIPAL_OVERSIGHT": {
      const oversightUsers = await prisma.user.findMany({
        where: {
          role: { in: ["ADMIN", "PRINCIPAL", "MODERATOR"] },
          status: "ACTIVE",
        },
      });

      for (const u of oversightUsers) {
        recipients.push({
          recipientId: u.id,
          userId: u.id,
          name: u.name,
          email: u.email || undefined,
          phone: u.phone || undefined,
          role: u.role,
          recipientType: "ADMIN",
          reasonForInclusion: "প্রাতিষ্ঠানিক প্রশাসনিক ও মুহতামিম তদারকি",
        });
      }
      break;
    }

    case "CLASS":
    case "JAMAT": {
      let targetClassId = filter.classId;
      if (!targetClassId && filter.jamatCode) {
        const foundClass = await prisma.jamatClass.findFirst({
          where: { code: filter.jamatCode },
        });
        targetClassId = foundClass?.id;
      }

      if (!targetClassId) {
        return [];
      }

      const enrollments = await prisma.enrollment.findMany({
        where: {
          classId: targetClassId,
          status: "ACTIVE",
        },
        include: {
          jamatClass: true,
          student: {
            include: {
              guardianLinks: {
                include: {
                  guardian: {
                    include: { user: true },
                  },
                },
              },
            },
          },
        },
      });

      for (const enr of enrollments) {
        for (const link of enr.student.guardianLinks) {
          const user = link.guardian?.user;
          if (user && user.status === "ACTIVE") {
            recipients.push({
              recipientId: link.guardianId,
              userId: user.id,
              name: user.name,
              email: user.email || undefined,
              phone: user.phone || undefined,
              role: "GUARDIAN",
              recipientType: "GUARDIAN",
              studentId: enr.student.id,
              studentNameBn: enr.student.fullNameBn,
              studentRoll: enr.rollNumber || undefined,
              classTitle: enr.jamatClass?.nameBn,
              reasonForInclusion: `জামাত ${enr.jamatClass?.nameBn} এর শিক্ষার্থী অভিভাবক`,
            });
          }
        }
      }
      break;
    }

    case "SECTION": {
      if (!filter.sectionId) return [];

      const enrollments = await prisma.enrollment.findMany({
        where: {
          sectionId: filter.sectionId,
          status: "ACTIVE",
        },
        include: {
          section: true,
          jamatClass: true,
          student: {
            include: {
              guardianLinks: {
                include: {
                  guardian: {
                    include: { user: true },
                  },
                },
              },
            },
          },
        },
      });

      for (const enr of enrollments) {
        for (const link of enr.student.guardianLinks) {
          const user = link.guardian?.user;
          if (user && user.status === "ACTIVE") {
            recipients.push({
              recipientId: link.guardianId,
              userId: user.id,
              name: user.name,
              email: user.email || undefined,
              phone: user.phone || undefined,
              role: "GUARDIAN",
              recipientType: "GUARDIAN",
              studentId: enr.student.id,
              studentNameBn: enr.student.fullNameBn,
              studentRoll: enr.rollNumber || undefined,
              classTitle: `${enr.jamatClass?.nameBn} (${enr.section?.nameBn || enr.section?.nameEn})`,
              reasonForInclusion: `শাখা ${enr.section?.nameBn || enr.section?.nameEn}-এর শিক্ষার্থী অভিভাবক`,
            });
          }
        }
      }
      break;
    }

    case "RESIDENTIAL_GROUP": {
      const resStatus = filter.residentialStatus || "RESIDENTIAL";
      const students = await prisma.student.findMany({
        where: {
          status: "ACTIVE",
          residentialStatus: resStatus,
        },
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: { jamatClass: true },
            take: 1,
          },
          guardianLinks: {
            include: {
              guardian: {
                include: { user: true },
              },
            },
          },
        },
      });

      for (const s of students) {
        const enr = s.enrollments[0];
        for (const link of s.guardianLinks) {
          const user = link.guardian?.user;
          if (user && user.status === "ACTIVE") {
            recipients.push({
              recipientId: link.guardianId,
              userId: user.id,
              name: user.name,
              email: user.email || undefined,
              phone: user.phone || undefined,
              role: "GUARDIAN",
              recipientType: "GUARDIAN",
              studentId: s.id,
              studentNameBn: s.fullNameBn,
              studentRoll: enr?.rollNumber || undefined,
              classTitle: enr?.jamatClass?.nameBn,
              reasonForInclusion: `${resStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"} ছাত্রাবাস উইং`,
            });
          }
        }
      }
      break;
    }

    case "FINANCE_TARGET_GROUP": {
      const minDue = filter.financeMinDue || 1;
      const unpaidInvoices = await prisma.feeInvoice.findMany({
        where: {
          status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] },
          dueAmount: { gte: minDue },
        },
        include: {
          student: {
            include: {
              enrollments: {
                where: { status: "ACTIVE" },
                include: { jamatClass: true },
                take: 1,
              },
              guardianLinks: {
                include: {
                  guardian: {
                    include: { user: true },
                  },
                },
              },
            },
          },
        },
      });

      for (const inv of unpaidInvoices) {
        const s = inv.student;
        const enr = s.enrollments[0];
        for (const link of s.guardianLinks) {
          const user = link.guardian?.user;
          if (user && user.status === "ACTIVE") {
            recipients.push({
              recipientId: link.guardianId,
              userId: user.id,
              name: user.name,
              email: user.email || undefined,
              phone: user.phone || undefined,
              role: "GUARDIAN",
              recipientType: "GUARDIAN",
              studentId: s.id,
              studentNameBn: s.fullNameBn,
              studentRoll: enr?.rollNumber || undefined,
              classTitle: enr?.jamatClass?.nameBn,
              reasonForInclusion: `বকেয়া ফি সংক্রান্ত তাগিদ (ইনভয়েস: ${inv.invoiceNumber}, বকেয়া: ৳${inv.dueAmount})`,
              extraContext: {
                invoiceNumber: inv.invoiceNumber,
                dueAmount: inv.dueAmount,
                dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("bn-BD") : undefined,
              },
            });
          }
        }
      }
      break;
    }

    case "LIBRARY_TARGET_GROUP": {
      const issues = await prisma.libraryIssue.findMany({
        where: {
          status: { in: ["ISSUED", "OVERDUE"] },
          ...(filter.libraryOverdueOnly ? { status: "OVERDUE" } : {}),
        },
        include: {
          book: true,
          copy: true,
          member: {
            include: {
              student: {
                include: {
                  guardianLinks: {
                    include: {
                      guardian: { include: { user: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const issue of issues) {
        if (issue.member?.student) {
          for (const link of issue.member.student.guardianLinks) {
            const user = link.guardian?.user;
            if (user && user.status === "ACTIVE") {
              recipients.push({
                recipientId: link.guardianId,
                userId: user.id,
                name: user.name,
                email: user.email || undefined,
                phone: user.phone || undefined,
                role: "GUARDIAN",
                recipientType: "GUARDIAN",
                studentId: issue.member.student.id,
                studentNameBn: issue.member.student.fullNameBn,
                reasonForInclusion: `লাইব্রেরি বই তাগিদ: ${issue.book.titleBn}`,
                extraContext: {
                  bookTitle: issue.book.titleBn,
                  accessionNo: issue.copy.accessionNo,
                  dueDate: issue.dueDate ? new Date(issue.dueDate).toLocaleDateString("bn-BD") : undefined,
                },
              });
            }
          }
        }
      }
      break;
    }

    case "ADMISSION_APPLICANTS": {
      const appStatus = filter.applicantStatus || "SUBMITTED";
      const applicants = await prisma.application.findMany({
        where: { status: appStatus },
      });

      for (const app of applicants) {
        recipients.push({
          recipientId: app.id,
          userId: app.id, // For applicants who don't have user account yet, use application ID
          name: app.guardianName || app.studentNameBn,
          email: app.guardianEmail || undefined,
          phone: app.guardianPhone,
          role: "APPLICANT",
          recipientType: "GUARDIAN",
          studentNameBn: app.studentNameBn,
          reasonForInclusion: `ভর্তি আবেদনকারী (${app.applicationNumber})`,
          extraContext: {
            trackingNumber: app.applicationNumber,
            applicantStatus: app.status,
          },
        });
      }
      break;
    }

    case "EMPLOYEE_GROUP": {
      const employees = await prisma.employee.findMany({
        where: { status: "ACTIVE" },
        include: { user: true, designation: true },
      });

      for (const emp of employees) {
        if (emp.user && emp.user.status === "ACTIVE") {
          recipients.push({
            recipientId: emp.id,
            userId: emp.user.id,
            name: emp.user.name,
            email: emp.user.email || undefined,
            phone: emp.user.phone || undefined,
            role: emp.user.role,
            recipientType: "STAFF",
            reasonForInclusion: `কর্মকর্তা ও শিক্ষক পরিষদ (${emp.designation?.nameBn || "কর্মকর্তা"})`,
          });
        }
      }
      break;
    }

    case "CUSTOM_FILTER": {
      if (filter.customUserIds && filter.customUserIds.length > 0) {
        const users = await prisma.user.findMany({
          where: {
            id: { in: filter.customUserIds },
            status: "ACTIVE",
          },
        });

        for (const u of users) {
          recipients.push({
            recipientId: u.id,
            userId: u.id,
            name: u.name,
            email: u.email || undefined,
            phone: u.phone || undefined,
            role: u.role,
            recipientType: u.role === "GUARDIAN" ? "GUARDIAN" : u.role === "TEACHER" ? "TEACHER" : "ADMIN",
            reasonForInclusion: "প্রশাসনিক কাস্টম নির্বাচিত গ্রাহক",
          });
        }
      }
      break;
    }

    case "ALL_PUBLIC_USERS": {
      // Represents broadcast to public portal/website subscribers
      const generalUsers = await prisma.user.findMany({
        where: { status: "ACTIVE" },
        take: 100,
      });

      for (const u of generalUsers) {
        recipients.push({
          recipientId: u.id,
          userId: u.id,
          name: u.name,
          email: u.email || undefined,
          phone: u.phone || undefined,
          role: u.role,
          recipientType: "PUBLIC",
          reasonForInclusion: "পাবলিক নোটিশ ও সাধারণ ডিজিটাল শিক্ষার্থী",
        });
      }
      break;
    }

    default:
      break;
  }

  // Deduplicate by recipientId and userId to prevent duplicate sends
  const seen = new Set<string>();
  const deduped: ResolvedRecipientItem[] = [];

  for (const item of recipients) {
    const key = `${item.userId}:${item.studentId || "none"}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return deduped;
}

/**
 * Creates an immutable Audience Snapshot for a campaign
 */
export async function createAudienceSnapshot(
  campaignId: string,
  audienceType: AudienceType,
  filter: AudienceFilter = {}
): Promise<AudienceSnapshot> {
  const recipients = await resolveAudienceRecipients(audienceType, filter);

  const snapshot: AudienceSnapshot = {
    snapshotId: `SNP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    campaignId,
    audienceType,
    audienceFilter: filter,
    resolvedAt: new Date().toISOString(),
    totalCount: recipients.length,
    recipients,
  };

  saveAudienceSnapshot(snapshot);
  return snapshot;
}
