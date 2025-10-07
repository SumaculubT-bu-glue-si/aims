// GraphQL client utility for communicating with Laravel GraphQL API
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://assetwise.glue-si.com/api/graphql';


// Type definitions for GraphQL operations
export interface EmployeeInput {
  employee_id: string;
  name: string;
  email?: string;
  location?: string;
  projects?: string[];
}

export interface ProjectInput {
  name: string;
  description?: string;
  visible?: boolean;
  order?: number;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export async function graphqlQuery<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('GraphQL query error:', error);
    return {
      errors: [
        {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      ],
    };
  }
}

// Normalize status values coming from server to canonical internal values (Japanese)
function normalizeStatus(value: any): string {
  if (!value || typeof value !== 'string') return '';
  const v = value.trim();

  // Keep Japanese statuses as-is since frontend expects them
  if (v === '???') return '???';
  if (v === '??') return '??';
  if (v === '??(???)') return '??(???)';
  if (v === '???') return '???';
  if (v === '???') return '???';
  if (v === '???') return '???';
  if (v === '???') return '???';
  if (v === '????') return '????';

  // Common English variations - convert to Japanese equivalents
  const lower = v.toLowerCase();
  if (lower === 'returned') return '???';
  if (lower === 'abolished') return '??';
  if (lower === 'stored - not in use') return '??(???)';
  if (lower === 'in use') return '???';
  if (lower === 'in storage') return '???';
  if (lower === 'on loan') return '???';
  if (lower === 'broken') return '???';
  if (lower === 'reserved for use') return '????';

  return v; // fallback to original
}

