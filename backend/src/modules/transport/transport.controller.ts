import { Request, Response } from 'express';
import { TransportService } from './transport.service';
import { sendSuccess } from '../../shared/utils/response';

export class TransportController {
  static async getVehicles(_req: Request, res: Response) {
    const vehicles = await TransportService.getVehicles();
    sendSuccess(res, vehicles, 'গাড়ির তালিকা সফলভাবে লোড হয়েছে');
  }

  static async createVehicle(req: Request, res: Response) {
    const vehicle = await TransportService.createVehicle(req.body);
    sendSuccess(res, vehicle, 'নতুন গাড়ি ডাটাবেসে সফলভাবে যোগ করা হয়েছে', 201);
  }

  static async getRoutes(_req: Request, res: Response) {
    const routes = await TransportService.getRoutes();
    sendSuccess(res, routes, 'পরিবহন রুটের তালিকা সফলভাবে লোড হয়েছে');
  }

  static async createRoute(req: Request, res: Response) {
    const route = await TransportService.createRoute(req.body);
    sendSuccess(res, route, 'নতুন পরিবহন রুট সফলভাবে তৈরি করা হয়েছে', 201);
  }

  static async assignStudentTransport(req: Request, res: Response) {
    const assignment = await TransportService.assignStudentTransport(req.body);
    sendSuccess(res, assignment, 'শিক্ষার্থীর পরিবহন রুট সফলভাবে বরাদ্দ দেওয়া হয়েছে', 201);
  }

  static async getAssignments(_req: Request, res: Response) {
    const assignments = await TransportService.getTransportAssignments();
    sendSuccess(res, assignments, 'পরিবহন বরাদ্দ তালিকা সফলভাবে লোড হয়েছে');
  }
}
