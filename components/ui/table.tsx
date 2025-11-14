'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const tableVariants = cva('w-full caption-bottom text-sm', {
  variants: {
    variant: {
      default: '',
      branded: 'border-separate border-spacing-0',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface TableProps
  extends React.ComponentProps<'table'>,
    VariantProps<typeof tableVariants> {}

function Table({ className, variant, ...props }: TableProps) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn(tableVariants({ variant }), className)}
        {...props}
      />
    </div>
  );
}

const tableHeaderVariants = cva('[&_tr]:border-b', {
  variants: {
    variant: {
      default: '',
      branded: 'bg-hunks-green-50 [&_tr]:border-hunks-green-200',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface TableHeaderProps
  extends React.ComponentProps<'thead'>,
    VariantProps<typeof tableHeaderVariants> {}

function TableHeader({ className, variant, ...props }: TableHeaderProps) {
  return (
    <thead
      data-slot="table-header"
      className={cn(tableHeaderVariants({ variant }), className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  );
}

const tableRowVariants = cva('border-b transition-colors', {
  variants: {
    variant: {
      default: 'hover:bg-muted/50 data-[state=selected]:bg-muted',
      branded:
        'hover:bg-hunks-green-50/50 data-[state=selected]:bg-hunks-green-50 border-hunks-green-100',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface TableRowProps
  extends React.ComponentProps<'tr'>,
    VariantProps<typeof tableRowVariants> {}

function TableRow({ className, variant, ...props }: TableRowProps) {
  return (
    <tr
      data-slot="table-row"
      className={cn(tableRowVariants({ variant }), className)}
      {...props}
    />
  );
}

const tableHeadVariants = cva(
  'h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
  {
    variants: {
      variant: {
        default: 'text-foreground',
        branded: 'text-hunks-green-800 font-semibold',
        sortable:
          'text-hunks-green-800 font-semibold cursor-pointer hover:text-hunks-green-900 select-none',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface TableHeadProps
  extends React.ComponentProps<'th'>,
    VariantProps<typeof tableHeadVariants> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
}

function TableHead({
  className,
  variant,
  sortable,
  sortDirection,
  children,
  ...props
}: TableHeadProps) {
  const headVariant = sortable ? 'sortable' : variant;

  return (
    <th
      data-slot="table-head"
      className={cn(tableHeadVariants({ variant: headVariant }), className)}
      {...props}
    >
      {sortable ? (
        <div className="flex items-center gap-2">
          {children}
          <div className="flex flex-col">
            <div
              className={cn(
                'w-0 h-0 border-l-[3px] border-r-[3px] border-b-[4px] border-transparent',
                sortDirection === 'asc'
                  ? 'border-b-hunks-green-600'
                  : 'border-b-hunks-green-300'
              )}
            />
            <div
              className={cn(
                'w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-transparent mt-[1px]',
                sortDirection === 'desc'
                  ? 'border-t-hunks-green-600'
                  : 'border-t-hunks-green-300'
              )}
            />
          </div>
        </div>
      ) : (
        children
      )}
    </th>
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