// Common GraphQL queries for inventory management
export const INVENTORY_QUERIES = {
  // Get all assets with filtering
  GET_ASSETS: `
    query GetAssets(
      $type: String,
      $exclude_types: [String!],
      $statuses: [String!],
      $locations: [String!],
      $user_id: ID,
      $employee_name: String,
      $asset_id: String,
      $hostname: String,
      $manufacturer: String,
      $model: String,
      $part_number: String,
      $serial_number: String,
      $form_factor: String,
      $os: String,
      $os_bit: String,
      $office_suite: String,
      $software_license_key: String,
      $wired_mac_address: String,
      $wired_ip_address: String,
      $wireless_mac_address: String,
      $wireless_ip_address: String,
      $previous_user: String,
      $project: String,
      $notes: String,
      $notes1: String,
      $notes2: String,
      $notes3: String,
      $notes4: String,
      $notes5: String,
      $cpu: String,
      $memory: String,
      $global: String,
      $first: Int = 100,
      $page: Int = 1,
      $sort_field: String,
      $sort_direction: String
    ) {
      assets(
        type: $type,
        exclude_types: $exclude_types,
        statuses: $statuses,
        locations: $locations,
        user_id: $user_id,
        employee_name: $employee_name,
        asset_id: $asset_id,
        hostname: $hostname,
        manufacturer: $manufacturer,
        model: $model,
        part_number: $part_number,
        serial_number: $serial_number,
        form_factor: $form_factor,
        os: $os,
        os_bit: $os_bit,
        office_suite: $office_suite,
        software_license_key: $software_license_key,
        wired_mac_address: $wired_mac_address,
        wired_ip_address: $wired_ip_address,
        wireless_mac_address: $wireless_mac_address,
        wireless_ip_address: $wireless_ip_address,
        previous_user: $previous_user,
        project: $project,
        notes: $notes,
        notes1: $notes1,
        notes2: $notes2,
        notes3: $notes3,
        notes4: $notes4,
        notes5: $notes5,
        cpu: $cpu,
        memory: $memory,
        global: $global,
        first: $first,
        page: $page,
        sort_field: $sort_field,
        sort_direction: $sort_direction
      ) {
        data {
          id
          asset_id
          type
          hostname
          manufacturer
          model
          part_number
          serial_number
          form_factor
          os
          os_bit
          office_suite
          software_license_key
          wired_mac_address
          wired_ip_address
          wireless_mac_address
          wireless_ip_address
          purchase_date
          purchase_price
          depreciation_years
          depreciation_dept
          cpu
          memory
          location
          status
          previous_user
          user_id
          employee {
            id
            employee_id
            name
            email
            location
          }
          usage_start_date
          usage_end_date
          carry_in_out_agreement
          last_updated
          updated_by
          notes
          project
          notes1
          notes2
          notes3
          notes4
          notes5
        }
        paginatorInfo {
          count
          currentPage
          firstItem
          hasMorePages
          lastPage
          perPage
          total
        }
      }
    }
  `,

  // Get all employees
  GET_EMPLOYEES: `
    query GetEmployees($name: String, $first: Int = 1000) {
      employees(name: $name, first: $first) {
        data {
          id
          employee_id
          name
          email
          location
          projects
        }
        paginatorInfo {
          count
          currentPage
          firstItem
          hasMorePages
          lastPage
          perPage
          total
        }
      }
    }
  `,

  // Get all projects
  GET_PROJECTS: `
    query GetProjects($name: String, $first: Int = 1000) {
      projects(name: $name, first: $first) {
        data {
          id
          name
          description
          visible
          order
        }
        paginatorInfo {
          count
          currentPage
          firstItem
          hasMorePages
          lastPage
          perPage
          total
        }
      }
    }
  `,

  // Get all loans
  GET_LOANS: `
    query GetLoans($status: String, $asset_id: String, $employee_id: String, $first: Int = 1000) {
      loans(status: $status, asset_id: $asset_id, employee_id: $employee_id, first: $first) {
        data {
          id
          loan_id
          asset_id
          employee_id
          loan_date
          expected_return_date
          actual_return_date
          status
        }
        paginatorInfo {
          count
          currentPage
          firstItem
          hasMorePages
          lastPage
          perPage
          total
        }
      }
    }
  `,

  // Get single asset by ID
  GET_ASSET: `
    query GetAsset($id: ID!) {
      asset(id: $id) {
        id
        asset_id
        type
        hostname
        manufacturer
        model
        part_number
        serial_number
        form_factor
        os
        os_bit
        office_suite
        software_license_key
        wired_mac_address
        wired_ip_address
        wireless_mac_address
        wireless_ip_address
        purchase_date
        purchase_price
        depreciation_years
        depreciation_dept
        cpu
        memory
        location
        status
        previous_user
        user_id
        employee {
          id
          name
        }
        usage_start_date
        usage_end_date
        carry_in_out_agreement
        last_updated
        updated_by
        notes
        project
        notes1
        notes2
        notes3
        notes4
        notes5
      }
    }
  `,

  // Upsert a single asset
  UPSERT_ASSET: `
    mutation UpsertAsset($asset: AssetInput!) {
      upsertAsset(asset: $asset) {
        id
        asset_id
      }
    }
  `,

  // Bulk upsert assets
  BULK_UPSERT_ASSETS: `
    mutation BulkUpsertAssets($assets: [AssetInput!]!) {
      bulkUpsertAssets(assets: $assets) {
        id
        asset_id
      }
    }
  `,

  // Delete an asset
  DELETE_ASSET: `
    mutation DeleteAsset($asset_id: String!) {
      deleteAsset(asset_id: $asset_id)
    }
  `,

  // Employee mutations
  CREATE_EMPLOYEE: `
    mutation CreateEmployee($employee: EmployeeInput!) {
      createEmployee(employee: $employee) {
        id
        employee_id
        name
        email
        location
        projects
      }
    }
  `,

  UPDATE_EMPLOYEE: `
    mutation UpdateEmployee($id: ID!, $employee: EmployeeInput!) {
      updateEmployee(id: $id, employee: $employee) {
        id
        employee_id
        name
        email
        location
        projects
      }
    }
  `,

  DELETE_EMPLOYEE: `
    mutation DeleteEmployee($id: ID!) {
      deleteEmployee(id: $id)
    }
  `,

  UPSERT_EMPLOYEE: `
    mutation UpsertEmployee($employee: EmployeeInput!) {
      upsertEmployee(employee: $employee) {
        id
        employee_id
        name
        email
        location
        projects
      }
    }
  `,

  BULK_UPSERT_EMPLOYEES: `
    mutation BulkUpsertEmployees($employees: [EmployeeInput!]!) {
      bulkUpsertEmployees(employees: $employees) {
        id
        employee_id
        name
        email
        location
        projects
      }
    }
  `,

  // Project mutations
  CREATE_PROJECT: `
    mutation CreateProject($project: ProjectInput!) {
      createProject(project: $project) {
        id
        name
        description
        visible
        order
      }
    }
  `,

  UPDATE_PROJECT: `
    mutation UpdateProject($id: ID!, $project: ProjectInput!) {
      updateProject(id: $id, project: $project) {
        id
        name
        description
        visible
        order
      }
    }
  `,

  DELETE_PROJECT: `
    mutation DeleteProject($id: ID!) {
      deleteProject(id: $id)
    }
  `,

  UPSERT_PROJECT: `
    mutation UpsertProject($project: ProjectInput!) {
      upsertProject(project: $project) {
        id
        name
        description
        visible
        order
      }
    }
  `,

  BULK_UPSERT_PROJECTS: `
    mutation BulkUpsertProjects($projects: [ProjectInput!]!) {
      bulkUpsertProjects(projects: $projects) {
        id
        name
        description
        visible
        order
      }
    }
  `,

  // Location mutations
  CREATE_LOCATION: `
    mutation CreateLocation($location: LocationInput!) {
      createLocation(location: $location) {
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
  `,

  UPDATE_LOCATION: `
    mutation UpdateLocation($id: ID!, $location: LocationInput!) {
      updateLocation(id: $id, location: $location) {
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
  `,

  DELETE_LOCATION: `
    mutation DeleteLocation($id: ID!) {
      deleteLocation(id: $id)
    }
  `,

  UPSERT_LOCATION: `
    mutation UpsertLocation($location: LocationInput!) {
      upsertLocation(location: $location) {
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
  `,
};

