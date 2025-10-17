import { useState, useCallback } from 'react'

export interface PaginationState {
  pcs: { currentPage: number; itemsPerPage: number; totalCount: number };
  monitors: { currentPage: number; itemsPerPage: number; totalCount: number };
  smartphones: { currentPage: number; itemsPerPage: number; totalCount: number };
  others: { currentPage: number; itemsPerPage: number; totalCount: number };
}

export function usePagination() {
  const [pagination, setPagination] = useState<PaginationState>({
    pcs: { currentPage: 1, itemsPerPage: 100, totalCount: 0 },
    monitors: { currentPage: 1, itemsPerPage: 100, totalCount: 0 },
    smartphones: { currentPage: 1, itemsPerPage: 100, totalCount: 0 },
    others: { currentPage: 1, itemsPerPage: 100, totalCount: 0 },
  });

  const updatePagination = useCallback((tab: keyof PaginationState, updates: Partial<PaginationState['pcs']>) => {
    setPagination(prev => ({
      ...prev,
      [tab]: { ...prev[tab], ...updates }
    }));
  }, []);

  const resetPagination = useCallback((tab: keyof PaginationState) => {
    setPagination(prev => ({
      ...prev,
      [tab]: { ...prev[tab], currentPage: 1 }
    }));
  }, []);

  const handlePageChange = useCallback((tab: keyof PaginationState, page: number) => {
    updatePagination(tab, { currentPage: page });
  }, [updatePagination]);

  return {
    pagination,
    setPagination,
    updatePagination,
    resetPagination,
    handlePageChange
  };
}