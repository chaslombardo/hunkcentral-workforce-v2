// Real-time calculation utilities for daily logs
import type { DailyLogFormData, LogJobFormData, LogHourFormData } from './validations';
import type { User } from '@/types';
import { LABOR_GOALS } from './constants';

export interface JobCalculation {
  revenue: number;
  tips: number;
  upsells?: number; // For move jobs (junkOnMove + valuation + materials)
}

export interface SectionCalculation {
  totalRevenue: number;
  totalTips: number;
  totalUpsells?: number;
  totalLaborCost: number;
  laborCostPercentage: number;
  tipsPerHunk: number;
  totalHours: number;
  employeeCount: number;
  isUnderGoal: boolean;
  goal: number;
  disposalCostPercentage?: number; // For junk sections
  upsellPercentage?: number; // For move sections
  employees: Array<{
    employeeId: string;
    employeeName: string;
    hours: number;
    laborCost: number;
    isCoCaptain: boolean;
  }>;
}

export interface OverallCalculation {
  totalRevenue: number;
  totalTips: number;
  totalLaborCost: number;
  totalHours: number;
  overallLaborCostPercentage: number;
  employeeSummary: Array<{
    employeeId: string;
    employeeName: string;
    totalHours: number;
    totalTips: number;
    totalLaborCost: number;
    departments: Array<{
      department: string;
      hours: number;
    }>;
  }>;
  sectionBreakdown: {
    junk?: SectionCalculation;
    move?: SectionCalculation;
    other?: SectionCalculation;
  };
}

/**
 * Calculate job totals for a specific job type
 */
export function calculateJobTotals(
  jobs: LogJobFormData[],
  jobType: 'junk' | 'move',
  disposalCost?: number
): JobCalculation & { disposalCostPercentage?: number; upsellPercentage?: number } {
  const sectionJobs = jobs.filter(job => job.jobType === jobType);
  
  const revenue = sectionJobs.reduce((sum, job) => sum + (job.revenue || 0), 0);
  const tips = sectionJobs.reduce((sum, job) => sum + (job.tips || 0), 0);
  
  const result: JobCalculation & { disposalCostPercentage?: number; upsellPercentage?: number } = {
    revenue,
    tips,
  };

  if (jobType === 'move') {
    const upsells = sectionJobs.reduce((sum, job) => {
      return sum + (job.junkOnMove || 0) + (job.valuation || 0) + (job.materials || 0);
    }, 0);
    result.upsells = upsells;
    result.upsellPercentage = revenue > 0 ? (upsells / revenue) * 100 : 0;
  }

  if (jobType === 'junk' && disposalCost !== undefined) {
    result.disposalCostPercentage = revenue > 0 ? (disposalCost / revenue) * 100 : 0;
  }

  return result;
}

/**
 * Calculate section summary including labor costs and tips per HUNK
 */
export function calculateSectionSummary(
  jobs: LogJobFormData[],
  hours: LogHourFormData[],
  employees: User[],
  jobType: 'junk' | 'move',
  disposalCost?: number
): SectionCalculation {
  const employeeMap = new Map(employees.map(emp => [emp.id, emp]));
  
  // Calculate job totals
  const jobTotals = calculateJobTotals(jobs, jobType, disposalCost);
  
  // Filter hours for this section
  const sectionHours = hours.filter(hour => {
    return hour.department === jobType;
  });

  // Calculate labor costs and employee summary
  let totalLaborCost = 0;
  let totalHours = 0;
  const employeeSummaryMap = new Map<string, {
    employeeId: string;
    employeeName: string;
    hours: number;
    laborCost: number;
    isCoCaptain: boolean;
  }>();

  sectionHours.forEach(hour => {
    const employee = employeeMap.get(hour.employeeId);
    if (!employee) return;

    const hourlyRate = getHourlyRate(employee, jobType, hour.isCoCaptain);
    const laborCost = hour.hours * hourlyRate;
    
    totalHours += hour.hours;
    totalLaborCost += laborCost;

    const existing = employeeSummaryMap.get(hour.employeeId);
    if (existing) {
      existing.hours += hour.hours;
      existing.laborCost += laborCost;
      existing.isCoCaptain = existing.isCoCaptain || hour.isCoCaptain;
    } else {
      employeeSummaryMap.set(hour.employeeId, {
        employeeId: hour.employeeId,
        employeeName: employee.fullName,
        hours: hour.hours,
        laborCost,
        isCoCaptain: hour.isCoCaptain,
      });
    }
  });

  const employees_summary = Array.from(employeeSummaryMap.values());
  const employeeCount = employees_summary.length;
  const tipsPerHunk = employeeCount > 0 ? jobTotals.tips / employeeCount : 0;
  const laborCostPercentage = jobTotals.revenue > 0 ? (totalLaborCost / jobTotals.revenue) * 100 : 0;
  const goal = jobType === 'junk' ? LABOR_GOALS.JUNK : LABOR_GOALS.MOVE;
  const isUnderGoal = laborCostPercentage <= goal;

  const result: SectionCalculation = {
    totalRevenue: jobTotals.revenue,
    totalTips: jobTotals.tips,
    totalLaborCost,
    laborCostPercentage,
    tipsPerHunk,
    totalHours,
    employeeCount,
    isUnderGoal,
    goal,
    employees: employees_summary,
  };

  if (jobType === 'move' && jobTotals.upsells !== undefined) {
    result.totalUpsells = jobTotals.upsells;
    result.upsellPercentage = jobTotals.upsellPercentage;
  }

  if (jobType === 'junk' && jobTotals.disposalCostPercentage !== undefined) {
    result.disposalCostPercentage = jobTotals.disposalCostPercentage;
  }

  return result;
}

