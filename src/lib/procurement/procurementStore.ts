/**
 * EHRJ MADRASHA ERP — PHASE 40
 * Procurement, Vendor, Contract & Supplier Relationship Store
 * 
 * Manages atomic filesystem persistence in data/procurement/
 * Seeded with authentic Eliotganj Hazi Rohmatollah Jamiria Madrasha suppliers and contracts.
 */

import fs from "fs";
import path from "path";
import {
  Vendor,
  RFQ,
  Quotation,
  ProcurementEvaluation,
  Contract,
  VendorPerformanceReview,
  VendorRiskRecord,
  ConflictDeclaration,
  ProcurementAuditEntry,
  ProcurementDashboardStats,
  ActorContext,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "procurement");

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, defaultVal: T): T {
  try {
    ensureDir(path.dirname(filePath));
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), "utf-8");
      return defaultVal;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultVal;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  ensureDir(path.dirname(filePath));
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tempPath, filePath);
}

// File paths
const VENDORS_FILE = path.join(DATA_DIR, "vendors.json");
const RFQS_FILE = path.join(DATA_DIR, "rfqs.json");
const QUOTATIONS_FILE = path.join(DATA_DIR, "quotations.json");
const EVALUATIONS_FILE = path.join(DATA_DIR, "evaluations.json");
const CONTRACTS_FILE = path.join(DATA_DIR, "contracts.json");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");
const RISKS_FILE = path.join(DATA_DIR, "risks.json");
const CONFLICTS_FILE = path.join(DATA_DIR, "conflicts.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit_log.json");

// =================================================================
// INITIAL SEED DATA
// =================================================================

