// backend/src/modules/exam/exam.controller.ts

import { Request, Response } from 'express';
import { examService } from './exam.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class ExamController {
  // ─── EXAM CRUD ───────────────────────────────────────
  async createExam(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const exam = await examService.createExam(req.body, authReq.user.id);
    sendCreated(res, exam, 'পরীক্ষা সফলভাবে তৈরি হয়েছে');
  }

  async getExams(req: Request, res: Response): Promise<void> {
    const { sessionId } = req.query as { sessionId?: string };
    const exams = await examService.findAllExams(sessionId);
    sendSuccess(res, exams, 'পরীক্ষার তালিকা');
  }

  async getPublicExams(req: Request, res: Response): Promise<void> {
    const { sessionId } = req.query as { sessionId?: string };
    const exams = await examService.findPublicExams(sessionId);
    sendSuccess(res, exams, 'প্রকাশিত পরীক্ষার তালিকা');
  }

  async getExamById(req: Request, res: Response): Promise<void> {
    const exam = await examService.findExamById(req.params.id as string);
    sendSuccess(res, exam);
  }

  async updateExam(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const exam = await examService.updateExam(req.params.id as string, req.body, authReq.user.id);
    sendSuccess(res, exam, 'পরীক্ষার তথ্য আপডেট হয়েছে');
  }

  async deleteExam(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    await examService.deleteExam(req.params.id as string, authReq.user.id);
    sendNoContent(res);
  }

  // ─── MARKS ENTRY & RESULT SHEETS ─────────────────────
  async getMarksSheet(req: Request, res: Response): Promise<void> {
    const { examId, classId, subjectId } = req.query as { examId: string; classId: string; subjectId: string };
    const sheet = await examService.getMarksEntrySheet(examId, classId, subjectId);
    sendSuccess(res, sheet, 'নম্বর এন্ট্রি শীট');
  }

  async bulkSaveMarks(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const result = await examService.bulkSaveMarks(req.body, authReq.user.id);
    sendCreated(res, result, 'নম্বর সফলভাবে সংরক্ষণ করা হয়েছে');
  }

  async getClassResultSheet(req: Request, res: Response): Promise<void> {
    const { examId, classId } = req.query as { examId: string; classId: string };
    const result = await examService.getClassResultSheet(examId, classId);
    sendSuccess(res, result, 'শ্রেণীর ফলাফল বিবরণী');
  }

  async getStudentResultCard(req: Request, res: Response): Promise<void> {
    const { examId, studentId } = req.params as { examId: string; studentId: string };
    const card = await examService.getStudentResultCard(examId, studentId);
    sendSuccess(res, card, 'রেজাল্ট কার্ড');
  }

  // ─── PUBLIC RESULT SEARCH ─────────────────────────────
  async searchPublicResult(req: Request, res: Response): Promise<void> {
    const { sessionId, examId, roll, studentId } = req.query as {
      sessionId: string;
      examId: string;
      roll: string;
      studentId?: string;
    };
    const result = await examService.searchPublicResult({
      sessionId,
      examId,
      roll: parseInt(roll, 10),
      studentId,
    });
    sendSuccess(res, result, 'ফলাফল পাওয়া গেছে');
  }
}

export const examController = new ExamController();
