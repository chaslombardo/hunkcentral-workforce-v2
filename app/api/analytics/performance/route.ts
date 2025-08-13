import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { calculateAllCaptainsPerformance } from '@/lib/payCalculator';
import { convertUserDecimalFields } from '@/lib/decimal-utils';
import type { 
  User, 
  DailyLog, 
  LogJob,
  Department,
  PerformanceFilters,
  PerformanceRankingsResponse 
} from '@/types';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const performanceCache = new Map<string, { data: PerformanceRankingsResponse; timestamp: number }>();

// Helper function to generate cache key
function generateCacheKey(filters: PerformanceFilters): string {
  return JSON.stringify({
    startDate: filters.startDate?.toISOString(),
    endDate: filters.endDate?.toISOString(),
    captainIds: filters.captainIds?.sort(),
    includeJunk: filters.includeJunk,
    includeMove: filters.includeMove,
  });
}

// Helper function to check if cache is valid
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse query parameters for filters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const captainIdsParam = searchParams.get('captainIds');
    const includeJunk = searchParams.get('includeJunk') !== 'false';
    const includeMove = searchParams.get('includeMove') !== 'false';
    const skipCache = searchParams.get('skipCache') === 'true';

    // Build filters object
    const filters: PerformanceFilters = {
      includeJunk,
      includeMove,
    };

    if (startDateParam) {
      filters.startDate = new Date(startDateParam);
    }

    if (endDateParam) {
      filters.endDate = new Date(endDateParam);
    }

    if (captainIdsParam) {
      filters.captainIds = captainIdsParam.split(',');
    }

    // Default date range if not provided (last 30 days)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const actualStartDate = filters.startDate || defaultStartDate;
    const actualEndDate = filters.endDate || defaultEndDate;

    // Update filters with actual dates for cache key generation
    filters.startDate = actualStartDate;
    filters.endDate = actualEndDate;

    // Check cache first (unless explicitly skipped)
    if (!skipCache) {
      const cacheKey = generateCacheKey(filters);
      const cachedResult = performanceCache.get(cacheKey);
      
      if (cachedResult && isCacheValid(cachedResult.timestamp)) {
        // Add cache headers
        const response = NextResponse.json(cachedResult.data);
        response.headers.set('X-Cache', 'HIT');
        response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
        return response;
      }
    }

    // Get only captains and users needed for calculations
    // Optimize by filtering to only captains and users with relevant data
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { roles: { has: 'captain' } },
          // Include users who have worked hours in the date range
          {
            logHours: {
              some: {
                log: {
                  status: 'approved',
                  approvedAt: {
                    gte: actualStartDate,
                    lte: actualEndDate,
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        roles: true,
        rateJunkCaptain: true,
        rateJunkWingman: true,
        rateMoveCaptain: true,
        rateMoveWingman: true,
        rateZigma: true,
        rateTraining: true,
        rateEstimating: true,
        rateWarehouse: true,
        rateAdmin: true,
        salaryAmount: true,
        salaryFrequency: true,
        salaryType: true,
        commissionRate: true,
        junkBonusGoal: true,
        moveBonusGoal: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    // Get approved logs within the date range with optimized includes
    const approvedLogs = await prisma.dailyLog.findMany({
      where: {
        status: 'approved',
        approvedAt: {
          gte: actualStartDate,
          lte: actualEndDate,
        },
        // Only include logs from captains if we're filtering by captain IDs
        ...(filters.captainIds && {
          captainId: {
            in: filters.captainIds,
          },
        }),
      },
      include: {
        captain: {
          select: {
            id: true,
            email: true,
            fullName: true,
            roles: true,
            rateJunkCaptain: true,
            rateJunkWingman: true,
            rateMoveCaptain: true,
            rateMoveWingman: true,
            rateZigma: true,
            rateTraining: true,
            rateEstimating: true,
            rateWarehouse: true,
            rateAdmin: true,
            salaryAmount: true,
            salaryFrequency: true,
            salaryType: true,
            commissionRate: true,
            junkBonusGoal: true,
            moveBonusGoal: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            roles: true,
            rateJunkCaptain: true,
            rateJunkWingman: true,
            rateMoveCaptain: true,
            rateMoveWingman: true,
            rateZigma: true,
            rateTraining: true,
            rateEstimating: true,
            rateWarehouse: true,
            rateAdmin: true,
            salaryAmount: true,
            salaryFrequency: true,
            salaryType: true,
            commissionRate: true,
            junkBonusGoal: true,
            moveBonusGoal: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            roles: true,
            rateJunkCaptain: true,
            rateJunkWingman: true,
            rateMoveCaptain: true,
            rateMoveWingman: true,
            rateZigma: true,
            rateTraining: true,
            rateEstimating: true,
            rateWarehouse: true,
            rateAdmin: true,
            salaryAmount: true,
            salaryFrequency: true,
            salaryType: true,
            commissionRate: true,
            junkBonusGoal: true,
            moveBonusGoal: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        lastEditedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            roles: true,
            rateJunkCaptain: true,
            rateJunkWingman: true,
            rateMoveCaptain: true,
            rateMoveWingman: true,
            rateZigma: true,
            rateTraining: true,
            rateEstimating: true,
            rateWarehouse: true,
            rateAdmin: true,
            salaryAmount: true,
            salaryFrequency: true,
            salaryType: true,
            commissionRate: true,
            junkBonusGoal: true,
            moveBonusGoal: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        jobs: true,
        hours: {
          include: {
            employee: {
              select: {
                id: true,
                email: true,
                fullName: true,
                roles: true,
                rateJunkCaptain: true,
                rateJunkWingman: true,
                rateMoveCaptain: true,
                rateMoveWingman: true,
                rateZigma: true,
                rateTraining: true,
                rateEstimating: true,
                rateWarehouse: true,
                rateAdmin: true,
                salaryAmount: true,
                salaryFrequency: true,
                salaryType: true,
                commissionRate: true,
                junkBonusGoal: true,
                moveBonusGoal: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    // Convert Decimal fields to numbers for calculation functions
    const usersForCalculation: User[] = users.map(user => ({
      ...convertUserDecimalFields(user),
      roles: user.roles as User['roles'],
      salaryFrequency: user.salaryFrequency as User['salaryFrequency'],
      salaryType: user.salaryType as User['salaryType'],
      junkBonusGoal: Number(user.junkBonusGoal),
      moveBonusGoal: Number(user.moveBonusGoal),
    }));

    // Convert Prisma data to proper types for calculations
    const logsForCalculation: DailyLog[] = approvedLogs.map(log => ({
      ...log,
      status: log.status as DailyLog['status'],
      submittedAt: log.submittedAt || undefined,
      approvedAt: log.approvedAt || undefined,
      approvedById: log.approvedById || undefined,
      lastEditedById: log.lastEditedById || undefined,
      captain: {
        ...convertUserDecimalFields(log.captain),
        roles: log.captain.roles as User['roles'],
        salaryFrequency: log.captain.salaryFrequency as User['salaryFrequency'],
        salaryType: log.captain.salaryType as User['salaryType'],
        junkBonusGoal: Number(log.captain.junkBonusGoal),
        moveBonusGoal: Number(log.captain.moveBonusGoal),
      },
      createdBy: {
        ...convertUserDecimalFields(log.createdBy),
        roles: log.createdBy.roles as User['roles'],
        salaryFrequency: log.createdBy.salaryFrequency as User['salaryFrequency'],
        salaryType: log.createdBy.salaryType as User['salaryType'],
        junkBonusGoal: Number(log.createdBy.junkBonusGoal),
        moveBonusGoal: Number(log.createdBy.moveBonusGoal),
      },
      approvedBy: log.approvedBy ? {
        ...convertUserDecimalFields(log.approvedBy),
        roles: log.approvedBy.roles as User['roles'],
        salaryFrequency: log.approvedBy.salaryFrequency as User['salaryFrequency'],
        salaryType: log.approvedBy.salaryType as User['salaryType'],
        junkBonusGoal: Number(log.approvedBy.junkBonusGoal),
        moveBonusGoal: Number(log.approvedBy.moveBonusGoal),
      } : undefined,
      lastEditedBy: log.lastEditedBy ? {
        ...convertUserDecimalFields(log.lastEditedBy),
        roles: log.lastEditedBy.roles as User['roles'],
        salaryFrequency: log.lastEditedBy.salaryFrequency as User['salaryFrequency'],
        salaryType: log.lastEditedBy.salaryType as User['salaryType'],
        junkBonusGoal: Number(log.lastEditedBy.junkBonusGoal),
        moveBonusGoal: Number(log.lastEditedBy.moveBonusGoal),
      } : undefined,
      hours: log.hours.map(hour => ({
        ...hour,
        log: {} as DailyLog, // Circular reference - will be set by parent
        department: hour.department as Department,
        hours: Number(hour.hours),
        employee: {
          ...convertUserDecimalFields(hour.employee),
          roles: hour.employee.roles as User['roles'],
          salaryFrequency: hour.employee.salaryFrequency as User['salaryFrequency'],
          salaryType: hour.employee.salaryType as User['salaryType'],
          junkBonusGoal: Number(hour.employee.junkBonusGoal),
          moveBonusGoal: Number(hour.employee.moveBonusGoal),
        },
      })),
      jobs: log.jobs.map(job => ({
        ...job,
        jobType: job.jobType as LogJob['jobType'],
        revenue: Number(job.revenue),
        tips: Number(job.tips),
        junkOnMove: job.junkOnMove ? Number(job.junkOnMove) : undefined,
        valuation: job.valuation ? Number(job.valuation) : undefined,
        materials: job.materials ? Number(job.materials) : undefined,
        disposalCost: job.disposalCost ? Number(job.disposalCost) : undefined,
        log: {} as DailyLog, // Circular reference - will be set by parent
      })),
    }));

    // Calculate performance metrics for all captains
    // Note: This function only returns performance metrics (job counts, revenue, percentages)
    // and does NOT include any sensitive payroll data (rates, salaries, bonuses)
    const captainPerformanceData = calculateAllCaptainsPerformance(
      usersForCalculation,
      logsForCalculation,
      filters
    );

    // Filter captains if specific IDs were requested
    const filteredCaptains = filters.captainIds 
      ? captainPerformanceData.filter(captain => filters.captainIds!.includes(captain.captainId))
      : captainPerformanceData;

    // Build response
    const responseData: PerformanceRankingsResponse = {
      captains: filteredCaptains,
      dateRange: {
        startDate: actualStartDate,
        endDate: actualEndDate,
      },
      totalCaptains: filteredCaptains.length,
    };

    // Cache the result
    const cacheKey = generateCacheKey(filters);
    performanceCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    // Clean up old cache entries (keep only last 50 entries)
    if (performanceCache.size > 50) {
      const entries = Array.from(performanceCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, entries.length - 50);
      toDelete.forEach(([key]) => performanceCache.delete(key));
    }

    const response = NextResponse.json(responseData);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    return response;
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance analytics' },
      { status: 500 }
    );
  }
}