'use client'

import { 
  graphqlQuery, 
  INVENTORY_QUERIES, 
  transformGraphQLAssetToPcAsset,
  transformGraphQLAssetToMonitorAsset,
  transformGraphQLAssetToPhoneAsset,
  transformGraphQLAssetToOtherAsset,
  type GraphQLResponse 
} from '@/lib/graphql-client';
import { 
  FrontendAsset, 
  PcFormValues,
  transformBackendToFrontend,
  transformFrontendToBackend,
  Location,
  Employee,
  Project
} from '@/lib/types/index';

// Use centralized types
export type PcAsset = FrontendAsset;
export type MonitorAsset = FrontendAsset;
export type PhoneAsset = FrontendAsset;
export type OtherAsset = FrontendAsset;

// GraphQL-based actions for inventory management

import { toSnakeCase } from './utils/string-helpers';

// ============================================================================
// TRANSFORMATION LAYER
// ============================================================================

// Transform GraphQL response to FrontendAsset format using centralized transformation
function transformGraphQLToFrontend(graphqlAsset: any): FrontendAsset {
  const transformedAsset = transformBackendToFrontend({
    id: graphqlAsset.id,
    asset_id: graphqlAsset.asset_id,
    type: graphqlAsset.type,
    manufacturer: graphqlAsset.manufacturer,
    model: graphqlAsset.model,
    serial_number: graphqlAsset.serial_number,
    location: graphqlAsset.location,
    status: graphqlAsset.status,
    user_id: graphqlAsset.user_id,
    notes: graphqlAsset.notes,
    project: graphqlAsset.project,
    
    // PC-specific fields
    hostname: graphqlAsset.hostname,
    part_number: graphqlAsset.part_number,
    form_factor: graphqlAsset.form_factor,
    os: graphqlAsset.os,
    os_bit: graphqlAsset.os_bit,
    office_suite: graphqlAsset.office_suite,
    software_license_key: graphqlAsset.software_license_key,
    wired_mac_address: graphqlAsset.wired_mac_address,
    wired_ip_address: graphqlAsset.wired_ip_address,
    wireless_mac_address: graphqlAsset.wireless_mac_address,
    wireless_ip_address: graphqlAsset.wireless_ip_address,
    cpu: graphqlAsset.cpu,
    memory: graphqlAsset.memory,
    previous_user: graphqlAsset.previous_user,
    
    // Purchase and financial fields
    purchase_date: graphqlAsset.purchase_date,
    purchase_price: graphqlAsset.purchase_price,
    purchase_price_tax_included: graphqlAsset.purchase_price_tax_included,
    depreciation_years: graphqlAsset.depreciation_years,
    depreciation_dept: graphqlAsset.depreciation_dept,
    
    // Usage tracking
    usage_start_date: graphqlAsset.usage_start_date,
    usage_end_date: graphqlAsset.usage_end_date,
    carry_in_out_agreement: graphqlAsset.carry_in_out_agreement,
    last_updated: graphqlAsset.last_updated,
    updated_by: graphqlAsset.updated_by,
    
    // Additional notes fields
    notes1: graphqlAsset.notes1,
    notes2: graphqlAsset.notes2,
    notes3: graphqlAsset.notes3,
    notes4: graphqlAsset.notes4,
    notes5: graphqlAsset.notes5,
    
    // Base entity fields
    createdAt: graphqlAsset.createdAt,
    updatedAt: graphqlAsset.updatedAt
  });

  // Preserve the employee relationship data from GraphQL
  if (graphqlAsset.employee) {
    (transformedAsset as any).employee = {
      id: graphqlAsset.employee.id,
      employeeId: graphqlAsset.employee.employee_id,
      name: graphqlAsset.employee.name,
      email: graphqlAsset.employee.email,
      location: graphqlAsset.employee.location
    };
  }

  return transformedAsset;
}

