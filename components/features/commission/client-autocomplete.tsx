'use client';

import { useState, useEffect } from 'react';
import { Check, User, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface ClientSuggestion {
  name: string;
  jobCount: number;
  lastJobDate: Date;
  avgRevenue: number;
  jobTypes: string[];
}

interface ClientAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// TODO: Replace with real API call to fetch client suggestions
// This should fetch from commission entries and daily logs to get recent client names
const fetchClientSuggestions = async (): Promise<ClientSuggestion[]> => {
  // For now, return empty array until API is implemented
  return [];
};

export function ClientAutocomplete({
  value,
  onValueChange,
  placeholder = 'Enter client name',
  disabled = false,
}: ClientAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter((suggestion) =>
    suggestion.name.toLowerCase().includes(value.toLowerCase())
  );

  // Load suggestions when component mounts
  useEffect(() => {
    setLoading(true);
    fetchClientSuggestions()
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const shouldShowDropdown = open && !disabled;

  return (
    <Popover open={shouldShowDropdown} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div>
          <Input
            value={value}
            onChange={(event) => {
              onValueChange(event.target.value);
              if (!open) {
                setOpen(true);
              }
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="h-12 transition-all duration-200 hover:border-[#026937]/50 focus:border-[#026937] focus:ring-2 focus:ring-[#026937]/20"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        align="start"
        sideOffset={4}
        collisionPadding={8}
      >
        <Command>
          <CommandList className="max-h-64">
            {loading ? (
              <CommandEmpty>Loading suggestions...</CommandEmpty>
            ) : filteredSuggestions.length === 0 ? (
              <CommandEmpty>
                <div className="text-center py-4">
                  <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No existing clients found.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Keep typing to add a new client.
                  </p>
                </div>
              </CommandEmpty>
            ) : (
              <CommandGroup heading="Recent Clients">
                {filteredSuggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.name}
                    value={suggestion.name}
                    onSelect={(currentValue: string) => {
                      onValueChange(currentValue);
                      setOpen(false);
                    }}
                    className="p-4 cursor-pointer transition-colors duration-150 hover:bg-[#026937]/5"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {suggestion.jobCount > 3 ? (
                            <Building className="h-5 w-5 text-[#026937]" />
                          ) : (
                            <User className="h-5 w-5 text-[#026937]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {suggestion.name}
                            </span>
                            <Check
                              className={cn(
                                'h-4 w-4 text-[#026937]',
                                value === suggestion.name
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.jobCount} jobs
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Last: {formatDate(suggestion.lastJobDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#026937] font-medium">
                              Avg: {formatCurrency(suggestion.avgRevenue)}
                            </span>
                            <div className="flex gap-1">
                              {suggestion.jobTypes.map((type) => (
                                <Badge
                                  key={type}
                                  variant="secondary"
                                  className="text-xs px-1.5 py-0.5"
                                >
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
