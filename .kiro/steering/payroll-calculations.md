# Payroll & Commission Calculations

This steering file documents the formulas and business rules used to compute labor costs, bonuses, commissions and mixed compensation in HUNKCentral. It accompanies the implementation in `lib/payCalculator.ts` and `lib/commissionMatcher.ts`.

## Labor cost and percentage

For each log section (Junk or Move) and for overall totals, compute:

- **Labor cost** = ∑ (hours × rate) for every employee on the section. Use the **wingman rate** by default, and the **captain rate** for captains and co‑captains. Rates are configured per user in the user management interface.
- **Labor percentage** = labor cost ÷ revenue. If revenue is 0, treat the percentage as 0 to avoid division by zero.
- **Target goals** – Junk operations target **14 %** and Move operations target **24 %** labor cost【931953846381930†L203-L207】. These goals are editable in the user management settings.

## Bonuses

Captains are eligible for bonuses when the labor percentage beats the target goal. The bonus formula is:

```
bonus = max((goalPercent - actualLaborPercent), 0) × revenue
```

The result is awarded to the **captain** only. Wingmen do not receive bonuses. For example, if the labor percentage for a Move section is 20 % and the goal is 24 %, the bonus is `(0.24 - 0.20) × revenue`.

## Tips distribution

Tips collected on each job are divided **equally** among all employees working that section. Co‑captains are treated the same as captains and wingmen for tip distribution. The **tips per HUNK** value displayed in section summaries is:

```
tipsPerHunk = totalSectionTips ÷ numberOfEmployees
```

Tips do **not** contribute to revenue and are not used in labor percentage calculations.

## Commission calculation

Sales consultants earn commissions on jobs they book. The commission logic is as follows:

1. **Entry creation** – A commission entry captures the estimated amount. Its status is `pending` until a captain log with a matching job ID is approved.
2. **Matching** – Upon log approval, if a job ID matches a pending commission entry, the entry status becomes `matched` and `actualRevenue` is set to the log’s revenue.
3. **Commission amount** – The commission is computed as:

```
commission = actualRevenue × commissionRate
```

The `commissionRate` is defined per employee in user settings. If multiple consultants book the same job ID, only the first match is allowed; duplicates should be flagged as conflicts.

## Salary and mixed compensation

Employees may have salary arrangements in addition to hourly pay and commissions. Salary types include **base**, **guaranteed** and **supplemental**. When calculating payroll:

- **Base salary** – Represents a fixed amount paid each period. Hourly rates are still used for labor cost reporting but are **not paid** in addition to the base salary.
- **Guaranteed salary** – Similar to base salary but allows hourly and commission earnings to count toward the guaranteed amount. If hourly + commission + bonus exceeds the guaranteed salary, the employee earns the higher value.
- **Supplemental salary** – Added on top of all other earnings.

The final compensation for each employee is the sum of:

```
finalCompensation = max(hourlyPay + commission + bonus, baseOrGuaranteedSalary) + supplementalSalary
```

## Pay period locking

When a pay period is **locked** or **closed**, all payroll calculations become final and cannot be modified. Ensure payroll logic respects the pay period status; attempts to edit logs or commissions within a closed period should be rejected.

## Example calculation

Below is a simplified example of how `payCalculator.ts` might compute payroll for an employee working one Move section:

```ts
interface LogSection {
  revenue: number;
  tips: number;
  entries: Array<{ hours: number; rate: number }>;
}

function calculateSection(section: LogSection, goalPercent: number) {
  const laborCost = section.entries.reduce(
    (acc, e) => acc + e.hours * e.rate,
    0
  );
  const laborPercent = section.revenue === 0 ? 0 : laborCost / section.revenue;
  const bonus =
    laborPercent < goalPercent
      ? (goalPercent - laborPercent) * section.revenue
      : 0;
  const tipsPerHunk =
    section.entries.length === 0 ? 0 : section.tips / section.entries.length;
  return { laborCost, laborPercent, bonus, tipsPerHunk };
}
```

Use this function as a starting point to implement the detailed logic defined above in `lib/payCalculator.ts`.
