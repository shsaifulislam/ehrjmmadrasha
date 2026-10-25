import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Institutional File Resilience Utility
 * 
 * Invariants:
 * 1. Atomic write using temporary file + rename guarantees zero half-written/corrupted JSON.
 * 2. Directory structure ensured recursively before write.
 * 3. Thread-safe within Node's event loop.
 */
export function atomicWriteFileSync(filePath: string, data: string | Buffer): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const randomSuffix = crypto.randomBytes(6).toString("hex");
  const tempPath = `${filePath}.${Date.now()}.${randomSuffix}.tmp`;

  try {
    fs.writeFileSync(tempPath, data, "utf-8");
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // ignore cleanup error
      }
    }
    throw error;
  }
}

/**
 * Safely reads and parses JSON, returning fallback if file is missing or corrupted.
 */
export function safeReadJsonSync<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[safeReadJsonSync] Error reading or parsing ${filePath}:`, err);
    return fallback;
  }
}
