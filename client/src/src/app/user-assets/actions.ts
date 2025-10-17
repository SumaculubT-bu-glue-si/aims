import { graphqlQuery, INVENTORY_QUERIES, transformGraphQLAssetToPcAsset, transformGraphQLAssetToMonitorAsset, transformGraphQLAssetToPhoneAsset } from "@/lib/graphql-client";

export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email?: string;
  location?: string;
}

export interface Asset {
  id: string;
  asset_id: string;
  type: string;
  hostname?: string;
  manufacturer?: string;
  model?: string;
  part_number?: string;
  serial_number?: string;
  form_factor?: string;
  os?: string;
  os_bit?: string;
  office_suite?: string;
  software_license_key?: string;
  wired_mac_address?: string;
  wired_ip_address?: string;
  wireless_mac_address?: string;
  wireless_ip_address?: string;
  purchase_date?: string;
  purchase_price?: number;
  depreciation_years?: number;
  depreciation_dept?: string;
  cpu?: string;
  memory?: string;
  location?: string;
  status?: string;
  previous_user?: string;
  user_id?: string;
  employee?: Employee;
  usage_start_date?: string;
  usage_end_date?: string;
  carry_in_out_agreement?: string;
  last_updated?: string;
  updated_by?: string;
  notes?: string;
  project?: string;
  notes1?: string;
  notes2?: string;
  notes3?: string;
  notes4?: string;
  notes5?: string;
}

// Interface for GraphQL asset data (raw data from API)
interface GraphQLAsset {
  id: string;
  asset_id: string;
  type: string;
  hostname?: string;
  manufacturer?: string;
  model?: string;
  part_number?: string;
  serial_number?: string;
  form_factor?: string;
  os?: string;
  os_bit?: string;
  office_suite?: string;
  software_license_key?: string;
  wired_mac_address?: string;
  wired_ip_address?: string;
  wireless_mac_address?: string;
  wireless_ip_address?: string;
  purchase_date?: string;
  purchase_price?: number;
  depreciation_years?: number;
  depreciation_dept?: string;
  cpu?: string;
  memory?: string;
  location?: string;
  status?: string;
  previous_user?: string;
  user_id?: string;
  employee?: Employee;
  usage_start_date?: string;
  usage_end_date?: string;
  carry_in_out_agreement?: string;
  last_updated?: string;
  updated_by?: string;
  notes?: string;
  project?: string;
  notes1?: string;
  notes2?: string;
  notes3?: string;
  notes4?: string;
  notes5?: string;
}

export interface AssetsResult {
  assets?: Asset[];
  error?: string;
}

export async function getAssets(filters?: {
  type?: string;
  status?: string;
  location?: string;
  user_id?: string;
}): Promise<AssetsResult> {
  try {
    const variables: any = {};
    if (filters?.type) variables.type = filters.type;
    if (filters?.status) variables.status = filters.status;
    if (filters?.location) variables.location = filters.location;
    if (filters?.user_id) variables.user_id = filters.user_id;

    const result = await graphqlQuery(INVENTORY_QUERIES.GET_ASSETS, variables);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return { error: result.errors[0]?.message || 'Failed to fetch assets' };
    }

    if (!result.data?.assets?.data) {
      return { assets: [] };
    }

    // Transform GraphQL data to match our Asset interface
    const assets = result.data.assets.data.map((asset: any) => ({
      id: asset.id,
      asset_id: asset.asset_id,
      type: asset.type,
      hostname: asset.hostname,
      manufacturer: asset.manufacturer,
      model: asset.model,
      part_number: asset.part_number,
      serial_number: asset.serial_number,
      form_factor: asset.form_factor,
      os: asset.os,
      os_bit: asset.os_bit,
      office_suite: asset.office_suite,
      software_license_key: asset.software_license_key,
      wired_mac_address: asset.wired_mac_address,
      wired_ip_address: asset.wired_ip_address,
      wireless_mac_address: asset.wireless_mac_address,
      wireless_ip_address: asset.wireless_ip_address,
      purchase_date: asset.purchase_date,
      purchase_price: asset.purchase_price,
      depreciation_years: asset.depreciation_years,
      depreciation_dept: asset.depreciation_dept,
      cpu: asset.cpu,
      memory: asset.memory,
      location: asset.location,
      status: asset.status,
      previous_user: asset.previous_user,
      user_id: asset.user_id,
      employee: asset.employee,
      usage_start_date: asset.usage_start_date,
      usage_end_date: asset.usage_end_date,
      carry_in_out_agreement: asset.carry_in_out_agreement,
      last_updated: asset.last_updated,
      updated_by: asset.updated_by,
      notes: asset.notes,
      project: asset.project,
      notes1: asset.notes1,
      notes2: asset.notes2,
      notes3: asset.notes3,
      notes4: asset.notes4,
      notes5: asset.notes5,
    }));

    return { assets };
  } catch (error) {
    console.error('Error fetching assets:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to fetch assets' 
    };
  }
}

