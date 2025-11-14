-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "roles" TEXT[],
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
CREATE TABLE "DailyLog" (
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
CREATE TABLE "LogJob" (
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
CREATE TABLE "LogHour" (
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
CREATE TABLE "CommissionEntry" (
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayPeriod" (
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
CREATE TABLE "AuditLog" (
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionEntry_jobId_key" ON "CommissionEntry"("jobId");

-- AddForeignKey
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogJob" ADD CONSTRAINT "LogJob_logId_fkey" FOREIGN KEY ("logId") REFERENCES "DailyLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogHour" ADD CONSTRAINT "LogHour_logId_fkey" FOREIGN KEY ("logId") REFERENCES "DailyLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogHour" ADD CONSTRAINT "LogHour_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionEntry" ADD CONSTRAINT "CommissionEntry_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionEntry" ADD CONSTRAINT "CommissionEntry_matchedLogId_fkey" FOREIGN KEY ("matchedLogId") REFERENCES "DailyLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "DailyLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
