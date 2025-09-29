"use server"

import { graphqlQuery, INVENTORY_QUERIES } from '@/lib/graphql-client';

export interface Location {
  id: string;
  name: string;
  order: number;
  visible?: boolean;
}

export async function getLocations(): Promise<{ locations: Location[]; error: boolean }> {
  try {
    // Use GraphQL to fetch locations from your Laravel backend
    const response = await graphqlQuery(`
      query GetLocations {
        locations {
          id
          name
          visible
          order
        }
      }
    `);
    
    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { locations: [], error: true };
    }

    if (!response.data?.locations) {
      console.error('No locations data received from GraphQL');
      return { locations: [], error: true };
    }

    // Transform GraphQL data to match Location interface
    const locations: Location[] = response.data.locations.map((location: any) => ({
      id: location.id,
      name: location.name,
      order: location.order || 0,
      visible: location.visible !== false
    }));

    return { locations, error: false };
  } catch (e: any) {
    console.error("Error getting locations:", e);
    return { locations: [], error: true };
  }
}

export async function saveLocation(id: string | null, values: Partial<Omit<Location, 'id'>>): Promise<{ success: boolean; message: string; }> {
  try {
    if (id) {
      // Update existing location via GraphQL
      const response = await graphqlQuery(INVENTORY_QUERIES.UPDATE_LOCATION, {
        id,
        location: {
          name: values.name,
          visible: values.visible,
          order: values.order
        }
      });

      if (response.errors) {
        console.error('GraphQL errors:', response.errors);
        return { success: false, message: "errors.settings.update_failed" };
      }

      if (!response.data?.updateLocation) {
        return { success: false, message: "errors.settings.update_failed" };
      }

      return { success: true, message: 'actions.settings.save_success' };
    } else {
      // Create new location via GraphQL
      const response = await graphqlQuery(`
        mutation CreateLocation($location: LocationInput!) {
          createLocation(location: $location) {
            id
            name
            visible
            order
          }
        }
      `, {
        location: {
          name: values.name!,
          visible: values.visible !== false,
          order: values.order || 0
        }
      });

      if (response.errors) {
        console.error('GraphQL errors:', response.errors);
        return { success: false, message: "errors.settings.save_failed" };
      }

      if (!response.data?.createLocation) {
        return { success: false, message: "errors.settings.save_failed" };
      }

      return { success: true, message: 'actions.settings.save_success' };
    }
  } catch (e: any) {
    console.error("Error saving location:", e);
    return { success: false, message: "errors.settings.save_failed" };
  }
}

export async function updateLocationOrder(locations: Pick<Location, 'id' | 'order'>[]): Promise<{ success: boolean; message: string; }> {
  try {
    // Update each location's order via GraphQL
    for (const location of locations) {
      const response = await graphqlQuery(INVENTORY_QUERIES.UPDATE_LOCATION, {
        id: location.id,
        location: {
          order: location.order
        }
      });

      if (response.errors) {
        console.error(`GraphQL errors updating location ${location.id}:`, response.errors);
        return { success: false, message: "errors.settings.save_failed" };
      }
    }

    return { success: true, message: 'actions.settings.order_updated' };
  } catch (e: any) {
    console.error("Error updating location order:", e);
    return { success: false, message: "errors.settings.save_failed" };
  }
}

export async function deleteLocation(id: string): Promise<{ success: boolean; message: string; }> {
  try {
    const response = await graphqlQuery(`
      mutation DeleteLocation($id: ID!) {
        deleteLocation(id: $id) {
          id
        }
      }
    `, { id });

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      return { success: false, message: "errors.settings.delete_failed" };
    }

    if (!response.data?.deleteLocation) {
      return { success: false, message: "errors.settings.location_not_found" };
    }

    return { success: true, message: 'actions.settings.delete_success' };
  } catch (e: any) {
    console.error("Error deleting location:", e);
    return { success: false, message: "errors.settings.delete_failed" };
  }
}

export async function saveLocationsBatch(locationNames: string[]): Promise<{ success: boolean; message: string; }> {
  try {
    // Get existing locations to check for duplicates
    const existingLocations = await getLocations();
    if (existingLocations.error) {
      return { success: false, message: "errors.settings.save_failed" };
    }

    const existingNames = new Set(existingLocations.locations.map(loc => loc.name));
    const newLocations = locationNames.filter(name => !existingNames.has(name) && name.trim() !== '');

    if (newLocations.length === 0) {
      return { success: true, message: 'actions.settings.locations.no_new_locations' };
    }

    // Create new locations via GraphQL
    for (let i = 0; i < newLocations.length; i++) {
      const response = await graphqlQuery(`
        mutation CreateLocation($location: LocationInput!) {
          createLocation(location: $location) {
            id
            name
            visible
            order
          }
        }
      `, {
        location: {
          name: newLocations[i],
          visible: true,
          order: existingLocations.locations.length + i
        }
      });

      if (response.errors) {
        console.error(`GraphQL errors creating location ${newLocations[i]}:`, response.errors);
        return { success: false, message: "errors.settings.save_failed" };
      }
    }

    return { success: true, message: 'actions.settings.locations.batch_saved' };
  } catch (e: any) {
    console.error("Error saving locations batch:", e);
    return { success: false, message: "errors.settings.save_failed" };
  }
}