const SEED_VENDORS: Vendor[] = [
  {
    id: "EHRJ-VEN-2026-0001",
    vendorCode: "VEN-2026-0001",
    legalNameBn: "কুমিল্লা মডার্ন প্রেস অ্যান্ড পাবলিকেশন্স",
    legalNameEn: "Comilla Modern Press & Publications",
    displayName: "মডার্ন প্রেস কুমিল্লা",
    vendorType: "SUPPLIER",
    categoryCode: "BOOKS",
    categoryNameBn: "শিক্ষা ও পাঠ্যবই উপকরণ",
    status: "ACTIVE",
    riskLevel: "LOW",
    verificationStatus: "VERIFIED",
    phone: "01711223344",
    altPhone: "01811223344",
    email: "modernpress.comilla@gmail.com",
    addressBn: "কান্দিরপাড়, কুমিল্লা সদর, কুমিল্লা",
    district: "Comilla",
    country: "Bangladesh",
    tradeLicenseNo: "TRAD/COM/2024/9842",
    tinNumber: "784592019482",
    binVatNumber: "002948192-0102",
    bankName: "Islami Bank Bangladesh PLC",
    bankBranch: "Kandirpar Branch, Comilla",
    bankAccountTitle: "Comilla Modern Press & Pub",
    bankAccountNumberMasked: "•••• •••• 4589",
    contacts: [
      {
        id: "cnt-1",
        name: "জনাব মো: রফিকুল ইসলাম",
        designation: "ম্যানেজিং ডিরেক্টর",
        phone: "01711223344",
        email: "rafiq@modernpress.com",
        department: "ম্যানেজমেন্ট",
        isPrimary: true,
        isActive: true,
      },
      {
        id: "cnt-2",
        name: "মো: কামাল হোসেন",
        designation: "সেলস ও সাপ্লাই ম্যানেজার",
        phone: "01811223344",
        department: "সাপ্লাই চেইন",
        isPrimary: false,
        isActive: true,
      },
    ],
    verifications: [
      {
        id: "vfc-1",
        type: "TRADE_LICENSE",
        titleBn: "ট্রেড লাইসেন্স সত্যতা যাচাই",
        status: "VERIFIED",
        verifiedBy: "অধ্যক্ষ কার্যালয়",
        verifiedAt: "2026-01-10T10:00:00Z",
        expiryDate: "2027-06-30",
        notes: "সিটি কর্পোরেশন ট্রেড লাইসেন্স নবায়নকৃত",
      },
      {
        id: "vfc-2",
        type: "BANK_ACCOUNT",
        titleBn: "ইসলামী ব্যাংক প্রাতিষ্ঠানিক হিসাব নিশ্চিতকরণ",
        status: "VERIFIED",
        verifiedBy: "হিসাব বিভাগ",
        verifiedAt: "2026-01-10T10:30:00Z",
        notes: "চেক কপি ও ব্যাংক স্টেটমেন্ট যাচাইকৃত",
      },
    ],
    documents: [
      {
        id: "doc-1",
        phase29DocToken: "DOC-2026-VEN-001",
        documentType: "TRADE_LICENSE",
        title: "হালনাগাদ ট্রেড লাইসেন্স ২০২৫-২৬",
        fileName: "trade_license_modern_press.pdf",
        fileSize: 450200,
        uploadedAt: "2026-01-08T09:00:00Z",
        expiryDate: "2027-06-30",
        isVerified: true,
      },
    ],
    complianceRecords: [
      {
        id: "cmp-1",
        titleBn: "বই মুদ্রণ ও বাঁধাই মানদণ্ড সম্মতি",
        status: "COMPLIANT",
        checkDate: "2026-01-10",
        notes: "কাগজের জিএসএম এবং বাঁধাই স্থায়িত্ব সন্তোষজনক",
        assessedBy: "প্রকিউরমেন্ট কমিটি",
      },
    ],
    ratingSummary: {
      totalOrdersFulfilled: 14,
      onTimeDeliveryRate: 96,
      qualityComplianceRate: 98,
      disputeCount: 0,
      averageResponseDays: 1.2,
    },
    notes: "মাদরাসার বার্ষিক কিতাব, খাতা ও ডায়েরি মুদ্রণের প্রধান অনুমোদিত সরবরাহকারী।",
    createdBy: "admin",
    createdAt: "2026-01-05T10:00:00Z",
    updatedBy: "admin",
    updatedAt: "2026-01-10T11:00:00Z",
  },
  {
    id: "EHRJ-VEN-2026-0002",
    vendorCode: "VEN-2026-0002",
    legalNameBn: "ইলিয়টগঞ্জ এগ্রো ফুড অ্যান্ড গ্রেইন সাপ্লায়ার্স",
    legalNameEn: "Eliotganj Agro Food & Grain Suppliers",
    displayName: "ইলিয়টগঞ্জ এগ্রো ফুডস",
    vendorType: "LOCAL_VENDOR",
    categoryCode: "FOOD",
    categoryNameBn: "খাদ্য ও লিল্লাহ বোর্ডিং সামগ্রী",
    status: "ACTIVE",
    riskLevel: "LOW",
    verificationStatus: "VERIFIED",
    phone: "01722334455",
    altPhone: "01922334455",
    email: "agro.eliotganj@gmail.com",
    addressBn: "ইলিয়টগঞ্জ বাজার, দাউদকান্দি, কুমিল্লা",
    district: "Comilla",
    country: "Bangladesh",
    tradeLicenseNo: "TRAD/DAUD/2024/1102",
    tinNumber: "654129841290",
    bankName: "Al-Arafah Islami Bank PLC",
    bankBranch: "Eliotganj Bazar Branch",
    bankAccountTitle: "Eliotganj Agro Food",
    bankAccountNumberMasked: "•••• •••• 9812",
    contacts: [
      {
        id: "cnt-3",
        name: "হাজী মো: সামসুল হক",
        designation: "স্বত্বাধিকারী",
        phone: "01722334455",
        department: "ম্যানেজমেন্ট",
        isPrimary: true,
        isActive: true,
      },
    ],
    verifications: [
      {
        id: "vfc-3",
        type: "TRADE_LICENSE",
        titleBn: "বাজার ইউনিয়ন ট্রেড লাইসেন্স",
        status: "VERIFIED",
        verifiedBy: "নাজের কার্যালয়",
        verifiedAt: "2026-01-12T14:00:00Z",
        expiryDate: "2027-06-30",
      },
    ],
    documents: [],
    complianceRecords: [
      {
        id: "cmp-2",
        titleBn: "খাদ্যের বিশুদ্ধতা ও স্বাস্থ্যবিধি মানদণ্ড",
        status: "COMPLIANT",
        checkDate: "2026-01-15",
        notes: "চাল, ডাল, সরিষার তেল ও মসলার মান শতভাগ হালাল ও ভেজালমুক্ত",
        assessedBy: "লিল্লাহ বোর্ডিং পরিদর্শক",
      },
    ],
    ratingSummary: {
      totalOrdersFulfilled: 36,
      onTimeDeliveryRate: 98,
      qualityComplianceRate: 99,
      disputeCount: 0,
      averageResponseDays: 0.5,
    },
    notes: "লিল্লাহ বোর্ডিংয়ের শিক্ষার্থীদের প্রতিদিনের তাজা খাদ্যশস্য সরবরাহকারী।",
    createdBy: "admin",
    createdAt: "2026-01-05T10:00:00Z",
    updatedBy: "admin",
    updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "EHRJ-VEN-2026-0003",
    vendorCode: "VEN-2026-0003",
    legalNameBn: "রহমান বিল্ডার্স অ্যান্ড কনস্ট্রাকশন ইঞ্জিনিয়ারিং",
    legalNameEn: "Rahman Builders & Construction Engineering",
    displayName: "রহমান বিল্ডার্স",
    vendorType: "CONTRACTOR",
    categoryCode: "CONSTRUCTION",
    categoryNameBn: "রক্ষণাবেক্ষণ ও নির্মাণ উপকরণ",
    status: "ACTIVE",
    riskLevel: "MEDIUM",
    verificationStatus: "VERIFIED",
    phone: "01733445566",
    email: "contact@rahmanbuilders.com.bd",
    addressBn: "শাসনগাছা, কুমিল্লা সদর, কুমিল্লা",
    district: "Comilla",
    country: "Bangladesh",
    tradeLicenseNo: "TRAD/COM/2023/5541",
    tinNumber: "983412095481",
    bankName: "Shahjalal Islami Bank PLC",
    bankBranch: "Comilla Branch",
    bankAccountTitle: "Rahman Builders & Construction",
    bankAccountNumberMasked: "•••• •••• 1123",
    contacts: [
      {
        id: "cnt-4",
        name: "ইঞ্জি: মো: আতিকুর রহমান",
        designation: "প্রধান প্রকৌশলী ও সিইও",
        phone: "01733445566",
        isPrimary: true,
        isActive: true,
      },
    ],
    verifications: [
      {
        id: "vfc-4",
        type: "CONTRACT_COMPLIANCE",
        titleBn: "নির্মাণ কাজের লাইসেন্স ও নিরাপত্তা সরঞ্জাম",
        status: "VERIFIED",
        verifiedBy: "উন্নয়ন কমিটি",
        verifiedAt: "2026-02-01T11:00:00Z",
      },
    ],
    documents: [],
    complianceRecords: [],
    ratingSummary: {
      totalOrdersFulfilled: 5,
      onTimeDeliveryRate: 90,
      qualityComplianceRate: 95,
      disputeCount: 0,
      averageResponseDays: 2.0,
    },
    notes: "মাদরাসার নতুন অ্যাকাডেমিক ভবন সম্প্রসারণ ও চুনকাম কাজের অনুমোদিত ঠিকাদার।",
    createdBy: "admin",
    createdAt: "2026-02-01T09:00:00Z",
    updatedBy: "admin",
    updatedAt: "2026-02-01T11:00:00Z",
  },
  {
    id: "EHRJ-VEN-2026-0004",
    vendorCode: "VEN-2026-0004",
    legalNameBn: "মেঘনা টেকনোলজি অ্যান্ড কম্পিউটার ল্যাব সলিউশনস",
    legalNameEn: "Meghna Technology & Computer Lab Solutions",
    displayName: "মেঘনা টেকনোলজি",
    vendorType: "DISTRIBUTOR",
    categoryCode: "IT",
    categoryNameBn: "কম্পিউটার ও আইটি এক্সেসরিজ",
    status: "ACTIVE",
    riskLevel: "LOW",
    verificationStatus: "VERIFIED",
    phone: "01744556677",
    email: "sales@meghnatech.com.bd",
    addressBn: "মুকাম ভ্যালি শপিং কমপ্লেক্স, দাউদকান্দি, কুমিল্লা",
    district: "Comilla",
    country: "Bangladesh",
    contacts: [
      {
        id: "cnt-5",
        name: "জনাব মো: সজীব আহমেদ",
        designation: "সেলস ম্যানেজার",
        phone: "01744556677",
        isPrimary: true,
        isActive: true,
      },
    ],
    verifications: [
      {
        id: "vfc-5",
        type: "TRADE_LICENSE",
        titleBn: "আইটি ব্যবসা ট্রেড লাইসেন্স",
        status: "VERIFIED",
        verifiedBy: "আইটি বিভাগ",
        verifiedAt: "2026-01-20T10:00:00Z",
      },
    ],
    documents: [],
    complianceRecords: [],
    ratingSummary: {
      totalOrdersFulfilled: 8,
      onTimeDeliveryRate: 95,
      qualityComplianceRate: 97,
      disputeCount: 0,
      averageResponseDays: 1.0,
    },
    notes: "অফিস কম্পিউটার, প্রিন্টার ও সিসিটিভি ক্যামেরার অনুমোদিত হার্ডওয়্যার ভেন্ডর।",
    createdBy: "admin",
    createdAt: "2026-01-18T10:00:00Z",
    updatedBy: "admin",
    updatedAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "EHRJ-VEN-2026-0005",
    vendorCode: "VEN-2026-0005",
    legalNameBn: "যমুনা স্যানিটারি অ্যান্ড হার্ডওয়্যার স্টোর",
    legalNameEn: "Jamuna Sanitary & Hardware Store",
    displayName: "যমুনা স্যানিটারি",
    vendorType: "LOCAL_VENDOR",
    categoryCode: "PLUMBING",
    categoryNameBn: "প্লাম্বিং ও পানি ব্যবস্থাপনা সামগ্রী",
    status: "PENDING_VERIFICATION",
    riskLevel: "LOW",
    verificationStatus: "PENDING",
    phone: "01755667788",
    addressBn: "ইলিয়টগঞ্জ বাস স্ট্যান্ড সংলগ্ন, দাউদকান্দি",
    district: "Comilla",
    country: "Bangladesh",
    contacts: [
      {
        id: "cnt-6",
        name: "মো: জামিল মিয়া",
        designation: "ম্যানেজার",
        phone: "01755667788",
        isPrimary: true,
        isActive: true,
      },
    ],
    verifications: [
      {
        id: "vfc-6",
        type: "TRADE_LICENSE",
        titleBn: "ট্রেড লাইসেন্স যাচাই",
        status: "PENDING",
        notes: "কাগজপত্র পর্যালোচনায় রয়েছে",
      },
    ],
    documents: [],
    complianceRecords: [],
    ratingSummary: {
      totalOrdersFulfilled: 0,
      onTimeDeliveryRate: 0,
      qualityComplianceRate: 0,
      disputeCount: 0,
      averageResponseDays: 0,
    },
    notes: "নতুন তালিকাভুক্ত স্থানীয় স্যানিটারি ভেন্ডর।",
    createdBy: "admin",
    createdAt: "2026-02-10T12:00:00Z",
    updatedBy: "admin",
    updatedAt: "2026-02-10T12:00:00Z",
  },
];

