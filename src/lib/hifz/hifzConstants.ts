/**
 * TAHFEEZ-UL-QURAN (HIFZ) CONSTANTS & METADATA
 * Eliotgonj Hazi Rohmatollah Jamiria Madrasha (ESTD 2021)
 */

export interface QuranParaMeta {
  number: number;
  nameBn: string;
  nameAr: string;
  surahRangeBn: string;
  totalPages: number;
}

export const QURAN_PARAS: QuranParaMeta[] = [
  { number: 1, nameBn: "আলিফ লাম মীম", nameAr: "الم", surahRangeBn: "আল-ফাতিহা ১ - আল-বাক্বারাহ ১৪১", totalPages: 20 },
  { number: 2, nameBn: "সায়াকূলু", nameAr: "سيقول", surahRangeBn: "আল-বাক্বারাহ ১৪২ - আল-বাক্বারাহ ২৫২", totalPages: 20 },
  { number: 3, nameBn: "তিলকার রুসুল", nameAr: "تلك الرسل", surahRangeBn: "আল-বাক্বারাহ ২৫৩ - আলে ইমরান ৯২", totalPages: 20 },
  { number: 4, nameBn: "লান তানালূ", nameAr: "لن تنالوا", surahRangeBn: "আলে ইমরান ৯৩ - আন-নিসা ২৩", totalPages: 20 },
  { number: 5, nameBn: "ওয়াল মুহছানাত", nameAr: "والمحصنت", surahRangeBn: "আন-নিসা ২৪ - আন-নিসা ১৪৭", totalPages: 20 },
  { number: 6, nameBn: "লা ইউহিব্বুল্লাহ", nameAr: "لا يحب الله", surahRangeBn: "আন-নিসা ১৪৮ - আল-মায়িদাহ ৮১", totalPages: 20 },
  { number: 7, nameBn: "ওয়া ইযা সামি'উ", nameAr: "وإذا سمعوا", surahRangeBn: "আল-মায়িদাহ ৮২ - আল-আন'আম ১১০", totalPages: 20 },
  { number: 8, nameBn: "ওয়া লাও আন্নানা", nameAr: "ولو أننا", surahRangeBn: "আল-আন'আম ১১১ - আল-আ'রাফ ৮৭", totalPages: 20 },
  { number: 9, nameBn: "ক্বলাল মালাউ", nameAr: "قال الملأ", surahRangeBn: "আল-আ'রাফ ৮৮ - আল-আনফাল ৪০", totalPages: 20 },
  { number: 10, nameBn: "ওয়া'লামূ", nameAr: "واعلموا", surahRangeBn: "আল-আনফাল ৪১ - আত-তাওবাহ ৯২", totalPages: 20 },
  { number: 11, nameBn: "ইয়া'তাযিরূনা", nameAr: "يعتذرون", surahRangeBn: "আত-তাওবাহ ৯৩ - হুদ ৫", totalPages: 20 },
  { number: 12, nameBn: "ওয়া মা মিন দা-ব্বাহ", nameAr: "وما من دابة", surahRangeBn: "হুদ ৬ - ইউসুফ ৫২", totalPages: 20 },
  { number: 13, nameBn: "ওয়া মা উবাররিউ", nameAr: "وما أبرئ", surahRangeBn: "ইউসুফ ৫৩ - ইবরাহীম ৫২", totalPages: 20 },
  { number: 14, nameBn: "রুবা'মা", nameAr: "ربما", surahRangeBn: "আল-হিজর ১ - আন-নাহল ১২৮", totalPages: 20 },
  { number: 15, nameBn: "সুবহানাল্লাযী", nameAr: "سبحن الذي", surahRangeBn: "বনি ইসরাঈল ১ - আল-কাহফ ৭৪", totalPages: 20 },
  { number: 16, nameBn: "ক্বলা আলাম", nameAr: "قال ألم", surahRangeBn: "আল-কাহফ ৭৫ - ত্ব-হা ১৩৫", totalPages: 20 },
  { number: 17, nameBn: "ইক্বতারা বা লিন্নাস", nameAr: "اقترب للناس", surahRangeBn: "আল-আম্বিয়া ১ - আল-হাজ্জ ৭৮", totalPages: 20 },
  { number: 18, nameBn: "ক্বদ আফলাহা", nameAr: "قد أفلح", surahRangeBn: "আল-মু'মিনুন ১ - আল-ফুরকান ২০", totalPages: 20 },
  { number: 19, nameBn: "ওয়া ক্বলাল্লাযীনা", nameAr: "وقال الذين", surahRangeBn: "আল-ফুরকান ২১ - আন-নামল ৫৫", totalPages: 20 },
  { number: 20, nameBn: "আম্মান খালাক্বা", nameAr: "أمن خلق", surahRangeBn: "আন-নামল ৫৬ - আল-আনকাবুত ৪৫", totalPages: 20 },
  { number: 21, nameBn: "উতলু মা উহিয়া", nameAr: "اتل ما أوحي", surahRangeBn: "আল-আনকাবুত ৪৬ - আল-আহযাব ৩০", totalPages: 20 },
  { number: 22, nameBn: "ওয়া মাই ইয়াক্বনুত", nameAr: "ومن يقنت", surahRangeBn: "আল-আহযাব ৩১ - ইয়াসীন ২৭", totalPages: 20 },
  { number: 23, nameBn: "ওয়া মা লিয়া", nameAr: "وما لي", surahRangeBn: "ইয়াসীন ২৮ - আয-যুমার ৩১", totalPages: 20 },
  { number: 24, nameBn: "ফামান আযলামু", nameAr: "فمن أظلم", surahRangeBn: "আয-যুমার ৩২ - ফুসসিলাত ৪৬", totalPages: 20 },
  { number: 25, nameBn: "ইলাইহি ইউরাদ্দু", nameAr: "إليه يرد", surahRangeBn: "ফুসসিলাত ৪৭ - আল-জাসিয়াহ ৩৭", totalPages: 20 },
  { number: 26, nameBn: "হা-মীম", nameAr: "حم", surahRangeBn: "আল-আহক্বাফ ১ - আয-যারিয়াত ৩০", totalPages: 20 },
  { number: 27, nameBn: "ক্বলা ফামা খাতবুকুম", nameAr: "قال فما خطبكم", surahRangeBn: "আয-যারিয়াত ৩১ - আল-হাদীদ ২৯", totalPages: 20 },
  { number: 28, nameBn: "ক্বদ সামি'আল্লাহ", nameAr: "قد سمع الله", surahRangeBn: "আল-মুজাদালাহ ১ - আত-তাহরীম ১২", totalPages: 20 },
  { number: 29, nameBn: "তাবারাকাল্লাযী", nameAr: "تبرك الذي", surahRangeBn: "আল-মুলক ১ - আল-মুরসালাত ৫০", totalPages: 20 },
  { number: 30, nameBn: "আম্মা ইয়াতাসাআলূন", nameAr: "عم يتساءلون", surahRangeBn: "আন-নাবা ১ - আন-নাস ৬", totalPages: 23 },
];

