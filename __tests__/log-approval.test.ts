import { describe, it, expect, vi, beforeEach } from 'vitest'
import { approveLog, rejectLog, bulkApproveLogs, bulkRejectLogs } from '@/lib/actions/logs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mock dependencies
vi.mock('@/lib/auth')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dailyLog: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))
vi.mock('@/lib/auditLogger', () => ({
  logDailyLogChange: vi.fn(),
}))
vi.mock('@/lib/commissionMatchingService', () => ({
  handleLogApprovalCommissionMatching: vi.fn().mockResolvedValue({
    success: true,
    notifications: [],
    matchResult: { matches: [], conflicts: [] },
  }),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)

describe('Log Approval Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('approveLog', () => {
    it('should approve a submitted log successfully', async () => {
      // Arrange
      const logId = 'test-log-id'
      const comments = 'Approved by manager'
      const mockUser = {
        id: 'manager-id',
        roles: ['manager'],
      }
      const mockLog = {
        id: logId,
        status: 'submitted',
        jobs: [],
        commissions: [],
      }
      const mockUpdatedLog = {
        ...mockLog,
        status: 'approved',
        approvedAt: new Date(),
        approvedById: mockUser.id,
      }

      mockAuth.mockResolvedValue({ user: mockUser })
      mockPrisma.dailyLog.findUnique.mockResolvedValue(mockLog)
      mockPrisma.dailyLog.update.mockResolvedValue(mockUpdatedLog)

      // Act
      const result = await approveLog(logId, comments)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('approved')
      expect(mockPrisma.dailyLog.update).toHaveBeenCalledWith({
        where: { id: logId },
        data: {
          status: 'approved',
          approvedAt: expect.any(Date),
          approvedById: mockUser.id,
        },
      })
    })

    it('should fail when user is not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const result = await approveLog('test-log-id')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })

    it('should fail when user does not have manager role', async () => {
      // Arrange
      const mockUser = {
        id: 'user-id',
        roles: ['captain'],
      }
      mockAuth.mockResolvedValue({ user: mockUser })

      // Act
      const result = await approveLog('test-log-id')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Manager access required')
    })

    it('should fail when log is not found', async () => {
      // Arrange
      const mockUser = {
        id: 'manager-id',
        roles: ['manager'],
      }
      mockAuth.mockResolvedValue({ user: mockUser })
      mockPrisma.dailyLog.findUnique.mockResolvedValue(null)

      // Act
      const result = await approveLog('non-existent-log-id')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Log not found')
    })

    it('should fail when log is not in submitted status', async () => {
      // Arrange
      const mockUser = {
        id: 'manager-id',
        roles: ['manager'],
      }
      const mockLog = {
        id: 'test-log-id',
        status: 'approved',
        jobs: [],
        commissions: [],
      }
      mockAuth.mockResolvedValue({ user: mockUser })
      mockPrisma.dailyLog.findUnique.mockResolvedValue(mockLog)

      // Act
      const result = await approveLog('test-log-id')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Only submitted logs can be approved')
    })
  })

  describe('rejectLog', () => {
    it('should reject a submitted log successfully', async () => {
      // Arrange
      const logId = 'test-log-id'
      const comments = 'Rejected due to missing information'
      const mockUser = {
        id: 'manager-id',
        roles: ['manager'],
      }
      const mockLog = {
        id: logId,
        status: 'submitted',
      }
      const mockUpdatedLog = {
        ...mockLog,
        status: 'rejected',
        approvedAt: new Date(),
        approvedById: mockUser.id,
      }

      mockAuth.mockResolvedValue({ user: mockUser })
      mockPrisma.dailyLog.findUnique.mockResolvedValue(mockLog)
      mockPrisma.dailyLog.update.mockResolvedValue(mockUpdatedLog)

      // Act
      const result = await rejectLog(logId, comments)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('rejected')
      expect(mockPrisma.dailyLog.update).toHaveBeenCalledWith({
        where: { id: logId },
        data: {
          status: 'rejected',
          approvedAt: expect.any(Date),
          approvedById: mockUser.id,
        },
      })
    })

    it('should fail when comments are empty', async () => {
      // Arrange
      const mockUser = {
        id: 'manager-id',
        roles: ['manager'],
      }
      mockAuth.mockResolvedValue({ user: mockUser })

      // Act
      const result = await rejectLog('test-log-id', '')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Comments are required when rejecting a log')
    })

    it('should fail when comments are only whitespace', async () => {
      // Arrange
      const mockUser = {
        id: 'manager-id',
        roles: ['manager'],
      }
      mockAuth.mockResolvedValue({ user: mockUser })

      // Act
      const result = await rejectLog('test-log-id', '   ')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Comments are required when rejecting a log')
    })
  })

  describe('bulkApproveLogs', () => {
    it('should approve multiple logs successfully', async () => {
      // Arrange
      const logIds = ['log-1', 'log-2', 'log-3']
      const mockUser = {
        id: 'manager-id',
        roles: ['manager'],
      }

      mockAuth.mockResolvedValue({ user: mockUser })
      
      // Mock successful approval for each log
      logIds.forEach((logId) => {
        const mockLog = {
          id: logId,
          status: 'submitted',
          jobs: [],
          commissions: [],
        }
        const mockUpdatedLog = {
          ...mockLog,
          status: 'approved',
          approvedAt: new Date(),
          approvedById: mockUser.id,
        }
        
        mockPrisma.dailyLog.findUnique.mockResolvedValueOnce(mockLog)
        mockPrisma.dailyLog.update.mockResolvedValueOnce(mockUpdatedLog)
      })

      // Act
      const result = await bulkApproveLogs(logIds)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.successCount).toBe(3)
      expect(result.data?.failureCount).toBe(0)
    })

    it('should handle partial failures in bulk approval', async () => {
      // Arrange
      const logIds = ['log-1', 'log-2', 'log-3']
      const mockUser = {
        id: 'manager-id',
        roles: ['manager'],
      }

      mockAuth.mockResolvedValue({ user: mockUser })
      
      // Mock first log success
      const mockLog1 = {
        id: 'log-1',
        status: 'submitted',
        jobs: [],
        commissions: [],
      }
      mockPrisma.dailyLog.findUnique.mockResolvedValueOnce(mockLog1)
      mockPrisma.dailyLog.update.mockResolvedValueOnce({
        ...mockLog1,
        status: 'approved',
        approvedAt: new Date(),
        approvedById: mockUser.id,
      })

      // Mock second log not found
      mockPrisma.dailyLog.findUnique.mockResolvedValueOnce(null)

      // Mock third log success
      const mockLog3 = {
        id: 'log-3',
        status: 'submitted',
        jobs: [],
        commissions: [],
      }
      mockPrisma.dailyLog.findUnique.mockResolvedValueOnce(mockLog3)
      mockPrisma.dailyLog.update.mockResolvedValueOnce({
        ...mockLog3,
        status: 'approved',
        approvedAt: new Date(),
        approvedById: mockUser.id,
      })

      // Act
      const result = await bulkApproveLogs(logIds)

      // Assert
      expect(result.success).toBe(false) // Should be false due to partial failure
      expect(result.data?.successCount).toBe(2)
      expect(result.data?.failureCount).toBe(1)
    })
  })

  describe('bulkRejectLogs', () => {
    it('should reject multiple logs successfully', async () => {
      // Arrange
      const logIds = ['log-1', 'log-2']
      const comments = 'Bulk rejection for review'
      const mockUser = {
        id: 'manager-id',
        roles: ['manager'],
      }

      mockAuth.mockResolvedValue({ user: mockUser })
      
      // Mock successful rejection for each log
      logIds.forEach((logId) => {
        const mockLog = {
          id: logId,
          status: 'submitted',
        }
        const mockUpdatedLog = {
          ...mockLog,
          status: 'rejected',
          approvedAt: new Date(),
          approvedById: mockUser.id,
        }
        
        mockPrisma.dailyLog.findUnique.mockResolvedValueOnce(mockLog)
        mockPrisma.dailyLog.update.mockResolvedValueOnce(mockUpdatedLog)
      })

      // Act
      const result = await bulkRejectLogs(logIds, comments)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.successCount).toBe(2)
      expect(result.data?.failureCount).toBe(0)
    })

    it('should fail when comments are empty', async () => {
      // Arrange
      const mockUser = {
        id: 'manager-id',
        roles: ['manager'],
      }
      mockAuth.mockResolvedValue({ user: mockUser })

      // Act
      const result = await bulkRejectLogs(['log-1'], '')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Comments are required when rejecting logs')
    })
  })
})