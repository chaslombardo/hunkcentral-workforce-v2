import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { approveLog, rejectLog, bulkApproveLogs, bulkRejectLogs, getLogsForReview } from '@/lib/actions/logs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mock dependencies
vi.mock('@/lib/auth')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dailyLog: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    commissionEntry: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockAuth = auth as Mock
const mockPrisma = prisma as any

describe('Log Approval Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set default mocks
    mockPrisma.commissionEntry.findMany.mockResolvedValue([])
  })

  describe('approveLog', () => {
    it('should approve a submitted log successfully', async () => {
      // Mock authenticated manager user
      mockAuth.mockResolvedValue({
        user: {
          id: 'manager-1',
          roles: ['manager'],
        },
      })

      // Mock log data
      const mockLog = {
        id: 'log-1',
        status: 'submitted',
        jobs: [
          {
            id: 'job-1',
            jobId: 'J-2024-001',
            revenue: 500,
          },
        ],
        commissions: [],
      }

      const mockUpdatedLog = {
        ...mockLog,
        status: 'approved',
        approvedAt: new Date(),
        approvedById: 'manager-1',
      }

      mockPrisma.dailyLog.findUnique.mockResolvedValue(mockLog)
      mockPrisma.dailyLog.update.mockResolvedValue(mockUpdatedLog)
      mockPrisma.auditLog.create.mockResolvedValue({})
      mockPrisma.commissionEntry.findUnique.mockResolvedValue(null)

      const result = await approveLog('log-1', 'Approved by manager')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('approved')
      expect(mockPrisma.dailyLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: {
          status: 'approved',
          approvedAt: expect.any(Date),
          approvedById: 'manager-1',
        },
      })
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          entityType: 'daily_log',
          entityId: 'log-1',
          action: 'approve',
          changes: {
            status: { from: 'submitted', to: 'approved' },
            approvedAt: expect.any(String),
            comments: 'Approved by manager',
          },
          userId: 'manager-1',
          dailyLogId: 'log-1',
        },
      })
    })

    it('should reject approval if user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const result = await approveLog('log-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })

    it('should reject approval if user is not a manager', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          roles: ['captain'],
        },
      })

      const result = await approveLog('log-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Manager access required')
    })

    it('should reject approval if log is not found', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'manager-1',
          roles: ['manager'],
        },
      })

      mockPrisma.dailyLog.findUnique.mockResolvedValue(null)

      const result = await approveLog('log-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Log not found')
    })

    it('should reject approval if log is not submitted', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'manager-1',
          roles: ['manager'],
        },
      })

      mockPrisma.dailyLog.findUnique.mockResolvedValue({
        id: 'log-1',
        status: 'draft',
        jobs: [],
        commissions: [],
      })

      const result = await approveLog('log-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Only submitted logs can be approved')
    })

    it('should auto-match commission entries when approving', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'manager-1',
          roles: ['manager'],
        },
      })

      const mockLog = {
        id: 'log-1',
        status: 'submitted',
        jobs: [
          {
            id: 'job-1',
            jobId: 'J-2024-001',
            revenue: 500,
          },
        ],
        commissions: [],
      }

      const mockCommission = {
        id: 'commission-1',
        jobId: 'J-2024-001',
        status: 'pending',
        estimatedRevenue: 400,
        jobType: 'junk',
        sales: {
          id: 'sales-1',
          email: 'sales@example.com',
          fullName: 'Sales Person',
          roles: ['sales'],
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          commissionRate: 0.10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      mockPrisma.dailyLog.findUnique.mockResolvedValue(mockLog)
      mockPrisma.dailyLog.update.mockResolvedValue({
        ...mockLog,
        status: 'approved',
        approvedAt: new Date(),
      })
      mockPrisma.commissionEntry.findUnique.mockResolvedValue(mockCommission)
      mockPrisma.commissionEntry.findMany.mockResolvedValue([mockCommission])
      mockPrisma.commissionEntry.update.mockResolvedValue({})
      mockPrisma.auditLog.create.mockResolvedValue({})

      const result = await approveLog('log-1')

      expect(result.success).toBe(true)
      expect(mockPrisma.commissionEntry.update).toHaveBeenCalledWith({
        where: { id: 'commission-1' },
        data: {
          status: 'matched',
          actualRevenue: 500,
          commissionAmount: expect.any(Number),
          matchedLogId: 'log-1',
        },
      })
    })
  })

  describe('rejectLog', () => {
    it('should reject a submitted log successfully', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'manager-1',
          roles: ['manager'],
        },
      })

      const mockLog = {
        id: 'log-1',
        status: 'submitted',
      }

      const mockRejectedLog = {
        ...mockLog,
        status: 'rejected',
        approvedAt: new Date(),
        approvedById: 'manager-1',
      }

      mockPrisma.dailyLog.findUnique.mockResolvedValue(mockLog)
      mockPrisma.dailyLog.update.mockResolvedValue(mockRejectedLog)
      mockPrisma.auditLog.create.mockResolvedValue({})

      const result = await rejectLog('log-1', 'Issues with job entries')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('rejected')
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          entityType: 'daily_log',
          entityId: 'log-1',
          action: 'reject',
          changes: {
            status: { from: 'submitted', to: 'rejected' },
            rejectedAt: expect.any(String),
            comments: 'Issues with job entries',
          },
          userId: 'manager-1',
          dailyLogId: 'log-1',
        },
      })
    })

    it('should require comments when rejecting', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'manager-1',
          roles: ['manager'],
        },
      })

      const result = await rejectLog('log-1', '')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Comments are required when rejecting a log')
    })
  })

  describe('bulkApproveLogs', () => {
    it('should approve multiple logs successfully', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'manager-1',
          roles: ['manager'],
        },
      })

      // Mock individual approve calls
      const mockApproveLog = vi.fn().mockResolvedValue({ success: true })
      vi.doMock('@/lib/actions/logs', async () => {
        const actual = await vi.importActual('@/lib/actions/logs')
        return {
          ...actual,
          approveLog: mockApproveLog,
        }
      })

      const logIds = ['log-1', 'log-2', 'log-3']
      
      // We need to test the actual implementation, so let's mock the individual calls
      mockPrisma.dailyLog.findUnique.mockResolvedValue({
        id: 'log-1',
        status: 'submitted',
        jobs: [],
        commissions: [],
      })
      mockPrisma.dailyLog.update.mockResolvedValue({
        id: 'log-1',
        status: 'approved',
        approvedAt: new Date(),
      })
      mockPrisma.auditLog.create.mockResolvedValue({})
      mockPrisma.commissionEntry.findUnique.mockResolvedValue(null)

      const result = await bulkApproveLogs(logIds, 'Bulk approval')

      expect(result.success).toBe(true)
      expect(result.data?.successCount).toBe(3)
      expect(result.data?.failureCount).toBe(0)
    })
  })

  describe('getLogsForReview', () => {
    it('should return logs for manager review', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'manager-1',
          roles: ['manager'],
        },
      })

      const mockLogs = [
        {
          id: 'log-1',
          logDate: new Date('2024-01-15'),
          status: 'submitted',
          submittedAt: new Date('2024-01-15T18:30:00'),
          approvedAt: null,
          captain: {
            id: 'captain-1',
            fullName: 'John Smith',
          },
          approvedBy: null,
          jobs: [
            { revenue: 500, tips: 50 },
            { revenue: 300, tips: 30 },
          ],
          hours: [
            { hours: 4.5 },
            { hours: 4.0 },
          ],
        },
      ]

      mockPrisma.dailyLog.findMany.mockResolvedValue(mockLogs)

      const result = await getLogsForReview()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toMatchObject({
        id: 'log-1',
        captainName: 'John Smith',
        status: 'submitted',
        totalRevenue: 800,
        totalHours: 8.5,
        jobCount: 2,
      })
    })

    it('should reject access for non-managers', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          roles: ['captain'],
        },
      })

      const result = await getLogsForReview()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Manager access required')
    })
  })
})