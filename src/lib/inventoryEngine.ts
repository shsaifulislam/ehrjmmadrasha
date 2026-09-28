import { prisma } from "./prisma";
import { recordAuditLog } from "./security";
import { dispatchNotification } from "./communicationEngine";

// =================================================================
// 1. DEFAULT SEEDING & INITIALIZATION
// =================================================================

export const DEFAULT_INVENTORY_CATEGORIES = [
  { code: "STATIONERY", nameBn: "স্টেশনারি ও খাতা-কলম", nameEn: "Stationery & Supplies", sortOrder: 1 },
  { code: "ACADEMIC", nameBn: "শিক্ষা ও পাঠ্যবই উপকরণ", nameEn: "Academic & Books", sortOrder: 2 },
  { code: "CLEANING", nameBn: "পরিষ্কার-পরিচ্ছন্নতা সামগ্রী", nameEn: "Cleaning Materials", sortOrder: 3 },
  { code: "KITCHEN", nameBn: "লিল্লাহ বোর্ডিং ও রান্নাঘর", nameEn: "Kitchen & Boarding", sortOrder: 4 },
  { code: "FOOD", nameBn: "খাদ্য ও নিত্যপ্রয়োজনীয় দ্রব্য", nameEn: "Food & Groceries", sortOrder: 5 },
  { code: "ELECTRICAL", nameBn: "বৈদ্যুতিক ও আলোকসজ্জা", nameEn: "Electrical Supplies", sortOrder: 6 },
  { code: "IT", nameBn: "কম্পিউটার ও আইটি এক্সেসরিজ", nameEn: "IT & Hardware", sortOrder: 7 },
  { code: "FURNITURE", nameBn: "আসবাবপত্র ও ডেসট্রিবিউশন", nameEn: "Furniture & Fixtures", sortOrder: 8 },
  { code: "MAINTENANCE", nameBn: "রক্ষণাবেক্ষণ ও নির্মাণ উপকরণ", nameEn: "Maintenance Supplies", sortOrder: 9 },
  { code: "OTHER", nameBn: "অন্যান্য প্রাতিষ্ঠানিক সামগ্রী", nameEn: "General & Miscellaneous", sortOrder: 10 },
];

export const DEFAULT_INVENTORY_LOCATIONS = [
  { code: "MAIN_STORE", nameBn: "প্রধান কেন্দ্রীয় স্টোর", nameEn: "Main Central Store" },
  { code: "OFFICE", nameBn: "প্রশাসনিক দপ্তর", nameEn: "Administrative Office" },
  { code: "LIBRARY", nameBn: "মাদরাসা কেন্দ্রীয় লাইব্রেরি", nameEn: "Central Library" },
  { code: "KITCHEN", nameBn: "লিল্লাহ বোর্ডিং পাকঘর", nameEn: "Lillah Boarding Kitchen" },
  { code: "COMPUTER_LAB", nameBn: "আইটি ও কম্পিউটার ল্যাব", nameEn: "Computer & IT Lab" },
  { code: "ACADEMIC_BUILDING", nameBn: "একাডেমিক ভবন ক্লাসরুম", nameEn: "Academic Classrooms" },
  { code: "MAINTENANCE_STORE", nameBn: "রক্ষণাবেক্ষণ ওয়ার্কশপ", nameEn: "Maintenance Workshop" },
];