// Helper function to transform GraphQL asset data to match existing interface
export function transformGraphQLAssetToPcAsset(graphqlAsset: any) {
  return {
    id: graphqlAsset.asset_id,
    type: graphqlAsset.type || 'pc', // Preserve the type field
    hostname: graphqlAsset.hostname || '',
    manufacturer: graphqlAsset.manufacturer || '',
    model: graphqlAsset.model || '',
    partNumber: graphqlAsset.part_number || '',
    serialNumber: graphqlAsset.serial_number || '',
    formFactor: graphqlAsset.form_factor || '',
    os: graphqlAsset.os || '',
    osBit: graphqlAsset.os_bit || '',
    officeSuite: graphqlAsset.office_suite || '',
    softwareLicenseKey: graphqlAsset.software_license_key || '',
    wiredMacAddress: graphqlAsset.wired_mac_address || '',
    wiredIpAddress: graphqlAsset.wired_ip_address || '',
    wirelessMacAddress: graphqlAsset.wireless_mac_address || '',
    wirelessIpAddress: graphqlAsset.wireless_ip_address || '',
    purchaseDate: graphqlAsset.purchase_date || '',
    purchasePrice: graphqlAsset.purchase_price?.toString() || '',
    depreciationYears: graphqlAsset.depreciation_years?.toString() || '',
    depreciationDept: graphqlAsset.depreciation_dept || '',
    cpu: graphqlAsset.cpu || '',
    memory: graphqlAsset.memory || '',
    location: graphqlAsset.location || '',
    status: normalizeStatus(graphqlAsset.status),
    previousUser: graphqlAsset.previous_user || '',
    userId: graphqlAsset.user_id || '',
    employee: graphqlAsset.employee,
    usageStartDate: graphqlAsset.usage_start_date || '',
    usageEndDate: graphqlAsset.usage_end_date || '',
    carryInOutAgreement: graphqlAsset.carry_in_out_agreement || '',
    lastUpdated: graphqlAsset.last_updated || '',
    updatedBy: graphqlAsset.updated_by || '',
    notes: graphqlAsset.notes || '',
    project: graphqlAsset.project || '',
    notes1: graphqlAsset.notes1 || '',
    notes2: graphqlAsset.notes2 || '',
    notes3: graphqlAsset.notes3 || '',
    notes4: graphqlAsset.notes4 || '',
    notes5: graphqlAsset.notes5 || '',
  };
}

