import prisma from '../config/prisma';
import { logger } from './logger';

export const logAudit = async (
  userId: string | undefined,
  action: string,
  resource: string,
  details: string | null = null,
  ipAddress: string | null = null
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        resource,
        details,
        ipAddress
      }
    });
  } catch (error) {
    // We don't want audit logging failure to crash the main transaction
    logger.error(`Failed to save audit log: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
