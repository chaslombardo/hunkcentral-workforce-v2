'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  ChevronRight,
  DollarSign,
  Info,
  Shield,
  Star,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Department, User } from '@/types';

interface RateInformationPanelProps {
  user: User;
  departmentHours: Record<Department, number>;
}

const DEPARTMENT_INFO: Record<Department, { 
  label: string; 
  description: string; 
  hasRoles: boolean;
  icon: React.ReactNode;
}> = {
  junk: { 
    label: 'Junk Removal', 
    description: 'Junk hauling and removal services',
    hasRoles: true,
    icon: <div className="w-2 h-2 rounded-full bg-[#026937]" />
  },
  move: { 
    label: 'Moving Services', 
    description: 'Residential and commercial moving',
    hasRoles: true,
    icon: <div className="w-2 h-2 rounded-full bg-[#ea7200]" />
  },
  zigma: { 
    label: 'Zigma Operations', 
    description: 'Specialized zigma services',
    hasRoles: false,
    icon: <div className="w-2 h-2 rounded-full bg-blue-500" />
  },
  training: { 
    label: 'Training', 
    description: 'Employee training and development',
    hasRoles: false,
    icon: <div className="w-2 h-2 rounded-full bg-purple-500" />
  },
  estimating: { 
    label: 'Estimating', 
    description: 'Job estimation and quoting',
    hasRoles: false,
    icon: <div className="w-2 h-2 rounded-full bg-green-500" />
  },
  warehouse: { 
    label: 'Warehouse', 
    description: 'Warehouse operations and logistics',
    hasRoles: false,
    icon: <div className="w-2 h-2 rounded-full bg-yellow-500" />
  },
  admin: { 
    label: 'Administrative', 
    description: 'Administrative and office work',
    hasRoles: false,
    icon: <div className="w-2 h-2 rounded-full bg-gray-500" />
  },
};

interface DepartmentRateInfo {
  department: Department;
  captainRate?: number;
  wingmanRate?: number;
  singleRate?: number;
  currentlyUsed: 'captain' | 'wingman' | 'single';
  hoursWorked: number;
}

function getDepartmentRateInfo(user: User, departmentHours: Record<Department, number>): DepartmentRateInfo[] {
  const departments: Department[] = ['junk', 'move', 'zigma', 'training', 'estimating', 'warehouse', 'admin'];
  
  return departments.map(department => {
    const hoursWorked = departmentHours[department] || 0;
    
    switch (department) {
      case 'junk':
        return {
          department,
          captainRate: user.rateJunkCaptain,
          wingmanRate: user.rateJunkWingman,
          currentlyUsed: user.roles.includes('captain') ? 'captain' : 'wingman',
          hoursWorked,
        };
      case 'move':
        return {
          department,
          captainRate: user.rateMoveCaptain,
          wingmanRate: user.rateMoveWingman,
          currentlyUsed: user.roles.includes('captain') ? 'captain' : 'wingman',
          hoursWorked,
        };
      case 'zigma':
        return {
          department,
          singleRate: user.rateZigma,
          currentlyUsed: 'single',
          hoursWorked,
        };
      case 'training':
        return {
          department,
          singleRate: user.rateTraining,
          currentlyUsed: 'single',
          hoursWorked,
        };
      case 'estimating':
        return {
          department,
          singleRate: user.rateEstimating,
          currentlyUsed: 'single',
          hoursWorked,
        };
      case 'warehouse':
        return {
          department,
          singleRate: user.rateWarehouse,
          currentlyUsed: 'single',
          hoursWorked,
        };
      case 'admin':
        return {
          department,
          singleRate: user.rateAdmin,
          currentlyUsed: 'single',
          hoursWorked,
        };
      default:
        return {
          department,
          singleRate: 0,
          currentlyUsed: 'single',
          hoursWorked,
        };
    }
  });
}