export async function getAssetsByUser(userId: string): Promise<AssetsResult> {
  return getAssets({ user_id: userId });
}

export async function getAssetsByLocation(location: string): Promise<AssetsResult> {
  return getAssets({ location });
}

export async function getAssetsByStatus(status: string): Promise<AssetsResult> {
  return getAssets({ status });
}

export async function getAssetsByType(type: string): Promise<AssetsResult> {
  return getAssets({ type });
}

export async function updateAsset(assetId: string, updateData: Partial<Asset>): Promise<{ success: boolean; error?: string }> {
  try {
    const mutation = `
      mutation UpdateAsset($asset: AssetInput!) {
        upsertAsset(asset: $asset) {
          id
          asset_id
          type
          model
          location
          status
          user_id
          usage_start_date
          usage_end_date
          notes
        }
      }
    `;

    // Build the asset object with only the fields that are provided
    const assetInput: any = {
      asset_id: assetId,
    };
    
    // Only add fields that are actually provided in updateData
    if (updateData.type !== undefined) assetInput.type = updateData.type;
    if (updateData.model !== undefined) assetInput.model = updateData.model;
    if (updateData.location !== undefined) assetInput.location = updateData.location;
    if (updateData.status !== undefined) assetInput.status = updateData.status;
    if (updateData.user_id !== undefined) assetInput.user_id = updateData.user_id;
    if (updateData.usage_start_date !== undefined) assetInput.usage_start_date = updateData.usage_start_date;
    if (updateData.usage_end_date !== undefined) assetInput.usage_end_date = updateData.usage_end_date;
    if (updateData.notes !== undefined) assetInput.notes = updateData.notes;

    const variables = {
      asset: assetInput
    };

    const result = await graphqlQuery(mutation, variables);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return { success: false, error: result.errors[0]?.message || 'Failed to update asset' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating asset:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update asset' 
    };
  }
}

export async function getAssetsOptimized(filters?: {
  type?: string;
  status?: string;
  location?: string;
  user_id?: string;
  page?: number;
  perPage?: number;
  onlyAssigned?: boolean; // Only fetch assets that are assigned to users
}): Promise<AssetsResult> {
  try {
    const variables: any = {
      first: filters?.perPage || 50, // Default to 50 items per page
      page: filters?.page || 1,
    };
    
    if (filters?.type) variables.type = filters.type;
    if (filters?.status) variables.status = filters.status;
    if (filters?.location) variables.location = filters.location;
    if (filters?.user_id) variables.user_id = filters.user_id;

    const result = await graphqlQuery(INVENTORY_QUERIES.GET_ASSETS, variables);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return { error: result.errors[0]?.message || 'Failed to fetch assets' };
    }

    if (!result.data?.assets?.data) {
      return { assets: [] };
    }

    let assets = result.data.assets.data.map((asset: any) => ({
      id: asset.id,
      asset_id: asset.asset_id,
      type: asset.type,
      hostname: asset.hostname,
      manufacturer: asset.manufacturer,
      model: asset.model,
      part_number: asset.part_number,
      serial_number: asset.serial_number,
      form_factor: asset.form_factor,
      os: asset.os,
      os_bit: asset.os_bit,
      office_suite: asset.office_suite,
      software_license_key: asset.software_license_key,
      wired_mac_address: asset.wired_mac_address,
      wired_ip_address: asset.wired_ip_address,
      wireless_mac_address: asset.wireless_mac_address,
      wireless_ip_address: asset.wireless_ip_address,
      purchase_date: asset.purchase_date,
      purchase_price: asset.purchase_price,
      depreciation_years: asset.depreciation_years,
      depreciation_dept: asset.depreciation_dept,
      cpu: asset.cpu,
      memory: asset.memory,
      location: asset.location,
      status: asset.status,
      previous_user: asset.previous_user,
      user_id: asset.user_id,
      employee: asset.employee,
      usage_start_date: asset.usage_start_date,
      usage_end_date: asset.usage_end_date,
      carry_in_out_agreement: asset.carry_in_out_agreement,
      last_updated: asset.last_updated,
      updated_by: asset.updated_by,
      notes: asset.notes,
      project: asset.project,
      notes1: asset.notes1,
      notes2: asset.notes2,
      notes3: asset.notes3,
      notes4: asset.notes4,
      notes5: asset.notes5,
    }));

    // Filter for only assigned assets if requested
    if (filters?.onlyAssigned) {
      assets = assets.filter((asset: Asset) => asset.user_id && asset.user_id.trim() !== '');
    }

    return { assets };
  } catch (error) {
    console.error('Error fetching assets:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to fetch assets' 
    };
  }
}

