/**
 * EHRJ DIGITAL CAMPUS & ERP — PAYMENT INFRASTRUCTURE
 * Provider-Specific Webhook & Signature Verifier
 *
 * Implements strict separation:
 * 1. bKash (AWS SNS / Tokenized PGW verification)
 * 2. Nagad (RSA-SHA256 asymmetric signature verification)
 * 3. Internal / Bank Bridge (HMAC-SHA256 timing-safe comparison)
 */

import crypto from "crypto";
import { getWebhookSigningSecret } from "@/lib/env";

export interface VerificationResult {
  isValid: boolean;
  provider: "BKASH" | "NAGAD" | "BANK" | "INTERNAL";
  error?: string;
}

export class BkashWebhookVerifier {
  /**
   * Validates bKash AWS SNS Notification callbacks.
   * Invariants:
   * 1. SigningCertURL must match official amazonaws.com host (SSRF protection).
   * 2. Signature must verify against SNS signing specification.
   */
  public static async verify(body: any, headers: Headers): Promise<VerificationResult> {
    try {
      // 1. AWS SNS Type Check
      const snsType = headers.get("x-amz-sns-message-type") || body?.Type;
      if (snsType === "Notification" || snsType === "SubscriptionConfirmation") {
        const certUrl = body?.SigningCertURL;
        if (!certUrl || typeof certUrl !== "string") {
          return { isValid: false, provider: "BKASH", error: "Missing bKash/SNS SigningCertURL" };
        }

        // SSRF Guard: Ensure URL is strictly an Amazon SNS certificate endpoint
        const parsedUrl = new URL(certUrl);
        if (
          parsedUrl.protocol !== "https:" ||
          !parsedUrl.hostname.endsWith(".amazonaws.com")
        ) {
          return {
            isValid: false,
            provider: "BKASH",
            error: "Security Alert: Invalid bKash SigningCertURL host domain.",
          };
        }

        // In sandbox or offline dev environments without live cert fetching:
        if (process.env.NODE_ENV !== "production" && (!body.Signature || body.Signature === "SANDBOX_MOCK_SIG")) {
          return { isValid: true, provider: "BKASH" };
        }

        // Live RSA verification against SNS payload
        // Build canonical string for Notification
        let canonical = "";
        if (snsType === "Notification") {
          canonical = `Message\n${body.Message}\nMessageId\n${body.MessageId}\nTimestamp\n${body.Timestamp}\nTopicArn\n${body.TopicArn}\nType\n${body.Type}\n`;
        } else {
          canonical = `Message\n${body.Message}\nMessageId\n${body.MessageId}\nSubscribeURL\n${body.SubscribeURL}\nTimestamp\n${body.Timestamp}\nToken\n${body.Token}\nTopicArn\n${body.TopicArn}\nType\n${body.Type}\n`;
        }

        const certRes = await fetch(certUrl, { signal: AbortSignal.timeout(8000) });
        const certPem = await certRes.text();
        const verifier = crypto.createVerify("SHA1WithRSAEncryption");
        verifier.update(canonical, "utf8");
        const isVerified = verifier.verify(certPem, Buffer.from(body.Signature, "base64"));

        return {
          isValid: isVerified,
          provider: "BKASH",
          error: isVerified ? undefined : "bKash AWS SNS signature mismatch",
        };
      }

      // 2. Direct Webhook / Shared Secret Header Verification
      const bkashSig = headers.get("x-bkash-signature") || headers.get("x-signature");
      const secret = process.env.BKASH_WEBHOOK_SECRET || getWebhookSigningSecret();
      if (!secret) {
        return { isValid: false, provider: "BKASH", error: "BKASH_WEBHOOK_SECRET not configured" };
      }

      if (bkashSig) {
        const expected = crypto.createHmac("sha256", secret).update(JSON.stringify(body)).digest("hex");
        const expectedBuf = Buffer.from(expected, "hex");
        const actualBuf = Buffer.from(bkashSig.replace(/^sha256=/, ""), "hex");
        if (expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf)) {
          return { isValid: true, provider: "BKASH" };
        }
      }

      return { isValid: false, provider: "BKASH", error: "bKash webhook signature verification failed" };
    } catch (err: any) {
      return { isValid: false, provider: "BKASH", error: `bKash verifier exception: ${err.message}` };
    }
  }
}

export class NagadWebhookVerifier {
  /**
   * Validates Nagad RSA-SHA256 merchant callbacks.
   */
  public static async verify(body: any, headers: Headers): Promise<VerificationResult> {
    try {
      const signature = headers.get("x-nagad-signature") || headers.get("x-signature");
      const publicKey = process.env.NAGAD_PUBLIC_KEY;

      if (!publicKey) {
        // Fallback to HMAC if Nagad symmetric secret is configured for sandbox
        const secret = process.env.NAGAD_WEBHOOK_SECRET || getWebhookSigningSecret();
        if (secret && signature) {
          const expected = crypto.createHmac("sha256", secret).update(JSON.stringify(body)).digest("hex");
          const expectedBuf = Buffer.from(expected, "hex");
          const actualBuf = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
          if (expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf)) {
            return { isValid: true, provider: "NAGAD" };
          }
        }
        return { isValid: false, provider: "NAGAD", error: "NAGAD_PUBLIC_KEY not configured" };
      }

      if (!signature) {
        return { isValid: false, provider: "NAGAD", error: "Missing Nagad signature header" };
      }

      const rawString = typeof body === "string" ? body : JSON.stringify(body);
      const isVerified = crypto.verify(
        "SHA256",
        Buffer.from(rawString),
        publicKey,
        Buffer.from(signature, "base64")
      );

      return {
        isValid: isVerified,
        provider: "NAGAD",
        error: isVerified ? undefined : "Nagad RSA cryptographic signature mismatch",
      };
    } catch (err: any) {
      return { isValid: false, provider: "NAGAD", error: `Nagad verifier exception: ${err.message}` };
    }
  }
}

export class InternalHmacWebhookVerifier {
  /**
   * Validates custom bank / internal webhooks with timing-safe HMAC-SHA256.
   */
  public static verify(payloadString: string, signature: string): VerificationResult {
    try {
      const secret = getWebhookSigningSecret();
      if (!secret) {
        return { isValid: false, provider: "INTERNAL", error: "WEBHOOK_SIGNING_SECRET not configured" };
      }

      const expected = crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
      const expectedBuf = Buffer.from(expected, "hex");
      const actualBuf = Buffer.from(signature.replace(/^sha256=/, ""), "hex");

      if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
        return { isValid: false, provider: "INTERNAL", error: "Invalid HMAC signature" };
      }

      return { isValid: true, provider: "INTERNAL" };
    } catch (err: any) {
      return { isValid: false, provider: "INTERNAL", error: `HMAC verification error: ${err.message}` };
    }
  }
}

export class ProviderWebhookVerifier {
  public static async verify(
    provider: string,
    body: any,
    headers: Headers,
    rawPayloadString: string
  ): Promise<VerificationResult> {
    const prov = provider.toUpperCase();

    if (prov === "BKASH") {
      return await BkashWebhookVerifier.verify(body, headers);
    }

    if (prov === "NAGAD") {
      return await NagadWebhookVerifier.verify(body, headers);
    }

    const signature =
      headers.get("x-ehrj-signature") ||
      headers.get("x-signature") ||
      "";

    return InternalHmacWebhookVerifier.verify(rawPayloadString, signature);
  }
}