export function transformGraphQLAssetToMonitorAsset(graphqlAsset: any) {
  return {
    id: graphqlAsset.asset_id,
    type: graphqlAsset.type || 'monitor', // Preserve the type field
    hostname: graphqlAsset.hostname || '',
    manufacturer: graphqlAsset.manufacturer || '',
    model: graphqlAsset.model || '',
    partNumber: graphqlAsset.part_number || '',
    serialNumber: graphqlAsset.serial_number || '',
    formFactor: graphqlAsset.form_factor || '',
    previousUser: graphqlAsset.previous_user || '',
    os: graphqlAsset.os || '',
    osBit: graphqlAsset.os_bit || '',
    officeSuite: graphqlAsset.office_suite || '',
    softwareLicenseKey: graphqlAsset.software_license_key || '',
    wiredMacAddress: graphqlAsset.wired_mac_address || '',
    wiredIpAddress: graphqlAsset.wired_ip_address || '',
    wirelessMacAddress: graphqlAsset.wireless_mac_address || '',
    wirelessIpAddress: graphqlAsset.wireless_ip_address || '',
    purchaseDate: graphqlAsset.purchase_date || '',
    purchasePrice: graphqlAsset.purchase_price?.toString() || '',
    depreciationYears: graphqlAsset.depreciation_years?.toString() || '',
    depreciationDept: graphqlAsset.depreciation_dept || '',
    cpu: graphqlAsset.cpu || '',
    memory: graphqlAsset.memory || '',
    location: graphqlAsset.location || '',
    status: normalizeStatus(graphqlAsset.status),
    userId: graphqlAsset.user_id || '',
    employee: graphqlAsset.employee,
    usageStartDate: graphqlAsset.usage_start_date || '',
    usageEndDate: graphqlAsset.usage_end_date || '',
    carryInOutAgreement: graphqlAsset.carry_in_out_agreement || '',
    lastUpdated: graphqlAsset.last_updated || '',
    updatedBy: graphqlAsset.updated_by || '',
    notes: graphqlAsset.notes || '',
    project: graphqlAsset.project || '',
    notes1: graphqlAsset.notes1 || '',
    notes2: graphqlAsset.notes2 || '',
    notes3: graphqlAsset.notes3 || '',
    notes4: graphqlAsset.notes4 || '',
    notes5: graphqlAsset.notes5 || '',
  };
}

export function transformGraphQLAssetToPhoneAsset(graphqlAsset: any) {
  return {
    id: graphqlAsset.asset_id,
    type: graphqlAsset.type || 'smartphones', // Preserve the type field
    hostname: graphqlAsset.hostname || '',
    manufacturer: graphqlAsset.manufacturer || '',
    model: graphqlAsset.model || '',
    partNumber: graphqlAsset.part_number || '',
    serialNumber: graphqlAsset.serial_number || '',
    formFactor: graphqlAsset.form_factor || '',
    previousUser: graphqlAsset.previous_user || '',
    os: graphqlAsset.os || '',
    osBit: graphqlAsset.os_bit || '',
    officeSuite: graphqlAsset.office_suite || '',
    softwareLicenseKey: graphqlAsset.software_license_key || '',
    wiredMacAddress: graphqlAsset.wired_mac_address || '',
    wiredIpAddress: graphqlAsset.wired_ip_address || '',
    wirelessMacAddress: graphqlAsset.wireless_mac_address || '',
    wirelessIpAddress: graphqlAsset.wireless_ip_address || '',
    purchaseDate: graphqlAsset.purchase_date || '',
    purchasePrice: graphqlAsset.purchase_price?.toString() || '',
    depreciationYears: graphqlAsset.depreciation_years?.toString() || '',
    depreciationDept: graphqlAsset.depreciation_dept || '',
    cpu: graphqlAsset.cpu || '',
    memory: graphqlAsset.memory || '',
    location: graphqlAsset.location || '',
    status: normalizeStatus(graphqlAsset.status),
    userId: graphqlAsset.user_id || '',
    employee: graphqlAsset.employee,
    usageStartDate: graphqlAsset.usage_start_date || '',
    usageEndDate: graphqlAsset.usage_end_date || '',
    carryInOutAgreement: graphqlAsset.carry_in_out_agreement || '',
    lastUpdated: graphqlAsset.last_updated || '',
    updatedBy: graphqlAsset.updated_by || '',
    notes: graphqlAsset.notes || '',
    project: graphqlAsset.project || '',
    notes1: graphqlAsset.notes1 || '',
    notes2: graphqlAsset.notes2 || '',
    notes3: graphqlAsset.notes3 || '',
    notes4: graphqlAsset.notes4 || '',
    notes5: graphqlAsset.notes5 || '',
  };
}

