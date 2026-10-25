/**
 * EHRJ DIGITAL CAMPUS & ERP — STARTUP INSTRUMENTATION HOOK
 * Automatically runs once on server boot.
 * Performs fail-fast validation of critical environment and configuration variables.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnvironment, isProduction } = await import("./lib/env");
    const { initializeDatabasePragmas } = await import("./lib/prisma");
    const { startJobQueueWorker } = await import("./lib/workflow/jobQueue");
    const { valid, errors, warnings } = validateEnvironment();

    if (warnings.length > 0) {
      for (const warning of warnings) {
        console.warn(`[CONFIG WARNING] ${warning}`);
      }
    }

    if (!valid) {
      for (const error of errors) {
        console.error(`[CONFIG ERROR] ${error}`);
      }
      if (isProduction()) {
        throw new Error(
          `FATAL: Failed environment configuration validation in production mode:\n${errors.join("\n")}`
        );
      }
    } else {
      console.log("[EHRJ Digital Campus] Startup environment validation passed.");
    }

    // Phase 29: Apply SQLite concurrency & lock resilience pragmas
    await initializeDatabasePragmas();

    // Phase 29: Start self-healing background automation job retry worker
    startJobQueueWorker(60000);
  }
}