const SEED_RFQS: RFQ[] = [
  {
    id: "EHRJ-RFQ-2026-0001",
    rfqCode: "RFQ-2026-0001",
    titleBn: "২০২৬-২০২৭ শিক্ষাবর্ষের বার্ষিক পাঠ্যবই, খাতা ও ডায়েরি মুদ্রণ",
    titleEn: "Annual Academic Books, Notebooks & Diary Printing 2026-2027",
    descriptionBn: "মাদরাসার হিফজ ও কিতাব বিভাগের শিক্ষার্থীদের জন্য ২০২৬-২৭ সেশনের খাতা, কিতাব ও ডায়রি মুদ্রণ এবং সরবরাহ কোটেশন আহ্বান।",
    categoryCode: "BOOKS",
    fundCode: "GENERAL",
    status: "AWARDED",
    submissionDeadline: "2026-03-15T18:00:00Z",
    items: [
      {
        id: "item-1",
        nameBn: "মাদরাসা মনোগ্রামযুক্ত অফসেট খাতা (১২০ পৃষ্ঠা)",
        specification: "৮০ জিএসএম অফসেট কাগজ, ৪ কালার কভার লেমিনেশনসহ",
        quantity: 2000,
        unit: "PCS",
        targetUnitBudget: 60,
      },
      {
        id: "item-2",
        nameBn: "শিক্ষার্থী বার্ষিক ডায়েরি ও পাঠ পরিকল্পনা",
        specification: "ডিমাই সাইজ, ১২০ পৃষ্ঠা, হার্ডবাউন্ড ফয়েল প্রিন্টিং",
        quantity: 600,
        unit: "PCS",
        targetUnitBudget: 150,
      },
    ],
    evaluationCriteria: [
      { id: "crt-1", nameBn: "মূল্য ও ছাড় হার (Price & Discounts)", weightPercent: 40, description: "মোট উদ্ধৃত মূল্য এবং বিশেষ ছাড়" },
      { id: "crt-2", nameBn: "কাগজ ও মুদ্রণ মান (Quality & GSM)", weightPercent: 30, description: "নমুনা কপির ফিনিশিং ও বাঁধাই মান" },
      { id: "crt-3", nameBn: "সরবরাহ সময়সীমা (Delivery Time)", weightPercent: 20, description: "ক্লাস শুরুর পূর্বে সরবরাহের নিশ্চয়তা" },
      { id: "crt-4", nameBn: "ওয়ারেন্টি ও সেবা (Warranty & Service)", weightPercent: 10, description: "ত্রুটিপূর্ণ খাতা বিনাবাক্যে প্রতিস্থাপনের শর্ত" },
    ],
    invitedVendorIds: ["EHRJ-VEN-2026-0001"],
    awardedQuotationId: "EHRJ-QUO-2026-0001",
    awardedVendorId: "EHRJ-VEN-2026-0001",
    awardNotes: "কমিটির সিদ্ধান্ত অনুযায়ী সর্বোচ্চ মান ও দ্রুততম সময়ে সরবরাহ করায় নির্বাচিত।",
    createdBy: "admin",
    createdAt: "2026-02-15T10:00:00Z",
    approvedBy: "principal",
    approvedAt: "2026-02-18T12:00:00Z",
    updatedAt: "2026-03-20T10:00:00Z",
  },
];

