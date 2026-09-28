import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  loadBusinessRules,
  saveBusinessRules,
  runRuleSimulation,
  detectRuleConflicts,
  BusinessRule,
} from "@/lib/workflow";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। অ্যাডমিন বা অধ্যক্ষের অনুমোদন প্রয়োজন।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");
    const status = searchParams.get("status");

    let rules = loadBusinessRules();
    if (domain) {
      rules = rules.filter((r) => r.domain === domain);
    }
    if (status) {
      rules = rules.filter((r) => r.status === status);
    }

    const conflicts = detectRuleConflicts(rules);

    return NextResponse.json({
      success: true,
      data: {
        total: rules.length,
        rules,
        conflicts,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve business rules" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন রুল কনফিগারেশন পরিবর্তন করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // 1. Dry-Run Simulation Mode: Zero Mutation Guarantee
    if (body.dryRun) {
      const { ruleId, samplePayload } = body;
      if (!ruleId || !samplePayload) {
        return NextResponse.json(
          { error: "রুল আইডি এবং সিমুলেশন স্যাম্পল পেলোড আবশ্যক।" },
          { status: 400 }
        );
      }
      const simulation = runRuleSimulation(ruleId, samplePayload);
      return NextResponse.json({
        success: true,
        simulation,
      });
    }

    // 2. Status Update
    if (body.action === "UPDATE_STATUS") {
      const { ruleId, newStatus } = body;
      const rules = loadBusinessRules();
      const rule = rules.find((r) => r.ruleId === ruleId);
      if (!rule) {
        return NextResponse.json({ error: "রুল পাওয়া যায়নি।" }, { status: 404 });
      }

      rule.status = newStatus;
      rule.updatedAt = new Date().toISOString();
      saveBusinessRules(rules);

      return NextResponse.json({
        success: true,
        message: `রুল ${ruleId}-এর স্ট্যাটাস পরিবর্তন করে ${newStatus} করা হয়েছে।`,
        rule,
      });
    }

    // 3. Create or Update Rule Version
    const { nameBn, nameEn, domain, triggerEvent, conditions, actions, riskLevel, requiresApproval } = body;
    if (!nameBn || !triggerEvent || !conditions || !actions) {
      return NextResponse.json(
        { error: "রুলের নাম, ট্রিগার ইভেন্ট, শর্তাবলী এবং অ্যাকশন বাধ্যতামূলক।" },
        { status: 400 }
      );
    }

    const rules = loadBusinessRules();
    const counter = (rules.length + 1).toString().padStart(3, "0");
    const ruleId = body.ruleId || `RULE-${(domain || "GEN").slice(0, 3).toUpperCase()}-${counter}`;

    const newRule: BusinessRule = {
      ruleId,
      version: "1.0",
      nameBn,
      nameEn: nameEn || nameBn,
      domain: domain || "GENERAL",
      triggerEvent,
      conditions,
      actions,
      riskLevel: riskLevel || "LOW",
      requiresApproval: Boolean(requiresApproval),
      status: "DRAFT", // New rules default to DRAFT for review
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: `${user.name} (${user.role})`,
    };

    rules.push(newRule);
    saveBusinessRules(rules);

    return NextResponse.json({
      success: true,
      message: `নতুন রুল ${ruleId} খসড়া (DRAFT) হিসেবে সংরক্ষিত হয়েছে।`,
      rule: newRule,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process rule operation" },
      { status: 500 }
    );
  }
}
