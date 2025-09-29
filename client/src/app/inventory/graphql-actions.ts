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
import { type PcAsset, type MonitorAsset, type PhoneAsset } from './actions';
import { type PcFormValues } from '@/lib/schemas/inventory';

// GraphQL-based actions for inventory management

// Helper to convert camelCase keys to snake_case for server sort fields
function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
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
  first: number = 100,
  filters?: CommonFilters
): Promise<{ pcs: PcAsset[]; pagination: any; error: string | null }> {
  try {
    const variables: any = {
      type: 'pc',
      page,
      first,
    };

    // Only add defined filter values
    if (filters?.locations && filters.locations.length > 0) {
      variables.locations = filters.locations;
    }
    if (filters?.statuses && filters.statuses.length > 0) {
      variables.statuses = filters.statuses;
    }
    if (filters?.employee) {
      variables.employee_name = filters.employee;
    }
    if (filters?.global) {
      variables.global = filters.global;
    }
    if (filters?.details) {
      Object.assign(variables, mapDetailFilters(filters.details));
    }
    if (filters?.sort_field) {
      variables.sort_field = filters.sort_field;
    }
    if (filters?.sort_direction) {
      variables.sort_direction = filters.sort_direction;
    }

    const response = await graphqlQuery(INVENTORY_QUERIES.GET_ASSETS, variables);
    
    if (response.errors) {
      console.error('GraphQL errors for PCs:', response.errors);
      console.error('Variables sent:', variables);
      return { pcs: [], pagination: null, error: response.errors[0]?.message || 'GraphQL query failed' };
    }

    if (!response.data?.assets?.data) {
      return { pcs: [], pagination: null, error: 'No data received from GraphQL' };
    }

    const pcs = response.data.assets.data.map(transformGraphQLAssetToPcAsset);


    return { pcs, pagination: response.data.assets.paginatorInfo, error: null };
  } catch (error: any) {
    console.error('Error getting PCs from GraphQL:', error);
    return { pcs: [], pagination: null, error: error.message || 'Failed to fetch PCs' };
  }
}

export async function getMonitorsFromGraphQL(
  page: number = 1,
  first: number = 100,
  filters?: CommonFilters
): Promise<{ monitors: MonitorAsset[]; pagination: any; error: string | null }> {
  try {
    const variables: any = {
      type: 'monitor',
      page,
      first,
    };

    // Only add defined filter values
    if (filters?.locations && filters.locations.length > 0) {
      variables.locations = filters.locations;
    }
    if (filters?.statuses && filters.statuses.length > 0) {
      variables.statuses = filters.statuses;
    }
    if (filters?.employee) {
      variables.employee_name = filters.employee;
    }
    if (filters?.global) {
      variables.global = filters.global;
    }
    if (filters?.details) {
      Object.assign(variables, mapDetailFilters(filters.details));
    }
    if (filters?.sort_field) {
      variables.sort_field = filters.sort_field;
    }
    if (filters?.sort_direction) {
      variables.sort_direction = filters.sort_direction;
    }

    const response = await graphqlQuery(INVENTORY_QUERIES.GET_ASSETS, variables);
    
    if (response.errors) {
      console.error('GraphQL errors for Monitors:', response.errors);
      console.error('Variables sent:', variables);
      return { monitors: [], pagination: null, error: response.errors[0]?.message || 'GraphQL query failed' };
    }

    if (!response.data?.assets?.data) {
      return { monitors: [], pagination: null, error: 'No data received from GraphQL' };
    }

    const monitors = response.data.assets.data.map(transformGraphQLAssetToMonitorAsset);
    return { monitors, pagination: response.data.assets.paginatorInfo, error: null };
  } catch (error: any) {
    console.error('Error getting monitors from GraphQL:', error);
    return { monitors: [], pagination: null, error: error.message || 'Failed to fetch monitors' };
  }
}