const SEED_QUOTATIONS: Quotation[] = [
  {
    id: "EHRJ-QUO-2026-0001",
    quotationCode: "QUO-2026-0001",
    rfqId: "EHRJ-RFQ-2026-0001",
    rfqTitleBn: "২০২৬-২০২৭ শিক্ষাবর্ষের বার্ষিক পাঠ্যবই, খাতা ও ডায়েরি মুদ্রণ",
    vendorId: "EHRJ-VEN-2026-0001",
    vendorNameBn: "কুমিল্লা মডার্ন প্রেস অ্যান্ড পাবলিকেশন্স",
    versionNumber: 1,
    status: "ACCEPTED",
    quotationDate: "2026-02-25",
    validUntilDate: "2026-04-30",
    items: [
      {
        rfqItemId: "item-1",
        itemDescriptionBn: "মাদরাসা মনোগ্রামযুক্ত অফসেট খাতা (১২০ পৃষ্ঠা)",
        quantity: 2000,
        unit: "PCS",
        unitPrice: 55,
        taxAmount: 0,
        discountAmount: 4000,
        lineTotal: 106000,
        warrantyPeriod: "ত্রুটিহীন গ্যারান্টি",
      },
      {
        rfqItemId: "item-2",
        itemDescriptionBn: "শিক্ষার্থী বার্ষিক ডায়েরি ও পাঠ পরিকল্পনা",
        quantity: 600,
        unit: "PCS",
        unitPrice: 140,
        taxAmount: 0,
        discountAmount: 2000,
        lineTotal: 82000,
        warrantyPeriod: "১ বছর বাঁধাই গ্যারান্টি",
      },
    ],
    subTotal: 194000,
    totalTax: 0,
    totalDiscount: 6000,
    deliveryCharge: 0,
    netTotalAmount: 188000,
    deliveryTimeDays: 14,
    warrantyPeriodMonths: 12,
    paymentTermsBn: "ডেলিভারি গ্রহণের পর ৫০% এবং অবশিষ্ট ১৫ দিনের মধ্যে ব্যাংক ট্রান্সফার।",
    submittedBy: "মো: রফিকুল ইসলাম",
    submittedAt: "2026-02-25T11:00:00Z",
    createdAt: "2026-02-25T11:00:00Z",
    updatedAt: "2026-03-20T10:00:00Z",
  },
];