// Transform FrontendAsset to GraphQL input format using proper conversion
function transformFrontendToGraphQL(frontendAsset: FrontendAsset): any {
  // Use the existing toGraphQLAssetInput function which properly converts strings to numbers
  return toGraphQLAssetInput(frontendAsset);
}

type CommonFilters = {
  locations?: string[];
  statuses?: string[];
  employee?: string;
  global?: string;
  details?: Partial<PcFormValues>;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
};

function mapDetailFilters(details?: Partial<PcFormValues>) {
  if (!details) return {} as Record<string, any>;
  
  const mapped: Record<string, any> = {};
  
  // Only add defined values to avoid sending undefined to GraphQL
  if (details.id) mapped.asset_id = details.id;
  if (details.hostname) mapped.hostname = details.hostname;
  if (details.manufacturer) mapped.manufacturer = details.manufacturer;
  if (details.model) mapped.model = details.model;
  if (details.partNumber) mapped.part_number = details.partNumber;
  if (details.serialNumber) mapped.serial_number = details.serialNumber;
  if (details.formFactor) mapped.form_factor = details.formFactor;
  if (details.os) mapped.os = details.os;
  if (details.osBit) mapped.os_bit = details.osBit;
  if (details.officeSuite) mapped.office_suite = details.officeSuite;
  if (details.softwareLicenseKey) mapped.software_license_key = details.softwareLicenseKey;
  if (details.wiredMacAddress) mapped.wired_mac_address = details.wiredMacAddress;
  if (details.wiredIpAddress) mapped.wired_ip_address = details.wiredIpAddress;
  if (details.wirelessMacAddress) mapped.wireless_mac_address = details.wirelessMacAddress;
  if (details.wirelessIpAddress) mapped.wireless_ip_address = details.wirelessIpAddress;
  if (details.previousUser) mapped.previous_user = details.previousUser;
  if (details.project) mapped.project = details.project;
  if (details.notes) mapped.notes = details.notes;
  if (details.notes1) mapped.notes1 = details.notes1;
  if (details.notes2) mapped.notes2 = details.notes2;
  if (details.notes3) mapped.notes3 = details.notes3;
  if (details.notes4) mapped.notes4 = details.notes4;
  if (details.notes5) mapped.notes5 = details.notes5;
  if (details.cpu) mapped.cpu = details.cpu;
  if (details.memory) mapped.memory = details.memory;
  
  return mapped;
}

export async function getPcsFromGraphQL(
  page: number = 1, 
  limit: number = 100,
  filters: CommonFilters = {}
): Promise<{ pcs: PcAsset[]; pagination: any }> {
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.GET_ASSETS, {
      ...filters,
      type: 'pc',
      page,
      first: limit
    });

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { pcs: [], pagination: null };
    }

    const assets = response.data?.assets?.data || [];
    const pagination = response.data?.assets?.paginatorInfo || null;
    
    // Transform GraphQL data to FrontendAsset format
    const pcs = assets.map(transformGraphQLToFrontend) as PcAsset[];
    return { pcs, pagination };
  } catch (error) {
    console.error('Error fetching PCs:', error);
    return { pcs: [], pagination: null };
  }
}

export async function getMonitorsFromGraphQL(
  page: number = 1, 
  limit: number = 100, 
  filters: CommonFilters = {}
): Promise<{ monitors: MonitorAsset[]; pagination: any }> {
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.GET_ASSETS, {
      ...filters,
      type: 'monitor',
      page,
      first: limit
    });

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { monitors: [], pagination: null };
    }

    const assets = response.data?.assets?.data || [];
    const pagination = response.data?.assets?.paginatorInfo || null;
    
    // Transform GraphQL data to FrontendAsset format
    const monitors = assets.map(transformGraphQLToFrontend) as MonitorAsset[];
    return { monitors, pagination };
  } catch (error) {
    console.error('Error fetching monitors:', error);
    return { monitors: [], pagination: null };
  }
}

