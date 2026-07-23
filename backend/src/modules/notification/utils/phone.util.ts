// backend/src/modules/notification/utils/phone.util.ts

/**
 * Normalizes Bangladeshi phone numbers into canonical format: "88017XXXXXXXX"
 * Returns null if the phone number is invalid.
 */
export function formatBangladeshiPhone(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;

  // Clean string: remove spaces, hyphens, parentheses, and leading plus
  let cleaned = rawPhone.replace(/[\s\-\(\)\+]/g, '').trim();

  // Handle leading 01XXXXXXXXX -> convert to 8801XXXXXXXXX
  if (/^01[3-9]\d{8}$/.test(cleaned)) {
    cleaned = '88' + cleaned;
  }

  // Final check: must match 8801[3-9]XXXXXXXX
  const match = /^88(01[3-9]\d{8})$/.exec(cleaned);
  if (match) {
    return cleaned;
  }

  return null;
}
