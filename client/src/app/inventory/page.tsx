
import InventoryClientPage from "./inventory-client-page";
import { getPcs } from "./actions";
import { getLocations } from "../settings/locations/actions";
import { getEmployees } from "../settings/employees/actions";
import { getProjects } from "../settings/projects/actions";
import { getAssetFields } from "../settings/asset-fields/actions";

export default async function InventoryPage() {
  const [pcsResult, locationsResult, employeesResult, projectsResult, assetFieldsResult] = await Promise.all([
    getPcs(),
    getLocations(),
    getEmployees(),
    getProjects(),
    getAssetFields(),
  ]);

  const error = pcsResult.error || locationsResult.error || employeesResult.error || projectsResult.error || assetFieldsResult.error;

  // Deduplicate locations, employees, and projects by name, keeping the first occurrence
  const deduplicatedLocations = locationsResult.locations?.filter((location, index, self) => 
    index === self.findIndex(l => l.name === location.name)
  ) || [];

  const deduplicatedEmployees = employeesResult.employees?.filter((employee, index, self) => 
    index === self.findIndex(e => e.name === employee.name)
  ) || [];

  const deduplicatedProjects = projectsResult.projects?.filter((project, index, self) => 
    index === self.findIndex(p => p.name === project.name)
  ) || [];

  return (
    <InventoryClientPage
      initialPcs={pcsResult.pcs}
      initialLocations={deduplicatedLocations}
      initialEmployees={deduplicatedEmployees}
      initialProjects={deduplicatedProjects}
      initialLocalInventory={undefined as any}
      initialSystemFields={assetFieldsResult.fields}
      initialError={error}
    />
  );
}
