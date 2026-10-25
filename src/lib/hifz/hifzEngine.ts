import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { atomicWriteFileSync, safeReadJsonSync } from "@/lib/storageUtils";
import { QURAN_PARAS, HIFZ_QUALITY_OPTIONS } from "./hifzConstants";

const HIFZ_DATA_DIR = path.join(process.cwd(), "data", "hifz");
const DAILY_LOGS_FILE = path.join(HIFZ_DATA_DIR, "daily_logs.json");
const STUDENT_SUMMARIES_FILE = path.join(HIFZ_DATA_DIR, "student_summaries.json");

export interface HifzDailyLogEntry {
  id: string;
  studentId: string;
  studentNameBn: string;
  studentIdNumber: string;
  rollNumber: number;
  date: string; // YYYY-MM-DD
  attendance: "PRESENT" | "ABSENT" | "EXCUSED";
  sabaq: {
    para: number;
    surahName: string;
    ayahRange: string;
    pages: string;
    quality: "MUMTAZ" | "JAYYID_JIDDAN" | "JAYYID" | "MAQBOOL" | "DOHRANO";
  } | null;
  sabqi: {
    para: number;
    pages: string;
    quality: "MUMTAZ" | "JAYYID_JIDDAN" | "JAYYID" | "MAQBOOL" | "DOHRANO";
  } | null;
  manzil: {
    paraRange: string;
    portion: string;
    quality: "MUMTAZ" | "JAYYID_JIDDAN" | "JAYYID" | "MAQBOOL" | "DOHRANO";
  } | null;
  totalParasCompleted: number; // 0 - 30
  currentSabaqPara: number; // 1 - 30
  remarks?: string | null;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HifzStudentSummary {
  studentId: string;
  studentNameBn: string;
  studentIdNumber: string;
  rollNumber: number;
  totalParasCompleted: number; // 0 - 30
  currentSabaqPara: number; // 1 - 30
  currentSurahName: string;
  completedParasList: number[]; // e.g. [1, 2, 3, 4]
  isHafez: boolean;
  status: "ACTIVE" | "COMPLETED" | "ON_LEAVE";
  enrolledAt: string;
  lastDailyEntryDate?: string | null;
  lastQualityGrade?: string | null;
  guardianPhone?: string | null;
  guardianNameBn?: string | null;
}

/**
 * Ensures initial Hifz student summaries and realistic recent daily logs exist.
 */
export async function ensureHifzStoreInitialized(): Promise<void> {
  const existingSummaries = safeReadJsonSync<HifzStudentSummary[]>(STUDENT_SUMMARIES_FILE, []);
  if (existingSummaries.length > 0) {
    return;
  }

  // Find students enrolled in HIFZ class
  const hifzClass = await prisma.jamatClass.findFirst({
    where: { code: "HIFZ" },
  });

  if (!hifzClass) return;

  const enrollments = await prisma.enrollment.findMany({
    where: { classId: hifzClass.id, status: "ACTIVE" },
    include: {
      student: {
        include: {
          guardianLinks: {
            include: { guardian: true },
          },
        },
      },
    },
    orderBy: { rollNumber: "asc" },
  });

  if (enrollments.length === 0) return;

  // Varied milestones for realism
  const sampleMilestones = [
    { completed: 28, current: 29, surah: "সূরা আল-মুলক" },
    { completed: 22, current: 23, surah: "সূরা ইয়াসীন" },
    { completed: 18, current: 19, surah: "সূরা আল-ফুরকান" },
    { completed: 15, current: 16, surah: "সূরা আল-কাহফ" },
    { completed: 11, current: 12, surah: "সূরা ইউসুফ" },
    { completed: 8, current: 9, surah: "সূরা আল-আনফাল" },
    { completed: 5, current: 6, surah: "সূরা আল-মায়িদাহ" },
    { completed: 3, current: 4, surah: "সূরা আলে ইমরান" },
    { completed: 1, current: 2, surah: "সূরা আল-বাক্বারাহ" },
    { completed: 0, current: 1, surah: "সূরা আল-বাক্বারাহ" },
    { completed: 30, current: 30, surah: "খতমে কুরআন (দাওরাতুল হিফজ)" },
    { completed: 14, current: 15, surah: "সূরা বনি ইসরাঈল" },
    { completed: 7, current: 8, surah: "সূরা আল-আন'আম" },
  ];

  const nowStr = new Date().toISOString();
  const todayDate = nowStr.split("T")[0];

  const initialSummaries: HifzStudentSummary[] = enrollments.map((en, index) => {
    const st = en.student;
    const ms = sampleMilestones[index % sampleMilestones.length];
    const completedList = Array.from({ length: ms.completed }, (_, i) => i + 1);

    const primaryGuardian = st.guardianLinks?.[0]?.guardian;

    return {
      studentId: st.id,
      studentNameBn: st.fullNameBn,
      studentIdNumber: st.studentIdNumber,
      rollNumber: en.rollNumber,
      totalParasCompleted: ms.completed,
      currentSabaqPara: ms.current,
      currentSurahName: ms.surah,
      completedParasList: completedList,
      isHafez: ms.completed >= 30,
      status: ms.completed >= 30 ? "COMPLETED" : "ACTIVE",
      enrolledAt: st.createdAt ? st.createdAt.toISOString() : nowStr,
      lastDailyEntryDate: todayDate,
      lastQualityGrade: "MUMTAZ",
      guardianPhone: primaryGuardian?.phone || null,
      guardianNameBn: primaryGuardian?.fullNameBn || null,
    };
  });

  atomicWriteFileSync(STUDENT_SUMMARIES_FILE, JSON.stringify(initialSummaries, null, 2));

  // Seed sample logs for today and yesterday
  const sampleLogs: HifzDailyLogEntry[] = [];
  const qualities: Array<"MUMTAZ" | "JAYYID_JIDDAN" | "JAYYID" | "MAQBOOL"> = [
    "MUMTAZ",
    "JAYYID_JIDDAN",
    "JAYYID",
    "MUMTAZ",
  ];

  for (const s of initialSummaries) {
    const q = qualities[s.rollNumber % qualities.length];
    sampleLogs.push({
      id: crypto.randomUUID(),
      studentId: s.studentId,
      studentNameBn: s.studentNameBn,
      studentIdNumber: s.studentIdNumber,
      rollNumber: s.rollNumber,
      date: todayDate,
      attendance: "PRESENT",
      sabaq: {
        para: s.currentSabaqPara,
        surahName: s.currentSurahName,
        ayahRange: "আয়াত ১ - ২৫",
        pages: "পৃষ্ঠা ২",
        quality: q,
      },
      sabqi: {
        para: s.currentSabaqPara,
        pages: "পৃষ্ঠা ১-৫",
        quality: q === "MUMTAZ" ? "MUMTAZ" : "JAYYID_JIDDAN",
      },
      manzil: {
        paraRange: s.completedParasList.length > 0 ? `পারা ${s.completedParasList[0]}` : "পারা ১",
        portion: "১ম রুবু' / কোয়ার্টার পারা",
        quality: "MUMTAZ",
      },
      totalParasCompleted: s.totalParasCompleted,
      currentSabaqPara: s.currentSabaqPara,
      remarks: "মাশাআল্লাহ, তিলাওয়াত সাবলীল ও তাজবীদসম্মত ছিল।",
      recordedBy: "মুফতি মাহমুদুল হাসান (হিফজ প্রধান)",
      createdAt: nowStr,
      updatedAt: nowStr,
    });
  }

  atomicWriteFileSync(DAILY_LOGS_FILE, JSON.stringify(sampleLogs, null, 2));
}

/**
 * Returns all Hifz student summaries along with their latest progress.
 */
export async function getHifzStudentSummaries(): Promise<HifzStudentSummary[]> {
  await ensureHifzStoreInitialized();
  return safeReadJsonSync<HifzStudentSummary[]>(STUDENT_SUMMARIES_FILE, []);
}

/**
 * Returns daily logs for a given date or all logs.
 */
export async function getHifzDailyLogs(filterDate?: string): Promise<HifzDailyLogEntry[]> {
  await ensureHifzStoreInitialized();
  const logs = safeReadJsonSync<HifzDailyLogEntry[]>(DAILY_LOGS_FILE, []);
  if (filterDate) {
    return logs.filter((l) => l.date === filterDate);
  }
  return logs.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Returns comprehensive student profile and history for Hifz.
 */
export async function getStudentHifzDetail(studentId: string): Promise<{
  summary: HifzStudentSummary | null;
  history: HifzDailyLogEntry[];
  stats: {
    totalParas: number;
    completionPercentage: number;
    totalDaysPresent: number;
    mumtazCount: number;
    jayyidCount: number;
    needsRevisionCount: number;
  };
}> {
  await ensureHifzStoreInitialized();
  const summaries = safeReadJsonSync<HifzStudentSummary[]>(STUDENT_SUMMARIES_FILE, []);
  const summary = summaries.find((s) => s.studentId === studentId) || null;

  const logs = safeReadJsonSync<HifzDailyLogEntry[]>(DAILY_LOGS_FILE, []);
  const studentLogs = logs
    .filter((l) => l.studentId === studentId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalParas = summary?.totalParasCompleted || 0;
  const completionPercentage = Number(((totalParas / 30) * 100).toFixed(1));

  let mumtazCount = 0;
  let jayyidCount = 0;
  let needsRevisionCount = 0;
  let totalDaysPresent = 0;

  studentLogs.forEach((l) => {
    if (l.attendance === "PRESENT") totalDaysPresent++;
    if (l.sabaq?.quality === "MUMTAZ") mumtazCount++;
    else if (l.sabaq?.quality === "JAYYID_JIDDAN" || l.sabaq?.quality === "JAYYID") jayyidCount++;
    else if (l.sabaq?.quality === "MAQBOOL" || l.sabaq?.quality === "DOHRANO") needsRevisionCount++;
  });

  return {
    summary,
    history: studentLogs,
    stats: {
      totalParas,
      completionPercentage,
      totalDaysPresent,
      mumtazCount,
      jayyidCount,
      needsRevisionCount,
    },
  };
}

/**
 * Records a new or updated daily Sabaq entry for a student.
 */
export async function recordHifzDailyEntry(entry: {
  studentId: string;
  date: string;
  attendance: "PRESENT" | "ABSENT" | "EXCUSED";
  sabaq?: HifzDailyLogEntry["sabaq"];
  sabqi?: HifzDailyLogEntry["sabqi"];
  manzil?: HifzDailyLogEntry["manzil"];
  totalParasCompleted?: number;
  currentSabaqPara?: number;
  remarks?: string | null;
  recordedBy: string;
}): Promise<HifzDailyLogEntry> {
  await ensureHifzStoreInitialized();

  const summaries = safeReadJsonSync<HifzStudentSummary[]>(STUDENT_SUMMARIES_FILE, []);
  const summaryIndex = summaries.findIndex((s) => s.studentId === entry.studentId);

  if (summaryIndex === -1) {
    throw new Error("হিফজ শিক্ষার্থী পাওয়া যায়নি।");
  }

  const currentSummary = summaries[summaryIndex];
  const logs = safeReadJsonSync<HifzDailyLogEntry[]>(DAILY_LOGS_FILE, []);

  const totalParas =
    entry.totalParasCompleted !== undefined
      ? entry.totalParasCompleted
      : currentSummary.totalParasCompleted;

  const currentPara =
    entry.currentSabaqPara !== undefined
      ? entry.currentSabaqPara
      : currentSummary.currentSabaqPara;

  const nowStr = new Date().toISOString();

  // Check if entry for this student and date already exists
  const existingLogIndex = logs.findIndex(
    (l) => l.studentId === entry.studentId && l.date === entry.date
  );

  let savedLog: HifzDailyLogEntry;

  if (existingLogIndex >= 0) {
    // Update existing
    savedLog = {
      ...logs[existingLogIndex],
      attendance: entry.attendance,
      sabaq: entry.sabaq || null,
      sabqi: entry.sabqi || null,
      manzil: entry.manzil || null,
      totalParasCompleted: totalParas,
      currentSabaqPara: currentPara,
      remarks: entry.remarks || null,
      recordedBy: entry.recordedBy,
      updatedAt: nowStr,
    };
    logs[existingLogIndex] = savedLog;
  } else {
    // Create new
    savedLog = {
      id: crypto.randomUUID(),
      studentId: currentSummary.studentId,
      studentNameBn: currentSummary.studentNameBn,
      studentIdNumber: currentSummary.studentIdNumber,
      rollNumber: currentSummary.rollNumber,
      date: entry.date,
      attendance: entry.attendance,
      sabaq: entry.sabaq || null,
      sabqi: entry.sabqi || null,
      manzil: entry.manzil || null,
      totalParasCompleted: totalParas,
      currentSabaqPara: currentPara,
      remarks: entry.remarks || null,
      recordedBy: entry.recordedBy,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    logs.push(savedLog);
  }

  // Update summary record
  const completedList = Array.from({ length: totalParas }, (_, i) => i + 1);
  currentSummary.totalParasCompleted = totalParas;
  currentSummary.currentSabaqPara = currentPara;
  if (entry.sabaq?.surahName) {
    currentSummary.currentSurahName = entry.sabaq.surahName;
  }
  currentSummary.completedParasList = completedList;
  currentSummary.isHafez = totalParas >= 30;
  if (totalParas >= 30) {
    currentSummary.status = "COMPLETED";
  }
  currentSummary.lastDailyEntryDate = entry.date;
  if (entry.sabaq?.quality) {
    currentSummary.lastQualityGrade = entry.sabaq.quality;
  }

  summaries[summaryIndex] = currentSummary;

  atomicWriteFileSync(DAILY_LOGS_FILE, JSON.stringify(logs, null, 2));
  atomicWriteFileSync(STUDENT_SUMMARIES_FILE, JSON.stringify(summaries, null, 2));

  // Dispatch in-app notification to student's guardian
  try {
    const student = await prisma.student.findUnique({
      where: { id: entry.studentId },
      include: {
        guardianLinks: {
          include: { guardian: { include: { user: true } } },
        },
      },
    });

    if (student && student.guardianLinks.length > 0) {
      for (const link of student.guardianLinks) {
        const guardianUserId = link.guardian.userId || link.guardian.user?.id;
        if (guardianUserId) {
          const qualityBn = entry.sabaq?.quality
            ? HIFZ_QUALITY_OPTIONS[entry.sabaq.quality]?.labelBn || entry.sabaq.quality
            : "স্বাভাবিক";

          await prisma.notification.create({
            data: {
              recipientUserId: guardianUserId,
              title: "হিফজ দৈনিক ডায়েরি আপডেট",
              body: `${student.fullNameBn}-এর আজকের সবক (${entry.date}) উস্তাদ কর্তৃক গৃহীত হয়েছে। মান: ${qualityBn}। মোট হিফজ সম্পন্ন: ${totalParas}/৩০ পারা।`,
              type: "ACADEMIC",
              channel: "PORTAL",
              priority: "NORMAL",
              relatedEntityType: "HifzDailyLog",
              relatedEntityId: entry.studentId,
              actionUrl: "/portal?tab=HIFZ",
            },
          });
        }
      }
    }
  } catch (err) {
    console.warn("Could not dispatch guardian Hifz notification:", err);
  }

  return savedLog;
}

/**
 * Overall statistics of the Hifz Division for Principal and Teachers.
 */
export async function getHifzDivisionStats(): Promise<{
  totalStudents: number;
  totalHuffaz: number;
  averageProgressPercentage: number;
  activeTodayCount: number;
  distribution: {
    beginner: number; // 1-5 paras
    intermediate: number; // 6-15 paras
    advanced: number; // 16-29 paras
    completed: number; // 30 paras
  };
}> {
  await ensureHifzStoreInitialized();
  const summaries = safeReadJsonSync<HifzStudentSummary[]>(STUDENT_SUMMARIES_FILE, []);
  const todayDate = new Date().toISOString().split("T")[0];
  const logs = safeReadJsonSync<HifzDailyLogEntry[]>(DAILY_LOGS_FILE, []);

  const totalStudents = summaries.length;
  const totalHuffaz = summaries.filter((s) => s.isHafez || s.totalParasCompleted >= 30).length;

  let totalParasSum = 0;
  let beginner = 0;
  let intermediate = 0;
  let advanced = 0;
  let completed = 0;

  summaries.forEach((s) => {
    totalParasSum += s.totalParasCompleted;
    if (s.totalParasCompleted >= 30) completed++;
    else if (s.totalParasCompleted >= 16) advanced++;
    else if (s.totalParasCompleted >= 6) intermediate++;
    else beginner++;
  });

  const averageProgressPercentage =
    totalStudents > 0
      ? Number(((totalParasSum / (totalStudents * 30)) * 100).toFixed(1))
      : 0;

  const todayEntries = logs.filter((l) => l.date === todayDate);

  return {
    totalStudents,
    totalHuffaz,
    averageProgressPercentage,
    activeTodayCount: todayEntries.length,
    distribution: {
      beginner,
      intermediate,
      advanced,
      completed,
    },
  };
}
