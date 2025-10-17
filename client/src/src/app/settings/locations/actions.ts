"use server"

import { graphqlQuery } from '@/lib/graphql-client';

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
          order: i
        }
      });

      if (response.errors) {
        console.error('GraphQL errors:', response.errors);
        return { success: false, message: "errors.settings.save_failed" };
      }
    }

    return { success: true, message: 'actions.settings.locations.batch_save_success' };
  } catch (e: any) {
    console.error("Error saving locations batch:", e);
    return { success: false, message: "errors.settings.save_failed" };
  }
}