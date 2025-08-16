import { NextRequest, NextResponse } from 'next/server';
import { getCachedDetailedPayrollBreakdown } from '@/lib/actions/payroll';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const payPeriodId = searchParams.get('payPeriodId');

    if (!employeeId || !payPeriodId) {
      return NextResponse.json(
        { error: 'employeeId and payPeriodId are required' },
        { status: 400 }
      );
    }

    const result = await getCachedDetailedPayrollBreakdown(employeeId, payPeriodId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}