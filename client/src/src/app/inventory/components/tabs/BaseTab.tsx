import React, { memo } from 'react';
import { FrontendAsset } from '@/lib/types';
import { AssetTable } from '../asset-table';
import { TableColumn } from '../../utils/table-helpers';

interface BaseTabProps {
  assets: FrontendAsset[];
  columns: TableColumn[];
  pagination: { currentPage: number; itemsPerPage: number; totalCount: number };
  sortConfig: { key: keyof FrontendAsset; direction: 'asc' | 'desc' } | null;
  onPageChange: (page: number) => void;
  onRowClick: (asset: FrontendAsset) => void;
  onSort: (column: keyof FrontendAsset) => void;
  getStatusBadgeVariant: (status: string) => "default" | "secondary" | "destructive" | "outline";
  getStatusText: (status: string) => string;
  getEmployeeName: (asset: FrontendAsset) => string;
  emptyStateIcon: React.ComponentType;
  emptyStateTitle: string;
  emptyStateDescription: string;
}

export const BaseTab = memo(function BaseTab({
  assets,
  columns,
  pagination,
  sortConfig,
  onPageChange,
  onRowClick,
  onSort,
  getStatusBadgeVariant,
  getStatusText,
  getEmployeeName,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription,
}: BaseTabProps) {
  return (
    <AssetTable
      assets={assets}
      columns={columns}
      pagination={pagination}
      onPageChange={onPageChange}
      onRowClick={onRowClick}
      onSort={onSort}
      sortConfig={sortConfig}
      emptyStateIcon={emptyStateIcon}
      emptyStateTitle={emptyStateTitle}
      emptyStateDescription={emptyStateDescription}
      getStatusBadgeVariant={getStatusBadgeVariant}
      getStatusText={getStatusText}
      getEmployeeName={getEmployeeName}
    />
  );
})