const SEED_CONTRACTS: Contract[] = [
  {
    id: "EHRJ-CON-2026-0001",
    contractCode: "CON-2026-0001",
    vendorId: "EHRJ-VEN-2026-0002",
    vendorNameBn: "ইলিয়টগঞ্জ এগ্রো ফুড অ্যান্ড গ্রেইন সাপ্লায়ার্স",
    titleBn: "লিল্লাহ বোর্ডিং ও এতিমখানা বার্ষিক খাদ্যশস্য সরবরাহ চুক্তি ২০২৬-২৭",
    titleEn: "Annual Food & Grain Supply Contract for Lillah Boarding 2026-27",
    contractType: "SUPPLY",
    status: "ACTIVE",
    currentVersion: 1,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    renewalDate: "2026-11-30",
    totalContractValue: 2400000,
    currency: "BDT",
    paymentTermsBn: "প্রতি মাসের চালানের বিপরীতে মাসিক বিল সমন্বয়ের মাধ্যমে পরিশোধ।",
    deliverables: [
      {
        id: "dlv-1",
        titleBn: "মাসিক চাল সরবরাহ (নাজিরশাইল ও মিনিকেট)",
        milestoneDescription: "প্রতি মাসে ৮০ বস্তা উৎকৃষ্ট মানের চাল সরবরাহ",
        targetDate: "2026-12-31",
        allocatedValueBdt: 1600000,
        isCompleted: false,
      },
      {
        id: "dlv-2",
        titleBn: "মাসিক ডাল, তেল ও মশলা সরবরাহ",
        milestoneDescription: "পবিত্র ও স্বাস্থ্যসম্মত নিত্যপ্রয়োজনীয় রান্না সামগ্রী",
        targetDate: "2026-12-31",
        allocatedValueBdt: 800000,
        isCompleted: false,
      },
    ],
    obligations: [
      {
        id: "obg-1",
        obligationType: "DELIVERY",
        titleBn: "প্রতি মাসের ১ থেকে ৫ তারিখের মধ্যে খাদ্যগুদামে আনলোড সম্পন্ন করা",
        dueDate: "প্রতি মাসের ৫ তারিখ",
        status: "PENDING",
      },
      {
        id: "obg-2",
        obligationType: "COMPLIANCE",
        titleBn: "পণ্যের মান ও ওজনে হেরফের না করার অঙ্গীকার",
        dueDate: "2026-12-31",
        status: "PENDING",
      },
    ],
    versions: [
      {
        versionNumber: 1,
        effectiveDate: "2026-01-01",
        changeReason: "প্রাথমিক অনুমোদিত বার্ষিক চুক্তি সম্পাদন",
        totalContractValue: 2400000,
        paymentTerms: "মাসিক বিল সমন্বয়ের মাধ্যমে পরিশোধ।",
        approvedBy: "principal",
        approvedAt: "2025-12-28T10:00:00Z",
        createdAt: "2025-12-28T10:00:00Z",
      },
    ],
    renewalReminders: [
      { reminderDays: 90, targetDate: "2026-10-01", isTriggered: false },
      { reminderDays: 60, targetDate: "2026-11-01", isTriggered: false },
      { reminderDays: 30, targetDate: "2026-12-01", isTriggered: false },
    ],
    threeWayMatchStatus: "MATCHED",
    ownerName: "মুফতি মোহাম্মদ সাইফুল্লাহ (অধ্যক্ষ)",
    notes: "মাদরাসার লিল্লাহ বোর্ডিংয়ের শিক্ষার্থীদের নির্বিঘ্ন পুষ্টি নিশ্চিতকরণে সম্পাদিত চুক্তি।",
    createdBy: "admin",
    createdAt: "2025-12-28T10:00:00Z",
    approvedBy: "principal",
    approvedAt: "2025-12-28T12:00:00Z",
    updatedBy: "admin",
    updatedAt: "2026-01-01T08:00:00Z",
  },
];

