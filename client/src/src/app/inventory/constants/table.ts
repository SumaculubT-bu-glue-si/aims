import { FrontendAsset } from '@/lib/types';

// Table column configuration
export const TABLE_CONFIG = {
  // Column widths
  MIN_WIDTHS: {
    ID: "80px",
    HOSTNAME: "100px", 
    LOCATION: "80px",
    USER_ID: "100px",
    STATUS: "80px",
    MANUFACTURER: "100px",
    MODEL: "100px",
    PART_NUMBER: "100px",
    SERIAL_NUMBER: "120px",
    FORM_FACTOR: "120px",
    PREVIOUS_USER: "100px",
    OS: "100px",
    OS_BIT: "60px",
    OFFICE_SUITE: "100px",
    SOFTWARE_LICENSE_KEY: "100px",
    WIRED_MAC_ADDRESS: "140px",
    WIRED_IP_ADDRESS: "120px",
    WIRELESS_MAC_ADDRESS: "140px",
    WIRELESS_IP_ADDRESS: "120px",
    USAGE_START_DATE: "100px",
    USAGE_END_DATE: "100px",
    CARRY_IN_OUT_AGREEMENT: "120px",
    LAST_UPDATED: "100px",
    UPDATED_BY: "100px",
    PURCHASE_DATE: "100px",
    PURCHASE_PRICE: "120px",
    PURCHASE_PRICE_TAX_INCLUDED: "120px",
    DEPRECIATION_YEARS: "80px",
    DEPRECIATION_DEPT: "100px",
    CPU: "100px",
    MEMORY: "80px",
    NOTES: "200px"
  },
  
  // Special column ordering
  SPECIAL_ORDER: ['location', 'userId', 'status'] as (keyof FrontendAsset)[],
  
  // Sortable columns
  SORTABLE_COLUMNS: [
    'id', 'hostname', 'location', 'userId', 'status', 'manufacturer', 'model',
    'partNumber', 'serialNumber', 'formFactor', 'previousUser', 'os', 'osBit',
    'officeSuite', 'softwareLicenseKey', 'wiredMacAddress', 'wiredIpAddress',
    'wirelessMacAddress', 'wirelessIpAddress', 'usageStartDate', 'usageEndDate',
    'carryInOutAgreement', 'lastUpdated', 'updatedBy', 'purchaseDate', 'purchasePrice',
    'purchasePriceTaxIncluded', 'depreciationYears', 'depreciationDept', 'cpu', 'memory'
  ] as (keyof FrontendAsset)[],
  
  // Non-sortable columns
  NON_SORTABLE_COLUMNS: ['notes'] as (keyof FrontendAsset)[]
} as const;

// Default sort configuration
export const DEFAULT_SORT_CONFIG = {
  KEY: 'id' as keyof FrontendAsset,
  DIRECTION: 'asc' as 'asc' | 'desc'
} as const;