export async function getPhonesFromGraphQL(
  page: number = 1, 
  limit: number = 100, 
  filters: CommonFilters = {}
): Promise<{ phones: PhoneAsset[]; pagination: any }> {
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.GET_ASSETS, {
      ...filters,
      type: 'smartphones',
      page,
      first: limit
    });

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { phones: [], pagination: null };
    }

    const assets = response.data?.assets?.data || [];
    const pagination = response.data?.assets?.paginatorInfo || null;
    
    // Transform GraphQL data to FrontendAsset format
    const phones = assets.map(transformGraphQLToFrontend) as PhoneAsset[];
    return { phones, pagination };
  } catch (error) {
    console.error('Error fetching phones:', error);
    return { phones: [], pagination: null };
  }
}

export async function getOthersFromGraphQL(
  page: number = 1, 
  limit: number = 100, 
  filters: CommonFilters = {}
): Promise<{ others: OtherAsset[]; pagination: any }> {
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.GET_ASSETS, {
      ...filters,
      exclude_types: ['pc', 'monitor', 'smartphones'],
      page,
      first: limit
    });

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { others: [], pagination: null };
    }

    const assets = response.data?.assets?.data || [];
    const pagination = response.data?.assets?.paginatorInfo || null;
    
    // Transform GraphQL data to FrontendAsset format
    const others = assets.map(transformGraphQLToFrontend) as OtherAsset[];
    return { others, pagination };
  } catch (error) {
    console.error('Error fetching others:', error);
    return { others: [], pagination: null };
  }
}

export async function getAllAssetsFromGraphQL(
  page: number = 1, 
  limit: number = 10000, 
  filters: CommonFilters = {}
): Promise<{ 
  pcs: PcAsset[]; 
  monitors: MonitorAsset[]; 
  phones: PhoneAsset[]; 
  others: OtherAsset[];
  error?: string;
}> {
  try {
    // Fetch all asset types in parallel
    const [pcsResult, monitorsResult, phonesResult, othersResult] = await Promise.all([
      getPcsFromGraphQL(page, limit, filters),
      getMonitorsFromGraphQL(page, limit, filters),
      getPhonesFromGraphQL(page, limit, filters),
      getOthersFromGraphQL(page, limit, filters)
    ]);

    return {
      pcs: pcsResult.pcs,
      monitors: monitorsResult.monitors,
      phones: phonesResult.phones,
      others: othersResult.others
    };
  } catch (error) {
    console.error('Error fetching all assets:', error);
    return {
      pcs: [],
      monitors: [],
      phones: [],
      others: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getEmployeesFromGraphQL(): Promise<{ employees: { id: string; name: string; }[]; error: string | null }> {
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.GET_EMPLOYEES);
    
    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { employees: [], error: response.errors[0]?.message || 'GraphQL query failed' };
    }

    if (!response.data?.employees?.data) {
      return { employees: [], error: 'No data received from GraphQL' };
    }

    const employees = response.data.employees.data.map((emp: any) => ({
      id: emp.id,
      name: emp.name
    }));
    return { employees, error: null };
  } catch (error: any) {
    console.error('Error getting employees from GraphQL:', error);
    return { employees: [], error: error.message || 'Failed to fetch employees' };
  }
}

export async function getLocationsFromGraphQL(): Promise<{ locations: { id: string; name: string; }[]; error: string | null }> {
  try {
    const response = await graphqlQuery(`
      query GetLocations {
        locations {
          id
          name
        }
      }
    `);
    
    if (response.errors) {
      return { locations: [], error: response.errors[0]?.message || 'GraphQL query failed' };
    }

    return { locations: response.data?.locations || [], error: null };
  } catch (error: any) {
    return { locations: [], error: error.message || 'Failed to fetch locations' };
  }
}

export async function getProjectsFromGraphQL(): Promise<{ projects: { id: string; name: string; }[]; error: string | null }> {
  try {
    // Get projects directly from the projects table
    const response = await graphqlQuery(INVENTORY_QUERIES.GET_PROJECTS);
    
    if (response.errors) {
      return { projects: [], error: response.errors[0]?.message || 'GraphQL query failed' };
    }

    return { projects: response.data?.projects?.data || [], error: null };
  } catch (error: any) {
    return { projects: [], error: error.message || 'Failed to fetch projects' };
  }
}

