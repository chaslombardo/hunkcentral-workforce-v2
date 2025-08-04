'use client';

import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  HelpCircle, 
  Calculator, 
  Clock, 
  DollarSign, 
  Award,
  Users,
  TrendingUp,
  Info
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { Department } from '@/types';

interface CalculationTooltipProps {
  type: 'labor-cost' | 'bonus' | 'tips' | 'department-rate' | 'efficiency' | 'tip-distribution';
  data?: LaborCostData | BonusData | TipDistributionData | DepartmentRateData | null;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

interface LaborCostData {
  hours: number;
  rate: number;
  department: Department;
  role: 'captain' | 'wingman' | 'co-captain';
  goalPercentage: number;
  actualPercentage: number;
  revenue: number;
}

interface BonusData {
  goalPercentage: number;
  actualPercentage: number;
  revenue: number;
  bonusAmount: number;
  department: Department;
}

interface TipDistributionData {
  totalTips: number;
  teamMembers: number;
  myShare: number;
  jobId: string;
  distribution: Array<{
    name: string;
    role: string;
    share: number;
  }>;
}

interface DepartmentRateData {
  department: Department;
  captainRate: number;
  wingmanRate: number;
  currentRate: number;
  role: 'captain' | 'wingman' | 'co-captain';
  explanation: string;
}

export function CalculationTooltip({ 
  type, 
  data, 
  children, 
  side = 'top' 
}: CalculationTooltipProps) {
  const renderContent = () => {
    switch (type) {
      case 'labor-cost':
        return <LaborCostExplanation data={data as LaborCostData} />;
      case 'bonus':
        return <BonusExplanation data={data as BonusData} />;
      case 'tips':
        return <TipsExplanation />;
      case 'department-rate':
        return <DepartmentRateExplanation data={data as DepartmentRateData} />;
      case 'efficiency':
        return <EfficiencyExplanation data={data as LaborCostData} />;
      case 'tip-distribution':
        return <TipDistributionExplanation data={data as TipDistributionData} />;
      default:
        return <div>No explanation available</div>;
    }
  };

  // Use HoverCard for complex content, Tooltip for simple content
  const isComplexContent = ['labor-cost', 'bonus', 'tip-distribution', 'department-rate'].includes(type);

  if (isComplexContent) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          {children}
        </HoverCardTrigger>
        <HoverCardContent className="w-80" side={side}>
          {renderContent()}
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {renderContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function LaborCostExplanation({ data }: { data: LaborCostData }) {
  if (!data) return null;

  const laborCost = data.hours * data.rate;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4" />
        <h4 className="font-semibold">Labor Cost Calculation</h4>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Hours Worked:</span>
          <span className="font-mono">{data.hours}h</span>
        </div>
        <div className="flex justify-between">
          <span>Hourly Rate ({data.role}):</span>
          <span className="font-mono">{formatCurrency(data.rate)}/hr</span>
        </div>
        <div className="flex justify-between">
          <span>Department:</span>
          <Badge variant="outline" className="capitalize">{data.department}</Badge>
        </div>
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Labor Cost:</span>
          <span className="font-mono">{formatCurrency(laborCost)}</span>
        </div>
        
        {data.revenue > 0 && (
          <>
            <div className="flex justify-between">
              <span>Revenue:</span>
              <span className="font-mono">{formatCurrency(data.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Labor Percentage:</span>
              <span className="font-mono">{data.actualPercentage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Target Goal:</span>
              <span className="font-mono">{data.goalPercentage.toFixed(1)}%</span>
            </div>
          </>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        <Info className="h-3 w-3 inline mr-1" />
        Labor cost = Hours × Rate. Lower percentages indicate higher efficiency.
      </div>
    </div>
  );
}

function BonusExplanation({ data }: { data: BonusData }) {
  if (!data) return null;

  const efficiency = data.goalPercentage - data.actualPercentage;
  const isEligible = efficiency > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4" />
        <h4 className="font-semibold">Labor Efficiency Bonus</h4>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Target Goal:</span>
          <span className="font-mono">{data.goalPercentage.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Actual Percentage:</span>
          <span className="font-mono">{data.actualPercentage.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Efficiency Gain:</span>
          <span className={`font-mono ${isEligible ? 'text-green-600' : 'text-red-600'}`}>
            {isEligible ? '+' : ''}{efficiency.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>Revenue:</span>
          <span className="font-mono">{formatCurrency(data.revenue)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Bonus Amount:</span>
          <span className={`font-mono ${isEligible ? 'text-green-600' : 'text-muted-foreground'}`}>
            {formatCurrency(data.bonusAmount)}
          </span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <Info className="h-3 w-3 inline mr-1" />
        Bonus = (Goal% - Actual%) × Revenue. Only captains earn efficiency bonuses.
      </div>
    </div>
  );
}

function TipsExplanation() {
  return (
    <div className="space-y-2" data-testid="tips-explanation">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4" />
        <h4 className="font-semibold text-sm" data-testid="tips-distribution-heading">Tips Distribution</h4>
      </div>
      <p className="text-xs text-muted-foreground">
        Tips are divided equally among all team members working on a job. 
        This includes captains, co-captains, and wingmen.
      </p>
      <div className="text-xs">
        <strong>Formula:</strong> Total Tips ÷ Team Members = Your Share
      </div>
    </div>
  );
}

function DepartmentRateExplanation({ data }: { data: DepartmentRateData }) {
  if (!data) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <h4 className="font-semibold">Department Rate</h4>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Department:</span>
          <Badge variant="outline" className="capitalize">{data.department}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Captain Rate:</span>
          <span className="font-mono">{formatCurrency(data.captainRate)}/hr</span>
        </div>
        <div className="flex justify-between">
          <span>Wingman Rate:</span>
          <span className="font-mono">{formatCurrency(data.wingmanRate)}/hr</span>
        </div>
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Your Rate ({data.role}):</span>
          <span className="font-mono text-green-600">{formatCurrency(data.currentRate)}/hr</span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <Info className="h-3 w-3 inline mr-1" />
        {data.explanation}
      </div>
    </div>
  );
}

function EfficiencyExplanation({ data }: { data: LaborCostData }) {
  if (!data) return null;

  const isEfficient = data.actualPercentage <= data.goalPercentage;

  return (
    <div className="space-y-2" data-testid="efficiency-explanation">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        <h4 className="font-semibold text-sm" data-testid="labor-efficiency-heading">Labor Efficiency</h4>
      </div>
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span>Current:</span>
          <span className={`font-mono ${isEfficient ? 'text-green-600' : 'text-red-600'}`}>
            {data.actualPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>Target:</span>
          <span className="font-mono">{data.goalPercentage.toFixed(1)}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {isEfficient 
          ? 'Great job! You\'re operating efficiently.' 
          : 'Focus on completing jobs faster to improve efficiency.'
        }
      </p>
    </div>
  );
}

function TipDistributionExplanation({ data }: { data: TipDistributionData }) {
  if (!data) return null;

  return (
    <div className="space-y-3" data-testid="tip-distribution-explanation">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <h4 className="font-semibold" data-testid="tip-distribution-heading">Tip Distribution</h4>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Job ID:</span>
          <Badge variant="outline">{data.jobId}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Total Tips:</span>
          <span className="font-mono">{formatCurrency(data.totalTips)}</span>
        </div>
        <div className="flex justify-between">
          <span>Team Members:</span>
          <span className="font-mono">{data.teamMembers}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Your Share:</span>
          <span className="font-mono text-green-600">{formatCurrency(data.myShare)}</span>
        </div>
      </div>

      {data.distribution && data.distribution.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Team Distribution:</h5>
            <div className="space-y-1">
              {data.distribution.map((member, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span>{member.name} ({member.role})</span>
                  <span className="font-mono">{formatCurrency(member.share)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="text-xs text-muted-foreground">
        <Info className="h-3 w-3 inline mr-1" />
        Tips are split equally among all team members regardless of role.
      </div>
    </div>
  );
}

// Helper component for quick calculation help
export function QuickCalculationHelp({ type = 'tips' }: { type?: 'labor-cost' | 'bonus' | 'tips' | 'department-rate' | 'efficiency' | 'tip-distribution' }) {
  return (
    <CalculationTooltip type={type}>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
        <HelpCircle className="h-3 w-3" />
      </Button>
    </CalculationTooltip>
  );
}