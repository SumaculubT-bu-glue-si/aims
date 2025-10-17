// UI constants
export const UI_CONFIG = {
  // Dialog sizes
  DIALOG_SIZES: {
    FORM_DIALOG: 'max-w-4xl max-h-[90vh]',
    IMPORT_DIALOG: 'max-w-4xl',
    DETAILED_SEARCH_DIALOG: 'max-w-4xl max-h-[90vh]'
  },
  
  // Table configuration
  TABLE_CONFIG: {
    ROWS_PER_PAGE_OPTIONS: [25, 50, 100, 200],
    DEFAULT_ROWS_PER_PAGE: 100,
    STICKY_HEADER: true,
    COMPACT_MODE: true
  },
  
  // Form configuration
  FORM_CONFIG: {
    GRID_COLS: {
      SMALL: 'grid-cols-1',
      MEDIUM: 'md:grid-cols-2', 
      LARGE: 'lg:grid-cols-4'
    },
    SECTION_SPACING: 'space-y-6',
    FIELD_SPACING: 'gap-4'
  },
  
  // Loading states
  LOADING_CONFIG: {
    SPINNER_SIZE: 'h-8 w-8',
    SPINNER_COLOR: 'text-primary',
    DEBOUNCE_DELAY: 300
  },
  
  // Animation
  ANIMATION_CONFIG: {
    TRANSITION_DURATION: '300ms',
    EASING: 'ease-in-out'
  }
} as const;

// Icon mappings
export const ICON_MAPPINGS = {
  ASSET_TYPES: {
    PC: 'Laptop',
    MONITOR: 'Monitor', 
    SMARTPHONE: 'Smartphone',
    OTHER: 'KeyRound'
  },
  ACTIONS: {
    ADD: 'FilePlus2',
    EDIT: 'Edit',
    DELETE: 'Trash2',
    IMPORT: 'Upload',
    EXPORT: 'Download',
    REFRESH: 'RefreshCw',
    SEARCH: 'Search',
    FILTER: 'SlidersHorizontal',
    SORT_ASC: 'ArrowUp',
    SORT_DESC: 'ArrowDown',
    LOADING: 'Loader',
    ERROR: 'AlertTriangle',
    SUCCESS: 'Check',
    AI: 'Sparkles'
  }
} as const;