export async function getMasterDataFromGraphQL(): Promise<{
  locations: Location[];
  employees: Employee[];
  projects: Project[];
  error?: string;
}> {
  try {
    const [locationsResponse, employeesResponse, projectsResponse] = await Promise.all([
      graphqlQuery(`
        query GetLocations {
          locations {
            id
            name
            address
            city
            state
            country
            postal_code
            phone
            email
            manager
            status
            visible
            order
          }
        }
      `),
      graphqlQuery(INVENTORY_QUERIES.GET_EMPLOYEES),
      graphqlQuery(INVENTORY_QUERIES.GET_PROJECTS)
    ]);

    const locations = locationsResponse.data?.locations || [];
    const employees = employeesResponse.data?.employees?.data || [];
    const projects = projectsResponse.data?.projects?.data || [];

    return {
      locations: locations as Location[],
      employees: employees as Employee[],
      projects: projects as Project[]
    };
  } catch (error) {
    console.error('Error fetching master data:', error);
    return {
      locations: [],
      employees: [],
      projects: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function normalizeDate(value: any): string | null {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Replace common separators with '-'
  const unified = trimmed.replace(/[.\/]/g, '-');

  // yyyy-m-d or yyyy-mm-dd
  let m = unified.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const y = m[1];
    const mo = m[2].padStart(2, '0');
    const d = m[3].padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }

  // m-d-yyyy or mm-dd-yyyy -> assume month-day-year
  m = unified.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) {
    const mo = m[1].padStart(2, '0');
    const d = m[2].padStart(2, '0');
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }

  // Fallback: try Date parse and format
  const dt = new Date(unified);
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }
  return null;
}

