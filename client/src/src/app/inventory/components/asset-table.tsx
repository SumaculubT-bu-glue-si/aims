"use client"

import React, { memo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { Laptop, Monitor, Smartphone, KeyRound } from "lucide-react"
import { FrontendAsset } from '@/lib/types/index'

interface TableColumn {
  label: string;
  schemaKey: keyof FrontendAsset;
  sortable: boolean;
  minWidth: string;
}

interface AssetTableProps {
  assets: FrontendAsset[];
  columns: TableColumn[];
  pagination: {
    currentPage: number;
    totalCount: number;
    itemsPerPage: number;
  };
  onPageChange: (page: number) => void;
  onRowClick: (asset: FrontendAsset) => void;
  onSort: (column: keyof FrontendAsset) => void;
  sortConfig: { key: keyof FrontendAsset; direction: 'asc' | 'desc' } | null;
  emptyStateIcon: React.ComponentType<{ className?: string }>;
  emptyStateTitle: string;
  emptyStateDescription: string;
  getStatusBadgeVariant: (status: string) => "default" | "secondary" | "destructive" | "outline";
  getStatusText: (status: string) => string;
  getEmployeeName: (asset: FrontendAsset) => string;
}

export const AssetTable = memo(function AssetTable({
  assets,
  columns,
  pagination,
  onPageChange,
  onRowClick,
  onSort,
  sortConfig,
  emptyStateIcon: EmptyStateIcon,
  emptyStateTitle,
  emptyStateDescription,
  getStatusBadgeVariant,
  getStatusText,
  getEmployeeName,
}: AssetTableProps) {
  const SortableHeader = ({ columnKey, children }: { columnKey: keyof FrontendAsset; children: React.ReactNode }) => (
    <TableHead 
      className="h-auto px-2 py-1 whitespace-nowrap text-xs cursor-pointer hover:bg-muted/50"
      onClick={() => onSort(columnKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortConfig?.key === columnKey && (
          <span className="text-xs">
            {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="relative flex-grow flex flex-col">
      <div className="mt-2 h-[450px] w-full overflow-auto border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-20">
            <TableRow>
              {columns.map((column) => {
                const isSortable = column.sortable;
                return isSortable ? (
                  <SortableHeader key={column.schemaKey} columnKey={column.schemaKey}>
                    <span className="text-xs" style={{ minWidth: column.minWidth }}>
                      {column.label}
                    </span>
                  </SortableHeader>
                ) : (
                  <TableHead key={column.schemaKey} className="h-auto px-2 py-1 whitespace-nowrap text-xs" style={{ minWidth: column.minWidth }}>
                    {column.label}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody className="min-h-[400px]">
            {assets.length > 0 ? (
              assets.map((asset) => (
                <TableRow key={asset.id} onClick={() => onRowClick(asset)} className="cursor-pointer">
                  {columns.map((column) => {
                    const value = asset[column.schemaKey];
                    const displayValue = value || '-';

                    // Special handling for status field (show badge)
                    if (column.schemaKey === 'status') {
                      return (
                        <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(String(displayValue))} className="text-xs">
                            {getStatusText(String(displayValue))}
                          </Badge>
                        </TableCell>
                      );
                    }

                    // Special handling for ID field (monospace font)
                    if (column.schemaKey === 'assetId') {
                      return (
                        <TableCell key={column.schemaKey} className="font-mono text-xs px-2 py-1 whitespace-nowrap">
                          {displayValue}
                        </TableCell>
                      );
                    }

                    // Special handling for userId field (show employee name)
                    if (column.schemaKey === 'userId') {
                      const employeeName = getEmployeeName(asset);
                      return (
                        <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                          {employeeName}
                        </TableCell>
                      );
                    }

                    // Special handling for notes field (truncate with title)
                    if (column.schemaKey === 'notes') {
                      return (
                        <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap max-w-xs truncate" title={String(displayValue)}>
                          {displayValue}
                        </TableCell>
                      );
                    }

                    // Default cell rendering
                    return (
                      <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                        {displayValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center h-full">
                    <EmptyStateIcon className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">{emptyStateTitle}</p>
                    <p className="text-sm">{emptyStateDescription}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="h-16 flex-shrink-0 border-t bg-background px-4 py-2">
        <Pagination
          currentPage={pagination.currentPage}
          totalCount={pagination.totalCount}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
})