export function transformGraphQLAssetToOtherAsset(graphqlAsset: any) {
  return {
    id: graphqlAsset.asset_id,
    type: graphqlAsset.type || 'others', // Preserve the type field
    hostname: graphqlAsset.hostname || '',
    manufacturer: graphqlAsset.manufacturer || '',
    model: graphqlAsset.model || '',
    partNumber: graphqlAsset.part_number || '',
    serialNumber: graphqlAsset.serial_number || '',
    formFactor: graphqlAsset.form_factor || '',
    previousUser: graphqlAsset.previous_user || '',
    os: graphqlAsset.os || '',
    osBit: graphqlAsset.os_bit || '',
    officeSuite: graphqlAsset.office_suite || '',
    softwareLicenseKey: graphqlAsset.software_license_key || '',
    wiredMacAddress: graphqlAsset.wired_mac_address || '',
    wiredIpAddress: graphqlAsset.wired_ip_address || '',
    wirelessMacAddress: graphqlAsset.wireless_mac_address || '',
    wirelessIpAddress: graphqlAsset.wireless_ip_address || '',
    purchaseDate: graphqlAsset.purchase_date || '',
    purchasePrice: graphqlAsset.purchase_price?.toString() || '',
    depreciationYears: graphqlAsset.depreciation_years?.toString() || '',
    depreciationDept: graphqlAsset.depreciation_dept || '',
    cpu: graphqlAsset.cpu || '',
    memory: graphqlAsset.memory || '',
    location: graphqlAsset.location || '',
    status: normalizeStatus(graphqlAsset.status),
    userId: graphqlAsset.user_id || '',
    employee: graphqlAsset.employee,
    usageStartDate: graphqlAsset.usage_start_date || '',
    usageEndDate: graphqlAsset.usage_end_date || '',
    carryInOutAgreement: graphqlAsset.carry_in_out_agreement || '',
    lastUpdated: graphqlAsset.last_updated || '',
    updatedBy: graphqlAsset.updated_by || '',
    notes: graphqlAsset.notes || '',
    project: graphqlAsset.project || '',
    notes1: graphqlAsset.notes1 || '',
    notes2: graphqlAsset.notes2 || '',
    notes3: graphqlAsset.notes3 || '',
    notes4: graphqlAsset.notes4 || '',
    notes5: graphqlAsset.notes5 || '',
  };
}

export async function createAuditPlan(auditPlanData: {
  name: string;
  startDate: string;
  dueDate: string;
  description?: string;
  locations: string[];
  auditors: string[];
}) {
  const mutation = `
    mutation CreateAuditPlan(
      $name: String!
      $start_date: Date!
      $due_date: Date!
      $description: String
      $locations: [ID!]!
      $auditors: [ID!]!
    ) {
      createAuditPlan(
        name: $name
        start_date: $start_date
        due_date: $due_date
        description: $description
        locations: $locations
        auditors: $auditors
      ) {
        id
        name
        start_date
        due_date
        status
        description
        created_at
        updated_at
        assignments {
          id
          status
          location {
            id
            name
          }
          auditor {
            id
            name
          }
        }
        auditAssets {
          id
          current_status
          audit_status
          original_location
          original_user
          current_location
          current_user
          asset {
            id
            asset_id
            model
            location
            user_id
          }
        }
      }
    }
  `;

  console.log('?? Creating audit plan with data:', auditPlanData);
  console.log('?? Using GraphQL endpoint:', GRAPHQL_ENDPOINT);
  console.log('?? Mutation:', mutation);

  try {
    const requestBody = {
      query: mutation,
      variables: {
        name: auditPlanData.name,
        start_date: auditPlanData.startDate,
        due_date: auditPlanData.dueDate,
        description: auditPlanData.description,
        locations: auditPlanData.locations,
        auditors: auditPlanData.auditors,
      },
    };

    console.log('?? Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('?? Response status:', response.status);
    console.log('?? Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('?? Response text (first 500 chars):', responseText.substring(0, 500));

    let result;
    try {
      result = JSON.parse(responseText);
      console.log('? Response parsed as JSON successfully');
    } catch (parseError) {
      console.error('? Failed to parse response as JSON:', parseError);
      console.error('? Response text:', responseText);
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
    }

    if (result.errors) {
      console.error('? GraphQL errors:', result.errors);
      throw new Error(result.errors[0]?.message || 'Failed to create audit plan');
    }

    console.log('? Audit plan created successfully:', result.data);
    return { success: true, data: result.data.createAuditPlan };
  } catch (error) {
    console.error('? Error creating audit plan:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create audit plan' 
    };
  }
}

export async function updateAuditAsset(auditAssetId: string, updateData: {
  current_status: string;
  auditor_notes?: string;
  resolved?: boolean;
  current_location?: string;
  current_user?: string;
}) {
  const mutation = `
    mutation UpdateAuditAsset(
      $id: ID!
      $current_status: String!
      $auditor_notes: String
      $resolved: Boolean
      $current_location: String
      $current_user: String
    ) {
      updateAuditAsset(
        id: $id
        current_status: $current_status
        auditor_notes: $auditor_notes
        resolved: $resolved
        current_location: $current_location
        current_user: $current_user
      ) {
        id
        current_status
        auditor_notes
        resolved
        audited_at
        audited_by
        current_location
        current_user
        asset {
          id
          asset_id
          model
          location
          user_id
          employee {
            id
            name
          }
        }
      }
    }
  `;

  try {
    const variables = {
      id: auditAssetId,
      current_status: updateData.current_status,
      auditor_notes: updateData.auditor_notes,
      resolved: updateData.resolved,
      current_location: updateData.current_location,
      current_user: updateData.current_user,
    };
    
    console.log('GraphQL mutation:', mutation);
    console.log('GraphQL variables:', variables);
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: variables,
      }),
    });

    const result = await response.json();
    console.log('GraphQL response:', result);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      const errorMessage = result.errors[0]?.message || 'Failed to update audit asset';
      throw new Error(errorMessage);
    }

    return { success: true, data: result.data.updateAuditAsset };
  } catch (error) {
    console.error('Error updating audit asset:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update audit asset' 
    };
  }
}