export async function getAvailableAssets(filters?: {
  type?: string;
  status?: string;
  location?: string;
  page?: number;
  perPage?: number;
}): Promise<AssetsResult> {
  // This fetches only assets that are NOT assigned to any user
  try {
    const perPage = filters?.perPage || 1000; // Use a larger default to get more assets
    let allAssets: GraphQLAsset[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    // Fetch all pages to get all available assets
    while (hasMorePages) {
      const variables: any = {
        first: perPage,
        page: currentPage,
      };
      
      if (filters?.type) variables.type = filters.type;
      if (filters?.status) variables.status = filters.status;
      if (filters?.location) variables.location = filters.location;

      const result = await graphqlQuery(INVENTORY_QUERIES.GET_ASSETS, variables);

      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        return { error: result.errors[0]?.message || 'Failed to fetch available assets' };
      }

      if (!result.data?.assets?.data) {
        break;
      }

      // Add assets from this page
      allAssets = allAssets.concat(result.data.assets.data);

      // Check if there are more pages
      const paginatorInfo = result.data.assets.paginatorInfo;
      hasMorePages = paginatorInfo?.hasMorePages || false;
      currentPage++;

      // Safety check to prevent infinite loops
      if (currentPage > 50) {
        console.warn('Stopping pagination after 50 pages to prevent infinite loop');
        break;
      }
    }

    // Filter for only unassigned assets
    const availableAssets = allAssets
      .filter((asset: GraphQLAsset): boolean => !asset.user_id || asset.user_id.trim() === '')
      .map((asset: GraphQLAsset): Asset => ({
        id: asset.id,
        asset_id: asset.asset_id,
        type: asset.type,
        hostname: asset.hostname,
        manufacturer: asset.manufacturer,
        model: asset.model,
        part_number: asset.part_number,
        serial_number: asset.serial_number,
        form_factor: asset.form_factor,
        os: asset.os,
        os_bit: asset.os_bit,
        office_suite: asset.office_suite,
        software_license_key: asset.software_license_key,
        wired_mac_address: asset.wired_mac_address,
        wired_ip_address: asset.wired_ip_address,
        wireless_mac_address: asset.wireless_mac_address,
        wireless_ip_address: asset.wireless_ip_address,
        purchase_date: asset.purchase_date,
        purchase_price: asset.purchase_price,
        depreciation_years: asset.depreciation_years,
        depreciation_dept: asset.depreciation_dept,
        cpu: asset.cpu,
        memory: asset.memory,
        location: asset.location,
        status: asset.status,
        previous_user: asset.previous_user,
        user_id: asset.user_id,
        employee: asset.employee,
        usage_start_date: asset.usage_start_date,
        usage_end_date: asset.usage_end_date,
        carry_in_out_agreement: asset.carry_in_out_agreement,
        last_updated: asset.last_updated,
        updated_by: asset.updated_by,
        notes: asset.notes,
        project: asset.project,
        notes1: asset.notes1,
        notes2: asset.notes2,
        notes3: asset.notes3,
        notes4: asset.notes4,
        notes5: asset.notes5,
      }));

    return { assets: availableAssets };
  } catch (error) {
    console.error('Error fetching available assets:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to fetch available assets' 
    };
  }
}
