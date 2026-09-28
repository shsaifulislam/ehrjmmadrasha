/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 29
 * Centralized Document Access & Audit Logger
 */

import fs from "fs";
import path from "path";
import { DocumentAccessLog, DocumentActionType } from "./types";

const LOGS_FILE = path.join(process.cwd(), "data", "documents", "access_logs.json");

function ensureDirectory() {
  const dir = path.dirname(LOGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readLogs(): DocumentAccessLog[] {
  ensureDirectory();
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2), "utf8");
    return [];
  }
  try {
    const raw = fs.readFileSync(LOGS_FILE, "utf8");
    return JSON.parse(raw) as DocumentAccessLog[];
  } catch (e) {
    console.error("Failed to read document access logs:", e);
    return [];
  }
}

function writeLogs(logs: DocumentAccessLog[]) {
  ensureDirectory();
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), "utf8");
}

export async function logDocumentAccess(params: {
  documentId: string;
  versionNumber?: number;
  user: {
    userId: string;
    name: string;
    role: string;
  };
  action: DocumentActionType;
  ipAddress?: string;
  userAgent?: string;
  purpose?: string;
  success?: boolean;
}): Promise<DocumentAccessLog> {
  const logs = readLogs();

  const newLog: DocumentAccessLog = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    documentId: params.documentId,
    versionNumber: params.versionNumber || 1,
    userId: params.user.userId,
    userName: params.user.name,
    userRole: params.user.role,
    action: params.action,
    timestamp: new Date().toISOString(),
    ipAddress: params.ipAddress || "127.0.0.1",
    userAgent: params.userAgent || "Internal/ERP",
    purpose: params.purpose || "Institutional Administrative Operations",
    success: params.success !== undefined ? params.success : true,
  };

  logs.unshift(newLog);
  // Cap at 10,000 most recent logs
  if (logs.length > 10000) {
    logs.length = 10000;
  }
  writeLogs(logs);

  return newLog;
}

export function getDocumentAccessLogs(documentId: string): DocumentAccessLog[] {
  const logs = readLogs();
  return logs.filter((l) => l.documentId === documentId);
}

export function getAllDocumentAccessLogs(limit: number = 100): DocumentAccessLog[] {
  const logs = readLogs();
  return logs.slice(0, limit);
}