/**
 * Calculate other hours section (non-job departments)
 */
export function calculateOtherHoursSection(
  hours: LogHourFormData[],
  employees: User[]
): SectionCalculation {
  const employeeMap = new Map(employees.map(emp => [emp.id, emp]));
  
  // Filter hours for other departments (not junk or move)
  const otherHours = hours.filter(hour => 
    !['junk', 'move'].includes(hour.department)
  );

  let totalLaborCost = 0;
  let totalHours = 0;
  const employeeSummaryMap = new Map<string, {
    employeeId: string;
    employeeName: string;
    hours: number;
    laborCost: number;
    isCoCaptain: boolean;
  }>();

  otherHours.forEach(hour => {
    const employee = employeeMap.get(hour.employeeId);
    if (!employee) return;

    const hourlyRate = getHourlyRateByDepartment(employee, hour.department, hour.isCoCaptain);
    const laborCost = hour.hours * hourlyRate;
    
    totalHours += hour.hours;
    totalLaborCost += laborCost;

    const existing = employeeSummaryMap.get(hour.employeeId);
    if (existing) {
      existing.hours += hour.hours;
      existing.laborCost += laborCost;
      existing.isCoCaptain = existing.isCoCaptain || hour.isCoCaptain;
    } else {
      employeeSummaryMap.set(hour.employeeId, {
        employeeId: hour.employeeId,
        employeeName: employee.fullName,
        hours: hour.hours,
        laborCost,
        isCoCaptain: hour.isCoCaptain,
      });
    }
  });

  const employees_summary = Array.from(employeeSummaryMap.values());
  const employeeCount = employees_summary.length;

  return {
    totalRevenue: 0, // Other hours don't generate revenue
    totalTips: 0, // Other hours don't generate tips
    totalLaborCost,
    laborCostPercentage: 0, // No revenue to calculate percentage
    tipsPerHunk: 0,
    totalHours,
    employeeCount,
    isUnderGoal: true, // Always "under goal" since no revenue
    goal: 0,
    employees: employees_summary,
  };
}

/**
 * Calculate overall log totals and employee summary
 */
