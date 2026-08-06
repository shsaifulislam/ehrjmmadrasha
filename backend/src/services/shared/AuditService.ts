import prisma from "../../config/prisma";

export interface AuditLogPayload {
  userId?: string;
  action: string;
  resource: string;
  details?: string | object;
  ipAddress?: string;
}

export class AuditService {
  /**
   * Records an immutable audit log entry into the database.
   */
  static async log(payload: AuditLogPayload): Promise<void> {
    try {
      const detailsString = typeof payload.details === "object" 
        ? JSON.stringify(payload.details) 
        : payload.details;

      let validUserId: string | null = null;
      if (payload.userId) {
        const userExists = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (userExists) validUserId = payload.userId;
      }

      await prisma.auditLog.create({
        data: {
          userId: validUserId,
          action: payload.action,
          resource: payload.resource,
          details: detailsString || null,
          ipAddress: payload.ipAddress || null,
        },
      });
    } catch (error) {
      console.error("[AuditService] Failed to record audit log:", error);
    }
  }

  /**
   * Retrieves audit logs with server-side pagination.
   */
  static async getLogs(page = 1, limit = 20, resource?: string) {
    const skip = (page - 1) * limit;
    const where = resource ? { resource } : {};

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export default AuditService;
