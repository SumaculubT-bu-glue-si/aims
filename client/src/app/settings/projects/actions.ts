'use server';

import { revalidatePath } from 'next/cache';
import { graphqlQuery, INVENTORY_QUERIES, ProjectInput } from '@/lib/graphql-client';
import { T } from '@genkit-ai/googleai';

export interface Project {
  id: string;
  name: string;
  description?: string;
  order: number;
  visible?: boolean;
}

export async function getProjects(): Promise<{ projects: Project[]; error: string | null }> {
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.GET_PROJECTS);

    if (response.errors) {
      return { projects: [], error: response.errors[0]?.message || 'GraphQL query failed' };
    }

    if (!response.data?.projects?.data) {
      return { projects: [], error: 'No data received from GraphQL' };
    }

    const projects = response.data.projects.data.map((proj: any) => ({
      id: proj.id,
      name: proj.name,
      description: proj.description || '',
      order: proj.order || 0, // Use order from database, default to 0
      visible: proj.visible ?? true,
    }));

    // Sort by order instead of by name
    projects.sort((a: Project, b: Project) => a.order - b.order);

    return { projects, error: null };
  } catch (error: any) {
    console.error("Error getting projects from GraphQL:", error);
    return { projects: [], error: error.message || 'Failed to fetch projects' };
  }
}

export async function saveProject(id: string | null, values: Partial<Omit<Project, 'id'>>): Promise<{ success: boolean; message: string; }> {
  try {
    const projectInput: ProjectInput = {
      name: values.name!,
      description: values.description,
      visible: values.visible ?? true,
      order: values.order ?? 0, // Include order field
    };

    let response;
    if (id) {
      // Update existing project
      response = await graphqlQuery(INVENTORY_QUERIES.UPDATE_PROJECT, {
        id: id,
        project: projectInput
      });
    } else {
      // Create new project - we'll need to get the current max order
      const currentProjects = await getProjects();
      const maxOrder = currentProjects.projects.length > 0
        ? Math.max(...currentProjects.projects.map(p => p.order))
        : -1;

      projectInput.order = maxOrder + 1; // Set new project to end of list

      response = await graphqlQuery(INVENTORY_QUERIES.CREATE_PROJECT, {
        project: projectInput
      });
    }

    if (response.errors) {
      return { success: false, message: 'errors.projects.save_failed' };
    }

    revalidatePath('/settings/projects');
    return { success: true, message: 'actions.settings.projects.save_success' };
  } catch (error: any) {
    console.error("Error saving project via GraphQL:", error);
    return { success: false, message: "errors.projects.save_failed" };
  }
}

export async function updateProjectOrder(projects: Pick<Project, 'id' | 'order'>[]): Promise<{ success: boolean; message: string; }> {
  try {
    // Get current projects to preserve their existing data
    const currentProjects = await getProjects();

    // Update each project's order individually
    for (const project of projects) {
      const currentProject = currentProjects.projects.find(p => p.id === project.id);
      if (!currentProject) continue;

      const projectInput: ProjectInput = {
        name: currentProject.name,
        description: currentProject.description,
        visible: currentProject.visible ?? true,
        order: project.order,
      };

      const response = await graphqlQuery(INVENTORY_QUERIES.UPDATE_PROJECT, {
        id: project.id,
        project: projectInput
      });

      if (response.errors) {
        return { success: false, message: response.errors[0]?.message || 'GraphQL mutation failed' };
      }
    }

    revalidatePath('/settings/projects');
    return { success: true, message: 'actions.settings.order_updated' };
  } catch (e: any) {
    console.error("Error updating project order via GraphQL:", e);
    return { success: false, message: "errors.settings.save_failed" };
  }
}

export async function updateProjectVisibility(id: string, visible: boolean, name: string, description?: string): Promise<{ success: boolean; message: string; }> {
  try {
    // Get current project to preserve its order
    const currentProjects = await getProjects();
    const currentProject = currentProjects.projects.find(p => p.id === id);

    const projectInput: ProjectInput = {
      name: name,
      description: description,
      visible: visible,
      order: currentProject?.order || 0,
    };

    const response = await graphqlQuery(INVENTORY_QUERIES.UPDATE_PROJECT, {
      id: id,
      project: projectInput
    });

    if (response.errors) {
      return { success: false, message: response.errors[0]?.message || 'GraphQL mutation failed' };
    }

    revalidatePath('/settings/projects');
    return { success: true, message: 'actions.settings.visibility_updated' };
  } catch (error: any) {
    console.error("Error updating project visibility via GraphQL:", error);
    return { success: false, message: "errors.settings.save_failed" };
  }
}

export async function bulkUpdateProjectVisibility(updates: Array<{ id: string; visible: boolean; name: string; description?: string }>): Promise<{ success: boolean; message: string; }> {
  try {
    // Get current projects to preserve their order
    const currentProjects = await getProjects();

    // Update each project's visibility individually
    for (const update of updates) {
      const currentProject = currentProjects.projects.find(p => p.id === update.id);

      const projectInput: ProjectInput = {
        name: update.name,
        description: update.description,
        visible: update.visible,
        order: currentProject?.order || 0,
      };

      const response = await graphqlQuery(INVENTORY_QUERIES.UPDATE_PROJECT, {
        id: update.id,
        project: projectInput
      });

      if (response.errors) {
        return { success: false, message: response.errors[0]?.message || 'GraphQL mutation failed' };
      }
    }

    revalidatePath('/settings/projects');
    return { success: true, message: 'actions.settings.bulk_visibility_updated' };
  } catch (error: any) {
    console.error("Error bulk updating project visibility via GraphQL:", error);
    return { success: false, message: "errors.settings.save_failed" };
  }
}

export async function bulkUpdateProjectChanges(updates: Array<{ id: string; visible: boolean; name: string; description?: string; order: number }>): Promise<{ success: boolean; message: string; }> {
  try {
    // Get current projects to preserve their existing data
    const currentProjects = await getProjects();

    // Update each project's changes individually
    for (const update of updates) {
      const currentProject = currentProjects.projects.find(p => p.id === update.id);
      if (!currentProject) continue;

      const projectInput: ProjectInput = {
        name: update.name,
        description: update.description,
        visible: update.visible,
        order: update.order,
      };

      const response = await graphqlQuery(INVENTORY_QUERIES.UPDATE_PROJECT, {
        id: update.id,
        project: projectInput
      });

      if (response.errors) {
        return { success: false, message: "errors.bulk_projects.save_failed" };
      }
    }

    revalidatePath('/settings/projects');
    return { success: true, message: 'actions.settings.bulk_projects.changes_saved' };
  } catch (error: any) {
    console.error("Error bulk updating project changes via GraphQL:", error);
    return { success: false, message: "errors.bulk_projects.save_failed" };
  }
}

export async function deleteProject(id: string): Promise<{ success: boolean; message: string; }> {
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.DELETE_PROJECT, { id });

    if (response.errors) {
      return { success: false, message: 'errors.project.delete_failed' };
    }

    revalidatePath('/settings/projects');
    return { success: true, message: 'actions.settings.projects.delete_success' };
  } catch (error: any) {
    console.error("Error deleting project via GraphQL:", error);
    return { success: false, message: "errors.project.delete_failed" };
  }
}