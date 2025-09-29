// Client-side database server that can read from Laravel backend or fall back to localStorage
class DatabaseClient {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
  }

  // Try to fetch from database first, fall back to localStorage
  async queryFromDatabase<T>(collection: string, filter?: any, sort?: (a: T, b: T) => number): Promise<T[]> {
    try {
      // First try to get from database
      const dbData = await this.fetchFromDatabase(collection);
      if (dbData && dbData.length > 0) {
        console.log(`Successfully fetched ${dbData.length} ${collection} from database`);
        return this.applyFilterAndSort(dbData, filter, sort);
      }
    } catch (error: any) {
      console.log(`Failed to fetch ${collection} from database, falling back to localStorage:`, error.message);
    }

    // Fall back to localStorage
    const localData = this.getFromLocalStorage(collection);
    return this.applyFilterAndSort(localData, filter, sort);
  }

  private async fetchFromDatabase(collection: string): Promise<any[]> {
    let endpoint = '';
    
    switch (collection) {
      case 'pcs':
        endpoint = '/api/assets?type=pc';
        break;
      case 'monitors':
        endpoint = '/api/assets?type=monitor';
        break;
      case 'phones':
        endpoint = '/api/assets?type=phone';
        break;
      case 'employees':
        endpoint = '/api/employees';
        break;
      case 'locations':
        endpoint = '/api/locations';
        break;
      case 'projects':
        endpoint = '/api/projects';
        break;
      case 'loans':
        endpoint = '/api/loans';
        break;
      default:
        throw new Error(`Unknown collection: ${collection}`);
    }

    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to match expected interfaces
    if (data && Array.isArray(data)) {
      return data.map(item => this.transformDatabaseItem(collection, item));
    }
    
    return data || [];
  }

  private transformDatabaseItem(collection: string, item: any): any {
    switch (collection) {
      case 'locations':
        return {
          id: item.id,
          name: item.name || '',
          address: item.address || '',
          city: item.city || '',
          state: item.state || '',
          country: item.country || '',
          postal_code: item.postal_code || '',
          phone: item.phone || '',
          email: item.email || '',
          manager: item.manager || '',
          status: item.status || 'active',
          visible: item.visible !== false,
          order: item.order || 0,
        };
      default:
        return item;
    }
  }

  private applyFilterAndSort<T>(data: T[], filter?: any, sort?: (a: T, b: T) => number): T[] {
    let result = [...data];
    
    if (filter) {
      result = result.filter(filter);
    }
    
    if (sort) {
      result.sort(sort);
    }
    
    return result;
  }

  // Legacy methods for compatibility
  async query<T>(collection: string, filter?: any, sort?: (a: T, b: T) => number): Promise<T[]> {
    return this.queryFromDatabase<T>(collection, filter, sort);
  }

  async add<T extends { id?: string }>(collection: string, data: T): Promise<T & { id: string }> {
    try {
      // Try to save to database first
      if (collection === 'locations') {
        console.log('🚀 Attempting to save location to database via GraphQL...');
        console.log('📡 API URL:', `${this.apiBaseUrl}/api/graphql`);
        console.log('📦 Data to send:', data);
        
        const response = await fetch(`${this.apiBaseUrl}/api/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: `
              mutation CreateLocation($location: LocationInput!) {
                createLocation(location: $location) {
                  id
                  name
                  visible
                  order
                  address
                  city
                  state
                  country
                  postal_code
                  phone
                  email
                  manager
                  status
                }
              }
            `,
            variables: {
              location: {
                ...data,
                // Provide default values for optional fields
                address: (data as any).address || '',
                city: (data as any).city || '',
                state: (data as any).state || '',
                country: (data as any).country || '',
                postal_code: (data as any).postal_code || '',
                phone: (data as any).phone || '',
                email: (data as any).email || '',
                manager: (data as any).manager || '',
                status: (data as any).status || 'active'
              }
            }
          })
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const result = await response.json();
          console.log('📡 Response data:', result);
          
          if (result.data?.createLocation) {
            console.log('✅ Location created successfully in database!');
            // Also update localStorage for immediate UI update
            const collectionData = this.getFromLocalStorage(collection);
            collectionData.push(result.data.createLocation);
            this.saveToLocalStorage(collection, collectionData);
            
            return result.data.createLocation;
          } else {
            console.log('❌ No createLocation data in response:', result);
          }
        } else {
          console.log('❌ Response not OK:', response.status, response.statusText);
          const errorText = await response.text();
          console.log('❌ Error response:', errorText);
        }
      }

      // Fallback to localStorage if database save fails
      const collectionData = this.getFromLocalStorage(collection);
      const newItem = { 
        ...data, 
        id: data.id || `temp_${Date.now()}`,
        // Provide default values for optional fields
        address: (data as any).address || '',
        city: (data as any).city || '',
        state: (data as any).state || '',
        country: (data as any).country || '',
        postal_code: (data as any).postal_code || '',
        phone: (data as any).phone || '',
        email: (data as any).email || '',
        manager: (data as any).manager || '',
        status: (data as any).status || 'active'
      };
      
      collectionData.push(newItem);
      this.saveToLocalStorage(collection, collectionData);
      
      return newItem as T & { id: string };
    } catch (error) {
      console.error('❌ Error saving to database, falling back to localStorage:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      // Fallback to localStorage
      const collectionData = this.getFromLocalStorage(collection);
      const newItem = { ...data, id: data.id || `temp_${Date.now()}` };
      
      collectionData.push(newItem);
      this.saveToLocalStorage(collection, collectionData);
      
      return newItem as T & { id: string };
    }
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    console.log('🔍 GET METHOD CALLED:', { collection, id });
    const collectionData = this.getFromLocalStorage(collection);
    console.log('📁 Collection data from localStorage:', collectionData);
    console.log('🔍 Looking for item with ID:', id);
    console.log('🔍 Available IDs:', collectionData.map((item: any) => ({ id: item.id, name: item.name })));
    const foundItem = collectionData.find(item => item.id === id);
    console.log('🔍 Found item:', foundItem);
    return foundItem || null;
  }

  // Simple update method for basic field changes (bypasses GraphQL complexity)
  async simpleUpdate<T>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    console.log('🔧 SIMPLE UPDATE METHOD CALLED:', { collection, id, data });
    
    try {
      // Get the existing data
      let existingItem = await this.get(collection, id);
      
      // If item not found by ID, try to find it by name (for locations)
      if (!existingItem && collection === 'locations') {
        console.log(`🔍 Location with ID ${id} not found, searching by name...`);
        const allLocations = this.getFromLocalStorage('locations');
        console.log('🔍 All locations in localStorage:', allLocations);
        
        // Try to find by name if we have name data
        if ((data as any).name) {
          const foundLocation = allLocations.find((loc: any) => loc.name === (data as any).name);
          if (foundLocation) {
            console.log(`✅ Found location by name: ${foundLocation.name} with ID: ${foundLocation.id}`);
            id = foundLocation.id;
            existingItem = foundLocation;
          }
        }
        
        // If still not found, try to find by index (for numeric IDs like "1", "2", "3")
        if (!existingItem && !isNaN(Number(id))) {
          const numericIndex = Number(id) - 1; // Convert "1" to index 0
          if (numericIndex >= 0 && numericIndex < allLocations.length) {
            const foundLocation = allLocations[numericIndex];
            console.log(`✅ Found location by index ${numericIndex}: ${foundLocation.name} with ID: ${foundLocation.id}`);
            id = foundLocation.id;
            existingItem = foundLocation;
          }
        }
      }
      
      if (!existingItem) {
        console.log('❌ Item not found for simple update:', id);
        console.log('🔍 Available items in collection:', this.getFromLocalStorage(collection));
        
        // For locations, try to create a new item if it doesn't exist
        if (collection === 'locations' && (data as any).name) {
          console.log('🆕 Creating new location since it was not found');
          const allLocations = this.getFromLocalStorage('locations');
          const newLocation = {
            id: `loc_${Date.now()}`,
            name: (data as any).name,
            order: allLocations.length,
            visible: (data as any).visible !== undefined ? (data as any).visible : true,
            address: '',
            city: '',
            state: '',
            country: '',
            postal_code: '',
            phone: '',
            email: '',
            manager: '',
            status: 'active'
          };
          
          allLocations.push(newLocation);
          this.saveToLocalStorage(collection, allLocations);
          console.log('✅ Created new location:', newLocation);
          return newLocation as T;
        }
        
        return null;
      }
      
      // Merge the update data with existing data
      const updatedItem = { ...existingItem, ...data } as T;
      
      // Update localStorage first for immediate UI response
      const collectionData = this.getFromLocalStorage(collection);
      const index = collectionData.findIndex((item: any) => item.id === id);
      
      if (index !== -1) {
        collectionData[index] = updatedItem;
        this.saveToLocalStorage(collection, collectionData);
        console.log('✅ localStorage update successful:', updatedItem);
        
        // Now also update the database via GraphQL for persistence
        if (collection === 'locations') {
          try {
            console.log('🚀 Attempting to sync with database via GraphQL...');
            const dbResult = await this.update(collection, id, data);
            if (dbResult) {
              console.log('✅ Database sync successful:', dbResult);
            } else {
              console.log('⚠️ Database sync failed, but localStorage update succeeded');
            }
          } catch (dbError) {
            console.log('⚠️ Database sync error, but localStorage update succeeded:', dbError);
          }
        }
        
        return updatedItem;
      } else {
        console.log('❌ Item not found in localStorage for simple update');
        return null;
      }
    } catch (error) {
      console.error('❌ Error in simple update:', error);
      return null;
    }
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    console.log('🔧 UPDATE METHOD CALLED:', { collection, id, data });
    
    try {
      // Try to update in database first
      if (collection === 'locations') {
        console.log('🚀 Attempting to update location in database via GraphQL...');
        console.log('📡 API URL:', `${this.apiBaseUrl}/api/graphql`);
        console.log('📦 Update data:', { id, data });
        
        // First, get the existing location data to preserve required fields
        console.log('🔍 Fetching existing location data...');
        const existingLocation = await this.get('locations', id);
        console.log('📋 Existing location data:', existingLocation);
        
        if (!existingLocation) {
          console.log('❌ Location not found for update:', id);
          console.log('🔍 Available locations in localStorage:', this.getFromLocalStorage(collection));
          return null;
        }
        
        // Merge the update data with existing data
        const mergedData = {
          ...existingLocation,
          ...data,
          // Ensure required fields are present
          name: (data as any).name || (existingLocation as any).name,
          // Provide default values for optional fields
          address: (data as any).address !== undefined ? (data as any).address : (existingLocation as any).address || '',
          city: (data as any).city !== undefined ? (data as any).city : (existingLocation as any).city || '',
          state: (data as any).state !== undefined ? (data as any).state : (existingLocation as any).state || '',
          country: (data as any).country !== undefined ? (data as any).country : (existingLocation as any).country || '',
          postal_code: (data as any).postal_code !== undefined ? (data as any).postal_code : (existingLocation as any).postal_code || '',
          phone: (data as any).phone !== undefined ? (data as any).phone : (existingLocation as any).phone || '',
          email: (data as any).email !== undefined ? (data as any).email : (existingLocation as any).email || '',
          manager: (data as any).manager !== undefined ? (data as any).manager : (existingLocation as any).manager || '',
          status: (data as any).status !== undefined ? (data as any).status : (existingLocation as any).status || 'active'
        };
        
        console.log('🔀 Merged data for GraphQL:', mergedData);
        
        const graphqlData = {
          query: `
            mutation UpdateLocation($id: ID!, $location: LocationInput!) {
              updateLocation(id: $id, location: $location) {
                id
                name
                visible
                order
                address
                city
                state
                country
                postal_code
                phone
                email
                manager
                status
              }
            }
          `,
          variables: {
            id,
            location: mergedData
          }
        };
        
        console.log('📤 GraphQL request data:', JSON.stringify(graphqlData, null, 2));
        
        try {
          const response = await fetch(`${this.apiBaseUrl}/api/graphql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(graphqlData)
          });

          console.log('📡 Response status:', response.status);
          console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
          
          if (response.ok) {
            const result = await response.json();
            console.log('📡 Response data:', result);
            
            if (result.data?.updateLocation) {
              console.log('✅ Location updated successfully in database!');
              // Also update localStorage for immediate UI update
              const collectionData = this.getFromLocalStorage(collection);
              const index = collectionData.findIndex((item: any) => item.id === id);
              
              if (index !== -1) {
                const updatedItem = { ...(collectionData[index] as any), ...result.data.updateLocation };
                collectionData[index] = updatedItem;
                this.saveToLocalStorage(collection, collectionData);
                console.log('💾 Updated localStorage with:', updatedItem);
                return updatedItem;
              } else {
                console.log('⚠️ Location not found in localStorage, but database update succeeded');
                return result.data.updateLocation;
              }
            } else {
              console.log('❌ No updateLocation data in response:', result);
              if (result.errors) {
                console.log('❌ GraphQL errors:', result.errors);
              }
              // Continue to localStorage fallback
            }
          } else {
            console.log('❌ Response not OK:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            // Continue to localStorage fallback
          }
        } catch (graphqlError) {
          console.log('❌ GraphQL request failed, falling back to localStorage:', graphqlError);
          // Continue to localStorage fallback
        }
      }

      // Fallback to localStorage if database update fails or is not available
      console.log('🔄 Falling back to localStorage update...');
      const collectionData = this.getFromLocalStorage(collection);
      const index = collectionData.findIndex((item: any) => item.id === id);
      
      if (index === -1) {
        console.log('❌ Location not found in localStorage for fallback');
        return null;
      }
      
      const updatedItem = { ...(collectionData[index] as any), ...data };
      collectionData[index] = updatedItem;
      this.saveToLocalStorage(collection, collectionData);
      
      console.log('✅ Fallback localStorage update successful:', updatedItem);
      return updatedItem;
    } catch (error) {
      console.error('❌ Error updating in database, falling back to localStorage:', error);
      
      // Fallback to localStorage
      const collectionData = this.getFromLocalStorage(collection);
      const index = collectionData.findIndex((item: any) => item.id === id);
      
      if (index === -1) return null;
      
      const updatedItem = { ...(collectionData[index] as any), ...data };
      collectionData[index] = updatedItem;
      this.saveToLocalStorage(collection, collectionData);
      
      return updatedItem;
    }
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const collectionData = this.getFromLocalStorage(collection);
    const index = collectionData.findIndex((item: any) => item.id === id);
    
    if (index === -1) return false;
    
    collectionData.splice(index, 1);
    this.saveToLocalStorage(collection, collectionData);
    
    return true;
  }

  // Add missing batchWrite method for lending actions
  async batchWrite(operations: Array<{ type: 'add' | 'update' | 'delete'; collection: string; data?: any; id?: string }>): Promise<void> {
    for (const operation of operations) {
      switch (operation.type) {
        case 'add':
          if (operation.data) {
            await this.add(operation.collection, operation.data);
          }
          break;
        case 'update':
          if (operation.id && operation.data) {
            await this.update(operation.collection, operation.id, operation.data);
          }
          break;
        case 'delete':
          if (operation.id) {
            await this.delete(operation.collection, operation.id);
          }
          break;
      }
    }
  }

  // Add missing getAll method for employee actions
  async getAll<T>(collection: string): Promise<T[]> {
    return this.queryFromDatabase<T>(collection);
  }

  // Initialize collections with seed data
  async initializeCollections(): Promise<void> {
    try {
      // Check if we're in the browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.log("Skipping database initialization during SSR");
        return;
      }

      // Check if collections are already initialized
      const collections = ['pcs', 'monitors', 'phones', 'projects', 'locations', 'employees'];
      
      for (const collectionName of collections) {
        const existingData = this.getFromLocalStorage(collectionName);
        console.log(`🔍 Checking ${collectionName}:`, existingData.length, 'items');
        
        if (existingData.length === 0) {
          // Initialize with seed data if collection is empty
          const seedData = await this.getSeedData(collectionName);
          this.saveToLocalStorage(collectionName, seedData);
          console.log(`✅ Initialized ${collectionName} with seed data:`, seedData.length, 'items');
        } else if (collectionName === 'locations') {
          // Special handling for locations - ensure they have the expected structure
          console.log(`🔍 Checking ${collectionName} structure...`);
          const firstLocation = existingData[0];
          console.log(`🔍 First location:`, firstLocation);
          
          // Check if locations have the expected structure (id, name, order, visible)
          if (!firstLocation || !firstLocation.hasOwnProperty('order') || !firstLocation.hasOwnProperty('visible')) {
            console.log(`⚠️ ${collectionName} missing expected structure, reinitializing...`);
            console.log(`🔍 Missing properties:`, {
              hasId: !!firstLocation?.id,
              hasName: !!firstLocation?.name,
              hasOrder: !!firstLocation?.order,
              hasVisible: !!firstLocation?.visible
            });
            const seedData = await this.getSeedData(collectionName);
            this.saveToLocalStorage(collectionName, seedData);
            console.log(`✅ Reinitialized ${collectionName} with seed data:`, seedData.length, 'items');
          } else {
            console.log(`✅ ${collectionName} already has correct structure:`, existingData.length, 'items');
            console.log(`🔍 Sample location:`, existingData[0]);
          }
        } else {
          console.log(`✅ ${collectionName} already initialized:`, existingData.length, 'items');
        }
      }
      
      console.log("Database initialization completed successfully!");
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }

  private async getSeedData(collectionName: string): Promise<any[]> {
    // Import seed data dynamically to avoid circular dependencies
    const { inventory, masterData } = await import('../data');
    
    switch (collectionName) {
      case 'pcs':
        return inventory.pcs || [];
      case 'monitors':
        return inventory.monitors || [];
      case 'phones':
        return inventory.smartphones || [];
      case 'projects':
        return masterData.projects.map((name, index) => ({
          id: String(index + 1), // Use numeric IDs as strings: "1", "2", "3"
          name,
          order: index,
          visible: true
        }));
      case 'locations':
        return masterData.locations.map((name, index) => ({
          id: String(index + 1), // Use numeric IDs as strings: "1", "2", "3"
          name,
          order: index,
          visible: true
        }));
      case 'employees':
        return masterData.employees.map((name, index) => ({
          id: `emp_${index + 1}`,
          name,
          employeeId: `EMP${String(index + 1).padStart(4, '0')}`,
          email: '',
          department: '',
          projects: []
        }));
      default:
        return [];
    }
  }

  // localStorage helper methods
  getFromLocalStorage(collection: string): any[] {
    try {
      // Check if we're in the browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return [];
      }
      const data = localStorage.getItem(`db_${collection}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from localStorage for ${collection}:`, error);
      return [];
    }
  }

  saveToLocalStorage(collection: string, data: any[]): void {
    try {
      // Check if we're in the browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      localStorage.setItem(`db_${collection}`, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to localStorage for ${collection}:`, error);
    }
  }
}

export const databaseClient = new DatabaseClient();