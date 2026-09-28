import { prisma } from "./prisma";
import { sendInstitutionalEmail } from "./mail";
import { recordAuditLog } from "./security";
import { INSTITUTION_INFO } from "./constants";

// =================================================================
// 1. DEFAULT NOTIFICATION TEMPLATES DEFINITIONS
// =================================================================

export const DEFAULT_NOTIFICATION_TEMPLATES = [
  {
    code: "ADMISSION_SUBMITTED",
    nameBn: "ভর্তি আবেদন জমা নিশ্চিতকরণ",
    category: "ADMISSION",
    subjectTemplateBn: "ভর্তি আবেদন গৃহীত হয়েছে - ট্র্যাকিং নম্বর: {{application.trackingId}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আপনার সন্তান {{student.nameBn}}-এর ভর্তি আবেদন সফলভাবে গৃহীত হয়েছে। মাদরাসা কর্তৃপক্ষ যাচাইপূর্বক পরবর্তী ধাপ অবহিত করবে।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "ADMISSION_APPROVED",
    nameBn: "ভর্তি অনুমোদন ও স্থায়ী ছাত্র আইডি",
    category: "ADMISSION",
    subjectTemplateBn: "মোবারকবাদ! ভর্তি অনুমোদন ও স্থায়ী ছাত্র আইডি - {{student.studentId}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আলহামদুলিল্লাহ আপনার সন্তান {{student.nameBn}}-এর ভর্তি আবেদন অনুমোদিত হয়েছে। স্থায়ী ছাত্র আইডি: {{student.studentId}}, জামাত: {{class.name}}, রোল: {{roll}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "ADMISSION_REJECTED",
    nameBn: "ভর্তি আবেদন সংক্রান্ত সিদ্ধান্ত",
    category: "ADMISSION",
    subjectTemplateBn: "ভর্তি আবেদন সংক্রান্ত প্রাতিষ্ঠানিক তথ্য - {{application.trackingId}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আপনার দাখিলকৃত আবেদন (নম্বর: {{application.trackingId}}) আসন সীমাবদ্ধতা বা শর্তাবলীর কারণে আপাতত অনুমোদন করা সম্ভব হয়নি।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "INVOICE_CREATED",
    nameBn: "নতুন মাসিক/সেশন ফি ইনভয়েস জারি",
    category: "FINANCE",
    subjectTemplateBn: "ফি ইনভয়েস জারি - {{invoice.number}} (টাকা: {{invoice.amount}})",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, শিক্ষার্থী {{student.nameBn}}-এর নতুন ফি ইনভয়েস ({{invoice.number}}) তৈরি হয়েছে। মোট প্রদেয়: ৳{{invoice.amount}}। নির্ধারিত সময়ের মধ্যে পরিশোধের অনুরোধ করা হলো।",
    channels: "PORTAL,EMAIL",
    isMandatory: false,
  },
  {
    code: "PAYMENT_SUCCESSFUL",
    nameBn: "ফি পরিশোধ প্রাপ্তি রশিদ",
    category: "FINANCE",
    subjectTemplateBn: "ফি পরিশোধ সফল হয়েছে - রশিদ নম্বর: {{receipt.number}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, শিক্ষার্থী {{student.nameBn}}-এর জন্য ৳{{payment.amount}} টাকা পরিশোধ সফলভাবে গৃহীত হয়েছে। রশিদ নম্বর: {{receipt.number}}। জাযাকুমুল্লাহু খাইরান।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "PAYMENT_FAILED",
    nameBn: "ফি পরিশোধ ব্যর্থতার সতর্কতা",
    category: "FINANCE",
    subjectTemplateBn: "ফি পরিশোধ ব্যর্থ হয়েছে - ইনভয়েস: {{invoice.number}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, শিক্ষার্থী {{student.nameBn}}-এর ইনভয়েস {{invoice.number}}-এর পেমেন্ট প্রক্রিয়া সম্পন্ন হতে পারেনি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "REFUND_PROCESSED",
    nameBn: "ফি রিফান্ড সংক্রান্ত নোটিফিকেশন",
    category: "FINANCE",
    subjectTemplateBn: "ফি রিফান্ড কার্যকর হয়েছে - ভাউচার: {{refund.number}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, শিক্ষার্থী {{student.nameBn}}-এর ইনভয়েসের বিপরীতে ৳{{refund.amount}} টাকা রিফান্ড মঞ্জুর করা হয়েছে। রিফান্ড ভাউচার: {{refund.number}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "DOCUMENT_REQUEST_SUBMITTED",
    nameBn: "সনদপত্র/ডকুমেন্ট আবেদন নিশ্চিতকরণ",
    category: "DOCUMENT",
    subjectTemplateBn: "সনদপত্রের আবেদন দাখিল - রিকুয়েস্ট নম্বর: {{request.number}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, শিক্ষার্থী {{student.nameBn}}-এর জন্য {{document.type}} সংগ্রহের আবেদন দাখিল হয়েছে (নম্বর: {{request.number}})। প্রশাসনিক যাচাই শেষে অবহিত করা হবে।",
    channels: "PORTAL,EMAIL",
    isMandatory: false,
  },
  {
    code: "DOCUMENT_APPROVED",
    nameBn: "সনদপত্র আবেদন অনুমোদিত",
    category: "DOCUMENT",
    subjectTemplateBn: "সনদপত্র আবেদন অনুমোদিত হয়েছে - {{request.number}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আপনার সন্তানের জন্য দাখিলকৃত {{document.type}} আবেদন অনুমোদিত হয়েছে। সনদপত্র প্রস্তুত করা হচ্ছে।",
    channels: "PORTAL,EMAIL",
    isMandatory: false,
  },
  {
    code: "DOCUMENT_ISSUED",
    nameBn: "সনদপত্র প্রস্তুত ও ডাউনলোড লিংক",
    category: "DOCUMENT",
    subjectTemplateBn: "অফিসিয়াল সনদপত্র প্রস্তুত হয়েছে - নম্বর: {{document.number}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, শিক্ষার্থী {{student.nameBn}}-এর অফিশিয়াল {{document.type}} (নম্বর: {{document.number}}) সফলভাবে ইস্যু করা হয়েছে। অভিভাবক পোর্টাল থেকে ডিজিটাল কপি ডাউনলোড ও কিউআর যাচাই করতে পারবেন।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "DOCUMENT_REVOKED",
    nameBn: "সনদপত্র বাতিলের বিজ্ঞপ্তি",
    category: "DOCUMENT",
    subjectTemplateBn: "জরুরি: সনদপত্র বাতিল করা হয়েছে - নম্বর: {{document.number}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, শিক্ষার্থী {{student.nameBn}}-এর পূর্বে ইস্যুকৃত {{document.type}} (নম্বর: {{document.number}}) প্রাতিষ্ঠানিক কারণে বাতিল করা হয়েছে।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "ATTENDANCE_ABSENT_ALERT",
    nameBn: "শিক্ষার্থী অনুপস্থিতির সতর্কবার্তা",
    category: "ATTENDANCE",
    subjectTemplateBn: "দৈনিক উপস্থিতি নোটিশ: শিক্ষার্থী আজ অনুপস্থিত - {{attendance.date}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আপনার সন্তান {{student.nameBn}} (জামাত: {{class.name}}, রোল: {{roll}}) আজ {{attendance.date}} তারিখে মাদরাসায় অনুপস্থিত রয়েছে। কোনো জরুরি প্রয়োজনে মাদরাসা অফিসে যোগাযোগ করুন।",
    channels: "PORTAL,EMAIL",
    isMandatory: false,
  },
  {
    code: "EXAM_SCHEDULED",
    nameBn: "পরীক্ষার রুটিন ও সময়সূচি ঘোষণা",
    category: "EXAM",
    subjectTemplateBn: "পরীক্ষার সময়সূচি ঘোষণা: {{exam.name}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আগামী {{exam.startDate}} তারিখ থেকে {{exam.name}} শুরু হতে যাচ্ছে। বিস্তারিত সময়সূচি ও রুটিন শিক্ষার্থী পোর্টালে প্রকাশ করা হয়েছে।",
    channels: "PORTAL,EMAIL",
    isMandatory: false,
  },
  {
    code: "RESULT_PUBLISHED",
    nameBn: "পরীক্ষার ফলাফল ও মেধা তালিকা প্রকাশ",
    category: "EXAM",
    subjectTemplateBn: "পরীক্ষার ফলাফল প্রকাশিত হয়েছে - {{exam.name}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আলহামদুলিল্লাহ {{exam.name}}-এর চূড়ান্ত ফলাফল প্রকাশিত হয়েছে। শিক্ষার্থী {{student.nameBn}} (রোল: {{roll}})-এর ফলাফল ও মার্কশিট অনলাইন রেজাল্ট পোর্টালে সরাসরি দেখা যাবে।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "OFFICIAL_NOTICE_ANNOUNCEMENT",
    nameBn: "প্রাতিষ্ঠানিক জরুরি বিজ্ঞপ্তি",
    category: "OFFICIAL_NOTICE",
    subjectTemplateBn: "মাদরাসা নোটিশ: {{notice.title}}",
    bodyTemplateBn: "মুহতারাম সংশ্লিষ্ট, ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার পক্ষ থেকে একটি নতুন বিজ্ঞপ্তি প্রকাশিত হয়েছে: \"{{notice.title}}\"। বিস্তারিত পড়তে পোর্টাল ভিজিট করুন।",
    channels: "PORTAL,EMAIL",
    isMandatory: false,
  },
  {
    code: "SECURITY_ALERT",
    nameBn: "অ্যাকাউন্ট সিকিউরিটি অ্যালার্ট",
    category: "SYSTEM",
    subjectTemplateBn: "সিকিউরিটি অ্যালার্ট: অ্যাকাউন্টে নতুন লগইন / পাসওয়ার্ড পরিবর্তন",
    bodyTemplateBn: "সম্মানিত ব্যবহারকারী, আপনার ডিজিটাল ক্যাম্পাস অ্যাকাউন্টে সম্প্রতি একটি গুরুত্বপূর্ণ নিরাপত্তা ঘটনা পরিলক্ষিত হয়েছে। আপনি নিজে না করে থাকলে অনতিবিলম্বে মাদরাসা আইটি বিভাগে জানান।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "LIBRARY_BOOK_ISSUED",
    nameBn: "বই ইস্যু নিশ্চিতকরণ",
    category: "LIBRARY",
    subjectTemplateBn: "লাইব্রেরি বই ইস্যু নিশ্চিতকরণ - {{book.title}}",
    bodyTemplateBn: "মুহতারাম {{recipient.name}}, লাইব্রেরি থেকে '{{book.title}}' (কপি নং: {{copy.accessionNo}}) সফলভাবে ইস্যু করা হয়েছে। নির্ধারিত ফেরত তারিখ: {{issue.dueDate}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: false,
  },
  {
    code: "LIBRARY_DUE_SOON",
    nameBn: "বই ফেরত দেওয়ার আগাম তাগিদ",
    category: "LIBRARY",
    subjectTemplateBn: "বই ফেরতের নির্ধারিত মেয়াদ ঘনিয়ে এসেছে - {{book.title}}",
    bodyTemplateBn: "মুহতারাম {{recipient.name}}, লাইব্রেরি থেকে ইস্যুকৃত '{{book.title}}' বইটির মেয়াদ আগামী {{issue.dueDate}} তারিখে সমাপ্ত হবে। অনুগ্রহ করে যথাসময়ে বইটি ফেরত বা নবায়ন করুন।",
    channels: "PORTAL,EMAIL",
    isMandatory: false,
  },
  {
    code: "LIBRARY_BOOK_OVERDUE",
    nameBn: "বই ফেরত বিলম্ব ও জরিমানার নোটিশ",
    category: "LIBRARY",
    subjectTemplateBn: "জরুরি: লাইব্রেরি বই ফেরত বিলম্বিত - {{book.title}}",
    bodyTemplateBn: "মুহতারাম {{recipient.name}}, আপনার কাছে ইস্যুকৃত '{{book.title}}' বইটির নির্ধারিত মেয়াদ উত্তীর্ণ হয়েছে। দৈনিক জরিমানা পরিহার করতে অনতিবিলম্বে বইটি ফেরত দিন।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "LIBRARY_BOOK_RETURNED",
    nameBn: "বই ফেরত প্রাপ্তি রসিদ",
    category: "LIBRARY",
    subjectTemplateBn: "বই ফেরত গৃহীত হয়েছে - {{book.title}}",
    bodyTemplateBn: "মুহতারাম {{recipient.name}}, লাইব্রেরি বই '{{book.title}}' (কপি নং: {{copy.accessionNo}}) সফলভাবে ফেরত গৃহীত হয়েছে। জাযাকুমুল্লাহু খাইরান।",
    channels: "PORTAL,EMAIL",
    isMandatory: false,
  },
  {
    code: "LIBRARY_FINE_ASSESSED",
    nameBn: "লাইব্রেরি জরিমানা নোটিশ",
    category: "LIBRARY",
    subjectTemplateBn: "লাইব্রেরি জরিমানা ধার্য - ইনভয়েস: {{invoice.number}}",
    bodyTemplateBn: "মুহতারাম {{recipient.name}}, '{{book.title}}' বইটির বিলম্বে ফেরত/ক্ষতিপূরণ বাবদ ৳{{fine.amount}} টাকা জরিমানা ধার্য করা হয়েছে। ইনভয়েস নম্বর: {{invoice.number}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "LIBRARY_BOOK_LOST",
    nameBn: "বই হারানো ও প্রতিস্থাপন মূল্য চার্জ",
    category: "LIBRARY",
    subjectTemplateBn: "লাইব্রেরি বই প্রতিস্থাপন মূল্য নির্ধারণ - {{book.title}}",
    bodyTemplateBn: "মুহতারাম {{recipient.name}}, ইস্যুকৃত '{{book.title}}' বইটি হারানো ঘোষণা করা হয়েছে। মাদরাসা নীতি অনুযায়ী প্রতিস্থাপন মূল্য বাবদ ৳{{charge.amount}} টাকা নির্ধারিত হয়েছে।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "RESIDENTIAL_ADMISSION_APPROVED",
    nameBn: "আবাসিক ভর্তি অনুমোদন",
    category: "HOSTEL",
    subjectTemplateBn: "আবাসিক সিট অনুমোদন - {{student.nameBn}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আপনার সন্তান {{student.nameBn}} (আইডি: {{student.studentId}})-এর আবাসিক হোস্টেল ভর্তি সফলভাবে অনুমোদিত হয়েছে। নির্ধারিত তারিখে চেক-ইন সম্পন্ন করার অনুরোধ করা হলো।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "RESIDENTIAL_CHECKIN_COMPLETED",
    nameBn: "হোস্টেল চেক-ইন সম্পন্ন",
    category: "HOSTEL",
    subjectTemplateBn: "হোস্টেল চেক-ইন নিশ্চিতকরণ - {{student.nameBn}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আলহামদুলিল্লাহ আপনার সন্তান {{student.nameBn}} মাদরাসার আবাসিক হোস্টেলে সফলভাবে চেক-ইন করেছে। কার্যকর তারিখ: {{effectiveDate}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "RESIDENTIAL_CHECKOUT_COMPLETED",
    nameBn: "হোস্টেল চেক-আউট সম্পন্ন",
    category: "HOSTEL",
    subjectTemplateBn: "হোস্টেল চেক-আউট নিশ্চিতকরণ - {{student.nameBn}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আপনার সন্তান {{student.nameBn}}-এর আবাসিক হোস্টেল চেক-আউট সম্পন্ন হয়েছে। কারণ: {{reason}}। ভবিষ্যতের জন্য শুভকামনা।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "RESIDENTIAL_STATUS_CHANGED",
    nameBn: "আবাসিক স্ট্যাটাস পরিবর্তন",
    category: "HOSTEL",
    subjectTemplateBn: "আবাসিক মর্যাদা পরিবর্তন - {{student.nameBn}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, শিক্ষার্থী {{student.nameBn}}-এর আবাসিক মর্যাদা '{{previousStatus}}' থেকে পরিবর্তিত হয়ে '{{newStatus}}' করা হয়েছে। কার্যকর তারিখ: {{effectiveDate}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "RESIDENTIAL_REQUEST_SUBMITTED",
    nameBn: "আবাসিক আবেদন জমা",
    category: "HOSTEL",
    subjectTemplateBn: "আবাসিক আবেদন গৃহীত হয়েছে - ট্র্যাকিং: {{request.number}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আপনার সন্তানের আবাসিক সংক্রান্ত আবেদন (নম্বর: {{request.number}}) সফলভাবে গৃহীত হয়েছে। কর্তৃপক্ষ পর্যালোচনা করে সিদ্ধান্ত জানাবে।",
    channels: "PORTAL,EMAIL",
    isMandatory: false,
  },
  {
    code: "RESIDENTIAL_REQUEST_REJECTED",
    nameBn: "আবাসিক আবেদন সংক্রান্ত সিদ্ধান্ত",
    category: "HOSTEL",
    subjectTemplateBn: "আবাসিক আবেদন সংক্রান্ত তথ্য - ট্র্যাকিং: {{request.number}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আপনার দাখিলকৃত আবেদন (নম্বর: {{request.number}}) আসন সীমাবদ্ধতা বা নিয়মানুযায়ী এই মুহূর্তে অনুমোদন করা সম্ভব হয়নি।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "TRANSPORT_REQUEST_SUBMITTED",
    nameBn: "পরিবহন আবেদন জমা",
    category: "TRANSPORT",
    subjectTemplateBn: "পরিবহন আবেদন গৃহীত হয়েছে - ট্র্যাকিং: {{request.number}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আপনার সন্তান {{student.nameBn}}-এর পরিবহন সংক্রান্ত আবেদন (নম্বর: {{request.number}}) সফলভাবে গৃহীত হয়েছে। মাদরাসা কর্তৃপক্ষ যাচাইপূর্বক সিদ্ধান্ত জানাবে।",
    channels: "PORTAL,EMAIL",
    isMandatory: false,
  },
  {
    code: "TRANSPORT_REQUEST_APPROVED",
    nameBn: "পরিবহন আবেদন অনুমোদন",
    category: "TRANSPORT",
    subjectTemplateBn: "মোবারকবাদ! পরিবহন সেবা অনুমোদিত - {{student.nameBn}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আপনার সন্তান {{student.nameBn}}-এর পরিবহন আবেদন অনুমোদিত হয়েছে। রুট: {{route.name}}, পিকআপ স্টপ: {{stop.name}}। কার্যকর তারিখ: {{effectiveDate}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "TRANSPORT_REQUEST_REJECTED",
    nameBn: "পরিবহন আবেদন সংক্রান্ত সিদ্ধান্ত",
    category: "TRANSPORT",
    subjectTemplateBn: "পরিবহন আবেদন সংক্রান্ত তথ্য - ট্র্যাকিং: {{request.number}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, আপনার দাখিলকৃত পরিবহন আবেদন (নম্বর: {{request.number}}) গাড়ির আসন সীমাবদ্ধতা বা শর্তাবলীর কারণে আপাতত অনুমোদন করা সম্ভব হয়নি। কারণ: {{reason}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "TRANSPORT_ENROLLMENT_ACTIVATED",
    nameBn: "পরিবহন সেবা সক্রিয়করণ",
    category: "TRANSPORT",
    subjectTemplateBn: "পরিবহন সেবা সফলভাবে সক্রিয় হয়েছে - {{student.nameBn}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, শিক্ষার্থী {{student.nameBn}}-এর পরিবহন সেবা সক্রিয় করা হয়েছে। রুট: {{route.name}}, নির্ধারিত পিকআপ: {{pickupTime}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "TRANSPORT_ROUTE_CHANGED",
    nameBn: "পরিবহন রুট/স্টপ পরিবর্তন নোটিশ",
    category: "TRANSPORT",
    subjectTemplateBn: "জরুরি: পরিবহন রুট বা স্টপ পরিবর্তন - {{student.nameBn}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, শিক্ষার্থী {{student.nameBn}}-এর পরিবহন রুট বা স্টপ সমন্বয় করা হয়েছে। নতুন রুট: {{route.name}}, স্টপ: {{stop.name}}। কার্যকর তারিখ: {{effectiveDate}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "TRANSPORT_ENROLLMENT_CANCELLED",
    nameBn: "পরিবহন সেবা বাতিলকরণ",
    category: "TRANSPORT",
    subjectTemplateBn: "পরিবহন সেবা বাতিল নিশ্চিতকরণ - {{student.nameBn}}",
    bodyTemplateBn: "মুহতারাম {{guardian.name}}, শিক্ষার্থী {{student.nameBn}}-এর পরিবহন সেবা বাতিল করা হয়েছে। কারণ: {{reason}}। পরবর্তী সেশন থেকে পরিবহন বিল বন্ধ থাকবে।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "INVENTORY_LOW_STOCK",
    nameBn: "মালামাল স্টক ঘাটতি সতর্কতা",
    category: "INVENTORY",
    subjectTemplateBn: "সতর্কতা: মালামালের স্টক ঘাটতি - {{item.nameBn}} ({{item.code}})",
    bodyTemplateBn: "প্রশাসনিক নোটিশ: '{{item.nameBn}}' পণ্যের মজুদ ন্যূনতম সীমায় নেমে এসেছে (বর্তমান মজুদ: {{currentStock}} {{unit}}, ন্যূনতম সীমা: {{minStock}} {{unit}})। দ্রুত রিঅর্ডার সম্পন্ন করার অনুরোধ করা হলো।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "PROCUREMENT_REQUEST_SUBMITTED",
    nameBn: "অভ্যন্তরীণ মালামাল ক্রয়ের আবেদন জমা",
    category: "PROCUREMENT",
    subjectTemplateBn: "ক্রয় আবেদন দাখিল - রিকুয়েস্ট নম্বর: {{request.number}}",
    bodyTemplateBn: "প্রশাসনিক দপ্তর: '{{request.title}}' সংক্রান্ত একটি নতুন অভ্যন্তরীণ ক্রয় আবেদন (নম্বর: {{request.number}}, আনুমানিক ব্যয়: ৳{{totalEstimated}}) দাখিল হয়েছে। পর্যালোচনার অনুরোধ করা হলো।",
    channels: "PORTAL,EMAIL",
    isMandatory: false,
  },
  {
    code: "PROCUREMENT_REQUEST_APPROVED",
    nameBn: "ক্রয় আবেদন অনুমোদন",
    category: "PROCUREMENT",
    subjectTemplateBn: "ক্রয় আবেদন অনুমোদিত হয়েছে - {{request.number}}",
    bodyTemplateBn: "দাখিলকৃত ক্রয় আবেদন (নম্বর: {{request.number}}, বিষয়: {{request.title}}) কর্তৃপক্ষ কর্তৃক অনুমোদিত হয়েছে। পারচেজ অর্ডার ইস্যুর প্রক্রিয়া শুরু করা যেতে পারে।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "PROCUREMENT_REQUEST_REJECTED",
    nameBn: "ক্রয় আবেদন সংক্রান্ত সিদ্ধান্ত",
    category: "PROCUREMENT",
    subjectTemplateBn: "ক্রয় আবেদন স্থগিত/প্রত্যাখ্যাত - {{request.number}}",
    bodyTemplateBn: "দাখিলকৃত ক্রয় আবেদন (নম্বর: {{request.number}}) বাজেট বা অগ্রাধিকার বিবেচনায় অনুমোদন করা হয়নি। মন্তব্য: {{reason}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "PROCUREMENT_GOODS_RECEIVED",
    nameBn: "ক্রয়কৃত মালামাল রিসিভ ও স্টক-ইন",
    category: "INVENTORY",
    subjectTemplateBn: "মালামাল রিসিভ সম্পন্ন - জিআরএন: {{grn.number}}",
    bodyTemplateBn: "পারচেজ অর্ডার {{po.number}}-এর বিপরীতে সরবরাহকারী '{{supplier.name}}' হতে মালামাল রিসিভ ও স্টোর '{{location.name}}'-এ সফলভাবে স্টক-ইন করা হয়েছে (জিআরএন: {{grn.number}})।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "ASSET_DAMAGED_OR_LOST",
    nameBn: "সম্পদ বা যন্ত্রাংশ ক্ষতি/মেরামত রিপোর্ট",
    category: "ASSET",
    subjectTemplateBn: "সম্পদ স্থিতি সতর্কতা: {{asset.code}} - {{item.nameBn}}",
    bodyTemplateBn: "জরুরি নোটিশ: সম্পদ '{{item.nameBn}}' (কোড: {{asset.code}}, অবস্থান: {{location.name}})-এর স্থিতি '{{status}}' এবং অবস্থা '{{condition}}' হিসেবে নথিভুক্ত করা হয়েছে। কারণ: {{reason}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "HR_LEAVE_SUBMITTED",
    nameBn: "ছুটির আবেদন দাখিল",
    category: "HR",
    subjectTemplateBn: "ছুটির আবেদন দাখিল - {{employee.nameBn}} ({{request.code}})",
    bodyTemplateBn: "প্রশাসনিক দপ্তর: কর্মী {{employee.nameBn}} (আইডি: {{employee.employeeId}}, পদবি: {{designation.nameBn}}) {{startDate}} থেকে {{endDate}} পর্যন্ত (মোট: {{totalDays}} দিন) ছুটির আবেদন (নম্বর: {{request.code}}) দাখিল করেছেন। কারণ: {{reason}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: false,
  },
  {
    code: "HR_LEAVE_APPROVED",
    nameBn: "ছুটির আবেদন অনুমোদন",
    category: "HR",
    subjectTemplateBn: "ছুটির আবেদন অনুমোদিত হয়েছে - {{request.code}}",
    bodyTemplateBn: "মুহতারাম {{employee.nameBn}}, আপনার দাখিলকৃত {{leaveType.nameBn}} (তারিখ: {{startDate}} হতে {{endDate}}, মোট {{totalDays}} দিন) কর্তৃপক্ষ কর্তৃক অনুমোদিত হয়েছে। আবেদন কোড: {{request.code}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "HR_LEAVE_REJECTED",
    nameBn: "ছুটির আবেদন সংক্রান্ত সিদ্ধান্ত",
    category: "HR",
    subjectTemplateBn: "ছুটির আবেদন স্থগিত বা নামঞ্জুর - {{request.code}}",
    bodyTemplateBn: "মুহতারাম {{employee.nameBn}}, আপনার দাখিলকৃত ছুটির আবেদনটি (কোড: {{request.code}}) প্রাতিষ্ঠানিক বা একাডেমিক আবশ্যকতায় অনুমোদন করা সম্ভব হয়নি। কারণ: {{decisionReason}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "HR_DOCUMENT_EXPIRING",
    nameBn: "নথি বা চুক্তির মেয়াদ উত্তীর্ণের নোটিশ",
    category: "HR",
    subjectTemplateBn: "সতর্কতা: ডকুমেন্টের মেয়াদ উত্তীর্ণ হতে যাচ্ছে - {{document.title}}",
    bodyTemplateBn: "প্রশাসনিক নোটিশ: কর্মী {{employee.nameBn}} (আইডি: {{employee.employeeId}})-এর নথি '{{document.title}}' আগামী {{expiryDate}} তারিখে মেয়াদ উত্তীর্ণ হতে যাচ্ছে। অবিলম্বে নবায়ন নিশ্চিত করুন।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "HR_STATUS_CHANGED",
    nameBn: "কর্মসংস্থান স্ট্যাটাস পরিবর্তন নোটিশ",
    category: "HR",
    subjectTemplateBn: "কর্মসংস্থান মর্যাদা হালনাগাদ - {{employee.nameBn}}",
    bodyTemplateBn: "প্রশাসনিক নোটিশ: কর্মী {{employee.nameBn}} (আইডি: {{employee.employeeId}})-এর কর্মসংস্থান স্ট্যাটাস '{{previousStatus}}' হতে '{{newStatus}}' করা হয়েছে। কার্যকর তারিখ: {{effectiveDate}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "HR_APPOINTMENT_ISSUED",
    nameBn: "নিয়োগপত্র বা প্রত্যয়নপত্র ইস্যু নোটিশ",
    category: "HR",
    subjectTemplateBn: "অফিসিয়াল কর্মসংস্থান নথি ইস্যু - {{document.title}}",
    bodyTemplateBn: "মুহতারাম {{employee.nameBn}}, আপনার অফিসিয়াল নথি '{{document.title}}' মাদরাসা প্রশাসন কর্তৃক ইস্যু করা হয়েছে। ডিজিটাল ভেরিফিকেশন লিঙ্ক: {{verificationUrl}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "HELPDESK_TICKET_CREATED",
    nameBn: "হেল্পডেস্ক ও অভিযোগ টিকিট দাখিল",
    category: "HELPDESK",
    subjectTemplateBn: "টিকিট গৃহীত হয়েছে: {{ticket.ticketNumber}} - {{ticket.subject}}",
    bodyTemplateBn: "মুহতারাম {{recipient.name}}, আপনার অভিযোগ/সার্ভিস রিকুয়েস্ট সফলভাবে নিবন্ধিত হয়েছে (টিকিট নম্বর: {{ticket.ticketNumber}})। সংশ্লিষ্ট বিভাগ দ্রুত বিষয়টি পর্যালোচনা করে ব্যবস্থা গ্রহণ করবে।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "HELPDESK_STATUS_CHANGED",
    nameBn: "হেল্পডেস্ক টিকিটের অগ্রগতি ও স্ট্যাটাস পরিবর্তন",
    category: "HELPDESK",
    subjectTemplateBn: "টিকিট অগ্রগতি নোটিশ: {{ticket.ticketNumber}} ({{ticket.status}})",
    bodyTemplateBn: "মুহতারাম {{recipient.name}}, আপনার টিকিট {{ticket.ticketNumber}}-এর স্ট্যাটাস পরিবর্তন হয়ে '{{ticket.statusBn}}' করা হয়েছে। পোর্টালে বিস্তারিত অগ্রগতি দেখতে পাবেন।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "HELPDESK_RESPONSE_ADDED",
    nameBn: "হেল্পডেস্কে প্রাতিষ্ঠানিক উত্তর/মন্তব্য",
    category: "HELPDESK",
    subjectTemplateBn: "নতুন উত্তর: টিকিট {{ticket.ticketNumber}} - {{ticket.subject}}",
    bodyTemplateBn: "মুহতারাম {{recipient.name}}, আপনার টিকিট {{ticket.ticketNumber}}-এ মাদরাসা প্রশাসন থেকে নতুন প্রতিক্রিয়া/উত্তর প্রদান করা হয়েছে: \"{{message.contentPreview}}\"।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "HELPDESK_INFO_REQUIRED",
    nameBn: "অতিরিক্ত তথ্য প্রদানের অনুরোধ",
    category: "HELPDESK",
    subjectTemplateBn: "জরুরি: টিকিট {{ticket.ticketNumber}}-এ অতিরিক্ত তথ্য প্রয়োজন",
    bodyTemplateBn: "মুহতারাম {{recipient.name}}, আপনার দাখিলকৃত অনুরোধটি (টিকিট: {{ticket.ticketNumber}}) নিষ্পত্তির জন্য কিছু অতিরিক্ত তথ্যের প্রয়োজন। অনুগ্রহ করে পোর্টালে গিয়ে বিস্তারিত তথ্য যুক্ত করুন।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "HELPDESK_TICKET_RESOLVED",
    nameBn: "হেল্পডেস্ক টিকিট সমাধান ও নিষ্পত্তি",
    category: "HELPDESK",
    subjectTemplateBn: "টিকিট নিষ্পত্তি সম্পন্ন: {{ticket.ticketNumber}}",
    bodyTemplateBn: "মুহতারাম {{recipient.name}}, আলহামদুলিল্লাহ আপনার দাখিলকৃত অনুরোধ/অভিযোগটি (টিকিট: {{ticket.ticketNumber}}) সফলভাবে সমাধান করা হয়েছে। সমাধান সারসংক্ষেপ: {{ticket.resolutionSummary}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
  {
    code: "HELPDESK_TICKET_REOPENED",
    nameBn: "টিকিট পুনরায় চালু করার বিজ্ঞপ্তি",
    category: "HELPDESK",
    subjectTemplateBn: "টিকিট পুনরুজ্জীবিত: {{ticket.ticketNumber}}",
    bodyTemplateBn: "প্রশাসনিক দপ্তর: পূর্বে নিষ্পত্তিকৃত টিকিট {{ticket.ticketNumber}} পুনরায় পর্যালোচনা করার অনুরোধ এসেছে। কারণ: {{ticket.reopenReason}}।",
    channels: "PORTAL,EMAIL",
    isMandatory: true,
  },
];

/**
 * Ensure all default notification templates are created in database
 */
export async function ensureDefaultNotificationTemplates() {
  for (const tpl of DEFAULT_NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { code: tpl.code },
      update: {
        nameBn: tpl.nameBn,
        category: tpl.category,
        subjectTemplateBn: tpl.subjectTemplateBn,
        bodyTemplateBn: tpl.bodyTemplateBn,
        channels: tpl.channels,
        isMandatory: tpl.isMandatory,
      },
      create: {
        code: tpl.code,
        nameBn: tpl.nameBn,
        category: tpl.category,
        subjectTemplateBn: tpl.subjectTemplateBn,
        bodyTemplateBn: tpl.bodyTemplateBn,
        channels: tpl.channels,
        isMandatory: tpl.isMandatory,
        isActive: true,
      },
    });
  }
}