// =================================================================
// PROCUREMENT STORE METHODS
// =================================================================

export class ProcurementStore {
  // --- Vendors ---
  static getVendors(): Vendor[] {
    return readJsonFile<Vendor[]>(VENDORS_FILE, SEED_VENDORS);
  }

  static getVendorById(id: string): Vendor | undefined {
    return this.getVendors().find((v) => v.id === id);
  }

  static saveVendor(vendor: Vendor, actor?: ActorContext): Vendor {
    const list = this.getVendors();
    const idx = list.findIndex((v) => v.id === vendor.id);
    const now = new Date().toISOString();

    if (idx >= 0) {
      list[idx] = { ...vendor, updatedAt: now, updatedBy: actor?.actorId || vendor.updatedBy };
    } else {
      list.push({ ...vendor, createdAt: now, updatedAt: now });
    }

    writeJsonFile(VENDORS_FILE, list);

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now,
        entityType: "VENDOR",
        entityId: vendor.id,
        action: idx >= 0 ? "UPDATE_VENDOR" : "CREATE_VENDOR",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `ভেন্ডর রেকর্ড ${idx >= 0 ? "হালনাগাদ" : "তৈরি"} করা হয়েছে: ${vendor.legalNameBn}`,
      });
    }

    return vendor;
  }

  static findDuplicateVendors(candidate: {
    legalNameBn?: string;
    phone?: string;
    email?: string;
    tradeLicenseNo?: string;
    tinNumber?: string;
    excludeId?: string;
  }): { vendor: Vendor; matchedFields: string[] }[] {
    const list = this.getVendors();
    const results: { vendor: Vendor; matchedFields: string[] }[] = [];

    for (const v of list) {
      if (candidate.excludeId && v.id === candidate.excludeId) continue;
      const matched: string[] = [];

      if (candidate.legalNameBn && v.legalNameBn.trim().toLowerCase() === candidate.legalNameBn.trim().toLowerCase()) {
        matched.push("legalNameBn");
      }
      if (candidate.phone && v.phone.replace(/[\s-]/g, "") === candidate.phone.replace(/[\s-]/g, "")) {
        matched.push("phone");
      }
      if (candidate.email && v.email && candidate.email.trim().toLowerCase() === v.email.trim().toLowerCase()) {
        matched.push("email");
      }
      if (candidate.tradeLicenseNo && v.tradeLicenseNo && candidate.tradeLicenseNo.trim() === v.tradeLicenseNo.trim()) {
        matched.push("tradeLicenseNo");
      }
      if (candidate.tinNumber && v.tinNumber && candidate.tinNumber.trim() === v.tinNumber.trim()) {
        matched.push("tinNumber");
      }

      if (matched.length > 0) {
        results.push({ vendor: v, matchedFields: matched });
      }
    }

    return results;
  }

  // --- RFQs ---
  static getRFQs(): RFQ[] {
    return readJsonFile<RFQ[]>(RFQS_FILE, SEED_RFQS);
  }

  static getRFQById(id: string): RFQ | undefined {
    return this.getRFQs().find((r) => r.id === id);
  }

  static saveRFQ(rfq: RFQ, actor?: ActorContext): RFQ {
    const list = this.getRFQs();
    const idx = list.findIndex((r) => r.id === rfq.id);
    const now = new Date().toISOString();

    if (idx >= 0) {
      list[idx] = { ...rfq, updatedAt: now };
    } else {
      list.push({ ...rfq, createdAt: now, updatedAt: now });
    }

    writeJsonFile(RFQS_FILE, list);

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now,
        entityType: "RFQ",
        entityId: rfq.id,
        action: idx >= 0 ? "UPDATE_RFQ" : "CREATE_RFQ",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `RFQ কোটেশন বিজ্ঞপ্তি ${idx >= 0 ? "হালনাগাদ" : "তৈরি"}: ${rfq.titleBn}`,
      });
    }

    return rfq;
  }

  // --- Quotations ---
  static getQuotations(): Quotation[] {
    return readJsonFile<Quotation[]>(QUOTATIONS_FILE, SEED_QUOTATIONS);
  }

  static getQuotationsByRFQ(rfqId: string): Quotation[] {
    return this.getQuotations().filter((q) => q.rfqId === rfqId);
  }

  static getQuotationById(id: string): Quotation | undefined {
    return this.getQuotations().find((q) => q.id === id);
  }

  static saveQuotation(quotation: Quotation, actor?: ActorContext): Quotation {
    const list = this.getQuotations();
    const idx = list.findIndex((q) => q.id === quotation.id);
    const now = new Date().toISOString();

    if (idx >= 0) {
      list[idx] = { ...quotation, updatedAt: now };
    } else {
      list.push({ ...quotation, createdAt: now, updatedAt: now });
    }

    writeJsonFile(QUOTATIONS_FILE, list);

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now,
        entityType: "QUOTATION",
        entityId: quotation.id,
        action: idx >= 0 ? "UPDATE_QUOTATION" : "SUBMIT_QUOTATION",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `ভেন্ডর কোটেশন (v${quotation.versionNumber}) সংরক্ষিত: ৳${quotation.netTotalAmount.toLocaleString("bn-BD")}`,
      });
    }

    return quotation;
  }

  // --- Evaluations ---
  static getEvaluations(): ProcurementEvaluation[] {
    return readJsonFile<ProcurementEvaluation[]>(EVALUATIONS_FILE, []);
  }

  static getEvaluationByRFQ(rfqId: string): ProcurementEvaluation | undefined {
    return this.getEvaluations().find((e) => e.rfqId === rfqId);
  }

  static saveEvaluation(evalDoc: ProcurementEvaluation, actor?: ActorContext): ProcurementEvaluation {
    const list = this.getEvaluations();
    const idx = list.findIndex((e) => e.id === evalDoc.id);
    const now = new Date().toISOString();

    if (idx >= 0) {
      list[idx] = { ...evalDoc, updatedAt: now };
    } else {
      list.push({ ...evalDoc, createdAt: now, updatedAt: now });
    }

    writeJsonFile(EVALUATIONS_FILE, list);

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now,
        entityType: "EVALUATION",
        entityId: evalDoc.id,
        action: "RECORD_EVALUATION",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `প্রকিউরমেন্ট মূল্যায়ন ও সুপারিশ নথিভুক্ত: প্রস্তাবিত ভেন্ডর ${evalDoc.recommendedVendorName}`,
      });
    }

    return evalDoc;
  }

  // --- Contracts ---
  static getContracts(): Contract[] {
    return readJsonFile<Contract[]>(CONTRACTS_FILE, SEED_CONTRACTS);
  }

  static getContractById(id: string): Contract | undefined {
    return this.getContracts().find((c) => c.id === id);
  }

  static saveContract(contract: Contract, actor?: ActorContext): Contract {
    const list = this.getContracts();
    const idx = list.findIndex((c) => c.id === contract.id);
    const now = new Date().toISOString();

    if (idx >= 0) {
      list[idx] = { ...contract, updatedAt: now, updatedBy: actor?.actorId || contract.updatedBy };
    } else {
      list.push({ ...contract, createdAt: now, updatedAt: now });
    }

    writeJsonFile(CONTRACTS_FILE, list);

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now,
        entityType: "CONTRACT",
        entityId: contract.id,
        action: idx >= 0 ? "UPDATE_CONTRACT" : "CREATE_CONTRACT",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `চুক্তিপত্র (v${contract.currentVersion}) ${idx >= 0 ? "হালনাগাদ" : "তৈরি"}: ${contract.titleBn}`,
      });
    }

    return contract;
  }

  // --- Reviews & Risk ---
  static getReviews(): VendorPerformanceReview[] {
    return readJsonFile<VendorPerformanceReview[]>(REVIEWS_FILE, []);
  }

  static saveReview(review: VendorPerformanceReview, actor?: ActorContext): VendorPerformanceReview {
    const list = this.getReviews();
    list.push(review);
    writeJsonFile(REVIEWS_FILE, list);

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        entityType: "PERFORMANCE",
        entityId: review.id,
        action: "RECORD_PERFORMANCE_REVIEW",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `ভেন্ডর পারফরম্যান্স পর্যালোচনা সংরক্ষিত: ${review.vendorName} (${review.reviewPeriod})`,
      });
    }

    return review;
  }

  static getRisks(): VendorRiskRecord[] {
    return readJsonFile<VendorRiskRecord[]>(RISKS_FILE, []);
  }

  static saveRisk(risk: VendorRiskRecord): VendorRiskRecord {
    const list = this.getRisks();
    const idx = list.findIndex((r) => r.id === risk.id);
    if (idx >= 0) {
      list[idx] = risk;
    } else {
      list.push(risk);
    }
    writeJsonFile(RISKS_FILE, list);
    return risk;
  }

  // --- Conflicts ---
  static getConflicts(): ConflictDeclaration[] {
    return readJsonFile<ConflictDeclaration[]>(CONFLICTS_FILE, []);
  }

  static saveConflict(conflict: ConflictDeclaration, actor?: ActorContext): ConflictDeclaration {
    const list = this.getConflicts();
    const idx = list.findIndex((c) => c.id === conflict.id);
    if (idx >= 0) {
      list[idx] = conflict;
    } else {
      list.push(conflict);
    }
    writeJsonFile(CONFLICTS_FILE, list);

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        entityType: "CONFLICT",
        entityId: conflict.id,
        action: "DECLARE_CONFLICT",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `স্বার্থের দ্বন্দ্ব ঘোষণা সংরক্ষিত: ${conflict.declarantName} (${conflict.hasConflict ? "স্বার্থ আছে" : "স্বার্থমুক্ত"})`,
      });
    }

    return conflict;
  }

  // --- Audit Log ---
  static getAuditLogs(): ProcurementAuditEntry[] {
    return readJsonFile<ProcurementAuditEntry[]>(AUDIT_FILE, []);
  }

  static recordAudit(entry: ProcurementAuditEntry): void {
    const list = this.getAuditLogs();
    list.unshift(entry); // newest first
    if (list.length > 500) list.pop(); // keep last 500 entries
    writeJsonFile(AUDIT_FILE, list);
  }

  // --- Dashboard Aggregations ---
  static getDashboardStats(): ProcurementDashboardStats {
    const vendors = this.getVendors();
    const rfqs = this.getRFQs();
    const quotations = this.getQuotations();
    const contracts = this.getContracts();
    const audits = this.getAuditLogs();
    const evaluations = this.getEvaluations();

    const activeVendors = vendors.filter((v) => v.status === "ACTIVE").length;
    const pendingVerifications = vendors.filter((v) => v.verificationStatus === "PENDING").length;
    const activeRfqs = rfqs.filter((r) => r.status === "OPEN" || r.status === "EVALUATION").length;
    const pendingQuotations = quotations.filter((q) => q.status === "SUBMITTED" || q.status === "UNDER_EVALUATION").length;
    const activeContracts = contracts.filter((c) => c.status === "ACTIVE").length;
    const expiringContracts = contracts.filter((c) => c.status === "EXPIRING").length;

    const totalContractVal = contracts
      .filter((c) => c.status === "ACTIVE" || c.status === "APPROVED")
      .reduce((sum, c) => sum + c.totalContractValue, 0);

    const onTimeRates = vendors
      .filter((v) => v.ratingSummary.totalOrdersFulfilled > 0)
      .map((v) => v.ratingSummary.onTimeDeliveryRate);
    const avgOnTime = onTimeRates.length > 0 ? onTimeRates.reduce((a, b) => a + b, 0) / onTimeRates.length : 95;

    const pendingEvals = evaluations.filter((e) => e.decisionStatus === "PENDING_APPROVAL").length;

    return {
      activeVendorsCount: activeVendors,
      pendingVerificationsCount: pendingVerifications,
      activeRfqsCount: activeRfqs,
      pendingQuotationsCount: pendingQuotations,
      activeContractsCount: activeContracts,
      expiringContractsCount: expiringContracts,
      totalContractValueBdt: totalContractVal,
      averageOnTimeDeliveryRate: Math.round(avgOnTime),
      pendingEvaluationsCount: pendingEvals,
      totalAuditEntriesCount: audits.length,
    };
  }
}
