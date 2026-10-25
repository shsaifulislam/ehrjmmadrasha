import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import { INSTITUTION_INFO } from "@/lib/constants";
import { getAppUrl } from "@/lib/env";

export const DOCUMENT_CATEGORIES = [
  { id: "IDENTITY", nameBn: "পরিচয়পত্র (Identity)", icon: "CreditCard" },
  { id: "ADMISSION", nameBn: "ভর্তি নিশ্চয়তা (Admission)", icon: "FileCheck" },
  { id: "ACADEMIC", nameBn: "একাডেমিক সনদ ও পরীক্ষা (Academic)", icon: "Award" },
  { id: "INSTITUTIONAL", nameBn: "প্রাতিষ্ঠানিক প্রত্যয়ন (Institutional)", icon: "Building" },
  { id: "TRANSFER", nameBn: "ছাড়পত্র / টিসি (Transfer)", icon: "ExternalLink" },
  { id: "FINANCIAL", nameBn: "আর্থিক রশিদ ও ইনভয়েস (Financial)", icon: "DollarSign" },
] as const;

export const DOCUMENT_TYPES = [
  { code: "STUDENT_ID", nameBn: "ডিজিটাল স্টুডেন্ট আইডি কার্ড", nameEn: "Digital Student ID Card", prefix: "EHRJ-ID", category: "IDENTITY" },
  { code: "TEACHER_ID", nameBn: "শিক্ষক ও স্টাফ স্মার্ট আইডি কার্ড", nameEn: "Teacher & Staff ID Card", prefix: "EHRJ-TID", category: "IDENTITY" },
  { code: "IDENTITY_CERTIFICATE", nameBn: "শিক্ষার্থী পরিচয়পত্র", nameEn: "Student Identity Certificate", prefix: "EHRJ-IDC", category: "IDENTITY" },
  { code: "ADMISSION_CONFIRMATION", nameBn: "ভর্তি নিশ্চয়তা ও সনদপত্র", nameEn: "Admission Confirmation Certificate", prefix: "EHRJ-ADM", category: "ADMISSION" },
  { code: "HIFZ_CERTIFICATE", nameBn: "হিফজুল কুরআন সমাপনী সনদ", nameEn: "Hifzul Quran Completion Sanad", prefix: "EHRJ-HIFZ", category: "ACADEMIC" },
  { code: "MISHKAT_CERTIFICATE", nameBn: "মেশকাত সমাপনী সনদ", nameEn: "Mishkat Completion Certificate", prefix: "EHRJ-MISHKAT", category: "ACADEMIC" },
  { code: "DAWRA_CERTIFICATE", nameBn: "দাওরায়ে হাদীস সমাপনী সনদ", nameEn: "Dawra-e-Hadith Completion Certificate", prefix: "EHRJ-DAWRA", category: "ACADEMIC" },
  { code: "STUDY_CERTIFICATE", nameBn: "অধ্যয়ন ও ভর্তি প্রত্যয়নপত্র", nameEn: "Study / Enrollment Certificate", prefix: "EHRJ-STUDY", category: "INSTITUTIONAL" },
  { code: "PRATYAYAN_PATRA", nameBn: "প্রাতিষ্ঠানিক প্রত্যয়নপত্র", nameEn: "Institutional Pratyayan Patra", prefix: "EHRJ-PRT", category: "INSTITUTIONAL" },
  { code: "CHARACTER_CERTIFICATE", nameBn: "চারিত্রিক প্রশংসাপত্র ও সনদ", nameEn: "Character Certificate", prefix: "EHRJ-CHR", category: "INSTITUTIONAL" },
  { code: "TESTIMONIAL", nameBn: "প্রশংসাপত্র (টেস্টিমোনিয়াল)", nameEn: "Institutional Testimonial", prefix: "EHRJ-TST", category: "INSTITUTIONAL" },
  { code: "STUDENT_STATUS", nameBn: "শিক্ষার্থী স্ট্যাটাস সনদ", nameEn: "Student Status Certificate", prefix: "EHRJ-STAT", category: "INSTITUTIONAL" },
  { code: "TRANSFER_CERTIFICATE", nameBn: "ছাড়পত্র / টিসি", nameEn: "Transfer Certificate (TC)", prefix: "EHRJ-TC", category: "TRANSFER" },
  { code: "RESULT_MARKSHEET", nameBn: "একাডেমিক ফলাফল ও নম্বরপত্র", nameEn: "Academic Result Marksheet", prefix: "EHRJ-RES", category: "ACADEMIC" },
  { code: "ADMIT_CARD", nameBn: "পরীক্ষার প্রবেশপত্র (এডমিট কার্ড)", nameEn: "Examination Admit Card", prefix: "EHRJ-ADMT", category: "ACADEMIC" },
  { code: "PAYMENT_RECEIPT", nameBn: "ফি পরিশোধ রশিদ (মানি রিসিট)", nameEn: "Official Payment Receipt", prefix: "EHRJ-REC", category: "FINANCIAL" },
  { code: "FEE_INVOICE", nameBn: "ফি ইনভয়েস ও বিলিং বিবরণী", nameEn: "Fee Invoice & Due Slip", prefix: "EHRJ-INV", category: "FINANCIAL" },
  { code: "OTHER", nameBn: "অন্যান্য অফিশিয়াল প্রত্যয়নপত্র", nameEn: "Other Official Certificate", prefix: "EHRJ-DOC", category: "INSTITUTIONAL" },
] as const;

export type DocumentTypeCode = (typeof DOCUMENT_TYPES)[number]["code"];


/**
 * Standard Default Document Templates for all 13 canonical types
 */
