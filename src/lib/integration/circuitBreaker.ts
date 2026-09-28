/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 28
 * Resilient External HTTP Client & Circuit Breaker Engine
 *
 * Core Governance Invariants:
 * 1. Bounded Timeouts: Every external request MUST have a strict timeout.
 * 2. Circuit Breaker (CLOSED -> OPEN -> HALF_OPEN) protects internal server resources.
 * 3. Secret Masking in all logs.
 * 4. Error Normalization across external providers.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { IntegrationLog } from "./types";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export type NormalizedErrorCode =
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "VALIDATION_ERROR"
  | "RATE_LIMIT_ERROR"
  | "TIMEOUT_ERROR"
  | "NETWORK_ERROR"
  | "PROVIDER_ERROR"
  | "DUPLICATE_ERROR"
  | "CONFLICT_ERROR"
  | "UNKNOWN_ERROR";

export interface CircuitBreakerConfig {
  failureThreshold: number; // e.g. 5 consecutive failures trips breaker
  recoveryTimeoutMs: number; // e.g. 30000ms before trying HALF_OPEN
  timeoutMs: number; // Request execution timeout (e.g. 8000ms)
  maxRetries: number; // Progressive backoff attempts (e.g. 2-3)
}

interface CircuitStatus {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime?: number;
  lastStateChange: number;
}

