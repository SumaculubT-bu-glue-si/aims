'use server'

import { revalidatePath } from 'next/cache';
import type { PcAsset, MonitorAsset, PhoneAsset } from './actions';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper function to make API calls
async function apiCall<T>(endpoint: string): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error: any) {
    console.error(`API call error for ${endpoint}:`, error);
    return { data: null, error: error.message || 'API call failed' };
  }
}

// Fetch PCs from the actual database
export async function getPcsFromDatabase(): Promise<{ pcs: PcAsset[]; error: string | null }> {
  try {
    const response = await apiCall<any[]>('/assets?type=pc');
    
    if (response.error) {
      return { pcs: [], error: response.error };
    }

    if (!response.data) {
      return { pcs: [], error: 'No data received from API' };
    }

    // Transform the database data to match PcAsset interface
    const pcs: PcAsset[] = response.data.map((asset: any) => ({
      id: asset.asset_id,
      hostname: asset.hostname || '',
      manufacturer: asset.manufacturer || '',
      model: asset.model || '',
      partNumber: asset.part_number || '',
      serialNumber: asset.serial_number || '',
      formFactor: asset.form_factor || '',
      os: asset.os || '',
      osBit: asset.os_bit || '',
      officeSuite: asset.office_suite || '',
      softwareLicenseKey: asset.software_license_key || '',
      wiredMacAddress: asset.wired_mac_address || '',
      wiredIpAddress: asset.wired_ip_address || '',
      wirelessMacAddress: asset.wireless_mac_address || '',
      wirelessIpAddress: asset.wireless_ip_address || '',
      purchaseDate: asset.purchase_date || '',
      purchasePrice: asset.purchase_price?.toString() || '',
      purchasePriceTaxIncluded: asset.purchase_price_tax_included?.toString() || '',
      depreciationYears: asset.depreciation_years?.toString() || '',
      depreciationDept: asset.depreciation_dept || '',
      cpu: asset.cpu || '',
      memory: asset.memory || '',
      location: asset.location || '',
      status: asset.status || '',
      previousUser: asset.previous_user || '',
      userId: asset.user_id || '',
      usageStartDate: asset.usage_start_date || '',
      usageEndDate: asset.usage_end_date || '',
      carryInOutAgreement: asset.carry_in_out_agreement || '',
      lastUpdated: asset.last_updated || '',
      updatedBy: asset.updated_by || '',
      notes: asset.notes || '',
      project: asset.project || '',
      notes1: asset.notes1 || '',
      notes2: asset.notes2 || '',
      notes3: asset.notes3 || '',
      notes4: asset.notes4 || '',
      notes5: asset.notes5 || '',
    }));

    return { pcs, error: null };
  } catch (error: any) {
    console.error('Error getting PCs from database:', error);
    return { pcs: [], error: error.message || 'Failed to fetch PCs from database' };
  }
}

// Fetch monitors from the actual database
export async function getMonitorsFromDatabase(): Promise<{ monitors: MonitorAsset[]; error: string | null }> {
  try {
    const response = await apiCall<any[]>('/assets?type=monitor');
    
    if (response.error) {
      return { monitors: [], error: response.error };
    }

    if (!response.data) {
      return { monitors: [], error: 'No data received from API' };
    }

    // Transform the database data to match MonitorAsset interface
    const monitors: MonitorAsset[] = response.data.map((asset: any) => ({
      id: asset.asset_id,
      manufacturer: asset.manufacturer || '',
      model: asset.model || '',
      serialNumber: asset.serial_number || '',
      location: asset.location || '',
      status: asset.status || '',
      userId: asset.user_id || '',
      notes: asset.notes || '',
    }));

    return { monitors, error: null };
  } catch (error: any) {
    console.error('Error getting monitors from database:', error);
    return { monitors: [], error: error.message || 'Failed to fetch monitors from database' };
  }
}

// Fetch phones from the actual database
export async function getPhonesFromDatabase(): Promise<{ phones: PhoneAsset[]; error: string | null }> {
  try {
    const response = await apiCall<any[]>('/assets?type=phone');
    
    if (response.error) {
      return { phones: [], error: response.error };
    }

    if (!response.data) {
      return { phones: [], error: 'No data received from API' };
    }

    // Transform the database data to match PhoneAsset interface
    const phones: PhoneAsset[] = response.data.map((asset: any) => ({
      id: asset.asset_id,
      manufacturer: asset.manufacturer || '',
      model: asset.model || '',
      serialNumber: asset.serial_number || '',
      location: asset.location || '',
      status: asset.status || '',
      userId: asset.user_id || '',
      notes: asset.notes || '',
    }));

    return { phones, error: null };
  } catch (error: any) {
    console.error('Error getting phones from database:', error);
    return { phones: [], error: error.message || 'Failed to fetch phones from database' };
  }
}

// Fetch all assets from the actual database
export async function getAllAssetsFromDatabase(): Promise<{ 
  pcs: PcAsset[]; 
  monitors: MonitorAsset[]; 
  phones: PhoneAsset[]; 
  error: string | null 
}> {
  try {
    const [pcsResult, monitorsResult, phonesResult] = await Promise.all([
      getPcsFromDatabase(),
      getMonitorsFromDatabase(),
      getPhonesFromDatabase()
    ]);

    // Check for errors
    const errors = [pcsResult.error, monitorsResult.error, phonesResult.error].filter(Boolean);
    if (errors.length > 0) {
      return {
        pcs: pcsResult.pcs,
        monitors: monitorsResult.monitors,
        phones: phonesResult.phones,
        error: errors.join('; ')
      };
    }

    return {
      pcs: pcsResult.pcs,
      monitors: monitorsResult.monitors,
      phones: phonesResult.phones,
      error: null
    };
  } catch (error: any) {
    console.error('Error getting all assets from database:', error);
    return {
      pcs: [],
      monitors: [],
      phones: [],
      error: error.message || 'Failed to fetch assets from database'
    };
  }
}
