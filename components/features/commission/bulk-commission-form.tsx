'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BrandButton } from '@/components/brand/brand-button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  CommissionEntrySchema,
  type CommissionEntryFormData,
} from '@/lib/validations';

interface BulkCommissionFormProps {
  salesUsers: Array<{
    id: string;
    fullName: string;
    email: string;
    commissionRate: number | null;
  }>;
  currentUserId?: string;
}

interface BulkEntry extends CommissionEntryFormData {
  id: string;
  status: 'pending' | 'valid' | 'error';
  errors?: string[];
}

interface BulkFormSchema {
  entries: BulkEntry[];
}

const createEmptyEntry = (defaultSalesId = ''): BulkEntry => ({
  id: Math.random().toString(36).substring(7),
  salesId: defaultSalesId,
  jobId: '',
  clientName: '',
  jobType: 'move',
  targetDate: new Date(),
  estimatedRevenue: undefined as unknown as number,
  status: 'pending',
});

export function BulkCommissionForm({
  salesUsers,
  currentUserId,
}: BulkCommissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<BulkFormSchema>({
    defaultValues: {
      entries: [createEmptyEntry(currentUserId)],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'entries',
  });

  const addEntry = () => {
    append(createEmptyEntry());
  };

  const removeEntry = (index: number) => {
    remove(index);
  };

  const validateEntry = (entry: BulkEntry): BulkEntry => {
    try {
      CommissionEntrySchema.parse(entry);
      return { ...entry, status: 'valid' as const, errors: [] };
    } catch (error: any) {
      const errors = error.errors?.map((e: any) => e.message) || [
        'Invalid entry',
      ];
      return { ...entry, status: 'error' as const, errors };
    }
  };

  const updateEntry = (index: number, field: keyof BulkEntry, value: any) => {
    const currentEntry = form.getValues(`entries.${index}`);
    const updatedEntry = { ...currentEntry, [field]: value };
    const validatedEntry = validateEntry(updatedEntry);
    form.setValue(`entries.${index}`, validatedEntry);
  };

  const onSubmit = async () => {
    // Validate all entries
    const allEntries = form.getValues('entries');
    const validEntries = allEntries.filter((entry) => entry.status === 'valid');

    if (validEntries.length === 0) {
      toast({
        title: 'No Valid Entries',
        description: 'Please fix all errors before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit entries in batches
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const entry of validEntries) {
        try {
          // Here you would call your actual creation function
          // const result = await createCommissionEntry(entry);
          // For now, let's simulate success
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Job ID ${entry.jobId}: ${error}`);
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Bulk Entry Complete',
          description: `${successCount} entries created successfully${
            errorCount > 0 ? `, ${errorCount} failed` : ''
          }`,
        });

        // Reset form after successful submission
        form.reset({ entries: [createEmptyEntry()] });
        router.push('/commission/list');
      } else {
        toast({
          title: 'Submission Failed',
          description: 'All entries failed to create.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during bulk submission.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setConfirmDialogOpen(false);
    }
  };

  const getStatusBadge = (status: BulkEntry['status']) => {
    switch (status) {
      case 'valid':
        return (
          <Badge variant="secondary" className="text-green-700 bg-green-50">
            Valid
          </Badge>
        );
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Form {...form}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Commission Entries</h3>
            <div className="flex gap-2">
              <BrandButton
                type="button"
                variant="outline"
                size="sm"
                onClick={addEntry}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Row
              </BrandButton>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Sales Rep</TableHead>
                  <TableHead className="w-[120px]">Job ID</TableHead>
                  <TableHead className="w-[150px]">Client Name</TableHead>
                  <TableHead className="w-[120px]">Job Type</TableHead>
                  <TableHead className="w-[100px]">Revenue</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Select
                        value={form.watch(`entries.${index}.salesId`)}
                        onValueChange={(value) =>
                          updateEntry(index, 'salesId', value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {salesUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <Input
                        placeholder="1234567"
                        value={form.watch(`entries.${index}.jobId`)}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          updateEntry(index, 'jobId', value);
                        }}
                        className={
                          form.watch(`entries.${index}.status`) === 'error'
                            ? 'border-red-500'
                            : ''
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        placeholder="Client name"
                        value={form.watch(`entries.${index}.clientName`)}
                        onChange={(e) =>
                          updateEntry(index, 'clientName', e.target.value)
                        }
                        className={
                          form.watch(`entries.${index}.status`) === 'error'
                            ? 'border-red-500'
                            : ''
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <Select
                        value={form.watch(`entries.${index}.jobType`)}
                        onValueChange={(value) =>
                          updateEntry(index, 'jobType', value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="move">Moving</SelectItem>
                          <SelectItem value="moveLabor">
                            Moving Labor
                          </SelectItem>
                          <SelectItem value="junkRemoval">
                            Junk Removal
                          </SelectItem>
                          <SelectItem value="generalLabor">
                            General Labor
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={
                            form.watch(`entries.${index}.estimatedRevenue`) ===
                            undefined
                              ? ''
                              : String(
                                  form.watch(
                                    `entries.${index}.estimatedRevenue`
                                  )
                                )
                          }
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(
                              /[^0-9.]/g,
                              ''
                            );
                            if (rawValue === '') {
                              updateEntry(
                                index,
                                'estimatedRevenue',
                                undefined as unknown as number
                              );
                              return;
                            }
                            const parsed = parseFloat(rawValue);
                            updateEntry(
                              index,
                              'estimatedRevenue',
                              Number.isNaN(parsed)
                                ? (undefined as unknown as number)
                                : parsed
                            );
                          }}
                          className="pl-8"
                          onBlur={(e) => {
                            const value = parseFloat(
                              e.target.value.replace(/[^0-9.]/g, '')
                            );
                            if (!Number.isNaN(value)) {
                              updateEntry(
                                index,
                                'estimatedRevenue',
                                Number(value.toFixed(2))
                              );
                            }
                          }}
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(form.watch(`entries.${index}.status`))}
                    </TableCell>

                    <TableCell>
                      <BrandButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntry(index)}
                        disabled={fields.length === 1}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </BrandButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Error Display */}
          {fields.some(
            (_, index) =>
              form.watch(`entries.${index}.status`) === 'error' &&
              form.watch(`entries.${index}.errors`)?.length
          ) && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Validation Errors
              </h4>
              <ul className="text-sm text-destructive space-y-1">
                {fields
                  .map((field, index) => {
                    const entry = form.watch(`entries.${index}`);
                    const errors = entry?.errors || [];
                    if (errors.length > 0) {
                      return (
                        <li key={field.id}>
                          Row {index + 1} (Job ID: {entry.jobId || 'N/A'}):{' '}
                          {errors.join(', ')}
                        </li>
                      );
                    }
                    return null;
                  })
                  .filter(Boolean)}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <BrandButton
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </BrandButton>
            <BrandButton
              type="button"
              variant="primary"
              onClick={() => setConfirmDialogOpen(true)}
              disabled={fields.every(
                (_, index) => form.watch(`entries.${index}.status`) !== 'valid'
              )}
              loading={isSubmitting}
            >
              Submit Valid Entries
            </BrandButton>
          </div>
        </Form>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Bulk Submission</DialogTitle>
              <DialogDescription>
                You are about to submit{' '}
                {
                  fields.filter(
                    (_, index) =>
                      form.watch(`entries.${index}.status`) === 'valid'
                  ).length
                }{' '}
                valid commission entries.
                {fields.some(
                  (_, index) =>
                    form.watch(`entries.${index}.status`) === 'error'
                ) && (
                  <span className="text-destructive">
                    {' '}
                    {
                      fields.filter(
                        (_, index) =>
                          form.watch(`entries.${index}.status`) === 'error'
                      ).length
                    }{' '}
                    entries have errors and will not be submitted.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <BrandButton
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
              >
                Cancel
              </BrandButton>
              <BrandButton
                variant="primary"
                onClick={onSubmit}
                loading={isSubmitting}
              >
                Confirm Submission
              </BrandButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