function MobileRateCard({ rateInfo }: { rateInfo: DepartmentRateInfo }) {
  const departmentInfo = DEPARTMENT_INFO[rateInfo.department];
  const hasWorkedHours = rateInfo.hoursWorked > 0;

  return (
    <Card className={`@container/card min-h-[120px] touch-manipulation ${hasWorkedHours ? 'bg-muted/30 border-[#026937]/20' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {departmentInfo.icon}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-base @[250px]/card:text-lg truncate">{departmentInfo.label}</div>
              <div className="text-sm text-muted-foreground truncate">
                {departmentInfo.description}
              </div>
            </div>
          </div>
          {hasWorkedHours && (
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {rateInfo.hoursWorked}h
            </Badge>
          )}
        </div>
        
        <div className="space-y-3">
          {departmentInfo.hasRoles ? (
            <>
              <div className="flex justify-between items-center p-2 bg-background rounded border">
                <span className="text-sm text-muted-foreground">Captain Rate:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">
                    {rateInfo.captainRate ? formatCurrency(rateInfo.captainRate) : 'N/A'}
                  </span>
                  {rateInfo.currentlyUsed === 'captain' && hasWorkedHours && (
                    <Star className="h-4 w-4 text-[#026937]" />
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center p-2 bg-background rounded border">
                <span className="text-sm text-muted-foreground">Wingman Rate:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">
                    {rateInfo.wingmanRate ? formatCurrency(rateInfo.wingmanRate) : 'N/A'}
                  </span>
                  {rateInfo.currentlyUsed === 'wingman' && hasWorkedHours && (
                    <Star className="h-4 w-4 text-[#026937]" />
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center p-2 bg-background rounded border">
              <span className="text-sm text-muted-foreground">Standard Rate:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">
                  {rateInfo.singleRate ? formatCurrency(rateInfo.singleRate) : 'N/A'}
                </span>
                {hasWorkedHours && (
                  <Star className="h-4 w-4 text-[#026937]" />
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RateRow({ rateInfo }: { rateInfo: DepartmentRateInfo }) {
  const departmentInfo = DEPARTMENT_INFO[rateInfo.department];
  const hasWorkedHours = rateInfo.hoursWorked > 0;

  return (
    <TableRow className={hasWorkedHours ? 'bg-muted/30' : ''}>
      <TableCell>
        <div className="flex items-center gap-2">
          {departmentInfo.icon}
          <div>
            <div className="font-medium">{departmentInfo.label}</div>
            <div className="text-xs text-muted-foreground">
              {departmentInfo.description}
            </div>
          </div>
          {hasWorkedHours && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {rateInfo.hoursWorked}h worked
            </Badge>
          )}
        </div>
      </TableCell>
      
      {departmentInfo.hasRoles ? (
        <>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <span className="font-mono">
                {rateInfo.captainRate ? formatCurrency(rateInfo.captainRate) : 'N/A'}
              </span>
              {rateInfo.currentlyUsed === 'captain' && hasWorkedHours && (
                <Star className="h-3 w-3 text-[#026937]" />
              )}
            </div>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <span className="font-mono">
                {rateInfo.wingmanRate ? formatCurrency(rateInfo.wingmanRate) : 'N/A'}
              </span>
              {rateInfo.currentlyUsed === 'wingman' && hasWorkedHours && (
                <Star className="h-3 w-3 text-[#026937]" />
              )}
            </div>
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="text-center text-muted-foreground">—</TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <span className="font-mono">
                {rateInfo.singleRate ? formatCurrency(rateInfo.singleRate) : 'N/A'}
              </span>
              {hasWorkedHours && (
                <Star className="h-3 w-3 text-[#026937]" />
              )}
            </div>
          </TableCell>
        </>
      )}
    </TableRow>
  );
}

export function RateInformationPanel({ user, departmentHours }: RateInformationPanelProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const rateInfos = getDepartmentRateInfo(user, departmentHours);
  
  // Separate worked and unworked departments
  const workedDepartments = rateInfos.filter(info => info.hoursWorked > 0);
  const unworkedDepartments = rateInfos.filter(info => info.hoursWorked === 0);

  // Calculate summary statistics
  const totalDepartments = rateInfos.length;
  const activeDepartments = workedDepartments.length;
  const averageRate = workedDepartments.length > 0 
    ? workedDepartments.reduce((sum, info) => {
        const rate = info.singleRate || 
          (info.currentlyUsed === 'captain' ? info.captainRate : info.wingmanRate) || 0;
        return sum + rate;
      }, 0) / workedDepartments.length
    : 0;

  return (
    <TooltipProvider>
      <div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Rate Information
                </CardTitle>
                <CardDescription>
                  Your hourly rates across all departments
                </CardDescription>
              </div>
              
              {isMobile ? (
                <Button variant="ghost" className="min-h-[44px] min-w-[44px] touch-manipulation">
                  <Info className="h-4 w-4" />
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <p className="text-sm">
                        Rates marked with <Star className="h-3 w-3 inline text-[#026937]" /> were used 
                        for departments where you worked hours this period.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`font-semibold ${isMobile ? 'text-xl' : 'text-lg'}`}>
                {activeDepartments}
              </div>
              <div className="text-xs text-muted-foreground">Active Depts</div>
            </div>
            <div className="text-center">
              <div className={`font-semibold ${isMobile ? 'text-xl' : 'text-lg'}`}>
                {formatCurrency(averageRate)}
              </div>
              <div className="text-xs text-muted-foreground">Avg Rate</div>
            </div>
            <div className="text-center">
              <div className={`font-semibold ${isMobile ? 'text-xl' : 'text-lg'}`}>
                {totalDepartments}
              </div>
              <div className="text-xs text-muted-foreground">Total Depts</div>
            </div>
          </div>

          <Separator />

          {/* Rate Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Department Rates</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="h-3 w-3 text-[#026937]" />
                <span>Currently used rate</span>
              </div>
            </div>
            
            {isMobile ? (
              // Mobile: Card-based layout
              <div className="space-y-3">
                {/* Show worked departments first */}
                {workedDepartments.map((rateInfo) => (
                  <MobileRateCard key={rateInfo.department} rateInfo={rateInfo} />
                ))}
                
                {/* Collapsible section for unworked departments */}
                {unworkedDepartments.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between p-4 h-auto min-h-[44px] touch-manipulation"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          <span className="font-medium">{`Show ${unworkedDepartments.length} unused departments`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{unworkedDepartments.length.toString()}</Badge>
                          <span className="text-sm text-muted-foreground">Departments where you didn&apos;t work this period</span>
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="space-y-3">
                        {unworkedDepartments.map((rateInfo) => (
                          <MobileRateCard key={rateInfo.department} rateInfo={rateInfo} />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            ) : (
              // Desktop: Table layout
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Captain Rate</TableHead>
                      <TableHead className="text-right">Wingman/Standard Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Show worked departments first */}
                    {workedDepartments.map((rateInfo) => (
                      <RateRow key={rateInfo.department} rateInfo={rateInfo} />
                    ))}
                    
                    {/* Collapsible section for unworked departments */}
                    {unworkedDepartments.length > 0 && (
                      <>
                        <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                          <TableCell colSpan={3}>
                            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <span>
                                Show {unworkedDepartments.length} unused departments
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && unworkedDepartments.map((rateInfo) => (
                          <RateRow key={rateInfo.department} rateInfo={rateInfo} />
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Role Information */}
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 text-[#026937]" />
              <div className="text-sm">
                <div className="font-medium mb-1">Your Roles: {user.roles.join(', ')}</div>
                <p className="text-muted-foreground text-xs">
                  {user.roles.includes('captain') 
                    ? 'As a captain, you earn captain rates when leading jobs and wingman rates when assisting.'
                    : 'You earn wingman rates for junk and move departments, and standard rates for other departments.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}