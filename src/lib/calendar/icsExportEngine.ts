/**
 * EHRJ Institutional Calendar — RFC 5545 iCalendar (ICS) Export Engine
 * Checkpoint: EHRJ-AI-2026-PHASE33
 * Generates standard-compliant iCalendar feeds for Google Calendar, Apple Calendar, and Outlook.
 */

import { CalendarEvent } from "./types";

function escapeIcsText(str?: string): string {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcsDateTime(dateStr: string, isAllDay: boolean): string {
  const d = new Date(dateStr);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());

  if (isAllDay) {
    return `VALUE=DATE:${year}${month}${day}`;
  }

  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Converts a list of authorized CalendarEvents into an RFC 5545 ICS string
 */
export function generateIcsCalendar(
  events: CalendarEvent[],
  calendarTitle: string = "EHRJ Institutional Calendar"
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EHRJ Madrasha//Institutional Calendar Engine//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarTitle)}`,
    "X-WR-TIMEZONE:Asia/Dhaka",
  ];

  const nowIcs = formatIcsDateTime(new Date().toISOString(), false);

  for (const event of events) {
    const isAllDay = event.allDay;
    const dtStart = formatIcsDateTime(event.startAt, isAllDay);
    const dtEnd = formatIcsDateTime(event.endAt, isAllDay);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@ehrjmadrasha.com`);
    lines.push(`DTSTAMP:${nowIcs}`);
    lines.push(`DTSTART${isAllDay ? ";" : ":"}${dtStart}`);
    lines.push(`DTEND${isAllDay ? ";" : ":"}${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }

    // Status mapping
    let icsStatus = "CONFIRMED";
    if (event.status === "CANCELLED") icsStatus = "CANCELLED";
    if (event.status === "DRAFT") icsStatus = "TENTATIVE";
    lines.push(`STATUS:${icsStatus}`);

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  // Format with CRLF as per RFC 5545
  return lines.join("\r\n");
}