export async function getPhonesFromGraphQL(
  page: number = 1,
  first: number = 100,
  filters?: CommonFilters
): Promise<{ phones: PhoneAsset[]; pagination: any; error: string | null }> {
  try {
    const variables: any = {
      type: 'smartphones',
      page,
      first,
    };

    // Only add defined filter values
    if (filters?.locations && filters.locations.length > 0) {
      variables.locations = filters.locations;
    }
    if (filters?.statuses && filters.statuses.length > 0) {
      variables.statuses = filters.statuses;
    }
    if (filters?.employee) {
      variables.employee_name = filters.employee;
    }
    if (filters?.global) {
      variables.global = filters.global;
    }
    if (filters?.details) {
      Object.assign(variables, mapDetailFilters(filters.details));
    }
    if (filters?.sort_field) {
      variables.sort_field = filters.sort_field;
    }
    if (filters?.sort_direction) {
      variables.sort_direction = filters.sort_direction;
    }

    const response = await graphqlQuery(INVENTORY_QUERIES.GET_ASSETS, variables);
    
    if (response.errors) {
      console.error('GraphQL errors for Smartphones:', response.errors);
      console.error('Variables sent:', variables);
      return { phones: [], pagination: null, error: response.errors[0]?.message || 'GraphQL query failed' };
    }

    if (!response.data?.assets?.data) {
      return { phones: [], pagination: null, error: 'No data received from GraphQL' };
    }

    const phones = response.data.assets.data.map(transformGraphQLAssetToPhoneAsset);
    return { phones, pagination: response.data.assets.paginatorInfo, error: null };
  } catch (error: any) {
    console.error('Error getting phones from GraphQL:', error);
    return { phones: [], pagination: null, error: error.message || 'Failed to fetch phones' };
  }
}

export async function getOthersFromGraphQL(
  page: number = 1,
  first: number = 100,
  commonFilters?: CommonFilters
): Promise<{ others: any[]; pagination: any; error: string | null }> {
  try {
    // For "others" assets, we need to exclude pc, monitor, and smartphones types
    // We'll use the exclude_types filter to get only "others" assets
    const variables: any = {
      page,
      first,
      // Exclude pc, monitor, and smartphones types to get only "others"
      exclude_types: ['pc', 'monitor', 'smartphones'],
    };

    // Apply common filters
    if (commonFilters?.locations && commonFilters.locations.length > 0) {
      variables.locations = commonFilters.locations;
    }
    if (commonFilters?.statuses && commonFilters.statuses.length > 0) {
      variables.statuses = commonFilters.statuses;
    }
    if (commonFilters?.employee) {
      variables.employee_name = commonFilters.employee;
    }
    if (commonFilters?.global) {
      variables.global = commonFilters.global;
    }
    if (commonFilters?.details) {
      // Map detailed filters to GraphQL variables
      for (const key in commonFilters.details) {
        if (commonFilters.details[key as keyof PcFormValues]) {
          variables[toSnakeCase(key)] = commonFilters.details[key as keyof PcFormValues];
        }
      }
    }
    if (commonFilters?.sort_field) {
      variables.sort_field = commonFilters.sort_field;
    }
    if (commonFilters?.sort_direction) {
      variables.sort_direction = commonFilters.sort_direction;
    }

    const response = await graphqlQuery(INVENTORY_QUERIES.GET_ASSETS, variables);

    if (response.errors) {
      console.error('GraphQL errors for Others:', response.errors);
      console.error('Variables sent:', variables);
      return { others: [], pagination: null, error: response.errors[0]?.message || 'GraphQL query failed' };
    }

    if (!response.data?.assets?.data) {
      return { others: [], pagination: null, error: 'No data received from GraphQL' };
    }

    // Transform the server-side filtered assets (already excludes pc, monitor, smartphones)
    const transformedOthersAssets = response.data.assets.data.map(transformGraphQLAssetToOtherAsset);

    // Return the server-side paginated results
      return {
        others: transformedOthersAssets,
      pagination: response.data.assets.paginatorInfo,
        error: null
      };
  } catch (error: any) {
    console.error('Error getting others from GraphQL:', error);
    return { others: [], pagination: null, error: error.message || 'Failed to fetch others' };
  }
}

