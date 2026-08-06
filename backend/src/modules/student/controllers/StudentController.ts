import { Request, Response } from "express";
import StudentRepository from "../repositories/StudentRepository";
import StudentAcademicRepository from "../repositories/StudentAcademicRepository";
import StudentCreateService from "../services/StudentCreateService";
import Student360Service from "../../../services/shared/Student360Service";
import SearchService from "../../../services/shared/SearchService";
import { sendSuccess } from "../../../shared/utils/response";

export class StudentController {
  async getAll(req: Request, res: Response): Promise<void> {
    const { classId, sessionId, guardianId, search, page, limit } = req.query;
    const result = await StudentRepository.findPaginatedStudents({
      classId: classId ? String(classId) : undefined,
      sessionId: sessionId ? String(sessionId) : undefined,
      guardianId: guardianId ? String(guardianId) : undefined,
      search: search ? String(search) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    sendSuccess(res, result, "শিক্ষার্থীদের তালিকা");
  }

  async getById(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const student = await StudentRepository.findByStudentId(id);
    if (!student) {
      res.status(404).json({ success: false, message: "শিক্ষার্থী পাওয়া যায়নি" });
      return;
    }
    sendSuccess(res, student, "শিক্ষার্থীর বিস্তারিত তথ্য");
  }

  async getStudent360(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const profile360 = await Student360Service.getStudentFullProfile(id);
    sendSuccess(res, profile360, "শিক্ষার্থী ৩৬০ প্রোফাইল তথ্য");
  }

  async create(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id || "SYSTEM";
    const student = await StudentCreateService.execute({ ...req.body, createdBy: userId });
    sendSuccess(res, student, "শিক্ষার্থী সফলভাবে যুক্ত করা হয়েছে", 201);
  }

  async promote(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { nextClassId, nextSessionId, nextRoll } = req.body;
    const userId = (req as any).user?.id || "SYSTEM";
    const result = await StudentAcademicRepository.promoteStudent(id, nextClassId, nextSessionId, Number(nextRoll), userId);
    sendSuccess(res, result, "শিক্ষার্থী সফলভাবে প্রমোশন দেওয়া হয়েছে");
  }

  async transfer(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { remarks } = req.body;
    const userId = (req as any).user?.id || "SYSTEM";
    const result = await StudentAcademicRepository.transferStudent(id, remarks || "TC Issued", userId);
    sendSuccess(res, result, "শিক্ষার্থী সফলভাবে ট্র্যান্সফার/টিসি দেওয়া হয়েছে");
  }

  async getStats(_req: Request, res: Response): Promise<void> {
    const stats = await StudentRepository.getStudentStats();
    sendSuccess(res, stats, "শিক্ষার্থী ড্যাশবোর্ড পরিসংখ্যান");
  }

  async search(req: Request, res: Response): Promise<void> {
    const { q } = req.query;
    const searchResults = await SearchService.globalSearch(q ? String(q) : "");
    sendSuccess(res, searchResults, "গ্লোবাল সার্চ ফলাফল");
  }

  async addDocument(req: Request, res: Response): Promise<void> {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, type, fileUrl, fileSize, mimeType } = req.body;
    const prisma = (await import("../../../config/prisma")).default;
    const doc = await prisma.studentDocument.create({
      data: {
        studentId: id,
        title: title || "সংযুক্ত নথি",
        type: type || "OTHER",
        fileUrl: fileUrl || "/uploads/documents/sample.pdf",
        fileSize: fileSize || "1.2 MB",
        mimeType: mimeType || "application/pdf",
      },
    });
    sendSuccess(res, doc, "শিক্ষার্থীর ডকুমেন্ট সফলভাবে আপলোড করা হয়েছে", 201);
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    const docId = Array.isArray(req.params.docId) ? req.params.docId[0] : req.params.docId;
    const prisma = (await import("../../../config/prisma")).default;
    await prisma.studentDocument.delete({ where: { id: docId } });
    sendSuccess(res, null, "ডকুমেন্ট সফলভাবে মুছে ফেলা হয়েছে");
  }
}

export const studentController = new StudentController();