const DATA_DIR = path.join(process.cwd(), "data", "integrations");
const LOGS_FILE = path.join(DATA_DIR, "integration_logs.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// In-memory circuit breakers mapped by integrationCode
const circuitBreakers = new Map<string, CircuitStatus>();

export function getCircuitStatus(integrationCode: string): CircuitStatus {
  const existing = circuitBreakers.get(integrationCode);
  if (existing) return existing;

  const initial: CircuitStatus = {
    state: "CLOSED",
    consecutiveFailures: 0,
    lastStateChange: Date.now(),
  };
  circuitBreakers.set(integrationCode, initial);
  return initial;
}

export function resetCircuit(integrationCode: string): void {
  circuitBreakers.set(integrationCode, {
    state: "CLOSED",
    consecutiveFailures: 0,
    lastStateChange: Date.now(),
  });
}

export function loadIntegrationLogs(limit: number = 100): IntegrationLog[] {
  ensureDir();
  if (!fs.existsSync(LOGS_FILE)) return [];
  try {
    const raw = fs.readFileSync(LOGS_FILE, "utf-8");
    const logs: IntegrationLog[] = JSON.parse(raw);
    return logs.slice(-limit).reverse();
  } catch {
    return [];
  }
}

export function appendIntegrationLog(log: IntegrationLog): void {
  ensureDir();
  let logs: IntegrationLog[] = [];
  try {
    if (fs.existsSync(LOGS_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"));
    }
  } catch {
    logs = [];
  }

  // Keep last 1000 logs for retention policy
  logs.push(log);
  if (logs.length > 1000) {
    logs = logs.slice(-1000);
  }
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8");
}

export function sanitizeMetadata(data: any): Record<string, any> {
  if (!data || typeof data !== "object") return {};
  const sanitized: Record<string, any> = {};

  const sensitiveKeys = [
    "password",
    "pass",
    "secret",
    "token",
    "authorization",
    "auth",
    "apikey",
    "api_key",
    "appkey",
    "appsecret",
    "otp",
    "privatekey",
  ];

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
      sanitized[key] = "******** [MASKED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function normalizeHttpStatus(
  status: number,
  errorMessage?: string
): NormalizedErrorCode {
  if (status === 401) return "AUTHENTICATION_ERROR";
  if (status === 403) return "AUTHORIZATION_ERROR";
  if (status === 400 || status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMIT_ERROR";
  if (status === 408 || status === 504) return "TIMEOUT_ERROR";
  if (status === 409) return "DUPLICATE_ERROR";
  if (status >= 500) return "PROVIDER_ERROR";
  if (errorMessage?.toLowerCase().includes("timeout") || errorMessage?.toLowerCase().includes("abort")) {
    return "TIMEOUT_ERROR";
  }
  if (errorMessage?.toLowerCase().includes("econnrefused") || errorMessage?.toLowerCase().includes("fetch failed")) {
    return "NETWORK_ERROR";
  }
  return "UNKNOWN_ERROR";
}

/**
 * Resilient External HTTP Request with timeout, backoff retry, circuit breaker and correlation tracing
 */
export async function executeResilientRequest<T = any>(params: {
  integrationCode: string;
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  config?: Partial<CircuitBreakerConfig>;
  correlationId?: string;
  causationId?: string;
}): Promise<{
  success: boolean;
  status: number;
  data?: T;
  error?: string;
  errorCode?: NormalizedErrorCode;
  latencyMs: number;
  circuitState: CircuitState;
}> {
  const method = params.method || "GET";
  const correlationId = params.correlationId || `corr_${crypto.randomBytes(8).toString("hex")}`;
  const requestId = `req_${crypto.randomBytes(6).toString("hex")}`;

  const cfg: CircuitBreakerConfig = {
    failureThreshold: params.config?.failureThreshold ?? 5,
    recoveryTimeoutMs: params.config?.recoveryTimeoutMs ?? 30000,
    timeoutMs: params.config?.timeoutMs ?? 8000,
    maxRetries: params.config?.maxRetries ?? 2,
  };

  const circuit = getCircuitStatus(params.integrationCode);

  // 1. Check Circuit Breaker State
  if (circuit.state === "OPEN") {
    const elapsedSinceFail = Date.now() - (circuit.lastFailureTime || 0);
    if (elapsedSinceFail > cfg.recoveryTimeoutMs) {
      circuit.state = "HALF_OPEN";
      circuit.lastStateChange = Date.now();
    } else {
      const err = `সার্কিট ব্রেকার OPEN অবস্থায় রয়েছে। '${params.integrationCode}' পরিষেবা বর্তমানে সাময়িকভাবে বন্ধ।`;
      appendIntegrationLog({
        id: `LOG-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        integrationCode: params.integrationCode,
        operation: `${method} ${params.url}`,
        timestamp: new Date().toISOString(),
        requestId,
        correlationId,
        status: "FAILURE",
        durationMs: 0,
        sanitizedMetadata: { circuitState: "OPEN" },
        errorCode: "PROVIDER_ERROR",
        errorMessage: err,
      });
      return {
        success: false,
        status: 503,
        error: err,
        errorCode: "PROVIDER_ERROR",
        latencyMs: 0,
        circuitState: "OPEN",
      };
    }
  }

  // 2. Prepare headers with tracing
  const tracedHeaders: Record<string, string> = {
    "content-type": "application/json",
    "x-request-id": requestId,
    "x-correlation-id": correlationId,
    "x-integration-code": params.integrationCode,
    ...(params.headers || {}),
  };
  if (params.causationId) {
    tracedHeaders["x-causation-id"] = params.causationId;
  }

  let attempt = 0;
  let lastError: any = null;
  const startTime = Date.now();

  while (attempt <= cfg.maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

    try {
      const response = await fetch(params.url, {
        method,
        headers: tracedHeaders,
        body: params.body ? JSON.stringify(params.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - startTime;

      let responseData: any = null;
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : null;
      } catch {
        responseData = null;
      }

      if (response.ok) {
        // Success: heal circuit breaker
        circuit.state = "CLOSED";
        circuit.consecutiveFailures = 0;

        appendIntegrationLog({
          id: `LOG-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
          integrationCode: params.integrationCode,
          operation: `${method} ${params.url}`,
          timestamp: new Date().toISOString(),
          requestId,
          correlationId,
          status: "SUCCESS",
          durationMs: latencyMs,
          httpStatus: response.status,
          sanitizedMetadata: sanitizeMetadata({
            method,
            attempt,
            responseSize: responseData ? JSON.stringify(responseData).length : 0,
          }),
        });

        return {
          success: true,
          status: response.status,
          data: responseData,
          latencyMs,
          circuitState: circuit.state,
        };
      }

      // Non-2xx response
      const errorCode = normalizeHttpStatus(response.status, response.statusText);
      // If client error (4xx) not 429, don't retry, return immediately
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        appendIntegrationLog({
          id: `LOG-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
          integrationCode: params.integrationCode,
          operation: `${method} ${params.url}`,
          timestamp: new Date().toISOString(),
          requestId,
          correlationId,
          status: "FAILURE",
          durationMs: latencyMs,
          httpStatus: response.status,
          sanitizedMetadata: sanitizeMetadata({ method, attempt, error: responseData }),
          errorCode,
          errorMessage: response.statusText,
        });

        return {
          success: false,
          status: response.status,
          data: responseData,
          error: response.statusText || `HTTP ${response.status}`,
          errorCode,
          latencyMs,
          circuitState: circuit.state,
        };
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
    }

    // Delay with exponential backoff before retry if attempts remaining
    if (attempt <= cfg.maxRetries) {
      const backoffMs = Math.pow(2, attempt) * 200;
      await new Promise((res) => setTimeout(res, backoffMs));
    }
  }

  // All attempts exhausted
  const latencyMs = Date.now() - startTime;
  circuit.consecutiveFailures += 1;
  circuit.lastFailureTime = Date.now();

  if (circuit.consecutiveFailures >= cfg.failureThreshold) {
    circuit.state = "OPEN";
    circuit.lastStateChange = Date.now();
  }

  const normalizedErrCode = normalizeHttpStatus(500, lastError?.message);

  appendIntegrationLog({
    id: `LOG-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    integrationCode: params.integrationCode,
    operation: `${method} ${params.url}`,
    timestamp: new Date().toISOString(),
    requestId,
    correlationId,
    status: "FAILURE",
    durationMs: latencyMs,
    sanitizedMetadata: sanitizeMetadata({
      method,
      attempts: attempt,
      circuitFailures: circuit.consecutiveFailures,
    }),
    errorCode: normalizedErrCode,
    errorMessage: lastError?.message || "All retry attempts failed",
  });

  return {
    success: false,
    status: 500,
    error: lastError?.message || "Request failed after retries",
    errorCode: normalizedErrCode,
    latencyMs,
    circuitState: circuit.state,
  };
}