export async function saveLocationsChanges(changes: Array<{ id: string; updates: Partial<Location> }>): Promise<{ success: boolean; message: string; }> {
  try {
    if (changes.length === 0) {
      return { success: true, message: 'actions.settings.no_changes' };
    }

    // Get all locations to ensure we have the correct names
    const allLocations = await getLocations();
    if (allLocations.error) {
      return { success: false, message: "errors.settings.save_failed" };
    }

    // Prepare updates for bulk processing
    const updates = changes
      .filter(change => change.updates.visible !== undefined || change.updates.order !== undefined)
      .map(change => {
        const location = allLocations.locations.find(loc => loc.id === change.id);
        if (!location) {
          console.error(`❌ Could not find location ${change.id} in locations data`);
          return null;
        }

        return {
          id: change.id,
          name: location.name,
          visible: change.updates.visible !== undefined ? change.updates.visible : location.visible,
          order: change.updates.order !== undefined ? change.updates.order : location.order
        };
      })
      .filter((update): update is { id: string; visible: boolean; name: string; order: number } => update !== null);

    if (updates.length > 0) {
      const dbResult = await bulkUpdateLocationChanges(updates);
      return dbResult;
    } else {
      return { success: false, message: 'No valid updates to process' };
    }
  } catch (e: any) {
    console.error("Error saving location changes:", e);
    return { success: false, message: "errors.settings.save_failed" };
  }
}

export async function bulkUpdateLocationVisibility(updates: Array<{ id: string; visible: boolean; name: string }>): Promise<{ success: boolean; message: string; }> {
  try {
    // Update each location's visibility individually via GraphQL
    for (const update of updates) {
      try {
        const response = await graphqlQuery(INVENTORY_QUERIES.UPDATE_LOCATION, {
          id: update.id,
          location: {
            name: update.name,
            visible: update.visible
          }
        });

        if (response.errors) {
          // Try upsert as fallback
          const upsertResponse = await graphqlQuery(INVENTORY_QUERIES.UPSERT_LOCATION, {
            location: {
              id: update.id,
              name: update.name,
              visible: update.visible
            }
          });

          if (upsertResponse.errors) {
            return { success: false, message: `Failed to update location ${update.name}: ${upsertResponse.errors[0]?.message || 'Unknown error'}` };
          }

          if (!upsertResponse.data?.upsertLocation) {
            return { success: false, message: `Failed to update location ${update.name}: No response data` };
          }
        } else {
          if (!response.data?.updateLocation) {
            return { success: false, message: `Failed to update location ${update.name}: No response data` };
          }
        }
      } catch (updateError) {
        console.error(`❌ Error updating location ${update.id}:`, updateError);
        return { success: false, message: `Failed to update location ${update.name}: ${updateError instanceof Error ? updateError.message : 'Unknown error'}` };
      }
    }

    return { success: true, message: 'actions.settings.changes_saved' };
  } catch (error: any) {
    console.error('❌ Error in bulk location visibility update:', error);
    return { success: false, message: error.message || "errors.settings.save_failed" };
  }
}

export async function bulkUpdateLocationChanges(updates: Array<{ id: string; visible: boolean; name: string; order: number }>): Promise<{ success: boolean; message: string; }> {
  try {
    // Update each location individually via GraphQL
    for (const update of updates) {
      try {
        const response = await graphqlQuery(INVENTORY_QUERIES.UPDATE_LOCATION, {
          id: update.id,
          location: {
            name: update.name,
            visible: update.visible,
            order: update.order
          }
        });

        if (response.errors) {
          // Try upsert as fallback
          const upsertResponse = await graphqlQuery(INVENTORY_QUERIES.UPSERT_LOCATION, {
            location: {
              id: update.id,
              name: update.name,
              visible: update.visible,
              order: update.order
            }
          });

          if (upsertResponse.errors) {
            return { success: false, message: `Failed to update location ${update.name}: ${upsertResponse.errors[0]?.message || 'Unknown error'}` };
          }

          if (!upsertResponse.data?.upsertLocation) {
            return { success: false, message: `Failed to update location ${update.name}: No response data` };
          }
        } else {
          if (!response.data?.updateLocation) {
            return { success: false, message: `Failed to update location ${update.name}: No response data` };
          }
        }
      } catch (updateError) {
        console.error(`❌ Error updating location ${update.id}:`, updateError);
        return { success: false, message: `Failed to update location ${update.name}: ${updateError instanceof Error ? updateError.message : 'Unknown error'}` };
      }
    }

    return { success: true, message: 'actions.settings.changes_saved' };
  } catch (error: any) {
    console.error('❌ Error in bulk location changes update:', error);
    return { success: false, message: error.message || "errors.settings.save_failed" };
  }
}