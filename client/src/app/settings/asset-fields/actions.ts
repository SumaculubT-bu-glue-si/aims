
'use server';

import { masterData } from '@/lib/data';
import type { AssetField } from '@/lib/schemas/settings';

export async function getAssetFields(): Promise<{ fields: AssetField[]; error: string | null }> {
  // Always return the static master data.
  // This ensures consistency across the app as the fields are now fixed.
  const sortedFields = [...masterData.assetFields].sort((a, b) => a.order - b.order);
  return { fields: sortedFields, error: null };
}
