-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "roles" TEXT[],
    "themePreference" TEXT NOT NULL DEFAULT 'system',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rateJunkCaptain" DECIMAL(6,2),
    "rateJunkWingman" DECIMAL(6,2),
    "rateMoveCaptain" DECIMAL(6,2),
    "rateMoveWingman" DECIMAL(6,2),
    "rateZigma" DECIMAL(6,2),
    "rateTraining" DECIMAL(6,2),
    "rateEstimating" DECIMAL(6,2),
    "rateWarehouse" DECIMAL(6,2),
    "rateAdmin" DECIMAL(6,2),
    "salaryAmount" DECIMAL(10,2),
    "salaryFrequency" TEXT,
    "salaryType" TEXT,
    "commissionRate" DECIMAL(5,2),
    "junkBonusGoal" DECIMAL(5,2) NOT NULL DEFAULT 0.14,
    "moveBonusGoal" DECIMAL(5,2) NOT NULL DEFAULT 0.24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyLog" (
    "id" TEXT NOT NULL,
    "captainId" TEXT NOT NULL,
    "logDate" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdById" TEXT NOT NULL,
    "lastEditedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LogJob" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "revenue" DECIMAL(10,2) NOT NULL,
    "tips" DECIMAL(10,2) NOT NULL,
    "junkOnMove" DECIMAL(10,2),
    "valuation" DECIMAL(10,2),
    "materials" DECIMAL(10,2),
    "disposalCost" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LogHour" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "hours" DECIMAL(5,2) NOT NULL,
    "isCoCaptain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommissionEntry" (
    "id" TEXT NOT NULL,
    "salesId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "targetDate" DATE NOT NULL,
    "estimatedRevenue" DECIMAL(10,2) NOT NULL,
    "actualRevenue" DECIMAL(10,2),
    "commissionAmount" DECIMAL(10,2),
    "status" TEXT NOT NULL,
    "matchedLogId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PayPeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DiscrepancyReport" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payPeriodId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expectedOutcome" TEXT,
    "contactEmail" TEXT,
    "requestCallback" BOOLEAN NOT NULL DEFAULT false,
    "errors" JSONB NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscrepancyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "userId" TEXT NOT NULL,
    "dailyLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PerformanceMetric" (
    "id" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "page" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserFeedback" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "email" TEXT,
    "userId" TEXT,
    "userAgent" TEXT,
    "screenResolution" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ABTestExperiment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "variants" JSONB NOT NULL,
    "targetMetric" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ABTestExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ABTestAssignment" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "variant" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ABTestAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ABTestEvent" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "variant" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ABTestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PrecomputedMetric" (
    "id" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "data" JSONB NOT NULL,
    "payPeriodId" TEXT,
    "department" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrecomputedMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dhKey" TEXT NOT NULL,
    "authKey" TEXT NOT NULL,
    "userAgent" TEXT,
    "platform" TEXT,
    "language" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_roles_idx" ON "public"."User"("roles");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "DailyLog_captainId_idx" ON "public"."DailyLog"("captainId");

-- CreateIndex
CREATE INDEX "DailyLog_logDate_idx" ON "public"."DailyLog"("logDate");

-- CreateIndex
CREATE INDEX "DailyLog_status_idx" ON "public"."DailyLog"("status");

-- CreateIndex
CREATE INDEX "DailyLog_captainId_logDate_idx" ON "public"."DailyLog"("captainId", "logDate");

-- CreateIndex
CREATE INDEX "DailyLog_status_submittedAt_idx" ON "public"."DailyLog"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "DailyLog_approvedById_approvedAt_idx" ON "public"."DailyLog"("approvedById", "approvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_captainId_logDate_key" ON "public"."DailyLog"("captainId", "logDate");

-- CreateIndex
CREATE INDEX "LogJob_logId_idx" ON "public"."LogJob"("logId");

-- CreateIndex
CREATE INDEX "LogJob_jobType_idx" ON "public"."LogJob"("jobType");

-- CreateIndex
CREATE INDEX "LogJob_jobId_idx" ON "public"."LogJob"("jobId");

-- CreateIndex
CREATE INDEX "LogJob_logId_jobType_idx" ON "public"."LogJob"("logId", "jobType");

-- CreateIndex
CREATE INDEX "LogHour_logId_idx" ON "public"."LogHour"("logId");

-- CreateIndex
CREATE INDEX "LogHour_employeeId_idx" ON "public"."LogHour"("employeeId");

-- CreateIndex
CREATE INDEX "LogHour_department_idx" ON "public"."LogHour"("department");

-- CreateIndex
CREATE INDEX "LogHour_logId_employeeId_idx" ON "public"."LogHour"("logId", "employeeId");

-- CreateIndex
CREATE INDEX "LogHour_employeeId_department_idx" ON "public"."LogHour"("employeeId", "department");

-- CreateIndex
CREATE INDEX "CommissionEntry_salesId_idx" ON "public"."CommissionEntry"("salesId");

-- CreateIndex
CREATE INDEX "CommissionEntry_jobId_idx" ON "public"."CommissionEntry"("jobId");

-- CreateIndex
CREATE INDEX "CommissionEntry_status_idx" ON "public"."CommissionEntry"("status");

-- CreateIndex
CREATE INDEX "CommissionEntry_targetDate_idx" ON "public"."CommissionEntry"("targetDate");

-- CreateIndex
CREATE INDEX "CommissionEntry_salesId_status_idx" ON "public"."CommissionEntry"("salesId", "status");

-- CreateIndex
CREATE INDEX "CommissionEntry_jobId_status_idx" ON "public"."CommissionEntry"("jobId", "status");

-- CreateIndex
CREATE INDEX "CommissionEntry_matchedLogId_idx" ON "public"."CommissionEntry"("matchedLogId");

-- CreateIndex
CREATE INDEX "PayPeriod_startDate_idx" ON "public"."PayPeriod"("startDate");

-- CreateIndex
CREATE INDEX "PayPeriod_endDate_idx" ON "public"."PayPeriod"("endDate");

-- CreateIndex
CREATE INDEX "PayPeriod_status_idx" ON "public"."PayPeriod"("status");

-- CreateIndex
CREATE INDEX "PayPeriod_startDate_endDate_idx" ON "public"."PayPeriod"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "PayPeriod_name_key" ON "public"."PayPeriod"("name");

-- CreateIndex
CREATE INDEX "DiscrepancyReport_employeeId_idx" ON "public"."DiscrepancyReport"("employeeId");

-- CreateIndex
CREATE INDEX "DiscrepancyReport_payPeriodId_idx" ON "public"."DiscrepancyReport"("payPeriodId");

-- CreateIndex
CREATE INDEX "DiscrepancyReport_status_idx" ON "public"."DiscrepancyReport"("status");

-- CreateIndex
CREATE INDEX "DiscrepancyReport_priority_idx" ON "public"."DiscrepancyReport"("priority");

-- CreateIndex
CREATE INDEX "DiscrepancyReport_category_idx" ON "public"."DiscrepancyReport"("category");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "public"."AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "public"."AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_dailyLogId_idx" ON "public"."AuditLog"("dailyLogId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "public"."AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "public"."AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_timestamp_idx" ON "public"."AnalyticsEvent"("timestamp");

-- CreateIndex
CREATE INDEX "PerformanceMetric_metricType_idx" ON "public"."PerformanceMetric"("metricType");

-- CreateIndex
CREATE INDEX "PerformanceMetric_page_idx" ON "public"."PerformanceMetric"("page");

-- CreateIndex
CREATE INDEX "PerformanceMetric_userId_idx" ON "public"."PerformanceMetric"("userId");

-- CreateIndex
CREATE INDEX "PerformanceMetric_timestamp_idx" ON "public"."PerformanceMetric"("timestamp");

-- CreateIndex
CREATE INDEX "UserFeedback_type_idx" ON "public"."UserFeedback"("type");

-- CreateIndex
CREATE INDEX "UserFeedback_status_idx" ON "public"."UserFeedback"("status");

-- CreateIndex
CREATE INDEX "UserFeedback_priority_idx" ON "public"."UserFeedback"("priority");

-- CreateIndex
CREATE INDEX "UserFeedback_userId_idx" ON "public"."UserFeedback"("userId");

-- CreateIndex
CREATE INDEX "UserFeedback_timestamp_idx" ON "public"."UserFeedback"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ABTestExperiment_name_key" ON "public"."ABTestExperiment"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ABTestAssignment_experimentId_userId_key" ON "public"."ABTestAssignment"("experimentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ABTestAssignment_experimentId_sessionId_key" ON "public"."ABTestAssignment"("experimentId", "sessionId");

-- CreateIndex
CREATE INDEX "PrecomputedMetric_metricType_entityType_entityId_idx" ON "public"."PrecomputedMetric"("metricType", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "PrecomputedMetric_payPeriodId_idx" ON "public"."PrecomputedMetric"("payPeriodId");

-- CreateIndex
CREATE INDEX "PrecomputedMetric_expiresAt_idx" ON "public"."PrecomputedMetric"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PrecomputedMetric_metricType_entityType_entityId_payPeriodI_key" ON "public"."PrecomputedMetric"("metricType", "entityType", "entityId", "payPeriodId", "department");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "public"."PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "PushSubscription_isActive_idx" ON "public"."PushSubscription"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_userId_endpoint_key" ON "public"."PushSubscription"("userId", "endpoint");

-- AddForeignKey
ALTER TABLE "public"."DailyLog" ADD CONSTRAINT "DailyLog_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyLog" ADD CONSTRAINT "DailyLog_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyLog" ADD CONSTRAINT "DailyLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyLog" ADD CONSTRAINT "DailyLog_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LogJob" ADD CONSTRAINT "LogJob_logId_fkey" FOREIGN KEY ("logId") REFERENCES "public"."DailyLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LogHour" ADD CONSTRAINT "LogHour_logId_fkey" FOREIGN KEY ("logId") REFERENCES "public"."DailyLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LogHour" ADD CONSTRAINT "LogHour_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionEntry" ADD CONSTRAINT "CommissionEntry_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionEntry" ADD CONSTRAINT "CommissionEntry_matchedLogId_fkey" FOREIGN KEY ("matchedLogId") REFERENCES "public"."DailyLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionEntry" ADD CONSTRAINT "CommissionEntry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommissionEntry" ADD CONSTRAINT "CommissionEntry_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscrepancyReport" ADD CONSTRAINT "DiscrepancyReport_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscrepancyReport" ADD CONSTRAINT "DiscrepancyReport_payPeriodId_fkey" FOREIGN KEY ("payPeriodId") REFERENCES "public"."PayPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscrepancyReport" ADD CONSTRAINT "DiscrepancyReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscrepancyReport" ADD CONSTRAINT "DiscrepancyReport_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "public"."DailyLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ABTestAssignment" ADD CONSTRAINT "ABTestAssignment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "public"."ABTestExperiment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ABTestEvent" ADD CONSTRAINT "ABTestEvent_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "public"."ABTestExperiment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
