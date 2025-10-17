
import InventoryClientPage from "./inventory-client-page";
import { masterData } from "@/lib/data";

export default function InventoryPage() {
  return (
    <InventoryClientPage
      initialPcs={[]}
      initialLocations={[]}
      initialEmployees={[]}
      initialProjects={[]}
      initialLocalInventory={undefined}
      initialSystemFields={masterData.assetFields}
      initialError={null}
    />
  );
}
