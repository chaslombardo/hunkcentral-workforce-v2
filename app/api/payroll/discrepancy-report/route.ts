import { NextRequest, NextResponse } from 'next/server';
import { submitDiscrepancyReport } from '@/lib/actions/payroll-validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, payPeriodId, reportData } = body;

    if (!employeeId || !payPeriodId || !reportData) {
      return NextResponse.json(
        { error: 'employeeId, payPeriodId, and reportData are required' },
        { status: 400 }
      );
    }

    const result = await submitDiscrepancyReport(
      employeeId,
      payPeriodId,
      reportData
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ reportId: result.reportId });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