function normalizeDateTime(value: any): string | null {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  const dt = new Date(value);
  if (isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  const ss = String(dt.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d} ${hh}:${mm}:${ss}`;
}

// Validate and clean user_id to prevent foreign key constraint violations
function validateUserId(userId: any): string | null {
  if (!userId || userId === '' || userId === null || userId === undefined) {
    return null;
  }
  
  // Convert to string and trim
  const cleanUserId = String(userId).trim();
  
  // Check if it's a valid number
  if (isNaN(Number(cleanUserId))) {
    console.warn(`Invalid user_id format: "${userId}" - setting to null`);
    return null;
  }
  
  // Return the cleaned numeric string
  return cleanUserId;
}

// Convert PcFormValues/PcAsset shaped object to GraphQL AssetInput (snake_case)
function toGraphQLAssetInput(pc: any): any {
  // Filter out any 'user' field to prevent conflicts with user_id
  const { user, ...filteredPc } = pc;
  
  // Ensure asset_id is not null - generate one if missing
  let assetId = filteredPc.assetId || filteredPc.asset_id || filteredPc.id;
  if (!assetId || assetId.trim() === '') {
    // Generate a unique asset_id based on type and timestamp
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const typePrefix = (filteredPc.type || 'ASSET').toUpperCase().substring(0, 2);
    assetId = `${typePrefix}-${timestamp}-${randomSuffix}`;
  }
  
  return {
    asset_id: assetId,
    type: filteredPc.type || 'pc', // Use the actual type from the asset, default to 'pc' if not specified
    hostname: filteredPc.hostname || null,
    manufacturer: filteredPc.manufacturer || null,
    model: filteredPc.model || null,
    part_number: filteredPc.partNumber || null,
    serial_number: filteredPc.serialNumber || null,
    form_factor: filteredPc.formFactor || null,
    os: filteredPc.os || null,
    os_bit: filteredPc.osBit || null,
    office_suite: filteredPc.officeSuite || null,
    software_license_key: filteredPc.softwareLicenseKey || null,
    wired_mac_address: filteredPc.wiredMacAddress || null,
    wired_ip_address: filteredPc.wiredIpAddress || null,
    wireless_mac_address: filteredPc.wirelessMacAddress || null,
    wireless_ip_address: filteredPc.wirelessIpAddress || null,
    purchase_date: normalizeDate(filteredPc.purchaseDate),
    purchase_price: filteredPc.purchasePrice ? parseFloat(filteredPc.purchasePrice) : null,
    purchase_price_tax_included: filteredPc.purchasePriceTaxIncluded ? parseFloat(filteredPc.purchasePriceTaxIncluded) : null,
    depreciation_years: filteredPc.depreciationYears ? parseInt(filteredPc.depreciationYears, 10) : null,
    depreciation_dept: filteredPc.depreciationDept || null,
    cpu: filteredPc.cpu || null,
    memory: filteredPc.memory || null,
    location: filteredPc.location || null,
    status: filteredPc.status || null,
    previous_user: filteredPc.previousUser || null,
    user_id: validateUserId(filteredPc.userId),
    usage_start_date: normalizeDate(filteredPc.usageStartDate),
    usage_end_date: normalizeDate(filteredPc.usageEndDate),
    carry_in_out_agreement: filteredPc.carryInOutAgreement || null,
    last_updated: normalizeDateTime(filteredPc.lastUpdated),
    updated_by: filteredPc.updatedBy || null,
    notes: filteredPc.notes || null,
    project: filteredPc.project || null,
    notes1: filteredPc.notes1 || null,
    notes2: filteredPc.notes2 || null,
    notes3: filteredPc.notes3 || null,
    notes4: filteredPc.notes4 || null,
    notes5: filteredPc.notes5 || null,
  };
}

// Convert MonitorAsset shaped object to GraphQL AssetInput (snake_case)
function toGraphQLMonitorInput(monitor: any): any {
  // Ensure asset_id is not null - generate one if missing
  let assetId = monitor.assetId || monitor.asset_id || monitor.id;
  if (!assetId || assetId.trim() === '') {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const typePrefix = (monitor.type || 'MONITOR').toUpperCase().substring(0, 2);
    assetId = `${typePrefix}-${timestamp}-${randomSuffix}`;
  }
  
  return {
    asset_id: assetId,
    type: monitor.type || 'monitor',
    hostname: monitor.hostname || null,
    manufacturer: monitor.manufacturer || null,
    model: monitor.model || null,
    part_number: monitor.partNumber || null,
    serial_number: monitor.serialNumber || null,
    form_factor: monitor.formFactor || null,
    os: null, // Monitors don't have OS
    os_bit: null, // Monitors don't have OS bit
    office_suite: null, // Monitors don't have office suite
    software_license_key: null, // Monitors don't have software licenses
    wired_mac_address: null, // Monitors don't have MAC addresses
    wired_ip_address: null, // Monitors don't have IP addresses
    wireless_mac_address: null, // Monitors don't have wireless
    wireless_ip_address: null, // Monitors don't have wireless
    purchase_date: normalizeDate(monitor.purchaseDate),
    purchase_price: monitor.purchasePrice ? parseFloat(monitor.purchasePrice) : null,
    purchase_price_tax_included: monitor.purchasePriceTaxIncluded ? parseFloat(monitor.purchasePriceTaxIncluded) : null,
    depreciation_years: monitor.depreciationYears ? parseInt(monitor.depreciationYears, 10) : null,
    depreciation_dept: monitor.depreciationDept || null,
    cpu: null, // Monitors don't have CPU
    memory: null, // Monitors don't have memory
    location: monitor.location || null,
    status: monitor.status || null,
    previous_user: monitor.previousUser || null,
    user_id: validateUserId(monitor.userId),
    usage_start_date: normalizeDate(monitor.usageStartDate),
    usage_end_date: normalizeDate(monitor.usageEndDate),
    carry_in_out_agreement: monitor.carryInOutAgreement || null,
    last_updated: normalizeDateTime(monitor.lastUpdated),
    updated_by: monitor.updatedBy || null,
    notes: monitor.notes || null,
    project: monitor.project || null,
    notes1: monitor.notes1 || null,
    notes2: monitor.notes2 || null,
    notes3: monitor.notes3 || null,
    notes4: monitor.notes4 || null,
    notes5: monitor.notes5 || null,
  };
}

// Convert PhoneAsset shaped object to GraphQL AssetInput (snake_case)
function toGraphQLPhoneInput(phone: any): any {
  // Ensure asset_id is not null - generate one if missing
  let assetId = phone.assetId || phone.asset_id || phone.id;
  if (!assetId || assetId.trim() === '') {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const typePrefix = (phone.type || 'PHONE').toUpperCase().substring(0, 2);
    assetId = `${typePrefix}-${timestamp}-${randomSuffix}`;
  }
  
  return {
    asset_id: assetId,
    type: phone.type || 'smartphones',
    hostname: phone.hostname || null,
    manufacturer: phone.manufacturer || null,
    model: phone.model || null,
    part_number: phone.partNumber || null,
    serial_number: phone.serialNumber || null,
    form_factor: phone.formFactor || null,
    os: phone.os || null,
    os_bit: phone.osBit || null,
    office_suite: null, // Phones don't have office suite
    software_license_key: phone.softwareLicenseKey || null,
    wired_mac_address: phone.wiredMacAddress || null,
    wired_ip_address: phone.wiredIpAddress || null,
    wireless_mac_address: phone.wirelessMacAddress || null,
    wireless_ip_address: phone.wirelessIpAddress || null,
    purchase_date: normalizeDate(phone.purchaseDate),
    purchase_price: phone.purchasePrice ? parseFloat(phone.purchasePrice) : null,
    purchase_price_tax_included: phone.purchasePriceTaxIncluded ? parseFloat(phone.purchasePriceTaxIncluded) : null,
    depreciation_years: phone.depreciationYears ? parseInt(phone.depreciationYears, 10) : null,
    depreciation_dept: phone.depreciationDept || null,
    cpu: phone.cpu || null,
    memory: phone.memory || null,
    location: phone.location || null,
    status: phone.status || null,
    previous_user: phone.previousUser || null,
    user_id: validateUserId(phone.userId),
    usage_start_date: normalizeDate(phone.usageStartDate),
    usage_end_date: normalizeDate(phone.usageEndDate),
    carry_in_out_agreement: phone.carryInOutAgreement || null,
    last_updated: normalizeDateTime(phone.lastUpdated),
    updated_by: phone.updatedBy || null,
    notes: phone.notes || null,
    project: phone.project || null,
    notes1: phone.notes1 || null,
    notes2: phone.notes2 || null,
    notes3: phone.notes3 || null,
    notes4: phone.notes4 || null,
    notes5: phone.notes5 || null,
  };
}

// Convert OtherAsset shaped object to GraphQL AssetInput (snake_case)
function toGraphQLOthersInput(other: any): any {
  // Ensure asset_id is not null - generate one if missing
  let assetId = other.assetId || other.asset_id || other.id;
  if (!assetId || assetId.trim() === '') {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const typePrefix = (other.type || 'OTHER').toUpperCase().substring(0, 2);
    assetId = `${typePrefix}-${timestamp}-${randomSuffix}`;
  }
  
  return {
    asset_id: assetId,
    type: other.type || 'others',
    hostname: other.hostname || null,
    manufacturer: other.manufacturer || null,
    model: other.model || null,
    part_number: other.partNumber || null,
    serial_number: other.serialNumber || null,
    form_factor: other.formFactor || null,
    os: other.os || null,
    os_bit: other.osBit || null,
    office_suite: null, // Others don't typically have office suite
    software_license_key: other.softwareLicenseKey || null,
    wired_mac_address: other.wiredMacAddress || null,
    wired_ip_address: other.wiredIpAddress || null,
    wireless_mac_address: other.wirelessMacAddress || null,
    wireless_ip_address: other.wirelessIpAddress || null,
    purchase_date: normalizeDate(other.purchaseDate),
    purchase_price: other.purchasePrice ? parseFloat(other.purchasePrice) : null,
    purchase_price_tax_included: other.purchasePriceTaxIncluded ? parseFloat(other.purchasePriceTaxIncluded) : null,
    depreciation_years: other.depreciationYears ? parseInt(other.depreciationYears, 10) : null,
    depreciation_dept: other.depreciationDept || null,
    cpu: other.cpu || null,
    memory: other.memory || null,
    location: other.location || null,
    status: other.status || null,
    previous_user: other.previousUser || null,
    user_id: validateUserId(other.userId),
    usage_start_date: normalizeDate(other.usageStartDate),
    usage_end_date: normalizeDate(other.usageEndDate),
    carry_in_out_agreement: other.carryInOutAgreement || null,
    last_updated: normalizeDateTime(other.lastUpdated),
    updated_by: other.updatedBy || null,
    notes: other.notes || null,
    project: other.project || null,
    notes1: other.notes1 || null,
    notes2: other.notes2 || null,
    notes3: other.notes3 || null,
    notes4: other.notes4 || null,
    notes5: other.notes5 || null,
  };
}

// ============================================================================
// BULK OPERATIONS WITH TRANSFORMATION
// ============================================================================

export async function bulkUpsertPcsToGraphQL(assets: PcAsset[]): Promise<{ 
  success: boolean; 
  error?: string; 
  summary?: { pcs: number; monitors: number; phones: number; others: number; }
}> {
  try {
    // Transform frontend assets to GraphQL format
    const transformedAssets = assets.map(transformFrontendToGraphQL);
    
    const response = await graphqlQuery(INVENTORY_QUERIES.BULK_UPSERT_ASSETS, {
      assets: transformedAssets
    });

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { success: false, error: response.errors[0]?.message };
    }

    return { 
      success: true, 
      summary: { pcs: assets.length, monitors: 0, phones: 0, others: 0 }
    };
  } catch (error) {
    console.error('Error bulk upserting PCs:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function bulkUpsertMonitorsToGraphQL(assets: MonitorAsset[]): Promise<{ 
  success: boolean; 
  error?: string; 
  summary?: { pcs: number; monitors: number; phones: number; others: number; }
}> {
  try {
    // Transform frontend assets to GraphQL format
    const transformedAssets = assets.map(transformFrontendToGraphQL);
    
    const response = await graphqlQuery(INVENTORY_QUERIES.BULK_UPSERT_ASSETS, {
      assets: transformedAssets
    });

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { success: false, error: response.errors[0]?.message };
    }

    return { 
      success: true, 
      summary: { pcs: 0, monitors: assets.length, phones: 0, others: 0 }
    };
  } catch (error) {
    console.error('Error bulk upserting monitors:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function bulkUpsertPhonesToGraphQL(assets: PhoneAsset[]): Promise<{ 
  success: boolean; 
  error?: string; 
  summary?: { pcs: number; monitors: number; phones: number; others: number; }
}> {
  try {
    // Transform frontend assets to GraphQL format
    const transformedAssets = assets.map(transformFrontendToGraphQL);
    
    const response = await graphqlQuery(INVENTORY_QUERIES.BULK_UPSERT_ASSETS, {
      assets: transformedAssets
    });

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { success: false, error: response.errors[0]?.message };
    }

    return { 
      success: true, 
      summary: { pcs: 0, monitors: 0, phones: assets.length, others: 0 }
    };
  } catch (error) {
    console.error('Error bulk upserting phones:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function bulkUpsertOthersToGraphQL(assets: OtherAsset[]): Promise<{ 
  success: boolean; 
  error?: string; 
  summary?: { pcs: number; monitors: number; phones: number; others: number; }
}> {
  try {
    // Transform frontend assets to GraphQL format
    const transformedAssets = assets.map(transformFrontendToGraphQL);
    
    const response = await graphqlQuery(INVENTORY_QUERIES.BULK_UPSERT_ASSETS, {
      assets: transformedAssets
    });

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { success: false, error: response.errors[0]?.message };
    }

    return { 
      success: true, 
      summary: { pcs: 0, monitors: 0, phones: 0, others: assets.length }
    };
  } catch (error) {
    console.error('Error bulk upserting others:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function bulkUpsertMixedAssetsToGraphQL(assets: FrontendAsset[]): Promise<{ 
  success: boolean; 
  error?: string; 
  summary?: { pcs: number; monitors: number; phones: number; others: number; }
}> {
  try {
    const BATCH_SIZE = 50; // Process 50 assets at a time to avoid memory issues
    const totalAssets = assets.length;
    let processedAssets = 0;
    let errors: string[] = [];

    // Processing assets in batches

    // Process assets in batches
    for (let i = 0; i < assets.length; i += BATCH_SIZE) {
      const batch = assets.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(assets.length / BATCH_SIZE);
      
      // Processing batch
      
      try {
        // Transform frontend assets to GraphQL format
        const transformedAssets = batch.map(transformFrontendToGraphQL);
        
        // Debug: Check if any asset_id is null
        const nullAssetIds = transformedAssets.filter(asset => !asset.assetId || asset.assetId.trim() === '');
        if (nullAssetIds.length > 0) {
          console.warn(`Batch ${batchNumber} has ${nullAssetIds.length} assets with null asset_id:`, nullAssetIds);
        }
        
        // Debug: Check for invalid user_id values (non-numeric or empty)
        const invalidUserIds = transformedAssets.filter(asset => 
          asset.user_id && 
          (isNaN(Number(asset.user_id)) || asset.user_id.trim() === '')
        );
        if (invalidUserIds.length > 0) {
          console.warn(`Batch ${batchNumber} has ${invalidUserIds.length} assets with invalid user_id:`, invalidUserIds);
        }
        
        const response = await graphqlQuery(INVENTORY_QUERIES.BULK_UPSERT_ASSETS, {
          assets: transformedAssets
        });

        if (response.errors) {
          console.error(`GraphQL errors in batch ${batchNumber}:`, response.errors);
          errors.push(`Batch ${batchNumber}: ${response.errors[0]?.message}`);
        } else {
          processedAssets += batch.length;
          // Batch completed successfully
        }
      } catch (batchError) {
        console.error(`Error in batch ${batchNumber}:`, batchError);
        errors.push(`Batch ${batchNumber}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`);
      }
    }

    // Count assets by type
    const summary = {
      pcs: assets.filter(asset => asset.type === 'pc').length,
      monitors: assets.filter(asset => asset.type === 'monitor').length,
      phones: assets.filter(asset => asset.type === 'phone').length,
      others: assets.filter(asset => asset.type === 'other').length
    };

    if (errors.length > 0) {
      console.warn(`Completed with ${errors.length} batch errors:`, errors);
      return { 
        success: processedAssets > 0, 
        error: `Processed ${processedAssets}/${totalAssets} assets. Errors: ${errors.join('; ')}`,
        summary 
      };
    }

    // Successfully processed all assets
    return { success: true, summary };
  } catch (error) {
    console.error('Error bulk upserting mixed assets:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

export async function deletePcFromGraphQL(assetId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.DELETE_ASSET, { asset_id: assetId });

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { success: false, error: response.errors[0]?.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting PC:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteMonitorFromGraphQL(assetId: string): Promise<{ success: boolean; error?: string }> {
  try { 
    const response = await graphqlQuery(INVENTORY_QUERIES.DELETE_ASSET, { asset_id: assetId });

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { success: false, error: response.errors[0]?.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting monitor:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deletePhoneFromGraphQL(assetId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.DELETE_ASSET, { asset_id: assetId });

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { success: false, error: response.errors[0]?.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting phone:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}