export async function getAllAssetsFromGraphQL(page: number = 1, first: number = 100): Promise<{
  pcs: PcAsset[];
  monitors: MonitorAsset[];
  phones: PhoneAsset[];
  others: any[];
  pagination: { pcs: any; monitors: any; phones: any; others: any };
  error: string | null
}> {
  try {
    // Fetch all assets in parallel
    const [pcsResult, monitorsResult, phonesResult, othersResult] = await Promise.all([
      getPcsFromGraphQL(page, first),
      getMonitorsFromGraphQL(page, first),
      getPhonesFromGraphQL(page, first),
      getOthersFromGraphQL(page, first)
    ]);

    // Check for errors
    const errors = [pcsResult.error, monitorsResult.error, phonesResult.error, othersResult.error].filter(Boolean);
    if (errors.length > 0) {
      return {
        pcs: pcsResult.pcs,
        monitors: monitorsResult.monitors,
        phones: phonesResult.phones,
        others: othersResult.others,
        pagination: {
          pcs: pcsResult.pagination,
          monitors: monitorsResult.pagination,
          phones: phonesResult.pagination,
          others: othersResult.pagination
        },
        error: errors.join('; ')
      };
    }

    return {
      pcs: pcsResult.pcs,
      monitors: monitorsResult.monitors,
      phones: phonesResult.phones,
      others: othersResult.others,
      pagination: {
        pcs: pcsResult.pagination,
        monitors: monitorsResult.pagination,
        phones: phonesResult.pagination,
        others: othersResult.pagination
      },
      error: null
    };
  } catch (error: any) {
    console.error('Error getting all assets from GraphQL:', error);
    return {
      pcs: [],
      monitors: [],
      phones: [],
      others: [],
      pagination: { pcs: null, monitors: null, phones: null, others: null },
      error: error.message || 'Failed to fetch assets'
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
    // Get locations directly from the locations table
    const response = await graphqlQuery(`
      query GetLocations {
        locations {
          id
          name
        }
      }
    `);
    
    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { locations: [], error: response.errors[0]?.message || 'GraphQL query failed' };
    }

    if (!response.data?.locations) {
      return { locations: [], error: 'No data received from GraphQL' };
    }

    const locations = response.data.locations.map((location: any) => ({
      id: location.id,
      name: location.name
    }));
    
    return { locations, error: null };
  } catch (error: any) {
    console.error('Error getting locations from GraphQL:', error);
    return { locations: [], error: error.message || 'Failed to fetch locations' };
  }
}

export async function getProjectsFromGraphQL(): Promise<{ projects: { id: string; name: string; }[]; error: string | null }> {
  try {
    // Get projects directly from the projects table
    const response = await graphqlQuery(INVENTORY_QUERIES.GET_PROJECTS);
    
    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { projects: [], error: response.errors[0]?.message || 'GraphQL query failed' };
    }

    if (!response.data?.projects?.data) {
      return { projects: [], error: 'No data received from GraphQL' };
    }

    const projects = response.data.projects.data.map((project: any) => ({
      id: project.id,
      name: project.name
    }));
    return { projects, error: null };
  } catch (error: any) {
    console.error('Error getting projects from GraphQL:', error);
    return { projects: [], error: error.message || 'Failed to fetch projects' };
  }
}

