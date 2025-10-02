import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Server-side database implementation
class LocalDBServer {
  private dbPath: string;
  private collections: Map<string, any[]> = new Map();

  constructor() {
    this.dbPath = path.join(process.cwd(), 'src', 'lib', 'db', 'data');
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

  async add<T extends { id?: string }>(collection: string, data: T): Promise<T & { id: string }> {
    const collectionData = this.collections.get(collection) || [];
    const newItem = { ...data, id: data.id || uuidv4() };
    
    collectionData.push(newItem);
    this.collections.set(collection, collectionData);
    
    // Persist to file
    await this.persistCollection(collection);
    
    return newItem as T & { id: string };
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    const collectionData = this.collections.get(collection) || [];
    return collectionData.find(item => item.id === id) || null;
  }

  async update<T extends { id: string }>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    const collectionData = this.collections.get(collection) || [];
    const index = collectionData.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    const updatedItem = { ...collectionData[index], ...data, id };
    collectionData[index] = updatedItem;
    this.collections.set(collection, collectionData);
    
    // Persist to file
    await this.persistCollection(collection);
    
    return updatedItem as T;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const collectionData = this.collections.get(collection) || [];
    const index = collectionData.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    collectionData.splice(index, 1);
    this.collections.set(collection, collectionData);
    
    // Persist to file
    await this.persistCollection(collection);
    
    return true;
  }

  async query<T>(
    collection: string,
    where?: (item: T) => boolean,
    orderBy?: (a: T, b: T) => number
  ): Promise<T[]> {
    let collectionData = this.collections.get(collection) || [];
    
    // Apply where filter if provided
    if (where) {
      collectionData = collectionData.filter(where);
    }
    
    // Apply ordering if provided
    if (orderBy) {
      collectionData = [...collectionData].sort(orderBy);
    }
    
    return collectionData;
  }

  async batchWrite(operations: Array<{ type: 'add' | 'update' | 'delete', collection: string, data?: any, id?: string }>): Promise<void> {
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

  private async persistCollection(collection: string): Promise<void> {
    const filePath = path.join(this.dbPath, `${collection}.json`);
    const data = this.collections.get(collection) || [];
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }
}

// Create singleton instance
const localDBServer = new LocalDBServer();

// Export for server-side use only
export { localDBServer };

// Client-safe interface (no file operations)
export interface LocalDBClient {
  // This interface is for client-side type safety only
  // All actual operations happen through server actions
}

// Export a mock client interface for type safety
export const LocalDB: LocalDBClient = {} as LocalDBClient;