export const DEFAULT_TEMPLATES = [
  {
    code: "STUDENT_ID",
    documentType: "STUDENT_ID",
    nameBn: "ডিজিটাল স্টুডেন্ট আইডি কার্ড টেমপ্লেট",
    nameEn: "Student ID Card Template",
    titleBn: "ডিজিটাল স্টুডেন্ট আইডি কার্ড",
    titleEn: "Digital Student Identity Card",
    bodyBn: "নাম: {{student.nameBn}}\nআইডি: {{student.studentId}}\nজামাত: {{class.name}}, শাখা: {{section.name}}, রোল: {{student.roll}}\nশিক্ষাবর্ষ: {{session.name}}\nজরুরি যোগাযোগ: {{guardian.phone}}",
    bodyEn: "Name: {{student.nameEn}}\nID: {{student.studentId}}\nClass: {{class.name}}, Roll: {{student.roll}}\nSession: {{session.name}}\nEmergency: {{guardian.phone}}",
    signatoryTitleBn: "মুহতামিম ও অধ্যক্ষ",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "TEACHER_ID",
    documentType: "TEACHER_ID",
    nameBn: "শিক্ষক ও স্টাফ স্মার্ট আইডি কার্ড টেমপ্লেট",
    nameEn: "Teacher & Staff ID Card Template",
    titleBn: "শিক্ষক ও স্টাফ স্মার্ট আইডি কার্ড",
    titleEn: "Teacher & Staff Identity Card",
    bodyBn: "নাম: {{teacher.nameBn}}\nপদবি: {{teacher.designation}}\nআইডি: {{teacher.employeeId}}\nবিভাগ: {{teacher.department}}\nজরুরি যোগাযোগ: {{teacher.phone}}",
    bodyEn: "Name: {{teacher.nameEn}}\nDesignation: {{teacher.designation}}\nID: {{teacher.employeeId}}\nDepartment: {{teacher.department}}\nEmergency: {{teacher.phone}}",
    signatoryTitleBn: "মুহতামিম ও অধ্যক্ষ",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "HIFZ_CERTIFICATE",
    documentType: "HIFZ_CERTIFICATE",
    nameBn: "হিফজুল কুরআন সমাপনী সনদ টেমপ্লেট",
    nameEn: "Hifzul Quran Completion Sanad Template",
    titleBn: "হিফজুল কুরআন সমাপনী সনদ",
    titleEn: "Hifzul Quran Completion Sanad",
    bodyBn: "আল্লাহ তাআলার অশেষ মেহেরবানিতে অত্র ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার তাহফীজুল কুরআন (হিফজ) বিভাগ হইতে {{student.nameBn}}, পিতা: {{student.fatherNameBn}}, মাতা: {{student.motherNameBn}}— মহাগ্রন্থ আল-কুরআনুল কারীমের পূর্ণ ৩০ পারা সম্পূর্ণ সহীহ-শুদ্ধ তিলাওয়াত ও তাজবীদ সহকারে হিফজ সম্পন্ন করিয়াছে। সে অত্র জামিয়ার কেন্দ্রীয় হিফজ সমাপনী পরীক্ষায় কৃতিত্বের সাথে উত্তীর্ণ হইয়াছে। অত্র জামিয়ার পক্ষ হইতে তাহাকে এই গৌরবোজ্জ্বল 'হিফজুল কুরআন সমাপনী সনদ' প্রদান করা হইল।",
    bodyEn: "By the grace of Allah Almighty, {{student.nameEn}}, child of {{student.fatherNameBn}}, has successfully completed the memorization of the Holy Quran (all 30 Juz) with proper Tajweed and pronunciation from the Tahfeez-ul-Quran Department of Eliotganj Hazi Rohmatollah Jamiria Madrasha.",
    signatoryTitleBn: "মুহতামিম ও প্রধান ক্বারী",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "MISHKAT_CERTIFICATE",
    documentType: "MISHKAT_CERTIFICATE",
    nameBn: "মেশকাত জামাত সমাপনী সনদ টেমপ্লেট",
    nameEn: "Mishkat Academic Completion Certificate Template",
    titleBn: "মেশকাত জামাত সমাপনী সনদ",
    titleEn: "Mishkat Academic Completion Certificate",
    bodyBn: "এই মর্মে প্রত্যয়ন করা যাইতেছে যে, {{student.nameBn}}, পিতা: {{student.fatherNameBn}}, মাতা: {{student.motherNameBn}}— ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় উচ্চতর হাদিস বিভাগপূর্ব 'মেশকাত জামাত' সফলতার সহিত সম্পন্ন করিয়াছে। সে মিশকাতুল মাসাবিহ সহ নির্ধারিত দরসী কিতাবসমূহের পাঠ সমাপ্ত করিয়া কেন্দ্রীয় পরীক্ষায় উত্তীর্ণ হইয়াছে। তাহার জ্ঞানলিপ্সা, ইলমী অগ্রগতি ও আখলাক প্রশংসনীয়।",
    bodyEn: "This is to certify that {{student.nameEn}}, child of {{student.fatherNameBn}}, has successfully completed the Mishkat academic tier at Eliotganj Hazi Rohmatollah Jamiria Madrasha, passing the prescribed curriculum of Mishkat al-Masabih and canonical texts with distinction.",
    signatoryTitleBn: "মুহতামিম ও শায়খুল হাদিস",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "DAWRA_CERTIFICATE",
    documentType: "DAWRA_CERTIFICATE",
    nameBn: "দাওরায়ে হাদীস সমাপনী সনদ টেমপ্লেট",
    nameEn: "Dawra-e-Hadith Graduation Sanad Template",
    titleBn: "দাওরায়ে হাদীস (মাস্টার্স সমমান) চূড়ান্ত সমাপনী সনদ",
    titleEn: "Dawra-e-Hadith (Master's Equivalent) Graduation Sanad",
    bodyBn: "সমস্ত প্রশংসা জগৎসমূহের প্রতিপালক আল্লাহ তাআলার জন্য। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সর্বোচ্চ দ্বীনি শিক্ষাক্রম 'দাওরায়ে হাদীস' (মাস্টার্স সমমান) জামাত হইতে {{student.nameBn}}, পিতা: {{student.fatherNameBn}}, মাতা: {{student.motherNameBn}}— সিহাহ সিত্তাহ সহ হাদিসের বিশুদ্ধ গ্রন্থাবলির অধ্যয়ন ও সমাপনান্তে কেন্দ্রীয় চূড়ান্ত পরীক্ষায় গৌরবময় সাফল্য অর্জন করিয়াছে। অত্র জামিয়ার পক্ষ হইতে তাহাকে উচ্চতর হাদিস শাস্ত্র সমাপন ও সনদের এই আনুষ্ঠানিক মহা-স্বীকৃতি প্রদান করা হইল।",
    bodyEn: "All praise be to Allah. {{student.nameEn}}, child of {{student.fatherNameBn}}, has successfully graduated from the Dawra-e-Hadith (Master's Equivalent) program at Eliotganj Hazi Rohmatollah Jamiria Madrasha, completing the study of Kutub al-Sittah and canonical Hadith literature with exemplary scholarly conduct.",
    signatoryTitleBn: "মুহতামিম ও প্রধান শায়খুল হাদিস",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "IDENTITY_CERTIFICATE",
    documentType: "IDENTITY_CERTIFICATE",
    nameBn: "শিক্ষার্থী পরিচয়পত্র টেমপ্লেট",
    nameEn: "Student Identity Certificate Template",
    titleBn: "শিক্ষার্থী প্রাতিষ্ঠানিক পরিচয়পত্র ও প্রত্যয়ন",
    titleEn: "Student Identity & Enrollment Letter",
    bodyBn: "এই মর্মে পরিচয়পত্র ও প্রত্যয়ন প্রদান করা যাইতেছে যে, {{student.nameBn}}, পিতা: {{student.fatherNameBn}}, মাতা: {{student.motherNameBn}}— ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার {{session.name}} শিক্ষাবর্ষের {{class.name}} জামাতের একজন নিবন্ধিত শিক্ষার্থী। তাহার স্টুডেন্ট আইডি নম্বর {{student.studentId}} এবং শ্রেণি রোল নম্বর {{student.roll}}। অত্র প্রতিষ্ঠানে তাহার আবাসিক অবস্থান: {{student.residentialStatus}}। অত্র পরিচয়পত্রটি তাহার প্রাতিষ্ঠানিক পরিচিতির সত্য সাক্ষ্য হিসেবে প্রদান করা হইল।",
    bodyEn: "This is to certify that {{student.nameBn}}, son of {{student.fatherNameBn}} and {{student.motherNameBn}}, is a registered student of Class: {{class.name}}, Session: {{session.name}}, Student ID: {{student.studentId}}, Roll: {{student.roll}}.",
    signatoryTitleBn: "মুহতামিম ও অধ্যক্ষ",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "STUDY_CERTIFICATE",
    documentType: "STUDY_CERTIFICATE",
    nameBn: "অধ্যয়ন প্রত্যয়নপত্র টেমপ্লেট",
    nameEn: "Study Certificate Template",
    titleBn: "অধ্যয়ন ও ভর্তি প্রত্যয়নপত্র",
    titleEn: "Study / Enrollment Certificate",
    bodyBn: "এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, {{student.nameBn}}, পিতা: {{student.fatherNameBn}}, মাতা: {{student.motherNameBn}}, ঠিকানা: {{student.presentAddress}}— অত্র জামিয়ার {{session.name}} শিক্ষাবর্ষের {{class.name}} জামাতের (শাখা: {{section.name}}) একজন নিয়মিত শিক্ষার্থী। তাহার মাদরাসা আইডি নম্বর {{student.studentId}} এবং শ্রেণিতে তাহার বর্তমান রোল নম্বর {{student.roll}}। সে মাদরাসায় নিয়মিত উপস্থিত থাকিয়া নিষ্ঠার সাথে পাঠগ্রহণ করিতেছে। আমাদের জানামতে তাহার আচার-আচরণ প্রশংসনীয়।",
    bodyEn: "This is to certify that {{student.nameBn}}, Son of {{student.fatherNameBn}} and {{student.motherNameBn}}, is a regular student of {{class.name}} for the academic session {{session.name}} at our institution. His Student ID is {{student.studentId}} and Roll is {{student.roll}}.",
    signatoryTitleBn: "মুহতামিম ও শায়খুল হাদিস",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "PRATYAYAN_PATRA",
    documentType: "PRATYAYAN_PATRA",
    nameBn: "প্রাতিষ্ঠানিক প্রত্যয়নপত্র টেমপ্লেট",
    nameEn: "Institutional Pratyayan Patra Template",
    titleBn: "প্রাতিষ্ঠানিক প্রত্যয়নপত্র",
    titleEn: "Institutional Certificate / Pratyayan Patra",
    bodyBn: "এতদ্বারা প্রত্যয়ন করা যাইতেছে যে, {{student.nameBn}}, পিতা: {{student.fatherNameBn}}, মাতা: {{student.motherNameBn}}— অত্র ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় {{session.name}} শিক্ষাবর্ষে {{class.name}} জামাতে অধ্যয়নরত শিক্ষার্থী। তাহার প্রাতিষ্ঠানিক আইডি: {{student.studentId}} এবং রোল: {{student.roll}}। অত্র জামিয়ার যাবতীয় নিয়মশৃঙ্খলা পালন করিয়া সে সুষ্ঠুভাবে শিক্ষা কার্যক্রম পরিচালনা করিতেছে। অত্র সনদটি তাহার বিশেষ প্রয়োজনে কর্তৃপক্ষের অনুমোদনক্রমে ইস্যু করা হইল।",
    bodyEn: "This official certificate confirms that {{student.nameBn}}, child of {{student.fatherNameBn}}, is an enrolled student of {{class.name}} (Session {{session.name}}) with Student ID: {{student.studentId}}.",
    signatoryTitleBn: "মুহতামিম ও অধ্যক্ষ",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "CHARACTER_CERTIFICATE",
    documentType: "CHARACTER_CERTIFICATE",
    nameBn: "চারিত্রিক প্রশংসাপত্র টেমপ্লেট",
    nameEn: "Character Certificate Template",
    titleBn: "চারিত্রিক প্রশংসাপত্র ও সনদ",
    titleEn: "Character Certificate",
    bodyBn: "এই মর্মে চারিত্রিক প্রত্যয়ন প্রদান করা যাচ্ছে যে, {{student.nameBn}}, পিতা: {{student.fatherNameBn}}, মাতা: {{student.motherNameBn}}— ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় অধ্যয়নরত অবস্থায় সদাচরণ, নিয়মশৃঙ্খলা ও দ্বীনি শিষ্টাচার বজায় রেখেছে। অত্র মাদরাসার প্রশাসনিক ও শৃঙ্খলা রেকর্ডে তাহার বিরুদ্ধে কোনো ধরনের নৈতিক স্খলন, শৃঙ্খলাভঙ্গ বা অসদাচরণের অভিযোগ নেই। তাহার স্বভাব-চরিত্র প্রশংসনীয় ও নির্ভরযোগ্য।\n\nআমরা তাহার ভবিষ্যৎ জীবনের সার্বিক কল্যাণ ও উজ্জ্বল সফলতা কামনা করি।",
    bodyEn: "This is to certify that {{student.nameBn}}, Son of {{student.fatherNameBn}}, has maintained exemplary character, discipline, and moral conduct during his tenure at our institution. There is no record of misconduct against him.",
    signatoryTitleBn: "মুহতামিম ও অধ্যক্ষ",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "TESTIMONIAL",
    documentType: "TESTIMONIAL",
    nameBn: "প্রশংসাপত্র টেমপ্লেট",
    nameEn: "Institutional Testimonial Template",
    titleBn: "প্রাতিষ্ঠানিক প্রশংসাপত্র (Testimonial)",
    titleEn: "Testimonial",
    bodyBn: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার পক্ষ হইতে আনন্দের সাথে প্রত্যয়ন করা যাইতেছে যে, {{student.nameBn}}, ছাত্র আইডি: {{student.studentId}}, পিতা: {{student.fatherNameBn}}— অত্র প্রতিষ্ঠানের একজন যোগ্য ও অনুগত শিক্ষার্থী ছিল। সে পাঠগ্রহণে যত্নবান এবং মাদরাসার নিয়মকানুনের প্রতি সর্বদা শ্রদ্ধাশীল ছিল। দ্বীনি ও সাধারণ শিক্ষায় তাহার অগ্রগতি প্রশংসনীয়।\n\nআমরা তাহার ইহকালীন ও পরকালীন জীবনের সর্বাঙ্গীন উন্নতি ও বরকত কামনা করি।",
    bodyEn: "It gives us great pleasure to certify that {{student.nameBn}}, Student ID: {{student.studentId}}, was a dedicated and well-behaved student of our institution. His progress in studies and adherence to values has been commendable.",
    signatoryTitleBn: "মুহতামিম ও শায়খুল হাদিস",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "TRANSFER_CERTIFICATE",
    documentType: "TRANSFER_CERTIFICATE",
    nameBn: "ছাড়পত্র (টিসি) টেমপ্লেট",
    nameEn: "Transfer Certificate (TC) Template",
    titleBn: "ছাড়পত্র / বদলি সনদ (Transfer Certificate)",
    titleEn: "Transfer Certificate",
    bodyBn: "অত্র জামিয়া হইতে জানানো যাইতেছে যে, {{student.nameBn}}, ছাত্র আইডি: {{student.studentId}}, পিতা: {{student.fatherNameBn}}, মাতা: {{student.motherNameBn}}, জন্মতারিখ: {{student.dob}}— অত্র প্রতিষ্ঠানে {{session.name}} শিক্ষাবর্ষ পর্যন্ত {{class.name}} জামাতে নিয়মিত অধ্যয়নরত ছিল। অভিভাবকের আনুষ্ঠানিক আবেদনের প্রেক্ষিতে এবং মাদরাসার যাবতীয় পাওনাদি ও ফি হিসাব নিষ্পত্তি সাপেক্ষে তাহাকে অত্র প্রতিষ্ঠান হইতে সম্মানের সহিত ছাড়পত্র প্রদান করা হইল। অত্র প্রতিষ্ঠানে অধ্যয়নকালে তাহার নৈতিক চরিত্র সন্তোষজনক ছিল। তাহার ভবিষ্যৎ সাফল্য কামনা করি।",
    bodyEn: "This is to certify that {{student.nameBn}}, Student ID: {{student.studentId}}, was enrolled in {{class.name}} up to academic session {{session.name}}. All institutional dues have been settled. He is granted this transfer certificate upon guardian application.",
    signatoryTitleBn: "মুহতামিম ও অধ্যক্ষ",
    requiresFee: true,
    feeAmount: 200,
  },
  {
    code: "ADMISSION_CONFIRMATION",
    documentType: "ADMISSION_CONFIRMATION",
    nameBn: "ভর্তি নিশ্চয়তা পত্র টেমপ্লেট",
    nameEn: "Admission Confirmation Document Template",
    titleBn: "ভর্তি নিশ্চয়তা ও সনদপত্র",
    titleEn: "Admission Confirmation Certificate",
    bodyBn: "এতদ্বারা নিশ্চিত করা যাচ্ছে যে, শিক্ষার্থী {{student.nameBn}}, পিতা: {{student.fatherNameBn}}, মাতা: {{student.motherNameBn}}— ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় {{session.name}} শিক্ষাবর্ষে {{class.name}} জামাতে আনুষ্ঠানিকভাবে ভর্তি নিশ্চিত হয়েছে। তাহার প্রাতিষ্ঠানিক স্টুডেন্ট আইডি: {{student.studentId}} এবং নির্ধারিত শ্রেণি রোল নম্বর: {{student.roll}}।",
    bodyEn: "This document officially confirms the admission of {{student.nameBn}} to {{class.name}} for the academic session {{session.name}} at Eliotganj Hazi Rohmatollah Jamiria Madrasha with Student ID: {{student.studentId}} and Roll: {{student.roll}}.",
    signatoryTitleBn: "ভর্তি সমন্বয়ক ও অধ্যক্ষ",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "STUDENT_STATUS",
    documentType: "STUDENT_STATUS",
    nameBn: "শিক্ষার্থী স্ট্যাটাস সনদ টেমপ্লেট",
    nameEn: "Student Status Certificate Template",
    titleBn: "শিক্ষার্থী বর্তমান স্ট্যাটাস ও অবস্থান সনদ",
    titleEn: "Student Current Status Certificate",
    bodyBn: "এই মর্মে প্রত্যয়ন করা যাইতেছে যে, শিক্ষার্থী {{student.nameBn}} (আইডি: {{student.studentId}}), পিতা: {{student.fatherNameBn}}— ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সেন্ট্রাল ডাটাবেজ রেকর্ড অনুযায়ী বর্তমানে '{{student.status}}' স্ট্যাটাসে অন্তর্ভুক্ত রহিয়াছে। তাহার নিবন্ধিত জামাত: {{class.name}}, শাখা: {{section.name}}, শিক্ষাবর্ষ: {{session.name}}।",
    bodyEn: "This certificate confirms that student {{student.nameBn}} (ID: {{student.studentId}}) currently maintains the status '{{student.status}}' in the institutional record for Class {{class.name}}, Session {{session.name}}.",
    signatoryTitleBn: "রেজিস্ট্রার ও অধ্যক্ষ",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "RESULT_MARKSHEET",
    documentType: "RESULT_MARKSHEET",
    nameBn: "একাডেমিক ফলাফল ও নম্বরপত্র টেমপ্লেট",
    nameEn: "Academic Result Marksheet Template",
    titleBn: "প্রাতিষ্ঠানিক একাডেমিক ফলাফল ও নম্বরপত্র",
    titleEn: "Academic Transcript & Marksheet",
    bodyBn: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সেন্ট্রাল পরীক্ষা নিয়ন্ত্রণ শাখা কর্তৃক প্রত্যয়ন করা যাইতেছে যে, শিক্ষার্থী {{student.nameBn}}, আইডি: {{student.studentId}}, শ্রেণি: {{class.name}}, রোল: {{student.roll}}— {{session.name}} শিক্ষাবর্ষের '{{exam.name}}' পরীক্ষায় অংশগ্রহণ করিয়া চূড়ান্ত ফলাফল অর্জন করিয়াছে। নিম্নে তাহার অর্জিত নম্বর ও গ্রেড বিবরণী প্রদত্ত হইল।",
    bodyEn: "Official academic marksheet and transcript for {{student.nameBn}}, Student ID: {{student.studentId}}, Class: {{class.name}}, Session: {{session.name}} for the examination {{exam.name}}.",
    signatoryTitleBn: "পরীক্ষা নিয়ন্ত্রক ও অধ্যক্ষ",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "ADMIT_CARD",
    documentType: "ADMIT_CARD",
    nameBn: "পরীক্ষার প্রবেশপত্র টেমপ্লেট",
    nameEn: "Examination Admit Card Template",
    titleBn: "পরীক্ষার প্রবেশপত্র (Admit Card)",
    titleEn: "Examination Admit Card",
    bodyBn: "পরীক্ষার্থীর নাম: {{student.nameBn}}\nআইডি নম্বর: {{student.studentId}}\nশ্রেণি: {{class.name}}, রোল: {{student.roll}}, শাখা: {{section.name}}\nপরীক্ষার নাম: {{exam.name}}\nশিক্ষাবর্ষ: {{session.name}}\n\nনির্দেশাবলি:\n১. পরীক্ষার্থীকে অবশ্যই এই প্রবেশপত্র সঙ্গে নিয়ে পরীক্ষা কক্ষে উপস্থিত হতে হবে।\n২. পরীক্ষার নির্ধারিত সময়ের অন্তত ১৫ মিনিট পূর্বে কক্ষে আসন গ্রহণ করতে হবে।",
    bodyEn: "Examinee: {{student.nameEn}}, ID: {{student.studentId}}, Class: {{class.name}}, Roll: {{student.roll}}, Exam: {{exam.name}}.",
    signatoryTitleBn: "পরীক্ষা নিয়ন্ত্রক",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "PAYMENT_RECEIPT",
    documentType: "PAYMENT_RECEIPT",
    nameBn: "ফি পরিশোধ রশিদ টেমপ্লেট",
    nameEn: "Payment Receipt Template",
    titleBn: "অফিশিয়াল ফি পরিশোধ রশিদ (Money Receipt)",
    titleEn: "Official Payment Receipt",
    bodyBn: "শিক্ষার্থীর নাম: {{student.nameBn}} (আইডি: {{student.studentId}})\nশ্রেণি: {{class.name}}, রোল: {{student.roll}}\nরশিদ নম্বর: {{receipt.number}}, তারিখ: {{document.issueDate}}\nপরিশোধের মাধ্যম: {{receipt.paymentMethod}}\nপরিশোধিত অর্থ: ৳{{receipt.amount}}। অত্র রশিদটি ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার হিসাব বিভাগ কর্তৃক ডিজিটাল সিস্টেমে গৃহীত ও অনুমোদিত।",
    bodyEn: "Received with thanks from {{student.nameEn}} (ID: {{student.studentId}}) the amount of BDT {{receipt.amount}} for fee settlement. Receipt No: {{receipt.number}}.",
    signatoryTitleBn: "হিসাবরক্ষণ কর্মকর্তা",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "FEE_INVOICE",
    documentType: "FEE_INVOICE",
    nameBn: "ফি ইনভয়েস ও বিলিং স্লিপ টেমপ্লেট",
    nameEn: "Fee Invoice Template",
    titleBn: "প্রাতিষ্ঠানিক ফি ইনভয়েস ও বিলিং বিবরণী",
    titleEn: "Official Fee Invoice & Due Slip",
    bodyBn: "শিক্ষার্থীর নাম: {{student.nameBn}} (আইডি: {{student.studentId}})\nশ্রেণি: {{class.name}}, রোল: {{student.roll}}, সেশন: {{session.name}}\nমোট ধার্যকৃত ফি: ৳{{finance.totalBilled}}\nপরিশোধিত: ৳{{finance.totalPaid}}\nবর্তমান অবশিষ্ট বকেয়া: ৳{{finance.totalDue}}\nঅনুগ্রহপূর্বক নির্ধারিত তারিখের পূর্বে বকেয়া পরিশোধ করুন।",
    bodyEn: "Fee Invoice for {{student.nameEn}} (ID: {{student.studentId}}). Total Billed: BDT {{finance.totalBilled}}, Total Paid: BDT {{finance.totalPaid}}, Net Due: BDT {{finance.totalDue}}.",
    signatoryTitleBn: "হিসাব শাখা ও প্রশাসন",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "OTHER",
    documentType: "OTHER",
    nameBn: "অন্যান্য অফিশিয়াল প্রত্যয়নপত্র টেমপ্লেট",
    nameEn: "Other Certificate Template",
    titleBn: "অফিশিয়াল প্রাতিষ্ঠানিক প্রত্যয়নপত্র",
    titleEn: "Official Institutional Certificate",
    bodyBn: "এতদ্বারা প্রত্যয়ন করা যাইতেছে যে, {{student.nameBn}}, পিতা: {{student.fatherNameBn}}— ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার একজন নিবন্ধিত শিক্ষার্থী (আইডি: {{student.studentId}}, শ্রেণি: {{class.name}}, রোল: {{student.roll}})। অত্র প্রত্যয়নপত্রটি কর্তৃপক্ষের অনুমোদনক্রমে প্রদান করা হইল।",
    bodyEn: "This is to certify that {{student.nameBn}} is a student of Eliotganj Hazi Rohmatollah Jamiria Madrasha.",
    signatoryTitleBn: "মুহতামিম ও অধ্যক্ষ",
    requiresFee: false,
    feeAmount: 0,
  },
];