export async function getMasterDataFromGraphQL(): Promise<{ 
  masterData: {
    projects: { id: string; name: string; }[];
    locations: { id: string; name: string; }[];
    employees: { id: string; name: string; }[];
    assetFields: any[];
  } | null; 
  error: string | null 
}> {
  try {
    // Fetch all master data in parallel
    const [projectsResult, locationsResult, employeesResult] = await Promise.all([
      getProjectsFromGraphQL(),
      getLocationsFromGraphQL(),
      getEmployeesFromGraphQL()
    ]);

    // Check for errors
    const errors = [projectsResult.error, locationsResult.error, employeesResult.error].filter(Boolean);
    if (errors.length > 0) {
      return {
        masterData: null,
        error: errors.join('; ')
      };
    }

    // For now, we'll use the local asset fields since GraphQL doesn't have asset fields yet
    // TODO: Implement asset fields from GraphQL
    const assetFields = [
      { id: 'field_01', order: 1, systemName: 'id', displayName: '管理番号', dataType: 'Text' as const, visible: true, notes: '一意の資産ID' },
      { id: 'field_08', order: 2, systemName: 'location', displayName: '所在', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_11', order: 3, systemName: 'userId', displayName: '利用者', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_09', order: 4, systemName: 'status', displayName: '状態', dataType: 'Text' as const, visible: true, notes: '例: 使用中, 保管中, 修理中, 廃棄済' },
      { id: 'field_02', order: 5, systemName: 'hostname', displayName: 'ホスト名', dataType: 'Text' as const, visible: true, notes: 'ネットワーク上のPC名' },
      { id: 'field_03', order: 6, systemName: 'manufacturer', displayName: 'メーカー', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_04', order: 7, systemName: 'model', displayName: '機種(M)', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_05', order: 8, systemName: 'partNumber', displayName: '型番(P/N)', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_06', order: 9, systemName: 'serialNumber', displayName: '製造番号(S/N)', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_07', order: 10, systemName: 'formFactor', displayName: '形状（識別子）', dataType: 'Text' as const, visible: true, notes: '例: Laptop, Desktop' },
      { id: 'field_10', order: 11, systemName: 'previousUser', displayName: '旧利用者', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_12', order: 12, systemName: 'os', displayName: 'OS', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_13', order: 13, systemName: 'osBit', displayName: 'OS bit', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_14', order: 14, systemName: 'officeSuite', displayName: 'OFFICE', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_15', order: 15, systemName: 'softwareLicenseKey', displayName: 'soft key', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_16', order: 16, systemName: 'wiredMacAddress', displayName: '有線（MACアドレス）', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_17', order: 17, systemName: 'wiredIpAddress', displayName: '有線 IPアドレス', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_18', order: 18, systemName: 'wirelessMacAddress', displayName: '無線（MACアドレス）', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_19', order: 19, systemName: 'wirelessIpAddress', displayName: '無線 IPアドレス', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_20', order: 20, systemName: 'usageStartDate', displayName: '利用開始日', dataType: 'Date' as const, visible: true, notes: '' },
      { id: 'field_21', order: 21, systemName: 'usageEndDate', displayName: '利用終了日', dataType: 'Date' as const, visible: true, notes: '' },
      { id: 'field_22', order: 22, systemName: 'carryInOutAgreement', displayName: '持出持込誓約', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_23', order: 23, systemName: 'lastUpdated', displayName: '更新日', dataType: 'Date' as const, visible: true, notes: '' },
      { id: 'field_24', order: 24, systemName: 'updatedBy', displayName: '更新者', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_25', order: 25, systemName: 'notes', displayName: '備考', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_26', order: 26, systemName: 'purchaseDate', displayName: '購入日', dataType: 'Date' as const, visible: true, notes: '' },
      { id: 'field_27', order: 27, systemName: 'purchasePrice', displayName: '購入価格（税込）', dataType: 'Number' as const, visible: true, notes: '' },
      { id: 'field_28', order: 28, systemName: 'depreciationYears', displayName: '償却年数', dataType: 'Number' as const, visible: true, notes: '' },
      { id: 'field_29', order: 29, systemName: 'depreciationDept', displayName: '償却部署', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_30', order: 30, systemName: 'cpu', displayName: 'CPU', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_31', order: 31, systemName: 'memory', displayName: 'MEM', dataType: 'Text' as const, visible: true, notes: '' },
      { id: 'field_32', order: 32, systemName: 'notes1', displayName: '備考1', dataType: 'Text' as const, visible: true, notes: 'カスタム備考1' },
      { id: 'field_33', order: 33, systemName: 'notes2', displayName: '備考2', dataType: 'Text' as const, visible: true, notes: 'カスタム備考2' },
      { id: 'field_34', order: 34, systemName: 'notes3', displayName: '備考3', dataType: 'Text' as const, visible: true, notes: 'カスタム備考3' },
      { id: 'field_35', order: 35, systemName: 'notes4', displayName: '備考4', dataType: 'Text' as const, visible: true, notes: 'カスタム備考4' },
      { id: 'field_36', order: 36, systemName: 'notes5', displayName: '備考5', dataType: 'Text' as const, visible: true, notes: 'カスタム備考5' },
    ];

    return {
      masterData: {
        projects: projectsResult.projects,
        locations: locationsResult.locations,
        employees: employeesResult.employees,
        assetFields: assetFields
      },
      error: null
    };
  } catch (error: any) {
    console.error('Error getting master data from GraphQL:', error);
    return {
      masterData: null,
      error: error.message || 'Failed to fetch master data'
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

// Convert PcFormValues/PcAsset shaped object to GraphQL AssetInput (snake_case)
function toGraphQLAssetInput(pc: any): any {
  // Filter out any 'user' field to prevent conflicts with user_id
  const { user, ...filteredPc } = pc;
  
  return {
    asset_id: filteredPc.id,
    type: 'pc',
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
    user_id: filteredPc.userId || null,
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
  return {
    asset_id: monitor.id,
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
    user_id: monitor.userId || null,
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
  return {
    asset_id: phone.id,
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
    user_id: phone.userId || null,
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
  return {
    asset_id: other.id,
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
    user_id: other.userId || null,
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

export async function bulkUpsertPcsToGraphQL(pcs: any[]): Promise<{ success: boolean; error: string | null }>{
  try {
    const assets = pcs.map(toGraphQLAssetInput);
    const response = await graphqlQuery(INVENTORY_QUERIES.BULK_UPSERT_ASSETS, { assets });
    if (response.errors) {
      return { success: false, error: response.errors[0]?.message || 'GraphQL mutation failed' };
    }
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Bulk upsert failed' };
  }
}

export async function bulkUpsertMonitorsToGraphQL(monitors: any[]): Promise<{ success: boolean; error: string | null }>{
  try {
    const assets = monitors.map(toGraphQLMonitorInput);
    const response = await graphqlQuery(INVENTORY_QUERIES.BULK_UPSERT_ASSETS, { assets });
    if (response.errors) {
      return { success: false, error: response.errors[0]?.message || 'GraphQL mutation failed' };
    }
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Bulk upsert failed' };
  }
}

export async function bulkUpsertPhonesToGraphQL(phones: any[]): Promise<{ success: boolean; error: string | null }>{
  try {
    const assets = phones.map(toGraphQLPhoneInput);
    const response = await graphqlQuery(INVENTORY_QUERIES.BULK_UPSERT_ASSETS, { assets });
    if (response.errors) {
      return { success: false, error: response.errors[0]?.message || 'GraphQL mutation failed' };
    }
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Bulk upsert failed' };
  }
}

export async function bulkUpsertOthersToGraphQL(others: any[]): Promise<{ success: boolean; error: string | null }>{
  try {
    const assets = others.map(toGraphQLOthersInput);
    const response = await graphqlQuery(INVENTORY_QUERIES.BULK_UPSERT_ASSETS, { assets });
    if (response.errors) {
      return { success: false, error: response.errors[0]?.message || 'GraphQL mutation failed' };
    }
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Bulk upsert failed' };
  }
}

export async function upsertPcToGraphQL(pc: any): Promise<{ success: boolean; error: string | null }>{
  try {
    const asset = toGraphQLAssetInput(pc);
    const response = await graphqlQuery(INVENTORY_QUERIES.UPSERT_ASSET, { asset });
    if (response.errors) {
      return { success: false, error: response.errors[0]?.message || 'GraphQL mutation failed' };
    }
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Upsert failed' };
  }
}

export async function upsertMonitorToGraphQL(monitor: any): Promise<{ success: boolean; error: string | null }>{
  try {
    const asset = toGraphQLMonitorInput(monitor);
    const response = await graphqlQuery(INVENTORY_QUERIES.UPSERT_ASSET, { asset });
    if (response.errors) {
      return { success: false, error: response.errors[0]?.message || 'GraphQL mutation failed' };
    }
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Upsert failed' };
  }
}

export async function upsertPhoneToGraphQL(phone: any): Promise<{ success: boolean; error: string | null }>{
  try {
    const asset = toGraphQLPhoneInput(phone);
    const response = await graphqlQuery(INVENTORY_QUERIES.UPSERT_ASSET, { asset });
    if (response.errors) {
      return { success: false, error: response.errors[0]?.message || 'GraphQL mutation failed' };
    }
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Upsert failed' };
  }
}

export async function deletePcFromGraphQL(pcId: string): Promise<{ success: boolean; error: string | null }>{
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.DELETE_ASSET, { asset_id: pcId });
    if (response.errors) {
      return { success: false, error: response.errors[0]?.message || 'GraphQL mutation failed' };
    }
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Delete failed' };
  }
}

export async function deleteMonitorFromGraphQL(monitorId: string): Promise<{ success: boolean; error: string | null }>{
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.DELETE_ASSET, { asset_id: monitorId });
    if (response.errors) {
      return { success: false, error: response.errors[0]?.message || 'GraphQL mutation failed' };
    }
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Delete failed' };
  }
}

export async function deletePhoneFromGraphQL(phoneId: string): Promise<{ success: boolean; error: string | null }>{
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.DELETE_ASSET, { asset_id: phoneId });
    if (response.errors) {
      return { success: false, error: response.errors[0]?.message || 'GraphQL mutation failed' };
    }
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Delete failed' };
  }
}

// Comprehensive bulk upsert function that handles mixed asset types
export async function bulkUpsertMixedAssetsToGraphQL(assets: any[]): Promise<{ 
  success: boolean; 
  error: string | null;
  summary: {
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
  };
}> {
  try {
    // Separate assets by type with intelligent detection
    const pcs: any[] = [];
    const monitors: any[] = [];
    const phones: any[] = [];
    const others: any[] = [];
    const errors: string[] = [];

    assets.forEach((asset, index) => {
      // Check the type column from import data - preserve original case for Japanese
      const assetType = asset.type?.trim();


      if (assetType) {
        // Type column is present, categorize based on it (preserve original types)
        const lowerType = assetType.toLowerCase();

        // Check for PC types (exact matches only)
        if (lowerType === 'pc') {
          pcs.push({ ...asset, type: assetType }); // Preserve original type
        }
        // Check for Monitor types (exact matches only)
        else if (lowerType === 'monitor') {
          monitors.push({ ...asset, type: assetType }); // Preserve original type
        }
        // Check for Smartphone types (exact matches only)
        else if (lowerType === 'smartphones') {
          phones.push({ ...asset, type: assetType }); // Preserve original type
        }
        // Check for Others types (exact matches only)
        else if (lowerType === 'others') {
          others.push({ ...asset, type: assetType }); // Preserve original type
        }
        // All other types go to Others tab but keep their original type value
        else {
          others.push({ ...asset, type: assetType }); // Preserve original type like "printer", "scanner"
        }
      } else {
        // No type column provided, categorize as others
        others.push({ ...asset, type: 'others' });
      }
    });


    // Perform bulk upserts for each type
    const results = await Promise.allSettled([
      pcs.length > 0 ? bulkUpsertPcsToGraphQL(pcs) : Promise.resolve({ success: true, error: null }),
      monitors.length > 0 ? bulkUpsertMonitorsToGraphQL(monitors) : Promise.resolve({ success: true, error: null }),
      phones.length > 0 ? bulkUpsertPhonesToGraphQL(phones) : Promise.resolve({ success: true, error: null }),
      others.length > 0 ? bulkUpsertOthersToGraphQL(others) : Promise.resolve({ success: true, error: null })
    ]);

    // Check results
    const [pcsResult, monitorsResult, phonesResult, othersResult] = results;
    
    if (pcsResult.status === 'rejected' || (pcsResult.status === 'fulfilled' && !pcsResult.value.success)) {
      errors.push(`PCs: ${pcsResult.status === 'rejected' ? pcsResult.reason : pcsResult.value.error}`);
    }
    
    if (monitorsResult.status === 'rejected' || (monitorsResult.status === 'fulfilled' && !monitorsResult.value.success)) {
      errors.push(`Monitors: ${monitorsResult.status === 'rejected' ? monitorsResult.reason : monitorsResult.value.error}`);
    }
    
    if (phonesResult.status === 'rejected' || (phonesResult.status === 'fulfilled' && !phonesResult.value.success)) {
      errors.push(`Phones: ${phonesResult.status === 'rejected' ? phonesResult.reason : phonesResult.value.error}`);
    }

    if (othersResult.status === 'rejected' || (othersResult.status === 'fulfilled' && !othersResult.value.success)) {
      errors.push(`Others: ${othersResult.status === 'rejected' ? othersResult.reason : othersResult.value.error}`);
    }

    const success = errors.length === 0;
    
    return {
      success,
      error: success ? null : errors.join('; '),
      summary: {
        total: assets.length,
        pcs: pcs.length,
        monitors: monitors.length,
        phones: phones.length,
        others: others.length,
        errors,
        categorizationDetails: {
          pcs: pcs.map(pc => `${pc.manufacturer} ${pc.model}`),
          monitors: monitors.map(monitor => `${monitor.manufacturer} ${monitor.model}`),
          phones: phones.map(phone => `${phone.manufacturer} ${phone.model}`),
          others: others.map(other => `${other.manufacturer} ${other.model}`)
        }
      }
    };
  } catch (e: any) {
    return {
      success: false,
      error: e.message || 'Bulk upsert failed',
      summary: {
        total: assets.length,
        pcs: 0,
        monitors: 0,
        phones: 0,
        others: 0,
        errors: [e.message || 'Unknown error'],
        categorizationDetails: {
          pcs: [],
          monitors: [],
          phones: [],
          others: []
        }
      }
    };
  }
}



