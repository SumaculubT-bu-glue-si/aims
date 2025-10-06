
import ProjectsClientPage from "./projects-client-page";
import { getProjects } from "./actions";

export default async function ManageProjectsPage() {
  const { projects, error } = await getProjects();
  return <ProjectsClientPage initialProjects={projects} initialError={error} />;
}
