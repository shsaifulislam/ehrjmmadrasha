/**
 * Public Contact Form & Anti-Spam Engine
 * Bridges public inquiries directly into authoritative Helpdesk (SupportRequest)
 * Checkpoint: EHRJ-AI-2026-PHASE31
 */

import { PublicContactPayload } from "./types";
import { escapePlainText } from "./contentSanitizer";
import { prisma } from "@/lib/prisma";

// In-memory rate limiting map: ip -> timestamps
const RATE_LIMIT_MAP = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_WINDOW = 5;

export interface ContactProcessResult {
  success: boolean;
  messageBn: string;
  ticketNumber?: string;
  errorCode?: "BOT_DETECTED" | "RATE_LIMITED" | "INVALID_INPUT" | "INTERNAL_ERROR";
}

/**
 * Validates and routes public contact form to authoritative Helpdesk
 */
export async function processPublicContactSubmission(
  payload: PublicContactPayload,
  clientIp = "127.0.0.1"
): Promise<ContactProcessResult> {
  // 1. Anti-bot Honeypot check
  if (payload.honeypot && payload.honeypot.trim() !== "") {
    console.warn(`[Anti-Spam] Bot detected via honeypot from IP: ${clientIp}`);
    // Fake success to misdirect bot without creating database record
    return {
      success: true,
      messageBn: "আপনার বার্তাটি সফলভাবে গৃহীত হয়েছে।",
    };
  }

  // 2. IP Rate Limiting Check
  const now = Date.now();
  const timestamps = (RATE_LIMIT_MAP.get(clientIp) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    return {
      success: false,
      errorCode: "RATE_LIMITED",
      messageBn: "অতিরিক্ত বার্তা প্রেরণ করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।",
    };
  }

  // 3. Field Validation
  const name = escapePlainText((payload.name || "").trim());
  const email = (payload.email || "").trim().toLowerCase();
  const phone = escapePlainText((payload.phone || "").trim());
  const subject = escapePlainText((payload.subject || "").trim());
  const message = escapePlainText((payload.message || "").trim());
  const category = (payload.category || "GENERAL").toUpperCase();

  if (!name || name.length < 2) {
    return { success: false, errorCode: "INVALID_INPUT", messageBn: "অনুগ্রহ করে আপনার সঠিক নাম প্রদান করুন।" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { success: false, errorCode: "INVALID_INPUT", messageBn: "অনুগ্রহ করে একটি কার্যকর ইমেইল ঠিকানা প্রদান করুন।" };
  }

  if (!subject || subject.length < 3) {
    return { success: false, errorCode: "INVALID_INPUT", messageBn: "অনুগ্রহ করে বার্তার সঠিক বিষয় উল্লেখ করুন।" };
  }

  if (!message || message.length < 10) {
    return { success: false, errorCode: "INVALID_INPUT", messageBn: "বার্তার বিবরণ কমপক্ষে ১০ অক্ষরের হতে হবে।" };
  }

  // 4. Record submission in Rate Limiter
  timestamps.push(now);
  RATE_LIMIT_MAP.set(clientIp, timestamps);

  // 5. Connect to Authoritative Helpdesk (SupportRequest in Prisma)
  try {
    // Resolve or fallback to General Support Category
    let defaultCat = await prisma.supportRequestCategory.findFirst({
      where: { code: category },
    });
    if (!defaultCat) {
      defaultCat = await prisma.supportRequestCategory.findFirst({
        where: { code: "GENERAL" },
      });
    }

    if (!defaultCat) {
      // If categories aren't initialized yet, initialize the default ones
      try {
        const { ensureDefaultHelpdeskCategories } = await import("../helpdeskEngine");
        await ensureDefaultHelpdeskCategories();
        defaultCat = await prisma.supportRequestCategory.findFirst({
          where: { code: "GENERAL" },
        });
      } catch (catInitErr) {
        console.warn("Could not auto-seed helpdesk categories:", catInitErr);
      }
    }

    const ticketNumber = `REQ-PUB-${Date.now().toString(36).toUpperCase()}`;

    // Get an admin or system user to assign as submitter
    let systemUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
    if (!systemUser) {
      systemUser = await prisma.user.findFirst();
    }

    if (defaultCat && systemUser) {
      await prisma.supportRequest.create({
        data: {
          ticketNumber,
          subject: `[পাবলিক ওয়েবসাইট যোগাযোগ] ${subject}`,
          description: `প্রেরক: ${name}\nইমেইল: ${email}\nফোন: ${phone || "প্রদত্ত হয়নি"}\nক্যাটাগরি: ${category}\nআইপি: ${clientIp}\n\nবার্তা:\n${message}`,
          priority: "NORMAL",
          status: "SUBMITTED",
          requestType: "FEEDBACK",
          categoryId: defaultCat.id,
          submittedByUserId: systemUser.id,
          assignedToUserId: systemUser.id,
        },
      });
    }

    return {
      success: true,
      ticketNumber,
      messageBn: `ধন্যবাদ ${name}! আপনার বার্তাটি সফলভাবে গৃহীত হয়েছে। রেফারেন্স কোড: ${ticketNumber}`,
    };
  } catch (err) {
    console.error("Error creating Helpdesk ticket for contact message:", err);
    return {
      success: false,
      errorCode: "INTERNAL_ERROR",
      messageBn: "বার্তা প্রেরণে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে সরাসরি আমাদের ফোন নম্বরে যোগাযোগ করুন।",
    };
  }
}
