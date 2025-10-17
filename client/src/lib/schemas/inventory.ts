
import { z } from 'zod';
import { graphqlQuery } from '@/lib/graphql-client';
import { FrontendAsset, Employee, Project, Location, PcFormValues } from '@/lib/types/index';

// Re-export types for external use
export type { PcFormValues };

// Create Zod schema from centralized PcFormValues type
export const pcSchema = z.object({
  id: z.string().optional(),
  assetId: z.string().optional(),
  type: z.string().optional(),
  hostname: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  partNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  formFactor: z.string().optional(),
  os: z.string().optional(),
  osBit: z.string().optional(),
  officeSuite: z.string().optional(),
  softwareLicenseKey: z.string().optional(),
  wiredMacAddress: z.string().optional(),
  wiredIpAddress: z.string().optional(),
  wirelessMacAddress: z.string().optional(),
  wirelessIpAddress: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  purchasePriceTaxIncluded: z.string().optional(),
  depreciationYears: z.string().optional(),
  depreciationDept: z.string().optional(),
  cpu: z.string().optional(),
  memory: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  previousUser: z.string().optional(),
  userId: z.string().optional(),
  usageStartDate: z.string().optional(),
  usageEndDate: z.string().optional(),
  carryInOutAgreement: z.string().optional(),
  lastUpdated: z.string().optional(),
  updatedBy: z.string().optional(),
  notes: z.string().optional(),
  project: z.string().optional(),
  notes1: z.string().optional(),
  notes2: z.string().optional(),
  notes3: z.string().optional(),
  notes4: z.string().optional(),
  notes5: z.string().optional(),
});

// Use centralized types - no duplicate definitions
export type PcAsset = FrontendAsset;

export async function getLocationsFromGraphQL(): Promise<{ locations: { id: string; name: string; }[]; error: string | null }> {
  try {
    const response = await graphqlQuery(`
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
    `);

    if (response.errors) {
      return { locations: [], error: response.errors[0]?.message || 'GraphQL query failed' };
    }

    return { locations: response.data?.locations || [], error: null };
  } catch (error: any) {
    return { locations: [], error: error.message || 'Failed to fetch locations' };
  }
}

