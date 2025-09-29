import fs from 'fs/promises';
import path from 'path';

// Database server that can read from Laravel backend or fall back to local JSON
class DatabaseServer {
  private dbPath: string;
  private collections: Map<string, any[]> = new Map();
  private apiBaseUrl: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'src', 'lib', 'db', 'data');
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
  }

  async initializeCollections(): Promise<void> {
    try {
      // Ensure data directory exists
      await fs.mkdir(this.dbPath, { recursive: true });

      // Initialize collections with seed data if they don't exist
      const collections = ['pcs', 'monitors', 'phones', 'projects', 'locations', 'employees'];
      
      for (const collectionName of collections) {
        const filePath = path.join(this.dbPath, `${collectionName}.json`);
        
        try {
          const data = await fs.readFile(filePath, 'utf-8');
          this.collections.set(collectionName, JSON.parse(data));
        } catch (error) {
          // File doesn't exist or is empty, seed with initial data
          const seedData = await this.getSeedData(collectionName);
          this.collections.set(collectionName, seedData);
          await fs.writeFile(filePath, JSON.stringify(seedData, null, 2));
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
          id: `proj_${index + 1}`,
          name,
          order: index,
          visible: true
        }));
      case 'locations':
        return masterData.locations.map((name, index) => ({
          id: `loc_${index + 1}`,
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

  // Try to fetch from database first, fall back to local JSON
  async queryFromDatabase<T>(collection: string, filter?: any, sort?: (a: T, b: T) => number): Promise<T[]> {
    try {
      // First try to get from database
      const dbData = await this.fetchFromDatabase(collection);
      if (dbData && dbData.length > 0) {
        console.log(`Successfully fetched ${dbData.length} ${collection} from database`);
        return this.applyFilterAndSort(dbData, filter, sort);
      }
    } catch (error: any) {
      console.log(`Failed to fetch ${collection} from database, falling back to local data:`, error.message);
    }

    // Fall back to local JSON data
    const localData = this.collections.get(collection) || [];
    return this.applyFilterAndSort(localData, filter, sort);
  }

  private async fetchFromDatabase(collection: string): Promise<any[]> {
    let endpoint = '';
    
    switch (collection) {
      case 'pcs':
        endpoint = '/api/assets?type=pc';
        break;
      case 'monitors':
        endpoint = '/assets?type=monitor';
        break;
      case 'phones':
        endpoint = '/assets?type=phone';
        break;
      case 'employees':
        endpoint = '/employees';
        break;
      case 'locations':
        endpoint = '/locations';
        break;
      case 'projects':
        endpoint = '/projects';
        break;
      case 'loans':
        endpoint = '/loans';
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
    return this.queryFromDatabase(collection, filter, sort);
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
              location: data
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
            // Also update local collection for immediate UI update
            const collectionData = this.collections.get(collection) || [];
            collectionData.push(result.data.createLocation);
            this.collections.set(collection, collectionData);
            await this.persistCollection(collection);
            
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

      // Fallback to local storage if database save fails
      const collectionData = this.collections.get(collection) || [];
      const newItem = { ...data, id: data.id || `temp_${Date.now()}` };
      
      collectionData.push(newItem);
      this.collections.set(collection, collectionData);
      
      // Persist to file
      await this.persistCollection(collection);
      
      return newItem as T & { id: string };
    } catch (error) {
      console.error('❌ Error saving to database, falling back to local storage:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      // Fallback to local storage
      const collectionData = this.collections.get(collection) || [];
      const newItem = { ...data, id: data.id || `temp_${Date.now()}` };
      
      collectionData.push(newItem);
      this.collections.set(collection, collectionData);
      
      // Persist to file
      await this.persistCollection(collection);
      
      return newItem as T & { id: string };
    }
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    const collectionData = this.collections.get(collection) || [];
    return collectionData.find(item => item.id === id) || null;
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    const collectionData = this.collections.get(collection) || [];
    const index = collectionData.findIndex((item: any) => item.id === id);
    
    if (index === -1) return null;
    
    const updatedItem = { ...(collectionData[index] as any), ...data };
    collectionData[index] = updatedItem;
    this.collections.set(collection, collectionData);
    
    // Persist to file
    await this.persistCollection(collection);
    
    return updatedItem;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const collectionData = this.collections.get(collection) || [];
    const index = collectionData.findIndex((item: any) => item.id === id);
    
    if (index === -1) return false;
    
    collectionData.splice(index, 1);
    this.collections.set(collection, collectionData);
    
    // Persist to file
    await this.persistCollection(collection);
    
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

  private async persistCollection(collection: string): Promise<void> {
    const filePath = path.join(this.dbPath, `${collection}.json`);
    const data = this.collections.get(collection) || [];
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }
}

export const databaseServer = new DatabaseServer();