export async function getAuditPlans() {
  const query = `
    query GetAuditPlans {
      auditPlans {
        data {
          id
          name
          start_date
          due_date
          status
          description
          created_at
          updated_at
          assignments {
            id
            status
            location {
              id
              name
            }
            auditor {
              id
              name
            }
          }
          auditAssets {
            id
            current_status
            audit_status
            auditor_notes
            audited_at
            resolved
            original_location
            original_user
            current_location
            current_user
            asset {
              id
              asset_id
              model
              location
              user_id
              employee {
                id
                name
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to fetch audit plans');
    }

    return { success: true, data: result.data.auditPlans.data };
  } catch (error) {
    console.error('Error fetching audit plans:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch audit plans' 
    };
  }
}

// Corrective Action functions
export async function getCorrectiveActions(auditPlanId?: string, status?: string, priority?: string, assignedTo?: string) {
  const variables: any = {};
  if (auditPlanId) variables.audit_plan_id = auditPlanId;
  if (status) variables.status = status;
  if (priority) variables.priority = priority;
  if (assignedTo) variables.assigned_to = assignedTo;

  const query = `
    query GetCorrectiveActions($audit_plan_id: ID, $status: String, $priority: String, $assigned_to: String) {
      correctiveActions(
        audit_plan_id: $audit_plan_id
        status: $status
        priority: $priority
        assigned_to: $assigned_to
      ) {
        data {
          id
          audit_asset_id
          audit_plan_id
          issue
          action
          assigned_to
          priority
          status
          due_date
          completed_date
          notes
          created_at
          updated_at
          auditAsset {
            id
            current_status
            original_location
            original_user
            current_location
            current_user
            asset {
              id
              asset_id
              model
              location
              user_id
            }
          }
          auditPlan {
            id
            name
            start_date
            due_date
            status
          }
        }
        paginatorInfo {
          count
          currentPage
          firstItem
          hasMorePages
          lastPage
          lastItem
          perPage
          total
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to fetch corrective actions');
    }

    return { success: true, data: result.data.correctiveActions.data };
  } catch (error) {
    console.error('Error fetching corrective actions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch corrective actions' 
    };
  }
}

export async function createCorrectiveAction(actionData: {
  audit_asset_id: string;
  issue: string;
  action: string;
  assigned_to?: string;
  priority: string;
  due_date: string;
  notes?: string;
}) {
  const mutation = `
    mutation CreateCorrectiveAction($action: CorrectiveActionInput!) {
      createCorrectiveAction(action: $action) {
        id
        audit_asset_id
        audit_plan_id
        issue
        action
        assigned_to
        priority
        status
        due_date
        completed_date
        notes
        created_at
        updated_at
        auditAsset {
          id
          current_status
          original_location
          original_user
          current_location
          current_user
          asset {
            id
            asset_id
            model
            location
            user_id
            employee {
              id
              name
            }
          }
        }
        auditPlan {
          id
          name
          start_date
          due_date
          status
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { action: actionData },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to create corrective action');
    }

    return { success: true, data: result.data.createCorrectiveAction };
  } catch (error) {
    console.error('Error creating corrective action:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create corrective action' 
    };
  }
}

export async function updateCorrectiveAction(id: string, actionData: {
  audit_asset_id: string;
  issue: string;
  action: string;
  assigned_to?: string;
  priority: string;
  due_date: string;
  notes?: string;
}) {
  const mutation = `
    mutation UpdateCorrectiveAction($id: ID!, $action: CorrectiveActionInput!) {
      updateCorrectiveAction(id: $id, action: $action) {
        id
        audit_asset_id
        audit_plan_id
        issue
        action
        assigned_to
        priority
        status
        due_date
        completed_date
        notes
        created_at
        updated_at
        auditAsset {
          id
          current_status
          original_location
          original_user
          current_location
          current_user
          asset {
            id
            asset_id
            model
            location
            user_id
            employee {
              id
              name
            }
          }
        }
        auditPlan {
          id
          name
          start_date
          due_date
          status
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { id, action: actionData },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to update corrective action');
    }

    return { success: true, data: result.data.updateCorrectiveAction };
  } catch (error) {
    console.error('Error updating corrective action:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update corrective action' 
    };
  }
}

export async function updateCorrectiveActionStatus(id: string, status: string, notes?: string) {
  const mutation = `
    mutation UpdateCorrectiveActionStatus($id: ID!, $status: String!, $notes: String) {
      updateCorrectiveActionStatus(id: $id, status: $status, notes: $notes) {
        id
        audit_asset_id
        audit_plan_id
        issue
        action
        assigned_to
        priority
        status
        due_date
        completed_date
        notes
        created_at
        updated_at
        auditAsset {
          id
          current_status
          original_location
          original_user
          current_location
          current_user
          asset {
            id
            asset_id
            model
            location
            user_id
            employee {
              id
              name
            }
          }
        }
        auditPlan {
          id
          name
          start_date
          due_date
          status
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { id, status, notes },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to update corrective action status');
    }

    return { success: true, data: result.data.updateCorrectiveActionStatus };
  } catch (error) {
    console.error('Error updating corrective action status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update corrective action status' 
    };
  }
}

export async function deleteCorrectiveAction(id: string) {
  const mutation = `
    mutation DeleteCorrectiveAction($id: ID!) {
      deleteCorrectiveAction(id: $id)
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { id },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to delete corrective action');
    }

    return { success: true, data: result.data.deleteCorrectiveAction };
  } catch (error) {
    console.error('Error deleting corrective action:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete corrective action' 
    };
  }
}

// Corrective Action Assignment functions
export async function assignCorrectiveAction(correctiveActionId: string, assignedToEmployeeId: string, notes?: string) {
  const mutation = `
    mutation AssignCorrectiveAction($corrective_action_id: ID!, $assigned_to_employee_id: ID!, $notes: String) {
      assignCorrectiveAction(
        corrective_action_id: $corrective_action_id
        assigned_to_employee_id: $assigned_to_employee_id
        notes: $notes
      ) {
        id
        corrective_action_id
        audit_assignment_id
        assigned_to_employee_id
        status
        assigned_at
        started_at
        completed_at
        progress_notes
        created_at
        updated_at
        correctiveAction {
          id
          issue
          action
          priority
          status
          due_date
          auditAsset {
            asset {
              asset_id
              model
            }
          }
        }
        assignedToEmployee {
          id
          name
        }
        auditAssignment {
          id
          status
          auditor {
            id
            name
          }
        }
      }
    }
  `;



  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { 
          corrective_action_id: correctiveActionId,
          assigned_to_employee_id: assignedToEmployeeId,
          notes 
        },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to assign corrective action');
    }

    return { success: true, data: result.data.assignCorrectiveAction };
  } catch (error) {
    console.error('Error assigning corrective action:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to assign corrective action' 
    };
  }
}

