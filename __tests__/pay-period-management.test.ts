import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  createPayPeriod, 
  updatePayPeriodStatus, 
  getPayPeriods, 
  deletePayPeriod,
  canModifyDataForDate,
  type CreatePayPeriodInput 
} from '@/lib/actions/pay-periods'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    payPeriod: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')

describe('Pay Period Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock authenticated admin user
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', roles: ['admin'] }
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createPayPeriod', () => {
    it('should create a pay period successfully', async () => {
      const input: CreatePayPeriodInput = {
        name: 'January 2024',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
      }

      const mockPayPeriod = {
        id: 'period-1',
        name: 'January 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.payPeriod.findFirst).mockResolvedValue(null) // No overlapping periods
      vi.mocked(prisma.payPeriod.create).mockResolvedValue(mockPayPeriod)

      const result = await createPayPeriod(input)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPayPeriod)
      expect(prisma.payPeriod.create).toHaveBeenCalledWith({
        data: {
          name: 'January 2024',
          startDate: new Date('2024-01-01T00:00:00.000Z'),
          endDate: new Date('2024-01-31T23:59:59.999Z'),
          status: 'open',
        },
      })
    })

    it('should reject overlapping pay periods', async () => {
      const input: CreatePayPeriodInput = {
        name: 'January 2024',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
      }

      const overlappingPeriod = {
        id: 'existing-period',
        name: 'Existing Period',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        status: 'open',
      }

      vi.mocked(prisma.payPeriod.findFirst).mockResolvedValue(overlappingPeriod as any)

      const result = await createPayPeriod(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Pay period overlaps with existing period')
      expect(prisma.payPeriod.create).not.toHaveBeenCalled()
    })

    it('should reject invalid date ranges', async () => {
      const input: CreatePayPeriodInput = {
        name: 'Invalid Period',
        startDate: '2024-01-31T00:00:00.000Z',
        endDate: '2024-01-01T23:59:59.999Z', // End before start
      }

      const result = await createPayPeriod(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('End date must be after start date')
      expect(prisma.payPeriod.create).not.toHaveBeenCalled()
    })

    it('should require admin role', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', roles: ['captain'] }
      } as any)

      const input: CreatePayPeriodInput = {
        name: 'January 2024',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
      }

      const result = await createPayPeriod(input)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized: Admin access required')
    })
  })

  describe('updatePayPeriodStatus', () => {
    it('should update status from open to locked', async () => {
      const existingPeriod = {
        id: 'period-1',
        status: 'open',
      }

      const updatedPeriod = {
        ...existingPeriod,
        status: 'locked',
      }

      vi.mocked(prisma.payPeriod.findUnique).mockResolvedValue(existingPeriod as any)
      vi.mocked(prisma.payPeriod.update).mockResolvedValue(updatedPeriod as any)

      const result = await updatePayPeriodStatus({ id: 'period-1', status: 'locked' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedPeriod)
      expect(prisma.payPeriod.update).toHaveBeenCalledWith({
        where: { id: 'period-1' },
        data: { status: 'locked' },
      })
    })

    it('should update status from locked to closed', async () => {
      const existingPeriod = {
        id: 'period-1',
        status: 'locked',
      }

      const updatedPeriod = {
        ...existingPeriod,
        status: 'closed',
      }

      vi.mocked(prisma.payPeriod.findUnique).mockResolvedValue(existingPeriod as any)
      vi.mocked(prisma.payPeriod.update).mockResolvedValue(updatedPeriod as any)

      const result = await updatePayPeriodStatus({ id: 'period-1', status: 'closed' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedPeriod)
    })

    it('should prevent modifying closed periods', async () => {
      const existingPeriod = {
        id: 'period-1',
        status: 'closed',
      }

      vi.mocked(prisma.payPeriod.findUnique).mockResolvedValue(existingPeriod as any)

      const result = await updatePayPeriodStatus({ id: 'period-1', status: 'open' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot modify closed pay period')
      expect(prisma.payPeriod.update).not.toHaveBeenCalled()
    })

    it('should prevent reopening locked periods', async () => {
      const existingPeriod = {
        id: 'period-1',
        status: 'locked',
      }

      vi.mocked(prisma.payPeriod.findUnique).mockResolvedValue(existingPeriod as any)

      const result = await updatePayPeriodStatus({ id: 'period-1', status: 'open' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot reopen locked pay period')
      expect(prisma.payPeriod.update).not.toHaveBeenCalled()
    })
  })

  describe('deletePayPeriod', () => {
    it('should delete open pay periods', async () => {
      const existingPeriod = {
        id: 'period-1',
        status: 'open',
      }

      vi.mocked(prisma.payPeriod.findUnique).mockResolvedValue(existingPeriod as any)
      vi.mocked(prisma.payPeriod.delete).mockResolvedValue(existingPeriod as any)

      const result = await deletePayPeriod('period-1')

      expect(result.success).toBe(true)
      expect(prisma.payPeriod.delete).toHaveBeenCalledWith({
        where: { id: 'period-1' },
      })
    })

    it('should prevent deleting locked periods', async () => {
      const existingPeriod = {
        id: 'period-1',
        status: 'locked',
      }

      vi.mocked(prisma.payPeriod.findUnique).mockResolvedValue(existingPeriod as any)

      const result = await deletePayPeriod('period-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Can only delete open pay periods')
      expect(prisma.payPeriod.delete).not.toHaveBeenCalled()
    })

    it('should prevent deleting closed periods', async () => {
      const existingPeriod = {
        id: 'period-1',
        status: 'closed',
      }

      vi.mocked(prisma.payPeriod.findUnique).mockResolvedValue(existingPeriod as any)

      const result = await deletePayPeriod('period-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Can only delete open pay periods')
      expect(prisma.payPeriod.delete).not.toHaveBeenCalled()
    })
  })

  describe('canModifyDataForDate', () => {
    it('should allow modification when no pay period exists for date', async () => {
      vi.mocked(prisma.payPeriod.findFirst).mockResolvedValue(null)

      const result = await canModifyDataForDate(new Date('2024-01-15'))

      expect(result).toBe(true)
    })

    it('should allow modification when pay period is open', async () => {
      const openPeriod = {
        id: 'period-1',
        status: 'open',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      }

      vi.mocked(prisma.payPeriod.findFirst).mockResolvedValue(null) // No locked/closed periods

      const result = await canModifyDataForDate(new Date('2024-01-15'))

      expect(result).toBe(true)
    })

    it('should prevent modification when pay period is locked', async () => {
      const lockedPeriod = {
        id: 'period-1',
        status: 'locked',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      }

      vi.mocked(prisma.payPeriod.findFirst).mockResolvedValue(lockedPeriod as any)

      const result = await canModifyDataForDate(new Date('2024-01-15'))

      expect(result).toBe(false)
    })

    it('should prevent modification when pay period is closed', async () => {
      const closedPeriod = {
        id: 'period-1',
        status: 'closed',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      }

      vi.mocked(prisma.payPeriod.findFirst).mockResolvedValue(closedPeriod as any)

      const result = await canModifyDataForDate(new Date('2024-01-15'))

      expect(result).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.payPeriod.findFirst).mockRejectedValue(new Error('Database error'))

      const result = await canModifyDataForDate(new Date('2024-01-15'))

      expect(result).toBe(false) // Default to not allowing modifications on error
    })
  })

  describe('getPayPeriods', () => {
    it('should return pay periods for admin users', async () => {
      const mockPayPeriods = [
        {
          id: 'period-1',
          name: 'January 2024',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'period-2',
          name: 'February 2024',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-29'),
          status: 'locked',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.payPeriod.findMany).mockResolvedValue(mockPayPeriods)

      const result = await getPayPeriods()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPayPeriods)
      expect(prisma.payPeriod.findMany).toHaveBeenCalledWith({
        orderBy: { startDate: 'desc' },
      })
    })

    it('should return pay periods for manager users', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', roles: ['manager'] }
      } as any)

      const mockPayPeriods = []
      vi.mocked(prisma.payPeriod.findMany).mockResolvedValue(mockPayPeriods)

      const result = await getPayPeriods()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPayPeriods)
    })

    it('should reject unauthorized users', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', roles: ['captain'] }
      } as any)

      const result = await getPayPeriods()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized: Admin or Manager access required')
      expect(prisma.payPeriod.findMany).not.toHaveBeenCalled()
    })
  })
})