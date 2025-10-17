import React, { memo } from 'react';
import { FrontendAsset } from "@/lib/types";
import { BaseTab } from './BaseTab';
import { createTableColumns } from '../../utils/table-helpers';
import { useI18n } from '@/hooks/use-i18n';
import { TableColumn } from '../../utils/table-helpers';

interface SmartphoneTabProps {
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

export const SmartphoneTab = memo(function SmartphoneTab({
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
  emptyStateDescription
}: SmartphoneTabProps) {

  return (
    <BaseTab
      assets={assets}
      columns={columns}
      pagination={pagination}
      sortConfig={sortConfig}
      onPageChange={onPageChange}
      onRowClick={onRowClick}
      onSort={onSort}
      getStatusBadgeVariant={getStatusBadgeVariant}
      getStatusText={getStatusText}
      getEmployeeName={getEmployeeName}
      emptyStateIcon={emptyStateIcon}
      emptyStateTitle={emptyStateTitle}
      emptyStateDescription={emptyStateDescription}
    />
  );
})