export interface HifzQualityOption {
  code: "MUMTAZ" | "JAYYID_JIDDAN" | "JAYYID" | "MAQBOOL" | "DOHRANO";
  labelBn: string;
  grade: string;
  description: string;
  badgeClass: string;
}

export const HIFZ_QUALITY_OPTIONS: Record<string, HifzQualityOption> = {
  MUMTAZ: {
    code: "MUMTAZ",
    labelBn: "মুমতাজ (অসাধারণ)",
    grade: "A+",
    description: "নির্ভুল ও সুন্দর তিলাওয়াত, কোনো লোকমা ছাড়া",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  JAYYID_JIDDAN: {
    code: "JAYYID_JIDDAN",
    labelBn: "জায়্যিদ জিদ্দান (উত্তম)",
    grade: "A",
    description: "খুব ভালো, ১-২টি সামান্য লোকমা সহকারে",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
  },
  JAYYID: {
    code: "JAYYID",
    labelBn: "জায়্যিদ (ভালো)",
    grade: "B",
    description: "সন্তোষজনক, তাজবীদ সহকারে পুনরাবৃত্তি প্রয়োজন",
    badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-300",
  },
  MAQBOOL: {
    code: "MAQBOOL",
    labelBn: "মাকবুল (চলনসই)",
    grade: "C",
    description: "দুর্বল, বেশ কয়েকটি লোকমা লেগেছে",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  DOHRANO: {
    code: "DOHRANO",
    labelBn: "দোহরানো (দুর্বল/পুনরাবৃত্তি)",
    grade: "F",
    description: "পড়া কাঁচা, আগামীকাল এই পড়া পুনরায় শুনাতে হবে",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
  },
};
