
import InventoryClientPage from "./inventory-client-page";
import { getLocations } from "../settings/locations/actions";
import { getEmployees } from "../settings/employees/actions";
import { getProjects } from "../settings/projects/actions";
import { masterData } from "@/lib/data";

export default async function InventoryPage() {
  const [locationsResult, employeesResult, projectsResult] = await Promise.all([
    getLocations(),
    getEmployees(),
    getProjects(),
  ]);

  const error = locationsResult.error || employeesResult.error || projectsResult.error || null;
  const errorString = error === true ? 'An error occurred' : error;

  return (
    <InventoryClientPage
      initialPcs={[]}
      initialLocations={locationsResult.locations}
      initialEmployees={employeesResult.employees}
      initialProjects={projectsResult.projects}
      initialLocalInventory={undefined}
      initialSystemFields={masterData.assetFields}
      initialError={errorString}
    />
  );
}
