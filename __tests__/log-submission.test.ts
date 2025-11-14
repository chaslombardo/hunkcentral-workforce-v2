/**
 * Integration tests for log submission and auto-save functionality
 * Tests the complete workflow from draft creation to submission
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
  afterAll,
} from 'vitest';
import { saveDraftLog, submitLog, loadLog } from '@/lib/actions/logs';
import { prisma } from '@/lib/prisma';
import type { DailyLogFormData } from '@/lib/validations';

// Mock the auth function
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const { auth } = await import('@/lib/auth');

describe('Log Submission Integration Tests', () => {
  const mockUser = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      fullName: 'Test User',
      roles: ['captain'],
    },
  };

  const mockFormData: DailyLogFormData = {
    captainId: 'test-user-id',
    logDate: new Date('2024-01-15'),
    sections: {
      junk: true,
      move: false,
      otherHours: true,
    },
    jobs: [
      {
        jobType: 'junk' as const,
        jobId: 'J12345',
        clientName: 'Test Client',
        revenue: 500,
        tips: 50,
        disposalCost: 25,
      },
    ],
    disposalCost: 25,
    hours: [
      {
        employeeId: 'test-user-id',
        department: 'junk' as const,
        hours: 8,
        isCoCaptain: false,
      },
    ],
  };

  beforeAll(async () => {
    // Create test user in database
    await prisma.user.upsert({
      where: { id: 'test-user-id' },
      update: {},
      create: {
        id: 'test-user-id',
        email: 'test@example.com',
        password: 'hashedpassword',
        fullName: 'Test User',
        roles: ['captain'],
        rateJunkCaptain: 20.0,
        rateJunkWingman: 15.0,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({
      where: { userId: 'test-user-id' },
    });
    await prisma.logHour.deleteMany({
      where: { employeeId: 'test-user-id' },
    });
    await prisma.logJob.deleteMany({});
    await prisma.dailyLog.deleteMany({
      where: { captainId: 'test-user-id' },
    });
    await prisma.user.delete({
      where: { id: 'test-user-id' },
    });
  });

  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockUser);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('saveDraftLog', () => {
    it('should create a new draft log successfully', async () => {
      const result = await saveDraftLog(null, mockFormData);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: expect.any(String),
        status: 'draft',
        updatedAt: expect.any(Date),
      });

      // Verify log was created in database
      const savedLog = await prisma.dailyLog.findUnique({
        where: { id: result.data!.id },
        include: { jobs: true, hours: true },
      });

      expect(savedLog).toBeTruthy();
      expect(savedLog!.status).toBe('draft');
      expect(savedLog!.captainId).toBe('test-user-id');
      expect(savedLog!.jobs).toHaveLength(1);
      expect(savedLog!.hours).toHaveLength(1);
    });

    it('should update an existing draft log', async () => {
      // First create a draft
      const createResult = await saveDraftLog(null, mockFormData);
      expect(createResult.success).toBe(true);

      const logId = createResult.data!.id;

      // Update the draft with new data
      const updatedFormData = {
        ...mockFormData,
        jobs: [
          ...mockFormData.jobs,
          {
            jobType: 'junk' as const,
            jobId: 'J67890',
            clientName: 'Another Client',
            revenue: 300,
            tips: 30,
          },
        ],
      };

      const updateResult = await saveDraftLog(logId, updatedFormData);

      expect(updateResult.success).toBe(true);
      expect(updateResult.data!.id).toBe(logId);

      // Verify the log was updated
      const updatedLog = await prisma.dailyLog.findUnique({
        where: { id: logId },
        include: { jobs: true, hours: true },
      });

      expect(updatedLog!.jobs).toHaveLength(2);
    });

    it('should create audit log entries', async () => {
      const result = await saveDraftLog(null, mockFormData);
      expect(result.success).toBe(true);

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityId: result.data!.id,
          entityType: 'daily_log',
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('create');
      expect(auditLogs[0].userId).toBe('test-user-id');
    });

    it('should fail without authentication', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const result = await saveDraftLog(null, mockFormData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
    });

    it('should validate form data', async () => {
      const invalidFormData = {
        ...mockFormData,
        captainId: '', // Invalid: empty captain ID
      };

      const result = await saveDraftLog(null, invalidFormData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Captain selection is required');
    });
  });

  describe('submitLog', () => {
    it('should submit a new log successfully', async () => {
      const result = await submitLog(null, mockFormData);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: expect.any(String),
        status: 'submitted',
        submittedAt: expect.any(Date),
      });

      // Verify log status in database
      const submittedLog = await prisma.dailyLog.findUnique({
        where: { id: result.data!.id },
      });

      expect(submittedLog!.status).toBe('submitted');
      expect(submittedLog!.submittedAt).toBeTruthy();
    });

    it('should update existing draft to submitted', async () => {
      // First create a draft
      const draftResult = await saveDraftLog(null, mockFormData);
      expect(draftResult.success).toBe(true);

      const logId = draftResult.data!.id;

      // Submit the draft
      const submitResult = await submitLog(logId, mockFormData);

      expect(submitResult.success).toBe(true);
      expect(submitResult.data!.id).toBe(logId);
      expect(submitResult.data!.status).toBe('submitted');

      // Verify status change in database
      const submittedLog = await prisma.dailyLog.findUnique({
        where: { id: logId },
      });

      expect(submittedLog!.status).toBe('submitted');
      expect(submittedLog!.submittedAt).toBeTruthy();
    });

    it('should fail to submit empty log', async () => {
      const emptyFormData = {
        ...mockFormData,
        jobs: [],
        hours: [],
      };

      const result = await submitLog(null, emptyFormData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot submit empty log');
    });

    it('should create audit log for submission', async () => {
      const result = await submitLog(null, mockFormData);
      expect(result.success).toBe(true);

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityId: result.data!.id,
          entityType: 'daily_log',
          action: 'submit',
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].changes).toMatchObject({
        status: { from: 'draft', to: 'submitted' },
      });
    });
  });

  describe('loadLog', () => {
    it('should load an existing log successfully', async () => {
      // Create a log first
      const createResult = await saveDraftLog(null, mockFormData);
      expect(createResult.success).toBe(true);

      const logId = createResult.data!.id;

      // Load the log
      const loadResult = await loadLog(logId);

      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toMatchObject({
        id: logId,
        captainId: 'test-user-id',
        status: 'draft',
        jobs: expect.arrayContaining([
          expect.objectContaining({
            jobId: 'J12345',
            clientName: 'Test Client',
          }),
        ]),
        hours: expect.arrayContaining([
          expect.objectContaining({
            employeeId: 'test-user-id',
            department: 'junk',
            hours: expect.any(Object), // Decimal type
          }),
        ]),
      });
    });

    it('should fail to load non-existent log', async () => {
      const result = await loadLog('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Log not found');
    });

    it('should fail without authentication', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const result = await loadLog('some-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
    });
  });

  describe('Complete Workflow', () => {
    it('should handle complete draft -> submit workflow', async () => {
      // 1. Create initial draft
      const draftResult = await saveDraftLog(null, mockFormData);
      expect(draftResult.success).toBe(true);

      const logId = draftResult.data!.id;

      // 2. Update draft with more data
      const updatedFormData = {
        ...mockFormData,
        hours: [
          ...mockFormData.hours,
          {
            employeeId: 'test-user-id',
            department: 'training' as const,
            hours: 2,
            isCoCaptain: false,
          },
        ],
      };

      const updateResult = await saveDraftLog(logId, updatedFormData);
      expect(updateResult.success).toBe(true);

      // 3. Submit the log
      const submitResult = await submitLog(logId, updatedFormData);
      expect(submitResult.success).toBe(true);

      // 4. Verify final state
      const finalLog = await prisma.dailyLog.findUnique({
        where: { id: logId },
        include: { jobs: true, hours: true, auditLogs: true },
      });

      expect(finalLog!.status).toBe('submitted');
      expect(finalLog!.submittedAt).toBeTruthy();
      expect(finalLog!.jobs).toHaveLength(1);
      expect(finalLog!.hours).toHaveLength(2);
      expect(finalLog!.auditLogs.length).toBeGreaterThanOrEqual(3); // create, update, submit
    });
  });
});
