import type { LucideIcon } from 'lucide-react';

export type InventoryTask = {
  id: string;
  name: string;
};

export type AssetType = 'Laptop' | 'Smartphone' | 'Monitor' | 'Other';

export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  serialNumber: string;
  assignedTo: string;
  icon: LucideIcon;
};

export type AssetStatus = 'operational' | 'damaged' | 'lost' | 'in_repair' | 'misplaced' | 'other';


export type Currency = 'JPY' | 'USD';

export type SubscriptionStatus = 'active' | 'inactive';

export type BillingCycleUnit = 'day' | 'week' | 'month' | 'year';

export interface BillingCycle {
  unit: BillingCycleUnit;
  period: number;
}

export type LicenseType = 'subscription' | 'perpetual';

export type PricingType = 'per-license' | 'per-seat';

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
}

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

export interface Subscription {
  id: string;
  name: string;
  status: SubscriptionStatus;
  licenseType: LicenseType;
  pricingType: PricingType; // New field
  accounts: Account[];
  assignedUsers?: AssignedUser[]; // For per-seat pricing
  perUserPricing?: PerUserPricing; // For per-seat pricing
  vendor?: string;
  category?: string;
  paymentMethod?: string;
  website?: string;
  supportPage?: string;
  notes?: string;
  cancellationDate?: string;
}

export interface GWS {
  id: string;
  domain: string;
  adminEmail: string;
  plan: string;
  notes?: string;
}