export function calculateOverallTotals(
  formData: DailyLogFormData,
  employees: User[]
): OverallCalculation {
  const employeeMap = new Map(employees.map(emp => [emp.id, emp]));
  
  let junkSection: SectionCalculation | undefined;
  let moveSection: SectionCalculation | undefined;
  let otherSection: SectionCalculation | undefined;

  // Calculate section summaries
  if (formData.sections.junk) {
    junkSection = calculateSectionSummary(
      formData.jobs,
      formData.hours,
      employees,
      'junk',
      formData.disposalCost
    );
  }

  if (formData.sections.move) {
    moveSection = calculateSectionSummary(
      formData.jobs,
      formData.hours,
      employees,
      'move'
    );
  }

  if (formData.sections.otherHours) {
    otherSection = calculateOtherHoursSection(formData.hours, employees);
  }

  // Calculate overall totals
  const totalRevenue = (junkSection?.totalRevenue || 0) + (moveSection?.totalRevenue || 0);
  const totalTips = (junkSection?.totalTips || 0) + (moveSection?.totalTips || 0);
  const totalLaborCost = (junkSection?.totalLaborCost || 0) + (moveSection?.totalLaborCost || 0) + (otherSection?.totalLaborCost || 0);
  const totalHours = (junkSection?.totalHours || 0) + (moveSection?.totalHours || 0) + (otherSection?.totalHours || 0);
  const overallLaborCostPercentage = totalRevenue > 0 ? (totalLaborCost / totalRevenue) * 100 : 0;

  // Create employee summary across all sections
  const employeeSummaryMap = new Map<string, {
    employeeId: string;
    employeeName: string;
    totalHours: number;
    totalTips: number;
    totalLaborCost: number;
    departments: Map<string, number>;
  }>();

  // Process all hours to create employee summary
  formData.hours.forEach(hour => {
    const employee = employeeMap.get(hour.employeeId);
    if (!employee) return;

    const hourlyRate = getHourlyRateByDepartment(employee, hour.department, hour.isCoCaptain);
    const laborCost = hour.hours * hourlyRate;

    // Calculate tips for this employee (distributed equally among section employees)
    let employeeTips = 0;
    if (hour.department === 'junk' && junkSection) {
      employeeTips += junkSection.tipsPerHunk;
    } else if (hour.department === 'move' && moveSection) {
      employeeTips += moveSection.tipsPerHunk;
    }

    const existing = employeeSummaryMap.get(hour.employeeId);
    if (existing) {
      existing.totalHours += hour.hours;
      existing.totalTips += employeeTips;
      existing.totalLaborCost += laborCost;
      existing.departments.set(
        hour.department,
        (existing.departments.get(hour.department) || 0) + hour.hours
      );
    } else {
      const departments = new Map<string, number>();
      departments.set(hour.department, hour.hours);
      
      employeeSummaryMap.set(hour.employeeId, {
        employeeId: hour.employeeId,
        employeeName: employee.fullName,
        totalHours: hour.hours,
        totalTips: employeeTips,
        totalLaborCost: laborCost,
        departments,
      });
    }
  });

  // Convert employee summary to array format
  const employeeSummary = Array.from(employeeSummaryMap.values()).map(emp => ({
    ...emp,
    departments: Array.from(emp.departments.entries()).map(([department, hours]) => ({
      department,
      hours,
    })),
  }));

  return {
    totalRevenue,
    totalTips,
    totalLaborCost,
    totalHours,
    overallLaborCostPercentage,
    employeeSummary,
    sectionBreakdown: {
      junk: junkSection,
      move: moveSection,
      other: otherSection,
    },
  };
}

/**
 * Get hourly rate for junk/move departments
 */
function getHourlyRate(
  employee: User,
  jobType: 'junk' | 'move',
  isCoCaptain: boolean
): number {
  const usesCaptainRate = employee.roles.includes('captain') || isCoCaptain;

  if (jobType === 'junk') {
    return usesCaptainRate
      ? (employee.rateJunkCaptain || 20.00)
      : (employee.rateJunkWingman || 15.00);
  } else {
    return usesCaptainRate
      ? (employee.rateMoveCaptain || 22.00)
      : (employee.rateMoveWingman || 17.00);
  }
}

/**
 * Get hourly rate for any department
 */
function getHourlyRateByDepartment(
  employee: User,
  department: string,
  isCoCaptain: boolean
): number {
  // For junk/move, use the specialized function
  if (department === 'junk' || department === 'move') {
    return getHourlyRate(employee, department, isCoCaptain);
  }

  // For other departments, co-captain status doesn't affect rates
  switch (department) {
    case 'zigma':
      return employee.rateZigma || 18.00;
    case 'training':
      return employee.rateTraining || 16.00;
    case 'estimating':
      return employee.rateEstimating || 25.00;
    case 'warehouse':
      return employee.rateWarehouse || 14.00;
    case 'admin':
      return employee.rateAdmin || 20.00;
    default:
      return employee.rateJunkWingman || 15.00;
  }
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format percentage values
 */
export function formatPercentage(percentage: number, decimals: number = 1): string {
  return `${percentage.toFixed(decimals)}%`;
}