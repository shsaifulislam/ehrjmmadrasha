import prisma from '../../config/prisma';
import { AccountingService } from '../accounting/accounting.service';
import { AppError } from '../../utils/AppError';
import { logAudit } from '../../utils/auditLogger';

export class InventoryService {
  // 1. Create Category
  static async createCategory(data: { name: string; code: string; description?: string; createdById?: string }) {
    const existing = await prisma.inventoryCategory.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('এই ক্যাটাগরি কোডটি ইতিমধ্যে বিদ্যমান', 409);
    const cat = await prisma.inventoryCategory.create({ data: { name: data.name, code: data.code, description: data.description } });
    if (data.createdById) {
      await logAudit(data.createdById, 'CREATE_INVENTORY_CATEGORY', 'inventory', `ক্যাটাগরি তৈরি: ${data.code} - ${data.name}`);
    }
    return cat;
  }

  static async getCategories() {
    return await prisma.inventoryCategory.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 2. Create Item
  static async createItem(data: {
    categoryId: string;
    name: string;
    code: string;
    unit?: string;
    minStockAlert?: number;
    unitPrice?: number;
    reorderLevel?: number;
    createdById?: string;
  }) {
    const existing = await prisma.inventoryItem.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('এই আইটেম কোডটি ইতিমধ্যে বিদ্যমান', 409);

    const item = await prisma.inventoryItem.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        code: data.code,
        unit: data.unit || 'PIECE',
        minStockAlert: data.minStockAlert || 5,
        unitPrice: data.unitPrice || 0,
        reorderLevel: data.reorderLevel || 10,
        currentStock: 0,
      },
    });

    if (data.createdById) {
      await logAudit(data.createdById, 'CREATE_INVENTORY_ITEM', 'inventory', `আইটেম তৈরি: ${data.code} - ${data.name}`);
    }
    return item;
  }

  static async getItems() {
    const items = await prisma.inventoryItem.findMany({
      include: { category: true, movements: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      ...item,
      isLowStock: item.currentStock <= item.minStockAlert,
    }));
  }

  // 3. Stock Movement (Stock In / Stock Out / Damage / Return) with Accounting & Stock Out Protection
  static async recordStockMovement(data: {
    itemId: string;
    movementType: 'STOCK_IN' | 'STOCK_OUT' | 'DAMAGE' | 'RETURN';
    quantity: number;
    department?: string;
    reference?: string;
    note?: string;
    createdById: string;
  }) {
    const item = await prisma.inventoryItem.findUnique({ where: { id: data.itemId } });
    if (!item) throw new AppError('ইনভেন্টরি আইটেম পাওয়া যায়নি', 404);

    const qty = Number(data.quantity);
    if (qty <= 0) throw new AppError('পরিমাণ ০ এর বেশি হতে হবে', 400);

    // INVALID STOCK OUT PROTECTION
    if ((data.movementType === 'STOCK_OUT' || data.movementType === 'DAMAGE') && qty > item.currentStock) {
      throw new AppError(`স্টকে পর্যাপ্ত মালামাল নেই (বর্তমান স্টক: ${item.currentStock} ${item.unit}, ইসু চাওয়া হয়েছে: ${qty} ${item.unit})`, 400);
    }

    const voucherNumber = `STK-${Date.now().toString().slice(-6)}`;
    let journalEntryId: string | undefined;

    // Post Accounting Entry for STOCK_IN (Stationery & Inventory Purchase)
    if (data.movementType === 'STOCK_IN') {
      const lineTotal = qty * Number(item.unitPrice);
      if (lineTotal > 0) {
        const [expAcc, cashAcc] = await Promise.all([
          prisma.account.findFirst({ where: { code: '4060' } }),
          prisma.account.findFirst({ where: { code: '1010' } }),
        ]);

        if (expAcc && cashAcc) {
          const journal = await AccountingService.createJournalEntry({
            voucherNumber,
            description: `ইনভেন্টরি পণ্য ক্রয় (Stock In) - ${item.name} (${qty} ${item.unit})`,
            reference: `STOCK-IN-${item.code}`,
            createdById: data.createdById,
            lines: [
              { accountId: expAcc.id, type: 'DEBIT', amount: lineTotal, description: 'স্টেশনরি ও সাপ্লাইজ ডেবিট' },
              { accountId: cashAcc.id, type: 'CREDIT', amount: lineTotal, description: 'ক্যাশ ক্যাপিটাল প্রদান' },
            ],
          });
          journalEntryId = journal.id;
        }
      }
    }

    const res = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          itemId: data.itemId,
          movementType: data.movementType,
          quantity: qty,
          department: data.department,
          reference: data.reference || voucherNumber,
          note: data.note,
          createdById: data.createdById,
        },
      });

      // Update current stock
      const stockChange = (data.movementType === 'STOCK_IN' || data.movementType === 'RETURN') ? qty : -qty;
      await tx.inventoryItem.update({
        where: { id: data.itemId },
        data: { currentStock: { increment: stockChange } },
      });

      return movement;
    });

    await logAudit(data.createdById, 'RECORD_STOCK_MOVEMENT', 'inventory', `স্টক মুভমেন্ট: ${data.movementType} (${qty} ${item.unit} - ${item.name})`);
    return res;
  }

  // 4. Fixed Asset Registration with Accounting Capitalization (Asset 1060 DEBIT)
  static async createFixedAsset(data: {
    assetCode: string;
    name: string;
    category: string;
    purchaseDate?: string;
    purchasePrice: number;
    location?: string;
    assignedTo?: string;
    serialNumber?: string;
    createdById: string;
  }) {
    const existing = await prisma.fixedAsset.findUnique({ where: { assetCode: data.assetCode } });
    if (existing) throw new AppError('এই এসেট কোডটি ইতিমধ্যে বিদ্যমান', 409);

    const price = Number(data.purchasePrice);
    const voucherNumber = `AST-${Date.now().toString().slice(-6)}`;

    // Asset Capitalization GL Posting: Dr 1060 Fixed Assets, Cr 1010 Cash
    const [assetAcc, cashAcc] = await Promise.all([
      prisma.account.findFirst({ where: { code: '1060' } }),
      prisma.account.findFirst({ where: { code: '1010' } }),
    ]);

    let journalEntryId: string | undefined;

    if (assetAcc && cashAcc) {
      const journal = await AccountingService.createJournalEntry({
        voucherNumber,
        description: `স্থায়ী সম্পদ ক্রয় ও ক্যাপিটালাইজেশন - ${data.name} (${data.assetCode})`,
        reference: `ASSET-${data.assetCode}`,
        createdById: data.createdById,
        lines: [
          { accountId: assetAcc.id, type: 'DEBIT', amount: price, description: 'ফিক্সড এসেট অ্যাকাউন্ট ডেবিট' },
          { accountId: cashAcc.id, type: 'CREDIT', amount: price, description: 'ক্যাশ অ্যাকাউন্ট ক্রেডিট' },
        ],
      });
      journalEntryId = journal.id;
    }

    const asset = await prisma.fixedAsset.create({
      data: {
        assetCode: data.assetCode,
        name: data.name,
        category: data.category,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
        purchasePrice: price,
        location: data.location,
        assignedTo: data.assignedTo,
        serialNumber: data.serialNumber,
        status: 'ACTIVE',
        journalEntryId,
      },
    });

    await logAudit(data.createdById, 'CREATE_FIXED_ASSET', 'inventory', `স্থায়ী সম্পদ তৈরি: ${data.assetCode} - ${data.name} (৳${price})`);
    return asset;
  }

  static async getFixedAssets() {
    return await prisma.fixedAsset.findMany({
      include: { maintenances: { orderBy: { maintenanceDate: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 5. Fixed Asset Maintenance Recording with Accounting Entry (Expense 4050 DEBIT)
  static async recordAssetMaintenance(data: {
    assetId: string;
    cost: number;
    description: string;
    performedBy?: string;
    newStatus?: 'ACTIVE' | 'REPAIR' | 'DISPOSED' | 'LOST';
    createdById: string;
  }) {
    const asset = await prisma.fixedAsset.findUnique({ where: { id: data.assetId } });
    if (!asset) throw new AppError('স্থায়ী সম্পদ পাওয়া যায়নি', 404);

    const cost = Number(data.cost);
    const voucherNumber = `MNT-${Date.now().toString().slice(-6)}`;

    // GL Posting: Dr Maintenance Expense (4050), Cr Cash (1010)
    const [maintAcc, cashAcc] = await Promise.all([
      prisma.account.findFirst({ where: { code: '4050' } }),
      prisma.account.findFirst({ where: { code: '1010' } }),
    ]);

    let journalEntryId: string | undefined;

    if (cost > 0 && maintAcc && cashAcc) {
      const journal = await AccountingService.createJournalEntry({
        voucherNumber,
        description: `সম্পদ মেরামত ও রক্ষণাবেক্ষণ খরচ - ${asset.name}`,
        reference: `MAINT-${asset.assetCode}`,
        createdById: data.createdById,
        lines: [
          { accountId: maintAcc.id, type: 'DEBIT', amount: cost, description: 'মেন্টেন্যান্স এক্সপেন্স ডেবিট' },
          { accountId: cashAcc.id, type: 'CREDIT', amount: cost, description: 'ক্যাশ অ্যাকাউন্ট ক্রেডিট' },
        ],
      });
      journalEntryId = journal.id;
    }

    const res = await prisma.$transaction(async (tx) => {
      const maintenance = await tx.assetMaintenance.create({
        data: {
          assetId: data.assetId,
          cost,
          description: data.description,
          performedBy: data.performedBy,
          journalEntryId,
        },
      });

      if (data.newStatus) {
        await tx.fixedAsset.update({
          where: { id: data.assetId },
          data: { status: data.newStatus },
        });
      }

      return maintenance;
    });

    await logAudit(data.createdById, 'RECORD_ASSET_MAINTENANCE', 'inventory', `সম্পদ মেন্টেন্যান্স: ${asset.name} (৳${cost})`);
    return res;
  }
}

