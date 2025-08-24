/**
 * Enhanced Audit Trail System
 * Provides comprehensive audit logging, search, filtering, and reporting capabilities
 */

import { prisma } from '@/lib/prisma';
import { logProductionError } from '@/lib/production-error-logger';
import { z } from 'zod';

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  changes: Record<string, unknown> | null;
  createdAt: Date;
  dailyLogId?: string | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface AuditSearchFilters {
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'action' | 'entityType' | 'userId';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditSearchResult {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuditStatistics {
  totalEntries: number;
  entriesByType: Record<string, number>;
  entriesByAction: Record<string, number>;
  entriesByUser: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
  recentActivity: AuditLogEntry[];
  timelineData: Array<{
    date: string;
    count: number;
    actions: Record<string, number>;
  }>;
}

// Validation schemas
export const AuditSearchSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  dateRange: z
    .object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    })
    .optional(),
  searchTerm: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z
    .enum(['createdAt', 'action', 'entityType', 'userId'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class AuditTrailService {
  /**
   * Create a comprehensive audit log entry
   */
  static async createAuditLog(data: {
    entityType: string;
    entityId: string;
    action: string;
    userId: string;
    changes?: Record<string, unknown> | null;
    dailyLogId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      // Enhance changes with metadata
      const enhancedChanges = {
        ...data.changes,
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: 'server', // This would be passed from request context
          ipAddress: 'server', // This would be passed from request context
          ...data.metadata,
        },
      };

      await prisma.auditLog.create({
        data: {
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action,
          changes: enhancedChanges
            ? JSON.parse(JSON.stringify(enhancedChanges))
            : null,
          userId: data.userId,
          dailyLogId: data.dailyLogId,
        },
      });
    } catch (error) {
      await logProductionError(error, {
        component: 'audit_trail',
        action: 'create_audit_log',
        userId: data.userId,
        url: '/audit-log-creation',
        userAgent: 'server',
        category: 'database',
        metadata: {
          entityType: data.entityType,
          entityId: data.entityId,
          auditAction: data.action,
        },
      });
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Search audit logs with comprehensive filtering
   */
  static async searchAuditLogs(
    filters: AuditSearchFilters
  ): Promise<AuditSearchResult> {
    try {
      const validatedFilters = AuditSearchSchema.parse(filters);

      // Build where clause
      const whereClause: any = {};

      if (validatedFilters.entityType) {
        whereClause.entityType = validatedFilters.entityType;
      }

      if (validatedFilters.entityId) {
        whereClause.entityId = validatedFilters.entityId;
      }

      if (validatedFilters.action) {
        whereClause.action = {
          contains: validatedFilters.action,
          mode: 'insensitive',
        };
      }

      if (validatedFilters.userId) {
        whereClause.userId = validatedFilters.userId;
      }

      if (validatedFilters.dateRange) {
        whereClause.createdAt = {
          gte: validatedFilters.dateRange.start,
          lte: validatedFilters.dateRange.end,
        };
      }

      // Handle search term across multiple fields
      if (validatedFilters.searchTerm) {
        const searchTerm = validatedFilters.searchTerm;
        whereClause.OR = [
          { action: { contains: searchTerm, mode: 'insensitive' } },
          { entityType: { contains: searchTerm, mode: 'insensitive' } },
          { entityId: { contains: searchTerm, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { fullName: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          },
        ];
      }

      // Get total count
      const total = await prisma.auditLog.count({ where: whereClause });

      // Calculate pagination
      const totalPages = Math.ceil(total / validatedFilters.limit);
      const skip = (validatedFilters.page - 1) * validatedFilters.limit;

      // Get entries with user information
      const entries = await prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          [validatedFilters.sortBy]: validatedFilters.sortOrder,
        },
        skip,
        take: validatedFilters.limit,
      });

      return {
        entries: entries as AuditLogEntry[],
        total,
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        totalPages,
        hasNextPage: validatedFilters.page < totalPages,
        hasPreviousPage: validatedFilters.page > 1,
      };
    } catch (error) {
      await logProductionError(error, {
        component: 'audit_trail',
        action: 'search_audit_logs',
        url: '/audit-search',
        userAgent: 'server',
        category: 'database',
        metadata: { filters },
      });
      throw error;
    }
  }

  /**
   * Get audit statistics for dashboard and reporting
   */
  static async getAuditStatistics(dateRange?: {
    start: Date;
    end: Date;
  }): Promise<AuditStatistics> {
    try {
      const whereClause: any = {};

      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      // Get total entries
      const totalEntries = await prisma.auditLog.count({ where: whereClause });

      // Get entries by type
      const entriesByTypeRaw = await prisma.auditLog.groupBy({
        by: ['entityType'],
        where: whereClause,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      const entriesByType = entriesByTypeRaw.reduce(
        (acc, item) => {
          acc[item.entityType] = item._count.id;
          return acc;
        },
        {} as Record<string, number>
      );

      // Get entries by action
      const entriesByActionRaw = await prisma.auditLog.groupBy({
        by: ['action'],
        where: whereClause,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10, // Top 10 actions
      });

      const entriesByAction = entriesByActionRaw.reduce(
        (acc, item) => {
          acc[item.action] = item._count.id;
          return acc;
        },
        {} as Record<string, number>
      );

      // Get entries by user
      const entriesByUserRaw = await prisma.auditLog.groupBy({
        by: ['userId'],
        where: whereClause,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10, // Top 10 users
      });

      // Get user details for the top users
      const userIds = entriesByUserRaw.map((item) => item.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fullName: true, email: true },
      });

      const userMap = users.reduce(
        (acc, user) => {
          acc[user.id] = user;
          return acc;
        },
        {} as Record<string, { fullName: string; email: string }>
      );

      const entriesByUser = entriesByUserRaw.map((item) => ({
        userId: item.userId,
        userName: userMap[item.userId]?.fullName || 'Unknown User',
        count: item._count.id,
      }));

      // Get recent activity
      const recentActivity = (await prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })) as AuditLogEntry[];

      // Get timeline data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const timelineWhereClause = {
        ...whereClause,
        createdAt: {
          gte: dateRange?.start || thirtyDaysAgo,
          lte: dateRange?.end || new Date(),
        },
      };

      const timelineData = await this.generateTimelineData(timelineWhereClause);

      return {
        totalEntries,
        entriesByType,
        entriesByAction,
        entriesByUser,
        recentActivity,
        timelineData,
      };
    } catch (error) {
      await logProductionError(error, {
        component: 'audit_trail',
        action: 'get_audit_statistics',
        url: '/audit-statistics',
        userAgent: 'server',
        category: 'database',
        metadata: { dateRange },
      });
      throw error;
    }
  }

  /**
   * Generate timeline data for audit activity visualization
   */
  private static async generateTimelineData(whereClause: any): Promise<
    Array<{
      date: string;
      count: number;
      actions: Record<string, number>;
    }>
  > {
    try {
      // Get raw data grouped by date
      const rawData = await prisma.auditLog.findMany({
        where: whereClause,
        select: {
          createdAt: true,
          action: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group by date
      const dateMap = new Map<
        string,
        { count: number; actions: Record<string, number> }
      >();

      rawData.forEach((entry) => {
        const dateKey = entry.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { count: 0, actions: {} });
        }

        const dayData = dateMap.get(dateKey)!;
        dayData.count++;
        dayData.actions[entry.action] =
          (dayData.actions[entry.action] || 0) + 1;
      });

      // Convert to array and sort
      return Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          count: data.count,
          actions: data.actions,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      await logProductionError(error, {
        component: 'audit_trail',
        action: 'generate_timeline_data',
        url: '/audit-timeline',
        userAgent: 'server',
        category: 'database',
      });
      return [];
    }
  }

  /**
   * Export audit logs to various formats
   */
  static async exportAuditLogs(
    filters: AuditSearchFilters,
    format: 'csv' | 'json' | 'excel'
  ): Promise<{
    data: string | Buffer;
    filename: string;
    contentType: string;
  }> {
    try {
      // Get all matching entries (no pagination for export)
      const searchResult = await this.searchAuditLogs({
        ...filters,
        page: 1,
        limit: 10000, // Large limit for export
      });

      const timestamp = new Date().toISOString().split('T')[0];

      switch (format) {
        case 'csv':
          const csvData = this.convertToCSV(searchResult.entries);
          return {
            data: csvData,
            filename: `audit-log-${timestamp}.csv`,
            contentType: 'text/csv',
          };

        case 'json':
          const jsonData = JSON.stringify(searchResult.entries, null, 2);
          return {
            data: jsonData,
            filename: `audit-log-${timestamp}.json`,
            contentType: 'application/json',
          };

        case 'excel':
          // For Excel export, you would use a library like 'exceljs'
          // For now, return CSV with Excel content type
          const excelData = this.convertToCSV(searchResult.entries);
          return {
            data: excelData,
            filename: `audit-log-${timestamp}.xlsx`,
            contentType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          };

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      await logProductionError(error, {
        component: 'audit_trail',
        action: 'export_audit_logs',
        url: '/audit-export',
        userAgent: 'server',
        category: 'database',
        metadata: { filters, format },
      });
      throw error;
    }
  }

  /**
   * Convert audit log entries to CSV format
   */
  private static convertToCSV(entries: AuditLogEntry[]): string {
    const headers = [
      'ID',
      'Entity Type',
      'Entity ID',
      'Action',
      'User ID',
      'User Name',
      'User Email',
      'Created At',
      'Changes',
      'Daily Log ID',
    ];

    const rows = entries.map((entry) => [
      entry.id,
      entry.entityType,
      entry.entityId,
      entry.action,
      entry.userId,
      entry.user?.fullName || 'Unknown',
      entry.user?.email || 'Unknown',
      entry.createdAt.toISOString(),
      entry.changes ? JSON.stringify(entry.changes) : '',
      entry.dailyLogId || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    return csvContent;
  }

  /**
   * Get audit trail for a specific entity
   */
  static async getEntityAuditTrail(
    entityType: string,
    entityId: string,
    options?: {
      limit?: number;
      includeRelated?: boolean;
    }
  ): Promise<AuditLogEntry[]> {
    try {
      const whereClause: any = {
        entityType,
        entityId,
      };

      // If includeRelated is true, also get related audit entries
      if (options?.includeRelated) {
        // For daily logs, also include related job and hour entries
        if (entityType === 'daily_log') {
          whereClause.OR = [{ entityType, entityId }, { dailyLogId: entityId }];
        }
      }

      const entries = await prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
      });

      return entries as AuditLogEntry[];
    } catch (error) {
      await logProductionError(error, {
        component: 'audit_trail',
        action: 'get_entity_audit_trail',
        url: '/entity-audit-trail',
        userAgent: 'server',
        category: 'database',
        metadata: { entityType, entityId, options },
      });
      throw error;
    }
  }

  /**
   * Track changes between two objects
   */
  static trackChanges(
    before: Record<string, unknown>,
    after: Record<string, unknown>
  ): Record<string, unknown> {
    const changes: Record<string, unknown> = {};

    const compareValues = (
      beforeVal: unknown,
      afterVal: unknown,
      key: string
    ) => {
      if (beforeVal !== afterVal) {
        if (beforeVal === null || beforeVal === undefined) {
          changes[key] = { to: afterVal };
        } else if (afterVal === null || afterVal === undefined) {
          changes[key] = { from: beforeVal };
        } else {
          changes[key] = { from: beforeVal, to: afterVal };
        }
      }
    };

    // Compare all keys from both objects
    const allKeys = new Set([
      ...Object.keys(before || {}),
      ...Object.keys(after || {}),
    ]);

    for (const key of allKeys) {
      // Skip certain fields that shouldn't be tracked
      if (['id', 'createdAt', 'updatedAt'].includes(key)) {
        continue;
      }

      const beforeVal = before?.[key];
      const afterVal = after?.[key];

      // Handle arrays
      if (Array.isArray(beforeVal) || Array.isArray(afterVal)) {
        const beforeArray = Array.isArray(beforeVal) ? beforeVal : [];
        const afterArray = Array.isArray(afterVal) ? afterVal : [];

        if (beforeArray.length !== afterArray.length) {
          changes[key] = {
            from: `${beforeArray.length} items`,
            to: `${afterArray.length} items`,
            details: {
              added: afterArray.length - beforeArray.length,
              removed: beforeArray.length - afterArray.length,
            },
          };
        } else {
          // Check for changes in array items
          let hasChanges = false;
          for (let i = 0; i < beforeArray.length; i++) {
            if (
              JSON.stringify(beforeArray[i]) !== JSON.stringify(afterArray[i])
            ) {
              hasChanges = true;
              break;
            }
          }
          if (hasChanges) {
            changes[key] = {
              from: `${beforeArray.length} items (modified)`,
              to: `${afterArray.length} items (modified)`,
            };
          }
        }
      } else if (
        typeof beforeVal === 'object' &&
        typeof afterVal === 'object' &&
        beforeVal !== null &&
        afterVal !== null
      ) {
        // Handle nested objects
        const nestedChanges = this.trackChanges(
          beforeVal as Record<string, unknown>,
          afterVal as Record<string, unknown>
        );
        if (Object.keys(nestedChanges).length > 0) {
          changes[key] = nestedChanges;
        }
      } else {
        compareValues(beforeVal, afterVal, key);
      }
    }

    return changes;
  }

  /**
   * Clean up old audit logs (data retention)
   */
  static async cleanupOldAuditLogs(
    retentionDays: number = 365 * 2
  ): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          // Keep critical security events longer
          NOT: {
            entityType: 'system_error',
            changes: {
              path: ['category'],
              equals: 'security',
            },
          },
        },
      });

      await this.createAuditLog({
        entityType: 'system_maintenance',
        entityId: 'audit_cleanup',
        action: 'cleanup_old_audit_logs',
        userId: 'system',
        changes: {
          deletedCount: result.count,
          retentionDays,
          cutoffDate: cutoffDate.toISOString(),
        },
      });

      return result.count;
    } catch (error) {
      await logProductionError(error, {
        component: 'audit_trail',
        action: 'cleanup_old_audit_logs',
        url: '/audit-cleanup',
        userAgent: 'server',
        category: 'database',
        metadata: { retentionDays },
      });
      throw error;
    }
  }
}
