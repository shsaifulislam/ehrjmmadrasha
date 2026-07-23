// backend/src/modules/academic/academic.controller.ts
// Academic controller — thin layer for Session, Class, Department, Subject, Student

import { Request, Response } from 'express';
import { academicService } from './academic.service';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';
import { PaginationQueryInput } from '../../shared/validations/common.schema';

export class AcademicController {
  // ─── SESSION ──────────────────────────────────────
  async getSessions(_req: Request, res: Response): Promise<void> {
    const sessions = await academicService.getAllSessions();
    sendSuccess(res, sessions, 'সেশন তালিকা');
  }

  async createSession(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const session = await academicService.createSession(req.body, authReq.user.id);
    sendCreated(res, session, 'সেশন সফলভাবে তৈরি হয়েছে');
  }

  async updateSession(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const session = await academicService.updateSession(req.params.id as string, req.body, authReq.user.id);
    sendSuccess(res, session, 'সেশন সফলভাবে আপডেট হয়েছে');
  }

  async deleteSession(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    await academicService.deleteSession(req.params.id as string, authReq.user.id);
    sendNoContent(res);
  }

  // ─── CLASS ────────────────────────────────────────
  async getClasses(_req: Request, res: Response): Promise<void> {
    const classes = await academicService.getAllClasses();
    sendSuccess(res, classes, 'শ্রেণী তালিকা');
  }

  async createClass(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const cls = await academicService.createClass(req.body, authReq.user.id);
    sendCreated(res, cls, 'শ্রেণী সফলভাবে তৈরি হয়েছে');
  }

  async updateClass(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const cls = await academicService.updateClass(req.params.id as string, req.body, authReq.user.id);
    sendSuccess(res, cls, 'শ্রেণী সফলভাবে আপডেট হয়েছে');
  }

  async deleteClass(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    await academicService.deleteClass(req.params.id as string, authReq.user.id);
    sendNoContent(res);
  }

  // ─── DEPARTMENT ───────────────────────────────────
  async getDepartments(_req: Request, res: Response): Promise<void> {
    const departments = await academicService.getAllDepartments();
    sendSuccess(res, departments, 'বিভাগ তালিকা');
  }

  async createDepartment(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const dept = await academicService.createDepartment(req.body, authReq.user.id);
    sendCreated(res, dept, 'বিভাগ সফলভাবে তৈরি হয়েছে');
  }

  async updateDepartment(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const dept = await academicService.updateDepartment(req.params.id as string, req.body, authReq.user.id);
    sendSuccess(res, dept, 'বিভাগ সফলভাবে আপডেট হয়েছে');
  }

  async deleteDepartment(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    await academicService.deleteDepartment(req.params.id as string, authReq.user.id);
    sendNoContent(res);
  }

  // ─── SUBJECT ──────────────────────────────────────
  async getSubjects(req: Request, res: Response): Promise<void> {
    const classId = req.query.classId as string | undefined;
    const subjects = await academicService.getAllSubjects(classId);
    sendSuccess(res, subjects, 'বিষয় তালিকা');
  }

  async createSubject(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const subj = await academicService.createSubject(req.body, authReq.user.id);
    sendCreated(res, subj, 'বিষয় সফলভাবে তৈরি হয়েছে');
  }

  async updateSubject(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const subj = await academicService.updateSubject(req.params.id as string, req.body, authReq.user.id);
    sendSuccess(res, subj, 'বিষয় সফলভাবে আপডেট হয়েছে');
  }

  async deleteSubject(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    await academicService.deleteSubject(req.params.id as string, authReq.user.id);
    sendNoContent(res);
  }

  // ─── STUDENT ──────────────────────────────────────
  async getStudents(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as PaginationQueryInput & { classId?: string; sessionId?: string };
    const result = await academicService.findAllStudents(query);
    sendPaginated(res, result.students, result.meta, 'ছাত্র তালিকা');
  }

  async getStudentById(req: Request, res: Response): Promise<void> {
    const student = await academicService.findStudentById(req.params.id as string);
    sendSuccess(res, student);
  }

  async createStudent(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const student = await academicService.createStudent(req.body, authReq.user.id);
    sendCreated(res, student, 'ছাত্র সফলভাবে তৈরি হয়েছে');
  }

  async updateStudent(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const student = await academicService.updateStudent(req.params.id as string, req.body, authReq.user.id);
    sendSuccess(res, student, 'ছাত্র সফলভাবে আপডেট হয়েছে');
  }

  async deleteStudent(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    await academicService.deleteStudent(req.params.id as string, authReq.user.id);
    sendNoContent(res);
  }
}

export const academicController = new AcademicController();

