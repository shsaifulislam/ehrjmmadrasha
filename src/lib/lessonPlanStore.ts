import fs from "fs";
import path from "path";

export interface LessonPlanItem {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  classNameBn: string;
  sectionId?: string | null;
  sectionNameBn?: string;
  subjectNameBn: string;
  lessonDate: string; // YYYY-MM-DD
  topicTitleBn: string; // e.g. "সূরা আল-বাক্বারা ১-১০ আয়াত / হেদায়া ১ম খণ্ড কিতাবুত তাহারাত"
  homeworkBn: string; // e.g. "আয়াত ১-১০ অর্থ ও শানে নুযূল মুখস্থকরণ"
  status: "COMPLETED" | "IN_PROGRESS" | "SCHEDULED";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const DB_DIR = path.join(process.cwd(), "prisma", "custom_stores");
const DB_FILE = path.join(DB_DIR, "lesson_plans.json");

function ensureStore(): LessonPlanItem[] {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      // Seed with initial realistic madrasha lesson plans
      const initialPlans: LessonPlanItem[] = [
        {
          id: "LP-2026-001",
          teacherId: "67aba9ec-aedc-4d8e-ae3c-2db5adb18f6c",
          teacherName: "মাওলানা আহমাদ উল্লাহ",
          classId: "cls-hifz",
          classNameBn: "হিফজুল কুরআন বিভাগ",
          sectionNameBn: "ক শাখা",
          subjectNameBn: "কুরআন মাজীদ ও তাজবীদ",
          lessonDate: "2026-10-10",
          topicTitleBn: "সূরা আল-মুলক (১-১৫ আয়াত) সহীহ মাখরাজ ও সিফাত সহ তিলাওয়াত",
          homeworkBn: "সূরা আল-মুলক ১-১৫ আয়াত মুখস্থ শুনানো এবং মাখরাজ অনুশীলন",
          status: "COMPLETED",
          notes: "সকল শিক্ষার্থী সবক সুন্দরভাবে আদায় করেছে।",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "LP-2026-002",
          teacherId: "67aba9ec-aedc-4d8e-ae3c-2db5adb18f6c",
          teacherName: "মাওলানা আহমাদ উল্লাহ",
          classId: "cls-dawra",
          classNameBn: "দাওরায়ে হাদীস জামাত",
          sectionNameBn: "সাধারণ শাখা",
          subjectNameBn: "সহীহুল বুখারী (১ম খণ্ড)",
          lessonDate: "2026-10-10",
          topicTitleBn: "কিতাবুল ঈমান — 'বনুয়াল ইসলামু আলা খামসিন' হাদীসের তাশরীহ",
          homeworkBn: "উক্ত হাদীসের সনদের রাবীগণের পরিচয় ও শরহে নুযূল তামরীন খাতায় নোট করা",
          status: "COMPLETED",
          notes: "দাওরায়ে হাদীসের ছাত্রদের সক্রিয় অংশগ্রহণ ও ইশকাল নিরসন।",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      fs.writeFileSync(DB_FILE, JSON.stringify(initialPlans, null, 2), "utf8");
      return initialPlans;
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading lesson plan store:", err);
    return [];
  }
}

function saveStore(items: LessonPlanItem[]) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(items, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving lesson plan store:", err);
  }
}

export function getLessonPlans(teacherId?: string): LessonPlanItem[] {
  const items = ensureStore();
  if (teacherId) {
    return items.filter((item) => item.teacherId === teacherId);
  }
  return items;
}

export function saveLessonPlan(item: Omit<LessonPlanItem, "id" | "createdAt" | "updatedAt"> & { id?: string }): LessonPlanItem {
  const items = ensureStore();
  const now = new Date().toISOString();

  if (item.id) {
    const existingIndex = items.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      const updated: LessonPlanItem = {
        ...items[existingIndex],
        ...item,
        id: item.id,
        updatedAt: now,
      };
      items[existingIndex] = updated;
      saveStore(items);
      return updated;
    }
  }

  const newItem: LessonPlanItem = {
    ...item,
    id: `LP-${Date.now().toString().slice(-6)}`,
    createdAt: now,
    updatedAt: now,
  };
  items.unshift(newItem);
  saveStore(items);
  return newItem;
}

export function deleteLessonPlan(id: string): boolean {
  const items = ensureStore();
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length !== items.length) {
    saveStore(filtered);
    return true;
  }
  return false;
}
