'use server';

import { revalidatePath } from 'next/cache';
import { localDBServer as LocalDB } from '@/lib/db';
import { masterData } from '@/lib/data';
import type { Employee } from '@/lib/schemas/settings';

export async function getEmployees(): Promise<{ employees: Employee[]; error: string | null }> {
  try {
    const employees = await LocalDB.query<Employee>(
      'employees',
      undefined,
      (a, b) => (a.name || '').localeCompare(b.name || '')
    );

    return { employees, error: null };
  } catch (e: any) {
    console.error("Error getting employees:", e);
    return { employees: [], error: "errors.database.connect_failed" };
  }
}

export async function saveEmployee(id: string | null, name: string): Promise<{ success: boolean; message: string; }> {
  try {
    if (id) {
      await LocalDB.update('employees', id, { name });
    } else {
      await LocalDB.add('employees', { name });
    }
    revalidatePath('/settings/employees');
    return { success: true, message: 'actions.settings.employees.save_success' };
  } catch (e: any) {
    console.error("Error saving employee:", e);
    return { success: false, message: 'errors.employees.save_failed' };
  }
}

export async function deleteEmployee(id: string): Promise<{ success: boolean; message: string; }> {
  try {
    const success = await LocalDB.delete('employees', id);

    if (!success) {
      return { success: false, message: 'errors.employees.not_found' };
    }

    revalidatePath('/settings/employees');
    return { success: true, message: 'actions.settings.employees.delete_success' };
  } catch (e: any) {
    console.error("Error deleting employee:", e);
    return { success: false, message: 'errors.employees.delete_failed' };
  }
}