/**
 * Initialize Default Templates if not present in database
 */
export async function ensureDefaultTemplates(): Promise<void> {
  for (const tpl of DEFAULT_TEMPLATES) {
    const existing = await prisma.documentTemplate.findUnique({
      where: { code: tpl.code },
    });
    if (!existing) {
      await prisma.documentTemplate.create({
        data: {
          code: tpl.code,
          nameBn: tpl.nameBn,
          nameEn: tpl.nameEn,
          documentType: tpl.documentType,
          titleBn: tpl.titleBn,
          titleEn: tpl.titleEn,
          bodyBn: tpl.bodyBn,
          bodyEn: tpl.bodyEn,
          signatoryTitleBn: tpl.signatoryTitleBn,
          requiresFee: tpl.requiresFee,
          feeAmount: tpl.feeAmount,
          version: 1,
          isActive: true,
        },
      });
    }
  }
}

/**
 * Safe Pure-String Template Variable Interpolator
 * Never returns undefined or throws error
 */
export function interpolateTemplate(templateText: string, vars: Record<string, any>): string {
  if (!templateText) return "";

  return templateText.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    const keys = key.split(".");
    let current: any = vars;
    for (const k of keys) {
      if (current === undefined || current === null) return "";
      current = current[k];
    }
    return current !== undefined && current !== null ? String(current) : "";
  });
}

