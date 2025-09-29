
import EmployeesClientPage from "./employees-client-page";
import { getEmployees } from './actions';
import { getLocations } from '../locations/actions';
import { getProjects } from "../projects/actions";

export default async function ManageEmployeesPage() {
  const [employeesResult, locationsResult, projectsResult] = await Promise.all([
    getEmployees(), 
    getLocations(),
    getProjects()
  ]);

  const { employees, error: employeesError } = employeesResult;
  const { locations, error: locationsError } = locationsResult;
  const { projects, error: projectsError } = projectsResult;

  const error = employeesError || locationsError || projectsError;

  return <EmployeesClientPage 
    initialEmployees={employees} 
    initialLocations={locations.map(l => l.name)} 
    initialProjects={projects.map(p => p.name)}
    initialError={error} 
  />
}
