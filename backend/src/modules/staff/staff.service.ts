import prisma from '../../config/prisma';

export class StaffService {
  static async getStaffList(query?: { search?: string; designation?: string }) {
    const where: any = { isDeleted: false };
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { employeeId: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }
    if (query?.designation) {
      where.designation = query.designation;
    }

    return await prisma.staff.findMany({
      where,
      include: {
        salaryStructure: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createStaff(data: {
    employeeId?: string;
    name: string;
    phone: string;
    designation: string;
    department?: string;
    joinDate?: string;
    address?: string;
    nid?: string;
    paymentMethod?: string;
  }) {
    const empId = data.employeeId || `STF${Math.floor(1000 + Math.random() * 9000)}`;

    const existing = await prisma.staff.findUnique({ where: { employeeId: empId } });
    if (existing) {
      throw new Error('এই এমপ্লয়ি আইডি ইতিমধ্যে বিদ্যমান');
    }

    return await prisma.staff.create({
      data: {
        employeeId: empId,
        name: data.name,
        phone: data.phone,
        designation: data.designation,
        department: data.department,
        joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
        address: data.address,
        nid: data.nid,
        paymentMethod: data.paymentMethod || 'CASH',
        isActive: true,
      },
    });
  }

  static async getStaffById(id: string) {
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        salaryStructure: true,
        advances: { orderBy: { requestDate: 'desc' } },
        leaveRequests: { orderBy: { createdAt: 'desc' } },
        payrollRecords: {
          include: { payrollMonth: true, payments: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!staff) throw new Error('কর্মচারী পাওয়া যায়নি');
    return staff;
  }
}
