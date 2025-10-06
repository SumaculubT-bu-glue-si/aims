

import UserAssetsClientPage from "./user-assets-client-page";
import { getAssets } from "./actions";
import { getLocations } from "../settings/locations/actions";
import { getProjects } from "../settings/projects/actions";
import { masterData as localMasterData } from "@/lib/data";

export default async function UserAssetsPage() {
  // Only fetch essential data initially - locations and projects
  // Assets will be fetched lazily when needed
  const [locationsResult, projectsResult] = await Promise.all([
    getLocations(),
    getProjects(),
  ]);

  const error = locationsResult.error || projectsResult.error;

  // Don't fetch all assets here - let the client component handle it
  // This significantly reduces the initial page load time
  
  const masterData = {
    locations: ['All', ...(locationsResult.locations?.map(l => l.name) || [])],
    projects: ['All', ...(projectsResult.projects?.map(p => p.name) || [])],
    employees: [], // Will be populated by client component when assets are fetched
  };

  // Pass empty inventory - client will fetch assets as needed
  const inventory = {
    pcs: [],
    monitors: [],
    smartphones: [],
    others: [],
  };

  return (
    <UserAssetsClientPage
      initialMasterData={masterData}
      initialInventory={inventory}
      systemFields={localMasterData.assetFields}
      initialError={error}
    />
  );
}
