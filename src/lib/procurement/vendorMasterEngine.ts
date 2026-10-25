/**
 * EHRJ MADRASHA ERP — PHASE 40
 * Vendor Master Engine
 * 
 * Governs Vendor Onboarding, Verification, Contacts, Document References,
 * Duplicate Detection, and Status Lifecycle.
 */

import { ProcurementStore } from "./procurementStore";
import {
  Vendor,
  VendorStatus,
  VendorCategoryCode,
  VendorType,
  VendorContact,
  VendorVerificationRecord,
  VendorDocumentReference,
  ActorContext,
} from "./types";

export class VendorMasterEngine {
  /**
   * Generates next institutional Vendor ID: EHRJ-VEN-YYYY-XXXX
   */
  static generateNextVendorId(year = new Date().getFullYear()): string {
    const vendors = ProcurementStore.getVendors();
    const prefix = `EHRJ-VEN-${year}-`;
    const yearVendors = vendors.filter((v) => v.id.startsWith(prefix));
    let maxSeq = 0;

    for (const v of yearVendors) {
      const parts = v.id.split("-");
      const seq = parseInt(parts[3], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(4, "0");
    return `${prefix}${nextSeq}`;
  }

  /**
   * Masks bank account number for security: e.g. "•••• •••• 4589"
   */
  static maskBankAccountNumber(accountNo?: string): string | undefined {
    if (!accountNo) return undefined;
    const clean = accountNo.trim();
    if (clean.length <= 4) return clean;
    const lastFour = clean.slice(-4);
    return `•••• •••• ${lastFour}`;
  }

  /**
   * Creates a new Vendor with duplicate checking and ID assignment
   */
  static createVendor(
    data: {
      legalNameBn: string;
      legalNameEn?: string;
      displayName?: string;
      vendorType: VendorType;
      categoryCode: VendorCategoryCode;
      categoryNameBn?: string;
      phone: string;
      altPhone?: string;
      email?: string;
      addressBn: string;
      district?: string;
      country?: string;
      tradeLicenseNo?: string;
      tinNumber?: string;
      binVatNumber?: string;
      bankName?: string;
      bankBranch?: string;
      bankAccountTitle?: string;
      bankAccountNumber?: string;
      notes?: string;
      primaryContact?: {
        name: string;
        designation: string;
        phone: string;
        email?: string;
      };
    },
    actor: ActorContext
  ): { vendor: Vendor; duplicateWarnings: { vendor: Vendor; matchedFields: string[] }[] } {
    // 1. Duplicate check
    const duplicateWarnings = ProcurementStore.findDuplicateVendors({
      legalNameBn: data.legalNameBn,
      phone: data.phone,
      email: data.email,
      tradeLicenseNo: data.tradeLicenseNo,
      tinNumber: data.tinNumber,
    });

    // 2. Generate ID
    const vendorId = this.generateNextVendorId();
    const vendorSeqCode = vendorId.replace("EHRJ-", "");
    const now = new Date().toISOString();

    const contacts: VendorContact[] = [];
    if (data.primaryContact) {
      contacts.push({
        id: `cnt-${Date.now()}-1`,
        name: data.primaryContact.name,
        designation: data.primaryContact.designation,
        phone: data.primaryContact.phone,
        email: data.primaryContact.email,
        isPrimary: true,
        isActive: true,
      });
    }

    const initialVerifications: VendorVerificationRecord[] = [
      {
        id: `vfc-${Date.now()}-1`,
        type: "IDENTITY",
        titleBn: "প্রাতিষ্ঠানিক পরিচয় ও নিবন্ধন যাচাই",
        status: "PENDING",
      },
    ];

    if (data.tradeLicenseNo) {
      initialVerifications.push({
        id: `vfc-${Date.now()}-2`,
        type: "TRADE_LICENSE",
        titleBn: "ট্রেড লাইসেন্স সত্যতা যাচাই",
        status: "PENDING",
      });
    }

    const newVendor: Vendor = {
      id: vendorId,
      vendorCode: vendorSeqCode,
      legalNameBn: data.legalNameBn.trim(),
      legalNameEn: data.legalNameEn?.trim() || data.legalNameBn.trim(),
      displayName: data.displayName?.trim() || data.legalNameBn.trim(),
      vendorType: data.vendorType,
      categoryCode: data.categoryCode,
      categoryNameBn: data.categoryNameBn || data.categoryCode,
      status: "PENDING_VERIFICATION", // Controlled onboarding default
      riskLevel: "LOW",
      verificationStatus: "PENDING",
      phone: data.phone.trim(),
      altPhone: data.altPhone?.trim(),
      email: data.email?.trim(),
      addressBn: data.addressBn.trim(),
      district: data.district || "Comilla",
      country: data.country || "Bangladesh",
      tradeLicenseNo: data.tradeLicenseNo?.trim(),
      tinNumber: data.tinNumber?.trim(),
      binVatNumber: data.binVatNumber?.trim(),
      bankName: data.bankName?.trim(),
      bankBranch: data.bankBranch?.trim(),
      bankAccountTitle: data.bankAccountTitle?.trim(),
      bankAccountNumberMasked: this.maskBankAccountNumber(data.bankAccountNumber),
      contacts,
      verifications: initialVerifications,
      documents: [],
      complianceRecords: [],
      ratingSummary: {
        totalOrdersFulfilled: 0,
        onTimeDeliveryRate: 100,
        qualityComplianceRate: 100,
        disputeCount: 0,
        averageResponseDays: 1,
      },
      notes: data.notes,
      createdBy: actor.actorId,
      createdAt: now,
      updatedBy: actor.actorId,
      updatedAt: now,
    };

    ProcurementStore.saveVendor(newVendor, actor);
    return { vendor: newVendor, duplicateWarnings };
  }

  /**
   * Updates Vendor status with strict state machine validation
   */
  static transitionVendorStatus(
    vendorId: string,
    targetStatus: VendorStatus,
    reasonBn: string,
    actor: ActorContext
  ): Vendor {
    const vendor = ProcurementStore.getVendorById(vendorId);
    if (!vendor) {
      throw new Error(`Vendor not found: ${vendorId}`);
    }

    // Validation rules
    if (vendor.status === "ARCHIVED") {
      throw new Error("আর্কাইভকৃত ভেন্ডরের স্ট্যাটাস পরিবর্তন করা যাবে না।");
    }

    if (targetStatus === "ACTIVE" && vendor.verificationStatus === "REJECTED") {
      throw new Error("ভেরিফিকেশন বাতিল হওয়া ভেন্ডরকে সক্রিয় করা যাবে না। পুনরায় যাচাই আবশ্যক।");
    }

    const previousStatus = vendor.status;
    vendor.status = targetStatus;
    vendor.updatedBy = actor.actorId;
    vendor.updatedAt = new Date().toISOString();

    ProcurementStore.saveVendor(vendor, {
      ...actor,
      actorRole: actor.actorRole,
    });

    ProcurementStore.recordAudit({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      entityType: "VENDOR",
      entityId: vendor.id,
      action: "STATUS_TRANSITION",
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      notes: `ভেন্ডর স্ট্যাটাস পরিবর্তন: ${previousStatus} -> ${targetStatus}. কারণ: ${reasonBn}`,
      details: { previousStatus, targetStatus, reasonBn },
    });

    return vendor;
  }

  /**
   * Records human verification outcome
   */
  static recordVerification(
    vendorId: string,
    verificationId: string,
    status: "VERIFIED" | "REJECTED",
    notes: string,
    actor: ActorContext
  ): Vendor {
    const vendor = ProcurementStore.getVendorById(vendorId);
    if (!vendor) throw new Error(`Vendor not found: ${vendorId}`);

    const vRec = vendor.verifications.find((v) => v.id === verificationId);
    const now = new Date().toISOString();

    if (vRec) {
      vRec.status = status;
      vRec.verifiedBy = actor.actorName;
      vRec.verifiedAt = now;
      vRec.notes = notes;
    } else {
      vendor.verifications.push({
        id: verificationId,
        type: "IDENTITY",
        titleBn: "প্রাতিষ্ঠানিক যাচাইকরণ",
        status,
        verifiedBy: actor.actorName,
        verifiedAt: now,
        notes,
      });
    }

    // Recompute overall verificationStatus
    const allVerified = vendor.verifications.every((v) => v.status === "VERIFIED" || v.status === "NOT_REQUIRED");
    const anyRejected = vendor.verifications.some((v) => v.status === "REJECTED");

    if (anyRejected) {
      vendor.verificationStatus = "REJECTED";
    } else if (allVerified && vendor.verifications.length > 0) {
      vendor.verificationStatus = "VERIFIED";
      // Auto promote to ACTIVE if in PENDING_VERIFICATION
      if (vendor.status === "PENDING_VERIFICATION") {
        vendor.status = "ACTIVE";
      }
    } else {
      vendor.verificationStatus = "PENDING";
    }

    ProcurementStore.saveVendor(vendor, actor);
    return vendor;
  }

  /**
   * Adds or updates a vendor contact
   */
  static upsertContact(
    vendorId: string,
    contactData: Omit<VendorContact, "id"> & { id?: string },
    actor: ActorContext
  ): Vendor {
    const vendor = ProcurementStore.getVendorById(vendorId);
    if (!vendor) throw new Error(`Vendor not found: ${vendorId}`);

    if (contactData.isPrimary) {
      // Clear other primaries
      vendor.contacts.forEach((c) => (c.isPrimary = false));
    }

    if (contactData.id) {
      const idx = vendor.contacts.findIndex((c) => c.id === contactData.id);
      if (idx >= 0) {
        vendor.contacts[idx] = { ...vendor.contacts[idx], ...contactData };
      }
    } else {
      vendor.contacts.push({
        ...contactData,
        id: `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      });
    }

    ProcurementStore.saveVendor(vendor, actor);
    return vendor;
  }

  /**
   * Attaches a Phase 29 Document Reference
   */
  static attachDocumentReference(
    vendorId: string,
    docData: {
      documentType: string;
      title: string;
      phase29DocToken?: string;
      fileName?: string;
      fileSize?: number;
      expiryDate?: string;
    },
    actor: ActorContext
  ): Vendor {
    const vendor = ProcurementStore.getVendorById(vendorId);
    if (!vendor) throw new Error(`Vendor not found: ${vendorId}`);

    const newDoc: VendorDocumentReference = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      phase29DocToken: docData.phase29DocToken,
      documentType: docData.documentType,
      title: docData.title,
      fileName: docData.fileName,
      fileSize: docData.fileSize,
      uploadedAt: new Date().toISOString(),
      expiryDate: docData.expiryDate,
      isVerified: true,
      verifiedBy: actor.actorName,
      verifiedAt: new Date().toISOString(),
    };

    vendor.documents.push(newDoc);
    ProcurementStore.saveVendor(vendor, actor);
    return vendor;
  }

  /**
   * Queries and filters vendors
   */
  static listVendors(filters?: {
    query?: string;
    category?: VendorCategoryCode;
    status?: VendorStatus;
    type?: VendorType;
  }): Vendor[] {
    let list = ProcurementStore.getVendors();

    if (filters?.category) {
      list = list.filter((v) => v.categoryCode === filters.category);
    }
    if (filters?.status) {
      list = list.filter((v) => v.status === filters.status);
    }
    if (filters?.type) {
      list = list.filter((v) => v.vendorType === filters.type);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.legalNameBn.toLowerCase().includes(q) ||
          v.legalNameEn.toLowerCase().includes(q) ||
          v.displayName.toLowerCase().includes(q) ||
          v.vendorCode.toLowerCase().includes(q) ||
          v.phone.includes(q) ||
          v.district.toLowerCase().includes(q)
      );
    }

    return list;
  }
}