// =================================================================
// 2. TEMPLATE INTERPOLATION (SAFE VARIABLE INJECTION)
// =================================================================

/**
 * Replace placeholders like {{student.nameBn}}, {{invoice.number}}, etc.
 */
export function interpolateNotificationTemplate(
  templateText: string,
  variables: Record<string, string | number | undefined | null>
): string {
  if (!templateText) return "";
  let result = templateText;

  for (const [key, val] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    const replacement = val !== undefined && val !== null ? String(val) : "";
    result = result.replace(regex, replacement);
  }

  // Clear unmapped variables
  result = result.replace(/{{\s*[\w\.]+\s*}}/g, "");
  return result;
}

// =================================================================
// 3. RECIPIENT RESOLVER
// =================================================================

export interface RecipientTarget {
  audience: string; // PUBLIC, ALL_GUARDIANS, ALL_TEACHERS, ALL_STAFF, CLASS, SECTION, STUDENT, TEACHER, CUSTOM
  sessionId?: string;
  classId?: string;
  sectionId?: string;
  studentId?: string;
  teacherUserId?: string;
  customUserIds?: string[];
}

export interface ResolvedRecipient {
  userId: string;
  name: string;
  email: string | null;
  role: string;
}

/**
 * Resolves authorized recipients based on audience targeting rules
 */