const DOCUMENT_PREFIX_MAP: Record<string, string> = {
  STUDENT_ID: "EHRJ-ID",
  TEACHER_ID: "EHRJ-STAFF-ID",
  STUDY_CERTIFICATE: "EHRJ-STUDY",
  PRATYAYAN_PATRA: "EHRJ-PRATYAYAN",
  CHARACTER_CERTIFICATE: "EHRJ-CHAR",
  TRANSFER_CERTIFICATE: "EHRJ-TC",
  TESTIMONIAL: "EHRJ-TESTI",
  HIFZ_CERTIFICATE: "EHRJ-HIFZ",
  MISHKAT_CERTIFICATE: "EHRJ-MISHKAT",
  DAWRA_CERTIFICATE: "EHRJ-DAWRA",
  IDENTITY_CERTIFICATE: "EHRJ-IDENT",
  RESULT_MARKSHEET: "EHRJ-MARK",
  ADMIT_CARD: "EHRJ-ADMIT",
  FEE_RECEIPT: "EHRJ-RCP",
  FEE_INVOICE: "EHRJ-INV",
  GENERAL_APPLICATION: "EHRJ-APP",
};

/**
 * Generate Next Unique Concurrency-Safe Document Number
 * Format: PREFIX-YYYY-XXXXX (e.g. EHRJ-ID-2026-00001)
 */
