'use server'

import { revalidatePath } from 'next/cache';
import { databaseServer as LocalDB } from '@/lib/db/database-server';
import { inventory, masterData } from '@/lib/data';

export interface PcAsset {
  id: string;
  hostname: string;
  manufacturer: string;
  model: string;
  partNumber: string;
  serialNumber: string;
  formFactor: string;
  os: string;
  osBit: string;
  officeSuite: string;
  softwareLicenseKey: string;
  wiredMacAddress: string;
  wiredIpAddress: string;
  wirelessMacAddress: string;
  wirelessIpAddress: string;
  purchaseDate: string;
  purchasePrice: string;
  purchasePriceTaxIncluded: string;
  depreciationYears: string;
  depreciationDept: string;
  cpu: string;
  memory: string;
  location: string;
  status: string;
  previousUser: string;
  userId: string;
  usageStartDate: string;
  usageEndDate: string;
  carryInOutAgreement: string;
  lastUpdated: string;
  updatedBy: string;
  notes: string;
  project: string;
  notes1: string;
  notes2: string;
  notes3: string;
  notes4: string;
  notes5: string;
}

export interface MonitorAsset {
  id: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  status: string;
  userId: string;
  notes: string;
}

export interface PhoneAsset {
  id: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  status: string;
  userId: string;
  notes: string;
}

export async function getPcs(): Promise<{ pcs: PcAsset[]; error: string | null }> {
  try {
    // Ensure database is initialized
    await LocalDB.initializeCollections();

    const pcs = await LocalDB.queryFromDatabase<PcAsset>(
      'pcs',
      undefined,
      (a: PcAsset, b: PcAsset) => a.id.localeCompare(b.id)
    );

    return { pcs, error: null };
  } catch (e: any) {
    console.error("Error getting PCs:", e);
    return { pcs: [], error: "errors.database.connect_failed" };
  }
}

export async function getMonitors(): Promise<{ monitors: MonitorAsset[]; error: string | null }> {
  try {
    await LocalDB.initializeCollections();
    
    const monitors = await LocalDB.queryFromDatabase<MonitorAsset>(
      'monitors',
      undefined,
      (a: MonitorAsset, b: MonitorAsset) => a.id.localeCompare(b.id)
    );

    return { monitors, error: null };
  } catch (e: any) {
    console.error("Error getting monitors:", e);
    return { monitors: [], error: "errors.database.connect_failed" };
  }
}

export async function getPhones(): Promise<{ phones: PhoneAsset[]; error: string | null }> {
  try {
    await LocalDB.initializeCollections();
    
    const phones = await LocalDB.queryFromDatabase<PhoneAsset>(
      'phones',
      undefined,
      (a: PhoneAsset, b: PhoneAsset) => a.id.localeCompare(b.id)
    );

    return { phones, error: null };
  } catch (e: any) {
    console.error("Error getting phones:", e);
    return { phones: [], error: "errors.database.connect_failed" };
  }
}

export async function savePc(values: any, pcId: string | null): Promise<{ success: boolean; message: string; }> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const assetId = pcId || `PC${Date.now()}`;
    const isNewFromForm = !pcId;
    
    const dataToSet: PcAsset = {
      ...values,
      id: assetId,
      purchasePrice: values.purchasePrice || "",
      depreciationYears: values.depreciationYears || "",
      lastUpdated: today,
      updatedBy: "IT Admin",
    };

    if (isNewFromForm) {
      dataToSet.purchaseDate = values.purchaseDate || today;
    }
    
    if (isNewFromForm) {
      await LocalDB.add('pcs', dataToSet);
    } else {
      await LocalDB.update('pcs', assetId, dataToSet);
    }
    
    revalidatePath('/inventory');
    return { success: true, message: "success.pc_saved" };
  } catch (error: any) {
    console.error("Error saving PC:", error);
    return { success: false, message: "errors.database.save_failed" };
  }
}

export async function deletePc(pcId: string): Promise<{ success: boolean; message: string; }> {
  try {
    const success = await LocalDB.delete('pcs', pcId);
    
    if (success) {
      revalidatePath('/inventory');
      return { success: true, message: "success.pc_deleted" };
    } else {
      return { success: false, message: "errors.pc_not_found" };
    }
  } catch (error: any) {
    console.error("Error deleting PC:", error);
    return { success: false, message: "errors.database.delete_failed" };
  }
}

export async function getMasterData(): Promise<{ masterData: any; error: string | null }> {
  try {
    await LocalDB.initializeCollections();
    
    const projects = await LocalDB.query('projects');
    const locations = await LocalDB.query('locations');
    const employees = await LocalDB.query('employees');
    
    return {
      masterData: {
        projects: projects.map((p: any) => p.name),
        locations: locations.map((l: any) => l.name),
        employees: employees.map((e: any) => e.name),
        assetFields: masterData.assetFields
      },
      error: null
    };
  } catch (e: any) {
    console.error("Error getting master data:", e);
    return { masterData: null, error: "errors.database.connect_failed" };
  }
}