export async function resolveRecipients(target: RecipientTarget): Promise<ResolvedRecipient[]> {
  const { audience, sessionId, classId, sectionId, studentId, teacherUserId, customUserIds } = target;

  if (audience === "PUBLIC") {
    // Public notices do not generate individual user notifications
    return [];
  }

  if (audience === "ALL_GUARDIANS") {
    const users = await prisma.user.findMany({
      where: { role: "GUARDIAN", status: "ACTIVE" },
      select: { id: true, name: true, email: true, role: true },
    });
    return users.map((u) => ({ userId: u.id, name: u.name, email: u.email, role: u.role }));
  }

  if (audience === "ALL_TEACHERS") {
    const users = await prisma.user.findMany({
      where: { role: "TEACHER", status: "ACTIVE" },
      select: { id: true, name: true, email: true, role: true },
    });
    return users.map((u) => ({ userId: u.id, name: u.name, email: u.email, role: u.role }));
  }

  if (audience === "ALL_STAFF") {
    const users = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "PRINCIPAL", "TEACHER"] }, status: "ACTIVE" },
      select: { id: true, name: true, email: true, role: true },
    });
    return users.map((u) => ({ userId: u.id, name: u.name, email: u.email, role: u.role }));
  }

  if (audience === "TEACHER" && teacherUserId) {
    const user = await prisma.user.findUnique({
      where: { id: teacherUserId },
      select: { id: true, name: true, email: true, role: true },
    });
    return user ? [{ userId: user.id, name: user.name, email: user.email, role: user.role }] : [];
  }

  if (audience === "CLASS" && classId) {
    // Find active students in class -> resolve their guardians
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classId,
        status: "ACTIVE",
        ...(sessionId ? { sessionId } : {}),
      },
      select: {
        student: {
          select: {
            guardianLinks: {
              select: {
                guardian: {
                  select: {
                    user: {
                      select: { id: true, name: true, email: true, role: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const userMap = new Map<string, ResolvedRecipient>();
    for (const enr of enrollments) {
      for (const gs of enr.student.guardianLinks) {
        if (gs.guardian?.user) {
          userMap.set(gs.guardian.user.id, {
            userId: gs.guardian.user.id,
            name: gs.guardian.user.name,
            email: gs.guardian.user.email,
            role: gs.guardian.user.role,
          });
        }
      }
    }
    return Array.from(userMap.values());
  }

  if (audience === "SECTION" && sectionId) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sectionId,
        status: "ACTIVE",
        ...(sessionId ? { sessionId } : {}),
      },
      select: {
        student: {
          select: {
            guardianLinks: {
              select: {
                guardian: {
                  select: {
                    user: {
                      select: { id: true, name: true, email: true, role: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const userMap = new Map<string, ResolvedRecipient>();
    for (const enr of enrollments) {
      for (const gs of enr.student.guardianLinks) {
        if (gs.guardian?.user) {
          userMap.set(gs.guardian.user.id, {
            userId: gs.guardian.user.id,
            name: gs.guardian.user.name,
            email: gs.guardian.user.email,
            role: gs.guardian.user.role,
          });
        }
      }
    }
    return Array.from(userMap.values());
  }

  if (audience === "STUDENT" && studentId) {
    // Resolve guardians linked via GuardianStudent relation
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        guardianLinks: {
          include: {
            guardian: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!student) return [];

    const recipients: ResolvedRecipient[] = [];
    for (const gs of student.guardianLinks) {
      if (gs.guardian?.user) {
        recipients.push({
          userId: gs.guardian.user.id,
          name: gs.guardian.user.name,
          email: gs.guardian.user.email,
          role: gs.guardian.user.role,
        });
      }
    }
    return recipients;
  }

  if (audience === "CUSTOM" && customUserIds && customUserIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: customUserIds }, status: "ACTIVE" },
      select: { id: true, name: true, email: true, role: true },
    });
    return users.map((u) => ({ userId: u.id, name: u.name, email: u.email, role: u.role }));
  }

  return [];
}

// =================================================================
// 4. NOTIFICATION DISPATCHER (PORTAL & EMAIL)
// =================================================================

export interface DispatchNotificationParams {
  templateCode: string;
  recipients?: ResolvedRecipient[];
  target?: RecipientTarget;
  variables: Record<string, string | number | undefined | null>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  customTitle?: string;
  customBody?: string;
  priority?: "NORMAL" | "IMPORTANT" | "URGENT";
  idempotencyBaseKey?: string;
}

/**
 * Dispatches a notification across portal and email channels with preference checks
 */
export async function dispatchNotification(params: DispatchNotificationParams) {
  const {
    templateCode,
    variables,
    relatedEntityType,
    relatedEntityId,
    actionUrl,
    customTitle,
    customBody,
    priority = "NORMAL",
    idempotencyBaseKey,
  } = params;

  // 1. Resolve Template
  const template = await prisma.notificationTemplate.findUnique({
    where: { code: templateCode },
  });

  const title = customTitle || (template ? interpolateNotificationTemplate(template.subjectTemplateBn, variables) : "বিজ্ঞপ্তি");
  const body = customBody || (template ? interpolateNotificationTemplate(template.bodyTemplateBn, variables) : "");
  const category = template?.category || "OTHER";
  const isMandatory = template?.isMandatory ?? false;

  // 2. Resolve Recipients
  let recipients = params.recipients;
  if (!recipients && params.target) {
    recipients = await resolveRecipients(params.target);
  }
  if (!recipients || recipients.length === 0) {
    return { dispatchedCount: 0, recipients: [] };
  }

  let createdCount = 0;
  let emailDeliveryCount = 0;

  for (const recipient of recipients) {
    // 3. Check Preferences
    const preference = await prisma.notificationPreference.findUnique({
      where: {
        userId_category: {
          userId: recipient.userId,
          category,
        },
      },
    });

    const portalAllowed = isMandatory || !preference || preference.portalEnabled !== false;
    const emailAllowed = (isMandatory || !preference || preference.emailEnabled !== false) && !!recipient.email;

    const notifKey = idempotencyBaseKey ? `${idempotencyBaseKey}:${recipient.userId}:portal` : undefined;

    // 4. Create Portal Notification
    let notificationId: string | null = null;
    if (portalAllowed) {
      try {
        const notif = await prisma.notification.upsert({
          where: {
            idempotencyKey: notifKey || `notif_${Date.now()}_${Math.random()}`,
          },
          update: {},
          create: {
            recipientUserId: recipient.userId,
            type: category,
            title,
            body,
            channel: "PORTAL",
            priority,
            relatedEntityType,
            relatedEntityId,
            actionUrl,
            idempotencyKey: notifKey,
          },
        });
        notificationId = notif.id;
        createdCount++;
      } catch (err) {
        console.error("Portal notification dispatch error:", err);
      }
    }

    // 5. Create Email Delivery Record and Send Asynchronously
    if (emailAllowed && recipient.email) {
      const emailKey = idempotencyBaseKey ? `${idempotencyBaseKey}:${recipient.userId}:email` : undefined;

      try {
        const delivery = await prisma.notificationDelivery.upsert({
          where: {
            idempotencyKey: emailKey || `deliv_${Date.now()}_${Math.random()}`,
          },
          update: {},
          create: {
            notificationId,
            channel: "EMAIL",
            destination: recipient.email,
            status: "QUEUED",
            idempotencyKey: emailKey,
          },
        });

        // Async execution without breaking main transaction
        sendNotificationEmailAsync({
          deliveryId: delivery.id,
          to: recipient.email,
          recipientName: recipient.name,
          subject: title,
          bodyHtml: body,
          actionUrl,
        }).catch((err) => console.error("Async email delivery caught error:", err));

        emailDeliveryCount++;
      } catch (err) {
        console.error("Email delivery queue error:", err);
      }
    }
  }

  return {
    dispatchedCount: createdCount,
    emailDeliveryCount,
    recipientsCount: recipients.length,
  };
}

/**
 * Async helper to send institutional email and update delivery status
 */
async function sendNotificationEmailAsync({
  deliveryId,
  to,
  recipientName,
  subject,
  bodyHtml,
  actionUrl,
}: {
  deliveryId: string;
  to: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  actionUrl?: string;
}) {
  const fullHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0D5C3A; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 19px;">${INSTITUTION_INFO.nameBn}</h2>
        <p style="margin: 4px 0 0; font-size: 12px; color: #fef08a;">${INSTITUTION_INFO.nameEn}</p>
        <p style="margin: 4px 0 0; font-size: 11px; color: #a7f3d0;">প্রতিষ্ঠাতা ও অধ্যক্ষ: মাওলানা মহা. আবুল কালাম সরকার | স্থাপিত: ২০২১ইং</p>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 15px; font-weight: bold; color: #0D5C3A; margin-top: 0;">মুহতারাম ${recipientName}, আসসালামু আলাইকুম।</p>
        <div style="margin: 16px 0; font-size: 14px; color: #334155;">
          ${bodyHtml.replace(/\n/g, "<br/>")}
        </div>
        ${
          actionUrl
            ? `
          <div style="margin: 24px 0 16px; text-align: center;">
            <a href="https://ehrjmadrasha.com${actionUrl}" style="background-color: #0D5C3A; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 13px; display: inline-block;">
              বিস্তারিত দেখুন ও পোর্টালে যান
            </a>
          </div>
        `
            : ""
        }
        <div style="border-top: 1px solid #e2e8f0; margin-top: 20px; padding-top: 16px; font-size: 12px; color: #64748b;">
          <p style="margin: 0 0 4px;">যেকোনো তথ্যের জন্য মাদরাসা অফিসে যোগাযোগ করুন: <strong>${INSTITUTION_INFO.phones[0]}</strong>, <strong>${INSTITUTION_INFO.phones[1] || ""}</strong></p>
          <p style="margin: 0;">ঠিকানা: ${INSTITUTION_INFO.addressBn}</p>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 10px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        EHRJ Digital Campus Communication Engine • স্বয়ংক্রিয় বার্তা
      </div>
    </div>
  `;

  try {
    const result = await sendInstitutionalEmail({
      to,
      subject: `${subject} | ${INSTITUTION_INFO.nameBn}`,
      html: fullHtml,
    });

    if (result.success) {
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "SENT",
          providerMessageId: result.messageId,
          deliveredAt: new Date(),
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
    } else {
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "FAILED",
          errorCode: "SMTP_ERROR",
          errorMessage: result.error || "Failed to deliver email",
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
          failedAt: new Date(),
        },
      });
    }
  } catch (error: any) {
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "FAILED",
        errorCode: "INTERNAL_ERROR",
        errorMessage: error.message,
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
        failedAt: new Date(),
      },
    });
  }
}

// =================================================================
// 5. OFFICIAL NOTICE CMS LIFECYCLE
// =================================================================

export interface CreateNoticeInput {
  titleBn: string;
  titleEn?: string;
  contentBn: string;
  contentEn?: string;
  category?: string;
  audience?: string;
  priority?: "NORMAL" | "IMPORTANT" | "URGENT";
  status?: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  sessionId?: string;
  classId?: string;
  sectionId?: string;
  isPinned?: boolean;
  scheduledAt?: Date | string | null;
  expiresAt?: Date | string | null;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  authorUserId: string;
}

/**
 * Creates a notice in DRAFT, SCHEDULED, or PUBLISHED state
 */
export async function createNotice(input: CreateNoticeInput) {
  const {
    titleBn,
    titleEn,
    contentBn,
    contentEn,
    category = "GENERAL",
    audience = "PUBLIC",
    priority = "NORMAL",
    status = "PUBLISHED",
    sessionId,
    classId,
    sectionId,
    isPinned = false,
    scheduledAt,
    expiresAt,
    attachmentUrl,
    attachmentName,
    attachmentType,
    authorUserId,
  } = input;

  const isUrgent = priority === "URGENT";
  const isPublished = status === "PUBLISHED";
  const publishedAt = isPublished ? new Date() : new Date();

  const notice = await prisma.notice.create({
    data: {
      titleBn,
      titleEn,
      contentBn,
      contentEn,
      category,
      audience,
      priority,
      status,
      isUrgent,
      isPublished,
      isPinned,
      sessionId: sessionId || null,
      classId: classId || null,
      sectionId: sectionId || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
      attachmentType: attachmentType || null,
      createdByUserId: authorUserId,
      publishedByUserId: isPublished ? authorUserId : null,
      publishedAt,
    },
  });

  await recordAuditLog({
    userId: authorUserId,
    action: `NOTICE_CREATE_${status}`,
    entityType: "Notice",
    entityId: notice.id,
    details: { titleBn, category, audience, priority, status },
  });

  // If published immediately and not public, dispatch targeted notifications
  if (isPublished && audience !== "PUBLIC") {
    await dispatchNoticeNotifications(notice.id);
  }

  return notice;
}

/**
 * Publishes a draft or scheduled notice
 */
export async function publishNotice(noticeId: string, publisherUserId: string) {
  const notice = await prisma.notice.findUnique({
    where: { id: noticeId },
  });

  if (!notice) {
    throw new Error("নোটিশ পাওয়া যায়নি।");
  }

  if (notice.status === "PUBLISHED") {
    return notice; // Idempotent return
  }

  const updated = await prisma.notice.update({
    where: { id: noticeId },
    data: {
      status: "PUBLISHED",
      isPublished: true,
      publishedAt: new Date(),
      publishedByUserId: publisherUserId,
    },
  });

  await recordAuditLog({
    userId: publisherUserId,
    action: "NOTICE_PUBLISH",
    entityType: "Notice",
    entityId: notice.id,
    details: { titleBn: notice.titleBn, audience: notice.audience },
  });

  // Dispatch notifications to target audience
  if (updated.audience !== "PUBLIC") {
    await dispatchNoticeNotifications(updated.id);
  }

  return updated;
}

/**
 * Dispatches notifications for a published targeted notice
 */
export async function dispatchNoticeNotifications(noticeId: string) {
  const notice = await prisma.notice.findUnique({
    where: { id: noticeId },
  });

  if (!notice || notice.status !== "PUBLISHED" || notice.audience === "PUBLIC") {
    return;
  }

  const recipients = await resolveRecipients({
    audience: notice.audience,
    sessionId: notice.sessionId || undefined,
    classId: notice.classId || undefined,
    sectionId: notice.sectionId || undefined,
  });

  if (recipients.length === 0) return;

  await dispatchNotification({
    templateCode: "OFFICIAL_NOTICE_ANNOUNCEMENT",
    recipients,
    variables: {
      "notice.title": notice.titleBn,
      "notice.body": notice.contentBn.slice(0, 150),
    },
    relatedEntityType: "Notice",
    relatedEntityId: notice.id,
    actionUrl: `/notices/${notice.id}`,
    priority: (notice.priority as any) || "NORMAL",
    idempotencyBaseKey: `notice_pub:${notice.id}`,
  });
}

/**
 * Process scheduled notices whose scheduledAt has arrived
 */
export async function processScheduledNotices() {
  const now = new Date();
  const scheduled = await prisma.notice.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
  });

  const publishedIds: string[] = [];
  for (const n of scheduled) {
    await prisma.notice.update({
      where: { id: n.id },
      data: {
        status: "PUBLISHED",
        isPublished: true,
        publishedAt: now,
      },
    });

    if (n.audience !== "PUBLIC") {
      await dispatchNoticeNotifications(n.id);
    }
    publishedIds.push(n.id);
  }

  // Also expire notices whose expiresAt has passed
  const expiredResult = await prisma.notice.updateMany({
    where: {
      status: "PUBLISHED",
      expiresAt: { lte: now },
    },
    data: {
      status: "EXPIRED",
      isPublished: false,
    },
  });

  return {
    publishedCount: publishedIds.length,
    publishedIds,
    expiredCount: expiredResult.count,
  };
}

// =================================================================
// 6. EVENT-BASED OUTBOX PATTERN
// =================================================================

/**
 * Emits a domain event into the NotificationOutbox for reliable, decoupled notification handling
 */
export async function emitDomainEvent({
  eventType,
  entityType,
  entityId,
  payload,
  idempotencyKey,
}: {
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, any>;
  idempotencyKey?: string;
}) {
  const key = idempotencyKey || `event_${eventType}_${entityId}_${Date.now()}`;

  const outbox = await prisma.notificationOutbox.upsert({
    where: { idempotencyKey: key },
    update: {},
    create: {
      eventType,
      entityType,
      entityId,
      payloadJson: JSON.stringify(payload),
      idempotencyKey: key,
      status: "PENDING",
    },
  });

  // Process outbox entry immediately without blocking caller
  processSingleOutboxEvent(outbox.id).catch((err) =>
    console.error(`Outbox event processing caught error (${eventType}):`, err)
  );

  return outbox;
}

/**
 * Processes a single outbox event into a dispatchNotification call
 */
export async function processSingleOutboxEvent(outboxId: string) {
  const event = await prisma.notificationOutbox.findUnique({
    where: { id: outboxId },
  });

  if (!event || event.status === "PROCESSED") return;

  try {
    const payload = JSON.parse(event.payloadJson);

    // Map EventType to NotificationTemplate and parameters
    switch (event.eventType) {
      case "ADMISSION_APPROVED": {
        await dispatchNotification({
          templateCode: "ADMISSION_APPROVED",
          target: { audience: "STUDENT", studentId: payload.studentId },
          variables: {
            "guardian.name": payload.guardianName,
            "student.nameBn": payload.studentNameBn,
            "student.studentId": payload.studentIdNumber,
            "class.name": payload.className,
            roll: payload.rollNumber,
          },
          relatedEntityType: "AdmissionApplication",
          relatedEntityId: payload.applicationId,
          actionUrl: "/portal/children",
          idempotencyBaseKey: `outbox:${event.id}`,
        });
        break;
      }

      case "PAYMENT_SUCCESSFUL": {
        await dispatchNotification({
          templateCode: "PAYMENT_SUCCESSFUL",
          target: { audience: "STUDENT", studentId: payload.studentId },
          variables: {
            "guardian.name": payload.guardianName,
            "student.nameBn": payload.studentNameBn,
            "payment.amount": payload.amount,
            "receipt.number": payload.receiptNumber,
          },
          relatedEntityType: "PaymentReceipt",
          relatedEntityId: payload.receiptId,
          actionUrl: "/portal/finance",
          idempotencyBaseKey: `outbox:${event.id}`,
        });
        break;
      }

      case "DOCUMENT_ISSUED": {
        await dispatchNotification({
          templateCode: "DOCUMENT_ISSUED",
          target: { audience: "STUDENT", studentId: payload.studentId },
          variables: {
            "guardian.name": payload.guardianName,
            "student.nameBn": payload.studentNameBn,
            "document.type": payload.documentTypeName,
            "document.number": payload.documentNumber,
          },
          relatedEntityType: "Certificate",
          relatedEntityId: payload.certificateId,
          actionUrl: "/portal/documents",
          idempotencyBaseKey: `outbox:${event.id}`,
        });
        break;
      }

      case "RESULT_PUBLISHED": {
        await dispatchNotification({
          templateCode: "RESULT_PUBLISHED",
          target: { audience: "CLASS", classId: payload.classId, sessionId: payload.sessionId },
          variables: {
            "exam.name": payload.examName,
          },
          relatedEntityType: "Exam",
          relatedEntityId: payload.examId,
          actionUrl: "/portal/results",
          idempotencyBaseKey: `outbox:${event.id}`,
        });
        break;
      }

      case "ATTENDANCE_ABSENT_ALERT": {
        await dispatchNotification({
          templateCode: "ATTENDANCE_ABSENT_ALERT",
          target: { audience: "STUDENT", studentId: payload.studentId },
          variables: {
            "guardian.name": payload.guardianName,
            "student.nameBn": payload.studentNameBn,
            "class.name": payload.className,
            roll: payload.roll,
            "attendance.date": payload.date,
          },
          relatedEntityType: "Attendance",
          relatedEntityId: payload.attendanceId,
          actionUrl: "/portal/attendance",
          idempotencyBaseKey: `outbox:${event.id}`,
        });
        break;
      }

      default:
        console.warn(`Unmapped outbox event type: ${event.eventType}`);
    }

    await prisma.notificationOutbox.update({
      where: { id: event.id },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error("Outbox process failure:", error);
    await prisma.notificationOutbox.update({
      where: { id: event.id },
      data: {
        status: "FAILED",
        errorMessage: error.message,
        attempts: { increment: 1 },
      },
    });
  }
}
