'use server';

import { revalidatePath } from 'next/cache';
import { graphqlQuery, USER_QUERIES, USER_MUTATIONS, type UserInput } from '@/lib/graphql-client';
import type { DatabaseUser } from '@/lib/schemas/settings';

export async function getSystemUsers(): Promise<{ users: DatabaseUser[]; error: string | null }> {
  try {
    const response = await graphqlQuery(USER_QUERIES.GET_USERS);

    if (response.errors) {
      console.error("GraphQL errors:", response.errors);
      return { users: [], error: "errors.database.connect_failed" };
    }

    const users = response.data?.users?.data || [];
    return { users, error: null };
  } catch (e: any) {
    console.error("Error getting system users:", e);
    return { users: [], error: "errors.database.connect_failed" };
  }
}

export async function createSystemUser(userData: { name: string; email: string; password: string }): Promise<{ success: boolean; message: string; }> {
  try {
    const response = await graphqlQuery(USER_MUTATIONS.CREATE_USER, {
      user: userData
    });

    if (response.errors) {
      console.error("GraphQL errors:", response.errors);
      return { success: false, message: "errors.settings.save_failed" };
    }

    revalidatePath('/settings/system-users');
    return { success: true, message: 'actions.settings.save_success' };
  } catch (e: any) {
    console.error("Error creating system user:", e);
    return { success: false, message: "errors.settings.save_failed" };
  }
}

export async function updateSystemUser(id: string, userData: Partial<UserInput>): Promise<{ success: boolean; message: string; }> {
  try {
    const response = await graphqlQuery(USER_MUTATIONS.UPDATE_USER, {
      id,
      user: userData
    });

    if (response.errors) {
      console.error("GraphQL errors:", response.errors);
      return { success: false, message: "errors.settings.save_failed" };
    }

    revalidatePath('/settings/system-users');
    return { success: true, message: 'actions.settings.save_success' };
  } catch (e: any) {
    console.error("Error updating system user:", e);
    return { success: false, message: "errors.settings.save_failed" };
  }
}

export async function deleteSystemUser(id: string): Promise<{ success: boolean; message: string; }> {
  try {
    const response = await graphqlQuery(USER_MUTATIONS.DELETE_USER, { id });

    if (response.errors) {
      console.error("GraphQL errors:", response.errors);
      return { success: false, message: "errors.users.delete_failed" };
    }

    if (!response.data?.deleteUser) {
      return { success: false, message: "errors.users.not_found" };
    }

    revalidatePath('/settings/system-users');
    return { success: true, message: 'actions.settings.delete_success' };
  } catch (e: any) {
    console.error("Error deleting system user:", e);
    return { success: false, message: "errors.settings.delete_failed" };
  }
}