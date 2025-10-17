// Pagination constants
export const PAGINATION_DEFAULTS = {
  ITEMS_PER_PAGE: 100,
  INITIAL_PAGE: 1,
  MAX_EXPORT_ITEMS: 10000
} as const;

// Pagination state structure
export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalCount: number;
}