export async function ensureDefaultInventoryMasterData() {
  for (const cat of DEFAULT_INVENTORY_CATEGORIES) {
    await prisma.inventoryCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: {
        code: cat.code,
        nameBn: cat.nameBn,
        nameEn: cat.nameEn,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
  }

  for (const loc of DEFAULT_INVENTORY_LOCATIONS) {
    await prisma.inventoryLocation.upsert({
      where: { code: loc.code },
      update: {},
      create: {
        code: loc.code,
        nameBn: loc.nameBn,
        nameEn: loc.nameEn,
        isActive: true,
      },
    });
  }
}

// =================================================================
// 2. ATOMIC SEQUENCE GENERATORS
// =================================================================

export type InventorySequencePrefix = "INV" | "AST" | "STX" | "SUP" | "PRQ" | "PO" | "GRN";

export async function generateNextInventorySequence(
  prefix: InventorySequencePrefix,
  year?: number,
  client?: any
): Promise<string> {
  const currentYear = year || new Date().getFullYear();
  const db = client || prisma;

  const existing = await db.inventorySequence.findUnique({
    where: {
      prefix_year: {
        prefix,
        year: currentYear,
      },
    },
  });

  let lastSeq = 1;
  if (!existing) {
    try {
      const created = await db.inventorySequence.create({
        data: {
          prefix,
          year: currentYear,
          lastSeq: 1,
        },
      });
      lastSeq = created.lastSeq;
    } catch {
      const fallback = await db.inventorySequence.update({
        where: {
          prefix_year: {
            prefix,
            year: currentYear,
          },
        },
        data: {
          lastSeq: { increment: 1 },
        },
      });
      lastSeq = fallback.lastSeq;
    }
  } else {
    const updated = await db.inventorySequence.update({
      where: {
        prefix_year: {
          prefix,
          year: currentYear,
        },
      },
      data: {
        lastSeq: { increment: 1 },
      },
    });
    lastSeq = updated.lastSeq;
  }

  const padded =
    prefix === "STX"
      ? String(lastSeq).padStart(6, "0")
      : String(lastSeq).padStart(4, "0");

  return `EHRJ-${prefix}-${currentYear}-${padded}`;
}

// =================================================================
// 3. CATEGORIES & LOCATIONS
// =================================================================

export async function getInventoryCategories(options?: { onlyActive?: boolean }) {
  await ensureDefaultInventoryMasterData();
  return prisma.inventoryCategory.findMany({
    where: options?.onlyActive ? { isActive: true } : undefined,
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });
}

export async function createInventoryCategory(
  data: {
    code: string;
    nameBn: string;
    nameEn?: string;
    description?: string;
    sortOrder?: number;
  },
  adminUserId: string
) {
  const code = data.code.toUpperCase().trim();
  const existing = await prisma.inventoryCategory.findUnique({ where: { code } });
  if (existing) {
    throw new Error(`'${code}' কোডযুক্ত ক্যাটাগরি ইতিমধ্যে বিদ্যমান রয়েছে।`);
  }

  const category = await prisma.inventoryCategory.create({
    data: {
      code,
      nameBn: data.nameBn.trim(),
      nameEn: data.nameEn?.trim() || null,
      description: data.description?.trim() || null,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "CREATE",
    entityType: "InventoryCategory",
    entityId: category.id,
    details: { code, nameBn: data.nameBn },
  });

  return category;
}

export async function updateInventoryCategory(
  id: string,
  data: Partial<{
    nameBn: string;
    nameEn?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }>,
  adminUserId: string
) {
  const updated = await prisma.inventoryCategory.update({
    where: { id },
    data: {
      ...(data.nameBn && { nameBn: data.nameBn.trim() }),
      ...(data.nameEn !== undefined && { nameEn: data.nameEn?.trim() || null }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "UPDATE",
    entityType: "InventoryCategory",
    entityId: id,
    details: data,
  });

  return updated;
}

export async function getInventoryLocations(options?: { onlyActive?: boolean }) {
  await ensureDefaultInventoryMasterData();
  return prisma.inventoryLocation.findMany({
    where: options?.onlyActive ? { isActive: true } : undefined,
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          stockBalances: true,
          assets: true,
        },
      },
    },
  });
}

export async function createInventoryLocation(
  data: {
    code: string;
    nameBn: string;
    nameEn?: string;
    description?: string;
  },
  adminUserId: string
) {
  const code = data.code.toUpperCase().trim();
  const existing = await prisma.inventoryLocation.findUnique({ where: { code } });
  if (existing) {
    throw new Error(`'${code}' কোডযুক্ত লোকেশন ইতিমধ্যে বিদ্যমান রয়েছে।`);
  }

  const location = await prisma.inventoryLocation.create({
    data: {
      code,
      nameBn: data.nameBn.trim(),
      nameEn: data.nameEn?.trim() || null,
      description: data.description?.trim() || null,
      isActive: true,
    },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "CREATE",
    entityType: "InventoryLocation",
    entityId: location.id,
    details: { code, nameBn: data.nameBn },
  });

  return location;
}

export async function updateInventoryLocation(
  id: string,
  data: Partial<{
    nameBn: string;
    nameEn?: string;
    description?: string;
    isActive?: boolean;
  }>,
  adminUserId: string
) {
  const updated = await prisma.inventoryLocation.update({
    where: { id },
    data: {
      ...(data.nameBn && { nameBn: data.nameBn.trim() }),
      ...(data.nameEn !== undefined && { nameEn: data.nameEn?.trim() || null }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "UPDATE",
    entityType: "InventoryLocation",
    entityId: id,
    details: data,
  });

  return updated;
}

// =================================================================
// 4. ITEM MASTER
// =================================================================

export async function getInventoryItems(filters?: {
  categoryId?: string;
  isConsumable?: boolean;
  isActive?: boolean;
  search?: string;
}) {
  await ensureDefaultInventoryMasterData();
  const where: any = {};

  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.isConsumable !== undefined) where.isConsumable = filters.isConsumable;
  if (filters?.isActive !== undefined) where.isActive = filters.isActive;

  if (filters?.search) {
    const s = filters.search.trim();
    where.OR = [
      { nameBn: { contains: s } },
      { nameEn: { contains: s } },
      { itemCode: { contains: s } },
      { description: { contains: s } },
    ];
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    include: {
      category: true,
      stockBalances: {
        include: {
          location: true,
        },
      },
      _count: {
        select: {
          assets: true,
          transactions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => {
    const totalCurrentStock = item.stockBalances.reduce((sum, b) => sum + b.currentBalance, 0);
    const isLowStock = totalCurrentStock <= item.minStock && totalCurrentStock > 0;
    const isOutOfStock = totalCurrentStock === 0;

    return {
      ...item,
      totalCurrentStock,
      isLowStock,
      isOutOfStock,
    };
  });
}

export async function getInventoryItemById(id: string) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      category: true,
      stockBalances: {
        include: {
          location: true,
        },
      },
      transactions: {
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          sourceLocation: true,
          destLocation: true,
          recordedByUser: { select: { id: true, name: true, role: true } },
        },
      },
      assets: {
        include: {
          location: true,
          assignedUser: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  if (!item) return null;

  const totalCurrentStock = item.stockBalances.reduce((sum, b) => sum + b.currentBalance, 0);
  return {
    ...item,
    totalCurrentStock,
    isLowStock: totalCurrentStock <= item.minStock && totalCurrentStock > 0,
    isOutOfStock: totalCurrentStock === 0,
  };
}

export async function createInventoryItem(
  data: {
    nameBn: string;
    nameEn?: string;
    categoryId: string;
    unit: string;
    description?: string;
    isConsumable?: boolean;
    minStock?: number;
    reorderLevel?: number;
    maxStock?: number;
    defaultUnitCost?: number;
    notes?: string;
    initialStock?: {
      locationId: string;
      quantity: number;
    };
  },
  adminUserId: string
) {
  const category = await prisma.inventoryCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new Error("নির্বাচিত ক্যাটাগরি পাওয়া যায়নি।");

  const itemCode = await generateNextInventorySequence("INV");

  const item = await prisma.$transaction(async (tx) => {
    const newItem = await tx.inventoryItem.create({
      data: {
        itemCode,
        nameBn: data.nameBn.trim(),
        nameEn: data.nameEn?.trim() || null,
        categoryId: data.categoryId,
        unit: data.unit.trim().toUpperCase(),
        description: data.description?.trim() || null,
        isConsumable: data.isConsumable ?? true,
        minStock: data.minStock ?? 5,
        reorderLevel: data.reorderLevel ?? 10,
        maxStock: data.maxStock || null,
        defaultUnitCost: data.defaultUnitCost ?? 0,
        isActive: true,
        notes: data.notes?.trim() || null,
      },
    });

    if (data.initialStock && data.initialStock.quantity > 0) {
      const location = await tx.inventoryLocation.findUnique({
        where: { id: data.initialStock.locationId },
      });
      if (!location) throw new Error("প্রারম্ভিক স্টকের নির্ধারিত লোকেশন পাওয়া যায়নি।");

      await tx.inventoryStockBalance.create({
        data: {
          itemId: newItem.id,
          locationId: location.id,
          openingBalance: data.initialStock.quantity,
          totalIn: data.initialStock.quantity,
          totalOut: 0,
          currentBalance: data.initialStock.quantity,
          lastAdjustedAt: new Date(),
        },
      });

      const txNumber = await generateNextInventorySequence("STX", undefined, tx);
      await tx.inventoryTransaction.create({
        data: {
          transactionNumber: txNumber,
          itemId: newItem.id,
          destLocationId: location.id,
          transactionType: "OPENING",
          quantity: data.initialStock.quantity,
          unitCost: data.defaultUnitCost ?? 0,
          totalCost: (data.defaultUnitCost ?? 0) * data.initialStock.quantity,
          purpose: "প্রারম্ভিক মজুদ (Opening Stock)",
          systemStockBefore: 0,
          systemStockAfter: data.initialStock.quantity,
          notes: "পণ্য তৈরির সময় প্রারম্ভিক স্টক এন্ট্রি",
          recordedByUserId: adminUserId,
        },
      });
    }

    return newItem;
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "CREATE",
    entityType: "InventoryItem",
    entityId: item.id,
    details: { itemCode, nameBn: data.nameBn, categoryId: data.categoryId },
  });

  return item;
}

export async function updateInventoryItem(
  id: string,
  data: Partial<{
    nameBn: string;
    nameEn?: string;
    categoryId: string;
    unit: string;
    description?: string;
    isConsumable?: boolean;
    minStock?: number;
    reorderLevel?: number;
    maxStock?: number;
    defaultUnitCost?: number;
    isActive?: boolean;
    notes?: string;
  }>,
  adminUserId: string
) {
  const updated = await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(data.nameBn && { nameBn: data.nameBn.trim() }),
      ...(data.nameEn !== undefined && { nameEn: data.nameEn?.trim() || null }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.unit && { unit: data.unit.trim().toUpperCase() }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.isConsumable !== undefined && { isConsumable: data.isConsumable }),
      ...(data.minStock !== undefined && { minStock: data.minStock }),
      ...(data.reorderLevel !== undefined && { reorderLevel: data.reorderLevel }),
      ...(data.maxStock !== undefined && { maxStock: data.maxStock }),
      ...(data.defaultUnitCost !== undefined && { defaultUnitCost: data.defaultUnitCost }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
    },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "UPDATE",
    entityType: "InventoryItem",
    entityId: id,
    details: data,
  });

  return updated;
}

// =================================================================
// 5. AUTHORITATIVE STOCK OPERATIONS (TRANSACTIONAL & IMMUTABLE)
// =================================================================

export async function getStockBalances(filters?: {
  itemId?: string;
  locationId?: string;
  lowStockOnly?: boolean;
}) {
  const where: any = {};
  if (filters?.itemId) where.itemId = filters.itemId;
  if (filters?.locationId) where.locationId = filters.locationId;

  const balances = await prisma.inventoryStockBalance.findMany({
    where,
    include: {
      item: {
        include: {
          category: true,
        },
      },
      location: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (filters?.lowStockOnly) {
    return balances.filter((b) => b.currentBalance <= b.item.minStock);
  }

  return balances;
}

/**
 * Record Stock-In atomically.
 * Updates stock balance & creates immutable transaction record.
 */
export async function recordStockIn(params: {
  itemId: string;
  locationId: string;
  quantity: number;
  unitCost?: number;
  transactionType?: "PURCHASE_IN" | "RETURN_IN" | "ADJUSTMENT_IN";
  reference?: string;
  purpose?: string;
  notes?: string;
  adminUserId: string;
}) {
  if (params.quantity <= 0) {
    throw new Error("স্টক-ইন এর পরিমাণ শূন্যের বেশি হতে হবে।");
  }

  const item = await prisma.inventoryItem.findUnique({ where: { id: params.itemId } });
  if (!item) throw new Error("পণ্যটি পাওয়া যায়নি।");

  const location = await prisma.inventoryLocation.findUnique({ where: { id: params.locationId } });
  if (!location) throw new Error("লোকেশন পাওয়া যায়নি।");

  const unitCost = params.unitCost ?? item.defaultUnitCost;
  const totalCost = unitCost * params.quantity;
  const txType = params.transactionType || "PURCHASE_IN";

  const result = await prisma.$transaction(async (tx) => {
    const balance = await tx.inventoryStockBalance.upsert({
      where: {
        itemId_locationId: {
          itemId: item.id,
          locationId: location.id,
        },
      },
      update: {
        totalIn: { increment: params.quantity },
        currentBalance: { increment: params.quantity },
        lastAdjustedAt: new Date(),
      },
      create: {
        itemId: item.id,
        locationId: location.id,
        openingBalance: 0,
        totalIn: params.quantity,
        totalOut: 0,
        currentBalance: params.quantity,
        lastAdjustedAt: new Date(),
      },
    });

    const txNumber = await generateNextInventorySequence("STX", undefined, tx);
    const stockTx = await tx.inventoryTransaction.create({
      data: {
        transactionNumber: txNumber,
        itemId: item.id,
        destLocationId: location.id,
        transactionType: txType,
        quantity: params.quantity,
        unitCost,
        totalCost,
        reference: params.reference?.trim() || null,
        purpose: params.purpose?.trim() || "স্টক-ইন গ্রহণ",
        systemStockBefore: balance.currentBalance - params.quantity,
        systemStockAfter: balance.currentBalance,
        notes: params.notes?.trim() || null,
        recordedByUserId: params.adminUserId,
      },
    });

    return { balance, stockTx };
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "CREATE",
    entityType: "InventoryTransaction",
    entityId: result.stockTx.id,
    details: {
      type: txType,
      itemId: item.id,
      locationId: location.id,
      quantity: params.quantity,
    },
  });

  return result;
}

/**
 * Record Stock-Out with authoritative negative stock protection.
 */
export async function recordStockOut(params: {
  itemId: string;
  locationId: string;
  quantity: number;
  purpose: string;
  recipient?: string;
  reference?: string;
  transactionType?: "ISSUE_OUT" | "DAMAGE_OUT" | "LOSS_OUT" | "DISPOSAL_OUT";
  notes?: string;
  adminUserId: string;
}) {
  if (params.quantity <= 0) {
    throw new Error("স্টক-আউট এর পরিমাণ শূন্যের বেশি হতে হবে।");
  }

  const item = await prisma.inventoryItem.findUnique({ where: { id: params.itemId } });
  if (!item) throw new Error("পণ্যটি পাওয়া যায়নি।");

  const location = await prisma.inventoryLocation.findUnique({ where: { id: params.locationId } });
  if (!location) throw new Error("লোকেশন পাওয়া যায়নি।");

  const txType = params.transactionType || "ISSUE_OUT";

  const result = await prisma.$transaction(async (tx) => {
    const balance = await tx.inventoryStockBalance.findUnique({
      where: {
        itemId_locationId: {
          itemId: item.id,
          locationId: location.id,
        },
      },
    });

    const currentQty = balance?.currentBalance || 0;
    if (currentQty < params.quantity) {
      throw new Error(
        `পর্যাপ্ত স্টক নেই! '${location.nameBn}' অবস্থানে বর্তমান মজুদ: ${currentQty} ${item.unit}, আবেদনকৃত আউট: ${params.quantity} ${item.unit}।`
      );
    }

    const updatedBalance = await tx.inventoryStockBalance.update({
      where: { id: balance!.id },
      data: {
        totalOut: { increment: params.quantity },
        currentBalance: { decrement: params.quantity },
        lastAdjustedAt: new Date(),
      },
    });

    const txNumber = await generateNextInventorySequence("STX", undefined, tx);
    const stockTx = await tx.inventoryTransaction.create({
      data: {
        transactionNumber: txNumber,
        itemId: item.id,
        sourceLocationId: location.id,
        transactionType: txType,
        quantity: params.quantity,
        unitCost: item.defaultUnitCost,
        totalCost: item.defaultUnitCost * params.quantity,
        reference: params.reference?.trim() || null,
        purpose: params.purpose.trim(),
        recipient: params.recipient?.trim() || null,
        systemStockBefore: currentQty,
        systemStockAfter: updatedBalance.currentBalance,
        notes: params.notes?.trim() || null,
        recordedByUserId: params.adminUserId,
      },
    });

    return { balance: updatedBalance, stockTx };
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "CREATE",
    entityType: "InventoryTransaction",
    entityId: result.stockTx.id,
    details: {
      type: txType,
      itemId: item.id,
      locationId: location.id,
      quantity: params.quantity,
      recipient: params.recipient,
    },
  });

  // Check low stock trigger
  if (result.balance.currentBalance <= item.minStock) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        take: 3,
      });

      await dispatchNotification({
        templateCode: "INVENTORY_LOW_STOCK",
        variables: {
          "item.nameBn": item.nameBn,
          "item.code": item.itemCode,
          currentStock: String(result.balance.currentBalance),
          minStock: String(item.minStock),
          unit: item.unit,
        },
        recipients: admins.map((a) => ({
          userId: a.id,
          name: a.name,
          email: a.email,
          role: "ADMIN",
        })),
        relatedEntityType: "InventoryItem",
        relatedEntityId: item.id,
        idempotencyBaseKey: `LOW_STK_${item.id}_${new Date().toISOString().slice(0, 10)}`,
        priority: "IMPORTANT",
      });
    } catch (e) {
      console.error("Low stock notification dispatch error:", e);
    }
  }

  return result;
}

/**
 * Record Stock Transfer between two institutional locations.
 */
export async function recordStockTransfer(params: {
  itemId: string;
  sourceLocationId: string;
  destLocationId: string;
  quantity: number;
  notes?: string;
  adminUserId: string;
}) {
  if (params.sourceLocationId === params.destLocationId) {
    throw new Error("উৎস ও গন্তব্য লোকেশন একই হতে পারে না।");
  }

  if (params.quantity <= 0) {
    throw new Error("স্থানান্তরের পরিমাণ শূন্যের বেশি হতে হবে।");
  }

  const item = await prisma.inventoryItem.findUnique({ where: { id: params.itemId } });
  if (!item) throw new Error("পণ্যটি পাওয়া যায়নি।");

  const sourceLoc = await prisma.inventoryLocation.findUnique({ where: { id: params.sourceLocationId } });
  const destLoc = await prisma.inventoryLocation.findUnique({ where: { id: params.destLocationId } });
  if (!sourceLoc || !destLoc) throw new Error("উৎস বা গন্তব্য লোকেশন সঠিক নয়।");

  const result = await prisma.$transaction(async (tx) => {
    const srcBalance = await tx.inventoryStockBalance.findUnique({
      where: {
        itemId_locationId: {
          itemId: item.id,
          locationId: sourceLoc.id,
        },
      },
    });

    const srcQty = srcBalance?.currentBalance || 0;
    if (srcQty < params.quantity) {
      throw new Error(
        `পর্যাপ্ত স্টক নেই! '${sourceLoc.nameBn}'-এ বর্তমান মজুদ: ${srcQty} ${item.unit}, স্থানান্তর চাওয়া হয়েছে: ${params.quantity} ${item.unit}।`
      );
    }

    // 1. Deduct from source
    const updatedSrc = await tx.inventoryStockBalance.update({
      where: { id: srcBalance!.id },
      data: {
        totalOut: { increment: params.quantity },
        currentBalance: { decrement: params.quantity },
        lastAdjustedAt: new Date(),
      },
    });

    // 2. Add to dest
    const updatedDest = await tx.inventoryStockBalance.upsert({
      where: {
        itemId_locationId: {
          itemId: item.id,
          locationId: destLoc.id,
        },
      },
      update: {
        totalIn: { increment: params.quantity },
        currentBalance: { increment: params.quantity },
        lastAdjustedAt: new Date(),
      },
      create: {
        itemId: item.id,
        locationId: destLoc.id,
        openingBalance: 0,
        totalIn: params.quantity,
        totalOut: 0,
        currentBalance: params.quantity,
        lastAdjustedAt: new Date(),
      },
    });

    // 3. Transactions
    const txNumberOut = await generateNextInventorySequence("STX", undefined, tx);
    const stockTxOut = await tx.inventoryTransaction.create({
      data: {
        transactionNumber: txNumberOut,
        itemId: item.id,
        sourceLocationId: sourceLoc.id,
        destLocationId: destLoc.id,
        transactionType: "TRANSFER_OUT",
        quantity: params.quantity,
        unitCost: item.defaultUnitCost,
        totalCost: item.defaultUnitCost * params.quantity,
        purpose: `স্থানান্তর: ${sourceLoc.nameBn} → ${destLoc.nameBn}`,
        systemStockBefore: srcQty,
        systemStockAfter: updatedSrc.currentBalance,
        notes: params.notes?.trim() || null,
        recordedByUserId: params.adminUserId,
      },
    });

    const txNumberIn = await generateNextInventorySequence("STX", undefined, tx);
    const stockTxIn = await tx.inventoryTransaction.create({
      data: {
        transactionNumber: txNumberIn,
        itemId: item.id,
        sourceLocationId: sourceLoc.id,
        destLocationId: destLoc.id,
        transactionType: "TRANSFER_IN",
        quantity: params.quantity,
        unitCost: item.defaultUnitCost,
        totalCost: item.defaultUnitCost * params.quantity,
        purpose: `স্থানান্তর গ্রহণ: ${sourceLoc.nameBn} হতে প্রাপ্ত`,
        systemStockBefore: updatedDest.currentBalance - params.quantity,
        systemStockAfter: updatedDest.currentBalance,
        notes: params.notes?.trim() || null,
        recordedByUserId: params.adminUserId,
      },
    });

    return { updatedSrc, updatedDest, stockTxOut, stockTxIn };
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "TRANSFER",
    entityType: "InventoryStockBalance",
    entityId: params.itemId,
    details: {
      source: sourceLoc.code,
      destination: destLoc.code,
      quantity: params.quantity,
    },
  });

  return result;
}

/**
 * Record Physical Stock Count Adjustment.
 * Difference recorded explicitly via ADJUSTMENT_IN or ADJUSTMENT_OUT.
 */
export async function recordStockAdjustment(params: {
  itemId: string;
  locationId: string;
  actualQuantity: number;
  reason: string;
  notes?: string;
  adminUserId: string;
}) {
  if (params.actualQuantity < 0) {
    throw new Error("ভৌত গণনাকৃত মজুদ ঋণাত্মক হতে পারে না।");
  }

  const item = await prisma.inventoryItem.findUnique({ where: { id: params.itemId } });
  if (!item) throw new Error("পণ্যটি পাওয়া যায়নি।");

  const location = await prisma.inventoryLocation.findUnique({ where: { id: params.locationId } });
  if (!location) throw new Error("লোকেশন পাওয়া যায়নি।");

  const result = await prisma.$transaction(async (tx) => {
    const balance = await tx.inventoryStockBalance.upsert({
      where: {
        itemId_locationId: {
          itemId: item.id,
          locationId: location.id,
        },
      },
      update: {},
      create: {
        itemId: item.id,
        locationId: location.id,
        openingBalance: 0,
        totalIn: 0,
        totalOut: 0,
        currentBalance: 0,
      },
    });

    const systemQty = balance.currentBalance;
    const diff = params.actualQuantity - systemQty;

    if (diff === 0) {
      throw new Error("সিস্টেম মজুদ এবং গণনা করা মজুদ একই। কোনো সমন্বয় প্রয়োজন নেই।");
    }

    const txType = diff > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";
    const absDiff = Math.abs(diff);

    const updatedBalance = await tx.inventoryStockBalance.update({
      where: { id: balance.id },
      data: {
        ...(diff > 0
          ? { totalIn: { increment: absDiff } }
          : { totalOut: { increment: absDiff } }),
        currentBalance: params.actualQuantity,
        lastAdjustedAt: new Date(),
      },
    });

    const txNumber = await generateNextInventorySequence("STX", undefined, tx);
    const stockTx = await tx.inventoryTransaction.create({
      data: {
        transactionNumber: txNumber,
        itemId: item.id,
        sourceLocationId: diff < 0 ? location.id : null,
        destLocationId: diff > 0 ? location.id : null,
        transactionType: txType,
        quantity: absDiff,
        unitCost: item.defaultUnitCost,
        totalCost: item.defaultUnitCost * absDiff,
        purpose: `ভৌত গণনা সমন্বয় (কারণ: ${params.reason})`,
        systemStockBefore: systemQty,
        systemStockAfter: params.actualQuantity,
        notes: params.notes?.trim() || `পার্থক্য: ${diff > 0 ? `+${diff}` : diff}`,
        recordedByUserId: params.adminUserId,
      },
    });

    return { balance: updatedBalance, stockTx, diff };
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "ADJUST",
    entityType: "InventoryStockBalance",
    entityId: result.balance.id,
    details: {
      systemQtyBefore: result.stockTx.systemStockBefore,
      actualQty: params.actualQuantity,
      diff: result.diff,
      reason: params.reason,
    },
  });

  return result;
}

export async function getInventoryTransactions(filters?: {
  itemId?: string;
  locationId?: string;
  type?: string;
  limit?: number;
}) {
  const where: any = {};
  if (filters?.itemId) where.itemId = filters.itemId;
  if (filters?.type) where.transactionType = filters.type;
  if (filters?.locationId) {
    where.OR = [
      { sourceLocationId: filters.locationId },
      { destLocationId: filters.locationId },
    ];
  }

  return prisma.inventoryTransaction.findMany({
    where,
    include: {
      item: { include: { category: true } },
      sourceLocation: true,
      destLocation: true,
      recordedByUser: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit || 100,
  });
}

// =================================================================
// 6. SUPPLIERS DIRECTORY
// =================================================================

export async function getSuppliers(options?: { onlyActive?: boolean; search?: string }) {
  const where: any = {};
  if (options?.onlyActive) where.isActive = true;
  if (options?.search) {
    const s = options.search.trim();
    where.OR = [
      { name: { contains: s } },
      { contactPerson: { contains: s } },
      { phone: { contains: s } },
      { supplierCode: { contains: s } },
    ];
  }

  return prisma.supplier.findMany({
    where,
    include: {
      _count: {
        select: {
          purchaseOrders: true,
          assets: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createSupplier(
  data: {
    name: string;
    contactPerson?: string;
    phone: string;
    altPhone?: string;
    email?: string;
    address?: string;
    taxNumber?: string;
    notes?: string;
  },
  adminUserId: string
) {
  const supplierCode = await generateNextInventorySequence("SUP");

  const supplier = await prisma.supplier.create({
    data: {
      supplierCode,
      name: data.name.trim(),
      contactPerson: data.contactPerson?.trim() || null,
      phone: data.phone.trim(),
      altPhone: data.altPhone?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      taxNumber: data.taxNumber?.trim() || null,
      notes: data.notes?.trim() || null,
      isActive: true,
    },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "CREATE",
    entityType: "Supplier",
    entityId: supplier.id,
    details: { supplierCode, name: data.name },
  });

  return supplier;
}

export async function updateSupplier(
  id: string,
  data: Partial<{
    name: string;
    contactPerson?: string;
    phone: string;
    altPhone?: string;
    email?: string;
    address?: string;
    taxNumber?: string;
    notes?: string;
    isActive?: boolean;
  }>,
  adminUserId: string
) {
  const updated = await prisma.supplier.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson?.trim() || null }),
      ...(data.phone && { phone: data.phone.trim() }),
      ...(data.altPhone !== undefined && { altPhone: data.altPhone?.trim() || null }),
      ...(data.email !== undefined && { email: data.email?.trim() || null }),
      ...(data.address !== undefined && { address: data.address?.trim() || null }),
      ...(data.taxNumber !== undefined && { taxNumber: data.taxNumber?.trim() || null }),
      ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "UPDATE",
    entityType: "Supplier",
    entityId: id,
    details: data,
  });

  return updated;
}

// =================================================================
// 7. PROCUREMENT: PURCHASE REQUESTS
// =================================================================

export async function getPurchaseRequests(filters?: { status?: string; priority?: string }) {
  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;

  return prisma.purchaseRequest.findMany({
    where,
    include: {
      requestedByUser: { select: { id: true, name: true, role: true } },
      reviewedByUser: { select: { id: true, name: true, role: true } },
      items: {
        include: {
          item: { include: { category: true } },
        },
      },
      purchaseOrders: {
        select: { id: true, poNumber: true, status: true, totalAmount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPurchaseRequest(
  data: {
    title: string;
    purpose: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    requiredDate?: Date;
    adminNotes?: string;
    items: Array<{
      itemId: string;
      quantity: number;
      estimatedUnitCost?: number;
      notes?: string;
    }>;
  },
  userId: string
) {
  if (!data.items || data.items.length === 0) {
    throw new Error("কমপক্ষে একটি পণ্যের তালিকা প্রদান করতে হবে।");
  }

  const requestNumber = await generateNextInventorySequence("PRQ");

  let totalEstimatedCost = 0;
  const sanitizedItems = data.items.map((it) => {
    if (it.quantity <= 0) throw new Error("পরিমাণ অবশ্যই শূন্যের চেয়ে বেশি হতে হবে।");
    const unitCost = it.estimatedUnitCost ?? 0;
    const itemTotal = unitCost * it.quantity;
    totalEstimatedCost += itemTotal;
    return {
      itemId: it.itemId,
      quantity: it.quantity,
      estimatedUnitCost: unitCost,
      totalEstimated: itemTotal,
      notes: it.notes?.trim() || null,
    };
  });

  const request = await prisma.purchaseRequest.create({
    data: {
      requestNumber,
      title: data.title.trim(),
      purpose: data.purpose.trim(),
      priority: data.priority || "NORMAL",
      status: "SUBMITTED",
      requiredDate: data.requiredDate || null,
      totalEstimatedCost,
      adminNotes: data.adminNotes?.trim() || null,
      requestedByUserId: userId,
      items: {
        create: sanitizedItems,
      },
    },
    include: {
      items: { include: { item: true } },
      requestedByUser: { select: { id: true, name: true, role: true } },
    },
  });

  await recordAuditLog({
    userId,
    action: "CREATE",
    entityType: "PurchaseRequest",
    entityId: request.id,
    details: { requestNumber, title: data.title, totalEstimatedCost },
  });

  return request;
}

export async function reviewPurchaseRequest(
  requestId: string,
  action: "APPROVE" | "REJECT",
  reviewNotes: string | undefined,
  adminUserId: string
) {
  const reqRecord = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
    include: { requestedByUser: true },
  });

  if (!reqRecord) throw new Error("ক্রয় আবেদনটি পাওয়া যায়নি।");
  if (reqRecord.status !== "SUBMITTED" && reqRecord.status !== "DRAFT") {
    throw new Error(`এই আবেদনটি ইতিমধ্যে '${reqRecord.status}' অবস্থায় রয়েছে।`);
  }

  const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updated = await prisma.purchaseRequest.update({
    where: { id: requestId },
    data: {
      status: newStatus,
      adminNotes: reviewNotes?.trim() || reqRecord.adminNotes,
      reviewedByUserId: adminUserId,
      reviewedAt: new Date(),
    },
    include: {
      items: { include: { item: true } },
    },
  });

  await recordAuditLog({
    userId: adminUserId,
    action: newStatus,
    entityType: "PurchaseRequest",
    entityId: requestId,
    details: { requestNumber: reqRecord.requestNumber, action, reviewNotes },
  });

  // Notify requester
  try {
    await dispatchNotification({
      templateCode: action === "APPROVE" ? "PROCUREMENT_REQUEST_APPROVED" : "PROCUREMENT_REQUEST_REJECTED",
      variables: {
        "request.number": reqRecord.requestNumber,
        "request.title": reqRecord.title,
        reason: reviewNotes || (action === "APPROVE" ? "যাচাইপূর্বক অনুমোদন" : "বাজেট সীমাবদ্ধতা"),
      },
      recipients: [
        {
          userId: reqRecord.requestedByUser.id,
          name: reqRecord.requestedByUser.name,
          email: reqRecord.requestedByUser.email,
          role: reqRecord.requestedByUser.role,
        },
      ],
      relatedEntityType: "PurchaseRequest",
      relatedEntityId: requestId,
      idempotencyBaseKey: `PRQ_REV_${requestId}_${action}`,
      priority: "IMPORTANT",
    });
  } catch (e) {
    console.error("Review notification dispatch error:", e);
  }

  return updated;
}

// =================================================================
// 8. PURCHASE ORDERS & GOODS RECEIVING
// =================================================================

export async function getPurchaseOrders(filters?: { supplierId?: string; status?: string }) {
  const where: any = {};
  if (filters?.supplierId) where.supplierId = filters.supplierId;
  if (filters?.status) where.status = filters.status;

  return prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: true,
      purchaseRequest: true,
      createdByUser: { select: { id: true, name: true, role: true } },
      approvedByUser: { select: { id: true, name: true, role: true } },
      items: {
        include: {
          item: { include: { category: true } },
        },
      },
      goodsReceipts: {
        include: {
          items: { include: { item: true } },
          receivedByUser: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPurchaseOrder(
  data: {
    supplierId: string;
    purchaseRequestId?: string;
    expectedDeliveryDate?: Date;
    discount?: number;
    tax?: number;
    notes?: string;
    items: Array<{
      itemId: string;
      quantity: number;
      unitPrice: number;
      notes?: string;
    }>;
  },
  adminUserId: string
) {
  const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
  if (!supplier) throw new Error("সরবরাহকারী পাওয়া যায়নি।");

  if (!data.items || data.items.length === 0) {
    throw new Error("পারচেজ অর্ডারে কমপক্ষে একটি পণ্য অন্তর্ভুক্ত করতে হবে।");
  }

  const poNumber = await generateNextInventorySequence("PO");

  let subtotal = 0;
  const sanitizedItems = data.items.map((it) => {
    const quantity = it.quantity ?? (it as any).quantityOrdered;
    if (quantity === undefined || quantity <= 0 || isNaN(quantity)) {
      throw new Error("অর্ডারকৃত পরিমাণ শূন্যের বেশি হতে হবে।");
    }
    if (it.unitPrice < 0) throw new Error("একক মূল্য ঋণাত্মক হতে পারে না।");
    const itemTotal = quantity * it.unitPrice;
    subtotal += itemTotal;
    return {
      itemId: it.itemId,
      quantityOrdered: quantity,
      quantityReceived: 0,
      unitPrice: it.unitPrice,
      totalPrice: itemTotal,
      notes: it.notes?.trim() || null,
    };
  });

  const discount = data.discount ?? 0;
  const tax = data.tax ?? 0;
  const totalAmount = Math.max(0, subtotal - discount + tax);

  const po = await prisma.$transaction(async (tx) => {
    const createdPO = await tx.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: data.supplierId,
        purchaseRequestId: data.purchaseRequestId || null,
        expectedDeliveryDate: data.expectedDeliveryDate || null,
        subtotal,
        discount,
        tax,
        totalAmount,
        status: "APPROVED", // Auto-approved when created by Admin
        approvedByUserId: adminUserId,
        approvedAt: new Date(),
        createdById: adminUserId,
        notes: data.notes?.trim() || null,
        items: {
          create: sanitizedItems,
        },
      },
      include: {
        items: { include: { item: true } },
        supplier: true,
      },
    });

    if (data.purchaseRequestId) {
      await tx.purchaseRequest.update({
        where: { id: data.purchaseRequestId },
        data: { status: "ORDERED" },
      });
    }

    return createdPO;
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "CREATE",
    entityType: "PurchaseOrder",
    entityId: po.id,
    details: { poNumber, supplierId: data.supplierId, totalAmount },
  });

  return po;
}

/**
 * Goods Receiving Workflow (Partial or Full).
 * Transactionally updates PO quantities, creates GRN records, and stocks-in accepted items.
 */
export async function receiveGoodsForPurchaseOrder(params: {
  purchaseOrderId: string;
  locationId: string;
  deliveryChallanNumber?: string;
  notes?: string;
  items: Array<{
    purchaseOrderItemId?: string;
    itemId: string;
    quantityReceived: number;
    quantityDamaged?: number;
    unitCost?: number;
  }>;
  createFinanceExpense?: boolean;
  adminUserId: string;
}) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.purchaseOrderId },
    include: {
      items: true,
      supplier: true,
    },
  });

  if (!po) throw new Error("পারচেজ অর্ডার পাওয়া যায়নি।");
  if (po.status === "RECEIVED" || po.status === "CANCELLED") {
    throw new Error(`এই পারচেজ অর্ডারটি ইতিমধ্যে '${po.status}' অবস্থায় রয়েছে। গ্রহণ সম্ভব নয়।`);
  }

  const location = await prisma.inventoryLocation.findUnique({ where: { id: params.locationId } });
  if (!location) throw new Error("স্টক-ইন এর জন্য নির্বাচিত লোকেশন সঠিক নয়।");

  if (!params.items || params.items.length === 0) {
    throw new Error("রিসিভ করার জন্য পণ্যের তালিকা প্রদান করুন।");
  }

  const grnNumber = await generateNextInventorySequence("GRN");

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create GoodsReceipt
    const grn = await tx.goodsReceipt.create({
      data: {
        receiptNumber: grnNumber,
        purchaseOrderId: po.id,
        locationId: location.id,
        deliveryChallanNumber: params.deliveryChallanNumber?.trim() || null,
        notes: params.notes?.trim() || null,
        receivedByUserId: params.adminUserId,
      },
    });

    let totalAcceptedValue = 0;

    // 2. Process each item
    for (const itemInput of params.items) {
      if (itemInput.quantityReceived <= 0) continue;

      const poItem = po.items.find(
        (it) => it.id === itemInput.purchaseOrderItemId || it.itemId === itemInput.itemId
      );
      if (!poItem) {
        throw new Error(`আইটেম ${itemInput.itemId} এই পারচেজ অর্ডারের অন্তর্ভুক্ত নয়।`);
      }

      const damaged = itemInput.quantityDamaged ?? 0;
      const accepted = Math.max(0, itemInput.quantityReceived - damaged);
      const unitCost = itemInput.unitCost ?? poItem.unitPrice;
      const itemTotalCost = accepted * unitCost;
      totalAcceptedValue += itemTotalCost;

      // Create GoodsReceiptItem
      await tx.goodsReceiptItem.create({
        data: {
          goodsReceiptId: grn.id,
          purchaseOrderItemId: poItem.id,
          itemId: poItem.itemId,
          quantityReceived: itemInput.quantityReceived,
          quantityDamaged: damaged,
          quantityAccepted: accepted,
          unitCost,
          totalCost: itemTotalCost,
        },
      });

      // Update PO Item quantityReceived
      await tx.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: {
          quantityReceived: { increment: itemInput.quantityReceived },
        },
      });

      // Stock-In accepted items into location
      if (accepted > 0) {
        const balance = await tx.inventoryStockBalance.upsert({
          where: {
            itemId_locationId: {
              itemId: poItem.itemId,
              locationId: location.id,
            },
          },
          update: {
            totalIn: { increment: accepted },
            currentBalance: { increment: accepted },
            lastAdjustedAt: new Date(),
          },
          create: {
            itemId: poItem.itemId,
            locationId: location.id,
            openingBalance: 0,
            totalIn: accepted,
            totalOut: 0,
            currentBalance: accepted,
            lastAdjustedAt: new Date(),
          },
        });

        const txNumber = await generateNextInventorySequence("STX", undefined, tx);
        await tx.inventoryTransaction.create({
          data: {
            transactionNumber: txNumber,
            itemId: poItem.itemId,
            destLocationId: location.id,
            transactionType: "PURCHASE_IN",
            quantity: accepted,
            unitCost,
            totalCost: itemTotalCost,
            reference: `PO: ${po.poNumber} | GRN: ${grnNumber}`,
            purpose: `ক্রয়কৃত মালামাল গ্রহণ (${po.supplier.name})`,
            systemStockBefore: balance.currentBalance - accepted,
            systemStockAfter: balance.currentBalance,
            notes: `চালান: ${params.deliveryChallanNumber || "N/A"}${damaged > 0 ? `, ক্ষতিগ্রস্ত: ${damaged}` : ""}`,
            recordedByUserId: params.adminUserId,
          },
        });
      }
    }

    // 3. Determine if PO is fully received
    const refreshedPoItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: po.id },
    });

    const isFullyReceived = refreshedPoItems.every(
      (it) => it.quantityReceived >= it.quantityOrdered
    );

    const updatedPOStatus = isFullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED";

    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: updatedPOStatus,
      },
    });

    if (isFullyReceived && po.purchaseRequestId) {
      await tx.purchaseRequest.update({
        where: { id: po.purchaseRequestId },
        data: { status: "RECEIVED" },
      });
    }

    return { grn, updatedPOStatus, totalAcceptedValue };
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "RECEIVE",
    entityType: "GoodsReceipt",
    entityId: result.grn.id,
    details: {
      grnNumber,
      poNumber: po.poNumber,
      poStatus: result.updatedPOStatus,
      value: result.totalAcceptedValue,
    },
  });

  // Notify admins
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      take: 3,
    });

    await dispatchNotification({
      templateCode: "PROCUREMENT_GOODS_RECEIVED",
      variables: {
        "grn.number": grnNumber,
        "po.number": po.poNumber,
        "supplier.name": po.supplier.name,
        "location.name": location.nameBn,
      },
      recipients: admins.map((a) => ({
        userId: a.id,
        name: a.name,
        email: a.email,
        role: "ADMIN",
      })),
      relatedEntityType: "GoodsReceipt",
      relatedEntityId: result.grn.id,
      idempotencyBaseKey: `GRN_${result.grn.id}`,
      priority: "NORMAL",
    });
  } catch (e) {
    console.error("Goods receipt notification dispatch error:", e);
  }

  return result;
}

