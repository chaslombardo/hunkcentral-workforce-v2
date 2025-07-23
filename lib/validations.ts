// Zod schemas for form validation
import { z } from 'zod';

// User roles enum
export const UserRoleSchema = z.enum(['admin', 'manager', 'captain', 'sales', 'wingman']);

// Basic user schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string().min(1, 'Full name is required'),
  roles: z.array(UserRoleSchema),
});

// Login schema
export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Job schema for daily logs
export const LogJobSchema = z.object({
  jobType: z.enum(['junk', 'move']),
  jobId: z.string().min(1, 'Job ID is required'),
  clientName: z.string().min(1, 'Client name is required'),
  revenue: z.number().min(0, 'Revenue must be a positive number'),
  tips: z.number().min(0, 'Tips must be a positive number'),
  // Move-specific fields
  junkOnMove: z.number().min(0).optional(),
  valuation: z.number().min(0).optional(),
  materials: z.number().min(0).optional(),
  // Junk-specific fields (section level)
  disposalCost: z.number().min(0).optional(),
});

// Commission entry schema
export const CommissionEntrySchema = z.object({
  salesId: z.string(),
  jobId: z.string().min(1, 'Job ID is required'),
  clientName: z.string().min(1, 'Client name is required'),
  jobType: z.enum(['junk', 'move']),
  targetDate: z.date(),
  estimatedRevenue: z.number().min(0, 'Estimated revenue must be positive'),
});

export type LoginFormData = z.infer<typeof LoginSchema>;
export type LogJobFormData = z.infer<typeof LogJobSchema>;
export type CommissionEntryFormData = z.infer<typeof CommissionEntrySchema>;