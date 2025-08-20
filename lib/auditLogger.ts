import { prisma } from '@/lib/prisma';

interface AuditLogData {
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  changes?: Record<string, unknown> | null;
  dailyLogId?: string;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : null,
        userId: data.userId,
        dailyLogId: data.dailyLogId,
      },
    });
  } catch (error) {
    // Only log in development to reduce console noise in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Audit log creation failed (non-critical):', error);
    }
    // Don't throw error to avoid breaking main functionality
  }
}

export function trackChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, unknown> {
  const changes: Record<string, unknown> = {};

  // Handle primitive values and objects
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

    // Handle arrays (like jobs, hours)
    if (Array.isArray(beforeVal) || Array.isArray(afterVal)) {
      const beforeArray = Array.isArray(beforeVal) ? beforeVal : [];
      const afterArray = Array.isArray(afterVal) ? afterVal : [];

      if (beforeArray.length !== afterArray.length) {
        changes[key] = {
          from: `${beforeArray.length} items`,
          to: `${afterArray.length} items`,
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
      const nestedChanges = trackChanges(
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

export async function logDailyLogChange(
  action: string,
  logId: string,
  userId: string,
  beforeData?: Record<string, unknown>,
  afterData?: Record<string, unknown>,
  additionalData?: Record<string, unknown>
) {
  const changes: Record<string, unknown> = {};

  if (beforeData && afterData) {
    Object.assign(changes, trackChanges(beforeData, afterData));
  }

  if (additionalData) {
    Object.assign(changes, additionalData);
  }

  await createAuditLog({
    entityType: 'daily_log',
    entityId: logId,
    action,
    userId,
    changes: Object.keys(changes).length > 0 ? changes : undefined,
    dailyLogId: logId,
  });
}

export async function logCommissionChange(
  action: string,
  commissionId: string,
  userId: string,
  beforeData?: Record<string, unknown>,
  afterData?: Record<string, unknown>,
  additionalData?: Record<string, unknown>
) {
  const changes: Record<string, unknown> = {};

  if (beforeData && afterData) {
    Object.assign(changes, trackChanges(beforeData, afterData));
  }

  if (additionalData) {
    Object.assign(changes, additionalData);
  }

  await createAuditLog({
    entityType: 'commission_entry',
    entityId: commissionId,
    action,
    userId,
    changes: Object.keys(changes).length > 0 ? changes : undefined,
  });
}

export async function logUserChange(
  action: string,
  targetUserId: string,
  performedByUserId: string,
  beforeData?: Record<string, unknown>,
  afterData?: Record<string, unknown>,
  additionalData?: Record<string, unknown>
) {
  const changes: Record<string, unknown> = {};

  if (beforeData && afterData) {
    Object.assign(changes, trackChanges(beforeData, afterData));
  }

  if (additionalData) {
    Object.assign(changes, additionalData);
  }

  await createAuditLog({
    entityType: 'user',
    entityId: targetUserId,
    action,
    userId: performedByUserId,
    changes: Object.keys(changes).length > 0 ? changes : undefined,
  });
}

export async function logPayPeriodChange(
  action: string,
  payPeriodId: string,
  userId: string,
  beforeData?: Record<string, unknown>,
  afterData?: Record<string, unknown>,
  additionalData?: Record<string, unknown>
) {
  const changes: Record<string, unknown> = {};

  if (beforeData && afterData) {
    Object.assign(changes, trackChanges(beforeData, afterData));
  }

  if (additionalData) {
    Object.assign(changes, additionalData);
  }

  await createAuditLog({
    entityType: 'pay_period',
    entityId: payPeriodId,
    action,
    userId,
    changes: Object.keys(changes).length > 0 ? changes : undefined,
  });
}

export async function logManagerAccess(
  action: string,
  targetUserId: string,
  managerId: string,
  additionalData?: Record<string, unknown>
) {
  const changes: Record<string, unknown> = {
    action: 'manager_access',
    targetUserId,
    accessType: action,
    ...additionalData,
  };

  await createAuditLog({
    entityType: 'user_access',
    entityId: targetUserId,
    action: `manager_${action}`,
    userId: managerId,
    changes,
  });
}
