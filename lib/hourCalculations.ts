// Hour calculation utilities for team hours tracking

import type { LogHourFormData } from './validations';
import type { User } from '@/types';

export interface HourCalculationResult {
  totalHours: number;
  totalLaborCost: number;
  employeeSummary: Array<{
    employeeId: string;
    employeeName: string;
    totalHours: number;
    laborCost: number;
    isCoCaptain: boolean;
    departments: Array<{
      department: string;
      hours: number;
    }>;
  }>;
}

/**
 * Calculate total hours and labor costs for a section
 */
export function calculateSectionHours(
  hours: LogHourFormData[],
  employees: User[],
  section?: 'junk' | 'move' | 'other'
): HourCalculationResult {
  // Filter hours by section if specified
  const sectionHours = section
    ? hours.filter((h) => {
        if (section === 'other') {
          return !['junk', 'move'].includes(h.department);
        }
        return h.department === section;
      })
    : hours;

  const employeeMap = new Map<string, User>();
  employees.forEach((emp) => employeeMap.set(emp.id, emp));

  const employeeSummaryMap = new Map<
    string,
    {
      employeeId: string;
      employeeName: string;
      totalHours: number;
      laborCost: number;
      isCoCaptain: boolean;
      departments: Map<string, number>;
    }
  >();

  let totalHours = 0;
  let totalLaborCost = 0;

  // Process each hour entry
  sectionHours.forEach((hourEntry) => {
    const employee = employeeMap.get(hourEntry.employeeId);
    if (!employee) return;

    const hours = hourEntry.hours;
    totalHours += hours;

    // Calculate labor cost based on department and co-captain status
    const rate = getHourlyRate(
      employee,
      hourEntry.department,
      hourEntry.isCoCaptain
    );
    const laborCost = hours * rate;
    totalLaborCost += laborCost;

    // Update employee summary
    const existing = employeeSummaryMap.get(hourEntry.employeeId);
    if (existing) {
      existing.totalHours += hours;
      existing.laborCost += laborCost;
      existing.isCoCaptain = existing.isCoCaptain || hourEntry.isCoCaptain;
      existing.departments.set(
        hourEntry.department,
        (existing.departments.get(hourEntry.department) || 0) + hours
      );
    } else {
      const departments = new Map<string, number>();
      departments.set(hourEntry.department, hours);

      employeeSummaryMap.set(hourEntry.employeeId, {
        employeeId: hourEntry.employeeId,
        employeeName: employee.fullName,
        totalHours: hours,
        laborCost,
        isCoCaptain: hourEntry.isCoCaptain,
        departments,
      });
    }
  });

  // Convert employee summary to array
  const employeeSummary = Array.from(employeeSummaryMap.values()).map(
    (emp) => ({
      ...emp,
      departments: Array.from(emp.departments.entries()).map(
        ([department, hours]) => ({
          department,
          hours,
        })
      ),
    })
  );

  return {
    totalHours,
    totalLaborCost,
    employeeSummary,
  };
}

/**
 * Get the appropriate hourly rate for an employee based on department and co-captain status
 */
export function getHourlyRate(
  employee: User,
  department: string,
  isCoCaptain: boolean
): number {
  // If co-captain, use captain rates
  if (isCoCaptain) {
    switch (department) {
      case 'junk':
        return employee.rateJunkCaptain || 20.0;
      case 'move':
        return employee.rateMoveCaptain || 22.0;
      case 'zigma':
        return employee.rateZigma || 18.0;
      case 'training':
        return employee.rateTraining || 16.0;
      case 'estimating':
        return employee.rateEstimating || 25.0;
      case 'warehouse':
        return employee.rateWarehouse || 14.0;
      case 'admin':
        return employee.rateAdmin || 20.0;
      default:
        return employee.rateJunkCaptain || 20.0;
    }
  }

  // Use regular rates based on department
  switch (department) {
    case 'junk':
      return employee.rateJunkWingman || 15.0;
    case 'move':
      return employee.rateMoveWingman || 17.0;
    case 'zigma':
      return employee.rateZigma || 18.0;
    case 'training':
      return employee.rateTraining || 16.0;
    case 'estimating':
      return employee.rateEstimating || 25.0;
    case 'warehouse':
      return employee.rateWarehouse || 14.0;
    case 'admin':
      return employee.rateAdmin || 20.0;
    default:
      return employee.rateJunkWingman || 15.0;
  }
}

/**
 * Calculate tips per HUNK for a section
 */
export function calculateTipsPerHunk(
  totalTips: number,
  hours: LogHourFormData[]
): number {
  const uniqueEmployees = new Set(hours.map((h) => h.employeeId));
  const employeeCount = uniqueEmployees.size;

  return employeeCount > 0 ? totalTips / employeeCount : 0;
}

/**
 * Calculate labor cost percentage
 */
export function calculateLaborCostPercentage(
  totalLaborCost: number,
  totalRevenue: number
): number {
  return totalRevenue > 0 ? (totalLaborCost / totalRevenue) * 100 : 0;
}

/**
 * Validate hour entries for business rules
 */
export function validateHourEntries(hours: LogHourFormData[]): string[] {
  const errors: string[] = [];

  // Check for duplicate employee-department combinations
  const combinations = new Set<string>();
  hours.forEach((hour, index) => {
    const key = `${hour.employeeId}-${hour.department}`;
    if (combinations.has(key)) {
      errors.push(
        `Employee cannot have multiple entries for the same department (entry ${index + 1})`
      );
    }
    combinations.add(key);
  });

  // Check for reasonable hour limits (max 24 hours per employee per day)
  const employeeHours = new Map<string, number>();
  hours.forEach((hour) => {
    const current = employeeHours.get(hour.employeeId) || 0;
    employeeHours.set(hour.employeeId, current + hour.hours);
  });

  employeeHours.forEach((totalHours, employeeId) => {
    if (totalHours > 24) {
      errors.push(
        `Employee ${employeeId} has more than 24 hours total (${totalHours} hours)`
      );
    }
  });

  return errors;
}
