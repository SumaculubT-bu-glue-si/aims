'use server';

import { revalidatePath } from 'next/cache';
import { graphqlQuery, INVENTORY_QUERIES, EmployeeInput } from '@/lib/graphql-client';
import type { Employee, EmployeeFormValues } from '@/lib/schemas/settings';
import { getLocations } from '../locations/actions';
import { getProjects } from '../projects/actions';

export async function getEmployees(): Promise<{ employees: Employee[]; error: boolean }> {
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.GET_EMPLOYEES);

    if (response.errors) {
      console.error("GraphQL query failed");
      return { employees: [], error: true };
    }

    if (!response.data?.employees?.data) {
      console.error("No data received from GraphQL");
      return { employees: [], error: true };
    }

    const employees = response.data.employees.data.map((emp: any) => ({
      id: emp.id,
      employeeId: emp.employee_id,
      name: emp.name,
      email: emp.email || '',
      location: emp.location || '',
      projects: emp.projects || [],
    }));

    // Sort by employee ID
    employees.sort((a: Employee, b: Employee) => (a.employeeId || '').localeCompare(b.employeeId || ''));

    return { employees, error: false };
  } catch (error: any) {
    console.error("Failed to fetch employees", error);
    return { employees: [], error: true };
  }
}

async function getNextEmployeeId(): Promise<string> {
  const result = await getEmployees();
  let maxId = 0;

  if (result.employees) {
    result.employees.forEach((emp: Employee) => {
      const id = emp.employeeId;
      if (id && id.startsWith('EMP')) {
        const num = parseInt(id.substring(3), 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    });
  }

  return `EMP${String(maxId + 1).padStart(4, '0')}`;
}

export async function saveEmployee(id: string | null, values: EmployeeFormValues): Promise<{ success: boolean; message: string; errorType?: string }> {
  try {
    let employeeIdToSave: string;

    // If id is provided, we're editing. The document ID is the employeeId.
    if (id) {
      employeeIdToSave = id;
    } else {
      // For new employees, use a temporary ID that will be replaced by Google Workspace User ID
      // Use a prefix to identify temporary IDs
      employeeIdToSave = `TEMP_${Date.now()}`;
    }

    const employeeInput: EmployeeInput = {
      employee_id: employeeIdToSave,
      name: values.name,
      email: values.email || undefined,
      location: values.location || undefined,
      projects: values.projects || [],
    };

    let response;
    if (id) {
      // Update existing employee
      response = await graphqlQuery(INVENTORY_QUERIES.UPDATE_EMPLOYEE, {
        id: id,
        employee: employeeInput
      });
    } else {
      // Create new employee
      response = await graphqlQuery(INVENTORY_QUERIES.CREATE_EMPLOYEE, {
        employee: employeeInput
      });
    }

    if (response.errors) {
      const errorMessage = response.errors[0]?.message || 'GraphQL mutation failed';
      
      // Handle specific duplicate email error
      if (errorMessage.includes('email already exists')) {
        return { success: false, message: 'actions.settings.employees.email_exists', errorType: 'duplicate_email' };
      }
      
      return { success: false, message: errorMessage };
    }

    revalidatePath('/settings/employees');
    return { success: true, message: 'actions.settings.save_success' };
  } catch (error: any) {
    console.error("Error saving employee via GraphQL:", error);
    return { success: false, message: "errors.settings.save_failed" };
  }
}

export async function deleteEmployee(id: string): Promise<{ success: boolean; message: string; }> {
  try {
    const response = await graphqlQuery(INVENTORY_QUERIES.DELETE_EMPLOYEE, { id });

    if (response.errors) {
      return { success: false, message: response.errors[0]?.message || 'GraphQL mutation failed' };
    }

    revalidatePath('/settings/employees');
    return { success: true, message: 'actions.settings.delete_success' };
  } catch (error: any) {
    console.error("Error deleting employee via GraphQL:", error);
    return { success: false, message: "errors.settings.delete_failed" };
  }
}

export async function saveEmployeesBatch(employees: EmployeeFormValues[]): Promise<{ success: boolean; message: string; }> {
  try {
    const result = await getEmployees();
    const existingEmployees = result.employees || [];
    const existingIds = new Set(existingEmployees.map((emp: Employee) => emp.employeeId));
    let currentMaxId = 0;

    existingEmployees.forEach((emp: Employee) => {
      const id = emp.employeeId;
      if (id && id.startsWith('EMP')) {
        const num = parseInt(id.substring(3), 10);
        if (!isNaN(num) && num > currentMaxId) {
          currentMaxId = num;
        }
      }
    });

    const employeeInputs: EmployeeInput[] = [];

    for (const employee of employees) {
      if (!employee.name) {
        throw new Error("validation.required^name");
      }

      let employeeId: string;
      if (employee.employeeId) {
        employeeId = employee.employeeId;
        if (existingIds.has(employeeId)) {
          // For batch import, we might just update existing records
          // For now, we'll throw an error to prevent accidental overwrites
          throw new Error(`actions.settings.employees.id_exists_batch^${employeeId}`);
        }
      } else {
        currentMaxId++;
        employeeId = `EMP${String(currentMaxId).padStart(4, '0')}`;
      }

      existingIds.add(employeeId);

      employeeInputs.push({
        employee_id: employeeId,
        name: employee.name || '',
        email: employee.email || undefined,
        location: employee.location || undefined,
        projects: employee.projects || [],
      });
    }

    // Use bulk upsert mutation
    const response = await graphqlQuery(INVENTORY_QUERIES.BULK_UPSERT_EMPLOYEES, {
      employees: employeeInputs
    });

    if (response.errors) {
      return { success: false, message: response.errors[0]?.message || 'GraphQL mutation failed' };
    }

    revalidatePath('/settings/employees');
    return { success: true, message: 'actions.settings.batch_save_success' };
  } catch (error: any) {
    console.error("Error in batch saving employees via GraphQL:", error);
    return { success: false, message: (error as Error).message || "errors.settings.batch_save_failed" };
  }
}