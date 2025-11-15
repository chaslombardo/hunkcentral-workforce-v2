// Zod schemas for form validation
import { z } from 'zod';
import { COMMISSION_JOB_TYPES } from './commission-job-types';

// User roles enum
export const UserRoleSchema = z.enum([
  'admin',
  'manager',
  'captain',
  'sales',
  'wingman',
]);

// Basic user schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string().min(1, 'Full name is required'),
  roles: z.array(UserRoleSchema),
});

// Login schema
export const LoginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .transform((val) => val.trim().toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

// Job schema for daily logs
export const LogJobSchema = z.object({
  jobType: z.enum(['junk', 'move']),
  jobId: z
    .string()
    .min(1, 'Job ID is required')
    .refine(
      (val) => /^\d{7,10}$/.test(val),
      'Job ID must be 7-10 digits, numeric only'
    ),
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

export const CommissionJobTypeEnum = z.enum(COMMISSION_JOB_TYPES);

export const CommissionEntrySchema = z.object({
  salesId: z.string().min(1, 'Sales consultant is required'),
  jobId: z
    .string()
    .min(1, 'Job ID is required')
    .transform((val) => val.trim())
    .refine(
      (val) => /^\d{7,10}$/.test(val),
      'Job ID must be 7-10 digits, numeric only'
    ),
  clientName: z
    .string()
    .min(1, 'Client name is required')
    .max(100, 'Client name must be 100 characters or less'),
  jobType: CommissionJobTypeEnum,
  targetDate: z.date(),
  estimatedRevenue: z
    .number()
    .min(0.01, 'Estimated revenue must be greater than $0.00'),
});

// Log hour schema for team hours tracking
export const LogHourSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  department: z.enum([
    'junk',
    'move',
    'zigma',
    'training',
    'estimating',
    'warehouse',
    'admin',
  ]),
  hours: z.number().min(0).max(24, 'Hours cannot exceed 24 per day'),
  isCoCaptain: z.boolean(),
});

// Daily log form schema
export const DailyLogFormSchema = z.object({
  captainId: z.string().min(1, 'Captain selection is required'),
  logDate: z.date(),
  sections: z.object({
    junk: z.boolean(),
    move: z.boolean(),
    otherHours: z.boolean(),
  }),
  // Jobs will be added dynamically
  jobs: z.array(LogJobSchema),
  // Junk section disposal cost (section level)
  disposalCost: z.number().min(0).optional(),
  // Hours will be added dynamically
  hours: z.array(LogHourSchema),
});

// Base user schema for common fields
const UsernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must be 32 characters or less')
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    'Username can only contain letters, numbers, dots, underscores, and hyphens'
  )
  .transform((val) => val.toLowerCase());

const BaseUserSchema = z.object({
  username: UsernameSchema.optional(),
  email: z.string().email('Please enter a valid email address'),
  fullName: z.string().min(1, 'Full name is required'),
  roles: z.array(UserRoleSchema).min(1, 'At least one role is required'),
  isActive: z.boolean().optional(),

  // Department-specific hourly rates
  rateJunkCaptain: z.number().min(0).optional(),
  rateJunkWingman: z.number().min(0).optional(),
  rateMoveCaptain: z.number().min(0).optional(),
  rateMoveWingman: z.number().min(0).optional(),
  rateZigma: z.number().min(0).optional(),
  rateTraining: z.number().min(0).optional(),
  rateEstimating: z.number().min(0).optional(),
  rateWarehouse: z.number().min(0).optional(),
  rateAdmin: z.number().min(0).optional(),

  // Salary settings
  salaryAmount: z.number().min(0).optional(),
  salaryFrequency: z.enum(['weekly', 'bi-weekly', 'monthly']).optional(),
  salaryType: z.enum(['base', 'guaranteed', 'supplemental']).optional(),

  // Commission and bonus settings
  commissionRate: z.number().min(0).max(100).optional(),
  junkBonusGoal: z.number().min(0).max(1).default(0.14),
  moveBonusGoal: z.number().min(0).max(1).default(0.24),
});

// User management schemas
export const CreateUserSchema = BaseUserSchema.extend({
  username: UsernameSchema,
  isActive: z.boolean().default(true),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const UpdateUserSchema = BaseUserSchema.extend({
  id: z.string(),
  isActive: z.boolean().optional(),
  username: UsernameSchema.optional(),
  password: z
    .union([
      z.string().min(8, 'Password must be at least 8 characters'),
      z.literal(''),
      z.undefined(),
    ])
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

export const UserSearchSchema = z
  .object({
    search: z.string().optional(),
    roles: z.array(UserRoleSchema).optional(),
    sortBy: z.enum(['fullName', 'email', 'createdAt']).default('fullName'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
  })
  .transform((data) => ({
    ...data,
    sortBy: data.sortBy || 'fullName',
    sortOrder: data.sortOrder || 'asc',
    page: data.page || 1,
    limit: data.limit || 20,
  }));

export type LoginFormData = z.infer<typeof LoginSchema>;
export type LogJobFormData = z.infer<typeof LogJobSchema>;
export type LogHourFormData = z.infer<typeof LogHourSchema>;
export type CommissionEntryFormData = z.infer<typeof CommissionEntrySchema>;
export type CommissionJobType = (typeof COMMISSION_JOB_TYPES)[number];
export type DailyLogFormData = z.infer<typeof DailyLogFormSchema>;
export type CreateUserFormData = z.infer<typeof CreateUserSchema>;
export type UpdateUserFormData = z.infer<typeof UpdateUserSchema>;
export type UserSearchFormData = z.infer<typeof UserSearchSchema>;

// Alias for backward compatibility with tests
export const UserFormSchema = CreateUserSchema;