export async function updateCorrectiveActionAssignmentStatus(id: string, status: string, progressNotes?: string) {
  const mutation = `
    mutation UpdateCorrectiveActionAssignmentStatus($id: ID!, $status: String!, $progress_notes: String) {
      updateCorrectiveActionAssignmentStatus(
        id: $id
        status: $status
        progress_notes: $progress_notes
      ) {
        id
        corrective_action_id
        audit_assignment_id
        assigned_to_employee_id
        status
        assigned_at
        started_at
        completed_at
        progress_notes
        created_at
        updated_at
        correctiveAction {
          id
          issue
          action
          priority
          status
          due_date
          auditAsset {
            asset {
              asset_id
              model
            }
          }
        }
        assignedToEmployee {
          id
          name
        }
        auditAssignment {
          id
          status
          auditor {
            id
            name
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { id, status, progress_notes: progressNotes },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to update corrective action assignment status');
    }

    return { success: true, data: result.data.updateCorrectiveActionAssignmentStatus };
  } catch (error) {
    console.error('Error updating corrective action assignment status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update corrective action assignment status' 
    };
  }
}

// User management queries and mutations
export const USER_QUERIES = {
  // Get all users
  GET_USERS: `
    query GetUsers($name: String, $first: Int = 1000) {
      users(name: $name, first: $first) {
        data {
          id
          name
          email
          email_verified_at
          created_at
          updated_at
        }
        paginatorInfo {
          count
          currentPage
          firstItem
          hasMorePages
          lastPage
          perPage
          total
        }
      }
    }
  `,

  // Get single user by ID
  GET_USER: `
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
        email_verified_at
        created_at
        updated_at
      }
    }
  `,
};

export const USER_MUTATIONS = {
  // Create a new user
  CREATE_USER: `
    mutation CreateUser($user: UserInput!) {
      createUser(user: $user) {
        id
        name
        email
        email_verified_at
        created_at
        updated_at
      }
    }
  `,

  // Update an existing user
  UPDATE_USER: `
    mutation UpdateUser($id: ID!, $user: UserInput!) {
      updateUser(id: $id, user: $user) {
        id
        name
        email
        email_verified_at
        created_at
        updated_at
      }
    }
  `,

  // Delete a user
  DELETE_USER: `
    mutation DeleteUser($id: ID!) {
      deleteUser(id: $id)
    }
  `,
};

// User input type for mutations
export interface UserInput {
  name: string;
  email: string;
  password?: string;
}

// Employee Corrective Actions functions
export async function getEmployeeCorrectiveActions(employeeId: string, auditPlanId: string) {
  const query = `
    query GetEmployeeCorrectiveActions($employee_id: ID!, $audit_plan_id: ID!) {
      employeeCorrectiveActions(
        employee_id: $employee_id
        audit_plan_id: $audit_plan_id
      ) {
        id
        audit_asset_id
        audit_plan_id
        issue
        action
        assigned_to
        priority
        status
        due_date
        completed_date
        notes
        created_at
        updated_at
        auditAsset {
          id
          current_status
          original_location
          original_user
          current_location
          current_user
          asset {
            id
            asset_id
            model
            location
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ 
        query, 
        variables: { 
          employee_id: employeeId,
          audit_plan_id: auditPlanId
        } 
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to fetch employee corrective actions');
    }

    return { success: true, data: result.data.employeeCorrectiveActions };
  } catch (error) {
    console.error('Error fetching employee corrective actions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch employee corrective actions' 
    };
  }
}

export async function updateEmployeeCorrectiveActionStatus(
  actionId: string, 
  status: string, 
  notes: string, 
  employeeId: string
) {
  const mutation = `
    mutation UpdateEmployeeCorrectiveActionStatus(
      $action_id: ID!
      $status: String!
      $notes: String
      $employee_id: ID!
    ) {
      updateEmployeeCorrectiveActionStatus(
        action_id: $action_id
        status: $status
        notes: $notes
        employee_id: $employee_id
      ) {
        success
        message
        action {
          id
          audit_asset_id
          issue
          action
          assigned_to
          priority
          status
          due_date
          completed_date
          notes
          created_at
          updated_at
          asset {
            asset_id
            model
            location
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          action_id: actionId,
          status,
          notes,
          employee_id: employeeId
        },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'Failed to update corrective action status');
    }

    return { success: true, data: result.data.updateEmployeeCorrectiveActionStatus };
  } catch (error) {
    console.error('Error updating corrective action status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update corrective action status' 
    };
  }
}