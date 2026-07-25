import prisma from '../../config/prisma';
import { AccountingService } from '../accounting/accounting.service';

export class HostelService {
  // 1. Building Creation
  static async createBuilding(data: { name: string; code: string; address?: string; totalCapacity?: number }) {
    const existing = await prisma.hostelBuilding.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new Error('এই বিল্ডিং কোডটি ইতিমধ্যে বিদ্যমান');
    }
    return await prisma.hostelBuilding.create({
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
        totalCapacity: data.totalCapacity || 0,
      },
    });
  }

  // 2. Room & Beds Creation
  static async createRoom(data: {
    buildingId: string;
    roomNumber: string;
    floor?: number;
    totalBeds?: number;
    monthlyRent?: number;
  }) {
    const totalBeds = data.totalBeds || 4;
    const room = await prisma.hostelRoom.create({
      data: {
        buildingId: data.buildingId,
        roomNumber: data.roomNumber,
        floor: data.floor || 1,
        totalBeds,
        monthlyRent: data.monthlyRent || 0,
        beds: {
          create: Array.from({ length: totalBeds }).map((_, i) => ({
            bedNumber: `B-${data.roomNumber}-${i + 1}`,
            status: 'VACANT',
          })),
        },
      },
      include: { beds: true },
    });

    // Update building capacity
    await prisma.hostelBuilding.update({
      where: { id: data.buildingId },
      data: { totalCapacity: { increment: totalBeds } },
    });

    return room;
  }

  // 3. Get All Buildings & Rooms
  static async getBuildings() {
    return await prisma.hostelBuilding.findMany({
      include: {
        rooms: {
          include: {
            beds: {
              include: {
                allocations: {
                  where: { status: 'ACTIVE' },
                  include: { student: { select: { id: true, nameBn: true, studentId: true, roll: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 4. Allocate Bed to Student (With Full Capacity Validation)
  static async allocateBed(data: { studentId: string; bedId: string; monthlyFee: number }) {
    const bed = await prisma.hostelBed.findUnique({
      where: { id: data.bedId },
      include: { room: true },
    });

    if (!bed) throw new Error('হোস্টেল সিট পাওয়া যায়নি');
    if (bed.status !== 'VACANT') {
      throw new Error('এই সিটে ইতিমধ্যেই অন্য ছাত্র বসবাস করছে বা সিটটি বুকড (Fully Occupied)');
    }

    return await prisma.$transaction(async (tx) => {
      // Mark Bed as OCCUPIED
      await tx.hostelBed.update({
        where: { id: data.bedId },
        data: { status: 'OCCUPIED' },
      });

      // Create Allocation
      return await tx.hostelAllocation.create({
        data: {
          studentId: data.studentId,
          bedId: data.bedId,
          monthlyFee: data.monthlyFee || Number(bed.room.monthlyRent),
          status: 'ACTIVE',
        },
        include: { student: true, bed: { include: { room: true } } },
      });
    });
  }

  // 5. Collect Hostel Monthly Fee with General Ledger Posting
  static async collectHostelFee(data: {
    allocationId: string;
    amount: number;
    paymentMethod?: 'CASH' | 'BANK' | 'BKASH';
    note?: string;
    paidById: string;
  }) {
    const alloc = await prisma.hostelAllocation.findUnique({
      where: { id: data.allocationId },
      include: { student: true, bed: true },
    });

    if (!alloc) throw new Error('হোস্টেল এলোকেশন ডাটা পাওয়া যায়নি');

    const amount = Number(data.amount);
    const method = data.paymentMethod || 'CASH';
    const voucherNumber = `HOSTEL-${Date.now().toString().slice(-6)}`;

    // Accounting Entry:
    // Dr Cash (1010) / Bank (1020)
    // Cr Hostel & Food Fee Income (3030)
    const assetCode = method === 'CASH' ? '1010' : '1020';
    const incomeCode = '3030';

    const [assetAcc, incomeAcc] = await Promise.all([
      prisma.account.findFirst({ where: { code: assetCode } }),
      prisma.account.findFirst({ where: { code: incomeCode } }),
    ]);

    let journalEntryId: string | undefined;

    if (assetAcc && incomeAcc) {
      const journal = await AccountingService.createJournalEntry({
        voucherNumber,
        description: `হোস্টেল ফি আদায় - ${alloc.student.nameBn} (${alloc.student.studentId})`,
        reference: `HOSTEL-FEE-${alloc.id}`,
        createdById: data.paidById,
        lines: [
          { accountId: assetAcc.id, type: 'DEBIT', amount, description: 'ক্যাশ/ব্যাংক ডেবিট' },
          { accountId: incomeAcc.id, type: 'CREDIT', amount, description: 'হোস্টেল ও খাবার ফি আয় ক্রেডিট' },
        ],
      });
      journalEntryId = journal.id;
    }

    return {
      voucherNumber,
      amount,
      journalEntryId,
      studentName: alloc.student.nameBn,
      allocation: alloc,
    };
  }
}
