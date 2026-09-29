/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 32
 * Sandboxed Template Engine & Variable Interpolator
 * Checkpoint: EHRJ-AI-2026-PHASE32
 */

import { CommunicationTemplate, ResolvedRecipientItem } from "./types";
import { getCommunicationTemplates } from "./communicationStore";

/**
 * Escapes HTML characters to defend against XSS & HTML injection
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface RenderResult {
  success: boolean;
  renderedSubject: string;
  renderedBody: string;
  missingVariables: string[];
  appliedVariables: Record<string, string>;
}

/**
 * Sandboxed template interpolator replacing {{variable_name}} with escaped values
 */
export function renderCommunicationTemplate(
  templateString: string,
  variables: Record<string, any>,
  requiredVariables: string[] = []
): { renderedText: string; missingVariables: string[] } {
  const missingVariables: string[] = [];

  // Check required variables
  for (const req of requiredVariables) {
    if (variables[req] === undefined || variables[req] === null || String(variables[req]).trim() === "") {
      missingVariables.push(req);
    }
  }

  // Safe regex-based interpolation (strictly no eval or function execution)
  const renderedText = templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, varName) => {
    if (variables[varName] !== undefined && variables[varName] !== null) {
      return escapeHtml(String(variables[varName]));
    }
    return match; // Keep untouched if not provided
  });

  return { renderedText, missingVariables };
}

/**
 * Fully renders a communication template for a specific recipient
 */
export function renderTemplateForRecipient(
  template: CommunicationTemplate,
  recipient: ResolvedRecipientItem,
  customVariables: Record<string, any> = {},
  language: "bn" | "en" | "ar" = "bn"
): RenderResult {
  // Built-in contextual variable dictionary
  const contextVars: Record<string, any> = {
    recipient_name: recipient.name,
    guardian_name: recipient.name,
    student_name: recipient.studentNameBn || recipient.name,
    roll: recipient.studentRoll ? String(recipient.studentRoll) : "N/A",
    class_title: recipient.classTitle || "মাদরাসা সাধারণ অনুষদ",
    reason: recipient.reasonForInclusion,
    ...(recipient.extraContext || {}),
    ...customVariables,
  };

  let subjectTpl = template.subjectTemplateBn;
  let bodyTpl = template.bodyTemplateBn;

  if (language === "en" && template.subjectTemplateEn && template.bodyTemplateEn) {
    subjectTpl = template.subjectTemplateEn;
    bodyTpl = template.bodyTemplateEn;
  } else if (language === "ar" && template.subjectTemplateAr && template.bodyTemplateAr) {
    subjectTpl = template.subjectTemplateAr;
    bodyTpl = template.bodyTemplateAr;
  }

  const subjectRender = renderCommunicationTemplate(subjectTpl, contextVars);
  const bodyRender = renderCommunicationTemplate(bodyTpl, contextVars, template.allowedVariables);

  const missing = Array.from(new Set([...subjectRender.missingVariables, ...bodyRender.missingVariables]));

  return {
    success: missing.length === 0,
    renderedSubject: subjectRender.renderedText,
    renderedBody: bodyRender.renderedText,
    missingVariables: missing,
    appliedVariables: contextVars,
  };
}

/**
 * Resolves a template by code and validates that variables are compliant
 */
export function getTemplateByCode(code: string): CommunicationTemplate | null {
  const templates = getCommunicationTemplates();
  return templates.find((t) => t.code === code) || null;
}
