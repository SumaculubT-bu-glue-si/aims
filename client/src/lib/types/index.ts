// Centralized type definitions for the entire application
// This serves as the single source of truth for all data interfaces

// ============================================================================
// BASE TYPES
// ============================================================================

export type AssetType = 'pc' | 'monitor' | 'phone' | 'other';
export type AssetStatus = '利用中' | '保管中' | '故障中' | '返却済' | '廃止' | '貸出中' | '利用予約' | '保管(使用無)';
export type EntityStatus = 'active' | 'inactive';
export type SortDirection = 'asc' | 'desc';

// ============================================================================
// BASE INTERFACES
// ============================================================================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// UNIFIED ASSET TYPE (Reflects Backend Single Table)
// ============================================================================

export interface Asset extends BaseEntity {
  asset_id: string;
  type: AssetType;
  
  // Common fields (always present)
  manufacturer: string;
  model: string;
  serial_number: string;
  location: string;
  status: AssetStatus;
  user_id: string;
  notes?: string;
  project?: string;
  
  // PC-specific fields (always present in DB, but only relevant for PCs)
  hostname?: string;
  part_number?: string;
  form_factor?: string;
  os?: string;
  os_bit?: string;
  office_suite?: string;
  software_license_key?: string;
  wired_mac_address?: string;
  wired_ip_address?: string;
  wireless_mac_address?: string;
  wireless_ip_address?: string;
  cpu?: string;
  memory?: string;
  previous_user?: string;
  
  // Purchase and financial fields
  purchase_date?: string;
  purchase_price?: string;
  purchase_price_tax_included?: string;
  depreciation_years?: string;
  depreciation_dept?: string;
  
  // Usage tracking
  usage_start_date?: string;
  usage_end_date?: string;
  carry_in_out_agreement?: string;
  last_updated?: string;
  updated_by?: string;
  
  // Additional notes fields
  notes1?: string;
  notes2?: string;
  notes3?: string;
  notes4?: string;
  notes5?: string;
}

// ============================================================================
// FRONTEND-COMPATIBLE ASSET INTERFACES (CamelCase for UI)
// ============================================================================

export interface FrontendAsset extends BaseEntity {
  assetId: string;
  type: AssetType;
  
  // Common fields
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  status: AssetStatus;
  userId: string;
  notes?: string;
  project?: string;
  
  // PC-specific fields
  hostname?: string;
  partNumber?: string;
  formFactor?: string;
  os?: string;
  osBit?: string;
  officeSuite?: string;
  softwareLicenseKey?: string;
  wiredMacAddress?: string;
  wiredIpAddress?: string;
  wirelessMacAddress?: string;
  wirelessIpAddress?: string;
  cpu?: string;
  memory?: string;
  previousUser?: string;
  
  // Purchase and financial fields
  purchaseDate?: string;
  purchasePrice?: string;
  purchasePriceTaxIncluded?: string;
  depreciationYears?: string;
  depreciationDept?: string;
  
  // Usage tracking
  usageStartDate?: string;
  usageEndDate?: string;
  carryInOutAgreement?: string;
  lastUpdated?: string;
  updatedBy?: string;
  
  // Additional notes fields
  notes1?: string;
  notes2?: string;
  notes3?: string;
  notes4?: string;
  notes5?: string;
}

// ============================================================================
// TYPE-SPECIFIC ASSET INTERFACES (For Type Safety)
// ============================================================================

export interface PcAsset extends Asset {
  type: 'pc';
  // PC-specific fields are required
  hostname: string;
  part_number: string;
  form_factor: string;
  os: string;
  os_bit: string;
  office_suite: string;
  software_license_key: string;
  wired_mac_address: string;
  wired_ip_address: string;
  wireless_mac_address: string;
  wireless_ip_address: string;
  cpu: string;
  memory: string;
}

export interface MonitorAsset extends Asset {
  type: 'monitor';
  // Monitor-specific fields (PC fields are optional)
  hostname?: string;
  part_number?: string;
  form_factor?: string;
  os?: string;
  os_bit?: string;
  office_suite?: string;
  software_license_key?: string;
  wired_mac_address?: string;
  wired_ip_address?: string;
  wireless_mac_address?: string;
  wireless_ip_address?: string;
  cpu?: string;
  memory?: string;
}