// =================================================================
// 9. ASSET MANAGEMENT (REGISTRATION, ASSIGNMENT, CONDITION, DISPOSAL)
// =================================================================

export async function getInventoryAssets(filters?: {
  itemId?: string;
  locationId?: string;
  status?: string;
  condition?: string;
  assignedUserId?: string;
  search?: string;
}) {
  const where: any = {};
  if (filters?.itemId) where.itemId = filters.itemId;
  if (filters?.locationId) where.locationId = filters.locationId;
  if (filters?.status) where.status = filters.status;
  if (filters?.condition) where.condition = filters.condition;
  if (filters?.assignedUserId) where.assignedUserId = filters.assignedUserId;

  if (filters?.search) {
    const s = filters.search.trim();
    where.OR = [
      { assetCode: { contains: s } },
      { serialNumber: { contains: s } },
      { assignedDepartment: { contains: s } },
      { item: { nameBn: { contains: s } } },
      { item: { nameEn: { contains: s } } },
    ];
  }

  return prisma.inventoryAsset.findMany({
    where,
    include: {
      item: { include: { category: true } },
      location: true,
      supplier: true,
      assignedUser: { select: { id: true, name: true, role: true, email: true } },
      _count: {
        select: {
          assignments: true,
          conditions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInventoryAssetById(id: string) {
  return prisma.inventoryAsset.findUnique({
    where: { id },
    include: {
      item: { include: { category: true } },
      location: true,
      supplier: true,
      assignedUser: { select: { id: true, name: true, role: true, email: true } },
      assignments: {
        orderBy: { assignmentDate: "desc" },
        include: {
          assignedByUser: { select: { id: true, name: true, role: true } },
        },
      },
      conditions: {
        orderBy: { createdAt: "desc" },
        include: {
          recordedByUser: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });
}

export async function createInventoryAsset(
  data: {
    itemId: string;
    serialNumber?: string;
    purchaseCost?: number;
    purchaseDate?: Date;
    warrantyExpiry?: Date;
    supplierId?: string;
    locationId: string;
    condition?: "NEW" | "GOOD" | "FAIR" | "DAMAGED" | "REPAIR_REQUIRED";
    assignedUserId?: string;
    assignedDepartment?: string;
    notes?: string;
  },
  adminUserId: string
) {
  const item = await prisma.inventoryItem.findUnique({ where: { id: data.itemId } });
  if (!item) throw new Error("আইটেম পাওয়া যায়নি।");

  const location = await prisma.inventoryLocation.findUnique({ where: { id: data.locationId } });
  if (!location) throw new Error("লোকেশন পাওয়া যায়নি।");

  const assetCode = await generateNextInventorySequence("AST");

  const asset = await prisma.$transaction(async (tx) => {
    const isAssigned = !!data.assignedUserId || !!data.assignedDepartment;
    const initialStatus = isAssigned ? "IN_USE" : "AVAILABLE";
    const condition = data.condition || "NEW";

    const createdAsset = await tx.inventoryAsset.create({
      data: {
        assetCode,
        itemId: item.id,
        serialNumber: data.serialNumber?.trim() || null,
        purchaseCost: data.purchaseCost ?? item.defaultUnitCost,
        purchaseDate: data.purchaseDate || new Date(),
        warrantyExpiry: data.warrantyExpiry || null,
        supplierId: data.supplierId || null,
        locationId: location.id,
        assignedUserId: data.assignedUserId || null,
        assignedDepartment: data.assignedDepartment?.trim() || null,
        condition,
        status: initialStatus,
        notes: data.notes?.trim() || null,
      },
      include: {
        item: true,
        location: true,
      },
    });

    // Record initial condition event
    await tx.assetConditionHistory.create({
      data: {
        assetId: createdAsset.id,
        previousCondition: condition,
        newCondition: condition,
        previousStatus: initialStatus,
        newStatus: initialStatus,
        event: "INSPECTION",
        reason: "প্রাথমিক সম্পদ অন্তর্ভুক্তি ও নিবন্ধন",
        notes: data.notes?.trim() || null,
        recordedByUserId: adminUserId,
      },
    });

    if (isAssigned) {
      await tx.assetAssignmentHistory.create({
        data: {
          assetId: createdAsset.id,
          assignedUserId: data.assignedUserId || null,
          assignedDepartment: data.assignedDepartment?.trim() || null,
          locationId: location.id,
          reason: "প্রাথমিক বরাদ্দ",
          assignedByUserId: adminUserId,
        },
      });
    }

    return createdAsset;
  });

  await recordAuditLog({
    userId: adminUserId,
    action: "CREATE",
    entityType: "InventoryAsset",
    entityId: asset.id,
    details: { assetCode, itemId: item.id, locationId: location.id },
  });

  return asset;
}

/**
 * Assign Asset to Department or Teacher/Staff with immutable history.
 */
export async function assignInventoryAsset(params: {
  assetId: string;
  assignedUserId?: string;
  assignedDepartment?: string;
  locationId?: string;
  reason?: string;
  notes?: string;
  adminUserId: string;
}) {
  const asset = await prisma.inventoryAsset.findUnique({
    where: { id: params.assetId },
    include: { item: true },
  });

  if (!asset) throw new Error("সম্পদ রেকর্ডটি পাওয়া যায়নি।");
  if (asset.status === "DISPOSED" || asset.status === "RETIRED") {
    throw new Error(`স্থগিত বা অপসারিত সম্পদ বরাদ্দ করা সম্ভব নয় (বর্তমান স্থিতি: ${asset.status})।`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedAsset = await tx.inventoryAsset.update({
      where: { id: asset.id },
      data: {
        assignedUserId: params.assignedUserId || null,
        assignedDepartment: params.assignedDepartment?.trim() || null,
        locationId: params.locationId || asset.locationId,
        status: params.assignedUserId || params.assignedDepartment ? "IN_USE" : "AVAILABLE",
        notes: params.notes?.trim() || asset.notes,
      },
      include: {
        assignedUser: { select: { id: true, name: true, role: true } },
        location: true,
      },
    });

    await tx.assetAssignmentHistory.create({
      data: {
        assetId: asset.id,
        assignedUserId: params.assignedUserId || null,
        assignedDepartment: params.assignedDepartment?.trim() || null,
        locationId: params.locationId || asset.locationId,
        previousUserId: asset.assignedUserId,
        previousLocationId: asset.locationId,
        reason: params.reason?.trim() || "সম্পদ নতুন বরাদ্দ/হস্তান্তর",
        notes: params.notes?.trim() || null,
        assignedByUserId: params.adminUserId,
      },
    });

    return updatedAsset;
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "ASSIGN",
    entityType: "InventoryAsset",
    entityId: asset.id,
    details: {
      assetCode: asset.assetCode,
      assignedUserId: params.assignedUserId,
      assignedDepartment: params.assignedDepartment,
    },
  });

  return updated;
}

/**
 * Record Condition Transition or Damage/Loss/Repair.
 */
export async function updateAssetConditionOrStatus(params: {
  assetId: string;
  condition: "NEW" | "GOOD" | "FAIR" | "DAMAGED" | "REPAIR_REQUIRED";
  status: "ACTIVE" | "IN_USE" | "AVAILABLE" | "REPAIR" | "LOST" | "DAMAGED" | "DISPOSED" | "RETIRED";
  event: "INSPECTION" | "REPAIR_START" | "REPAIR_COMPLETE" | "DAMAGE_REPORT" | "LOSS_REPORT" | "DISPOSAL";
  cost?: number;
  reason?: string;
  notes?: string;
  adminUserId: string;
}) {
  const asset = await prisma.inventoryAsset.findUnique({
    where: { id: params.assetId },
    include: { item: true, location: true },
  });

  if (!asset) throw new Error("সম্পদ রেকর্ডটি পাওয়া যায়নি।");

  const updated = await prisma.$transaction(async (tx) => {
    const updatedAsset = await tx.inventoryAsset.update({
      where: { id: asset.id },
      data: {
        condition: params.condition,
        status: params.status,
        notes: params.notes?.trim() || asset.notes,
      },
    });

    await tx.assetConditionHistory.create({
      data: {
        assetId: asset.id,
        previousCondition: asset.condition,
        newCondition: params.condition,
        previousStatus: asset.status,
        newStatus: params.status,
        event: params.event,
        cost: params.cost || null,
        reason: params.reason?.trim() || null,
        notes: params.notes?.trim() || null,
        recordedByUserId: params.adminUserId,
      },
    });

    return updatedAsset;
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "STATUS_CHANGE",
    entityType: "InventoryAsset",
    entityId: asset.id,
    details: {
      assetCode: asset.assetCode,
      oldCondition: asset.condition,
      newCondition: params.condition,
      status: params.status,
      event: params.event,
    },
  });

  // Notify if damaged or lost
  if (params.status === "DAMAGED" || params.status === "LOST" || params.status === "REPAIR") {
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        take: 3,
      });

      await dispatchNotification({
        templateCode: "ASSET_DAMAGED_OR_LOST",
        variables: {
          "asset.code": asset.assetCode,
          "item.nameBn": asset.item.nameBn,
          "location.name": asset.location.nameBn,
          status: params.status,
          condition: params.condition,
          reason: params.reason || "নিয়মিত যাচাইকরণে প্রাপ্ত স্থিতি",
        },
        recipients: admins.map((a) => ({
          userId: a.id,
          name: a.name,
          email: a.email,
          role: "ADMIN",
        })),
        relatedEntityType: "InventoryAsset",
        relatedEntityId: asset.id,
        idempotencyBaseKey: `AST_EVT_${asset.id}_${params.event}_${new Date().toISOString().slice(0, 10)}`,
        priority: "IMPORTANT",
      });
    } catch (e) {
      console.error("Asset alert dispatch error:", e);
    }
  }

  return updated;
}

/**
 * Dispose Asset Workflow.
 */
export async function disposeInventoryAsset(params: {
  assetId: string;
  disposalDate?: Date;
  disposalValue?: number;
  disposalReason: string;
  notes?: string;
  adminUserId: string;
}) {
  const asset = await prisma.inventoryAsset.findUnique({
    where: { id: params.assetId },
    include: { item: true },
  });

  if (!asset) throw new Error("সম্পদ পাওয়া যায়নি।");
  if (asset.status === "DISPOSED") {
    throw new Error("এই সম্পদটি ইতিমধ্যে বাতিল ও অপসারিত হিসেবে চিহ্নিত রয়েছে।");
  }

  const disposalDate = params.disposalDate || new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const updatedAsset = await tx.inventoryAsset.update({
      where: { id: asset.id },
      data: {
        status: "DISPOSED",
        disposalDate,
        disposalValue: params.disposalValue || null,
        disposalReason: params.disposalReason.trim(),
        notes: params.notes?.trim() || asset.notes,
        assignedUserId: null,
        assignedDepartment: null,
      },
    });

    await tx.assetConditionHistory.create({
      data: {
        assetId: asset.id,
        previousCondition: asset.condition,
        newCondition: "DAMAGED",
        previousStatus: asset.status,
        newStatus: "DISPOSED",
        event: "DISPOSAL",
        cost: params.disposalValue || null,
        reason: params.disposalReason.trim(),
        notes: params.notes?.trim() || null,
        recordedByUserId: params.adminUserId,
      },
    });

    return updatedAsset;
  });

  await recordAuditLog({
    userId: params.adminUserId,
    action: "DISPOSAL",
    entityType: "InventoryAsset",
    entityId: asset.id,
    details: {
      assetCode: asset.assetCode,
      disposalReason: params.disposalReason,
      disposalValue: params.disposalValue,
    },
  });

  return updated;
}

// =================================================================
// 10. INVENTORY DASHBOARD STATS & REPORTING
// =================================================================

export async function getInventoryDashboardStats() {
  await ensureDefaultInventoryMasterData();

  const [
    totalItemTypes,
    totalCategories,
    totalLocations,
    totalSuppliers,
    totalAssets,
    pendingPRs,
    pendingPOs,
    balances,
    assetsByStatus,
  ] = await Promise.all([
    prisma.inventoryItem.count({ where: { isActive: true } }),
    prisma.inventoryCategory.count({ where: { isActive: true } }),
    prisma.inventoryLocation.count({ where: { isActive: true } }),
    prisma.supplier.count({ where: { isActive: true } }),
    prisma.inventoryAsset.count({ where: { status: { not: "DISPOSED" } } }),
    prisma.purchaseRequest.count({ where: { status: "SUBMITTED" } }),
    prisma.purchaseOrder.count({ where: { status: { in: ["APPROVED", "ORDERED", "PARTIALLY_RECEIVED"] } } }),
    prisma.inventoryStockBalance.findMany({
      include: {
        item: true,
        location: true,
      },
    }),
    prisma.inventoryAsset.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  // Aggregate stock statistics
  let totalStockQuantity = 0;
  let outOfStockCount = 0;
  const lowStockItems: any[] = [];

  const itemMap = new Map<string, { currentStock: number; item: any }>();

  for (const b of balances) {
    totalStockQuantity += b.currentBalance;
    const existing = itemMap.get(b.itemId) || { currentStock: 0, item: b.item };
    existing.currentStock += b.currentBalance;
    itemMap.set(b.itemId, existing);
  }

  itemMap.forEach((data) => {
    if (data.currentStock === 0) {
      outOfStockCount++;
    } else if (data.currentStock <= data.item.minStock) {
      lowStockItems.push({
        id: data.item.id,
        itemCode: data.item.itemCode,
        nameBn: data.item.nameBn,
        currentStock: data.currentStock,
        minStock: data.item.minStock,
        unit: data.item.unit,
      });
    }
  });

  // Today's movement
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayTransactions = await prisma.inventoryTransaction.findMany({
    where: {
      createdAt: { gte: todayStart },
    },
  });

  let todayStockIn = 0;
  let todayStockOut = 0;

  for (const tx of todayTransactions) {
    if (["PURCHASE_IN", "TRANSFER_IN", "ADJUSTMENT_IN", "RETURN_IN"].includes(tx.transactionType)) {
      todayStockIn += tx.quantity;
    } else if (["ISSUE_OUT", "TRANSFER_OUT", "ADJUSTMENT_OUT", "DAMAGE_OUT", "LOSS_OUT", "DISPOSAL_OUT"].includes(tx.transactionType)) {
      todayStockOut += tx.quantity;
    }
  }

  // Asset breakdown
  const assetStatusCounts: Record<string, number> = {};
  for (const s of assetsByStatus) {
    assetStatusCounts[s.status] = s._count.id;
  }

  // Recent transactions & POs
  const [recentTransactions, recentPurchaseOrders] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        item: true,
        sourceLocation: true,
        destLocation: true,
        recordedByUser: { select: { name: true, role: true } },
      },
    }),
    prisma.purchaseOrder.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        supplier: true,
        items: { include: { item: true } },
      },
    }),
  ]);

  return {
    totalItemTypes,
    totalCategories,
    totalLocations,
    totalSuppliers,
    totalStockQuantity,
    lowStockCount: lowStockItems.length,
    lowStockItems,
    outOfStockCount,
    todayStockIn,
    todayStockOut,
    pendingPRs,
    pendingPOs,
    totalAssets,
    assetsInUse: assetStatusCounts["IN_USE"] || 0,
    assetsAvailable: assetStatusCounts["AVAILABLE"] || 0,
    assetsUnderRepair: assetStatusCounts["REPAIR"] || 0,
    assetsLostOrDamaged: (assetStatusCounts["DAMAGED"] || 0) + (assetStatusCounts["LOST"] || 0),
    recentTransactions,
    recentPurchaseOrders,
  };
}
