'use server'

import { revalidatePath } from 'next/cache';
import { databaseServer as LocalDB } from '@/lib/db/database-server';
import { inventory, masterData } from '@/lib/data';
import { graphqlQuery } from '@/lib/graphql-client';

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