export interface PhoneAsset extends Asset {
  type: 'phone';
  // Phone-specific fields (PC fields are optional)
  hostname?: string;
  part_number?: string;
  form_factor?: string;
  os?: string;
  os_bit?: string;
  office_suite?: string;
  software_license_key?: string;
  wired_mac_address?: string;
  wired_ip_address?: string;
  wireless_mac_address?: string;
  wireless_ip_address?: string;
  cpu?: string;
  memory?: string;
}

export interface OtherAsset extends Asset {
  type: 'other';
  // Other assets (PC fields are optional)
  hostname?: string;
  part_number?: string;
  form_factor?: string;
  os?: string;
  os_bit?: string;
  office_suite?: string;
  software_license_key?: string;
  wired_mac_address?: string;
  wired_ip_address?: string;
  wireless_mac_address?: string;
  wireless_ip_address?: string;
  cpu?: string;
  memory?: string;
}

// Union type for type-safe operations
export type TypedAsset = PcAsset | MonitorAsset | PhoneAsset | OtherAsset;

// ============================================================================
// ENTITY TYPES
// ============================================================================

export interface Location extends BaseEntity {
  name: string;
  visible: boolean;
  order: number;
  status: EntityStatus;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager?: string;
}

export interface Employee extends BaseEntity {
  employee_id: string;
  name: string;
  email: string;
  location: string;
  projects: string[];
  role?: string;
  department?: string;
}

