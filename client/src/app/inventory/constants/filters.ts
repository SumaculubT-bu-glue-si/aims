// Filter constants
export const FILTER_DEFAULTS = {
  LOCATIONS: [],
  STATUSES: [],
  EMPLOYEE: '',
  GLOBAL: '',
  DETAILS: {}
} as const;

// Filter field mappings
export const FILTER_FIELD_MAPPINGS = {
  // Location filter
  LOCATION_FIELD: 'location',
  
  // Employee filter  
  EMPLOYEE_FIELD: 'userId',
  
  // Status filter
  STATUS_FIELD: 'status',
  
  // Global search fields (will be populated dynamically)
  GLOBAL_SEARCH_FIELDS: [] as string[]
} as const;

// Filter validation
export const FILTER_VALIDATION = {
  MIN_GLOBAL_SEARCH_LENGTH: 1,
  MAX_GLOBAL_SEARCH_LENGTH: 100,
  MIN_EMPLOYEE_SEARCH_LENGTH: 1,
  MAX_EMPLOYEE_SEARCH_LENGTH: 50
} as const;
