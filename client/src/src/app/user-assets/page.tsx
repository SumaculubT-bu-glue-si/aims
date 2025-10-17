
import UserAssetsClientPage from "./user-assets-client-page";
import { masterData as localMasterData } from "@/lib/data";

export default function UserAssetsPage() {
  // Pass empty initial data - client component will fetch everything
  const masterData = {
    locations: ['All'], // Will be populated by client component
    projects: ['All'], // Will be populated by client component
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
      initialError={null}
    />
  );
}
