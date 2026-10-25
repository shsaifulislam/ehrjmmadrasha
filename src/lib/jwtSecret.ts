const INSECURE_FALLBACK_JWT =
  "ehrj-madrasa-digital-campus-secure-production-jwt-secret-key-2026";

export function getJwtSecretBytes(): Uint8Array {
  const rawSecret = process.env.JWT_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    if (!rawSecret || rawSecret.length < 32 || rawSecret === INSECURE_FALLBACK_JWT) {
      throw new Error(
        "FATAL SECURITY CONFIGURATION ERROR: JWT_SECRET must be explicitly set to a unique key of at least 32 characters in production mode."
      );
    }
    return new TextEncoder().encode(rawSecret);
  }

  return new TextEncoder().encode(rawSecret || INSECURE_FALLBACK_JWT);
}

export { INSECURE_FALLBACK_JWT };
