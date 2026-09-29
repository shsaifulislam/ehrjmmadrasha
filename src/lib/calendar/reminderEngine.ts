/**
 * EHRJ Institutional Calendar — Schedule Reminder Engine
 * Checkpoint: EHRJ-AI-2026-PHASE33
 * Manages idempotent schedule reminders and coordinates with Phase 8 / 32 Notification Engine.
 */

import { ScheduleReminder } from "./types";
import {
  getScheduleReminders,
  saveScheduleReminders,
  getCalendarEvents,
  appendCalendarAuditLog,
} from "./calendarStore";
import { dispatchNotification } from "@/lib/communicationEngine";

/**
 * Creates and registers a schedule reminder with deterministic idempotency
 */
export function registerScheduleReminder(
  eventId: string,
  recipientId: string,
  recipientRole: string,
  reminderType: "EMAIL" | "PORTAL",
  offsetMinutes: number,
  eventStartAt: string
): { success: boolean; reminder?: ScheduleReminder } {
  const reminders = getScheduleReminders();
  const id = `REM-${eventId}-${recipientId}-${offsetMinutes}`;

  // Idempotency: Check if reminder already registered
  const existing = reminders.find((r) => r.id === id);
  if (existing) {
    return { success: true, reminder: existing };
  }

  const startMs = new Date(eventStartAt).getTime();
  const scheduledTimeMs = startMs - offsetMinutes * 60 * 1000;
  const scheduledTime = new Date(scheduledTimeMs).toISOString();

  const newReminder: ScheduleReminder = {
    id,
    eventId,
    recipientId,
    recipientRole,
    reminderType,
    offsetMinutes,
    scheduledTime,
    status: "PENDING",
  };

  reminders.push(newReminder);
  saveScheduleReminders(reminders);

  return { success: true, reminder: newReminder };
}

/**
 * Evaluates pending reminders against the current clock and dispatches via Phase 8
 */
export async function evaluateAndDispatchDueReminders(
  now: Date = new Date()
): Promise<{ dispatchedCount: number; failedCount: number }> {
  const reminders = getScheduleReminders();
  const events = getCalendarEvents();
  let dispatchedCount = 0;
  let failedCount = 0;

  for (const rem of reminders) {
    if (rem.status !== "PENDING") continue;

    const schedMs = new Date(rem.scheduledTime).getTime();
    if (schedMs <= now.getTime()) {
      const event = events.find((e) => e.id === rem.eventId);
      const title = event ? event.title : "আসন্ন সূচি বা ইভেন্ট";
      const startDisplay = event ? new Date(event.startAt).toLocaleString() : "";

      try {
        await dispatchNotification({
          templateCode: "GENERAL_NOTICE",
          recipients: [
            {
              userId: rem.recipientId,
              name: "সম্মানিত ব্যবহারকারী",
              email: null,
              role: rem.recipientRole,
            },
          ],
          customTitle: `[রিমাইন্ডার] ${title}`,
          customBody: `আপনার সূচিতে থাকা ইভেন্টটি শীঘ্রই শুরু হতে যাচ্ছে (${startDisplay})। স্থান: ${event?.location || "মাদরাসা ক্যাম্পাস"}।`,
          priority: "IMPORTANT",
          variables: {},
          idempotencyBaseKey: rem.id,
        });

        rem.status = "DISPATCHED";
        rem.dispatchedAt = new Date().toISOString();
        dispatchedCount++;

        appendCalendarAuditLog({
          action: "CREATE_EVENT",
          entityType: "EVENT",
          entityId: rem.eventId,
          actorId: "REMINDER_SYSTEM",
          actorRole: "SYSTEM",
          details: `রিমাইন্ডার সফলভাবে পাঠানো হয়েছে: ${rem.id}`,
        });
      } catch (err) {
        console.error(`[ReminderEngine] Failed to dispatch ${rem.id}:`, err);
        rem.status = "FAILED";
        failedCount++;
      }
    }
  }

  saveScheduleReminders(reminders);
  return { dispatchedCount, failedCount };
}
