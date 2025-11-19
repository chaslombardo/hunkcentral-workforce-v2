'use client';
import * as React from 'react';
import { format } from 'date-fns';
import {
  IconCalendar,
  IconChevronDown,
  IconFilter,
  IconX,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
// Filter types
export interface FilterValue {
  key: string;
  value: unknown;
  label?: string;
}
export interface DateRangeValue {
  from?: Date;
  to?: Date;
}
export interface NumberRangeValue {
  min?: number;
  max?: number;
}
export interface FilterOption {
  value: string;
  label: string;
  color?: string;
  count?: number;
}
export interface FilterPreset {
  label: string;
  value: unknown;
}
export interface BaseFilterConfig {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}
export interface SelectFilterConfig extends BaseFilterConfig {
  type: 'select';
  options: FilterOption[];
  multiple?: false;
}
export interface MultiSelectFilterConfig extends BaseFilterConfig {
  type: 'multiSelect';
  options: FilterOption[];
  multiple: true;
}
export interface DateRangeFilterConfig extends BaseFilterConfig {
  type: 'dateRange';
  presets?: FilterPreset[];
}
export interface NumberRangeFilterConfig extends BaseFilterConfig {
  type: 'numberRange';
  presets?: FilterPreset[];
  min?: number;
  max?: number;
  step?: number;
}
export interface TextFilterConfig extends BaseFilterConfig {
  type: 'text';
  multiline?: boolean;
}
export interface BooleanFilterConfig extends BaseFilterConfig {
  type: 'boolean';
  trueLabel?: string;
  falseLabel?: string;
}
export type FilterConfig =
  | SelectFilterConfig
  | MultiSelectFilterConfig
  | DateRangeFilterConfig
  | NumberRangeFilterConfig
  | TextFilterConfig
  | BooleanFilterConfig;
export interface FilterPanelProps {
  filters: FilterConfig[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onClear: () => void;
  className?: string;
  branded?: boolean;
}

const isDatePresetValue = (
  value: unknown
): value is { preset: string; from?: Date; to?: Date } =>
  typeof value === 'object' &&
  value !== null &&
  'preset' in value &&
  typeof (value as { preset?: unknown }).preset === 'string';

const isNumberPresetValue = (value: unknown): value is NumberRangeValue =>
  typeof value === 'object' &&
  value !== null &&
  ('min' in value || 'max' in value);
// Standard filter presets
export const STANDARD_DATE_PRESETS: FilterPreset[] = [
  { label: 'Today', value: { preset: 'today' } },
  { label: 'Yesterday', value: { preset: 'yesterday' } },
  { label: 'Last 7 days', value: { preset: 'last7days' } },
  { label: 'Last 30 days', value: { preset: 'last30days' } },
  { label: 'This month', value: { preset: 'thisMonth' } },
  { label: 'Last month', value: { preset: 'lastMonth' } },
  { label: 'Current pay period', value: { preset: 'currentPayPeriod' } },
  { label: 'Previous pay period', value: { preset: 'previousPayPeriod' } },
  { label: 'Custom range', value: { preset: 'custom' } },
];
export const STANDARD_STATUS_OPTIONS: FilterOption[] = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'blue' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'draft', label: 'Draft', color: 'gray' },
];
export const STANDARD_ROLE_OPTIONS: FilterOption[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'captain', label: 'Captain' },
  { value: 'wingman', label: 'Wingman' },
  { value: 'sales', label: 'Sales Consultant' },
];
export const STANDARD_AMOUNT_PRESETS: FilterPreset[] = [
  { label: 'Under $100', value: { max: 100 } },
  { label: '$100 - $500', value: { min: 100, max: 500 } },
  { label: '$500 - $1,000', value: { min: 500, max: 1000 } },
  { label: '$1,000 - $5,000', value: { min: 1000, max: 5000 } },
  { label: 'Over $5,000', value: { min: 5000 } },
];
// Individual filter components
function SelectFilter({
  config,
  value,
  onChange,
}: {
  config: SelectFilterConfig | MultiSelectFilterConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (config.type === 'multiSelect') {
    const selectedValues = Array.isArray(value) ? value : [];
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedValues.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedValues.slice(0, 2).map((val) => {
                  const option = config.options.find(
                    (opt) => opt.value === val
                  );
                  return (
                    <Badge key={val} variant="secondary" className="text-xs">
                      {option?.label || val}
                    </Badge>
                  );
                })}
                {selectedValues.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedValues.length - 2} more
                  </Badge>
                )}
              </div>
            ) : (
              config.placeholder || `Select ${config.label.toLowerCase()}`
            )}
            <IconChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <div className="p-2 space-y-2">
            {config.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${config.key}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option.value]);
                    } else {
                      onChange(
                        selectedValues.filter((v) => v !== option.value)
                      );
                    }
                  }}
                />
                <Label
                  htmlFor={`${config.key}-${option.value}`}
                  className="flex-1 text-sm font-normal cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  const currentValue = typeof value === 'string' ? value : '';

  return (
    <Select value={currentValue} onValueChange={(val) => onChange(val)}>
      <SelectTrigger>
        <SelectValue
          placeholder={
            config.placeholder || `Select ${config.label.toLowerCase()}`
          }
        />
      </SelectTrigger>
      <SelectContent>
        {config.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center justify-between w-full">
              <span>{option.label}</span>
              {option.count !== undefined && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {option.count}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function DateRangeFilter({
  config,
  value,
  onChange,
}: {
  config: DateRangeFilterConfig;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<string>('');
  const handlePresetSelect = (preset: FilterPreset) => {
    if (!isDatePresetValue(preset.value)) {
      return;
    }
    if (preset.value.preset === 'custom') {
      setSelectedPreset('custom');
      return;
    }
    // Handle preset date ranges
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined;
    switch (preset.value.preset) {
      case 'today':
        from = to = today;
        break;
      case 'yesterday':
        from = to = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last7days':
        from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        to = today;
        break;
      case 'last30days':
        from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        to = today;
        break;
      case 'thisMonth':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = today;
        break;
      case 'lastMonth':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        from = preset.value.from;
        to = preset.value.to;
    }
    onChange({ from, to });
    setSelectedPreset(preset.value.preset);
    setIsOpen(false);
  };
  const formatDateRange = (range: DateRangeValue) => {
    if (!range.from) return config.placeholder || 'Select date range';
    if (!range.to) return format(range.from, 'MMM dd, yyyy');
    if (range.from.getTime() === range.to.getTime()) {
      return format(range.from, 'MMM dd, yyyy');
    }
    return `${format(range.from, 'MMM dd')} - ${format(range.to, 'MMM dd, yyyy')}`;
  };
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>{formatDateRange(value)}</span>
          <IconCalendar className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {config.presets && (
            <div className="border-r p-3">
              <div className="space-y-1">
                {config.presets.map((preset) => {
                  const value = isDatePresetValue(preset.value)
                    ? preset.value
                    : null;
                  return (
                    <Button
                      key={preset.label}
                      variant={
                        selectedPreset === value?.preset ? 'default' : 'ghost'
                      }
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handlePresetSelect(preset)}
                      disabled={!value}
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={{ from: value.from, to: value.to }}
              onSelect={(range) => {
                onChange({ from: range?.from, to: range?.to });
                if (range?.from && range?.to) {
                  setIsOpen(false);
                }
              }}
              numberOfMonths={2}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
function NumberRangeFilter({
  config,
  value,
  onChange,
}: {
  config: NumberRangeFilterConfig;
  value: NumberRangeValue;
  onChange: (value: NumberRangeValue) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const handlePresetSelect = (preset: FilterPreset) => {
    if (!isNumberPresetValue(preset.value)) {
      return;
    }
    onChange(preset.value);
    setIsOpen(false);
  };
  const formatNumberRange = (range: NumberRangeValue) => {
    if (range.min === undefined && range.max === undefined) {
      return config.placeholder || 'Select range';
    }
    if (range.min !== undefined && range.max !== undefined) {
      return `$${range.min.toLocaleString()} - $${range.max.toLocaleString()}`;
    }
    if (range.min !== undefined) {
      return `Over $${range.min.toLocaleString()}`;
    }
    if (range.max !== undefined) {
      return `Under $${range.max.toLocaleString()}`;
    }
    return config.placeholder || 'Select range';
  };
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>{formatNumberRange(value)}</span>
          <IconChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          {config.presets && (
            <>
              <div>
                <Label className="text-sm font-medium">Quick ranges</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {config.presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => handlePresetSelect(preset)}
                      disabled={!isNumberPresetValue(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}
          <div>
            <Label className="text-sm font-medium">Custom range</Label>
            <div className="mt-2 flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={value.min || ''}
                onChange={(e) =>
                  onChange({
                    ...value,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                min={config.min}
                max={config.max}
                step={config.step}
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={value.max || ''}
                onChange={(e) =>
                  onChange({
                    ...value,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                min={config.min}
                max={config.max}
                step={config.step}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
function TextFilter({
  config,
  value,
  onChange,
}: {
  config: TextFilterConfig;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      type="text"
      placeholder={config.placeholder || `Enter ${config.label.toLowerCase()}`}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
function BooleanFilter({
  config,
  value,
  onChange,
}: {
  config: BooleanFilterConfig;
  value?: boolean;
  onChange: (value: boolean) => void;
}) {
  const currentValue = typeof value === 'boolean' ? value.toString() : '';
  return (
    <Select
      value={currentValue}
      onValueChange={(val) => onChange(val === 'true')}
    >
      <SelectTrigger>
        <SelectValue
          placeholder={
            config.placeholder || `Select ${config.label.toLowerCase()}`
          }
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">{config.trueLabel || 'Yes'}</SelectItem>
        <SelectItem value="false">{config.falseLabel || 'No'}</SelectItem>
      </SelectContent>
    </Select>
  );
}
export function FilterPanel({
  filters,
  values,
  onChange,
  onClear,
  className,
  branded = true,
}: FilterPanelProps) {
  const activeFiltersCount = Object.keys(values).filter((key) => {
    const value = values[key];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(
        (v) => v !== undefined && v !== null && v !== ''
      );
    }
    return value !== undefined && value !== null && value !== '';
  }).length;
  const renderFilter = (config: FilterConfig) => {
    const value = values[config.key];
    switch (config.type) {
      case 'select':
      case 'multiSelect':
        return (
          <SelectFilter
            config={config}
            value={value}
            onChange={(newValue) => onChange(config.key, newValue)}
          />
        );
      case 'dateRange':
        return (
          <DateRangeFilter
            config={config}
            value={value || {}}
            onChange={(newValue) => onChange(config.key, newValue)}
          />
        );
      case 'numberRange':
        return (
          <NumberRangeFilter
            config={config}
            value={value || {}}
            onChange={(newValue) => onChange(config.key, newValue)}
          />
        );
      case 'text':
        return (
          <TextFilter
            config={config}
            value={typeof value === 'string' ? value : undefined}
            onChange={(newValue) => onChange(config.key, newValue)}
          />
        );
      case 'boolean':
        return (
          <BooleanFilter
            config={config}
            value={typeof value === 'boolean' ? value : undefined}
            onChange={(newValue) => onChange(config.key, newValue)}
          />
        );
      default:
        return null;
    }
  };
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <IconFilter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                'h-5 px-1.5 text-xs',
                branded && 'bg-hunks-green-100 text-hunks-green-800'
              )}
            >
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <IconX className="mr-2 h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filters.map((config) => (
          <div key={config.key} className="space-y-2">
            <Label className="text-sm font-medium">
              {config.label}
              {config.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            {renderFilter(config)}
          </div>
        ))}
      </div>
    </div>
  );
}
