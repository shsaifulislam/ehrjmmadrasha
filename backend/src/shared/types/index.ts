// backend/src/shared/types/index.ts
// Shared types used across all modules

import { Request } from 'express';

/**
 * Authenticated request — always carries a user after requireAuth middleware
 */
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

/**
 * The user object attached to req.user by auth middleware
 */
export interface AuthUser {
  id: string;
  username: string;
  roleId: string;
  mustChangePassword: boolean;
  isActive: boolean;
  role: {
    id: string;
    name: string;
    permissions: Array<{
      permission: {
        id: string;
        name: string;
        module: string;
      };
    }>;
  };
}

/**
 * Standard API response envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Query params for list endpoints
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Soft-delete filter for Prisma
 */
export const notDeleted = { isDeleted: false } as const;