export interface Project extends BaseEntity {
  name: string;
  description?: string;
  visible: boolean;
  order: number;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

export interface AssetField extends BaseEntity {
  systemName: string;
  displayName: string;
  dataType: 'Text' | 'Number' | 'Date';
  visible: boolean;
  notes?: string;
  order: number;
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export interface AuditPlan extends BaseEntity {
  name: string;
  description?: string;
  start_date: string;
  due_date: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'Cancelled';
  created_by: string;
  chat_space_id?: string;
  chat_space_name?: string;
  chat_space_created_at?: string;
  calendar_events?: any[];
}

export interface AuditAsset extends BaseEntity {
  audit_plan_id: string;
  asset_id: string;
  asset_type: AssetType;
  original_location: string;
  original_user: string;
  current_location: string;
  current_user: string;
  current_status: AssetStatus;
  audit_status: number;
  audited_at?: string;
  resolved: boolean;
  notes?: string;
}

export interface CorrectiveAction extends BaseEntity {
  audit_asset_id: string;
  title: string;
  description: string;
  assigned_to: string;
  due_date: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface FilterOptions {
  search?: string;
  status?: string[];
  location?: string[];
  type?: AssetType[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
  page?: number;
  limit?: number;
  visible?: boolean; // Added for location filtering
  user_id?: string; // Added for asset filtering
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface LocationFormValues {
  name: string;
  visible: boolean;
  order?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager?: string;
}

export interface EmployeeFormValues {
  employee_id: string;
  name: string;
  email: string;
  location: string;
  projects: string[];
  role?: string;
  department?: string;
}

export interface ProjectFormValues {
  name: string;
  description?: string;
  visible: boolean;
  order?: number;
}

export interface UserFormValues {
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

// Frontend form values (camelCase for UI)
export interface PcFormValues {
  id?: string;
  assetId?: string;
  type?: string;
  hostname?: string;
  manufacturer?: string;
  model?: string;
  partNumber?: string;
  serialNumber?: string;
  formFactor?: string;
  os?: string;
  osBit?: string;
  officeSuite?: string;
  softwareLicenseKey?: string;
  wiredMacAddress?: string;
  wiredIpAddress?: string;
  wirelessMacAddress?: string;
  wirelessIpAddress?: string;
  purchaseDate?: string;
  purchasePrice?: string; // Changed from number to string for form consistency
  purchasePriceTaxIncluded?: string; // Changed from number to string for form consistency
  depreciationYears?: string;
  depreciationDept?: string;
  cpu?: string;
  memory?: string;
  location?: string;
  status?: string;
  previousUser?: string;
  userId?: string;
  usageStartDate?: string;
  usageEndDate?: string;
  carryInOutAgreement?: string;
  lastUpdated?: string;
  updatedBy?: string;
  notes?: string;
  project?: string;
  notes1?: string;
  notes2?: string;
  notes3?: string;
  notes4?: string;
  notes5?: string;
  // Required base entity fields
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetFormValues {
  asset_id: string;
  type: AssetType;
  manufacturer: string;
  model: string;
  serial_number: string;
  location: string;
  status: AssetStatus;
  user_id: string;
  notes?: string;
  project?: string;
  
  // PC-specific fields (optional for other types)
  hostname?: string;
  part_number?: string;
  form_factor?: string;
  os?: string;
  os_bit?: string;
  office_suite?: string;
  software_license_key?: string;
  wired_mac_address?: string;
  wired_ip_address?: string;
  wireless_mac_address?: string;
  wireless_ip_address?: string;
  cpu?: string;
  memory?: string;
  previous_user?: string;
  
  // Purchase and financial fields
  purchase_date?: string;
  purchase_price?: string;
  purchase_price_tax_included?: string;
  depreciation_years?: string;
  depreciation_dept?: string;
  
  // Usage tracking
  usage_start_date?: string;
  usage_end_date?: string;
  carry_in_out_agreement?: string;
  updated_by?: string;
  
  // Additional notes fields
  notes1?: string;
  notes2?: string;
  notes3?: string;
  notes4?: string;
  notes5?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T> = Partial<CreateInput<T>>;
export type EntityId = string;
export type Timestamp = string;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isPcAsset(asset: Asset): asset is PcAsset {
  return asset.type === 'pc';
}

export function isMonitorAsset(asset: Asset): asset is MonitorAsset {
  return asset.type === 'monitor';
}

export function isPhoneAsset(asset: Asset): asset is PhoneAsset {
  return asset.type === 'phone';
}

export function isOtherAsset(asset: Asset): asset is OtherAsset {
  return asset.type === 'other';
}

// ============================================================================
// TRANSFORMATION UTILITIES
// ============================================================================

export function transformBackendToFrontend(backendAsset: Asset): FrontendAsset {
  return {
    id: backendAsset.id,
    assetId: backendAsset.asset_id,
    type: backendAsset.type,
    manufacturer: backendAsset.manufacturer,
    model: backendAsset.model,
    serialNumber: backendAsset.serial_number,
    location: backendAsset.location,
    status: backendAsset.status,
    userId: backendAsset.user_id,
    notes: backendAsset.notes,
    project: backendAsset.project,
    
    // PC-specific fields
    hostname: backendAsset.hostname,
    partNumber: backendAsset.part_number,
    formFactor: backendAsset.form_factor,
    os: backendAsset.os,
    osBit: backendAsset.os_bit,
    officeSuite: backendAsset.office_suite,
    softwareLicenseKey: backendAsset.software_license_key,
    wiredMacAddress: backendAsset.wired_mac_address,
    wiredIpAddress: backendAsset.wired_ip_address,
    wirelessMacAddress: backendAsset.wireless_mac_address,
    wirelessIpAddress: backendAsset.wireless_ip_address,
    cpu: backendAsset.cpu,
    memory: backendAsset.memory,
    previousUser: backendAsset.previous_user,
    
    // Purchase and financial fields
    purchaseDate: backendAsset.purchase_date,
    purchasePrice: backendAsset.purchase_price ? String(backendAsset.purchase_price) : undefined,
    purchasePriceTaxIncluded: backendAsset.purchase_price_tax_included ? String(backendAsset.purchase_price_tax_included) : undefined,
    depreciationYears: backendAsset.depreciation_years ? String(backendAsset.depreciation_years) : undefined,
    depreciationDept: backendAsset.depreciation_dept,
    
    // Usage tracking
    usageStartDate: backendAsset.usage_start_date,
    usageEndDate: backendAsset.usage_end_date,
    carryInOutAgreement: backendAsset.carry_in_out_agreement,
    lastUpdated: backendAsset.last_updated,
    updatedBy: backendAsset.updated_by,
    
    // Additional notes fields
    notes1: backendAsset.notes1,
    notes2: backendAsset.notes2,
    notes3: backendAsset.notes3,
    notes4: backendAsset.notes4,
    notes5: backendAsset.notes5,
    
    // Base entity fields
    createdAt: backendAsset.createdAt,
    updatedAt: backendAsset.updatedAt
  };
}

export function transformFrontendToBackend(frontendAsset: FrontendAsset): Asset {
  return {
    id: frontendAsset.id,
    asset_id: frontendAsset.assetId,
    type: frontendAsset.type,
    manufacturer: frontendAsset.manufacturer,
    model: frontendAsset.model,
    serial_number: frontendAsset.serialNumber,
    location: frontendAsset.location,
    status: frontendAsset.status,
    user_id: frontendAsset.userId,
    notes: frontendAsset.notes,
    project: frontendAsset.project,
    
    // PC-specific fields
    hostname: frontendAsset.hostname,
    part_number: frontendAsset.partNumber,
    form_factor: frontendAsset.formFactor,
    os: frontendAsset.os,
    os_bit: frontendAsset.osBit,
    office_suite: frontendAsset.officeSuite,
    software_license_key: frontendAsset.softwareLicenseKey,
    wired_mac_address: frontendAsset.wiredMacAddress,
    wired_ip_address: frontendAsset.wiredIpAddress,
    wireless_mac_address: frontendAsset.wirelessMacAddress,
    wireless_ip_address: frontendAsset.wirelessIpAddress,
    cpu: frontendAsset.cpu,
    memory: frontendAsset.memory,
    previous_user: frontendAsset.previousUser,
    
    // Purchase and financial fields
    purchase_date: frontendAsset.purchaseDate,
    purchase_price: frontendAsset.purchasePrice,
    purchase_price_tax_included: frontendAsset.purchasePriceTaxIncluded,
    depreciation_years: frontendAsset.depreciationYears,
    depreciation_dept: frontendAsset.depreciationDept,
    
    // Usage tracking
    usage_start_date: frontendAsset.usageStartDate,
    usage_end_date: frontendAsset.usageEndDate,
    carry_in_out_agreement: frontendAsset.carryInOutAgreement,
    last_updated: frontendAsset.lastUpdated,
    updated_by: frontendAsset.updatedBy,
    
    // Additional notes fields
    notes1: frontendAsset.notes1,
    notes2: frontendAsset.notes2,
    notes3: frontendAsset.notes3,
    notes4: frontendAsset.notes4,
    notes5: frontendAsset.notes5,
    
    // Base entity fields
    createdAt: frontendAsset.createdAt,
    updatedAt: frontendAsset.updatedAt
  };
}

// ============================================================================
// ADDITIONAL TYPES (From old types.ts)
// ============================================================================

export type InventoryTask = {
  id: string;
  name: string;
};

export type Currency = 'JPY' | 'USD';

export type SubscriptionStatus = 'active' | 'inactive';

export type BillingCycleUnit = 'day' | 'week' | 'month' | 'year';

export interface BillingCycle {
  unit: BillingCycleUnit;
  period: number;
}

export type LicenseType = 'subscription' | 'perpetual';

export type PricingType = 'per-license' | 'per-seat';

export interface PerUserPricing {
  monthly?: number;
  yearly?: number;
  currency: Currency;
}

export interface Account {
  accountId: string;
  assignedUser?: string; // Employee ID
  assignedDevice?: string; // e.g. PC name or asset ID
  version?: string;
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  amount: number;
  currency: Currency;
  billingCycle?: BillingCycle;
  licenseKey?: string;
}

export interface AssignedUser {
  employeeId: string;
  assignedDate: string; // ISO date string
}

export interface License {
  id: string;
  account_id: string;
  unit_price: number;
  currency: 'jpy' | 'usd';
  billing_cycle: number;
  billing_interval: 'day' | 'week' | 'month' | 'year';
  start_date: Date | null;
  end_date: Date | null;
  renewal_date: Date | null;
  version: string | null;
  license_key: string | null;
  assigned_employee: Employee | null;
  used: boolean;
}

export interface Subscription {
  id: string;
  service_name: string;
  status: SubscriptionStatus;
  pricing_type: PricingType;
  license_type: LicenseType;
  licenses: License[];
  employees: Employee[];
  vendor: string | null;
  category: string | null;
  payment_method: string | null;
  cancellation_date: Date | null;
  official_website: string | null;
  official_support: string | null;
  notes: string | null;
  per_seat_monthly_price: number | null;
  per_seat_yearly_price: number | null;
  per_seat_currency: 'jpy' | 'usd';
}

export interface GWS {
  id: string;
  domain: string;
  adminEmail: string;
  plan: string;
  notes?: string;
}

export interface ImportSummary {
  total: number;
  pcs: number;
  monitors: number;
  phones: number;
  others: number;
  errors: string[];
  categorizationDetails?: {
    pcs: string[];
    monitors: string[];
    phones: string[];
    others: string[];
  };
}
