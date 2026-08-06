import { Request, Response } from "express";
import AdmissionRepository from "../repositories/AdmissionRepository";
import AdmissionCreateService from "../services/AdmissionCreateService";
import AdmissionApproveService from "../services/AdmissionApproveService";
import AdmissionRejectService from "../services/AdmissionRejectService";
import AdmissionPDFService from "../services/AdmissionPDFService";
import AdmissionExportService from "../services/AdmissionExportService";
import AdmissionImportService from "../services/AdmissionImportService";
import { sendSuccess } from "../../../shared/utils/response";

export class AdmissionController {
  async getAll(req: Request, res: Response): Promise<void> {
    const { status, classId, sessionId, search, page, limit } = req.query;
    const result = await AdmissionRepository.findPaginatedAdmissions({
      status: status as any,
      classId: classId ? String(classId) : undefined,
      sessionId: sessionId ? String(sessionId) : undefined,
      search: search ? String(search) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    sendSuccess(res, result, "ভর্তি আবেদনের তালিকা");
  }

  async getById(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const admission = await AdmissionRepository.findWithDetails(id);
    if (!admission) {
      res.status(404).json({ success: false, message: "ভর্তি আবেদন পাওয়া যায়নি" });
      return;
    }
    sendSuccess(res, admission, "ভর্তি আবেদনের বিস্তারিত তথ্য");
  }

  async getByToken(req: Request, res: Response): Promise<void> {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    const admission = await AdmissionRepository.findByVerificationToken(token);
    if (!admission) {
      res.status(404).json({ success: false, message: "ভেরিফিকেশন টোকেন দ্বারা আবেদন পাওয়া যায়নি" });
      return;
    }
    sendSuccess(res, admission, "ভর্তি আবেদনের ভেরিফিকেশন তথ্য");
  }

  async create(req: Request, res: Response): Promise<void> {
    const admission = await AdmissionCreateService.execute(req.body);
    sendSuccess(res, admission, "ভর্তি আবেদন সফলভাবে জমা নেওয়া হয়েছে", 201);
  }

  async approve(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = (req as any).user?.id || "SYSTEM_ADMIN";
    const result = await AdmissionApproveService.execute(id, userId);
    sendSuccess(res, result, "ভর্তি আবেদন সফলভাবে অনুমোদিত হয়েছে");
  }

  async reject(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body;
    const userId = (req as any).user?.id || "SYSTEM_ADMIN";
    const result = await AdmissionRejectService.execute(id, reason, userId);
    sendSuccess(res, result, "ভর্তি আবেদন বাতিল করা হয়েছে");
  }

  async getStats(_req: Request, res: Response): Promise<void> {
    const stats = await AdmissionRepository.getAdmissionStats();
    sendSuccess(res, stats, "ভর্তি মডিউলের ড্যাশবোর্ড পরিসংখান");
  }

  async getReceiptPdf(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const html = await AdmissionPDFService.generateReceiptHtml(id);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  }

  async exportCsv(req: Request, res: Response): Promise<void> {
    const { status } = req.query;
    const csv = await AdmissionExportService.exportToCsv(status ? String(status) : undefined);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=admissions-${Date.now()}.csv`);
    res.send(csv);
  }

  async importBatch(req: Request, res: Response): Promise<void> {
    const { records } = req.body;
    if (!Array.isArray(records)) {
      res.status(400).json({ success: false, message: "আমদানি ডেটা সঠিক অ্যারে ফরম্যাটে নয়" });
      return;
    }
    const result = await AdmissionImportService.importBatch(records);
    sendSuccess(res, result, "বাল্ক ভর্তি ইমপোর্ট সম্পন্ন হয়েছে");
  }
}

export const admissionController = new AdmissionController();
