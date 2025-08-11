"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { PayPeriodStatus } from "@/types"

// Validation schemas
const createPayPeriodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
})

const updatePayPeriodStatusSchema = z.object({
  id: z.string().min(1, "ID is required"),
  status: z.enum(["open", "locked", "closed"]),
})

// Types
export type PayPeriod = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: PayPeriodStatus
  createdAt: Date
  updatedAt: Date
}

export type CreatePayPeriodInput = z.infer<typeof createPayPeriodSchema>
export type UpdatePayPeriodStatusInput = z.infer<typeof updatePayPeriodStatusSchema>

// Actions
export async function createPayPeriod(input: CreatePayPeriodInput) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.includes("admin")) {
      throw new Error("Unauthorized: Admin access required")
    }

    const validatedInput = createPayPeriodSchema.parse(input)
    
    // Validate date range
    const startDate = new Date(validatedInput.startDate)
    const endDate = new Date(validatedInput.endDate)
    
    if (startDate >= endDate) {
      throw new Error("End date must be after start date")
    }

    // Check for overlapping pay periods
    const overlapping = await prisma.payPeriod.findFirst({
      where: {
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } }
            ]
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } }
            ]
          }
        ]
      }
    })

    if (overlapping) {
      throw new Error("Pay period overlaps with existing period")
    }

    const payPeriod = await prisma.payPeriod.create({
      data: {
        name: validatedInput.name,
        startDate,
        endDate,
        status: "open",
      },
    })

    revalidatePath("/admin/pay-periods")
    return { success: true, data: payPeriod as PayPeriod }
  } catch (error) {
    // Error creating pay period
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create pay period" 
    }
  }
}

export async function updatePayPeriodStatus(input: UpdatePayPeriodStatusInput) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.includes("admin")) {
      throw new Error("Unauthorized: Admin access required")
    }

    const validatedInput = updatePayPeriodStatusSchema.parse(input)
    
    const existingPeriod = await prisma.payPeriod.findUnique({
      where: { id: validatedInput.id }
    })

    if (!existingPeriod) {
      throw new Error("Pay period not found")
    }

    // Validate status transitions
    if (existingPeriod.status === "closed") {
      throw new Error("Cannot modify closed pay period")
    }

    if (existingPeriod.status === "locked" && validatedInput.status === "open") {
      throw new Error("Cannot reopen locked pay period")
    }

    const payPeriod = await prisma.payPeriod.update({
      where: { id: validatedInput.id },
      data: { status: validatedInput.status },
    })

    revalidatePath("/admin/pay-periods")
    return { success: true, data: payPeriod as PayPeriod }
  } catch (error) {
    // Error updating pay period status
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update pay period status" 
    }
  }
}

export async function getPayPeriods() {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.some(role => ["admin", "manager"].includes(role))) {
      throw new Error("Unauthorized: Admin or Manager access required")
    }

    const payPeriods = await prisma.payPeriod.findMany({
      orderBy: { startDate: "desc" },
    })

    return { success: true, data: payPeriods as PayPeriod[] }
  } catch (error) {
    // Error fetching pay periods
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch pay periods" 
    }
  }
}

export async function deletePayPeriod(id: string) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.includes("admin")) {
      throw new Error("Unauthorized: Admin access required")
    }

    const existingPeriod = await prisma.payPeriod.findUnique({
      where: { id }
    })

    if (!existingPeriod) {
      throw new Error("Pay period not found")
    }

    if (existingPeriod.status !== "open") {
      throw new Error("Can only delete open pay periods")
    }

    await prisma.payPeriod.delete({
      where: { id }
    })

    revalidatePath("/admin/pay-periods")
    return { success: true }
  } catch (error) {
    // Error deleting pay period
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete pay period" 
    }
  }
}

export async function getPayPeriodById(id: string) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.some(role => ["admin", "manager"].includes(role))) {
      throw new Error("Unauthorized: Admin or Manager access required")
    }

    const payPeriod = await prisma.payPeriod.findUnique({
      where: { id }
    })

    if (!payPeriod) {
      throw new Error("Pay period not found")
    }

    return { success: true, data: payPeriod as PayPeriod }
  } catch (error) {
    // Error fetching pay period
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch pay period" 
    }
  }
}

// Helper function to check if data can be modified for a given date
export async function canModifyDataForDate(date: Date) {
  try {
    const payPeriod = await prisma.payPeriod.findFirst({
      where: {
        AND: [
          { startDate: { lte: date } },
          { endDate: { gte: date } },
          { status: { in: ["locked", "closed"] } }
        ]
      }
    })

    return !payPeriod // Can modify if no locked/closed period found
  } catch (error) {
    // Error checking data modification permissions
    console.error('Error checking data modification permissions:', error);
    return false // Default to not allowing modifications on error
  }
}

// Get pay period statistics for dashboard tiles
export async function getPayPeriodStats() {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.some(role => ["admin", "manager"].includes(role))) {
      throw new Error("Unauthorized: Admin or Manager access required")
    }

    const now = new Date()

    // Get current pay period
    const currentPayPeriod = await prisma.payPeriod.findFirst({
      where: {
        AND: [
          { startDate: { lte: now } },
          { endDate: { gte: now } }
        ]
      },
      orderBy: { startDate: 'desc' }
    })

    // Get total pay periods count
    const totalPayPeriods = await prisma.payPeriod.count()

    // Get pay periods by status
    const openPeriods = await prisma.payPeriod.count({
      where: { status: 'open' }
    })

    const lockedPeriods = await prisma.payPeriod.count({
      where: { status: 'locked' }
    })

    const closedPeriods = await prisma.payPeriod.count({
      where: { status: 'closed' }
    })

    // Get pending logs count for current period (if exists)
    let pendingLogsCount = 0
    if (currentPayPeriod) {
      pendingLogsCount = await prisma.dailyLog.count({
        where: {
          status: 'submitted',
          logDate: {
            gte: currentPayPeriod.startDate,
            lte: currentPayPeriod.endDate
          }
        }
      })
    }

    // Calculate days remaining in current period
    const daysRemaining = currentPayPeriod 
      ? Math.max(0, Math.ceil((currentPayPeriod.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
      : 0

    return {
      success: true,
      data: {
        currentPeriod: {
          name: currentPayPeriod?.name || 'No Active Period',
          status: currentPayPeriod?.status || 'none',
          daysRemaining,
          pendingLogs: pendingLogsCount
        },
        totals: {
          total: totalPayPeriods,
          open: openPeriods,
          locked: lockedPeriods,
          closed: closedPeriods
        }
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch pay period statistics" 
    }
  }
}