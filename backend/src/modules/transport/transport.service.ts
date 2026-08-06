import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';

export class TransportService {
  // 1. Vehicle CRUD
  static async getVehicles() {
    return await prisma.transportVehicle.findMany({
      include: { routes: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createVehicle(data: {
    vehicleNo: string;
    modelName?: string;
    capacity: number;
    driverName: string;
    driverPhone: string;
    licenseNo?: string;
  }) {
    return await prisma.transportVehicle.create({
      data,
    });
  }

  // 2. Route CRUD & Stoppages
  static async getRoutes() {
    return await prisma.transportRoute.findMany({
      include: {
        vehicle: true,
        stoppages: true,
        assignments: {
          include: { student: { select: { id: true, nameBn: true, studentId: true, roll: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createRoute(data: {
    routeName: string;
    startPoint: string;
    endPoint: string;
    vehicleId?: string;
    monthlyFee: number;
    stoppages?: { stoppageName: string; pickupTime?: string; dropTime?: string; monthlyFee?: number }[];
  }) {
    return await prisma.transportRoute.create({
      data: {
        routeName: data.routeName,
        startPoint: data.startPoint,
        endPoint: data.endPoint,
        vehicleId: data.vehicleId || undefined,
        monthlyFee: data.monthlyFee,
        stoppages: data.stoppages
          ? {
              create: data.stoppages.map((s) => ({
                stoppageName: s.stoppageName,
                pickupTime: s.pickupTime,
                dropTime: s.dropTime,
                monthlyFee: s.monthlyFee || data.monthlyFee,
              })),
            }
          : undefined,
      },
      include: { vehicle: true, stoppages: true },
    });
  }

  // 3. Student Transport Assignment & Monthly Fee Mapping
  static async assignStudentTransport(data: {
    studentId: string;
    routeId: string;
    stoppageName?: string;
    monthlyFee?: number;
  }) {
    const route = await prisma.transportRoute.findUnique({ where: { id: data.routeId } });
    if (!route) throw new AppError('পরিবহন রুট খুঁজে পাওয়া যায়নি', 404);

    return await prisma.studentTransport.create({
      data: {
        studentId: data.studentId,
        routeId: data.routeId,
        stoppageName: data.stoppageName || route.startPoint,
        monthlyFee: data.monthlyFee ?? route.monthlyFee,
      },
      include: { route: true, student: true },
    });
  }

  static async getTransportAssignments() {
    return await prisma.studentTransport.findMany({
      where: { isActive: true },
      include: {
        student: { include: { class: true } },
        route: { include: { vehicle: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