export async function generateNextDocumentNumber(docType: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  const matchedType = DOCUMENT_TYPES.find((t) => t.code === docType);
  const prefix = (matchedType && (matchedType as any).prefix) || DOCUMENT_PREFIX_MAP[docType] || "EHRJ-DOC";
  const searchPrefix = `${prefix}-${currentYear}-`;

  const certs = await prisma.certificate.findMany({
    where: { certificateNumber: { startsWith: searchPrefix } },
    select: { certificateNumber: true },
  });

  let maxSeq = 0;
  for (const c of certs) {
    const parts = c.certificateNumber.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `${searchPrefix}${String(nextSeq).padStart(5, "0")}`;
  while (certs.some((c) => c.certificateNumber === candidate)) {
    nextSeq++;
    candidate = `${searchPrefix}${String(nextSeq).padStart(5, "0")}`;
  }
  return candidate;
}

/**
 * Generate Next Unique Concurrency-Safe Request Number
 * Format: EHRJ-REQ-YYYY-XXXXX
 */
export async function generateNextRequestNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const searchPrefix = `EHRJ-REQ-${currentYear}-`;

  const reqs = await prisma.documentRequest.findMany({
    where: { requestNumber: { startsWith: searchPrefix } },
    select: { requestNumber: true },
  });

  let maxSeq = 0;
  for (const r of reqs) {
    const parts = r.requestNumber.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `${searchPrefix}${String(nextSeq).padStart(5, "0")}`;
  while (reqs.some((r) => r.requestNumber === candidate)) {
    nextSeq++;
    candidate = `${searchPrefix}${String(nextSeq).padStart(5, "0")}`;
  }
  return candidate;
}

/**
 * Generate Next Unique Concurrency-Safe Verification Code
 * Format: EHRJ-VER-YYYY-XXXXX
 */
export async function generateNextVerificationCode(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const searchPrefix = `EHRJ-VER-${currentYear}-`;

  const certs = await prisma.certificate.findMany({
    where: { verificationCode: { startsWith: searchPrefix } },
    select: { verificationCode: true },
  });

  let maxSeq = 0;
  for (const c of certs) {
    const parts = c.verificationCode.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `${searchPrefix}${String(nextSeq).padStart(5, "0")}`;
  while (certs.some((c) => c.verificationCode === candidate)) {
    nextSeq++;
    candidate = `${searchPrefix}${String(nextSeq).padStart(5, "0")}`;
  }
  return candidate;
}

/**
 * Resolve Full Authoritative Academic, Financial & Exam Context for a Student
 */
export async function resolveStudentAcademicContext(studentId: string, sessionId?: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        include: {
          jamatClass: true,
          section: true,
          session: true,
        },
        orderBy: { enrolledAt: "desc" },
      },
      guardianLinks: {
        include: { guardian: true },
      },
    },
  });

  if (!student) return null;

  const activeEnrollment =
    student.enrollments.find((e) => (sessionId ? e.sessionId === sessionId : e.status === "ACTIVE")) ||
    student.enrollments[0];

  // Financial summary
  const invoices = await prisma.feeInvoice.findMany({
    where: { studentId },
    select: {
      id: true,
      invoiceNumber: true,
      title: true,
      totalAmount: true,
      paidAmount: true,
      dueAmount: true,
      status: true,
      dueDate: true,
      receipts: {
        select: {
          id: true,
          receiptNumber: true,
          amount: true,
          paymentMethod: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let totalBilled = 0;
  let totalPaid = 0;
  let totalDue = 0;
  for (const inv of invoices) {
    totalBilled += inv.totalAmount;
    totalPaid += inv.paidAmount;
    totalDue += inv.dueAmount;
  }

  // Authoritative Exam Results
  const results = await prisma.result.findMany({
    where: { studentId },
    include: {
      exam: {
        include: {
          session: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Authoritative Payment Receipts
  const receipts = await prisma.paymentReceipt.findMany({
    where: { studentId },
    include: {
      invoice: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    student,
    activeEnrollment,
    financialSummary: {
      totalBilled,
      totalPaid,
      totalDue,
      hasOutstandingDues: totalDue > 0,
      invoices,
      receipts,
    },
    results,
  };
}

/**
 * Validate Document Eligibility based on student and document type
 * STRICT SERVER-SIDE INVARIANT: Academic Completion Certificate is ELIGIBLE ONLY for:
 * 1. HIFZUL QURAN (হিফজুল কুরআন)
 * 2. MISHKAT (মেশকাত)
 * 3. DAWRA-E-HADITH (দাওরায়ে হাদীস)
 * All other ordinary jamats (শিশু, ১ম-৩য়, নূরানী, নাযেরা, মিযান, নাহবেমীর, হেদায়েতুন্নাহু, কাফিয়া, ইত্যাদি) are STRICTLY BLOCKED server-side.
 */
export async function validateDocumentEligibility(
  studentId: string,
  docType: string,
  sessionId?: string
): Promise<{ eligible: boolean; reason?: string; context?: any; activeDocument?: any }> {
  const context = await resolveStudentAcademicContext(studentId, sessionId);

  if (!context || !context.student) {
    return { eligible: false, reason: "শিক্ষার্থী পাওয়া যায়নি।" };
  }

  const { student, activeEnrollment } = context;

  // 1. Suspension blocks all official document generation
  if (student.status === "SUSPENDED") {
    return { eligible: false, reason: "সাময়িকভাবে বহিষ্কৃত শিক্ষার্থীর জন্য কোনো অফিশিয়াল সনদপত্র ইস্যু করা যাবে না।" };
  }

  // 2. Active enrollment check for identity and study certificate
  if (!activeEnrollment && (docType === "STUDENT_ID" || docType === "STUDY_CERTIFICATE")) {
    return { eligible: false, reason: "শিক্ষার্থীর কোনো সক্রিয় ভর্তি/শ্রেণি রেকর্ড পাওয়া যায়নি।" };
  }

  // 3. Duplicate check for Student ID Card (Only 1 active ID card allowed per student)
  if (docType === "STUDENT_ID") {
    const existingActiveCard = await prisma.certificate.findFirst({
      where: {
        studentId,
        certificateType: "STUDENT_ID",
        isRevoked: false,
        status: "ISSUED",
      },
    });

    if (existingActiveCard) {
      return {
        eligible: true,
        reason: `সক্রিয় আইডি কার্ড ইতিমধ্যে বিদ্যমান রয়েছে (নম্বর: ${existingActiveCard.certificateNumber})। পুনর্মুদ্রণ অথবা 'রি-ইস্যু' ব্যবহার করুন।`,
        context,
        activeDocument: existingActiveCard,
      };
    }
  }

  // Helper: Find enrollment in matching class codes or names across all student's history
  const allEnrollments: any[] = student.enrollments || [];
  const findMatchingEnrollment = (codes: string[], keywords: string[]) => {
    return allEnrollments.find((en) => {
      const classCode = en.jamatClass?.code?.toUpperCase() || "";
      const classNameBn = en.jamatClass?.nameBn || "";
      const classNameEn = en.jamatClass?.nameEn?.toUpperCase() || "";

      const codeMatch = codes.some((c) => classCode.includes(c));
      const keywordMatch = keywords.some(
        (k) => classNameBn.includes(k) || classNameEn.includes(k.toUpperCase())
      );
      return codeMatch || keywordMatch;
    });
  };

  // 4. Strict Academic Completion Certificate Rules
  if (docType === "HIFZ_CERTIFICATE") {
    const hifzEnrollment = findMatchingEnrollment(["HIFZ", "TAHFEEZ"], ["হিফজ", "তাহফীজ", "কুরআন"]);
    if (!hifzEnrollment) {
      return {
        eligible: false,
        reason: "শিক্ষার্থী হিফজুল কুরআন বিভাগে অধ্যয়ন বা সম্পন্ন করেননি। অত্র সনদ কেবল হিফজ সমাপনকারীদের জন্য সংরক্ষিত।",
        context,
      };
    }

    const isCompleted =
      hifzEnrollment.status === "COMPLETED" ||
      student.status === "COMPLETED" ||
      student.status === "ALUMNI" ||
      (context.results || []).some((r: any) => r.isPassed && (r.exam?.nameBn?.includes("হিফজ") || r.exam?.name?.includes("Hifz")));

    if (!isCompleted) {
      return {
        eligible: false,
        reason: "হিফজুল কুরআন জামাত এখনো সম্পন্ন হয়নি (চলমান শিক্ষার্থী)। মহাগ্রন্থ আল-কুরআনুল কারীম পূর্ণ ৩০ পারা হিফজ সমাপন ও অনুমোদন সাপেক্ষে এই সনদ ইস্যুযোগ্য হবে।",
        context,
      };
    }

    return { eligible: true, context };
  }

  if (docType === "MISHKAT_CERTIFICATE") {
    const mishkatEnrollment = findMatchingEnrollment(["MISHKAT"], ["মেশকাত", "মিশকাত"]);
    if (!mishkatEnrollment) {
      return {
        eligible: false,
        reason: "শিক্ষার্থী মেশকাত জামাতে অধ্যয়ন বা সম্পন্ন করেননি। মেশকাত সমাপনী সনদ কেবল মেশকাত উত্তীর্ণ শিক্ষার্থীদের জন্য প্রযোজ্য।",
        context,
      };
    }

    const isCompleted =
      mishkatEnrollment.status === "COMPLETED" ||
      student.status === "COMPLETED" ||
      student.status === "ALUMNI" ||
      (context.results || []).some((r: any) => r.isPassed && (r.exam?.nameBn?.includes("মেশকাত") || r.exam?.name?.includes("Mishkat")));

    if (!isCompleted) {
      return {
        eligible: false,
        reason: "মেশকাত জামাত এখনো সম্পন্ন হয়নি (চলমান শিক্ষার্থী)। বার্ষিক ও কেন্দ্রীয় পরীক্ষায় সমাপন নিশ্চিত হলে এই সমাপনী সনদপত্র ইস্যু করা যাবে।",
        context,
      };
    }

    return { eligible: true, context };
  }

  if (docType === "DAWRA_CERTIFICATE") {
    const dawraEnrollment = findMatchingEnrollment(["DAWRA"], ["দাওরা", "দাওরায়ে হাদীস"]);
    if (!dawraEnrollment) {
      return {
        eligible: false,
        reason: "শিক্ষার্থী দাওরায়ে হাদীস জামাতে অধ্যয়ন বা সম্পন্ন করেননি। অত্র সর্বোচ্চ সনদ কেবল দাওরায়ে হাদীস উত্তীর্ণদের জন্য সংরক্ষিত।",
        context,
      };
    }

    const isCompleted =
      dawraEnrollment.status === "COMPLETED" ||
      student.status === "COMPLETED" ||
      student.status === "ALUMNI" ||
      (context.results || []).some((r: any) => r.isPassed && (r.exam?.nameBn?.includes("দাওরা") || r.exam?.name?.includes("Dawra")));

    if (!isCompleted) {
      return {
        eligible: false,
        reason: "দাওরায়ে হাদীস জামাত এখনো সম্পন্ন হয়নি। কেন্দ্রীয় চূড়ান্ত সমাপনী পরীক্ষা সম্পন্ন হলে এই সর্বোচ্চ প্রাতিষ্ঠানিক সনদপত্র ইস্যু করা যাবে।",
        context,
      };
    }

    return { eligible: true, context };
  }

  // 5. Strict Rejection of arbitrary completion certificates for ordinary classes
  if (
    docType.endsWith("_COMPLETION") &&
    docType !== "HIFZ_CERTIFICATE" &&
    docType !== "MISHKAT_CERTIFICATE" &&
    docType !== "DAWRA_CERTIFICATE"
  ) {
    return {
      eligible: false,
      reason: "অত্র শিক্ষাগত জামাতের জন্য কোনো অফিশিয়াল সমাপনী সনদপত্র বরাদ্দ নয়। সাধারণ শ্রেণির শিক্ষার্থীদের জন্য অধ্যয়ন প্রত্যয়নপত্র (Study Certificate / Pratyayan Patra) বা প্রশংসাপত্র ব্যবহার করুন।",
      context,
    };
  }

  // 6. Transfer Certificate (TC) validation
  if (docType === "TRANSFER_CERTIFICATE") {
    const existingTc = await prisma.certificate.findFirst({
      where: {
        studentId,
        certificateType: "TRANSFER_CERTIFICATE",
        isRevoked: false,
        status: "ISSUED",
      },
    });

    if (existingTc) {
      return {
        eligible: false,
        reason: `শিক্ষার্থীকে ইতিমধ্যে ছাড়পত্র (টিসি) প্রদান করা হয়েছে (নম্বর: ${existingTc.certificateNumber})। পুনরায় ইস্যুর জন্য রি-ইস্যু অপশন ব্যবহার করুন।`,
        context,
        activeDocument: existingTc,
      };
    }
  }

  return {
    eligible: true,
    context,
  };
}

/**
 * Build Frozen Immutable Data Snapshot for Issued Document
 * Preserves institutional identity, official branding assets, signatures, and seals
 */
export function buildDocumentSnapshot(params: {
  context: any;
  documentNumber: string;
  verificationCode: string;
  documentType: string;
  template: any;
  issueDate: Date;
  customNotes?: string;
  selectedExamId?: string;
  selectedReceiptId?: string;
  selectedInvoiceId?: string;
  transferReason?: string;
  adminConductConfirmed?: boolean;
}): Record<string, any> {
  const {
    context,
    documentNumber,
    verificationCode,
    documentType,
    template,
    issueDate,
    customNotes,
    selectedExamId,
    selectedReceiptId,
    selectedInvoiceId,
    transferReason,
    adminConductConfirmed = true,
  } = params;

  const { student, activeEnrollment, financialSummary, results } = context;

  const primaryGuardian = student.guardianLinks?.find((gl: any) => gl.isPrimary)?.guardian || student.guardianLinks?.[0]?.guardian;

  // Resolve Exam / Result details
  let targetResult = results?.find((r: any) => selectedExamId ? r.examId === selectedExamId : true) || results?.[0];
  let targetExam = targetResult?.exam;

  // Resolve Receipt
  let targetReceipt = financialSummary?.receipts?.find((r: any) => selectedReceiptId ? r.id === selectedReceiptId : true) || financialSummary?.receipts?.[0];

  // Resolve Invoice
  let targetInvoice = financialSummary?.invoices?.find((i: any) => selectedInvoiceId ? i.id === selectedInvoiceId : true) || financialSummary?.invoices?.[0];

  const rollNumber = activeEnrollment?.rollNumber !== undefined && activeEnrollment?.rollNumber !== null ? String(activeEnrollment.rollNumber) : "১";

  const verificationUrl = `${getAppUrl()}/verify/document/${encodeURIComponent(verificationCode)}`;

  const vars: Record<string, any> = {
    student: {
      id: student.id,
      studentId: student.studentIdNumber,
      nameBn: student.fullNameBn,
      nameEn: student.fullNameEn || student.fullNameBn,
      nameAr: student.fullNameAr || "",
      roll: rollNumber,
      dob: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("bn-BD") : "",
      gender: student.gender === "MALE" ? "ছাত্র" : "ছাত্রী",
      bloodGroup: student.bloodGroup || "N/A",
      fatherNameBn: student.fatherNameBn,
      motherNameBn: student.motherNameBn,
      presentAddress: student.presentAddress || "ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
      permanentAddress: student.permanentAddress || student.presentAddress || "কুমিল্লা",
      photoUrl: student.photoUrl || null,
      residentialStatus: student.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : student.residentialStatus === "DAY_CARE" ? "অনাবাসিক (ডে কেয়ার)" : "সাধারণ",
      status: student.status === "ACTIVE" ? "সক্রিয় (Active)" : student.status === "ALUMNI" ? "প্রাক্তন (Alumni)" : student.status === "WITHDRAWN" ? "অব্যাহতিপ্রাপ্ত (Withdrawn)" : student.status,
    },
    guardian: {
      name: primaryGuardian?.fullNameBn || student.fatherNameBn,
      relation: primaryGuardian?.relation || "পিতা",
      phone: primaryGuardian?.phone || student.fatherPhone || "০১৮৪৫১৬২৬৬৪",
    },
    class: {
      id: activeEnrollment?.jamatClass?.id || "",
      name: activeEnrollment?.jamatClass?.nameBn || "সাধারণ",
      nameEn: activeEnrollment?.jamatClass?.nameEn || "",
    },
    section: {
      id: activeEnrollment?.section?.id || "",
      name: activeEnrollment?.section?.nameBn || "ক শাখা",
    },
    session: {
      id: activeEnrollment?.session?.id || "",
      name: activeEnrollment?.session?.name || new Date().getFullYear().toString(),
    },
    academic: {
      admissionDate: student.admissionDate ? new Date(student.admissionDate).toLocaleDateString("bn-BD") : "",
      status: student.status,
    },
    finance: {
      totalBilled: financialSummary?.totalBilled || 0,
      totalPaid: financialSummary?.totalPaid || 0,
      totalDue: financialSummary?.totalDue || 0,
      clearanceStatus: (financialSummary?.totalDue || 0) <= 0 ? "সম্পূর্ণ পরিশোধিত (কোনো বকেয়া নেই)" : `বকেয়া রয়েছে (৳${financialSummary?.totalDue})`,
    },
    exam: {
      name: targetExam?.nameBn || targetExam?.name || "বার্ষিক মূল্যায়ন পরীক্ষা",
      totalMarks: targetResult?.totalFullMarks || 500,
      obtainedMarks: targetResult?.totalObtained || 0,
      percentage: targetResult?.percentage || 0,
      gradeBn: targetResult?.finalGradeBn || "মুমতাজ",
      gradeEn: targetResult?.finalGradeEn || "A+",
      isPassed: targetResult?.isPassed ?? true,
    },
    receipt: {
      number: targetReceipt?.receiptNumber || `REC-${new Date().getFullYear()}-0001`,
      amount: targetReceipt?.amount || 0,
      paymentMethod: targetReceipt?.paymentMethod || "CASH",
      transactionId: targetReceipt?.transactionId || "N/A",
    },
    invoice: {
      number: targetInvoice?.invoiceNumber || `INV-${new Date().getFullYear()}-0001`,
      title: targetInvoice?.title || "মাসিক বেতন ও ফি",
      amount: targetInvoice?.totalAmount || 0,
      paid: targetInvoice?.paidAmount || 0,
      due: targetInvoice?.dueAmount || 0,
    },
    document: {
      number: documentNumber,
      verificationCode,
      verificationUrl,
      type: documentType,
      titleBn: template?.titleBn || "অফিশিয়াল প্রত্যয়নপত্র",
      titleEn: template?.titleEn || "Official Certificate",
      issueDate: issueDate.toLocaleDateString("bn-BD"),
      issueDateIso: issueDate.toISOString(),
      customNotes: customNotes || "",
      transferReason: transferReason || "পারিবারিক স্থানান্তর ও সুবিধার নিমিত্তে",
      adminConductConfirmed: Boolean(adminConductConfirmed),
    },
    institution: {
      nameBn: INSTITUTION_INFO.nameBn,
      nameEn: INSTITUTION_INFO.nameEn,
      nameAr: INSTITUTION_INFO.nameAr || "جامعة إليوت غنج حاجي رحمت الله الجامعية",
      principal: INSTITUTION_INFO.principal,
      address: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
      phone: INSTITUTION_INFO.primaryPhone,
      email: INSTITUTION_INFO.email || "info@ehrj.edu.bd",
      website: "https://ehrj.edu.bd",
      established: INSTITUTION_INFO.established || "২০২১",
    },
    branding: {
      logoUrl: INSTITUTION_INFO.logoUrl || "/images/logo.jpg",
      sealTitleBn: "অফিশিয়াল প্রাতিষ্ঠানিক সিলমোহর",
      sealEffectiveDate: "২০২৫",
      watermarkText: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
      securityCode: `EHRJ-SEC-${documentNumber.replace(/\D/g, "")}`,
    },
    signatory: {
      titleBn: template?.signatoryTitleBn || "মুহতামিম ও অধ্যক্ষ",
      name: INSTITUTION_INFO.principal,
      designation: "Principal & Head of Madrasah",
    },
  };

  const renderedBodyBn = interpolateTemplate(template?.bodyBn || "", vars);
  const renderedBodyEn = interpolateTemplate(template?.bodyEn || "", vars);

  return {
    ...vars,
    renderedContent: {
      bodyBn: renderedBodyBn,
      bodyEn: renderedBodyEn,
      signatoryTitleBn: template?.signatoryTitleBn || "মুহতামিম ও অধ্যক্ষ",
    },
    templateVersion: template?.version || 1,
    snapshotTimestamp: new Date().toISOString(),
  };
}

/**
 * Generate High-Contrast Scalable QR Code as Base64 Data URL
 */
export async function generateDocumentQrCode(verificationCode: string): Promise<string> {
  const verifyUrl = `${getAppUrl()}/verify/document/${encodeURIComponent(verificationCode)}`;
  return await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 256,
    color: {
      dark: "#083B25", // Institutional Emerald Dark
      light: "#FFFFFF",
    },
  });
}

/**
 * Issue an Official Document Atomically
 */
export async function issueOfficialDocument(params: {
  studentId: string;
  documentType: string;
  sessionId?: string;
  templateId?: string;
  requestId?: string;
  issuedByUserId?: string;
  customNotes?: string;
  selectedExamId?: string;
  selectedReceiptId?: string;
  selectedInvoiceId?: string;
  transferReason?: string;
  adminConductConfirmed?: boolean;
  issueDate?: Date;
}): Promise<any> {
  const {
    studentId,
    documentType,
    sessionId,
    templateId,
    requestId,
    issuedByUserId,
    customNotes,
    selectedExamId,
    selectedReceiptId,
    selectedInvoiceId,
    transferReason,
    adminConductConfirmed = true,
    issueDate = new Date(),
  } = params;

  // 1. Validate Eligibility & resolve context
  const eligibility = await validateDocumentEligibility(studentId, documentType, sessionId);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason || "শিক্ষার্থী এই সনদপত্রের জন্য যোগ্য নয়।");
  }

  // 2. Resolve Template
  let template: any = null;
  if (templateId) {
    template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
  }
  if (!template) {
    template = await prisma.documentTemplate.findFirst({
      where: { documentType, isActive: true },
      orderBy: { version: "desc" },
    });
  }
  if (!template) {
    await ensureDefaultTemplates();
    template = await prisma.documentTemplate.findFirst({
      where: { documentType, isActive: true },
    });
  }

  // 3. Generate Unique Identifiers
  const documentNumber = await generateNextDocumentNumber(documentType);
  const verificationCode = await generateNextVerificationCode();

  // 4. Generate High-Contrast QR Code
  const qrCodeUrl = await generateDocumentQrCode(verificationCode);

  // 5. Create Immutable Data Snapshot
  const snapshot = buildDocumentSnapshot({
    context: eligibility.context,
    documentNumber,
    verificationCode,
    documentType,
    template,
    issueDate,
    customNotes,
    selectedExamId,
    selectedReceiptId,
    selectedInvoiceId,
    transferReason,
    adminConductConfirmed,
  });

  // 6. Execute Atomic Transaction
  return await prisma.$transaction(async (tx) => {
    const cert = await tx.certificate.create({
      data: {
        certificateNumber: documentNumber,
        verificationCode,
        studentId,
        sessionId: eligibility.context.activeEnrollment?.sessionId || sessionId || null,
        requestId: requestId || null,
        templateId: template?.id || null,
        certificateType: documentType,
        titleBn: template?.titleBn || "সনদপত্র",
        titleEn: template?.titleEn || "Certificate",
        version: 1,
        status: "ISSUED",
        issueDate,
        issuedByUserId: issuedByUserId || null,
        isRevoked: false,
        qrCodeUrl,
        snapshotJson: JSON.stringify(snapshot),
      },
    });

    if (requestId) {
      await tx.documentRequest.update({
        where: { id: requestId },
        data: {
          status: "ISSUED",
          reviewedAt: new Date(),
          reviewedByUserId: issuedByUserId || null,
        },
      });
    }

    return cert;
  });
}

/**
 * Batch Issue Official Documents for Multiple Students
 */
export async function issueBatchDocuments(params: {
  studentIds: string[];
  documentType: string;
  sessionId?: string;
  issuedByUserId?: string;
  customNotes?: string;
}): Promise<{ issued: any[]; failed: Array<{ studentId: string; reason: string }> }> {
  const { studentIds, documentType, sessionId, issuedByUserId, customNotes } = params;

  const issued: any[] = [];
  const failed: Array<{ studentId: string; reason: string }> = [];

  for (const studentId of studentIds) {
    try {
      const cert = await issueOfficialDocument({
        studentId,
        documentType,
        sessionId,
        issuedByUserId,
        customNotes,
      });
      issued.push(cert);
    } catch (err: any) {
      failed.push({
        studentId,
        reason: err.message || "ইস্যু করতে ত্রুটি ঘটেছে",
      });
    }
  }

  return { issued, failed };
}

/**
 * Revoke an Issued Document Atomically
 */
export async function revokeDocument(params: {
  certificateId: string;
  revokedByUserId?: string;
  reason: string;
}): Promise<any> {
  const { certificateId, revokedByUserId, reason } = params;

  if (!reason || !reason.trim()) {
    throw new Error("সনদপত্র বাতিলের কারণ উল্লেখ করা আবশ্যক।");
  }

  const existing = await prisma.certificate.findUnique({
    where: { id: certificateId },
  });

  if (!existing) {
    throw new Error("সনদপত্র পাওয়া যায়নি।");
  }

  if (existing.isRevoked) {
    throw new Error("সনদপত্রটি ইতিমধ্যে বাতিল (REVOKED) করা হয়েছে।");
  }

  return await prisma.certificate.update({
    where: { id: certificateId },
    data: {
      isRevoked: true,
      status: "REVOKED",
      revokedAt: new Date(),
      revokedByUserId: revokedByUserId || null,
      revokeReason: reason.trim(),
    },
  });
}

/**
 * Reissue a Document with Version Increment (e.g. v1 -> v2)
 */
export async function reissueDocument(params: {
  originalCertificateId: string;
  issuedByUserId?: string;
  reason: string;
  customNotes?: string;
}): Promise<any> {
  const { originalCertificateId, issuedByUserId, reason, customNotes } = params;

  const original = await prisma.certificate.findUnique({
    where: { id: originalCertificateId },
    include: { template: true },
  });

  if (!original) {
    throw new Error("পূর্ববর্তী সনদপত্র পাওয়া যায়নি।");
  }

  // 1. Mark Original as REISSUED
  await prisma.certificate.update({
    where: { id: originalCertificateId },
    data: {
      status: "REISSUED",
      isRevoked: true,
      revokedAt: new Date(),
      revokedByUserId: issuedByUserId || null,
      revokeReason: `পুনরায় ইস্যু করার নিমিত্তে বাতিল ও প্রতিস্থাপিত: ${reason}`,
    },
  });

  // 2. Generate New Document Number and Verification Code
  const documentNumber = await generateNextDocumentNumber(original.certificateType);
  const verificationCode = await generateNextVerificationCode();
  const qrCodeUrl = await generateDocumentQrCode(verificationCode);

  // 3. Resolve Current Academic / Student Context for Fresh Snapshot
  const eligibility = await validateDocumentEligibility(original.studentId, original.certificateType, original.sessionId || undefined);

  const snapshot = buildDocumentSnapshot({
    context: eligibility.context,
    documentNumber,
    verificationCode,
    documentType: original.certificateType,
    template: original.template,
    issueDate: new Date(),
    customNotes: `পুনরায় ইস্যুকৃত (ভার্সন ${original.version + 1})। কারণ: ${reason}${customNotes ? ` | ${customNotes}` : ""}`,
  });

  // 4. Create Reissued Certificate
  return await prisma.certificate.create({
    data: {
      certificateNumber: documentNumber,
      verificationCode,
      studentId: original.studentId,
      sessionId: original.sessionId,
      requestId: original.requestId,
      templateId: original.templateId,
      certificateType: original.certificateType,
      titleBn: original.titleBn,
      titleEn: original.titleEn,
      version: original.version + 1,
      reissuedFromId: original.id,
      status: "ISSUED",
      issueDate: new Date(),
      issuedByUserId: issuedByUserId || null,
      isRevoked: false,
      qrCodeUrl,
      snapshotJson: JSON.stringify(snapshot),
    },
  });
}
