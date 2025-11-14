-- CreateTable
CREATE TABLE "DiscrepancyReport" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payPeriodId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requestCallback" BOOLEAN NOT NULL DEFAULT false,
    "expectedOutcome" TEXT,
    "contactEmail" TEXT,
    "errors" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscrepancyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscrepancyReport_employeeId_idx" ON "DiscrepancyReport"("employeeId");

-- CreateIndex
CREATE INDEX "DiscrepancyReport_payPeriodId_idx" ON "DiscrepancyReport"("payPeriodId");

-- CreateIndex
CREATE INDEX "DiscrepancyReport_reportedById_idx" ON "DiscrepancyReport"("reportedById");

-- CreateIndex
CREATE INDEX "DiscrepancyReport_status_idx" ON "DiscrepancyReport"("status");

-- CreateIndex
CREATE INDEX "DiscrepancyReport_priority_idx" ON "DiscrepancyReport"("priority");

-- CreateIndex
CREATE INDEX "DiscrepancyReport_reportedAt_idx" ON "DiscrepancyReport"("reportedAt");

-- AddForeignKey
ALTER TABLE "DiscrepancyReport" ADD CONSTRAINT "DiscrepancyReport_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscrepancyReport" ADD CONSTRAINT "DiscrepancyReport_payPeriodId_fkey" FOREIGN KEY ("payPeriodId") REFERENCES "PayPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscrepancyReport" ADD CONSTRAINT "DiscrepancyReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscrepancyReport" ADD CONSTRAINT "DiscrepancyReport_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;